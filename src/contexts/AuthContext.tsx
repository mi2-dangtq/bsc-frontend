'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: () => void;
  logout: () => void;
  setToken: (token: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001').replace(/\/$/, '');

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setTokenState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load token from localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('bsc_token');
    if (storedToken) {
      setTokenState(storedToken);
      // Decode JWT to get user info (simple decode without verification)
      try {
        const payload = JSON.parse(atob(storedToken.split('.')[1]));
        setUser({
          id: payload.sub,
          email: payload.email,
          firstName: payload.firstName,
          lastName: payload.lastName,
        });
      } catch (error) {
        console.error('Failed to decode token:', error);
        localStorage.removeItem('bsc_token');
      }
    }
    setIsLoading(false);
  }, []);

  const setToken = useCallback((newToken: string) => {
    localStorage.setItem('bsc_token', newToken);
    setTokenState(newToken);
    
    // Decode JWT to get user info
    try {
      const payload = JSON.parse(atob(newToken.split('.')[1]));
      setUser({
        id: payload.sub,
        email: payload.email,
        firstName: payload.firstName,
        lastName: payload.lastName,
      });
    } catch (error) {
      console.error('Failed to decode token:', error);
    }
  }, []);

  const login = useCallback(() => {
    // Redirect to backend OAuth endpoint
    window.location.href = `${API_BASE_URL}/auth/bitrix24`;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('bsc_token');
    setTokenState(null);
    setUser(null);
    window.location.href = '/login';
  }, []);

  const value = useMemo(() => ({
    user,
    token,
    isAuthenticated: !!token && !!user,
    isLoading,
    login,
    logout,
    setToken,
  }), [user, token, isLoading, login, logout, setToken]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
