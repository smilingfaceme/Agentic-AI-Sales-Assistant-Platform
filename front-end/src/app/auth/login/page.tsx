'use client'
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { login } from "@/utils";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await login(email, password);
      if (res.token) {
        // Save token to localStorage or cookie
        localStorage.setItem("token", res.token);
        window.location.href = "/dashboard";
      } else {
        setError(res.message || "Login failed");
      }
    } catch {
      setError("Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-tr from-blue-50 via-purple-50 to-pink-50">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8 flex flex-col items-center">
        <Link href="/" className="mb-4">
          <Image
            src="/logo.svg"
            alt="DoshiAI Logo"
            width={96}
            height={96}
            className="mb-4"
          />
        </Link>
        <h1 className="text-3xl font-extrabold text-gray-700 mb-2">Login to DoshiAI</h1>
        <p className="text-gray-400 mb-6 text-center">
          Welcome back! Please enter your credentials to continue.
        </p>
        <form className="w-full flex flex-col gap-4" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-900"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-900"
              placeholder="••••••••"
            />
          </div>
          {error && <div className="text-red-500 text-sm">{error}</div>}
          <button
            type="submit"
            className="w-full py-3 mt-2 rounded-lg bg-black text-white font-bold shadow-none hover:bg-white hover:text-black hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-white transition-all"
            disabled={loading}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
        <div className="mt-6 text-sm text-gray-600">
          Don&apos;t have an account? <a href="/auth/register" className="text-blue-600 font-semibold hover:underline">Register</a>
        </div>
      </div>
    </div>
  );
}
