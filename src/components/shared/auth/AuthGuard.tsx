import React, { useEffect } from 'react';
import { useRouter } from '../../../core/router/RouterContext';
import { useAuth } from '../../../core/auth/AuthContext';
import { Navigate } from 'react-router-dom'; // Assuming we're using react-router-dom

interface AuthGuardProps {
  children: React.ReactNode;
  // If true, redirects to login if NOT authenticated (default behavior)
  // If false, redirects away from protected routes if authenticated
  requireAuth?: boolean;
  // Where to redirect if auth check fails
  redirectTo?: string;
  // Where to redirect if already authenticated (when requireAuth=false)
  redirectIfAuthenticated?: string;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ 
  children, 
  requireAuth = true, 
  redirectTo = '/login',
  redirectIfAuthenticated = '/dashboard'
}) => {
  const { navigate } = useRouter();
  const { isAuthenticated, isAdmin, isLoading } = useAuth();
  
  // For simplicity in this implementation, we'll use the router context's navigate function
  // In a real react-router-dom implementation, we'd use Navigate component

  useEffect(() => {
    if (isLoading) return;

    if (requireAuth) {
      // Require authentication - redirect to login if not authenticated
      if (!isAuthenticated) {
        // Store current path to redirect back after login
        // This would be handled by the router context in the actual implementation
        navigate(`${redirectTo}?redirect=${encodeURIComponent(window.location.pathname)}`, { replace: true });
      }
    } else {
      // Require guest access - redirect away if authenticated
      if (isAuthenticated) {
        navigate(redirectIfAuthenticated, { replace: true });
      }
    }
  }, [isAuthenticated, isLoading, navigate, requireAuth, redirectTo, redirectIfAuthenticated]);

  // Return null during loading to prevent flashing
  if (isLoading) {
    return null;
  }

  return children;
};
