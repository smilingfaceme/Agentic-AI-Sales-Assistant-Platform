"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import Link from 'next/link';
import { useRouter } from "next/navigation";
import { FaSyncAlt, FaArrowLeft } from "react-icons/fa";
import { useApiCall } from "@/hooks/useApiCall";
import { integrationApi } from "@/services/apiService";
import QRCode from "qrcode" // ✅ use qrcode package (not qrcode-terminal)

export default function WhatsAppConnectPage() {
  const router = useRouter();
  const { execute } = useApiCall();
  const [qr, setQr] = useState("");
  const [instanceName, setInstanceName] = useState("");

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const connectWhatsapp = useCallback(async () => {
    const result = await execute(async () => {
      return await integrationApi.new(instanceName);
    });

    if (result && result.response) {
      setInstanceName(result.response.instanceName)
      if (result.response.message === "Scan QR") {
        setQr(result.response.qr);
      } else if (result.response.message === "Bot connected") {
        router.push("/dashboard/go-live/status")
      }
    }
  }, [instanceName, router, execute]);

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
    <section className="bg-white w-full px-4 sm:px-6 pt-1 md:pt-15 flex flex-col md:items-center md:justify-top">
      <div className="md:hidden mt-auto mb-3">
        <Link 
          href="/dashboard/go-live/status"
          className="flex items-center bg-gray-100 px-4 py-2 rounded-lg hover:bg-gray-200 text-sm w-fit">
          <FaArrowLeft />
          <span className="ml-2">BACK</span>
        </Link>
      </div>
      <div className="text-xl md:text-3xl font-semibold mb-10 text-center">Connect your WhatsApp account</div>
      <div className="flex flex-col md:flex-row gap-10">
        {/* Instructions */}
        <div className="flex flex-col space-y-4 max-w-md md:text-lg h-full">
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

          <div className="mt-auto mb-0 hidden md:block">
            <Link 
            href="/dashboard/go-live/status"
            className="flex items-center mb-0 bg-gray-100 px-4 py-2 rounded-lg hover:bg-gray-200 text-sm font-medium w-fit">
              <FaArrowLeft />
              <span className="ml-2">BACK</span>
            </Link>
          </div>
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
      
    </section>
  );
}
