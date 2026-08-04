'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { 
  GitFork, 
  ArrowLeft, 
  Search, 
  RefreshCw, 
  Mail, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  ChevronRight, 
  User, 
  Building2, 
  MapPin, 
  Sparkles, 
  PhoneCall, 
  Send, 
  Eye, 
  X,
  Filter,
  Check,
  FileText
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { apiClient } from '@/lib/api/client';

interface DoctorProspect {
  id: string;
  fullName: string;
  specialty: string;
  organization: string;
  location: string;
  email: string;
  phone: string;
  stage: string;
  updatedAt?: string;
  createdAt?: string;
  aiSequence?: Array<{
    day: number;
    title?: string;
    subject?: string;
    body?: string;
    status?: string;
    sentAt?: string;
    isoDate?: string;
  }>;
}

// 9 Flowchart Stages Configuration
const SEQUENCE_STAGES = [
  {
    id: 'pending_outreach',
    stepNumber: 0,
    title: 'Pending Outreach',
    badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
    headerBg: 'bg-gradient-to-r from-amber-500/10 via-amber-50 to-orange-50/50',
    borderColor: 'border-amber-200',
    accentColor: '#F59E0B',
    description: 'Initial physician queue awaiting first drip dispatch'
  },
  {
    id: 'day_1',
    stepNumber: 1,
    title: 'Day 1 Email (Sent)',
    subtitle: 'Intro & Opportunity',
    badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
    headerBg: 'bg-gradient-to-r from-blue-500/10 via-blue-50 to-indigo-50/50',
    borderColor: 'border-blue-200',
    accentColor: '#3B82F6',
    description: 'Day 1 email sent, awaiting physician reply'
  },
  {
    id: 'day_2',
    stepNumber: 2,
    title: 'Day 2 Email (Sent)',
    subtitle: 'Value Prop & Case Study',
    badgeColor: 'bg-cyan-50 text-cyan-700 border-cyan-200',
    headerBg: 'bg-gradient-to-r from-cyan-500/10 via-cyan-50 to-sky-50/50',
    borderColor: 'border-cyan-200',
    accentColor: '#06B6D4',
    description: 'Day 2 email sent, awaiting physician reply'
  },
  {
    id: 'day_3',
    stepNumber: 3,
    title: 'Day 3 Email (Sent)',
    subtitle: 'Webinar Pass & Access',
    badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    headerBg: 'bg-gradient-to-r from-indigo-500/10 via-indigo-50 to-purple-50/50',
    borderColor: 'border-indigo-200',
    accentColor: '#6366F1',
    description: 'Day 3 email sent, awaiting physician reply'
  },
  {
    id: 'day_4',
    stepNumber: 4,
    title: 'Day 4 Email (Sent)',
    subtitle: 'Tax Strategy & Equity',
    badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
    headerBg: 'bg-gradient-to-r from-purple-500/10 via-purple-50 to-fuchsia-50/50',
    borderColor: 'border-purple-200',
    accentColor: '#8B5CF6',
    description: 'Day 4 email sent, awaiting physician reply'
  },
  {
    id: 'day_5',
    stepNumber: 5,
    title: 'Day 5 Email (Sent)',
    subtitle: 'Final Call & Notice',
    badgeColor: 'bg-pink-50 text-pink-700 border-pink-200',
    headerBg: 'bg-gradient-to-r from-pink-500/10 via-pink-50 to-rose-50/50',
    borderColor: 'border-pink-200',
    accentColor: '#EC4899',
    description: 'Day 5 email sent, awaiting physician reply'
  },
  {
    id: 'interested',
    stepNumber: 6,
    title: 'Interested',
    subtitle: 'Positive Response',
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    headerBg: 'bg-gradient-to-r from-emerald-500/10 via-emerald-50 to-teal-50/50',
    borderColor: 'border-emerald-200',
    accentColor: '#10B981',
    description: 'Doctors who confirmed interest or registered for webinar'
  },
  {
    id: 'not_interested',
    stepNumber: 7,
    title: 'Not Interested',
    subtitle: 'Declined / Unsubscribed',
    badgeColor: 'bg-rose-50 text-rose-700 border-rose-200',
    headerBg: 'bg-gradient-to-r from-rose-500/10 via-rose-50 to-red-50/50',
    borderColor: 'border-rose-200',
    accentColor: '#F43F5E',
    description: 'Doctors who expressed not interested or opted out'
  },
  {
    id: 'needs_call',
    stepNumber: 8,
    title: 'Needs Phone Call',
    subtitle: 'Non-responder Queue',
    badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
    headerBg: 'bg-gradient-to-r from-purple-500/10 via-purple-50 to-indigo-50/50',
    borderColor: 'border-purple-200',
    accentColor: '#8B5CF6',
    description: '48h Elapsed post-sequence without response - Call queue'
  }
];

