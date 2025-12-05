"use client";
import { useState, useEffect, useCallback } from "react";
import { FaWhatsappSquare, FaTimes, FaCopy, FaCheck } from "react-icons/fa";
import { useApiCall } from "@/hooks/useApiCall";
import { integrationApi } from "@/services/apiService";
import Loading from '@/components/Loading';
import { API_BASE } from "@/utils";

type Integration = {
  "id": string,
  "company_id": string,
  "type": string,
  "is_active": boolean,
  "phone_number": string,
  'phone_number_id': string,
  'waba_id': string,
  "created_at": string,
  "instance_name": string,
  "created_by": string,
  "created_by_name": string,
  "created_by_email": string,
}


export default function GoLiveStatusPage() {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [activeLoading, setActiveLoading] = useState<Record<string, boolean>>({});
  const [logoutLoading, setLogoutLoading] = useState<Record<string, boolean>>({});
  const [showModal, setShowModal] = useState<Integration | null>()
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const { isLoading: isLoadingIntegrations, execute: executeLoadIntegrations } = useApiCall();
  const { execute } = useApiCall();

  const copyToClipboard = async (text: string, fieldName: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const connectWhatsapp = useCallback(async () => {
    const result = await executeLoadIntegrations(async () => {
      return await integrationApi.get();
    });

    if (result && result.integrations) {
      const initialLoading = result.integrations.reduce((acc: Record<string, boolean>, item: Integration) => {
        acc[item.id] = false;
        return acc;
      }, {} as Record<string, boolean>);
      setActiveLoading(initialLoading);
      setIntegrations(result.integrations)
    }
  }, [executeLoadIntegrations]);

  const activeWhatsApp = useCallback(async (integrationId: string) => {
    setActiveLoading({ ...activeLoading, [integrationId]: true })
    await execute(async () => {
      return await integrationApi.active(integrationId);
    });
    connectWhatsapp();
    setActiveLoading({ ...activeLoading, [integrationId]: false })
  }, [execute, connectWhatsapp, activeLoading]);

  const logoutWhatsApp = useCallback(async (integrationId: string) => {
    setLogoutLoading({ ...logoutLoading, [integrationId]: true })
    await execute(async () => {
      return await integrationApi.logout(integrationId);
    });
    connectWhatsapp();
    setLogoutLoading({ ...logoutLoading, [integrationId]: false })
    setShowModal(null)
  }, [execute, connectWhatsapp, logoutLoading]);

  useEffect(() => {
    connectWhatsapp()
  }, [connectWhatsapp]);

  return (
    <Loading isLoading={isLoadingIntegrations} size="large" type="inline" theme="primary" text="Loading Integrations Info ..." className="mt-6 min-h-[300px]">
      <section className="bg-white w-full px-2 sm:px-6 py-6 flex md:items-baseline">
        <div className="flex flex-col md:flex-row gap-6 md:gap-8 px-2 sm:px-4 py-4 md:py-8 m-auto md:m-0">
          {integrations.map((item) => (
            <>
              <div className="border border-gray-300 rounded-xl bg-white flex flex-col shadow-sm m-0 md:w-fit min-w-[350px] w-full">
                <div className="pt-4 px-4 pb-3">
                  <div className="flex items-center justify-between w-full mb-4 gap-2">
                    <div className="flex items-center">
                      <FaWhatsappSquare size={35} color="green" />
                      {item.type == "whatsapp_web"
                        ? <span className="text-lg font-semibold ml-2">WhatsApp</span>
                        : <span className="text-lg font-semibold ml-2">WACA</span>
                      }

                    </div>
                    <button
                      className={`border border-gray-500 relative inline-flex h-6 w-11 items-center rounded-full transition ${item.is_active ? "bg-gray-800" : "bg-gray-100"
                        }`}
                      onClick={() => activeWhatsApp(item.id)}
                      disabled={activeLoading[item.id] ?? false}
                    >
                      <Loading isLoading={activeLoading[item.id] ?? false} type="button" size="small" theme="primary" text="">
                        <span
                          className={`inline-block h-5 w-5 transform rounded-full border border-gray-500 bg-gray-300 transition ${item.is_active ? "translate-x-6" : "translate-x-0"
                            }`}
                        />
                      </Loading>
                    </button>
                  </div>
                  <span className="text-base mb-2"><span className="font-semibold">Phone Number: </span> +{item.phone_number}</span>
                </div>
                <div className="flex flex-col rounded-bl-xl rounded-br-xl sm:flex-row items-center justify-end w-full bg-gray-100 px-4 py-2 sm:px-5 sm:py-3 gap-2">
                  <button
                    className={`relative inline-flex items-center px-3 py-1 bg-white rounded-lg border border-gray-400 hover:bg-gray-100 text-xs sm:text-sm`}
                    onClick={() => setShowModal(item)}
                    disabled={logoutLoading[item.id] ?? false}
                  >
                    View Details
                  </button>
                </div>
              </div>
            </>
          ))}
        </div>
        {/* Modal */}
        <div
          className={`fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-end z-50 transition-all duration-300 ${showModal ? "opacity-100 visible" : "opacity-0 invisible"
            }`}
          onClick={() => setShowModal(null)}
        >
          <div
            className={`w-full md:w-[450px] lg:w-[500px] h-full bg-white shadow-2xl transform transition-transform duration-300 ease-out flex flex-col ${showModal ? "translate-x-0" : "translate-x-full"
              }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-6 py-4 flex items-center justify-between border-b border-gray-200 bg-gradient-to-r from-green-50 to-white">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-lg shadow-sm">
                  <FaWhatsappSquare size={28} className="text-green-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">
                    {showModal?.type === "whatsapp_web" ? "WhatsApp Web" : "WhatsApp Cloud API"}
                  </h2>
                  <p className="text-xs text-gray-500">Integration Details</p>
                </div>
              </div>
              <button
                className="p-2 rounded-full hover:bg-gray-100 transition-colors duration-200 text-gray-500 hover:text-gray-700"
                onClick={() => setShowModal(null)}
                aria-label="Close modal"
              >
                <FaTimes size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 py-6">
              <div className="space-y-6">
                {/* Status Badge */}
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${showModal?.is_active
                      ? "bg-green-100 text-green-700 border border-green-200"
                      : "bg-gray-100 text-gray-700 border border-gray-200"
                    }`}>
                    {showModal?.is_active ? "● Active" : "○ Inactive"}
                  </span>
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                    {showModal?.type === "whatsapp_web" ? "Web Client" : "Cloud API"}
                  </span>
                </div>

                {/* Phone Number */}
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">
                    Phone Number
                  </label>
                  <p className="text-lg font-semibold text-gray-900">
                    +{showModal?.phone_number}
                  </p>
                </div>

                {/* Connection Info */}
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide">
                    Connection Information
                  </h3>

                  <div className="space-y-3">
                    <div className="flex flex-col">
                      <label className="text-xs font-medium text-gray-500 mb-1">
                        Connected At
                      </label>
                      <p className="text-sm text-gray-900">
                        {showModal?.created_at ? formatDate(showModal.created_at) : 'N/A'}
                      </p>
                    </div>

                    <div className="flex flex-col">
                      <label className="text-xs font-medium text-gray-500 mb-1">
                        Connected By
                      </label>
                      <p className="text-sm text-gray-900 font-medium">
                        {showModal?.created_by_name || 'N/A'}
                      </p>
                    </div>

                    <div className="flex flex-col">
                      <label className="text-xs font-medium text-gray-500 mb-1">
                        Owner&apos;s Email
                      </label>
                      <p className="text-sm text-gray-900">
                        {showModal?.created_by_email || 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* API Configuration (only for WACA) */}
                {showModal?.type === "whatsapp_api" && (
                  <div className="space-y-4 pt-4 border-t border-gray-200">
                    <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide">
                      API Configuration
                    </h3>

                    {/* Callback URL */}
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                        Webhook URL
                      </label>
                      <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-3 border border-gray-200">
                        <code className="flex-1 text-xs text-gray-800 break-all font-mono">
                          {`${API_BASE}/waca/${showModal.phone_number_id}/webhook`}
                        </code>
                        <button
                          onClick={() => copyToClipboard(`${API_BASE}/waca/${showModal.phone_number_id}/webhook`, 'webhook')}
                          className="p-2 hover:bg-gray-200 rounded transition-colors duration-200 flex-shrink-0"
                          title="Copy to clipboard"
                        >
                          {copiedField === 'webhook' ? (
                            <FaCheck className="text-green-600" size={14} />
                          ) : (
                            <FaCopy className="text-gray-600" size={14} />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* API Key */}
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                        API Key
                      </label>
                      <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-3 border border-gray-200">
                        <code className="flex-1 text-xs text-gray-800 break-all font-mono">
                          {showModal.id}
                        </code>
                        <button
                          onClick={() => copyToClipboard(showModal.id, 'apikey')}
                          className="p-2 hover:bg-gray-200 rounded transition-colors duration-200 flex-shrink-0"
                          title="Copy to clipboard"
                        >
                          {copiedField === 'apikey' ? (
                            <FaCheck className="text-green-600" size={14} />
                          ) : (
                            <FaCopy className="text-gray-600" size={14} />
                          )}
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Keep this key secure. Do not share it publicly.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => showModal?.id && logoutWhatsApp(showModal.id)}
                className="w-full px-4 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors duration-200 font-medium text-sm"
              >
                <Loading isLoading={showModal?.id ? logoutLoading[showModal.id] ?? false : false} type="button" size="small" theme="light" text="Logging out...">
                  Logout
                </Loading>
              </button>
            </div>
          </div>
        </div>
      </section>
    </Loading>
  );
}
