'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { DashboardLayout } from '@/components/DashboardLayout';
import { apiClient } from '@/lib/api/client';
import { toast } from 'sonner';
import dynamic from 'next/dynamic';
import { UploadCloud, File as FileIcon, Trash2, Edit } from 'lucide-react';
import { Combobox } from '@/components/ui/combobox';

const VisualPdfEditor = dynamic(() => import('@/components/VisualPdfEditor').then(mod => mod.VisualPdfEditor), { ssr: false });

export default function NewFundTransferPage() {
  const router = useRouter();
  
  const [transferType, setTransferType] = useState<'FUND_TO_FUND' | 'PERSON_TO_PERSON'>('PERSON_TO_PERSON');
  const [users, setUsers] = useState<any[]>([]);
  const [allFunds, setAllFunds] = useState<any[]>([]);
  const [senderFunds, setSenderFunds] = useState<any[]>([]);
  
  const [fromInvestorId, setFromInvestorId] = useState('');
  const [toInvestorId, setToInvestorId] = useState('');
  const [fromFundId, setFromFundId] = useState('');
  const [toFundId, setToFundId] = useState('');
  const [investmentAmount, setInvestmentAmount] = useState('');
  const [units, setUnits] = useState('0');
  
  const [documentFile, setDocumentFile] = useState<File | string | null>(null);
  const [templateId, setTemplateId] = useState<string>('');
  const [placements, setPlacements] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [hasTemplate, setHasTemplate] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    fetchTemplate(transferType);
  }, [transferType]);

  useEffect(() => {
    if (fromInvestorId) {
      fetchSenderFunds(fromInvestorId);
    } else {
      setSenderFunds([]);
      setFromFundId('');
    }
  }, [fromInvestorId]);

  const fetchInitialData = async () => {
    try {
      const [usersData, fundsData] = await Promise.all([
        apiClient.getAllUsers(),
        apiClient.getFunds()
      ]);
      setUsers(usersData || []);
      setAllFunds(fundsData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load form data');
    }
  };

  const fetchSenderFunds = async (investorId: string) => {
    try {
      const data = await apiClient.getSenderFunds(investorId);
      setSenderFunds(data || []);
      // Reset source fund if it's no longer in the list
      if (fromFundId && !data.find((f: any) => f.fund_id === fromFundId)) {
        setFromFundId('');
      }
    } catch (error) {
      console.error('Failed to fetch sender funds:', error);
      toast.error('Failed to load sender funds');
    }
  };

  const fetchTemplate = async (type: string) => {
    try {
      setDocumentFile(null);
      setPlacements([]);
      setHasTemplate(false);
      
      const template = await apiClient.getTransferTemplate(type);
      if (template && template.document_url) {
        setHasTemplate(true);
        setTemplateId(template.id);
        setDocumentFile(template.document_url);
        setPlacements(template.placements || []);
      }
    } catch (error) {
      console.error('Error fetching template:', error);
    }
  };

  const selectedSourceFund = senderFunds.find(f => f.fund_id === fromFundId);

  // Auto-calculate units
  useEffect(() => {
    if (investmentAmount && selectedSourceFund) {
      const price = selectedSourceFund.current_nav ? parseFloat(selectedSourceFund.current_nav) : 1;
      const amount = parseFloat(investmentAmount);
      if (!isNaN(amount) && price > 0) {
        setUnits((amount / price).toFixed(4));
      }
    } else {
      setUnits('0');
    }
  }, [investmentAmount, selectedSourceFund]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!fromInvestorId || !fromFundId || !investmentAmount || !documentFile) {
      toast.error('Please fill all required fields and upload a document.');
      return;
    }

    if (transferType === 'PERSON_TO_PERSON' && !toInvestorId) {
      toast.error('Please select a recipient investor.');
      return;
    }

    if (transferType === 'FUND_TO_FUND' && !toFundId) {
      toast.error('Please select a destination fund.');
      return;
    }

    // Validation
    const amount = parseFloat(investmentAmount);
    if (selectedSourceFund && amount > parseFloat(selectedSourceFund.max_value)) {
      toast.error(`Amount exceeds maximum available fund value ($${parseFloat(selectedSourceFund.max_value).toLocaleString()})`);
      return;
    }

    const fromInvestor = users.find(u => u.id === fromInvestorId);
    if (!fromInvestor) {
      toast.error('Invalid sender selected.');
      return;
    }

    const formData = new FormData();
    formData.append('transferType', transferType);
    formData.append('fromInvestorId', fromInvestorId);
    if (transferType === 'PERSON_TO_PERSON') formData.append('toInvestorId', toInvestorId);
    formData.append('fromFundId', fromFundId);
    if (transferType === 'FUND_TO_FUND') formData.append('toFundId', toFundId);
    formData.append('investmentAmount', investmentAmount);
    formData.append('units', units);
    
    if (documentFile instanceof File) {
      formData.append('document', documentFile);
    } else if (templateId) {
      formData.append('templateId', templateId);
    }
    
    formData.append('placements', JSON.stringify(placements));
    
    const signerFullName = (fromInvestor.full_name || (fromInvestor.firstName + ' ' + (fromInvestor.lastName || '')) || fromInvestor.first_name + ' ' + (fromInvestor.last_name || '')).trim();
    formData.append('signerName', signerFullName);
    formData.append('signerEmail', fromInvestor.email);

    setIsSubmitting(true);
    try {
      // First save as template so future transfers use it
      if (documentFile instanceof File) {
        const templateData = new FormData();
        templateData.append('transferType', transferType);
        templateData.append('document', documentFile);
        templateData.append('placements', JSON.stringify(placements));
        await apiClient.upsertTransferTemplate(templateData);
      }

      // Then create the transfer
      await apiClient.createFundTransfer(formData);
      toast.success('Transfer created successfully. Signer will receive an email shortly.');
      router.push('/dashboard/funds/transfers');
    } catch (error: any) {
      toast.error(error.message || 'Failed to create transfer');
    } finally {
      setIsSubmitting(false);
    }
  };

  const userOptions = Array.from(new Map(users.map(u => {
    const name = (u.full_name || (u.firstName ? u.firstName + ' ' + (u.lastName || '') : '') || (u.first_name ? u.first_name + ' ' + (u.last_name || '') : '')).trim() || 'Unknown Investor';
    return [u.id, { label: `${name} (${u.email || 'No email'})`, value: u.id }];
  })).values());
  const senderFundOptions = senderFunds.map(f => ({ label: `${f.fund_name} (Avail: $${parseFloat(f.max_value).toLocaleString()})`, value: f.fund_id }));
  const allFundOptions = allFunds.map(f => ({ label: f.name, value: f.id.toString() }));

  return (
    <DashboardLayout>
      <div className="p-0 space-y-6">
        <div className="mb-8">
          <h1 className="text-2xl sm:text-4xl font-bold text-[#1F1F1F] mb-1 font-goudy tracking-tight">New Fund Transfer</h1>
          <p className="text-gray-500 font-medium">Create a new fund-to-fund or person-to-person transfer.</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Transfer Type</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer bg-gray-50 px-4 py-2 border border-gray-200 rounded-lg">
                    <input 
                      type="radio" 
                      name="transferType" 
                      value="PERSON_TO_PERSON" 
                      checked={transferType === 'PERSON_TO_PERSON'} 
                      onChange={() => setTransferType('PERSON_TO_PERSON')}
                      className="text-[#1F3B6E] focus:ring-[#1F3B6E]"
                    />
                    <span className="text-sm font-bold text-gray-800">Person to Person</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer bg-gray-50 px-4 py-2 border border-gray-200 rounded-lg">
                    <input 
                      type="radio" 
                      name="transferType" 
                      value="FUND_TO_FUND" 
                      checked={transferType === 'FUND_TO_FUND'} 
                      onChange={() => setTransferType('FUND_TO_FUND')}
                      className="text-[#1F3B6E] focus:ring-[#1F3B6E]"
                    />
                    <span className="text-sm font-bold text-gray-800">Fund to Fund</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Sender (Investor)</label>
                <Combobox 
                  options={userOptions}
                  value={fromInvestorId}
                  onChange={setFromInvestorId}
                  placeholder="Search sender..."
                />
              </div>

              {transferType === 'PERSON_TO_PERSON' ? (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Recipient (Investor)</label>
                  <Combobox 
                    options={userOptions.filter(u => u.value !== fromInvestorId)}
                    value={toInvestorId}
                    onChange={setToInvestorId}
                    placeholder="Search recipient..."
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Destination Fund</label>
                  <Combobox 
                    options={allFundOptions.filter(f => f.value !== fromFundId)}
                    value={toFundId}
                    onChange={setToFundId}
                    placeholder="Search destination fund..."
                  />
                </div>
              )}

              <div className={transferType === 'PERSON_TO_PERSON' ? 'md:col-span-2' : ''}>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Source Fund</label>
                <Combobox 
                  options={senderFundOptions}
                  value={fromFundId}
                  onChange={setFromFundId}
                  placeholder={fromInvestorId ? "Select a fund..." : "Select sender first"}
                  disabled={!fromInvestorId}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Investment Amount ($)</label>
                <input 
                  type="number"
                  step="0.01"
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none transition-all ${
                    selectedSourceFund && parseFloat(investmentAmount) > parseFloat(selectedSourceFund.max_value)
                      ? 'border-red-500 focus:ring-red-500 bg-red-50' 
                      : 'border-gray-200 focus:border-[#1F3B6E] focus:ring-[#1F3B6E]'
                  }`}
                  value={investmentAmount}
                  onChange={(e) => setInvestmentAmount(e.target.value)}
                  placeholder="e.g. 50000"
                  required
                />
                {selectedSourceFund && parseFloat(investmentAmount) > parseFloat(selectedSourceFund.max_value) && (
                  <p className="text-xs text-red-500 font-medium mt-1">Exceeds available value of ${parseFloat(selectedSourceFund.max_value).toLocaleString()}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Units (Calculated from NAV)</label>
                <input 
                  type="number"
                  step="0.0001"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none bg-gray-50 text-gray-500 cursor-not-allowed font-medium"
                  value={units}
                  readOnly
                  placeholder="0.0000"
                />
              </div>

              <div className="md:col-span-2 mt-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Transfer Document (PDF)</label>
                <div 
                  className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${isDragging ? 'border-[#1F3B6E] bg-[#1F3B6E]/5 scale-[1.01]' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <UploadCloud className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                  <h3 className="text-sm font-bold text-gray-900 mb-1">
                    {hasTemplate ? 'Use saved template or upload new' : 'Drag & drop document here'}
                  </h3>
                  <p className="text-xs text-gray-500 mb-4">PDF files only (Max 10MB)</p>
                  
                  <label className="cursor-pointer bg-white px-5 py-2.5 border border-gray-200 rounded-lg shadow-sm text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors inline-flex items-center gap-2">
                    {hasTemplate ? <Edit className="w-4 h-4" /> : <UploadCloud className="w-4 h-4" />}
                    <span>{hasTemplate ? 'Change Document' : 'Browse Files'}</span>
                    <input 
                      type="file"
                      accept=".pdf"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>

                  {documentFile && typeof documentFile !== 'string' && (
                    <div className="mt-6 flex items-center justify-center gap-2">
                      <div className="bg-[#E6F4EA] text-[#137333] px-3 py-1.5 rounded-full text-xs font-bold border border-[#A3E2B5] flex items-center gap-2">
                        <FileIcon className="w-3.5 h-3.5" />
                        {(documentFile as File).name}
                      </div>
                    </div>
                  )}
                  {documentFile && typeof documentFile === 'string' && (
                    <div className="mt-6 flex items-center justify-center gap-2">
                      <div className="bg-[#E6F4EA] text-[#137333] px-3 py-1.5 rounded-full text-xs font-bold border border-[#A3E2B5] flex items-center gap-2">
                        <FileIcon className="w-3.5 h-3.5" />
                        Using Saved Template
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {documentFile && (
              <div className="mt-8 border-t border-gray-100 pt-8">
                <h3 className="text-lg font-bold text-[#1F3B6E] mb-4">Configure Signature Placements</h3>
                <p className="text-sm text-gray-500 mb-4">Drag and drop the signature, name, and date fields onto the document where the sender needs to sign.</p>
                <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm bg-gray-50 p-1">
                  <VisualPdfEditor
                    file={documentFile}
                    initialValues={{ placements }}
                    templateType={transferType}
                    onChange={(coords) => {
                      setPlacements(coords.placements);
                    }}
                  />
                </div>
              </div>
            )}
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
              disabled={
                isSubmitting || 
                !documentFile || 
                (selectedSourceFund && parseFloat(investmentAmount) > parseFloat(selectedSourceFund.max_value))
              }
              className="bg-[#2A6CB5] hover:bg-[#1F538D] text-white px-8 font-semibold shadow-sm transition-all"
            >
              {isSubmitting ? 'Sending...' : 'Send for Signature'}
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
