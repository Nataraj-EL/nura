"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { requestOtp, error, clearError } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    clearError();

    // Basic client validation
    const trimmedPhone = phoneNumber.trim();
    if (!trimmedPhone) {
      setLocalError("Please enter your phone number.");
      return;
    }

    setIsSubmitting(true);
    try {
      await requestOtp(trimmedPhone);
      
      // Redirect to verification view with phone param
      router.push(`/verify?phone=${encodeURIComponent(trimmedPhone)}`);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "Failed to request code. Please check your phone number format.";
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
            Enter your mobile number to sign in or register securely.
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

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label 
              htmlFor="phone-number" 
              className="text-sm font-semibold text-nura-slate/85"
            >
              Phone Number
            </label>
            <input
              id="phone-number"
              type="tel"
              autoComplete="tel"
              required
              placeholder="e.g. +91 98765 43210"
              value={phoneNumber}
              onChange={(e) => {
                setPhoneNumber(e.target.value);
                if (localError) setLocalError(null);
                clearError();
              }}
              className="w-full px-5 py-3 rounded-full border border-nura-rose-medium/60 bg-white/70 text-nura-slate focus:outline-none focus:ring-2 focus:ring-nura-terracotta/40 focus:border-nura-terracotta text-base placeholder:text-nura-slate/40"
              disabled={isSubmitting}
            />
            <p className="text-xs text-nura-slate/50 px-2">
              <span className="text-nura-terracotta font-semibold">[DEV ONLY]</span> For demo, enter phone number with or without country code.
            </p>
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
