"use client";

import React, { useState, useEffect } from "react";
import { AuthShell } from "@/components/layout/AuthShell";
import { Card } from "@/components/ui/card";
import { apiRequest } from "@/utils/api";

interface CareItem {
  title: string;
  description: string;
  category: string;
}

interface CareResponse {
  contentVersion: string;
  lastReviewed: string;
  medicalDisclaimer: string;
  category: string;
  items: CareItem[];
}

export default function CarePage() {
  const [guidanceData, setGuidanceData] = useState<CareResponse | null>(null);
  const [symptomsData, setSymptomsData] = useState<CareResponse | null>(null);
  const [safetyData, setSafetyData] = useState<CareResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Tab state for progressive content presentation
  const [activeTab, setActiveTab] = useState<"safety" | "symptoms" | "education">("safety");

  // Expandable FAQ state
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  useEffect(() => {
    const fetchCareData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const [guidance, symptoms, safety] = await Promise.all([
          apiRequest("/api/care/guidance"),
          apiRequest("/api/care/symptoms"),
          apiRequest("/api/care/safety")
        ]);

        if (guidance) setGuidanceData(guidance as CareResponse);
        if (symptoms) setSymptomsData(symptoms as CareResponse);
        if (safety) setSafetyData(safety as CareResponse);
      } catch {
        setError("Failed to retrieve care safety guidelines. Please check your network connection.");
      } finally {
        setLoading(false);
      }
    };

    fetchCareData();
  }, []);

  const toggleExpand = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  const getUrgentItems = () => {
    if (!safetyData) return [];
    return safetyData.items.filter(item => item.category === "URGENT_MEDICAL_ATTENTION");
  };

  const getProfessionalItems = () => {
    if (!safetyData) return [];
    return safetyData.items.filter(item => item.category === "CONTACT_HEALTHCARE_PROFESSIONAL");
  };

  // Structured calm education FAQs
  const faqItems = [
    {
      q: "What defines an irregular cycle?",
      a: "Typical menstrual cycles naturally vary, often ranging between 21 and 45 days. A cycle is generally considered irregular if it consistently falls outside these ranges or varies significantly in length from month to month. Tracking these patterns over several months provides useful data to share with a physician."
    },
    {
      q: "Can Nura detect medical conditions?",
      a: "No. Nura is a record-keeping tool. It does not analyze entries to detect, diagnose, or score clinical risks for conditions like endometriosis, PCOS, or thyroid variations. Always discuss wellness observations directly with a healthcare provider."
    },
    {
      q: "How should I track my period dates?",
      a: "Log the first day of active bleeding as day one of your cycle. Continue recording daily until bleeding stops. This creates a baseline average of your typical cycle duration over time."
    }
  ];

  return (
    <AuthShell>
      <div className="flex flex-col gap-6 max-w-4xl mx-auto w-full">
        
        {/* Header Title */}
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] font-bold text-nura-terracotta uppercase tracking-wider">Education & Resources</span>
          <h1 className="font-display text-2xl font-bold text-nura-slate">Care Guidance & Safety Center</h1>
          <p className="text-xs text-nura-slate/65 max-w-xl leading-relaxed">
            Nura provides quiet educational guidelines on menstrual health and safety. This information is purely educational and does not constitute clinical diagnosis or medical advice.
          </p>
        </div>

        {/* Global Medical Disclaimer Banner */}
        {safetyData && (
          <div 
            className="p-4 bg-nura-rose-medium/10 border border-nura-rose-medium/20 rounded-2xl text-xs text-nura-slate/75 leading-relaxed"
            role="note"
          >
            <span className="font-bold text-nura-terracotta uppercase text-[10px] tracking-wide block mb-1">Medical Disclaimer</span>
            {safetyData.medicalDisclaimer}
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-600" role="alert">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-nura-slate/50 text-xs py-8">Retrieving safety resources...</div>
        ) : (
          <div className="flex flex-col gap-6">
            
            {/* Quick-Jump Mobile-Friendly Accessible Tabs */}
            <div 
              className="flex border-b border-nura-rose-medium/15 text-xs font-semibold"
              role="tablist"
              aria-label="Safety center sections"
            >
              <button
                onClick={() => setActiveTab("safety")}
                role="tab"
                aria-selected={activeTab === "safety"}
                aria-controls="safety-panel"
                id="tab-safety"
                className={`flex-1 py-3 text-center border-b-2 cursor-pointer transition-colors ${
                  activeTab === "safety" 
                    ? "border-nura-terracotta text-nura-terracotta font-bold" 
                    : "border-transparent text-nura-slate/50 hover:text-nura-slate"
                }`}
              >
                ⚠️ Safety Warnings
              </button>
              <button
                onClick={() => setActiveTab("symptoms")}
                role="tab"
                aria-selected={activeTab === "symptoms"}
                aria-controls="symptoms-panel"
                id="tab-symptoms"
                className={`flex-1 py-3 text-center border-b-2 cursor-pointer transition-colors ${
                  activeTab === "symptoms" 
                    ? "border-nura-terracotta text-nura-terracotta font-bold" 
                    : "border-transparent text-nura-slate/50 hover:text-nura-slate"
                }`}
              >
                😊 Symptom Tips
              </button>
              <button
                onClick={() => setActiveTab("education")}
                role="tab"
                aria-selected={activeTab === "education"}
                aria-controls="education-panel"
                id="tab-education"
                className={`flex-1 py-3 text-center border-b-2 cursor-pointer transition-colors ${
                  activeTab === "education" 
                    ? "border-nura-terracotta text-nura-terracotta font-bold" 
                    : "border-transparent text-nura-slate/50 hover:text-nura-slate"
                }`}
              >
                📚 Cycle Education
              </button>
            </div>

            {/* TAB PANEL 1: Safety & Red Flags */}
            {activeTab === "safety" && (
              <div 
                id="safety-panel" 
                role="tabpanel" 
                aria-labelledby="tab-safety"
                className="flex flex-col gap-6"
              >
                {/* Urgent Medical Attention Callout */}
                <div className="p-5 bg-red-50/60 border border-red-200 rounded-3xl flex flex-col gap-3">
                  <div className="flex items-center gap-2 text-red-700 font-bold text-sm">
                    <span className="text-lg">🚨</span>
                    <h3>Urgent Medical Attention</h3>
                  </div>
                  <p className="text-xs text-red-900/80 leading-relaxed">
                    Menstrual symptoms are usually manageable, but certain sudden changes require prompt evaluation. Seek urgent medical attention if you experience:
                  </p>
                  <ul className="list-disc pl-5 text-xs text-red-950 flex flex-col gap-2 leading-relaxed">
                    {getUrgentItems().map((item, idx) => (
                      <li key={idx}>
                        <span className="font-bold">{item.title}</span>: {item.description}
                      </li>
                    ))}
                  </ul>
                  <span className="text-[10px] italic text-red-800/70 mt-1 block">
                    This information is educational and does not replace emergency clinical assessment.
                  </span>
                </div>

                {/* Seeking Professional Guidance */}
                <div className="flex flex-col gap-3">
                  <h3 className="font-display text-sm font-bold text-nura-slate">Contacting a Healthcare Professional</h3>
                  <p className="text-xs text-nura-slate/60 leading-relaxed">
                    We recommend scheduling an appointment with an OB/GYN or primary doctor if you observe persistent changes in your typical cycles:
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {getProfessionalItems().map((item, idx) => (
                      <Card key={idx} variant="default" className="p-4 flex flex-col gap-1.5 text-xs">
                        <span className="font-bold text-nura-slate">{item.title}</span>
                        <p className="text-nura-slate/75 leading-relaxed">{item.description}</p>
                      </Card>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB PANEL 2: Symptoms & Low-Risk Self-Care */}
            {activeTab === "symptoms" && (
              <div 
                id="symptoms-panel" 
                role="tabpanel" 
                aria-labelledby="tab-symptoms"
                className="flex flex-col gap-4"
              >
                <div className="text-xs text-nura-slate/50 italic mb-2">
                  * Note: Symptoms are presented observationally. Nura does not claim that any symptom is biologically caused by a specific cycle phase.
                </div>

                {symptomsData && symptomsData.items && (
                  <div className="flex flex-col gap-5">
                    {/* General Information & Observations */}
                    <div className="flex flex-col gap-3">
                      <h3 className="font-display text-sm font-bold text-nura-slate">Observational Symptom Basics</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {symptomsData.items.filter(i => i.category === "GENERAL_INFORMATION").map((item, idx) => (
                          <Card key={idx} variant="glass" className="p-5 flex flex-col gap-2 text-xs">
                            <span className="font-bold text-nura-terracotta">{item.title}</span>
                            <p className="text-nura-slate/80 leading-relaxed">{item.description}</p>
                          </Card>
                        ))}
                      </div>
                    </div>

                    {/* Low-Risk Self-Care suggestions */}
                    <div className="flex flex-col gap-3">
                      <h3 className="font-display text-sm font-bold text-nura-slate">Low-Risk Self-Care Suggestions</h3>
                      <p className="text-xs text-nura-slate/60 leading-relaxed">
                        These general tips support hydration and comfort levels. They do not substitute for medical treatment or clinical prescription dosages:
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {symptomsData.items.filter(i => i.category === "SELF_CARE").map((item, idx) => (
                          <Card key={idx} variant="default" className="p-5 flex flex-col gap-2 text-xs border border-nura-rose-medium/20 bg-white">
                            <span className="font-bold text-nura-slate flex items-center gap-1.5">
                              <span>🌱</span> {item.title}
                            </span>
                            <p className="text-nura-slate/75 leading-relaxed">{item.description}</p>
                          </Card>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB PANEL 3: Cycle Variations & FAQ */}
            {activeTab === "education" && (
              <div 
                id="education-panel" 
                role="tabpanel" 
                aria-labelledby="tab-education"
                className="flex flex-col gap-5"
              >
                {/* Centralized Guidance explanations */}
                {guidanceData && (
                  <div className="flex flex-col gap-3">
                    <h3 className="font-display text-sm font-bold text-nura-slate">Cycle Variation Guidance</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {guidanceData.items.map((item, idx) => (
                        <Card key={idx} variant="glass" className="p-5 flex flex-col gap-2 text-xs">
                          <span className="font-bold text-nura-slate">{item.title}</span>
                          <p className="text-nura-slate/85 leading-relaxed">{item.description}</p>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {/* FAQ list */}
                <div className="flex flex-col gap-3 mt-2">
                  <h3 className="font-display text-sm font-bold text-nura-slate">Frequently Asked Questions</h3>
                  <div className="flex flex-col gap-2">
                    {faqItems.map((faq, idx) => {
                      const isExpanded = expandedIndex === idx;
                      return (
                        <div 
                          key={idx} 
                          className="border border-nura-rose-medium/15 rounded-2xl bg-white overflow-hidden transition-all text-xs"
                        >
                          <button
                            onClick={() => toggleExpand(idx)}
                            aria-expanded={isExpanded}
                            className="w-full p-4 text-left font-bold text-nura-slate flex justify-between items-center hover:bg-nura-rose-light/20 cursor-pointer focus:outline-none focus:ring-1 focus:ring-nura-terracotta"
                          >
                            <span>{faq.q}</span>
                            <span className="text-nura-terracotta text-sm">{isExpanded ? "▲" : "▼"}</span>
                          </button>
                          {isExpanded && (
                            <div className="px-4 pb-4 pt-1 text-nura-slate/75 leading-relaxed border-t border-nura-rose-medium/5">
                              {faq.a}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Version & Review Metadata Footer */}
            {safetyData && (
              <footer className="mt-8 border-t border-nura-rose-medium/15 pt-4 flex flex-wrap gap-4 justify-between items-center text-[10px] text-nura-slate/40 font-bold uppercase tracking-wide">
                <span>Content Version: {safetyData.contentVersion}</span>
                <span>Last Reviewed: {safetyData.lastReviewed}</span>
              </footer>
            )}

          </div>
        )}

      </div>
    </AuthShell>
  );
}
