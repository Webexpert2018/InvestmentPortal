"use client"

import React, { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { DashboardLayout } from "../../../components/DashboardLayout"
import { useAuth } from "../../../lib/contexts/AuthContext"
import { apiClient } from "../../../lib/api/client"
import { Search, ChevronDown, ChevronLeft, ChevronRight, ArrowUpDown, MessageSquare } from "lucide-react"
import { format } from "date-fns"

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
  status: string
  kyc_status: string
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

const ITEMS_PER_PAGE = 10

function exportCsv(items: Investor[]) {
  const header = ["Investor Name", "Email", "Account Type", "KYC Status", "Missing Doc", "Date", "Status"]
  const rows = items.map((r) => [r.name, r.email, r.accountType, r.kyc, r.missingDocs, r.date, r.status])
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
  const { user, loading: authLoading } = useAuth()
  const [investors, setInvestors] = useState<Investor[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState("")
  const [kycFilter, setKycFilter] = useState<string>("All")
  const [typeFilter, setTypeFilter] = useState<string>("All")
  const [currentPage, setCurrentPage] = useState(1)
  const [sortConfig, setSortConfig] = useState<{ key: keyof Investor; direction: 'asc' | 'desc' } | null>(null)

  const requestSort = (key: keyof Investor) => {
    let direction: 'asc' | 'desc' = 'asc'
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc'
    }
    setSortConfig({ key, direction })
  }

  useEffect(() => {
    if (!authLoading && user && user.role) {
      const role = user.role.trim().toLowerCase()
      const allowed = role === "admin" || role === "executive_admin" || role === "accountant" || role === "accountants" || role === "account"
      if (!allowed) router.push("/dashboard")
    }
  }, [user, authLoading, router])

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const [assignedData, conversations] = await Promise.all([
          apiClient.getAssignedInvestors(),
          apiClient.getConversations()
        ])

        const mapped: Investor[] = (assignedData || []).map((inv: any, idx: number) => {
          const conv = conversations.find((c: any) =>
            !c.is_group && c.participants.some((p: any) => p.id === inv.id)
          )

          return {
            id: inv.id,
            name: inv.full_name,
            email: inv.email,
            accountType: inv.account_type || "Personal",
            kyc: (inv.kyc_status?.charAt(0).toUpperCase() + inv.kyc_status?.slice(1)) || "Approved",
            missingDocs: "-",
            date: inv.created_at ? format(new Date(inv.created_at), "MMM d, yyyy") : "N/A",
            avatar: inv.profile_image_url || "",
            hasNewMessage: (conv?.unread_count || 0) > 0,
            status: inv.status || 'active',
            kyc_status: inv.kyc_status || 'pending'
          }
        })
        setInvestors(mapped)
      } catch (err) {
        console.error("Failed to fetch assigned investors:", err)
      } finally {
        setLoading(false)
      }
    }

    if (user) fetchData()
  }, [user])

  const { active, ira, pending, suspended } = useMemo(() => {
    let filtered = investors.filter((inv) => {
      const matchesQuery = `${inv.name} ${inv.email} ${inv.accountType} ${inv.kyc} ${inv.date}`.toLowerCase().includes(query.toLowerCase())
      const matchesKyc = kycFilter === "All" || inv.kyc === kycFilter
      const matchesType = typeFilter === "All" || inv.accountType === typeFilter
      return matchesQuery && matchesKyc && matchesType
    })

    if (sortConfig !== null) {
      filtered.sort((a, b) => {
        const aVal = a[sortConfig.key]
        const bVal = b[sortConfig.key]

        if (sortConfig.key === 'date') {
          const dateA = new Date(a.date).getTime()
          const dateB = new Date(b.date).getTime()
          return sortConfig.direction === 'asc' ? dateA - dateB : dateB - dateA
        }

        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1
        return 0
      })
    }

    return {
      active: filtered.filter(i => i.status !== 'pending' && i.status !== 'suspended' && !i.accountType.toUpperCase().includes('IRA')),
      ira: filtered.filter(i => i.status !== 'pending' && i.status !== 'suspended' && i.accountType.toUpperCase().includes('IRA')),
      pending: filtered.filter(i => i.status === 'pending'),
      suspended: filtered.filter(i => i.status === 'suspended')
    }
  }, [investors, query, kycFilter, typeFilter, sortConfig])

  const paginatedActive = active.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)
  const totalPages = Math.max(1, Math.ceil(active.length / ITEMS_PER_PAGE))

  const kycColor = (s: string) => {
    if (s === "Approved") return "text-[#16A66A]"
    if (s === "Pending") return "text-[#E5A000]"
    return "text-[#EF4444]"
  }

  return (
    <DashboardLayout>
      <div className="p-0 max-w-full overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="font-goudy text-xl md:text-2xl font-bold text-[#1F1F1F]">Assigned Investors</h1>
            <p className="mt-1 text-[13px] text-[#8E8E93] font-helvetica">View and manage assigned investor accounts.</p>
          </div>
          <button
            onClick={() => exportCsv([...active, ...ira, ...pending, ...suspended])}
            className="h-[40px] w-full sm:w-auto rounded-full bg-gradient-to-r from-[#FFC63F] to-[#F1DD58] px-6 text-[13px] font-semibold text-[#1F1F1F] shadow-sm hover:shadow-md transition-shadow font-helvetica"
          >
            Export List
          </button>
        </div>

        <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-[#F0F0F0] max-w-full">
          <div className="flex flex-col lg:flex-row lg:items-center gap-3 mb-6">
            <div className="relative w-full lg:w-[320px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9CA3AF]" />
              <input
                value={query}
                onChange={(e) => { setQuery(e.target.value); setCurrentPage(1); }}
                placeholder="Find something here..."
                className="h-[40px] w-full rounded-full bg-[#F5F5F5] pl-11 pr-4 text-[14px] text-[#1F1F1F] outline-none placeholder:text-[#A2A5AA] font-helvetica border border-transparent focus:border-[#FFC63F] transition-all"
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
              <div className="relative flex-1 sm:flex-none">
                <select
                  value={kycFilter}
                  onChange={(e) => { setKycFilter(e.target.value); setCurrentPage(1); }}
                  className="w-full sm:w-auto inline-flex h-[40px] sm:min-w-[140px] items-center justify-between rounded-[24px] bg-[#F5F5F5] px-6 text-[14px] appearance-none outline-none font-helvetica text-[#8E8E93] hover:bg-[#EFEFEF] transition-colors"
                >
                  <option value="All">KYC Status</option>
                  <option>Approved</option>
                  <option>Pending</option>
                  <option>Rejected</option>
                  <option>Unverified</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#9CA3AF]" />
              </div>
              <div className="relative flex-1 sm:flex-none">
                <select
                  value={typeFilter}
                  onChange={(e) => { setTypeFilter(e.target.value); setCurrentPage(1); }}
                  className="w-full sm:w-auto inline-flex h-[40px] sm:min-w-[140px] items-center justify-between rounded-[24px] bg-[#F5F5F5] px-5 text-[14px] appearance-none outline-none font-helvetica text-[#8E8E93] hover:bg-[#EFEFEF] transition-colors"
                >
                  <option value="All">Account Type</option>
                  <option value="Personal">Personal</option>
                  <option value="SEP IRA">SEP IRA</option>
                  <option value="Roth SEP IRA">Roth SEP IRA</option>
                  <option value="DB Plan IRA">DB Plan IRA</option>
                  <option value="Roth IRA">Roth IRA</option>
                  <option value="Traditional IRA">Traditional IRA</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#9CA3AF]" />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto -mx-4 sm:mx-0 custom-scrollbar">
            <div className="min-w-[800px] sm:min-w-full inline-block align-middle px-4 sm:px-0">
              <table className="w-full text-left border-separate border-spacing-0">
                <thead>
                  <tr className="border-b border-[#ECEDEF]">
                    {[
                      { label: "Investor Name", minWidth: "180px", sortKey: "name" },
                      { label: "Email", minWidth: "180px", sortKey: "email" },
                      { label: "Account Type", minWidth: "120px", sortKey: "accountType" },
                      { label: "KYC Status", minWidth: "100px", sortKey: "kyc" },
                      { label: "Missing Doc", minWidth: "100px", sortKey: "missingDocs" },
                      { label: "Date", minWidth: "110px", sortKey: "date" },
                      { label: "Action", minWidth: "60px", align: "text-right" }
                    ].map((h) => (
                      <th
                        key={h.label}
                        style={{ minWidth: h.minWidth }}
                        onClick={() => h.sortKey && requestSort(h.sortKey as keyof Investor)}
                        className={`px-3 py-3 text-[12px] sm:text-[13px] font-helvetica font-medium tracking-wider text-[#6B7280] whitespace-nowrap border-b border-[#ECEDEF] ${h.align || ""} ${h.sortKey ? "cursor-pointer hover:bg-gray-50" : ""}`}
                      >
                        <span className={`inline-flex items-center gap-1 ${h.align === "text-right" ? "justify-end w-full" : ""}`}>
                          {h.label}
                          {h.sortKey && (
                            <ArrowUpDown className={`h-3 w-3 transition-colors ${sortConfig?.key === h.sortKey ? "text-[#1F3B6E]" : "text-[#C4C4C4]"}`} />
                          )}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr className="bg-white">
                    <td colSpan={7} className="px-3 py-6">
                      <h2 className="text-[16px] font-bold text-[#2E2E2E] font-goudy">Active Investors</h2>
                    </td>
                  </tr>
                  {loading ? (
                    Array.from({ length: 2 }).map((_, i) => (
                      <tr key={`l-act-${i}`} className="animate-pulse">
                        <td colSpan={7} className="px-3 py-4 border-b border-[#F5F5F5]"><div className="h-4 bg-gray-100 rounded w-full"></div></td>
                      </tr>
                    ))
                  ) : active.length > 0 ? (
                    paginatedActive.map((inv) => (
                      <tr
                        key={`${inv.id}-${inv.accountType}`}
                        onClick={(e) => {
                          if (!(e.target as Element).closest('a')) {
                            router.push(`/dashboard/investor/${inv.id}`);
                          }
                        }}
                        className="group hover:bg-[#FAFAFA] transition-colors cursor-pointer"
                      >
                        <td className="px-3 py-4 border-b border-[#F5F5F5]">
                          <div className="flex items-center gap-3">
                            {inv.avatar ? (
                              <img src={inv.avatar} alt={inv.name} className="w-[34px] h-[34px] rounded-full object-cover" />
                            ) : (
                              <div className="w-[34px] h-[34px] rounded-full bg-[#F3F4F6] flex items-center justify-center text-[#6B7280] text-[12px] font-semibold font-helvetica border border-[#E5E7EB]">
                                {inv.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                              </div>
                            )}
                            <span className="text-[13px] font-medium text-[#1F1F1F] font-helvetica truncate">{inv.name}</span>
                          </div>
                        </td>
                        <td className="px-3 py-4 border-b border-[#F5F5F5] text-[13px] text-[#6B7280] font-helvetica truncate">{inv.email}</td>
                        <td className="px-3 py-4 border-b border-[#F5F5F5] text-[13px] text-[#6B7280] font-helvetica whitespace-nowrap">{inv.accountType}</td>
                        <td className="px-3 py-4 border-b border-[#F5F5F5]">
                          <span className={`text-[13px] font-semibold font-helvetica whitespace-nowrap ${kycColor(inv.kyc)}`}>
                            {inv.kyc}
                          </span>
                        </td>
                        <td className="px-3 py-4 border-b border-[#F5F5F5] text-[13px] text-[#6B7280] font-helvetica whitespace-nowrap">{inv.missingDocs}</td>
                        <td className="px-3 py-4 border-b border-[#F5F5F5] text-[13px] text-[#6B7280] font-helvetica whitespace-nowrap">{inv.date}</td>
                        <td className="px-3 py-4 border-b border-[#F5F5F5] text-right">
                          <Link href={`/dashboard/messages?userId=${inv.id}`} className="relative p-1.5 text-[#9CA3AF] hover:text-[#6B7280] transition-colors inline-block" title="Message">
                            <MessageSquare className="h-[18px] w-[18px]" />
                            {inv.hasNewMessage && <span className="absolute -top-0.5 -right-0.5 h-[8px] w-[8px] rounded-full bg-[#16A66A] border border-white" />}
                          </Link>
                        </td>
                      </tr>
                    ))
                  ) : !loading && (
                    <tr><td colSpan={7} className="px-3 py-6 text-center text-gray-400 text-sm border-b border-[#F5F5F5]">No active personal investors found.</td></tr>
                  )}

                  <tr className="bg-white">
                    <td colSpan={7} className="px-3 py-8 pt-10">
                      <h2 className="text-[16px] font-bold text-[#2E2E2E] font-goudy">Active IRA Accounts</h2>
                    </td>
                  </tr>
                  {loading ? (
                    Array.from({ length: 1 }).map((_, i) => (
                      <tr key={`l-ira-${i}`} className="animate-pulse">
                        <td colSpan={7} className="px-3 py-4 border-b border-[#F5F5F5]"><div className="h-4 bg-gray-100 rounded w-full"></div></td>
                      </tr>
                    ))
                  ) : ira.length > 0 ? (
                    ira.map((inv) => (
                      <tr
                        key={`${inv.id}-${inv.accountType}`}
                        onClick={(e) => {
                          if (!(e.target as Element).closest('a')) {
                            router.push(`/dashboard/investor/${inv.id}`);
                          }
                        }}
                        className="group hover:bg-[#FAFAFA] transition-colors cursor-pointer"
                      >
                        <td className="px-3 py-4 border-b border-[#F5F5F5]">
                          <div className="flex items-center gap-3">
                            {inv.avatar ? (
                              <img src={inv.avatar} alt={inv.name} className="w-[34px] h-[34px] rounded-full object-cover" />
                            ) : (
                              <div className="w-[34px] h-[34px] rounded-full bg-[#F3F4F6] flex items-center justify-center text-[#6B7280] text-[12px] font-semibold font-helvetica border border-[#E5E7EB]">
                                {inv.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                              </div>
                            )}
                            <span className="text-[13px] font-medium text-[#1F1F1F] font-helvetica truncate">{inv.name}</span>
                          </div>
                        </td>
                        <td className="px-3 py-4 border-b border-[#F5F5F5] text-[13px] text-[#6B7280] font-helvetica truncate">{inv.email}</td>
                        <td className="px-3 py-4 border-b border-[#F5F5F5] text-[13px] text-[#6B7280] font-helvetica whitespace-nowrap">{inv.accountType}</td>
                        <td className="px-3 py-4 border-b border-[#F5F5F5]">
                          <span className={`text-[13px] font-semibold font-helvetica whitespace-nowrap ${kycColor(inv.kyc)}`}>
                            {inv.kyc}
                          </span>
                        </td>
                        <td className="px-3 py-4 border-b border-[#F5F5F5] text-[13px] text-[#6B7280] font-helvetica whitespace-nowrap">{inv.missingDocs}</td>
                        <td className="px-3 py-4 border-b border-[#F5F5F5] text-[13px] text-[#6B7280] font-helvetica whitespace-nowrap">{inv.date}</td>
                        <td className="px-3 py-4 border-b border-[#F5F5F5] text-right">
                          <Link href={`/dashboard/messages?userId=${inv.id}`} className="relative p-1.5 text-[#9CA3AF] hover:text-[#6B7280] transition-colors inline-block" title="Message">
                            <MessageSquare className="h-[18px] w-[18px]" />
                            {inv.hasNewMessage && <span className="absolute -top-0.5 -right-0.5 h-[8px] w-[8px] rounded-full bg-[#16A66A] border border-white" />}
                          </Link>
                        </td>
                      </tr>
                    ))
                  ) : !loading && (
                    <tr><td colSpan={7} className="px-3 py-6 text-center text-gray-400 text-sm border-b border-[#F5F5F5]">No active IRA investors found.</td></tr>
                  )}

                  <tr className="bg-white">
                    <td colSpan={7} className="px-3 py-8 pt-10">
                      <h2 className="text-[16px] font-bold text-[#2E2E2E] font-goudy">Pending Investors</h2>
                    </td>
                  </tr>
                  {!loading && pending.length > 0 ? (
                    pending.map((inv) => (
                      <tr
                        key={`${inv.id}-${inv.accountType}`}
                        onClick={(e) => {
                          if (!(e.target as Element).closest('a') && !(e.target as Element).closest('button')) {
                            router.push(`/dashboard/investor/${inv.id}`);
                          }
                        }}
                        className="group hover:bg-[#FAFAFA] transition-colors cursor-pointer"
                      >
                        <td className="px-3 py-4 border-b border-[#F5F5F5]">
                          <div className="flex items-center gap-3 opacity-60">
                            {inv.avatar ? (
                              <img src={inv.avatar} alt={inv.name} className="w-[34px] h-[34px] rounded-full object-cover" />
                            ) : (
                              <div className="w-[34px] h-[34px] rounded-full bg-[#F3F4F6] flex items-center justify-center text-[#6B7280] text-[12px] font-semibold font-helvetica border border-[#E5E7EB]">
                                {inv.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                              </div>
                            )}
                            <span className="text-[13px] font-medium text-[#1F1F1F] font-helvetica truncate">{inv.name}</span>
                          </div>
                        </td>
                        <td className="px-3 py-4 border-b border-[#F5F5F5] text-[13px] text-[#6B7280] font-helvetica truncate opacity-60">{inv.email}</td>
                        <td className="px-3 py-4 border-b border-[#F5F5F5] text-[13px] text-[#6B7280] font-helvetica whitespace-nowrap opacity-60">{inv.accountType}</td>
                        <td className="px-3 py-4 border-b border-[#F5F5F5] opacity-60">
                          <span className={`text-[13px] font-semibold font-helvetica whitespace-nowrap ${kycColor(inv.kyc)}`}>
                            {inv.kyc}
                          </span>
                        </td>
                        <td className="px-3 py-4 border-b border-[#F5F5F5] text-[13px] text-[#6B7280] font-helvetica whitespace-nowrap opacity-60">{inv.missingDocs}</td>
                        <td className="px-3 py-4 border-b border-[#F5F5F5] text-[13px] text-[#6B7280] font-helvetica whitespace-nowrap opacity-60">{inv.date}</td>
                        <td className="px-3 py-4 border-b border-[#F5F5F5] text-right">
                          <div className="p-1.5 text-gray-200 cursor-not-allowed inline-block" title="Setup in progress">
                            <MessageSquare className="h-[18px] w-[18px]" />
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : !loading && (
                    <tr><td colSpan={7} className="px-3 py-6 text-center text-gray-400 text-sm border-b border-[#F5F5F5]">No pending investors found.</td></tr>
                  )}

                  <tr className="bg-white">
                    <td colSpan={7} className="px-3 py-8 pt-10">
                      <h2 className="text-[16px] font-bold text-[#2E2E2E] font-goudy">Suspended Accounts</h2>
                    </td>
                  </tr>
                  {!loading && suspended.length > 0 ? (
                    suspended.map((inv) => (
                      <tr
                        key={`${inv.id}-${inv.accountType}`}
                        onClick={(e) => {
                          if (!(e.target as Element).closest('a') && !(e.target as Element).closest('button')) {
                            router.push(`/dashboard/investor/${inv.id}`);
                          }
                        }}
                        className="group hover:bg-[#FAFAFA] transition-colors cursor-pointer"
                      >
                        <td className="px-3 py-4 border-b border-[#F5F5F5]">
                          <div className="flex items-center gap-3 opacity-50">
                            {inv.avatar ? (
                              <img src={inv.avatar} alt={inv.name} className="w-[34px] h-[34px] rounded-full object-cover" />
                            ) : (
                              <div className="w-[34px] h-[34px] rounded-full bg-[#F3F4F6] flex items-center justify-center text-[#6B7280] text-[12px] font-semibold font-helvetica border border-[#E5E7EB]">
                                {inv.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                              </div>
                            )}
                            <span className="text-[13px] font-medium text-[#1F1F1F] font-helvetica truncate">{inv.name}</span>
                          </div>
                        </td>
                        <td className="px-3 py-4 border-b border-[#F5F5F5] text-[13px] text-[#6B7280] font-helvetica truncate opacity-50">{inv.email}</td>
                        <td className="px-3 py-4 border-b border-[#F5F5F5] text-[13px] text-[#6B7280] font-helvetica whitespace-nowrap opacity-50">{inv.accountType}</td>
                        <td className="px-3 py-4 border-b border-[#F5F5F5] opacity-50">
                          <span className={`text-[13px] font-semibold font-helvetica whitespace-nowrap text-red-500`}>
                            Suspended
                          </span>
                        </td>
                        <td className="px-3 py-4 border-b border-[#F5F5F5] text-[13px] text-[#6B7280] font-helvetica whitespace-nowrap opacity-50">-</td>
                        <td className="px-3 py-4 border-b border-[#F5F5F5] text-[13px] text-[#6B7280] font-helvetica whitespace-nowrap opacity-50">{inv.date}</td>
                        <td className="px-3 py-4 border-b border-[#F5F5F5] text-right">
                          <div className="p-1.5 text-gray-200 cursor-not-allowed inline-block" title="Account suspended">
                            <MessageSquare className="h-[18px] w-[18px]" />
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : !loading && (
                    <tr><td colSpan={7} className="px-3 py-6 text-center text-gray-400 text-sm">No suspended accounts found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>


          <div className="mt-8 flex flex-col items-center gap-6 border-t border-[#F5F5F5] pt-6">
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="inline-flex items-center gap-1 px-4 py-2 text-[13px] text-[#6B7280] disabled:opacity-40 font-helvetica hover:text-[#1F1F1F] transition-colors font-medium"
              >
                <ChevronLeft className="h-4 w-4" /> Previous
              </button>

              <div className="flex gap-2">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => setCurrentPage(p)}
                    className={`h-10 w-10 rounded-lg text-[13px] font-medium transition-colors font-helvetica ${currentPage === p
                      ? "bg-[#1F3B6E] text-white"
                      : "text-[#6B7280] hover:bg-gray-100"
                      }`}
                  >
                    {p}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="inline-flex items-center gap-1 px-4 py-2 text-[13px] text-[#6B7280] disabled:opacity-40 font-helvetica hover:text-[#1F1F1F] transition-colors font-medium"
              >
                Next <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            <div className="text-[13px] text-[#8E8E93] font-helvetica">
              Showing <span className="font-medium text-[#1F1F1F]">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> to <span className="font-medium text-[#1F1F1F]">{Math.min(currentPage * ITEMS_PER_PAGE, active.length)}</span> of <span className="font-medium text-[#1F1F1F]">{active.length}</span> active investors
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
