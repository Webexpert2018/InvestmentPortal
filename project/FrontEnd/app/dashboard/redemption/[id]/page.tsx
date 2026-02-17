'use client';

import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/DashboardLayout';
import { ChevronLeft } from 'lucide-react';

const STATUS_STEPS = [
  {
    title: '1. Request Submitted',
    date: 'Feb 08, 2025 - 09:05 AM',
    state: 'done',
  },
  {
    title: '2. In Review',
    date: 'Feb 15, 2025 - 09:05 AM',
    state: 'active',
  },
  {
    title: '3. Approved by Admin',
    date: 'Feb 15, 2025 - 09:05 AM',
    state: 'pending',
  },
  {
    title: '4. Wire Initiated',
    date: 'Feb 15, 2025 - 09:05 AM',
    state: 'pending',
  },
  {
    title: '5. Settled',
    date: 'Feb 15, 2025 - 09:05 AM',
    state: 'pending',
  },
];

export default function RedemptionRequestDetailsPage({ params }: { params: { id: string } }) {
  const router = useRouter();

  const requestId = params.id || 'RED-123456';

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-8xl px-4 py-6 font-helvetica text-[#1F1F1F]">
        <button
          type="button"
          onClick={() => router.back()}
          className="mb-4 inline-flex items-center gap-2 text-xs text-[#4B4B4B] hover:text-[#1F1F1F]"
        >
          <ChevronLeft className="h-4 w-4" />
          Back
        </button>

        <h1 className="font-goudy text-sm sm:text-xl leading-[28px] text-[#1F1F1F]">
          Redemption Request Details
        </h1>
        <p className="mt-1 text-xs text-[#8E8E93]">Requested On: Jan 25, 2026</p>

        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1.2fr)]">
          <div className="rounded-2xl bg-white px-8 py-6 shadow-sm">
            <h2 className="font-goudy text-[16px] text-[#1F1F1F]">Status Tracker</h2>
            <div className="mt-4 flex">
              <div className="relative mr-4 flex flex-col items-center">
                <div className="h-4 w-4 rounded-full border border-[#FBCB4B] bg-white" />
                <div className="flex-1 w-px bg-[#FBCB4B]" />
              </div>
              <div className="flex-1 space-y-4">
                {STATUS_STEPS.map((step) => {
                  const isDone = step.state === 'done';
                  const isActive = step.state === 'active';
                  return (
                    <div key={step.title} className="flex items-start gap-4">
                      <div className="mt-1 flex h-4 w-4 items-center justify-center rounded-full border border-[#FBCB4B] bg-white">
                        {isDone && <span className="h-2 w-2 rounded-full bg-[#FBCB4B]" />}
                        {isActive && (
                          <span className="h-2 w-2 rounded-full border-2 border-[#FBCB4B] bg-white" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-[#1F1F1F]">{step.title}</p>
                        <p className="mt-1 text-[11px] text-[#8E8E93]">{step.date}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                className="rounded-full bg-[#FFF3D6] px-6 py-2 text-xs font-medium text-[#4B4B4B] hover:bg-[#FFE7AF]"
              >
                Download Confirmation
              </button>
              <button
                type="button"
                className="rounded-full bg-[#FFF3D6] px-6 py-2 text-xs font-medium text-[#4B4B4B] hover:bg-[#FFE7AF]"
              >
                Contact Support
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl bg-white px-8 py-6 shadow-sm text-sm text-[#4B4B4B]">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-goudy text-[16px] text-[#1F1F1F]">Req Details</h2>
                <span className="rounded-full bg-[#FFF7E0] px-4 py-1 text-[11px] font-medium text-[#C27A21]">
                  Pending
                </span>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-[11px] text-[#8E8E93]">Amount</p>
                  <p className="text-sm font-semibold text-[#1F1F1F]">$12,000.50</p>
                </div>
                <div>
                  <p className="text-[11px] text-[#8E8E93]">Units Redeemed</p>
                  <p className="text-sm font-semibold text-[#1F1F1F]">105.35</p>
                </div>
                <div>
                  <p className="text-[11px] text-[#8E8E93]">NAV at redemption</p>
                  <p className="text-sm font-semibold text-[#1F1F1F]">$113.95</p>
                </div>
                <div>
                  <p className="text-[11px] text-[#8E8E93]">Bank Name</p>
                  <p className="text-sm font-semibold text-[#1F1F1F]">
                    Metropolitan Commercial Bank
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-white px-8 py-6 shadow-sm text-sm text-[#4B4B4B]">
              <h2 className="font-goudy text-[16px] text-[#1F1F1F]">Documents</h2>
              <div className="mt-4 space-y-2 text-xs">
                {['Subscription Agreement', 'W-9 Form', 'Investor Questionnaire'].map((doc) => (
                  <button
                    key={doc}
                    type="button"
                    className="flex w-full items-center justify-between rounded-sm border border-[#FEE2E2] bg-[#FFF5F5] px-4 py-2 text-left text-[#B91C1C]"
                  >
                    <span>{doc}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
