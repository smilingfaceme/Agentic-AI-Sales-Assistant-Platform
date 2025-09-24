"use client";
import React, { useState } from "react";
import { useAppContext } from '@/contexts/AppContext';
import { chatApi } from "@/services/apiService";
import { FaGlobe } from "react-icons/fa";
import LoadingWrapper from "@/components/LoadingWrapper";
import TestChatBotPanel from '@/components/Dashboard/Chatbot/TestChat/TestChatPanel';
import { useApiCall } from "@/hooks/useApiCall";

export type ChatMessage = {
  message_id: number;
  conversation_id: string;
  sender_type: 'customer' | 'bot' | 'agent';
  user_id?: string | null;
  email?: string | null;
  content: string;
  created_at?: string;
};

export default function TestChatbotPage() {
  const { projectId } = useAppContext();
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [agentMessage, setAgentMessage] = useState("");
  const [conversationId, setConversationId] = useState("");

  // Use the API call hook for managing loading states and preventing duplicate requests
  const { isLoading, error } = useApiCall();

  const sendNewMessage = async (message: string, sender_type: string) => {
    let currentConversationId = conversationId;

    if (!currentConversationId || currentConversationId === "") {
      const data = await chatApi.createConversation(projectId, "Test My ChatBot", "Test");
      currentConversationId = data.conversations[0].conversation_id;
      setConversationId(currentConversationId);
    }

    const data = await chatApi.sendMessage(currentConversationId, message, sender_type);
    if (data.message) {
      setChatMessages([...chatMessages, data.message]);
    }
  };
  return (
    <section className="flex-1 flex flex-col bg-[#fafbfc] w-full" style={{ height: '100%' }}>
      {/* Chat header */}
      <header className="flex items-center gap-2 px-4 md:px-6 py-4 border-b border-gray-300 bg-white">
        <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
          <FaGlobe size={28} />
        </div>
        <span className="font-semibold text-md text-gray-800">Test My Chatbot</span>
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
          <TestChatBotPanel chatMessages={chatMessages} key={chatMessages.length} />
        </LoadingWrapper>
      </div>

      {/* Message Input Area */}
      <footer className="flex items-center gap-2 border-t border-gray-200 bg-white px-4 md:px-6 py-4">
        <button className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500" aria-label="Attach">
          <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path d="M12 4v16m8-8H4" />
          </svg>
        </button>
        <input
          className="flex-1 px-4 py-2 rounded-full border bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-200"
          placeholder="Type message or '/' for quick response"
          type="text"
          value={agentMessage}
          onChange={(e) => setAgentMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault(); // prevent form submission if inside a form
              sendNewMessage(agentMessage, "customer");
              setAgentMessage(""); // optional: clear input after sending
            }
          }}
        />
        <button
          className="p-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white"
          aria-label="Send"
          onClick={() => {
            sendNewMessage(agentMessage, "customer");
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
