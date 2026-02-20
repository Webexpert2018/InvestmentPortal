'use client';

import { useState } from 'react';
import { Search, MoreVertical, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DashboardLayout } from '@/components/DashboardLayout';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function FundsPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [activeDropdown, setActiveDropdown] = useState<number | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedFund, setSelectedFund] = useState<number | null>(null);

  // Mock data for funds
  const fundsData = [
    {
      id: 1,
      name: 'Btwe Enterprise Fund',
      logo: '/images/fund1.jpg',
      startDate: 'Dec 20, 2025',
      totalInvestors: 25,
      totalAUM: '$150.5M',
      status: 'Active',
    },
    {
      id: 2,
      name: 'Quantum Growth Partners',
      logo: '/images/fund2.jpg',
      startDate: 'Dec 20, 2025',
      totalInvestors: 25,
      totalAUM: '$150.5M',
      status: 'Closed',
    },
    {
      id: 3,
      name: 'Nexus Venture Capital',
      logo: '/images/fund3.jpg',
      startDate: 'Dec 20, 2025',
      totalInvestors: 25,
      totalAUM: '$150.5M',
      status: 'Draft',
    },
    {
      id: 4,
      name: 'Alpha Investment Group',
      logo: '/images/fund4.jpg',
      startDate: 'Nov 15, 2025',
      totalInvestors: 42,
      totalAUM: '$230.8M',
      status: 'Active',
    },
    {
      id: 5,
      name: 'Horizon Capital Fund',
      logo: '/images/fund5.jpg',
      startDate: 'Oct 10, 2025',
      totalInvestors: 18,
      totalAUM: '$95.2M',
      status: 'Active',
    },
    {
      id: 6,
      name: 'Legacy Wealth Partners',
      logo: '/images/fund6.jpg',
      startDate: 'Sep 05, 2025',
      totalInvestors: 33,
      totalAUM: '$175.6M',
      status: 'Closed',
    },
    {
      id: 7,
      name: 'Phoenix Rising Fund',
      logo: '/images/fund7.jpg',
      startDate: 'Aug 22, 2025',
      totalInvestors: 27,
      totalAUM: '$140.3M',
      status: 'Active',
    },
    {
      id: 8,
      name: 'Silver Oak Capital',
      logo: '/images/fund8.jpg',
      startDate: 'Jul 18, 2025',
      totalInvestors: 15,
      totalAUM: '$78.9M',
      status: 'Draft',
    },
    {
      id: 9,
      name: 'Meridian Investment Trust',
      logo: '/images/fund9.jpg',
      startDate: 'Jun 30, 2025',
      totalInvestors: 38,
      totalAUM: '$198.4M',
      status: 'Active',
    },
    {
      id: 10,
      name: 'Summit Peak Fund',
      logo: '/images/fund10.jpg',
      startDate: 'May 25, 2025',
      totalInvestors: 22,
      totalAUM: '$125.7M',
      status: 'Closed',
    },
    {
      id: 11,
      name: 'Titan Growth Partners',
      logo: '/images/fund11.jpg',
      startDate: 'Apr 12, 2025',
      totalInvestors: 29,
      totalAUM: '$165.2M',
      status: 'Active',
    },
    {
      id: 12,
      name: 'Emerald City Ventures',
      logo: '/images/fund12.jpg',
      startDate: 'Mar 08, 2025',
      totalInvestors: 31,
      totalAUM: '$182.5M',
      status: 'Active',
    },
    {
      id: 13,
      name: 'Apex Strategic Fund',
      logo: '/images/fund13.jpg',
      startDate: 'Feb 14, 2025',
      totalInvestors: 19,
      totalAUM: '$105.8M',
      status: 'Draft',
    },
    {
      id: 14,
      name: 'Cornerstone Capital Group',
      logo: '/images/fund14.jpg',
      startDate: 'Jan 20, 2025',
      totalInvestors: 45,
      totalAUM: '$256.3M',
      status: 'Active',
    },
    {
      id: 15,
      name: 'Velocity Investment Fund',
      logo: '/images/fund15.jpg',
      startDate: 'Dec 28, 2024',
      totalInvestors: 24,
      totalAUM: '$135.9M',
      status: 'Closed',
    },
    {
      id: 16,
      name: 'Redwood Capital Partners',
      logo: '/images/fund16.jpg',
      startDate: 'Nov 18, 2024',
      totalInvestors: 36,
      totalAUM: '$210.4M',
      status: 'Active',
    },
    {
      id: 17,
      name: 'Liberty Growth Fund',
      logo: '/images/fund17.jpg',
      startDate: 'Oct 22, 2024',
      totalInvestors: 28,
      totalAUM: '$158.7M',
      status: 'Active',
    },
    {
      id: 18,
      name: 'Pioneer Investment Trust',
      logo: '/images/fund18.jpg',
      startDate: 'Sep 15, 2024',
      totalInvestors: 21,
      totalAUM: '$118.2M',
      status: 'Draft',
    },
    {
      id: 19,
      name: 'Odyssey Capital Fund',
      logo: '/images/fund19.jpg',
      startDate: 'Aug 10, 2024',
      totalInvestors: 40,
      totalAUM: '$225.6M',
      status: 'Active',
    },
    {
      id: 20,
      name: 'Cascade Wealth Partners',
      logo: '/images/fund20.jpg',
      startDate: 'Jul 05, 2024',
      totalInvestors: 26,
      totalAUM: '$145.3M',
      status: 'Closed',
    },
    {
      id: 21,
      name: 'Zenith Investment Group',
      logo: '/images/fund21.jpg',
      startDate: 'Jun 12, 2024',
      totalInvestors: 34,
      totalAUM: '$188.9M',
      status: 'Active',
    },
    {
      id: 22,
      name: 'Vanguard Growth Fund',
      logo: '/images/fund22.jpg',
      startDate: 'May 18, 2024',
      totalInvestors: 30,
      totalAUM: '$172.1M',
      status: 'Active',
    },
    {
      id: 23,
      name: 'Eclipse Capital Partners',
      logo: '/images/fund23.jpg',
      startDate: 'Apr 25, 2024',
      totalInvestors: 23,
      totalAUM: '$128.5M',
      status: 'Draft',
    },
    {
      id: 24,
      name: 'Sterling Investment Trust',
      logo: '/images/fund24.jpg',
      startDate: 'Mar 30, 2024',
      totalInvestors: 37,
      totalAUM: '$205.7M',
      status: 'Active',
    },
    {
      id: 25,
      name: 'Genesis Venture Fund',
      logo: '/images/fund25.jpg',
      startDate: 'Feb 22, 2024',
      totalInvestors: 20,
      totalAUM: '$112.4M',
      status: 'Closed',
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active':
        return 'text-green-600 bg-green-50';
      case 'Closed':
        return 'text-red-600 bg-red-50';
      case 'Draft':
        return 'text-gray-600 bg-gray-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
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
  const totalPages = Math.ceil(fundsData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentFunds = fundsData.slice(startIndex, endIndex);

  const handleDelete = (fundId: number) => {
    setSelectedFund(fundId);
    setShowDeleteModal(true);
    setActiveDropdown(null);
  };

  const confirmDelete = () => {
    // Handle delete logic here
    setShowDeleteModal(false);
    setSelectedFund(null);
  };

  return (
    <DashboardLayout>
      <div className="p-0">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-xl sm:text-3xl font-bold text-[#1F1F1F] mb-2">Funds</h1>
            <p className="text-gray-600">View, manage, and configure all funds.</p>
          </div>
          <Button
            onClick={() => router.push('/dashboard/funds/add')}
            className="bg-[#FCD34D] hover:bg-[#fbbf24] text-gray-900 px-6 py-2 rounded font-medium rounded-full"
          >
            Add New Fund
          </Button>
        </div>


    <div className="bg-white p-2">
        {/* Search */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Find something here..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1F3B6E] focus:border-transparent"
            />
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Fund Name</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Fund Start Date</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Total Investors</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Total AUM</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {currentFunds.map((fund) => (
                  <tr key={fund.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#1F3B6E] to-[#6B7FBA] flex items-center justify-center text-white font-semibold text-sm">
                          {getInitials(fund.name)}
                        </div>
                        <span className="font-medium text-gray-900">{fund.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-900">{fund.startDate}</td>
                    <td className="px-6 py-4 text-gray-900">{fund.totalInvestors}</td>
                    <td className="px-6 py-4 text-gray-900 font-medium">{fund.totalAUM}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(fund.status)}`}>
                        {fund.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="relative">
                        <button
                          onClick={() => setActiveDropdown(activeDropdown === fund.id ? null : fund.id)}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <MoreVertical className="h-5 w-5 text-gray-600" />
                        </button>
                        
                        {activeDropdown === fund.id && (
                          <>
                            <div 
                              className="fixed inset-0 z-10"
                              onClick={() => setActiveDropdown(null)}
                            />
                            <div className="absolute right-0 top-full mt-2 w-32 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-20">
                              <Link
                                href={`/dashboard/funds/${fund.id}`}
                                className="block w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-50 transition-colors"
                              >
                                View
                              </Link>
                              <Link
                                href={`/dashboard/funds/${fund.id}/edit`}
                                className="block w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-50 transition-colors"
                              >
                                Edit
                              </Link>
                              <button
                                onClick={() => handleDelete(fund.id)}
                                className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-50 transition-colors"
                              >
                                Delete
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

          {/* Pagination */}
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
                  className={`w-10 h-10 rounded-lg font-medium transition-colors ${
                    currentPage === page
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
