'use client';

import { useState } from 'react';
import { ChevronLeft, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DashboardLayout } from '@/components/DashboardLayout';
import { useRouter } from 'next/navigation';

export default function EditFundPage() {
  const router = useRouter();
  const [fundName, setFundName] = useState('Strive Enterprise Fund');
  const [startDate, setStartDate] = useState('Dec 20, 2025');
  const [description, setDescription] = useState('Strive Enterprise Fund focuses on early to mid-stage technology companies poised for rapid scaling. Our strategy involves identifying');
  const [note, setNote] = useState('Investor provided an updated proof of address.');
  const [status, setStatus] = useState('Active');

  const maxDescriptionLength = 500;
  const maxNoteLength = 1000;

  const handleUpdate = () => {
    // Handle update logic here
    router.back();
  };

  return (
    <DashboardLayout>
      <div className="p-6">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ChevronLeft className="h-5 w-5" />
            Edit Fund Details
          </button>
        </div>

        {/* Form */}
        <div className="bg-white rounded-lg shadow-sm p-8">
          {/* Upload Image */}
          <div className="flex items-center gap-4 mb-8">
            <img
              src="/images/strive_funds.jpg"
              alt="Fund"
              className="w-32 h-32 object-cover rounded-lg"
              onError={(e) => {
                e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="128" height="128"%3E%3Crect width="128" height="128" fill="%23e5e7eb"/%3E%3C/svg%3E';
              }}
            />
            <p className="text-sm text-gray-500">Change fund image here</p>
          </div>

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Left Column */}
            <div className="space-y-6">
              {/* Fund Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fund Name
                </label>
                <input
                  type="text"
                  value={fundName}
                  onChange={(e) => setFundName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1F3B6E] focus:border-transparent"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => {
                    if (e.target.value.length <= maxDescriptionLength) {
                      setDescription(e.target.value);
                    }
                  }}
                  rows={4}
                  maxLength={maxDescriptionLength}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1F3B6E] focus:border-transparent resize-none"
                />
                <div className="flex justify-end mt-1">
                  <span className="text-xs text-gray-500">
                    {description.length}/{maxDescriptionLength}
                  </span>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Start Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1F3B6E] focus:border-transparent pr-10"
                  />
                  <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                </div>
              </div>

              {/* Note */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Note
                </label>
                <textarea
                  value={note}
                  onChange={(e) => {
                    if (e.target.value.length <= maxNoteLength) {
                      setNote(e.target.value);
                    }
                  }}
                  rows={4}
                  maxLength={maxNoteLength}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1F3B6E] focus:border-transparent resize-none"
                />
                <div className="flex justify-end mt-1">
                  <span className="text-xs text-gray-500">
                    {note.length}/{maxNoteLength}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Status */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1F3B6E] focus:border-transparent"
              >
                <option value="Active">Active</option>
                <option value="Closed">Closed</option>
                <option value="Draft">Draft</option>
              </select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-4">
            <Button
              onClick={() => router.back()}
              className="bg-[#FEF3E2] hover:bg-[#fde8c8] text-gray-900 px-8 py-2 rounded-full font-medium"
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdate}
              className="bg-[#FCD34D] hover:bg-[#fbbf24] text-gray-900 px-8 py-2 rounded-full font-medium"
            >
              Update
            </Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
