'use client';

import { DashboardLayout } from '@/components/DashboardLayout';

export default function DocumentVaultPage() {
  return (
    <DashboardLayout>
      <div className="space-y-4 font-helvetica text-[#1F1F1F]">
        <h1 className="font-goudy text-2xl">Document Vault</h1>
        <p className="text-sm text-[#8E8E93]">
          Securely view and manage all investment-related documents in one place.
        </p>
      </div>
    </DashboardLayout>
  );
}
