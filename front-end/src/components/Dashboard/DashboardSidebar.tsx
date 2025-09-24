"use client";
import React from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { FaBuilding, FaChevronDown, FaChevronLeft, FaComments, FaBroadcastTower, FaRobot, FaHeadset, FaSignOutAlt, FaHeart } from "react-icons/fa";
import { projectApi } from "@/services/apiService";
import { useAppContext } from '@/contexts/AppContext';

const navItems = [
  { label: "Chats", icon: <FaComments />, href: "/dashboard/chats" },
  { label: "Chatbot", icon: <FaRobot />, href: "/dashboard/chatbot" },
  // { label: "Workflows", icon: <FaProjectDiagram />, activeKey: "workflows" },
  // { label: "WA Bulk Msgs", icon: <FaLink />, activeKey: "wa-bulk", },
  { label: "Go live", icon: <FaBroadcastTower />, href: "/dashboard/go-live" },
];

// Commented out unused variable to fix ESLint warning
// const utilityItems = [
//   { label: "Help & Support", icon: <FaHeadset />, activeKey: "help" },
//   { label: "Logout", icon: <FaSignOutAlt />, activeKey: "logout" },
// ];


export default function DashboardSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { activeKey, setActiveKey, sidebarHidden, setSidebarHidden, setProjectId } = useAppContext();
  type Org = { name: string; project_id: string;[key: string]: unknown };
  const [projects, setProjects] = React.useState<Org[]>([]);
  const [selectedOrg, setSelectedOrg] = React.useState<Org>({ name: "", project_id: "" });
  const [orgDropdownOpen, setOrgDropdownOpen] = React.useState(false);

  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  // Fetch projects from backend
  const fetchProjects = React.useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await projectApi.getProjects();
      if (Array.isArray(data.projects)) {
        if (data.projects.length === 0) {
          router.push("/dashboard/new-project");
        } else {
          setProjects(data.projects);
          if (selectedOrg.name === "") {
            setSelectedOrg(data.projects[0] || { name: "", project_id: "" });
            setProjectId(data.projects[0].project_id);
          }
        }
      } else {
        setError(data.error || "Failed to fetch projects.");
      }
    } catch {
      setError("Server error. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [router, selectedOrg.name, setProjectId]);

  const logout = async () => {
    localStorage.clear();
    router.push("/")
  }
  // Fetch projects on mount
  React.useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  return (
    <aside
      className={`flex flex-col h-screen ${sidebarHidden ? "w-0 md:w-16" : "w-64"} bg-white border-r border-gray-300 shadow-lg pt-3 p-0 relative text-gray-900 transition-all duration-300
      ${sidebarHidden ? "overflow-hidden" : ""}
      fixed md:static top-0 left-0 z-40 md:z-auto
      ${sidebarHidden ? "md:block" : "block"}
      ${sidebarHidden ? "hidden md:flex" : "flex"}`}
      style={{ minWidth: sidebarHidden ? 0 : undefined }}
    >
      {/* Header / Organization */}
      <div className={`flex items-center border-b border-gray-300 ${sidebarHidden ? "justify-center p-4 pt-3" : "p-4 pt-2 pl-8"}`}>
        <div className={`flex items-center gap-4 ${!sidebarHidden ? "w-full" : ""}`}>
          <span onClick={() => setSidebarHidden(!sidebarHidden)} title={sidebarHidden ? "Show sidebar" : "Hide sidebar"} className="cursor-pointer">
            <FaBuilding className="text-xl" />
          </span>
          {!sidebarHidden && (
            <button
              className="text-md w-full flex items-center focus:outline-none w-full"
              onClick={async () => {
                setOrgDropdownOpen((open) => !open);
                if (!orgDropdownOpen) {
                  await fetchProjects();
                }
              }}
            >
              {selectedOrg.name || "Loading..."}
            </button>
          )}
        </div>
        {!sidebarHidden && (
          <div>
            <button
              className="text-md flex items-center focus:outline-none"
              onClick={async () => {
                setOrgDropdownOpen((open) => !open);
                if (!orgDropdownOpen) {
                  await fetchProjects();
                }
              }}
            >
              {orgDropdownOpen ? <FaChevronDown className="ml-2 text-gray-500" /> : <FaChevronLeft className="ml-2 text-gray-500" />}
            </button>
          </div>
        )}
      </div>
      {/* Main Navigation */}
      <nav className={`flex-1 flex flex-col gap-2 ${sidebarHidden ? "items-center" : "ml-5 mr-2"}`}>
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={
              sidebarHidden
                ? `flex items-center justify-center w-10 h-10 mb-2 rounded-lg transition-colors text-gray-900 ${pathname === item.href ? "bg-blue-100 text-blue-700 font-semibold" : "hover:bg-gray-100"}`
                : `flex items-center w-full px-3 py-2 mb-2 rounded transition-colors text-left text-gray-900 ${pathname === item.href ? "bg-blue-100 text-blue-700 font-semibold" : "hover:bg-gray-100"}`
            }
          >
            <span className={sidebarHidden ? "text-xl" : "mr-3 text-lg"}>{item.icon}</span>
            {!sidebarHidden && item.label}
          </Link>
        ))}
      </nav>
      {/* Utility Items */}
      <div className={`pb-4 ${sidebarHidden ? "flex flex-col items-center" : "ml-5"}`}>
        <button
          key="help"
          className={
            sidebarHidden
              ? `flex items-center justify-center w-10 h-10 mb-2 rounded-lg transition-colors text-gray-900 hover:bg-gray-100`
              : `flex items-center w-full px-3 py-2 mb-2 rounded transition-colors text-left text-gray-900 hover:bg-gray-100`
          }
          onClick={() => setActiveKey("help")}
        >
          <span className={sidebarHidden ? "text-xl" : "mr-3 text-lg"}><FaHeadset /></span>
          {!sidebarHidden && "Help & Support"}
        </button>
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
          {!sidebarHidden && "Logout"}
        </button>
      </div>
      {/* Footer */}
      <div className={`flex items-center justify-center py-2 border-t border-gray-200 ${sidebarHidden ? "" : "ml-5"}`}>
        <FaHeart className="text-red-400 mr-2" />
        {!sidebarHidden && <span className="text-xs text-gray-400">Made with love</span>}
      </div>

      {!sidebarHidden && (
        <>
          {orgDropdownOpen && (
            <div className="fixed inset-0" onClick={() => { setOrgDropdownOpen(false) }}>
              <div className="bg-white border border-gray-200 rounded-lg shadow-lg z-50 absolute" style={{ width: '215px', marginLeft: '40px', marginTop: '60px' }}>
                {loading && <div className="px-4 py-2 text-gray-400">Loading...</div>}
                {error && <div className="px-4 py-2 text-red-500">{error}</div>}
                {!loading && !error && projects.map((org) => (
                  <div
                    key={org.name}
                    className={`px-4 py-2 cursor-pointer hover:bg-gray-100 ${org === selectedOrg ? "bg-blue-50" : ""}`}
                    onClick={() => {
                      setSelectedOrg(org);
                      setOrgDropdownOpen(false);
                      setProjectId(org.project_id);
                    }}
                  >
                    {org.name}
                  </div>
                ))}
                <div
                  className="px-4 py-2 cursor-pointer text-blue-600 hover:bg-gray-50 border-t border-gray-100 font-medium"
                  onClick={() => {
                    setOrgDropdownOpen(false);
                    window.location.href = "/dashboard/new-project";
                  }}
                >
                  + New Project
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </aside>
  );
}
