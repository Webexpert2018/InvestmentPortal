'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, X, ChevronDown } from 'lucide-react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';

interface PageProps {
  params: {
    id: string;
  };
}

export default function FundingRequestDetailsPage({ params }: PageProps) {
  const router = useRouter();
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [selectedRejectReason, setSelectedRejectReason] = useState('');

  // Mock data for the funding request
  const requestData = {
    requestId: 'FUN-123456',
    submittedDate: 'Jan 25, 2026',
    status: 'Pending',
    investor: 'Jakob Philips',
    email: 'demo@gmail.com',
    paymentMethod: 'Wire',
    accountType: 'Roth IRA',
    amount: '$1500.00',
    bankName: 'Metropolitan Commercial Bank',
  };

  const wireInstructions = {
    bankName: 'Metropolitan Commercial Bank',
    accountNumber: '8070001027448',
    routingNumber: '026013356',
    beneficiaryName: 'John Smith',
    bankAddress: '99 Park Ave, 4th Fl, New York, NY 10016',
  };

  const rejectReasons = [
    'Incomplete Documentation',
    'Insufficient Funds Verification',
    'Account Type Mismatch',
    'Compliance Issues',
    'Other',
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending':
        return 'text-orange-600 bg-orange-50';
      case 'Rejected':
        return 'text-red-600 bg-red-50';
      case 'Approved':
        return 'text-green-600 bg-green-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ChevronLeft className="h-5 w-5" />
            <span className="font-medium">Funding Request Details</span>
          </button>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-1">{requestData.requestId}</h1>
              <p className="text-gray-600">Submitted Date: {requestData.submittedDate}</p>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={() => setShowRejectModal(true)}
                className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg font-medium"
              >
                Reject
              </Button>
              <Button
                onClick={() => setShowApproveModal(true)}
                className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg font-medium"
              >
                Approve
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Request Details */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Req Details</h2>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(requestData.status)}`}>
                {requestData.status}
              </span>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Investor</p>
                  <p className="font-medium text-gray-900">{requestData.investor}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Account Type</p>
                  <p className="font-medium text-gray-900">{requestData.accountType}</p>
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-500 mb-1">Email</p>
                <p className="font-medium text-gray-900">{requestData.email}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Payment Method</p>
                  <p className="font-medium text-gray-900">{requestData.paymentMethod}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Amount</p>
                  <p className="font-medium text-gray-900">{requestData.amount}</p>
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-500 mb-1">Bank Name</p>
                <p className="font-medium text-gray-900">{requestData.bankName}</p>
              </div>
            </div>
          </div>

          {/* Custodian Wire Instructions */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Custodian Wire Instructions</h2>

            <div className="mb-6">
              <p className="text-sm text-gray-600">
                Please follow the instructions below to complete the wire transfer. Ensure the reference code is included for proper allocation.
              </p>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Bank Name</p>
                  <p className="font-medium text-gray-900">{wireInstructions.bankName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Account Number</p>
                  <p className="font-medium text-gray-900">{wireInstructions.accountNumber}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Routing Number (ABA)</p>
                  <p className="font-medium text-gray-900">{wireInstructions.routingNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Beneficiary Name</p>
                  <p className="font-medium text-gray-900">{wireInstructions.beneficiaryName}</p>
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-500 mb-1">Bank Address</p>
                <p className="font-medium text-gray-900">{wireInstructions.bankAddress}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Approve Modal */}
      {showApproveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 relative">
            <button
              onClick={() => setShowApproveModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>

            <h2 className="text-xl font-semibold text-gray-900 mb-4">Approve Funding Request</h2>
            <p className="text-gray-600 mb-6">
              Are you sure you want to approve this funding request?
            </p>

            <div className="flex gap-3 justify-end">
              <Button
                onClick={() => setShowApproveModal(false)}
                className="px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium"
              >
                No
              </Button>
              <Button
                onClick={() => {
                  // Handle approve action
                  setShowApproveModal(false);
                }}
                className="px-6 py-2 bg-[#FCD34D] hover:bg-[#fbbf24] text-gray-900 rounded-lg font-medium"
              >
                Yes
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 relative">
            <button
              onClick={() => setShowRejectModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>

            <h2 className="text-xl font-semibold text-gray-900 mb-4">Reject Funding Request</h2>
            <p className="text-gray-600 mb-4">
              Please provide a reason for rejecting this funding request.
            </p>

            <div className="mb-4">
              <div className="relative">
                <select
                  value={selectedRejectReason}
                  onChange={(e) => setSelectedRejectReason(e.target.value)}
                  className="w-full appearance-none px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1F3B6E] focus:border-transparent bg-white cursor-pointer text-gray-700"
                >
                  <option value="">Select reason</option>
                  {rejectReasons.map((reason) => (
                    <option key={reason} value={reason}>
                      {reason}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5 pointer-events-none" />
              </div>
            </div>

            <div className="mb-4">
              <textarea
                value={rejectReason}
                onChange={(e) => {
                  if (e.target.value.length <= 1000) {
                    setRejectReason(e.target.value);
                  }
                }}
                placeholder="Please provide a reason for rejecting this funding request."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1F3B6E] focus:border-transparent resize-none h-24"
              />
              <div className="text-right text-sm text-gray-400 mt-1">
                {rejectReason.length}/1000
              </div>
            </div>

            <div className="flex gap-3 justify-end">
              <Button
                onClick={() => setShowRejectModal(false)}
                className="px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium"
              >
                No
              </Button>
              <Button
                onClick={() => {
                  // Handle reject action
                  setShowRejectModal(false);
                  setRejectReason('');
                  setSelectedRejectReason('');
                }}
                className="px-6 py-2 bg-[#FCD34D] hover:bg-[#fbbf24] text-gray-900 rounded-lg font-medium"
              >
                Yes
              </Button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
