"use client";
import React from 'react';
import type { BlockInstance, SettingsValue, BlockFunctionInfo } from './workflowConstants';

// Component: renders settings for one block instance (read-only display with remove button)
const BlockSettings = ({
  instance,
  onRemove,
}: {
  nodeId?: string;
  instance: BlockInstance;
  index?: number;
  onChange?: (s: Record<string, SettingsValue | BlockFunctionInfo>) => void;
  onRemove: () => void;
}) => {
  // Helper to get format display text
  const getFormatDisplay = (format?: string) => {
    if (format === 'input') return '📝 Input';
    if (format === 'static') return '📋 Static Select';
    if (format === 'calling_api') return '🔄 Dynamic Select';
    if (format === 'auto') return '🤖 Auto';
    return '📄 Field';
  };
  console.log(instance);
  return (
    <div className="border rounded p-3 bg-gray-50">
      {/* Header with function label and remove button */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <strong className="text-sm text-gray-900">{instance.item.label}</strong>
            <span className="text-xs text-gray-500">{getFormatDisplay(instance.item.format)}</span>
          </div>
        </div>
        <button
          onClick={onRemove}
          className="text-red-500 text-sm hover:text-red-700 font-medium px-2 py-1 hover:bg-red-50 rounded transition-colors"
        >
          Remove
        </button>
      </div>

      {/* Display settings based on block type */}
      {instance.settings?.value && instance.settings?.operator && instance.settings?.value !== '' && (
        <div className="space-y-2 text-sm">
          {/* If the block has multiple fields (nested object) */}
          <div className="bg-white p-2 rounded border border-gray-200 space-y-2">
            {/* Show operator if exists */}
            {instance.item.operator && instance.item.operator.length > 0 && (instance.settings || {}).operator && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 font-medium">Operator:</span>
                <span className="text-xs font-semibold text-blue-600">{String((instance.settings || {}).operator)}</span>
              </div>
            )}

            {/* Show value if exists */}
            {(instance.settings || {}).value !== undefined &&
              (instance.settings || {}).value !== null &&
              (instance.settings || {}).value !== '' && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 font-medium">Value:</span>
                  <span className="text-xs font-semibold text-gray-900">{String((instance.settings || {}).value)}</span>
                </div>
              )}

            {/* If no operator or value is set, show a placeholder */}
            {!(instance.settings || {}).operator &&
              (!(instance.settings || {}).value || (instance.settings || {}).value === '') && (
                <div className="text-xs text-gray-400 italic">No settings configured</div>
              )}
          </div>
        </div>
      )}
    </div>
  );
};

export default BlockSettings;