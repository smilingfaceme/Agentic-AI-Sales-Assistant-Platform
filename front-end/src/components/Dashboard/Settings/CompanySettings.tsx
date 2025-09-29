"use client";
import React, { useState } from "react";
import { FaBuilding, FaEdit } from "react-icons/fa";
import { useRouter } from "next/navigation";
import { useAppContext } from '@/contexts/AppContext';
import Loading from '@/components/Loading';
import { companyApi } from '@/services/apiService';
import { useApiCall } from "@/hooks/useApiCall";
import { logout } from "@/utils/index"

export default function CompanySettings() {
  const router = useRouter();
  const { currentUser, setCurrentUser } = useAppContext();
  const { isLoading: isUpdating, error: updateCompanyError, execute: executeUpdateAsync } = useApiCall();
  const { isLoading: isDeleting, execute: executeDeleteAsync } = useApiCall();

  // Company info state
  const [companyName, setCompanyName] = useState(currentUser.company_name);
  const [companyDescription, setCompanyDescription] = useState(currentUser.company_description);

  // Loading and error states
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  // Update Company Function
  const handleCompanyUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!companyName.trim()) {
      setError("Company name is required");
      return;
    }
    const result = await executeUpdateAsync(async () => {
      return await await companyApi.updateCompany({
        name: companyName,
        description: companyDescription
      });
    });

    if (result) {
      setCurrentUser({
        ...currentUser,
        company_name: result.name,
        company_description: result.description
      });
      setSuccess(result.message);
    }
  };

  // Delete Company Function
  const handleCompanyDelete = async () => {
    const result = await executeDeleteAsync(async () => {
      return await await companyApi.deleteCompany();
    });

    if (result) {
      logout()
      router.push("/")
    }
  }

  return (
    <div className="space-y-6 md:space-y-8">
      <div className="bg-white rounded-lg shadow-sm p-4 md:p-6">
        <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">Company Settings</h1>
        <p className="text-gray-600">Manage your company information and preferences.</p>
      </div>

      {/* Company Information Section */}
      <div className="bg-white rounded-lg shadow-sm p-4 md:p-6">
        <div className="flex items-center mb-4 md:mb-6">
          <FaBuilding className="text-blue-600 mr-2 text-lg" />
          <h2 className="text-lg md:text-xl font-semibold text-gray-900">Company Information</h2>
        </div>

        <form onSubmit={handleCompanyUpdate} className="space-y-4">
          <div>
            <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-1">
              Company Name
            </label>
            <input
              type="text"
              id="companyName"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-900"
              placeholder="Enter company name"
              required
            />
          </div>

          <div>
            <label htmlFor="companyDescription" className="block text-sm font-medium text-gray-700 mb-1">
              Company Description
            </label>
            <textarea
              id="companyDescription"
              value={companyDescription}
              onChange={(e) => setCompanyDescription(e.target.value)}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-900 resize-vertical"
              placeholder="Enter a brief description of your company..."
            />
            <p className="text-xs text-gray-500 mt-1">
              This description helps team members understand your companys purpose and goals.
            </p>
          </div>

          {error || updateCompanyError && (
            <div className="text-red-600 text-sm bg-red-50 p-3 rounded">{error || updateCompanyError}</div>
          )}

          {success && (
            <div className="text-green-600 text-sm bg-green-50 p-3 rounded">{success}</div>
          )}

          <button
            type="submit"
            disabled={isUpdating}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Loading isLoading={isUpdating} type="button" text="Updating..." theme="dark">
              Update Company Settings
            </Loading>
          </button>
        </form>
      </div>

      {/* Company Details Section */}
      <div className="bg-white rounded-lg shadow-sm p-4 md:p-6">
        <div className="flex items-center mb-4 md:mb-6">
          <FaEdit className="text-blue-600 mr-2 text-lg" />
          <h2 className="text-lg md:text-xl font-semibold text-gray-900">Company Details</h2>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Company Name
              </label>
              <div className="px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-600">
                {currentUser.company_name || 'Not available'}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Your Role
              </label>
              <div className="px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-600">
                {currentUser.role || 'Not specified'}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Company Description
            </label>
            <div className="px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-600">
              {currentUser.company_description || 'Not set'}
            </div>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-white rounded-lg shadow-sm p-4 md:p-6 border-l-4 border-red-500">
        <div className="flex items-center mb-4 md:mb-6">
          <h2 className="text-lg md:text-xl font-semibold text-red-700">Danger Zone</h2>
        </div>

        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-2">Delete Company</h3>
            <p className="text-sm text-gray-600 mb-3">
              Permanently delete your company and all associated data. This action cannot be undone.
            </p>
            <button
              type="button"
              disabled={isDeleting}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              onClick={async () => {
                if (confirm('Are you sure you want to delete your company? This action cannot be undone.')) {
                  await handleCompanyDelete()
                }
              }}
            >
              <Loading isLoading={isDeleting} type="button" text="Deleting..." theme="dark">
                Delete Company
              </Loading>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
