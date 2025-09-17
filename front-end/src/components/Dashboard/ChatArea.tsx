import React from "react";

const chatMessages = [
  {
    sender: "user",
    text: "Hi, Do you know daniel",
    time: "12:34 PM",
    date: "2025-09-12",
    sources: [],
    email: "",
  },
  {
    sender: "bot",
    text:
      "Yes, I know Daniel Hiroshi. He is a Machine Learning Engineer with 8 years of experience, specializing in NLP, Computer Vision, and Machine Learning technologies. You can reach him at <a href='mailto:hiroshidaniel112@gmail.com' class='underline'>hiroshidaniel112@gmail.com</a> or connect on <a href='https://linkedin.com/in/daniel-hiroshi-21533936b' class='underline'>linkedin.com/in/daniel-hiroshi-21533936b</a>.",
    time: "12:34 PM",
    date: "2025-09-12",
    sources: ["Source", "1", "2", "3"],
    email: "Chatbot",
  },
  {
    sender: "bot",
    text: "Hi",
    time: "12:37 PM",
    date: "2025-09-12",
    sources: [],
    email: "vectorsuperdev@gmail.com",
  },
];

function formatDate(date: string) {
  const d = new Date(date);
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function ChatArea() {
  return (
    <section className="flex-1 flex flex-col bg-[#fafbfc] w-full">
      {/* Chat header */}
      <header className="flex items-center gap-2 px-4 md:px-6 py-4 border-b border-gray-300 bg-white">
        <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
          <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /></svg>
        </div>
        <span className="font-semibold text-md text-gray-800">disturbed-teal-roadrunner</span>
      </header>
      {/* Main chat area */}
      <div className="flex-1 px-2 md:px-10 py-4 md:py-6 overflow-y-auto bg-[#fafbfc] flex flex-col">
        {/* Date Separator */}
        <div className="flex items-center mb-6">
          <hr className="flex-1 border-t border-gray-300" />
          <span className="bg-gray-200 text-gray-600 px-4 py-1 rounded-full text-xs font-medium mx-4">
            {formatDate(chatMessages[0].date)}
          </span>
          <hr className="flex-1 border-t border-gray-300" />
        </div>
        {/* Messages */}
        <section className="flex flex-col gap-6">
          {chatMessages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.sender === "user" ? "justify-start" : "justify-end"}`}>
              <div className={`max-w-[90vw] md:max-w-[40%] text-sm flex flex-col`}>
                <div className={`rounded-tl-xl rounded-tr-xl px-4 py-3 ${msg.sender === "bot" ? "bg-[#23263b] text-white rounded-bl-xl" : "bg-gray-200 text-gray-900 rounded-br-xl"}`}>
                  <span dangerouslySetInnerHTML={{ __html: msg.text }} />
                </div>
                <span className="text-xs text-gray-600 mt-1 self-end">
                  {msg.time}
                  {msg.sender === "bot" && <span className="ml-2">• {msg.email}</span>}
                </span>
              </div>
            </div>
          ))}
        </section>
      </div>
      {/* Message Input Area */}
      <footer className="flex items-center gap-2 border-t border-gray-200 bg-white px-4 md:px-6 py-4">
        <button className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500" aria-label="Attach">
          <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 4v16m8-8H4" /></svg>
        </button>
        <input
          className="flex-1 px-4 py-2 rounded-full border bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-200"
          placeholder="Type message or '/' for quick response"
          type="text"
        />
        <button className="p-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white" aria-label="Send">
          <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
        </button>
      </footer>
    </section>
  );
}
