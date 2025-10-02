"use client";
import { useState, useEffect, useCallback } from "react";
import { FaWhatsappSquare } from "react-icons/fa";
import { useApiCall } from "@/hooks/useApiCall";
import { integrationApi } from "@/services/apiService";
import Loading from '@/components/Loading';

type Integration = {
  "id": string,
  "company_id": string,
  "type": string,
  "is_active": boolean,
  "phone_number": string,
  "created_at": string,
  "instance_name": string,
  "created_by": string,
  "created_by_name": string,
}


export default function GoLiveStatusPage() {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [activeLoading, setActiveLoading] = useState<Record<string, boolean>>({});
  const [logoutLoading, setLogoutLoading] = useState<Record<string, boolean>>({});

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
    <Loading isLoading={isLoadingIntegrations} size="large"  type="inline" theme="primary" text="Loading Integrations Info ..." className="mt-6 min-h-[300px]">
      <section className="bg-white w-full px-2 sm:px-6 py-6 flex md:items-baseline">
        <div className="flex flex-col md:flex-row gap-6 md:gap-8 w-full max-w-4xl px-2 sm:px-4 py-4 md:py-8">
          {integrations.map((item) => (
            <>
              <div className="border border-gray-300 rounded-xl bg-white flex flex-col shadow-sm m-0 flex-1 max-w-[450px]">
                <div className="pt-4 px-4 pb-3">
                  <div className="flex items-center justify-between w-full mb-4 gap-2">
                    <div className="flex items-center">
                      <FaWhatsappSquare size={35} color="green" />
                      <span className="text-lg sm:text-xl font-semibold ml-2">+ {item.phone_number}</span>
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
                  <span className="text-base sm:text-lg mb-2">Connected by {item.created_by_name} - {new Date(item.created_at).toLocaleDateString()}</span>
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
