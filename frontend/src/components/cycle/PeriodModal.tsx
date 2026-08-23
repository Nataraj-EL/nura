/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface PeriodModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (startDate: string, endDate: string | null) => Promise<void>;
  initialData?: { id?: string; startDate: string; endDate: string | null } | null;
}

export const PeriodModal: React.FC<PeriodModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
}) => {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const startInputRef = useRef<HTMLInputElement>(null);

  // Today's date in local YYYY-MM-DD format to set as maximum date
  const todayStr = new Date().toLocaleDateString("en-CA"); // Formats to YYYY-MM-DD in local time

  useEffect(() => {
    if (isOpen) {
      setLocalError(null);
      if (initialData) {
        setStartDate(initialData.startDate);
        setEndDate(initialData.endDate || "");
      } else {
        setStartDate(todayStr);
        setEndDate("");
      }
      // Set focus to the start date input on open
      setTimeout(() => startInputRef.current?.focus(), 100);
    }
  }, [isOpen, initialData, todayStr]);

  // Handle ESC key press to dismiss modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (!startDate) {
      setLocalError("Start date is required.");
      return;
    }

    const finalEndDate = endDate.trim() === "" ? null : endDate;

    if (finalEndDate && new Date(finalEndDate) < new Date(startDate)) {
      setLocalError("End date cannot be before the start date.");
      return;
    }

    setIsSaving(true);
    try {
      await onSave(startDate, finalEndDate);
      onClose();
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "Failed to save period record.";
      setLocalError(errMsg);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-nura-slate/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div 
        className="fixed inset-0" 
        onClick={onClose} 
        aria-hidden="true" 
      />
      
      <Card 
        variant="default" 
        className="w-full max-w-md p-8 relative z-10 flex flex-col gap-6 bg-white animate-scale-up"
      >
        <div className="flex justify-between items-center border-b border-nura-rose-medium/20 pb-3">
          <h2 id="modal-title" className="font-display text-xl font-bold text-nura-slate">
            {initialData ? "Edit Period Log" : "Log Period"}
          </h2>
          <button 
            onClick={onClose}
            className="text-nura-slate/40 hover:text-nura-slate transition-colors text-2xl font-bold p-1 leading-none cursor-pointer"
            aria-label="Close modal"
          >
            &times;
          </button>
        </div>

        {localError && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-sm text-red-600" role="alert">
            {localError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* Start Date input */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="modal-start-date" className="text-sm font-semibold text-nura-slate/85">
              Start Date <span className="text-nura-terracotta">*</span>
            </label>
            <input
              id="modal-start-date"
              type="date"
              required
              max={todayStr}
              ref={startInputRef}
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                if (localError) setLocalError(null);
              }}
              className="w-full px-5 py-2.5 rounded-full border border-nura-rose-medium/60 bg-white text-nura-slate focus:outline-none focus:ring-2 focus:ring-nura-terracotta/40 focus:border-nura-terracotta text-base"
              disabled={isSaving}
            />
          </div>

          {/* End Date input */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="modal-end-date" className="text-sm font-semibold text-nura-slate/85">
              End Date <span className="text-xs text-nura-slate/50 font-normal">(Optional)</span>
            </label>
            <input
              id="modal-end-date"
              type="date"
              max={todayStr}
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                if (localError) setLocalError(null);
              }}
              className="w-full px-5 py-2.5 rounded-full border border-nura-rose-medium/60 bg-white text-nura-slate focus:outline-none focus:ring-2 focus:ring-nura-terracotta/40 focus:border-nura-terracotta text-base"
              disabled={isSaving}
            />
            <p className="text-xs text-nura-slate/50 px-2">
              Leave blank if your period is currently ongoing.
            </p>
          </div>

          <div className="flex justify-end gap-3 mt-4 border-t border-nura-rose-medium/20 pt-4">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isSaving}
              className="py-2.5 px-5"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={isSaving}
              className="py-2.5 px-6"
            >
              {isSaving ? "Saving..." : "Save Log"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
