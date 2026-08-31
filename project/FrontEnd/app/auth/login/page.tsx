'use client';

import { useState, Suspense } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';
import Link from 'next/link';
import Image from 'next/image';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import React from 'react';

type LoginFlow = 'admin' | 'accountant' | 'investor';

const LOGIN_COPY: Record<LoginFlow, { title: string; subtitle: string }> = {
  admin: {
    title: 'Admin Log in',
    subtitle: 'Enter your administrator credentials to access the admin console.',
  },
  accountant: {
    title: 'Accountant Log in',
    subtitle: 'Sign in to access accounting workflows: reconciliation, NAV, funding, and redemptions.',
  },
  investor: {
    title: 'Log in',
    subtitle: 'Sign in to access assigned investor documents and tax workflows.',
  },
};

function LoginForm() {
  const { login } = useAuth();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  React.useEffect(() => {
    // Clear any stuck legacy localStorage items
    localStorage.removeItem('returnTo');
    
    const returnTo = sessionStorage.getItem('returnTo');
    if (returnTo && returnTo.includes('inviteToken')) {
      setError('Please sign in to view your investment invite.');
    }
  }, []);

  let flowParam = (searchParams.get('flow') || '').toLowerCase();
  if (flowParam === 'account') flowParam = 'accountant';
  const validFlows = ['admin', 'accountant', 'investor'];
  const flow: LoginFlow = validFlows.includes(flowParam) ? (flowParam as LoginFlow) : 'investor';
  const { title, subtitle } = LOGIN_COPY[flow];
  const signupHref =
    flow === 'investor'
      ? `/auth/investor-signup?flow=${searchParams.get('flow') || 'investor'}`
      : `/auth/signup?flow=${searchParams.get('flow') || flow}`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const roleMap: Record<string, string> = {
      admin: 'admin',
      accountant: 'accountant',
      investor: 'investor',
    };

    try {
      await login(email, password, roleMap[flow]);
    } catch (err: any) {
      setError(err?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col justify-between p-4 sm:p-6 overflow-x-hidden bg-[#0a192f]">
      {/* 🔹 Background Image (priority preloaded) */}
      <Image
        src="/images/login-bg.jpg"
        alt="Background"
        fill
        priority
        className="object-cover object-center z-0"
      />

      {/* Top Header outside card */}
      <header className="relative z-20 w-full flex flex-col min-[340px]:flex-row justify-between items-stretch min-[340px]:items-center gap-2 sm:gap-3">
        <div className="flex items-center gap-2 sm:gap-3 w-full min-[340px]:w-auto">
          <Link
            href="/auth/login?flow=investor"
            className={`flex-1 min-[340px]:flex-none text-center py-2 px-2 sm:px-4 text-xs sm:text-sm font-semibold rounded-md transition-all duration-200 shadow-md whitespace-nowrap ${flow === 'investor'
              ? 'bg-yellow-400 text-gray-900 border border-yellow-400'
              : 'bg-white/90 text-gray-800 hover:bg-white border border-gray-300 backdrop-blur-sm'
              }`}
          >
            Investor Login
          </Link>
          <Link
            href="/auth/login?flow=admin"
            className={`flex-1 min-[340px]:flex-none text-center py-2 px-2 sm:px-4 text-xs sm:text-sm font-semibold rounded-md transition-all duration-200 shadow-md whitespace-nowrap ${flow === 'admin'
              ? 'bg-yellow-400 text-gray-900 border border-yellow-400'
              : 'bg-white/90 text-gray-800 hover:bg-white border border-gray-300 backdrop-blur-sm'
              }`}
          >
            Admin Login
          </Link>
        </div>
        <a
          href="https://aetrust.aet.app/auth/login"
          target="_blank"
          rel="noopener noreferrer"
          className="w-full min-[340px]:w-auto text-center py-2 px-2.5 sm:px-4 text-xs sm:text-sm font-semibold rounded-md transition-all duration-200 shadow-md bg-yellow-400 text-gray-900 border border-yellow-400 hover:bg-yellow-500 whitespace-nowrap"
        >
          Go to IRA Portal
        </a>
      </header>

      {/* Centered Login Card Container */}
      <main className="relative z-10 flex-1 flex items-center justify-center py-6">
        <div className="w-full max-w-md bg-white rounded-sm shadow-2xl px-4 py-5 sm:px-8 sm:py-10">
          <div className="flex justify-center mb-3 sm:mb-4">
            <a href="/" className="inline-block">
              <Image
                src="/images/logo.png"
                alt="Logo"
                width={132}
                height={132}
                priority
                className="logo-container object-contain"
              />
            </a>
          </div>

          <h2 className="text-center text-xl sm:text-3xl font-semibold text-[#1F1F1F]">
            {title}
          </h2>
          <p className="mt-1 text-center text-md sm:text-xl">
            {subtitle}
          </p>

          <form onSubmit={handleSubmit} className="mt-6 sm:space-y-5 space-y-4">
            <div>
              <label className="block font-helvetica font-medium text-sm sm:text-md text-[#4B4B4B] mb-1">Email</label>
              <input
                type="email"
                placeholder="Enter email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                className="w-full font-helvetica text-xs sm:text-sm rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
              />
            </div>

            <div>
              <label className="block font-helvetica font-medium text-sm sm:text-md text-[#4B4B4B] mb-1">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  className="w-full font-helvetica text-xs sm:text-sm rounded-md border px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-3 flex items-center text-gray-400"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="text-sm text-red-600 text-center">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-6 flex justify-center items-center rounded-full bg-yellow-400 py-2.5 text-sm font-medium text-gray-900 hover:bg-yellow-500 transition"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? 'Logging in...' : 'Log In'}
            </button>
          </form>

          <div className="mt-4 text-center">
            <Link
              href={`/auth/forgot-password?flow=${searchParams.get('flow') || 'investor'}`}
              className="block text-center font-goudy text-md sm:text-lg"
            >
              Forgot Password?
            </Link>
          </div>
          <div className="mt-4 text-center font-goudy text-md sm:text-lg">
            <span className="mr-1">Don't have an account? </span>
            <Link href={signupHref} className="font-medium text-yellow-600 hover:underline">
              Sign up
            </Link>
          </div>
        </div>
      </main>

      {/* Bottom spacer for vertical balance */}
      <div className="relative z-20 h-6 sm:h-8" />
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#F1F1F1] px-4">
        <Loader2 className="h-8 w-8 animate-spin text-yellow-500" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
