"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useRouter, useSearchParams } from "next/navigation";

function VerifyContent() {
  const searchParams = useSearchParams();
  const rawPhone = searchParams.get("phone") || "";
  const rawEmail = searchParams.get("email") || "";
  const identifier = rawEmail ? decodeURIComponent(rawEmail) : decodeURIComponent(rawPhone);
  
  const [code, setCode] = useState("");
  const [cooldown, setCooldown] = useState(60);
  const [localError, setLocalError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const { verifyOtp, requestOtp, error, clearError } = useAuth();
  const router = useRouter();

  // Redirect if no identifier parameter is found
  useEffect(() => {
    if (!rawPhone && !rawEmail) {
      router.push("/login");
    }
  }, [rawPhone, rawEmail, router]);

  // Cooldown timer logic
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((prev) => prev - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    clearError();

    const trimmedCode = code.trim();
    if (!trimmedCode || trimmedCode.length !== 6) {
      setLocalError("Please enter the 6-digit code.");
      return;
    }

    setIsSubmitting(true);
    try {
      await verifyOtp(identifier, trimmedCode);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "Invalid code. Please try again.";
      setLocalError(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0) return;
    
    setLocalError(null);
    clearError();
    setIsResending(true);
    try {
      await requestOtp(identifier);
      setCooldown(60);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "Failed to resend code. Please try again.";
      setLocalError(errMsg);
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-6 bg-nura-cream">
      <Card variant="glass" className="w-full max-w-md p-8 md:p-10 flex flex-col gap-6">
        <div className="text-center flex flex-col gap-2">
          <span className="font-display font-semibold text-3xl tracking-wide text-nura-slate">
            nura
          </span>
          <h1 className="font-display text-xl font-bold text-nura-slate mt-2">
            Verify Your Account
          </h1>
          <p className="text-sm text-nura-slate/70">
            We sent a 6-digit code to <span className="font-semibold">{identifier}</span>.
          </p>
          {process.env.NODE_ENV === "development" && (
            <p className="text-xs text-nura-terracotta font-medium bg-nura-rose-medium/20 px-3 py-1 rounded-full self-center">
              [DEV ONLY] Check backend console logs to view OTP.
            </p>
          )}
        </div>

        {(localError || error) && (
          <div 
            className="p-4 bg-red-50 border border-red-200 rounded-2xl text-sm text-red-600"
            role="alert"
          >
            {localError || error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label 
              htmlFor="otp-code" 
              className="text-sm font-semibold text-nura-slate/85"
            >
              Verification Code
            </label>
            <input
              id="otp-code"
              type="text"
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength={6}
              autoComplete="one-time-code"
              required
              placeholder="123456"
              value={code}
              onChange={(e) => {
                const val = e.target.value.replace(/[^0-9]/g, "");
                setCode(val);
                if (localError) setLocalError(null);
                clearError();
              }}
              className="w-full px-5 py-3 rounded-full border border-nura-rose-medium/60 bg-white/70 text-nura-slate text-center text-2xl tracking-widest focus:outline-none focus:ring-2 focus:ring-nura-terracotta/40 focus:border-nura-terracotta placeholder:text-nura-slate/20 placeholder:tracking-normal placeholder:text-base"
              disabled={isSubmitting}
            />
          </div>

          <Button 
            type="submit" 
            variant="primary" 
            className="w-full py-3"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Verifying..." : "Verify & Continue"}
          </Button>
        </form>

        <div className="flex flex-col gap-2 text-center text-sm text-nura-slate/60 mt-2">
          {cooldown > 0 ? (
            <p>Resend code in {cooldown}s</p>
          ) : (
            <button
              onClick={handleResend}
              disabled={isResending}
              className="text-nura-terracotta hover:underline font-semibold cursor-pointer disabled:opacity-50"
            >
              {isResending ? "Resending..." : "Resend Verification Code"}
            </button>
          )}
          <button
            onClick={() => router.push("/login")}
            className="text-nura-slate/70 hover:underline mt-2 text-xs"
          >
            Change Phone Number
          </button>
        </div>
      </Card>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={<div className="flex-1 flex items-center justify-center bg-nura-cream text-nura-slate">Loading...</div>}>
      <VerifyContent />
    </Suspense>
  );
}
