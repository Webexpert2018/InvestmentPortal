'use client';

import { useState, useMemo, useRef, useEffect, ChangeEvent } from 'react';
import { CalendarDays, ChevronDown, Plus, X, Eye, EyeOff, Loader2, Upload } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { apiClient, BASE_URL } from '@/lib/api/client';
import { Country, State, City } from 'country-state-city';
import { Combobox } from '@/components/ui/combobox';
import { cn } from '@/lib/utils';

/* ═══════════════════════════════════════════════════════
   TYPES & DATA
   ═══════════════════════════════════════════════════════ */

type AcctTab = 'profile' | 'security' | 'notifications';

interface Session {
  id: string;
  device: string;
  status: string;
  isActive: boolean;
}

const TAB_LIST: { id: AcctTab; label: string }[] = [
  { id: 'profile', label: 'Profile Information' },
  { id: 'security', label: 'Security & Login' },
  { id: 'notifications', label: 'Notification' },
];

const COUNTRY_CODES = ['+1 (USA)', '+44 (UK)', '+91 (IN)'];

const SESSIONS: Session[] = [
  { id: 's1', device: 'Chrome on macOS (Current) - New York, USA', status: 'ACTIVE NOW', isActive: true },
  { id: 's2', device: 'Safari on Windows - London, UK', status: '2 hours ago', isActive: false },
];

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
  const { logout } = useAuth();
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
  const [country, setCountry] = useState('');

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
          setCountry(countryIso);

          if (foundCountry) {
            const countryStates = State.getStatesOfCountry(foundCountry.isoCode);
            const foundState = countryStates.find(s => s.isoCode === userData.state || s.name === userData.state);
            setState(foundState?.isoCode || userData.state || '');
          } else {
            setState(userData.state || '');
          }

          setCity(userData.city || '');
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
  }, []);

  // ── Security ──
  const [curPwd, setCurPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [authApp, setAuthApp] = useState(false);
  const [smsCodes, setSmsCodes] = useState(false);
  const [sessions, setSessions] = useState<Session[]>(SESSIONS);

  // ── Notifications ──
  const [notifDocUploaded, setNotifDocUploaded] = useState(true);
  const [notifMissingDoc, setNotifMissingDoc] = useState(true);
  const [notifInvestorMsg, setNotifInvestorMsg] = useState(false);
  const [notifReminder, setNotifReminder] = useState(true);

  // ── Form errors ──
  const [profileErrors, setProfileErrors] = useState<Record<string, string>>({});
  const [securityErrors, setSecurityErrors] = useState<Record<string, string>>({});

  // ── Logout modal ──
  const [logoutOpen, setLogoutOpen] = useState(false);

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

  /* ─────────────── Toggle ─────────────── */
  const Toggle = ({ on, toggle }: { on: boolean; toggle: () => void }) => (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={toggle}
      className={`relative inline-flex h-[22px] w-[42px] shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 ${on ? 'bg-[#2196F3]' : 'bg-[#D1D5DB]'
        }`}
    >
      <span
        className={`pointer-events-none inline-block h-[18px] w-[18px] transform rounded-full bg-white shadow-sm transition-transform duration-200 ${on ? 'translate-x-[22px]' : 'translate-x-[2px]'
          }`}
      />
    </button>
  );

  /* ═══════════════════════════════════════
     TAB 1 — Profile Information
     ═══════════════════════════════════════ */
  const ProfileTab = () => (
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
                  <img src={`${BASE_URL}${profileImageUrl}`} alt="Profile" className="h-full w-full object-cover" />
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

            {/* ZIP Code */}
            <div>
              <label className="mb-[6px] block text-[13px] font-medium text-[#1F1F1F] font-helvetica">ZIP Code</label>
              <input
                placeholder="Enter zip code"
                value={zipCode}
                onChange={(e) => { setZipCode(e.target.value); setProfileErrors((p) => ({ ...p, zipCode: '' })); }}
                className={`h-[42px] w-full rounded-[8px] border ${profileErrors.zipCode ? 'border-red-400' : 'border-[#E5E7EB]'} bg-white px-4 text-[13px] text-[#1F1F1F] outline-none placeholder:text-[#9CA3AF] focus:border-[#D1A94C] font-helvetica`}
              />
              {profileErrors.zipCode && <p className="mt-1 text-[11px] text-red-500 font-helvetica">{profileErrors.zipCode}</p>}
            </div>
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

  /* ═══════════════════════════════════════
     TAB 2 — Security & Login
     ═══════════════════════════════════════ */
  const SecurityTab = () => (
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
            <Toggle on={authApp} toggle={() => setAuthApp(!authApp)} />
          </div>
          {/* SMS Backup Codes */}
          <div className="flex items-center justify-between border-b border-[#ECEDEF] py-4">
            <div>
              <p className="text-[14px] font-semibold text-[#1F1F1F] font-helvetica">SMS Backup Codes</p>
              <p className="mt-[2px] text-[12px] text-[#9CA3AF] font-helvetica">Receive codes via text message as a backup.</p>
            </div>
            <Toggle on={smsCodes} toggle={() => setSmsCodes(!smsCodes)} />
          </div>
          {/* Download Recovery Codes */}
          <div className="py-4">
            <button
              type="button"
              className="h-[36px] rounded-full border border-[#F5D98A] bg-[#FFF8E7] px-5 text-[12px] font-medium text-[#92722A] hover:bg-[#FFF3D6] transition-colors font-helvetica"
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
          <div className="mt-2">
            {sessions.map((s) => (
              <div key={s.id} className="flex items-center justify-between border-b border-[#ECEDEF] py-4 last:border-b-0">
                <div>
                  <p className="text-[13px] text-[#1F1F1F] font-helvetica">{s.device}</p>
                  <p className={`mt-[2px] text-[11px] font-semibold font-helvetica ${s.isActive ? 'text-[#16A66A]' : 'text-[#9CA3AF]'}`}>
                    {s.status}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setLogoutOpen(true)}
                  className="h-[32px] rounded-full border border-[#E5E7EB] bg-[#FAFAFA] px-4 text-[12px] font-medium text-[#6B7280] hover:bg-[#F3F4F6] transition-colors font-helvetica"
                >
                  Log Out
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  /* ═══════════════════════════════════════
     TAB 3 — Notifications
     ═══════════════════════════════════════ */
  const NotificationsTab = () => (
    <div>
      <div className="rounded-sm  sm:max-w-6xl mx-auto border border-[#ECEDEF] bg-white">
        <div className="border-b border-[#ECEDEF] px-6 py-4">
          <h3 className="text-[17px] font-semibold text-[#1F1F1F] font-goudy">Email Notifications</h3>
        </div>
        <div className="px-6 py-2">
          {/* New document uploaded */}
          <div className="flex items-center justify-between border-b border-[#ECEDEF] py-4">
            <span className="text-[14px] text-[#1F1F1F] font-helvetica">New document uploaded</span>
            <Toggle on={notifDocUploaded} toggle={() => setNotifDocUploaded(!notifDocUploaded)} />
          </div>
          {/* Missing document alerts */}
          <div className="flex items-center justify-between border-b border-[#ECEDEF] py-4">
            <span className="text-[14px] text-[#1F1F1F] font-helvetica">Missing document alerts</span>
            <Toggle on={notifMissingDoc} toggle={() => setNotifMissingDoc(!notifMissingDoc)} />
          </div>
          {/* New investor messages */}
          <div className="flex items-center justify-between border-b border-[#ECEDEF] py-4">
            <span className="text-[14px] text-[#1F1F1F] font-helvetica">New investor messages</span>
            <Toggle on={notifInvestorMsg} toggle={() => setNotifInvestorMsg(!notifInvestorMsg)} />
          </div>
          {/* Reminder */}
          <div className="flex items-center justify-between py-4">
            <span className="text-[14px] text-[#1F1F1F] font-helvetica">Reminder</span>
            <Toggle on={notifReminder} toggle={() => setNotifReminder(!notifReminder)} />
          </div>
        </div>


        {/* Save button */}
        <div className="mt-5 flex justify-end">
          <button
            type="button"
            className="h-[40px] min-w-[100px] rounded-full bg-gradient-to-r from-[#FFC63F] to-[#F1DD58] px-6 text-[13px] font-semibold text-[#1F1F1F] shadow-sm hover:shadow-md transition-shadow font-helvetica"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );

  /* ═══════════════════════════════════════
     LOGOUT CONFIRMATION MODAL
     ═══════════════════════════════════════ */
  const LogoutModal = () => {
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
              className="h-[40px] min-w-[120px] rounded-full px-7 text-[14px] font-semibold text-[#7A5C00] hover:opacity-90 transition-colors font-helvetica"
              style={{ background: 'linear-gradient(135deg, #F5D77A 0%, #E2B93B 100%)' }}
            >
              Yes
            </button>
          </div>
        </div>
      </div>
    );
  };

  /* ═══════════════════════════════════════
     PAGE LAYOUT
     ═══════════════════════════════════════ */
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
        {tab === 'profile' && <ProfileTab />}
        {tab === 'security' && <SecurityTab />}
        {tab === 'notifications' && <NotificationsTab />}
      </div>

      <LogoutModal />
    </div>
  );
}
