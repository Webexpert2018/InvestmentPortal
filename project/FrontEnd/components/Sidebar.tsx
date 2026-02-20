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

type AppRole = 'admin' | 'investor' | 'accountant' | 'compliance';

const normalizeRole = (role?: string | null): AppRole | null => {
  if (!role) return null;

  const normalized = role.trim().toLowerCase();

  if (normalized === 'accountants') {
    return 'accountant';
  }

  if (
    normalized === 'admin' ||
    normalized === 'investor' ||
    normalized === 'accountant' ||
    normalized === 'compliance'
  ) {
    return normalized;
  }

  return null;
};

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
    roles: ['investor', 'admin', 'accountant', 'compliance'],
  },
  {
    title: 'Portfolio',
    href: '/dashboard/portfolio',
    icon: Wallet,
    roles: ['investor'],
  },
  {
    title: 'Invest',
    href: '/dashboard/invest',
    icon: Wallet,
    roles: ['investor'],
  },
  {
    title: 'Redeem',
    href: '/dashboard/redeem',
    icon: ArrowUpDown,
    roles: ['investor'],
  },
  {
    title: 'IRA',
    href: '/dashboard/ira',
    icon: FileText,
    roles: ['investor'],
  },
  {
    title: 'Tax Vault',
    href: '/dashboard/tax-vault',
    icon: FileText,
    roles: ['investor'],
  },
  {
    title: 'Document Vault',
    href: '/dashboard/document-vault',
    icon: FileText,
    roles: ['investor'],
  },
  {
    title: 'Pipeline',
    href: '/dashboard/pipeline',
    icon: BarChart3,
    roles: ['admin'],
  },
  {
    title: 'Investor',
    href: '/dashboard/investor',
    icon: Users,
    roles: ['admin'],
  },
  {
    title: 'KYC Console',
    href: '/dashboard/kyc-console',
    icon: Shield,
    roles: ['admin', 'compliance'],
  },
  {
    title: 'Funding Requests',
    href: '/dashboard/funding-requests',
    icon: Wallet,
    roles: ['admin', 'accountant'],
  },
  {
    title: 'Redemption Req.',
    href: '/dashboard/redemption-requests',
    icon: ArrowUpDown,
    roles: ['admin', 'accountant'],
  },
  {
    title: 'Reconciliation',
    href: '/dashboard/reconciliation',
    icon: FileText,
    roles: ['admin', 'accountant'],
  },
  {
    title: 'NAV Management',
    href: '/dashboard/nav-management',
    icon: BarChart3,
    roles: ['admin', 'accountant'],
  },
  {
    title: 'Funds',
    href: '/dashboard/funds',
    icon: Wallet,
    roles: ['admin', 'accountant'],
  },
  {
    title: 'CRM & Bulk Ops',
    href: '/dashboard/crm-bulk-ops',
    icon: Users,
    roles: ['admin'],
  },
  {
    title: 'Staff',
    href: '/dashboard/staff',
    icon: Users,
    roles: ['admin'],
  },
  {
    title: 'Settings',
    href: '/dashboard/settings',
    icon: Settings,
    roles: ['investor', 'admin', 'accountant', 'compliance'],
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

const accountantMenu: MenuItem[] = [
  { title: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['accountant'] },
  { title: 'Assigned Investors', href: '/dashboard/assigned-investors', icon: Users, roles: ['accountant'] },
  { title: 'Messages', href: '/dashboard/messages', icon: FileText, roles: ['accountant'] },
  { title: 'Tax Vault', href: '/dashboard/tax-vault', icon: FileText, roles: ['accountant'] },
  { title: 'Settings', href: '/dashboard/settings', icon: Settings, roles: ['accountant'] },
];

export function Sidebar({ isCollapsed, onToggleCollapse, isOpen = false, onToggle }: SidebarProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, loading } = useAuth();

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

  // Wait for auth to load before deciding which menu to show
  if (loading) return null;

  const currentRole = normalizeRole(user?.role);

  let filteredMenuItems: MenuItem[] = [];
  if (currentRole === 'accountant') {
    filteredMenuItems = accountantMenu;
  } else {
    filteredMenuItems = menuItems.filter((item) => {
      if (!currentRole) return false;
      return item.roles.includes(currentRole);
    });
  }

 const SidebarContent = () => (
  <aside
    className={`fixed left-0 top-0 h-screen bg-[#F8F8F8] transition-all duration-300
    ${isCollapsed ? "w-20" : "w-[255px]"}
  `}
  >
    <div className="flex h-full flex-col border-b bg-white">

      {/* ================= LOGO SECTION ================= */}
      <div className="flex items-center justify-center border-b border-r border-[#EEEEEE] px-3 dashboard-logo-container">
        <img
          src="/images/dashboard-logo.png"
          alt="Logo"
          className={`${isCollapsed ? "h-[70px]" : "h-[70px]"} object-contain`}
        />
      </div>

      {/* ================= MENU ================= */}
      <div className="flex-1 overflow-y-auto py-3 px-3 border-r border-[#EEEEEE]">
        <nav className="space-y-2">

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
                  "group relative flex items-center font-goudy justify-center rounded-full h-[40px] text-[15px] font-medium transition-all duration-200 overflow-hidden",
                  "bg-[#ECECEC]",
                  !isCollapsed && "px-5 justify-start",
                )}
              >
                <span
                  className={cn(
                    "absolute inset-0 bg-gradient-to-r from-[#FFC63F] to-[#F1DD58] transition-transform duration-300",
                    isActive ? "translate-x-0" : "-translate-x-full group-hover:translate-x-0"
                  )}
                />

                <span className={cn("relative z-10 flex items-center", !isCollapsed && "gap-3", isActive ? "text-gray-900" : "text-[#2F3A4C] group-hover:text-gray-900") }>
                  <Icon className="h-5 w-5 shrink-0" />
                  {!isCollapsed && <span>{item.title}</span>}
                </span>
              </Link>
            );
          })}

        </nav>
      </div>

      {/* ================= FOOTER changes ================= */}
  <div className="border-t border-[#EEEEEE] px-4 py-4 font-helvetica">

  {/* Sign Out Button */}
  <button
  onClick={handleLogout}
  className={cn(
    "w-full rounded-full h-[40px] text-[14px] font-bold mx-auto transition-all duration-200 font-helvetica",
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
    <div className="mt-2 text-center font-bold text-[12px] text-[#4B4B4B] leading-relaxed font-helvetica">
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
        onClick={toggleSidebar} style={{top:"15px"}}
        className="fixed left-4 z-50 rounded-sm bg-white p-2 shadow-sm lg:hidden dark:bg-gray-800"
        aria-label="Toggle menu"
      >
        <img
          src="/images/menu-icon.svg"
          alt="Menu"
          className="h-6 w-6"
        />
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
