"use client";
import React, { useState, useEffect, useCallback } from "react";
import { FaUsers, FaPlus, FaTrash, FaSync, FaEnvelope, FaTimes } from "react-icons/fa";
import { useNotification } from '@/contexts/NotificationContext';
import { Role } from '@/contexts/AppContext';
import Table, { TableAction } from '@/components/Table';
import Loading from '@/components/Loading';
import { useApiCall } from '@/hooks/useApiCall';
import { invitationApi, roleApi } from '@/services/apiService';

interface InvitedUser {
  id: string;
  invited_email: string;
  role: string;
  status: 'pending' | 'accepted' | 'expired' | 'failed';
  created_at: string;
  invited_by: string;
}

export default function InviteUsers() {
  // Invited Users State
  const [invitedUsers, setInvitedUsers] = useState<InvitedUser[]>([]);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const { showNotification } = useNotification();

  // Invite Form State
  const [inviteEmail, setInviteEmail] = useState("");
  const [roles, setRoles] = useState<Role[]>([]);
  const [inviteRole, setInviteRole] = useState("");

  // Loading and error states
  const { isLoading: isLoadingUsers, error: usersError, execute: executeLoadUsers } = useApiCall();
  const { isLoading: isInviting, error: inviteError, execute: executeInvite } = useApiCall();
  const { execute: executeResend } = useApiCall();
  const { execute: executeRole } = useApiCall();
  const [resendLoading, setResendLoading] = useState<Record<string, boolean>>({});
  const [revokeLoading, setRevokeLoading] = useState<Record<string, boolean>>({});

  // Mock data for demonstration
  const tableHeaders = [
    "Email",
    "Role",
    "Invited Date",
    "Invited By",
    "Status",
    "Actions"
  ];

  // Fetch roles
  const fetchroles = async () => {
    const result = await executeRole(async () => {
      return await roleApi.getRoles();
    });

    if (result) {
      setRoles(result.roles);
      setInviteRole(result.roles[0].id || "")
    }
  };

  // Fetch invited users
  const fetchInvitedUsers = useCallback(async () => {
    const result = await executeLoadUsers(async () => {
      return await invitationApi.getInvitedUsers();
    });

    if (result) {
      setInvitedUsers(result.invitations);
      if (result.invitations?.length) {
        const initialLoading = result.invitations.reduce((acc:Record<string, boolean>, user:InvitedUser) => {
          acc[user.id] = false;
          return acc;
        }, {} as Record<string, boolean>);
        setResendLoading(initialLoading);

        const initialRevokeLoading = result.invitations.reduce((acc:Record<string, boolean>, user:InvitedUser) => {
          acc[user.id] = false;
          return acc;
        }, {} as Record<string, boolean>);
        setRevokeLoading(initialRevokeLoading);
      }
    }
  }, [executeLoadUsers,]);

  useEffect(() => {
    fetchInvitedUsers();
  }, [fetchInvitedUsers]);

  // Resend Invitation Function
  const handleResendInvite = async (userId: string, email: string) => {
    setResendLoading({...resendLoading, [userId]:true})
    const result = await executeResend(async () => {
      return await invitationApi.resendInvitation(userId);
    });
    if (result) {
      showNotification(`Invitation resent to ${email}`, 'success', true);
    } else {
      showNotification("Failed to resend invitation", 'error', true);
    }
    setResendLoading({...resendLoading, [userId]:false})
  };

  // Revoke Invitation Function
  const handleRevokeInvite = async (userId: string, email: string) => {
    if (!confirm(`Are you sure you want to revoke the invitation for ${email}?`)) {
      return;
    }
    setRevokeLoading({...resendLoading, [userId]:true})
    try {
      await invitationApi.revokeInvitation(userId);
      fetchInvitedUsers(); // Refresh the list
    } catch {
      alert("Failed to revoke invitation");
    }
    setRevokeLoading({...resendLoading, [userId]:false})
  };

  // Map invited users to table data
  const tableData = invitedUsers.map((user) => ({
      "Email": user.invited_email,
      "Role": user.role,
      "Status": user.status.toUpperCase(),
      "Invited Date": new Date(user.created_at).toLocaleDateString(),
      "Invited By": user.invited_by,
      "Actions": [
        ...(user.status != 'accepted' ? [{
          label: "",
          disabled: resendLoading[user.id],
          onClick: () => handleResendInvite(user.id, user.invited_email),
          className: "flex items-center px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors mr-1",
          icon: <Loading isLoading={resendLoading[user.id] ?? false} type="button" size="small" text="Resending" theme="dark">
            <FaEnvelope className="mr-1"/> Resend
          </Loading>
        }] : []),
        {
          label: "",
          disabled: revokeLoading[user.id],
          onClick: () => handleRevokeInvite(user.id, user.invited_email),
          className: "flex items-center px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors",
          icon: <Loading isLoading={revokeLoading[user.id] ?? false} type="button" size="small" text="Revoking" theme="dark">
            <FaTrash className="mr-1"/> Revoke
          </Loading>
        }
      ] as TableAction[]
  }));

  // Send Invitation Function
  const handleInviteUser = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!inviteEmail) {
      return;
    }

    const result = await executeInvite(async () => {
      const response = await invitationApi.inviteUser({
        email: inviteEmail,
        role: inviteRole
      });
      return response;
    });

    if (result) {
      showNotification(`Invitation resent to ${inviteEmail} successfully!`, 'success', true);
      setInviteEmail("");
      setInviteRole(roles[0].id || "");
      setShowInviteModal(false);
    }
    if (inviteError) {
      showNotification(inviteError || 'Failed to send invitation!', 'error', true);
    }
    fetchInvitedUsers(); // Refresh the list
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm p-4 md:p-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">Invite Users</h1>
            <p className="text-gray-600">Manage team members and send invitations to join your company.</p>
          </div>
          <button
            onClick={() => {
              setShowInviteModal(true);
              fetchroles()
            }}
            className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap"
          >
            <FaPlus className="mr-2" />
            Invite New User
          </button>
        </div>
      </div>

      {/* Invited Users Table */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-4 md:p-6 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center">
              <FaUsers className="text-blue-600 mr-2 text-lg" />
              <h2 className="text-lg md:text-xl font-semibold text-gray-900">Invited Users</h2>
            </div>
            <button
              onClick={fetchInvitedUsers}
              disabled={isLoadingUsers}
              className="flex items-center justify-center px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-colors"
            >
              <FaSync className={`mr-2 ${isLoadingUsers ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        <div className="p-4 md:p-6">
          {isLoadingUsers ? (
            <div className="flex justify-center py-8">
              <Loading isLoading={true} type="spinner" size="medium" />
            </div>
          ) : usersError ? (
            <div className="text-red-600 text-center py-8 bg-red-50 rounded-lg">
              Error loading invited users: {usersError}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table headers={tableHeaders} data={tableData}/>
            </div>
          )}
        </div>
      </div>

      {/* Invite User Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-[#828487c9] bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Invite New User</h3>
              <button
                onClick={() => setShowInviteModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <FaTimes />
              </button>
            </div>

            <form onSubmit={handleInviteUser} className="space-y-4">
              <div>
                <label htmlFor="inviteEmail" className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  id="inviteEmail"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-900"
                  placeholder="Enter email address"
                  required
                />
              </div>

              <div>
                <label htmlFor="inviteRole" className="block text-sm font-medium text-gray-700 mb-1">
                  Role
                </label>
                <select
                  id="inviteRole"
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-900"
                >
                  {roles.map((item: Role) => (
                    <option key={item.id} value={item.id}>{item.name.toUpperCase()}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isInviting}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Loading isLoading={isInviting} type="button" text="Inviting..." theme="dark">
                    Send Invitation
                  </Loading>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
