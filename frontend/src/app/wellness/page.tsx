/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import React, { useState, useEffect } from "react";
import { AuthShell } from "@/components/layout/AuthShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/utils/api";

interface DailyRecord {
  id?: string;
  recordDate: string;
  waterIntake?: number;
  mood?: string;
  energyLevel?: number;
  sleepDurationMinutes?: number;
  symptoms?: string[];
  note?: string;
}

interface TodayResponse {
  exists: boolean;
  recordDate: string;
  record?: DailyRecord;
}

export default function WellnessPage() {
  const [recordDate, setRecordDate] = useState("");
  const [water, setWater] = useState(0);
  const [waterGoal, setWaterGoal] = useState(2000); // Personal Goal (ml)
  const [mood, setMood] = useState("");
  const [energy, setEnergy] = useState<number | null>(null);
  const [sleepHours, setSleepHours] = useState("");
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const [history, setHistory] = useState<DailyRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const allowedMoods = [
    { key: "HAPPY", label: "Happy", emoji: "😊" },
    { key: "CALM", label: "Calm", emoji: "😌" },
    { key: "TIRED", label: "Tired", emoji: "🥱" },
    { key: "STRESSED", label: "Stressed", emoji: "😰" },
    { key: "SAD", label: "Sad", emoji: "😢" },
  ];

  const allowedSymptoms = [
    { key: "CRAMPS", label: "Cramps" },
    { key: "HEADACHE", label: "Headache" },
    { key: "BLOATING", label: "Bloating" },
    { key: "FATIGUE", label: "Fatigue" },
    { key: "MOOD_SWINGS", label: "Mood Swings" },
  ];

  const fetchWellnessData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [todayData, historyData] = await Promise.all([
        apiRequest("/api/wellness/today"),
        apiRequest("/api/wellness"),
      ]);

      if (todayData) {
        const resp = todayData as TodayResponse;
        setRecordDate(resp.recordDate);
        if (resp.exists && resp.record) {
          const rec = resp.record;
          setWater(rec.waterIntake || 0);
          setMood(rec.mood || "");
          setEnergy(rec.energyLevel || null);
          setSleepHours(rec.sleepDurationMinutes ? (rec.sleepDurationMinutes / 60).toFixed(1) : "");
          setSelectedSymptoms(rec.symptoms || []);
          setNote(rec.note || "");
        } else {
          // Reset
          setWater(0);
          setMood("");
          setEnergy(null);
          setSleepHours("");
          setSelectedSymptoms([]);
          setNote("");
        }
      }

      if (historyData) {
        setHistory(historyData as DailyRecord[]);
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "Failed to load wellness tracker.";
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWellnessData();
  }, []);

  const savePartialField = async (fields: Partial<DailyRecord>) => {
    setError(null);
    setIsSaving(true);
    try {
      await apiRequest("/api/wellness/today", {
        method: "PUT",
        data: fields,
      });
      // Silent refresh
      const [todayData, historyData] = await Promise.all([
        apiRequest("/api/wellness/today"),
        apiRequest("/api/wellness"),
      ]);
      if (todayData) {
        const resp = todayData as TodayResponse;
        if (resp.exists && resp.record) {
          const rec = resp.record;
          setWater(rec.waterIntake || 0);
          setMood(rec.mood || "");
          setEnergy(rec.energyLevel || null);
          setSleepHours(rec.sleepDurationMinutes ? (rec.sleepDurationMinutes / 60).toFixed(1) : "");
          setSelectedSymptoms(rec.symptoms || []);
          setNote(rec.note || "");
        }
      }
      if (historyData) setHistory(historyData as DailyRecord[]);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "Failed to save wellness field.";
      setError(errMsg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddWater = (amount: number) => {
    const nextWater = Math.max(0, water + amount);
    setWater(nextWater);
    savePartialField({ waterIntake: nextWater });
  };

  const handleSelectMood = (moodKey: string) => {
    setMood(moodKey);
    savePartialField({ mood: moodKey });
  };

  const handleSelectEnergy = (lvl: number) => {
    setEnergy(lvl);
    savePartialField({ energyLevel: lvl });
  };

  const handleSaveSleep = () => {
    const val = parseFloat(sleepHours);
    if (isNaN(val) || val < 0 || val > 24) {
      setError("Please enter a valid sleep duration between 0 and 24 hours.");
      return;
    }
    const mins = Math.round(val * 60);
    savePartialField({ sleepDurationMinutes: mins });
  };

  const handleToggleSymptom = (symKey: string) => {
    let nextList = [...selectedSymptoms];
    if (nextList.includes(symKey)) {
      nextList = nextList.filter((s) => s !== symKey);
    } else {
      nextList.push(symKey);
    }
    setSelectedSymptoms(nextList);
    savePartialField({ symptoms: nextList });
  };

  const handleSaveNote = () => {
    savePartialField({ note });
  };

  const handleDeleteToday = async () => {
    if (!window.confirm("Are you sure you want to clear all your logs for today?")) return;
    setError(null);
    try {
      await apiRequest("/api/wellness/today", { method: "DELETE" });
      await fetchWellnessData();
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "Failed to reset today's logs.";
      setError(errMsg);
    }
  };

  const getMoodEmoji = (moodKey: string) => {
    return allowedMoods.find((m) => m.key === moodKey.toUpperCase())?.emoji || "📝";
  };

  return (
    <AuthShell>
      <div className="flex flex-col gap-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="font-display text-3xl font-bold text-nura-slate">
              Wellness tracker
            </h1>
            <p className="text-sm text-nura-slate/60">
              Check-in for: <span className="font-semibold text-nura-terracotta">{recordDate || "Today"}</span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            {isSaving && (
              <span className="text-xs text-nura-sage font-semibold animate-pulse">
                Saving changes...
              </span>
            )}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleDeleteToday}
              disabled={isSaving}
              className="text-red-500 border-red-200 hover:bg-red-50 hover:text-red-700 cursor-pointer"
              aria-label="Clear today's log entries"
            >
              Clear Today
            </Button>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-sm text-red-600" role="alert">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-nura-slate/60 text-sm">Loading daily logs...</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Log Panel: 2 Columns on desktop */}
            <div className="lg:col-span-2 flex flex-col gap-8">
              
              {/* Row 1: Water & Mood */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                
                {/* 💧 Water Tracker Card */}
                <Card variant="default" className="p-8 flex flex-col gap-5 justify-between">
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-bold text-nura-slate/40 uppercase tracking-widest">Hydration</span>
                    <h2 className="font-display text-xl font-bold text-nura-slate flex items-center gap-1.5">
                      <span>💧 Water Intake</span>
                    </h2>
                  </div>

                  <div className="flex items-baseline gap-2 my-2 justify-center">
                    <span className="text-4xl font-extrabold text-nura-slate">{water}</span>
                    <span className="text-sm font-semibold text-nura-slate/50">/ {waterGoal} ml</span>
                  </div>

                  <div className="flex flex-col gap-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAddWater(250)}
                        disabled={isSaving}
                        className="flex-1 py-2 px-3 text-xs font-bold bg-nura-rose-medium/20 text-nura-terracotta rounded-full hover:bg-nura-rose-medium/40 transition-colors cursor-pointer disabled:opacity-50"
                      >
                        +250ml
                      </button>
                      <button
                        onClick={() => handleAddWater(500)}
                        disabled={isSaving}
                        className="flex-1 py-2 px-3 text-xs font-bold bg-nura-rose-medium/20 text-nura-terracotta rounded-full hover:bg-nura-rose-medium/40 transition-colors cursor-pointer disabled:opacity-50"
                      >
                        +500ml
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <label htmlFor="water-goal" className="text-[10px] font-bold text-nura-slate/40 uppercase truncate">
                        Personal Target
                      </label>
                      <input
                        id="water-goal"
                        type="number"
                        min={0}
                        max={10000}
                        disabled={isSaving}
                        value={waterGoal}
                        onChange={(e) => setWaterGoal(Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-20 px-2 py-0.5 border border-nura-rose-medium/35 bg-white/70 rounded text-center text-xs font-semibold text-nura-slate focus:outline-none"
                      />
                    </div>
                  </div>
                </Card>

                {/* 😊 Mood Selector Card */}
                <Card variant="default" className="p-8 flex flex-col gap-4">
                  <div className="flex flex-col gap-1 border-b border-nura-rose-medium/10 pb-2">
                    <span className="text-xs font-bold text-nura-slate/40 uppercase tracking-widest">Emotional Status</span>
                    <h2 className="font-display text-xl font-bold text-nura-slate">😊 Mood today</h2>
                  </div>

                  <div className="flex gap-3 justify-center my-3">
                    {allowedMoods.map((m) => (
                      <button
                        key={m.key}
                        onClick={() => handleSelectMood(m.key)}
                        disabled={isSaving}
                        title={m.label}
                        className={`w-12 h-12 text-2xl flex items-center justify-center rounded-2xl border transition-all hover:scale-105 cursor-pointer disabled:opacity-55 ${
                          mood === m.key
                            ? "bg-nura-rose-medium/30 border-nura-terracotta scale-105"
                            : "bg-white border-nura-rose-medium/20 hover:border-nura-rose-medium/50"
                        }`}
                        aria-label={`Log feeling ${m.label}`}
                      >
                        {m.emoji}
                      </button>
                    ))}
                  </div>

                  {mood && (
                    <p className="text-xs font-semibold text-nura-slate/50 text-center uppercase tracking-wide">
                      Logged as: <span className="text-nura-terracotta">{mood}</span>
                    </p>
                  )}
                </Card>

              </div>

              {/* Row 2: Sleep & Energy */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                
                {/* 😴 Sleep Input Card */}
                <Card variant="default" className="p-8 flex flex-col gap-5 justify-between">
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-bold text-nura-slate/40 uppercase tracking-widest">Rest</span>
                    <h2 className="font-display text-xl font-bold text-nura-slate">😴 Sleep duration</h2>
                  </div>

                  <div className="flex items-center gap-3 justify-center my-2">
                    <input
                      id="sleep-hours-input"
                      type="number"
                      step="0.5"
                      min="0"
                      max="24"
                      placeholder="e.g. 7.5"
                      disabled={isSaving}
                      value={sleepHours}
                      onChange={(e) => setSleepHours(e.target.value)}
                      className="w-24 px-4 py-2 border border-nura-rose-medium/50 bg-white/70 rounded-2xl text-center text-lg font-bold text-nura-slate focus:outline-none focus:ring-2 focus:ring-nura-terracotta/40"
                    />
                    <span className="text-sm font-semibold text-nura-slate/60">hours</span>
                  </div>

                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleSaveSleep}
                    disabled={isSaving}
                    className="w-full py-2"
                  >
                    Save Sleep Log
                  </Button>
                </Card>

                {/* ⚡ Energy Selector Card */}
                <Card variant="default" className="p-8 flex flex-col gap-4">
                  <div className="flex flex-col gap-1 border-b border-nura-rose-medium/10 pb-2">
                    <span className="text-xs font-bold text-nura-slate/40 uppercase tracking-widest">Vitality</span>
                    <h2 className="font-display text-xl font-bold text-nura-slate">⚡ Energy level</h2>
                  </div>

                  <div className="flex justify-between my-3 gap-2 px-2">
                    {[1, 2, 3, 4, 5].map((lvl) => (
                      <button
                        key={lvl}
                        onClick={() => handleSelectEnergy(lvl)}
                        disabled={isSaving}
                        className={`w-10 h-10 rounded-full font-bold flex items-center justify-center border text-sm transition-all hover:scale-105 cursor-pointer disabled:opacity-55 ${
                          energy === lvl
                            ? "bg-nura-terracotta text-white border-nura-terracotta"
                            : "bg-white text-nura-slate/75 border-nura-rose-medium/20 hover:border-nura-rose-medium/40"
                        }`}
                        aria-label={`Log energy level ${lvl} out of 5`}
                      >
                        {lvl}
                      </button>
                    ))}
                  </div>

                  <div className="flex justify-between text-[10px] font-bold text-nura-slate/40 uppercase px-1">
                    <span>Low</span>
                    <span>High</span>
                  </div>
                </Card>

              </div>

              {/* Row 3: Notes Check-in */}
              <Card variant="default" className="p-8 flex flex-col gap-4">
                <div className="flex flex-col gap-1 border-b border-nura-rose-medium/10 pb-2">
                  <span className="text-xs font-bold text-nura-slate/40 uppercase tracking-widest">Log Journal</span>
                  <h2 className="font-display text-xl font-bold text-nura-slate">📝 Notes today</h2>
                </div>

                <textarea
                  id="note-textarea"
                  maxLength={1000}
                  placeholder="Record note details (symptom nuances, feelings, hydration comments)..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  disabled={isSaving}
                  rows={3}
                  className="w-full p-4 border border-nura-rose-medium/40 bg-white/70 rounded-2xl text-sm text-nura-slate focus:outline-none focus:ring-2 focus:ring-nura-terracotta/40 placeholder:text-nura-slate/30"
                />

                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleSaveNote}
                  disabled={isSaving}
                  className="self-end py-2 px-6"
                >
                  Save Journal
                </Button>
              </Card>

            </div>

            {/* Right Column: Symptoms check-in and 7 days history timeline */}
            <div className="lg:col-span-1 flex flex-col gap-8">
              
              {/* 🤕 Symptoms checkboxes/pill selector */}
              <Card variant="default" className="p-8 flex flex-col gap-4">
                <div className="flex flex-col gap-1 border-b border-nura-rose-medium/10 pb-2">
                  <span className="text-xs font-bold text-nura-slate/40 uppercase tracking-widest">Physical log</span>
                  <h2 className="font-display text-xl font-bold text-nura-slate">🤕 Symptom tagger</h2>
                </div>

                <div className="flex flex-wrap gap-2.5 my-2">
                  {allowedSymptoms.map((s) => {
                    const isSelected = selectedSymptoms.includes(s.key);
                    return (
                      <button
                        key={s.key}
                        onClick={() => handleToggleSymptom(s.key)}
                        disabled={isSaving}
                        className={`px-4 py-2 text-xs font-semibold rounded-full border transition-all hover:scale-102 cursor-pointer disabled:opacity-55 ${
                          isSelected
                            ? "bg-nura-rose-medium/30 border-nura-terracotta text-nura-terracotta"
                            : "bg-white border-nura-rose-medium/20 text-nura-slate/75 hover:border-nura-rose-medium/40"
                        }`}
                        aria-label={`Toggle symptom log ${s.label}`}
                      >
                        {s.label}
                      </button>
                    );
                  })}
                </div>

                <div className="text-[10px] text-nura-slate/50 leading-relaxed mt-2">
                  * Select symptom markers to log occurrences in your history database.
                </div>
              </Card>

              {/* History checklist panel */}
              <Card variant="glass" className="p-8 flex flex-col gap-5">
                <h3 className="font-display text-base font-bold text-nura-slate border-b border-nura-rose-medium/15 pb-2">
                  Recent 7-Day History
                </h3>

                {history.length === 0 ? (
                  <div className="text-xs text-nura-slate/50 text-center py-6">
                    No wellness logs registered in this window.
                  </div>
                ) : (
                  <div className="flex flex-col gap-3.5 max-h-[300px] overflow-y-auto pr-1">
                    {history.slice().reverse().map((rec) => {
                      const d = new Date(rec.recordDate);
                      const displayDate = d.toLocaleDateString(undefined, {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                        timeZone: "UTC",
                      });

                      return (
                        <div 
                          key={rec.recordDate} 
                          className="flex flex-col gap-1.5 p-3 rounded-2xl bg-white border border-nura-rose-medium/10 text-xs"
                        >
                          <div className="flex justify-between items-center font-bold text-nura-slate/85">
                            <span>{displayDate}</span>
                            {rec.mood && <span>{getMoodEmoji(rec.mood)}</span>}
                          </div>
                          
                          <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-nura-slate/60">
                            {rec.waterIntake !== undefined && rec.waterIntake > 0 && (
                              <span>💧 {rec.waterIntake} ml</span>
                            )}
                            {rec.sleepDurationMinutes !== undefined && rec.sleepDurationMinutes > 0 && (
                              <span>😴 {(rec.sleepDurationMinutes / 60).toFixed(1)} hrs</span>
                            )}
                            {rec.energyLevel !== undefined && (
                              <span>⚡ Lvl {rec.energyLevel}</span>
                            )}
                          </div>
                          {rec.symptoms && rec.symptoms.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {rec.symptoms.map((s) => (
                                <span 
                                  key={s} 
                                  className="text-[9px] font-extrabold uppercase bg-nura-rose-medium/10 text-nura-terracotta px-1.5 py-0.5 rounded"
                                >
                                  {s.replace("_", " ")}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </Card>

            </div>

            {/* Medical disclaimer alert */}
            <div className="lg:col-span-3 bg-nura-rose-medium/10 border border-nura-rose-dark/15 rounded-3xl p-6 text-xs text-nura-slate/85 leading-relaxed flex items-start gap-4">
              <span className="text-2xl mt-0.5">⚠️</span>
              <div>
                <span className="font-bold text-nura-terracotta uppercase tracking-wide block mb-1">
                  Daily Tracker Advisory
                </span>
                Wellness logging is intended to compile personal lifestyle habits. 
                Nura does not execute clinical diagnostics, provide medical advice, or predict phase-specific physical anomalies.
                For health advice or medical concerns, please consult a health professional.
              </div>
            </div>

          </div>
        )}
      </div>
    </AuthShell>
  );
}
