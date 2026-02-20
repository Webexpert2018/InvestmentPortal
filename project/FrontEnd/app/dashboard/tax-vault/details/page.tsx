'use client';

import Image from 'next/image';
import Link from 'next/link';
import { DashboardLayout } from '@/components/DashboardLayout';
import { ChevronLeft } from 'lucide-react';

export default function TaxVaultDocumentDetailsPage() {
  const documentUrl = '/images/document_details.jpg';

  const handleViewDocument = () => {
    window.open(documentUrl, '_blank', 'noopener,noreferrer');
  };

  const handleDownloadDocument = () => {
    const anchor = document.createElement('a');
    anchor.href = documentUrl;
    anchor.download = 'document_details.jpg';
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
  };

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-8xl font-helvetica text-[#1F1F1F]">
        <div className="mb-4 flex items-center gap-2">
          <Link href="/dashboard/tax-vault" className="text-[#8E8E93]">
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <h1 className="font-goudy  text-md sm:text-xxl leading-[34px]">Document Details</h1>
        </div>

        <div className="rounded-[10px] bg-white px-5 py-5">
          <div className="grid gap-5 lg:grid-cols-[260px_minmax(0,1fr)]">
            <div className="overflow-hidden rounded-[6px] border border-[#F1F1F1]">
              <Image
                src="/images/document_details.jpg"
                alt="Document preview"
                width={260}
                height={420}
                className="h-[420px] w-full object-cover"
              />
            </div>

            <div>
              <h2 className="font-goudy text-md sm:text-xxl leading-[34px] text-[#1F1F1F]">File Information</h2>
              <div className="mt-5 border-t border-[#F1F1F1] pt-5">
                <div className="grid gap-y-5 md:grid-cols-2">
                  <div>
                    <p className="text-[14px] text-[#8E8E93]">Upload Date</p>
                    <p className="mt-1 text-[14px] leading-6 text-[#333333]">Dec 26, 2025</p>
                  </div>
                  <div>
                    <p className="text-[14px] text-[#8E8E93]">Document Type</p>
                    <p className="mt-1 text-[14px] leading-6 text-[#333333]">W-9 Form</p>
                  </div>
                  <div>
                    <p className="text-[14px] text-[#8E8E93]">Tax Year</p>
                    <p className="mt-1 text-[14px] leading-6 text-[#333333]">2025</p>
                  </div>
                  <div>
                    <p className="text-[14px] text-[#8E8E93]">File Size</p>
                    <p className="mt-1 text-[14px] leading-6 text-[#333333]">5.2 MB</p>
                  </div>
                </div>

                <div className="mt-5">
                  <p className="text-[14px] text-[#8E8E93]">Description</p>
                  <p className="mt-1 text-[16px] leading-8 text-[#333333]">
                    Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum is simply dummy text of the printing
                  </p>
                </div>

                <div className="mt-5">
                  <p className="text-[14px] text-[#8E8E93]">Note</p>
                  <p className="mt-1 text-[16px] leading-8 text-[#333333]">
                    Lorem Ipsum is simply dummy text of the printing and typesetting industry.
                  </p>
                </div>

                <div className="mt-6 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleViewDocument}
                    className="h-[42px] min-w-[136px] rounded-full bg-[#FFF3D6] px-6 text-[16px] text-[#4B4B4B]"
                  >
                    View Document
                  </button>
                  <button
                    type="button"
                    onClick={handleDownloadDocument}
                    className="h-[42px] min-w-[136px] rounded-full bg-[#FFF3D6] px-6 text-[16px] text-[#4B4B4B]"
                  >
                    Download Doc
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
