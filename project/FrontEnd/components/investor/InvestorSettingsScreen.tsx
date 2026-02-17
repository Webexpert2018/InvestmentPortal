'use client';

import { ChangeEvent, useMemo, useRef, useState } from 'react';
import { CalendarDays, ChevronDown, ChevronLeft, Plus, Upload } from 'lucide-react';

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
  | 'country';

type AddAccountErrorFields = 'newAccountType' | 'passportNumber' | 'idFileName' | 'verified';

const tabs: Array<{ id: Exclude<SettingsTab, 'add-account'>; label: string }> = [
  { id: 'profile', label: 'Profile Information' },
  { id: 'security', label: 'Security & Login' },
  { id: 'notifications', label: 'Notifications' },
  { id: 'documents', label: 'Document Preferences' },
  { id: 'accounts', label: 'Account Switcher' },
];

const defaultProfile = {
  firstName: '',
  lastName: '',
  email: '',
  countryCode: '+1 (USA)',
  phoneNumber: '',
  dob: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  state: '',
  zipCode: '',
  country: '',
  ssn: '*** ** ***',
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
      className={`h-[36px] w-full rounded-[6px] border border-[#E5E5EA] px-3 text-[12px] text-[#1F1F1F] outline-none placeholder:text-[#B1B3B8] focus:border-[#274583] ${props.className ?? ''}`}
    />
  );
}

function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={`h-[74px] w-full resize-none rounded-[6px] border border-[#E5E5EA] px-3 py-2 text-[12px] text-[#1F1F1F] outline-none placeholder:text-[#B1B3B8] focus:border-[#274583] ${props.className ?? ''}`}
    />
  );
}

