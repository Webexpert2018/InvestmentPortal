'use client';

import { useState, useEffect, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRightLeft, FileText } from 'lucide-react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { apiClient, API_URL } from '@/lib/api/client';
import { toast } from 'sonner';

function TransferDetailContent() {
  const { id } = useParams();
  const router = useRouter();
  const [transfer, setTransfer] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const fetchTransfer = async () => {
      try {
        if (!id) return;
        setIsLoading(true);
        const data = await apiClient.getFundTransfer(id as string);
        setTransfer(data);
      } catch (error: any) {
        toast.error(error.message || 'Failed to fetch transfer details');
        router.push('/dashboard/funds/transfers');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTransfer();
  }, [id, router]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'text-[#059669] bg-[#ECFDF5]';
      case 'PENDING_SIGNATURE':
        return 'text-[#D97706] bg-[#FEF3C7]';
      case 'FAILED':
        return 'text-[#DC2626] bg-[#FEF2F2]';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="p-8 text-center text-gray-500">Loading transfer details...</div>
      </DashboardLayout>
    );
  }

  if (!transfer) {
    return null; // Handled by catch block
  }

  return (
    <DashboardLayout>
      <div className="p-0 space-y-6">
        <button
          onClick={() => router.push('/dashboard/funds/transfers')}
          className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Transfers
        </button>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="flex items-center justify-between p-6 sm:p-8 border-b border-gray-100">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 font-goudy mb-1">Transfer Details</h1>
              <p className="text-sm text-gray-500">ID: {transfer.id}</p>
            </div>
            <div className="flex items-center gap-4">
              {transfer.status !== 'COMPLETED' && (
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="px-4 py-2 text-sm font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors border border-red-200"
                >
                  Delete Transfer
                </button>
              )}
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${getStatusColor(transfer.status)}`}>
                {transfer.status.replace('_', ' ')}
              </span>
            </div>
          </div>

          <div className="p-6 sm:p-8 space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              <div>
                <p className="text-sm text-gray-500 font-medium mb-1">Transfer Date</p>
                <p className="text-gray-900 font-semibold">{new Date(transfer.created_at).toLocaleDateString()} at {new Date(transfer.created_at).toLocaleTimeString()}</p>
              </div>

              <div>
                <p className="text-sm text-gray-500 font-medium mb-1">Type</p>
                <p className="text-gray-900 font-semibold">{transfer.transfer_type === 'PERSON_TO_PERSON' ? 'Person to Person' : 'Fund to Fund'}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 p-6 bg-gray-50 rounded-xl border border-gray-100 w-full">
              <div className="flex flex-col sm:flex-row sm:items-center">
                <div className="flex-shrink-0">
                  <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-3">Sender</p>
                  <p className="text-lg text-gray-900 font-bold">{transfer.from_investor_name}</p>
                  <p className="text-sm text-gray-600 mt-1">{transfer.from_fund_name}</p>
                  {transfer.from_account_type && <p className="text-xs text-gray-500 mt-1 capitalize">{transfer.from_account_type.replace('_', ' ')}{transfer.from_account_type.toLowerCase().includes('account') ? '' : ' Account'}</p>}
                </div>

                <div className="hidden sm:flex flex-grow justify-center">
                  <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-200">
                    <ArrowRightLeft className="w-5 h-5 text-gray-400" />
                  </div>
                </div>
              </div>

              <div className="sm:hidden flex justify-center py-4">
                <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-200">
                  <ArrowRightLeft className="w-4 h-4 text-gray-400" />
                </div>
              </div>

              <div>
                <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-3">Recipient</p>
                <p className="text-lg text-gray-900 font-bold">{transfer.to_investor_name || transfer.from_investor_name}</p>
                <p className="text-sm text-gray-600 mt-1">{transfer.to_fund_name || transfer.from_fund_name}</p>
                {transfer.to_account_type && <p className="text-xs text-gray-500 mt-1 capitalize">{transfer.to_account_type.replace('_', ' ')}{transfer.to_account_type.toLowerCase().includes('account') ? '' : ' Account'}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 border-t border-gray-100 pt-8">
              <div>
                <p className="text-sm text-gray-500 font-medium mb-1">Investment Amount</p>
                <p className="text-2xl text-gray-900 font-bold">${parseFloat(transfer.investment_amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium mb-1">Units Transferred</p>
                <p className="text-2xl text-[#2A6CB5] font-bold">{parseFloat(transfer.units).toFixed(4)}</p>
              </div>
            </div>
          </div>
          
          {(transfer.status === 'COMPLETED' || transfer.status === 'SIGNED') && transfer.document_url && (
            <div className="p-6 sm:p-8 border-t border-gray-100 bg-gray-50">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Transfer Documents</h3>
              <a
                href={`${API_URL}/fund-transfers/${transfer.id}/pdf`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-3 bg-white border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2A6CB5] transition-colors"
              >
                <FileText className="w-5 h-5 mr-3 text-[#2A6CB5]" />
                <div className="text-left">
                  <p className="font-semibold">View Original Signed Document</p>
                  <p className="text-xs text-gray-500 font-normal">PDF Document</p>
                </div>
              </a>
            </div>
          )}
        </div>
      </div>

      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden border border-gray-100 animate-in fade-in zoom-in duration-200">
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-2 font-goudy">Delete Transfer</h3>
              <p className="text-sm text-gray-500 mb-6">
                Are you absolutely sure you want to delete this transfer? This action cannot be undone.
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  disabled={isDeleting}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    try {
                      setIsDeleting(true);
                      await apiClient.deleteFundTransfer(transfer.id);
                      toast.success('Transfer deleted successfully');
                      router.push('/dashboard/funds/transfers');
                    } catch (error: any) {
                      toast.error(error.message || 'Failed to delete transfer');
                      setIsDeleting(false);
                      setShowDeleteModal(false);
                    }
                  }}
                  disabled={isDeleting}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center"
                >
                  {isDeleting ? 'Deleting...' : 'Yes, Delete Transfer'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

export default function TransferDetailPage() {
  return (
    <Suspense fallback={<DashboardLayout><div className="p-8 text-center text-gray-500">Loading...</div></DashboardLayout>}>
      <TransferDetailContent />
    </Suspense>
  );
}
