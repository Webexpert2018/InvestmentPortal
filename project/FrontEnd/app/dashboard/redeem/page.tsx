'use client';

import { DashboardLayout } from '@/components/DashboardLayout';

export default function RedeemPage() {
  return (
    <DashboardLayout>
      <div className="space-y-4 font-helvetica text-[#1F1F1F]">
        <h1 className="font-goudy text-2xl">Redeem</h1>
        <p className="text-sm text-[#8E8E93]">
          This section will show your redemption options and requests.
        </p>
      </div>
    </DashboardLayout>
  );
}
