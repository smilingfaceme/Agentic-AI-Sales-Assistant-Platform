"use client";
import { useAppContext } from '@/contexts/AppContext';
import { FaRobot, FaBook, FaRegComment, FaRegHandPointRight, FaRegGrinStars  } from "react-icons/fa";
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function ChatbotPage({ children }: { children: React.ReactNode }) {
  const { sidebarHidden, setSidebarHidden, currentUser } = useAppContext();
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

      <main className="flex flex-1 h-full flex-col md:flex-row overflow-hidden">
        {/* Left buttons */}
        <aside className="w-full md:w-72 min-w-[220px] border-b border-gray-300 md:border-r m:border-gray-300 bg-white px-2 flex md:flex-col gap-1 md:py-6 md:px-4">
          {currentUser.permissions['knowledge'] === true && (
            <div className="w-full">
              {/* Main Knowledge Base Link */}
              <Link
                href="/dashboard/chatbot/knowledge"
                className={`flex items-center justify-between px-2 py-2 md:px-4 md:py-3 md:rounded-lg text-left md:transition-all md:duration-200 ${pathname.startsWith('/dashboard/chatbot/knowledge')
                    ? 'font-semibold md:bg-blue-50 border-b-2 md:border border-blue-300'
                    : 'hover:bg-gray-50 text-gray-700 border border-transparent hover:border-gray-300'
                  }`}
              >
                <span className="pl-2 text-sm lg:text-base text-center flex items-center">
                  <FaBook className="mr-1" /> Knowledge Base
                </span>
                {/* Optional dropdown indicator */}
                <svg
                  className={`w-4 h-4 ml-2 transform transition-transform duration-200 ${pathname.startsWith('/dashboard/chatbot/knowledge') ? 'rotate-90' : ''
                    }`}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </Link>

              {/* Submenu (visible only when on knowledge routes) */}
              {pathname.startsWith('/dashboard/chatbot/knowledge') && (
                <div className="ml-8 mt-2 flex flex-col space-y-1">
                  <Link
                    href="/dashboard/chatbot/knowledge/product"
                    className={`text-sm py-1 px-2 rounded-md transition-all ${pathname === '/dashboard/chatbot/knowledge/product'
                        ? 'font-bold'
                        : 'text-gray-600 hover:hover:bg-gray-50'
                      }`}
                  >
                    Products Base
                  </Link>

                  <Link
                    href="/dashboard/chatbot/knowledge/image"
                    className={`text-sm py-1 px-2 rounded-md transition-all ${pathname === '/dashboard/chatbot/knowledge/image'
                        ? 'font-bold'
                        : 'text-gray-600 hover:hover:bg-gray-50'
                      }`}
                  >
                    Images Base
                  </Link>

                  <Link
                    href="/dashboard/chatbot/knowledge/extra"
                    className={`text-sm py-1 px-2 rounded-md transition-all ${pathname === '/dashboard/chatbot/knowledge/extra'
                        ? 'font-bold'
                        : 'text-gray-600 hover:hover:bg-gray-50'
                      }`}
                  >
                    Extra Documents Base
                  </Link>
                </div>
              )}
            </div>
          )}

          {currentUser.permissions['knowledge'] === true && (
            <Link
              href="/dashboard/chatbot/personality"
              className={`flex items-center px-2 py-2 md:px-4 md:py-3 md:rounded-lg text-left md:transition-all md:duration-200 ${pathname === '/dashboard/chatbot/personality'
                ? 'font-semibold md:bg-blue-50 border-b-2 md:border border-blue-300'
                : 'hover:bg-gray-50 text-gray-700 border border-transparent hover:border-gray-300'
                }`}
            >
              <span className="pl-2 text-sm lg:text-base text-center flex items-center"><FaRegGrinStars className='mr-1' />Chatbot Personality</span>
            </Link>
          )}

          {currentUser.permissions['conversation'] == true && <Link
            href="/dashboard/chatbot/unanswered"
            className={`flex items-center px-2 py-2 md:px-4 md:py-3 md:rounded-lg text-left md:transition-all md:duration-200 ${pathname === '/dashboard/chatbot/unanswered'
              ? 'font-semibold md:bg-blue-50 border-b-2 md:border border-blue-300'
              : 'hover:bg-gray-50 text-gray-700 border border-transparent hover:border-gray-300'
              }`}
          >
            <span className="pl-2 text-sm lg:text-base text-center flex items-center"><FaRegComment className='mr-1' />Unanswered Questions</span>
          </Link>}
          {(currentUser.permissions['conversation'] == true || currentUser.permissions['knowledge'] == true) && <Link
            href="/dashboard/chatbot/test"
            className={`flex items-center px-2 py-2 md:px-4 md:py-3 md:rounded-lg text-left md:transition-all md:duration-200 ${pathname === '/dashboard/chatbot/test'
              ? 'font-semibold md:bg-blue-50 border-b-2 md:border border-blue-300'
              : 'hover:bg-gray-50 text-gray-700 border border-transparent hover:border-gray-300'
              }`}
          >
            <span className="pl-2 text-sm lg:text-base text-center flex items-center"><FaRegHandPointRight className='mr-1' />Test Chatbot</span>
          </Link>}
        </aside>
        {/* Right content area */}
        <div className="flex-1 flex flex-col h-full">
          {children}
        </div>
      </main>
    </div>
  );
}
