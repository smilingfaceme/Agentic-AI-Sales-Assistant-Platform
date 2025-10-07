"use client";
import { useAppContext } from '@/contexts/AppContext';
import { FaRobot, FaBook, FaRegComment, FaRegHandPointRight } from "react-icons/fa";
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function ChatbotPage({ children }: { children: React.ReactNode }) {
  const { sidebarHidden, setSidebarHidden, currentUser } = useAppContext();
  const pathname = usePathname();

  return (
    <div className="flex flex-col h-screen w-full bg-[#fafbfc]">
      {/* Header */}
      <header className="px-4 md:px-6 py-4 md:pt-5 border-b border-gray-300 bg-white text-lg font-semibold flex items-center justify-between">
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
        <aside className="w-full md:w-72 min-w-[220px] border-b border-gray-300 md:border-r m:border-gray-300 bg-white px-2 flex md:flex-col gap-1 md:py-6 md:px-4">
          {currentUser.permissions['knowledge'] == true &&<Link
            href="/dashboard/chatbot/knowledge"
            className={`flex items-center px-2 py-2 md:px-4 md:py-3 md:rounded-lg text-left md:transition-all md:duration-200 ${pathname === '/dashboard/chatbot/knowledge'
              ? 'font-semibold md:bg-blue-50 text-blue-700 border-b-2 md:border border-blue-300'
              : 'hover:bg-gray-50 text-gray-700 border border-transparent hover:border-gray-300'
              }`}
          >
            <span className="pl-2 text-sm lg:text-base text-center flex items-center"><FaBook className='mr-1'/>Knowledge Base</span>
          </Link>}
          {currentUser.permissions['conversation'] == true && <Link
            href="/dashboard/chatbot/unanswered"
            className={`flex items-center px-2 py-2 md:px-4 md:py-3 md:rounded-lg text-left md:transition-all md:duration-200 ${pathname === '/dashboard/chatbot/unanswered'
              ? 'font-semibold md:bg-blue-50 text-blue-700 border-b-2 md:border border-blue-300'
              : 'hover:bg-gray-50 text-gray-700 border border-transparent hover:border-gray-300'
              }`}
          >
            <span className="pl-2 text-sm lg:text-base text-center flex items-center"><FaRegComment className='mr-1'/>Unanswered Questions</span>
          </Link>}
          {(currentUser.permissions['conversation'] == true || currentUser.permissions['knowledge'] == true) && <Link
            href="/dashboard/chatbot/test"
            className={`flex items-center px-2 py-2 md:px-4 md:py-3 md:rounded-lg text-left md:transition-all md:duration-200 ${pathname === '/dashboard/chatbot/test'
              ? 'font-semibold md:bg-blue-50 text-blue-700 border-b-2 md:border border-blue-300'
              : 'hover:bg-gray-50 text-gray-700 border border-transparent hover:border-gray-300'
              }`}
          > 
            <span className="pl-2 text-sm lg:text-base text-center flex items-center"><FaRegHandPointRight className='mr-1'/>Test Chatbot</span>
          </Link>}
        </aside>
        {/* Right content area */}
        <div className="flex-1 h-full">
          {children}
        </div>
      </main>
    </div>
  );
}
