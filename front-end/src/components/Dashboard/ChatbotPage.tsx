"use client";
import { useState } from "react";
import { FaRobot , FaBook, FaRegComment, FaRegHandPointRight, FaSyncAlt, } from "react-icons/fa";
import Table from "@/components/Table";

const chatbotTableData = [
  {
    "Title & Description": "FAQ Bot\nHandles frequently asked questions",
    "Created on": "2025-09-01",
    "Modified on": "2025-09-10",
    "Status": "Active",
    "Actions": "Edit/Delete",
  },
  {
    "Title & Description": "FAQ Bot\nHandles frequently asked questions",
    "Created on": "2025-09-01",
    "Modified on": "2025-09-10",
    "Status": "Active",
    "Actions": "Edit/Delete",
  },
];

const chatbotTableHeaders = [
  "Title & Description",
  "Created on",
  "Modified on",
  "Status",
  "Actions",
];

interface ChatbotPageProps {
  sidebarHidden?: boolean;
  onSidebarToggle?: () => void;
}

export default function ChatbotPage({ sidebarHidden, onSidebarToggle }: ChatbotPageProps) {
  const [active, setActive] = useState<string>("All");
  
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
            className={`flex items-center px-4 py-2 rounded ${active == 'Knowledge' ? 'font-semibold bg-gray-100': 'hover:bg-gray-50'}`}
            onClick={()=>setActive('Knowledge')}
          >
            <FaBook />
            <span className="pl-2">Knowledge Base</span>
          </button>
          <button 
            className={`flex items-center px-4 py-2 rounded ${active == 'Unanswered' ? 'font-semibold bg-gray-100': 'hover:bg-gray-50'}`}
            onClick={()=>setActive('Unanswered')}
          >
            <FaRegComment />
            <span className="pl-2">Unanswered Questions</span>
          </button>
          <button 
            className={`flex items-center px-4 py-2 rounded ${active == 'Test' ? 'font-semibold bg-gray-100': 'hover:bg-gray-50'}`}
            onClick={()=>setActive('Test')}
          >
            <FaRegHandPointRight />
            <span className="pl-2">Test Chatbot</span>
          </button>
        </aside>
        {/* Right table */}
        <section className="flex-1 flex flex-col bg-white w-full p-6">
          {/* Table Header */}
          <div className="flex items-center justify-between mb-4 border-b-2 border-gray-300 px-4 py-1">
            <div className="text-md font-semibold">Documents</div>
            <div className="flex gap-2">
              <button
                className="px-3 py-1 hover:bg-gray-200 rounded text-sm flex items-center justfy-center"
                aria-label="Refresh"
                onClick={() => {/* TODO: Add refresh logic */}}
              >
                <FaSyncAlt />
                <span className="ml-2">Refresh</span>
              </button>
              <button
                className="px-3 py-1 bg-black hover:bg-gray-700 font-semibold text-white rounded text-sm"
                aria-label="New Chatbot"
                onClick={() => {/* TODO: Add new chatbot logic */}}
              >
                + New
              </button>
            </div>
          </div>
          <Table headers={chatbotTableHeaders} data={chatbotTableData} />
        </section>
      </main>
    </div>
  );
}
