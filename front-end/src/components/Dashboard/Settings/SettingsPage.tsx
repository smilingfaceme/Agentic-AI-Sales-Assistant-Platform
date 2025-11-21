"use client";
import React from "react";
import { FaUser, FaBuilding, FaUsers, FaCog } from "react-icons/fa";
import { useAppContext } from '@/contexts/AppContext';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

type SettingsTab = 'user' | 'company' | 'invite';

export default function SettingsPage({ children }: { children: React.ReactNode }) {
  // Sidebar State
  const { sidebarHidden, setSidebarHidden, currentUser } = useAppContext();
  const router = useRouter();
  const pathname = usePathname();

  const tabs = [
    { id: 'user' as SettingsTab, label: 'User Settings', icon: <FaUser />, href:"/dashboard/settings/user" },
    { id: 'company' as SettingsTab, label: 'Company Settings', icon: <FaBuilding />, href:"/dashboard/settings/company"},
    { id: 'invite' as SettingsTab, label: 'Invite Users', icon: <FaUsers />,  href:"/dashboard/settings/invite" },
  ];

  return (
    <div className="flex flex-col h-screen flex-1 bg-[#fafbfc]">
      {/* Header */}
      <header className="px-4 md:px-6 py-4 md:pt-5 border-b border-gray-300 bg-white text-lg font-semibold flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Sidebar toggle only on mobile */}
          <button
            className="md:hidden bg-white border border-gray-300 rounded-full p-2 shadow-lg mr-2"
            onClick={() => setSidebarHidden(!sidebarHidden)}
            aria-label={sidebarHidden ? "Show sidebar" : "Hide sidebar"}
          >
            <FaCog />
          </button>
          <span>Settings</span>
        </div>
      </header>

      <main className="flex flex-1 h-full flex-col md:flex-row overflow-hidden">
        {/* Left sidebar with tabs */}
        <aside className="w-full md:w-72 min-w-[220px] border-b border-gray-100 md:border-r m:border-gray-300 bg-white px-2 flex md:flex-col gap-1 md:py-6 md:px-4">
          {tabs.map((tab) => (<>
            {(currentUser.permissions[tab.id] || tab.id == 'user') &&<Link
              key={tab.id}
              href={tab.href}
              onClick={() => router.push(`/dashboard/settings/${tab.id}`)}
              className={`flex items-center px-2 py-2 md:px-4 md:py-3 md:rounded-lg text-left md:transition-all md:duration-200 ${pathname === tab.href
                  ? 'font-semibold md:bg-blue-50 text-blue-700 border-b-2 md:border border-blue-200'
                  : 'hover:bg-gray-50 text-gray-700 border border-transparent hover:border-gray-200'
              }`}
            >
              <span className={`mr-1 md:mr-3 md:text-lg ${pathname === tab.id ? 'text-blue-600' : 'text-gray-500'}`}>
                {tab.icon}
              </span>
              {tab.label}
            </Link>}
            </>
          ))}
        </aside>
        {/* Main content area */}
        <div className="flex-1 p-4 md:p-6 bg-gray-50 overflow-auto">
          <div className="max-w-5xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
