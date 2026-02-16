'use client';

import { useMemo, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { DashboardLayout } from '@/components/DashboardLayout';
import { ChevronLeft, ChevronDown, MoreVertical } from 'lucide-react';

const transactions = [
  { id: 1, date: 'Jan 18, 2025', type: 'Subscription', amount: '$50,000.00', units: 200, status: 'Completed' },
  { id: 2, date: 'Jan 18, 2025', type: 'Subscription', amount: '$30,000.00', units: 200, status: 'Completed' },
  { id: 3, date: 'Jan 18, 2025', type: 'Subscription', amount: '$50,000.00', units: 200, status: 'Pending' },
];

const documents = [
  { id: 1, date: 'Subscription Agreement — Signed — Feb 12, 2025' },
  { id: 2, date: 'K-1 Tax Document — 2024' },
  { id: 3, date: 'Quarterly Statement — Q4 2024' },
];

export default function PortfolioFundDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const [activeTab, setActiveTab] = useState<'transactions' | 'documents' | 'fundInfo'>('transactions');
  const [sortConfig, setSortConfig] = useState<{
    key: 'date' | 'type' | 'amount' | 'units' | 'status';
    direction: 'asc' | 'desc';
  }>({ key: 'date', direction: 'asc' });
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [rangeOpen, setRangeOpen] = useState(false);
  const [range, setRange] = useState<'3m' | '6m' | '1y'>('1y');

  const fundName = 'ABC Fund Details';

  const rangeLabel: Record<typeof range, string> = {
    '3m': 'Last 3 months',
    '6m': 'Last 6 months',
    '1y': 'Last year',
  };

  const rangeSummary: Record<typeof range, string> = {
    '3m': 'Last 3 months +4.25%',
    '6m': 'Last 6 months +9.80%',
    '1y': 'Last 12 months +15.33%',
  };

  const sortedTransactions = useMemo(() => {
    const parseAmount = (value: string) => Number(value.replace(/[^0-9.-]+/g, '')) || 0;

    return [...transactions].sort((a, b) => {
      const { key, direction } = sortConfig;
      const multiplier = direction === 'asc' ? 1 : -1;

      if (key === 'amount') {
        return (parseAmount(a.amount) - parseAmount(b.amount)) * multiplier;
      }

      if (key === 'units') {
        return (a.units - b.units) * multiplier;
      }

      if (key === 'date') {
        return (new Date(a.date).getTime() - new Date(b.date).getTime()) * multiplier;
      }

      if (key === 'status') {
        return a.status.localeCompare(b.status) * multiplier;
      }

      // type
      return a.type.localeCompare(b.type) * multiplier;
    });
  }, [sortConfig]);

  const handleSort = (key: 'date' | 'type' | 'amount' | 'units' | 'status') => {
    setSortConfig((current) => {
      if (current.key === key) {
        return { key, direction: current.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { key, direction: 'asc' };
    });
  };

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
            <p className="mt-3 text-2xl font-semibold text-[#1F1F1F]">$94,571</p>
          </div>
          <div className="rounded-xl bg-white px-6 py-5">
            <p className="text-xs font-medium uppercase tracking-wide text-[#A0A0A0]">Units Held</p>
            <p className="mt-3 text-2xl font-semibold text-[#1F1F1F]">841.05</p>
          </div>
          <div className="rounded-xl bg-white px-6 py-5">
            <p className="text-xs font-medium uppercase tracking-wide text-[#A0A0A0]">Current NAV</p>
            <p className="mt-3 text-2xl font-semibold text-[#1F1F1F]">$112.45</p>
          </div>
          <div className="rounded-xl bg-white px-6 py-5">
            <p className="text-xs font-medium uppercase tracking-wide text-[#A0A0A0]">Total Gain/Loss</p>
            <p className="mt-3 text-2xl font-semibold text-[#2BB673]">+12,571</p>
            <p className="mt-1 text-xs font-medium text-[#2BB673]">+15.33%</p>
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

            <div className="mt-6">
              <p className="text-2xl font-semibold text-[#1F1F1F]">$94,571</p>
              <p className="mt-1 text-sm font-medium text-[#2BB673]">{rangeSummary[range]}</p>
            </div>

            <div className="mt-4">
              <svg className="h-56 w-full" viewBox="0 0 800 256" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="portfolioChartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#FCD34D" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#FEF3C7" stopOpacity="0.05" />
                  </linearGradient>
                </defs>
                <rect x="0" y="0" width="800" height="256" fill="#FFFFFF" />
                <path
                  d={
                    range === '3m'
                      ? 'M 20,220 L 140,200 L 260,180 L 380,190 L 500,160 L 620,150 L 740,140 L 800,150 L 800,256 L 0,256 Z'
                      : range === '6m'
                      ? 'M 20,220 L 80,210 L 140,190 L 200,180 L 260,150 L 320,130 L 380,160 L 440,150 L 500,140 L 560,150 L 620,130 L 680,120 L 740,110 L 800,120 L 800,256 L 0,256 Z'
                      : 'M 20,220 L 80,200 L 140,190 L 200,140 L 260,110 L 320,80 L 380,70 L 440,100 L 500,120 L 560,100 L 620,80 L 680,100 L 740,110 L 780,90 L 800,80 L 800,256 L 0,256 Z'
                  }
                  fill="url(#portfolioChartGradient)"
                />
                <path
                  d={
                    range === '3m'
                      ? 'M 20,220 L 140,200 L 260,180 L 380,190 L 500,160 L 620,150 L 740,140'
                      : range === '6m'
                      ? 'M 20,220 L 80,210 L 140,190 L 200,180 L 260,150 L 320,130 L 380,160 L 440,150 L 500,140 L 560,150 L 620,130 L 680,120 L 740,110'
                      : 'M 20,220 L 80,200 L 140,190 L 200,140 L 260,110 L 320,80 L 380,70 L 440,100 L 500,120 L 560,100 L 620,80 L 680,100 L 740,110 L 780,90'
                  }
                  fill="none"
                  stroke="#F59E0B"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <div className="border-b border-[#F2F2F2] pb-3">
              <h2 className="font-goudy text-base">Your Holdings</h2>
            </div>
            <div className="mt-4 space-y-2 text-sm text-[#4B4B4B]">
              <div className="flex items-center justify-between">
                <span>Cost basis:</span>
                <span className="text-right font-semibold">$82,000</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Unrealized Gain:</span>
                <span className="text-right font-semibold">$12,571</span>
              </div>
              <div className="flex items-center justify-between">
                <span>% Return:</span>
                <span className="text-right font-semibold text-[#2BB673]">+15.33%</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Inception Date:</span>
                <span className="text-right font-semibold">Jul 22, 2024</span>
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
              className={`pb-3 text-sm font-medium relative ${
                activeTab === 'transactions' ? 'text-[#1F3B6E]' : 'text-[#8E8E93]'
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
              className={`pb-3 text-sm font-medium relative ${
                activeTab === 'documents' ? 'text-[#1F3B6E]' : 'text-[#8E8E93]'
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
              className={`pb-3 text-sm font-medium relative ${
                activeTab === 'fundInfo' ? 'text-[#1F3B6E]' : 'text-[#8E8E93]'
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
                  {sortedTransactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-[#4B4B4B]">{tx.date}</td>
                      <td className="px-4 py-3 text-[#4B4B4B]">{tx.type}</td>
                      <td className="px-4 py-3 text-[#4B4B4B]">{tx.amount}</td>
                      <td className="px-4 py-3 text-[#4B4B4B]">{tx.units}</td>
                      <td className="px-4 py-3 text-sm font-medium text-[#2BB673]">{tx.status}</td>
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
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {documents.map((doc) => (
                    <tr key={doc.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-[#4B4B4B]">{doc.date}</td>
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
                              <button className="block w-full px-4 py-2 text-left text-[#4B4B4B] hover:bg-gray-50">
                                View Document
                              </button>
                              <button className="block w-full px-4 py-2 text-left text-[#4B4B4B] hover:bg-gray-50">
                                Download
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'fundInfo' && (
            <div className="px-6 pb-6 pt-4 text-sm text-[#4B4B4B]">
              <h3 className="mb-2 font-semibold text-[#1F1F1F]">
                The Physician BTC Fund provides exposure to institutional-grade Bitcoin strategies designed specifically for
                physicians and medical professionals.
              </h3>
              <ul className="mb-4 list-disc pl-6 text-xs text-[#6B7280]">
                <li>Long-term BTC exposure</li>
                <li>Optimized for tax-advantaged accounts</li>
                <li>Low operational friction</li>
              </ul>
              <p className="text-xs leading-relaxed text-[#6B7280]">
                Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry&apos;s
                standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a
                type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting,
                remaining essentially unchanged.
              </p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
