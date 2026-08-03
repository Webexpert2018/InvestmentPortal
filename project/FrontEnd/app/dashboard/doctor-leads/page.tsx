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
  MapPin
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
  status: 'pending_apollo' | 'ai_copy_ready' | 'sent' | 'interested' | 'not_interested' | 'error';
  isAlreadyEnriched?: boolean;
  emailStatus?: string;
  stage?: string;
}

const INITIAL_PROSPECTS: DoctorProspect[] = [
  {
    id: 'doc-101',
    fullName: 'Dr. David Wiebe, MD',
    specialty: 'Orthopedic Surgery',
    organization: 'Austin Spine & Joint Center',
    location: 'Austin, TX',
    email: 'dwiebe@austinspine.example.com',
    phone: '+1 (512) 555-0192',
    status: 'ai_copy_ready'
  },
  {
    id: 'doc-102',
    fullName: 'Dr. Sarah Jenkins, MD',
    specialty: 'Cardiovascular Disease',
    organization: 'Midwest Heart & Vascular Institute',
    location: 'Chicago, IL',
    email: 'sjenkins@midwestheart.example.com',
    phone: '+1 (312) 555-0148',
    status: 'ai_copy_ready'
  },
  {
    id: 'doc-103',
    fullName: 'Dr. Marcus Vance, MD',
    specialty: 'Dermatology & Aesthetics',
    organization: 'Vance Dermatology Group',
    location: 'Miami, FL',
    email: 'mvance@vancederm.example.com',
    phone: '+1 (305) 555-0183',
    status: 'ai_copy_ready'
  },
  {
    id: 'doc-104',
    fullName: 'Dr. Elena Rostova, MD',
    specialty: 'Neurology',
    organization: 'Pacific Neuro & Spine Clinic',
    location: 'San Francisco, CA',
    email: 'erostova@pacificneuro.example.com',
    phone: '+1 (415) 555-0129',
    status: 'pending_apollo'
  },
  {
    id: 'doc-105',
    fullName: 'Dr. Robert Thorne, DMD',
    specialty: 'Oral Surgery & Implantology',
    organization: 'Thorne Surgical Center',
    location: 'Dallas, TX',
    email: 'rthorne@thornesurgical.example.com',
    phone: '+1 (214) 555-0174',
    status: 'pending_apollo'
  }
];

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
            const newStatus = ['sent', 'interested', 'not_interested'].includes(newStage) ? newStage : 'ai_copy_ready';
            return {
              ...p,
              isAlreadyEnriched: true,
              status: newStatus,
              email: enriched?.email || p.email,
              phone: enriched?.phone || p.phone,
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
        const mapped: DoctorProspect[] = response.prospects.map((r: any) => ({
          id: r.apollo_id || r.id,
          fullName: r.full_name || r.fullName || 'Physician',
          specialty: r.specialty || 'Medical Doctor',
          organization: r.organization || 'Medical Clinic',
          location: r.location || `${r.city || ''}, ${r.state || ''}`.trim() || 'United States',
          email: r.email || 'Email in DB',
          phone: r.phone || 'N/A',
          status: ['sent', 'interested', 'not_interested'].includes(r.stage || r.status) ? (r.stage || r.status) : 'ai_copy_ready',
          isAlreadyEnriched: true,
          emailStatus: r.email_status || 'verified',
          stage: r.stage || r.status || 'pending_outreach'
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
    const availableDocs = prospects.length > 0 ? prospects : INITIAL_PROSPECTS;
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
      const availableDocs = customList || (prospects.length > 0 ? prospects : INITIAL_PROSPECTS);
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
              <label className="block text-[13px] font-bold text-[#4B4B4B] mb-1.5">Daily Throttled Batch Limit</label>
              <select
                value={batchSize}
                onChange={(e) => setBatchSize(e.target.value)}
                className="w-full bg-[#F8F9FA] border border-gray-200 rounded-xl px-4 py-2.5 text-[14px] text-[#1F1F1F] focus:outline-none focus:border-[#FFC63F] transition-all cursor-pointer font-medium"
              >
                <option value="25">25 Doctors / Day (Conservative)</option>
                <option value="50">50 Doctors / Day (Recommended Gold Standard)</option>
                <option value="100">100 Doctors / Day (Aggressive)</option>
              </select>
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
                  <th className="px-6 py-4 text-[12px] font-bold text-[#8E8E93] uppercase tracking-wider">AI / DB Status</th>
                  <th className="px-6 py-4 text-[12px] font-bold text-[#8E8E93] uppercase tracking-wider">Email Status</th>
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
                        <div className="text-[12px] text-[#8E8E93]">{doc.phone}</div>
                      </td>
                      <td className="px-6 py-4.5 whitespace-nowrap">
                        {doc.isAlreadyEnriched ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-bold bg-green-50 text-green-700 border border-green-200">
                            <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                            Saved in Database ({doc.emailStatus || 'verified'})
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                            <Clock className="w-3.5 h-3.5 text-amber-600" />
                            Unenriched (Check box to Save)
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4.5 whitespace-nowrap">
                        {doc.status === 'interested' || doc.stage === 'interested' ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-bold bg-green-50 text-green-700 border border-green-200 shadow-sm">
                            <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                            🔥 Interested (Clicked Yes)
                          </span>
                        ) : doc.status === 'not_interested' || doc.stage === 'not_interested' ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-bold bg-red-50 text-red-700 border border-red-200">
                            <Clock className="w-3.5 h-3.5 text-red-500" />
                            Declined (Not Interested)
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
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
