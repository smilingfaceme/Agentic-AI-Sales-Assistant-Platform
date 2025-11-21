"use client";
import React from 'react';

export interface FilterOption {
  label: string;
  value: string;
}

export interface FilterPanelProps {
  dateRange: string;
  onDateRangeChange: (value: string) => void;
  selectedKPIs?: string[];
  onKPIChange?: (kpis: string[]) => void;
  availableKPIs?: FilterOption[];
}

const dateRangeOptions: FilterOption[] = [
  { label: 'Last 7 Days', value: '7d' },
  { label: 'Last 30 Days', value: '30d' },
  { label: 'Last 3 Months', value: '3m' },
  { label: 'Last 6 Months', value: '6m' },
  { label: 'Last Year', value: '1y' },
];

export default function FilterPanel({
  dateRange,
  onDateRangeChange,
  selectedKPIs,
  onKPIChange,
  availableKPIs,
}: FilterPanelProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
      <div className="flex flex-wrap gap-4 items-center">
        {/* Date Range Filter */}
        <div className="flex items-center gap-2">
          <label htmlFor="dateRange" className="text-sm font-medium text-gray-700">
            Time Period:
          </label>
          <select
            id="dateRange"
            value={dateRange}
            onChange={(e) => onDateRangeChange(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            {dateRangeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* KPI Filter (if provided) */}
        {availableKPIs && onKPIChange && (
          <div className="flex items-center gap-2">
            <label htmlFor="kpiFilter" className="text-sm font-medium text-gray-700">
              KPIs:
            </label>
            <select
              id="kpiFilter"
              multiple
              value={selectedKPIs}
              onChange={(e) => {
                const selected = Array.from(e.target.selectedOptions, (option) => option.value);
                onKPIChange(selected);
              }}
              className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              {availableKPIs.map((kpi) => (
                <option key={kpi.value} value={kpi.value}>
                  {kpi.label}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
    </div>
  );
}

