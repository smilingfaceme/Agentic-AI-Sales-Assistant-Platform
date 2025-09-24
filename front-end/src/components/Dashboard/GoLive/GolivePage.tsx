"use client";
import { FaBroadcastTower } from "react-icons/fa";
import { useAppContext } from '@/contexts/AppContext';

export default function GoLivePage({ children }: { children: React.ReactNode }) {
  const { sidebarHidden, setSidebarHidden } = useAppContext();

  return (
    <div className="flex flex-col min-h-screen w-full bg-[#fafbfc]">
      {/* Header */}
      <header className="px-4 sm:px-6 py-4 border-b border-gray-300 bg-white text-lg font-semibold flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Sidebar toggle only on mobile */}
          <button
            className="md:hidden bg-white border border-gray-300 rounded-full p-2 shadow-lg mr-2"
            onClick={() => setSidebarHidden(!sidebarHidden)}
            aria-label={sidebarHidden ? "Show sidebar" : "Hide sidebar"}
          >
            <FaBroadcastTower />
          </button>
          <span>Go live</span>
        </div>
      </header>
      {/* Main content */}
      <main className="flex flex-1 h-full flex-col md:flex-row">
        {children}
      </main>
    </div>
  );
}
