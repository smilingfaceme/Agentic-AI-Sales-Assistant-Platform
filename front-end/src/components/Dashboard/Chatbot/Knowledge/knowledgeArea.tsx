"use client";
import { useState, useEffect, useCallback } from "react";
import { FaSyncAlt, FaTrash } from "react-icons/fa";
import { API_BASE } from "@/utils";
import Table, { TableAction } from "@/components/Table";
import LoadingWrapper from "@/components/LoadingWrapper";
import Loading from "@/components/Loading";
import { useApiCall } from "@/hooks/useApiCall";
import { useChatbotContext } from "@/contexts/ChatbotContext";
import { useNotification } from '@/contexts/NotificationContext';
import { knowledgeApi } from "@/services/apiService";
import FileUploadConfig from "@/components/Dashboard/Chatbot/FileUploadConfig";

const tableHeaders = ["Title & Description", "Type", "Status", "Created on", "Actions"];

type KnowledgeFile = {
  id: string;
  company_id: string;
  file_name: string;
  file_type: string;
  full_path: string;
  status: string;
  created_at: string;
};

export default function KnowledgeArea() {
  const [knowledgeList, setKnowledgeList] = useState<KnowledgeFile[]>([]);
  const [deleteLoading, setDeleteLoading] = useState<Record<string, boolean>>({});
  const [reprocessLoading, setReprocessLoading] = useState<Record<string, boolean>>({});
  const { showModal, setShowModal } = useChatbotContext();
  const { showNotification } = useNotification();

  const { isLoading: isLoadingList, error: listError, execute: executeListAsync } = useApiCall();
  const { execute: executeDeleteAsync } = useApiCall();
  const { execute: executeReprocessAsync } = useApiCall();

  // Fetch knowledge files
  const fetchKnowledgeFileList = useCallback(async () => {
    const result = await executeListAsync(() => knowledgeApi.getKnowledgeFiles());

    if (result?.knowledges?.length) {
      const loadingState = result.knowledges.reduce((acc: Record<string, boolean>, item: KnowledgeFile) => {
        acc[item.id] = false;
        return acc;
      }, {});
      setDeleteLoading(loadingState);
      setReprocessLoading(loadingState);
      setKnowledgeList(result.knowledges);
    } else {
      setKnowledgeList([]);
    }
  }, [executeListAsync]);

  const deleteFile = async (id: string, file_name:string) => {
    setDeleteLoading((p) => ({ ...p, [id]: true }));
    const result = await executeDeleteAsync(() => knowledgeApi.deleteKnowledgeFile(id));
    setDeleteLoading((p) => ({ ...p, [id]: false }));
    if (result) {
      showNotification(`Deleted ${file_name} successfully!`, 'success', true)
      fetchKnowledgeFileList()
    };
  };

  const reprocessFile = async (id: string, file_name:string) => {
    setReprocessLoading((p) => ({ ...p, [id]: true }));
    const result = await executeReprocessAsync(() => knowledgeApi.reprocessKnowledgeFile(id));
    setReprocessLoading((p) => ({ ...p, [id]: false }));
    if (result) {
      showNotification(`Restarted processing ${file_name}.`, 'success', true)
      fetchKnowledgeFileList()
    };
  };

  // Map to table format
  const tabledata = knowledgeList.map((item) => ({
    "Title & Description": [
      {
        label: item.file_name,
        onClick: () =>
          window.open(
            `${API_BASE}/${item.full_path}`,
            "_blank"
          ),
        className: "bg-transparent cursor-pointer",
        icon: <></>,
        disabled:false
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
    fetchKnowledgeFileList();
  }, [fetchKnowledgeFileList]);

  return (
    <section className="flex-1 flex flex-col bg-white w-full p-6 h-full">
      <div className="flex items-center justify-between mb-4 border-b-2 border-gray-300 px-4 py-1">
        <div className="text-md font-semibold">Product Data</div>
        <div className="flex gap-2">
          <button
            className="px-3 py-1 hover:bg-gray-200 rounded text-sm flex items-center disabled:opacity-50"
            onClick={fetchKnowledgeFileList}
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
      </LoadingWrapper>

      <FileUploadConfig isOpen={showModal} onClose={() => setShowModal(false)} onConfirm={() => {fetchKnowledgeFileList()}} />
    </section>
  );
}
