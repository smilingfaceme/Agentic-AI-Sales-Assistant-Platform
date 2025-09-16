
const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5000/api';

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
		body: JSON.stringify({name, email, password })
	});
	return res.json();
}

export async function getDashboardData(token?: string) {
	const res = await fetch(`${API_BASE}/dashboard`, {
		headers: token ? { 'Authorization': `Bearer ${token}` } : {}
	});
	return res.json();
}
