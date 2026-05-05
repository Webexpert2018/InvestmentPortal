'use client';

import { useState, useMemo, useRef, useEffect, ChangeEvent } from 'react';
import { CalendarDays, ChevronDown, Plus, X, Eye, EyeOff, Loader2, Upload, LogOut } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { apiClient, BASE_URL } from '@/lib/api/client';
import { Country, State, City } from 'country-state-city';
import { Combobox } from '@/components/ui/combobox';
import { cn } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

/* ═══════════════════════════════════════════════════════
   TYPES & DATA
   ═══════════════════════════════════════════════════════ */

type AcctTab = 'profile' | 'security' | 'notifications';

interface Session {
  id: string;
  device: string;
  status: string;
  isActive: boolean;
  signedInAt?: string;
}

const TAB_LIST: { id: AcctTab; label: string }[] = [
  { id: 'profile', label: 'Profile Information' },
  { id: 'security', label: 'Security & Login' },
  { id: 'notifications', label: 'Notifications' },
];

const COUNTRY_CODES = ['+1 (USA)', '+44 (UK)', '+91 (IN)'];

const SESSIONS: Session[] = [];

function PasswordInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const [showPassword, setShowPassword] = useState(false);
  return (
    <div className="relative">
      <input
        {...props}
        type={showPassword ? 'text' : 'password'}
        className={`h-[42px] w-full rounded-[8px] border border-[#E5E7EB] bg-white pl-4 pr-10 text-[13px] text-[#1F1F1F] outline-none placeholder:text-[#9CA3AF] focus:border-[#D1A94C] font-helvetica ${props.className ?? ''}`}
      />
      <button
        type="button"
        onClick={() => setShowPassword(!showPassword)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A2A5AA] hover:text-[#4B4B4B]"
      >
        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}

const formatDateForInput = (dateStr: string | null | undefined) => {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '';
    return date.toISOString().split('T')[0];
  } catch (e) {
    return '';
  }
};

