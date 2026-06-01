'use client';

import { useEffect, useState, useRef } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/lib/api/client';
import {
  Calendar,
  Clock,
  User,
  Plus,
  Check,
  X,
  Link2,
  AlertCircle,
  Loader2,
  Video,
  FileText,
  CalendarCheck,
  ChevronLeft,
  ChevronRight,
  Info,
  Pencil
} from 'lucide-react';

interface Participant {
  id: string;
  name: string;
  type: string;
  status: 'pending' | 'accepted' | 'rejected';
}

interface Meeting {
  id: string;
  title: string;
  description?: string;
  scheduled_date: string;
  duration_minutes: number;
  meeting_link?: string;
  organizer_id: string;
  organizer_type: string;
  organizer_name: string;
  is_edited?: boolean;
  participants: Participant[];
}

export default function ScheduleMeetingPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [availableParticipants, setAvailableParticipants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Interactive Calendar State
  const [calendarDate, setCalendarDate] = useState(() => new Date());
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<Date | null>(null);
  const [hoveredDate, setHoveredDate] = useState<{ day: number; month: number; year: number } | null>(null);
  const dateInputRef = useRef<HTMLInputElement | null>(null);
  const timeInputRef = useRef<HTMLInputElement | null>(null);

  // Custom Time Picker State
  const [isTimePickerOpen, setIsTimePickerOpen] = useState(false);
  const timePickerRef = useRef<HTMLDivElement | null>(null);
  const hourScrollRef = useRef<HTMLDivElement | null>(null);
  const minuteScrollRef = useRef<HTMLDivElement | null>(null);
  const periodScrollRef = useRef<HTMLDivElement | null>(null);

  // Month calculation
  const calendarYear = calendarDate.getFullYear();
  const calendarMonth = calendarDate.getMonth();

  const firstDayIndex = new Date(calendarYear, calendarMonth, 1).getDay();
  const totalDays = new Date(calendarYear, calendarMonth + 1, 0).getDate();
  const prevTotalDays = new Date(calendarYear, calendarMonth, 0).getDate();

  const calendarDays = [];

  // Padding from previous month
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    calendarDays.push({
      day: prevTotalDays - i,
      month: calendarMonth === 0 ? 11 : calendarMonth - 1,
      year: calendarMonth === 0 ? calendarYear - 1 : calendarYear,
      isCurrentMonth: false
    });
  }

  // Days of current month
  for (let i = 1; i <= totalDays; i++) {
    calendarDays.push({
      day: i,
      month: calendarMonth,
      year: calendarYear,
      isCurrentMonth: true
    });
  }

  // Padding for next month to complete the grid (usually 42 cells total)
  const remainingCells = 42 - calendarDays.length;
  for (let i = 1; i <= remainingCells; i++) {
    calendarDays.push({
      day: i,
      month: calendarMonth === 11 ? 0 : calendarMonth + 1,
      year: calendarMonth === 11 ? calendarYear + 1 : calendarYear,
      isCurrentMonth: false
    });
  }

  const getMeetingsForDay = (day: number, m: number, y: number) => {
    return meetings.filter(meeting => {
      const d = new Date(meeting.scheduled_date);
      return d.getDate() === day && d.getMonth() === m && d.getFullYear() === y;
    });
  };

  const handlePrevMonth = () => {
    setCalendarDate(prev => {
      const d = new Date(prev);
      d.setMonth(d.getMonth() - 1);
      return d;
    });
  };

  const handleNextMonth = () => {
    setCalendarDate(prev => {
      const d = new Date(prev);
      d.setMonth(d.getMonth() + 1);
      return d;
    });
  };

  const selectDate = (day: number, m: number, y: number) => {
    // Toggle functionality
    if (selectedCalendarDate &&
      selectedCalendarDate.getDate() === day &&
      selectedCalendarDate.getMonth() === m &&
      selectedCalendarDate.getFullYear() === y) {
      setSelectedCalendarDate(null);
    } else {
      setSelectedCalendarDate(new Date(y, m, day));
    }
  };

  const handleScheduleForDate = (day: number, m: number, y: number) => {
    const targetDate = new Date(y, m, day, 10, 0); // Default to 10:00 AM on selected day
    targetDate.setMinutes(targetDate.getMinutes() - targetDate.getTimezoneOffset());
    const dateString = targetDate.toISOString().slice(0, 16);
    setNewMeeting(prev => ({
      ...prev,
      scheduled_date: dateString
    }));
    setIsModalOpen(true);
  };

  const isToday = (day: number, m: number, y: number) => {
    const today = new Date();
    return today.getDate() === day && today.getMonth() === m && today.getFullYear() === y;
  };

  const isPastDate = (day: number, m: number, y: number) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dateToCheck = new Date(y, m, day);
    return dateToCheck < today;
  };

  const getMinDateTime = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  };

  const getMinDate = () => {
    const now = new Date();
    return now.toISOString().slice(0, 10);
  };

  const handleDateChange = (val: string) => {
    const timePart = newMeeting.scheduled_date ? newMeeting.scheduled_date.slice(11, 16) : '10:00';
    setNewMeeting(prev => ({
      ...prev,
      scheduled_date: `${val}T${timePart}`
    }));
  };

  const handleTimeChange = (val: string) => {
    const datePart = newMeeting.scheduled_date ? newMeeting.scheduled_date.slice(0, 10) : new Date().toISOString().slice(0, 10);
    setNewMeeting(prev => ({
      ...prev,
      scheduled_date: `${datePart}T${val}`
    }));
  };

  const parse24To12 = (time24: string) => {
    if (!time24) return { hour: '10', minute: '00', period: 'AM' };
    const [hStr, mStr] = time24.split(':');
    let h = parseInt(hStr || '10');
    let m = mStr || '00';
    
    // Normalize minutes to nearest 15-minute slot: '00', '15', '30', '45'
    const minVal = parseInt(m);
    if (minVal < 8) m = '00';
    else if (minVal < 23) m = '15';
    else if (minVal < 38) m = '30';
    else if (minVal < 53) m = '45';
    else {
      m = '00';
      h = (h + 1) % 24;
    }

    let period = 'AM';
    if (h >= 12) {
      period = 'PM';
      if (h > 12) h -= 12;
    } else if (h === 0) {
      h = 12;
    }
    return {
      hour: h.toString().padStart(2, '0'),
      minute: m,
      period
    };
  };

  const format12To24 = (h: string, m: string, period: string) => {
    let hour = parseInt(h);
    if (period === 'PM' && hour < 12) hour += 12;
    if (period === 'AM' && hour === 12) hour = 0;
    return `${hour.toString().padStart(2, '0')}:${m}`;
  };

  const hoursList = Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, '0'));
  const minutesList = ['00', '15', '30', '45'];
  const periodsList = ['AM', 'PM'];

  const scrollColumn = (ref: React.RefObject<HTMLDivElement | null>, direction: 'up' | 'down') => {
    if (ref.current) {
      const scrollAmount = 35;
      ref.current.scrollBy({
        top: direction === 'up' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const isDateSelected = (day: number, m: number, y: number) => {
    return selectedCalendarDate &&
      selectedCalendarDate.getDate() === day &&
      selectedCalendarDate.getMonth() === m &&
      selectedCalendarDate.getFullYear() === y;
  };

  // Filter meetings if date filter is active
  const filteredMeetings = selectedCalendarDate
    ? meetings.filter(meeting => {
      const d = new Date(meeting.scheduled_date);
      return d.getDate() === selectedCalendarDate.getDate() &&
        d.getMonth() === selectedCalendarDate.getMonth() &&
        d.getFullYear() === selectedCalendarDate.getFullYear();
    })
    : meetings;

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMeetingId, setEditingMeetingId] = useState<string | null>(null);
  const [participantSearchQuery, setParticipantSearchQuery] = useState('');
  const [newMeeting, setNewMeeting] = useState({
    title: '',
    description: '',
    scheduled_date: '',
    duration_minutes: 30,
    meeting_link: '',
    participant_ids: [] as string[]
  });

  const fetchMeetingsData = async () => {
    try {
      setLoading(true);
      const [fetchedMeetings, fetchedParticipants] = await Promise.all([
        apiClient.getMyMeetings(),
        apiClient.getAvailableMeetingParticipants()
      ]);
      setMeetings(fetchedMeetings);
      setAvailableParticipants(fetchedParticipants);
    } catch (err: any) {
      console.error('Failed to load meeting scheduler details:', err);
      setError(err?.message || 'Failed to load scheduling data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMeetingsData();
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (timePickerRef.current && !timePickerRef.current.contains(event.target as Node)) {
        setIsTimePickerOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    setError(null);
    if (!isModalOpen) {
      setEditingMeetingId(null);
      setNewMeeting({
        title: '',
        description: '',
        scheduled_date: '',
        duration_minutes: 30,
        meeting_link: '',
        participant_ids: []
      });
    }
  }, [isModalOpen]);

  const handleCreateMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMeeting.title || !newMeeting.scheduled_date || newMeeting.participant_ids.length === 0) {
      setError('Please fill in all required fields and select at least one participant.');
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields and select at least one participant.',
        variant: 'destructive',
      });
      return;
    }

    const scheduledDate = new Date(newMeeting.scheduled_date);
    const now = new Date();
    if (scheduledDate < new Date(now.getTime() - 60000)) {
      setError('Cannot schedule a meeting for a past date.');
      toast({
        title: 'Validation Error',
        description: 'Cannot schedule a meeting for a past date.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      if (editingMeetingId) {
        await apiClient.updateMeeting(editingMeetingId, newMeeting);
        setIsModalOpen(false);
        await fetchMeetingsData();
        toast({
          title: 'Meeting Updated',
          description: 'Meeting invitation has been updated successfully.',
          className: 'bg-green-50 border-green-200 text-green-800'
        });
      } else {
        await apiClient.createMeeting(newMeeting);
        setIsModalOpen(false);
        await fetchMeetingsData();
        toast({
          title: 'Meeting Scheduled',
          description: 'Meeting invitation has been sent successfully.',
          className: 'bg-green-50 border-green-200 text-green-800'
        });
      }
    } catch (err: any) {
      const errorMsg = err?.message || (editingMeetingId ? 'Failed to update the meeting invitation.' : 'Failed to schedule the meeting invitation.');
      setError(errorMsg);
      toast({
        title: editingMeetingId ? 'Update Failed' : 'Scheduling Failed',
        description: errorMsg,
        variant: 'destructive'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (meetingId: string, status: 'accepted' | 'rejected') => {
    try {
      setError(null);
      await apiClient.updateMeetingStatus(meetingId, status);
      // Fast local update to UI
      setMeetings(prev =>
        prev.map(m => {
          if (m.id === meetingId) {
            return {
              ...m,
              participants: m.participants.map(p =>
                p.id === user?.id ? { ...p, status } : p
              )
            };
          }
          return m;
        })
      );
      // Fetch fresh DB values
      await fetchMeetingsData();
      toast({
        title: `Invitation ${status.charAt(0).toUpperCase() + status.slice(1)}`,
        description: `You have successfully ${status} the meeting invitation.`,
        className: 'bg-green-50 border-green-200 text-green-800'
      });
    } catch (err: any) {
      const errorMsg = err?.message || 'Failed to update meeting response.';
      setError(errorMsg);
      toast({
        title: 'Action Failed',
        description: errorMsg,
        variant: 'destructive'
      });
    }
  };

  const handleEditClick = (meeting: Meeting) => {
    const targetDate = new Date(meeting.scheduled_date);
    targetDate.setMinutes(targetDate.getMinutes() - targetDate.getTimezoneOffset());
    const dateString = targetDate.toISOString().slice(0, 16);

    setNewMeeting({
      title: meeting.title,
      description: meeting.description || '',
      scheduled_date: dateString,
      duration_minutes: meeting.duration_minutes || 30,
      meeting_link: meeting.meeting_link || '',
      participant_ids: meeting.participants.map(p => p.id)
    });
    setEditingMeetingId(meeting.id);
    setIsModalOpen(true);
  };

  const toggleParticipantSelection = (id: string) => {
    setNewMeeting(prev => {
      const exists = prev.participant_ids.includes(id);
      if (exists) {
        return {
          ...prev,
          participant_ids: prev.participant_ids.filter(pId => pId !== id)
        };
      } else {
        return {
          ...prev,
          participant_ids: [...prev.participant_ids, id]
        };
      }
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'rejected': return 'bg-rose-50 text-rose-700 border-rose-200';
      default: return 'bg-amber-50 text-amber-700 border-amber-200';
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8 font-helvetica text-[#1F1F1F] max-w-7xl mx-auto py-4">
        {/* Title and Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-6">
          <div>
            <h1 className="font-goudy text-3xl sm:text-4xl font-bold tracking-tight text-[#1F1F1F]">
              Meeting Scheduler
            </h1>
            <p className="mt-1.5 text-sm text-[#8E8E93] font-light">
              Propose calendar invites, manage responses, and view upcoming video appointments.
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center justify-center gap-2 rounded-full bg-[#FBCB4B] px-6 py-3 font-goudy text-[16px] leading-none font-bold text-[#1F1F1F] shadow-sm hover:bg-[#E2B93B] transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="h-4 w-4 stroke-[3]" />
            Schedule Meeting
          </button>
        </div>

        {!isModalOpen && error && (
          <div className="rounded-xl bg-rose-50 border border-rose-100 p-4 flex items-start gap-3 text-rose-800 text-sm">
            <AlertCircle className="h-5 w-5 text-rose-600 flex-shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-10 w-10 animate-spin text-[#E2B93B]" />
            <p className="mt-4 text-sm text-[#8E8E93]">Loading schedule...</p>
          </div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-3">
            {/* Main Meetings Board */}
            <div className="lg:col-span-2 space-y-6">
              {/* Interactive Calendar Card */}
              <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <div>
                    <h3 className="font-goudy text-lg font-bold text-[#1F1F1F]">
                      Schedule Calendar
                    </h3>
                    <p className="text-xs text-[#8E8E93] mt-0.5 font-light">
                      Select a date to filter appointments and view daily schedules
                    </p>
                  </div>
                  <div className="flex items-center gap-3 self-end sm:self-center">
                    {selectedCalendarDate && (
                      <button
                        onClick={() => setSelectedCalendarDate(null)}
                        className="text-[11px] font-bold text-amber-700 bg-amber-50 px-3 py-1.5 rounded-full hover:bg-amber-100 transition-colors cursor-pointer"
                      >
                        Reset Filter
                      </button>
                    )}
                    <div className="flex items-center gap-1 bg-gray-50 rounded-full p-1 border border-gray-100">
                      <button
                        onClick={handlePrevMonth}
                        className="p-1.5 hover:bg-white rounded-full text-gray-600 transition-all cursor-pointer"
                        title="Previous Month"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      <span className="text-xs font-bold text-gray-700 px-2 min-w-[80px] text-center">
                        {calendarDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                      </span>
                      <button
                        onClick={handleNextMonth}
                        className="p-1.5 hover:bg-white rounded-full text-gray-600 transition-all cursor-pointer"
                        title="Next Month"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Days of Week Header */}
                <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                  <span>Sun</span>
                  <span>Mon</span>
                  <span>Tue</span>
                  <span>Wed</span>
                  <span>Thu</span>
                  <span>Fri</span>
                  <span>Sat</span>
                </div>

                {/* Days Grid */}
                <div className="grid grid-cols-7 gap-1.5">
                  {calendarDays.map((dayObj, index) => {
                    const dayMeetings = getMeetingsForDay(dayObj.day, dayObj.month, dayObj.year);
                    const today = isToday(dayObj.day, dayObj.month, dayObj.year);
                    const selected = isDateSelected(dayObj.day, dayObj.month, dayObj.year);
                    const past = isPastDate(dayObj.day, dayObj.month, dayObj.year);

                    return (
                      <button
                        key={index}
                        onClick={() => selectDate(dayObj.day, dayObj.month, dayObj.year)}
                        className={`flex flex-col items-center justify-between h-14 rounded-xl border p-1.5 transition-all duration-200 cursor-pointer ${selected
                            ? 'bg-[#FBCB4B] hover:bg-[#E2B93B] text-[#1F1F1F] font-bold shadow-md border-[#E2B93B] scale-[1.02] z-10'
                            : today
                              ? 'border-amber-400 bg-amber-50/20 text-amber-900 font-bold'
                              : past
                                ? 'bg-gray-50 border-gray-100/50 text-gray-400 opacity-60 hover:opacity-85'
                                : dayObj.isCurrentMonth
                                  ? 'bg-white hover:bg-gray-50 border-gray-100 text-gray-800'
                                  : 'bg-white hover:bg-gray-50 border-gray-100 text-gray-700 font-medium'
                          }`}
                      >
                        <span className="text-[11px] self-start leading-none">{dayObj.day}</span>
                        {dayMeetings.length > 0 && (
                          <div className="flex gap-0.5 mt-auto">
                            {dayMeetings.slice(0, 3).map((m, idx) => {
                              const myInvite = m.participants.find(p => p.id === user?.id);
                              const status = myInvite?.status || 'pending';
                              let dotColor = 'bg-amber-500';
                              if (status === 'accepted') dotColor = 'bg-emerald-500';
                              if (status === 'rejected') dotColor = 'bg-rose-500';
                              if (selected) dotColor = 'bg-gray-800';
                              return (
                                <span key={idx} className={`h-1.5 w-1.5 rounded-full ${dotColor}`}></span>
                              );
                            })}
                            {dayMeetings.length > 3 && (
                              <span className={`text-[8px] font-bold leading-none ${selected ? 'text-gray-800' : 'text-gray-400'}`}>+</span>
                            )}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Upcoming Meetings Heading */}
              <div className="flex items-center justify-between border-t border-gray-100 pt-4">
                <h2 className="font-goudy text-xl font-bold text-[#1F1F1F] flex items-center gap-3 flex-wrap">
                  <div className="flex items-center gap-2">
                    <CalendarCheck className="h-5 w-5 text-[#E2B93B]" />
                    {selectedCalendarDate ? (
                      <span>
                        Meetings on {selectedCalendarDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} ({filteredMeetings.length})
                      </span>
                    ) : (
                      <span>
                        Upcoming Meetings ({meetings.filter(m => new Date(m.scheduled_date) >= new Date()).length})
                      </span>
                    )}
                  </div>

                  {selectedCalendarDate && (
                    <button
                      onClick={() => {
                        const day = selectedCalendarDate.getDate();
                        const month = selectedCalendarDate.getMonth();
                        const year = selectedCalendarDate.getFullYear();
                        handleScheduleForDate(day, month, year);
                      }}
                      className="inline-flex items-center gap-1 bg-[#FFF9EE] text-[#E2B93B] hover:bg-[#E2B93B] hover:text-[#1F1F1F] font-bold text-xs px-2.5 py-1 rounded-lg border border-[#E2B93B]/30 hover:border-[#E2B93B] transition-all cursor-pointer shadow-sm active:scale-95 ml-2"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Propose Meeting</span>
                    </button>
                  )}
                </h2>
                {selectedCalendarDate && (
                  <button
                    onClick={() => setSelectedCalendarDate(null)}
                    className="text-xs text-amber-800 hover:text-amber-950 font-semibold cursor-pointer"
                  >
                    Show all meetings
                  </button>
                )}
              </div>

              {filteredMeetings.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-12 text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gray-50 text-gray-400">
                    <Calendar className="h-6 w-6" />
                  </div>
                  <h3 className="mt-4 text-sm font-semibold text-[#1F1F1F]">
                    {selectedCalendarDate ? 'No meetings scheduled' : 'No scheduled meetings'}
                  </h3>
                  <p className="mt-1 text-xs text-[#8E8E93] font-light">
                    {selectedCalendarDate
                      ? `There are no appointments on ${selectedCalendarDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}.`
                      : 'Propose your first meeting slot by clicking the Schedule button above.'
                    }
                  </p>
                  {selectedCalendarDate && (
                    <button
                      onClick={() => setSelectedCalendarDate(null)}
                      className="mt-4 text-xs font-bold text-amber-700 bg-amber-50 px-4 py-2 rounded-full hover:bg-amber-100 transition-all duration-300 cursor-pointer"
                    >
                      Clear Date Filter
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-4 transition-all duration-300">
                  {filteredMeetings.map((meeting) => {
                    const date = new Date(meeting.scheduled_date);
                    const formattedDate = date.toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    });
                    const formattedTime = date.toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                    });
                    const isUpcoming = date >= new Date();

                    // Find logged in user's invite details
                    const myInvite = meeting.participants.find(p => p.id === user?.id);

                    return (
                      <div
                        key={meeting.id}
                        className={`rounded-2xl border bg-white p-6 shadow-sm hover:shadow-md transition-all duration-300 ${!isUpcoming ? 'opacity-70 border-gray-100 bg-gray-50/50' : 'border-gray-100'
                          }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                          <div className="space-y-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="text-lg font-bold text-[#1F1F1F]">{meeting.title}</h3>
                              {!isUpcoming && (
                                <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-[10px] font-semibold text-gray-500 uppercase">
                                  Past
                                </span>
                              )}
                              {myInvite && myInvite.status === 'pending' && isUpcoming && (
                                <span className="rounded-full bg-amber-50 border border-amber-200 px-2.5 py-0.5 text-[10px] font-semibold text-amber-700 uppercase tracking-wide">
                                  Response Required
                                </span>
                              )}
                              {meeting.is_edited && (
                                <span className="rounded-full bg-blue-50 border border-blue-200 px-2.5 py-0.5 text-[10px] font-semibold text-blue-700 uppercase tracking-wide">
                                  Meeting Edited
                                </span>
                              )}
                            </div>

                            <p className="text-xs text-[#8E8E93] flex items-center gap-1 font-light">
                              <span>Scheduled by:</span>
                              <span className="font-semibold text-gray-700">{meeting.organizer_name}</span>
                              <span className="text-gray-300">|</span>
                              <span>Duration: {meeting.duration_minutes} mins</span>
                            </p>

                            {meeting.description && (
                              <p className="text-sm text-[#4B4B4B] leading-relaxed pt-1 font-light">
                                {meeting.description}
                              </p>
                            )}

                            <div className="flex flex-wrap gap-4 pt-3 text-xs text-[#4B4B4B]">
                              <div className="flex items-center gap-1.5 bg-[#FFF9EE] px-3 py-1.5 rounded-full text-amber-800 font-medium">
                                <Calendar className="h-3.5 w-3.5" />
                                {formattedDate}
                              </div>
                              <div className="flex items-center gap-1.5 bg-[#FFF9EE] px-3 py-1.5 rounded-full text-amber-800 font-medium">
                                <Clock className="h-3.5 w-3.5" />
                                {formattedTime}
                              </div>
                              {meeting.meeting_link && isUpcoming && (
                                <a
                                  href={meeting.meeting_link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1.5 bg-blue-50 text-blue-800 px-3 py-1.5 rounded-full font-medium hover:bg-blue-100 transition-colors"
                                >
                                  <Video className="h-3.5 w-3.5" />
                                  Join Video Call
                                </a>
                              )}
                            </div>
                          </div>

                          {/* Meeting Response Actions for Invitee */}
                          {myInvite && myInvite.status === 'pending' && isUpcoming && (
                            <div className="flex items-center gap-2 sm:self-start">
                              <button
                                onClick={() => handleUpdateStatus(meeting.id, 'accepted')}
                                className="flex h-9 items-center justify-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-4 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 transition-colors cursor-pointer"
                              >
                                <Check className="h-3.5 w-3.5 stroke-[3]" />
                                Accept
                              </button>
                              <button
                                onClick={() => handleUpdateStatus(meeting.id, 'rejected')}
                                className="flex h-9 items-center justify-center gap-1.5 rounded-full bg-rose-50 border border-rose-200 px-4 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition-colors cursor-pointer"
                              >
                                <X className="h-3.5 w-3.5 stroke-[3]" />
                                Reject
                              </button>
                            </div>
                          )}

                          {myInvite && myInvite.status !== 'pending' && isUpcoming && (
                            <div className="sm:self-start">
                              <span className={`inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-bold ${getStatusColor(myInvite.status)}`}>
                                {myInvite.status === 'accepted' ? <Check className="h-3 w-3 stroke-[3]" /> : <X className="h-3 w-3 stroke-[3]" />}
                                {myInvite.status.charAt(0).toUpperCase() + myInvite.status.slice(1)}
                              </span>
                            </div>
                          )}

                          {/* Organizer Actions */}
                          {meeting.organizer_id === user?.id && isUpcoming && (
                            <div className="flex items-center gap-2 sm:self-start">
                              <button
                                onClick={() => handleEditClick(meeting)}
                                className="flex h-9 items-center justify-center gap-1.5 rounded-full bg-amber-50 border border-amber-200 px-4 text-xs font-semibold text-amber-700 hover:bg-amber-100 transition-colors cursor-pointer"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                                Edit Meeting
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Invitees RSVP Tracker */}
                        <div className="mt-5 border-t border-gray-50 pt-4">
                          <p className="text-[11px] font-bold text-[#A0A0A0] uppercase tracking-wider mb-2">Participant Responses</p>
                          <div className="flex flex-wrap gap-2">
                            {meeting.participants.map(p => (
                              <div
                                key={p.id}
                                className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs ${p.status === 'accepted' ? 'border-emerald-100 bg-emerald-50/50 text-emerald-800' :
                                    p.status === 'rejected' ? 'border-rose-100 bg-rose-50/50 text-rose-800' :
                                      'border-amber-100 bg-amber-50/50 text-amber-800'
                                  }`}
                              >
                                <span className="h-1.5 w-1.5 rounded-full bg-current"></span>
                                <span className="font-medium">{p.name}</span>
                                <span className="text-[10px] opacity-75">({p.status})</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Sidebar info */}
            <div className="space-y-6">
              <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                <h3 className="font-goudy text-lg font-bold text-[#1F1F1F] flex items-center gap-2">
                  <Info className="h-5 w-5 text-[#E29F3A]" />
                  How to join?
                </h3>
                <div className="mt-4 space-y-4 text-xs text-[#8E8E93] leading-relaxed">
                  <p>
                    Every participant can Accept or Reject meeting proposals directly from their schedule board.
                  </p>
                  <p>
                    To keep things clean, Ovalia Capital schedules **daily agenda summaries**. On the morning of your meeting (8:00 AM server time), you will receive a single, unified email containing the join links for all of today&apos;s appointments.
                  </p>
                  <p>
                    Alternatively, you can join your scheduled sessions instantly by clicking the <strong className="text-gray-800">"Join Video Call"</strong> button directly from the meeting cards on this page when a call link is active.
                  </p>
                  <p className="bg-[#FFF9EE] border border-amber-100 text-amber-900 rounded-xl p-3">
                    <strong>Note:</strong> Meeting organizer permissions are strictly role-based to ensure privacy between staff relationships and investors.
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                <h3 className="font-goudy text-lg font-bold text-[#1F1F1F] flex items-center gap-2">
                  <Video className="h-5 w-5 text-[#E29F3A]" />
                  Video Setup (Optional)
                </h3>
                <div className="mt-4 space-y-3.5 text-xs text-[#8E8E93] leading-relaxed">
                  <p>
                    Adding a meeting link is completely <strong>optional</strong>. If you decide to add one, use these tips to ensure the link doesn&apos;t expire:
                  </p>

                  <div className="space-y-1 border-l-2 border-amber-200 pl-3">
                    <p className="font-semibold text-gray-800">Google Meet</p>
                    <p>
                      Schedule via <strong>Google Calendar</strong> instead of "Instant Meetings" to get a link that lasts 365 days.
                    </p>
                  </div>

                  <div className="space-y-1 border-l-2 border-amber-200 pl-3">
                    <p className="font-semibold text-gray-800">Zoom</p>
                    <p>
                      Use a scheduled meeting link or your <strong>Personal ID (PMI)</strong> link, both of which will not expire.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Schedule Meeting Form Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 overflow-y-auto">
            <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl border border-gray-100 my-8">
              <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-4">
                <h2 className="font-goudy text-2xl font-bold text-[#1F1F1F]">
                  {editingMeetingId ? 'Edit Invitation' : 'Schedule Invitation'}
                </h2>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {error && (
                <div className="rounded-xl bg-rose-50 border border-rose-100 p-4 mb-4 flex items-start gap-3 text-rose-800 text-sm animate-in fade-in slide-in-from-top-1 duration-200">
                  <AlertCircle className="h-5 w-5 text-rose-600 flex-shrink-0 mt-0.5" />
                  <p>{error}</p>
                </div>
              )}

              <form onSubmit={handleCreateMeeting} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#4B4B4B] uppercase tracking-wider mb-1">
                    Meeting Title <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Portfolio Review & Tax Discussion"
                    value={newMeeting.title}
                    onChange={(e) => setNewMeeting(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#FBCB4B] transition-shadow"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#4B4B4B] uppercase tracking-wider mb-1">
                    Description / Agenda
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Provide a quick outline of what will be discussed..."
                    value={newMeeting.description}
                    onChange={(e) => setNewMeeting(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#FBCB4B] transition-shadow resize-none"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[#4B4B4B] uppercase tracking-wider mb-1">
                      Date <span className="text-rose-500">*</span>
                    </label>
                    <input
                      ref={dateInputRef}
                      type="date"
                      required
                      min={getMinDate()}
                      value={newMeeting.scheduled_date ? newMeeting.scheduled_date.slice(0, 10) : ''}
                      onChange={(e) => handleDateChange(e.target.value)}
                      onClick={() => {
                        try {
                          dateInputRef.current?.showPicker();
                        } catch (e) {
                          console.error("showPicker not supported", e);
                        }
                      }}
                      className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#FBCB4B] transition-shadow cursor-pointer bg-white"
                    />
                  </div>
                  <div className="relative">
                    <label className="block text-xs font-bold text-[#4B4B4B] uppercase tracking-wider mb-1">
                      Time <span className="text-rose-500">*</span>
                    </label>
                    <div
                      onClick={() => setIsTimePickerOpen(!isTimePickerOpen)}
                      className="flex items-center justify-between w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus-within:ring-1 focus-within:ring-[#FBCB4B] transition-shadow cursor-pointer bg-white h-[42px]"
                    >
                      <span className="text-gray-700 select-none">
                        {(() => {
                          const parsed = parse24To12(newMeeting.scheduled_date ? newMeeting.scheduled_date.slice(11, 16) : '');
                          return `${parsed.hour}:${parsed.minute} ${parsed.period}`;
                        })()}
                      </span>
                      <Clock className="h-4 w-4 text-gray-400" />
                    </div>

                    {isTimePickerOpen && (
                      <div
                        ref={timePickerRef}
                        className="absolute left-0 mt-1 z-50 w-60 rounded-xl bg-white p-3 shadow-xl border border-gray-100 flex flex-col gap-2"
                      >
                        <div className="grid grid-cols-3 gap-1 h-44">
                          {/* Hours Column */}
                          {(() => {
                            const current = parse24To12(newMeeting.scheduled_date ? newMeeting.scheduled_date.slice(11, 16) : '');
                            return (
                              <div className="flex flex-col items-center">
                                <button
                                  type="button"
                                  onClick={() => scrollColumn(hourScrollRef, 'up')}
                                  className="p-1 hover:bg-gray-50 text-gray-400 hover:text-gray-600 rounded transition-colors w-full flex justify-center cursor-pointer"
                                >
                                  <ChevronLeft className="h-4 w-4 rotate-90" />
                                </button>
                                <div
                                  ref={hourScrollRef}
                                  className="w-full overflow-y-auto max-h-32 flex flex-col gap-1 py-1 scroll-smooth scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-50"
                                >
                                  {hoursList.map(h => (
                                    <button
                                      type="button"
                                      key={h}
                                      onClick={() => handleTimeChange(format12To24(h, current.minute, current.period))}
                                      className={`text-center py-1 text-xs rounded-md transition-colors cursor-pointer ${
                                        current.hour === h
                                          ? 'bg-amber-100 text-amber-900 font-bold'
                                          : 'hover:bg-gray-50 text-gray-700'
                                      }`}
                                    >
                                      {h}
                                    </button>
                                  ))}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => scrollColumn(hourScrollRef, 'down')}
                                  className="p-1 hover:bg-gray-50 text-gray-400 hover:text-gray-600 rounded transition-colors w-full flex justify-center cursor-pointer"
                                >
                                  <ChevronRight className="h-4 w-4 rotate-90" />
                                </button>
                              </div>
                            );
                          })()}

                          {/* Minutes Column */}
                          {(() => {
                            const current = parse24To12(newMeeting.scheduled_date ? newMeeting.scheduled_date.slice(11, 16) : '');
                            return (
                              <div className="flex flex-col items-center border-x border-gray-100">
                                <button
                                  type="button"
                                  onClick={() => scrollColumn(minuteScrollRef, 'up')}
                                  className="p-1 hover:bg-gray-50 text-gray-400 hover:text-gray-600 rounded transition-colors w-full flex justify-center cursor-pointer"
                                >
                                  <ChevronLeft className="h-4 w-4 rotate-90" />
                                </button>
                                <div
                                  ref={minuteScrollRef}
                                  className="w-full overflow-y-auto max-h-32 flex flex-col gap-1 py-1 scroll-smooth scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-50"
                                >
                                  {minutesList.map(m => (
                                    <button
                                      type="button"
                                      key={m}
                                      onClick={() => handleTimeChange(format12To24(current.hour, m, current.period))}
                                      className={`text-center py-1 text-xs rounded-md transition-colors cursor-pointer ${
                                        current.minute === m
                                          ? 'bg-amber-100 text-amber-900 font-bold'
                                          : 'hover:bg-gray-50 text-gray-700'
                                      }`}
                                    >
                                      {m}
                                    </button>
                                  ))}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => scrollColumn(minuteScrollRef, 'down')}
                                  className="p-1 hover:bg-gray-50 text-gray-400 hover:text-gray-600 rounded transition-colors w-full flex justify-center cursor-pointer"
                                >
                                  <ChevronRight className="h-4 w-4 rotate-90" />
                                </button>
                              </div>
                            );
                          })()}

                          {/* AM/PM Column */}
                          {(() => {
                            const current = parse24To12(newMeeting.scheduled_date ? newMeeting.scheduled_date.slice(11, 16) : '');
                            return (
                              <div className="flex flex-col items-center">
                                <button
                                  type="button"
                                  onClick={() => scrollColumn(periodScrollRef, 'up')}
                                  className="p-1 hover:bg-gray-50 text-gray-400 hover:text-gray-600 rounded transition-colors w-full flex justify-center cursor-pointer"
                                >
                                  <ChevronLeft className="h-4 w-4 rotate-90" />
                                </button>
                                <div
                                  ref={periodScrollRef}
                                  className="w-full overflow-y-auto max-h-32 flex flex-col gap-1 py-1 scroll-smooth scrollbar-thin"
                                >
                                  {periodsList.map(p => (
                                    <button
                                      type="button"
                                      key={p}
                                      onClick={() => handleTimeChange(format12To24(current.hour, current.minute, p))}
                                      className={`text-center py-2 text-xs rounded-md transition-colors cursor-pointer ${
                                        current.period === p
                                          ? 'bg-amber-100 text-amber-900 font-bold'
                                          : 'hover:bg-gray-50 text-gray-700'
                                      }`}
                                    >
                                      {p}
                                    </button>
                                  ))}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => scrollColumn(periodScrollRef, 'down')}
                                  className="p-1 hover:bg-gray-50 text-gray-400 hover:text-gray-600 rounded transition-colors w-full flex justify-center cursor-pointer"
                                >
                                  <ChevronRight className="h-4 w-4 rotate-90" />
                                </button>
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#4B4B4B] uppercase tracking-wider mb-1">
                      Duration
                    </label>
                    <select
                      value={newMeeting.duration_minutes}
                      onChange={(e) => setNewMeeting(prev => ({ ...prev, duration_minutes: parseInt(e.target.value) }))}
                      className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#FBCB4B] transition-shadow bg-white"
                    >
                      <option value={15}>15 Minutes</option>
                      <option value={30}>30 Minutes</option>
                      <option value={45}>45 Minutes</option>
                      <option value={60}>1 Hour</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#4B4B4B] uppercase tracking-wider mb-1">
                    Video Conference Link (Zoom / Google Meet)
                  </label>
                  <input
                    type="text"
                    placeholder="https://zoom.us/j/... or https://meet.google.com/..."
                    value={newMeeting.meeting_link}
                    onChange={(e) => setNewMeeting(prev => ({ ...prev, meeting_link: e.target.value }))}
                    className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#FBCB4B] transition-shadow"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#4B4B4B] uppercase tracking-wider mb-1.5">
                    Select Participants <span className="text-rose-500">*</span>
                  </label>

                  {availableParticipants.length === 0 ? (
                    <p className="text-xs text-[#8E8E93] italic">No eligible participants available.</p>
                  ) : (
                    <div className="space-y-2">
                      <input
                        type="text"
                        placeholder="Search participants by name or role..."
                        value={participantSearchQuery}
                        onChange={(e) => setParticipantSearchQuery(e.target.value)}
                        className="w-full rounded-xl border border-gray-200 px-4 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-[#FBCB4B] transition-shadow"
                      />

                      <div className="max-h-40 overflow-y-auto border border-gray-100 rounded-xl p-2 space-y-1.5">
                        {availableParticipants
                          .filter(p => {
                            const nameMatch = (p.name || '').toLowerCase().includes(participantSearchQuery.toLowerCase());
                            const roleMatch = (p.role || '').replace('_', ' ').toLowerCase().includes(participantSearchQuery.toLowerCase());
                            return nameMatch || roleMatch;
                          })
                          .map((p) => {
                            const isSelected = newMeeting.participant_ids.includes(p.id);
                            return (
                              <button
                                type="button"
                                key={p.id}
                                onClick={() => toggleParticipantSelection(p.id)}
                                className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs transition-colors cursor-pointer ${isSelected ? 'bg-[#FFF9EE] text-amber-900 border-l-4 border-[#FBCB4B]' : 'hover:bg-gray-50 text-gray-700'
                                  }`}
                              >
                                <div>
                                  <p className="font-semibold">{p.name || (p.role === 'accountant' ? 'Assigned Accountant' : 'Staff Member')}</p>
                                  <p className="text-[10px] opacity-75 capitalize">{p.role.replace('_', ' ')}</p>
                                </div>
                                <div className={`h-4 w-4 rounded-md border flex items-center justify-center ${isSelected ? 'border-[#FBCB4B] bg-[#FBCB4B] text-[#1F1F1F]' : 'border-gray-300'}`}>
                                  {isSelected && <Check className="h-3 w-3 stroke-[3]" />}
                                </div>
                              </button>
                            );
                          })}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 mt-6">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="rounded-full px-5 py-2.5 text-sm font-semibold text-gray-500 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex items-center justify-center gap-2 rounded-full bg-[#FBCB4B] px-6 py-2.5 text-sm font-bold text-[#1F1F1F] shadow-sm hover:bg-[#E2B93B] transition-all disabled:opacity-50"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        {editingMeetingId ? 'Saving...' : 'Scheduling...'}
                      </>
                    ) : (
                      editingMeetingId ? 'Save Changes' : 'Send Invitation'
                    )}
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
