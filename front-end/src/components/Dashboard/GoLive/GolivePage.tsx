"use client";
// import Link from 'next/link';
import { useState } from "react";
import { useRouter } from "next/navigation";
import { FaBroadcastTower } from "react-icons/fa";
import { useAppContext } from '@/contexts/AppContext';

export default function GoLivePage({ children }: { children: React.ReactNode }) {
  const { sidebarHidden, setSidebarHidden } = useAppContext();
  const router = useRouter();
  const [newConnection, setNewConnection] = useState("");

  const createNewConnection = (platform: string) => {
    console.log("Create new connection")
    if (platform === "whatsapp") {
      setNewConnection("whatsapp");
      router.push("/dashboard/go-live/new-connection");
    } else {
      setNewConnection("waca");
      router.push("/dashboard/go-live/new-waca");
    }
    // TODO: Create new connection
  }

  return (
    <div className="flex flex-col h-screen w-full h-full bg-white">
      {/* Header */}
      <header className="px-4 md:px-6 py-4 border-b border-gray-300 bg-white text-lg flex items-center justify-between">
        <div className="flex items-center gap-2 font-semibold ">
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
        <div className="py-0.5 px-2 bg-black hover:bg-gray-700 text-white rounded text-sm">
          <select value={newConnection} onChange={(e) => { createNewConnection(e.target.value) }}>
            <option value="" className='text-black'>+ New</option>
            <option value="whatsapp" className='text-black'>+ WhatsApp</option>
            <option value="waca" className='text-black'>+ WACA</option>
          </select>
        </div>
      </header>
      {/* Main content */}
      <main className="flex flex-1 flex-col h-full md:flex-row md:justify-center overflow-hidden">
        {children}
      </main>
    </div>
  );
}
