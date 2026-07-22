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
  const [isSearchingApollo, setIsSearchingApollo] = useState(false);
  const [isSendingBatch, setIsSendingBatch] = useState(false);
  const [isEnriching, setIsEnriching] = useState(false);
  
  // Apollo filter states
  const [specialty, setSpecialty] = useState('Orthopedic Surgery, Cardiology, Dermatology');
  const [location, setLocation] = useState('United States');
  const [seniority, setSeniority] = useState('Owner, Partner, MD');
  const [batchSize, setBatchSize] = useState('50');

  useEffect(() => {
    if (!authLoading && user && !isAdmin && user.role !== 'investor_relations') {
      toast.error('Access denied. You do not have permission to access Doctor Leads.');
      router.push('/dashboard');
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
            return {
              ...p,
              isAlreadyEnriched: true,
              status: enriched?.stage === 'sent' || enriched?.status === 'sent' ? 'sent' : 'ai_copy_ready',
              email: enriched?.email || p.email,
              phone: enriched?.phone || p.phone,
              emailStatus: 'verified',
              stage: enriched?.stage || 'pending_outreach'
            };
          }
          return p;
        }));
        setSelectedIds([]);
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

  const handleLoadSavedFromDb = async () => {
    try {
      toast.info('Loading saved physician records from doctor_prospects database table...');
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
        toast.success(`Loaded ${mapped.length} verified leads directly from PostgreSQL!`);
      } else {
        toast.warning('No saved leads found inside doctor_prospects table yet. Enrich some leads above first!');
      }
    } catch (error: any) {
      toast.error('Failed to load from database: ' + error.message);
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
        setProspects(prev => prev.map(p => selectedIds.includes(p.id) ? { ...p, status: 'sent' } : p));
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

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-7xl font-helvetica text-[#1F1F1F]">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-[#FFD66B]/20 text-[#1F1F1F]">
                <Stethoscope className="w-4 h-4 text-[#D9A11E]" />
              </span>
              <span className="text-[12px] font-bold uppercase tracking-wider text-[#D9A11E] bg-[#FFF9EE] px-2.5 py-0.5 rounded-full border border-[#FFE7A8]">
                Step 1: Lead Engine & Outreach
              </span>
            </div>
            <h1 className="font-goudy text-[28px] md:text-[34px] leading-tight text-[#1F1F1F]">
              Doctor Lead Generator & AI Campaigns
            </h1>
            <p className="text-[#8E8E93] text-[14px] mt-1 max-w-2xl">
              Discover accredited physician prospects using Apollo.io, generate hyper-personalized email copy using OpenAI, and dispatch throttled daily batches via SMTP inviting them to your Luma webinar.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleTriggerDailyBatch}
              disabled={isSendingBatch || selectedIds.length === 0}
              className="flex items-center gap-2 px-6 py-3 rounded-full font-bold text-[14px] bg-[#FFC63F] hover:bg-[#F1B92E] text-[#1F1F1F] shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              title={selectedIds.length === 0 ? 'Check at least one row below to send emails' : `Send to ${selectedIds.length} checked row(s)`}
            >
              {isSendingBatch ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              <span>Send Campaign Email ({selectedIds.length} Selected)</span>
            </button>
          </div>
        </div>

        {/* Top Configuration Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Apollo.io Search Engine Card */}
          <div className="lg:col-span-2 bg-white rounded-[20px] p-6 shadow-sm border border-[#F2F2F2]">
            <div className="flex items-center justify-between pb-4 mb-5 border-b border-[#F2F2F2]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Search className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-goudy text-[19px] font-bold text-[#1F1F1F]">Apollo.io Target Criteria</h3>
                  <p className="text-[12px] text-[#8E8E93]">Configure physician discovery parameters for daily ingestion</p>
                </div>
              </div>
              <span className="text-[11px] font-semibold bg-gray-100 text-[#4B4B4B] px-3 py-1 rounded-full">
                API Status: Ready to Connect
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
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
                <label className="block text-[13px] font-bold text-[#4B4B4B] mb-1.5">Seniority & Title Keywords</label>
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

            <div className="flex items-center justify-between pt-2 border-t border-[#F2F2F2]">
              <span className="text-[12px] text-[#8E8E93] flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-green-600" />
                Automatic deduplication against existing investor records enabled
              </span>
              <button
                onClick={handleApolloSearch}
                disabled={isSearchingApollo}
                className="flex items-center gap-2 px-6 py-2.5 rounded-full font-bold text-[13px] bg-[#1F1F1F] hover:bg-[#333333] text-white shadow-sm transition-all disabled:opacity-50"
              >
                {isSearchingApollo ? (
                  <Loader2 className="w-4 h-4 animate-spin text-[#FFC63F]" />
                ) : (
                  <RefreshCw className="w-4 h-4 text-[#FFC63F]" />
                )}
                <span>Search & Ingest Leads via Apollo</span>
              </button>
            </div>
          </div>

          {/* OpenAI Personalization Engine Preview Card */}
          <div className="bg-gradient-to-br from-[#1F2937] to-[#111827] rounded-[20px] p-6 text-white shadow-lg flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-[#FFC63F]/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
            
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[#FFC63F]/20 flex items-center justify-center text-[#FFC63F]">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <h3 className="font-goudy text-[18px] font-bold text-white">OpenAI Prompt Rules</h3>
                </div>
                <span className="text-[11px] font-bold uppercase tracking-wider bg-[#FFC63F] text-[#1F1F1F] px-2.5 py-0.5 rounded-full">
                  GPT-4o
                </span>
              </div>

              <p className="text-[13px] text-gray-300 leading-relaxed mb-4">
                Emails are automatically customized for each doctor before sending:
              </p>

              <div className="space-y-3 text-[12px] text-gray-300 bg-white/5 rounded-xl p-3.5 border border-white/10">
                <div className="flex items-start gap-2">
                  <span className="text-[#FFC63F] font-bold">•</span>
                  <span><strong>Hook:</strong> Reference physician&apos;s specific medical specialty (`Cardiology`, `Orthopedics`) & practice city.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-[#FFC63F] font-bold">•</span>
                  <span><strong>Value Prop:</strong> Tax-advantaged real estate & fund returns tailored for high-income doctors.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-[#FFC63F] font-bold">•</span>
                  <span><strong>Call to Action:</strong> Personal invite link to upcoming exclusive Luma (`lu.ma`) webinar.</span>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-white/10 flex items-center justify-between">
              <span className="text-[12px] text-gray-400 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#FFC63F]" />
                Daily Cron @ 9:00 AM EST
              </span>
              <button 
                onClick={() => toast.info('Prompt configuration modal can be opened here')}
                className="text-[12px] font-semibold text-[#FFC63F] hover:underline flex items-center gap-1"
              >
                Configure Prompt <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>

        {/* Prospects Queue Table */}
        <div className="bg-white rounded-[20px] shadow-sm border border-[#F2F2F2] overflow-hidden">
          <div className="px-6 py-5 border-b border-[#F2F2F2] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-goudy text-[20px] font-bold text-[#1F1F1F]">Today&apos;s Outreach Batch Queue</h3>
              <p className="text-[13px] text-[#8E8E93]">Select unenriched prospects below for bulk enrichment and automatic database save.</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleLoadSavedFromDb}
                className="text-[12px] font-bold px-3.5 py-1.5 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300 transition-all shadow-sm flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                View Saved DB Leads
              </button>
              <button
                onClick={handleBulkEnrichAndSave}
                disabled={isEnriching}
                className="text-[12px] font-bold px-4 py-1.5 rounded-full bg-[#FFC63F] hover:bg-[#D9A11E] text-[#1F1F1F] shadow-sm transition-all flex items-center gap-1.5 disabled:opacity-50"
              >
                {isEnriching ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                Enrich Selected ({selectedIds.length}) & Save to DB
              </button>
              <span className="text-[12px] font-bold px-3 py-1.5 rounded-full bg-yellow-50 text-yellow-700 border border-yellow-200">
                {prospects.filter(p => !p.isAlreadyEnriched).length} Unenriched
              </span>
              <span className="text-[12px] font-bold px-3 py-1.5 rounded-full bg-green-50 text-green-700 border border-green-200">
                {prospects.filter(p => p.isAlreadyEnriched || p.status === 'sent').length} Saved in DB
              </span>
            </div>
          </div>

          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#F2F2F2] bg-[#FCFCFC]">
                  <th className="px-6 py-4 text-[12px] font-bold text-[#8E8E93] uppercase tracking-wider w-12">
                    <input
                      type="checkbox"
                      checked={prospects.length > 0 && prospects.every(p => selectedIds.includes(p.id))}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedIds(prospects.map(p => p.id));
                        } else {
                          setSelectedIds([]);
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
                  <th className="px-6 py-4 text-[12px] font-bold text-[#8E8E93] uppercase tracking-wider text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F2F2F2]">
                {prospects.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-14 text-center bg-[#FCFCFC]/80">
                      <div className="flex flex-col items-center justify-center gap-2.5 max-w-md mx-auto">
                        <div className="w-12 h-12 rounded-full bg-[#FFD66B]/20 flex items-center justify-center text-[#D9A11E] mb-1">
                          <Stethoscope className="w-6 h-6" />
                        </div>
                        <p className="text-[16px] font-bold text-[#1F1F1F]">No Physician Leads Discovered Yet</p>
                        <p className="text-[13px] text-[#8E8E93] leading-relaxed">
                          Click <strong>&quot;Search &amp; Ingest Leads via Apollo&quot;</strong> above to perform a free search (0 credits used), or click <strong>&quot;View Saved DB Leads&quot;</strong> to load leads stored in your PostgreSQL database.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  prospects.map((doc) => (
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
                          <div className="text-[14px] font-bold text-[#1F1F1F]">{doc.fullName}</div>
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
                          Saved in PostgreSQL ({doc.emailStatus || 'verified'})
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
                    <td className="px-6 py-4.5 whitespace-nowrap text-right">
                      <button
                        onClick={async () => {
                          try {
                            toast.info(`Dispatching email to ${doc.fullName} via SendGrid / SMTP...`);
                            const res = await apiClient.sendDoctorOutreachEmails({
                              prospectIds: [doc.id],
                              mockProfilesData: prospects
                            });
                            if (res && res.success) {
                              setProspects(prev => prev.map(p => p.id === doc.id ? { ...p, status: 'sent', stage: 'sent' } : p));
                              toast.success(`🎉 Personalized Luma invite email sent to ${doc.fullName}!`);
                            } else {
                              toast.error('Failed to send outreach email.');
                            }
                          } catch (err: any) {
                            toast.error(`Error sending email: ${err.message}`);
                          }
                        }}
                        className="px-4 py-1.5 rounded-full text-[12px] font-bold bg-[#FFC63F] hover:bg-[#F1B92E] text-[#1F1F1F] transition-all shadow-sm border border-[#E0AC27]"
                        title="Click to send or re-send email right now"
                      >
                        {doc.status === 'sent' || doc.stage === 'sent' ? 'Resend' : 'Send Email'}
                      </button>
                    </td>
                  </tr>
                )))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
