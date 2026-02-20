'use client';

import { useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DashboardLayout } from '@/components/DashboardLayout';
import { useRouter } from 'next/navigation';

export default function AddStaffPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    staffRole: '',
    associatedFund: '',
    fullName: '',
    email: '',
    phoneNumber: '',
    password: '',
  });
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  const staffRoles = [
    'Relations Associate',
    'Accountants',
    'Partnerships',
  ];

  const funds = [
    'ABC Fund',
    'XYZ Fund',
    'Global Fund',
  ];

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};
    
    if (!formData.staffRole) newErrors.staffRole = 'Staff role is required';
    if (!formData.associatedFund) newErrors.associatedFund = 'Associated fund is required';
    if (!formData.fullName) newErrors.fullName = 'Full name is required';
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    if (!formData.phoneNumber) newErrors.phoneNumber = 'Phone number is required';
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      // Handle form submission
      console.log('Form data:', formData);
      router.push('/dashboard/staff');
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <DashboardLayout>
      <div className="p-0">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
            <span className="font-medium">Back</span>
          </button>
          <div>
            <h1 className="text-xl sm:text-3xl font-bold text-[#1F1F1F] mb-2">Add Staff</h1>
            <p className="text-gray-600">Add a new staff member and assign appropriate permissions</p>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white rounded-lg shadow-sm p-8 max-w-4xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Staff Role */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Select Staff Role <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.staffRole}
                onChange={(e) => handleChange('staffRole', e.target.value)}
                className={`w-full px-4 py-2 border ${errors.staffRole ? 'border-red-500' : 'border-gray-200'} rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1F3B6E] focus:border-transparent`}
              >
                <option value="">Select staff role</option>
                {staffRoles.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
              {errors.staffRole && (
                <p className="mt-1 text-sm text-red-500">{errors.staffRole}</p>
              )}
            </div>

            {/* Associated Fund */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Associated Fund <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.associatedFund}
                onChange={(e) => handleChange('associatedFund', e.target.value)}
                className={`w-full px-4 py-2 border ${errors.associatedFund ? 'border-red-500' : 'border-gray-200'} rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1F3B6E] focus:border-transparent`}
              >
                <option value="">Select associated fund</option>
                {funds.map((fund) => (
                  <option key={fund} value={fund}>
                    {fund}
                  </option>
                ))}
              </select>
              {errors.associatedFund && (
                <p className="mt-1 text-sm text-red-500">{errors.associatedFund}</p>
              )}
            </div>

            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.fullName}
                onChange={(e) => handleChange('fullName', e.target.value)}
                placeholder="Enter full name"
                className={`w-full px-4 py-2 border ${errors.fullName ? 'border-red-500' : 'border-gray-200'} rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1F3B6E] focus:border-transparent`}
              />
              {errors.fullName && (
                <p className="mt-1 text-sm text-red-500">{errors.fullName}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder="Enter email"
                className={`w-full px-4 py-2 border ${errors.email ? 'border-red-500' : 'border-gray-200'} rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1F3B6E] focus:border-transparent`}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-500">{errors.email}</p>
              )}
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Phone Number <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                <select className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1F3B6E] focus:border-transparent w-24">
                  <option value="+1">+1 USA</option>
                  <option value="+44">+44 UK</option>
                  <option value="+91">+91 IND</option>
                </select>
                <input
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={(e) => handleChange('phoneNumber', e.target.value)}
                  placeholder="Enter phone number"
                  className={`flex-1 px-4 py-2 border ${errors.phoneNumber ? 'border-red-500' : 'border-gray-200'} rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1F3B6E] focus:border-transparent`}
                />
              </div>
              {errors.phoneNumber && (
                <p className="mt-1 text-sm text-red-500">{errors.phoneNumber}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Password <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => handleChange('password', e.target.value)}
                placeholder="Enter password"
                className={`w-full px-4 py-2 border ${errors.password ? 'border-red-500' : 'border-gray-200'} rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1F3B6E] focus:border-transparent`}
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-500">{errors.password}</p>
              )}
            </div>
          </div>

          {/* Buttons */}
          <div className="flex justify-between items-center mt-8">
            <Button
              onClick={() => router.back()}
              className="bg-[#FEF3E2] hover:bg-[#fde8c8] text-gray-900 px-8 py-2 rounded-full font-medium"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              className="bg-[#FCD34D] hover:bg-[#fbbf24] text-gray-900 px-8 py-2 rounded-full font-medium"
            >
              Save
            </Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
