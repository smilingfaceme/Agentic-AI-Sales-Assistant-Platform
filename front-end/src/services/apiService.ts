import { apiRequest, hashPassword } from '@/utils';

// Auth APIs
export const authApi = {
  login: async (email: string, password: string) => {
    const res = await apiRequest('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    return res.json();
  },

  register: async (name: string, email: string, password: string) => {
    const res = await apiRequest('/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password })
    });
    return res.json();
  }
};

// Project APIs
export const projectApi = {
  getProjects: async () => {
    const res = await apiRequest('/project/get', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    if (!res.ok) throw new Error('Failed to fetch projects');
    return res.json();
  },

  createProject: async (name: string, description: string) => {
    const res = await apiRequest('/project/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, description })
    });
    if (!res.ok) throw new Error('Failed to create project');
    return res.json();
  }
};

// Chat APIs
export const chatApi = {
  getConversations: async () => {
    const res = await apiRequest(`/conversation/list`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    if (!res.ok) throw new Error('Failed to fetch conversations');
    return res.json();
  },

  getChatHistory: async (conversationId: string) => {
    const res = await apiRequest(`/chat/history?conversation_id=${conversationId}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    if (!res.ok) throw new Error('Failed to fetch chat history');
    return res.json();
  },

  sendMessage: async (conversationId: string, content: string, senderType: string) => {
    const res = await apiRequest('/chat/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        conversation_id: conversationId,
        content,
        sender_type: senderType
      })
    });
    if (!res.ok) throw new Error('Failed to send message');
    return res.json();
  },

  createConversation: async (conversationName: string, source: string) => {
    const res = await apiRequest('/conversation/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        conversation_name: conversationName,
        source,
        phone_number: ""
      })
    });
    if (!res.ok) throw new Error('Failed to create conversation');
    return res.json();
  },

  sendImageMessage: async (conversationId: string, file: File, senderType: string, content: string) => {
    const formData = new FormData();
    formData.append('conversation_id', conversationId);
    formData.append('file', file);
    formData.append('content', content);
    formData.append('sender_type', senderType);
    const res = await apiRequest('/chat/send-image', {
      method: 'POST',
      body: formData
    });
    if (!res.ok) throw new Error('Failed to send image message');
    return res.json();
  },

  sendFilesMessage: async (conversationId: string, files: File[], senderType: string, content: string) => {
    const formData = new FormData();
    formData.append('conversation_id', conversationId);
    files.forEach((file) => {
      formData.append('files', file);
    });
    formData.append('content', content);
    formData.append('sender_type', senderType);
    const res = await apiRequest('/chat/send-image', {
      method: 'POST',
      body: formData
    });
    if (!res.ok) throw new Error('Failed to send files message');
    return res.json();
  },

  toggleAIReply: async (conversationId: string) => {
    const res = await apiRequest('/conversation/toggle-ai-reply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        conversation_id: conversationId
      })
    });
    if (!res.ok) throw new Error('Failed to toggle AI reply');
    return res.json();
  }

};

// Knowledge APIs
export const knowledgeApi = {
  getKnowledgeFiles: async () => {
    const res = await apiRequest(`/knowledge/list`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    if (!res.ok) throw new Error('Failed to fetch knowledge files');
    return res.json();
  },

  uploadKnowledgeFile: async (file: File, columns: string[], primary: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('columns', JSON.stringify(columns));
    formData.append('primary_column', primary);
    const res = await apiRequest(`/knowledge/upload`, {
      method: 'POST',
      body: formData
    });
    const data = await res.json();
    if (!res.ok) throw new Error(`Failed to upload file. ${data.message}`);
    return data;
  },

  deleteKnowledgeFile: async (fileId: string) => {
    const res = await apiRequest('/knowledge/remove', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        file_id: fileId
      })
    });
    if (!res.ok) throw new Error('Failed to delete knowledge file');
    return res.json();
  },

  reprocessKnowledgeFile: async (fileId: string) => {
    const res = await apiRequest('/knowledge/reprocess', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        file_id: fileId
      })
    });
    if (!res.ok) throw new Error('Failed to delete knowledge file');
    return res.json();
  }
};

// Knowledge APIs
export const imageApi = {
  getImageFiles: async (page_size: number, page_start: number) => {
    const res = await apiRequest(
      `/image/list?page_size=${encodeURIComponent(page_size)}&page_start=${encodeURIComponent(page_start)}`,
      {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      }
    );

    if (!res.ok) throw new Error('Failed to fetch Image files');
    return res.json();
  },

  uploadImageFile: async (file: File, match: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('match_field', match);

    const res = await apiRequest(`/image/upload`, {
      method: 'POST',
      body: formData
    });
    const data = await res.json();
    if (!res.ok) throw new Error(`Failed to upload file. ${data.message}`);
    return data;
  },

  deleteImageFile: async (fileId: string) => {
    const res = await apiRequest('/image/remove', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        file_id: fileId
      })
    });
    if (!res.ok) throw new Error('Failed to delete Image file');
    return res.json();
  },

  reprocessImageFile: async (fileId: string) => {
    const res = await apiRequest('/image/reprocess', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        file_id: fileId
      })
    });
    if (!res.ok) throw new Error('Failed to delete Image file');
    return res.json();
  }
};

// Document APIs
export const documentApi = {
  getDocumentFiles: async (page_size: number, page_start: number) => {
    const res = await apiRequest(
      `/document/list?page_size=${encodeURIComponent(page_size)}&page_start=${encodeURIComponent(page_start)}`,
      {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      }
    );

    if (!res.ok) throw new Error('Failed to fetch Document files');
    return res.json();
  },

  uploadDocumentFile: async (file: File, match: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('match_field', match);

    const res = await apiRequest(`/document/upload`, {
      method: 'POST',
      body: formData
    });
    const data = await res.json();
    if (!res.ok) throw new Error(`Failed to upload file. ${data.message}`);
    return data;
  },

  deleteDocumentFile: async (fileId: string) => {
    const res = await apiRequest('/document/remove', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        file_id: fileId
      })
    });
    if (!res.ok) throw new Error('Failed to delete Document file');
    return res.json();
  },

  reprocessDocumentFile: async (fileId: string) => {
    const res = await apiRequest('/document/reprocess', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        file_id: fileId
      })
    });
    if (!res.ok) throw new Error('Failed to reprocess Document file');
    return res.json();
  }
};

// Chatbot APIs
export const chatbotApi = {
  getUnansweredQuestions: async (projectId: string) => {
    const res = await apiRequest(`/conversation/unanswered?project_id=${projectId}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    if (!res.ok) throw new Error('Failed to fetch unanswered questions');
    return res.json();
  }
};

// WhatsApp APIs
export const integrationApi = {
  get: async () => {
    const res = await apiRequest(`/integration/list`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    if (!res.ok) throw new Error('Failed to connect to WhatsApp');
    return res.json();
  },
  new: async (instanceName: string) => {
    const res = await apiRequest(`/integration/new`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ "instanceName": instanceName })
    });
    if (!res.ok) throw new Error('Failed to connect to WhatsApp');
    return res.json();
  },
  active: async (integrationId: string) => {
    const res = await apiRequest(`/integration/active`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ "integrationId": integrationId })
    });
    if (!res.ok) throw new Error('Failed to connect to WhatsApp');
    return res.json();
  },
  logout: async (integrationId: string) => {
    const res = await apiRequest(`/integration/logout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ "integrationId": integrationId })
    });
    if (!res.ok) throw new Error('Failed to connect to WhatsApp');
    return res.json();
  },
  new_waca: async (waba_id: string, phone_number_id: string, api_key:string) => {
    const res = await apiRequest(`/integration/new-waca`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({"wabaId":waba_id, "phoneNumberId": phone_number_id, 'apiKey':api_key })
    });
    // if (!res.ok) throw new Error('Failed to connect to WACA');
    return res.json();
  },
};

// Dashboard APIs
export const dashboardApi = {
  getDashboardData: async () => {
    const res = await apiRequest('/dashboard');
    if (!res.ok) throw new Error('Failed to fetch dashboard data');
    return res.json();
  }
};

// User Settings APIs
export const userApi = {
  updateProfile: async (userData: { name: string; }) => {
    const res = await apiRequest('/user/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    if (!res.ok) throw new Error('Failed to update profile');
    return res.json();
  },

  updatePassword: async (passwordData: { currentPassword: string; newPassword: string }) => {
    const hashed_password = hashPassword(passwordData.currentPassword);
    const res = await apiRequest('/user/password', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 'currentPassword': hashed_password, 'newPassword': passwordData.newPassword })
    });
    if (!res.ok) throw new Error('Failed to update password');
    return res.json();
  }
};

// Company Settings APIs
export const companyApi = {
  updateCompany: async (companyData: { name: string; description: string }) => {
    const res = await apiRequest('/company/update', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(companyData)
    });
    if (!res.ok) throw new Error('Failed to update company');
    return res.json();
  },

  deleteCompany: async () => {
    const res = await apiRequest(`/company/delete`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' }
    });
    if (!res.ok) throw new Error('Failed to delete company');
    return res.json();
  }
};

// User Invitation APIs
export const invitationApi = {
  getInvitedUsers: async () => {
    const res = await apiRequest(`/invite/list`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    if (!res.ok) throw new Error('Failed to fetch invited users');
    return res.json();
  },

  inviteUser: async (inviteData: { email: string; role: string; }) => {
    const res = await apiRequest('/invite/new', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(inviteData)
    });
    if (!res.ok) throw new Error('Failed to send invitation');
    return res.json();
  },

  resendInvitation: async (invitationId: string) => {
    const res = await apiRequest(`/invite/resend?invitationId=${invitationId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    if (!res.ok) throw new Error('Failed to resend invitation');
    return res.json();
  },

  revokeInvitation: async (invitationId: string) => {
    const res = await apiRequest(`/invite/revoke?invitation_id=${invitationId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) throw new Error('Failed to revoke invitation');
    return res.json();
  },
};

// Role Management APIs
export const roleApi = {
  getRoles: async () => {
    const res = await apiRequest(`/invite/get_roles`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    if (!res.ok) throw new Error('Failed to fetch invited users');
    return res.json();
  },
};

// Chatbot Personality Management APIs
export const personalityAPI = {
  getPersonality: async () => {
    const res = await apiRequest(`/personality/status`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    if (!res.ok) throw new Error('Failed to fetch chatbot personality');
    return res.json();
  },
  updatePersonality: async (updateDate: object) => {
    const res = await apiRequest(`/personality/update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updateDate)
    });
    if (!res.ok) throw new Error('Failed to fetch updating chatbot personality');
    return res.json();
  }
};

