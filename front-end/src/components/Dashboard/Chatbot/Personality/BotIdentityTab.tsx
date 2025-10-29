"use client";
import { useState, useEffect, useCallback } from "react";
import { personalityAPI } from "@/services/apiService"
import { useApiCall } from "@/hooks/useApiCall";
import Loading from "@/components/Loading";
import { useNotification } from '@/contexts/NotificationContext';

export default function BotIdentityTab() {
  const { showNotification } = useNotification();

  const [personality, setPersonality] = useState({
    bot_name: '',
    bot_prompt: '',
    sample_response: ''
  });
  const [botName, setBotName] = useState('');
  const [botPrompt, setBotPrompt] = useState('');
  const [sampleAnswerNoProducts, setSampleAnswerNoProducts] = useState('');

  const { isLoading: isLoadingStatus, execute: executeStatusAsync } = useApiCall();
  const { isLoading: isLoadingUpdate, execute: executeUpdateAsync } = useApiCall();

  const handleSave = async () => {
    const updateData = {
      bot_name: botName,
      bot_prompt: botPrompt,
      sample_response: sampleAnswerNoProducts
    };
    const result = await executeUpdateAsync(() => personalityAPI.updatePersonality(updateData));
    if (result?.message) {
      setPersonality(updateData);
      showNotification(result.message || 'Personality updated successfully!', 'success', true);
    } else {
      showNotification('Failed to update personality!', 'error', true);
    }
  };

  const fetchPersonality = useCallback(async () => {
    const result = await executeStatusAsync(() => personalityAPI.getPersonality());

    if (result?.chatbot_personality) {
      setBotName(result.chatbot_personality.bot_name);
      setBotPrompt(result.chatbot_personality.bot_prompt);
      setSampleAnswerNoProducts(result.chatbot_personality.sample_response);
      setPersonality(result.chatbot_personality);
    }
  }, [executeStatusAsync])

  useEffect(() => {
    fetchPersonality();
  }, [fetchPersonality]);

  return (
    <Loading isLoading={isLoadingStatus} type="overlay" text="Loading..." size="large">
      <div className="p-4 md:p-6 bg-gray-50 overflow-auto">
        <div className="mx-auto bg-white rounded-lg shadow-sm p-6 space-y-6">
          {/* Bot Name */}
          <div className="border-b border-gray-200 pb-6">
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Bot Name
            </label>
            <textarea
              value={botName}
              onChange={(e) => setBotName(e.target.value)}
              placeholder="Enter your bot's name"
              className="max-w-3xl w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={1}
            />
          </div>

          {/* Bot Prompt */}
          <div className="border-b border-gray-200 pb-6">
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Bot Prompt
            </label>
            <textarea
              value={botPrompt}
              onChange={(e) => setBotPrompt(e.target.value)}
              placeholder="Enter the system prompt for your bot"
              className="max-w-3xl w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={5}
            />
          </div>

          {/* Sample Answer for No Products */}
          <div className="pb-6">
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Sample Answer for No Products
            </label>
            <textarea
              value={sampleAnswerNoProducts}
              onChange={(e) => setSampleAnswerNoProducts(e.target.value)}
              placeholder="Enter a sample response when no products are available"
              className="max-w-3xl w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={2}
            />
          </div>

          {/* Save Button */}
          <div className="pt-4 border-t border-gray-200">
            <button
              onClick={handleSave}
              disabled={isLoadingUpdate || botName === personality.bot_name &&
                botPrompt === personality.bot_prompt &&
                sampleAnswerNoProducts === personality.sample_response
              }
              className="px-6 py-2 bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200"
            >
              <Loading isLoading={isLoadingUpdate} type="button" text="Saving..." theme="dark">
                Save Changes
              </Loading>
            </button>
          </div>
        </div>
      </div>
    </Loading>
  );
}

