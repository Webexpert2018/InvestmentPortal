'use client';

import { useState } from 'react';
import { Search, MoreVertical, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DashboardLayout } from '@/components/DashboardLayout';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiClient, BASE_URL } from '@/lib/api/client';
import { toast } from 'sonner';
import { useEffect } from 'react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';

export default function FundsPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedFund, setSelectedFund] = useState<number | null>(null);

  const [fundsData, setFundsData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchFunds();
  }, []);

  const fetchFunds = async () => {
    setIsLoading(true);
    try {
      const data = await apiClient.getFunds();
      setFundsData(data);
    } catch (error: any) {
      toast.error(error.message || 'Failed to fetch funds');
    } finally {
      setIsLoading(false);
    }
  };

  const getFullImageUrl = (imagePath: string | null | undefined) => {
    if (!imagePath) return null;
    if (imagePath.startsWith('http')) return imagePath;
    if (imagePath.startsWith('/images/')) return imagePath; // Static assets in Frontend public folder
    return `${BASE_URL}${imagePath}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active':
        return 'text-[#059669] bg-[#ECFDF5]';
      case 'Closed':
        return 'text-[#DC2626] bg-[#FEF2F2]';
      case 'Draft':
        return 'text-[#2563EB] bg-[#EFF6FF]';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const formatAUM = (amount: any) => {
    const value = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(value)) return '$0';

    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(1)}K`;
    }
    return `$${value.toLocaleString()}`;
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  const itemsPerPage = 7;
  const filteredFunds = fundsData.filter(fund =>
    (fund.name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );
  const totalPages = Math.ceil(filteredFunds.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentFunds = filteredFunds.slice(startIndex, endIndex);

  // Reset to first page when searching
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const handleDelete = (fundId: number) => {
    setSelectedFund(fundId);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!selectedFund) return;
    try {
      await apiClient.deleteFund(selectedFund.toString());
      toast.success('Fund deleted successfully');
      fetchFunds();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete fund');
    } finally {
      setShowDeleteModal(false);
      setSelectedFund(null);
    }
  };

  return (
    <DashboardLayout>
      <div className="p-0">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-4xl font-bold text-[#1F1F1F] mb-1 font-goudy tracking-tight">Funds</h1>
            <p className="text-gray-500 font-medium">View, manage, and configure all funds.</p>
          </div>
          <Button
            onClick={() => router.push('/dashboard/funds/add')}
            className="bg-[#FCD34D] hover:bg-[#fbbf24] text-gray-900 px-7 py-3 rounded-full font-bold shadow-sm transition-all active:scale-95 whitespace-nowrap"
          >
            Add New Fund
          </Button>
        </div>

        <div className="bg-white p-2">
          {/* Search */}
          <div className="mb-8">
            <div className="relative max-w-md">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Find something here..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#1F3B6E]/10 focus:border-[#1F3B6E] transition-all"
              />
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full border-collapse">
                <thead className="bg-gray-50/50 border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-5 text-left text-sm font-semibold text-[#6B7280] whitespace-nowrap">Fund Name</th>
                    <th className="px-6 py-5 text-left text-sm font-semibold text-[#6B7280] whitespace-nowrap">Fund Start Date</th>
                    <th className="px-6 py-5 text-left text-sm font-semibold text-[#6B7280] whitespace-nowrap">Total Investors</th>
                    <th className="px-6 py-5 text-left text-sm font-semibold text-[#6B7280] whitespace-nowrap">Total AUM</th>
                    <th className="px-6 py-5 text-left text-sm font-semibold text-[#6B7280] whitespace-nowrap">Status</th>
                    <th className="px-6 py-5 text-left text-sm font-semibold text-[#6B7280] whitespace-nowrap pr-12 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {currentFunds.map((fund) => (
                    <tr key={fund.id} className="hover:bg-gray-50/50 transition-colors border-b border-gray-50 last:border-0">
                      <td className="px-6 py-5 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          {fund.image ? (
                            <img
                              src={getFullImageUrl(fund.image) || ''}
                              alt={fund.name}
                              className="w-10 h-10 rounded-full object-cover border border-gray-100 shadow-sm"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#1F3B6E] to-[#6B7FBA] flex items-center justify-center text-white font-bold text-xs shadow-sm">
                              {getInitials(fund.name)}
                            </div>
                          )}
                          <span className="font-medium text-gray-900">{fund.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-[13px] text-gray-600 font-medium whitespace-nowrap">{formatDate(fund.startDate)}</td>
                      <td className="px-6 py-5 text-[13px] text-gray-900 font-bold whitespace-nowrap">{fund.totalInvestors}</td>
                      <td className="px-6 py-5 text-[13px] font-bold text-[#1F3B6E] whitespace-nowrap">
                        {formatAUM(fund.totalAUM)}
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap">
                        <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${getStatusColor(fund.status)}`}>
                          {fund.status}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-center whitespace-nowrap pr-12">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                              <MoreVertical className="h-5 w-5 text-gray-600" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-32 bg-white z-50">
                            <DropdownMenuItem asChild>
                              <Link
                                href={`/dashboard/funds/${fund.id}`}
                                className="w-full px-4 py-2 cursor-pointer"
                              >
                                View
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link
                                href={`/dashboard/funds/${fund.id}/edit`}
                                className="w-full px-4 py-2 cursor-pointer"
                              >
                                Edit
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDelete(fund.id)}
                              className="w-full px-4 py-2 text-red-600 cursor-pointer focus:text-red-700"
                            >
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {currentFunds.length === 0 && !isLoading && (
                <div className="text-center py-12">
                  <p className="text-gray-500">No funds found matching "{searchQuery}"</p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-center gap-4 px-6 py-6 border-t border-gray-100">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="flex items-center gap-1 px-3 py-2 text-sm text-gray-400 hover:text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </button>

              <div className="flex gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-8 h-8 rounded text-sm font-medium transition-colors ${currentPage === page
                      ? 'bg-[#1F3B6E] text-white shadow-sm'
                      : 'text-gray-400 hover:bg-gray-50'
                      }`}
                  >
                    {page}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="flex items-center gap-1 px-3 py-2 text-sm text-gray-400 hover:text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-xl w-full mx-4 relative">
            <button
              onClick={() => setShowDeleteModal(false)}
              className="absolute top-6 right-6 text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Delete Fund</h2>
            <p className="text-gray-600 mb-8 leading-relaxed">
              Are you sure you want to delete this fund?<br />
              This action cannot be undone and will permanently remove the fund from the platform.
            </p>
            <div className="flex justify-end gap-4">
              <Button
                onClick={() => setShowDeleteModal(false)}
                className="bg-[#FEF3E2] hover:bg-[#fde8c8] text-gray-900 px-8 py-2 rounded-full font-medium"
              >
                Cancel
              </Button>
              <Button
                onClick={confirmDelete}
                className="bg-[#FCD34D] hover:bg-[#fbbf24] text-gray-900 px-8 py-2 rounded-full font-medium"
              >
                Yes, Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
