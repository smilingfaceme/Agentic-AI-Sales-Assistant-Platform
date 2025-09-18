import ChatbotPage from '@/components/Dashboard/Chatbot/ChatbotPage';

interface ChatbotPageProps {
  sidebarHidden?: boolean;
  onSidebarToggle?: () => void;
  projectId?: string;
}

export default function DashboardChatbot({ sidebarHidden, onSidebarToggle, projectId }: ChatbotPageProps) {
  return <ChatbotPage key={projectId} sidebarHidden={sidebarHidden} onSidebarToggle={onSidebarToggle} projectId={projectId}/>;
}

