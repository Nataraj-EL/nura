"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";

export default function Home() {
  const { user, logout } = useAuth();


  return (
    <div className="min-h-screen flex flex-col justify-between bg-nura-cream">
      {/* Header Navigation */}
      <header className="w-full px-6 py-5 md:px-12 flex justify-between items-center glass-panel sticky top-0 z-40">
        <div className="flex items-center gap-2">
          {/* Logo SVG */}
          <svg
            className="w-8 h-8 text-nura-terracotta"
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15.5h-2v-2h2v2zm0-4.5h-2V7h2v6z" />
          </svg>
          <span className="font-display font-semibold text-2xl tracking-wide text-nura-slate">
            nura
          </span>
        </div>
        
        <nav aria-label="Main Navigation" className="hidden md:flex items-center gap-8">
          <a href="#features" className="text-nura-slate hover:text-nura-terracotta transition-colors font-medium">
            Core Pillars
          </a>
          <a href="#philosophy" className="text-nura-slate hover:text-nura-terracotta transition-colors font-medium">
            Our Philosophy
          </a>
          <a href="#about" className="text-nura-slate hover:text-nura-terracotta transition-colors font-medium">
            Project State
          </a>
        </nav>

        <div className="flex items-center gap-4">
          {user ? (
            <>
              <Link href="/dashboard">
                <Button variant="outline" size="sm">
                  Go to Dashboard
                </Button>
              </Link>
              <Button variant="text" size="sm" onClick={logout} className="text-red-500 hover:text-red-700">
                Sign Out
              </Button>
            </>
          ) : (
            <Link href="/login">
              <Button variant="primary" size="sm">
                Sign In
              </Button>
            </Link>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col gap-20 py-12 md:py-20">
        {/* Hero Section */}
        <section className="px-6 md:px-12 max-w-5xl mx-auto text-center flex flex-col items-center gap-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-nura-rose-medium/30 rounded-full border border-nura-rose-dark/30 text-nura-terracotta text-sm font-semibold tracking-wide uppercase">
            Private Wellness Companion
          </div>
          
          <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-nura-slate max-w-4xl leading-tight">
            A wellness companion that honors your <span className="text-nura-terracotta">biology</span> and respects your <span className="text-nura-terracotta">privacy</span>.
          </h1>
          
          <p className="text-lg md:text-xl text-nura-slate/80 max-w-2xl leading-relaxed">
            Nura is designed to be a quiet, thoughtful observer of your menstrual cycle and wellness. 
            No tracking, no sharing, and no algorithms selling your data. Just secure, local insights built on open foundations.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 mt-4">
            {user ? (
              <Link href="/dashboard">
                <Button variant="primary" size="lg">
                  Open Dashboard
                </Button>
              </Link>
            ) : (
              <Link href="/login">
                <Button variant="primary" size="lg">
                  Get Started
                </Button>
              </Link>
            )}
            <a href="#features">
              <Button variant="outline" size="lg">
                Explore Features
              </Button>
            </a>
          </div>
        </section>

        {/* Feature Cards Section */}
        <section id="features" className="px-6 md:px-12 max-w-6xl mx-auto w-full flex flex-col gap-12">
          <div className="text-center flex flex-col gap-2">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-nura-slate">
              Designed for Mindful Wellness
            </h2>
            <p className="text-base md:text-lg text-nura-slate/75 max-w-xl mx-auto">
              Tracking your body rhythm should be calm, direct, and completely private.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card variant="glass" className="flex flex-col gap-4">
              <div className="w-12 h-12 bg-nura-rose-medium/40 rounded-2xl flex items-center justify-center text-nura-terracotta">
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </div>
              <h3 className="font-display text-xl font-bold text-nura-slate">Privacy by Design</h3>
              <p className="text-nura-slate/85 leading-relaxed text-sm">
                Your records are kept strictly local to your browser and device context. We have no analytics, trackers, or cookies collecting your sensitive details.
              </p>
            </Card>

            <Card variant="glass" className="flex flex-col gap-4">
              <div className="w-12 h-12 bg-nura-sage-light rounded-2xl flex items-center justify-center text-nura-sage">
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                </svg>
              </div>
              <h3 className="font-display text-xl font-bold text-nura-slate">Simple Daily Logs</h3>
              <p className="text-nura-slate/85 leading-relaxed text-sm">
                Log your daily hydration, sleep hours, mood, energy, and physical symptoms in a beautiful, distraction-free environment that centers your well-being.
              </p>
            </Card>

            <Card variant="glass" className="flex flex-col gap-4">
              <div className="w-12 h-12 bg-nura-rose-light rounded-2xl flex items-center justify-center text-nura-terracotta">
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 8v4l3 3" />
                </svg>
              </div>
              <h3 className="font-display text-xl font-bold text-nura-slate">Calm Layouts</h3>
              <p className="text-nura-slate/85 leading-relaxed text-sm">
                Enjoy an interface optimized for clarity and ease-of-use, custom-tailored to help you note observations without clutter or clinical noise.
              </p>
            </Card>
          </div>
        </section>

        {/* Philosophy Section */}
        <section id="philosophy" className="px-6 md:px-12 py-12 bg-nura-rose-light/50 border-y border-nura-rose-medium/20">
          <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center gap-12">
            <div className="flex-1 flex flex-col gap-4">
              <h2 className="font-display text-3xl font-bold text-nura-slate">
                Empowering body literacy through transparent design.
              </h2>
              <p className="text-nura-slate/80 leading-relaxed">
                Nura is designed to help you map, understand, and learn the rhythms of your cycle without feeling pathologized. We combine beautiful, calm typography with secure local data parameters to protect your daily observations.
              </p>
            </div>
            
            <div className="flex-1 w-full max-w-sm">
              <Card variant="default" className="border-2 border-dashed border-nura-rose-dark/40 flex flex-col gap-6 items-center text-center p-8">
                <div className="text-nura-terracotta">
                  <svg className="w-10 h-10 animate-pulse" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-display font-semibold text-lg text-nura-slate">Zero Data Selling</h4>
                  <p className="text-sm text-nura-slate/70 mt-1">
                    Your personal physical symptoms, cycles, and history are saved securely on your device. We do not have access to it, ever.
                  </p>
                </div>
              </Card>
            </div>
          </div>
        </section>

        {/* Current State / About Section */}
        <section id="about" className="px-6 md:px-12 max-w-4xl mx-auto w-full flex flex-col gap-6 text-center">
          <h2 className="font-display text-2xl font-bold text-nura-slate">
            Built on Trust and Transparency
          </h2>
          <p className="text-nura-slate/75">
            Nura is an open-source, privacy-first platform. All your physical data is saved securely in your browser and account context, ensuring you remain in complete control of your health journey.
          </p>
          
          <div className="flex flex-wrap justify-center gap-4 mt-2">
            <span className="px-4 py-1.5 bg-white border border-nura-rose-medium/30 rounded-full text-xs font-semibold text-nura-slate shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
              100% Private Device Storage
            </span>
            <span className="px-4 py-1.5 bg-white border border-nura-rose-medium/30 rounded-full text-xs font-semibold text-nura-slate shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
              No Third-Party Analytics
            </span>
            <span className="px-4 py-1.5 bg-white border border-nura-rose-medium/30 rounded-full text-xs font-semibold text-nura-slate shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
              Secure Session Isolation
            </span>
            <span className="px-4 py-1.5 bg-white border border-nura-rose-medium/30 rounded-full text-xs font-semibold text-nura-slate shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
              Open Source Transparency
            </span>
          </div>
        </section>
      </div>

      {/* Semantic Footer */}
      <footer className="w-full border-t border-nura-rose-medium/30 bg-white py-8 px-6 md:px-12 flex flex-col sm:flex-row justify-between items-center gap-4">
        <p className="text-sm text-nura-slate/60">
          &copy; {new Date().getFullYear()} Nura. Built with privacy and biology in mind.
        </p>
        
        <div className="flex gap-6 text-sm text-nura-slate/60">
          <a href="#" className="hover:text-nura-terracotta transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-nura-terracotta transition-colors">Open Source</a>
          <a href="mailto:support@nura.local" className="hover:text-nura-terracotta transition-colors">Contact</a>
        </div>
      </footer>
    </div>
  );
}
