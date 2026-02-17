'use client';

import Link from 'next/link';
import { useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { ChevronDown, MoreVertical, Search } from 'lucide-react';

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

const rows: TaxVaultRow[] = [
  {
    id: '1',
    accountant: 'Abram Gouse',
    initials: 'AG',
    fileName: 'k-1_2025.pdf',
    documentType: 'K-1',
    taxYear: '2025',
    status: 'Clean',
    uploadedDate: 'Dec 26, 2025',
  },
  {
    id: '2',
    accountant: 'James Workman',
    initials: 'JW',
    fileName: 'W-9_update.pdf',
    documentType: 'W-9',
    taxYear: '2025',
    status: 'Pending',
    uploadedDate: 'Dec 26, 2025',
  },
  {
    id: '3',
    accountant: 'Kadin Philips',
    initials: 'KP',
    fileName: 'Statement_Q3.pdf',
    documentType: 'Statement',
    taxYear: '2025',
    status: 'Flagged',
    uploadedDate: 'Dec 26, 2025',
  },
  {
    id: '4',
    accountant: 'Charlie Siphron',
    initials: 'CS',
    fileName: 'Statement_Q3.pdf',
    documentType: 'Statement',
    taxYear: '2025',
    status: 'Flagged',
    uploadedDate: 'Dec 26, 2025',
  },
];

const statusClass: Record<TaxDocStatus, string> = {
  Clean: 'bg-[#EAF8EE] text-[#1D9A58]',
  Pending: 'bg-[#FFF4E0] text-[#E59D22]',
  Flagged: 'bg-[#FDEBEC] text-[#E05252]',
};

export default function TaxVaultPage() {
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-8xl px-2  font-helvetica text-[#1F1F1F]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-goudy text-[20px] leading-[28px] text-[#1F1F1F]">Tax Vault</h1>
            <p className="mt-1 text-[14px] leading-6 text-[#8E8E93]">
              Securely manage and review investor tax documents.
            </p>
          </div>

          <Link
            href="/dashboard/tax-vault/upload"
            className="inline-flex h-[44px] min-w-[220px] items-center justify-center rounded-full bg-[#FBCB4B] px-8 text-[16px] font-medium text-[#1F1F1F]"
          >
            Upload Document
          </Link>
        </div>

        <div className="mt-8 rounded-[10px] bg-white px-6 py-6">
          <div className="flex flex-wrap items-center gap-4">
            <label className="relative block w-full max-w-[417px]">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#9FA3A9]" />
              <input
                type="text"
                placeholder="Find something here..."
                className="h-[52px] w-full rounded-[26px] bg-[#F5F5F5] pl-12 pr-4 text-[16px] text-[#1F1F1F] outline-none placeholder:text-[#A2A5AA]"
              />
            </label>

            <button
              type="button"
              className="inline-flex h-[52px] min-w-[153px] items-center justify-between rounded-[24px] bg-[#F5F5F5] px-6 text-[16px] text-[#8E8E93]"
            >
              Document Type
              <ChevronDown className="ml-3 h-5 w-5" />
            </button>

            <button
              type="button"
              className="inline-flex h-[52px] min-w-[96px] items-center justify-between rounded-[24px] bg-[#F5F5F5] px-5 text-[16px] text-[#8E8E93]"
            >
              Year
              <ChevronDown className="ml-3 h-5 w-5" />
            </button>
          </div>

          <div className="mt-6 overflow-x-auto">
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
                {rows.map((row) => (
                  <tr key={row.id} className="border-b border-[#F1F1F1]">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#E9EDF4] text-[12px] font-semibold text-[#274583]">
                          {row.initials}
                        </div>
                        <span>{row.accountant}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">{row.fileName}</td>
                    <td className="px-4 py-4">{row.documentType}</td>
                    <td className="px-4 py-4">{row.taxYear}</td>
                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-[12px] font-medium ${statusClass[row.status]}`}
                      >
                        {row.status}
                      </span>
                    </td>
                    <td className="px-4 py-4">{row.uploadedDate}</td>
                    <td className="relative px-4 py-4 text-center">
                      <button
                        type="button"
                        className="inline-flex h-7 w-7 items-center justify-center rounded-full text-[#8E8E93] hover:bg-[#F5F5F5]"
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
                          <div className="absolute right-6 top-11 z-20 w-[145px] rounded-[4px] border border-[#EFEFEF] bg-white py-1 text-left shadow-[0_10px_24px_rgba(0,0,0,0.08)]">
                            <Link
                              href="/dashboard/tax-vault/details"
                              className="block w-full px-3 py-2 text-[13px] text-[#4B4B4B] hover:bg-[#F8F8F8]"
                              onClick={() => setActiveMenuId(null)}
                            >
                              View Document
                            </Link>
                            <button
                              type="button"
                              className="block w-full px-3 py-2 text-[13px] text-[#4B4B4B] hover:bg-[#F8F8F8]"
                              onClick={() => setActiveMenuId(null)}
                            >
                              Download
                            </button>
                            <button
                              type="button"
                              className="block w-full px-3 py-2 text-[13px] text-[#4B4B4B] hover:bg-[#F8F8F8]"
                              onClick={() => setActiveMenuId(null)}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              className="block w-full px-3 py-2 text-[13px] text-[#4B4B4B] hover:bg-[#F8F8F8]"
                              onClick={() => setActiveMenuId(null)}
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
          </div>

          <div className="mt-5 flex items-center justify-end gap-2 text-[16px] text-[#8E8E93]">
            <button type="button" className="px-1">&lt; Previous</button>
            <button
              type="button"
              className="inline-flex h-8 w-8 items-center justify-center rounded-[8px] bg-[#274583] text-white"
            >
              1
            </button>
            <button type="button" className="inline-flex h-8 w-8 items-center justify-center rounded-[8px]">2</button>
            <button type="button" className="inline-flex h-8 w-8 items-center justify-center rounded-[8px]">3</button>
            <button type="button" className="inline-flex h-8 w-8 items-center justify-center rounded-[8px]">4</button>
            <button type="button" className="px-1">Next &gt;</button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
