'use client';

import { useMemo, useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';

type Step =
  | 'chooseFund'
  | 'fundingAccount'
  | 'investmentAmount'
  | 'signDocuments'
  | 'fundingInstructions'
  | 'investmentStatus';

const funds = [
  {
    id: 'physician-btc-a',
    name: 'Strive Enterprise Fund',
    image: '/images/strive_funds.jpg',
  },
  {
    id: 'physician-btc-b',
    name: 'Strive Enterprise Fund',
    image: '/images/strive_funds.jpg',
  },
  {
    id: 'physician-btc-c',
    name: 'Strive Enterprise Fund',
    image: '/images/strive_funds.jpg',
  },
  {
    id: 'physician-btc-d',
    name: 'Strive Enterprise Fund',
    image: '/images/strive_funds.jpg',
  },
  {
    id: 'physician-btc-e',
    name: 'Strive Enterprise Fund',
    image: '/images/strive_funds.jpg',
  },
];

const accounts = [
  {
    id: 'personal',
    label: 'Personal Account',
    value: '•••• 1234 · Checking',
  },
  {
    id: 'traditional-ira',
    label: 'Traditional IRA',
    value: 'Fidelity · •••• 5678',
  },
  {
    id: 'roth-ira',
    label: 'Roth IRA',
    value: 'Charles Schwab · •••• 9012',
  },
];

type FooterOptions = {
  primaryLabel?: string;
  showBack?: boolean;
};

export default function InvestPage() {
  const [step, setStep] = useState<Step>('chooseFund');
  const [selectedFundId, setSelectedFundId] = useState<string | null>(funds[0]?.id ?? null);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [amount, setAmount] = useState<string>('25000');

  const { investmentAmount, processingFee, total } = useMemo(() => {
    const numeric = Number.parseFloat(amount.replace(/,/g, '')) || 0;
    const fee = numeric * 0.005;
    return {
      investmentAmount: numeric,
      processingFee: fee,
      total: numeric + fee,
    };
  }, [amount]);

  const goBack = () => {
    setStep((current) => {
      switch (current) {
        case 'fundingAccount':
          return 'chooseFund';
        case 'investmentAmount':
          return 'fundingAccount';
        case 'signDocuments':
          return 'investmentAmount';
        case 'fundingInstructions':
          return 'signDocuments';
        case 'investmentStatus':
          return 'fundingInstructions';
        default:
          return current;
      }
    });
  };

  const goNext = () => {
    setStep((current) => {
      switch (current) {
        case 'chooseFund':
          return 'fundingAccount';
        case 'fundingAccount':
          return 'investmentAmount';
        case 'investmentAmount':
          return 'signDocuments';
        case 'signDocuments':
          return 'fundingInstructions';
        case 'fundingInstructions':
          return 'investmentStatus';
        default:
          return current;
      }
    });
  };

  const renderFooter = (options: FooterOptions = {}) => {
    const { primaryLabel = 'Continue', showBack = true } = options;

    return (
      <div className="mt-16 flex items-center justify-between border-t border-[#E5E5EA] pt-6">
        <button
          type="button"
          className="rounded-full bg-[#FFF3D6] px-5 py-2 text-sm font-medium text-[#4B4B4B] hover:bg-[#FFE7AF]"
        >
          Cancel
        </button>
        <div className="flex items-center gap-3">
          {showBack && (
            <button
              type="button"
              onClick={goBack}
              className="rounded-full bg-[#FFF3D6] px-5 py-2 text-sm font-medium text-[#4B4B4B] hover:bg-[#FFE7AF]"
            >
              Back
            </button>
          )}
          <button
            type="button"
            onClick={goNext}
            className="rounded-full bg-[#FBCB4B] px-6 py-2 text-sm font-medium text-[#1F1F1F] hover:bg-[#F9B800] disabled:cursor-not-allowed disabled:opacity-60"
            disabled={
              (step === 'chooseFund' && !selectedFundId) ||
              (step === 'fundingAccount' && !selectedAccountId) ||
              (step === 'investmentAmount' && investmentAmount <= 0)
            }
          >
            {primaryLabel}
          </button>
        </div>
      </div>
    );
  };

  const renderChooseFund = () => (
    <>
      <div className="mb-6">
        <h1 className="font-goudy text-sm sm:text-xl font-bold leading-[32px] text-[#1F1F1F]">
          Choose a Fund
        </h1>
        <p className="mt-2 text-sm text-[#8E8E93]">
          Select the fund you would like to invest in.
          You will complete your investment steps on text next screens.
        </p>
      </div>

      <div className="rounded-2xl bg-white px-6 py-6 shadow-sm">
        <div className="grid gap-6 md:grid-cols-2">
          {funds.map((fund) => {
            const selected = fund.id === selectedFundId;
            return (
              <button
                key={fund.id}
                type="button"
                onClick={() => setSelectedFundId(fund.id)}
                className={`flex w-full items-center rounded-sm bg-[#F7F8FA] px-6 py-6 text-left transition hover:bg-[#F1F2F5] ${
                  selected ? 'ring-2 ring-[#274583] ring-offset-2 ring-offset-white' : ''
                }`}
              >
                <img
                  src={fund.image}
                  alt={fund.name}
                  className="mr-6 h-24 w-40 rounded-lg object-cover"
                />
                <div>
                  <h3 className="font-goudy text-sm sm:text-xl font-bold leading-[32px] text-[#1F1F1F]">
                    {fund.name}
                  </h3>
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            className="rounded-full bg-[#FFF3D6] px-5 py-2 text-sm font-medium text-[#4B4B4B] hover:bg-[#FFE7AF]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={goNext}
            className="rounded-full bg-[#FBCB4B] px-6 py-2 text-sm font-medium text-[#1F1F1F] hover:bg-[#F9B800] disabled:cursor-not-allowed disabled:opacity-60"
            disabled={!selectedFundId}
          >
            Invest Now
          </button>
        </div>
      </div>
    </>
  );

  const renderFundingAccount = () => (
    <>
      <div className="mb-6">
        <h1 className="font-goudy text-[30px] font-bold leading-[38px] text-[#1F1F1F]">
          Select Funding Account
        </h1>
        <p className="mt-2 text-sm text-[#8E8E93]">
          Choose the account you want to invest from.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {accounts.map((account) => {
          const selected = account.id === selectedAccountId;
          return (
            <button
              key={account.id}
              type="button"
              onClick={() => setSelectedAccountId(account.id)}
              className={`flex w-full flex-col items-start rounded-2xl bg-white px-6 py-5 text-left shadow-sm transition hover:shadow-md ${
                selected ? 'ring-2 ring-[#274583] ring-offset-2 ring-offset-[#F4F5F7]' : ''
              }`}
            >
              <div className="flex w-full items-center justify-between">
                <p className="text-sm font-semibold text-[#1F1F1F]">{account.label}</p>
                <span
                  className={`inline-flex h-4 w-4 items-center justify-center rounded-full border ${
                    selected ? 'border-[#274583]' : 'border-[#D4D4D4]'
                  }`}
                >
                  {selected && <span className="h-2.5 w-2.5 rounded-full bg-[#274583]" />}
                </span>
              </div>
              <p className="mt-2 text-xs text-[#8E8E93]">{account.value}</p>
            </button>
          );
        })}
      </div>

      {renderFooter()}
    </>
  );

  const renderInvestmentAmount = () => (
    <>
      <div className="mb-6">
        <h1 className="font-goudy text-[30px] font-bold leading-[38px] text-[#1F1F1F]">
          Investment Amount
        </h1>
        <p className="mt-2 text-sm text-[#8E8E93]">Specify how much you&apos;d like to invest.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,2.3fr)_minmax(0,1fr)]">
        <div className="space-y-6">
          <div className="rounded-2xl bg-white px-6 py-5 shadow-sm">
            <label className="block text-xs font-medium uppercase tracking-wide text-[#A0A0A0]">
              Amount
            </label>
            <div className="mt-3">
              <input
                type="text"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full rounded-lg border border-[#E5E5EA] bg-white px-4 py-2.5 text-sm text-[#1F1F1F] outline-none focus:border-[#274583] focus:ring-1 focus:ring-[#274583]"
              />
              <p className="mt-2 text-xs text-[#8E8E93]">Minimum investment: $10,000</p>
            </div>
          </div>

          <div className="rounded-2xl bg-white px-6 py-5 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-[#A0A0A0]">
              Estimated Units You Will Receive
            </p>
            <div className="mt-4 grid gap-8 md:grid-cols-2">
              <div>
                <p className="text-sm text-[#8E8E93]">Unit Price</p>
                <p className="mt-1 text-lg font-semibold text-[#1F1F1F]">$1.25</p>
              </div>
              <div>
                <p className="text-sm text-[#8E8E93]">Estimated Units</p>
                <p className="mt-1 text-lg font-semibold text-[#1F1F1F]">40,000 units</p>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-white px-6 py-5 shadow-sm">
          <h2 className="font-goudy text-base text-[#1F1F1F]">Order Summary</h2>
          <div className="mt-4 space-y-3 text-sm text-[#4B4B4B]">
            <div className="flex items-center justify-between">
              <span>Investment Amount:</span>
              <span className="font-semibold">
                $
                {investmentAmount.toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Processing Fee (0.5%):</span>
              <span className="font-semibold">
                $
                {processingFee.toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-dashed border-[#E5E5EA] pt-3">
              <span>Total</span>
              <span className="text-base font-semibold text-[#2BB673]">
                $
                {total.toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
          </div>
        </div>
      </div>

      {renderFooter()}
    </>
  );

  const renderSignDocuments = () => (
    <>
      <div className="mb-6">
        <h1 className="font-goudy text-[30px] font-bold leading-[38px] text-[#1F1F1F]">
          Sign Subscription Documents
        </h1>
        <p className="mt-2 text-sm text-[#8E8E93]">
          Review the key documents for this investment and sign to continue.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between text-xs text-[#8E8E93]">
            <span>Quarterly Statement Q4 2025</span>
            <span>1 of 12</span>
          </div>
          <div className="flex gap-4">
            <div className="flex w-24 flex-col gap-3 text-center text-[10px] text-[#8E8E93]">
              {[1, 2, 3, 4].map((page) => (
                <div
                  key={page}
                  className={`flex h-20 items-center justify-center rounded border border-[#E5E5EA] bg-[#F7F8FA] ${
                    page === 1 ? 'ring-2 ring-[#274583]' : ''
                  }`}
                >
                  Page {page}
                </div>
              ))}
            </div>
            <div className="flex-1 rounded border border-[#E5E5EA] bg-[#F9FAFB]" />
          </div>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="font-goudy text-base text-[#1F1F1F]">Your Document</h2>
          <p className="mt-2 text-xs text-[#8E8E93]">
            Please review and sign the documents below, then click &quot;Start Signing&quot; to begin.
          </p>
          <div className="mt-4 space-y-2 text-sm">
            {['Subscription Agreement', 'W-9 Form', 'Investor Questionnaire'].map((label) => (
              <button
                key={label}
                type="button"
                className="flex w-full items-center justify-between rounded-lg border border-[#F3F4F6] bg-[#FFF9F0] px-4 py-2 text-left text-[#1F1F1F]"
              >
                <span>{label}</span>
              </button>
            ))}
          </div>
          <button
            type="button"
            className="mt-6 w-full rounded-full bg-[#FFF3D6] py-2 text-sm font-medium text-[#C28C3B] hover:bg-[#FFE7AF]"
          >
            Start Signing
          </button>
          <button
            type="button"
            className="mt-3 w-full rounded-full bg-white py-2 text-sm font-medium text-[#1F1F1F] ring-1 ring-[#E5E5EA] hover:bg-[#F9FAFB]"
          >
            Download Document (PDF)
          </button>
        </div>
      </div>

      {renderFooter()}
    </>
  );

  const renderFundingInstructions = () => (
    <>
      <div className="mb-6">
        <h1 className="font-goudy text-[30px] font-bold leading-[38px] text-[#1F1F1F]">
          Funding Instructions
        </h1>
        <p className="mt-2 text-sm text-[#8E8E93]">
          Send funds via wire/ACH to complete your investment.
        </p>
      </div>

      <div className="rounded-2xl bg-white px-8 py-6 shadow-sm text-sm text-[#4B4B4B]">
        <p>
          The PhysicianBTC Fund provides exposure to institutional-grade Bitcoin strategies designed
          specifically for physicians and medical professionals.
        </p>
        <ul className="mt-4 list-disc pl-6">
          <li>Long-term BTC exposure</li>
          <li>Optimized for tax-advantaged accounts</li>
          <li>Low operational friction</li>
        </ul>
        <p className="mt-4 font-semibold">Fees:</p>
        <ul className="mt-1 list-disc pl-6">
          <li>Management Fee: 2%</li>
          <li>Performance Fee: 20%</li>
        </ul>
        <p className="mt-4 font-semibold">Documents:</p>
        <ul className="mt-1 list-disc pl-6">
          <li>PPM Download</li>
          <li>Fact Sheet</li>
          <li>Risk Disclosure</li>
        </ul>
      </div>

      {renderFooter()}
    </>
  );

  const renderInvestmentStatus = () => (
    <>
      <div className="mb-6">
        <h1 className="font-goudy text-[30px] font-bold leading-[38px] text-[#1F1F1F]">
          Investment Status
        </h1>
        <p className="mt-2 text-sm text-[#8E8E93]">Track your investment through each stage.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="rounded-2xl bg-white px-8 py-6 shadow-sm">
          <div className="relative">
            <div className="absolute left-3 top-4 bottom-4 w-px bg-[#E5E5EA]" />
            <div className="space-y-4">
              {[
                {
                  title: 'Subscription Submitted',
                  subtitle: 'Completed on Oct 12, 2025',
                  state: 'done',
                },
                {
                  title: 'Document Signed',
                  subtitle: 'Completed on Oct 14, 2025',
                  state: 'done',
                },
                {
                  title: 'Awaiting Funding',
                  subtitle: 'Action required: please upload proof of payment to proceed.',
                  state: 'active',
                },
                {
                  title: 'Funds Received',
                  subtitle: 'Pending',
                  state: 'pending',
                },
                {
                  title: 'Units Issued',
                  subtitle: 'Pending',
                  state: 'pending',
                },
              ].map((item) => {
                const isDone = item.state === 'done';
                const isActive = item.state === 'active';
                return (
                  <div key={item.title} className="flex items-start gap-4">
                    <div className="mt-1 flex h-4 w-4 items-center justify-center rounded-full border border-[#FBCB4B] bg-white">
                      {isDone && <span className="h-2 w-2 rounded-full bg-[#FBCB4B]" />}
                      {isActive && (
                        <span className="h-2 w-2 rounded-full border-2 border-[#FBCB4B] bg-white" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[#1F1F1F]">{item.title}</p>
                      <p className="mt-1 text-xs text-[#8E8E93]">{item.subtitle}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-[#E5E5EA] bg-white px-8 py-6 shadow-sm">
          <div className="pb-3 border-b border-[#E5E5EA]">
            <h2 className="font-goudy text-base text-[#1F1F1F]">Quick Actions</h2>
          </div>
          <div className="pt-4 space-y-3">
            <button
              type="button"
              className="w-full rounded-full bg-[#FFF3D6] py-2 text-sm font-medium text-[#1F1F1F] hover:bg-[#FFE7AF]"
            >
              View Document
            </button>
            <button
              type="button"
              className="w-full rounded-full bg-[#FFF3D6] py-2 text-sm font-medium text-[#1F1F1F] hover:bg-[#FFE7AF]"
            >
              Contact Support
            </button>
          </div>
        </div>
      </div>

      {renderFooter({ primaryLabel: 'Done' })}
    </>
  );

  let content: JSX.Element;

  switch (step) {
    case 'chooseFund':
      content = renderChooseFund();
      break;
    case 'fundingAccount':
      content = renderFundingAccount();
      break;
    case 'investmentAmount':
      content = renderInvestmentAmount();
      break;
    case 'signDocuments':
      content = renderSignDocuments();
      break;
    case 'fundingInstructions':
      content = renderFundingInstructions();
      break;
    case 'investmentStatus':
      content = renderInvestmentStatus();
      break;
    default:
      content = renderChooseFund();
  }

  return (
    <DashboardLayout>
      <div className="space-y-4 font-helvetica text-[#1F1F1F]">{content}</div>
    </DashboardLayout>
  );
}
