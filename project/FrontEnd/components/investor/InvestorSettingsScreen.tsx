'use client';

import { ChangeEvent, useMemo, useRef, useState, useEffect } from 'react';
import { CalendarDays, ChevronDown, ChevronLeft, Plus, Upload, Eye, EyeOff, Loader2, MoreHorizontal, RefreshCcw, LogOut, X } from 'lucide-react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { apiClient, BASE_URL } from '@/lib/api/client';
import { Country, State, City } from 'country-state-city';
import { Combobox } from '@/components/ui/combobox';
import { useToast } from '@/hooks/use-toast';
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

type SettingsTab =
  | 'profile'
  | 'security'
  | 'notifications'
  | 'documents'
  | 'accounts'
  | 'bank-accounts'
  | 'add-account'
  | 'add-bank-account'
  | 'sub-accounts';

type SessionItem = {
  id: string;
  name: string;
  subtitle: string;
  activeNow?: boolean;
  signedInAt?: string;
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
  // { id: 'accounts', label: 'Account Switcher' },
  { id: 'bank-accounts', label: 'Bank Accounts' },
  { id: 'sub-accounts', label: 'Sub Accounts' },
];

const COUNTRY_CODES = ['+1 (USA)', '+44 (UK)', '+91 (IN)'];

const cleanPhoneInput = (value: string, countryCode: string) => {
  let digits = value.replace(/\D/g, '');
  if (countryCode.includes('+1')) {
    if (digits.length === 11 && digits.startsWith('1')) {
      digits = digits.slice(1);
    }
  } else if (countryCode.includes('+91')) {
    if ((digits.length === 12 || digits.length === 13) && digits.startsWith('91')) {
      digits = digits.slice(2);
    }
    if (digits.length === 11 && digits.startsWith('0')) {
      digits = digits.slice(1);
    }
  } else if (countryCode.includes('+44')) {
    if ((digits.length === 12 || digits.length === 13) && digits.startsWith('44')) {
      digits = digits.slice(2);
    }
  }
  return digits;
};

