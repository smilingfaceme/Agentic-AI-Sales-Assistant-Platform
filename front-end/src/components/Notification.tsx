import React from 'react';

export type NotificationType = 'success' | 'error' | 'alarm' | 'progress';

interface NotificationProps {
  message: string;
  type: NotificationType;
  onClose: () => void;
  autoClose?: boolean;
  progress?: number;
  isProgress?: boolean;
}

const typeStyles: Record<NotificationType, string> = {
  success: 'bg-green-100 border-green-500 text-green-800',
  error: 'bg-red-100 border-red-500 text-red-800',
  alarm: 'bg-yellow-100 border-yellow-500 text-yellow-800',
  progress: 'bg-blue-100 border-blue-500 text-blue-800',
};

const Notification: React.FC<NotificationProps> = ({ message, type, onClose, autoClose, progress, isProgress }) => (
  <div
    className={`border-l-4 p-4 shadow-lg rounded-md flex items-center gap-2 min-w-[250px] ${typeStyles[type]}`}
    role="alert"
  >
    <div className="flex-1">
      <span>{message}</span>
      {isProgress && typeof progress === 'number' && (
        <>
          <div className="w-full mt-2 bg-gray-200 rounded-full h-2.5">
            <div
              className="bg-blue-500 h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-xs text-gray-600 mt-1 block">{progress}%</span>
        </>
      )}
    </div>
    {!autoClose && (
      <button
        className="ml-4 text-lg font-bold focus:outline-none"
        onClick={onClose}
        aria-label="Close notification"
      >
        ×
      </button>
    )}
  </div>
);

export default Notification;
