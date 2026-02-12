'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DashboardLayout } from '@/components/DashboardLayout';
import { useRouter } from 'next/navigation';

/* ---------------- Dummy Data ---------------- */
const documentData = {
  uploadDate: 'Dec 26, 2025',
  documentType: 'W-9 Form',
  taxYear: '2025',
  fileSize: '5.2 MB',
  description: 'Lorem Ipsum is simply dummy text of the printing industry.',
  note: 'Lorem Ipsum is simply dummy text.',
  previewImage: '/images/document_details.jpg', // ✅ SAME PATH
  documentUrl: '/documents/sample-document.pdf', // pdf / image
  fileName: 'W9_Form_2025.pdf',
};

export default function DocumentDetailPage() {
  const router = useRouter();

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewType, setPreviewType] = useState<'pdf' | 'image' | null>(null);

  /* ------------ View Document ------------ */
  const handleViewDocument = () => {
    const url = documentData.documentUrl;

    if (!url) return;

    if (url.endsWith('.pdf')) {
      setPreviewType('pdf');
    } else {
      setPreviewType('image');
    }

    setPreviewUrl(url);
  };

  /* ------------ Download Document ------------ */
  const handleDownloadDocument = async () => {
    try {
      const response = await fetch(documentData.documentUrl);
      const blob = await response.blob();

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');

      link.href = url;
      link.download = documentData.fileName;
      document.body.appendChild(link);
      link.click();

      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed', error);
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6">
        {/* Header */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-6"
        >
          <ChevronLeft className="h-4 w-4" />
          Document Details
        </button>

        {/* Main Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[420px_1fr] gap-6">
          {/* -------- Left Preview -------- */}
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="relative w-full h-[560px] rounded border overflow-hidden bg-gray-50">
              {previewUrl ? (
                previewType === 'pdf' ? (
                  <iframe
                    src={previewUrl}
                    title="Document Preview"
                    className="w-full h-full"
                  />
                ) : (
                  <img
                    src={previewUrl}
                    alt="Document Preview"
                    className="w-full h-full object-contain"
                  />
                )
              ) : (
                <Image
                  src={documentData.previewImage}
                  alt="Document Preview"
                  fill
                  className="object-contain"
                />
              )}
            </div>
          </div>

          {/* -------- Right Info -------- */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-base font-semibold text-gray-900 mb-6">
              File Information
            </h3>

            <div className="grid grid-cols-2 gap-x-8 gap-y-5 text-sm">
              <Info label="Upload Date" value={documentData.uploadDate} />
              <Info label="Document Type" value={documentData.documentType} />
              <Info label="Tax Year" value={documentData.taxYear} />
              <Info label="File Size" value={documentData.fileSize} />
            </div>

            <div className="mt-6 space-y-4 text-sm">
              <div>
                <p className="text-gray-500 mb-1">Description</p>
                <p className="text-gray-800 leading-relaxed">
                  {documentData.description}
                </p>
              </div>

              <div>
                <p className="text-gray-500 mb-1">Note</p>
                <p className="text-gray-800 leading-relaxed">
                  {documentData.note}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-8 flex gap-4">
              <Button
                onClick={handleViewDocument}
                className="bg-[#FEF3E2] hover:bg-[#fde8c8] text-gray-900 rounded-full px-6"
              >
                View Document
              </Button>

              <Button
                onClick={handleDownloadDocument}
                className="bg-[#FEF3E2] hover:bg-[#fde8c8] text-gray-900 rounded-full px-6"
              >
                Download Doc
              </Button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

/* -------- Helper -------- */
function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-gray-500 mb-1">{label}</p>
      <p className="text-gray-900 font-medium">{value}</p>
    </div>
  );
}
