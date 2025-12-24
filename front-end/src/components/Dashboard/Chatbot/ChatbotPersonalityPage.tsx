"use client";
import { useState } from 'react';
import AnswerFormattingTab from './Personality/AnswerFormattingTab';
import BotIdentityTab from './Personality/BotIdentityTab';

type TabType = 'answer-formatting' | 'bot-identity';

export default function ChatbotPersonalityPage() {
  const [activeTab, setActiveTab] = useState<TabType>('answer-formatting');

  return (
    <div className="flex flex-col h-full w-full bg-[#fafbfc]">
      {/* Header */}
      <header className="hidden md:block px-4 md:px-6 py-4 md:pt-5 border-b border-gray-300 bg-white text-lg font-semibold">
        <span>Chatbot Personality</span>
      </header>

      {/* Main content area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Tabs */}
        <div className="bg-white border-b border-gray-300 px-4 md:px-6 flex gap-4">
          <button
            onClick={() => setActiveTab('answer-formatting')}
            className={`px-4 py-3 font-medium text-sm transition-all duration-200 border-b-2 ${
              activeTab === 'answer-formatting'
                ? 'border-blue-500 font-semibold'
                : 'border-transparent text-gray-500 hover:text-gray-600 font-semibold'
            }`}
          >
            Answer Formatting
          </button>
          <button
            onClick={() => setActiveTab('bot-identity')}
            className={`px-4 py-3 font-medium text-sm transition-all duration-200 border-b-2 ${
              activeTab === 'bot-identity'
                ? 'border-blue-500 font-semibold'
                : 'border-transparent text-gray-500 font-semibold hover:text-gray-600'
            }`}
          >
            Bot Identity
          </button>
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-auto">
          {activeTab === 'answer-formatting' && <AnswerFormattingTab />}
          {activeTab === 'bot-identity' && <BotIdentityTab />}
        </div>
      </main>
    </div>
  );
}

