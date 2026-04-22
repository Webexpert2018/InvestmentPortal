'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/DashboardLayout';
import { apiClient } from '@/lib/api/client';

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
  const earlierItems: NotificationItem[] = [];

  for (const n of notifications) {
    const d = new Date(n.created_at);
    const day = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    if (day.getTime() === today.getTime()) {
      todayItems.push(n);
    } else if (day.getTime() === yesterday.getTime()) {
      yesterdayItems.push(n);
    } else {
      earlierItems.push(n);
    }
  }

  const groups: GroupedNotifications[] = [];
  if (todayItems.length > 0) groups.push({ label: 'Today', items: todayItems });
  if (yesterdayItems.length > 0) groups.push({ label: 'Yesterday', items: yesterdayItems });
  if (earlierItems.length > 0) groups.push({ label: 'Earlier', items: earlierItems });
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
    <section className="rounded-[8px] bg-white">
      <div className="border-b border-[#ECEDEF] px-4 py-4">
        <h2 className="font-goudy text-[18px] leading-6 text-[#1F1F1F]">{label}</h2>
      </div>

      <div>
        {items.map((item, index) => (
          <div
            key={item.id}
            onClick={() => onMarkRead(item.id, item.link)}
            className={`px-4 py-4 cursor-pointer transition-colors ${item.is_read ? '' : 'bg-[#F8FAFF] hover:bg-[#EEF4FF]'}`}
          >
            <div className="flex items-start gap-3">
              {!item.is_read && (
                <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-[#3B6FF0]" />
              )}
              <div className="flex-1">
                <div className="flex items-center gap-1 text-[#1F1F1F]">
                  <h3 className="text-[18px] leading-6 font-medium">{item.title}</h3>
                  <span className="text-[12px] text-[#8E8E93]">• {formatTimeAgo(item.created_at)}</span>
                </div>
                <p className="mt-2 text-[14px] leading-6 text-[#8E8E93]">{item.description}</p>
              </div>
            </div>
            {index < items.length - 1 && <div className="mt-4 border-b border-[#ECEDEF]" />}
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
  const router = useRouter();

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
    try {
      const notification = notifications.find(n => n.id === id);
      if (notification && !notification.is_read) {
        await apiClient.markNotificationAsRead(id);
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
        );
      }
      if (link) {
        router.push(link);
      }
    } catch (err) {
      console.error('Failed to handle notification click:', err);
    }
  };

  const groups = groupNotifications(notifications);

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-8xl px-2 font-helvetica text-[#1F1F1F]">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-goudy text-[20px] leading-7 text-[#1F1F1F]">Notifications</h1>
            <p className="mt-1 text-[12px] text-[#8E8E93]">
              Updates on your account activity, documents, and investments.
            </p>
          </div>
          {notifications.some((n) => !n.is_read) && (
            <button
              onClick={async () => {
                const unread = notifications.filter((n) => !n.is_read);
                await Promise.all(unread.map((n) => apiClient.markNotificationAsRead(n.id)));
                setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
              }}
              className="text-[12px] text-[#3B6FF0] hover:underline"
            >
              Mark all as read
            </button>
          )}
        </div>

        <div className="mt-5 space-y-4">
          {loading ? (
            <div className="rounded-[8px] bg-white px-4 py-8 text-center text-[14px] text-[#8E8E93]">
              Loading notifications...
            </div>
          ) : error ? (
            <div className="rounded-[8px] bg-white px-4 py-8 text-center text-[14px] text-red-500">
              {error}
            </div>
          ) : groups.length === 0 ? (
            <div className="rounded-[8px] bg-white px-4 py-8 text-center text-[14px] text-[#8E8E93]">
              No notifications yet. They'll appear here when there's account activity.
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
