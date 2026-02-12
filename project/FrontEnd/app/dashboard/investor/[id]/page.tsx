'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/DashboardLayout';
import { ChevronLeft, X, ChevronDown, FileText } from 'lucide-react';

export default function InvestorProfilePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('basic');
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [selectedAccountant, setSelectedAccountant] = useState('');
  const [noteText, setNoteText] = useState('');
  const [fundingPage, setFundingPage] = useState(1);
  const [redemptionPage, setRedemptionPage] = useState(1);

  // Mock data - in real app, fetch based on params.id
  const investorData = {
    id: params.id,
    name: 'James Mango',
    joinDate: 'Jan 25, 2026',
    email: 'demo@gmail.com',
    phone: '(+1) 4589 6992',
    taxId: '56235895656',
    dob: 'Oct 25, 1977',
    address: '123 Market St. Suite 450 San Francisco, CA 94103(415) 555-0199',
    avatar: '/images/profile.jpg',
    accounts: [
      { type: 'Personal Account', value: '$82,450' },
      { type: 'Traditional IRA', value: '$154,300' },
      { type: 'Roth IRA', value: '$49,870' },
    ],
    status: 'Active',
    lastLogin: 'July 20, 2025 at 02:30 AM',
    note: 'Investor provided an updated proof of address. Initial document was blurry but the new one is clear. All checks passed successfully after re-evaluation.',
    noteDate: 'Dec 21, 2025 at 09:30AM',
  };

  const tabs = [
    { id: 'basic', label: 'Basic Details' },
    { id: 'kyc', label: 'KYC Status' },
    { id: 'funding', label: 'Funding History' },
    { id: 'redemption', label: 'Redemption History' },
  ];

  // KYC Documents
  const kycDocuments = [
    { name: 'government id.pdf', uploadDate: 'Dec 20, 2025 at 05:30 AM' },
    { name: 'licenses proof.pdf', uploadDate: 'Dec 20, 2025 at 05:30 AM' },
    { name: 'address proof.jpg', uploadDate: 'Dec 20, 2025 at 05:30 AM' },
  ];

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Settled':
        return 'bg-green-100 text-green-700';
      case 'Pending':
        return 'bg-yellow-100 text-yellow-700';
      case 'Rejected':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 font-sans">
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
        <div className="bg-white rounded-xl shadow-sm">
          {/* Tabs and Action Buttons */}
          <div className="border-b border-gray-200">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-6 pt-6 pb-0 gap-4">
              <div className="flex gap-2 overflow-x-auto w-full sm:w-auto">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors border-b-2 ${
                      activeTab === tab.id
                        ? 'border-red-500 text-[#1F1F1F]'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
              {activeTab === 'basic' && (
                <div className="flex gap-3 flex-shrink-0">
                  <button 
                    onClick={() => setShowNoteModal(true)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Note
                  </button>
                  <button 
                    onClick={() => setShowAssignModal(true)}
                    className="px-4 py-2 bg-[#FCD34D] text-gray-800 text-sm font-medium rounded-lg hover:bg-[#FBD24E] transition-colors"
                  >
                    Assign Accountant
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Profile Content */}
          <div className="p-6">
            {activeTab === 'basic' && (
              <div className="space-y-6">
                {/* Profile Photo and Basic Info */}
                <div className="flex flex-col lg:flex-row gap-6">
                  {/* Profile Photo */}
                  <div className="flex-shrink-0">
                    <img
                      src={investorData.avatar}
                      alt={investorData.name}
                      className="w-48 h-48 rounded-lg object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        target.parentElement!.innerHTML = `<div class="w-48 h-48 rounded-lg bg-[#1F3B6E] flex items-center justify-center text-white text-4xl font-bold">JM</div>`;
                      }}
                    />
                  </div>

                  {/* Info Grid */}
                  <div className="flex-1 space-y-6">
                    {/* Name and Join Date */}
                    <div>
                      <h2 className="text-2xl font-semibold text-[#1F1F1F]">{investorData.name}</h2>
                      <p className="text-sm text-gray-500 mt-1">Joined date: {investorData.joinDate}</p>
                    </div>

                    {/* Info Fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="text-sm text-gray-500">Email</label>
                        <p className="text-sm text-[#1F1F1F] mt-1">{investorData.email}</p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-500">Phone Number</label>
                        <p className="text-sm text-[#1F1F1F] mt-1">{investorData.phone}</p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-500">Tax ID</label>
                        <p className="text-sm text-[#1F1F1F] mt-1">{investorData.taxId}</p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-500">Date of Birth</label>
                        <p className="text-sm text-[#1F1F1F] mt-1">{investorData.dob}</p>
                      </div>
                      <div className="md:col-span-2">
                        <label className="text-sm text-gray-500">Address</label>
                        <p className="text-sm text-[#1F1F1F] mt-1">{investorData.address}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Linked Custodian Accounts */}
                <div>
                  <h3 className="text-lg font-semibold text-[#1F1F1F] mb-4">Linked Custodian Accounts</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {investorData.accounts.map((account, index) => (
                      <div key={index} className="p-4 border border-gray-200 rounded-lg">
                        <p className="text-sm text-gray-500 mb-2">{account.type}</p>
                        <p className="text-xl font-semibold text-[#1F1F1F]">Total Value: {account.value}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Account Status and Last Login */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-sm text-gray-500">Account Status</label>
                    <p className="text-sm font-medium text-green-600 mt-1">{investorData.status}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Last Login</label>
                    <p className="text-sm text-[#1F1F1F] mt-1">{investorData.lastLogin}</p>
                  </div>
                </div>

                {/* Note Section */}
                <div>
                  <h3 className="text-sm text-gray-500 mb-2">Note (Private note visible only to you)</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-[#1F1F1F] mb-2">{investorData.noteDate}</p>
                    <p className="text-sm text-gray-700">{investorData.note}</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'kyc' && (
              <div className="space-y-6">
                {/* KYC Status Header */}
                <div className="bg-[#F0FDF4] border border-[#86EFAC] rounded-lg px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-[#16A34A]">Approved</span>
                  </div>
                  <p className="text-sm text-gray-700 mt-1">Approved: Dec 25, 2025 at 02:30 AM</p>
                </div>

                {/* Documents Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {kycDocuments.map((doc, index) => (
                    <div key={index} className="flex items-start gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex-shrink-0 w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                        <FileText className="w-6 h-6 text-red-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#1F1F1F] truncate">{doc.name}</p>
                        <p className="text-xs text-gray-500 mt-1">{doc.uploadDate}</p>
                      </div>
                    </div>
                  ))}
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
                <label className="text-sm font-medium text-gray-700">Accountant</label>
                <div className="relative">
                  <select
                    value={selectedAccountant}
                    onChange={(e) => setSelectedAccountant(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-700 appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-[#FCD34D] focus:border-transparent cursor-pointer"
                  >
                    <option value="">Select accountant</option>
                    <option value="john-doe">John Doe</option>
                    <option value="jane-smith">Jane Smith</option>
                    <option value="michael-johnson">Michael Johnson</option>
                    <option value="sarah-williams">Sarah Williams</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => {
                    setShowAssignModal(false);
                    setSelectedAccountant('');
                  }}
                  className="px-5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    console.log('Assigning accountant:', selectedAccountant);
                    setShowAssignModal(false);
                    setSelectedAccountant('');
                  }}
                  className="px-5 py-2 bg-[#FCD34D] text-gray-800 text-sm font-medium rounded-lg hover:bg-[#FBD24E] transition-colors"
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#FCD34D] focus:border-transparent resize-none"
                  />
                  <span className="absolute bottom-3 right-4 text-xs text-gray-400">
                    {noteText.length}/1000
                  </span>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => {
                    setShowNoteModal(false);
                    setNoteText('');
                  }}
                  className="px-5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    console.log('Saving note:', noteText);
                    setShowNoteModal(false);
                    setNoteText('');
                  }}
                  className="px-5 py-2 bg-[#FCD34D] text-gray-800 text-sm font-medium rounded-lg hover:bg-[#FBD24E] transition-colors"
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
