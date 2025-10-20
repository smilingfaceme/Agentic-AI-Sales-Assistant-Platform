"use client";
import { useState } from "react";

export interface TableAction {
  label: string;
  onClick: (rowData: Record<string, string | number | boolean | null | undefined | TableAction[]>, rowIndex: number) => void;
  className?: string;
  icon?: React.ReactNode;
  disabled: boolean
}

export interface TableProps {
  headers: string[];
  data: Array<Record<string, string | number | boolean | null | undefined | TableAction[]>>;
  actionColumnKey?: string[]; // The key in data that contains actions
}

// Next.js + Tailwind only, idiomatic functional component
const Table = ({ headers, data, actionColumnKey = ["Actions"] }: TableProps) => {
  const [selectedRows, setSelectedRows] = useState<number[]>([]);
  const [sortConfig, setSortConfig] = useState<{
    key: string | null;
    direction: "asc" | "desc";
  }>({ key: null, direction: "asc" });

  // Select row handler
  const handleSelectRow = (idx: number) => {
    setSelectedRows((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
    );
  };

  // Select all handler
  const handleSelectAll = () => {
    if (selectedRows.length === data.length) {
      setSelectedRows([]);
    } else {
      setSelectedRows(data.map((_, idx) => idx));
    }
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
            {headers.map((header) => (
              <th
                key={header}
                onClick={() => handleSort(header)}
                className="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer select-none"
              >
                <div className="flex items-center gap-1">
                  {header}
                  {sortConfig.key === header && (
                    <span>
                      {sortConfig.direction === "asc" ? "▲" : "▼"}
                    </span>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sortedData.length === 0 ? (
            <tr>
              <td
                colSpan={headers.length + 1}
                className="px-4 py-4 text-center text-gray-500"
              >
                No data available
              </td>
            </tr>
          ) : (
            sortedData.map((row, idx) => (
              <tr
                key={idx}
                className="hover:bg-gray-50 border-b border-gray-200"
              >
                <td className="px-4 py-2 text-center">
                  <input
                    type="checkbox"
                    checked={selectedRows.includes(idx)}
                    onChange={() => handleSelectRow(idx)}
                    aria-label={`Select row ${idx + 1}`}
                    className="accent-blue-500"
                  />
                </td>
                {headers.map((header) => (
                  <td
                    key={header}
                    className="px-4 py-2 text-sm text-gray-600"
                  >
                    {actionColumnKey.includes(header) && Array.isArray(row[header]) ? (
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
                    ) : (
                      row[header] !== undefined ? String(row[header]) : ""
                    )}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default Table;
