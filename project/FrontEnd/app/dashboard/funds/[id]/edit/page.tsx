'use client';

import { useState } from 'react';
import { ChevronLeft, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DashboardLayout } from '@/components/DashboardLayout';
import { useRouter, useParams } from 'next/navigation';
import { apiClient, BASE_URL } from '@/lib/api/client';
import { toast } from 'sonner';
import { useEffect } from 'react';

export default function EditFundPage() {
  const router = useRouter();
  const params = useParams();
  const [fundName, setFundName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [description, setDescription] = useState('');
  const [note, setNote] = useState('');
  const [status, setStatus] = useState('Active');
  const [image, setImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  const maxDescriptionLength = 500;
  const maxNoteLength = 1000;

  useEffect(() => {
    if (params.id) {
      fetchFundDetails();
    }
  }, [params.id]);

  const fetchFundDetails = async () => {
    setIsLoading(true);
    try {
      const data = await apiClient.getFundById(params.id as string);
      setFundName(data.name || '');
      // Format date to YYYY-MM-DD for date input
      const formattedDate = data.startDate ? new Date(data.startDate).toISOString().split('T')[0] : '';
      setStartDate(formattedDate);
      setDescription(data.description || '');
      setNote(data.note || '');
      setStatus(data.status || 'Active');
      setImage(data.image || null);
    } catch (error: any) {
      toast.error(error.message || 'Failed to fetch fund details');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewImage(URL.createObjectURL(file));
    }
  };

  const handleUpdate = async () => {
    setIsUpdating(true);
    try {
      // 1. Update fund details
      await apiClient.updateFund(params.id as string, {
        name: fundName,
        start_date: startDate,
        description,
        note,
        status,
      });

      // 2. Upload image if selected
      if (selectedFile) {
        await apiClient.uploadFundImage(params.id as string, selectedFile);
      }

      toast.success('Fund updated successfully');
      router.push(`/dashboard/funds/${params.id}`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to update fund');
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1F3B6E]"></div>
        </div>
      </DashboardLayout>
    );
  }

  const getFullImageUrl = (imagePath: string | null | undefined) => {
    if (!imagePath) return null;
    if (imagePath.startsWith('http')) return imagePath;
    if (imagePath.startsWith('/images/') || imagePath.startsWith('/documents/')) return imagePath;
    return `${BASE_URL}${imagePath}`;
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
          <div className="flex items-center gap-6 mb-8">
            <div className="relative group">
              <div className="w-32 h-32 rounded-lg overflow-hidden border border-gray-200 bg-gray-50 flex items-center justify-center">
                {previewImage ? (
                  <img
                    src={previewImage}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                ) : image ? (
                  <img
                    src={getFullImageUrl(image) || ''}
                    alt="Fund"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-gray-400 text-xs text-center px-4">No image uploaded</span>
                )}
              </div>
              <label className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-lg">
                <span className="text-white text-xs font-medium">Change Image</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </label>
            </div>
            <div>
                <p className="text-sm font-medium text-gray-900 mb-1">Fund image</p>
                <p className="text-xs text-gray-500">Click image to upload a new one</p>
            </div>
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="date-input w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1F3B6E] focus:border-transparent pr-10"
                  />
                  <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
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
              disabled={isUpdating}
              className="bg-[#FCD34D] hover:bg-[#fbbf24] text-gray-900 px-8 py-2 rounded-full font-medium"
            >
              {isUpdating ? 'Updating...' : 'Update'}
            </Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
