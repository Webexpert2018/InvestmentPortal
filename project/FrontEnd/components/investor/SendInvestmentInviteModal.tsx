import React, { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import { apiClient } from '@/lib/api/client';
import { toast } from 'sonner';

interface SendInvestmentInviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  investorId: string;
}

export function SendInvestmentInviteModal({ isOpen, onClose, investorId }: SendInvestmentInviteModalProps) {
  const [funds, setFunds] = useState<any[]>([]);
  const [iraAccounts, setIraAccounts] = useState<any[]>([]);
  const [subaccounts, setSubaccounts] = useState<any[]>([]);
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
        apiClient.get(`/ira-accounts/user/${investorId}`),
        apiClient.get(`/users/${investorId}/subaccounts`)
      ]);
      setFunds(fundsRes.data || []);
      setIraAccounts(accountsRes.data?.data || accountsRes.data || []);
      setSubaccounts(subaccountsRes.data || []);
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
      if (selectedAccountId !== 'personal') {
        const isIra = iraAccounts.find(ira => ira.id === selectedAccountId);
        if (isIra) {
          resolvedAccountType = 'ira';
        } else {
          const isSub = subaccounts.find(sub => sub.id === selectedAccountId);
          if (isSub) {
            resolvedAccountType = isSub.investorType || 'personal';
          }
        }
      }

      await apiClient.post('/investments/invite', {
        investorId,
        fundId: selectedFundId,
        accountId: selectedAccountId,
        accountType: resolvedAccountType,
        amount
      });
      toast.success('Investment invite sent successfully');
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
      <div className="bg-white rounded-[24px] shadow-xl w-full max-w-md overflow-hidden border border-gray-100 flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gray-50/50">
          <h2 className="text-xl font-bold text-[#1F1F1F]">Send Investment Invite</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-white rounded-full transition-all"
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
                <label className="block text-sm font-semibold text-gray-700 mb-1">Fund <span className="text-red-500">*</span></label>
                <select
                  value={selectedFundId}
                  onChange={(e) => setSelectedFundId(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all text-sm font-medium"
                >
                  <option value="">Select a fund</option>
                  {funds.map((f) => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Account</label>
                <select
                  value={selectedAccountId}
                  onChange={(e) => setSelectedAccountId(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all text-sm font-medium"
                >
                  <option value="personal">Personal Account</option>
                  {iraAccounts.map((ira) => (
                    <option key={ira.id} value={ira.id}>{ira.account_type || 'IRA Account'} ({ira.status || 'Active'})</option>
                  ))}
                  {subaccounts.map((sub) => {
                    const isEntity = sub.investorType === 'entity';
                    const name = isEntity ? (sub.entityName || sub.fullName) : sub.fullName;
                    const type = isEntity ? 'Entity' : 'Minor';
                    return (
                      <option key={sub.id} value={sub.id}>{name} - {type} Account</option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Amount ($) <span className="text-red-500">*</span></label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                  min="0"
                  step="0.01"
                  placeholder="e.g. 50000"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all text-sm font-medium"
                />
              </div>
            </form>
          </div>
        )}

        <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 text-sm font-semibold text-gray-600 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="invite-form"
            disabled={submitting || loading}
            className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-[#1F1F1F] bg-gradient-to-r from-[#FBCB4B] to-[#E2B93B] hover:opacity-90 rounded-xl transition-all shadow-sm hover:shadow disabled:opacity-50"
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {submitting ? 'Sending...' : 'Send Invite'}
          </button>
        </div>
      </div>
    </div>
  );
}
