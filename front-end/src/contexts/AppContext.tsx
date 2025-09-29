"use client";
import { createContext, useContext, useState, ReactNode } from 'react';

export type User = {
  name: string;
  email: string;
  company_name: string;
  company_description: string;
  role: string;
  permissions: object;
};

export type Role = {
  "id": string;
  "name": string;
  "permissions": object;
  [key: string]: unknown;
}

interface AppContextType {
  currentUser: User;
  setCurrentUser: (user: User) => void;
  companyId:string;
  setCompanyId: (id: string) => void;
  projectId: string;
  setProjectId: (id: string) => void;
  activeKey: string;
  setActiveKey: (key: string) => void;
  sidebarHidden: boolean;
  setSidebarHidden: (hidden: boolean) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User>({
    name: '',
    email: '',
    company_description: '',
    company_name: '',
    role: '',
    permissions: {}
  });
  const [companyId, setCompanyId] = useState<string>("");
  const [projectId, setProjectId] = useState<string>("");
  const [activeKey, setActiveKey] = useState('chats');
  const [sidebarHidden, setSidebarHidden] = useState(false);

  return (
    <AppContext.Provider value={{
      currentUser,
      setCurrentUser,
      companyId,
      setCompanyId,
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