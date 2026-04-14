'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/DashboardLayout';
import { ChevronLeft, Loader2, CheckCircle2, AlertCircle, XCircle, FileText, Download, HelpCircle } from 'lucide-react';
import { apiClient } from '@/lib/api/client';
import { toast } from 'sonner';

export default function RedemptionRequestDetailsPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [redemption, setRedemption] = useState<any>(null);

  useEffect(() => {
    fetchDetails();
  }, [params.id]);

  const fetchDetails = async () => {
    try {
      setLoading(true);
      const data = await apiClient.getRedemptionById(params.id);
      setRedemption(data);
    } catch (error) {
      console.error('Error fetching details:', error);
      toast.error('Failed to load redemption details');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel this request?')) return;
    
    try {
      setCancelling(true);
      await apiClient.cancelRedemption(params.id);
      toast.success('Request cancelled successfully');
      fetchDetails(); // Refresh
    } catch (error: any) {
      console.error('Error cancelling:', error);
      toast.error(error.message || 'Failed to cancel request');
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-10 w-10 text-[#1F3B6E] animate-spin opacity-40" />
        </div>
      </DashboardLayout>
    );
  }

  if (!redemption) {
    return (
      <DashboardLayout>
        <div className="p-8 text-center bg-white rounded-2xl shadow-sm border border-gray-100 max-w-2xl mx-auto mt-20">
          <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Request Not Found</h2>
          <p className="text-gray-500 mb-6">We couldn't find the redemption request you're looking for.</p>
          <button onClick={() => router.push('/dashboard/redeem')} className="px-6 py-2 bg-[#1F3B6E] text-white rounded-full font-bold">
            Back to List
          </button>
        </div>
      </DashboardLayout>
    );
  }

  const formatCurrency = (val: any) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(parseFloat(val));
  };

  // Logic for status tracker steps based on live status
  const getStatusSteps = () => {
    const status = redemption.status;
    const createdAt = new Date(redemption.created_at).toLocaleString();
    const updatedAt = new Date(redemption.updated_at).toLocaleString();

    const steps = [
      { title: '1. Request Submitted', date: createdAt, state: 'done' },
      { title: '2. In Review', date: (status === 'Pending') ? 'Under Review' : updatedAt, state: (status === 'Pending') ? 'active' : 'done' },
      { title: '3. Approved by Admin', date: (status === 'Approved' || status === 'Settled') ? updatedAt : (status === 'Pending' ? 'Awaiting...' : 'N/A'), state: (status === 'Approved') ? 'active' : (status === 'Settled' ? 'done' : 'pending') },
      { title: '4. Wire Initiated', date: (status === 'Settled') ? updatedAt : (['Pending', 'Approved'].includes(status) ? 'Awaiting...' : 'N/A'), state: (status === 'Settled') ? 'done' : 'pending' },
      { title: '5. Settled', date: (status === 'Settled') ? updatedAt : (['Pending', 'Approved'].includes(status) ? 'Awaiting...' : 'N/A'), state: (status === 'Settled') ? 'active' : 'pending' },
    ];

    if (status === 'Cancelled' || status === 'Rejected') {
      steps[1] = { title: `Request ${status}`, date: updatedAt, state: 'done' };
    }

    return steps;
  };

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-8xl px-4 py-8 font-helvetica text-[#1F1F1F]">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div>
            <button
              onClick={() => router.push('/dashboard/redeem')}
              className="mb-4 inline-flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-[#1F3B6E] transition-colors uppercase tracking-widest"
            >
              <ChevronLeft className="h-4 w-4" />
              Back to Requests
            </button>

            <h1 className="font-goudy text-2xl sm:text-4xl font-bold text-[#1F1F1F] tracking-tight">
               RED-{redemption.id.substring(0, 6).toUpperCase()}
            </h1>
            <p className="mt-2 text-sm text-[#8E8E93] font-medium italic">
              Requested On: {new Date(redemption.created_at).toLocaleDateString()}
            </p>
          </div>

          {redemption.status === 'Pending' && (
            <button
              onClick={handleCancel}
              disabled={cancelling}
              className="flex items-center gap-2 bg-red-50 text-red-600 px-6 py-3 rounded-full text-sm font-bold shadow-sm hover:bg-red-100 transition-all border border-red-100 disabled:opacity-50"
            >
              {cancelling ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
              Cancel Request
            </button>
          )}
        </div>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.8fr)_minmax(0,1.2fr)]">
          {/* Status Tracker */}
          <div className="rounded-3xl bg-white px-10 py-8 shadow-sm border border-gray-100">
            <h2 className="font-goudy text-xl text-[#1F1F1F] font-bold">Status Tracker</h2>
            <div className="h-px bg-gray-100 my-6" />
            
            <div className="relative mt-2">
              <div className="space-y-12">
                {getStatusSteps().map((step, idx, allSteps) => {
                  const isDone = step.state === 'done';
                  const isActive = step.state === 'active';
                  const hasNext = idx < allSteps.length - 1;
                  
                  return (
                    <div key={idx} className="flex items-start gap-6 relative">
                      {/* Vertical Track Segment */}
                      {hasNext && (
                        <div className="absolute left-[7.5px] top-[28px] bottom-[-20px] w-[2px] z-0 overflow-hidden">
                          {/* Gray Background Path */}
                          <div className="absolute inset-0 bg-gray-100 rounded-full" />
                          {/* Yellow Active Path */}
                          <div className={`absolute inset-0 bg-[#FBCB4B] transition-transform duration-700 ease-in-out origin-top ${
                            isDone ? 'scale-y-100' : 'scale-y-0'
                          }`} />
                        </div>
                      )}

                      {/* Dot Indicator */}
                      <div className={`z-10 mt-1.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-500 shadow-sm ${
                        isDone ? 'bg-[#FBCB4B] border-[#FBCB4B]' : (isActive ? 'bg-white border-[#FBCB4B] ring-4 ring-yellow-50' : 'bg-white border-gray-200')
                      }`}>
                        {isDone && <CheckCircle2 className="h-2.5 w-2.5 text-white" />}
                        {isActive && <div className="h-1.5 w-1.5 rounded-full bg-[#FBCB4B] animate-pulse" />}
                      </div>

                      {/* Content */}
                      <div>
                        <p className={`text-sm font-bold transition-colors duration-500 ${isDone || isActive ? 'text-gray-900' : 'text-gray-400'}`}>
                          {step.title}
                        </p>
                        <p className="mt-1 text-[11px] font-medium text-gray-400 font-mono italic">
                          {step.date}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-12 pt-8 border-t border-gray-50 flex flex-wrap gap-4">
              <button className="flex items-center gap-2 rounded-full bg-gray-50 px-6 py-2.5 text-xs font-bold text-gray-700 hover:bg-gray-100 transition-all border border-gray-100 shadow-sm">
                <Download className="h-3.5 w-3.5" />
                Download Confirmation
              </button>
              <button className="flex items-center gap-2 rounded-full bg-gray-50 px-6 py-2.5 text-xs font-bold text-gray-700 hover:bg-gray-100 transition-all border border-gray-100 shadow-sm">
                <HelpCircle className="h-3.5 w-3.5" />
                Contact Support
              </button>
            </div>
          </div>

          <div className="space-y-8">
            {/* Req Details */}
            <div className="rounded-3xl bg-white px-8 py-8 shadow-sm border border-gray-100">
              <div className="mb-8 flex items-center justify-between">
                <h2 className="font-goudy text-xl text-[#1F1F1F] font-bold">Request Details</h2>
                <span className={`rounded-full px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest shadow-sm border ${
                  redemption.status === 'Pending' ? 'bg-orange-50 text-orange-600 border-orange-100' :
                  redemption.status === 'Cancelled' ? 'bg-red-50 text-red-600 border-red-100' :
                  'bg-green-50 text-green-600 border-green-100'
                }`}>
                  {redemption.status}
                </span>
              </div>
              <div className="grid gap-8 grid-cols-2">
                <div>
                  <p className="text-[10px] text-[#8E8E93] font-bold uppercase tracking-widest mb-1.5">Amount</p>
                  <p className="text-base font-bold text-[#1F3B6E]">{formatCurrency(redemption.amount)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-[#8E8E93] font-bold uppercase tracking-widest mb-1.5">Units Redeemed</p>
                  <p className="text-base font-bold text-gray-900">{parseFloat(redemption.units).toFixed(4)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-[#8E8E93] font-bold uppercase tracking-widest mb-1.5">NAV at redemption</p>
                  <p className="text-base font-bold text-gray-900">
                    {formatCurrency(parseFloat(redemption.amount) / parseFloat(redemption.units))}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-[#8E8E93] font-bold uppercase tracking-widest mb-1.5">Bank Name</p>
                  <p className="text-sm font-bold text-gray-900 leading-tight">
                    {redemption.bank_info?.bank_name ? `${redemption.bank_info.bank_name} - ****${redemption.bank_info.account_number?.slice(-4)}` : 'Account on file'}
                  </p>
                </div>
              </div>
            </div>

            {/* Documents Section (Currently Empty) */}
            <div className="rounded-3xl bg-white px-8 py-8 shadow-sm border border-gray-100">
              <h2 className="font-goudy text-xl text-[#1F1F1F] font-bold mb-4">Documents</h2>
              <p className="text-xs text-gray-400 italic">No documents available for this request.</p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
