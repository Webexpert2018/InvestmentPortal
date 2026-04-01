'use client';

import { useMemo, useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/DashboardLayout';
import { apiClient, BASE_URL } from '@/lib/api/client';
import {
  ChevronLeft,
  Download,
  FileText,
  Maximize2,
  Minus,
  Plus,
  Printer,
  Search,
  Eye
} from 'lucide-react';

type Step =
  | 'chooseFund'
  | 'fundingAccount'
  | 'investmentAmount'
  | 'signDocuments'
  | 'fundingInstructions'
  | 'investmentStatus';

type FooterOptions = {
  primaryLabel?: string;
  showBack?: boolean;
};

const getFullImageUrl = (imagePath: string | null | undefined): string | undefined => {
  if (!imagePath) return undefined;
  if (imagePath.startsWith('http')) return imagePath;
  if (imagePath.startsWith('/images/')) return imagePath; // Static assets in Frontend public folder
  return `${BASE_URL}${imagePath}`;
};

export default function InvestPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState<Step>('chooseFund');
  const [funds, setFunds] = useState<any[]>([]);
  const [existingFlows, setExistingFlows] = useState<any[]>([]);
  const [selectedFundId, setSelectedFundId] = useState<string | null>(null);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>('personal');
  const [amount, setAmount] = useState<string>('25000');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isSigning, setIsSigning] = useState(false);
  const [userIraAccount, setUserIraAccount] = useState<any>(null);
  const [subscriptionDocs, setSubscriptionDocs] = useState<any[]>([
    { name: 'OA-BWell-Fund.pdf', pages: 26, lastModified: 'Oct 12, 2025', size: '384 KB' },
    { name: 'SA-BWell-Fund.pdf', pages: 12, lastModified: 'Oct 12, 2025', size: '138 KB' }
  ]);
  const [selectedSubDoc, setSelectedSubDoc] = useState<any | null>({
    name: 'OA-BWell-Fund.pdf', pages: 26, lastModified: 'Oct 12, 2025', size: '384 KB'
  });
  const [selectedPage, setSelectedPage] = useState<number>(1);
  const [zoom, setZoom] = useState<number>(100);
  const [lastEnvelopeId, setLastEnvelopeId] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [currentInvestment, setCurrentInvestment] = useState<any>(null);

  // Check for DocuSign completion in URL
  useEffect(() => {
    const savedEnvelopeId = localStorage.getItem('last_envelope_id');
    if (savedEnvelopeId) {
      setLastEnvelopeId(savedEnvelopeId);
    }
  }, []);

  useEffect(() => {
    const signingStatus = searchParams?.get('signing');
    const eventStatus = searchParams?.get('event');

    if (signingStatus === 'complete' || eventStatus === 'signing_complete') {
      const lastId = localStorage.getItem('last_investment_id');
      if (lastId) {
        apiClient.updateInvestmentStatus(lastId, {
          status: 'Awaiting Funding',
          documentSigned: true
        })
          .then(() => {
            // Fetch updated record immediately
            apiClient.getMyTransactions().then(investments => {
              const updated = investments.find((i: any) => i.id === lastId);
              if (updated) setCurrentInvestment(updated);
            });
          })
          .catch(err => console.error('Failed to update investment status:', err));
      }
      setStep('fundingInstructions');
      // Clean up URL
      const current = new URLSearchParams(Array.from(searchParams?.entries() || []));
      current.delete('signing');
      const search = current.toString();
      const query = search ? `?${search}` : '';
      router.replace(`/dashboard/invest${query}`);
    }
  }, [searchParams, router]);

  const selectedFund = useMemo(() => {
    return funds.find(f => f.id === selectedFundId);
  }, [funds, selectedFundId]);

  const dynamicAccounts = useMemo(() => {
    const list = [
      {
        id: 'personal',
        label: 'Personal Account',
        value: 'Cash / Checking',
      },
    ];

    if (userIraAccount) {
      list.push({
        id: userIraAccount.id || 'ira',
        label: `${userIraAccount.account_type || 'IRA'} Account`,
        value: userIraAccount.custodian_name || 'IRA Custodian',
      });
    }

    return list;
  }, [userIraAccount]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [fundsData, flowsData, iraData] = await Promise.all([
          apiClient.getFunds(),
          apiClient.getMyFundFlows(),
          apiClient.getMyIRAAccount().catch(() => null),
        ]);
        setFunds(fundsData);
        setExistingFlows(flowsData);
        setUserIraAccount(iraData);
        if (fundsData.length > 0 && !selectedFundId) {
          setSelectedFundId(fundsData[0].id);
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [selectedFundId]);

  // Fixed documents are now initialized directly in state

  const { investmentAmount, processingFee, total } = useMemo(() => {
    const cleanAmount = amount.replace(/[^-0-9.]/g, '');
    const numeric = Number.parseFloat(cleanAmount) || 0;
    const fee = numeric * 0.005;
    return {
      investmentAmount: numeric,
      processingFee: fee,
      total: numeric + fee,
    };
  }, [amount]);

  // Periodic polling for investment status when in the final steps
  useEffect(() => {
    if (step === 'fundingInstructions' || step === 'investmentStatus' || step === 'signDocuments') {
      const fetchStatus = async () => {
        try {
          const lastId = localStorage.getItem('last_investment_id');
          if (lastId) {
            const investments = await apiClient.getMyTransactions();
            const inv = investments.find((i: any) => i.id === lastId);
            if (inv) setCurrentInvestment(inv);
          }
        } catch (error) {
          console.error('Failed to poll status:', error);
        }
      };

      fetchStatus();
      const interval = setInterval(fetchStatus, 30000); // Polling status
      return () => clearInterval(interval);
    }
  }, [step]);

  const goBack = () => {
    setStep((current) => {
      switch (current) {
        case 'investmentAmount':
          return 'chooseFund';
        case 'fundingAccount':
          return 'investmentAmount';
        case 'signDocuments':
          return 'fundingAccount';
        case 'fundingInstructions':
          return 'signDocuments';
        case 'investmentStatus':
          return 'fundingInstructions';
        default:
          return current;
      }
    });
  };

  const handleStartSigning = async () => {
    if (!selectedFundId || !selectedFund) return;

    // Check locally if authorized
    const dsAccessToken = localStorage.getItem('ds_access_token');
    const dsAccountId = localStorage.getItem('ds_account_id');

    setIsSigning(true);
    try {
      const isIra = selectedAccountId !== 'personal';

      // 1. Create investment record first (Status: Pending Signature)
      const investment = await apiClient.createInvestment({
        fundId: selectedFundId,
        accountId: isIra ? (selectedAccountId ?? undefined) : undefined,
        accountType: isIra ? 'ira' : 'personal',
        investmentAmount: investmentAmount,
        unitPrice: 1.25,
        status: 'Subscription Submitted',
        documentSigned: false
      });

      if (investment && investment.id) {
        localStorage.setItem('last_investment_id', investment.id);
      }

      if (!dsAccessToken || !dsAccountId) {
        const confirmed = window.confirm('DocuSign is not connected. Redirect to authorization?');
        if (confirmed) {
          window.location.href = `${BASE_URL}/api/docusign/auth`;
        }
        return;
      }

      // 2. Proceed to DocuSign
      const response = await apiClient.createDocuSignEnvelope({
        fundId: selectedFundId,
        fundName: selectedFund.name,
        accessToken: dsAccessToken,
        accountId: dsAccountId,
        investmentAmount: investmentAmount,
        accountType: isIra ? 'ira' : 'personal',
        iraMetadata: isIra ? {
          custodian: userIraAccount?.custodian_name,
          type: userIraAccount?.account_type
        } : undefined,
        returnUrl: `${window.location.origin}/dashboard/invest?signing=complete`
      });

      if (response.signingUrl) {
        if (response.envelopeId) {
          localStorage.setItem('last_envelope_id', response.envelopeId);
          setLastEnvelopeId(response.envelopeId);
        }
        window.location.href = response.signingUrl;
      } else {
        throw new Error('Failed to get signing URL');
      }
    } catch (error) {
      console.error('DocuSign Error:', error);
      alert('Failed to initiate DocuSign. Please ensure you are authorized.');
    } finally {
      setIsSigning(false);
    }
  };

  const saveInvestment = async (finalStatus?: string) => {
    if (!selectedFundId || !selectedAccountId || investmentAmount <= 0) return;
    setSaving(true);
    try {
      const isIra = selectedAccountId !== 'personal';
      const result = await apiClient.createInvestment({
        fundId: selectedFundId,
        accountId: isIra ? selectedAccountId : undefined,
        accountType: isIra ? 'ira' : 'personal',
        investmentAmount: investmentAmount,
        unitPrice: 1.25, // Fixed at 1.25 as seen in the UI
        status: finalStatus || 'Subscription Submitted',
        documentSigned: true, // Marked as true since they completed the signing step
      });
      return result;
    } catch (error) {
      console.error('Failed to save investment:', error);
      alert(error instanceof Error ? error.message : 'Failed to save investment. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDownload = () => {
    if (!selectedSubDoc) return;
    const link = document.createElement('a');
    link.href = `/documents/subscription/${selectedSubDoc.name}`;
    link.download = selectedSubDoc.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  const goNext = async () => {
    if (step === 'signDocuments') {
      await handleStartSigning();
      return;
    }

    if (step === 'investmentStatus') {
      const result = await saveInvestment('Subscription Submitted');
      if (result) {
        setShowSuccess(true);
        // Reset states for fresh start (but keep success view)
        setAmount('25000');
        setSelectedAccountId('personal');
      }
      return;
    }

    setStep((current) => {
      switch (current) {
        // ... (the rest of the cases)
        case 'chooseFund':
          return 'investmentAmount';
        case 'investmentAmount':
          return 'fundingAccount';
        case 'fundingAccount':
          return 'signDocuments';
        case 'signDocuments':
          return 'fundingInstructions';
        case 'fundingInstructions':
          return 'investmentStatus';
        default:
          return current;
      }
    });
  };

  const renderFooter = (options: FooterOptions = {}) => {
    const { primaryLabel = 'Continue', showBack = true } = options;

    return (
      <div className="mt-16 flex items-center justify-between border-t border-[#E5E5EA] pt-8">
        <button
          type="button"
          onClick={() => setStep('chooseFund')}
          className="rounded-full bg-[#FFF3D6] px-10 py-3 text-sm font-semibold text-[#4B4B4B] hover:bg-[#FFE7AF] transition-all"
        >
          Cancel
        </button>
        <div className="flex items-center gap-4">
          {showBack && (
            <button
              type="button"
              onClick={goBack}
              className="rounded-full bg-[#FFF3D6] px-10 py-3 text-sm font-semibold text-[#4B4B4B] hover:bg-[#FFE7AF] transition-all"
            >
              Back
            </button>
          )}
          <button
            type="button"
            onClick={goNext}
            className="rounded-full bg-[#FBCB4B] px-10 py-3 text-sm font-semibold text-[#1F1F1F] hover:bg-[#F9B800] disabled:cursor-not-allowed disabled:opacity-60 shadow-sm transition-all"
            disabled={
              saving ||
              (step === 'fundingAccount' && !selectedAccountId) ||
              (step === 'investmentAmount' && investmentAmount <= 0)
            }
          >
            {saving ? 'Saving...' : primaryLabel}
          </button>
        </div>
      </div>
    );
  };

  const renderChooseFund = () => (
    <>

      <div className="mb-6">
        <h1 className="font-goudy text-sm sm:text-xl font-bold leading-[32px] text-[#1F1F1F]">
          Choose a Fund
        </h1>
        <p className="mt-2 text-sm text-[#8E8E93]">
          Select the fund you would like to invest in.
          You will complete your investment steps on text next screens.
        </p>
      </div>

      <div className="rounded-2xl bg-white px-6 py-6 shadow-sm">
        <div className="grid gap-6 md:grid-cols-2">
          {funds.map((fund) => {
            const selected = fund.id === selectedFundId;
            return (
              <button
                key={fund.id}
                type="button"
                onClick={() => {
                  setSelectedFundId(fund.id);
                  setStep('investmentAmount');
                }}
                className={`flex w-full items-center rounded-sm bg-[#F7F8FA] px-6 py-6 text-left transition hover:bg-[#F1F2F5] ${selected ? 'ring-2 ring-[#274583] ring-offset-2 ring-offset-white' : ''
                  }`}
              >
                <img
                  src={getFullImageUrl(fund.image)}
                  alt={fund.name}
                  className="mr-6 h-24 w-40 rounded-lg object-cover"
                />
                <div className="flex flex-col">
                  <h3 className="font-goudy text-sm sm:text-xl font-bold leading-tight text-[#1F1F1F]">
                    {fund.name}
                  </h3>
                  <div className="flex items-center gap-3 mt-1.5 mb-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${fund.status === 'Closed' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'
                      }`}>
                      {fund.status || 'Active'}
                    </span>
                    <span className="text-[10px] text-[#8E8E93] font-medium lowercase">
                      Created: {fund.startDate ? new Date(fund.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#4B4B4B] line-clamp-2 max-w-sm">
                    {fund.description || 'Secure institutional-grade Bitcoin strategies.'}
                  </p>
                  {fund.note && (
                    <p className="mt-1.5 text-[10px] text-gray-400 line-clamp-1 italic italic">
                      {fund.note}
                    </p>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            className="rounded-full bg-[#FFF3D6] px-5 py-2 text-sm font-medium text-[#4B4B4B] hover:bg-[#FFE7AF]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={goNext}
            className="rounded-full bg-[#FBCB4B] px-6 py-2 text-sm font-medium text-[#1F1F1F] hover:bg-[#F9B800] disabled:cursor-not-allowed disabled:opacity-60"
            disabled={!selectedFundId}
          >
            Invest Now
          </button>
        </div>
      </div>
    </>
  );

  const renderFundingAccount = () => (
    <>
      <div className="mb-6">
        <h1 className="font-goudy text-[30px] font-bold leading-[38px] text-[#1F1F1F]">
          Select Funding Account
        </h1>
        <p className="mt-2 text-sm text-[#8E8E93]">
          Choose the account you want to invest from.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {dynamicAccounts.map((account: any) => {
          const selected = account.id === selectedAccountId;
          return (
            <button
              key={account.id}
              type="button"
              onClick={() => setSelectedAccountId(account.id)}
              className={`flex w-full flex-col items-start rounded-2xl px-6 py-5 text-left transition ${selected
                ? 'bg-white shadow-md ring-2 ring-[#274583] ring-offset-2'
                : 'bg-white shadow-sm hover:shadow-md border border-[#E5E5EA]'
                }`}
            >
              <div className="flex w-full items-center justify-between mb-1">
                <p className="text-sm font-bold text-[#1F1F1F]">{account.label}</p>
                <div
                  className={`flex h-5 w-5 items-center justify-center rounded-full border ${selected ? 'border-[#274583] bg-[#274583]' : 'border-[#D4D4D4]'
                    }`}
                >
                  {selected && <div className="h-2 w-2 rounded-full bg-white" />}
                </div>
              </div>
              <p className="text-xs text-[#8E8E93]">{account.value}</p>
            </button>
          );
        })}
      </div>

      {renderFooter()}
    </>
  );

  const renderInvestmentAmount = () => (
    <>
      <div className="mb-8">
        <h1 className="font-goudy text-xl sm:text-[28px] font-bold leading-[38px] text-[#1F1F1F]">
          Investment Amount
        </h1>
        <p className="mt-1 text-sm text-[#8E8E93]">Specify how much you&apos;d like to invest.</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <div className="rounded-2xl bg-white px-8 py-8 shadow-sm border border-gray-100">
            <label className="block text-xs font-bold uppercase tracking-wide text-[#4B4B4B] mb-4">
              Amount
            </label>
            <div className="relative">
              <input
                type="text"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="$0.00"
                className="w-full rounded-xl border border-[#E5E5EA] bg-white px-6 py-4 text-lg font-medium text-[#1F1F1F] outline-none focus:border-[#274583] focus:ring-1 focus:ring-[#274583] transition-all"
              />
              <p className="mt-3 text-xs text-[#8E8E93]">Minimum investment: $10,000</p>
            </div>
          </div>

          <div className="rounded-2xl bg-white px-8 py-8 shadow-sm border border-gray-100">
            <p className="text-xs font-bold uppercase tracking-wide text-[#4B4B4B] mb-6">
              Estimated Units You Will Receive
            </p>
            <div className="grid gap-12 md:grid-cols-2">
              <div className="border-r border-gray-100 pr-8">
                <p className="text-sm font-medium text-[#8E8E93] mb-1">Unit Price</p>
                <p className="text-xl font-bold text-[#1F1F1F]">$1.25</p>
              </div>
              <div>
                <p className="text-sm font-medium text-[#8E8E93] mb-1">Estimated Units</p>
                <p className="text-xl font-bold text-[#1F1F1F]">40,000 units</p>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-white px-8 py-8 shadow-sm border border-gray-100 h-fit">
          <h2 className="font-goudy text-lg font-bold text-[#1F1F1F] mb-6">Order Summary</h2>
          <div className="space-y-4 text-sm">
            <div className="flex items-center justify-between text-[#4B4B4B]">
              <span className="font-medium">Investment Amount:</span>
              <span className="font-bold text-[#1F1F1F]">
                $
                {investmentAmount.toLocaleString('en-US', {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                })}
              </span>
            </div>
            <div className="flex items-center justify-between text-[#4B4B4B]">
              <span className="font-medium">Processing Fee (0.5%):</span>
              <span className="font-bold text-[#1F1F1F]">
                $
                {processingFee.toLocaleString('en-US', {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                })}
              </span>
            </div>
            <div className="pt-6 mt-6 border-t border-dashed border-[#E5E5EA]">
              <div className="flex items-center justify-between">
                <span className="text-gray-400 font-medium">Total</span>
                <span className="text-xl font-bold text-[#2BB673]">
                  $
                  {total.toLocaleString('en-US', {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  })}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {renderFooter()}
    </>
  );

  const renderSignDocuments = () => (
    <>
      <div className="mb-6">
        <h1 className="font-goudy text-[30px] font-bold leading-[38px] text-[#1F1F1F]">
          Sign Subscription Documents
        </h1>
        <p className="mt-1 text-sm text-[#8E8E93]">
          Review and e-sign required documents.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        {/* Left Preview Section */}
        <div className="rounded-[8px] bg-white p-4 shadow-sm border border-[#E5E5EA]">
          <div className="flex flex-col min-h-[600px] rounded-[6px] border border-[#E9EBEE] bg-[#F8F9FB] overflow-hidden transition-all">
            {/* Toolbar */}
            <div className="flex h-[44px] items-center justify-between border-b border-[#E2E5EA] bg-white px-4">
              <div className="flex items-center gap-3 text-[12px] text-[#6B7280]">
                <button
                  onClick={() => { setSelectedSubDoc(null); setSelectedPage(1); }}
                  className="inline-flex items-center gap-1 text-[#5E6B7F] hover:text-[#1F1F1F] transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Back
                </button>
                <div className="border-l border-gray-200 pl-3">
                  <p className="font-medium text-[#374151] truncate max-w-[200px]">
                    {selectedSubDoc?.name || 'Select a document'}
                  </p>
                  <p className="text-[10px] text-[#9CA3AF]">
                    Document Vault &gt; Subscription Documents
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-[#6B7280]">
                <button type="button" onClick={handleDownload} className="hover:text-[#374151]"><Download className="h-3.5 w-3.5" /></button>
                <button type="button" onClick={handlePrint} className="hover:text-[#374151]"><Printer className="h-3.5 w-3.5" /></button>
                <button type="button" className="hover:text-[#374151]"><Search className="h-3.5 w-3.5" /></button>
                <span className="text-[11px] font-medium">{zoom}%</span>
                <button type="button" onClick={() => setZoom(prev => Math.max(50, prev - 10))} className="hover:text-[#374151]"><Minus className="h-3.5 w-3.5" /></button>
                <button type="button" onClick={() => setZoom(prev => Math.min(200, prev + 10))} className="hover:text-[#374151]"><Plus className="h-3.5 w-3.5" /></button>
                <button type="button" className="hover:text-[#374151]"><Maximize2 className="h-3.5 w-3.5" /></button>
              </div>
            </div>

            <div className="grid flex-1 grid-cols-[92px_1fr]">
              {/* Dynamic Thumbnail Sidebar */}
              <aside className="border-r border-[#E2E5EA] bg-white p-2 flex flex-col gap-2 overflow-y-auto max-h-[520px] custom-scrollbar">
                {selectedSubDoc && Array.from({ length: selectedSubDoc.pages || 1 }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    type="button"
                    onClick={() => setSelectedPage(page)}
                    className={`flex h-[80px] w-full flex-col items-center justify-center rounded-[4px] border text-[10px] transition-all shrink-0 ${page === selectedPage ? 'border-[#5EA0FF] bg-[#EEF4FF] text-[#4B5563]' : 'border-[#E4E7EC] bg-[#F4F6F9] text-[#6B7280] hover:border-gray-300'
                      }`}
                  >
                    <FileText className="h-4 w-4 mb-1" />
                    <span>Page {page}</span>
                  </button>
                ))}
              </aside>

              {/* Main Content Area */}
              <div className="relative bg-[#ECEDEF] p-10 flex justify-center items-start overflow-y-auto max-h-[520px] custom-scrollbar selection-none">
                <div
                  className="w-full max-w-[500px] h-fit bg-white shadow-lg border border-[#D9DDE3] rounded-sm relative transition-transform origin-top select-none"
                  style={{ transform: `scale(${zoom / 100})`, minHeight: '800px' }}
                >
                  {selectedSubDoc ? (
                    <iframe
                      src={`/documents/subscription/${selectedSubDoc.name}#toolbar=0&navpanes=0&scrollbar=0&page=${selectedPage}`}
                      key={`${selectedSubDoc.name}-${selectedPage}`}
                      className="w-full h-full border-none absolute inset-0 pointer-events-auto"
                      style={{ minHeight: '800px' }}
                      title="Document Preview"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center h-[500px] text-[#8E8E93] p-8 text-center italic">
                      <p>Select a document to begin preview</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Dynamic Status Bar */}
            <div className="flex h-[30px] items-center justify-between border-t border-[#E2E5EA] bg-white px-4 text-[10px] text-[#98A1B2]">
              <p>{selectedSubDoc ? selectedSubDoc.lastModified : 'No selection'}</p>
              <p>{selectedSubDoc ? selectedSubDoc.size : ''}</p>
            </div>
          </div>
        </div>

        {/* Right Action Section */}
        <div className="flex flex-col gap-6">
          <div className="rounded-2xl bg-white p-8 shadow-sm border border-[#E5E5EA]">
            <h2 className="font-goudy text-[22px] font-bold text-[#1F1F1F]">Your Document</h2>
            <p className="mt-4 text-xs text-[#8E8E93] leading-relaxed">
              Please review and sign the documents below, click &quot;Start Signing&quot; to begin.
            </p>

            <div className="mt-8 space-y-3">
              {subscriptionDocs.length > 0 ? (
                subscriptionDocs.map((doc) => {
                  const isSelected = selectedSubDoc?.name === doc.name;
                  return (
                    <button
                      key={doc.name}
                      type="button"
                      onClick={() => { setSelectedSubDoc(doc); setSelectedPage(1); }}
                      className={`flex w-full items-center gap-4 rounded-xl border px-5 py-4 text-left transition-all ${isSelected
                        ? 'border-[#FBCB4B] bg-white shadow-md ring-1 ring-[#FBCB4B]'
                        : 'border-[#E5E5EA] bg-white hover:border-gray-300 hover:shadow-sm'
                        }`}
                    >
                      <div className="relative flex h-10 w-10 items-center justify-center rounded-lg bg-[#FFF5F5]">
                        <div className="absolute inset-0 rounded-lg bg-[rgba(255,82,82,0.1)]" />
                        <FileText className="h-6 w-6 text-[#FF5252]" />
                      </div>
                      <span className="flex-1 font-semibold text-[#1F1F1F] text-sm truncate">
                        {doc.name.replace(/\.[^/.]+$/, "").split('_').map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                      </span>
                    </button>
                  );
                })
              ) : (
                <div className="py-12 text-center border-2 border-dashed border-gray-100 rounded-2xl bg-gray-50">
                  <p className="text-xs text-gray-400 font-medium">No documents found in folder</p>
                </div>
              )}
            </div>

            <div className="mt-10 space-y-3">
              <button
                type="button"
                onClick={goNext}
                disabled={isSigning}
                className="w-full rounded-full bg-[#FFF3D6] py-3.5 text-sm font-bold text-[#C28C3B] hover:bg-[#FFE7AF] shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSigning ? 'Connecting to DocuSign...' : 'Start Signing'}
              </button>
              <button
                type="button"
                onClick={handleDownload}
                className="w-full rounded-full bg-white py-3.5 text-sm font-bold text-[#1F1F1F] ring-1 ring-[#E5E5EA] hover:bg-[#F9FAFB] shadow-sm transition-all"
              >
                Download Document (PDF)
              </button>
            </div>
          </div>
        </div>
      </div>

      {renderFooter()}
    </>
  );

  const renderFundingInstructions = () => (
    <>
      <div className="mb-6">
        <h1 className="font-goudy text-[30px] font-bold leading-[38px] text-[#1F1F1F]">
          Funding Instructions
        </h1>
        <p className="mt-2 text-sm text-[#8E8E93]">
          Send funds via wire/ACH to complete your investment.
        </p>
      </div>

      <div className="rounded-2xl bg-white px-8 py-6 shadow-sm text-sm text-[#4B4B4B]">
        <p>
          The PhysicianBTC Fund provides exposure to institutional-grade Bitcoin strategies designed
          specifically for physicians and medical professionals.
        </p>
        <ul className="mt-4 list-disc pl-6">
          <li>Long-term BTC exposure</li>
          <li>Optimized for tax-advantaged accounts</li>
          <li>Low operational friction</li>
        </ul>
        <p className="mt-4 font-semibold">Fees:</p>
        <ul className="mt-1 list-disc pl-6">
          <li>Management Fee: 2%</li>
          <li>Performance Fee: 20%</li>
        </ul>
        <p className="mt-4 font-semibold">Documents:</p>
        <ul className="mt-1 list-disc pl-6">
          <li>PPM Download</li>
          <li>Fact Sheet</li>
          <li>Risk Disclosure</li>
        </ul>
      </div>

      {renderFooter()}
    </>
  );

  const renderInvestmentStatus = () => (
    <>
      <div className="mb-6">
        <h1 className="font-goudy text-[30px] font-bold leading-[38px] text-[#1F1F1F]">
          Investment Status
        </h1>
        <p className="mt-2 text-sm text-[#8E8E93]">Track your investment through each stage.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="rounded-2xl bg-white px-8 py-6 shadow-sm">
          <div className="relative">
            <div className="absolute left-3 top-4 bottom-4 w-px bg-[#E5E5EA]" />
            <div className="space-y-4">
              {[
                {
                  title: 'Subscription Submitted',
                  subtitle: currentInvestment?.created_at
                    ? `Completed on ${new Date(currentInvestment.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
                    : 'Completed',
                  state: 'done',
                },
                {
                  title: 'Document Signed',
                  subtitle: currentInvestment?.document_signed && currentInvestment?.signed_at
                    ? `Completed on ${new Date(currentInvestment.signed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
                    : (currentInvestment?.document_signed ? 'Completed' : 'Awaiting signature'),
                  state: currentInvestment?.document_signed ? 'done' : 'active',
                },
                {
                  title: 'Awaiting Funding',
                  subtitle: currentInvestment?.awaiting_funding_at
                    ? `Completed on ${new Date(currentInvestment.awaiting_funding_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
                    : (currentInvestment?.document_signed ? 'Action required: please provide funding to proceed.' : 'Pending'),
                  state: currentInvestment?.awaiting_funding ? 'done' : (currentInvestment?.document_signed ? 'active' : 'pending'),
                },
                {
                  title: 'Funds Received',
                  subtitle: currentInvestment?.funds_received_at
                    ? `Completed on ${new Date(currentInvestment.funds_received_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
                    : 'Pending',
                  state: currentInvestment?.funds_received ? 'done' : (currentInvestment?.awaiting_funding ? 'active' : 'pending'),
                },
                {
                  title: 'Units Issued',
                  subtitle: currentInvestment?.units_issued_at
                    ? `Completed on ${new Date(currentInvestment.units_issued_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
                    : 'Pending',
                  state: currentInvestment?.units_issued ? 'done' : (currentInvestment?.funds_received ? 'active' : 'pending'),
                },
              ].map((item) => {
                const isDone = item.state === 'done';
                const isActive = item.state === 'active';
                return (
                  <div key={item.title} className="flex items-start gap-4">
                    <div className={`mt-1 flex h-4 w-4 items-center justify-center rounded-full border ${isDone ? 'border-[#2BB673] bg-[#2BB673]' :
                      isActive ? 'border-[#FBCB4B] bg-[#FFF3D6]' :
                        'border-[#E5E5EA] bg-white'
                      }`}>
                      {isDone && (
                        <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                      )}
                      {isActive && <span className="h-2 w-2 rounded-full bg-[#FBCB4B]" />}
                    </div>
                    <div>
                      <p className={`text-sm font-medium ${isDone ? 'text-[#1F1F1F]' : isActive ? 'text-[#1F1F1F]' : 'text-[#8E8E93]'}`}>
                        {item.title}
                      </p>
                      <p className="mt-1 text-xs text-[#8E8E93]">{item.subtitle}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-[#E5E5EA] bg-white px-8 py-6 shadow-sm">
          <div className="pb-3 border-b border-[#E5E5EA]">
            <h2 className="font-goudy text-base text-[#1F1F1F]">Quick Actions</h2>
          </div>
          <div className="pt-4 space-y-3">
            <button
              type="button"
              onClick={() => {
                if (!lastEnvelopeId) {
                  alert('No signed document found. Please complete signing first.');
                  return;
                }
                const dsAccessToken = localStorage.getItem('ds_access_token');
                const dsAccountId = localStorage.getItem('ds_account_id');
                if (!dsAccessToken || !dsAccountId) {
                  alert('DocuSign session expired. Please re-authorize.');
                  return;
                }

                (async () => {
                  try {
                    const blob = await apiClient.getDocuSignDocument(
                      lastEnvelopeId,
                      dsAccessToken,
                      dsAccountId
                    );
                    const url = window.URL.createObjectURL(blob);
                    window.open(url, '_blank');
                  } catch (error: any) {
                    alert('Failed to fetch document: ' + error.message);
                  }
                })();
              }}
              className="w-full rounded-full bg-[#FFF3D6] py-2 text-sm font-medium text-[#1F1F1F] hover:bg-[#FFE7AF]"
            >
              View Document
            </button>
            <button
              type="button"
              className="w-full rounded-full bg-[#FFF3D6] py-2 text-sm font-medium text-[#1F1F1F] hover:bg-[#FFE7AF]"
            >
              Contact Support
            </button>
          </div>
        </div>
      </div>

      {renderFooter({ primaryLabel: 'Done' })}
    </>
  );

  let content: JSX.Element;

  switch (step) {
    case 'chooseFund':
      content = renderChooseFund();
      break;
    case 'fundingAccount':
      content = renderFundingAccount();
      break;
    case 'investmentAmount':
      content = renderInvestmentAmount();
      break;
    case 'signDocuments':
      content = renderSignDocuments();
      break;
    case 'fundingInstructions':
      content = renderFundingInstructions();
      break;
    case 'investmentStatus':
      content = renderInvestmentStatus();
      break;
    default:
      content = renderChooseFund();
  }

  if (showSuccess) {
    return (
      <DashboardLayout>
        <SuccessView onDone={() => router.push('/dashboard')} />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-4 font-helvetica text-[#1F1F1F]">{content}</div>
    </DashboardLayout>
  );
}

function SuccessView({ onDone }: { onDone: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in zoom-in duration-500">
      <div className="mb-8 flex h-24 w-24 items-center justify-center rounded-full bg-[#E8F8F0]">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#2BB673]">
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </div>
      </div>
      <h2 className="font-goudy text-4xl font-bold text-[#1F1F1F] mb-4">Investment Submitted!</h2>
      <p className="text-lg text-[#8E8E93] max-w-md mb-12">
        Your subscription for the fund has been successfully submitted. Our team will review your
        documents and you will receive an email once the units are issued.
      </p>
      <button
        onClick={onDone}
        className="rounded-full bg-[#FBCB4B] px-12 py-4 text-base font-bold text-[#1F1F1F] hover:bg-[#F9B800] shadow-md transition-all active:scale-95"
      >
        Go to Dashboard
      </button>
    </div>
  );
}
