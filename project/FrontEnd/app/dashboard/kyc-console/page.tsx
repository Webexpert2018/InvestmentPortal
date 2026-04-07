'use client';

import { useState, useEffect } from 'react';
import { Search, ChevronDown, MoreVertical } from 'lucide-react';
import { DashboardLayout } from '@/components/DashboardLayout';
import Link from 'next/link';
import { apiClient } from '@/lib/api/client';
import { toast } from 'sonner';

interface Investor {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  kycStatus: string;
  createdAt: string;
  avatar: string;
}

export default function KYCConsolePage() {
  const [investors, setInvestors] = useState<Investor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [kycFilter, setKycFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  const fetchInvestors = async () => {
    try {
      setLoading(true);
      const data = await apiClient.getAllUsers();
      setInvestors(data);
    } catch (error) {
      console.error('Failed to fetch investors:', error);
      toast.error('Failed to load investors');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvestors();
  }, []);

  const handleStatusUpdate = async (userId: string, newStatus: string) => {
    try {
      await apiClient.updateKycStatus(userId, newStatus);
      toast.success(`KYC ${newStatus} successfully`);
      setActiveDropdown(null);
      // Update local state
      setInvestors(prev => prev.map(inv =>
        inv.id === userId ? { ...inv, kycStatus: newStatus.toLowerCase() } : inv
      ));
    } catch (error) {
      console.error('Failed to update KYC status:', error);
      toast.error('Failed to update KYC status');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return 'text-orange-600 bg-orange-50';
      case 'rejected':
        return 'text-red-600 bg-red-50';
      case 'approved':
        return 'text-green-600 bg-green-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const itemsPerPage = 7;
  const filteredInvestors = investors.filter(inv => {
    const fullName = (inv.firstName + ' ' + (inv.lastName || '')).toLowerCase();
    const matchesSearch = fullName.includes(searchQuery.toLowerCase()) ||
      inv.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesKyc = kycFilter === 'all' || inv.kycStatus?.toLowerCase() === kycFilter.toLowerCase();
    return matchesSearch && matchesKyc;
  });

  const totalPages = Math.ceil(filteredInvestors.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentRecords = filteredInvestors.slice(startIndex, startIndex + itemsPerPage);

  return (
    <DashboardLayout>
      <div className="p-0">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-xl sm:text-3xl font-bold text-[#1F1F1F] mb-2">KYC Console</h1>
          <p className="text-gray-600">Review and monitor identity verification statuses across all investors.</p>
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

            {/* KYC Status Filter */}
            <div className="relative">
              <select
                value={kycFilter}
                onChange={(e) => setKycFilter(e.target.value)}
                className="appearance-none px-4 py-2 pr-10 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1F3B6E] focus:border-transparent bg-white cursor-pointer"
              >
                <option value="all">KYC Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
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
                  <th className="px-6 py-4 text-left text-sm font-semibold text-[#4B4B4B] capitalize">Investor Name</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-[#4B4B4B] capitalize0">Email</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-[#4B4B4B] capitalize">KYC Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-[#4B4B4B] capitalize">Date</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-[#4B4B4B] capitalize">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={5} className="px-6 py-4 h-16 bg-gray-50/50"></td>
                    </tr>
                  ))
                ) : currentRecords.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-10 text-center text-gray-500">No investors found.</td>
                  </tr>
                ) : (
                  currentRecords.map((record) => (
                    <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#1F3B6E] to-[#6B7FBA] flex items-center justify-center text-white font-semibold flex-shrink-0">
                            {record.firstName[0]}{record.lastName ? record.lastName[0] : ''}
                          </div>
                          <span className="font-medium text-gray-900 whitespace-nowrap">{record.firstName} {record.lastName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-600">{record.email}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium capitalize ${getStatusColor(record.kycStatus)}`}>
                          {record.kycStatus || 'Pending'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-600">{new Date(record.createdAt).toLocaleDateString()}</td>
                      <td className="px-6 py-4">
                        <div className="relative">
                          <button
                            onClick={() => setActiveDropdown(activeDropdown === record.id ? null : record.id)}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                          >
                            <MoreVertical className="h-5 w-5 text-gray-600" />
                          </button>

                          {activeDropdown === record.id && (
                            <>
                              <div
                                className="fixed inset-0 z-10"
                                onClick={() => setActiveDropdown(null)}
                              />
                              <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-20">
                                <Link href={`/dashboard/investor/${record.id}`}>
                                  <button className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-50 transition-colors">
                                    View Profile
                                  </button>
                                </Link>
                                <button
                                  className="w-full px-4 py-2 text-left text-[#1F3B6E] hover:bg-blue-50 transition-colors font-medium border-b border-gray-100"
                                  onClick={() => {
                                    window.open(`/dashboard/investor/${record.id}?tab=documents`, '_blank');
                                  }}
                                >
                                  View Documents 📂
                                </button>
                                <button
                                  onClick={() => handleStatusUpdate(record.id, 'Approved')}
                                  className="w-full px-4 py-2 text-left text-green-600 hover:bg-green-50 transition-colors"
                                >
                                  Approve KYC
                                </button>
                                <button
                                  onClick={() => handleStatusUpdate(record.id, 'Rejected')}
                                  className="w-full px-4 py-2 text-left text-red-600 hover:bg-red-50 transition-colors"
                                >
                                  Reject KYC
                                </button>
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
          {!loading && filteredInvestors.length > itemsPerPage && (
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
