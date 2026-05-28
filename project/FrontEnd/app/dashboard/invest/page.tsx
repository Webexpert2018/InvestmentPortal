'use client';

import { useMemo, useState, useEffect } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { DashboardLayout } from '@/components/DashboardLayout';
import { apiClient, BASE_URL } from '@/lib/api/client';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
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
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [step, setStep] = useState<Step>('fundingAccount');
  const [funds, setFunds] = useState<any[]>([]);
  const [existingFlows, setExistingFlows] = useState<any[]>([]);
  const [selectedFundId, setSelectedFundId] = useState<string | null>(null);
  const [toggledFundId, setToggledFundId] = useState<string | null>(null);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>('personal');
  const [amount, setAmount] = useState<string>('25000');
  const [unitPrice, setUnitPrice] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isSigning, setIsSigning] = useState(false);
  const [userIraAccounts, setUserIraAccounts] = useState<any[]>([]);
  const [subscriptionDocs, setSubscriptionDocs] = useState<any[]>([]);
  const [selectedSubDoc, setSelectedSubDoc] = useState<any | null>(null);
  const [selectedPage, setSelectedPage] = useState<number>(1);
  const [zoom, setZoom] = useState<number>(100);
  const [lastEnvelopeId, setLastEnvelopeId] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [currentInvestment, setCurrentInvestment] = useState<any>(null);
  const [justFinishedSigning, setJustFinishedSigning] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setToken(localStorage.getItem('token'));
    }
  }, []);

  // Check for DocuSign completion and handle fresh start
  useEffect(() => {
    const signingStatus = searchParams?.get('signing');
    const eventStatus = searchParams?.get('event');

    if (signingStatus !== 'complete' && eventStatus !== 'signing_complete') {
      // Fresh start: clear old investment tracking
      localStorage.removeItem('last_investment_id');
      localStorage.removeItem('draft_investment');
      setCurrentInvestment(null);
    }

    const savedEnvelopeId = localStorage.getItem('last_envelope_id');
    if (savedEnvelopeId) {
      setLastEnvelopeId(savedEnvelopeId);
    }

    const urlStep = searchParams?.get('step');
    if (urlStep) {
      const validSteps: Step[] = ['chooseFund', 'fundingAccount', 'investmentAmount', 'signDocuments', 'fundingInstructions', 'investmentStatus'];
      if (validSteps.includes(urlStep as Step)) {
        setStep(urlStep as Step);
      }
    }
  }, [searchParams]);

  useEffect(() => {
    const signingStatus = searchParams?.get('signing');
    const eventStatus = searchParams?.get('event');

    if (signingStatus === 'complete' || eventStatus === 'signing_complete') {
      setJustFinishedSigning(true);
      setIsFinalizing(true);

      // Restore state from localStorage
      const draftJson = localStorage.getItem('draft_investment');
      if (!draftJson) return;

      // Remove immediately to prevent duplicate triggers (e.g. React StrictMode)
      localStorage.removeItem('draft_investment');

      let draftAmount = amount;
      let draftUnitPrice = unitPrice;
      let draftSelectedFundId = selectedFundId;
      let draftAccountId = selectedAccountId;
      let draftAccountType = 'personal';

      if (draftJson) {
        try {
          const draft = JSON.parse(draftJson);
          if (draft.fundId) {
            setSelectedFundId(draft.fundId);
            draftSelectedFundId = draft.fundId;
          }
          if (draft.accountId) {
            setSelectedAccountId(draft.accountId);
            draftAccountId = draft.accountId;
          }
          if (draft.amount) {
            setAmount(String(draft.amount));
            draftAmount = String(draft.amount);
          }
          if (draft.unitPrice) {
            setUnitPrice(draft.unitPrice);
            draftUnitPrice = draft.unitPrice;
          }
          if (draft.accountType) {
            draftAccountType = draft.accountType;
          }
        } catch (e) {
          console.error('Failed to parse draft investment:', e);
        }
      }

      // SUBMIT INVESTMENT IMMEDIATELY
      const submitInvestment = async () => {
        try {
          const cleanAmount = draftAmount.replace(/[^-0-9.]/g, '');
          const numericAmount = Number.parseFloat(cleanAmount) || 0;

          const savedEnvelopeId = localStorage.getItem('last_envelope_id');

          const investment = await apiClient.createInvestment({
            fundId: draftSelectedFundId!,
            accountId: draftAccountId !== 'personal' ? (draftAccountId ?? undefined) : undefined,
            accountType: draftAccountType,
            investmentAmount: numericAmount,
            unitPrice: draftUnitPrice,
            status: 'Subscription Submitted',
            documentSigned: true,
            envelopeId: savedEnvelopeId || undefined
          });


          if (investment && investment.id) {
            localStorage.setItem('last_investment_id', investment.id);
            setCurrentInvestment(investment);

            const savedEnvelopeId = localStorage.getItem('last_envelope_id');
            if (savedEnvelopeId) {
              const dsAccessToken = localStorage.getItem('ds_access_token') || '';
              const dsAccountId = localStorage.getItem('ds_account_id') || '';
              apiClient.getDocuSignDocument(savedEnvelopeId, dsAccessToken, dsAccountId)
                .catch(err => console.warn('Auto-vault sync handled silently:', err));
            }
          }

          // Go to Funding Instructions screen!
          setStep('fundingInstructions');
          setIsFinalizing(false);
        } catch (error) {
          console.error('Failed to submit investment on signing complete:', error);
          setIsFinalizing(false);
        }
      };
      submitInvestment();

      // Clean up URL parameters
      const current = new URLSearchParams(Array.from(searchParams?.entries() || []));
      current.delete('signing');
      current.delete('event');
      router.replace(pathname + '?' + current.toString());
    }
  }, [searchParams, pathname, router]);

  const selectedFund = useMemo(() => {
    return funds.find(f => f.id === selectedFundId);
  }, [funds, selectedFundId]);

  useEffect(() => {
    if (selectedFund) {
      if (selectedFund.subscriptionDocPath) {
        const docs = [
          {
            name: selectedFund.subscriptionDocPath,
            pages: 1,
            lastModified: `Uploaded ${new Date(selectedFund.updatedAt || selectedFund.createdAt || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`,
            size: 'Custom PDF',
            isCustom: true
          }
        ];
        setSubscriptionDocs(docs);
        setSelectedSubDoc(docs[0]);
      } else {
        const docs = [
          { name: 'OA-BWell-Fund.pdf', pages: 26, lastModified: 'Oct 12, 2025', size: '384 KB', isCustom: false },
          { name: 'SA-BWell-Fund.pdf', pages: 12, lastModified: 'Oct 12, 2025', size: '138 KB', isCustom: false }
        ];
        setSubscriptionDocs(docs);
        setSelectedSubDoc(docs[0]);
      }
    }
  }, [selectedFund]);

  const dynamicAccounts = useMemo(() => {
    const list: any[] = [
      {
        id: 'personal',
        label: 'Personal Account',
        value: 'Cash / Checking',
        status: 'active'
      },
    ];

    userIraAccounts.forEach((acc, index) => {
      const isSuspended = acc.status?.toLowerCase() === 'suspended';
      list.push({
        id: acc.id || `ira-${index}`,
        label: `${acc.account_type || 'IRA'} Account`,
        value: isSuspended ? 'Suspended' : 'IRA',
        status: acc.status || 'active'
      });
    });

    return list;
  }, [userIraAccounts]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [fundsData, flowsData, iraData, navData] = await Promise.all([
          apiClient.getFunds(),
          apiClient.getMyFundFlows(),
          apiClient.getMyIRAAccount().catch(() => null),
          apiClient.getNavSummary().catch(() => null),
        ]);
        const activeFunds = Array.isArray(fundsData)
          ? fundsData.filter((fund: any) => fund.status?.toLowerCase() !== 'draft' && fund.status?.toLowerCase() !== 'closed')
          : [];
        setFunds(activeFunds);
        setExistingFlows(flowsData);
        setUserIraAccounts(Array.isArray(iraData) ? iraData : (iraData ? [iraData] : []));

        if (navData && typeof navData.currentNav === 'number') {
          setUnitPrice(navData.currentNav);
        }

        if (activeFunds.length > 0 && !selectedFundId) {
          setSelectedFundId(activeFunds[0].id);
        }
        if (activeFunds.length > 0 && !toggledFundId) {
          setToggledFundId(activeFunds[0].id);
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

  const { investmentAmount, processingFee, total, estimatedUnits } = useMemo(() => {
    const cleanAmount = amount.replace(/[^-0-9.]/g, '');
    const numeric = Number.parseFloat(cleanAmount) || 0;
    const fee = 0;
    const units = unitPrice > 0 ? numeric / unitPrice : 0;
    return {
      investmentAmount: numeric,
      processingFee: fee,
      total: numeric,
      estimatedUnits: units,
    };
  }, [amount, unitPrice]);

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
    setStep((current: Step) => {
      switch (current) {
        case 'fundingAccount':
          return current;
        case 'chooseFund':
          return 'fundingAccount';
        case 'investmentAmount':
          return 'chooseFund';
        case 'signDocuments':
          return 'investmentAmount';
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

    setIsSigning(true);
    try {
      const isIra = selectedAccountId !== 'personal';
      const selectedIra = userIraAccounts.find(a => a.id === selectedAccountId);
      const finalAccountType = isIra ? (selectedIra?.account_type || 'ira') : 'personal';

      // Save draft investment details to localStorage before leaving the page
      const draftInvestment = {
        fundId: selectedFundId,
        accountId: isIra ? (selectedAccountId ?? undefined) : undefined,
        accountType: finalAccountType,
        amount: amount,
        unitPrice: unitPrice,
      };
      localStorage.setItem('draft_investment', JSON.stringify(draftInvestment));
      localStorage.removeItem('last_investment_id');

      // Proceed to DocuSign
      const response = await apiClient.createDocuSignEnvelope({
        fundId: selectedFundId,
        fundName: selectedFund.name,
        investmentAmount: investmentAmount,
        accountType: finalAccountType,
        iraMetadata: isIra ? {
          custodian: selectedIra?.custodian_name,
          type: selectedIra?.account_type
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
    } catch (error: any) {
      console.error('DocuSign Flow Error:', error);

      if (error.status === 401 || error.message?.includes('401') || (error.details?.errorCode === 'USER_AUTHENTICATION_FAILED')) {
        toast({
          title: "Session Expired",
          description: "Your DocuSign authorization has expired. Reconnecting...",
          variant: "destructive"
        });
        window.location.href = `${BASE_URL}/api/docusign/auth`;
        return;
      }

      if (error.details) {
        console.error('DocuSign Error Details:', error.details);
      }
      const msg = error.message || String(error);
      toast({
        title: "Error",
        description: `Error: ${msg}. Please check your authorization or connection.`,
        variant: "destructive"
      });
    } finally {
      setIsSigning(false);
    }
  };
  //////////////////////////////////
  const handleBypass = async () => {
    if (!selectedFundId || !selectedFund) return;
    setIsSigning(true);
    try {
      // Optimistically update local state
      setCurrentInvestment({
        document_signed: true,
        created_at: new Date().toISOString(),
        signed_at: new Date().toISOString()
      });
      localStorage.removeItem('last_investment_id');
      setStep('fundingInstructions');
    } catch (error) {
      console.error('Bypass error:', error);
      toast({
        title: "Bypass Failed",
        description: 'Failed to bypass DocuSign: ' + (error instanceof Error ? error.message : String(error)),
        variant: "destructive"
      });
    } finally {
      setIsSigning(false);
    }
  };
  //////////////////////////////////////////////////


  const handleDownload = () => {
    if (!selectedSubDoc) return;
    const link = document.createElement('a');
    link.href = selectedSubDoc.isCustom
      ? (selectedSubDoc.name.startsWith('http') ? `${BASE_URL}/api/documents/subscription/preview/custom?url=${encodeURIComponent(selectedSubDoc.name)}&token=${token || ''}` : `${BASE_URL}/api/documents/subscription/preview/${selectedSubDoc.name}?token=${token || ''}`)
      : `/documents/subscription/${selectedSubDoc.name}`;
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
      localStorage.removeItem('draft_investment');
      setShowSuccess(true);
      setAmount('25000');
      setSelectedAccountId('personal');
      return;
    }


    setStep((current: Step) => {
      switch (current) {
        case 'fundingAccount':
          return 'chooseFund';
        case 'chooseFund':
          return 'investmentAmount';
        case 'investmentAmount':
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
      <div className="mt-16 flex items-center sm:justify-end justify-center border-t border-[#E5E5EA] pt-8">
        {/* <button
          type="button"
          onClick={() => setStep('chooseFund')}
          className="rounded-full bg-[#FFF3D6] px-10 py-3 text-sm font-semibold text-[#4B4B4B] hover:bg-[#FFE7AF] transition-all"
        >
          Cancel
        </button> */}
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

      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="font-goudy text-sm sm:text-xl font-bold leading-[32px] text-[#1F1F1F]">
            Choose a Fund
          </h1>
          <p className="mt-2 text-sm text-[#8E8E93]">
            Select the fund you would like to invest in.
            You will complete your investment steps on text next screens.
          </p>
        </div>

        <div className="hidden md:flex items-center gap-4 text-xs">
          <div className="bg-[#FAFAFA] border border-[#E5E5EA] rounded-full px-5 py-2.5 shadow-sm flex items-center gap-3">
            <div className={`h-2.5 w-2.5 rounded-full ${user?.assignedIrName ? 'bg-[#2BB673]' : 'bg-[#8E8E93]'}`}></div>
            <div>
              <p className="text-[10px] text-[#8E8E93] uppercase font-bold tracking-wider">Investor Relation</p>
              <p className="text-[13px] font-bold text-[#1F1F1F]">{user?.assignedIrName || 'Unassigned'}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-white px-6 py-6 shadow-sm">
        <div className="mb-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={goBack}
            className="rounded-full bg-[#FFF3D6] px-5 py-2 text-sm font-medium text-[#4B4B4B] hover:bg-[#FFE7AF]"
          >
            Back
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

        <div className="grid gap-6 md:grid-cols-2">
          {funds.map((fund) => {
            const selected = fund.id === selectedFundId;
            return (
              <div
                key={fund.id}
                onClick={() => setSelectedFundId(fund.id)}
                className={`flex w-full items-start rounded-xl bg-[#F7F8FA] px-6 py-6 text-left transition hover:bg-[#F1F2F5] cursor-pointer ${selected ? 'ring-2 ring-[#274583] ring-offset-2 ring-offset-white' : 'border border-transparent hover:border-gray-200'
                  }`}
              >
                <img
                  src={getFullImageUrl(fund.image)}
                  alt={fund.name}
                  className="mr-6 h-24 w-40 rounded-lg object-cover flex-shrink-0"
                />
                <div className="flex-grow min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <h3 className="font-goudy text-sm sm:text-xl font-bold leading-tight text-[#1F1F1F] truncate">
                      {fund.name}
                    </h3>
                    
                    {/* Toggle Switch */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setToggledFundId(toggledFundId === fund.id ? null : fund.id);
                      }}
                      className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        toggledFundId === fund.id ? 'bg-[#274583]' : 'bg-[#E5E5EA]'
                      }`}
                      title={toggledFundId === fund.id ? "Hide details" : "Show details"}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          toggledFundId === fund.id ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

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
                    <p className="mt-1.5 text-[10px] text-gray-400 line-clamp-1 italic">
                      {fund.note}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Dynamic Toggled Fund Details Section */}
        {(() => {
          const toggledFund = funds.find(f => f.id === toggledFundId);
          if (!toggledFund) return null;
          return (
            <div className="mt-8 border-t border-[#E5E5EA] pt-8 animate-fadeIn">
              <div className="flex items-center gap-2 mb-6">
                <div className="h-5 w-1 bg-[#274583] rounded-full"></div>
                <h3 className="font-goudy text-lg sm:text-xl font-bold text-[#1F1F1F]">
                  Fund Information: {toggledFund.name}
                </h3>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Image and Start Date */}
                <div className="space-y-4">
                  <img
                    src={getFullImageUrl(toggledFund.image)}
                    alt={toggledFund.name}
                    className="w-full h-48 rounded-xl object-cover shadow-sm border border-[#E5E5EA]"
                  />
                  <div className="bg-[#F7F8FA] p-4 rounded-xl border border-[#E5E5EA]">
                    <p className="text-[10px] text-[#8E8E93] font-bold uppercase tracking-wider">Start Date</p>
                    <p className="text-sm font-bold text-[#1F1F1F] mt-1">
                      {toggledFund.startDate ? new Date(toggledFund.startDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'N/A'}
                    </p>
                  </div>
                </div>

                {/* Middle & Right Column: Description & Wire Instructions */}
                <div className="lg:col-span-2 space-y-6">
                  <div>
                    <p className="text-[10px] text-[#8E8E93] font-bold uppercase tracking-wider mb-2">Description</p>
                    <p className="text-sm text-[#4B4B4B] leading-relaxed whitespace-pre-line bg-[#F7F8FA] p-4 rounded-xl border border-[#E5E5EA]">
                      {toggledFund.description || 'Secure institutional-grade Bitcoin strategies.'}
                    </p>
                  </div>

                  {/* Wire Instructions Details */}
                  <div>
                    <p className="text-[10px] text-[#8E8E93] font-bold uppercase tracking-wider mb-3">Custodian Wire Instructions</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 bg-[#F7F8FA] p-5 rounded-xl border border-[#E5E5EA]">
                      <div>
                        <p className="text-[10px] text-[#8E8E93] font-bold uppercase tracking-wider">Bank Name</p>
                        <p className="text-xs font-bold text-[#1F1F1F] mt-1">{toggledFund.bankName || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-[#8E8E93] font-bold uppercase tracking-wider">Account Number</p>
                        <p className="text-xs font-bold text-[#1F1F1F] mt-1 tracking-wider">{toggledFund.accountNumber || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-[#8E8E93] font-bold uppercase tracking-wider">Routing Number (ABA)</p>
                        <p className="text-xs font-bold text-[#1F1F1F] mt-1">{toggledFund.routingNumber || 'N/A'}</p>
                      </div>
                      <div className="sm:col-span-2 md:col-span-3 border-t border-[#E5E5EA] pt-4 mt-2">
                        <p className="text-[10px] text-[#8E8E93] font-bold uppercase tracking-wider">Beneficiary Name</p>
                        <p className="text-xs font-bold text-[#1F1F1F] mt-1">{toggledFund.beneficiaryName || 'N/A'}</p>
                      </div>
                      {toggledFund.bankAddress && (
                        <div className="sm:col-span-2 md:col-span-3 border-t border-[#E5E5EA] pt-4">
                          <p className="text-[10px] text-[#8E8E93] font-bold uppercase tracking-wider">Custodian Address</p>
                          <p className="text-xs font-bold text-[#1F1F1F] mt-1 leading-relaxed whitespace-pre-line">{toggledFund.bankAddress}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    </>
  );

  const renderFundingAccount = () => (
    <>
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="font-goudy text-[20px] md:text-[30px] font-bold leading-[38px] text-[#1F1F1F]">
            Select Funding Account
          </h1>
          <p className="mt-2 text-sm text-[#8E8E93]">
            Choose the account you want to invest from.
          </p>
        </div>

        <div className="hidden md:flex items-center gap-4 text-xs">
          <div className="bg-[#FAFAFA] border border-[#E5E5EA] rounded-full px-5 py-2.5 shadow-sm flex items-center gap-3">
            <div className={`h-2.5 w-2.5 rounded-full ${user?.assignedIrName ? 'bg-[#2BB673]' : 'bg-[#8E8E93]'}`}></div>
            <div>
              <p className="text-[10px] text-[#8E8E93] uppercase font-bold tracking-wider">Investor Relation</p>
              <p className="text-[13px] font-bold text-[#1F1F1F]">{user?.assignedIrName || 'Unassigned'}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3 px-2">
        {dynamicAccounts.map((account: any) => {
          const selected = account.id === selectedAccountId;
          const isSuspended = account.status?.toLowerCase() === 'suspended';
          return (
            <button
              key={account.id}
              type="button"
              disabled={isSuspended}
              onClick={() => setSelectedAccountId(account.id)}
              className={`flex w-full flex-col items-start rounded-2xl px-6 py-5 text-left transition ${selected
                ? 'bg-white shadow-md ring-2 ring-[#274583] ring-offset-2'
                : isSuspended 
                  ? 'bg-gray-50 opacity-60 cursor-not-allowed border-red-100' 
                  : 'bg-white shadow-sm hover:shadow-md border border-[#E5E5EA]'
                }`}
            >
              <div className="flex w-full items-center justify-between mb-1">
                <p className={`text-sm font-bold ${isSuspended ? 'text-gray-400' : 'text-[#1F1F1F]'}`}>{account.label}</p>
                <div
                  className={`flex h-5 w-5 items-center justify-center rounded-full border ${selected ? 'border-[#274583] bg-[#274583]' : 'border-[#D4D4D4]'
                    } ${isSuspended ? 'opacity-0' : ''}`}
                >
                  {selected && <div className="h-2 w-2 rounded-full bg-white" />}
                </div>
              </div>
              <p className={`text-xs font-bold uppercase tracking-wider ${isSuspended ? 'text-red-500' : 'text-[#8E8E93]'}`}>
                {isSuspended ? 'Suspended' : account.value}
              </p>
            </button>
          );
        })}
      </div>

      {renderFooter({ showBack: false })}
    </>
  );

  const renderInvestmentAmount = () => (
    <>
      <div className="mb-8 flex items-center justify-between gap-4">
        <div>
          <h1 className="font-goudy text-xl sm:text-[28px] font-bold leading-[38px] text-[#1F1F1F]">
            Investment Amount
          </h1>
          <p className="mt-1 text-sm text-[#8E8E93]">Specify how much you&apos;d like to invest.</p>
        </div>

        <div className="hidden md:flex items-center gap-4 text-xs">
          <div className="bg-[#FAFAFA] border border-[#E5E5EA] rounded-full px-5 py-2.5 shadow-sm flex items-center gap-3">
            <div className={`h-2.5 w-2.5 rounded-full ${user?.assignedIrName ? 'bg-[#2BB673]' : 'bg-[#8E8E93]'}`}></div>
            <div>
              <p className="text-[10px] text-[#8E8E93] uppercase font-bold tracking-wider">Investor Relation</p>
              <p className="text-[13px] font-bold text-[#1F1F1F]">{user?.assignedIrName || 'Unassigned'}</p>
            </div>
          </div>
        </div>
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
                <p className="text-xl font-bold text-[#1F1F1F]">${unitPrice.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-[#8E8E93] mb-1">Estimated Units</p>
                <p className="text-xl font-bold text-[#1F1F1F]">
                  {estimatedUnits.toLocaleString(undefined, { maximumFractionDigits: 0 })} units
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-white px-8 py-8 shadow-sm border border-gray-100 h-fit">
          <h2 className="font-goudy text-lg font-bold text-[#1F1F1F] mb-6">Order Summary</h2>
          <div className="space-y-4 text-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <span className="text-[#8E8E93]">Investment Amount</span>
              <span className="font-bold text-[#1F1F1F]">
                $
                {investmentAmount.toLocaleString('en-US', {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                })}
              </span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <span className="text-[#8E8E93]">Estimated Units</span>
              <span className="font-bold text-[#1F1F1F]">
                {estimatedUnits.toLocaleString('en-US', {
                  minimumFractionDigits: 4,
                  maximumFractionDigits: 4,
                })}
              </span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <span className="text-[#8E8E93]">Processing Fee (0%)</span>
              <span className="font-bold text-[#1F1F1F]">
                $
                {processingFee.toLocaleString('en-US', {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                })}
              </span>
            </div>
            <div className="pt-6 mt-6 border-t border-dashed border-[#E5E5EA]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
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
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="font-goudy text-[20px] md:text-[30px] font-bold leading-[38px] text-[#1F1F1F]">
            Sign Subscription Documents
          </h1>
          <p className="mt-1 text-sm text-[#8E8E93]">
            Review and e-sign required documents.
          </p>
        </div>

        <div className="hidden md:flex items-center gap-4 text-xs">
          <div className="bg-[#FAFAFA] border border-[#E5E5EA] rounded-full px-5 py-2.5 shadow-sm flex items-center gap-3">
            <div className={`h-2.5 w-2.5 rounded-full ${user?.assignedIrName ? 'bg-[#2BB673]' : 'bg-[#8E8E93]'}`}></div>
            <div>
              <p className="text-[10px] text-[#8E8E93] uppercase font-bold tracking-wider">Investor Relation</p>
              <p className="text-[13px] font-bold text-[#1F1F1F]">{user?.assignedIrName || 'Unassigned'}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        {/* Left Preview Section */}
        <div className="rounded-[8px] bg-white p-0 sm:p-4 shadow-sm border border-[#E5E5EA] w-full max-w-full overflow-hidden">
          <div className="flex flex-col min-h-[750px] lg:min-h-[900px] rounded-[6px] border border-[#E9EBEE] bg-[#F8F9FB] overflow-hidden transition-all w-full max-w-full">
            {/* Toolbar */}
            <div className="flex h-[44px] items-center justify-between border-b border-[#E2E5EA] bg-white px-2 sm:px-4">
              <div className="flex items-center gap-2 sm:gap-3 text-[12px] text-[#6B7280] min-w-0">
                <button
                  onClick={() => { setSelectedSubDoc(null); setSelectedPage(1); setStep('investmentAmount'); }}
                  className="inline-flex items-center gap-0.5 sm:gap-1 text-[#5E6B7F] hover:text-[#1F1F1F] transition-colors flex-shrink-0"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span className="hidden sm:inline">Back</span>
                </button>
                <div className="border-l border-gray-200 pl-2 sm:pl-3 min-w-0">
                  <p className="font-medium text-[#374151] truncate max-w-[120px] sm:max-w-[200px]">
                    {selectedSubDoc?.name || 'Select a document'}
                  </p>
                  <p className="text-[10px] text-[#9CA3AF] hidden sm:block">
                    Document Vault &gt; Subscription Documents
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 sm:gap-3 text-[#6B7280] flex-shrink-0">
                <button type="button" onClick={handleDownload} title="Download" className="hover:text-[#374151]"><Download className="h-3.5 w-3.5" /></button>
                <button type="button" onClick={handlePrint} title="Print" className="hover:text-[#374151] hidden sm:block"><Printer className="h-3.5 w-3.5" /></button>
                <button type="button" title="Search" className="hover:text-[#374151] hidden sm:block"><Search className="h-3.5 w-3.5" /></button>
                <span className="text-[11px] font-medium hidden xs:inline">{zoom}%</span>
                <button type="button" onClick={() => setZoom((prev: number) => Math.max(50, prev - 10))} className="hover:text-[#374151]"><Minus className="h-3.5 w-3.5" /></button>
                <button type="button" onClick={() => setZoom((prev: number) => Math.min(200, prev + 10))} className="hover:text-[#374151]"><Plus className="h-3.5 w-3.5" /></button>
                <button type="button" className="hover:text-[#374151] hidden xs:block"><Maximize2 className="h-3.5 w-3.5" /></button>
              </div>
            </div>

            <div className="flex flex-col md:grid md:grid-cols-[92px_1fr] flex-1 min-h-0 w-full max-w-full overflow-hidden">
              {/* Dynamic Thumbnail Sidebar */}
              <aside className="w-full max-w-full border-b md:border-b-0 md:border-r border-[#E2E5EA] bg-white p-2 pb-3 flex flex-row md:flex-col gap-2 overflow-x-auto md:overflow-y-auto h-auto md:max-h-[820px] custom-scrollbar shrink-0">
                {selectedSubDoc && Array.from({ length: selectedSubDoc.pages || 1 }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    type="button"
                    onClick={() => setSelectedPage(page)}
                    className={`flex h-[68px] md:h-[80px] w-[75px] md:w-full flex-col items-center justify-center rounded-[4px] border text-[10px] transition-all shrink-0 ${page === selectedPage ? 'border-[#5EA0FF] bg-[#EEF4FF] text-[#4B5563]' : 'border-[#E4E7EC] bg-[#F4F6F9] text-[#6B7280] hover:border-gray-300'
                      }`}
                  >
                    <FileText className="h-4 w-4 mb-1" />
                    <span>Page {page}</span>
                  </button>
                ))}
              </aside>

              {/* Main Content Area */}
              <div className="relative bg-[#ECEDEF] p-0 sm:p-10 flex flex-col items-center overflow-y-auto overflow-x-hidden max-h-[680px] lg:max-h-[820px] custom-scrollbar selection-none w-full min-w-0">
                <div
                  className="w-full bg-white shadow-lg border border-[#D9DDE3] rounded-sm relative overflow-hidden transition-all shrink-0"
                  style={{
                    maxWidth: zoom <= 100 ? 'min(850px, 100%)' : '100%',
                    width: '100%',
                    aspectRatio: '1 / 1.414',
                    minHeight: zoom <= 100 ? 'auto' : `${zoom * 11}px`
                  }}
                >
                  {selectedSubDoc ? (
                    <iframe
                      src={selectedSubDoc?.isCustom
                        ? (selectedSubDoc.name.startsWith('http') ? `${BASE_URL}/api/documents/subscription/preview/custom?url=${encodeURIComponent(selectedSubDoc.name)}&token=${token || ''}#toolbar=0&navpanes=0&scrollbar=0&page=${selectedPage}&view=FitH` : `${BASE_URL}/api/documents/subscription/preview/${selectedSubDoc.name}?token=${token || ''}#toolbar=0&navpanes=0&scrollbar=0&page=${selectedPage}&view=FitH`)
                        : `/documents/subscription/${selectedSubDoc.name}#toolbar=0&navpanes=0&scrollbar=0&page=${selectedPage}&view=FitH`
                      }
                      key={`${selectedSubDoc.name}-${selectedPage}`}
                      className="w-full h-full border-none absolute inset-0 bg-white"
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
            {/*

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
            */}

            <div className="mt-10 space-y-3">
              <button
                type="button"
                onClick={goNext}
                disabled={isSigning}
                className="w-full rounded-full bg-[#FFF3D6] py-3.5 text-sm font-bold text-[#C28C3B] hover:bg-[#FFE7AF] shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSigning ? 'Connecting to DocuSign...' : 'Start Signing'}
              </button>
              {/* //////// Bypass DocuSign hide //////////////// */}
              {/* <button
                type="button"
                onClick={handleBypass}
                disabled={isSigning}
                className="w-full rounded-full bg-red-50 py-3.5 text-sm font-bold text-red-600 hover:bg-neutral-100 shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed border border-red-200"
              >
                {isSigning ? 'Processing...' : 'Bypass DocuSign (Testing)'}
              </button> */}
              {/* ////////// Bypass DocuSign hide ////////////// */}
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
      <div className="mb-8 flex items-center justify-between gap-4 animate-in fade-in zoom-in duration-500">
        <div>
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#E8F8F0]">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#2BB673]">
              <svg
                width="20"
                height="20"
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
          <h1 className="font-goudy text-[20px] md:text-[30px] font-bold leading-[38px] text-[#1F1F1F]">
            Congratulations!
          </h1>
          <p className="mt-2 text-base text-[#8E8E93]">
            Your investment has been submitted. Your investor relations will reach out to you with wire instructions.
          </p>
        </div>

        <div className="hidden md:flex items-center gap-4 text-xs">
          <div className="bg-[#FAFAFA] border border-[#E5E5EA] rounded-full px-5 py-2.5 shadow-sm flex items-center gap-3">
            <div className={`h-2.5 w-2.5 rounded-full ${user?.assignedIrName ? 'bg-[#2BB673]' : 'bg-[#8E8E93]'}`}></div>
            <div>
              <p className="text-[10px] text-[#8E8E93] uppercase font-bold tracking-wider">Investor Relation</p>
              <p className="text-[13px] font-bold text-[#1F1F1F]">{user?.assignedIrName || 'Unassigned'}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="rounded-2xl bg-white px-8 py-6 shadow-sm border border-[#E5E5EA]">
          <h2 className="font-goudy text-lg font-bold text-[#1F1F1F] mb-4">Investment Status</h2>
          <div className="relative">
            <div className="absolute left-2 top-4 bottom-4 w-px bg-[#E5E5EA]" />
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
                  subtitle: (currentInvestment?.document_signed || justFinishedSigning) && currentInvestment?.signed_at
                    ? `Completed on ${new Date(currentInvestment.signed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
                    : (currentInvestment?.document_signed || justFinishedSigning ? 'Completed' : 'Awaiting signature'),
                  state: (currentInvestment?.document_signed || justFinishedSigning) ? 'done' : 'active',
                },
                {
                  title: 'Awaiting Funding',
                  subtitle: currentInvestment?.awaiting_funding_at
                    ? `Completed on ${new Date(currentInvestment.awaiting_funding_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
                    : (currentInvestment?.document_signed || justFinishedSigning ? 'Action required: please provide funding to proceed.' : 'Pending'),
                  state: currentInvestment?.awaiting_funding ? 'done' : ((currentInvestment?.document_signed || justFinishedSigning) ? 'active' : 'pending'),
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
                    <div className={`relative z-10 mt-1 flex h-4 w-4 items-center justify-center rounded-full border ${isDone ? 'border-[#2BB673] bg-[#2BB673]' :
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

        <div className="rounded-2xl border border-[#E5E5EA] bg-white px-8 py-6 shadow-sm h-fit">
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
                const dsAccessToken = localStorage.getItem('ds_access_token') || '';
                const dsAccountId = localStorage.getItem('ds_account_id') || '';

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
              className="w-full rounded-full bg-[#FFF3D6] py-2.5 text-sm font-medium text-[#1F1F1F] hover:bg-[#FFE7AF] transition-all"
            >
              View Document
            </button>
            <button
              type="button"
              onClick={() => router.push('/dashboard/messages')}
              className="w-full rounded-full bg-[#FFF3D6] py-2.5 text-sm font-medium text-[#1F1F1F] hover:bg-[#FFE7AF] transition-all"
            >
              Message
            </button>
            <button
              type="button"
              onClick={() => router.push('/dashboard/document-vault')}
              className="w-full rounded-full bg-[#FFF3D6] py-2.5 text-sm font-medium text-[#1F1F1F] hover:bg-[#FFE7AF] transition-all"
            >
              Document Vault
            </button>
          </div>
        </div>
      </div>

      <div className="mt-16 flex items-center sm:justify-end justify-center border-t border-[#E5E5EA] pt-8">
        <button
          type="button"
          onClick={() => {
            localStorage.removeItem('draft_investment');
            setStep('fundingAccount');
          }}
          className="rounded-full bg-[#FBCB4B] px-12 py-3.5 text-sm font-bold text-[#1F1F1F] hover:bg-[#F9B800] shadow-sm transition-all"
        >
          Done
        </button>
      </div>
    </>
  );

  const renderInvestmentStatus = () => (
    <>
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="font-goudy text-[20px] md:text-[30px] font-bold leading-[38px] text-[#1F1F1F]">
            Investment Status
          </h1>
          <p className="mt-2 text-sm text-[#8E8E93]">Track your investment through each stage.</p>
        </div>

        <div className="hidden md:flex items-center gap-4 text-xs">
          <div className="bg-[#FAFAFA] border border-[#E5E5EA] rounded-full px-5 py-2.5 shadow-sm flex items-center gap-3">
            <div className={`h-2.5 w-2.5 rounded-full ${user?.assignedIrName ? 'bg-[#2BB673]' : 'bg-[#8E8E93]'}`}></div>
            <div>
              <p className="text-[10px] text-[#8E8E93] uppercase font-bold tracking-wider">Investor Relation</p>
              <p className="text-[13px] font-bold text-[#1F1F1F]">{user?.assignedIrName || 'Unassigned'}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="rounded-2xl bg-white px-8 py-6 shadow-sm">
          <div className="relative">
            <div className="absolute left-2 top-4 bottom-4 w-px bg-[#E5E5EA]" />
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
                  subtitle: (currentInvestment?.document_signed || justFinishedSigning) && currentInvestment?.signed_at
                    ? `Completed on ${new Date(currentInvestment.signed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
                    : (currentInvestment?.document_signed || justFinishedSigning ? 'Completed' : 'Awaiting signature'),
                  state: (currentInvestment?.document_signed || justFinishedSigning) ? 'done' : 'active',
                },
                {
                  title: 'Awaiting Funding',
                  subtitle: currentInvestment?.awaiting_funding_at
                    ? `Completed on ${new Date(currentInvestment.awaiting_funding_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
                    : (currentInvestment?.document_signed || justFinishedSigning ? 'Action required: please provide funding to proceed.' : 'Pending'),
                  state: currentInvestment?.awaiting_funding ? 'done' : ((currentInvestment?.document_signed || justFinishedSigning) ? 'active' : 'pending'),
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
                    <div className={`relative z-10 mt-1 flex h-4 w-4 items-center justify-center rounded-full border ${isDone ? 'border-[#2BB673] bg-[#2BB673]' :
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
                const dsAccessToken = localStorage.getItem('ds_access_token') || '';
                const dsAccountId = localStorage.getItem('ds_account_id') || '';

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
              onClick={() => router.push('/dashboard/messages')}
              className="w-full rounded-full bg-[#FFF3D6] py-2 text-sm font-medium text-[#1F1F1F] hover:bg-[#FFE7AF]"
            >
              Message
            </button>
            <button
              type="button"
              onClick={() => router.push('/dashboard/schedule-meeting')}
              className="w-full rounded-full bg-[#FFF3D6] py-2 text-sm font-medium text-[#1F1F1F] hover:bg-[#FFE7AF]"
            >
              Schedule Meeting
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

  if (isFinalizing) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[400px] py-20 text-center animate-in fade-in zoom-in duration-500">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2BB673] mb-6"></div>
          <h3 className="font-goudy text-xl font-bold text-[#1F1F1F]">Finalizing Your Investment...</h3>
          <p className="text-sm text-[#8E8E93] mt-2">Please wait while we secure your documents.</p>
        </div>
      </DashboardLayout>
    );
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
      <div className="space-y-4 font-helvetica text-[#1F1F1F] w-full max-w-full overflow-x-hidden">{content}</div>
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
