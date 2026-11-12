import React, { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import { apiClient } from '@/lib/api/client';
import { toast } from 'sonner';

interface SendInvestmentInviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  investorId: string;
  onSuccess?: () => void;
}

function formatIraType(type?: string): string {
  if (!type) return 'IRA';
  const t = type.toLowerCase().trim();
  if (t === 'traditional' || t === 'traditional ira') return 'Traditional IRA';
  if (t === 'roth' || t === 'roth ira') return 'Roth IRA';
  if (t === 'sep' || t === 'sep ira') return 'SEP IRA';
  if (t === 'simple' || t === 'simple ira') return 'Simple IRA';
  if (t === 'roth sep') return 'Roth SEP IRA';
  if (t === 'roth simple') return 'Roth Simple IRA';
  if (t.endsWith('ira')) {
    return t.charAt(0).toUpperCase() + t.slice(1);
  }
  return `${t.charAt(0).toUpperCase() + t.slice(1)} IRA`;
}

export function SendInvestmentInviteModal({ isOpen, onClose, investorId, onSuccess }: SendInvestmentInviteModalProps) {
  const [funds, setFunds] = useState<any[]>([]);
  const [iraAccounts, setIraAccounts] = useState<any[]>([]);
  const [subaccounts, setSubaccounts] = useState<any[]>([]);
  const [subIraAccounts, setSubIraAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const [selectedFundId, setSelectedFundId] = useState('');
  const [selectedAccountId, setSelectedAccountId] = useState('personal');
  const [amount, setAmount] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [fundsRes, accountsRes, subaccountsRes] = await Promise.all([
        apiClient.get('/funds'),
        apiClient.get(`/ira-accounts/user/${investorId}`).catch(() => ({ data: [] })),
        apiClient.get(`/users/${investorId}/subaccounts`).catch(() => ({ data: [] }))
      ]);
      const fetchedFunds = fundsRes.data || [];
      const fetchedIras = accountsRes.data?.data || accountsRes.data || [];
      const allSubs = subaccountsRes.data || [];

      // Filter out IRA accounts from direct subaccounts (they are already included as IRA subaccounts)
      const directSubs = allSubs.filter(
        (s: any) => !s.isIraSubaccount && s.investorType !== 'sub ira account'
      );
      const subIras = allSubs.filter(
        (s: any) => s.isIraSubaccount || s.investorType === 'sub ira account'
      );

      setFunds(fetchedFunds);
      setIraAccounts(fetchedIras);
      setSubaccounts(directSubs);
      setSubIraAccounts(subIras);
    } catch (error) {
      console.error('Failed to fetch modal data', error);
      toast.error('Failed to load form data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFundId || !amount) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSubmitting(true);
    try {
      let resolvedAccountType = 'personal';
      let resolvedAccountName = 'Personal Account';

      if (selectedAccountId !== 'personal') {
        const isPrimaryIra = iraAccounts.find(ira => ira.id === selectedAccountId);
        if (isPrimaryIra) {
          const iraLabel = formatIraType(isPrimaryIra.account_type);
          resolvedAccountType = isPrimaryIra.account_type || 'ira';
          resolvedAccountName = iraLabel;
        } else {
          const isSubIra = subIraAccounts.find(ira => ira.id === selectedAccountId);
          if (isSubIra) {
            const rawName = isSubIra.subFullName || isSubIra.fullName || '';
            const subName = rawName.replace(/^AET\s+FBO\s+/i, '').replace(/\s+(Traditional|Roth|SEP|Simple|DB Plan|DBP)?\s*IRA.*$/i, '').trim() || 'Sub-account';
            const iraLabel = formatIraType(isSubIra.accountType || isSubIra.account_type);
            resolvedAccountType = isSubIra.accountType || isSubIra.account_type || 'ira';
            resolvedAccountName = `${subName} - ${iraLabel}`;
          } else {
            const isSub = subaccounts.find(sub => sub.id === selectedAccountId);
            if (isSub) {
              const subName = (isSub.investorType === 'entity' ? (isSub.entityName || isSub.fullName) : isSub.fullName) || 'Sub-account';
              const type = isSub.investorType === 'entity' ? 'Entity' : (isSub.investorType === 'minor' ? 'Minor' : 'Personal');
              resolvedAccountType = isSub.investorType || 'personal';
              resolvedAccountName = `${subName} (${type})`;
            }
          }
        }
      }

      await apiClient.post('/investments/invite', {
        investorId,
        fundId: selectedFundId,
        accountId: selectedAccountId,
        accountType: resolvedAccountType,
        accountName: resolvedAccountName,
        amount
      });
      toast.success('Investment invite sent successfully');
      if (onSuccess) {
        onSuccess();
      }
      onClose();
      // Reset form
      setSelectedFundId('');
      setSelectedAccountId('personal');
      setAmount('');
    } catch (error) {
      console.error('Failed to send invite', error);
      toast.error('Failed to send investment invite');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm font-helvetica">
      <div className="bg-white dark:bg-[#1C1C1C] rounded-[24px] shadow-xl w-full max-w-md overflow-hidden border border-gray-100 dark:border-gray-800 flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50">
          <h2 className="text-xl font-bold text-[#1F1F1F] dark:text-gray-100">Send Investment Invite</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:text-gray-400 hover:bg-white dark:bg-[#1C1C1C] rounded-full transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading ? (
          <div className="p-8 flex justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
          </div>
        ) : (
          <div className="p-6 overflow-y-auto custom-scrollbar">
            <form id="invite-form" onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Fund <span className="text-red-500">*</span></label>
                <select
                  value={selectedFundId}
                  onChange={(e) => setSelectedFundId(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white dark:bg-[#1C1C1C] transition-all text-sm font-medium"
                >
                  <option value="">Select a fund</option>
                  {funds.map((f) => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Account</label>
                <select
                  value={selectedAccountId}
                  onChange={(e) => setSelectedAccountId(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white dark:bg-[#1C1C1C] transition-all text-sm font-medium"
                >
                  <optgroup label="Personal Account">
                    <option value="personal">Personal Account</option>
                  </optgroup>

                  {iraAccounts.length > 0 && (
                    <optgroup label="Primary IRA Accounts">
                      {iraAccounts.map((ira) => (
                        <option key={ira.id} value={ira.id}>
                          {formatIraType(ira.account_type)} ({ira.status || 'Active'})
                        </option>
                      ))}
                    </optgroup>
                  )}

                  {subaccounts.length > 0 && (
                    <optgroup label="Sub-Accounts (Direct)">
                      {subaccounts.map((sub) => {
                        const isEntity = sub.investorType === 'entity';
                        const name = isEntity ? (sub.entityName || sub.fullName) : sub.fullName;
                        const type = isEntity ? 'Entity' : (sub.investorType === 'minor' ? 'Minor' : 'Personal');
                        return (
                          <option key={sub.id} value={sub.id}>{name} - {type} Account</option>
                        );
                      })}
                    </optgroup>
                  )}

                  {subIraAccounts.length > 0 && (
                    <optgroup label="Sub-Account IRA Accounts">
                      {subIraAccounts.map((subIra) => {
                        const rawName = subIra.subFullName || subIra.fullName || '';
                        const subName = rawName.replace(/^AET\s+FBO\s+/i, '').replace(/\s+(Traditional|Roth|SEP|Simple|DB Plan|DBP)?\s*IRA.*$/i, '').trim() || 'Sub-account';
                        const iraTypeLabel = formatIraType(subIra.accountType || subIra.account_type);
                        return (
                          <option key={subIra.id} value={subIra.id}>
                            {subName} - {iraTypeLabel} ({subIra.status || 'Active'})
                          </option>
                        );
                      })}
                    </optgroup>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Amount ($) <span className="text-red-500">*</span></label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                  min="0"
                  step="0.01"
                  placeholder="e.g. 50000"
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white dark:bg-[#1C1C1C] transition-all text-sm font-medium"
                />
              </div>
            </form>
          </div>
        )}

        <div className="p-6 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 text-sm font-semibold text-gray-600 dark:text-gray-400 bg-white dark:bg-[#1C1C1C] hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-800 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="invite-form"
            disabled={submitting || loading}
            className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-[#1F1F1F] dark:text-gray-100 bg-gradient-to-r from-[#FBCB4B] to-[#E2B93B] hover:opacity-90 rounded-xl transition-all shadow-sm hover:shadow disabled:opacity-50"
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {submitting ? 'Sending...' : 'Send Invite'}
          </button>
        </div>
      </div>
    </div>
  );
}
