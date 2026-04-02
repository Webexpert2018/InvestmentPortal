'use client';

import { useState, useEffect } from 'react';
import { useToast, toast as globalToast } from '@/hooks/use-toast';
import { DashboardLayout } from '@/components/DashboardLayout';
import { useAuth } from '@/lib/contexts/AuthContext';
import { apiClient } from '@/lib/api/client';
import { Country, State, City } from 'country-state-city';
import { Combobox } from '@/components/ui/combobox';
import { Check, ChevronDown, Shield, Smartphone, QrCode, Phone, MapPin, User, FileText, Lock, Plus, X, Loader2, Info, Wallet, Sparkles, Building2, ShieldCheck, History } from 'lucide-react';

/* ═══════════════════════════════════════════════════════
   DUMMY INVESTOR DATA  (all fields from signup steps)
   ═══════════════════════════════════════════════════════ */




/* ═══════════════════════════════════════════════════════
   FIELD DISPLAY COMPONENT
   ═══════════════════════════════════════════════════════ */
function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[12px] font-medium text-[#6B7280] mb-1 font-helvetica">{label}</p>
      <p className="text-[14px] text-[#1F1F1F] font-helvetica">{value}</p>
    </div>
  );
}

function MaskedField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[12px] font-medium text-[#6B7280] mb-1 font-helvetica">{label}</p>
      <p className="text-[14px] tracking-[3px] text-[#1F1F1F] font-helvetica">{value}</p>
    </div>
  );
}

