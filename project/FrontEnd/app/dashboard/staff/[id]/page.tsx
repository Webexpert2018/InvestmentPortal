'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DashboardLayout } from '@/components/DashboardLayout';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { apiClient } from '@/lib/api/client';
import { toast } from 'sonner';

export default function StaffDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [currentPage, setCurrentPage] = useState(1);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [staffData, setStaffData] = useState<any>(null);
  const [assignedInvestors, setAssignedInvestors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [staff, investors] = await Promise.all([
          apiClient.getStaffById(params.id as string),
          apiClient.getStaffAssignedInvestors(params.id as string)
        ]);
        setStaffData(staff);
        setAssignedInvestors(investors);
      } catch (err: any) {
        toast.error(err.message || 'Failed to fetch staff details');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchData();
    }
  }, [params.id]);

  const itemsPerPage = 5;
  const totalPages = Math.ceil(assignedInvestors.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentInvestors = assignedInvestors.slice(startIndex, endIndex);

  const getInitials = (name: string) => {
    if (!name) return '??';
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase();
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1F3B6E]"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!staffData) {
    return (
      <DashboardLayout>
        <div className="p-8 text-center text-gray-500">
          Staff member not found.
        </div>
      </DashboardLayout>
    );
  }

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

        {/* Top Header Summary Profile Card */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 sm:p-5 bg-gradient-to-r from-amber-50/40 via-white to-gray-50/40 rounded-2xl border border-amber-100/60 shadow-xs mb-6">
          {/* Left: Avatar & Name/Joined Date */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-full border-2 border-amber-200/80 shadow-xs overflow-hidden bg-amber-100 shrink-0 flex items-center justify-center">
              {staffData.profile_image_url ? (
                <Image
                  src={staffData.profile_image_url}
                  alt={staffData.full_name || staffData.name}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full bg-[#FCD34D] flex items-center justify-center text-[#1F1F1F] text-xl sm:text-2xl font-extrabold tracking-tight">
                  {getInitials(staffData.full_name || staffData.name)}
                </div>
              )}
            </div>
            <div className="flex flex-col min-w-0">
              <h2 className="text-xl sm:text-2xl font-bold text-[#1F1F1F] leading-tight truncate">
                {staffData.full_name || staffData.name}
              </h2>
              <p className="text-xs text-gray-500 font-medium mt-1 flex items-center gap-1">
                Joined date: <span className="text-gray-800 font-semibold">{new Date(staffData.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
              </p>
            </div>
          </div>

          {/* Top Right: Action Buttons */}
          <div className="flex items-center justify-start sm:justify-end gap-2 overflow-x-auto max-w-full pb-1 shrink-0">
            <button
              onClick={async () => {
                if (confirm('Are you sure you want to delete this staff member?')) {
                  try {
                    await apiClient.deleteStaff(staffData.id);
                    toast.success('Staff deleted');
                    router.push('/dashboard/staff');
                  } catch (err: any) {
                    toast.error(err.message || 'Failed to delete');
                  }
                }
              }}
              className="h-9 px-5 text-xs font-bold rounded-full transition-colors border flex items-center gap-1.5 whitespace-nowrap shadow-xs shrink-0 bg-red-50 text-red-700 hover:bg-red-100 border-red-200"
            >
              Delete
            </button>
            <button
              onClick={() => router.push(`/dashboard/staff/edit/${staffData.id}`)}
              className="h-9 px-6 text-xs font-bold rounded-full transition-colors border flex items-center gap-1.5 whitespace-nowrap shadow-xs shrink-0 bg-[#FCD34D] text-[#1F1F1F] hover:bg-[#FBD24E] border-transparent"
            >
              Edit
            </button>
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
                href={`https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(staffData.email || '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs sm:text-sm font-bold text-gray-900 truncate block hover:text-[#2A4474] hover:underline cursor-pointer transition-colors"
                title="Click to compose email in Gmail"
              >
                {staffData.email}
              </a>
            </div>

            <div className="space-y-0.5">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">Phone Number</span>
              <p
                onClick={() => {
                  if (staffData.phone) {
                    navigator.clipboard.writeText(staffData.phone);
                    toast.success('Phone number copied to clipboard');
                  }
                }}
                className="text-xs sm:text-sm font-bold text-gray-900 cursor-pointer hover:text-amber-600 transition-colors block"
                title="Click to copy phone number"
              >
                {staffData.phone || '(Not set)'}
              </p>
            </div>

            <div className="space-y-0.5">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">Password</span>
              <p className="text-xs sm:text-sm font-bold text-gray-900">••••••••</p>
            </div>

            <div className="space-y-0.5">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">Role</span>
              <p className="text-xs sm:text-sm font-bold text-gray-900 capitalize">{staffData.role?.replace('_', ' ')}</p>
            </div>
          </div>
        </div>

        {/* Assigned Investors Table Section */}
        {staffData.role !== 'partnership' && (
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
                        <td className="px-4 py-3 text-xs text-gray-600 font-medium">
                          {new Date(investor.updated_at || investor.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </td>
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
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`w-7 h-7 rounded-lg text-xs font-bold transition-colors ${currentPage === page ? 'bg-[#1F3B6E] text-white' : 'text-gray-500 hover:bg-gray-100'}`}
                    >
                      {page}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className={`flex items-center gap-1 text-xs font-bold ${currentPage === totalPages ? 'text-gray-300 cursor-not-allowed' : 'text-gray-400 hover:text-gray-800'}`}
                >
                  <span>Next</span>
                  <ChevronLeft className="h-4 w-4 rotate-180" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
