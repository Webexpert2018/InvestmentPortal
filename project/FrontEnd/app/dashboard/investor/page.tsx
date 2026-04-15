'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Search, ChevronDown, MoreVertical, X, Loader2, Send } from 'lucide-react';
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
  status: 'active' | 'pending';
}

export default function InvestorPage() {
  const [investors, setInvestors] = useState<Investor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [kycFilter, setKycFilter] = useState('');
  const [accountTypeFilter, setAccountTypeFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSending, setIsSending] = useState<string | null>(null);
  const [emailError, setEmailError] = useState('');
  const [inviteForm, setInviteForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone_code: '+1',
    phone: '',
    dob: '',
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    zip_code: '',
    country: 'US',
    tax_id: ''
  });
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

  const activeInvestors = filteredInvestors.filter(i => i.status === 'active' || !i.status);
  const pendingInvestors = filteredInvestors.filter(i => i.status === 'pending');

  const handleInvite = async () => {
    setEmailError('');
    if (!inviteForm.email) {
      setEmailError('Email is required');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(inviteForm.email)) {
      setEmailError('Please enter a valid email address');
      return;
    }

    try {
      setIsSaving(true);
      await apiClient.inviteInvestor({
        full_name: `${inviteForm.first_name.trim()} ${inviteForm.last_name.trim()}`.trim(),
        email: inviteForm.email,
        phone: inviteForm.phone ? `${inviteForm.phone_code} ${inviteForm.phone.replace(/\D/g, '')}` : '',
        dob: inviteForm.dob,
        address_line1: inviteForm.address_line1,
        address_line2: inviteForm.address_line2,
        city: inviteForm.city,
        state: inviteForm.state,
        zip_code: inviteForm.zip_code,
        country: inviteForm.country,
        tax_id: inviteForm.tax_id
      });
      toast.success('Investor profile saved successfully');
      setShowInviteModal(false);
      setInviteForm({
        first_name: '',
        last_name: '',
        email: '',
        phone_code: '+1',
        phone: '',
        dob: '',
        address_line1: '',
        address_line2: '',
        city: '',
        state: '',
        zip_code: '',
        country: 'US',
        tax_id: ''
      });
      fetchInvestors();
    } catch (error: any) {
      if (error.message?.includes('already exists') || error.status === 409) {
        setEmailError('This email is already registered in our system');
      } else {
        toast.error(error.message || 'Failed to save investor');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleSendInvitation = async (id: string) => {
    try {
      setIsSending(id);
      await apiClient.sendInvitation(id);
      toast.success('Invitation link sent successfully');
      fetchInvestors();
    } catch (error: any) {
      toast.error('Failed to send invitation link');
    } finally {
      setIsSending(null);
    }
  };

  const handleCancelInvite = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this invitation?')) return;
    try {
      await apiClient.deleteUser(id); 
      toast.success('Invitation cancelled');
      fetchInvestors();
    } catch (error: any) {
      toast.error('Failed to cancel invitation');
    }
  };

  const totalPages = Math.ceil(activeInvestors.length / (itemsPerPage || 7));
  const startIndex = (currentPage - 1) * (itemsPerPage || 7);
  const displayedActiveInvestors = activeInvestors.slice(startIndex, startIndex + (itemsPerPage || 7));

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
            Add Investor
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
                ) : (
                  <>
                    {/* Active Investors Heading */}
                    {activeInvestors.length > 0 && (
                      <tr className="bg-[#F9FAFB]/30">
                        <td colSpan={7} className="px-8 py-3 text-xs font-bold text-[#6B7280] uppercase tracking-wider">
                          Active Investors ({activeInvestors.length})
                        </td>
                      </tr>
                    )}
                    
                    {activeInvestors.length === 0 && pendingInvestors.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-8 py-16 text-center text-[#9CA3AF] font-medium">
                          No investors found matching your search.
                        </td>
                      </tr>
                    ) : (
                      displayedActiveInvestors.map((investor) => (
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
                                <p className="text-sm font-bold text-[#111827]">{investor.firstName} {investor.lastName || '-'}</p>
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
                            {investor.invested || '-'}
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

                    {/* Pending Invitations Heading */}
                    {pendingInvestors.length > 0 && (
                      <>
                        <tr className="bg-[#F9FAFB]/30">
                          <td colSpan={7} className="px-8 py-3 text-xs font-bold text-[#6B7280] uppercase tracking-wider border-t border-[#F3F4F6]">
                            Pending Invitations ({pendingInvestors.length})
                          </td>
                        </tr>
                        {pendingInvestors.map((investor) => (
                          <tr key={investor.id} className="hover:bg-[#FFFBEB]/50 transition-colors group opacity-80">
                            <td className="px-8 py-5">
                              <div className="flex items-center gap-4">
                                <div className="relative w-11 h-11 rounded-full overflow-hidden flex-shrink-0 bg-[#F3F4F6] border-2 border-dashed border-[#D1D5DB] flex items-center justify-center text-[#9CA3AF] text-xs font-bold">
                                  ?
                                </div>
                                <div>
                                  <p className="text-sm font-bold text-[#4B5563]">{investor.firstName || '-'}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-5">
                              <span className="text-sm text-[#4B5563] font-medium">{investor.email}</span>
                            </td>
                            <td className="px-6 py-5 italic text-[#9CA3AF] text-sm">-</td>
                            <td className="px-6 py-5">
                              <span className="inline-flex items-center px-4 py-1.5 rounded-full text-xs font-bold bg-gray-50 text-gray-500 border border-gray-200 uppercase">
                                Invited
                              </span>
                            </td>
                            <td className="px-6 py-5 text-right text-[#9CA3AF]">-</td>
                            <td className="px-6 py-5 text-sm text-[#9CA3AF]">
                              {new Date(investor.createdAt).toLocaleDateString()}
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
                                    <button 
                                      onClick={() => handleSendInvitation(investor.id)}
                                      className="w-full text-left px-5 py-3 text-sm font-bold text-[#111827] hover:bg-[#F9FAFB] flex items-center gap-2"
                                    >
                                      {isSending === investor.id ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                      ) : (
                                        <Send className="w-4 h-4" />
                                      )}
                                      Send Invite Link
                                    </button>
                                    <button 
                                      onClick={() => handleCancelInvite(investor.id)}
                                      className="w-full px-5 py-3 text-left text-sm font-bold text-[#EF4444] hover:bg-[#FEF2F2] transition-colors"
                                    >
                                      Cancel Invite
                                    </button>
                                  </div>
                                </>
                              )}
                            </td>
                          </tr>
                        ))}
                      </>
                    )}
                  </>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="px-8 py-6 bg-white border-t border-[#F3F4F6] flex flex-col sm:flex-row items-center justify-between gap-4">
            <span className="text-sm font-bold text-[#6B7280]">
              Showing {activeInvestors.length} Active of {filteredInvestors.length} Total Investors
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
        <div className="fixed inset-0 bg-[#000000]/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-2xl shadow-2xl relative overflow-hidden animate-in fade-in zoom-in duration-300">
            <div className="p-10 max-h-[90vh] overflow-y-auto">
              <button
                onClick={() => setShowInviteModal(false)}
                className="absolute right-8 top-8 p-2 text-[#9CA3AF] hover:text-[#111827] hover:bg-[#F3F4F6] rounded-full transition-all"
              >
                <X className="h-6 w-6" />
              </button>

              <div className="mb-8">
                <h3 className="text-2xl font-bold text-[#111827] font-goudy mb-2">Invite New Investor</h3>
                <p className="text-[#6B7280] font-medium">Pre-fill investor profile for a seamless onboarding experience.</p>
              </div>

              <div className="space-y-8">
                {/* General Info */}
                <section>
                  <h4 className="text-xs font-bold text-[#9CA3AF] uppercase tracking-widest mb-4">General Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-[#4B5563] ml-1">First Name</label>
                      <input
                        type="text"
                        placeholder="e.g. John"
                        value={inviteForm.first_name}
                        onChange={(e) => setInviteForm({ ...inviteForm, first_name: e.target.value })}
                        className="w-full px-5 py-4 bg-[#F9FAFB] border border-[#F3F4F6] rounded-2xl text-sm font-bold text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#FCD34D] focus:border-transparent transition-all placeholder:text-[#9CA3AF]"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-[#4B5563] ml-1">Last Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Doe"
                        value={inviteForm.last_name}
                        onChange={(e) => setInviteForm({ ...inviteForm, last_name: e.target.value })}
                        className="w-full px-5 py-4 bg-[#F9FAFB] border border-[#F3F4F6] rounded-2xl text-sm font-bold text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#FCD34D] focus:border-transparent transition-all placeholder:text-[#9CA3AF]"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-[#4B5563] ml-1">Email (Required)</label>
                      <input
                        type="email"
                        placeholder="e.g. john@example.com"
                        value={inviteForm.email}
                        onChange={(e) => {
                          setInviteForm({ ...inviteForm, email: e.target.value });
                          if (emailError) setEmailError('');
                        }}
                        className={`w-full px-5 py-4 bg-[#F9FAFB] border rounded-2xl text-sm font-bold text-[#111827] focus:outline-none focus:ring-2 transition-all placeholder:text-[#9CA3AF] ${
                          emailError ? 'border-red-300 ring-2 ring-red-100' : 'border-[#F3F4F6] focus:ring-[#FCD34D]'
                        }`}
                      />
                      {emailError && (
                        <p className="text-[11px] font-bold text-red-500 ml-1 mt-1 animate-in fade-in slide-in-from-top-1">
                          {emailError}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-[#4B5563] ml-1">Phone</label>
                      <div className="flex gap-2">
                        <select
                          value={inviteForm.phone_code}
                          onChange={(e) => setInviteForm({ ...inviteForm, phone_code: e.target.value })}
                          className="px-3 py-4 bg-[#F9FAFB] border border-[#F3F4F6] rounded-2xl text-sm font-bold text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#FCD34D] transition-all"
                        >
                          <option value="+1">+1 (USA)</option>
                          <option value="+44">+44 (UK)</option>
                          <option value="+91">+91 (IN)</option>
                        </select>
                        <input
                          type="tel"
                          placeholder="555 000 0000"
                          value={inviteForm.phone}
                          onChange={(e) => setInviteForm({ ...inviteForm, phone: e.target.value.replace(/\D/g, '').slice(0, 15) })}
                          className="flex-1 px-5 py-4 bg-[#F9FAFB] border border-[#F3F4F6] rounded-2xl text-sm font-bold text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#FCD34D] focus:border-transparent transition-all placeholder:text-[#9CA3AF]"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-[#4B5563] ml-1">Date of Birth</label>
                      <input
                        type="date"
                        value={inviteForm.dob}
                        onChange={(e) => setInviteForm({ ...inviteForm, dob: e.target.value })}
                        className="w-full px-5 py-4 bg-[#F9FAFB] border border-[#F3F4F6] rounded-2xl text-sm font-bold text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#FCD34D] focus:border-transparent transition-all"
                      />
                    </div>
                  </div>
                </section>

                {/* Address */}
                <section>
                  <h4 className="text-xs font-bold text-[#9CA3AF] uppercase tracking-widest mb-4">Residential Address</h4>
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-[#4B5563] ml-1">Address Line 1</label>
                      <input
                        type="text"
                        placeholder="Street Address"
                        value={inviteForm.address_line1}
                        onChange={(e) => setInviteForm({ ...inviteForm, address_line1: e.target.value })}
                        className="w-full px-5 py-4 bg-[#F9FAFB] border border-[#F3F4F6] rounded-2xl text-sm font-bold text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#FCD34D] focus:border-transparent transition-all placeholder:text-[#9CA3AF]"
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-[#4B5563] ml-1">City</label>
                        <input
                          type="text"
                          placeholder="e.g. New York"
                          value={inviteForm.city}
                          onChange={(e) => setInviteForm({ ...inviteForm, city: e.target.value })}
                          className="w-full px-5 py-4 bg-[#F9FAFB] border border-[#F3F4F6] rounded-2xl text-sm font-bold text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#FCD34D] focus:border-transparent transition-all placeholder:text-[#9CA3AF]"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-[#4B5563] ml-1">State / Province</label>
                        <input
                          type="text"
                          placeholder="e.g. NY"
                          value={inviteForm.state}
                          onChange={(e) => setInviteForm({ ...inviteForm, state: e.target.value })}
                          className="w-full px-5 py-4 bg-[#F9FAFB] border border-[#F3F4F6] rounded-2xl text-sm font-bold text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#FCD34D] focus:border-transparent transition-all placeholder:text-[#9CA3AF]"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-[#4B5563] ml-1">Tax ID / SSN</label>
                        <input
                          type="text"
                          placeholder="SSN or TaxID"
                          value={inviteForm.tax_id}
                          onChange={(e) => setInviteForm({ ...inviteForm, tax_id: e.target.value })}
                          className="w-full px-5 py-4 bg-[#F9FAFB] border border-[#F3F4F6] rounded-2xl text-sm font-bold text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#FCD34D] focus:border-transparent transition-all placeholder:text-[#9CA3AF]"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-[#4B5563] ml-1">Country</label>
                        <select
                          value={inviteForm.country}
                          onChange={(e) => setInviteForm({ ...inviteForm, country: e.target.value })}
                          className="w-full px-5 py-4 bg-[#F9FAFB] border border-[#F3F4F6] rounded-2xl text-sm font-bold text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#FCD34D] focus:border-transparent transition-all"
                        >
                          <option value="US">United States</option>
                          <option value="GB">United Kingdom</option>
                          <option value="CA">Canada</option>
                          <option value="AU">Australia</option>
                          <option value="IN">India</option>
                          <option value="DE">Germany</option>
                          <option value="FR">France</option>
                          <option value="SG">Singapore</option>
                          <option value="AE">United Arab Emirates</option>
                          <option value="JP">Japan</option>
                          <option value="CN">China</option>
                          <option value="BR">Brazil</option>
                          <option value="MX">Mexico</option>
                          <option value="ZA">South Africa</option>
                          <option value="NG">Nigeria</option>
                          <option value="KE">Kenya</option>
                          <option value="EG">Egypt</option>
                          <option value="SA">Saudi Arabia</option>
                          <option value="NZ">New Zealand</option>
                          <option value="PK">Pakistan</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </section>
              </div>

              <div className="flex gap-4 mt-10">
                <button
                  onClick={() => setShowInviteModal(false)}
                  className="flex-1 py-4 bg-[#F9FAFB] text-[#4B5563] text-sm font-bold rounded-2xl hover:bg-[#F3F4F6] transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleInvite}
                  disabled={isSaving}
                  className="flex-1 py-4 bg-[#FCD34D] text-[#1F2937] text-sm font-bold rounded-2xl hover:bg-[#FBD24E] shadow-lg shadow-yellow-100 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
