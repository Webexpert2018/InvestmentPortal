'use client';

import { useEffect, useState } from 'react';
import { Search, ChevronDown, MoreVertical, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DashboardLayout } from '@/components/DashboardLayout';
import Link from 'next/link';
import { apiClient } from '@/lib/api/client';

export default function FundingRequestsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [fundStatusFilter, setFundStatusFilter] = useState('all');
  const [paymentTypeFilter, setPaymentTypeFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  const [investments, setInvestments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiClient.getAllInvestments();
      // console.log('✅ Fetched Funding Requests:', data);
      setInvestments(data || []);
    } catch (error: any) {
      console.error('❌ Error fetching funding requests:', error);
      setError(error.message || 'Failed to fetch funding requests');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending':
      case 'Subscription Submitted':
      case 'Awaiting Funding':
        return 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/30 border border-transparent dark:border-orange-800/50';
      case 'Rejected':
        return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 border border-transparent dark:border-red-800/50';
      case 'Approved':
      case 'Funds Received':
      case 'Units Issued':
        return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30 border border-transparent dark:border-green-800/50';
      default:
        return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800';
    }
  };

  const formatCurrency = (val: number | string) => {
    const num = typeof val === 'string' ? parseFloat(val) : val;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(num || 0);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Filter and Search logic
  const filteredRequests = (investments || []).filter((req) => {
    const investorName = (req.investor_name || 'unknown investor').toLowerCase();
    const requestId = `FUN-${req.id}`.toLowerCase();

    const matchesSearch =
      investorName.includes(searchQuery.toLowerCase()) ||
      requestId.includes(searchQuery.toLowerCase());

    // Status filter logic (forced Pending in UI, but keep DB status for filtering)
    const rawStatus = (req.status || 'Pending');
    const status = rawStatus.toLowerCase();

    let matchesStatus = fundStatusFilter === 'all';
    if (!matchesStatus) {
      if (fundStatusFilter === 'pending') {
        matchesStatus = status.includes('pending') || status.includes('submitted');
      } else if (fundStatusFilter === 'approved') {
        matchesStatus = status.includes('approved') || status.includes('received') || status.includes('issued');
      } else {
        matchesStatus = status.includes(fundStatusFilter.toLowerCase());
      }
    }

    const matchesPayment = paymentTypeFilter === 'all' || 'wire'.includes(paymentTypeFilter.toLowerCase());

    return matchesSearch && matchesStatus && matchesPayment;
  });

  const itemsPerPage = 7;
  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentRequests = filteredRequests.slice(startIndex, endIndex);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-10 w-10 text-[#1F3B6E] dark:text-blue-400 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Connection Error</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-2">{error}</p>
          <Button onClick={fetchData} className="mt-6 bg-[#1F3B6E] text-white px-6 py-2 rounded-full">
            Try Again
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-0">
        {/* Header */}
        <div className="mb-8 font-helvetica">
          <h1 className="text-xl sm:text-3xl font-bold text-[#1F1F1F] dark:text-gray-100 mb-2 font-goudy">Funding Requests</h1>
          <p className="text-gray-600 dark:text-gray-400">Review and manage incoming investment funding requests.</p>
        </div>

        {/* Filters and Search */}
        <div className="bg-white dark:bg-[#1C1C1C] rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 p-4 md:p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4 lg:items-center">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Find something here..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-800 text-[#111827] dark:text-white border border-gray-100 dark:border-gray-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1F3B6E]/10 focus:border-[#1F3B6E] transition-all"
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-3">

              {/* Fund Status Filter */}
              <div className="relative">
                <select
                  value={fundStatusFilter}
                  onChange={(e) => setFundStatusFilter(e.target.value)}
                  className="appearance-none text-[#111827] dark:text-white w-full md:w-auto px-4 py-2 pr-10 border border-gray-200 dark:border-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1F3B6E] focus:border-transparent bg-white dark:bg-[#1C1C1C] cursor-pointer"
                >
                  <option value="all" className="bg-white dark:bg-gray-800">Fund Status</option>
                  <option value="pending" className="bg-white dark:bg-gray-800">Pending</option>
                  <option value="approved" className="bg-white dark:bg-gray-800">Approved</option>
                  <option value="rejected" className="bg-white dark:bg-gray-800">Rejected</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5 pointer-events-none" />
              </div>

              {/* Payment Type Filter */}
              <div className="relative">
                <select
                  value={paymentTypeFilter}
                  onChange={(e) => setPaymentTypeFilter(e.target.value)}
                  className="appearance-none text-[#111827] dark:text-white w-full md:w-auto px-4 py-2 pr-10 border border-gray-200 dark:border-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1F3B6E] focus:border-transparent bg-white dark:bg-[#1C1C1C] cursor-pointer"
                >
                  <option value="all" className="bg-white dark:bg-gray-800">Payment Type</option>
                  <option value="wire" className="bg-white dark:bg-gray-800">Wire</option>
                  <option value="ach" className="bg-white dark:bg-gray-800">ACH</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-[#1C1C1C] rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50/50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800">
                  <th className="px-6 py-4 text-left text-[13px] font-bold text-[#4B4B4B] dark:text-gray-300 uppercase tracking-wider whitespace-nowrap">Request ID</th>
                  <th className="px-6 py-4 text-left text-[13px] font-bold text-[#4B4B4B] dark:text-gray-300 uppercase tracking-wider whitespace-nowrap">Investor Name</th>
                  <th className="px-6 py-4 text-left text-[13px] font-bold text-[#4B4B4B] dark:text-gray-300 uppercase tracking-wider whitespace-nowrap">Account Type</th>
                  <th className="px-6 py-4 text-left text-[13px] font-bold text-[#4B4B4B] dark:text-gray-300 uppercase tracking-wider whitespace-nowrap">Amount</th>
                  <th className="px-6 py-4 text-left text-[13px] font-bold text-[#4B4B4B] dark:text-gray-300 uppercase tracking-wider whitespace-nowrap">Payment</th>
                  <th className="px-6 py-4 text-left text-[13px] font-bold text-[#4B4B4B] dark:text-gray-300 uppercase tracking-wider whitespace-nowrap">Submitted Date</th>
                  <th className="px-6 py-4 text-left text-[13px] font-bold text-[#4B4B4B] dark:text-gray-300 uppercase tracking-wider whitespace-nowrap">Status</th>
                  <th className="px-6 py-4 text-left text-[13px] font-bold text-[#4B4B4B] dark:text-gray-300 uppercase tracking-wider whitespace-nowrap">Funding History</th>
                  <th className="px-6 py-4 text-left text-[13px] font-bold text-[#4B4B4B] dark:text-gray-300 uppercase tracking-wider whitespace-nowrap">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {currentRequests.length > 0 ? (
                  currentRequests.map((request) => {
                    const investorName = request.investor_name || 'Unknown Investor';
                    const requestId = `FUN-${(request.id?.substring(0, 6) || '').toUpperCase()}`;

                    // Initials for fallback
                    const initials = investorName.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase();

                    return (
                      <tr key={request.id} className="hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-800/50 transition-colors border-b border-gray-50 dark:border-gray-800 last:border-0">
                        <td className="px-6 py-5 whitespace-nowrap">
                          <Link
                            href={`/dashboard/funding-requests/${request.id}`}
                            className="font-bold text-[#1F3B6E] dark:text-blue-400 hover:text-blue-600 transition-colors"
                          >
                            {requestId}
                          </Link>
                        </td>
                        <td className="px-6 py-5 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            {request.avatar_url ? (
                              <img
                                src={request.avatar_url}
                                alt={investorName}
                                className="w-9 h-9 rounded-full object-cover border border-gray-100 dark:border-gray-800 shadow-sm"
                                onError={(e) => {
                                  (e.target as any).style.display = 'none';
                                  (e.target as any).nextSibling.style.display = 'flex';
                                }}
                              />
                            ) : null}
                            <div
                              className="w-9 h-9 rounded-full bg-gradient-to-br from-[#1F3B6E] to-[#6B7FBA] flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-sm"
                              style={{ display: request.avatar_url ? 'none' : 'flex' }}
                            >
                              {initials}
                            </div>
                            <Link
                              href={`/dashboard/investor/${request.user_id}?from=funding-requests`}
                              className="font-bold text-gray-800 dark:text-gray-200 hover:text-[#1F3B6E] dark:text-blue-400 transition-colors"
                            >
                              {investorName}
                            </Link>
                          </div>
                        </td>
                        <td className="px-6 py-5 text-gray-700 dark:text-gray-300 font-medium whitespace-nowrap capitalize">
                          {request.account_type || 'Personal'}
                        </td>
                        <td className="px-6 py-5 text-gray-900 dark:text-gray-100 font-bold whitespace-nowrap">
                          {formatCurrency(request.investment_amount)}
                        </td>
                        <td className="px-6 py-5 text-gray-600 dark:text-gray-400 font-medium whitespace-nowrap">Wire</td>
                        <td className="px-6 py-5 text-gray-500 dark:text-gray-400 font-medium whitespace-nowrap">{formatDate(request.created_at)}</td>
                        <td className="px-6 py-5 whitespace-nowrap">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${getStatusColor(request.status || 'Pending')}`}>
                            {request.status || 'Pending'}
                          </span>
                        </td>
                        <td className="px-6 py-5 whitespace-nowrap">
                          <Link href={`/dashboard/investor/${request.user_id}?tab=funding&from=funding-requests`}>
                            <button className="px-5 py-2 bg-white dark:bg-[#1C1C1C] border border-gray-200 dark:border-gray-800 text-[#1F3B6E] dark:text-blue-400 text-[11px] font-bold rounded-full hover:bg-[#1F3B6E] hover:text-white hover:border-[#1F3B6E] transition-all shadow-sm">
                              View History
                            </button>
                          </Link>
                        </td>
                        <td className="px-6 py-5 whitespace-nowrap">
                          <Link href={`/dashboard/funding-requests/${request.id}`}>
                            <button className="px-5 py-2 bg-white dark:bg-[#1C1C1C] border border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400 text-[11px] font-bold rounded-full hover:bg-[#1F3B6E] hover:text-white hover:border-[#1F3B6E] transition-all shadow-sm">
                              View Request
                            </button>
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={9} className="px-6 py-20 text-center">
                      <div className="flex flex-col items-center justify-center text-gray-400">
                        <Search className="h-10 w-10 mb-2 opacity-20" />
                        <p className="text-sm">No funding requests found.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {filteredRequests.length > itemsPerPage && (
            <div className="flex items-center justify-center px-6 py-4 border-t border-gray-200 dark:border-gray-800 font-helvetica">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:text-gray-100 disabled:opacity-40 disabled:cursor-not-allowed font-medium"
              >
                Previous
              </button>

              <div className="flex gap-2">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-8 h-8 rounded font-medium transition-colors ${currentPage === page
                      ? 'bg-[#1F3B6E] text-white'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                  >
                    {page}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:text-gray-100 disabled:opacity-40 disabled:cursor-not-allowed font-medium"
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
