"use client";
import { useState, useEffect } from 'react';
import { isAuthenticated } from '@/utils';
import DashboardSidebar from '@/components/Dashboard/DashboardSidebar';
import { useRouter } from 'next/navigation';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);

  // Check authentication on mount
  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/auth/login');
      return;
    }
    setAuthChecked(true);
  }, [router]);

  // Show loading or nothing while checking authentication
  if (!authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-600">Checking authentication...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-50 text-gray-900">
      <DashboardSidebar />
      <main className="flex-1 text-gray-900 h-screen w-full p-0 m-0">
        <div className="bg-white rounded shadow p-0 min-h-[400px] text-gray-900 h-full w-full">
          {children}
        </div>
      </main>
    </div>
  );
}