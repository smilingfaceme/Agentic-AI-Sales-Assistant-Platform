import React from "react";
import Image from "next/image";
import { API_BASE } from "@/utils";
import { FaRobot } from "react-icons/fa";
import ReactMarkdown from "react-markdown";
export type ChatMessage = {
  message_id: number;
  conversation_id: string;
  sender_type: 'customer' | 'bot' | 'agent';
  user_id?: string | null;
  email?: string | null;
  content: string;
  created_at?: string;
  extra: {
    images?: string[];
    [key: string]: unknown;
  };
};

function formatDate(date: string) {
  const d = new Date(date);
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

interface TestChatPanelProps {
  chatMessages?: Array<ChatMessage>;
}


export default function TestChatBotPanel({ chatMessages }: TestChatPanelProps) {

  return (
    <>
      {chatMessages && chatMessages.length > 0 ? (
        <>
          <section className="flex flex-col gap-6">
            {/* Date Separator */}
            {chatMessages.map((msg, idx) => (
              <>
                {formatDate(msg.created_at || new Date().toISOString()) != formatDate(chatMessages[idx - 1]?.created_at || new Date().toISOString()) ? (
                  <div className="flex items-center">
                    <hr className="flex-1 border-t border-gray-300" />
                    <span className="bg-gray-200 text-gray-600 px-4 py-1 rounded-full text-xs font-medium mx-4">
                      {formatDate(msg.created_at || new Date().toISOString())}
                    </span>
                    <hr className="flex-1 border-t border-gray-300" />
                  </div>
                ) : null}
                {/* Messages */}
                <div key={msg.message_id ?? idx} className={`flex ${msg.sender_type != "customer" ? "justify-start" : "justify-end"}`}>
                  <div className={`max-w-[90vw] md:max-w-[40%] text-sm flex flex-col`}>
                    <div className={`rounded-tl-xl rounded-tr-xl px-4 py-3 ${msg.sender_type != "customer" ? "bg-gray-200 text-gray-900 rounded-br-xl" : "bg-[#23263b] text-white rounded-bl-xl"}`}>
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                      {/* Show images if message.extra is a list of image URLs */}
                      {Array.isArray(msg.extra.images) && msg.extra.images.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {msg.extra.images?.map((imgUrl: string, imgIdx: number) => (
                            <div key={imgIdx} className="rounded overflow-hidden">
                              <Image
                                src={`${API_BASE}/${imgUrl}`}
                                alt={`image-${imgIdx}`}
                                width={150}
                                height={100}
                                unoptimized
                                className="max-h-32 rounded shadow border border-gray-300"
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <span className="flex text-xs text-gray-600 mt-1 self-end">
                      {msg.created_at ? new Date(msg.created_at).toLocaleTimeString() : ""}
                      {msg.sender_type == "agent" && msg.user_id && (
                        <span className="ml-2">• {msg.email}</span>
                      )}
                      {msg.sender_type == "bot" && <><span className="ml-2">• </span><FaRobot className="ml-1" size={15} /></>}
                    </span>
                  </div>
                </div>
              </>
            ))}
          </section>
        </>
      ) : (
        <div className="flex items-center justify-center flex-1 text-gray-500">
          No messages in this conversation yet
        </div>
      )}
    </>
  );
}
