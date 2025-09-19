import ChatPage from '@/components/Dashboard/Chat/ChatPage';

interface ChatPageProps {
  sidebarHidden?: boolean;
  onSidebarToggle?: () => void;
  projectId?: string;
}

export default function DashboardChat({ sidebarHidden, onSidebarToggle, projectId }: ChatPageProps) {
  return <ChatPage key={projectId} sidebarHidden={sidebarHidden} onSidebarToggle={onSidebarToggle} projectId={projectId}/>;
}
