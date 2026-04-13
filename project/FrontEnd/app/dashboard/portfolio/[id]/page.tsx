'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { DashboardLayout } from '@/components/DashboardLayout';
import { ChevronLeft, ChevronDown, MoreVertical, Loader2 } from 'lucide-react';
import { apiClient } from '@/lib/api/client';





export default function PortfolioFundDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [investment, setInvestment] = useState<any>(null);
  const [navSummary, setNavSummary] = useState<any>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'transactions' | 'documents' | 'fundInfo'>('transactions');
  const [sortConfig, setSortConfig] = useState<{
    key: 'date' | 'type' | 'amount' | 'units' | 'status';
    direction: 'asc' | 'desc';
  }>({ key: 'date', direction: 'desc' });
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [rangeOpen, setRangeOpen] = useState(false);
  const [range, setRange] = useState<'3m' | '6m' | '1y'>('1y');
  const [performanceHistory, setPerformanceHistory] = useState<any[]>([]);

  useEffect(() => {
    if (id) {
      if (!investment) {
        fetchData(true);
      } else {
        fetchData(false);
      }
    }
  }, [id, range]);

  const fetchData = async (initial: boolean = false) => {
    try {
      if (initial) setLoading(true);
      else setIsRefreshing(true);

      const months = range === '3m' ? 3 : range === '6m' ? 6 : 12;

      const [invData, navData, docsData, perfData] = await Promise.all([
        apiClient.getInvestmentById(id),
        apiClient.getNavSummary(),
        apiClient.getFundDocuments(id), // Fixed: use id instead of invData.fund_id for documents context sometimes, but let's stick to logical data
        apiClient.getPerformance(months)
      ]);

      setInvestment(invData);
      setNavSummary(navData);
      setDocuments(docsData || []);
      setPerformanceHistory(perfData || []);
    } catch (error) {
      console.error('Error fetching investment details:', error);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  const fundName = investment?.fund_name || 'Fund Details';

  const formatCurrency = (val: number | string) => {
    const num = typeof val === 'string' ? parseFloat(val) : val;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(num);
  };

  const rangeLabel: Record<typeof range, string> = {
    '3m': 'Last 3 months',
    '6m': 'Last 6 months',
    '1y': 'Last year',
  };

  const currentValue = parseFloat(investment?.revised_amount || investment?.investment_amount || 0);
  const costBasis = parseFloat(investment?.investment_amount || 0);
  const gainLoss = currentValue - costBasis;
  const isPositive = gainLoss >= 0;
  const returnPct = costBasis > 0 ? (gainLoss / costBasis) * 100 : 0;
  const unitsHeld = parseFloat(investment?.estimated_units || 0);
  const currentNavValue = navSummary?.currentNav || 0;

  // Calculate dynamic performance labels based on history
  const { displayRangePct, displayRangeValue } = useMemo(() => {
    if (performanceHistory.length < 2) {
      return { displayRangePct: '0.00%', displayRangeValue: '+0.00' };
    }
    const first = performanceHistory[0].value * unitsHeld;
    const last = performanceHistory[performanceHistory.length - 1].value * unitsHeld;
    const diff = last - first;
    const pct = first > 0 ? (diff / first) * 100 : 0;
    return {
      displayRangePct: `${pct >= 0 ? '+' : ''}${pct.toFixed(2)}%`,
      displayRangeValue: `${diff >= 0 ? '+' : ''}${formatCurrency(diff)}`
    };
  }, [performanceHistory, unitsHeld]);

  // Generate SVG paths dynamically
  const { linePath, areaPath } = useMemo(() => {
    if (performanceHistory.length < 2) {
      // Fallback flat line if no history
      return {
        linePath: 'M 20,128 L 780,128',
        areaPath: 'M 20,128 L 780,128 L 780,256 L 20,256 Z'
      };
    }

    const width = 760; // 800 - margin
    const height = 200; // 256 - padding
    const minY = Math.min(...performanceHistory.map(p => p.value)) * 0.95; // 5% padding
    const maxY = Math.max(...performanceHistory.map(p => p.value)) * 1.05;
    const rangeY = maxY - minY || 1;

    const points = performanceHistory.map((p, i) => {
      const x = 20 + (i / (performanceHistory.length - 1)) * width;
      const val = p.value * unitsHeld;
      // Normalize Y between 20 (top) and 220 (bottom)
      // High value = low Y (closer to 20)
      const normalizedValue = (p.value - minY) / rangeY;
      const y = 220 - normalizedValue * height;
      return { x, y };
    });

    const line = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
    const area = `${line} L ${points[points.length - 1].x.toFixed(1)},256 L ${points[0].x.toFixed(1)},256 Z`;

    return { linePath: line, areaPath: area };
  }, [performanceHistory, unitsHeld]);

  const transactionsList = useMemo(() => {
    if (!investment) return [];
    // Currently, we treat each investment as a transaction for this view
    return [
      {
        id: investment.id,
        date: new Date(investment.created_at).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        }),
        type: 'Subscription',
        amount: investment.investment_amount,
        units: parseFloat(investment.estimated_units).toLocaleString(undefined, { maximumFractionDigits: 4 }),
        status: 'Pending', // Reverted back to Pending as requested
      },
    ];
  }, [investment]);

  const sortedTransactions = useMemo(() => {
    return [...transactionsList].sort((a, b) => {
      const { key, direction } = sortConfig;
      const multiplier = direction === 'asc' ? 1 : -1;

      if (key === 'amount') {
        return (Number(a.amount) - Number(b.amount)) * multiplier;
      }

      if (key === 'units') {
        return (parseFloat(a.units) - parseFloat(b.units)) * multiplier;
      }

      if (key === 'date') {
        return (new Date(a.date).getTime() - new Date(b.date).getTime()) * multiplier;
      }

      if (key === 'status') {
        return a.status.localeCompare(b.status) * multiplier;
      }

      return a.type.localeCompare(b.type) * multiplier;
    });
  }, [transactionsList, sortConfig]);

  const handleSort = (key: 'date' | 'type' | 'amount' | 'units' | 'status') => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc',
    }));
  };

  const handleViewDocument = (docId: string) => {
    window.open(`${apiClient.getApiUrl()}/documents/${docId}/view`, '_blank');
  };

  const handleDownloadDocument = (docId: string) => {
    window.open(apiClient.getDocumentDownloadUrl(docId), '_blank');
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
        {/* Breadcrumb / back */}
        <button
          type="button"
          onClick={() => router.back()}
          className="mt-2 inline-flex items-center gap-2 text-sm text-[#4B4B4B] hover:text-[#1F1F1F]"
        >
          <ChevronLeft className="h-4 w-4" />
          <span>{fundName}</span>
        </button>

        {/* Top metrics row */}
        <div className="grid gap-4 md:grid-cols-4">
          <div className="rounded-xl bg-white px-6 py-5">
            <p className="text-xs font-medium uppercase tracking-wide text-[#A0A0A0]">Current Value</p>
            <p className="mt-3 text-2xl font-semibold text-[#1F1F1F]">{formatCurrency(currentValue)}</p>
          </div>
          <div className="rounded-xl bg-white px-6 py-5">
            <p className="text-xs font-medium uppercase tracking-wide text-[#A0A0A0]">Units Held</p>
            <p className="mt-3 text-2xl font-semibold text-[#1F1F1F]">{unitsHeld.toLocaleString(undefined, { maximumFractionDigits: 4 })}</p>
          </div>
          <div className="rounded-xl bg-white px-6 py-5">
            <p className="text-xs font-medium uppercase tracking-wide text-[#A0A0A0]">Current NAV</p>
            <p className="mt-3 text-2xl font-semibold text-[#1F1F1F]">{formatCurrency(currentNavValue)}</p>
          </div>
          <div className="rounded-xl bg-white px-6 py-5">
            <p className="text-xs font-medium uppercase tracking-wide text-[#A0A0A0]">Total Gain/Loss</p>
            <p className={`mt-3 text-2xl font-semibold ${isPositive ? 'text-[#2BB673]' : 'text-[#E04343]'}`}>
              {isPositive ? '+' : ''}{formatCurrency(gainLoss)}
            </p>
            <p className={`mt-1 text-xs font-medium ${isPositive ? 'text-[#2BB673]' : 'text-[#E04343]'}`}>
              {isPositive ? '+' : ''}{returnPct.toFixed(2)}%
            </p>
          </div>
        </div>

        {/* Main grid: chart + holdings */}
        <div className="grid gap-6 xl:grid-cols-[minmax(0,2.5fr)_minmax(0,1.1fr)]">
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="font-goudy text-base">Performance Overview</h2>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setRangeOpen((open) => !open)}
                  className="flex items-center gap-2 rounded-full border border-gray-200 px-3 py-1 text-xs text-[#4B4B4B]"
                >
                  {rangeLabel[range]}
                  <ChevronDown className="h-3 w-3" />
                </button>
                {rangeOpen && (
                  <div className="absolute right-0 z-10 mt-2 w-36 rounded-xl bg-white py-2 text-xs shadow-lg ring-1 ring-black/5">
                    <button
                      type="button"
                      onClick={() => {
                        setRange('3m');
                        setRangeOpen(false);
                      }}
                      className="block w-full px-4 py-2 text-left text-[#4B4B4B] hover:bg-gray-50"
                    >
                      Last 3 months
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setRange('6m');
                        setRangeOpen(false);
                      }}
                      className="block w-full px-4 py-2 text-left text-[#4B4B4B] hover:bg-gray-50"
                    >
                      Last 6 months
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setRange('1y');
                        setRangeOpen(false);
                      }}
                      className="block w-full px-4 py-2 text-left text-[#4B4B4B] hover:bg-gray-50"
                    >
                      Last year
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className={`mt-6 transition-opacity duration-300 ${isRefreshing ? 'opacity-50' : 'opacity-100'}`}>
              <p className="text-2xl font-semibold text-[#1F1F1F]">{formatCurrency(currentValue)}</p>
              <p className={`mt-1 text-sm font-medium ${displayRangePct.startsWith('+') ? 'text-[#2BB673]' : 'text-[#E04343]'}`}>
                {rangeLabel[range]} {displayRangePct}
              </p>
            </div>

            <div className={`mt-4 relative transition-opacity duration-300 ${isRefreshing ? 'opacity-50' : 'opacity-100'}`}>
              <svg className="h-56 w-full" viewBox="0 0 800 256" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="portfolioChartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#FCD34D" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#FEF3C7" stopOpacity="0.05" />
                  </linearGradient>
                </defs>
                <rect x="0" y="0" width="800" height="256" fill="#FFFFFF" />
                <path
                  d={areaPath}
                  fill="url(#portfolioChartGradient)"
                  className="transition-all duration-700 ease-in-out"
                />
                <path
                  d={linePath}
                  fill="none"
                  stroke="#F59E0B"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="transition-all duration-700 ease-in-out"
                />
              </svg>
              {isRefreshing && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Loader2 className="h-6 w-6 text-[#F59E0B] animate-spin" />
                </div>
              )}
            </div>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <div className="border-b border-[#F2F2F2] pb-3">
              <h2 className="font-goudy text-base">Your Holdings</h2>
            </div>
            <div className="mt-4 space-y-6 text-sm text-[#4B4B4B]">
              <div className="flex items-center justify-between">
                <span>Cost basis:</span>
                <span className="text-right font-semibold">{formatCurrency(costBasis)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Unrealized Gain:</span>
                <span className="text-right font-semibold">{formatCurrency(gainLoss)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>% Return:</span>
                <span className={`text-right font-semibold ${isPositive ? 'text-[#2BB673]' : 'text-[#E04343]'}`}>
                  {isPositive ? '+' : ''}{returnPct.toFixed(2)}%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Inception Date:</span>
                <span className="text-right font-semibold">
                  {new Date(investment?.created_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </span>
              </div>
            </div>
            <button className="mt-6 w-full rounded-full bg-[#FFF3D6] py-2.5 text-sm font-semibold text-[#E29F3A] hover:bg-[#FFE7AF]">
              Contact Support
            </button>
          </div>
        </div>

        {/* Bottom tabs */}
        <div className="rounded-2xl bg-white pt-4 shadow-sm">
          <div className="flex gap-8 border-b border-gray-100 px-6">
            <button
              type="button"
              onClick={() => {
                setActiveTab('transactions');
                setOpenMenuId(null);
              }}
              className={`pb-3 text-sm font-medium relative ${activeTab === 'transactions' ? 'text-[#1F3B6E]' : 'text-[#8E8E93]'
                }`}
            >
              Transactions
              {activeTab === 'transactions' && (
                <span className="absolute inset-x-0 bottom-0 h-0.5 bg-[#FFC63F]" />
              )}
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('documents');
                setOpenMenuId(null);
              }}
              className={`pb-3 text-sm font-medium relative ${activeTab === 'documents' ? 'text-[#1F3B6E]' : 'text-[#8E8E93]'
                }`}
            >
              Documents
              {activeTab === 'documents' && (
                <span className="absolute inset-x-0 bottom-0 h-0.5 bg-[#FFC63F]" />
              )}
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('fundInfo');
                setOpenMenuId(null);
              }}
              className={`pb-3 text-sm font-medium relative ${activeTab === 'fundInfo' ? 'text-[#1F3B6E]' : 'text-[#8E8E93]'
                }`}
            >
              Fund Info
              {activeTab === 'fundInfo' && (
                <span className="absolute inset-x-0 bottom-0 h-0.5 bg-[#FFC63F]" />
              )}
            </button>
          </div>

          {activeTab === 'transactions' && (
            <div className="overflow-x-auto px-6 pb-6 pt-4">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-gray-100 text-xs font-semibold text-[#8E8E93]">
                  <tr>
                    <th className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => handleSort('date')}
                        className="inline-flex items-center gap-1"
                      >
                        <span>Date</span>
                        {sortConfig.key === 'date' && (
                          <span className="text-[10px]">{sortConfig.direction === 'asc' ? '▲' : '▼'}</span>
                        )}
                      </button>
                    </th>
                    <th className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => handleSort('type')}
                        className="inline-flex items-center gap-1"
                      >
                        <span>Type</span>
                        {sortConfig.key === 'type' && (
                          <span className="text-[10px]">{sortConfig.direction === 'asc' ? '▲' : '▼'}</span>
                        )}
                      </button>
                    </th>
                    <th className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => handleSort('amount')}
                        className="inline-flex items-center gap-1"
                      >
                        <span>Amount</span>
                        {sortConfig.key === 'amount' && (
                          <span className="text-[10px]">{sortConfig.direction === 'asc' ? '▲' : '▼'}</span>
                        )}
                      </button>
                    </th>
                    <th className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => handleSort('units')}
                        className="inline-flex items-center gap-1"
                      >
                        <span>Units</span>
                        {sortConfig.key === 'units' && (
                          <span className="text-[10px]">{sortConfig.direction === 'asc' ? '▲' : '▼'}</span>
                        )}
                      </button>
                    </th>
                    <th className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => handleSort('status')}
                        className="inline-flex items-center gap-1"
                      >
                        <span>Status</span>
                        {sortConfig.key === 'status' && (
                          <span className="text-[10px]">{sortConfig.direction === 'asc' ? '▲' : '▼'}</span>
                        )}
                      </button>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {sortedTransactions.map((tx: any) => (
                    <tr key={tx.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-[#4B4B4B]">{tx.date}</td>
                      <td className="px-4 py-3 text-[#4B4B4B]">{tx.type}</td>
                      <td className="px-4 py-3 text-[#4B4B4B]">{formatCurrency(tx.amount)}</td>
                      <td className="px-4 py-3 text-[#4B4B4B]">{tx.units}</td>
                      <td className="px-4 py-3 text-sm font-medium text-[#E29F3A]">{tx.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'documents' && (
            <div className="overflow-x-auto px-6 pb-6 pt-4">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-gray-100 text-xs font-semibold text-[#8E8E93]">
                  <tr>
                    <th className="px-4 py-3">Document Name</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {documents.length > 0 ? (
                    documents.map((doc) => (
                      <tr key={doc.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-[#1F1F1F] font-medium">{doc.file_name}</td>
                        <td className="px-4 py-3 text-[#4B4B4B]">
                          {new Date(doc.uploaded_at || doc.created_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </td>
                        <td className="px-4 py-3 text-right text-xs">
                          <div className="relative inline-block text-left">
                            <button
                              type="button"
                              onClick={() =>
                                setOpenMenuId((current) => (current === doc.id ? null : doc.id))
                              }
                              className="inline-flex h-8 w-8 items-center justify-center rounded-full hover:bg-gray-100"
                            >
                              <MoreVertical className="h-4 w-4 text-[#8E8E93]" />
                            </button>
                            {openMenuId === doc.id && (
                              <div className="absolute right-0 z-10 mt-2 w-40 rounded-xl bg-white py-2 text-xs shadow-lg ring-1 ring-black/5">
                                <button
                                  onClick={() => handleViewDocument(doc.id)}
                                  className="block w-full px-4 py-2 text-left text-[#4B4B4B] hover:bg-gray-50"
                                >
                                  View Document
                                </button>
                                <button
                                  onClick={() => handleDownloadDocument(doc.id)}
                                  className="block w-full px-4 py-2 text-left text-[#4B4B4B] hover:bg-gray-50"
                                >
                                  Download
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={3} className="px-4 py-8 text-center text-[#8E8E93]">
                        No documents available for this investment yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'fundInfo' && (
            <div className="px-6 pb-6 pt-4 text-sm text-[#4B4B4B]">
              <h3 className="mb-2 font-semibold text-[#1F1F1F]">
                {investment?.fund_name}
              </h3>
              <p className="text-xs leading-relaxed text-[#6B7280]">
                {investment?.fund_description || 'No description available for this fund.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
