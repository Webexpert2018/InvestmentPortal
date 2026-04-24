'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Search, Mail, MessageSquare, Loader2, CheckCircle2, ChevronLeft, ChevronRight } from 'lucide-react';
import { apiClient } from '@/lib/api/client';
import { toast } from 'sonner';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { SendEmailModal } from '@/components/crm/SendEmailModal';
import { SendMessageModal } from '@/components/crm/SendMessageModal';

interface Investor {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  dateJoined: string;
  status: string;
}

export default function CRMBulkOpsPage() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const router = useRouter();

  const [investors, setInvestors] = useState<Investor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);

  useEffect(() => {
    if (!authLoading && user && !isAdmin) {
      toast.error('Access denied. You do not have permission to view CRM.');
      router.push('/dashboard');
    }
  }, [user, isAdmin, authLoading, router]);

  useEffect(() => {
    if (isAdmin) {
      fetchInvestors();
    }
  }, [isAdmin]);

  const fetchInvestors = async () => {
    try {
      setLoading(true);
      const data = await apiClient.getCrmInvestors();
      setInvestors(data);
    } catch (error) {
      console.error('Error fetching investors:', error);
      toast.error('Failed to load investors');
    } finally {
      setLoading(false);
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredInvestors.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredInvestors.map(i => i.id));
    }
  };

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(prev => prev.filter(i => i !== id));
    } else {
      setSelectedIds(prev => [...prev, id]);
    }
  };

  const handleSendBulkEmail = async (subject: string, message: string) => {
    try {
      const response = await apiClient.sendBulkEmail({
        investorIds: selectedIds,
        subject,
        message
      });

      if (response.success) {
        if (response.sentCount > 0) {
          toast.success(`Email sent to ${response.sentCount} investors successfully!`);
        }
        if (response.failedCount > 0) {
          toast.error(`Failed to send to ${response.failedCount} investors.`);
        }
        setSelectedIds([]);
      } else {
        toast.error(response.message || 'Failed to send emails');
      }
    } catch (error: any) {
      toast.error(error.message || 'An error occurred while sending emails');
      throw error;
    }
  };

  const handleSendBulkMessage = async (message: string) => {
    try {
      const response = await apiClient.sendBulkMessage({
        investorIds: selectedIds,
        content: message
      });

      if (response.success) {
        if (response.sentCount > 0) {
          toast.success(`Message sent to ${response.sentCount} investors successfully!`);
        }
        if (response.failedCount > 0) {
          toast.error(`Failed to send to ${response.failedCount} investors.`);
        }
        setSelectedIds([]);
      }
    } catch (error: any) {
      toast.error(error.message || 'An error occurred while sending messages');
      throw error;
    }
  };

  const filteredInvestors = investors.filter(investor => 
    investor.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    investor.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    investor.phone?.includes(searchQuery)
  );

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric'
    });
  };

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-xxl font-helvetica text-[#1F1F1F]">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="font-goudy text-[34px] leading-tight text-[#1F1F1F]">CRM & Bulk Ops</h1>
            <p className="text-[#8E8E93] text-[14px] mt-1">Manage active investors and perform bulk operations like email or message outreach.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setIsEmailModalOpen(true)}
              disabled={selectedIds.length === 0}
              className={`flex items-center justify-center gap-2 px-8 py-2.5 rounded-full font-semibold transition-all shadow-sm ${
                selectedIds.length > 0 
                  ? 'bg-[#FFD66B] hover:bg-[#FFC840] text-[#1F1F1F]' 
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none'
              }`}
            >
              <Mail className="h-4 w-4" />
              <span>Send Email ({selectedIds.length})</span>
            </button>

            <button
              onClick={() => setIsMessageModalOpen(true)}
              disabled={selectedIds.length === 0}
              className={`flex items-center justify-center gap-2 px-8 py-2.5 rounded-full font-semibold transition-all shadow-sm ${
                selectedIds.length > 0 
                  ? 'bg-[#E5E7EB] hover:bg-[#D1D5DB] text-[#1F1F1F]' 
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none'
              }`}
            >
              <MessageSquare className="h-4 w-4" />
              <span>Send Message ({selectedIds.length})</span>
            </button>
          </div>
        </div>

        {/* Filters & Actions */}
        <div className="flex flex-col md:flex-row md:items-center gap-4 mb-8">
          <div className="relative max-w-[400px] flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8E8E93] h-4 w-4" />
            <input
              type="text"
              placeholder="Search by name, email or phone..."
              className="w-full bg-[#f8f9fa] border-none rounded-full py-2.5 pl-11 pr-4 text-[14px] focus:ring-1 focus:ring-[#FFD66B] outline-none"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="flex items-center gap-2 ml-auto text-[13px] text-[#8E8E93]">
            {selectedIds.length > 0 && (
              <span className="flex items-center gap-1.5 text-[#1F1F1F] font-medium bg-[#FFD66B]/10 px-4 py-1.5 rounded-full">
                <CheckCircle2 className="h-3.5 w-3.5 text-[#E2B93B]" />
                {selectedIds.length} selected
              </span>
            )}
            <span>Total: {filteredInvestors.length} Active Investors</span>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-[16px] shadow-sm border border-[#F2F2F2] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#F2F2F2] bg-[#fcfcfc]">
                  <th className="px-6 py-4 w-[50px]">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        className="w-4 h-4 rounded border-gray-300 text-[#FFD66B] focus:ring-[#FFD66B] cursor-pointer"
                        checked={selectedIds.length > 0 && selectedIds.length === filteredInvestors.length}
                        onChange={toggleSelectAll}
                      />
                    </div>
                  </th>
                  <th className="px-6 py-4 text-[13px] font-medium text-[#8E8E93]">Full Name</th>
                  <th className="px-6 py-4 text-[13px] font-medium text-[#8E8E93]">Email Address</th>
                  <th className="px-6 py-4 text-[13px] font-medium text-[#8E8E93]">Contact Number</th>
                  <th className="px-6 py-4 text-[13px] font-medium text-[#8E8E93]">Date Joined</th>
                  <th className="px-6 py-4 text-[13px] font-medium text-[#8E8E93]">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F2F2F2]">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-20 text-center">
                      <Loader2 className="h-8 w-8 animate-spin text-[#FFD66B] mx-auto" />
                    </td>
                  </tr>
                ) : filteredInvestors.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-20 text-center text-[#8E8E93]">
                      No active investors found.
                    </td>
                  </tr>
                ) : (
                  filteredInvestors.map((investor) => (
                    <tr 
                      key={investor.id} 
                      className={`hover:bg-gray-50/50 transition-colors cursor-pointer ${selectedIds.includes(investor.id) ? 'bg-[#FFD66B]/5' : ''}`}
                      onClick={() => toggleSelect(investor.id)}
                    >
                      <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            className="w-4 h-4 rounded border-gray-300 text-[#FFD66B] focus:ring-[#FFD66B] cursor-pointer"
                            checked={selectedIds.includes(investor.id)}
                            onChange={() => toggleSelect(investor.id)}
                          />
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#2A4474] to-[#1F3B6E] flex items-center justify-center text-[11px] font-bold text-white uppercase shadow-sm">
                            {investor.fullName?.charAt(0) || '?'}
                          </div>
                          <span className="text-[14px] font-semibold text-[#1F1F1F]">{investor.fullName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-[14px] text-[#4B4B4B]">{investor.email}</td>
                      <td className="px-6 py-4 text-[14px] text-[#4B4B4B] font-medium">
                        {investor.phone || 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-[14px] text-[#4B4B4B]">{formatDate(investor.dateJoined)}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase bg-green-50 text-green-600 border border-green-100">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                          Active
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal */}
        <SendEmailModal
          isOpen={isEmailModalOpen}
          onClose={() => setIsEmailModalOpen(false)}
          onSend={handleSendBulkEmail}
          selectedCount={selectedIds.length}
        />

        <SendMessageModal
          isOpen={isMessageModalOpen}
          onClose={() => setIsMessageModalOpen(false)}
          onSend={handleSendBulkMessage}
          selectedCount={selectedIds.length}
        />
      </div>
    </DashboardLayout>
  );
}
