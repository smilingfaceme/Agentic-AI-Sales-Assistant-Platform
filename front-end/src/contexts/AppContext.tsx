"use client";
import { createContext, useContext, useState, ReactNode } from 'react';

interface AppContextType {
  projectId: string;
  setProjectId: (id: string) => void;
  activeKey: string;
  setActiveKey: (key: string) => void;
  sidebarHidden: boolean;
  setSidebarHidden: (hidden: boolean) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [projectId, setProjectId] = useState<string>("");
  const [activeKey, setActiveKey] = useState('chats');
  const [sidebarHidden, setSidebarHidden] = useState(false);

  return (
    <AppContext.Provider value={{
      projectId,
      setProjectId,
      activeKey,
      setActiveKey,
      sidebarHidden,
      setSidebarHidden
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}