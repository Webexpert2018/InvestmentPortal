'use client';

import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/DashboardLayout';
import { ChevronLeft, Check } from 'lucide-react';

export default function RedemptionRequestDetailsPage({ params }: { params: { id: string } }) {
  const router = useRouter();

  // Mock data - in real app, fetch based on params.id
  const redemptionData = {
    requestId: 'RED-123456',
    submittedDate: 'Jan 25, 2026',
    status: 'Approved',
    investor: 'Jakob Philips',
    accountType: 'Roth IRA',
    email: 'demo@gmail.com',
    redemptionAmount: '$10,000.00',
    units: '200 Units',
    paymentMethod: 'Wire',
    bankName: 'Metropolitan Commercial Bank',
    wireReferenceId: 'WR-90231',
    wireBankName: 'JP Morgan Chase',
    amountSent: '$10,000.00',
    transferDate: 'Feb 18, 2025',
    reviewChecklist: [
      { item: 'KYC Approved', completed: true },
      { item: 'Funding History Verified', completed: true },
      { item: 'Available Units Verified', completed: true },
      { item: 'Bank Details Verified', completed: true },
    ],
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 font-sans">
        {/* Header with Back Button */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeft className="h-5 w-5 text-gray-600" />
          </button>
          <h1 className="text-2xl font-semibold text-[#1F1F1F]">Redemption Request Details</h1>
        </div>

        {/* Request ID and Date */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-semibold text-[#1F1F1F]">{redemptionData.requestId}</h2>
          <p className="text-sm text-gray-500 mt-1">Submitted Date: {redemptionData.submittedDate}</p>
        </div>

        {/* Main Content - Two Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Req Details */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-[#1F1F1F]">Req Details</h3>
              <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                {redemptionData.status}
              </span>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Investor</p>
                  <p className="text-sm font-medium text-[#1F1F1F]">{redemptionData.investor}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Account Type</p>
                  <p className="text-sm font-medium text-[#1F1F1F]">{redemptionData.accountType}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Email</p>
                  <p className="text-sm font-medium text-[#1F1F1F]">{redemptionData.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Redemption Amount / Units</p>
                  <p className="text-sm font-medium text-[#1F1F1F]">
                    {redemptionData.redemptionAmount} / {redemptionData.units}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Payment Method</p>
                  <p className="text-sm font-medium text-[#1F1F1F]">{redemptionData.paymentMethod}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Bank Name</p>
                  <p className="text-sm font-medium text-[#1F1F1F]">{redemptionData.bankName}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Review Checklist */}
          <div className="bg-white rounded-xl shadow-sm">
            <h3 className="text-lg font-semibold text-[#1F1F1F] border-b p-6">Review Checklist</h3>
            <div className="space-y-4 p-6">
              {redemptionData.reviewChecklist.map((item, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                  <span className="text-sm text-gray-700">{item.item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Wire Transfer Confirmation */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-[#1F1F1F] mb-6">Wire Transfer Confirmation</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div>
              <p className="text-sm text-gray-500 mb-1">Wire Reference ID</p>
              <p className="text-sm font-medium text-[#1F1F1F]">{redemptionData.wireReferenceId}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Bank Name</p>
              <p className="text-sm font-medium text-[#1F1F1F]">{redemptionData.wireBankName}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Amount Sent</p>
              <p className="text-sm font-medium text-[#1F1F1F]">{redemptionData.amountSent}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Transfer Date</p>
              <p className="text-sm font-medium text-[#1F1F1F]">{redemptionData.transferDate}</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3">
            <button className="px-5 py-2.5 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors">
              Upload Proof of Wire
            </button>
            <button className="px-5 py-2.5 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors">
              Send Confirmation to Investor
            </button>
            <button className="px-5 py-2.5 bg-[#FCD34D] text-gray-800 text-sm font-medium rounded-lg hover:bg-[#FBD24E] transition-colors">
              Mark as settled
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
