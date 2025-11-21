"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { FaSyncAlt, FaTrash, FaFile } from "react-icons/fa";
import { API_BASE } from "@/utils";
import Table, { TableAction } from "@/components/Table";
import LoadingWrapper from "@/components/LoadingWrapper";
import Loading from "@/components/Loading";
import { useApiCall } from "@/hooks/useApiCall";
import { useChatbotContext } from "@/contexts/ChatbotContext";
import { documentApi } from "@/services/apiService";
import { useNotification } from '@/contexts/NotificationContext';

const tableHeaders = ["Title & Description", "Matching Field", "Type", "Status", "Created on", "Actions"];

const PAGE_SIZE_OPTIONS = [5, 10, 20, 50];

type DocumentFile = {
  id: string;
  file_name: string;
  file_type: string;
  full_path: string;
  status: string;
  created_at: string;
  match_field?: string;
};

export default function ExtraDocumentArea() {
  const { showNotification, showProgressNotification, updateProgressNotification, closeNotification } = useNotification();
  const [documentList, setDocumentList] = useState<DocumentFile[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalDocuments, setTotalDocuments] = useState(0);
  const [pageSize, setPageSize] = useState(PAGE_SIZE_OPTIONS[1]);
  const [deleteLoading, setDeleteLoading] = useState<Record<string, boolean>>({});
  const [reprocessLoading, setReprocessLoading] = useState<Record<string, boolean>>({});
  const [selectedRows, setSelectedRows] = useState<number[]>([]);
  const [bulkDeleteLoading, setBulkDeleteLoading] = useState(false);
  const { showModal, setShowModal } = useChatbotContext();

  // Modal upload state
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadMode, setUploadMode] = useState<'file' | 'folder'>('file');
  const [folderFiles, setFolderFiles] = useState<File[]>([]);
  const [matchField, setMatchField] = useState<string>('');

  const { isLoading: isLoadingList, error: listError, execute: executeListAsync } = useApiCall();
  const { execute: executeDeleteAsync } = useApiCall();
  const { execute: executeReprocessAsync } = useApiCall();
  const { execute: executeUploadAsync } = useApiCall();

  // Fetch document files with pagination
  const fetchDocumentFileList = useCallback(async (page = 1, size = pageSize) => {
    const offset = (page - 1) * size;
    const result = await executeListAsync(() => documentApi.getDocumentFiles(size, offset));

    if (result?.documents?.length) {
      const loadingState = result.documents.reduce((acc: Record<string, boolean>, item: DocumentFile) => {
        acc[item.id] = false;
        return acc;
      }, {});
      setDeleteLoading(loadingState);
      setReprocessLoading(loadingState);
      setDocumentList(result.documents);
      setTotalDocuments(result.total ?? result.documents.length);
    } else {
      setDocumentList([]);
      setTotalDocuments(0);
    }
  }, [executeListAsync, pageSize]);

  const deleteFile = async (id: string, file_name: string) => {
    setDeleteLoading((p) => ({ ...p, [id]: true }));
    const result = await executeDeleteAsync(() => documentApi.deleteDocumentFile(id));
    setDeleteLoading((p) => ({ ...p, [id]: false }));
    if (result) {
      showNotification(`Deleted ${file_name} successfully!`, 'success', true)
      fetchDocumentFileList(currentPage)
    };
  };

  const reprocessFile = async (id: string, file_name: string) => {
    setReprocessLoading((p) => ({ ...p, [id]: true }));
    const result = await executeReprocessAsync(() => documentApi.reprocessDocumentFile(id));
    setReprocessLoading((p) => ({ ...p, [id]: false }));
    if (result) {
      showNotification(`Restarted processing ${file_name} successfully!`, 'success', true)
      fetchDocumentFileList(currentPage)
    };
  };

  const deleteSelectedFiles = async () => {
    if (selectedRows.length === 0) {
      showNotification('No files selected', 'alarm', true);
      return;
    }

    const filesToDelete = selectedRows.map(idx => documentList[idx]);
    const fileNames = filesToDelete.map(f => f.file_name).join(', ');

    // Confirm deletion
    if (!window.confirm(`Are you sure you want to delete ${selectedRows.length} file(s)?\n\n${fileNames}`)) {
      return;
    }

    setBulkDeleteLoading(true);
    let successCount = 0;
    let failureCount = 0;

    for (const file of filesToDelete) {
      try {
        const result = await executeDeleteAsync(() => documentApi.deleteDocumentFile(file.id));
        if (result) {
          successCount++;
        } else {
          failureCount++;
        }
      } catch {
        failureCount++;
      }
    }

    setBulkDeleteLoading(false);
    setSelectedRows([]);

    if (successCount > 0) {
      showNotification(
        `Deleted ${successCount} file(s) successfully!${failureCount > 0 ? ` (${failureCount} failed)` : ''}`,
        failureCount > 0 ? 'alarm' : 'success',
        true
      );
    } else {
      showNotification('Failed to delete selected files', 'error', true);
    }

    fetchDocumentFileList(currentPage);
  };

  // Map to table format
  const tabledata = documentList.map((item) => ({
    "Title & Description": [
      {
        label: item.file_name,
        disabled: false,
        onClick: () =>
          window.open(
            `${API_BASE}/${item.full_path}`,
            "_blank"
          ),
        className: "bg-transparent cursor-pointer",
        icon: <></>,
      },
    ],
    "Matching Field": item.match_field || "-",
    Type: item.file_type,
    Status: item.status,
    "Created on": new Date(item.created_at).toLocaleDateString(),
    Actions: [
      ...(item.status === "Failed"
        ? [
          {
            label: "",
            disabled: reprocessLoading[item.id],
            onClick: () => reprocessFile(item.id, item.file_name),
            className:
              "flex items-center px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors",
            icon: (
              <Loading
                isLoading={reprocessLoading[item.id] ?? false}
                type="button"
                size="small"
                text="Reprocessing..."
                theme="dark"
              >
                Reprocess
              </Loading>
            ),
          },
        ]
        : []),
      {
        label: "",
        disabled: item.status === "Completed" ? deleteLoading[item.id] : true,
        onClick: () => deleteFile(item.id, item.file_name),
        className:
          "flex items-center px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors",
        icon: (
          <Loading
            isLoading={deleteLoading[item.id] ?? false}
            type="button"
            size="small"
            text="Deleting"
            theme="dark"
          >
            <FaTrash className="mr-1" /> Delete
          </Loading>
        ),
      },
    ] as TableAction[],
  }));

  useEffect(() => {
    fetchDocumentFileList(currentPage, pageSize);
  }, [fetchDocumentFileList, currentPage, pageSize]);

  // Utility: runs in background
  const startBackgroundUpload = (files: File[]) => {
    (async () => {
      let uploadedCount = 0;
      let failedCount = 0;
      const totalCount = files.length;
      const progressId = showProgressNotification(`Uploading ${totalCount} documents...`, 0);

      const updateProgress = () => {
        const percent = Math.round(((uploadedCount + failedCount) / totalCount) * 100);
        updateProgressNotification(progressId, percent, `Progress: ${percent}%`);
      };

      // Sequential upload loop
      for (const file of files) {
        try {
          const percent = Math.round(((uploadedCount + failedCount) / totalCount) * 100);
          updateProgressNotification(progressId, percent, `Uploading documents: ${uploadedCount} succeeded, ${failedCount} failed, ${totalCount - uploadedCount - failedCount} remaining...`);
          const result = await documentApi.uploadDocumentFile(file, matchField);
          if (result?.success) {
            uploadedCount++;
          } else {
            failedCount++;
            showNotification(`${file.name} failed: ${result?.message || 'Upload failed.'}`, 'error', true);
          }
        } catch (err) {
          failedCount++;
          showNotification(`${file.name} failed: ${err || 'Upload failed.'}`, 'error', true);
        } finally {
          updateProgress();
        }
      }
      // Clean up
      setFolderFiles([]);
      fetchDocumentFileList();
      setMatchField("");
      updateProgressNotification(progressId, 100, `Upload complete (${uploadedCount} success, ${failedCount} failed)`);
      setTimeout(() => closeNotification(progressId), 2000);
    })();
  };

  // Upload handler
  const handleUpload = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setUploadError(null);
    setUploading(true);
    try {
      if (uploadMode === 'file') {
        const file = fileInputRef.current?.files?.[0];
        if (!file) {
          setUploadError("Please select a file.");
          setUploading(false);
          return;
        }
        try {
          const result = await executeUploadAsync(() => documentApi.uploadDocumentFile(file, matchField));
          if (result?.success) {
            setShowModal(false);
            fetchDocumentFileList();
            setPreviewUrl(null);
            setMatchField('');
            showNotification(`${file.name} uploaded successfully!`, 'success', true);
          } else {
            fetchDocumentFileList();
            setPreviewUrl(null);
            setMatchField('');
            showNotification(`${file.name} failed: ${result?.message || 'Upload failed.'}`, 'error', true);
          }
        } catch (err) {
          showNotification(`${file.name} failed: ${err || 'Upload failed.'}`, 'error', true);
        }
      } else {
        if (!folderFiles.length) {
          setUploadError("Please select a folder with documents.");
          setUploading(false);
          return;
        }
        // Close modal right away
        setShowModal(false);
        startBackgroundUpload(folderFiles);
      }
    } catch (err: unknown) {
      if (typeof err === "object" && err && "message" in err) {
        setUploadError((err as { message?: string }).message || "Upload failed.");
      } else {
        setUploadError("Upload failed.");
      }
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Handle file input change to show preview
  const handleFileChange = () => {
    if (uploadMode === 'file') {
      const file = fileInputRef.current?.files?.[0];
      if (file) {
        setPreviewUrl("file-selected");
      } else {
        setPreviewUrl(null);
      }
    } else {
      const files = fileInputRef.current?.files;
      if (files && files.length > 0) {
        const arr = Array.from(files);
        setFolderFiles(arr);
      } else {
        setFolderFiles([]);
      }
    }
  };

  return (
    <section className="flex-1 flex flex-col bg-white w-full p-6 h-full">

      <div className="flex items-center justify-between mb-4 border-b-2 border-gray-300 px-4 py-1">
        <div className="text-md font-semibold">Product-Related Supporting Documents</div>
        <div className="flex gap-2">
          {selectedRows.length > 0 && (
            <button
              className="px-3 py-1 bg-red-500 hover:bg-red-600 font-semibold text-white rounded text-sm flex items-center disabled:opacity-50"
              onClick={deleteSelectedFiles}
              disabled={bulkDeleteLoading}
            >
              <Loading isLoading={bulkDeleteLoading} type="button" text="Deleting..." size="small">
                <FaTrash className="mr-2" /> Delete Selected ({selectedRows.length})
              </Loading>
            </button>
          )}
          <button
            className="px-3 py-1 hover:bg-gray-200 rounded text-sm flex items-center disabled:opacity-50"
            onClick={() => fetchDocumentFileList(currentPage)}
            disabled={isLoadingList}
          >
            <Loading isLoading={isLoadingList} type="button" text="Refreshing..." size="small">
              <FaSyncAlt className="mr-2" /> Refresh
            </Loading>
          </button>
          <button
            className="px-3 py-1 bg-black hover:bg-gray-700 font-semibold text-white rounded text-sm"
            onClick={() => setShowModal(true)}
          >
            + New
          </button>
        </div>
      </div>

      <LoadingWrapper
        isLoading={isLoadingList}
        error={listError}
        text="Loading knowledge files..."
        type="inline"
        className="min-h-[300px]"
      >
        <Table
          headers={tableHeaders}
          data={tabledata}
          actionColumnKey={["Title & Description", "Caption", "Actions"]}
          onSelectedRowsChange={setSelectedRows}
        />
        {/* Pagination Controls */}
        <div className="flex flex-wrap justify-between items-center mt-4 gap-2">
          <div className="flex items-center gap-2">
            <label htmlFor="pageSize" className="text-sm">Page size:</label>
            <select
              id="pageSize"
              className="border rounded px-2 py-1 text-sm"
              value={pageSize}
              onChange={e => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
            >
              {PAGE_SIZE_OPTIONS.map(size => (
                <option key={size} value={size}>{size}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <button
              className="px-2 py-1 border rounded disabled:opacity-50"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              Prev
            </button>
            <span className="px-2">Page {currentPage} of {Math.max(1, Math.ceil(totalDocuments / pageSize))}</span>
            <button
              className="px-2 py-1 border rounded disabled:opacity-50"
              onClick={() => setCurrentPage((p) => Math.min(Math.ceil(totalDocuments / pageSize), p + 1))}
              disabled={currentPage >= Math.ceil(totalDocuments / pageSize)}
            >
              Next
            </button>
          </div>
        </div>
      </LoadingWrapper>

      {/* Upload Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md relative">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 text-xl"
              onClick={() => { setShowModal(false); setPreviewUrl(null); setMatchField(''); }}
              disabled={uploading}
              aria-label="Close"
            >
              &times;
            </button>
            <h2 className="text-lg font-semibold mb-4">Upload Document File</h2>
            {/* Upload mode toggle */}
            <div className="flex gap-2 mb-4">
              <button
                type="button"
                className={`px-3 py-1 rounded text-sm font-semibold border ${uploadMode === 'file' ? 'bg-black text-white border-black' : 'bg-gray-100 text-gray-700 border-gray-300'}`}
                onClick={() => {
                  setUploadMode('file');
                  setPreviewUrl(null);
                  setFolderFiles([]);
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
                disabled={uploading}
              >
                Upload Document
              </button>
              <button
                type="button"
                className={`px-3 py-1 rounded text-sm font-semibold border ${uploadMode === 'folder' ? 'bg-black text-white border-black' : 'bg-gray-100 text-gray-700 border-gray-300'}`}
                onClick={() => {
                  setUploadMode('folder');
                  setPreviewUrl(null);
                  setFolderFiles([]);
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
                disabled={uploading}
              >
                Upload Folder
              </button>
            </div>
            <form onSubmit={handleUpload} className="flex flex-col gap-4">
              <div className="flex flex-col items-center mb-2 min-h-[150px] justify-center">
                {uploadMode === 'file' ? (
                  previewUrl ? (
                    <>
                      <div className="flex flex-col items-center text-gray-600 bg-gray-50 p-4 rounded border w-full">
                        <FaFile size={60} className="mb-2" />
                        <div className="text-sm font-medium truncate w-full text-center">{fileInputRef.current?.files?.[0]?.name}</div>
                        <div className="text-xs text-gray-500">{Math.round((fileInputRef.current?.files?.[0]?.size ?? 0) / 1024)} KB</div>
                      </div>
                      <button
                        type="button"
                        className="text-xs text-red-500 underline mt-2"
                        onClick={() => {
                          setPreviewUrl(null);
                          if (fileInputRef.current) fileInputRef.current.value = "";
                        }}
                      >Remove</button>
                    </>
                  ) : (
                    <div className="flex flex-col items-center text-gray-400">
                      <FaFile size={100} />
                      <span className="text-sm">No document selected</span>
                    </div>
                  )
                ) : (
                  folderFiles.length > 0 ? (
                    <>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-2 max-h-64 overflow-y-auto w-full">
                        {folderFiles.map((file, idx) => (
                          <div key={file.name + idx} className="flex flex-col items-center border rounded p-2 bg-gray-50">
                            <FaFile size={40} className="mb-2 text-gray-600" />
                            <div className="text-xs text-gray-700 truncate w-full text-center" title={file.name}>{file.name}</div>
                            <div className="text-xs text-gray-500">{Math.round((file.size ?? 0) / 1024)} KB</div>
                          </div>
                        ))}
                      </div>
                      <div className="text-xs text-gray-600 mb-2">{folderFiles.length} document{folderFiles.length > 1 ? 's' : ''} selected</div>
                      <button
                        type="button"
                        className="text-xs text-red-500 underline"
                        onClick={() => {
                          setFolderFiles([]);
                          if (fileInputRef.current) fileInputRef.current.value = "";
                        }}
                      >Remove</button>
                    </>
                  ) : (
                    <div className="flex flex-col items-center text-gray-400">
                      <FaFile size={100} />
                      <span className="text-sm">No folder selected</span>
                    </div>
                  )
                )}
              </div>
              <input
                type="file"
                accept="*"
                ref={fileInputRef}
                className="border rounded px-3 py-2"
                disabled={uploading}
                onChange={handleFileChange}
                {...(uploadMode === 'folder' ? { multiple: true, webkitdirectory: "" } : {})}
              />
              <div className="flex flex-col gap-2">
                <label htmlFor="caption" className="text-sm font-medium text-gray-700">
                  Field Matching with Product Table Data
                </label>
                <textarea
                  id="match"
                  required={true}
                  value={matchField}
                  onChange={(e) => setMatchField(e.target.value)}
                  placeholder="Enter the field name that corresponds to the image name associated with the product ID."
                  className="border rounded px-3 py-2 text-sm resize-none"
                  rows={2}
                  disabled={uploading}
                />
              </div>
              {uploadError && <div className="text-red-500 text-sm">{uploadError}</div>}
              <button
                type="submit"
                className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800 disabled:opacity-50"
                disabled={uploading}
              >
                {uploading ? "Uploading..." : "Upload"}
              </button>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
