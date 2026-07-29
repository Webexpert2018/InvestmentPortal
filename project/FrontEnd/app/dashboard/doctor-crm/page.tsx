'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { 
  Target, 
  Search, 
  PhoneCall, 
  MessageSquare, 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  Calendar, 
  Bot, 
  Send, 
  Loader2, 
  ChevronRight,
  Headphones
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useRouter } from 'next/navigation';

interface CrmDoctor {
  id: string;
  fullName: string;
  specialty: string;
  organization: string;
  location: string;
  email: string;
  phone: string;
  stage: 'email_replied' | 'call_queue' | 'luma_registered' | 'converted_investor';
  lastActivityDate: string;
  lumaStatus?: string;
  firefliesSummary?: {
    meetingTitle: string;
    sentiment: 'Positive' | 'Neutral' | 'Hesitant';
    keyTakeaway: string;
    audioUrl: string;
  };
  replyMessage?: string;
}

const INITIAL_CRM_DOCTORS: CrmDoctor[] = [
  {
    id: 'crm-201',
    fullName: 'Dr. David Wiebe, MD',
    specialty: 'Orthopedic Surgery',
    organization: 'Austin Spine & Joint Center',
    location: 'Austin, TX',
    email: 'dwiebe@austinspine.example.com',
    phone: '+1 (512) 555-0192',
    stage: 'call_queue',
    lastActivityDate: '4 days ago (No email reply)',
    firefliesSummary: {
      meetingTitle: 'Fireflies Intro & Wealth Discovery Call',
      sentiment: 'Positive',
      keyTakeaway: 'Expressed strong interest in tax-advantaged real estate funds; asked about minimum investment tiers.',
      audioUrl: '#'
    }
  },
  {
    id: 'crm-202',
    fullName: 'Dr. Sarah Jenkins, MD',
    specialty: 'Cardiovascular Disease',
    organization: 'Midwest Heart & Vascular Institute',
    location: 'Chicago, IL',
    email: 'sjenkins@midwestheart.example.com',
    phone: '+1 (312) 555-0148',
    stage: 'luma_registered',
    lastActivityDate: 'Registered 2 hours ago via Email CTA',
    lumaStatus: 'Confirmed — Physician Wealth Webinar (Thursday 2 PM EST)'
  },
  {
    id: 'crm-203',
    fullName: 'Dr. Marcus Vance, MD',
    specialty: 'Dermatology & Aesthetics',
    organization: 'Vance Dermatology Group',
    location: 'Miami, FL',
    email: 'mvance@vancederm.example.com',
    phone: '+1 (305) 555-0183',
    stage: 'email_replied',
    lastActivityDate: 'Replied yesterday at 4:15 PM',
    replyMessage: 'Hi! I saw the email about your fund returns. Can you send over the investor deck before Thursday?'
  },
  {
    id: 'crm-204',
    fullName: 'Dr. Elena Rostova, MD',
    specialty: 'Neurology',
    organization: 'Pacific Neuro & Spine Clinic',
    location: 'San Francisco, CA',
    email: 'erostova@pacificneuro.example.com',
    phone: '+1 (415) 555-0129',
    stage: 'call_queue',
    lastActivityDate: '5 days ago (No email reply)',
    firefliesSummary: {
      meetingTitle: 'Pending Initial Outreach Call',
      sentiment: 'Neutral',
      keyTakeaway: 'Scheduled for call queue. Fireflies assistant will auto-join when call initiated.',
      audioUrl: '#'
    }
  },
  {
    id: 'crm-205',
    fullName: 'Dr. Robert Thorne, DMD',
    specialty: 'Oral Surgery & Implantology',
    organization: 'Thorne Surgical Center',
    location: 'Dallas, TX',
    email: 'rthorne@thornesurgical.example.com',
    phone: '+1 (214) 555-0174',
    stage: 'converted_investor',
    lastActivityDate: 'Attended Luma Webinar & Onboarded',
    lumaStatus: 'Attended Full Session (52 mins)'
  }
];

