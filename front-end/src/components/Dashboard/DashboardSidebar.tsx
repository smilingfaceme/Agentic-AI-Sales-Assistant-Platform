import React from 'react';
import { FaBuilding, FaChevronDown, FaComments, FaBroadcastTower, FaRobot, FaLink, FaHeadset, FaSignOutAlt, FaHeart } from 'react-icons/fa';

const navItems = [
  { label: 'Chats', icon: <FaComments />, activeKey: 'chats' },
  { label: 'WA Bulk Msgs', icon: <FaBroadcastTower />, activeKey: 'wa-bulk', highlight: true },
  { label: 'Chatbot', icon: <FaRobot />, activeKey: 'chatbot' },
  { label: 'Workflows', icon: <FaLink />, activeKey: 'workflows' },
  { label: 'Go live', icon: <FaBroadcastTower />, activeKey: 'go-live' },
];

const utilityItems = [
  { label: 'Help & Support', icon: <FaHeadset />, activeKey: 'help' },
  { label: 'Logout', icon: <FaSignOutAlt />, activeKey: 'logout' },
];

type DashboardSidebarProps = {
  activeKey?: string;
  onNav?: (key: string) => void;
  hidden?: boolean;
  onToggle?: () => void;
};

export default function DashboardSidebar({ activeKey = 'wa-bulk', onNav, hidden, onToggle }: DashboardSidebarProps) {
  return (
    <>
      <aside
        className={`flex flex-col h-screen ${hidden ? 'w-0 md:w-16' : 'w-64'} bg-white border-r border-gray-300 shadow-lg pt-3 p-0 relative text-gray-900 transition-all duration-300
        ${hidden ? 'overflow-hidden' : ''}
        fixed md:static top-0 left-0 z-40 md:z-auto
        ${hidden ? 'md:block' : 'block'}
        ${hidden ? 'hidden md:flex' : 'flex'}`}
        style={{ minWidth: hidden ? 0 : undefined }}
      >
        {/* Header / Organization */}
        <div className={`flex items-center ${hidden ? 'justify-center m-4' : 'm-4 ml-8'}`}> 
          <span onClick={onToggle} title={hidden ? 'Show sidebar' : 'Hide sidebar'} className="cursor-pointer">
            <FaBuilding className="text-xl" />
          </span>
          {!hidden && <span className="font-bold text-lg ml-2">Doshigroup</span>}
          {!hidden && <FaChevronDown className="ml-2 text-gray-500" />}
        </div>
        {/* Main Navigation */}
        <nav className={`flex-1 flex flex-col gap-2 ${hidden ? 'items-center' : 'ml-5'}`}>
          {navItems.map(item => (
            <button
              key={item.activeKey}
              className={
                hidden
                  ? `flex items-center justify-center w-10 h-10 mb-2 rounded-lg transition-colors text-gray-900 ${activeKey === item.activeKey ? 'bg-blue-100 text-blue-700 font-semibold' : 'hover:bg-gray-100'}`
                  : `flex items-center w-full px-3 py-2 mb-2 rounded transition-colors text-left text-gray-900 ${activeKey === item.activeKey ? 'bg-blue-100 text-blue-700 font-semibold' : 'hover:bg-gray-100'} ${item.highlight ? 'bg-blue-50 border-l-4 border-blue-500' : ''}`
              }
              onClick={() => onNav && onNav(item.activeKey)}
            >
              <span className={hidden ? 'text-xl' : 'mr-3 text-lg'}>{item.icon}</span>
              {!hidden && item.label}
            </button>
          ))}
        </nav>
        {/* Utility Items */}
        <div className={`pb-4 ${hidden ? 'flex flex-col items-center' : 'ml-5'}`}>
          {utilityItems.map(item => (
            <button
              key={item.activeKey}
              className={
                hidden
                  ? `flex items-center justify-center w-10 h-10 mb-2 rounded-lg transition-colors text-gray-900 hover:bg-gray-100`
                  : `flex items-center w-full px-3 py-2 mb-2 rounded transition-colors text-left text-gray-900 hover:bg-gray-100`
              }
              onClick={() => onNav && onNav(item.activeKey)}
            >
              <span className={hidden ? 'text-xl' : 'mr-3 text-lg'}>{item.icon}</span>
              {!hidden && item.label}
            </button>
          ))}
        </div>
        {/* Footer */}
        <div className={`flex items-center justify-center py-2 border-t border-gray-200 ${hidden ? '' : 'ml-5'}`}>
          <FaHeart className="text-red-400 mr-2" />
          {!hidden && <span className="text-xs text-gray-400">Made with love</span>}
        </div>
      </aside>
    </>
  );
}