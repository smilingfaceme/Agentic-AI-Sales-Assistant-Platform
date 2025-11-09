"use client";
import React from 'react';

export type KPIStatus = 'on-track' | 'warning' | 'off-target';

export interface KPICardProps {
  title: string;
  currentValue: number | string;
  targetValue?: number | string;
  unit?: string;
  status: KPIStatus;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

const statusConfig = {
  'on-track': {
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    textColor: 'text-green-700',
    iconColor: 'text-green-500',
    label: '✅ On track',
  },
  'warning': {
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    textColor: 'text-yellow-700',
    iconColor: 'text-yellow-500',
    label: '⚠️ Needs attention',
  },
  'off-target': {
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    textColor: 'text-red-700',
    iconColor: 'text-red-500',
    label: '❌ Off target',
  },
};

export default function KPICard({
  title,
  currentValue,
  targetValue,
  unit = '',
  status,
  icon,
  trend,
}: KPICardProps) {
  const config = statusConfig[status];

  return (
    <div className={`${config.bgColor} ${config.borderColor} border-2 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-700 flex-1">{title}</h3>
        {icon && <div className={`${config.iconColor} text-xl`}>{icon}</div>}
      </div>

      {/* Current Value */}
      <div className="mb-2">
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-bold text-gray-900">{currentValue}</span>
          {unit && <span className="text-sm text-gray-600">{unit}</span>}
        </div>
        {trend && (
          <div className={`text-xs mt-1 ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
            {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}% vs. last period
          </div>
        )}
      </div>

      {/* Target Value */}
      {targetValue && (
        <div className="text-xs text-gray-600 mb-2">
          Target: <span className="font-semibold">{targetValue} {unit}</span>
        </div>
      )}

      {/* Status Indicator */}
      <div className={`${config.textColor} text-xs font-medium`}>
        {config.label}
      </div>
    </div>
  );
}

