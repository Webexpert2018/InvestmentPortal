'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { DashboardLayout } from '@/components/DashboardLayout';
import { ChevronLeft, Loader2, MoreVertical, Search, Plus, Trash2, Edit2, User } from 'lucide-react';
import { apiClient } from '@/lib/api/client';
import { toast } from 'sonner';
import { DeleteStaffModal } from '@/components/staff/DeleteStaffModal';

export default function ViewStaffPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [staff, setStaff] = useState<any>(null);
  const [assignedInvestors, setAssignedInvestors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchData();
    }
  }, [id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [staffData, investorsData] = await Promise.all([
        apiClient.getStaffById(id),
        apiClient.getStaffAssignedInvestors(id)
      ]);
      setStaff(staffData);
      setAssignedInvestors(investorsData);
    } catch (error: any) {
      console.error('Error fetching staff data:', error);
      toast.error(error.message || 'Failed to load staff details');
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = async () => {
    try {
      setIsDeleting(true);
      await apiClient.deleteStaff(id);
      toast.success('Staff member deleted successfully');
      router.push('/dashboard/staff');
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete staff member');
    } finally {
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
    }
  };

  const handleDelete = () => {
    setIsDeleteModalOpen(true);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getInitials = (name: string) => {
    if (!name) return '??';
    return name?.split(' ').map(n => n[0]).join('').toUpperCase() || '??';
  };

  const itemsPerPage = 5;
  const totalPages = Math.ceil(assignedInvestors.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentInvestors = assignedInvestors.slice(startIndex, startIndex + itemsPerPage);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex h-[60vh] items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-[#FFD66B]" />
        </div>
      </DashboardLayout>
    );
  }

  if (!staff) {
    return (
      <DashboardLayout>
        <div className="text-center py-20">
          <p className="text-[#8E8E93]">Staff member not found.</p>
          <Link href="/dashboard/staff" className="mt-4 text-[#274583] underline underline-offset-4">Back to Staff</Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-xxl font-helvetica text-[#1F1F1F] p-4 lg:p-8">
        {/* Breadcrumb / Back Link */}
        <div className="mb-8 items-center flex gap-2">
          <button onClick={() => router.back()} className="flex items-center gap-2 group">
            <ChevronLeft className="h-5 w-5 text-[#1F1F1F]" />
            <span className="text-[17px] font-semibold text-[#1F1F1F]">Staff Details</span>
          </button>
        </div>

        {/* Column 1: Profile Photo */}
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex-shrink-0">
            <div className="w-[240px] h-[340px] rounded-xl overflow-hidden shadow-md relative bg-gray-100">
              {staff.profile_image_url ? (
                <Image 
                  src={staff.profile_image_url} 
                  alt={staff.full_name} 
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-[#274583] text-white text-[80px] font-bold">
                  {getInitials(staff.full_name)}
                </div>
              )}
            </div>
          </div>

          {/* Column 2: Content Details */}
          <div className="flex-1">
            {/* Header: Name, Date, Buttons */}
            <div className="flex items-start justify-between mb-8">
              <div>
                <h1 className="text-[32px] font-serif font-medium text-[#1F1F1F] mb-1">{staff.full_name}</h1>
                <p className="text-gray-500 text-sm">Joined date: {formatDate(staff.created_at)}</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleDelete}
                  className="bg-[#FFFBEB] hover:bg-[#FEF3C7] text-gray-500 px-8 py-2 rounded-full font-medium border-none shadow-none transition-all"
                >
                  Delete
                </button>
                <Link
                  href={`/dashboard/staff/edit/${staff.id}`}
                  className="bg-[#FCD34D] hover:bg-[#fbbf24] text-gray-900 px-10 py-2 rounded-full font-medium border-none shadow-sm transition-all"
                >
                  Edit
                </Link>
              </div>
            </div>

            {/* Fields Arrangement */}
            <div className="grid grid-cols-2 gap-y-8 gap-x-12 mb-12">
              <div>
                <p className="text-[12px] tracking-wider text-gray-400 mb-2 font-bold">Email</p>
                <p className="text-[18px] text-[#1F1F1F] font-medium">{staff.email}</p>
              </div>
              <div>
                <p className="text-[12px] tracking-wider text-gray-400 mb-2 font-bold">Phone Number</p>
                <p className="text-[18px] text-[#1F1F1F] font-medium">{staff.phone || '(Not set)'}</p>
              </div>
              <div className="col-span-1">
                <p className="text-[12px] tracking-wider text-gray-400 mb-2 font-bold">Password</p>
                <p className="text-[18px] text-[#1F1F1F] font-medium">••••••••</p>
              </div>
              <div className="col-span-1">
                <p className="text-[12px] tracking-wider text-gray-400 mb-2 font-bold">Role</p>
                <p className="text-[18px] text-[#1F1F1F] font-medium capitalize">{staff.role?.replace('_', ' ')}</p>
              </div>
              {staff.associated_fund_name && (
                <div className="col-span-1">
                  <p className="text-[12px] tracking-wider text-gray-400 mb-2 font-bold">Associated Fund</p>
                  <p className="text-[18px] text-[#274583] font-medium">{staff.associated_fund_name}</p>
                </div>
              )}
            </div>

            {/* Assignments Table */}
            {staff.role !== 'partnership' && (
              <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-100">
                <div className="bg-[#F8F9FA] border-b border-gray-100 px-6 py-4">
                  <h3 className="text-[15px] font-bold text-[#1F1F1F]">Assigned Investors</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="px-6 py-4 text-[11px] font-bold text-gray-500">Assigned Date</th>
                        <th className="px-6 py-4 text-[11px] font-bold text-gray-500">Investor Name</th>
                        <th className="px-6 py-4 text-[11px] font-bold text-gray-500 text-right pr-12">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {currentInvestors.length === 0 ? (
                        <tr>
                          <td colSpan={3} className="px-6 py-16 text-center text-gray-400 bg-white italic font-medium">
                            No assigned investors yet
                          </td>
                        </tr>
                      ) : (
                        currentInvestors.map((investor) => (
                          <tr key={investor.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4 text-gray-600 text-sm">{formatDate(investor.updated_at || investor.created_at)}</td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-[#274583] flex items-center justify-center text-white font-semibold text-[11px]">
                                  {getInitials(investor.full_name)}
                                </div>
                                <span className="text-[14px] font-medium text-[#1F1F1F]">{investor.full_name}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-right pr-12">
                              <div className="relative inline-block text-left">
                                <button
                                  onClick={() => setActiveDropdown(activeDropdown === investor.id ? null : investor.id)}
                                  className="p-1 hover:bg-gray-100 rounded-md transition-colors"
                                >
                                  <MoreVertical className="h-4 w-4 text-gray-400" />
                                </button>
                                
                                {activeDropdown === investor.id && (
                                  <>
                                    <div 
                                      className="fixed inset-0 z-10"
                                      onClick={() => setActiveDropdown(null)}
                                    />
                                    <div className="absolute right-0 top-full mt-2 w-36 bg-white rounded-lg shadow-xl border border-gray-100 py-2 z-20">
                                      <Link 
                                        href={`/dashboard/investor/${investor.id}`}
                                        className="block w-full px-4 py-2 text-left text-[13px] text-gray-700 hover:bg-gray-50 transition-colors"
                                      >
                                        View Profile
                                      </Link>
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
                {totalPages > 1 && (
                  <div className="flex items-center justify-end px-6 py-4 gap-4 border-t border-gray-50">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className={`flex items-center gap-1 text-sm font-medium ${currentPage === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      <span>Previous</span>
                    </button>

                    <div className="flex gap-1">
                      {[...Array(totalPages)].map((_, i) => (
                        <button
                          key={i + 1}
                          onClick={() => setCurrentPage(i + 1)}
                          className={`w-8 h-8 rounded text-sm font-medium transition-colors ${currentPage === i + 1 ? 'bg-[#1F3B6E] text-white' : 'text-gray-400 hover:bg-gray-100'}`}
                        >
                          {i + 1}
                        </button>
                      ))}
                    </div>

                    <button
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className={`flex items-center gap-1 text-sm font-medium ${currentPage === totalPages ? 'text-gray-300 cursor-not-allowed' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                      <span>Next</span>
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <DeleteStaffModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={confirmDelete}
          staffName={staff.full_name}
          staffRole={staff.role}
        />
      </div>
    </DashboardLayout>
  );
}

function ChevronRight(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}
