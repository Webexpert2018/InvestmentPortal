'use client';

import { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Loader2, Send, X } from 'lucide-react';
import { apiClient, BASE_URL } from '@/lib/api/client';
import { useAuth } from '@/lib/contexts/AuthContext';

interface InvestmentChecklistData {
  funds: Array<{
    id: string;
    name: string;
    description?: string;
    unitPrice: number;
    minInvestment: number;
  }>;
  accounts: Array<{
    id: string;
    name: string;
    type: string;
    custodian?: string;
    isIra?: boolean;
    isSub?: boolean;
    isSubIra?: boolean;
    category?: string;
  }>;
  defaultFundId?: string;
  defaultAccountId?: string;
  defaultAmount?: string;
  unitPrice?: number;
  processingFeePercent?: number;
}

function InvestmentChecklistCard({ data }: { data: InvestmentChecklistData }) {
  const [selectedAccountId, setSelectedAccountId] = useState(data.defaultAccountId || 'personal');
  const [selectedFundId, setSelectedFundId] = useState(data.defaultFundId || (data.funds[0]?.id || ''));
  const [amount, setAmount] = useState<string>(data.defaultAmount || '25000');
  const [activeNav, setActiveNav] = useState<number>(data.unitPrice || 100.0);
  const [isSigning, setIsSigning] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    apiClient.getNavSummary().then(nav => {
      if (nav && typeof nav.currentNav === 'number' && nav.currentNav > 0) {
        setActiveNav(nav.currentNav);
      }
    }).catch(() => {});
  }, []);

  const selectedFund = data.funds.find(f => f.id === selectedFundId) || data.funds[0];
  const selectedAccount = data.accounts.find(a => a.id === selectedAccountId) || data.accounts[0];

  const unitPrice = activeNav > 0 ? activeNav : (data.unitPrice || 100.0);
  const cleanAmount = amount.replace(/[^0-9.]/g, '');
  const numericAmount = parseFloat(cleanAmount) || 0;
  const processingFee = 0; // Processing fee is 0
  const totalAmount = numericAmount + processingFee;
  const estimatedUnits = unitPrice > 0 ? numericAmount / unitPrice : 0;

  const handleContinueToSign = async () => {
    if (!selectedFund || numericAmount <= 0) return;
    setIsSigning(true);
    setErrorMessage(null);

    try {
      const isPersonal = selectedAccount.id === 'personal';
      const isSubIra = !!selectedAccount.isSubIra;
      const isIra = !!selectedAccount.isIra && !isSubIra;
      const isSub = !!selectedAccount.isSub && !isSubIra;

      let finalAccountType = 'personal';
      let finalInvestorAccountId: string | undefined = undefined;

      if (isSubIra) {
        finalAccountType = selectedAccount.type || 'ira';
        finalInvestorAccountId = selectedAccount.id;
      } else if (isIra) {
        finalAccountType = selectedAccount.type || 'ira';
        finalInvestorAccountId = selectedAccount.id;
      } else if (isSub) {
        finalAccountType = selectedAccount.type || 'personal';
        finalInvestorAccountId = selectedAccount.id;
      }

      // 1. Prepare draft_investment in localStorage (matching normal invest flow)
      const draftInvestment = {
        fundId: selectedFund.id,
        selectedFundId: selectedFund.id,
        accountId: finalInvestorAccountId,
        selectedAccountId: finalInvestorAccountId,
        accountType: finalAccountType,
        selectedAccountType: finalAccountType,
        amount: cleanAmount || String(numericAmount),
        unitPrice: unitPrice,
      };
      localStorage.setItem('draft_investment', JSON.stringify(draftInvestment));
      localStorage.removeItem('last_investment_id');

      // 2. Request DocuSign envelope
      const response = await apiClient.createDocuSignEnvelope({
        fundId: selectedFund.id,
        fundName: selectedFund.name,
        investmentAmount: cleanAmount || numericAmount,
        accountType: finalAccountType,
        investorAccountId: finalInvestorAccountId,
        customInvestorName: (isSub || isSubIra) ? (
          selectedAccount.name?.startsWith('AET FBO ')
            ? selectedAccount.name
            : `AET FBO ${(selectedAccount.name || '').replace(/^AET\s+FBO\s+/i, '')}`
        ) : undefined,
        iraMetadata: (isIra || isSubIra) ? {
          custodian: selectedAccount.custodian || 'American Estate & Trust',
          type: selectedAccount.type
        } : undefined,
        returnUrl: `${window.location.origin}/dashboard/invest?signing=complete`
      });

      if (response && response.signingUrl) {
        if (response.envelopeId) {
          localStorage.setItem('last_envelope_id', response.envelopeId);
        }
        window.location.href = response.signingUrl;
      } else {
        throw new Error('Failed to retrieve signing URL from DocuSign.');
      }
    } catch (err: any) {
      console.error('Error starting DocuSign signing from Athena:', err);
      if (err.status === 401 || err.message?.includes('401') || (err.details?.errorCode === 'USER_AUTHENTICATION_FAILED')) {
        window.location.href = `${BASE_URL}/api/docusign/auth`;
        return;
      }
      setErrorMessage(err.message || 'Failed to initiate signing. Please try again.');
      setIsSigning(false);
    }
  };

  return (
    <div className="mt-3 p-3.5 rounded-xl bg-[#1C1C1C] border border-gray-700/80 text-gray-200 shadow-md space-y-3">
      <div className="flex items-center justify-between border-b border-gray-800 pb-2">
        <span className="text-[12px] font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#FFC63F]" />
          Investment Review Checklist
        </span>
        <span className="text-[10px] text-gray-400">Step 1 of 2</span>
      </div>

      {/* Account Selection */}
      <div className="space-y-1.5">
        <label className="text-[11px] font-bold uppercase tracking-wide text-gray-400 block">
          1. Select Account
        </label>
        <div className="space-y-1 max-h-36 overflow-y-auto pr-1 athena-scrollbar">
          {data.accounts.map((acc) => (
            <label
              key={acc.id}
              className={`flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg text-xs cursor-pointer border transition-all ${
                selectedAccountId === acc.id
                  ? 'bg-[#FFC63F]/15 border-[#FFC63F] text-white font-semibold'
                  : 'bg-[#242424] border-gray-700/50 text-gray-300 hover:border-gray-600'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <input
                  type="radio"
                  name={`athena_account_${data.defaultFundId}`}
                  value={acc.id}
                  checked={selectedAccountId === acc.id}
                  onChange={() => setSelectedAccountId(acc.id)}
                  className="accent-[#FFC63F] w-3.5 h-3.5 shrink-0"
                />
                <span className="truncate">{acc.name}</span>
              </div>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-800 text-gray-400 font-normal shrink-0">
                {acc.isSubIra ? 'Sub IRA' : acc.isIra ? 'IRA' : acc.isSub ? 'Sub Account' : 'Personal'}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Fund Selection */}
      <div className="space-y-1.5">
        <label className="text-[11px] font-bold uppercase tracking-wide text-gray-400 block">
          2. Select Fund
        </label>
        <div className="space-y-1 max-h-36 overflow-y-auto pr-1 athena-scrollbar">
          {data.funds.map((f) => (
            <label
              key={f.id}
              className={`flex items-center justify-between px-2.5 py-2 rounded-lg text-xs cursor-pointer border transition-all ${
                selectedFundId === f.id
                  ? 'bg-[#FFC63F]/15 border-[#FFC63F] text-white font-semibold'
                  : 'bg-[#242424] border-gray-700/50 text-gray-300 hover:border-gray-600'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <input
                  type="radio"
                  name={`athena_fund_${data.defaultFundId}`}
                  value={f.id}
                  checked={selectedFundId === f.id}
                  onChange={() => setSelectedFundId(f.id)}
                  className="accent-[#FFC63F] w-3.5 h-3.5 shrink-0"
                />
                <span className="truncate font-medium">{f.name}</span>
              </div>
              <span className="text-[10.5px] text-gray-400 shrink-0 ml-2">
                ${unitPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/unit
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Amount Field */}
      <div className="space-y-1.5">
        <label className="text-[11px] font-bold uppercase tracking-wide text-gray-400 block">
          3. Investment Amount
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">$</span>
          <input
            type="text"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="w-full bg-[#141414] border border-gray-700 focus:border-[#FFC63F] rounded-lg pl-7 pr-3 py-2 text-sm text-white font-semibold outline-none transition-colors"
          />
        </div>
      </div>

      {/* Summary Breakdown */}
      <div className="bg-[#141414] rounded-lg p-2.5 border border-gray-800 space-y-1 text-[11.5px]">
        <div className="flex justify-between text-gray-400">
          <span>Active NAV (Unit Price):</span>
          <span className="text-gray-200 font-medium">
            ${unitPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
        <div className="flex justify-between text-gray-400">
          <span>Estimated Units:</span>
          <span className="text-gray-200 font-medium">
            {estimatedUnits.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 4 })} units
          </span>
        </div>
        <div className="flex justify-between text-gray-400">
          <span>Processing Fee (0%):</span>
          <span className="text-gray-200 font-medium">$0.00</span>
        </div>
        <div className="flex justify-between border-t border-gray-800 pt-1 mt-1 font-bold">
          <span className="text-gray-200">Total Investment:</span>
          <span className="text-[#FFC63F]">
            ${totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      {errorMessage && (
        <p className="text-xs text-red-400 bg-red-950/40 p-2 rounded border border-red-800/50">
          {errorMessage}
        </p>
      )}

      {/* Continue to Sign Button */}
      <button
        type="button"
        onClick={handleContinueToSign}
        disabled={isSigning || numericAmount <= 0}
        className="w-full bg-[#FFC63F] hover:bg-[#F1B92E] text-[#1F1F1F] font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer text-xs sm:text-sm mt-1"
      >
        {isSigning ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin text-[#1F1F1F]" />
            <span>Preparing DocuSign...</span>
          </>
        ) : (
          <span>🖊️ Continue to Sign Documents</span>
        )}
      </button>
    </div>
  );
}

const AthenaIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    {/* Professional girl avatar */}
    <circle cx="12" cy="8" r="4" />
    <path d="M8 6.5C8 3.5 9.8 2 12 2s4 1.5 4 4.5" />
    <path d="M8.2 7c-.9 2-1.2 4.5-.7 7.5" />
    <path d="M15.8 7c.9 2 1.2 4.5.7 7.5" />
    <path d="M6 20a6 6 0 0 1 12 0" />
  </svg>
);

interface ChatMessage {
  sender: 'user' | 'agent';
  text: string;
  timestamp: string;
  action?: any;
}

// Cache variables outside the component so they survive unmounts during internal navigation,
// but get wiped automatically when the user performs a hard browser refresh or logs out.
let cachedIsAgentOpen = false;
let cachedAgentMessages: Array<ChatMessage> | null = null;
let cachedUserId: string | null = null;

export function clearAthenaSession() {
  cachedIsAgentOpen = false;
  cachedAgentMessages = null;
  cachedUserId = null;
}

export function AthenaWidget() {
  const { user } = useAuth();
  const currentUserId = user?.id || null;
  const isInvestor = user?.role?.trim().toLowerCase() === 'investor';

  const defaultGreeting = isInvestor
    ? 'Hello! I am Athena, your AI Investment Assistant. Ask me anything about your portfolio, investments, documents, or how to invest!'
    : 'Hello! I am Athena, your Executive Assistant AI Agent. Ask me anything about your portal or database!';

  // Reset cache if the logged-in user changed or logged out
  if (!currentUserId || (cachedUserId && cachedUserId !== currentUserId)) {
    clearAthenaSession();
  }
  cachedUserId = currentUserId;

  const quickPrompts = isInvestor
    ? [
      'My portfolio summary',
      'How do I invest?',
      'My recent investments',
      'How does redemption work?'
    ]
    : [
      'Show interested doctors',
      'Find missing investments',
      'What is the pipeline?'
    ];

  const [isAgentOpen, setIsAgentOpen] = useState(cachedIsAgentOpen);
  const [agentInput, setAgentInput] = useState('');
  const [agentMessages, setAgentMessages] = useState<Array<ChatMessage>>(() => {
    if (cachedAgentMessages && cachedAgentMessages.length > 0) {
      return cachedAgentMessages;
    }
    return [{
      sender: 'agent',
      text: defaultGreeting,
      timestamp: 'Just now'
    }];
  });
  const [isAgentThinking, setIsAgentThinking] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Sync state changes back to the cache variables
  useEffect(() => {
    cachedIsAgentOpen = isAgentOpen;
  }, [isAgentOpen]);

  useEffect(() => {
    cachedAgentMessages = agentMessages;
  }, [agentMessages]);

  // Clear chats on logout or session expiration
  useEffect(() => {
    const handleLogout = () => {
      clearAthenaSession();
      setAgentMessages([{
        sender: 'agent',
        text: defaultGreeting,
        timestamp: 'Just now'
      }]);
      setIsAgentOpen(false);
    };

    window.addEventListener('auth:logout', handleLogout);
    return () => window.removeEventListener('auth:logout', handleLogout);
  }, [defaultGreeting]);

  // When user is null, immediately wipe messages
  useEffect(() => {
    if (!user) {
      clearAthenaSession();
      setAgentMessages([{
        sender: 'agent',
        text: defaultGreeting,
        timestamp: 'Just now'
      }]);
      setIsAgentOpen(false);
    }
  }, [user, defaultGreeting]);

  // Adjust greeting if role changes and there is only 1 message
  useEffect(() => {
    if (agentMessages.length === 1 && agentMessages[0].sender === 'agent') {
      if (agentMessages[0].text !== defaultGreeting) {
        setAgentMessages([{
          sender: 'agent',
          text: defaultGreeting,
          timestamp: 'Just now'
        }]);
      }
    }
  }, [defaultGreeting]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [agentMessages, isAgentThinking]);

  const handleAgentSend = async (queryText: string) => {
    if (!queryText.trim()) return;

    const newMsg = {
      sender: 'user' as const,
      text: queryText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setAgentMessages(prev => [...prev, newMsg]);
    setAgentInput('');
    setIsAgentThinking(true);

    try {
      const res = await apiClient.queryAthena(queryText);
      const responseText = res && res.success ? res.reply : 'Sorry, I failed to get a response from the server.';
      setAgentMessages(prev => [
        ...prev,
        {
          sender: 'agent',
          text: responseText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          action: res?.action
        }
      ]);
    } catch (err: any) {
      console.error('Error querying Athena AI Agent:', err);
      setAgentMessages(prev => [
        ...prev,
        {
          sender: 'agent',
          text: `An error occurred: ${err.message || 'Unknown error'}. Please try again.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsAgentThinking(false);
    }
  };

  return (
    <>
      {/* Collapsed Pill Button in Bottom Right */}
      <button
        onClick={() => setIsAgentOpen(true)}
        className={`fixed right-4 bottom-4 sm:right-6 sm:bottom-6 z-50 bg-[#1F1F1F] hover:bg-[#2D2D2D] text-white py-2.5 px-3.5 sm:px-4 rounded-full shadow-2xl border border-gray-700 flex items-center gap-2 transition-all duration-300 transform group cursor-pointer whitespace-nowrap ${
          isAgentOpen
            ? 'opacity-0 scale-90 pointer-events-none translate-y-4'
            : 'opacity-100 scale-100 pointer-events-auto translate-y-0 hover:scale-105'
        }`}
        title={isInvestor ? "Open Athena Investment Assistant" : "Open Athena AI Agent"}
      >
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#FFC63F] to-[#F1B92E] flex items-center justify-center text-[#1F1F1F] font-bold shadow-md shrink-0">
          <AthenaIcon className="w-4 h-4 text-[#1F1F1F]" />
        </div>
        <div className="flex items-center gap-1.5 text-[13px] leading-none">
          <span className="font-bold text-white flex items-center gap-1.5">
            Athena:
            <span className="w-1.5 h-1.5 rounded-full bg-[#FFC63F] animate-pulse" />
          </span>
          <span className="text-gray-300 font-medium">
            {isInvestor ? 'Investment Assistant' : 'Ask AI Agent'}
          </span>
        </div>
      </button>

      {/* Docked Athena Side Panel with Smooth Slide Transition */}
      <aside
        className={`fixed inset-y-0 right-0 z-40 sm:relative sm:inset-auto sm:z-20 h-full shrink-0 bg-[#181818] border-l border-gray-200 dark:border-gray-800 flex flex-col justify-between overflow-hidden shadow-2xl transition-all duration-300 ease-in-out ${
          isAgentOpen
            ? 'w-full sm:w-[350px] opacity-100 border-l pointer-events-auto'
            : 'w-0 opacity-0 border-l-0 pointer-events-none'
        }`}
      >
        <div className="w-screen sm:w-[350px] h-full flex flex-col justify-between shrink-0">
          {/* Header */}
          <div className="p-4 bg-[#141414] border-b border-gray-800 flex items-center justify-between gap-2 shrink-0 select-none">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#FFC63F] to-[#F1B92E] flex items-center justify-center text-[#1F1F1F] font-bold shadow-md shrink-0">
                <AthenaIcon className="w-5 h-5 text-[#1F1F1F]" />
              </div>
              <div className="min-w-0">
                <h3 className="font-goudy text-[17px] font-bold text-white flex items-center gap-2 flex-wrap leading-snug">
                  Athena
                  <span className="text-[10px] font-semibold uppercase tracking-wider bg-[#FFC63F]/20 text-[#FFC63F] px-2 py-0.5 rounded-full border border-[#FFC63F]/40">
                    {isInvestor ? 'Investment Assistant' : 'AI Assistant'}
                  </span>
                </h3>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsAgentOpen(false)}
              className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title="Close Athena panel"
              aria-label="Close Athena panel"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Scrollable Chat Body */}
          <div className="p-4 flex-1 overflow-y-auto space-y-3 athena-scrollbar">
            {agentMessages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[90%] px-4 py-3 rounded-[16px] text-[14.5px] leading-relaxed ${msg.sender === 'user'
                    ? 'bg-[#FFC63F] text-[#1F1F1F] font-semibold rounded-br-none shadow-sm'
                    : 'bg-[#1C1C1C]/10 text-gray-200 rounded-bl-none border border-white/10 [&>p]:mb-2 last:[&>p]:mb-0 [&_strong]:font-bold [&_em]:italic [&_ul]:list-disc [&_ul]:ml-4 [&_ol]:list-decimal [&_ol]:ml-4 [&_a]:text-blue-400 [&_a]:underline'
                    }`}
                >
                  {msg.sender === 'user' ? (
                    msg.text
                  ) : (
                    <>
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {msg.text}
                      </ReactMarkdown>
                      {msg.action?.type === 'INVESTMENT_CHECKLIST' && msg.action.data && (
                        <InvestmentChecklistCard data={msg.action.data} />
                      )}
                    </>
                  )}
                </div>
                <span className="text-[11px] text-gray-400 mt-1 px-1">{msg.timestamp}</span>
              </div>
            ))}
            {isAgentThinking && (
              <div className="flex items-center gap-2 text-gray-400 text-[14px] py-2">
                <Loader2 className="w-4 h-4 animate-spin text-[#FFC63F]" />
                <span>{isInvestor ? 'Athena looking up your investment details...' : 'AI Agent querying database & transcripts...'}</span>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Quick Prompts & Footer Input */}
          <div className="p-4 pt-2 border-t border-gray-800/80 bg-[#141414] shrink-0">
            <div className="flex flex-wrap gap-1.5 mb-3">
              <span className="text-[11px] font-semibold text-gray-400 py-0.5">Quick prompts:</span>
              {quickPrompts.map((chip, idx) => (
                <button
                  key={idx}
                  onClick={() => handleAgentSend(chip)}
                  className="text-[11.5px] font-medium bg-[#1C1C1C]/5 hover:bg-[#1C1C1C]/15 text-gray-300 px-3 py-1 rounded-full border border-white/10 transition-colors cursor-pointer"
                >
                  {chip}
                </button>
              ))}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleAgentSend(agentInput);
                const textarea = e.currentTarget.querySelector('textarea');
                if (textarea) textarea.style.height = '40px';
              }}
              className="flex items-end gap-2"
            >
              <textarea
                value={agentInput}
                onChange={(e) => {
                  setAgentInput(e.target.value);
                  e.target.style.height = '40px';
                  e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    if (agentInput.trim() && !isAgentThinking) {
                      handleAgentSend(agentInput);
                      e.currentTarget.style.height = '40px';
                    }
                  }
                }}
                rows={1}
                placeholder={isInvestor ? "Ask Athena about your investments, steps to invest..." : "Ask AI Agent anything..."}
                className="flex-1 bg-black/50 border border-gray-700 rounded-[20px] px-4 py-2.5 text-[14px] text-white placeholder-gray-500 focus:outline-none focus:border-[#FFC63F] transition-all resize-none min-h-[40px] max-h-[120px] overflow-y-auto dark-scrollbar leading-relaxed"
              />
              <button
                type="submit"
                disabled={!agentInput.trim() || isAgentThinking}
                className="w-10 h-10 rounded-full bg-[#FFC63F] hover:bg-[#F1B92E] text-[#1F1F1F] flex items-center justify-center font-bold shadow-md transition-all disabled:opacity-50 shrink-0 cursor-pointer mb-[1px]"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </aside>
    </>
  );
}
