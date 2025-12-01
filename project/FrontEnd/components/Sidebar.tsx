"use client";

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Wallet,
  ArrowUpDown,
  FileText,
  Building2,
  Users,
  Shield,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  Bitcoin,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/contexts/AuthContext';

interface MenuItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: string[];
}

const menuItems: MenuItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    roles: ['investor', 'admin', 'compliance'],
  },
  {
    title: 'Portfolio',
    href: '/dashboard/portfolio',
    icon: Wallet,
    roles: ['investor', 'admin'],
  },
  {
    title: 'Transactions',
    href: '/dashboard/transactions',
    icon: ArrowUpDown,
    roles: ['investor', 'admin'],
  },
  {
    title: 'Documents',
    href: '/dashboard/documents',
    icon: FileText,
    roles: ['investor', 'admin', 'compliance'],
  },
  {
    title: 'IRA Account',
    href: '/dashboard/ira-account',
    icon: Building2,
    roles: ['investor', 'admin'],
  },
  {
    title: 'User Management',
    href: '/admin/users',
    icon: Users,
    roles: ['admin'],
  },
  {
    title: 'Compliance',
    href: '/admin/compliance',
    icon: Shield,
    roles: ['admin', 'compliance'],
  },
  {
    title: 'Reports',
    href: '/admin/reports',
    icon: BarChart3,
    roles: ['admin', 'compliance'],
  },
  {
    title: 'Audit Logs',
    href: '/admin/audit-logs',
    icon: Shield,
    roles: ['admin'],
  },
  {
    title: 'Settings',
    href: '/dashboard/settings',
    icon: Settings,
    roles: ['investor', 'admin', 'compliance'],
  },
];

export function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    router.push('/auth/login');
  };

  const filteredMenuItems = menuItems.filter((item) =>
    item.roles.includes(user?.role || 'investor')
  );

  const SidebarContent = () => (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center border-b px-6">
        <Bitcoin className="h-8 w-8 text-orange-500" />
        <span className="ml-2 text-xl font-bold">Bitcoin IRA</span>
      </div>

      <div className="flex-1 overflow-y-auto py-4">
        <nav className="space-y-1 px-3">
          {filteredMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-orange-100 text-orange-900 dark:bg-orange-900 dark:text-orange-100'
                    : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
                )}
              >
                <Icon className="h-5 w-5" />
                {item.title}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="border-t p-4">
        <div className="mb-3 rounded-lg bg-gray-100 p-3 dark:bg-gray-800">
          <div className="text-xs text-gray-500 dark:text-gray-400">Logged in as</div>
          <div className="font-medium text-gray-900 dark:text-gray-100">
            {user?.firstName} {user?.lastName}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">{user?.email}</div>
          <div className="mt-1 inline-block rounded bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-800 dark:bg-orange-900 dark:text-orange-200">
            {user?.role}
          </div>
        </div>

        <Button
          variant="outline"
          className="w-full justify-start gap-2"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4" />
          Logout
        </Button>
      </div>
    </div>
  );

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed left-4 top-4 z-50 rounded-lg bg-white p-2 shadow-lg lg:hidden dark:bg-gray-800"
      >
        {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      <aside className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-64 lg:flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r bg-white dark:bg-gray-900">
          <SidebarContent />
        </div>
      </aside>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            onClick={() => setIsOpen(false)}
          />
          <aside className="fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-xl lg:hidden dark:bg-gray-900">
            <SidebarContent />
          </aside>
        </>
      )}
    </>
  );
}
