"use client";
import { useState } from "react";

export interface TableAction {
  label: string;
  onClick: (rowData: Record<string, CellValue>, rowIndex: number) => void;
  className?: string;
  icon?: React.ReactNode;
  disabled: boolean
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type RowspanItem = Record<string, any>;
export type CellValue = string | number | boolean | null | undefined | string[] | number[] | boolean[] | TableAction[] | TableAction[][] | RowspanItem[];

export interface TableProps {
  headers: string[];
  data: Array<Record<string, CellValue>>;
  actionColumnKey?: string[];
  arrayColumnKey?: string[]; // Keys that contain simple arrays to display vertically
  rowspanColumnKey?: string[]; // Keys that contain array of objects - will create multiple rows with rowspan
  onSelectedRowsChange?: (selectedRows: number[]) => void; // Callback when selected rows change
}

// Next.js + Tailwind only, idiomatic functional component
const Table = ({ headers, data, actionColumnKey = ["Actions"], arrayColumnKey, rowspanColumnKey, onSelectedRowsChange }: TableProps) => {
  const [selectedRows, setSelectedRows] = useState<number[]>([]);
  const [sortConfig, setSortConfig] = useState<{
    key: string | null;
    direction: "asc" | "desc";
  }>({ key: null, direction: "asc" });

  // Calculate max rowspan for a row based on rowspanColumnKey arrays
  const getRowspanCount = (row: Record<string, CellValue>): number => {
    if (!rowspanColumnKey || rowspanColumnKey.length === 0) return 1;

    let maxLength = 1;
    for (const key of rowspanColumnKey) {
      const value = row[key];
      if (Array.isArray(value) && value.length > 0) {
        maxLength = Math.max(maxLength, value.length);
      }
    }
    return maxLength;
  };

  // Get the sub-row headers from rowspan arrays (keys of the objects in the array)
  const getRowspanHeaders = (): string[] => {
    if (!rowspanColumnKey || rowspanColumnKey.length === 0) return [];

    const subHeaders: string[] = [];
    for (const row of data) {
      for (const key of rowspanColumnKey) {
        const value = row[key];
        if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'object' && value[0] !== null) {
          const objKeys = Object.keys(value[0] as RowspanItem);
          for (const objKey of objKeys) {
            if (!subHeaders.includes(objKey)) {
              subHeaders.push(objKey);
            }
          }
        }
      }
    }
    return subHeaders;
  };

  const rowspanSubHeaders = getRowspanHeaders();

  // Select row handler
  const handleSelectRow = (idx: number) => {
    const newSelectedRows = selectedRows.includes(idx)
      ? selectedRows.filter((i) => i !== idx)
      : [...selectedRows, idx];
    setSelectedRows(newSelectedRows);
    onSelectedRowsChange?.(newSelectedRows);
  };

  // Select all handler
  const handleSelectAll = () => {
    const newSelectedRows = selectedRows.length === data.length ? [] : data.map((_, idx) => idx);
    setSelectedRows(newSelectedRows);
    onSelectedRowsChange?.(newSelectedRows);
  };

  // Sort handler
  const handleSort = (header: string) => {
    setSortConfig((prev) => {
      if (prev.key === header) {
        return {
          key: header,
          direction: prev.direction === "asc" ? "desc" : "asc",
        };
      }
      return { key: header, direction: "asc" };
    });
  };

  // Sorted data
  const sortedData = [...data].sort((a, b) => {
    if (!sortConfig.key) return 0;
    const valueA = a[sortConfig.key];
    const valueB = b[sortConfig.key];

    if (valueA === null || valueA === undefined) return 1;
    if (valueB === null || valueB === undefined) return -1;

    if (typeof valueA === "number" && typeof valueB === "number") {
      return sortConfig.direction === "asc" ? valueA - valueB : valueB - valueA;
    }

    return sortConfig.direction === "asc"
      ? String(valueA).localeCompare(String(valueB))
      : String(valueB).localeCompare(String(valueA));
  });

  // Build merged headers list - replace rowspanColumnKey with sub-headers in place
  // isPerRow: true means this column should be rendered per sub-row (no rowspan)
  const getMergedHeaders = (): { header: string; isSubHeader: boolean; isPerRow: boolean }[] => {
    const result: { header: string; isSubHeader: boolean; isPerRow: boolean }[] = [];
    for (const header of headers) {
      if (rowspanColumnKey?.includes(header)) {
        // Replace this header with sub-headers
        for (const subHeader of rowspanSubHeaders) {
          result.push({ header: subHeader, isSubHeader: true, isPerRow: true });
        }
      } else if (actionColumnKey.includes(header)) {
        // Action columns should render per sub-row (no rowspan)
        result.push({ header, isSubHeader: false, isPerRow: true });
      } else {
        result.push({ header, isSubHeader: false, isPerRow: false });
      }
    }
    return result;
  };

  const mergedHeaders = getMergedHeaders();

  // Total column count
  const totalColumns = mergedHeaders.length + 1; // +1 for checkbox

