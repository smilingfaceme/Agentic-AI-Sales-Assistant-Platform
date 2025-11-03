"use client";
import Link from 'next/link';
import { useState, useEffect, useCallback } from 'react';
import { FaPlus, FaEdit, FaTrash } from 'react-icons/fa';
import { workflowApi } from '@/services/apiService';
import { useApiCall } from "@/hooks/useApiCall";
import { useNotification } from '@/contexts/NotificationContext';
import Loading from "@/components/Loading";

interface Workflow {
  id: string;
  name: string;
  status: string;
  created_at: string;
  enable_workflow: boolean;
  except_case: string;
  [key: string]: unknown;
}

export default function WorkflowListPage() {
  const { showNotification } = useNotification();
  const { isLoading: isLoadingList, error: listError, execute: executeListAsync } = useApiCall();
  const { isLoading: isTogglingEnable, execute: executeToggleEnable } = useApiCall();
  const { isLoading: isExceptCaseLoading, execute: executeExceptCase } = useApiCall();
  const [workflows, setWorkflows] = useState<Workflow[]>([]);

  const fetchWorkflows = useCallback(async () => {
    try {
      const result = await executeListAsync(async () => {
        return await workflowApi.getWorkflows();
      });

      if (result.workflows) {
        setWorkflows(result.workflows);
      } else {
        showNotification(result.message || listError || 'Failed to fetch workflows', 'error', true);
      }
    } catch (err) {
      console.error('Error fetching workflows:', err);
      showNotification(err instanceof Error ? err.message : 'Failed to fetch workflows', 'error', true);
    } finally {
      // No need to set loading state as useApiCall handles it
    }
  }, [showNotification, executeListAsync, listError]);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this workflow?')) {
      return;
    }

    try {
      const response = await workflowApi.deleteWorkflow(id);
      if (response.status) {
        // Refresh the workflows list after successful deletion
        await fetchWorkflows();
      } else {
        showNotification(response.message || 'Failed to delete workflow', 'error', true);
      }
    } catch (err) {
      console.error('Error deleting workflow:', err);
      showNotification(err instanceof Error ? err.message : 'Failed to delete workflow', 'error', true);
    }
  };

  const toggle_enable_workflow = async (workflow_id: string) => {
    const result = await executeToggleEnable(async () => {
      return await workflowApi.toggleEnable(workflow_id);
    });
    if (result) {
      await fetchWorkflows();
    }
  };
  const change_except_case = async (workflow_id: string, except_case: string) => {
    const result = await executeExceptCase(async () => {
      return await workflowApi.exceptCaseChange(workflow_id, except_case);
    });
    if (result) {
      await fetchWorkflows();
    }
  };

  useEffect(() => {
    fetchWorkflows();
  }, [fetchWorkflows]);

  return (
    <section className="flex-1 flex flex-col bg-gray-60 w-full h-full p-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Workflows</h2>
        <p className="text-gray-600">Create and manage your automation workflows</p>
      </div>

      <Loading isLoading={isLoadingList} text="Loading workflows..." type="inline" className="min-h-[300px]">
        {workflows.length === 0 ? (
          <div className="flex flex-col items-center justify-center flex-1 bg-white rounded-lg border-2 border-dashed border-gray-300">
            <FaPlus className="text-4xl text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No workflows yet</h3>
            <p className="text-gray-600 mb-6">Create your first workflow to get started</p>
            <Link
              href="/dashboard/workflow/edit?workflow_id=new"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Create Workflow
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {workflows.map((workflow) => (
              <div key={workflow.id} className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-lg transition-shadow">
                <div className='flex items-center justify-between'>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{workflow.name}</h3>
                  <button
                    className={`border border-gray-500 relative inline-flex h-5 w-10 items-center rounded-full transition ${workflow.enable_workflow ? "bg-gray-800" : "bg-gray-100"}`}
                    onClick={() => { toggle_enable_workflow(workflow.id) }}
                    disabled={isTogglingEnable}
                  >
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full border border-gray-500 bg-gray-300 transition ${workflow.enable_workflow ? "translate-x-5" : "translate-x-0"}`}
                    />
                  </button>
                </div>
                <div className='flex items-center justify-between gap-3 mb-4'>
                  <p className={`${workflow.status == "Success" ? "text-gray-600" : "text-red-600"} text-sm`}>
                    <span className='font-semibold'>Status: </span>{workflow.status}</p>
                  <div>
                    <label className='text-sm text-gray-600 font-semibold'>Except Case:</label>
                    <select 
                      className="px-1 py-2 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-lg transition-colors text-xs"
                      onChange={(e) => {change_except_case(workflow.id, e.target.value)}}
                      value = {workflow.except_case}
                      disabled = {isExceptCaseLoading}
                    >
                      <option value= "sample">Sample</option>
                      <option value= "move">Move to Agent</option>
                      <option value= "ignore">Ignore</option>
                    </select>
                  </div>
                </div>
                <p className="text-gray-600 text-sm mb-4">Created: {new Date(workflow.created_at).toLocaleDateString()}</p>
                <div className="flex gap-2">
                  <Link
                    href={`/dashboard/workflow/edit?workflow_id=${workflow.id}`}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded transition-colors text-sm"
                  >
                    <FaEdit size={14} />
                    Edit
                  </Link>
                  <button
                    onClick={() => handleDelete(workflow.id)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded transition-colors text-sm"
                  >
                    <FaTrash size={14} />
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Loading>
    </section>
  );
}