"use client";
import { useState, useEffect, useCallback } from "react";
import { FaWhatsappSquare } from "react-icons/fa";
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
}


export default function GoLiveStatusPage() {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [activeLoading, setActiveLoading] = useState<Record<string, boolean>>({});
  const [logoutLoading, setLogoutLoading] = useState<Record<string, boolean>>({});
  const [hiddenDetails, setHiddenDetails] = useState<Record<string, boolean>>({});
  const { isLoading: isLoadingIntegrations, execute: executeLoadIntegrations } = useApiCall();
  const { execute } = useApiCall();

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
      setHiddenDetails(initialLoading)
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
  }, [execute, connectWhatsapp, logoutLoading]);


  useEffect(() => {
    connectWhatsapp()
  }, [connectWhatsapp]);

  return (
    <Loading isLoading={isLoadingIntegrations} size="large" type="inline" theme="primary" text="Loading Integrations Info ..." className="mt-6 min-h-[300px]">
      <section className="bg-white w-full px-2 sm:px-6 py-6 flex md:items-baseline">
        <div className="flex flex-col md:flex-row gap-6 md:gap-8 w-full max-w-4xl px-2 sm:px-4 py-4 md:py-8">
          {integrations.map((item) => (
            <>
              <div className="border border-gray-300 rounded-xl bg-white flex flex-col shadow-sm m-0 flex-1 max-w-[480px]">
                <div className="pt-4 px-4 pb-3">
                  <div className="flex items-center justify-between w-full mb-4 gap-2">
                    <div className="flex items-center">
                      <FaWhatsappSquare size={35} color="green" />
                      {item.type == "whatsapp"
                        ? <span className="text-lg sm:text-xl font-semibold ml-2">WhatsApp</span>
                        : <span className="text-lg sm:text-xl font-semibold ml-2">WACA</span>
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
                  <div className="flex flex-col ">

                    <div className="flex justify-between gap-2">
                      <span className="text-base sm:text-lg mb-2"><span className="font-semibold">Phone Number:</span> +{item.phone_number}</span>
                      <button
                        className="px-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg text-sm"
                        onClick={() => setHiddenDetails({ ...hiddenDetails, [item.id]: !hiddenDetails[item.id] })}
                      >
                        Show Details
                      </button>
                    </div>

                  </div>
                  {hiddenDetails[item.id] && (
                    <div className="">
                      <table className="min-w-full text-sm text-gray-700 rounded">
                        <tbody>
                          <tr className="mt-2">
                            <td className="font-semibold w-1/3">Connected at</td>
                            <td className="">{new Date(item.created_at).toLocaleDateString()}</td>
                          </tr>
                          {item.phone_number_id && (
                            <>
                              <tr className="mt-2">
                                <td className="font-semibold w-1/3">Callback URL</td>
                                <td className="">{API_BASE}/waca/{item.phone_number_id}/webhook</td>
                              </tr>
                              <tr className="mt-1">
                                <td className="font-semibold w-1/3">API Key</td>
                                <td className="">{item.id}</td>
                              </tr>
                            </>
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                  {/* <table className="min-w-full text-sm text-gray-700 rounded">
                    <tbody>
                      <tr className="">
                        <td className="font-semibold w-1/3">Callback URL</td>
                        <td className="">{API_BASE}/waca/{item.phone_number_id}/webhook</td>
                      </tr>
                      <tr>
                        <td className="font-semibold w-1/3">API Key</td>
                        <td className="">{item.id}</td>
                      </tr>
                    </tbody>
                  </table> */}
                </div>
                <div className="flex flex-col rounded-bl-xl rounded-br-xl sm:flex-row items-center justify-end w-full bg-gray-100 px-4 py-2 sm:px-5 sm:py-3 gap-2">
                  <button
                    className={`relative inline-flex items-center px-3 py-1 bg-white rounded-lg border border-gray-400 hover:bg-gray-100 text-xs sm:text-sm`}
                    onClick={() => logoutWhatsApp(item.id)}
                    disabled={logoutLoading[item.id] ?? false}
                  >
                    <Loading isLoading={logoutLoading[item.id] ?? false} type="button" size="small" theme="light" text="Logging out...">
                      Logout
                    </Loading>
                  </button>
                </div>
              </div>
            </>
          ))}
        </div>
      </section>
    </Loading>
  );
}
