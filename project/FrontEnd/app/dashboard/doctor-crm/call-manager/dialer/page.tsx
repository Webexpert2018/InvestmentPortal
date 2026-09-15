'use client';

import { useState, useEffect, useRef } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Phone, PhoneOff, Mic, MicOff, ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { toast } from 'sonner';

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
  const [callDuration, setCallDuration] = useState(0);

  const [rcStatus, setRcStatus] = useState('Initializing...');
  const webPhoneRef = useRef<any>(null);
  const activeSessionRef = useRef<any>(null);
  const audioRemoteRef = useRef<HTMLAudioElement | null>(null);
  const audioLocalRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (callStatus === 'connected') {
      timer = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [callStatus]);

  useEffect(() => {
    initRingCentral();
    
    // Cleanup on unmount
    return () => {
      if (webPhoneRef.current) {
        try {
          webPhoneRef.current.dispose();
        } catch(e) {}
      }
    };
  }, []);

  const initRingCentral = async () => {
    try {
      // 1. Fetch SIP Provisioning from backend
      const res = await fetch('http://localhost:3001/api/ringcentral/sip-provision', {
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
    setIsCalling(false);
    setCallStatus('idle');
    setCallDuration(0);
    setIsMuted(false);
    activeSessionRef.current = null;
    if (audioRemoteRef.current) audioRemoteRef.current.srcObject = null;
    if (audioLocalRef.current) audioLocalRef.current.srcObject = null;
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
      }
    }
    handleCallEndCleanup();
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

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <DashboardLayout>
      <div className="w-full max-w-2xl mx-auto py-8">
        
        {/* Hidden Audio Elements required for WebRTC Web Phone */}
        <audio ref={audioRemoteRef} id="remoteAudio" autoPlay />
        <audio ref={audioLocalRef} id="localAudio" autoPlay muted />

        <Link
          href="/dashboard/doctor-crm/call-manager"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Call Manager
        </Link>

        <div className="bg-white rounded-[24px] shadow-xl border border-gray-100 overflow-hidden">
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
                disabled={isCalling}
                placeholder="+1 (555) 000-0000"
                className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-lg font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all disabled:bg-gray-50 disabled:text-gray-500"
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
                  <button
                    onClick={handleToggleMute}
                    className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
                      isMuted ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                  </button>
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
      </div>
    </DashboardLayout>
  );
}
