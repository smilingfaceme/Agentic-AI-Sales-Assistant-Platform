"use client";
import { useState } from "react";
import { FaRobot, FaBook, FaRegComment, FaRegHandPointRight} from "react-icons/fa";
import KnowledgeArea from "@/components/Dashboard/Chatbot/knowledgeArea"

interface ChatbotPageProps {
  sidebarHidden?: boolean;
  onSidebarToggle?: () => void;
  projectId?: string;
}

export default function ChatbotPage({ sidebarHidden, onSidebarToggle, projectId }: ChatbotPageProps) {

  const [active, setActive] = useState<string>("All");
  const [tableTitlte, setTableTitlte] = useState("")

  const handleUnansweredButtonEvent = async () => {
    setActive('Unanswered')
    setTableTitlte("Unanswered Questions")
  }
  return (
    <div className="flex flex-col h-screen w-full bg-[#fafbfc]">
      {/* Header */}
      <header className="px-4 md:px-6 py-4 border-b border-gray-300 bg-white text-lg font-semibold flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Sidebar toggle only on mobile */}
          <button
            className="md:hidden bg-white border border-gray-300 rounded-full p-2 shadow-lg mr-2"
            onClick={onSidebarToggle}
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
          <button
            className={`flex items-center px-4 py-2 rounded ${active == 'Knowledge' ? 'font-semibold bg-gray-100' : 'hover:bg-gray-50'}`}
            onClick={() => {setActive('Knowledge')}}
          >
            <FaBook />
            <span className="pl-2">Knowledge Base</span>
          </button>
          <button
            className={`flex items-center px-4 py-2 rounded ${active == 'Unanswered' ? 'font-semibold bg-gray-100' : 'hover:bg-gray-50'}`}
            onClick={handleUnansweredButtonEvent}
          >
            <FaRegComment />
            <span className="pl-2">Unanswered Questions</span>
          </button>
          <button
            className={`flex items-center px-4 py-2 rounded ${active == 'Test' ? 'font-semibold bg-gray-100' : 'hover:bg-gray-50'}`}
            onClick={() => setActive('Test')}
          >
            <FaRegHandPointRight />
            <span className="pl-2">Test Chatbot</span>
          </button>
        </aside>
        {/* Right table */}
        {active == 'Knowledge' && <KnowledgeArea key={tableTitlte} projectId={projectId}/>}
      </main>
    </div>
  );
}
