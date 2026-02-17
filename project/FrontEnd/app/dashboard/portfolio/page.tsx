'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/DashboardLayout';
import { MoreVertical } from 'lucide-react';

const investments = [
  {
    id: 1,
    fundName: 'ABC Fund',
    accountType: 'Personal',
    units: 500,
    currentNav: '$150.25',
    currentValue: '$75,143.00',
    costBasis: '$70,000.00',
    gainLoss: '+$5,143.00 (7.35%)',
    gainPositive: true,
  },
  {
    id: 2,
    fundName: 'ABC Fund',
    accountType: 'IRA',
    units: 500,
    currentNav: '$150.25',
    currentValue: '$75,143.00',
    costBasis: '$70,000.00',
    gainLoss: '-$5,143.00 (7.35%)',
    gainPositive: false,
  },
  {
    id: 3,
    fundName: 'ABC Fund',
    accountType: 'IRA',
    units: 500,
    currentNav: '$150.25',
    currentValue: '$75,143.00',
    costBasis: '$70,000.00',
    gainLoss: '+$5,143.00 (7.35%)',
    gainPositive: true,
  },
  {
    id: 4,
    fundName: 'ABC Fund',
    accountType: 'IRA',
    units: 500,
    currentNav: '$150.25',
    currentValue: '$75,143.00',
    costBasis: '$70,000.00',
    gainLoss: '+$5,143.00 (7.35%)',
    gainPositive: true,
  },
  {
    id: 5,
    fundName: 'ABC Fund',
    accountType: 'IRA',
    units: 500,
    currentNav: '$150.25',
    currentValue: '$75,143.00',
    costBasis: '$70,000.00',
    gainLoss: '+$5,143.00 (7.35%)',
    gainPositive: true,
  },
];

const fundCards = [1, 2, 3, 4];

export default function PortfolioPage() {
  const [activeTab, setActiveTab] = useState<'investments' | 'fundInfo'>('investments');
  const [openActionMenuId, setOpenActionMenuId] = useState<number | null>(null);

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
          <button className="rounded-full bg-[#FFC63F] px-6 py-2 text-sm font-semibold text-[#1F1F1F] hover:bg-[#F1B92E]">
            Invest Now
          </button>
        </div>
        {/* Tabs + summary card */}
        <div className="rounded-2xl bg-white px-8 pb-8 pt-6">
          <div className="flex gap-8 text-sm">
            <button
              type="button"
              onClick={() => setActiveTab('investments')}
              className={`pb-3 font-medium relative ${
                activeTab === 'investments' ? 'text-[#1F3B6E]' : 'text-[#8E8E93]'
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
              className={`pb-3 font-medium relative ${
                activeTab === 'fundInfo' ? 'text-[#1F3B6E]' : 'text-[#8E8E93]'
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
                <p className="mt-3 text-2xl font-semibold text-[#1F1F1F]">$2569.00</p>
              </div>
              <div className="rounded-xl border border-[#F2F2F2] px-6 py-5">
                <p className="text-xs font-medium uppercase tracking-wide text-[#A0A0A0]">
                  Total Units
                </p>
                <p className="mt-3 text-2xl font-semibold text-[#1F1F1F]">2502</p>
              </div>
              <div className="rounded-xl border border-[#F2F2F2] px-6 py-5">
                <p className="text-xs font-medium uppercase tracking-wide text-[#A0A0A0]">
                  YTD Return
                </p>
                <p className="mt-3 text-2xl font-semibold text-[#2BB673]">+12.8%</p>
              </div>
            </div>
          )}

          {activeTab === 'fundInfo' && (
            <div className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-2">
              {fundCards.map((id) => (
                <Link
                  key={id}
                  href={`/dashboard/funds/${id}`}
                  className="flex items-center rounded-2xl bg-[#F7F8FA] p-4 pr-6 transition hover:bg-[#F1F2F5]"
                >
                  <div className="flex items-center gap-4">
                    <img
                      src="/images/strive_funds.jpg"
                      alt="Strive Enterprise Fund"
                      className="h-20 w-36 rounded-lg object-cover"
                    />
                    <div>
                      <h3 className="font-goudy text-base text-[#1F1F1F]">Strive Enterprise Fund</h3>
                      <p className="mt-1 text-xs text-[#8E8E93]">View Fund Details</p>
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
                      <th className="px-4 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 text-sm">
                    {investments.map((row) => (
                      <tr key={row.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-[#1F1F1F]">{row.fundName}</td>
                        <td className="px-4 py-3 text-[#4B4B4B]">{row.accountType}</td>
                        <td className="px-4 py-3 text-[#4B4B4B]">{row.units}</td>
                        <td className="px-4 py-3 text-[#4B4B4B]">{row.currentNav}</td>
                        <td className="px-4 py-3 text-[#4B4B4B]">{row.currentValue}</td>
                        <td className="px-4 py-3 text-[#4B4B4B]">{row.costBasis}</td>
                        <td className="px-4 py-3 font-medium">
                          <span className={row.gainPositive ? 'text-[#2BB673]' : 'text-[#E04343]'}>
                            {row.gainLoss}
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
                              <div className="absolute right-0 top-full z-20 mt-1 w-[130px] rounded-[6px] border border-[#ECECEC] bg-white py-1 shadow-[0_6px_16px_rgba(0,0,0,0.08)]">
                                <Link
                                  href={`/dashboard/portfolio/${row.id}`}
                                  className="block px-3 py-2 text-left text-[12px] text-[#5F5F5F] hover:bg-[#F8F8F8]"
                                >
                                  View Fund Details
                                </Link>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 flex items-center justify-between text-xs text-[#8E8E93]">
                <span>Showing 1-5 of 5</span>
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
