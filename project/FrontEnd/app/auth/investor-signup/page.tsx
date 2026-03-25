'use client';

import { ReactNode, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { Country, State, City } from 'country-state-city';
import { Combobox } from '@/components/ui/combobox';

type Step = 1 | 2 | 3 | 4 | 5;

type ValidationErrors = Record<string, string>;

const STEP_LABELS = ['Set Profile', 'Address', 'Phone Number Verify', 'Tax Info.', 'Two Factor'];

const countryCodes = ['+1 (USA)', '+44 (UK)', '+91 (IN)'];

export default function InvestorSignupPage() {
  const router = useRouter();
  const { signup } = useAuth();

  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [showProfileFlow, setShowProfileFlow] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [globalError, setGlobalError] = useState('');

  const [form, setForm] = useState({
    email: '',
    password: '',
    confirmPassword: '',

    firstName: '',
    lastName: '',
    phoneCountryCode: '+1 (USA)',
    phoneNumber: '',
    dob: '',

    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    zipCode: '',
    country: '',

    taxId: '',

    phoneOtp: ['', '', '', '', '', ''],
    twoFactorOtp: ['', '', '', '', '', ''],
  });

  const canGoBack = currentStep > 1;

  const setField = (field: string, value: string | string[]) => {
    setForm((prev) => {
      const next = { ...prev, [field]: value };

      // Cascading logic: Reset dependent fields
      if (field === 'country') {
        next.state = '';
        next.city = '';
      } else if (field === 'state') {
        next.city = '';
      }

      return next;
    });
    setErrors((prev) => ({ ...prev, [field]: '' }));
    setGlobalError('');
  };

  const validateAccount = () => {
    const nextErrors: ValidationErrors = {};

    if (!form.email.trim()) nextErrors.email = 'Email is required';
    if (!form.password) nextErrors.password = 'Password is required';
    if (!form.confirmPassword) nextErrors.confirmPassword = 'Confirm password is required';

    if (form.password && form.password.length < 8) {
      nextErrors.password = 'Password must be at least 8 characters';
    }

    if (form.password && form.confirmPassword && form.password !== form.confirmPassword) {
      nextErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const validateStep = (step: Step) => {
    const nextErrors: ValidationErrors = {};

    // if (step === 1) {
    //   if (!form.firstName.trim()) nextErrors.firstName = 'First name is required';
    //   if (!form.lastName.trim()) nextErrors.lastName = 'Last name is required';
    //   if (!form.email.trim()) nextErrors.email = 'Email is required';
    //   if (!form.phoneNumber.trim()) {
    //     nextErrors.phoneNumber = 'Phone number is required';
    //   } else if (form.phoneNumber.length < 10) {
    //     nextErrors.phoneNumber = 'Please enter a valid phone number';
    //   }
    //   if (!form.dob) nextErrors.dob = 'Date of birth is required';
    // }
    if (step === 1) {
      // First Name
      if (!form.firstName.trim()) {
        nextErrors.firstName = 'First name is required';
      } else if (!/^[A-Za-z\s]+$/.test(form.firstName)) {
        nextErrors.firstName = 'First name should contain only letters';
      }

      // Last Name
      if (!form.lastName.trim()) {
        nextErrors.lastName = 'Last name is required';
      } else if (!/^[A-Za-z\s]+$/.test(form.lastName)) {
        nextErrors.lastName = 'Last name should contain only letters';
      }

      // Email
      if (!form.email.trim()) {
        nextErrors.email = 'Email is required';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
        nextErrors.email = 'Please enter a valid email address';
      }

      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/;
      if (!emailRegex.test(form.email)) {
        nextErrors.email = 'Invalid email format';
      }

      // Phone Number
      const phoneError = (() => {
        const cleanNumber = form.phoneNumber.trim();
        if (!cleanNumber) return 'Phone number is required';
        if (form.phoneCountryCode === '+1 (USA)') {
          if (cleanNumber.length !== 10) return 'USA phone number must be 10 digits';
        } else if (form.phoneCountryCode === '+44 (UK)') {
          if (cleanNumber.length < 10 || cleanNumber.length > 11) return 'UK phone number must be 10-11 digits';
        } else if (form.phoneCountryCode === '+91 (IN)') {
          if (cleanNumber.length !== 10) return 'India phone number must be 10 digits';
        }
        return null;
      })();
      if (phoneError) nextErrors.phoneNumber = phoneError;

      // DOB
      if (!form.dob) {
        nextErrors.dob = 'Date of birth is required';
      } else {
        const birthDate = new Date(form.dob);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }

        if (age < 18) {
          nextErrors.dob = 'You must be at least 18 years old';
        } else if (age > 70) {
          nextErrors.dob = 'Age cannot exceed 70 years';
        }
      }
    }

    if (step === 2) {
      if (!form.addressLine1.trim()) nextErrors.addressLine1 = 'Address line 1 is required';
      if (!form.city.trim()) {
        nextErrors.city = 'City is required';
      } else if (!/^[A-Za-z\s\-']+$/.test(form.city.trim())) {
        nextErrors.city = 'City can only contain letters';
      }
      if (!form.state) nextErrors.state = 'State is required';
      if (!form.zipCode.trim()) {
        nextErrors.zipCode = 'ZIP code is required';
      } else if (!/^[a-zA-Z0-9\s\-]+$/.test(form.zipCode.trim())) {
        nextErrors.zipCode = 'ZIP code can only contain letters, numbers, and hyphens';
      }
      if (!form.country) nextErrors.country = 'Country is required';
    }

    if (step === 3) {
      // Phone Number
      const phoneErrorStep3 = (() => {
        const cleanNumber = form.phoneNumber.trim();
        if (!cleanNumber) return 'Phone number is required';
        if (form.phoneCountryCode === '+1 (USA)') {
          if (cleanNumber.length !== 10) return 'USA phone number must be 10 digits';
        } else if (form.phoneCountryCode === '+44 (UK)') {
          if (cleanNumber.length < 10 || cleanNumber.length > 11) return 'UK phone number must be 10-11 digits';
        } else if (form.phoneCountryCode === '+91 (IN)') {
          if (cleanNumber.length !== 10) return 'India phone number must be 10 digits';
        }
        return null;
      })();
      if (phoneErrorStep3) nextErrors.phoneNumber = phoneErrorStep3;
      if (otpSent && form.phoneOtp.some((digit) => !digit)) {
        nextErrors.phoneOtp = 'Enter complete 6-digit verification code';
      }
    }

    if (step === 4) {
      if (!form.taxId.trim()) nextErrors.taxId = 'Tax ID is required';
    }

    if (step === 5) {
      if (form.twoFactorOtp.some((digit) => !digit)) {
        nextErrors.twoFactorOtp = 'Enter complete 6-digit code';
      }
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const updateOtp = (field: 'phoneOtp' | 'twoFactorOtp', index: number, value: string) => {
    const safeValue = value.replace(/\D/g, '').slice(-1);
    const next = [...form[field]];
    next[index] = safeValue;
    setField(field, next);

    if (safeValue) {
      const nextInput = document.getElementById(`${field}-${index + 1}`) as HTMLInputElement | null;
      nextInput?.focus();
    }
  };

  const moveBack = () => {
    if (loading) return;
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as Step);
    } else {
      setShowProfileFlow(false);
      setCurrentStep(1);
    }
  };

  const moveNext = async () => {
    if (loading) return;

    if (!validateStep(currentStep)) return;

    if (currentStep === 5) {
      await handleFinalSubmit();
      return;
    }

    setCurrentStep((prev) => (prev + 1) as Step);
  };

  const handleCreateAccount = () => {
    if (!validateAccount()) return;
    setShowProfileFlow(true);
    setCurrentStep(1);
  };

  const handleFinalSubmit = async () => {
    debugger;
    // console.log();
    setLoading(true);
    setGlobalError('');

    try {
      // Get readable names from ISO codes for submission
      await signup({
        email: form.email,
        password: form.password,
        firstName: form.firstName,
        lastName: form.lastName,
        phone: `${form.phoneCountryCode} ${form.phoneNumber}`,
        dob: form.dob,
        role: 'investor',
        addressLine1: form.addressLine1,
        addressLine2: form.addressLine2,
        city: form.city,
        state: form.state,
        zipCode: form.zipCode,
        country: form.country,
        taxId: form.taxId,
      });
      router.push('/dashboard');
    } catch (err: any) {
      setGlobalError(err?.message || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const progress = useMemo(() => {
    return STEP_LABELS.map((label, index) => {
      const stepNumber = (index + 1) as Step;
      const done = stepNumber < currentStep;
      const active = stepNumber === currentStep;
      return { label, stepNumber, done, active };
    });
  }, [currentStep]);

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-cover bg-center px-4"
      style={{ backgroundImage: "url('/images/login-bg.jpg')" }}
    >

      {!showProfileFlow ? (
        <div className="w-full max-w-md bg-white rounded-sm shadow-2xl px-4 py-5 sm:px-8 sm:py-10">
          {/* Logo */}
          <a href="/" className="flex justify-center mb-3 sm:mb-4">
            <img
              src="/images/logo.png"
              alt="Logo"
              className="logo-container"
            />
          </a>

          <h2 className="text-center text-xl sm:text-3xl font-semibold text-[#1F1F1F]">
            Create Your Ovalia Capital
          </h2>
          <p className="mt-1 text-center text-md sm:text-xl">
            Enter your details to begin your Ovalia Capital onboarding.
          </p>

          <div className="space-y-4">
            <FormField label="Email" error={errors.email}>
              <input
                value={form.email}
                onChange={(e) => setField('email', e.target.value)}
                placeholder="Enter email"
                className="h-11 w-full rounded-md border border-[#E5E5E5] px-3 font-helvetica text-sm outline-none focus:border-yellow-400"
              />
            </FormField>

            <FormField label="Password" error={errors.password}>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => setField('password', e.target.value)}
                  placeholder="Enter password"
                  className="h-11 w-full rounded-md border border-[#E5E5E5] px-3 pr-10 font-helvetica text-sm outline-none focus:border-yellow-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-3 text-[#9A9A9A]"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </FormField>

            <FormField label="Confirm Password" error={errors.confirmPassword}>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={form.confirmPassword}
                  onChange={(e) => setField('confirmPassword', e.target.value)}
                  placeholder="Enter confirm password"
                  className="h-11 w-full rounded-md border border-[#E5E5E5] px-3 pr-10 font-helvetica text-sm outline-none focus:border-yellow-400"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-3 text-[#9A9A9A]"
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </FormField>
          </div>

          {globalError && <p className="mt-4 text-center font-helvetica text-sm text-red-600">{globalError}</p>}

          <button
            type="button"
            onClick={handleCreateAccount}
            disabled={loading}
            className="mt-7 h-11 w-full rounded-full bg-yellow-400 text-lg  text-[#2A4474]"
          >
            Sign Up
          </button>

          <p className="mt-5 text-center text-xl text-[#9C9C9C]">
            Already have an account?{' '}
            <Link href="/auth/login?flow=investor" className="font-medium text-yellow-600 hover:underline">
              Log In
            </Link>
          </p>
        </div>
      ) : (
        <div className="mx-auto flex min-h-[752px] w-full max-w-[1230px] items-center justify-center p-6 md:p-10">
          <div className="w-full rounded-md bg-[#FCFCFC] shadow-xl">
            <div className="border-b border-[#EBEBEB] px-6 pt-6">
              <a href="/" className="mb-4 flex justify-center">
                <img src="/images/logo.png" alt="Ovalia Capital" className="h-auto w-[170px] object-contain logo-con" />
              </a>

              <h3 className="text-[24px] text-[#1F1F1F] font-bold">Complete Your Profile</h3>
              <p className="mb-4 font-helvetica text-lg">Just a few steps to get started</p>

              <div className="mb-3 flex items-center gap-2 pb-4">
                {progress.map((item, index) => (
                  <div key={item.label} className="flex flex-1 items-center gap-2">
                    <div
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold ${item.done || item.active ? 'bg-[#F1CF4A] text-white' : 'bg-[#EFEFEF] text-[#9A9A9A]'
                        }`}
                    >
                      {item.done ? '✓' : item.stepNumber}
                    </div>
                    <span className="whitespace-nowrap font-helvetica text-xs text-[#6F6F6F]">{item.label}</span>
                    {index < progress.length - 1 && <div className="h-px flex-1 bg-[#E3E3E3]" />}
                  </div>
                ))}
              </div>
            </div>

            <div className="px-6 py-5">{renderStepContent()}</div>

            <div className="flex items-center justify-between px-6 pb-6 pt-2">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={moveBack}
                  className="h-10 min-w-[108px] rounded-full bg-[#F8F1D8] px-6 font-medium text-[#8B7F53]"
                >
                  Back
                </button>

                {currentStep === 5 && (
                  <button
                    type="button"
                    className="text-sm font-medium text-[#888888] hover:text-[#4B4B4B]"
                    onClick={() => router.push('/auth/login?flow=investor')}
                  >
                    SKIP
                  </button>
                )}
              </div>

              <div className="flex items-center gap-3">

                {currentStep === 3 && !otpSent ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (!validateStep(3)) return;
                      setOtpSent(true);
                    }}
                    className="h-10 min-w-[108px] rounded-full bg-yellow-400 px-6 font-medium text-[#2A2A2A]"
                  >
                    Send Code
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={moveNext}
                    disabled={loading}
                    className="h-10 min-w-[108px] rounded-full bg-yellow-400 px-6 font-medium text-[#2A2A2A] disabled:opacity-70"
                  >
                    {currentStep === 5 ? (loading ? 'Submitting...' : 'Continue') : 'Continue'}
                  </button>
                )}
              </div>
            </div>

            {globalError && (
              <div className="px-6 pb-6">
                <p className="font-helvetica text-sm text-red-600">{globalError}</p>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );

  function renderStepContent() {
    if (currentStep === 1) {
      return (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormField label="First Name" error={errors.firstName}>
            <input
              value={form.firstName}
              onChange={(e) => setField('firstName', e.target.value)}
              placeholder="Enter first name"
              className="h-11 w-full rounded-md border border-[#E6E6E6] px-3 font-helvetica text-sm"
            />
          </FormField>

          <FormField label="Last Name" error={errors.lastName}>
            <input
              value={form.lastName}
              onChange={(e) => setField('lastName', e.target.value)}
              placeholder="Enter last name"
              className="h-11 w-full rounded-md border border-[#E6E6E6] px-3 font-helvetica text-sm"
            />
          </FormField>

          <FormField label="Email" error={errors.email}>
            <input
              value={form.email}
              onChange={(e) => setField('email', e.target.value)}
              placeholder="Enter email"
              disabled
              className="h-11 w-full rounded-md border border-[#E6E6E6] px-3 font-helvetica text-sm bg-gray-50 text-gray-500 cursor-not-allowed"
            />
          </FormField>

          <FormField label="Phone Number" error={errors.phoneNumber}>
            <div className="flex gap-2">
              <select
                value={form.phoneCountryCode}
                onChange={(e) => setField('phoneCountryCode', e.target.value)}
                className="h-11 w-[110px] rounded-md border border-[#E6E6E6] px-2 font-helvetica text-sm"
              >
                {countryCodes.map((code) => (
                  <option key={code} value={code}>
                    {code}
                  </option>
                ))}
              </select>
              <input
                value={form.phoneNumber}
                onChange={(e) => setField('phoneNumber', e.target.value.replace(/\D/g, '').slice(0, 15))}
                placeholder="Enter phone number"
                className="h-11 flex-1 rounded-md border border-[#E6E6E6] px-3 font-helvetica text-sm"
              />
            </div>
          </FormField>

          <div className="md:col-span-1">
            <FormField label="Date of Birth" error={errors.dob}>
              <div className="relative">
                <input
                  type="date"
                  value={form.dob}
                  onChange={(e) => setField('dob', e.target.value)}
                  className="
                    h-11 w-full
                    rounded-md
                    border border-[#E6E6E6]
                    px-3 pr-4
                    font-helvetica text-sm
                    text-[#1F1F1F]
                    focus:border-yellow-400
                    outline-none
                    "
                />

              </div>
            </FormField>
          </div>
        </div>
      );
    }

    if (currentStep === 2) {
      const allCountries = Country.getAllCountries();
      const availableStates = form.country ? State.getStatesOfCountry(form.country) : [];
      const availableCities = (form.country && form.state) ? City.getCitiesOfState(form.country, form.state) : [];

      return (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormField label="Street Address Line 1" error={errors.addressLine1}>
            <input
              value={form.addressLine1}
              onChange={(e) => setField('addressLine1', e.target.value)}
              placeholder="Enter street address line 1"
              className="h-11 w-full rounded-md border border-[#E6E6E6] px-3 font-helvetica text-sm"
            />
          </FormField>

          <FormField label="Street Address Line 2" error={errors.addressLine2}>
            <input
              value={form.addressLine2}
              onChange={(e) => setField('addressLine2', e.target.value)}
              placeholder="Enter street address line 2"
              className="h-11 w-full rounded-md border border-[#E6E6E6] px-3 font-helvetica text-sm"
            />
          </FormField>

          <FormField label="Country" error={errors.country}>
            <Combobox
              options={allCountries.map(c => ({ label: c.name, value: c.isoCode }))}
              value={form.country}
              onChange={(val) => setField('country', val)}
              placeholder="Select country"
            />
          </FormField>

          <FormField label="State" error={errors.state}>
            <Combobox
              options={availableStates.map(s => ({ label: s.name, value: s.isoCode }))}
              value={form.state}
              onChange={(val) => setField('state', val)}
              placeholder="Select state"
              disabled={!form.country}
            />
          </FormField>

          <FormField label="City" error={errors.city}>
            <Combobox
              options={availableCities.map(city => ({ label: city.name, value: city.name }))}
              value={form.city}
              onChange={(val) => setField('city', val)}
              placeholder="Select city"
              disabled={!form.state}
            />
          </FormField>


          <FormField label="ZIP Code" error={errors.zipCode}>
            <input
              value={form.zipCode}
              onChange={(e) => setField('zipCode', e.target.value)}
              placeholder="Enter zip code"
              className="h-11 w-full rounded-md border border-[#E6E6E6] px-3 font-helvetica text-sm"
            />
          </FormField>
        </div>
      );
    }

    if (currentStep === 3 && !otpSent) {
      return (
        <div className="max-w-[540px] space-y-3">
          <h4 className="text-[20px] text-[#4B4B4B] font-medium">Phone Verification</h4>
          <p className="font-helvetica text-sm text-[#A0A0A0]">We&apos;ll send you a verification code to confirm your phone number.</p>

          <FormField label="" error={errors.phoneNumber}>
            <div className="flex gap-2">
              <select
                value={form.phoneCountryCode}
                onChange={(e) => setField('phoneCountryCode', e.target.value)}
                disabled
                className="h-11 w-[130px] rounded-md border border-[#E6E6E6] px-2 font-helvetica text-sm bg-gray-50 text-gray-500 cursor-not-allowed"
              >
                {countryCodes.map((code) => (
                  <option key={code} value={code}>
                    {code}
                  </option>
                ))}
              </select>

              <input
                value={form.phoneNumber}
                onChange={(e) => setField('phoneNumber', e.target.value.replace(/\D/g, '').slice(0, 15))}
                placeholder="Enter phone number"
                disabled
                className="h-11 flex-1 rounded-md border border-[#E6E6E6] px-3 font-helvetica text-sm bg-gray-50 text-gray-500 cursor-not-allowed"
              />
            </div>
          </FormField>
        </div>
      );
    }

    if (currentStep === 3 && otpSent) {
      return (
        <div className="mx-auto max-w-[540px] text-center">
          <h4 className="text-[30px] text-[#2A2A2A]">Phone Number Verification</h4>
          <p className="mx-auto max-w-[420px] font-helvetica text-sm text-[#A0A0A0]">
            We&apos;ve sent a 6-digit code to your phone number. Please enter it below to continue.
          </p>

          <div className="mt-5 flex justify-center gap-2">
            {form.phoneOtp.map((digit, index) => (
              <input
                key={`phoneOtp-${index}`}
                id={`phoneOtp-${index}`}
                value={digit}
                onChange={(e) => updateOtp('phoneOtp', index, e.target.value)}
                className="h-12 w-12 rounded-md border border-[#E5E5E5] text-center font-helvetica text-lg"
              />
            ))}
          </div>

          {errors.phoneOtp && <p className="mt-2 font-helvetica text-sm text-red-600">{errors.phoneOtp}</p>}

          <p className="mt-4 text-[30px] text-[#8A8A8A]">
            Didn&apos;t receive code? <span className="text-[#3F3F3F]">00:26</span>
          </p>
        </div>
      );
    }

    if (currentStep === 4) {
      return (
        <div className="max-w-[520px]">
          <h4 className="text-[30px] text-[#2A2A2A]">TAX Information</h4>

          <FormField label="Social Security Number / Tax ID" error={errors.taxId}>
            <input
              value={form.taxId}
              onChange={(e) => setField('taxId', e.target.value)}
              placeholder="*** ** ***"
              className="h-11 w-full rounded-md border border-[#E6E6E6] px-3 font-helvetica text-sm"
            />
          </FormField>

          <p className="mt-2 font-helvetica text-sm text-[#B0B0B0]">Your information is encrypted and secure</p>
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
        <div className="max-w-[520px]">
          <h4 className="text-[30px] text-[#2A2A2A]">Setup Two-Factor Authentication</h4>
          <p className="font-helvetica text-sm text-[#A0A0A0]">Add an extra layer of security to protect your investments</p>

          <p className="mt-4 font-helvetica text-sm text-[#989898]">Enter the 6-digit code from your authenticator app</p>
          <div className="mt-3 flex gap-2">
            {form.twoFactorOtp.map((digit, index) => (
              <input
                key={`twoFactorOtp-${index}`}
                id={`twoFactorOtp-${index}`}
                value={digit}
                onChange={(e) => updateOtp('twoFactorOtp', index, e.target.value)}
                className="h-12 w-12 rounded-md border border-[#E5E5E5] text-center font-helvetica text-lg"
              />
            ))}
          </div>
          {errors.twoFactorOtp && <p className="mt-2 font-helvetica text-sm text-red-600">{errors.twoFactorOtp}</p>}
        </div>

        <div className="w-[180px] text-center">
          <div className="mx-auto flex items-center justify-center">
            <img src="/images/qr-code-placeholder.png" alt="QR Code" className="h-full w-full object-contain" />
            {/* <div className="grid h-full w-full grid-cols-6 gap-[2px]">
              {Array.from({ length: 36 }).map((_, i) => (
                <div key={i} className={(i + (i % 3)) % 2 === 0 ? 'bg-black' : 'bg-white'} />
              ))}
            </div> */}
          </div>
          <p className="mt-3 font-helvetica text-xs text-[#929292]">Scan this QR code with your authenticator app</p>
        </div>
      </div>
    );
  }
}

function FormField({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
  return (
    <div>
      {label ? <label className="mb-1 block font-helvetica text-sm text-[#616161]">{label}</label> : null}
      {children}
      {error ? <p className="mt-1 font-helvetica text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
