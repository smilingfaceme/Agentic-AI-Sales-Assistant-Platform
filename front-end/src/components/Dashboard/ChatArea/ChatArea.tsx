import React, { useEffect, useCallback, useRef, useState } from "react";
import Image from "next/image";
import { chatApi } from "@/services/apiService";
import { FaWhatsapp, FaGlobe } from "react-icons/fa";
import LoadingWrapper from "@/components/LoadingWrapper";
import ChatPanel from '@/components/Dashboard/ChatArea/ChatPanel'
import { useApiCall } from "@/hooks/useApiCall";
import { useChatAreaContext } from '@/contexts/ChatAreaContext';

export default function ChatArea() {
  const { activeChatHistory, setActiveChatHistory, chatMessages, setChatMessages, agentMessage, setAgentMessage } = useChatAreaContext();
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Use the API call hook for managing loading states and preventing duplicate requests
  const { isLoading, error, execute } = useApiCall();
  const { isLoading: isTogglingAIReply, execute: executeToggleAIReply } = useApiCall();

  const fetchChatHistory = useCallback(async () => {
    if (!activeChatHistory?.conversation_id) return;

    const result = await execute(async () => {
      return await chatApi.getChatHistory(activeChatHistory.conversation_id);
    });

    if (result && result.messages) {
      setChatMessages(result.messages);
    }
  }, [activeChatHistory?.conversation_id, execute, setChatMessages]);

  const sendNewMessage = async (message: string, sender_type: string, files?: File[]) => {
    if (!activeChatHistory?.conversation_id || (!message.trim() && (!files || files.length === 0))) return;
    setAgentMessage("");

    if (files && files.length > 0) {
      // For message with files, use sendFilesMessage API
      const data = await chatApi.sendFilesMessage(activeChatHistory.conversation_id, files, sender_type, message);
      if (data.messages) {
        setChatMessages([...chatMessages, ...data.messages]);
      }
      return;
    } else {
      // For text-only message
      const data = await chatApi.sendMessage(activeChatHistory.conversation_id, message, sender_type);
      if (data.messages) {
        setChatMessages([...chatMessages, ...data.messages]);
      }
    }
  };

  const toggleAIReply = async () => {
    if (!activeChatHistory?.conversation_id) return;
    const result = await executeToggleAIReply(async () => {
      return await chatApi.toggleAIReply(activeChatHistory.conversation_id);
    });
    if (result) {
      setActiveChatHistory({ ...activeChatHistory, ai_reply: !activeChatHistory.ai_reply });
      activeChatHistory.ai_reply = !activeChatHistory.ai_reply;
    }
  };

  useEffect(() => {
    fetchChatHistory();
  }, [fetchChatHistory]);

  if (!activeChatHistory) {
    return <div className="flex-1 flex items-center justify-center">Select a conversation</div>;
  }

  return (
    <section className="flex-1 flex flex-col bg-gray-50 h-full">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-gray-200 bg-white px-4 md:px-6 py-4">
        <div className="flex items-center gap-3">
          {activeChatHistory.source === 'WhatsApp' || activeChatHistory.source === "WACA" ? <FaWhatsapp size={30} color="oklch(62.7% 0.194 149.214)" /> : <FaGlobe size={28} />}
          <div>
            <h2 className="font-semibold text-gray-900">{activeChatHistory.conversation_name}</h2>
            <p className="text-sm text-gray-500">{activeChatHistory.source}</p>
          </div>
        </div>
        <button
          className={`border border-gray-500 relative inline-flex h-6 w-11 items-center rounded-full transition ${activeChatHistory.ai_reply ? "bg-gray-800" : "bg-gray-100"}`}
          onClick={toggleAIReply}
          disabled = {isTogglingAIReply}
        >
          <span
            className={`inline-block h-5 w-5 transform rounded-full border border-gray-500 bg-gray-300 transition ${activeChatHistory.ai_reply ? "translate-x-6" : "translate-x-0"}`}
          />
        </button>
      </header>
      {/* Main chat area */}
      <div className="flex-1 px-2 md:px-10 py-4 md:py-6 overflow-y-auto bg-[#fafbfc] flex flex-col-reverse">
        <LoadingWrapper
          isLoading={isLoading}
          error={error}
          text="Loading chat history..."
          type="inline"
          className="flex-1"
        >
          <ChatPanel chatMessages={chatMessages} />
        </LoadingWrapper>
      </div>

      {/* Message Input Area */}
      <footer className="flex flex-col gap-2 border-t border-gray-200 bg-white px-4 md:px-6 py-4">
        {/* Files preview above input */}
        {attachedFiles.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {attachedFiles.map((file, index) => (
              <div key={index} className="flex items-center gap-2 bg-gray-100 rounded-lg p-2 border">
                {file.type.startsWith('image/') ? (
                  <Image
                    width={48}
                    height={48}
                    src={URL.createObjectURL(file)}
                    alt="preview"
                    className="w-12 h-12 object-cover rounded"
                  />
                ) : (
                  <div className="w-12 h-12 flex items-center justify-center bg-gray-200 rounded">
                    <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{file.name}</p>
                  <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
                </div>
                <button
                  className="text-xs px-2 py-1 bg-red-100 text-red-600 rounded hover:bg-red-200"
                  onClick={() => {
                    setAttachedFiles(attachedFiles.filter((_, i) => i !== index));
                    if (attachedFiles.length === 1 && fileInputRef.current) {
                      fileInputRef.current.value = "";
                    }
                  }}
                >×</button>
              </div>
            ))}
          </div>
        )}
        <div className="flex items-center gap-2 w-full">
          {/* File upload button */}
          <button
            className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500"
            aria-label="Attach files"
            onClick={() => fileInputRef.current?.click()}
          >
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
          </button>
          <input
            type="file"
            ref={fileInputRef}
            style={{ display: "none" }}
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                const newFiles = Array.from(e.target.files);
                setAttachedFiles([...attachedFiles, ...newFiles]);
              }
            }}
            multiple
          />
          <input
            className="flex-1 px-4 py-2 rounded-full border bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-200"
            placeholder="Type message or '/' for quick response"
            type="text"
            value={agentMessage}
            onChange={(e) => setAgentMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (agentMessage.trim() || attachedFiles.length > 0)) {
                e.preventDefault();
                if (attachedFiles.length > 0) {
                  sendNewMessage(agentMessage, "agent", attachedFiles);
                  setAttachedFiles([]);
                  setAgentMessage("");
                  if (fileInputRef.current) fileInputRef.current.value = "";
                } else if (agentMessage.trim()) {
                  sendNewMessage(agentMessage, "agent");
                  setAgentMessage("");
                }
              }
            }}
          />
          {/* Single send button for text or files */}
          <button
            className="p-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-400"
            aria-label="Send"
            disabled={!(agentMessage.trim() || attachedFiles.length > 0)}
            onClick={() => {
              if (attachedFiles.length > 0) {
                sendNewMessage(agentMessage, "agent", attachedFiles);
                setAttachedFiles([]);
                setAgentMessage("");
                if (fileInputRef.current) fileInputRef.current.value = "";
              } else if (agentMessage.trim()) {
                sendNewMessage(agentMessage, "agent");
                setAgentMessage("");
              }
            }}
          >
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </footer>
    </section>
  );
}
