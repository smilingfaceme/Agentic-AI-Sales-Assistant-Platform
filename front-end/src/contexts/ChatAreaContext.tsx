"use client";
import React, { createContext, useContext, useState, ReactNode } from 'react';

export type ChatMessage = {
  message_id: number;
  conversation_id: string;
  sender_type: 'customer' | 'bot' | 'agent';
  sender_email?: string | null;
  content: string;
  created_at?: string;
};

export type ChatHistory = {
  conversation_name: string;
  conversation_id: string;
  source: string;
  [key: string]: unknown;
};

interface ChatAreaContextType {
  activeChatHistory: ChatHistory | null;
  setActiveChatHistory: (conversation: ChatHistory | null) => void;
  chatMessages: ChatMessage[];
  setChatMessages: (messages: ChatMessage[]) => void;
  agentMessage: string;
  setAgentMessage: (message: string) => void;
}

const ChatAreaContext = createContext<ChatAreaContextType | undefined>(undefined);

export function ChatAreaProvider({ children }: { children: ReactNode }) {
  const [activeChatHistory, setActiveChatHistory] = useState<ChatHistory | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [agentMessage, setAgentMessage] = useState("");

  return (
    <ChatAreaContext.Provider value={{
      activeChatHistory,
      setActiveChatHistory,
      chatMessages,
      setChatMessages,
      agentMessage,
      setAgentMessage
    }}>
      {children}
    </ChatAreaContext.Provider>
  );
}

export function useChatAreaContext() {
  const context = useContext(ChatAreaContext);
  if (context === undefined) {
    throw new Error('useChatAreaContext must be used within a ChatAreaProvider');
  }
  return context;
}