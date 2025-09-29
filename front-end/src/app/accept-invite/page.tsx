"use client";

import { useState, useEffect } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useAppContext } from '@/contexts/AppContext';
import { useApiCall } from "@/hooks/useApiCall";
import Loading from "@/components/Loading";

export default function AcceptInvitePage() {
  const router = useRouter();
  const { isLoading: isAcceptingInvitation, error: AcceptInvitationError, execute: executeAcceptAsync } = useApiCall();
  const { setCompanyId, setCurrentUser } = useAppContext();

  // Get Invitation Token from url
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  // Loading and error states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [acceptError, setAcceptError] = useState<string | null>(null);

  // User Info State
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [invite, setInvite] = useState<null | {
    invitedEmail: string;
    companyName: string;
    role: string;
  }>(null);

  // Validate invite when page loads
  useEffect(() => {
    if (!token) {
      setError("No invitation token found.");
      setLoading(false);
      return;
    }

    async function fetchInvite() {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE}/invite/validate?token=${token}`
        );
        const data = await res.json();
        if (!res.ok || !data.valid) {
          setError("Invalid or expired invitation.");
        } else {
          setInvite({
            invitedEmail: data.invitedEmail,
            companyName: data.companyName,
            role: data.role,
          });
        }
      } catch {
        setError("Failed to validate invitation.");
      } finally {
        setLoading(false);
      }
    }

    fetchInvite();
  }, [token]);

  // Password strength check (at least 8 chars, 1 number, 1 letter)
  function isStrongPassword(pw: string) {
    return pw.length >= 8 && /[A-Za-z]/.test(pw) && /[0-9]/.test(pw);
  }

  // Accpet Invitation
  async function handleAccept(e: React.FormEvent) {
    setAcceptError("")
    e.preventDefault();
    if (!token) return;
    let valid = true;

    if (password !== confirmPassword) {
      valid = false;
    }
    if (!isStrongPassword(password)) {
      valid = false;
    }
    if (valid) {
      const result = await executeAcceptAsync(async () => {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/invite/complete`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, name, password }),
        });
        const data = await res.json();
        return data;
      });
      if (result.token) {
        // Save token in localStorage (or cookie) for authentication
        const { setCookie } = await import("@/utils");
        setCookie("auth_token", result.token, 1);
        setCookie("user", result.user, 1) // Store for 1 days
        setCompanyId(result.user.company_id);
        setCurrentUser(result.user);
        router.push("/dashboard/chats")
      } else {
        setAcceptError("Your invitation could not be accepted. Check your invitation and your profile.")
      }
    }

  }

  if (loading) {
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
          <Loading isLoading={true} text="Validating invitation..."></Loading>
        </div>
      </div>
    )
  };

  if (error) {
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
          <h1 className="text-xl md:text-2xl font-extrabold text-red-700 mb-4">{error}</h1>
          <p className="text-gray-600 mb-6 text-center">
            It looks like your invitation can’t be used anymore. Please ask the person who invited you to resend the invitation.
          </p>
          <Link href="/" className="mb-4">
            <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
              Go Home
            </button>
          </Link>
        </div>
      </div>
    )
  };

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
        <h1 className="text-2xl md:text-3xl font-extrabold text-gray-700 mb-2">Accept Invitation</h1>
        <div className="text-gray-400 mb-6 text-center">
            You’ve been invited to join <b>{invite?.companyName}</b> as{" "}
            <b>{invite?.role}</b>.
          <p>Email: <b>{invite?.invitedEmail}</b></p>
        </div>
        <form className="w-full flex flex-col gap-4" onSubmit={handleAccept}>
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Your Name</label>
            <input
              type="name"
              id="name"
              name="name"
              required
              placeholder="Enter your full name"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-900"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
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
          {error == "Email not confirmed" ? (
            <div className="text-blue-500 text-sm">Please check your email and confirm your email.</div>
          ) : error && <div className="text-red-500 text-sm">{error.split(':')[1]}</div>}
          {acceptError && (
            <div className="text-red-600 text-sm bg-red-50 p-3 rounded">{acceptError}</div>
          )}
          {AcceptInvitationError && (
            <div className="text-red-600 text-sm bg-red-50 p-3 rounded">{AcceptInvitationError}</div>
          )}
          <button
            type="submit"
            disabled={isAcceptingInvitation}
            className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >

            <Loading isLoading={isAcceptingInvitation} type="button" text="Accepting..." theme="dark">
              Accept Invitation
            </Loading>
          </button>
        </form>

      </div>
    </div>
  );
}
