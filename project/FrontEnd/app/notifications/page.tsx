'use client';

import { DashboardLayout } from '@/components/DashboardLayout';

type NotificationItem = {
  id: string;
  title: string;
  time: string;
  description: string;
};

const todayNotifications: NotificationItem[] = [
  {
    id: 't-1',
    title: 'New Investor Joined',
    time: '2s ago',
    description: 'A new investor has created an account and started the onboarding process. Review their profile.',
  },
  {
    id: 't-2',
    title: 'New Fund Request Submitted',
    time: '2h ago',
    description: 'Emily Zhou requested a $10,000 redemption from XYZ Fund.',
  },
  {
    id: 't-3',
    title: 'Investor Message Received',
    time: '2h ago',
    description: 'Mark Johnson: "Please check my K-1."',
  },
];

const yesterdayNotifications: NotificationItem[] = [
  {
    id: 'y-1',
    title: 'New Redemption Request',
    time: '15h ago',
    description: 'John Smith has submitted a new redemption request. Review the request and begin the verification process.',
  },
  {
    id: 'y-2',
    title: 'New Fund Request Submitted',
    time: '20h ago',
    description: 'A new fund creation request has been submitted. Review the details and approve or reject the request.',
  },
];

function NotificationGroup({
  title,
  items,
}: {
  title: string;
  items: NotificationItem[];
}) {
  return (
    <section className="rounded-[8px] bg-white">
      <div className="border-b border-[#ECEDEF] px-4 py-4">
        <h2 className="font-goudy text-[18px] leading-6 text-[#1F1F1F]">{title}</h2>
      </div>

      <div>
        {items.map((item, index) => (
          <div key={item.id} className="px-4 py-4">
            <div className="flex items-center gap-1 text-[#1F1F1F]">
              <h3 className="text-[18px] leading-6 font-medium">{item.title}</h3>
              <span className="text-[12px] text-[#8E8E93]">• {item.time}</span>
            </div>
            <p className="mt-2 text-[14px] leading-6 text-[#8E8E93]">{item.description}</p>
            {index < items.length - 1 && <div className="mt-4 border-b border-[#ECEDEF]" />}
          </div>
        ))}
      </div>
    </section>
  );
}

export default function NotificationsPage() {
  return (
    <DashboardLayout>
      <div className="mx-auto max-w-8xl px-2 font-helvetica text-[#1F1F1F]">
        <div>
          <h1 className="font-goudy text-[20px] leading-7 text-[#1F1F1F]">Notifications</h1>
          <p className="mt-1 text-[12px] text-[#8E8E93]">
            Updates on your account activity, documents, and investments.
          </p>
        </div>

        <div className="mt-5 space-y-4">
          <NotificationGroup title="Today" items={todayNotifications} />
          <NotificationGroup title="Yesterday" items={yesterdayNotifications} />
        </div>
      </div>
    </DashboardLayout>
  );
}
