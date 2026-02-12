"use client";

import { Menu, Bell, Search } from "lucide-react";
import { useAuth } from "@/lib/contexts/AuthContext";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface DashboardHeaderProps {
  isCollapsed: boolean;
  onToggleSidebar: () => void;
}

export function DashboardHeader({
  isCollapsed,
  onToggleSidebar,
}: DashboardHeaderProps) {
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-30 flex px-4 sm:px-6 lg:px-8 h-20 items-center justify-between border-b bg-white px-6">
      {/* LEFT: Sidebar toggle */}
      <div className="flex items-center gap-4">
        <button
        onClick={onToggleSidebar}
        className="cursor-pointer rounded-md p-2 hover:bg-gray-100 active:scale-95 transition"
      > 
          <Menu className="h-5 w-5 text-gray-700" />
        </button>
      </div>

      {/* CENTER: Search */}
      <div className="hidden md:flex w-full max-w-md items-center rounded-full bg-gray-100 px-4 py-2">
        <Search className="h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Find something here..."
          className="ml-2 w-full bg-transparent text-sm outline-none placeholder:text-gray-400"
        />
      </div>

      {/* RIGHT: Notifications + User */}
      <div className="flex items-center gap-5">
        <Link href="/notifications" className="rounded-full p-2 hover:bg-gray-100">
          <Bell className="h-5 w-5 text-gray-600" />
        </Link>

        <div className="flex items-center gap-2">
          {/* Avatar */}
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1F3B6E] text-sm font-semibold text-white">
            {user?.firstName?.[0] || "A"}
          </div>

          {/* Name */}
          <span className="hidden md:block text-sm font-medium text-gray-800">
            {user?.firstName || "Ovalia"} {user?.lastName || "Admin"}
          </span>
        </div>
      </div>
    </header>
  );
}