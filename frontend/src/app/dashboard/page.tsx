/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import React, { useEffect, useState } from "react";
import { AuthShell } from "@/components/layout/AuthShell";
import { Card } from "@/components/ui/card";
import { apiRequest } from "@/utils/api";
import Link from "next/link";

interface Profile {
  age: number;
  typicalCycleLength: number;
  typicalPeriodDuration: number;
  timezone: string;
  waterGoal: number;
  onboardingStatus: string;
}

interface CyclePhase {
  phase: string;
  currentCycleDay: number;
  phaseStart: string;
  estimatedPhaseEnd: string;
  estimationStatus: string;
}

interface TodayWellness {
  exists: boolean;
  record?: {
    waterIntake?: number;
    mood?: string;
    energyLevel?: number;
    sleepDurationMinutes?: number;
    symptoms?: string[];
  };
}

interface NotificationItem {
  id: string;
  category: string;
  title: string;
  message: string;
  deliveryStatus: string;
  createdAt: string;
}

interface InsightCard {
  title: string;
  content: string;
  type: string;
  level: string;
}

interface InsightsSummary {
  generatedInsightCards: InsightCard[];
  cyclePeriodTrends?: {
    currentCycleDay?: number;
    periodStatus?: string;
    daysSincePeriodEnded?: number;
    typicalCycleLength?: number;
    typicalPeriodDuration?: number;
  };
}

interface WellnessDayRecord {
  id?: string;
  recordDate: string;
  waterIntake?: number;
  mood?: string;
  energyLevel?: number;
  sleepDurationMinutes?: number;
  symptoms?: string[];
  note?: string;
}

