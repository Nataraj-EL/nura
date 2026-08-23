/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/utils/api";

interface NotificationItem {
  id: string;
  category: string;
  title: string;
  message: string;
  deliveryStatus: string;
  recordDate?: string;
  createdAt: string;
}

export const AuthShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Notifications State
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [showBellPopover, setShowBellPopover] = useState(false);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [notificationsError, setNotificationsError] = useState<string | null>(null);

  // Permission States
  const [permissionState, setPermissionState] = useState<"default" | "granted" | "denied">("default");
  const [permissionMessage, setPermissionMessage] = useState<string | null>(null);

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      setLoadingNotifications(true);
      setNotificationsError(null);
      const res = await apiRequest("/api/notifications");
      if (res) {
        setNotifications(res as NotificationItem[]);
      }
    } catch {
      setNotificationsError("Failed to load notifications.");
    } finally {
      setLoadingNotifications(false);
    }
  };

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/login");
      } else if (user.onboardingStatus === "PENDING" && pathname !== "/onboarding") {
        router.push("/onboarding");
      } else {
        fetchNotifications();
      }
    }
  }, [user, loading, pathname, router]);

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setPermissionState(window.Notification.permission);
    }
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-nura-cream text-nura-slate">
        Loading...
      </div>
    );
  }

  if (!user || (user.onboardingStatus === "PENDING" && pathname !== "/onboarding")) {
    return null;
  }

  const unreadCount = notifications.filter((n) => n.deliveryStatus !== "READ").length;

  const handleMarkRead = async (id: string) => {
    try {
      await apiRequest(`/api/notifications/${id}/read`, { method: "PUT" });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, deliveryStatus: "READ" } : n))
      );
    } catch {
      console.warn("Failed to mark notification as read");
    }
  };

  const handleRequestPermission = async () => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      setPermissionMessage("This browser does not support web notifications.");
      return;
    }

    try {
      const outcome = await window.Notification.requestPermission();
      setPermissionState(outcome);
      if (outcome === "granted") {
        setPermissionMessage("Browser alerts enabled!");
      } else if (outcome === "denied") {
        setPermissionMessage("Alert permission was blocked.");
      }
    } catch {
      setPermissionMessage("Permission request failed.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-nura-cream text-nura-slate">
      
      {/* 1. Mobile Top Header Panel */}
      <header className="md:hidden flex justify-between items-center px-6 py-4 bg-white border-b border-nura-rose-medium/20 sticky top-0 z-30">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-nura-terracotta" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15.5h-2v-2h2v2zm0-4.5h-2V7h2v6z" />
          </svg>
          <span className="font-display font-semibold text-lg tracking-wide">nura</span>
        </div>

        <button
          onClick={() => {
            fetchNotifications();
            setShowBellPopover(true);
          }}
          className="relative p-2 text-nura-slate/85 hover:text-nura-terracotta transition-colors cursor-pointer"
          aria-label={`Open notifications center, ${unreadCount} unread`}
        >
          <span className="text-xl">🔔</span>
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-[10px] text-white font-extrabold flex items-center justify-center rounded-full animate-pulse">
              {unreadCount}
            </span>
          )}
        </button>
      </header>

      {/* 2. Desktop Sidebar Drawer */}
      <aside className="hidden md:flex w-64 glass-panel min-h-screen p-6 flex-col justify-between items-start border-r border-nura-rose-medium/20 sticky top-0 z-30">
        <div className="flex flex-col gap-8 w-full items-start">
          {/* Logo & Alerts */}
          <div className="flex justify-between items-center w-full">
            <div className="flex items-center gap-2">
              <svg className="w-6 h-6 text-nura-terracotta" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15.5h-2v-2h2v2zm0-4.5h-2V7h2v6z" />
              </svg>
              <span className="font-display font-semibold text-xl tracking-wide">nura</span>
            </div>

            <button
              onClick={() => {
                fetchNotifications();
                setShowBellPopover(true);
              }}
              className="relative p-1.5 text-nura-slate/75 hover:text-nura-terracotta transition-colors cursor-pointer"
              aria-label="Toggle notifications panel"
            >
              <span className="text-lg">🔔</span>
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4.5 h-4.5 bg-red-500 text-[10px] text-white font-extrabold flex items-center justify-center rounded-full">
                  {unreadCount}
                </span>
              )}
            </button>
          </div>

          {/* Navigation Links */}
          <nav aria-label="Desktop Navigation" className="flex flex-col gap-3 w-full">
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
              Cycle Log
            </a>
            <a
              href="/wellness"
              className={`px-4 py-2 rounded-full font-medium transition-all text-sm ${
                pathname === "/wellness"
                  ? "bg-nura-rose-medium/30 text-nura-terracotta font-semibold"
                  : "text-nura-slate/85 hover:bg-nura-rose-light"
              }`}
            >
              Wellness Log
            </a>
            <a
              href="/insights"
              className={`px-4 py-2 rounded-full font-medium transition-all text-sm ${
                pathname === "/insights"
                  ? "bg-nura-rose-medium/30 text-nura-terracotta font-semibold"
                  : "text-nura-slate/85 hover:bg-nura-rose-light"
              }`}
            >
              Insights
            </a>
          </nav>
        </div>

        {/* Footer controls inside sidebar */}
        <div className="flex flex-col gap-4 w-full border-t border-nura-rose-medium/20 pt-6">
          <div>
            <p className="text-xs text-nura-slate/50 font-semibold truncate">
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
            className="w-full py-1.5 text-xs text-red-500 hover:bg-red-50/50 rounded-full cursor-pointer"
            aria-label="Sign out"
          >
            Sign Out
          </Button>
        </div>
      </aside>

      {/* 3. Main Dashboard Viewport */}
      {/* pb-24 padding prevents bottom navigation bar from overlapping content on mobile */}
      <main id="dashboard-content" className="flex-1 p-6 md:p-12 pb-24 md:pb-12 overflow-y-auto max-w-5xl mx-auto w-full">
        {children}
      </main>

      {/* 4. Mobile Bottom Sticky Navigation Layout */}
      <nav 
        aria-label="Mobile Navigation" 
        className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-nura-rose-medium/20 py-2.5 px-2 flex justify-around items-center z-45 pb-safe shadow-xl"
      >
        <a
          href="/dashboard"
          className={`flex flex-col items-center gap-0.5 text-[10px] font-bold ${
            pathname === "/dashboard" ? "text-nura-terracotta" : "text-nura-slate/50"
          }`}
        >
          <span className="text-lg">🏠</span>
          <span>Home</span>
        </a>
        <a
          href="/cycle"
          className={`flex flex-col items-center gap-0.5 text-[10px] font-bold ${
            pathname === "/cycle" ? "text-nura-terracotta" : "text-nura-slate/50"
          }`}
        >
          <span className="text-lg">🩸</span>
          <span>Cycle</span>
        </a>
        <a
          href="/wellness"
          className={`flex flex-col items-center gap-0.5 text-[10px] font-bold ${
            pathname === "/wellness" ? "text-nura-terracotta" : "text-nura-slate/50"
          }`}
        >
          <span className="text-lg">💧</span>
          <span>Wellness</span>
        </a>
        <a
          href="/insights"
          className={`flex flex-col items-center gap-0.5 text-[10px] font-bold ${
            pathname === "/insights" ? "text-nura-terracotta" : "text-nura-slate/50"
          }`}
        >
          <span className="text-lg">📈</span>
          <span>Insights</span>
        </a>
      </nav>

      {/* 5. Notifications Drawer Popup */}
      {showBellPopover && (
        <div 
          className="fixed inset-0 bg-black/45 backdrop-blur-sm z-50 flex justify-end animate-fade-in"
          onClick={() => setShowBellPopover(false)}
        >
          <div 
            className="w-full max-w-sm bg-white min-h-screen p-6 shadow-2xl flex flex-col gap-6 relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex justify-between items-center border-b border-nura-rose-medium/15 pb-4">
              <div className="flex items-center gap-2">
                <span className="text-xl">🔔</span>
                <h3 className="font-display text-lg font-bold text-nura-slate">Notifications</h3>
              </div>
              <button 
                onClick={() => setShowBellPopover(false)}
                className="text-nura-slate/40 hover:text-nura-slate text-xl cursor-pointer"
                aria-label="Close notifications panel"
              >
                ✕
              </button>
            </div>

            {/* Browser Permission Opt-In Widget */}
            {permissionState !== "granted" && (
              <div className="p-4 bg-nura-rose-medium/10 border border-nura-rose-medium/20 rounded-2xl flex flex-col gap-2">
                <span className="text-[10px] font-bold text-nura-terracotta uppercase">Permission Settings</span>
                <p className="text-xs text-nura-slate/60 leading-relaxed">
                  Enable browser notification prompts to receive period predictions, daily wellness logging cues, and water alerts directly.
                </p>
                <button
                  onClick={handleRequestPermission}
                  className="w-full py-1.5 bg-nura-terracotta hover:bg-nura-terracotta/90 text-white font-bold text-xs rounded-full transition-colors cursor-pointer"
                >
                  Enable Browser Alerts
                </button>
                {permissionMessage && (
                  <span className="text-[10px] font-semibold text-nura-terracotta text-center block mt-1">
                    {permissionMessage}
                  </span>
                )}
              </div>
            )}

            {/* List */}
            <div className="flex-1 overflow-y-auto flex flex-col gap-3">
              {loadingNotifications ? (
                <div className="text-xs text-nura-slate/50 text-center py-8">Loading notifications...</div>
              ) : notificationsError ? (
                <div className="text-xs text-red-500 text-center py-8">{notificationsError}</div>
              ) : notifications.length === 0 ? (
                <div className="text-xs text-nura-slate/40 text-center py-12 italic">
                  No active notifications available.
                </div>
              ) : (
                notifications.map((n) => {
                  const isRead = n.deliveryStatus === "READ";
                  return (
                    <div 
                      key={n.id} 
                      className={`p-4 rounded-2xl border transition-all text-xs flex flex-col gap-1.5 ${
                        isRead 
                          ? "bg-white border-nura-rose-medium/10 text-nura-slate/65" 
                          : "bg-nura-rose-medium/10 border-nura-rose-medium/30 font-medium"
                      }`}
                    >
                      <div className="flex justify-between items-start gap-2">
                        <span className="font-bold text-nura-slate">{n.title}</span>
                        {!isRead && (
                          <button
                            onClick={() => handleMarkRead(n.id)}
                            className="text-[10px] text-nura-terracotta font-bold hover:underline cursor-pointer"
                          >
                            Mark Read
                          </button>
                        )}
                      </div>
                      <p className="text-nura-slate/75 leading-relaxed">{n.message}</p>
                      <span className="text-[9px] text-nura-slate/40 self-end">
                        {new Date(n.createdAt).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer controls inside drawer */}
            <div className="border-t border-nura-rose-medium/15 pt-4 text-center">
              <button
                onClick={() => {
                  logout();
                  setShowBellPopover(false);
                }}
                className="text-xs text-red-500 font-semibold hover:underline cursor-pointer"
              >
                Sign Out Account
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
