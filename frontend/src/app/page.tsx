"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";

export default function Home() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen flex flex-col justify-between bg-nura-cream text-nura-slate">
      {/* Navigation Header */}
      <header className="w-full px-6 py-4 md:px-12 flex justify-between items-center bg-white border-b border-nura-rose-medium/20 sticky top-0 z-40">
        <div className="flex items-center gap-2">
          {/* Calm organic logo icon */}
          <span className="w-7 h-7 bg-nura-terracotta rounded-full flex items-center justify-center text-white text-xs font-bold font-display shadow-sm">
            n
          </span>
          <span className="font-display font-semibold text-xl tracking-wide text-nura-slate">
            nura
          </span>
        </div>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              <Link href="/dashboard">
                <Button variant="outline" size="sm" className="min-h-[44px]">
                  Dashboard
                </Button>
              </Link>
              <Button 
                variant="text" 
                size="sm" 
                onClick={logout} 
                className="text-red-500 hover:text-red-700 font-semibold min-h-[44px]"
              >
                Sign Out
              </Button>
            </>
          ) : (
            <Link href="/login">
              <Button variant="primary" size="sm" className="min-h-[44px]">
                Sign In
              </Button>
            </Link>
          )}
        </div>
      </header>

      {/* Main Focus Content */}
      <main id="main-content" className="flex-1 flex flex-col justify-center items-center py-12 md:py-24 px-6 max-w-5xl mx-auto w-full gap-16">
        
        {/* Core Hero Section */}
        <section className="text-center flex flex-col items-center gap-6 max-w-3xl">
          <span className="px-3.5 py-1 bg-nura-rose-medium/35 rounded-full text-nura-terracotta text-xs font-bold tracking-wider uppercase">
            Private Wellness Companion
          </span>
          
          <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-tight text-nura-slate">
            A quiet, private companion for your <span className="text-nura-terracotta">body</span> and <span className="text-nura-terracotta">mind</span>.
          </h1>
          
          <p className="text-base sm:text-lg text-nura-slate/85 leading-relaxed max-w-2xl">
            Track your menstrual cycle, daily hydration, rest, and energy levels in a calm, beautiful space. 
            Your health records are stored strictly on your device—never shared, never tracked.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto mt-2">
            {user ? (
              <Link href="/dashboard" className="w-full sm:w-auto">
                <Button variant="primary" size="lg" className="w-full min-h-[44px]">
                  Go to Dashboard
                </Button>
              </Link>
            ) : (
              <Link href="/login" className="w-full sm:w-auto">
                <Button variant="primary" size="lg" className="w-full min-h-[44px]">
                  Get Started
                </Button>
              </Link>
            )}
          </div>
        </section>

        {/* Simplified Three Pillars value prop grid */}
        <section className="w-full grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card variant="glass" className="p-6 flex flex-col gap-3 border border-nura-rose-medium/15">
            <span className="text-2xl" aria-hidden="true">🗓️</span>
            <h2 className="font-display text-lg font-bold text-nura-slate">Cycle Harmony</h2>
            <p className="text-xs text-nura-slate/75 leading-relaxed">
              Understand your cycle rhythm. Monitor your current cycle day, likely phases, and estimated predictions using clear, observational terms.
            </p>
          </Card>

          <Card variant="glass" className="p-6 flex flex-col gap-3 border border-nura-rose-medium/15">
            <span className="text-2xl" aria-hidden="true">💧</span>
            <h2 className="font-display text-lg font-bold text-nura-slate">Daily Check-ins</h2>
            <p className="text-xs text-nura-slate/75 leading-relaxed">
              Keep check on your hydration, sleep hours, mood, energy levels, and physical symptoms in a single simple interface.
            </p>
          </Card>

          <Card variant="glass" className="p-6 flex flex-col gap-3 border border-nura-rose-medium/15">
            <span className="text-2xl" aria-hidden="true">🛡️</span>
            <h2 className="font-display text-lg font-bold text-nura-slate">Local Security</h2>
            <p className="text-xs text-nura-slate/75 leading-relaxed">
              Your health data is saved locally on your device context. No trackers, no advertisements, and no third-party data collection.
            </p>
          </Card>
        </section>

      </main>

      {/* Clean Footer */}
      <footer className="w-full border-t border-nura-rose-medium/20 bg-white py-6 px-6 md:px-12 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-nura-slate/50">
        <p>
          &copy; {new Date().getFullYear()} Nura. Mindful wellness, private by design.
        </p>
        <div className="flex gap-6 font-medium">
          <a href="#" className="hover:text-nura-terracotta transition-colors">Privacy Policy</a>
          <a href="mailto:support@nura.local" className="hover:text-nura-terracotta transition-colors">Contact</a>
        </div>
      </footer>
    </div>
  );
}
