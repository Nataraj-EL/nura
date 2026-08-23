/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import React, { useState, useEffect } from "react";
import { AuthShell } from "@/components/layout/AuthShell";
import { Card } from "@/components/ui/card";
import { apiRequest } from "@/utils/api";

interface CoverageDetails {
  daysInRange: number;
  wellnessDays: number;
  waterDays: number;
  sleepDays: number;
  moodDays: number;
  energyDays: number;
  symptomDays: number;
}

interface InsightCard {
  title: string;
  content: string;
  type: string;
  level: "SUCCESS" | "INFO" | "WARNING";
}

interface InsightsResponse {
  currentLikelyPhase: string;
  currentCycleDay: number | null;
  wellnessLoggingConsistency: number;
  averageWaterIntake: number | null;
  averageSleep: number | null;
  moodDistribution: Record<string, number>;
  energyDistribution: Record<string, number>;
  symptomFrequency: Record<string, number>;
  cyclePeriodTrends: Record<string, unknown>;
  generatedInsightCards: InsightCard[];
  dataCoverage: CoverageDetails;
}

export default function InsightsPage() {
  const [range, setRange] = useState<"7d" | "30d">("7d");
  const [data, setData] = useState<InsightsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInsights = async (selectedRange: "7d" | "30d") => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiRequest(`/api/insights/summary?range=${selectedRange}`);
      if (res) {
        setData(res as InsightsResponse);
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "Failed to load insights summary.";
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInsights(range);
  }, [range]);

  const getLevelColorClass = (level: string) => {
    switch (level) {
      case "SUCCESS":
        return "bg-emerald-50 border-emerald-300 text-emerald-800";
      case "WARNING":
        return "bg-red-50 border-red-300 text-red-800";
      case "INFO":
      default:
        return "bg-sky-50 border-sky-300 text-sky-800";
    }
  };

  const getMoodEmoji = (moodKey: string) => {
    const moods: Record<string, string> = {
      HAPPY: "😊",
      CALM: "😌",
      TIRED: "🥱",
      STRESSED: "😰",
      SAD: "😢",
    };
    return moods[moodKey.toUpperCase()] || "📝";
  };

  return (
    <AuthShell>
      <div className="flex flex-col gap-8">
        
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="font-display text-3xl font-bold text-nura-slate">
              Personalized Insights
            </h1>
            <p className="text-sm text-nura-slate/60">
              Review logging trends and mathematical estimators based strictly on recorded metrics.
            </p>
          </div>

          {/* Range Toggle */}
          <div className="flex bg-nura-rose-medium/20 rounded-full p-1 border border-nura-rose-medium/25" role="tablist">
            <button
              onClick={() => setRange("7d")}
              role="tab"
              aria-selected={range === "7d"}
              className={`px-5 py-1.5 text-xs font-bold rounded-full transition-all cursor-pointer ${
                range === "7d"
                  ? "bg-white text-nura-terracotta shadow-sm"
                  : "text-nura-slate/70 hover:text-nura-slate"
              }`}
            >
              7-Day Overview
            </button>
            <button
              onClick={() => setRange("30d")}
              role="tab"
              aria-selected={range === "30d"}
              className={`px-5 py-1.5 text-xs font-bold rounded-full transition-all cursor-pointer ${
                range === "30d"
                  ? "bg-white text-nura-terracotta shadow-sm"
                  : "text-nura-slate/70 hover:text-nura-slate"
              }`}
            >
              30-Day Trends
            </button>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-sm text-red-600" role="alert">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-nura-slate/60 text-sm">Compiling data statistics...</div>
        ) : (
          data && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Left Column: Cycle & Phase Status (visually separate from wellness stats) */}
              <div className="lg:col-span-1 flex flex-col gap-8">
                
                {/* 🗓️ Cycle Phase Status */}
                <Card variant="glass" className="p-8 flex flex-col gap-5 border border-nura-rose-medium/20">
                  <div className="flex flex-col gap-1 border-b border-nura-rose-medium/10 pb-2">
                    <span className="text-xs font-bold text-nura-slate/40 uppercase tracking-widest">Biological Calendar</span>
                    <h2 className="font-display text-xl font-bold text-nura-slate">🗓️ Cycle & Phase Summary</h2>
                  </div>

                  {data.currentCycleDay !== null ? (
                    <div className="flex flex-col gap-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-nura-slate/70">Likely Phase</span>
                        <span className="font-extrabold text-nura-terracotta text-sm">{data.currentLikelyPhase}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-nura-slate/70">Current Cycle Day</span>
                        <span className="font-bold text-nura-slate">Day {data.currentCycleDay}</span>
                      </div>
                      <div className="flex justify-between items-center border-t border-nura-rose-medium/10 pt-3">
                        <span className="text-xs text-nura-slate/70">Expected Cycle Length</span>
                        <span className="text-xs font-bold text-nura-slate">
                          {String(data.cyclePeriodTrends?.typicalCycleLength ?? 28)} days
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs text-nura-slate/50 text-center py-6">
                      No cycle data logged. Start logging your period records under Cycle Log to retrieve estimators.
                    </div>
                  )}

                  <div className="text-[10px] text-nura-slate/45 leading-relaxed border-t border-nura-rose-medium/10 pt-3">
                    * Cycle tracking operates strictly as a mathematical calculator. Gaps and correlations to wellness indicators are not mapped causally.
                  </div>
                </Card>

                {/* 📊 Data Coverage Checklist */}
                <Card variant="default" className="p-8 flex flex-col gap-4">
                  <div className="flex flex-col gap-1 border-b border-nura-rose-medium/10 pb-2">
                    <span className="text-xs font-bold text-nura-slate/40 uppercase tracking-widest">Logging Coverage</span>
                    <h3 className="font-display text-base font-bold text-nura-slate">Data Check-in Counts</h3>
                  </div>

                  <div className="flex flex-col gap-2.5 text-xs">
                    <div className="flex justify-between py-0.5 border-b border-nura-rose-medium/5">
                      <span className="text-nura-slate/70">Wellness Days (at least 1 metric)</span>
                      <span className="font-bold text-nura-slate">
                        {data.dataCoverage.wellnessDays} / {data.dataCoverage.daysInRange}
                      </span>
                    </div>
                    <div className="flex justify-between py-0.5 border-b border-nura-rose-medium/5">
                      <span className="text-nura-slate/70">💧 Water Records</span>
                      <span className="font-bold text-nura-slate">
                        {data.dataCoverage.waterDays} / {data.dataCoverage.daysInRange}
                      </span>
                    </div>
                    <div className="flex justify-between py-0.5 border-b border-nura-rose-medium/5">
                      <span className="text-nura-slate/70">😴 Sleep Records</span>
                      <span className="font-bold text-nura-slate">
                        {data.dataCoverage.sleepDays} / {data.dataCoverage.daysInRange}
                      </span>
                    </div>
                    <div className="flex justify-between py-0.5 border-b border-nura-rose-medium/5">
                      <span className="text-nura-slate/70">😊 Mood Records</span>
                      <span className="font-bold text-nura-slate">
                        {data.dataCoverage.moodDays} / {data.dataCoverage.daysInRange}
                      </span>
                    </div>
                    <div className="flex justify-between py-0.5 border-b border-nura-rose-medium/5">
                      <span className="text-nura-slate/70">⚡ Energy Records</span>
                      <span className="font-bold text-nura-slate">
                        {data.dataCoverage.energyDays} / {data.dataCoverage.daysInRange}
                      </span>
                    </div>
                    <div className="flex justify-between py-0.5">
                      <span className="text-nura-slate/70">🤕 Symptom Records</span>
                      <span className="font-bold text-nura-slate">
                        {data.dataCoverage.symptomDays} / {data.dataCoverage.daysInRange}
                      </span>
                    </div>
                  </div>
                </Card>

              </div>

              {/* Middle and Right Column: Wellness trends and graphs */}
              <div className="lg:col-span-2 flex flex-col gap-8">
                
                {/* Generated Observational Cards */}
                <div className="flex flex-col gap-4">
                  <h3 className="font-display text-lg font-bold text-nura-slate">
                    Descriptive Observations
                  </h3>
                  {data.generatedInsightCards.map((card, idx) => (
                    <div 
                      key={idx} 
                      className={`p-5 border-l-4 rounded-2xl text-xs leading-relaxed ${getLevelColorClass(card.level)}`}
                      role="alert"
                    >
                      <span className="font-bold block mb-1 uppercase tracking-wider text-[10px]">
                        {card.title}
                      </span>
                      {card.content}
                    </div>
                  ))}
                </div>

                {/* Consistency & Metrics Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
                  
                  {/* Logging Consistency */}
                  <Card variant="default" className="p-6 flex flex-col justify-between items-center text-center gap-3">
                    <span className="text-[10px] font-bold text-nura-slate/40 uppercase">Consistency</span>
                    <div className="relative w-20 h-20 flex items-center justify-center">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle cx="40" cy="40" r="34" className="stroke-nura-rose-medium/20 fill-none" strokeWidth="6" />
                        <circle 
                          cx="40" 
                          cy="40" 
                          r="34" 
                          className="stroke-nura-sage fill-none transition-all duration-500" 
                          strokeWidth="6" 
                          strokeDasharray={2 * Math.PI * 34} 
                          strokeDashoffset={2 * Math.PI * 34 * (1 - data.wellnessLoggingConsistency / 100)} 
                          strokeLinecap="round"
                        />
                      </svg>
                      <span className="absolute font-bold text-sm text-nura-slate">
                        {Math.round(data.wellnessLoggingConsistency)}%
                      </span>
                    </div>
                    <span className="text-[11px] text-nura-slate/50">Days tracked</span>
                  </Card>

                  {/* Water Avg */}
                  <Card variant="default" className="p-6 flex flex-col justify-between items-center text-center gap-3">
                    <span className="text-[10px] font-bold text-nura-slate/40 uppercase">Hydration Avg</span>
                    <div className="my-2">
                      {data.averageWaterIntake !== null ? (
                        <>
                          <span className="text-3xl font-black text-nura-slate">
                            {Math.round(data.averageWaterIntake)}
                          </span>
                          <span className="text-xs text-nura-slate/60 font-semibold block mt-0.5">ml / tracked day</span>
                        </>
                      ) : (
                        <span className="text-xs text-nura-slate/40 italic block py-4">No water logs</span>
                      )}
                    </div>
                    <span className="text-[10px] text-nura-slate/50">Based on {data.dataCoverage.waterDays} days</span>
                  </Card>

                  {/* Sleep Avg */}
                  <Card variant="default" className="p-6 flex flex-col justify-between items-center text-center gap-3">
                    <span className="text-[10px] font-bold text-nura-slate/40 uppercase">Sleep Rest Avg</span>
                    <div className="my-2">
                      {data.averageSleep !== null ? (
                        <>
                          <span className="text-3xl font-black text-nura-slate">
                            {data.averageSleep.toFixed(1)}
                          </span>
                          <span className="text-xs text-nura-slate/60 font-semibold block mt-0.5">hours / tracked day</span>
                        </>
                      ) : (
                        <span className="text-xs text-nura-slate/40 italic block py-4">No sleep logs</span>
                      )}
                    </div>
                    <span className="text-[10px] text-nura-slate/50">Based on {data.dataCoverage.sleepDays} days</span>
                  </Card>

                </div>

                {/* Mood & Energy Distributions (strictly descriptive) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  
                  {/* Mood Bar Graph */}
                  <Card variant="default" className="p-8 flex flex-col gap-4">
                    <div className="flex flex-col gap-1 border-b border-nura-rose-medium/10 pb-2">
                      <span className="text-xs font-bold text-nura-slate/40 uppercase tracking-widest">Descriptive Summary</span>
                      <h4 className="font-display text-base font-bold text-nura-slate">Mood Log Count</h4>
                    </div>

                    {Object.keys(data.moodDistribution).length === 0 ? (
                      <div className="text-xs text-nura-slate/40 italic py-6 text-center">No mood markers logged.</div>
                    ) : (
                      <div className="flex flex-col gap-3 mt-2">
                        {Object.entries(data.moodDistribution).map(([moodKey, count]) => {
                          const maxCount = Math.max(...Object.values(data.moodDistribution));
                          const widthPct = maxCount > 0 ? (count / maxCount) * 100 : 0;
                          return (
                            <div key={moodKey} className="flex flex-col gap-1">
                              <div className="flex justify-between text-xs font-semibold text-nura-slate">
                                <span className="flex items-center gap-1">
                                  <span>{getMoodEmoji(moodKey)}</span>
                                  <span className="uppercase text-[11px] tracking-wide text-nura-slate/75">{moodKey}</span>
                                </span>
                                <span>{count} logs</span>
                              </div>
                              <div className="w-full h-2.5 rounded-full bg-nura-rose-medium/10">
                                <div 
                                  className="h-full rounded-full bg-nura-rose-medium"
                                  style={{ width: `${widthPct}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </Card>

                  {/* Energy Bar Graph */}
                  <Card variant="default" className="p-8 flex flex-col gap-4">
                    <div className="flex flex-col gap-1 border-b border-nura-rose-medium/10 pb-2">
                      <span className="text-xs font-bold text-nura-slate/40 uppercase tracking-widest">Descriptive Summary</span>
                      <h4 className="font-display text-base font-bold text-nura-slate">Energy Level Log Count</h4>
                    </div>

                    {Object.keys(data.energyDistribution).length === 0 ? (
                      <div className="text-xs text-nura-slate/40 italic py-6 text-center">No energy levels logged.</div>
                    ) : (
                      <div className="flex flex-col gap-3 mt-2">
                        {[5, 4, 3, 2, 1].map((lvl) => {
                          const count = data.energyDistribution[lvl] || 0;
                          const maxCount = Math.max(...Object.values(data.energyDistribution));
                          const widthPct = maxCount > 0 ? (count / maxCount) * 100 : 0;
                          return (
                            <div key={lvl} className="flex flex-col gap-1">
                              <div className="flex justify-between text-xs font-semibold text-nura-slate">
                                <span className="text-[11px] font-bold text-nura-slate/75">Level {lvl}</span>
                                <span>{count} logs</span>
                              </div>
                              <div className="w-full h-2.5 rounded-full bg-nura-rose-medium/10">
                                <div 
                                  className="h-full rounded-full bg-nura-terracotta"
                                  style={{ width: `${widthPct}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </Card>

                </div>

                {/* Symptom frequencies chart */}
                <Card variant="default" className="p-8 flex flex-col gap-4">
                  <div className="flex flex-col gap-1 border-b border-nura-rose-medium/10 pb-2">
                    <span className="text-xs font-bold text-nura-slate/40 uppercase tracking-widest">Descriptive Summary</span>
                    <h4 className="font-display text-base font-bold text-nura-slate">Symptom Frequency</h4>
                  </div>

                  {Object.keys(data.symptomFrequency).length === 0 ? (
                    <div className="text-xs text-nura-slate/40 italic py-6 text-center">No symptom markers logged in this range.</div>
                  ) : (
                    <div className="flex flex-col gap-3 mt-2">
                      {Object.entries(data.symptomFrequency).map(([symKey, count]) => {
                        const maxCount = Math.max(...Object.values(data.symptomFrequency));
                        const widthPct = maxCount > 0 ? (count / maxCount) * 100 : 0;
                        return (
                          <div key={symKey} className="flex flex-col gap-1">
                            <div className="flex justify-between text-xs font-semibold text-nura-slate">
                              <span className="uppercase text-[11px] tracking-wide text-nura-slate/75">
                                {symKey.replace("_", " ")}
                              </span>
                              <span>{count} occurrences</span>
                            </div>
                            <div className="w-full h-2.5 rounded-full bg-nura-rose-medium/10">
                              <div 
                                className="h-full rounded-full bg-indigo-400"
                                style={{ width: `${widthPct}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </Card>

              </div>

              {/* Bottom advisory box */}
              <div className="lg:col-span-3 bg-nura-rose-medium/10 border border-nura-rose-dark/15 rounded-3xl p-6 text-xs text-nura-slate/85 leading-relaxed flex items-start gap-4">
                <span className="text-2xl mt-0.5">⚠️</span>
                <div>
                  <span className="font-bold text-nura-terracotta uppercase tracking-wide block mb-1">
                    Calculations & Insights Disclosure
                  </span>
                  Nura is a simplified calendar estimation utility. 
                  All descriptive summaries are observational tallies of your logged data. 
                  Mood distributions, sleep durations, and symptom logs are kept strictly separate from cycle predictions. 
                  Nura never implies biological or causal relationships between hormone states and wellness indicators. 
                  These summaries must not be treated as clinical diagnostics or professional medical recommendations.
                </div>
              </div>

            </div>
          )
        )}
      </div>
    </AuthShell>
  );
}
