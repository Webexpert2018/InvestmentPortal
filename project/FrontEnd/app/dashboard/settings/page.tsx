'use client';

import { DashboardLayout } from '@/components/DashboardLayout';
import { InvestorSettingsScreen } from '@/components/investor/InvestorSettingsScreen';

export default function SettingsPage() {
  return (
    <DashboardLayout>
      <InvestorSettingsScreen />
    </DashboardLayout>
  );
}
