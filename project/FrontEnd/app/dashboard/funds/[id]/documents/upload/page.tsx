'use client';

import { useState, useMemo, useRef, DragEvent } from 'react';
import { ChevronLeft, Upload } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';

const DOCUMENT_TYPES = [
  { label: 'K-1', value: 'k1' },
  { label: 'W-9', value: 'w9' },
  { label: 'Statement', value: 'statement' },
];

export default function UploadDocumentPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [documentType, setDocumentType] = useState('');
  const [taxYear, setTaxYear] = useState('');
  const [description, setDescription] = useState('');
  const [note, setNote] = useState('');
  const [file, setFile] = useState<File | null>(null);

  const [errors, setErrors] = useState<any>({});
  const [loading, setLoading] = useState(false);

  const descriptionMaxLength = 1000;
  const noteMaxLength = 1000;

  const taxYears = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 5 }, (_, i) => currentYear - i);
  }, []);

  // ---------------- VALIDATION ----------------
  const validate = () => {
    const newErrors: any = {};

    if (!documentType) newErrors.documentType = 'Document type is required';
    if (!taxYear) newErrors.taxYear = 'Tax year is required';
    if (!file) newErrors.file = 'File is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ---------------- SAVE ----------------
  const handleSave = async () => {
    if (!validate()) return;

    try {
      setLoading(true);

      const formData = new FormData();
      formData.append('documentType', documentType);
      formData.append('taxYear', taxYear);
      formData.append('description', description);
      formData.append('note', note);
      if (file) formData.append('file', file);

      const response = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Upload failed');

      alert('Document uploaded successfully');
      router.push('/documents');
    } catch (error) {
      alert('Something went wrong. Please try again.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="px-8 py-10">

        {/* ================= HEADER ================= */}
        <div className="mb-10 max-w-4xl mx-auto">
          <div
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 cursor-pointer group"
          >
            <ChevronLeft
              className="w-4 h-4 text-gray-600 group-hover:text-gray-900 transition"
              strokeWidth={1.5}
            />
            <h1 className="text-[18px] font-medium text-gray-800">
              Upload Document
            </h1>
          </div>

          <p className="mt-2 text-sm text-gray-500">
            Upload investor documents securely. All files are scanned before being added to the vault.
          </p>
        </div>

        {/* ================= CARD ================= */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-10 max-w-4xl mx-auto">

          {/* Top Row */}
          <div className="grid grid-cols-2 gap-6 mb-6">

            {/* Document Type */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Document Type
              </label>
              <select
                value={documentType}
                onChange={(e) => {
                  setDocumentType(e.target.value);
                  setErrors((prev: any) => ({ ...prev, documentType: null }));
                }}
                className={`w-full h-11 px-4 border rounded-lg text-sm focus:ring-2 focus:ring-[#1F3B6E] focus:outline-none ${
                  errors.documentType ? 'border-red-500' : 'border-gray-200'
                }`}
              >
                <option value="">Select document type</option>
                {DOCUMENT_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
              {errors.documentType && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.documentType}
                </p>
              )}
            </div>

            {/* Tax Year */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Tax Year
              </label>
              <select
                value={taxYear}
                onChange={(e) => {
                  setTaxYear(e.target.value);
                  setErrors((prev: any) => ({ ...prev, taxYear: null }));
                }}
                className={`w-full h-11 px-4 border rounded-lg text-sm focus:ring-2 focus:ring-[#1F3B6E] focus:outline-none ${
                  errors.taxYear ? 'border-red-500' : 'border-gray-200'
                }`}
              >
                <option value="">Select tax year</option>
                {taxYears.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
              {errors.taxYear && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.taxYear}
                </p>
              )}
            </div>
          </div>

          {/* Description & Note */}
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium mb-2">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={descriptionMaxLength}
                rows={4}
                placeholder="Enter description"
                className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm resize-none focus:ring-2 focus:ring-[#1F3B6E] focus:outline-none"
              />
              <div className="text-right text-xs text-gray-400 mt-1">
                {description.length}/{descriptionMaxLength}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Note
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                maxLength={noteMaxLength}
                rows={4}
                placeholder="Add a private note visible only to you"
                className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm resize-none focus:ring-2 focus:ring-[#1F3B6E] focus:outline-none"
              />
              <div className="text-right text-xs text-gray-400 mt-1">
                {note.length}/{noteMaxLength}
              </div>
            </div>
          </div>

          {/* Upload Section */}
          <div className="mb-10">
            <label className="block text-sm font-medium mb-2">
              Upload File here
            </label>

            <div
              onClick={() => fileInputRef.current?.click()}
              onDrop={(e: DragEvent<HTMLDivElement>) => {
                e.preventDefault();
                if (e.dataTransfer.files?.[0]) {
                  setFile(e.dataTransfer.files[0]);
                  setErrors((prev: any) => ({ ...prev, file: null }));
                }
              }}
              onDragOver={(e) => e.preventDefault()}
              className={`border-2 border-dashed rounded-xl p-16 text-center cursor-pointer transition ${
                errors.file
                  ? 'border-red-500'
                  : 'border-gray-300 hover:border-[#1F3B6E]'
              }`}
            >
              <Upload className="w-8 h-8 text-gray-400 mx-auto mb-4" />
              <p className="text-sm text-gray-600">
                {file ? file.name : 'Drag & drop files here'}
              </p>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.[0]) {
                  setFile(e.target.files[0]);
                  setErrors((prev: any) => ({ ...prev, file: null }));
                }
              }}
            />

            {errors.file && (
              <p className="text-red-500 text-sm mt-1">
                {errors.file}
              </p>
            )}
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-4">
            <Button
              onClick={() => router.back()}
              className="px-8 h-11 rounded-full bg-[#FEF3E2] hover:bg-[#fde8c8] text-gray-800"
            >
              Cancel
            </Button>

            <Button
              onClick={handleSave}
              disabled={loading}
              className="px-10 h-11 rounded-full bg-[#FCD34D] hover:bg-[#fbbf24] text-gray-900 font-semibold"
            >
              {loading ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
