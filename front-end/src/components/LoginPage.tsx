"use client";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { login, setCookie, forget_password } from "@/utils";
import Loading from "@/components/Loading";
import { useRouter } from "next/navigation";
import { useAppContext } from "@/contexts/AppContext";
import { useNotification } from '@/contexts/NotificationContext';

export default function LoginPage() {
  const router = useRouter();
  const { setCompanyId, setCurrentUser } = useAppContext();
  const { showNotification} = useNotification();
  // User Info States
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotPasswordMessage, setForgotPasswordMessage] = useState("");
  const [forgotPasswordError, setForgotPasswordError] = useState("");
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false);

  // Login Function
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await login(email, password);
      if (res.token) {
        // Save token to cookie instead of localStorage
        setCookie("auth_token", res.token, 1);
        setCookie("user", res.user, 1); // Store for 7 days
        setCompanyId(res.user.company_id);
        setCurrentUser(res.user);
        router.push("/dashboard/chats");
      } else {
        setError(res.message || "Login failed");
      }
    } catch {
      setError("Login failed");
    } finally {
      setLoading(false);
    }
  }

  // Forgot Password Function
  async function handleForgotPassword(e: React.FormEvent) {
    e.preventDefault();
    setForgotPasswordError("");
    setForgotPasswordMessage("");
    setForgotPasswordLoading(true);
    try {
      const res = await forget_password(forgotEmail);
      if (res.success) {
        showNotification("Password reset link has been sent to your email. Please check your inbox.", 'success', true)
        setForgotEmail("");
      } else {
        setForgotPasswordError(res.message || "Failed to send reset link");
      }
    } catch {
      setForgotPasswordError("Failed to send reset link. Please try again.");
    } finally {
      setForgotPasswordLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-tr from-blue-50 via-purple-50 to-pink-50">
      {/* Login Modal */}
      {!showForgotPassword && (<div className="m-2 w-full max-w-md bg-white rounded-xl shadow-lg p-8 flex flex-col items-center">
        <Link href="/" className="mb-4">
          <Image
            src="/logo.svg"
            alt="DoshiAI Logo"
            width={120}
            height={120}
          />
        </Link>
        <h1 className="text-2xl md:text-3xl font-extrabold text-gray-700 mb-2">Login to DoshiAI</h1>
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
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-900"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <div className="flex justify-between items-center mb-1">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
              <button
                type="button"
                onClick={() => setShowForgotPassword(true)}
                className="text-xs text-blue-600 hover:text-blue-800 hover:underline"
              >
                Forgot Password?
              </button>
            </div>
            <input
              type="password"
              id="password"
              name="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-900"
              placeholder="••••••••"
            />
          </div>
          {error == "Email not confirmed" ? (
            <div className="text-blue-500 text-sm">Please check your email and confirm your email.</div>
          ) : error && <div className="text-red-500 text-sm">{error}</div>}
          <button
            type="submit"
            className="w-full py-3 mt-2 rounded-lg bg-black text-white font-bold hover:bg-gray-300 hover:text-black focus:outline-none focus:ring-2 focus:ring-white transition-all"
            disabled={loading}
          >
            <Loading isLoading={loading} type="button" text="Logging in..." theme="dark">
              Login
            </Loading>
          </button>
        </form>
        <div className="mt-6 text-sm text-gray-600">
          Don&apos;t have an account? <a href="/auth/register" className="text-blue-600 font-semibold hover:underline">Register</a>
        </div>
      </div>
      )}

      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
          <div className="m-2 w-full max-w-md bg-white rounded-xl shadow-lg p-8 flex flex-col items-center">
            <Link href="/" className="mb-4">
              <Image
                src="/logo.svg"
                alt="DoshiAI Logo"
                width={120}
                height={120}
              />
            </Link>
            <h1 className="text-2xl md:text-3xl font-extrabold text-gray-700 mb-2">Reset Password</h1>
            <p className="text-gray-400 mb-6 text-center">
              Enter your email address and we&apos;ll send you a link to reset your password.
            </p>
            <form onSubmit={handleForgotPassword} className="w-full flex flex-col gap-4">
              <div>
                <label htmlFor="forgot-email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  id="forgot-email"
                  required
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-900"
                  placeholder="you@example.com"
                />
              </div>
              {forgotPasswordError && (
                <div className="text-red-500 text-sm">{forgotPasswordError}</div>
              )}
              {forgotPasswordMessage && (
                <div className="text-green-500 text-sm">{forgotPasswordMessage}</div>
              )}
              <button
                type="submit"
                disabled={forgotPasswordLoading}
                className="w-full py-3 mt-2 rounded-lg bg-black text-white font-bold hover:bg-gray-300 hover:text-black focus:outline-none focus:ring-2 focus:ring-white transition-all disabled:opacity-50"
              >
                <Loading isLoading={forgotPasswordLoading} type="button" text="Sending..." theme="dark">
                  Send Reset Link
                </Loading>
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForgotPassword(false);
                  setForgotEmail("");
                  setForgotPasswordMessage("");
                  setForgotPasswordError("");
                }}
                className="w-full py-2 rounded-lg border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-300 transition-all"
              >
                Cancel
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
