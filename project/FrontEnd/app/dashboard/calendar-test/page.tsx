'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { DashboardLayout } from '@/components/DashboardLayout';
import { 
  Calendar, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Loader2, 
  ExternalLink, 
  RefreshCw, 
  UserPlus, 
  Clock, 
  FileText,
  Check,
  X,
  HelpCircle,
  Link2,
  Video
} from 'lucide-react';

interface Attendee {
  email: string;
  status: string;
}

interface GoogleEvent {
  id: string;
  organizer_email: string;
  google_event_id: string;
  title: string;
  description: string;
  scheduled_date: string;
  duration_minutes: number;
  meeting_link?: string;
  html_link?: string;
  attendees: Attendee[];
}

export default function CalendarTestPage() {
  const searchParams = useSearchParams();
  
  // Status states
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [loadingStatus, setLoadingStatus] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Events list state
  const [events, setEvents] = useState<GoogleEvent[]>([]);
  const [loadingEvents, setLoadingEvents] = useState<boolean>(false);
  
  // Action tracking per event (to show spinners on specific items)
  const [syncingMap, setSyncingMap] = useState<Record<string, boolean>>({});
  const [respondingMap, setRespondingMap] = useState<Record<string, boolean>>({});
  
  // Custom guest email inputs mapped by google_event_id
  const [guestEmailMap, setGuestEmailMap] = useState<Record<string, string>>({});

  // Form states
  const [title, setTitle] = useState('Investment Portal Discussion');
  const [description, setDescription] = useState('Meeting to discuss investment options and portal access.');
  const [scheduledDate, setScheduledDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);
    // Format to YYYY-MM-DDTHH:MM local string
    const offset = tomorrow.getTimezoneOffset();
    const adjustedDate = new Date(tomorrow.getTime() - (offset * 60 * 1000));
    return adjustedDate.toISOString().substring(0, 16);
  });
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [attendeeEmailInput, setAttendeeEmailInput] = useState('');

  const getBackendUrl = () => {
    return process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3001';
  };

  const getHeaders = () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    return {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : '',
    };
  };

  // Fetch events list
  const fetchEvents = async (silent = false) => {
    try {
      if (!silent) setLoadingEvents(true);
      const res = await fetch(`${getBackendUrl()}/api/meetings/google/events`, {
        headers: getHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        setEvents(data);
      }
    } catch (err) {
      console.error('Failed to fetch events:', err);
    } finally {
      if (!silent) setLoadingEvents(false);
    }
  };

  // Check connection status
  const checkConnection = async () => {
    try {
      setLoadingStatus(true);
      const res = await fetch(`${getBackendUrl()}/api/meetings/google/token-status`, {
        headers: getHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        setIsConnected(data.connected);
        if (data.connected) {
          fetchEvents();
        }
      } else {
        setIsConnected(false);
      }
    } catch (err) {
      console.error('Failed to check Google connection:', err);
      setIsConnected(false);
    } finally {
      setLoadingStatus(false);
    }
  };

  useEffect(() => {
    checkConnection();
    
    // Check if redirected with success parameter
    if (searchParams.get('success') === 'true') {
      setSuccessMessage('Successfully connected your Google Calendar!');
      // Clear param
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [searchParams]);

  // Connect Google Calendar
  const handleConnect = async () => {
    try {
      setActionLoading(true);
      setErrorMessage(null);
      const res = await fetch(`${getBackendUrl()}/api/meetings/google/auth-url`, {
        headers: getHeaders(),
      });
      
      if (!res.ok) {
        throw new Error('Failed to fetch authentication URL');
      }

      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error connecting to Google');
      setActionLoading(false);
    }
  };

  // Create Event / Send Invite
  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    // Split attendee input by comma and clean up emails
    const emails = attendeeEmailInput
      .split(',')
      .map(email => email.trim())
      .filter(email => email.length > 0);

    try {
      const res = await fetch(`${getBackendUrl()}/api/meetings/google/create-event`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          title,
          description,
          scheduledDate: new Date(scheduledDate).toISOString(),
          durationMinutes,
          attendeeEmails: emails.length > 0 ? emails : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to create event');
      }

      setSuccessMessage(
        emails.length > 0 
          ? `Google Calendar event scheduled and invite(s) sent to ${emails.join(', ')}!`
          : 'Google Calendar event scheduled successfully!'
      );
      // Reset form
      setTitle('Investment Portal Discussion');
      setAttendeeEmailInput('');
      // Refresh list
      fetchEvents(true);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error creating meeting');
    } finally {
      setActionLoading(false);
    }
  };

  // Invite guest to a meeting
  const handleInviteGuest = async (googleEventId: string) => {
    const email = guestEmailMap[googleEventId]?.trim();
    if (!email) return;

    setRespondingMap(prev => ({ ...prev, [googleEventId]: true }));
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await fetch(`${getBackendUrl()}/api/meetings/google/invite`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          googleEventId,
          attendeeEmail: email,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to send invitation');
      }

      setSuccessMessage(`Invitation successfully sent to ${email}!`);
      // Clear input
      setGuestEmailMap(prev => {
        const copy = { ...prev };
        delete copy[googleEventId];
        return copy;
      });
      // Refresh list
      fetchEvents(true);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error inviting guest');
    } finally {
      setRespondingMap(prev => ({ ...prev, [googleEventId]: false }));
    }
  };

  // Sync RSVP Status for a specific meeting
  const handleSyncStatus = async (googleEventId: string) => {
    setSyncingMap(prev => ({ ...prev, [googleEventId]: true }));
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await fetch(`${getBackendUrl()}/api/meetings/google/event-status/${googleEventId}`, {
        headers: getHeaders(),
      });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.message || 'Failed to sync event status');
      }

      setSuccessMessage('RSVP Status synced from Google Calendar!');
      fetchEvents(true); // reload list silently
    } catch (err: any) {
      setErrorMessage(err.message || 'Error syncing status');
    } finally {
      setSyncingMap(prev => ({ ...prev, [googleEventId]: false }));
    }
  };

  // Respond on behalf of attendee (Yes/No/Maybe)
  const handleRespond = async (googleEventId: string, email: string, status: 'accepted' | 'declined' | 'tentative') => {
    setRespondingMap(prev => ({ ...prev, [googleEventId]: true }));
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await fetch(`${getBackendUrl()}/api/meetings/google/respond-event`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          googleEventId,
          attendeeEmail: email,
          responseStatus: status,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to send response');
      }

      setSuccessMessage(`RSVP response for ${email} set to ${status}!`);
      fetchEvents(true); // reload list silently
    } catch (err: any) {
      setErrorMessage(err.message || 'Error sending RSVP');
    } finally {
      setRespondingMap(prev => ({ ...prev, [googleEventId]: false }));
    }
  };

  const getRSVPBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'accepted':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3 h-3" /> Accepted
          </span>
        );
      case 'declined':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
            <XCircle className="w-3 h-3" /> Declined
          </span>
        );
      case 'tentative':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <HelpCircle className="w-3 h-3" /> Tentative
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
            <Clock className="w-3 h-3 animate-pulse" /> Pending
          </span>
        );
    }
  };

  const formatMeetingDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8 text-gray-900 dark:text-white">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-gray-200 dark:border-white/10 pb-6 mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
              <Calendar className="w-8 h-8 text-blue-600" />
              Google Calendar Sandbox
            </h1>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Integrate, schedule, and test Google Calendar invitations and Google Meet generation.
            </p>
          </div>

          <div>
            {loadingStatus ? (
              <div className="flex items-center gap-2 text-gray-500">
                <Loader2 className="w-4 h-4 animate-spin" /> Checking connection...
              </div>
            ) : isConnected ? (
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-sm font-semibold">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
                Google Connected
              </div>
            ) : (
              <button
                onClick={handleConnect}
                disabled={actionLoading}
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 transition-all duration-200 shadow-lg shadow-blue-500/10 disabled:opacity-50"
              >
                {actionLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                Connect Google Calendar
              </button>
            )}
          </div>
        </div>

        {/* Notifications */}
        {errorMessage && (
          <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-sm flex items-start gap-3 animate-in fade-in duration-300">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold">Error encountered</h4>
              <p className="mt-1">{errorMessage}</p>
            </div>
          </div>
        )}

        {successMessage && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-sm flex items-start gap-3 animate-in fade-in duration-300">
            <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold">Success</h4>
              <p className="mt-1">{successMessage}</p>
            </div>
          </div>
        )}

        {!isConnected && !loadingStatus && (
          <div className="text-center p-8 rounded-2xl bg-gray-50 dark:bg-white/[0.02] border border-gray-200 dark:border-white/5 backdrop-blur-md mb-8">
            <Calendar className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Connect Your Google Calendar</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-6">
              You must authenticate with your Google Workspace or Personal Account before scheduling calendar invites.
            </p>
            <button
              onClick={handleConnect}
              disabled={actionLoading}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 transition-all duration-200 shadow-xl shadow-blue-500/10 disabled:opacity-50"
            >
              {actionLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              Get Authorized
            </button>
          </div>
        )}

        {isConnected && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Form Section */}
            <div className="lg:col-span-4 bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-white/5 shadow-sm p-6 rounded-2xl h-fit">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                Schedule Invite
              </h2>
              
              <form onSubmit={handleSendInvite} className="space-y-5 text-left">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                    Event Title
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-white/[0.03] border border-gray-300 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition duration-150"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                    Description / Agenda
                  </label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-white/[0.03] border border-gray-300 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition duration-150 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                    Start Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-white/[0.03] border border-gray-300 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition duration-150"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                    Duration (Minutes)
                  </label>
                  <input
                    type="number"
                    required
                    min={5}
                    max={480}
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(parseInt(e.target.value))}
                    className="w-full bg-gray-50 dark:bg-white/[0.03] border border-gray-300 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition duration-150"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 flex items-center justify-between">
                    <span>Send Attendee Invite To</span>
                    <span className="text-[10px] lowercase text-gray-400 dark:text-gray-500 font-normal">Optional (comma separated)</span>
                  </label>
                  <input
                    type="text"
                    value={attendeeEmailInput}
                    onChange={(e) => setAttendeeEmailInput(e.target.value)}
                    placeholder="e.g. user1@test.com, user2@test.com"
                    className="w-full bg-gray-50 dark:bg-white/[0.03] border border-gray-300 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition duration-150"
                  />
                </div>

                <button
                  type="submit"
                  disabled={actionLoading}
                  className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 transition-all duration-200 shadow-xl shadow-blue-500/10 disabled:opacity-50"
                >
                  {actionLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {attendeeEmailInput.trim() ? 'Create & Send Invite' : 'Create Google Meeting'}
                </button>
              </form>
            </div>

            {/* Event List Section */}
            <div className="lg:col-span-8 space-y-6">
              <div className="bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-white/5 shadow-sm p-6 rounded-2xl h-full min-h-[500px]">
                <div className="flex items-center justify-between border-b border-gray-100 dark:border-white/5 pb-4 mb-6">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    Scheduled Sandbox Meetings
                  </h2>
                  <button 
                    onClick={() => fetchEvents()}
                    className="p-2 text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 transition"
                    title="Reload meetings list"
                  >
                    <RefreshCw className={`w-4 h-4 ${loadingEvents ? 'animate-spin' : ''}`} />
                  </button>
                </div>

                {loadingEvents ? (
                  <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                    <Loader2 className="w-8 h-8 animate-spin mb-4" />
                    <p className="text-sm">Loading scheduled meetings...</p>
                  </div>
                ) : events.length > 0 ? (
                  <div className="space-y-4 max-h-[700px] overflow-y-auto pr-1">
                    {events.map((event) => {
                      const isSyncing = syncingMap[event.google_event_id] || false;
                      const isResponding = respondingMap[event.google_event_id] || false;
                      const currentGuestEmail = guestEmailMap[event.google_event_id] || '';

                      return (
                        <div 
                          key={event.id}
                          className="p-5 rounded-2xl bg-gray-50 dark:bg-white/[0.02] border border-gray-200 dark:border-white/5 text-left flex flex-col md:flex-row md:items-start justify-between gap-6 hover:shadow-md transition-all duration-200"
                        >
                          <div className="space-y-3 flex-1 min-w-0">
                            <div>
                              <h3 className="font-bold text-base text-gray-900 dark:text-white truncate">
                                {event.title}
                              </h3>
                              {event.description && (
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                                  {event.description}
                                </p>
                              )}
                            </div>

                            <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-xs text-gray-500 dark:text-gray-400">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5 text-gray-400" />
                                {formatMeetingDate(event.scheduled_date)} ({event.duration_minutes} mins)
                              </span>
                            </div>

                            {/* Meeting URL Buttons */}
                            <div className="flex flex-wrap gap-2 pt-1">
                              {event.meeting_link && (
                                <a
                                  href={event.meeting_link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 text-xs font-semibold border border-emerald-500/20 transition"
                                >
                                  <Video className="w-3.5 h-3.5" /> Google Meet <ExternalLink className="w-2.5 h-2.5" />
                                </a>
                              )}
                              
                              {event.html_link && (
                                <a
                                  href={event.html_link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 text-xs font-semibold border border-blue-500/20 transition"
                                >
                                  <Link2 className="w-3.5 h-3.5" /> View Event <ExternalLink className="w-2.5 h-2.5" />
                                </a>
                              )}
                            </div>

                            {/* Participants List */}
                            <div className="pt-3 border-t border-gray-200/50 dark:border-white/5 space-y-2">
                              <span className="text-[9px] uppercase font-bold tracking-wider text-gray-400 block mb-1">
                                Invitees & RSVP Status
                              </span>
                              {event.attendees && event.attendees.length > 0 ? (
                                <div className="space-y-2">
                                  {event.attendees.map((attendee) => (
                                    <div key={attendee.email} className="flex flex-col sm:flex-row sm:items-center justify-between p-2 rounded-lg bg-white/40 dark:bg-white/[0.01] border border-gray-200/40 dark:border-white/[0.02] gap-2">
                                      <div className="min-w-0">
                                        <span className="text-xs font-medium text-gray-700 dark:text-gray-300 block truncate">
                                          {attendee.email}
                                        </span>
                                      </div>
                                      
                                      <div className="flex items-center gap-2 shrink-0">
                                        {getRSVPBadge(attendee.status)}
                                        
                                        {/* RSVP Simulation buttons directly next to the participant */}
                                        <div className="inline-flex rounded-lg border border-gray-200 dark:border-white/10 overflow-hidden bg-white dark:bg-black/20 text-[9px] font-bold">
                                          <button
                                            onClick={() => handleRespond(event.google_event_id, attendee.email, 'accepted')}
                                            disabled={isSyncing || isResponding}
                                            className="px-2 py-1 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 border-r border-gray-200 dark:border-white/10 transition"
                                            title="Simulate Attendee Accepting"
                                          >
                                            Yes
                                          </button>
                                          <button
                                            onClick={() => handleRespond(event.google_event_id, attendee.email, 'declined')}
                                            disabled={isSyncing || isResponding}
                                            className="px-2 py-1 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 border-r border-gray-200 dark:border-white/10 transition"
                                            title="Simulate Attendee Declining"
                                          >
                                            No
                                          </button>
                                          <button
                                            onClick={() => handleRespond(event.google_event_id, attendee.email, 'tentative')}
                                            disabled={isSyncing || isResponding}
                                            className="px-2 py-1 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 transition"
                                            title="Simulate Attendee Tentative"
                                          >
                                            Maybe
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-xs text-gray-400 block italic">No attendees added to this meeting yet.</span>
                              )}
                            </div>
                          </div>

                          {/* Controls Panel */}
                          <div className="flex flex-col gap-3 shrink-0 w-full md:w-auto md:min-w-[170px] border-t md:border-t-0 pt-4 md:pt-0 border-gray-200/50 dark:border-white/5">
                            
                            <button
                              onClick={() => handleSyncStatus(event.google_event_id)}
                              disabled={isSyncing || isResponding}
                              className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-gray-300 dark:border-white/10 text-xs font-semibold text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-white/5 transition-all duration-200 disabled:opacity-50"
                            >
                              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                              Sync Live RSVPs
                            </button>

                            <div className="pt-2 border-t border-gray-200/50 dark:border-white/5">
                              <span className="text-[9px] uppercase font-bold tracking-wider text-gray-400 block mb-1.5 text-center">
                                Invite Guest
                              </span>
                              <input
                                type="email"
                                placeholder="Enter guest email"
                                value={currentGuestEmail}
                                onChange={(e) => setGuestEmailMap(prev => ({ ...prev, [event.google_event_id]: e.target.value }))}
                                className="w-full bg-white dark:bg-white/[0.03] border border-gray-300 dark:border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition duration-150"
                              />
                              <button
                                onClick={() => handleInviteGuest(event.google_event_id)}
                                disabled={!currentGuestEmail || isResponding}
                                className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 transition duration-150 shadow-md shadow-blue-500/10 disabled:opacity-50 mt-1.5"
                              >
                                {isResponding && <Loader2 className="w-3 h-3 animate-spin" />}
                                Send Invitation
                              </button>
                            </div>

                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-24 text-gray-400 dark:text-gray-500 space-y-3">
                    <Calendar className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto" />
                    <p className="text-base font-medium">No sandbox meetings created yet.</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 max-w-sm mx-auto">
                      Fill out the scheduler form on the left to send an invite and start building your test meetings list.
                    </p>
                  </div>
                )}
              </div>
            </div>

          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
