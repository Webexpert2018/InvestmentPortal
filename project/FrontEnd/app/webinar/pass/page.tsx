"use client";

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { apiClient } from '@/lib/api/client';
import { toast } from 'sonner';
import {
  Video,
  Calendar,
  Clock,
  ExternalLink,
  CheckCircle2,
  Building2,
  Stethoscope,
  ShieldCheck,
  Sparkles,
  FileText,
} from 'lucide-react';

function WebinarPassContent() {
  const searchParams = useSearchParams();
  const webinarId = searchParams.get('webinarId') || searchParams.get('webinar_id') || 'web-101';
  const prospectId = searchParams.get('prospectId') || searchParams.get('prospect_id') || searchParams.get('id') || '';

  const [isLoading, setIsLoading] = useState(true);
  const [webinar, setWebinar] = useState<any>(null);
  const [doctor, setDoctor] = useState<any>(null);
  const [isJoining, setIsJoining] = useState(false);
  const [hasJoined, setHasJoined] = useState(false);

  useEffect(() => {
    loadPassDetails();
  }, [webinarId, prospectId]);

  const loadPassDetails = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.getWebinarPassDetails(webinarId, prospectId);
      if (res && res.success && res.webinar) {
        setWebinar(res.webinar);
        setDoctor(res.doctor);
      } else {
        // Fallback default info if not found
        setWebinar({
          id: webinarId,
          title: 'Physician Wealth & Tax-Advantaged Real Estate Strategies',
          description: 'Exclusive briefing on tax-deferred passive real estate funds tailored specifically for high-income medical doctors.',
          formattedDate: 'Saturday, August 15, 2026',
          time: '04:00 PM EST',
          duration: '45 mins',
          meetingLink: 'https://us06web.zoom.us/j/89230192834',
        });
      }
    } catch (err) {
      console.error('Error loading webinar pass:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const [activeSessionId, setActiveSessionId] = useState<number | null>(null);

  useEffect(() => {
    let intervalId: any = null;
    if (hasJoined && webinar?.id && (prospectId || doctor?.id)) {
      const pId = prospectId || doctor?.id;

      // Start 15-second heartbeat loop
      intervalId = setInterval(() => {
        apiClient.sendWebinarHeartbeat(webinar.id, pId, activeSessionId || undefined).catch(() => {});
      }, 15000);

      // Register unload listener using sendBeacon to finalize left_at & duration_seconds
      const handleUnload = () => {
        const backendUrl = process.env.NEXT_PUBLIC_API_URL || (process.env.NEXT_PUBLIC_BASE_URL ? `${process.env.NEXT_PUBLIC_BASE_URL}/api` : 'http://localhost:3001/api');
        const payload = JSON.stringify({
          webinarId: webinar.id,
          prospectId: pId,
          sessionId: activeSessionId || undefined,
        });
        const blob = new Blob([payload], { type: 'application/json' });
        navigator.sendBeacon(`${backendUrl}/webinar-campaign/heartbeat`, blob);
      };

      window.addEventListener('beforeunload', handleUnload);
      window.addEventListener('pagehide', handleUnload);

      return () => {
        if (intervalId) clearInterval(intervalId);
        window.removeEventListener('beforeunload', handleUnload);
        window.removeEventListener('pagehide', handleUnload);
      };
    }
  }, [hasJoined, webinar?.id, prospectId, doctor?.id, activeSessionId]);

  const handleJoinMeeting = async () => {
    setIsJoining(true);
    try {
      const pId = prospectId || doctor?.id;
      if (pId && webinar?.id) {
        const res = await apiClient.recordWebinarAttendance(webinar.id, pId);
        if (res && res.sessionId) {
          setActiveSessionId(res.sessionId);
        }
        toast.success('Attendance verified! Opening live webinar session...');
      }
      setHasJoined(true);

      // Open target meeting URL in new tab
      setTimeout(() => {
        if (webinar?.meetingLink) {
          window.open(webinar.meetingLink, '_blank');
        }
      }, 600);
    } catch (err: any) {
      console.error('Error logging attendance:', err);
      if (webinar?.meetingLink) {
        window.open(webinar.meetingLink, '_blank');
      }
    } finally {
      setIsJoining(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-4">
        <div className="w-10 h-10 border-3 border-amber-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-[14px] font-bold text-gray-700">Verifying VIP Physician Access Pass...</p>
      </div>
    );
  }

  const doctorName = doctor?.fullName || doctor?.full_name || 'Physician';

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-helvetica text-[#1F1F1F] flex flex-col items-center justify-center p-4 md:p-6">
      <div className="max-w-xl w-full bg-white rounded-[24px] border border-[#EAEAEA] shadow-xl overflow-hidden">
        {/* Top Header Branding Banner */}
        <div className="bg-gradient-to-r from-[#1F1F1F] via-[#2A2A2A] to-[#1F1F1F] text-white p-6 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <Sparkles className="w-32 h-32 text-amber-400" />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-400/20 border border-amber-400/30 rounded-full text-amber-300 text-[11px] font-bold uppercase tracking-wider mb-3">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
            <span>Verified Physician Pass</span>
          </div>

          <h1 className="text-[24px] md:text-[28px] font-goudy font-bold text-white tracking-tight">
            Ovalia Capital Investor Portal
          </h1>
          <p className="text-[13px] text-gray-300 mt-1">
            Private Executive Session for Accredited Physicians
          </p>
        </div>

        {/* Doctor Personal Greeting */}
        <div className="p-6 md:p-8 space-y-6">
          <div className="bg-amber-50/60 border border-amber-200/80 rounded-[18px] p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-200/80 text-amber-900 font-bold text-[16px] flex items-center justify-center shrink-0">
              {doctorName.charAt(0)}
            </div>
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-amber-800">Welcome</div>
              <div className="text-[16px] font-bold text-[#1F1F1F]">{doctorName}</div>
              {doctor?.specialty && (
                <div className="text-[12px] text-gray-600 flex items-center gap-1 mt-0.5">
                  <Stethoscope className="w-3 h-3 text-amber-600" />
                  <span>{doctor.specialty}</span>
                  {doctor?.organization && (
                    <>
                      <span className="text-gray-300">•</span>
                      <Building2 className="w-3 h-3 text-gray-400" />
                      <span>{doctor.organization}</span>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Session Overview Card */}
          <div className="space-y-4">
            <div className="space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#8E8E93]">Scheduled Briefing</span>
              <h2 className="text-[22px] font-goudy font-bold text-[#1F1F1F] leading-tight">
                {webinar?.title}
              </h2>
              <p className="text-[13px] text-[#6C6C6C] pt-1 leading-relaxed">
                {webinar?.description}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4 bg-[#F8F9FA] p-4 rounded-xl border border-[#EDEDED] text-[13px] font-medium text-gray-700">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-amber-600" />
                <span>{webinar?.formattedDate || webinar?.date}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-amber-600" />
                <span>{webinar?.time}</span>
                <span className="text-gray-300">•</span>
                <span>{webinar?.duration}</span>
              </div>
            </div>
          </div>

          {/* Primary Action Button */}
          <div className="space-y-3 pt-2">
            <button
              onClick={handleJoinMeeting}
              disabled={isJoining}
              className="w-full bg-[#FFC63F] hover:bg-[#F2B62D] text-[#1F1F1F] py-4 rounded-full font-bold text-[15px] shadow-md transition-all flex items-center justify-center gap-2 group cursor-pointer"
            >
              {isJoining ? (
                <>
                  <div className="w-5 h-5 border-2 border-[#1F1F1F] border-t-transparent rounded-full animate-spin" />
                  <span>Verifying Session &amp; Joining...</span>
                </>
              ) : hasJoined ? (
                <>
                  <CheckCircle2 className="w-5 h-5 text-green-800" />
                  <span>Attendance Verified! Redirecting...</span>
                </>
              ) : (
                <>
                  <Video className="w-5 h-5 text-[#1F1F1F]" />
                  <span>Enter Live Webinar Session</span>
                  <ExternalLink className="w-4 h-4 text-[#1F1F1F] group-hover:translate-x-0.5 transition-transform" />
                </>
              )}
            </button>

            <p className="text-[12px] text-center font-medium text-amber-900 bg-amber-50/80 border border-amber-200/80 p-2.5 rounded-xl">
              📌 <strong>Attendance Tracking:</strong> Please keep this browser tab open in the background while attending to accurately log your full session duration.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-[#F8F9FA] border-t border-[#EDEDED] p-4 text-center text-[12px] text-gray-500 flex items-center justify-between px-6">
          <span>Ovalia Capital Investor Relations</span>
          <a
            href="https://mail.google.com/mail/?view=cm&fs=1&to=portal@ovaliacapital.com&su=Physician+Webinar+Support+Query"
            target="_blank"
            rel="noopener noreferrer"
            className="text-amber-700 hover:underline font-bold"
          >
            Contact IR Support
          </a>
        </div>
      </div>
    </div>
  );
}

export default function WebinarPassPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-4">
          <div className="w-10 h-10 border-3 border-amber-500 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-[14px] font-bold text-gray-700">Loading Access Pass...</p>
        </div>
      }
    >
      <WebinarPassContent />
    </Suspense>
  );
}
