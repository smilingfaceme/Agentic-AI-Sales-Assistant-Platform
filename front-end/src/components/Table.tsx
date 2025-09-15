"use client";
import { useState } from "react";

export interface TableProps {
  headers: string[];
  data: Array<Record<string, string | number | boolean | null | undefined>>;
}

// Next.js + Tailwind only, idiomatic functional component
const Table = ({ headers, data }: TableProps) => {
  const [selectedRows, setSelectedRows] = useState<number[]>([]);

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
                className="px-4 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={headers.length + 1} className="px-4 py-4 text-center text-gray-500">
                No data available
              </td>
            </tr>
          ) : (
            data.map((row, idx) => (
              <tr key={idx} className="hover:bg-gray-50 border-b border-gray-200">
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
                  <td key={header} className="px-4 py-2 text-sm text-gray-600">
                    {row[header] !== undefined ? row[header] : ""}
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
