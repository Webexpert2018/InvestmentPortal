'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/DashboardLayout';
import { MoreVertical, Loader2 } from 'lucide-react';
import { apiClient, BASE_URL } from '@/lib/api/client';

export default function PortfolioPage() {
  const [activeTab, setActiveTab] = useState<'investments' | 'fundInfo'>('investments');
  const [openActionMenuId, setOpenActionMenuId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [investments, setInvestments] = useState<any[]>([]);
  const [funds, setFunds] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalInvested: 0,
    totalUnits: 0,
    currentNav: 0,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [investmentsData, navSummary, fundsData] = await Promise.all([
        apiClient.getMyInvestments(),
        apiClient.getNavSummary(),
        apiClient.getFunds(),
      ]);

      setInvestments(investmentsData);
      setFunds(fundsData);

      const totalInvested = investmentsData.reduce((sum: number, inv: any) => sum + parseFloat(inv.investment_amount), 0);
      const totalUnits = investmentsData.reduce((sum: number, inv: any) => sum + parseFloat(inv.estimated_units), 0);

      setStats({
        totalInvested,
        totalUnits,
        currentNav: navSummary.currentNav,
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
          </div>

          {activeTab === 'investments' && (
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <div className="rounded-xl border border-[#F2F2F2] px-6 py-5">
                <p className="text-xs font-medium uppercase tracking-wide text-[#A0A0A0]">
                  Total Invested
                </p>
                <p className="mt-3 text-2xl font-semibold text-[#1F1F1F]">{formatCurrency(stats.totalInvested)}</p>
              </div>
              <div className="rounded-xl border border-[#F2F2F2] px-6 py-5">
                <p className="text-xs font-medium uppercase tracking-wide text-[#A0A0A0]">
                  Total Units
                </p>
                <p className="mt-3 text-2xl font-semibold text-[#1F1F1F]">{stats.totalUnits.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</p>
              </div>
              <div className="rounded-xl border border-[#F2F2F2] px-6 py-5">
                <p className="text-xs font-medium uppercase tracking-wide text-[#A0A0A0]">
                  Portfolio Value
                </p>
                <p className="mt-3 text-2xl font-semibold text-[#2BB673]">{formatCurrency(stats.totalUnits * stats.currentNav)}</p>
              </div>
            </div>
          )}

          {activeTab === 'fundInfo' && (
            <div className="mt-8 grid gap-8 md:grid-cols-2 lg:grid-cols-2">
              {funds.map((fund) => (
                <Link
                  key={fund.id}
                  href={`/dashboard/funds/${fund.id}`}
                  className="flex items-center rounded-2xl bg-[#F7F8FA] p-6 transition hover:bg-[#F1F2F5] hover:shadow-[0_10px_30px_rgba(0,0,0,0.04)] duration-300"
                >
                  <div className="flex items-center gap-6 w-full">
                    <div className="flex-shrink-0">
                      <img
                        src={
                          fund.image_url 
                            ? (fund.image_url.startsWith('http') ? fund.image_url : `${BASE_URL}${fund.image_url}`) 
                            : "/images/strive_funds.jpg"
                        }
                        alt={fund.name}
                        className="h-32 w-56 rounded-xl object-cover shadow-sm"
                      />
                    </div>
                    <div className="flex-grow">
                      <h3 className="font-goudy text-2xl text-[#1F3B6E] leading-tight">{fund.name}</h3>
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
                      <th className="px-4 py-3">Fund Name</th>
                      <th className="px-4 py-3">Account Type</th>
                      <th className="px-4 py-3">Units</th>
                      <th className="px-4 py-3">Current NAV</th>
                      <th className="px-4 py-3">Current Value</th>
                      <th className="px-4 py-3">Cost Basis</th>
                      <th className="px-4 py-3">Gain/Loss</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 text-sm">
                    {investments.map((row) => {
                      const units = parseFloat(row.estimated_units);
                      const currentNav = stats.currentNav;
                      const currentValue = units * currentNav;
                      const costBasis = parseFloat(row.investment_amount);
                      const gainLoss = currentValue - costBasis;
                      const gainPositive = gainLoss >= 0;
                      const gainPercent = costBasis > 0 ? (gainLoss / costBasis) * 100 : 0;

                      return (
                        <tr key={row.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-[#1F1F1F]">{row.fund_name}</td>
                          <td className="px-4 py-3 text-[#4B4B4B]">{row.account_type}</td>
                          <td className="px-4 py-3 text-[#4B4B4B]">{units.toLocaleString(undefined, { maximumFractionDigits: 4 })}</td>
                          <td className="px-4 py-3 text-[#4B4B4B]">{formatCurrency(currentNav)}</td>
                          <td className="px-4 py-3 text-[#4B4B4B]">{formatCurrency(currentValue)}</td>
                          <td className="px-4 py-3 text-[#4B4B4B]">{formatCurrency(costBasis)}</td>
                          <td className="px-4 py-3 font-medium">
                            <span className={gainPositive ? 'text-[#2BB673]' : 'text-[#E04343]'}>
                              {gainPositive ? '+' : ''}{formatCurrency(gainLoss)} ({gainPercent.toFixed(2)}%)
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              Pending
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
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
                                <div className="absolute right-0 top-full z-20 mt-1 w-[150px] rounded-[6px] border border-[#ECECEC] bg-white py-1 shadow-[0_6px_16px_rgba(0,0,0,0.08)]">
                                  <Link
                                    href={`/dashboard/portfolio/${row.id}`}
                                    className="block px-3 py-2 text-left text-[12px] text-[#5F5F5F] hover:bg-[#F8F8F8]"
                                  >
                                    View Fund Details
                                  </Link>
                                  <button
                                    className="w-full block px-3 py-2 text-left text-[12px] text-[#5F5F5F] hover:bg-[#F8F8F8]"
                                    onClick={() => alert('Request sent!')}
                                  >
                                    Send Request
                                  </button>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 flex items-center justify-between text-xs text-[#8E8E93]">
                <span>Showing 1-{investments.length} of {investments.length}</span>
                <div className="flex items-center gap-2">
                  <button className="rounded-full px-3 py-1 text-[#8E8E93] hover:bg-gray-100">
                    Previous
                  </button>
                  <button className="h-7 w-7 rounded-full bg-[#1F3B6E] text-xs font-semibold text-white">
                    1
                  </button>
                  <button className="h-7 w-7 rounded-full text-xs text-[#8E8E93] hover:bg-gray-100">
                    2
                  </button>
                  <button className="rounded-full px-3 py-1 text-[#8E8E93] hover:bg-gray-100">
                    Next
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
