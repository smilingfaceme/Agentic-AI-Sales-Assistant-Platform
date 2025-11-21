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
  const getFormatDisplay = (format?: string | string[]) => {
    // Handle array format (new structure)
    if (Array.isArray(format)) {
      if (format.length === 0) return '📄 Field';
      // Show first format with count if multiple
      const firstFormat = format[0];
      const formatText = firstFormat === 'input' ? '📝 Input' :
                        firstFormat === 'static' ? '📋 Static Select' :
                        firstFormat === 'calling_api' ? '🔄 Dynamic Select' :
                        firstFormat === 'auto' ? '🤖 Auto' : '📄 Field';
      return format.length > 1 ? `${formatText} (+${format.length - 1} more)` : formatText;
    }
    // Handle single format (old structure)
    if (format === 'input') return '📝 Input';
    if (format === 'static') return '📋 Static Select';
    if (format === 'calling_api') return '🔄 Dynamic Select';
    if (format === 'auto') return '🤖 Auto';
    return '📄 Field';
  };

  console.log(instance);

  // Check if this is a multi-pair block (new structure)
  const isMultiPair = Array.isArray(instance.item.operator) &&
                      instance.item.operator.length > 0 &&
                      Array.isArray(instance.item.operator[0]);

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
      {(() => {
        // Check if we have multiple value/operator pairs
        const hasMultiplePairs = isMultiPair && instance.item.operator && instance.item.operator.length > 1;
        const settings = instance.settings || {};

        // Check for multiple values (value_0, value_1, etc.)
        const multipleValueKeys = Object.keys(settings).filter(key => key.startsWith('value_'));
        const hasMultipleValues = multipleValueKeys.length > 0;

        if (hasMultipleValues && hasMultiplePairs) {
          // Display multiple values and operators
          return (
            <div className="space-y-2 text-sm">
              <div className="bg-white p-2 rounded border border-gray-200 space-y-2">
                {instance?.item?.operator?.map((ops, idx) => {
                  const valueKey = `value_${idx}`;
                  const operatorKey = `operator_${idx}`;
                  const value = settings[valueKey];
                  const operator = settings[operatorKey];
                  const sublabel = Array.isArray(instance.item.sublabels) ? instance.item.sublabels[idx] : null;

                  if (value === undefined || value === null || value === '') return null;

                  return (
                    <div key={idx} className="bg-gray-50 p-2 rounded border border-gray-300 space-y-1">
                      {sublabel && (
                        <div className="text-xs font-semibold text-gray-700">{sublabel}</div>
                      )}
                      {operator && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500 font-medium">Operator:</span>
                          <span className="text-xs font-semibold text-blue-600">{String(operator)}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 font-medium">Value:</span>
                        <span className="text-xs font-semibold text-gray-900">{String(value)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        }

        // Single value/operator display (legacy)
        if (settings.value && settings.operator && settings.value !== '') {
          return (
            <div className="space-y-2 text-sm">
              <div className="bg-white p-2 rounded border border-gray-200 space-y-2">
                {/* Show operator if exists */}
                {instance.item.operator && instance.item.operator.length > 0 && settings.operator && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 font-medium">Operator:</span>
                    <span className="text-xs font-semibold text-blue-600">{String(settings.operator)}</span>
                  </div>
                )}

                {/* Show value if exists */}
                {settings.value !== undefined &&
                  settings.value !== null &&
                  settings.value !== '' && (
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs text-gray-500 font-medium">Value:</span>
                      <span className="text-xs font-semibold text-gray-900 break-all">
                        {String(settings.value)}
                      </span>
                    </div>
                  )}

                {/* If no operator or value is set, show a placeholder */}
                {!settings.operator &&
                  (!settings.value || settings.value === '') && (
                    <div className="text-xs text-gray-400 italic">No settings configured</div>
                  )}
              </div>

              {/* Show info about multiple pairs if applicable */}
              {hasMultiplePairs && (
                <div className="bg-blue-50 p-2 rounded border border-blue-200">
                  <div className="text-xs text-blue-700 font-medium mb-1">
                    📊 Multiple Conditions ({instance?.item?.operator?.length} pairs)
                  </div>
                  <div className="text-xs text-blue-600 space-y-1">
                    {instance?.item?.operator?.map((ops, idx) => {
                      const format = Array.isArray(instance.item.format) ? instance.item.format[idx] : 'input';
                      const type = Array.isArray(instance.item.type) ? instance.item.type[idx] : 'text';
                      return (
                        <div key={idx} className="flex items-center gap-2">
                          <span className="font-semibold">Pair {idx + 1}:</span>
                          <span>{ops.join(', ')}</span>
                          <span className="text-blue-500">({format}/{type})</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        }

        return null;
      })()}
    </div>
  );
};

export default BlockSettings;