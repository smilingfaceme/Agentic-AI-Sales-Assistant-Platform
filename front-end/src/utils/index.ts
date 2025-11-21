// For Node.js:
import { createHash } from 'crypto';

export function hashPassword(password:string) {
  return createHash('sha256').update(password, 'utf8').digest('hex');
}

export const API_BASE = process.env.NEXT_PUBLIC_API_BASE;

// Cookie utility functions with JSON support
export function setCookie(name: string, value: unknown, days: number = 7) {
  if (typeof window !== 'undefined') {
    const expires = new Date();
    expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);

    const stringValue = encodeURIComponent(JSON.stringify(value));

    document.cookie =
      `${name}=${stringValue};expires=${expires.toUTCString()};path=/;SameSite=Strict;` +
      (window.location.protocol === 'https:' ? 'Secure;' : '');
  }
}

export function getCookie<T = unknown>(name: string): T | null {
  if (typeof window !== 'undefined') {
    const nameEQ = name + '=';
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
      const c = ca[i].trim();
      if (c.indexOf(nameEQ) === 0) {
        try {
          return JSON.parse(decodeURIComponent(c.substring(nameEQ.length)));
        } catch {
          return null;
        }
      }
    }
  }
  return null;
}

export function deleteCookie(name: string) {
  if (typeof window !== 'undefined') {
    document.cookie =
      `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;SameSite=Strict;` +
      (window.location.protocol === 'https:' ? 'Secure;' : '');
  }
}


// Helper to get token from cookies (updated from localStorage)
function getToken() {
  return getCookie('auth_token');
}

// Helper to check if user is authenticated
export function isAuthenticated(): boolean {
  return !!getToken();
}

// Helper to handle API requests with token and redirect on 401/403
export async function apiRequest(input: RequestInfo, init: RequestInit = {}) {
  const token = getToken();
  const headers = {
    ...(init.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
  const res = await fetch(`${API_BASE}${input}`, { ...init, headers });
  if (res.status === 401 || res.status === 403) {
    if (typeof window !== 'undefined') {
      // Clear the invalid token from cookies
      deleteCookie('auth_token');
      window.location.href = '/auth/login';
    }
    throw new Error('Unauthorized');
  }
  return res;
}

// Logout function
export function logout() {
  deleteCookie('auth_token');
  if (typeof window !== 'undefined') {
    window.location.href = '/';
  }
}


export async function login(email: string, password: string) {
  const hashed_password = hashPassword(password);
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, 'password':hashed_password })
  });
  return res.json();
}

export async function forget_password(email: string) {
  const res = await fetch(`${API_BASE}/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
  });
  return res.json();
}

export async function register(name: string, email: string, company:string, description:string, password: string) {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, company, description, password })
  });
  return res.json();
}


export async function getDashboardData() {
  const res = await apiRequest(`/dashboard`);
  return res.json();
}