export default function DoctorEmailSequenceFlowPage() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromCrm = searchParams ? searchParams.get('from') === 'crm' || searchParams.get('from') === 'doctor-crm' : false;

  const [doctors, setDoctors] = useState<DoctorProspect[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'interested' | 'not_interested' | 'sent' | 'needs_call'>('all');
  
  // Selected doctor for email preview modal
  const [selectedDoctor, setSelectedDoctor] = useState<DoctorProspect | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState<boolean>(false);
  const [activeModalTab, setActiveModalTab] = useState<number>(1);

  useEffect(() => {
    if (!authLoading && user) {
      if (!isAdmin && user.role !== 'investor_relations') {
        toast.error('Access denied. You do not have permission to view Email Sequence.');
        router.push('/dashboard');
      } else {
        loadDoctors();
      }
    }
  }, [user, isAdmin, authLoading, router]);

  const loadDoctors = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.getSavedDoctorProspects(100);
      if (response && response.prospects && Array.isArray(response.prospects)) {
        const mapped: DoctorProspect[] = response.prospects.map((r: any) => {
          let seqArr: any[] = [];
          if (r.ai_sequence) {
            if (typeof r.ai_sequence === 'string') {
              try { seqArr = JSON.parse(r.ai_sequence); } catch(e){}
            } else if (Array.isArray(r.ai_sequence)) {
              seqArr = r.ai_sequence;
            }
          } else if (r.aiSequence && Array.isArray(r.aiSequence)) {
            seqArr = r.aiSequence;
          }

          return {
            id: r.apollo_id || r.id || `doc-${Math.random()}`,
            fullName: r.full_name || r.fullName || 'Physician',
            specialty: r.specialty || 'Medical Doctor',
            organization: r.organization || r.clinic || 'Medical Practice',
            location: r.location || `${r.city || ''}, ${r.state || ''}`.trim() || 'United States',
            email: r.email || 'N/A',
            phone: r.phone || 'N/A',
            stage: r.stage || r.status || 'pending_outreach',
            updatedAt: r.updated_at || r.updatedAt,
            createdAt: r.created_at || r.createdAt,
            aiSequence: seqArr
          };
        });
        setDoctors(mapped);
      }
    } catch (error: any) {
      console.error('Error loading doctor sequence flow:', error);
      toast.error('Failed to load doctor sequence data: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Helper function to determine which of the 7 stages a doctor currently belongs to based on:
   * 1. If explicit stage is 'needs_call' or 'call_queue' -> 'needs_call' (Stage 7)
   * 2. If stage is 'pending_outreach' or sequence empty/no sent emails -> 'pending_outreach' (Stage 0)
   * 3. Highest sent step in `aiSequence` -> 'day_1', 'day_2', 'day_3', 'day_4', 'day_5'
   */
  const getDoctorCurrentStage = (doc: DoctorProspect): { stageId: string; lastSentDate?: string; lastSentDay?: number } => {
    const s = (doc.stage || '').toLowerCase();

    // 1. If explicit interested stage -> 'interested' stage
    if (['interested', 'email_replied', 'luma_registered', 'converted_investor'].includes(s)) {
      return { stageId: 'interested', lastSentDate: doc.updatedAt };
    }

    // 2. If explicit not_interested stage -> 'not_interested' stage
    if (['not_interested', 'declined', 'unsubscribed'].includes(s)) {
      return { stageId: 'not_interested', lastSentDate: doc.updatedAt };
    }

    // 3. If explicit needs_call stage -> 'needs_call' stage
    if (['needs_call', 'call_queue'].includes(s)) {
      return { stageId: 'needs_call', lastSentDate: doc.updatedAt };
    }

    // 4. If pending_outreach or sequence empty -> 'pending_outreach' stage
    if (s === 'pending_outreach' || !doc.aiSequence || !Array.isArray(doc.aiSequence) || doc.aiSequence.length === 0) {
      if (s === 'sent') return { stageId: 'day_1', lastSentDate: doc.updatedAt };
      return { stageId: 'pending_outreach' };
    }

    // 5. Active sent drip sequence stage (Day 1 - Day 5) - only doctors whose stage is still active sent
    const sentSteps = doc.aiSequence.filter(step => step.status === 'sent' || step.sentAt);
    if (sentSteps.length === 0) {
      if (s === 'sent') return { stageId: 'day_1', lastSentDate: doc.updatedAt };
      return { stageId: 'pending_outreach' };
    }

    let maxStep = sentSteps[0];
    for (const stepItem of sentSteps) {
      if (stepItem.day > maxStep.day) {
        maxStep = stepItem;
      }
    }

    const stageId = `day_${Math.min(5, Math.max(1, maxStep.day))}`;
    return { 
      stageId, 
      lastSentDate: maxStep.sentAt || doc.updatedAt || doc.createdAt,
      lastSentDay: maxStep.day
    };
  };

  // Helper for Interest Badges
  const getStatusBadge = (stage: string) => {
    const s = (stage || '').toLowerCase();
    if (['interested', 'email_replied', 'luma_registered', 'converted_investor'].includes(s)) {
      return {
        label: 'Interested',
        bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        dot: 'bg-emerald-500',
        icon: CheckCircle2
      };
    }
    if (['not_interested', 'declined', 'unsubscribed'].includes(s)) {
      return {
        label: 'Not Interested',
        bg: 'bg-rose-50 text-rose-700 border-rose-200',
        dot: 'bg-rose-500',
        icon: XCircle
      };
    }
    if (['needs_call', 'call_queue'].includes(s)) {
      return {
        label: 'Needs Call',
        bg: 'bg-purple-50 text-purple-700 border-purple-200',
        dot: 'bg-purple-500',
        icon: PhoneCall
      };
    }
    if (s === 'sent') {
      return {
        label: 'Email Sent',
        bg: 'bg-blue-50 text-blue-700 border-blue-200',
        dot: 'bg-blue-500',
        icon: Send
      };
    }
    return {
      label: 'Pending Outreach',
      bg: 'bg-amber-50 text-amber-700 border-amber-200',
      dot: 'bg-amber-500',
      icon: Clock
    };
  };

  // Filter doctors based on search query and status tab
  const filteredDoctors = doctors.filter(doc => {
    const matchesSearch = 
      doc.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.specialty.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.organization.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.email.toLowerCase().includes(searchQuery.toLowerCase());

    let matchesStatus = true;
    const s = doc.stage.toLowerCase();
    if (statusFilter === 'interested') {
      matchesStatus = ['interested', 'email_replied', 'luma_registered', 'converted_investor'].includes(s);
    } else if (statusFilter === 'not_interested') {
      matchesStatus = ['not_interested', 'declined'].includes(s);
    } else if (statusFilter === 'sent') {
      matchesStatus = s === 'sent';
    } else if (statusFilter === 'needs_call') {
      matchesStatus = ['needs_call', 'call_queue'].includes(s);
    }

    return matchesSearch && matchesStatus;
  });

  // Calculate Metrics
  const totalCount = doctors.length;
  const interestedCount = doctors.filter(d => ['interested', 'email_replied', 'luma_registered', 'converted_investor'].includes(d.stage.toLowerCase())).length;
  const notInterestedCount = doctors.filter(d => ['not_interested', 'declined'].includes(d.stage.toLowerCase())).length;
  const needsCallCount = doctors.filter(d => ['needs_call', 'call_queue'].includes(d.stage.toLowerCase())).length;

  const formatDate = (isoString?: string) => {
    if (!isoString) return null;
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return null;
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch(e) {
      return null;
    }
  };

  return (
    <DashboardLayout>
      <div className="w-full font-helvetica text-[#1F1F1F] space-y-6 pb-12">
        {/* Top Navigation & Breadcrumb */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              {fromCrm && (
                <>
                  <Link 
                    href="/dashboard/doctor-crm"
                    className="inline-flex items-center gap-1 text-[13px] font-bold text-gray-500 hover:text-gray-900 transition-colors"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Doctor Outreach CRM</span>
                  </Link>
                  <span className="text-gray-300">/</span>
                </>
              )}
              <span className="text-[12px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100 flex items-center gap-1.5">
                <GitFork className="w-3 h-3" />
                Physician Sequence Pipeline
              </span>
            </div>
            <h1 className="font-goudy text-[28px] md:text-[34px] leading-tight text-[#1F1F1F]">
              Sequence Pipeline
            </h1>
            <p className="text-[#8E8E93] text-[14px] mt-1 max-w-3xl">
              Track doctor prospects across all sequence stages of outreach (Pending ➔ Day 1-5 ➔ Interested / Not Interested ➔ Needs Call). View exact email sent dates, interest status, and email content history.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start md:self-auto">
            <button
              onClick={loadDoctors}
              disabled={isLoading}
              className="px-4 py-2 bg-white hover:bg-gray-50 border border-gray-200 text-[#1F1F1F] text-[13px] font-bold rounded-full shadow-xs flex items-center gap-2 transition-all cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh Pipeline</span>
            </button>
          </div>
        </div>

        {/* Top Summary Cards Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white rounded-[16px] p-4 border border-[#EBEBEB] shadow-xs">
            <div className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Total Prospects</div>
            <div className="text-[24px] font-goudy font-bold text-[#1F1F1F] mt-0.5">{totalCount} Doctors</div>
            <div className="text-[11px] text-gray-500 mt-1">Saved in database</div>
          </div>

          <div className="bg-white rounded-[16px] p-4 border border-[#EBEBEB] shadow-xs">
            <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-600">🟢 Interested</div>
            <div className="text-[24px] font-goudy font-bold text-emerald-700 mt-0.5">{interestedCount} Doctors</div>
            <div className="text-[11px] text-emerald-600/80 mt-1">High Intent &amp; Replies</div>
          </div>

          <div className="bg-white rounded-[16px] p-4 border border-[#EBEBEB] shadow-xs">
            <div className="text-[11px] font-bold uppercase tracking-wider text-rose-600">🔴 Not Interested</div>
            <div className="text-[24px] font-goudy font-bold text-rose-700 mt-0.5">{notInterestedCount} Doctors</div>
            <div className="text-[11px] text-rose-600/80 mt-1">Declined / Unsubscribed</div>
          </div>

          <div className="bg-white rounded-[16px] p-4 border border-[#EBEBEB] shadow-xs">
            <div className="text-[11px] font-bold uppercase tracking-wider text-purple-600">🟣 Needs Phone Call</div>
            <div className="text-[24px] font-goudy font-bold text-purple-700 mt-0.5">{needsCallCount} Doctors</div>
            <div className="text-[11px] text-purple-600/80 mt-1">Non-responders post 5 days</div>
          </div>
        </div>

        {/* Search Bar Row */}
        <div className="bg-white p-3.5 rounded-[18px] border border-[#EBEBEB] shadow-xs flex items-center justify-between gap-3">
          <div className="text-[13px] font-bold text-gray-700 flex items-center gap-2">
            <GitFork className="w-4 h-4 text-blue-600" />
            <span>Outreach Pipeline Stage Stream</span>
          </div>

          {/* Search Bar */}
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search doctor, specialty, email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-[13px] bg-gray-50 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>
        </div>

        {/* 9-STAGE SEQUENCE PIPELINE CONTAINER */}
        <div className="w-full overflow-x-auto pb-6 scrollbar-thin scrollbar-thumb-gray-300">
          <div className="min-w-[2700px] flex items-start gap-4">
            {SEQUENCE_STAGES.map((stageItem, index) => {
              // Get doctors currently in this stage
              const doctorsInStage = filteredDoctors.filter(doc => {
                const stageInfo = getDoctorCurrentStage(doc);
                return stageInfo.stageId === stageItem.id;
              });

              return (
                <div key={stageItem.id} className="w-[285px] shrink-0 flex items-start gap-2">
                  {/* Stage Node Box */}
                  <div className={`w-full bg-white rounded-[20px] border ${stageItem.borderColor} shadow-sm overflow-hidden flex flex-col h-[560px]`}>
                    {/* Stage Header */}
                    <div className={`p-4 ${stageItem.headerBg} border-b border-gray-100 shrink-0`}>
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span 
                            className="w-6 h-6 rounded-full text-white font-bold text-[11px] flex items-center justify-center shadow-xs"
                            style={{ backgroundColor: stageItem.accentColor }}
                          >
                            {stageItem.stepNumber}
                          </span>
                          <h3 className="font-goudy font-bold text-[16px] text-gray-900 leading-tight">
                            {stageItem.title}
                          </h3>
                        </div>

                        <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${stageItem.badgeColor}`}>
                          {doctorsInStage.length} Docs
                        </span>
                      </div>

                      {stageItem.subtitle && (
                        <div className="text-[11px] font-bold text-gray-500 mt-1">
                          {stageItem.subtitle}
                        </div>
                      )}

                      <p className="text-[11px] text-gray-400 mt-1 line-clamp-2 leading-relaxed">
                        {stageItem.description}
                      </p>
                    </div>

                    {/* Doctors List in Stage (Scrollable) */}
                    <div className="p-3 flex-1 space-y-3 bg-[#FAFBFD] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200">
                      {isLoading ? (
                        <div className="py-12 text-center text-gray-400 text-[12px]">
                          Loading doctors...
                        </div>
                      ) : doctorsInStage.length === 0 ? (
                        <div className="py-12 text-center border-2 border-dashed border-gray-200 rounded-[14px] bg-white/60 p-4">
                          <div className="text-[20px] mb-1">📭</div>
                          <div className="text-[12px] font-bold text-gray-400">No Doctors at this Stage</div>
                          <div className="text-[11px] text-gray-400 mt-1">
                            {statusFilter !== 'all' ? 'Try changing filters' : 'Doctors progress as emails dispatch'}
                          </div>
                        </div>
                      ) : (
                        doctorsInStage.map((doc) => {
                          const stageInfo = getDoctorCurrentStage(doc);
                          const statusBadge = getStatusBadge(doc.stage);
                          const StatusIcon = statusBadge.icon;
                          const formattedSentDate = formatDate(stageInfo.lastSentDate);

                          return (
                            <div 
                              key={doc.id}
                              className="bg-white rounded-[16px] p-3.5 border border-gray-200 hover:border-blue-400 hover:shadow-md transition-all group relative space-y-2.5"
                            >
                              {/* Top Row: Avatar & Name */}
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex items-center gap-2.5">
                                  <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 font-bold text-[12px] flex items-center justify-center border border-slate-200 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                    {doc.fullName.replace('Dr. ', '').charAt(0)}
                                  </div>
                                  <div>
                                    <div className="font-bold text-[13px] text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                                      {doc.fullName}
                                    </div>
                                    <div className="text-[11px] text-gray-500 line-clamp-1">
                                      {doc.specialty}
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Details: Clinic & Location */}
                              <div className="text-[11px] text-gray-500 space-y-1 bg-gray-50/80 p-2 rounded-[10px] border border-gray-100">
                                <div className="flex items-center gap-1.5 truncate">
                                  <Building2 className="w-3 h-3 text-gray-400 shrink-0" />
                                  <span className="truncate">{doc.organization}</span>
                                </div>
                                <div className="flex items-center gap-1.5 truncate">
                                  <MapPin className="w-3 h-3 text-gray-400 shrink-0" />
                                  <span className="truncate">{doc.location}</span>
                                </div>
                                <div className="flex items-center gap-1.5 truncate text-gray-600 font-mono text-[10.5px]">
                                  <Mail className="w-3 h-3 text-gray-400 shrink-0" />
                                  <span className="truncate">{doc.email}</span>
                                </div>
                              </div>

                              {/* Sent Date info (if sent) */}
                              {formattedSentDate ? (
                                <div className="text-[11px] font-medium text-blue-700 bg-blue-50/90 px-2.5 py-1 rounded-md border border-blue-100 flex items-center gap-1.5">
                                  <Calendar className="w-3 h-3 text-blue-500 shrink-0" />
                                  <span className="truncate">Sent: {formattedSentDate}</span>
                                </div>
                              ) : (
                                <div className="text-[11px] font-medium text-amber-700 bg-amber-50/80 px-2.5 py-1 rounded-md border border-amber-100 flex items-center gap-1.5">
                                  <Clock className="w-3 h-3 text-amber-500 shrink-0" />
                                  <span>Pending First Email</span>
                                </div>
                              )}

                              {/* Bottom Status & Action Row */}
                              <div className="pt-1 flex items-center justify-between border-t border-gray-100 gap-1">
                                {/* Status Badge */}
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 ${statusBadge.bg}`}>
                                  <StatusIcon className="w-3 h-3" />
                                  <span>{statusBadge.label}</span>
                                </span>

                                {/* View Email Sequence Modal Button */}
                                <button
                                  onClick={() => {
                                    setSelectedDoctor(doc);
                                    setActiveModalTab(stageInfo.lastSentDay || 1);
                                    setIsPreviewOpen(true);
                                  }}
                                  className="text-[11px] font-bold text-gray-600 hover:text-blue-600 flex items-center gap-1 px-2 py-1 hover:bg-blue-50 rounded-lg transition-all cursor-pointer"
                                >
                                  <Eye className="w-3 h-3" />
                                  <span>View Email</span>
                                </button>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                  {/* Flow Connector Arrow between stages */}
                  {index < SEQUENCE_STAGES.length - 1 && (
                    <div className="self-center flex flex-col items-center justify-center shrink-0 px-1 text-gray-300">
                      <div className="w-6 h-6 rounded-full bg-white border border-gray-200 flex items-center justify-center shadow-2xs">
                        <ChevronRight className="w-4 h-4 text-blue-500" />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* EMAIL PREVIEW & SEQUENCE MODAL */}
        {isPreviewOpen && selectedDoctor && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-[24px] max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              {/* Modal Header */}
              <div className="p-5 border-b border-gray-100 flex items-start justify-between bg-slate-900 text-white">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-yellow-400 bg-yellow-400/10 px-2.5 py-0.5 rounded-full border border-yellow-400/20">
                      Physician Email Sequence History
                    </span>
                  </div>
                  <h2 className="text-[20px] font-goudy font-bold text-white mt-1">
                    {selectedDoctor.fullName}
                  </h2>
                  <p className="text-[12px] text-gray-300 mt-0.5">
                    {selectedDoctor.specialty} • {selectedDoctor.organization} ({selectedDoctor.email})
                  </p>
                </div>

                <button
                  onClick={() => setIsPreviewOpen(false)}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Day Selection Tabs (Day 1 to Day 5) */}
              <div className="bg-slate-50 border-b border-gray-200 p-2.5 flex items-center gap-1.5 overflow-x-auto">
                {[1, 2, 3, 4, 5].map((dayNum) => {
                  const dayStep = selectedDoctor.aiSequence?.find(s => s.day === dayNum);
                  const isSent = dayStep?.status === 'sent' || dayStep?.sentAt;

                  return (
                    <button
                      key={dayNum}
                      onClick={() => setActiveModalTab(dayNum)}
                      className={`px-3 py-1.5 rounded-xl text-[12px] font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                        activeModalTab === dayNum
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                      }`}
                    >
                      <span>Day {dayNum}</span>
                      {isSent ? (
                        <CheckCircle2 className={`w-3.5 h-3.5 ${activeModalTab === dayNum ? 'text-white' : 'text-emerald-500'}`} />
                      ) : (
                        <Clock className={`w-3.5 h-3.5 ${activeModalTab === dayNum ? 'text-white' : 'text-gray-400'}`} />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Modal Body: Active Day Email Content */}
              <div className="p-6 flex-1 overflow-y-auto space-y-4">
                {(() => {
                  const currentStep = selectedDoctor.aiSequence?.find(s => s.day === activeModalTab);
                  const isSent = currentStep?.status === 'sent' || currentStep?.sentAt;
                  const formattedDate = formatDate(currentStep?.sentAt);

                  return (
                    <div className="space-y-4">
                      {/* Step Header info */}
                      <div className="flex items-center justify-between bg-blue-50/60 p-3.5 rounded-[14px] border border-blue-100">
                        <div>
                          <div className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">
                            Sequence Step {activeModalTab} of 5
                          </div>
                          <div className="text-[13px] font-bold text-gray-900 mt-0.5">
                            {currentStep?.title || `Day ${activeModalTab} Follow-up Email`}
                          </div>
                        </div>

                        {isSent ? (
                          <div className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Sent {formattedDate ? `on ${formattedDate}` : ''}</span>
                          </div>
                        ) : (
                          <div className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200 flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-amber-600" />
                            <span>Scheduled Drip Step</span>
                          </div>
                        )}
                      </div>

                      {/* Subject Line */}
                      <div className="bg-gray-50 p-3 rounded-[12px] border border-gray-200">
                        <div className="text-[11px] font-bold text-gray-400 uppercase">Subject Line</div>
                        <div className="text-[13px] font-bold text-gray-900 mt-0.5">
                          {currentStep?.subject ? currentStep.subject : <span className="text-gray-400 font-normal italic">— (Email not sent yet)</span>}
                        </div>
                      </div>

                      {/* Body */}
                      <div className="bg-white p-4 rounded-[14px] border border-gray-200 space-y-2">
                        <div className="text-[11px] font-bold text-gray-400 uppercase">Email Content Body</div>
                        {currentStep?.body ? (
                          /<[a-z][\s\S]*>/i.test(currentStep.body) ? (
                            <div 
                              className="text-[13px] text-gray-800 leading-relaxed font-sans [&_p]:mb-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-3 [&_li]:mb-1 [&_strong]:font-bold [&_strong]:text-gray-900 [&_a]:inline-block p-3 rounded-xl bg-gray-50/50 border border-gray-100"
                              dangerouslySetInnerHTML={{ __html: currentStep.body }}
                            />
                          ) : (
                            <div className="text-[13px] text-gray-700 whitespace-pre-wrap leading-relaxed font-sans p-3 rounded-xl bg-gray-50/50 border border-gray-100">
                              {currentStep.body}
                            </div>
                          )
                        ) : (
                          <div className="py-8 text-center text-gray-400 text-[13px] italic border-2 border-dashed border-gray-200 rounded-[12px] bg-gray-50/50">
                            Email not sent yet. This sequence step is pending dispatch.
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Modal Footer */}
              <div className="p-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
                <div className="text-[12px] text-gray-500">
                  Current Database Stage: <strong className="text-gray-900 uppercase font-mono">{selectedDoctor.stage}</strong>
                </div>

                <button
                  onClick={() => setIsPreviewOpen(false)}
                  className="px-5 py-2 bg-gray-900 hover:bg-black text-white text-[13px] font-bold rounded-full transition-all cursor-pointer"
                >
                  Close Preview
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
