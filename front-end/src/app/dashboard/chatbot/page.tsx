import ChatbotPage from '../../../components/Dashboard/ChatbotPage';

interface ChatbotPageProps {
  sidebarHidden?: boolean;
  onSidebarToggle?: () => void;
}

export default function DashboardChatbot({ sidebarHidden, onSidebarToggle }: ChatbotPageProps) {
  return <ChatbotPage sidebarHidden={sidebarHidden} onSidebarToggle={onSidebarToggle}/>;
}

