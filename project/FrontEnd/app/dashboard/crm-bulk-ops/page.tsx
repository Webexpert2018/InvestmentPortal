'use client';

import { DashboardLayout } from '@/components/DashboardLayout';

export default function CRMBulkOpsPage() {
  return (
    <DashboardLayout>
      <div className="p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">CRM & Bulk Ops</h1>
        </div>

        {/* Content Area - Currently Empty */}
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <p className="text-gray-500">Content coming soon...</p>
        </div>
      </div>
    </DashboardLayout>
  );
}
