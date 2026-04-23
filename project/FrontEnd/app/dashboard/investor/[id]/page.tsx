'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { DashboardLayout } from '@/components/DashboardLayout';
import { 
  ChevronLeft, X, ChevronDown, FileText, Download, Calendar, Mail, Phone, 
  Shield, MapPin, User, Loader2, Eye, EyeOff, AlertTriangle, CheckCircle 
} from 'lucide-react';
import { apiClient, BASE_URL } from '@/lib/api/client';
import { toast } from 'sonner';

export default function InvestorProfilePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('basic');
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [selectedIrStaff, setSelectedIrStaff] = useState('');
  const [irStaffList, setIrStaffList] = useState<any[]>([]);
  const [irLoading, setIrLoading] = useState(false);
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

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [profile, docs, investments, redemptions, investorStats] = await Promise.all([
          apiClient.getUserById(params.id),
          apiClient.getInvestorDocuments(params.id),
          apiClient.getInvestorInvestments(params.id),
          apiClient.getInvestorRedemptions(params.id),
          apiClient.getInvestorStats(params.id)
        ]);
        setInvestorData(profile);
        setKycDocuments(docs);
        setFundingHistory(investments);
        setRedemptionHistory(redemptions);
        setStats(investorStats);
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

  const handleCancelInvite = async () => {
    if (!confirm('Are you sure you want to cancel this invitation? This will delete the investor record.')) return;
    try {
      setIsSuspending(true); // Using this as a general loading state for buttons
      await apiClient.deleteUser(params.id);
      toast.success('Invitation cancelled');
      router.push('/dashboard/investor');
    } catch (err: any) {
      toast.error(err.message || 'Failed to cancel invitation');
    } finally {
      setIsSuspending(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 font-helvetica">
        {/* Header with Back Button */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/dashboard/investor')}
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
                      ? 'border-[#FCD34D] text-[#3B82F6]'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                      }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

            </div>
          </div>

          {/* Profile Content */}
          <div className="p-6">
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
                    {/* Name and Joined Date */}
                    <div className="space-y-1">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div>
                          <h2 className="text-3xl font-bold text-[#1F1F1F] leading-tight">{investorData.firstName} {investorData.lastName}</h2>
                          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-1">
                            <p className="text-sm text-gray-400 font-medium flex items-center gap-1.5">
                              <Calendar className="h-4 w-4" />
                              Joined date: {new Date(investorData.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </p>
                            <p className="text-sm text-gray-400 font-medium flex items-center gap-1.5">
                              <User className="h-4 w-4" />
                              Investor Relations: <span className="text-gray-900 font-bold">{investorData.assignedIrName || 'Not assigned'}</span>
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {investorData.status === 'pending' ? (
                            <>
                              <button
                                onClick={handleSendInvite}
                                disabled={isSendingInvite}
                                className="px-4 py-2 bg-[#FCD34D] text-[#1F1F1F] text-xs font-bold rounded-full hover:bg-[#FBD24E] transition-colors border border-transparent flex items-center gap-2 shadow-sm"
                              >
                                {isSendingInvite ? <Loader2 className="h-3 w-3 animate-spin" /> : <Mail className="h-3 w-3" />}
                                Send Invite
                              </button>
                              <button
                                onClick={handleSendInvite}
                                disabled={isSendingInvite}
                                className="px-4 py-2 bg-white text-[#1F1F1F] text-xs font-bold rounded-full hover:bg-gray-50 transition-colors border border-gray-200 flex items-center gap-2 shadow-sm"
                              >
                                {isSendingInvite ? <Loader2 className="h-3 w-3 animate-spin" /> : <Mail className="h-3 w-3" />}
                                Resend Invite
                              </button>
                              <button
                                onClick={handleCancelInvite}
                                disabled={isSuspending}
                                className="px-4 py-2 bg-red-50 text-red-700 text-xs font-bold rounded-full hover:bg-red-100 transition-colors border border-red-200 flex items-center gap-2 shadow-sm"
                              >
                                {isSuspending ? <Loader2 className="h-3 w-3 animate-spin" /> : <X className="h-3 w-3" />}
                                Cancel Invite
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={handleForgotPassword}
                                disabled={isResetting}
                                className="px-4 py-2 bg-amber-50 text-amber-600 text-xs font-bold rounded-full hover:bg-amber-100 transition-colors border border-amber-200 flex items-center gap-2 shadow-sm"
                              >
                                {isResetting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Shield className="h-3 w-3" />}
                                Forgot Password
                              </button>
                              <button
                                onClick={() => setShowSuspendModal(true)}
                                disabled={isSuspending}
                                className={`px-4 py-2 text-xs font-bold rounded-full transition-colors border flex items-center gap-2 shadow-sm ${investorData.status === 'suspended'
                                  ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
                                  : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
                                  }`}
                              >
                                {isSuspending ? <Loader2 className="h-3 w-3 animate-spin" /> : <X className="h-3 w-3" />}
                                {investorData.status === 'suspended' ? 'Activate Account' : 'Suspend Account'}
                              </button>
                              <button
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
                                className="px-6 py-2 bg-[#FCD34D] text-[#1F1F1F] text-xs font-bold rounded-full hover:bg-[#FBD24E] transition-colors border border-transparent active:border-yellow-600 shadow-sm"
                              >
                                {investorData.assignedIrId ? 'Change Investor Relations' : 'Assign Investor Relations'}
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8 py-6 border-y border-gray-100">
                      <div className="space-y-1.5">
                        <span className="text-xs font-bold text-gray-400">Email</span>
                        <p className="text-sm font-bold text-gray-900">{investorData.email}</p>
                      </div>

                      <div className="space-y-1.5">
                        <span className="text-xs font-bold text-gray-400">Phone Number</span>
                        <p className="text-sm font-bold text-gray-900">{investorData.phone || '(+1) 4589 6992'}</p>
                      </div>

                      <div className="space-y-1.5">
                        <span className="text-xs font-bold text-gray-400">Tax ID</span>
                        <p className="text-sm font-bold text-gray-900">{investorData.taxId || '56235895656'}</p>
                      </div>

                      <div className="space-y-1.5">
                        <span className="text-xs font-bold text-gray-400">Date of Birth</span>
                        <p className="text-sm font-bold text-gray-900">{investorData.dob ? new Date(investorData.dob).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Oct 25, 1977'}</p>
                      </div>

                      <div className="md:col-span-2 space-y-1.5">
                        <span className="text-xs font-bold text-gray-400">Address</span>
                        <p className="text-sm font-bold text-gray-900 max-w-lg">
                          {investorData.addressLine1 || '123 Market St. Suite 450 San Francisco, CA 94103'}
                        </p>
                      </div>
                    </div>

                    {/* Linked Custodian Accounts */}
                    <div className="space-y-6">
                      <h3 className="text-sm font-bold text-gray-500">Linked Custodian Accounts</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                        {Object.entries(fundingHistory.reduce((acc: any, curr: any) => {
                          const type = curr.account_type || 'Other';
                          const val = parseFloat(curr.revised_amount || curr.investment_amount || 0);
                          acc[type] = (acc[type] || 0) + val;
                          return acc;
                        }, {})).map(([type, total]: [string, any]) => (
                          <div key={type}>
                            <span className="text-xs font-bold text-gray-400 block mb-1">{type} Account</span>
                            <p className="text-sm font-bold text-gray-900">Total Value: <span className="text-gray-900">${total.toLocaleString()}</span></p>
                          </div>
                        ))}
                        {fundingHistory.length === 0 && (
                          <p className="text-sm text-gray-400 italic">No linked accounts found</p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 pt-8 border-t border-gray-50">
                      <div className="space-y-1">
                        <span className="text-xs font-bold text-gray-400">Account Status</span>
                        <p className="text-sm font-bold text-green-600 capitalize">{investorData.status || 'Active'}</p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-xs font-bold text-gray-400">Assigned Investor Relations</span>
                        <p className="text-sm font-bold text-gray-900">{investorData.assignedIrName || <span className="text-gray-400 italic">Not assigned</span>}</p>
                      </div>
                      <div className="space-y-1 text-right sm:text-left">
                        <span className="text-xs font-bold text-gray-400">Last Login</span>
                        <p className="text-sm font-bold text-gray-900">July 20, 2025 at 02:30 AM</p>
                      </div>
                    </div>

                    {/* Persistent Note Section */}
                    <div className="pt-8 space-y-3">
                      <p className="text-xs font-semibold text-gray-400">Note (Private note visible only to you)</p>
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-gray-900">Dec 21, 2025 at 09:30AM</p>
                        <p className="text-xs font-medium text-gray-400 leading-relaxed">
                          Investor provided an updated proof of address. Initial document was blurry but the new one is clear. All checks passed successfully after re-evaluation.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'kyc' && (
              <div className="space-y-8">
                <div className={`rounded-2xl border px-6 py-5 flex items-center justify-between ${investorData.kycStatus === 'approved' ? 'bg-green-50 border-green-100' : 'bg-orange-50 border-orange-100'}`}>
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
                      className="px-6 py-2.5 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-all shadow-lg shadow-green-100 active:scale-95"
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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Total Profile Value</p>
                    <p className="text-2xl font-bold text-[#1F1F1F]">${stats.totalValue.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Total Units</p>
                    <p className="text-2xl font-bold text-[#1F1F1F]">{stats.totalUnits.toFixed(2)}</p>
                  </div>
                  <div>
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
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fund Name</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Account Type</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Units</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current NAV</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current Value</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cost Basis</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gain/Loss</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
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
                                  className="px-3 py-1 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded transition-colors inline-block"
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
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setFundingPage(Math.max(1, fundingPage - 1))}
                        disabled={fundingPage === 1}
                        className="px-3 py-1 text-sm text-gray-400 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      >
                        Previous
                      </button>
                      {Array.from({ length: fundingTotalPages }, (_, i) => i + 1).map((page) => (
                        <button
                          key={page}
                          onClick={() => setFundingPage(page)}
                          className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${fundingPage === page
                            ? 'bg-[#3B82F6] text-white'
                            : 'text-gray-600 hover:bg-gray-100'
                            }`}
                        >
                          {page}
                        </button>
                      ))}
                      <button
                        onClick={() => setFundingPage(Math.min(fundingTotalPages, fundingPage + 1))}
                        disabled={fundingPage === fundingTotalPages}
                        className="px-3 py-1 text-sm text-gray-400 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
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
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Request ID</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Units Relinquent</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Destination Bank</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Requested Date</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
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
                                className="px-3 py-1 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded transition-colors inline-block"
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
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setRedemptionPage(Math.max(1, redemptionPage - 1))}
                        disabled={redemptionPage === 1}
                        className="px-3 py-1 text-sm text-gray-400 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      >
                        Previous
                      </button>
                      {Array.from({ length: redemptionTotalPages }, (_, i) => i + 1).map((page) => (
                        <button
                          key={page}
                          onClick={() => setRedemptionPage(page)}
                          className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${redemptionPage === page
                            ? 'bg-[#3B82F6] text-white'
                            : 'text-gray-600 hover:bg-gray-100'
                            }`}
                        >
                          {page}
                        </button>
                      ))}
                      <button
                        onClick={() => setRedemptionPage(Math.min(redemptionTotalPages, redemptionPage + 1))}
                        disabled={redemptionPage === redemptionTotalPages}
                        className="px-3 py-1 text-sm text-gray-400 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
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

      {/* Assign Investor Relations Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
            <div className="p-6 space-y-4">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-[#1F1F1F]">Assign Investor Relations</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Select an investor relations member to manage this investor's KYC documents and communication.
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
                <label className="text-sm font-bold text-gray-700">Investor Relations</label>
                <div className="relative">
                  <select
                    value={selectedIrStaff}
                    onChange={(e) => setSelectedIrStaff(e.target.value)}
                    disabled={irLoading}
                    className="w-full px-5 py-4 bg-[#F9FAFB] border-none rounded-2xl text-sm text-[#111827] appearance-none focus:outline-none focus:ring-2 focus:ring-[#FCD34D] cursor-pointer font-medium disabled:opacity-50"
                  >
                    <option value="">{irLoading ? 'Loading...' : 'Select investor relations'}</option>
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
                  onClick={() => {
                    setShowAssignModal(false);
                    setSelectedIrStaff('');
                  }}
                  className="flex-1 py-4 text-sm font-bold text-[#6B7280] hover:bg-[#F9FAFB] rounded-2xl transition-all"
                >
                  Cancel
                </button>
                <button
                  disabled={assigning}
                  onClick={async () => {
                    try {
                      setAssigning(true);
                      await apiClient.assignInvestorRelations(params.id, selectedIrStaff || null);
                      toast.success('Investor Relations assigned successfully');
                      // Refresh investor data to show updated assignment
                      const profile = await apiClient.getUserById(params.id);
                      setInvestorData(profile);
                      setShowAssignModal(false);
                      setSelectedIrStaff('');
                    } catch (err: any) {
                      toast.error(err.message || 'Failed to assign');
                    } finally {
                      setAssigning(false);
                    }
                  }}
                  className="flex-1 py-4 bg-[#FCD34D] text-[#1F2937] text-sm font-bold rounded-2xl hover:bg-[#FBD24E] shadow-lg shadow-yellow-100 transition-all disabled:opacity-70"
                >
                  {assigning ? 'Assigning...' : 'Assign'}
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
                      ? "Are you sure you want to activate this account? The investor will be able to log in again."
                      : "Are you sure you want to suspend this account? The investor will no longer be able to log in to the portal."}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-3 mt-10">
                <button
                  disabled={isSuspending}
                  onClick={handleSuspendAccount}
                  className={`w-full py-4 text-sm font-bold text-white rounded-2xl transition-all shadow-lg active:scale-[0.98] flex items-center justify-center gap-2 ${
                    investorData.status === 'suspended'
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
    </DashboardLayout>
  );
}
