"use client";
import { useState, useEffect } from "react";
import { FaComments, FaWhatsapp, FaGlobe, FaRedo } from "react-icons/fa";
import ChatArea from "@/components/Dashboard/ChatArea";

import { apiRequest } from "@/utils";
const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5000/api';

type NotifyKey = 'All' | 'Unassigned' | 'WhatsApp' | 'Test';

const navButtons: { label: string; key: NotifyKey }[] = [
  { label: "All", key: "All" },
  { label: "Unassigned", key: "Unassigned" },
  { label: "My chats", key: "Test" },
  { label: "Bot", key: "WhatsApp" },
];

interface ChatPageProps {
  sidebarHidden?: boolean;
  onSidebarToggle?: () => void;
  projectId?: string;
}

export default function ChatPage({ sidebarHidden, onSidebarToggle, projectId }: ChatPageProps) {
  type Project = {
    conversation_id: string,
    project_id: string,
    conversation_name: string,
    ai_reply: true,
    started_at: string,
    ended_at: null,
    source: string
  }

  const [notifies, setNotifies] = useState({
    'All': 0,
    'Unassigned': 0,
    'WhatsApp': 0,
    'Test': 0
  });

  const [active, setActive] = useState<NotifyKey>('All');
  const [activeConversation, setActiveConversation] = useState<Project>(
    {
      conversation_id: '',
      project_id: '',
      conversation_name: '',
      ai_reply: true,
      started_at: '',
      ended_at: null,
      source: ''
    }
  );
  const [chatChannels, setChatChannels] = useState<Project[]>([]);

  const fetchConversations = async () => {
    try {
      const res = await apiRequest(`${API_BASE}/conversation?project_id=${projectId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      if (!res.ok) throw new Error("Failed to fetch conversations");
      const data = await res.json();
      if (data.conversations) {
        setChatChannels(data.conversations)
        setActiveConversation(data.conversations[0].conversation_id)
        countBySource(data.conversations)
      }
    } catch {
      setChatChannels([]);
    }
  }

  const getshowConversations = (filter_key: string) => {
    if (filter_key === 'All') {
      return chatChannels
    } else {
      const whatsappConversations: Project[] = chatChannels.filter(
        (convo: Project) => convo.source.toLowerCase() === filter_key.toLowerCase()
      );
      return whatsappConversations
    }
  }

  const countBySource = (projects: Project[]) => {
    const counts: Record<string, number> = projects.reduce<Record<string, number>>((acc, { source }) => {
      acc[source] = (acc[source] || 0) + 1;
      return acc;
    }, {});

    const notifiesObj = {
      All: projects.length,
      Unassigned: counts['Unassigned'] || 0,
      WhatsApp: counts['WhatsApp'] || 0,
      Test: counts['Test'] || 0
    };

    setNotifies(notifiesObj)
  };

  useEffect(() => {
    fetchConversations();
  }, []);

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
            <FaComments />
          </button>
          <span>Chats</span>
        </div>
      </header>

      {/* Main content: 2 columns, responsive */}
      <main className="flex flex-1 h-full flex-col md:flex-row">
        {/* Left sidebar - collapses on mobile */}
        <aside className="w-full md:w-100 min-w-[220px] border-r border-gray-300 bg-white flex flex-col md:block md:flex">
          {/* Filter Navbar */}
          <div className="flex gap-2 px-4 border-b border-gray-300">
            {navButtons.map((btn) => (
              <button
                key={btn.label}
                className={`relative px-3 py-3 text-sm font-medium ${active === btn.label ? "border-b border-blue-500" : "hover:bg-gray-100"}`}
                onClick={() => setActive(btn.key)}
              >
                {btn.label}
                <span className={`ml-1 text-xs px-1 rounded-full ${notifies[btn.key] > 0 ? "bg-blue-100 text-blue-700" : "bg-gray-200 text-gray-400"}`}>{notifies[btn.key]}</span>
              </button>
            ))}
          </div>

          {/* Search and filter */}
          <div className="flex items-center px-4 py-2 gap-2 text-gray-400 border-b border-gray-300">
            <span>{active} Chats <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs">{notifies[active]}</span></span>
            <div className="ml-auto flex gap-2">
              <button className="p-1 hover:bg-gray-100 rounded" aria-label="Search">
                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /></svg>
              </button>
              <button className="p-1 hover:bg-gray-100 rounded" aria-label="Add chat" onClick={fetchConversations}>
                <FaRedo />
              </button>
            </div>
          </div>
          {/* Chat channel list */}
          <section className="flex-1 overflow-y-auto">
            {chatChannels.length == 0 ?
              <div> </div> :
              <>
                {getshowConversations(active).map((channel) => (
                  <button
                    key={channel.conversation_id}
                    className={`flex items-center justify-between w-full gap-2 px-4 py-3 cursor-pointer border-b border-gray-300 hover:bg-gray-50 ${activeConversation.conversation_id == channel.conversation_id ? 'bg-gray-200' : 'bg-white'}`}
                    onClick={() => setActiveConversation(channel)}
                  >
                    <div className="flex">
                      <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
                        {channel.source == "WhatsApp" ? <FaWhatsapp size={25} color="green" /> : <FaGlobe size={25} />}
                      </div>
                      <div className="flex-1 text-left ml-2">
                        <div className="font-semibold text-sm text-gray-800">{channel.conversation_name}</div>
                        <div className="text-xs text-gray-500">Source: {channel.source}</div>
                        <div className="text-xs text-gray-500">AI Reply: {channel.ai_reply ? "Yes" : "No"}</div>
                      </div>
                    </div>
                    <div className="text-xs text-gray-400">{channel.started_at ? new Date(channel.started_at).toLocaleString() : ""}</div>
                  </button>
                ))}
              </>
            }
          </section>
        </aside>

        {/* Right chat area */}
        {activeConversation && <ChatArea key={activeConversation.conversation_id} conversationId={activeConversation.conversation_id} conversationName={activeConversation.conversation_name} conversationSource={activeConversation.source} />}
      </main>
    </div>
  );
}