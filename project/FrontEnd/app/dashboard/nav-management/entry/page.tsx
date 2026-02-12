'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Calendar, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DashboardLayout } from '@/components/DashboardLayout';

export default function NAVEntryPage() {
  const router = useRouter();
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [confirmationChecked, setConfirmationChecked] = useState(false);
  const [formData, setFormData] = useState({
    effectiveDate: '',
    totalFundValue: '',
    totalUnits: '',
    navPerUnit: '',
    note: '',
  });

  // Recent NAV Entries
  const recentEntries = [
    { quarter: 'Q3 2023', date: '2023-09-30', value: '$10.41.00' },
    { quarter: 'Q2 2023', date: '2023-09-30', value: '$10.41.00' },
    { quarter: 'Q1 2023', date: '2023-09-30', value: '$10.41.00' },
    { quarter: 'Q1 2022', date: '2023-09-30', value: '$10.41.00' },
  ];

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => {
      const updated = {
        ...prev,
        [field]: value
      };

      // Auto-calculate NAV per Unit when Total Fund Value and Total Units are entered
      if (field === 'totalFundValue' || field === 'totalUnits') {
        const fundValue = parseFloat(field === 'totalFundValue' ? value : updated.totalFundValue);
        const units = parseFloat(field === 'totalUnits' ? value : updated.totalUnits);
        
        if (!isNaN(fundValue) && !isNaN(units) && units > 0) {
          updated.navPerUnit = (fundValue / units).toFixed(2);
        } else {
          updated.navPerUnit = '';
        }
      }

      return updated;
    });
  };

  const handleCancel = () => {
    router.push('/dashboard/nav-management');
  };

  const handleSaveDraft = () => {
    // Handle save draft logic
    console.log('Saving draft:', formData);
    router.push('/dashboard/nav-management');
  };

  const handlePublishNAV = () => {
    setShowPublishModal(true);
  };

  const confirmPublish = () => {
    if (!confirmationChecked) return;
    
    // Handle publish logic
    console.log('Publishing NAV:', formData);
    setShowPublishModal(false);
    router.push('/dashboard/nav-management');
  };

  const cancelPublish = () => {
    setShowPublishModal(false);
    setConfirmationChecked(false);
  };

  return (
    <DashboardLayout>
      <div className="p-6">
        {/* Header with Back Button */}
        <div className="mb-6">
          <button
            onClick={handleCancel}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ChevronLeft className="h-5 w-5 mr-1" />
            <span className="font-medium">Quarterly NAV Entry</span>
          </button>
        </div>

        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-0">Quarterly NAV Entry</h1>
          <p className="text-sm text-gray-600 mt-3">
            Enter the official total fund value for the quarter. NAV per unit will be calculated automatically using the system's total units for the selected date.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Side - Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm p-8">
              <div className="space-y-6">
                {/* Effective Date and Total Fund Value */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Effective Date
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Select date"
                        value={formData.effectiveDate}
                        onChange={(e) => handleInputChange('effectiveDate', e.target.value)}
                        className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1F3B6E] focus:border-transparent"
                      />
                      <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5 pointer-events-none" />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Cannot be a future date</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Total Fund Value
                    </label>
                    <input
                      type="text"
                      placeholder="$0.00"
                      value={formData.totalFundValue}
                      onChange={(e) => handleInputChange('totalFundValue', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1F3B6E] focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Total Units and NAV per Unit */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Total Units (system)
                    </label>
                    <input
                      type="text"
                      placeholder="Enter total units"
                      value={formData.totalUnits}
                      onChange={(e) => handleInputChange('totalUnits', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1F3B6E] focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      NAV per Unit (calculated)
                    </label>
                    <input
                      type="text"
                      placeholder="$0.00"
                      value={formData.navPerUnit}
                      readOnly
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700"
                    />
                    <p className="text-xs text-gray-500 mt-1">Total Value / Total Units. Converted to 2 decimal places</p>
                  </div>
                </div>

                {/* Note */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Note
                  </label>
                  <p className="text-xs text-gray-500 mb-2">Private note visible only to you</p>
                  <textarea
                    placeholder="Enter note"
                    value={formData.note}
                    onChange={(e) => handleInputChange('note', e.target.value)}
                    rows={4}
                    maxLength={1000}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1F3B6E] focus:border-transparent resize-none"
                  />
                  <div className="flex justify-end mt-1">
                    <span className="text-xs text-gray-500">{formData.note.length}/1000</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-between items-center pt-6 mt-6 border-t border-gray-200">
                  <Button
                    onClick={handleCancel}
                    className="px-6 py-2 bg-[#FEF3E2] hover:bg-[#fde8c8] text-gray-700 rounded-full font-medium"
                  >
                    Cancel
                  </Button>
                  <div className="flex gap-3">
                    <Button
                      onClick={handleSaveDraft}
                      className="px-6 py-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 rounded-full font-medium"
                    >
                      Save Draft
                    </Button>
                    <Button
                      onClick={handlePublishNAV}
                      className="px-6 py-2 bg-[#FCD34D] hover:bg-[#fbbf24] text-gray-900 rounded-full font-medium"
                    >
                      Publish NAV
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Recent NAV Entries */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 border-b p-6">Recent NAV Entries</h3>
              <div className="space-y-3 p-6">
                {recentEntries.map((entry, index) => (
                  <div key={index} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{entry.quarter}</p>
                      <p className="text-xs text-gray-500">{entry.date}</p>
                    </div>
                    <p className="text-sm font-semibold text-gray-900">{entry.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Confirm Publish NAV Modal */}
        {showPublishModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 w-full max-w-2xl mx-4 relative">
              {/* Close Button */}
              <button
                onClick={cancelPublish}
                className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>

              <div className="mb-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Confirm Publish NAV</h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  You are about to publish the official NAV for Q4 2023. This action will recompute positions and performance snapshots, and notify investors (if enabled). Do you want to proceed?
                </p>
              </div>

              {/* Confirmation Checkbox */}
              <div className="mb-8">
                <label className="flex items-start cursor-pointer">
                  <input
                    type="checkbox"
                    checked={confirmationChecked}
                    onChange={(e) => setConfirmationChecked(e.target.checked)}
                    className="mt-0.5 h-4 w-4 text-[#1F3B6E] focus:ring-[#1F3B6E] border-gray-300 rounded"
                  />
                  <span className="ml-3 text-sm text-gray-700">
                    I confirm I have reviewed the calculation and have authorization to publish.
                  </span>
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-4">
                <Button
                  onClick={cancelPublish}
                  className="px-8 py-2 bg-[#FEF3E2] hover:bg-[#fde8c8] text-gray-900 rounded-full font-medium"
                >
                  Cancel
                </Button>
                <Button
                  onClick={confirmPublish}
                  disabled={!confirmationChecked}
                  className={`px-8 py-2 rounded-full font-medium ${
                    confirmationChecked
                      ? 'bg-[#FCD34D] hover:bg-[#fbbf24] text-gray-900'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  Publish
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
