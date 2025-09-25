import React, { useEffect, useCallback } from "react";
import { chatApi } from "@/services/apiService";
import { FaWhatsapp, FaGlobe } from "react-icons/fa";
import LoadingWrapper from "@/components/LoadingWrapper";
import ChatPanel from '@/components/Dashboard/ChatArea/ChatPanel'
import { useApiCall } from "@/hooks/useApiCall";
import { useChatAreaContext } from '@/contexts/ChatAreaContext';

export default function ChatArea() {
  const { activeChatHistory, chatMessages, setChatMessages, agentMessage, setAgentMessage } = useChatAreaContext();

  // Use the API call hook for managing loading states and preventing duplicate requests
  const { isLoading, error, execute } = useApiCall();

  const fetchChatHistory = useCallback(async () => {
    if (!activeChatHistory?.conversation_id) return;
    
    const result = await execute(async () => {
      return await chatApi.getChatHistory(activeChatHistory.conversation_id);
    });

    if (result && result.messages) {
      setChatMessages(result.messages);
    }
  }, [activeChatHistory?.conversation_id, execute, setChatMessages]);

  const sendNewMessage = async (message: string, sender_type: string) => {
    if (!activeChatHistory?.conversation_id || !message.trim()) return;

    const data = await chatApi.sendMessage(activeChatHistory.conversation_id, message, sender_type);
    if (data.message) {
      setChatMessages([...chatMessages, data.message]);
    }
    setAgentMessage("");
  };

  useEffect(() => {
    fetchChatHistory();
  }, [fetchChatHistory]);

  if (!activeChatHistory) {
    return <div className="flex-1 flex items-center justify-center">Select a conversation</div>;
  }

  return (
    <section className="flex-1 flex flex-col bg-gray-50 h-full">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-gray-200 bg-white px-4 md:px-6 py-4">
        <div className="flex items-center gap-3">
          {activeChatHistory.source === 'WhatsApp' ? <FaWhatsapp size={28} color="green" /> : <FaGlobe size={28} />}
          <div>
            <h2 className="font-semibold text-gray-900">{activeChatHistory.conversation_name}</h2>
            <p className="text-sm text-gray-500">{activeChatHistory.source}</p>
          </div>
        </div>
      </header>
      {/* Main chat area */}
      <div className="flex-1 px-2 md:px-10 py-4 md:py-6 overflow-y-auto bg-[#fafbfc] flex flex-col-reverse">
        <LoadingWrapper
          isLoading={isLoading}
          error={error}
          text="Loading chat history..."
          type="inline"
          className="flex-1"
        >
          <ChatPanel chatMessages={chatMessages} />
        </LoadingWrapper>
      </div>

      {/* Message Input Area */}
      <footer className="flex items-center gap-2 border-t border-gray-200 bg-white px-4 md:px-6 py-4">
        <input
          className="flex-1 px-4 py-2 rounded-full border bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-200"
          placeholder="Type message or '/' for quick response"
          type="text"
          value={agentMessage}
          onChange={(e) => setAgentMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              sendNewMessage(agentMessage, "agent");
            }
          }}
        />
        <button
          className="p-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white"
          aria-label="Send"
          onClick={() => {
            sendNewMessage(agentMessage, "agent");
            setAgentMessage("");
          }}
        >
          <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </button>
      </footer>
    </section>
  );
}
