"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    // Log the error to a monitoring console
    console.error("Next.js runtime boundary caught an error:", error);
  }, [error]);

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center bg-nura-cream text-nura-slate min-h-screen">
      <div className="max-w-md p-8 bg-white border border-nura-rose-medium/20 rounded-3xl shadow-xl flex flex-col gap-5 items-center">
        <span className="text-4xl" role="img" aria-label="Error Warning">⚠️</span>
        <h1 className="font-display text-2xl font-bold text-nura-slate">Something went wrong</h1>
        <p className="text-xs text-nura-slate/65 leading-relaxed">
          An unexpected application error occurred. No health or personal data has been compromised. You can try resetting the workspace or logging in again.
        </p>
        <div className="flex gap-3 w-full">
          <Button 
            onClick={() => router.push("/dashboard")}
            variant="outline" 
            className="flex-1 py-2 text-xs font-semibold rounded-full cursor-pointer"
          >
            Go Home
          </Button>
          <Button 
            onClick={() => reset()} 
            variant="primary" 
            className="flex-1 py-2 text-xs font-semibold rounded-full cursor-pointer"
          >
            Try Again
          </Button>
        </div>
      </div>
    </div>
  );
}
