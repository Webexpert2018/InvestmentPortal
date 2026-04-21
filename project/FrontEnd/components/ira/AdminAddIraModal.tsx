'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/lib/api/client';
import { Country, State, City } from 'country-state-city';
import { Combobox } from '@/components/ui/combobox';
import { X, Plus, Loader2, User, MapPin, FileText } from 'lucide-react';

interface AdminAddIraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  targetInvestorId: string;
}

export function AdminAddIraModal({ isOpen, onClose, onSuccess, targetInvestorId }: AdminAddIraModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [fetchingUser, setFetchingUser] = useState(true);
  const [investor, setInvestor] = useState<any>(null);
  const [accountTypes, setAccountTypes] = useState<any[]>([]);
  const [errors, setErrors] = useState<{ [k: string]: string }>({});

  const [iraForm, setIraForm] = useState({
    accountType: 'Traditional',
    accountNumber: '',
    custodian: '',
    beneficiary: '',
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
    username: '',
    referralSource: '',
  });

  useEffect(() => {
    if (isOpen && targetInvestorId) {
      fetchInvestorDetails();
      fetchAccountTypes();
    }
  }, [isOpen, targetInvestorId]);

  const fetchAccountTypes = async () => {
    try {
      const data = await apiClient.getIraAccountTypes();
      setAccountTypes(data);
    } catch (error) {
      console.error('Failed to fetch account types:', error);
    }
  };

  const fetchInvestorDetails = async () => {
    setFetchingUser(true);
    try {
      const data = await apiClient.getUserById(targetInvestorId);
      setInvestor(data);
      // Pre-fill some defaults based on investor name
      setIraForm(prev => ({
        ...prev,
        username: `${data.firstName.toLowerCase()}_${Math.floor(100 + Math.random() * 900)}`,
        mailingAddress1: data.addressLine1 || '',
        mailingAddress2: data.addressLine2 || '',
        mailingCity: data.city || '',
        mailingState: data.state || '',
        mailingZipCode: data.zipCode || '',
        mailingCountry: data.country || '',
      }));
    } catch (error) {
      console.error('Failed to fetch investor details:', error);
      toast({
        title: 'Error',
        description: 'Failed to load investor details',
        variant: 'destructive',
      });
      onClose();
    } finally {
      setFetchingUser(false);
    }
  };

  const validate = () => {
    const e: { [k: string]: string } = {};
    if (!iraForm.accountType.trim()) e.accountType = 'Please enter account type.';
    if (!iraForm.accountNumber.trim()) e.accountNumber = 'Please enter account number.';
    if (!iraForm.custodian.trim()) e.custodian = 'Please enter custodian name.';
    if (!iraForm.beneficiary.trim()) e.beneficiary = 'Please enter beneficiary name.';
    if (!iraForm.maritalStatus) e.maritalStatus = 'Please select marital status.';
    if (!iraForm.username.trim()) e.username = 'Please enter username.';

    if (!iraForm.mailingAddressSame) {
      if (!iraForm.mailingAddress1?.trim()) e.mailingAddress1 = 'Please enter mailing address.';
      if (!iraForm.mailingCity?.trim()) e.mailingCity = 'Please enter city.';
      if (!iraForm.mailingState?.trim()) e.mailingState = 'Please select state.';
      if (!iraForm.mailingCountry?.trim()) e.mailingCountry = 'Please select country.';
      if (!iraForm.mailingZipCode?.trim()) e.mailingZipCode = 'Please enter zip code.';
    }

    const ssnDigits = iraForm.ssn.replace(/[^0-9]/g, '');
    if (!iraForm.ssn.trim()) e.ssn = 'Please enter Social Security Number.';
    else if (!(ssnDigits.length === 9)) e.ssn = 'SSN must contain 9 digits.';

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSaveIRA = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await apiClient.createIRAAccount({
        targetUserId: targetInvestorId,
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
        ssn: iraForm.ssn,
        // Sync profile fields
        firstName: investor.firstName,
        lastName: investor.lastName,
        email: investor.email,
        dob: investor.dob,
        phone: investor.phone,
        taxId: investor.taxId,
        physicalAddress1: investor.addressLine1,
        physicalAddress2: investor.addressLine2,
        city: investor.city,
        state: investor.state,
        zipCode: investor.zipCode,
        country: investor.country,
      });

      toast({
        title: 'IRA saved',
        description: 'IRA account created successfully for the investor.',
        className: 'bg-green-50 border-green-200 text-green-800'
      });

      onSuccess();
      onClose();
    } catch (error: any) {
      toast({
        title: error?.status === 409 ? 'Duplicate Account Type' : 'Error',
        description: error?.message || 'Failed to create IRA account',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 mt-20 md:mt-0">
      <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-[20px] bg-white shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-white px-8 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#FFF8E1]">
              <Plus className="h-5 w-5 text-[#D1A94C]" />
            </div>
            <h2 className="text-[22px] font-bold text-[#1F1F1F] font-goudy">Admin: Add IRA for Investor</h2>
          </div>
          <button
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-[#FAFAFA] text-[#9CA3AF] hover:bg-[#F3F4F6] transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {fetchingUser ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-[#D1A94C] mb-4" />
            <p className="text-[14px] text-[#6B7280] font-helvetica">Loading investor profile...</p>
          </div>
        ) : (
          <div className="p-8">
            <div className="flex flex-col gap-8">
              
              {/* SECTION: Investor Profile (Read-Only) */}
              <div className="rounded-[16px] border border-[#F0F0F0] bg-[#FAFAFA] p-6">
                <div className="flex items-center gap-2 mb-4">
                  <User className="h-4 w-4 text-[#D1A94C]" />
                  <h3 className="text-[15px] font-bold text-[#1F1F1F] font-goudy">Investor Profile (Non-Editable)</h3>
                </div>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  <ReadOnlyField label="First Name" value={investor.firstName} />
                  <ReadOnlyField label="Last Name" value={investor.lastName} />
                  <ReadOnlyField label="Email Address" value={investor.email} />
                  <ReadOnlyField label="Date of Birth" value={investor.dob ? new Date(investor.dob).toLocaleDateString() : '-'} />
                  <ReadOnlyField label="Tax ID / SSN on Profile" value={investor.taxId || '-'} />
                  <ReadOnlyField label="Phone" value={investor.phone || '-'} />
                </div>
                
                <div className="mt-6 border-t border-[#ECEDED] pt-6">
                  <div className="flex items-center gap-2 mb-4">
                    <MapPin className="h-4 w-4 text-[#D1A94C]" />
                    <h4 className="text-[14px] font-bold text-[#1F1F1F] font-goudy">Physical Address</h4>
                  </div>
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    <ReadOnlyField label="Street" value={investor.addressLine1} />
                    <ReadOnlyField label="City" value={investor.city} />
                    <ReadOnlyField label="State" value={investor.state} />
                    <ReadOnlyField label="Country" value={investor.country} />
                    <ReadOnlyField label="Zip Code" value={investor.zipCode} />
                  </div>
                </div>
              </div>

              {/* SECTION: IRA Details (Editable) */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <FileText className="h-4 w-4 text-[#D1A94C]" />
                  <h3 className="text-[16px] font-bold text-[#1F1F1F] font-goudy border-b pb-1">IRA Account Details (Editable)</h3>
                </div>
                
                <div className="grid gap-5 md:grid-cols-2">
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
                  <div>
                    <label className="block text-[12px] font-medium text-[#6B7280] mb-1 font-helvetica">Account Number</label>
                    <input
                      type="text"
                      placeholder="Enter account number"
                      value={iraForm.accountNumber}
                      onChange={e => setIraForm({ ...iraForm, accountNumber: e.target.value })}
                      className="w-full h-[40px] rounded-[8px] border border-[#E5E7EB] px-4 text-[13px] font-helvetica outline-none focus:border-[#D1A94C] bg-white transition-all shadow-sm"
                    />
                    {errors.accountNumber && <p className="mt-1 text-[11px] text-red-500">{errors.accountNumber}</p>}
                  </div>
                  <div>
                    <label className="block text-[12px] font-medium text-[#6B7280] mb-1 font-helvetica">Custodian</label>
                    <input
                      type="text"
                      placeholder="Enter custodian name"
                      value={iraForm.custodian}
                      onChange={e => setIraForm({ ...iraForm, custodian: e.target.value })}
                      className="w-full h-[40px] rounded-[8px] border border-[#E5E7EB] px-4 text-[13px] font-helvetica outline-none focus:border-[#D1A94C] bg-white transition-all shadow-sm"
                    />
                    {errors.custodian && <p className="mt-1 text-[11px] text-red-500">{errors.custodian}</p>}
                  </div>
                  <div>
                    <label className="block text-[12px] font-medium text-[#6B7280] mb-1 font-helvetica">Beneficiary</label>
                    <input
                      type="text"
                      placeholder="Enter primary beneficiary"
                      value={iraForm.beneficiary}
                      onChange={e => setIraForm({ ...iraForm, beneficiary: e.target.value })}
                      className="w-full h-[40px] rounded-[8px] border border-[#E5E7EB] px-4 text-[13px] font-helvetica outline-none focus:border-[#D1A94C] bg-white transition-all shadow-sm"
                    />
                    {errors.beneficiary && <p className="mt-1 text-[11px] text-red-500">{errors.beneficiary}</p>}
                  </div>
                  <div>
                    <label className="block text-[12px] font-medium text-[#6B7280] mb-1 font-helvetica">Social Security Number (Required)</label>
                    <input
                      type="text"
                      placeholder="XXX-XX-XXXX"
                      value={iraForm.ssn}
                      onChange={e => setIraForm({ ...iraForm, ssn: e.target.value })}
                      className="w-full h-[40px] rounded-[8px] border border-[#E5E7EB] px-4 text-[13px] font-helvetica outline-none focus:border-[#D1A94C] bg-white transition-all shadow-sm"
                    />
                    {errors.ssn && <p className="mt-1 text-[11px] text-red-500">{errors.ssn}</p>}
                  </div>
                  <div>
                    <label className="block text-[12px] font-medium text-[#6B7280] mb-1 font-helvetica">Username</label>
                    <input
                      type="text"
                      placeholder="Enter username"
                      value={iraForm.username}
                      onChange={e => setIraForm({ ...iraForm, username: e.target.value })}
                      className="w-full h-[40px] rounded-[8px] border border-[#E5E7EB] px-4 text-[13px] font-helvetica outline-none focus:border-[#D1A94C] bg-white shadow-sm"
                    />
                    {errors.username && <p className="mt-1 text-[11px] text-red-500">{errors.username}</p>}
                  </div>
                </div>

                <div className="grid gap-5 md:grid-cols-2 mt-4">
                   <div>
                      <label className="block text-[12px] font-medium text-[#6B7280] mb-1 font-helvetica">Middle Name</label>
                      <input
                        type="text"
                        placeholder="Optional"
                        value={iraForm.middleName}
                        onChange={e => setIraForm({ ...iraForm, middleName: e.target.value })}
                        className="w-full h-[40px] rounded-[8px] border border-[#E5E7EB] px-4 text-[13px] font-helvetica outline-none focus:border-[#D1A94C]"
                      />
                    </div>
                    <div>
                      <label className="block text-[12px] font-medium text-[#6B7280] mb-1 font-helvetica">Suffix</label>
                      <input
                        type="text"
                        placeholder="e.g. Jr, Sr"
                        value={iraForm.suffix}
                        onChange={e => setIraForm({ ...iraForm, suffix: e.target.value })}
                        className="w-full h-[40px] rounded-[8px] border border-[#E5E7EB] px-4 text-[13px] font-helvetica outline-none focus:border-[#D1A94C]"
                      />
                    </div>
                </div>

                {/* Marital Status */}
                <div className="mt-6">
                  <label className="block text-[12px] font-medium text-[#6B7280] mb-3 font-helvetica">Marital Status</label>
                  <div className="flex gap-8">
                    <RadioOption 
                      label="Single" 
                      selected={iraForm.maritalStatus === 'single'} 
                      onClick={() => setIraForm({ ...iraForm, maritalStatus: 'single' })} 
                    />
                    <RadioOption 
                      label="Married" 
                      selected={iraForm.maritalStatus === 'married'} 
                      onClick={() => setIraForm({ ...iraForm, maritalStatus: 'married' })} 
                    />
                  </div>
                </div>
              </div>

              {/* Mailing Address Toggle */}
              <div>
                 <div className="flex items-center justify-between mb-4">
                    <p className="text-[14px] font-medium text-[#1F1F1F] font-helvetica">Mailing address same as physical address?</p>
                    <div className="flex gap-4">
                       <RadioOption label="Yes" selected={iraForm.mailingAddressSame === true} onClick={() => setIraForm({...iraForm, mailingAddressSame: true})} />
                       <RadioOption label="No" selected={iraForm.mailingAddressSame === false} onClick={() => setIraForm({...iraForm, mailingAddressSame: false})} />
                    </div>
                 </div>

                 {!iraForm.mailingAddressSame && (
                    <div className="mt-4 grid gap-4 p-5 rounded-[12px] border border-[#E5E7EB] bg-[#FAFAFA]">
                        <div className="grid gap-4 md:grid-cols-2">
                           <InputField label="Mailing Address 1" value={iraForm.mailingAddress1} onChange={v => setIraForm({...iraForm, mailingAddress1: v})} />
                           <InputField label="Mailing Address 2" value={iraForm.mailingAddress2} onChange={v => setIraForm({...iraForm, mailingAddress2: v})} />
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
                           <InputField label="Zip Code" value={iraForm.mailingZipCode} onChange={v => setIraForm({...iraForm, mailingZipCode: v})} />
                        </div>
                    </div>
                 )}
              </div>

              {/* Form Actions */}
              <div className="flex items-center justify-end gap-3 pt-6 border-t mt-4">
                <button
                  onClick={onClose}
                  className="px-6 py-2.5 rounded-full text-[14px] font-medium text-[#6B7280] bg-[#F3F4F6] hover:bg-[#E5E7EB] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveIRA}
                  disabled={loading}
                  className="flex items-center gap-2 px-8 py-2.5 rounded-full text-[14px] font-medium text-[#1F2937] bg-[#FCD34D] hover:bg-[#FBD24E] shadow-md transition-all disabled:opacity-50"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create IRA Account'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* HELPER COMPONENTS */

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] font-medium text-[#9CA3AF] mb-1 uppercase tracking-wider font-helvetica">{label}</p>
      <p className="text-[14px] text-[#1F1F1F] font-semibold font-helvetica">{value || '-'}</p>
    </div>
  );
}

function InputField({ label, value, onChange, placeholder = "" }: { label: string, value: string, onChange: (v: string) => void, placeholder?: string }) {
   return (
      <div>
         <label className="block text-[12px] font-medium text-[#6B7280] mb-1 font-helvetica">{label}</label>
         <input
            type="text"
            placeholder={placeholder}
            value={value}
            onChange={e => onChange(e.target.value)}
            className="w-full h-[40px] rounded-[8px] border border-[#E5E7EB] px-4 text-[13px] font-helvetica outline-none focus:border-[#D1A94C] bg-white transition-all shadow-sm"
         />
      </div>
   )
}

function RadioOption({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <div className="flex items-center gap-2 cursor-pointer group" onClick={onClick}>
      <div className={`h-4 w-4 rounded-full border flex items-center justify-center transition-all ${selected ? 'border-[#D1A94C]' : 'border-[#E5E7EB] bg-white'}`}>
        {selected && <div className="h-2 w-2 rounded-full bg-[#D1A94C]" />}
      </div>
      <span className={`text-[14px] font-medium font-helvetica transition-colors ${selected ? 'text-[#1F1F1F]' : 'text-[#6B7280] group-hover:text-[#D1A94C]'}`}>{label}</span>
    </div>
  );
}
