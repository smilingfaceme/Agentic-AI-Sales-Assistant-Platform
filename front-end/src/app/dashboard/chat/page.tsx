import ChatPage from '../../../components/Dashboard/ChatPage';

interface ChatPageProps {
  sidebarHidden?: boolean;
  onSidebarToggle?: () => void;
  productId?: string;
}

export default function DashboardChat({ sidebarHidden, onSidebarToggle, productId }: ChatPageProps) {
  return <ChatPage sidebarHidden={sidebarHidden} onSidebarToggle={onSidebarToggle} productId={productId}/>;
}
