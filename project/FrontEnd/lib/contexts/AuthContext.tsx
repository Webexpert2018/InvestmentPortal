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
  profileImageUrl?: string;
  kycStatus?: string;
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
  refreshUser: () => Promise<void>;
  updateUser: (updates: Partial<User>) => void;
  profileTimestamp: number;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionExpired, setSessionExpired] = useState(false);
  const [profileTimestamp, setProfileTimestamp] = useState(Date.now());
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
     // console.log('[AuthContext] Fetched user data:', userData);
      setUser(userData);
      setProfileTimestamp(Date.now());
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

    router.push('/dashboard');
  };

  const signup = async (data: any) => {
    const { user: userData, token } = await apiClient.signup(data);
    localStorage.setItem('token', token);
    setUser(userData);
    setSessionExpired(false);

    router.push('/dashboard');
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
    refreshUser: loadUser,
    updateUser: (updates: Partial<User>) => {
      setUser(prev => {
        if (!prev) return null;
        const newUser = { ...prev, ...updates };
        //console.log('[AuthContext] Manually updating user:', newUser);
        return newUser;
      });
      if (updates.profileImageUrl) {
        setProfileTimestamp(Date.now());
      }
    },
    profileTimestamp,
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
