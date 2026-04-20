'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/DashboardLayout';
import { MoreVertical, Search, Plus, Loader2, ChevronLeft } from 'lucide-react';
import { apiClient } from '@/lib/api/client';
import { toast } from 'sonner';
import { DeleteStaffModal } from '@/components/staff/DeleteStaffModal';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useRouter } from 'next/navigation';

const ROLE_OPTIONS = [
  { id: 'all', label: 'All Roles' },
  { id: 'executive_admin', label: 'Executive Admins' },
  { id: 'admin', label: 'Admins' },
  { id: 'fund_admin', label: 'Fund Admins' },
  { id: 'investor_relations', label: 'Investor Relations' },
  { id: 'accountant', label: 'Accountants' },
  { id: 'partnership', label: 'Partnerships' },
];

export default function StaffPage() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState('all');
  const [staffList, setStaffList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [staffToDelete, setStaffToDelete] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 1,
    limit: 7
  });

  useEffect(() => {
    if (!authLoading && user && !isAdmin) {
      toast.error('Access denied. You do not have permission to view staff.');
      router.push('/dashboard');
    }
  }, [user, isAdmin, authLoading, router]);

  useEffect(() => {
    if (isAdmin) {
      fetchStaff();
    }
  }, [activeTab, isAdmin, currentPage]);

  // Reset to page 1 when filter or search changes
  useEffect(() => {
    setCurrentPage(1);
    setActiveDropdown(null);
  }, [activeTab, searchQuery]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (isAdmin) fetchStaff();
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getStaff(activeTab, currentPage, 7, searchQuery);
      setStaffList(response.data);
      setPagination({
        total: response.meta.total,
        totalPages: response.meta.totalPages,
        limit: response.meta.limit
      });
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
      setActiveDropdown(null);
    }
  };

  const handleDeleteStaff = (staff: any) => {
    setStaffToDelete(staff);
    setIsDeleteModalOpen(true);
    setActiveDropdown(null);
  };

  // Sorting/Filtering is now handled server-side
  const displayStaff = staffList;

  const getInitials = (name: string) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase() || '??';
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-xxl font-helvetica text-[#1F1F1F]">
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

        {/* Filters */}
        <div className="flex flex-col md:flex-row md:items-center gap-4 mb-8">
          <div className="relative max-w-[400px] flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8E8E93] h-4 w-4" />
            <input
              type="text"
              placeholder="Find something here..."
              className="w-full bg-[#f8f9fa] border-none rounded-full py-2.5 pl-11 pr-4 text-[14px] focus:ring-1 focus:ring-[#FFD66B] outline-none"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="relative min-w-[200px]">
            <select
              value={activeTab}
              onChange={(e) => setActiveTab(e.target.value)}
              className="w-full bg-[#f8f9fa] border-none rounded-full py-2.5 pl-6 pr-10 text-[14px] focus:ring-1 focus:ring-[#FFD66B] outline-none appearance-none cursor-pointer font-medium text-[#1F1F1F]"
            >
              {ROLE_OPTIONS.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#8E8E93]">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>

        {/* Table wrapper - Removed overflow-hidden to prevent dropdown clipping */}
        <div className="bg-white rounded-[12px] shadow-sm border border-[#F2F2F2]">
          <div className="min-w-full">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#F2F2F2]">
                  <th className="px-6 py-4 text-[13px] font-medium text-[#8E8E93]">Name</th>
                  <th className="px-6 py-4 text-[13px] font-medium text-[#8E8E93]">Email</th>
                  <th className="px-6 py-4 text-[13px] font-medium text-[#8E8E93]">Role Type</th>
                  <th className="px-6 py-4 text-[13px] font-medium text-[#8E8E93]">Assigned Investors</th>
                  <th className="px-6 py-4 text-[13px] font-medium text-[#8E8E93]">Date</th>
                  <th className="px-6 py-4 text-[13px] font-medium text-[#8E8E93] text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F2F2F2]">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-20 text-center">
                      <Loader2 className="h-8 w-8 animate-spin text-[#FFD66B] mx-auto" />
                    </td>
                  </tr>
                ) : displayStaff.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-20 text-center text-[#8E8E93]">
                      No staff members found in this category.
                    </td>
                  </tr>
                ) : (
                  displayStaff.map((staff) => (
                    <tr key={staff.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-[13px] font-bold text-white overflow-hidden ${staff.role === 'admin' ? 'bg-[#3B82F6]' :
                            staff.role === 'executive_admin' ? 'bg-[#1F1F1F]' :
                              staff.role === 'fund_admin' ? 'bg-[#059669]' :
                                staff.role === 'investor_relations' ? 'bg-[#7C3AED]' :
                                  staff.role === 'accountant' ? 'bg-[#5B21B6]' : 'bg-[#EF4444]'
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
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-[12px] font-medium ${staff.role === 'executive_admin' ? 'bg-[#1F1F1F] text-white' :
                          staff.role === 'admin' ? 'bg-[#3B82F6]/10 text-[#3B82F6]' :
                            staff.role === 'fund_admin' ? 'bg-[#059669]/10 text-[#059669]' :
                              staff.role === 'investor_relations' ? 'bg-[#7C3AED]/10 text-[#7C3AED]' :
                                staff.role === 'accountant' ? 'bg-[#5B21B6]/10 text-[#5B21B6]' : 'bg-[#EF4444]/10 text-[#EF4444]'
                          }`}>
                          {ROLE_OPTIONS.find(o => o.id === staff.role)?.label || staff.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-[14px] text-[#4B4B4B]">
                        {staff.assigned_investors_count || 0}
                      </td>
                      <td className="px-6 py-4 text-[14px] text-[#4B4B4B]">{formatDate(staff.created_at)}</td>
                      <td className="px-6 py-4 text-right relative">
                        <div className="relative inline-block">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveDropdown(activeDropdown === staff.id ? null : staff.id);
                            }}
                            className="p-2 hover:bg-gray-100 rounded-full transition-colors text-[#8E8E93]"
                          >
                            <MoreVertical className="h-5 w-5" />
                          </button>

                          {activeDropdown === staff.id && (
                            <>
                              <div className="fixed inset-0 z-10" onClick={() => setActiveDropdown(null)} />
                              <div className="absolute right-0 top-full mt-1 bg-white border border-[#F2F2F2] rounded-[8px] shadow-xl py-2 w-[120px] z-50 text-left animate-in fade-in zoom-in duration-200">
                                <Link
                                  href={`/dashboard/staff/view/${staff.id}`}
                                  className="block px-4 py-2 text-[13px] text-[#1F1F1F] hover:bg-gray-50 flex items-center gap-2 font-medium"
                                  onClick={() => setActiveDropdown(null)}
                                >
                                  View
                                </Link>
                                <Link
                                  href={`/dashboard/staff/edit/${staff.id}`}
                                  className="block px-4 py-2 text-[13px] text-[#1F1F1F] hover:bg-gray-50 flex items-center gap-2 font-medium"
                                  onClick={() => setActiveDropdown(null)}
                                >
                                  Edit
                                </Link>
                                <button
                                  onClick={() => handleDeleteStaff(staff)}
                                  className="w-full text-left px-4 py-2 text-[13px] text-red-500 hover:bg-gray-50 flex items-center gap-2 border-t border-gray-50 font-medium pt-2 mt-1"
                                >
                                  Delete
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
        </div>

        <DeleteStaffModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={confirmDelete}
          staffName={staffToDelete?.full_name}
          staffRole={activeTab}
        />

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="mt-8 flex justify-center items-center gap-4">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className={`flex items-center gap-1 text-sm font-medium ${currentPage === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-400 hover:text-gray-600 transition-colors'
                }`}
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Previous</span>
            </button>

            <div className="flex gap-1">
              {[...Array(pagination.totalPages)].map((_, i) => (
                <button
                  key={i + 1}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`w-8 h-8 rounded text-sm font-medium transition-colors ${currentPage === i + 1
                    ? 'bg-[#1F3B6E] text-white'
                    : 'text-gray-400 hover:bg-gray-100'
                    }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>

            <button
              onClick={() => setCurrentPage(prev => Math.min(pagination.totalPages, prev + 1))}
              disabled={currentPage === pagination.totalPages}
              className={`flex items-center gap-1 text-sm font-medium ${currentPage === pagination.totalPages ? 'text-gray-300 cursor-not-allowed' : 'text-gray-400 hover:text-gray-600 transition-colors'
                }`}
            >
              <span>Next</span>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
