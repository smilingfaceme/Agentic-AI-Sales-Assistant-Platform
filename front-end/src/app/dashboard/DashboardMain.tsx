"use client";
import React, { useState } from 'react';
import DashboardSidebar from '../../components/Dashboard/DashboardSidebar';
import DashboardChat from './chat/page';
import DashboardChatbot from './chatbot/page';
import DashboardGoLive from './golive/page';

export default function DashboardPage() {
  const [sidebarHidden, setSidebarHidden] = useState(false);
  const [activeKey, setActiveKey] = useState('wa-bulk');

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-50 text-gray-900">
      {/* Sidebar: hidden on mobile, collapsible on desktop */}
      <div className="w-full md:w-auto">
        <DashboardSidebar
          hidden={sidebarHidden}
          onToggle={() => setSidebarHidden(!sidebarHidden)}
          activeKey={activeKey}
          onNav={setActiveKey}
        />
      </div>
      <main className="flex-1 text-gray-900 h-screen w-full p-0 m-0">
          {activeKey === 'chats' ? (
            <div className="bg-white rounded shadow p-0 min-h-[400px] text-gray-900 h-full w-full">
              <DashboardChat sidebarHidden={sidebarHidden} onSidebarToggle={() => setSidebarHidden(!sidebarHidden)} />
            </div>
          ) : activeKey === 'chatbot' ? (
            <div className="bg-white rounded shadow p-0 min-h-[400px] text-gray-900 h-full w-full">
              <DashboardChatbot sidebarHidden={sidebarHidden} onSidebarToggle={() => setSidebarHidden(!sidebarHidden)} />
            </div>
          ) : activeKey === 'go-live' ? (
            <div className="bg-white rounded shadow p-0 min-h-[400px] text-gray-900 h-full w-full">
              <DashboardGoLive sidebarHidden={sidebarHidden} onSidebarToggle={() => setSidebarHidden(!sidebarHidden)}/>
            </div>
          ) : (
            <>
              <h1 className="text-2xl md:text-3xl font-bold mb-6">Main Dashboard</h1>
              <div className="bg-white rounded shadow p-0 min-h-[400px] text-gray-900 h-full w-full">
                <p>Select a feature from the sidebar.</p>
              </div>
            </>
          )}
      </main>
    </div>
  );
}
