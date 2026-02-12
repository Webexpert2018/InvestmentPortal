'use client';

import { DashboardLayout } from '@/components/DashboardLayout';

const todayNotifications = [
  {
    id: 1,
    title: 'New Investor Joined',
    time: '3h ago',
    description: 'A new investor has created an account and started the onboarding process. Review their profile.',
  },
  {
    id: 2,
    title: 'New Fund Request Submitted',
    time: '2h ago',
    description: 'Emily Zhou requested a $10,000 redemption from XYZ Fund.',
  },
  {
    id: 3,
    title: 'Investor Message Received',
    time: '2h ago',
    description: 'Mark Johnson: "Please check my K-1."',
  },
];

const yesterdayNotifications = [
  {
    id: 4,
    title: 'New Redemption Request',
    time: '6h ago',
    description: 'John Smith has submitted a new redemption request. Review the request and begin the verification process.',
  },
  {
    id: 5,
    title: 'New Fund Request Submitted',
    time: '6h ago',
    description: 'A new fund creation request has been submitted. Review the details and approve or reject the request.',
  },
];

export default function NotificationsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-0 font-sans">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#1F1F1F]">Notifications</h1>
          <p className="text-gray-500 mt-2">Stay up to date with investor activity.</p>
        </div>

        {/* Notifications Container with White Background */}
        <div className="bg-white rounded-xl shadow-sm p-8">
          {/* Today Section */}
          <div className="mb-8">
            <h2 className="text-sm font-semibold text-gray-900 mb-6">Today</h2>
            <div className="space-y-6">
              {todayNotifications.map((notification, index) => (
                <div key={notification.id}>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-1">
                      {notification.title}
                      <span className="text-xs font-normal text-gray-400 ml-1">
                        • {notification.time}
                      </span>
                    </h3>
                    <p className="text-sm text-gray-600">
                      {notification.description}
                    </p>
                  </div>
                  {index < todayNotifications.length - 1 && (
                    <div className="h-px bg-gray-200 mt-6" />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Divider between sections */}
          <div className="h-px bg-gray-200 mb-8" />

          {/* Yesterday Section */}
          <div>
            <h2 className="text-sm font-semibold text-gray-900 mb-6">Yesterday</h2>
            <div className="space-y-6">
              {yesterdayNotifications.map((notification, index) => (
                <div key={notification.id}>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-1">
                      {notification.title}
                      <span className="text-xs font-normal text-gray-400 ml-1">
                        • {notification.time}
                      </span>
                    </h3>
                    <p className="text-sm text-gray-600">
                      {notification.description}
                    </p>
                  </div>
                  {index < yesterdayNotifications.length - 1 && (
                    <div className="h-px bg-gray-200 mt-6" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-8 pb-6 text-center">
          <p className="text-xs text-gray-500">
            © 2022 All Rights Reserved, by
          </p>
          <p className="text-xs text-gray-500">
            Ovalia Capital.
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}
