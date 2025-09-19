"use client";
import React, { useState, useEffect } from 'react';
import { getDashboardData } from '@/utils';
import DashboardSidebar from '@/components/Dashboard/DashboardSidebar';
import DashboardChat from '@/app/dashboard/chat/page';
import DashboardChatbot from '@/app/dashboard/chatbot/page';
import DashboardGoLive from '@/app/dashboard/golive/page';

type DashboardData = {
  usersCount: number;
  activeChats: number;
  botsOnline: number;
  revenue: number;
};

export default function DashboardPage() {
  const [sidebarHidden, setSidebarHidden] = useState(false);
  const [activeKey, setActiveKey] = useState('chats');
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [projectId, setProductId] = useState<string>("");

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError("");
      try {
        const data = await getDashboardData();
        setDashboardData(data);
      } catch {
        setError("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-50 text-gray-900">
      {/* Sidebar: hidden on mobile, collapsible on desktop */}
      <div className="w-full md:w-auto">
        <DashboardSidebar
          hidden={sidebarHidden}
          onToggle={() => setSidebarHidden(!sidebarHidden)}
          activeKey={activeKey}
          onNav={setActiveKey}
          onProductSelect={(id) => setProductId(String(id))}
        />
      </div>
      <main className="flex-1 text-gray-900 h-screen w-full p-0 m-0">
        {activeKey === 'chats' ? (
          <div className="bg-white rounded shadow p-0 min-h-[400px] text-gray-900 h-full w-full">
            <DashboardChat key={projectId} sidebarHidden={sidebarHidden} onSidebarToggle={() => setSidebarHidden(!sidebarHidden)} projectId={projectId} />
          </div>
        ) : activeKey === 'chatbot' ? (
          <div className="bg-white rounded shadow p-0 min-h-[400px] text-gray-900 h-full w-full">
            <DashboardChatbot key={projectId} sidebarHidden={sidebarHidden} onSidebarToggle={() => setSidebarHidden(!sidebarHidden)} projectId={projectId}/>
          </div>
        ) : activeKey === 'go-live' ? (
          <div className="bg-white rounded shadow p-0 min-h-[400px] text-gray-900 h-full w-full">
            <DashboardGoLive sidebarHidden={sidebarHidden} onSidebarToggle={() => setSidebarHidden(!sidebarHidden)} />
          </div>
        ) : (
          <>
            <h1 className="text-2xl md:text-3xl font-bold mb-6">Main Dashboard</h1>
            <div className="bg-white rounded shadow p-0 min-h-[400px] text-gray-900 h-full w-full">
              {loading ? (
                <p>Loading dashboard data...</p>
              ) : error ? (
                <p className="text-red-500">{error}</p>
              ) : dashboardData ? (
                <div className="space-y-4 p-6">
                  <div>Users: {dashboardData.usersCount}</div>
                  <div>Active Chats: {dashboardData.activeChats}</div>
                  <div>Bots Online: {dashboardData.botsOnline}</div>
                  <div>Revenue: ${dashboardData.revenue}</div>
                </div>
              ) : (
                <p>Select a feature from the sidebar.</p>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
