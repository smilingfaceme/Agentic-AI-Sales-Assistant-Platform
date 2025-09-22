"use client";
import React from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  // State for form fields and validation
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [emailError, setEmailError] = React.useState("");
  const [passwordMatchError, setPasswordMatchError] = React.useState("");
  const [passwordWeakError, setPasswordWeakError] = React.useState(false);
  const [showWeakPassword, setShowWeakPassword] = React.useState(false);

  // Email validation regex
  function validateEmail(email: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  // Password strength check (at least 8 chars, 1 number, 1 letter)
  function isStrongPassword(pw: string) {
    return pw.length >= 8 && /[A-Za-z]/.test(pw) && /[0-9]/.test(pw);
  }

  const [loading, setLoading] = React.useState(false);
  const [registerError, setRegisterError] = React.useState("");
  const [success, setSuccess] = React.useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    let valid = true;
    setEmailError("");
    setPasswordMatchError("");
    setRegisterError("");
    setSuccess(false);

    if (!validateEmail(email)) {
      setEmailError("Please enter a valid email address.");
      valid = false;
    }
    if (password !== confirmPassword) {
      setPasswordMatchError("Passwords do not match.");
      valid = false;
    }
    if (!isStrongPassword(password)) {
      setPasswordWeakError(true)
      valid = false;
    }
    if (valid) {
      setLoading(true);
      try {
        const res = await import("@/utils").then(m => m.register(name, email, password));
        if (res.token) {
          // Save token to localStorage or cookie
          localStorage.setItem("token", res.token);
          window.location.href = "/dashboard";
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

  React.useEffect(() => {
    setShowWeakPassword(password.length > 0 && !isStrongPassword(password));
  }, [password]);

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
        <h1 className="text-3xl font-extrabold text-gray-700 mb-2">Create your account</h1>
        <p className="text-gray-400 mb-6 text-center">Sign up to get started with DoshiAI.</p>
        <form className="w-full flex flex-col gap-4" onSubmit={handleSubmit}>
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
            {showWeakPassword && (
              <div className={`${passwordWeakError ? 'text-red-500' : 'text-gray-500'} text-gray-500 text-xs mt-1`}>It would be better if your password is strong (at least 8 characters, with letters and numbers).</div>
            )}
          </div>
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              required
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              className={`w-full px-4 py-2 border ${passwordMatchError ? 'border-red-400' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-900`}
              placeholder="••••••••"
            />
            {passwordMatchError && (
              <div className="text-red-500 text-xs mt-1">{passwordMatchError}</div>
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
