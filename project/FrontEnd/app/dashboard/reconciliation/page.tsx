'use client';

import { useState } from 'react';
import { Search, ChevronDown, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DashboardLayout } from '@/components/DashboardLayout';
import Link from 'next/link';

export default function ReconciliationPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [eventTypeFilter, setEventTypeFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [activeDropdown, setActiveDropdown] = useState<number | null>(null);

  // Stats data
  const stats = [
    { label: 'Total Events', value: '1,248' },
    { label: 'Matched', value: '1,190' },
    { label: 'Mismatched', value: '38' },
    { label: 'Pending Review', value: '20' },
  ];

  // Mock data for reconciliation records
  const reconciliationRecords = [
    {
      id: 1,
      recordId: 'REC-123456',
      type: 'Wire',
      custodian: '$50,000.00',
      internal: '$48,000.00',
      difference: '$2000.00',
      status: 'Mismatch',
    },
    {
      id: 2,
      recordId: 'REC-123456',
      type: 'Funding',
      custodian: '$25,000.00',
      internal: '$25,000.00',
      difference: '$0.00',
      status: 'Matched',
    },
    {
      id: 3,
      recordId: 'REC-123456',
      type: 'Redemption',
      custodian: '$85,000.00',
      internal: '$85,000.00',
      difference: '$0.00',
      status: 'Matched',
    },
    {
      id: 4,
      recordId: 'REC-123457',
      type: 'Wire',
      custodian: '$30,000.00',
      internal: '$30,000.00',
      difference: '$0.00',
      status: 'Matched',
    },
    {
      id: 5,
      recordId: 'REC-123458',
      type: 'Funding',
      custodian: '$15,000.00',
      internal: '$14,500.00',
      difference: '$500.00',
      status: 'Mismatch',
    },
    {
      id: 6,
      recordId: 'REC-123459',
      type: 'Redemption',
      custodian: '$42,000.00',
      internal: '$42,000.00',
      difference: '$0.00',
      status: 'Matched',
    },
    {
      id: 7,
      recordId: 'REC-123460',
      type: 'Wire',
      custodian: '$68,000.00',
      internal: '$68,000.00',
      difference: '$0.00',
      status: 'Matched',
    },
    {
      id: 8,
      recordId: 'REC-123461',
      type: 'Funding',
      custodian: '$22,000.00',
      internal: '$22,000.00',
      difference: '$0.00',
      status: 'Matched',
    },
    {
      id: 9,
      recordId: 'REC-123462',
      type: 'Redemption',
      custodian: '$55,000.00',
      internal: '$54,000.00',
      difference: '$1000.00',
      status: 'Mismatch',
    },
    {
      id: 10,
      recordId: 'REC-123463',
      type: 'Wire',
      custodian: '$90,000.00',
      internal: '$90,000.00',
      difference: '$0.00',
      status: 'Matched',
    },
    {
      id: 11,
      recordId: 'REC-123464',
      type: 'Funding',
      custodian: '$18,500.00',
      internal: '$18,500.00',
      difference: '$0.00',
      status: 'Matched',
    },
    {
      id: 12,
      recordId: 'REC-123465',
      type: 'Redemption',
      custodian: '$37,000.00',
      internal: '$37,000.00',
      difference: '$0.00',
      status: 'Matched',
    },
    {
      id: 13,
      recordId: 'REC-123466',
      type: 'Wire',
      custodian: '$73,000.00',
      internal: '$72,500.00',
      difference: '$500.00',
      status: 'Mismatch',
    },
    {
      id: 14,
      recordId: 'REC-123467',
      type: 'Funding',
      custodian: '$29,000.00',
      internal: '$29,000.00',
      difference: '$0.00',
      status: 'Matched',
    },
    {
      id: 15,
      recordId: 'REC-123468',
      type: 'Redemption',
      custodian: '$61,000.00',
      internal: '$61,000.00',
      difference: '$0.00',
      status: 'Matched',
    },
    {
      id: 16,
      recordId: 'REC-123469',
      type: 'Wire',
      custodian: '$44,000.00',
      internal: '$44,000.00',
      difference: '$0.00',
      status: 'Matched',
    },
    {
      id: 17,
      recordId: 'REC-123470',
      type: 'Funding',
      custodian: '$33,500.00',
      internal: '$33,000.00',
      difference: '$500.00',
      status: 'Mismatch',
    },
    {
      id: 18,
      recordId: 'REC-123471',
      type: 'Redemption',
      custodian: '$78,000.00',
      internal: '$78,000.00',
      difference: '$0.00',
      status: 'Matched',
    },
    {
      id: 19,
      recordId: 'REC-123472',
      type: 'Wire',
      custodian: '$52,000.00',
      internal: '$52,000.00',
      difference: '$0.00',
      status: 'Matched',
    },
    {
      id: 20,
      recordId: 'REC-123473',
      type: 'Funding',
      custodian: '$26,000.00',
      internal: '$26,000.00',
      difference: '$0.00',
      status: 'Matched',
    },
    {
      id: 21,
      recordId: 'REC-123474',
      type: 'Redemption',
      custodian: '$95,000.00',
      internal: '$94,000.00',
      difference: '$1000.00',
      status: 'Mismatch',
    },
    {
      id: 22,
      recordId: 'REC-123475',
      type: 'Wire',
      custodian: '$40,000.00',
      internal: '$40,000.00',
      difference: '$0.00',
      status: 'Matched',
    },
    {
      id: 23,
      recordId: 'REC-123476',
      type: 'Funding',
      custodian: '$19,500.00',
      internal: '$19,500.00',
      difference: '$0.00',
      status: 'Matched',
    },
    {
      id: 24,
      recordId: 'REC-123477',
      type: 'Redemption',
      custodian: '$66,000.00',
      internal: '$66,000.00',
      difference: '$0.00',
      status: 'Matched',
    },
    {
      id: 25,
      recordId: 'REC-123478',
      type: 'Wire',
      custodian: '$81,000.00',
      internal: '$80,000.00',
      difference: '$1000.00',
      status: 'Mismatch',
    },
    {
      id: 26,
      recordId: 'REC-123479',
      type: 'Funding',
      custodian: '$35,000.00',
      internal: '$35,000.00',
      difference: '$0.00',
      status: 'Matched',
    },
    {
      id: 27,
      recordId: 'REC-123480',
      type: 'Redemption',
      custodian: '$58,000.00',
      internal: '$58,000.00',
      difference: '$0.00',
      status: 'Matched',
    },
    {
      id: 28,
      recordId: 'REC-123481',
      type: 'Wire',
      custodian: '$47,000.00',
      internal: '$47,000.00',
      difference: '$0.00',
      status: 'Matched',
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Matched':
        return 'text-green-600 bg-green-50';
      case 'Mismatch':
        return 'text-red-600 bg-red-50';
      case 'Pending':
        return 'text-orange-600 bg-orange-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const itemsPerPage = 7;
  const totalPages = Math.ceil(reconciliationRecords.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentRecords = reconciliationRecords.slice(startIndex, endIndex);

  return (
    <DashboardLayout>
      <div className="p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-xl sm:text-3xl font-bold text-[#1F1F1F] mb-2">Reconciliation</h1>
          <p className="text-gray-600">Compare custodian events with internal ledger records and resolve mismatches.</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          {stats.map((stat, index) => (
            <div key={index} className="bg-white rounded-lg shadow-sm p-6">
              <p className="text-gray-600 text-sm mb-2">{stat.label}</p>
              <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
            </div>
          ))}
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

            {/* Status Filter */}
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="appearance-none px-4 py-2 pr-10 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1F3B6E] focus:border-transparent bg-white cursor-pointer"
              >
                <option value="all">Status</option>
                <option value="matched">Matched</option>
                <option value="mismatch">Mismatch</option>
                <option value="pending">Pending Review</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5 pointer-events-none" />
            </div>

            {/* Event Type Filter */}
            <div className="relative">
              <select
                value={eventTypeFilter}
                onChange={(e) => setEventTypeFilter(e.target.value)}
                className="appearance-none px-4 py-2 pr-10 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1F3B6E] focus:border-transparent bg-white cursor-pointer"
              >
                <option value="all">Event Type</option>
                <option value="wire">Wire</option>
                <option value="funding">Funding</option>
                <option value="redemption">Redemption</option>
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
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">ID</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Type</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Custodian</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Internal</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Difference</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {currentRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-gray-900 font-medium">{record.recordId}</td>
                    <td className="px-6 py-4 text-gray-900">{record.type}</td>
                    <td className="px-6 py-4 text-gray-900 font-medium">{record.custodian}</td>
                    <td className="px-6 py-4 text-gray-900 font-medium">{record.internal}</td>
                    <td className="px-6 py-4 text-gray-900 font-medium">{record.difference}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(record.status)}`}>
                        {record.status}
                      </span>
                    </td>
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
                            <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-20">
                              <Link href={`/dashboard/reconciliation/${record.id}`}>
                                <button className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-50 transition-colors">
                                  View Details
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
