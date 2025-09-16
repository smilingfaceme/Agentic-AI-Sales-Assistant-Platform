

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5000/api';

// Helper to get token from localStorage
function getToken() {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('token');
  }
  return undefined;
}

// Helper to handle API requests with token and redirect on 401/403
export async function apiRequest(input: RequestInfo, init: RequestInit = {}) {
  const token = getToken();
  const headers = {
    ...(init.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
  const res = await fetch(input, { ...init, headers });
  if (res.status === 401 || res.status === 403) {
    if (typeof window !== 'undefined') {
      window.location.href = '/auth/login';
    }
    throw new Error('Unauthorized');
  }
  return res;
}


export async function login(email: string, password: string) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  return res.json();
}


export async function register(name: string, email: string, password: string) {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password })
  });
  return res.json();
}


export async function getDashboardData() {
  const res = await apiRequest(`${API_BASE}/dashboard`);
  return res.json();
}
