/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import React, { useState, useEffect } from "react";

export function PWARegister() {
  const [isOnline, setIsOnline] = useState(true);
  const [showRecovery, setShowRecovery] = useState(false);
  
  // Install Prompt States
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [showIosTip, setShowIosTip] = useState(false);

  useEffect(() => {
    // 1. Browser/Client-only Environment Guard
    if (typeof window === "undefined") return;

    // Set initial network state
    setIsOnline(navigator.onLine);

    // 2. Production Service Worker Registration
    if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js")
        .then((registration) => {
          console.log("Nura Service Worker registered with scope:", registration.scope);
        })
        .catch((error) => {
          console.warn("Nura Service Worker registration failed:", error);
        });
    }

    // 3. Network Connectivity Observers
    const handleOnline = () => {
      setIsOnline(true);
      setShowRecovery(true);
      setTimeout(() => setShowRecovery(false), 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // 4. Install Prompter listeners
    const handleInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      
      const dismissed = localStorage.getItem("nura-install-dismissed");
      if (!dismissed) {
        setShowInstallBanner(true);
      }
    };

    window.addEventListener("beforeinstallprompt", handleInstallPrompt);

    // 5. Platform-specific iOS checkup (Safari on iPhone/iPad)
    const isIos = /iPhone|iPad|iPod/.test(navigator.userAgent);
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches;
    if (isIos && !isStandalone) {
      const iosDismissed = localStorage.getItem("nura-ios-install-dismissed");
      if (!iosDismissed) {
        setShowIosTip(true);
      }
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("beforeinstallprompt", handleInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`PWA Install Choice Outcome: ${outcome}`);
    setDeferredPrompt(null);
    setShowInstallBanner(false);
  };

  const dismissInstallBanner = () => {
    localStorage.setItem("nura-install-dismissed", "true");
    setShowInstallBanner(false);
  };

  const dismissIosTip = () => {
    localStorage.setItem("nura-ios-install-dismissed", "true");
    setShowIosTip(false);
  };

  return (
    <>
      {/* 1. Network Connectivity Banner */}
      {!isOnline && (
        <div 
          className="fixed bottom-16 sm:bottom-6 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-md p-4 bg-amber-50 border border-amber-300 rounded-2xl shadow-xl text-xs text-amber-900 flex items-start gap-3 animate-fade-in"
          role="alert"
        >
          <span className="text-xl">⚠️</span>
          <div>
            <span className="font-bold block mb-0.5">Offline Mode Active</span>
            You are currently offline. Pages use static app cache. Check-in actions are temporarily disabled until network connection is recovered.
          </div>
        </div>
      )}

      {showRecovery && (
        <div 
          className="fixed bottom-16 sm:bottom-6 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-md p-4 bg-emerald-50 border border-emerald-300 rounded-2xl shadow-xl text-xs text-emerald-900 flex items-center gap-3 animate-bounce"
          role="alert"
        >
          <span className="text-xl">✅</span>
          <div>
            <span className="font-bold">Connection Restored!</span> Back online.
          </div>
        </div>
      )}

      {/* 2. Standalone Install App Prompt banner */}
      {showInstallBanner && (
        <div className="fixed bottom-20 sm:bottom-8 right-4 left-4 sm:left-auto sm:w-80 p-5 bg-white border border-nura-rose-medium/30 rounded-3xl shadow-2xl z-50 flex flex-col gap-3 animate-fade-in">
          <div className="flex justify-between items-start">
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] font-bold text-nura-terracotta uppercase tracking-wide">Enhance Experience</span>
              <h4 className="text-sm font-bold text-nura-slate">Install Nura Companion</h4>
            </div>
            <button 
              onClick={dismissInstallBanner}
              className="text-nura-slate/40 hover:text-nura-slate text-lg cursor-pointer"
              aria-label="Dismiss install prompt"
            >
              ✕
            </button>
          </div>
          <p className="text-xs text-nura-slate/60 leading-relaxed">
            Install Nura to launch it instantly from your home screen and run standalone.
          </p>
          <div className="flex gap-2.5">
            <button
              onClick={dismissInstallBanner}
              className="flex-1 py-1.5 text-xs font-semibold text-nura-slate/60 hover:text-nura-slate bg-nura-rose-medium/10 rounded-full cursor-pointer"
            >
              Later
            </button>
            <button
              onClick={handleInstallClick}
              className="flex-1 py-1.5 text-xs font-semibold text-white bg-nura-terracotta hover:bg-nura-terracotta/90 rounded-full cursor-pointer"
            >
              Install
            </button>
          </div>
        </div>
      )}

      {/* 3. iOS share instruction prompter */}
      {showIosTip && (
        <div className="fixed bottom-20 sm:bottom-8 right-4 left-4 sm:left-auto sm:w-80 p-5 bg-white border border-nura-rose-medium/30 rounded-3xl shadow-2xl z-50 flex flex-col gap-3 animate-fade-in">
          <div className="flex justify-between items-start">
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] font-bold text-nura-terracotta uppercase tracking-wide">Add to Home Screen</span>
              <h4 className="text-sm font-bold text-nura-slate">Install on iOS</h4>
            </div>
            <button 
              onClick={dismissIosTip}
              className="text-nura-slate/40 hover:text-nura-slate text-lg cursor-pointer"
              aria-label="Dismiss iOS install prompt"
            >
              ✕
            </button>
          </div>
          <p className="text-xs text-nura-slate/60 leading-relaxed">
            To install Nura on your iPhone: tap the Share button <span className="font-bold">📤</span> at the bottom of Safari, scroll down and select <span className="font-bold">&ldquo;Add to Home Screen&rdquo; ➕</span>.
          </p>
          <button
            onClick={dismissIosTip}
            className="w-full py-1.5 text-xs font-semibold text-white bg-nura-terracotta hover:bg-nura-terracotta/90 rounded-full cursor-pointer"
          >
            Got it
          </button>
        </div>
      )}
    </>
  );
}
