'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { DashboardLayout } from '@/components/DashboardLayout';
import {
  ChevronLeft, X, ChevronDown, FileText, Download, Calendar, Mail, Phone,
  Shield, MapPin, User, Loader2, Eye, EyeOff, AlertTriangle, CheckCircle, Plus, Info, Pencil
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { apiClient, BASE_URL } from '@/lib/api/client';
import { toast } from 'sonner';
import { AdminAddIraModal } from '@/components/ira/AdminAddIraModal';
import { AdminEditProfileModal } from '@/components/investor/AdminEditProfileModal';
import { useAuth } from '@/lib/contexts/AuthContext';

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

export default function InvestorProfilePage({ params }: { params: { id: string } }) {
  const { user } = useAuth();
  const isAdmin = user?.role && ['admin', 'executive_admin', 'fund_admin', 'investor_relations'].includes(user.role.trim().toLowerCase());
  const isExecutiveAdmin = user?.role?.trim().toLowerCase() === 'executive_admin';
  const canEditProfile = user?.role && ['admin', 'executive_admin'].includes(user.role.trim().toLowerCase());
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams?.get('tab');
  const fromParam = searchParams?.get('from');
  const [activeTab, setActiveTab] = useState(() => {
    if (tabParam === 'funding' || tabParam === 'funding-history') return 'basic';
    if (tabParam === 'kyc') return 'kyc';
    if (tabParam === 'redemption') return 'redemption';
    return 'basic';
  });

  useEffect(() => {
    if (tabParam) {
      if (tabParam === 'funding' || tabParam === 'funding-history') setActiveTab('basic');
      else if (tabParam === 'kyc') setActiveTab('kyc');
      else if (tabParam === 'redemption') setActiveTab('redemption');
      else if (tabParam === 'basic') setActiveTab('basic');
    }
  }, [tabParam]);

  const handleBack = () => {
    if (fromParam === 'funding-requests') {
      router.push('/dashboard/funding-requests');
    } else if (fromParam === 'redemption-requests') {
      router.push('/dashboard/redemption-requests');
    } else if (fromParam === 'assigned-investors') {
      router.push('/dashboard/assigned-investors');
    } else if (fromParam === 'investor') {
      router.push('/dashboard/investor');
    } else if (typeof window !== 'undefined' && window.history.length > 2) {
      router.back();
    } else {
      router.push(isAdmin ? '/dashboard/investor' : '/dashboard/assigned-investors');
    }
  };
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
  const [oldDocuments, setOldDocuments] = useState<any[]>([]);
  const [fundingHistory, setFundingHistory] = useState<any[]>([]);
  const [redemptionHistory, setRedemptionHistory] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({ totalValue: 0, totalUnits: 0, ytdReturn: 0 });
  const [loading, setLoading] = useState(true);
  const [isSuspending, setIsSuspending] = useState(false);
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [showAdminIraModal, setShowAdminIraModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);


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
        setKycDocuments(docs);
        setFundingHistory(investments);
        setRedemptionHistory(redemptions);
        setStats(investorStats);
        setIraAccounts(accounts || []);

        // Fetch old investor documents using email or name/id
        const searchStr = profile?.email || `${profile?.firstName} ${profile?.lastName}`.trim() || params.id;
        const legacyDocs = await apiClient.getOldInvestorDocuments(searchStr).catch(() => []);
        setOldDocuments(legacyDocs || []);
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
    { id: 'redemption', label: 'Redemption History' },
    { id: 'legacy_docs', label: 'Legacy Documents' },
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
      toast.success('Invitation link sent successfully. The link will expire in 3 days (72 hours).');
      // Refresh profile to update "Invitation History" box
      const profile = await apiClient.getUserById(params.id);
      setInvestorData(profile);
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
      handleBack();
    } catch (err: any) {
      toast.error(err.message || 'Failed to cancel invitation');
    } finally {
      setIsSuspending(false);
      setShowCancelModal(false);
    }
  };


  const handleProfileUpdateSuccess = (updatedInvestor: any) => {
    setInvestorData(updatedInvestor);
    // Refresh other data if needed
  };

  const handleViewDocument = (doc: any) => {
    if (!doc) return;
    const token = localStorage.getItem('token');
    const viewUrl = `${apiClient.getApiUrl()}/documents/${doc.id}/view?token=${encodeURIComponent(token || '')}`;
    window.open(viewUrl, '_blank');
  };

  const handleDownloadDocument = async (doc: any) => {
    if (!doc) return;
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
  };

  const renderFundingHistorySection = () => (
    <div className="space-y-4 font-helvetica">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white overflow-hidden shadow-xs rounded-xl p-4 flex flex-col justify-between h-24 border border-gray-100 border-t-4 border-t-[#FCD34D] hover:shadow-md transition-all">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Profile Value</p>
          <p className="text-xl sm:text-2xl font-bold text-[#1F1F1F]">${stats.totalValue.toLocaleString()}</p>
        </div>
        <div className="bg-white overflow-hidden shadow-xs rounded-xl p-4 flex flex-col justify-between h-24 border border-gray-100 border-t-4 border-t-[#2A4474] hover:shadow-md transition-all">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Units</p>
          <p className="text-xl sm:text-2xl font-bold text-[#1F1F1F]">{stats.totalUnits.toFixed(2)}</p>
        </div>
        <div className="bg-white overflow-hidden shadow-xs rounded-xl p-4 flex flex-col justify-between h-24 border border-gray-100 border-t-4 border-t-green-500 hover:shadow-md transition-all">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">YTD Return</p>
          <p className={`text-xl sm:text-2xl font-bold ${stats.ytdReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {stats.ytdReturn >= 0 ? '+' : ''}{stats.ytdReturn.toFixed(1)}%
          </p>
        </div>
      </div>

      {/* Funding Table */}
      <div className="border border-gray-200 rounded-xl overflow-hidden shadow-xs bg-white">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Fund Name</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Account Type</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Units</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Current NAV</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Current Value</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Cost Basis</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Gain/Loss</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Action</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">OA</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">SA</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {displayedFundingHistory.length > 0 ? (
                displayedFundingHistory.map((fund) => {
                  const costBasisValue = parseFloat(fund.investment_amount);
                  const currentValue = parseFloat(fund.revised_amount || fund.investment_amount);
                  const gainLossValue = currentValue - costBasisValue;
                  const gainLossPercent = costBasisValue > 0 ? (gainLossValue / costBasisValue) * 100 : 0;
                  const isGain = gainLossValue >= 0;

                  // Filter documents matching this investment ID
                  const investmentDocs = kycDocuments.filter((d: any) =>
                    d.description?.includes(fund.id) ||
                    d.file_name?.includes(fund.id)
                  );

                  // Helper to check if document belongs to the same fund
                  const isDocumentForFund = (d: any) => {
                    if (d.description?.includes(fund.id) || d.file_name?.includes(fund.id)) {
                      return true;
                    }

                    // Extract UUID from file name or description to find matching investment
                    const uuidRegex = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
                    const matchFile = d.file_name?.match(uuidRegex);
                    const matchDesc = d.description?.match(uuidRegex);
                    const matchedInvId = matchFile?.[0] || matchDesc?.[0];

                    if (matchedInvId) {
                      const inv = fundingHistory.find((i: any) => i.id === matchedInvId);
                      if (inv) {
                        return inv.fund_id === fund.fund_id;
                      }
                    }

                    // Fallback: match fund name words
                    if (fund.fund_name) {
                      const cleanFundName = fund.fund_name.toLowerCase().replace(/[^a-z0-9]/g, '');
                      const cleanFileName = d.file_name?.toLowerCase().replace(/[^a-z0-9]/g, '') || '';
                      const cleanDesc = d.description?.toLowerCase().replace(/[^a-z0-9]/g, '') || '';
                      if (cleanFileName.includes(cleanFundName) || cleanDesc.includes(cleanFundName)) {
                        return true;
                      }
                    }

                    return false;
                  };

                  // Find OA and SA
                  let oa = investmentDocs.find((d: any) =>
                    d.document_type === 'operating_agreement' ||
                    d.file_name?.toLowerCase().includes('operating_agreement') ||
                    d.file_name?.toLowerCase().includes('oa')
                  );

                  const sa = investmentDocs.find((d: any) =>
                    d.document_type === 'subscription_agreement' ||
                    d.file_name?.toLowerCase().includes('subscription_agreement') ||
                    d.file_name?.toLowerCase().includes('sa')
                  );

                  if (!oa) {
                    oa = kycDocuments.find((d: any) =>
                      (d.document_type === 'operating_agreement' ||
                        d.file_name?.toLowerCase().includes('operating_agreement') ||
                        d.file_name?.toLowerCase().includes('oa')) &&
                      isDocumentForFund(d)
                    );

                    if (!oa) {
                      const saDocs = kycDocuments.filter((d: any) =>
                        (d.document_type === 'subscription_agreement' ||
                          d.file_name?.toLowerCase().includes('subscription_agreement') ||
                          d.file_name?.toLowerCase().includes('sa')) &&
                        isDocumentForFund(d)
                      );
                      const otherSAs = saDocs.filter((d: any) =>
                        !d.description?.includes(fund.id) &&
                        !d.file_name?.includes(fund.id)
                      );
                      if (otherSAs.length > 0) {
                        oa = otherSAs[otherSAs.length - 1];
                      }
                    }
                  }

                  let finalOA = oa;
                  let finalSA = sa;
                  if (!oa && !sa && investmentDocs.length > 0) {
                    finalOA = investmentDocs[0];
                    finalSA = investmentDocs[0];
                  }

                  return (
                    <tr key={fund.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap text-xs font-bold text-gray-900">{fund.fund_name}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-700 font-medium">{fund.account_type}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-700 font-medium">{parseFloat(fund.estimated_units).toFixed(2)}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-700 font-medium">${parseFloat(fund.unit_price).toFixed(2)}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-700 font-bold">${currentValue.toLocaleString()}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-700 font-medium">${costBasisValue.toLocaleString()}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-xs font-bold">
                        <span className={isGain ? 'text-green-600' : 'text-red-600'}>
                          {isGain ? '+' : '-'}${Math.abs(gainLossValue).toLocaleString()} ({isGain ? '+' : ''}{gainLossPercent.toFixed(2)}%)
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-xs">
                        <Link
                          href={`/dashboard/funding/${fund.id}`}
                          className="px-3 py-1.5 text-xs font-bold text-[#1F1F1F] bg-amber-100 hover:bg-amber-200 rounded-lg transition-colors inline-block"
                        >
                          View Fund Details
                        </Link>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-xs">
                        {finalOA ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleViewDocument(finalOA)}
                              className="p-1 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
                              title="View Operating Agreement"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDownloadDocument(finalOA)}
                              className="p-1 text-gray-500 hover:text-[#2BB673] hover:bg-green-50 rounded transition-colors"
                              title="Download Operating Agreement"
                            >
                              <Download className="h-4 w-4" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400 italic">Not signed</span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-xs">
                        {finalSA ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleViewDocument(finalSA)}
                              className="p-1 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
                              title="View Subscription Agreement"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDownloadDocument(finalSA)}
                              className="p-1 text-gray-500 hover:text-[#2BB673] hover:bg-green-50 rounded transition-colors"
                              title="Download Subscription Agreement"
                            >
                              <Download className="h-4 w-4" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400 italic">Not signed</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={10} className="px-4 py-6 text-center text-xs text-gray-400 italic">
                    No funding history available.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {fundingTotalPages > 1 && (
          <div className="px-4 py-2.5 bg-gray-50/50 border-t border-gray-100 flex items-center justify-center">
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => setFundingPage(Math.max(1, fundingPage - 1))}
                disabled={fundingPage === 1}
                className="inline-flex items-center gap-1 px-3 py-1 text-xs text-gray-600 disabled:opacity-40 font-medium hover:text-gray-900 transition-colors"
              >
                Previous
              </button>
              <div className="flex gap-1">
                {Array.from({ length: fundingTotalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setFundingPage(page)}
                    className={`h-7 w-7 rounded-md text-xs font-bold transition-colors ${fundingPage === page
                      ? "bg-[#1F3B6E] text-white"
                      : "text-gray-600 hover:bg-gray-200/60"
                      }`}
                  >
                    {page}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setFundingPage(Math.min(fundingTotalPages, fundingPage + 1))}
                disabled={fundingPage === fundingTotalPages}
                className="inline-flex items-center gap-1 px-3 py-1 text-xs text-gray-600 disabled:opacity-40 font-medium hover:text-gray-900 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <DashboardLayout>
      <div className="space-y-4 font-helvetica">
        {/* Header with Back Button */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleBack}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeft className="h-5 w-5 text-gray-600" />
          </button>
          <h1 className="text-xl sm:text-2xl font-semibold text-[#1F1F1F]">Profile Information</h1>
        </div>

        {/* Main Content Card */}
        <div className="bg-white rounded-xl shadow-xs border border-gray-100 overflow-hidden">
          {/* Tabs and Action Buttons */}
          <div className="border-b border-gray-200">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-4 sm:px-6 pt-3 pb-0 gap-3">
              <div className="flex gap-1 sm:gap-2 overflow-x-auto w-full sm:w-auto">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-3 sm:px-4 py-2.5 text-xs sm:text-sm font-medium whitespace-nowrap transition-colors border-b-2 ${activeTab === tab.id
                      ? 'border-[#FCD34D] text-[#2A4474] font-bold'
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
                              className={`h-8 px-4 rounded-full text-xs font-bold transition-all shadow-xs active:scale-95 flex items-center gap-1.5 border mb-1.5 ${hasInactive
                                ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
                                : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
                                }`}
                            >
                              {isSuspending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : (hasInactive ? <CheckCircle className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />)}
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
          <div className="p-4 sm:p-5">
            {activeTab === 'basic' && (
              <div className="space-y-5">
                {/* Header Summary Profile Card */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 sm:p-5 bg-gradient-to-r from-amber-50/40 via-white to-gray-50/40 rounded-2xl border border-amber-100/60 shadow-xs">
                  {/* Left: Avatar */}
                  <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl border border-amber-200/80 shadow-xs overflow-hidden bg-amber-100 shrink-0 flex items-center justify-center">
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
                      <div className="w-full h-full bg-[#FCD34D] flex items-center justify-center text-[#1F1F1F] text-2xl sm:text-3xl font-extrabold tracking-tight">
                        {(investorData.firstName?.[0] || '') + (investorData.lastName?.[0] || '')}
                      </div>
                    )}
                  </div>

                  {/* Right: Info & Controls */}
                  <div className="flex-1 min-w-0 space-y-2.5 w-full">
                    {/* Name & Meta Info */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-xl sm:text-2xl font-bold text-[#1F1F1F] leading-tight">
                            {investorData.firstName} {investorData.lastName}
                          </h2>
                          {canEditProfile && (
                            <button
                              onClick={() => setIsEditProfileModalOpen(true)}
                              className="p-1 text-gray-400 hover:text-[#2A4474] hover:bg-amber-100 rounded-md transition-all"
                              title="Edit Profile"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                        {/* Investor other details */}
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-gray-500 font-medium">
                          <p className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5 shrink-0 text-amber-500" />
                            Joined date: <span className="text-gray-800 font-semibold">{new Date(investorData.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                          </p>
                          <span className="hidden sm:inline text-gray-300">•</span>
                          <p className="flex items-center gap-1">
                            <Shield className="h-3.5 w-3.5 shrink-0 text-amber-500" />
                            Accountant: <span className="text-gray-900 font-bold">{investorData.assignedAccountantName || 'Not assigned'}</span>
                          </p>
                          <span className="hidden sm:inline text-gray-300">•</span>
                          <p className="flex items-center gap-1">
                            <User className="h-3.5 w-3.5 shrink-0 text-amber-500" />
                            Investor Relation: <span className="text-gray-900 font-bold">{investorData.assignedIrName || 'Not assigned'}</span>
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Action Controls Row - wrapping cleanly */}
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      {(() => {
                        const isPending = investorData.status === 'pending';

                        if (!isAdmin) return null;

                        const inviteButtons = [
                          <button
                            key="send"
                            onClick={handleSendInvite}
                            disabled={isSendingInvite || !isPending}
                            className={`h-9 px-4 text-xs font-bold rounded-full transition-colors border flex items-center gap-1.5 whitespace-nowrap shadow-xs ${isPending
                              ? 'bg-[#FCD34D] text-[#1F1F1F] hover:bg-[#FBD24E] border-transparent'
                              : 'bg-[#F9FAFB] text-[#9CA3AF] border-[#E5E7EB] cursor-not-allowed'
                              }`}
                          >
                            {isSendingInvite ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Mail className="h-3.5 w-3.5" />}
                            Send/Resend Invite
                          </button>,
                          <button
                            key="cancel"
                            onClick={() => setShowCancelModal(true)}
                            disabled={isSuspending || !isPending}
                            className={`h-9 px-4 text-xs font-bold rounded-full transition-colors border flex items-center gap-1.5 whitespace-nowrap shadow-xs ${isPending
                              ? 'bg-red-50 text-red-700 hover:bg-red-100 border-red-200'
                              : 'bg-[#F9FAFB] text-[#9CA3AF] border-[#E5E7EB] cursor-not-allowed'
                              }`}
                          >
                            {isSuspending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5" />}
                            Cancel Invite
                          </button>
                        ];

                        const actionButtons = [
                          <button
                            key="forgot"
                            onClick={handleForgotPassword}
                            disabled={isResetting || isPending}
                            className={`h-9 px-4 text-xs font-bold rounded-full transition-colors border flex items-center gap-1.5 whitespace-nowrap shadow-xs ${!isPending
                              ? 'bg-amber-50 text-amber-600 hover:bg-amber-100 border-amber-200'
                              : 'bg-[#F9FAFB] text-[#9CA3AF] border-[#E5E7EB] cursor-not-allowed'
                              }`}
                          >
                            {isResetting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Shield className="h-3.5 w-3.5" />}
                            Forgot Password
                          </button>,
                          <TooltipProvider key="suspend-provider">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  key="suspend"
                                  onClick={() => setShowSuspendModal(true)}
                                  disabled={isSuspending || isPending}
                                  className={`h-9 px-4 text-xs font-bold rounded-full transition-colors border flex items-center gap-1.5 whitespace-nowrap shadow-xs ${!isPending
                                    ? (investorData.status === 'suspended'
                                      ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
                                      : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
                                    )
                                    : 'bg-[#F9FAFB] text-[#9CA3AF] border-[#E5E7EB] cursor-not-allowed'
                                    }`}
                                >
                                  {isSuspending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5" />}
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
                            className="h-9 px-4 text-xs font-bold rounded-full transition-colors border flex items-center gap-1.5 whitespace-nowrap shadow-xs bg-[#FCD34D] text-[#1F1F1F] hover:bg-[#FBD24E] border-transparent"
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
                            className="h-9 px-4 text-xs font-bold rounded-full transition-colors border flex items-center gap-1.5 whitespace-nowrap shadow-xs bg-[#FCD34D] text-[#1F1F1F] hover:bg-[#FBD24E] border-transparent"
                          >
                            {investorData.assignedAccountantId ? 'Change Accountant' : 'Assign Accountant'}
                          </button>
                        ];

                        return isPending ? [...inviteButtons, ...actionButtons] : [...actionButtons, ...inviteButtons];
                      })()}
                    </div>
                  </div>
                </div>

                {/* Contact & Personal Info Grid (Compressed) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-4 py-4 px-4 sm:px-5 bg-gray-50/50 rounded-2xl border border-gray-100">
                  <div className="space-y-0.5">
                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Email</span>
                    <p className="text-xs sm:text-sm font-bold text-gray-900 truncate">{investorData.email}</p>
                  </div>

                  <div className="space-y-0.5">
                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Phone Number</span>
                    <p className="text-xs sm:text-sm font-bold text-gray-900">{formatPhoneDisplay(investorData.phone) || 'Not provided'}</p>
                  </div>

                  <div className="space-y-0.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Tax ID</span>
                      {canEditProfile && (
                        <button
                          onClick={() => setIsEditProfileModalOpen(true)}
                          className="p-0.5 text-gray-400 hover:text-[#2A4474] hover:bg-amber-50 rounded transition-all"
                          title="Edit Tax ID"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                    <p className="text-xs sm:text-sm font-bold text-gray-900">
                      {investorData.taxId ? (investorData.taxId.length === 9 && !investorData.taxId.includes('-') ? `${investorData.taxId.slice(0, 3)}-${investorData.taxId.slice(3, 5)}-${investorData.taxId.slice(5)}` : investorData.taxId) : 'Not provided'}
                    </p>
                  </div>

                  <div className="space-y-0.5">
                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Date of Birth</span>
                    <p className="text-xs sm:text-sm font-bold text-gray-900">{investorData.dob ? new Date(investorData.dob).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Not provided'}</p>
                  </div>

                  <div className="sm:col-span-2 lg:col-span-4 space-y-0.5 pt-2 border-t border-gray-200/60">
                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Address</span>
                    <p className="text-xs sm:text-sm font-bold text-gray-900">
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

                {/* Linked Custodian Accounts (Compressed) */}
                <div className="space-y-3 pt-1">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Linked Custodian Accounts</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
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
                        <div key={account.id} className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between ${isSuspended ? 'bg-red-50/20 border-red-100 opacity-80' : 'bg-[#F9FAFB]/60 border-gray-100 hover:border-amber-200'}`}>
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-0.5">{account.account_type} Account</span>
                              <p className="text-xs sm:text-sm font-bold text-gray-900">${netValue.toLocaleString()}</p>
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
                                      className={`px-3 py-1 text-[10px] font-bold rounded-full transition-all border flex items-center gap-1 shadow-xs active:scale-95 ${isSuspended
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
                          <div className="flex items-center justify-between pt-1.5 border-t border-gray-100/60 mt-auto">
                            <p className="text-[10px] text-gray-500 font-medium">#{account.account_number || 'N/A'}</p>
                            <div className={`flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-bold capitalize tracking-tight ${isSuspended ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                              <div className={`w-1 h-1 rounded-full ${isSuspended ? 'bg-red-500' : 'bg-green-500'}`} />
                              {isSuspended ? 'Suspended' : 'Activated'}
                            </div>
                          </div>
                        </div>
                      );
                    }) : (
                      <p className="text-xs text-gray-400 italic bg-gray-50/50 p-3 rounded-xl border border-gray-100">No linked accounts found</p>
                    )}
                  </div>
                </div>

                {/* Account Status & Staff Assignment Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3 border-t border-gray-100">
                  <div className="space-y-0.5">
                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Account Status</span>
                    {(() => {
                      const status = investorData.status?.toLowerCase();
                      if (status === 'pending') {
                        return <p className="text-xs sm:text-sm font-bold capitalize text-amber-500">Pending</p>;
                      }
                      const isMainActive = status === 'active';
                      const hasActiveIra = iraAccounts.some((acc: any) => acc.status === 'active');
                      const isOverallActive = isMainActive || hasActiveIra;
                      return (
                        <p className={`text-xs sm:text-sm font-bold capitalize ${isOverallActive ? 'text-green-600' : 'text-red-600'}`}>
                          {isOverallActive ? 'Active' : 'Suspended'}
                        </p>
                      );
                    })()}
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Assigned Investor Relation</span>
                    <p className="text-xs sm:text-sm font-bold text-gray-900">{investorData.assignedIrName || <span className="text-gray-400 italic">Not assigned</span>}</p>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Assigned Accountant</span>
                    <p className="text-xs sm:text-sm font-bold text-gray-900">{investorData.assignedAccountantName || <span className="text-gray-400 italic">Not assigned</span>}</p>
                  </div>
                </div>

                {/* Invitation History Box */}
                <div className="pt-3 border-t border-gray-100">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Invitation History</span>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className="h-3.5 w-3.5 text-gray-300 cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent className="bg-neutral-900 text-white border-neutral-800">
                              <p className="text-[11px] font-medium">Each invitation link is valid for 3 days from the time it was sent.</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      {investorData.invitationLogs?.length > 0 && (
                        <span className="text-[10px] font-bold bg-[#FFF9EE] text-[#D1A94C] border border-[#FEF3C7] px-2.5 py-0.5 rounded-full shadow-xs">
                          {investorData.invitationLogs.length} {investorData.invitationLogs.length === 1 ? 'Invite' : 'Invites'} Total
                        </span>
                      )}
                    </div>

                    {investorData.invitationLogs?.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {investorData.invitationLogs.map((log: any, idx: number) => {
                          const sentDate = new Date(log.sent_at);
                          const isExpired = Date.now() - sentDate.getTime() > 3 * 24 * 60 * 60 * 1000;
                          const isLatest = idx === 0;

                          return (
                            <div key={idx} className={`relative group p-4 rounded-xl border transition-all ${isLatest && !isExpired ? 'bg-amber-50/30 border-amber-200 shadow-xs' : 'bg-gray-50 border-gray-100 opacity-90'}`}>
                              {isLatest && !isExpired && (
                                <div className="absolute -top-2 -right-2 bg-green-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-xs animate-pulse">
                                  ACTIVE LINK
                                </div>
                              )}

                              <div className="flex items-center justify-between mb-2">
                                <div className={`p-1.5 rounded-md ${isLatest && !isExpired ? 'bg-amber-100 text-amber-700' : 'bg-gray-200 text-gray-500'}`}>
                                  <Mail className="h-3.5 w-3.5" />
                                </div>
                                <span className={`text-[9px] font-bold uppercase tracking-tight px-2 py-0.5 rounded ${isExpired ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                                  {isExpired ? 'Expired' : 'Valid'}
                                </span>
                              </div>

                              <div className="space-y-2">
                                <div className="flex flex-col">
                                  <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Sent On</span>
                                  <p className="text-xs font-bold text-gray-900">
                                    {sentDate.toLocaleString('en-US', {
                                      month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
                                    })}
                                  </p>
                                </div>

                                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-100/50">
                                  <div className="flex flex-col">
                                    <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">By Admin</span>
                                    <p className="text-[10px] font-bold text-gray-700 truncate">{log.sent_by_name}</p>
                                  </div>
                                  <div className="flex flex-col">
                                    <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">To Investor</span>
                                    <p className="text-[10px] font-bold text-gray-700 truncate">{investorData.firstName}</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 flex flex-col items-center justify-center text-center">
                        <Mail className="h-6 w-6 text-gray-300 mb-1" />
                        <p className="text-xs text-gray-400 italic">No invitation records found for this investor.</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom Master Status Toggle Button */}
                {isExecutiveAdmin && investorData.status === 'suspended' && (
                  <div className="flex-shrink-0 pt-2">
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
                                className={`px-6 py-2.5 rounded-full text-xs font-bold transition-all shadow-xs active:scale-95 flex items-center gap-2 border ${hasInactive
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

                {/* Embedded Funding History Section at Bottom of Basic Details Tab */}
                <div className="mt-6 pt-6 border-t-2 border-gray-100 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm sm:text-base font-bold text-[#1F1F1F] flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#FCD34D] inline-block"></span>
                      Funding History
                    </h3>
                  </div>
                  {renderFundingHistorySection()}
                </div>
              </div>
            )}

            {activeTab === 'kyc' && (() => {
              const verificationDocs = kycDocuments.filter((doc: any) =>
                ['tax_return_y1', 'tax_return_y2', 'balance_sheet'].includes(doc.document_type)
              );

              return (
                <div className="space-y-6">
                  <div className={`rounded-2xl border px-5 py-4 md:flex items-center md:justify-between ${investorData.kycStatus === 'approved' ? 'bg-green-50 border-green-100' : 'bg-orange-50 border-orange-100'}`}>
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-xl ${investorData.kycStatus === 'approved' ? 'bg-green-100' : 'bg-orange-100'}`}>
                        <Shield className={`h-5 w-5 ${investorData.kycStatus === 'approved' ? 'text-green-600' : 'text-orange-600'}`} />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 text-base capitalize">{investorData.kycStatus || 'pending verification'}</h3>
                        <p className="text-xs text-gray-500">Investor has uploaded {verificationDocs.length} mandatory documents for review.</p>
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
                        className="px-5 py-2 mt-2 md:mt-0 bg-green-600 text-white font-bold text-xs rounded-xl hover:bg-green-700 transition-all shadow-md shadow-green-100 active:scale-95"
                      >
                        Approve KYC
                      </button>
                    )}
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Verification Documents</h4>
                    {verificationDocs.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {verificationDocs.map((doc, index) => (
                          <div key={index} className="group relative flex flex-col p-4 bg-white border border-gray-100 rounded-xl hover:border-amber-200 hover:shadow-md transition-all">
                            <div className="flex items-start justify-between mb-3">
                              <div className="p-2.5 bg-red-50 rounded-lg">
                                <FileText className="w-5 h-5 text-red-500" />
                              </div>
                              <div className="flex gap-1.5">
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
                                  className="p-1.5 bg-gray-50 text-gray-600 hover:bg-neutral-800 hover:text-white rounded-md transition-colors"
                                  title="View"
                                >
                                  <FileText className="w-3.5 h-3.5" />
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
                                  className="p-1.5 bg-gray-50 text-gray-600 hover:bg-neutral-800 hover:text-white rounded-md transition-colors"
                                  title="Download"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                            <div className="space-y-0.5">
                              <p className="text-[10px] font-bold text-red-500 uppercase tracking-tight">{getDocTypeName(doc.document_type)}</p>
                              <p className="text-xs font-bold text-gray-900 truncate">{doc.file_name}</p>
                              <p className="text-[10px] text-gray-400 font-medium">Uploaded on {new Date(doc.uploaded_at).toLocaleDateString()}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-8 text-center bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                        <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                          <FileText className="w-6 h-6 text-gray-300" />
                        </div>
                        <p className="text-xs text-gray-500 font-medium">No documents uploaded yet.</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}

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

            {activeTab === 'legacy_docs' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Legacy Documents</h4>
                  {oldDocuments.length > 0 && (
                    <span className="text-xs bg-amber-50 text-amber-700 font-bold px-2.5 py-0.5 rounded-full border border-amber-200">
                      {oldDocuments.length} Legacy File(s)
                    </span>
                  )}
                </div>
                {oldDocuments.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {oldDocuments.map((doc, index) => (
                      <div key={doc.id || index} className="group relative flex flex-col p-5 bg-amber-50/20 border border-amber-100 rounded-2xl hover:border-amber-300 hover:shadow-xl hover:shadow-amber-50/50 transition-all">
                        <div className="flex items-start justify-between mb-4">
                          <div className="p-3 bg-amber-100 rounded-xl">
                            <FileText className="w-6 h-6 text-amber-600" />
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                const token = localStorage.getItem('token');
                                const tokenParam = token ? `?token=${encodeURIComponent(token)}` : '';
                                window.open(`${apiClient.getApiUrl()}/documents/old-investor/file/${doc.id}/view${tokenParam}`, '_blank');
                              }}
                              className="p-2 bg-white text-gray-600 hover:bg-neutral-800 hover:text-white rounded-lg transition-colors border border-gray-100 shadow-sm"
                              title="View"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                const token = localStorage.getItem('token');
                                const tokenParam = token ? `?token=${encodeURIComponent(token)}` : '';
                                window.open(`${apiClient.getApiUrl()}/documents/old-investor/file/${doc.id}/download${tokenParam}`, '_blank');
                              }}
                              className="p-2 bg-white text-gray-600 hover:bg-neutral-800 hover:text-white rounded-lg transition-colors border border-gray-100 shadow-sm"
                              title="Download"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-amber-600 uppercase tracking-tight">{doc.document_type || 'Tax Document'}</p>
                          <p className="text-sm font-bold text-gray-900 truncate">{doc.file_name}</p>
                          <p className="text-[10px] text-gray-400 font-medium">Uploaded on {new Date(doc.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                    <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                      <FileText className="w-6 h-6 text-gray-300" />
                    </div>
                    <p className="text-xs text-gray-500 font-medium">No legacy documents</p>
                  </div>
                )}
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
      {/* Admin Edit Profile Modal */}
      <AdminEditProfileModal
        isOpen={isEditProfileModalOpen}
        onClose={() => setIsEditProfileModalOpen(false)}
        onSuccess={handleProfileUpdateSuccess}
        investor={investorData}
      />
    </DashboardLayout>
  );
}
