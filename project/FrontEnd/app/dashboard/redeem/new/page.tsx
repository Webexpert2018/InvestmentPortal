'use client';

import { useMemo, useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { apiClient } from '@/lib/api/client';
import { Loader2, ChevronDown, CheckCircle2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

type Step = 'amount' | 'confirm' | 'submitted';

const bankAccounts = [
  { id: 'bank-1', label: 'Checking Account - ****1234' },
  { id: 'bank-2', label: 'Checking Account - ****1234' },
  { id: 'bank-3', label: 'Checking Account - ****1234' },
];

export default function RedemptionAmountPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('amount');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [holdings, setHoldings] = useState<any[]>([]);
  const [selectedHoldingId, setSelectedHoldingId] = useState<string>('');
  const [amount, setAmount] = useState('0.00');
  const [reason, setReason] = useState('');
  const [selectedBankId, setSelectedBankId] = useState<string | null>('bank-3');
  const [liveNav, setLiveNav] = useState<number | null>(null);

  useEffect(() => {
    fetchHoldings();
    fetchLiveNav();
  }, []);

  const fetchLiveNav = async () => {
    try {
      const data = await apiClient.getNavSummary();
      if (data && data.currentNav) {
        setLiveNav(data.currentNav);
      }
    } catch (error) {
      console.error('Error fetching live NAV:', error);
    }
  };

  const fetchHoldings = async () => {
    try {
      setLoading(true);
      const data = await apiClient.getMyInvestments();
      // Only show investments that are completed/active and have units
      const activeHoldings = data.filter(h => parseFloat(h.estimated_units) > 0);
      setHoldings(activeHoldings);
      if (activeHoldings.length > 0) {
        setSelectedHoldingId(activeHoldings[0].id);
      }
    } catch (error) {
      console.error('Error fetching holdings:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectedHolding = useMemo(() => {
    return holdings.find(h => h.id === selectedHoldingId);
  }, [holdings, selectedHoldingId]);

  const numericAmount = useMemo(() => {
    const value = parseFloat(amount.replace(/,/g, ''));
    return isFinite(value) ? value : 0;
  }, [amount]);

  const currentNav = useMemo(() => {
    if (liveNav !== null) return liveNav;
    return selectedHolding ? parseFloat(selectedHolding.unit_price) : 0;
  }, [selectedHolding, liveNav]);

  const unitsToRedeem = useMemo(() => {
    if (currentNav === 0) return 0;
    return numericAmount / currentNav;
  }, [numericAmount, currentNav]);

  const isOverLimit = useMemo(() => {
    if (!selectedHolding) return false;
    return unitsToRedeem > parseFloat(selectedHolding.estimated_units);
  }, [unitsToRedeem, selectedHolding]);

  const estimatedFees = 0; // Keeping it simple for now
  const totalPayout = useMemo(() => {
    return numericAmount - estimatedFees;
  }, [numericAmount]);

  const handleContinue = async () => {
    if (step === 'amount') {
      setStep('confirm');
    } else if (step === 'confirm') {
      try {
        setSubmitting(true);
        await apiClient.createRedemption({
          investment_id: selectedHoldingId,
          amount: numericAmount,
          reason,
          bank_info: bankAccounts.find(b => b.id === selectedBankId),
        });
        setStep('submitted');
      } catch (error) {
        console.error('Error submitting redemption:', error);
        alert('Failed to submit redemption request. Please try again.');
      } finally {
        setSubmitting(false);
      }
    }
  };

  const handleBack = () => {
    if (step === 'confirm') {
      setStep('amount');
    }
  };

  const formatCurrency = (val: number | string) => {
    const num = typeof val === 'string' ? parseFloat(val) : val;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(num);
  };

  const estimatedPayoutDate = useMemo(() => {
    const today = new Date();
    const start = new Date(today);
    start.setDate(today.getDate() + 3);
    const end = new Date(today);
    end.setDate(today.getDate() + 5);

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    
    if (start.getMonth() === end.getMonth()) {
      return `${monthNames[start.getMonth()]} ${start.getDate()}–${end.getDate()}, ${start.getFullYear()}`;
    } else {
      return `${monthNames[start.getMonth()]} ${start.getDate()} – ${monthNames[end.getMonth()]} ${end.getDate()}, ${start.getFullYear()}`;
    }
  }, []);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-10 w-10 text-[#274583] animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  const renderFooter = (
    primaryLabel: string,
    options: { showBack?: boolean; showCancel?: boolean } = {},
  ) => {
    const { showBack = true, showCancel = false } = options;

    return (
      <div className="mt-10 flex items-center justify-end gap-3">
        {showCancel && (
          <button
            type="button"
            onClick={() => router.push('/dashboard/redeem')}
            className="rounded-full bg-[#FFF3D6] px-6 py-2 text-sm font-medium text-[#4B4B4B] hover:bg-[#FFE7AF]"
          >
            Cancel
          </button>
        )}
        {showBack && (
          <button
            type="button"
            onClick={handleBack}
            className="rounded-full bg-[#FFF3D6] px-6 py-2 text-sm font-medium text-[#4B4B4B] hover:bg-[#FFE7AF]"
          >
            Back
          </button>
        )}
        <button
          type="button"
          onClick={handleContinue}
          disabled={submitting || (step === 'amount' && (numericAmount <= 0 || !selectedHoldingId || isOverLimit))}
          className="rounded-full bg-[#FBCB4B] px-8 py-2 text-sm font-medium text-[#1F1F1F] hover:bg-[#F9B800] disabled:cursor-not-allowed disabled:opacity-60 flex items-center gap-2"
        >
          {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {primaryLabel}
        </button>
      </div>
    );
  };

  const renderAmountStep = () => (
    <>
      <div className="mb-6">
        <h1 className="font-goudy text-base sm:text-xl leading-[28px] text-[#1F1F1F]">Redemption Amount</h1>
        <p className="mt-1 text-[11px] text-[#8E8E93]">
          Please select a fund and enter the amount you wish to redeem.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,2.4fr)_minmax(0,1fr)]">
        <div className="rounded-2xl bg-white px-6 py-6 shadow-sm">
          {/* Select Fund */}
          <div className="mb-6">
            <label className="block text-[11px] font-medium text-[#8E8E93] mb-2 uppercase tracking-wider">Select Fund Holding</label>
            <div className="relative">
              <select
                value={selectedHoldingId}
                onChange={(e) => setSelectedHoldingId(e.target.value)}
                className="w-full appearance-none rounded border border-[#E5E5EA] px-4 py-3 text-sm text-[#1F1F1F] outline-none focus:border-[#274583] focus:ring-1 focus:ring-[#274583] bg-white transition-all hover:border-[#274583]/50"
              >
                {holdings.length > 0 ? (
                  holdings.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.fund_name} — {parseFloat(h.estimated_units).toFixed(4)} Units
                    </option>
                  ))
                ) : (
                  <option disabled value="">No active holdings found</option>
                )}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8E8E93] pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-[#8E8E93] uppercase tracking-wider mb-2">Redemption Amount (USD)</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">$</span>
              <input
                type="text"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full rounded border border-[#E5E5EA] pl-8 pr-4 py-3 text-sm font-semibold text-[#1F1F1F] outline-none focus:border-[#274583] focus:ring-1 focus:ring-[#274583] transition-all"
              />
            </div>
            {selectedHolding && (
              <div className="mt-2 space-y-1">
                <p className={`text-[10px] font-medium ${isOverLimit ? 'text-red-500' : 'text-[#274583]'}`}>
                  Maximum available: {formatCurrency(selectedHolding.revised_amount || selectedHolding.investment_amount)}
                </p>
                {isOverLimit && (
                  <p className="text-[10px] text-red-600 font-bold bg-red-50 p-2 rounded-md border border-red-100 animate-in fade-in slide-in-from-top-1">
                    Error: You cannot redeem more units ({unitsToRedeem.toFixed(4)}) than you currently hold ({parseFloat(selectedHolding.estimated_units).toFixed(4)}).
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="mt-6">
            <label className="block text-[11px] font-medium text-[#8E8E93] uppercase tracking-wider mb-2">Reason (Optional)</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              placeholder="Tell us why you are redeeming..."
              className="w-full resize-none rounded border border-[#E5E5EA] px-4 py-3 text-sm text-[#1F1F1F] outline-none focus:border-[#274583] focus:ring-1 focus:ring-[#274583] transition-all"
            />
          </div>

          <div className="mt-8 pt-8 border-t border-gray-50">
            <p className="text-sm font-bold text-[#1F1F1F] mb-4">Select Destination Bank</p>
            <div className="grid gap-4 md:grid-cols-2 text-xs">
              {bankAccounts.map((bank) => {
                const selected = bank.id === selectedBankId;
                return (
                  <button
                    key={bank.id}
                    type="button"
                    onClick={() => setSelectedBankId(bank.id)}
                    className={`flex w-full items-center justify-between rounded-xl border px-5 py-4 text-left transition-all ${
                      selected
                        ? 'border-2 border-[#274583] bg-[#274583]/[0.02] shadow-sm'
                        : 'border-[#E5E5EA] bg-white hover:border-[#274583]/30'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`h-2 w-2 rounded-full ${selected ? 'bg-[#274583]' : 'bg-gray-300'}`} />
                      <span className={`font-medium ${selected ? 'text-[#274583]' : 'text-[#4B4B4B]'}`}>{bank.label}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-white px-6 py-6 shadow-sm text-sm text-[#4B4B4B] h-fit sticky top-6">
          <h2 className="font-goudy text-[16px] text-[#1F1F1F] mb-4">Transaction Preview</h2>
          <div className="space-y-4 border-t border-[#F1F1F1] pt-6">
            <div className="flex items-center justify-between">
              <span className="text-[#8E8E93]">Units to be redeemed</span>
              <span className="font-bold text-[#1F1F1F]">{unitsToRedeem.toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 4 })}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#8E8E93]">Current NAV</span>
              <span className="font-bold text-[#1F1F1F]">{formatCurrency(currentNav)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#8E8E93]">Estimated payout date</span>
              <span className="font-bold text-[#1F1F1F]">{estimatedPayoutDate}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#8E8E93]">Service Fee</span>
              <span className="font-bold text-[#1F1F1F]">$0.00</span>
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-dashed border-[#E5E5EA] pt-4">
              <span className="font-bold text-[#1F1F1F]">Total Payout</span>
              <span className="text-xl font-bold text-[#274583]">
                {formatCurrency(totalPayout)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {renderFooter('Continue', { showBack: false, showCancel: true })}
    </>
  );

  const renderConfirmStep = () => (
    <>
      <div className="mb-6">
        <h1 className="font-goudy text-base sm:text-xl leading-[28px] text-[#1F1F1F]">Confirm Redemption</h1>
        <p className="mt-1 text-[11px] text-[#8E8E93]">
          Please review your request carefully. This action cannot be undone.
        </p>
      </div>

      <div className="rounded-2xl bg-white px-8 py-8 shadow-sm text-sm text-[#4B4B4B] max-w-3xl">
        <h2 className="font-goudy text-[18px] text-[#1F1F1F] mb-6">Redemption Summary</h2>
        
        <div className="grid gap-8 md:grid-cols-2">
          <div className="space-y-6">
            <div>
              <p className="text-[10px] text-[#8E8E93] uppercase tracking-wider mb-1">Fund Holding</p>
              <p className="text-base font-bold text-[#1F1F1F]">{selectedHolding?.fund_name}</p>
            </div>
            <div>
              <p className="text-[10px] text-[#8E8E93] uppercase tracking-wider mb-1">Requested Amount</p>
              <p className="text-base font-bold text-[#274583]">{formatCurrency(numericAmount)}</p>
            </div>
            <div>
              <p className="text-[10px] text-[#8E8E93] uppercase tracking-wider mb-1">Units Deduction</p>
              <p className="text-base font-bold text-[#1F1F1F]">{unitsToRedeem.toFixed(4)} Units</p>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <p className="text-[10px] text-[#8E8E93] uppercase tracking-wider mb-1">Destination Bank</p>
              <p className="text-base font-bold text-[#1F1F1F]">
                {bankAccounts.find(b => b.id === selectedBankId)?.label}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-[#8E8E93] uppercase tracking-wider mb-1">Current NAV</p>
              <p className="text-base font-bold text-[#1F1F1F]">{formatCurrency(currentNav)}</p>
            </div>
            {reason && (
              <div>
                <p className="text-[10px] text-[#8E8E93] uppercase tracking-wider mb-1">Reason</p>
                <p className="text-sm italic text-[#4B4B4B]">{reason}</p>
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 p-4 bg-yellow-50 border border-yellow-100 rounded-xl">
          <p className="text-xs text-yellow-800 leading-relaxed">
            <strong>Note:</strong> Redemptions are usually processed within 3-5 business days. You will receive an email notification once your request has been settled.
          </p>
        </div>
      </div>

      {renderFooter('Confirm & Submit', { showBack: true })}
    </>
  );

  const renderSubmittedModal = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-50 text-green-500">
          <CheckCircle2 className="h-10 w-10" />
        </div>
        
        <h2 className="font-goudy text-2xl text-[#1F1F1F] mb-2 font-bold">Request Submitted!</h2>
        <p className="mb-8 text-sm leading-relaxed text-[#8E8E93]">
          Your redemption request for <strong>{formatCurrency(numericAmount)}</strong> from <strong>{selectedHolding?.fund_name}</strong> has been received and is being processed.
        </p>

        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={() => router.push('/dashboard/redeem')}
            className="w-full rounded-full bg-[#1F3B6E] py-3 text-sm font-bold text-white shadow-lg hover:bg-[#162a50] transition-all"
          >
            Manage Requests
          </button>
          <button
            type="button"
            onClick={() => router.push('/dashboard')}
            className="w-full rounded-full bg-gray-50 py-3 text-sm font-bold text-[#4B4B4B] hover:bg-gray-100 transition-all font-helvetica"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-8xl px-4 py-8 font-helvetica">
        {step === 'amount' ? renderAmountStep() : renderConfirmStep()}
      </div>
      {step === 'submitted' && renderSubmittedModal()}
    </DashboardLayout>
  );
}
