'use client';

import Image from 'next/image';
import { useState, useEffect, useRef } from 'react';
import { CheckCircle2, Upload, Loader2, FileText, AlertCircle, Check } from 'lucide-react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api/client';
import { useAuth } from '@/lib/contexts/AuthContext';
import { toast } from 'sonner';

interface DocUploadState {
  file: File | null;
  status: 'idle' | 'uploading' | 'completed' | 'error';
  name: string;
}

export default function KycVerificationPage() {
  const router = useRouter();
  const { user, refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string>('');
  const [view, setView] = useState<'landing' | 'manual'>('landing');

  const [uploads, setUploads] = useState<{
    tax_return_y1: DocUploadState;
    tax_return_y2: DocUploadState;
    balance_sheet: DocUploadState;
  }>({
    tax_return_y1: { file: null, status: 'idle', name: 'Tax Return (Year 1)' },
    tax_return_y2: { file: null, status: 'idle', name: 'Tax Return (Year 2)' },
    balance_sheet: { file: null, status: 'idle', name: 'Balance Sheet / Net Worth' },
  });

  const fileInputRefs = {
    tax_return_y1: useRef<HTMLInputElement>(null),
    tax_return_y2: useRef<HTMLInputElement>(null),
    balance_sheet: useRef<HTMLInputElement>(null),
  };

  useEffect(() => {
    if (user?.kycStatus) {
      setStatus(user.kycStatus);
    }
  }, [user]);

  const handleVerifyOnline = async () => {
    toast.info('Authorized third-party provider integration coming soon.');
  };

  const handleFileUpload = async (type: keyof typeof fileInputRefs, file: File) => {
    setUploads(prev => ({
      ...prev,
      [type]: { ...prev[type], file, status: 'uploading' }
    }));

    try {
      await apiClient.uploadKycDocument(file, type);
      setUploads(prev => ({
        ...prev,
        [type]: { ...prev[type], status: 'completed' }
      }));
      toast.success(`${uploads[type].name} uploaded successfully`);
    } catch (err) {
      console.error('Upload failed:', err);
      setUploads(prev => ({
        ...prev,
        [type]: { ...prev[type], status: 'error' }
      }));
      toast.error(`Failed to upload ${uploads[type].name}`);
    }
  };

  const allUploaded = uploads.tax_return_y1.status === 'completed' &&
    uploads.tax_return_y2.status === 'completed' &&
    uploads.balance_sheet.status === 'completed';

  const handleSubmitManual = async () => {
    if (!allUploaded) return;

    setLoading(true);
    try {
      await apiClient.updateMyKycStatus('pending');
      await refreshUser();
      toast.success('KYC documents submitted for review');
      router.push('/dashboard');
    } catch (err) {
      console.error('Submission failed:', err);
      toast.error('Failed to submit KYC status');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <section className="relative overflow-hidden rounded-[24px] bg-[#ECEFF4] px-4 py-8 sm:px-6 sm:py-10 lg:px-10 lg:py-12 min-h-[calc(100vh-120px)] flex items-center justify-center">
        <div className="pointer-events-none absolute -bottom-10 left-0 h-[300px] w-full bg-[#E4E9F2]" />

        <div className="relative mx-auto w-full max-w-[1020px] rounded-[20px] border border-[#E9E9E9] bg-white p-6 shadow-[0_16px_32px_rgba(20,26,40,0.08)] sm:p-8 lg:px-12 lg:py-14">
          {/* Logo */}
          <div className="flex justify-center mb-10">
            <Image src="/images/logo.png" alt="Ovalia Capital" width={188} height={56} className="h-[56px] w-auto" />
          </div>

          <div className="border-t border-[#ECECEC] pt-10">
            <h1 className="font-goudy text-[32px] font-bold leading-none text-[#1F2937]">KYC Verify</h1>
            
            {view === 'landing' ? (
              <>
                <p className="mt-6 max-w-[900px] font-helvetica text-[15px] leading-[1.6] text-[#6B7280]">
                  To continue investing, we need to verify your identity and confirm that you meet accredited investor
                  requirements. This process is secure and handled by an authorized third-party provider.
                </p>

                <div className="mt-6 flex flex-col gap-2">
                  <h2 className="font-helvetica text-[16px] font-bold text-[#374151]">Why verification is required?</h2>
                  <p className="max-w-[900px] font-helvetica text-[14px] leading-[1.7] text-[#6B7280]">
                    To comply with regulatory requirements, we must verify your identity and confirm your accredited investor
                    status. This helps keep your investments secure and ensures compliance with financial regulations. You can
                    complete this via Secure online verification or Manual document upload.
                  </p>
                </div>

                <div className="mt-12 grid gap-8 lg:grid-cols-2">
                  {/* Card 1: Verify Online */}
                  <article className="flex flex-col rounded-[16px] bg-[#F9FAFB] border border-[#F3F4F6] p-8 transition-all hover:shadow-md h-full">
                    <h3 className="font-helvetica text-[22px] font-bold leading-none text-[#111827]">Verify Online</h3>
                    <p className="mt-4 flex-1 font-helvetica text-[14px] leading-[1.6] text-[#6B7280]">
                      Complete a short, secure form with our trusted verification partner to confirm your accredited investor
                      status. This typically takes only a few minutes.
                    </p>

                    <ul className="mt-6 space-y-4 mb-10">
                      <li className="flex items-center gap-3 font-helvetica text-[13px] text-[#4B5563]">
                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#FCD34D] text-[#92400E]">
                          <Check className="h-3 w-3" strokeWidth={4} />
                        </div>
                        Instant preliminary review
                      </li>
                      <li className="flex items-center gap-3 font-helvetica text-[13px] text-[#4B5563]">
                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#FCD34D] text-[#92400E]">
                          <Check className="h-3 w-3" strokeWidth={4} />
                        </div>
                        256-bit bank-level security
                      </li>
                    </ul>

                    <button
                      type="button"
                      onClick={handleVerifyOnline}
                      className="w-full rounded-full bg-[#FCD34D] px-6 py-4 text-center font-goudy text-[18px] font-bold text-[#1F2937] hover:bg-[#FBD24E] transition-all active:scale-[0.98]"
                    >
                      Verify with Authorized Provider
                    </button>

                    <p className="mt-4 text-center font-helvetica text-[11px] text-[#9CA3AF]">
                      You&apos;ll be redirected to a secure third-party verification service.
                    </p>
                  </article>

                  {/* Card 2: Manual Upload */}
                  <article className="flex flex-col rounded-[16px] bg-[#F9FAFB] border border-[#F3F4F6] p-8 transition-all hover:shadow-md h-full">
                    <h3 className="font-helvetica text-[22px] font-bold leading-none text-[#111827]">Upload Documents</h3>
                    <p className="mt-4 font-helvetica text-[14px] leading-[1.6] text-[#6B7280] flex-1">
                      If you prefer, you may upload documents for manual review instead of using online verification.
                    </p>

                    <div className="mt-6 space-y-4 mb-10">
                      <p className="font-helvetica text-[12px] font-bold uppercase tracking-wider text-[#9CA3AF]">Accepted Documents</p>
                      <li className="flex items-center gap-3 font-helvetica text-[13px] text-[#4B5563]">
                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#FCD34D] text-[#92400E]">
                          <Check className="h-3 w-3" strokeWidth={4} />
                        </div>
                        Last 2 years of tax returns
                      </li>
                      <li className="flex items-center gap-3 font-helvetica text-[13px] text-[#4B5563]">
                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#FCD34D] text-[#92400E]">
                          <Check className="h-3 w-3" strokeWidth={4} />
                        </div>
                        Balance sheet or net worth statement
                      </li>
                    </div>

                    <button
                      type="button"
                      onClick={() => setView('manual')}
                      className="w-full rounded-full bg-[#FCD34D] px-6 py-4 text-center font-goudy text-[18px] font-bold text-[#1F2937] hover:bg-[#FBD24E] transition-all active:scale-[0.98]"
                    >
                      Upload Documents Manually
                    </button>

                    <p className="mt-4 text-center font-helvetica text-[11px] text-[#9CA3AF]">
                      Our team will review your documents (2-3 business days).
                    </p>
                  </article>
                </div>
              </>
            ) : (
              <div className="mt-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center justify-between">
                  <p className="font-helvetica text-[15px] text-[#6B7280]">Please upload the following required documents for manual verification.</p>
                  <button 
                    onClick={() => setView('landing')}
                    className="text-sm font-bold text-[#1F3B6E] hover:underline"
                  >
                    ← Back to choices
                  </button>
                </div>

                <div className="grid gap-4">
                  {(['tax_return_y1', 'tax_return_y2', 'balance_sheet'] as const).map((type) => (
                    <div key={type} className="flex items-center justify-between p-5 bg-[#F9FAFB] rounded-2xl border border-[#F3F4F6] group transition-all hover:border-[#FCD34D] hover:bg-white hover:shadow-sm">
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-xl ${uploads[type].status === 'completed' ? 'bg-green-50' : 'bg-gray-50'}`}>
                          <FileText className={`h-6 w-6 ${uploads[type].status === 'completed' ? 'text-green-500' : 'text-gray-400'}`} />
                        </div>
                        <div>
                          <span className="block text-base font-bold text-[#1F2937]">{uploads[type].name}</span>
                          <span className="text-xs text-gray-500">PDF or Images accepted (Max 10MB)</span>
                        </div>
                      </div>

                      <div className="flex items-center">
                        <input
                          type="file"
                          ref={fileInputRefs[type]}
                          className="hidden"
                          accept=".pdf,image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleFileUpload(type, file);
                          }}
                        />
                        {uploads[type].status === 'idle' && (
                          <button
                            onClick={() => fileInputRefs[type].current?.click()}
                            className="px-6 py-2 text-sm font-bold bg-white border border-[#E5E7EB] text-[#1F3B6E] rounded-xl hover:bg-gray-50 transition-all hover:border-[#1F3B6E] shadow-sm"
                          >
                            Select File
                          </button>
                        )}
                        {uploads[type].status === 'uploading' && (
                          <div className="flex items-center gap-2 text-[#FCD34D] font-bold text-sm">
                            <Loader2 className="h-5 w-5 animate-spin" />
                            <span>Uploading...</span>
                          </div>
                        )}
                        {uploads[type].status === 'completed' && (
                          <div className="flex items-center gap-2 text-green-600 font-bold text-sm">
                            <CheckCircle2 className="h-5 w-5" />
                            <span>Complete</span>
                          </div>
                        )}
                        {uploads[type].status === 'error' && (
                          <button
                            onClick={() => fileInputRefs[type].current?.click()}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-all flex items-center gap-2"
                          >
                            <AlertCircle className="h-5 w-5" />
                            <span className="text-sm font-bold">Retry</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-6 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={handleSubmitManual}
                    disabled={loading || !allUploaded}
                    className="w-full rounded-xl bg-[#1F3B6E] px-8 py-5 text-center font-bold text-white hover:bg-[#162A50] disabled:opacity-50 disabled:grayscale transition-all active:scale-[0.98] flex items-center justify-center gap-3 shadow-xl"
                  >
                    {loading && <Loader2 className="h-5 w-5 animate-spin" />}
                    Submit for Manual Review
                  </button>
                  <p className="mt-4 text-center font-helvetica text-[13px] text-[#9CA3AF]">
                    Our team will typically review your submission within 48 hours.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </DashboardLayout>
  );
}

