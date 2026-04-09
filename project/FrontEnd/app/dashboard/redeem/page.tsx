'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import Link from 'next/link';
import { MoreVertical, Loader2, Search, ExternalLink, XCircle } from 'lucide-react';
import { apiClient } from '@/lib/api/client';
import { toast } from 'sonner';

type Status = 'Settled' | 'Pending' | 'Rejected' | 'Approved' | 'Cancelled';

function statusClass(status: Status) {
  switch (status) {
    case 'Settled':
    case 'Approved':
      return 'bg-[#E8FBF1] text-[#1F7A4D] border border-[#B7EB8F]';
    case 'Rejected':
    case 'Cancelled':
      return 'bg-[#FEECEC] text-[#D14343] border border-[#FFA39E]';
    default:
      return 'bg-[#FFF7E0] text-[#C27A21] border border-[#FFE58F]';
  }
}

export default function RedeemPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [redemptions, setRedemptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await apiClient.getMyRedemptions();
      setRedemptions(data);
    } catch (error) {
      console.error('Error fetching redemptions:', error);
      toast.error('Failed to load redemption requests');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelRequest = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this redemption request?')) return;
    
    try {
      await apiClient.cancelRedemption(id);
      toast.success('Redemption request cancelled successfully');
      setActiveMenuId(null);
      fetchData();
    } catch (error: any) {
      console.error('Error cancelling redemption:', error);
      toast.error(error.message || 'Failed to cancel request');
    }
  };

  const totalPages = Math.ceil(redemptions.length / itemsPerPage) || 1;
  const currentRows = redemptions.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const formatCurrency = (val: number | string) => {
    const num = typeof val === 'string' ? parseFloat(val) : val;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(num);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-8xl px-4 py-8 font-helvetica text-[#1F1F1F]">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="font-goudy text-xl sm:text-3xl font-bold leading-[36px] tracking-tight">Redeem</h1>
            <p className="mt-1 text-sm text-[#8E8E93]">
              View all your redemption requests, their status, and payout details.
            </p>
          </div>
          <Link
            href="/dashboard/redeem/new"
            className="rounded-full bg-[#FBCB4B] px-8 py-2.5 text-sm font-bold text-[#1F1F1F] shadow-md hover:bg-[#F9B800] transition-all transform hover:-translate-y-0.5"
          >
            Redemption Request
          </Link>
        </div>

        <div className="overflow-hidden rounded-2xl bg-white shadow-sm border border-gray-100">
          <div className="overflow-x-auto bg-white p-6">
            <table className="min-w-full text-xs text-[#4B4B4B]">
              <thead className="bg-[#F8FAFC] text-[11px] uppercase tracking-widest text-[#8E8E93]">
                <tr className="border-b border-gray-100">
                  <th className="px-6 py-4 text-left font-bold">Request ID</th>
                  <th className="px-6 py-4 text-left font-bold">Fund</th>
                  <th className="px-6 py-4 text-left font-bold">Amount</th>
                  <th className="px-6 py-4 text-left font-bold">Units Redeemed</th>
                  <th className="px-6 py-4 text-left font-bold">Destination Bank</th>
                  <th className="px-6 py-4 text-left font-bold">Status</th>
                  <th className="px-6 py-4 text-left font-bold">Requested Date</th>
                  <th className="px-6 py-4 text-right font-bold tracking-normal uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F9F9F9] bg-white text-[13px]">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-20 text-center">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <Loader2 className="h-8 w-8 animate-spin text-[#274583] opacity-40" />
                        <span className="text-gray-400 font-medium">Fetching your requests...</span>
                      </div>
                    </td>
                  </tr>
                ) : currentRows.length > 0 ? (
                  currentRows.map((row) => (
                    <tr key={row.id} className="hover:bg-[#F9FAFB]/50 transition-colors group">
                      <td className="px-6 py-4 align-middle font-bold text-[#1F1F1F]">
                        RED-{row.id.substring(0, 6).toUpperCase()}
                      </td>
                      <td className="px-6 py-4 align-middle font-medium text-gray-700">
                        {row.fund_name}
                      </td>
                      <td className="px-6 py-4 align-middle font-bold text-[#1F3B6E]">
                        {formatCurrency(row.amount)}
                      </td>
                      <td className="px-6 py-4 align-middle font-medium text-gray-700">
                        {parseFloat(row.units).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                      </td>
                      <td className="px-6 py-4 align-middle text-gray-500 italic">
                        {row.bank_info?.label || 'Bank transfer'}
                      </td>
                      <td className="px-6 py-4 align-middle">
                        <span className={`inline-flex rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider shadow-sm ${statusClass(row.status)}`}>
                          {row.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 align-middle text-gray-500 font-medium">
                        {formatDate(row.created_at)}
                      </td>
                      <td className="px-6 py-4 align-middle">
                        <div className="relative flex justify-end">
                          <button
                            type="button"
                            onClick={() =>
                              setActiveMenuId((prev) => (prev === row.id ? null : row.id))
                            }
                            className="rounded-full p-2 text-gray-400 hover:bg-[#F3F4F6] hover:text-[#1F1F1F] transition-all"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </button>

                          {activeMenuId === row.id && (
                            <>
                              <div
                                className="fixed inset-0 z-10"
                                onClick={() => setActiveMenuId(null)}
                              />
                              <div className="absolute right-0 top-full z-20 mt-2 w-48 rounded-xl border border-gray-100 bg-white py-2 text-[12px] text-[#4B4B4B] shadow-xl animate-in fade-in slide-in-from-top-1 duration-200">
                                <div className="px-4 py-1 text-[10px] font-bold text-gray-300 uppercase tracking-widest border-b border-gray-50 mb-1">
                                  Management
                                </div>
                                <Link
                                  href={`/dashboard/redemption/${row.id}`}
                                  className="flex items-center gap-2 w-full px-4 py-2.5 text-left hover:bg-[#F9FAFB] hover:text-[#1F3B6E] transition-colors font-medium"
                                >
                                  <ExternalLink className="h-3.5 w-3.5" />
                                  View Details
                                </Link>
                                
                                {row.status === 'Pending' && (
                                  <button
                                    type="button"
                                    onClick={() => handleCancelRequest(row.id)}
                                    className="flex items-center gap-2 w-full px-4 py-2.5 text-left hover:bg-red-50 text-red-500 transition-colors font-medium border-t border-gray-50 mt-1"
                                  >
                                    <XCircle className="h-3.5 w-3.5" />
                                    Cancel Request
                                  </button>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-6 py-20 text-center text-[#8E8E93]">
                      <div className="flex flex-col items-center gap-2">
                        <Search className="h-8 w-8 opacity-20" />
                        <span className="text-sm font-medium">No redemption requests found.</span>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between border-t border-[#F1F1F1] px-8 py-6 text-[12px] bg-[#F8FAFC]/50">
            <button
              type="button"
              className="flex items-center gap-1 font-bold text-gray-400 hover:text-black transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
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
                  className={`h-8 w-8 rounded-lg text-xs font-bold transition-all shadow-sm ${
                    currentPage === page 
                      ? 'bg-[#1F3B6E] text-white shadow-[#1F3B6E]/20' 
                      : 'bg-white text-gray-500 hover:bg-gray-50 border border-gray-100'
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>
            <button
              type="button"
              className="flex items-center gap-1 font-bold text-gray-400 hover:text-black transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
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
