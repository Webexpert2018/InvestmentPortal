'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';

export default function SignupPage() {
  const { signup } = useAuth();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    phone: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      await signup({
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone || undefined,
      });
    } catch (err: any) {
      setError(err?.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-cover bg-center px-4"
      style={{ backgroundImage: "url('/images/login-bg.jpg')" }}
    >
      <div className="w-full max-w-md bg-white rounded-xl shadow-2xl px-8 py-10">
        
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <img
            src="/images/logo.png"
            alt="Logo"
            width={140}
            height={40}
          />
        </div>

        {/* Title */}
        <h2 className="text-center text-2xl font-semibold text-gray-900">
          Create Account
        </h2>
        <p className="mt-1 text-center text-sm text-gray-500">
          Start your Bitcoin IRA investment journey
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <input
              name="firstName"
              placeholder="First name"
              value={formData.firstName}
              onChange={handleChange}
              required
              disabled={loading}
              className="w-full rounded-md border px-3 py-2 text-sm"
            />
            <input
              name="lastName"
              placeholder="Last name"
              value={formData.lastName}
              onChange={handleChange}
              required
              disabled={loading}
              className="w-full rounded-md border px-3 py-2 text-sm"
            />
          </div>

          <input
            type="email"
            name="email"
            placeholder="Email address"
            value={formData.email}
            onChange={handleChange}
            required
            disabled={loading}
            className="w-full rounded-md border px-3 py-2 text-sm"
          />

          <input
            type="tel"
            name="phone"
            placeholder="Phone (optional)"
            value={formData.phone}
            onChange={handleChange}
            disabled={loading}
            className="w-full rounded-md border px-3 py-2 text-sm"
          />

          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            required
            disabled={loading}
            className="w-full rounded-md border px-3 py-2 text-sm"
          />

          <input
            type="password"
            name="confirmPassword"
            placeholder="Confirm password"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
            disabled={loading}
            className="w-full rounded-md border px-3 py-2 text-sm"
          />

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center rounded-full bg-yellow-400 py-2 text-sm font-medium text-black hover:bg-yellow-500"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {loading ? 'Creating account...' : 'Sign Up'}
          </button>
        </form>

        {/* Footer */}
        <p className="mt-6 text-center text-sm text-gray-600">
          Already have an account?{' '}
          <Link href="/auth/login" className="font-medium text-yellow-600 hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
