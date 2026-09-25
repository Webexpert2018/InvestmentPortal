'use client';

import { useState, useEffect, useRef } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Phone, PhoneOff, Mic, MicOff, ArrowLeft, Loader2, Info } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { API_URL } from '@/lib/api/client';

let WebPhone: any;
if (typeof window !== 'undefined') {
  const rcwp = require('ringcentral-web-phone');
  WebPhone = rcwp.default || rcwp.WebPhone || rcwp;
}

export default function RingCentralDialer() {
  const searchParams = useSearchParams();
  const phoneParam = searchParams.get('phone') || '';
  const nameParam = searchParams.get('name') || 'Unknown Contact';

  const [phoneNumber, setPhoneNumber] = useState(phoneParam);
  const [isCalling, setIsCalling] = useState(false);
  const [callStatus, setCallStatus] = useState<'idle' | 'connecting' | 'connected'>('idle');
  const [isMuted, setIsMuted] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const callDurationRef = useRef(0);

  const [callLogs, setCallLogs] = useState<any[]>([]);
  const [transcripts, setTranscripts] = useState<Record<string, string>>({});
  const [loadingTranscripts, setLoadingTranscripts] = useState<Record<string, boolean>>({});

  const [rcStatus, setRcStatus] = useState('Initializing...');
  const webPhoneRef = useRef<any>(null);
  const activeSessionRef = useRef<any>(null);
  const sipSessionIdRef = useRef<string | null>(null);
  const startTimeRef = useRef<string | null>(null);
  const audioRemoteRef = useRef<HTMLAudioElement | null>(null);
  const audioLocalRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (callStatus === 'connected') {
      timer = setInterval(() => {
        setCallDuration((prev) => {
          const newDur = prev + 1;
          callDurationRef.current = newDur;
          return newDur;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [callStatus]);

  useEffect(() => {
    initRingCentral();
    fetchCallLogs();
    
    // Cleanup on unmount
    return () => {
      if (webPhoneRef.current) {
        try {
          webPhoneRef.current.dispose();
        } catch(e) {}
      }
    };
  }, []);

  const fetchCallLogs = async () => {
    try {
      const res = await fetch(`${API_URL}/ringcentral/call-logs`);
      if (res.ok) {
        const data = await res.json();
        setCallLogs(data.records || []);
      }
    } catch (e) {
      console.error('Failed to fetch call logs', e);
    }
  };

  const handleViewTranscript = async (sessionId: string, startTime: string, recordingId?: string) => {
    setLoadingTranscripts(prev => ({ ...prev, [sessionId]: true }));
    const apolloId = searchParams.get('apollo_id');
    try {
      const url = recordingId 
        ? `${API_URL}/ringcentral/transcript/${sessionId}?recordingId=${recordingId}&startTime=${encodeURIComponent(startTime)}${apolloId ? `&apolloId=${encodeURIComponent(apolloId)}` : ''}`
        : `${API_URL}/ringcentral/transcript/${sessionId}?startTime=${encodeURIComponent(startTime)}${apolloId ? `&apolloId=${encodeURIComponent(apolloId)}` : ''}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setTranscripts(prev => ({ ...prev, [sessionId]: data.transcript }));
      } else {
        toast.error('Failed to load transcript');
      }
    } catch (e) {
      toast.error('Error fetching transcript');
    } finally {
      setLoadingTranscripts(prev => ({ ...prev, [sessionId]: false }));
    }
  };

  const handleDownloadAudio = (recordingId: string) => {
    window.open(`${API_URL}/ringcentral/recording/${recordingId}`, '_blank');
  };

  const initRingCentral = async () => {
    try {
      // 1. Fetch SIP Provisioning from backend
      const res = await fetch(`${API_URL}/ringcentral/sip-provision`, {
        method: 'POST',
      });
      if (!res.ok) {
        let errText = 'Failed to get SIP provisioning from backend';
        try {
          const errData = await res.text();
          errText = `Backend error: ${res.status} - ${errData}`;
        } catch(e) {}
        throw new Error(errText);
      }
      const data = await res.json();
      
      if (!WebPhone) {
        throw new Error('WebPhone library not loaded');
      }

      // The backend returns { sipInfo: [{...}] }
      const sipInfo = data.sipInfo ? data.sipInfo[0] : data;

      // 2. Initialize WebPhone (v2.x API)
      const webPhone = new WebPhone({ sipInfo, debug: true });
      webPhoneRef.current = webPhone;

      // In v2.x, we must call start() explicitly
      await webPhone.start();

      setRcStatus('Ready');
      toast.success('RingCentral connected!');

      // Handle inbound calls (auto-reject for this dialer mock)
      webPhone.on("inboundCall", (inboundCallSession: any) => {
        try {
          inboundCallSession.decline();
        } catch (e) {}
      });

    } catch (error: any) {
      console.error('RingCentral init error:', error);
      setRcStatus('Failed to Init');
      toast.error(`Could not initialize RingCentral: ${error.message || 'Unknown error'}`);
    }
  };

  const handleCallEndCleanup = () => {
    let apolloId = searchParams.get('apollo_id');
    
    if (phoneNumber) {
      if (!apolloId) {
        apolloId = `non-prospect-${Math.random().toString(36).substring(2, 10)}`;
      }
      
      fetch(`${API_URL}/ringcentral/call-log`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: sipSessionIdRef.current,
          apolloId: apolloId,
          phoneNumber: phoneNumber,
          duration: callDurationRef.current,
          startTime: startTimeRef.current
        })
      }).catch(e => console.error('Failed to save local call log', e));
    }

    setIsCalling(false);
    setCallStatus('idle');
    setCallDuration(0);
    callDurationRef.current = 0;
    setIsMuted(false);
    setIsRecording(false);
    activeSessionRef.current = null;
    sipSessionIdRef.current = null;
    startTimeRef.current = null;
    if (audioRemoteRef.current) audioRemoteRef.current.srcObject = null;
    if (audioLocalRef.current) audioLocalRef.current.srcObject = null;
    
    // Fetch logs again after a short delay to allow RingCentral to process it
    setTimeout(fetchCallLogs, 5000);
  };

  const handleCall = async () => {
    if (!phoneNumber) {
      toast.error('Please enter a phone number');
      return;
    }
    if (rcStatus !== 'Ready' || !webPhoneRef.current) {
      toast.error('RingCentral SDK is not ready...');
      return;
    }

    setIsCalling(true);
    setCallStatus('connecting');
    toast.info(`Dialing ${phoneNumber}...`);

    try {
      // Start the call (v2.x API)
      const callSession = await webPhoneRef.current.call(phoneNumber);
      activeSessionRef.current = callSession;
      sipSessionIdRef.current = callSession.id 
        || (callSession.dialog ? callSession.dialog.id : null) 
        || (callSession.partyData ? callSession.partyData.sessionId : null)
        || (callSession.request ? callSession.request.call_id : null)
        || "unknown-sip-id";
      startTimeRef.current = new Date().toISOString();
      
      setCallStatus('connected');
      toast.success('Call connected!');
      
      const bindMedia = (stream: any) => {
        if (stream && audioRemoteRef.current) {
          audioRemoteRef.current.srcObject = stream;
        }
      };

      if (callSession.mediaStream) {
        bindMedia(callSession.mediaStream);
      } else {
        callSession.on('mediaStreamSet', bindMedia);
      }
      
      callSession.once('disposed', () => {
        handleCallEndCleanup();
        toast.success('Call ended');
      });



    } catch (error: any) {
      console.error('Dial error:', error);
      toast.error('Failed to dial number');
      handleCallEndCleanup();
    }
  };

  const handleEndCall = async () => {
    if (activeSessionRef.current) {
      try {
        await activeSessionRef.current.hangup();
      } catch (e) {
        console.error('Error ending call', e);
        handleCallEndCleanup();
      }
    } else {
      handleCallEndCleanup();
    }
  };

  const handleToggleMute = async () => {
    if (activeSessionRef.current) {
      try {
        if (isMuted) {
          await activeSessionRef.current.unmute();
          setIsMuted(false);
        } else {
          await activeSessionRef.current.mute();
          setIsMuted(true);
        }
      } catch(e) {
        console.error("Mute toggle failed", e);
      }
    }
  };

  const handleToggleRecord = async () => {
    if (activeSessionRef.current) {
      try {
        if (isRecording) {
          await activeSessionRef.current.stopRecording();
          setIsRecording(false);
          toast.info('Recording stopped');
        } else {
          await activeSessionRef.current.startRecording();
          setIsRecording(true);
          toast.success('Recording started');
        }
      } catch (e: any) {
        console.error("Record toggle failed", e);
        toast.error('Failed to start recording. Ensure On-Demand Recording is enabled in your RingCentral account.');
      }
    }
  };

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <DashboardLayout>
      <div className="w-full py-8 space-y-8 px-4 lg:px-8">
        
        {/* Hidden Audio Elements required for WebRTC Web Phone */}
        <audio ref={audioRemoteRef} id="remoteAudio" autoPlay />
        <audio ref={audioLocalRef} id="localAudio" autoPlay muted />

        <div className="max-w-7xl mx-auto w-full">
          <Link
            href="/dashboard/doctor-crm/call-manager"
            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 mb-6 transition-colors font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Call Manager
          </Link>

          <div className="flex gap-8 items-stretch w-full" style={{ display: 'flex', flexDirection: 'row' }}>
            
            {/* Dialer Card */}
            <div className="bg-white rounded-[24px] shadow-xl border border-gray-100 overflow-hidden flex flex-col" style={{ width: '60%' }}>
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-8 text-center text-white relative">
            <h1 className="text-2xl font-bold mb-2">RingCentral Web Phone</h1>
            <p className="text-blue-100 text-sm opacity-90">Real-time WebRTC Dialer</p>
            
            <div className="absolute top-4 right-4 flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${rcStatus === 'Ready' ? 'bg-green-400' : rcStatus.includes('Fail') || rcStatus === 'Error' ? 'bg-red-400' : 'bg-yellow-400'}`}></span>
              <span className="text-xs text-white/80">{rcStatus}</span>
            </div>
          </div>

          <div className="p-8">
            <div className="mb-8">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Recipient Name
              </label>
              <input
                type="text"
                value={nameParam}
                disabled
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-600 cursor-not-allowed"
              />
            </div>

            <div className="mb-8">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                disabled={isCalling || !!searchParams.get('phone')}
                placeholder="+1 (555) 000-0000"
                className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-lg font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed"
              />
            </div>

            <div className="flex flex-col items-center justify-center space-y-6">
              {callStatus === 'connecting' && (
                <div className="flex items-center gap-3 text-blue-600 font-medium animate-pulse">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Connecting...
                </div>
              )}

              {callStatus === 'connected' && (
                <div className="text-3xl font-mono font-bold text-gray-800 bg-gray-100 px-6 py-2 rounded-lg">
                  {formatDuration(callDuration)}
                </div>
              )}

              <div className="flex items-center gap-6">
                {isCalling && callStatus === 'connected' && (
                  <>
                    <button
                      onClick={handleToggleMute}
                      className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
                        isMuted ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                      title={isMuted ? "Unmute" : "Mute"}
                    >
                      {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                    </button>

                    <button
                      onClick={handleToggleRecord}
                      className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
                        isRecording ? 'bg-red-600 text-white animate-pulse shadow-lg shadow-red-500/50' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                      title={isRecording ? "Stop Recording" : "Start Recording"}
                    >
                      <div className={`w-4 h-4 rounded-full ${isRecording ? 'bg-white' : 'bg-red-500'}`}></div>
                    </button>
                  </>
                )}

                {!isCalling ? (
                  <button
                    onClick={handleCall}
                    disabled={rcStatus !== 'Ready' || !phoneNumber}
                    className="w-20 h-20 rounded-full bg-green-500 hover:bg-green-600 text-white flex items-center justify-center shadow-lg shadow-green-500/30 transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                  >
                    <Phone className="w-8 h-8 fill-current" />
                  </button>
                ) : (
                  <button
                    onClick={handleEndCall}
                    className="w-20 h-20 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center shadow-lg shadow-red-500/30 transition-all hover:scale-105"
                  >
                    <PhoneOff className="w-8 h-8" />
                  </button>
                )}
              </div>
            </div>
          </div>
          </div>

          {/* Instructions Card */}
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-[24px] shadow-sm border border-amber-200 p-8 flex flex-col justify-center" style={{ width: '40%' }}>
            <h3 className="text-xl font-extrabold text-amber-900 mb-6 flex items-center gap-3">
              <Info className="w-6 h-6 text-amber-600" />
              Transcription Rules
            </h3>
            <ul className="space-y-6 text-amber-900 text-[15px] leading-relaxed font-medium">
              <li className="flex items-start gap-4 bg-white/60 p-4 rounded-xl border border-amber-100 shadow-sm">
                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-amber-200 text-amber-800 flex items-center justify-center font-bold text-sm">1</span>
                <span>In order to get the transcription, you <strong className="text-red-600">MUST</strong> start recording the call during the conversation. Use the red record button once connected.</span>
              </li>
              <li className="flex items-start gap-4 bg-white/60 p-4 rounded-xl border border-amber-100 shadow-sm">
                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-amber-200 text-amber-800 flex items-center justify-center font-bold text-sm">2</span>
                <span>Once the call finishes, RingCentral will take a little time (usually 1-2 minutes) for the recording to get fetched and processed on their end.</span>
              </li>
              <li className="flex items-start gap-4 bg-white/60 p-4 rounded-xl border border-amber-100 shadow-sm">
                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-amber-200 text-amber-800 flex items-center justify-center font-bold text-sm">3</span>
                <span>After waiting a minute, you <strong className="text-red-600">MUST</strong> click the "View Transcript" button on the call log below. This forces the system to pull the recording, generate the transcript, and permanently save it into our database.</span>
              </li>
            </ul>
          </div>

        </div>
        </div>

        {/* Call Logs Section */}
        <div className="w-full max-w-7xl mx-auto bg-white rounded-[24px] shadow-xl border border-gray-100 p-8 min-h-[500px]">
          <div className="w-full">
            <h2 className="text-2xl font-bold text-gray-900 mb-8 flex items-center gap-3">
              Recent Call Logs
              <span className="text-sm font-medium px-3 py-1 bg-gray-100 text-gray-600 rounded-full">RingCentral API</span>
            </h2>
            {callLogs.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No recent calls found.</p>
          ) : (
            <div className="space-y-4">
              {callLogs.map((log) => (
                <div key={log.id} className="border border-gray-200 rounded-xl p-5 hover:border-blue-300 transition-colors">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-gray-900">
                        {log.direction === 'Outbound' ? 'To: ' : 'From: '} 
                        {log.to?.phoneNumber || log.from?.phoneNumber || 'Unknown'}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        {new Date(log.startTime).toLocaleString()} • {formatDuration(log.duration || 0)}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {log.recording && (
                        <button
                          onClick={() => handleDownloadAudio(log.recording.id)}
                          className="px-3 py-1.5 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 font-medium flex items-center gap-2"
                        >
                          Fetch Audio File
                        </button>
                      )}
                      <button
                        onClick={() => handleViewTranscript(log.sessionId, log.startTime, log.recording?.id)}
                        disabled={loadingTranscripts[log.sessionId]}
                        className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium disabled:opacity-50"
                      >
                        {loadingTranscripts[log.sessionId] ? 'Loading...' : transcripts[log.sessionId] ? 'Refresh Transcript' : 'View Transcript'}
                      </button>
                    </div>
                  </div>
                  
                  {transcripts[log.sessionId] && (
                    <div className="mt-4 p-4 bg-blue-50/50 border border-blue-100 rounded-lg text-sm text-gray-700 whitespace-pre-wrap">
                      <span className="font-semibold text-gray-900 block mb-2">Transcript:</span>
                      {transcripts[log.sessionId]}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
            </div>
          </div>

      </div>
    </DashboardLayout>
  );
}
