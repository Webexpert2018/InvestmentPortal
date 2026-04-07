'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
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
  const [loading, setLoading] = useState(true);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (id) {
      fetchStaff();
    }
  }, [id]);

  const fetchStaff = async () => {
    try {
      const data = await apiClient.getStaffById(id);
      setStaff(data);
    } catch (error) {
      console.error('Error fetching staff:', error);
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
    } catch (error) {
      toast.error('Failed to delete staff member');
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
          <Link href="/dashboard/staff" className="flex items-center gap-2 group">
            <ChevronLeft className="h-5 w-5 text-[#1F1F1F]" />
            <span className="text-[17px] font-semibold text-[#1F1F1F]">Staff Details</span>
          </Link>
        </div>

        {/* Column 1: Profile Photo */}
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex-shrink-0">
            <div className="w-[240px] h-[340px] rounded-xl overflow-hidden shadow-md">
              {staff.profile_image_url ? (
                <img src={staff.profile_image_url} alt={staff.full_name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-[#274583] text-white text-[80px] font-bold">
                  {staff.full_name?.split(' ').map((n: any) => n[0]).join('').toUpperCase()}
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
                <p className="text-[18px] text-[#1F1F1F] font-medium">{staff.phone || '(+1) 4589 6992'}</p>
              </div>
              <div className="col-span-1">
                <p className="text-[12px] tracking-wider text-gray-400 mb-2 font-bold">Password</p>
                <p className="text-[18px] text-[#1F1F1F] font-medium">••••••••</p>
              </div>
              {staff.role === 'partnership' && (
                <div className="col-span-1">
                  <p className="text-[12px] tracking-wider text-gray-400 mb-2 font-bold">Associated Fund</p>
                  <p className="text-[18px] text-[#274583] font-medium">{staff.associated_fund_name || 'No fund assigned'}</p>
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
                      <tr>
                        <td colSpan={3} className="px-6 py-16 text-center text-gray-400 bg-white italic font-medium">
                          No assigned investors yet
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-end px-6 py-8 gap-4 border-t border-gray-50">
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
