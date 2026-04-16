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

        {/* Staff Info Card */}
        <div className="bg-white rounded-lg shadow-sm p-8 mb-6">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Profile Image */}
            <div className="flex-shrink-0">
              {staffData.profile_image_url ? (
                <div className="w-48 h-48 rounded-lg overflow-hidden relative border border-gray-100 shadow-sm">
                   <Image 
                    src={staffData.profile_image_url} 
                    alt={staffData.full_name} 
                    fill 
                    className="object-cover"
                    sizes="192px"
                  />
                </div>
              ) : (
                <div className="w-48 h-48 rounded-lg bg-gradient-to-br from-[#1F3B6E] to-[#6B7FBA] flex items-center justify-center text-white text-5xl font-bold overflow-hidden shadow-sm">
                  {getInitials(staffData.full_name || staffData.name)}
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-1">{staffData.full_name || staffData.name}</h2>
                  <p className="text-gray-600">Joined date: {new Date(staffData.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                </div>
                <div className="flex gap-3">
                  <Button
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
                    className="bg-white border border-gray-200 hover:bg-gray-50 text-gray-900 px-6 py-2 rounded-full font-medium"
                  >
                    Delete
                  </Button>
                  <Button
                    onClick={() => router.push(`/dashboard/staff/edit?id=${staffData.id}`)}
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
                  <p className="text-gray-900 font-medium">{staffData.phone || '(Not set)'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Password</p>
                  <p className="text-gray-900 font-medium">••••••••</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Role</p>
                  <p className="text-gray-900 font-medium capitalize">{staffData.role?.replace('_', ' ')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Assigned Investors Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-100">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-xl font-bold text-gray-900">Assigned Investors</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#F9FAFB] border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Assigned Date</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Investor Name</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {currentInvestors.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-12 text-center text-gray-500 italic">
                      No assigned investors yet
                    </td>
                  </tr>
                ) : (
                  currentInvestors.map((investor) => (
                    <tr key={investor.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-gray-600 text-sm">{new Date(investor.updated_at || investor.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#1F3B6E] to-[#6B7FBA] flex items-center justify-center text-white font-semibold text-sm">
                            {getInitials(investor.full_name)}
                          </div>
                          <span className="font-medium text-gray-900">{investor.full_name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="relative">
                          <button
                            onClick={() => setActiveDropdown(activeDropdown === investor.id ? null : investor.id)}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                          >
                            < MoreVertical className="h-5 w-5 text-gray-400" />
                          </button>
                          
                          {activeDropdown === investor.id && (
                            <>
                              <div 
                                className="fixed inset-0 z-10"
                                onClick={() => setActiveDropdown(null)}
                              />
                              <div className="absolute right-0 top-0 mt-8 w-40 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-20">
                                <Link 
                                  href={`/dashboard/investor/${investor.id}`}
                                  className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors"
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
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 text-gray-600 hover:text-gray-900 disabled:opacity-40 disabled:cursor-not-allowed font-medium text-sm"
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
                className="px-4 py-2 text-gray-600 hover:text-gray-900 disabled:opacity-40 disabled:cursor-not-allowed font-medium text-sm"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
