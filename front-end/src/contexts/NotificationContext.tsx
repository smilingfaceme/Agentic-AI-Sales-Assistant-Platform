"use client";
import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import Notification, { NotificationType } from '../components/Notification';

interface NotificationItem {
  id: number;
  message: string;
  type: NotificationType;
  autoClose?: boolean;
  progress?: number; // For dynamic progress (0-100)
  isProgress?: boolean; // Flag for progress notification
}

interface NotificationContextProps {
  showNotification: (message: string, type: NotificationType, autoClose?: boolean) => void;
  showProgressNotification: (message: string, initialProgress?: number) => number;
  updateProgressNotification: (id: number, progress: number, message?: string) => void;
  closeNotification: (id: number) => void;
}

const NotificationContext = createContext<NotificationContextProps | undefined>(undefined);

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const nextId = React.useRef(1);

  // Standard notification (success, error, etc)
  const showNotification = useCallback((message: string, type: NotificationType, autoClose: boolean = true) => {
    const id = nextId.current++;
    setNotifications((prev) => [...prev, { id, message, type, autoClose }]);
    if (autoClose) {
      setTimeout(() => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
      }, 3000);
    }
  }, []);

  // Show a progress notification (returns id for updating)
  const showProgressNotification = useCallback((message: string, initialProgress: number = 0) => {
    const id = nextId.current++;
    setNotifications((prev) => [
      ...prev,
      {
        id,
        message,
        type: 'progress' as NotificationType, // You may want to add 'progress' to NotificationType
        autoClose: false,
        progress: initialProgress,
        isProgress: true,
      },
    ]);
    return id;
  }, []);

  // Update progress notification
  const updateProgressNotification = useCallback((id: number, progress: number, message?: string) => {
    setNotifications((prev) =>
      prev.map((n) =>
        n.id === id
          ? { ...n, progress, message: message ?? n.message }
          : n
      )
    );
  }, []);

  // Close notification by id
  const closeNotification = useCallback((id: number) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const handleClose = (id: number) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <NotificationContext.Provider value={{ showNotification, showProgressNotification, updateProgressNotification, closeNotification }}>
      {children}
      <div className="fixed top-5 right-5 z-50 flex flex-col gap-2 items-end">
        {notifications.map((n) => (
          <Notification
            key={n.id}
            message={n.message}
            type={n.type}
            onClose={() => handleClose(n.id)}
            autoClose={n.autoClose}
            progress={n.progress}
            isProgress={n.isProgress}
          />
        ))}
      </div>
    </NotificationContext.Provider>
  );
};

export default NotificationProvider;
