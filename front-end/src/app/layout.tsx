import type { Metadata } from "next";
import "./globals.css";
import { AppProvider } from '@/contexts/AppContext';
import { ChatProvider } from '@/contexts/ChatContext';
import { ChatAreaProvider } from '@/contexts/ChatAreaContext';
import PermissionWrapper from '@/components/PermissionWrapper';

export const metadata: Metadata = {
  title: "DoshiAI",
  description: "DoshiAI WhatsApp Bot Admin Panel",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <AppProvider>
          <ChatProvider>
            <ChatAreaProvider>
              <PermissionWrapper>
                {children}
              </PermissionWrapper>
            </ChatAreaProvider>
          </ChatProvider>
        </AppProvider>
      </body>
    </html>
  )
}
