"use client";
import { useState, useEffect } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { getDashboardData } from '@/utils';
import DashboardSidebar from '@/components/Dashboard/DashboardSidebar';

type DashboardData = {
  usersCount: number;
  activeChats: number;
  botsOnline: number;
  revenue: number;
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { projectId } = useAppContext();
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
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-50 text-gray-900">
      <div className="w-full md:w-auto">
        <DashboardSidebar />
      </div>
      <main className="flex-1 text-gray-900 h-screen w-full p-0 m-0">
        <div className="bg-white rounded shadow p-0 min-h-[400px] text-gray-900 h-full w-full">
          {children}
        </div>
      </main>
    </div>
  );
}