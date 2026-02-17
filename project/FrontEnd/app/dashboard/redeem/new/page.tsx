'use client';

import { useMemo, useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';

 type Step = 'amount' | 'confirm' | 'submitted';

const bankAccounts = [
  {
    id: 'bank-1',
    label: 'Checking Account - ****1234',
  },
  {
    id: 'bank-2',
    label: 'Checking Account - ****1234',
  },
  {
    id: 'bank-3',
    label: 'Checking Account - ****1234',
  },
];

export default function RedemptionAmountPage() {
  const [step, setStep] = useState<Step>('amount');
  const [amount, setAmount] = useState('0.00');
  const [reason, setReason] = useState('');
  const [selectedBankId, setSelectedBankId] = useState<string | null>('bank-3');

  const numericAmount = useMemo(() => {
    const value = Number.parseFloat(amount.replace(/,/g, ''));
    return Number.isFinite(value) ? value : 0;
  }, [amount]);

  const unitsToRedeem = useMemo(() => {
    return numericAmount > 0 ? 1250 : 0;
  }, [numericAmount]);

  const currentNav = 8.0;
  const estimatedFees = 25;
  const totalPayout = useMemo(() => {
    return numericAmount - estimatedFees;
  }, [numericAmount]);

  const handleContinue = () => {
    if (step === 'amount') {
      setStep('confirm');
    } else if (step === 'confirm') {
      setStep('submitted');
    }
  };

  const handleBack = () => {
    if (step === 'confirm') {
      setStep('amount');
    }
  };

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
          className="rounded-full bg-[#FBCB4B] px-8 py-2 text-sm font-medium text-[#1F1F1F] hover:bg-[#F9B800] disabled:cursor-not-allowed disabled:opacity-60"
          disabled={step === 'amount' && numericAmount <= 0}
        >
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
          Please enter the amount you wish to redeem from your account.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,2.4fr)_minmax(0,1fr)]">
        <div className="rounded-2xl bg-white px-6 py-6 shadow-sm">
          <div>
            <label className="block text-[11px] font-medium text-[#8E8E93]">Amount</label>
            <input
              type="text"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="mt-2 w-full rounded border border-[#E5E5EA] px-3 py-2.5 text-sm text-[#1F1F1F] outline-none focus:border-[#274583] focus:ring-1 focus:ring-[#274583]"
            />
            <p className="mt-1 text-[10px] text-[#8E8E93]">Minimum investment: $2,000</p>
          </div>

          <div className="mt-6">
            <label className="block text-[11px] font-medium text-[#8E8E93]">Reason (Optional)</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              className="mt-2 w-full resize-none rounded border border-[#E5E5EA] px-3 py-2 text-sm text-[#1F1F1F] outline-none focus:border-[#274583] focus:ring-1 focus:ring-[#274583]"
            />
          </div>

          <div className="mt-6">
            <p className="text-md sm:text-[18px] font-medium text-[#4B4B4B]">Select Destination Bank</p>
            <p className="mt-1 text-[10px] text-[#8E8E93]">
              Choose a saved bank to receive your funds.
            </p>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {bankAccounts.map((bank) => {
                const selected = bank.id === selectedBankId;
                return (
                  <button
                    key={bank.id}
                    type="button"
                    onClick={() => setSelectedBankId(bank.id)}
                    className={`flex w-full items-center justify-between rounded-sm border px-4 py-5 text-left text-sm transition ${
                      selected
                        ? 'border-2 border-[#274583] bg-white shadow-sm'
                        : 'border-[#E5E5EA] bg-white hover:border-[#C7CEDA]'
                    }`}
                  >
                    <span className="text-[#1F1F1F]">{bank.label}</span>
                    <span
                      className={`inline-flex h-4 w-4 items-center justify-center rounded-full border ${
                        selected ? 'border-[#274583]' : 'border-[#D4D4D4]'
                      }`}
                    >
                      {selected && <span className="h-2.5 w-2.5 rounded-full bg-[#274583]" />}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-white px-6 py-5 shadow-sm text-sm text-[#4B4B4B]">
          <h2 className="font-goudy text-[16px] text-[#1F1F1F]">Transaction Preview</h2>
          <div className="mt-4 space-y-5 border-t border-[#F1F1F1] pt-4">
            <div className="flex items-center justify-between">
              <span>Units to be redeemed</span>
              <span className="font-semibold">{unitsToRedeem.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Current NAV</span>
              <span className="font-semibold">${currentNav.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Estimated payout date</span>
              <span className="font-semibold">Oct 28, 2025</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Estimated fees</span>
              <span className="font-semibold">${estimatedFees.toFixed(2)}</span>
            </div>
            <div className="mt-2 flex items-center justify-between border-t border-dashed border-[#E5E5EA] pt-3">
              <span>Total Payout</span>
              <span className="text-base font-semibold text-[#1F1F1F]">
                ${totalPayout.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>
      </div>

      {renderFooter('Continue', { showBack: true, showCancel: false })}
    </>
  );

  const renderConfirmStep = () => (
    <>
      <div className="mb-6">
        <h1 className="font-goudy text-base sm:text-xl leading-[28px] text-[#1F1F1F]">Redemption Amount</h1>
        <p className="mt-1 text-[11px] text-[#8E8E93]">
          Please review the details of your redemption below before submitting.
        </p>
      </div>

      <div className="rounded-2xl bg-white px-8 py-6 shadow-sm text-sm text-[#4B4B4B]">
        <h2 className="font-goudy text-[16px] text-[#1F1F1F]">Confirm Redemption Request</h2>
        <p className="mt-1 text-[11px] text-[#8E8E93]">
          Please review the details of your redemption below before submitting.
        </p>

        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <div className="space-y-5">
            <div>
              <p className="text-[11px] text-[#8E8E93]">Redemption Amount</p>
              <p className="text-sm font-semibold text-[#1F1F1F]">${numericAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            </div>
            <div>
              <p className="text-[11px] text-[#8E8E93]">Current NAV</p>
              <p className="text-sm font-semibold text-[#1F1F1F]">$108.45</p>
            </div>
            <div>
              <p className="text-[11px] text-[#8E8E93]">Expected Payout</p>
              <p className="text-sm font-semibold text-[#1F1F1F]">Feb 20–22, 2025</p>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <p className="text-[11px] text-[#8E8E93]">Units Redeemed</p>
              <p className="text-sm font-semibold text-[#1F1F1F]">92.18</p>
            </div>
            <div>
              <p className="text-[11px] text-[#8E8E93]">Destination Bank</p>
              <p className="text-sm font-semibold text-[#1F1F1F]">JPMorgan ••••1109</p>
            </div>
            <div>
              <p className="text-[11px] text-[#8E8E93]">Fees</p>
              <p className="text-sm font-semibold text-[#1F1F1F]">$0.00</p>
            </div>
          </div>
        </div>
      </div>

      {renderFooter('Submit Redemption', { showBack: true, showCancel: false })}
    </>
  );

  const renderSubmittedModal = () => (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/40">
      <div className="relative w-full max-w-md rounded-sm bg-white p-5 text-sm text-[#4B4B4B] shadow-lg">
        <button
          type="button"
          aria-label="Close"
          onClick={() => setStep('amount')}
          className="absolute right-5 top-4 text-2xl leading-none text-[#C4C4C4] hover:text-[#8E8E93]"
        >
          ×
        </button>

        <h2 className="font-goudy text-[16px] text-[#1F1F1F]">Redemption Submitted</h2>
        <p className="mt-1 text-xs font-helvetica leading-relaxed text-[#8E8E93]">
          Your redemption request has been received. You will get a confirmation email shortly.
        </p>
        <div className="mt-6 flex items-center justify-end gap-4">
          <button
            type="button"
            onClick={() => setStep('amount')}
            className="rounded-full bg-[#FFF3D6] px-6 py-2 text-sm font-medium text-[#4B4B4B] hover:bg-[#FFE7AF]"
          >
            Close
          </button>
          <button
            type="button"
            onClick={() => setStep('amount')}
            className="rounded-full bg-[#FBCB4B] px-7 py-2 text-sm font-medium text-[#1F1F1F] hover:bg-[#F9B800]"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );

  let content: JSX.Element;

  if (step === 'amount') {
    content = renderAmountStep();
  } else if (step === 'confirm') {
    content = renderConfirmStep();
  } else {
    content = renderAmountStep();
  }

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-8xl px-4 py-6 font-helvetica text-[#1F1F1F]">
        {content}
      </div>
      {step === 'submitted' && renderSubmittedModal()}
    </DashboardLayout>
  );
}
