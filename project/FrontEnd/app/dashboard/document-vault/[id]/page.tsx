'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRef, useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import {
  ChevronLeft,
  Download,
  FileText,
  Maximize2,
  Minus,
  Plus,
  Printer,
  Search,
  Loader2,
} from 'lucide-react';
import { apiClient } from '@/lib/api/client';

type DocumentDetailsPageProps = {
  params: {
    id: string;
  };
};

export default function DocumentVaultDetailsPage({ params }: DocumentDetailsPageProps) {
  const viewerContainerRef = useRef<HTMLDivElement | null>(null);
  const [doc, setDoc] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [zoom, setZoom] = useState(100);

  useEffect(() => {
    const fetchDoc = async () => {
      try {
        const data = await apiClient.getDocumentById(params.id);
        setDoc(data);
      } catch (err) {
        console.error('Failed to fetch document:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDoc();
  }, [params.id]);

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';
  const viewUrl = doc ? `${apiClient.getApiUrl()}/documents/${doc.id}/view?token=${token}` : '';
  const isPDF = doc?.file_name?.toLowerCase().endsWith('.pdf');

  const handleDownload = () => {
    if (!doc) return;
    const anchor = document.createElement('a');
    anchor.href = `${apiClient.getApiUrl()}/documents/${doc.id}/download`;
    anchor.download = doc.file_name;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(50, prev - 10));
  };

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(200, prev + 10));
  };

  const handlePrint = () => {
    window.print();
  };

  const handleToggleFullscreen = async () => {
    const element = viewerContainerRef.current;
    if (!element) return;

    if (document.fullscreenElement) {
      await document.exitFullscreen();
      return;
    }

    await element.requestFullscreen();
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex h-[400px] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#274583]" />
        </div>
      </DashboardLayout>
    );
  }

  if (!doc) {
    return (
      <DashboardLayout>
        <div className="p-8 text-center bg-white rounded-xl shadow-sm">
          <p className="text-gray-500">Document not found</p>
          <Link href="/dashboard/document-vault" className="mt-4 inline-block text-[#274583] font-medium underline">
            Back to Document Vault
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-8xl font-helvetica text-[#1F1F1F]">
        <div className="mb-4 flex items-center gap-2">
          <Link href="/dashboard/document-vault" className="text-[#8E8E93]">
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <h1 className="font-goudy text-[30px] leading-[34px]">Document Details</h1>
        </div>

        <div className="rounded-[8px] bg-white px-4 py-3">
          <div ref={viewerContainerRef} className="flex min-h-[700px] flex-col rounded-[6px] border border-[#E9EBEE] bg-[#F8F9FB]">
            <div className="flex h-[44px] items-center justify-between border-b border-[#E2E5EA] bg-white px-4">
              <div className="flex items-center gap-3 text-[12px] text-[#6B7280]">
                <Link href="/dashboard/document-vault" className="inline-flex items-center gap-1 text-[#5E6B7F]">
                  <ChevronLeft className="h-4 w-4" />
                  Back
                </Link>
                <div>
                  <p className="font-medium text-[#374151]">{doc.file_name}</p>
                  <p className="text-[10px] text-[#9CA3AF]">
                    Document Vault &gt; {doc.document_type?.replace(/_/g, ' ').toUpperCase() || 'GENERAL'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-[#6B7280]">
                <button type="button" onClick={handleDownload} className="hover:text-[#374151]" title="Download">
                  <Download className="h-3.5 w-3.5" />
                </button>
                <button type="button" onClick={handlePrint} className="hover:text-[#374151]" title="Print">
                  <Printer className="h-3.5 w-3.5" />
                </button>
                <span className="text-[11px] text-[#6B7280]">{zoom}%</span>
                <button type="button" onClick={handleZoomOut} className="hover:text-[#374151]" aria-label="Zoom out">
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <button type="button" onClick={handleZoomIn} className="hover:text-[#374151]" aria-label="Zoom in">
                  <Plus className="h-3.5 w-3.5" />
                </button>
                <button type="button" onClick={handleToggleFullscreen} className="hover:text-[#374151]" aria-label="Toggle fullscreen">
                  <Maximize2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            <div className="flex flex-1 overflow-hidden">
              <div className="flex-1 relative bg-[#ECEDEF] p-4 flex items-center justify-center min-h-[600px]">
                <div
                  className="w-full h-full border border-[#D9DDE3] bg-white shadow-sm flex items-center justify-center overflow-auto"
                  style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'center center' }}
                >
                  {isPDF ? (
                    <iframe
                      src={`${viewUrl}&#toolbar=0&navpanes=0`}
                      className="w-full h-full min-h-[650px]"
                      title={doc.file_name}
                    />
                  ) : (
                    <div className="relative w-full h-full min-h-[600px]">
                      <Image
                        src={viewUrl}
                        alt={doc.file_name}
                        fill
                        className="object-contain"
                        unoptimized // Cloudinary handles its own optimization
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex h-[30px] items-center justify-between border-t border-[#E2E5EA] bg-white px-4 text-[10px] text-[#98A1B2]">
              <p>Uploaded on {new Date(doc.uploaded_at).toLocaleDateString()}</p>
              <p>File size: {(doc.file_size / 1024).toFixed(1)} KB</p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
