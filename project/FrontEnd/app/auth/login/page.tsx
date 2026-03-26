'use client';

import { useState, Suspense } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';
import Link from 'next/link';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { useSearchParams } from 'next/navigation';

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
    <div
      className="min-h-screen flex items-center justify-center bg-cover bg-center px-4"
      style={{ backgroundImage: "url('/images/login-bg.jpg')" }}
    >
      <div className="w-full max-w-md bg-white rounded-sm shadow-2xl px-4 py-5 sm:px-8 sm:py-10">
        <a href="/" className="flex justify-center mb-3 sm:mb-4">
          <img src="/images/logo.png" alt="Logo" className="logo-container" />
        </a>

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
