'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { DashboardLayout } from '@/components/DashboardLayout';
import { MoreVertical, Loader2, ArrowUpDown, X } from 'lucide-react';
import { apiClient, BASE_URL } from '@/lib/api/client';

const getFullImageUrl = (imagePath: string | null | undefined): string | undefined => {
  if (!imagePath) return undefined;
  if (imagePath.startsWith('http')) return imagePath;
  if (imagePath.startsWith('/images/') || imagePath.startsWith('/documents/')) return imagePath;
  return `${BASE_URL}${imagePath}`;
};

export default function PortfolioPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState<'investments' | 'fundInfo' | 'oldInvestments'>(
    tabParam === 'fundInfo' ? 'fundInfo' : tabParam === 'oldInvestments' ? 'oldInvestments' : 'investments'
  );

  useEffect(() => {
    if (tabParam === 'fundInfo') {
      setActiveTab('fundInfo');
    } else if (tabParam === 'investments') {
      setActiveTab('investments');
    } else if (tabParam === 'oldInvestments') {
      setActiveTab('oldInvestments');
    }
  }, [tabParam]);

  const [openActionMenuId, setOpenActionMenuId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [investments, setInvestments] = useState<any[]>([]);
  const [redemptions, setRedemptions] = useState<any[]>([]);
  const [funds, setFunds] = useState<any[]>([]);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  // Old Investments States
  const [oldInvestments, setOldInvestments] = useState<any[]>([]);
  const [selectedOldInvestment, setSelectedOldInvestment] = useState<any | null>(null);
  const [showOldInvestmentModal, setShowOldInvestmentModal] = useState(false);

  useEffect(() => {
    setCurrentPage(1);
  }, [sortConfig]);

  const [stats, setStats] = useState({
    totalInvested: 0,
    totalUnits: 0,
    currentNav: 0,
    currentValue: 0,
  });

  const oldStats = useMemo(() => {
    let totalInvested = 0;
    const uniqueFunds = new Set<string>();
    let totalShares = 0;
    let totalDistributions = 0;

    oldInvestments.forEach(inv => {
      const val = parseFloat((inv.investmentAmount || '').replace(/[^0-9.-]/g, ''));
      if (!isNaN(val)) totalInvested += val;

      if (inv.projectName) uniqueFunds.add(inv.projectName);

      const sh = parseFloat(inv.shares || '0');
      if (!isNaN(sh)) totalShares += sh;

      if (inv.distributions && Array.isArray(inv.distributions)) {
        inv.distributions.forEach((d: any) => {
          const dVal = parseFloat((d.returnOfCapital || '').replace(/[^0-9.-]/g, ''));
          if (!isNaN(dVal)) totalDistributions += dVal;
        });
      }
    });

    return {
      totalInvested,
      fundCount: uniqueFunds.size,
      totalShares,
      totalDistributions
    };
  }, [oldInvestments]);

  useEffect(() => {
    fetchData();
  }, []);

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        timeZone: 'UTC'
      });
    } catch {
      return dateString;
    }
  };

  const getInitials = (name: string) => {
    if (!name) return '';
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [investmentsData, navSummary, fundsData, redemptionsData, oldInvestmentsData] = await Promise.all([
        apiClient.getMyInvestments(),
        apiClient.getNavSummary(),
        apiClient.getFunds(),
        apiClient.getMyRedemptions(),
        apiClient.getMyOldInvestments().catch(err => {
          console.warn('⚠️ Failed to fetch old investments:', err);
          return [];
        })
      ]);

      setInvestments(investmentsData);
      setRedemptions(redemptionsData);
      setOldInvestments(oldInvestmentsData || []);

      const activeFunds = Array.isArray(fundsData)
        ? fundsData.filter((fund: any) => fund.status?.toLowerCase() !== 'draft' && fund.status?.toLowerCase() !== 'closed')
        : [];
      setFunds(activeFunds);

      const totalInvested = investmentsData
        .filter((inv: any) => inv.is_reconciled)
        .reduce((sum: number, inv: any) => sum + parseFloat(inv.investment_amount), 0);
      const totalUnits = investmentsData
        .filter((inv: any) => inv.is_reconciled)
        .reduce((sum: number, inv: any) => sum + parseFloat(inv.estimated_units), 0);

      const totalRedeemedUnits = redemptionsData
        .filter((r: any) => r.is_reconciled)
        .reduce((sum: number, r: any) => sum + parseFloat(r.units || 0), 0);

      const totalRedeemedValue = redemptionsData
        .filter((r: any) => r.is_reconciled)
        .reduce((sum: number, r: any) => sum + parseFloat(r.amount || 0), 0);

      const netUnits = Math.max(0, totalUnits - totalRedeemedUnits);

      setStats({
        totalInvested: totalInvested - totalRedeemedValue, // Net invested
        totalUnits: netUnits,
        currentNav: navSummary.currentNav,
        currentValue: netUnits * navSummary.currentNav,
      });
    } catch (error) {
      console.error('Error fetching portfolio data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (openActionMenuId === null) return;

    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest('[data-portfolio-action-menu="true"]')) return;
      setOpenActionMenuId(null);
    };

    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, [openActionMenuId]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(val);
  };

  const sortedInvestments = useMemo(() => {
    let sortableItems = [...investments].map(inv => {
      const units = parseFloat(inv.estimated_units || '0');
      const currentNav = stats.currentNav || 0;
      const currentValue = parseFloat(inv.revised_amount || (units * currentNav));
      const costBasis = parseFloat(inv.investment_amount || '0');
      const gainLossValue = currentValue - costBasis;
      return {
        ...inv,
        units,
        currentNav,
        currentValue,
        costBasis,
        gainLossValue,
        statusValue: inv.status || 'Pending'
      };
    });

    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];

        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [investments, sortConfig, stats.currentNav]);

  const requestSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-10 w-10 text-[#1F3B6E] animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 font-helvetica text-[#1F1F1F]">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-goudy text-2xl">Portfolio</h1>
            <p className="mt-2 text-sm text-[#8E8E93]">
              View your current positions, unit balances, NAV, and performance across all your accounts.
            </p>
          </div>
          {/* <button className="inline-flex items-center gap-2 bg-gradient-to-r from-[#FFC63F] to-[#F1DD58] px-5 py-2 rounded-full text-sm font-medium shadow-md">
            Invest Now
          </button> */}
        </div>

        {/* Tabs + summary card */}
        <div className="rounded-2xl bg-white px-8 pb-8 pt-6">
          <div className="flex gap-8 text-sm">
            <button
              type="button"
              onClick={() => setActiveTab('investments')}
              className={`pb-3 font-medium relative ${activeTab === 'investments' ? 'text-[#1F3B6E]' : 'text-[#8E8E93]'
                }`}
            >
              Investments
              {activeTab === 'investments' && (
                <span className="absolute bottom-0 left-1/2 h-[2px] w-[38px] -translate-x-1/2 bg-[#FFC63F]" />
              )}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('fundInfo')}
              className={`pb-3 font-medium relative ${activeTab === 'fundInfo' ? 'text-[#1F3B6E]' : 'text-[#8E8E93]'
                }`}
            >
              Fund Info
              {activeTab === 'fundInfo' && (
                <span className="absolute bottom-0 left-1/2 h-[2px] w-[38px] -translate-x-1/2 bg-[#FFC63F]" />
              )}
            </button>
            {oldInvestments && oldInvestments.length > 0 && (
              <button
                type="button"
                onClick={() => setActiveTab('oldInvestments')}
                className={`pb-3 font-medium relative ${activeTab === 'oldInvestments' ? 'text-[#1F3B6E]' : 'text-[#8E8E93]'
                  }`}
              >
                Previous Platform Investments
                {activeTab === 'oldInvestments' && (
                  <span className="absolute bottom-0 left-1/2 h-[2px] w-[38px] -translate-x-1/2 bg-[#FFC63F]" />
                )}
              </button>
            )}
          </div>

          {activeTab === 'investments' && (
            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-xl border border-[#F2F2F2] px-6 py-5">
                <p className="text-xs font-medium uppercase tracking-wide text-[#A0A0A0]">
                  Total Invested
                </p>
                <p className="mt-3 text-2xl font-semibold text-[#1F1F1F]">{formatCurrency(stats.totalInvested)}</p>
              </div>
              <div className="rounded-xl border border-[#F2F2F2] px-6 py-5">
                <p className="text-xs font-medium uppercase tracking-wide text-[#A0A0A0]">
                  Current Value
                </p>
                <p className="mt-3 text-2xl font-semibold text-[#1F1F1F]">{formatCurrency(stats.currentValue)}</p>
                {(() => {
                  const gainLoss = stats.currentValue - stats.totalInvested;
                  const isPositive = gainLoss >= 0;
                  return (
                    <p className={`mt-2 text-xs font-medium ${isPositive ? 'text-[#2BB673]' : 'text-[#E04343]'}`}>
                      {isPositive ? '+' : ''}{formatCurrency(gainLoss)}
                    </p>
                  );
                })()}
              </div>
              <div className="rounded-xl border border-[#F2F2F2] px-6 py-5">
                <p className="text-xs font-medium uppercase tracking-wide text-[#A0A0A0]">
                  Total Units
                </p>
                <p className="mt-3 text-2xl font-semibold text-[#1F1F1F]">{stats.totalUnits.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}</p>
              </div>
              <div className="rounded-xl border border-[#F2F2F2] px-6 py-5">
                <p className="text-xs font-medium uppercase tracking-wide text-[#A0A0A0]">
                  YTD Return
                </p>
                {(() => {
                  const currentValue = stats.currentValue;
                  const totalInvested = stats.totalInvested;
                  const ytdReturn = totalInvested > 0 ? (currentValue - totalInvested) / totalInvested : 0;
                  const isPositive = ytdReturn >= 0;
                  return (
                    <p className={`mt-3 text-2xl font-semibold ${isPositive ? 'text-[#2BB673]' : 'text-[#E04343]'}`}>
                      {isPositive ? '+' : ''}{(ytdReturn * 100).toFixed(1)}%
                    </p>
                  );
                })()}
              </div>
            </div>
          )}

          {activeTab === 'oldInvestments' && (
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="rounded-xl border border-[#F2F2F2] px-6 py-5">
                <p className="text-xs font-medium uppercase tracking-wide text-[#A0A0A0]">
                  Total Legacy Invested
                </p>
                <p className="mt-3 text-2xl font-semibold text-[#1F1F1F]">{formatCurrency(oldStats.totalInvested)}</p>
              </div>
              <div className="rounded-xl border border-[#F2F2F2] px-6 py-5">
                <p className="text-xs font-medium uppercase tracking-wide text-[#A0A0A0]">
                  Total Legacy Distributions
                </p>
                <p className="mt-3 text-2xl font-semibold text-[#2BB673]">{formatCurrency(oldStats.totalDistributions)}</p>
              </div>
              <div className="rounded-xl border border-[#F2F2F2] px-6 py-5">
                <p className="text-xs font-medium uppercase tracking-wide text-[#A0A0A0]">
                  Legacy Funds
                </p>
                <p className="mt-3 text-2xl font-semibold text-[#1F1F1F]">{oldStats.fundCount}</p>
              </div>
              <div className="rounded-xl border border-[#F2F2F2] px-6 py-5">
                <p className="text-xs font-medium uppercase tracking-wide text-[#A0A0A0]">
                  Total Legacy Shares
                </p>
                <p className="mt-3 text-2xl font-semibold text-[#1F1F1F]">
                  {oldStats.totalShares.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 4 })}
                </p>
              </div>
            </div>
          )}

          {activeTab === 'fundInfo' && (
            <div className="mt-8 grid gap-6 grid-cols-1 lg:grid-cols-1 xl:grid-cols-2">
              {funds.map((fund) => (
                <Link
                  key={fund.id}
                  href={`/dashboard/funds/${fund.id}?from=portfolio`}
                  className="group flex flex-col sm:flex-row items-center rounded-2xl bg-[#F7F8FA] p-5 sm:p-6 transition hover:bg-[#F1F2F5] hover:shadow-[0_10px_30px_rgba(0,0,0,0.04)] duration-300"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center gap-6 w-full">
                    <div className="flex-shrink-0 w-full sm:w-56 h-40 sm:h-32 bg-white rounded-xl overflow-hidden border border-[#E5E5EA] flex items-center justify-center shadow-sm">
                      <img
                        src={getFullImageUrl(fund.image) || "/images/strive_funds.jpg"}
                        alt={fund.name}
                        className="w-full h-full object-contain p-2"
                      />
                    </div>
                    <div className="flex-grow py-2 sm:py-0">
                      <h3 className="font-goudy text-xl sm:text-2xl text-[#1F3B6E] leading-tight">{fund.name}</h3>
                      <div className="mt-3 flex items-center gap-2 text-sm font-medium text-[#8E8E93]">
                        <span>View Fund Details</span>
                        <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {activeTab === 'investments' && (
          <div className="space-y-6">
            {/* Table */}
            <div className="rounded-2xl border border-[#F2F2F2] bg-white px-6 pb-6 pt-4">
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="border-b border-gray-100 text-xs font-semibold text-[#8E8E93]">
                    <tr>
                      <th className="px-4 py-3 cursor-pointer select-none group whitespace-nowrap" onClick={() => requestSort('fund_name')}>
                        <div className="flex items-center gap-1">
                          Fund Name
                          <ArrowUpDown className={`h-3 w-3 transition-opacity ${sortConfig?.key === 'fund_name' ? 'opacity-100' : 'opacity-50 group-hover:opacity-100'}`} />
                        </div>
                      </th>
                      <th className="px-4 py-3 cursor-pointer select-none group whitespace-nowrap" onClick={() => requestSort('account_type')}>
                        <div className="flex items-center gap-1">
                          Account Type
                          <ArrowUpDown className={`h-3 w-3 transition-opacity ${sortConfig?.key === 'account_type' ? 'opacity-100' : 'opacity-50 group-hover:opacity-100'}`} />
                        </div>
                      </th>
                      <th className="px-4 py-3 cursor-pointer select-none group whitespace-nowrap" onClick={() => requestSort('units')}>
                        <div className="flex items-center justify-end gap-1">
                          Units
                          <ArrowUpDown className={`h-3 w-3 transition-opacity ${sortConfig?.key === 'units' ? 'opacity-100' : 'opacity-50 group-hover:opacity-100'}`} />
                        </div>
                      </th>
                      <th className="px-4 py-3 cursor-pointer select-none group whitespace-nowrap" onClick={() => requestSort('currentNav')}>
                        <div className="flex items-center justify-end gap-1">
                          Current NAV
                          <ArrowUpDown className={`h-3 w-3 transition-opacity ${sortConfig?.key === 'currentNav' ? 'opacity-100' : 'opacity-50 group-hover:opacity-100'}`} />
                        </div>
                      </th>
                      <th className="px-4 py-3 cursor-pointer select-none group whitespace-nowrap" onClick={() => requestSort('currentValue')}>
                        <div className="flex items-center justify-end gap-1">
                          Current Value
                          <ArrowUpDown className={`h-3 w-3 transition-opacity ${sortConfig?.key === 'currentValue' ? 'opacity-100' : 'opacity-20 group-hover:opacity-40'}`} />
                        </div>
                      </th>
                      <th className="px-4 py-3 cursor-pointer select-none group whitespace-nowrap" onClick={() => requestSort('costBasis')}>
                        <div className="flex items-center justify-end gap-1">
                          Cost Basis
                          <ArrowUpDown className={`h-3 w-3 transition-opacity ${sortConfig?.key === 'costBasis' ? 'opacity-100' : 'opacity-20 group-hover:opacity-40'}`} />
                        </div>
                      </th>
                      <th className="px-4 py-3 cursor-pointer select-none group whitespace-nowrap" onClick={() => requestSort('gainLossValue')}>
                        <div className="flex items-center gap-1">
                          Gain/Loss
                          <ArrowUpDown className={`h-3 w-3 transition-opacity ${sortConfig?.key === 'gainLossValue' ? 'opacity-100' : 'opacity-20 group-hover:opacity-40'}`} />
                        </div>
                      </th>
                      <th className="px-4 py-3 cursor-pointer select-none group whitespace-nowrap" onClick={() => requestSort('statusValue')}>
                        <div className="flex items-center gap-1">
                          Status
                          <ArrowUpDown className={`h-3 w-3 transition-opacity ${sortConfig?.key === 'statusValue' ? 'opacity-100' : 'opacity-20 group-hover:opacity-40'}`} />
                        </div>
                      </th>
                      <th className="px-4 py-3 text-right whitespace-nowrap">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 text-sm">
                    {(() => {
                      const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
                      const paginatedInvestments = sortedInvestments.slice(startIndex, startIndex + ITEMS_PER_PAGE);
                      return paginatedInvestments.map((row, index) => {
                        // Get redemptions for this specific investment
                        const rowRedemptions = redemptions || [];
                        const redeemedUnits = rowRedemptions
                          .filter((r: any) => r.investment_id === row.id && r.is_reconciled)
                          .reduce((sum: number, r: any) => sum + parseFloat(r.units || 0), 0);

                        const redeemedAmount = rowRedemptions
                          .filter((r: any) => r.investment_id === row.id && r.is_reconciled)
                          .reduce((sum: number, r: any) => sum + parseFloat(r.amount || 0), 0);

                        const units = Math.max(0, parseFloat(row.estimated_units) - redeemedUnits);
                        const currentNav = stats.currentNav;
                        const currentValue = units * currentNav;
                        const costBasis = parseFloat(row.investment_amount) - redeemedAmount;
                        const gainLoss = currentValue - costBasis;
                        const gainPositive = gainLoss >= 0;
                        const gainPercent = costBasis > 0 ? (gainLoss / costBasis) * 100 : 0;

                        return (
                          <tr
                            key={row.id}
                            className="hover:bg-slate-50/80 cursor-pointer transition-colors duration-150"
                            onClick={() => router.push(`/dashboard/portfolio/${row.id}`)}
                          >
                            <td className="px-4 py-3 text-[#1F1F1F] font-medium">{row.fund_name}</td>
                            <td className="px-4 py-3 text-[#4B4B4B]">{row.account_type}</td>
                            <td className="px-4 py-3 text-[#4B4B4B] text-right">{units.toLocaleString(undefined, { maximumFractionDigits: 4 })}</td>
                            <td className="px-4 py-3 text-[#4B4B4B] text-right">{formatCurrency(currentNav)}</td>
                            <td className="px-4 py-3 text-[#4B4B4B] text-right">{formatCurrency(currentValue)}</td>
                            <td className="px-4 py-3 text-[#4B4B4B] text-right">{formatCurrency(costBasis)}</td>
                            <td className="px-4 py-3 font-medium">
                              <span className={gainPositive ? 'text-[#2BB673]' : 'text-[#E04343]'}>
                                {gainPositive ? '+' : ''}{formatCurrency(gainLoss)} ({gainPercent.toFixed(2)}%)
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${row.status === 'Rejected'
                                ? 'bg-red-100 text-red-800'
                                : row.is_reconciled
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-yellow-100 text-yellow-800'
                                }`}>
                                {row.status === 'Rejected' ? 'Rejected' : row.is_reconciled ? 'Completed' : row.status || 'Pending'}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right" onClick={(event) => event.stopPropagation()}>
                              <div className="relative inline-block text-left" data-portfolio-action-menu="true">
                                <button
                                  type="button"
                                  aria-label="Open actions"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    setOpenActionMenuId((current) =>
                                      current === row.id ? null : row.id,
                                    );
                                  }}
                                  className="inline-flex h-7 w-7 items-center justify-center rounded-full hover:bg-gray-100"
                                >
                                  <MoreVertical className="h-4 w-4 text-[#777777]" />
                                </button>

                                {openActionMenuId === row.id && (
                                  <div className={`absolute right-0 z-20 w-[150px] rounded-[6px] border border-[#ECECEC] bg-white py-1 shadow-[0_6px_16px_rgba(0,0,0,0.08)] ${index === paginatedInvestments.length - 1 ? 'bottom-full mb-1' : 'top-full mt-1'
                                    }`}>
                                    <Link
                                      href={`/dashboard/portfolio/${row.id}`}
                                      className="block px-3 py-2 text-left text-[12px] text-[#5F5F5F] hover:bg-[#F8F8F8]"
                                    >
                                      View Fund Details
                                    </Link>
                                    {/* <button
                                      className="w-full block px-3 py-2 text-left text-[12px] text-[#5F5F5F] hover:bg-[#F8F8F8]"
                                      onClick={() => alert('Request sent!')}
                                    >
                                      Send Request
                                    </button> */}
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      });
                    })()}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 flex flex-col items-center justify-center gap-6 text-sm text-[#8E8E93]">
                <span className="font-medium text-[#6B7280]">
                  Showing {sortedInvestments.length === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1}-
                  {Math.min(currentPage * ITEMS_PER_PAGE, sortedInvestments.length)} of {sortedInvestments.length}
                </span>
                {Math.ceil(sortedInvestments.length / ITEMS_PER_PAGE) > 1 && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="px-4 py-2 text-sm font-bold text-[#4B5563] hover:bg-[#F9FAFB] rounded-full disabled:opacity-40 transition-all"
                    >
                      Previous
                    </button>
                    <div className="flex items-center gap-2 shadow-sm rounded-full bg-[#F9FAFB] p-1">
                      {Array.from({ length: Math.ceil(sortedInvestments.length / ITEMS_PER_PAGE) }, (_, i) => i + 1).map((page) => (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`w-9 h-9 rounded-lg text-sm font-bold transition-all ${currentPage === page
                            ? 'bg-[#1F3B6E] text-white shadow-md scale-105'
                            : 'text-[#4B5563] hover:bg-white'
                            }`}
                        >
                          {page}
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(sortedInvestments.length / ITEMS_PER_PAGE)))}
                      disabled={currentPage === Math.ceil(sortedInvestments.length / ITEMS_PER_PAGE)}
                      className="px-4 py-2 text-sm font-bold text-[#4B5563] hover:bg-[#F9FAFB] rounded-full disabled:opacity-40 transition-all"
                    >
                      Next
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'oldInvestments' && oldInvestments && oldInvestments.length > 0 && (
          <div className="space-y-6">
            {/* Old Platform Investments Table */}
            <div className="rounded-2xl border border-[#F2F2F2] bg-white px-6 pb-6 pt-6">
              <div className="mb-4">
                <h2 className="text-lg font-bold text-[#1F3B6E] font-goudy">Old Platform Investments</h2>
                <p className="text-xs text-gray-500 font-medium">Historical investments transferred from the previous platform.</p>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="border-b border-gray-100 text-xs font-semibold text-[#8E8E93]">
                    <tr>
                      <th className="px-4 py-3 whitespace-nowrap">Fund Name</th>
                      <th className="px-4 py-3 whitespace-nowrap">Investor Name</th>
                      <th className="px-4 py-3 whitespace-nowrap">Status</th>
                      <th className="px-4 py-3 text-right whitespace-nowrap">Investment Amount</th>
                      <th className="px-4 py-3 whitespace-nowrap">Placed On</th>
                      <th className="px-4 py-3 whitespace-nowrap">Received On</th>
                      <th className="px-4 py-3 text-right whitespace-nowrap">Shares</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 text-sm">
                    {oldInvestments.map((row) => (
                      <tr
                        key={row.investmentOwnershipId}
                        className="hover:bg-slate-50/80 cursor-pointer transition-colors duration-150"
                        onClick={() => {
                          setSelectedOldInvestment(row);
                          setShowOldInvestmentModal(true);
                        }}
                      >
                        <td className="px-4 py-3 text-[#1F1F1F] font-semibold">{row.projectName}</td>
                        <td className="px-4 py-3 text-[#4B4B4B]">{row.investorProfileLegalName || 'N/A'}</td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            {row.investmentStatus}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right text-[#1F3B6E] font-bold">{row.investmentAmount}</td>
                        <td className="px-4 py-3 text-gray-600">{formatDate(row.placedOn)}</td>
                        <td className="px-4 py-3 text-gray-600">{row.receivedOn ? formatDate(row.receivedOn) : 'N/A'}</td>
                        <td className="px-4 py-3 text-right text-gray-600">{row.shares || '0'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Old Investment Details Modal */}
      {showOldInvestmentModal && selectedOldInvestment && (
        <div className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-3xl p-6 max-w-2xl w-full mx-4 relative shadow-2xl border border-gray-100 animate-in fade-in zoom-in duration-200 text-[#1F1F1F]">
            <button
              onClick={() => setShowOldInvestmentModal(false)}
              className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#1F3B6E] to-[#6B7FBA] flex items-center justify-center text-white font-bold text-sm shadow-md">
                {getInitials(selectedOldInvestment.projectName)}
              </div>
              <div>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-800 border border-gray-200">
                  {selectedOldInvestment.investmentStatus}
                </span>
                <h2 className="text-xl font-bold font-goudy mt-1">{selectedOldInvestment.projectName}</h2>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-50/50 p-5 rounded-2xl border border-gray-100 mb-4">
              <div>
                <p className="text-[11px] text-gray-400 font-semibold uppercase">Investment Ownership ID</p>
                <p className="text-sm font-bold text-gray-900">{selectedOldInvestment.investmentOwnershipId}</p>
              </div>

              <div>
                <p className="text-[11px] text-gray-400 font-semibold uppercase">Project ID</p>
                <p className="text-sm font-bold text-gray-900">{selectedOldInvestment.projectId}</p>
              </div>

              <div>
                <p className="text-[11px] text-gray-400 font-semibold uppercase">Investment Amount</p>
                <p className="text-sm font-bold text-[#1F3B6E]">{selectedOldInvestment.investmentAmount}</p>
              </div>

              <div>
                <p className="text-[11px] text-gray-400 font-semibold uppercase">Shares</p>
                <p className="text-sm font-bold text-gray-900">{selectedOldInvestment.shares}</p>
              </div>

              <div>
                <p className="text-[11px] text-gray-400 font-semibold uppercase">Ownership</p>
                <p className="text-sm font-bold text-gray-900">{selectedOldInvestment.ownership}</p>
              </div>

              <div>
                <p className="text-[11px] text-gray-400 font-semibold uppercase">% of Proceeds</p>
                <p className="text-sm font-bold text-gray-900">{selectedOldInvestment.ofProceeds || 'N/A'}</p>
              </div>

              <div>
                <p className="text-[11px] text-gray-400 font-semibold uppercase">Placed On</p>
                <p className="text-sm font-bold text-gray-900">{formatDate(selectedOldInvestment.placedOn)}</p>
              </div>

              <div>
                <p className="text-[11px] text-gray-400 font-semibold uppercase">Received On</p>
                <p className="text-sm font-bold text-gray-900">
                  {selectedOldInvestment.receivedOn ? formatDate(selectedOldInvestment.receivedOn) : 'N/A'}
                </p>
              </div>

              <div>
                <p className="text-[11px] text-gray-400 font-semibold uppercase">Payment Method</p>
                <p className="text-sm font-bold text-gray-900">{selectedOldInvestment.investmentDistributionPaymentMethod || 'N/A'}</p>
              </div>

              <div>
                <p className="text-[11px] text-gray-400 font-semibold uppercase">Default Dist. Method</p>
                <p className="text-sm font-bold text-gray-900">{selectedOldInvestment.profileDefaultDistributionMethod || 'N/A'}</p>
              </div>

              <div className="sm:col-span-2 border-t border-gray-100 pt-3 mt-1">
                <p className="text-[11px] text-gray-400 font-semibold uppercase">Investor Profile Details</p>
                <p className="text-xs text-gray-600 mt-1">
                  Legal Name: <strong>{selectedOldInvestment.investorProfileLegalName}</strong> (Profile ID: {selectedOldInvestment.investorProfileId})
                </p>
                <p className="text-xs text-gray-600">
                  Entity: <strong>{selectedOldInvestment.internalEntity}</strong> (Entity ID: {selectedOldInvestment.internalEntityId})
                </p>
              </div>
            </div>

            {/* Legacy Distributions Section */}
            <div className="border-t border-gray-100 pt-4 mb-4">
              <h3 className="text-base font-bold text-[#1F3B6E] font-goudy mb-2.5">Legacy Distributions</h3>
              {selectedOldInvestment.distributions && selectedOldInvestment.distributions.length > 0 ? (
                <div className="max-h-64 overflow-y-auto border border-gray-100 rounded-2xl">
                  <table className="min-w-full text-left text-xs">
                    <thead className="bg-gray-50 text-[#8E8E93] font-semibold border-b border-gray-100 sticky top-0">
                      <tr>
                        <th className="px-4 py-2.5">Type</th>
                        <th className="px-4 py-2.5 text-right">Return of Capital</th>
                        <th className="px-4 py-2.5 text-right">Calculated Amount</th>
                        <th className="px-4 py-2.5">Start Date</th>
                        <th className="px-4 py-2.5">End Date</th>
                        <th className="px-4 py-2.5">Pay Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 text-[#1F1F1F]">
                      {selectedOldInvestment.distributions.map((dist: any) => (
                        <tr key={dist.distributionId} className="hover:bg-gray-50/50">
                          <td className="px-4 py-2.5 font-medium">{dist.distributionType || 'N/A'}</td>
                          <td className="px-4 py-2.5 text-right font-semibold text-gray-700">{dist.returnOfCapital || '$-'}</td>
                          <td className="px-4 py-2.5 text-right font-bold text-[#2BB673]">{dist.calculatedAmount || '$-'}</td>
                          <td className="px-4 py-2.5 text-gray-500">{formatDate(dist.batchStartDate)}</td>
                          <td className="px-4 py-2.5 text-gray-500">{formatDate(dist.batchEndDate)}</td>
                          <td className="px-4 py-2.5 text-gray-600 font-semibold">{formatDate(dist.batchPayDate)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="bg-gray-50/50 rounded-2xl border border-gray-100 p-4 text-center text-xs text-gray-400 font-medium">
                  No legacy distribution records found for this investment.
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setShowOldInvestmentModal(false)}
                className="bg-[#1F3B6E] hover:bg-[#15294e] text-white px-8 py-2.5 rounded-full font-bold shadow-md transition-all active:scale-95 text-sm"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
