'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import {
  Stethoscope,
  Search,
  Mail,
  Sparkles,
  Sliders,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
  Shield,
  Clock,
  Send,
  RefreshCw,
  Building2,
  MapPin,
  UserPlus,
  Plus,
  X,
  Calendar,
  PhoneCall
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiClient } from '@/lib/api/client';

interface DoctorProspect {
  id: string;
  fullName: string;
  specialty: string;
  organization: string;
  location: string;
  email: string;
  phone?: string;
  workPhone?: string;
  status: 'pending_apollo' | 'ai_copy_ready' | 'sent' | 'interested' | 'not_interested' | 'needs_call' | 'error';
  isAlreadyEnriched?: boolean;
  emailStatus?: string;
  stage?: string;
  createdAt?: string;
  created_at?: string;
}

const formatAddedDate = (rawDate?: string | Date | null) => {
  if (!rawDate || rawDate === 'null' || rawDate === 'undefined') return 'N/A';
  try {
    const d = new Date(rawDate);
    if (isNaN(d.getTime())) return 'N/A';
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return 'N/A';
  }
};


export default function DoctorLeadsPage() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const router = useRouter();

  const [prospects, setProspects] = useState<DoctorProspect[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'saved' | 'apollo'>('saved');
  const [isSearchingApollo, setIsSearchingApollo] = useState(false);
  const [isSendingBatch, setIsSendingBatch] = useState(false);
  const [isEnriching, setIsEnriching] = useState(false);

  // Sequence Modal States
  const [isSequenceModalOpen, setIsSequenceModalOpen] = useState(false);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('');
  const [sequenceData, setSequenceData] = useState<any>(null);
  const [activeDay, setActiveDay] = useState<number>(1);
  const [isGeneratingSequence, setIsGeneratingSequence] = useState(false);

  // Apollo filter states
  const [specialty, setSpecialty] = useState('Orthopedic Surgery, Cardiology, Dermatology');
  const [location, setLocation] = useState('United States');
  const [seniority, setSeniority] = useState('Owner, Partner, MD');
  const [batchSize, setBatchSize] = useState('50');

  // Add Doctor Lead Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newFullName, setNewFullName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newSpecialty, setNewSpecialty] = useState('');
  const [newOrganization, setNewOrganization] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [isSavingDoctor, setIsSavingDoctor] = useState(false);
  const [savedProspectId, setSavedProspectId] = useState<string | null>(null);
  const [isSendingWebinarLink, setIsSendingWebinarLink] = useState(false);

  const handleOpenAddModal = () => {
    setNewFullName('');
    setNewEmail('');
    setNewSpecialty('');
    setNewOrganization('');
    setNewLocation('');
    setNewPhone('');
    setSavedProspectId(null);
    setIsAddModalOpen(true);
  };

  const handleCreateDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFullName.trim() || !newEmail.trim()) {
      toast.error('Full Name and Email Address are required.');
      return;
    }

    if (newPhone.trim()) {
      const cleanDigits = newPhone.replace(/[^0-9]/g, '');
      if (cleanDigits.length < 7 || cleanDigits.length > 15) {
        toast.error('Please enter a valid phone number (between 7 and 15 digits, e.g. +1 (305) 555-0103).');
        return;
      }
    }

    setIsSavingDoctor(true);
    try {
      const res = await apiClient.addManualDoctorProspect({
        fullName: newFullName.trim(),
        email: newEmail.trim(),
        specialty: newSpecialty.trim(),
        organization: newOrganization.trim(),
        location: newLocation.trim(),
        phone: newPhone.trim()
      });

      if (res && res.success && res.prospect) {
        const prospectId = res.prospect.apollo_id || res.prospect.id;
        setSavedProspectId(prospectId);
        toast.success(`🎉 Saved ${newFullName} to database! Click 'Send Active Webinar Link' below to dispatch session invite.`);
        setActiveTab('saved');
        await handleLoadSavedFromDb({ silent: true });
      } else {
        toast.error('Failed to save doctor to database.');
      }
    } catch (err: any) {
      console.error('Error creating doctor prospect:', err);
      toast.error(err.message || 'Error creating doctor prospect');
    } finally {
      setIsSavingDoctor(false);
    }
  };

  const handleSendActiveWebinarLink = async () => {
    if (!savedProspectId) {
      toast.warning('Please save lead to database first.');
      return;
    }

    setIsSendingWebinarLink(true);
    try {
      const webinarsRes = await apiClient.getWebinars();
      if (!webinarsRes || !webinarsRes.webinars || webinarsRes.webinars.length === 0) {
        toast.error('No scheduled webinars found. Please create a webinar session first.');
        return;
      }

      const activeWebinar = webinarsRes.webinars.find(
        (w: any) => w.status === 'upcoming' || w.status === 'in_progress'
      ) || webinarsRes.webinars[0];

      if (!activeWebinar) {
        toast.error('No active webinar found.');
        return;
      }

      const inviteRes = await apiClient.sendDirectWebinarInvites(activeWebinar.id, [savedProspectId]);
      if (inviteRes && inviteRes.success) {
        toast.success(`📅 Google Calendar invite sent to ${newFullName || 'doctor'} for "${activeWebinar.title}"!`);
        setIsAddModalOpen(false);
      } else {
        toast.error(inviteRes?.message || 'Failed to send webinar link.');
      }
    } catch (err: any) {
      console.error('Error sending webinar link:', err);
      toast.error(err.message || 'Error sending webinar link');
    } finally {
      setIsSendingWebinarLink(false);
    }
  };

  useEffect(() => {
    if (!authLoading && user) {
      if (!isAdmin && user.role !== 'investor_relations') {
        toast.error('Access denied. You do not have permission to access Doctor Leads.');
        router.push('/dashboard');
      } else {
        handleLoadSavedFromDb({ silent: true });
      }
    }
  }, [user, isAdmin, authLoading, router]);

  const handleApolloSearch = async () => {
    setIsSearchingApollo(true);
    toast.info('Connecting to Apollo.io search endpoint (/v1/mixed_people/api_search)...');

    try {
      const response = await apiClient.searchApolloProspects({
        specialties: specialty,
        locations: location,
        seniorities: seniority,
        count: Number(batchSize) || 50
      });

      if (response && response.prospects && response.prospects.length > 0) {
        setProspects(response.prospects);
        setSelectedIds([]);
        const hasUnenriched = response.prospects.some((p: any) => !p.isAlreadyEnriched);
        setActiveTab(hasUnenriched ? 'apollo' : 'saved');
        toast.success(`Successfully retrieved ${response.prospects.length} verified physician profiles from Apollo.io! Check PostgreSQL cross-reference below.`);
      } else {
        toast.warning('Apollo search returned 0 results. Try broadening your location or specialty keywords.');
      }
    } catch (error: any) {
      console.error('Apollo Search Error:', error);
      toast.error(error.message || 'Failed to connect to Apollo.io. Please check if APOLLO_API_KEY is set in your backend .env file.');
    } finally {
      setIsSearchingApollo(false);
    }
  };

  const handleBulkEnrichAndSave = async () => {
    if (selectedIds.length === 0) {
      toast.warning('Please check at least one physician checkbox before enriching.');
      return;
    }

    setIsEnriching(true);
    toast.info(`Calling Apollo Bulk Match API (/v1/people/bulk_match) and saving ${selectedIds.length} profiles to PostgreSQL...`);

    try {
      const response = await apiClient.bulkEnrichAndSaveProspects({
        apolloIds: selectedIds,
        mockProfilesData: prospects
      });

      if (response && response.success) {
        toast.success(`Successfully enriched and saved ${response.enrichedCount || selectedIds.length} physicians to your database!`);
        // Update local state to mark them as enriched and saved
        setProspects(prev => prev.map(p => {
          if (selectedIds.includes(p.id)) {
            const enriched = response.prospects?.find((r: any) => r.apollo_id === p.id || r.id === p.id);
            const newStage = enriched?.stage || p.stage || 'pending_outreach';
            const newStatus = ['sent', 'interested', 'not_interested', 'needs_call'].includes(newStage) ? newStage : 'ai_copy_ready';
            return {
              ...p,
              isAlreadyEnriched: true,
              status: newStatus as any,
              email: enriched?.email || p.email,
              phone: enriched?.phone || p.phone,
              workPhone: enriched?.work_phone || enriched?.workPhone || p.workPhone,
              emailStatus: 'verified',
              stage: newStage
            };
          }
          return p;
        }));
        setSelectedIds([]);
        setActiveTab('saved');
      } else {
        toast.error('Failed to enrich profiles. Please try again.');
      }
    } catch (error: any) {
      console.error('Bulk Enrich Error:', error);
      toast.error(error.message || 'Error occurred during bulk enrichment and database save.');
    } finally {
      setIsEnriching(false);
    }
  };

  const handleLoadSavedFromDb = async (options?: { silent?: boolean }) => {
    try {
      if (!options?.silent) {
        toast.info('Loading saved physician records from doctor_prospects database table...');
      }
      const response = await apiClient.getSavedDoctorProspects(100);
      if (response && response.prospects && response.prospects.length > 0) {
        const nonManualProspects = response.prospects.filter(
          (r: any) => !(r.apollo_id || r.id || '').startsWith('manual-')
        );
        const mapped: DoctorProspect[] = nonManualProspects.map((r: any) => ({
          id: r.apollo_id || r.id,
          fullName: r.full_name || r.fullName || 'Physician',
          specialty: r.specialty || 'Medical Doctor',
          organization: r.organization || 'Medical Clinic',
          location: r.location || `${r.city || ''}, ${r.state || ''}`.trim() || 'United States',
          email: r.email || 'No Email',
          phone: r.phone || '',
          workPhone: r.work_phone || r.workPhone || '',
          status: ['sent', 'interested', 'not_interested', 'needs_call'].includes(r.stage || r.status) ? (r.stage || r.status) : 'ai_copy_ready',
          isAlreadyEnriched: true,
          emailStatus: r.email_status || 'verified',
          stage: r.stage || r.status || 'pending_outreach',
          createdAt: r.created_at || r.createdAt || r.updated_at,
          created_at: r.created_at || r.createdAt || r.updated_at,
        }));
        setProspects(mapped);
        setSelectedIds([]);
        setActiveTab('saved');
        if (!options?.silent) {
          toast.success(`Loaded ${mapped.length} verified leads directly from PostgreSQL!`);
        }
      } else if (!options?.silent) {
        toast.warning('No saved leads found inside doctor_prospects table yet. Enrich some leads above first!');
      }
    } catch (error: any) {
      if (!options?.silent) {
        toast.error('Failed to load from database: ' + error.message);
      }
    }
  };

  const handleTriggerDailyBatch = async () => {
    if (selectedIds.length === 0) {
      toast.warning('Please select at least one checked row before running the email campaign.');
      return;
    }

    setIsSendingBatch(true);
    toast.info(`Sending personalized Luma invite emails via SendGrid / SMTP to ${selectedIds.length} doctor(s)...`);

    try {
      const res = await apiClient.sendDoctorOutreachEmails({
        prospectIds: selectedIds,
        mockProfilesData: prospects
      });

      if (res && res.success) {
        toast.success(`🎉 Successfully dispatched ${res.sentCount || selectedIds.length} email(s) via SendGrid / SMTP!`);
        setProspects(prev => prev.map(p => selectedIds.includes(p.id) ? { ...p, status: 'sent', stage: 'sent' } : p));
        setSelectedIds([]);
      } else {
        toast.error('Failed to send outreach emails.');
      }
    } catch (err: any) {
      console.error('Email Send Error:', err);
      toast.error(err.message || 'Error sending campaign emails.');
    } finally {
      setIsSendingBatch(false);
    }
  };

  const handleOpenSequenceModal = async (docId?: string) => {
    try {
      const webinarRes = await apiClient.getWebinars();
      if (!webinarRes || !webinarRes.success || !webinarRes.webinars || webinarRes.webinars.length === 0) {
        toast.error('Please create a webinar first in the Webinars tab before creating an email campaign!');
        return;
      }
    } catch (wErr) {
      toast.error('Please create a webinar first in the Webinars tab before creating an email campaign!');
      return;
    }

    setIsSequenceModalOpen(true);
    const availableDocs = prospects;
    const targetDoc = availableDocs.find(p => p.id === docId) || availableDocs[0];
    const targetId = targetDoc ? targetDoc.id : '';
    if (targetId) {
      setSelectedDoctorId(targetId);
      await fetchDoctorSequence(targetId, availableDocs);
    }
  };

  const fetchDoctorSequence = async (docId: string, customList?: DoctorProspect[]) => {
    setIsGeneratingSequence(true);
    try {
      const availableDocs = customList || prospects;
      const targetDoc = availableDocs.find(p => p.id === docId) || availableDocs[0];
      const res = await apiClient.generateDoctorSequence({
        prospectId: docId,
        mockDoctorData: targetDoc
      });
      if (res && res.success) {
        setSequenceData(res);
        setActiveDay(1);
      }
    } catch (err: any) {
      toast.error('Failed to generate AI sequence: ' + err.message);
    } finally {
      setIsGeneratingSequence(false);
    }
  };

  const [isConfiguringSelected, setIsConfiguringSelected] = useState(false);

  const handleConfigureAllSelected = async () => {
    if (activeTab !== 'saved') {
      toast.info('Please switch to "Saved in Database" tab and select saved prospects to configure campaigns.');
      return;
    }
    if (selectedIds.length === 0) {
      toast.info('Please select at least one doctor lead from the database table below.');
      return;
    }

    try {
      const webinarRes = await apiClient.getWebinars();
      if (!webinarRes || !webinarRes.success || !webinarRes.webinars || webinarRes.webinars.length === 0) {
        toast.error('Please create a webinar first in the Webinars tab before creating an email campaign!');
        return;
      }
    } catch (wErr) {
      toast.error('Please create a webinar first in the Webinars tab before creating an email campaign!');
      return;
    }

    setIsConfiguringSelected(true);
    toast.info(`Configuring 5-Day AI sequences & launching campaign for ${selectedIds.length} doctor(s)...`);

    try {
      let count = 0;
      for (const id of selectedIds) {
        const targetDoc = prospects.find(p => p.id === id);
        const res = await apiClient.generateDoctorSequence({
          prospectId: id,
          mockDoctorData: targetDoc
        });
        if (res && res.success) {
          count++;
        }
      }

      toast.success(`🎉 Configured & saved 5-Day AI sequences in PostgreSQL for ${count} doctor(s)! Scheduled to start tomorrow at 9:00 AM EST.`);
      await handleLoadSavedFromDb({ silent: true });
    } catch (err: any) {
      toast.error('Configuration Error: ' + err.message);
    } finally {
      setIsConfiguringSelected(false);
    }
  };

  const displayedProspects = prospects.filter(p => activeTab === 'saved' ? p.isAlreadyEnriched : !p.isAlreadyEnriched);

  return (
    <DashboardLayout>
      <div className="w-full font-helvetica text-[#1F1F1F]">
        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-[#FFC63F] animate-pulse"></span>
              <span className="text-[12px] font-bold uppercase tracking-wider text-[#D9A11E] bg-[#FFF9EE] px-2.5 py-0.5 rounded-full border border-[#FFE7A8]">
                Step 1: Lead Engine &amp; Outreach
              </span>
            </div>
            <h1 className="font-goudy text-[28px] md:text-[34px] leading-tight text-[#1F1F1F]">
              Doctor Lead Generator &amp; AI Campaigns
            </h1>
            <p className="text-[#8E8E93] text-[14px] mt-1 max-w-2xl">
              Discover accredited physician prospects, configure 5-day AI email drip sequences, and dispatch automated outreach.
            </p>
          </div>
        </div>

        {/* Top Configuration Grid / Filters */}
        <div className="w-full bg-white rounded-[20px] p-6 shadow-sm border border-[#F2F2F2] mb-5">
          <div className="flex items-center justify-between pb-4 mb-5 border-b border-[#F2F2F2]">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Search className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-goudy text-[19px] font-bold text-[#1F1F1F]">Target Lead Criteria</h3>
                <p className="text-[12px] text-[#8E8E93]">Configure physician discovery parameters for daily ingestion</p>
              </div>
            </div>
            <span className="text-[11px] font-semibold bg-gray-100 text-[#4B4B4B] px-3 py-1 rounded-full">
              API Status: Ready to Connect
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
            <div>
              <label className="block text-[13px] font-bold text-[#4B4B4B] mb-1.5">Medical Specialties</label>
              <input
                type="text"
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value)}
                placeholder="e.g. Orthopedics, Cardiology, DMD"
                className="w-full bg-[#F8F9FA] border border-gray-200 rounded-xl px-4 py-2.5 text-[14px] text-[#1F1F1F] focus:outline-none focus:border-[#FFC63F] transition-all"
              />
            </div>
            <div>
              <label className="block text-[13px] font-bold text-[#4B4B4B] mb-1.5">Target Location</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. United States, Texas, California"
                className="w-full bg-[#F8F9FA] border border-gray-200 rounded-xl px-4 py-2.5 text-[14px] text-[#1F1F1F] focus:outline-none focus:border-[#FFC63F] transition-all"
              />
            </div>
            <div>
              <label className="block text-[13px] font-bold text-[#4B4B4B] mb-1.5">Seniority &amp; Title Keywords</label>
              <input
                type="text"
                value={seniority}
                onChange={(e) => setSeniority(e.target.value)}
                placeholder="e.g. MD, DDS, Practice Owner, Partner"
                className="w-full bg-[#F8F9FA] border border-gray-200 rounded-xl px-4 py-2.5 text-[14px] text-[#1F1F1F] focus:outline-none focus:border-[#FFC63F] transition-all"
              />
            </div>
            <div>
              <label className="block text-[13px] font-bold text-[#4B4B4B] mb-1.5">Daily Throttled Batch Limit (per_page)</label>
              <input
                type="number"
                min="1"
                max="200"
                value={batchSize}
                onChange={(e) => setBatchSize(e.target.value)}
                placeholder="e.g. 50"
                className="w-full bg-[#F8F9FA] border border-gray-200 rounded-xl px-4 py-2.5 text-[14px] text-[#1F1F1F] focus:outline-none focus:border-[#FFC63F] transition-all"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between pt-4 border-t border-[#F2F2F2] gap-3">
            <span className="text-[12px] text-[#8E8E93] flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-green-600 shrink-0" />
              Automatic deduplication against existing investor records enabled
            </span>
            <button
              onClick={handleApolloSearch}
              disabled={isSearchingApollo}
              className="flex items-center gap-2 px-6 py-2.5 rounded-full font-bold text-[13px] bg-[#1F1F1F] hover:bg-[#333333] text-white shadow-sm transition-all disabled:opacity-50 cursor-pointer self-end sm:self-auto"
            >
              {isSearchingApollo ? (
                <Loader2 className="w-4 h-4 animate-spin text-[#FFC63F]" />
              ) : (
                <RefreshCw className="w-4 h-4 text-[#FFC63F]" />
              )}
              <span>Get Leads</span>
            </button>
          </div>
        </div>

        {/* Prospects Queue Table */}
        <div className="bg-white rounded-[20px] shadow-sm border border-[#F2F2F2] overflow-hidden">
          {/* Header Row */}
          <div className="px-6 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-goudy text-[20px] font-bold text-[#1F1F1F]">Today&apos;s Outreach Batch Queue</h3>
              <p className="text-[13px] text-[#8E8E93]">Switch tabs below to view stored database records or fresh ingested prospects.</p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                onClick={handleOpenAddModal}
                className="text-[12px] font-bold px-4 py-2.5 rounded-full bg-[#FFC63F] hover:bg-[#F1B92E] text-[#1F1F1F] shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>+ Add Doctor Lead</span>
              </button>

              {activeTab === 'apollo' ? (
                <button
                  onClick={handleBulkEnrichAndSave}
                  disabled={isEnriching || selectedIds.length === 0}
                  className="text-[12px] font-bold px-4 py-2.5 rounded-full bg-[#FFC63F] hover:bg-[#D9A11E] text-[#1F1F1F] shadow-sm transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  {isEnriching ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-[#1F1F1F]" />}
                  <span>Enrich Contact Info &amp; Save ({selectedIds.length})</span>
                </button>
              ) : (
                <>
                  <button
                    onClick={handleConfigureAllSelected}
                    disabled={isConfiguringSelected || selectedIds.length === 0}
                    className="text-[12px] font-extrabold px-4 py-2.5 rounded-full bg-[#FFC63F] hover:bg-[#F1B92E] text-[#1F1F1F] shadow-sm transition-all flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {isConfiguringSelected ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-[#1F1F1F]" />
                    ) : (
                      <Send className="w-3.5 h-3.5 text-[#1F1F1F]" />
                    )}
                    <span>⚡ Create 5-Day Email Campaign ({selectedIds.length})</span>
                  </button>

                  <button
                    onClick={() => handleLoadSavedFromDb()}
                    className="text-[12px] font-bold px-4 py-2.5 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300 transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-gray-600" />
                    <span>Refresh DB Leads</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Sub-Header Tabs Bar (Moved Down Below Title) */}
          <div className="px-6 pb-4 pt-1 border-b border-[#F2F2F2] bg-[#FCFCFC] flex items-center justify-between">
            <div className="inline-flex p-1 bg-gray-200/70 rounded-xl border border-gray-300/50 shadow-inner">
              <button
                onClick={() => setActiveTab('saved')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-bold transition-all ${activeTab === 'saved'
                  ? 'bg-white text-[#1F1F1F] shadow-sm border border-gray-200'
                  : 'text-gray-600 hover:text-[#1F1F1F]'
                  }`}
              >
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <span>Saved in Database</span>
                <span className="px-2 py-0.5 text-[11px] rounded-full bg-green-100 text-green-800 font-extrabold border border-green-200">
                  {prospects.filter(p => p.isAlreadyEnriched).length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('apollo')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-bold transition-all ${activeTab === 'apollo'
                  ? 'bg-white text-[#1F1F1F] shadow-sm border border-gray-200'
                  : 'text-gray-600 hover:text-[#1F1F1F]'
                  }`}
              >
                <Sparkles className="w-4 h-4 text-[#D9A11E]" />
                <span>Fresh Leads</span>
                <span className="px-2 py-0.5 text-[11px] rounded-full bg-amber-100 text-amber-800 font-extrabold border border-amber-200">
                  {prospects.filter(p => !p.isAlreadyEnriched).length}
                </span>
              </button>
            </div>

            <div className="text-[12px] text-[#8E8E93] font-medium">
              Showing <span className="font-bold text-[#1F1F1F]">{displayedProspects.length}</span> prospect(s)
            </div>
          </div>

          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#F2F2F2] bg-[#FCFCFC]">
                  <th className="px-6 py-4 text-[12px] font-bold text-[#8E8E93] uppercase tracking-wider w-12">
                    <input
                      type="checkbox"
                      checked={displayedProspects.length > 0 && displayedProspects.every(p => selectedIds.includes(p.id))}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedIds(prev => Array.from(new Set([...prev, ...displayedProspects.map(p => p.id)])));
                        } else {
                          const displayedSet = new Set(displayedProspects.map(p => p.id));
                          setSelectedIds(prev => prev.filter(id => !displayedSet.has(id)));
                        }
                      }}
                      className="rounded border-gray-300 text-[#FFC63F] focus:ring-[#FFC63F]"
                    />
                  </th>
                  <th className="px-6 py-4 text-[12px] font-bold text-[#8E8E93] uppercase tracking-wider">Physician Prospect</th>
                  <th className="px-6 py-4 text-[12px] font-bold text-[#8E8E93] uppercase tracking-wider">Specialty & Clinic</th>
                  <th className="px-6 py-4 text-[12px] font-bold text-[#8E8E93] uppercase tracking-wider">Location</th>
                  <th className="px-6 py-4 text-[12px] font-bold text-[#8E8E93] uppercase tracking-wider">Contact Info</th>
                  <th className="px-6 py-4 text-[12px] font-bold text-[#8E8E93] uppercase tracking-wider">Email Status</th>
                  <th className="px-6 py-4 text-[12px] font-bold text-[#8E8E93] uppercase tracking-wider">Date Added</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F2F2F2]">
                {displayedProspects.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-14 text-center bg-[#FCFCFC]/80">
                      <div className="flex flex-col items-center justify-center gap-2.5 max-w-md mx-auto">
                        <div className="w-12 h-12 rounded-full bg-[#FFD66B]/20 flex items-center justify-center text-[#D9A11E] mb-1">
                          <Stethoscope className="w-6 h-6" />
                        </div>
                        <p className="text-[16px] font-bold text-[#1F1F1F]">
                          {activeTab === 'saved' ? 'No Saved Database Leads Found' : 'No Unenriched Apollo Leads Ingested Yet'}
                        </p>
                        <p className="text-[13px] text-[#8E8E93] leading-relaxed">
                          {activeTab === 'saved'
                            ? 'Ingest prospects via Apollo above and click "Enrich Selected & Save to DB" to store leads in PostgreSQL.'
                            : 'Click "Search & Ingest Leads via Apollo" above to ingest fresh physician prospects.'}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  displayedProspects.map((doc) => (
                    <tr key={doc.id} className={`hover:bg-gray-50/60 transition-colors ${doc.isAlreadyEnriched ? 'bg-gray-50/30' : ''}`}>
                      <td className="px-6 py-4.5 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(doc.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedIds(prev => [...prev, doc.id]);
                            } else {
                              setSelectedIds(prev => prev.filter(id => id !== doc.id));
                            }
                          }}
                          className="rounded border-gray-300 text-[#FFC63F] focus:ring-[#FFC63F]"
                          title="Select for Email Campaign or Bulk Match"
                        />
                      </td>
                      <td className="px-6 py-4.5 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-[#FFF9EE] text-[#D9A11E] flex items-center justify-center font-bold text-[13px] border border-[#FFE7A8]">
                            {doc.fullName.replace('Dr. ', '').charAt(0)}
                          </div>
                          <div>
                            {activeTab === 'saved' ? (
                              <Link
                                href={`/dashboard/doctor-leads/${doc.id}`}
                                className="text-[14px] font-bold text-[#1F1F1F] hover:text-[#D9A11E] hover:underline transition-colors block"
                                title="Click to view full physician profile dossier & AI campaign"
                              >
                                {doc.fullName}
                              </Link>
                            ) : (
                              <span
                                className="text-[14px] font-bold text-[#1F1F1F] block cursor-default"
                                title="Enrich & Save lead to Database to view full profile"
                              >
                                {doc.fullName}
                              </span>
                            )}
                            <div className="text-[11px] text-[#8E8E93]">ID: {doc.id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4.5 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-[13px] font-semibold text-[#1F1F1F]">
                          <Stethoscope className="w-3.5 h-3.5 text-[#D9A11E] shrink-0" />
                          <span>{doc.specialty}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[12px] text-[#6C6C6C] mt-0.5">
                          <Building2 className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                          <span>{doc.organization}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4.5 text-[13px] text-[#4B4B4B] whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                          <span>{doc.location}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4.5 whitespace-nowrap">
                        <div className="text-[13px] text-[#1F1F1F] font-medium">{doc.email}</div>
                        {doc.phone && <div className="text-[12px] text-[#8E8E93]">Mobile: {doc.phone}</div>}
                        {doc.workPhone && <div className="text-[12px] text-[#8E8E93]">Work: {doc.workPhone}</div>}
                        {!doc.phone && !doc.workPhone && <div className="text-[12px] text-[#8E8E93]">-</div>}
                      </td>
                      <td className="px-6 py-4.5 whitespace-nowrap">
                        {doc.status === 'interested' || doc.stage === 'interested' ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-bold bg-green-50 text-green-700 border border-green-200 shadow-sm">
                            <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                            🔥 Interested
                          </span>
                        ) : doc.status === 'not_interested' || doc.stage === 'not_interested' ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-bold bg-red-50 text-red-700 border border-red-200">
                            <Clock className="w-3.5 h-3.5 text-red-500" />
                            Declined (Not Interested)
                          </span>
                        ) : doc.status === 'needs_call' || doc.stage === 'needs_call' ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-bold bg-amber-50 text-amber-800 border border-amber-200 shadow-xs">
                            <PhoneCall className="w-3.5 h-3.5 text-amber-600" />
                            Needs Call
                          </span>
                        ) : doc.status === 'sent' || doc.stage === 'sent' ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-bold bg-[#EFF6FF] text-[#1D4ED8] border border-[#BFDBFE]">
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#2563EB]" />
                            Sent (At least once)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-bold bg-gray-100 text-gray-600 border border-gray-200">
                            <Clock className="w-3.5 h-3.5 text-gray-500" />
                            Not Sent Yet
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4.5 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-[13px] text-[#4B4B4B] font-medium">
                          <Calendar className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                          <span>{formatAddedDate(doc.createdAt || doc.created_at)}</span>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add Doctor Lead Modal */}
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-[24px] max-w-lg w-full p-6 shadow-2xl border border-gray-200 space-y-5 animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-[#FFF9EE] text-[#D9A11E] border border-[#FFE7A8] flex items-center justify-center font-bold">
                    <UserPlus className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-goudy text-[20px] font-bold text-[#1F1F1F]">Add New Physician Lead</h3>
                    <p className="text-[12px] text-gray-500">Save lead to PostgreSQL database</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 hover:text-[#1F1F1F] transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateDoctor} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-gray-500 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dr. Marcus Vance, MD"
                    value={newFullName}
                    onChange={(e) => setNewFullName(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-[13px] text-[#1F1F1F] focus:outline-none focus:border-[#FFC63F]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-gray-500 mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. marcus.vance@clinic.org"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-[13px] text-[#1F1F1F] focus:outline-none focus:border-[#FFC63F]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-gray-500 mb-1">Medical Specialty</label>
                    <input
                      type="text"
                      placeholder="e.g. Dermatology"
                      value={newSpecialty}
                      onChange={(e) => setNewSpecialty(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-[13px] text-[#1F1F1F] focus:outline-none focus:border-[#FFC63F]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase text-gray-500 mb-1">Phone Number</label>
                    <input
                      type="tel"
                      placeholder="e.g. +1 (305) 555-0103"
                      value={newPhone}
                      onChange={(e) => {
                        const filtered = e.target.value.replace(/[^0-9+\-\(\)\s\.]/g, '');
                        setNewPhone(filtered);
                      }}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-[13px] text-[#1F1F1F] focus:outline-none focus:border-[#FFC63F]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-gray-500 mb-1">Practice / Clinic Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Vance Dermatology Group"
                    value={newOrganization}
                    onChange={(e) => setNewOrganization(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-[13px] text-[#1F1F1F] focus:outline-none focus:border-[#FFC63F]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-gray-500 mb-1">Practice Location</label>
                  <input
                    type="text"
                    placeholder="e.g. Miami, FL"
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-[13px] text-[#1F1F1F] focus:outline-none focus:border-[#FFC63F]"
                  />
                </div>

                {/* <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl text-[12px] text-purple-900 flex items-start gap-2">
                  <Mail className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                  <span>The new physician lead will be saved directly to PostgreSQL and displayed in your <strong>Saved in Database</strong> tab.</span>
                </div> */}

                <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-gray-100 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-4 py-2.5 rounded-full text-[13px] font-bold text-gray-600 hover:bg-gray-100 transition-all cursor-pointer"
                  >
                    {savedProspectId ? 'Done / Close' : 'Cancel'}
                  </button>

                  <button
                    type="submit"
                    disabled={isSavingDoctor || Boolean(savedProspectId)}
                    className={`px-5 py-2.5 rounded-full text-[13px] font-bold shadow-sm flex items-center gap-2 transition-all cursor-pointer ${savedProspectId
                      ? 'bg-green-100 text-green-800 border border-green-300 opacity-90'
                      : 'bg-[#FFC63F] hover:bg-[#F1B92E] text-[#1F1F1F]'
                      }`}
                  >
                    {isSavingDoctor ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : savedProspectId ? (
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                    ) : (
                      <Plus className="w-4 h-4" />
                    )}
                    <span>{savedProspectId ? 'Saved to DB' : 'Save to Database'}</span>
                  </button>

                  <button
                    type="button"
                    disabled={!savedProspectId || isSendingWebinarLink}
                    onClick={handleSendActiveWebinarLink}
                    className={`px-5 py-2.5 rounded-full text-[13px] font-bold shadow-sm flex items-center gap-2 transition-all ${savedProspectId
                      ? 'bg-amber-500 hover:bg-amber-600 text-white cursor-pointer shadow-amber-200'
                      : 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed opacity-60'
                      }`}
                    title={
                      savedProspectId
                        ? 'Send active webinar invitation & VIP pass link to this doctor'
                        : 'Save lead to database first to enable sending webinar link'
                    }
                  >
                    {isSendingWebinarLink ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                    <span>Send Active Webinar Invite</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
