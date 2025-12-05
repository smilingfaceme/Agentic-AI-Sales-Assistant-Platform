"use client";
import React, { useState, useEffect, useCallback } from "react";
import { useNotification } from '@/contexts/NotificationContext';
import Loading from '@/components/Loading';
import { useApiCall } from '@/hooks/useApiCall';
import { customerApi, userApi } from '@/services/apiService';
import { Conversation } from '@/contexts/ChatContext';
interface Agent {
  id: string;
  name: string;
  email: string;
}

interface Conversation_with_agent {
  conversation_id: string;
  conversation_name: string;
  source: string;
  phone_number: string;
  instance_name: string;
  created_at: string;
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

interface CustomerEditPageProps {
  conversation?: Conversation;
}

export default function CustomerEditPage({ conversation }: CustomerEditPageProps) {
  // State
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [agents, setAgents] = useState<Agent[]>([])
  const [useExistedCustomer, setUseExistedCustomer] = useState(false);
  const { showNotification } = useNotification();

  // Form State
  const [formData, setFormData] = useState({
    customer_id: "",
    customer_name: "",
    customer_email: "",
    customer_phone: "",
    conversation_id: conversation?.conversation_id || "",
    phone_number: conversation?.phone_number || "",
    conversation_name: conversation?.conversation_name || "",
    agent_id: conversation?.agent_id || "",
  });

  // Loading and error states
  const { isLoading: isLoadingCustomers, execute: executeLoadCustomers } = useApiCall();
  const { isLoading: isLoadingAgents, execute: executeLoadAgents } = useApiCall();
  const { isLoading: isSaving, execute: executeSave } = useApiCall();

  // Fetch customers
  const fetchActiveCustomer = useCallback(async () => {
    if (!conversation?.customer_id) return;
    const result = await executeLoadCustomers(async () => {
      return await customerApi.getCustomerById(conversation.conversation_id);
    });

    if (result) {
      setFormData({ ...result.customers[0] });
    }
  }, [executeLoadCustomers, conversation]);

  // Fetch customers
  const fetchCustomers = useCallback(async () => {
    const result = await executeLoadCustomers(async () => {
      return await customerApi.getAllCustomers();
    });

    if (result) {
      setCustomers(result.customers || []);
    }
  }, [executeLoadCustomers]);

  // Fetch agents (users with agent role)
  const fetchAgents = useCallback(async () => {
    const result = await executeLoadAgents(async () => {
      return await userApi.getUsersByRole('agent');
    });

    if (result && result.users) {
      setAgents(result.users);
    }
  }, [executeLoadAgents]);

  useEffect(() => {
    if (!conversation?.customer_id) {
      fetchCustomers();
    } else {
      fetchActiveCustomer();
    }
    fetchAgents();
  }, [fetchActiveCustomer, fetchAgents, fetchCustomers, conversation]);

  const handleCustomerChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const customer = customers.find((customer) => customer.customer_id === e.target.value);
    if (customer) {
      setFormData({
        ...formData,
        customer_id: customer.customer_id,
        customer_name: customer.customer_name,
        customer_email: customer.customer_email,
        customer_phone: customer.customer_phone,
      });
    }
  };

