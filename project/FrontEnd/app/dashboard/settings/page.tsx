'use client';

import { DashboardLayout } from '@/components/DashboardLayout';
import { InvestorSettingsScreen } from '@/components/investor/InvestorSettingsScreen';
import { AccountantSettingsScreen } from '@/components/investor/AccountantSettingsScreen';
import { useAuth } from '@/lib/contexts/AuthContext';

export default function SettingsPage() {
  const { user } = useAuth();
  const role = user?.role?.trim().toLowerCase();
  const isAccountant = role === 'accountant' || role === 'accountants';

  return (
    <DashboardLayout>
      {isAccountant ? <AccountantSettingsScreen /> : <InvestorSettingsScreen />}
    </DashboardLayout>
  );
}
