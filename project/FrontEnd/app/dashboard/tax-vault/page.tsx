'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { ChevronDown, MoreVertical, Search, Loader2 } from 'lucide-react';
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
  accountant: string;
  initials: string;
  fileName: string;
  documentType: string;
  taxYear: string;
  status: TaxDocStatus;
  uploadedDate: string;
};

const statusClass: Record<TaxDocStatus, string> = {
  Clean: 'bg-[#EAF8EE] text-[#1D9A58]',
  Pending: 'bg-[#FFF4E0] text-[#E59D22]',
  Flagged: 'bg-[#FDEBEC] text-[#E05252]',
};

export default function TaxVaultPage() {
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
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const data = await apiClient.getAllDocuments();

      const mappedRows: TaxVaultRow[] = data.map((doc: any) => ({
        id: doc.id,
        accountant: 'System', // Placeholder since real data isn't in table yet
        initials: 'S',
        fileName: doc.file_name,
        documentType: doc.document_type,
        taxYear: doc.tax_year?.toString() || 'N/A',
        status: (doc.status as TaxDocStatus) || 'Clean',
        uploadedDate: new Date(doc.uploaded_at).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        }),
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

  const uniqueTypes = Array.from(new Set(documents.map(d => d.documentType).filter(Boolean)));
  const documentTypes = ['All', ...uniqueTypes.sort()];

  const uniqueYears = Array.from(new Set(documents.map(d => d.taxYear).filter(y => y && y !== 'N/A')));
  const taxYears = ['All', ...uniqueYears.sort((a, b) => b.localeCompare(a))];

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.fileName.toLowerCase().includes(searchQuery.toLowerCase());
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
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="font-goudy font-bol text-lg md:text-2xl text-[#1F1F1F]">Tax Vault</h1>
              <p className="mt-1 text-[14px] leading-6 text-[#8E8E93]">
                Securely manage and review investor tax documents.
              </p>
            </div>

            <Link
              href="/dashboard/tax-vault/upload"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-[#FFC63F] to-[#F1DD58] px-5 py-2 rounded-full text-sm font-medium shadow-md transition-all hover:shadow-lg active:scale-95"
            >
              Upload Document
            </Link>
          </div>

          <div className="mt-6 rounded-[10px] bg-white px-6 py-6 ring-1 ring-black/5 shadow-sm">
            <div className="flex flex-wrap items-center gap-4">
              <label className="relative block w-full max-w-[417px]">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#9FA3A9]" />
                <input
                  type="text"
                  placeholder="Find something here..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="h-[50px] w-full rounded-[26px] bg-[#F5F5F5] pl-12 pr-4 text-[16px] text-[#1F1F1F] outline-none placeholder:text-[#A2A5AA] ring-1 ring-transparent focus:ring-amber-200 transition-all"
                />
              </label>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setIsTypeOpen(!isTypeOpen);
                    setIsYearOpen(false);
                  }}
                  className="inline-flex h-[50px] min-w-[153px] items-center justify-between rounded-[24px] bg-[#F5F5F5] px-6 text-[16px] text-[#8E8E93] hover:bg-[#EFEFEF] transition-colors"
                >
                  {selectedType === 'All' ? 'Document Type' : selectedType}
                  <ChevronDown className={`ml-3 h-5 w-5 transition-transform ${isTypeOpen ? 'rotate-180' : ''}`} />
                </button>
                {isTypeOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setIsTypeOpen(false)} />
                    <div className="absolute top-full left-0 mt-2 z-20 w-48 rounded-xl border border-[#EFEFEF] bg-white py-2 shadow-lg animate-in fade-in zoom-in-95 duration-100">
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

              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setIsYearOpen(!isYearOpen);
                    setIsTypeOpen(false);
                  }}
                  className="inline-flex h-[50px] min-w-[96px] items-center justify-between rounded-[24px] bg-[#F5F5F5] px-5 text-[16px] text-[#8E8E93] hover:bg-[#EFEFEF] transition-colors"
                >
                  {selectedYear === 'All' ? 'Year' : selectedYear}
                  <ChevronDown className={`ml-3 h-5 w-5 transition-transform ${isYearOpen ? 'rotate-180' : ''}`} />
                </button>
                {isYearOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setIsYearOpen(false)} />
                    <div className="absolute top-full left-0 mt-2 z-20 w-32 rounded-xl border border-[#EFEFEF] bg-white py-2 shadow-lg animate-in fade-in zoom-in-95 duration-100">
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

            <div className="mt-6 overflow-x-auto pb-20 custom-scrollbar">
              <div className="min-h-[400px]">
                {loading ? (
                  <div className="flex h-32 items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-[#274583]" />
                  </div>
                ) : error ? (
                  <div className="p-8 text-center text-red-500">{error}</div>
                ) : filteredDocuments.length === 0 ? (
                  <div className="p-8 text-center text-[#8E8E93]">No documents found matching your criteria.</div>
                ) : (
                  <table className="min-w-[1100px] w-full border-separate border-spacing-0 text-[14px] text-[#4B4B4B]">
                    <thead>
                      <tr className="bg-[#FAFAFA] text-left text-[13px] font-medium text-[#4B4B4B]">
                        <th className="rounded-l-[6px] px-4 py-3">Accountant</th>
                        <th className="px-4 py-3">File Name</th>
                        <th className="px-4 py-3">Document Type</th>
                        <th className="px-4 py-3">Tax Year</th>
                        <th className="px-4 py-3">AV Scan Status</th>
                        <th className="px-4 py-3">Uploaded Date</th>
                        <th className="rounded-r-[6px] px-4 py-3 text-center">Action</th>
                      </tr>
                    </thead>

                    <tbody>
                      {currentDocuments.map((row) => (
                        <tr key={row.id} className="border-b border-[#F1F1F1] hover:bg-gray-50/50 transition-colors">
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-3">
                              <div className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#E9EDF4] text-[12px] font-semibold text-[#274583]">
                                {row.initials}
                              </div>
                              <span>{row.accountant}</span>
                            </div>
                          </td>
                          <td className="px-4 py-4 max-w-[200px] truncate" title={row.fileName}>{row.fileName}</td>
                          <td className="px-4 py-4">{row.documentType}</td>
                          <td className="px-4 py-4">{row.taxYear}</td>
                          <td className="px-4 py-4">
                            <span
                              className={`inline-flex rounded-full px-3 py-1 text-[12px] font-medium animate-pulse-subtle ${statusClass[row.status]}`}
                            >
                              {row.status}
                            </span>
                          </td>
                          <td className="px-4 py-4">{row.uploadedDate}</td>
                          <td className="relative px-4 py-4 text-center">
                            <button
                              type="button"
                              className="inline-flex h-7 w-7 items-center justify-center rounded-full text-[#8E8E93] hover:bg-[#F5F5F5] transition-colors"
                              onClick={() => setActiveMenuId((prev) => (prev === row.id ? null : row.id))}
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
                                <div className="absolute right-6 top-11 z-20 w-[145px] rounded-[6px] border border-[#EFEFEF] bg-white py-1 text-left shadow-[0_10px_24px_rgba(0,0,0,0.08)] ring-1 ring-black/5 animate-in fade-in zoom-in-95 duration-100">
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

            {!loading && !error && documents.length > 0 && (
              <div className="mt-5 flex items-center justify-center gap-6 text-[16px] text-[#8E8E93]">
                <button
                  type="button"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-1 hover:text-[#274583] transition-colors disabled:opacity-30 disabled:pointer-events-none"
                >
                  &lt; Previous
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    type="button"
                    onClick={() => setCurrentPage(page)}
                    className={`inline-flex h-8 w-8 items-center justify-center rounded-[8px] transition-colors ${currentPage === page ? 'bg-[#274583] text-white' : 'hover:bg-[#E9EDF4]'}`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="px-1 hover:text-[#274583] transition-colors disabled:opacity-30 disabled:pointer-events-none"
                >
                  Next &gt;
                </button>
              </div>
            )}
          </div>
        </div>

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

            <AlertDialogFooter className="mt-10 flex items-center justify-end gap-3 sm:space-x-0">
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
