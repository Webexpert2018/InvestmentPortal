'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRef, useState } from 'react';
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
} from 'lucide-react';

type DocumentDetailsPageProps = {
  params: {
    id: string;
  };
};

const documentMeta = {
  title: 'Quarterly Statement Q4 2024',
  breadcrumb: 'Document Vault  >  Tax Documents  >  K1 2024',
  updatedAt: 'Last updated on Feb 10, 2025',
  fileSize: 'File size: 2.3 MB',
  fileUrl: '/images/document_details.jpg',
};

export default function DocumentVaultDetailsPage({ params }: DocumentDetailsPageProps) {
  const fileName = `${params.id}.pdf`;
  const viewerContainerRef = useRef<HTMLDivElement | null>(null);
  const [selectedPage, setSelectedPage] = useState(1);
  const [zoom, setZoom] = useState(100);

  const pages = [1, 2, 3];

  const handleDownload = () => {
    const anchor = document.createElement('a');
    anchor.href = documentMeta.fileUrl;
    anchor.download = fileName;
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

  const handleSearch = () => {
    const searchableWindow = window as Window & { find?: (text: string) => boolean };
    searchableWindow.find?.('Lorem');
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
          <div ref={viewerContainerRef} className="flex min-h-[590px] flex-col rounded-[6px] border border-[#E9EBEE] bg-[#F8F9FB]">
            <div className="flex h-[44px] items-center justify-between border-b border-[#E2E5EA] bg-white px-4">
              <div className="flex items-center gap-3 text-[12px] text-[#6B7280]">
                <Link href="/dashboard/document-vault" className="inline-flex items-center gap-1 text-[#5E6B7F]">
                  <ChevronLeft className="h-4 w-4" />
                  Back
                </Link>
                <div>
                  <p className="font-medium text-[#374151]">{documentMeta.title}</p>
                  <p className="text-[10px] text-[#9CA3AF]">{documentMeta.breadcrumb}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-[#6B7280]">
                <button type="button" onClick={handleDownload} className="hover:text-[#374151]">
                  <Download className="h-3.5 w-3.5" />
                </button>
                <button type="button" onClick={handlePrint} className="hover:text-[#374151]">
                  <Printer className="h-3.5 w-3.5" />
                </button>
                <button type="button" onClick={handleSearch} className="hover:text-[#374151]">
                  <Search className="h-3.5 w-3.5" />
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

            <div className="grid flex-1 grid-cols-[92px_minmax(0,1fr)]">
              <aside className="border-r border-[#E2E5EA] bg-white p-2">
                <div className="space-y-2">
                  {pages.map((pageNumber) => (
                    <button
                      key={pageNumber}
                      type="button"
                      onClick={() => setSelectedPage(pageNumber)}
                      className={`flex h-[102px] w-full flex-col items-center justify-center rounded-[4px] border text-[10px] ${
                        pageNumber === selectedPage
                          ? 'border-[#5EA0FF] bg-[#EEF4FF] text-[#4B5563]'
                          : 'border-[#E4E7EC] bg-[#F4F6F9] text-[#6B7280]'
                      }`}
                    >
                      <FileText className="h-4 w-4" />
                      <span className="mt-1">Page {pageNumber}</span>
                    </button>
                  ))}
                </div>
              </aside>

              <div className="relative overflow-hidden bg-[#ECEDEF] p-4">
                <div
                  className="mx-auto h-full max-h-[500px] max-w-[360px] overflow-hidden border border-[#D9DDE3] bg-white shadow-sm"
                  style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'center center' }}
                >
                  <Image
                    src={documentMeta.fileUrl}
                    alt={`Document page ${selectedPage} preview`}
                    width={360}
                    height={500}
                    className="h-full w-full object-cover"
                  />
                </div>

                <div className="absolute right-3 top-1/2 h-[90px] w-[3px] -translate-y-1/2 rounded-full bg-[#6B7280]" />
              </div>
            </div>

            <div className="flex h-[30px] items-center justify-between border-t border-[#E2E5EA] bg-white px-4 text-[10px] text-[#98A1B2]">
              <p>{documentMeta.updatedAt}</p>
              <p>{documentMeta.fileSize}</p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
