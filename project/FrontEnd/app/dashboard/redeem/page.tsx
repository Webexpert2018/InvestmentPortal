'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import Link from 'next/link';
import { MoreVertical } from 'lucide-react';

type RedemptionRow = {
  id: string;
  requestId: string;
  amount: string;
  units: string;
  destinationBank: string;
  status: 'Settled' | 'Pending' | 'Rejected';
  requestedDate: string;
};

const rows: RedemptionRow[] = [
  {
    id: '1',
    requestId: 'RED-123456',
    amount: '$12,000.50',
    units: '250',
    destinationBank: 'Checking Account - ****1234',
    status: 'Settled',
    requestedDate: 'Jan 25, 2026',
  },
  {
    id: '2',
    requestId: 'RED-123457',
    amount: '$12,000.50',
    units: '250',
    destinationBank: 'Checking Account - ****1234',
    status: 'Pending',
    requestedDate: 'Jan 25, 2026',
  },
  {
    id: '3',
    requestId: 'RED-123458',
    amount: '$12,000.50',
    units: '250',
    destinationBank: 'Checking Account - ****1234',
    status: 'Rejected',
    requestedDate: 'Jan 25, 2026',
  },
  {
    id: '4',
    requestId: 'RED-123459',
    amount: '$12,000.50',
    units: '250',
    destinationBank: 'Checking Account - ****1234',
    status: 'Pending',
    requestedDate: 'Jan 25, 2026',
  },
  {
    id: '5',
    requestId: 'RED-123460',
    amount: '$12,000.50',
    units: '250',
    destinationBank: 'Checking Account - ****1234',
    status: 'Pending',
    requestedDate: 'Jan 25, 2026',
  },
];

function statusClass(status: RedemptionRow['status']) {
  switch (status) {
    case 'Settled':
      return 'bg-[#E8FBF1] text-[#1F7A4D]';
    case 'Rejected':
      return 'bg-[#FEECEC] text-[#D14343]';
    default:
      return 'bg-[#FFF7E0] text-[#C27A21]';
  }
}

export default function RedeemPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  const totalPages = 3; // static pagination UI to match Figma

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-8xl px-4 py-6 font-helvetica text-[#1F1F1F]">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="font-goudy text-sm sm:text-xl leading-[28px]">Redeem</h1>
            <p className="mt-1 text-xs text-[#8E8E93]">
              View all your redemption requests, their status, and payout details.
            </p>
          </div>
          <Link
            href="/dashboard/redeem/new"
            className="rounded-full bg-[#FBCB4B] px-6 py-2 text-sm font-medium text-[#1F1F1F] shadow-sm hover:bg-[#F9B800]"
          >
            Redemption Request
          </Link>
        </div>

        <div className="mt-4 overflow-hidden rounded-md bg-white shadow-sm">
          <div className="overflow-x-auto bg-white p-5">
            <table className="min-w-full text-xs text-[#4B4B4B]">
              <thead className="bg-[#F8FAFC] text-[11px] uppercase tracking-wide text-[#8E8E93]">
                <tr>
                  <th className="px-6 py-3 text-left font-medium">Request ID</th>
                  <th className="px-6 py-3 text-left font-medium">Amount</th>
                  <th className="px-6 py-3 text-left font-medium">Units Redeemed</th>
                  <th className="px-6 py-3 text-left font-medium">Destination Bank</th>
                  <th className="px-6 py-3 text-left font-medium">Status</th>
                  <th className="px-6 py-3 text-left font-medium">Requested Date</th>
                  <th className="px-6 py-3 text-right font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F1F1] bg-white text-[12px]">
                {rows.map((row) => (
                  <tr key={row.id} className="hover:bg-[#F9FAFB]">
                    <td className="px-6 py-3 align-middle text-[#1F1F1F]">{row.requestId}</td>
                    <td className="px-6 py-3 align-middle">{row.amount}</td>
                    <td className="px-6 py-3 align-middle">{row.units}</td>
                    <td className="px-6 py-3 align-middle">{row.destinationBank}</td>
                    <td className="px-6 py-3 align-middle">
                      <span className={`inline-flex rounded-full px-3 py-1 text-[11px] ${statusClass(row.status)}`}>
                        {row.status}
                      </span>
                    </td>
                    <td className="px-6 py-3 align-middle">{row.requestedDate}</td>
                    <td className="px-6 py-3 align-middle">
                      <div className="relative flex justify-end">
                        <button
                          type="button"
                          onClick={() =>
                            setActiveMenuId((prev) => (prev === row.id ? null : row.id))
                          }
                          className="rounded-full p-1.5 text-[#4B4B4B] hover:bg-[#F3F4F6]"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>

                        {activeMenuId === row.id && (
                          <>
                            <div
                              className="fixed inset-0 z-10"
                              onClick={() => setActiveMenuId(null)}
                            />
                            <div className="absolute right-0 top-full z-20 mt-2 w-40 rounded-lg border border-[#E5E5EA] bg-white py-1 text-[11px] text-[#4B4B4B] shadow-lg">
                              <Link
                                href="/dashboard/funds/1"
                                className="block w-full px-4 py-2 text-left hover:bg-[#F9FAFB]"
                              >
                                View Fund Details
                              </Link>
                              <button
                                type="button"
                                onClick={() => setActiveMenuId(null)}
                                className="block w-full px-4 py-2 text-left hover:bg-[#F9FAFB]"
                              >
                                Cancel
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between border-t border-[#F1F1F1] px-6 py-4 text-xs text-[#4B4B4B]">
            <button
              type="button"
              className="flex items-center gap-1 text-[#4B4B4B] disabled:opacity-40"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            >
              &lt; Previous
            </button>
            <div className="flex items-center gap-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  type="button"
                  onClick={() => setCurrentPage(page)}
                  className={`h-6 w-6 rounded text-xs font-medium ${
                    currentPage === page ? 'bg-[#274583] text-white' : 'text-[#4B4B4B] hover:bg-[#F3F4F6]'
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>
            <button
              type="button"
              className="flex items-center gap-1 text-[#4B4B4B] disabled:opacity-40"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            >
              Next &gt;
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
