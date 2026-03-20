'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiClient } from '../api/client';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  phone?: string;
  dob?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  taxId?: string;
  createdAt?: string;
  status?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string, role?: string) => Promise<void>;
  signup: (data: any) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isAccountant: boolean;
  sessionExpired: boolean;
  setSessionExpired: (expired: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionExpired, setSessionExpired] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      loadUser();
    } else {
      setLoading(false);
    }
  }, []);

  const loadUser = async () => {
    try {
      const userData = await apiClient.getProfile();
      setUser(userData);
      setSessionExpired(false);
    } catch (error) {
      setSessionExpired(true);
      localStorage.removeItem('token');
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string, role?: string) => {
    const { user: userData, token } = await apiClient.login(email, password, role);
    localStorage.setItem('token', token);
    setUser(userData);
    setSessionExpired(false);

    if (userData.role === 'admin') {
      router.push('/admin');
    } else if (userData.role === 'accountant' || userData.role === 'account') {
      router.push('/admin/compliance');
    } else {
      router.push('/dashboard');
    }
  };

  const signup = async (data: any) => {
    const { user: userData, token } = await apiClient.signup(data);
    localStorage.setItem('token', token);
    setUser(userData);
    setSessionExpired(false);
    
    if (userData.role === 'admin') {
      router.push('/admin');
    } else if (userData.role === 'accountant' || userData.role === 'account') {
      router.push('/admin/compliance');
    } else {
      router.push('/dashboard');
    }
  };

  const logout = () => {
    const role = user?.role;
    localStorage.removeItem('token');
    setUser(null);
    setSessionExpired(false);
    
    if (role === 'admin') {
      router.push('/auth/login?flow=admin');
    } else if (role === 'accountant' || role === 'account') {
      router.push('/auth/login?flow=account');
    } else {
      router.push('/auth/login?flow=investor');
    }
  };

  const value = {
    user,
    loading,
    login,
    signup,
    logout,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    isAccountant: user?.role === 'accountant' || user?.role === 'account',
    sessionExpired,
    setSessionExpired,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
