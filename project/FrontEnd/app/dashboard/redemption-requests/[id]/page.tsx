'use client';

import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, CheckCircle } from 'lucide-react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api/client';
import { toast } from 'sonner';

export default function RedemptionRequestDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [redemption, setRedemption] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchDetails();
  }, [id]);

  const fetchDetails = async () => {
    try {
      setLoading(true);
      const data = await apiClient.getRedemptionById(id as string);
      setRedemption(data);
    } catch (error) {
      console.error('Error fetching details:', error);
      toast.error('Failed to load redemption details');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (status: string) => {
    try {
      setSubmitting(true);
      await apiClient.updateRedemptionStatus(id as string, status);
      toast.success(`Request ${status} successfully`);
      fetchDetails();
    } catch (error: any) {
      console.error('Error updating status:', error);
      toast.error(error.message || 'Failed to update status');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-10 w-10 text-[#274583] animate-spin opacity-40" />
        </div>
      </DashboardLayout>
    );
  }

  if (!redemption) {
    return (
      <DashboardLayout>
        <div className="p-8 text-center bg-white rounded-xl border max-w-2xl mx-auto mt-20">
          <h2 className="text-xl font-bold mb-4">Request Not Found</h2>
          <Button onClick={() => router.push('/dashboard/redemption-requests')}>Back to List</Button>
        </div>
      </DashboardLayout>
    );
  }

  const data = {
    requestId: `RED-${redemption.id.substring(0, 6).toUpperCase()}`,
    submittedDate: new Date(redemption.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    investor: redemption.investor_name || 'Jakob Phillips',
    accountType: redemption.account_type || 'Personal', 
    email: redemption.investor_email || 'demo@gmail.com',
    amount: `${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(parseFloat(redemption.amount))} / ${parseFloat(redemption.units).toFixed(4)} Units`,
    paymentMethod: 'Wire', // AS REQUESTED
    bankName: redemption.bank_info?.label || 'Metropolitan Commercial Bank',
  };

  const requestNav = parseFloat(redemption.amount) / parseFloat(redemption.units);
  const systemNav = parseFloat(redemption.current_nav || 0);

  return (
    <DashboardLayout>
      <div className="p-8">
        {/* HEADER */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <button
              onClick={() => router.push('/dashboard/redemption-requests')}
              className="flex items-center gap-2 text-sm text-gray-500 hover:text-[#1F3B6E] mb-4 transition-colors font-medium"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>

            <h1 className="text-3xl font-bold tracking-tight text-gray-900 mb-2">
              Redemption Request Details
            </h1>
            <div className="flex items-center gap-2 text-sm text-gray-500 font-medium">
              <span className="bg-gray-100 px-2 py-0.5 rounded uppercase">{data.requestId}</span>
              <span>•</span>
              <span>Submitted Date: {data.submittedDate}</span>
            </div>
          </div>

          {/* ACTION BUTTONS */}
          {redemption.status === 'Pending' && (
            <div className="flex gap-3">
              <Button
                disabled={submitting}
                onClick={() => handleUpdateStatus('Rejected')}
                className="bg-red-500 hover:bg-red-600 rounded-full px-8 py-6 text-base font-bold shadow-lg shadow-red-500/20"
              >
                Reject
              </Button>
              <Button
                disabled={submitting}
                onClick={() => handleUpdateStatus('Approved')}
                className="bg-green-600 hover:bg-green-700 rounded-full px-8 py-6 text-base font-bold shadow-lg shadow-green-600/20"
              >
                {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Approve'}
              </Button>
            </div>
          )}
        </div>

        {/* CONTENT */}
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex justify-between items-center border-b border-gray-50 px-8 py-6">
              <h2 className="text-lg font-bold text-gray-900">Req Details</h2>
              <span
                className={`text-[10px] font-bold uppercase tracking-widest px-4 py-1.5 rounded-full shadow-sm border
                  ${redemption.status === 'Pending' ? 'bg-orange-50 text-orange-600 border-orange-100' : ''}
                  ${redemption.status === 'Approved' ? 'bg-green-50 text-green-600 border-green-100' : ''}
                  ${redemption.status === 'Rejected' ? 'bg-red-50 text-red-600 border-red-100' : ''}
                  ${redemption.status === 'Settled' ? 'bg-blue-50 text-blue-600 border-blue-100' : ''}
                  ${redemption.status === 'Cancelled' ? 'bg-gray-50 text-gray-500 border-gray-100' : ''}
                `}
              >
                {redemption.status}
              </span>
            </div>

            <div className="grid md:grid-cols-2 gap-x-12 gap-y-10 p-8">
              <Detail label="Investor" value={data.investor} />
              <Detail label="Account Type" value={data.accountType} />
              <Detail label="Email" value={data.email} />
              <Detail label="Redemption Amount / Units" value={data.amount} />
              <Detail label="NAV at Request" value={new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(requestNav)} />
              <Detail label="System NAV (Live)" value={new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(systemNav)} />
              <Detail label="Payment Method" value={data.paymentMethod} />
              <Detail label="Bank Name" value={data.bankName} />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden h-fit">
            <div className="px-8 py-6 border-b border-gray-50">
              <h2 className="text-lg font-bold text-gray-900">Review Checklist</h2>
            </div>
            <ul className="divide-y divide-gray-50">
              <ChecklistItem label="KYC Approved" checked />
              <ChecklistItem label="Funding History Verified" checked />
              <ChecklistItem label="Available Units Verified" checked />
              <ChecklistItem label="Bank Details Verified" checked />
            </ul>
          </div>
        </div>

        {redemption.status === 'Approved' && (
          <div className="mt-8 animate-in slide-in-from-bottom-4 duration-500">
            <WireTransferConfirmation amount={redemption.amount} />
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

/* ---------- REUSABLE ---------- */

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="group">
      <p className="text-[10px] text-[#8E8E93] font-bold uppercase tracking-widest mb-2 transition-colors group-hover:text-[#1F3B6E]">{label}</p>
      <p className="text-base font-bold text-gray-900">{value}</p>
    </div>
  );
}

function ChecklistItem({ label, checked }: { label: string; checked?: boolean }) {
  return (
    <li className="flex items-center gap-4 px-8 py-4 text-sm font-medium text-gray-700">
      <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${checked ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-gray-50 text-gray-300 border border-gray-100'}`}>
        <CheckCircle className="h-4 w-4" />
      </div>
      {label}
    </li>
  );
}

function WireTransferConfirmation({ amount }: { amount: string | number }) {
  const formattedAmount = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(parseFloat(amount as string));
  
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
      <h3 className="text-lg font-bold text-gray-900 mb-8">Wire Transfer Confirmation</h3>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <div>
          <p className="text-[10px] text-[#8E8E93] font-bold uppercase tracking-widest mb-1.5">Wire Reference ID</p>
          <p className="text-base font-bold text-gray-900">WR-90{Math.floor(Math.random() * 900) + 100}</p>
        </div>
        <div>
          <p className="text-[10px] text-[#8E8E93] font-bold uppercase tracking-widest mb-1.5">Bank Name</p>
          <p className="text-base font-bold text-gray-900">JP Morgan Chase</p>
        </div>
        <div>
          <p className="text-[10px] text-[#8E8E93] font-bold uppercase tracking-widest mb-1.5">Amount Sent</p>
          <p className="text-base font-bold text-[#1F3B6E]">{formattedAmount}</p>
        </div>
        <div>
          <p className="text-[10px] text-[#8E8E93] font-bold uppercase tracking-widest mb-1.5">Transfer Date</p>
          <p className="text-base font-bold text-gray-900">{new Date().toLocaleDateString()}</p>
        </div>
      </div>

      <div className="flex flex-wrap justify-between items-center gap-6 mt-10 pt-8 border-t border-gray-50">
        <button className="bg-white border-2 border-yellow-400 text-yellow-600 px-8 py-2.5 rounded-full text-sm font-bold hover:bg-yellow-50 transition-all shadow-sm">
          Upload Proof of Wire
        </button>

        <div className="flex gap-4">
          <button className="bg-gray-50 text-gray-700 border border-gray-100 px-8 py-2.5 rounded-full text-sm font-bold hover:bg-gray-100 transition-all shadow-sm">
            Send Confirmation to Investor
          </button>
          <button className="bg-yellow-400 hover:bg-yellow-500 text-[#1F1F1F] px-10 py-2.5 rounded-full text-sm font-bold shadow-lg shadow-yellow-400/20 transition-all transform hover:-translate-y-0.5">
            Mark as Settled
          </button>
        </div>
      </div>
    </div>
  );
}
