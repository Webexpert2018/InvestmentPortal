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
  Trash2,
  Pencil,
  Send,
  Bell,
} from 'lucide-react';

interface Attendee {
  id: string;
  fullName: string;
  specialty: string;
  organization: string;
  location: string;
  email: string;
  phone: string;
  status: 'attended' | 'registered' | 'no_show' | 'accepted' | 'declined' | 'tentative';
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
  reminderOffsets?: number[];
  isLatest?: boolean;
  createdAt?: string;
}

function formatTimeTo12HourEST(timeStr: string): string {
  if (!timeStr) return '04:00 PM EST';
  const clean = timeStr.trim();
  if (/AM|PM/i.test(clean)) {
    if (!/EST/i.test(clean)) return `${clean} EST`;
    return clean;
  }
  const match = clean.match(/^(\d{1,2}):(\d{2})$/);
  if (match) {
    let hours = parseInt(match[1], 10);
    const minutes = match[2];
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    if (hours === 0) hours = 12;
    const formattedHours = hours.toString().padStart(2, '0');
    return `${formattedHours}:${minutes} ${ampm} EST`;
  }
  return clean.includes('EST') ? clean : `${clean} EST`;
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
  const [newTime, setNewTime] = useState('16:00');
  const [newDuration, setNewDuration] = useState('45');
  const [newMeetingLink, setNewMeetingLink] = useState('example.com');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deletingWebinarId, setDeletingWebinarId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingWebinarId, setEditingWebinarId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editTime, setEditTime] = useState('16:00');
  const [editDuration, setEditDuration] = useState('45');
  const [editMeetingLink, setEditMeetingLink] = useState('example.com');
  const [isUpdating, setIsUpdating] = useState(false);

  // Direct Invite Modal State
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [invitingWebinar, setInvitingWebinar] = useState<Webinar | null>(null);
  const [prospectsList, setProspectsList] = useState<any[]>([]);
  const [isLoadingProspects, setIsLoadingProspects] = useState(false);
  const [selectedProspectIds, setSelectedProspectIds] = useState<string[]>([]);
  const [inviteSearchQuery, setInviteSearchQuery] = useState('');
  const [isSendingInvites, setIsSendingInvites] = useState(false);

  // Reminder Settings Modal State
  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);
  const [reminderWebinar, setReminderWebinar] = useState<Webinar | null>(null);
  const [selectedReminderOffsets, setSelectedReminderOffsets] = useState<number[]>([]);
  const [isSavingReminders, setIsSavingReminders] = useState(false);
  const [isSendingTestReminder, setIsSendingTestReminder] = useState(false);

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

  function getWebinarDynamicStatus(dateStr: string, timeStr?: string, durationStr?: string): 'upcoming' | 'live' | 'completed' {
    if (!dateStr) return 'upcoming';
    try {
      const parts = dateStr.split('-');
      if (parts.length < 3) return 'upcoming';
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10);
      const day = parseInt(parts[2], 10);

      if (isNaN(year) || isNaN(month) || isNaN(day)) return 'upcoming';

      let hours = 16;
      let minutes = 0;

      if (timeStr) {
        const cleanTime = timeStr.trim();
        const match = cleanTime.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
        if (match) {
          let h = parseInt(match[1], 10);
          const m = parseInt(match[2], 10);
          const ampm = match[3]?.toUpperCase();

          if (ampm === 'PM' && h < 12) h += 12;
          if (ampm === 'AM' && h === 12) h = 0;

          hours = h;
          minutes = m;
        }
      }

      const startDate = new Date(year, month - 1, day, hours, minutes, 0, 0);

      let durationMinutes = 45;
      if (durationStr) {
        const durMatch = durationStr.match(/(\d+)/);
        if (durMatch) {
          durationMinutes = parseInt(durMatch[1], 10);
        }
      }

      const endDate = new Date(startDate.getTime() + durationMinutes * 60 * 1000);
      const now = new Date();

      if (now < startDate) {
        return 'upcoming';
      } else if (now >= startDate && now <= endDate) {
        return 'live';
      } else {
        return 'completed';
      }
    } catch {
      return 'upcoming';
    }
  }

  const loadWebinarsFromDb = async () => {
    setIsLoadingWebinars(true);
    try {
      const res = await apiClient.getWebinars();
      if (res && res.success && Array.isArray(res.webinars)) {
        const formattedWebinars = res.webinars.map((w: Webinar) => ({
          ...w,
          status: getWebinarDynamicStatus(w.date, w.time, w.duration),
        }));
        setWebinars(formattedWebinars);
        if (formattedWebinars.length > 0) {
          // Expand first webinar by default
          setExpandedWebinarIds({ [formattedWebinars[0].id]: true });
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

    let formattedLink = newMeetingLink.trim();
    if (formattedLink && !/^https?:\/\//i.test(formattedLink)) {
      formattedLink = `https://${formattedLink}`;
    }

    setIsSubmitting(true);
    try {
      const res = await apiClient.createWebinar({
        title: newTitle.trim(),
        description: newDescription.trim(),
        webinarDate: newDate,
        webinarTime: formatTimeTo12HourEST(newTime),
        duration: newDuration.trim() ? (newDuration.toLowerCase().includes('min') ? newDuration.trim() : `${newDuration.trim()} mins`) : '45 mins',
        meetingLink: formattedLink,
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
        setNewTime('16:00');
        setNewDuration('45');
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

  const parseTimeTo24Hour = (timeStr?: string): string => {
    if (!timeStr) return '16:00';
    const clean = timeStr.trim();
    const match = clean.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
    if (!match) return '16:00';
    let h = parseInt(match[1], 10);
    const m = match[2];
    const ampm = match[3]?.toUpperCase();
    if (ampm === 'PM' && h < 12) h += 12;
    if (ampm === 'AM' && h === 12) h = 0;
    return `${h.toString().padStart(2, '0')}:${m}`;
  };

  const handleOpenEditModal = (webinar: Webinar) => {
    setEditingWebinarId(webinar.id);
    setEditTitle(webinar.title || '');
    setEditDescription(webinar.description || '');
    setEditDate(webinar.date || '');
    setEditTime(parseTimeTo24Hour(webinar.time));
    setEditDuration((webinar.duration || '45').replace(/[^0-9]/g, '') || '45');
    setEditMeetingLink(webinar.meetingLink || '');
    setIsEditModalOpen(true);
  };

  const handleUpdateWebinar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingWebinarId) return;
    if (!editTitle.trim() || !editDate || !editMeetingLink.trim()) {
      toast.error('Please fill in Title, Date, and Meeting Link.');
      return;
    }

    let formattedLink = editMeetingLink.trim();
    if (formattedLink && !/^https?:\/\//i.test(formattedLink)) {
      formattedLink = `https://${formattedLink}`;
    }

    setIsUpdating(true);
    try {
      const res = await apiClient.updateWebinar(editingWebinarId, {
        title: editTitle.trim(),
        description: editDescription.trim(),
        webinarDate: editDate,
        webinarTime: formatTimeTo12HourEST(editTime),
        duration: editDuration.trim() ? (editDuration.toLowerCase().includes('min') ? editDuration.trim() : `${editDuration.trim()} mins`) : '45 mins',
        meetingLink: formattedLink,
      });

      if (res && res.success && res.webinar) {
        const notifiedMsg = (res as any).notifiedCount && (res as any).notifiedCount > 0
          ? `🎉 Webinar updated! Update emails dispatched to ${(res as any).notifiedCount} pass holder(s).`
          : '🎉 Webinar updated & saved to database!';
        toast.success(notifiedMsg);
        setWebinars((prev) =>
          prev.map((w) => (w.id === editingWebinarId ? { ...w, ...res.webinar } : w))
        );
        setIsEditModalOpen(false);
        setEditingWebinarId(null);
      } else {
        toast.error('Failed to update webinar record.');
      }
    } catch (err: any) {
      console.error('Error updating webinar:', err);
      toast.error(err.message || 'Error updating webinar');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteWebinar = async () => {
    if (!deletingWebinarId) return;
    setIsDeleting(true);
    try {
      const res = await apiClient.deleteWebinar(deletingWebinarId);
      if (res && res.success) {
        toast.success('🗑️ Webinar deleted successfully!');
        setWebinars((prev) => prev.filter((w) => w.id !== deletingWebinarId));
        setDeletingWebinarId(null);
      } else {
        toast.error('Failed to delete webinar.');
      }
    } catch (err: any) {
      console.error('Error deleting webinar:', err);
      toast.error(err.message || 'Error deleting webinar');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleOpenInviteModal = async (webinar: Webinar) => {
    setInvitingWebinar(webinar);
    setIsInviteModalOpen(true);
    setSelectedProspectIds([]);
    setInviteSearchQuery('');

    if (prospectsList.length === 0) {
      setIsLoadingProspects(true);
      try {
        const res = await apiClient.getSavedProspects(200);
        if (res && res.success && Array.isArray(res.prospects)) {
          setProspectsList(res.prospects);
        } else if (Array.isArray(res)) {
          setProspectsList(res);
        }
      } catch (err: any) {
        console.error('Error fetching prospects:', err);
        toast.error('Failed to load doctor prospects list.');
      } finally {
        setIsLoadingProspects(false);
      }
    }
  };

  const handleSendDirectInvites = async () => {
    if (!invitingWebinar) return;
    if (selectedProspectIds.length === 0) {
      toast.error('Please select at least 1 doctor prospect to invite.');
      return;
    }

    setIsSendingInvites(true);
    try {
      const res = await apiClient.sendDirectWebinarInvites(invitingWebinar.id, selectedProspectIds);
      if (res && res.success) {
        toast.success(`🎉 Direct invitations & session passes sent to ${res.count || selectedProspectIds.length} doctors!`);
        setIsInviteModalOpen(false);
        setInvitingWebinar(null);
        setSelectedProspectIds([]);
        loadWebinarsFromDb();
      } else {
        toast.error(res?.message || 'Failed to send direct webinar invitations.');
      }
    } catch (err: any) {
      console.error('Error sending direct webinar invites:', err);
      toast.error(err.message || 'Error sending direct webinar invitations.');
    } finally {
      setIsSendingInvites(false);
    }
  };

  const handleOpenReminderModal = (webinar: Webinar) => {
    setReminderWebinar(webinar);
    setSelectedReminderOffsets(webinar.reminderOffsets || []);
    setIsReminderModalOpen(true);
  };

  const handleSaveReminders = async () => {
    if (!reminderWebinar) return;
    setIsSavingReminders(true);
    try {
      const res = await apiClient.updateWebinarReminders(reminderWebinar.id, selectedReminderOffsets);
      if (res && res.success) {
        toast.success('🎉 Automated reminder schedule updated!');
        setWebinars((prev) =>
          prev.map((w) => (w.id === reminderWebinar.id ? { ...w, reminderOffsets: selectedReminderOffsets } : w))
        );
        setIsReminderModalOpen(false);
        setReminderWebinar(null);
      } else {
        toast.error(res?.message || 'Failed to save reminder schedule.');
      }
    } catch (err: any) {
      console.error('Error saving reminders:', err);
      toast.error(err.message || 'Failed to save reminder schedule');
    } finally {
      setIsSavingReminders(false);
    }
  };

  const handleSendTestReminder = async () => {
    if (!reminderWebinar) return;
    setIsSendingTestReminder(true);
    try {
      const res = await apiClient.sendTestWebinarReminder(reminderWebinar.id);
      if (res && res.success) {
        toast.success(`🎉 ${res.message || 'Test reminder emails sent successfully!'}`);
      } else {
        toast.error(res?.message || 'Failed to send test reminder emails.');
      }
    } catch (err: any) {
      console.error('Error sending test reminder:', err);
      toast.error(err.message || 'Error sending test reminder email.');
    } finally {
      setIsSendingTestReminder(false);
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

  // Active webinar whose link/pass is currently being shared in outreach campaigns
  const activeWebinarId = (() => {
    if (webinars.length === 0) return null;
    const serverLatest = webinars.find((w) => w.isLatest);
    if (serverLatest) return serverLatest.id;
    return webinars[0]?.id;
  })();

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
                      className={`h-6.5 rounded-full flex flex-col items-center justify-center relative transition-all ${isSelected
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
            <div className="flex flex-col gap-2.5 w-full">
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

              <button
                onClick={() => router.push('/dashboard/calendar-test')}
                className="w-full flex items-center justify-center gap-2 bg-white border border-amber-200 hover:bg-amber-50/50 text-[#1F1F1F] px-4 py-2.5 rounded-xl font-semibold text-[13px] shadow-sm transition-all whitespace-nowrap"
              >
                <CalendarIcon className="w-4 h-4 text-amber-600" />
                <span>Test Google Calendar</span>
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
                className={`px-4 py-2 rounded-full font-bold text-[13px] transition-all whitespace-nowrap ${activeTab === 'all'
                  ? 'bg-[#FFC63F] text-[#1F1F1F] shadow-sm'
                  : 'bg-white hover:bg-gray-100 text-[#6C6C6C]'
                  }`}
              >
                All Webinars ({totalWebinars})
              </button>
              <button
                onClick={() => setActiveTab('upcoming')}
                className={`px-4 py-2 rounded-full font-bold text-[13px] transition-all whitespace-nowrap ${activeTab === 'upcoming'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white hover:bg-blue-50 text-blue-700 border border-blue-200'
                  }`}
              >
                Upcoming ({upcomingCount})
              </button>
              <button
                onClick={() => setActiveTab('completed')}
                className={`px-4 py-2 rounded-full font-bold text-[13px] transition-all whitespace-nowrap ${activeTab === 'completed'
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
                      <div className="flex flex-wrap items-center gap-2.5">
                        <h2 className="text-[20px] font-goudy font-bold text-[#1F1F1F] leading-snug">
                          {webinar.title}
                        </h2>
                        {(webinar.isLatest || webinar.id === activeWebinarId) && (
                          <span
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold bg-emerald-50 text-emerald-800 border border-emerald-300 shadow-2xs tracking-wide transition-all"
                            title="Active Now: This is the latest webinar whose link & access pass are currently being shared with doctors"
                          >
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </span>
                            <span>ACTIVE NOW</span>
                          </span>
                        )}
                      </div>
                      <p className="text-[13px] text-[#6C6C6C] mt-1.5 leading-relaxed">
                        {webinar.description}
                      </p>
                    </div>

                    {/* Actions Bar */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#F4F4F4]">
                      {/* Meeting Link Trigger */}
                      <div className="flex items-center gap-2 max-w-full overflow-hidden">
                        <a
                          href={/^https?:\/\//i.test(webinar.meetingLink) ? webinar.meetingLink : `https://${webinar.meetingLink}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-amber-50/90 hover:bg-amber-100 text-amber-900 border border-amber-200/80 text-[12px] font-bold px-4 py-2 rounded-full flex items-center gap-1.5 transition-all shrink-0 cursor-pointer"
                        >
                          <ExternalLink className="w-3.5 h-3.5 text-amber-700" />
                          <span>Join Meeting</span>
                        </a>

                        <button
                          onClick={() => handleCopyLink(webinar.meetingLink, webinar.id)}
                          className="bg-amber-50/90 hover:bg-amber-100 text-amber-900 border border-amber-200/80 text-[12px] font-bold px-4 py-2 rounded-full flex items-center gap-1.5 transition-all shrink-0 cursor-pointer"
                          title="Copy Meeting Link"
                        >
                          {copiedId === webinar.id ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                              <span className="text-emerald-800 font-bold">Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5 text-amber-700" />
                              <span className="hidden sm:inline">Copy Link</span>
                            </>
                          )}
                        </button>

                        <button
                          onClick={() => handleOpenInviteModal(webinar)}
                          className="bg-amber-50/90 hover:bg-amber-100 text-amber-900 border border-amber-200/80 text-[12px] font-bold px-4 py-2 rounded-full flex items-center gap-1.5 transition-all shrink-0 cursor-pointer"
                          title="Send Direct Webinar Invitation & Session Pass to Doctors"
                        >
                          <Send className="w-3.5 h-3.5 text-amber-700" />
                          <span>Send Invite</span>
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
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

                        {/* Notification / Reminder Settings Button */}
                        {(() => {
                          const activeRemindersCount = (webinar.reminderOffsets || []).length;
                          return (
                            <button
                              onClick={() => handleOpenReminderModal(webinar)}
                              className={`p-2 rounded-full transition-all flex items-center justify-center gap-1 cursor-pointer ${activeRemindersCount > 0
                                ? 'text-amber-800 bg-amber-100 hover:bg-amber-200 border border-amber-300 font-bold'
                                : 'text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 border border-gray-200'
                                }`}
                              title={
                                activeRemindersCount > 0
                                  ? `Automated Reminders Active (${activeRemindersCount} scheduled)`
                                  : 'Configure Automated Webinar Reminders'
                              }
                            >
                              <Bell className="w-4 h-4" />
                              {activeRemindersCount > 0 && (
                                <span className="text-[11px] font-extrabold pr-0.5">{activeRemindersCount}</span>
                              )}
                            </button>
                          );
                        })()}

                        {/* Edit Webinar Button */}
                        <button
                          onClick={() => handleOpenEditModal(webinar)}
                          className="p-2 text-amber-700 hover:text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200/80 rounded-full transition-all flex items-center justify-center"
                          title="Edit Webinar Details"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>

                        {/* Delete Webinar Button */}
                        <button
                          onClick={() => setDeletingWebinarId(webinar.id)}
                          className="p-2 text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200/80 rounded-full transition-all flex items-center justify-center"
                          title="Delete Webinar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
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
                                    ) : attendee.status === 'accepted' ? (
                                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                        Accepted Invite
                                      </span>
                                    ) : attendee.status === 'declined' ? (
                                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-800 bg-rose-50 border border-rose-200 px-2.5 py-0.5 rounded-full">
                                        <X className="w-3.5 h-3.5 text-rose-600" />
                                        Declined Invite
                                      </span>
                                    ) : attendee.status === 'tentative' ? (
                                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full">
                                        <Clock className="w-3.5 h-3.5 text-amber-600" />
                                        Tentative RSVP
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full">
                                        <Clock className="w-3.5 h-3.5 text-amber-600" />
                                        Invite Sent
                                      </span>
                                    )}
                                  </td>

                                  {/* Join Log */}
                                  <td className="py-3.5 px-4 text-right text-[12px] text-[#6C6C6C]">
                                    {attendee.joinTime ? (
                                      <div>
                                        <div className="font-bold text-gray-800">
                                          {(() => {
                                            try {
                                              const d = new Date(attendee.joinTime);
                                              return !isNaN(d.getTime())
                                                ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                                : attendee.joinTime;
                                            } catch {
                                              return attendee.joinTime;
                                            }
                                          })()}
                                        </div>
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
                      Time (Eastern ET) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="time"
                      required
                      value={newTime}
                      onChange={(e) => setNewTime(e.target.value)}
                      className="w-full bg-[#F8F9FA] border border-[#E2E8F0] rounded-xl px-3 py-2.5 text-[13px] text-[#1F1F1F] focus:outline-none focus:border-[#FFC63F]"
                    />
                  </div>

                  <div>
                    <label className="block text-[12px] font-bold uppercase tracking-wider text-[#4B5563] mb-1">
                      Duration (in mins)
                    </label>
                    <input
                      type="number"
                      min="1"
                      placeholder="45"
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
                    type="text"
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

        {/* Edit & Reschedule Webinar Modal */}
        {isEditModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
            <div className="bg-white rounded-[24px] max-w-xl w-full p-6 md:p-8 space-y-6 shadow-2xl border border-[#EAEAEA] relative">
              <button
                onClick={() => {
                  setIsEditModalOpen(false);
                  setEditingWebinarId(null);
                }}
                className="absolute top-6 right-6 p-2 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-700">
                  <Pencil className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-[20px] font-goudy font-bold text-[#1F1F1F]">Edit &amp; Reschedule Webinar</h2>
                  <p className="text-[12px] text-[#8E8E93]">Update session title, date, time, and meeting link</p>
                </div>
              </div>

              <form onSubmit={handleUpdateWebinar} className="space-y-4">
                {/* Title */}
                <div>
                  <label className="block text-[12px] font-bold uppercase tracking-wider text-[#4B5563] mb-1">
                    Webinar Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Physician Wealth & Tax-Advantaged Real Estate"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
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
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
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
                      value={editDate}
                      onChange={(e) => setEditDate(e.target.value)}
                      className="w-full bg-[#F8F9FA] border border-[#E2E8F0] rounded-xl px-3 py-2.5 text-[13px] text-[#1F1F1F] focus:outline-none focus:border-[#FFC63F]"
                    />
                  </div>

                  <div>
                    <label className="block text-[12px] font-bold uppercase tracking-wider text-[#4B5563] mb-1">
                      Time (Eastern ET) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="time"
                      required
                      value={editTime}
                      onChange={(e) => setEditTime(e.target.value)}
                      className="w-full bg-[#F8F9FA] border border-[#E2E8F0] rounded-xl px-3 py-2.5 text-[13px] text-[#1F1F1F] focus:outline-none focus:border-[#FFC63F]"
                    />
                  </div>

                  <div>
                    <label className="block text-[12px] font-bold uppercase tracking-wider text-[#4B5563] mb-1">
                      Duration (in mins)
                    </label>
                    <input
                      type="number"
                      min="1"
                      placeholder="45"
                      value={editDuration}
                      onChange={(e) => setEditDuration(e.target.value)}
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
                    type="text"
                    required
                    placeholder="https://us06web.zoom.us/j/123456789"
                    value={editMeetingLink}
                    onChange={(e) => setEditMeetingLink(e.target.value)}
                    className="w-full bg-[#F8F9FA] border border-[#E2E8F0] rounded-xl px-4 py-2.5 text-[13px] text-[#1F1F1F] focus:outline-none focus:border-[#FFC63F]"
                  />
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#F0F0F0]">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditModalOpen(false);
                      setEditingWebinarId(null);
                    }}
                    className="px-5 py-2.5 rounded-full text-[13px] font-bold text-gray-600 hover:bg-gray-100 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isUpdating}
                    className="px-6 py-2.5 rounded-full text-[13px] font-bold text-[#1F1F1F] bg-[#FFC63F] hover:bg-[#F2B62D] shadow-sm transition-all flex items-center gap-1.5"
                  >
                    {isUpdating ? 'Updating DB...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Send Direct Webinar Invite Modal */}
        {isInviteModalOpen && invitingWebinar && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
            <div className="bg-white rounded-[24px] max-w-2xl w-full p-6 md:p-8 space-y-6 shadow-2xl border border-[#EAEAEA] relative max-h-[90vh] flex flex-col">
              <button
                onClick={() => {
                  setIsInviteModalOpen(false);
                  setInvitingWebinar(null);
                }}
                className="absolute top-6 right-6 p-2 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Modal Header */}
              <div className="flex items-center gap-3 shrink-0">
                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-700">
                  <Send className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-[20px] font-goudy font-bold text-[#1F1F1F]">Send Direct Webinar Invitation</h2>
                  <p className="text-[12px] text-[#8E8E93]">
                    Select physician prospects to issue personalized session passes &amp; calendar invites
                  </p>
                </div>
              </div>

              {/* Webinar Summary Banner */}
              <div className="bg-[#FFFDF5] border border-[#FDE68A] rounded-xl p-3.5 text-[13px] text-amber-950 flex flex-wrap items-center justify-between gap-2 shrink-0">
                <div>
                  <span className="font-bold text-[#1F1F1F] block">{invitingWebinar.title}</span>
                  <span className="text-[12px] text-amber-800 font-medium">
                    📅 {invitingWebinar.formattedDate || invitingWebinar.date} • ⏰ {invitingWebinar.time}
                  </span>
                </div>
                <span className="bg-amber-100 text-amber-900 border border-amber-300/80 text-[11px] font-bold px-3 py-1 rounded-full">
                  Passes Sent: {invitingWebinar.totalPassesSent ?? invitingWebinar.attendees.length}
                </span>
              </div>

              {/* Search & Bulk Select Toolbar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search doctor by name, specialty, clinic, or email..."
                    value={inviteSearchQuery}
                    onChange={(e) => setInviteSearchQuery(e.target.value)}
                    className="w-full bg-[#F8F9FA] border border-[#E2E8F0] rounded-xl pl-9 pr-4 py-2 text-[13px] text-[#1F1F1F] focus:outline-none focus:border-[#FFC63F]"
                  />
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      const registeredSet = new Set(
                        (invitingWebinar.attendees || []).map((a: any) => (a.email || a.id || '').toLowerCase())
                      );
                      const eligibleIds = prospectsList
                        .filter((p: any) => {
                          const pEmail = (p.email || '').toLowerCase();
                          const pId = (p.apollo_id || p.id || '').toLowerCase();
                          return !registeredSet.has(pEmail) && !registeredSet.has(pId);
                        })
                        .map((p: any) => p.apollo_id || p.id);
                      setSelectedProspectIds(eligibleIds);
                    }}
                    className="text-[12px] font-bold text-amber-700 hover:text-amber-800 bg-amber-50 hover:bg-amber-100 px-3 py-1.5 rounded-lg transition-colors border border-amber-200 cursor-pointer"
                  >
                    Select All Unregistered
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedProspectIds([])}
                    className="text-[12px] font-medium text-gray-600 hover:text-gray-800 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                  >
                    Deselect All
                  </button>
                </div>
              </div>

              {/* Doctor Prospects List */}
              <div className="flex-1 overflow-y-auto border border-[#EAEAEA] rounded-xl divide-y divide-[#F0F0F0] p-1 min-h-[220px]">
                {isLoadingProspects ? (
                  <div className="py-12 text-center space-y-2">
                    <div className="w-6 h-6 border-2 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-[13px] text-gray-500 font-medium">Loading physician prospects database...</p>
                  </div>
                ) : prospectsList.length === 0 ? (
                  <div className="py-12 text-center text-[13px] text-gray-500">
                    No doctor prospects found in database.
                  </div>
                ) : (() => {
                  const registeredEmails = new Set(
                    (invitingWebinar.attendees || []).map((a: any) => (a.email || a.id || '').toLowerCase())
                  );

                  const filtered = prospectsList.filter((p: any) => {
                    if (!inviteSearchQuery.trim()) return true;
                    const q = inviteSearchQuery.toLowerCase();
                    return (
                      (p.full_name || p.fullName || '').toLowerCase().includes(q) ||
                      (p.specialty || '').toLowerCase().includes(q) ||
                      (p.organization || '').toLowerCase().includes(q) ||
                      (p.email || '').toLowerCase().includes(q)
                    );
                  });

                  if (filtered.length === 0) {
                    return (
                      <div className="py-8 text-center text-[13px] text-gray-500">
                        No doctors match "{inviteSearchQuery}".
                      </div>
                    );
                  }

                  return filtered.map((doc: any) => {
                    const docId = doc.apollo_id || doc.id;
                    const docEmail = (doc.email || '').toLowerCase();
                    const isAlreadyRegistered = registeredEmails.has(docEmail) || registeredEmails.has(docId.toLowerCase());
                    const isSelected = selectedProspectIds.includes(docId);

                    return (
                      <label
                        key={docId}
                        className={`flex items-center justify-between p-3.5 rounded-lg transition-colors ${isAlreadyRegistered
                          ? 'bg-gray-50/80 opacity-70 cursor-not-allowed'
                          : isSelected
                            ? 'bg-amber-50/70 border-l-4 border-amber-500 cursor-pointer'
                            : 'hover:bg-gray-50 cursor-pointer'
                          }`}
                      >
                        <div className="flex items-center gap-3 min-w-0 pr-2">
                          <input
                            type="checkbox"
                            disabled={isAlreadyRegistered}
                            checked={isSelected || isAlreadyRegistered}
                            onChange={(e) => {
                              if (isAlreadyRegistered) return;
                              if (e.target.checked) {
                                setSelectedProspectIds((prev) => [...prev, docId]);
                              } else {
                                setSelectedProspectIds((prev) => prev.filter((id) => id !== docId));
                              }
                            }}
                            className="w-4 h-4 text-amber-600 rounded-md border-gray-300 focus:ring-amber-500 cursor-pointer disabled:cursor-not-allowed shrink-0"
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-[14px] text-[#1F1F1F] truncate">
                                {doc.full_name || doc.fullName || 'Doctor Prospect'}
                              </span>
                              <span className="text-[11px] font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full shrink-0 border border-amber-200/60">
                                {doc.specialty || 'Physician'}
                              </span>
                            </div>
                            <div className="text-[12px] text-gray-500 truncate mt-0.5">
                              <span>{doc.organization || 'Private Practice'}</span>
                              {doc.email && (
                                <>
                                  <span className="mx-1.5 text-gray-300">•</span>
                                  <span className="text-gray-600">{doc.email}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {isAlreadyRegistered ? (
                          <span className="bg-gray-200 text-gray-700 text-[11px] font-bold px-2.5 py-1 rounded-full shrink-0 flex items-center gap-1 border border-gray-300">
                            <CheckCircle2 className="w-3.5 h-3.5 text-gray-600" />
                            Already Registered
                          </span>
                        ) : isSelected ? (
                          <span className="bg-amber-100 text-amber-900 text-[11px] font-bold px-2.5 py-1 rounded-full shrink-0 border border-amber-300">
                            Selected
                          </span>
                        ) : null}
                      </label>
                    );
                  });
                })()}
              </div>

              {/* Modal Footer Actions */}
              <div className="flex items-center justify-between pt-3 border-t border-[#F0F0F0] shrink-0">
                <span className="text-[13px] text-gray-600 font-semibold">
                  Selected: <strong className="text-amber-900">{selectedProspectIds.length}</strong> doctor(s)
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsInviteModalOpen(false);
                      setInvitingWebinar(null);
                    }}
                    disabled={isSendingInvites}
                    className="px-4 py-2 rounded-full text-[13px] font-bold text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSendDirectInvites}
                    disabled={isSendingInvites || selectedProspectIds.length === 0}
                    className="px-6 py-2 rounded-full text-[13px] font-bold text-white bg-amber-600 hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    {isSendingInvites ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Sending Invites...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>Send Invitations ({selectedProspectIds.length})</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Simple Configure Automated Reminders Modal */}
        {isReminderModalOpen && reminderWebinar && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
            <div className="bg-white rounded-[24px] max-w-lg w-full p-6 md:p-7 space-y-5 shadow-2xl border border-[#EAEAEA] relative">
              <button
                onClick={() => {
                  setIsReminderModalOpen(false);
                  setReminderWebinar(null);
                }}
                className="absolute top-5 right-5 p-2 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Modal Header */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-800">
                  <Bell className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-[18px] font-goudy font-bold text-[#1F1F1F]">Configure Webinar Reminders</h2>
                  <p className="text-[12px] text-[#8E8E93]">Select automated email reminder intervals for attendees</p>
                </div>
              </div>

              {/* Webinar Summary & Currently Scheduled Banner */}
              <div className="bg-[#FAFBFD] border border-[#EAEAEA] rounded-xl p-3.5 space-y-2 text-[13px]">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-[#1F1F1F]">{reminderWebinar.title}</span>
                  <span className="text-[11px] font-semibold text-gray-500 bg-gray-100 px-2.5 py-0.5 rounded-full border border-gray-200">
                    {reminderWebinar.formattedDate || reminderWebinar.date}
                  </span>
                </div>

                {/* Scheduled Status */}
                <div className="pt-1.5 border-t border-[#EDEDED] flex items-center gap-1.5 flex-wrap">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Scheduled:</span>
                  {selectedReminderOffsets.length === 0 ? (
                    <span className="text-[12px] italic text-gray-400">No automated reminders configured</span>
                  ) : (
                    [
                      { mins: 60, label: '1 Hour Before' },
                      { mins: 120, label: '2 Hours Before' },
                      { mins: 720, label: '12 Hours Before' },
                      { mins: 1440, label: '24 Hours Before' },
                      { mins: 2880, label: '48 Hours Before' },
                    ]
                      .filter((opt) => selectedReminderOffsets.includes(opt.mins))
                      .map((opt) => (
                        <span key={opt.mins} className="bg-amber-50 text-amber-900 border border-amber-200/80 text-[11px] font-bold px-2 py-0.5 rounded-md">
                          ⏱️ {opt.label}
                        </span>
                      ))
                  )}
                </div>
              </div>

              {/* Simple Reminder Options Checkboxes */}
              <div className="space-y-2 pt-1">
                <label className="block text-[12px] font-bold uppercase tracking-wider text-[#4B5563]">
                  Select Reminder Schedules
                </label>
                <div className="space-y-2">
                  {[
                    { mins: 60, label: '1 Hour Before Session', desc: 'Sends quick 60-minute countdown email' },
                    { mins: 120, label: '2 Hours Before Session', desc: 'Sends 2-hour session briefing reminder' },
                    { mins: 720, label: '12 Hours Before Session', desc: 'Sends half-day advance notification' },
                    { mins: 1440, label: '24 Hours (1 Day) Before Session', desc: 'Sends 1-day reminder email with calendar link' },
                    { mins: 2880, label: '48 Hours (2 Days) Before Session', desc: 'Sends 2-day advance session notice' },
                  ].map((option) => {
                    const isChecked = selectedReminderOffsets.includes(option.mins);
                    return (
                      <label
                        key={option.mins}
                        onClick={() => {
                          if (isChecked) {
                            setSelectedReminderOffsets((prev) => prev.filter((m) => m !== option.mins));
                          } else {
                            setSelectedReminderOffsets((prev) => [...prev, option.mins].sort((a, b) => a - b));
                          }
                        }}
                        className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer ${isChecked
                          ? 'bg-amber-50/70 border-amber-300 shadow-xs'
                          : 'bg-[#F9FAFB] border-[#E5E7EB] hover:bg-gray-50'
                          }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => { }} // handled by parent label onClick
                          className="mt-0.5 w-4 h-4 text-amber-600 rounded-md border-gray-300 focus:ring-amber-500 cursor-pointer shrink-0"
                        />
                        <div className="min-w-0">
                          <span className="block font-bold text-[13px] text-[#1F1F1F]">{option.label}</span>
                          <span className="block text-[11px] text-gray-500 mt-0.5">{option.desc}</span>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-[#F0F0F0]">
                <button
                  type="button"
                  onClick={handleSendTestReminder}
                  disabled={isSendingTestReminder || (reminderWebinar.attendees?.length ?? 0) === 0}
                  className="px-3.5 py-1.5 rounded-full text-[12px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-all flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Dispatch a test reminder email immediately to all registered attendees"
                >
                  {isSendingTestReminder ? (
                    <>
                      <div className="w-3 h-3 border-2 border-blue-700 border-t-transparent rounded-full animate-spin" />
                      <span>Sending Test Email...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5 text-blue-600" />
                      <span>Send Test Reminder Now</span>
                    </>
                  )}
                </button>

                <div className="flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      setIsReminderModalOpen(false);
                      setReminderWebinar(null);
                    }}
                    disabled={isSavingReminders}
                    className="px-4 py-2 rounded-full text-[13px] font-bold text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveReminders}
                    disabled={isSavingReminders}
                    className="px-5 py-2 rounded-full text-[13px] font-bold text-white bg-amber-600 hover:bg-amber-700 shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    {isSavingReminders ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Saving Schedule...</span>
                      </>
                    ) : (
                      <>
                        <Bell className="w-3.5 h-3.5" />
                        <span>Save Reminder Schedule</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deletingWebinarId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
            <div className="bg-white rounded-[24px] max-w-md w-full p-6 space-y-4 shadow-2xl border border-[#EAEAEA] relative">
              <div className="flex items-center gap-3 text-rose-600">
                <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
                  <Trash2 className="w-5 h-5 text-rose-600" />
                </div>
                <div>
                  <h3 className="text-[17px] font-goudy font-bold text-[#1F1F1F]">Delete Webinar</h3>
                  <p className="text-[12px] text-[#8E8E93]">This action cannot be undone.</p>
                </div>
              </div>

              <p className="text-[13px] text-gray-600 leading-relaxed">
                Are you sure you want to delete this webinar? All associated physician registration passes and attendance logs will also be permanently removed.
              </p>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#F0F0F0]">
                <button
                  type="button"
                  onClick={() => setDeletingWebinarId(null)}
                  disabled={isDeleting}
                  className="px-4 py-2 text-[13px] font-semibold text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteWebinar}
                  disabled={isDeleting}
                  className="px-5 py-2 text-[13px] font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-full transition-all shadow-sm flex items-center gap-1.5"
                >
                  {isDeleting ? 'Deleting...' : 'Confirm Delete'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
