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
  RotateCw,
  RefreshCw
} from 'lucide-react';
import { apiClient, BASE_URL } from '@/lib/api/client';
import { useToast } from '@/hooks/use-toast';

type DocumentDetailsPageProps = {
  params: {
    id: string;
  };
};

export default function DocumentVaultDetailsPage({ params }: DocumentDetailsPageProps) {
  const id = params.id;
  const { toast } = useToast();

  const [zoom, setZoom] = useState(100);
  const [doc, setDoc] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setToken(localStorage.getItem('token'));
    }
  }, []);

  const getCategoryName = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'tax_return_y1': return 'Tax Return (Year 1)';
      case 'tax_return_y2': return 'Tax Return (Year 2)';
      case 'balance_sheet': return 'Balance Sheet / Net Worth';
      case 'kyc_id': return 'Identity Document';
      case 'kyc': return 'KYC Documents';
      default: return type ? type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Other';
    }
  };

  useEffect(() => {
    if (id) {
      fetchDoc();
    }
  }, [id]);

  const fetchDoc = async () => {
    try {
      setLoading(true);
      const data = await apiClient.getDocumentById(id);
      setDoc(data);
      setError(null);
    } catch (err: any) {
      console.error('Failed to fetch document:', err);
      setError('Could not load document details.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!doc) return;
    try {
      const token = localStorage.getItem('token');
      const downloadUrl = apiClient.getDocumentDownloadUrl(id);
      
      const response = await fetch(downloadUrl, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to download: ${response.status} ${response.statusText}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = doc.file_name || 'document';
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download failed:', err);
      toast({
        title: "Download Failed",
        description: "Could not download document. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleView = () => {
    if (viewUrl) {
      window.open(viewUrl, '_blank');
    } else {
      toast({
        title: "Error",
        description: "Document URL not available.",
        variant: "destructive"
      });
    }
  };

  const viewUrl = (doc && token) ? `${apiClient.getApiUrl()}/documents/${id}/view?token=${encodeURIComponent(token)}` : '';
  const isPdf = doc?.file_name?.toLowerCase().endsWith('.pdf');
  const formattedSize = doc ? (doc.file_size / (1024 * 1024)).toFixed(2) + ' MB' : '0 MB';
  const formattedDate = doc?.uploaded_at ? new Date(doc.uploaded_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }) : 'N/A';

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex h-[60vh] items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-[#274583]" />
        </div>
      </DashboardLayout>
    );
  }

  if (error || !doc) {
    return (
      <DashboardLayout>
        <div className="mx-auto max-w-[1400px] font-helvetica p-8 text-center">
          <p className="text-red-500 text-lg">{error || 'Document not found.'}</p>
          <Link href="/dashboard/document-vault" className="mt-4 inline-block text-[#274583] underline underline-offset-4">
            Back to Document Vault
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-xxl font-helvetica text-[#1F1F1F]">
        <div className="mb-6 flex items-center gap-3">
          <Link href="/dashboard/document-vault" className="flex items-center gap-2 text-[#333333] hover:opacity-70 transition-opacity">
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
                  <button onClick={fetchDoc} className="hover:text-amber-200 transition-colors">
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
                  {viewUrl ? (
                    isPdf ? (
                      <iframe
                        src={`${viewUrl}${viewUrl.includes('#') ? '' : '#toolbar=0'}`}
                        className="w-full h-[600px] border-none"
                        title="PDF Preview"
                      />
                    ) : (
                      <div className="relative w-full h-[600px]">
                        <Image
                          src={viewUrl}
                          alt="Document preview"
                          fill
                          className="object-contain"
                          priority
                          unoptimized
                        />
                      </div>
                    )
                  ) : (
                    <div className="flex flex-col items-center justify-center min-h-[500px] gap-2">
                      <Loader2 className="h-10 w-10 animate-spin text-white/50" />
                      <p className="text-white/50 text-[13px]">Loading document viewer...</p>
                    </div>
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
                    <p className="mt-1.5 text-[18px] font-semibold text-[#1F1F1F]">{getCategoryName(doc.document_type || doc.category)}</p>
                  </div>
                  <div>
                    <span className="text-[14px] font-medium text-[#8E8E93] uppercase tracking-wide">Tax Year</span>
                    <p className="mt-1.5 text-[18px] font-semibold text-[#1F1F1F]">{doc.tax_year || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-[14px] font-medium text-[#8E8E93] uppercase tracking-wide">File Size</span>
                    <p className="mt-1.5 text-[18px] font-semibold text-[#1F1F1F]">{formattedSize}</p>
                  </div>
                </div>

                <div className="mt-10">
                  <span className="text-[14px] font-medium text-[#8E8E93] uppercase tracking-wide">Description</span>
                  <p className="mt-2 text-[16px] leading-[1.6] text-[#4B4B4B]">{doc.description || 'No description provided'}</p>
                </div>

                <div className="mt-10">
                  <span className="text-[14px] font-medium text-[#8E8E93] uppercase tracking-wide">Note</span>
                  <p className="mt-2 text-[16px] leading-[1.6] text-[#4B4B4B]">
                    {doc.note || 'No notes added.'}
                  </p>
                </div>

                <div className="mt-12 flex flex-wrap items-center gap-4">
                  <button
                    type="button"
                    onClick={handleView}
                    className="h-[52px] min-w-[160px] px-10 rounded-full bg-[#FEF3C7] text-[16px] font-bold text-[#92400E] transition-all hover:bg-[#FDE68A] hover:shadow-md active:scale-95"
                  >
                    View Document
                  </button>
                  <button
                    type="button"
                    onClick={handleDownload}
                    className="h-[52px] min-w-[160px] px-10 rounded-full bg-[#FFFBEB] text-[16px] font-bold text-[#92400E] transition-all hover:bg-[#FEF3C7] border border-[#FEF3C7] hover:shadow-md active:scale-95"
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