export function AccountantSettingsScreen() {
  const { user, refreshUser, logout, updateUser, profileTimestamp } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [tab, setTab] = useState<AcctTab>('profile');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Profile ──
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [countryCode, setCountryCode] = useState(COUNTRY_CODES[0]);
  const [phone, setPhone] = useState('');
  const [dob, setDob] = useState('');
  const [profileImg, setProfileImg] = useState('');
  const [profileImageUrl, setProfileImageUrl] = useState('');

  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [country, setCountry] = useState('US');
  const [taxId, setTaxId] = useState('');

  const imgRef = useRef<HTMLInputElement>(null);
  const dobRef = useRef<HTMLInputElement>(null);

  const countries = useMemo(() => {
    const allCountries = Country.getAllCountries();
    // Sort countries with USA at the top
    return [
      ...allCountries.filter(c => c.isoCode === 'US'),
      ...allCountries.filter(c => c.isoCode !== 'US').sort((a, b) => a.name.localeCompare(b.name))
    ];
  }, []);
  const states = useMemo(() => {
    if (!country) return [];
    const countryObj = countries.find(c => c.isoCode === country || c.name === country);
    return countryObj ? State.getStatesOfCountry(countryObj.isoCode) : [];
  }, [country, countries]);

  const cities = useMemo(() => {
    if (!country || !state) return [];
    const countryObj = countries.find(c => c.isoCode === country || c.name === country);
    const stateObj = states.find(s => s.isoCode === state || s.name === state);
    if (!countryObj || !stateObj) return [];
    return City.getCitiesOfState(countryObj.isoCode, stateObj.isoCode);
  }, [country, state, countries, states]);

  // Load profile data on mount
  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);
        const userData = await apiClient.getProfile();

        if (userData) {
          setFirstName(userData.firstName || '');
          setLastName(userData.lastName || '');
          setEmail(userData.email || '');

          const fullPhone = userData.phone || '';
          const matchedCode = COUNTRY_CODES.find(code => {
            const prefix = code.split(' ')[0];
            return fullPhone.startsWith(prefix);
          }) || COUNTRY_CODES[0];

          const cleanPrefix = matchedCode.split(' ')[0];
          const localNumber = fullPhone.startsWith(cleanPrefix)
            ? fullPhone.slice(cleanPrefix.length)
            : fullPhone;

          setCountryCode(matchedCode);
          setPhone(localNumber.replace(/\D/g, ''));

          setDob(formatDateForInput(userData.dob));
          setProfileImageUrl(userData.profileImageUrl || '');

          setAddressLine1(userData.addressLine1 || '');
          setAddressLine2(userData.addressLine2 || '');
          setZipCode(userData.zipCode || '');

          const foundCountry = countries.find(c => c.isoCode === userData.country || c.name === userData.country);
          const countryIso = foundCountry?.isoCode || userData.country || '';
          setCountry(countryIso || 'US');

          if (foundCountry) {
            const countryStates = State.getStatesOfCountry(foundCountry.isoCode);
            const foundState = countryStates.find(s => s.isoCode === userData.state || s.name === userData.state);
            setState(foundState?.isoCode || userData.state || '');
          } else {
            setState(userData.state || '');
          }

          setCity(userData.city || '');
          setTaxId(userData.taxId || '');

          // Notification settings
          if (userData.notif_doc_uploaded !== undefined) setNotifDocUploaded(!!userData.notif_doc_uploaded);
          if (userData.notif_missing_doc !== undefined) setNotifMissingDoc(!!userData.notif_missing_doc);
          if (userData.notif_investor_msg !== undefined) setNotifInvestorMsg(!!userData.notif_investor_msg);
          if (userData.notif_reminder !== undefined) setNotifReminder(!!userData.notif_reminder);
          if (userData.notif_sms_security !== undefined) setNotifSmsSecurity(!!userData.notif_sms_security);
        }
        setError(null);
      } catch (err) {
        setError('Failed to load profile data');
        console.error('Error loading profile:', err);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      setSessionsLoading(true);
      const data = await apiClient.getSessions();
      setSessions(data.map((s: any) => ({
        id: s.id,
        device: s.name,
        status: s.subtitle,
        isActive: s.activeNow,
        signedInAt: s.signedInAt
      })));
    } catch (err) {
      console.error('Error loading sessions:', err);
    } finally {
      setSessionsLoading(false);
    }
  };

  // ── Security ──
  const [curPwd, setCurPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [authApp, setAuthApp] = useState(false);
  const [smsCodes, setSmsCodes] = useState(false);
  const [mfaSetupOpen, setMfaSetupOpen] = useState(false);
  const [mfaQrCode, setMfaQrCode] = useState('');
  const [mfaSecret, setMfaSecret] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  const [mfaRecoveryCodes, setMfaRecoveryCodes] = useState<string[]>([]);
  const [mfaLoading, setMfaLoading] = useState(false);
  const [showRecoveryCodes, setShowRecoveryCodes] = useState(false);
  const [sessions, setSessions] = useState<Session[]>(SESSIONS);

  // ── Notifications ──
  const [notifDocUploaded, setNotifDocUploaded] = useState(true);
  const [notifMissingDoc, setNotifMissingDoc] = useState(true);
  const [notifInvestorMsg, setNotifInvestorMsg] = useState(false);
  const [notifReminder, setNotifReminder] = useState(true);
  const [notifSmsSecurity, setNotifSmsSecurity] = useState(false);
  const [savingNotif, setSavingNotif] = useState(false);

  // ── Form errors ──
  const [profileErrors, setProfileErrors] = useState<Record<string, string>>({});
  const [securityErrors, setSecurityErrors] = useState<Record<string, string>>({});

  // ── Logout modal ──
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [revokingSessionId, setRevokingSessionId] = useState<string | null>(null);
  const [sessionToRevoke, setSessionToRevoke] = useState<Session | null>(null);
  const [isConfirmRevokeOpen, setIsConfirmRevokeOpen] = useState(false);

  // ── Validation helpers ──
  const isValidEmail = (val: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
  const isDigitsOnly = (val: string) => /^\d*$/.test(val);

  const validateProfile = () => {
    const errs: Record<string, string> = {};
    if (!firstName.trim()) {
      errs.firstName = 'First name is required';
    } else if (!/^[A-Za-z\s\-']+$/.test(firstName.trim())) {
      errs.firstName = 'First name can only contain letters';
    }

    if (!lastName.trim()) {
      errs.lastName = 'Last name is required';
    } else if (!/^[A-Za-z\s\-']+$/.test(lastName.trim())) {
      errs.lastName = 'Last name can only contain letters';
    }

    if (!email.trim()) {
      errs.email = 'Email is required';
    } else if (!isValidEmail(email)) {
      errs.email = 'Invalid email format';
    }

    if (!phone.trim()) {
      errs.phone = 'Phone number is required';
    } else if (!isDigitsOnly(phone)) {
      errs.phone = 'Phone number must contain only digits';
    } else {
      const cleanNumber = phone.trim();
      if (countryCode === '+1 (USA)') {
        if (cleanNumber.length !== 10) errs.phone = 'USA phone number must be 10 digits';
      } else if (countryCode === '+44 (UK)') {
        if (cleanNumber.length < 10 || cleanNumber.length > 11) errs.phone = 'UK phone number must be 10-11 digits';
      } else if (countryCode === '+91 (IN)') {
        if (cleanNumber.length !== 10) errs.phone = 'India phone number must be 10 digits';
      }
    }

    if (!dob.trim()) {
      errs.dob = 'Date of birth is required';
    }
    else {
      const birthDate = new Date(dob);
      const today = new Date();
      // Remove time part for accurate comparison
      today.setHours(0, 0, 0, 0);

      // ❌ Future date not allowed
      if (birthDate > today) {
        errs.dob = 'Future date is not allowed';
      }

      // let age = today.getFullYear() - birthDate.getFullYear();
      // const m = today.getMonth() - birthDate.getMonth();
      // if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      //   age--;
      // }

      // if (age < 18) {
      //   errs.dob = 'You must be at least 18 years old';
      // } else if (age > 70) {
      //   errs.dob = 'Age cannot exceed 70 years';
      // }
    }

    if (!addressLine1.trim()) errs.addressLine1 = 'Street address line 1 is required';

    if (!city.trim()) {
      errs.city = 'City is required';
    } else if (!/^[A-Za-z\s\-']+$/.test(city.trim())) {
      errs.city = 'City can only contain letters';
    }

    if (!state.trim()) errs.state = 'State is required';

    if (!zipCode.trim()) {
      errs.zipCode = 'ZIP code is required';
    } else if (!/^[a-zA-Z0-9\s\-]+$/.test(zipCode.trim())) {
      errs.zipCode = 'ZIP code can only contain letters, numbers, and hyphens';
    }

    if (!country.trim()) errs.country = 'Country is required';

    setProfileErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateSecurity = () => {
    const errs: Record<string, string> = {};
    if (!curPwd.trim()) errs.curPwd = 'Current password is required';
    if (!newPwd.trim()) errs.newPwd = 'New password is required';
    else if (newPwd.length < 8) errs.newPwd = 'Password must be at least 8 characters';
    if (!confirmPwd.trim()) errs.confirmPwd = 'Confirm password is required';
    else if (confirmPwd !== newPwd) errs.confirmPwd = 'Passwords do not match';
    setSecurityErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const onImgChange = (e: ChangeEvent<HTMLInputElement>) => {
    setProfileImg(e.target.files?.[0]?.name ?? '');
  };

  /* -----------------------------------
     Toggle
     ----------------------------------- */
  const renderToggle = (on: boolean, toggle: () => void) => {
    return (
      <button
        type="button"
        role="switch"
        aria-checked={on}
        onClick={toggle}
        className={`relative inline-flex h-[22px] w-[42px] shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 ${on ? 'bg-[#12B87A]' : 'bg-[#D1D5DB]'}`}
      >
        <span
          className={`pointer-events-none inline-block h-[18px] w-[18px] transform rounded-full bg-white shadow-sm transition-transform duration-200 ${on ? 'translate-x-[22px]' : 'translate-x-[2px]'}`}
        />
      </button>
    );
  };

  /* -----------------------------------
     TAB 1 - Profile Information
     ----------------------------------- */
  const renderProfileTab = () => (
    <div className="rounded-sm  sm:max-w-6xl mx-auto border border-[#ECEDEF] bg-white p-6 sm:p-8">
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <p className="text-[12px] text-[#A2A5AA]">Loading your profile...</p>
        </div>
      ) : (
        <>
          {error && <p className="mb-4 text-[10px] text-[#E05252]">{error}</p>}

          {/* Avatar upload */}
          <div className="mb-6 flex items-center gap-4">
            <input ref={imgRef} type="file" accept="image/*" className="hidden" onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              setProfileImg(file.name);
              try {
                setSaving(true);
                const result = await apiClient.uploadProfileImage(file);
                updateUser({ profileImageUrl: result.imageUrl });
                setProfileImageUrl(result.imageUrl);
                toast({ title: 'Success', description: 'Profile image updated', variant: 'success' });
              } catch (err: any) {
                toast({ title: 'Error', description: err.message || 'Upload failed', variant: 'destructive' });
              } finally {
                setSaving(false);
              }
            }} />
            <button
              type="button"
              onClick={() => imgRef.current?.click()}
              disabled={saving}
              className="group relative flex h-[60px] w-[60px] items-center justify-center overflow-hidden rounded-[8px] border-2 border-dashed border-[#D1D5DB] transition-all hover:border-[#D1A94C] disabled:opacity-70"
            >
              {profileImageUrl ? (
                <>
                  <img src={(() => {
                    if (!profileImageUrl) return '';
                    if (profileImageUrl.startsWith('http')) {
                      const url = new URL(profileImageUrl);
                      url.searchParams.set('t', profileTimestamp.toString());
                      return url.toString();
                    }
                    const baseUrl = BASE_URL;
                    const separator = profileImageUrl.includes('?') ? '&' : '?';
                    return `${baseUrl}${profileImageUrl}${separator}t=${profileTimestamp}`;
                  })()} alt="Profile" className="h-full w-full object-cover" />
                  {!saving && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Upload className="h-4 w-4 text-white" />
                    </div>
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center justify-center text-[#9CA3AF]">
                  <Plus className="h-4 w-4" />
                  <span className="text-[10px] uppercase font-helvetica">Upload</span>
                </div>
              )}
              {saving && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/70">
                  <Loader2 className="h-5 w-5 animate-spin text-[#D1A94C]" />
                </div>
              )}
            </button>
            <div>
              <p className="text-[13px] font-medium text-[#1F1F1F]">
                {profileImageUrl ? 'Change Profile Picture' : 'Upload Profile Picture'}
              </p>
              <p className="text-[11px] text-[#9CA3AF]">
                {profileImg || 'JPG, GIF or PNG. Max size 5MB.'}
              </p>
            </div>
          </div>

          {/* Form fields */}
          <div className="grid gap-5 sm:grid-cols-2">
            {/* First Name */}
            <div>
              <label className="mb-[6px] block text-[13px] font-medium text-[#1F1F1F] font-helvetica">First Name</label>
              <input
                placeholder="Enter first name"
                value={firstName}
                onChange={(e) => { setFirstName(e.target.value); setProfileErrors((p) => ({ ...p, firstName: '' })); }}
                className={`h-[42px] w-full rounded-[8px] border ${profileErrors.firstName ? 'border-red-400' : 'border-[#E5E7EB]'} bg-white px-4 text-[13px] text-[#1F1F1F] outline-none placeholder:text-[#9CA3AF] focus:border-[#D1A94C] font-helvetica`}
              />
              {profileErrors.firstName && <p className="mt-1 text-[11px] text-red-500 font-helvetica">{profileErrors.firstName}</p>}
            </div>
            {/* Last Name */}
            <div>
              <label className="mb-[6px] block text-[13px] font-medium text-[#1F1F1F] font-helvetica">Last Name</label>
              <input
                placeholder="Enter last name"
                value={lastName}
                onChange={(e) => { setLastName(e.target.value); setProfileErrors((p) => ({ ...p, lastName: '' })); }}
                className={`h-[42px] w-full rounded-[8px] border ${profileErrors.lastName ? 'border-red-400' : 'border-[#E5E7EB]'} bg-white px-4 text-[13px] text-[#1F1F1F] outline-none placeholder:text-[#9CA3AF] focus:border-[#D1A94C] font-helvetica`}
              />
              {profileErrors.lastName && <p className="mt-1 text-[11px] text-red-500 font-helvetica">{profileErrors.lastName}</p>}
            </div>
            {/* Email */}
            <div>
              <label className="mb-[6px] block text-[13px] font-medium text-[#1F1F1F] font-helvetica">Email</label>
              <input
                type="email"
                placeholder="Enter email"
                value={email}
                disabled
                title="Email cannot be changed"
                className={`h-[42px] w-full rounded-[8px] border ${profileErrors.email ? 'border-red-400' : 'border-[#E5E7EB]'} bg-gray-100 px-4 text-[13px] text-[#1F1F1F] outline-none placeholder:text-[#9CA3AF] focus:border-[#D1A94C] font-helvetica disabled:opacity-60`}
              />
              <p className="mt-1 text-[11px] text-[#9CA3AF] font-helvetica">Email cannot be changed for security reasons</p>
            </div>
            {/* Phone Number */}
            <div>
              <label className="mb-[6px] block text-[13px] font-medium text-[#1F1F1F] font-helvetica">Phone Number</label>
              <div className="flex gap-2">
                <div className="relative w-[120px] shrink-0">
                  <select
                    value={countryCode}
                    onChange={(e) => {
                      setCountryCode(e.target.value);
                      setProfileErrors((p) => ({ ...p, phone: '' }));
                    }}
                    className="h-[42px] w-full appearance-none rounded-[8px] border border-[#E5E7EB] bg-white pl-3 pr-7 text-[13px] text-[#374151] outline-none font-helvetica"
                  >
                    {COUNTRY_CODES.map(code => (
                      <option key={code} value={code}>{code}</option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF]" />
                </div>
                <input
                  type="tel"
                  inputMode="numeric"
                  placeholder="Enter phone number"
                  value={phone}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (isDigitsOnly(val)) { setPhone(val); setProfileErrors((p) => ({ ...p, phone: '' })); }
                  }}
                  className={`h-[42px] w-full rounded-[8px] border ${profileErrors.phone ? 'border-red-400' : 'border-[#E5E7EB]'} bg-white px-4 text-[13px] text-[#1F1F1F] outline-none placeholder:text-[#9CA3AF] focus:border-[#D1A94C] font-helvetica`}
                />
              </div>
              {profileErrors.phone && <p className="mt-1 text-[11px] text-red-500 font-helvetica">{profileErrors.phone}</p>}
            </div>
            {/* Date of Birth */}
            <div>
              <label className="mb-[6px] block text-[13px] font-medium text-[#1F1F1F] font-helvetica">Date of Birth</label>
              <div className="relative">
                <input
                  ref={dobRef}
                  type="date"
                  placeholder="Select date of birth"
                  value={dob}
                  max={new Date().toISOString().split('T')[0]}
                  onChange={(e) => { setDob(e.target.value); setProfileErrors((p) => ({ ...p, dob: '' })); }}
                  className={`h-[42px] w-full rounded-[8px] border ${profileErrors.dob ? 'border-red-400' : 'border-[#E5E7EB]'} bg-white px-4 pr-10 text-[13px] text-[#1F1F1F] outline-none placeholder:text-[#9CA3AF] focus:border-[#D1A94C] font-helvetica`}
                  style={{ colorScheme: 'light' }}
                />
                <button type="button" onClick={() => dobRef.current?.showPicker()} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#6B7280]">
                  <CalendarDays className="h-[18px] w-[18px]" />
                </button>
                <style>{`input[type="date"]::-webkit-calendar-picker-indicator { display: none !important; } input[type="date"]::-webkit-inner-spin-button { display: none; }`}</style>
              </div>
              {profileErrors.dob && <p className="mt-1 text-[11px] text-red-500 font-helvetica">{profileErrors.dob}</p>}
            </div>

            {/* Street Address Line 1 */}
            <div>
              <label className="mb-[6px] block text-[13px] font-medium text-[#1F1F1F] font-helvetica">Street Address Line 1</label>
              <input
                placeholder="Enter street address line 1"
                value={addressLine1}
                onChange={(e) => { setAddressLine1(e.target.value); setProfileErrors((p) => ({ ...p, addressLine1: '' })); }}
                className={`h-[42px] w-full rounded-[8px] border ${profileErrors.addressLine1 ? 'border-red-400' : 'border-[#E5E7EB]'} bg-white px-4 text-[13px] text-[#1F1F1F] outline-none placeholder:text-[#9CA3AF] focus:border-[#D1A94C] font-helvetica`}
              />
              {profileErrors.addressLine1 && <p className="mt-1 text-[11px] text-red-500 font-helvetica">{profileErrors.addressLine1}</p>}
            </div>

            {/* Street Address Line 2 */}
            <div>
              <label className="mb-[6px] block text-[13px] font-medium text-[#1F1F1F] font-helvetica">Street Address Line 2</label>
              <input
                placeholder="Enter street address line 2"
                value={addressLine2}
                onChange={(e) => setAddressLine2(e.target.value)}
                className="h-[42px] w-full rounded-[8px] border border-[#E5E7EB] bg-white px-4 text-[13px] text-[#1F1F1F] outline-none placeholder:text-[#9CA3AF] focus:border-[#D1A94C] font-helvetica"
              />
            </div>

            {/* Country */}
            <div>
              <label className="mb-[6px] block text-[13px] font-medium text-[#1F1F1F] font-helvetica">Country</label>
              <Combobox
                options={countries.map((c) => ({ label: c.name, value: c.isoCode }))}
                value={country}
                onChange={(val) => {
                  setCountry(val);
                  setState('');
                  setCity('');
                  setProfileErrors((p) => ({ ...p, country: '' }));
                }}
                placeholder="Select country"
                className={cn(
                  "h-[42px] rounded-[8px] text-[13px]",
                  profileErrors.country ? 'border-red-400' : 'border-[#E5E7EB]'
                )}
              />
              {profileErrors.country && <p className="mt-1 text-[11px] text-red-500 font-helvetica">{profileErrors.country}</p>}
            </div>

            {/* State */}
            <div>
              <label className="mb-[6px] block text-[13px] font-medium text-[#1F1F1F] font-helvetica">State</label>
              <Combobox
                options={states.map((s) => ({ label: s.name, value: s.isoCode }))}
                value={state}
                onChange={(val) => {
                  setState(val);
                  setCity('');
                  setProfileErrors((p) => ({ ...p, state: '' }));
                }}
                placeholder="Select state"
                className={cn(
                  "h-[42px] rounded-[8px] text-[13px]",
                  profileErrors.state ? 'border-red-400' : 'border-[#E5E7EB]'
                )}
              />
              {profileErrors.state && <p className="mt-1 text-[11px] text-red-500 font-helvetica">{profileErrors.state}</p>}
            </div>

            {/* City */}
            <div>
              <label className="mb-[6px] block text-[13px] font-medium text-[#1F1F1F] font-helvetica">City</label>
              <Combobox
                options={cities.map((c) => ({ label: c.name, value: c.name }))}
                value={city}
                onChange={(val) => {
                  setCity(val);
                  setProfileErrors((p) => ({ ...p, city: '' }));
                }}
                placeholder="Select city"
                className={cn(
                  "h-[42px] rounded-[8px] text-[13px]",
                  profileErrors.city ? 'border-red-400' : 'border-[#E5E7EB]'
                )}
              />
              {profileErrors.city && <p className="mt-1 text-[11px] text-red-500 font-helvetica">{profileErrors.city}</p>}
            </div>

            {/* Zip Code */}
            <div>
              <label className="mb-[6px] block text-[13px] font-medium text-[#1F1F1F] font-helvetica">Zip Code</label>
              <input
                placeholder="Enter zip code"
                value={zipCode}
                onChange={(e) => { setZipCode(e.target.value); setProfileErrors((p) => ({ ...p, zipCode: '' })); }}
                className={`h-[42px] w-full rounded-[8px] border ${profileErrors.zipCode ? 'border-red-400' : 'border-[#E5E7EB]'} bg-white px-4 text-[13px] text-[#1F1F1F] outline-none placeholder:text-[#9CA3AF] focus:border-[#D1A94C] font-helvetica`}
              />
              {profileErrors.zipCode && <p className="mt-1 text-[11px] text-red-500 font-helvetica">{profileErrors.zipCode}</p>}
            </div>
          </div>

          <div className="mt-6 max-w-[360px]">
            <label className="mb-[6px] block text-[13px] font-medium text-[#1F1F1F] font-helvetica">TAX Information</label>
            <p className="mb-2 text-[11px] text-[#9CA3AF] font-helvetica">Social Security Number / Tax ID</p>
            <input
              placeholder="Format: XXX-XX-XXXX"
              value={taxId}
              maxLength={11}
              onChange={(e) => {
                let val = e.target.value.replace(/\D/g, '');
                if (val.length > 9) val = val.slice(0, 9);

                let formatted = val;
                if (val.length > 3 && val.length <= 5) {
                  formatted = `${val.slice(0, 3)}-${val.slice(3)}`;
                } else if (val.length > 5) {
                  formatted = `${val.slice(0, 3)}-${val.slice(3, 5)}-${val.slice(5)}`;
                }
                setTaxId(formatted);
              }}
              className="h-[42px] w-full rounded-[8px] border border-[#E5E7EB] bg-white px-4 text-[13px] text-[#1F1F1F] outline-none placeholder:text-[#9CA3AF] focus:border-[#D1A94C] font-helvetica"
            />
            <p className="mt-1 text-[11px] text-[#9CA3AF] font-helvetica">Your information is encrypted and secure</p>
          </div>

          {profileSaved && <p className="mt-3 text-[12px] text-[#16A66A] font-helvetica">Profile updated successfully!</p>}

          {/* Action buttons */}
          <div className="mt-8 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => {
                setFirstName(''); setLastName(''); setEmail('');
                setPhone(''); setDob(''); setProfileImg(''); setProfileImageUrl('');
                setAddressLine1(''); setAddressLine2(''); setCity(''); setState(''); setZipCode(''); setCountry('');
                setProfileErrors({});
                setProfileSaved(false);
              }}
              className="h-[40px] min-w-[100px] rounded-full border border-[#E5E7EB] bg-white px-6 text-[13px] font-medium text-[#6B7280] hover:bg-[#F9FAFB] transition-colors font-helvetica"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={async () => {
                if (!validateProfile()) return;

                setSaving(true);
                try {
                  const prefix = countryCode.split(' ')[0];
                  const updateData = {
                    firstName,
                    lastName,
                    email,
                    phone: `${countryCode} ${phone}`,
                    dob,
                    addressLine1,
                    addressLine2,
                    city,
                    state,
                    zipCode,
                    country,
                    taxId,
                  };

                  await apiClient.updateProfile(updateData);
                  setProfileSaved(true);
                  setError(null);

                  toast({
                    title: 'Success',
                    description: 'Profile updated successfully',
                    variant: 'success',
                  });

                  setTimeout(() => setProfileSaved(false), 3000);
                } catch (err) {
                  setError('Failed to update profile. Please try again.');
                  console.error('Error updating profile:', err);
                } finally {
                  setSaving(false);
                }
              }}
              className="h-[40px] min-w-[100px] rounded-full bg-gradient-to-r from-[#FFC63F] to-[#F1DD58] px-6 text-[13px] font-semibold text-[#1F1F1F] shadow-sm hover:shadow-md transition-shadow font-helvetica disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </>
      )}
    </div>
  );

  /* -----------------------------------
     TAB 2 — Security & Login
     ----------------------------------- */
  const renderSecurityTab = () => (
    <div className="space-y-5">
      {/* Change Password */}
      <div className="rounded-sm  sm:max-w-6xl mx-auto border border-[#ECEDEF] bg-white">
        <div className="border-b border-[#ECEDEF] px-6 py-4">
          <h3 className="text-[17px] font-semibold text-[#1F1F1F] font-goudy">Change Password</h3>
        </div>
        <div className="p-6">
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="sm:col-span-2 sm:max-w-[calc(50%-10px)]">
              <label className="mb-[6px] block text-[13px] font-medium text-[#1F1F1F] font-helvetica">Current Password</label>
              <PasswordInput
                placeholder="Enter current password"
                value={curPwd}
                onChange={(e) => { setCurPwd(e.target.value); setSecurityErrors((p) => ({ ...p, curPwd: '' })); }}
                className={securityErrors.curPwd ? 'border-red-400' : ''}
              />
              {securityErrors.curPwd && <p className="mt-1 text-[11px] text-red-500 font-helvetica">{securityErrors.curPwd}</p>}
            </div>
            <div>
              <label className="mb-[6px] block text-[13px] font-medium text-[#1F1F1F] font-helvetica">New Password</label>
              <PasswordInput
                placeholder="Enter new password"
                value={newPwd}
                onChange={(e) => { setNewPwd(e.target.value); setSecurityErrors((p) => ({ ...p, newPwd: '' })); }}
                className={securityErrors.newPwd ? 'border-red-400' : ''}
              />
              {securityErrors.newPwd && <p className="mt-1 text-[11px] text-red-500 font-helvetica">{securityErrors.newPwd}</p>}
            </div>
            <div>
              <label className="mb-[6px] block text-[13px] font-medium text-[#1F1F1F] font-helvetica">Confirm Password</label>
              <PasswordInput
                placeholder="Enter confirm password"
                value={confirmPwd}
                onChange={(e) => { setConfirmPwd(e.target.value); setSecurityErrors((p) => ({ ...p, confirmPwd: '' })); }}
                className={securityErrors.confirmPwd ? 'border-red-400' : ''}
              />
              {securityErrors.confirmPwd && <p className="mt-1 text-[11px] text-red-500 font-helvetica">{securityErrors.confirmPwd}</p>}
            </div>
          </div>
          <div className="mt-5 flex justify-end">
            <button
              type="button"
              disabled={saving}
              onClick={async () => {
                if (!validateSecurity()) return;

                setSaving(true);
                try {
                  await apiClient.changePassword({
                    oldPassword: curPwd,
                    newPassword: newPwd,
                  });

                  toast({
                    title: 'Success',
                    description: 'Password updated successfully',
                    variant: 'success',
                  });

                  setCurPwd('');
                  setNewPwd('');
                  setConfirmPwd('');
                  setError(null);
                } catch (err: any) {
                  const errorMsg = err.message || 'Failed to update password';
                  toast({
                    title: 'Error',
                    description: errorMsg,
                    variant: 'destructive',
                  });
                } finally {
                  setSaving(false);
                }
              }}
              className="h-[40px] min-w-[100px] rounded-full bg-gradient-to-r from-[#FFC63F] to-[#F1DD58] px-6 text-[13px] font-semibold text-[#1F1F1F] shadow-sm hover:shadow-md transition-all font-helvetica disabled:opacity-50"
            >
              {saving ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </div>
      </div>

      {/* Two-Factor Authentication */}
      <div className="rounded-sm  sm:max-w-6xl mx-auto border border-[#ECEDEF] bg-white">
        <div className="border-b border-[#ECEDEF] px-6 py-4">
          <h3 className="text-[17px] font-semibold text-[#1F1F1F] font-goudy">Two-Factor Authentication</h3>
        </div>
        <div className="px-6 py-2">
          {/* Authenticator App */}
          <div className="flex items-center justify-between border-b border-[#ECEDEF] py-4">
            <div>
              <p className="text-[14px] font-semibold text-[#1F1F1F] font-helvetica">Authenticator App</p>
              <p className="mt-[2px] text-[12px] text-[#9CA3AF] font-helvetica">Time-based one-time password (OTP)</p>
            </div>
            {renderToggle(user?.twoFactorEnabled || false, async () => {
              if (user?.twoFactorEnabled) {
                if (confirm('Are you sure you want to disable 2FA?')) {
                  try {
                    await apiClient.disableTwoFactor();
                    refreshUser();
                    toast({ title: 'Success', description: '2FA Disabled', variant: 'success' });
                  } catch (err: any) {
                    toast({ title: 'Error', description: err.message || 'Failed to disable 2FA', variant: 'destructive' });
                  }
                }
              } else {
                try {
                  const res = await apiClient.generateTwoFactor();
                  setMfaQrCode(res.qrCodeDataUrl);
                  setMfaSecret(res.secret);
                  setMfaCode('');
                  setMfaSetupOpen(true);
                } catch (err: any) {
                  toast({ title: 'Error', description: err.message || 'Failed to start 2FA setup', variant: 'destructive' });
                }
              }
            })}
          </div>
          <div className="flex items-center justify-between border-b border-[#ECEDEF] py-4">
            <div>
              <p className="text-[14px] font-semibold text-[#1F1F1F] font-helvetica">SMS Backup Codes</p>
              <p className="mt-[2px] text-[12px] text-[#9CA3AF] font-helvetica">Receive codes via text message as a backup.</p>
            </div>
            {renderToggle(notifSmsSecurity, async () => {
              try {
                const newVal = !notifSmsSecurity;
                await apiClient.updateProfile({ notif_sms_security: newVal });
                setNotifSmsSecurity(newVal);
                toast({ title: 'Success', description: `SMS Backup ${newVal ? 'enabled' : 'disabled'}`, variant: 'success' });
              } catch (err: any) {
                toast({ title: 'Error', description: 'Failed to update SMS backup setting', variant: 'destructive' });
              }
            })}
          </div>
          {/* Download Recovery Codes */}
          <div className="py-4">
            <button
              type="button"
              disabled={!user?.twoFactorEnabled || !user?.twoFactorRecoveryCodes?.length}
              onClick={() => {
                if (!user?.twoFactorRecoveryCodes?.length) return;
                const element = document.createElement("a");
                const file = new Blob([user.twoFactorRecoveryCodes.join('\n')], {type: 'text/plain'});
                element.href = URL.createObjectURL(file);
                element.download = "recovery-codes.txt";
                document.body.appendChild(element);
                element.click();
                document.body.removeChild(element);
                toast({ title: 'Downloaded', description: 'Recovery codes have been downloaded.', variant: 'success' });
              }}
              className="h-[40px] rounded-full bg-gradient-to-r from-[#FFC63F] to-[#F1DD58] px-6 text-[13px] font-semibold text-[#1F1F1F] shadow-sm hover:shadow-md transition-all font-helvetica disabled:opacity-50"
            >
              Download Recovery Codes
            </button>
          </div>
        </div>
      </div>

      {/* Active Sessions */}
      <div className="rounded-sm  sm:max-w-6xl mx-auto border border-[#ECEDEF] bg-white">
        <div className="border-b border-[#ECEDEF] px-6 py-4">
          <h3 className="text-[17px] font-semibold text-[#1F1F1F] font-goudy">Active Sessions</h3>
        </div>
        <div className="px-6 py-3">
          <p className="text-[12px] text-[#9CA3AF] font-helvetica">
            Review and manage devices currently logged into your account.
          </p>
          <div className="mt-2 divide-y divide-[#ECEDEF]">
            {sessionsLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-[#D1A94C]" />
              </div>
            ) : sessions.length === 0 ? (
              <p className="py-4 text-center text-[13px] text-[#9CA3AF]">No active sessions found.</p>
            ) : (
              sessions.map((s) => (
                <div key={s.id} className="flex items-center justify-between py-4">
                  <div>
                    <p className="text-[13px] text-[#1F1F1F] font-helvetica">{s.device}</p>
                    <p className={`mt-[2px] text-[11px] font-semibold font-helvetica ${s.isActive ? 'text-[#16A66A]' : 'text-[#9CA3AF]'}`}>
                      {s.status}
                    </p>
                    <p className="mt-0.5 text-[10px] text-[#A2A5AA]">
                      Logged in: {s.signedInAt}
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={revokingSessionId === s.id}
                    onClick={() => {
                      if (s.isActive) {
                        toast({
                          title: 'Current Session',
                          description: 'You cannot log out of your current session here. Please use the Sign Out button.',
                          variant: 'warning',
                        });
                        return;
                      }
                      setSessionToRevoke(s);
                      setIsConfirmRevokeOpen(true);
                    }}
                    className="flex h-[32px] items-center justify-center gap-2 rounded-full bg-[#FBCB4B] px-4 text-[11px] font-semibold text-[#1F1F1F] hover:bg-[#F9BF2A] transition-colors font-helvetica disabled:opacity-50"
                  >
                    {revokingSessionId === s.id && <Loader2 className="h-3 w-3 animate-spin" />}
                    Log Out
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Dialog for Revoking Session */}
      <AlertDialog open={isConfirmRevokeOpen} onOpenChange={setIsConfirmRevokeOpen}>
        <AlertDialogContent className="max-w-[400px] rounded-[20px] border-none bg-white p-6 shadow-2xl">
          <AlertDialogHeader>
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
              <LogOut className="h-6 w-6 text-red-500" />
            </div>
            <AlertDialogTitle className="text-center text-[18px] font-semibold text-[#1F1F1F]">
              Terminate Session?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center text-[14px] text-[#6B7280]">
              Are you sure you want to log out from <span className="font-medium text-[#1F1F1F]">{sessionToRevoke?.device}</span>? 
              This will immediately end the session on that device.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-6 flex gap-3 sm:justify-center">
            <AlertDialogCancel className="h-[44px] flex-1 rounded-full border border-[#E5E7EB] bg-white text-[14px] font-medium text-[#6B7280] hover:bg-[#F9FAFB] transition-colors">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={async (e) => {
                e.preventDefault();
                if (!sessionToRevoke) return;
                
                try {
                  setRevokingSessionId(sessionToRevoke.id);
                  setIsConfirmRevokeOpen(false);
                  await apiClient.deleteSession(sessionToRevoke.id);
                  setSessions(prev => prev.filter(item => item.id !== sessionToRevoke.id));
                  toast({ title: 'Success', description: 'Session terminated', variant: 'success' });
                } catch (err: any) {
                  toast({ title: 'Error', description: err.message || 'Failed to terminate session', variant: 'destructive' });
                } finally {
                  setRevokingSessionId(null);
                  setSessionToRevoke(null);
                }
              }}
              className="h-[44px] flex-1 rounded-full bg-red-500 text-[14px] font-semibold text-white shadow-sm hover:bg-red-600 transition-colors"
            >
              Log Out
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* MFA Setup Modal */}
      <AlertDialog open={mfaSetupOpen} onOpenChange={setMfaSetupOpen}>
        <AlertDialogContent className="max-w-[440px] rounded-[20px] bg-white p-6 shadow-2xl border-none">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-center text-[20px] font-bold text-[#1F1F1F]">
              {showRecoveryCodes ? 'Backup Recovery Codes' : 'Secure Your Account'}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center text-[14px] text-[#6B7280]">
              {showRecoveryCodes 
                ? 'Save these codes in a safe place. You can use them to access your account if you lose your phone.'
                : 'Scan the QR code below with your authenticator app (like Google Authenticator or Authy).'}
            </AlertDialogDescription>
          </AlertDialogHeader>

          {showRecoveryCodes ? (
            <div className="mt-4">
              <div className="grid grid-cols-2 gap-2 bg-[#F9FAFB] p-4 rounded-xl border border-[#ECEDEF]">
                {mfaRecoveryCodes.map((code, idx) => (
                  <div key={idx} className="text-[14px] font-mono text-[#1F1F1F] text-center py-1">
                    {code}
                  </div>
                ))}
              </div>
              <div className="mt-6 flex flex-col gap-3">
                <button
                  onClick={() => {
                    const text = mfaRecoveryCodes.join('\n');
                    navigator.clipboard.writeText(text);
                    toast({ title: 'Copied', description: 'Recovery codes copied to clipboard', variant: 'success' });
                  }}
                  className="h-[44px] rounded-full border border-[#E5E7EB] bg-white text-[14px] font-medium text-[#1F1F1F] hover:bg-[#F9FAFB] transition-colors"
                >
                  Copy to Clipboard
                </button>
                <AlertDialogAction
                  onClick={() => {
                    setMfaSetupOpen(false);
                    setShowRecoveryCodes(false);
                    refreshUser();
                  }}
                  className="h-[44px] rounded-full bg-[#FBCB4B] text-[14px] font-semibold text-[#1F1F1F] hover:bg-[#F9BF2A] transition-colors"
                >
                  I've Saved These Codes
                </AlertDialogAction>
              </div>
            </div>
          ) : (
            <div className="mt-4 flex flex-col items-center">
              {mfaQrCode ? (
                <div className="bg-white p-3 rounded-xl border border-[#ECEDEF] mb-6">
                  <img src={mfaQrCode} alt="2FA QR Code" className="w-[180px] h-[180px]" />
                </div>
              ) : (
                <div className="w-[180px] h-[180px] flex items-center justify-center bg-[#F9FAFB] rounded-xl mb-6">
                  <Loader2 className="h-8 w-8 animate-spin text-[#FBCB4B]" />
                </div>
              )}

              <div className="w-full space-y-4">
                <div>
                  <label className="block text-[12px] font-medium text-[#4B4B4B] mb-1.5">
                    Verification Code
                  </label>
                  <input
                    type="text"
                    placeholder="Enter 6-digit code"
                    value={mfaCode}
                    onChange={(e) => setMfaCode(e.target.value)}
                    className="h-[44px] w-full rounded-full border border-[#E5E7EB] px-4 text-[14px] text-center tracking-[0.5em] font-semibold focus:border-[#FBCB4B] focus:ring-1 focus:ring-[#FBCB4B] outline-none"
                    maxLength={6}
                  />
                </div>
                
                <div className="flex gap-3">
                  <AlertDialogCancel className="h-[44px] flex-1 rounded-full border border-[#E5E7EB] bg-white text-[14px] font-medium text-[#6B7280]">
                    Cancel
                  </AlertDialogCancel>
                  <button
                    onClick={async () => {
                      if (mfaCode.length !== 6) {
                        toast({ title: 'Invalid Code', description: 'Please enter a 6-digit code', variant: 'destructive' });
                        return;
                      }
                      setMfaLoading(true);
                      try {
                        const res = await apiClient.enableTwoFactor(mfaCode);
                        setMfaRecoveryCodes(res.recoveryCodes);
                        setShowRecoveryCodes(true);
                        toast({ title: '2FA Enabled', description: 'Your account is now more secure', variant: 'success' });
                      } catch (err: any) {
                        toast({ title: 'Error', description: err.message || 'Failed to enable 2FA', variant: 'destructive' });
                      } finally {
                        setMfaLoading(false);
                      }
                    }}
                    disabled={mfaLoading || mfaCode.length !== 6}
                    className="h-[44px] flex-1 rounded-full bg-[#FBCB4B] text-[14px] font-semibold text-[#1F1F1F] hover:bg-[#F9BF2A] transition-colors disabled:opacity-50"
                  >
                    {mfaLoading ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : 'Verify & Enable'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );

  const handleSaveNotifications = async () => {
    try {
      setSavingNotif(true);
      await apiClient.updateSettings({
        notif_doc_uploaded: notifDocUploaded,
        notif_missing_doc: notifMissingDoc,
        notif_investor_msg: notifInvestorMsg,
        notif_reminder: notifReminder,
      });
      toast({
        title: 'Success',
        description: 'Notification settings updated successfully',
        variant: 'success',
      });
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to update notification settings',
        variant: 'destructive',
      });
    } finally {
      setSavingNotif(false);
    }
  };

  /* -----------------------------------
     TAB 3 — Notifications
     ----------------------------------- */
  const renderNotificationsTab = () => (
    <div>
      <div className="rounded-sm  sm:max-w-6xl mx-auto border border-[#ECEDEF] bg-white">
        <div className="border-b border-[#ECEDEF] px-6 py-4">
          <h3 className="text-[17px] font-semibold text-[#1F1F1F] font-goudy">Notifications</h3>
        </div>
        <div className="px-6 py-2">
          {/* New document uploaded */}
          <div className="flex items-center justify-between border-b border-[#ECEDEF] py-4">
            <span className="text-[14px] text-[#1F1F1F] font-helvetica">New document uploaded</span>
            {renderToggle(notifDocUploaded, () => {
              const newState = !notifDocUploaded;
              setNotifDocUploaded(newState);
              toast({
                title: newState ? 'Notification Enabled' : 'Notification Disabled',
                description: `New document uploaded notification ${newState ? 'turned on' : 'turned off'}.`,
                variant: newState ? 'enable' : ('disable' as any),
              });
            })}
          </div>
          {/* Missing document alerts */}
          <div className="flex items-center justify-between border-b border-[#ECEDEF] py-4">
            <span className="text-[14px] text-[#1F1F1F] font-helvetica">Missing document alerts</span>
            {renderToggle(notifMissingDoc, () => {
              const newState = !notifMissingDoc;
              setNotifMissingDoc(newState);
              toast({
                title: newState ? 'Notification Enabled' : 'Notification Disabled',
                description: `Missing document alerts ${newState ? 'turned on' : 'turned off'}.`,
                variant: newState ? 'enable' : ('disable' as any),
              });
            })}
          </div>
          {/* New investor messages */}
          <div className="flex items-center justify-between border-b border-[#ECEDEF] py-4">
            <span className="text-[14px] text-[#1F1F1F] font-helvetica">New investor messages</span>
            {renderToggle(notifInvestorMsg, () => {
              const newState = !notifInvestorMsg;
              setNotifInvestorMsg(newState);
              toast({
                title: newState ? 'Notification Enabled' : 'Notification Disabled',
                description: `New investor messages notification ${newState ? 'turned on' : 'turned off'}.`,
                variant: newState ? 'enable' : ('disable' as any),
              });
            })}
          </div>
          {/* Reminder */}
          <div className="flex items-center justify-between py-4">
            <span className="text-[14px] text-[#1F1F1F] font-helvetica">Reminder</span>
            {renderToggle(notifReminder, () => {
              const newState = !notifReminder;
              setNotifReminder(newState);
              toast({
                title: newState ? 'Notification Enabled' : 'Notification Disabled',
                description: `Reminder notification ${newState ? 'turned on' : 'turned off'}.`,
                variant: newState ? 'enable' : ('disable' as any),
              });
            })}
          </div>
        </div>


        {/* Save button */}
        <div className="mt-5 flex justify-end mb-3 mr-3">
          <button
            type="button"
            onClick={handleSaveNotifications}
            disabled={savingNotif}
            className="h-[40px] min-w-[100px] rounded-full bg-[#FBCB4B] px-6 text-[13px] font-semibold text-[#1F1F1F] shadow-sm hover:shadow-md transition-shadow font-helvetica disabled:opacity-50"
          >
            {savingNotif ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );

  /* -----------------------------------
     LOGOUT CONFIRMATION MODAL
     ----------------------------------- */
  const renderLogoutModal = () => {
    if (!logoutOpen) return null;
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40">
        <div className="relative mx-4 w-full max-w-[536px] rounded-sm bg-white p-5 shadow-xl">
          {/* Close */}
          <button
            type="button"
            onClick={() => setLogoutOpen(false)}
            className="absolute right-4 top-4 text-[#6B7280] hover:text-[#374151] transition-colors"
          >
            <X className="h-5 w-5" strokeWidth={2.5} />
          </button>

          <h2 className="text-[18px] font-semibold text-[#1F1F1F] font-goudy">Log Out</h2>
          <p className="mt-1 text-[13px] text-[#6B7280] font-helvetica">
            Are you sure you want to log out this account?
          </p>

          <div className="mt-7 flex justify-end gap-4">
            <button
              type="button"
              onClick={() => setLogoutOpen(false)}
              className="h-[40px] min-w-[120px] rounded-full bg-[#FFF8E1] px-7 text-[14px] font-medium text-[#B8860B] hover:bg-[#FFECB3] transition-colors font-helvetica"
            >
              No
            </button>
            <button
              type="button"
              onClick={() => {
                setLogoutOpen(false);
                logout();
                router.push('/');
              }}
              className="h-[40px] min-w-[120px] rounded-full px-7 text-[14px] font-semibold text-[#7A5C00] hover:opacity-90 transition-colors font-helvetica bg-[#FBCB4B]"
            >
              Yes
            </button>
          </div>
        </div>
      </div>
    );
  };

  /* -----------------------------------
     PAGE LAYOUT
     ----------------------------------- */
  return (
    <div className="mx-auto w-full max-w-8xl font-helvetica">
      {/* Title */}
      <h1 className="text-[26px] font-bold leading-8 text-[#1F1F1F] font-goudy">Settings</h1>
      <p className="mt-1 text-[13px] text-[#9CA3AF] font-helvetica">
        Manage your account preferences and security.
      </p>

      {/* Tabs */}
      <div className="mt-5 flex gap-6 border-b border-[#ECEDEF]">
        {TAB_LIST.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`relative pb-3 text-[14px] font-helvetica transition-colors ${tab === t.id
              ? 'font-medium text-[#2A4474]'
              : 'text-[#9CA3AF] hover:text-[#6B7280]'
              }`}
          >
            {t.label}
            {tab === t.id && (
              <span className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[3px] w-[50%] rounded-full bg-[#FBCB4B]" />
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="mt-6 pb-8">
        {tab === 'profile' && renderProfileTab()}
        {tab === 'security' && renderSecurityTab()}
        {tab === 'notifications' && renderNotificationsTab()}
      </div>

      {renderLogoutModal()}
    </div>
  );
}