  // Handle save (create or update)
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.customer_name.trim()) {
      showNotification("Customer name is required", 'error', true);
      return;
    }

    const result = await executeSave(async () => {
      if (conversation?.customer_id) {
        return await customerApi.updateCustomer(conversation?.customer_id, formData);
      } else {
        return await customerApi.createCustomer(formData);
      }
    });

    if (result) {
      showNotification(
        conversation?.customer_id ? "Customer updated successfully" : "Customer created successfully",
        'success',
        true
      );
      resetForm();
    } else {
      showNotification(
        conversation?.customer_id ? "Failed to update customer" : "Failed to create customer",
        'error',
        true
      );
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      ...formData,
      customer_id: "",
      customer_name: "",
      customer_email: "",
      customer_phone: "",
    });
  };

  return (
    <>
      <Loading isLoading={isLoadingCustomers || isLoadingAgents} text="Loading..." type="inline">
        {/* Modal Header */}
        <div className="flex-shrink-0 px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-white">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-xl font-bold text-gray-900">
                {conversation?.customer_id ? "Edit Customer" : "Add New Customer"}
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                {conversation?.customer_id ? "Update customer information" : "Fill in the details to create a new customer"}
              </p>
            </div>
          </div>
        </div>

        {/* Modal Body - Scrollable Form */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {!conversation?.customer_id && (
            <div className="space-y-2 mb-1">
              <div className="flex justify-end items-center gap-2">
                <input
                  type="checkbox"
                  checked={useExistedCustomer}
                  onChange={(e) => {setUseExistedCustomer(e.target.checked); resetForm();}}
                  className="w-4 h-4 text-gray-600 rounded cursor-pointer"
                />
                <span className="text-sm font-semibold text-gray-900">Use Existed Customer</span>
              </div>
            </div>
          )}

          {(!conversation?.customer_id && useExistedCustomer) && (<div className="space-y-2 justify-end flex">
            {isLoadingCustomers ? (
              <div className="px-2 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 text-xs mb-2">
                Loading get existing customers...
              </div>
            ) : (
              <select
                value={formData.customer_id}
                onChange={handleCustomerChange}
                className="px-2 py-2 mb-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 disabled:bg-gray-50 disabled:text-gray-500 bg-white"
                disabled={isSaving}
              >
                <option value="">-- Select an Existed Customer --</option>
                {customers.map((customer) => (
                  <option key={customer.customer_id} value={customer.customer_id}>
                    {customer.customer_name}
                  </option>
                ))}
              </select>
            )}
            {agents.length === 0 && !isLoadingAgents && (
              <p className="text-xs text-gray-500 mt-1">
                No agents available. Please invite users with agent role first.
              </p>
            )}
          </div>)}

          <form onSubmit={handleSave} className="space-y-5" id="customer-form">
            {/* Customer Name */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                Customer Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.customer_name}
                onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 disabled:bg-gray-50 disabled:text-gray-500"
                placeholder="Enter customer name"
                required
                disabled={isSaving || useExistedCustomer}
              />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                Email Address
              </label>
              <input
                type="email"
                value={formData.customer_email}
                onChange={(e) => setFormData({ ...formData, customer_email: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 disabled:bg-gray-50 disabled:text-gray-500"
                placeholder="customer@example.com"
                disabled={isSaving || useExistedCustomer}
              />
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                Phone Number
              </label>
              <input
                type="tel"
                value={formData.customer_phone}
                onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 disabled:bg-gray-50 disabled:text-gray-500"
                placeholder="+1 (555) 000-0000"
                disabled={isSaving || useExistedCustomer}
              />
            </div>

            {/* Divider */}
            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center">
                <span className="px-3 bg-white text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Additional Information
                </span>
              </div>
            </div>

            {/* Conversation ID */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                WhatsApp Display Name
              </label>
              <input
                type="text"
                value={formData.conversation_name}
                onChange={(e) => setFormData({ ...formData, conversation_name: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 disabled:bg-gray-50 disabled:text-gray-500 font-mono text-sm"
                placeholder="Enter conversation ID"
                disabled={true}
              />
            </div>

            {/* Conversation ID */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                WhatsApp Phone Number
              </label>
              <input
                type="text"
                value={formData.phone_number}
                onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 disabled:bg-gray-50 disabled:text-gray-500 font-mono text-sm"
                placeholder="Enter conversation ID"
                disabled={true}
              />
            </div>

            {/* Agent Selection */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                Assign Agent
              </label>
              {isLoadingAgents ? (
                <div className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 text-sm">
                  Loading agents...
                </div>
              ) : (
                <select
                  value={formData.agent_id}
                  onChange={(e) => setFormData({ ...formData, agent_id: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 disabled:bg-gray-50 disabled:text-gray-500 bg-white"
                  disabled={isSaving || useExistedCustomer}
                >
                  <option value="">-- Select an Agent --</option>
                  {agents.map((agent) => (
                    <option key={agent.id} value={agent.id}>
                      {agent.name} ({agent.email})
                    </option>
                  ))}
                </select>
              )}
              {agents.length === 0 && !isLoadingAgents && (
                <p className="text-xs text-gray-500 mt-1">
                  No agents available. Please invite users with agent role first.
                </p>
              )}
            </div>
          </form>
        </div>

        {/* Modal Footer - Fixed Action Buttons */}
        <div className="flex-shrink-0 px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex gap-3">
            <button
              type="submit"
              form="customer-form"
              className="flex-1 px-5 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02]"
              disabled={isSaving}
            >
              <Loading isLoading={isSaving} type="button" size="small" text={conversation?.customer_id ? "Updating..." : "Creating..."} theme="dark">
                {conversation?.customer_id ? "Update Customer" : "Create Customer"}
              </Loading>
            </button>
          </div>
        </div>
      </Loading>
    </>
  );
}