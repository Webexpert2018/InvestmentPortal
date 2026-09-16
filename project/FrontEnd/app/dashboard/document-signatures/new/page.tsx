'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { DashboardLayout } from '@/components/DashboardLayout';
import { apiClient } from '@/lib/api/client';
import { toast } from 'sonner';
import dynamic from 'next/dynamic';
import { UploadCloud, File as FileIcon, Search, Check } from 'lucide-react';
import { Combobox } from '@/components/ui/combobox';

const VisualPdfEditor = dynamic(() => import('@/components/VisualPdfEditor').then(mod => mod.VisualPdfEditor), { ssr: false });

export default function NewDocumentSignaturePage() {
  const router = useRouter();

  const [name, setName] = useState('');
  const [users, setUsers] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [funds, setFunds] = useState<any[]>([]);
  const [selectedFundId, setSelectedFundId] = useState<string>('all');
  const [selectedInvestorIds, setSelectedInvestorIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [placements, setPlacements] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
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
      setUsers(uniqueUsers);
      setAllUsers(uniqueUsers);

      const combinedFunds = [
        { label: 'All Investors (Active Accounts)', value: 'all' },
        ...(fundsData || []).map((f: any) => ({ label: f.name, value: f.id.toString() })),
        ...(oldFundsData || []).map((f: any) => ({ label: `${f.projectName} (Real Estate Fund)`, value: f.projectId?.toString() || '' }))
      ].filter((f: any) => f.value);
      setFunds(combinedFunds);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load initial data');
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
        toast.error('Failed to load investors for the selected fund');
      }
    };
    fetchFundInvestors();
  }, [selectedFundId, allUsers]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setDocumentFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type === 'application/pdf') {
        setDocumentFile(file);
      } else {
        toast.error('Please upload a PDF file.');
      }
    }
  };

  const toggleInvestor = (compositeId: string) => {
    setSelectedInvestorIds(prev =>
      prev.includes(compositeId) ? prev.filter(i => i !== compositeId) : [...prev, compositeId]
    );
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error('Please enter a document name.');
      return;
    }

    if (!documentFile) {
      toast.error('Please upload a document.');
      return;
    }

    const formData = new FormData();
    formData.append('name', name);
    formData.append('document', documentFile);
    formData.append('placements', JSON.stringify(placements));
    formData.append('investorIds', JSON.stringify(selectedInvestorIds));

    setIsSubmitting(true);
    try {
      await apiClient.createDocumentSignatureCampaign(formData);
      toast.success('Document sent for signature successfully.');
      router.push('/dashboard/document-signatures');
    } catch (error: any) {
      toast.error(error.message || 'Failed to send document');
    } finally {
      setIsSubmitting(false);
    }
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
        <div className="mb-8">
          <h1 className="text-2xl sm:text-4xl font-bold text-[#1F1F1F] mb-1 font-goudy tracking-tight">New Signature Request</h1>
          <p className="text-gray-500 font-medium">Send a document to multiple investors for electronic signature.</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 space-y-8">
            {/* Document Details */}
            <div>
              <h3 className="text-lg font-bold text-[#1F3B6E] mb-4">1. Document Details</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Document Name</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-[#1F3B6E] focus:ring-1 focus:ring-[#1F3B6E] transition-all"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Q3 Investor Update & Consent Form"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Upload Document (PDF)</label>
                  <div
                    className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${isDragging ? 'border-[#1F3B6E] bg-[#1F3B6E]/5 scale-[1.01]' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                  >
                    <UploadCloud className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                    <h3 className="text-sm font-bold text-gray-900 mb-1">Drag & drop document here</h3>
                    <p className="text-xs text-gray-500 mb-4">PDF files only (Max 10MB)</p>

                    <label className="cursor-pointer bg-white px-5 py-2.5 border border-gray-200 rounded-lg shadow-sm text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors inline-flex items-center gap-2">
                      <UploadCloud className="w-4 h-4" />
                      <span>Browse Files</span>
                      <input
                        type="file"
                        accept=".pdf"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </label>

                    {documentFile && (
                      <div className="mt-6 flex items-center justify-center gap-2">
                        <div className="bg-[#E6F4EA] text-[#137333] px-3 py-1.5 rounded-full text-xs font-bold border border-[#A3E2B5] flex items-center gap-2">
                          <FileIcon className="w-3.5 h-3.5" />
                          {documentFile.name}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Signature Placements */}
            {documentFile && (
              <div className="border-t border-gray-100 pt-8">
                <h3 className="text-lg font-bold text-[#1F3B6E] mb-4">2. Configure Signature Placements</h3>
                <p className="text-sm text-gray-500 mb-4">Drag and drop the signature and name fields onto the document.</p>
                <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm bg-gray-50 p-1">
                  <VisualPdfEditor
                    file={documentFile}
                    initialValues={{ placements }}
                    templateType="GENERAL_DOCUMENT"
                    onChange={(coords) => {
                      setPlacements(coords.placements);
                    }}
                  />
                </div>
              </div>
            )}

            {/* Select Investors */}
            <div className="border-t border-gray-100 pt-8">
              <h3 className="text-lg font-bold text-[#1F3B6E] mb-1">3. Select Recipients</h3>
              <p className="text-sm text-gray-500 mb-4">Choose the investors who need to sign this document.</p>

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
          </div>

          <div className="p-6 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isSubmitting}
              className="px-6 border-gray-300 text-gray-700 font-semibold"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !documentFile}
              className="bg-[#2A6CB5] hover:bg-[#1F538D] text-white px-8 font-semibold shadow-sm transition-all"
            >
              {isSubmitting ? 'Sending...' : selectedInvestorIds.length === 0 ? 'Save Document' : 'Send for Signature'}
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
