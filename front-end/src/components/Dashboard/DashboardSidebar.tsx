"use client";
import React from "react";
import { useRouter } from "next/navigation";
import { FaBuilding, FaChevronDown, FaChevronLeft, FaComments, FaBroadcastTower, FaRobot, FaProjectDiagram, FaHeadset, FaSignOutAlt, FaHeart } from "react-icons/fa";
import { apiRequest } from "@/utils";
const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5000/api';

const navItems = [
  { label: "Chats", icon: <FaComments />, activeKey: "chats" },
  { label: "Chatbot", icon: <FaRobot />, activeKey: "chatbot" },
  { label: "Workflows", icon: <FaProjectDiagram />, activeKey: "workflows" },
  // { label: "WA Bulk Msgs", icon: <FaLink />, activeKey: "wa-bulk", },
  { label: "Go live", icon: <FaBroadcastTower />, activeKey: "go-live" },
];

const utilityItems = [
  { label: "Help & Support", icon: <FaHeadset />, activeKey: "help" },
  { label: "Logout", icon: <FaSignOutAlt />, activeKey: "logout" },
];

type DashboardSidebarProps = {
  activeKey?: string;
  onNav?: (key: string) => void;
  hidden?: boolean;
  onToggle?: () => void;
  onProductSelect?: (productId: string) => void;
};


export default function DashboardSidebar({ activeKey = "wa-bulk", onNav, hidden, onToggle, onProductSelect }: DashboardSidebarProps) {
  const router = useRouter();
  type Org = { name: string; project_id: string;[key: string]: unknown };
  const [projects, setProjects] = React.useState<Org[]>([]);
  const [selectedOrg, setSelectedOrg] = React.useState<Org>({ name: "", project_id: "" });
  const [orgDropdownOpen, setOrgDropdownOpen] = React.useState(false);

  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  // Fetch projects from backend
  const fetchProjects = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await apiRequest(`${API_BASE}/project/get`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      const data = await res.json();
      if (res.ok && Array.isArray(data.projects)) {
        if ((data.projects.length) == 0) {
          router.push("/dashboard/new-project")
        } else {
          setProjects(data.projects);
          if (selectedOrg.name == "") {
            setSelectedOrg(data.projects[0] || { name: "", project_id: "" });
          }
          if (onProductSelect) {
            onProductSelect(data.projects[0].project_id);
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
  };

  // Fetch projects on mount
  React.useEffect(() => {
    fetchProjects();
  }, []);

  return (
    <aside
      className={`flex flex-col h-screen ${hidden ? "w-0 md:w-16" : "w-64"} bg-white border-r border-gray-300 shadow-lg pt-3 p-0 relative text-gray-900 transition-all duration-300
      ${hidden ? "overflow-hidden" : ""}
      fixed md:static top-0 left-0 z-40 md:z-auto
      ${hidden ? "md:block" : "block"}
      ${hidden ? "hidden md:flex" : "flex"}`}
      style={{ minWidth: hidden ? 0 : undefined }}
    >
      {/* Header / Organization */}
      <div className={`flex items-center border-b border-gray-300 ${hidden ? "justify-center p-4 pt-3" : "p-4 pt-2 pl-8"}`}>
        <span onClick={onToggle} title={hidden ? "Show sidebar" : "Hide sidebar"} className="cursor-pointer">
          <FaBuilding className="text-xl" />
        </span>
        {!hidden && (
          <div className="relative ml-2">
            <button
              className="text-md flex items-center focus:outline-none"
              onClick={async () => {
                setOrgDropdownOpen((open) => !open);
                if (!orgDropdownOpen) {
                  await fetchProjects();
                }
              }}
            >
              {selectedOrg.name || "Loading..."}
              {orgDropdownOpen ? <FaChevronDown className="ml-2 text-gray-500" /> : <FaChevronLeft className="ml-2 text-gray-500" />}
            </button>
            {orgDropdownOpen && (
              <div className="absolute left-0 mt-2 w-45 bg-white border border-gray-200 rounded shadow-lg z-50">
                {loading && <div className="px-4 py-2 text-gray-400">Loading...</div>}
                {error && <div className="px-4 py-2 text-red-500">{error}</div>}
                {!loading && !error && projects.map((org) => (
                  <div
                    key={org.name}
                    className={`px-4 py-2 cursor-pointer hover:bg-gray-100 ${org === selectedOrg ? "bg-blue-50" : ""}`}
                    onClick={() => {
                      setSelectedOrg(org);
                      setOrgDropdownOpen(false);
                      if (onProductSelect) {
                        onProductSelect(org.project_id);
                      }
                    }}
                  >
                    {org.name}
                  </div>
                ))}
                <div
                  className="px-4 py-2 cursor-pointer text-blue-600 hover:bg-blue-50 border-t border-gray-100 font-medium"
                  onClick={() => {
                    setOrgDropdownOpen(false);
                    window.location.href = "/dashboard/new-project";
                  }}
                >
                  + New Organization
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      {/* Main Navigation */}
      <nav className={`flex-1 flex flex-col gap-2 ${hidden ? "items-center" : "ml-5 mr-2"}`}>
        {navItems.map((item) => (
          <button
            key={item.activeKey}
            className={
              hidden
                ? `flex items-center justify-center w-10 h-10 mb-2 rounded-lg transition-colors text-gray-900 ${activeKey === item.activeKey ? "bg-blue-100 text-blue-700 font-semibold" : "hover:bg-gray-100"}`
                : `flex items-center w-full px-3 py-2 mb-2 rounded transition-colors text-left text-gray-900 ${activeKey === item.activeKey ? "bg-blue-100 text-blue-700 font-semibold" : "hover:bg-gray-100"}`
            }
            onClick={() => onNav && onNav(item.activeKey)}
          >
            <span className={hidden ? "text-xl" : "mr-3 text-lg"}>{item.icon}</span>
            {!hidden && item.label}
          </button>
        ))}
      </nav>
      {/* Utility Items */}
      <div className={`pb-4 ${hidden ? "flex flex-col items-center" : "ml-5"}`}>
        {utilityItems.map((item) => (
          <button
            key={item.activeKey}
            className={
              hidden
                ? `flex items-center justify-center w-10 h-10 mb-2 rounded-lg transition-colors text-gray-900 hover:bg-gray-100`
                : `flex items-center w-full px-3 py-2 mb-2 rounded transition-colors text-left text-gray-900 hover:bg-gray-100`
            }
            onClick={() => onNav && onNav(item.activeKey)}
          >
            <span className={hidden ? "text-xl" : "mr-3 text-lg"}>{item.icon}</span>
            {!hidden && item.label}
          </button>
        ))}
      </div>
      {/* Footer */}
      <div className={`flex items-center justify-center py-2 border-t border-gray-200 ${hidden ? "" : "ml-5"}`}>
        <FaHeart className="text-red-400 mr-2" />
        {!hidden && <span className="text-xs text-gray-400">Made with love</span>}
      </div>
    </aside>
  );
}