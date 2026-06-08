"use client";

import { useAuth } from "@/lib/contexts/AuthContext";
import { Sidebar } from "@/components/Sidebar";
import { DashboardHeader } from "@/components/DashboardHeader";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const normalizeRole = (role?: string | null): string | null => {
  if (!role) return null;

  const normalized = role.trim().toLowerCase();

  if (normalized === 'accountants') {
    return 'accountant';
  }

  const validRoles = ['admin', 'executive_admin', 'fund_admin', 'investor_relations', 'investor', 'accountant', 'compliance'];
  if (validRoles.includes(normalized)) {
    return normalized;
  }

  return null;
};

const isRouteAuthorized = (pathname: string, userRole: string | null | undefined): boolean => {
  const role = normalizeRole(userRole);
  if (!role) return false;

  // 1. Root /dashboard is always allowed for all logged-in roles
  if (pathname === '/dashboard') {
    return true;
  }

  // 2. Exact or subpath match of Sidebar items

  // --- Investor Only Sections ---
  if (
    pathname === '/dashboard/portfolio' || pathname.startsWith('/dashboard/portfolio/') ||
    pathname === '/dashboard/invest' || pathname.startsWith('/dashboard/invest/') ||
    pathname === '/dashboard/redeem' || pathname.startsWith('/dashboard/redeem/') ||
    pathname === '/dashboard/ira' || pathname.startsWith('/dashboard/ira/') ||
    pathname === '/dashboard/document-vault' || pathname.startsWith('/dashboard/document-vault/') ||
    pathname === '/dashboard/kyc-verification'
  ) {
    return role === 'investor';
  }

  // --- KYC Verification detail page for admin/staff ---
  if (pathname.startsWith('/dashboard/kyc-verification/')) {
    return role === 'admin' || role === 'executive_admin' || role === 'compliance';
  }

  // --- Accountant Only Sections ---
  if (pathname === '/dashboard/assigned-investors' || pathname.startsWith('/dashboard/assigned-investors/')) {
    return role === 'accountant';
  }

  // --- Tax Vault (Shared between Investor and Accountant) ---
  if (pathname === '/dashboard/tax-vault' || pathname.startsWith('/dashboard/tax-vault/')) {
    return role === 'investor' || role === 'accountant';
  }

  // --- Pipeline (Admin, Executive Admin, Investor Relations) ---
  if (pathname === '/dashboard/pipeline' || pathname.startsWith('/dashboard/pipeline/')) {
    return role === 'admin' || role === 'executive_admin' || role === 'investor_relations';
  }

  // --- Investor Management (Admin, Executive Admin, Accountant for Profile Details) ---
  if (pathname === '/dashboard/investor' || pathname.startsWith('/dashboard/investor/')) {
    if (pathname === '/dashboard/investor') {
      return role === 'admin' || role === 'executive_admin';
    }
    // Subpaths of investor (like /dashboard/investor/[id]) are allowed for admin roles + accountant
    return role === 'admin' || role === 'executive_admin' || role === 'accountant';
  }

  // --- KYC Console (Admin, Executive Admin, Compliance) ---
  if (pathname === '/dashboard/kyc-console' || pathname.startsWith('/dashboard/kyc-console/')) {
    return role === 'admin' || role === 'executive_admin' || role === 'compliance';
  }

  // --- Funding Requests (Admin, Executive Admin, Fund Admin, Accountant) ---
  if (pathname === '/dashboard/funding-requests' || pathname.startsWith('/dashboard/funding-requests/')) {
    return role === 'admin' || role === 'executive_admin' || role === 'fund_admin';
  }

  // --- Redemption Requests (Admin, Executive Admin, Fund Admin, Accountant) ---
  if (pathname === '/dashboard/redemption-requests' || pathname.startsWith('/dashboard/redemption-requests/')) {
    return role === 'admin' || role === 'executive_admin' || role === 'fund_admin';
  }

  // --- Reconciliation (Admin, Executive Admin, Fund Admin, Accountant) ---
  if (pathname === '/dashboard/reconciliation' || pathname.startsWith('/dashboard/reconciliation/')) {
    return role === 'admin' || role === 'executive_admin' || role === 'fund_admin';
  }

  // --- NAV Management (Executive Admin, Accountant) ---
  if (pathname === '/dashboard/nav-management' || pathname.startsWith('/dashboard/nav-management/')) {
    return role === 'executive_admin';
  }

  // --- CRM & Bulk Ops (Admin, Executive Admin) ---
  if (pathname === '/dashboard/crm-bulk-ops' || pathname.startsWith('/dashboard/crm-bulk-ops/')) {
    return role === 'admin' || role === 'executive_admin';
  }

  // --- Staff Management (Admin, Executive Admin) ---
  if (pathname === '/dashboard/staff' || pathname.startsWith('/dashboard/staff/')) {
    return role === 'admin' || role === 'executive_admin';
  }

  // --- Funds (Admin, Executive Admin, Fund Admin, Accountant, Investor) ---
  // Note: Investor needs to view fund details (subpages of /dashboard/funds),
  // but they shouldn't view the general funds list.
  if (pathname === '/dashboard/funds' || pathname.startsWith('/dashboard/funds/')) {
    if (pathname === '/dashboard/funds') {
      return role === 'admin' || role === 'executive_admin' || role === 'fund_admin';
    }
    // Subpaths of funds (like /dashboard/funds/[id]) are allowed for admin roles + investor
    return role === 'investor' || role === 'admin' || role === 'executive_admin' || role === 'fund_admin';
  }

  // --- Funding Details (Investor, Admin, Executive Admin, Fund Admin, Accountant) ---
  if (pathname.startsWith('/dashboard/funding/')) {
    return role === 'investor' || role === 'admin' || role === 'executive_admin' || role === 'fund_admin' || role === 'accountant';
  }

  // --- Redemption Details (Investor, Admin, Executive Admin, Fund Admin, Accountant) ---
  if (pathname.startsWith('/dashboard/redemption/')) {
    return role === 'investor' || role === 'admin' || role === 'executive_admin' || role === 'fund_admin' || role === 'accountant';
  }

  // --- Messages & Settings & Notifications & Schedule Meeting (All Roles) ---
  if (
    pathname === '/dashboard/messages' || pathname.startsWith('/dashboard/messages/') ||
    pathname === '/dashboard/settings' || pathname.startsWith('/dashboard/settings/') ||
    pathname === '/dashboard/notifications' || pathname.startsWith('/dashboard/notifications/') ||
    pathname === '/dashboard/schedule-meeting' || pathname.startsWith('/dashboard/schedule-meeting/')
  ) {
    return true;
  }

  return true;
};

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, loading, sessionExpired, setSessionExpired } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  let [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    // If we're not loading and there's no user, we should be redirected.
    // However, we let the logout function or specific page guards handle this 
    // to allow for role-based redirection to the correct login flow.
    if (!loading && !user && !sessionExpired) {
      const path = window.location.pathname;
      if (path !== '/' && !path.startsWith('/auth')) {
        // Only redirect if we're not already on a public or auth page
        router.push("/");
      }
    } else if (!loading && user && !sessionExpired) {
      // If the user is logged in, verify if they are authorized to access the current route
      if (!isRouteAuthorized(pathname, user.role)) {
        console.warn(`Unauthorized access attempt by role '${user.role}' to path: ${pathname}`);
        router.push("/dashboard");
      }
    }
  }, [user, loading, sessionExpired, pathname, router]);

  const isAuthorized = !loading && user && isRouteAuthorized(pathname, user.role);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
      </div>
    );
  }

  if (!user && !sessionExpired) return null;
  if (user && !isAuthorized) return null; // Prevent flash of unauthorized children while redirecting

  return (
    <div className="relative flex h-screen overflow-hidden bg-gray-50">
      {user && <Sidebar isCollapsed={isCollapsed} />}

      <div
        className={`flex flex-1 flex-col min-w-0 transition-all duration-300 ${user ? (isCollapsed ? "lg:pl-20" : "lg:pl-64") : ""
          }`}
      >
        {user && (
          <DashboardHeader
            isCollapsed={isCollapsed}
            onToggleSidebar={() => setIsCollapsed(!isCollapsed)}
          />
        )}


        <main className={`flex-1 overflow-y-auto overflow-x-auto px-4 py-6 sm:px-6 bg-[#F5F7FA]
            ${user
            ? isCollapsed
              ? "sidebar_closed"
              : "sidebar_open"
            : ""
          }

            lg:px-8
          `}
        >
          {children}
        </main>
      </div>

      {sessionExpired && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-2xl bg-white px-8 py-7 shadow-2xl">
            <button
              type="button"
              onClick={() => {
                setSessionExpired(false);
                router.push("/");
              }}
              className="absolute right-4 top-4 text-sm text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
            <h2 className="font-goudy text-xl text-[#1F1F1F]">Session Expired</h2>
            <p className="mt-2 text-sm text-[#6C6C6C]">
              For your security, your session has timed out. Please sign in again to continue.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setSessionExpired(false);
                  router.push("/");
                }}
                className="rounded-full bg-[#F5F5F5] px-6 py-2 text-sm font-medium text-[#4B4B4B] hover:bg-[#E8E8E8]"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  setSessionExpired(false);
                  router.push("/auth/login");
                }}
                className="rounded-full bg-[#FFC63F] px-7 py-2 text-sm font-semibold text-[#1F1F1F] hover:bg-[#F1B92E]"
              >
                Log In
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}