export default function DashboardPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [phase, setPhase] = useState<CyclePhase | null>(null);
  const [wellness, setWellness] = useState<TodayWellness | null>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [insights, setInsights] = useState<InsightsSummary | null>(null);
  const [history, setHistory] = useState<WellnessDayRecord[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [quickWaterLoading, setQuickWaterLoading] = useState(false);
  const [showAlertsDropdown, setShowAlertsDropdown] = useState(false);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [profileData, phaseData, wellnessData, notificationsData, insightsData, historyData] = await Promise.all([
        apiRequest("/api/user/profile"),
        apiRequest("/api/cycle/phase"),
        apiRequest("/api/wellness/today"),
        apiRequest("/api/notifications"),
        apiRequest("/api/insights/summary?range=7d"),
        apiRequest("/api/wellness"),
      ]);

      if (profileData) setProfile(profileData as Profile);
      if (phaseData) setPhase(phaseData as CyclePhase);
      if (wellnessData) setWellness(wellnessData as TodayWellness);
      if (notificationsData) {
        setNotifications(notificationsData as NotificationItem[]);
      }
      if (insightsData) setInsights(insightsData as InsightsSummary);
      if (historyData) setHistory(historyData as WellnessDayRecord[]);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "Failed to load dashboard metrics.";
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

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

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const handleQuickLogWater = async () => {
    if (!profile) return;
    setQuickWaterLoading(true);
    try {
      const currentIntake = wellness?.record?.waterIntake || 0;
      const newIntake = currentIntake + 250;
      
      await apiRequest("/api/wellness/today", {
        method: "PUT",
        data: {
          ...wellness?.record,
          waterIntake: newIntake,
        },
      });
      
      await fetchDashboardData();
    } catch (err) {
      console.error("Failed to quick log water", err);
    } finally {
      setQuickWaterLoading(false);
    }
  };

  const getPeriodEstimateText = () => {
    if (!insights?.cyclePeriodTrends) return "Log your first period to estimate your cycle.";
    const trends = insights.cyclePeriodTrends;
    const status = trends.periodStatus;
    const cycleDay = trends.currentCycleDay || 1;
    const cycleLength = trends.typicalCycleLength || 28;
    
    if (status === "ONGOING") {
      return "Period is ongoing today.";
    }
    
    const estimatedDays = cycleLength - cycleDay;
    if (estimatedDays > 0) {
      return `Next period estimated in ${estimatedDays} day${estimatedDays > 1 ? "s" : ""}.`;
    } else if (estimatedDays === 0) {
      return "Period estimated to start today.";
    } else {
      return `Cycle day estimate: Day ${cycleDay}.`;
    }
  };

  const getCheckInStatus = () => {
    if (!wellness || !wellness.exists || !wellness.record) {
      return { text: "Not started yet", pct: 0, cta: "Complete check-in" };
    }
    const rec = wellness.record;
    let loggedCount = 0;
    const totalCount = 4; // sleep, mood, energy, water
    
    if (rec.sleepDurationMinutes !== undefined && rec.sleepDurationMinutes > 0) loggedCount++;
    if (rec.mood !== undefined && rec.mood !== "") loggedCount++;
    if (rec.energyLevel !== undefined) loggedCount++;
    if (rec.waterIntake !== undefined && rec.waterIntake > 0) loggedCount++;
    
    if (loggedCount === 0) {
      return { text: "Not started yet", pct: 0, cta: "Complete check-in" };
    } else if (loggedCount === totalCount) {
      return { text: "All logged!", pct: 100, cta: "Update check-in" };
    } else {
      return { text: `${loggedCount}/${totalCount} complete`, pct: (loggedCount / totalCount) * 100, cta: "Continue check-in" };
    }
  };

  const getUsefulInsights = () => {
    if (!insights || !insights.generatedInsightCards) return [];
    return insights.generatedInsightCards.filter((c) => c.type !== "COVERAGE").slice(0, 2);
  };

  const getRecent7Days = () => {
    const days = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      days.push(d);
    }
    return days;
  };

  const formatLocalDate = (d: Date) => {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  const unreadAlerts = notifications.filter((n) => n.deliveryStatus !== "READ");
  const checkIn = getCheckInStatus();
  const usefulInsights = getUsefulInsights();
  const recentDays = getRecent7Days();

  return (
    <AuthShell>
      <div className="flex flex-col gap-6">
        
        {/* 1. HEADER */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-nura-rose-medium/20 shadow-[0_4px_20px_rgba(0,0,0,0.01)] relative">
          <div className="flex flex-col gap-1">
            <h1 className="font-display text-2xl font-bold text-nura-slate">
              {getGreeting()}
            </h1>
            <p className="text-xs text-nura-slate/60 font-medium">
              Welcome back. Let&apos;s check in with your body today.
            </p>
          </div>
          
          <div className="flex items-center gap-3 relative self-stretch sm:self-auto justify-end">
            {/* Notification Bell */}
            <button
              onClick={() => setShowAlertsDropdown(!showAlertsDropdown)}
              className="w-11 h-11 flex items-center justify-center rounded-full bg-nura-rose-light border border-nura-rose-medium/30 text-nura-slate/80 hover:text-nura-terracotta transition-colors relative cursor-pointer min-h-[44px] min-w-[44px]"
              aria-label={`Show ${unreadAlerts.length} unread alerts`}
            >
              <span className="text-lg">🔔</span>
              {unreadAlerts.length > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-[10px] text-white font-extrabold flex items-center justify-center rounded-full">
                  {unreadAlerts.length}
                </span>
              )}
            </button>

            {/* Settings Link */}
            <Link 
              href="/settings"
              className="w-11 h-11 flex items-center justify-center rounded-full bg-nura-rose-light border border-nura-rose-medium/30 text-nura-slate/80 hover:text-nura-terracotta transition-colors min-h-[44px] min-w-[44px]"
              aria-label="Settings and Profile"
            >
              <span className="text-lg">⚙️</span>
            </Link>

            {/* Notification Dropdown Portal */}
            {showAlertsDropdown && (
              <div className="absolute right-0 top-14 w-80 bg-white border border-nura-rose-medium/30 rounded-2xl p-4 shadow-xl z-50 flex flex-col gap-3">
                <div className="flex justify-between items-center border-b border-nura-rose-medium/10 pb-2">
                  <span className="text-xs font-bold text-nura-slate">Today&apos;s Alerts</span>
                  <button 
                    onClick={() => setShowAlertsDropdown(false)} 
                    className="text-xs font-semibold text-nura-slate/40 hover:text-nura-slate"
                  >
                    Close
                  </button>
                </div>
                
                <div className="max-h-60 overflow-y-auto flex flex-col gap-2">
                  {unreadAlerts.length === 0 ? (
                    <p className="text-xs text-nura-slate/40 text-center py-6 italic">No unread alerts.</p>
                  ) : (
                    unreadAlerts.map((n) => (
                      <div key={n.id} className="p-3 bg-nura-rose-light/50 border border-nura-rose-medium/15 rounded-xl flex flex-col gap-1 text-[11px]">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-nura-slate">{n.title}</span>
                          <button
                            onClick={() => handleMarkRead(n.id)}
                            className="text-[9px] text-nura-terracotta font-extrabold hover:underline"
                          >
                            Dismiss
                          </button>
                        </div>
                        <p className="text-nura-slate/75 leading-relaxed">{n.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </header>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-600" role="alert">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-nura-slate/50 text-sm py-12 text-center">Loading your wellness dashboard...</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            
            {/* LEFT / MAIN COLUMN (Cycle & Insights) */}
            <div className="lg:col-span-2 flex flex-col gap-6">
              
              {/* 2. TODAY: "Your Nura Today" */}
              <Card variant="glass" className="p-6 flex flex-col gap-4 border border-nura-rose-medium/20">
                <div className="flex justify-between items-start border-b border-nura-rose-medium/10 pb-3">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] font-bold text-nura-slate/40 uppercase tracking-widest">Your Cycle Today</span>
                    <h2 className="font-display text-lg font-bold text-nura-slate">Cycle Calendar Status</h2>
                  </div>
                  {phase && (
                    <span className="px-3 py-1 bg-nura-rose-medium/30 rounded-full text-[10px] font-extrabold text-nura-terracotta uppercase tracking-wide">
                      {phase.phase}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <span className="text-xs text-nura-slate/60">Current Status</span>
                    <span className="text-2xl font-display font-extrabold text-nura-slate">
                      {phase ? `Day ${phase.currentCycleDay}` : "No cycle data"}
                    </span>
                  </div>

                  <div className="flex flex-col justify-end gap-1">
                    <span className="text-xs text-nura-slate/60">Period Forecast</span>
                    <span className="text-xs font-semibold text-nura-slate">
                      {getPeriodEstimateText()}
                    </span>
                  </div>
                </div>

                <p className="text-[9px] text-nura-slate/40 leading-relaxed pt-2 border-t border-nura-rose-medium/10 mt-1">
                  * Projections are observational estimates derived from your configured average parameters and do not constitute diagnostic medical parameters.
                </p>
              </Card>

              {/* 5. TODAY'S INSIGHT */}
              <Card variant="default" className="p-6 flex flex-col gap-4">
                <h3 className="font-display text-sm font-bold text-nura-slate border-b border-nura-rose-medium/10 pb-2">
                  Today&apos;s Insights
                </h3>
                
                {usefulInsights.length === 0 ? (
                  <div className="py-4 text-center">
                    <p className="text-xs text-nura-slate/50 italic mb-1">Keep logging to discover your patterns</p>
                    <p className="text-[10px] text-nura-slate/40 max-w-xs mx-auto">
                      Trend observations compile automatically once you record check-ins across 3 distinct days.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {usefulInsights.map((insight, idx) => (
                      <div 
                        key={idx} 
                        className={`p-4 rounded-xl border flex flex-col gap-2 ${
                          insight.level === "SUCCESS" 
                            ? "bg-nura-sage-light border-nura-sage/20" 
                            : "bg-nura-rose-light border-nura-rose-medium/20"
                        }`}
                      >
                        <span className="text-xs font-bold text-nura-slate">{insight.title}</span>
                        <p className="text-[11px] text-nura-slate/75 leading-relaxed">{insight.content}</p>
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              {/* 7. RECENT ACTIVITY */}
              <Card variant="default" className="p-6 flex flex-col gap-4">
                <h3 className="font-display text-sm font-bold text-nura-slate border-b border-nura-rose-medium/10 pb-2">
                  Recent Logging Activity
                </h3>

                <div className="grid grid-cols-7 gap-2">
                  {recentDays.map((day, idx) => {
                    const formatted = formatLocalDate(day);
                    const record = history.find((h) => h.recordDate === formatted);
                    const hasData = record && (
                      (record.waterIntake && record.waterIntake > 0) ||
                      (record.sleepDurationMinutes && record.sleepDurationMinutes > 0) ||
                      record.mood ||
                      (record.symptoms && record.symptoms.length > 0)
                    );
                    const isToday = formatted === formatLocalDate(new Date());

                    return (
                      <div 
                        key={idx} 
                        className={`flex flex-col items-center gap-2 p-2 rounded-xl border transition-colors ${
                          isToday 
                            ? "bg-nura-rose-medium/20 border-nura-rose-medium/60" 
                            : "bg-white border-nura-rose-medium/10"
                        }`}
                      >
                        <span className="text-[10px] text-nura-slate/50 font-bold uppercase">
                          {day.toLocaleDateString(undefined, { weekday: "short" }).slice(0, 2)}
                        </span>
                        <span className={`text-xs font-semibold ${isToday ? "text-nura-terracotta font-extrabold" : "text-nura-slate"}`}>
                          {day.getDate()}
                        </span>
                        
                        <div className="h-5 flex items-center justify-center">
                          {hasData ? (
                            <span 
                              className="w-2 h-2 rounded-full bg-nura-sage" 
                              title="Logged wellness indicators"
                            />
                          ) : (
                            <span 
                              className="w-1.5 h-1.5 rounded-full bg-nura-slate/15" 
                              title="No logs"
                            />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>

            </div>

            {/* RIGHT COLUMN (Check-in, Water & Actions) */}
            <div className="flex flex-col gap-6">
              
              {/* 3. WELLNESS CHECK-IN */}
              <Card variant="default" className="p-6 flex flex-col gap-4">
                <div className="flex justify-between items-center border-b border-nura-rose-medium/10 pb-2">
                  <h3 className="font-display text-sm font-bold text-nura-slate">
                    Wellness Check-in
                  </h3>
                  <span className="text-[10px] font-bold text-nura-slate/55 uppercase">
                    {checkIn.text}
                  </span>
                </div>

                <div className="flex flex-col gap-3 text-xs">
                  <div className="flex items-center justify-between py-1 border-b border-nura-rose-medium/5">
                    <span className="text-nura-slate/75">💧 Water Intake</span>
                    <span className="font-semibold text-nura-slate">
                      {wellness?.record?.waterIntake ? `${wellness.record.waterIntake} ml` : "Not logged"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-1 border-b border-nura-rose-medium/5">
                    <span className="text-nura-slate/75">😴 Sleep duration</span>
                    <span className="font-semibold text-nura-slate">
                      {wellness?.record?.sleepDurationMinutes 
                        ? `${Math.round(wellness.record.sleepDurationMinutes / 60)} hrs` 
                        : "Not logged"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-1 border-b border-nura-rose-medium/5">
                    <span className="text-nura-slate/75">😊 Current Mood</span>
                    <span className="font-semibold text-nura-slate">
                      {wellness?.record?.mood ? wellness.record.mood.toLowerCase() : "Not logged"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-1">
                    <span className="text-nura-slate/75">⚡ Vitality Energy</span>
                    <span className="font-semibold text-nura-slate">
                      {wellness?.record?.energyLevel ? `${wellness.record.energyLevel}/5` : "Not logged"}
                    </span>
                  </div>
                </div>

                <Link href="/wellness" className="w-full">
                  <button className="w-full py-2 bg-nura-terracotta hover:bg-nura-terracotta/95 text-white font-bold text-xs rounded-full transition-colors cursor-pointer min-h-[44px]">
                    {checkIn.cta}
                  </button>
                </Link>
              </Card>

              {/* 6. WATER */}
              {profile && (
                <Card variant="default" className="p-6 flex flex-col gap-4">
                  <div className="flex justify-between items-baseline border-b border-nura-rose-medium/10 pb-2">
                    <h3 className="font-display text-sm font-bold text-nura-slate">
                      Water Log
                    </h3>
                    <span className="text-[10px] text-nura-slate/50">
                      Goal: {profile.waterGoal} ml
                    </span>
                  </div>

                  <div className="flex flex-col gap-3">
                    <div className="flex justify-between text-xs text-nura-slate font-semibold">
                      <span>Logged: {wellness?.record?.waterIntake || 0} ml</span>
                      <span>{Math.round(Math.min(100, (((wellness?.record?.waterIntake || 0) / profile.waterGoal) * 100)))}%</span>
                    </div>

                    <div className="w-full h-2.5 bg-nura-rose-medium/20 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-nura-sage transition-all duration-300"
                        style={{ width: `${Math.min(100, (((wellness?.record?.waterIntake || 0) / profile.waterGoal) * 100))}%` }}
                      />
                    </div>

                    <button
                      onClick={handleQuickLogWater}
                      disabled={quickWaterLoading}
                      className="w-full py-2 border border-nura-sage text-nura-sage hover:bg-nura-sage/5 font-bold text-xs rounded-full transition-colors cursor-pointer disabled:opacity-50 min-h-[44px]"
                      aria-label="Add 250ml water intake"
                    >
                      {quickWaterLoading ? "Logging..." : "+ Add 250ml"}
                    </button>
                  </div>
                </Card>
              )}

              {/* 4. QUICK ACTIONS */}
              <Card variant="default" className="p-6 flex flex-col gap-4">
                <h3 className="font-display text-sm font-bold text-nura-slate border-b border-nura-rose-medium/10 pb-2">
                  Quick Actions
                </h3>
                
                <div className="grid grid-cols-2 gap-3 text-center">
                  <Link 
                    href="/wellness"
                    className="p-3 bg-nura-rose-light/75 border border-nura-rose-medium/25 rounded-xl hover:border-nura-terracotta/30 transition-all flex flex-col gap-1 items-center cursor-pointer min-h-[60px]"
                  >
                    <span className="text-base">💧</span>
                    <span className="text-[10px] font-bold text-nura-slate">Log Wellness</span>
                  </Link>

                  <Link 
                    href="/cycle"
                    className="p-3 bg-nura-rose-light/75 border border-nura-rose-medium/25 rounded-xl hover:border-nura-terracotta/30 transition-all flex flex-col gap-1 items-center cursor-pointer min-h-[60px]"
                  >
                    <span className="text-base">🩸</span>
                    <span className="text-[10px] font-bold text-nura-slate">Cycle Log</span>
                  </Link>

                  <Link 
                    href="/insights"
                    className="p-3 bg-nura-rose-light/75 border border-nura-rose-medium/25 rounded-xl hover:border-nura-terracotta/30 transition-all flex flex-col gap-1 items-center cursor-pointer min-h-[60px]"
                  >
                    <span className="text-base">📈</span>
                    <span className="text-[10px] font-bold text-nura-slate">View Insights</span>
                  </Link>

                  <Link 
                    href="/care"
                    className="p-3 bg-nura-rose-light/75 border border-nura-rose-medium/25 rounded-xl hover:border-nura-terracotta/30 transition-all flex flex-col gap-1 items-center cursor-pointer min-h-[60px]"
                  >
                    <span className="text-base">🛡️</span>
                    <span className="text-[10px] font-bold text-nura-slate">Care & Safety</span>
                  </Link>
                </div>
              </Card>

            </div>

          </div>
        )}
        
      </div>
    </AuthShell>
  );
}
