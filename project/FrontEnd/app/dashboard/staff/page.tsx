'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/DashboardLayout';
import { MoreVertical, Search, Plus, Loader2, ChevronLeft } from 'lucide-react';
import { apiClient } from '@/lib/api/client';
import { toast } from 'sonner';
import { DeleteStaffModal } from '@/components/staff/DeleteStaffModal';

const ROLE_TABS = [
  { id: 'relations_associate', label: 'Relations Associates' },
  { id: 'accountant', label: 'Accountants' },
  { id: 'partnership', label: 'Partnerships' },
];

export default function StaffPage() {
  const [activeTab, setActiveTab] = useState(ROLE_TABS[0].id);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [staffToDelete, setStaffToDelete] = useState<any>(null);

  useEffect(() => {
    fetchStaff();
  }, [activeTab]);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const data = await apiClient.getStaff(activeTab);
      setStaffList(data);
    } catch (error) {
      console.error('Error fetching staff:', error);
      toast.error('Failed to load staff list');
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!staffToDelete) return;
    try {
      await apiClient.deleteStaff(staffToDelete.id);
      toast.success('Staff member deleted successfully');
      fetchStaff();
    } catch (error) {
      toast.error('Failed to delete staff member');
    } finally {
      setIsDeleteModalOpen(false);
      setStaffToDelete(null);
    }
  };

  const handleDeleteStaff = (staff: any) => {
    setStaffToDelete(staff);
    setIsDeleteModalOpen(true);
  };

  const filteredStaff = staffList.filter(s => 
    s.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getInitials = (name: string) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase() || '??';
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-[1400px] font-helvetica text-[#1F1F1F]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="font-goudy text-[34px] leading-tight text-[#1F1F1F]">Staff</h1>
            <p className="text-[#8E8E93] text-[14px] mt-1">Manage platform users, assign roles and permissions, and view activity</p>
          </div>
          <Link 
            href="/dashboard/staff/add"
            className="bg-[#FFD66B] hover:bg-[#FFC840] text-[#1F1F1F] px-6 py-2.5 rounded-full font-semibold transition-colors flex items-center justify-center gap-2 text-[14px]"
          >
            Add Staff
          </Link>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-8 border-b border-[#F2F2F2] mb-8 overflow-x-auto whitespace-nowrap scrollbar-hide">
          {ROLE_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-4 text-[15px] font-medium transition-all relative ${
                activeTab === tab.id ? 'text-[#1F1F1F]' : 'text-[#8E8E93] hover:text-[#1F1F1F]'
              }`}
            >
              {tab.label}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 w-full h-[2px] bg-[#FFD66B]" />
              )}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="mb-6 relative max-w-[400px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8E8E93] h-4 w-4" />
          <input
            type="text"
            placeholder="Find something here..."
            className="w-full bg-[#f8f9fa] border-none rounded-full py-2.5 pl-11 pr-4 text-[14px] focus:ring-1 focus:ring-[#FFD66B] outline-none"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Table wrapper - Removed overflow-hidden to prevent dropdown clipping */}
        <div className="bg-white rounded-[12px] shadow-sm border border-[#F2F2F2]">
          <div className="min-w-full">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#F2F2F2]">
                  <th className="px-6 py-4 text-[13px] font-medium text-[#8E8E93]">Name</th>
                  <th className="px-6 py-4 text-[13px] font-medium text-[#8E8E93]">Email</th>
                  <th className="px-6 py-4 text-[13px] font-medium text-[#8E8E93]">
                    {activeTab === 'partnership' ? 'Associated Fund' : 'Assigned Investors'}
                  </th>
                  <th className="px-6 py-4 text-[13px] font-medium text-[#8E8E93]">Date</th>
                  <th className="px-6 py-4 text-[13px] font-medium text-[#8E8E93] text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F2F2F2]">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="py-20 text-center">
                      <Loader2 className="h-8 w-8 animate-spin text-[#FFD66B] mx-auto" />
                    </td>
                  </tr>
                ) : filteredStaff.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-20 text-center text-[#8E8E93]">
                      No staff members found in this category.
                    </td>
                  </tr>
                ) : (
                  filteredStaff.map((staff) => (
                    <tr key={staff.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-[13px] font-bold text-white overflow-hidden ${
                            activeTab === 'relations_associate' ? 'bg-[#274583]' : 
                            activeTab === 'accountant' ? 'bg-[#5B21B6]' : 'bg-[#EF4444]'
                          }`}>
                            {staff.profile_image_url ? (
                              <img src={staff.profile_image_url} alt={staff.full_name} className="w-full h-full object-cover" />
                            ) : (
                              getInitials(staff.full_name)
                            )}
                          </div>
                          <span className="text-[14px] font-medium text-[#1F1F1F]">{staff.full_name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-[14px] text-[#4B4B4B]">{staff.email}</td>
                      <td className="px-6 py-4 text-[14px] text-[#4B4B4B]">
                        {activeTab === 'partnership' ? (staff.associated_fund_name || 'N/A') : staff.assigned_investors_count}
                      </td>
                      <td className="px-6 py-4 text-[14px] text-[#4B4B4B]">{formatDate(staff.created_at)}</td>
                      <td className="px-6 py-4 text-right z-20 relative">
                        <div className="relative inline-block group">
                          <button className="p-2 hover:bg-gray-100 rounded-full transition-colors text-[#8E8E93]">
                            <MoreVertical className="h-5 w-5" />
                          </button>
                          <div className="hidden group-hover:block absolute right-0 top-full mt-1 bg-white border border-[#F2F2F2] rounded-[8px] shadow-xl py-2 w-[120px] z-50 text-left">
                            <Link href={`/dashboard/staff/view/${staff.id}`} className="block px-4 py-2 text-[13px] text-[#1F1F1F] hover:bg-gray-50 flex items-center gap-2 font-medium">View</Link>
                            <Link href={`/dashboard/staff/edit/${staff.id}`} className="block px-4 py-2 text-[13px] text-[#1F1F1F] hover:bg-gray-50 flex items-center gap-2 font-medium">Edit</Link>
                            <button onClick={() => handleDeleteStaff(staff)} className="w-full text-left px-4 py-2 text-[13px] text-red-500 hover:bg-gray-50 flex items-center gap-2 border-t border-gray-50 font-medium pt-2 mt-1">Delete</button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <DeleteStaffModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={confirmDelete}
          staffName={staffToDelete?.full_name}
          staffRole={activeTab}
        />

        {/* Pagination */}
        <div className="mt-8 flex justify-end items-center gap-4">
          <button disabled className="flex items-center gap-1 text-gray-300 cursor-not-allowed text-sm font-medium">
            <ChevronLeft className="h-4 w-4" />
            <span>Previous</span>
          </button>
          
          <div className="flex gap-1">
            <button className="w-8 h-8 rounded text-sm font-medium bg-[#1F3B6E] text-white">1</button>
            <button className="w-8 h-8 rounded text-sm font-medium text-gray-400 hover:bg-gray-100">2</button>
            <button className="w-8 h-8 rounded text-sm font-medium text-gray-400 hover:bg-gray-100">3</button>
          </div>

          <button className="flex items-center gap-1 text-gray-400 hover:text-gray-600 text-sm font-medium transition-colors">
            <span>Next</span>
            <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
}
