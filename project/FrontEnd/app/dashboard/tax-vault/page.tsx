'use client';

import { DashboardLayout } from '@/components/DashboardLayout';

export default function TaxVaultPage() {
  return (
    <DashboardLayout>
      <div className="space-y-4 font-helvetica text-[#1F1F1F]">
        <h1 className="font-goudy text-2xl">Tax Vault</h1>
        <p className="text-sm text-[#8E8E93]">
          Access tax-related documents and summaries for your Ovalia Capital accounts.
        </p>
      </div>
    </DashboardLayout>
  );
}
