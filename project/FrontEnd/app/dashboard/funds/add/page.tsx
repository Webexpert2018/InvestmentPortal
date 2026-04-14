'use client';

import { useState } from 'react';
import { ChevronLeft, Plus, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DashboardLayout } from '@/components/DashboardLayout';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api/client';
import { toast } from 'sonner';

export default function AddFundPage() {
  const router = useRouter();
  const [fundName, setFundName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [description, setDescription] = useState('');
  const [note, setNote] = useState('');
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [routingNumber, setRoutingNumber] = useState('');
  const [beneficiaryName, setBeneficiaryName] = useState('');
  const [bankAddress, setBankAddress] = useState('');
  const [errors, setErrors] = useState({
    fundName: '',
    startDate: '',
    description: '',
    note: '',
    bankName: '',
    accountNumber: '',
    routingNumber: '',
    beneficiaryName: '',
    bankAddress: '',
  });

  const descriptionMaxLength = 500;
  const noteMaxLength = 1000;

  const validateForm = () => {
    const newErrors = {
      fundName: '',
      startDate: '',
      description: '',
      note: '',
      bankName: '',
      accountNumber: '',
      routingNumber: '',
      beneficiaryName: '',
      bankAddress: '',
    };

    let isValid = true;

    if (!fundName.trim()) {
      newErrors.fundName = 'Fund name is required';
      isValid = false;
    }

    if (!startDate.trim()) {
      newErrors.startDate = 'Start date is required';
      isValid = false;
    }

    if (!description.trim()) {
      newErrors.description = 'Description is required';
      isValid = false;
    }

    if (!note.trim()) {
      newErrors.note = 'Note is required';
      isValid = false;
    }

    if (!bankName.trim()) {
      newErrors.bankName = 'Bank name is required';
      isValid = false;
    }

    if (!accountNumber.trim()) {
      newErrors.accountNumber = 'Account number is required';
      isValid = false;
    } else if (!/^\d+$/.test(accountNumber)) {
      newErrors.accountNumber = 'Account number must contain only digits';
      isValid = false;
    }

    if (!routingNumber.trim()) {
      newErrors.routingNumber = 'Routing number is required';
      isValid = false;
    } else if (!/^\d{9}$/.test(routingNumber)) {
      newErrors.routingNumber = 'Routing number must be exactly 9 digits';
      isValid = false;
    }

    if (!beneficiaryName.trim()) {
      newErrors.beneficiaryName = 'Beneficiary name is required';
      isValid = false;
    }

    if (!bankAddress.trim()) {
      newErrors.bankAddress = 'Bank address is required';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handlePublish = () => {
    if (validateForm()) {
      setShowPublishModal(true);
    }
  };

  const handleSaveDraft = async () => {
    if (validateForm()) {
      await saveFund('Draft');
    }
  };

  const saveFund = async (status: string) => {
    setIsSubmitting(true);
    try {
      const fund = await apiClient.createFund({
        name: fundName,
        description,
        start_date: startDate,
        note,
        status,
        min_investment: 0,
        unit_price: 1.00,
        bankName,
        accountNumber,
        routingNumber,
        beneficiaryName,
        bankAddress,
      });

      if (fundImage && fund.id) {
        await apiClient.uploadFundImage(fund.id, fundImage);
      }

      toast.success(`Fund ${status === 'Draft' ? 'saved as draft' : 'published'} successfully`);
      router.push('/dashboard/funds');
    } catch (error: any) {
      toast.error(error.message || 'Failed to save fund');
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmPublish = async () => {
    setShowPublishModal(false);
    await saveFund('Active');
  };

  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [fundImage, setFundImage] = useState<File | null>(null);
const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
  if (e.target.files && e.target.files[0]) {
    const file = e.target.files[0];
    setFundImage(file);
    setImagePreview(URL.createObjectURL(file));
  }
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
            Add New Fund
          </button>
        </div>

        {/* Form */}
        <div className="bg-white rounded-lg shadow-sm p-8">
          {/* Upload Image */}
        <div className="flex items-center gap-4 mb-8">
            <label className="relative flex flex-col items-center justify-center w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors overflow-hidden">

                {imagePreview ? (
                <img
                    src={imagePreview}
                    alt="Fund preview"
                    className="w-full h-full object-cover"
                />
                ) : (
                <>
                    <Plus className="h-8 w-8 text-gray-400 mb-1" />
                    <span className="text-sm text-gray-500">Upload</span>
                </>
                )}

                <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
                />
            </label>

            <div className="text-sm text-gray-600">
                <p>Upload fund image here</p>
                {fundImage && (
                <p className="mt-1 text-xs text-gray-500 truncate max-w-[200px]">
                    {fundImage.name}
                </p>
                )}
            </div>
        </div>



          {/* Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Left Column */}
            <div className="space-y-6">
              {/* Fund Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fund Name
                </label>
                <input
                  type="text"
                  placeholder="Enter fund name"
                  value={fundName}
                  onChange={(e) => {
                    setFundName(e.target.value);
                    if (errors.fundName) {
                      setErrors({ ...errors, fundName: '' });
                    }
                  }}
                  className={`date-input w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1F3B6E] focus:border-transparent ${
                    errors.fundName ? 'border-red-500' : 'border-gray-200'
                  }`}
                  style={{
                    WebkitAppearance: 'none',
                    }}
                />
                {errors.fundName && (
                  <p className="text-red-500 text-xs mt-1">{errors.fundName}</p>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <div className="relative">
                  <textarea
                    placeholder="Enter description"
                    value={description}
                    onChange={(e) => {
                      if (e.target.value.length <= descriptionMaxLength) {
                        setDescription(e.target.value);
                        if (errors.description) {
                          setErrors({ ...errors, description: '' });
                        }
                      }
                    }}
                    maxLength={descriptionMaxLength}
                    rows={4}
                    className={`w-full px-4 py-2 pb-6 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1F3B6E] focus:border-transparent resize-none ${
                      errors.description ? 'border-red-500' : 'border-gray-200'
                    }`}
                  />
                  <span className="absolute bottom-2 right-3 text-xs text-gray-400">
                    {description.length}/{descriptionMaxLength}
                  </span>
                </div>
                {errors.description && (
                  <p className="text-red-500 text-xs mt-1">{errors.description}</p>
                )}
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
                    type="date"
                    value={startDate}
                    onChange={(e) => {
                        setStartDate(e.target.value);
                        if (errors.startDate) {
                        setErrors({ ...errors, startDate: '' });
                        }
                    }}
                    className={`date-input w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1F3B6E] focus:border-transparent pr-10 ${
                        errors.startDate ? 'border-red-500' : 'border-gray-200'
                    }`}
                    />
                   {/* Custom calendar icon */}
                    <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#1F3B6E] pointer-events-none" />
                </div>
                {errors.startDate && (
                  <p className="text-red-500 text-xs mt-1">{errors.startDate}</p>
                )}
              </div>

              {/* Note */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Note
                </label>
                <div className="relative">
                  <textarea
                    placeholder="Add a private note visible only to you"
                    value={note}
                    onChange={(e) => {
                      if (e.target.value.length <= noteMaxLength) {
                        setNote(e.target.value);
                        if (errors.note) {
                          setErrors({ ...errors, note: '' });
                        }
                      }
                    }}
                    maxLength={noteMaxLength}
                    rows={4}
                    className={`w-full px-4 py-2 pb-6 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1F3B6E] focus:border-transparent resize-none ${
                      errors.note ? 'border-red-500' : 'border-gray-200'
                    }`}
                  />
                  <span className="absolute bottom-2 right-3 text-xs text-gray-400">
                    {note.length}/{noteMaxLength}
                  </span>
                </div>
                {errors.note && (
                  <p className="text-red-500 text-xs mt-1">{errors.note}</p>
                )}
            </div>
          </div>
        </div>

          {/* Bank Details Section */}
          <div className="border-t border-gray-100 pt-8 mb-8">
            <h3 className="font-goudy text-lg text-[#1F1F1F] mb-6">Bank Details (Wire Instructions)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Bank Name</label>
                <input
                  type="text"
                  placeholder="e.g. Metropolitan Commercial Bank"
                  value={bankName}
                  onChange={(e) => {
                    setBankName(e.target.value);
                    if (errors.bankName) setErrors({ ...errors, bankName: '' });
                  }}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1F3B6E] focus:border-transparent ${
                    errors.bankName ? 'border-red-500' : 'border-gray-200'
                  }`}
                />
                {errors.bankName && (
                  <p className="text-red-500 text-xs mt-1">{errors.bankName}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Account Number</label>
                <input
                  type="text"
                  placeholder="Enter account number"
                  value={accountNumber}
                  onChange={(e) => {
                    setAccountNumber(e.target.value);
                    if (errors.accountNumber) setErrors({ ...errors, accountNumber: '' });
                  }}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1F3B6E] focus:border-transparent ${
                    errors.accountNumber ? 'border-red-500' : 'border-gray-200'
                  }`}
                />
                {errors.accountNumber && (
                  <p className="text-red-500 text-xs mt-1">{errors.accountNumber}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Routing Number (ABA)</label>
                <input
                  type="text"
                  placeholder="Enter routing number"
                  value={routingNumber}
                  onChange={(e) => {
                    setRoutingNumber(e.target.value);
                    if (errors.routingNumber) setErrors({ ...errors, routingNumber: '' });
                  }}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1F3B6E] focus:border-transparent ${
                    errors.routingNumber ? 'border-red-500' : 'border-gray-200'
                  }`}
                />
                {errors.routingNumber && (
                  <p className="text-red-500 text-xs mt-1">{errors.routingNumber}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Beneficiary Name</label>
                <input
                  type="text"
                  placeholder="Enter beneficiary name"
                  value={beneficiaryName}
                  onChange={(e) => {
                    setBeneficiaryName(e.target.value);
                    if (errors.beneficiaryName) setErrors({ ...errors, beneficiaryName: '' });
                  }}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1F3B6E] focus:border-transparent ${
                    errors.beneficiaryName ? 'border-red-500' : 'border-gray-200'
                  }`}
                />
                {errors.beneficiaryName && (
                  <p className="text-red-500 text-xs mt-1">{errors.beneficiaryName}</p>
                )}
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Bank Address</label>
                <textarea
                  placeholder="Enter full bank address"
                  value={bankAddress}
                  onChange={(e) => {
                    setBankAddress(e.target.value);
                    if (errors.bankAddress) setErrors({ ...errors, bankAddress: '' });
                  }}
                  rows={2}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1F3B6E] focus:border-transparent resize-none ${
                    errors.bankAddress ? 'border-red-500' : 'border-gray-200'
                  }`}
                />
                {errors.bankAddress && (
                  <p className="text-red-500 text-xs mt-1">{errors.bankAddress}</p>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between items-center">
            <Button
              onClick={() => router.back()}
              className="bg-[#FEF3E2] hover:bg-[#fde8c8] text-gray-900 px-8 py-2 rounded-full font-medium"
            >
              Cancel
            </Button>
            <div className="flex gap-4">
              <Button
                onClick={handleSaveDraft}
                className="bg-white hover:bg-gray-50 text-gray-900 px-8 py-2 rounded-full font-medium border border-gray-200"
              >
                Save Draft
              </Button>
              <Button
                onClick={handlePublish}
                className="bg-[#FCD34D] hover:bg-[#fbbf24] text-gray-900 px-8 py-2 rounded-full font-medium"
              >
                Publish Fund
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Publish Confirmation Modal */}
      {showPublishModal && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
    <div className="relative w-full max-w-[520px] bg-white rounded-md px-6 py-5 shadow-lg">

      {/* Close icon */}
      <button
        onClick={() => setShowPublishModal(false)}
        className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
      >
        ✕
      </button>

      {/* Title */}
      <h2 className="text-[16px] font-semibold text-gray-900 mb-1">
        Publish Fund
      </h2>

      {/* Description */}
      <p className="text-[13px] leading-[1.5] text-gray-500">
        You are about to publish this fund and make it available across the
        platform. Once published, investors and Staff will be able to view this
        fund and its details based on their permissions.
      </p>

      {/* Actions */}
      <div className="mt-5 flex justify-end gap-3">
        <button
          onClick={() => setShowPublishModal(false)}
          className="min-w-[96px] rounded-full bg-[#FEF3E2] px-4 py-1.5 text-[13px] font-medium text-gray-600"
        >
          Cancel
        </button>

        <button
          onClick={confirmPublish}
          className="min-w-[96px] rounded-full bg-[#FCD34D] px-4 py-1.5 text-[13px] font-medium text-[#1F3B6E]"
        >
          Publish
        </button>
      </div>
    </div>
  </div>
)}

    </DashboardLayout>
  );
}
