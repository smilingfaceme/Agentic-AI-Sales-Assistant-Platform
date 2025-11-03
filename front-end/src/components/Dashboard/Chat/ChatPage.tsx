"use client";
import { useState, useEffect, useCallback } from "react";
import { FaComments, FaWhatsapp, FaGlobe, FaRedo, FaTimes } from "react-icons/fa";
import ChatArea from "@/components/Dashboard/ChatArea/ChatArea";
import LoadingWrapper from "@/components/LoadingWrapper";
import { useAppContext } from '@/contexts/AppContext';
import { useChatContext, Conversation } from '@/contexts/ChatContext';
import { useChatAreaContext } from '@/contexts/ChatAreaContext'
import { chatApi } from "@/services/apiService";
import { useApiCall } from "@/hooks/useApiCall";

type NotifyKey = 'All' | 'Unassigned' | 'WhatsApp' | 'Test';

const navButtons: { label: string; key: NotifyKey }[] = [
  { label: "All", key: "All" },
  { label: "Unassigned", key: "Unassigned" },
  { label: "My chats", key: "Test" },
  { label: "Bot", key: "WhatsApp" },
];

export default function ChatPage() {
  const { sidebarHidden, setSidebarHidden } = useAppContext();
  const { activeConversation, setActiveConversation } = useChatContext();
  const { setActiveChatHistory } = useChatAreaContext();

  const [notifies, setNotifies] = useState({
    'All': 0,
    'Unassigned': 0,
    'WhatsApp': 0,
    'Test': 0
  });
  const [showModal, setShowModal] = useState(false)

  const [active, setActive] = useState<NotifyKey>('All');
  const [chatChannels, setChatChannels] = useState<Conversation[]>([]);

  // Use the API call hook for managing loading states and preventing duplicate requests
  const { isLoading, error, execute } = useApiCall();

  const fetchConversations = useCallback(async () => {
    const result = await execute(async () => {
      return await chatApi.getConversations();
    });

    if (result && result.conversations) {
      setChatChannels(result.conversations);
      setActiveConversation(result.conversations[0]);
      setActiveChatHistory(result.conversations[0]);
      countBySource(result.conversations);
    } else {
      setChatChannels([]);
    }
  }, [execute, setActiveConversation, setActiveChatHistory]);

  const getshowConversations = (filter_key: string) => {
    if (filter_key === 'All') {
      return chatChannels
    } else {
      const whatsappConversations: Conversation[] = chatChannels.filter(
        (convo: Conversation) => convo.source.toLowerCase() === filter_key.toLowerCase()
      );
      return whatsappConversations
    }
  }

  const countBySource = (projects: Conversation[]) => {
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
  }, [fetchConversations]);

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
            <FaComments />
          </button>
          <span>Chats</span>
        </div>
      </header>

      {/* Main content: 2 columns, responsive */}
      <main className="flex flex-1 h-full flex-col md:flex-row overflow-hidden">
        {/* Left sidebar - collapses on mobile */}
        <aside className={`${showModal ? "hidden md:block" : "block"} w-full h-full md:w-100 min-w-[220px] border-r border-gray-300 bg-white flex flex-col md:block md:flex`}>
          {/* Filter Navbar */}
          <div className="flex gap-2 px-4 border-b border-gray-300">
            {navButtons.map((btn) => (
              <button
                key={btn.label}
                className={`relative px-2 py-3 text-sm font-medium ${active === btn.label ? "border-b border-blue-500" : "hover:bg-gray-100"}`}
                onClick={() => {
                  setActive(btn.key);
                }}
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
              <button className="p-1 hover:bg-gray-100 rounded" aria-label="Add chat" onClick={fetchConversations}>
                <FaRedo />
              </button>
            </div>
          </div>
          {/* Chat channel list */}
          <section className="flex-1 overflow-y-auto">
            <LoadingWrapper
              isLoading={isLoading}
              error={error}
              text="Loading conversations..."
              type="inline"
              className="min-h-[200px]"
            >
              {chatChannels.length == 0 ? (
                <div className="flex items-center justify-center py-8 text-gray-500">
                  No conversations found
                </div>
              ) : (
                <>
                  {getshowConversations(active).map((channel) => (
                    <button
                      key={channel.conversation_id}
                      className={`flex items-center justify-between w-full gap-2 px-4 py-3 cursor-pointer border-b border-gray-300 hover:bg-gray-50 ${activeConversation?.conversation_id == channel.conversation_id ? 'bg-gray-200' : 'bg-white'}`}
                      onClick={() => {
                        setActiveConversation(channel);
                        setActiveChatHistory(channel);
                        setShowModal(true);
                      }}
                    >
                      <div className="flex">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center">
                          {channel.source == "WhatsApp" ? <FaWhatsapp size={30} color="oklch(62.7% 0.194 149.214)" /> : <FaGlobe size={28} />}
                        </div>
                        <div className="flex-1 text-left ml-2">
                          <div className="font-semibold text-sm text-gray-800">{channel.conversation_name} - {channel.phone_number}</div>
                          <div className="text-xs text-gray-500">Source: {channel.source} </div>
                          <div className="text-xs text-gray-500">AI Reply: {channel.ai_reply ? "Yes" : "No"}</div>
                        </div>
                      </div>
                      <div className="text-xs text-gray-400">{channel.started_at ? new Date(channel.started_at).toLocaleString() : ""}</div>
                    </button>
                  ))}
                </>
              )}
            </LoadingWrapper>
          </section>
        </aside>

        {/* Right chat area */}
        {/* Modal */}
        <div className={`${showModal ? "block" : "hidden md:block"} flex-1 flex flex-col bg-gray-50 h-full`}>
          <button
            className={`${showModal ? "block md:hidden" : "hidden"} absolute top-4 right-2 rounded-full hover:bg-gray-100 flex items-center justify-center w-10 h-10`}
            onClick={() => setShowModal(false)}
          >
            <FaTimes />
          </button>
          {activeConversation && <ChatArea />}
        </div>
      </main>
    </div>
  );
}
