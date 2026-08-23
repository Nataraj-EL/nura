"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { requestOtp, error, clearError } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    clearError();

    // Basic client validation
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setLocalError("Please enter your email address.");
      return;
    }
    if (!trimmedEmail.includes("@")) {
      setLocalError("Please enter a valid email address.");
      return;
    }

    setIsSubmitting(true);
    try {
      await requestOtp(trimmedEmail);
      
      // Redirect to verification view with email param
      router.push(`/verify?email=${encodeURIComponent(trimmedEmail)}`);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "Failed to request code. Please check your email address format.";
      setLocalError(errMsg);
    } finally {
      setIsSubmitting(false);
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
            Welcome to Nura
          </h1>
          <p className="text-sm text-nura-slate/70">
            Enter your email address to sign in or register securely.
          </p>
          {process.env.NODE_ENV === "development" && (
            <p className="text-[11px] text-nura-terracotta font-medium bg-nura-rose-medium/20 px-3 py-1.5 rounded-2xl self-center text-center">
              [DEV ONLY] OTP will be printed to the backend console logs.
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
              htmlFor="email-address" 
              className="text-sm font-semibold text-nura-slate/85"
            >
              Email Address
            </label>
            <input
              id="email-address"
              type="email"
              autoComplete="email"
              required
              placeholder="e.g. name@example.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (localError) setLocalError(null);
                clearError();
              }}
              className="w-full px-5 py-3 rounded-full border border-nura-rose-medium/60 bg-white/70 text-nura-slate focus:outline-none focus:ring-2 focus:ring-nura-terracotta/40 focus:border-nura-terracotta text-base placeholder:text-nura-slate/40"
              disabled={isSubmitting}
            />
            {process.env.NODE_ENV === "development" && (
              <p className="text-xs text-nura-slate/50 px-2">
                <span className="text-nura-terracotta font-semibold">[DEV ONLY]</span> For demo, enter any valid email address format.
              </p>
            )}
          </div>

          <Button 
            type="submit" 
            variant="primary" 
            className="w-full py-3"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Sending..." : "Send Verification Code"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
