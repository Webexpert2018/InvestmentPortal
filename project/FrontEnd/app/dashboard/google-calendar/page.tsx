'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/DashboardLayout';
import { apiClient } from '@/lib/api/client';
import { 
  Calendar, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  ArrowLeft,
  Settings,
  Mail,
  RefreshCw,
  Unlink
} from 'lucide-react';
import { toast } from 'sonner';

export default function GoogleCalendarPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [connectedEmail, setConnectedEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  const checkStatus = async () => {
    try {
      setLoading(true);
      const data = await apiClient.getGoogleTokenStatus();
      setIsConnected(data.connected);
      if (data.email) {
        setConnectedEmail(data.email);
      } else {
        setConnectedEmail(null);
      }
    } catch (err) {
      console.error('Failed to load Google Calendar connection status:', err);
      setIsConnected(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkStatus();

    if (searchParams.get('success') === 'true') {
      toast.success('Successfully connected your Google Calendar!');
      // Clear URL params
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [searchParams]);

  const handleConnect = async () => {
    try {
      setActionLoading(true);
      const data = await apiClient.getGoogleAuthUrl();
      if (data && data.url) {
        window.location.href = data.url;
      } else {
        toast.error('Could not retrieve Google authorization link.');
        setActionLoading(false);
      }
    } catch (err) {
      console.error('Error starting Google connection:', err);
      toast.error('Failed to request Google authorization link.');
      setActionLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        
        {/* Back navigation */}
        <button
          onClick={() => router.push('/dashboard/webinars')}
          className="inline-flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-gray-900 transition-colors uppercase tracking-wider mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Webinars
        </button>

        {/* Card Panel */}
        <div className="bg-white rounded-[24px] border border-[#E8E8E8] shadow-sm overflow-hidden">
          
          {/* Header */}
          <div className="border-b border-[#F0F0F0] p-6 bg-gradient-to-r from-gray-50 to-white flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className="p-3 bg-[#FFF9EE] text-[#D9A11E] border border-[#FFE7A8] rounded-2xl">
                <Calendar className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-[#1F1F1F]">Google Calendar Integration</h1>
                <p className="text-xs text-[#6C6C6C] mt-0.5">Manage your calendar sync for webinar invitations and reminder schedules</p>
              </div>
            </div>
            
            <button
              onClick={checkStatus}
              disabled={loading || actionLoading}
              className="p-2 text-gray-400 hover:text-[#D9A11E] transition-colors rounded-lg border border-[#F0F0F0] hover:bg-gray-50"
              title="Refresh connection status"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Content */}
          <div className="p-8 text-center">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3 text-gray-500">
                <Loader2 className="w-8 h-8 animate-spin text-[#D9A11E]" />
                <span className="text-sm font-medium">Checking Google Calendar status...</span>
              </div>
            ) : isConnected ? (
              <div className="py-6 space-y-6">
                <div className="mx-auto w-16 h-16 bg-emerald-50 border border-emerald-200 text-emerald-600 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-lg font-bold text-gray-900">Google Calendar Connected</h3>
                  <p className="text-sm text-[#6C6C6C] max-w-md mx-auto">
                    Your account is active. Webinars created will automatically schedule events and issue invites to attendees.
                  </p>
                </div>

                {connectedEmail && (
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-semibold text-gray-700">
                    <Mail className="w-4 h-4 text-gray-400" />
                    {connectedEmail}
                  </div>
                )}

                <div className="pt-4 max-w-sm mx-auto">
                  <button
                    onClick={handleConnect}
                    disabled={actionLoading}
                    className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-white border border-[#dadce0] hover:bg-gray-50 text-gray-700 font-bold text-sm rounded-xl transition duration-150 shadow-sm"
                  >
                    {actionLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                    Switch Google Account
                  </button>
                </div>
              </div>
            ) : (
              <div className="py-6 space-y-6">
                <div className="mx-auto w-16 h-16 bg-[#FFF9EE] border border-[#FFE7A8] text-[#D9A11E] rounded-full flex items-center justify-center">
                  <AlertCircle className="w-8 h-8" />
                </div>

                <div className="space-y-2">
                  <h3 className="text-lg font-bold text-gray-900">Not Connected</h3>
                  <p className="text-sm text-[#6C6C6C] max-w-md mx-auto">
                    Authorize Google Calendar to enable campaign invite dispatches, Zoom/Google Meet link sync, and countdown reminders.
                  </p>
                </div>

                <div className="pt-4 max-w-sm mx-auto">
                  <button
                    onClick={handleConnect}
                    disabled={actionLoading}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-[#FFC63F] hover:bg-[#F1B92E] text-[#1F1F1F] font-bold text-sm rounded-xl transition duration-150 shadow-md shadow-amber-500/10"
                  >
                    {actionLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                    Connect Google Calendar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}
