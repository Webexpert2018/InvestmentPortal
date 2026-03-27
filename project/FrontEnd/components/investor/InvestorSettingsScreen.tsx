'use client';

import { ChangeEvent, useMemo, useRef, useState, useEffect } from 'react';
import { CalendarDays, ChevronDown, ChevronLeft, Plus, Upload, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { apiClient, BASE_URL } from '@/lib/api/client';
import { Country, State, City } from 'country-state-city';
import { Combobox } from '@/components/ui/combobox';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

type SettingsTab =
  | 'profile'
  | 'security'
  | 'notifications'
  | 'documents'
  | 'accounts'
  | 'add-account';

type SessionItem = {
  id: string;
  name: string;
  subtitle: string;
  activeNow?: boolean;
};

type AccountItem = {
  id: string;
  account: string;
  assetsValue: string;
  totalCash: string;
  cashAvailable: string;
};

type ProfileErrorFields =
  | 'firstName'
  | 'lastName'
  | 'email'
  | 'phoneNumber'
  | 'dob'
  | 'addressLine1'
  | 'city'
  | 'state'
  | 'zipCode'
  | 'country'
  | 'ssn';

type AddAccountErrorFields = 'newAccountType' | 'passportNumber' | 'idFileName' | 'verified';

const tabs: Array<{ id: Exclude<SettingsTab, 'add-account'>; label: string }> = [
  { id: 'profile', label: 'Profile Information' },
  { id: 'security', label: 'Security & Login' },
  { id: 'notifications', label: 'Notifications' },
  { id: 'documents', label: 'Document Preferences' },
  { id: 'accounts', label: 'Account Switcher' },
];

const COUNTRY_CODES = ['+1 (USA)', '+44 (UK)', '+91 (IN)'];

const defaultProfile = {
  firstName: '',
  lastName: '',
  email: '',
  countryCode: COUNTRY_CODES[0],
  phoneNumber: '',
  dob: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  state: '',
  zipCode: '',
  country: '',
  ssn: '*** ** ***',
  profileImageUrl: '',
};

const defaultPassword = {
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
};

const defaultAddAccount = {
  newAccountType: '',
  paymentSource: 'Wire',
  idType: 'Passport',
  passportNumber: '',
  idFileName: '',
  verified: false,
};

const initialSessions: SessionItem[] = [
  {
    id: 'chrome-current',
    name: 'Chrome on macOS (Current) - New York, USA',
    subtitle: 'ACTIVE NOW',
    activeNow: true,
  },
  {
    id: 'safari-london',
    name: 'Safari on Windows - London, UK',
    subtitle: '2 hours ago',
  },
];

const initialAccounts: AccountItem[] = [
  {
    id: 'acct-1',
    account: 'Roth SEP (1009437651)',
    assetsValue: '$32586.00',
    totalCash: '$15.00',
    cashAvailable: '$0.00',
  },
  {
    id: 'acct-2',
    account: 'Traditional (1004388207)',
    assetsValue: '$32586.00',
    totalCash: '$15.00',
    cashAvailable: '$0.00',
  },
];

function Toggle({ enabled, onChange }: { enabled: boolean; onChange: (value: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      onClick={() => onChange(!enabled)}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition ${enabled ? 'bg-[#12B87A]' : 'bg-[#D8D9DE]'}`}
    >
      <span
        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition ${enabled ? 'translate-x-[18px]' : 'translate-x-[2px]'}`}
      />
    </button>
  );
}

function SectionCard({ children }: { children: React.ReactNode }) {
  return <div className="rounded-[6px] border border-[#ECEDEF] bg-white">{children}</div>;
}

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="border-b border-[#ECEDEF] px-4 py-3">
      <h3 className="font-goudy text-[16px] leading-5 text-[#1F1F1F]">{title}</h3>
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="mb-1 block text-[11px] text-[#4B4B4B]">{children}</label>;
}

function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`h-[36px] w-full rounded-[6px] border border-[#E5E5EA] px-3 text-[12px] text-[#1F1F1F] outline-none placeholder:text-[#B1B3B8] focus:border-[#274583] disabled:bg-[#F9FAFB] disabled:cursor-not-allowed disabled:text-[#A2A5AA] ${props.className ?? ''}`}
    />
  );
}

function PasswordInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const [showPassword, setShowPassword] = useState(false);
  return (
    <div className="relative">
      <input
        {...props}
        type={showPassword ? 'text' : 'password'}
        className={`h-[36px] w-full rounded-[6px] border border-[#E5E5EA] pl-3 pr-10 text-[12px] text-[#1F1F1F] outline-none placeholder:text-[#B1B3B8] focus:border-[#274583] ${props.className ?? ''}`}
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

export function InvestorSettingsScreen() {
  const { user, refreshUser, updateUser, profileTimestamp } = useAuth();
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  const [profile, setProfile] = useState(defaultProfile);
  const [password, setPassword] = useState(defaultPassword);
  const [sessions, setSessions] = useState<SessionItem[]>(initialSessions);
  const [profileImageName, setProfileImageName] = useState('');

  const countries = useMemo(() => Country.getAllCountries(), []);
  const states = useMemo(() => {
    if (!profile.country) return [];
    const countryObj = countries.find(c => c.isoCode === profile.country || c.name === profile.country);
    return countryObj ? State.getStatesOfCountry(countryObj.isoCode) : [];
  }, [profile.country, countries]);

  const cities = useMemo(() => {
    if (!profile.country || !profile.state) return [];
    const countryObj = countries.find(c => c.isoCode === profile.country || c.name === profile.country);
    const stateObj = states.find(s => s.isoCode === profile.state || s.name === profile.state);
    if (!countryObj || !stateObj) return [];
    return City.getCitiesOfState(countryObj.isoCode, stateObj.isoCode);
  }, [profile.country, profile.state, countries, states]);

  const profileImageInputRef = useRef<HTMLInputElement | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dobInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);
        const userData = await apiClient.getProfile();

        if (userData) {
          const fullPhone = userData.phone || '';

          // Find which prefix matches the start of the phone number
          const matchedCode = COUNTRY_CODES.find(code => {
            const prefix = code.split(' ')[0]; // e.g., "+91"
            return fullPhone.startsWith(prefix);
          }) || COUNTRY_CODES[0];

          const cleanPrefix = matchedCode.split(' ')[0];
          const localNumber = fullPhone.startsWith(cleanPrefix)
            ? fullPhone.slice(cleanPrefix.length)
            : fullPhone;

          const foundCountry = countries.find(c => c.isoCode === userData.country || c.name === userData.country);
          const countryIso = foundCountry?.isoCode || userData.country || '';
          
          let stateIso = userData.state || '';
          if (foundCountry) {
            const countryStates = State.getStatesOfCountry(foundCountry.isoCode);
            const foundState = countryStates.find(s => s.isoCode === userData.state || s.name === userData.state);
            stateIso = foundState?.isoCode || userData.state || '';
          }

          setProfile({
            firstName: userData.firstName || '',
            lastName: userData.lastName || '',
            email: userData.email || '',
            countryCode: matchedCode,
            phoneNumber: localNumber.replace(/\D/g, ''), // Only digits
            dob: formatDateForInput(userData.dob),
            addressLine1: userData.addressLine1 || '',
            addressLine2: userData.addressLine2 || '',
            city: userData.city || '',
            state: stateIso,
            zipCode: userData.zipCode || '',
            country: countryIso,
            ssn: userData.taxId || '*** ** ***',
            profileImageUrl: userData.profileImageUrl || '',
          });
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

  const [emailNotifications, setEmailNotifications] = useState({
    investmentActivity: true,
    fundingConfirmations: true,
    documentUploads: false,
    kycUpdates: true,
    announcements: false,
  });

  const [smsNotifications, setSmsNotifications] = useState({
    investmentConfirmations: true,
    securityAlerts: true,
  });

  const [documentPrefs, setDocumentPrefs] = useState({
    sendByEmail: true,
    taxFormsAlert: true,
    autoDownload: false,
    paperless: true,
    format: 'PDF',
    frequency: 'Quarterly',
  });

  const [accounts, setAccounts] = useState<AccountItem[]>(initialAccounts);
  const [addAccount, setAddAccount] = useState(defaultAddAccount);
  const idUploadRef = useRef<HTMLInputElement | null>(null);
  const [profileErrors, setProfileErrors] = useState<Partial<Record<ProfileErrorFields, string>>>({});
  const [securityErrors, setSecurityErrors] = useState<Record<string, string>>({});
  const [addAccountErrors, setAddAccountErrors] = useState<Partial<Record<AddAccountErrorFields, string>>>({});
  const [profileSaved, setProfileSaved] = useState(false);

  const personalInfo = useMemo(
    () => ({
      name: 'John Michael Carter Jr',
      ssn: '******** 5636',
      dateOfBirth: 'Oct 30, 1999',
      maritalStatus: 'Single',
      physicalAddress: '2458 Maple Street Apt 3B, Springfield, California 90210',
      mailingAddress: '2458 Maple Street, Springfield, CA 90210',
    }),
    [],
  );

  const handleProfileImageChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setProfileImageName(file.name);

    try {
      setSaving(true);
      const result = await apiClient.uploadProfileImage(file);
      updateUser({ profileImageUrl: result.imageUrl });
      setProfile((prev) => ({ ...prev, profileImageUrl: result.imageUrl }));

      toast({
        title: 'Success',
        description: 'Profile image updated successfully',
        variant: 'success',
      });
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to upload image',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleIdImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setAddAccount((prev) => ({ ...prev, idFileName: file?.name ?? '' }));
    setAddAccountErrors((prev) => ({ ...prev, idFileName: undefined }));
  };

  const validateProfile = () => {
    const errors: Partial<Record<ProfileErrorFields, string>> = {};

    // First Name
    if (!profile.firstName.trim()) {
      errors.firstName = 'First name is required';
    } else if (!/^[A-Za-z\s\-']+$/.test(profile.firstName.trim())) {
      errors.firstName = 'First name can only contain letters';
    }

    // Last Name
    if (!profile.lastName.trim()) {
      errors.lastName = 'Last name is required';
    } else if (!/^[A-Za-z\s\-']+$/.test(profile.lastName.trim())) {
      errors.lastName = 'Last name can only contain letters';
    }
    if (!profile.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^\S+@\S+\.\S+$/.test(profile.email.trim())) {
      errors.email = 'Enter a valid email';
    }
    const phoneError = (() => {
      const cleanNumber = profile.phoneNumber.trim();
      if (!cleanNumber || COUNTRY_CODES.includes(cleanNumber)) return 'Phone number is required';

      if (profile.countryCode === '+1 (USA)') {
        if (cleanNumber.length !== 10) return 'USA phone number must be 10 digits';
      } else if (profile.countryCode === '+44 (UK)') {
        if (cleanNumber.length < 10 || cleanNumber.length > 11) return 'UK phone number must be 10-11 digits';
      } else if (profile.countryCode === '+91 (IN)') {
        if (cleanNumber.length !== 10) return 'India phone number must be 10 digits';
      }
      return null;
    })();
    if (phoneError) errors.phoneNumber = phoneError;
    if (!profile.dob.trim()) {
      errors.dob = 'Date of birth is required';
    } else {
      const birthDate = new Date(profile.dob);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }

      if (age < 18) {
        errors.dob = 'You must be at least 18 years old';
      } else if (age > 70) {
        errors.dob = 'Age cannot exceed 70 years';
      }
    }
    if (!profile.addressLine1.trim()) errors.addressLine1 = 'Street address line 1 is required';
    if (!profile.city.trim()) {
      errors.city = 'City is required';
    } else if (!/^[A-Za-z\s\-']+$/.test(profile.city.trim())) {
      errors.city = 'City can only contain letters';
    }
    if (!profile.state.trim()) errors.state = 'State is required';
    if (!profile.zipCode.trim()) {
      errors.zipCode = 'ZIP code is required';
    } else if (!/^[a-zA-Z0-9\s\-]+$/.test(profile.zipCode.trim())) {
      errors.zipCode = 'ZIP code can only contain letters, numbers, and hyphens';
    }
    if (!profile.country.trim()) errors.country = 'Country is required';

    // SSN/Tax ID validation: max 11 chars (XXX-XX-XXXX format)
    if (profile.ssn && profile.ssn !== '*** ** ***') {
      const ssnValue = profile.ssn.trim();
      if (ssnValue.length > 11) {
        errors.ssn = 'SSN/Tax ID must be 11 characters or less (format: XXX-XX-XXXX)';
      } else if (!/^[0-9\-]*$/.test(ssnValue)) {
        errors.ssn = 'SSN/Tax ID can only contain numbers and hyphens';
      }
    }

    setProfileErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateAddAccount = () => {
    const errors: Partial<Record<AddAccountErrorFields, string>> = {};

    if (!addAccount.newAccountType.trim()) errors.newAccountType = 'Account type is required';
    if (!addAccount.passportNumber.trim()) errors.passportNumber = 'Passport number is required';
    if (!addAccount.idFileName.trim()) errors.idFileName = 'ID scan or photo is required';
    if (!addAccount.verified) errors.verified = 'Please verify the information to continue';

    setAddAccountErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const renderProfileTab = () => (
    <SectionCard>
      <div className="p-4 sm:p-5">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <p className="text-[12px] text-[#A2A5AA]">Loading your profile...</p>
          </div>
        ) : (
          <>
            {error && <p className="mb-4 text-[10px] text-[#E05252]">{error}</p>}

            <div className="mb-4 flex items-center gap-4">
              <input ref={profileImageInputRef} type="file" className="hidden" onChange={handleProfileImageChange} accept="image/*" />
              <button
                type="button"
                onClick={() => profileImageInputRef.current?.click()}
                disabled={saving}
                className="group relative flex h-[54px] w-[54px] items-center justify-center overflow-hidden rounded-full border border-[#E5E5EA] transition-all hover:border-[#274583] disabled:opacity-70"
              >
                {profile.profileImageUrl ? (
                  <>
                    <img
                      src={(() => {
                        if (!profile.profileImageUrl) return '';
                        if (profile.profileImageUrl.startsWith('http')) {
                          const url = new URL(profile.profileImageUrl);
                          url.searchParams.set('t', profileTimestamp.toString());
                          return url.toString();
                        }
                        const baseUrl = BASE_URL;
                        const separator = profile.profileImageUrl.includes('?') ? '&' : '?';
                        return `${baseUrl}${profile.profileImageUrl}${separator}t=${profileTimestamp}`;
                      })()}
                      alt="Profile"
                      className="h-full w-full object-cover"
                    />
                    {!saving && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                        <Upload className="h-4 w-4 text-white" />
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center text-[#A2A5AA]">
                    <Upload className="h-4 w-4" />
                    <span className="mt-1 text-[9px]">Upload</span>
                  </div>
                )}
                {saving && (
                  <div className="absolute inset-0 flex items-center justify-center bg-white/70">
                    <Loader2 className="h-5 w-5 animate-spin text-[#274583]" />
                  </div>
                )}
              </button>
              <div>
                <p className="text-[12px] font-medium text-[#1F1F1F]">
                  {profile.profileImageUrl ? 'Change Profile Picture' : 'Upload Profile Picture'}
                </p>
                <p className="text-[11px] text-[#A2A5AA]">
                  {profileImageName || 'JPG, GIF or PNG. Max size of 5MB.'}
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <FieldLabel>First Name</FieldLabel>
                <TextInput
                  className={profileErrors.firstName ? '!border-[#E05252]' : ''}
                  placeholder="Enter first name"
                  value={profile.firstName}
                  onChange={(event) => {
                    setProfile((prev) => ({ ...prev, firstName: event.target.value }));
                    setProfileErrors((prev) => ({ ...prev, firstName: undefined }));
                  }}
                />
                {profileErrors.firstName && <p className="mt-1 text-[10px] text-[#E05252]">{profileErrors.firstName}</p>}
              </div>
              <div>
                <FieldLabel>Last Name</FieldLabel>
                <TextInput
                  className={profileErrors.lastName ? '!border-[#E05252]' : ''}
                  placeholder="Enter last name"
                  value={profile.lastName}
                  onChange={(event) => {
                    setProfile((prev) => ({ ...prev, lastName: event.target.value }));
                    setProfileErrors((prev) => ({ ...prev, lastName: undefined }));
                  }}
                />
                {profileErrors.lastName && <p className="mt-1 text-[10px] text-[#E05252]">{profileErrors.lastName}</p>}
              </div>
              <div>
                <FieldLabel>Email</FieldLabel>
                <TextInput
                  className={profileErrors.email ? '!border-[#E05252]' : ''}
                  placeholder="Enter email"
                  value={profile.email}
                  disabled
                  title="Email cannot be changed"
                />
                <p className="mt-1 text-[10px] text-[#A2A5AA]">Email cannot be changed for security reasons</p>
              </div>
              <div>
                <FieldLabel>Phone Number</FieldLabel>
                <div className="grid grid-cols-[110px_minmax(0,1fr)] gap-2">
                  <div className="relative">
                    <select
                      value={profile.countryCode}
                      onChange={(event) => {
                        setProfile((prev) => ({ ...prev, countryCode: event.target.value }));
                        setProfileErrors((prev) => ({ ...prev, phoneNumber: undefined }));
                      }}
                      className="h-[36px] w-full appearance-none rounded-[6px] border border-[#E5E5EA] px-3 text-[12px] text-[#4B4B4B] outline-none"
                    >
                      {COUNTRY_CODES.map(code => (
                        <option key={code} value={code}>{code}</option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-[#A2A5AA]" />
                  </div>
                  <TextInput
                    className={profileErrors.phoneNumber ? '!border-[#E05252]' : ''}
                    placeholder="Enter phone number"
                    value={profile.phoneNumber}
                    onChange={(event) => {
                      const val = event.target.value.replace(/\D/g, ''); // Only digits
                      setProfile((prev) => ({
                        ...prev,
                        phoneNumber: val,
                      }));
                      setProfileErrors((prev) => ({ ...prev, phoneNumber: undefined }));
                    }}
                  />
                </div>
                {profileErrors.phoneNumber && <p className="mt-1 text-[10px] text-[#E05252]">{profileErrors.phoneNumber}</p>}
              </div>
              <div>
                <FieldLabel>Date of Birth</FieldLabel>
                <div className="relative">
                  <input
                    type="date"
                    ref={dobInputRef}
                    className={`h-[36px] w-full rounded-[6px] border px-3 text-[12px] text-[#1F1F1F] outline-none focus:border-[#274583] [&::-webkit-calendar-picker-indicator]:hidden ${profileErrors.dob ? 'border-[#E05252]' : 'border-[#E5E5EA]'
                      }`}
                    value={profile.dob}
                    onChange={(event) => {
                      setProfile((prev) => ({ ...prev, dob: event.target.value }));
                      setProfileErrors((prev) => ({ ...prev, dob: undefined }));
                    }}
                    max={new Date().toISOString().split('T')[0]}
                  />
                  <button
                    type="button"
                    onClick={() => dobInputRef.current?.showPicker()}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A2A5AA] hover:text-[#4B4B4B]"
                  >
                    <CalendarDays className="h-4 w-4" />
                  </button>
                </div>
                {profileErrors.dob && <p className="mt-1 text-[10px] text-[#E05252]">{profileErrors.dob}</p>}
              </div>
              <div />
              <div>
                <FieldLabel>Street Address Line 1</FieldLabel>
                <TextInput
                  className={profileErrors.addressLine1 ? '!border-[#E05252]' : ''}
                  placeholder="Enter street address line 1"
                  value={profile.addressLine1}
                  onChange={(event) => {
                    setProfile((prev) => ({ ...prev, addressLine1: event.target.value }));
                    setProfileErrors((prev) => ({ ...prev, addressLine1: undefined }));
                  }}
                />
                {profileErrors.addressLine1 && <p className="mt-1 text-[10px] text-[#E05252]">{profileErrors.addressLine1}</p>}
              </div>
              <div>
                <FieldLabel>Street Address Line 2</FieldLabel>
                <TextInput
                  placeholder="Enter street address line 2"
                  value={profile.addressLine2}
                  onChange={(event) => setProfile((prev) => ({ ...prev, addressLine2: event.target.value }))}
                />
              </div>
              <div>
                <FieldLabel>City</FieldLabel>
                <Combobox
                  options={cities.map((c) => ({ label: c.name, value: c.name }))}
                  value={profile.city}
                  onChange={(val) => {
                    setProfile((prev) => ({ ...prev, city: val }));
                    setProfileErrors((prev) => ({ ...prev, city: undefined }));
                  }}
                  placeholder="Select city"
                  className={cn(
                    "text-[12px] h-[36px]",
                    profileErrors.city ? 'border-[#E05252]' : ''
                  )}
                />
                {profileErrors.city && <p className="mt-1 text-[10px] text-[#E05252]">{profileErrors.city}</p>}
              </div>
              <div>
                <FieldLabel>State</FieldLabel>
                <Combobox
                  options={states.map((s) => ({ label: s.name, value: s.isoCode }))}
                  value={profile.state}
                  onChange={(val) => {
                    setProfile((prev) => ({ ...prev, state: val, city: '' }));
                    setProfileErrors((prev) => ({ ...prev, state: undefined }));
                  }}
                  placeholder="Select state"
                  className={cn(
                    "text-[12px] h-[36px]",
                    profileErrors.state ? 'border-[#E05252]' : ''
                  )}
                />
                {profileErrors.state && <p className="mt-1 text-[10px] text-[#E05252]">{profileErrors.state}</p>}
              </div>
              <div>
                <FieldLabel>ZIP Code</FieldLabel>
                <TextInput
                  className={profileErrors.zipCode ? '!border-[#E05252]' : ''}
                  placeholder="Enter zip code"
                  value={profile.zipCode}
                  onChange={(event) => {
                    setProfile((prev) => ({ ...prev, zipCode: event.target.value }));
                    setProfileErrors((prev) => ({ ...prev, zipCode: undefined }));
                  }}
                />
                {profileErrors.zipCode && <p className="mt-1 text-[10px] text-[#E05252]">{profileErrors.zipCode}</p>}
              </div>
              <div>
                <FieldLabel>Country</FieldLabel>
                <Combobox
                  options={countries.map((c) => ({ label: c.name, value: c.isoCode }))}
                  value={profile.country}
                  onChange={(val) => {
                    setProfile((prev) => ({ ...prev, country: val, state: '', city: '' }));
                    setProfileErrors((prev) => ({ ...prev, country: undefined }));
                  }}
                  placeholder="Select country"
                  className={cn(
                    "text-[12px] h-[36px]",
                    profileErrors.country ? 'border-[#E05252]' : ''
                  )}
                />
                {profileErrors.country && <p className="mt-1 text-[10px] text-[#E05252]">{profileErrors.country}</p>}
              </div>
            </div>


            <div className="mt-4 max-w-[360px]">
              <p className="text-[12px] font-medium text-[#4B4B4B]">TAX Information</p>
              <p className="mt-1 text-[10px] text-[#A2A5AA]">Social Security Number / Tax ID</p>
              <TextInput
                className={`mt-1 ${profileErrors.ssn ? '!border-[#E05252]' : ''}`}
                placeholder="Format: XXX-XX-XXXX"
                value={profile.ssn}
                maxLength={11}
                onChange={(event) => {
                  setProfile((prev) => ({ ...prev, ssn: event.target.value }));
                  setProfileErrors((prev) => ({ ...prev, ssn: undefined }));
                }}
              />
              {profileErrors.ssn && <p className="mt-1 text-[10px] text-[#E05252]">{profileErrors.ssn}</p>}
              <p className="mt-1 text-[10px] text-[#C0C3C8]">Your information is encrypted and secure</p>
            </div>

            {profileSaved && <p className="mt-3 text-[12px] text-[#16A66A]">Profile updated successfully.</p>}

            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setProfile(defaultProfile);
                  setProfileErrors({});
                  setProfileSaved(false);
                }}
                className="h-[32px] min-w-[90px] rounded-full bg-[#FFF3D6] px-5 text-[12px] text-[#6A6A6A]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={async () => {
                  const isValid = validateProfile();
                  if (!isValid) return;

                  setSaving(true);
                  try {
                    const updateData = {
                      firstName: profile.firstName,
                      lastName: profile.lastName,
                      email: profile.email,
                      phone: `${profile.countryCode} ${profile.phoneNumber}`,
                      dob: profile.dob,
                      addressLine1: profile.addressLine1,
                      addressLine2: profile.addressLine2,
                      city: profile.city,
                      state: profile.state,
                      zipCode: profile.zipCode,
                      country: profile.country,
                      taxId: profile.ssn,
                    };

                    const updatedUser = await apiClient.updateProfile(updateData);
                    if (updatedUser) {
                      updateUser(updatedUser);
                    }
                    setProfileSaved(true);
                    setError(null);

                    toast({
                      title: 'Success',
                      description: 'Profile updated successfully',
                      variant: 'success',
                    });

                    // Hide success message after 3 seconds
                    setTimeout(() => setProfileSaved(false), 3000);
                  } catch (err) {
                    setError('Failed to update profile. Please try again.');
                    console.error('Error updating profile:', err);
                  } finally {
                    setSaving(false);
                  }
                }}
                className="h-[32px] min-w-[90px] rounded-full bg-[#FBCB4B] px-5 text-[12px] text-[#1F1F1F] disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </>
        )}
      </div>
    </SectionCard>
  );

  const renderSecurityTab = () => (
    <div className="space-y-3">
      <SectionCard>
        <SectionHeader title="Change Password" />
        <div className="p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <FieldLabel>Current Password</FieldLabel>
              <PasswordInput
                placeholder="Enter current password"
                value={password.currentPassword}
                onChange={(event) => {
                  setPassword((prev) => ({ ...prev, currentPassword: (event.target as HTMLInputElement).value }));
                  setSecurityErrors((prev) => ({ ...prev, currentPassword: '' }));
                }}
                className={securityErrors.currentPassword ? '!border-[#E05252]' : ''}
              />
              {securityErrors.currentPassword && <p className="mt-1 text-[10px] text-[#E05252]">{securityErrors.currentPassword}</p>}
            </div>
            <div>
              <FieldLabel>New Password</FieldLabel>
              <PasswordInput
                placeholder="Enter new password"
                value={password.newPassword}
                onChange={(event) => {
                  setPassword((prev) => ({ ...prev, newPassword: (event.target as HTMLInputElement).value }));
                  setSecurityErrors((prev) => ({ ...prev, newPassword: '' }));
                }}
                className={securityErrors.newPassword ? '!border-[#E05252]' : ''}
              />
              {securityErrors.newPassword && <p className="mt-1 text-[10px] text-[#E05252]">{securityErrors.newPassword}</p>}
            </div>
            <div>
              <FieldLabel>Confirm Password</FieldLabel>
              <PasswordInput
                placeholder="Enter confirm password"
                value={password.confirmPassword}
                onChange={(event) => {
                  setPassword((prev) => ({ ...prev, confirmPassword: (event.target as HTMLInputElement).value }));
                  setSecurityErrors((prev) => ({ ...prev, confirmPassword: '' }));
                }}
                className={securityErrors.confirmPassword ? '!border-[#E05252]' : ''}
              />
              {securityErrors.confirmPassword && <p className="mt-1 text-[10px] text-[#E05252]">{securityErrors.confirmPassword}</p>}
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <button
              type="button"
              disabled={saving}
              onClick={async () => {
                const errs: Record<string, string> = {};
                if (!password.currentPassword) errs.currentPassword = 'Current password is required';
                if (!password.newPassword) errs.newPassword = 'New password is required';
                else if (password.newPassword.length < 8) errs.newPassword = 'Password must be at least 8 characters';

                if (!password.confirmPassword) errs.confirmPassword = 'Confirm password is required';
                else if (password.newPassword !== password.confirmPassword) errs.confirmPassword = 'Passwords do not match';

                if (Object.keys(errs).length > 0) {
                  setSecurityErrors(errs);
                  return;
                }

                setSaving(true);
                try {
                  await apiClient.changePassword({
                    oldPassword: password.currentPassword,
                    newPassword: password.newPassword,
                  });

                  toast({
                    title: 'Success',
                    description: 'Password updated successfully',
                    variant: 'success',
                  });

                  setPassword(defaultPassword);
                  setError(null);
                } catch (err: any) {
                  const errorMsg = err.message || 'Failed to update password';
                  setError(errorMsg);
                  toast({
                    title: 'Error',
                    description: errorMsg,
                    variant: 'destructive',
                  });
                } finally {
                  setSaving(false);
                }
              }}
              className="h-[32px] min-w-[120px] rounded-full bg-[#FBCB4B] px-5 text-[12px] text-[#1F1F1F] disabled:opacity-50"
            >
              {saving ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </div>
      </SectionCard>

      <SectionCard>
        <SectionHeader title="Two-Factor Authentication" />
        <div className="divide-y divide-[#ECEDEF] p-4">
          <div className="flex items-start justify-between py-3">
            <div>
              <p className="text-[12px] text-[#1F1F1F]">Authenticator App</p>
              <p className="mt-1 text-[10px] text-[#A2A5AA]">Time-based one-time password (OTP)</p>
            </div>
            <Toggle enabled={false} onChange={() => undefined} />
          </div>
          <div className="flex items-start justify-between py-3">
            <div>
              <p className="text-[12px] text-[#1F1F1F]">SMS Backup Codes</p>
              <p className="mt-1 text-[10px] text-[#A2A5AA]">Receive codes via text message as a backup.</p>
            </div>
            <Toggle enabled={false} onChange={() => undefined} />
          </div>
          <div className="pt-3">
            <button type="button" className="h-[28px] rounded-full bg-[#FFF3D6] px-4 text-[10px] text-[#9E8C62]">
              Download Recovery Codes
            </button>
          </div>
        </div>
      </SectionCard>

      <SectionCard>
        <SectionHeader title="Active Sessions" />
        <div className="p-4">
          <p className="text-[10px] text-[#A2A5AA]">Review and manage devices currently logged into your account.</p>
          <div className="mt-2 divide-y divide-[#ECEDEF]">
            {sessions.map((session) => (
              <div key={session.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-[12px] text-[#1F1F1F]">{session.name}</p>
                  <p className={`mt-1 text-[10px] ${session.activeNow ? 'text-[#16A66A]' : 'text-[#A2A5AA]'}`}>
                    {session.subtitle}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSessions((prev) => prev.filter((item) => item.id !== session.id))}
                  className="h-[28px] rounded-full bg-[#FFF3D6] px-4 text-[10px] text-[#9E8C62]"
                >
                  Log Out
                </button>
              </div>
            ))}
          </div>
        </div>
      </SectionCard>
    </div>
  );

  const renderNotificationsTab = () => (
    <div className="space-y-3">
      <SectionCard>
        <SectionHeader title="Email Notifications" />
        <div className="divide-y divide-[#ECEDEF] p-4">
          <div className="flex items-start justify-between py-3">
            <div>
              <p className="text-[12px] text-[#1F1F1F]">Investment activity</p>
              <p className="mt-1 text-[10px] text-[#A2A5AA]">Updates on your invest performance and trades.</p>
            </div>
            <Toggle
              enabled={emailNotifications.investmentActivity}
              onChange={(value) => setEmailNotifications((prev) => ({ ...prev, investmentActivity: value }))}
            />
          </div>
          <div className="flex items-start justify-between py-3">
            <div>
              <p className="text-[12px] text-[#1F1F1F]">Funding confirmations</p>
              <p className="mt-1 text-[10px] text-[#A2A5AA]">Confirmations for deposits and withdrawals.</p>
            </div>
            <Toggle
              enabled={emailNotifications.fundingConfirmations}
              onChange={(value) => setEmailNotifications((prev) => ({ ...prev, fundingConfirmations: value }))}
            />
          </div>
          <div className="flex items-start justify-between py-3">
            <div>
              <p className="text-[12px] text-[#1F1F1F]">Document uploads</p>
              <p className="mt-1 text-[10px] text-[#A2A5AA]">Notifications when new documents are available.</p>
            </div>
            <Toggle
              enabled={emailNotifications.documentUploads}
              onChange={(value) => setEmailNotifications((prev) => ({ ...prev, documentUploads: value }))}
            />
          </div>
          <div className="flex items-start justify-between py-3">
            <div>
              <p className="text-[12px] text-[#1F1F1F]">KYC updates</p>
              <p className="mt-1 text-[10px] text-[#A2A5AA]">Alerts regarding your account verification status.</p>
            </div>
            <Toggle
              enabled={emailNotifications.kycUpdates}
              onChange={(value) => setEmailNotifications((prev) => ({ ...prev, kycUpdates: value }))}
            />
          </div>
          <div className="flex items-start justify-between py-3">
            <div>
              <p className="text-[12px] text-[#1F1F1F]">General announcements</p>
              <p className="mt-1 text-[10px] text-[#A2A5AA]">Platform news, updates, and marketing.</p>
            </div>
            <Toggle
              enabled={emailNotifications.announcements}
              onChange={(value) => setEmailNotifications((prev) => ({ ...prev, announcements: value }))}
            />
          </div>
        </div>
      </SectionCard>

      <SectionCard>
        <SectionHeader title="SMS Notifications" />
        <div className="divide-y divide-[#ECEDEF] p-4">
          <div className="flex items-start justify-between py-3">
            <div>
              <p className="text-[12px] text-[#1F1F1F]">Investment confirmations</p>
              <p className="mt-1 text-[10px] text-[#A2A5AA]">Receive a text when a large investment is confirmed.</p>
            </div>
            <Toggle
              enabled={smsNotifications.investmentConfirmations}
              onChange={(value) => setSmsNotifications((prev) => ({ ...prev, investmentConfirmations: value }))}
            />
          </div>
          <div className="flex items-start justify-between py-3">
            <div>
              <p className="text-[12px] text-[#1F1F1F]">Security alerts</p>
              <p className="mt-1 text-[10px] text-[#A2A5AA]">Get notified about new logins and security events.</p>
            </div>
            <Toggle
              enabled={smsNotifications.securityAlerts}
              onChange={(value) => setSmsNotifications((prev) => ({ ...prev, securityAlerts: value }))}
            />
          </div>
        </div>
      </SectionCard>

      <div className="flex justify-end">
        <button type="button" className="h-[32px] min-w-[90px] rounded-full bg-[#FBCB4B] px-5 text-[12px] text-[#1F1F1F]">
          Save
        </button>
      </div>
    </div>
  );

  const renderDocumentsTab = () => (
    <div className="space-y-3">
      <SectionCard>
        <SectionHeader title="Delivery & Notifications" />
        <div className="divide-y divide-[#ECEDEF] p-4">
          <div className="flex items-start justify-between py-3">
            <div>
              <p className="text-[12px] text-[#1F1F1F]">Send documents via email</p>
              <p className="mt-1 text-[10px] text-[#A2A5AA]">Receive important updates and documents directly to your inbox.</p>
            </div>
            <Toggle
              enabled={documentPrefs.sendByEmail}
              onChange={(value) => setDocumentPrefs((prev) => ({ ...prev, sendByEmail: value }))}
            />
          </div>
          <div className="flex items-start justify-between py-3">
            <div>
              <p className="text-[12px] text-[#1F1F1F]">Notify me when new tax forms are uploaded</p>
              <p className="mt-1 text-[10px] text-[#A2A5AA]">Get an alert with your tax documents are ready.</p>
            </div>
            <Toggle
              enabled={documentPrefs.taxFormsAlert}
              onChange={(value) => setDocumentPrefs((prev) => ({ ...prev, taxFormsAlert: value }))}
            />
          </div>
          <div className="flex items-start justify-between py-3">
            <div>
              <p className="text-[12px] text-[#1F1F1F]">Auto-download statements</p>
              <p className="mt-1 text-[10px] text-[#A2A5AA]">Automatically save new statements to your device.</p>
            </div>
            <Toggle
              enabled={documentPrefs.autoDownload}
              onChange={(value) => setDocumentPrefs((prev) => ({ ...prev, autoDownload: value }))}
            />
          </div>
          <div className="flex items-start justify-between py-3">
            <div>
              <p className="text-[12px] text-[#1F1F1F]">Paperless delivery</p>
              <p className="mt-1 text-[10px] text-[#A2A5AA]">Go green and receive all communications digitally.</p>
            </div>
            <Toggle
              enabled={documentPrefs.paperless}
              onChange={(value) => setDocumentPrefs((prev) => ({ ...prev, paperless: value }))}
            />
          </div>
        </div>
      </SectionCard>

      <SectionCard>
        <SectionHeader title="Statement Settings" />
        <div className="grid gap-3 p-4 sm:grid-cols-2">
          <div>
            <p className="mb-2 text-[11px] text-[#4B4B4B]">Preferred Format</p>
            <div className="flex flex-wrap gap-2">
              {['PDF', 'CSV'].map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setDocumentPrefs((prev) => ({ ...prev, format: item }))}
                  className={`h-[28px] min-w-[46px] rounded-full px-3 text-[10px] ${documentPrefs.format === item
                    ? 'border border-[#3B6CC2] bg-[#EEF4FF] text-[#1F4FA5]'
                    : 'bg-[#EAF0F8] text-[#6A7380]'
                    }`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-2 text-[11px] text-[#4B4B4B]">Delivery Frequency</p>
            <div className="flex flex-wrap gap-2">
              {['Quarterly', 'Annually', 'Monthly'].map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setDocumentPrefs((prev) => ({ ...prev, frequency: item }))}
                  className={`h-[28px] min-w-[62px] rounded-full px-3 text-[10px] ${documentPrefs.frequency === item
                    ? 'border border-[#3B6CC2] bg-[#EEF4FF] text-[#1F4FA5]'
                    : 'bg-[#EAF0F8] text-[#6A7380]'
                    }`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        </div>
      </SectionCard>

      <div className="flex justify-end">
        <button type="button" className="h-[32px] min-w-[90px] rounded-full bg-[#FBCB4B] px-5 text-[12px] text-[#1F1F1F]">
          Save
        </button>
      </div>
    </div>
  );

  const renderAccountsTab = () => (
    <SectionCard>
      <div className="flex items-center justify-end border-b border-[#ECEDEF] p-3">
        <button
          type="button"
          onClick={() => setActiveTab('add-account')}
          className="h-[32px] rounded-full bg-[#FBCB4B] px-5 text-[12px] text-[#1F1F1F]"
        >
          Add Account
        </button>
      </div>

      <div className="overflow-x-auto p-3">
        <table className="w-full min-w-[680px] text-left text-[11px] text-[#4B4B4B]">
          <thead>
            <tr className="border-b border-[#ECEDEF] text-[10px] text-[#7B8088]">
              <th className="py-2 pr-3">Account</th>
              <th className="py-2 pr-3">Assets Value</th>
              <th className="py-2 pr-3">Total Cash</th>
              <th className="py-2 pr-3">Cash Available</th>
            </tr>
          </thead>
          <tbody>
            {accounts.map((item) => (
              <tr key={item.id} className="border-b border-[#F2F3F5]">
                <td className="py-2 pr-3">{item.account}</td>
                <td className="py-2 pr-3">{item.assetsValue}</td>
                <td className="py-2 pr-3">{item.totalCash}</td>
                <td className="py-2 pr-3">{item.cashAvailable}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SectionCard>
  );

  const renderAddAccount = () => (
    <div>
      <button
        type="button"
        onClick={() => setActiveTab('accounts')}
        className="mb-3 inline-flex items-center gap-1 text-[14px] text-[#1F1F1F]"
      >
        <ChevronLeft className="h-4 w-4 text-[#8E8E93]" />
        Add Account
      </button>

      <div className="space-y-2">
        <SectionCard>
          <SectionHeader title="Account Info" />
          <div className="grid gap-3 p-4 sm:grid-cols-2">
            <div>
              <FieldLabel>New Account Type</FieldLabel>
              <div className="relative">
                <select
                  value={addAccount.newAccountType}
                  onChange={(event) => {
                    setAddAccount((prev) => ({ ...prev, newAccountType: event.target.value }));
                    setAddAccountErrors((prev) => ({ ...prev, newAccountType: undefined }));
                  }}
                  className={`h-[36px] w-full appearance-none rounded-[6px] border px-3 text-[12px] text-[#4B4B4B] outline-none ${addAccountErrors.newAccountType ? 'border-[#E05252]' : 'border-[#E5E5EA]'
                    }`}
                >
                  <option value="">Select funding method</option>
                  <option value="Roth SEP">Roth SEP</option>
                  <option value="Traditional">Traditional</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-[#A2A5AA]" />
              </div>
              {addAccountErrors.newAccountType && (
                <p className="mt-1 text-[10px] text-[#E05252]">{addAccountErrors.newAccountType}</p>
              )}
            </div>
            <div>
              <FieldLabel>Payment Source</FieldLabel>
              <div className="relative">
                <select
                  value={addAccount.paymentSource}
                  onChange={(event) => setAddAccount((prev) => ({ ...prev, paymentSource: event.target.value }))}
                  className="h-[36px] w-full appearance-none rounded-[6px] border border-[#E5E5EA] px-3 text-[12px] text-[#4B4B4B] outline-none"
                >
                  <option>Wire</option>
                  <option>ACH</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-[#A2A5AA]" />
              </div>
            </div>
          </div>
        </SectionCard>

        <SectionCard>
          <SectionHeader title="Identity Verification" />
          <div className="grid gap-3 p-4 sm:grid-cols-2">
            <div>
              <FieldLabel>Type of ID</FieldLabel>
              <div className="relative">
                <select
                  value={addAccount.idType}
                  onChange={(event) => setAddAccount((prev) => ({ ...prev, idType: event.target.value }))}
                  className="h-[36px] w-full appearance-none rounded-[6px] border border-[#E5E5EA] px-3 text-[12px] text-[#4B4B4B] outline-none"
                >
                  <option>Passport</option>
                  <option>Driver License</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-[#A2A5AA]" />
              </div>
            </div>
            <div>
              <FieldLabel>Passport Number Source</FieldLabel>
              <TextInput
                className={addAccountErrors.passportNumber ? '!border-[#E05252]' : ''}
                placeholder="Enter passport number"
                value={addAccount.passportNumber}
                onChange={(event) => {
                  setAddAccount((prev) => ({ ...prev, passportNumber: event.target.value }));
                  setAddAccountErrors((prev) => ({ ...prev, passportNumber: undefined }));
                }}
              />
              {addAccountErrors.passportNumber && (
                <p className="mt-1 text-[10px] text-[#E05252]">{addAccountErrors.passportNumber}</p>
              )}
            </div>
            <div className="sm:col-span-2">
              <FieldLabel>Choose ID Scan or Photo</FieldLabel>
              <input ref={idUploadRef} type="file" className="hidden" onChange={handleIdImageChange} />
              <button
                type="button"
                onClick={() => idUploadRef.current?.click()}
                className={`flex h-[56px] w-full flex-col items-center justify-center rounded-[6px] border border-dashed text-[#A2A5AA] ${addAccountErrors.idFileName ? 'border-[#E05252]' : 'border-[#E5E5EA]'
                  }`}
              >
                <Plus className="h-4 w-4" />
                <span className="mt-1 text-[9px]">{addAccount.idFileName || 'Drag & drop files here'}</span>
              </button>
              {addAccountErrors.idFileName && (
                <p className="mt-1 text-[10px] text-[#E05252]">{addAccountErrors.idFileName}</p>
              )}
            </div>
          </div>
        </SectionCard>

        <SectionCard>
          <SectionHeader title="Personal Information" />
          <div className="grid gap-x-6 gap-y-2 p-4 sm:grid-cols-2 text-[12px]">
            <div>
              <p className="text-[10px] text-[#A2A5AA]">Name</p>
              <p className="mt-1 text-[#1F1F1F]">{personalInfo.name}</p>
            </div>
            <div>
              <p className="text-[10px] text-[#A2A5AA]">Date of Birth</p>
              <p className="mt-1 text-[#1F1F1F]">{personalInfo.dateOfBirth}</p>
            </div>
            <div>
              <p className="text-[10px] text-[#A2A5AA]">Social Security Number</p>
              <p className="mt-1 text-[#1F1F1F]">{personalInfo.ssn}</p>
            </div>
            <div>
              <p className="text-[10px] text-[#A2A5AA]">Marital Status</p>
              <p className="mt-1 text-[#1F1F1F]">{personalInfo.maritalStatus}</p>
            </div>
            <div>
              <p className="text-[10px] text-[#A2A5AA]">Physical Address</p>
              <p className="mt-1 text-[#1F1F1F]">{personalInfo.physicalAddress}</p>
            </div>
            <div>
              <p className="text-[10px] text-[#A2A5AA]">Mailing Address</p>
              <p className="mt-1 text-[#1F1F1F]">{personalInfo.mailingAddress}</p>
            </div>
          </div>
        </SectionCard>
      </div>

      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <label className="inline-flex items-center gap-2 text-[10px] text-[#A2A5AA]">
          <input
            type="checkbox"
            checked={addAccount.verified}
            onChange={(event) => {
              setAddAccount((prev) => ({ ...prev, verified: event.target.checked }));
              setAddAccountErrors((prev) => ({ ...prev, verified: undefined }));
            }}
            className="h-3 w-3 rounded border-[#D0D3D8]"
          />
          I verify that the information is correct
        </label>

        {addAccountErrors.verified && <p className="text-[10px] text-[#E05252]">{addAccountErrors.verified}</p>}

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setAddAccount(defaultAddAccount);
              setAddAccountErrors({});
              setActiveTab('accounts');
            }}
            className="h-[32px] min-w-[90px] rounded-full bg-[#FFF3D6] px-5 text-[12px] text-[#6A6A6A]"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!addAccount.verified}
            onClick={() => {
              const isValid = validateAddAccount();
              if (!isValid) return;
              setAccounts((prev) => [
                ...prev,
                {
                  id: `acct-${prev.length + 1}`,
                  account: `${addAccount.newAccountType} (${Math.floor(1000000000 + Math.random() * 8999999999)})`,
                  assetsValue: '$0.00',
                  totalCash: '$0.00',
                  cashAvailable: '$0.00',
                },
              ]);
              setAddAccount(defaultAddAccount);
              setAddAccountErrors({});
              setActiveTab('accounts');
            }}
            className="h-[32px] min-w-[90px] rounded-full bg-[#FBCB4B] px-5 text-[12px] text-[#1F1F1F] disabled:opacity-50"
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="mx-auto max-w-8xl font-helvetica text-[#1F1F1F]">
      <div>
        <h1 className="font-goudy text-lg md:text-2xl text-[#1F1F1F]">Settings</h1>
        <p className="font-helvetica text-[#4B4B4B] text-sm sm:text-md mt-2">Manage your account preferences and security.</p>
      </div>

      {activeTab !== 'add-account' && (
        <div className="mt-4 border-b border-[#E5E5EA]">
          <div className="flex items-center gap-8 overflow-x-auto pb-0">
            {tabs.map((tab) => {
              const selected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative shrink-0 pb-[10px] font-goudy text-[16px] leading-5 ${selected ? 'text-[#274583]' : 'text-[#8E8E93]'}`}
                >
                  {tab.label}
                  {selected && (
                    <span className="absolute bottom-0 left-1/2 h-[2px] w-[34px] -translate-x-1/2 rounded-full bg-[#FBCB4B]" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="mt-5">
        {activeTab === 'profile' && renderProfileTab()}
        {activeTab === 'security' && renderSecurityTab()}
        {activeTab === 'notifications' && renderNotificationsTab()}
        {activeTab === 'documents' && renderDocumentsTab()}
        {activeTab === 'accounts' && renderAccountsTab()}
        {activeTab === 'add-account' && renderAddAccount()}
      </div>
    </div>
  );
}