function StatusBadge({ verified, label }: { verified: boolean; label: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-medium font-helvetica ${verified ? 'bg-[#ECFDF5] text-[#16A66A]' : 'bg-[#FEF3C7] text-[#D97706]'
        }`}
    >
      {verified && <Check className="h-3 w-3" />}
      {label}
    </span>
  );
}

/* ═══════════════════════════════════════════════════════
   PAGE
   ═══════════════════════════════════════════════════════ */
export default function IRAPage() {
  const { user } = useAuth();
  const [iraAccount, setIraAccount] = useState<any>(null);
  const [fetchingIra, setFetchingIra] = useState(true);
  const [loading, setLoading] = useState(false);
  const [accountTypes, setAccountTypes] = useState<any[]>([]);

  const phoneComplete = user?.phone || '';
  const phoneParts = phoneComplete.match(/^(\+\d+\s*\([^)]+\))\s*(.*)$/); // basic country code grab
  const phoneCountry = phoneParts ? phoneParts[1] : '';
  const phoneNumberOnly = phoneParts ? phoneParts[2] : phoneComplete;

  useEffect(() => {
    fetchIraAccount();
    fetchAccountTypes();
  }, []);

  const fetchAccountTypes = async () => {
    try {
      const data = await apiClient.getIraAccountTypes();
      setAccountTypes(data);
    } catch (error) {
      console.error('Failed to fetch account types:', error);
    }
  };

  const fetchIraAccount = async () => {
    try {
      const data = await apiClient.getMyIRAAccount();
      setIraAccount(data);
    } catch (error) {
      console.error('Failed to fetch IRA account:', error);
    } finally {
      setFetchingIra(false);
    }
  };

  const d = {
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phoneCountryCode: phoneCountry,
    phoneNumber: phoneNumberOnly,
    dob: user?.dob ? new Date(user.dob).toLocaleDateString() : '',
    addressLine1: user?.addressLine1 || '',
    addressLine2: user?.addressLine2 || '',
    city: user?.city || '',
    state: user?.state || '',
    zipCode: user?.zipCode || '',
    country: user?.country || '',
    taxId: user?.taxId || '',

    // Status placeholders / hardcoded fallbacks that weren't in user model
    phoneVerified: !!user?.phone,
    phoneVerifiedAt: user?.phone ? 'Verified' : '-',
    taxEncrypted: true,
    twoFactorEnabled: false,
    twoFactorMethod: 'Pending setup',
    twoFactorSetupDate: 'Pending',

    // IRA Info from fetched data
    accountType: iraAccount?.account_type || '-',
    accountNumber: iraAccount?.account_number || '-',
    accountStatus: user?.status ? (user.status.charAt(0).toUpperCase() + user.status.slice(1)) : '-',
    accountOpenDate: user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : '-',
    accountUpdatedDate: iraAccount?.updated_at ? new Date(iraAccount.updated_at).toLocaleDateString() : '-',
    custodian: iraAccount?.custodian_name || '-',
    beneficiary: iraAccount?.beneficiary || '-',
    contributionYTD: '$0.00',
    contributionLimit: '$7,000.00',
    accountBalance: '$0.00',
    fullAccountHolderName: [user?.firstName, iraAccount?.middle_name, user?.lastName, iraAccount?.suffix].filter(Boolean).join(' ') || '-',

    // New IRA Fields
    middleName: iraAccount?.middle_name || '-',
    suffix: iraAccount?.suffix || '-',
    maritalStatus: iraAccount?.marital_status || '-',
    mailingAddressSame: iraAccount?.mailing_address_same !== false ? 'Yes' : 'No',
    mailingAddress1: iraAccount?.mailing_address_same !== false ? (user?.addressLine1 || '-') : (iraAccount?.mailing_address_1 || '-'),
    mailingAddress2: iraAccount?.mailing_address_same !== false ? (user?.addressLine2 || '-') : (iraAccount?.mailing_address_2 || '-'),
    mailingCity: iraAccount?.mailing_address_same !== false ? (user?.city || '-') : (iraAccount?.mailing_city || '-'),
    mailingState: iraAccount?.mailing_address_same !== false ? (user?.state || '-') : (iraAccount?.mailing_state || '-'),
    mailingZipCode: iraAccount?.mailing_address_same !== false ? (user?.zipCode || '-') : (iraAccount?.mailing_zip_code || '-'),
    mailingCountry: iraAccount?.mailing_address_same !== false ? (user?.country || '-') : (iraAccount?.mailing_country || iraAccount?.mailing_country_name || '-'),
    username: iraAccount?.username || '-',
    referralSource: iraAccount?.referral_source || '-',

    // Completion Status
    profileCompleted: !!(user?.firstName && user?.lastName && user?.email && user?.phone && user?.dob),
    addressCompleted: !!(user?.addressLine1 && user?.city && user?.state && user?.zipCode && user?.country),
    taxCompleted: !!user?.taxId,
  };

  const { toast } = useToast();
  const [showAddModal, setShowAddModal] = useState(false);
  const [iraForm, setIraForm] = useState({
    accountType: 'Traditional',
    accountNumber: '',
    custodian: '',
    beneficiary: '',
    accountHolderName: user ? `${user.firstName} ${user.lastName}` : '',
    ssn: '',
    // New fields
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
    username: user ? `${user.firstName.toLowerCase()}_${Math.floor(100 + Math.random() * 900)}` : '',
    referralSource: '',
  });

  useEffect(() => {
    if (iraForm.mailingAddressSame && user) {
      setIraForm(prev => ({
        ...prev,
        mailingAddress1: user.addressLine1 || '',
        mailingAddress2: user.addressLine2 || '',
        mailingCity: user.city || '',
        mailingState: user.state || '',
        mailingZipCode: user.zipCode || '',
        mailingCountry: user.country || '',
      }));
    }
  }, [iraForm.mailingAddressSame, user]);

  const [errors, setErrors] = useState<{ [k: string]: string }>({});

  const validate = () => {
    const e: { [k: string]: string } = {};
    if (!iraForm.accountType.trim()) e.accountType = 'Please enter account type.';
    if (!iraForm.accountNumber.trim()) e.accountNumber = 'Please enter account number.';
    if (!iraForm.custodian.trim()) e.custodian = 'Please enter custodian name.';
    if (!iraForm.beneficiary.trim()) e.beneficiary = 'Please enter beneficiary name.';
    if (!iraForm.accountHolderName.trim()) e.accountHolderName = 'Please enter account holder name.';
    if (!iraForm.maritalStatus) e.maritalStatus = 'Please select marital status.';
    if (!iraForm.username.trim()) e.username = 'Please enter username.';

    if (!iraForm.mailingAddressSame) {
      if (!iraForm.mailingAddress1?.trim()) e.mailingAddress1 = 'Please enter mailing address.';
      if (!iraForm.mailingCity?.trim()) e.mailingCity = 'Please enter city.';
      if (!iraForm.mailingState?.trim()) e.mailingState = 'Please select state.';
      if (!iraForm.mailingCountry?.trim()) e.mailingCountry = 'Please select country.';
      if (!iraForm.mailingZipCode?.trim()) e.mailingZipCode = 'Please enter zip code.';
    }

    // simple SSN validation: allow 9 digits or formatted 123-45-6789
    const ssnDigits = iraForm.ssn.replace(/[^0-9]/g, '');
    if (!iraForm.ssn.trim()) e.ssn = 'Please enter Social Security Number.';
    else if (!(ssnDigits.length === 9)) e.ssn = 'SSN must contain 9 digits.';

    setErrors(e);
    if (Object.keys(e).length > 0) {
      console.log('Validation errors:', e);
      globalToast({
        title: 'Validation failed',
        description: 'Missing or invalid fields: ' + Object.keys(e).join(', '),
        variant: 'destructive',
      });
      // Scroll to top of modal to show errors
      const modalContent = document.querySelector('.overflow-y-auto');
      if (modalContent) modalContent.scrollTo({ top: 0, behavior: 'smooth' });
    }
    return Object.keys(e).length === 0;
  };

  const handleSaveIRA = async () => {
    console.log('Save button clicked. Current form state:', iraForm);
    if (!validate()) {
      return;
    }

    setLoading(true);
    try {
      console.log('Sending request to API...');
      const response = await apiClient.createIRAAccount({
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
        username: iraForm.username,
        referralSource: iraForm.referralSource,
        // Send user profile data
        firstName: user?.firstName,
        lastName: user?.lastName,
        email: user?.email,
        dob: user?.dob,
        phone: user?.phone,
        taxId: user?.taxId,
        physicalAddress1: user?.addressLine1,
        physicalAddress2: user?.addressLine2,
        city: user?.city,
        state: user?.state,
        zipCode: user?.zipCode,
        country: user?.country,
      });
      console.log('API Response:', response);

      toast({ title: 'IRA saved', description: 'All IRA account values saved successfully.' });
      globalToast({ title: 'IRA saved', description: 'All IRA account values saved successfully.' });

      await fetchIraAccount();
      setShowAddModal(false);
      setIraForm({
        accountType: '', accountNumber: '', custodian: '', beneficiary: '', accountHolderName: user ? `${user.firstName} ${user.lastName}` : '', ssn: '',
        middleName: '', suffix: '', maritalStatus: '', mailingAddressSame: true,
        mailingAddress1: '', mailingAddress2: '', mailingCity: '', mailingState: '', mailingZipCode: '', mailingCountry: '',
        username: '', referralSource: ''
      });
      setErrors({});
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error?.message || 'Failed to save IRA account',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="mx-auto w-full max-w-8xl font-helvetica">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-goudy text-[22px] md:text-[26px] font-bold text-[#1F1F1F]">IRA</h1>
            <p className="mt-1 text-[13px] text-[#8E8E93] font-helvetica">
              Manage your IRA-related investments and account information here.
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-[#FFC63F] to-[#F1DD58] px-5 py-2 rounded-full text-sm font-medium shadow-md"
          >
            <Plus className="h-4 w-4" />
            Add IRA Account
          </button>
        </div>

        {/* Main Card */}
        <div className="mt-4 rounded-sm border border-[#F0F0F0] bg-white shadow-sm">

          {/* ─────── SECTION 1: IRA Account Overview ─────── */}
          <div className="p-6">
            <div className="flex items-center gap-2 mb-5">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#FFF8E1]">
                <FileText className="h-3.5 w-3.5 text-[#D1A94C]" />
              </div>
              <h3 className="text-[16px] font-semibold text-[#1F1F1F] font-goudy">IRA Account Overview</h3>
            </div>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              <Field label="Account Type" value={d.accountType} />
              <Field label="Account Number" value={d.accountNumber} />
              <Field label="Account Holder Name" value={d.fullAccountHolderName} />
              <Field label="Custodian" value={d.custodian} />
              <Field label="Beneficiary" value={d.beneficiary} />
              <Field label="Contribution (YTD)" value={d.contributionYTD} />
              <Field label="Annual Contribution Limit" value={d.contributionLimit} />
              <Field label="Account Balance" value={d.accountBalance} />
              <Field label="Marital Status" value={d.maritalStatus} />
              <Field label="Username" value={d.username} />
              <Field label="How did you hear about us?" value={d.referralSource} />
            </div>
          </div>

          <div className="mx-6 sm:mx-8 border-t border-[#ECEDEF]" />

          {/* ─────── SECTION 2: Profile Information (Step 1) ─────── */}
          <div className="p-6">
            <div className="flex items-center gap-2 mb-5">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#FFF8E1]">
                <User className="h-3.5 w-3.5 text-[#D1A94C]" />
              </div>
              <h3 className="text-[16px] font-semibold text-[#1F1F1F] font-goudy">Profile Information</h3>
              <StatusBadge verified={d.profileCompleted} label={d.profileCompleted ? "Completed" : "Pending"} />
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="First Name" value={d.firstName} />
              <Field label="Middle Name" value={d.middleName} />
              <Field label="Last Name" value={d.lastName} />
              <Field label="Suffix" value={d.suffix} />
              <Field label="Email" value={d.email} />
              <div>
                <p className="text-[12px] font-medium text-[#6B7280] mb-[6px] font-helvetica">Phone Number</p>
                <div className="flex gap-2">
                  <div className="h-[42px] w-[120px] shrink-0 flex items-center rounded-[8px] border border-[#E5E7EB] bg-[#FAFAFA] px-3">
                    <span className="text-[13px] text-[#374151] font-helvetica">{d.phoneCountryCode}</span>
                  </div>
                  <div className="h-[42px] w-[240px] flex items-center rounded-[8px] border border-[#E5E7EB] bg-[#FAFAFA] px-4">
                    <span className="text-[13px] text-[#1F1F1F] font-helvetica">{d.phoneNumber}</span>
                  </div>
                </div>
              </div>
              <Field label="Date of Birth" value={d.dob} />
            </div>
          </div>

          <div className="mx-6 sm:mx-8 border-t border-[#ECEDEF]" />

          {/* ─────── SECTION 3: Address (Step 2) ─────── */}
          <div className="p-6">
            <div className="flex items-center gap-2 mb-5">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#FFF8E1]">
                <MapPin className="h-3.5 w-3.5 text-[#D1A94C]" />
              </div>
              <h3 className="text-[16px] font-semibold text-[#1F1F1F] font-goudy">Address</h3>
              <StatusBadge verified={d.addressCompleted} label={d.addressCompleted ? "Completed" : "Pending"} />
            </div>

            <div className="flex flex-col gap-8">
              <div className="space-y-5">
                <h4 className="text-[14px] font-semibold text-[#1F1F1F] font-goudy underline decoration-[#FFC63F] underline-offset-4">Physical Address</h4>
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="Street Address Line 1" value={d.addressLine1} />
                  <Field label="Street Address Line 2" value={d.addressLine2} />
                  <Field label="Country" value={d.country} />
                  <Field label="State" value={d.state} />
                  <Field label="City" value={d.city} />
                  <Field label="ZIP Code" value={d.zipCode} />
                </div>
              </div>

              <div className="border-t border-dashed border-[#ECEDEF]" />

              <div className="space-y-5">
                <h4 className="text-[14px] font-semibold text-[#1F1F1F] font-goudy underline decoration-[#FFC63F] underline-offset-4">Mailing Address</h4>
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-3">
                    <p className="text-[12px] font-medium text-[#6B7280] font-helvetica">Mailing same as Physical:</p>
                    <div className="flex gap-2">
                      <span className={`px-3 py-0.5 rounded-full text-[12px] font-medium ${d.mailingAddressSame === 'Yes' ? 'bg-[#ECFDF5] text-[#16A66A]' : 'bg-[#F3F4F6] text-[#6B7280]'}`}>
                        Yes
                      </span>
                      <span className={`px-3 py-0.5 rounded-full text-[12px] font-medium ${d.mailingAddressSame === 'No' ? 'bg-[#FEF2F2] text-[#EF4444]' : 'bg-[#F3F4F6] text-[#6B7280]'}`}>
                        No
                      </span>
                    </div>
                  </div>

                </div>
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="Street Address Line 1" value={d.mailingAddress1} />
                  <Field label="Street Address Line 2" value={d.mailingAddress2} />
                  <Field label="Country" value={d.mailingCountry} />
                  <Field label="State" value={d.mailingState} />
                  <Field label="City" value={d.mailingCity} />
                  <Field label="ZIP Code" value={d.mailingZipCode} />
                </div>
              </div>
            </div>
          </div>

          <div className="mx-6 sm:mx-8 border-t border-[#ECEDEF]" />

          {/* ─────── SECTION 4: Phone Verification (Step 3) ─────── */}
          <div className="p-6">
            <div className="flex items-center gap-2 mb-5">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#FFF8E1]">
                <Phone className="h-3.5 w-3.5 text-[#D1A94C]" />
              </div>
              <h3 className="text-[16px] font-semibold text-[#1F1F1F] font-goudy">Phone Verification</h3>
              <StatusBadge verified={d.phoneVerified} label={d.phoneVerified ? 'Verified' : 'Pending'} />
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <p className="text-[12px] font-medium text-[#6B7280] mb-1 font-helvetica">Phone Number</p>
                <p className="text-[14px] text-[#1F1F1F] font-helvetica">{d.phoneCountryCode} {d.phoneNumber}</p>
              </div>
              <Field label="Verified On" value={d.phoneVerifiedAt} />
            </div>
          </div>

          <div className="mx-6 sm:mx-8 border-t border-[#ECEDEF]" />

          {/* ─────── SECTION 5: TAX Information (Step 4) ─────── */}
          <div className="p-6">
            <div className="flex items-center gap-2 mb-5">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#FFF8E1]">
                <FileText className="h-3.5 w-3.5 text-[#D1A94C]" />
              </div>
              <h3 className="text-[16px] font-semibold text-[#1F1F1F] font-goudy">TAX Information</h3>
              <StatusBadge verified={d.taxCompleted} label={d.taxCompleted ? "Completed" : "Pending"} />
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <MaskedField label="Social Security Number / Tax ID" value={d.taxId} />
              <div>
                <p className="text-[12px] font-medium text-[#6B7280] mb-1 font-helvetica">Encryption Status</p>
                <div className="flex items-center gap-2 mt-1">
                  <Lock className="h-3.5 w-3.5 text-[#16A66A]" />
                  <span className="text-[13px] text-[#16A66A] font-medium font-helvetica">Your information is encrypted and secure</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mx-6 sm:mx-8 border-t border-[#ECEDEF]" />

          {/* ─────── SECTION 6: Two-Factor Authentication (Step 5) ─────── */}
          <div className="p-6">
            <div className="flex items-center gap-2 mb-5">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#FFF8E1]">
                <Shield className="h-3.5 w-3.5 text-[#D1A94C]" />
              </div>
              <h3 className="text-[16px] font-semibold text-[#1F1F1F] font-goudy">Two-Factor Authentication</h3>
              <StatusBadge verified={d.twoFactorEnabled} label={d.twoFactorEnabled ? 'Enabled' : 'Disabled'} />
            </div>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              <Field label="Authentication Method" value={d.twoFactorMethod} />
              <Field label="Setup Date" value={d.twoFactorSetupDate} />
              <div>
                <p className="text-[12px] font-medium text-[#6B7280] mb-1 font-helvetica">Status</p>
                <div className="flex items-center gap-2 mt-1">
                  <Smartphone className="h-4 w-4 text-[#16A66A]" />
                  <span className="text-[13px] text-[#1F1F1F] font-helvetica">Authenticator app connected</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ─────── ADD IRA ACCOUNT POPUP ─────── */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="relative w-[94%] max-w-3xl rounded-sm bg-white shadow-xl">
              {/* Header */}
              <div className="flex items-center justify-between px-6 pt-6 pb-4">
                <h2 className="font-goudy text-[20px] font-bold text-[#1F1F1F]">Add IRA Account</h2>
                <button onClick={() => setShowAddModal(false)} className="text-[#6B7280] hover:text-[#1F1F1F] transition">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="border-t border-[#ECEDEF]" />

              {/* Form */}
              <div className="px-6 py-5 max-h-[70vh] overflow-y-auto space-y-6">
                {/* ─── Account Details ─── */}
                <div>
                  <h3 className="text-[14px] font-semibold text-[#1F1F1F] mb-3 font-goudy border-b pb-1">Account Details</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="block text-[12px] font-medium text-[#6B7280] mb-1 font-helvetica">Account Type</label>
                      <select
                        value={iraForm.accountType}
                        onChange={e => setIraForm({ ...iraForm, accountType: e.target.value })}
                        className={`w-full h-[40px] rounded-[8px] border px-4 text-[13px] font-helvetica outline-none transition bg-[#FAFAFA] ${errors.accountType ? 'border-red-500' : 'border-[#E5E7EB] focus:border-[#D1A94C]'}`}
                      >
                        <option value="">Select account type</option>
                        {accountTypes.map((type) => (
                          <option key={type.id} value={type.name}>
                            {type.name}
                          </option>
                        ))}
                      </select>
                      {errors.accountType && <p className="mt-1 text-[11px] text-red-600">{errors.accountType}</p>}
                    </div>

                    <div>
                      <label className="block text-[12px] font-medium text-[#6B7280] mb-1 font-helvetica">Account Number</label>
                      <input
                        type="text"
                        placeholder="Enter account number"
                        value={iraForm.accountNumber}
                        onChange={e => setIraForm({ ...iraForm, accountNumber: e.target.value })}
                        className={`w-full h-[40px] rounded-[8px] border px-4 text-[13px] font-helvetica outline-none transition bg-[#FAFAFA] ${errors.accountNumber ? 'border-red-500' : 'border-[#E5E7EB] focus:border-[#D1A94C]'}`}
                      />
                      {errors.accountNumber && <p className="mt-1 text-[11px] text-red-600">{errors.accountNumber}</p>}
                    </div>
                  </div>
                </div>

                {/* ─── Personal Profile ─── */}
                <div>
                  <h3 className="text-[14px] font-semibold text-[#1F1F1F] mb-3 font-goudy border-b pb-1">Personal Profile</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="block text-[12px] font-medium text-[#6B7280] mb-1 font-helvetica">First Name (from user)</label>
                      <input
                        type="text"
                        disabled
                        value={user?.firstName || ''}
                        className="w-full h-[40px] rounded-[8px] border border-[#E5E7EB] px-4 text-[13px] font-helvetica bg-[#F3F4F6] text-[#9CA3AF] cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label className="block text-[12px] font-medium text-[#6B7280] mb-1 font-helvetica">Last Name (from user)</label>
                      <input
                        type="text"
                        disabled
                        value={user?.lastName || ''}
                        className="w-full h-[40px] rounded-[8px] border border-[#E5E7EB] px-4 text-[13px] font-helvetica bg-[#F3F4F6] text-[#9CA3AF] cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label className="block text-[12px] font-medium text-[#6B7280] mb-1 font-helvetica">Middle Name</label>
                      <input
                        type="text"
                        placeholder="Enter middle name"
                        value={iraForm.middleName}
                        onChange={e => setIraForm({ ...iraForm, middleName: e.target.value })}
                        className="w-full h-[40px] rounded-[8px] border border-[#E5E7EB] px-4 text-[13px] font-helvetica outline-none focus:border-[#D1A94C] bg-[#FAFAFA]"
                      />
                    </div>
                    <div>
                      <label className="block text-[12px] font-medium text-[#6B7280] mb-1 font-helvetica">Suffix</label>
                      <input
                        type="text"
                        placeholder="e.g. Jr, Sr"
                        value={iraForm.suffix}
                        onChange={e => setIraForm({ ...iraForm, suffix: e.target.value })}
                        className="w-full h-[40px] rounded-[8px] border border-[#E5E7EB] px-4 text-[13px] font-helvetica outline-none focus:border-[#D1A94C] bg-[#FAFAFA]"
                      />
                    </div>
                  </div>

                  <div className="mt-4">
                    <label className="block text-[12px] font-medium text-[#6B7280] mb-2 font-helvetica">Marital Status</label>
                    <div className="flex gap-6">
                      <label className="flex items-center gap-2 cursor-pointer group">
                        <div className={`flex h-4 w-4 items-center justify-center rounded-full border ${iraForm.maritalStatus === 'single' ? 'border-[#D1A94C] bg-[#D1A94C]' : 'border-[#E5E7EB] bg-white'} transition`}>
                          {iraForm.maritalStatus === 'single' && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                        </div>
                        <input type="radio" className="hidden" name="maritalStatus" value="single" checked={iraForm.maritalStatus === 'single'} onChange={e => setIraForm({ ...iraForm, maritalStatus: e.target.value })} />
                        <span className="text-[13px] text-[#1F1F1F] font-helvetica">Single</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer group">
                        <div className={`flex h-4 w-4 items-center justify-center rounded-full border ${iraForm.maritalStatus === 'married' ? 'border-[#D1A94C] bg-[#D1A94C]' : 'border-[#E5E7EB] bg-white'} transition`}>
                          {iraForm.maritalStatus === 'married' && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                        </div>
                        <input type="radio" className="hidden" name="maritalStatus" value="married" checked={iraForm.maritalStatus === 'married'} onChange={e => setIraForm({ ...iraForm, maritalStatus: e.target.value })} />
                        <span className="text-[13px] text-[#1F1F1F] font-helvetica">Married</span>
                      </label>
                    </div>
                    {errors.maritalStatus && <p className="mt-1 text-[11px] text-red-600">{errors.maritalStatus}</p>}
                  </div>
                </div>

                {/* ─── Verification & Others ─── */}
                <div>
                  <h3 className="text-[14px] font-semibold text-[#1F1F1F] mb-3 font-goudy border-b pb-1">Security & Beneficiary</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="block text-[12px] font-medium text-[#6B7280] mb-1 font-helvetica">Social Security Number</label>
                      <input
                        type="text"
                        placeholder="Enter SSN"
                        value={iraForm.ssn}
                        onChange={e => setIraForm({ ...iraForm, ssn: e.target.value })}
                        className={`w-full h-[40px] rounded-[8px] border px-4 text-[13px] font-helvetica outline-none transition bg-[#FAFAFA] ${errors.ssn ? 'border-red-500' : 'border-[#E5E7EB] focus:border-[#D1A94C]'}`}
                      />
                      {errors.ssn && <p className="mt-1 text-[11px] text-red-600">{errors.ssn}</p>}
                    </div>
                    <div>
                      <label className="block text-[12px] font-medium text-[#6B7280] mb-1 font-helvetica">Beneficiary</label>
                      <input
                        type="text"
                        placeholder="Beneficiary name"
                        value={iraForm.beneficiary}
                        onChange={e => setIraForm({ ...iraForm, beneficiary: e.target.value })}
                        className={`w-full h-[40px] rounded-[8px] border px-4 text-[13px] font-helvetica outline-none transition bg-[#FAFAFA] ${errors.beneficiary ? 'border-red-500' : 'border-[#E5E7EB] focus:border-[#D1A94C]'}`}
                      />
                      {errors.beneficiary && <p className="mt-1 text-[11px] text-red-600">{errors.beneficiary}</p>}
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-[12px] font-medium text-[#6B7280] mb-1 font-helvetica">Custodian</label>
                      <input
                        type="text"
                        placeholder="Enter custodian name"
                        value={iraForm.custodian}
                        onChange={e => setIraForm({ ...iraForm, custodian: e.target.value })}
                        className={`w-full h-[40px] rounded-[8px] border px-4 text-[13px] font-helvetica outline-none transition bg-[#FAFAFA] ${errors.custodian ? 'border-red-500' : 'border-[#E5E7EB] focus:border-[#D1A94C]'}`}
                      />
                      {errors.custodian && <p className="mt-1 text-[11px] text-red-600">{errors.custodian}</p>}
                    </div>
                  </div>
                </div>

                {/* ─── Address ─── */}
                <div>
                  <h3 className="text-[14px] font-semibold text-[#1F1F1F] mb-3 font-goudy border-b pb-1">Address Details</h3>

                  {/* Physical Address (Read-only) */}
                  <div className="mb-6">
                    <p className="text-[12px] font-medium text-[#1F1F1F] mb-2 font-helvetica italic opacity-70">Physical Address (from your profile)</p>
                    <div className="grid gap-4 md:grid-cols-2 bg-[#F9FAFB] p-4 rounded-lg border border-[#E5E7EB]">
                      <div>
                        <label className="block text-[11px] font-medium text-[#6B7280] mb-0.5 font-helvetica">Street Address 1</label>
                        <p className="text-[13px] text-[#374151] font-helvetica">{user?.addressLine1 || '-'}</p>
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium text-[#6B7280] mb-0.5 font-helvetica">Street Address 2</label>
                        <p className="text-[13px] text-[#374151] font-helvetica">{user?.addressLine2 || '-'}</p>
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium text-[#6B7280] mb-0.5 font-helvetica">City</label>
                        <p className="text-[13px] text-[#374151] font-helvetica">{user?.city || '-'}</p>
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium text-[#6B7280] mb-0.5 font-helvetica">State</label>
                        <p className="text-[13px] text-[#374151] font-helvetica">{user?.state || '-'}</p>
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium text-[#6B7280] mb-0.5 font-helvetica">Zip Code</label>
                        <p className="text-[13px] text-[#374151] font-helvetica">{user?.zipCode || '-'}</p>
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium text-[#6B7280] mb-0.5 font-helvetica">Country</label>
                        <p className="text-[13px] text-[#374151] font-helvetica">{user?.country || '-'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="block text-[12px] font-medium text-[#6B7280] mb-2 font-helvetica">Is mailing address same as physical address?</label>
                    <div className="flex gap-6">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <div className={`flex h-4 w-4 items-center justify-center rounded-full border ${iraForm.mailingAddressSame ? 'border-[#D1A94C] bg-[#D1A94C]' : 'border-[#E5E7EB] bg-white'}`}>
                          {iraForm.mailingAddressSame && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                        </div>
                        <input type="radio" className="hidden" checked={iraForm.mailingAddressSame} onChange={() => setIraForm({ ...iraForm, mailingAddressSame: true })} />
                        <span className="text-[13px] text-[#1F1F1F] font-helvetica">Yes</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <div className={`flex h-4 w-4 items-center justify-center rounded-full border ${!iraForm.mailingAddressSame ? 'border-[#D1A94C] bg-[#D1A94C]' : 'border-[#E5E7EB] bg-white'}`}>
                          {!iraForm.mailingAddressSame && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                        </div>
                        <input type="radio" className="hidden" checked={!iraForm.mailingAddressSame} onChange={() => setIraForm({ ...iraForm, mailingAddressSame: false })} />
                        <span className="text-[13px] text-[#1F1F1F] font-helvetica">No</span>
                      </label>
                    </div>
                  </div>

                  {!iraForm.mailingAddressSame && (
                    <div className="grid gap-4 md:grid-cols-2 animate-in fade-in slide-in-from-top-2 duration-300">
                      <div className="md:col-span-2">
                        <label className="block text-[12px] font-medium text-[#6B7280] mb-1 font-helvetica">Mailing Address 1</label>
                        <input
                          type="text"
                          placeholder="Street address"
                          value={iraForm.mailingAddress1}
                          onChange={e => setIraForm({ ...iraForm, mailingAddress1: e.target.value })}
                          className={`w-full h-[40px] rounded-[8px] border px-4 text-[13px] font-helvetica outline-none bg-[#FAFAFA] ${errors.mailingAddress1 ? 'border-red-500' : 'border-[#E5E7EB]'}`}
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-[12px] font-medium text-[#6B7280] mb-1 font-helvetica">Mailing Address 2</label>
                        <input
                          type="text"
                          placeholder="Suite, unit, etc. (optional)"
                          value={iraForm.mailingAddress2}
                          onChange={e => setIraForm({ ...iraForm, mailingAddress2: e.target.value })}
                          className="w-full h-[40px] rounded-[8px] border border-[#E5E7EB] px-4 text-[13px] font-helvetica outline-none bg-[#FAFAFA]"
                        />
                      </div>
                      <div>
                        <label className="block text-[12px] font-medium text-[#6B7280] mb-1 font-helvetica">Country</label>
                        <Combobox
                          options={Country.getAllCountries().map(c => ({ label: c.name, value: c.isoCode }))}
                          value={iraForm.mailingCountry}
                          onChange={(val) => setIraForm({ ...iraForm, mailingCountry: val, mailingState: '', mailingCity: '' })}
                          placeholder="Select country"
                          className={errors.mailingCountry ? 'border-red-500' : ''}
                        />
                        {errors.mailingCountry && <p className="mt-1 text-[11px] text-red-600">{errors.mailingCountry}</p>}
                      </div>

                      <div>
                        <label className="block text-[12px] font-medium text-[#6B7280] mb-1 font-helvetica">State / Province</label>
                        <Combobox
                          options={iraForm.mailingCountry ? State.getStatesOfCountry(iraForm.mailingCountry).map(s => ({ label: s.name, value: s.isoCode })) : []}
                          value={iraForm.mailingState}
                          onChange={(val) => setIraForm({ ...iraForm, mailingState: val, mailingCity: '' })}
                          placeholder="Select state"
                          disabled={!iraForm.mailingCountry}
                          className={errors.mailingState ? 'border-red-500' : ''}
                        />
                        {errors.mailingState && <p className="mt-1 text-[11px] text-red-600">{errors.mailingState}</p>}
                      </div>

                      <div className="md:col-span-1">
                        <label className="block text-[12px] font-medium text-[#6B7280] mb-1 font-helvetica">City</label>
                        <Combobox
                          options={(iraForm.mailingCountry && iraForm.mailingState) ? City.getCitiesOfState(iraForm.mailingCountry, iraForm.mailingState).map(c => ({ label: c.name, value: c.name })) : []}
                          value={iraForm.mailingCity}
                          onChange={(val) => setIraForm({ ...iraForm, mailingCity: val })}
                          placeholder="Select city"
                          disabled={!iraForm.mailingState}
                          className={errors.mailingCity ? 'border-red-500' : ''}
                        />
                        {errors.mailingCity && <p className="mt-1 text-[11px] text-red-600">{errors.mailingCity}</p>}
                      </div>

                      <div>
                        <label className="block text-[12px] font-medium text-[#6B7280] mb-1 font-helvetica">Zip Code</label>
                        <input
                          type="text"
                          placeholder="Zip"
                          value={iraForm.mailingZipCode}
                          onChange={e => setIraForm({ ...iraForm, mailingZipCode: e.target.value })}
                          className={`w-full h-[40px] rounded-[8px] border px-4 text-[13px] font-helvetica outline-none bg-[#FAFAFA] ${errors.mailingZipCode ? 'border-red-500' : 'border-[#E5E7EB]'}`}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* ─── Final Details ─── */}
                <div>
                  <h3 className="text-[14px] font-semibold text-[#1F1F1F] mb-3 font-goudy border-b pb-1">Final Details</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="block text-[12px] font-medium text-[#6B7280] mb-1 font-helvetica">Username</label>
                      <input
                        type="text"
                        placeholder="Choose a username"
                        value={iraForm.username}
                        onChange={e => setIraForm({ ...iraForm, username: e.target.value })}
                        className={`w-full h-[40px] rounded-[8px] border px-4 text-[13px] font-helvetica outline-none transition bg-[#FAFAFA] ${errors.username ? 'border-red-500' : 'border-[#E5E7EB] focus:border-[#D1A94C]'}`}
                      />
                      {errors.username && <p className="mt-1 text-[11px] text-red-600">{errors.username}</p>}
                    </div>
                    <div>
                      <label className="block text-[12px] font-medium text-[#6B7280] mb-1 font-helvetica">Where did you hear about us? (Optional)</label>
                      <input
                        type="text"
                        placeholder="e.g. Google, Friend"
                        value={iraForm.referralSource}
                        onChange={e => setIraForm({ ...iraForm, referralSource: e.target.value })}
                        className="w-full h-[40px] rounded-[8px] border border-[#E5E7EB] px-4 text-[13px] font-helvetica outline-none focus:border-[#D1A94C] bg-[#FAFAFA]"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-[#ECEDEF]" />

              {/* Footer Buttons */}
              <div className="flex justify-end gap-3 px-6 py-4">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="h-[40px] px-5 rounded-full border border-[#E5E7EB] bg-[#FFFDF5] text-[13px] font-medium text-[#1F1F1F] hover:bg-[#FFF8E1] transition font-helvetica"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveIRA}
                  disabled={loading}
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-[#FFC63F] to-[#F1DD58] px-5 py-2 rounded-full text-sm font-medium shadow-md disabled:opacity-70"
                >
                  {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                  {loading ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
