'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { ChevronDown, MoreVertical, Search } from 'lucide-react';

type VaultRow = {
  id: string;
  documentName: string;
  category: string;
  taxYear: string;
  uploadedDate: string;
  fileUrl: string;
};

const allDocuments: VaultRow[] = [
  {
    id: 'k1-2025',
    documentName: 'k-1_2025.pdf',
    category: 'K-1',
    taxYear: '2025',
    uploadedDate: 'Dec 26, 2025',
    fileUrl: '/images/document_details.jpg',
  },
  {
    id: 'w9-update',
    documentName: 'W-9_update8.pdf',
    category: 'W-9',
    taxYear: '2025',
    uploadedDate: 'Dec 26, 2025',
    fileUrl: '/images/document_details.jpg',
  },
  {
    id: 'statement-q3-1',
    documentName: 'Statement_Q3.pdf',
    category: 'Statement',
    taxYear: '2025',
    uploadedDate: 'Dec 26, 2025',
    fileUrl: '/images/document_details.jpg',
  },
  {
    id: 'statement-q3-2',
    documentName: 'Statement_Q3.pdf',
    category: 'Statement',
    taxYear: '2025',
    uploadedDate: 'Dec 26, 2025',
    fileUrl: '/images/document_details.jpg',
  },
];

export default function DocumentVaultPage() {
  const [query, setQuery] = useState('');
  const [docType, setDocType] = useState('all');
  const [year, setYear] = useState('all');
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const pageSize = 4;

  const filtered = useMemo(() => {
    return allDocuments.filter((row) => {
      const typeMatch = docType === 'all' || row.category === docType;
      const yearMatch = year === 'all' || row.taxYear === year;
      const searchMatch =
        query.trim().length === 0 ||
        row.documentName.toLowerCase().includes(query.toLowerCase()) ||
        row.category.toLowerCase().includes(query.toLowerCase());

      return typeMatch && yearMatch && searchMatch;
    });
  }, [query, docType, year]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const rows = filtered.slice(startIndex, startIndex + pageSize);

  const handleDownload = (fileUrl: string, fileName: string) => {
    const anchor = document.createElement('a');
    anchor.href = fileUrl;
    anchor.download = fileName;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
  };

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-8xl px-2 font-helvetica text-[#1F1F1F]">
        <div>
          <h1 className="font-goudy font-bold text-lg md:text-2xl text-[#1F1F1F]">Document Vault</h1>
          <p className="mt-1 text-[14px] leading-6 text-[#8E8E93]">
            Access your K-1 forms, tax documents, statements, and fund reports.
          </p>
        </div>

        <div className="mt-4 rounded-[8px] bg-white px-4 py-4 sm:px-6 sm:py-5">
          <div className="flex flex-wrap items-center gap-3">
            <label className="relative block w-full max-w-[360px]">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#A7ABB2]" />
              <input
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setCurrentPage(1);
                }}
                type="text"
                placeholder="Find something here..."
                className="h-[40px] w-full rounded-full bg-[#F5F5F5] pl-11 pr-4 text-[13px] text-[#1F1F1F] outline-none placeholder:text-[#A2A5AA]"
              />
            </label>

            <div className="relative">
              <select
                value={docType}
                onChange={(event) => {
                  setDocType(event.target.value);
                  setCurrentPage(1);
                }}
                className="h-[40px] min-w-[145px] appearance-none rounded-full bg-[#F5F5F5] px-4 pr-9 text-[13px] text-[#8E8E93] outline-none"
              >
                <option value="all">Document Type</option>
                <option value="K-1">K-1</option>
                <option value="W-9">W-9</option>
                <option value="Statement">Statement</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#A2A5AA]" />
            </div>

            <div className="relative">
              <select
                value={year}
                onChange={(event) => {
                  setYear(event.target.value);
                  setCurrentPage(1);
                }}
                className="h-[40px] min-w-[90px] appearance-none rounded-full bg-[#F5F5F5] px-4 pr-9 text-[13px] text-[#8E8E93] outline-none"
              >
                <option value="all">Year</option>
                <option value="2025">2025</option>
                <option value="2024">2024</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#A2A5AA]" />
            </div>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[860px] border-separate border-spacing-0 text-[12px] text-[#4B4B4B]">
              <thead>
                <tr className="bg-[#FAFAFA] text-left font-medium text-[#4B4B4B]">
                  <th className="rounded-l-[6px] px-3 py-3">Document Name</th>
                  <th className="px-3 py-3">Category</th>
                  <th className="px-3 py-3">Tax Year</th>
                  <th className="px-3 py-3">Uploaded Date</th>
                  <th className="rounded-r-[6px] px-3 py-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-b border-[#F1F1F1]">
                    <td className="px-3 py-4">{row.documentName}</td>
                    <td className="px-3 py-4">{row.category}</td>
                    <td className="px-3 py-4">{row.taxYear}</td>
                    <td className="px-3 py-4">{row.uploadedDate}</td>
                    <td className="relative px-3 py-4 text-center">
                      <button
                        type="button"
                        onClick={() => setActiveMenuId((prev) => (prev === row.id ? null : row.id))}
                        className="inline-flex h-7 w-7 items-center justify-center rounded-full text-[#8E8E93] hover:bg-[#F5F5F5]"
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
                          <div className="absolute right-6 top-11 z-20 w-[122px] rounded-[4px] border border-[#EFEFEF] bg-white py-1 text-left shadow-[0_10px_24px_rgba(0,0,0,0.08)]">
                            <Link
                              href={`/dashboard/document-vault/${row.id}`}
                              onClick={() => setActiveMenuId(null)}
                              className="block px-3 py-2 text-[12px] text-[#4B4B4B] hover:bg-[#F8F8F8]"
                            >
                              View Document
                            </Link>
                            <button
                              type="button"
                              onClick={() => {
                                handleDownload(row.fileUrl, row.documentName);
                                setActiveMenuId(null);
                              }}
                              className="block w-full px-3 py-2 text-left text-[12px] text-[#4B4B4B] hover:bg-[#F8F8F8]"
                            >
                              Download
                            </button>
                          </div>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-3 py-8 text-center text-[13px] text-[#8E8E93]">
                      No documents found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex items-center justify-end gap-2 text-[12px] text-[#8E8E93]">
            <button
              type="button"
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              className="px-1"
            >
              &lt; Previous
            </button>

            {Array.from({ length: totalPages }, (_, index) => {
              const page = index + 1;
              const isActive = page === currentPage;

              return (
                <button
                  key={page}
                  type="button"
                  onClick={() => setCurrentPage(page)}
                  className={`inline-flex h-6 w-6 items-center justify-center rounded-[6px] ${
                    isActive ? 'bg-[#274583] text-white' : 'text-[#8E8E93]'
                  }`}
                >
                  {page}
                </button>
              );
            })}

            <button
              type="button"
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              className="px-1"
            >
              Next &gt;
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
