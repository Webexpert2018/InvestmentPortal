'use client';

import { useRef, useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { ChevronDown, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function UploadTaxDocumentPage() {
  const router = useRouter();
  const [documentType, setDocumentType] = useState('');
  const [taxYear, setTaxYear] = useState('');
  const [description, setDescription] = useState('');
  const [note, setNote] = useState('');
  const [selectedFileName, setSelectedFileName] = useState('');
  const [errors, setErrors] = useState<{
    documentType?: string;
    taxYear?: string;
    description?: string;
    file?: string;
  }>({});

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const validateForm = () => {
    const nextErrors: {
      documentType?: string;
      taxYear?: string;
      description?: string;
      file?: string;
    } = {};

    if (!documentType.trim()) {
      nextErrors.documentType = 'Document Type is required';
    }

    if (!taxYear.trim()) {
      nextErrors.taxYear = 'Tax Year is required';
    }

    if (!description.trim()) {
      nextErrors.description = 'Description is required';
    }

    if (!selectedFileName.trim()) {
      nextErrors.file = 'Please upload a file';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSave = () => {
    if (!validateForm()) {
      return;
    }

    router.push('/dashboard/tax-vault/details');
  };

  const handleCancel = () => {
    setDocumentType('');
    setTaxYear('');
    setDescription('');
    setNote('');
    setSelectedFileName('');
    setErrors({});
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setSelectedFileName(file?.name ?? '');
    setErrors((prev) => ({ ...prev, file: undefined }));
  };

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-[1100px] font-helvetica text-[#1F1F1F]">
        <div>
          <h1 className="font-goudy text-[20px] leading-[28px] text-[#1F1F1F]">Upload Document</h1>
          <p className="mt-1 text-[14px] leading-6 text-[#8E8E93]">
            Upload investor documents securely. All files are scanned before being added to the vault.
          </p>
        </div>

        <div className="mt-8 rounded-[10px] bg-white px-6 py-6">
          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-[14px] text-[#4B4B4B]">Document Type</label>
              <div className="relative">
                <select
                  value={documentType}
                  onChange={(event) => {
                    setDocumentType(event.target.value);
                    setErrors((prev) => ({ ...prev, documentType: undefined }));
                  }}
                  className={`h-[48px] w-full appearance-none rounded-[8px] border px-4 text-left text-[14px] outline-none ${
                    errors.documentType ? 'border-[#E05252]' : 'border-[#E5E5EA]'
                  } ${documentType ? 'text-[#1F1F1F]' : 'text-[#A2A5AA]'}`}
                >
                  <option value="">Select document type</option>
                  <option value="K-1">K-1</option>
                  <option value="W-9">W-9</option>
                  <option value="Statement">Statement</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#A2A5AA]" />
              </div>
              {errors.documentType && <p className="mt-1 text-[12px] text-[#E05252]">{errors.documentType}</p>}
            </div>

            <div>
              <label className="mb-2 block text-[14px] text-[#4B4B4B]">Tax Year</label>
              <div className="relative">
                <select
                  value={taxYear}
                  onChange={(event) => {
                    setTaxYear(event.target.value);
                    setErrors((prev) => ({ ...prev, taxYear: undefined }));
                  }}
                  className={`h-[48px] w-full appearance-none rounded-[8px] border px-4 text-left text-[14px] outline-none ${
                    errors.taxYear ? 'border-[#E05252]' : 'border-[#E5E5EA]'
                  } ${taxYear ? 'text-[#1F1F1F]' : 'text-[#A2A5AA]'}`}
                >
                  <option value="">Select tax year</option>
                  <option value="2026">2026</option>
                  <option value="2025">2025</option>
                  <option value="2024">2024</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#A2A5AA]" />
              </div>
              {errors.taxYear && <p className="mt-1 text-[12px] text-[#E05252]">{errors.taxYear}</p>}
            </div>

            <div>
              <label className="mb-2 block text-[14px] text-[#4B4B4B]">Description</label>
              <div className="relative">
                <textarea
                  rows={3}
                  value={description}
                  onChange={(event) => {
                    setDescription(event.target.value);
                    setErrors((prev) => ({ ...prev, description: undefined }));
                  }}
                  placeholder="Enter description"
                  className={`h-[91px] w-full resize-none rounded-[8px] border px-4 py-3 text-[14px] text-[#1F1F1F] outline-none placeholder:text-[#A2A5AA] ${
                    errors.description ? 'border-[#E05252]' : 'border-[#E5E5EA]'
                  }`}
                />
                <span className="absolute bottom-2 right-3 text-[10px] text-[#D1D1D6]">
                  {description.length}/1000
                </span>
              </div>
              {errors.description && <p className="mt-1 text-[12px] text-[#E05252]">{errors.description}</p>}
            </div>

            <div>
              <label className="mb-2 block text-[14px] text-[#4B4B4B]">Note</label>
              <div className="relative">
                <textarea
                  rows={3}
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  placeholder="Add a private note visible only to you"
                  className="h-[91px] w-full resize-none rounded-[8px] border border-[#E5E5EA] px-4 py-3 text-[14px] text-[#1F1F1F] outline-none placeholder:text-[#A2A5AA]"
                />
                <span className="absolute bottom-2 right-3 text-[10px] text-[#D1D1D6]">{note.length}/1000</span>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <p className="mb-2 text-[14px] text-[#4B4B4B]">Upload File here</p>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={handleFileChange}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className={`flex h-[103px] w-full flex-col items-center justify-center rounded-[8px] border border-dashed text-[#A2A5AA] ${
                errors.file ? 'border-[#E05252]' : 'border-[#E5E5EA]'
              }`}
            >
              <Plus className="h-6 w-6" />
              <p className="mt-2 text-[14px]">
                {selectedFileName ? selectedFileName : 'Drag & drop files here'}
              </p>
            </button>
            {errors.file && <p className="mt-1 text-[12px] text-[#E05252]">{errors.file}</p>}
          </div>

          <div className="mt-6 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={handleCancel}
              className="h-[42px] min-w-[112px] rounded-full bg-[#FFF3D6] px-6 text-[16px] text-[#4B4B4B]"
              >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="h-[42px] min-w-[112px] rounded-full bg-[#FBCB4B] px-6 text-[16px] text-[#1F1F1F]"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
