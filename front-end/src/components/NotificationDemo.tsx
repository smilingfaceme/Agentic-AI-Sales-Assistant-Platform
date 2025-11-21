import React from 'react';
import { useNotification } from '../contexts/NotificationContext';

const NotificationDemo: React.FC = () => {
  const { showNotification } = useNotification();

  return (
    <div className="flex gap-2">
      <button
        className="bg-green-500 text-white px-4 py-2 rounded"
        onClick={() => showNotification('Success! Action completed.', 'success')}
      >
        Show Success
      </button>
      <button
        className="bg-red-500 text-white px-4 py-2 rounded"
        onClick={() => showNotification('Error! Something went wrong.', 'error')}
      >
        Show Error
      </button>
      <button
        className="bg-yellow-500 text-white px-4 py-2 rounded"
        onClick={() => showNotification('Alarm! Please check your settings.', 'alarm')}
      >
        Show Alarm
      </button>
    </div>
  );
};

export default NotificationDemo;
