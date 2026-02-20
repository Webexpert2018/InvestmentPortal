'use client';

import { useState } from 'react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Search, ChevronDown, X } from 'lucide-react';

const mockInvestors = [
  {
    id: 1,
    name: 'James Mango',
    email: 'demo@gmail.com',
    accountType: 'Personal',
    kycStatus: 'Approved',
    invested: '$1502.00',
    date: 'Jan 25, 2026',
    avatar: 'JM',
  },
  {
    id: 2,
    name: 'Talan Rhiel Madsen',
    email: 'demo@gmail.com',
    accountType: 'IRA',
    kycStatus: 'Approved',
    invested: '$1502.00',
    date: 'Jan 25, 2026',
    avatar: 'TM',
  },
  {
    id: 3,
    name: 'Terry George',
    email: 'demo@gmail.com',
    accountType: 'Roth IRA',
    kycStatus: 'Pending',
    invested: '$1502.00',
    date: 'Jan 25, 2026',
    avatar: 'TG',
  },
  {
    id: 4,
    name: 'Omar Calzoni',
    email: 'demo@gmail.com',
    accountType: 'IRA',
    kycStatus: 'Approved',
    invested: '$1502.00',
    date: 'Jan 25, 2026',
    avatar: 'OC',
  },
  {
    id: 5,
    name: 'Martin Gouse',
    email: 'demo@gmail.com',
    accountType: 'Personal',
    kycStatus: 'Rejected',
    invested: '$1502.00',
    date: 'Jan 25, 2026',
    avatar: 'MG',
  },
  {
    id: 6,
    name: 'Carter George',
    email: 'demo@gmail.com',
    accountType: 'Roth IRA',
    kycStatus: 'Approved',
    invested: '$1502.00',
    date: 'Jan 25, 2026',
    avatar: 'CG',
  },
  {
    id: 7,
    name: 'Wilson Westervelt',
    email: 'demo@gmail.com',
    accountType: 'Personal',
    kycStatus: 'Approved',
    invested: '$1502.00',
    date: 'Jan 25, 2026',
    avatar: 'WW',
  },
  {
    id: 8,
    name: 'Sarah Johnson',
    email: 'sarah.j@gmail.com',
    accountType: 'IRA',
    kycStatus: 'Approved',
    invested: '$2800.00',
    date: 'Jan 24, 2026',
    avatar: 'SJ',
  },
  {
    id: 9,
    name: 'Michael Chen',
    email: 'michael.chen@gmail.com',
    accountType: 'Roth IRA',
    kycStatus: 'Pending',
    invested: '$1200.00',
    date: 'Jan 24, 2026',
    avatar: 'MC',
  },
  {
    id: 10,
    name: 'Emily Rodriguez',
    email: 'emily.r@gmail.com',
    accountType: 'Personal',
    kycStatus: 'Approved',
    invested: '$3500.00',
    date: 'Jan 23, 2026',
    avatar: 'ER',
  },
  {
    id: 11,
    name: 'David Thompson',
    email: 'david.t@gmail.com',
    accountType: 'IRA',
    kycStatus: 'Rejected',
    invested: '$900.00',
    date: 'Jan 23, 2026',
    avatar: 'DT',
  },
  {
    id: 12,
    name: 'Lisa Anderson',
    email: 'lisa.anderson@gmail.com',
    accountType: 'Roth IRA',
    kycStatus: 'Approved',
    invested: '$4200.00',
    date: 'Jan 22, 2026',
    avatar: 'LA',
  },
  {
    id: 13,
    name: 'Robert Williams',
    email: 'robert.w@gmail.com',
    accountType: 'Personal',
    kycStatus: 'Pending',
    invested: '$1800.00',
    date: 'Jan 22, 2026',
    avatar: 'RW',
  },
  {
    id: 14,
    name: 'Jennifer Martinez',
    email: 'jennifer.m@gmail.com',
    accountType: 'IRA',
    kycStatus: 'Approved',
    invested: '$3100.00',
    date: 'Jan 21, 2026',
    avatar: 'JM',
  },
  {
    id: 15,
    name: 'James Taylor',
    email: 'james.taylor@gmail.com',
    accountType: 'Roth IRA',
    kycStatus: 'Approved',
    invested: '$2600.00',
    date: 'Jan 21, 2026',
    avatar: 'JT',
  },
  {
    id: 16,
    name: 'Patricia Garcia',
    email: 'patricia.g@gmail.com',
    accountType: 'Personal',
    kycStatus: 'Pending',
    invested: '$1400.00',
    date: 'Jan 20, 2026',
    avatar: 'PG',
  },
  {
    id: 17,
    name: 'Christopher Lee',
    email: 'chris.lee@gmail.com',
    accountType: 'IRA',
    kycStatus: 'Approved',
    invested: '$5000.00',
    date: 'Jan 20, 2026',
    avatar: 'CL',
  },
  {
    id: 18,
    name: 'Mary White',
    email: 'mary.white@gmail.com',
    accountType: 'Roth IRA',
    kycStatus: 'Rejected',
    invested: '$800.00',
    date: 'Jan 19, 2026',
    avatar: 'MW',
  },
  {
    id: 19,
    name: 'Daniel Harris',
    email: 'daniel.h@gmail.com',
    accountType: 'Personal',
    kycStatus: 'Approved',
    invested: '$2200.00',
    date: 'Jan 19, 2026',
    avatar: 'DH',
  },
  {
    id: 20,
    name: 'Karen Clark',
    email: 'karen.clark@gmail.com',
    accountType: 'IRA',
    kycStatus: 'Pending',
    invested: '$1900.00',
    date: 'Jan 18, 2026',
    avatar: 'KC',
  },
  {
    id: 21,
    name: 'Matthew Lewis',
    email: 'matthew.l@gmail.com',
    accountType: 'Roth IRA',
    kycStatus: 'Approved',
    invested: '$3800.00',
    date: 'Jan 18, 2026',
    avatar: 'ML',
  },
  {
    id: 22,
    name: 'Nancy Walker',
    email: 'nancy.walker@gmail.com',
    accountType: 'Personal',
    kycStatus: 'Approved',
    invested: '$2900.00',
    date: 'Jan 17, 2026',
    avatar: 'NW',
  },
  {
    id: 23,
    name: 'Anthony Hall',
    email: 'anthony.h@gmail.com',
    accountType: 'IRA',
    kycStatus: 'Pending',
    invested: '$1600.00',
    date: 'Jan 17, 2026',
    avatar: 'AH',
  },
  {
    id: 24,
    name: 'Betty Young',
    email: 'betty.young@gmail.com',
    accountType: 'Roth IRA',
    kycStatus: 'Approved',
    invested: '$4500.00',
    date: 'Jan 16, 2026',
    avatar: 'BY',
  },
  {
    id: 25,
    name: 'Mark King',
    email: 'mark.king@gmail.com',
    accountType: 'Personal',
    kycStatus: 'Rejected',
    invested: '$700.00',
    date: 'Jan 16, 2026',
    avatar: 'MK',
  },
];

