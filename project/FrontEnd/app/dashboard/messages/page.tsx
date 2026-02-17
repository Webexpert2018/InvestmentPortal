'use client';

import { DashboardLayout } from '@/components/DashboardLayout';
import { AssignedInvestorsMessagesScreen } from '@/components/investor/AssignedInvestorsMessagesScreen';

export default function MessagesPage() {
  return (
    <DashboardLayout>
      <AssignedInvestorsMessagesScreen />
    </DashboardLayout>
  );
}
