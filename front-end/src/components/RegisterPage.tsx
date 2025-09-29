"use client";
import React from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAppContext } from '@/contexts/AppContext';

export default function RegisterPage() {
  const router = useRouter();
  const { setCompanyId, setCurrentUser } = useAppContext();
  // State for form fields and validation
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [company, setCompany] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [emailError, setEmailError] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);

  // Email validation regex
  function validateEmail(email: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  // Password strength check (at least 8 chars, 1 number, 1 letter)
  function isStrongPassword(pw: string) {
    return pw.length >= 8 && /[A-Za-z]/.test(pw) && /[0-9]/.test(pw);
  }

  // Loading and error states
  const [loading, setLoading] = React.useState(false);
  const [registerError, setRegisterError] = React.useState("");
  const [success, setSuccess] = React.useState(false);

  // Register Function
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    let valid = true;
    setEmailError("");
    setRegisterError("");
    setSuccess(false);

    if (!validateEmail(email)) {
      setEmailError("Please enter a valid email address.");
      valid = false;
    }
    if (password !== confirmPassword) {
      valid = false;
    }
    if (!isStrongPassword(password)) {
      valid = false;
    }
    if (valid) {
      setLoading(true);
      try {
        const res = await import("@/utils").then(m => m.register(name, email, company, description, password));
        if (res.token) {
          // Save token to cookie instead of localStorage
          const { setCookie } = await import("@/utils");
          setCookie("auth_token", res.token, 1);
          setCookie("user", res.user, 1) // Store for 7 days
          setCompanyId(res.user.company_id);
          setCurrentUser(res.user);
          router.push("/dashboard/chats")
        } else {
          setRegisterError(res.message || "Registration failed");
        }
      } catch {
        setRegisterError("Registration failed");
      } finally {
        setLoading(false);
      }
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-tr from-blue-50 via-purple-50 to-pink-50">
      <div className="m-2 w-full max-w-md bg-white rounded-xl shadow-lg p-8 flex flex-col items-center">
        <Link href="/" className="mb-4">
          <Image
            src="/logo.svg"
            alt="DoshiAI Logo"
            width={120}
            height={120}
          />
        </Link>
        <h1 className="text-2xl md:text-3xl font-extrabold text-gray-700 mb-2">Create your account</h1>
        <p className="text-gray-400 mb-6 text-center">Sign up to get started with DoshiAI.</p>
        <form className="w-full flex flex-col gap-4" onSubmit={handleSubmit}>
          {/* User Full Name*/}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              id="name"
              name="name"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-900"
              placeholder="Your Name"
            />
          </div>
          {/* User Email*/}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              className={`w-full px-4 py-2 border ${emailError ? 'border-red-400' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-900`}
              placeholder="you@example.com"
            />
            {emailError && (
              <div className="text-red-500 text-xs mt-1">{emailError}</div>
            )}
          </div>
          {/* Company Name*/}
          <div>
            <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
            <input
              type="company"
              id="company"
              name="company"
              required
              value={company}
              onChange={e => setCompany(e.target.value)}
              className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-900`}
              placeholder="Company Name"
            />
          </div>
          {/* Company Description*/}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Company Description</label>
            <input
              type="description"
              id="description"
              name="description"
              required={false}
              value={description}
              onChange={e => setDescription(e.target.value)}
              className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-900`}
              placeholder="Company Description"
            />
          </div>
          {/* Password*/}
          <div>
            <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-900"
                placeholder="Enter new password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
            {password && !isStrongPassword(password) && (
              <p className="text-xs text-red-500 mt-1">
                Password must be at least 8 characters with uppercase, lowercase, and number
              </p>
            )}
          </div>
          {/* Confirm Password*/}
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
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
            {confirmPassword && password !== confirmPassword && (
              <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
            )}
          </div>
          {registerError && <div className="text-red-500 text-sm">{registerError}</div>}
          {success && <div className="text-green-600 text-sm">Registration successful! You can now login.</div>}
          <button
            type="submit"
            className="w-full py-3 mt-2 rounded-lg bg-black text-white font-bold shadow-none hover:bg-gray-300 hover:text-black hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-white transition-all"
            disabled={loading}
          >
            {loading ? "Registering..." : "Register"}
          </button>
        </form>
        <div className="mt-6 text-sm text-gray-600">
          Already have an account? <a href="/auth/login" className="text-blue-600 font-semibold hover:underline">Login</a>
        </div>
      </div>
    </div>
  );
}
