'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/lib/api/client';
import { Country, State, City } from 'country-state-city';
import { Combobox } from '@/components/ui/combobox';
import { X, Pencil, Loader2, User, MapPin, FileText, Calendar, Phone, Mail } from 'lucide-react';

interface AdminEditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedData: any) => void;
  investor: any;
}

export function AdminEditProfileModal({ isOpen, onClose, onSuccess, investor }: AdminEditProfileModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [k: string]: string }>({});

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    phoneCode: '+1',
    dob: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'US',
    taxId: ''
  });

  useEffect(() => {
    if (isOpen && investor) {
      // Parse phone if possible
      let phone = investor.phone || '';
      let phoneCode = '+1';
      if (phone.startsWith('+')) {
        const parts = phone.split(' ');
        if (parts.length > 1) {
          phoneCode = parts[0];
          phone = parts.slice(1).join(' ');
        }
      }

      const countryObj = Country.getAllCountries().find(c => c.name === investor.country || c.isoCode === investor.country);
      const countryCode = countryObj?.isoCode || 'US';

      // Find state code if stored as name
      let stateCode = investor.state || '';
      if (stateCode) {
        const stateObj = State.getStatesOfCountry(countryCode).find(s => s.name === stateCode || s.isoCode === stateCode);
        stateCode = stateObj?.isoCode || stateCode;
      }

      setForm({
        firstName: investor.firstName || '',
        lastName: investor.lastName || '',
        email: investor.email || '',
        phone: phone,
        phoneCode: phoneCode,
        dob: investor.dob ? new Date(investor.dob).toISOString().split('T')[0] : '',
        addressLine1: investor.addressLine1 || '',
        addressLine2: investor.addressLine2 || '',
        city: investor.city || '',
        state: stateCode,
        country: countryCode,
        zipCode: investor.zipCode || '',
        taxId: investor.taxId || ''
      });
      setErrors({});
    }
  }, [isOpen, investor]);

  const validate = () => {
    const e: { [k: string]: string } = {};
    if (!form.firstName.trim()) e.firstName = 'First name is required.';
    if (!form.lastName.trim()) e.lastName = 'Last name is required.';
    if (form.phone && !/^\d+$/.test(form.phone.replace(/\D/g, ''))) e.phone = 'Invalid phone number.';
    
    if (form.taxId) {
        const cleanTax = form.taxId.replace(/\D/g, '');
        if (cleanTax.length !== 9) e.taxId = 'Tax ID / SSN must be 9 digits.';
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const countryObj = Country.getCountryByCode(form.country);
      const stateObj = State.getStateByCodeAndCountry(form.state, form.country);

      const updatedData = {
        firstName: form.firstName,
        lastName: form.lastName,
        phone: `${form.phoneCode} ${form.phone}`.trim(),
        dob: form.dob,
        addressLine1: form.addressLine1,
        addressLine2: form.addressLine2,
        city: form.city,
        state: stateObj?.name || form.state,
        zipCode: form.zipCode,
        country: countryObj?.name || form.country,
        taxId: form.taxId.replace(/\D/g, '')
      };

      const res = await apiClient.updateUser(investor.id, updatedData);
      
      toast({
        title: 'Profile Updated',
        description: 'Investor profile has been updated successfully.',
        className: 'bg-green-50 border-green-200 text-green-800'
      });

      onSuccess(res);
      onClose();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error?.message || 'Failed to update profile',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const allCountries = Country.getAllCountries().map(c => ({ label: c.name, value: c.isoCode }));
  const countries = [
    ...allCountries.filter(c => c.value === 'US'),
    ...allCountries.filter(c => c.value !== 'US')
  ];
  
  const states = State.getStatesOfCountry(form.country).map(s => ({ label: s.name, value: s.isoCode }));
  const cities = City.getCitiesOfState(form.country, form.state).map(c => ({ label: c.name, value: c.name }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-white px-8 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-50">
              <Pencil className="h-5 w-5 text-amber-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Edit Investor Profile</h2>
          </div>
          <button
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-50 text-gray-400 hover:bg-gray-100 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-8">
          <div className="grid gap-6">
            {/* Basic Identity */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <InputField 
                label="First Name" 
                value={form.firstName} 
                onChange={v => setForm({ ...form, firstName: v })} 
                error={errors.firstName}
              />
              <InputField 
                label="Last Name" 
                value={form.lastName} 
                onChange={v => setForm({ ...form, lastName: v })} 
                error={errors.lastName}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="email"
                    value={form.email}
                    disabled
                    className="w-full h-11 pl-10 pr-4 rounded-xl border border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed text-sm"
                  />
                </div>
                <p className="mt-1.5 text-[10px] text-gray-400">Email cannot be changed for security reasons</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Phone Number</label>
                <div className="flex gap-2">
                  <select
                    value={form.phoneCode}
                    onChange={e => setForm({ ...form, phoneCode: e.target.value })}
                    className="h-11 px-3 rounded-xl border border-gray-200 bg-white text-sm focus:ring-2 focus:ring-amber-200 focus:border-amber-400 outline-none transition-all"
                  >
                    <option value="+1">+1 (USA)</option>
                    <option value="+44">+44 (UK)</option>
                    <option value="+91">+91 (IND)</option>
                    <option value="+971">+971 (UAE)</option>
                  </select>
                  <div className="relative flex-1">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      value={form.phone}
                      onChange={e => setForm({ ...form, phone: e.target.value })}
                      placeholder="Phone number"
                      className="w-full h-11 pl-10 pr-4 rounded-xl border border-gray-200 bg-white text-sm focus:ring-2 focus:ring-amber-200 focus:border-amber-400 outline-none transition-all"
                    />
                  </div>
                </div>
                {errors.phone && <p className="mt-1 text-[10px] text-red-500">{errors.phone}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Date of Birth</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="date"
                    value={form.dob}
                    onChange={e => setForm({ ...form, dob: e.target.value })}
                    className="w-full h-11 pl-10 pr-4 rounded-xl border border-gray-200 bg-white text-sm focus:ring-2 focus:ring-amber-200 focus:border-amber-400 outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Tax ID / SSN</label>
                <div className="relative">
                  <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={form.taxId}
                    placeholder="XXX-XX-XXXX"
                    maxLength={11}
                    onChange={e => {
                        let val = e.target.value.replace(/\D/g, '');
                        if (val.length > 9) val = val.slice(0, 9);
                        let formatted = val;
                        if (val.length > 3 && val.length <= 5) formatted = `${val.slice(0, 3)}-${val.slice(3)}`;
                        else if (val.length > 5) formatted = `${val.slice(0, 3)}-${val.slice(3, 5)}-${val.slice(5)}`;
                        setForm({ ...form, taxId: formatted });
                    }}
                    className="w-full h-11 pl-10 pr-4 rounded-xl border border-gray-200 bg-white text-sm focus:ring-2 focus:ring-amber-200 focus:border-amber-400 outline-none transition-all"
                  />
                </div>
                {errors.taxId && <p className="mt-1 text-[10px] text-red-500">{errors.taxId}</p>}
              </div>
            </div>

            {/* Address */}
            <div className="space-y-4 pt-4 border-t border-gray-100">
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="h-4 w-4 text-amber-600" />
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Address Details</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InputField 
                  label="Street Address Line 1" 
                  value={form.addressLine1} 
                  onChange={v => setForm({ ...form, addressLine1: v })} 
                />
                <InputField 
                  label="Street Address Line 2 (Optional)" 
                  value={form.addressLine2} 
                  onChange={v => setForm({ ...form, addressLine2: v })} 
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Country</label>
                  <Combobox
                    options={countries}
                    value={form.country}
                    onChange={val => setForm({ ...form, country: val, state: '', city: '' })}
                    placeholder="Select Country"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-2">State</label>
                  <Combobox
                    options={states}
                    value={form.state}
                    onChange={val => setForm({ ...form, state: val, city: '' })}
                    placeholder="Select State"
                    disabled={!form.country}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-2">City</label>
                  <Combobox
                    options={cities}
                    value={form.city}
                    onChange={val => setForm({ ...form, city: val })}
                    placeholder="Select City"
                    disabled={!form.state}
                  />
                </div>
                <InputField 
                  label="ZIP Code" 
                  value={form.zipCode} 
                  onChange={v => setForm({ ...form, zipCode: v })} 
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-10 border-t border-gray-100 mt-8">
            <button
              onClick={onClose}
              className="px-6 py-2.5 rounded-full text-sm font-bold text-gray-500 bg-gray-100 hover:bg-gray-200 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="flex items-center gap-2 px-10 py-2.5 rounded-full text-sm font-bold text-gray-900 bg-amber-400 hover:bg-amber-500 shadow-lg shadow-amber-100 transition-all disabled:opacity-50 disabled:shadow-none"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Changes'}
            </button>
          </div>
          <p className="mt-4 text-center text-[10px] text-gray-400 italic">Your information is encrypted and secure</p>
        </div>
      </div>
    </div>
  );
}

function InputField({ label, value, onChange, error, placeholder = "" }: { label: string, value: string, onChange: (v: string) => void, error?: string, placeholder?: string }) {
  return (
    <div>
      <label className="block text-xs font-bold text-gray-400 uppercase mb-2">{label}</label>
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        className={`w-full h-11 px-4 rounded-xl border ${error ? 'border-red-500 focus:ring-red-200' : 'border-gray-200 focus:ring-amber-200 focus:border-amber-400'} bg-white text-sm outline-none transition-all focus:ring-2`}
      />
      {error && <p className="mt-1 text-[10px] text-red-500">{error}</p>}
    </div>
  );
}