export default function InvestorPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [kycFilter, setKycFilter] = useState('');
  const [accountTypeFilter, setAccountTypeFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');

  const itemsPerPage = 7;

  const getKycStatusColor = (status: string) => {
    switch (status) {
      case 'Approved':
        return 'bg-[#F2FAF6] text-[#2A4474]';
      case 'Pending':
        return 'bg-[#FFF9EE] text-[#4B4B4B]';
      case 'Rejected':
        return 'bg-[#FEF2F2] text-[#4B4B4B]';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const handleSendInvite = () => {
    // Handle invite logic here
    console.log('Sending invite to:', fullName, email);
    setShowInviteModal(false);
    setFullName('');
    setEmail('');
  };

  const totalPages = Math.ceil(mockInvestors.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const displayedInvestors = mockInvestors.slice(startIndex, startIndex + itemsPerPage);

  return (
    <DashboardLayout>
      <div className="space-y-6 font-sans">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#1F1F1F]">Investors</h1>
            <p className="text-gray-500 mt-2 text-sm sm:text-base">
              View and manage all investor accounts.
            </p>
          </div>
          <button
            onClick={() => setShowInviteModal(true)}
            className="px-5 sm:px-6 py-2 sm:py-2.5 bg-[#FCD34D] text-gray-800 text-sm font-medium rounded-full hover:bg-[#FBD24E] transition-colors whitespace-nowrap self-start sm:self-auto"
          >
            Invite Investor
          </button>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search Box */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Find something here..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#FCD34D] focus:border-transparent"
              />
            </div>

            {/* KYC Status Filter */}
            <div className="relative w-full lg:w-48">
              <select
                value={kycFilter}
                onChange={(e) => setKycFilter(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-700 appearance-none focus:outline-none focus:ring-2 focus:ring-[#FCD34D] focus:border-transparent bg-white cursor-pointer"
              >
                <option value="">KYC Status</option>
                <option value="Approved">Approved</option>
                <option value="Pending">Pending</option>
                <option value="Rejected">Rejected</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            </div>

            {/* Account Type Filter */}
            <div className="relative w-full lg:w-48">
              <select
                value={accountTypeFilter}
                onChange={(e) => setAccountTypeFilter(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-700 appearance-none focus:outline-none focus:ring-2 focus:ring-[#FCD34D] focus:border-transparent bg-white cursor-pointer"
              >
                <option value="">Account Type</option>
                <option value="Personal">Personal</option>
                <option value="IRA">IRA</option>
                <option value="Roth IRA">Roth IRA</option>
                <option value="Corporate">Corporate</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Investors Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="px-4 sm:px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Investor Name
                  </th>
                  <th className="px-4 sm:px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-4 sm:px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Account Type
                  </th>
                  <th className="px-4 sm:px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    KYC Status
                  </th>
                  <th className="px-4 sm:px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Invested
                  </th>
                  <th className="px-4 sm:px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-4 sm:px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {displayedInvestors.map((investor) => (
                  <tr key={investor.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-[#1F3B6E] text-xs sm:text-sm font-semibold text-white flex-shrink-0">
                          {investor.avatar}
                        </div>
                        <span className="text-sm font-medium text-gray-900">
                          {investor.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {investor.email}
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {investor.accountType}
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-3 py-1 inline-flex text-xs font-medium rounded-full ${getKycStatusColor(
                          investor.kycStatus
                        )}`}
                      >
                        {investor.kycStatus}
                      </span>
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {investor.invested}
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {investor.date}
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                      <Link href={`/dashboard/investor/${investor.id}`} className="text-gray-400 hover:text-gray-600">
                        <svg
                          width="4"
                          height="16"
                          viewBox="0 0 4 16"
                          fill="currentColor"
                        >
                          <circle cx="2" cy="2" r="2" />
                          <circle cx="2" cy="8" r="2" />
                          <circle cx="2" cy="14" r="2" />
                        </svg>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="px-4 sm:px-6 py-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-gray-500">View {itemsPerPage}</p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 disabled:text-gray-300 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              {[...Array(totalPages)].map((_, index) => (
                <button
                  key={index + 1}
                  onClick={() => setCurrentPage(index + 1)}
                  className={`w-8 h-8 rounded-full text-sm font-medium transition-colors ${
                    currentPage === index + 1
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {index + 1}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 disabled:text-gray-300 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        </div>

  
      </div>

      {/* Invite Investor Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-5 sm:p-6 w-full max-w-md shadow-xl mx-4">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Invite New Investor
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Send a secure invitation link to onboard a new investor.
                </p>
              </div>
              <button
                onClick={() => {
                  setShowInviteModal(false);
                  setFullName('');
                  setEmail('');
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter full name"
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#FCD34D] focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter email"
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#FCD34D] focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex gap-3 justify-end flex-wrap">
              <button
                onClick={() => {
                  setShowInviteModal(false);
                  setFullName('');
                  setEmail('');
                }}
                className="px-5 sm:px-6 py-2 sm:py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSendInvite}
                disabled={!fullName.trim() || !email.trim()}
                className="px-5 sm:px-6 py-2 sm:py-2.5 bg-[#FCD34D] text-gray-800 text-sm font-medium rounded-full hover:bg-[#FBD24E] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Send Invite
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
