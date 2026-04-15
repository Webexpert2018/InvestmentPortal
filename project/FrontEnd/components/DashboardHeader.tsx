"use client";

import { useEffect, useRef, useState } from "react";
import { Bell, Search, MessageCircle } from "lucide-react";
import { useAuth } from "@/lib/contexts/AuthContext";
import { apiClient, BASE_URL } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";

interface DashboardHeaderProps {
  isCollapsed: boolean;
  onToggleSidebar: () => void;
}

export function DashboardHeader({
  isCollapsed,
  onToggleSidebar,
}: DashboardHeaderProps) {
  const { user, logout, profileTimestamp } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const displayName = `${user?.firstName || "investor"} ${user?.lastName || "User"}`;
  const [iraAccount, setIraAccount] = useState<any>(null);
  const accountLabel = iraAccount ? `${iraAccount.account_type} (${iraAccount.account_number})` : "No IRA Account";
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (user && user.role === 'investor' && !iraAccount) {
      apiClient.getMyIRAAccount().then(data => {
        setIraAccount(data);
      }).catch(err => {
        console.error('Failed to fetch IRA account in header:', err);
        // Set to a special value to prevent retry loop
        setIraAccount({ account_type: 'Unknown', account_number: 'Error' });
      });
    }
  }, [user, iraAccount]);

  useEffect(() => {
    if (!isProfileMenuOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current?.contains(event.target as Node)) return;
      setIsProfileMenuOpen(false);
    };

    window.addEventListener("click", handleClickOutside);
    return () => window.removeEventListener("click", handleClickOutside);
  }, [isProfileMenuOpen]);

  const handleSignOut = () => {
    logout();
    setIsProfileMenuOpen(false);
    router.push("/");
  };

  return (
    <header className="sticky top-0 z-30 flex h-[85px] items-center justify-between border-b border-[#EEEEEE] bg-white px-3 sm:px-4 lg:px-5">
      <div className="flex items-center">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="cursor-pointer rounded-md p-2 transition hover:bg-gray-100 active:scale-95 dashboard-toggle-button"
          aria-label="Toggle sidebar"
        >
          <Image src="/images/menu-icon.svg" alt="Open menu" width={20} height={20} className="h-5 w-5" />
        </button>
      </div>

      <div className="flex items-center gap-5">
        {/* <div className="hidden h-[50px] w-[180px] lg:w-[340px] items-center rounded-[40px] bg-[#F2F2F2] px-6 lg:w-[390px] md:flex">
          <Search className="h-[20px] w-[20px] text-[#8D8D8D]" strokeWidth={1.8} />
          <input
            type="text"
            placeholder="Find something here..."
            className="ml-3 w-full bg-transparent font-helvetica text-[14px] leading-none text-[#2A2A2A] outline-none placeholder:text-[#8D8D8D]"
          />
        </div> */}
        <Link
          href="/dashboard/messages"
          className={cn(
            "inline-flex h-[50px] w-[50px] shrink-0 items-center justify-center rounded-full bg-[#F2F2F2] transition hover:bg-[#EBEBEB]",
            pathname?.startsWith("/dashboard/messages") && "ring-2 ring-[#D9DEE7]",
          )}
          aria-label="Messages"
        >
          <MessageCircle className="h-[21px] w-[21px] text-[#555555]" strokeWidth={1.8} />
        </Link>

        <Link
          href="/notifications"
          className={cn(
            "inline-flex h-[50px] w-[50px] shrink-0 items-center justify-center rounded-full bg-[#F2F2F2] transition hover:bg-[#EBEBEB]",
            pathname === "/notifications" && "ring-2 ring-[#D9DEE7]",
          )}
          aria-label="Notifications"
        >
          <Bell className="h-[21px] w-[21px] text-[#555555]" strokeWidth={1.8} />
        </Link>

        <div className="h-[50px] w-px bg-[#EEEEEE]" />

        <div ref={profileMenuRef} className="relative pr-1">
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              setIsProfileMenuOpen((prev) => !prev);
            }}
            className="flex items-center gap-3 rounded-lg px-1 py-1"
            aria-label="Open profile menu"
          >
            <div className="relative h-[50px] w-[50px] overflow-hidden rounded-full border border-[#EEEEEE]">
              <Image
                src={(() => {
                  if (!user?.profileImageUrl) {
                    return `https://api.dicebear.com/7.x/initials/svg?seed=${user?.firstName || 'User'}`;
                  }
                  if (user.profileImageUrl.startsWith('http')) {
                    const url = new URL(user.profileImageUrl);
                    url.searchParams.set('t', profileTimestamp.toString());
                    return url.toString();
                  }
                  const baseUrl = BASE_URL;
                  const separator = user.profileImageUrl.includes('?') ? '&' : '?';
                  return `${baseUrl}${user.profileImageUrl}${separator}t=${profileTimestamp}`;
                })()}
                alt="Profile"
                fill
                className="object-cover"
                sizes="50px"
              />
            </div>

            <div className="hidden text-left md:block">
              <p className="font-helvetica text-[15px] font-bold leading-[1] text-[#2A2A2A]">{displayName}</p>
              {/* <p className="mt-1 font-helvetica text-[14px] leading-[1] text-[#7A7A7A]">{accountLabel}</p> */}
              <p className="mt-1 text-xs text-[#A0A0A0]">role: <span className="font-mono text-[12px] text-[#666]">{user?.role ?? 'none'}</span></p>
            </div>

            <svg
              className={cn(
                "h-[22px] w-[22px] text-[#B6B6B6] transition-transform",
                isProfileMenuOpen && "rotate-180",
              )}
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          {isProfileMenuOpen && (
            <div className="absolute right-0 top-full z-40 mt-2 w-[190px] rounded-[10px] border border-[#ECECEC] bg-white p-2 shadow-[0_10px_24px_rgba(0,0,0,0.12)]">
              <button
                type="button"
                onClick={handleSignOut}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-[#FFF9EE] px-4 py-2 font-helvetica text-[14px] font-bold text-[#FFC63F] hover:bg-[#F3EAD7]"
              >
                <Image
                  src="/images/sign_out.svg"
                  alt="Sign Out"
                  width={16}
                  height={16}
                  className="shrink-0"
                />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}