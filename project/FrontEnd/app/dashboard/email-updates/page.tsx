"use client";

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { DashboardLayout } from '@/components/DashboardLayout';
import {
  Mail,
  Plus,
  Search,
  Calendar,
  Clock,
  Send,
  Save,
  CheckCircle2,
  XCircle,
  FileEdit,
  Copy,
  Scissors,
  ClipboardPaste,
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Trash2,
  Users,
  Building,
  Info,
  Clock3,
  RotateCcw,
  ShieldCheck,
  LayoutList,
  PenSquare,
  ChevronDown,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export type CampaignStatus = 'Draft' | 'Scheduled' | 'Sent' | 'Failed';

export interface EmailCampaign {
  id: string;
  subject: string;
  preheader: string;
  fromName: string;
  fromEmail: string;
  fundId: string;
  fundName: string;
  recipientCount: number;
  body: string;
  status: CampaignStatus;
  scheduledAt?: string;
  sentAt?: string;
  failedReason?: string;
  lastModified: string;
}

const AVAILABLE_FUNDS = [
  { id: 'b2r-fund', name: 'B2R Fund', recipientCount: 14, defaultSubject: 'Ovalia Capital B2R Fund Updates' },
  { id: 'aurora-growth', name: 'Ovalia Aurora Growth Fund', recipientCount: 28, defaultSubject: 'Ovalia Aurora Growth - Q3 Performance Update' },
  { id: 'income-opportunity', name: 'Ovalia Income & Opportunity Fund', recipientCount: 19, defaultSubject: 'Ovalia Income Fund - Monthly Distribution Statement' },
  { id: 'core-real-estate', name: 'Ovalia Core Real Estate Fund', recipientCount: 22, defaultSubject: 'Ovalia Core Real Estate - Asset Valuation Overview' },
  { id: 'all-funds', name: 'All Active Funds (Consolidated)', recipientCount: 83, defaultSubject: 'Ovalia Capital - General Investor Newsletter' },
];

const INITIAL_CAMPAIGNS: EmailCampaign[] = [
  {
    id: 'camp-1',
    subject: 'Ovalia Capital B2R Fund Updates',
    preheader: 'Important updates regarding existing investments and portfolio recovery progress',
    fromName: 'Ovalia Capital',
    fromEmail: 'invest@ovaliacapital.com',
    fundId: 'b2r-fund',
    fundName: 'B2R Fund',
    recipientCount: 14,
    body: `Dear B2R Fund Investors,

Ovalia Capital has continued to closely review the B2R Fund's existing investments, current real estate market conditions, and the risk and return profile of continuing to deploy capital into new build-to-rent developments.

Based on that review, Ovalia Capital has determined that the best strategic approach is designed to preserve investor capital, maximize yield, and manage recovered proceeds while the remaining portfolio moves toward liquidation.

Market Conditions & Investment Context:
The environment for multi-family and build-to-rent residential properties has changed substantially from when the Fund's original investments were made.

Several key factors:
• Rent growth remains weak in several Sunbelt markets, including Texas.
• Significant new supply continues to pressure occupancy rates and leasing concessions.
• Construction labor and material costs remain elevated across sub-markets.
• Higher interest rates have materially increased financing costs.
• Lenders have become more conservative and are offering lower loan proceeds.

We remain committed to transparent communications and will keep you informed on upcoming recovery distributions.

Sincerely,
Ovalia Capital Asset Management`,
    status: 'Sent',
    sentAt: '09/18/2026 17:19 (EDT)',
    lastModified: '09/18/2026',
  },
  {
    id: 'camp-2',
    subject: 'Ovalia Aurora Growth - NAV Valuation Adjustment',
    preheader: 'Updated NAV per unit calculation for Q3 2026',
    fromName: 'Ovalia Capital',
    fromEmail: 'invest@ovaliacapital.com',
    fundId: 'aurora-growth',
    fundName: 'Ovalia Aurora Growth Fund',
    recipientCount: 28,
    body: `Dear Aurora Growth Fund Investors,

We are pleased to provide you with the formal NAV summary statement for Q3 2026. The latest unit adjustments have been ratified by our independent advisory panel and reflected across the investor portal.

Key Highlights:
• Current NAV per Unit: $1,142.80 (+4.2% annualized)
• Total Assets Under Management: $48,200,000
• Net Yield Distributed: Distributed to investor accounts on the 15th

Please review your personalized tax and yield statements in the Document Vault.

Sincerely,
Ovalia Capital`,
    status: 'Scheduled',
    scheduledAt: '08:21 (EDT) on 10/30/2026 by Ovalia Capital',
    lastModified: '10/28/2026',
  },
  {
    id: 'camp-3',
    subject: 'Ovalia Income Fund - Year-End Distribution Expectations',
    preheader: 'Review anticipated year-end distributions and tax planning schedules',
    fromName: 'Ovalia Capital',
    fromEmail: 'invest@ovaliacapital.com',
    fundId: 'income-opportunity',
    fundName: 'Ovalia Income & Opportunity Fund',
    recipientCount: 19,
    body: `Dear Ovalia Investors,

As we approach the end of the fiscal year, we are finalizing distribution schedules for our income and yield-focused strategies.

Important Dates to Note:
• Nov 15: Record date for final quarterly dividend disbursements
• Dec 01: Electronic wire and ACH distribution batch
• Dec 20: Pre-K-1 estimates uploaded to Investor Vault

Please verify your banking wire instructions in the portal settings to avoid disbursement delays.`,
    status: 'Draft',
    lastModified: '10/29/2026',
  },
  {
    id: 'camp-4',
    subject: 'Q3 Tax Vault Statement Upload Notification',
    preheader: 'Your quarterly K-1 and tax reports are now available',
    fromName: 'Ovalia Capital',
    fromEmail: 'invest@ovaliacapital.com',
    fundId: 'core-real-estate',
    fundName: 'Ovalia Core Real Estate Fund',
    recipientCount: 22,
    body: `Dear Investors,\n\nYour quarterly tax vault statements have been generated.`,
    status: 'Failed',
    failedReason: 'SMTP relay connection timeout (port 587)',
    lastModified: '10/25/2026',
  },
];

export default function EmailUpdatesPage() {
  // Navigation Tabs: 'campaigns' (list) or 'compose' (editor with live preview)
  const [activeTab, setActiveTab] = useState<'campaigns' | 'compose'>('compose');

  // Campaign State
  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);

  // Form Fields
  const [subject, setSubject] = useState('Ovalia Capital B2R Fund Updates');
  const [preheader, setPreheader] = useState('');
  const [fromName, setFromName] = useState('Ovalia Capital');
  const [fromEmail, setFromEmail] = useState('invest@ovaliacapital.com');
  const [selectedFundId, setSelectedFundId] = useState('b2r-fund');
  const [bodyText, setBodyText] = useState('');
  const [status, setStatus] = useState<CampaignStatus>('Draft');

  // Schedule State
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduleDateTime, setScheduleDateTime] = useState('2026-10-30T08:21');
  const [scheduledDateDisplay, setScheduledDateDisplay] = useState<string | null>(null);
  const [isSchedulePickerOpen, setIsSchedulePickerOpen] = useState(false);

  // Filter & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Ref for ContentEditable
  const editorRef = useRef<HTMLDivElement>(null);

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('ovalia_email_campaigns_v2');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setCampaigns(parsed);
        if (parsed.length > 0) {
          loadCampaignIntoForm(parsed[0]);
        }
      } catch (e) {
        setCampaigns(INITIAL_CAMPAIGNS);
        loadCampaignIntoForm(INITIAL_CAMPAIGNS[0]);
      }
    } else {
      setCampaigns(INITIAL_CAMPAIGNS);
      localStorage.setItem('ovalia_email_campaigns_v2', JSON.stringify(INITIAL_CAMPAIGNS));
      loadCampaignIntoForm(INITIAL_CAMPAIGNS[0]);
    }
  }, []);

  const saveToStorage = (updatedList: EmailCampaign[]) => {
    setCampaigns(updatedList);
    localStorage.setItem('ovalia_email_campaigns_v2', JSON.stringify(updatedList));
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const currentFund = AVAILABLE_FUNDS.find((f) => f.id === selectedFundId) || AVAILABLE_FUNDS[0];

  // Load a campaign into the editor
  const loadCampaignIntoForm = (camp: EmailCampaign) => {
    setSelectedCampaignId(camp.id);
    setSubject(camp.subject);
    setPreheader(camp.preheader || '');
    setFromName(camp.fromName || 'Ovalia Capital');
    setFromEmail(camp.fromEmail || 'invest@ovaliacapital.com');
    setSelectedFundId(camp.fundId);
    setBodyText(camp.body);
    setStatus(camp.status);
    if (camp.status === 'Scheduled' && camp.scheduledAt) {
      setIsScheduled(true);
      setScheduledDateDisplay(camp.scheduledAt);
    } else {
      setIsScheduled(false);
      setScheduledDateDisplay(null);
    }

    if (editorRef.current) {
      editorRef.current.innerText = camp.body;
    }
  };

  // Start fresh campaign
  const handleNewCampaign = () => {
    const fund = AVAILABLE_FUNDS[0];
    setSelectedCampaignId(null);
    setSubject(fund.defaultSubject);
    setPreheader('');
    setFromName('Ovalia Capital');
    setFromEmail('invest@ovaliacapital.com');
    setSelectedFundId(fund.id);
    const initialBody = `Dear ${fund.name} Investors,\n\nWe are sharing our quarterly asset performance update. Ovalia Capital has continued to closely review current market conditions and portfolio progress.\n\nKey Highlights:\n• Portfolio stabilization is on track.\n• Distributions are scheduled to be processed to your accounts.\n\nThank you for your partnership.\n\nSincerely,\nOvalia Capital Asset Management`;
    setBodyText(initialBody);
    setStatus('Draft');
    setIsScheduled(false);
    setScheduledDateDisplay(null);

    if (editorRef.current) {
      editorRef.current.innerText = initialBody;
    }
    setActiveTab('compose');
  };

  // Fund Change
  const handleFundChange = (newFundId: string) => {
    setSelectedFundId(newFundId);
    setStatus('Draft');
    const found = AVAILABLE_FUNDS.find((f) => f.id === newFundId);
    if (found && (!subject || AVAILABLE_FUNDS.some((af) => af.defaultSubject === subject))) {
      setSubject(found.defaultSubject);
    }
  };

  // ContentEditable input sync
  const handleBodyInput = (e: React.FormEvent<HTMLDivElement>) => {
    const text = e.currentTarget.innerText;
    setBodyText(text);
    if (status !== 'Draft') {
      setStatus('Draft');
    }
  };

  // Formatting & Clipboard helpers
  const formatText = (cmd: string) => {
    document.execCommand(cmd, false);
    if (editorRef.current) {
      setBodyText(editorRef.current.innerText);
    }
  };

  const handleCopy = () => {
    const sel = window.getSelection()?.toString();
    if (sel) {
      navigator.clipboard.writeText(sel);
      showToast('Copied selected text to clipboard');
    } else {
      navigator.clipboard.writeText(bodyText);
      showToast('Copied full email body to clipboard');
    }
  };

  const handleCut = () => {
    const sel = window.getSelection()?.toString();
    if (sel) {
      navigator.clipboard.writeText(sel);
      document.execCommand('delete');
      if (editorRef.current) {
        setBodyText(editorRef.current.innerText);
      }
      setStatus('Draft');
      showToast('Cut selected text');
    }
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      document.execCommand('insertText', false, text);
      if (editorRef.current) {
        setBodyText(editorRef.current.innerText);
      }
      setStatus('Draft');
      showToast('Pasted text from clipboard');
    } catch {
      showToast('Please use Ctrl+V / Cmd+V to paste');
    }
  };

  // Save as Draft
  const handleSaveDraft = () => {
    const now = new Date().toLocaleDateString('en-US');
    const targetFund = AVAILABLE_FUNDS.find((f) => f.id === selectedFundId) || AVAILABLE_FUNDS[0];

    const item: EmailCampaign = {
      id: selectedCampaignId || `camp-${Date.now()}`,
      subject: subject || 'Untitled Email',
      preheader,
      fromName,
      fromEmail,
      fundId: targetFund.id,
      fundName: targetFund.name,
      recipientCount: targetFund.recipientCount,
      body: bodyText,
      status: 'Draft',
      scheduledAt: undefined,
      lastModified: now,
    };

    let updated: EmailCampaign[];
    if (selectedCampaignId) {
      updated = campaigns.map((c) => (c.id === item.id ? item : c));
    } else {
      updated = [item, ...campaigns];
      setSelectedCampaignId(item.id);
    }

    saveToStorage(updated);
    setStatus('Draft');
    setIsScheduled(false);
    setScheduledDateDisplay(null);
    showToast('Saved as Draft!');
  };

  // Confirm Schedule
  const handleConfirmSchedule = () => {
    const dateObj = new Date(scheduleDateTime);
    const formatted = `${dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })} (EDT) on ${dateObj.toLocaleDateString([], { month: '2-digit', day: '2-digit', year: 'numeric' })} by Ovalia Capital`;

    const targetFund = AVAILABLE_FUNDS.find((f) => f.id === selectedFundId) || AVAILABLE_FUNDS[0];
    const item: EmailCampaign = {
      id: selectedCampaignId || `camp-${Date.now()}`,
      subject: subject || 'Untitled Email',
      preheader,
      fromName,
      fromEmail,
      fundId: targetFund.id,
      fundName: targetFund.name,
      recipientCount: targetFund.recipientCount,
      body: bodyText,
      status: 'Scheduled',
      scheduledAt: formatted,
      lastModified: new Date().toLocaleDateString('en-US'),
    };

    let updated: EmailCampaign[];
    if (selectedCampaignId) {
      updated = campaigns.map((c) => (c.id === item.id ? item : c));
    } else {
      updated = [item, ...campaigns];
      setSelectedCampaignId(item.id);
    }

    saveToStorage(updated);
    setStatus('Scheduled');
    setIsScheduled(true);
    setScheduledDateDisplay(formatted);
    setIsSchedulePickerOpen(false);
    showToast(`Scheduled for ${formatted}!`);
  };

  // Remove Schedule
  const handleRemoveSchedule = () => {
    setStatus('Draft');
    setIsScheduled(false);
    setScheduledDateDisplay(null);

    if (selectedCampaignId) {
      const updated = campaigns.map((c) =>
        c.id === selectedCampaignId ? { ...c, status: 'Draft' as CampaignStatus, scheduledAt: undefined } : c
      );
      saveToStorage(updated);
    }
    showToast('Schedule removed. Reverted to Draft.');
  };

  // Send Now
  const handleSendNow = () => {
    if (!subject.trim()) {
      showToast('Please enter a subject line');
      return;
    }
    const targetFund = AVAILABLE_FUNDS.find((f) => f.id === selectedFundId) || AVAILABLE_FUNDS[0];
    const now = new Date().toLocaleString('en-US');

    const item: EmailCampaign = {
      id: selectedCampaignId || `camp-${Date.now()}`,
      subject,
      preheader,
      fromName,
      fromEmail,
      fundId: targetFund.id,
      fundName: targetFund.name,
      recipientCount: targetFund.recipientCount,
      body: bodyText,
      status: 'Sent',
      sentAt: now,
      lastModified: new Date().toLocaleDateString('en-US'),
    };

    let updated: EmailCampaign[];
    if (selectedCampaignId) {
      updated = campaigns.map((c) => (c.id === item.id ? item : c));
    } else {
      updated = [item, ...campaigns];
      setSelectedCampaignId(item.id);
    }

    saveToStorage(updated);
    setStatus('Sent');
    setIsScheduled(false);
    showToast(`Email sent via SMTP to ${targetFund.recipientCount} investors of ${targetFund.name}!`);
  };

  // Delete Campaign
  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = campaigns.filter((c) => c.id !== id);
    saveToStorage(updated);
    if (selectedCampaignId === id) {
      handleNewCampaign();
    }
    showToast('Campaign deleted');
  };

  // Filtered campaigns
  const filteredCampaigns = campaigns.filter((c) => {
    if (statusFilter !== 'All' && c.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        c.subject.toLowerCase().includes(q) ||
        c.fundName.toLowerCase().includes(q) ||
        c.body.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <DashboardLayout>
      <div className="w-full space-y-5 pb-16 font-helvetica">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 flex items-center gap-3 bg-[#1F2937] text-white px-5 py-3 rounded-xl shadow-2xl border border-gray-700 animate-in fade-in duration-200">
          <CheckCircle2 className="w-5 h-5 text-[#FFC63F]" />
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* TOP HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E5E7EB] dark:border-gray-800 pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-goudy text-[#1F1F1F] dark:text-gray-100">
            Email Updates
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Send, draft, and schedule fund-segmented email updates to your investors via authenticated SMTP.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'campaigns' && (
            <Button
              onClick={handleNewCampaign}
              className="rounded-full bg-[#FFC63F] hover:bg-[#F1B92E] text-black font-semibold px-5 shadow-xs gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Compose Update</span>
            </Button>
          )}
        </div>
      </div>

      {/* NAVIGATION TABS (All Campaigns vs Compose Update) */}
      <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('compose')}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 transition-all ${
              activeTab === 'compose'
                ? 'border-[#FFC63F] text-gray-900 dark:text-white bg-amber-50/40 dark:bg-amber-950/20'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <PenSquare className="w-4 h-4 text-[#FFC63F]" />
            <span>Compose & Live Preview</span>
          </button>

          <button
            onClick={() => setActiveTab('campaigns')}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 transition-all ${
              activeTab === 'campaigns'
                ? 'border-[#FFC63F] text-gray-900 dark:text-white bg-amber-50/40 dark:bg-amber-950/20'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <LayoutList className="w-4 h-4 text-gray-500" />
            <span>All Campaigns</span>
            <span className="ml-1 text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold">
              {campaigns.length}
            </span>
          </button>
        </div>

        {/* Live Status Indicator when on Compose tab */}
        {activeTab === 'compose' && (
          <div className="hidden sm:flex items-center gap-3 pr-2">
            <span className="text-xs uppercase font-bold text-gray-500">Status:</span>
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold ${
                status === 'Draft'
                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
                  : status === 'Scheduled'
                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-400 border border-blue-200 dark:border-blue-800'
                  : status === 'Sent'
                  ? 'bg-green-100 text-green-800 dark:bg-green-950/50 dark:text-green-400 border border-green-200 dark:border-green-800'
                  : 'bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-400 border border-red-200 dark:border-red-800'
              }`}
            >
              {status}
            </span>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: COMPOSE & LIVE PREVIEW (Screenshot 1, 3, 4)                       */}
      {/* ========================================================================= */}
      {activeTab === 'compose' && (
        <div className="space-y-5">
          {/* Action Sub-Bar */}
          <div className="bg-white dark:bg-[#1C1C1C] rounded-2xl p-4 border border-[#E5E7EB] dark:border-gray-800 shadow-sm flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                Updating: <span className="text-blue-600 dark:text-blue-400 font-bold">{currentFund.name}</span>
              </span>
              <span className="text-xs text-gray-400">({currentFund.recipientCount} recipients)</span>
            </div>

            <div className="flex items-center gap-2.5">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSaveDraft}
                className="rounded-full border-gray-300 dark:border-gray-700 gap-1.5 text-xs font-semibold hover:border-[#FFC63F]"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Draft</span>
              </Button>

              <Button
                size="sm"
                onClick={isScheduled ? () => setIsSchedulePickerOpen(true) : handleSendNow}
                className="rounded-full bg-[#FFC63F] hover:bg-[#F1B92E] text-black font-semibold gap-1.5 text-xs px-5 shadow-xs"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isScheduled ? 'Schedule Update' : 'Send Now'}</span>
              </Button>
            </div>
          </div>

          {/* MAIN 2-COLUMN GRID (Matching original layout with Live Preview) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full">
            {/* LEFT COLUMN: FORM, RECIPIENT & SCHEDULE */}
            <div className="lg:col-span-6 space-y-5">
              {/* Form Details Card */}
              <div className="bg-white dark:bg-[#1C1C1C] rounded-2xl p-6 border border-[#E5E7EB] dark:border-gray-800 shadow-sm space-y-5">
                {/* Subject Line */}
                <div>
                  <label className="text-sm font-semibold text-gray-900 dark:text-gray-100 block mb-1.5">
                    Subject line <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => {
                      setSubject(e.target.value);
                      setStatus('Draft');
                    }}
                    placeholder="Enter email subject line..."
                    className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2.5 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#FFC63F]"
                  />
                </div>

                {/* Preheader */}
                <div>
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <label className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      Preheader
                    </label>
                    <Info className="w-3.5 h-3.5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={preheader}
                    onChange={(e) => {
                      setPreheader(e.target.value);
                      setStatus('Draft');
                    }}
                    placeholder="Brief inbox summary preview..."
                    className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2.5 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#FFC63F]"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    If this field is left blank the first line of your email will display.
                  </p>
                </div>

                {/* From Name & Email */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="text-sm font-semibold text-gray-900 dark:text-gray-100 block mb-1.5">
                      From name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={fromName}
                      onChange={(e) => {
                        setFromName(e.target.value);
                        setStatus('Draft');
                      }}
                      className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2.5 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#FFC63F]"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-gray-900 dark:text-gray-100 block mb-1.5">
                      From email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={fromEmail}
                      onChange={(e) => {
                        setFromEmail(e.target.value);
                        setStatus('Draft');
                      }}
                      className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2.5 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#FFC63F]"
                    />
                  </div>
                </div>

                {/* SMTP verified notice */}
                <div className="rounded-xl bg-blue-50/70 dark:bg-blue-950/30 p-3.5 border border-blue-100 dark:border-blue-900/50 flex items-start gap-2.5 text-xs text-blue-900 dark:text-blue-300">
                  <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                  <span>
                    Your domain is verified. Outbound emails will be delivered via authenticated SMTP relay from <strong>{fromEmail}</strong>.
                  </span>
                </div>
              </div>

              {/* Recipient Selection Card (Screenshot 3) */}
              <div className="bg-white dark:bg-[#1C1C1C] rounded-2xl p-6 border border-[#E5E7EB] dark:border-gray-800 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex-1 space-y-3">
                    <div>
                      <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">
                        Recipient Selection
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        Select the fund recipients you would like to receive this update.
                      </p>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 block mb-1">
                        Send to Fund <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={selectedFundId}
                        onChange={(e) => handleFundChange(e.target.value)}
                        className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3.5 py-2.5 text-xs font-semibold text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#FFC63F]"
                      >
                        {AVAILABLE_FUNDS.map((f) => (
                          <option key={f.id} value={f.id}>
                            {f.name} ({f.recipientCount} investors)
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Calculate recipients box on right */}
                  <div className="sm:w-44 bg-[#F0F4FF] dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/60 rounded-xl p-4 flex flex-col justify-center shrink-0">
                    <span className="text-xs font-bold text-gray-800 dark:text-gray-200">
                      Calculate recipients
                    </span>
                    <span className="text-3xl font-extrabold text-[#1E3A8A] dark:text-blue-400 my-1">
                      {currentFund.recipientCount}
                    </span>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-tight">
                      Active investors subscribed to {currentFund.name}
                    </p>
                  </div>
                </div>
              </div>

              {/* Schedule Card (Screenshots 3 & 4) */}
              <div className="bg-white dark:bg-[#1C1C1C] rounded-2xl p-6 border border-[#E5E7EB] dark:border-gray-800 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">
                      Schedule
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      Schedule your campaign to send at a later date and time
                    </p>
                  </div>

                  {/* Scheduled state vs Unscheduled state */}
                  {isScheduled && scheduledDateDisplay ? (
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        onClick={handleRemoveSchedule}
                        className="rounded-lg bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs font-semibold px-4 py-2"
                      >
                        Remove schedule
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setIsSchedulePickerOpen(true)}
                        className="rounded-lg border-gray-300 dark:border-gray-700 text-xs font-semibold px-4 py-2"
                      >
                        Edit schedule
                      </Button>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setIsSchedulePickerOpen(true)}
                      className="rounded-lg border-gray-300 dark:border-gray-700 text-xs font-semibold px-5 py-2 hover:border-[#FFC63F]"
                    >
                      Schedule
                    </Button>
                  )}
                </div>

                {isScheduled && scheduledDateDisplay && (
                  <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800">
                    <span className="text-xs font-bold text-gray-900 dark:text-gray-100 block">
                      Scheduled date
                    </span>
                    <span className="text-xs text-gray-600 dark:text-gray-400 mt-0.5 block">
                      {scheduledDateDisplay}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT COLUMN: LIVE LETTERHEAD EMAIL CANVAS (Interactive & Fully Editable) */}
            <div className="lg:col-span-6 space-y-4">
              <div className="bg-[#64748B] dark:bg-[#252A34] rounded-2xl p-6 shadow-xl relative min-h-[660px] flex flex-col items-center">
                {/* Floating Editor Toolbar for Copy, Cut, Paste & Formatting */}
                <div className="w-full max-w-[560px] bg-white dark:bg-[#1E1E1E] rounded-xl p-2 mb-4 shadow-lg border border-gray-200 dark:border-gray-700 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => formatText('bold')}
                      className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
                      title="Bold"
                    >
                      <Bold className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => formatText('italic')}
                      className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
                      title="Italic"
                    >
                      <Italic className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => formatText('underline')}
                      className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
                      title="Underline"
                    >
                      <Underline className="w-4 h-4" />
                    </button>
                    <div className="h-4 w-px bg-gray-200 dark:bg-gray-700 mx-1" />
                    <button
                      type="button"
                      onClick={() => formatText('insertUnorderedList')}
                      className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
                      title="Bullet List"
                    >
                      <List className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => formatText('insertOrderedList')}
                      className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
                      title="Numbered List"
                    >
                      <ListOrdered className="w-4 h-4" />
                    </button>
                    <div className="h-4 w-px bg-gray-200 dark:bg-gray-700 mx-1" />
                    {/* Copy, Cut, Paste Shortcuts */}
                    <button
                      type="button"
                      onClick={handleCopy}
                      className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
                      title="Copy (Ctrl+C)"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={handleCut}
                      className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
                      title="Cut (Ctrl+X)"
                    >
                      <Scissors className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={handlePaste}
                      className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
                      title="Paste (Ctrl+V)"
                    >
                      <ClipboardPaste className="w-4 h-4" />
                    </button>
                  </div>

                  <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-2.5 py-1 rounded-md">
                    Direct Edit Canvas
                  </span>
                </div>

                {/* Ovalia Capital White Letterhead Canvas */}
                <div className="w-full max-w-[560px] bg-white rounded-xl shadow-2xl p-8 text-gray-800 font-sans min-h-[580px] relative flex flex-col">
                  {/* Ovalia Capital Logo Header */}
                  <div className="flex flex-col items-center justify-center border-b border-gray-100 pb-5 mb-5">
                    <div className="w-14 h-14 relative mb-2">
                      <Image
                        src="/images/dashboard-logo.png"
                        alt="Ovalia Capital Logo"
                        fill
                        className="object-contain"
                      />
                    </div>
                    <span className="font-goudy tracking-wider text-sm font-bold text-[#1E3A8A] uppercase">
                      Ovalia Capital
                    </span>
                    <span className="text-[9px] tracking-widest text-gray-400 uppercase mt-0.5">
                      Fiduciary Real Estate Investments
                    </span>
                  </div>

                  {/* Fully Editable Email Content Area */}
                  <div
                    ref={editorRef}
                    contentEditable={true}
                    suppressContentEditableWarning={true}
                    onInput={handleBodyInput}
                    placeholder="Click to type, cut, copy, or paste your email update..."
                    className="flex-1 text-[13px] leading-relaxed text-gray-700 outline-none whitespace-pre-wrap font-sans cursor-text focus:ring-1 focus:ring-blue-400 rounded p-1"
                  >
                    {bodyText}
                  </div>

                  {/* Email Footer */}
                  <div className="mt-8 pt-5 border-t border-gray-100 text-[11px] text-gray-400 text-center space-y-1">
                    <p>© {new Date().getFullYear()} Ovalia Capital Management. All rights reserved.</p>
                    <p>Sent to active investors in {currentFund.name}.</p>
                  </div>
                </div>

                <p className="text-xs text-slate-200 mt-3 text-center">
                  Live Responsive Canvas • Content can be selected, cut, copied, or pasted freely.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: ALL CAMPAIGNS LIST (Status Overview: Draft, Scheduled, Sent, Failed) */}
      {/* ========================================================================= */}
      {activeTab === 'campaigns' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-white dark:bg-[#1C1C1C] rounded-2xl p-4 border border-[#E5E7EB] dark:border-gray-800 shadow-sm flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">Status:</span>
              {(['All', 'Draft', 'Scheduled', 'Sent', 'Failed'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    statusFilter === st
                      ? 'bg-gray-900 text-white dark:bg-[#FFC63F] dark:text-black shadow-xs'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>

            <div className="relative min-w-[260px]">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search subject or fund..."
                className="w-full pl-9 pr-4 py-1.5 text-xs rounded-full border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#FFC63F]"
              />
            </div>
          </div>

          {/* Table */}
          <div className="bg-white dark:bg-[#1C1C1C] rounded-2xl border border-[#E5E7EB] dark:border-gray-800 shadow-sm overflow-hidden">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-[#E5E7EB] dark:border-gray-800 bg-[#F9FAFB] dark:bg-[#161616] text-[13px] font-semibold text-gray-600 dark:text-gray-400">
                  <th className="py-3 px-4">Subject</th>
                  <th className="py-3 px-4">Target Fund</th>
                  <th className="py-3 px-4 text-center">Recipients</th>
                  <th className="py-3 px-4">Status & Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB] dark:divide-gray-800">
                {filteredCampaigns.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-gray-400">
                      <Mail className="w-8 h-8 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
                      <p className="font-semibold text-sm">No email updates found</p>
                    </td>
                  </tr>
                ) : (
                  filteredCampaigns.map((camp) => (
                    <tr
                      key={camp.id}
                      onClick={() => {
                        loadCampaignIntoForm(camp);
                        setActiveTab('compose');
                      }}
                      className="hover:bg-gray-50/80 dark:hover:bg-gray-800/40 cursor-pointer transition-colors"
                    >
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-gray-900 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400">
                          {camp.subject}
                        </div>
                        <div className="text-xs text-gray-400 truncate max-w-md mt-0.5 line-clamp-1">
                          {camp.body.substring(0, 80)}...
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-medium text-gray-700 dark:text-gray-300">
                        {camp.fundName}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-gray-800 dark:text-gray-200 bg-gray-100 dark:bg-gray-800 px-2.5 py-1 rounded-full">
                          <Users className="w-3 h-3 text-[#FFC63F]" />
                          {camp.recipientCount}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        {camp.status === 'Sent' && (
                          <div className="space-y-0.5">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800 dark:bg-green-950/50 dark:text-green-400 border border-green-200 dark:border-green-800">
                              <CheckCircle2 className="w-3 h-3" />
                              Sent
                            </span>
                            <div className="text-[11px] text-gray-400">{camp.sentAt}</div>
                          </div>
                        )}

                        {camp.status === 'Scheduled' && (
                          <div className="space-y-0.5">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                              <Clock className="w-3 h-3" />
                              Scheduled
                            </span>
                            <div className="text-[11px] text-gray-400">{camp.scheduledAt}</div>
                          </div>
                        )}

                        {camp.status === 'Draft' && (
                          <div className="space-y-0.5">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                              <FileEdit className="w-3 h-3" />
                              Draft
                            </span>
                            <div className="text-[11px] text-gray-400">Unsaved / not sent</div>
                          </div>
                        )}

                        {camp.status === 'Failed' && (
                          <div className="space-y-0.5">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-400 border border-red-200 dark:border-red-800">
                              <XCircle className="w-3 h-3" />
                              Failed
                            </span>
                            <div className="text-[11px] text-red-500">{camp.failedReason || 'Delivery error'}</div>
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              loadCampaignIntoForm(camp);
                              setActiveTab('compose');
                            }}
                            className="rounded-lg text-xs py-1 px-3 border-gray-300 dark:border-gray-700"
                          >
                            Edit
                          </Button>
                          <button
                            onClick={(e) => handleDelete(camp.id, e)}
                            className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SCHEDULE MODAL */}
      {isSchedulePickerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#1E1E1E] rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-200 dark:border-gray-700 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 pb-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-[#FFC63F]" />
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  Schedule Campaign
                </h3>
              </div>
              <button
                onClick={() => setIsSchedulePickerOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-gray-500 dark:text-gray-400">
              Select the date and time this email update will be sent to the {currentFund.recipientCount} investors in {currentFund.name}.
            </p>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 block">
                Scheduled Date & Time (EDT)
              </label>
              <input
                type="datetime-local"
                value={scheduleDateTime}
                onChange={(e) => setScheduleDateTime(e.target.value)}
                className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#FFC63F]"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setIsSchedulePickerOpen(false)}
                className="rounded-full text-xs font-semibold"
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirmSchedule}
                className="rounded-full bg-[#FFC63F] hover:bg-[#F1B92E] text-black font-semibold text-xs px-6"
              >
                Confirm Schedule
              </Button>
            </div>
          </div>
        </div>
      )}
      </div>
    </DashboardLayout>
  );
}
