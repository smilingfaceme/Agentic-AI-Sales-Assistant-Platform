"use client";
import { useAppContext } from '@/contexts/AppContext';
import { FaRobot, FaBook, FaRegComment, FaRegHandPointRight} from "react-icons/fa";
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function ChatbotPage({ children }: { children: React.ReactNode }) {
  const { sidebarHidden, setSidebarHidden } = useAppContext();
  const pathname = usePathname();

  return (
    <div className="flex flex-col h-screen w-full bg-[#fafbfc]">
      {/* Header */}
      <header className="px-4 md:px-6 py-4 border-b border-gray-300 bg-white text-lg font-semibold flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Sidebar toggle only on mobile */}
          <button
            className="md:hidden bg-white border border-gray-300 rounded-full p-2 shadow-lg mr-2"
            onClick={() => setSidebarHidden(!sidebarHidden)}
            aria-label={sidebarHidden ? "Show sidebar" : "Hide sidebar"}
          >
            <FaRobot />
          </button>
          <span>Chatbot Settings</span>
        </div>
      </header>
      <main className="flex flex-1 h-full flex-col md:flex-row">
        {/* Left buttons */}
        <aside className="w-full md:w-72 min-w-[220px] border-r border-gray-300 bg-white flex flex-col gap-2 py-6 px-4">
          <Link
            href="/dashboard/chatbot/knowledge"
            className={`flex items-center px-4 py-2 rounded ${pathname === '/dashboard/chatbot/knowledge' ? 'font-semibold bg-gray-100' : 'hover:bg-gray-50'}`}
          >
            <FaBook />
            <span className="pl-2">Knowledge Base</span>
          </Link>
          <Link
            href="/dashboard/chatbot/unanswered"
            className={`flex items-center px-4 py-2 rounded ${pathname === '/dashboard/chatbot/unanswered' ? 'font-semibold bg-gray-100' : 'hover:bg-gray-50'}`}
          >
            <FaRegComment />
            <span className="pl-2">Unanswered Questions</span>
          </Link>
          <Link
            href="/dashboard/chatbot/test"
            className={`flex items-center px-4 py-2 rounded ${pathname === '/dashboard/chatbot/test' ? 'font-semibold bg-gray-100' : 'hover:bg-gray-50'}`}
          >
            <FaRegHandPointRight />
            <span className="pl-2">Test Chatbot</span>
          </Link>
        </aside>
        {/* Right content area */}
        <div className="flex-1">
          {children}
        </div>
      </main>
    </div>
  );
}
