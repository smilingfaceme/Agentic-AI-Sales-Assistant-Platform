"use client";
import { useState, useEffect, useCallback } from "react";
import { FaWhatsappSquare, FaCheckCircle } from "react-icons/fa";
import Link from 'next/link';
import { useApiCall } from "@/hooks/useApiCall";
import { useAppContext } from '@/contexts/AppContext';
import { whatsappApi } from "@/services/apiService";

export default function GoLiveStatusPage() {
  const { projectId } = useAppContext();
  const [whatsappConnected, setWhatsappConnected] = useState(false);
  const [whatsappActive, setWhatsappActive] = useState(false);
  const [wacaConnected, setWacaConnected] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const { execute } = useApiCall();

  const connectWhatsapp = useCallback(async () => {
    if (projectId) {
      const result = await execute(async () => {
        return await whatsappApi.connect(projectId);
      });

      if (result && result.response) {
        if (result.response.message === "Scan QR") {
          setWhatsappConnected(false)
          setWhatsappActive(false)
        } else if (result.response.message === "Bot connected") {
          setWhatsappConnected(true)
          setWhatsappActive(true)
        } else if (result.response.message === "Bot stopped") {
          setWhatsappConnected(true)
          setWhatsappActive(false)
        }
      }
    }

  }, [projectId, execute]);

  useEffect(() => {
    // ✅ Run every 2 seconds, and cleanup properly
    const interval = setInterval(() => {
      console.log("⏰ Interval running...");
      connectWhatsapp();
    }, 2000);

    return () => clearInterval(interval); // cleanup on unmount
  }, [connectWhatsapp]);

  return (
    <section className="bg-white w-full px-2 sm:px-6 py-6 flex md:items-baseline">
      <div className="flex flex-col md:flex-row gap-6 md:gap-8 w-full max-w-4xl px-2 sm:px-4 py-4 md:py-8">
        {/* Blocker 1 */}
        <div className="border border-gray-300 rounded-xl bg-white flex flex-col shadow-sm m-0 flex-1 min-w-[260px] max-w-full">
          <div className="pt-4 px-4 pb-3">
            <div className="flex items-center justify-between w-full mb-4 gap-2">
              <FaWhatsappSquare size={35} color="green" />
              {whatsappConnected && <button
                onClick={() => setWhatsappActive(!enabled)}
                className={`border border-gray-500 relative inline-flex h-6 w-11 items-center rounded-full transition ${whatsappActive ? "bg-gray-800" : "bg-gray-100"
                  }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full border border-gray-500 bg-white transition ${whatsappActive ? "translate-x-6" : "translate-x-0"
                    }`}
                />
              </button>}
            </div>
            <span className="text-base sm:text-lg font-semibold mb-2">Connect to WhatsApp</span>
            <p className="text-gray-600 text-sm sm:text-base">Configure your chatbot settings, get login QR code and go live.</p>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-between w-full bg-gray-100 px-4 py-2 sm:px-5 sm:py-3 gap-2">
            <div className="flex items-center text-sm sm:text-base">
              {whatsappConnected && (<>
                <FaCheckCircle size={22} />
                <span className="pl-2">Account connected</span>
              </>
              )}
            </div>
            <Link
              href="/dashboard/go-live/whatsapp"
              className={`relative inline-flex items-center px-3 py-1 bg-white rounded-lg border border-gray-400 hover:bg-gray-100 text-xs sm:text-sm`}
            >
              {whatsappConnected && "View" || 'Connect'}
            </Link>
          </div>
        </div>
        {/* Blocker 2 */}
        {/* <div className="border border-gray-300 rounded-xl bg-white flex flex-col shadow-sm m-0 flex-1 min-w-[260px] max-w-full mt-6 md:mt-0">
          <div className="pt-4 px-4 pb-3">
            <div className="flex items-center justify-between w-full mb-4 gap-2">
              <FaWhatsappSquare size={35} color="green" />
              {wacaConnected && <button
                onClick={() => setEnabled(!enabled)}
                className={`border border-gray-500 relative inline-flex h-6 w-11 items-center rounded-full transition ${enabled ? "bg-gray-800" : "bg-gray-100"
                  }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full border border-gray-500 bg-white transition ${enabled ? "translate-x-6" : "translate-x-0"
                    }`}
                />
              </button>}
            </div>
            <span className="text-base sm:text-lg font-semibold mb-2">Connect to WACA</span>
            <p className="text-gray-600 text-sm sm:text-base">Configure your chatbot settings, login Facebook and go live.</p>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-between w-full bg-gray-100 px-4 py-2 sm:px-5 sm:py-3 gap-2">
            {wacaConnected ? <>
              <div className="flex items-center text-sm sm:text-base">
                <FaCheckCircle size={22} />
                <span className="pl-2">Account connected</span>
              </div>
              <button className={`relative inline-flex items-center px-3 py-1 bg-white rounded-lg border border-gray-400 hover:bg-gray-100 text-xs sm:text-sm`}>
                View
              </button>
            </> : <>
              <div></div>
              <button className={`relative inline-flex items-center px-3 py-1 bg-white rounded-lg border border-gray-400 hover:bg-gray-100 text-xs sm:text-sm`}>
                Connect
              </button></>}
          </div>
        </div> */}
      </div>
    </section>
  );
}
