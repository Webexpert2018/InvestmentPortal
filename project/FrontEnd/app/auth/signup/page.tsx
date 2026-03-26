'use client';

import { useState, Suspense } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';
import Link from 'next/link';
import { Loader2, Eye, EyeOff, ChevronDown } from 'lucide-react';
import { useSearchParams } from 'next/navigation'; 

const COUNTRY_CODES = ['+1 (USA)', '+44 (UK)', '+91 (IN)'];

function SignupForm() {
  const { signup } = useAuth();
  const searchParams = useSearchParams(); 
  const flowParam = searchParams.get('flow') || 'investor';
  const flow = flowParam === 'account' ? 'accountant' : flowParam;

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    phoneCountryCode: COUNTRY_CODES[0],
    phone: '',
    role: flow,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'phone') {
      const digits = value.replace(/\D/g, '');
      setFormData({ ...formData, [name]: digits });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!formData.firstName.trim() || !/^[A-Za-z\s\-']+$/.test(formData.firstName.trim())) {
      setError('First name can only contain letters');
      setLoading(false);
      return;
    }
    if (!formData.lastName.trim() || !/^[A-Za-z\s\-']+$/.test(formData.lastName.trim())) {
      setError('Last name can only contain letters');
      setLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (formData.phone) {
      const cleanNumber = formData.phone.trim();
      if (formData.phoneCountryCode === '+1 (USA)') {
        if (cleanNumber.length !== 10) {
          setError('USA phone number must be 10 digits');
          setLoading(false);
          return;
        }
      } else if (formData.phoneCountryCode === '+44 (UK)') {
        if (cleanNumber.length < 10 || cleanNumber.length > 11) {
          setError('UK phone number must be 10-11 digits');
          setLoading(false);
          return;
        }
      } else if (formData.phoneCountryCode === '+91 (IN)') {
        if (cleanNumber.length !== 10) {
          setError('India phone number must be 10 digits');
          setLoading(false);
          return;
        }
      }
    }

    try {
      await signup({
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone ? `${formData.phoneCountryCode} ${formData.phone}` : undefined,
        role: flow,
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
        
        <a href="/" className="flex justify-center mb-3 sm:mb-4">
          <img
            src="/images/logo.png"
            alt="Logo"
            className="logo-container"
          />
        </a>

        <h2 className="text-center text-xl sm:text-3xl font-semibold text-[#1F1F1F]">
          Create Account
        </h2>
        <p className="mt-1 text-center text-md sm:text-xl">
          Start your Bitcoin IRA investment journey
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4 sm:space-y-5">
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

          <div className="flex gap-2">
            <div className="relative w-[110px] shrink-0">
              <select
                name="phoneCountryCode"
                value={formData.phoneCountryCode}
                onChange={handleChange}
                disabled={loading}
                className="h-10 w-full appearance-none rounded-md border border-gray-300 bg-white pl-3 pr-7 text-xs sm:text-sm font-helvetica outline-none focus:ring-2 focus:ring-yellow-400 disabled:opacity-50"
              >
                {COUNTRY_CODES.map(code => (
                  <option key={code} value={code}>{code}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            </div>
            <input
              type="tel"
              name="phone"
              placeholder="Phone (optional)"
              value={formData.phone}
              onChange={handleChange}
              disabled={loading}
              className="flex-1 font-helvetica text-xs sm:text-sm rounded-md border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-400 disabled:opacity-50"
            />
          </div>

          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              required
              disabled={loading}
              className="w-full font-helvetica text-xs sm:text-sm rounded-md border px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-yellow-400"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              disabled={loading}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition disabled:opacity-50"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <div className="relative">
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              name="confirmPassword"
              placeholder="Confirm password"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              disabled={loading}
              className="w-full font-helvetica text-xs sm:text-sm rounded-md border px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-yellow-400"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              disabled={loading}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition disabled:opacity-50"
            >
              {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
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
            {loading ? 'Creating account...' : 'Sign Up'}
          </button>
        </form>

        <div className="mt-4 text-center font-goudy text-md sm:text-lg">
          <span className="mr-1">Already have an account?</span>
          <Link href={`/auth/login?flow=${searchParams.get('flow') || 'investor'}`} className="font-medium text-yellow-600 hover:underline">
            Log in
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#F1F1F1] px-4">
        <Loader2 className="h-8 w-8 animate-spin text-yellow-500" />
      </div>
    }>
      <SignupForm />
    </Suspense>
  );
}
