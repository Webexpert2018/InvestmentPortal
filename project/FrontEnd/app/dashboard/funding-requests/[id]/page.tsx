'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, X, ChevronDown, Loader2 } from 'lucide-react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { apiClient } from '@/lib/api/client';
import { format } from 'date-fns';
import { toast } from 'sonner';
interface PageProps {
  params: {
    id: string;
  };
}

export default function FundingRequestDetailsPage({ params }: PageProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [requestData, setRequestData] = useState<any>(null);

  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [selectedRejectReason, setSelectedRejectReason] = useState('');
  const [rejectError, setRejectError] = useState('');

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        setLoading(true);
        const data = await apiClient.getInvestmentById(params.id);
        setRequestData({
          requestId: `FUN-${params.id.slice(0, 6).toUpperCase()}`,
          submittedDate: data.created_at ? format(new Date(data.created_at), 'MMM dd, yyyy') : 'N/A',
          status: data.status || 'Pending',
          investor: data.investor_name || 'N/A',
          email: data.email || 'N/A',
          paymentMethod: 'Wire', // Default as per plan
          accountType: data.account_type || 'N/A',
          amount: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(parseFloat(data.investment_amount || '0')),
          bankName: data.bank_name || 'N/A',
          accountNumber: data.account_number || 'N/A',
          routingNumber: data.routing_number || 'N/A',
          beneficiaryName: data.beneficiary_name || 'N/A',
          bankAddress: data.bank_address || 'N/A',
          fundName: data.fund_name || 'N/A',
        });
        setError(null);
      } catch (err: any) {
        console.error('Failed to fetch investment details:', err);
        setError(err.message || 'Failed to load funding request details');
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchDetails();
    }
  }, [params.id]);

  const wireInstructions = {
    bankName: requestData?.bankName || 'N/A',
    accountNumber: requestData?.accountNumber || 'N/A',
    routingNumber: requestData?.routingNumber || 'N/A',
    beneficiaryName: requestData?.beneficiaryName || 'N/A',
    bankAddress: requestData?.bankAddress || 'N/A',
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
      case 'Subscription Submitted':
      case 'Awaiting Funding':
        return 'text-orange-600 bg-orange-50';
      case 'Rejected':
        return 'text-red-600 bg-red-50';
      case 'Approved':
      case 'Funds Received':
      case 'Units Issued':
        return 'text-green-600 bg-green-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <Loader2 className="h-12 w-12 animate-spin text-[#FCD34D] mb-4" />
          <p className="text-gray-500 font-medium">Loading request details...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !requestData) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
          >
            <ChevronLeft className="h-5 w-5" />
            <span className="font-medium">Back</span>
          </button>
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <h2 className="text-red-800 font-bold text-lg mb-2">Error</h2>
            <p className="text-red-600">{error || 'Request not found'}</p>
            <Button
              onClick={() => window.location.reload()}
              className="mt-4 bg-red-100 hover:bg-red-200 text-red-700 border-none shadow-none"
            >
              Retry
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-3 md:p-6">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-6 transition-colors group"
          >
            <ChevronLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
            <span className="font-bold text-sm uppercase tracking-widest">Funding Request Details</span>
          </button>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div>
              <div className="sm:flex items-center gap-3 mb-1 space-y-2 sm:space-y-0">
                <h1 className="text-2xl sm:text-4xl font-bold text-[#1F1F1F] font-goudy tracking-tight">{requestData.requestId}</h1>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${getStatusColor(requestData.status)}`}>
                  {requestData.status}
                </span>
              </div>
              <p className="text-gray-500 font-medium">Submitted Date: <span className="text-gray-900">{requestData.submittedDate}</span></p>
            </div>
            <div className="flex flex-wrap gap-3">
              {requestData.status === 'Rejected' ? (
                <Button
                  disabled
                  className="bg-red-100 text-red-600 px-8 py-3 rounded-xl font-bold shadow-none h-auto cursor-default opacity-100 border border-red-200"
                >
                  Rejected
                </Button>
              ) : requestData.status === 'Units Issued' ? (
                <Button
                  disabled
                  className="bg-[#E5E5EA] text-[#8E8E93] px-8 py-3 rounded-xl font-bold shadow-none h-auto cursor-default opacity-100 border border-[#D1D1D6]"
                >
                  Completed
                </Button>
              ) : (
                <>
                  <Button
                    onClick={() => setShowApproveModal(true)}
                    className="flex-1 sm:flex-none bg-[#2BB673] hover:bg-[#23915b] text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-green-100 h-auto transition-all active:scale-95 whitespace-nowrap"
                  >
                    Wire Instructions Sent
                  </Button>
                  <Button
                    onClick={() => setShowRejectModal(true)}
                    className="flex-1 sm:flex-none bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-red-100 h-auto transition-all active:scale-95 whitespace-nowrap"
                  >
                    Reject
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Request Details */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-50">
              <h2 className="text-xl font-bold text-gray-900 font-goudy uppercase tracking-widest">Request Information</h2>
            </div>

            <div className="space-y-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Investor</p>
                  <p className="font-bold text-gray-900">{requestData.investor}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Account Type</p>
                  <p className="font-bold text-gray-900">{requestData.accountType}</p>
                </div>

                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Fund Name</p>
                  <p className="font-bold text-[#1F3B6E]">{requestData.fundName}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Email Address</p>
                  <p className="font-bold text-gray-900 break-all">{requestData.email}</p>
                </div>

                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Payment Method</p>
                  <p className="font-bold text-gray-900">{requestData.paymentMethod}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Total Amount</p>
                  <p className="font-bold text-green-600 text-lg">{requestData.amount}</p>
                </div>

                <div className="sm:col-span-2">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Bank Name</p>
                  <p className="font-bold text-gray-900">{requestData.bankName}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Custodian Wire Instructions */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-8 pb-4 border-b border-gray-50 font-goudy uppercase tracking-widest">Custodian Wire Instructions</h2>

            <div className="mb-8 p-4 bg-blue-50/50 rounded-xl border border-blue-100">
              <p className="text-sm text-blue-800 font-medium leading-relaxed">
                Please follow the instructions below to complete the wire transfer. Ensure the reference code is included for proper allocation.
              </p>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Bank Name</p>
                  <p className="font-bold text-gray-900">{wireInstructions.bankName}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Account Number</p>
                  <p className="font-bold text-gray-900">{wireInstructions.accountNumber}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Routing Number (ABA)</p>
                  <p className="font-bold text-gray-900">{wireInstructions.routingNumber}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Beneficiary Name</p>
                  <p className="font-bold text-gray-900">{wireInstructions.beneficiaryName}</p>
                </div>
              </div>

              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Bank Address</p>
                <p className="font-bold text-gray-900 leading-relaxed">{wireInstructions.bankAddress}</p>
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

            <h2 className="text-xl font-bold text-gray-900 mb-4 font-goudy">Wire Instructions Sent</h2>
            <p className="text-gray-600 text-sm mb-6 font-helvetica">
              Are you sure you want to mark these wire instructions as sent and move this request to awaiting funding?
            </p>

            <div className="flex gap-3 justify-end">
              <Button
                onClick={() => setShowApproveModal(false)}
                className="px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium shadow-none"
              >
                No
              </Button>
              <Button
                onClick={async () => {
                  try {
                    await apiClient.updateInvestmentStatus(params.id, { status: 'Awaiting Funding' });
                    toast.success('Status updated to Awaiting Funding');
                    setShowApproveModal(false);
                    router.push('/dashboard/funding-requests');
                  } catch (err: any) {
                    toast.error(err.message || 'Failed to approve request');
                    console.error('Failed to approve:', err);
                  }
                }}
                className="px-6 py-2 bg-[#FCD34D] hover:bg-[#fbbf24] text-gray-900 rounded-lg font-medium shadow-none"
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
              onClick={() => {
                setShowRejectModal(false);
                setRejectError('');
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>

            <h2 className="text-xl font-semibold text-gray-900 mb-4">Reject Funding Request</h2>
            <p className="text-gray-600 text-sm mb-4">
              Please provide a reason for rejecting this funding request.
            </p>

            <div className="mb-4">
              <div className="relative">
                <select
                  value={selectedRejectReason}
                  onChange={(e) => {
                    setSelectedRejectReason(e.target.value);
                    if (rejectError) setRejectError('');
                  }}
                  className={`w-full appearance-none px-4 py-2 pr-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1F3B6E] ${rejectError && !selectedRejectReason ? 'border-red-500' : 'border-gray-300'
                    } bg-white cursor-pointer text-gray-700`}
                >
                  <option value="0">
                    Select reason
                  </option>

                  {rejectReasons.map((reason) => (
                    <option key={reason} value={reason}>
                      {reason}
                    </option>
                  ))}
                </select>

                {/* Dropdown Error */}
                {rejectError && !selectedRejectReason && (
                  <p className="text-red-500 text-sm mt-1">
                    Please select a reason
                  </p>
                )}

                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5 pointer-events-none" />
              </div>
            </div>

            <div className="mb-4">
              <textarea
                value={rejectReason}
                onChange={(e) => {
                  if (rejectError) setRejectError('');
                  if (e.target.value.length <= 1000) {
                    setRejectReason(e.target.value);
                  }
                }}
                placeholder="Please provide a reason for rejecting this funding request."
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1F3B6E] resize-none h-24 ${rejectError ? 'border-red-500' : 'border-gray-300 focus:border-transparent'
                  }`}
              />
              <div className="flex justify-between items-start mt-1">
                <div className="text-sm text-red-500 font-medium">
                  {rejectError}
                </div>
                <div className="text-right text-sm text-gray-400">
                  {rejectReason.length}/1000
                </div>
              </div>
            </div>

            <div className="flex gap-3 justify-end">
              <Button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectError('');
                }}
                className="px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium shadow-none"
              >
                No
              </Button>
              <Button
                onClick={async () => {
                  if (!rejectReason.trim()) {
                    setRejectError('Please provide a reason for rejecting this funding request.');
                    return;
                  }
                  try {
                    await apiClient.updateInvestmentStatus(params.id, { status: 'Rejected' });
                    toast.success('Funding request rejected successfully');
                    setShowRejectModal(false);
                    setRejectReason('');
                    setSelectedRejectReason('');
                    setTimeout(() => window.location.reload(), 1000);
                  } catch (err: any) {
                    toast.error(err.message || 'Failed to reject request');
                    console.error('Failed to reject:', err);
                  }
                }}
                className="px-6 py-2 bg-[#FCD34D] hover:bg-[#fbbf24] text-gray-900 rounded-lg font-medium shadow-none"
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
