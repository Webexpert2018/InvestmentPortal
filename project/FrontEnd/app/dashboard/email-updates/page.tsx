"use client";

import React, { useState, useEffect, useRef, useMemo } from 'react';
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
  Info,
  ShieldCheck,
  LayoutList,
  PenSquare,
  Sparkles,
  Loader2,
  Lock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { apiClient } from '@/lib/api/client';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export type CampaignStatus = 'Draft' | 'Scheduled' | 'Sent' | 'Failed';

export interface EmailCampaign {
  id: string;
  subject: string;
  preheader?: string;
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
  createdAt?: string;
  updatedAt?: string;
}

export interface AvailableFund {
  id: string;
  name: string;
  recipientCount: number;
  defaultSubject: string;
  isLegacy?: boolean;
}

const DEFAULT_FUNDS: AvailableFund[] = [
  { id: 'all-funds', name: 'All Active Funds (Consolidated)', recipientCount: 0, defaultSubject: 'Ovalia Capital - General Investor Newsletter' },
];

// Helper to render HTML or legacy plain text cleanly
const renderCampaignBodyHtml = (rawBody?: string) => {
  if (!rawBody) return '';
  if (/<[a-z][\s\S]*>/i.test(rawBody)) {
    return rawBody;
  }
  return rawBody.replace(/\r?\n/g, '<br>');
};

