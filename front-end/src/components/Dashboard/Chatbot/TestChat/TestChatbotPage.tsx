"use client";
import Image from "next/image";
import React, { useState, useRef } from "react";
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
  extra: {
    // images?: string[];
    [key: string]: unknown;
  };
};

export default function TestChatbotPage() {
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [agentMessage, setAgentMessage] = useState("");
  const [conversationId, setConversationId] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Use the API call hook for managing loading states and preventing duplicate requests
  const { isLoading, error } = useApiCall();

  const sendNewMessage = async (message: string, sender_type: string, image?: File | null) => {
    let currentConversationId = conversationId;

    if (!currentConversationId || currentConversationId === "") {
      const data = await chatApi.createConversation("Test My ChatBot", "Test");
      currentConversationId = data.conversations[0].conversation_id;
      setConversationId(currentConversationId);
    }

    const new_message: ChatMessage = {
      "content": message,
      "created_at": new Date().toISOString(),
      "message_id": 2,
      "sender_type": 'customer',
      "email": "",
      "conversation_id": conversationId,
      "extra": {
        images: image ? [image.name] : []
      }
    };
    setChatMessages([...chatMessages, new_message]);
    if (image) {
      // For image message, you may want to upload the image and get a URL
      // Here, we assume chatApi.sendImageMessage returns the uploaded image URL
      const data = await chatApi.sendImageMessage(currentConversationId, image, sender_type, message);

      if (data.messages) {
        const reply_messages = data.messages.map((i:ChatMessage) => {
          const e = {
            images: i.extra?.images ?? [],
            extra: i.extra?.extra ?? [],
          };
          i.extra = e;
          return i;
        });
        console.log(reply_messages)
        setChatMessages([...chatMessages, ...reply_messages]);
      }
      return;
    } else {
      const data = await chatApi.sendMessage(currentConversationId, message, sender_type);
      if (data.messages) {
        setChatMessages([...chatMessages, ...data.messages]);
      }
    }
  };
  return (
    <section className="flex-1 flex flex-col bg-gray-50 h-full">
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
      <footer className="flex flex-col gap-2 border-t border-gray-200 bg-white px-4 md:px-6 py-4">
        {/* Image preview above input */}
        {imageFile && (
          <div className="flex items-center gap-2 mb-2">
            <Image
              width={200}
              height={200}
              src={URL.createObjectURL(imageFile)}
              alt="preview"
              className="w-16 h-16 object-cover rounded-lg border"
            />
            <button
              className="text-xs px-2 py-1 bg-red-100 text-red-600 rounded"
              onClick={() => {
                setImageFile(null);
                if (fileInputRef.current) fileInputRef.current.value = "";
              }}
            >Remove</button>
          </div>
        )}
        <div className="flex items-center gap-2 w-full">
          {/* Image upload button */}
          <button
            className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500"
            aria-label="Attach image"
            onClick={() => fileInputRef.current?.click()}
          >
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M4 17V7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2zm2-2l4-4 4 4 4-4" />
            </svg>
          </button>
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            style={{ display: "none" }}
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                setImageFile(e.target.files[0]);
              }
            }}
          />
          <input
            className="flex-1 px-4 py-2 rounded-full border bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-200"
            placeholder="Type message or '/' for quick response"
            type="text"
            value={agentMessage}
            onChange={(e) => setAgentMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (agentMessage.trim() || imageFile)) {
                e.preventDefault();
                if (imageFile) {
                  sendNewMessage(agentMessage, "customer", imageFile);
                  setImageFile(null);
                  setAgentMessage("");
                  if (fileInputRef.current) fileInputRef.current.value = "";
                } else if (agentMessage.trim()) {
                  sendNewMessage(agentMessage, "customer");
                  setAgentMessage("");
                }
              }
            }}
          />
          {/* Single send button for text or image */}
          <button
            className="p-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white"
            aria-label="Send"
            disabled={!(agentMessage.trim() || imageFile)}
            onClick={() => {
              if (imageFile) {
                sendNewMessage(agentMessage, "customer", imageFile);
                setImageFile(null);
                setAgentMessage("");
                if (fileInputRef.current) fileInputRef.current.value = "";
              } else if (agentMessage.trim()) {
                sendNewMessage(agentMessage, "customer");
                setAgentMessage("");
              }
            }}
          >
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </footer>
    </section>
  );
}
