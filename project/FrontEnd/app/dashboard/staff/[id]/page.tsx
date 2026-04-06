'use client';

import { useState } from 'react';
import { ChevronLeft, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DashboardLayout } from '@/components/DashboardLayout';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';

export default function StaffDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [currentPage, setCurrentPage] = useState(1);
  const [activeDropdown, setActiveDropdown] = useState<number | null>(null);

  // Mock staff data
  const staffData = {
    id: params.id,
    name: 'Davis Siphron',
    email: 'demo@gmail.com',
    phone: '+1 234567890',
    password: '••••••••',
    joinedDate: 'Dec 20, 2025',
    role: 'Relations Associate',
    image: '/images/default-avatar.png', // You can use a placeholder
  };

  // Mock assigned investors data
  const assignedInvestors = [
    {
      id: 1,
      name: 'John Smith',
      date: 'Dec 20, 2025',
    },
    {
      id: 2,
      name: 'Sarah Johnson',
      date: 'Dec 20, 2025',
    },
    {
      id: 3,
      name: 'Michael Brown',
      date: 'Dec 20, 2025',
    },
    {
      id: 4,
      name: 'Emily Davis',
      date: 'Dec 20, 2025',
    },
    {
      id: 5,
      name: 'David Wilson',
      date: 'Dec 20, 2025',
    },
    {
      id: 6,
      name: 'Jessica Martinez',
      date: 'Dec 20, 2025',
    },
    {
      id: 7,
      name: 'James Anderson',
      date: 'Dec 20, 2025',
    },
    {
      id: 8,
      name: 'Linda Taylor',
      date: 'Dec 20, 2025',
    },
    {
      id: 9,
      name: 'Robert Thomas',
      date: 'Dec 20, 2025',
    },
    {
      id: 10,
      name: 'Patricia Moore',
      date: 'Dec 20, 2025',
    },
  ];

  const itemsPerPage = 5;
  const totalPages = Math.ceil(assignedInvestors.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentInvestors = assignedInvestors.slice(startIndex, endIndex);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase();
  };

  return (
    <DashboardLayout>
      <div className="p-0">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
            <span className="font-medium">Back</span>
          </button>
          <div>
            <h1 className="text-xl sm:text-3xl font-bold text-[#1F1F1F] mb-2">Staff Details</h1>
            <p className="text-gray-600">View and manage staff member information and permissions</p>
          </div>
        </div>

        {/* Staff Info Card */}
        <div className="bg-white rounded-lg shadow-sm p-8 mb-6">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Profile Image */}
            <div className="flex-shrink-0">
              <div className="w-48 h-48 rounded-lg bg-gradient-to-br from-[#1F3B6E] to-[#6B7FBA] flex items-center justify-center text-white text-5xl font-bold overflow-hidden">
                {getInitials(staffData.name)}
              </div>
            </div>

            {/* Info */}
            <div className="flex-1">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-1">{staffData.name}</h2>
                  <p className="text-gray-600">Joined {staffData.joinedDate}</p>
                </div>
                <div className="flex gap-3">
                  <Button
                    onClick={() => {/* Handle delete */}}
                    className="bg-white border border-gray-200 hover:bg-gray-50 text-gray-900 px-6 py-2 rounded-full font-medium"
                  >
                    Delete
                  </Button>
                  <Button
                    onClick={() => {/* Handle edit */}}
                    className="bg-[#FCD34D] hover:bg-[#fbbf24] text-gray-900 px-6 py-2 rounded-full font-medium"
                  >
                    Edit
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Email</p>
                  <p className="text-gray-900 font-medium">{staffData.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Phone Number</p>
                  <p className="text-gray-900 font-medium">{staffData.phone}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Password</p>
                  <p className="text-gray-900 font-medium">{staffData.password}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Assigned Investors Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-xl font-bold text-gray-900">Assigned Investors</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Date</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Investor Name</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {currentInvestors.map((investor) => (
                  <tr key={investor.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-gray-600">{investor.date}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#1F3B6E] to-[#6B7FBA] flex items-center justify-center text-white font-semibold text-sm">
                          {getInitials(investor.name)}
                        </div>
                        <span className="font-medium text-gray-900">{investor.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="relative">
                        <button
                          onClick={() => setActiveDropdown(activeDropdown === investor.id ? null : investor.id)}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <MoreVertical className="h-5 w-5 text-gray-600" />
                        </button>
                        
                        {activeDropdown === investor.id && (
                          <>
                            <div 
                              className="fixed inset-0 z-10"
                              onClick={() => setActiveDropdown(null)}
                            />
                            <div className="absolute right-0 top-full mt-2 w-40 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-20">
                              <button className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-50 transition-colors">
                                View Profile
                              </button>
                              <button className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-50 transition-colors">
                                Reassign
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
                      : 'text-gray-400 hover:bg-gray-100'
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
