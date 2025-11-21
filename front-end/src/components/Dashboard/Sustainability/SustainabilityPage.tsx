"use client";
import React from "react";
import { FaLeaf } from "react-icons/fa";
import { useAppContext } from '@/contexts/AppContext';

export default function SustainabilityPage({ children }: { children: React.ReactNode }) {
  const { sidebarHidden, setSidebarHidden } = useAppContext();

  return (
    <div className="flex flex-col min-h-screenh h-full w-full bg-white">
      {/* Header */}
      <header className="px-4 md:px-6 py-4 border-b border-gray-300 bg-white text-lg flex items-center justify-between">
        <div className="flex items-center gap-2 font-semibold">
          {/* Sidebar toggle only on mobile */}
          <button
            className="md:hidden bg-white border border-gray-300 rounded-full p-2 shadow-lg mr-2"
            onClick={() => setSidebarHidden(!sidebarHidden)}
            aria-label={sidebarHidden ? "Show sidebar" : "Hide sidebar"}
          >
            <FaLeaf />
          </button>
          <span>Sustainability KPIs</span>
        </div>
      </header>

      <div className="flex flex-1 flex-col md:flex-row overflow-auto">
        {/* Main content area */}
        <div className="flex-1 p-4 md:p-6 bg-gray-50 overflow-auto">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