  // Render cell content based on type
  const renderCellContent = (row: Record<string, CellValue>, header: string, idx: number) => {
    if (actionColumnKey.includes(header) && Array.isArray(row[header])) {
      return (
        <div className="flex gap-2">
          {(row[header] as TableAction[]).map((action, actionIdx) => (
            <button
              key={actionIdx}
              onClick={() => action.onClick(row, idx)}
              className={action.className || "px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"}
              title={action.label}
              disabled={action.disabled}
            >
              {action.icon}
              {action.label}
            </button>
          ))}
        </div>
      );
    }

    if (arrayColumnKey?.includes(header) && Array.isArray(row[header])) {
      return (
        <div className="flex flex-col gap-2">
          {(row[header] as string[]).map((item, itemIdx) => (
            <span key={itemIdx}>{item}</span>
          ))}
        </div>
      );
    }

    return row[header] !== undefined ? String(row[header]) : "";
  };

  // Render rows with rowspan support
  const renderRows = () => {
    if (sortedData.length === 0) {
      return (
        <tr>
          <td colSpan={totalColumns} className="px-4 py-4 text-center text-gray-500">
            No data available
          </td>
        </tr>
      );
    }

    const rows: React.ReactNode[] = [];

    sortedData.forEach((row, idx) => {
      const rowspanCount = getRowspanCount(row);

      // Get the rowspan array data
      const rowspanData: RowspanItem[] = [];
      if (rowspanColumnKey && rowspanColumnKey.length > 0) {
        for (const key of rowspanColumnKey) {
          const value = row[key];
          if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'object') {
            rowspanData.push(...(value as RowspanItem[]));
            break; // Use the first rowspan column found
          }
        }
      }

      // Render multiple rows if we have rowspan data
      for (let subIdx = 0; subIdx < rowspanCount; subIdx++) {
        const isFirstSubRow = subIdx === 0;
        const subRowData = rowspanData[subIdx] || {};

        rows.push(
          <tr key={`${idx}-${subIdx}`} className="hover:bg-gray-50 border-b border-gray-200">
            {/* Checkbox - only on first sub-row with rowspan */}
            {isFirstSubRow && (
              <td className="px-4 py-2 text-center align-top" rowSpan={rowspanCount}>
                <input
                  type="checkbox"
                  checked={selectedRows.includes(idx)}
                  onChange={() => handleSelectRow(idx)}
                  aria-label={`Select row ${idx + 1}`}
                  className="accent-blue-500"
                />
              </td>
            )}

            {/* Render columns in original order */}
            {mergedHeaders.map(({ header, isSubHeader, isPerRow }) => {
              if (isPerRow) {
                // Per-row columns (sub-headers or actions) - one per sub-row (no rowspan)
                if (isSubHeader) {
                  // Sub-header from rowspan array object
                  return (
                    <td key={header} className="border-b border-gray-200 px-4 py-2 text-sm text-gray-600">
                      {subRowData[header] !== undefined ? String(subRowData[header]) : ""}
                    </td>
                  );
                } else {
                  // Action column - render actions for this sub-row
                  // Actions can be TableAction[][] (array of arrays) for rowspan rows
                  const actionsData = row[header];
                  const actionsForSubRow = Array.isArray(actionsData) && Array.isArray(actionsData[0])
                    ? (actionsData as TableAction[][])[subIdx] || []
                    : (actionsData as TableAction[]) || [];

                  return (
                    <td key={header} className="border-b border-gray-200 px-4 py-2 text-sm text-gray-600">
                      <div className="flex gap-2">
                        {actionsForSubRow.map((action, actionIdx) => (
                          <button
                            key={actionIdx}
                            onClick={() => action.onClick(row, idx)}
                            className={action.className || "px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"}
                            title={action.label}
                            disabled={action.disabled}
                          >
                            {action.icon}
                            {action.label}
                          </button>
                        ))}
                      </div>
                    </td>
                  );
                }
              } else {
                // Regular columns - only on first sub-row with rowspan
                if (!isFirstSubRow) return null;
                return (
                  <td
                    key={header}
                    className="px-4 py-2 text-sm text-gray-600 align-top"
                    rowSpan={rowspanCount}
                  >
                    {renderCellContent(row, header, idx)}
                  </td>
                );
              }
            })}
          </tr>
        );
      }
    });

    return rows;
  };

  return (
    <div className="overflow-x-auto shadow rounded-lg">
      <table className="min-w-full bg-white">
        <thead className="bg-gray-100">
          <tr>
            <th className="px-4 py-2">
              <input
                type="checkbox"
                checked={selectedRows.length === data.length && data.length > 0}
                onChange={handleSelectAll}
                aria-label="Select all rows"
                className="accent-blue-500"
              />
            </th>
            {mergedHeaders.map(({ header, isSubHeader }) => (
              <th
                key={header}
                onClick={!isSubHeader ? () => handleSort(header) : undefined}
                className={`px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider ${!isSubHeader ? 'cursor-pointer select-none' : ''}`}
              >
                <div className="flex items-center gap-1">
                  {header}
                  {!isSubHeader && sortConfig.key === header && (
                    <span>{sortConfig.direction === "asc" ? "▲" : "▼"}</span>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{renderRows()}</tbody>
      </table>
    </div>
  );
};

export default Table;
