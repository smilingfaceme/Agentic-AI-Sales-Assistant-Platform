"use client";
import React, { createContext, useContext, useState, ReactNode } from 'react';

export type ChatMessage = {
  message_id: number;
  conversation_id: string;
  sender_type: 'customer' | 'bot' | 'agent';
  user_id?: string | null;
  email?: string | null;
  content: string;
  created_at?: string;
};

export type Conversation = {
  conversation_id: string;
  conversation_name: string;
  ai_reply: boolean;
  started_at: string;
  ended_at: string | null;
  source: string;
  phone_number:string;
  agent_id: string;
  customer_id: string;
};

interface ChatContextType {
  activeConversation: Conversation | null;
  setActiveConversation: (conversation: Conversation | null) => void;
  chatMessages: ChatMessage[];
  setChatMessages: (messages: ChatMessage[]) => void;
  agentMessage: string;
  setAgentMessage: (message: string) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: ReactNode }) {
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [agentMessage, setAgentMessage] = useState("");

  return (
    <ChatContext.Provider value={{
      activeConversation,
      setActiveConversation,
      chatMessages,
      setChatMessages,
      agentMessage,
      setAgentMessage
    }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChatContext() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChatContext must be used within a ChatProvider');
  }
  return context;
}