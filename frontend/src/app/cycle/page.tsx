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

interface PhaseState {
  currentCycleDay: number | null;
  phase: string;
  phaseStart: string | null;
  estimatedPhaseEnd: string | null;
  estimationStatus: "ESTIMATED" | "CALCULATED" | "NO_DATA";
  cycleLengthUsed: number | null;
  explanation: string;
}

export default function CyclePage() {
  const [cycleState, setCycleState] = useState<CycleState | null>(null);
  const [phaseState, setPhaseState] = useState<PhaseState | null>(null);
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
      const [stateData, periodsData, phaseData] = await Promise.all([
        apiRequest("/api/cycle/current"),
        apiRequest("/api/cycle/periods"),
        apiRequest("/api/cycle/phase"),
      ]);

      if (stateData) setCycleState(stateData as CycleState);
      if (periodsData) setPeriods(periodsData as PeriodRecord[]);
      if (phaseData) setPhaseState(phaseData as PhaseState);
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
        timeZone: "UTC"
      });
    } catch {
      return dateStr;
    }
  };

  // Helper to draw segment path
  const makeSegmentPath = (startPercent: number, endPercent: number, radius: number) => {
    // Offset by -0.25 (90 degrees) to start arc at the top of circle
    const startAngle = startPercent - 0.25;
    const endAngle = endPercent - 0.25;

    const startX = 100 + radius * Math.cos(2 * Math.PI * startAngle);
    const startY = 100 + radius * Math.sin(2 * Math.PI * startAngle);
    const endX = 100 + radius * Math.cos(2 * Math.PI * endAngle);
    const endY = 100 + radius * Math.sin(2 * Math.PI * endAngle);

    const largeArcFlag = endPercent - startPercent > 0.5 ? 1 : 0;

    return `M ${startX} ${startY} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endX} ${endY}`;
  };

  const getPhaseColorClass = (phaseName: string) => {
    switch (phaseName) {
      case "Likely Menstrual Phase":
        return "text-red-500 border-red-200 bg-red-50";
      case "Likely Follicular Phase":
        return "text-emerald-600 border-emerald-200 bg-emerald-50";
      case "Estimated Ovulatory Window":
        return "text-amber-500 border-amber-200 bg-amber-50";
      case "Likely Luteal Phase":
        return "text-indigo-500 border-indigo-200 bg-indigo-50";
      default:
        return "text-nura-slate/60 border-nura-rose-medium/25 bg-nura-cream";
    }
  };

  const getPhaseIcon = (phaseName: string) => {
    switch (phaseName) {
      case "Likely Menstrual Phase":
        return "🩸";
      case "Likely Follicular Phase":
        return "🌱";
      case "Estimated Ovulatory Window":
        return "✨";
      case "Likely Luteal Phase":
        return "🌙";
      default:
        return "🗓️";
    }
  };

  // Build values for SVG Cycle Wheel
  const renderCycleWheel = () => {
    if (!phaseState || !phaseState.cycleLengthUsed || !phaseState.currentCycleDay) return null;

    const L = phaseState.cycleLengthUsed;
    const D = phaseState.currentCycleDay;
    const profileP = cycleState?.typicalPeriodDuration || 5;
    const P = cycleState?.hasRecordedAverages 
      ? (cycleState.recordedAveragePeriodDuration || profileP) 
      : (cycleState?.typicalPeriodDuration || 5);

    // Encapsulated boundary rules matching the backend
    const mEnd = P;
    const fEnd = Math.max(P, L - 16);
    const oEnd = Math.max(fEnd + 1, L - 12);
    const lEnd = L;

    // Compute size percentages
    const mPct = mEnd / L;
    const fPct = (fEnd - mEnd) / L;
    const oPct = (oEnd - fEnd) / L;
    const lPct = (lEnd - oEnd) / L;

    const mStartPct = 0;
    const fStartPct = mPct;
    const oStartPct = mPct + fPct;
    const lStartPct = mPct + fPct + oPct;

    // Current dot coordinates
    const currentPct = (Math.min(D, L) - 0.5) / L - 0.25;
    const dotX = 100 + 75 * Math.cos(2 * Math.PI * currentPct);
    const dotY = 100 + 75 * Math.sin(2 * Math.PI * currentPct);

    const currentPhase = phaseState.phase;

    return (
      <div className="flex flex-col items-center gap-6">
        <div className="relative w-64 h-64">
          <svg 
            viewBox="0 0 200 200" 
            className="w-full h-full drop-shadow-sm"
            role="img"
            aria-label={`Cycle calendar estimation ring. Currently Day ${D} of a ${L}-day cycle in ${currentPhase}.`}
          >
            {/* Inner text background */}
            <circle cx="100" cy="100" r="60" className="fill-white" />

            {/* Menstrual Phase (Solid Red) */}
            <path
              d={makeSegmentPath(mStartPct, mStartPct + mPct, 75)}
              fill="none"
              stroke="#ef4444"
              strokeWidth="10"
              strokeLinecap="round"
              className={currentPhase === "Likely Menstrual Phase" ? "stroke-[14px]" : "opacity-80"}
            />

            {/* Follicular Phase (Dashed Green) */}
            <path
              d={makeSegmentPath(fStartPct, fStartPct + fPct, 75)}
              fill="none"
              stroke="#10b981"
              strokeWidth="10"
              strokeDasharray="6 3"
              strokeLinecap="round"
              className={currentPhase === "Likely Follicular Phase" ? "stroke-[14px]" : "opacity-80"}
            />

            {/* Ovulatory Window (Solid Gold with distinct indicators) */}
            <path
              d={makeSegmentPath(oStartPct, oStartPct + oPct, 75)}
              fill="none"
              stroke="#f59e0b"
              strokeWidth="12"
              className={currentPhase === "Estimated Ovulatory Window" ? "stroke-[16px]" : "opacity-80"}
            />

            {/* Luteal Phase (Dotted Indigo) */}
            <path
              d={makeSegmentPath(lStartPct, lStartPct + lPct, 75)}
              fill="none"
              stroke="#6366f1"
              strokeWidth="10"
              strokeDasharray="1 3"
              strokeLinecap="round"
              className={currentPhase === "Likely Luteal Phase" ? "stroke-[14px]" : "opacity-80"}
            />

            {/* Current day indicator dot */}
            <circle
              cx={dotX}
              cy={dotY}
              r="7"
              className="fill-nura-slate stroke-white stroke-2 shadow"
            />

            {/* Central summary inside wheel */}
            <text x="100" y="95" textAnchor="middle" className="font-display font-bold text-sm fill-nura-slate/50 uppercase tracking-wide">
              Day
            </text>
            <text x="100" y="132" textAnchor="middle" className="font-display font-extrabold text-4xl fill-nura-slate">
              {D}
            </text>
          </svg>
        </div>

        {/* Legend listing: accessible explanation and keyboard fallback */}
        <div className="w-full flex flex-col gap-2.5 text-xs font-medium text-nura-slate/85" aria-label="Cycle phases details">
          <div className="flex justify-between items-center px-4 py-2 rounded-xl bg-red-50/50 border-l-4 border-red-500">
            <span className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block"></span>
              <span>Likely Menstrual Phase (Solid stroke)</span>
            </span>
            <span className="font-bold text-nura-slate/75">Days 1 - {mEnd}</span>
          </div>

          <div className="flex justify-between items-center px-4 py-2 rounded-xl bg-emerald-50/50 border-l-4 border-emerald-500">
            <span className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
              <span>Likely Follicular Phase (Dashed stroke)</span>
            </span>
            <span className="font-bold text-nura-slate/75">Days {mEnd + 1} - {fEnd}</span>
          </div>

          <div className="flex justify-between items-center px-4 py-2 rounded-xl bg-amber-50/50 border-l-4 border-amber-500">
            <span className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span>
              <span>Estimated Ovulatory Window (Thick stroke)</span>
            </span>
            <span className="font-bold text-nura-slate/75">Days {fEnd + 1} - {oEnd}</span>
          </div>

          <div className="flex justify-between items-center px-4 py-2 rounded-xl bg-indigo-50/50 border-l-4 border-indigo-500">
            <span className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 inline-block"></span>
              <span>Likely Luteal Phase (Dotted stroke)</span>
            </span>
            <span className="font-bold text-nura-slate/75">Days {oEnd + 1} - {L}</span>
          </div>
        </div>
      </div>
    );
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
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column: Visual Wheel Dial */}
              <Card variant="glass" className="lg:col-span-1 flex flex-col gap-6 p-8 items-center justify-center">
                <h3 className="font-display text-lg font-bold text-nura-slate self-start border-b border-nura-rose-medium/20 pb-2 w-full text-left">
                  Cycle Visualizer
                </h3>
                {phaseState && phaseState.phase !== "UNKNOWN" ? (
                  renderCycleWheel()
                ) : (
                  <div className="text-center py-12 text-sm text-nura-slate/50">
                    Log a period to visualize your cycle ring.
                  </div>
                )}
              </Card>

              {/* Middle Column: Current likely phase and statistics details */}
              <div className="lg:col-span-2 flex flex-col gap-8">
                {phaseState && phaseState.phase !== "UNKNOWN" && (
                  <Card 
                    variant="default" 
                    className={`flex flex-col gap-5 p-8 border-l-8 ${getPhaseColorClass(phaseState.phase)}`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{getPhaseIcon(phaseState.phase)}</span>
                      <div>
                        <span className="text-xs font-extrabold uppercase tracking-widest text-nura-slate/40">Likely Current Phase</span>
                        <h2 className="font-display text-2xl font-black text-nura-slate leading-tight">
                          {phaseState.phase}
                        </h2>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-nura-rose-medium/10 pt-4 text-sm">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-xs font-bold text-nura-slate/40">Estimated Start Date</span>
                        <span className="font-semibold text-nura-slate">{phaseState.phaseStart ? formatDisplayDate(phaseState.phaseStart) : "-"}</span>
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-xs font-bold text-nura-slate/40">Estimated End Date</span>
                        <span className="font-semibold text-nura-slate">{phaseState.estimatedPhaseEnd ? formatDisplayDate(phaseState.estimatedPhaseEnd) : "-"}</span>
                      </div>
                    </div>

                    <p className="text-sm text-nura-slate/75 leading-relaxed bg-white/40 p-4 rounded-2xl border border-white/50">
                      {phaseState.explanation}
                    </p>
                  </Card>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  {/* General Stats details */}
                  <Card variant="default" className="flex flex-col gap-5 p-8">
                    <h3 className="font-display text-base font-bold text-nura-slate border-b border-nura-rose-medium/10 pb-2">
                      Calendar Estimator
                    </h3>

                    <div className="flex flex-col gap-4">
                      <div className="flex justify-between items-center py-1 border-b border-nura-rose-medium/5">
                        <span className="text-sm text-nura-slate/70">Expected Cycle Length</span>
                        <span className="font-bold text-nura-slate">
                          {phaseState?.cycleLengthUsed || cycleState.typicalCycleLength} days
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-1">
                        <span className="text-sm text-nura-slate/70">Estimation Status</span>
                        <span className="text-xs font-bold font-mono px-2.5 py-0.5 rounded bg-nura-rose-medium/20 text-nura-terracotta">
                          {phaseState?.estimationStatus || "NO_DATA"}
                        </span>
                      </div>
                    </div>
                  </Card>

                  {/* Onboarding Estimates / Averages details */}
                  <Card variant="default" className="flex flex-col gap-5 p-8">
                    <h3 className="font-display text-base font-bold text-nura-slate border-b border-nura-rose-medium/10 pb-2">
                      Stats Metrics
                    </h3>
                    <div className="flex flex-col gap-3 text-xs text-nura-slate/70 leading-relaxed">
                      <div className="flex justify-between">
                        <span>Profile Target Cycle:</span>
                        <span className="font-bold text-nura-slate">{cycleState.typicalCycleLength} days</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Profile Target Period:</span>
                        <span className="font-bold text-nura-slate">{cycleState.typicalPeriodDuration} days</span>
                      </div>
                      {cycleState.hasRecordedAverages ? (
                        <div className="mt-2 text-nura-sage font-semibold border-t border-nura-rose-medium/15 pt-2">
                          ✓ Calculated averages are running on your actual historical logging data.
                        </div>
                      ) : (
                        <div className="mt-2 text-nura-slate/50 border-t border-nura-rose-medium/15 pt-2">
                          * Setup averages by logging 2 or more complete period cycles.
                        </div>
                      )}
                    </div>
                  </Card>
                </div>
              </div>

              {/* Full Width bottom disclaimer */}
              {phaseState && phaseState.phase !== "UNKNOWN" && (
                <div className="lg:col-span-3 bg-nura-rose-medium/10 border border-nura-rose-dark/15 rounded-3xl p-6 text-xs text-nura-slate/85 leading-relaxed flex items-start gap-4">
                  <span className="text-2xl mt-0.5">⚠️</span>
                  <div>
                    <span className="font-bold text-nura-terracotta uppercase tracking-wide block mb-1">
                      Calendar Estimation Disclaimer
                    </span>
                    These calculations are strictly mathematical estimates based on your typical cycle parameters and logged periods. 
                    Calendar calculations cannot detect biological ovulation, body temperature shifts, or hormone surges. 
                    Do not rely on these estimations for contraception, pregnancy planning, or medical decisions.
                  </div>
                </div>
              )}

              {/* Logs History Listing (from Sprint 3) */}
              <div className="lg:col-span-3 flex flex-col gap-4 mt-4">
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
