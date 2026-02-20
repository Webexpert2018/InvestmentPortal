'use client';

import { useState } from 'react';
import { Search, ChevronDown, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DashboardLayout } from '@/components/DashboardLayout';
import Link from 'next/link';

export default function KYCConsolePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [kycFilter, setKycFilter] = useState('all');
  const [accountTypeFilter, setAccountTypeFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [activeDropdown, setActiveDropdown] = useState<number | null>(null);

  // Mock data for KYC records
  const kycRecords = [
    {
      id: 1,
      name: 'Justin Bothman',
      email: 'demo@gmail.com',
      accountType: 'Personal',
      kycStatus: 'Pending',
      date: 'Jan 25, 2026',
      avatar: '/images/avatar1.jpg'
    },
    {
      id: 2,
      name: 'Charlie Ganter',
      email: 'demo@gmail.com',
      accountType: 'Personal',
      kycStatus: 'Pending',
      date: 'Jan 25, 2026',
      avatar: '/images/avatar2.jpg'
    },
    {
      id: 3,
      name: 'Davis Workman',
      email: 'demo@gmail.com',
      accountType: 'Personal',
      kycStatus: 'Rejected',
      date: 'Jan 25, 2026',
      avatar: '/images/avatar3.jpg'
    },
    {
      id: 4,
      name: 'Carter Bobash',
      email: 'demo@gmail.com',
      accountType: 'Personal',
      kycStatus: 'Pending',
      date: 'Jan 25, 2026',
      avatar: '/images/avatar4.jpg'
    },
    {
      id: 5,
      name: 'Randy Lubin',
      email: 'demo@gmail.com',
      accountType: 'Personal',
      kycStatus: 'Pending',
      date: 'Jan 25, 2026',
      avatar: '/images/avatar5.jpg'
    },
    {
      id: 6,
      name: 'Gustavo Lipshutz',
      email: 'demo@gmail.com',
      accountType: 'Personal',
      kycStatus: 'Rejected',
      date: 'Jan 25, 2026',
      avatar: '/images/avatar6.jpg'
    },
    {
      id: 7,
      name: 'Karim Gouse',
      email: 'demo@gmail.com',
      accountType: 'Personal',
      kycStatus: 'Pending',
      date: 'Jan 25, 2026',
      avatar: '/images/avatar7.jpg'
    },
    {
      id: 8,
      name: 'Sarah Thompson',
      email: 'demo@gmail.com',
      accountType: 'Personal',
      kycStatus: 'Approved',
      date: 'Jan 24, 2026',
      avatar: '/images/avatar8.jpg'
    },
    {
      id: 9,
      name: 'Michael Chen',
      email: 'demo@gmail.com',
      accountType: 'Corporate',
      kycStatus: 'Pending',
      date: 'Jan 24, 2026',
      avatar: '/images/avatar9.jpg'
    },
    {
      id: 10,
      name: 'Emily Rodriguez',
      email: 'demo@gmail.com',
      accountType: 'Personal',
      kycStatus: 'Approved',
      date: 'Jan 23, 2026',
      avatar: '/images/avatar10.jpg'
    },
    {
      id: 11,
      name: 'David Park',
      email: 'demo@gmail.com',
      accountType: 'Personal',
      kycStatus: 'Pending',
      date: 'Jan 23, 2026',
      avatar: '/images/avatar11.jpg'
    },
    {
      id: 12,
      name: 'Jennifer Walsh',
      email: 'demo@gmail.com',
      accountType: 'Corporate',
      kycStatus: 'Rejected',
      date: 'Jan 22, 2026',
      avatar: '/images/avatar12.jpg'
    },
    {
      id: 13,
      name: 'Robert Martinez',
      email: 'demo@gmail.com',
      accountType: 'Personal',
      kycStatus: 'Pending',
      date: 'Jan 22, 2026',
      avatar: '/images/avatar13.jpg'
    },
    {
      id: 14,
      name: 'Lisa Anderson',
      email: 'demo@gmail.com',
      accountType: 'Personal',
      kycStatus: 'Approved',
      date: 'Jan 21, 2026',
      avatar: '/images/avatar14.jpg'
    },
    {
      id: 15,
      name: 'James Wilson',
      email: 'demo@gmail.com',
      accountType: 'Personal',
      kycStatus: 'Pending',
      date: 'Jan 21, 2026',
      avatar: '/images/avatar15.jpg'
    },
    {
      id: 16,
      name: 'Maria Garcia',
      email: 'demo@gmail.com',
      accountType: 'Corporate',
      kycStatus: 'Approved',
      date: 'Jan 20, 2026',
      avatar: '/images/avatar16.jpg'
    },
    {
      id: 17,
      name: 'Thomas Brown',
      email: 'demo@gmail.com',
      accountType: 'Personal',
      kycStatus: 'Pending',
      date: 'Jan 20, 2026',
      avatar: '/images/avatar17.jpg'
    },
    {
      id: 18,
      name: 'Patricia Taylor',
      email: 'demo@gmail.com',
      accountType: 'Personal',
      kycStatus: 'Rejected',
      date: 'Jan 19, 2026',
      avatar: '/images/avatar18.jpg'
    },
    {
      id: 19,
      name: 'Christopher Lee',
      email: 'demo@gmail.com',
      accountType: 'Personal',
      kycStatus: 'Pending',
      date: 'Jan 19, 2026',
      avatar: '/images/avatar19.jpg'
    },
    {
      id: 20,
      name: 'Barbara Moore',
      email: 'demo@gmail.com',
      accountType: 'Corporate',
      kycStatus: 'Approved',
      date: 'Jan 18, 2026',
      avatar: '/images/avatar20.jpg'
    },
    {
      id: 21,
      name: 'Daniel Harris',
      email: 'demo@gmail.com',
      accountType: 'Personal',
      kycStatus: 'Pending',
      date: 'Jan 18, 2026',
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
  const totalPages = Math.ceil(kycRecords.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentRecords = kycRecords.slice(startIndex, endIndex);

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

            {/* Account Type Filter */}
            <div className="relative">
              <select
                value={accountTypeFilter}
                onChange={(e) => setAccountTypeFilter(e.target.value)}
                className="appearance-none px-4 py-2 pr-10 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1F3B6E] focus:border-transparent bg-white cursor-pointer"
              >
                <option value="all">Account Type</option>
                <option value="personal">Personal</option>
                <option value="corporate">Corporate</option>
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
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Investor Name</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Email</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Account Type</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">KYC Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Date</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {currentRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#1F3B6E] to-[#6B7FBA] flex items-center justify-center text-white font-semibold">
                          {record.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <span className="font-medium text-gray-900">{record.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{record.email}</td>
                    <td className="px-6 py-4 text-gray-600">{record.accountType}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(record.kycStatus)}`}>
                        {record.kycStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{record.date}</td>
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
                              <Link href={`/dashboard/kyc-console/${record.id}`}>
                                <button className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-50 transition-colors">
                                  View Profile
                                </button>
                              </Link>
                              <button className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-50 transition-colors">
                                Assign Relations Associate
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
    </DashboardLayout>
  );
}
