'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';
import Link from 'next/link';
import Image from 'next/image';
import { Eye, EyeOff, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await login(email, password);
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
      <div className="w-full max-w-md bg-white rounded-lg shadow-2xl px-8 py-10">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <img src="/images/logo.png" alt="Logo" width={140} height={40} />
        </div>

        {/* Heading */}
        <h2 className="text-center text-xl font-semibold text-gray-900">
          Admin Log in
        </h2>
        <p className="mt-1 text-center text-sm text-gray-500">
          Sign in to access assigned investor documents <br />
          and tax workflows.
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {/* Email */}
          <div>
            <label className="block text-sm text-gray-600 mb-1">Email</label>
            <input
              type="email"
              placeholder="Enter email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm text-gray-600 mb-1">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                className="w-full rounded-md border px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
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

          {/* Error */}
          {error && (
            <div className="text-sm text-red-600 text-center">
              {error}
            </div>
          )}

          {/* Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 flex justify-center items-center rounded-full bg-yellow-400 py-2.5 text-sm font-medium text-gray-900 hover:bg-yellow-500 transition"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {loading ? 'Logging in...' : 'Log In'}
          </button>
        </form>

        {/* Forgot */}
        <div className="mt-4 text-center">
          <Link
            href="/auth/forgot-password"
            className="text-sm text-gray-600 hover:text-gray-900 text-center block"
          >
            Forgot Password?
          </Link>
        </div>
        <div className="mt-6 text-center text-sm">
            <span className="text-slate-600">Don't have an account? </span>
            <Link href="/auth/signup" className="font-medium text-yellow-600 hover:underline">
              Sign up
            </Link>
          </div>
      </div>
    </div>
  );
}
