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

const formatPhoneDisplay = (phoneStr: string | null | undefined): string => {
  if (!phoneStr) return '';
  const COUNTRY_CODES = ['+1 (USA)', '+44 (UK)', '+91 (IN)'];
  const matchedCode = COUNTRY_CODES.find(code => {
    const prefix = code.split(' ')[0];
    return phoneStr.startsWith(prefix) || phoneStr.startsWith(code);
  });
  if (!matchedCode) return phoneStr;
  let prefix = matchedCode;
  let localNumber = '';
  if (phoneStr.startsWith(matchedCode)) {
    prefix = matchedCode;
    localNumber = phoneStr.slice(matchedCode.length).trim();
  } else {
    const cleanPrefix = matchedCode.split(' ')[0];
    if (phoneStr.startsWith(cleanPrefix)) {
      prefix = matchedCode;
      localNumber = phoneStr.slice(cleanPrefix.length).trim();
    }
  }
  let digits = localNumber.replace(/\D/g, '');
  if (prefix.includes('+1')) {
    if (digits.length === 11 && digits.startsWith('1')) {
      digits = digits.slice(1);
    }
  } else if (prefix.includes('+91')) {
    if ((digits.length === 12 || digits.length === 13) && digits.startsWith('91')) {
      digits = digits.slice(2);
    }
    if (digits.length === 11 && digits.startsWith('0')) {
      digits = digits.slice(1);
    }
  } else if (prefix.includes('+44')) {
    if ((digits.length === 12 || digits.length === 13) && digits.startsWith('44')) {
      digits = digits.slice(2);
    }
  }
  const isUK = prefix.includes('+44');
  const maxDigits = isUK ? 11 : 10;
  if (digits.length > maxDigits) {
    digits = digits.slice(0, maxDigits);
  }
  let formatted = '';
  if (digits.length === 0) {
    formatted = '';
  } else if (digits.length <= 3) {
    formatted = `(${digits}`;
  } else if (digits.length <= 6) {
    formatted = `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  } else if (digits.length <= 10) {
    formatted = `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
  } else {
    formatted = `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 11)}`;
  }
  return `${prefix} ${formatted}`.trim();
};

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

        {/* Top Header Summary Profile Card */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 sm:p-5 bg-gradient-to-r from-amber-50/40 via-white to-gray-50/40 rounded-2xl border border-amber-100/60 shadow-xs mb-6">
          {/* Left: Avatar & Name/Joined Date */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-full border-2 border-amber-200/80 shadow-xs overflow-hidden bg-amber-100 shrink-0 flex items-center justify-center">
              {staff.profile_image_url ? (
                <Image
                  src={staff.profile_image_url}
                  alt={staff.full_name}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full bg-[#FCD34D] flex items-center justify-center text-[#1F1F1F] text-xl sm:text-2xl font-extrabold tracking-tight">
                  {getInitials(staff.full_name)}
                </div>
              )}
            </div>
            <div className="flex flex-col min-w-0">
              <h2 className="text-xl sm:text-2xl font-bold text-[#1F1F1F] leading-tight truncate">
                {staff.full_name}
              </h2>
              <p className="text-xs text-gray-500 font-medium mt-1 flex items-center gap-1">
                Joined date: <span className="text-gray-800 font-semibold">{formatDate(staff.created_at)}</span>
              </p>
            </div>
          </div>

          {/* Top Right: Action Buttons */}
          <div className="flex items-center justify-start sm:justify-end gap-2 overflow-x-auto max-w-full pb-1 shrink-0">
            <button
              onClick={() => setIsDeleteModalOpen(true)}
              className="h-9 px-5 text-xs font-bold rounded-full transition-colors border flex items-center gap-1.5 whitespace-nowrap shadow-xs shrink-0 bg-red-50 text-red-700 hover:bg-red-100 border-red-200"
            >
              Delete
            </button>
            <Link
              href={`/dashboard/staff/edit/${staff.id}`}
              className="h-9 px-6 text-xs font-bold rounded-full transition-colors border flex items-center gap-1.5 whitespace-nowrap shadow-xs shrink-0 bg-[#FCD34D] text-[#1F1F1F] hover:bg-[#FBD24E] border-transparent"
            >
              Edit
            </Link>
          </div>
        </div>

        {/* Details Card Section */}
        <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs p-5 sm:p-6 space-y-4 mb-6">
          <h3 className="text-xs font-bold text-[#1F1F1F] uppercase tracking-wider pb-2 border-b border-gray-100">
            Staff Details
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            <div className="space-y-0.5">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">Email</span>
              <a
                href={`https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(staff.email || '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs sm:text-sm font-bold text-gray-900 truncate block hover:text-[#2A4474] hover:underline cursor-pointer transition-colors"
                title="Click to compose email in Gmail"
              >
                {staff.email}
              </a>
            </div>

            <div className="space-y-0.5">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">Phone Number</span>
              <p
                onClick={() => {
                  if (staff.phone) {
                    navigator.clipboard.writeText(staff.phone);
                    toast.success('Phone number copied to clipboard');
                  }
                }}
                className="text-xs sm:text-sm font-bold text-gray-900 cursor-pointer hover:text-amber-600 transition-colors block"
                title="Click to copy phone number"
              >
                {formatPhoneDisplay(staff.phone) || '(Not set)'}
              </p>
            </div>

            <div className="space-y-0.5">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">Password</span>
              <p className="text-xs sm:text-sm font-bold text-gray-900">••••••••</p>
            </div>

            <div className="space-y-0.5">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">Role</span>
              <p className="text-xs sm:text-sm font-bold text-gray-900 capitalize">{staff.role?.replace('_', ' ')}</p>
            </div>

            {staff.associated_fund_name && (
              <div className="space-y-0.5">
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">Associated Fund</span>
                <p className="text-xs sm:text-sm font-bold text-[#2A4474]">{staff.associated_fund_name}</p>
              </div>
            )}
          </div>
        </div>

        {/* Assignments Table Section */}
        {staff.role !== 'partnership' && (
          <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs p-5 sm:p-6 space-y-4">
            <h3 className="text-xs font-bold text-[#1F1F1F] uppercase tracking-wider pb-2 border-b border-gray-100">
              Assigned Investors
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="px-4 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Assigned Date</th>
                    <th className="px-4 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Investor Name</th>
                    <th className="px-4 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider text-right pr-6">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {currentInvestors.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-4 py-12 text-center text-xs text-gray-400 italic">
                        No assigned investors yet
                      </td>
                    </tr>
                  ) : (
                    currentInvestors.map((investor) => (
                      <tr key={investor.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 text-xs text-gray-600 font-medium">{formatDate(investor.updated_at || investor.created_at)}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-full bg-[#274583] flex items-center justify-center text-white font-bold text-[10px] shrink-0">
                              {getInitials(investor.full_name)}
                            </div>
                            <span className="text-xs font-bold text-[#1F1F1F]">{investor.full_name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right pr-6">
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
                                <div className="absolute right-0 top-full mt-1 w-36 bg-white rounded-xl shadow-lg border border-gray-100 py-1.5 z-20">
                                  <Link
                                    href={`/dashboard/investor/${investor.id}`}
                                    className="block w-full px-3 py-1.5 text-left text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
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
              <div className="flex items-center justify-end pt-3 gap-3 border-t border-gray-100">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className={`flex items-center gap-1 text-xs font-bold ${currentPage === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:text-gray-800'}`}
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span>Previous</span>
                </button>

                <div className="flex gap-1">
                  {[...Array(totalPages)].map((_, i) => (
                    <button
                      key={i + 1}
                      onClick={() => setCurrentPage(i + 1)}
                      className={`w-7 h-7 rounded-lg text-xs font-bold transition-colors ${currentPage === i + 1 ? 'bg-[#1F3B6E] text-white' : 'text-gray-500 hover:bg-gray-100'}`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className={`flex items-center gap-1 text-xs font-bold ${currentPage === totalPages ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:text-gray-800'}`}
                >
                  <span>Next</span>
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        )}

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
