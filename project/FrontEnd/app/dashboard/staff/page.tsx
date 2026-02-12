'use client';

import { useState } from 'react';
import { MoreVertical, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DashboardLayout } from '@/components/DashboardLayout';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function StaffPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('relations');
  const [currentPage, setCurrentPage] = useState(1);
  const [activeDropdown, setActiveDropdown] = useState<number | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showReassignModal, setShowReassignModal] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<any>(null);
  const [selectedAccountant, setSelectedAccountant] = useState('');

  // Mock data for relations
  const relationsData = [
    {
      id: 1,
      name: 'Davis Siphron',
      email: 'demo@gmail.com',
      assignedInvestors: 25,
      date: 'Dec 20, 2025',
      role: 'relations'
    },
    {
      id: 2,
      name: 'Kadin Mango',
      email: 'demo@gmail.com',
      assignedInvestors: 25,
      date: 'Dec 20, 2025',
      role: 'relations'
    },
    {
      id: 3,
      name: 'Gustavo Botosh',
      email: 'demo@gmail.com',
      assignedInvestors: 25,
      date: 'Dec 20, 2025',
      role: 'relations'
    },
    {
      id: 4,
      name: 'Martin Septimus',
      email: 'demo@gmail.com',
      assignedInvestors: 25,
      date: 'Dec 20, 2025',
      role: 'relations'
    },
    {
      id: 5,
      name: 'Talan Curtis',
      email: 'demo@gmail.com',
      assignedInvestors: 25,
      date: 'Dec 20, 2025',
      role: 'relations'
    },
  ];

  const accountantsData = [
    {
      id: 6,
      name: 'Davis Siphron',
      email: 'demo@gmail.com',
      assignedInvestors: 25,
      date: 'Dec 20, 2025',
      role: 'accountants'
    },
    {
      id: 7,
      name: 'Kadin Mango',
      email: 'demo@gmail.com',
      assignedInvestors: 25,
      date: 'Dec 20, 2025',
      role: 'accountants'
    },
    {
      id: 8,
      name: 'Gustavo Botosh',
      email: 'demo@gmail.com',
      assignedInvestors: 25,
      date: 'Dec 20, 2025',
      role: 'accountants'
    },
    {
      id: 9,
      name: 'Martin Septimus',
      email: 'demo@gmail.com',
      assignedInvestors: 25,
      date: 'Dec 20, 2025',
      role: 'accountants'
    },
    {
      id: 10,
      name: 'Talan Curtis',
      email: 'demo@gmail.com',
      assignedInvestors: 25,
      date: 'Dec 20, 2025',
      role: 'accountants'
    },
  ];

  const partnershipsData = [
    {
      id: 11,
      name: 'Davis Siphron',
      email: 'demo@gmail.com',
      associatedFund: 'ABC Fund',
      date: 'Dec 20, 2025',
      role: 'partnerships'
    },
    {
      id: 12,
      name: 'Kadin Mango',
      email: 'demo@gmail.com',
      associatedFund: 'ABC Fund',
      date: 'Dec 20, 2025',
      role: 'partnerships'
    },
    {
      id: 13,
      name: 'Gustavo Botosh',
      email: 'demo@gmail.com',
      associatedFund: 'ABC Fund',
      date: 'Dec 20, 2025',
      role: 'partnerships'
    },
    {
      id: 14,
      name: 'Martin Septimus',
      email: 'demo@gmail.com',
      associatedFund: 'ABC Fund',
      date: 'Dec 20, 2025',
      role: 'partnerships'
    },
    {
      id: 15,
      name: 'Talan Curtis',
      email: 'demo@gmail.com',
      associatedFund: 'ABC Fund',
      date: 'Dec 20, 2025',
      role: 'partnerships'
    },
  ];

  const getCurrentData = () => {
    switch (activeTab) {
      case 'relations':
        return relationsData;
      case 'accountants':
        return accountantsData;
      case 'partnerships':
        return partnershipsData;
      default:
        return relationsData;
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase();
  };

  const handleDelete = (staff: any) => {
    setSelectedStaff(staff);
    setShowDeleteModal(true);
    setActiveDropdown(null);
  };

  const confirmDelete = () => {
    if (activeTab === 'accountants' && selectedStaff) {
      setShowDeleteModal(false);
      setShowReassignModal(true);
    } else {
      // Handle delete logic here
      setShowDeleteModal(false);
      setSelectedStaff(null);
    }
  };

  const handleReassign = () => {
    // Handle reassign logic here
    setShowReassignModal(false);
    setSelectedStaff(null);
    setSelectedAccountant('');
  };

  const currentData = getCurrentData();
  const itemsPerPage = 5;
  const totalPages = Math.ceil(currentData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentStaff = currentData.slice(startIndex, endIndex);

  const tabs = [
    { id: 'relations', label: 'Relations Associates' },
    { id: 'accountants', label: 'Accountants' },
    { id: 'partnerships', label: 'Partnerships' },
  ];

  return (
    <DashboardLayout>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Staff</h1>
            <p className="text-gray-600">Manage platform users, assign roles and permissions, and view activity</p>
          </div>
          <Button
            onClick={() => router.push('/dashboard/staff/add')}
            className="bg-[#FCD34D] hover:bg-[#fbbf24] text-gray-900 px-6 py-2 rounded-full font-medium"
          >
            Add Staff
          </Button>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <div className="flex gap-8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setCurrentPage(1);
                  }}
                  className={`pb-4 px-2 font-medium transition-colors relative ${
                    activeTab === tab.id
                      ? 'text-gray-900'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab.label}
                  {activeTab === tab.id && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#FCD34D]" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Name</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Email</th>
                  {activeTab === 'partnerships' ? (
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Associated Fund</th>
                  ) : (
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Assigned Investors</th>
                  )}
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Date</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {currentStaff.map((staff) => (
                  <tr key={staff.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#1F3B6E] to-[#6B7FBA] flex items-center justify-center text-white font-semibold text-sm">
                          {getInitials(staff.name)}
                        </div>
                        <span className="font-medium text-gray-900">{staff.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{staff.email}</td>
                    <td className="px-6 py-4 text-gray-900">
                      {activeTab === 'partnerships' ? (staff as any).associatedFund : (staff as any).assignedInvestors}
                    </td>
                    <td className="px-6 py-4 text-gray-600">{staff.date}</td>
                    <td className="px-6 py-4">
                      <div className="relative">
                        <button
                          onClick={() => setActiveDropdown(activeDropdown === staff.id ? null : staff.id)}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <MoreVertical className="h-5 w-5 text-gray-600" />
                        </button>
                        
                        {activeDropdown === staff.id && (
                          <>
                            <div 
                              className="fixed inset-0 z-10"
                              onClick={() => setActiveDropdown(null)}
                            />
                            <div className="absolute right-0 top-full mt-2 w-32 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-20">
                              <Link
                                href={`/dashboard/staff/${staff.id}`}
                                className="block w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-50 transition-colors"
                              >
                                View
                              </Link>
                              <button className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-50 transition-colors">
                                Edit
                              </button>
                              <button 
                                onClick={() => handleDelete(staff)}
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

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedStaff && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 relative">
            <button
              onClick={() => {
                setShowDeleteModal(false);
                setSelectedStaff(null);
              }}
              className="absolute top-6 right-6 text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Delete {activeTab === 'accountants' ? 'Accountant' : activeTab === 'partnerships' ? 'Partnership' : 'Relations Associate'}
            </h2>
            <p className="text-gray-600 mb-2 leading-relaxed">
              Are you sure you want to delete this {activeTab === 'accountants' ? 'accountant' : activeTab === 'partnerships' ? 'partnership' : 'relations associate'}? This action cannot be undone.
            </p>
            {activeTab === 'accountants' && (
              <p className="text-gray-600 mb-6 leading-relaxed">
                All assigned investors will be unassigned.
              </p>
            )}
            <div className="flex justify-end gap-4">
              <Button
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedStaff(null);
                }}
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

      {/* Reassign Modal */}
      {showReassignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 relative">
            <button
              onClick={() => {
                setShowReassignModal(false);
                setSelectedStaff(null);
                setSelectedAccountant('');
              }}
              className="absolute top-6 right-6 text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Reassign Investors To</h2>
            <p className="text-gray-600 mb-6 leading-relaxed">
              Select an accountant to manage this investor's KYC documents and communication.
            </p>
            <div className="mb-6">
              <select
                value={selectedAccountant}
                onChange={(e) => setSelectedAccountant(e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1F3B6E] focus:border-transparent"
              >
                <option value="">Select an accountant</option>
                {accountantsData.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-4">
              <Button
                onClick={() => {
                  setShowReassignModal(false);
                  setSelectedStaff(null);
                  setSelectedAccountant('');
                }}
                className="bg-[#FEF3E2] hover:bg-[#fde8c8] text-gray-900 px-8 py-2 rounded-full font-medium"
              >
                Cancel
              </Button>
              <Button
                onClick={handleReassign}
                disabled={!selectedAccountant}
                className="bg-[#FCD34D] hover:bg-[#fbbf24] text-gray-900 px-8 py-2 rounded-full font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Assign
              </Button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
