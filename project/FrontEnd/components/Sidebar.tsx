"use client";

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
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
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/contexts/AuthContext';

interface MenuItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: string[];
}

interface SidebarProps {
  isCollapsed: boolean;
  onToggleCollapse?: () => void;
  isOpen?: boolean;
  onToggle?: () => void;
}

const menuItems: MenuItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    roles: ['investor', 'admin', 'compliance'],
  },
  {
    title: 'Pipeline',
    href: '/dashboard/pipeline',
    icon: BarChart3,
    roles: ['investor', 'admin'],
  },
  {
    title: 'Investor',
    href: '/dashboard/investor',
    icon: Users,
    roles: ['investor', 'admin'],
  },
  {
    title: 'KYC Console',
    href: '/dashboard/kyc-console',
    icon: Shield,
    roles: ['investor', 'admin'],
  },
  {
    title: 'Funding Requests',
    href: '/dashboard/funding-requests',
    icon: Wallet,
    roles: ['investor', 'admin'],
  },
  {
    title: 'Redemption Req.',
    href: '/dashboard/redemption-requests',
    icon: ArrowUpDown,
    roles: ['investor', 'admin'],
  },
  {
    title: 'Reconciliation',
    href: '/dashboard/reconciliation',
    icon: FileText,
    roles: ['investor', 'admin'],
  },
  {
    title: 'NAV Management',
    href: '/dashboard/nav-management',
    icon: BarChart3,
    roles: ['investor', 'admin'],
  },
  {
    title: 'Funds',
    href: '/dashboard/funds',
    icon: Wallet,
    roles: ['investor', 'admin'],
  },
  {
    title: 'CRM & Bulk Ops',
    href: '/dashboard/crm-bulk-ops',
    icon: Users,
    roles: ['investor', 'admin'],
  },
  {
    title: 'Staff',
    href: '/dashboard/staff',
    icon: Users,
    roles: ['investor', 'admin'],
  },
  {
    title: 'Settings',
    href: '/dashboard/settings',
    icon: Settings,
    roles: ['investor', 'admin', 'compliance'],
  },
  // {
  //   title: 'User Management',
  //   href: '/admin/users',
  //   icon: Users,
  //   roles: ['admin'],
  // },
  // {
  //   title: 'Compliance',
  //   href: '/admin/compliance',
  //   icon: Shield,
  //   roles: ['admin', 'compliance'],
  // },
  // {
  //   title: 'Reports',
  //   href: '/admin/reports',
  //   icon: BarChart3,
  //   roles: ['admin', 'compliance'],
  // },
  // {
  //   title: 'Audit Logs',
  //   href: '/admin/audit-logs',
  //   icon: Shield,
  //   roles: ['admin'],
  // },
  
];

export function Sidebar({ isCollapsed, onToggleCollapse, isOpen = false, onToggle }: SidebarProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  // Use external state if provided, otherwise use internal state
  const isSidebarOpen = onToggle ? isOpen : internalIsOpen;
  const toggleSidebar = onToggle ? onToggle : () => setInternalIsOpen(!internalIsOpen);

  const handleLogout = () => {
    logout();
    router.push('/auth/login');
  };

  const handleMenuItemClick = () => {
    // Close sidebar on mobile when menu item is clicked
    if (isSidebarOpen) {
      toggleSidebar();
    }
  };

  const filteredMenuItems = menuItems.filter((item) =>
    item.roles.includes(user?.role || 'investor')
  );

 const SidebarContent = () => (
  <aside
    className={`fixed left-0 top-0 h-screen bg-[#F8F8F8] transition-all duration-300
    ${isCollapsed ? "w-20" : "w-[255px]"}
  `}
  >
    <div className="flex h-full flex-col border-b bg-white">

      {/* ================= LOGO SECTION ================= */}
      <div className="flex items-center justify-center h-20 border-b border-gray-200 px-3">
        <img
          src="/images/dashboard-logo.png"
          alt="Logo"
          className={`${isCollapsed ? "h-10" : "h-14"} object-contain`}
        />
      </div>

      {/* ================= MENU ================= */}
      <div className="flex-1 overflow-y-auto py-6 px-2">
        <nav className="space-y-3">

          {filteredMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href ||
              (item.href !== '/dashboard' &&
                pathname?.startsWith(item.href + '/'));

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={handleMenuItemClick}
                className={cn(
                  "flex items-center font-goudy justify-center rounded-full h-[45px] text-[16px] font-medium transition-all duration-200",
                  isActive
                    ? "bg-gradient-to-r from-[#FFC63F] to-[#F1DD58] text-gray-900"
                    : "bg-[#ECECEC] text-[#2F3A4C] hover:bg-gradient-to-r hover:from-[#FFC63F] hover:to-[#F1DD58] hover:text-gray-900",
                  !isCollapsed && "px-5 justify-start gap-3"
                )}
              >
                <Icon className="h-5 w-5 shrink-0" />
                {!isCollapsed && <span>{item.title}</span>}
              </Link>
            );
          })}

        </nav>
      </div>

      {/* ================= FOOTER ================= */}
<div className="border-t border-gray-200 px-4 py-6 font-helvetica">

  {/* Sign Out Button */}
  <button
  onClick={handleLogout}
  className={cn(
    "w-full rounded-full h-[50px] text-[14px] font-bold mx-auto transition-all duration-200 font-helvetica",
    "bg-[#FFF9EE] text-[#FFC63F] hover:bg-[#F3EAD7]",
    "flex items-center justify-center gap-2"
  )}
>
  {/* Left Icon */}
  <Image
    src="/images/sign_out.svg"
    alt="Sign Out"
    width={18}
    height={18}
    className="shrink-0"
  />

  {!isCollapsed && <span>Sign Out</span>}
</button>


  {/* Footer Text */}
  {!isCollapsed && (
    <div className="mt-6 text-center font-bold text-[12px] text-gray-400 leading-relaxed font-helvetica">
      © 2022 All Rights Reserved, by Ovalia Capital.
    </div>
  )}
</div>


    </div>
  </aside>
);


  return (
    <>
      {/* Mobile hamburger menu */}
      <button
        onClick={toggleSidebar}
        className="fixed left-4 top-4 z-50 rounded-lg bg-white p-2 shadow-lg lg:hidden dark:bg-gray-800"
        aria-label="Toggle menu"
      >
        {isSidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      {/* Desktop sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto">
          <SidebarContent />
        </div>
      </aside>

      {/* Mobile sidebar */}
      {isSidebarOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            onClick={toggleSidebar}
          />
          <aside className="fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-xl lg:hidden dark:bg-gray-900">
            <SidebarContent />
          </aside>
        </>
      )}
    </>
  );
}
