import ChatPage from '../../../components/Dashboard/ChatPage';

interface ChatPageProps {
  sidebarHidden?: boolean;
  onSidebarToggle?: () => void;
}

export default function DashboardChat({ sidebarHidden, onSidebarToggle }: ChatPageProps) {
  return <ChatPage sidebarHidden={sidebarHidden} onSidebarToggle={onSidebarToggle}/>;
}
