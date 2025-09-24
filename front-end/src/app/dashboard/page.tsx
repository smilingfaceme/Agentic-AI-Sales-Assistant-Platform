
"use client";
import { useState, useEffect } from 'react';
import { getDashboardData } from '@/utils';

type DashboardData = {
  usersCount: number;
  activeChats: number;
  botsOnline: number;
  revenue: number;
};

export default function DashboardPage() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
  );
}
