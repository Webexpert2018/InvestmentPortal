import { useState } from 'react';
import { Mail, ArrowLeft, Lock, Eye, EyeOff, CheckCircle } from 'lucide-react';
import logo from '/assets/images/logo.png';

export default function ForgotPassword() {
  const [step, setStep] = useState<'email' | 'otp' | 'reset' | 'success'>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Mock email check
    if (email) {
      setStep('otp');
    }
  };

  const handleOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Mock OTP check
    if (otp === '123456') {
      setStep('reset');
    } else {
      alert('Invalid code. Try 123456');
    }
  };

  const handleResetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      alert('Passwords do not match');
      return;
    }
    // Mock reset logic
    setStep('success');
  };

  return (
    <div className="bg-white py-8 px-4 shadow-2xl sm:rounded-lg sm:px-10">
      <div className="sm:mx-auto sm:w-full sm:max-w-md mb-6">
        <a href="/" className="flex justify-center">
          <img src={logo.src} alt="Ovalia Capital" className="h-16 object-contain logo-con" />
        </a>
        
        {step === 'email' && (
          <>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Forgot Password?
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Enter your email address and we'll send you a code to reset your password.
            </p>
          </>
        )}

        {step === 'otp' && (
          <>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Check your email
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              We sent a verification code to {email}. Please enter the code below.
            </p>
          </>
        )}

        {step === 'reset' && (
          <>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Reset Password
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Create a new password for your account.
            </p>
          </>
        )}

        {step === 'success' && (
          <>
            <div className="flex justify-center mt-4">
              <CheckCircle className="h-16 w-16 text-green-500" />
            </div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Password Reset
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Your password has been successfully reset. You can now log in with your new password.
            </p>
          </>
        )}
      </div>

      {step === 'email' && (
        <form className="space-y-6" onSubmit={handleEmailSubmit}>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400" aria-hidden="true" />
              </div>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="focus:ring-[#9105BD] focus:border-[#9105BD] block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-2 border"
                placeholder="Enter email"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <a href="/login" className="flex items-center text-sm font-medium text-gray-600 hover:text-gray-900">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Login
            </a>
          </div>

          <div>
            <button
              type="submit"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-full shadow-sm text-sm font-medium text-white bg-[#9105BD] hover:bg-[#7e22ce] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#9105BD]"
            >
              Send Code
            </button>
          </div>
        </form>
      )}

      {step === 'otp' && (
        <form className="space-y-6" onSubmit={handleOtpSubmit}>
          <div>
            <label htmlFor="otp" className="block text-sm font-medium text-gray-700">
              Verification Code
            </label>
            <div className="mt-1">
              <input
                id="otp"
                name="otp"
                type="text"
                required
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="focus:ring-[#9105BD] focus:border-[#9105BD] block w-full sm:text-sm border-gray-300 rounded-md py-2 border text-center tracking-widest text-2xl"
                placeholder="000000"
                maxLength={6}
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setStep('email')}
              className="flex items-center text-sm font-medium text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </button>
            <button
              type="button"
              className="text-sm font-medium text-[#9105BD] hover:text-[#7e22ce]"
              onClick={() => alert('Code resent!')}
            >
              Resend Code
            </button>
          </div>

          <div>
            <button
              type="submit"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-full shadow-sm text-sm font-medium text-white bg-[#9105BD] hover:bg-[#7e22ce] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#9105BD]"
            >
              Verify
            </button>
          </div>
        </form>
      )}

      {step === 'reset' && (
        <form className="space-y-6" onSubmit={handleResetSubmit}>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              New Password
            </label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" aria-hidden="true" />
              </div>
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="focus:ring-[#9105BD] focus:border-[#9105BD] block w-full pl-10 pr-10 sm:text-sm border-gray-300 rounded-md py-2 border"
                placeholder="Enter new password"
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                <button
                  type="button"
                  className="text-gray-400 hover:text-gray-500 focus:outline-none"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" aria-hidden="true" />
                  ) : (
                    <Eye className="h-5 w-5" aria-hidden="true" />
                  )}
                </button>
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
              Confirm Password
            </label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" aria-hidden="true" />
              </div>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="focus:ring-[#9105BD] focus:border-[#9105BD] block w-full pl-10 pr-10 sm:text-sm border-gray-300 rounded-md py-2 border"
                placeholder="Confirm new password"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-full shadow-sm text-sm font-medium text-white bg-[#9105BD] hover:bg-[#7e22ce] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#9105BD]"
            >
              Reset Password
            </button>
          </div>
        </form>
      )}

      {step === 'success' && (
        <div className="mt-6">
          <button
            type="button"
            onClick={() => window.location.href = '/login'}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-full shadow-sm text-sm font-medium text-white bg-[#9105BD] hover:bg-[#7e22ce] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#9105BD]"
          >
            Back to Login
          </button>
        </div>
      )}
    </div>
  );
}
