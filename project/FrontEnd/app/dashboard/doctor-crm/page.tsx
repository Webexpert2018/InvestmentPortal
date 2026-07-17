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
  AlertCircle, 
  Clock, 
  Calendar, 
  Bot, 
  Send, 
  Loader2, 
  ExternalLink,
  ChevronRight,
  Headphones,
  UserCheck,
  TrendingUp,
  Filter
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
      <div className="mx-auto max-w-7xl font-helvetica text-[#1F1F1F]">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-50 text-blue-600">
                <Target className="w-4 h-4" />
              </span>
              <span className="text-[12px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100">
                Step 2: CRM & Meeting Intelligence
              </span>
            </div>
            <h1 className="font-goudy text-[28px] md:text-[34px] leading-tight text-[#1F1F1F]">
              Doctor Outreach CRM & AI Agent
            </h1>
            <p className="text-[#8E8E93] text-[14px] mt-1 max-w-3xl">
              Manage physician status across multi-channel outreach. Track direct email replies, Luma (`lu.ma`) webinar registrations, and Fireflies-assisted phone follow-ups for non-responders.
            </p>
          </div>
        </div>

        {/* Top KPI Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
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
            <div className="text-[12px] text-[#8E8E93] mt-2">Automated Luma check-in & tracking</div>
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

        {/* OpenAI Executive Assistant Chat Card */}
        <div className="bg-[#1F1F1F] rounded-[22px] p-6 text-white shadow-xl mb-8 border border-gray-800">
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-gray-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FFC63F] to-[#F1B92E] flex items-center justify-center text-[#1F1F1F] shadow-md font-bold">
                <Bot className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-goudy text-[20px] font-bold text-white flex items-center gap-2">
                  OpenAI Executive Assistant
                  <span className="text-[11px] font-bold uppercase tracking-wider bg-[#FFC63F]/20 text-[#FFC63F] px-2.5 py-0.5 rounded-full border border-[#FFC63F]/40">
                    Event-Driven RAG Engine
                  </span>
                </h3>
                <p className="text-[12px] text-gray-400">
                  Learns from every Apollo data point, email reply, Luma registration, and Fireflies call recording.
                </p>
              </div>
            </div>
            <button 
              onClick={() => setAgentMessages([{
                sender: 'agent',
                text: 'Hello! I am your OpenAI + Fireflies Intelligence Agent. Ask me anything about your physician pipeline!',
                timestamp: 'Just now'
              }])}
              className="text-[12px] text-gray-400 hover:text-white transition-colors"
            >
              Clear Chat
            </button>
          </div>

          {/* Chat Messages Area */}
          <div className="max-h-[220px] overflow-y-auto space-y-3 mb-4 pr-2 custom-scrollbar">
            {agentMessages.map((msg, idx) => (
              <div 
                key={idx} 
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div 
                  className={`max-w-2xl px-4 py-3 rounded-[16px] text-[13px] leading-relaxed ${
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
                <span>AI Agent is querying database & Fireflies call transcripts...</span>
              </div>
            )}
          </div>

          {/* Quick Questions & Input */}
          <div className="flex flex-wrap gap-2 mb-3">
            <span className="text-[11px] font-bold text-gray-400 py-1">Quick prompts:</span>
            {[
              'Summarize Dr. David Wiebe from Fireflies call',
              'How many doctors registered on Luma?',
              'Show doctors in Call Queue with positive sentiment'
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
              placeholder="Ask your AI Agent anything about doctor status, call sentiments, or Luma webinar tracking..."
              className="flex-1 bg-black/40 border border-gray-700 rounded-full px-5 py-3 text-[14px] text-white placeholder-gray-500 focus:outline-none focus:border-[#FFC63F] transition-all"
            />
            <button
              type="submit"
              disabled={!agentInput.trim() || isAgentThinking}
              className="w-11 h-11 rounded-full bg-[#FFC63F] hover:bg-[#F1B92E] text-[#1F1F1F] flex items-center justify-center font-bold shadow-md transition-all disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* Pipeline Navigation Tabs & Search */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
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
              <span>Call Queue (Fireflies) ({doctors.filter(d => d.stage === 'call_queue').length})</span>
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
              <span>Luma Registered ({doctors.filter(d => d.stage === 'luma_registered').length})</span>
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
                  <th className="px-6 py-4 text-[12px] font-bold text-[#8E8E93] uppercase tracking-wider">Doctor & Specialty</th>
                  <th className="px-6 py-4 text-[12px] font-bold text-[#8E8E93] uppercase tracking-wider">Practice Location</th>
                  <th className="px-6 py-4 text-[12px] font-bold text-[#8E8E93] uppercase tracking-wider">Stage & Status</th>
                  <th className="px-6 py-4 text-[12px] font-bold text-[#8E8E93] uppercase tracking-wider">AI / Fireflies / Luma Intelligence</th>
                  <th className="px-6 py-4 text-[12px] font-bold text-[#8E8E93] uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F2F2F2]">
                {filteredDoctors.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-16 text-center text-[#8E8E93] text-[14px]">
                      No physician prospects found matching your current filter.
                    </td>
                  </tr>
                ) : (
                  filteredDoctors.map((doc) => (
                    <tr key={doc.id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="px-6 py-5 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-[#1F1F1F] text-white flex items-center justify-center font-bold text-[13px] shadow-sm">
                            {doc.fullName.replace('Dr. ', '').charAt(0)}
                          </div>
                          <div>
                            <div className="text-[15px] font-bold text-[#1F1F1F]">{doc.fullName}</div>
                            <div className="text-[12px] font-semibold text-[#D9A11E] mt-0.5">{doc.specialty}</div>
                            <div className="text-[11px] text-[#8E8E93]">{doc.email}</div>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-5 whitespace-nowrap">
                        <div className="text-[13px] font-bold text-[#1F1F1F]">{doc.organization}</div>
                        <div className="text-[12px] text-[#6C6C6C] mt-0.5">{doc.location}</div>
                        <div className="text-[11px] text-[#8E8E93] mt-0.5">{doc.phone}</div>
                      </td>

                      <td className="px-6 py-5 whitespace-nowrap">
                        {doc.stage === 'call_queue' && (
                          <div>
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-bold bg-amber-50 text-amber-800 border border-amber-300">
                              <PhoneCall className="w-3.5 h-3.5 text-amber-600" />
                              Call Queue (Unresponsive)
                            </span>
                            <div className="text-[11px] text-[#8E8E93] mt-1 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {doc.lastActivityDate}
                            </div>
                          </div>
                        )}
                        {doc.stage === 'email_replied' && (
                          <div>
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                              <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
                              Replied via Email
                            </span>
                            <div className="text-[11px] text-[#8E8E93] mt-1 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {doc.lastActivityDate}
                            </div>
                          </div>
                        )}
                        {doc.stage === 'luma_registered' && (
                          <div>
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                              <Calendar className="w-3.5 h-3.5 text-purple-600" />
                              Luma Registered
                            </span>
                            <div className="text-[11px] text-green-700 font-medium mt-1">
                              No phone call required
                            </div>
                          </div>
                        )}
                        {doc.stage === 'converted_investor' && (
                          <div>
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-bold bg-green-50 text-green-700 border border-green-200">
                              <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                              Converted Investor
                            </span>
                          </div>
                        )}
                      </td>

                      <td className="px-6 py-5 max-w-md">
                        {doc.firefliesSummary && (
                          <div className="bg-[#F8F9FA] rounded-xl p-3 border border-gray-200 text-[12px]">
                            <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-gray-200">
                              <span className="font-bold text-[#1F1F1F] flex items-center gap-1.5">
                                <Headphones className="w-3.5 h-3.5 text-[#D9A11E]" />
                                {doc.firefliesSummary.meetingTitle}
                              </span>
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                doc.firefliesSummary.sentiment === 'Positive' 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-gray-200 text-gray-700'
                              }`}>
                                Sentiment: {doc.firefliesSummary.sentiment}
                              </span>
                            </div>
                            <p className="text-[#4B4B4B] leading-relaxed italic">
                              &ldquo;{doc.firefliesSummary.keyTakeaway}&rdquo;
                            </p>
                          </div>
                        )}

                        {doc.lumaStatus && (
                          <div className="bg-purple-50/70 rounded-xl p-3 border border-purple-100 text-[12px] flex items-center gap-2 text-purple-900 font-medium">
                            <Calendar className="w-4 h-4 text-purple-600 shrink-0" />
                            <span>{doc.lumaStatus}</span>
                          </div>
                        )}

                        {doc.replyMessage && (
                          <div className="bg-blue-50/70 rounded-xl p-3 border border-blue-100 text-[12px]">
                            <div className="font-bold text-blue-900 mb-1 flex items-center gap-1.5">
                              <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
                              Direct Email Reply:
                            </div>
                            <p className="text-blue-950 italic">&ldquo;{doc.replyMessage}&rdquo;</p>
                          </div>
                        )}
                      </td>

                      <td className="px-6 py-5 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-2">
                          {doc.stage === 'call_queue' && (
                            <button
                              onClick={() => toast.success(`Initiated call to ${doc.fullName}. Fireflies AI meeting bot connected for recording & transcription!`)}
                              className="flex items-center gap-1.5 px-4 py-2 rounded-full text-[12px] font-bold bg-[#FFC63F] hover:bg-[#F1B92E] text-[#1F1F1F] shadow-sm transition-all"
                            >
                              <PhoneCall className="w-3.5 h-3.5" />
                              <span>Call + Fireflies</span>
                            </button>
                          )}

                          {doc.stage === 'email_replied' && (
                            <button
                              onClick={() => toast.info(`Opening email thread with ${doc.fullName}...`)}
                              className="flex items-center gap-1.5 px-4 py-2 rounded-full text-[12px] font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-all"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                              <span>Reply to Email</span>
                            </button>
                          )}

                          {doc.stage === 'luma_registered' && (
                            <button
                              onClick={() => toast.info(`Viewing Luma check-in status for ${doc.fullName}...`)}
                              className="flex items-center gap-1.5 px-4 py-2 rounded-full text-[12px] font-bold bg-purple-600 hover:bg-purple-700 text-white shadow-sm transition-all"
                            >
                              <Calendar className="w-3.5 h-3.5" />
                              <span>Luma Status</span>
                            </button>
                          )}

                          <button
                            onClick={() => toast.info(`Full profile history modal for ${doc.fullName}`)}
                            className="p-2 rounded-full text-gray-400 hover:text-[#1F1F1F] hover:bg-gray-100 transition-all"
                            title="View Full Profile & Timeline"
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
    </DashboardLayout>
  );
}
