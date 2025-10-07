import { apiRequest } from '@/utils';

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
    const res = await apiRequest(`/conversation`, {
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

  createConversation: async ( conversationName: string, source: string) => {
    const res = await apiRequest('/conversation/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        conversation_name: conversationName,
        source,
        phone_number:""
      })
    });
    if (!res.ok) throw new Error('Failed to create conversation');
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

  uploadKnowledgeFile: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await apiRequest(`/knowledge/upload`, {
      method: 'POST',
      body: formData
    });
    if (!res.ok) throw new Error('Failed to upload file');
    return res.json();
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
    const res = await apiRequest(`/integration`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    if (!res.ok) throw new Error('Failed to connect to WhatsApp');
    return res.json();
  },
  new: async (instanceName:string) => {
    const res = await apiRequest(`/integration/new`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({"instanceName":instanceName})
    });
    if (!res.ok) throw new Error('Failed to connect to WhatsApp');
    return res.json();
  },
  active: async (integrationId: string) => {
    const res = await apiRequest(`/integration/active`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({"integrationId":integrationId})
    });
    if (!res.ok) throw new Error('Failed to connect to WhatsApp');
    return res.json();
  },
  logout: async (integrationId: string) => {
    const res = await apiRequest(`/integration/logout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({"integrationId":integrationId})
    });
    if (!res.ok) throw new Error('Failed to connect to WhatsApp');
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
    const res = await apiRequest('/user/password', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(passwordData)
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