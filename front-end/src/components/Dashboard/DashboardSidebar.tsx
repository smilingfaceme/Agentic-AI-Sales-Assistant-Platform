"use client";
import React from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { FaBuilding, FaCogs, FaComments, FaBroadcastTower, FaRobot, FaSignOutAlt, FaHeart, FaProjectDiagram, FaLeaf } from "react-icons/fa";
import { useAppContext, User } from '@/contexts/AppContext';
import { getCookie, logout } from "@/utils";

// Commented out unused variable to fix ESLint warning
// const utilityItems = [
//   // { label: "Help & Support", icon: <FaHeadset />, activeKey: "help" },
//   { label: "Settings", icon: <FaCogs />, activeKey: "settings" },
//   { label: "Logout", icon: <FaSignOutAlt />, activeKey: "logout" },
// ];

export default function DashboardSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { sidebarHidden, setSidebarHidden, currentUser, setCurrentUser } = useAppContext();

  // Fetch projects on mount
  React.useEffect(() => {
    if (currentUser.email == "") {
      const user: User | null = getCookie<User>("user");
      if (user) {
        setCurrentUser(user)
      } else {
        router.push('/auth/login')
      }
      // console.log(user)
    }
  }, [currentUser, setCurrentUser, router]);

  return (
    <div className="w-full md:w-auto absolute fixed md:relative z-200" onClick={() => setSidebarHidden(true)}>
      <aside
        className={`flex flex-col h-screen ${sidebarHidden ? "w-0 md:w-16" : "w-55"} bg-gray-100 border-r border-gray-300 shadow-lg pt-3 p-0 relative text-gray-900 transition-all duration-300
      ${sidebarHidden ? "overflow-hidden" : ""}
      fixed md:static top-0 left-0 z-40 md:z-auto
      ${sidebarHidden ? "md:block" : "block"}
      ${sidebarHidden ? "hidden md:flex" : "flex"}`}
        style={{ minWidth: sidebarHidden ? 0 : undefined }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header / Organization */}
        <div className={`flex items-center border-b mt-2 md:mt-0 border-gray-300 ${sidebarHidden ? "justify-center p-4 pt-3" : "p-4 pt-1 pl-8"}`}>
          <div className={`flex items-center ${!sidebarHidden ? "w-full" : ""}`}>
            <span onClick={() => setSidebarHidden(!sidebarHidden)} title={sidebarHidden ? "Show sidebar" : "Hide sidebar"} className="cursor-pointer">
              <FaBuilding className="text-xl" />
            </span>
            {!sidebarHidden && <span className="text-lg font-bold ml-2">{currentUser.company_name}</span>}
          </div>
        </div>
        {/* Main Navigation */}
        <nav className={`flex-1 flex flex-col gap-2 ${sidebarHidden ? "items-center" : "ml-5 mr-2"}`}>
          {currentUser.permissions['chat'] == true && <Link
            key="/dashboard/chats"
            href="/dashboard/chats"
            className={
              sidebarHidden
                ? `flex items-center justify-center w-10 h-10 mb-2 rounded-lg transition-colors text-gray-900 ${pathname.startsWith("/dashboard/chats") ? "bg-blue-100 text-blue-700 font-semibold" : "hover:bg-gray-100"}`
                : `flex items-center w-full px-3 py-2 mb-2 rounded transition-colors text-left text-gray-900 ${pathname.startsWith("/dashboard/chats") ? "bg-blue-100 text-blue-700 font-semibold" : "hover:bg-gray-100"}`
            }
          >
            <span className={sidebarHidden ? "text-xl" : "mr-3 text-lg"}><FaComments /></span>
            {!sidebarHidden && 'Chats'}
          </Link>}
          {(currentUser.permissions['conversation'] == true || currentUser.permissions['knowledge'] == true) && <Link
            key="/dashboard/chatbot"
            href="/dashboard/chatbot"
            className={
              sidebarHidden
                ? `flex items-center justify-center w-10 h-10 mb-2 rounded-lg transition-colors text-gray-900 ${pathname.startsWith("/dashboard/chatbot") ? "bg-blue-100 text-blue-700 font-semibold" : "hover:bg-gray-100"}`
                : `flex items-center w-full px-3 py-2 mb-2 rounded transition-colors text-left text-gray-900 ${pathname.startsWith("/dashboard/chatbot") ? "bg-blue-100 text-blue-700 font-semibold" : "hover:bg-gray-100"}`
            }
          >
            <span className={sidebarHidden ? "text-xl" : "mr-3 text-lg"}><FaRobot /></span>
            {!sidebarHidden && 'Chatbot'}
          </Link>}
          {currentUser.permissions['workflow'] == true && <Link
            key="/dashboard/workflow"
            href="/dashboard/workflow"
            className={
              sidebarHidden
                ? `flex items-center justify-center w-10 h-10 mb-2 rounded-lg transition-colors text-gray-900 ${pathname.startsWith("/dashboard/workflow") ? "bg-blue-100 text-blue-700 font-semibold" : "hover:bg-gray-100"}`
                : `flex items-center w-full px-3 py-2 mb-2 rounded transition-colors text-left text-gray-900 ${pathname.startsWith("/dashboard/workflow") ? "bg-blue-100 text-blue-700 font-semibold" : "hover:bg-gray-100"}`
            }
          >
            <span className={sidebarHidden ? "text-xl" : "mr-3 text-lg"}><FaProjectDiagram /></span>
            {!sidebarHidden && 'Workflow'}
          </Link>}
          {currentUser.permissions['integration'] == true && <Link
            key="/dashboard/go-live"
            href="/dashboard/go-live"
            className={
              sidebarHidden
                ? `flex items-center justify-center w-10 h-10 mb-2 rounded-lg transition-colors text-gray-900 ${pathname.startsWith("/dashboard/go-live") ? "bg-blue-100 text-blue-700 font-semibold" : "hover:bg-gray-100"}`
                : `flex items-center w-full px-3 py-2 mb-2 rounded transition-colors text-left text-gray-900 ${pathname.startsWith("/dashboard/go-live") ? "bg-blue-100 text-blue-700 font-semibold" : "hover:bg-gray-100"}`
            }
          >
            <span className={sidebarHidden ? "text-xl" : "mr-3 text-lg"}><FaBroadcastTower /></span>
            {!sidebarHidden && 'Go live'}
          </Link>}
          <Link
            key="/dashboard/sustainability"
            href="/dashboard/sustainability"
            className={
              sidebarHidden
                ? `flex items-center justify-center w-10 h-10 mb-2 rounded-lg transition-colors text-gray-900 ${pathname.startsWith("/dashboard/sustainability") ? "bg-blue-100 text-blue-700 font-semibold" : "hover:bg-gray-100"}`
                : `flex items-center w-full px-3 py-2 mb-2 rounded transition-colors text-left text-gray-900 ${pathname.startsWith("/dashboard/sustainability") ? "bg-blue-100 text-blue-700 font-semibold" : "hover:bg-gray-100"}`
            }
          >
            <span className={sidebarHidden ? "text-xl" : "mr-3 text-lg"}><FaLeaf /></span>
            {!sidebarHidden && 'Sustainability'}
          </Link>
        </nav>
        {/* Utility Items */}
        <div className={`pb-4 ${sidebarHidden ? "flex flex-col items-center" : "ml-5"}`}>
          <Link
            key='settings'
            href='/dashboard/settings'
            className={
              sidebarHidden
                ? `flex items-center justify-center w-10 h-10 mb-2 rounded-lg transition-colors text-gray-900 ${pathname.startsWith('/dashboard/settings') ? "bg-blue-100 text-blue-700 font-semibold" : "hover:bg-gray-100"}`
                : `flex items-center w-full px-3 py-2 mb-2 rounded transition-colors text-left text-gray-900 ${pathname.startsWith('/dashboard/settings') ? "bg-blue-100 text-blue-700 font-semibold" : "hover:bg-gray-100"}`
            }
          >
            <span className={sidebarHidden ? "text-xl" : "mr-3 text-lg"}><FaCogs /></span>
            {!sidebarHidden && 'Settings'}
          </Link>
          <button
            key="logout"
            className={
              sidebarHidden
                ? `flex items-center justify-center w-10 h-10 mb-2 rounded-lg transition-colors text-gray-900 hover:bg-gray-100`
                : `flex items-center w-full px-3 py-2 mb-2 rounded transition-colors text-left text-gray-900 hover:bg-gray-100`
            }
            onClick={logout}
          >
            <span className={sidebarHidden ? "text-xl" : "mr-3 text-lg"}><FaSignOutAlt /></span>
            {!sidebarHidden && 'Logout'}
          </button>
        </div>
        {/* Footer */}
        <div className={`flex items-center justify-center py-2 border-t border-gray-200 ${sidebarHidden ? "" : "ml-5"}`}>
          <FaHeart className="text-red-400 mr-2" />
          {!sidebarHidden && <span className="text-xs text-gray-400">Made with love</span>}
        </div>
      </aside>
    </div>
  );
}
