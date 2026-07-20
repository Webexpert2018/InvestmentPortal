'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { ChevronDown, MoreVertical, Search, Loader2, FileText, Eye, Download } from 'lucide-react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api/client';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type TaxDocStatus = 'Clean' | 'Pending' | 'Flagged';

type TaxVaultRow = {
  id: string;
  fileName: string;
  documentType: string;
  taxYear: string;
  status: TaxDocStatus;
  uploadedDate: string;
  investorName: string;
  investorAvatar?: string;
  isLegacy?: boolean;
};

const statusClass: Record<TaxDocStatus, string> = {
  Clean: 'bg-[#EAF8EE] text-[#1D9A58]',
  Pending: 'bg-[#FFF4E0] text-[#E59D22]',
  Flagged: 'bg-[#FDEBEC] text-[#E05252]',
};

export default function TaxVaultPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [documents, setDocuments] = useState<TaxVaultRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('All');
  const [selectedYear, setSelectedYear] = useState('All');
  const [isTypeOpen, setIsTypeOpen] = useState(false);
  const [isYearOpen, setIsYearOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [isDeleting, setIsDeleting] = useState(false);
  const [docToDelete, setDocToDelete] = useState<TaxVaultRow | null>(null);

  useEffect(() => {
    if (authLoading) return;
    fetchDocuments();
  }, [user, authLoading]);




  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const data = user?.role === 'investor'
        ? await apiClient.getMyDocuments()
        : await apiClient.getAllDocuments();

      const mappedRows: TaxVaultRow[] = data.map((doc: any) => ({
        id: doc.id,
        fileName: doc.file_name,
        documentType: doc.document_type,
        taxYear: doc.tax_year?.toString() || 'N/A',
        status: (doc.status as TaxDocStatus) || 'Clean',
        uploadedDate: new Date(doc.uploaded_at).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        }),
        investorName: doc.investorName || 'N/A',
        investorAvatar: doc.investorAvatar || '',
        isLegacy: !!doc.is_legacy,
      }));

      setDocuments(mappedRows);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching documents:', err);
      setError('Could not load documents.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      setIsDeleting(true);
      await apiClient.deleteDocument(id);
      setDocuments(prev => prev.filter(d => d.id !== id));
      setActiveMenuId(null);
      setDocToDelete(null);
      toast({
        title: "Success",
        description: "Document deleted successfully.",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Error deleting document.",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDownload = async (id: string) => {
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
      const doc = documents.find(d => d.id === id);
      const fileName = doc ? doc.fileName : 'document';

      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = fileName;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      window.URL.revokeObjectURL(url);

      setActiveMenuId(null);
    } catch (err) {
      console.error('Download failed:', err);
      toast({
        title: "Download Failed",
        description: "Could not download document. Please try again.",
        variant: "destructive"
      });
    }
  };

  const standardDocuments = documents.filter(d => !d.isLegacy);
  const legacyDocuments = documents.filter(d => d.isLegacy);

  const uniqueTypes = Array.from(new Set(standardDocuments.map(d => d.documentType).filter(Boolean)));
  const documentTypes = ['All', ...uniqueTypes.sort()];

  const uniqueYears = Array.from(new Set(standardDocuments.map(d => d.taxYear).filter(y => y && y !== 'N/A')));
  const taxYears = ['All', ...uniqueYears.sort((a, b) => b.localeCompare(a))];

  const filteredDocuments = standardDocuments.filter((doc) => {
    const matchesSearch =
      doc.fileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.documentType?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.investorName?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType = selectedType === 'All' || doc.documentType === selectedType;
    const matchesYear = selectedYear === 'All' || doc.taxYear === selectedYear;

    return matchesSearch && matchesType && matchesYear;
  });

  const itemsPerPage = 7;
  const totalPages = Math.ceil(filteredDocuments.length / itemsPerPage);
  const currentDocuments = filteredDocuments.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <DashboardLayout>
      <>
        <div className="mx-auto max-w-8xl font-helvetica text-[#1F1F1F]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="mb-2 sm:mb-0">
              <h1 className="font-goudy font-bold text-xl md:text-2xl text-[#1F1F1F]">Tax Vault</h1>
              <p className="mt-1 text-[13px] md:text-[14px] leading-6 text-[#8E8E93]">
                Securely manage and review investor tax documents.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {user?.role !== 'accountant' && (
                <div className="hidden lg:flex items-center gap-4 text-xs">
                  <div className="bg-[#FAFAFA] border border-[#E5E5EA] rounded-full px-5 py-2.5 shadow-sm flex items-center gap-3">
                    <div className={`h-2.5 w-2.5 rounded-full ${user?.assignedAccountantName ? 'bg-[#2BB673]' : 'bg-[#8E8E93]'}`}></div>
                    <div>
                      <p className="text-[10px] text-[#8E8E93] uppercase font-bold tracking-wider">Accountant</p>
                      <p className="text-[13px] font-bold text-[#1F1F1F]">{user?.assignedAccountantName || 'Not Assigned'}</p>
                    </div>
                  </div>
                </div>
              )}

              <Link
                href="/dashboard/tax-vault/upload"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-gradient-to-r from-[#FFC63F] to-[#F1DD58] px-6 py-3 rounded-full text-[13px] md:text-[15px] font-bold shadow-md transition-all hover:shadow-lg active:scale-95"
              >
                Upload Document
              </Link>
            </div>
          </div>

          <div className="mt-6 rounded-xl bg-white p-4 sm:p-6 shadow-sm border border-[#F0F0F0]">
            <div className="flex flex-col lg:flex-row lg:items-center gap-3 mb-6">
              <div className="relative w-full lg:w-[320px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9CA3AF]" />
                <input
                  type="text"
                  placeholder="Find something here..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="h-[40px] w-full rounded-full bg-[#F5F5F5] pl-11 pr-4 text-[14px] text-[#1F1F1F] outline-none placeholder:text-[#A2A5AA] font-helvetica border border-transparent focus:border-[#FFC63F] transition-all"
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                <div className="relative flex-1 sm:flex-none">
                  <button
                    type="button"
                    onClick={() => {
                      setIsTypeOpen(!isTypeOpen);
                      setIsYearOpen(false);
                    }}
                    className="w-full sm:w-auto inline-flex h-[40px] sm:min-w-[153px] items-center justify-between rounded-[24px] bg-[#F5F5F5] px-6 text-[14px] text-[#8E8E93] hover:bg-[#EFEFEF] transition-colors"
                  >
                    {selectedType === 'All' ? 'Document Type' : selectedType}
                    <ChevronDown className={`ml-2 h-4 w-4 transition-transform ${isTypeOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {isTypeOpen && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setIsTypeOpen(false)} />
                      <div className="absolute top-full left-0 mt-2 z-20 w-full sm:w-48 rounded-xl border border-[#EFEFEF] bg-white py-2 shadow-lg animate-in fade-in zoom-in-95 duration-100">
                        {documentTypes.map(type => (
                          <button
                            key={type}
                            onClick={() => {
                              setSelectedType(type);
                              setIsTypeOpen(false);
                              setCurrentPage(1);
                            }}
                            className={`block w-full px-4 py-2 text-left text-sm transition-colors ${selectedType === type ? 'bg-[#F5F5F5] text-[#274583] font-semibold' : 'text-[#4B4B4B] hover:bg-[#F8F8F8]'}`}
                          >
                            {type}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>

                <div className="relative flex-1 sm:flex-none">
                  <button
                    type="button"
                    onClick={() => {
                      setIsYearOpen(!isYearOpen);
                      setIsTypeOpen(false);
                    }}
                    className="w-full sm:w-auto inline-flex h-[40px] sm:min-w-[96px] items-center justify-between rounded-[24px] bg-[#F5F5F5] px-5 text-[14px] text-[#8E8E93] hover:bg-[#EFEFEF] transition-colors"
                  >
                    {selectedYear === 'All' ? 'Year' : selectedYear}
                    <ChevronDown className={`ml-2 h-4 w-4 transition-transform ${isYearOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {isYearOpen && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setIsYearOpen(false)} />
                      <div className="absolute top-full left-0 mt-2 z-20 w-full sm:w-32 rounded-xl border border-[#EFEFEF] bg-white py-2 shadow-lg animate-in fade-in zoom-in-95 duration-100">
                        {taxYears.map(year => (
                          <button
                            key={year}
                            onClick={() => {
                              setSelectedYear(year);
                              setIsYearOpen(false);
                              setCurrentPage(1);
                            }}
                            className={`block w-full px-4 py-2 text-left text-sm transition-colors ${selectedYear === year ? 'bg-[#F5F5F5] text-[#274583] font-semibold' : 'text-[#4B4B4B] hover:bg-[#F8F8F8]'}`}
                          >
                            {year}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="overflow-x-auto -mx-4 sm:mx-0 custom-scrollbar">
              <div className="min-w-[900px] sm:min-w-full inline-block align-middle px-4 sm:px-0">
                {loading ? (
                  <div className="flex h-32 items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-[#274583]" />
                  </div>
                ) : error ? (
                  <div className="p-8 text-center text-red-500">{error}</div>
                ) : filteredDocuments.length === 0 ? (
                  <div className="p-8 text-center text-[#8E8E93]">No documents found matching your criteria.</div>
                ) : (
                  <table className="w-full border-separate border-spacing-0 text-[13px] md:text-[14px] text-[#4B4B4B]">
                    <thead>
                      <tr className="bg-[#FAFAFA] text-left text-[12px] md:text-[13px] font-helvetica font-medium tracking-wider text-[#6B7280] whitespace-nowrap">
                        {user?.role !== 'investor' && <th className="px-4 py-3 border-b border-[#ECEDEF]">Investor</th>}
                        <th className="px-4 py-3 border-b border-[#ECEDEF]">File Name</th>
                        <th className="px-4 py-3 border-b border-[#ECEDEF]">Document Type</th>
                        <th className="px-4 py-3 border-b border-[#ECEDEF]">Tax Year</th>
                        <th className="px-4 py-3 border-b border-[#ECEDEF]">Uploaded Date</th>
                        <th className="px-4 py-3 text-right border-b border-[#ECEDEF]">Action</th>
                      </tr>
                    </thead>

                    <tbody>
                      {currentDocuments.map((row, index) => (
                        <tr
                          key={row.id}
                          onClick={() => router.push(`/dashboard/tax-vault/details/${row.id}`)}
                          className="border-b border-[#F1F1F1] hover:bg-gray-50/50 cursor-pointer transition-colors"
                        >
                          {user?.role !== 'investor' && (
                            <td className="px-4 py-4 border-b border-[#F5F5F5]">
                              <div className="flex items-center gap-3">
                                {row.investorAvatar ? (
                                  <img src={row.investorAvatar} alt={row.investorName} className="w-[34px] h-[34px] rounded-full object-cover" />
                                ) : (
                                  <div className="w-[34px] h-[34px] rounded-full bg-[#F3F4F6] flex items-center justify-center text-[#6B7280] text-[11px] font-semibold font-helvetica border border-[#E5E7EB]">
                                    {row.investorName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                                  </div>
                                )}
                                <span className="text-[13px] font-medium text-[#1F1F1F] font-helvetica truncate">{row.investorName}</span>
                              </div>
                            </td>
                          )}
                          <td className="px-4 py-4 border-b border-[#F5F5F5] text-[13px] text-[#6B7280] font-helvetica truncate max-w-[200px]" title={row.fileName}>{row.fileName}</td>
                          <td className="px-4 py-4 border-b border-[#F5F5F5] text-[13px] text-[#6B7280] font-helvetica whitespace-nowrap">{row.documentType}</td>
                          <td className="px-4 py-4 border-b border-[#F5F5F5] text-[13px] text-[#6B7280] font-helvetica whitespace-nowrap">{row.taxYear}</td>
                          <td className="px-4 py-4 border-b border-[#F5F5F5] text-[13px] text-[#6B7280] font-helvetica whitespace-nowrap">{row.uploadedDate}</td>
                          <td className="relative px-4 py-4 border-b border-[#F5F5F5] text-right">
                            <button
                              type="button"
                              className="inline-flex h-7 w-7 items-center justify-center rounded-full text-[#8E8E93] hover:bg-[#F5F5F5] transition-colors"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveMenuId((prev) => (prev === row.id ? null : row.id));
                              }}
                            >
                              <MoreVertical className="h-4 w-4" />
                            </button>

                            {activeMenuId === row.id && (
                              <>
                                <button
                                  type="button"
                                  aria-label="Close menu"
                                  className="fixed inset-0 z-10"
                                  onClick={() => setActiveMenuId(null)}
                                />
                                <div className={`absolute right-6 z-20 w-[145px] rounded-[6px] border border-[#EFEFEF] bg-white py-1 text-left shadow-[0_10px_24px_rgba(0,0,0,0.08)] ring-1 ring-black/5 animate-in fade-in zoom-in-95 duration-100 ${
                                  index === currentDocuments.length - 1 ? 'bottom-11' : 'top-11'
                                }`}>
                                  <Link
                                    href={`/dashboard/tax-vault/details/${row.id}`}
                                    className="block w-full px-3 py-2 text-[13px] text-[#4B4B4B] hover:bg-[#F8F8F8] transition-colors"
                                    onClick={() => setActiveMenuId(null)}
                                  >
                                    View Document
                                  </Link>
                                  <button
                                    type="button"
                                    className="block w-full px-3 py-2 text-[13px] text-[#4B4B4B] hover:bg-[#F8F8F8] transition-colors"
                                    onClick={() => handleDownload(row.id)}
                                  >
                                    Download
                                  </button>

                                  <button
                                    type="button"
                                    className="block w-full px-3 py-2 text-[13px] text-[#E05252] hover:bg-red-50 transition-colors"
                                    onClick={() => {
                                      setDocToDelete(row);
                                      setActiveMenuId(null);
                                    }}
                                  >
                                    Delete
                                  </button>
                                </div>
                              </>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            {!loading && !error && filteredDocuments.length > 0 && (
              <div className="mt-8 flex flex-col items-center gap-6 border-t border-[#F5F5F5] pt-6">
                <div className="flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="inline-flex items-center gap-1 px-4 py-2 text-[13px] text-[#6B7280] disabled:opacity-40 font-helvetica hover:text-[#1F1F1F] transition-colors font-medium"
                  >
                    &lt; Previous
                  </button>

                  <div className="flex gap-2">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                      <button
                        key={page}
                        type="button"
                        onClick={() => setCurrentPage(page)}
                        className={`h-10 w-10 rounded-lg text-[13px] font-medium transition-colors font-helvetica ${currentPage === page ? 'bg-[#1F3B6E] text-white' : 'text-[#6B7280] hover:bg-gray-100'}`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="inline-flex items-center gap-1 px-4 py-2 text-[13px] text-[#6B7280] disabled:opacity-40 font-helvetica hover:text-[#1F1F1F] transition-colors font-medium"
                  >
                    Next &gt;
                  </button>
                </div>

                <div className="text-[13px] text-[#8E8E93] font-helvetica">
                  Showing <span className="font-medium text-[#1F1F1F]">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-medium text-[#1F1F1F]">{Math.min(currentPage * itemsPerPage, filteredDocuments.length)}</span> of <span className="font-medium text-[#1F1F1F]">{filteredDocuments.length}</span> documents
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Legacy Platform Documents Section */}
        {legacyDocuments.length > 0 && (
          <div className="mt-8 rounded-[10px] bg-white px-6 py-6 ring-1 ring-black/5 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div>
                <h2 className="font-goudy font-bold text-lg md:text-xl text-[#1F1F1F]">Legacy Platform Documents</h2>
                <p className="text-xs text-[#8E8E93] mt-0.5">Historical tax documents and K-1s imported from the legacy portal</p>
              </div>
              <span className="text-xs bg-amber-50 text-amber-700 font-bold px-3 py-1 rounded-full border border-amber-200">
                {legacyDocuments.length} Legacy File(s)
              </span>
            </div>

            <div className="overflow-x-auto -mx-4 sm:mx-0 custom-scrollbar">
              <div className="min-w-[900px] sm:min-w-full inline-block align-middle px-4 sm:px-0">
                <table className="w-full border-separate border-spacing-0 text-[13px] md:text-[14px] text-[#4B4B4B]">
                  <thead>
                    <tr className="bg-[#FAFAFA] text-left text-[12px] md:text-[13px] font-helvetica font-medium tracking-wider text-[#6B7280] whitespace-nowrap">
                      {user?.role !== 'investor' && <th className="px-4 py-3 border-b border-[#ECEDEF]">Investor</th>}
                      <th className="px-4 py-3 border-b border-[#ECEDEF]">File Name</th>
                      <th className="px-4 py-3 border-b border-[#ECEDEF]">Document Type</th>
                      <th className="px-4 py-3 border-b border-[#ECEDEF]">Tax Year</th>
                      <th className="px-4 py-3 border-b border-[#ECEDEF]">Uploaded Date</th>
                      <th className="px-4 py-3 text-right border-b border-[#ECEDEF]">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {legacyDocuments.map((row, index) => (
                      <tr
                        key={row.id}
                        onClick={() => router.push(`/dashboard/tax-vault/details/${row.id}`)}
                        className="border-b border-[#F1F1F1] hover:bg-gray-50/50 cursor-pointer transition-colors"
                      >
                        {user?.role !== 'investor' && (
                          <td className="px-4 py-4 border-b border-[#F5F5F5]">
                            <div className="flex items-center gap-3">
                              {row.investorAvatar ? (
                                <img src={row.investorAvatar} alt={row.investorName} className="w-[34px] h-[34px] rounded-full object-cover" />
                              ) : (
                                <div className="w-[34px] h-[34px] rounded-full bg-[#F3F4F6] flex items-center justify-center text-[#6B7280] text-[11px] font-semibold font-helvetica border border-[#E5E7EB]">
                                  {row.investorName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                                </div>
                              )}
                              <span className="text-[13px] font-medium text-[#1F1F1F] font-helvetica truncate">{row.investorName}</span>
                            </div>
                          </td>
                        )}
                        <td className="px-4 py-4 border-b border-[#F5F5F5] text-[13px] text-[#6B7280] font-helvetica truncate max-w-[200px]" title={row.fileName}>{row.fileName}</td>
                        <td className="px-4 py-4 border-b border-[#F5F5F5] text-[13px] text-[#6B7280] font-helvetica whitespace-nowrap">{row.documentType || 'Tax Document'}</td>
                        <td className="px-4 py-4 border-b border-[#F5F5F5] text-[13px] text-[#6B7280] font-helvetica whitespace-nowrap">{row.taxYear}</td>
                        <td className="px-4 py-4 border-b border-[#F5F5F5] text-[13px] text-[#6B7280] font-helvetica whitespace-nowrap">{row.uploadedDate}</td>
                        <td className="relative px-4 py-4 border-b border-[#F5F5F5] text-right">
                          <button
                            type="button"
                            className="inline-flex h-7 w-7 items-center justify-center rounded-full text-[#8E8E93] hover:bg-[#F5F5F5] transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveMenuId((prev) => (prev === row.id ? null : row.id));
                            }}
                          >
                            <MoreVertical className="h-4 w-4" />
                          </button>

                          {activeMenuId === row.id && (
                            <>
                              <button
                                type="button"
                                aria-label="Close menu"
                                className="fixed inset-0 z-10"
                                onClick={() => setActiveMenuId(null)}
                              />
                              <div className={`absolute right-6 z-20 w-[145px] rounded-[6px] border border-[#EFEFEF] bg-white py-1 text-left shadow-[0_10px_24px_rgba(0,0,0,0.08)] ring-1 ring-black/5 animate-in fade-in zoom-in-95 duration-100 ${
                                index === legacyDocuments.length - 1 ? 'bottom-11' : 'top-11'
                              }`}>
                                <Link
                                  href={`/dashboard/tax-vault/details/${row.id}`}
                                  className="block w-full px-3 py-2 text-[13px] text-[#4B4B4B] hover:bg-[#F8F8F8] transition-colors"
                                  onClick={() => setActiveMenuId(null)}
                                >
                                  View Document
                                </Link>
                                <button
                                  type="button"
                                  className="block w-full px-3 py-2 text-[13px] text-[#4B4B4B] hover:bg-[#F8F8F8] transition-colors"
                                  onClick={() => handleDownload(row.id)}
                                >
                                  Download
                                </button>
                              </div>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        <AlertDialog open={!!docToDelete} onOpenChange={(isOpen) => !isOpen && setDocToDelete(null)}>
          <AlertDialogContent className="bg-white rounded-[20px] border-none shadow-2xl p-8 max-w-[520px]">
            <div className="absolute right-6 top-6 text-[#9FA3A9] cursor-pointer hover:text-gray-600 transition-colors" onClick={() => setDocToDelete(null)}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </div>

            <AlertDialogHeader>
              <AlertDialogTitle className="font-goudy text-[28px] text-[#1F1F1F] font-normal">Delete Document</AlertDialogTitle>
              <div className="mt-4 space-y-3">
                <p className="text-[#4B4B4B] text-[16px] leading-relaxed font-goudy">
                  Are you sure you want to delete <span className="font-bold text-[#1F1F1F]">"{docToDelete?.fileName}"</span>?
                </p>
                <p className="text-[#4B4B4B] text-[16px] leading-relaxed font-goudy">
                  This action cannot be undone and will permanently remove the document from the fund.
                </p>
              </div>
            </AlertDialogHeader>

            <AlertDialogFooter className="mt-10 flex items-center justify-center sm:justify-end gap-3 sm:space-x-0">
              <AlertDialogCancel
                className="h-[46px] min-w-[130px] rounded-full bg-[#FFF5E9] border-none text-[#4B4B4B] text-[15px] font-semibold hover:bg-[#FFEBD4] transition-all"
              >
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() => docToDelete && handleDelete(docToDelete.id)}
                disabled={isDeleting}
                className="h-[46px] min-w-[150px] rounded-full bg-[#FFD64B] hover:bg-[#FFCC21] text-[#4B4B4B] text-[15px] font-bold border-none shadow-sm transition-all"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : "Yes, Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    </DashboardLayout>
  );
}
