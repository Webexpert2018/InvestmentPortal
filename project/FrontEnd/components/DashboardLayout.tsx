"use client";

import { useAuth } from "@/lib/contexts/AuthContext";
import { Sidebar } from "@/components/Sidebar";
import { DashboardHeader } from "@/components/DashboardHeader";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, loading, sessionExpired, setSessionExpired } = useAuth();
  const router = useRouter();

  let [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    if (!loading && !user && !sessionExpired) {
      router.push("/auth/login");
    }
  }, [user, loading, sessionExpired, router]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
      </div>
    );
  }

  if (!user && !sessionExpired) return null;

  return (
    <div className="relative flex h-screen overflow-hidden bg-gray-50">
      {user && <Sidebar isCollapsed={isCollapsed} />}

      <div
        className={`flex flex-1 flex-col transition-all duration-300 ${
          user ? (isCollapsed ? "lg:pl-20" : "lg:pl-64") : ""
        }`}
      >
        {user && (
          <DashboardHeader
            isCollapsed={isCollapsed}
            onToggleSidebar={() => setIsCollapsed(!isCollapsed)}
          />
        )}

        <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-8">
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