'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DashboardLayout } from '@/components/DashboardLayout';

interface ReconciliationDetailProps {
  params: {
    id: string;
  };
}

export default function ReconciliationDetailPage({ params }: ReconciliationDetailProps) {
  const router = useRouter();
  const [showResolveModal, setShowResolveModal] = useState(false);

  // Mock data - in real app, fetch based on params.id
  const reconciliationData = {
    recordId: 'REC - 123456',
    custodianData: {
      eventId: 'EV-123456',
      eventType: 'Wire',
      bankName: 'Metropolitan Commercial Bank',
      amount: '$50,000.00',
      date: 'Feb 12, 2025',
      referenceId: 'CUST-REF-123456',
    },
    internalData: {
      ledgerId: 'LED-123456',
      transactionType: 'Wire',
      recordedDate: 'Feb 12, 2025',
      recordedAmount: '$48,000.00',
      internalId: 'INT-REF-3409',
    },
    status: 'Mismatch',
  };

  const handleMarkAsResolved = () => {
    setShowResolveModal(true);
  };

  const confirmResolve = () => {
    // Handle mark as resolved logic
    console.log('Marking as resolved:', params.id);
    setShowResolveModal(false);
    // Redirect back to reconciliation list
    router.push('/dashboard/reconciliation');
  };

  const cancelResolve = () => {
    setShowResolveModal(false);
  };

  return (
    <DashboardLayout>
      <div className="p-6">
        {/* Header with Back Button */}
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ChevronLeft className="h-5 w-5 mr-1" />
            <span className="font-medium">Reconciliation Details</span>
          </button>
        </div>

        {/* Record ID and Mark as Resolved Button */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">{reconciliationData.recordId}</h1>
          <Button
            onClick={handleMarkAsResolved}
            className="px-6 py-2 bg-[#FCD34D] hover:bg-[#fbbf24] text-gray-900 rounded-full font-medium"
          >
            Mark as Resolved
          </Button>
        </div>

        {/* Two Column Layout - Custodian Data and Internal Ledger Data */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Custodian Data */}
          <div className="bg-white rounded-lg shadow-sm">
            <div className="flex items-center justify-between pb-4 mb-6 border-b border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900">Custodian Data</h2>
              <span className="px-3 py-1 text-xs font-medium text-red-700 bg-red-100 rounded-full">
                {reconciliationData.status}
              </span>
            </div>

            <div className="space-y-6 p-6 pt-0">
              {/* Row 1: Event ID and Event Type */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Event ID
                  </label>
                  <p className="text-sm text-gray-900 font-medium">{reconciliationData.custodianData.eventId}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Event Type
                  </label>
                  <p className="text-sm text-gray-900 font-medium">{reconciliationData.custodianData.eventType}</p>
                </div>
              </div>

              {/* Row 2: Bank Name and Amount */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Bank Name
                  </label>
                  <p className="text-sm text-gray-900 font-medium">{reconciliationData.custodianData.bankName}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Amount
                  </label>
                  <p className="text-sm text-gray-900 font-medium">{reconciliationData.custodianData.amount}</p>
                </div>
              </div>

              {/* Row 3: Date and Reference ID */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Date
                  </label>
                  <p className="text-sm text-gray-900 font-medium">{reconciliationData.custodianData.date}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Reference ID
                  </label>
                  <p className="text-sm text-gray-900 font-medium">{reconciliationData.custodianData.referenceId}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Internal Ledger Data */}
          <div className="bg-white rounded-lg shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 pb-4 mb-6 border-b border-gray-200 p-6">Internal Ledger Data</h2>

            <div className="space-y-6 p-6 pt-0">
              {/* Row 1: Ledger ID and Transaction Type */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Ledger ID
                  </label>
                  <p className="text-sm text-gray-900 font-medium">{reconciliationData.internalData.ledgerId}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Transaction Type
                  </label>
                  <p className="text-sm text-gray-900 font-medium">{reconciliationData.internalData.transactionType}</p>
                </div>
              </div>

              {/* Row 2: Recorded Date and Recorded Amount */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Recorded Date
                  </label>
                  <p className="text-sm text-gray-900 font-medium">{reconciliationData.internalData.recordedDate}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Recorded Amount
                  </label>
                  <p className="text-sm text-gray-900 font-medium">{reconciliationData.internalData.recordedAmount}</p>
                </div>
              </div>

              {/* Row 3: Internal Ref */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Internal Ref
                  </label>
                  <p className="text-sm text-gray-900 font-medium">{reconciliationData.internalData.internalId}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mark as Resolved Confirmation Modal */}
        {showResolveModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 w-full max-w-lg mx-4 relative">
              {/* Close Button */}
              <button
                onClick={cancelResolve}
                className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="mb-8">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Mark as Resolved</h3>
                <p className="text-sm text-gray-600">Are you sure you want to mark as resolved this event?</p>
              </div>
              <div className="flex justify-end gap-3">
                <Button
                  onClick={cancelResolve}
                  className="px-8 py-2 bg-[#FEF3E2] hover:bg-[#fde8c8] text-gray-700 rounded-full font-medium"
                >
                  No
                </Button>
                <Button
                  onClick={confirmResolve}
                  className="px-8 py-2 bg-[#FCD34D] hover:bg-[#fbbf24] text-gray-900 rounded-full font-medium"
                >
                  Yes
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