const formatPhoneNumber = (value: string, countryCode: string) => {
  let digits = cleanPhoneInput(value, countryCode);
  const isUK = countryCode.includes('+44');
  const maxDigits = isUK ? 11 : 10;
  if (digits.length > maxDigits) {
    digits = digits.slice(0, maxDigits);
  }
  if (digits.length === 0) return '';
  if (digits.length <= 3) {
    return `(${digits}`;
  }
  if (digits.length <= 6) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  }
  if (digits.length <= 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
  }
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 11)}`;
};

const formatTaxIdDisplay = (taxId: string, type: string) => {
  if (!taxId) return '-';
  const clean = taxId.replace(/\D/g, '');
  if (clean.length !== 9) return taxId;
  if (type === 'minor') {
    return `${clean.slice(0, 3)}-${clean.slice(3, 5)}-${clean.slice(5)}`;
  } else {
    return `${clean.slice(0, 2)}-${clean.slice(2)}`;
  }
};

const formatDate = (dateString?: string) => {
  if (!dateString) return '-';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'UTC'
    });
  } catch {
    return dateString;
  }
};

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
  country: 'US',
  ssn: '*** ** ***',
  profileImageUrl: '',
  investorType: 'personal',
  entityName: '',
  entityType: '',
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

const defaultBankAdd = {
  bank_name: '',
  account_number: '',
  routing_number: '',
  beneficiary_name: '',
  bank_address: '',
  bank_description: '',
};

const initialSessions: SessionItem[] = [];

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

const formatSessionDate = (dateStr: string | null | undefined) => {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
  } catch (e) {
    return dateStr;
  }
};

export function InvestorSettingsScreen() {
  const { user, refreshUser, updateUser, profileTimestamp } = useAuth();
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  const [profile, setProfile] = useState(defaultProfile);
  const isEntity = profile.investorType === 'entity' || user?.investorType === 'entity';
  const entityName = profile.entityName || user?.entityName || '';
  const entityType = profile.entityType || user?.entityType || '';
  const [password, setPassword] = useState(defaultPassword);
  const [savingNotif, setSavingNotif] = useState(false);
  const [sessions, setSessions] = useState<SessionItem[]>(initialSessions);
  const [bankAccounts, setBankAccounts] = useState<any[]>([]);
  const [bankAccountsLoading, setBankAccountsLoading] = useState(true);
  const [bankAdd, setBankAdd] = useState(defaultBankAdd);
  const [bankAddErrors, setBankAddErrors] = useState<Record<string, string>>({});
  const [profileImageName, setProfileImageName] = useState('');
  const [bankAccountMode, setBankAccountMode] = useState<'add' | 'edit' | 'view'>('add');
  const [currentBankId, setCurrentBankId] = useState<string | null>(null);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [deleteBankId, setDeleteBankId] = useState<string | null>(null);
  const [isDeletingBank, setIsDeletingBank] = useState(false);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [revokingSessionId, setRevokingSessionId] = useState<string | null>(null);
  const [sessionToRevoke, setSessionToRevoke] = useState<SessionItem | null>(null);
  const [isConfirmRevokeOpen, setIsConfirmRevokeOpen] = useState(false);

  const [subaccounts, setSubaccounts] = useState<any[]>([]);
  const [subaccountsLoading, setSubaccountsLoading] = useState(false);
  const [selectedSubaccount, setSelectedSubaccount] = useState<any>(null);
  const [subAccountMode, setSubAccountMode] = useState<'list' | 'add'>('list');
  const [subAccountType, setSubAccountType] = useState<'minor' | 'entity'>('minor');
  const [subForm, setSubForm] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    dob: '',
    phone: '',
    countryCode: '+1 (USA)',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'US',
    taxId: '',
    entityName: '',
    entityType: 'LLC',
  });
  const [subFormErrors, setSubFormErrors] = useState<Record<string, string>>({});
  const [subFormSaving, setSubFormSaving] = useState(false);

  // IRA Modal states for minor subaccounts
  const [showAddIraModal, setShowAddIraModal] = useState(false);
  const [iraForm, setIraForm] = useState({
    accountType: 'Traditional IRA',
    accountNumber: '',
    custodian: '',
    beneficiary: '',
    accountHolderName: '',
    ssn: '',
    middleName: '',
    suffix: '',
    maritalStatus: 'single',
    mailingAddressSame: true,
    mailingAddress1: '',
    mailingAddress2: '',
    mailingCity: '',
    mailingState: '',
    mailingZipCode: '',
    mailingCountry: '',
  });
  const [accountTypes, setAccountTypes] = useState<any[]>([]);
  const [iraLoading, setIraLoading] = useState(false);
  const [iraErrors, setIraErrors] = useState<{ [key: string]: string }>({});

  const fetchAccountTypes = async () => {
    try {
      const data = await apiClient.getIraAccountTypes();
      setAccountTypes(data);
    } catch (error) {
      console.error('Failed to fetch account types:', error);
    }
  };

  const handleOpenAddIraModal = (sub: any) => {
    fetchAccountTypes();
    setIraForm({
      accountType: 'Traditional IRA',
      accountNumber: '',
      custodian: '',
      beneficiary: '',
      accountHolderName: sub.fullName || '',
      ssn: sub.taxId || '',
      middleName: '',
      suffix: '',
      maritalStatus: 'single',
      mailingAddressSame: true,
      mailingAddress1: sub.addressLine1 || '',
      mailingAddress2: sub.addressLine2 || '',
      mailingCity: sub.city || '',
      mailingState: sub.state || '',
      mailingZipCode: sub.zipCode || '',
      mailingCountry: sub.country || '',
    });
    setIraErrors({});
    setShowAddIraModal(true);
  };

  useEffect(() => {
    if (iraForm.mailingAddressSame && selectedSubaccount) {
      setIraForm(prev => ({
        ...prev,
        mailingAddress1: selectedSubaccount.addressLine1 || '',
        mailingAddress2: selectedSubaccount.addressLine2 || '',
        mailingCity: selectedSubaccount.city || '',
        mailingState: selectedSubaccount.state || '',
        mailingZipCode: selectedSubaccount.zipCode || '',
        mailingCountry: selectedSubaccount.country || '',
      }));
    }
  }, [iraForm.mailingAddressSame, selectedSubaccount]);

  const handleSaveIRA = async () => {
    const e: { [k: string]: string } = {};
    if (!iraForm.accountType.trim()) e.accountType = 'Please enter account type.';
    if (!iraForm.maritalStatus) e.maritalStatus = 'Please select marital status.';
    const ssnDigits = iraForm.ssn.replace(/[^0-9]/g, '');
    if (!iraForm.ssn.trim()) e.ssn = 'Please enter Social Security Number.';
    else if (ssnDigits.length !== 9) e.ssn = 'SSN must contain 9 digits.';

    if (!iraForm.mailingAddressSame) {
      if (!iraForm.mailingAddress1?.trim()) e.mailingAddress1 = 'Please enter mailing address.';
      if (!iraForm.mailingCity?.trim()) e.mailingCity = 'Please enter city.';
      if (!iraForm.mailingState?.trim()) e.mailingState = 'Please select state.';
      if (!iraForm.mailingCountry?.trim()) e.mailingCountry = 'Please select country.';
      if (!iraForm.mailingZipCode?.trim()) e.mailingZipCode = 'Please enter zip code.';
    }

    setIraErrors(e);
    if (Object.keys(e).length > 0) {
      toast({
        title: 'Validation failed',
        description: 'Missing or invalid fields: ' + Object.keys(e).join(', '),
        variant: 'destructive',
      });
      return;
    }

    setIraLoading(true);
    try {
      const parts = (selectedSubaccount?.fullName || '').trim().split(/\s+/);
      const firstName = parts[0] || '';
      const lastName = parts.slice(1).join(' ') || '';

      await apiClient.createIRAAccount({
        targetUserId: selectedSubaccount.id,
        accountType: iraForm.accountType,
        accountNumber: iraForm.accountNumber,
        custodian: iraForm.custodian,
        beneficiary: iraForm.beneficiary,
        middleName: iraForm.middleName,
        suffix: iraForm.suffix,
        maritalStatus: iraForm.maritalStatus,
        mailingAddressSame: iraForm.mailingAddressSame,
        mailingAddress1: iraForm.mailingAddress1,
        mailingAddress2: iraForm.mailingAddress2,
        mailingCity: iraForm.mailingCity,
        mailingState: State.getStateByCodeAndCountry(iraForm.mailingState, iraForm.mailingCountry)?.name || iraForm.mailingState,
        mailingZipCode: iraForm.mailingZipCode,
        mailingCountry: Country.getCountryByCode(iraForm.mailingCountry)?.name || iraForm.mailingCountry,
        ssn: iraForm.ssn,
        firstName: firstName,
        lastName: lastName,
        email: selectedSubaccount.email,
        dob: selectedSubaccount.dob,
        phone: selectedSubaccount.phone,
        taxId: selectedSubaccount.taxId,
        physicalAddress1: selectedSubaccount.addressLine1,
        physicalAddress2: selectedSubaccount.addressLine2,
        city: selectedSubaccount.city,
        state: selectedSubaccount.state,
        zipCode: selectedSubaccount.zipCode,
        country: selectedSubaccount.country,
      });

      toast({
        title: 'IRA saved',
        description: 'IRA account saved locally and synced successfully.',
        variant: 'success'
      });

      setShowAddIraModal(false);
      setSelectedSubaccount(null);
    } catch (error: any) {
      toast({
        title: error?.status === 409 ? 'Duplicate Account Type' : 'Error',
        description: error?.message || 'Failed to save IRA account',
        variant: 'destructive'
      });
    } finally {
      setIraLoading(false);
    }
  };

  const countries = useMemo(() => {
    const allCountries = Country.getAllCountries();
    // Sort countries with USA at the top
    return [
      ...allCountries.filter(c => c.isoCode === 'US'),
      ...allCountries.filter(c => c.isoCode !== 'US').sort((a, b) => a.name.localeCompare(b.name))
    ];
  }, []);
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

  const subStates = useMemo(() => {
    if (!subForm.country) return [];
    const countryObj = countries.find(c => c.isoCode === subForm.country || c.name === subForm.country);
    return countryObj ? State.getStatesOfCountry(countryObj.isoCode) : [];
  }, [subForm.country, countries]);

  const subCities = useMemo(() => {
    if (!subForm.country || !subForm.state) return [];
    const countryObj = countries.find(c => c.isoCode === subForm.country || c.name === subForm.country);
    const stateObj = subStates.find(s => s.isoCode === subForm.state || s.name === subForm.state);
    if (!countryObj || !stateObj) return [];
    return City.getCitiesOfState(countryObj.isoCode, stateObj.isoCode);
  }, [subForm.country, subForm.state, countries, subStates]);

  const iraStates = useMemo(() => {
    if (!iraForm.mailingCountry) return [];
    const countryObj = countries.find(c => c.isoCode === iraForm.mailingCountry || c.name === iraForm.mailingCountry);
    return countryObj ? State.getStatesOfCountry(countryObj.isoCode) : [];
  }, [iraForm.mailingCountry, countries]);

  const loadSubaccounts = async () => {
    try {
      setSubaccountsLoading(true);
      const data = await apiClient.getSubaccounts();
      setSubaccounts(data);
    } catch (err) {
      console.error('Error loading subaccounts:', err);
    } finally {
      setSubaccountsLoading(false);
    }
  };

  const profileImageInputRef = useRef<HTMLInputElement | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dobInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const loadBankAccounts = async () => {
    try {
      setBankAccountsLoading(true);
      console.log('📋 Loading bank accounts from API...');
      const data = await apiClient.getBankAccounts();
      console.log('✅ Bank accounts loaded:', data?.length || 0, 'accounts');

      const uniqueAccounts: any[] = [];
      const seen = new Set<string>();

      if (data && Array.isArray(data)) {
        data.forEach(account => {
          const key = `${account.account_number}_${account.routing_number}`;
          if (!seen.has(key)) {
            seen.add(key);
            uniqueAccounts.push(account);
          } else if (account.bank_description && account.bank_description.trim() !== '-' && account.bank_description.trim() !== '') {
            // Overwrite with richer description if available
            const existingIndex = uniqueAccounts.findIndex(a => `${a.account_number}_${a.routing_number}` === key);
            if (existingIndex !== -1) {
              uniqueAccounts[existingIndex] = account;
            }
          }
        });
      }

      setBankAccounts(uniqueAccounts);
      setError(null);
    } catch (err: any) {
      console.error('❌ Error loading bank accounts:', err);
      const errorMsg = err.message || 'Failed to load bank accounts';
      setError(errorMsg);
      setBankAccounts([]);
    } finally {
      setBankAccountsLoading(false);
    }
  };

  const loadSessions = async () => {
    try {
      setSessionsLoading(true);
      const data = await apiClient.getSessions();
      setSessions(data);
    } catch (err) {
      console.error('Error loading sessions:', err);
    } finally {
      setSessionsLoading(false);
    }
  };

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
            phoneNumber: formatPhoneNumber(localNumber, matchedCode),
            dob: formatDateForInput(userData.dob),
            addressLine1: userData.addressLine1 || '',
            addressLine2: userData.addressLine2 || '',
            city: userData.city || '',
            state: stateIso,
            zipCode: userData.zipCode || '',
            country: countryIso || 'US',
            ssn: userData.taxId || '*** ** ***',
            profileImageUrl: userData.profileImageUrl || '',
            investorType: userData.investorType || 'personal',
            entityName: userData.entityName || '',
            entityType: userData.entityType || '',
          });

          // Sync notification settings
          setNotifications({
            announcements: {
              email: userData.notif_announcements ?? false,
              sms: userData.notif_sms_announcements ?? false
            },
            alerts: {
              email: userData.notif_alerts ?? true,
              sms: userData.notif_sms_alerts ?? true
            },
            docUploads: {
              email: userData.notif_doc_uploads ?? false,
              sms: userData.notif_sms_doc_uploads ?? false
            },
            taxFormsAlert: {
              email: userData.pref_tax_forms_alert ?? true,
              sms: userData.notif_sms_tax_forms ?? false
            },
            navRecalc: {
              email: userData.notif_nav_recalc ?? true,
              sms: userData.notif_sms_nav_recalc ?? false
            },
            fundingConf: {
              email: userData.notif_funding_conf ?? true,
              sms: userData.notif_sms_funding_conf ?? true
            },
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
    loadBankAccounts();
    loadSessions();
    loadSubaccounts();
  }, []);

  const [notifications, setNotifications] = useState({
    announcements: { email: false, sms: false },
    alerts: { email: true, sms: true },
    docUploads: { email: false, sms: false },
    taxFormsAlert: { email: true, sms: false },
    navRecalc: { email: true, sms: false },
    fundingConf: { email: true, sms: true },
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
      const cleanNumber = profile.phoneNumber.replace(/\D/g, '');
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
    // if (!profile.dob.trim()) {
    //   errors.dob = 'Date of birth is required';
    // } else {
    //   const birthDate = new Date(profile.dob);
    //   const today = new Date();
    //   let age = today.getFullYear() - birthDate.getFullYear();
    //   const m = today.getMonth() - birthDate.getMonth();
    //   if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    //     age--;
    //   }

    //   if (age < 18) {
    //     errors.dob = 'You must be at least 18 years old';
    //   } else if (age > 70) {
    //     errors.dob = 'Age cannot exceed 70 years';
    //   }
    // }
    if (!profile.dob.trim()) {
      errors.dob = 'Date of birth is required';
    } else {
      const birthDate = new Date(profile.dob);
      const today = new Date();

      // Remove time part for accurate comparison
      today.setHours(0, 0, 0, 0);

      // ❌ Future date not allowed
      if (birthDate > today) {
        errors.dob = 'Future date is not allowed';
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
                <FieldLabel>{isEntity ? 'Legal Entity Name' : 'First Name'}</FieldLabel>
                <TextInput
                  className={profileErrors.firstName ? '!border-[#E05252]' : ''}
                  placeholder={isEntity ? 'Enter legal entity name' : 'Enter first name'}
                  value={isEntity ? entityName : profile.firstName}
                  disabled
                  title={isEntity ? 'Legal entity name cannot be changed directly' : 'First name cannot be changed directly'}
                  onChange={(event) => {
                    if (isEntity) {
                      setProfile((prev) => ({ ...prev, entityName: event.target.value }));
                    } else {
                      setProfile((prev) => ({ ...prev, firstName: event.target.value }));
                    }
                    setProfileErrors((prev) => ({ ...prev, firstName: undefined }));
                  }}
                />
                {profileErrors.firstName && <p className="mt-1 text-[10px] text-[#E05252]">{profileErrors.firstName}</p>}
                <p className="mt-1 text-[9px] text-[#A2A5AA]">Legal name cannot be changed directly due to KYC regulations. Please contact support.</p>
              </div>
              <div>
                <FieldLabel>{isEntity ? 'Entity Type' : 'Last Name'}</FieldLabel>
                <TextInput
                  className={profileErrors.lastName ? '!border-[#E05252]' : ''}
                  placeholder={isEntity ? 'Enter entity type' : 'Enter last name'}
                  value={isEntity ? entityType : profile.lastName}
                  disabled
                  title={isEntity ? 'Entity type cannot be changed directly' : 'Last name cannot be changed directly'}
                  onChange={(event) => {
                    if (isEntity) {
                      setProfile((prev) => ({ ...prev, entityType: event.target.value }));
                    } else {
                      setProfile((prev) => ({ ...prev, lastName: event.target.value }));
                    }
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
                        const newCode = event.target.value;
                        setProfile((prev) => ({
                          ...prev,
                          countryCode: newCode,
                          phoneNumber: formatPhoneNumber(prev.phoneNumber, newCode),
                        }));
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
                      const val = formatPhoneNumber(event.target.value, profile.countryCode);
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
                  let val = event.target.value.replace(/\D/g, '');
                  if (val.length > 9) val = val.slice(0, 9);

                  let formatted = val;
                  if (val.length > 3 && val.length <= 5) {
                    formatted = `${val.slice(0, 3)}-${val.slice(3)}`;
                  } else if (val.length > 5) {
                    formatted = `${val.slice(0, 3)}-${val.slice(3, 5)}-${val.slice(5)}`;
                  }

                  setProfile((prev) => ({ ...prev, ssn: formatted }));
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
                    const countryObj = Country.getAllCountries().find(c => c.isoCode === profile.country || c.name === profile.country);
                    const countryName = countryObj?.name || profile.country;

                    let stateName = profile.state;
                    if (countryObj && profile.state) {
                      const stateObj = State.getStatesOfCountry(countryObj.isoCode).find(s => s.isoCode === profile.state || s.name === profile.state);
                      stateName = stateObj?.name || profile.state;
                    }

                    const updateData = {
                      firstName: profile.firstName,
                      lastName: profile.lastName,
                      email: profile.email,
                      phone: `${profile.countryCode} ${profile.phoneNumber}`,
                      dob: profile.dob,
                      addressLine1: profile.addressLine1,
                      addressLine2: profile.addressLine2,
                      city: profile.city,
                      state: stateName,
                      zipCode: profile.zipCode,
                      country: countryName,
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
                  } catch (err: any) {
                    setError(err.message || 'Failed to update profile. Please try again.');
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
            {sessionsLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-[#274583]" />
              </div>
            ) : sessions.length === 0 ? (
              <p className="py-4 text-center text-[12px] text-[#A2A5AA]">No active sessions found.</p>
            ) : (
              sessions.map((session) => (
                <div key={session.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-[12px] font-medium text-[#1F1F1F]">{session.name}</p>
                    <p className={`mt-1 text-[10px] ${session.activeNow ? 'text-[#16A66A]' : 'text-[#A2A5AA]'}`}>
                      {session.subtitle}
                    </p>
                    <p className="mt-0.5 text-[9px] text-[#A2A5AA]">
                      Logged in: {formatSessionDate(session.signedInAt)}
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={revokingSessionId === session.id}
                    onClick={() => {
                      if (session.activeNow) {
                        toast({
                          title: 'Current Session',
                          description: 'You cannot log out of your current session here. Please use the Sign Out button.',
                          variant: 'warning',
                        });
                        return;
                      }
                      setSessionToRevoke(session);
                      setIsConfirmRevokeOpen(true);
                    }}
                    className="flex h-[28px] items-center justify-center gap-2 rounded-full bg-[#FBCB4B] px-4 text-[11px] font-semibold text-[#1F1F1F] hover:bg-[#F9BF2A] transition-colors disabled:opacity-50"
                  >
                    {revokingSessionId === session.id && <Loader2 className="h-3 w-3 animate-spin" />}
                    Log Out
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </SectionCard>

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
              Are you sure you want to log out from <span className="font-medium text-[#1F1F1F]">{sessionToRevoke?.name}</span>?
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
                  setSessions((prev) => prev.filter((item) => item.id !== sessionToRevoke.id));
                  toast({
                    title: 'Success',
                    description: 'Session terminated successfully',
                    variant: 'success',
                  });
                } catch (err: any) {
                  toast({
                    title: 'Error',
                    description: err.message || 'Failed to terminate session',
                    variant: 'destructive',
                  });
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
    </div>
  );

  const handleSaveNotifications = async () => {
    try {
      setSavingNotif(true);
      await apiClient.updateSettings({
        notif_announcements: notifications.announcements.email,
        notif_sms_announcements: notifications.announcements.sms,
        notif_alerts: notifications.alerts.email,
        notif_sms_alerts: notifications.alerts.sms,
        notif_doc_uploads: notifications.docUploads.email,
        notif_sms_doc_uploads: notifications.docUploads.sms,
        pref_tax_forms_alert: notifications.taxFormsAlert.email,
        notif_nav_recalc: notifications.navRecalc.email,
        notif_sms_nav_recalc: notifications.navRecalc.sms,
        notif_funding_conf: notifications.fundingConf.email,
        notif_sms_funding_conf: notifications.fundingConf.sms,
        notif_sms_tax_forms: notifications.taxFormsAlert.sms,
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


  const renderNotificationsTab = () => {
    const notificationTypes = [
      {
        key: 'announcements',
        title: 'General Announcement',
        description: 'Platform news, updates, and marketing.',
      },
      {
        key: 'alerts',
        title: 'General Alerts',
        description: 'Important security and account alerts.',
      },
      {
        key: 'docUploads',
        title: 'Tax Document Uploads',
        description: 'Get an alert when your tax documents are ready.',
      },
      {
        key: 'taxFormsAlert',
        title: 'Notify me when new tax forms are uploaded',
        description: 'Get an alert when your tax documents are ready.',
      },
      {
        key: 'navRecalc',
        title: 'NAV Recalculations',
        description: 'Updates on Net Asset Value changes and portfolio recalculations.',
      },
      {
        key: 'fundingConf',
        title: 'Funding Confirmation',
        description: 'Confirmations for deposits and withdrawals.',
      },
    ];

    return (
      <div className="space-y-3">
        <SectionCard>
          <SectionHeader title="Notifications" />
          <div className="p-4">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[11px] font-medium text-[#A2A5AA] uppercase tracking-wider">
                  <th className="pb-4">Type</th>
                  <th className="pb-4 text-center w-[80px]">SMS</th>
                  <th className="pb-4 text-center w-[80px]">Email</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ECEDEF]">
                {notificationTypes.map((type) => (
                  <tr key={type.key}>
                    <td className="py-4 pr-4">
                      <p className="text-[12px] font-medium text-[#1F1F1F]">{type.title}</p>
                      <p className="mt-0.5 text-[10px] text-[#A2A5AA]">{type.description}</p>
                    </td>
                    <td className="py-4 text-center">
                      <Toggle
                        enabled={(notifications as any)[type.key].sms}
                        onChange={(value) => {
                          setNotifications((prev) => ({
                            ...prev,
                            [type.key]: { ...prev[type.key as keyof typeof notifications], sms: value },
                          }));
                          toast({
                            title: value ? 'SMS Enabled' : 'SMS Disabled',
                            description: `${type.title} SMS ${value ? 'turned on' : 'turned off'}.`,
                            variant: value ? 'enable' : ('disable' as any),
                          });
                        }}
                      />
                    </td>
                    <td className="py-4 text-center">
                      <Toggle
                        enabled={(notifications as any)[type.key].email}
                        onChange={(value) => {
                          setNotifications((prev) => ({
                            ...prev,
                            [type.key]: { ...prev[type.key as keyof typeof notifications], email: value },
                          }));
                          toast({
                            title: value ? 'Email Enabled' : 'Email Disabled',
                            description: `${type.title} email ${value ? 'turned on' : 'turned off'}.`,
                            variant: value ? 'enable' : ('disable' as any),
                          });
                        }}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleSaveNotifications}
            disabled={savingNotif}
            className="h-[32px] min-w-[90px] rounded-full bg-[#FBCB4B] px-5 text-[12px] text-[#1F1F1F] disabled:opacity-50"
          >
            {savingNotif ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    );
  };


  // const renderAccountsTab = () => (
  //   <SectionCard>
  //     <div className="flex items-center justify-end border-b border-[#ECEDEF] p-3">
  //       <button
  //         type="button"
  //         onClick={() => setActiveTab('add-account')}
  //         className="h-[32px] rounded-full bg-[#FBCB4B] px-5 text-[12px] text-[#1F1F1F]"
  //       >
  //         Add Account
  //       </button>
  //     </div>

  //     <div className="overflow-x-auto p-3">
  //       <table className="w-full min-w-[680px] text-left text-[11px] text-[#4B4B4B]">
  //         <thead>
  //           <tr className="border-b border-[#ECEDEF] text-[10px] text-[#7B8088]">
  //             <th className="py-2 pr-3">Account</th>
  //             <th className="py-2 pr-3">Assets Value</th>
  //             <th className="py-2 pr-3">Total Cash</th>
  //             <th className="py-2 pr-3">Cash Available</th>
  //           </tr>
  //         </thead>
  //         <tbody>
  //           {accounts.map((item) => (
  //             <tr key={item.id} className="border-b border-[#F2F3F5]">
  //               <td className="py-2 pr-3">{item.account}</td>
  //               <td className="py-2 pr-3">{item.assetsValue}</td>
  //               <td className="py-2 pr-3">{item.totalCash}</td>
  //               <td className="py-2 pr-3">{item.cashAvailable}</td>
  //             </tr>
  //           ))}
  //         </tbody>
  //       </table>
  //     </div>
  //   </SectionCard>
  // );

  const renderSubAccountsTab = () => {
    if (subAccountMode === 'add') {
      return (
        <SectionCard>
          <div className="flex items-center justify-between border-b border-[#ECEDEF] p-4">
            <h3 className="font-goudy text-[16px] leading-5 text-[#1F1F1F]">Add Sub Account</h3>
            <button
              type="button"
              onClick={() => {
                setSubAccountMode('list');
                setSubFormErrors({});
              }}
              className="h-[32px] rounded-full bg-[#ECEDEF] px-5 text-[12px] text-[#4B4B4B] hover:bg-[#D8D9DE]"
            >
              Back to List
            </button>
          </div>

          <form onSubmit={async (e) => {
            e.preventDefault();
            const errors: Record<string, string> = {};
            if (!subForm.email.trim()) errors.email = 'Email is required';
            if (!subForm.password.trim()) errors.password = 'Password is required';

            const cleanNumber = subForm.phone.replace(/\D/g, '');
            if (subForm.phone && cleanNumber) {
              let phoneError = '';
              if (subForm.countryCode.includes('+1')) {
                if (cleanNumber.length !== 10) phoneError = 'USA phone number must be 10 digits';
              } else if (subForm.countryCode.includes('+44')) {
                if (cleanNumber.length < 10 || cleanNumber.length > 11) phoneError = 'UK phone number must be 10-11 digits';
              } else if (subForm.countryCode.includes('+91')) {
                if (cleanNumber.length !== 10) phoneError = 'India phone number must be 10 digits';
              }
              if (phoneError) {
                errors.phone = phoneError;
              }
            }

            const cleanTax = subForm.taxId.replace(/\D/g, '');
            if (subForm.taxId && cleanTax.length !== 9) {
              errors.taxId = 'Tax ID must be exactly 9 digits';
            }

            if (subAccountType === 'minor') {
              if (!subForm.firstName.trim()) errors.firstName = 'First name is required';
              if (!subForm.lastName.trim()) errors.lastName = 'Last name is required';
              if (!subForm.dob.trim()) errors.dob = 'Date of birth is required';
              if (!subForm.addressLine1.trim()) errors.addressLine1 = 'Street address line 1 is required';
              if (!subForm.city.trim()) errors.city = 'City is required';
              if (!subForm.state.trim()) errors.state = 'State is required';
              if (!subForm.zipCode.trim()) errors.zipCode = 'ZIP code is required';
              if (!subForm.country.trim()) errors.country = 'Country is required';
              if (!subForm.taxId.trim()) errors.taxId = 'Tax ID (SSN) is required';
            } else {
              if (!subForm.entityName.trim()) errors.entityName = 'Legal Entity Name is required';
              if (!subForm.entityType.trim()) errors.entityType = 'Entity Type is required';
              if (!subForm.taxId.trim()) errors.taxId = 'Tax ID (EIN) is required';
              if (!subForm.addressLine1.trim()) errors.addressLine1 = 'Street address line 1 is required';
              if (!subForm.city.trim()) errors.city = 'City is required';
              if (!subForm.state.trim()) errors.state = 'State is required';
              if (!subForm.zipCode.trim()) errors.zipCode = 'ZIP code is required';
              if (!subForm.country.trim()) errors.country = 'Country is required';
            }

            if (Object.keys(errors).length > 0) {
              setSubFormErrors(errors);
              return;
            }

            setSubFormSaving(true);
            try {
              const payload = {
                ...subForm,
                taxId: subForm.taxId.replace(/\D/g, ''),
                phone: subForm.phone ? `${subForm.countryCode} ${subForm.phone}`.trim() : null,
                investorType: subAccountType,
                entityName: subAccountType === 'minor' ? null : subForm.entityName,
                entityType: subAccountType === 'minor' ? null : subForm.entityType,
                firstName: subAccountType === 'entity' ? null : subForm.firstName,
                lastName: subAccountType === 'entity' ? null : subForm.lastName,
                dob: subAccountType === 'entity' ? null : subForm.dob,
              };
              await apiClient.createSubaccount(payload);
              toast({ title: 'Success', description: 'Sub-account created successfully', variant: 'success' });
              setSubForm({
                email: '',
                password: '',
                firstName: '',
                lastName: '',
                dob: '',
                phone: '',
                countryCode: '+1 (USA)',
                addressLine1: '',
                addressLine2: '',
                city: '',
                state: '',
                zipCode: '',
                country: 'US',
                taxId: '',
                entityName: '',
                entityType: 'LLC',
              });
              setSubAccountMode('list');
              loadSubaccounts();
            } catch (err: any) {
              toast({ title: 'Error', description: err.message || 'Failed to create sub-account', variant: 'destructive' });
            } finally {
              setSubFormSaving(false);
            }
          }} className="p-4 sm:p-5 space-y-4">
            <div className="w-full sm:w-1/2">
              <FieldLabel>Sub-Account Type</FieldLabel>
              <div className="relative">
                <select
                  value={subAccountType}
                  onChange={(e) => {
                    setSubAccountType(e.target.value as 'minor' | 'entity');
                    setSubFormErrors({});
                  }}
                  className="h-[36px] w-full appearance-none rounded-[6px] border border-[#E5E5EA] px-3 text-[12px] text-[#4B4B4B] outline-none focus:border-[#274583]"
                >
                  <option value="minor">Minor</option>
                  <option value="entity">Entity</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-[#A2A5AA]" />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {subAccountType === 'minor' ? (
                <>
                  <div>
                    <FieldLabel>First Name</FieldLabel>
                    <TextInput
                      className={subFormErrors.firstName ? '!border-[#E05252]' : ''}
                      placeholder="Minor's first name"
                      value={subForm.firstName}
                      onChange={(e) => {
                        setSubForm(prev => ({ ...prev, firstName: e.target.value }));
                        setSubFormErrors(prev => ({ ...prev, firstName: '' }));
                      }}
                    />
                    {subFormErrors.firstName && <p className="mt-1 text-[10px] text-[#E05252]">{subFormErrors.firstName}</p>}
                  </div>
                  <div>
                    <FieldLabel>Last Name</FieldLabel>
                    <TextInput
                      className={subFormErrors.lastName ? '!border-[#E05252]' : ''}
                      placeholder="Minor's last name"
                      value={subForm.lastName}
                      onChange={(e) => {
                        setSubForm(prev => ({ ...prev, lastName: e.target.value }));
                        setSubFormErrors(prev => ({ ...prev, lastName: '' }));
                      }}
                    />
                    {subFormErrors.lastName && <p className="mt-1 text-[10px] text-[#E05252]">{subFormErrors.lastName}</p>}
                  </div>
                  <div>
                    <FieldLabel>Date of Birth</FieldLabel>
                    <TextInput
                      type="date"
                      className={subFormErrors.dob ? '!border-[#E05252]' : ''}
                      value={subForm.dob}
                      onChange={(e) => {
                        setSubForm(prev => ({ ...prev, dob: e.target.value }));
                        setSubFormErrors(prev => ({ ...prev, dob: '' }));
                      }}
                    />
                    {subFormErrors.dob && <p className="mt-1 text-[10px] text-[#E05252]">{subFormErrors.dob}</p>}
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <FieldLabel>Legal Entity Name</FieldLabel>
                    <TextInput
                      className={subFormErrors.entityName ? '!border-[#E05252]' : ''}
                      placeholder="Legal Entity Name"
                      value={subForm.entityName}
                      onChange={(e) => {
                        setSubForm(prev => ({ ...prev, entityName: e.target.value }));
                        setSubFormErrors(prev => ({ ...prev, entityName: '' }));
                      }}
                    />
                    {subFormErrors.entityName && <p className="mt-1 text-[10px] text-[#E05252]">{subFormErrors.entityName}</p>}
                  </div>
                  <div>
                    <FieldLabel>Entity Type</FieldLabel>
                    <div className="relative">
                      <select
                        value={subForm.entityType}
                        onChange={(e) => setSubForm(prev => ({ ...prev, entityType: e.target.value }))}
                        className="h-[36px] w-full appearance-none rounded-[6px] border border-[#E5E5EA] px-3 text-[12px] text-[#4B4B4B] outline-none focus:border-[#274583]"
                      >
                        <option value="LLC">LLC</option>
                        <option value="Corporation">Corporation</option>
                        <option value="Trust">Trust</option>
                        <option value="Partnership">Partnership</option>
                        <option value="Nonprofit">Nonprofit</option>
                        <option value="Others">Others</option>
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-[#A2A5AA]" />
                    </div>
                  </div>
                </>
              )}

              <div>
                <FieldLabel>Email</FieldLabel>
                <TextInput
                  type="email"
                  className={subFormErrors.email ? '!border-[#E05252]' : ''}
                  placeholder="Sub-account email"
                  value={subForm.email}
                  onChange={(e) => {
                    setSubForm(prev => ({ ...prev, email: e.target.value }));
                    setSubFormErrors(prev => ({ ...prev, email: '' }));
                  }}
                />
                {subFormErrors.email && <p className="mt-1 text-[10px] text-[#E05252]">{subFormErrors.email}</p>}
              </div>
              <div>
                <FieldLabel>Password</FieldLabel>
                <PasswordInput
                  className={subFormErrors.password ? '!border-[#E05252]' : ''}
                  placeholder="Sub-account password"
                  value={subForm.password}
                  onChange={(e) => {
                    setSubForm(prev => ({ ...prev, password: e.target.value }));
                    setSubFormErrors(prev => ({ ...prev, password: '' }));
                  }}
                />
                {subFormErrors.password && <p className="mt-1 text-[10px] text-[#E05252]">{subFormErrors.password}</p>}
              </div>

              <div>
                <FieldLabel>Phone Number</FieldLabel>
                <div className="grid grid-cols-[110px_minmax(0,1fr)] gap-2">
                  <div className="relative">
                    <select
                      value={subForm.countryCode}
                      onChange={(event) => {
                        const newCode = event.target.value;
                        setSubForm((prev) => ({
                          ...prev,
                          countryCode: newCode,
                          phone: formatPhoneNumber(prev.phone, newCode),
                        }));
                        setSubFormErrors((prev) => ({ ...prev, phone: '' }));
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
                    className={subFormErrors.phone ? '!border-[#E05252]' : ''}
                    placeholder="Enter phone number"
                    value={subForm.phone}
                    onChange={(event) => {
                      const val = formatPhoneNumber(event.target.value, subForm.countryCode);
                      setSubForm((prev) => ({
                        ...prev,
                        phone: val,
                      }));
                      setSubFormErrors((prev) => ({ ...prev, phone: '' }));
                    }}
                  />
                </div>
                {subFormErrors.phone && <p className="mt-1 text-[10px] text-[#E05252]">{subFormErrors.phone}</p>}
              </div>

              <div>
                <FieldLabel>Tax ID ({subAccountType === 'minor' ? 'SSN' : 'EIN'})</FieldLabel>
                <TextInput
                  className={subFormErrors.taxId ? '!border-[#E05252]' : ''}
                  placeholder={subAccountType === 'minor' ? 'XXX-XX-XXXX' : 'XX-XXXXXXX'}
                  value={subForm.taxId}
                  onChange={(e) => {
                    let val = e.target.value.replace(/\D/g, '');
                    if (val.length > 9) val = val.slice(0, 9);
                    let formatted = val;
                    if (subAccountType === 'minor') {
                      if (val.length > 3 && val.length <= 5) {
                        formatted = `${val.slice(0, 3)}-${val.slice(3)}`;
                      } else if (val.length > 5) {
                        formatted = `${val.slice(0, 3)}-${val.slice(3, 5)}-${val.slice(5)}`;
                      }
                    } else {
                      if (val.length > 2) {
                        formatted = `${val.slice(0, 2)}-${val.slice(2)}`;
                      }
                    }
                    setSubForm(prev => ({ ...prev, taxId: formatted }));
                    setSubFormErrors(prev => ({ ...prev, taxId: '' }));
                  }}
                />
                {subFormErrors.taxId && <p className="mt-1 text-[10px] text-[#E05252]">{subFormErrors.taxId}</p>}
              </div>
            </div>

            <div className="border-t border-[#ECEDEF] pt-4 mt-4">
              <h4 className="text-[13px] font-semibold text-[#1F1F1F] mb-3">Full Address</h4>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <FieldLabel>Street Address Line 1</FieldLabel>
                  <TextInput
                    className={subFormErrors.addressLine1 ? '!border-[#E05252]' : ''}
                    placeholder="Street Address Line 1"
                    value={subForm.addressLine1}
                    onChange={(e) => {
                      setSubForm(prev => ({ ...prev, addressLine1: e.target.value }));
                      setSubFormErrors(prev => ({ ...prev, addressLine1: '' }));
                    }}
                  />
                  {subFormErrors.addressLine1 && <p className="mt-1 text-[10px] text-[#E05252]">{subFormErrors.addressLine1}</p>}
                </div>
                <div>
                  <FieldLabel>Street Address Line 2</FieldLabel>
                  <TextInput
                    placeholder="Street Address Line 2"
                    value={subForm.addressLine2}
                    onChange={(e) => setSubForm(prev => ({ ...prev, addressLine2: e.target.value }))}
                  />
                </div>
                <div>
                  <FieldLabel>Country</FieldLabel>
                  <Combobox
                    options={countries.map(c => ({ value: c.isoCode, label: c.name }))}
                    value={subForm.country}
                    onChange={(val) => {
                      setSubForm((prev) => ({ ...prev, country: val, state: '', city: '' }));
                      setSubFormErrors((prev) => ({ ...prev, country: '' }));
                    }}
                    placeholder="Select Country"
                    className={cn("w-full", subFormErrors.country && "!border-[#E05252]")}
                  />
                  {subFormErrors.country && <p className="mt-1 text-[10px] text-[#E05252]">{subFormErrors.country}</p>}
                </div>
                <div>
                  <FieldLabel>State</FieldLabel>
                  <Combobox
                    options={subStates.map(s => ({ value: s.isoCode, label: s.name }))}
                    value={subForm.state}
                    onChange={(val) => {
                      setSubForm((prev) => ({ ...prev, state: val, city: '' }));
                      setSubFormErrors((prev) => ({ ...prev, state: '' }));
                    }}
                    placeholder="Select State"
                    className={cn("w-full", subFormErrors.state && "!border-[#E05252]")}
                    disabled={!subForm.country}
                  />
                  {subFormErrors.state && <p className="mt-1 text-[10px] text-[#E05252]">{subFormErrors.state}</p>}
                </div>
                <div>
                  <FieldLabel>City</FieldLabel>
                  <Combobox
                    options={subCities.map(c => ({ value: c.name, label: c.name }))}
                    value={subForm.city}
                    onChange={(val) => {
                      setSubForm((prev) => ({ ...prev, city: val }));
                      setSubFormErrors((prev) => ({ ...prev, city: '' }));
                    }}
                    placeholder="Select City"
                    className={cn("w-full", subFormErrors.city && "!border-[#E05252]")}
                    disabled={!subForm.state}
                  />
                  {subFormErrors.city && <p className="mt-1 text-[10px] text-[#E05252]">{subFormErrors.city}</p>}
                </div>
                <div>
                  <FieldLabel>ZIP Code</FieldLabel>
                  <TextInput
                    className={subFormErrors.zipCode ? '!border-[#E05252]' : ''}
                    placeholder="ZIP Code"
                    value={subForm.zipCode}
                    onChange={(e) => {
                      setSubForm(prev => ({ ...prev, zipCode: e.target.value }));
                      setSubFormErrors(prev => ({ ...prev, zipCode: '' }));
                    }}
                  />
                  {subFormErrors.zipCode && <p className="mt-1 text-[10px] text-[#E05252]">{subFormErrors.zipCode}</p>}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-[#ECEDEF]">
              <button
                type="button"
                onClick={() => {
                  setSubAccountMode('list');
                  setSubFormErrors({});
                }}
                className="h-[36px] rounded-full border border-[#E5E5EA] px-6 text-[12px] font-medium text-[#4B4B4B] hover:bg-[#F9FAFB]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={subFormSaving}
                className="flex h-[36px] items-center justify-center gap-2 rounded-full bg-[#274583] px-6 text-[12px] font-medium text-white hover:bg-[#1E3565] disabled:opacity-50"
              >
                {subFormSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                Create Sub Account
              </button>
            </div>
          </form>
        </SectionCard>
      );
    }

    return (
      <SectionCard>
        <div className="flex items-center justify-between border-b border-[#ECEDEF] p-4">
          <h3 className="font-goudy text-[16px] leading-5 text-[#1F1F1F]">My Sub Accounts</h3>
          <button
            type="button"
            onClick={() => setSubAccountMode('add')}
            className="h-[32px] rounded-full bg-[#FBCB4B] px-5 text-[12px] text-[#1F1F1F] hover:bg-[#FAD980]"
          >
            Add Sub Account
          </button>
        </div>

        <div className="p-4 sm:p-5">
          {subaccountsLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-[#274583]" />
              <span className="ml-2 text-[12px] text-[#4B4B4B]">Loading sub-accounts...</span>
            </div>
          ) : subaccounts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <p className="text-[14px] text-[#4B4B4B]">No sub-accounts added yet.</p>
              <p className="mt-1 text-[12px] text-[#A2A5AA]">Add your minor or entity sub-accounts to manage investments on their behalf.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[12px] text-[#4B4B4B]">
                <thead>
                  <tr className="border-b border-[#ECEDEF] text-[11px] text-[#7B8088]">
                    <th className="py-2 pr-3">Name</th>
                    <th className="py-2 pr-3">Email</th>
                    <th className="py-2 pr-3">Type</th>
                    <th className="py-2 pr-3">Tax ID</th>
                    <th className="py-2 pr-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {subaccounts.map((sub) => (
                    <tr
                      key={sub.id}
                      onClick={() => setSelectedSubaccount(sub)}
                      className="border-b border-[#F2F3F5] hover:bg-[#F9FAFB] cursor-pointer transition-colors"
                    >
                      <td className="py-3 pr-3 font-medium text-[#1F1F1F]">{sub.fullName || sub.entityName || '-'}</td>
                      <td className="py-3 pr-3">{sub.email}</td>
                      <td className="py-3 pr-3 capitalize">{sub.investorType}</td>
                      <td className="py-3 pr-3">{formatTaxIdDisplay(sub.taxId, sub.investorType)}</td>
                      <td className="py-3 pr-3 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedSubaccount(sub);
                          }}
                          className="text-[12px] font-semibold text-[#274583] hover:underline"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </SectionCard>
    );
  };

  const renderBankAccountsTab = () => (
    <SectionCard>
      <div className="flex items-center justify-between border-b border-[#ECEDEF] p-3">
        <h3 className="font-goudy text-[16px] leading-5 text-[#1F1F1F]">My Bank Accounts</h3>
        <button
          type="button"
          onClick={() => setActiveTab('add-bank-account')}
          className="h-[32px] rounded-full bg-[#FBCB4B] px-5 text-[12px] text-[#1F1F1F]"
        >
          Add Bank Account
        </button>
      </div>

      <div className="p-3">
        {error && (
          <div className="mb-3 rounded-md bg-[#FEF0F0] p-3">
            <p className="text-[12px] text-[#E05252]">⚠️ {error}</p>
            <button
              onClick={() => {
                setError(null);
                loadBankAccounts();
              }}
              className="mt-2 text-[11px] text-[#274583] hover:underline"
            >
              Try Again
            </button>
          </div>
        )}
        {bankAccountsLoading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-[#274583]" />
            <span className="ml-2 text-[12px] text-[#4B4B4B]">Loading bank accounts...</span>
          </div>
        ) : bankAccounts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <p className="text-[14px] text-[#4B4B4B]">No bank accounts added yet.</p>
            <p className="mt-1 text-[12px] text-[#A2A5AA]">Add your bank details for easier withdrawals and reinvestments.</p>
          </div>
        ) : (
          <div className="min-h-[200px]">
            <table className="w-full min-w-[680px] text-left text-[11px] text-[#4B4B4B]">
              <thead>
                <tr className="border-b border-[#ECEDEF] text-[10px] text-[#7B8088]">
                  <th className="py-2 pr-3">Bank Name</th>
                  <th className="py-2 pr-3">Beneficiary</th>
                  <th className="py-2 pr-3">Account Number</th>
                  <th className="py-2 pr-3">Routing Number</th>
                  <th className="py-2 pr-3">Bank Address</th>
                  <th className="py-2 pr-3">Description</th>
                  <th className="py-2 pr-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {bankAccounts.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-[#F2F3F5] hover:bg-[#F9FAFB] transition-colors cursor-pointer"
                    onClick={() => {
                      setBankAdd({
                        beneficiary_name: item.beneficiary_name,
                        bank_name: item.bank_name,
                        account_number: item.account_number,
                        routing_number: item.routing_number,
                        bank_address: item.bank_address || '',
                        bank_description: item.bank_description || '',
                      });
                      setCurrentBankId(item.id);
                      setBankAccountMode('view');
                      setActiveTab('add-bank-account');
                    }}
                  >
                    <td className="py-2 pr-3 font-medium text-[#1F1F1F]">{item.bank_name}</td>
                    <td className="py-2 pr-3">{item.beneficiary_name}</td>
                    <td className="py-2 pr-3">****{item.account_number?.slice(-4) || 'N/A'}</td>
                    <td className="py-2 pr-3">{item.routing_number}</td>
                    <td className="py-2 pr-3">{item.bank_address || 'N/A'}</td>
                    <td className="py-2 pr-3 max-w-[150px] truncate" title={item.bank_description || 'No description'}>{item.bank_description || <span className="text-[#A2A5AA]">-</span>}</td>
                    <td className="py-2 pr-3">
                      <span className={`rounded-full px-2 py-0.5 text-[9px] uppercase font-bold ${item.status === 'active' ? 'bg-[#E1F7E3] text-[#2D8A39]' : 'bg-[#FFF3D6] text-[#B7791F]'}`}>
                        {item.status || 'Active'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </SectionCard>
  );

  const renderAddBankAccount = () => (
    <div>
      <button
        type="button"
        onClick={() => setActiveTab('bank-accounts')}
        className="mb-3 inline-flex items-center gap-1 text-[14px] text-[#1F1F1F]"
      >
        <ChevronLeft className="h-4 w-4 text-[#8E8E93]" />
        Back to Bank Accounts
      </button>

      <div className="space-y-2">
        <SectionCard>
          <SectionHeader title={bankAccountMode === 'add' ? 'Add Bank Account' : bankAccountMode === 'edit' ? 'Edit Bank Account' : 'Bank Account Details'} />
          <div className="grid gap-3 p-4 sm:grid-cols-2">
            <div>
              <FieldLabel>Bank Name</FieldLabel>
              <TextInput
                placeholder="Enter bank name"
                disabled={bankAccountMode === 'view'}
                value={bankAdd.bank_name}
                onChange={(e) => {
                  setBankAdd(prev => ({ ...prev, bank_name: e.target.value }));
                  if (bankAddErrors.bank_name) setBankAddErrors(prev => { const n = { ...prev }; delete n.bank_name; return n; });
                }}
                className={bankAddErrors.bank_name ? '!border-[#E05252]' : ''}
              />
              {bankAddErrors.bank_name && <p className="mt-1 text-[10px] text-[#E05252]">{bankAddErrors.bank_name}</p>}
            </div>
            <div>
              <FieldLabel>Beneficiary Name</FieldLabel>
              <TextInput
                placeholder="Full name of account holder"
                value={bankAdd.beneficiary_name}
                disabled={bankAccountMode === 'view'}
                onChange={(e) => {
                  setBankAdd(prev => ({ ...prev, beneficiary_name: e.target.value }));
                  if (bankAddErrors.beneficiary_name) setBankAddErrors(prev => { const n = { ...prev }; delete n.beneficiary_name; return n; });
                }}
                className={bankAddErrors.beneficiary_name ? '!border-[#E05252]' : ''}
              />
              {bankAddErrors.beneficiary_name && <p className="mt-1 text-[10px] text-[#E05252]">{bankAddErrors.beneficiary_name}</p>}
            </div>

            <div>
              <FieldLabel>Account Number</FieldLabel>
              <TextInput
                placeholder="Enter account number"
                disabled={bankAccountMode === 'view'}
                value={bankAdd.account_number}
                onChange={(e) => {
                  setBankAdd(prev => ({ ...prev, account_number: e.target.value.replace(/\D/g, '') }));
                  if (bankAddErrors.account_number) setBankAddErrors(prev => { const n = { ...prev }; delete n.account_number; return n; });
                }}
                className={bankAddErrors.account_number ? '!border-[#E05252]' : ''}
              />
              {bankAddErrors.account_number && <p className="mt-1 text-[10px] text-[#E05252]">{bankAddErrors.account_number}</p>}
            </div>
            <div>
              <FieldLabel>Routing Number (ABA)</FieldLabel>
              <TextInput
                placeholder="Enter routing number"
                disabled={bankAccountMode === 'view'}
                value={bankAdd.routing_number}
                onChange={(e) => {
                  setBankAdd(prev => ({ ...prev, routing_number: e.target.value.replace(/\D/g, '').slice(0, 9) }));
                  if (bankAddErrors.routing_number) setBankAddErrors(prev => { const n = { ...prev }; delete n.routing_number; return n; });
                }}
                className={bankAddErrors.routing_number ? '!border-[#E05252]' : ''}
              />
              {bankAddErrors.routing_number && <p className="mt-1 text-[10px] text-[#E05252]">{bankAddErrors.routing_number}</p>}
            </div>
            <div>
              <FieldLabel>Bank Address</FieldLabel>
              <textarea
                placeholder="Enter bank branch address"
                disabled={bankAccountMode === 'view'}
                value={bankAdd.bank_address}
                onChange={(e) => {
                  setBankAdd(prev => ({ ...prev, bank_address: e.target.value }));
                  if (bankAddErrors.bank_address) setBankAddErrors(prev => { const n = { ...prev }; delete n.bank_address; return n; });
                }}
                className={`w-full rounded-[6px] border p-3 text-[12px] text-[#1F1F1F] outline-none placeholder:text-[#B1B3B8] focus:border-[#274583] min-h-[80px] ${bankAddErrors.bank_address ? 'border-[#E05252]' : 'border-[#E5E5EA]'}`}
              />
              {bankAddErrors.bank_address && <p className="mt-1 text-[10px] text-[#E05252]">{bankAddErrors.bank_address}</p>}
            </div>
            <div>
              <FieldLabel>Description <span className="text-[9px] text-[#A2A5AA]">(Optional)</span></FieldLabel>
              <textarea
                placeholder="For Further Credit To"
                disabled={bankAccountMode === 'view'}
                value={bankAdd.bank_description}
                onChange={(e) => {
                  setBankAdd(prev => ({ ...prev, bank_description: e.target.value }));
                  if (bankAddErrors.bank_description) setBankAddErrors(prev => { const n = { ...prev }; delete n.bank_description; return n; });
                }}
                className={`w-full rounded-[6px] border p-3 text-[12px] text-[#1F1F1F] outline-none placeholder:text-[#B1B3B8] focus:border-[#274583] min-h-[80px] ${bankAddErrors.bank_description ? 'border-[#E05252]' : 'border-[#E5E5EA]'}`}
              />
              {bankAddErrors.bank_description && <p className="mt-1 text-[10px] text-[#E05252]">{bankAddErrors.bank_description}</p>}
            </div>
          </div>
        </SectionCard>

        <div className="mt-4 flex items-center justify-end gap-2">
          {bankAccountMode === 'view' ? (
            <>
              <button
                type="button"
                onClick={() => {
                  setDeleteBankId(currentBankId);
                }}
                className="h-[32px] min-w-[90px] rounded-full bg-[#FFEAEA] px-5 text-[12px] text-[#E05252] hover:bg-[#FFD6D6] transition-colors"
              >
                Remove
              </button>
              <button
                type="button"
                onClick={() => setBankAccountMode('edit')}
                className="h-[32px] min-w-[90px] rounded-full bg-[#FFF3D6] px-5 text-[12px] text-[#B7791F] hover:bg-[#FFE7AF] transition-colors"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => {
                  setBankAdd(defaultBankAdd);
                  setBankAddErrors({});
                  setBankAccountMode('add');
                  setCurrentBankId(null);
                  setActiveTab('bank-accounts');
                }}
                className="h-[32px] min-w-[90px] rounded-full bg-[#F4F5F7] px-5 text-[12px] text-[#6A6A6A] hover:bg-[#E5E7EB] transition-colors"
              >
                Cancel
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => {
                  setBankAdd(defaultBankAdd);
                  setBankAddErrors({});
                  setBankAccountMode('add');
                  setCurrentBankId(null);
                  setActiveTab('bank-accounts');
                }}
                className="h-[32px] min-w-[90px] rounded-full bg-[#FFF3D6] px-5 text-[12px] text-[#6A6A6A]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={async () => {
                  const errors: Record<string, string> = {};
                  if (!bankAdd.bank_name.trim()) errors.bank_name = 'Bank name is required';

                  const accountRegex = /^\d{8,17}$/;
                  if (!bankAdd.account_number) {
                    errors.account_number = 'Account number is required';
                  } else if (!accountRegex.test(bankAdd.account_number)) {
                    errors.account_number = 'Must be between 8 and 17 digits';
                  }

                  const routingRegex = /^\d{9}$/;
                  if (!bankAdd.routing_number) {
                    errors.routing_number = 'Routing number is required';
                  } else if (!routingRegex.test(bankAdd.routing_number)) {
                    errors.routing_number = 'Routing number must be exactly 9 digits';
                  }

                  if (!bankAdd.bank_address.trim()) {
                    errors.bank_address = 'Bank address is required';
                  }

                  if (Object.keys(errors).length > 0) {
                    setBankAddErrors(errors);
                    toast({ title: 'Validation Error', description: 'Please fill in all required fields', variant: 'destructive' });
                    return;
                  }

                  setSaving(true);
                  try {
                    if (bankAccountMode === 'add') {
                      const newAccount = await apiClient.createBankAccount(bankAdd);
                      setBankAccounts(prev => [newAccount, ...prev]);
                      toast({ title: 'Success', description: 'Bank account added successfully', variant: 'success' });
                    } else if (bankAccountMode === 'edit' && currentBankId) {
                      const updatedAccount = await apiClient.updateBankAccount(currentBankId, bankAdd);
                      setBankAccounts(prev => prev.map(a => a.id === currentBankId ? updatedAccount : a));
                      toast({ title: 'Success', description: 'Bank account updated successfully', variant: 'success' });
                    }

                    setBankAdd(defaultBankAdd);
                    setBankAddErrors({});
                    setBankAccountMode('add');
                    setCurrentBankId(null);
                    setActiveTab('bank-accounts');
                  } catch (err: any) {
                    const errorMsg = err.message || 'Failed to save bank account';
                    console.error('❌ Bank account save error:', err);
                    toast({ title: 'Error', description: errorMsg, variant: 'destructive' });
                  } finally {
                    setSaving(false);
                  }
                }}
                className="h-[32px] min-w-[120px] rounded-full bg-[#FBCB4B] px-5 text-[12px] text-[#1F1F1F] disabled:opacity-50"
              >
                {saving ? (bankAccountMode === 'add' ? 'Adding...' : 'Updating...') : (bankAccountMode === 'add' ? 'Add Account' : 'Update Account')}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
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
            {tabs
              .filter((tab) => {
                if (tab.id === 'sub-accounts') {
                  const type = profile.investorType || user?.investorType || 'personal';
                  return type === 'personal';
                }
                return true;
              })
              .map((tab) => {
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
        {/* {activeTab === 'accounts' && renderAccountsTab()} */}
        {activeTab === 'bank-accounts' && renderBankAccountsTab()}
        {activeTab === 'sub-accounts' && (profile.investorType || user?.investorType || 'personal') === 'personal' && renderSubAccountsTab()}
        {activeTab === 'add-account' && renderAddAccount()}
        {activeTab === 'add-bank-account' && renderAddBankAccount()}
      </div>

      {deleteBankId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-[400px] rounded-[10px] bg-white p-6 shadow-xl">
            <h3 className="mb-2 text-[16px] font-bold text-[#1F1F1F]">Remove Bank Account</h3>
            <p className="mb-6 text-[14px] text-[#4B4B4B]">
              Are you sure you want to remove this bank account? This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                disabled={isDeletingBank}
                onClick={() => setDeleteBankId(null)}
                className="h-[36px] rounded-full bg-[#FFF3D6] px-5 text-[12px] font-medium text-[#4B4B4B] hover:bg-[#FCEBAE]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeletingBank}
                onClick={async () => {
                  setIsDeletingBank(true);
                  try {
                    await apiClient.deleteBankAccount(deleteBankId);
                    setBankAccounts(prev => prev.filter(a => a.id !== deleteBankId));
                    toast({ title: 'Deleted', description: 'Bank account removed successfully', variant: 'success' });
                    setDeleteBankId(null);
                    setActiveTab('bank-accounts');
                  } catch (err: any) {
                    toast({ title: 'Error', description: err.message || 'Failed to remove bank account', variant: 'destructive' });
                  } finally {
                    setIsDeletingBank(false);
                  }
                }}
                className="flex h-[36px] items-center justify-center gap-2 rounded-full bg-[#E05252] px-5 text-[12px] font-medium text-white hover:bg-[#C94A4A] disabled:opacity-70"
              >
                {isDeletingBank && <Loader2 className="h-4 w-4 animate-spin" />}
                Remove
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedSubaccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="relative w-full max-w-[650px] rounded-2xl bg-white shadow-2xl animate-in fade-in zoom-in duration-200">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#ECEDEF] px-6 py-4">
              <div>
                <h3 className="text-[16px] font-bold text-[#1F1F1F]">Sub Account Details</h3>
                <p className="text-[11px] text-[#8E8E93] mt-0.5 capitalize">
                  {selectedSubaccount.investorType} Account
                </p>
              </div>
              <button
                onClick={() => setSelectedSubaccount(null)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-50 text-gray-400 hover:bg-gray-100 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 max-h-[70vh] overflow-y-auto">
              <div className="grid gap-6">
                <div>
                  <h4 className="text-[13px] font-semibold text-[#1F1F1F] mb-3 pb-1 border-b border-[#ECEDEF]">
                    Basic Information
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    {selectedSubaccount.investorType === 'minor' ? (
                      <>
                        <div className="border-b border-[#F2F3F5] pb-2">
                          <p className="text-[10px] font-bold text-[#A2A5AA] uppercase tracking-wider">Full Name</p>
                          <p className="mt-1 text-[13px] font-medium text-[#1F1F1F]">{selectedSubaccount.fullName || '-'}</p>
                        </div>
                        <div className="border-b border-[#F2F3F5] pb-2">
                          <p className="text-[10px] font-bold text-[#A2A5AA] uppercase tracking-wider">Date of Birth</p>
                          <p className="mt-1 text-[13px] font-medium text-[#1F1F1F]">{formatDate(selectedSubaccount.dob)}</p>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="border-b border-[#F2F3F5] pb-2">
                          <p className="text-[10px] font-bold text-[#A2A5AA] uppercase tracking-wider">Legal Entity Name</p>
                          <p className="mt-1 text-[13px] font-medium text-[#1F1F1F]">{selectedSubaccount.entityName || '-'}</p>
                        </div>
                        <div className="border-b border-[#F2F3F5] pb-2">
                          <p className="text-[10px] font-bold text-[#A2A5AA] uppercase tracking-wider">Entity Type</p>
                          <p className="mt-1 text-[13px] font-medium text-[#1F1F1F]">{selectedSubaccount.entityType || '-'}</p>
                        </div>
                      </>
                    )}
                    <div className="border-b border-[#F2F3F5] pb-2">
                      <p className="text-[10px] font-bold text-[#A2A5AA] uppercase tracking-wider">Email Address</p>
                      <p className="mt-1 text-[13px] font-medium text-[#1F1F1F]">{selectedSubaccount.email || '-'}</p>
                    </div>
                    <div className="border-b border-[#F2F3F5] pb-2">
                      <p className="text-[10px] font-bold text-[#A2A5AA] uppercase tracking-wider">Phone Number</p>
                      <p className="mt-1 text-[13px] font-medium text-[#1F1F1F]">{selectedSubaccount.phone || '-'}</p>
                    </div>
                    <div className="border-b border-[#F2F3F5] pb-2 col-span-2">
                      <p className="text-[10px] font-bold text-[#A2A5AA] uppercase tracking-wider">
                        Tax ID ({selectedSubaccount.investorType === 'minor' ? 'SSN' : 'EIN'})
                      </p>
                      <p className="mt-1 text-[13px] font-medium text-[#1F1F1F]">
                        {formatTaxIdDisplay(selectedSubaccount.taxId, selectedSubaccount.investorType)}
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-[13px] font-semibold text-[#1F1F1F] mb-3 pb-1 border-b border-[#ECEDEF]">
                    Address Details
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="border-b border-[#F2F3F5] pb-2">
                      <p className="text-[10px] font-bold text-[#A2A5AA] uppercase tracking-wider">Street Address 1</p>
                      <p className="mt-1 text-[13px] font-medium text-[#1F1F1F]">{selectedSubaccount.addressLine1 || '-'}</p>
                    </div>
                    <div className="border-b border-[#F2F3F5] pb-2">
                      <p className="text-[10px] font-bold text-[#A2A5AA] uppercase tracking-wider">Street Address 2</p>
                      <p className="mt-1 text-[13px] font-medium text-[#1F1F1F]">{selectedSubaccount.addressLine2 || '-'}</p>
                    </div>
                    <div className="border-b border-[#F2F3F5] pb-2">
                      <p className="text-[10px] font-bold text-[#A2A5AA] uppercase tracking-wider">City</p>
                      <p className="mt-1 text-[13px] font-medium text-[#1F1F1F]">{selectedSubaccount.city || '-'}</p>
                    </div>
                    <div className="border-b border-[#F2F3F5] pb-2">
                      <p className="text-[10px] font-bold text-[#A2A5AA] uppercase tracking-wider">State / Province</p>
                      <p className="mt-1 text-[13px] font-medium text-[#1F1F1F]">{selectedSubaccount.state || '-'}</p>
                    </div>
                    <div className="border-b border-[#F2F3F5] pb-2">
                      <p className="text-[10px] font-bold text-[#A2A5AA] uppercase tracking-wider">ZIP / Postal Code</p>
                      <p className="mt-1 text-[13px] font-medium text-[#1F1F1F]">{selectedSubaccount.zipCode || '-'}</p>
                    </div>
                    <div className="border-b border-[#F2F3F5] pb-2">
                      <p className="text-[10px] font-bold text-[#A2A5AA] uppercase tracking-wider">Country</p>
                      <p className="mt-1 text-[13px] font-medium text-[#1F1F1F]">{selectedSubaccount.country || '-'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 border-t border-[#ECEDEF] px-6 py-4">
              {selectedSubaccount.investorType === 'minor' && (
                <button
                  onClick={() => handleOpenAddIraModal(selectedSubaccount)}
                  className="h-[36px] rounded-full bg-gradient-to-r from-[#FFC63F] to-[#F1DD58] px-5 text-[12px] font-semibold text-[#1F1F1F] shadow-sm hover:opacity-90 transition-opacity"
                >
                  Create IRA
                </button>
              )}
              <button
                onClick={() => setSelectedSubaccount(null)}
                className="h-[36px] rounded-full bg-[#FFF3D6] px-6 text-[12px] font-semibold text-[#4B4B4B] hover:bg-[#FCEBAE] transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── ADD IRA MODAL ─── */}
      {showAddIraModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-[10px] bg-white shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-white px-8 py-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#FFF8E1]">
                  <Plus className="h-5 w-5 text-[#D1A94C]" />
                </div>
                <h2 className="text-[18px] md:text-[22px] font-bold text-[#1F1F1F] font-goudy">Open New IRA Account for Minor</h2>
              </div>
              <button
                onClick={() => setShowAddIraModal(false)}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-[#FAFAFA] text-[#9CA3AF] hover:bg-[#F3F4F6] transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-8">
              <div className="flex flex-col gap-8">
                {/* Account Details */}
                <div>
                  <h3 className="text-[14px] font-semibold text-[#1F1F1F] mb-4 font-goudy border-b pb-1">Account Details</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="block text-[12px] font-medium text-[#6B7280] mb-1 font-helvetica">Account Type</label>
                      <Combobox
                        options={accountTypes.map(t => ({ label: t.name, value: t.name }))}
                        value={iraForm.accountType}
                        onChange={val => setIraForm({ ...iraForm, accountType: val })}
                        placeholder="Select Account Type"
                      />
                      {iraErrors.accountType && <p className="mt-1 text-[11px] text-red-500">{iraErrors.accountType}</p>}
                    </div>
                  </div>
                </div>

                {/* Personal Profile */}
                <div>
                  <h3 className="text-[14px] font-semibold text-[#1F1F1F] mb-4 font-goudy border-b pb-1">Personal Profile</h3>
                  <div className="grid gap-4 md:grid-cols-2 mb-4">
                    <div>
                      <label className="block text-[12px] font-medium text-[#6B7280] mb-1 font-helvetica">First Name (from subaccount)</label>
                      <input
                        type="text"
                        value={selectedSubaccount?.fullName?.trim().split(/\s+/)[0] || ''}
                        disabled
                        className="w-full h-[40px] rounded-[8px] border border-[#E5E7EB] px-4 text-[13px] font-helvetica bg-[#F3F4F6] text-[#9CA3AF]"
                      />
                    </div>
                    <div>
                      <label className="block text-[12px] font-medium text-[#6B7280] mb-1 font-helvetica">Last Name (from subaccount)</label>
                      <input
                        type="text"
                        value={selectedSubaccount?.fullName?.trim().split(/\s+/).slice(1).join(' ') || ''}
                        disabled
                        className="w-full h-[40px] rounded-[8px] border border-[#E5E7EB] px-4 text-[13px] font-helvetica bg-[#F3F4F6] text-[#9CA3AF]"
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2 mb-4">
                    <div>
                      <label className="block text-[12px] font-medium text-[#6B7280] mb-1 font-helvetica">Middle Name</label>
                      <input
                        type="text"
                        placeholder="Enter middle name"
                        value={iraForm.middleName}
                        onChange={e => setIraForm({ ...iraForm, middleName: e.target.value })}
                        className="w-full h-[40px] rounded-[8px] border border-[#E5E7EB] px-4 text-[13px] font-helvetica outline-none focus:border-[#D1A94C] bg-white transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-[12px] font-medium text-[#6B7280] mb-1 font-helvetica">Suffix</label>
                      <input
                        type="text"
                        placeholder="e.g. Jr, Sr"
                        value={iraForm.suffix}
                        onChange={e => setIraForm({ ...iraForm, suffix: e.target.value })}
                        className="w-full h-[40px] rounded-[8px] border border-[#E5E7EB] px-4 text-[13px] font-helvetica outline-none focus:border-[#D1A94C] bg-white transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="block text-[12px] font-medium text-[#6B7280] mb-1 font-helvetica">Marital Status</label>
                      <select
                        value={iraForm.maritalStatus}
                        disabled={selectedSubaccount?.investorType === 'minor'}
                        onChange={e => setIraForm({ ...iraForm, maritalStatus: e.target.value })}
                        className="w-full h-[40px] rounded-[8px] border border-[#E5E7EB] px-4 text-[13px] font-helvetica outline-none focus:border-[#D1A94C] bg-white transition-all disabled:bg-gray-100 disabled:text-gray-500"
                      >
                        <option value="single">Single</option>
                        <option value="married">Married</option>
                        <option value="divorced">Divorced</option>
                        <option value="widowed">Widowed</option>
                      </select>
                      {iraErrors.maritalStatus && <p className="mt-1 text-[11px] text-red-500">{iraErrors.maritalStatus}</p>}
                    </div>

                    <div>
                      <label className="block text-[12px] font-medium text-[#6B7280] mb-1 font-helvetica">Social Security Number</label>
                      <input
                        type="text"
                        placeholder="000-00-0000"
                        maxLength={11}
                        value={iraForm.ssn}
                        onChange={e => {
                          let val = e.target.value.replace(/\D/g, '');
                          if (val.length > 9) val = val.slice(0, 9);
                          let formatted = val;
                          if (val.length > 3 && val.length <= 5) {
                            formatted = `${val.slice(0, 3)}-${val.slice(3)}`;
                          } else if (val.length > 5) {
                            formatted = `${val.slice(0, 3)}-${val.slice(3, 5)}-${val.slice(5)}`;
                          }
                          setIraForm({ ...iraForm, ssn: formatted });
                        }}
                        className="w-full h-[40px] rounded-[8px] border border-[#E5E7EB] px-4 text-[13px] font-helvetica outline-none focus:border-[#D1A94C] bg-white transition-all"
                      />
                      {iraErrors.ssn && <p className="mt-1 text-[11px] text-red-500">{iraErrors.ssn}</p>}
                    </div>
                  </div>
                </div>

                {/* Mailing Address */}
                <div>
                  <div className="flex items-center justify-between mb-4 border-b pb-1">
                    <h3 className="text-[14px] font-semibold text-[#1F1F1F] font-goudy">Mailing Address</h3>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="mailingAddressSame"
                        checked={iraForm.mailingAddressSame}
                        onChange={e => setIraForm({ ...iraForm, mailingAddressSame: e.target.checked })}
                        className="rounded border-[#E5E7EB] text-[#D1A94C] focus:ring-[#D1A94C]"
                      />
                      <label htmlFor="mailingAddressSame" className="text-[12px] font-medium text-[#4B4B4B] font-helvetica">
                        Same as physical address
                      </label>
                    </div>
                  </div>

                  {!iraForm.mailingAddressSame && (
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="col-span-2">
                        <label className="block text-[12px] font-medium text-[#6B7280] mb-1 font-helvetica">Street Address 1</label>
                        <input
                          type="text"
                          placeholder="Street Address Line 1"
                          value={iraForm.mailingAddress1}
                          onChange={e => setIraForm({ ...iraForm, mailingAddress1: e.target.value })}
                          className="w-full h-[40px] rounded-[8px] border border-[#E5E7EB] px-4 text-[13px] font-helvetica outline-none focus:border-[#D1A94C] bg-white"
                        />
                        {iraErrors.mailingAddress1 && <p className="mt-1 text-[11px] text-red-500">{iraErrors.mailingAddress1}</p>}
                      </div>

                      <div className="col-span-2">
                        <label className="block text-[12px] font-medium text-[#6B7280] mb-1 font-helvetica">Street Address 2</label>
                        <input
                          type="text"
                          placeholder="Apartment, suite, unit, etc. (optional)"
                          value={iraForm.mailingAddress2}
                          onChange={e => setIraForm({ ...iraForm, mailingAddress2: e.target.value })}
                          className="w-full h-[40px] rounded-[8px] border border-[#E5E7EB] px-4 text-[13px] font-helvetica outline-none focus:border-[#D1A94C] bg-white"
                        />
                      </div>

                      <div>
                        <label className="block text-[12px] font-medium text-[#6B7280] mb-1 font-helvetica">Country</label>
                        <Combobox
                          options={countries.map(c => ({ label: c.name, value: c.isoCode }))}
                          value={iraForm.mailingCountry}
                          onChange={val => setIraForm({ ...iraForm, mailingCountry: val, mailingState: '', mailingCity: '' })}
                          placeholder="Select Country"
                        />
                        {iraErrors.mailingCountry && <p className="mt-1 text-[11px] text-red-500">{iraErrors.mailingCountry}</p>}
                      </div>

                      <div>
                        <label className="block text-[12px] font-medium text-[#6B7280] mb-1 font-helvetica">State / Province</label>
                        <Combobox
                          options={iraStates.map(s => ({ label: s.name, value: s.isoCode }))}
                          value={iraForm.mailingState}
                          onChange={val => setIraForm({ ...iraForm, mailingState: val, mailingCity: '' })}
                          placeholder="Select State"
                          disabled={!iraForm.mailingCountry}
                        />
                        {iraErrors.mailingState && <p className="mt-1 text-[11px] text-red-500">{iraErrors.mailingState}</p>}
                      </div>

                      <div>
                        <label className="block text-[12px] font-medium text-[#6B7280] mb-1 font-helvetica">City</label>
                        <input
                          type="text"
                          placeholder="City"
                          value={iraForm.mailingCity}
                          onChange={e => setIraForm({ ...iraForm, mailingCity: e.target.value })}
                          className="w-full h-[40px] rounded-[8px] border border-[#E5E7EB] px-4 text-[13px] font-helvetica outline-none focus:border-[#D1A94C] bg-white"
                        />
                        {iraErrors.mailingCity && <p className="mt-1 text-[11px] text-red-500">{iraErrors.mailingCity}</p>}
                      </div>

                      <div>
                        <label className="block text-[12px] font-medium text-[#6B7280] mb-1 font-helvetica">ZIP / Postal Code</label>
                        <input
                          type="text"
                          placeholder="ZIP Code"
                          value={iraForm.mailingZipCode}
                          onChange={e => setIraForm({ ...iraForm, mailingZipCode: e.target.value })}
                          className="w-full h-[40px] rounded-[8px] border border-[#E5E7EB] px-4 text-[13px] font-helvetica outline-none focus:border-[#D1A94C] bg-white"
                        />
                        {iraErrors.mailingZipCode && <p className="mt-1 text-[11px] text-red-500">{iraErrors.mailingZipCode}</p>}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex justify-end gap-3 mt-8 border-t pt-5">
                <button
                  onClick={() => setShowAddIraModal(false)}
                  className="px-6 h-[40px] rounded-full border border-gray-300 text-[13px] font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveIRA}
                  disabled={iraLoading}
                  className="px-6 h-[40px] rounded-full bg-gradient-to-r from-[#FFC63F] to-[#F1DD58] text-[13px] font-semibold text-[#1F1F1F] shadow-md hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center justify-center gap-2"
                >
                  {iraLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                  Create IRA
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
