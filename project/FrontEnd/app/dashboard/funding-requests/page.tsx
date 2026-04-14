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
  const [activeDropdown, setActiveDropdown] = useState<string | number | null>(null);
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
      console.log('✅ Fetched Funding Requests:', data);
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
        return 'text-orange-600 bg-orange-50';
      case 'Rejected':
        return 'text-red-600 bg-red-50';
      case 'Approved':
      case 'Funds Received':
      case 'Units Issued':
        return 'text-green-600 bg-green-50';
      default:
        return 'text-gray-600 bg-gray-50';
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
          <Loader2 className="h-10 w-10 text-[#1F3B6E] animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900">Connection Error</h2>
          <p className="text-gray-500 mt-2">{error}</p>
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
          <h1 className="text-xl sm:text-3xl font-bold text-[#1F1F1F] mb-2 font-goudy">Funding Requests</h1>
          <p className="text-gray-600">Review and manage incoming investment funding requests.</p>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Find something here..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1F3B6E] focus:border-transparent"
              />
            </div>

            {/* Fund Status Filter */}
            <div className="relative">
              <select
                value={fundStatusFilter}
                onChange={(e) => setFundStatusFilter(e.target.value)}
                className="appearance-none px-4 py-2 pr-10 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1F3B6E] focus:border-transparent bg-white cursor-pointer"
              >
                <option value="all">Fund Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5 pointer-events-none" />
            </div>

            {/* Payment Type Filter */}
            <div className="relative">
              <select
                value={paymentTypeFilter}
                onChange={(e) => setPaymentTypeFilter(e.target.value)}
                className="appearance-none px-4 py-2 pr-10 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1F3B6E] focus:border-transparent bg-white cursor-pointer"
              >
                <option value="all">Payment Type</option>
                <option value="wire">Wire</option>
                <option value="ach">ACH</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-[#4B4B4B] capitalize">Request ID</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-[#4B4B4B] capitalize">Investor Name</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-[#4B4B4B] capitalize">Amount</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-[#4B4B4B] capitalize">Payment</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-[#4B4B4B] capitalize">Submitted Date</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-[#4B4B4B] capitalize">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-[#4B4B4B] capitalize">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {currentRequests.length > 0 ? (
                  currentRequests.map((request) => {
                    const investorName = request.investor_name || 'Unknown Investor';
                    const requestId = `FUN-${request.id?.substring(0, 6) || request.id}`;
                    
                    // Initials for fallback
                    const initials = investorName.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase();

                    return (
                      <tr key={request.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <Link 
                            href={`/dashboard/funding-requests/${request.id}`}
                            className="font-medium text-[#1F3B6E] hover:underline"
                          >
                            {requestId}
                          </Link>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            {request.avatar_url ? (
                              <img 
                                src={request.avatar_url} 
                                alt={investorName} 
                                className="w-10 h-10 rounded-full object-cover border border-gray-100 shadow-sm"
                                onError={(e) => {
                                  // Fallback if image fails to load
                                  (e.target as any).style.display = 'none';
                                  (e.target as any).nextSibling.style.display = 'flex';
                                }}
                              />
                            ) : null}
                            <div 
                              className="w-10 h-10 rounded-full bg-gradient-to-br from-[#1F3B6E] to-[#6B7FBA] flex items-center justify-center text-white font-semibold flex-shrink-0"
                              style={{ display: request.avatar_url ? 'none' : 'flex' }}
                            >
                              {initials}
                            </div>
                            <Link 
                              href={`/dashboard/investor/${request.user_id}`}
                              className="font-medium text-gray-900 hover:text-[#1F3B6E] hover:underline transition-colors"
                            >
                              {investorName}
                            </Link>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-900 font-medium">
                          {formatCurrency(request.investment_amount)}
                        </td>
                        <td className="px-6 py-4 text-gray-600">Wire</td>
                        <td className="px-6 py-4 text-gray-600">{formatDate(request.created_at)}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(request.status || 'Pending')}`}>
                            {request.status || 'Pending'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="relative">
                            <button
                              onClick={() => setActiveDropdown(activeDropdown === request.id ? null : request.id)}
                              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                              <MoreVertical className="h-5 w-5 text-gray-600" />
                            </button>

                            {activeDropdown === request.id && (
                              <>
                                <div
                                  className="fixed inset-0 z-10"
                                  onClick={() => setActiveDropdown(null)}
                                />
                                <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-20">
                                  <Link href={`/dashboard/funding-requests/${request.id}`}>
                                    <button className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-50 transition-colors">
                                      View Request
                                    </button>
                                  </Link>
                                </div>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="px-6 py-20 text-center">
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
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 text-gray-600 hover:text-gray-900 disabled:opacity-40 disabled:cursor-not-allowed font-medium"
              >
                Previous
              </button>

              <div className="flex gap-2">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-10 h-10 rounded-lg font-medium transition-colors ${currentPage === page
                      ? 'bg-[#1F3B6E] text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                      }`}
                  >
                    {page}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 text-gray-600 hover:text-gray-900 disabled:opacity-40 disabled:cursor-not-allowed font-medium"
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
