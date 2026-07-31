'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { DashboardLayout } from '@/components/DashboardLayout';
import {
  Stethoscope,
  Building2,
  MapPin,
  Mail,
  Phone,
  ArrowLeft,
  Sparkles,
  CheckCircle2,
  Clock,
  Send,
  RefreshCw,
  Loader2,
  ShieldCheck,
  UserCheck,
  Calendar,
  FileText,
  TrendingUp,
  Award,
  Plus,
  Trash2
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/lib/contexts/AuthContext';
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

interface DoctorNote {
  id: number;
  prospect_id: string;
  note: string;
  author_name: string;
  created_at: string;
}

const MOCK_DOCTORS: Record<string, DoctorProspect> = {
  '66d7f2c85b1234567890abcd': {
    id: '66d7f2c85b1234567890abcd',
    fullName: 'Dr. David Wiebe, MD',
    specialty: 'Orthopedic Surgery',
    organization: 'Austin Spine & Joint Surgery Center',
    location: 'Austin, TX',
    email: 'xamilo5279@jobraux.com',
    phone: '+1 (512) 555-0192',
    status: 'ai_copy_ready',
    isAlreadyEnriched: true,
    emailStatus: 'verified',
    stage: 'pending_outreach'
  },
  'doc-101': {
    id: 'doc-101',
    fullName: 'Dr. David Wiebe, MD',
    specialty: 'Orthopedic Surgery',
    organization: 'Austin Spine & Joint Surgery Center',
    location: 'Austin, TX',
    email: 'xamilo5279@jobraux.com',
    phone: '+1 (512) 555-0192',
    status: 'ai_copy_ready',
    isAlreadyEnriched: true,
    emailStatus: 'verified',
    stage: 'pending_outreach'
  },
  '66d7f2c85b1234567890abce': {
    id: '66d7f2c85b1234567890abce',
    fullName: 'Dr. Sarah Jenkins, MD',
    specialty: 'Cardiology',
    organization: 'Midwest Heart & Vascular Institute',
    location: 'Chicago, IL',
    email: 'sarah.jenkins@medical-verified.org',
    phone: '+1 (312) 555-0140',
    status: 'ai_copy_ready',
    isAlreadyEnriched: true,
    emailStatus: 'verified',
    stage: 'pending_outreach'
  },
  'doc-102': {
    id: 'doc-102',
    fullName: 'Dr. Sarah Jenkins, MD',
    specialty: 'Cardiology',
    organization: 'Midwest Heart & Vascular Institute',
    location: 'Chicago, IL',
    email: 'sarah.jenkins@medical-verified.org',
    phone: '+1 (312) 555-0140',
    status: 'ai_copy_ready',
    isAlreadyEnriched: true,
    emailStatus: 'verified',
    stage: 'pending_outreach'
  },
  '66d7f2c85b1234567890abcf': {
    id: '66d7f2c85b1234567890abcf',
    fullName: 'Dr. Marcus Vance, MD',
    specialty: 'Dermatology',
    organization: 'Vance Dermatology Group',
    location: 'Miami, FL',
    email: 'marcus.vance@medical-verified.org',
    phone: '+1 (305) 555-0103',
    status: 'ai_copy_ready',
    isAlreadyEnriched: true,
    emailStatus: 'verified',
    stage: 'pending_outreach'
  },
  'doc-103': {
    id: 'doc-103',
    fullName: 'Dr. Marcus Vance, MD',
    specialty: 'Dermatology',
    organization: 'Vance Dermatology Group',
    location: 'Miami, FL',
    email: 'marcus.vance@medical-verified.org',
    phone: '+1 (305) 555-0103',
    status: 'ai_copy_ready',
    isAlreadyEnriched: true,
    emailStatus: 'verified',
    stage: 'pending_outreach'
  }
};

export default function DoctorProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const doctorId = Array.isArray(params?.id) ? params.id[0] : params?.id as string;

  const [doctor, setDoctor] = useState<DoctorProspect | null>(null);
  const [loading, setLoading] = useState(true);
  const [sequenceData, setSequenceData] = useState<any>(null);
  const [activeDay, setActiveDay] = useState<number>(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // Notes state
  const [notes, setNotes] = useState<DoctorNote[]>([]);
  const [newNote, setNewNote] = useState('');
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [loadingNotes, setLoadingNotes] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    if (doctorId) {
      loadDoctorProfile(doctorId);
      loadDoctorNotes(doctorId);
    }
  }, [doctorId, user, authLoading, router]);

  const loadDoctorNotes = async (id: string) => {
    setLoadingNotes(true);
    try {
      const res = await apiClient.getDoctorNotes(id);
      if (res && res.success && Array.isArray(res.notes)) {
        setNotes(res.notes);
      }
    } catch (err: any) {
      console.error('Error fetching doctor notes:', err);
    } finally {
      setLoadingNotes(false);
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim() || !doctor) return;
    setIsSavingNote(true);
    try {
      const author = (user as any)?.name || user?.email?.split('@')[0] || 'Staff';
      const res = await apiClient.addDoctorNote(doctor.id, newNote.trim(), author);
      if (res && res.success && res.note) {
        toast.success('Note saved to database!');
        setNotes(prev => [res.note, ...prev]);
        setNewNote('');
      } else {
        toast.error('Failed to save note.');
      }
    } catch (err: any) {
      toast.error('Error saving note: ' + err.message);
    } finally {
      setIsSavingNote(false);
    }
  };

  const handleDeleteNote = async (noteId: number) => {
    try {
      const res = await apiClient.deleteDoctorNote(noteId);
      if (res && res.success) {
        toast.success('Note deleted from database!');
        setNotes(prev => prev.filter(n => n.id !== noteId));
      } else {
        toast.error('Failed to delete note.');
      }
    } catch (err: any) {
      toast.error('Error deleting note: ' + err.message);
    }
  };

  const loadDoctorProfile = async (id: string) => {
    setLoading(true);
    try {
      // 1. Try loading from database prospects
      const res = await apiClient.getSavedDoctorProspects(100);
      let foundDb: any = null;
      if (res && res.success && Array.isArray(res.prospects)) {
        foundDb = res.prospects.find((p: any) => p.id === id || p.apolloId === id || p.apollo_id === id || p.email === id);
      }

      const docObj: DoctorProspect = {
        id: foundDb?.apolloId || foundDb?.apollo_id || foundDb?.id || id,
        fullName: foundDb?.full_name || foundDb?.fullName || foundDb?.name || MOCK_DOCTORS[id]?.fullName || 'Dr. David Wiebe, MD',
        specialty: foundDb?.specialty || MOCK_DOCTORS[id]?.specialty || 'Orthopedic Surgery',
        organization: foundDb?.organization || foundDb?.clinic || MOCK_DOCTORS[id]?.organization || 'Austin Spine & Joint Surgery Center',
        location: foundDb?.location || MOCK_DOCTORS[id]?.location || 'Austin, TX',
        email: foundDb?.email || MOCK_DOCTORS[id]?.email || 'xamilo5279@jobraux.com',
        phone: foundDb?.phone || MOCK_DOCTORS[id]?.phone || '+1 (512) 555-0192',
        status: foundDb?.stage || 'ai_copy_ready',
        stage: foundDb?.stage || 'pending_outreach',
        emailStatus: foundDb?.email_status || foundDb?.emailStatus || 'verified',
        isAlreadyEnriched: true
      };

      setDoctor(docObj);

      // Extract saved 5-day sequence directly from database record
      const dbSeq = foundDb?.ai_sequence || foundDb?.aiSequence;
      if (dbSeq && Array.isArray(dbSeq) && dbSeq.length > 0) {
        setSequenceData({
          success: true,
          provider: 'PostgreSQL Database',
          sequence: dbSeq
        });
      } else {
        setSequenceData({
          success: true,
          provider: 'PostgreSQL Database',
          sequence: []
        });
      }
    } catch (err: any) {
      toast.error('Error loading doctor profile: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSendTestEmail = async (emailBody: string) => {
    if (!doctor) return;
    setIsSending(true);
    try {
      toast.info(`Dispatching Day ${activeDay} email to ${doctor.fullName} (${doctor.email})...`);
      const res = await apiClient.sendSequenceStepNow(doctor.id, activeDay);
      if (res && res.success) {
        toast.success(`🎉 Day ${activeDay} email sent to ${doctor.fullName}!`);
        setDoctor(prev => prev ? { ...prev, status: 'sent', stage: 'sent' } : null);
        if (res.sequence && Array.isArray(res.sequence)) {
          setSequenceData((prev: any) => prev ? { ...prev, sequence: res.sequence } : { success: true, provider: 'PostgreSQL Database', sequence: res.sequence });
        }
      } else {
        toast.error('Failed to dispatch email.');
      }
    } catch (err: any) {
      toast.error(`Send Error: ${err.message}`);
    } finally {
      setIsSending(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#FFC63F]" />
          <p className="text-[14px] font-bold text-gray-600">Loading Physician Dossier &amp; Saved Copy...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!doctor) {
    return (
      <DashboardLayout>
        <div className="p-8 text-center max-w-md mx-auto">
          <h2 className="text-[20px] font-bold text-[#1F1F1F]">Physician Profile Not Found</h2>
          <p className="text-[14px] text-gray-500 mt-2 mb-6">The requested doctor lead profile could not be retrieved from database records.</p>
          <Link
            href="/dashboard/doctor-leads"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#FFC63F] font-bold text-[13px] text-[#1F1F1F]"
          >
            <ArrowLeft className="w-4 h-4" /> Return to Doctor Leads
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="w-full font-helvetica text-[#1F1F1F] space-y-6 pb-12">
        {/* Navigation Top Bar */}
        <div className="flex items-center justify-between">
          <Link
            href="/dashboard/doctor-leads"
            className="inline-flex items-center gap-2 text-[13px] font-bold text-gray-600 hover:text-[#1F1F1F] transition-colors bg-white px-4 py-2 rounded-xl border border-gray-200 shadow-sm"
          >
            <ArrowLeft className="w-4 h-4 text-[#D9A11E]" />
            <span>Back to Physician Leads Queue</span>
          </Link>
        </div>

        {/* Doctor Header Banner Card */}
        <div className="bg-gradient-to-r from-[#1F2937] via-[#111827] to-[#0F172A] rounded-[24px] p-8 text-white shadow-xl relative overflow-hidden">
          <div className="absolute right-0 top-0 w-96 h-96 bg-[#FFC63F]/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
            <div className="flex items-start sm:items-center gap-5">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#FFC63F] to-[#E0AC27] text-[#1F1F1F] flex items-center justify-center font-extrabold text-[28px] shadow-lg shrink-0 border-2 border-white/20">
                {doctor.fullName.replace('Dr. ', '').charAt(0)}
              </div>

              <div>
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="font-goudy text-[28px] sm:text-[32px] font-bold text-white">{doctor.fullName}</h1>
                  <span className="text-[11px] font-extrabold uppercase px-3 py-1 rounded-full bg-[#FFC63F] text-[#1F1F1F] shadow-sm">
                    {doctor.specialty}
                  </span>
                </div>

                <div className="flex items-center gap-4 text-[14px] text-gray-300 mt-2 flex-wrap">
                  <span className="flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-[#FFC63F]" />
                    {doctor.organization}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-[#FFC63F]" />
                    {doctor.location}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Status Pill */}
            <div className="flex flex-col items-start lg:items-end gap-2 shrink-0 border-t lg:border-t-0 pt-4 lg:pt-0 border-white/10">
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Database Record Status</span>
              <div className="flex items-center gap-2">
                {doctor.stage === 'interested' ? (
                  <span className="px-3.5 py-1.5 rounded-full text-[13px] font-bold bg-green-500/20 text-green-300 border border-green-500/40 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-green-400" /> 🔥 Interested (Clicked Yes)
                  </span>
                ) : doctor.stage === 'sent' || doctor.status === 'sent' ? (
                  <span className="px-3.5 py-1.5 rounded-full text-[13px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/40 flex items-center gap-1.5">
                    <Send className="w-4 h-4 text-blue-400" /> Outreach Email Sent
                  </span>
                ) : (
                  <span className="px-3.5 py-1.5 rounded-full text-[13px] font-bold bg-[#FFC63F]/20 text-[#FFC63F] border border-[#FFC63F]/40 flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-[#FFC63F]" /> Ready for Outreach
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 2-Column Grid: Profile Details & AI Sequence */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Metadata & Investor Profile & Notes */}
          <div className="space-y-6 lg:col-span-1">
            {/* Physician Metadata Card */}
            <div className="bg-white rounded-[20px] p-6 shadow-sm border border-[#F2F2F2] space-y-5">
              <h3 className="text-[16px] font-bold text-[#1F1F1F] pb-3 border-b border-gray-100 flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-[#D9A11E]" />
                <span>Physician Contact &amp; Practice</span>
              </h3>

              <div className="space-y-4 text-[13px]">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-gray-400 mb-0.5">Full Name</label>
                  <div className="font-bold text-[#1F1F1F] text-[15px]">{doctor.fullName}</div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-gray-400 mb-0.5">Medical Specialty</label>
                  <div className="font-bold text-[#1F1F1F] flex items-center gap-1.5">
                    <Stethoscope className="w-4 h-4 text-[#D9A11E]" />
                    {doctor.specialty}
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-gray-400 mb-0.5">Practice / Clinic Name</label>
                  <div className="font-bold text-[#1F1F1F] flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-gray-500" />
                    {doctor.organization}
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-gray-400 mb-0.5">City &amp; Location</label>
                  <div className="font-bold text-[#1F1F1F] flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-gray-500" />
                    {doctor.location}
                  </div>
                </div>

                <div className="pt-2 border-t border-gray-100">
                  <label className="block text-[11px] font-bold uppercase text-gray-400 mb-0.5">Email Address</label>
                  <div className="font-bold text-[#1F1F1F] flex items-center gap-1.5 truncate">
                    <Mail className="w-4 h-4 text-[#D9A11E]" />
                    <span className="truncate">{doctor.email}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-gray-400 mb-0.5">Direct Phone</label>
                  <div className="font-bold text-[#1F1F1F] flex items-center gap-1.5">
                    <Phone className="w-4 h-4 text-gray-500" />
                    {doctor.phone || 'Unavailable'}
                  </div>
                </div>

                <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-[12px]">
                  <span className="text-gray-500">PostgreSQL ID</span>
                  <span className="font-mono text-gray-700 bg-gray-100 px-2 py-0.5 rounded text-[11px]">{doctor.id}</span>
                </div>
              </div>
            </div>

            {/* Doctor Lead Notes Card (Saved in Database) */}
            <div className="bg-white rounded-[20px] p-6 shadow-sm border border-[#F2F2F2] space-y-4">
              <h3 className="text-[16px] font-bold text-[#1F1F1F] pb-3 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-[#D9A11E]" />
                  <span>Physician Notes</span>
                </div>
                <span className="text-[11px] font-bold bg-gray-100 text-gray-700 px-2.5 py-0.5 rounded-full border border-gray-200">
                  {notes.length}
                </span>
              </h3>

              {/* Add Note Form */}
              <div className="space-y-2">
                <textarea
                  rows={3}
                  placeholder="Add a note for this doctor (e.g. Call notes, objections, investment budget, callback time)..."
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-[13px] text-[#1F1F1F] placeholder-gray-400 focus:outline-none focus:border-[#FFC63F] transition-all resize-none"
                />
                <div className="flex justify-end">
                  <button
                    onClick={handleAddNote}
                    disabled={!newNote.trim() || isSavingNote}
                    className="px-4 py-2 bg-[#FFC63F] hover:bg-[#F1B92E] text-[#1F1F1F] text-[12px] font-bold rounded-full shadow-xs flex items-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {isSavingNote ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                    <span>Save Note</span>
                  </button>
                </div>
              </div>

              {/* Notes List */}
              <div className="space-y-3 pt-2 max-h-[300px] overflow-y-auto custom-scrollbar">
                {loadingNotes ? (
                  <div className="flex items-center justify-center py-4 text-gray-400 text-[12px] gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-[#D9A11E]" />
                    <span>Loading notes from database...</span>
                  </div>
                ) : notes.length === 0 ? (
                  <div className="text-center py-6 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                    <p className="text-[12px] text-gray-500">No notes saved for this doctor yet.</p>
                  </div>
                ) : (
                  notes.map((n) => (
                    <div key={n.id} className="p-3.5 bg-[#FFF9EE] border border-[#FFE7A8] rounded-xl space-y-1.5 relative group transition-all">
                      <div className="flex items-center justify-between text-[11px] text-gray-500 font-medium">
                        <span className="font-bold text-[#1F1F1F]">{n.author_name || 'Staff'}</span>
                        <div className="flex items-center gap-2">
                          <span>{new Date(n.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
                          <button
                            onClick={() => handleDeleteNote(n.id)}
                            className="text-gray-400 hover:text-red-600 transition-colors p-1 rounded hover:bg-red-50 cursor-pointer"
                            title="Delete note"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      <p className="text-[13px] text-[#1F1F1F] whitespace-pre-wrap leading-relaxed">
                        {n.note}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Right Column: 5-Day Gemini AI Campaign Drip View */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-[20px] p-6 shadow-sm border border-[#F2F2F2] space-y-5">
              <div className="flex items-center justify-between flex-wrap gap-3 pb-3 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-[#D9A11E]" />
                  <h3 className="text-[18px] font-bold text-[#1F1F1F]">Saved 5-Day Email Campaign Sequence</h3>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-extrabold uppercase px-3 py-1 rounded-full bg-green-100 text-green-800 border border-green-200">
                    💾 Saved in PostgreSQL
                  </span>
                  <span className="text-[11px] font-extrabold uppercase px-3 py-1 rounded-full bg-[#FFC63F] text-[#1F1F1F]">
                    {sequenceData?.provider || 'Google Gemini Flash AI'}
                  </span>
                </div>
              </div>

              {/* Day Tabs Bar */}
              <div className="flex items-center gap-2 border-b border-gray-200 pb-3 overflow-x-auto">
                {[1, 2, 3, 4, 5].map((dayNum) => {
                  const item = sequenceData?.sequence?.find((s: any) => s.day === dayNum);
                  return (
                    <button
                      key={dayNum}
                      onClick={() => setActiveDay(dayNum)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-bold transition-all shrink-0 ${activeDay === dayNum
                          ? 'bg-[#FFC63F] text-[#1F1F1F] shadow-sm border border-[#E0AC27]'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                    >
                      <span>Day {dayNum}</span>
                      {item?.title && <span className="text-[11px] font-normal opacity-80 max-w-[120px] truncate">({item.title.split(':')[1] || item.title})</span>}
                    </button>
                  );
                })}
              </div>

              {/* Selected Day Content */}
              {sequenceData?.sequence && (
                (() => {
                  const activeEmail = sequenceData.sequence.find((s: any) => s.day === activeDay) || sequenceData.sequence[0];
                  if (!activeEmail) return null;

                  return (
                    <div className="space-y-4">
                      {/* Drip Schedule & Status Banner */}
                      <div className="flex items-center justify-between bg-[#FFF9EE] border border-[#FFE7A8] rounded-xl px-4 py-2.5 text-[13px] font-bold text-[#1F1F1F]">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-[#D9A11E]" />
                          <span>Drip Schedule: <strong>{activeEmail.scheduledDate || 'Next Day @ 9:00 AM EST'}</strong></span>
                        </div>
                        {activeEmail.status === 'sent' ? (
                          <span className="text-[11px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-green-100 text-green-800 border border-green-200">
                            ✅ Email Sent
                          </span>
                        ) : (
                          <span className="text-[11px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                            📅 Scheduled for Sending (Mon–Fri)
                          </span>
                        )}
                      </div>

                      {/* Subject Line Display */}
                      <div className="flex items-center justify-between bg-gray-50 rounded-xl p-4 border border-gray-200">
                        <div className="flex-1 pr-4">
                          <label className="block text-[11px] font-bold uppercase text-gray-500 mb-1">Subject Line (Day {activeDay})</label>
                          <div className="text-[15px] font-bold text-[#1F1F1F]">{activeEmail.subject}</div>
                        </div>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(activeEmail.subject);
                            toast.success('Subject line copied!');
                          }}
                          className="text-[12px] font-bold px-3 py-1.5 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 text-gray-700 transition-all shadow-sm shrink-0"
                        >
                          Copy Subject
                        </button>
                      </div>

                      {/* Email Body Copy */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="block text-[11px] font-bold uppercase text-gray-500">Email Body Copy (Day {activeDay})</label>
                          <button
                            onClick={() => {
                              const temp = document.createElement('div');
                              temp.innerHTML = activeEmail.body;
                              navigator.clipboard.writeText(temp.innerText || temp.textContent || '');
                              toast.success('Email copy text copied!');
                            }}
                            className="text-[12px] font-bold text-[#D9A11E] hover:underline"
                          >
                            Copy Body Text
                          </button>
                        </div>

                        <div
                          className="bg-white border border-gray-200 rounded-2xl p-6 shadow-inner text-[14px] leading-relaxed font-sans text-gray-800 space-y-3 min-h-[520px] max-h-[650px] overflow-y-auto custom-scrollbar [&_a]:pointer-events-none [&_a]:cursor-default"
                          dangerouslySetInnerHTML={{ __html: activeEmail.body }}
                        />
                      </div>

                      {/* Bottom Dispatch Action Row */}
                      <div className="pt-4 flex items-center justify-between border-t border-gray-100">
                        <span className="text-[12px] text-gray-500">
                          Target: <strong>{doctor.fullName}</strong> ({doctor.email})
                        </span>

                        <button
                          onClick={() => handleSendTestEmail(activeEmail.body)}
                          disabled={isSending}
                          className="flex items-center gap-2 px-6 py-2.5 rounded-full font-bold text-[13px] bg-[#FFC63F] hover:bg-[#F1B92E] text-[#1F1F1F] transition-all shadow-sm disabled:opacity-50"
                        >
                          {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                          <span>Send Day {activeDay} Email to {doctor.fullName.split(' ')[1] || 'Doctor'}</span>
                        </button>
                      </div>
                    </div>
                  );
                })()
              )}

              {/* Empty state fallback when no sequence is saved in DB yet */}
              {(!sequenceData?.sequence || sequenceData.sequence.length === 0) && (
                <div className="bg-[#F8FAFC] rounded-2xl p-8 text-center border border-dashed border-gray-300 space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-[#FFC63F]/20 text-[#D9A11E] flex items-center justify-center mx-auto">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <h4 className="font-bold text-[16px] text-[#1F1F1F]">No Saved Campaign Copy Yet</h4>
                  <p className="text-[13px] text-gray-600 max-w-md mx-auto">
                    The 5-day email campaign sequence for <strong>{doctor.fullName}</strong> will be generated &amp; saved in PostgreSQL when you launch the campaign from the Doctor Leads Queue.
                  </p>
                  <Link
                    href="/dashboard/doctor-leads"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#1F1F1F] text-white font-bold text-[13px] hover:bg-gray-800 transition-all shadow-sm mt-2"
                  >
                    Go to Doctor Leads Queue &rarr;
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
