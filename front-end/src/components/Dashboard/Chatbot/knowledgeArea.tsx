"use client";
import { useState, useEffect, useCallback } from "react";
import { FaSyncAlt, FaCloudUploadAlt, FaEdit, FaTrash } from "react-icons/fa";
import Table, { TableAction } from "@/components/Table";
import { SUPABASE_URL } from "@/utils";
import LoadingWrapper from "@/components/LoadingWrapper";
import Loading from "@/components/Loading";
import { useApiCall } from "@/hooks/useApiCall";
import { useAppContext } from '@/contexts/AppContext';
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
  name: string;
  created_at: string;
  updated_at: string;
  metadata: {
    mimetype: string;
    [key: string]: unknown;
  };
};


function encodeForQuery(value: string) {
  // encodeURIComponent is appropriate for query values
  return encodeURIComponent(String(value));
}

function encodePathSegment(segment: string) {
  return encodeURIComponent(String(segment)).replace(/%2F/g, '/');
}

const encodeFullUrl = (urlLike: string) => {
  try {
    // If it's already a valid URL, return a normalized version
    const u = new URL(urlLike);
    // encode path segments and query items to be extra-safe
    u.pathname = u.pathname.split('/').map(encodePathSegment).join('/');
    if (u.search) {
      // preserve existing query keys, but encode values
      const params = new URLSearchParams(u.search);
      for (const [k, v] of params) params.set(k, encodeForQuery(v));
      u.search = params.toString() ? `?${params.toString()}` : '';
    }
    return u.toString();
  } catch {
    // Not a full URL — percent-encode the whole string
    return encodeURI(String(urlLike));
  }
}

export default function KnowledgeArea() {
  const [knowledgeList, setKnowledgeList] = useState<Record<string, string | TableAction[]>[]>([]);

  const { projectId } = useAppContext();
  const { tableTitle, setTableTitle, showModal, setShowModal, file, setFile } = useChatbotContext();

  // Loading states for different operations
  const { isLoading: isLoadingList, error: listError, execute: executeListAsync } = useApiCall();
  const { isLoading: isUploading, error: uploadError, execute: executeUploadAsync } = useApiCall();
  const { execute: executeDeleteAsync } = useApiCall();

  const fetchKnowledgeFileList = useCallback(async () => {
    const result = await executeListAsync(async () => {
      return await knowledgeApi.getKnowledgeFiles(projectId);
    });

    if (result && Array.isArray(result.knowledges)) {
      const filtered = result.knowledges
        .filter((item: KnowledgeFile) => item.name !== ".emptyFolderPlaceholder")
        .map((item: KnowledgeFile) => ({
          "Title & Description": item.name,
          Type: item.metadata.mimetype,
          "Created on": item.created_at,
          "Modified on": item.updated_at,
          Actions: [
            {
              label: "View",
              onClick: () => {
                window.open(`${SUPABASE_URL}/storage/v1/object/public/knowledges/${projectId}/${encodeFullUrl(item.name)}`, "_blank") // Opens in a new tab/window
              },
              className: "flex items-center px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors",
              icon: <FaEdit />
            },
            {
              label: "Delete",
              onClick: async () => {
                const result = await executeDeleteAsync(async () => {
                  return await knowledgeApi.deleteKnowledgeFile(projectId, item.name);
                });

                if (result) {
                  await fetchKnowledgeFileList();
                }
              },
              className: "flex items-center px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 transition-colors",
              icon: <FaTrash />
            }
          ] as TableAction[],
        }));

      setKnowledgeList(filtered);
      setTableTitle("Documents");
    } else {
      setKnowledgeList([]);
      setTableTitle("Documents");
    }
  }, [projectId, executeListAsync, executeDeleteAsync, setTableTitle]);

  const handleUpload = async () => {
    if (!file) {
      alert("Please choose a file first");
      return;
    }

    const result = await executeUploadAsync(async () => {
      return await knowledgeApi.uploadKnowledgeFile(projectId, file);
    });

    if (result) {
      fetchKnowledgeFileList();
      setShowModal(false);
      setFile(null);
    }
  };

  useEffect(() => {
    if (projectId) fetchKnowledgeFileList();
  }, [projectId, fetchKnowledgeFileList]);

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
            onClick={() => setShowModal(true)}
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
        <Table headers={tableHeaders} data={knowledgeList} />
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
