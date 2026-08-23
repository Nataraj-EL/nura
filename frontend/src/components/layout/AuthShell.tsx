"use client";

import React, { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";

export const AuthShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        // Not logged in
        router.push("/login");
      } else if (user.onboardingStatus === "PENDING" && pathname !== "/onboarding") {
        // Logged in but needs onboarding
        router.push("/onboarding");
      }
    }
  }, [user, loading, pathname, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-nura-cream text-nura-slate">
        Loading...
      </div>
    );
  }

  if (!user || (user.onboardingStatus === "PENDING" && pathname !== "/onboarding")) {
    // Return empty shell while redirecting
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-nura-cream text-nura-slate">
      {/* Sidebar Navigation - Responsive Design */}
      <aside className="w-full md:w-64 glass-panel md:min-h-screen p-6 flex md:flex-col justify-between items-center md:items-start border-b md:border-b-0 md:border-r border-nura-rose-medium/20 sticky top-0 z-30">
        <div className="flex md:flex-col gap-8 w-full items-center md:items-start">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <svg
              className="w-6 h-6 text-nura-terracotta"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15.5h-2v-2h2v2zm0-4.5h-2V7h2v6z" />
            </svg>
            <span className="font-display font-semibold text-xl tracking-wide text-nura-slate">
              nura
            </span>
          </div>

          {/* Navigation Links */}
          <nav aria-label="Application Navigation" className="hidden md:flex flex-col gap-3 w-full">
            <a
              href="/dashboard"
              className={`px-4 py-2 rounded-full font-medium transition-all text-sm ${
                pathname === "/dashboard"
                  ? "bg-nura-rose-medium/30 text-nura-terracotta font-semibold"
                  : "text-nura-slate/85 hover:bg-nura-rose-light"
              }`}
            >
              Dashboard
            </a>
            <a
              href="/cycle"
              className={`px-4 py-2 rounded-full font-medium transition-all text-sm ${
                pathname === "/cycle"
                  ? "bg-nura-rose-medium/30 text-nura-terracotta font-semibold"
                  : "text-nura-slate/85 hover:bg-nura-rose-light"
              }`}
            >
              <span>Cycle Log</span>
            </a>
            <a
              href="/wellness"
              className={`px-4 py-2 rounded-full font-medium transition-all text-sm ${
                pathname === "/wellness"
                  ? "bg-nura-rose-medium/30 text-nura-terracotta font-semibold"
                  : "text-nura-slate/85 hover:bg-nura-rose-light"
              }`}
            >
              <span>Wellness Log</span>
            </a>
            <a
              href="/insights"
              className={`px-4 py-2 rounded-full font-medium transition-all text-sm ${
                pathname === "/insights"
                  ? "bg-nura-rose-medium/30 text-nura-terracotta font-semibold"
                  : "text-nura-slate/85 hover:bg-nura-rose-light"
              }`}
            >
              <span>Insights</span>
            </a>
          </nav>
        </div>

        {/* Footer controls inside sidebar */}
        <div className="flex items-center gap-4 md:w-full md:justify-between border-t border-nura-rose-medium/20 md:pt-6">
          <div className="hidden md:block">
            <p className="text-xs text-nura-slate/50 font-semibold truncate max-w-[120px]">
              {user.phoneNumber}
            </p>
            <p className="text-[10px] text-nura-sage font-bold flex items-center gap-1 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-nura-sage inline-block animate-ping"></span>
              Secure Session
            </p>
          </div>
          <Button
            variant="text"
            size="sm"
            onClick={logout}
            className="px-3 py-1.5 text-xs text-red-500 hover:text-red-700 hover:bg-red-50/50 hover:no-underline rounded-full cursor-pointer"
            aria-label="Sign out of your account"
          >
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main id="dashboard-content" className="flex-1 p-6 md:p-12 overflow-y-auto max-w-5xl mx-auto w-full">
        {children}
      </main>
    </div>
  );
};
