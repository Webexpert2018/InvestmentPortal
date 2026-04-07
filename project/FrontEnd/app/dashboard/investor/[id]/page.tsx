'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/DashboardLayout';
import { ChevronLeft, X, ChevronDown, FileText, Download, Calendar, Mail, Phone, Shield, MapPin } from 'lucide-react';
import { apiClient } from '@/lib/api/client';
import { toast } from 'sonner';

export default function InvestorProfilePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('basic');
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [selectedAccountant, setSelectedAccountant] = useState('');
  const [noteText, setNoteText] = useState('');
  const [fundingPage, setFundingPage] = useState(1);
  const [redemptionPage, setRedemptionPage] = useState(1);

  const [investorData, setInvestorData] = useState<any>(null);
  const [kycDocuments, setKycDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [profile, docs] = await Promise.all([
          apiClient.getUserById(params.id),
          apiClient.getInvestorDocuments(params.id)
        ]);
        setInvestorData(profile);
        setKycDocuments(docs);
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

  // Funding History Mock Data
  const fundingHistory = [
    { id: 1, fundName: 'ABC Fund', accountType: 'Personal', units: 500, currentNav: '$150.25', currentValue: '$75,143.00', costBasis: '$70,000.00', gainLoss: '+$5,143.03 (+7.35%)' },
    { id: 2, fundName: 'ABC Fund', accountType: 'IRA', units: 500, currentNav: '$150.25', currentValue: '$75,143.00', costBasis: '$70,000.00', gainLoss: '-$5,143.03 (-7.35%)' },
    { id: 3, fundName: 'ABC Fund', accountType: 'IRA', units: 500, currentNav: '$150.25', currentValue: '$75,143.00', costBasis: '$70,000.00', gainLoss: '+$5,143.03 (+7.35%)' },
    { id: 4, fundName: 'ABC Fund', accountType: 'IRA', units: 500, currentNav: '$150.25', currentValue: '$75,143.00', costBasis: '$70,000.00', gainLoss: '+$5,143.03 (+7.35%)' },
    { id: 5, fundName: 'ABC Fund', accountType: 'IRA', units: 500, currentNav: '$150.25', currentValue: '$75,143.00', costBasis: '$70,000.00', gainLoss: '+$5,143.03 (+7.35%)' },
    { id: 6, fundName: 'XYZ Fund', accountType: 'Personal', units: 750, currentNav: '$180.50', currentValue: '$135,375.00', costBasis: '$130,000.00', gainLoss: '+$5,375.00 (+4.13%)' },
    { id: 7, fundName: 'XYZ Fund', accountType: 'Roth IRA', units: 300, currentNav: '$180.50', currentValue: '$54,150.00', costBasis: '$55,000.00', gainLoss: '-$850.00 (-1.55%)' },
    { id: 8, fundName: 'DEF Fund', accountType: 'IRA', units: 600, currentNav: '$125.75', currentValue: '$75,450.00', costBasis: '$72,000.00', gainLoss: '+$3,450.00 (+4.79%)' },
    { id: 9, fundName: 'DEF Fund', accountType: 'Personal', units: 450, currentNav: '$125.75', currentValue: '$56,587.50', costBasis: '$58,000.00', gainLoss: '-$1,412.50 (-2.44%)' },
    { id: 10, fundName: 'GHI Fund', accountType: 'IRA', units: 800, currentNav: '$95.30', currentValue: '$76,240.00', costBasis: '$70,000.00', gainLoss: '+$6,240.00 (+8.91%)' },
    { id: 11, fundName: 'GHI Fund', accountType: 'Roth IRA', units: 550, currentNav: '$95.30', currentValue: '$52,415.00', costBasis: '$50,000.00', gainLoss: '+$2,415.00 (+4.83%)' },
    { id: 12, fundName: 'JKL Fund', accountType: 'Personal', units: 400, currentNav: '$210.80', currentValue: '$84,320.00', costBasis: '$85,000.00', gainLoss: '-$680.00 (-0.80%)' },
    { id: 13, fundName: 'JKL Fund', accountType: 'IRA', units: 350, currentNav: '$210.80', currentValue: '$73,780.00', costBasis: '$68,000.00', gainLoss: '+$5,780.00 (+8.50%)' },
    { id: 14, fundName: 'MNO Fund', accountType: 'IRA', units: 900, currentNav: '$165.40', currentValue: '$148,860.00', costBasis: '$145,000.00', gainLoss: '+$3,860.00 (+2.66%)' },
    { id: 15, fundName: 'MNO Fund', accountType: 'Personal', units: 275, currentNav: '$165.40', currentValue: '$45,485.00', costBasis: '$46,000.00', gainLoss: '-$515.00 (-1.12%)' },
    { id: 16, fundName: 'PQR Fund', accountType: 'Roth IRA', units: 520, currentNav: '$140.25', currentValue: '$72,930.00', costBasis: '$70,000.00', gainLoss: '+$2,930.00 (+4.19%)' },
    { id: 17, fundName: 'PQR Fund', accountType: 'IRA', units: 680, currentNav: '$140.25', currentValue: '$95,370.00', costBasis: '$92,000.00', gainLoss: '+$3,370.00 (+3.66%)' },
    { id: 18, fundName: 'STU Fund', accountType: 'Personal', units: 425, currentNav: '$198.60', currentValue: '$84,405.00', costBasis: '$80,000.00', gainLoss: '+$4,405.00 (+5.51%)' },
    { id: 19, fundName: 'STU Fund', accountType: 'IRA', units: 310, currentNav: '$198.60', currentValue: '$61,566.00', costBasis: '$63,000.00', gainLoss: '-$1,434.00 (-2.28%)' },
    { id: 20, fundName: 'VWX Fund', accountType: 'Roth IRA', units: 590, currentNav: '$175.90', currentValue: '$103,781.00', costBasis: '$100,000.00', gainLoss: '+$3,781.00 (+3.78%)' },
  ];

  const fundingItemsPerPage = 5;
  const fundingTotalPages = Math.ceil(fundingHistory.length / fundingItemsPerPage);
  const fundingStartIndex = (fundingPage - 1) * fundingItemsPerPage;
  const displayedFundingHistory = fundingHistory.slice(fundingStartIndex, fundingStartIndex + fundingItemsPerPage);

  // Redemption History Mock Data
  const redemptionHistory = [
    { id: 1, requestId: 'RED-123456', amount: '$12,000.50', units: 250, destinationBank: 'Checking Account - ****1234', status: 'Settled', requestedDate: 'Jan 25, 2026' },
    { id: 2, requestId: 'RED-123456', amount: '$12,000.50', units: 250, destinationBank: 'Checking Account - ****1234', status: 'Pending', requestedDate: 'Jan 25, 2026' },
    { id: 3, requestId: 'RED-123456', amount: '$12,000.50', units: 250, destinationBank: 'Checking Account - ****1234', status: 'Rejected', requestedDate: 'Jan 25, 2026' },
    { id: 4, requestId: 'RED-123456', amount: '$12,000.50', units: 250, destinationBank: 'Checking Account - ****1234', status: 'Pending', requestedDate: 'Jan 25, 2026' },
    { id: 5, requestId: 'RED-123456', amount: '$12,000.50', units: 250, destinationBank: 'Checking Account - ****1234', status: 'Pending', requestedDate: 'Jan 25, 2026' },
    { id: 6, requestId: 'RED-789012', amount: '$8,500.75', units: 180, destinationBank: 'Savings Account - ****5678', status: 'Settled', requestedDate: 'Jan 24, 2026' },
    { id: 7, requestId: 'RED-345678', amount: '$15,200.00', units: 320, destinationBank: 'Checking Account - ****9012', status: 'Pending', requestedDate: 'Jan 23, 2026' },
    { id: 8, requestId: 'RED-901234', amount: '$6,750.25', units: 140, destinationBank: 'Checking Account - ****3456', status: 'Settled', requestedDate: 'Jan 22, 2026' },
    { id: 9, requestId: 'RED-567890', amount: '$9,800.00', units: 200, destinationBank: 'Savings Account - ****7890', status: 'Rejected', requestedDate: 'Jan 21, 2026' },
    { id: 10, requestId: 'RED-234567', amount: '$11,300.50', units: 230, destinationBank: 'Checking Account - ****2345', status: 'Settled', requestedDate: 'Jan 20, 2026' },
    { id: 11, requestId: 'RED-678901', amount: '$14,500.00', units: 290, destinationBank: 'Checking Account - ****6789', status: 'Pending', requestedDate: 'Jan 19, 2026' },
    { id: 12, requestId: 'RED-890123', amount: '$7,200.75', units: 150, destinationBank: 'Savings Account - ****0123', status: 'Settled', requestedDate: 'Jan 18, 2026' },
    { id: 13, requestId: 'RED-456789', amount: '$10,400.00', units: 210, destinationBank: 'Checking Account - ****4567', status: 'Pending', requestedDate: 'Jan 17, 2026' },
    { id: 14, requestId: 'RED-012345', amount: '$13,100.25', units: 270, destinationBank: 'Checking Account - ****8901', status: 'Rejected', requestedDate: 'Jan 16, 2026' },
    { id: 15, requestId: 'RED-321098', amount: '$9,000.00', units: 185, destinationBank: 'Savings Account - ****2109', status: 'Settled', requestedDate: 'Jan 15, 2026' },
  ];

  const redemptionItemsPerPage = 5;
  const redemptionTotalPages = Math.ceil(redemptionHistory.length / redemptionItemsPerPage);
  const redemptionStartIndex = (redemptionPage - 1) * redemptionItemsPerPage;
  const displayedRedemptionHistory = redemptionHistory.slice(redemptionStartIndex, redemptionStartIndex + redemptionItemsPerPage);

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
                  <div className="w-full lg:w-1/3 space-y-6">
                    <div className="mx-auto lg:mx-0 w-full max-w-[300px] aspect-[4/5] rounded-xl bg-gray-100 overflow-hidden shadow-sm">
                      {investorData.profileImageUrl ? (
                        <img src={investorData.profileImageUrl} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 text-gray-300 font-bold text-6xl uppercase">
                          {investorData.firstName?.[0]}{investorData.lastName?.[0]}
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
                          <p className="text-sm text-gray-400 font-medium">Joined date: {new Date(investorData.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                        </div>
                        <div className="flex gap-2">
                           <button onClick={() => setShowNoteModal(true)} className="px-6 py-2 bg-[#FFF9EE] text-[#D97706] text-xs font-bold rounded-full hover:bg-orange-100 transition-colors">Note</button>
                           <button onClick={() => setShowAssignModal(true)} className="px-6 py-2 bg-[#FCD34D] text-[#1F1F1F] text-xs font-bold rounded-full hover:bg-[#FBD24E] transition-colors">Assign Accountant</button>
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
                          {investorData.addressLine1 || '123 Market St. Suite 450 San Francisco, CA 94103'}(415) 555-0199
                        </p>
                      </div>
                    </div>

                    {/* Linked Custodian Accounts */}
                    <div className="space-y-6">
                      <h3 className="text-sm font-bold text-gray-500">Linked Custodian Accounts</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                        <div>
                          <span className="text-xs font-bold text-gray-400 block mb-1">Personal Account</span>
                          <p className="text-sm font-bold text-gray-900">Total Value: <span className="text-gray-900">$82,450</span></p>
                        </div>
                        <div>
                          <span className="text-xs font-bold text-gray-400 block mb-1">Traditional IRA</span>
                          <p className="text-sm font-bold text-gray-900">Total Value: <span className="text-gray-900">$154,300</span></p>
                        </div>
                        <div>
                          <span className="text-xs font-bold text-gray-400 block mb-1">Roth IRA</span>
                          <p className="text-sm font-bold text-gray-900">Total Value: <span className="text-gray-900">$49,870</span></p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-8 border-t border-gray-50">
                       <div className="space-y-1">
                         <span className="text-xs font-bold text-gray-400">Account Status</span>
                         <p className="text-sm font-bold text-green-600 capitalize">{investorData.status || 'Active'}</p>
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
                               <a
                                 href={`${apiClient.getApiUrl()}/documents/${doc.id}/view`}
                                 target="_blank"
                                 rel="noopener noreferrer"
                                 className="p-2 bg-gray-50 text-gray-600 hover:bg-neutral-800 hover:text-white rounded-lg transition-colors"
                                 title="View"
                               >
                                 <FileText className="w-4 h-4" />
                               </a>
                               <a
                                 href={`${apiClient.getApiUrl()}/documents/${doc.id}/download`}
                                 download
                                 className="p-2 bg-gray-50 text-gray-600 hover:bg-neutral-800 hover:text-white rounded-lg transition-colors"
                                 title="Download"
                               >
                                 <Download className="w-4 h-4" />
                               </a>
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
                    <p className="text-2xl font-bold text-[#1F1F1F]">$286,620</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Total Units</p>
                    <p className="text-2xl font-bold text-[#1F1F1F]">1882.34</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">YTD Return</p>
                    <p className="text-2xl font-bold text-green-600">+12.8%</p>
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
                        {displayedFundingHistory.map((fund) => (
                          <tr key={fund.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{fund.fundName}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{fund.accountType}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{fund.units}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{fund.currentNav}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{fund.currentValue}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{fund.costBasis}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <span className={fund.gainLoss.startsWith('+') ? 'text-green-600' : 'text-red-600'}>
                                {fund.gainLoss}
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
                        ))}
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
                          className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                            fundingPage === page
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
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{redemption.requestId}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{redemption.amount}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{redemption.units}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{redemption.destinationBank}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-3 py-1 inline-flex text-xs font-medium rounded-full ${getStatusColor(redemption.status)}`}>
                                {redemption.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{redemption.requestedDate}</td>
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
                          className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                            redemptionPage === page
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

      {/* Assign Accountant Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
            <div className="p-6 space-y-4">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-[#1F1F1F]">Assign Accountant</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Select an accountant to manage this investor's KYC documents and communication.
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
                <label className="text-sm font-bold text-gray-700">Accountant</label>
                <div className="relative">
                  <select
                    value={selectedAccountant}
                    onChange={(e) => setSelectedAccountant(e.target.value)}
                    className="w-full px-5 py-4 bg-[#F9FAFB] border-none rounded-2xl text-sm text-[#111827] appearance-none focus:outline-none focus:ring-2 focus:ring-[#FCD34D] cursor-pointer font-medium"
                  >
                    <option value="">Select accountant</option>
                    <option value="john-doe">John Doe</option>
                    <option value="jane-smith">Jane Smith</option>
                    <option value="michael-johnson">Michael Johnson</option>
                    <option value="sarah-williams">Sarah Williams</option>
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-4 pt-4">
                <button
                  onClick={() => {
                    setShowAssignModal(false);
                    setSelectedAccountant('');
                  }}
                  className="flex-1 py-4 text-sm font-bold text-[#6B7280] hover:bg-[#F9FAFB] rounded-2xl transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    console.log('Assigning accountant:', selectedAccountant);
                    setShowAssignModal(false);
                    setSelectedAccountant('');
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
    </DashboardLayout>
  );
}
