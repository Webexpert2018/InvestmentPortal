'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { ChevronLeft, Minus, Plus, RotateCw, RefreshCw, Loader2 } from 'lucide-react';
import { apiClient, BASE_URL } from '@/lib/api/client';

export default function TaxVaultDocumentDetailsPage() {
  const params = useParams();
  const id = params.id as string;

  const [zoom, setZoom] = useState(100);
  const [documentData, setDocumentData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchDocument();
    }
  }, [id]);

  const fetchDocument = async () => {
    try {
      setLoading(true);
      const data = await apiClient.getDocumentById(id);
      setDocumentData(data);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching document:', err);
      setError('Could not load document details.');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDocument = () => {
    window.print();
  };

  const handleDownloadDocument = () => {
    if (!documentData) return;
    const downloadUrl = apiClient.getDocumentDownloadUrl(id);
    window.open(downloadUrl, '_blank');
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex h-[60vh] items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-[#274583]" />
        </div>
      </DashboardLayout>
    );
  }

  if (error || !documentData) {
    return (
      <DashboardLayout>
        <div className="mx-auto max-w-[1400px] font-helvetica p-8 text-center">
          <p className="text-red-500 text-lg">{error || 'Document not found.'}</p>
          <Link href="/dashboard/tax-vault" className="mt-4 inline-block text-[#274583] underline underline-offset-4">
            Back to Tax Vault
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  const getFullFileUrl = (path: string) => {
    if (path.startsWith('http')) return path;
    if (path.startsWith('/images/') || path.startsWith('/documents/')) return path;
    return `${BASE_URL}${path}`;
  };

  const fileUrl = getFullFileUrl(documentData.file_url);
  const isPdf = documentData.file_url.toLowerCase().endsWith('.pdf');
  const formattedSize = (documentData.file_size / (1024 * 1024)).toFixed(2) + ' MB';
  const formattedDate = new Date(documentData.created_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-xxl font-helvetica text-[#1F1F1F]">
        <div className="mb-6 flex items-center gap-3">
          <Link href="/dashboard/tax-vault" className="flex items-center gap-2 text-[#333333] hover:opacity-70 transition-opacity">
            <ChevronLeft className="h-6 w-6" />
          </Link>
          <h1 className="font-goudy text-[28px] md:text-[34px] leading-tight text-[#1F1F1F]">Document Details</h1>
        </div>

        <div className="rounded-[12px] bg-white p-6 md:p-8 shadow-sm ring-1 ring-black/5">
          <div className="grid gap-10 lg:grid-cols-[460px_1fr]">
            {/* Left side: Document Viewer */}
            <div className="flex flex-col overflow-hidden rounded-[8px] bg-[#525659] shadow-inner">
              {/* Toolbar */}
              <div className="flex h-[48px] items-center justify-between bg-[#323639] px-6 text-white">
                <div className="flex items-center gap-4">
                  <span className="text-[13px] font-medium opacity-90">1 / 1</span>
                </div>

                <div className="flex items-center">
                  <div className="flex items-center border-l border-r border-white/10 px-6 gap-6">
                    <button onClick={() => setZoom(z => Math.max(50, z - 10))} className="hover:text-amber-200 transition-colors">
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="min-w-[40px] text-center text-[13px] font-medium">{zoom}%</span>
                    <button onClick={() => setZoom(z => Math.min(200, z + 10))} className="hover:text-amber-200 transition-colors">
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <button onClick={fetchDocument} className="hover:text-amber-200 transition-colors">
                    <RefreshCw className="h-4 w-4" />
                  </button>
                  <button className="hover:text-amber-200 transition-colors">
                    <RotateCw className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Document Content Area */}
              <div className="relative flex-1 bg-[#525659] p-6 flex justify-center overflow-auto min-h-[500px]">
                <div
                  className="bg-white shadow-2xl transition-transform duration-200 origin-top w-full"
                  style={{ transform: `scale(${zoom / 100})` }}
                >
                  {isPdf ? (
                    <iframe
                      src={`${fileUrl}#toolbar=0`}
                      className="w-full h-[600px] border-none"
                      title="PDF Preview"
                    />
                  ) : (
                    <Image
                      src={fileUrl}
                      alt="Document preview"
                      width={410}
                      height={580}
                      className="h-auto w-full"
                      priority
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Right side: File Information */}
            <div className="flex flex-col pt-2">
              <h2 className="font-goudy text-[28px] md:text-[34px] leading-tight text-[#1F1F1F]">File Information</h2>
              <div className="mt-6 border-t border-[#F1F1F1] pt-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-10">
                  <div>
                    <span className="text-[14px] font-medium text-[#8E8E93] uppercase tracking-wide">Upload Date</span>
                    <p className="mt-1.5 text-[18px] font-semibold text-[#1F1F1F]">{formattedDate}</p>
                  </div>
                  <div>
                    <span className="text-[14px] font-medium text-[#8E8E93] uppercase tracking-wide">Document Type</span>
                    <p className="mt-1.5 text-[18px] font-semibold text-[#1F1F1F]">{documentData.document_type || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-[14px] font-medium text-[#8E8E93] uppercase tracking-wide">Tax Year</span>
                    <p className="mt-1.5 text-[18px] font-semibold text-[#1F1F1F]">{documentData.tax_year || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-[14px] font-medium text-[#8E8E93] uppercase tracking-wide">File Size</span>
                    <p className="mt-1.5 text-[18px] font-semibold text-[#1F1F1F]">{formattedSize}</p>
                  </div>
                </div>

                <div className="mt-10">
                  <span className="text-[14px] font-medium text-[#8E8E93] uppercase tracking-wide">Description</span>
                  <p className="mt-2 text-[16px] font-bold text-[#1F1F1F]">{documentData.description || 'No description provided'}</p>
                  {documentData.description && (
                    <p className="mt-1 text-[16px] leading-[1.6] text-[#4B4B4B]">
                      {documentData.description}
                    </p>
                  )}
                </div>

                <div className="mt-10">
                  <span className="text-[14px] font-medium text-[#8E8E93] uppercase tracking-wide">Note</span>
                  <p className="mt-2 text-[16px] leading-[1.6] text-[#4B4B4B]">
                    {documentData.note || 'No notes added.'}
                  </p>
                </div>

                <div className="mt-12 flex flex-wrap items-center gap-4">
                  <button
                    type="button"
                    onClick={handleViewDocument}
                    className="h-[52px] min-w-[160px] px-8 rounded-full bg-[#FFF3D6] text-[16px] font-semibold text-[#4B4B4B] transition-all hover:bg-[#FFEBBC] hover:shadow-md active:scale-95"
                  >
                    View Document
                  </button>
                  <button
                    type="button"
                    onClick={handleDownloadDocument}
                    className="h-[52px] min-w-[160px] px-8 rounded-full bg-[#FFF3D6] text-[16px] font-semibold text-[#4B4B4B] transition-all hover:bg-[#FFEBBC] hover:shadow-md active:scale-95"
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
