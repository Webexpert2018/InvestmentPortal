'use client';

import { useState } from 'react';
import { Upload, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DashboardLayout } from '@/components/DashboardLayout';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('profile');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    countryCode: '+1 (USA)',
  });
  const [authenticatorApp, setAuthenticatorApp] = useState(false);
  const [smsBackupCodes, setSmsBackupCodes] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [selectedSession, setSelectedSession] = useState('');

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = () => {
    // Handle save logic
    console.log('Saving:', formData);
  };

  const handleCancel = () => {
    // Handle cancel logic
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phoneNumber: '',
      countryCode: '+1 (USA)',
    });
  };

  const handlePasswordInputChange = (field: string, value: string) => {
    setPasswordData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleUpdatePassword = () => {
    // Handle password update logic
    console.log('Updating password:', passwordData);
  };

  const handleDownloadRecoveryCodes = () => {
    // Handle download recovery codes
    console.log('Downloading recovery codes');
  };

  const handleLogOut = (session: string) => {
    setSelectedSession(session);
    setShowLogoutModal(true);
  };

  const confirmLogout = () => {
    // Handle logout from specific session
    console.log('Logging out from:', selectedSession);
    setShowLogoutModal(false);
    setSelectedSession('');
  };

  const cancelLogout = () => {
    setShowLogoutModal(false);
    setSelectedSession('');
  };

  const tabs = [
    { id: 'profile', label: 'Profile Information' },
    { id: 'security', label: 'Security & Login' },
  ];

  const countryCodes = [
    '+1 (USA)',
    '+44 (UK)',
    '+91 (India)',
    '+86 (China)',
    '+81 (Japan)',
    '+49 (Germany)',
    '+33 (France)',
    '+39 (Italy)',
  ];

  return (
    <DashboardLayout>
      <div className="p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
          <p className="text-gray-600">Manage your account preferences and security.</p>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <div className="flex gap-8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`pb-4 px-2 font-medium transition-colors relative ${
                    activeTab === tab.id
                      ? 'text-gray-900'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab.label}
                  {activeTab === tab.id && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#FCD34D]" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Profile Information Tab */}
        {activeTab === 'profile' && (
          <div className="bg-white rounded-lg shadow-sm p-8">
            {/* Profile Image Upload */}
            <div className="mb-8">
              <div className="flex items-center justify-center w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400 transition-colors">
                <div className="text-center">
                  <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">Upload</p>
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-2">Upload profile image here</p>
            </div>

            {/* Form Fields */}
            <div className="space-y-6 max-w-4xl">
              {/* First Name and Last Name */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    First Name
                  </label>
                  <input
                    type="text"
                    placeholder="Enter first name"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1F3B6E] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Last Name
                  </label>
                  <input
                    type="text"
                    placeholder="Enter last name"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1F3B6E] focus:border-transparent"
                  />
                </div>
              </div>

              {/* Email and Phone Number */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    placeholder="Enter email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1F3B6E] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Phone Number
                  </label>
                  <div className="flex gap-2">
                    <div className="relative">
                      <select
                        value={formData.countryCode}
                        onChange={(e) => handleInputChange('countryCode', e.target.value)}
                        className="appearance-none px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1F3B6E] focus:border-transparent bg-white cursor-pointer"
                      >
                        {countryCodes.map((code) => (
                          <option key={code} value={code}>
                            {code}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5 pointer-events-none" />
                    </div>
                    <input
                      type="tel"
                      placeholder="Enter phone number"
                      value={formData.phoneNumber}
                      onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1F3B6E] focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 mt-8 max-w-4xl">
              <Button
                onClick={handleCancel}
                className="px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                className="px-6 py-2 bg-[#FCD34D] hover:bg-[#fbbf24] text-gray-900 rounded-lg font-medium"
              >
                Save
              </Button>
            </div>
          </div>
        )}

        {/* Security & Login Tab */}
        {activeTab === 'security' && (
          <div className="space-y-8">
            {/* Change Password Section */}
            <div className="bg-white rounded-lg shadow-sm p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Change Password</h2>
                <Button
                  onClick={handleUpdatePassword}
                  className="px-6 py-2 bg-[#FCD34D] hover:bg-[#fbbf24] text-gray-900 rounded-lg font-medium"
                >
                  Update Password
                </Button>
              </div>

              <div className="space-y-6 max-w-4xl">
                {/* Current Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Current Password
                  </label>
                  <input
                    type="password"
                    placeholder="Enter current password"
                    value={passwordData.currentPassword}
                    onChange={(e) => handlePasswordInputChange('currentPassword', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1F3B6E] focus:border-transparent"
                  />
                </div>

                {/* New Password and Confirm Password */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      New Password
                    </label>
                    <input
                      type="password"
                      placeholder="Enter new password"
                      value={passwordData.newPassword}
                      onChange={(e) => handlePasswordInputChange('newPassword', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1F3B6E] focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Confirm Password
                    </label>
                    <input
                      type="password"
                      placeholder="Enter confirm password"
                      value={passwordData.confirmPassword}
                      onChange={(e) => handlePasswordInputChange('confirmPassword', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1F3B6E] focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Two-Factor Authentication Section */}
            <div className="bg-white rounded-lg shadow-sm p-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Two-Factor Authentication</h2>

              <div className="space-y-6 max-w-4xl">
                {/* Authenticator App */}
                <div className="flex items-start justify-between pb-6 border-b border-gray-200">
                  <div>
                    <h3 className="text-base font-medium text-gray-900 mb-1">Authenticator App</h3>
                    <p className="text-sm text-gray-500">Time-based one-time password (OTP)</p>
                  </div>
                  <button
                    onClick={() => setAuthenticatorApp(!authenticatorApp)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      authenticatorApp ? 'bg-[#1F3B6E]' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        authenticatorApp ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {/* SMS Backup Codes */}
                <div className="flex items-start justify-between pb-6 border-b border-gray-200">
                  <div>
                    <h3 className="text-base font-medium text-gray-900 mb-1">SMS Backup Codes</h3>
                    <p className="text-sm text-gray-500">Receive codes via text message as a backup.</p>
                  </div>
                  <button
                    onClick={() => setSmsBackupCodes(!smsBackupCodes)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      smsBackupCodes ? 'bg-[#1F3B6E]' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        smsBackupCodes ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {/* Download Recovery Codes Button */}
                <div>
                  <Button
                    onClick={handleDownloadRecoveryCodes}
                    className="px-6 py-2 bg-[#FCD34D] hover:bg-[#fbbf24] text-gray-900 rounded-lg font-medium"
                  >
                    Download Recovery Codes
                  </Button>
                </div>
              </div>
            </div>

            {/* Active Sessions Section */}
            <div className="bg-white rounded-lg shadow-sm p-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Active Sessions</h2>
              <p className="text-sm text-gray-500 mb-6">Review and manage devices currently logged into your account.</p>

              <div className="space-y-4 max-w-4xl">
                {/* Active Session 1 - Chrome on macOS */}
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-base font-medium text-gray-900">Chrome on macOS (Current) - New York, USA</h3>
                    </div>
                    <span className="inline-block px-2 py-1 text-xs font-medium text-green-700 bg-green-100 rounded">
                      ACTIVE NOW
                    </span>
                  </div>
                  <Button
                    onClick={() => handleLogOut('chrome-macos')}
                    className="px-6 py-2 bg-[#FCD34D] hover:bg-[#fbbf24] text-gray-900 rounded-lg font-medium"
                  >
                    Log Out
                  </Button>
                </div>

                {/* Active Session 2 - Safari on Windows */}
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div>
                    <h3 className="text-base font-medium text-gray-900 mb-1">Safari on Windows - London, UK</h3>
                    <p className="text-sm text-gray-500">2 hours ago</p>
                  </div>
                  <Button
                    onClick={() => handleLogOut('safari-windows')}
                    className="px-6 py-2 bg-[#FCD34D] hover:bg-[#fbbf24] text-gray-900 rounded-lg font-medium"
                  >
                    Log Out
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Logout Confirmation Modal */}
        {showLogoutModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
              <div className="mb-4">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Log Out</h3>
                <p className="text-gray-600">Are you sure you want to log out this account?</p>
              </div>
              <div className="flex justify-end gap-3">
                <Button
                  onClick={cancelLogout}
                  className="px-8 py-2 bg-[#FEF3E2] hover:bg-[#fde8c8] text-gray-700 rounded-lg font-medium"
                >
                  No
                </Button>
                <Button
                  onClick={confirmLogout}
                  className="px-8 py-2 bg-[#FCD34D] hover:bg-[#fbbf24] text-gray-900 rounded-lg font-medium"
                >
                  Yes
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
