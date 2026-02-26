'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { getInvestorKycStatus, setInvestorKycStatus, type InvestorKycStatus } from '@/lib/mock/kycStatus';

export default function KycVerificationPage() {
  const [status, setStatus] = useState<InvestorKycStatus>('pending');

  useEffect(() => {
    setStatus(getInvestorKycStatus());
  }, []);

  const updateStatus = (nextStatus: InvestorKycStatus) => {
    setStatus(nextStatus);
    setInvestorKycStatus(nextStatus);
  };

  const handleVerifyOnline = () => {
    updateStatus('pending');
    window.setTimeout(() => {
      updateStatus('verified');
    }, 1400);
  };

  const handleManualUpload = () => {
    updateStatus('pending');
  };

  return (
    <DashboardLayout>
      <section className="relative overflow-hidden rounded-[24px] bg-[#ECEFF4] px-4 py-8 sm:px-6 sm:py-10 lg:px-10 lg:py-12">
        <div className="pointer-events-none absolute -bottom-20 left-0 h-48 w-full bg-[#E4E9F2]" />

        <div className="relative mx-auto w-full max-w-[1020px] rounded-[10px] border border-[#E9E9E9] bg-white p-4 shadow-[0_16px_32px_rgba(20,26,40,0.12)] sm:p-6 lg:p-7">
          <a href="/" className="flex justify-center">
            <Image src="/images/logo.png" alt="Ovalia Capital" width={188} height={56} className="h-[56px] w-auto logo-con" />
          </a>

          <div className="mt-6 border-t border-[#ECECEC] pt-5">
            <h1 className="font-goudy text-[30px] leading-none text-[#2A2A2A]">KYC Verify</h1>
            <p className="mt-4 max-w-[900px] font-helvetica text-[14px] leading-[1.6] text-[#6E6E6E]">
              To continue investing, we need to verify your identity and confirm that you meet accredited investor
              requirements. This process is secure and handled by an authorized third-party provider.
            </p>

            <h2 className="mt-5 font-helvetica text-[15px] font-semibold text-[#444444]">Why verification is required?</h2>
            <p className="mt-2 max-w-[900px] font-helvetica text-[14px] leading-[1.7] text-[#7B7B7B]">
              To comply with regulatory requirements, we must verify your identity and confirm your accredited investor
              status. This helps keep your investments secure and ensures compliance with financial regulations. You can
              complete this via Secure online verification or Manual document upload.
            </p>
          </div>

          {status === 'verified' && (
            <div className="mt-5 flex items-center gap-2 rounded-[10px] bg-[#ECF9F2] px-4 py-3 text-[#227A50]">
              <CheckCircle2 className="h-5 w-5" />
              <p className="font-helvetica text-[14px] font-medium">KYC verification completed successfully.</p>
            </div>
          )}

          {status === 'rejected' && (
            <div className="mt-5 rounded-[10px] bg-[#FFF1F1] px-4 py-3">
              <p className="font-helvetica text-[14px] font-medium text-[#D23A3A]">
                Verification could not be completed. Please retry online verification or upload documents manually.
              </p>
            </div>
          )}

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <article className="rounded-[8px] bg-[#F6F6F6] p-5">
              <h3 className="font-helvetica text-[28px] font-bold leading-none text-[#414141]">Verify Online</h3>
              <p className="mt-3 max-w-[430px] font-helvetica text-[14px] leading-[1.6] text-[#8A8A8A]">
                Complete a short, secure form with our trusted verification partner to confirm your accredited investor
                status. This typically takes only a few minutes.
              </p>

              <ul className="mt-4 space-y-3">
                <li className="flex items-center gap-2 font-helvetica text-[14px] text-[#6B6B6B]">
                  <span className="inline-block h-[14px] w-[14px] rounded-full bg-[#F2C63D]" />
                  Instant preliminary review
                </li>
                <li className="flex items-center gap-2 font-helvetica text-[14px] text-[#6B6B6B]">
                  <span className="inline-block h-[14px] w-[14px] rounded-full bg-[#F2C63D]" />
                  256-bit bank-level security
                </li>
              </ul>

              <button
                type="button"
                onClick={handleVerifyOnline}
                className="mt-7 w-full rounded-full bg-[#F2D340] px-8 py-[14px] text-center font-goudy text-[28px] leading-none text-[#2A2A2A] hover:bg-[#EAC835]"
              >
                Verify with Authorized Providero
              </button>

              <p className="mt-4 text-center font-helvetica text-[12px] text-[#8D8D8D]">
                You&apos;ll be redirected to a secure third-party verification service.
              </p>
            </article>

            <article className="rounded-[8px] bg-[#F6F6F6] p-5">
              <h3 className="font-helvetica text-[28px] font-bold leading-none text-[#414141]">Upload Documents</h3>
              <p className="mt-3 max-w-[430px] font-helvetica text-[14px] leading-[1.6] text-[#8A8A8A]">
                If you prefer, you may upload documents for manual review instead of using online verification.
              </p>

              <p className="mt-3 font-helvetica text-[13px] text-[#9A9A9A]">Accepted Documents</p>
              <ul className="mt-2 space-y-3">
                <li className="flex items-center gap-2 font-helvetica text-[14px] text-[#6B6B6B]">
                  <span className="inline-block h-[14px] w-[14px] rounded-full bg-[#F2C63D]" />
                  Last 2 years of tax returns
                </li>
                <li className="flex items-center gap-2 font-helvetica text-[14px] text-[#6B6B6B]">
                  <span className="inline-block h-[14px] w-[14px] rounded-full bg-[#F2C63D]" />
                  Balance sheet or net worth statement
                </li>
              </ul>

              <button
                type="button"
                onClick={handleManualUpload}
                className="mt-7 w-full rounded-full bg-[#F2D340] px-8 py-[14px] text-center font-goudy text-[28px] leading-none text-[#2A2A2A] hover:bg-[#EAC835]"
              >
                Upload Documents Manually
              </button>

              <p className="mt-4 text-center font-helvetica text-[12px] text-[#8D8D8D]">
                Our team will review your documents (2-3 business days).
              </p>
            </article>
          </div>
        </div>
      </section>
    </DashboardLayout>
  );
}
