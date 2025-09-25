import GoLivePage from '@/components/Dashboard/GoLive/GolivePage';

export default function ChatbotLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
      <GoLivePage>{children}</GoLivePage>
  );
}