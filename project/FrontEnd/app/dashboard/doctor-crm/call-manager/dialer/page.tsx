'use client';

import { useState, useEffect, useRef } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Phone, PhoneOff, Mic, MicOff, ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { API_URL } from '@/lib/api/client';
import { io } from 'socket.io-client';
import { Device } from '@twilio/voice-sdk';

const BASE_URL = API_URL.replace('/api', '');

export default function TwilioDialer() {
  const searchParams = useSearchParams();
  const phoneParam = searchParams.get('phone') || '';
  const nameParam = searchParams.get('name') || 'Unknown Contact';

  const [phoneNumber, setPhoneNumber] = useState(phoneParam);
  const [isCalling, setIsCalling] = useState(false);
  const [callStatus, setCallStatus] = useState<'idle' | 'connecting' | 'connected'>('idle');
  const [isMuted, setIsMuted] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  const [twilioStatus, setTwilioStatus] = useState('Initializing...');
  const [liveTranscript, setLiveTranscript] = useState('');
  const [partialTranscript, setPartialTranscript] = useState('');

  const twilioDeviceRef = useRef<Device | null>(null);
  const activeCallRef = useRef<any>(null);
  const socketRef = useRef<any>(null);

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
    return () => {
      if (twilioDeviceRef.current) {
        twilioDeviceRef.current.destroy();
        twilioDeviceRef.current = null;
      }
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  const initTwilio = async (): Promise<boolean> => {
    try {
      setTwilioStatus('Fetching Token...');
      const res = await fetch(`${BASE_URL}/twilio/token?identity=frontend_user`);
      if (!res.ok) throw new Error('Failed to fetch Twilio token');
      const data = await res.json();

      const device = new Device(data.token);

      device.on('ready', () => {
        setTwilioStatus('Ready');
        toast.success('Twilio Connected!');
      });

      device.on('error', (error) => {
        console.error('Twilio Error:', error);
        toast.error(`Twilio Error: ${error.message}`);
      });

      await device.register();
      twilioDeviceRef.current = device;

      // Setup Socket.IO for Live Transcripts from Twilio Native Transcription
      socketRef.current = io(BASE_URL);
      socketRef.current.on('twilio_transcript', (payload: { callSid: string; text: string; track: string }) => {
        if (payload.text) {
          const trackLower = payload.track.toLowerCase();
          const isInbound = trackLower === 'inbound' || trackLower === 'inbound_track';
          const speaker = isInbound ? 'Me: ' : 'Them: ';
          setLiveTranscript((prev) => prev + (prev ? '\n' : '') + speaker + payload.text);
        }
      });
      return true;

    } catch (err: any) {
      console.error('Twilio init failed:', err);
      setTwilioStatus('Error');
      toast.error('Failed to initialize Twilio');
      return false;
    }
  };

  const handleCallEndCleanup = () => {
    setIsCalling(false);
    setCallStatus('idle');
    setCallDuration(0);
    setIsMuted(false);
    activeCallRef.current = null;
  };

  const handleCall = async () => {
    if (!phoneNumber) {
      toast.error('Please enter a phone number');
      return;
    }

    if (!twilioDeviceRef.current) {
      const success = await initTwilio();
      if (!success) return;
    }

    if (twilioStatus !== 'Ready' && !twilioDeviceRef.current) {
      toast.error('Twilio is not ready...');
      return;
    }

    setIsCalling(true);
    setCallStatus('connecting');
    setLiveTranscript('');
    setPartialTranscript('');
    toast.info(`Dialing ${phoneNumber}...`);

    try {
      const call = await twilioDeviceRef.current!.connect({
        params: { To: phoneNumber },
        rtcConstraints: {
          audio: {
            autoGainControl: true,
            echoCancellation: true,
            noiseSuppression: false,
          }
        }
      });
      activeCallRef.current = call;

      call.on('accept', () => {
        setCallStatus('connected');
        toast.success('Call connected!');
      });

      call.on('disconnect', () => {
        handleCallEndCleanup();
        toast.success('Call ended');
      });

      call.on('cancel', () => {
        handleCallEndCleanup();
      });

      call.on('reject', () => {
        handleCallEndCleanup();
        toast.error('Call rejected');
      });

      call.on('error', (error) => {
        console.error('Call error:', error);
        toast.error('Call failed');
        handleCallEndCleanup();
      });
    } catch (error: any) {
      console.error('Dial error:', error);
      toast.error('Failed to dial number');
      handleCallEndCleanup();
    }
  };

  const handleEndCall = async () => {
    if (activeCallRef.current) {
      try {
        activeCallRef.current.disconnect();
      } catch (e) {
        console.error('Error ending call', e);
      }
    }
    handleCallEndCleanup();
  };

  const handleToggleMute = () => {
    if (activeCallRef.current) {
      const isCurrentlyMuted = activeCallRef.current.isMuted();
      activeCallRef.current.mute(!isCurrentlyMuted);
      setIsMuted(!isCurrentlyMuted);
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
        <Link
          href="/dashboard/doctor-crm/call-manager"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Call Manager
        </Link>

        <div className="bg-white rounded-[24px] shadow-xl border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-8 text-center text-white relative">
            <h1 className="text-2xl font-bold mb-2">Twilio Web Phone</h1>
            <p className="text-blue-100 text-sm opacity-90">Real-time Dialer & Live Transcription</p>

            <div className="absolute top-4 right-4 flex items-center gap-2">
              <span
                className={`w-2 h-2 rounded-full ${twilioStatus === 'Ready' ? 'bg-green-400' : twilioStatus === 'Error' ? 'bg-red-400' : 'bg-yellow-400'
                  }`}
              ></span>
              <span className="text-xs text-white/80">{twilioStatus}</span>
            </div>
          </div>

          <div className="p-8">
            <div className="mb-8">
              <label className="block text-sm font-medium text-gray-700 mb-2">Recipient Name</label>
              <input
                type="text"
                value={nameParam}
                disabled
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-600 cursor-not-allowed"
              />
            </div>

            <div className="mb-8">
              <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
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
                  <>
                    <button
                      onClick={handleToggleMute}
                      className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${isMuted ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      title={isMuted ? 'Unmute' : 'Mute'}
                    >
                      {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                    </button>
                  </>
                )}

                {!isCalling ? (
                  <button
                    onClick={handleCall}
                    disabled={!phoneNumber}
                    className="w-20 h-20 rounded-full bg-green-500 hover:bg-green-600 text-white flex items-center justify-center shadow-lg shadow-green-500/30 transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                  >
                    <Phone className="w-8 h-8" />
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

            {/* Live Transcript Area */}
            {(liveTranscript || partialTranscript) && (
              <div className="mt-8 border-t border-gray-100 pt-8">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                    Live Twilio Transcription
                  </h3>
                </div>
                <div className="bg-gray-50 rounded-xl p-4 min-h-[100px] border border-gray-200 whitespace-pre-wrap font-mono text-sm">
                  {liveTranscript}
                  {partialTranscript && (
                    <span className="text-gray-400 opacity-70"> {partialTranscript}</span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

/*
=============================================================================
                          RINGCENTRAL ARCHIVE
=============================================================================
This code remains unused as requested by the user, preserved for reference.

// let WebPhone: any;
// if (typeof window !== 'undefined') {
//   const rcwp = require('ringcentral-web-phone');
//   WebPhone = rcwp.default || rcwp.WebPhone || rcwp;
// }
// 
// ... original initRingCentral, handleCall, and web audio hacks ...
*/