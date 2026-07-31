"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/DashboardLayout';
import { useAuth } from '@/lib/contexts/AuthContext';
import { apiClient } from '@/lib/api/client';
import { toast } from 'sonner';
import {
  Video,
  Calendar as CalendarIcon,
  Users,
  Clock,
  Plus,
  ChevronDown,
  ChevronUp,
  Search,
  ExternalLink,
  Copy,
  Check,
  X,
  Stethoscope,
  Building2,
  Mail,
  Phone,
  CheckCircle2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';

interface Attendee {
  id: string;
  fullName: string;
  specialty: string;
  organization: string;
  location: string;
  email: string;
  phone: string;
  status: 'attended' | 'registered' | 'no_show';
  joinTime?: string;
  duration?: string;
}

interface Webinar {
  id: string;
  title: string;
  description: string;
  date: string; // YYYY-MM-DD
  formattedDate: string;
  time: string;
  duration: string;
  meetingLink: string;
  status: 'upcoming' | 'live' | 'completed';
  attendees: Attendee[];
  totalPassesSent?: number;
  totalJoined?: number;
  noShowCount?: number;
}

export default function WebinarsPage() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const router = useRouter();

  const [webinars, setWebinars] = useState<Webinar[]>([]);
  const [isLoadingWebinars, setIsLoadingWebinars] = useState(true);
  const [expandedWebinarIds, setExpandedWebinarIds] = useState<Record<string, boolean>>({});
  const [activeTab, setActiveTab] = useState<'all' | 'upcoming' | 'completed'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string | null>(null);

  // Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('04:00 PM EST');
  const [newDuration, setNewDuration] = useState('45 mins');
  const [newMeetingLink, setNewMeetingLink] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Calendar State
  const [currentCalendarMonth, setCurrentCalendarMonth] = useState<Date>(new Date(2026, 7, 1)); // August 2026

  useEffect(() => {
    if (!authLoading && user) {
      if (!isAdmin && user.role !== 'investor_relations') {
        toast.error('Access denied. You do not have permission to view Webinars.');
        router.push('/dashboard');
      } else {
        loadWebinarsFromDb();
      }
    }
  }, [user, isAdmin, authLoading, router]);

  const loadWebinarsFromDb = async () => {
    setIsLoadingWebinars(true);
    try {
      const res = await apiClient.getWebinars();
      if (res && res.success && Array.isArray(res.webinars)) {
        setWebinars(res.webinars);
        if (res.webinars.length > 0) {
          // Expand first webinar by default
          setExpandedWebinarIds({ [res.webinars[0].id]: true });
        }
      }
    } catch (err: any) {
      console.error('Error loading webinars:', err);
      toast.error('Failed to load webinars from database.');
    } finally {
      setIsLoadingWebinars(false);
    }
  };

  const toggleExpand = (webinarId: string) => {
    setExpandedWebinarIds((prev) => ({
      ...prev,
      [webinarId]: !prev[webinarId],
    }));
  };

  const handleCopyLink = (link: string, id: string) => {
    navigator.clipboard.writeText(link);
    setCopiedId(id);
    toast.success('Meeting link copied to clipboard!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCreateWebinar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDate || !newMeetingLink.trim()) {
      toast.error('Please fill in Title, Date, and Meeting Link.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await apiClient.createWebinar({
        title: newTitle.trim(),
        description: newDescription.trim(),
        webinarDate: newDate,
        webinarTime: newTime.trim() || '04:00 PM EST',
        duration: newDuration.trim() || '45 mins',
        meetingLink: newMeetingLink.trim(),
      });

      if (res && res.success && res.webinar) {
        toast.success('🎉 Webinar scheduled & saved to PostgreSQL!');
        setWebinars((prev) => [res.webinar, ...prev]);
        setExpandedWebinarIds((prev) => ({ ...prev, [res.webinar.id]: true }));
        setIsCreateModalOpen(false);

        // Reset Form
        setNewTitle('');
        setNewDescription('');
        setNewDate('');
        setNewTime('04:00 PM EST');
        setNewDuration('45 mins');
        setNewMeetingLink('');
      } else {
        toast.error('Failed to save webinar record.');
      }
    } catch (err: any) {
      console.error('Error creating webinar:', err);
      toast.error(err.message || 'Error creating webinar');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter Webinars
  const filteredWebinars = webinars.filter((webinar) => {
    let matchesTab = true;
    if (activeTab === 'upcoming') matchesTab = webinar.status === 'upcoming' || webinar.status === 'live';
    if (activeTab === 'completed') matchesTab = webinar.status === 'completed';

    let matchesDate = true;
    if (selectedCalendarDate) {
      matchesDate = webinar.date === selectedCalendarDate;
    }

    let matchesSearch = true;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const inWebinar = webinar.title.toLowerCase().includes(q) || (webinar.description && webinar.description.toLowerCase().includes(q));
      const inAttendees = webinar.attendees.some(
        (a) =>
          a.fullName.toLowerCase().includes(q) ||
          a.specialty.toLowerCase().includes(q) ||
          a.email.toLowerCase().includes(q)
      );
      matchesSearch = inWebinar || inAttendees;
    }

    return matchesTab && matchesDate && matchesSearch;
  });

  // Calculate Quick Stats (Unique Doctors across all webinars)
  const totalWebinars = webinars.length;
  const uniqueDoctorIds = new Set<string>();
  webinars.forEach((w) => {
    (w.attendees || []).forEach((att) => {
      if (att.id) uniqueDoctorIds.add(att.id);
    });
  });
  const totalAttendeesCount = uniqueDoctorIds.size;
  const upcomingCount = webinars.filter((w) => w.status === 'upcoming' || w.status === 'live').length;

  // Mini Calendar Calculations
  const year = currentCalendarMonth.getFullYear();
  const month = currentCalendarMonth.getMonth();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const webinarDatesSet = new Set(webinars.map((w) => w.date));

  const prevMonth = () => setCurrentCalendarMonth(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentCalendarMonth(new Date(year, month + 1, 1));

  return (
    <DashboardLayout>
      <div className="w-full font-helvetica text-[#1F1F1F] space-y-4">
        {/* Top Section: Header & KPIs on Left (8 Cols), Calendar & Action Buttons on Right (4 Cols) */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
          {/* Left Column: Header Box + 3 KPI Cards */}
          <div className="md:col-span-8 flex flex-col gap-4">
            {/* Header Box */}
            <div className="bg-white p-5 rounded-[20px] border border-[#F0F0F0] shadow-sm">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-50 border border-amber-200/60 rounded-full text-amber-800 text-[11px] font-bold uppercase tracking-wider mb-2">
                <Video className="w-3.5 h-3.5 text-amber-600" />
                <span>Physician Engagement Center</span>
              </div>
              <h1 className="text-[26px] font-goudy font-bold text-[#1F1F1F] tracking-tight">
                Webinar Management &amp; Attendance
              </h1>
              <p className="text-[13px] text-[#6C6C6C] mt-1">
                Schedule live investor webinars, track physician attendance date-wise, and manage access links.
              </p>
            </div>

            {/* 3 KPI Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div className="bg-white rounded-[18px] p-4 border border-[#F2F2F2] shadow-sm">
                <div className="text-[10px] font-bold uppercase tracking-wider text-[#8E8E93] mb-1">TOTAL WEBINARS</div>
                <div className="flex items-baseline justify-between">
                  <span className="text-[24px] font-goudy font-bold text-[#1F1F1F]">
                    {isLoadingWebinars ? '...' : `${totalWebinars} Sessions`}
                  </span>
                  <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">Date-Wise</span>
                </div>
                <div className="text-[11px] text-[#8E8E93] mt-1.5">Active physician briefings</div>
              </div>

              <div className="bg-white rounded-[18px] p-4 border border-[#F2F2F2] shadow-sm">
                <div className="text-[10px] font-bold uppercase tracking-wider text-[#8E8E93] mb-1">TOTAL ATTENDEES</div>
                <div className="flex items-baseline justify-between">
                  <span className="text-[24px] font-goudy font-bold text-[#1F1F1F]">
                    {isLoadingWebinars ? '...' : `${totalAttendeesCount} Doctors`}
                  </span>
                  <span className="text-[10px] font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded-full">Tracked</span>
                </div>
                <div className="text-[11px] text-[#8E8E93] mt-1.5">RSVPs &amp; live session attendees</div>
              </div>

              <div className="bg-white rounded-[18px] p-4 border border-[#F2F2F2] shadow-sm">
                <div className="text-[10px] font-bold uppercase tracking-wider text-[#8E8E93] mb-1">UPCOMING WEBINARS</div>
                <div className="flex items-baseline justify-between">
                  <span className="text-[24px] font-goudy font-bold text-[#1F1F1F]">
                    {isLoadingWebinars ? '...' : `${upcomingCount} Active`}
                  </span>
                  <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">Scheduled</span>
                </div>
                <div className="text-[11px] text-[#8E8E93] mt-1.5">Ready for physician registration</div>
              </div>
            </div>
          </div>

          {/* Right Column: Calendar Widget + Action Buttons below */}
          <div className="md:col-span-4 flex flex-col gap-3">
            {/* Calendar Widget Moved ALL THE WAY UP */}
            <div className="bg-white rounded-[20px] p-4 border border-[#F0F0F0] shadow-sm space-y-2.5">
              <div className="flex items-center justify-between border-b border-[#F4F4F4] pb-2">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4 text-amber-600" />
                  <h3 className="text-[14px] font-bold text-[#1F1F1F]">Webinar Calendar</h3>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={prevMonth}
                    className="p-1 hover:bg-gray-100 rounded-lg text-gray-600 transition-colors"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-[11px] font-bold text-gray-800 px-1">
                    {currentCalendarMonth.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                  </span>
                  <button
                    onClick={nextMonth}
                    className="p-1 hover:bg-gray-100 rounded-lg text-gray-600 transition-colors"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Days of Week Header */}
              <div className="grid grid-cols-7 text-center text-[10px] font-bold text-[#8E8E93] uppercase">
                <span>Su</span>
                <span>Mo</span>
                <span>Tu</span>
                <span>We</span>
                <span>Th</span>
                <span>Fr</span>
                <span>Sa</span>
              </div>

              {/* Days Grid */}
              <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-medium">
                {Array.from({ length: firstDayOfMonth }).map((_, idx) => (
                  <div key={`blank-${idx}`} className="h-6.5" />
                ))}

                {Array.from({ length: daysInMonth }).map((_, idx) => {
                  const dayNum = idx + 1;
                  const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                  const hasWebinar = webinarDatesSet.has(dateString);
                  const isSelected = selectedCalendarDate === dateString;

                  return (
                    <button
                      key={`day-${dayNum}`}
                      onClick={() => {
                        if (isSelected) {
                          setSelectedCalendarDate(null);
                        } else {
                          setSelectedCalendarDate(dateString);
                        }
                      }}
                      className={`h-6.5 rounded-full flex flex-col items-center justify-center relative transition-all ${
                        isSelected
                          ? 'bg-[#FFC63F] text-[#1F1F1F] font-bold shadow-sm'
                          : hasWebinar
                          ? 'bg-amber-50 text-amber-900 font-bold hover:bg-amber-100'
                          : 'hover:bg-gray-100 text-gray-700'
                      }`}
                    >
                      <span>{dayNum}</span>
                      {hasWebinar && !isSelected && (
                        <span className="w-1.5 h-1.5 bg-amber-600 rounded-full absolute bottom-0.5" />
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="pt-2 border-t border-[#F4F4F4] text-[10px] text-[#8E8E93] flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-600"></span>
                  Webinar Event Day
                </span>
                {selectedCalendarDate && (
                  <button
                    onClick={() => setSelectedCalendarDate(null)}
                    className="text-amber-700 hover:underline font-bold"
                  >
                    Reset Filter
                  </button>
                )}
              </div>
            </div>

            {/* Action Buttons Moved DOWN below Calendar */}
            <div className="flex items-center gap-2.5">
              <button
                onClick={loadWebinarsFromDb}
                className="p-3 bg-white border border-[#E8E8E8] hover:bg-gray-50 rounded-xl text-gray-700 transition-all shadow-sm"
                title="Refresh DB Data"
              >
                <RefreshCw className={`w-4 h-4 ${isLoadingWebinars ? 'animate-spin' : ''}`} />
              </button>

              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="flex-1 flex items-center justify-center gap-2 bg-[#FFC63F] hover:bg-[#F2B62D] text-[#1F1F1F] px-4 py-3 rounded-xl font-bold text-[14px] shadow-sm transition-all whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                <span>Create Webinar</span>
              </button>
            </div>
          </div>
        </div>

        {/* Main Content Area: Date-Wise Webinars List */}
        <div className="space-y-5">
          {/* Filter Tabs & Search Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-[18px] border border-[#F0F0F0] shadow-sm">
            <div className="flex items-center gap-2 overflow-x-auto">
              <button
                onClick={() => setActiveTab('all')}
                className={`px-4 py-2 rounded-full font-bold text-[13px] transition-all whitespace-nowrap ${
                  activeTab === 'all'
                    ? 'bg-[#FFC63F] text-[#1F1F1F] shadow-sm'
                    : 'bg-white hover:bg-gray-100 text-[#6C6C6C]'
                }`}
              >
                All Webinars ({totalWebinars})
              </button>
              <button
                onClick={() => setActiveTab('upcoming')}
                className={`px-4 py-2 rounded-full font-bold text-[13px] transition-all whitespace-nowrap ${
                  activeTab === 'upcoming'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-white hover:bg-blue-50 text-blue-700 border border-blue-200'
                }`}
              >
                Upcoming ({upcomingCount})
              </button>
              <button
                onClick={() => setActiveTab('completed')}
                className={`px-4 py-2 rounded-full font-bold text-[13px] transition-all whitespace-nowrap ${
                  activeTab === 'completed'
                    ? 'bg-gray-800 text-white shadow-sm'
                    : 'bg-white hover:bg-gray-100 text-gray-700 border border-gray-200'
                }`}
              >
                Completed ({totalWebinars - upcomingCount})
              </button>
            </div>

            <div className="relative max-w-xs w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8E8E93] w-4 h-4" />
              <input
                type="text"
                placeholder="Filter webinars or attendees..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#F8F9FA] border border-[#E8E8E8] rounded-full py-2 pl-9 pr-4 text-[13px] focus:outline-none focus:border-[#FFC63F]"
              />
            </div>
          </div>

          {/* Selected Calendar Date Filter Tag */}
          {selectedCalendarDate && (
            <div className="flex items-center justify-between bg-amber-50 border border-amber-200 px-4 py-2.5 rounded-xl text-[13px] text-amber-900 font-medium">
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-amber-600" />
                <span>Showing webinars for date: <strong>{selectedCalendarDate}</strong></span>
              </div>
              <button
                onClick={() => setSelectedCalendarDate(null)}
                className="text-amber-700 hover:text-amber-900 underline text-[12px] font-bold"
              >
                Clear Filter
              </button>
            </div>
          )}

          {/* Webinars Collapsible List */}
          {isLoadingWebinars ? (
            <div className="bg-white p-12 text-center rounded-[20px] border border-[#F0F0F0]">
              <div className="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-[14px] text-gray-600 font-medium">Loading dynamic webinars from database...</p>
            </div>
          ) : filteredWebinars.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-[20px] border border-[#F0F0F0] space-y-3">
              <Video className="w-12 h-12 text-gray-300 mx-auto" />
              <p className="text-[16px] font-bold text-gray-700">No Webinars Found</p>
              <p className="text-[13px] text-[#8E8E93] max-w-md mx-auto">
                There are no scheduled webinars matching your active filters. Click "+ Create Webinar" to add one!
              </p>
            </div>
          ) : (
            filteredWebinars.map((webinar) => {
              const isExpanded = !!expandedWebinarIds[webinar.id];
              return (
                <div
                  key={webinar.id}
                  className="bg-white rounded-[22px] border border-[#F0F0F0] shadow-sm hover:border-[#E4E4E4] transition-all overflow-hidden"
                >
                  {/* Collapsible Card Header */}
                  <div className="p-5 md:p-6 bg-white space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {/* Date Badge */}
                        <span className="bg-gray-100 text-gray-800 text-[12px] font-bold px-3 py-1 rounded-full flex items-center gap-1.5 border border-gray-200">
                          <CalendarIcon className="w-3.5 h-3.5 text-gray-600" />
                          {webinar.formattedDate || webinar.date}
                        </span>

                        {/* Webinar Status & Attendance Metric Badges */}
                      <div className="flex flex-wrap items-center gap-2">
                        {webinar.status === 'upcoming' && (
                          <span className="bg-blue-50 text-blue-700 border border-blue-200/80 text-[11px] font-bold px-3 py-1 rounded-full flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse"></span>
                            Upcoming
                          </span>
                        )}
                        {webinar.status === 'live' && (
                          <span className="bg-emerald-500 text-white text-[11px] font-extrabold px-3 py-1 rounded-full flex items-center gap-1 shadow-xs animate-pulse">
                            <Video className="w-3.5 h-3.5" />
                            LIVE NOW
                          </span>
                        )}
                        {webinar.status === 'completed' && (
                          <span className="bg-gray-100 text-gray-600 border border-gray-200 text-[11px] font-bold px-3 py-1 rounded-full flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-gray-500" />
                            Completed
                          </span>
                        )}

                        {/* Breakdown Metrics */}
                        <span className="bg-amber-50 text-amber-900 border border-amber-200/80 text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                          📩 Passes Sent: {webinar.totalPassesSent ?? webinar.attendees.length}
                        </span>
                        <span className="bg-emerald-50 text-emerald-800 border border-emerald-200/80 text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                          🟢 Joined: {webinar.totalJoined ?? webinar.attendees.filter(a => a.status === 'attended').length}
                        </span>
                        <span className="bg-rose-50 text-rose-800 border border-rose-200/80 text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                          ⚠️ No-Shows: {webinar.noShowCount ?? webinar.attendees.filter(a => a.status !== 'attended').length}
                        </span>
                      </div>
                      </div>

                      {/* Time & Duration */}
                      <div className="flex items-center gap-2 text-[12px] font-semibold text-[#6C6C6C]">
                        <Clock className="w-3.5 h-3.5 text-amber-600" />
                        <span>{webinar.time}</span>
                        <span className="text-gray-300">•</span>
                        <span>{webinar.duration}</span>
                      </div>
                    </div>

                    {/* Title & Description */}
                    <div>
                      <h2 className="text-[20px] font-goudy font-bold text-[#1F1F1F] leading-snug">
                        {webinar.title}
                      </h2>
                      <p className="text-[13px] text-[#6C6C6C] mt-1.5 leading-relaxed">
                        {webinar.description}
                      </p>
                    </div>

                    {/* Actions Bar */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#F4F4F4]">
                      {/* Meeting Link Trigger */}
                      <div className="flex items-center gap-2 max-w-full overflow-hidden">
                        <a
                          href={webinar.meetingLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-gray-900 hover:bg-black text-white text-[12px] font-bold px-4 py-2 rounded-full flex items-center gap-1.5 transition-all shadow-sm shrink-0"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>Join Meeting</span>
                        </a>

                        <button
                          onClick={() => handleCopyLink(webinar.meetingLink, webinar.id)}
                          className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-[12px] font-medium px-3 py-2 rounded-full flex items-center gap-1 transition-all"
                          title="Copy Meeting Link"
                        >
                          {copiedId === webinar.id ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-green-600" />
                              <span className="text-green-700 font-bold">Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5 text-gray-500" />
                              <span className="hidden sm:inline">Copy Link</span>
                            </>
                          )}
                        </button>
                      </div>

                      {/* Accordion Expand Button */}
                      <button
                        onClick={() => toggleExpand(webinar.id)}
                        className="flex items-center gap-2 text-[13px] font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200/80 px-4 py-2 rounded-full transition-all"
                      >
                        <Users className="w-4 h-4 text-amber-700" />
                        <span>
                          {isExpanded ? 'Hide Attendees' : `View Attendees (${webinar.attendees.length})`}
                        </span>
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Collapsible Attendee Details Content */}
                  {isExpanded && (
                    <div className="bg-[#FAFBFD] border-t border-[#EDEDED] p-5 md:p-6 space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-[14px] font-bold text-[#1F1F1F] flex items-center gap-2">
                          <Users className="w-4 h-4 text-amber-600" />
                          <span>Registered Physician Attendees ({webinar.attendees.length})</span>
                        </h3>
                        <span className="text-[12px] text-[#8E8E93]">
                          Real-time attendance logs
                        </span>
                      </div>

                      {webinar.attendees.length === 0 ? (
                        <div className="p-6 text-center bg-white rounded-xl border border-dashed border-gray-200">
                          <p className="text-[13px] text-[#8E8E93]">No physician RSVPs recorded yet for this session.</p>
                        </div>
                      ) : (
                        <div className="bg-white rounded-xl border border-[#EBEBEB] overflow-x-auto shadow-xs">
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="bg-[#F8F9FA] text-[11px] font-bold text-[#8E8E93] uppercase tracking-wider border-b border-[#EBEBEB]">
                                <th className="py-3 px-4">Physician &amp; Specialty</th>
                                <th className="py-3 px-4">Contact Details</th>
                                <th className="py-3 px-4">Organization &amp; Location</th>
                                <th className="py-3 px-4">RSVP Status</th>
                                <th className="py-3 px-4 text-right">Join Log</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-[#F2F2F2] text-[13px]">
                              {webinar.attendees.map((attendee) => (
                                <tr key={attendee.id} className="hover:bg-amber-50/30 transition-colors">
                                  {/* Name & Specialty */}
                                  <td className="py-3.5 px-4">
                                    <div className="flex items-center gap-3">
                                      <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-900 font-bold text-[13px] flex items-center justify-center shrink-0">
                                        {attendee.fullName.charAt(0)}
                                      </div>
                                      <div>
                                        <div className="font-bold text-[#1F1F1F]">{attendee.fullName}</div>
                                        <div className="text-[11px] text-[#6C6C6C] flex items-center gap-1 mt-0.5">
                                          <Stethoscope className="w-3 h-3 text-amber-600" />
                                          <span>{attendee.specialty}</span>
                                        </div>
                                      </div>
                                    </div>
                                  </td>

                                  {/* Contact Info */}
                                  <td className="py-3.5 px-4 text-[#4B5563]">
                                    <div className="space-y-0.5 text-[12px]">
                                      <div className="flex items-center gap-1.5">
                                        <Mail className="w-3 h-3 text-gray-400" />
                                        <a href={`mailto:${attendee.email}`} className="hover:underline text-gray-800 font-medium">
                                          {attendee.email}
                                        </a>
                                      </div>
                                      <div className="flex items-center gap-1.5 text-gray-500">
                                        <Phone className="w-3 h-3 text-gray-400" />
                                        <span>{attendee.phone}</span>
                                      </div>
                                    </div>
                                  </td>

                                  {/* Organization & Location */}
                                  <td className="py-3.5 px-4 text-[#4B5563]">
                                    <div className="space-y-0.5 text-[12px]">
                                      <div className="font-medium text-gray-800 flex items-center gap-1">
                                        <Building2 className="w-3 h-3 text-gray-400" />
                                        <span>{attendee.organization}</span>
                                      </div>
                                      <div className="text-[11px] text-gray-500">{attendee.location}</div>
                                    </div>
                                  </td>

                                  {/* RSVP Status */}
                                  <td className="py-3.5 px-4">
                                    {attendee.status === 'attended' ? (
                                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                        Joined Session
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full">
                                        <Clock className="w-3.5 h-3.5 text-amber-600" />
                                        Pass Sent (No-Show)
                                      </span>
                                    )}
                                  </td>

                                  {/* Join Log */}
                                  <td className="py-3.5 px-4 text-right text-[12px] text-[#6C6C6C]">
                                    {attendee.joinTime ? (
                                      <div>
                                        <div className="font-bold text-gray-800">{attendee.joinTime}</div>
                                        <div className="text-[11px] text-[#8E8E93]">Duration: {attendee.duration}</div>
                                      </div>
                                    ) : (
                                      <span className="text-gray-400 italic">Not joined</span>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Create & Manage Webinar Modal */}
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
            <div className="bg-white rounded-[24px] max-w-lg w-full p-6 space-y-5 shadow-2xl border border-[#EAEAEA] relative">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-[#F0F0F0] pb-4">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-full bg-amber-100 text-amber-900 flex items-center justify-center">
                    <Video className="w-5 h-5 text-amber-700" />
                  </div>
                  <div>
                    <h3 className="text-[18px] font-goudy font-bold text-[#1F1F1F]">Create &amp; Schedule Webinar</h3>
                    <p className="text-[12px] text-[#8E8E93]">Set session title, date, time, and meeting link</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsCreateModalOpen(false)}
                  className="p-1.5 hover:bg-gray-100 rounded-full text-gray-500 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleCreateWebinar} className="space-y-4">
                {/* Title */}
                <div>
                  <label className="block text-[12px] font-bold uppercase tracking-wider text-[#4B5563] mb-1">
                    Webinar Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Physician Wealth & Tax-Advantaged Real Estate"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full bg-[#F8F9FA] border border-[#E2E8F0] rounded-xl px-4 py-2.5 text-[13px] text-[#1F1F1F] focus:outline-none focus:border-[#FFC63F]"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-[12px] font-bold uppercase tracking-wider text-[#4B5563] mb-1">
                    Description &amp; Agenda
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Brief summary of session topics for physician prospects..."
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    className="w-full bg-[#F8F9FA] border border-[#E2E8F0] rounded-xl px-4 py-2.5 text-[13px] text-[#1F1F1F] focus:outline-none focus:border-[#FFC63F]"
                  />
                </div>

                {/* Date, Time & Duration Row */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[12px] font-bold uppercase tracking-wider text-[#4B5563] mb-1">
                      Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={newDate}
                      onChange={(e) => setNewDate(e.target.value)}
                      className="w-full bg-[#F8F9FA] border border-[#E2E8F0] rounded-xl px-3 py-2.5 text-[13px] text-[#1F1F1F] focus:outline-none focus:border-[#FFC63F]"
                    />
                  </div>

                  <div>
                    <label className="block text-[12px] font-bold uppercase tracking-wider text-[#4B5563] mb-1">
                      Time &amp; Timezone
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 04:00 PM EST"
                      value={newTime}
                      onChange={(e) => setNewTime(e.target.value)}
                      className="w-full bg-[#F8F9FA] border border-[#E2E8F0] rounded-xl px-3 py-2.5 text-[13px] text-[#1F1F1F] focus:outline-none focus:border-[#FFC63F]"
                    />
                  </div>

                  <div>
                    <label className="block text-[12px] font-bold uppercase tracking-wider text-[#4B5563] mb-1">
                      Duration
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 45 mins"
                      value={newDuration}
                      onChange={(e) => setNewDuration(e.target.value)}
                      className="w-full bg-[#F8F9FA] border border-[#E2E8F0] rounded-xl px-3 py-2.5 text-[13px] text-[#1F1F1F] focus:outline-none focus:border-[#FFC63F]"
                    />
                  </div>
                </div>

                {/* Meeting Link */}
                <div>
                  <label className="block text-[12px] font-bold uppercase tracking-wider text-[#4B5563] mb-1">
                    Meeting Link (Zoom / Google Meet / Luma) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="url"
                    required
                    placeholder="https://us06web.zoom.us/j/123456789"
                    value={newMeetingLink}
                    onChange={(e) => setNewMeetingLink(e.target.value)}
                    className="w-full bg-[#F8F9FA] border border-[#E2E8F0] rounded-xl px-4 py-2.5 text-[13px] text-[#1F1F1F] focus:outline-none focus:border-[#FFC63F]"
                  />
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#F0F0F0]">
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="px-5 py-2.5 rounded-full text-[13px] font-bold text-gray-600 hover:bg-gray-100 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-2.5 rounded-full text-[13px] font-bold text-[#1F1F1F] bg-[#FFC63F] hover:bg-[#F2B62D] shadow-sm transition-all flex items-center gap-1.5"
                  >
                    {isSubmitting ? 'Saving to DB...' : 'Create Webinar'}
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
