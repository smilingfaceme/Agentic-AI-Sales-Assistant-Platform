"use client";
import React, { createContext, useContext, useState, ReactNode } from 'react';

interface ChatbotContextType {
  active: string;
  setActive: (active: string) => void;
  tableTitle: string;
  setTableTitle: (title: string) => void;
  showModal: boolean;
  setShowModal: (show: boolean) => void;
  file: File | null;
  setFile: (file: File | null) => void;
  activeMessage: MessageFile;
  setActiveMessage: (message: MessageFile) => void;
}

export type MessageFile = {
  conversation_name: string;
  conversation_id: string;
  content: string;
  created_at: string;
  source: string;
  [key: string]: unknown;
};

const ChatbotContext = createContext<ChatbotContextType | undefined>(undefined);

export function ChatbotProvider({ children }: { children: ReactNode }) {
  const [active, setActive] = useState<string>("Knowledge");
  const [tableTitle, setTableTitle] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [activeMessage, setActiveMessage] = useState<MessageFile>({
    conversation_name: '',
    conversation_id: '',
    content: '',
    created_at: '',
    source: ''
  });

  return (
    <ChatbotContext.Provider value={{
      active,
      setActive,
      tableTitle,
      setTableTitle,
      showModal,
      setShowModal,
      file,
      setFile,
      activeMessage,
      setActiveMessage
    }}>
      {children}
    </ChatbotContext.Provider>
  );
}

export function useChatbotContext() {
  const context = useContext(ChatbotContext);
  if (context === undefined) {
    throw new Error('useChatbotContext must be used within a ChatbotProvider');
  }
  return context;
}