export function InvestorSettingsScreen() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  const [profile, setProfile] = useState(defaultProfile);
  const [password, setPassword] = useState(defaultPassword);
  const [sessions, setSessions] = useState<SessionItem[]>(initialSessions);
  const [profileImageName, setProfileImageName] = useState('');
  const profileImageInputRef = useRef<HTMLInputElement | null>(null);

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

  const handleProfileImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setProfileImageName(file?.name ?? '');
  };

  const handleIdImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setAddAccount((prev) => ({ ...prev, idFileName: file?.name ?? '' }));
    setAddAccountErrors((prev) => ({ ...prev, idFileName: undefined }));
  };

  const validateProfile = () => {
    const errors: Partial<Record<ProfileErrorFields, string>> = {};

    if (!profile.firstName.trim()) errors.firstName = 'First name is required';
    if (!profile.lastName.trim()) errors.lastName = 'Last name is required';
    if (!profile.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^\S+@\S+\.\S+$/.test(profile.email.trim())) {
      errors.email = 'Enter a valid email';
    }
    if (!profile.phoneNumber.trim()) errors.phoneNumber = 'Phone number is required';
    if (!profile.dob.trim()) errors.dob = 'Date of birth is required';
    if (!profile.addressLine1.trim()) errors.addressLine1 = 'Street address line 1 is required';
    if (!profile.city.trim()) errors.city = 'City is required';
    if (!profile.state.trim()) errors.state = 'State is required';
    if (!profile.zipCode.trim()) errors.zipCode = 'ZIP code is required';
    if (!profile.country.trim()) errors.country = 'Country is required';

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
        <div className="mb-4 flex items-center gap-4">
          <input ref={profileImageInputRef} type="file" className="hidden" onChange={handleProfileImageChange} />
          <button
            type="button"
            onClick={() => profileImageInputRef.current?.click()}
            className="flex h-[54px] w-[54px] flex-col items-center justify-center rounded-[6px] border border-[#E5E5EA] text-[#A2A5AA]"
          >
            <Upload className="h-4 w-4" />
            <span className="mt-1 text-[9px]">Upload</span>
          </button>
          <p className="text-[11px] text-[#A2A5AA]">{profileImageName || 'Upload profile image here'}</p>
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
              onChange={(event) => {
                setProfile((prev) => ({ ...prev, email: event.target.value }));
                setProfileErrors((prev) => ({ ...prev, email: undefined }));
              }}
            />
            {profileErrors.email && <p className="mt-1 text-[10px] text-[#E05252]">{profileErrors.email}</p>}
          </div>
          <div>
            <FieldLabel>Phone Number</FieldLabel>
            <div className="grid grid-cols-[110px_minmax(0,1fr)] gap-2">
              <div className="relative">
                <select
                  value={profile.countryCode}
                  onChange={(event) => setProfile((prev) => ({ ...prev, countryCode: event.target.value }))}
                  className="h-[36px] w-full appearance-none rounded-[6px] border border-[#E5E5EA] px-3 text-[12px] text-[#4B4B4B] outline-none"
                >
                  <option>+1 (USA)</option>
                  <option>+44 (UK)</option>
                  <option>+91 (India)</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-[#A2A5AA]" />
              </div>
              <TextInput
                className={profileErrors.phoneNumber ? '!border-[#E05252]' : ''}
                placeholder="Enter phone number"
                value={profile.phoneNumber}
                onChange={(event) => {
                  setProfile((prev) => ({ ...prev, phoneNumber: event.target.value }));
                  setProfileErrors((prev) => ({ ...prev, phoneNumber: undefined }));
                }}
              />
            </div>
            {profileErrors.phoneNumber && <p className="mt-1 text-[10px] text-[#E05252]">{profileErrors.phoneNumber}</p>}
          </div>
          <div>
            <FieldLabel>Date of Birth</FieldLabel>
            <div className="relative">
              <TextInput
                className={profileErrors.dob ? '!border-[#E05252]' : ''}
                placeholder="Select date of birth"
                value={profile.dob}
                onChange={(event) => {
                  setProfile((prev) => ({ ...prev, dob: event.target.value }));
                  setProfileErrors((prev) => ({ ...prev, dob: undefined }));
                }}
              />
              <CalendarDays className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#A2A5AA]" />
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
            <TextInput
              className={profileErrors.city ? '!border-[#E05252]' : ''}
              placeholder="Enter city"
              value={profile.city}
              onChange={(event) => {
                setProfile((prev) => ({ ...prev, city: event.target.value }));
                setProfileErrors((prev) => ({ ...prev, city: undefined }));
              }}
            />
            {profileErrors.city && <p className="mt-1 text-[10px] text-[#E05252]">{profileErrors.city}</p>}
          </div>
          <div>
            <FieldLabel>State</FieldLabel>
            <div className="relative">
              <select
                value={profile.state}
                onChange={(event) => {
                  setProfile((prev) => ({ ...prev, state: event.target.value }));
                  setProfileErrors((prev) => ({ ...prev, state: undefined }));
                }}
                className={`h-[36px] w-full appearance-none rounded-[6px] border px-3 text-[12px] text-[#4B4B4B] outline-none ${
                  profileErrors.state ? 'border-[#E05252]' : 'border-[#E5E5EA]'
                }`}
              >
                <option value="">Select state</option>
                <option>California</option>
                <option>Texas</option>
                <option>Florida</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-[#A2A5AA]" />
            </div>
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
            <div className="relative">
              <select
                value={profile.country}
                onChange={(event) => {
                  setProfile((prev) => ({ ...prev, country: event.target.value }));
                  setProfileErrors((prev) => ({ ...prev, country: undefined }));
                }}
                className={`h-[36px] w-full appearance-none rounded-[6px] border px-3 text-[12px] text-[#4B4B4B] outline-none ${
                  profileErrors.country ? 'border-[#E05252]' : 'border-[#E5E5EA]'
                }`}
              >
                <option value="">Select country</option>
                <option>United States</option>
                <option>United Kingdom</option>
                <option>Canada</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-[#A2A5AA]" />
            </div>
            {profileErrors.country && <p className="mt-1 text-[10px] text-[#E05252]">{profileErrors.country}</p>}
          </div>
        </div>

        {profileSaved && <p className="mt-3 text-[10px] text-[#16A66A]">Profile updated successfully.</p>}

        <div className="mt-4 max-w-[360px]">
          <p className="text-[12px] font-medium text-[#4B4B4B]">TAX Information</p>
          <p className="mt-1 text-[10px] text-[#A2A5AA]">Social Security Number / Tax ID</p>
          <TextInput
            className="mt-1"
            value={profile.ssn}
            onChange={(event) => setProfile((prev) => ({ ...prev, ssn: event.target.value }))}
          />
          <p className="mt-1 text-[10px] text-[#C0C3C8]">Your information is encrypted and secure</p>
        </div>

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
            onClick={() => {
              const isValid = validateProfile();
              setProfileSaved(isValid);
            }}
            className="h-[32px] min-w-[90px] rounded-full bg-[#FBCB4B] px-5 text-[12px] text-[#1F1F1F]"
          >
            Save
          </button>
        </div>
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
              <TextInput
                type="password"
                placeholder="Enter current password"
                value={password.currentPassword}
                onChange={(event) => setPassword((prev) => ({ ...prev, currentPassword: event.target.value }))}
              />
            </div>
            <div>
              <FieldLabel>New Password</FieldLabel>
              <TextInput
                type="password"
                placeholder="Enter new password"
                value={password.newPassword}
                onChange={(event) => setPassword((prev) => ({ ...prev, newPassword: event.target.value }))}
              />
            </div>
            <div>
              <FieldLabel>Confirm Password</FieldLabel>
              <TextInput
                type="password"
                placeholder="Enter confirm password"
                value={password.confirmPassword}
                onChange={(event) => setPassword((prev) => ({ ...prev, confirmPassword: event.target.value }))}
              />
            </div>
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
                  className={`h-[28px] min-w-[46px] rounded-full px-3 text-[10px] ${
                    documentPrefs.format === item
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
                  className={`h-[28px] min-w-[62px] rounded-full px-3 text-[10px] ${
                    documentPrefs.frequency === item
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
                  className={`h-[36px] w-full appearance-none rounded-[6px] border px-3 text-[12px] text-[#4B4B4B] outline-none ${
                    addAccountErrors.newAccountType ? 'border-[#E05252]' : 'border-[#E5E5EA]'
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
                className={`flex h-[56px] w-full flex-col items-center justify-center rounded-[6px] border border-dashed text-[#A2A5AA] ${
                  addAccountErrors.idFileName ? 'border-[#E05252]' : 'border-[#E5E5EA]'
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
    <div className="mx-auto max-w-8xl px-4 font-helvetica text-[#1F1F1F]">
      <div>
        <h1 className="font-goudy text-[20px] leading-7 text-[#1F1F1F]">Settings</h1>
        <p className="mt-1 text-[12px] text-[#A2A5AA]">Manage your account preferences and security.</p>
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

      <div className="mt-3">
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
