'use client';

import { useState } from 'react';
import { Mail, ArrowLeft, Lock, Eye, EyeOff, CheckCircle } from 'lucide-react';
import Link from 'next/link';

export default function ForgotPassword() {
  const [step, setStep] = useState<'email' | 'otp' | 'reset' | 'success'>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) setStep('otp');
  };

  const handleOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (otp === '123456') setStep('reset');
    else alert('Invalid code. Try 123456');
  };

  const handleResetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      alert('Passwords do not match');
      return;
    }
    setStep('success');
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

        {/* HEADINGS */}
        {step === 'email' && (
          <>
            <h2 className="text-center text-2xl font-semibold">Forgot Password?</h2>
            <p className="mt-1 text-center text-sm text-gray-500">
              Enter your email to receive a reset code
            </p>
          </>
        )}

        {step === 'otp' && (
          <>
            <h2 className="text-center text-2xl font-semibold">Check your email</h2>
            <p className="mt-1 text-center text-sm text-gray-500">
              We sent a code to {email}
            </p>
          </>
        )}

        {step === 'reset' && (
          <>
            <h2 className="text-center text-2xl font-semibold">Reset Password</h2>
            <p className="mt-1 text-center text-sm text-gray-500">
              Create a new password
            </p>
          </>
        )}

        {step === 'success' && (
          <>
            <div className="flex justify-center mt-2">
              <CheckCircle className="h-14 w-14 text-green-500" />
            </div>
            <h2 className="mt-4 text-center text-2xl font-semibold">
              Password Reset
            </h2>
            <p className="mt-1 text-center text-sm text-gray-500">
              You can now log in with your new password
            </p>
          </>
        )}

        {/* FORMS */}
        <div className="mt-6">
          {step === 'email' && (
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                <input
                  type="email"
                  required
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 py-2 border rounded-md text-sm mb-3"
                />
              </div>

              <Link
                href="/auth/login"
                className="flex items-center text-sm text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="h-4 w-4 mr-1" /> Back to login
              </Link>

              <button className="w-full rounded-full bg-yellow-400 py-2 text-sm font-medium hover:bg-yellow-500">
                Send Code
              </button>
            </form>
          )}

          {step === 'otp' && (
            <form onSubmit={handleOtpSubmit} className="space-y-4">
              <input
                type="text"
                maxLength={6}
                required
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="000000"
                className="w-full text-center tracking-widest text-xl py-2 border rounded-md"
              />

              <div className="flex justify-between text-sm">
                <button onClick={() => setStep('email')} type="button">
                  ← Back
                </button>
                <button type="button" className="text-yellow-600">
                  Resend Code
                </button>
              </div>

              <button className="w-full rounded-full bg-yellow-400 py-2 text-sm font-medium hover:bg-yellow-500">
                Verify
              </button>
            </form>
          )}

          {step === 'reset' && (
            <form onSubmit={handleResetSubmit} className="space-y-4">
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="New password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-10 pr-10 py-2 border rounded-md text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-gray-400"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Confirm password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full pl-10 py-2 border rounded-md text-sm mb-3"
                />
              </div>

              <button className="w-full rounded-full bg-yellow-400 py-2 text-sm font-medium hover:bg-yellow-500">
                Reset Password
              </button>
            </form>
          )}

          {step === 'success' && (
            <Link
              href="/auth/login"
              className="block text-center w-full rounded-full bg-yellow-400 py-2 text-sm font-medium hover:bg-yellow-500"
            >
              Back to Login
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
