'use client';

import { useState, useEffect, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/lib/api/client';
import { Country, State, City } from 'country-state-city';
import { Combobox } from '@/components/ui/combobox';
import { X, Plus, Loader2, User, MapPin, FileText, ChevronDown, Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AdminAddSubaccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  targetInvestorId: string;
}

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

export function AdminAddSubaccountModal({ isOpen, onClose, onSuccess, targetInvestorId }: AdminAddSubaccountModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [fetchingUser, setFetchingUser] = useState(true);
  const [parentInvestor, setParentInvestor] = useState<any>(null);
  
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
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (isOpen && targetInvestorId) {
      fetchParentDetails();
    }
  }, [isOpen, targetInvestorId]);

  const fetchParentDetails = async () => {
    setFetchingUser(true);
    try {
      const data = await apiClient.getUserById(targetInvestorId);
      setParentInvestor(data);
      
      // Determine country code for state/city lookup
      const countryObj = Country.getAllCountries().find(c => c.name === data.country || c.isoCode === data.country);
      const countryCode = countryObj?.isoCode || 'US';

      let stateCode = data.state || '';
      if (stateCode && countryCode) {
        const stateObj = State.getStatesOfCountry(countryCode).find(s => s.name === stateCode || s.isoCode === stateCode);
        stateCode = stateObj?.isoCode || stateCode;
      }

      // Pre-fill address fields from parent investor to make it easy
      setSubForm(prev => ({
        ...prev,
        addressLine1: data.addressLine1 || '',
        addressLine2: data.addressLine2 || '',
        city: data.city || '',
        state: stateCode,
        zipCode: data.zipCode || '',
        country: countryCode,
      }));
    } catch (error) {
      console.error('Failed to fetch parent investor details:', error);
      toast({
        title: 'Error',
        description: 'Failed to load parent investor details',
        variant: 'destructive',
      });
      onClose();
    } finally {
      setFetchingUser(false);
    }
  };

  const countries = useMemo(() => {
    const allCountries = Country.getAllCountries();
    return [
      ...allCountries.filter(c => c.isoCode === 'US'),
      ...allCountries.filter(c => c.isoCode !== 'US').sort((a, b) => a.name.localeCompare(b.name))
    ];
  }, []);

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

  const validate = () => {
    const e: Record<string, string> = {};
    if (!subForm.email.trim()) e.email = 'Email is required';
    if (!subForm.password.trim()) e.password = 'Password is required';
    
    if (subAccountType === 'minor') {
      if (!subForm.firstName.trim()) e.firstName = 'First name is required';
      if (!subForm.lastName.trim()) e.lastName = 'Last name is required';
      if (!subForm.dob) e.dob = 'Date of birth is required';
      if (!subForm.addressLine1.trim()) e.addressLine1 = 'Street address line 1 is required';
      if (!subForm.city.trim()) e.city = 'City is required';
      if (!subForm.state.trim()) e.state = 'State is required';
      if (!subForm.zipCode.trim()) e.zipCode = 'ZIP code is required';
      if (!subForm.country.trim()) e.country = 'Country is required';
      if (!subForm.taxId.trim()) e.taxId = 'Tax ID (SSN) is required';
    } else {
      if (!subForm.entityName.trim()) e.entityName = 'Legal Entity Name is required';
      if (!subForm.entityType.trim()) e.entityType = 'Entity Type is required';
      if (!subForm.taxId.trim()) e.taxId = 'Tax ID (EIN) is required';
      if (!subForm.addressLine1.trim()) e.addressLine1 = 'Street address line 1 is required';
      if (!subForm.city.trim()) e.city = 'City is required';
      if (!subForm.state.trim()) e.state = 'State is required';
      if (!subForm.zipCode.trim()) e.zipCode = 'ZIP code is required';
      if (!subForm.country.trim()) e.country = 'Country is required';
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleCreateSubaccount = async () => {
    if (!validate()) return;
    setLoading(true);
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
        parentId: targetInvestorId, // Admin specifies parent ID
      };

      await apiClient.createSubaccount(payload);
      
      toast({
        title: 'Success',
        description: 'Sub-account created successfully',
        className: 'bg-green-50 border-green-200 text-green-800'
      });
      
      onSuccess();
      onClose();
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to create sub-account',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 mt-30 md:mt-0">
      <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-[10px] bg-white shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-white px-3 md:px-8 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#FFF8E1]">
              <Plus className="h-5 w-5 text-[#D1A94C]" />
            </div>
            <h2 className="text-[18px] md:text-[22px] font-bold text-[#1F1F1F] font-goudy">Admin: Create Sub Account</h2>
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
            <p className="text-[14px] text-[#6B7280] font-helvetica">Loading parent investor details...</p>
          </div>
        ) : (
          <div className="p-8">
            <div className="flex flex-col gap-8">
              
              {/* SECTION: Parent Investor Info (Read-Only) */}
              <div className="rounded-[16px] border border-[#F0F0F0] bg-[#FAFAFA] p-4 md:p-6">
                <div className="flex items-center gap-2 mb-4">
                  <User className="h-4 w-4 text-[#D1A94C]" />
                  <h3 className="text-[15px] font-bold text-[#1F1F1F] font-goudy">Parent Investor Details</h3>
                </div>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  <div>
                    <p className="text-[11px] font-medium text-[#9CA3AF] mb-1 uppercase tracking-wider font-helvetica">Parent Name</p>
                    <p className="text-[14px] text-[#1F1F1F] font-semibold font-helvetica">
                      {parentInvestor?.firstName || ''} {parentInvestor?.lastName || ''}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] font-medium text-[#9CA3AF] mb-1 uppercase tracking-wider font-helvetica">Parent Email</p>
                    <p className="text-[14px] text-[#1F1F1F] font-semibold font-helvetica">{parentInvestor?.email || '-'}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-medium text-[#9CA3AF] mb-1 uppercase tracking-wider font-helvetica">Investor Type</p>
                    <span className="inline-flex items-center rounded-full bg-[#E1F7E3] px-2.5 py-0.5 text-xs font-medium text-[#2D8A39] capitalize">
                      {parentInvestor?.investorType || 'Personal'}
                    </span>
                  </div>
                </div>
              </div>

              {/* SECTION: Sub-Account Configuration */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <FileText className="h-4 w-4 text-[#D1A94C]" />
                  <h3 className="text-[16px] font-bold text-[#1F1F1F] font-goudy border-b pb-1">Sub Account Details</h3>
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  <div>
                    <label className="block text-[12px] font-medium text-[#6B7280] mb-1 font-helvetica">Sub-Account Type</label>
                    <div className="relative">
                      <select
                        value={subAccountType}
                        onChange={(e) => {
                          setSubAccountType(e.target.value as 'minor' | 'entity');
                          setErrors({});
                        }}
                        className="h-[40px] w-full appearance-none rounded-[8px] border border-[#E5E7EB] px-4 text-[13px] text-[#1F1F1F] outline-none focus:border-[#D1A94C] bg-white transition-all shadow-sm"
                      >
                        <option value="minor">Minor</option>
                        <option value="entity">Entity</option>
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#A2A5AA]" />
                    </div>
                  </div>
                </div>

                <div className="grid gap-5 md:grid-cols-2 mt-5">
                  {subAccountType === 'minor' ? (
                    <>
                      <div>
                        <label className="block text-[12px] font-medium text-[#6B7280] mb-1 font-helvetica">First Name</label>
                        <input
                          type="text"
                          placeholder="Minor's first name"
                          value={subForm.firstName}
                          onChange={(e) => {
                            setSubForm(prev => ({ ...prev, firstName: e.target.value }));
                            setErrors(prev => ({ ...prev, firstName: '' }));
                          }}
                          className={cn(
                            "w-full h-[40px] rounded-[8px] border border-[#E5E7EB] px-4 text-[13px] font-helvetica outline-none focus:border-[#D1A94C] bg-white transition-all shadow-sm",
                            errors.firstName && "border-[#E05252]"
                          )}
                        />
                        {errors.firstName && <p className="mt-1 text-[11px] text-red-500">{errors.firstName}</p>}
                      </div>
                      <div>
                        <label className="block text-[12px] font-medium text-[#6B7280] mb-1 font-helvetica">Last Name</label>
                        <input
                          type="text"
                          placeholder="Minor's last name"
                          value={subForm.lastName}
                          onChange={(e) => {
                            setSubForm(prev => ({ ...prev, lastName: e.target.value }));
                            setErrors(prev => ({ ...prev, lastName: '' }));
                          }}
                          className={cn(
                            "w-full h-[40px] rounded-[8px] border border-[#E5E7EB] px-4 text-[13px] font-helvetica outline-none focus:border-[#D1A94C] bg-white transition-all shadow-sm",
                            errors.lastName && "border-[#E05252]"
                          )}
                        />
                        {errors.lastName && <p className="mt-1 text-[11px] text-red-500">{errors.lastName}</p>}
                      </div>
                      <div>
                        <label className="block text-[12px] font-medium text-[#6B7280] mb-1 font-helvetica">Date of Birth</label>
                        <input
                          type="date"
                          value={subForm.dob}
                          onChange={(e) => {
                            setSubForm(prev => ({ ...prev, dob: e.target.value }));
                            setErrors(prev => ({ ...prev, dob: '' }));
                          }}
                          className={cn(
                            "w-full h-[40px] rounded-[8px] border border-[#E5E7EB] px-4 text-[13px] font-helvetica outline-none focus:border-[#D1A94C] bg-white transition-all shadow-sm",
                            errors.dob && "border-[#E05252]"
                          )}
                        />
                        {errors.dob && <p className="mt-1 text-[11px] text-red-500">{errors.dob}</p>}
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <label className="block text-[12px] font-medium text-[#6B7280] mb-1 font-helvetica">Legal Entity Name</label>
                        <input
                          type="text"
                          placeholder="Legal Entity Name"
                          value={subForm.entityName}
                          onChange={(e) => {
                            setSubForm(prev => ({ ...prev, entityName: e.target.value }));
                            setErrors(prev => ({ ...prev, entityName: '' }));
                          }}
                          className={cn(
                            "w-full h-[40px] rounded-[8px] border border-[#E5E7EB] px-4 text-[13px] font-helvetica outline-none focus:border-[#D1A94C] bg-white transition-all shadow-sm",
                            errors.entityName && "border-[#E05252]"
                          )}
                        />
                        {errors.entityName && <p className="mt-1 text-[11px] text-red-500">{errors.entityName}</p>}
                      </div>
                      <div>
                        <label className="block text-[12px] font-medium text-[#6B7280] mb-1 font-helvetica">Entity Type</label>
                        <div className="relative">
                          <select
                            value={subForm.entityType}
                            onChange={(e) => setSubForm(prev => ({ ...prev, entityType: e.target.value }))}
                            className="h-[40px] w-full appearance-none rounded-[8px] border border-[#E5E7EB] px-4 text-[13px] text-[#1F1F1F] outline-none focus:border-[#D1A94C] bg-white transition-all shadow-sm"
                          >
                            <option value="LLC">LLC</option>
                            <option value="Corporation">Corporation</option>
                            <option value="Trust">Trust</option>
                            <option value="Partnership">Partnership</option>
                            <option value="Nonprofit">Nonprofit</option>
                            <option value="Others">Others</option>
                          </select>
                          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#A2A5AA]" />
                        </div>
                      </div>
                    </>
                  )}

                  <div>
                    <label className="block text-[12px] font-medium text-[#6B7280] mb-1 font-helvetica">Email Address</label>
                    <input
                      type="email"
                      placeholder="Sub-account email"
                      value={subForm.email}
                      onChange={(e) => {
                        setSubForm(prev => ({ ...prev, email: e.target.value }));
                        setErrors(prev => ({ ...prev, email: '' }));
                      }}
                      className={cn(
                        "w-full h-[40px] rounded-[8px] border border-[#E5E7EB] px-4 text-[13px] font-helvetica outline-none focus:border-[#D1A94C] bg-white transition-all shadow-sm",
                        errors.email && "border-[#E05252]"
                      )}
                    />
                    {errors.email && <p className="mt-1 text-[11px] text-red-500">{errors.email}</p>}
                  </div>

                  <div>
                    <label className="block text-[12px] font-medium text-[#6B7280] mb-1 font-helvetica">Password</label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Sub-account password"
                        value={subForm.password}
                        onChange={(e) => {
                          setSubForm(prev => ({ ...prev, password: e.target.value }));
                          setErrors(prev => ({ ...prev, password: '' }));
                        }}
                        className={cn(
                          "w-full h-[40px] rounded-[8px] border border-[#E5E7EB] pl-4 pr-10 text-[13px] font-helvetica outline-none focus:border-[#D1A94C] bg-white transition-all shadow-sm",
                          errors.password && "border-[#E05252]"
                        )}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A2A5AA] hover:text-[#4B4B4B]"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {errors.password && <p className="mt-1 text-[11px] text-red-500">{errors.password}</p>}
                  </div>

                  <div>
                    <label className="block text-[12px] font-medium text-[#6B7280] mb-1 font-helvetica">Phone Number</label>
                    <div className="grid grid-cols-[120px_minmax(0,1fr)] gap-2">
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
                            setErrors((prev) => ({ ...prev, phone: '' }));
                          }}
                          className="h-[40px] w-full appearance-none rounded-[8px] border border-[#E5E7EB] px-3 text-[12px] text-[#4B4B4B] outline-none bg-white shadow-sm"
                        >
                          {COUNTRY_CODES.map(code => (
                            <option key={code} value={code}>{code}</option>
                          ))}
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-[#A2A5AA]" />
                      </div>
                      <input
                        type="text"
                        placeholder="Enter phone number"
                        value={subForm.phone}
                        onChange={(event) => {
                          const val = formatPhoneNumber(event.target.value, subForm.countryCode);
                          setSubForm((prev) => ({
                            ...prev,
                            phone: val,
                          }));
                          setErrors((prev) => ({ ...prev, phone: '' }));
                        }}
                        className={cn(
                          "w-full h-[40px] rounded-[8px] border border-[#E5E7EB] px-4 text-[13px] font-helvetica outline-none focus:border-[#D1A94C] bg-white transition-all shadow-sm",
                          errors.phone && "border-[#E05252]"
                        )}
                      />
                    </div>
                    {errors.phone && <p className="mt-1 text-[11px] text-red-500">{errors.phone}</p>}
                  </div>

                  <div>
                    <label className="block text-[12px] font-medium text-[#6B7280] mb-1 font-helvetica">
                      Tax ID ({subAccountType === 'minor' ? 'SSN' : 'EIN'})
                    </label>
                    <input
                      type="text"
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
                        setErrors(prev => ({ ...prev, taxId: '' }));
                      }}
                      className={cn(
                        "w-full h-[40px] rounded-[8px] border border-[#E5E7EB] px-4 text-[13px] font-helvetica outline-none focus:border-[#D1A94C] bg-white transition-all shadow-sm",
                        errors.taxId && "border-[#E05252]"
                      )}
                    />
                    {errors.taxId && <p className="mt-1 text-[11px] text-red-500">{errors.taxId}</p>}
                  </div>
                </div>
              </div>

              {/* SECTION: Address Details */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <MapPin className="h-4 w-4 text-[#D1A94C]" />
                  <h3 className="text-[16px] font-bold text-[#1F1F1F] font-goudy border-b pb-1">Address Details</h3>
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  <div>
                    <label className="block text-[12px] font-medium text-[#6B7280] mb-1 font-helvetica">Street Address Line 1</label>
                    <input
                      type="text"
                      placeholder="Street Address Line 1"
                      value={subForm.addressLine1}
                      onChange={(e) => {
                        setSubForm(prev => ({ ...prev, addressLine1: e.target.value }));
                        setErrors(prev => ({ ...prev, addressLine1: '' }));
                      }}
                      className={cn(
                        "w-full h-[40px] rounded-[8px] border border-[#E5E7EB] px-4 text-[13px] font-helvetica outline-none focus:border-[#D1A94C] bg-white transition-all shadow-sm",
                        errors.addressLine1 && "border-[#E05252]"
                      )}
                    />
                    {errors.addressLine1 && <p className="mt-1 text-[11px] text-red-500">{errors.addressLine1}</p>}
                  </div>

                  <div>
                    <label className="block text-[12px] font-medium text-[#6B7280] mb-1 font-helvetica">Street Address Line 2 (Optional)</label>
                    <input
                      type="text"
                      placeholder="Apartment, suite, unit, building, floor, etc."
                      value={subForm.addressLine2}
                      onChange={(e) => setSubForm(prev => ({ ...prev, addressLine2: e.target.value }))}
                      className="w-full h-[40px] rounded-[8px] border border-[#E5E7EB] px-4 text-[13px] font-helvetica outline-none focus:border-[#D1A94C] bg-white transition-all shadow-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-[12px] font-medium text-[#6B7280] mb-1 font-helvetica">Country</label>
                    <Combobox
                      options={countries.map(c => ({ value: c.isoCode, label: c.name }))}
                      value={subForm.country}
                      onChange={(val) => {
                        setSubForm((prev) => ({ ...prev, country: val, state: '', city: '' }));
                        setErrors((prev) => ({ ...prev, country: '' }));
                      }}
                      placeholder="Select Country"
                      className={cn("w-full h-[40px]", errors.country && "!border-[#E05252]")}
                    />
                    {errors.country && <p className="mt-1 text-[11px] text-red-500">{errors.country}</p>}
                  </div>

                  <div>
                    <label className="block text-[12px] font-medium text-[#6B7280] mb-1 font-helvetica">State / Province</label>
                    <Combobox
                      options={subStates.map(s => ({ value: s.isoCode, label: s.name }))}
                      value={subForm.state}
                      onChange={(val) => {
                        setSubForm((prev) => ({ ...prev, state: val, city: '' }));
                        setErrors((prev) => ({ ...prev, state: '' }));
                      }}
                      placeholder="Select State"
                      className={cn("w-full h-[40px]", errors.state && "!border-[#E05252]")}
                      disabled={!subForm.country}
                    />
                    {errors.state && <p className="mt-1 text-[11px] text-red-500">{errors.state}</p>}
                  </div>

                  <div>
                    <label className="block text-[12px] font-medium text-[#6B7280] mb-1 font-helvetica">City</label>
                    <Combobox
                      options={subCities.map(c => ({ value: c.name, label: c.name }))}
                      value={subForm.city}
                      onChange={(val) => {
                        setSubForm((prev) => ({ ...prev, city: val }));
                        setErrors((prev) => ({ ...prev, city: '' }));
                      }}
                      placeholder="Select City"
                      className={cn("w-full h-[40px]", errors.city && "!border-[#E05252]")}
                      disabled={!subForm.state}
                    />
                    {errors.city && <p className="mt-1 text-[11px] text-red-500">{errors.city}</p>}
                  </div>

                  <div>
                    <label className="block text-[12px] font-medium text-[#6B7280] mb-1 font-helvetica">ZIP / Postal Code</label>
                    <input
                      type="text"
                      placeholder="ZIP Code"
                      value={subForm.zipCode}
                      onChange={(e) => {
                        setSubForm(prev => ({ ...prev, zipCode: e.target.value }));
                        setErrors(prev => ({ ...prev, zipCode: '' }));
                      }}
                      className={cn(
                        "w-full h-[40px] rounded-[8px] border border-[#E5E7EB] px-4 text-[13px] font-helvetica outline-none focus:border-[#D1A94C] bg-white transition-all shadow-sm",
                        errors.zipCode && "border-[#E05252]"
                      )}
                    />
                    {errors.zipCode && <p className="mt-1 text-[11px] text-red-500">{errors.zipCode}</p>}
                  </div>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex items-center justify-end gap-3 pt-6 border-t mt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2.5 rounded-full text-[14px] font-medium text-[#6B7280] bg-[#F3F4F6] hover:bg-[#E5E7EB] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCreateSubaccount}
                  disabled={loading}
                  className="flex items-center gap-2 px-8 py-2.5 rounded-full text-[14px] font-medium text-[#1F2937] bg-[#FCD34D] hover:bg-[#FBD24E] shadow-md transition-all disabled:opacity-50"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create Sub Account'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
