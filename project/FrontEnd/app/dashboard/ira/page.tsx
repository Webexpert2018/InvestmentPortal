'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/DashboardLayout';
import { useAuth } from '@/lib/contexts/AuthContext';
import { apiClient } from '@/lib/api/client';
import { Country, State, City } from 'country-state-city';
import { Combobox } from '@/components/ui/combobox';
import { Check, ChevronDown, ChevronLeft, Shield, Smartphone, QrCode, Phone, MapPin, User, FileText, Lock, Plus, X, Loader2, Info, Wallet, Sparkles, Building2, ShieldCheck, History } from 'lucide-react';

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
  const router = useRouter();
  const { user } = useAuth();
  const { toast: localToast } = useToast();
  const [iraAccounts, setIraAccounts] = useState<any[]>([]);
  const [selectedAccountIdx, setSelectedAccountIdx] = useState<number>(0);
  const [view, setView] = useState<'list' | 'detail'>('list');
  const [fetchingIra, setFetchingIra] = useState(true);
  const [loading, setLoading] = useState(false);
  const [accountTypes, setAccountTypes] = useState<any[]>([]);
  const [myInvestments, setMyInvestments] = useState<any[]>([]);
  const [myRedemptions, setMyRedemptions] = useState<any[]>([]);

  const phoneComplete = user?.phone || '';
  const phoneParts = phoneComplete.match(/^(\+\d+\s*\([^)]+\))\s*(.*)$/);
  const phoneCountry = phoneParts ? phoneParts[1] : '';
  const phoneNumberOnly = phoneParts ? phoneParts[2] : phoneComplete;

  useEffect(() => {
    fetchIraAccount();
    fetchAccountTypes();
    fetchPortfolioData();
  }, []);

  const fetchPortfolioData = async () => {
    try {
      const [investments, redemptions] = await Promise.all([
        apiClient.getMyInvestments(),
        apiClient.getMyRedemptions()
      ]);
      setMyInvestments(investments || []);
      setMyRedemptions(redemptions || []);
    } catch (error) {
      console.error('Failed to fetch portfolio data:', error);
    }
  };

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
      setIraAccounts(Array.isArray(data) ? data : (data ? [data] : []));
    } catch (error) {
      console.error('Failed to fetch IRA accounts:', error);
    } finally {
      setFetchingIra(false);
    }
  };

  const selectedIra = iraAccounts[selectedAccountIdx];

  const calculateBalance = (accountId: string) => {
    const accountInvestments = myInvestments.filter(inv => inv.account_id === accountId && inv.is_reconciled);
    const totalInvested = accountInvestments.reduce((sum, inv) => sum + parseFloat(inv.revised_amount || inv.investment_amount || 0), 0);

    const investmentIds = accountInvestments.map(inv => inv.id);
    const totalRedeemed = myRedemptions
      .filter(red => red.is_reconciled && investmentIds.includes(red.investment_id))
      .reduce((sum, red) => sum + parseFloat(red.amount || 0), 0);

    return totalInvested - totalRedeemed;
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

    phoneVerified: !!user?.phone,
    phoneVerifiedAt: user?.phone ? 'Verified' : '-',
    taxEncrypted: true,
    twoFactorEnabled: false,
    twoFactorMethod: 'Pending setup',
    twoFactorSetupDate: 'Pending',

    accountType: selectedIra?.account_type || '-',
    accountNumber: selectedIra?.account_number || '-',
    accountStatus: user?.status ? (user.status.charAt(0).toUpperCase() + user.status.slice(1)) : '-',
    accountOpenDate: selectedIra?.created_at ? new Date(selectedIra.created_at).toLocaleDateString() : (user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : '-'),
    accountUpdatedDate: selectedIra?.updated_at ? new Date(selectedIra.updated_at).toLocaleDateString() : '-',
    custodian: selectedIra?.custodian_name || '-',
    beneficiary: selectedIra?.beneficiary || '-',
    contributionYTD: '$0.00',
    contributionLimit: '$7,000.00',
    accountBalance: selectedIra ? `$${calculateBalance(selectedIra.id).toLocaleString()}` : '$0.00',
    fullAccountHolderName: [user?.firstName, selectedIra?.middle_name, user?.lastName, selectedIra?.suffix].filter(Boolean).join(' ') || '-',

    middleName: selectedIra?.middle_name || '-',
    suffix: selectedIra?.suffix || '-',
    maritalStatus: selectedIra?.marital_status || '-',
    mailingAddressSame: selectedIra?.mailing_address_same !== false ? 'Yes' : 'No',
    mailingAddress1: selectedIra?.mailing_address_same !== false ? (user?.addressLine1 || '-') : (selectedIra?.mailing_address_1 || '-'),
    mailingAddress2: selectedIra?.mailing_address_same !== false ? (user?.addressLine2 || '-') : (selectedIra?.mailing_address_2 || '-'),
    mailingCity: selectedIra?.mailing_address_same !== false ? (user?.city || '-') : (selectedIra?.mailing_city || '-'),
    mailingState: selectedIra?.mailing_address_same !== false ? (user?.state || '-') : (selectedIra?.mailing_state || '-'),
    mailingZipCode: selectedIra?.mailing_address_same !== false ? (user?.zipCode || '-') : (selectedIra?.mailing_zip_code || '-'),
    mailingCountry: selectedIra?.mailing_address_same !== false ? (user?.country || '-') : (selectedIra?.mailing_country || selectedIra?.mailing_country_name || '-'),

    profileCompleted: !!(user?.firstName && user?.lastName && user?.email && user?.phone && user?.dob),
    addressCompleted: !!(user?.addressLine1 && user?.city && user?.state && user?.zipCode && user?.country),
    taxCompleted: !!user?.taxId,
  };

  const [showAddModal, setShowAddModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferForm, setTransferForm] = useState({
    accountNumber: '',
    custodian: '',
  });
  const [isEditingTaxId, setIsEditingTaxId] = useState(false);
  const [editedTaxId, setEditedTaxId] = useState(user?.taxId || '');
  const [isSavingTaxId, setIsSavingTaxId] = useState(false);

  const [iraForm, setIraForm] = useState({
    accountType: 'Traditional IRA',
    accountNumber: '',
    custodian: '',
    beneficiary: '',
    accountHolderName: user ? `${user.firstName} ${user.lastName}` : '',
    ssn: user?.taxId || '',
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

  useEffect(() => {
    if (user && showAddModal) {
      setIraForm(prev => {
        const rawSsn = prev.ssn || user.taxId || '';
        const val = rawSsn.replace(/\D/g, '');
        let formatted = val;
        if (val.length > 3 && val.length <= 5) {
          formatted = `${val.slice(0, 3)}-${val.slice(3)}`;
        } else if (val.length > 5) {
          formatted = `${val.slice(0, 3)}-${val.slice(3, 5)}-${val.slice(5)}`;
        }

        return {
          ...prev,
          accountHolderName: prev.accountHolderName || `${user.firstName} ${user.lastName}`,
          ssn: formatted
        };
      });
    }
    if (user) {
      setEditedTaxId(user.taxId || '');
    }
  }, [user, showAddModal]);

  const [errors, setErrors] = useState<{ [k: string]: string }>({});

  const validate = () => {
    const e: { [k: string]: string } = {};
    if (!iraForm.accountType.trim()) e.accountType = 'Please enter account type.';
    // if (!iraForm.accountNumber.trim()) e.accountNumber = 'Please enter account number.';
    //if (!iraForm.custodian.trim()) e.custodian = 'Please enter custodian name.';
    //if (!iraForm.beneficiary.trim()) e.beneficiary = 'Please enter beneficiary name.';
    if (!iraForm.maritalStatus) e.maritalStatus = 'Please select marital status.';
    // if (!iraForm.custodian.trim()) e.custodian = 'Please enter custodian name.';

    if (!iraForm.mailingAddressSame) {
      if (!iraForm.mailingAddress1?.trim()) e.mailingAddress1 = 'Please enter mailing address.';
      if (!iraForm.mailingCity?.trim()) e.mailingCity = 'Please enter city.';
      if (!iraForm.mailingState?.trim()) e.mailingState = 'Please select state.';
      if (!iraForm.mailingCountry?.trim()) e.mailingCountry = 'Please select country.';
      if (!iraForm.mailingZipCode?.trim()) e.mailingZipCode = 'Please enter zip code.';
    }

    const ssnDigits = iraForm.ssn.replace(/[^0-9]/g, '');
    if (!iraForm.ssn.trim()) e.ssn = 'Please enter Social Security Number.';
    else if (ssnDigits.length !== 9) e.ssn = 'SSN must contain 9 digits.';

    setErrors(e);
    if (Object.keys(e).length > 0) {
      localToast({
        title: 'Validation failed',
        description: 'Missing or invalid fields: ' + Object.keys(e).join(', '),
        variant: 'destructive',
      });
      const modalContent = document.querySelector('.overflow-y-auto');
      if (modalContent) modalContent.scrollTo({ top: 0, behavior: 'smooth' });
    }
    return Object.keys(e).length === 0;
  };

  const handleSaveIRA = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await apiClient.createIRAAccount({
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

      localToast({
        title: 'IRA saved',
        description: 'All IRA account values saved successfully.',
        className: 'bg-green-50 border-green-200 text-green-800'
      });

      await fetchIraAccount();
      setShowAddModal(false);
      setIraForm({
        accountType: 'Traditional', accountNumber: '', custodian: '', beneficiary: '', accountHolderName: user ? `${user.firstName} ${user.lastName}` : '', ssn: '',
        middleName: '', suffix: '', maritalStatus: 'single', mailingAddressSame: true,
        mailingAddress1: '', mailingAddress2: '', mailingCity: '', mailingState: '', mailingZipCode: '', mailingCountry: '',
      });
      setErrors({});
    } catch (error: any) {
      localToast({
        title: error?.status === 409 ? 'Duplicate Account Type' : 'Error',
        description: error?.message || 'Failed to save IRA account',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTransferIRA = () => {
    if (!transferForm.accountNumber.trim()) {
      localToast({
        title: 'Validation failed',
        description: 'Please enter account number.',
        variant: 'destructive',
      });
      return;
    }
    if (!transferForm.custodian.trim()) {
      localToast({
        title: 'Validation failed',
        description: 'Please enter previous custodian name.',
        variant: 'destructive',
      });
      return;
    }
    alert('We will integrate an API soon for this');
    setShowTransferModal(false);
    setTransferForm({ accountNumber: '', custodian: '' });
  };

  const handleSaveTaxId = async () => {
    const cleanTaxId = editedTaxId.replace(/\D/g, '');
    if (cleanTaxId.length !== 9) {
      localToast({
        title: 'Invalid Tax ID',
        description: 'Tax ID must be exactly 9 digits.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsSavingTaxId(true);
      await apiClient.updateProfile({ taxId: cleanTaxId });
      setIsEditingTaxId(false);
      localToast({
        title: 'Success',
        description: 'Tax ID updated successfully',
        className: 'bg-green-50 border-green-200 text-green-800'
      });
      window.location.reload();
    } catch (err: any) {
      localToast({
        title: 'Error',
        description: err.message || 'Failed to update Tax ID',
        variant: 'destructive'
      });
    } finally {
      setIsSavingTaxId(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="mx-auto w-full max-w-8xl font-helvetica">
        {/* Page Header */}
        <div className="md:flex items-center justify-between">
          <div className="flex items-center gap-4 mb-3 md:mb-0">
            <button
              onClick={() => {
                if (view === 'detail') {
                  setView('list');
                } else {
                  router.back();
                }
              }}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="h-5 w-5 text-gray-600" />
            </button>
            <div>
              <h1 className="font-goudy text-[22px] md:text-[26px] font-bold text-[#1F1F1F]">IRA</h1>
              <p className="mt-1 text-[13px] text-[#8E8E93] font-helvetica">
                {view === 'list'
                  ? 'Manage your IRA-related investments and account information here.'
                  : `Detailed overview of your ${selectedIra?.account_type || ''} account.`}
              </p>
            </div>
          </div>
          <div className="flex gap-3 sm:justify-end justify-auto">
            <button
              onClick={() => setShowTransferModal(true)}
              className="inline-flex items-center gap-2 border border-[#E5E7EB] bg-white px-5 py-2 rounded-full text-sm font-medium shadow-sm hover:bg-gray-50 transition-colors"
            >
              <History className="h-4 w-4 text-[#D1A94C]" />
              Transfer In
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-[#FFC63F] to-[#F1DD58] px-5 py-2 rounded-full text-sm font-medium shadow-md hover:opacity-90 transition-opacity"
            >
              <Plus className="h-4 w-4" />
              New Account
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        {view === 'list' ? (
          <div className="mt-6 rounded-[10px] bg-white ring-1 ring-black/5 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[650px] border-separate border-spacing-0 text-[14px] table-fixed">
                <thead>
                  <tr className="bg-[#FAFAFA] text-left text-[13px] font-medium text-[#4B4B4B]">
                    <th className="px-6 py-4 border-b border-[#F0F0F0] w-[25%]">Account Type</th>
                    <th className="px-6 py-4 border-b border-[#F0F0F0] w-[25%]">Beneficiary</th>
                    <th className="px-6 py-4 border-b border-[#F0F0F0] text-right w-[25%]">Account Balance</th>
                    <th className="px-6 py-4 border-b border-[#F0F0F0] text-center w-[25%]">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0F0F0]">
                  {fetchingIra ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-20 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <Loader2 className="h-8 w-8 animate-spin text-[#D1A94C]" />
                          <p className="text-[#8E8E93] font-helvetica">Loading your accounts...</p>
                        </div>
                      </td>
                    </tr>
                  ) : iraAccounts.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-20 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <Wallet className="h-12 w-12 text-[#E5E7EB]" />
                          <p className="text-[#8E8E93] font-helvetica">No IRA accounts found.</p>
                          <button
                            onClick={() => setShowAddModal(true)}
                            className="mt-2 text-[#D1A94C] font-semibold hover:underline"
                          >
                            Open your first account
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    iraAccounts.map((acc, idx) => (
                      <tr
                        key={acc.id}
                        onClick={() => {
                          setSelectedAccountIdx(idx);
                          setView('detail');
                        }}
                        className="hover:bg-[#FAFAFA] cursor-pointer transition-colors group"
                      >
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#FFF8E1] group-hover:bg-[#FFC63F] group-hover:text-white transition-colors">
                              <FileText className="h-5 w-5 text-[#D1A94C] group-hover:text-white" />
                            </div>
                            <div>
                              <p className="font-bold text-[#1F1F1F] font-goudy text-[16px]">{acc.account_type}</p>
                              <p className="text-[12px] text-[#8E8E93] font-helvetica">{acc.account_number || 'N/A'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <p className="text-[#4B4B4B] font-helvetica">{acc.beneficiary || '-'}</p>
                        </td>
                        <td className="px-6 py-5 text-right">
                          <p className="font-bold text-[#1F1F1F] font-helvetica text-[15px]">
                            ${calculateBalance(acc.id).toLocaleString()}
                          </p>
                          <p className="text-[11px] text-[#2BB673] font-medium font-helvetica">Active Account</p>
                        </td>
                        <td className="px-6 py-5 text-center">
                          <button className="h-8 px-4 rounded-full border border-[#E5E7EB] text-[12px] font-bold text-[#4B4B4B] hover:bg-[#F5F5F5] transition-colors">
                            View Details
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="mt-4 rounded-sm border border-[#F0F0F0] bg-white shadow-sm overflow-hidden">
            {/* SECTION 1: IRA Account Overview */}
            <div className="p-6">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#FFF8E1]">
                    <FileText className="h-3.5 w-3.5 text-[#D1A94C]" />
                  </div>
                  <h3 className="text-[16px] font-semibold text-[#1F1F1F] font-goudy">IRA Account Overview</h3>
                </div>
                <button
                  onClick={() => setView('list')}
                  className="text-[12px] font-bold text-[#D1A94C] hover:underline flex items-center gap-1"
                >
                  <ChevronLeft className="h-3 w-3" /> Back to List
                </button>
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
              </div>
            </div>

            <div className="mx-6 sm:mx-8 border-t border-[#ECEDEF]" />

            {/* SECTION 2: Profile Information */}
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

            {/* SECTION 3: Address */}
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

            {/* SECTION 4: Phone Verification */}
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

            {/* SECTION 5: TAX Information */}
            <div className="p-6">
              <div className="flex items-center gap-2 mb-5">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#FFF8E1]">
                  <FileText className="h-3.5 w-3.5 text-[#D1A94C]" />
                </div>
                <h3 className="text-[16px] font-semibold text-[#1F1F1F] font-goudy">TAX Information</h3>
                <StatusBadge verified={d.taxCompleted} label={d.taxCompleted ? "Completed" : "Pending"} />
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <p className="text-[12px] font-medium text-[#6B7280] mb-1 font-helvetica">Social Security Number / Tax ID</p>
                    {!isEditingTaxId && (
                      <button
                        onClick={() => setIsEditingTaxId(true)}
                        className="text-[10px] font-bold text-[#D1A94C] hover:underline font-helvetica"
                      >
                        Edit
                      </button>
                    )}
                  </div>
                  {isEditingTaxId ? (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={editedTaxId}
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
                          setEditedTaxId(formatted);
                        }}
                        className="flex-1 h-9 px-3 text-[14px] text-[#1F1F1F] font-helvetica border border-[#E5E7EB] rounded-lg focus:outline-none focus:border-[#D1A94C]"
                      />
                      <button
                        onClick={handleSaveTaxId}
                        disabled={isSavingTaxId}
                        className="px-3 h-9 text-[12px] font-bold bg-[#FFC63F] text-[#1F1F1F] rounded-lg hover:opacity-90 disabled:opacity-50 font-helvetica"
                      >
                        {isSavingTaxId ? '...' : 'Save'}
                      </button>
                      <button
                        onClick={() => {
                          setIsEditingTaxId(false);
                          setEditedTaxId(user?.taxId || '');
                        }}
                        className="px-3 h-9 text-[12px] font-bold bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 font-helvetica"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <p className="text-[14px] tracking-[3px] text-[#1F1F1F] font-helvetica">
                      {d.taxId ? (d.taxId.length === 9 && !d.taxId.includes('-') ? `${d.taxId.slice(0, 3)}-${d.taxId.slice(3, 5)}-${d.taxId.slice(5)}` : d.taxId) : 'Not provided'}
                    </p>
                  )}
                </div>
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

            {/* SECTION 6: Two-Factor Authentication */}
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
                    {d.twoFactorEnabled ? (
                      <>
                        <Smartphone className="h-3.5 w-3.5 text-[#16A66A]" />
                        <span className="text-[13px] text-[#16A66A] font-medium font-helvetica">Active</span>
                      </>
                    ) : (
                      <span className="text-[13px] text-[#8E8E93] font-helvetica">Not configured</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ─── ADD IRA MODAL ─── */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-[20px] bg-white shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-white px-8 py-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#FFF8E1]">
                  <Plus className="h-5 w-5 text-[#D1A94C]" />
                </div>
                <h2 className="text-[22px] font-bold text-[#1F1F1F] font-goudy">Open New IRA Account</h2>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
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
                      {errors.accountType && <p className="mt-1 text-[11px] text-red-500">{errors.accountType}</p>}
                    </div>
                  </div>
                </div>

                {/* Personal Profile */}
                <div>
                  <h3 className="text-[14px] font-semibold text-[#1F1F1F] mb-4 font-goudy border-b pb-1">Personal Profile</h3>
                  <div className="grid gap-4 md:grid-cols-2 mb-4">
                    <div>
                      <label className="block text-[12px] font-medium text-[#6B7280] mb-1 font-helvetica">First Name (from user)</label>
                      <input
                        type="text"
                        value={user?.firstName || ''}
                        disabled
                        className="w-full h-[40px] rounded-[8px] border border-[#E5E7EB] px-4 text-[13px] font-helvetica bg-[#F3F4F6] text-[#9CA3AF]"
                      />
                    </div>
                    <div>
                      <label className="block text-[12px] font-medium text-[#6B7280] mb-1 font-helvetica">Last Name (from user)</label>
                      <input
                        type="text"
                        value={user?.lastName || ''}
                        disabled
                        className="w-full h-[40px] rounded-[8px] border border-[#E5E7EB] px-4 text-[13px] font-helvetica bg-[#F3F4F6] text-[#9CA3AF]"
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
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

                  <div className="mt-4">
                    <label className="block text-[12px] font-medium text-[#6B7280] mb-2 font-helvetica">Marital Status</label>
                    <div className="flex gap-6">
                      <div
                        className="flex items-center gap-2 cursor-pointer group"
                        onClick={() => setIraForm({ ...iraForm, maritalStatus: 'single' })}
                      >
                        <div className={`h-4 w-4 rounded-full border flex items-center justify-center transition-all ${iraForm.maritalStatus === 'single' ? 'border-[#D1A94C]' : 'border-[#E5E7EB] bg-white'}`}>
                          {iraForm.maritalStatus === 'single' && <div className="h-2 w-2 rounded-full bg-[#D1A94C]" />}
                        </div>
                        <span className={`text-[13px] font-helvetica transition-colors ${iraForm.maritalStatus === 'single' ? 'text-[#1F1F1F]' : 'text-[#6B7280] group-hover:text-[#D1A94C]'}`}>Single</span>
                      </div>
                      <div
                        className="flex items-center gap-2 cursor-pointer group"
                        onClick={() => setIraForm({ ...iraForm, maritalStatus: 'married' })}
                      >
                        <div className={`h-4 w-4 rounded-full border flex items-center justify-center transition-all ${iraForm.maritalStatus === 'married' ? 'border-[#D1A94C]' : 'border-[#E5E7EB] bg-white'}`}>
                          {iraForm.maritalStatus === 'married' && <div className="h-2 w-2 rounded-full bg-[#D1A94C]" />}
                        </div>
                        <span className={`text-[13px] font-helvetica transition-colors ${iraForm.maritalStatus === 'married' ? 'text-[#1F1F1F]' : 'text-[#6B7280] group-hover:text-[#D1A94C]'}`}>Married</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 2: Security & Beneficiary */}
                <div>
                  <h3 className="text-[16px] font-bold text-[#1F1F1F] mb-4 font-goudy">Security & Beneficiary</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="block text-[12px] font-medium text-[#6B7280] mb-1 font-helvetica">Social Security Number</label>
                      <input
                        type="text"
                        placeholder="XXX-XX-XXXX"
                        value={iraForm.ssn}
                        maxLength={11}
                        onChange={e => {
                          let val = e.target.value.replace(/\D/g, '');
                          if (val.length > 9) val = val.slice(0, 9);

                          // Format: XXX-XX-XXXX
                          let formatted = val;
                          if (val.length > 3 && val.length <= 5) {
                            formatted = `${val.slice(0, 3)}-${val.slice(3)}`;
                          } else if (val.length > 5) {
                            formatted = `${val.slice(0, 3)}-${val.slice(3, 5)}-${val.slice(5)}`;
                          }

                          setIraForm({ ...iraForm, ssn: formatted });
                          if (val.length === 9) {
                            setErrors((prev: any) => {
                              const newErrors = { ...prev };
                              delete newErrors.ssn;
                              return newErrors;
                            });
                          }
                        }}
                        className="w-full h-[40px] rounded-[8px] border border-[#E5E7EB] px-4 text-[13px] font-helvetica outline-none focus:border-[#D1A94C] bg-white transition-all"
                      />
                      {errors.ssn && <p className="mt-1 text-[11px] text-red-500">{errors.ssn}</p>}
                    </div>
                    <div>
                      <label className="block text-[12px] font-medium text-[#6B7280] mb-1 font-helvetica">Beneficiary</label>
                      <input
                        type="text"
                        placeholder="Enter primary beneficiary"
                        value={iraForm.beneficiary}
                        onChange={e => setIraForm({ ...iraForm, beneficiary: e.target.value })}
                        className="w-full h-[40px] rounded-[8px] border border-[#E5E7EB] px-4 text-[13px] font-helvetica outline-none focus:border-[#D1A94C] bg-white transition-all"
                      />
                      {errors.beneficiary && <p className="mt-1 text-[11px] text-red-500">{errors.beneficiary}</p>}
                    </div>
                  </div>
                </div>

                {/* Section 3: Address Details */}
                <div>
                  <h3 className="text-[16px] font-bold text-[#1F1F1F] mb-1 font-goudy">Address Details</h3>
                  <p className="text-[12px] italic text-[#8E8E93] mb-4 font-helvetica">Physical Address (from your profile)</p>

                  <div className="rounded-[12px] border border-[#F0F0F0] bg-[#FAFAFA] p-5">
                    <div className="grid grid-cols-2 gap-y-4 gap-x-8">
                      <div>
                        <p className="text-[11px] font-medium text-[#9CA3AF] mb-0.5 uppercase tracking-wider font-helvetica">Street Address 1</p>
                        <p className="text-[13px] text-[#1F1F1F] font-helvetica">{user?.addressLine1 || '-'}</p>
                      </div>
                      <div>
                        <p className="text-[11px] font-medium text-[#9CA3AF] mb-0.5 uppercase tracking-wider font-helvetica">Street Address 2</p>
                        <p className="text-[13px] text-[#1F1F1F] font-helvetica">{user?.addressLine2 || '-'}</p>
                      </div>
                      <div>
                        <p className="text-[11px] font-medium text-[#9CA3AF] mb-0.5 uppercase tracking-wider font-helvetica">City</p>
                        <p className="text-[13px] text-[#1F1F1F] font-helvetica">{user?.city || '-'}</p>
                      </div>
                      <div>
                        <p className="text-[11px] font-medium text-[#9CA3AF] mb-0.5 uppercase tracking-wider font-helvetica">State</p>
                        <p className="text-[13px] text-[#1F1F1F] font-helvetica">{user?.state || '-'}</p>
                      </div>
                      <div>
                        <p className="text-[11px] font-medium text-[#9CA3AF] mb-0.5 uppercase tracking-wider font-helvetica">Zip Code</p>
                        <p className="text-[13px] text-[#1F1F1F] font-helvetica">{user?.zipCode || '-'}</p>
                      </div>
                      <div>
                        <p className="text-[11px] font-medium text-[#9CA3AF] mb-0.5 uppercase tracking-wider font-helvetica">Country</p>
                        <p className="text-[13px] text-[#1F1F1F] font-helvetica">{user?.country || '-'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6">
                    <p className="text-[13px] font-medium text-[#1F1F1F] mb-3 font-helvetica">Is mailing address same as physical address?</p>
                    <div className="flex gap-6">
                      <div
                        className="flex items-center gap-2 cursor-pointer group"
                        onClick={() => setIraForm({ ...iraForm, mailingAddressSame: true })}
                      >
                        <div className={`h-4 w-4 rounded-full border flex items-center justify-center transition-all ${iraForm.mailingAddressSame === true ? 'border-[#D1A94C]' : 'border-[#E5E7EB] bg-white'}`}>
                          {iraForm.mailingAddressSame === true && <div className="h-2 w-2 rounded-full bg-[#D1A94C]" />}
                        </div>
                        <span className={`text-[13px] font-helvetica transition-colors ${iraForm.mailingAddressSame === true ? 'text-[#1F1F1F]' : 'text-[#6B7280] group-hover:text-[#D1A94C]'}`}>Yes</span>
                      </div>
                      <div
                        className="flex items-center gap-2 cursor-pointer group"
                        onClick={() => setIraForm({ ...iraForm, mailingAddressSame: false })}
                      >
                        <div className={`h-4 w-4 rounded-full border flex items-center justify-center transition-all ${iraForm.mailingAddressSame === false ? 'border-[#D1A94C]' : 'border-[#E5E7EB] bg-white'}`}>
                          {iraForm.mailingAddressSame === false && <div className="h-2 w-2 rounded-full bg-[#D1A94C]" />}
                        </div>
                        <span className={`text-[13px] font-helvetica transition-colors ${iraForm.mailingAddressSame === false ? 'text-[#1F1F1F]' : 'text-[#6B7280] group-hover:text-[#D1A94C]'}`}>No</span>
                      </div>
                    </div>
                  </div>

                  {!iraForm.mailingAddressSame && (
                    <div className="mt-4 flex flex-col gap-4">
                      <div className="grid gap-4 md:grid-cols-2">
                        <div>
                          <label className="block text-[12px] font-medium text-[#6B7280] mb-1 font-helvetica">Mailing Address 1</label>
                          <input
                            type="text"
                            placeholder="Address Line 1"
                            value={iraForm.mailingAddress1}
                            onChange={e => setIraForm({ ...iraForm, mailingAddress1: e.target.value })}
                            className="w-full h-[40px] rounded-[8px] border border-[#E5E7EB] px-4 text-[13px] font-helvetica outline-none focus:border-[#D1A94C] bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[12px] font-medium text-[#6B7280] mb-1 font-helvetica">Mailing Address 2</label>
                          <input
                            type="text"
                            placeholder="Address Line 2"
                            value={iraForm.mailingAddress2}
                            onChange={e => setIraForm({ ...iraForm, mailingAddress2: e.target.value })}
                            className="w-full h-[40px] rounded-[8px] border border-[#E5E7EB] px-4 text-[13px] font-helvetica outline-none focus:border-[#D1A94C] bg-white"
                          />
                        </div>
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <div>
                          <label className="block text-[12px] font-medium text-[#6B7280] mb-1 font-helvetica">Country</label>
                          <Combobox
                            options={Country.getAllCountries().map(c => ({ label: c.name, value: c.isoCode }))}
                            value={iraForm.mailingCountry}
                            onChange={val => setIraForm({ ...iraForm, mailingCountry: val, mailingState: '', mailingCity: '' })}
                            placeholder="Select Country"
                          />
                        </div>
                        <div>
                          <label className="block text-[12px] font-medium text-[#6B7280] mb-1 font-helvetica">State / Province</label>
                          <Combobox
                            options={State.getStatesOfCountry(iraForm.mailingCountry).map(s => ({ label: s.name, value: s.isoCode }))}
                            value={iraForm.mailingState}
                            onChange={val => setIraForm({ ...iraForm, mailingState: val, mailingCity: '' })}
                            placeholder="Select State"
                            disabled={!iraForm.mailingCountry}
                          />
                        </div>
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <div>
                          <label className="block text-[12px] font-medium text-[#6B7280] mb-1 font-helvetica">City</label>
                          <Combobox
                            options={City.getCitiesOfState(iraForm.mailingCountry, iraForm.mailingState).map(c => ({ label: c.name, value: c.name }))}
                            value={iraForm.mailingCity}
                            onChange={val => setIraForm({ ...iraForm, mailingCity: val })}
                            placeholder="Select City"
                            disabled={!iraForm.mailingState}
                          />
                        </div>
                        <div>
                          <label className="block text-[12px] font-medium text-[#6B7280] mb-1 font-helvetica">Zip Code</label>
                          <input
                            type="text"
                            placeholder="Zip Code"
                            value={iraForm.mailingZipCode}
                            onChange={e => setIraForm({ ...iraForm, mailingZipCode: e.target.value })}
                            className="w-full h-[40px] rounded-[8px] border border-[#E5E7EB] px-4 text-[13px] font-helvetica outline-none focus:border-[#D1A94C] bg-white"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>


                <div className="flex justify-end gap-3 pt-6 border-t font-helvetica">
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="px-8 py-2.5 rounded-full border border-[#E5E7EB] text-sm font-semibold text-[#6B7280] hover:bg-[#FAFAFA] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveIRA}
                    disabled={loading}
                    className="flex items-center gap-2 rounded-full bg-[#FFC63F] px-10 py-2.5 text-sm font-bold text-[#1F1F1F] hover:bg-[#F2B62F] transition-all shadow-md"
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── TRANSFER IRA MODAL ─── */}
      {showTransferModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-[20px] bg-white shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between border-b bg-white px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#FFF8E1]">
                  <History className="h-4 w-4 text-[#D1A94C]" />
                </div>
                <h2 className="text-[18px] font-bold text-[#1F1F1F] font-goudy">Transfer IRA</h2>
              </div>
              <button
                onClick={() => setShowTransferModal(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-[#FAFAFA] text-[#9CA3AF] hover:bg-[#F3F4F6] transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div>
                <label className="block text-[12px] font-medium text-[#6B7280] mb-1 font-helvetica">Account Number</label>
                <input
                  type="text"
                  placeholder="Enter current account number"
                  value={transferForm.accountNumber}
                  onChange={e => setTransferForm({ ...transferForm, accountNumber: e.target.value })}
                  className="w-full h-[42px] rounded-[8px] border border-[#E5E7EB] px-4 text-[13px] font-helvetica outline-none focus:border-[#D1A94C] bg-white transition-all"
                />
              </div>
              <div>
                <label className="block text-[12px] font-medium text-[#6B7280] mb-1 font-helvetica">Previous Custodian Name</label>
                <input
                  type="text"
                  placeholder="e.g. Fidelity, Vanguard"
                  value={transferForm.custodian}
                  onChange={e => setTransferForm({ ...transferForm, custodian: e.target.value })}
                  className="w-full h-[42px] rounded-[8px] border border-[#E5E7EB] px-4 text-[13px] font-helvetica outline-none focus:border-[#D1A94C] bg-white transition-all"
                />
              </div>

              <div className="pt-2">
                <button
                  onClick={handleTransferIRA}
                  className="w-full h-[45px] bg-[#D1A94C] text-white rounded-full text-sm font-semibold shadow-md hover:bg-[#B89440] transition-colors flex items-center justify-center gap-2"
                >
                  Transfer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
