'use client';

import { DashboardLayout } from '@/components/DashboardLayout';
import { InvestorSettingsScreen } from '@/components/investor/InvestorSettingsScreen';
import { AccountantSettingsScreen } from '@/components/investor/AccountantSettingsScreen';
import { useAuth } from '@/lib/contexts/AuthContext';

export default function SettingsPage() {
  const { user } = useAuth();
  const role = user?.role?.trim().toLowerCase();
  
  // Define staff roles that should use the Accountant/Staff settings screen
  const staffRoles = [
    'admin', 
    'executive_admin', 
    'accountant', 
    'accountants',
    'fund_admin', 
    'investor_relations', 
    'relations_associate', 
    'partnership'
  ];
  
  const isStaff = staffRoles.includes(role || '');

  return (
    <DashboardLayout>
      {isStaff ? <AccountantSettingsScreen /> : <InvestorSettingsScreen />}
    </DashboardLayout>
  );
}
