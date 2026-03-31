'use client';

import { useState } from 'react';
import { Search, ChevronDown, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DashboardLayout } from '@/components/DashboardLayout';
import Link from 'next/link';

export default function FundingRequestsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [fundStatusFilter, setFundStatusFilter] = useState('all');
  const [paymentTypeFilter, setPaymentTypeFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [activeDropdown, setActiveDropdown] = useState<number | null>(null);

  // Mock data for funding requests
  const fundingRequests = [
    {
      id: 1,
      requestId: 'FUN-123456',
      investorName: 'Jakob Philips',
      amount: '$1500.00',
      status: 'Pending',
      payment: 'Wire',
      submittedDate: 'Jan 25, 2026',
      avatar: '/images/avatar1.jpg'
    },
    {
      id: 2,
      requestId: 'FUN-123456',
      investorName: 'Marcus Madison',
      amount: '$1500.00',
      status: 'Pending',
      payment: 'ACH',
      submittedDate: 'Jan 25, 2026',
      avatar: '/images/avatar2.jpg'
    },
    {
      id: 3,
      requestId: 'FUN-123456',
      investorName: 'Roger Philips',
      amount: '$1500.00',
      status: 'Rejected',
      payment: 'Wire',
      submittedDate: 'Jan 25, 2026',
      avatar: '/images/avatar3.jpg'
    },
    {
      id: 4,
      requestId: 'FUN-123456',
      investorName: 'Martin Dorwart',
      amount: '$1500.00',
      status: 'Pending',
      payment: 'Wire',
      submittedDate: 'Jan 25, 2026',
      avatar: '/images/avatar4.jpg'
    },
    {
      id: 5,
      requestId: 'FUN-123456',
      investorName: 'Cooper Mango',
      amount: '$1500.00',
      status: 'Rejected',
      payment: 'Wire',
      submittedDate: 'Jan 25, 2026',
      avatar: '/images/avatar5.jpg'
    },
    {
      id: 6,
      requestId: 'FUN-123456',
      investorName: 'Martin Kenter',
      amount: '$1500.00',
      status: 'Pending',
      payment: 'Wire',
      submittedDate: 'Jan 25, 2026',
      avatar: '/images/avatar6.jpg'
    },
    {
      id: 7,
      requestId: 'FUN-123456',
      investorName: 'Ahmad Franci',
      amount: '$1500.00',
      status: 'Pending',
      payment: 'Wire',
      submittedDate: 'Jan 25, 2026',
      avatar: '/images/avatar7.jpg'
    },
    {
      id: 8,
      requestId: 'FUN-123457',
      investorName: 'Sarah Thompson',
      amount: '$2500.00',
      status: 'Pending',
      payment: 'ACH',
      submittedDate: 'Jan 24, 2026',
      avatar: '/images/avatar8.jpg'
    },
    {
      id: 9,
      requestId: 'FUN-123458',
      investorName: 'Michael Chen',
      amount: '$3500.00',
      status: 'Pending',
      payment: 'Wire',
      submittedDate: 'Jan 24, 2026',
      avatar: '/images/avatar9.jpg'
    },
    {
      id: 10,
      requestId: 'FUN-123459',
      investorName: 'Emily Rodriguez',
      amount: '$1800.00',
      status: 'Rejected',
      payment: 'Wire',
      submittedDate: 'Jan 23, 2026',
      avatar: '/images/avatar10.jpg'
    },
    {
      id: 11,
      requestId: 'FUN-123460',
      investorName: 'David Park',
      amount: '$2200.00',
      status: 'Pending',
      payment: 'ACH',
      submittedDate: 'Jan 23, 2026',
      avatar: '/images/avatar11.jpg'
    },
    {
      id: 12,
      requestId: 'FUN-123461',
      investorName: 'Jennifer Walsh',
      amount: '$1750.00',
      status: 'Pending',
      payment: 'Wire',
      submittedDate: 'Jan 22, 2026',
      avatar: '/images/avatar12.jpg'
    },
    {
      id: 13,
      requestId: 'FUN-123462',
      investorName: 'Robert Martinez',
      amount: '$3000.00',
      status: 'Rejected',
      payment: 'Wire',
      submittedDate: 'Jan 22, 2026',
      avatar: '/images/avatar13.jpg'
    },
    {
      id: 14,
      requestId: 'FUN-123463',
      investorName: 'Lisa Anderson',
      amount: '$2800.00',
      status: 'Pending',
      payment: 'ACH',
      submittedDate: 'Jan 21, 2026',
      avatar: '/images/avatar14.jpg'
    },
    {
      id: 15,
      requestId: 'FUN-123464',
      investorName: 'James Wilson',
      amount: '$1600.00',
      status: 'Pending',
      payment: 'Wire',
      submittedDate: 'Jan 21, 2026',
      avatar: '/images/avatar15.jpg'
    },
    {
      id: 16,
      requestId: 'FUN-123465',
      investorName: 'Maria Garcia',
      amount: '$4000.00',
      status: 'Pending',
      payment: 'Wire',
      submittedDate: 'Jan 20, 2026',
      avatar: '/images/avatar16.jpg'
    },
    {
      id: 17,
      requestId: 'FUN-123466',
      investorName: 'Thomas Brown',
      amount: '$2100.00',
      status: 'Rejected',
      payment: 'ACH',
      submittedDate: 'Jan 20, 2026',
      avatar: '/images/avatar17.jpg'
    },
    {
      id: 18,
      requestId: 'FUN-123467',
      investorName: 'Patricia Taylor',
      amount: '$1900.00',
      status: 'Pending',
      payment: 'Wire',
      submittedDate: 'Jan 19, 2026',
      avatar: '/images/avatar18.jpg'
    },
    {
      id: 19,
      requestId: 'FUN-123468',
      investorName: 'Christopher Lee',
      amount: '$2600.00',
      status: 'Pending',
      payment: 'Wire',
      submittedDate: 'Jan 19, 2026',
      avatar: '/images/avatar19.jpg'
    },
    {
      id: 20,
      requestId: 'FUN-123469',
      investorName: 'Barbara Moore',
      amount: '$3200.00',
      status: 'Pending',
      payment: 'ACH',
      submittedDate: 'Jan 18, 2026',
      avatar: '/images/avatar20.jpg'
    },
    {
      id: 21,
      requestId: 'FUN-123470',
      investorName: 'Daniel Harris',
      amount: '$2400.00',
      status: 'Pending',
      payment: 'Wire',
      submittedDate: 'Jan 18, 2026',
      avatar: '/images/avatar21.jpg'
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending':
        return 'text-orange-600 bg-orange-50';
      case 'Rejected':
        return 'text-red-600 bg-red-50';
      case 'Approved':
        return 'text-green-600 bg-green-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const itemsPerPage = 7;
  const totalPages = Math.ceil(fundingRequests.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentRequests = fundingRequests.slice(startIndex, endIndex);

  return (
    <DashboardLayout>
      <div className="p-0">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-xl sm:text-3xl font-bold text-[#1F1F1F] mb-2">Funding Requests</h1>
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
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Request ID</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Investor Name</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Amount</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Payment</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Submitted Date</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {currentRequests.map((request) => (
                  <tr key={request.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-gray-900 font-medium">{request.requestId}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#1F3B6E] to-[#6B7FBA] flex items-center justify-center text-white font-semibold">
                          {request.investorName.split(' ').map(n => n[0]).join('')}
                        </div>
                        <span className="font-medium text-gray-900">{request.investorName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-900 font-medium">{request.amount}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(request.status)}`}>
                        {request.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{request.payment}</td>
                    <td className="px-6 py-4 text-gray-600">{request.submittedDate}</td>
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
        </div>
      </div>
    </DashboardLayout>
  );
}
