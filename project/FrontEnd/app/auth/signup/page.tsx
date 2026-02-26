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
      <div className="w-full max-w-md bg-white rounded-sm shadow-2xl px-4 py-5 sm:px-8 sm:py-10">
        
        {/* Logo */}
        <a href="/" className="flex justify-center mb-3 sm:mb-4">
          <img
            src="/images/logo.png"
            alt="Logo"
            className="logo-container"
          />
        </a>

        {/* Heading */}
        <h2 className="text-center text-xl sm:text-3xl font-semibold text-[#1F1F1F]">
          Create Account
        </h2>
        <p className="mt-1 text-center text-md sm:text-xl">
          Start your Bitcoin IRA investment journey
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-6 space-y-4 sm:space-y-5">
          
          {/* Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <input
              name="firstName"
              placeholder="First name"
              value={formData.firstName}
              onChange={handleChange}
              required
              disabled={loading}
              className="w-full font-helvetica text-xs sm:text-sm rounded-md border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-400"
            />
            <input
              name="lastName"
              placeholder="Last name"
              value={formData.lastName}
              onChange={handleChange}
              required
              disabled={loading}
              className="w-full font-helvetica text-xs sm:text-sm rounded-md border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-400"
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
            className="w-full font-helvetica text-xs sm:text-sm rounded-md border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-400"
          />

          <input
            type="tel"
            name="phone"
            placeholder="Phone (optional)"
            value={formData.phone}
            onChange={handleChange}
            disabled={loading}
            className="w-full font-helvetica text-xs sm:text-sm rounded-md border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-400"
          />

          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            required
            disabled={loading}
            className="w-full font-helvetica text-xs sm:text-sm rounded-md border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-400"
          />

          <input
            type="password"
            name="confirmPassword"
            placeholder="Confirm password"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
            disabled={loading}
            className="w-full font-helvetica text-xs sm:text-sm rounded-md border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-400"
          />

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
            className="w-full mt-6 flex justify-center items-center rounded-full bg-yellow-400 py-2.5 text-sm font-medium text-gray-900 hover:bg-yellow-500 transition"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {loading ? 'Creating account...' : 'Sign Up'}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-4 text-center font-goudy text-md sm:text-lg">
          <span className="mr-1">Already have an account?</span>
          <Link href="/auth/login" className="font-medium text-yellow-600 hover:underline">
            Log in
          </Link>
        </div>
      </div>
    </div>
  );
}
