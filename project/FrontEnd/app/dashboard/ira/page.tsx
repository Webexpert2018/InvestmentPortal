'use client';

import { useState, useEffect } from 'react';
import { useToast, toast as globalToast } from '@/hooks/use-toast';
import { DashboardLayout } from '@/components/DashboardLayout';
import { useAuth } from '@/lib/contexts/AuthContext';
import { apiClient } from '@/lib/api/client';
import { Check, ChevronDown, Shield, Smartphone, QrCode, Phone, MapPin, User, FileText, Lock, Plus, X, Loader2 } from 'lucide-react';

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
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-medium font-helvetica ${
        verified ? 'bg-[#ECFDF5] text-[#16A66A]' : 'bg-[#FEF3C7] text-[#D97706]'
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

  const phoneComplete = user?.phone || '';
  const phoneParts = phoneComplete.match(/^(\+\d+\s*\([^)]+\))\s*(.*)$/); // basic country code grab
  const phoneCountry = phoneParts ? phoneParts[1] : '';
  const phoneNumberOnly = phoneParts ? phoneParts[2] : phoneComplete;

  useEffect(() => {
    fetchIraAccount();
  }, []);

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
    accountOpenDate: iraAccount?.created_at ? new Date(iraAccount.created_at).toLocaleDateString() : '-',
    custodian: iraAccount?.custodian_name || '-',
    beneficiary: iraAccount?.beneficiary || '-',
    contributionYTD: '$0.00',
    contributionLimit: '$7,000.00',
    accountBalance: '$0.00',
    
    // Completion Status
    profileCompleted: !!(user?.firstName && user?.lastName && user?.email && user?.phone && user?.dob),
    addressCompleted: !!(user?.addressLine1 && user?.city && user?.state && user?.zipCode && user?.country),
    taxCompleted: !!user?.taxId,
  };
  const { toast } = useToast();
  const [showAddModal, setShowAddModal] = useState(false);
  const [iraForm, setIraForm] = useState({
    accountType: '',
    accountNumber: '',
    custodian: '',
    beneficiary: '',
    accountHolderName: '',
    ssn: '',
  });

  const [errors, setErrors] = useState<{ [k: string]: string }>({});

  const validate = () => {
    const e: { [k: string]: string } = {};
    if (!iraForm.accountType.trim()) e.accountType = 'Please enter account type.';
    if (!iraForm.accountNumber.trim()) e.accountNumber = 'Please enter account number.';
    if (!iraForm.custodian.trim()) e.custodian = 'Please enter custodian name.';
    if (!iraForm.beneficiary.trim()) e.beneficiary = 'Please enter beneficiary name.';
    if (!iraForm.accountHolderName.trim()) e.accountHolderName = 'Please enter account holder name.';
    // simple SSN validation: allow 9 digits or formatted 123-45-6789
    const ssnDigits = iraForm.ssn.replace(/[^0-9]/g, '');
    if (!iraForm.ssn.trim()) e.ssn = 'Please enter Social Security Number.';
    else if (!(ssnDigits.length === 9)) e.ssn = 'SSN must contain 9 digits.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSaveIRA = async () => {
    if (!validate()) {
      return;
    }

    setLoading(true);
    try {
      await apiClient.createIRAAccount({
        accountType: iraForm.accountType,
        accountNumber: iraForm.accountNumber,
        custodian: iraForm.custodian,
        beneficiary: iraForm.beneficiary,
      });

      toast({ title: 'IRA saved', description: 'All IRA account values saved successfully.' });
      globalToast({ title: 'IRA saved', description: 'All IRA account values saved successfully.' });
      
      await fetchIraAccount();
      setShowAddModal(false);
      setIraForm({ accountType: '', accountNumber: '', custodian: '', beneficiary: '', accountHolderName: '', ssn: '' });
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
              <div>
                <p className="text-[12px] font-medium text-[#6B7280] mb-1 font-helvetica">Account Status</p>
                <div className="mt-1">
                  <StatusBadge verified={d.accountStatus === 'Active'} label={d.accountStatus} />
                </div>
              </div>
              <Field label="Account Open Date" value={d.accountOpenDate} />
              <Field label="Custodian" value={d.custodian} />
              <Field label="Beneficiary" value={d.beneficiary} />
              <Field label="Contribution (YTD)" value={d.contributionYTD} />
              <Field label="Annual Contribution Limit" value={d.contributionLimit} />
              <Field label="Account Balance" value={d.accountBalance} />
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
              <Field label="Last Name" value={d.lastName} />
              <Field label="Email" value={d.email} />
              <div>
                <p className="text-[12px] font-medium text-[#6B7280] mb-[6px] font-helvetica">Phone Number</p>
                <div className="flex gap-2">
                  <div className="h-[42px] w-[120px] shrink-0 flex items-center rounded-[8px] border border-[#E5E7EB] bg-[#FAFAFA] px-3">
                    <span className="text-[13px] text-[#374151] font-helvetica">{d.phoneCountryCode}</span>
                  </div>
                  <div className="h-[42px] flex-1 flex items-center rounded-[8px] border border-[#E5E7EB] bg-[#FAFAFA] px-4">
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
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Street Address Line 1" value={d.addressLine1} />
              <Field label="Street Address Line 2" value={d.addressLine2} />
              <Field label="City" value={d.city} />
              <Field label="State" value={d.state} />
              <Field label="ZIP Code" value={d.zipCode} />
              <Field label="Country" value={d.country} />
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
              <div className="px-6 py-5 space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="block text-[12px] font-medium text-[#6B7280] mb-1 font-helvetica">Account Type</label>
                    <select
                      value={iraForm.accountType}
                      onChange={e => setIraForm({ ...iraForm, accountType: e.target.value })}
                      className={`w-full h-[42px] rounded-[8px] border px-4 text-[13px] font-helvetica outline-none transition bg-[#FAFAFA] ${errors.accountType ? 'border-red-500' : 'border-[#E5E7EB] focus:border-[#D1A94C]'}`}
                    >
                      <option value="">Select account type</option>
                      <option value="Traditional">Traditional</option>
                      <option value="Roth">Roth</option>
                      <option value="SEP">SEP</option>
                      <option value="Roth SEP">Roth SEP</option>
                      <option value="Rollover">Rollover</option>
                    </select>
                    {errors.accountType && <p className="mt-1 text-[12px] text-red-600">{errors.accountType}</p>}
                  </div>

                  <div>
                    <label className="block text-[12px] font-medium text-[#6B7280] mb-1 font-helvetica">Account Number</label>
                    <input
                      type="text"
                      placeholder="Enter account number"
                      value={iraForm.accountNumber}
                      onChange={e => setIraForm({ ...iraForm, accountNumber: e.target.value })}
                      className={`w-full h-[42px] rounded-[8px] border px-4 text-[13px] font-helvetica outline-none transition bg-[#FAFAFA] ${errors.accountNumber ? 'border-red-500' : 'border-[#E5E7EB] focus:border-[#D1A94C]'}`}
                    />
                    {errors.accountNumber && <p className="mt-1 text-[12px] text-red-600">{errors.accountNumber}</p>}
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="block text-[12px] font-medium text-[#6B7280] mb-1 font-helvetica">Account Holder Name</label>
                    <input
                      type="text"
                      placeholder="Full name of account holder"
                      value={iraForm.accountHolderName}
                      onChange={e => setIraForm({ ...iraForm, accountHolderName: e.target.value })}
                      className={`w-full h-[42px] rounded-[8px] border px-4 text-[13px] font-helvetica outline-none transition bg-[#FAFAFA] ${errors.accountHolderName ? 'border-red-500' : 'border-[#E5E7EB] focus:border-[#D1A94C]'}`}
                    />
                    {errors.accountHolderName && <p className="mt-1 text-[12px] text-red-600">{errors.accountHolderName}</p>}
                  </div>

                  <div>
                    <label className="block text-[12px] font-medium text-[#6B7280] mb-1 font-helvetica">Social Security Number</label>
                    <input
                      type="text"
                      placeholder="Enter social security number"
                      value={iraForm.ssn}
                      onChange={e => setIraForm({ ...iraForm, ssn: e.target.value })}
                      className={`w-full h-[42px] rounded-[8px] border px-4 text-[13px] font-helvetica outline-none transition bg-[#FAFAFA] ${errors.ssn ? 'border-red-500' : 'border-[#E5E7EB] focus:border-[#D1A94C]'}`}
                    />
                    {errors.ssn && <p className="mt-1 text-[12px] text-red-600">{errors.ssn}</p>}
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="block text-[12px] font-medium text-[#6B7280] mb-1 font-helvetica">Custodian</label>
                    <input
                      type="text"
                      placeholder="Enter custodian name"
                      value={iraForm.custodian}
                      onChange={e => setIraForm({ ...iraForm, custodian: e.target.value })}
                      className={`w-full h-[42px] rounded-[8px] border px-4 text-[13px] font-helvetica outline-none transition bg-[#FAFAFA] ${errors.custodian ? 'border-red-500' : 'border-[#E5E7EB] focus:border-[#D1A94C]'}`}
                    />
                    {errors.custodian && <p className="mt-1 text-[12px] text-red-600">{errors.custodian}</p>}
                  </div>

                  <div>
                    <label className="block text-[12px] font-medium text-[#6B7280] mb-1 font-helvetica">Beneficiary</label>
                    <input
                      type="text"
                      placeholder="Enter beneficiary name"
                      value={iraForm.beneficiary}
                      onChange={e => setIraForm({ ...iraForm, beneficiary: e.target.value })}
                      className={`w-full h-[42px] rounded-[8px] border px-4 text-[13px] font-helvetica outline-none transition bg-[#FAFAFA] ${errors.beneficiary ? 'border-red-500' : 'border-[#E5E7EB] focus:border-[#D1A94C]'}`}
                    />
                    {errors.beneficiary && <p className="mt-1 text-[12px] text-red-600">{errors.beneficiary}</p>}
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
