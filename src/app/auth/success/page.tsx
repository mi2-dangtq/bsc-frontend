'use client';

import { useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

function AuthSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { setToken } = useAuth();

  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      setToken(token);
      router.replace('/');
    } else {
      router.replace('/login?error=no_token');
    }
  }, [searchParams, router, setToken]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p className="text-white text-lg">Đang đăng nhập...</p>
      </div>
    </div>
  );
}

export default function AuthSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    }>
      <AuthSuccessContent />
    </Suspense>
  );
}

