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
  getConversations: async (projectId: string) => {
    const res = await apiRequest(`/conversation?project_id=${projectId}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    if (!res.ok) throw new Error('Failed to fetch conversations');
    return res.json();
  },

  getChatHistory: async (conversationId: string) => {
    const res = await apiRequest(`/chats/history?conversation_id=${conversationId}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    if (!res.ok) throw new Error('Failed to fetch chat history');
    return res.json();
  },

  sendMessage: async (conversationId: string, content: string, senderType: string) => {
    const res = await apiRequest('/chats/send', {
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

  createConversation: async (projectId: string, conversationName: string, source: string) => {
    const res = await apiRequest('/conversation/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        project_id: projectId,
        conversation_name: conversationName,
        source
      })
    });
    if (!res.ok) throw new Error('Failed to create conversation');
    return res.json();
  }
};

// Knowledge APIs
export const knowledgeApi = {
  getKnowledgeFiles: async (projectId: string) => {
    const res = await apiRequest(`/knowledge/list?project_id=${projectId}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    if (!res.ok) throw new Error('Failed to fetch knowledge files');
    return res.json();
  },

  uploadKnowledgeFile: async (projectId: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await apiRequest(`/knowledge/upload?project_id=${projectId}`, {
      method: 'POST',
      body: formData
    });
    if (!res.ok) throw new Error('Failed to upload file');
    return res.json();
  },

  deleteKnowledgeFile: async (projectId: string, fileName: string) => {
    const res = await apiRequest('/knowledge/remove', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        project_id: projectId,
        file_name: fileName
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
export const whatsappApi = {
  connect: async (projectId: string) => {
    const res = await apiRequest(`/whatsapp/connect?project_id=${projectId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    if (!res.ok) throw new Error('Failed to connect to WhatsApp');
    return res.json();
  },
  start: async (projectId: string) => {
    const res = await apiRequest(`/whatsapp/start?project_id=${projectId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    if (!res.ok) throw new Error('Failed to connect to WhatsApp');
    return res.json();
  },
  stop: async (projectId: string) => {
    const res = await apiRequest(`/whatsapp/stop?project_id=${projectId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    if (!res.ok) throw new Error('Failed to connect to WhatsApp');
    return res.json();
  },
  logout: async (projectId: string) => {
    const res = await apiRequest(`/whatsapp/logout?project_id=${projectId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
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