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
  Link2
} from 'lucide-react';

export default function CalendarTestPage() {
  const searchParams = useSearchParams();
  
  // Status states
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [loadingStatus, setLoadingStatus] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

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
  const [attendeeEmail, setAttendeeEmail] = useState('yadavnitin281988@gmail.com');

  // Created event states
  const [createdEvent, setCreatedEvent] = useState<{
    meetingId: string;
    googleEventId: string;
    htmlLink?: string;
    meetingLink?: string;
  } | null>(null);
  const [attendeeStatus, setAttendeeStatus] = useState<string>('pending');
  const [syncingStatus, setSyncingStatus] = useState<boolean>(false);

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

    try {
      const res = await fetch(`${getBackendUrl()}/api/meetings/google/create-event`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          title,
          description,
          scheduledDate: new Date(scheduledDate).toISOString(),
          durationMinutes,
          attendeeEmail,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to create event');
      }

      setCreatedEvent({
        meetingId: data.meetingId,
        googleEventId: data.googleEventId,
        htmlLink: data.htmlLink,
        meetingLink: data.meetingLink,
      });
      setAttendeeStatus('needsAction');
      setSuccessMessage('Google Calendar invite sent successfully!');
    } catch (err: any) {
      setErrorMessage(err.message || 'Error sending invite');
    } finally {
      setActionLoading(false);
    }
  };

  // Sync RSVP Status
  const handleSyncStatus = async () => {
    if (!createdEvent) return;
    setSyncingStatus(true);
    setErrorMessage(null);

    try {
      const res = await fetch(`${getBackendUrl()}/api/meetings/google/event-status/${createdEvent.googleEventId}`, {
        headers: getHeaders(),
      });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.message || 'Failed to sync event status');
      }

      const attendee = data.attendees?.find(
        (a: any) => a.email?.toLowerCase() === attendeeEmail.toLowerCase()
      );
      setAttendeeStatus(attendee?.responseStatus || 'needsAction');
      setSuccessMessage('RSVP Status synced from Google Calendar!');
    } catch (err: any) {
      setErrorMessage(err.message || 'Error syncing status');
    } finally {
      setSyncingStatus(false);
    }
  };

  // Respond on behalf of attendee (Yes/No/Maybe)
  const handleRespond = async (status: 'accepted' | 'declined' | 'tentative') => {
    if (!createdEvent) return;
    setActionLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await fetch(`${getBackendUrl()}/api/meetings/google/respond-event`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          googleEventId: createdEvent.googleEventId,
          attendeeEmail,
          responseStatus: status,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to send response');
      }

      const attendee = data.attendees?.find(
        (a: any) => a.email?.toLowerCase() === attendeeEmail.toLowerCase()
      );
      setAttendeeStatus(attendee?.responseStatus || status);
      setSuccessMessage(`RSVP response successfully set to ${status}!`);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error sending RSVP');
    } finally {
      setActionLoading(false);
    }
  };

  const getRSVPBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'accepted':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3.5 h-3.5" /> Accepted (Yes)
          </span>
        );
      case 'declined':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
            <XCircle className="w-3.5 h-3.5" /> Declined (No)
          </span>
        );
      case 'tentative':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <HelpCircle className="w-3.5 h-3.5" /> Tentative (Maybe)
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 animate-pulse">
            <Clock className="w-3.5 h-3.5" /> Needs Action / Pending
          </span>
        );
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8 text-gray-900 dark:text-white">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-gray-200 dark:border-white/10 pb-6 mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
              <Calendar className="w-8 h-8 text-blue-600" />
              Google Calendar Integration
            </h1>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Integrate, test, and manage Google Calendar invites directly inside the portal sandbox.
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
            <div className="lg:col-span-7 bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-white/5 shadow-sm p-6 rounded-2xl">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                Schedule Invites
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                    Send Attendee Invite To
                  </label>
                  <input
                    type="email"
                    required
                    value={attendeeEmail}
                    onChange={(e) => setAttendeeEmail(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-white/[0.03] border border-gray-300 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition duration-150"
                  />
                </div>

                <button
                  type="submit"
                  disabled={actionLoading}
                  className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 transition-all duration-200 shadow-xl shadow-blue-500/10 disabled:opacity-50"
                >
                  {actionLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  Send Google Calendar Invite
                </button>
              </form>
            </div>

            {/* Event status Tracking Section */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-white/5 shadow-sm p-6 rounded-2xl h-full">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  Active Event Status
                </h2>

                {createdEvent ? (
                  <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
                    <div className="p-4 rounded-xl bg-gray-50 dark:bg-white/[0.03] border border-gray-200 dark:border-white/5 space-y-4 text-left">
                      <div>
                        <span className="text-[10px] uppercase font-bold tracking-wider text-gray-500 dark:text-gray-400 block mb-1">
                          Google Event ID
                        </span>
                        <code className="text-xs text-blue-600 dark:text-blue-400 font-mono break-all block bg-gray-100 dark:bg-black/30 p-2.5 rounded-lg border border-gray-200 dark:border-white/5">
                          {createdEvent.googleEventId}
                        </code>
                      </div>

                      {createdEvent.htmlLink && (
                        <div>
                          <a
                            href={createdEvent.htmlLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 font-semibold hover:underline"
                          >
                            <Link2 className="w-3.5 h-3.5" /> View on Google Calendar <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      )}

                      {createdEvent.meetingLink && (
                        <div className="pt-2 border-t border-gray-200 dark:border-white/5">
                          <span className="text-[10px] uppercase font-bold tracking-wider text-gray-500 dark:text-gray-400 block mb-1">
                            Google Meet Link
                          </span>
                          <a
                            href={createdEvent.meetingLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 dark:hover:text-emerald-300 font-semibold hover:underline bg-emerald-500/10 p-2.5 rounded-lg border border-emerald-500/20 w-full justify-between"
                          >
                            <span className="truncate">{createdEvent.meetingLink}</span>
                            <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                          </a>
                        </div>
                      )}
                    </div>

                    <div className="p-4 rounded-xl bg-gray-50 dark:bg-white/[0.03] border border-gray-200 dark:border-white/5 space-y-4 text-left">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-[10px] uppercase font-bold tracking-wider text-gray-500 dark:text-gray-400 block">
                            Attendee Status
                          </span>
                          <span className="text-sm font-semibold text-gray-900 dark:text-white mt-1 block">
                            {attendeeEmail}
                          </span>
                        </div>
                        <div>
                          {getRSVPBadge(attendeeStatus)}
                        </div>
                      </div>

                      <button
                        onClick={handleSyncStatus}
                        disabled={syncingStatus}
                        className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-gray-300 dark:border-white/10 text-xs font-semibold text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-white/5 transition-all duration-200 disabled:opacity-50"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${syncingStatus ? 'animate-spin' : ''}`} />
                        Sync RSVP Status
                      </button>
                    </div>

                    <div className="pt-2">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-gray-500 dark:text-gray-400 block mb-3 text-center">
                        Simulate Attendee RSVP Status
                      </span>
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          onClick={() => handleRespond('accepted')}
                          disabled={actionLoading}
                          className="inline-flex items-center justify-center gap-1.5 px-3.5 py-3 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition duration-150 text-xs font-bold disabled:opacity-50"
                        >
                          <Check className="w-4 h-4" /> Yes
                        </button>
                        <button
                          onClick={() => handleRespond('declined')}
                          disabled={actionLoading}
                          className="inline-flex items-center justify-center gap-1.5 px-3.5 py-3 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 transition duration-150 text-xs font-bold disabled:opacity-50"
                        >
                          <X className="w-4 h-4" /> No
                        </button>
                        <button
                          onClick={() => handleRespond('tentative')}
                          disabled={actionLoading}
                          className="inline-flex items-center justify-center gap-1.5 px-3.5 py-3 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 transition duration-150 text-xs font-bold disabled:opacity-50"
                        >
                          <HelpCircle className="w-4 h-4" /> Maybe
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-16 text-gray-500 space-y-3">
                    <Calendar className="w-10 h-10 text-gray-400 dark:text-gray-600 mx-auto" />
                    <p className="text-sm">No active event scheduled yet.</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 max-w-[200px] mx-auto">
                      Fill the form to send your first invite to yadavnitin281988@gmail.com
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
