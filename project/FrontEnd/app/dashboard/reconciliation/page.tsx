'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, ChevronDown, MoreVertical, Check, Loader2, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/DashboardLayout';
import { apiClient } from '@/lib/api/client';
import { useToast } from '@/hooks/use-toast';

interface ReconciliationRecord {
  id: string;
  recordId: string;
  type: 'Funding' | 'Redemption';
  custodian: number;
  internal: number;
  difference: number;
  status: 'Matched' | 'Mismatch';
  isReconciled: boolean | null;
  date: string;
}

export default function ReconciliationPage() {
  const [records, setRecords] = useState<ReconciliationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [eventTypeFilter, setEventTypeFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);

  const { toast } = useToast();

  const fetchRecords = useCallback(async () => {
    try {
      setLoading(true);
      const [investments, redemptions] = await Promise.all([
        apiClient.getAllInvestments(),
        apiClient.getAllRedemptions(),
      ]);

      const investmentRecords: ReconciliationRecord[] = (Array.isArray(investments) ? investments : []).map((inv: any) => {
        const custodian = parseFloat(inv?.investment_amount || 0);
        const internal = parseFloat(inv?.internal_amount || 0);
        const difference = custodian - internal;
        return {
          id: String(inv?.id || ''),
          recordId: `FUN-${String(inv?.id || '').substring(0, 6).toUpperCase()}`,
          type: 'Funding',
          custodian,
          internal,
          difference,
          status: Math.abs(difference) < 0.01 ? 'Matched' : 'Mismatch',
          isReconciled: inv?.is_reconciled === undefined || inv?.is_reconciled === null ? null : !!inv?.is_reconciled,
          date: String(inv?.created_at || new Date().toISOString()),
        };
      });

      const redemptionRecords: ReconciliationRecord[] = (Array.isArray(redemptions) ? redemptions : []).map((red: any) => {
        const custodian = parseFloat(red?.amount || 0);
        const internal = parseFloat(red?.internal_amount || 0);
        const difference = custodian - internal;
        return {
          id: String(red?.id || ''),
          recordId: `RED-${String(red?.id || '').substring(0, 6).toUpperCase()}`,
          type: 'Redemption',
          custodian,
          internal,
          difference,
          status: Math.abs(difference) < 0.01 ? 'Matched' : 'Mismatch',
          isReconciled: red?.is_reconciled === undefined || red?.is_reconciled === null ? null : !!red?.is_reconciled,
          date: String(red?.created_at || new Date().toISOString()),
        };
      });

      const merged = [...investmentRecords, ...redemptionRecords].sort((a, b) =>
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      setRecords(merged);
    } catch (error) {
      console.error('Error fetching reconciliation records:', error);
      toast({
        title: 'Error',
        description: 'Failed to load reconciliation data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const handleUpdateInternal = async (id: string, type: 'Funding' | 'Redemption', amount: number) => {
    setSavingId(id);
    setSavedId(null);
    try {
      if (type === 'Funding') {
        await apiClient.updateInvestmentInternalAmount(id, amount);
      } else {
        await apiClient.updateRedemptionInternalAmount(id, amount);
      }

      setRecords(prev => prev.map(rec => {
        if (rec.id === id) {
          const newInternal = amount;
          const newDiff = rec.custodian - newInternal;
          return {
            ...rec,
            internal: newInternal,
            difference: newDiff,
            status: newDiff === 0 ? 'Matched' : 'Mismatch'
          };
        }
        return rec;
      }));
      setSavedId(id);
      setTimeout(() => setSavedId(null), 2000);
    } catch (error) {
      console.error('Error updating internal amount:', error);
      toast({
        title: 'Error',
        description: 'Failed to update amount',
        variant: 'destructive',
      });
    } finally {
      setSavingId(null);
    }
  };

  const handleToggleReconcile = async (id: string, type: 'Funding' | 'Redemption', currentStatus: boolean) => {
    try {
      const newStatus = !currentStatus;
      if (type === 'Funding') {
        await apiClient.reconcileInvestment(id, newStatus);
      } else {
        await apiClient.reconcileRedemption(id, newStatus);
      }

      setRecords(prev => prev.map(rec => rec.id === id ? { ...rec, isReconciled: newStatus } : rec));
      setActiveDropdown(null);

      toast({
        title: 'Success',
        description: newStatus ? 'Marked as complete' : 'Marked as incomplete',
        variant: 'success',
      });
    } catch (error) {
      console.error('Error toggling reconcile status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update status',
        variant: 'destructive',
      });
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Matched':
        return 'text-green-600 bg-green-50';
      case 'Mismatch':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const filteredRecords = records.filter(record => {
    const matchesSearch = record.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.recordId.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || record.status.toLowerCase() === statusFilter.toLowerCase();
    const matchesType = eventTypeFilter === 'all' || record.type.toLowerCase() === eventTypeFilter.toLowerCase();
    return matchesSearch && matchesStatus && matchesType;
  });

  const totalEvents = filteredRecords.length;
  const matchedCount = filteredRecords.filter(r => r.status === 'Matched').length;
  const mismatchCount = filteredRecords.filter(r => r.status === 'Mismatch').length;
  const pendingReview = records.filter(r => !r.isReconciled).length;

  const stats = [
    { label: 'Total Events', value: totalEvents.toLocaleString() },
    { label: 'Matched', value: matchedCount.toLocaleString() },
    { label: 'Mismatched', value: mismatchCount.toLocaleString() },
    { label: 'Pending Review', value: pendingReview.toLocaleString() },
  ];

  const itemsPerPage = 8;
  const totalPages = Math.ceil(filteredRecords.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentRecords = filteredRecords.slice(startIndex, endIndex);

  return (
    <DashboardLayout>
      <div className="p-0">
        <div className="mb-8">
          <h1 className="text-xl sm:text-3xl font-bold text-[#1F1F1F] mb-2">Reconciliation</h1>
          <p className="text-gray-600">Compare custodian events with internal ledger records and resolve mismatches.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          {stats.map((stat, index) => (
            <div key={index} className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
              <p className="text-gray-600 text-sm mb-2">{stat.label}</p>
              <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 mb-6 border border-gray-100">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search by ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1F3B6E] focus:border-transparent"
              />
            </div>

            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="appearance-none px-4 py-2 pr-10 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1F3B6E] focus:border-transparent bg-white cursor-pointer"
              >
                <option value="all">All Status</option>
                <option value="matched">Matched</option>
                <option value="mismatch">Mismatch</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5 pointer-events-none" />
            </div>

            <div className="relative">
              <select
                value={eventTypeFilter}
                onChange={(e) => setEventTypeFilter(e.target.value)}
                className="appearance-none px-4 py-2 pr-10 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1F3B6E] focus:border-transparent bg-white cursor-pointer"
              >
                <option value="all">All Types</option>
                <option value="funding">Funding</option>
                <option value="redemption">Redemption</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5 pointer-events-none" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">ID</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Type</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">Custodian</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Internal</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">Difference</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Status</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Completed</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                      <div className="flex flex-col items-center gap-2">
                        <Loader2 className="h-8 w-8 animate-spin text-[#1F3B6E]" />
                        <p>Loading records...</p>
                      </div>
                    </td>
                  </tr>
                ) : currentRecords.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                      No matching records found.
                    </td>
                  </tr>
                ) : (
                  currentRecords.map((record) => (
                    <tr key={record.id} className="hover:bg-gray-50 transition-colors group">
                      <td className="px-6 py-4">
                        <Link 
                          href={`/dashboard/${record.type === 'Funding' ? 'funding' : 'redemption'}-requests/${record.id}`}
                          className="font-medium text-[#1F3B6E] hover:underline"
                        >
                          {record.recordId}
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-gray-900">{record.type}</td>
                      <td className="px-6 py-4 text-gray-900 font-medium text-right">{formatCurrency(record.custodian)}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            defaultValue={record.internal}
                            onBlur={(e) => {
                              const newVal = parseFloat(e.target.value);
                              if (newVal !== record.internal && !isNaN(newVal)) {
                                handleUpdateInternal(record.id, record.type, newVal);
                              }
                            }}
                            className="w-32 px-3 py-1 border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-[#1F3B6E] font-medium text-right"
                          />
                          {savingId === record.id ? (
                            <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                          ) : savedId === record.id ? (
                            <Check className="h-4 w-4 text-green-500" />
                          ) : null}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-900 font-medium text-right">{formatCurrency(record.difference)}</td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(record.status)}`}>
                          {record.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex justify-center">
                          {record.isReconciled === true ? (
                            <CheckCircle2 className="h-6 w-6 text-green-500" />
                          ) : record.isReconciled === false ? (
                            <div className="h-6 w-6 rounded-full bg-red-500 flex items-center justify-center">
                              <span className="text-white text-[10px] font-bold">!</span>
                            </div>
                          ) : (
                            <div className="h-4 w-4 rounded-full bg-gray-200" />
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {record.status === 'Matched' ? (
                          <button
                            onClick={() => handleToggleReconcile(record.id, record.type, false)}
                            className="px-4 py-1.5 text-[11px] font-bold rounded-full bg-green-50 text-green-600 hover:bg-green-100 transition-colors border border-green-100 uppercase tracking-wider"
                          >
                            Complete
                          </button>
                        ) : (
                          <button
                            onClick={() => handleToggleReconcile(record.id, record.type, true)}
                            className="px-4 py-1.5 text-[11px] font-bold rounded-full bg-red-50 text-red-600 hover:bg-red-100 transition-colors border border-red-100 uppercase tracking-wider"
                          >
                            Incomplete
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {!loading && filteredRecords.length > 0 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 text-gray-600 hover:text-gray-900 disabled:opacity-40 disabled:cursor-not-allowed font-medium"
              >
                Previous
              </button>

              <div className="flex gap-2">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                  .map((page, i, arr) => (
                    <div key={page} className="flex items-center">
                      {i > 0 && arr[i - 1] !== page - 1 && <span className="px-2 text-gray-400">...</span>}
                      <button
                        onClick={() => setCurrentPage(page)}
                        className={`w-10 h-10 rounded-lg font-medium transition-colors ${currentPage === page ? 'bg-[#1F3B6E] text-white' : 'text-gray-600 hover:bg-gray-100'
                          }`}
                      >
                        {page}
                      </button>
                    </div>
                  ))}
              </div>

              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 text-gray-600 hover:text-gray-900 disabled:opacity-40 disabled:cursor-not-allowed font-medium"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
