'use client';

import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

export default function RedemptionRequestDetailsPage() {
  const { id } = useParams();
  const router = useRouter();

  const data = {
    requestId: 'RED-123456',
    submittedDate: 'Jan 25, 2026',
    investor: 'Jakob Phillips',
    accountType: 'Roth IRA',
    email: 'demo@gmail.com',
    amount: '$10,000.00 / 200 Units',
    paymentMethod: 'Wire',
    bankName: 'Metropolitan Commercial Bank',
  };

  /* ---------- STATE ---------- */
  const [status, setStatus] =
    useState<'Pending' | 'Approved' | 'Rejected'>('Pending');

  const [showSuccess, setShowSuccess] = useState<string | null>(null);
  const [showWarning, setShowWarning] = useState<string | null>(null);

  // Reject
  const [openRejectModal, setOpenRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectNote, setRejectNote] = useState('');

  // Approve
  const [openApproveModal, setOpenApproveModal] = useState(false);
  const [effectiveDate, setEffectiveDate] = useState('');
  const [approveNote, setApproveNote] = useState('');

  const rejectReasons = [
    { label: 'Insufficient balance', value: 'INSUFFICIENT_BALANCE' },
    { label: 'Invalid bank details', value: 'INVALID_BANK_DETAILS' },
    { label: 'Duplicate request', value: 'DUPLICATE_REQUEST' },
    { label: 'Compliance issue', value: 'COMPLIANCE_ISSUE' },
  ];

  /* ---------- HANDLERS ---------- */

  const handleReject = () => {
    if (!rejectReason || !rejectNote.trim()) return;

    setShowSuccess(null);
    setShowWarning('Redemption request rejected successfully.');
    setStatus('Rejected');
    setOpenRejectModal(false);
  };

  const handleApprove = () => {
    if (!effectiveDate || !approveNote.trim()) return;

    setShowWarning(null);
    setShowSuccess('Redemption request approved successfully.');
    setStatus('Approved');
    setOpenApproveModal(false);
  };

  /* ========================= UI ========================= */

  return (
    <DashboardLayout>
      <div className="p-8">
        {/* HEADER */}
        <div className="flex justify-between mb-6">
          <div>
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-sm text-gray-500 mb-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>

            <h1 className="text-[22px] font-bold">
              Redemption Request Details
            </h1>

            {showSuccess && (
              <div className="mt-3 bg-green-50 border border-green-200 px-4 py-2 text-sm text-green-700 rounded-lg">
                {showSuccess}
              </div>
            )}

            {showWarning && (
              <div className="mt-3 bg-yellow-50 border border-yellow-300 px-4 py-2 text-sm text-yellow-700 rounded-lg">
                {showWarning}
              </div>
            )}

            <p className="text-sm text-gray-500 mt-2">
              {data.requestId} • Submitted Date: {data.submittedDate}
            </p>
          </div>

          {/* ACTION BUTTONS */}
          {status === 'Pending' && (
            <div className="flex gap-3">
              <Button
                onClick={() => {
                  setShowWarning(null);
                  setOpenRejectModal(true);
                }}
                className="bg-red-500 hover:bg-red-600 rounded-full"
              >
                Reject
              </Button>
              <Button
                onClick={() => {
                  setShowWarning(null);
                  setOpenApproveModal(true);
                }}
                className="bg-green-600 hover:bg-green-700 rounded-full"
              >
                Approve
              </Button>
            </div>
          )}
        </div>

        {/* CONTENT */}
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-white rounded-xl border">
            <div className="flex justify-between border-b p-6">
              <h2 className="font-semibold">Req Details</h2>
              <span
                className={`text-xs px-3 py-1 rounded-full
                  ${status === 'Pending' && 'bg-orange-50 text-orange-600'}
                  ${status === 'Approved' && 'bg-green-50 text-green-600'}
                  ${status === 'Rejected' && 'bg-red-50 text-red-600'}
                `}
              >
                {status}
              </span>
            </div>

            <div className="grid md:grid-cols-2 gap-6 p-6">
              <Detail label="Investor" value={data.investor} />
              <Detail label="Account Type" value={data.accountType} />
              <Detail label="Email" value={data.email} />
              <Detail label="Redemption Amount / Units" value={data.amount} />
              <Detail label="Payment Method" value={data.paymentMethod} />
              <Detail label="Bank Name" value={data.bankName} />
            </div>
          </div>

          <div className="bg-white rounded-xl border">
            <h2 className="font-semibold border-b p-6">Review Checklist</h2>
            <ul className="space-y-3 p-6">
              <ChecklistItem label="KYC Approved" />
              <ChecklistItem label="Funding History Verified" />
              <ChecklistItem label="Available Units Verified" />
              <ChecklistItem label="Bank Details Verified" />
            </ul>
          </div>
        </div>

        {status === 'Approved' && <WireTransferConfirmation />}

      </div>

      {/* ================= MODALS ================= */}

      {openRejectModal && (
        <Modal title="Reject Redemption" onClose={() => setOpenRejectModal(false)}>
          <select
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 mb-3"
          >
            <option value="">Select reason</option>
            {rejectReasons.map(r => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>

          <textarea
            value={rejectNote}
            onChange={(e) => setRejectNote(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 h-24 mb-4"
            placeholder="Enter note"
          />

          <ModalActions
            onCancel={() => setOpenRejectModal(false)}
            onConfirm={handleReject}
            confirmText="Reject"
            disabled={!rejectReason || !rejectNote.trim()}
          />
        </Modal>
      )}

      {openApproveModal && (
        <Modal title="Approve Redemption" onClose={() => setOpenApproveModal(false)}>
          <input
            type="date"
            value={effectiveDate}
            onChange={(e) => setEffectiveDate(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 mb-3"
          />

          <textarea
            value={approveNote}
            onChange={(e) => setApproveNote(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 h-24 mb-4"
            placeholder="Enter note"
          />

          <ModalActions
            onCancel={() => setOpenApproveModal(false)}
            onConfirm={handleApprove}
            confirmText="Approve"
            disabled={!effectiveDate || !approveNote.trim()}
          />
        </Modal>
      )}
    </DashboardLayout>
  );
}

/* ---------- REUSABLE ---------- */

function Modal({ title, children, onClose }: any) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-xl p-6 w-[420px]">
        <div className="flex justify-between mb-4">
          <h3 className="font-semibold">{title}</h3>
          <button onClick={onClose}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function ModalActions({ onCancel, onConfirm, confirmText, disabled }: any) {
  return (
    <div className="flex justify-end gap-3">
      <button onClick={onCancel} className="px-4 py-2 rounded-full bg-gray-100">
        Cancel
      </button>
      <button
        onClick={onConfirm}
        disabled={disabled}
        className="px-4 py-2 rounded-full bg-yellow-400 text-[#2A4474]
                   disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {confirmText}
      </button>
    </div>
  );
}

function Detail({ label, value }: any) {
  return (
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}

function ChecklistItem({ label }: any) {
  return (
    <li className="flex gap-2 text-sm">
      <span className="w-5 h-5 bg-green-100 text-green-600 rounded-full flex items-center justify-center">✓</span>
      {label}
    </li>
  );
}

function Info({ label, value }: any) {
  return (
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}

function WireTransferConfirmation() {
  return (
    <div className="mt-8 bg-white rounded-xl border rounded-xl p-6">
      <h3 className="font-semibold mb-6">Wire Transfer Confirmation</h3>

      {/* INFO GRID */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-sm">
        <Info label="Wire Reference ID" value="WR-90231" />
        <Info label="Bank Name" value="JP Morgan Chase" />
        <Info label="Amount Sent" value="$10,000.00" />
        <Info label="Transfer Date" value="Feb 18, 2026" />
      </div>

      {/* ACTIONS */}
      <div className="flex flex-wrap justify-between gap-4 mt-6">
        <button
          className="border border-yellow-400 text-yellow-600
                     px-4 py-2 rounded-full text-sm font-medium"
        >
          Upload Proof of Wire
        </button>

        <div className="flex gap-3">
          <button
            className="border rounded-full px-4 py-2 text-sm"
          >
            Send Confirmation to Investor
          </button>

          <button
            className="bg-yellow-400 hover:bg-yellow-500
                       text-white px-4 py-2 rounded-full text-sm"
          >
            Mark as Settled
          </button>
        </div>
      </div>
    </div>
  );
}

