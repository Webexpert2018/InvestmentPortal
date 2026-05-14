'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { DashboardLayout } from '@/components/DashboardLayout';
import {
  ChevronLeft, X, ChevronDown, FileText, Download, Calendar, Mail, Phone,
  Shield, MapPin, User, Loader2, Eye, EyeOff, AlertTriangle, CheckCircle, Plus, Info
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { apiClient, BASE_URL } from '@/lib/api/client';
import { toast } from 'sonner';
import { AdminAddIraModal } from '@/components/ira/AdminAddIraModal';
import { useAuth } from '@/lib/contexts/AuthContext';

export default function InvestorProfilePage({ params }: { params: { id: string } }) {
  const { user } = useAuth();
  const isAdmin = user?.role && ['admin', 'executive_admin', 'fund_admin', 'investor_relations'].includes(user.role.trim().toLowerCase());
  const isExecutiveAdmin = user?.role?.trim().toLowerCase() === 'executive_admin';
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('basic');
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showAccountantModal, setShowAccountantModal] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [selectedIrStaff, setSelectedIrStaff] = useState('');
  const [selectedAccountant, setSelectedAccountant] = useState('');
  const [irStaffList, setIrStaffList] = useState<any[]>([]);
  const [accountantList, setAccountantList] = useState<any[]>([]);
  const [irLoading, setIrLoading] = useState(false);
  const [accountantLoading, setAccountantLoading] = useState(false);
  const [isSendingInvite, setIsSendingInvite] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [fundingPage, setFundingPage] = useState(1);
  const [redemptionPage, setRedemptionPage] = useState(1);

  const [investorData, setInvestorData] = useState<any>(null);
  const [kycDocuments, setKycDocuments] = useState<any[]>([]);
  const [fundingHistory, setFundingHistory] = useState<any[]>([]);
  const [redemptionHistory, setRedemptionHistory] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({ totalValue: 0, totalUnits: 0, ytdReturn: 0 });
  const [loading, setLoading] = useState(true);
  const [isSuspending, setIsSuspending] = useState(false);
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [showAdminIraModal, setShowAdminIraModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [isEditingTaxId, setIsEditingTaxId] = useState(false);
  const [editedTaxId, setEditedTaxId] = useState('');
  const [isSavingTaxId, setIsSavingTaxId] = useState(false);


  const [iraAccounts, setIraAccounts] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [profile, docs, investments, redemptions, investorStats, accounts] = await Promise.all([
          apiClient.getUserById(params.id),
          apiClient.getInvestorDocuments(params.id),
          apiClient.getInvestorInvestments(params.id),
          apiClient.getInvestorRedemptions(params.id),
          apiClient.getInvestorStats(params.id),
          apiClient.getUserIRAAccounts(params.id)
        ]);
        setInvestorData(profile);
        setEditedTaxId(profile.taxId || '');
        setKycDocuments(docs);
        setFundingHistory(investments);
        setRedemptionHistory(redemptions);
        setStats(investorStats);
        setIraAccounts(accounts || []);
      } catch (err) {
        console.error('Error fetching investor data:', err);
        toast.error('Failed to load investor profile');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [params.id]);

  const tabs = [
    { id: 'basic', label: 'Basic Details' },
    { id: 'kyc', label: 'KYC Status' },
    { id: 'funding', label: 'Funding History' },
    { id: 'redemption', label: 'Redemption History' },
  ];

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'settled':
      case 'active':
      case 'approved':
      case 'verified':
        return 'bg-green-100 text-green-700';
      case 'pending':
        return 'bg-yellow-100 text-yellow-700';
      case 'rejected':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getDocTypeName = (type: string) => {
    switch (type) {
      case 'tax_return_y1': return 'Tax Return (Year 1)';
      case 'tax_return_y2': return 'Tax Return (Year 2)';
      case 'balance_sheet': return 'Balance Sheet / Net Worth';
      case 'kyc_id': return 'Identity Document';
      default: return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!investorData) {
    return (
      <DashboardLayout>
        <div className="p-8 text-center bg-white rounded-xl shadow-sm">
          <p className="text-gray-500">Investor not found</p>
          <button onClick={() => router.back()} className="mt-4 text-red-500 font-medium">Go Back</button>
        </div>
      </DashboardLayout>
    );
  }

  const fundingItemsPerPage = 5;
  const fundingTotalPages = Math.ceil(fundingHistory.length / fundingItemsPerPage);
  const fundingStartIndex = (fundingPage - 1) * fundingItemsPerPage;
  const displayedFundingHistory = fundingHistory.slice(fundingStartIndex, fundingStartIndex + fundingItemsPerPage);

  const redemptionItemsPerPage = 5;
  const redemptionTotalPages = Math.ceil(redemptionHistory.length / redemptionItemsPerPage);
  const redemptionStartIndex = (redemptionPage - 1) * redemptionItemsPerPage;
  const displayedRedemptionHistory = redemptionHistory.slice(redemptionStartIndex, redemptionStartIndex + redemptionItemsPerPage);

  const handleSendInvite = async () => {
    try {
      setIsSendingInvite(true);
      await apiClient.sendInvitation(params.id);
      toast.success('Invitation link sent successfully');
    } catch (err: any) {
      toast.error(err.message || 'Failed to send invitation');
    } finally {
      setIsSendingInvite(false);
    }
  };

  const handleForgotPassword = async () => {
    try {
      setIsResetting(true);
      await apiClient.forgotPassword(investorData.email, 'investor', true);
      toast.success('Password reset link sent to investor');
    } catch (err: any) {
      toast.error(err.message || 'Failed to send reset code');
    } finally {
      setIsResetting(false);
    }
  };


  const handleSuspendAccount = async () => {
    const isSuspended = investorData.status === 'suspended';
    const action = isSuspended ? 'activate' : 'suspend';

    try {
      setIsSuspending(true);
      console.log(`[handleSuspendAccount] Attempting to ${action} user ${params.id}. Target status: ${isSuspended ? 'active' : 'suspended'}`);
      await apiClient.updateUserStatus(params.id, isSuspended ? 'active' : 'suspended');
      toast.success(`Account ${isSuspended ? 'activated' : 'suspended'} successfully`);
      const profile = await apiClient.getUserById(params.id);
      setInvestorData(profile);
      setShowSuspendModal(false);
    } catch (err: any) {
      console.error(`[handleSuspendAccount] Failed to ${action} account:`, err);
      toast.error(err.message || `Failed to ${action} account. Please check browser console for details.`);
    } finally {
      setIsSuspending(false);
    }
  };

  const handleMasterStatusToggle = async () => {
    const hasActive = iraAccounts.length > 0
      ? (iraAccounts.some((acc: any) => acc.status !== 'suspended') || investorData.status !== 'suspended')
      : investorData.status !== 'suspended';
    const targetStatus = hasActive ? 'suspended' : 'active';

    try {
      setIsSuspending(true);

      // Update ALL statuses: Main Login + All IRAs
      const updates = [
        apiClient.updateUserStatus(params.id, targetStatus)
      ];

      iraAccounts.forEach((acc: any) => {
        updates.push(apiClient.updateIRAAccountStatus(acc.id, targetStatus));
      });

      await Promise.all(updates);

      toast.success(`All accounts ${targetStatus === 'active' ? 'activated' : 'suspended'} successfully`);

      // Refresh all data to ensure UI is in sync with DB
      const [profile, accounts] = await Promise.all([
        apiClient.getUserById(params.id),
        apiClient.getUserIRAAccounts(params.id)
      ]);
      setInvestorData(profile);
      setIraAccounts(accounts || []);
    } catch (err: any) {
      toast.error('Failed to update all account statuses');
      console.error('Master toggle error:', err);
    } finally {
      setIsSuspending(false);
    }
  };

  const handleCancelInvite = async () => {
    try {
      setIsSuspending(true);
      await apiClient.deleteUser(params.id);
      toast.success('Invitation cancelled');
      router.push(isAdmin ? '/dashboard/investor' : '/dashboard/assigned-investors');
    } catch (err: any) {
      toast.error(err.message || 'Failed to cancel invitation');
    } finally {
      setIsSuspending(false);
      setShowCancelModal(false);
    }
  };

  const handleSaveTaxId = async () => {
    const cleanTaxId = editedTaxId.replace(/\D/g, '');
    if (cleanTaxId.length !== 9) {
      toast.error('Tax ID must be exactly 9 digits');
      return;
    }

    try {
      setIsSavingTaxId(true);
      await apiClient.updateUser(params.id, { taxId: cleanTaxId });
      setInvestorData({ ...investorData, taxId: cleanTaxId });
      setIsEditingTaxId(false);
      toast.success('Tax ID updated successfully');
    } catch (err: any) {
      toast.error(err.message || 'Failed to update Tax ID');
    } finally {
      setIsSavingTaxId(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 font-helvetica">
        {/* Header with Back Button */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push(isAdmin ? '/dashboard/investor' : '/dashboard/assigned-investors')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeft className="h-5 w-5 text-gray-600" />
          </button>
          <h1 className="text-2xl font-semibold text-[#1F1F1F]">Profile Information</h1>
        </div>

        {/* Main Content Card */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {/* Tabs and Action Buttons */}
          <div className="border-b border-gray-200">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-6 pt-6 pb-0 gap-4">
              <div className="flex gap-2 overflow-x-auto w-full sm:w-auto">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors border-b-2 ${activeTab === tab.id
                      ? 'border-[#FCD34D] text-[#2A4474]'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                      }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Master Status Toggle Button - Header Top Right */}
              {isExecutiveAdmin && investorData.status === 'suspended' && (
                <div className="hidden sm:block">
                  {(() => {
                    const hasInactive = iraAccounts.length > 0
                      ? iraAccounts.some((acc: any) => acc.status !== 'active')
                      : investorData.status !== 'active';
                    return (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              onClick={handleMasterStatusToggle}
                              disabled={isSuspending}
                              className={`h-10 px-6 rounded-full text-xs font-bold transition-all shadow-sm active:scale-95 flex items-center gap-2 border mb-2 ${hasInactive
                                ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
                                : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
                                }`}
                            >
                              {isSuspending ? <Loader2 className="h-4 w-4 animate-spin" /> : (hasInactive ? <CheckCircle className="h-4 w-4" /> : <X className="h-4 w-4" />)}
                              {hasInactive
                                ? (iraAccounts.length > 0 ? 'Activate Accounts' : 'Activate Account')
                                : (iraAccounts.length > 0 ? 'Suspend Accounts' : 'Suspend Account')}
                            </button>
                          </TooltipTrigger>
                          <TooltipContent className="bg-neutral-900 text-white border-neutral-800">
                            <p className="text-[11px] font-medium">
                              {hasInactive
                                ? 'Click here to activate all linked accounts.'
                                : 'Click here to suspend all linked accounts.'}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    );
                  })()}
                </div>
              )}
            </div>
          </div>

          {/* Profile Content */}
          <div className="p-2 sm:p-6">
            {activeTab === 'basic' && (
              <div className="space-y-8">
                <div className="flex flex-col lg:flex-row gap-8">
                  {/* Left: Avatar and Identity */}
                  <div className="w-full lg:w-[300px] space-y-6">
                    <div className="mx-auto lg:mx-0 relative w-full max-w-[300px] aspect-square lg:aspect-[4/5] rounded-2xl border border-gray-100 shadow-sm overflow-hidden bg-gray-100 flex items-center justify-center">
                      {investorData.profileImageUrl ? (
                        <Image
                          src={investorData.profileImageUrl.startsWith('http')
                            ? investorData.profileImageUrl
                            : `${BASE_URL}${investorData.profileImageUrl.startsWith('/') ? '' : '/'}${investorData.profileImageUrl}`}
                          alt="Profile"
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-[#FCD34D] flex items-center justify-center text-white text-[120px] font-bold">
                          {(investorData.firstName?.[0] || '') + (investorData.lastName?.[0] || '')}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Detailed Info */}
                  <div className="flex-1 space-y-8">
                    {/* Name, Info, and Action Buttons */}
                    <div className="space-y-4">
                      {/* Name and Meta Info */}
                      <div>
                        <h2 className="text-3xl font-bold text-[#1F1F1F] leading-tight">{investorData.firstName} {investorData.lastName}</h2>
                        <div className="flex flex-col gap-2 mt-2 space-y-1">
                          <p className="text-sm text-gray-400 font-medium flex items-center gap-1.5">
                            <Calendar className="h-4 w-4 shrink-0" />
                            Joined date: {new Date(investorData.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </p>
                          <p className="text-sm text-gray-400 font-medium flex items-center gap-1.5">
                            <Shield className="h-4 w-4 shrink-0" />
                            Accountant: <span className="text-gray-900 font-bold">{investorData.assignedAccountantName || 'Not assigned'}</span>
                          </p>
                          <p className="text-sm text-gray-400 font-medium flex items-center gap-1.5">
                            <User className="h-4 w-4 shrink-0" />
                            Investor Relation: <span className="text-gray-900 font-bold">{investorData.assignedIrName || 'Not assigned'}</span>
                          </p>
                        </div>
                      </div>

                      {/* Action Buttons — full width, wrapping */}
                      <div className="flex flex-wrap gap-2">
                        {(() => {
                          const isPending = investorData.status === 'pending';

                          if (!isAdmin) return null;

                          const inviteButtons = [
                            <button
                              key="send"
                              onClick={handleSendInvite}
                              disabled={isSendingInvite || !isPending}
                              className={`h-10 px-5 text-xs font-bold rounded-full transition-colors border flex items-center gap-2 whitespace-nowrap shadow-sm ${isPending
                                ? 'bg-[#FCD34D] text-[#1F1F1F] hover:bg-[#FBD24E] border-transparent'
                                : 'bg-[#F9FAFB] text-[#9CA3AF] border-[#E5E7EB] cursor-not-allowed'
                                }`}
                            >
                              {isSendingInvite ? <Loader2 className="h-3 w-3 animate-spin" /> : <Mail className="h-3 w-3" />}
                              Send/Resend Invite
                            </button>,
                            <button
                              key="cancel"
                              onClick={() => setShowCancelModal(true)}
                              disabled={isSuspending || !isPending}
                              className={`h-10 px-5 text-xs font-bold rounded-full transition-colors border flex items-center gap-2 whitespace-nowrap shadow-sm ${isPending
                                ? 'bg-red-50 text-red-700 hover:bg-red-100 border-red-200'
                                : 'bg-[#F9FAFB] text-[#9CA3AF] border-[#E5E7EB] cursor-not-allowed'
                                }`}
                            >
                              {isSuspending ? <Loader2 className="h-3 w-3 animate-spin" /> : <X className="h-3 w-3" />}
                              Cancel Invite
                            </button>
                          ];

                          const actionButtons = [
                            <button
                              key="forgot"
                              onClick={handleForgotPassword}
                              disabled={isResetting || isPending}
                              className={`h-10 px-5 text-xs font-bold rounded-full transition-colors border flex items-center gap-2 whitespace-nowrap shadow-sm ${!isPending
                                ? 'bg-amber-50 text-amber-600 hover:bg-amber-100 border-amber-200'
                                : 'bg-[#F9FAFB] text-[#9CA3AF] border-[#E5E7EB] cursor-not-allowed'
                                }`}
                            >
                              {isResetting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Shield className="h-3 w-3" />}
                              Forgot Password
                            </button>,
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <button
                                    key="suspend"
                                    onClick={() => setShowSuspendModal(true)}
                                    disabled={isSuspending || isPending}
                                    className={`h-10 px-5 text-xs font-bold rounded-full transition-colors border flex items-center gap-2 whitespace-nowrap shadow-sm ${!isPending
                                      ? (investorData.status === 'suspended'
                                        ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
                                        : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
                                      )
                                      : 'bg-[#F9FAFB] text-[#9CA3AF] border-[#E5E7EB] cursor-not-allowed'
                                      }`}
                                  >
                                    {isSuspending ? <Loader2 className="h-3 w-3 animate-spin" /> : <X className="h-3 w-3" />}
                                    {investorData.status === 'suspended' ? 'Activate Login' : 'Suspend Login'}
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent className="bg-neutral-900 text-white border-neutral-800">
                                  <p className="text-[11px] font-medium">
                                    {investorData.status === 'suspended'
                                      ? 'Click here to activate user login.'
                                      : 'Click here to suspend user login.'}
                                  </p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>,
                            <button
                              key="assign"
                              onClick={async () => {
                                setShowAssignModal(true);
                                setSelectedIrStaff(investorData.assignedIrId || '');
                                setIrLoading(true);
                                try {
                                  const res = await apiClient.getStaff('investor_relations', 1, 100);
                                  setIrStaffList(res.data || []);
                                } catch (err) { console.error('Failed to fetch IR staff:', err); }
                                finally { setIrLoading(false); }
                              }}
                              className="h-10 px-5 text-xs font-bold rounded-full transition-colors border flex items-center gap-2 whitespace-nowrap shadow-sm bg-[#FCD34D] text-[#1F1F1F] hover:bg-[#FBD24E] border-transparent"
                            >
                              {investorData.assignedIrId ? 'Change Investor Relation' : 'Assign Investor Relation'}
                            </button>,
                            <button
                              key="assign-accountant"
                              onClick={async () => {
                                setShowAccountantModal(true);
                                setSelectedAccountant(investorData.assignedAccountantId || '');
                                setAccountantLoading(true);
                                try {
                                  const res = await apiClient.getStaff('accountant', 1, 100);
                                  setAccountantList(res.data || []);
                                } catch (err) { console.error('Failed to fetch accountants:', err); }
                                finally { setAccountantLoading(false); }
                              }}
                              className="h-10 px-5 text-xs font-bold rounded-full transition-colors border flex items-center gap-2 whitespace-nowrap shadow-sm bg-[#FCD34D] text-[#1F1F1F] hover:bg-[#FBD24E] border-transparent"
                            >
                              {investorData.assignedAccountantId ? 'Change Accountant' : 'Assign Accountant'}
                            </button>
                          ];

                          return isPending ? [...inviteButtons, ...actionButtons] : [...actionButtons, ...inviteButtons];
                        })()}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8 py-6 border-y border-gray-100">
                      <div className="space-y-1.5">
                        <span className="text-xs font-bold text-gray-400">Email</span>
                        <p className="text-sm font-bold text-gray-900">{investorData.email}</p>
                      </div>

                      <div className="space-y-1.5">
                        <span className="text-xs font-bold text-gray-400">Phone Number</span>
                        <p className="text-sm font-bold text-gray-900">{investorData.phone || 'Not provided'}</p>
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-gray-400">Tax ID</span>
                          {isAdmin && !isEditingTaxId && (
                            <button
                              onClick={() => setIsEditingTaxId(true)}
                              className="text-[10px] font-bold text-[#2A4474] hover:underline"
                            >
                              Edit
                            </button>
                          )}
                        </div>
                        {isEditingTaxId ? (
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={editedTaxId}
                              maxLength={11}
                              onChange={(e) => {
                                let val = e.target.value.replace(/\D/g, '');
                                if (val.length > 9) val = val.slice(0, 9);

                                let formatted = val;
                                if (val.length > 3 && val.length <= 5) {
                                  formatted = `${val.slice(0, 3)}-${val.slice(3)}`;
                                } else if (val.length > 5) {
                                  formatted = `${val.slice(0, 3)}-${val.slice(3, 5)}-${val.slice(5)}`;
                                }
                                setEditedTaxId(formatted);
                              }}
                              className="flex-1 h-8 px-2 text-sm font-bold text-gray-900 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#FCD34D]"
                            />
                            <button
                              onClick={handleSaveTaxId}
                              disabled={isSavingTaxId}
                              className="px-2 h-8 text-[10px] font-bold bg-[#FCD34D] text-[#1F1F1F] rounded-md hover:bg-[#FBD24E] disabled:opacity-50"
                            >
                              {isSavingTaxId ? '...' : 'Save'}
                            </button>
                            <button
                              onClick={() => {
                                setIsEditingTaxId(false);
                                setEditedTaxId(investorData.taxId || '');
                              }}
                              className="px-2 h-8 text-[10px] font-bold bg-gray-100 text-gray-600 rounded-md hover:bg-gray-200"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <p className="text-sm font-bold text-gray-900">
                            {investorData.taxId ? (investorData.taxId.length === 9 && !investorData.taxId.includes('-') ? `${investorData.taxId.slice(0, 3)}-${investorData.taxId.slice(3, 5)}-${investorData.taxId.slice(5)}` : investorData.taxId) : 'Not provided'}
                          </p>
                        )}
                      </div>

                      <div className="space-y-1.5">
                        <span className="text-xs font-bold text-gray-400">Date of Birth</span>
                        <p className="text-sm font-bold text-gray-900">{investorData.dob ? new Date(investorData.dob).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Not provided'}</p>
                      </div>

                      <div className="md:col-span-2 space-y-1.5">
                        <span className="text-xs font-bold text-gray-400">Address</span>
                        <p className="text-sm font-bold text-gray-900 max-w-lg">
                          {investorData.addressLine1 ? [
                            investorData.addressLine1,
                            investorData.addressLine2,
                            investorData.city,
                            investorData.state,
                            investorData.zipCode,
                            investorData.country
                          ].filter(Boolean).join(', ') : 'Not provided'}
                        </p>
                      </div>
                    </div>

                    {/* Linked Custodian Accounts */}
                    <div className="space-y-6">
                      <h3 className="text-sm font-bold text-gray-500">Linked Custodian Accounts</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                        {iraAccounts.length > 0 ? iraAccounts.map((account: any) => {
                          const totalInvested = fundingHistory
                            .filter(f => f.is_reconciled && f.account_type === account.account_type)
                            .reduce((sum, f) => sum + parseFloat(f.revised_amount || f.investment_amount || 0), 0);
                          const totalRedeemed = redemptionHistory
                            .filter(r => r.is_reconciled && fundingHistory.find(inv => inv.id === r.investment_id)?.account_type === account.account_type)
                            .reduce((sum, r) => sum + parseFloat(r.amount), 0);
                          const netValue = totalInvested - totalRedeemed;
                          const isSuspended = account.status === 'suspended';

                          return (
                            <div key={account.id} className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${isSuspended ? 'bg-red-50/20 border-red-100 opacity-80' : 'bg-[#F9FAFB]/50 border-gray-100 hover:border-amber-200'}`}>
                              <div className="flex items-start justify-between mb-3">
                                <div>
                                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">{account.account_type} Account</span>
                                  <p className="text-sm font-bold text-gray-900">${netValue.toLocaleString()}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <button
                                          onClick={async () => {
                                            const newStatus = isSuspended ? 'active' : 'suspended';
                                            try {
                                              await apiClient.updateIRAAccountStatus(account.id, newStatus);
                                              toast.success(`Account ${newStatus === 'active' ? 'activated' : 'suspended'} successfully`);
                                              const updatedAccounts = await apiClient.getUserIRAAccounts(params.id);
                                              setIraAccounts(updatedAccounts);
                                            } catch (err) {
                                              toast.error('Failed to update account status');
                                            }
                                          }}
                                          className={`px-4 py-1.5 text-[10px] font-bold rounded-full transition-all border flex items-center gap-1.5 shadow-sm active:scale-95 ${isSuspended
                                            ? 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
                                            : 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
                                            }`}
                                        >
                                          {isSuspended ? <X className="h-3 w-3" /> : <CheckCircle className="h-3 w-3" />}
                                          {isSuspended ? 'Suspended' : 'Activated'}
                                        </button>
                                      </TooltipTrigger>
                                      <TooltipContent className="bg-neutral-900 text-white border-neutral-800">
                                        <p className="text-[11px] font-medium">
                                          {isSuspended
                                            ? 'Click here to activate this account.'
                                            : 'Click here to suspend this account.'}
                                        </p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                </div>
                              </div>
                              <div className="flex items-center justify-between pt-2 border-t border-gray-100/50 mt-auto">
                                <p className="text-[10px] text-gray-500 font-medium">#{account.account_number || 'N/A'}</p>
                                <div className={`flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-bold capitalize tracking-tight ${isSuspended ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                                  <div className={`w-1 h-1 rounded-full ${isSuspended ? 'bg-red-500' : 'bg-green-500'}`} />
                                  {isSuspended ? 'Suspended' : 'Activated'}
                                </div>
                              </div>
                            </div>
                          );
                        }) : (
                          <p className="text-sm text-gray-400 italic">No linked accounts found</p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 pt-8 border-t border-gray-50">
                      <div className="space-y-1">
                        <span className="text-xs font-bold text-gray-400">Account Status</span>
                        {(() => {
                          const isMainActive = investorData.status === 'active';
                          const hasActiveIra = iraAccounts.some((acc: any) => acc.status === 'active');
                          const isOverallActive = isMainActive || hasActiveIra;
                          return (
                            <p className={`text-sm font-bold capitalize ${isOverallActive ? 'text-green-600' : 'text-red-600'}`}>
                              {isOverallActive ? 'Active' : 'Suspended'}
                            </p>
                          );
                        })()}
                      </div>
                      <div className="space-y-1">
                        <span className="text-xs font-bold text-gray-400">Assigned Investor Relation</span>
                        <p className="text-sm font-bold text-gray-900">{investorData.assignedIrName || <span className="text-gray-400 italic">Not assigned</span>}</p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-xs font-bold text-gray-400">Assigned Accountant</span>
                        <p className="text-sm font-bold text-gray-900">{investorData.assignedAccountantName || <span className="text-gray-400 italic">Not assigned</span>}</p>
                      </div>
                      {/* <div className="space-y-1 text-right sm:text-left">
                        <span className="text-xs font-bold text-gray-400">Last Login</span>
                        <p className="text-sm font-bold text-gray-900">
                          {investorData.lastLogin ? new Date(investorData.lastLogin).toLocaleString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          }) : 'Never'}
                        </p>
                      </div> */}
                    </div>

                    {/* Persistent Note Section */}
                    <div className="pt-8 flex flex-col sm:flex-row items-start sm:items-end justify-between gap-6">
                      <div className="space-y-3 flex-1">
                        <p className="text-xs font-semibold text-gray-400">Note (Private note visible only to you)</p>
                        <div className="space-y-1">
                          <p className="text-xs font-medium text-gray-400 italic">
                            No private notes available for this investor.
                          </p>
                        </div>
                      </div>

                      {/* Master Status Toggle Button - Bottom Position */}
                      {isExecutiveAdmin && investorData.status === 'suspended' && (
                        <div className="flex-shrink-0">
                          {(() => {
                            const hasInactive = iraAccounts.length > 0
                              ? iraAccounts.some((acc: any) => acc.status !== 'active')
                              : investorData.status !== 'active';
                            return (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <button
                                      onClick={handleMasterStatusToggle}
                                      disabled={isSuspending}
                                      className={`px-8 py-3 rounded-full text-xs font-bold transition-all shadow-md active:scale-95 flex items-center gap-2 border ${hasInactive
                                        ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
                                        : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
                                        }`}
                                    >
                                      {isSuspending ? <Loader2 className="h-4 w-4 animate-spin" /> : (hasInactive ? <CheckCircle className="h-4 w-4" /> : <X className="h-4 w-4" />)}
                                      {hasInactive
                                        ? (iraAccounts.length > 0 ? 'Activate Accounts' : 'Activate Account')
                                        : (iraAccounts.length > 0 ? 'Suspend Accounts' : 'Suspend Account')}
                                    </button>
                                  </TooltipTrigger>
                                  <TooltipContent className="bg-neutral-900 text-white border-neutral-800">
                                    <p className="text-[11px] font-medium">
                                      {hasInactive
                                        ? 'Click here to activate all linked accounts.'
                                        : 'Click here to suspend all linked accounts.'}
                                    </p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            );
                          })()}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'kyc' && (
              <div className="space-y-8">
                <div className={`rounded-2xl border px-6 py-5 md:flex items-center md:justify-between ${investorData.kycStatus === 'approved' ? 'bg-green-50 border-green-100' : 'bg-orange-50 border-orange-100'}`}>
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl ${investorData.kycStatus === 'approved' ? 'bg-green-100' : 'bg-orange-100'}`}>
                      <Shield className={`h-6 w-6 ${investorData.kycStatus === 'approved' ? 'text-green-600' : 'text-orange-600'}`} />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 text-lg capitalize">{investorData.kycStatus || 'pending verification'}</h3>
                      <p className="text-sm text-gray-500">Investor has uploaded {kycDocuments.length} mandatory documents for review.</p>
                    </div>
                  </div>
                  {investorData.kycStatus !== 'approved' && (
                    <button
                      onClick={async () => {
                        try {
                          await apiClient.updateKycStatus(params.id, 'approved');
                          toast.success('KYC Approved');
                          const profile = await apiClient.getUserById(params.id);
                          setInvestorData(profile);
                        } catch (err) {
                          toast.error('Failed to approve KYC');
                        }
                      }}
                      className="px-6 py-2.5 mt-2 md:mt-0 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-all shadow-lg shadow-green-100 active:scale-95"
                    >
                      Approve KYC
                    </button>
                  )}
                </div>

                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Verification Documents</h4>
                  {kycDocuments.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {kycDocuments.map((doc, index) => (
                        <div key={index} className="group relative flex flex-col p-5 bg-white border border-gray-100 rounded-2xl hover:border-red-200 hover:shadow-xl hover:shadow-red-50/50 transition-all">
                          <div className="flex items-start justify-between mb-4">
                            <div className="p-3 bg-red-50 rounded-xl">
                              <FileText className="w-6 h-6 text-red-500" />
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={async () => {
                                  try {
                                    const token = localStorage.getItem('token');
                                    const viewUrl = `${apiClient.getApiUrl()}/documents/${doc.id}/view?token=${encodeURIComponent(token || '')}`;
                                    window.open(viewUrl, '_blank');
                                  } catch (err) {
                                    console.error('View error:', err);
                                  }
                                }}
                                className="p-2 bg-gray-50 text-gray-600 hover:bg-neutral-800 hover:text-white rounded-lg transition-colors"
                                title="View"
                              >
                                <FileText className="w-4 h-4" />
                              </button>
                              <button
                                onClick={async () => {
                                  try {
                                    const token = localStorage.getItem('token');
                                    const response = await fetch(`${apiClient.getApiUrl()}/documents/${doc.id}/download`, {
                                      headers: {
                                        'Authorization': `Bearer ${token}`
                                      }
                                    });
                                    if (!response.ok) throw new Error('Download failed');
                                    const blob = await response.blob();
                                    const url = window.URL.createObjectURL(blob);
                                    const a = document.createElement('a');
                                    a.href = url;
                                    a.download = doc.file_name;
                                    document.body.appendChild(a);
                                    a.click();
                                    document.body.removeChild(a);
                                    window.URL.revokeObjectURL(url);
                                  } catch (err) {
                                    console.error('Download error:', err);
                                    toast.error('Failed to download document');
                                  }
                                }}
                                className="p-2 bg-gray-50 text-gray-600 hover:bg-neutral-800 hover:text-white rounded-lg transition-colors"
                                title="Download"
                              >
                                <Download className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                          <div className="space-y-1">
                            <p className="text-xs font-bold text-red-400 uppercase tracking-tight">{getDocTypeName(doc.document_type)}</p>
                            <p className="text-sm font-bold text-gray-900 truncate">{doc.file_name}</p>
                            <p className="text-[10px] text-gray-400 font-medium">Uploaded on {new Date(doc.uploaded_at).toLocaleDateString()}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-12 text-center bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                      <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                        <FileText className="w-8 h-8 text-gray-300" />
                      </div>
                      <p className="text-gray-500 font-medium">No documents uploaded yet.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'funding' && (
              <div className="space-y-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="bg-white overflow-hidden shadow-sm rounded-xl p-6 flex flex-col justify-between h-36 border-t-4 border-transparent hover:border-current transition-all duration-200">
                    <p className="text-sm text-gray-500 mb-1">Total Profile Value</p>
                    <p className="text-2xl font-bold text-[#1F1F1F]">${stats.totalValue.toLocaleString()}</p>
                  </div>
                  <div className="bg-white overflow-hidden shadow-sm rounded-xl p-6 flex flex-col justify-between h-36 border-t-4 border-transparent hover:border-current transition-all duration-200">
                    <p className="text-sm text-gray-500 mb-1">Total Units</p>
                    <p className="text-2xl font-bold text-[#1F1F1F]">{stats.totalUnits.toFixed(2)}</p>
                  </div>
                  <div className="bg-white overflow-hidden shadow-sm rounded-xl p-6 flex flex-col justify-between h-36 border-t-4 border-transparent hover:border-current transition-all duration-200">
                    <p className="text-sm text-gray-500 mb-1">YTD Return</p>
                    <p className={`text-2xl font-bold ${stats.ytdReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {stats.ytdReturn >= 0 ? '+' : ''}{stats.ytdReturn.toFixed(1)}%
                    </p>
                  </div>
                </div>

                {/* Funding Table */}
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Fund Name</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Account Type</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Units</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Current NAV</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Current Value</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Cost Basis</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Gain/Loss</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Action</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-100">
                        {displayedFundingHistory.map((fund) => {
                          const costBasisValue = parseFloat(fund.investment_amount);
                          const currentValue = parseFloat(fund.revised_amount || fund.investment_amount);
                          const gainLossValue = currentValue - costBasisValue;
                          const gainLossPercent = costBasisValue > 0 ? (gainLossValue / costBasisValue) * 100 : 0;
                          const isGain = gainLossValue >= 0;

                          return (
                            <tr key={fund.id} className="hover:bg-gray-50 transition-colors">
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{fund.fund_name}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{fund.account_type}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{parseFloat(fund.estimated_units).toFixed(2)}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">${parseFloat(fund.unit_price).toFixed(2)}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">${currentValue.toLocaleString()}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">${costBasisValue.toLocaleString()}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">
                                <span className={isGain ? 'text-green-600' : 'text-red-600'}>
                                  {isGain ? '+' : '-'}${Math.abs(gainLossValue).toLocaleString()} ({isGain ? '+' : ''}{gainLossPercent.toFixed(2)}%)
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">
                                <Link
                                  href={`/dashboard/funding/${fund.id}`}
                                  className="px-3 py-3 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors inline-block"
                                >
                                  View Fund Details
                                </Link>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  <div className="px-6 py-4 bg-white border-t border-gray-100 flex items-center justify-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => setFundingPage(Math.max(1, fundingPage - 1))}
                        disabled={fundingPage === 1}
                        className="inline-flex items-center gap-1 px-4 py-2 text-[13px] text-[#6B7280] disabled:opacity-40 font-helvetica hover:text-[#1F1F1F] transition-colors font-medium"
                      >
                        Previous
                      </button>
                      <div className="flex gap-2">
                        {Array.from({ length: fundingTotalPages }, (_, i) => i + 1).map((page) => (
                          <button
                            key={page}
                            onClick={() => setFundingPage(page)}
                            className={`h-10 w-10 rounded-lg text-[13px] font-medium transition-colors font-helvetica ${fundingPage === page
                              ? "bg-[#1F3B6E] text-white"
                              : "text-[#6B7280] hover:bg-gray-100"
                              }`}
                          >
                            {page}
                          </button>
                        ))}
                      </div>
                      <button
                        onClick={() => setFundingPage(Math.min(fundingTotalPages, fundingPage + 1))}
                        disabled={fundingPage === fundingTotalPages}
                        className="inline-flex items-center gap-1 px-4 py-2 text-[13px] text-[#6B7280] disabled:opacity-40 font-helvetica hover:text-[#1F1F1F] transition-colors font-medium"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'redemption' && (
              <div className="space-y-6">
                {/* Redemption Table */}
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Request ID</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Amount</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Units Relinquent</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Destination Bank</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Status</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Requested Date</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Action</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-100">
                        {displayedRedemptionHistory.map((redemption) => (
                          <tr key={redemption.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">RED-{redemption.id.substring(0, 6).toUpperCase()}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">${parseFloat(redemption.amount).toLocaleString()}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{parseFloat(redemption.units).toFixed(2)}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                              {redemption.bank_info?.accountName || 'Bank Transfer'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-3 py-1 inline-flex text-xs font-medium rounded-full ${getStatusColor(redemption.status)}`}>
                                {redemption.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                              {new Date(redemption.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <Link
                                href={`/dashboard/redemption/${redemption.id}`}
                                className="px-3 py-3 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors inline-block"
                              >
                                View Fund Details
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  <div className="px-6 py-4 bg-white border-t border-gray-100 flex items-center justify-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => setRedemptionPage(Math.max(1, redemptionPage - 1))}
                        disabled={redemptionPage === 1}
                        className="inline-flex items-center gap-1 px-4 py-2 text-[13px] text-[#6B7280] disabled:opacity-40 font-helvetica hover:text-[#1F1F1F] transition-colors font-medium"
                      >
                        Previous
                      </button>
                      <div className="flex gap-2">
                        {Array.from({ length: redemptionTotalPages }, (_, i) => i + 1).map((page) => (
                          <button
                            key={page}
                            onClick={() => setRedemptionPage(page)}
                            className={`h-10 w-10 rounded-lg text-[13px] font-medium transition-colors font-helvetica ${redemptionPage === page
                              ? "bg-[#1F3B6E] text-white"
                              : "text-[#6B7280] hover:bg-gray-100"
                              }`}
                          >
                            {page}
                          </button>
                        ))}
                      </div>
                      <button
                        onClick={() => setRedemptionPage(Math.min(redemptionTotalPages, redemptionPage + 1))}
                        disabled={redemptionPage === redemptionTotalPages}
                        className="inline-flex items-center gap-1 px-4 py-2 text-[13px] text-[#6B7280] disabled:opacity-40 font-helvetica hover:text-[#1F1F1F] transition-colors font-medium"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Assign Investor Relation Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
            <div className="p-6 space-y-4">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-[#1F1F1F]">Assign Investor Relation</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Select an Investor Relation member to manage this investor's KYC documents and communication.
                  </p>
                </div>
                <button
                  onClick={() => setShowAssignModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Dropdown */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">Investor Relation</label>
                <div className="relative">
                  <select
                    value={selectedIrStaff}
                    onChange={(e) => setSelectedIrStaff(e.target.value)}
                    disabled={irLoading}
                    className="w-full px-5 py-4 bg-[#F9FAFB] border-none rounded-2xl text-sm text-[#111827] appearance-none focus:outline-none focus:ring-2 focus:ring-[#FCD34D] cursor-pointer font-medium disabled:opacity-50"
                  >
                    <option value="">{irLoading ? 'Loading...' : 'Select Investor Relation'}</option>
                    {irStaffList.map((staff: any) => (
                      <option key={staff.id} value={staff.id}>{staff.full_name} ({staff.email})</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-4 pt-4">
                <button
                  onClick={() => setShowAssignModal(false)}
                  className="px-6 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-50 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  disabled={assigning}
                  onClick={async () => {
                    setAssigning(true);
                    try {
                      await apiClient.assignInvestorRelations(params.id, selectedIrStaff || null);
                      toast.success('Investor Relation assigned successfully');
                      const profile = await apiClient.getUserById(params.id);
                      setInvestorData(profile);
                      setShowAssignModal(false);
                    } catch (err) {
                      toast.error('Failed to assign Investor Relation');
                    } finally {
                      setAssigning(false);
                    }
                  }}
                  className="px-6 py-2.5 bg-[#FCD34D] text-[#1F1F1F] text-sm font-bold rounded-xl hover:bg-[#FBD24E] transition-all shadow-lg shadow-amber-100 active:scale-95 disabled:opacity-50"
                >
                  {assigning ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Assign'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Assign Accountant Modal */}
      {showAccountantModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
            <div className="p-6 space-y-4">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-[#1F1F1F]">Assign Accountant</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Select an accountant to manage this investor's financial records.
                  </p>
                </div>
                <button
                  onClick={() => setShowAccountantModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Dropdown */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">Accountant</label>
                <div className="relative">
                  <select
                    value={selectedAccountant}
                    onChange={(e) => setSelectedAccountant(e.target.value)}
                    disabled={accountantLoading}
                    className="w-full px-5 py-4 bg-[#F9FAFB] border-none rounded-2xl text-sm text-[#111827] appearance-none focus:outline-none focus:ring-2 focus:ring-[#FCD34D] cursor-pointer font-medium disabled:opacity-50"
                  >
                    <option value="">{accountantLoading ? 'Loading...' : 'Select accountant'}</option>
                    {accountantList.map((staff: any) => (
                      <option key={staff.id} value={staff.id}>{staff.full_name} ({staff.email})</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-4 pt-4">
                <button
                  onClick={() => setShowAccountantModal(false)}
                  className="px-6 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-50 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  disabled={assigning}
                  onClick={async () => {
                    setAssigning(true);
                    try {
                      await apiClient.assignAccountant(params.id, selectedAccountant || null);
                      toast.success('Accountant assigned successfully');
                      const profile = await apiClient.getUserById(params.id);
                      setInvestorData(profile);
                      setShowAccountantModal(false);
                    } catch (err) {
                      toast.error('Failed to assign accountant');
                    } finally {
                      setAssigning(false);
                    }
                  }}
                  className="px-6 py-2.5 bg-[#FCD34D] text-[#1F1F1F] text-sm font-bold rounded-xl hover:bg-[#FBD24E] transition-all shadow-lg shadow-amber-100 active:scale-95 disabled:opacity-50"
                >
                  {assigning ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Assign'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Note Modal */}
      {showNoteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
            <div className="p-6 space-y-4">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-[#1F1F1F]">Note</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    (Private note visible only to you)
                  </p>
                </div>
                <button
                  onClick={() => setShowNoteModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Textarea */}
              <div className="space-y-2">
                <div className="relative">
                  <textarea
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    maxLength={1000}
                    placeholder="Enter note here"
                    rows={6}
                    className="w-full px-5 py-4 bg-[#F9FAFB] border-none rounded-2xl text-sm text-[#111827] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#FCD34D] resize-none font-medium"
                  />
                  <span className="absolute bottom-4 right-5 text-[10px] font-bold text-gray-400 bg-white/80 px-1.5 py-0.5 rounded-md">
                    {noteText.length}/1000
                  </span>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-4 pt-4">
                <button
                  onClick={() => {
                    setShowNoteModal(false);
                    setNoteText('');
                  }}
                  className="flex-1 py-4 text-sm font-bold text-[#6B7280] hover:bg-[#F9FAFB] rounded-2xl transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    console.log('Saving note:', noteText);
                    setShowNoteModal(false);
                    setNoteText('');
                  }}
                  className="flex-1 py-4 bg-[#FCD34D] text-[#1F2937] text-sm font-bold rounded-2xl hover:bg-[#FBD24E] shadow-lg shadow-yellow-100 transition-all"
                >
                  Assign
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Suspend Account Confirmation Modal */}
      {showSuspendModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden transform transition-all">
            <div className="p-8">
              {/* Icon & Title */}
              <div className="flex flex-col items-center text-center space-y-4">
                <div className={`p-4 rounded-2xl ${investorData.status === 'suspended' ? 'bg-green-50' : 'bg-red-50'}`}>
                  {investorData.status === 'suspended' ? (
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  ) : (
                    <AlertTriangle className="h-8 w-8 text-red-600" />
                  )}
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold text-gray-900 leading-tight">
                    {investorData.status === 'suspended' ? 'Activate Account?' : 'Suspend Account?'}
                  </h2>
                  <p className="text-gray-500 text-sm leading-relaxed max-w-[280px]">
                    {investorData.status === 'suspended'
                      ? "Are you sure you want to activate this account? The investor will be able to log in to the portal."
                      : "Are you sure you want to suspend this account? The investor will no longer be able to log in to the portal."}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-3 mt-10">
                <button
                  disabled={isSuspending}
                  onClick={handleSuspendAccount}
                  className={`w-full py-4 text-sm font-bold text-white rounded-2xl transition-all shadow-lg active:scale-[0.98] flex items-center justify-center gap-2 ${investorData.status === 'suspended'
                    ? 'bg-green-600 hover:bg-green-700 shadow-green-100'
                    : 'bg-red-600 hover:bg-red-700 shadow-red-100'
                    }`}
                >
                  {isSuspending ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    investorData.status === 'suspended' ? 'Activate Account' : 'Suspend Account'
                  )}
                </button>
                <button
                  onClick={() => setShowSuspendModal(false)}
                  disabled={isSuspending}
                  className="w-full py-4 text-sm font-bold text-gray-500 hover:bg-gray-50 rounded-2xl transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Admin Add IRA Modal */}
      {showAdminIraModal && (
        <AdminAddIraModal
          isOpen={showAdminIraModal}
          targetInvestorId={params.id}
          onClose={() => setShowAdminIraModal(false)}
          onSuccess={async () => {
            // Refresh data to show new account in history or stats if needed
            const profile = await apiClient.getUserById(params.id);
            setInvestorData(profile);
          }}
        />
      )}
      {/* Cancel Confirmation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 px-4" onClick={() => setShowCancelModal(false)}>
          <div className="w-full max-w-sm rounded-[24px] bg-white shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
            <div className="p-8 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50 mb-5">
                <X className="h-7 w-7 text-red-500" />
              </div>
              <h3 className="text-xl font-bold text-[#111827] mb-2">Cancel Invitation?</h3>
              <p className="text-sm text-[#6B7280] font-medium leading-relaxed">
                Are you sure you want to cancel this invitation? This action will delete the investor record and cannot be undone.
              </p>
            </div>
            <div className="flex border-t divide-x">
              <button
                onClick={() => setShowCancelModal(false)}
                className="flex-1 py-4 text-sm font-bold text-[#6B7280] hover:bg-gray-50 transition-all"
              >
                No, Keep it
              </button>
              <button
                onClick={handleCancelInvite}
                disabled={isSuspending}
                className="flex-1 py-4 text-sm font-bold text-red-500 hover:bg-red-50 transition-all flex items-center justify-center gap-2"
              >
                {isSuspending && <Loader2 className="h-4 w-4 animate-spin" />}
                Yes, Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>

  );
}
