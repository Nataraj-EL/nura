"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { AuthShell } from "@/components/layout/AuthShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/utils/api";

export default function SettingsPage() {
  const router = useRouter();
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const handleExportData = async () => {
    try {
      setExporting(true);
      setFeedbackMessage(null);
      
      const data = await apiRequest("/api/user/export");
      if (!data) {
        throw new Error("No data returned from export server.");
      }

      // Format and download the JSON file locally
      const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(data, null, 2))}`;
      const downloadAnchor = document.createElement("a");
      downloadAnchor.setAttribute("href", jsonString);
      downloadAnchor.setAttribute("download", `nura_health_export_${new Date().toISOString().split("T")[0]}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      setFeedbackMessage({ text: "Your health records have been exported and downloaded successfully.", type: "success" });
    } catch {
      setFeedbackMessage({ text: "Failed to download your data. Please check your connection and try again.", type: "error" });
    } finally {
      setExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      setDeleting(true);
      setFeedbackMessage(null);

      await apiRequest("/api/user", { method: "DELETE" });

      // Account deleted successfully! Redirect to login/home
      router.push("/");
    } catch {
      setFeedbackMessage({ text: "Failed to delete your account. Please contact support.", type: "error" });
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <AuthShell>
      <div className="flex flex-col gap-6 max-w-2xl mx-auto w-full">
        
        {/* Page Header */}
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] font-bold text-nura-terracotta uppercase tracking-wider">Account Settings</span>
          <h1 className="font-display text-2xl font-bold text-nura-slate">Privacy & Data Controls</h1>
          <p className="text-xs text-nura-slate/65 leading-relaxed">
            Manage your personal settings, export your logs, or permanently close your account here.
          </p>
        </div>

        {feedbackMessage && (
          <div 
            className={`p-4 rounded-2xl border text-xs leading-relaxed ${
              feedbackMessage.type === "success" 
                ? "bg-nura-sage-light border-nura-sage/20 text-nura-slate" 
                : "bg-red-50 border-red-200 text-red-700"
            }`}
            role="alert"
          >
            {feedbackMessage.text}
          </div>
        )}

        <div className="flex flex-col gap-6">
          
          {/* Data Export Card */}
          <Card className="p-5 flex flex-col gap-3">
            <h2 className="font-display text-sm font-bold text-nura-slate">Export My Data</h2>
            <p className="text-xs text-nura-slate/65 leading-relaxed">
              Download a complete machine-readable copy of your profile info, period logs, water progress, sleep logs, symptom entries, and notification schedules.
            </p>
            <div className="flex justify-start">
              <Button
                onClick={handleExportData}
                disabled={exporting}
                variant="primary"
                className="text-xs font-semibold rounded-full cursor-pointer px-6 py-2.5"
              >
                {exporting ? "Exporting Data..." : "Download Export (.json)"}
              </Button>
            </div>
          </Card>

          {/* Account Deletion Card */}
          <Card className="p-5 flex flex-col gap-3 border border-red-100 bg-red-50/10">
            <h2 className="font-display text-sm font-bold text-red-700">Delete My Account</h2>
            <p className="text-xs text-nura-slate/65 leading-relaxed">
              Permanently delete your profile and all associated logging history. This action deletes all tracked data from Nura&apos;s databases and cannot be undone.
            </p>
            
            {!showDeleteConfirm ? (
              <div className="flex justify-start">
                <Button
                  onClick={() => setShowDeleteConfirm(true)}
                  variant="outline"
                  className="text-xs font-semibold rounded-full text-red-600 border-red-200 hover:bg-red-50/50 cursor-pointer px-6 py-2.5"
                >
                  Delete Account
                </Button>
              </div>
            ) : (
              <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex flex-col gap-4 mt-2">
                <div className="flex flex-col gap-1 text-xs text-red-950">
                  <span className="font-bold">⚠️ Warning: This is permanent</span>
                  <p className="text-[11px] leading-relaxed">
                    By deleting your account, you will lose access to Nura immediately. All history, logs, and notification preference configurations will be erased.
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => setShowDeleteConfirm(false)}
                    variant="outline"
                    className="flex-1 text-xs font-semibold rounded-full bg-white text-nura-slate border-nura-rose-medium/30 cursor-pointer"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleDeleteAccount}
                    disabled={deleting}
                    className="flex-1 text-xs font-semibold rounded-full bg-red-600 hover:bg-red-700 text-white cursor-pointer"
                  >
                    {deleting ? "Deleting..." : "Yes, Delete Everything"}
                  </Button>
                </div>
              </div>
            )}
          </Card>

          {/* Educational Privacy Notes */}
          <Card variant="glass" className="p-5 flex flex-col gap-3">
            <h2 className="font-display text-sm font-bold text-nura-slate">Nura&apos;s Privacy Principles</h2>
            <ul className="list-disc pl-5 text-xs text-nura-slate/85 flex flex-col gap-2.5 leading-relaxed">
              <li>
                <span className="font-bold">Data Ownership:</span> Your cycle and symptom entries belong to you. We provide export and deletion capabilities so you are always in control.
              </li>
              <li>
                <span className="font-bold">No Third-Party Sharing:</span> We do not sell, rent, or distribute your intimate health metrics to advertising brokers or analytics brokers.
              </li>
              <li>
                <span className="font-bold">Local Service Workers:</span> Sensitive logging documents are processed on-demand and are not cached locally, keeping your records protected.
              </li>
            </ul>
          </Card>

        </div>

      </div>
    </AuthShell>
  );
}
