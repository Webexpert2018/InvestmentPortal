'use client';

import { useState, useEffect } from 'react';
import { Search, ChevronDown, MoreVertical, RefreshCw, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DashboardLayout } from '@/components/DashboardLayout';
import { apiClient } from '@/lib/api/client';
import { toast } from 'sonner';
import Link from 'next/link';

export default function RedemptionRequestsPage() {
  const [loading, setLoading] = useState(true);
  const [redemptions, setRedemptions] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [activeDropdown, setActiveDropdown] = useState<{ id: string; top: number; left: number } | null>(null);

  useEffect(() => {
    fetchRedemptions();
  }, []);

  const fetchRedemptions = async () => {
    try {
      setLoading(true);
      const data = await apiClient.getAllRedemptions();
      setRedemptions(data);
    } catch (error) {
      console.error('Error fetching redemptions:', error);
      toast.error('Failed to load redemption requests');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      await apiClient.updateRedemptionStatus(id, status);
      toast.success(`Request marked as ${status}`);
      setActiveDropdown(null);
      fetchRedemptions(); // Refresh list
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update request status');
    }
  };

  const filteredRequests = redemptions.filter(req => {
    const matchesSearch = 
      req.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.investor_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.fund_name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || req.status.toLowerCase() === statusFilter.toLowerCase();
    
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending':
        return 'text-orange-600 bg-orange-50 font-medium border border-orange-100';
      case 'Rejected':
        return 'text-red-600 bg-red-50 font-medium border border-red-100';
      case 'Approved':
        return 'text-green-600 bg-green-50 font-medium border border-green-100';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const itemsPerPage = 8;
  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentRequests = filteredRequests.slice(startIndex, startIndex + itemsPerPage);

  // Helper to format currency
  const formatCurrency = (amount: any) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(parseFloat(amount));
  };

  return (
    <DashboardLayout>
      <div className="p-0">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-xl sm:text-3xl font-bold text-[#1F1F1F] mb-2 tracking-tight">Redemption Requests</h1>
            <p className="text-gray-500">Review and process investor withdrawal and capital redemption requests.</p>
          </div>
          <Button 
            onClick={fetchRedemptions} 
            variant="outline" 
            className="flex items-center gap-2"
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search by ID, investor, or fund..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1F3B6E]/20 focus:border-[#1F3B6E] transition-all"
              />
            </div>

            {/* Status Filter */}
            <div className="relative min-w-[160px]">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full appearance-none px-4 py-2.5 pr-10 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1F3B6E]/20 focus:border-[#1F3B6E] bg-white cursor-pointer transition-all"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#F8FAFC] border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Request ID</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Investor Name</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Fund</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Units</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Submitted</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-gray-400 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                      <div className="flex flex-col items-center gap-2">
                        <RefreshCw className="h-8 w-8 animate-spin text-gray-300" />
                        <span>Loading requests...</span>
                      </div>
                    </td>
                  </tr>
                ) : currentRequests.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                      No matching redemption requests found.
                    </td>
                  </tr>
                ) : (
                  currentRequests.map((request) => (
                    <tr key={request.id} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <Link 
                          href={`/dashboard/redemption-requests/${request.id}`}
                          className="text-sm font-bold text-[#1F3B6E] uppercase hover:underline cursor-pointer"
                        >
                          RED-{request.id.substring(0, 6).toUpperCase()}
                        </Link>
                      </td>
                      <td className="px-6 py-4">
                        <Link 
                          href={`/dashboard/investor/${request.investor_id}`}
                          className="flex items-center gap-3 group/name cursor-pointer"
                        >
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#1F3B6E] to-[#6B7FBA] flex items-center justify-center text-white text-sm font-bold shadow-sm overflow-hidden group-hover/name:ring-2 group-hover/name:ring-[#1F3B6E]/20 transition-all">
                            {(request.avatar_url && request.avatar_url !== 'null') ? (
                              <img src={request.avatar_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                              request.investor_name?.split(' ').map((n: string) => n[0]).join('')
                            )}
                          </div>
                          <span className="font-semibold text-gray-900 group-hover/name:text-[#1F3B6E] group-hover/name:underline transition-colors">{request.investor_name}</span>
                        </Link>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-600">{request.fund_name}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-medium text-gray-900">{parseFloat(request.units).toFixed(4)}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-bold text-[#1F3B6E]">{formatCurrency(request.amount)}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-500">{new Date(request.created_at).toLocaleDateString()}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold leading-none ${getStatusColor(request.status)}`}>
                          {request.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="relative inline-block text-left">
                          <button
                            id={`redemption-menu-trigger-${request.id}`}
                            onClick={(e) => {
                              const rect = e.currentTarget.getBoundingClientRect();
                              setActiveDropdown(activeDropdown === request.id ? null : {
                                id: request.id,
                                top: rect.bottom + window.scrollY,
                                left: rect.right - 192, // 192 is the width of the dropdown (w-48)
                              });
                            }}
                            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors inline-flex group-hover:bg-gray-100"
                          >
                            <MoreVertical className="h-5 w-5 text-gray-400 group-hover:text-gray-600" />
                          </button>
                          
                          {(activeDropdown as any)?.id === request.id && (
                            <>
                              <div 
                                className="fixed inset-0 z-[100]"
                                onClick={() => setActiveDropdown(null)}
                              />
                              <div 
                                className="fixed w-48 bg-white rounded-xl shadow-2xl border border-gray-100 py-2 z-[101] animate-in fade-in slide-in-from-top-1 duration-200"
                                style={{ 
                                  top: `${(activeDropdown as any).top - window.scrollY}px`, 
                                  left: `${(activeDropdown as any).left}px` 
                                }}
                              >
                                <div className="px-4 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-50 mb-1">
                                  Actions
                                </div>
                                
                                <Link href={`/dashboard/redemption-requests/${request.id}`}>
                                  <button className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2">
                                    <Search className="h-4 w-4" />
                                    View Details
                                  </button>
                                </Link>
                              </div>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {!loading && filteredRequests.length > 0 && (
            <div className="flex items-center justify-center px-6 py-6 bg-[#F8FAFC] border-t border-gray-100">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 text-sm text-gray-500 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed font-bold transition-colors"
              >
                Previous
              </button>
              
              <div className="flex gap-2">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-9 h-9 rounded-lg text-xs font-bold transition-all ${
                      currentPage === page
                        ? 'bg-[#1F3B6E] text-white shadow-md shadow-[#1F3B6E]/20'
                        : 'text-gray-500 hover:bg-white hover:shadow-sm border border-transparent hover:border-gray-200'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 text-sm text-gray-500 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed font-bold transition-colors"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
