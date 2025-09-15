import React from 'react';
import { useState } from "react";
import { FaComments} from 'react-icons/fa';
// Next.js + Tailwind Chat Page
const navButtons = [
  { label: "All", notify: 1 },
  { label: "Unassigned", notify: 0 },
  { label: "My chats", notify: 1 },
  { label: "Bot", notify: 0 },
];

const chatChannels = [
  {
    name: "disturbed-teal-roadrunner",
    lastMessage: "Hi",
    lastActivity: "2d",
    unread: 0,
  },
];

const chatMessages = [
  {
    sender: "user",
    text: "Hi, Do you know daniel",
    time: "12:34 PM",
    date: "2025-09-12",
    sources: [],
    email: "",
  },
  {
    sender: "bot",
    text:
      "Yes, I know Daniel Hiroshi. He is a Machine Learning Engineer with 8 years of experience, specializing in NLP, Computer Vision, and Machine Learning technologies. You can reach him at <a href='mailto:hiroshidaniel112@gmail.com' class='underline'>hiroshidaniel112@gmail.com</a> or connect on <a href='https://linkedin.com/in/daniel-hiroshi-21533936b' class='underline'>linkedin.com/in/daniel-hiroshi-21533936b</a>.",
    time: "12:34 PM",
    date: "2025-09-12",
    sources: ["Source", "1", "2", "3"],
    email: "Chatbot",
  },
  {
    sender: "bot",
    text: "Hi",
    time: "12:37 PM",
    date: "2025-09-12",
    sources: [],
    email: "vectorsuperdev@gmail.com",
  },
];

function formatDate(date: string) {
  const d = new Date(date);
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

interface ChatPageProps {
  sidebarHidden?: boolean;
  onSidebarToggle?: () => void;
}

const ChatPage: React.FC<ChatPageProps> = ({ sidebarHidden, onSidebarToggle }) => {
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
            aria-label={sidebarHidden ? 'Show sidebar' : 'Hide sidebar'}
          >
            <FaComments />
          </button>
          <span>Chats</span>
        </div>
      </header>

      {/* Main content: 2 columns, responsive */}
      <main className="flex flex-1 h-full flex-col md:flex-row">
        {/* Left sidebar - collapses on mobile */}
        <aside className="w-full md:w-100 min-w-[220px] border-r border-gray-300 bg-white flex flex-col md:block  md:flex">
          {/* Filter Navbar */}
          <div className="flex gap-2 px-4 border-b border-gray-300">
            {navButtons.map((btn) => (
              <button
                key={btn.label}
                className={`relative px-3 py-3 text-sm font-medium ${active == btn.label ? 'border-b' : 'hover:bg-gray-100'}`}
                onClick={() => setActive(btn.label)}
              >
                {btn.label}
                <span className={`ml-1 text-xs px-1 rounded-full ${btn.notify > 0 ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-400'}`}>{btn.notify}</span>
              </button>
            ))}
          </div>

          {/* Search and filter */}
          <div className="flex items-center px-4 py-2 gap-2 text-gray-400">
            <span>All chats <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs">1</span></span>
            <div className="ml-auto flex gap-2">
              <button className="p-1 hover:bg-gray-100 rounded">
                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /></svg>
              </button>
              <button className="p-1 hover:bg-gray-100 rounded">
                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 4v16m8-8H4" /></svg>
              </button>
            </div>
          </div>
          {/* Chat channel list */}
          <section className="flex-1 overflow-y-auto">
            {chatChannels.map((channel) => (
              <div
                key={channel.name}
                className="flex items-center gap-2 px-4 py-3 cursor-pointer hover:bg-gray-50 bg-[#f3f4f6]"
              >
                <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
                  <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /></svg>
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-sm text-gray-800">{channel.name}</div>
                  <div className="text-xs text-gray-500">{channel.lastMessage}</div>
                </div>
                <div className="text-xs text-gray-400">{channel.lastActivity}</div>
              </div>
            ))}
          </section>
        </aside>

        {/* Right chat area */}
        <section className="flex-1 flex flex-col bg-[#fafbfc] w-full">
          {/* Chat header */}
          <header className="flex items-center gap-2 px-4 md:px-6 py-4 border-b border-gray-300 bg-white">
            <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
              <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /></svg>
            </div>
            <span className="font-semibold text-md text-gray-800">disturbed-teal-roadrunner</span>
          </header>
          {/* Main chat area */}
          <div className="flex-1 px-2 md:px-10 py-4 md:py-6 overflow-y-auto bg-[#fafbfc] flex flex-col">
            {/* Date Separator */}
            <div className="flex items-center mb-6">
              <hr className="flex-1 border-t border-gray-300" />
              <span className="bg-gray-200 text-gray-600 px-4 py-1 rounded-full text-xs font-medium mx-4">
                {formatDate(chatMessages[0].date)}
              </span>
              <hr className="flex-1 border-t border-gray-300" />
            </div>
            {/* Messages */}
            <section className="flex flex-col gap-6">
              {chatMessages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.sender === 'user' ? 'justify-start ' : 'justify-end'}`}>
                  <div className={`max-w-[90vw] md:max-w-[40%] text-sm flex flex-col `}>
                    <div className={`rounded-tl-xl rounded-tr-xl px-4 py-3 ${msg.sender === 'bot' ? 'bg-[#23263b] text-white rounded-bl-xl' : 'bg-gray-200 text-gray-900 rounded-br-xl'}`}>
                      <span dangerouslySetInnerHTML={{ __html: msg.text }} />
                    </div>
                    
                    <span className="text-xs text-gray-600 mt-1 self-end">{msg.time}{msg.sender === 'bot' && <span className="ml-2">• {msg.email}</span>}</span>
                    {/* {msg.sender === 'bot' && (
                      <div className="mt-2 flex items-center gap-2 text-xs text-gray-600">
                        {msg.sources.length > 0 && (
                          <span>Source</span>
                        )}
                        {msg.sources.map((s, i) => (
                          <span key={i} className="underline cursor-pointer text-gray-600">{s}</span>
                        ))}
                      </div>
                    )} */}
                  </div>
                </div>
              ))}
            </section>
          </div>
          {/* Message Input Area */}
          <footer className="flex items-center gap-2 border-t border-gray-200 bg-white px-4 md:px-6 py-4">
            <button className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500">
              <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 4v16m8-8H4" /></svg>
            </button>
            <input
              className="flex-1 px-4 py-2 rounded-full border bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-200"
              placeholder="Type message or '/' for quick response"
            />
            <button className="p-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white">
              <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
            </button>
          </footer>
        </section>
      </main>
    </div>
  );
};

export default ChatPage;