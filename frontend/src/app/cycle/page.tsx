/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import React, { useState, useEffect } from "react";
import { AuthShell } from "@/components/layout/AuthShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PeriodModal } from "@/components/cycle/PeriodModal";
import { apiRequest } from "@/utils/api";

interface CycleState {
  currentCycleDay: number | null;
  periodStatus: "ONGOING" | "ENDED" | "NONE";
  daysSincePeriodEnded: number | null;
  hasRecordedAverages: boolean;
  recordedAverageCycleLength: number | null;
  recordedAveragePeriodDuration: number | null;
  typicalCycleLength: number;
  typicalPeriodDuration: number;
  timezone: string;
}

interface PeriodRecord {
  id: string;
  startDate: string;
  endDate: string | null;
}

export default function CyclePage() {
  const [cycleState, setCycleState] = useState<CycleState | null>(null);
  const [periods, setPeriods] = useState<PeriodRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalData, setModalData] = useState<PeriodRecord | null>(null);

  const fetchCycleData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [stateData, periodsData] = await Promise.all([
        apiRequest("/api/cycle/current"),
        apiRequest("/api/cycle/periods"),
      ]);

      if (stateData) setCycleState(stateData as CycleState);
      if (periodsData) setPeriods(periodsData as PeriodRecord[]);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "Failed to load cycle tracking records.";
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCycleData();
  }, []);

  const handleOpenLogModal = () => {
    setModalData(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (period: PeriodRecord) => {
    setModalData(period);
    setIsModalOpen(true);
  };

  const handleSavePeriod = async (startDate: string, endDate: string | null) => {
    try {
      if (modalData) {
        // Edit flow
        await apiRequest(`/api/cycle/periods/${modalData.id}`, {
          method: "PUT",
          data: { startDate, endDate },
        });
      } else {
        // Create flow
        await apiRequest("/api/cycle/periods", {
          method: "POST",
          data: { startDate, endDate },
        });
      }
      await fetchCycleData();
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "Failed to save period record.";
      throw new Error(errMsg);
    }
  };

  const handleDeletePeriod = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this period log?")) {
      return;
    }

    try {
      setError(null);
      await apiRequest(`/api/cycle/periods/${id}`, {
        method: "DELETE",
      });
      await fetchCycleData();
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "Failed to delete period record.";
      setError(errMsg);
    }
  };

  const formatDisplayDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString(undefined, { 
        month: "short", 
        day: "numeric", 
        year: "numeric",
        timeZone: "UTC" // Force parsing input date as UTC to prevent timezone offsets
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <AuthShell>
      <div className="flex flex-col gap-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="font-display text-3xl font-bold text-nura-slate">
              Cycle tracking
            </h1>
            <p className="text-sm text-nura-slate/60">
              Log your menstrual cycles and view history securely.
            </p>
          </div>

          <Button 
            variant="primary" 
            size="md" 
            onClick={handleOpenLogModal}
            className="cursor-pointer font-semibold shadow-sm hover:scale-[1.01]"
          >
            Log Period
          </Button>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-sm text-red-600" role="alert">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-nura-slate/60 text-sm">Retrieving your cycle log...</div>
        ) : (
          cycleState && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Main Cycle Summary Card */}
              <Card variant="glass" className="md:col-span-2 flex flex-col gap-6 p-8">
                <h2 className="font-display text-lg font-bold text-nura-slate border-b border-nura-rose-medium/20 pb-3 flex items-center justify-between">
                  <span>Your Cycle</span>
                  <span className="text-xs font-mono text-nura-slate/40">Zone: {cycleState.timezone}</span>
                </h2>

                <div className="flex flex-col gap-2">
                  {cycleState.currentCycleDay !== null ? (
                    <>
                      <div className="text-sm text-nura-slate/60 font-semibold tracking-wide uppercase">
                        Current Status
                      </div>
                      <div className="font-display text-5xl font-extrabold text-nura-terracotta my-1">
                        Day {cycleState.currentCycleDay}
                      </div>
                      <p className="text-sm text-nura-slate/85 font-medium mt-1">
                        {cycleState.periodStatus === "ONGOING" ? (
                          <span className="inline-flex items-center gap-1.5 text-nura-terracotta">
                            <span className="w-2.5 h-2.5 rounded-full bg-nura-terracotta inline-block animate-pulse"></span>
                            Period is currently ongoing
                          </span>
                        ) : (
                          <span>
                            Period ended {cycleState.daysSincePeriodEnded} day
                            {cycleState.daysSincePeriodEnded === 1 ? "" : "s"} ago
                          </span>
                        )}
                      </p>
                    </>
                  ) : (
                    <div className="text-center py-10 flex flex-col items-center gap-4 text-nura-slate/60">
                      <svg className="w-12 h-12 text-nura-rose-dark/40" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                      </svg>
                      <div>
                        <p className="font-semibold text-base text-nura-slate">No cycle data logged yet</p>
                        <p className="text-xs mt-1">Tap the &quot;Log Period&quot; button to begin tracing your history.</p>
                      </div>
                    </div>
                  )}
                </div>
              </Card>

              {/* Cycle Statistics Summary */}
              <Card variant="default" className="flex flex-col gap-6 p-8">
                <h3 className="font-display text-lg font-bold text-nura-slate border-b border-nura-rose-medium/20 pb-3">
                  Statistics
                </h3>

                <div className="flex flex-col gap-6">
                  {/* Cycle Length statistics block */}
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-bold text-nura-slate/50 uppercase tracking-wide">
                      Cycle Length
                    </span>
                    <span className="font-display text-3xl font-extrabold text-nura-slate">
                      {cycleState.hasRecordedAverages
                        ? `${cycleState.recordedAverageCycleLength} days`
                        : `${cycleState.typicalCycleLength} days`}
                    </span>
                    <span className="text-[11px] text-nura-slate/60 mt-1">
                      {cycleState.hasRecordedAverages ? (
                        <span className="text-nura-sage font-semibold">Average recorded cycle</span>
                      ) : (
                        <span>Typical estimate (onboarding)</span>
                      )}
                    </span>
                  </div>

                  {/* Period Duration statistics block */}
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-bold text-nura-slate/50 uppercase tracking-wide">
                      Period Duration
                    </span>
                    <span className="font-display text-3xl font-extrabold text-nura-slate">
                      {cycleState.hasRecordedAverages
                        ? `${cycleState.recordedAveragePeriodDuration} days`
                        : `${cycleState.typicalPeriodDuration} days`}
                    </span>
                    <span className="text-[11px] text-nura-slate/60 mt-1">
                      {cycleState.hasRecordedAverages ? (
                        <span className="text-nura-sage font-semibold">Average recorded period</span>
                      ) : (
                        <span>Typical estimate (onboarding)</span>
                      )}
                    </span>
                  </div>
                </div>

                {!cycleState.hasRecordedAverages && (
                  <div className="mt-auto pt-4 border-t border-nura-rose-medium/10 text-[10px] text-nura-slate/55 leading-relaxed">
                    * Recorded averages will be displayed once at least 2 completed periods are logged.
                  </div>
                )}
              </Card>

              {/* Logs History Listing */}
              <div className="md:col-span-3 flex flex-col gap-4 mt-4">
                <h3 className="font-display text-lg font-bold text-nura-slate">
                  Period Log History
                </h3>

                {periods.length === 0 ? (
                  <div className="text-center py-8 bg-white border border-nura-rose-medium/20 rounded-3xl text-nura-slate/50 text-sm">
                    Your history logs are empty. Log your first period start date to configure.
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {periods.slice().reverse().map((period) => (
                      <Card 
                        key={period.id} 
                        variant="default" 
                        className="flex justify-between items-center py-4 px-6 md:px-8 border border-nura-rose-medium/25 hover:border-nura-rose-medium/55 transition-all"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6">
                          <span className="font-medium text-nura-slate/85">
                            {formatDisplayDate(period.startDate)} &mdash;{" "}
                            {period.endDate ? (
                              formatDisplayDate(period.endDate)
                            ) : (
                              <span className="font-bold text-nura-terracotta italic uppercase tracking-wide text-xs">
                                Ongoing
                              </span>
                            )}
                          </span>
                        </div>

                        <div className="flex items-center gap-3">
                          <Button
                            variant="text"
                            size="sm"
                            onClick={() => handleOpenEditModal(period)}
                            className="text-nura-terracotta font-semibold hover:no-underline text-xs"
                            aria-label={`Edit period logged on ${period.startDate}`}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="text"
                            size="sm"
                            onClick={() => handleDeletePeriod(period.id)}
                            className="text-red-500 hover:text-red-700 font-semibold hover:no-underline text-xs"
                            aria-label={`Delete period logged on ${period.startDate}`}
                          >
                            Delete
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )
        )}
      </div>

      {/* Period Logging/Editing Modal Overlay */}
      <PeriodModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSavePeriod}
        initialData={modalData}
      />
    </AuthShell>
  );
}
