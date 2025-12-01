"use client";
import React, { useState, useEffect, useCallback } from "react";
import { FaUserFriends, FaSync, FaEdit, FaTimes, FaRegComments } from "react-icons/fa";
import Table, { TableAction } from '@/components/Table';
import Loading from '@/components/Loading';
import { useApiCall } from '@/hooks/useApiCall';
import { customerApi } from '@/services/apiService';
import { useChatAreaContext } from '@/contexts/ChatAreaContext';
import { useAppContext } from '@/contexts/AppContext';
import { Conversation } from '@/contexts/ChatContext';
import ChatArea from "@/components/Dashboard/ChatArea/ChatArea";
import CustomerEditPage from "@/components/Dashboard/Customer/customerSetting";

interface Conversation_with_agent {
  conversation_id: string;
  conversation_name: string;
  source: string;
  phone_number: string;
  instance_name: string;
  created_at: string;
  ai_reply:boolean;
  agent_id: string;
  agent_name: string,
  agent_email: string,
}

interface Customer {
  customer_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  conversations: Conversation_with_agent[];
}

export default function CustomerPage() {
  // State
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showConversation, setShowConversation] = useState(false);
  const [selectConversation, setSelectedConversation] = useState<Conversation | undefined>(undefined);
  const { setActiveChatHistory } = useChatAreaContext();
  const { sidebarHidden, setSidebarHidden } = useAppContext();


  // Loading and error states
  const { isLoading: isLoadingCustomers, error: customersError, execute: executeLoadCustomers } = useApiCall();
  const [deleteLoading, setDeleteLoading] = useState<Record<string, boolean>>({});

  // Table headers
  const tableHeaders = [
    "Name",
    "Email",
    "Phone",
    "Conversation",
    "Actions"
  ];

  // Fetch customers
  const fetchCustomers = useCallback(async () => {
    const result = await executeLoadCustomers(async () => {
      return await customerApi.getAllCustomers();
    });

    if (result) {
      setCustomers(result.customers || []);
      if (result.customers?.length) {
        const initialLoading = result.customers.reduce((acc: Record<string, boolean>, customer: Customer) => {
          acc[customer.customer_id] = false;
          return acc;
        }, {} as Record<string, boolean>);
        setDeleteLoading(initialLoading);
      }
    }
  }, [executeLoadCustomers]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  // Map customers to table data
  const tableData = customers.map((customer) => ({
    "Name": customer.customer_name || "-",
    "Email": customer.customer_email || "-",
    "Phone": customer.customer_phone || "-",
    "Conversation": customer.conversations.map((convo) => {
      return {
        // "Conversation ID": convo.conversation_id,
        "Whatsapp Number": convo.phone_number,
        "Whatsapp Name": convo.conversation_name,
        "Agent": `${convo.agent_name} (${convo.agent_email})`
      }
    }),
    // "Whatsapp Number": customer.conversations.map((convo) => convo.phone_number) || "-",
    // "Whatsapp Name": customer.conversations.map((convo) => convo.conversation_name)|| "-",
    // "Agent": customer.conversations.map((convo) => `${convo.agent_name} (${convo.agent_email})`) || "-",
    "Actions": customer.conversations.map((convo) => [
      {
        label: "",
        disabled: false,
        onClick: () => {
          setSelectedConversation({
            conversation_id: convo.conversation_id,
            conversation_name: convo.conversation_name,
            source: convo.source,
            phone_number: convo.phone_number,
            agent_id: convo.agent_id,
            ai_reply: false,
            started_at: convo.created_at,
            ended_at: null,
            customer_id: customer.customer_id
          })
          setShowModal(true);
        },
        className: "flex items-center px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors mr-1",
        icon: <><FaEdit className="mr-1" /> Edit</>
      },
      {
        label: "",
        disabled: deleteLoading[customer.customer_id] ?? false,
        onClick: () => {
          setActiveChatHistory({
            conversation_id: convo.conversation_id,
            conversation_name: convo.conversation_name,
            source: convo.source,
            ai_reply: convo.ai_reply
          });

          setShowConversation(true);
        },
        className: "flex items-center px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors",
        icon: <Loading isLoading={deleteLoading[customer.customer_id] ?? false} type="button" size="small" text="Deleting" theme="dark">
          <FaRegComments className="mr-1" /> Conversation
        </Loading>
      }] as TableAction[])
  }));

  console.log(tableData)
  return (
    <div className="flex flex-col h-full w-full bg-[#fafbfc]">
      {/* Header */}
      <header className="px-4 md:px-6 py-4 border-b border-gray-300 bg-white text-lg font-semibold flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Sidebar toggle only on mobile */}
          <button
            className="md:hidden bg-white border border-gray-300 rounded-full p-2 shadow-lg mr-2"
            onClick={() => setSidebarHidden(!sidebarHidden)}
            aria-label={sidebarHidden ? "Show sidebar" : "Hide sidebar"}
          >
            <FaUserFriends />
          </button>
          <span>Customer Management</span>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-4 md:p-6">
        <div className="space-y-6">
          {/* Top Section */}
          <div className="bg-white rounded-lg shadow-sm p-4 md:p-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
              <div>
                <h1 className="text-lg md:text-2xl font-bold text-gray-900 mb-2">Customers</h1>
                <p className="text-gray-600">Manage customer information and details.</p>
              </div>
            </div>
          </div>

          {/* Customers Table */}
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-4 md:p-6 border-b border-gray-200">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center">
                  <FaUserFriends className="text-blue-600 mr-2 text-lg" />
                  <h2 className="text-lg md:text-xl font-semibold text-gray-900">All Customers</h2>
                </div>
                <button
                  onClick={fetchCustomers}
                  disabled={isLoadingCustomers}
                  className="flex items-center justify-center px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-colors"
                >
                  <FaSync className={`mr-2 ${isLoadingCustomers ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
              </div>
            </div>

            <div className="p-4 md:p-6">
              {isLoadingCustomers ? (
                <div className="flex justify-center items-center py-12">
                  <Loading isLoading={true} text="Loading customers..." />
                </div>
              ) : customersError ? (
                <div className="text-center py-12 text-red-500">
                  Error loading customers: {customersError}
                </div>
              ) : (
                <Table
                  headers={tableHeaders}
                  data={tableData}
                  actionColumnKey={["Actions"]}
                  rowspanColumnKey={["Conversation"]}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add/Edit Customer Modal */}
      <div
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-end z-50 transition-all duration-300 ${showModal ? "opacity-100 visible" : "opacity-0 invisible"
          }`}
        onClick={() => {
          setShowModal(false);
        }}
      >
        <div
          className={`w-full md:w-[480px] lg:w-[520px] h-full bg-white shadow-2xl transform transition-transform duration-300 ease-out flex flex-col ${showModal ? "translate-x-0" : "translate-x-full"
            }`}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            className="absolute top-4 right-2 rounded-full hover:bg-gray-100 flex items-center justify-center w-10 h-10"
            onClick={() => setShowModal(false)}
          >
            <FaTimes />
          </button>
          <CustomerEditPage key={selectConversation?.conversation_id} conversation={selectConversation} />
        </div>
      </div>

      {/* Show Conversation History Modal */}
      <div
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-end z-50 transition-all duration-300 ${showConversation ? "opacity-100 visible" : "opacity-0 invisible"
          }`}
        onClick={() => {
          setShowConversation(false);
        }}
      >
        <div
          className={`w-full md:w-[45%] h-full bg-white shadow-2xl transform transition-transform duration-300 ease-out flex flex-col ${showConversation ? "translate-x-0" : "translate-x-full"
            }`}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            className="absolute top-4 right-2 rounded-full hover:bg-gray-100 flex items-center justify-center w-10 h-10"
            onClick={() => setShowConversation(false)}
          >
            <FaTimes />
          </button>
          <ChatArea />
        </div>
      </div>
    </div>
  );
}