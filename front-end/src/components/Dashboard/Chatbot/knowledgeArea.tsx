"use client";
import { useState, useEffect, useCallback } from "react";
import { FaSyncAlt, FaCloudUploadAlt, FaEdit, FaTrash } from "react-icons/fa";
import Table, { TableAction } from "@/components/Table";
import { SUPABASE_URL } from "@/utils";
import LoadingWrapper from "@/components/LoadingWrapper";
import Loading from "@/components/Loading";
import { useApiCall } from "@/hooks/useApiCall";
import { useChatbotContext } from '@/contexts/ChatbotContext';
import { knowledgeApi } from "@/services/apiService";

const tableHeaders = [
  "Title & Description",
  "Type",
  "Created on",
  "Modified on",
  "Actions",
];

type KnowledgeFile = {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
  metadata: {
    mimetype: string;
    [key: string]: unknown;
  };
};

// encodeURIComponent is appropriate for query values
function encodeForQuery(value: string) {
  return encodeURIComponent(String(value));
}

// encodeURIComponent is appropriate for path segments
function encodePathSegment(segment: string) {
  return encodeURIComponent(String(segment)).replace(/%2F/g, '/');
}

// encode full URL to be extra-safe
const encodeFullUrl = (urlLike: string) => {
  try {
    const u = new URL(urlLike);
    u.pathname = u.pathname.split('/').map(encodePathSegment).join('/');
    if (u.search) {
      const params = new URLSearchParams(u.search);
      for (const [k, v] of params) params.set(k, encodeForQuery(v));
      u.search = params.toString() ? `?${params.toString()}` : '';
    }
    return u.toString();
  } catch {
    return encodeURI(String(urlLike));
  }
}

