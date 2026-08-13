'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { DashboardLayout } from '@/components/DashboardLayout';
import { MoreVertical, Loader2, Search, ExternalLink, XCircle, CheckCircle2, Plus, X, Landmark } from 'lucide-react';
import { apiClient, BASE_URL } from '@/lib/api/client';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type Status = 'Settled' | 'Pending' | 'Rejected' | 'Approved' | 'Cancelled' | 'Processed';

function statusClass(status: Status) {
  switch (status) {
    case 'Settled':
    case 'Processed':
    case 'Approved':
      return 'bg-[#E8FBF1] text-[#1F7A4D] border border-[#B7EB8F]';
    case 'Rejected':
    case 'Cancelled':
      return 'bg-[#FEECEC] text-[#D14343] border border-[#FFA39E]';
    default:
      return 'bg-[#FFF7E0] text-[#C27A21] border border-[#FFE58F]';
  }
}

const defaultBankAdd = {
  bank_name: '',
  account_number: '',
  routing_number: '',
  beneficiary_name: '',
  bank_address: '',
  bank_description: '',
};

export default function RedeemPage() {
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  
  // Data States
  const [redemptions, setRedemptions] = useState<any[]>([]);
  const [investments, setInvestments] = useState<any[]>([]);
  const [bankAccounts, setBankAccounts] = useState<any[]>([]);
  const [liveNav, setLiveNav] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Selection
  const [selectedFundId, setSelectedFundId] = useState<string | null>(null);
  
  // Modal States
  const [showRedeemModal, setShowRedeemModal] = useState(false);
  const [redeemStep, setRedeemStep] = useState<'amount' | 'confirm' | 'submitted'>('amount');
  const [redeemAmount, setRedeemAmount] = useState('0.00');
  const [redeemReason, setRedeemReason] = useState('');
  const [selectedBankId, setSelectedBankId] = useState<string | null>(null);
  const [submittingRedeem, setSubmittingRedeem] = useState(false);
  
  // Bank Form inside Modal
  const [showAddBankModal, setShowAddBankModal] = useState(false);
  const [newBank, setNewBank] = useState(defaultBankAdd);
  const [newBankErrors, setNewBankErrors] = useState<Record<string, string>>({});
  const [addingBank, setAddingBank] = useState(false);
  
  // Cancellation dialog
  const [redemptionToCancel, setRedemptionToCancel] = useState<any | null>(null);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [redsData, invsData, banksData, navData] = await Promise.all([
        apiClient.getMyRedemptions(),
        apiClient.getMyInvestments(),
        apiClient.getBankAccounts(),
        apiClient.getNavSummary(),
      ]);
      setRedemptions(redsData);
      setInvestments(invsData);
      setBankAccounts(banksData);
      if (banksData.length > 0) {
        setSelectedBankId(banksData[0].id);
      }
      if (navData && navData.currentNav) {
        setLiveNav(navData.currentNav);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load redemption details');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelRequest = async () => {
    if (!redemptionToCancel) return;
    try {
      setCancelling(true);
      await apiClient.cancelRedemption(redemptionToCancel.id);
      toast.success('Redemption request cancelled successfully');
      setActiveMenuId(null);
      setRedemptionToCancel(null);
      fetchData();
    } catch (error: any) {
      console.error('Error cancelling redemption:', error);
      toast.error(error.message || 'Failed to cancel request');
    } finally {
      setCancelling(false);
    }
  };

  const getFullImageUrl = (imagePath: string | null | undefined) => {
    if (!imagePath) return null;
    if (imagePath.startsWith('http')) return imagePath;
    if (imagePath.startsWith('/images/')) return imagePath;
    return `${BASE_URL}${imagePath}`;
  };

  // Group investments by fund to show active funds
  const activeHoldings = useMemo(() => {
    const map = new Map<string, { fundId: string; fundName: string; totalInvested: number; totalUnits: number; eligibleUnits: number; eligibleInvestmentId: string | null; anyInvestmentId: string | null; fundImage: string | null }>();
    
    const threeYearsAgo = new Date();
    threeYearsAgo.setFullYear(threeYearsAgo.getFullYear() - 3);

    (investments || []).forEach((inv: any) => {
      if (inv.is_reconciled) {
        const key = inv.fund_id || inv.fundId;
        const name = inv.fund_name || inv.fundName || 'Active Fund';
        const amt = parseFloat(inv.revised_amount || inv.investment_amount || 0);
        const units = parseFloat(inv.estimated_units || 0);
        const image = inv.fund_image || inv.fundImage || null;
        
        if (key) {
          if (!map.has(key)) {
            map.set(key, {
              fundId: key,
              fundName: name,
              totalInvested: 0,
              totalUnits: 0,
              eligibleUnits: 0,
              eligibleInvestmentId: null,
              anyInvestmentId: null,
              fundImage: image
            });
          }
          const existing = map.get(key)!;
          existing.totalInvested += amt;
          existing.totalUnits += units;
          if (!existing.anyInvestmentId) {
            existing.anyInvestmentId = inv.id;
          }
          if (isEligibleInv(inv, threeYearsAgo)) {
            existing.eligibleUnits += units;
            if (!existing.eligibleInvestmentId) {
              existing.eligibleInvestmentId = inv.id;
            }
          }
        }
      }
    });
    
    return Array.from(map.values()).filter(h => h.totalUnits > 0);
  }, [investments]);

  function isEligibleInv(inv: any, threeYearsAgo: Date) {
    const isUnitsIssued = inv.status === 'Units Issued';
    const unitsIssuedAt = inv.units_issued_at ? new Date(inv.units_issued_at) : null;
    return isUnitsIssued && unitsIssuedAt && unitsIssuedAt <= threeYearsAgo;
  }

  const selectedHolding = useMemo(() => {
    return activeHoldings.find(h => h.fundId === selectedFundId) || null;
  }, [activeHoldings, selectedFundId]);

  // Filter redemptions based on selection
  const filteredRedemptions = useMemo(() => {
    if (!selectedFundId) return redemptions;
    return redemptions.filter(r => {
      const matchingInv = investments.find(inv => inv.id === r.investment_id);
      const fundId = matchingInv ? (matchingInv.fund_id || matchingInv.fundId) : null;
      return fundId === selectedFundId;
    });
  }, [redemptions, selectedFundId, investments]);

  const totalPages = Math.ceil(filteredRedemptions.length / itemsPerPage) || 1;
  const currentRows = filteredRedemptions.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const numericAmount = useMemo(() => {
    const value = parseFloat(redeemAmount.replace(/,/g, ''));
    return isFinite(value) ? value : 0;
  }, [redeemAmount]);

  const currentNav = useMemo(() => {
    if (liveNav !== null) return liveNav;
    return 100.00; // fallback default
  }, [liveNav]);

  const unitsToRedeem = useMemo(() => {
    if (currentNav === 0) return 0;
    return numericAmount / currentNav;
  }, [numericAmount, currentNav]);

  const isOverLimit = useMemo(() => {
    if (!selectedHolding) return false;
    return unitsToRedeem > selectedHolding.eligibleUnits;
  }, [unitsToRedeem, selectedHolding]);

  const formatCurrency = (val: number | string) => {
    const num = typeof val === 'string' ? parseFloat(val) : val;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(num);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const estimatedPayoutDate = useMemo(() => {
    const today = new Date();
    const start = new Date(today);
    start.setDate(today.getDate() + 3);
    const end = new Date(today);
    end.setDate(today.getDate() + 5);

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    if (start.getMonth() === end.getMonth()) {
      return `${monthNames[start.getMonth()]} ${start.getDate()}–${end.getDate()}, ${start.getFullYear()}`;
    } else {
      return `${monthNames[start.getMonth()]} ${start.getDate()} – ${monthNames[end.getMonth()]} ${end.getDate()}, ${start.getFullYear()}`;
    }
  }, []);

  const handleOpenRedeemModal = () => {
    if (!selectedHolding) return;
    setRedeemAmount('0.00');
    setRedeemReason('');
    setRedeemStep('amount');
    setShowRedeemModal(true);
  };

  const handleSubmitRedemption = async () => {
    if (!selectedHolding || !selectedHolding.eligibleInvestmentId) return;
    if (numericAmount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    if (isOverLimit) {
      toast.error('Insufficient eligible units for redemption');
      return;
    }
    if (!selectedBankId) {
      toast.error('Please select a destination bank account');
      return;
    }

    try {
      setSubmittingRedeem(true);
      await apiClient.createRedemption({
        investment_id: selectedHolding.eligibleInvestmentId,
        amount: numericAmount,
        reason: redeemReason,
        bank_info: bankAccounts.find(b => b.id === selectedBankId),
      });
      setRedeemStep('submitted');
      fetchData();
    } catch (error: any) {
      console.error('Error submitting redemption:', error);
      toast.error(error.message || 'Failed to submit redemption request');
    } finally {
      setSubmittingRedeem(false);
    }
  };

  const handleAddBank = async () => {
    const errors: Record<string, string> = {};
    if (!newBank.beneficiary_name.trim()) errors.beneficiary_name = 'Required';
    if (!newBank.bank_name.trim()) errors.bank_name = 'Required';
    if (!newBank.account_number) {
      errors.account_number = 'Required';
    } else if (!/^\d{8,17}$/.test(newBank.account_number)) {
      errors.account_number = '8-17 digits';
    }
    if (!newBank.routing_number) {
      errors.routing_number = 'Required';
    } else if (!/^\d{9}$/.test(newBank.routing_number)) {
      errors.routing_number = 'ABA routing must be 9 digits';
    }
    if (!newBank.bank_address.trim()) errors.bank_address = 'Required';

    if (Object.keys(errors).length > 0) {
      setNewBankErrors(errors);
      return;
    }

    try {
      setAddingBank(true);
      const created = await apiClient.createBankAccount(newBank);
      const updatedBanks = await apiClient.getBankAccounts();
      setBankAccounts(updatedBanks);
      setSelectedBankId(created.id);
      setShowAddBankModal(false);
      setNewBank(defaultBankAdd);
      setNewBankErrors({});
      toast.success('Bank account added successfully');
    } catch (err: any) {
      console.error('Error adding bank account:', err);
      toast.error('Failed to add bank account');
    } finally {
      setAddingBank(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-8xl px-4 py-8 font-helvetica text-[#1F1F1F]">
        {/* Header */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <h1 className="font-goudy text-xl sm:text-3xl font-bold leading-[36px] tracking-tight">Redeem</h1>
            <p className="mt-1 text-sm text-[#8E8E93]">
              Select a fund below to make a redemption request or view past requests.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              if (selectedFundId) {
                router.push(`/dashboard/redeem/new?fundId=${selectedFundId}`);
              }
            }}
            disabled={!selectedFundId}
            className={`w-full sm:w-auto text-center rounded-full px-8 py-2.5 text-sm font-bold border transition-all shadow-none ${
              selectedFundId
                ? 'bg-[#FBCB4B] text-[#1F1F1F] border-[#FBCB4B] hover:bg-[#F9B800] hover:border-[#F9B800] cursor-pointer shadow-md transform hover:-translate-y-0.5'
                : 'bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed pointer-events-none'
            }`}
          >
            Redemption Request
          </button>
        </div>

        {/* Active Funds Holdings List */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Select invested fund</h2>
            {selectedFundId && (
              <button
                type="button"
                onClick={() => setSelectedFundId(null)}
                className="text-xs font-bold text-red-500 hover:text-red-700 transition-colors flex items-center gap-1"
              >
                Clear Filter <X className="h-3 w-3" />
              </button>
            )}
          </div>
          {loading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2].map(n => (
                <div key={n} className="animate-pulse bg-white border border-gray-100 rounded-2xl p-6 sm:p-7 h-[130px]"></div>
              ))}
            </div>
          ) : activeHoldings.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {activeHoldings.map((holding) => {
                const isSelected = selectedFundId === holding.fundId;
                return (
                  <div
                    key={holding.fundId}
                    onClick={() => setSelectedFundId(prev => prev === holding.fundId ? null : holding.fundId)}
                    className={`cursor-pointer rounded-2xl bg-white p-6 sm:p-7 border transition-all duration-200 hover:shadow-md flex flex-col justify-between ${
                      isSelected
                        ? 'border-[#FBCB4B] shadow-sm bg-[#FFFDF6]'
                        : 'border-gray-100 shadow-xs'
                    }`}
                  >
                    <div>
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex items-center gap-3.5">
                          {holding.fundImage ? (
                            <img
                              src={getFullImageUrl(holding.fundImage) || ''}
                              alt={holding.fundName}
                              className="w-12 h-12 rounded-full object-cover border border-gray-100 shadow-xs shrink-0"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#1F3B6E] to-[#6B7FBA] flex items-center justify-center text-white font-bold text-sm shadow-xs shrink-0">
                              {holding.fundName ? holding.fundName.split(' ').map((w: string) => w[0]).join('').substring(0, 2).toUpperCase() : 'F'}
                            </div>
                          )}
                          <div>
                            <h3 className="font-bold text-base text-gray-900 leading-tight">{holding.fundName}</h3>
                            <p className="text-xs text-[#8E8E93] mt-1">
                              {holding.totalUnits.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })} Units
                            </p>
                          </div>
                        </div>
                        {holding.eligibleUnits > 0 ? (
                          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full shrink-0 mt-0.5">
                            Eligible
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-full shrink-0 mt-0.5">
                            Pending Period
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="border-t border-gray-100/60 pt-4 mt-4 flex justify-between items-center text-sm">
                      <span className="text-gray-400">Total Invested:</span>
                      <span className="font-bold text-gray-800">{formatCurrency(holding.totalInvested)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-gray-50/50 rounded-2xl border border-dashed border-gray-200 py-12 text-center text-gray-500">
              <Landmark className="h-10 w-10 mx-auto opacity-20 mb-2.5" />
              <p className="text-sm font-medium">No active investments found to redeem.</p>
            </div>
          )}
        </div>

        {/* Requests Table */}
        <div className="mb-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest">
              {selectedFundId ? `Redemption requests for ${selectedHolding?.fundName}` : 'All redemption requests'}
            </h2>
          </div>
        </div>
        
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm border border-gray-100">
          <div className="overflow-x-auto bg-white p-6 pb-20">
            <table className="min-w-full text-xs text-[#4B4B4B]">
              <thead className="bg-[#F8FAFC] text-[13px] capitalize tracking-normal text-[#8E8E93]">
                <tr className="border-b border-gray-100">
                  <th className="px-6 py-4 text-left font-bold whitespace-nowrap min-w-[120px]">Request ID</th>
                  <th className="px-6 py-4 text-left font-bold whitespace-nowrap min-w-[150px]">Fund</th>
                  <th className="px-6 py-4 text-left font-bold whitespace-nowrap min-w-[100px]">Amount</th>
                  <th className="px-6 py-4 text-left font-bold whitespace-nowrap min-w-[120px]">Units Redeemed</th>
                  <th className="px-6 py-4 text-left font-bold whitespace-nowrap min-w-[150px]">Destination Bank</th>
                  <th className="px-6 py-4 text-left font-bold whitespace-nowrap min-w-[100px]">Status</th>
                  <th className="px-6 py-4 text-left font-bold whitespace-nowrap min-w-[120px]">Requested Date</th>
                  <th className="px-6 py-4 text-right font-bold tracking-normal whitespace-nowrap min-w-[100px]">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F9F9F9] bg-white text-[13px]">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-20 text-center">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <Loader2 className="h-8 w-8 animate-spin text-[#274583] opacity-40" />
                        <span className="text-gray-400 font-medium">Fetching requests...</span>
                      </div>
                    </td>
                  </tr>
                ) : currentRows.length > 0 ? (
                  currentRows.map((row, index) => (
                    <tr
                      key={row.id}
                      onClick={() => router.push(`/dashboard/redemption/${row.id}`)}
                      className="hover:bg-[#F9FAFB]/50 cursor-pointer transition-colors group"
                    >
                      <td className="px-6 py-4 align-middle font-bold text-[#1F1F1F] whitespace-nowrap">
                        RED-{row.id.substring(0, 6).toUpperCase()}
                      </td>
                      <td className="px-6 py-4 align-middle font-medium text-gray-700 whitespace-nowrap">
                        {row.fund_name}
                      </td>
                      <td className="px-6 py-4 align-middle font-bold text-[#1F3B6E] whitespace-nowrap">
                        {formatCurrency(row.amount)}
                      </td>
                      <td className="px-6 py-4 align-middle font-medium text-gray-700 whitespace-nowrap">
                        {parseFloat(row.units).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                      </td>
                      <td className="px-6 py-4 align-middle text-gray-500 italic whitespace-nowrap">
                        {row.bank_info?.label || 'Bank transfer'}
                      </td>
                      <td className="px-6 py-4 align-middle">
                        <span className={`inline-flex rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider shadow-sm ${statusClass(row.status)}`}>
                          {row.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 align-middle text-gray-500 font-medium whitespace-nowrap">
                        {formatDate(row.created_at)}
                      </td>
                      <td className="px-6 py-4 align-middle">
                        <div className="relative flex justify-end">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveMenuId((prev) => (prev === row.id ? null : row.id));
                            }}
                            className="rounded-full p-2 text-gray-400 hover:bg-[#F3F4F6] hover:text-[#1F1F1F] transition-all"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </button>

                          {activeMenuId === row.id && (
                            <>
                              <div
                                className="fixed inset-0 z-10"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveMenuId(null);
                                }}
                              />
                              <div
                                onClick={(e) => e.stopPropagation()}
                                className={`absolute right-0 z-20 w-48 rounded-xl border border-gray-100 bg-white py-2 text-[12px] text-[#4B4B4B] shadow-xl animate-in fade-in duration-200 ${
                                  index === currentRows.length - 1 ? 'bottom-full mb-2 slide-in-from-bottom-1' : 'top-full mt-2 slide-in-from-top-1'
                                }`}
                              >
                                <div className="px-4 py-1 text-[10px] font-bold text-gray-300 uppercase tracking-widest border-b border-gray-50 mb-1">
                                  Management
                                </div>
                                <Link
                                  href={`/dashboard/redemption/${row.id}`}
                                  className="flex items-center gap-2 w-full px-4 py-2.5 text-left hover:bg-[#F9FAFB] hover:text-[#1F3B6E] transition-colors font-medium"
                                >
                                  <ExternalLink className="h-3.5 w-3.5" />
                                  View Details
                                </Link>

                                {row.status === 'Pending' && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setRedemptionToCancel(row);
                                      setActiveMenuId(null);
                                    }}
                                    className="flex items-center gap-2 w-full px-4 py-2.5 text-left hover:bg-red-50 text-red-500 transition-colors font-medium border-t border-gray-50 mt-1"
                                  >
                                    <XCircle className="h-3.5 w-3.5" />
                                    Cancel Request
                                  </button>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="px-6 py-20 text-center text-[#8E8E93]">
                      <div className="flex flex-col items-center gap-2">
                        <Search className="h-8 w-8 opacity-20" />
                        <span className="text-sm font-medium">No redemption requests found.</span>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-[#F1F1F1] px-8 py-6 text-[12px] bg-[#F8FAFC]/50">
            <button
              type="button"
              className="flex items-center gap-1 font-bold text-gray-400 hover:text-black transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            >
              <span className="hidden sm:inline">&lt; Previous</span>
              <span className="sm:hidden">&lt;</span>
            </button>
            <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  type="button"
                  onClick={() => setCurrentPage(page)}
                  className={`h-8 w-8 flex-shrink-0 rounded-lg text-xs font-bold transition-all shadow-sm ${currentPage === page
                    ? 'bg-[#1F3B6E] text-white shadow-[#1F3B6E]/20'
                    : 'bg-white text-gray-500 hover:bg-gray-50 border border-gray-100'
                    }`}
                >
                  {page}
                </button>
              ))}
            </div>
            <button
              type="button"
              className="flex items-center gap-1 font-bold text-gray-400 hover:text-black transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            >
              <span className="hidden sm:inline">Next &gt;</span>
              <span className="sm:hidden">&gt;</span>
            </button>
          </div>
        </div>

        {/* Cancellation AlertDialog */}
        <AlertDialog open={!!redemptionToCancel} onOpenChange={(isOpen) => !isOpen && setRedemptionToCancel(null)}>
          <AlertDialogContent className="bg-white rounded-[20px] border-none shadow-2xl p-8 max-w-[520px]">
            <div className="absolute right-6 top-6 text-[#9FA3A9] cursor-pointer hover:text-gray-600 transition-colors" onClick={() => setRedemptionToCancel(null)}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </div>

            <AlertDialogHeader>
              <AlertDialogTitle className="font-goudy text-[28px] text-[#1F1F1F] font-normal">Cancel Redemption</AlertDialogTitle>
              <div className="mt-4 space-y-3">
                <p className="text-[#4B4B4B] text-[16px] leading-relaxed font-goudy">
                  Are you sure you want to cancel the redemption request <span className="font-bold text-[#1F1F1F]">"RED-{redemptionToCancel?.id.substring(0, 6).toUpperCase()}"</span> for <span className="font-bold text-[#1F1F1F]">{redemptionToCancel?.fund_name}</span>?
                </p>
                <p className="text-[#4B4B4B] text-[16px] leading-relaxed font-goudy">
                  This action will stop the redemption process and cannot be undone.
                </p>
              </div>
            </AlertDialogHeader>

            <AlertDialogFooter className="mt-10 flex items-center justify-center sm:justify-end gap-3 sm:space-x-0">
              <AlertDialogCancel
                className="h-[46px] min-w-[130px] rounded-full bg-[#FFF5E9] border-none text-[#4B4B4B] text-[15px] font-semibold hover:bg-[#FFEBD4] transition-all"
              >
                Go Back
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleCancelRequest}
                disabled={cancelling}
                className="h-[46px] min-w-[150px] rounded-full bg-[#FFD64B] hover:bg-[#FFCC21] text-[#4B4B4B] text-[15px] font-bold border-none shadow-sm transition-all"
              >
                {cancelling ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Cancelling...
                  </>
                ) : "Yes, Cancel Request"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
}
