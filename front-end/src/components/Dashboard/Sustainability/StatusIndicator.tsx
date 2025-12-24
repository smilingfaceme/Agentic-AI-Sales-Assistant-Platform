"use client";
import React from 'react';

export type StatusType = 'success' | 'warning' | 'danger' | 'info';

export interface StatusIndicatorProps {
  type: StatusType;
  label: string;
  value?: number;
  showProgressBar?: boolean;
  tooltip?: string;
}

const statusConfig = {
  success: {
    bgColor: 'bg-green-100',
    textColor: 'text-green-800',
    progressColor: 'bg-green-500',
    dotColor: 'bg-green-500',
  },
  warning: {
    bgColor: 'bg-yellow-100',
    textColor: 'text-yellow-800',
    progressColor: 'bg-yellow-500',
    dotColor: 'bg-yellow-500',
  },
  danger: {
    bgColor: 'bg-red-100',
    textColor: 'text-red-800',
    progressColor: 'bg-red-500',
    dotColor: 'bg-red-500',
  },
  info: {
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-800',
    progressColor: 'bg-blue-500',
    dotColor: 'bg-blue-500',
  },
};

export default function StatusIndicator({
  type,
  label,
  value,
  showProgressBar = false,
  tooltip,
}: StatusIndicatorProps) {
  const config = statusConfig[type];

  return (
    <div className="flex flex-col gap-2" title={tooltip}>
      <div className="flex items-center gap-2">
        <div className={`w-3 h-3 rounded-full ${config.dotColor}`}></div>
        <span className={`text-sm font-medium ${config.textColor}`}>{label}</span>
        {value !== undefined && (
          <span className={`text-xs ${config.textColor} ml-auto`}>{value}%</span>
        )}
      </div>
      {showProgressBar && value !== undefined && (
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`${config.progressColor} h-2 rounded-full transition-all duration-300`}
            style={{ width: `${Math.min(value, 100)}%` }}
          ></div>
        </div>
      )}
    </div>
  );
}

