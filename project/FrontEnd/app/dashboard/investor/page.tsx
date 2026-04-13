'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Search, ChevronDown, MoreVertical, X } from 'lucide-react';
import { apiClient, BASE_URL } from '@/lib/api/client';
import { toast } from 'sonner';
import Image from 'next/image';

interface Investor {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  invested: string;
  kycStatus: string;
  profileImageUrl: string | null;
  createdAt: string;
  avatar: string;
}

export default function InvestorPage() {
  const [investors, setInvestors] = useState<Investor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [kycFilter, setKycFilter] = useState('');
  const [accountTypeFilter, setAccountTypeFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  const itemsPerPage = 7;

  const fetchInvestors = async () => {
    try {
      setLoading(true);
      const data = await apiClient.getAllUsers();
      setInvestors(data);
    } catch (error) {
      console.error('Failed to fetch investors:', error);
      toast.error('Failed to load investors');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvestors();
  }, []);

  const getKycStatusStyle = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'approved':
        return 'bg-[#F2FAF6] text-[#10B981] border-[#D1FAE5]';
      case 'pending':
        return 'bg-[#FFF9EE] text-[#F59E0B] border-[#FEF3C7]';
      case 'rejected':
        return 'bg-[#FEF2F2] text-[#EF4444] border-[#FEE2E2]';
      default:
        return 'bg-gray-100 text-gray-500 border-gray-200';
    }
  };

  const filteredInvestors = investors.filter(investor => {
    const fullNameStr = (investor.firstName + ' ' + (investor.lastName || '')).toLowerCase();
    const matchesSearch = fullNameStr.includes(searchQuery.toLowerCase()) ||
      investor.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesKyc = !kycFilter || investor.kycStatus?.toLowerCase() === kycFilter.toLowerCase();
    return matchesSearch && matchesKyc;
  });

  const totalPages = Math.ceil(filteredInvestors.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const displayedInvestors = filteredInvestors.slice(startIndex, startIndex + itemsPerPage);

  return (
    <DashboardLayout>
      <div className="space-y-8 font-sans max-w-xxl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-2">
          <div>
            <h1 className="text-3xl font-bold text-[#111827] tracking-tight">Investors</h1>
            <p className="text-[#6B7280] mt-1 font-medium">
              View and manage all investor accounts.
            </p>
          </div>
          <button
            onClick={() => setShowInviteModal(true)}
            className="px-8 py-3 bg-[#FCD34D] text-[#1F2937] text-sm font-bold rounded-full hover:bg-[#FBD24E] transition-all shadow-sm active:scale-95"
          >
            Invite Investor
          </button>
        </div>

        {/* Filters and Table Container */}
        <div className="bg-[#FFFFFF] rounded-[24px] shadow-sm border border-[#F3F4F6] overflow-hidden">

          {/* Action Bar */}
          <div className="p-6 border-b border-[#F3F4F6]">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search Box */}
              <div className="relative max-w-md w-full">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#9CA3AF]" />
                <input
                  type="text"
                  placeholder="Find something here..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-[#F9FAFB] border-none rounded-full text-sm text-[#111827] placeholder:text-[#9CA3AF] focus:ring-2 focus:ring-[#FCD34D] transition-all"
                />
              </div>

              {/* KYC Status Filter */}
              <div className="relative">
                <select
                  value={kycFilter}
                  onChange={(e) => setKycFilter(e.target.value)}
                  className="appearance-none pl-5 pr-10 py-3 bg-[#F9FAFB] border-none rounded-full text-sm font-medium text-[#4B5563] cursor-pointer focus:ring-2 focus:ring-[#FCD34D] transition-all min-w-[150px]"
                >
                  <option value="">KYC Status</option>
                  <option value="approved">Approved</option>
                  <option value="pending">Pending</option>
                  <option value="rejected">Rejected</option>
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9CA3AF] pointer-events-none" />
              </div>

              {/* Account Type Filter */}
              <div className="relative">
                <select
                  value={accountTypeFilter}
                  onChange={(e) => setAccountTypeFilter(e.target.value)}
                  className="appearance-none pl-5 pr-10 py-3 bg-[#F9FAFB] border-none rounded-full text-sm font-medium text-[#4B5563] cursor-pointer focus:ring-2 focus:ring-[#FCD34D] transition-all min-w-[150px]"
                >
                  <option value="">Account Type</option>
                  <option value="Personal">Personal</option>
                  <option value="IRA">IRA</option>
                  <option value="Roth IRA">Roth IRA</option>
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9CA3AF] pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[#6B7280] text-[13px] font-semibold uppercase tracking-wider bg-[#F9FAFB]/50">
                  <th className="px-6 py-4 text-left text-sm font-semibold text-[#4B4B4B] capitalize">Investor Name</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-[#4B4B4B] capitalize">Email</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-[#4B4B4B] capitalize">Account Type</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-[#4B4B4B] capitalize">KYC Status</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-[#4B4B4B] capitalize">Invested</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-[#4B4B4B] capitalize">DateJoined</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-[#4B4B4B] capitalize">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F3F4F6]">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={7} className="px-8 py-6 h-[80px] bg-white"></td>
                    </tr>
                  ))
                ) : displayedInvestors.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-8 py-16 text-center text-[#9CA3AF] font-medium">
                      No investors found matching your search.
                    </td>
                  </tr>
                ) : (
                  displayedInvestors.map((investor) => (
                    <tr key={investor.id} className="hover:bg-[#F9FAFB]/80 transition-colors group">
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-4">
                          <div className="relative w-11 h-11 rounded-full overflow-hidden flex-shrink-0 bg-[#E5E7EB]">
                            {investor.profileImageUrl ? (
                              <Image
                                src={investor.profileImageUrl.startsWith('http') 
                                  ? investor.profileImageUrl 
                                  : `${BASE_URL}${investor.profileImageUrl.startsWith('/') ? '' : '/'}${investor.profileImageUrl}`}
                                alt={investor.firstName}
                                fill
                                className="object-cover"
                              />
                            ) : (
                              <Image
                                src={`https://api.dicebear.com/7.x/initials/svg?seed=${investor.firstName || 'Investor'}&backgroundColor=FCD34D`}
                                alt={investor.firstName}
                                fill
                                className="object-cover"
                              />
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-[#111827]">{investor.firstName} {investor.lastName}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <span className="text-sm text-[#4B5563] font-medium">{investor.email}</span>
                      </td>
                      <td className="px-6 py-5">
                        <span className="text-sm text-[#4B5563] font-medium">Personal</span>
                      </td>
                      <td className="px-6 py-5">
                        <span className={`inline-flex items-center px-4 py-1.5 rounded-full text-xs font-bold border ${getKycStatusStyle(investor.kycStatus)}`}>
                          {investor.kycStatus ? (investor.kycStatus.charAt(0).toUpperCase() + investor.kycStatus.slice(1)) : 'Pending'}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-right font-bold text-[#111827]">
                        {investor.invested}
                      </td>
                      <td className="px-6 py-5 text-sm text-[#4B5563] font-medium">
                        {new Date(investor.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </td>
                      <td className="px-8 py-5 text-center relative">
                        <button
                          onClick={() => setActiveDropdown(activeDropdown === investor.id ? null : investor.id)}
                          className="p-2 text-[#9CA3AF] hover:text-[#111827] hover:bg-[#F3F4F6] rounded-full transition-all"
                        >
                          <MoreVertical className="h-5 w-5" />
                        </button>

                        {activeDropdown === investor.id && (
                          <>
                            <div className="fixed inset-0 z-10" onClick={() => setActiveDropdown(null)} />
                            <div className="absolute right-12 top-12 w-48 bg-white rounded-2xl shadow-xl border border-[#F3F4F6] py-2 z-20 overflow-hidden animate-in fade-in zoom-in duration-200">
                              <Link href={`/dashboard/investor/${investor.id}`}>
                                <button className="w-full px-5 py-3 text-left text-sm font-bold text-[#4B5563] hover:bg-[#F9FAFB] transition-colors">
                                  View Profile
                                </button>
                              </Link>
                              <button className="w-full px-5 py-3 text-left text-sm font-bold text-[#EF4444] hover:bg-[#FEF2F2] transition-colors">
                                Suspend Account
                              </button>
                            </div>
                          </>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="px-8 py-6 bg-white border-t border-[#F3F4F6] flex flex-col sm:flex-row items-center justify-between gap-4">
            <span className="text-sm font-bold text-[#6B7280]">
              Showing {displayedInvestors.length} of {filteredInvestors.length} Investors
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 text-sm font-bold text-[#4B5563] hover:bg-[#F9FAFB] rounded-full disabled:opacity-40 transition-all"
              >
                Previous
              </button>

              <div className="flex items-center gap-2 shadow-sm rounded-full bg-[#F9FAFB] p-1">
                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`w-9 h-9 rounded-full text-sm font-bold transition-all ${currentPage === i + 1
                      ? 'bg-[#1F3B6E] text-white shadow-md scale-105'
                      : 'text-[#4B5563] hover:bg-white'
                      }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 text-sm font-bold text-[#4B5563] hover:bg-[#F9FAFB] rounded-full disabled:opacity-40 transition-all"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-[#111827]/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] w-full max-w-md p-8 shadow-2xl relative overflow-hidden">
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-[#111827]">Invite New Investor</h2>
                  <p className="text-[#6B7280] mt-2 font-medium text-sm leading-relaxed">
                    Send a secure invitation link to onboard a new investor.
                  </p>
                </div>
                <button onClick={() => setShowInviteModal(false)} className="p-2 hover:bg-[#F3F4F6] rounded-full transition-all">
                  <X className="h-6 w-6 text-[#9CA3AF]" />
                </button>
              </div>

              <div className="space-y-6 mb-10">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-[#374151]">Full Name</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter full name"
                    className="w-full px-5 py-4 bg-[#F9FAFB] border-none rounded-2xl text-sm text-[#111827] focus:ring-2 focus:ring-[#FCD34D] transition-all font-medium"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-[#374151]">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter email"
                    className="w-full px-5 py-4 bg-[#F9FAFB] border-none rounded-2xl text-sm text-[#111827] focus:ring-2 focus:ring-[#FCD34D] transition-all font-medium"
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => {
                    setShowInviteModal(false);
                    setFullName('');
                    setEmail('');
                  }}
                  className="flex-1 py-4 text-sm font-bold text-[#6B7280] hover:bg-[#F9FAFB] rounded-2xl transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    toast.success('Invite sent successfully!');
                    setShowInviteModal(false);
                    setFullName('');
                    setEmail('');
                  }}
                  className="flex-1 py-4 bg-[#FCD34D] text-[#1F2937] text-sm font-bold rounded-2xl hover:bg-[#FBD24E] shadow-lg shadow-yellow-100 transition-all active:scale-95"
                >
                  Email Invite
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
