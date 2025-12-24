"use client";
import Link from 'next/link';
import { FaProjectDiagram } from "react-icons/fa";
import { useAppContext } from '@/contexts/AppContext';

export default function WorkflowPage({ children }: { children: React.ReactNode }) {
  const { sidebarHidden, setSidebarHidden } = useAppContext();

  return (
    <div className="flex flex-col min-h-screen h-full w-full bg-white">
      {/* Header */}
      <header className="px-4 md:px-6 py-4 border-b border-gray-300 bg-white text-lg flex items-center justify-between">
        <div className="flex items-center gap-2 font-semibold">
          {/* Sidebar toggle only on mobile */}
          <button
            className="md:hidden bg-white border border-gray-300 rounded-full p-2 shadow-lg mr-2"
            onClick={() => setSidebarHidden(!sidebarHidden)}
            aria-label={sidebarHidden ? "Show sidebar" : "Hide sidebar"}
          >
            <FaProjectDiagram />
          </button>
          <span>Workflow</span>
        </div>
        <Link
          href="/dashboard/workflow/edit?workflow_id=new"
          className="py-0.5 px-2 bg-black hover:bg-gray-700 text-white rounded text-sm"
        >
          + New Workflow
        </Link>
      </header>
      {/* Main content */}
      <main className="flex flex-1 h-full flex-col md:flex-row md:justify-center">
        {children}
      </main>
    </div>
  );
}