// Workflow APIs
export const workflowApi = {
  getWorkflows: async () => {
    const res = await apiRequest('/workflow/list', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    if (!res.ok) throw new Error('Failed to fetch workflows');
    return res.json();
  },

  getWorkflow: async (workflowId: string) => {
    const res = await apiRequest(`/workflow/get?workflow_id=${workflowId}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    if (!res.ok) throw new Error('Failed to fetch workflow');
    return res.json();
  },

  createWorkflow: async (workflowData: {
    name: string;
    nodes: unknown[];
    edges: unknown[];
  }, files?: File[]) => {
    // If files are provided, use FormData, otherwise use JSON
    const formData = new FormData();
    formData.append('name', workflowData.name);
    formData.append('nodes', JSON.stringify(workflowData.nodes));
    formData.append('edges', JSON.stringify(workflowData.edges));
    if (files && files.length > 0) {
      // Append all files
      files.forEach((file) => {
        formData.append(`files`, file);
      });

    }
    const res = await apiRequest('/workflow/create', {
      method: 'POST',
      body: formData
    });
    if (!res.ok) throw new Error('Failed to create workflow');
    return res.json();
  },

  updateWorkflow: async (workflowId: string, workflowData: {
    name: string;
    nodes: unknown[];
    edges: unknown[];
  }, files?: File[]) => {
    // If files are provided, use FormData, otherwise use JSON
    const formData = new FormData();
    formData.append('workflow_id', workflowId);
    formData.append('name', workflowData.name);
    formData.append('nodes', JSON.stringify(workflowData.nodes));
    formData.append('edges', JSON.stringify(workflowData.edges));
    if (files && files.length > 0) {

      // Append all files
      files.forEach((file) => {
        formData.append(`files`, file);
      });

    }
    const res = await apiRequest('/workflow/update', {
      method: 'PUT',
      body: formData
    });
    if (!res.ok) throw new Error('Failed to update workflow');
    return res.json();
  },

  deleteWorkflow: async (workflowId: string) => {
    const res = await apiRequest('/workflow/delete', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        workflow_id: workflowId
      })
    });
    if (!res.ok) throw new Error('Failed to delete workflow');
    return res.json();
  },

  toggleEnable: async (workflowId: string) => {
    const res = await apiRequest('/workflow/toggle-enable', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        workflow_id: workflowId
      })
    });
    if (!res.ok) throw new Error('Failed to toggle AI reply');
    return res.json();
  },

  exceptCaseChange: async (workflowId: string, except_case: string) => {
    const res = await apiRequest('/workflow/except-case', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        workflow_id: workflowId,
        except_case: except_case
      })
    });
    if (!res.ok) throw new Error('Failed to toggle AI reply');
    return res.json();
  }
};

// Sustainability KPI APIs
export const sustainabilityApi = {
  getKPIData: async (dateRange: string) => {
    const res = await apiRequest(`/sustainability/kpi?timeperiod=${encodeURIComponent(dateRange)}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    if (!res.ok) throw new Error('Failed to fetch KPI data');
    return res.json();
  },

  getKPITrends: async (dateRange: string) => {
    const res = await apiRequest(`/sustainability/trends?range=${encodeURIComponent(dateRange)}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    if (!res.ok) throw new Error('Failed to fetch KPI trends');
    return res.json();
  },

  getEnergyBreakdown: async () => {
    const res = await apiRequest('/sustainability/energy-breakdown', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    if (!res.ok) throw new Error('Failed to fetch energy breakdown');
    return res.json();
  },

  getEmissionsBreakdown: async () => {
    const res = await apiRequest('/sustainability/emissions-breakdown', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    if (!res.ok) throw new Error('Failed to fetch emissions breakdown');
    return res.json();
  },

  getAlerts: async () => {
    const res = await apiRequest('/sustainability/alerts', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    if (!res.ok) throw new Error('Failed to fetch sustainability alerts');
    return res.json();
  },

  exportKPIData: async (dateRange: string, format: 'csv' | 'json' | 'xlsx') => {
    const res = await apiRequest(`/sustainability/export?range=${encodeURIComponent(dateRange)}&format=${format}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    if (!res.ok) throw new Error('Failed to export KPI data');
    return res.blob();
  }
};