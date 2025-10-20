"use client";
import Image from "next/image";
import { useState, useEffect, useCallback, useRef } from "react";
import { FaSyncAlt, FaTrash, FaRegImage } from "react-icons/fa";
import { SUPABASE_URL } from "@/utils";
import Table, { TableAction } from "@/components/Table";
import LoadingWrapper from "@/components/LoadingWrapper";
import Loading from "@/components/Loading";
import { useApiCall } from "@/hooks/useApiCall";
import { useChatbotContext } from "@/contexts/ChatbotContext";
import { imageApi } from "@/services/apiService";
import { useNotification } from '@/contexts/NotificationContext';

const tableHeaders = ["Title & Description", "Type", "Status", "Created on", "Actions"];

const PAGE_SIZE_OPTIONS = [5, 10, 20, 50];

type ImageFile = {
  id: string;
  file_name: string;
  file_type: string;
  status: string;
  created_at: string;
};

export default function ImageControlArea() {
  const { showNotification, showProgressNotification, updateProgressNotification, closeNotification } = useNotification();
  const [companyId, setCompanyID] = useState('')
  const [imageList, setImageList] = useState<ImageFile[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalImages, setTotalImages] = useState(0);
  const [pageSize, setPageSize] = useState(PAGE_SIZE_OPTIONS[1]);
  const [deleteLoading, setDeleteLoading] = useState<Record<string, boolean>>({});
  const [reprocessLoading, setReprocessLoading] = useState<Record<string, boolean>>({});
  const { showModal, setShowModal } = useChatbotContext();

  // Modal upload state
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadMode, setUploadMode] = useState<'file' | 'folder'>('file');
  const [folderFiles, setFolderFiles] = useState<File[]>([]);
  const [folderPreviewUrls, setFolderPreviewUrls] = useState<string[]>([]);

  const { isLoading: isLoadingList, error: listError, execute: executeListAsync } = useApiCall();
  const { execute: executeDeleteAsync } = useApiCall();
  const { execute: executeReprocessAsync } = useApiCall();
  const { execute: executeUploadAsync } = useApiCall();

  // Fetch knowledge files with pagination
  const fetchImageFileList = useCallback(async (page = 1, size = pageSize) => {
    const offset = (page - 1) * size;
    const result = await executeListAsync(() => imageApi.getImageFiles(size, offset));

    if (result?.images?.length) {
      const loadingState = result.images.reduce((acc: Record<string, boolean>, item: ImageFile) => {
        acc[item.id] = false;
        return acc;
      }, {});
      setDeleteLoading(loadingState);
      setReprocessLoading(loadingState);
      setImageList(result.images);
      setTotalImages(result.total ?? result.images.length);
      setCompanyID(result.company_id) // expects API to return total
    } else {
      setImageList([]);
      setTotalImages(0);
    }
  }, [executeListAsync, pageSize]);

  const deleteFile = async (id: string, file_name:string) => {
    setDeleteLoading((p) => ({ ...p, [id]: true }));
    const result = await executeDeleteAsync(() => imageApi.deleteImageFile(id));
    setDeleteLoading((p) => ({ ...p, [id]: false }));
    if (result) {
      showNotification(`Deleted ${file_name} successfully!`, 'success', true)
      fetchImageFileList(currentPage)
    };
  };

  const reprocessFile = async (id: string, file_name:string) => {
    setReprocessLoading((p) => ({ ...p, [id]: true }));
    const result = await executeReprocessAsync(() => imageApi.reprocessImageFile(id));
    setReprocessLoading((p) => ({ ...p, [id]: false }));
    if (result) {
      showNotification(`Restarted processing ${file_name} successfully!`, 'success', true)
      fetchImageFileList(currentPage)
    };
  };

  // Map to table format
  const tabledata = imageList.map((item) => ({
    "Title & Description": [
      {
        label: item.file_name,
        disabled:false,
        onClick: () =>
          window.open(
            `${SUPABASE_URL}/storage/v1/object/public/images/${companyId}/${item.file_name}`,
            "_blank"
          ),
        className: "bg-transparent cursor-pointer",
        icon: <></>,
      },
    ],
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
        disabled: deleteLoading[item.id],
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
    fetchImageFileList(currentPage, pageSize);
  }, [fetchImageFileList, currentPage, pageSize]);

  // Utility: runs in background
  const startBackgroundUpload = (files:File[]) => {
    (async () => {
      let uploadedCount = 0;
      let failedCount = 0;
      const totalCount = files.length;
      const progressId = showProgressNotification(`Uploading ${totalCount} images...`, 0);

      const updateProgress = () => {
        const percent = Math.round(((uploadedCount + failedCount) / totalCount) * 100);
        updateProgressNotification(progressId, percent, `Progress: ${percent}%`);
      };

      // Sequential upload loop
      for (const file of files) {
        try {
          const percent = Math.round(((uploadedCount + failedCount) / totalCount) * 100);
          updateProgressNotification(progressId, percent, `Uploading images: ${uploadedCount} succeeded, ${failedCount} failed, ${totalCount - uploadedCount - failedCount} remaining...`);
          const result = await imageApi.uploadImageFile(file);
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
      setFolderPreviewUrls([]);
      fetchImageFileList();
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
        const result = await executeUploadAsync(() => imageApi.uploadImageFile(file));
        if (result?.success) {
          setShowModal(false);
          fetchImageFileList();
          setPreviewUrl(null);
          showNotification(`${file.name} uploaded successfully!`, 'success', true);
        } else {
          setUploadError(result?.message || "Upload failed.");
        }
      } else {
        if (!folderFiles.length) {
          setUploadError("Please select a folder with images.");
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
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
      } else {
        setPreviewUrl(null);
      }
    } else {
      const files = fileInputRef.current?.files;
      if (files && files.length > 0) {
        const arr = Array.from(files);
        setFolderFiles(arr);
        setFolderPreviewUrls(arr.map(f => URL.createObjectURL(f)));
      } else {
        setFolderFiles([]);
        setFolderPreviewUrls([]);
      }
    }
  };

  return (
    <section className="flex-1 flex flex-col bg-white w-full p-6 h-full">

      <div className="flex items-center justify-between mb-4 border-b-2 border-gray-300 px-4 py-1">
        <div className="text-md font-semibold">Product Images</div>
        <div className="flex gap-2">
          <button
            className="px-3 py-1 hover:bg-gray-200 rounded text-sm flex items-center disabled:opacity-50"
            onClick={() => fetchImageFileList(currentPage)}
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
          actionColumnKey={["Title & Description", "Actions"]}
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
            <span className="px-2">Page {currentPage} of {Math.max(1, Math.ceil(totalImages / pageSize))}</span>
            <button
              className="px-2 py-1 border rounded disabled:opacity-50"
              onClick={() => setCurrentPage((p) => Math.min(Math.ceil(totalImages / pageSize), p + 1))}
              disabled={currentPage >= Math.ceil(totalImages / pageSize)}
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
              onClick={() => { setShowModal(false); setPreviewUrl(null); }}
              disabled={uploading}
              aria-label="Close"
            >
              &times;
            </button>
            <h2 className="text-lg font-semibold mb-4">Upload Image File</h2>
            {/* Upload mode toggle */}
            <div className="flex gap-2 mb-4">
              <button
                type="button"
                className={`px-3 py-1 rounded text-sm font-semibold border ${uploadMode === 'file' ? 'bg-black text-white border-black' : 'bg-gray-100 text-gray-700 border-gray-300'}`}
                onClick={() => {
                  setUploadMode('file');
                  setPreviewUrl(null);
                  setFolderFiles([]);
                  setFolderPreviewUrls([]);
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
                disabled={uploading}
              >
                Upload File
              </button>
              <button
                type="button"
                className={`px-3 py-1 rounded text-sm font-semibold border ${uploadMode === 'folder' ? 'bg-black text-white border-black' : 'bg-gray-100 text-gray-700 border-gray-300'}`}
                onClick={() => {
                  setUploadMode('folder');
                  setPreviewUrl(null);
                  setFolderFiles([]);
                  setFolderPreviewUrls([]);
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
                      <Image src={previewUrl} width={200} height={200} alt="Preview" className="max-h-48 object-contain rounded border mb-2" />
                      <button
                        type="button"
                        className="text-xs text-red-500 underline"
                        onClick={() => {
                          setPreviewUrl(null);
                          if (fileInputRef.current) fileInputRef.current.value = "";
                        }}
                      >Remove</button>
                    </>
                  ) : (
                    <div className="flex flex-col items-center text-gray-400">
                      <FaRegImage size={100} />
                      <span className="text-sm">No image selected</span>
                    </div>
                  )
                ) : (
                  folderPreviewUrls.length > 0 ? (
                    <>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-2 max-h-64 overflow-y-auto">
                        {folderPreviewUrls.map((url, idx) => (
                          <div key={url} className="flex flex-col items-center border rounded p-2 bg-gray-50">
                            <Image src={url} width={120} height={120} alt={`Preview ${idx + 1}`} className="object-contain rounded mb-2 max-h-28" />
                            <div className="text-xs text-gray-700 truncate w-full text-center" title={folderFiles[idx]?.name}>{folderFiles[idx]?.name}</div>
                            <div className="text-xs text-gray-500">{Math.round((folderFiles[idx]?.size ?? 0) / 1024)} KB</div>
                          </div>
                        ))}
                      </div>
                      <div className="text-xs text-gray-600 mb-2">{folderFiles.length} image{folderFiles.length > 1 ? 's' : ''} selected</div>
                      <button
                        type="button"
                        className="text-xs text-red-500 underline"
                        onClick={() => {
                          setFolderPreviewUrls([]);
                          setFolderFiles([]);
                          if (fileInputRef.current) fileInputRef.current.value = "";
                        }}
                      >Remove</button>
                    </>
                  ) : (
                    <div className="flex flex-col items-center text-gray-400">
                      <FaRegImage size={100} />
                      <span className="text-sm">No folder selected</span>
                    </div>
                  )
                )}
              </div>
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                className="border rounded px-3 py-2"
                disabled={uploading}
                onChange={handleFileChange}
                {...(uploadMode === 'folder' ? { multiple: true, webkitdirectory: "" } : {})}
              />
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
