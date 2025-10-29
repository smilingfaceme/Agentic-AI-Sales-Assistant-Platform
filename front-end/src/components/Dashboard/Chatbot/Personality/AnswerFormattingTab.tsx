"use client";
import { useState, useEffect, useCallback } from "react";
import { FaCheck } from "react-icons/fa";
import { personalityAPI } from "@/services/apiService"
import { useApiCall } from "@/hooks/useApiCall";
import Loading from "@/components/Loading";
import { useNotification } from '@/contexts/NotificationContext';

type ResponseLength = 'Descriptive' | 'Medium' | 'Short';
type ChatbotTone = 'Matter of fact' | 'Friendly' | 'Humorous' | 'Neutral' | 'Professional';
type PreferredLanguage = 'English' | 'None';

export default function AnswerFormattingTab() {
  const { showNotification } = useNotification();

  const [personality, setPersonality] = useState({
    length_of_response: 'Medium',
    chatbot_tone: 'Professional',
    prefered_lang: 'English',
    use_emojis: false,
    use_bullet_points: false,
  });
  const [responseLength, setResponseLength] = useState<ResponseLength>('Medium');
  const [chatbotTone, setChatbotTone] = useState<ChatbotTone>('Professional');
  const [preferredLanguage, setPreferredLanguage] = useState<PreferredLanguage>('English');
  const [useEmojis, setUseEmojis] = useState(false);
  const [useBulletPoints, setUseBulletPoints] = useState(false);

  const { isLoading: isLoadingStatus, execute: executeStatusAsync } = useApiCall();
  const { isLoading: isLoadingUpdate, execute: executeUpdateAsync } = useApiCall();

  const handleSave = async () => {
    // TODO: Implement save functionality
    const updateData = {
      length_of_response: responseLength,
      chatbot_tone: chatbotTone,
      prefered_lang: preferredLanguage,
      use_emojis: useEmojis,
      use_bullet_points: useBulletPoints,
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
      setResponseLength(result.chatbot_personality.length_of_response);
      setChatbotTone(result.chatbot_personality.chatbot_tone);
      setPreferredLanguage(result.chatbot_personality.prefered_lang);
      setUseEmojis(result.chatbot_personality.use_emojis);
      setUseBulletPoints(result.chatbot_personality.use_bullet_points);
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
          {/* Length of Response */}
          <div className="border-b border-gray-200 pb-6">
            <label className="block text-sm font-semibold text-gray-900 mb-3">
              Length of Response
            </label>
            <div className="flex flex-wrap gap-3 text-sm">
              {(['Descriptive', 'Medium', 'Short'] as ResponseLength[]).map((option) => (
                <button
                  key={option}
                  className={responseLength === option
                    ? `flex items-center cursor-pointer border rounded-full px-2 py-0.5 border-gray-400 font-semibold`
                    : `flex items-center cursor-pointer border rounded-full px-2 py-0.5 border-gray-200`
                  }
                  onClick={() => setResponseLength(option as ResponseLength)}
                >
                  <span className="flex items-center gap-2 text-gray-650">{responseLength === option && <FaCheck />}{option}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Chatbot Tone */}
          <div className="border-b border-gray-200 pb-6">
            <label className="block text-sm font-semibold text-gray-900 mb-3">
              Chatbot Tone
            </label>
            <div className="flex flex-wrap gap-3 text-sm">
              {(['Matter of fact', 'Friendly', 'Humorous', 'Neutral', 'Professional'] as ChatbotTone[]).map((option) => (
                <button
                  key={option}
                  className={chatbotTone === option
                    ? `flex items-center cursor-pointer border rounded-full px-2 py-0.5 border-gray-400 font-semibold`
                    : `flex items-center cursor-pointer border rounded-full px-2 py-0.5 border-gray-200`
                  }
                  onClick={() => setChatbotTone(option as ChatbotTone)}
                >
                  <span className="flex items-center gap-2 text-gray-650">{chatbotTone === option && <FaCheck />}{option}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Preferred Language */}
          <div className="border-b border-gray-200 pb-6">
            <label className="block text-sm font-semibold text-gray-900 mb-3">
              Preferred Language
            </label>
            <div className="flex flex-wrap gap-3 text-sm">
              {(['English', 'None'] as PreferredLanguage[]).map((option) => (
                <button
                  key={option}
                  className={preferredLanguage === option
                    ? `flex items-center cursor-pointer border rounded-full px-2 py-0.5 border-gray-400 font-semibold`
                    : `flex items-center cursor-pointer border rounded-full px-2 py-0.5 border-gray-200`
                  }
                  onClick={() => setPreferredLanguage(option as PreferredLanguage)}
                >
                  <span className="flex items-center gap-2 text-gray-650">{preferredLanguage === option && <FaCheck />}{option}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Use Emojis */}
          <div className="border-b border-gray-200 pb-6">
            <div className="flex gap-9 text-sm">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={useEmojis}
                  onChange={(e) => setUseEmojis(e.target.checked)}
                  className="w-4 h-4 text-gray-600 rounded cursor-pointer"
                />
                <span className="ml-3 text-sm font-semibold text-gray-900">Use Emojis</span>
              </label>

              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={useBulletPoints}
                  onChange={(e) => setUseBulletPoints(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded cursor-pointer"
                />
                <span className="ml-3 text-sm font-semibold text-gray-900">Use Bullet Points</span>
              </label>
            </div>

          </div>

          {/* Save Button */}
          <div className="pt-4 border-t border-gray-200">
            <button
              onClick={handleSave}
              disabled={isLoadingUpdate || responseLength === personality.length_of_response &&
                chatbotTone === personality.chatbot_tone &&
                preferredLanguage === personality.prefered_lang &&
                useEmojis === personality.use_emojis &&
                useBulletPoints === personality.use_bullet_points
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