// Helper to strip HTML for table snippets and search
const stripHtmlForSnippet = (html?: string) => {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
};
export default function EmailUpdatesPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const userRole = (user?.role || '').trim().toLowerCase();
  const isAdmin = userRole === 'admin' || userRole === 'executive_admin';

  useEffect(() => {
    if (!authLoading && user && !isAdmin) {
      toast.error('Access denied. This page is only accessible to administrators.');
      router.push('/dashboard');
    }
  }, [user, isAdmin, authLoading, router]);

  // Navigation Tabs: 'campaigns' (list) or 'compose' (editor with live preview)
  const [activeTab, setActiveTab] = useState<'campaigns' | 'compose'>('compose');

  // Funds State
  const [funds, setFunds] = useState<AvailableFund[]>(DEFAULT_FUNDS);
  const [isLoadingFunds, setIsLoadingFunds] = useState(true);

  // Campaign State
  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([]);
  const [isLoadingCampaigns, setIsLoadingCampaigns] = useState(true);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);

  // Form Fields
  const [subject, setSubject] = useState('Ovalia Capital - Investor Update');
  const [preheader, setPreheader] = useState('');
  const [fromName, setFromName] = useState('Ovalia Capital');
  const [fromEmail, setFromEmail] = useState('portal@ovaliacapital.com');
  const [selectedFundId, setSelectedFundId] = useState('all-funds');
  const [bodyText, setBodyText] = useState('');
  const [status, setStatus] = useState<CampaignStatus>('Draft');

  // Schedule State
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduleDateTime, setScheduleDateTime] = useState('');
  const [scheduledDateDisplay, setScheduledDateDisplay] = useState<string | null>(null);
  const [isSchedulePickerOpen, setIsSchedulePickerOpen] = useState(false);

  // Selected Campaign Object
  const selectedCampaign = useMemo(() => {
    return campaigns.find((c) => c.id === selectedCampaignId) || null;
  }, [campaigns, selectedCampaignId]);

  // Filter & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');

  // Fund Holdings Recipients State (using fund transfers holding API)
  const [holdingInvestors, setHoldingInvestors] = useState<any[]>([]);
  const [isLoadingHoldings, setIsLoadingHoldings] = useState(false);
  const [holdingsSearch, setHoldingsSearch] = useState('');
  const [showHoldingsList, setShowHoldingsList] = useState(true);

  // Fetch active holdings recipients whenever selected fund changes
  useEffect(() => {
    if (!isAdmin || !selectedFundId) {
      setHoldingInvestors([]);
      return;
    }
    let isCancelled = false;
    setIsLoadingHoldings(true);
    apiClient
      .getEmailCampaignRecipients(selectedFundId)
      .then((data) => {
        if (!isCancelled) {
          setHoldingInvestors(Array.isArray(data) ? data : []);
        }
      })
      .catch((err) => {
        console.error('Failed to load fund holdings recipients:', err);
        if (!isCancelled) setHoldingInvestors([]);
      })
      .finally(() => {
        if (!isCancelled) setIsLoadingHoldings(false);
      });
    return () => {
      isCancelled = true;
    };
  }, [selectedFundId, isAdmin]);

  // Unique holding recipients deduplicated by email
  const uniqueHoldingInvestors = useMemo(() => {
    const map = new Map<string, any>();
    for (const inv of holdingInvestors) {
      const email = inv.email?.trim().toLowerCase();
      if (!email) continue;
      if (!map.has(email)) {
        map.set(email, inv);
      }
    }
    return Array.from(map.values());
  }, [holdingInvestors]);

  const filteredHoldingInvestors = useMemo(() => {
    if (!holdingsSearch.trim()) return uniqueHoldingInvestors;
    const q = holdingsSearch.toLowerCase();
    return uniqueHoldingInvestors.filter((inv) => {
      const name = (inv.name || inv.full_name || inv.fullName || '').toLowerCase();
      const email = (inv.email || '').toLowerCase();
      return name.includes(q) || email.includes(q);
    });
  }, [uniqueHoldingInvestors, holdingsSearch]);

  // Action Loading States
  const [isSaving, setIsSaving] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  // Ref for ContentEditable
  const editorRef = useRef<HTMLDivElement>(null);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToastMessage(msg);
    setToastType(type);
    setTimeout(() => setToastMessage(null), 3800);
  };

  // 1. Load Funds from Backend
  const loadFunds = async () => {
    setIsLoadingFunds(true);
    try {
      const fundList = await apiClient.getEmailCampaignFunds();
      if (Array.isArray(fundList) && fundList.length > 0) {
        setFunds(fundList);
        setSelectedFundId(fundList[0].id);
        setSubject(fundList[0].defaultSubject);
      }
    } catch (err: any) {
      console.error('Error fetching campaign funds:', err);
    } finally {
      setIsLoadingFunds(false);
    }
  };

  // 2. Load Campaigns from Backend
  const loadCampaigns = async () => {
    setIsLoadingCampaigns(true);
    try {
      const list = await apiClient.getEmailCampaigns({
        status: statusFilter,
        search: searchQuery,
      });
      if (Array.isArray(list)) {
        setCampaigns(list);
        if (list.length > 0 && !selectedCampaignId) {
          loadCampaignIntoForm(list[0]);
        }
      }
    } catch (err: any) {
      console.error('Error fetching email campaigns:', err);
    } finally {
      setIsLoadingCampaigns(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      loadFunds();
    }
  }, [isAdmin]);

  useEffect(() => {
    if (isAdmin) {
      loadCampaigns();
    }
  }, [statusFilter, searchQuery, isAdmin]);

  // Synchronize bodyText into editor DOM when not actively being typed by the user
  useEffect(() => {
    if (editorRef.current && document.activeElement !== editorRef.current) {
      const targetHtml = renderCampaignBodyHtml(bodyText);
      if (editorRef.current.innerHTML !== targetHtml) {
        editorRef.current.innerHTML = targetHtml;
      }
    }
  }, [bodyText, activeTab]);

  // Current active fund
  const currentFund = funds.find((f) => f.id === selectedFundId) || funds[0] || DEFAULT_FUNDS[0];

  // Sent campaigns are locked and read-only
  const isSent = status === 'Sent';

  // Duplicate an existing campaign (especially a Sent one) as a fresh new editable draft
  const handleDuplicateCampaign = () => {
    setSelectedCampaignId(null);
    setStatus('Draft');
    setIsScheduled(false);
    setScheduledDateDisplay(null);
    setSubject((prev) => (prev.startsWith('Copy of ') ? prev : `Copy of ${prev}`));
    showToast('Duplicated into a new draft. You can now edit and send.');
    setActiveTab('compose');
  };

  const formatDateTime = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return `${d.toLocaleDateString([], { month: '2-digit', day: '2-digit', year: 'numeric' })} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } catch {
      return dateStr;
    }
  };

  // Load a campaign into the editor
  const loadCampaignIntoForm = (camp: EmailCampaign) => {
    setSelectedCampaignId(camp.id);
    setSubject(camp.subject || '');
    setPreheader(camp.preheader || '');
    setFromName(camp.fromName || 'Ovalia Capital');
    setFromEmail(camp.fromEmail || 'portal@ovaliacapital.com');
    setSelectedFundId(camp.fundId || 'all-funds');
    const formattedHtml = renderCampaignBodyHtml(camp.body || '');
    setBodyText(formattedHtml);
    setStatus(camp.status || 'Draft');

    if (camp.status === 'Scheduled' && camp.scheduledAt) {
      setIsScheduled(true);
      setScheduledDateDisplay(formatDateTime(camp.scheduledAt));
      try {
        const d = new Date(camp.scheduledAt);
        if (!isNaN(d.getTime())) {
          setScheduleDateTime(d.toISOString().slice(0, 16));
        }
      } catch {
        // fallback
      }
    } else {
      setIsScheduled(false);
      setScheduledDateDisplay(null);
    }

    if (editorRef.current) {
      editorRef.current.innerHTML = formattedHtml;
    }
  };

  // Start fresh campaign
  const handleNewCampaign = () => {
    const fund = funds[0] || DEFAULT_FUNDS[0];
    setSelectedCampaignId(null);
    setSubject(fund.defaultSubject);
    setPreheader('');
    setFromName('Ovalia Capital');
    setFromEmail('portal@ovaliacapital.com');
    setSelectedFundId(fund.id);

    const initialBody = `Dear #Name,<br><br>We are sharing our quarterly asset performance update. Ovalia Capital has continued to closely review current market conditions and portfolio progress.<br><br><strong>Key Highlights:</strong><br>• Portfolio stabilization is on track.<br>• Distributions are scheduled to be processed to your accounts.<br><br>Thank you for your partnership.<br><br>Sincerely,<br>Ovalia Capital Asset Management`;
    setBodyText(initialBody);
    setStatus('Draft');
    setIsScheduled(false);
    setScheduledDateDisplay(null);

    if (editorRef.current) {
      editorRef.current.innerHTML = initialBody;
    }
    setActiveTab('compose');
  };

  // Fund Change
  const handleFundChange = (newFundId: string) => {
    if (isSent) return;
    setSelectedFundId(newFundId);
    setStatus('Draft');
    const found = funds.find((f) => f.id === newFundId);
    if (found && (!subject || funds.some((af) => af.defaultSubject === subject))) {
      setSubject(found.defaultSubject);
    }
  };

  // ContentEditable input sync
  const handleBodyInput = (e: React.FormEvent<HTMLDivElement>) => {
    if (isSent) return;
    const html = e.currentTarget.innerHTML;
    setBodyText(html);
    if (status !== 'Draft') {
      setStatus('Draft');
    }
  };

  // Insert dynamic personalization variable tag (e.g. #Name)
  const insertPersonalizationTag = (tag: string = '#Name') => {
    if (isSent) return;
    if (editorRef.current) {
      editorRef.current.focus();
      document.execCommand('insertText', false, tag);
      setBodyText(editorRef.current.innerHTML);
      if (status !== 'Draft') {
        setStatus('Draft');
      }
    }
  };

  // Formatting & Clipboard helpers
  const formatText = (cmd: string) => {
    if (isSent) return;
    if (editorRef.current) {
      editorRef.current.focus();
    }
    document.execCommand(cmd, false);
    if (editorRef.current) {
      setBodyText(editorRef.current.innerHTML);
    }
    if (status !== 'Draft') {
      setStatus('Draft');
    }
  };

  const handleCopy = () => {
    const sel = window.getSelection()?.toString();
    if (sel) {
      navigator.clipboard.writeText(sel);
      showToast('Copied selected text to clipboard');
    } else {
      navigator.clipboard.writeText(editorRef.current?.innerText || stripHtmlForSnippet(bodyText));
      showToast('Copied full email body to clipboard');
    }
  };

  const handleCut = () => {
    if (isSent) {
      handleCopy();
      return;
    }
    const sel = window.getSelection()?.toString();
    if (sel) {
      navigator.clipboard.writeText(sel);
      document.execCommand('delete');
      if (editorRef.current) {
        setBodyText(editorRef.current.innerHTML);
      }
      setStatus('Draft');
      showToast('Cut selected text');
    }
  };

  const handlePaste = async () => {
    if (isSent) return;
    try {
      const text = await navigator.clipboard.readText();
      document.execCommand('insertText', false, text);
      if (editorRef.current) {
        setBodyText(editorRef.current.innerHTML);
      }
      setStatus('Draft');
      showToast('Pasted text from clipboard');
    } catch {
      showToast('Please use Ctrl+V / Cmd+V to paste');
    }
  };

  // Save as Draft
  const handleSaveDraft = async () => {
    if (status === 'Sent') {
      showToast('Sent campaigns are locked and cannot be edited. Duplicate as new draft instead.', 'error');
      return;
    }
    if (!subject.trim()) {
      showToast('Please enter a subject line', 'error');
      return;
    }

    setIsSaving(true);
    const targetFund = funds.find((f) => f.id === selectedFundId) || funds[0] || DEFAULT_FUNDS[0];

    const payload = {
      subject: subject.trim(),
      preheader: preheader.trim() || undefined,
      fromName: fromName.trim() || 'Ovalia Capital',
      fromEmail: fromEmail.trim() || 'invest@ovaliacapital.com',
      fundId: targetFund.id,
      fundName: targetFund.name,
      recipientCount: targetFund.recipientCount,
      body: editorRef.current ? editorRef.current.innerHTML : bodyText,
      status: 'Draft' as CampaignStatus,
      scheduledAt: null,
    };

    try {
      let saved: EmailCampaign;
      if (selectedCampaignId) {
        saved = await apiClient.updateEmailCampaign(selectedCampaignId, payload);
      } else {
        saved = await apiClient.createEmailCampaign(payload);
        setSelectedCampaignId(saved.id);
      }
      setStatus('Draft');
      setIsScheduled(false);
      setScheduledDateDisplay(null);
      await loadCampaigns();
      showToast(selectedCampaignId ? 'Campaign changes updated!' : 'Saved as new Draft!');
    } catch (err: any) {
      console.error('Save draft error:', err);
      showToast(err.message || 'Failed to save draft', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Confirm Schedule
  const handleConfirmSchedule = async () => {
    if (status === 'Sent') {
      showToast('Sent campaigns cannot be scheduled.', 'error');
      return;
    }
    if (!scheduleDateTime) {
      showToast('Please choose a schedule date and time', 'error');
      return;
    }

    const scheduledDateObj = new Date(scheduleDateTime);
    if (isNaN(scheduledDateObj.getTime())) {
      showToast('Invalid schedule date', 'error');
      return;
    }

    // if (scheduledDateObj.getTime() <= Date.now()) {
    //   showToast('Scheduled date must be in the future', 'error');
    //   return;
    // }

    setIsSaving(true);
    const targetFund = funds.find((f) => f.id === selectedFundId) || funds[0] || DEFAULT_FUNDS[0];
    const scheduledIso = scheduledDateObj.toISOString();
    const formattedDisplay = formatDateTime(scheduledIso);

    const payload = {
      subject: subject.trim() || 'Untitled Email',
      preheader: preheader.trim() || undefined,
      fromName: fromName.trim() || 'Ovalia Capital',
      fromEmail: fromEmail.trim() || 'invest@ovaliacapital.com',
      fundId: targetFund.id,
      fundName: targetFund.name,
      recipientCount: targetFund.recipientCount,
      body: editorRef.current ? editorRef.current.innerHTML : bodyText,
      status: 'Scheduled' as CampaignStatus,
      scheduledAt: scheduledIso,
    };

    try {
      let saved: EmailCampaign;
      if (selectedCampaignId) {
        saved = await apiClient.updateEmailCampaign(selectedCampaignId, payload);
      } else {
        saved = await apiClient.createEmailCampaign(payload);
        setSelectedCampaignId(saved.id);
      }
      setStatus('Scheduled');
      setIsScheduled(true);
      setScheduledDateDisplay(formattedDisplay);
      setIsSchedulePickerOpen(false);
      await loadCampaigns();
      showToast(`Scheduled for ${formattedDisplay}!`);
    } catch (err: any) {
      console.error('Schedule error:', err);
      showToast(err.message || 'Failed to schedule campaign', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Remove Schedule
  const handleRemoveSchedule = async () => {
    if (!selectedCampaignId) {
      setStatus('Draft');
      setIsScheduled(false);
      setScheduledDateDisplay(null);
      showToast('Schedule removed. Reverted to Draft.');
      return;
    }

    setIsSaving(true);
    try {
      await apiClient.updateEmailCampaign(selectedCampaignId, {
        status: 'Draft',
        scheduledAt: null,
      });
      setStatus('Draft');
      setIsScheduled(false);
      setScheduledDateDisplay(null);
      await loadCampaigns();
      showToast('Schedule removed. Reverted to Draft.');
    } catch (err: any) {
      console.error('Remove schedule error:', err);
      showToast(err.message || 'Failed to remove schedule', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Send Now
  const handleSendNow = async () => {
    if (status === 'Sent') {
      showToast('This email campaign has already been sent.', 'error');
      return;
    }
    if (!subject.trim()) {
      showToast('Please enter a subject line', 'error');
      return;
    }

    const targetFund = funds.find((f) => f.id === selectedFundId) || funds[0] || DEFAULT_FUNDS[0];
    if (targetFund.recipientCount === 0) {
      showToast(`No recipients found for ${targetFund.name}`, 'error');
      return;
    }

    setIsSending(true);
    try {
      let campaignId = selectedCampaignId;

      const payload = {
        subject: subject.trim(),
        preheader: preheader.trim() || undefined,
        fromName: fromName.trim() || 'Ovalia Capital',
        fromEmail: fromEmail.trim() || 'invest@ovaliacapital.com',
        fundId: targetFund.id,
        fundName: targetFund.name,
        recipientCount: targetFund.recipientCount,
        body: editorRef.current ? editorRef.current.innerHTML : bodyText,
        status: 'Draft' as CampaignStatus,
      };

      if (!campaignId) {
        const created = await apiClient.createEmailCampaign(payload);
        campaignId = created.id;
        setSelectedCampaignId(campaignId);
      } else {
        await apiClient.updateEmailCampaign(campaignId, payload);
      }

      if (!campaignId) {
        showToast('Failed to resolve campaign ID', 'error');
        return;
      }

      const result = await apiClient.sendEmailCampaign(campaignId);

      if (result.success) {
        setStatus('Sent');
        setIsScheduled(false);
        await loadCampaigns();
        showToast(`Email sent via SMTP to ${result.sentCount} investors of ${targetFund.name}!`);
      } else {
        setStatus('Failed');
        await loadCampaigns();
        showToast(result.failedReason || 'Failed to dispatch campaign', 'error');
      }
    } catch (err: any) {
      console.error('Send campaign error:', err);
      showToast(err.message || 'Failed to send campaign', 'error');
    } finally {
      setIsSending(false);
    }
  };

  // Delete Campaign
  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this campaign?')) return;

    try {
      await apiClient.deleteEmailCampaign(id);
      if (selectedCampaignId === id) {
        handleNewCampaign();
      }
      await loadCampaigns();
      showToast('Campaign deleted');
    } catch (err: any) {
      console.error('Delete error:', err);
      showToast(err.message || 'Failed to delete campaign', 'error');
    }
  };

  // Filtered campaigns
  const filteredCampaigns = campaigns.filter((c) => {
    if (statusFilter !== 'All' && c.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        (c.subject || '').toLowerCase().includes(q) ||
        (c.fundName || '').toLowerCase().includes(q) ||
        stripHtmlForSnippet(c.body).toLowerCase().includes(q)
      );
    }
    return true;
  });

  if (authLoading || (!isAdmin && user)) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-10 w-10 text-[#1F3B6E] animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="w-full space-y-5 pb-16 font-helvetica">
        {/* Toast */}
        {toastMessage && (
          <div
            className={`fixed top-20 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-xl shadow-2xl border animate-in fade-in duration-200 ${toastType === 'error'
              ? 'bg-red-900/90 text-white border-red-700'
              : 'bg-[#1F2937] text-white border-gray-700'
              }`}
          >
            {toastType === 'error' ? (
              <XCircle className="w-5 h-5 text-red-400" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-[#FFC63F]" />
            )}
            <span className="text-sm font-medium">{toastMessage}</span>
          </div>
        )}

        {/* TOP HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E5E7EB] dark:border-gray-800 pb-4">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-bold font-goudy text-[#1F1F1F] dark:text-gray-100">
                Email Updates
              </h1>
              {activeTab === 'compose' && (
                selectedCampaignId ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 dark:bg-blue-950/70 dark:text-blue-300 border border-blue-300 dark:border-blue-800 shadow-2xs">
                    <FileEdit className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    Editing Existing Email
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 shadow-2xs">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    Creating New Email
                  </span>
                )
              )}
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              Send, draft, and schedule fund-segmented email updates to your investors via authenticated SMTP.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={handleNewCampaign}
              className="rounded-full bg-[#FFC63F] hover:bg-[#F1B92E] text-black font-semibold px-5 shadow-xs gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>{activeTab === 'compose' && selectedCampaignId ? 'Create New Email' : 'Compose Update'}</span>
            </Button>
          </div>
        </div>

        {/* NAVIGATION TABS (All Campaigns vs Compose Update) */}
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('compose')}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 transition-all ${activeTab === 'compose'
                ? 'border-[#FFC63F] text-gray-900 dark:text-white bg-amber-50/40 dark:bg-amber-950/20'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
            >
              <PenSquare className="w-4 h-4 text-[#FFC63F]" />
              <span>{selectedCampaignId ? (isSent ? 'View Sent Campaign' : 'Edit Campaign & Preview') : 'Compose New & Preview'}</span>
            </button>

            <button
              onClick={() => setActiveTab('campaigns')}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 transition-all ${activeTab === 'campaigns'
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
                className={`px-3 py-1 rounded-full text-xs font-bold ${status === 'Draft'
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
        {/* TAB 1: COMPOSE & LIVE PREVIEW                                             */}
        {/* ========================================================================= */}
        {activeTab === 'compose' && (
          <div className="space-y-5">
            {/* Action Sub-Bar */}
            <div className="bg-white dark:bg-[#1C1C1C] rounded-2xl p-4 border border-[#E5E7EB] dark:border-gray-800 shadow-sm flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                {isSent ? (
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-xs font-bold border border-emerald-200 dark:border-emerald-800">
                    <Lock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>Sent Campaign (Locked / Non-Editable)</span>
                  </div>
                ) : (
                  <span className="text-xs text-gray-400 font-medium hidden sm:inline">
                    {selectedCampaignId ? 'Editing existing campaign' : 'Drafting new email update'}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2.5">
                {isSent ? (
                  <Button
                    size="sm"
                    onClick={handleDuplicateCampaign}
                    className="rounded-full bg-[#FFC63F] hover:bg-[#F1B92E] text-black font-bold gap-1.5 text-xs px-5 shadow-xs"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Duplicate as New Draft</span>
                  </Button>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleSaveDraft}
                      disabled={isSaving || isSending}
                      className="rounded-full border-gray-300 dark:border-gray-700 gap-1.5 text-xs font-semibold hover:border-[#FFC63F]"
                    >
                      {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                      <span>{selectedCampaignId ? 'Save Changes' : 'Save as Draft'}</span>
                    </Button>

                    <Button
                      size="sm"
                      onClick={isScheduled ? () => setIsSchedulePickerOpen(true) : handleSendNow}
                      disabled={isSaving || isSending}
                      className="rounded-full bg-[#FFC63F] hover:bg-[#F1B92E] text-black font-semibold gap-1.5 text-xs px-5 shadow-xs"
                    >
                      {isSending ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Send className="w-3.5 h-3.5" />
                      )}
                      <span>{isScheduled ? 'Schedule Update' : isSending ? 'Sending...' : 'Send Now'}</span>
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* MAIN 2-COLUMN GRID */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full">
              {/* LEFT COLUMN: FORM, RECIPIENT & SCHEDULE */}
              <div className="lg:col-span-6 space-y-5">
                {/* Form Details Card */}
                <div className="bg-white dark:bg-[#1C1C1C] rounded-2xl p-6 border border-[#E5E7EB] dark:border-gray-800 shadow-sm space-y-5">
                  {/* Mode Card Header */}
                  <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
                    <div className="flex items-center gap-2">
                      {selectedCampaignId ? (
                        <>
                          <span className="flex h-2.5 w-2.5 rounded-full bg-blue-500 ring-4 ring-blue-100 dark:ring-blue-950" />
                          <span className="text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-blue-300">
                            Editing Existing Campaign
                          </span>
                          {selectedCampaign && (
                            <span className="text-[11px] text-gray-400 hidden sm:inline">({selectedCampaign.status})</span>
                          )}
                        </>
                      ) : (
                        <>
                          <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 ring-4 ring-emerald-100 dark:ring-emerald-950" />
                          <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                            Creating New Campaign Draft
                          </span>
                        </>
                      )}
                    </div>

                    {selectedCampaignId ? (
                      <button
                        type="button"
                        onClick={handleNewCampaign}
                        className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200 font-semibold inline-flex items-center gap-1 transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Create New Instead</span>
                      </button>
                    ) : (
                      <span className="text-[11px] text-gray-400 font-medium">Unsaved Draft</span>
                    )}
                  </div>

                  {/* Subject Line */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-sm font-semibold text-gray-900 dark:text-gray-100 block">
                        Subject line <span className="text-red-500">*</span>
                      </label>
                      {!isSent && (
                        <button
                          type="button"
                          onClick={() => setSubject((prev) => (prev ? `${prev} #Name` : '#Name'))}
                          className="text-[11px] font-semibold text-amber-700 dark:text-amber-400 hover:underline flex items-center gap-1"
                          title="Append #Name to subject line"
                        >
                          <span>+ #Name</span>
                        </button>
                      )}
                    </div>
                    <input
                      type="text"
                      value={subject}
                      disabled={isSent}
                      onChange={(e) => {
                        if (isSent) return;
                        setSubject(e.target.value);
                        setStatus('Draft');
                      }}
                      placeholder="Enter email subject line..."
                      className={`w-full rounded-xl border border-gray-300 dark:border-gray-700 ${isSent ? 'bg-gray-100 dark:bg-gray-900 text-gray-500 cursor-not-allowed' : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100'} px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#FFC63F]`}
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
                      disabled={isSent}
                      onChange={(e) => {
                        if (isSent) return;
                        setPreheader(e.target.value);
                        setStatus('Draft');
                      }}
                      placeholder="Brief inbox summary preview..."
                      className={`w-full rounded-xl border border-gray-300 dark:border-gray-700 ${isSent ? 'bg-gray-100 dark:bg-gray-900 text-gray-500 cursor-not-allowed' : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100'} px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#FFC63F]`}
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
                        disabled={isSent}
                        onChange={(e) => {
                          if (isSent) return;
                          setFromName(e.target.value);
                          setStatus('Draft');
                        }}
                        className={`w-full rounded-xl border border-gray-300 dark:border-gray-700 ${isSent ? 'bg-gray-100 dark:bg-gray-900 text-gray-500 cursor-not-allowed' : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100'} px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#FFC63F]`}
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                          From email
                        </label>
                      </div>
                      <input
                        type="email"
                        value={fromEmail}
                        readOnly
                        disabled
                        className="w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-100/80 dark:bg-gray-800/60 px-4 py-2.5 text-sm text-gray-500 dark:text-gray-400 cursor-not-allowed select-none"
                      />
                    </div>
                  </div>

                  {/* SMTP verified notice */}
                  {/* <div className="rounded-xl bg-blue-50/70 dark:bg-blue-950/30 p-3.5 border border-blue-100 dark:border-blue-900/50 flex items-start gap-2.5 text-xs text-blue-900 dark:text-blue-300">
                    <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                    <span>
                      Outbound updates will be delivered via authenticated SMTP relay with notification tag <strong>EMAIL_UPDATE_CAMPAIGN</strong>.
                    </span>
                  </div> */}
                </div>

                {/* Recipient Selection Card */}
                <div className="bg-white dark:bg-[#1C1C1C] rounded-2xl p-6 border border-[#E5E7EB] dark:border-gray-800 shadow-sm space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex-1 space-y-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">
                            Recipient Selection
                          </h3>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          Recipients are dynamically resolved using the live fund transfers holdings API.
                        </p>
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 block mb-1">
                          Send to Fund <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={selectedFundId}
                          disabled={isSent}
                          onChange={(e) => handleFundChange(e.target.value)}
                          className={`w-full rounded-xl border border-gray-300 dark:border-gray-700 ${isSent ? 'bg-gray-100 dark:bg-gray-900 text-gray-500 cursor-not-allowed' : 'bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100'} px-3.5 py-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#FFC63F]`}
                        >
                          {funds.map((f) => (
                            <option key={f.id} value={f.id}>
                              {f.name} ({f.recipientCount} investors)
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Calculate recipients box on right */}
                    <div className="sm:w-48 bg-[#F0F4FF] dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/60 rounded-xl p-4 flex flex-col justify-center shrink-0">
                      <span className="text-xs font-bold text-gray-800 dark:text-gray-200">
                        Calculate recipients
                      </span>
                      <span className="text-3xl font-extrabold text-[#1E3A8A] dark:text-blue-400 my-1">
                        {isLoadingHoldings ? (
                          <span className="text-xl animate-pulse">Loading...</span>
                        ) : (
                          uniqueHoldingInvestors.length
                        )}
                      </span>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-tight">
                        Active holding investors with units &gt; 0 in {currentFund.name}
                      </p>
                    </div>
                  </div>

                  {/* Holding Recipients Live Preview Table */}
                  <div className="border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden bg-gray-50/50 dark:bg-gray-900/40">
                    <div className="px-4 py-3 bg-gray-100/70 dark:bg-gray-800/60 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Users className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                        <span className="text-xs font-bold text-gray-800 dark:text-gray-200">
                          Eligible Holding Recipients
                        </span>
                        <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">
                          ({uniqueHoldingInvestors.length} verified)
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          placeholder="Search recipients..."
                          value={holdingsSearch}
                          onChange={(e) => setHoldingsSearch(e.target.value)}
                          className="text-[11px] px-2.5 py-1 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-[#FFC63F]"
                        />
                        <button
                          type="button"
                          onClick={() => setShowHoldingsList(!showHoldingsList)}
                          className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          {showHoldingsList ? 'Hide' : 'Show'}
                        </button>
                      </div>
                    </div>

                    {showHoldingsList && (
                      <div className="max-h-56 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800">
                        {isLoadingHoldings ? (
                          <div className="p-4 text-center text-xs text-gray-500">
                            Loading holdings from fund transfer engine...
                          </div>
                        ) : filteredHoldingInvestors.length === 0 ? (
                          <div className="p-4 text-center text-xs text-gray-500 dark:text-gray-400">
                            {uniqueHoldingInvestors.length === 0
                              ? 'No investors currently hold active units in this fund.'
                              : 'No recipients match your search.'}
                          </div>
                        ) : (
                          filteredHoldingInvestors.map((inv, idx) => {
                            const displayName = (inv.name || inv.full_name || inv.fullName || 'Investor').trim();
                            const displayUnits = (inv.totalUnits !== undefined && inv.totalUnits !== null)
                              ? inv.totalUnits
                              : (inv.total_units !== undefined && inv.total_units !== null)
                                ? parseFloat(inv.total_units)
                                : null;
                            const displayAccount = inv.accountType || inv.account_type || 'Holding Account';

                            return (
                              <div
                                key={inv.userId || inv.id || inv.email || idx}
                                className="px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs hover:bg-blue-50/40 dark:hover:bg-gray-800/60 transition-colors border-b border-gray-100 dark:border-gray-800 last:border-none"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-[#1E3A8A] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
                                    {(displayName || inv.email || 'U').charAt(0).toUpperCase()}
                                  </div>
                                  <div>
                                    <div className="font-bold text-gray-900 dark:text-gray-100 text-[13px] flex items-center gap-2">
                                      <span>{displayName}</span>
                                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 capitalize">
                                        {displayAccount}
                                      </span>
                                    </div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400 font-mono mt-0.5 select-all">
                                      {inv.email}
                                    </div>
                                  </div>
                                </div>
                                <div className="sm:text-right shrink-0">
                                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 font-mono font-semibold text-xs border border-emerald-200 dark:border-emerald-800/60">
                                    <span>{displayUnits !== null ? `${displayUnits.toLocaleString(undefined, { maximumFractionDigits: 4 })} units` : 'Active'}</span>
                                  </div>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Schedule Card */}
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

                    {/* Scheduled state vs Unscheduled state vs Sent */}
                    {isSent ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-xs font-semibold border border-gray-200 dark:border-gray-700">
                        <Lock className="w-3.5 h-3.5" />
                        Dispatched
                      </span>
                    ) : isScheduled && scheduledDateDisplay ? (
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          onClick={handleRemoveSchedule}
                          disabled={isSaving}
                          className="rounded-lg bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs font-semibold px-4 py-2"
                        >
                          Remove schedule
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setIsSchedulePickerOpen(true)}
                          disabled={isSaving}
                          className="rounded-lg border-gray-300 dark:border-gray-700 text-xs font-semibold px-4 py-2"
                        >
                          Edit schedule
                        </Button>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          if (!scheduleDateTime) {
                            const d = new Date(Date.now() + 3600000);
                            setScheduleDateTime(d.toISOString().slice(0, 16));
                          }
                          setIsSchedulePickerOpen(true);
                        }}
                        disabled={isSaving}
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

              {/* RIGHT COLUMN: LIVE LETTERHEAD EMAIL CANVAS */}
              <div className="lg:col-span-6 space-y-4">
                <div className="bg-[#64748B] dark:bg-[#252A34] rounded-2xl p-6 shadow-xl relative min-h-[660px] flex flex-col items-center">
                  {/* Preview Mode Pill Bar */}
                  <div className="w-full max-w-[560px] flex items-center justify-between mb-2.5 px-1">
                    {selectedCampaignId ? (
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium backdrop-blur-xs ${isSent ? 'bg-emerald-950/70 text-emerald-200 border border-emerald-400/30' : 'bg-black/40 text-blue-200 border border-blue-400/30'}`}>
                        {isSent ? <Lock className="w-3 h-3 text-emerald-300" /> : <FileEdit className="w-3 h-3 text-blue-300" />}
                        <span>{isSent ? 'Viewing Sent:' : 'Editing:'} <strong>{subject || 'Untitled'}</strong></span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-950/60 text-emerald-200 border border-emerald-400/30 text-xs font-medium backdrop-blur-xs">
                        <Sparkles className="w-3 h-3 text-emerald-300" />
                        <span>New Email Draft</span>
                      </span>
                    )}
                    <span className="text-[11px] text-slate-300 font-medium">Live Canvas</span>
                  </div>

                  {/* Floating Editor Toolbar for Copy, Cut, Paste & Formatting */}
                  <div className="w-full max-w-[560px] bg-white dark:bg-[#1E1E1E] rounded-xl p-2 mb-4 shadow-lg border border-gray-200 dark:border-gray-700 flex flex-wrap items-center justify-between gap-2">
                    {isSent ? (
                      <div className="flex items-center gap-2 text-xs font-bold text-gray-700 dark:text-gray-200 px-2 py-1">
                        <Lock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        <span>Sent Campaign (Locked / Read Only)</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => formatText('bold')}
                          className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
                          title="Bold"
                        >
                          <Bold className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => formatText('italic')}
                          className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
                          title="Italic"
                        >
                          <Italic className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => formatText('underline')}
                          className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
                          title="Underline"
                        >
                          <Underline className="w-4 h-4" />
                        </button>
                        <div className="h-4 w-px bg-gray-200 dark:bg-gray-700 mx-1" />
                        <button
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => formatText('insertUnorderedList')}
                          className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
                          title="Bullet List"
                        >
                          <List className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
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
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={handleCopy}
                          className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
                          title="Copy"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={handleCut}
                          className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
                          title="Cut"
                        >
                          <Scissors className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={handlePaste}
                          className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
                          title="Paste"
                        >
                          <ClipboardPaste className="w-4 h-4" />
                        </button>
                        <div className="h-4 w-px bg-gray-200 dark:bg-gray-700 mx-1" />
                        <button
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => insertPersonalizationTag('#Name')}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-700/80 hover:bg-amber-100 dark:hover:bg-amber-900/70 text-xs font-bold transition-all shadow-2xs"
                          title="Insert #Name dynamic tag ? binds each recipient's name automatically"
                        >
                          <span>+ #Name</span>
                        </button>
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleCopy}
                        className="text-[11px] font-semibold text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center gap-1"
                        title="Copy content"
                      >
                        <Copy className="w-3 h-3" />
                        <span>Copy</span>
                      </button>
                      <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-md ${isSent ? 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60' : 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40'}`}>
                        {isSent ? 'Preserved Canvas' : 'Direct Edit Canvas'}
                      </span>
                    </div>
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
                      contentEditable={!isSent}
                      suppressContentEditableWarning={true}
                      onInput={handleBodyInput}
                      placeholder={isSent ? 'Sent campaign content...' : 'Click to type, cut, copy, or paste your email update...'}
                      className={`flex-1 text-[13px] leading-relaxed text-gray-700 outline-none whitespace-pre-wrap font-sans ${isSent ? 'cursor-default select-text' : 'cursor-text focus:ring-1 focus:ring-blue-400'} rounded p-1 [&_b]:font-bold [&_strong]:font-bold [&_i]:italic [&_em]:italic [&_u]:underline [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 empty:before:content-[attr(placeholder)] empty:before:text-gray-400 empty:before:pointer-events-none`}
                    />

                    {/* Email Footer */}
                    <div className="mt-8 pt-5 border-t border-gray-100 text-[11px] text-gray-400 text-center space-y-1">
                      <p>© {new Date().getFullYear()} Ovalia Capital Management. All rights reserved.</p>
                      <p>Sent to active investors in {currentFund.name}.</p>
                    </div>
                  </div>

                  <p className="text-xs text-slate-200 mt-3 text-center flex items-center justify-center gap-1"><span>Live Canvas ? Type <strong className="text-amber-300 font-bold font-mono">#Name</strong> or <strong className="text-amber-300 font-bold font-mono">#name</strong> to dynamically bind each investor's name</span></p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: ALL CAMPAIGNS LIST                                                 */}
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
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${statusFilter === st
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
                  {isLoadingCampaigns ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-gray-400">
                        <Loader2 className="w-8 h-8 mx-auto mb-2 text-gray-400 animate-spin" />
                        <p className="font-semibold text-sm">Loading campaigns...</p>
                      </td>
                    </tr>
                  ) : filteredCampaigns.length === 0 ? (
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
                        className={`hover:bg-gray-50/80 dark:hover:bg-gray-800/40 cursor-pointer transition-colors ${selectedCampaignId === camp.id ? 'bg-amber-50/70 dark:bg-amber-950/30 ring-1 ring-inset ring-[#FFC63F]/60' : ''}`}
                      >
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <div className="font-semibold text-gray-900 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400">
                              {camp.subject}
                            </div>
                            {selectedCampaignId === camp.id && (
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${camp.status === 'Sent' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-[#FFC63F] text-black'}`}>
                                {camp.status === 'Sent' ? 'Viewing Sent' : 'Currently Editing'}
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-gray-400 truncate max-w-md mt-0.5 line-clamp-1">
                            {stripHtmlForSnippet(camp.body).substring(0, 80)}...
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
                              <div className="text-[11px] text-gray-400">{formatDateTime(camp.sentAt)}</div>
                            </div>
                          )}

                          {camp.status === 'Scheduled' && (
                            <div className="space-y-0.5">
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                                <Clock className="w-3 h-3" />
                                Scheduled
                              </span>
                              <div className="text-[11px] text-gray-400">{formatDateTime(camp.scheduledAt)}</div>
                            </div>
                          )}

                          {camp.status === 'Draft' && (
                            <div className="space-y-0.5">
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                                <FileEdit className="w-3 h-3" />
                                Draft
                              </span>
                              <div className="text-[11px] text-gray-400">
                                {camp.updatedAt ? `Saved ${formatDateTime(camp.updatedAt)}` : 'Draft'}
                              </div>
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
                              {camp.status === 'Sent' ? 'View' : 'Edit'}
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
                  Scheduled Date & Time
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
                  disabled={isSaving}
                  className="rounded-full text-xs font-semibold"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleConfirmSchedule}
                  disabled={isSaving}
                  className="rounded-full bg-[#FFC63F] hover:bg-[#F1B92E] text-black font-semibold text-xs px-6"
                >
                  {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Confirm Schedule'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