export default function DoctorCrmPage() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const router = useRouter();

  const [doctors, setDoctors] = useState<CrmDoctor[]>(INITIAL_CRM_DOCTORS);
  const [activeTab, setActiveTab] = useState<'all' | 'email_replied' | 'call_queue' | 'luma_registered'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // AI Agent Chat States
  const [agentInput, setAgentInput] = useState('');
  const [agentMessages, setAgentMessages] = useState<Array<{ sender: 'user' | 'agent'; text: string; timestamp: string }>>([
    {
      sender: 'agent',
      text: 'Hello! I am your OpenAI + Fireflies Intelligence Agent. I continuously learn from email replies, Luma webinar registrations, and Fireflies call transcripts. Ask me anything about your physician pipeline!',
      timestamp: 'Just now'
    }
  ]);
  const [isAgentThinking, setIsAgentThinking] = useState(false);

  useEffect(() => {
    if (!authLoading && user && !isAdmin && user.role !== 'investor_relations') {
      toast.error('Access denied. You do not have permission to access Doctor CRM.');
      router.push('/dashboard');
    }
  }, [user, isAdmin, authLoading, router]);

  const handleAgentSend = (queryText: string) => {
    if (!queryText.trim()) return;
    
    const newMsg = {
      sender: 'user' as const,
      text: queryText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setAgentMessages(prev => [...prev, newMsg]);
    setAgentInput('');
    setIsAgentThinking(true);

    setTimeout(() => {
      let responseText = 'Based on our real-time database and Fireflies.ai call transcripts, all 50 daily emails are tracking at a 42% open rate.';
      const lower = queryText.toLowerCase();

      if (lower.includes('wiebe') || lower.includes('orthopedic')) {
        responseText = 'Dr. David Wiebe is in our Call Queue because he did not reply to the email after 4 days. However, during his Fireflies-recorded call today, he expressed strong positive sentiment (88% interest score) about tax-advantaged fund returns. Next step: Send him our Q3 real estate fund summary.';
      } else if (lower.includes('luma') || lower.includes('webinar')) {
        responseText = 'We currently have 18 verified doctors registered via Luma (lu.ma) for the Thursday webinar. Dr. Sarah Jenkins confirmed via the email CTA. Note: You do not need to call Luma attendees, our Fireflies call queue only targets doctors who did not respond to the initial emails.';
      } else if (lower.includes('call') || lower.includes('queue')) {
        responseText = 'There are currently 12 doctors in the Fireflies Call Queue (unresponsive after 4+ days). When you initiate these calls from the dashboard, Fireflies automatically transcribes and extracts key objections right back into this CRM.';
      }

      setAgentMessages(prev => [
        ...prev,
        {
          sender: 'agent',
          text: responseText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
      setIsAgentThinking(false);
    }, 1200);
  };

  const filteredDoctors = doctors.filter(doc => {
    const matchesTab = activeTab === 'all' || doc.stage === activeTab;
    const matchesSearch = 
      doc.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.specialty.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.organization.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.location.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  return (
    <DashboardLayout>
      <div className="w-full font-helvetica text-[#1F1F1F] relative">
        {/* Main Left Scrollable Content Section */}
        <div className="lg:pr-[380px] xl:pr-[420px] space-y-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-50 text-blue-600">
                  <Target className="w-4 h-4" />
                </span>
                <span className="text-[12px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100">
                  Step 2: CRM &amp; Meeting Intelligence
                </span>
              </div>
              <h1 className="font-goudy text-[28px] md:text-[34px] leading-tight text-[#1F1F1F]">
                Doctor Outreach CRM &amp; AI Agent
              </h1>
              <p className="text-[#8E8E93] text-[14px] mt-1 max-w-3xl">
                Manage physician status across multi-channel outreach. Track direct email replies, Luma webinar registrations, and Fireflies-assisted phone follow-ups for non-responders.
              </p>
            </div>
          </div>

          {/* Top 4 KPI Cards Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <div className="bg-white rounded-[18px] p-5 shadow-sm border border-[#F2F2F2]">
              <div className="text-[12px] font-bold uppercase tracking-wider text-[#8E8E93] mb-1">Total Active Pipeline</div>
              <div className="flex items-baseline justify-between">
                <div className="text-[28px] font-goudy font-bold text-[#1F1F1F]">250 Doctors</div>
                <span className="text-[12px] font-bold text-green-600 bg-green-50 px-2.5 py-0.5 rounded-full">
                  5 Batches Sent
                </span>
              </div>
              <div className="text-[12px] text-[#8E8E93] mt-2">Deduplicated physician leads</div>
            </div>

            <div className="bg-white rounded-[18px] p-5 shadow-sm border border-[#F2F2F2]">
              <div className="text-[12px] font-bold uppercase tracking-wider text-[#8E8E93] mb-1">Direct Email Replies</div>
              <div className="flex items-baseline justify-between">
                <div className="text-[28px] font-goudy font-bold text-[#1F1F1F]">24 Doctors</div>
                <span className="text-[12px] font-bold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full">
                  Managed by Staff
                </span>
              </div>
              <div className="text-[12px] text-[#8E8E93] mt-2">Immediate 1-on-1 conversations</div>
            </div>

            <div className="bg-white rounded-[18px] p-5 shadow-sm border border-[#F2F2F2]">
              <div className="text-[12px] font-bold uppercase tracking-wider text-[#8E8E93] mb-1">Luma Webinar Registered</div>
              <div className="flex items-baseline justify-between">
                <div className="text-[28px] font-goudy font-bold text-[#1F1F1F]">18 Doctors</div>
                <span className="text-[12px] font-bold text-purple-600 bg-purple-50 px-2.5 py-0.5 rounded-full">
                  No Call Needed
                </span>
              </div>
              <div className="text-[12px] text-[#8E8E93] mt-2">Automated Luma check-in &amp; tracking</div>
            </div>

            <div className="bg-gradient-to-br from-[#FFF9EE] to-[#FFF0D0] rounded-[18px] p-5 shadow-sm border border-[#FFE7A8]">
              <div className="text-[12px] font-bold uppercase tracking-wider text-[#D9A11E] mb-1">Call Queue (Unresponsive)</div>
              <div className="flex items-baseline justify-between">
                <div className="text-[28px] font-goudy font-bold text-[#1F1F1F]">12 Doctors</div>
                <span className="text-[12px] font-bold text-[#D9A11E] bg-white/80 px-2.5 py-0.5 rounded-full">
                  Fireflies Tracked
                </span>
              </div>
              <div className="text-[12px] text-[#6C6C6C] mt-2">4+ days post-email; scheduled for phone</div>
            </div>
          </div>

          {/* Pipeline Navigation Tabs & Search */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
              <button
                onClick={() => setActiveTab('all')}
                className={`px-5 py-2 rounded-full font-bold text-[13px] transition-all whitespace-nowrap ${
                  activeTab === 'all' 
                    ? 'bg-[#1F1F1F] text-white shadow-sm' 
                    : 'bg-white hover:bg-gray-100 text-[#6C6C6C] border border-[#E8E8E8]'
                }`}
              >
                All Prospects ({doctors.length})
              </button>

              <button
                onClick={() => setActiveTab('email_replied')}
                className={`px-5 py-2 rounded-full font-bold text-[13px] transition-all whitespace-nowrap flex items-center gap-1.5 ${
                  activeTab === 'email_replied' 
                    ? 'bg-blue-600 text-white shadow-sm' 
                    : 'bg-white hover:bg-blue-50 text-blue-700 border border-blue-200'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Email Replied ({doctors.filter(d => d.stage === 'email_replied').length})</span>
              </button>

              <button
                onClick={() => setActiveTab('call_queue')}
                className={`px-5 py-2 rounded-full font-bold text-[13px] transition-all whitespace-nowrap flex items-center gap-1.5 ${
                  activeTab === 'call_queue' 
                    ? 'bg-[#FFC63F] text-[#1F1F1F] shadow-sm' 
                    : 'bg-white hover:bg-amber-50 text-amber-800 border border-amber-300'
                }`}
              >
                <PhoneCall className="w-3.5 h-3.5" />
                <span>Call Queue ({doctors.filter(d => d.stage === 'call_queue').length})</span>
              </button>

              <button
                onClick={() => setActiveTab('luma_registered')}
                className={`px-5 py-2 rounded-full font-bold text-[13px] transition-all whitespace-nowrap flex items-center gap-1.5 ${
                  activeTab === 'luma_registered' 
                    ? 'bg-purple-600 text-white shadow-sm' 
                    : 'bg-white hover:bg-purple-50 text-purple-700 border border-purple-200'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Luma ({doctors.filter(d => d.stage === 'luma_registered').length})</span>
              </button>
            </div>

            <div className="relative max-w-xs w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8E8E93] w-4 h-4" />
              <input
                type="text"
                placeholder="Filter doctors..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-[#E8E8E8] rounded-full py-2 pl-10 pr-4 text-[13px] text-[#1F1F1F] focus:outline-none focus:border-[#FFC63F]"
              />
            </div>
          </div>

          {/* CRM Pipeline Table */}
          <div className="bg-white rounded-[20px] shadow-sm border border-[#F2F2F2] overflow-hidden">
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#F2F2F2] bg-[#FCFCFC]">
                    <th className="px-6 py-4 text-[12px] font-bold text-[#8E8E93] uppercase tracking-wider">Doctor &amp; Specialty</th>
                    <th className="px-6 py-4 text-[12px] font-bold text-[#8E8E93] uppercase tracking-wider">Practice Location</th>
                    <th className="px-6 py-4 text-[12px] font-bold text-[#8E8E93] uppercase tracking-wider">Stage &amp; Status</th>
                    <th className="px-6 py-4 text-[12px] font-bold text-[#8E8E93] uppercase tracking-wider">AI / Fireflies / Luma Intelligence</th>
                    <th className="px-6 py-4 text-[12px] font-bold text-[#8E8E93] uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F2F2F2]">
                  {filteredDoctors.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-[#8E8E93] text-[14px]">
                        No physician prospects found matching this pipeline filter.
                      </td>
                    </tr>
                  ) : (
                    filteredDoctors.map((doc) => (
                      <tr key={doc.id} className="hover:bg-gray-50/80 transition-colors group">
                        <td className="px-6 py-4.5 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#1F1F1F] to-[#333333] text-[#FFC63F] flex items-center justify-center font-bold text-[14px] shadow-xs">
                              {doc.fullName ? doc.fullName.replace('Dr. ', '')[0] : 'D'}
                            </div>
                            <div>
                              <div className="font-bold text-[14px] text-[#1F1F1F] group-hover:text-[#D9A11E] transition-colors">
                                {doc.fullName}
                              </div>
                              <div className="text-[12px] text-[#8E8E93]">{doc.specialty}</div>
                              <div className="text-[11px] text-gray-400">{doc.email}</div>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4.5 whitespace-nowrap">
                          <div className="text-[13px] font-semibold text-[#1F1F1F]">{doc.organization}</div>
                          <div className="text-[12px] text-[#8E8E93]">{doc.location}</div>
                          <div className="text-[11px] text-gray-400 mt-0.5">{doc.phone}</div>
                        </td>

                        <td className="px-6 py-4.5 whitespace-nowrap">
                          <div className="flex flex-col gap-1 items-start">
                            {doc.stage === 'call_queue' && (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-300">
                                <PhoneCall className="w-3.5 h-3.5 text-amber-600" />
                                Call Queue
                              </span>
                            )}
                            {doc.stage === 'email_replied' && (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
                                Replied via Email
                              </span>
                            )}
                            {doc.stage === 'luma_registered' && (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                                <Calendar className="w-3.5 h-3.5 text-purple-600" />
                                Luma Registered
                              </span>
                            )}
                            {doc.stage === 'converted_investor' && (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-green-50 text-green-700 border border-green-200">
                                <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                                Converted Investor
                              </span>
                            )}
                            <span className="text-[11px] text-[#8E8E93] pl-1 font-medium flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {doc.lastActivityDate}
                            </span>
                          </div>
                        </td>

                        <td className="px-6 py-4.5">
                          <div className="max-w-md bg-gray-50 rounded-xl p-3 border border-gray-100 space-y-1.5">
                            {doc.firefliesSummary && (
                              <div className="space-y-1">
                                <div className="flex items-center justify-between gap-2">
                                  <span className="text-[11px] font-bold text-[#1F1F1F] flex items-center gap-1">
                                    <Headphones className="w-3 h-3 text-[#D9A11E]" />
                                    {doc.firefliesSummary.meetingTitle}
                                  </span>
                                  <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${
                                    doc.firefliesSummary.sentiment === 'Positive' 
                                      ? 'bg-green-100 text-green-800 border-green-200' 
                                      : 'bg-gray-200 text-gray-700 border-gray-300'
                                  }`}>
                                    Sentiment: {doc.firefliesSummary.sentiment}
                                  </span>
                                </div>
                                <p className="text-[12px] text-gray-600 italic leading-relaxed">
                                  &ldquo;{doc.firefliesSummary.keyTakeaway}&rdquo;
                                </p>
                              </div>
                            )}
                            {doc.lumaStatus && (
                              <div className="text-[12px] text-purple-900 font-medium flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                                <span>{doc.lumaStatus}</span>
                              </div>
                            )}
                            {doc.replyMessage && (
                              <div className="text-[12px] text-blue-900">
                                <span className="font-bold">Email Reply: </span>
                                <span className="italic">&ldquo;{doc.replyMessage}&rdquo;</span>
                              </div>
                            )}
                          </div>
                        </td>

                        <td className="px-6 py-4.5 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-2">
                            {doc.stage === 'call_queue' && (
                              <button
                                onClick={() => toast.success(`Initiated call to ${doc.fullName}. Fireflies AI meeting bot connected!`)}
                                className="px-4 py-2 rounded-full text-[12px] font-bold bg-[#FFC63F] hover:bg-[#F1B92E] text-[#1F1F1F] shadow-xs flex items-center gap-1.5 transition-all"
                              >
                                <PhoneCall className="w-3.5 h-3.5" />
                                <span>Call + Fireflies</span>
                              </button>
                            )}
                            {doc.stage === 'email_replied' && (
                              <button
                                onClick={() => toast.info(`Opening email thread with ${doc.fullName}...`)}
                                className="px-4 py-2 rounded-full text-[12px] font-bold bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 flex items-center gap-1.5 transition-all"
                              >
                                <MessageSquare className="w-3.5 h-3.5" />
                                <span>View Reply</span>
                              </button>
                            )}
                            {doc.stage === 'luma_registered' && (
                              <button
                                onClick={() => toast.info(`Viewing Luma check-in status for ${doc.fullName}...`)}
                                className="px-4 py-2 rounded-full text-[12px] font-bold bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 flex items-center gap-1.5 transition-all"
                              >
                                <Calendar className="w-3.5 h-3.5" />
                                <span>Luma Status</span>
                              </button>
                            )}
                            <button
                              onClick={() => toast.info(`Full profile history modal for ${doc.fullName}`)}
                              className="p-2 rounded-full text-gray-400 hover:text-[#1F1F1F] hover:bg-gray-100 transition-all"
                              title="View Details"
                            >
                              <ChevronRight className="w-4 h-4" />
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
        </div>

        {/* Dedicated Fixed Right Sidebar: OpenAI Executive Assistant */}
        <div className="hidden lg:block fixed right-6 top-[90px] bottom-6 w-[350px] xl:w-[390px] z-20">
          <div className="bg-[#1F1F1F] rounded-[22px] p-5 text-white shadow-xl border border-gray-800 flex flex-col h-full justify-between">
            <div className="flex flex-col flex-1 min-h-0">
              <div className="flex items-start justify-between pb-4 mb-4 border-b border-gray-800 gap-2 shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FFC63F] to-[#F1B92E] flex items-center justify-center text-[#1F1F1F] shadow-md font-bold shrink-0">
                    <Bot className="w-6 h-6" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-goudy text-[18px] font-bold text-white flex items-center gap-2 flex-wrap leading-snug">
                      Executive Assistant
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-[#FFC63F]/20 text-[#FFC63F] px-2 py-0.5 rounded-full border border-[#FFC63F]/40">
                        RAG Engine
                      </span>
                    </h3>
                    <p className="text-[11px] text-gray-400 truncate">
                      Learns from email, Luma &amp; Fireflies transcripts.
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setAgentMessages([{
                    sender: 'agent',
                    text: 'Hello! I am your OpenAI + Fireflies Intelligence Agent. Ask me anything about your physician pipeline!',
                    timestamp: 'Just now'
                  }])}
                  className="text-[11px] text-gray-400 hover:text-white transition-colors shrink-0 whitespace-nowrap"
                >
                  Clear Chat
                </button>
              </div>

              {/* Scrollable Chat Area */}
              <div className="flex-1 overflow-y-auto space-y-3 mb-4 pr-2 custom-scrollbar">
                {agentMessages.map((msg, idx) => (
                  <div 
                    key={idx} 
                    className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                  >
                    <div 
                      className={`max-w-[90%] px-4 py-3 rounded-[16px] text-[13px] leading-relaxed ${
                        msg.sender === 'user' 
                          ? 'bg-[#FFC63F] text-[#1F1F1F] font-semibold rounded-br-none shadow-sm' 
                          : 'bg-white/10 text-gray-200 rounded-bl-none border border-white/10'
                      }`}
                    >
                      {msg.text}
                    </div>
                    <span className="text-[10px] text-gray-500 mt-1 px-1">{msg.timestamp}</span>
                  </div>
                ))}
                {isAgentThinking && (
                  <div className="flex items-center gap-2 text-gray-400 text-[13px] py-2">
                    <Loader2 className="w-4 h-4 animate-spin text-[#FFC63F]" />
                    <span>AI Agent is querying database &amp; call transcripts...</span>
                  </div>
                )}
              </div>
            </div>

            <div className="shrink-0 pt-2 border-t border-gray-800/80">
              {/* Quick Questions & Input */}
              <div className="flex flex-wrap gap-1.5 mb-3">
                <span className="text-[11px] font-bold text-gray-400 py-1">Quick prompts:</span>
                {[
                  'Summarize Dr. David Wiebe',
                  'Luma registered doctors',
                  'Call Queue positive sentiment'
                ].map((chip, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleAgentSend(chip)}
                    className="text-[11px] font-medium bg-white/5 hover:bg-white/15 text-gray-300 px-3 py-1 rounded-full border border-white/10 transition-colors"
                  >
                    {chip}
                  </button>
                ))}
              </div>

              <form 
                onSubmit={(e) => { e.preventDefault(); handleAgentSend(agentInput); }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  value={agentInput}
                  onChange={(e) => setAgentInput(e.target.value)}
                  placeholder="Ask AI Agent anything..."
                  className="flex-1 bg-black/40 border border-gray-700 rounded-full px-5 py-3 text-[14px] text-white placeholder-gray-500 focus:outline-none focus:border-[#FFC63F] transition-all"
                />
                <button
                  type="submit"
                  disabled={!agentInput.trim() || isAgentThinking}
                  className="w-11 h-11 rounded-full bg-[#FFC63F] hover:bg-[#F1B92E] text-[#1F1F1F] flex items-center justify-center font-bold shadow-md transition-all disabled:opacity-50 shrink-0"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}
