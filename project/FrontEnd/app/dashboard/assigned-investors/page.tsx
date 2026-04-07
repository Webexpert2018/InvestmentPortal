"use client"

import React, { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "../../../components/DashboardLayout"
import { useAuth } from "../../../lib/contexts/AuthContext"
import { Search, ChevronDown, ChevronLeft, ChevronRight, ArrowUpDown, MessageSquare } from "lucide-react"

type Investor = {
  id: string
  name: string
  email: string
  accountType: string
  kyc: "Approved" | "Pending" | "Rejected"
  missingDocs: string
  date: string
  avatar: string
  hasNewMessage: boolean
}

const AVATARS = [
  "/images/messages-person/Ellipse%2012.png",
  "/images/messages-person/Ellipse%2013.png",
  "/images/messages-person/Ellipse%2014.png",
  "/images/messages-person/Ellipse%2015.png",
  "/images/messages-person/Ellipse%2016.png",
  "/images/messages-person/Ellipse%2017.png",
  "/images/messages-person/Ellipse%2018.png",
  "/images/messages-person/Ellipse%2019.png",
]

const sampleInvestors: Investor[] = [
  { id: "1", name: "James Mango", email: "demo@gmail.com", accountType: "Personal", kyc: "Approved", missingDocs: "-", date: "Jan 25, 2026", avatar: AVATARS[0], hasNewMessage: true },
  { id: "2", name: "Talan Rhiel Madsen", email: "demo@gmail.com", accountType: "IRA", kyc: "Approved", missingDocs: "-", date: "Jan 25, 2026", avatar: AVATARS[1], hasNewMessage: false },
  { id: "3", name: "Terry George", email: "demo@gmail.com", accountType: "Roth IRA", kyc: "Pending", missingDocs: "3 Doc", date: "Jan 25, 2026", avatar: AVATARS[2], hasNewMessage: false },
  { id: "4", name: "Omar Calzoni", email: "demo@gmail.com", accountType: "IRA", kyc: "Approved", missingDocs: "-", date: "Jan 25, 2026", avatar: AVATARS[3], hasNewMessage: false },
  { id: "5", name: "Martin Gouse", email: "demo@gmail.com", accountType: "Personal", kyc: "Rejected", missingDocs: "5 Doc", date: "Jan 25, 2026", avatar: AVATARS[4], hasNewMessage: false },
  { id: "6", name: "Carter George", email: "demo@gmail.com", accountType: "Roth IRA", kyc: "Approved", missingDocs: "-", date: "Jan 25, 2026", avatar: AVATARS[5], hasNewMessage: false },
  { id: "7", name: "Wilson Westervelt", email: "demo@gmail.com", accountType: "Personal", kyc: "Approved", missingDocs: "-", date: "Jan 25, 2026", avatar: AVATARS[6], hasNewMessage: false },
]

const ITEMS_PER_PAGE = 7

function exportCsv(items: Investor[]) {
  const header = ["Investor Name", "Email", "Account Type", "KYC Status", "Missing Doc", "Date"]
  const rows = items.map((r) => [r.name, r.email, r.accountType, r.kyc, r.missingDocs, r.date])
  const csv = [header, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n")
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `assigned-investors-${new Date().toISOString().slice(0, 10)}.csv`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

export default function AdminAssignedInvestorsPage() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const [query, setQuery] = useState("")
  const [kycFilter, setKycFilter] = useState<string>("All")
  const [typeFilter, setTypeFilter] = useState<string>("All")
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    if (!loading && user && user.role) {
      const role = user.role.trim().toLowerCase()
      const allowed = role === "admin" || role === "accountant" || role === "accountants" || role === "account"
      if (!allowed) router.push("/dashboard")
    }
  }, [user, loading, router])

  const filtered = useMemo(() => {
    return sampleInvestors.filter((inv) => {
      const matchesQuery = `${inv.name} ${inv.email}`.toLowerCase().includes(query.toLowerCase())
      const matchesKyc = kycFilter === "All" || inv.kyc === kycFilter
      const matchesType = typeFilter === "All" || inv.accountType === typeFilter
      return matchesQuery && matchesKyc && matchesType
    })
  }, [query, kycFilter, typeFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE))
  const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)

  const kycColor = (s: string) => {
    if (s === "Approved") return "text-[#16A66A]"
    if (s === "Pending") return "text-[#E5A000]"
    return "text-[#EF4444]"
  }

  return (
    <DashboardLayout>
      <div className="p-0">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-goudy text-lg md:text-2xl font-bold text-[#1F1F1F]">Assigned Investors</h1>
            <p className="mt-1 text-[13px] text-[#8E8E93] font-helvetica">View and manage assigned investor accounts.</p>
          </div>
          <button
            onClick={() => exportCsv(filtered)}
            className="h-[40px] rounded-full bg-gradient-to-r from-[#FFC63F] to-[#F1DD58] px-6 text-[13px] font-semibold text-[#1F1F1F] shadow-sm hover:shadow-md transition-shadow font-helvetica"
          >
            Export List
          </button>
        </div>

        {/* Card */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-[#F0F0F0]">
          {/* Filters */}
          <div className="flex flex-col md:flex-row md:items-center gap-3 mb-5">
            {/* Search */}
            <div className="relative w-full md:w-[280px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9CA3AF]" />
              <input
                value={query}
                onChange={(e) => { setQuery(e.target.value); setCurrentPage(1); }}
                placeholder="Find something here..."
                className="w-full h-[38px] rounded-full border border-[#ECEDEF] bg-[#FAFAFA] pl-9 pr-4 text-[13px] text-[#1F1F1F] outline-none placeholder:text-[#9CA3AF] focus:border-[#D1A94C] font-helvetica"
              />
            </div>
            {/* KYC Status */}
            <div className="relative">
              <select
                value={kycFilter}
                onChange={(e) => { setKycFilter(e.target.value); setCurrentPage(1); }}
                className="h-[38px] appearance-none rounded-full border border-[#ECEDEF] bg-white pl-4 pr-8 text-[13px] text-[#6B7280] outline-none font-helvetica cursor-pointer"
              >
                <option value="All">KYC Status</option>
                <option>Approved</option>
                <option>Pending</option>
                <option>Rejected</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#9CA3AF]" />
            </div>
            {/* Account Type */}
            <div className="relative">
              <select
                value={typeFilter}
                onChange={(e) => { setTypeFilter(e.target.value); setCurrentPage(1); }}
                className="h-[38px] appearance-none rounded-full border border-[#ECEDEF] bg-white pl-4 pr-8 text-[13px] text-[#6B7280] outline-none font-helvetica cursor-pointer"
              >
                <option value="All">Account Type</option>
                <option>Personal</option>
                <option>IRA</option>
                <option>Roth IRA</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#9CA3AF]" />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-[#ECEDEF]">
                  {["Investor Name", "Email", "Account Type", "KYC Status", "Missing Doc", "Date", "Action"].map((h) => (
                    <th key={h} className="px-4 py-3 text-[12px] font-helvetica font-semibold uppercase tracking-wider text-[#6B7280] whitespace-nowrap">
                      <span className="inline-flex items-center gap-1">
                        {h}
                        {h !== "Action" && <ArrowUpDown className="h-3 w-3 text-[#C4C4C4]" />}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginated.map((inv) => (
                  <tr key={inv.id} className="border-b border-[#F5F5F5] last:border-b-0 hover:bg-[#FAFAFA] transition-colors">
                    {/* Investor Name */}
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <img src={inv.avatar} alt={inv.name} className="w-[34px] h-[34px] rounded-full object-cover" />
                        <span className="text-[13px] font-medium text-[#1F1F1F] font-helvetica">{inv.name}</span>
                      </div>
                    </td>
                    {/* Email */}
                    <td className="px-4 py-4 text-[13px] text-[#6B7280] font-helvetica">{inv.email}</td>
                    {/* Account Type */}
                    <td className="px-4 py-4 text-[13px] text-[#6B7280] font-helvetica">{inv.accountType}</td>
                    {/* KYC Status */}
                    <td className="px-4 py-4">
                      <span className={`text-[13px] font-semibold font-helvetica ${kycColor(inv.kyc)}`}>
                        {inv.kyc}
                      </span>
                    </td>
                    {/* Missing Doc */}
                    <td className="px-4 py-4 text-[13px] text-[#6B7280] font-helvetica">{inv.missingDocs}</td>
                    {/* Date */}
                    <td className="px-4 py-4 text-[13px] text-[#6B7280] font-helvetica">{inv.date}</td>
                    {/* Action — message icon with green dot */}
                    <td className="px-4 py-4">
                      <button
                        onClick={() => router.push("/dashboard/messages")}
                        className="relative p-1.5 text-[#9CA3AF] hover:text-[#6B7280] transition-colors"
                        title="Message investor"
                      >
                        <MessageSquare className="h-[18px] w-[18px]" />
                        {inv.hasNewMessage && (
                          <span className="absolute -top-0.5 -right-0.5 h-[8px] w-[8px] rounded-full bg-[#16A66A] border border-white" />
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="mt-5 flex items-center justify-end gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="inline-flex items-center gap-1 px-2 py-1.5 text-[13px] text-[#6B7280] disabled:opacity-40 font-helvetica hover:text-[#1F1F1F] transition-colors"
            >
              <ChevronLeft className="h-3.5 w-3.5" /> Previous
            </button>
            {Array.from({ length: Math.min(totalPages, 4) }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setCurrentPage(p)}
                className={`h-[30px] w-[30px] rounded-full text-[13px] font-medium transition-colors font-helvetica ${currentPage === p
                  ? "bg-[#2D3748] text-white"
                  : "text-[#6B7280] hover:bg-[#F3F4F6]"
                  }`}
              >
                {p}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="inline-flex items-center gap-1 px-2 py-1.5 text-[13px] text-[#6B7280] disabled:opacity-40 font-helvetica hover:text-[#1F1F1F] transition-colors"
            >
              Next <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
