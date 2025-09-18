import React, { useEffect, useState, useCallback } from "react";
import { apiRequest } from "@/utils";
import { FaWhatsapp, FaGlobe, FaRobot } from "react-icons/fa";
import LoadingWrapper from "@/components/LoadingWrapper";
import { useApiCall } from "@/hooks/useApiCall";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5000/api';

export type ChatMessage = {
  message_id: number;
  conversation_id : string;
  sender_type: 'customer' | 'bot' | 'agent';
  user_id?: string | null;
  email?: string | null;
  content: string;
  created_at?: string;
};

function formatDate(date: string) {
  const d = new Date(date);
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

interface ChatHistoryPageProps {
  conversationId?: string;
  conversationName?: string;
  conversationSource?: string;
}


export default function ChatArea({conversationId, conversationName, conversationSource}:ChatHistoryPageProps) {
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

  // Use the API call hook for managing loading states and preventing duplicate requests
  const { isLoading, error, execute } = useApiCall();

  const fetchChatsHistory = useCallback(async () => {
    const result = await execute(async () => {
      const res = await apiRequest(`${API_BASE}/chats/history?conversation_id=${conversationId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      if (!res.ok) throw new Error("Failed to fetch chat history");
      const data = await res.json();
      return data;
    });

    if (result && result.messages) {
      setChatMessages(result.messages);
    }
  }, [conversationId, execute]);

  useEffect(() => {
    fetchChatsHistory()
  }, [fetchChatsHistory]);

  // Find the first message date for the separator
  const firstDate = chatMessages.length > 0 ? chatMessages[0].created_at ?? new Date().toISOString() : new Date().toISOString();

  return (
    <section className="flex-1 flex flex-col bg-[#fafbfc] w-full">
      {/* Chat header */}
      <header className="flex items-center gap-2 px-4 md:px-6 py-4 border-b border-gray-300 bg-white">
        <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
          {conversationSource?.toLowerCase() == 'whatsapp'?<FaWhatsapp size={28} color="green"/>:<FaGlobe size={28} />}
        </div>
        <span className="font-semibold text-md text-gray-800">{conversationName}</span>
      </header>
      {/* Main chat area */}
      <div className="flex-1 px-2 md:px-10 py-4 md:py-6 overflow-y-auto bg-[#fafbfc] flex flex-col">
        <LoadingWrapper
          isLoading={isLoading}
          error={error}
          text="Loading chat history..."
          type="inline"
          className="flex-1"
        >
          {chatMessages.length > 0 ? (
            <>
              {/* Date Separator */}
              <div className="flex items-center mb-6">
                <hr className="flex-1 border-t border-gray-300" />
                <span className="bg-gray-200 text-gray-600 px-4 py-1 rounded-full text-xs font-medium mx-4">
                  {formatDate(firstDate)}
                </span>
                <hr className="flex-1 border-t border-gray-300" />
              </div>
              {/* Messages */}
              <section className="flex flex-col gap-6">
                {chatMessages.map((msg, idx) => (
                  <div key={msg.message_id ?? idx} className={`flex ${msg.sender_type === "customer" ? "justify-start" : "justify-end"}`}>
                    <div className={`max-w-[90vw] md:max-w-[40%] text-sm flex flex-col`}>
                      <div className={`rounded-tl-xl rounded-tr-xl px-4 py-3 ${msg.sender_type === "customer" ? "bg-gray-200 text-gray-900 rounded-br-xl" : "bg-[#23263b] text-white rounded-bl-xl" }`}>
                        <span>{msg.content}</span>
                      </div>
                      <span className="flex text-xs text-gray-600 mt-1 self-end">
                        {msg.created_at ? new Date(msg.created_at).toLocaleTimeString() : ""}
                        {msg.sender_type == "agent" && msg.user_id && (
                          <span className="ml-2">• {msg.email}</span>
                        )}
                        {msg.sender_type == "bot" && <><span className="ml-2">• </span><FaRobot className="ml-1" size={15}/></>}
                      </span>
                    </div>
                  </div>
                ))}
              </section>
            </>
          ) : (
            <div className="flex items-center justify-center flex-1 text-gray-500">
              No messages in this conversation yet
            </div>
          )}
        </LoadingWrapper>
      </div>
      {/* Message Input Area */}
      <footer className="flex items-center gap-2 border-t border-gray-200 bg-white px-4 md:px-6 py-4">
        <button className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500" aria-label="Attach">
          <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 4v16m8-8H4" /></svg>
        </button>
        <input
          className="flex-1 px-4 py-2 rounded-full border bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-200"
          placeholder="Type message or '/' for quick response"
          type="text"
        />
        <button className="p-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white" aria-label="Send">
          <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
        </button>
      </footer>
    </section>
  );
}
