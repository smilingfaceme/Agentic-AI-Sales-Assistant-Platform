import { ChatbotProvider } from '@/contexts/ChatbotContext';
import ChatbotPage from '@/components/Dashboard/Chatbot/ChatbotPage';

export default function ChatbotLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ChatbotProvider>
      <ChatbotPage>{children}</ChatbotPage>
    </ChatbotProvider>
  );
}