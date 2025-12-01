"use client";
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAppContext, User } from '@/contexts/AppContext';
import { isAuthenticated, getCookie } from '@/utils';
import Loading from '@/components/Loading';

interface PermissionWrapperProps {
  children: React.ReactNode;
}

// Define protected routes and their required permissions
const PROTECTED_ROUTES = {
  '/dashboard/chats': ['chat'],
  '/dashboard/customer': ['customer'],
  '/dashboard/chatbot/knowledge/product': ['knowledge'],
  '/dashboard/chatbot/knowledge/image': ['knowledge'],
  '/dashboard/chatbot/knowledge': ['knowledge'],
  '/dashboard/chatbot/unanswered': ['conversation'],
  '/dashboard/chatbot/test': ['knowledge', 'conversation'],
  '/dashboard/go-live': ['integration'],
  '/dashboard/settings/company': ['company'],
  '/dashboard/settings/invite': ['invite'],
} as const;

const REDIRECT_ROUTES = {
  '/dashboard/chats': '/dashboard/chatbot/knowledge',
  '/dashboard/customer': '/dashboard/chatbot/knowledge',
  '/dashboard/chatbot/knowledge': '/dashboard/chatbot/unanswered',
  '/dashboard/chatbot/unanswered': '/dashboard/chatbot/knowledge',
  '/dashboard/go-live': '/dashboard/chatbot/knowledge',
  '/dashboard/settings/company': '/dashboard/settings/user',
  '/dashboard/settings/invite': '/dashboard/settings/user',
} as const;

// Public routes that don't require authentication
const PUBLIC_ROUTES = ['/', '/auth/login', '/auth/register', '/accept-invite', 'reset-password', '/dashboard/settings/user', '/dashboard/chatbot', '/dashboard/sustainability'];

export default function PermissionWrapper({ children }: PermissionWrapperProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { currentUser, setCurrentUser } = useAppContext();
  const [isChecking, setIsChecking] = useState(true);
  const [hasPermission, setHasPermission] = useState(false);

  const getRequiredPermissions = (path: string): string[] => {
    const matchingRoute = Object.keys(PROTECTED_ROUTES)
      .filter(route => path.startsWith(route))
      .sort((a, b) => b.length - a.length)[0];

    return matchingRoute ? [...PROTECTED_ROUTES[matchingRoute as keyof typeof PROTECTED_ROUTES]] : [];
  };

  const hasRequiredPermissions = (requiredPermissions: string[]): boolean => {
    if (!currentUser.permissions || typeof currentUser.permissions !== 'object') {
      return false;
    }

    return requiredPermissions.some(permission =>
      (currentUser.permissions as Record<string, boolean>)[permission] === true
    );
  };

  const checkPermissions = async () => {
    setIsChecking(true);

    // Check if route is public
    if (PUBLIC_ROUTES.some(route => pathname.endsWith(route))) {
      setHasPermission(true);
      setIsChecking(false);
      return;
    }
    // Check authentication
    if (!isAuthenticated()) {
      router.push('/auth/login');
      return;
    }

    // Load user if not already loaded
    if (currentUser.email == "") {
      const user: User | null = getCookie<User>("user");
      if (user) {
        setCurrentUser(user)
      } else {
        router.push('/auth/login')
      }
    }
    // Check route permissions
    const requiredPermissions = getRequiredPermissions(pathname);
    if (requiredPermissions.length > 0 && !hasRequiredPermissions(requiredPermissions)) {
      // Redirect to dashboard or show unauthorized
      const redirect_route = REDIRECT_ROUTES[pathname as keyof typeof REDIRECT_ROUTES]
      router.push(redirect_route)
      return;
    }

    setHasPermission(true);
    setIsChecking(false);
  };

  useEffect(() => {
    checkPermissions();
  }, [pathname, currentUser]);

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loading isLoading={true} text="Loading..." />
      </div>
    );
  }

  if (!hasPermission) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600">You dont have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}