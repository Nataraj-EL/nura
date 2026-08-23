/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { apiRequest } from "@/utils/api";
import { useRouter } from "next/navigation";

interface User {
  id: string;
  phoneNumber: string;
  status: string;
  onboardingStatus: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  requestOtp: (phoneNumber: string) => Promise<void>;
  verifyOtp: (phoneNumber: string, code: string) => Promise<void>;
  logout: () => Promise<void>;
  completeOnboarding: (data: {
    age: number;
    typicalCycleLength: number;
    typicalPeriodDuration: number;
    timezone: string;
  }) => Promise<void>;
  clearError: () => void;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const clearError = () => setError(null);

  const checkAuth = async () => {
    try {
      setLoading(true);
      const data = await apiRequest("/api/auth/me");
      if (data && data.phoneNumber) {
        setUser({
          id: data.id as string,
          phoneNumber: data.phoneNumber as string,
          status: data.status as string,
          onboardingStatus: data.onboardingStatus as string,
        });
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const requestOtp = async (phoneNumber: string) => {
    try {
      setError(null);
      await apiRequest("/api/auth/login", {
        method: "POST",
        data: { phoneNumber },
      });
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "Failed to send code. Please try again.";
      setError(errMsg);
      throw err;
    }
  };

  const verifyOtp = async (phoneNumber: string, code: string) => {
    try {
      setError(null);
      const data = await apiRequest("/api/auth/verify", {
        method: "POST",
        data: { phoneNumber, code },
      });

      if (data) {
        // Authenticated successfully, fetch the complete profile state
        await checkAuth();
        
        if ((data as { onboardingStatus: string }).onboardingStatus === "PENDING") {
          router.push("/onboarding");
        } else {
          router.push("/dashboard");
        }
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "Invalid verification code.";
      setError(errMsg);
      throw err;
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      await apiRequest("/api/auth/logout", { method: "POST" });
    } catch {
      // Proceed with local logout cleanup even if server call fails
    } finally {
      setUser(null);
      setLoading(false);
      router.push("/login");
    }
  };

  const completeOnboarding = async (data: {
    age: number;
    typicalCycleLength: number;
    typicalPeriodDuration: number;
    timezone: string;
  }) => {
    try {
      setError(null);
      const response = await apiRequest("/api/user/profile", {
        method: "PUT",
        data,
      });
      
      if (response) {
        setUser((prev) =>
          prev
            ? {
                ...prev,
                status: "ACTIVE",
                onboardingStatus: "COMPLETED",
              }
            : null
        );
        router.push("/dashboard");
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "Failed to update profile settings.";
      setError(errMsg);
      throw err;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        requestOtp,
        verifyOtp,
        logout,
        completeOnboarding,
        clearError,
        checkAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
