'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/DashboardLayout';
import { apiClient } from '@/lib/api/client';
import { useAuth } from '@/lib/contexts/AuthContext';

type NotificationItem = {
  id: string;
  title: string;
  description: string;
  type: string;
  is_read: boolean;
  created_at: string;
  link?: string;
};

type GroupedNotifications = {
  label: string;
  items: NotificationItem[];
};

function formatTimeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);

  if (diffSec < 60) return `${diffSec}s ago`;
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  return `${Math.floor(diffHour / 24)}d ago`;
}

function groupNotifications(notifications: NotificationItem[]): GroupedNotifications[] {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);

  const todayItems: NotificationItem[] = [];
  const yesterdayItems: NotificationItem[] = [];
  const olderItems: NotificationItem[] = [];

  for (const n of notifications) {
    const d = new Date(n.created_at);
    const day = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    if (day.getTime() === today.getTime()) {
      todayItems.push(n);
    } else if (day.getTime() === yesterday.getTime()) {
      yesterdayItems.push(n);
    } else {
      olderItems.push(n);
    }
  }

  const groups: GroupedNotifications[] = [];
  if (todayItems.length > 0) groups.push({ label: 'Today', items: todayItems });
  if (yesterdayItems.length > 0) groups.push({ label: 'Yesterday', items: yesterdayItems });
  if (olderItems.length > 0) groups.push({ label: 'Old Notifications', items: olderItems });
  return groups;
}

function NotificationGroup({
  label,
  items,
  onMarkRead,
}: {
  label: string;
  items: NotificationItem[];
  onMarkRead: (id: string, link?: string) => void;
}) {
  return (
    <section className="overflow-hidden rounded-[12px] bg-white shadow-sm border border-[#ECEDEF]">
      <div className="bg-[#F8FAFF] px-6 py-4 border-b border-[#ECEDEF]">
        <h2 className="font-goudy text-[18px] font-medium text-[#1F1F1F]">{label}</h2>
      </div>

      <div className="divide-y divide-[#ECEDEF]">
        {items.map((item) => (
          <div
            key={item.id}
            onClick={() => onMarkRead(item.id, item.link)}
            className={`px-6 py-5 cursor-pointer transition-all hover:bg-[#F9FBFF] ${item.is_read ? 'opacity-80' : 'bg-white'}`}
          >
            <div className="flex items-start gap-4">
              {!item.is_read && (
                <div className="mt-2.5 h-2.5 w-2.5 shrink-0 rounded-full bg-[#3B6FF0] shadow-[0_0_8px_rgba(59,111,240,0.4)]" />
              )}
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className={`text-[17px] leading-6 ${item.is_read ? 'font-normal text-[#4A4A4A]' : 'font-semibold text-[#1F1F1F]'}`}>
                    {item.title}
                  </h3>
                  <span className="text-[12px] font-medium text-[#8E8E93] uppercase tracking-wider">
                    {formatTimeAgo(item.created_at)}
                  </span>
                </div>
                <p className={`mt-1.5 text-[14px] leading-relaxed ${item.is_read ? 'text-[#8E8E93]' : 'text-[#4A4A4A]'}`}>
                  {item.description}
                </p>
                {item.type === 'pipeline_reminder' && (
                  <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-[#FFF4E5] px-3 py-1 text-[11px] font-bold text-[#B35F00] uppercase tracking-tight">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#FF9500]" />
                    Reminder
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'unread' | 'viewed' | 'reminders'>('unread');
  const router = useRouter();
  const { user } = useAuth();

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiClient.getNotifications();
      setNotifications(data);
      setError(null);
    } catch (err: any) {
      setError('Failed to load notifications. Please try again.');
      console.error('Failed to fetch notifications:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleMarkRead = async (id: string, link?: string) => {
    // Optimistic UI update
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );

    try {
      const notification = notifications.find(n => n.id === id);
      if (notification && !notification.is_read) {
        await apiClient.markNotificationAsRead(id);
      }
    } catch (err) {
      console.error('Failed to handle notification mark as read:', err);
    }

    if (link) {
      router.push(link);
    }
  };

  const filteredNotifications = notifications.filter(n => {
    if (activeTab === 'unread') return !n.is_read;
    if (activeTab === 'viewed') return n.is_read;
    if (activeTab === 'reminders') return n.type === 'pipeline_reminder' || n.type === 'reminder';
    return true;
  });

  const groups = groupNotifications(filteredNotifications);

  const tabs = [
    { id: 'unread', label: 'Unread' },
    { id: 'viewed', label: 'Viewed' },
    ...(user?.role !== 'investor' ? [{ id: 'reminders', label: 'Reminders' }] : []),
  ] as any[];

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-8xl px-2 font-helvetica text-[#1F1F1F]">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-goudy text-[24px] leading-7 text-[#1F1F1F]">Notifications</h1>
            <p className="mt-1 text-[14px] text-[#8E8E93]">
              {user?.role === 'investor' 
                ? 'Stay updated on your account activity, documents, and investments.' 
                : 'Stay updated on account activity and scheduled reminders.'}
            </p>
          </div>
          {activeTab === 'unread' && notifications.some((n) => !n.is_read) && (
            <button
              onClick={async () => {
                // Optimistic UI
                setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
                try {
                  await apiClient.markAllNotificationsAsRead();
                } catch (err) {
                  console.error('Failed to mark all as read:', err);
                }
              }}
              className="rounded-full bg-[#F2F6FF] px-4 py-2 text-[13px] font-medium text-[#3B6FF0] transition hover:bg-[#E6EEFF]"
            >
              Mark all as read
            </button>
          )}
        </div>

        {/* Tab Switcher */}
        <div className="mt-8 flex border-b border-[#ECEDEF]">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative px-6 py-3 text-[15px] font-medium transition-colors ${activeTab === tab.id ? 'text-[#3B6FF0]' : 'text-[#8E8E93] hover:text-[#1F1F1F]'
                }`}
            >
              {tab.label}
              {tab.id === 'unread' && notifications.filter(n => !n.is_read).length > 0 && (
                <span className="ml-2 rounded-full bg-[#3B6FF0] px-2 py-0.5 text-[11px] text-white">
                  {notifications.filter(n => !n.is_read).length}
                </span>
              )}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 h-[2px] w-full bg-[#3B6FF0]" />
              )}
            </button>
          ))}
        </div>

        <div className="mt-6 space-y-6">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#3B6FF0] border-t-transparent" />
            </div>
          ) : error ? (
            <div className="rounded-[12px] border border-red-100 bg-red-50 p-6 text-center text-[14px] text-red-600">
              {error}
            </div>
          ) : groups.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-[12px] bg-white py-20 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#F8FAFF]">
                <svg className="h-8 w-8 text-[#3B6FF0]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </div>
              <h3 className="mt-4 text-[16px] font-medium text-[#1F1F1F]">No notifications here</h3>
              <p className="mt-1 text-[14px] text-[#8E8E93]">
                {activeTab === 'unread' ? "You're all caught up!" : "No notifications in this category yet."}
              </p>
            </div>
          ) : (
            groups.map((group) => (
              <NotificationGroup
                key={group.label}
                label={group.label}
                items={group.items}
                onMarkRead={handleMarkRead}
              />
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
