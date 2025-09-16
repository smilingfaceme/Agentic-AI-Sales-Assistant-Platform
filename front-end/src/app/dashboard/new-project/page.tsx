"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/utils";
const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5000/api';

export default function NewProjectPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const handleCancel = () => {
    router.push("/dashboard");
  };

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleCreate = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await apiRequest(`${API_BASE}/project/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({name, description})
      });
      const data = await res.json();
      if (res.ok && data.project) {
        router.push("/dashboard");
      } else {
        setError(data.error || "Failed to create project.");
      }
    } catch {
      setError("Server error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-8 flex flex-col">
        {/* Header */}
        <div className="mb-6 text-center">
          <h2 className="text-2xl font-bold text-gray-900">Create new project</h2>
        </div>
        {/* Main */}
        <div className="flex flex-col gap-4 mb-8">
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-800">Project name</label>
            <input
              type="text"
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring focus:border-blue-400 text-gray-900"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Enter project name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-800">Description</label>
            <textarea
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring focus:border-blue-400 text-gray-900"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Enter description"
              rows={3}
            />
          </div>
        </div>
        {/* Footer */}
        <div className="flex justify-between">
          <button
            className="px-6 py-2 rounded bg-gray-200 text-gray-900 font-semibold hover:bg-gray-300"
            onClick={handleCancel}
          >
            Cancel
          </button>
          <button
            className="px-6 py-2 rounded bg-black text-white font-semibold hover:bg-gray-700"
            onClick={handleCreate}
            disabled={!name.trim() || loading}
          >
            {loading ? "Creating..." : "Create"}
          </button>
        </div>
        {error && <div className="mt-4 text-red-500 text-sm text-center">{error}</div>}
      </div>
    </div>
  );
}
