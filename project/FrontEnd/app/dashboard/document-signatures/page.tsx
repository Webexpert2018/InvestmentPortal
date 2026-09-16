'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { DashboardLayout } from '@/components/DashboardLayout';
import { apiClient, BASE_URL } from '@/lib/api/client';
import { toast } from 'sonner';
import { Plus, FileText, CheckCircle2, Clock, Eye, Search, Check, X, Send } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Combobox } from '@/components/ui/combobox';

export default function DocumentSignaturesPage() {
  const router = useRouter();
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Resend State
  const [resendingId, setResendingId] = useState<string | null>(null);

  // Add Recipients Modal State
  const [isAddRecipientsOpen, setIsAddRecipientsOpen] = useState(false);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [funds, setFunds] = useState<any[]>([]);
  const [selectedFundId, setSelectedFundId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedInvestorIds, setSelectedInvestorIds] = useState<string[]>([]);
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    fetchCampaigns();
    fetchUsersAndFunds();
  }, []);

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      const data = await apiClient.getDocumentSignatureCampaigns();
      setCampaigns(data || []);
    } catch (error) {
      console.error('Failed to fetch campaigns', error);
      toast.error('Failed to load document signatures');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsersAndFunds = async () => {
    try {
      const [usersData, fundsData, oldFundsData] = await Promise.all([
        apiClient.getAllUsers(),
        apiClient.getFunds(),
        apiClient.getOldFunds()
      ]);
      const activeUsersData = (usersData || []).filter((u: any) => u.status?.toLowerCase() === 'active');
      const uniqueUsers = Array.from(new Map(activeUsersData.map((u: any) => {
        const accType = u.accountType || u.account_type || 'Personal';
        return [`${u.id}::${accType}`, { ...u, accountType: accType, compositeId: `${u.id}::${accType}` }];
      })).values());
      setAllUsers(uniqueUsers);
      setUsers(uniqueUsers);

      const combinedFunds = [
        { label: 'All Investors (Active Accounts)', value: 'all' },
        ...(fundsData || []).map((f: any) => ({ label: f.name, value: f.id.toString() })),
        ...(oldFundsData || []).map((f: any) => ({ label: `${f.projectName} (Real Estate Fund)`, value: f.projectId?.toString() || '' }))
      ].filter((f: any) => f.value);
      setFunds(combinedFunds);
    } catch (error) {
      console.error('Error fetching users and funds:', error);
    }
  };

  useEffect(() => {
    const fetchFundInvestors = async () => {
      if (!selectedFundId || selectedFundId === 'all') {
        setUsers(allUsers);
        return;
      }
      try {
        const data = await apiClient.getFundInvestors(selectedFundId);
        const uniqueUsers = Array.from(new Map((data || []).map((u: any) => {
          const accType = u.accountType || u.account_type || 'Personal';
          return [`${u.id}::${accType}`, { ...u, accountType: accType, compositeId: `${u.id}::${accType}` }];
        })).values());
        setUsers(uniqueUsers);
      } catch (error) {
        console.error('Error fetching fund investors:', error);
      }
    };
    if (isAddRecipientsOpen) {
      fetchFundInvestors();
    }
  }, [selectedFundId, allUsers, isAddRecipientsOpen]);

  const handleResend = async (campaignId: string, investorId: string) => {
    try {
      setResendingId(`${campaignId}-${investorId}`);
      await apiClient.resendDocumentSignature(campaignId, investorId);
      toast.success('Signature request email resent successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to resend signature request');
    } finally {
      setResendingId(null);
    }
  };

  const openAddRecipientsModal = (campaignId: string) => {
    setSelectedCampaignId(campaignId);
    setSelectedInvestorIds([]);
    setSearchQuery('');
    setSelectedFundId('all');
    setIsAddRecipientsOpen(true);
  };

  const closeAddRecipientsModal = () => {
    setIsAddRecipientsOpen(false);
    setSelectedCampaignId(null);
  };

  const handleAddRecipients = async () => {
    if (!selectedCampaignId || selectedInvestorIds.length === 0) return;
    try {
      setIsAdding(true);
      await apiClient.addDocumentSignatureRecipients(selectedCampaignId, selectedInvestorIds);
      toast.success('Recipients added successfully!');
      closeAddRecipientsModal();
      fetchCampaigns(); // Refresh the list
    } catch (error: any) {
      toast.error(error.message || 'Failed to add recipients');
    } finally {
      setIsAdding(false);
    }
  };

  const toggleSelectAll = () => {
    if (filteredUsers.length === 0) return;
    const isAllSelected = filteredUsers.every(user => selectedInvestorIds.includes(user.compositeId));
    if (isAllSelected) {
      setSelectedInvestorIds(prev => prev.filter(id => !filteredUsers.find(u => u.compositeId === id)));
    } else {
      const newIds = new Set([...selectedInvestorIds, ...filteredUsers.map(u => u.compositeId)]);
      setSelectedInvestorIds(Array.from(newIds));
    }
  };

  const toggleInvestor = (compositeId: string) => {
    setSelectedInvestorIds(prev =>
      prev.includes(compositeId) ? prev.filter(i => i !== compositeId) : [...prev, compositeId]
    );
  };

  const filteredUsers = users.filter(u => {
    const fullName = (u.full_name || `${u.firstName || u.first_name || ''} ${u.lastName || u.last_name || ''}`).toLowerCase();
    const email = (u.email || '').toLowerCase();
    const query = searchQuery.toLowerCase();
    return fullName.includes(query) || email.includes(query);
  });

  return (
    <DashboardLayout>
      <div className="p-0 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-4xl font-bold text-[#1F1F1F] mb-1 font-goudy tracking-tight">Document Signatures</h1>
            <p className="text-gray-500 font-medium">Manage and track documents sent for signature.</p>
          </div>
          <Button
            onClick={() => router.push('/dashboard/document-signatures/new')}
            className="bg-[#2A6CB5] hover:bg-[#1F538D] text-white px-6 font-semibold shadow-sm transition-all flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Send New Document
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2A6CB5]"></div>
          </div>
        ) : campaigns.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-gray-900 mb-2">No documents sent yet</h3>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">Send a document to investors to collect their signatures electronically.</p>
            <Button
              onClick={() => router.push('/dashboard/document-signatures/new')}
              className="bg-[#FFC63F] hover:bg-[#F1DD58] text-[#1F1F1F] px-6 font-bold shadow-sm transition-all"
            >
              Send Your First Document
            </Button>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <Accordion type="multiple" className="w-full">
              {campaigns.map((campaign) => (
                <AccordionItem key={campaign.id} value={campaign.id} className="border-b border-gray-100 last:border-0">
                  <AccordionTrigger className="px-6 py-4 hover:bg-gray-50 transition-colors hover:no-underline">
                    <div className="flex items-center gap-4 text-left">
                      <div className="bg-[#F0F4F8] p-3 rounded-lg text-[#2A6CB5]">
                        <FileText className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 text-lg">{campaign.name}</h3>
                        <p className="text-sm text-gray-500 mt-1">
                          Sent on {new Date(campaign.created_at).toLocaleDateString()} • {campaign.recipients.length} Recipients
                        </p>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pb-6 pt-2 bg-gray-50/50">
                    <div className="mt-4 bg-white border border-gray-200 rounded-lg overflow-hidden">
                      <div className="flex justify-between items-center p-4 bg-gray-50 border-b border-gray-200">
                        <div className="flex items-center gap-4">
                          <h4 className="font-semibold text-gray-700 text-sm">Recipient Status</h4>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 px-2 text-xs text-[#2A6CB5] border-[#2A6CB5]/30 hover:bg-[#2A6CB5]/10"
                            onClick={() => openAddRecipientsModal(campaign.id)}
                          >
                            <Plus className="w-3.5 h-3.5 mr-1" /> Add Recipients
                          </Button>
                        </div>
                        <a
                          href={`${BASE_URL}/api/document-signatures/${campaign.id}/original-pdf`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs font-medium text-[#2A6CB5] hover:underline flex items-center gap-1"
                        >
                          <Eye className="w-3 h-3" />
                          View Original Document
                        </a>
                      </div>
                      <table className="w-full text-sm text-left table-fixed">
                        <thead className="bg-gray-50/50 text-xs text-gray-500 uppercase font-semibold border-b border-gray-200">
                          <tr>
                            <th className="px-4 py-3 w-[20%]">Investor Name</th>
                            <th className="px-4 py-3 w-[15%]">Account Type</th>
                            <th className="px-4 py-3 w-[25%]">Email</th>
                            <th className="px-4 py-3 w-[20%]">Status</th>
                            <th className="px-4 py-3 w-[20%] text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {campaign.recipients.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="px-4 py-8 text-center text-gray-500 text-sm">
                                No recipients added yet. Click "Add Recipients" to invite investors.
                              </td>
                            </tr>
                          ) : (
                            campaign.recipients.map((recipient: any) => (
                              <tr key={recipient.id} className="hover:bg-gray-50/50 transition-colors">
                                <td className="px-4 py-3 font-medium text-gray-900 truncate">
                                  {recipient.investor_name || 'Unknown'}
                                </td>
                                <td className="px-4 py-3">
                                  <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider whitespace-nowrap">
                                    {recipient.account_type || 'Personal'}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-gray-500 truncate">
                                  {recipient.investor_email}
                                </td>
                                <td className="px-4 py-3">
                                  {recipient.status === 'SIGNED' ? (
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-200">
                                      <CheckCircle2 className="w-3.5 h-3.5" />
                                      Signed
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                                      <Clock className="w-3.5 h-3.5" />
                                      Pending
                                    </span>
                                  )}
                                </td>
                                <td className="px-4 py-3 text-right">
                                  {recipient.status === 'SIGNED' ? (
                                    <a
                                      href={`${BASE_URL}/api/document-signatures/${campaign.id}/signed-pdf/${recipient.investor_id}`}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-8 px-3 text-[#2A6CB5] hover:text-[#1F538D] hover:bg-[#2A6CB5]/10"
                                    >
                                      View Signature
                                    </a>
                                  ) : (
                                    <button
                                      onClick={() => handleResend(campaign.id, recipient.investor_id)}
                                      disabled={resendingId === `${campaign.id}-${recipient.investor_id}`}
                                      className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-xs font-semibold h-8 px-3 text-amber-700 hover:bg-amber-100/50 transition-colors disabled:opacity-50"
                                    >
                                      {resendingId === `${campaign.id}-${recipient.investor_id}` ? (
                                        <span className="flex items-center gap-1.5"><Clock className="w-3 h-3 animate-spin" /> Sending...</span>
                                      ) : (
                                        <span className="flex items-center gap-1.5"><Send className="w-3 h-3" /> Resend</span>
                                      )}
                                    </button>
                                  )}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        )}
      </div>

      {/* Add Recipients Modal */}
      {isAddRecipientsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h2 className="text-lg font-bold text-[#1F3B6E]">Add Recipients</h2>
              <button
                onClick={closeAddRecipientsModal}
                className="p-2 rounded-full hover:bg-gray-200 transition-colors text-gray-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 flex-1 overflow-y-auto">
              <p className="text-sm text-gray-500 mb-6">Select the investors you want to invite to sign this document.</p>

              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Filter by Fund</label>
                  <Combobox
                    options={funds}
                    value={selectedFundId}
                    onChange={setSelectedFundId}
                    placeholder="Select a fund..."
                  />
                </div>
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search investors by name or email..."
                    className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#1F3B6E] focus:ring-1 focus:ring-[#1F3B6E]"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                <div className="max-h-60 overflow-y-auto bg-white border border-gray-200 rounded-lg divide-y divide-gray-100">
                  {filteredUsers.length > 0 && (
                    <label
                      onClick={toggleSelectAll}
                      className="flex items-center gap-3 p-3 cursor-pointer hover:bg-gray-50 transition-colors border-b border-gray-100 bg-gray-50/50"
                    >
                      <div className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 ${filteredUsers.every(u => selectedInvestorIds.includes(u.compositeId)) ? 'bg-[#2A6CB5] border-[#2A6CB5]' : 'border-gray-300 bg-white'}`}>
                        {filteredUsers.every(u => selectedInvestorIds.includes(u.compositeId)) && <Check className="w-3.5 h-3.5 text-white" />}
                      </div>
                      <div className="font-semibold text-sm text-gray-900">Select All ({filteredUsers.length})</div>
                    </label>
                  )}
                  {filteredUsers.length === 0 ? (
                    <div className="p-4 text-center text-sm text-gray-500">No investors found.</div>
                  ) : (
                    filteredUsers.map((user) => {
                      const isSelected = selectedInvestorIds.includes(user.compositeId);
                      const name = (user.full_name || `${user.firstName || user.first_name || ''} ${user.lastName || user.last_name || ''}`).trim() || 'Unknown Investor';
                      return (
                        <label
                          key={user.compositeId}
                          className={`flex items-center gap-3 p-3 cursor-pointer hover:bg-gray-50 transition-colors ${isSelected ? 'bg-blue-50/30' : ''}`}
                        >
                          <div className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 ${isSelected ? 'bg-[#2A6CB5] border-[#2A6CB5]' : 'border-gray-300 bg-white'}`}>
                            {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                          </div>
                          <div className="flex-1 min-w-0 flex items-center gap-2">
                            <span className="font-semibold text-sm text-gray-900 truncate">{name}</span>
                            <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                              {user.accountType}
                            </span>
                            <span className="text-sm text-gray-500 truncate ml-auto">{user.email}</span>
                          </div>
                          <input
                            type="checkbox"
                            className="hidden"
                            checked={isSelected}
                            onChange={() => toggleInvestor(user.compositeId)}
                          />
                        </label>
                      );
                    })
                  )}
                </div>
                <div className="mt-3 text-sm font-semibold text-[#1F3B6E]">
                  {selectedInvestorIds.length} recipient(s) selected
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50">
              <Button
                variant="outline"
                onClick={closeAddRecipientsModal}
                disabled={isAdding}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddRecipients}
                disabled={isAdding || selectedInvestorIds.length === 0}
                className="bg-[#2A6CB5] hover:bg-[#1F538D] text-white"
              >
                {isAdding ? 'Adding & Sending...' : 'Add Recipients'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
