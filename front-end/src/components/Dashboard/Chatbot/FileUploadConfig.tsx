"use client";
import { useState, useRef } from "react";
import {
  FaCloudUploadAlt,
  FaTimes,
  FaArrowRight,
  FaArrowLeft,
  FaArrowDown,
  FaArrowUp,
  FaFileExcel,
  FaAngleDoubleRight,
  FaAngleDoubleLeft,
  FaAngleDoubleDown,
  FaAngleDoubleUp,
} from "react-icons/fa";
import * as XLSX from "xlsx";
import { knowledgeApi } from "@/services/apiService";
import Loading from "@/components/Loading";

interface UnifiedUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (configuredFiles: ConfiguredFile[]) => void;
}

interface ConfiguredFile {
  file: File;
  selectedColumns: string[];
}

interface ColumnItem {
  id: string;
  name: string;
}

interface ParsedFileData {
  file: File;
  columns: string[];
  rows: Record<string, unknown>[];
}

const UnifiedUploadModal: React.FC<UnifiedUploadModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
}) => {
  const [step, setStep] = useState<"upload" | "config">("upload");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [parsedFiles, setParsedFiles] = useState<ParsedFileData[]>([]);
  const [availableColumns, setAvailableColumns] = useState<ColumnItem[]>([]);
  const [selectedColumns, setSelectedColumns] = useState<ColumnItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [focusedColumn, setFocusedColumn] = useState<string | null>(null);
  const columnRefs = useRef<Record<string, HTMLTableCellElement | null>>({});

  const parseCSV = (text: string): ParsedFileData => {
    const lines = text.split(/\r?\n/).filter(Boolean);
    const columns = lines[0]?.split(",").map((c) => c.trim()) || [];
    const rows = lines.slice(1, 11).map((line) => {
      const values = line.split(",");
      return Object.fromEntries(
        columns.map((col, i) => [col, values[i]?.trim() ?? ""])
      );
    });
    return { file: new File([], ""), columns, rows };
  };

  const parseFile = (file: File): Promise<ParsedFileData> =>
    new Promise((resolve, reject) => {
      const ext = file.name.split(".").pop()?.toLowerCase();
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          if (ext === "csv") {
            const text = e.target?.result as string;
            const parsed = parseCSV(text);
            parsed.file = file;
            resolve(parsed);
          } else {
            const data = new Uint8Array(e.target?.result as ArrayBuffer);
            const workbook = XLSX.read(data, { type: "array" });
            const sheet = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheet];
            const json = XLSX.utils.sheet_to_json<
              (string | number | boolean | null)[]
            >(worksheet, { header: 1 });
            const columns = (json[0] as string[]) || [];
            const rows = json.slice(1, 11).map((r) =>
              Object.fromEntries(columns.map((c, i) => [c, r[i] ?? ""]))
            );
            resolve({ file, columns, rows });
          }
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = () => reject(reader.error);
      if (ext === "csv") {
        reader.readAsText(file);
      } else {
        reader.readAsArrayBuffer(file);
      }
    });

  const handleUpload = async () => {
    if (!selectedFiles.length) return setError("Please select at least one file");

    setError("");
    setLoading(true);
    try {
      const parsed = await Promise.all(selectedFiles.map(parseFile));
      setParsedFiles(parsed);
      const firstCols = parsed[0]?.columns || [];
      setAvailableColumns(firstCols.map((c, i) => ({ id: String(i), name: c })));
      setSelectedColumns([]);
      setStep("config");
    } catch {
      setError("Failed to read file");
    } finally {
      setLoading(false);
    }
  };

  const moveColumn = (col: ColumnItem, toSelected: boolean) => {
    if (toSelected) {
      setAvailableColumns((cols) => cols.filter((c) => c.id !== col.id));
      setSelectedColumns((cols) => [...cols, col]);
    } else {
      setSelectedColumns((cols) => cols.filter((c) => c.id !== col.id));
      setAvailableColumns((cols) => [...cols, col]);
    }
  };
  const focusedColumnref = (col: ColumnItem) => {
    // Focus column in preview
    setFocusedColumn(col.name);
    setTimeout(() => {
      const target = columnRefs.current[col.name];
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
        target.classList.add("ring-4", "ring-blue-400", "transition-all");
        setTimeout(() => target.classList.remove("ring-4", "ring-blue-400"), 2000);
      }
    }, 150);
  };

  const handleConfirm = async () => {
    try {
      setLoading(true);
      for (const f of parsedFiles) {
        const response = await knowledgeApi.uploadKnowledgeFile(
          f.file,
          selectedColumns.map((c) => c.name)
        );
        if (!response) {
          throw new Error(`Upload failed for ${f.file.name}`);
        }
      }

      onConfirm(
        parsedFiles.map((f) => ({
          file: f.file,
          selectedColumns: selectedColumns.map((c) => c.name),
        }))
      );
      setLoading(false);
      handleClose();
    } catch (error) {
      console.error("Upload error:", error);
      alert(`${(error as Error).message}`);
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep("upload");
    setSelectedFiles([]);
    setParsedFiles([]);
    setAvailableColumns([]);
    setSelectedColumns([]);
    setError("");
    setFocusedColumn(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl overflow-hidden">
        {/* Header */}
        <div className="border-b border-gray-300 px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold">
            {step === "upload" ? "Add New Knowledge Document" : "Configure File Upload"}
          </h2>
          <button onClick={handleClose} className="text-gray-500 hover:text-gray-700">
            <FaTimes size={20} />
          </button>
        </div>

        {/* Upload Step */}
        {step === "upload" && (
          <div className="p-6 text-center">
            <FaCloudUploadAlt size={100} className="mx-auto mb-4 text-gray-400" />
            <input
              type="file"
              accept=".csv, .xlsx, .xls"
              multiple
              onChange={(e) => setSelectedFiles(Array.from(e.target.files || []))}
              className="w-full border border-gray-300 max-w-[500px] rounded p-2"
              disabled={loading}
            />
            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
          </div>
        )}

        {/* Config Step */}
        {step === "config" && (
          <div className="p-6 overflow-y-auto max-h-[80vh] overflow-x-hidden">
            <div className="text-base text-gray-700 mb-4">
              Select the columns that contain the question and answer text. DoshiAI will automatically extract and index content from the selected columns.<br />
              Please choose only the columns relevant to user queries and answers, and avoid selecting IDs or other non-meaningful fields.
            </div>

            <div className="grid grid-cols-1 md:grid-cols-[4fr_2fr_4fr] gap-4 md:gap-0 mb-8">
              {/* Available Columns */}
              <div className="bg-gray-100 p-4 rounded-lg">
                <h4 className="font-medium text-center mb-3">Available Columns</h4>
                <div className="max-h-[300px] overflow-y-auto space-y-2">
                  {availableColumns.length ? (
                    availableColumns.map((col) => (
                      <div
                        key={col.id}
                        className="bg-white px-3 py-2 rounded border border-gray-300 flex justify-between items-center hover:bg-blue-50"
                        onClick={() => focusedColumnref(col)}
                      >
                        <span>{col.name}</span>
                        <button
                          onClick={() => moveColumn(col, true)}
                          className="text-blue-600 hover:text-blue-800 transition-colors"
                          title="Move to Selected"
                        >
                          <FaArrowRight className="hidden md:block"/>
                          <FaArrowDown className="block md:hidden"/>
                        </button>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-gray-500 text-sm py-6">
                      No columns available
                    </p>
                  )}
                </div>
              </div>

              <div className="flex justify-center items-center">
                <span className="hidden md:block">
                  <FaAngleDoubleRight
                    onClick={() => {
                      setSelectedColumns((cols) => [...cols, ...availableColumns]);
                      setAvailableColumns([]);
                    }}
                    className="text-blue-500 mb-10"
                    size={28}
                  />
                  <FaAngleDoubleLeft
                    onClick={() => {
                      setAvailableColumns((cols) => [...cols, ...selectedColumns]);
                      setSelectedColumns([]);
                    }}
                    className="text-blue-500"
                    size={28}
                  />
                </span>

                <span className="flex block md:hidden">
                  <FaAngleDoubleDown
                    onClick={() => {
                      setSelectedColumns((cols) => [...cols, ...availableColumns]);
                      setAvailableColumns([]);
                    }}
                    className="text-blue-500 mr-10"
                    size={28}
                  />
                  <FaAngleDoubleUp
                    onClick={() => {
                      setAvailableColumns((cols) => [...cols, ...selectedColumns]);
                      setSelectedColumns([]);
                    }}
                    className="text-blue-500"
                    size={28}
                  />
                </span>
              </div>

              {/* Selected Columns */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-center mb-3">Selected Columns</h4>
                <div className="max-h-[300px] overflow-y-auto space-y-2">
                  {selectedColumns.length ? (
                    selectedColumns.map((col) => (
                      <div
                        key={col.id}
                        className="bg-white px-3 py-2 rounded border border-blue-200 flex justify-between items-center hover:bg-red-50"
                        onClick={() => focusedColumnref(col)}
                      >
                        <span>{col.name}</span>
                        <button
                          onClick={() => moveColumn(col, false)}
                          className="text-red-600 hover:text-red-800 transition-colors"
                          title="Move back"
                        >
                          <FaArrowLeft className="hidden md:block"/>
                          <FaArrowUp className="block md:hidden"/>
                        </button>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-gray-500 text-sm py-6">
                      Click columns to select
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* File Preview */}
            {parsedFiles.map((pf, idx) => (
              <div key={idx} className="mb-10">
                <h3 className="text-lg font-medium flex items-center mb-2">
                  <FaFileExcel className="text-green-600 mr-2" /> {pf.file.name}
                </h3>
                <div className="overflow-x-auto border border-gray-300 rounded">
                  <table className="min-w-full text-sm">
                    <thead className="bg-blue-50 border-b border-gray-300">
                      <tr>
                        {pf.columns.map((col) => (
                          <th
                            key={col}
                            ref={(el) => {
                              columnRefs.current[col] = el;
                            }}
                            className={`px-4 py-2 text-left font-medium ${focusedColumn === col
                              ? "bg-yellow-100 ring-2 ring-yellow-400"
                              : ""
                              }`}
                          >
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {pf.rows.map((row, i) => (
                        <tr
                          key={i}
                          className={`hover:bg-gray-50 ${i % 2 === 0 ? "bg-white" : "bg-gray-100"
                            }`}
                        >
                          {pf.columns.map((col) => (
                            <td
                              key={col}
                              className={`px-4 py-2 whitespace-nowrap ${focusedColumn === col ? "bg-yellow-50" : ""
                                }`}
                            >
                              {String(row[col] ?? "")}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="border-t border-gray-300 px-6 py-4 flex justify-between">
          <button
            onClick={step === "upload" ? handleClose : () => setStep("upload")}
            className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-200"
          >
            {step === "upload" ? "Cancel" : "Back"}
          </button>
          <button
            onClick={step === "config" ? handleConfirm : handleUpload}
            disabled={
              step === "upload"
                ? !selectedFiles.length
                : !parsedFiles.length || !selectedColumns.length
            }
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Loading
              isLoading={loading}
              type="button"
              text={`${step === "upload" ? "Reading" : "Uploading"}...`}
              theme="dark"
            >
              {step === "upload" ? (
                <div className="flex items-center">
                  <FaArrowRight className="mr-2" /> NEXT
                </div>
              ) : (
                `Confirm Upload`
              )}
            </Loading>
          </button>
        </div>
      </div>
    </div>
  );
};

export default UnifiedUploadModal;
