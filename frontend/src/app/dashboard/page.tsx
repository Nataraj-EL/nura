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
}

export default function DashboardPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const data = await apiRequest("/api/user/profile");
        if (data) {
          setProfile(data as Profile);
        }
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : "Failed to load your profile settings.";
        setError(errMsg);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  return (
    <AuthShell>
      <div className="flex flex-col gap-8">
        {/* Dashboard Title */}
        <div className="flex flex-col gap-1">
          <h1 className="font-display text-3xl font-bold text-nura-slate">
            Secure Dashboard
          </h1>
          <p className="text-sm text-nura-slate/60">
            Welcome to your secure wellness workspace.
          </p>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-sm text-red-600">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-nura-slate/60 text-sm">Retrieving profile settings...</div>
        ) : (
          profile && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Profile Config Details Card */}
              <Card variant="default" className="flex flex-col gap-6">
                <h2 className="font-display text-xl font-bold text-nura-slate border-b border-nura-rose-medium/20 pb-3">
                  Your Rhythm Profile
                </h2>
                
                <div className="flex flex-col gap-4 text-sm">
                  <div className="flex justify-between items-center py-1">
                    <span className="text-nura-slate/70">Age</span>
                    <span className="font-semibold text-nura-slate">{profile.age} years</span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-nura-slate/70">Typical Cycle Length</span>
                    <span className="font-semibold text-nura-slate">{profile.typicalCycleLength} days</span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-nura-slate/70">Typical Period Duration</span>
                    <span className="font-semibold text-nura-slate">{profile.typicalPeriodDuration} days</span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-nura-slate/70">Timezone</span>
                    <span className="font-mono text-xs bg-nura-rose-medium/10 px-2.5 py-1 rounded text-nura-slate">
                      {profile.timezone}
                    </span>
                  </div>
                </div>
              </Card>

              {/* Security and Current Sprint State Card */}
              <Card variant="glass" className="flex flex-col gap-4 justify-between">
                <div className="flex flex-col gap-3">
                  <div className="w-10 h-10 bg-nura-sage/20 text-nura-sage rounded-2xl flex items-center justify-center">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <h3 className="font-display text-lg font-bold text-nura-slate">
                    Privacy is Active
                  </h3>
                  <p className="text-sm text-nura-slate/80 leading-relaxed">
                    Nura encrypts and checks session tokens using HTTP-only cookies and database-backed records. 
                    Your account is tied strictly to your validated mobile number, securing your logging access for future sprints.
                  </p>
                </div>
                
                <div className="bg-nura-rose-medium/20 border border-nura-rose-dark/20 rounded-2xl p-4 text-xs text-nura-slate/80">
                  <span className="font-bold text-nura-terracotta uppercase tracking-wide block mb-1">
                    Sprint 2 Scope Limits
                  </span>
                  Predictions, symptoms, cycle calculators, and AI recommendations are not active yet.
                </div>
              </Card>
            </div>
          )
        )}
      </div>
    </AuthShell>
  );
}
