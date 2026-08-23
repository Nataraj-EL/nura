/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import React, { useEffect, useState } from "react";
import { AuthShell } from "@/components/layout/AuthShell";
import { Card } from "@/components/ui/card";
import { apiRequest } from "@/utils/api";

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

export default function DashboardPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [phase, setPhase] = useState<CyclePhase | null>(null);
  const [wellness, setWellness] = useState<TodayWellness | null>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [profileData, phaseData, wellnessData, notificationsData] = await Promise.all([
        apiRequest("/api/user/profile"),
        apiRequest("/api/cycle/phase"),
        apiRequest("/api/wellness/today"),
        apiRequest("/api/notifications"),
      ]);

      if (profileData) setProfile(profileData as Profile);
      if (phaseData) setPhase(phaseData as CyclePhase);
      if (wellnessData) setWellness(wellnessData as TodayWellness);
      if (notificationsData) {
        setNotifications((notificationsData as NotificationItem[]).slice(0, 3));
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "Failed to load dashboard parameters.";
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
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch {
      console.warn("Failed to mark notification as read");
    }
  };

  // Determine next action suggestions dynamically
  const getNextActionSuggestion = () => {
    if (!wellness || !wellness.exists || !wellness.record) {
      return "Log your wellness stats today to start tracking hydration and rest.";
    }
    const rec = wellness.record;
    if (rec.waterIntake === undefined || rec.waterIntake === 0) {
      return "Log your water intake to stay hydrated.";
    }
    if (rec.sleepDurationMinutes === undefined || rec.sleepDurationMinutes === 0) {
      return "Log your sleep duration to keep rest insights accurate.";
    }
    if (rec.mood === undefined || !rec.mood) {
      return "Record your mood today to note emotional rhythm changes.";
    }
    if (rec.energyLevel === undefined) {
      return "Rate your energy level to establish vitality baselines.";
    }
    return "Great job! You've checked in for all metrics today.";
  };

  return (
    <AuthShell>
      <div className="flex flex-col gap-8">
        
        {/* Dashboard Title */}
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-bold text-nura-terracotta uppercase tracking-wider">Mindful Mapping</span>
          <h1 className="font-display text-3xl font-bold text-nura-slate">Your Nura Today</h1>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-600" role="alert">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-nura-slate/60 text-sm">Compiling workspace parameters...</div>
        ) : (
          profile && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              
              {/* Column 1: Cycle Phase Status & Averages */}
              <div className="md:col-span-2 flex flex-col gap-8">
                
                {/* 🩸 Cycle Phase Card */}
                <Card variant="glass" className="p-8 flex flex-col gap-5 border border-nura-rose-medium/20">
                  <div className="flex flex-col gap-1 border-b border-nura-rose-medium/10 pb-2">
                    <span className="text-xs font-bold text-nura-slate/40 uppercase tracking-widest">Likely Cycle Status</span>
                    <h2 className="font-display text-xl font-bold text-nura-slate">🗓️ Cycle Calendar Summary</h2>
                  </div>

                  {phase ? (
                    <div className="flex flex-col gap-4">
                      <div className="flex justify-between items-center py-0.5">
                        <span className="text-sm font-semibold text-nura-slate/75"> likely Phase</span>
                        <span className="font-extrabold text-nura-terracotta text-sm uppercase tracking-wide">
                          {phase.phase}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-0.5">
                        <span className="text-sm font-semibold text-nura-slate/75">Current Cycle Day</span>
                        <span className="font-bold text-nura-slate text-sm">Day {phase.currentCycleDay}</span>
                      </div>
                      <div className="flex justify-between items-center py-0.5 border-t border-nura-rose-medium/10 pt-3">
                        <span className="text-xs text-nura-slate/70">Estimation Baseline</span>
                        <span className="text-xs font-bold text-nura-slate">
                          {profile.typicalCycleLength} day baseline ({phase.estimationStatus})
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs text-nura-slate/45 py-4 text-center">
                      No cycle phase estimates resolved yet.
                    </div>
                  )}

                  <div className="text-[10px] text-nura-slate/40 leading-relaxed border-t border-nura-rose-medium/10 pt-3">
                    * Period prediction is probabilistic. Calendar projections are mathematical estimates and cannot biologially confirm ovulation boundaries.
                  </div>
                </Card>

                {/* 💧 Hydration Tracker Card */}
                <Card variant="default" className="p-8 flex flex-col gap-4">
                  <div className="flex flex-col gap-1 border-b border-nura-rose-medium/10 pb-2">
                    <span className="text-xs font-bold text-nura-slate/40 uppercase tracking-widest">Intake</span>
                    <h2 className="font-display text-base font-bold text-nura-slate">💧 Water Log Progress</h2>
                  </div>

                  {wellness && wellness.record ? (
                    <div className="flex flex-col gap-3">
                      <div className="flex justify-between text-xs font-bold text-nura-slate">
                        <span>Intake logged: {wellness.record.waterIntake || 0} ml</span>
                        <span className="text-nura-slate/45">Target: {profile.waterGoal} ml</span>
                      </div>
                      <div className="w-full h-3 bg-nura-rose-medium/20 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-nura-sage transition-all duration-300"
                          style={{ width: `${Math.min(100, ((wellness.record.waterIntake || 0) / profile.waterGoal) * 100)}%` }}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs text-nura-slate/50 text-center py-3">
                      No water logged today. Target: {profile.waterGoal} ml.
                    </div>
                  )}

                  <p className="text-[9px] text-nura-slate/45">
                    * Hydration values are logging parameters configured by settings and not medical prescriptions.
                  </p>
                </Card>

                {/* ⚡ Next Action Suggestions */}
                <div className="p-5 bg-nura-rose-medium/10 border border-nura-rose-medium/20 rounded-2xl flex items-start gap-3">
                  <span className="text-xl">💡</span>
                  <div className="text-xs">
                    <span className="font-bold text-nura-terracotta uppercase text-[9px] tracking-wide block mb-0.5">Nura Recommendation</span>
                    {getNextActionSuggestion()}
                  </div>
                </div>

              </div>

              {/* Column 2: Check-in state checklist and reminders list */}
              <div className="md:col-span-1 flex flex-col gap-8">
                
                {/* Check-in Checklist */}
                <Card variant="default" className="p-6 flex flex-col gap-4">
                  <h3 className="font-display text-sm font-bold text-nura-slate border-b border-nura-rose-medium/10 pb-2">
                    Today&apos;s Logs Checklist
                  </h3>

                  <div className="flex flex-col gap-3 text-xs">
                    <div className="flex items-center gap-2.5">
                      <input 
                        type="checkbox" 
                        readOnly 
                        checked={wellness?.record?.waterIntake !== undefined && wellness.record.waterIntake > 0} 
                        className="rounded accent-nura-sage" 
                      />
                      <span className="text-nura-slate/75">💧 Water Hydration Log</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <input 
                        type="checkbox" 
                        readOnly 
                        checked={wellness?.record?.sleepDurationMinutes !== undefined && wellness.record.sleepDurationMinutes > 0} 
                        className="rounded accent-nura-sage" 
                      />
                      <span className="text-nura-slate/75">😴 Sleep Duration Log</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <input 
                        type="checkbox" 
                        readOnly 
                        checked={wellness?.record?.mood !== undefined && wellness.record.mood !== ""} 
                        className="rounded accent-nura-sage" 
                      />
                      <span className="text-nura-slate/75">😊 Mood Status Log</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <input 
                        type="checkbox" 
                        readOnly 
                        checked={wellness?.record?.energyLevel !== undefined} 
                        className="rounded accent-nura-sage" 
                      />
                      <span className="text-nura-slate/75">⚡ Energy Vitality Log</span>
                    </div>
                  </div>
                </Card>

                {/* Latest Reminders List */}
                <Card variant="glass" className="p-6 flex flex-col gap-4">
                  <h3 className="font-display text-sm font-bold text-nura-slate border-b border-nura-rose-medium/10 pb-2 flex items-center justify-between">
                    <span>Recent Reminders</span>
                    {notifications.length > 0 && (
                      <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping inline-block"></span>
                    )}
                  </h3>

                  {notifications.length === 0 ? (
                    <div className="text-[11px] text-nura-slate/40 text-center py-6 italic">
                      No unread alerts in workspace.
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3">
                      {notifications.map((n) => (
                        <div 
                          key={n.id} 
                          className="p-3 bg-white border border-nura-rose-medium/10 rounded-xl text-xs flex flex-col gap-1"
                        >
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-nura-slate">{n.title}</span>
                            <button 
                              onClick={() => handleMarkRead(n.id)}
                              className="text-[9px] font-bold text-nura-terracotta hover:underline cursor-pointer"
                            >
                              Mark Read
                            </button>
                          </div>
                          <p className="text-nura-slate/75 text-[11px] leading-relaxed">{n.message}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>

              </div>

            </div>
          )
        )}
      </div>
    </AuthShell>
  );
}
