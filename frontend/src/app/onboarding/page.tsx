"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useRouter } from "next/navigation";

export default function OnboardingPage() {
  const { user, loading, completeOnboarding, error, clearError } = useAuth();
  const router = useRouter();

  const [age, setAge] = useState<number | "">("");
  const [cycleLength, setCycleLength] = useState<number>(28);
  const [periodDuration, setPeriodDuration] = useState<number>(5);
  const [timezone, setTimezone] = useState(() => {
    if (typeof window !== "undefined") {
      try {
        return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
      } catch {
        return "UTC";
      }
    }
    return "UTC";
  });
  const [localError, setLocalError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirect if user is not logged in or has already completed onboarding
  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/login");
      } else if (user.onboardingStatus === "COMPLETED") {
        router.push("/dashboard");
      }
    }
  }, [user, loading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    clearError();

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
      setLocalError("Period duration must be shorter than your total cycle length.");
      return;
    }

    setIsSubmitting(true);
    try {
      await completeOnboarding({
        age: Number(age),
        typicalCycleLength: cycleLength,
        typicalPeriodDuration: periodDuration,
        timezone,
      });
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "Failed to submit onboarding profile. Please check your answers.";
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
      <Card variant="glass" className="w-full max-w-lg p-8 md:p-10 flex flex-col gap-6">
        <div className="text-center flex flex-col gap-2">
          <span className="font-display font-semibold text-3xl tracking-wide text-nura-slate">
            nura
          </span>
          <h1 className="font-display text-xl font-bold text-nura-slate mt-2">
            Establish Your Rhythm
          </h1>
          <p className="text-sm text-nura-slate/70">
            Let&apos;s configure the basics to build your secure, local wellness profile.
          </p>
        </div>

        {(localError || error) && (
          <div 
            className="p-4 bg-red-50 border border-red-200 rounded-2xl text-sm text-red-600"
            role="alert"
          >
            {localError || error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          {/* Age field */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="age" className="text-sm font-semibold text-nura-slate/85">
              Age
            </label>
            <input
              id="age"
              type="number"
              min={10}
              max={120}
              required
              value={age}
              onChange={(e) => {
                const val = e.target.value;
                setAge(val === "" ? "" : Number(val));
                if (localError) setLocalError(null);
                clearError();
              }}
              className="w-full px-5 py-2.5 rounded-full border border-nura-rose-medium/60 bg-white/70 text-nura-slate focus:outline-none focus:ring-2 focus:ring-nura-terracotta/40 focus:border-nura-terracotta"
              placeholder="e.g. 26"
              disabled={isSubmitting}
            />
          </div>

          {/* Cycle Length field */}
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between">
              <label htmlFor="cycle-length" className="text-sm font-semibold text-nura-slate/85">
                Typical Cycle Length
              </label>
              <span className="text-sm font-bold text-nura-terracotta">{cycleLength} days</span>
            </div>
            <input
              id="cycle-length"
              type="range"
              min={10}
              max={100}
              value={cycleLength}
              onChange={(e) => {
                setCycleLength(Number(e.target.value));
                if (localError) setLocalError(null);
                clearError();
              }}
              className="w-full h-2 rounded-lg bg-nura-rose-medium/40 accent-nura-terracotta cursor-pointer"
              disabled={isSubmitting}
            />
            <span className="text-xs text-nura-slate/50 flex justify-between px-1">
              <span>Short (10d)</span>
              <span>Long (100d)</span>
            </span>
          </div>

          {/* Period Duration field */}
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between">
              <label htmlFor="period-duration" className="text-sm font-semibold text-nura-slate/85">
                Typical Period Duration
              </label>
              <span className="text-sm font-bold text-nura-terracotta">{periodDuration} days</span>
            </div>
            <input
              id="period-duration"
              type="range"
              min={1}
              max={20}
              value={periodDuration}
              onChange={(e) => {
                setPeriodDuration(Number(e.target.value));
                if (localError) setLocalError(null);
                clearError();
              }}
              className="w-full h-2 rounded-lg bg-nura-rose-medium/40 accent-nura-terracotta cursor-pointer"
              disabled={isSubmitting}
            />
            <span className="text-xs text-nura-slate/50 flex justify-between px-1">
              <span>1 day</span>
              <span>20 days</span>
            </span>
          </div>

          {/* Timezone field */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="timezone" className="text-sm font-semibold text-nura-slate/85">
              Preferred Timezone
            </label>
            <select
              id="timezone"
              value={timezone}
              onChange={(e) => {
                setTimezone(e.target.value);
                if (localError) setLocalError(null);
                clearError();
              }}
              className="w-full px-5 py-3 rounded-full border border-nura-rose-medium/60 bg-white/70 text-nura-slate focus:outline-none focus:ring-2 focus:ring-nura-terracotta/40 focus:border-nura-terracotta text-base"
              disabled={isSubmitting}
            >
              <option value="UTC">UTC (Universal Coordinated Time)</option>
              <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
              <option value="America/New_York">America/New_York (EST/EDT)</option>
              <option value="America/Los_Angeles">America/Los_Angeles (PST/PDT)</option>
              <option value="Europe/London">Europe/London (GMT/BST)</option>
              <option value="Europe/Paris">Europe/Paris (CET/CEST)</option>
              <option value="Australia/Sydney">Australia/Sydney (AEST/AEDT)</option>
            </select>
          </div>

          <Button 
            type="submit" 
            variant="primary" 
            className="w-full py-3 mt-2"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Completing Profile..." : "Confirm & Open Dashboard"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
