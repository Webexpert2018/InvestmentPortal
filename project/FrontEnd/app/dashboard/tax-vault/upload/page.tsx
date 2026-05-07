'use client';

import { useRef, useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { ChevronDown, Plus, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api/client';
import { useAuth } from '@/lib/contexts/AuthContext';

export default function UploadTaxDocumentPage() {
  const router = useRouter();
  const [documentType, setDocumentType] = useState('');
  const [taxYear, setTaxYear] = useState('');
  const [description, setDescription] = useState('');
  const [note, setNote] = useState('');
  const [selectedFileName, setSelectedFileName] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [investors, setInvestors] = useState<any[]>([]);
  const [selectedInvestorId, setSelectedInvestorId] = useState('');
  const { user } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isLoadingInvestors, setIsLoadingInvestors] = useState(false);
  const [errors, setErrors] = useState<{
    documentType?: string;
    taxYear?: string;
    description?: string;
    file?: string;
    investor?: string;
  }>({});

  const fetchInvestors = async () => {
    try {
      setIsLoadingInvestors(true);
      const data = await apiClient.getAllUsers();
      // Filter only investors
      setInvestors(data.filter((u: any) => u.role === 'investor'));
    } catch (err) {
      console.error('Failed to fetch investors:', err);
    } finally {
      setIsLoadingInvestors(false);
    }
  };

  const fetchAssignedInvestors = async () => {
    try {
      setIsLoadingInvestors(true);
      const data = await apiClient.getAssignedInvestors();
      setInvestors(data);
    } catch (err) {
      console.error('Failed to fetch assigned investors:', err);
    } finally {
      setIsLoadingInvestors(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'admin' || user?.role === 'executive_admin' || user?.role === 'fund_admin') {
      fetchInvestors();
    } else if (user?.role === 'accountant') {
      fetchAssignedInvestors();
    }
  }, [user]);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const validateForm = () => {
    const nextErrors: {
      documentType?: string;
      taxYear?: string;
      description?: string;
      file?: string;
      investor?: string;
    } = {};

    if (!documentType.trim()) {
      nextErrors.documentType = 'Document Type is required';
    }

    if (!taxYear.trim()) {
      nextErrors.taxYear = 'Tax Year is required';
    }

    if (!selectedFile) {
      nextErrors.file = 'Please upload a file';
    } else if (selectedFile.size === 0) {
      nextErrors.file = 'The uploaded file is empty (0 bytes). Please select a valid file.';
    }

    if ((user?.role === 'admin' || user?.role === 'accountant' || user?.role === 'executive_admin') && !selectedInvestorId) {
      nextErrors.investor = 'Please select an investor';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm() || !selectedFile) {
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      await apiClient.uploadVaultDocument({
        file: selectedFile,
        document_type: documentType,
        tax_year: parseInt(taxYear),
        description,
        note,
        investor_id: selectedInvestorId || undefined
      });

      router.push('/dashboard/tax-vault');
    } catch (err: any) {
      console.error('Upload failed:', err);
      setUploadError(err.message || 'Failed to upload document. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleCancel = () => {
    if (isUploading) return;
    router.push('/dashboard/tax-vault');
  };

  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = (event: React.DragEvent<HTMLButtonElement>) => {
    event.preventDefault();
    setIsDragging(false);
    if (isUploading) return;

    const file = event.dataTransfer.files?.[0];
    if (file) {
      setSelectedFile(file);
      setSelectedFileName(file.name);
      setErrors((prev) => ({ ...prev, file: undefined }));
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setSelectedFileName(file.name);
      setErrors((prev) => ({ ...prev, file: undefined }));
    }
  };

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-8xl font-helvetica text-[#1F1F1F]">
        <div>
          <h1 className="font-goudy font-bol text-lg md:text-2xl text-[#1F1F1F]">Upload Document</h1>
          <p className="mt-1 text-[14px] leading-6 text-[#8E8E93]">
            Upload investor documents securely. All files are scanned before being added to the vault.
          </p>
        </div>

        <div className="px-2 sm:px-10">
          <div className="mt-6 rounded-[10px] bg-white px-6 py-6">
            <div className="grid gap-5 md:grid-cols-2">
              {(user?.role === 'admin' || user?.role === 'accountant' || user?.role === 'executive_admin') && (
                <div className="md:col-span-2">
                  <label className="mb-2 block text-[14px] text-[#4B4B4B]">Select Investor</label>
                  <div className="relative">
                    <select
                      value={selectedInvestorId}
                      onChange={(event) => {
                        setSelectedInvestorId(event.target.value);
                        setErrors((prev) => ({ ...prev, investor: undefined }));
                      }}
                      className={`h-[48px] w-full appearance-none rounded-[8px] border px-4 text-left text-[14px] outline-none ${errors.investor ? 'border-[#E05252]' : 'border-[#E5E5EA]'
                        } ${selectedInvestorId ? 'text-[#1F1F1F]' : 'text-[#A2A5AA]'}`}
                    >
                      <option value="">{isLoadingInvestors ? 'Loading investors...' : 'Select an investor'}</option>
                      {investors.map((inv: any) => (
                        <option key={inv.id} value={inv.id}>
                          {inv.full_name || inv.firstName + ' ' + inv.lastName} ({inv.email})
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#A2A5AA]" />
                  </div>
                  {errors.investor && <p className="mt-1 text-[12px] text-[#E05252]">{errors.investor}</p>}
                </div>
              )}

              <div>
                <label className="mb-2 block text-[14px] text-[#4B4B4B]">Document Type</label>
                <div className="relative">
                  <select
                    value={documentType}
                    onChange={(event) => {
                      setDocumentType(event.target.value);
                      setErrors((prev) => ({ ...prev, documentType: undefined }));
                    }}
                    className={`h-[48px] w-full appearance-none rounded-[8px] border px-4 text-left text-[14px] outline-none ${errors.documentType ? 'border-[#E05252]' : 'border-[#E5E5EA]'
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
                    className={`h-[48px] w-full appearance-none rounded-[8px] border px-4 text-left text-[14px] outline-none ${errors.taxYear ? 'border-[#E05252]' : 'border-[#E5E5EA]'
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
                    className={`h-[91px] w-full resize-none rounded-[8px] border px-4 py-3 text-[14px] text-[#1F1F1F] outline-none placeholder:text-[#A2A5AA] ${errors.description ? 'border-[#E05252]' : 'border-[#E5E5EA]'
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
                disabled={isUploading}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDragEnter={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                disabled={isUploading}
                className={`flex h-[103px] w-full flex-col items-center justify-center rounded-[8px] border border-dashed ${selectedFileName ? 'text-[#1F1F1F] font-bold' : 'text-[#A2A5AA]'
                  } ${isDragging ? 'border-[#FBCB4B] bg-yellow-50' : errors.file ? 'border-[#E05252]' : 'border-[#E5E5EA]'
                  } ${isUploading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[#FAFBFC]'}`}
              >
                <Plus className={`h-6 w-6 ${selectedFileName ? 'text-[#2BB673]' : 'text-[#A2A5AA]'}`} />
                <p className="mt-2 text-[14px]">
                  {selectedFileName ? selectedFileName : 'Drag & drop files here'}
                </p>
              </button>
              {errors.file && <p className="mt-1 text-[12px] text-[#E05252]">{errors.file}</p>}
            </div>

            {uploadError && (
              <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600 border border-red-100">
                {uploadError}
              </div>
            )}

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={handleCancel}
                disabled={isUploading}
                className="h-[42px] min-w-[112px] rounded-full bg-[#FFF3D6] px-6 text-[16px] text-[#4B4B4B] disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={isUploading}
                className="flex h-[42px] min-w-[112px] items-center justify-center gap-2 rounded-full bg-[#FBCB4B] px-6 text-[16px] font-bold text-[#1F1F1F] shadow-sm transition-all hover:bg-[#F9B800] active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  'Save'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
