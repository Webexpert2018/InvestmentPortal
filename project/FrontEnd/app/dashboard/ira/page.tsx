'use client';

import { DashboardLayout } from '@/components/DashboardLayout';

export default function IRAPage() {
  return (
    <DashboardLayout>
      <div className="space-y-4 font-helvetica text-[#1F1F1F]">
        <h1 className="font-goudy text-2xl">IRA</h1>
        <p className="text-sm text-[#8E8E93]">
          Manage your IRA-related investments and account information here.
        </p>
      </div>
    </DashboardLayout>
  );
}