export default function KnowledgeArea() {
  // State for knowledge files and company
  const [knowledgeList, setKnowledgeList] = useState<KnowledgeFile[]>([]);
  const [company, setCompany] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const { tableTitle, setTableTitle, showModal, setShowModal} = useChatbotContext();

  // Loading states for different operations
  const { isLoading: isLoadingList, error: listError, execute: executeListAsync } = useApiCall();
  const { isLoading: isUploading, error: uploadError, execute: executeUploadAsync } = useApiCall();
  const { execute: executeDeleteAsync } = useApiCall();

  // Loading state for delete operation
  const [deleteLoading, setDeleteLoading] = useState<Record<string, boolean>>({});

  // Fetch knowledge files
  const fetchKnowledgeFileList = useCallback(async () => {
    const result = await executeListAsync(async () => {
      return await knowledgeApi.getKnowledgeFiles();
    });

    if (result && Array.isArray(result.knowledges)) {
      if (result.knowledges?.length) {
        const initialLoading = result.knowledges.reduce((acc: Record<string, boolean>, item: KnowledgeFile) => {
          acc[item.id] = false;
          return acc;
        }, {} as Record<string, boolean>);
        setDeleteLoading(initialLoading);
      }
      setCompany(result.company_id)
      setKnowledgeList(result.knowledges);
      setTableTitle("Documents");
    } else {
      setKnowledgeList([]);
      setTableTitle("Documents");
    }
  }, [executeListAsync, setTableTitle]);

  // Delete knowledge file
  const deleteFile = async (fileid: string, filename: string) => {
    setDeleteLoading((prev) => ({ ...prev, [fileid]: true }));
    const result = await executeDeleteAsync(async () => {
      return await knowledgeApi.deleteKnowledgeFile(filename);
    });
    setDeleteLoading((prev) => ({ ...prev, [fileid]: false }));
    if (result) {
      await fetchKnowledgeFileList();
    }
  }

  // Map knowledge files to table data
  const tabledata = knowledgeList
    .filter((item: KnowledgeFile) => item.name !== ".emptyFolderPlaceholder")
    .map((item: KnowledgeFile) => ({
      "Title & Description": item.name,
      Type: item.metadata.mimetype,
      "Created on": new Date(item.created_at).toLocaleDateString(),
      "Modified on": new Date(item.updated_at).toLocaleDateString(),
      Actions: [
        {
          label: "View",
          onClick: () => {
            window.open(`${SUPABASE_URL}/storage/v1/object/public/knowledges/${company}/${encodeFullUrl(item.name)}`, "_blank") // Opens in a new tab/window
          },
          className: "flex items-center px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors",
          icon: <FaEdit />
        },
        {
          label: "",
          onClick: async () => deleteFile(item.id, item.name),
          className: "flex items-center px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 transition-colors",
          icon: <Loading isLoading={deleteLoading[item.id] ?? false} type="button" size="small" text="Deleting" theme="dark">
            <FaTrash className="mr-1" /> Delete
          </Loading>
        }
      ] as TableAction[],
    }));

  // Upload knowledge file
  const handleUpload = async () => {
    if (!file) {
      alert("Please choose a file first");
      return;
    }

    const result = await executeUploadAsync(async () => {
      return await knowledgeApi.uploadKnowledgeFile(file);
    });

    if (result) {
      fetchKnowledgeFileList();
      setShowModal(false);
      setFile(null);
    }
  };

  useEffect(() => {
    fetchKnowledgeFileList();
  }, [fetchKnowledgeFileList]);

  return (
    <section className="flex-1 flex flex-col bg-white w-full p-6 h-full">
      <div className="flex items-center justify-between mb-4 border-b-2 border-gray-300 px-4 py-1">
        <div className="text-md font-semibold">{tableTitle}</div>
        <div className="flex gap-2">
          <button
            className="px-3 py-1 hover:bg-gray-200 rounded text-sm flex items-center justify-center disabled:opacity-50"
            aria-label="Refresh"
            onClick={fetchKnowledgeFileList}
            disabled={isLoadingList}
          >
            <Loading isLoading={isLoadingList} type="button" text="Refreshing..." size="small">
              <>
                <FaSyncAlt />
                <span className="ml-2">Refresh</span>
              </>
            </Loading>
          </button>
          <button
            className="px-3 py-1 bg-black hover:bg-gray-700 font-semibold text-white rounded text-sm"
            aria-label="New Knowledge"
            onClick={() => {setFile(null); setShowModal(true); }}
          >
            + New
          </button>
        </div>
      </div>

      {/* Table */}
      <LoadingWrapper
        isLoading={isLoadingList}
        error={listError}
        text="Loading knowledge files..."
        type="inline"
        className="min-h-[300px]"
      >
        <Table headers={tableHeaders} data={tabledata} />
      </LoadingWrapper>

      {/* Modal */}
      <div
        className={`fixed inset-0 bg-[#00000096] flex items-center justify-center z-50 transition-opacity duration-500 ${showModal ? "opacity-100 visible" : "opacity-0 invisible"}`}
        onClick={() => setShowModal(false)}
      >
        <div className="bg-white rounded-lg shadow-lg w-full max-w-md" onClick={(e) => e.stopPropagation()}>
          {/* Header */}
          <div className="border-b border-gray-300 px-4 py-3 font-semibold text-lg">
            Add new knowledge document
          </div>

          {/* Main */}
          <div className="p-4 h-50 items-center flex flex-col">
            <FaCloudUploadAlt size={100} color="gray" title="Choose File" />
            <input
              type="file"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="w-full border border-gray-300 rounded p-2"
              disabled={isUploading}
            />
            {uploadError && (
              <div className="mt-2 text-red-500 text-sm text-center">
                {uploadError}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-300 px-4 py-3 flex justify-between">
            <button
              className="px-4 py-1 rounded border border-gray-400 hover:bg-gray-100 disabled:opacity-50"
              onClick={() => setShowModal(false)}
              disabled={isUploading}
            >
              Cancel
            </button>
            <button
              className="px-4 py-1 rounded bg-black text-white hover:bg-gray-700 disabled:opacity-50"
              onClick={handleUpload}
              disabled={isUploading}
            >
              <Loading isLoading={isUploading} type="button" text="Uploading..." theme="dark">
                Upload
              </Loading>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
