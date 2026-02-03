"use client";

import { useState } from "react";
import OnboardingForm from "../../components/OnboardingForm";
import TechStatusPanel from "../../components/TechStatusPanel";
import { COMERCIAL_FORM } from "../../lib/formConfigs";
import { ChartBarIcon } from "@heroicons/react/24/outline";

import { useProtectedPage } from "../../lib/auth";

export default function ComercialPage() {
  const [isTechPanelOpen, setIsTechPanelOpen] = useState(false);
  const isAuthorized = useProtectedPage("commercial");

  if (!isAuthorized) {
    return null;
  }

  return (
    <div className="relative min-h-screen">
      {/* Floating Action Button for Technical Insights */}
      <button
        onClick={() => setIsTechPanelOpen(true)}
        className="fixed top-24 right-6 z-40 flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-900 px-4 py-2 rounded-full transition-all transform hover:scale-105"
      >
        <ChartBarIcon className="w-5 h-5" />
        <span className="text-sm font-medium">Ver Estado del Cuestionario del area de tecnologia </span>
      </button>

      {/* Main Form Area */}
      {/* Adjust container width if panel is open - optional, but simple overlay is often cleaner on mobile */}
      <div className={`transition-all duration-300 ${isTechPanelOpen ? "mr-0 md:mr-96" : ""}`}>
        <OnboardingForm config={COMERCIAL_FORM} />
      </div>

      {/* Technical Status Side Panel */}
      <TechStatusPanel
        isOpen={isTechPanelOpen}
        onClose={() => setIsTechPanelOpen(false)}
      />
    </div>
  );
}
