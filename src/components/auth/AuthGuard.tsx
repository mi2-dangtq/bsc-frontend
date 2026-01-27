'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

// Routes that don't require authentication
const PUBLIC_ROUTES = ['/login', '/auth/success'];

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const isPublicRoute = PUBLIC_ROUTES.some(route => pathname.startsWith(route));

  useEffect(() => {
    // Don't redirect while still loading auth state
    if (isLoading) return;

    // If not authenticated and trying to access protected route
    if (!isAuthenticated && !isPublicRoute) {
      router.replace('/login');
    }

    // If authenticated and on login page, redirect to home
    if (isAuthenticated && pathname === '/login') {
      router.replace('/');
    }
  }, [isAuthenticated, isLoading, isPublicRoute, pathname, router]);

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <span className="text-sm text-muted-foreground">Đang tải...</span>
        </div>
      </div>
    );
  }

  // For public routes, always render
  if (isPublicRoute) {
    return <>{children}</>;
  }

  // For protected routes, only render if authenticated
  if (!isAuthenticated) {
    return null; // Will redirect in useEffect
  }

  return <>{children}</>;
}
