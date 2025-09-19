"use client";
import { useState, useEffect, useCallback } from "react";
import { FaSyncAlt, FaEdit } from "react-icons/fa";
import Table, { TableAction } from "@/components/Table";
import { apiRequest } from "@/utils";
import LoadingWrapper from "@/components/LoadingWrapper";
import Loading from "@/components/Loading";
import { useApiCall } from "@/hooks/useApiCall";
import ChatArea from "@/components/Dashboard/Chat/ChatArea";

const tableHeaders = [
  "Channel Name",
  "Message",
  "Send At",
  "Actions",
];

type MessageFile = {
  conversation_name: string;
  conversation_id: string;
  content: string;
  created_at: string;
  source: string;
  [key: string]: unknown;
};

interface UnansweredQuestionProps {
  projectId?: string;
}

export default function UnansweredQuestionArea({ projectId }: UnansweredQuestionProps) {
  const [knowledgeList, setKnowledgeList] = useState<Record<string, string | TableAction[]>[]>([]);
  const [tableTitle, setTableTitle] = useState("");
  const [activeMessage, setActiveMessage] = useState<MessageFile>({
    conversation_name: '',
    conversation_id: '',
    content: '',
    created_at: '',
    source: ''
  });
  const [showModal, setShowModal] = useState(false);
  // Loading states for different operations
  const { isLoading: isLoadingList, error: listError, execute: executeListAsync } = useApiCall();
  const { execute: executeDeleteAsync } = useApiCall();

  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (showModal) {
      setIsVisible(true); // mount + play enter animation
    } else {
      const timer = setTimeout(() => setIsVisible(false), 500); // wait for exit animation
      return () => clearTimeout(timer);
    }
  }, [showModal]);

  const fetchUnansweredQuestionList = useCallback(async () => {
    const result = await executeListAsync(async () => {
      const res = await apiRequest(
        `/conversation/unanswered`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!res.ok) throw new Error("Failed to fetch knowledge files");

      const data = await res.json();
      return data;
    });

    if (result && Array.isArray(result.messages)) {
      const filtered = result.messages
        .filter((item: MessageFile) => item.name !== ".emptyFolderPlaceholder")
        .map((item: MessageFile) => ({
          "Channel Name": item.conversation_name,
          "Message": item.content,
          "Send At": item.created_at,
          'Actions': [{
            label: "View",
            onClick: () => { setActiveMessage(item); setShowModal(true) },
            className: "flex items-center px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors",
            icon: <FaEdit />
          }] as TableAction[],
        }));

      setKnowledgeList(filtered);
      setTableTitle("Unanswered Questions");
    } else {
      setKnowledgeList([]);
      setTableTitle("Unanswered Questions");
    }
  }, [executeListAsync, executeDeleteAsync]);

  useEffect(() => {
    fetchUnansweredQuestionList();
  }, [fetchUnansweredQuestionList]);

  return (
    <section className="flex-1 flex flex-col bg-white w-full p-6">
      <div className="flex items-center justify-between mb-4 border-b-2 border-gray-300 px-4 py-1">
        <div className="text-md font-semibold">{tableTitle}</div>
        <div className="flex gap-2">
          <button
            className="px-3 py-1 hover:bg-gray-200 rounded text-sm flex items-center justify-center disabled:opacity-50"
            aria-label="Refresh"
            onClick={fetchUnansweredQuestionList}
            disabled={isLoadingList}
          >
            <Loading isLoading={isLoadingList} type="button" text="Refreshing..." size="small">
              <>
                <FaSyncAlt />
                <span className="ml-2">Refresh</span>
              </>
            </Loading>
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
        className={`fixed inset-0 bg-[#00000096] flex items-center justify-end z-50 transition-opacity duration-500 ${showModal ? "opacity-100 visible" : "opacity-0 invisible"
          }`}
        onClick={() => setShowModal(false)}
      >
        <div
          className={`w-[50%] h-full mr-0 bg-white shadow-lg transform transition-transform duration-500 ease-in-out ${showModal ? "translate-x-0" : "translate-x-full"
            }`}
          onClick={(e) => e.stopPropagation()} // prevent closing when clicking inside
        >
          <ChatArea
            key={activeMessage.conversation_id}
            conversationId={activeMessage.conversation_id}
            conversationName={activeMessage.conversation_name}
            conversationSource={activeMessage.source}
          />
        </div>
      </div>

    </section>
  );
}
