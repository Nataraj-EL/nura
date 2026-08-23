/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/utils/api";

interface ProfileResponse {
  age?: number;
  typicalCycleLength?: number;
  typicalPeriodDuration?: number;
  timezone?: string;
  waterGoal?: number;
  onboardingStatus?: string;
}

export default function OnboardingPage() {
  const { user, loading, checkAuth } = useAuth();
  const router = useRouter();

  // Step indicator state
  const [step, setStep] = useState(1);

  // Step 2 variables: Cycle Basics
  const [age, setAge] = useState<number | "">("");
  const [cycleLength, setCycleLength] = useState<number>(28);
  const [periodDuration, setPeriodDuration] = useState<number>(5);
  const [timezone, setTimezone] = useState("UTC");

  // Step 3 variables: Hydration Goal
  const [waterGoal, setWaterGoal] = useState<number>(2000);

  // Step 4 variables: Notifications
  const [scheduledTime, setScheduledTime] = useState("20:00");
  const [quietStart, setQuietStart] = useState("22:00");
  const [quietEnd, setQuietEnd] = useState("07:00");

  const [localError, setLocalError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchExistingProfile = async () => {
    try {
      const res = await apiRequest("/api/user/profile") as ProfileResponse;
      if (res) {
        if (res.age) setAge(res.age);
        if (res.typicalCycleLength) setCycleLength(res.typicalCycleLength);
        if (res.typicalPeriodDuration) setPeriodDuration(res.typicalPeriodDuration);
        if (res.timezone) setTimezone(res.timezone);
        if (res.waterGoal) setWaterGoal(res.waterGoal);
        if (res.onboardingStatus === "IN_PROGRESS") {
          // Resume at Step 2
          setStep(2);
        }
      }
    } catch {
      // Ignored
    }
  };

  // Check user and resume onboarding status if interrupted
  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/login");
      } else if (user.onboardingStatus === "COMPLETED") {
        router.push("/dashboard");
      } else {
        // Resume check-in state
        if (typeof window !== "undefined") {
          try {
            setTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC");
          } catch {
            setTimezone("UTC");
          }
        }
        
        // Fetch existing partial profile if available
        fetchExistingProfile();
      }
    }
  }, [user, loading, router]);

  const handleNextStep = async () => {
    setLocalError(null);
    if (step === 1) {
      // Mark as IN_PROGRESS on the backend
      try {
        await apiRequest("/api/user/profile", {
          method: "PUT",
          data: { onboardingStatus: "IN_PROGRESS" },
        });
        setStep(2);
      } catch {
        setLocalError("Failed to initialize onboarding session.");
      }
    } else if (step === 2) {
      // Validate cycle inputs
      if (age === "" || age < 10 || age > 120) {
        setLocalError("Please enter a valid age between 10 and 120.");
        return;
      }
      if (cycleLength < 10 || cycleLength > 100) {
        setLocalError("Cycle length must be between 10 and 100 days.");
        return;
      }
      if (periodDuration < 1 || periodDuration > 20) {
        setLocalError("Period duration must be between 1 and 20 days.");
        return;
      }
      if (periodDuration >= cycleLength) {
        setLocalError("Period duration must be shorter than cycle length.");
        return;
      }
      // Save partial step 2
      try {
        await apiRequest("/api/user/profile", {
          method: "PUT",
          data: { age, typicalCycleLength: cycleLength, typicalPeriodDuration: periodDuration, timezone },
        });
        setStep(3);
      } catch {
        setLocalError("Failed to save cycle metrics.");
      }
    } else if (step === 3) {
      if (waterGoal < 0 || waterGoal > 20000) {
        setLocalError("Water goal must be between 0 and 20,000 ml.");
        return;
      }
      // Save partial step 3
      try {
        await apiRequest("/api/user/profile", {
          method: "PUT",
          data: { waterGoal },
        });
        setStep(4);
      } catch {
        setLocalError("Failed to save hydration goal.");
      }
    }
  };

  const handleComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    setIsSubmitting(true);

    try {
      // 1. Save profile as COMPLETED
      await apiRequest("/api/user/profile", {
        method: "PUT",
        data: { onboardingStatus: "COMPLETED" },
      });

      // 2. Save notification preferences
      await apiRequest("/api/notifications/preferences", {
        method: "PUT",
        data: {
          scheduledTime,
          quietHoursStart: quietStart,
          quietHoursEnd: quietEnd,
        },
      });

      // 3. Sync User Context and Navigate Home
      await checkAuth();
      router.push("/dashboard");
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "Failed to complete profile configuration.";
      setLocalError(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-nura-cream text-nura-slate">
        Loading...
      </div>
    );
  }

  return (
    <div className="flex-1 flex items-center justify-center p-6 bg-nura-cream py-12 md:py-20">
      <Card variant="glass" className="w-full max-w-lg p-8 md:p-10 flex flex-col gap-6 relative">
        
        {/* Progress Bar Header */}
        <div className="flex flex-col gap-3">
          <div className="flex justify-between items-center text-[10px] font-bold text-nura-slate/40 uppercase tracking-widest">
            <span>Step {step} of 4</span>
            <span>{Math.round((step / 4) * 100)}% Complete</span>
          </div>
          <div className="w-full h-1.5 bg-nura-rose-medium/20 rounded-full overflow-hidden">
            <div 
              className="h-full bg-nura-terracotta transition-all duration-300"
              style={{ width: `${(step / 4) * 100}%` }}
            />
          </div>
        </div>

        {localError && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-600" role="alert">
            {localError}
          </div>
        )}

        {/* Step 1: Welcome & Overview */}
        {step === 1 && (
          <div className="flex flex-col gap-5">
            <div className="text-center flex flex-col gap-2">
              <span className="font-display font-semibold text-3xl tracking-wide text-nura-slate">nura</span>
              <h1 className="font-display text-xl font-bold text-nura-slate mt-2">Welcome to Nura</h1>
              <p className="text-xs text-nura-slate/60 leading-relaxed max-w-xs mx-auto">
                Your private, local companion to cycle tracking, hydration monitoring, and somatic literacy.
              </p>
            </div>

            <div className="p-4 bg-nura-rose-medium/10 border border-nura-rose-medium/20 rounded-2xl text-xs text-nura-slate/75 leading-relaxed flex flex-col gap-2">
              <span className="font-bold text-nura-terracotta uppercase text-[10px] tracking-wide">Privacy Statement</span>
              Nura is built around complete local sovereignty. Your logged health data, sleep parameters, and calendar estimations stay strictly on your device or secure local database. We never sell, share, or analyze your entries.
            </div>

            <Button onClick={handleNextStep} variant="primary" className="w-full py-3 mt-4">
              Get Started
            </Button>
          </div>
        )}

        {/* Step 2: Cycle Basics */}
        {step === 2 && (
          <div className="flex flex-col gap-5">
            <div className="text-center flex flex-col gap-1 border-b border-nura-rose-medium/10 pb-3">
              <h2 className="font-display text-lg font-bold text-nura-slate">Establish Your Rhythm</h2>
              <p className="text-xs text-nura-slate/50">These estimations build your baseline predictions calendar.</p>
            </div>

            <div className="flex flex-col gap-4">
              {/* Age */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="age" className="text-xs font-bold text-nura-slate/85">Age</label>
                <input
                  id="age"
                  type="number"
                  min={10}
                  max={120}
                  value={age}
                  onChange={(e) => setAge(e.target.value === "" ? "" : Number(e.target.value))}
                  className="w-full px-5 py-2 rounded-full border border-nura-rose-medium/40 bg-white/70 text-xs text-nura-slate focus:outline-none focus:ring-1 focus:ring-nura-terracotta"
                  placeholder="e.g. 26"
                />
              </div>

              {/* Cycle length slider */}
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between text-xs font-bold text-nura-slate/85">
                  <label htmlFor="cycle-len">Typical Cycle Length</label>
                  <span className="text-nura-terracotta">{cycleLength} days</span>
                </div>
                <input
                  id="cycle-len"
                  type="range"
                  min={10}
                  max={100}
                  value={cycleLength}
                  onChange={(e) => setCycleLength(Number(e.target.value))}
                  className="w-full h-1.5 bg-nura-rose-medium/30 accent-nura-terracotta rounded cursor-pointer"
                />
              </div>

              {/* Period duration slider */}
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between text-xs font-bold text-nura-slate/85">
                  <label htmlFor="period-dur">Typical Period Duration</label>
                  <span className="text-nura-terracotta">{periodDuration} days</span>
                </div>
                <input
                  id="period-dur"
                  type="range"
                  min={1}
                  max={20}
                  value={periodDuration}
                  onChange={(e) => setPeriodDuration(Number(e.target.value))}
                  className="w-full h-1.5 bg-nura-rose-medium/30 accent-nura-terracotta rounded cursor-pointer"
                />
              </div>

              {/* Timezone */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="tz" className="text-xs font-bold text-nura-slate/85">Timezone</label>
                <select
                  id="tz"
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="w-full px-4 py-2 border border-nura-rose-medium/40 bg-white text-xs rounded-full focus:outline-none"
                >
                  <option value="UTC">UTC</option>
                  <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                  <option value="America/New_York">America/New_York (EST)</option>
                  <option value="America/Los_Angeles">America/Los_Angeles (PST)</option>
                  <option value="Europe/London">Europe/London (GMT)</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-4">
              <Button onClick={() => setStep(1)} variant="outline" className="flex-1 py-3">Back</Button>
              <Button onClick={handleNextStep} variant="primary" className="flex-1 py-3">Next</Button>
            </div>
          </div>
        )}

        {/* Step 3: Wellness & Hydration */}
        {step === 3 && (
          <div className="flex flex-col gap-5">
            <div className="text-center flex flex-col gap-1 border-b border-nura-rose-medium/10 pb-3">
              <h2 className="font-display text-lg font-bold text-nura-slate">💧 Personal Hydration Target</h2>
              <p className="text-xs text-nura-slate/50">Water metrics remain strictly a personal tracking benchmark.</p>
            </div>

            <p className="text-xs text-nura-slate/60 leading-relaxed text-center">
              Configure a personal daily water goal to motivate hydration tracking. Nura logs hydration metrics descriptively and does not prescribe clinical goals.
            </p>

            <div className="flex flex-col gap-2 items-center my-4">
              <label htmlFor="water-goal-input" className="text-xs font-bold text-nura-slate/80">Daily Water Target (ml)</label>
              <div className="flex items-center gap-3">
                <input
                  id="water-goal-input"
                  type="number"
                  min={0}
                  max={10000}
                  step={250}
                  value={waterGoal}
                  onChange={(e) => setWaterGoal(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-32 px-4 py-2 text-lg font-bold border border-nura-rose-medium/40 bg-white text-center rounded-2xl focus:outline-none focus:ring-1 focus:ring-nura-terracotta"
                />
                <span className="text-xs text-nura-slate/50 font-semibold">ml</span>
              </div>
            </div>

            <div className="flex gap-3 mt-4">
              <Button onClick={() => setStep(2)} variant="outline" className="flex-1 py-3">Back</Button>
              <Button onClick={handleNextStep} variant="primary" className="flex-1 py-3">Next</Button>
            </div>
          </div>
        )}

        {/* Step 4: Notification preferences */}
        {step === 4 && (
          <form onSubmit={handleComplete} className="flex flex-col gap-5">
            <div className="text-center flex flex-col gap-1 border-b border-nura-rose-medium/10 pb-3">
              <h2 className="font-display text-lg font-bold text-nura-slate">🔔 Reminders & Quiet Hours</h2>
              <p className="text-xs text-nura-slate/50">Mute scheduled reminders during sleep hours.</p>
            </div>

            <div className="flex flex-col gap-4">
              {/* Daily Reminder Time */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="reminder-time" className="text-xs font-bold text-nura-slate/85">Preferred Check-in Time</label>
                <input
                  id="reminder-time"
                  type="time"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  className="w-full px-4 py-2 border border-nura-rose-medium/40 bg-white text-xs rounded-full focus:outline-none"
                />
              </div>

              {/* Quiet hours start / end */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="quiet-start" className="text-xs font-bold text-nura-slate/85">Quiet Hours Start</label>
                  <input
                    id="quiet-start"
                    type="time"
                    value={quietStart}
                    onChange={(e) => setQuietStart(e.target.value)}
                    className="w-full px-4 py-2 border border-nura-rose-medium/40 bg-white text-xs rounded-full focus:outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="quiet-end" className="text-xs font-bold text-nura-slate/85">Quiet Hours End</label>
                  <input
                    id="quiet-end"
                    type="time"
                    value={quietEnd}
                    onChange={(e) => setQuietEnd(e.target.value)}
                    className="w-full px-4 py-2 border border-nura-rose-medium/40 bg-white text-xs rounded-full focus:outline-none"
                  />
                </div>
              </div>

              <div className="text-[10px] text-nura-slate/50 leading-relaxed mt-1">
                * Quiet Hours temporarily keep notifications in a &ldquo;PENDING&rdquo; state in the database, automatically staging delivery immediately when the quiet window ends.
              </div>
            </div>

            <div className="flex gap-3 mt-4">
              <Button type="button" onClick={() => setStep(3)} variant="outline" className="flex-1 py-3" disabled={isSubmitting}>Back</Button>
              <Button type="submit" variant="primary" className="flex-1 py-3" disabled={isSubmitting}>
                {isSubmitting ? "Finishing..." : "Complete"}
              </Button>
            </div>
          </form>
        )}

      </Card>
    </div>
  );
}
