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
  const audioPlaybackRef = useRef<HTMLAudioElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioNodesRef = useRef<any[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const remoteMediaSourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordingUrl, setRecordingUrl] = useState<string | null>(null);
  const [isTranscribing, setIsTranscribing] = useState(false);

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
    // Prevent echo for the remote caller by enforcing WebRTC audio constraints
    if (typeof navigator !== 'undefined' && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      const originalGetUserMedia = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
      navigator.mediaDevices.getUserMedia = async (constraints: MediaStreamConstraints) => {
        if (constraints && constraints.audio) {
          if (typeof constraints.audio === 'boolean') {
            constraints.audio = {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true
            };
          } else if (typeof constraints.audio === 'object') {
            constraints.audio.echoCancellation = true;
            constraints.audio.noiseSuppression = true;
            constraints.audio.autoGainControl = true;
          }
        }
        return originalGetUserMedia(constraints);
      };
    }

    initRingCentral();
    fetchCallLogs();

    // Cleanup on unmount
    return () => {
      if (webPhoneRef.current) {
        try {
          webPhoneRef.current.dispose();
        } catch (e) { }
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
        } catch (e) { }
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
        } catch (e) { }
      });

    } catch (error: any) {
      console.error('RingCentral init error:', error);
      setRcStatus('Failed to Init');
      toast.error(`Could not initialize RingCentral: ${error.message || 'Unknown error'}`);
    }
  };

  const handleCallEndCleanup = () => {
    let apolloId = searchParams.get('apollo_id');

    // Stop browser recording if active
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }

    // Clear audio node references to allow GC
    audioNodesRef.current = [];

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
    // Do NOT clear sipSessionIdRef or startTimeRef here, 
    // we need them for handleUploadTranscript after the call ends!

    // Do NOT set audioRemoteRef.current.srcObject = null if we are using MediaElementSource, 
    // it can mess up the Web Audio API graph. Just pause it.
    if (audioRemoteRef.current) {
      audioRemoteRef.current.pause();
      audioRemoteRef.current.srcObject = null;
    }
    if (audioLocalRef.current) {
      audioLocalRef.current.pause();
      audioLocalRef.current.srcObject = null;
    }
    if (audioPlaybackRef.current) {
      audioPlaybackRef.current.pause();
      audioPlaybackRef.current.srcObject = null;
    }

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

      const bindMedia = async (stream: any) => {
        if (stream && audioRemoteRef.current) {
            let remoteStreamToRecord = stream;

            // Isolate the true remote WebRTC track from the RTCPeerConnection to prevent the echo
            try {
              if (callSession.rtcPeerConnection) {
                const receivers = callSession.rtcPeerConnection.getReceivers();
                const remoteTrack = receivers.find((r: any) => r.track && r.track.kind === 'audio')?.track;
                if (remoteTrack) {
                  remoteStreamToRecord = new MediaStream([remoteTrack]);
                }
              }
            } catch (err) {
              console.warn('Failed to isolate remote track', err);
            }

            // Play the isolated stream out loud in the DOM. This eliminates the echo loopback from the raw stream!
            // Chrome will also perfectly record this stream because it is actively playing in a real DOM element.
            if (audioPlaybackRef.current) {
              audioPlaybackRef.current.srcObject = remoteStreamToRecord;
              audioPlaybackRef.current.play().catch(e => console.error('Play error:', e));
            }

            try {
              const localStream = await navigator.mediaDevices.getUserMedia({ 
                audio: { 
                  echoCancellation: true, 
                  noiseSuppression: true, 
                  autoGainControl: true 
                } 
              });

            localStreamRef.current = localStream;

            // Mix both streams into a single audio track using Web Audio API
            const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const dest = audioCtx.createMediaStreamDestination();

            const localSource = audioCtx.createMediaStreamSource(localStream);
            const remoteSource = audioCtx.createMediaStreamSource(remoteStreamToRecord);

            localSource.connect(dest);
            remoteSource.connect(dest);

            const mixedRecorder = new MediaRecorder(dest.stream);
            const localRecorder = new MediaRecorder(localStream);
            
            // Bypass Web Audio for the remote track to guarantee the backend gets the data
            const remoteRecorder = new MediaRecorder(remoteStreamToRecord);

            const mixedChunks: Blob[] = [];
            const localChunks: Blob[] = [];
            const remoteChunks: Blob[] = [];

            mixedRecorder.ondataavailable = e => { if (e.data.size > 0) mixedChunks.push(e.data); };
            localRecorder.ondataavailable = e => { if (e.data.size > 0) localChunks.push(e.data); };
            remoteRecorder.ondataavailable = e => { if (e.data.size > 0) remoteChunks.push(e.data); };

            let mixedBlob: Blob | null = null;
            let localBlob: Blob | null = null;
            let remoteBlob: Blob | null = null;

            const checkAndSave = () => {
              if (mixedBlob && localBlob && remoteBlob) {
                console.log(`All 3 Recordings completed. Mixed: ${mixedBlob.size}`);
                // Save them together in a virtual tri-blob state
                setRecordedBlob({ mixed: mixedBlob, local: localBlob, remote: remoteBlob } as any);
                setRecordingUrl(URL.createObjectURL(mixedBlob));
              }
            };

            mixedRecorder.onstop = () => {
              mixedBlob = new Blob(mixedChunks, { type: 'audio/webm' });
              checkAndSave();
            };

            localRecorder.onstop = () => {
              localBlob = new Blob(localChunks, { type: 'audio/webm' });
              localStream.getTracks().forEach(t => t.stop());
              checkAndSave();
            };

            remoteRecorder.onstop = () => {
              remoteBlob = new Blob(remoteChunks, { type: 'audio/webm' });
              checkAndSave();
            };

            mixedRecorder.start();
            localRecorder.start();
            remoteRecorder.start();

            // Store them in the single ref to stop all later
            mediaRecorderRef.current = {
              state: 'recording',
              stop: () => {
                if (mixedRecorder.state !== 'inactive') mixedRecorder.stop();
                if (localRecorder.state !== 'inactive') localRecorder.stop();
                if (remoteRecorder.state !== 'inactive') remoteRecorder.stop();
                if (mediaRecorderRef.current) {
                  (mediaRecorderRef.current as any).state = 'inactive';
                }
              }
            } as any;

            console.log('Tri-MediaRecorder started for perfectly mixed UI and dual transcription.');
          } catch (err) {
            console.error('Failed to start browser recording', err);
          }
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
          // Unmute our local recording stream
          if (localStreamRef.current) {
             localStreamRef.current.getAudioTracks().forEach(t => t.enabled = true);
          }
        } else {
          await activeSessionRef.current.mute();
          setIsMuted(true);
          // Mute our local recording stream so the transcript doesn't pick it up
          if (localStreamRef.current) {
             localStreamRef.current.getAudioTracks().forEach(t => t.enabled = false);
          }
        }
      } catch (e) {
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

  const handleUploadTranscript = async () => {
    if (!recordedBlob) return;
    const formData = new FormData();
    // recordedBlob is now a tri-blob object { mixed: Blob, local: Blob, remote: Blob }
    const blobs = recordedBlob as any;
    
    // As requested: Upload the full mixed blob so the backend can transcribe the whole conversation at once!
    // The backend GPT-4 model will naturally perform speaker diarization on the single file.
    formData.append('localAudio', blobs.mixed, 'mixed.webm');
    
    formData.append('sessionId', sipSessionIdRef.current || 'unknown-session');
    formData.append('startTime', startTimeRef.current || new Date().toISOString());

    const apolloId = searchParams.get('apollo_id');
    if (apolloId) formData.append('apolloId', apolloId);

    setIsTranscribing(true);
    try {
      const res = await fetch(`${API_URL}/ringcentral/upload-transcript`, {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (res.ok) {
        setTranscripts(prev => ({ ...prev, [sipSessionIdRef.current || 'unknown']: data.transcript }));
        toast.success('Transcription successful!');
        setTimeout(fetchCallLogs, 2000); // refresh logs to show updated transcript
      } else {
        toast.error(`Transcription failed: ${data.message || 'Unknown error'}`);
      }
    } catch (err) {
      console.error(err);
      toast.error('Error uploading transcript');
    } finally {
      setIsTranscribing(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="w-full py-8 space-y-8 px-4 lg:px-8">

        {/* Hidden Audio Elements required for perfectly capturing WebRTC streams */}
        <audio ref={audioRemoteRef} id="remoteAudio" autoPlay muted={false} />
        <audio ref={audioLocalRef} id="localAudio" autoPlay muted />
        <audio ref={audioPlaybackRef} id="playbackAudio" autoPlay />

        <div className="max-w-7xl mx-auto w-full">
          <Link
            href="/dashboard/doctor-crm/call-manager"
            className="inline-flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:text-gray-100 mb-6 transition-colors font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Call Manager
          </Link>

          <div className="flex flex-col lg:flex-row gap-8 items-stretch w-full">

            {/* Dialer Card */}
            <div className="bg-white dark:bg-[#1C1C1C] rounded-[24px] shadow-xl border border-gray-100 dark:border-gray-800 overflow-hidden flex flex-col w-full lg:w-3/5">
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
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Recipient Name
                  </label>
                  <input
                    type="text"
                    value={nameParam}
                    disabled
                    className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-3 text-gray-600 dark:text-gray-400 cursor-not-allowed"
                  />
                </div>

                <div className="mb-8">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    disabled={isCalling || !!searchParams.get('phone')}
                    placeholder="+1 (555) 000-0000"
                    className="w-full bg-white dark:bg-[#1C1C1C] border border-gray-300 rounded-xl px-4 py-3 text-lg font-medium text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all disabled:bg-gray-50 dark:bg-gray-800 disabled:text-gray-500 dark:text-gray-400 disabled:cursor-not-allowed"
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
                    <div className="text-3xl font-mono font-bold text-gray-800 dark:text-gray-200 bg-gray-100 dark:bg-gray-800 px-6 py-2 rounded-lg">
                      {formatDuration(callDuration)}
                    </div>
                  )}

                  <div className="flex items-center gap-6">
                    {isCalling && callStatus === 'connected' && (
                      <>
                        <button
                          onClick={handleToggleMute}
                          className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${isMuted ? 'bg-gray-800 dark:bg-gray-700 text-white' : 'bg-gray-100 dark:bg-[#2A2A2A] text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                            }`}
                          title={isMuted ? "Unmute" : "Mute"}
                        >
                          {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
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

            {/* Current Call Recording UI */}
            {recordingUrl && callStatus === 'idle' && (
              <div className="bg-white dark:bg-[#1C1C1C] rounded-[24px] shadow-sm border border-blue-200 dark:border-blue-900/50 p-6 flex flex-col justify-center w-full lg:w-2/5 animate-fade-in relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4">
                  <span className="flex items-center gap-2 text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-3 py-1 rounded-full">
                    <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                    Ready to Transcribe
                  </span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                  Call Completed
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                  Your browser captured this call successfully. You can review the audio below and generate a transcript instantly.
                </p>

                <audio src={recordingUrl as string} controls className="w-full mb-6 rounded-lg" />

                <button
                  onClick={handleUploadTranscript}
                  disabled={isTranscribing}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all disabled:opacity-50 shadow-lg shadow-blue-500/30 flex justify-center items-center gap-2"
                >
                  {isTranscribing && <Loader2 className="w-5 h-5 animate-spin" />}
                  {isTranscribing ? 'Transcribing with AI...' : 'Transcribe This Recording'}
                </button>
              </div>
            )}

            {/* Instructions Card (only show if no recent recording to save space) */}
            {(!recordingUrl || callStatus !== 'idle') && (
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:bg-[#1C1C1C] dark:from-[#1C1C1C] dark:to-[#1C1C1C] rounded-[24px] shadow-sm border border-amber-200 dark:border-gray-800 p-8 flex flex-col justify-center w-full lg:w-2/5">
                <h3 className="text-xl font-extrabold text-amber-900 dark:text-gray-100 mb-6 flex items-center gap-3">
                  <Info className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                  Transcription Rules
                </h3>
                <ul className="space-y-6 text-amber-900 dark:text-gray-300 text-[15px] leading-relaxed font-medium">
                  <li className="flex items-start gap-4 bg-white dark:bg-[#2A2A2A] p-4 rounded-xl border border-amber-100 dark:border-gray-700 shadow-sm">
                    <span className="flex-shrink-0 w-8 h-8 rounded-full bg-amber-200 dark:bg-[#FFC63F] text-amber-800 dark:text-[#1F1F1F] flex items-center justify-center font-bold text-sm">1</span>
                    <span>We use <strong className="text-blue-600 dark:text-blue-400">Browser Recording</strong>. Your microphone and the remote audio are captured securely in-memory.</span>
                  </li>
                  <li className="flex items-start gap-4 bg-white dark:bg-[#2A2A2A] p-4 rounded-xl border border-amber-100 dark:border-gray-700 shadow-sm">
                    <span className="flex-shrink-0 w-8 h-8 rounded-full bg-amber-200 dark:bg-[#FFC63F] text-amber-800 dark:text-[#1F1F1F] flex items-center justify-center font-bold text-sm">2</span>
                    <span>When the call ends, an audio player will appear right here allowing you to review the recording instantly.</span>
                  </li>
                  <li className="flex items-start gap-4 bg-white dark:bg-[#2A2A2A] p-4 rounded-xl border border-amber-100 dark:border-gray-700 shadow-sm">
                    <span className="flex-shrink-0 w-8 h-8 rounded-full bg-amber-200 dark:bg-[#FFC63F] text-amber-800 dark:text-[#1F1F1F] flex items-center justify-center font-bold text-sm">3</span>
                    <span>Click the "Transcribe" button on the completed call to generate the AI transcript without waiting for RingCentral delays!</span>
                  </li>
                </ul>
              </div>
            )}

          </div>
        </div>

        {/* Call Logs Section */}
        <div className="w-full max-w-7xl mx-auto bg-white dark:bg-[#1C1C1C] rounded-[24px] shadow-xl border border-gray-100 dark:border-gray-800 p-8 min-h-[500px]">
          <div className="w-full">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-8 flex items-center gap-3">
              Recent Call Logs
              <span className="text-sm font-medium px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-full">RingCentral API</span>
            </h2>
            {callLogs.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-center py-4">No recent calls found.</p>
            ) : (
              <div className="space-y-4">
                {callLogs.map((log) => (
                  <div key={log.id} className="border border-gray-200 dark:border-gray-800 rounded-xl p-5 hover:border-blue-300 transition-colors">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-gray-100">
                          {log.direction === 'Outbound' ? 'To: ' : 'From: '}
                          {log.to?.phoneNumber || log.from?.phoneNumber || 'Unknown'}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          {new Date(log.startTime).toLocaleString()} • {formatDuration(log.duration || 0)}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        {log.recording && (
                          <button
                            onClick={() => handleDownloadAudio(log.recording.id)}
                            className="px-3 py-1.5 text-sm bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/60 font-medium flex items-center gap-2"
                          >
                            Fetch Audio File
                          </button>
                        )}
                      </div>
                    </div>
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
