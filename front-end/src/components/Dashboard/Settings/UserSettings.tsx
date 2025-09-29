"use client";
import React, { useState } from "react";
import { FaUser, FaLock, FaEye, FaEyeSlash } from "react-icons/fa";
import { useAppContext } from '@/contexts/AppContext';
import Loading from '@/components/Loading';
import { useApiCall } from "@/hooks/useApiCall";
import { userApi } from '@/services/apiService';

export default function UserSettings() {
  const { currentUser, setCurrentUser } = useAppContext();
  const { isLoading: isUpdatingProfile, error: updateProfileError, execute: executeProfileAsync } = useApiCall();
  const { isLoading: isUpdatingPassword, error: updatePasswordError, execute: executePasswordAsync } = useApiCall();

  // User Info State
  const [userName, setUserName] = useState(currentUser.name);
  const [email, setEmail] = useState(currentUser.email);

  // Password Change State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Loading and error states
  const [profileError, setProfileError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [profileSuccess, setProfileSuccess] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");

  // Validation Functions
  const isStrongPassword = (password: string) => {
    return password.length >= 8 &&
      /[A-Z]/.test(password) &&
      /[a-z]/.test(password) &&
      /[0-9]/.test(password);
  };

  // Update Profile Function
  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError("");
    setProfileSuccess("");
    if (!userName.trim()) {
      setProfileError("Name is required");
      return;
    }
    const result = await executeProfileAsync(async () => {
      return await userApi.updateProfile({ name: userName });
    });
    if (result) {
      // Update context
      setCurrentUser({
        ...currentUser,
        name: result.name,
      });
      setProfileSuccess(result.message);
    }
  };

  // Update Password Function
  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess("");

    if (!currentPassword) {
      setPasswordError("Current password is required");
      return;
    }

    if (!newPassword) {
      setPasswordError("New password is required");
      return;
    }

    if (!isStrongPassword(newPassword)) {
      setPasswordError("Password must be at least 8 characters with uppercase, lowercase, and number");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match");
      return;
    }

    const result = await executePasswordAsync(async () => {
      return await userApi.updatePassword({ currentPassword, newPassword });
    });

    if (result) {
      setPasswordSuccess(result.message);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    }
  };

  return (
    <div className="space-y-6 md:space-y-8">
      <div className="bg-white rounded-lg shadow-sm p-4 md:p-6">
        <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">User Settings</h1>
        <p className="text-gray-600">Manage your personal account settings and preferences.</p>
      </div>

      {/* Profile Information Section */}
      <div className="bg-white rounded-lg shadow-sm p-4 md:p-6">
        <div className="flex items-center mb-4 md:mb-6">
          <FaUser className="text-blue-600 mr-2 text-lg" />
          <h2 className="text-lg md:text-xl font-semibold text-gray-900">Profile Information</h2>
        </div>

        <form onSubmit={handleProfileUpdate} className="space-y-4">
          <div>
            <label htmlFor="userName" className="block text-sm font-medium text-gray-700 mb-1">
              Full Name
            </label>
            <input
              type="text"
              id="userName"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-900"
              placeholder="Enter your full name"
              required
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-900 bg-gray-50"
              placeholder="Enter your email"
              disabled
            />
            <p className="text-xs text-gray-500 mt-1">Email cannot be changed. Contact support if needed.</p>
          </div>
          {profileError || updateProfileError && (
            <div className="text-red-600 text-sm bg-red-50 p-3 rounded">{profileError || updateProfileError}</div>
          )}
          {profileSuccess && (
            <div className="text-green-600 text-sm bg-green-50 p-3 rounded">{profileSuccess}</div>
          )}
          <button
            type="submit"
            disabled={isUpdatingProfile}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Loading isLoading={isUpdatingProfile} type="button" text="Updating..." theme="dark">
              Update Profile
            </Loading>
          </button>
        </form>
      </div>

      {/* Password Change Section */}
      <div className="bg-white rounded-lg shadow-sm p-4 md:p-6">
        <div className="flex items-center mb-4 md:mb-6">
          <FaLock className="text-blue-600 mr-2 text-lg" />
          <h2 className="text-lg md:text-xl font-semibold text-gray-900">Change Password</h2>
        </div>

        <form onSubmit={handlePasswordUpdate} className="space-y-4">
          <div>
            <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-1">
              Current Password
            </label>
            <div className="relative">
              <input
                type={showCurrentPassword ? "text" : "password"}
                id="currentPassword"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-900"
                placeholder="Enter current password"
                required
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showCurrentPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
              New Password
            </label>
            <div className="relative">
              <input
                type={showNewPassword ? "text" : "password"}
                id="newPassword"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-900"
                placeholder="Enter new password"
                required
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showNewPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
            {newPassword && !isStrongPassword(newPassword) && (
              <p className="text-xs text-red-500 mt-1">
                Password must be at least 8 characters with uppercase, lowercase, and number
              </p>
            )}
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
              Confirm New Password
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-900"
                placeholder="Confirm new password"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
            {confirmPassword && newPassword !== confirmPassword && (
              <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
            )}
          </div>

          {passwordError || updatePasswordError && (
            <div className="text-red-600 text-sm bg-red-50 p-3 rounded">{passwordError || updatePasswordError}</div>
          )}

          {passwordSuccess && (
            <div className="text-green-600 text-sm bg-green-50 p-3 rounded">{passwordSuccess}</div>
          )}

          <button
            type="submit"
            disabled={isUpdatingPassword}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Loading isLoading={isUpdatingPassword} type="button" text="Updating..." theme="dark">
              Update Password
            </Loading>
          </button>
        </form>
      </div>
    </div>
  );
}
