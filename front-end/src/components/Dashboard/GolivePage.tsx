"use client";
import React from "react";
import { useState } from "react";
import { FaWhatsappSquare, FaCheckCircle, FaBroadcastTower } from "react-icons/fa";

interface GoLivePageProps {
  sidebarHidden?: boolean;
  onSidebarToggle?: () => void;
}

export default function GoLivePage({ sidebarHidden, onSidebarToggle }: GoLivePageProps) {
  const [enabled, setEnabled] = useState(false);
  return (
    <div className="flex flex-col min-h-screen w-full bg-[#fafbfc]">
      {/* Header */}
      <header className="px-4 sm:px-6 py-4 border-b border-gray-300 bg-white text-lg font-semibold flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Sidebar toggle only on mobile */}
          <button
            className="md:hidden bg-white border border-gray-300 rounded-full p-2 shadow-lg mr-2"
            onClick={onSidebarToggle}
            aria-label={sidebarHidden ? "Show sidebar" : "Hide sidebar"}
          >
            <FaBroadcastTower />
          </button>
          <span>Go live</span>
        </div>
      </header>
      {/* Main content */}
      <main className="flex flex-1 h-full flex-col md:flex-row">
        {/* Main area */}
        <section className="bg-white w-full px-2 sm:px-6 py-6 flex md:items-baseline">
          <div className="flex flex-col md:flex-row gap-6 md:gap-8 w-full max-w-4xl px-2 sm:px-4 py-4 md:py-8">
            {/* Blocker 1 */}
            <div className="border border-gray-300 rounded-xl bg-white flex flex-col shadow-sm m-0 flex-1 min-w-[260px] max-w-full">
              <div className="pt-4 px-4 pb-3">
                <div className="flex items-center justify-between w-full mb-4 gap-2">
                  <FaWhatsappSquare size={35} color="green" />
                  <button
                    onClick={() => setEnabled(!enabled)}
                    className={`border border-gray-500 relative inline-flex h-6 w-11 items-center rounded-full transition ${enabled ? "bg-gray-800" : "bg-gray-100"
                      }`}
                  >
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full border border-gray-500 bg-white transition ${enabled ? "translate-x-6" : "translate-x-0"
                        }`}
                    />
                  </button>
                </div>
                <span className="text-base sm:text-lg font-semibold mb-2">Connect to WhatsApp</span>
                <p className="text-gray-600 text-sm sm:text-base">Configure your chatbot settings, get login QR code and go live.</p>
              </div>
              <div className="flex flex-col sm:flex-row items-center justify-between w-full bg-gray-100 px-4 py-2 sm:px-5 sm:py-3 gap-2">
                <div className="flex items-center text-sm sm:text-base">
                  <FaCheckCircle size={22} />
                  <span className="pl-2">Account connected</span>
                </div>
                <button className={`relative inline-flex items-center px-3 py-1 bg-white rounded-lg border border-gray-400 hover:bg-gray-100 text-xs sm:text-sm`}>
                  View
                </button>
              </div>
            </div>
            {/* Blocker 2 */}
            <div className="border border-gray-300 rounded-xl bg-white flex flex-col shadow-sm m-0 flex-1 min-w-[260px] max-w-full mt-6 md:mt-0">
              <div className="pt-4 px-4 pb-3">
                <div className="flex items-center justify-between w-full mb-4 gap-2">
                  <FaWhatsappSquare size={35} color="green" />
                  <button
                    onClick={() => setEnabled(!enabled)}
                    className={`border border-gray-500 relative inline-flex h-6 w-11 items-center rounded-full transition ${enabled ? "bg-gray-800" : "bg-gray-100"
                      }`}
                  >
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full border border-gray-500 bg-white transition ${enabled ? "translate-x-6" : "translate-x-0"
                        }`}
                    />
                  </button>
                </div>
                <span className="text-base sm:text-lg font-semibold mb-2">Connect to WACA</span>
                <p className="text-gray-600 text-sm sm:text-base">Configure your chatbot settings, login Facebook and go live.</p>
              </div>
              <div className="flex flex-col sm:flex-row items-center justify-between w-full bg-gray-100 px-4 py-2 sm:px-5 sm:py-3 gap-2">
                <div className="flex items-center text-sm sm:text-base">
                  <FaCheckCircle size={22} />
                  <span className="pl-2">Account connected</span>
                </div>
                <button className={`relative inline-flex items-center px-3 py-1 bg-white rounded-lg border border-gray-400 hover:bg-gray-100 text-xs sm:text-sm`}>
                  View
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
