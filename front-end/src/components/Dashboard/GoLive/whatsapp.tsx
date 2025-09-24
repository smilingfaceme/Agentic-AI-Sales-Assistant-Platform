"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { FaSyncAlt, FaWhatsapp } from "react-icons/fa";
import { useApiCall } from "@/hooks/useApiCall";
import { useAppContext } from "@/contexts/AppContext";
import { whatsappApi } from "@/services/apiService";
import QRCode from "qrcode" // ✅ use qrcode package (not qrcode-terminal)

export default function WhatsAppConnectPage() {
  const { projectId } = useAppContext();
  const { execute } = useApiCall();
  const [qr, setQr] = useState("");
  const [status, setStatus] = useState(true);
  const [whatsappinfo, setWhatsappinfo] = useState({ nmuber: "" });
  const [enabled, setEnabled] = useState(true);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const connectWhatsapp = useCallback(async () => {
    if (projectId) {
      const result = await execute(async () => {
        return await whatsappApi.connect(projectId);
      });

      if (result && result.response) {
        if (result.response.message === "Scan QR") {
          setStatus(false)
          setQr(result.response.qr);
        } else if (result.response.message === "Bot connected") {
          setStatus(true)
          setEnabled(true)
          const number = result.response.user.id.split(':')[0];
          setWhatsappinfo({ nmuber: number });
        } else if (result.response.message === "Bot stopped") {
          setStatus(true)
          setEnabled(false)
          const number = result.response.user.id.split(':')[0];
          setWhatsappinfo({ nmuber: number });
        }
      }
    }
  }, [projectId, execute]);

  const setEnabledConnectWhatsapp = useCallback(async () => {
    const result = await execute(async () => {
      if (enabled) {
        return await whatsappApi.stop(projectId);
      } else {
        return await whatsappApi.start(projectId);
      }
    });

    if (result && result.response) {
      if (result.response.success === true) {
        setEnabled(!enabled)
      }
    }
  }, [projectId, execute, enabled]);

  const logoutConnectWhatsapp = useCallback(async () => {
    const result = await execute(async () => {
      return await whatsappApi.logout(projectId);
    });

    if (result && result.response) {
      if (result.response.success === true) {
        setStatus(false)
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

  // ✅ Generate QR inside canvas
  useEffect(() => {
    if (qr && canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, qr, { width: 300 }, (err) => {
        if (err) console.error("QR Code error: ", err);
      });
    }
  }, [qr]);

  return (
    <section className="bg-white w-full px-4 sm:px-6 py-6 pt-15 flex flex-col md:items-center md:justify-top">
      {status ?
        <>
          <div className="text-xl font-semibold mb-10 text-center">Your WhatsApp account is connected</div>
          <div className="w-full max-w-2xl">
            <div className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3 shadow-sm">
              {/* Left Section */}
              <div className="flex items-center gap-3">
                {/* <ChevronDown className="w-5 h-5 text-gray-500" /> */}
                <FaWhatsapp size={30} className="text-green-500" />
                <div className="flex flex-col">
                  <span className="text-md font-semibold text-gray-900">
                    +19202599368
                  </span>
                </div>
                <button
                  className="rounded-md border border-gray-300 px-3 py-1 text-sm text-gray-700 hover:bg-gray-100"
                  onClick={logoutConnectWhatsapp}
                >
                  Logout
                </button>
              </div>
              {/* Right Toggle */}
              <div
                onClick={setEnabledConnectWhatsapp}
                className={`relative inline-flex h-6 w-11 items-center rounded-full cursor-pointer transition-colors ${enabled ? "bg-green-600" : "bg-gray-300"}`}
              >
                <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${enabled ? "translate-x-6" : "translate-x-1"}`} />
              </div>
            </div>
          </div>
        </> :
        <>
          <div className="text-xl md:text-3xl font-semibold mb-10 text-center">Connect your WhatsApp account</div>
          <div className="flex flex-col md:flex-row gap-10">
            {/* Instructions */}
            <div className="space-y-4 max-w-md md:text-lg">
              <ol className="list-decimal list-inside text-gray-700 space-y-2">
                <li>Open WhatsApp on your phone</li>
                <li>
                  Tap on <span className="font-medium">Menu</span> in Android or{" "}
                  <span className="font-medium">Settings</span> in iPhone
                </li>
                <li>
                  Tap on <span className="font-medium">Linked devices</span> and link a device
                </li>
                <li>Point your phone at the screen to capture the QR code</li>
              </ol>
            </div>

            {/* QR Code */}
            <div className="mt-6 md:mt-0 flex flex-col items-center">
              <div className="p-2 border rounded-lg shadow-sm">
                <canvas ref={canvasRef}></canvas>
              </div>
              <button
                onClick={connectWhatsapp}
                className="mt-3 px-4 py-2 rounded-md bg-gray-100 hover:bg-gray-200 text-sm font-medium flex items-center space-x-2"
              >
                <FaSyncAlt />
                <span>Refresh QR Code</span>
              </button>
            </div>
          </div>
        </>
      }
    </section>
  );
}
