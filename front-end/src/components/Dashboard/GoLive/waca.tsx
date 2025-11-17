"use client";
import { useEffect, useState } from "react";
import Link from 'next/link';
import { FaArrowLeft, FaArrowRight } from "react-icons/fa";
import { useApiCall } from "@/hooks/useApiCall";
import { integrationApi } from "@/services/apiService";
import { useNotification } from '@/contexts/NotificationContext';
import Loading from "@/components/Loading";
import { API_BASE } from "@/utils"

export type WACA = {
  "id": string;
  "company_id": string;
  "type": string;
  "is_active": boolean,
  "phone_number": string;
  "instance_name": string;
  "created_by": string;
  "delete": boolean,
  "created_at": string;
  "phone_number_id": string;
}

export default function WhatsAppConnectPage() {
  const [phoneNumberID, setPhoneNumberID] = useState("");
  const [integrationData, setIntegrationData] = useState<WACA | null>(null);;
  const [apiKey, setApiKey] = useState("");
  const { showNotification } = useNotification();
  const { isLoading: isSavingIntegration, execute: executeSaveIntegration } = useApiCall();

  const saveWacaIntegration = async () => {
    if (!phoneNumberID || !apiKey) {
      showNotification("Please enter phone number ID and API key", 'error', true);
      return;
    }
    const result = await executeSaveIntegration(async () => {
      return await integrationApi.new_waca(phoneNumberID, apiKey);
    });
    if (result.success) {
      setIntegrationData(result.data)
    } else {
      showNotification(result.message || 'Failed to connect to WACA', 'error', true);
    }
  }

  useEffect(() => {

  }, []);

  return (
    <section className="bg-white w-full px-4 sm:px-6 pt-1 md:pt-15 flex flex-col md:items-center md:justify-top overflow-auto">
      <div className="md:hidden mb-3 flex justify-between w-full md:w-[60%]">
        <Link
          href="/dashboard/go-live/status"
          className="flex items-center bg-gray-100 px-4 py-2 rounded-lg hover:bg-gray-200 text-sm w-fit">
          <FaArrowLeft />
          <span className="ml-2">BACK</span>
        </Link>
        <div>

        </div>
        {!integrationData && <button
          className="flex items-center mb-0 bg-gray-100 px-4 py-2 rounded-lg hover:bg-gray-200 text-sm font-medium w-fit"
          onClick={() => { saveWacaIntegration() }}
        >
          <Loading isLoading={isSavingIntegration} type="button" text="Connecting..." theme="light">
            <span className="mr-2">Next</span>
            <FaArrowRight />
          </Loading>
        </button>
        }
      </div>
      <div className="text-xl md:text-3xl font-semibold mb-10 text-center">{integrationData ? "Setup Callback URL":"Connect to WACA"}</div>
      <div className="flex flex-col md:flex-row gap-10 h-[80%] md:h-[60%]">
        {/* Instructions */}
        <div className="flex flex-col space-y-4 max-w-2xl md:text-base overflow-auto md:w-[60%]">
          {integrationData ?
            <div className="text-gray-700 space-y-6 text-md">
              {/* Step 1 */}
              <div>
                <h3 className="font-semibold text-base mb-2">Step 1 — Open Meta Developers Portal</h3>
                <ol className="list-decimal list-inside space-y-1 ml-2">
                  <li>Go to 👉 <a href="https://developers.facebook.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">https://developers.facebook.com</a></li>
                  <li>Log in and select your app connected to the WhatsApp Business Account.</li>
                  <li>From the left menu, go to <span className="font-medium">{`"WhatsApp"`}</span> → <span className="font-medium">{`"Configuration"`}</span>.</li>
                </ol>
              </div>

              {/* Step 2 */}
              <div>
                <h3 className="font-semibold text-base mb-2">🌐 Step 2 — Set Your Webhook (Callback URL)</h3>
                <ol className="list-decimal list-inside space-y-1 ml-2">
                  <li>Scroll to the <span className="font-medium">{`"Webhook"`}</span> section.</li>
                  <li>Click <span className="font-medium">{`"Edit"`}</span> beside Callback URL.</li>
                  <li>Enter your endpoint URL.</li>
                  <li>Enter a <span className="font-medium">Verify Token</span> (any string you choose — must match your server).</li>
                  <li>Click <span className="font-medium">Verify and Save</span>.</li>
                </ol>
              </div>

              {/* Step 3 */}
              <div>
                <h3 className="font-semibold text-base mb-2">📥 Step 3 — Subscribe to Webhook Events</h3>
                <ol className="list-decimal list-inside space-y-1 ml-2">
                  <li>Still inside the Webhook section, click <span className="font-medium">{`"Manage"`}</span>.</li>
                  <li>Enable important events like:
                    <ul className="list-disc list-inside ml-5 mt-1 space-y-1">
                      <li><span className="font-medium">messages</span></li>
                      <li><span className="font-medium">message_status</span></li>
                      <li><span className="font-medium">message_template_status</span></li>
                    </ul>
                  </li>
                  <li>Save your changes.</li>
                </ol>
              </div>

              {/* Step 4 */}
              <div>
                <h3 className="font-semibold text-base mb-2">🧪 Step 4 — Test Your Callback URL</h3>
                <ol className="list-decimal list-inside space-y-1 ml-2">
                  <li>Use the <span className="font-medium">{`"Send Test Webhook Event"`}</span> button.</li>
                  <li>Check your server logs to verify the callback is received.</li>
                  <li>Ensure your server returns <span className="font-mono text-sm">200 OK</span> to confirm the webhook works.</li>
                </ol>
              </div>
            </div>
            : <div className="text-gray-700 space-y-6 text-md">
              {/* Step 1 */}
              <div>
                <h3 className="font-semibold text-base mb-2">Step 1 — Create a Meta Developer Account</h3>
                <ol className="list-decimal list-inside space-y-1 ml-2">
                  <li>Go to 👉 <a href="https://developers.facebook.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">https://developers.facebook.com</a></li>
                  <li>Log in with your Facebook account.</li>
                  <li>Click <span className="font-medium">{`"My Apps"`}</span> → <span className="font-medium">{`"Create App"`}</span>.</li>
                  <li>Choose <span className="font-medium">{`"Other"`}</span> → <span className="font-medium">{`"Business"`}</span> → Continue.</li>
                  <li>Give your app a name (e.g., WhatsAppAPIApp) and click Create App.</li>
                </ol>
              </div>

              {/* Step 2 */}
              <div>
                <h3 className="font-semibold text-base mb-2">💬 Step 2 — Add the WhatsApp Product</h3>
                <ol className="list-decimal list-inside space-y-1 ml-2">
                  <li>Inside your new app&apos;s dashboard:</li>
                  <li>Scroll down to <span className="font-medium">Add Product</span>.</li>
                  <li>Find <span className="font-medium">{`"WhatsApp"`}</span> → click <span className="font-medium">Set Up</span>.</li>
                  <li>You&apos;ll be redirected to the WhatsApp &gt; Getting Started page.</li>
                </ol>
              </div>

              {/* Step 3 */}
              <div>
                <h3 className="font-semibold text-base mb-2">📱 Step 3 — Link a Phone Number</h3>
                <ol className="list-decimal list-inside space-y-1 ml-2">
                  <li>In the {`"Getting Started"`} page:</li>
                  <li>Under <span className="font-medium">{`"From"`}</span>, you&apos;ll see a temporary test phone number provided by Meta (you can use this for testing).</li>
                  <li>Later, you can add your own business number (must not be linked to a normal WhatsApp app).</li>
                  <li>Your <span className="font-medium">Phone Number ID</span> is displayed in that same section:
                    <div className="ml-4 mt-1 text-sm text-gray-600">Example: Phone Number ID: 123456789012345</div>
                  </li>
                  <li>Copy this — you&apos;ll use it in your API calls.</li>
                </ol>
              </div>

              {/* Step 4 */}
              <div>
                <h3 className="font-semibold text-base mb-2">🔑 Step 4 — Get Your Access Token (API Key)</h3>
                <div className="space-y-2 ml-2">
                  <p>In the same {`"Getting Started"`} page:</p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>You&apos;ll see a <span className="font-medium">{`"Temporary Access Token"`}</span> — copy it for quick testing.
                      <div className="ml-4 mt-1 text-sm text-amber-600">⚠️ It expires after 24 hours.</div>
                    </li>
                  </ul>

                  <p className="font-medium mt-3">To create a Permanent (System User) Token:</p>
                  <ol className="list-decimal list-inside space-y-1 ml-2">
                    <li>Go to <span className="font-medium">Meta Business Settings</span></li>
                    <li>Navigate to <span className="font-medium">Users</span> → <span className="font-medium">System Users</span> → <span className="font-medium">Add</span></li>
                    <li>Create a System User (role: Admin).</li>
                    <li>Under <span className="font-medium">Assets</span>, assign your app and WhatsApp account permissions.</li>
                    <li>Under <span className="font-medium">Generate New Token</span>, select your app → choose <span className="font-mono text-sm">whatsapp_business_messaging</span>, <span className="font-mono text-sm">whatsapp_business_management</span> permissions → generate.</li>
                    <li>This gives you a long-lived access token (your API key).</li>
                  </ol>
                </div>
              </div>
            </div>
          }
        </div>
        {/* QR Code */}
        {integrationData ?
          <div className="mt-6 md:mt-0 flex flex-col md:w-[40%]">
            <h3 className="font-semibold text-base mb-2">
              Endpoint CallBack URL
            </h3>
            <div className="border rounded px-3 py-2">{API_BASE}/waca/{integrationData?.phone_number_id}/webhook</div>
            <h3 className="font-semibold text-base mt-6 mb-2">
              API Key
            </h3>
            <div className="border rounded px-3 py-2">{integrationData?.id}</div>
          </div> :
          <div className="mt-6 md:mt-0 flex flex-col md:w-[40%]">
            <label>
              Phone Number ID
            </label>
            <input
              type="text"
              className="border rounded px-3 py-2"
              onChange={(e) => { setPhoneNumberID(e.target.value) }}
              required
            />
            <label>
              API Key
            </label>
            <textarea
              className="border rounded px-3 py-2" rows={6}
              onChange={(e) => { setApiKey(e.target.value) }}
              required
            />
          </div>
        }

      </div>
      <div className="flex justify-between w-full md:w-[60%]">
        <div className="py-3 hidden md:block">
          <Link
            href="/dashboard/go-live/status"
            className="flex items-center mb-0 bg-gray-100 px-4 py-2 rounded-lg hover:bg-gray-200 text-sm font-medium w-fit">
            <FaArrowLeft />
            <span className="ml-2">BACK</span>
          </Link>
        </div>
        <div className="py-3 hidden md:block">
          {
            !integrationData && <button
              className="flex items-center mb-0 bg-gray-100 px-4 py-2 rounded-lg hover:bg-gray-200 text-sm font-medium w-fit"
              onClick={() => { saveWacaIntegration() }}
            >
              <Loading isLoading={isSavingIntegration} type="button" text="Connecting..." theme="light">
                <span className="mr-2">Next</span>
                <FaArrowRight />
              </Loading>
            </button>
          }
        </div>
      </div>
    </section>
  );
}
