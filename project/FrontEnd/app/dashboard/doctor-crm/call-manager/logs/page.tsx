'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { PhoneCall, ArrowLeft, Clock, Calendar, FileText, X, Download, Copy, Check } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { API_URL } from '@/lib/api/client';

export default function InternalCallLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Transcript Modal State
  const [selectedTranscript, setSelectedTranscript] = useState<string | null>(null);
  const [selectedLog, setSelectedLog] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const res = await fetch(`${API_URL}/ringcentral/internal-logs`);
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
      } else {
        toast.error('Failed to fetch internal call logs');
      }
    } catch (e) {
      toast.error('Error fetching internal call logs');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDuration = (seconds: number) => {
    if (!seconds && seconds !== 0) return 'Unknown';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleString();
  };

  const openTranscriptModal = (log: any) => {
    const transcript = typeof log === 'string' ? log : log?.transcription_text;
    if (!transcript) {
      toast.error('No transcript available for this call.');
      return;
    }
    setSelectedLog(typeof log === 'string' ? null : log);
    setSelectedTranscript(transcript);
    setIsModalOpen(true);
  };

  const downloadTranscript = (logOrText?: any) => {
    const transcript = typeof logOrText === 'string' 
      ? logOrText 
      : (logOrText?.transcription_text || selectedTranscript);
    if (!transcript) {
      toast.error('No transcript available to download.');
      return;
    }
    const log = (typeof logOrText === 'object' && logOrText) ? logOrText : selectedLog;
    const blob = new Blob([transcript], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const prospectName = log?.first_name || log?.last_name
      ? `${log.first_name || ''}_${log.last_name || ''}`.trim().replace(/[^a-zA-Z0-9_-]/g, '_')
      : 'prospect';
    const dateStr = log?.start_time
      ? new Date(log.start_time).toISOString().slice(0, 10)
      : new Date().toISOString().slice(0, 10);
    link.download = `call_transcript_${prospectName}_${dateStr}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Transcript downloaded');
  };

  const copyTranscript = async () => {
    if (!selectedTranscript) return;
    try {
      await navigator.clipboard.writeText(selectedTranscript);
      setCopied(true);
      toast.success('Transcript copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy transcript');
    }
  };

  return (
    <DashboardLayout>
      <div className="w-full font-helvetica text-[#1F1F1F] dark:text-gray-100 relative space-y-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-purple-50 dark:bg-purple-900/40 text-purple-600 dark:text-purple-300 border border-purple-200 dark:border-purple-800/50">
                <FileText className="w-4 h-4" />
              </span>
            </div>
            <h1 className="font-goudy text-[28px] md:text-[34px] leading-tight text-[#1F1F1F] dark:text-gray-100">
              Internal Call Logs
            </h1>
            <p className="text-[#8E8E93] dark:text-gray-400 text-[14px] mt-1 max-w-3xl">
              A historical log of all outbound physician calls made via the dialer, saved directly to the database.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto flex-wrap">
            <Link
              href="/dashboard/doctor-crm/call-manager"
              className="px-4 py-2 bg-white dark:bg-[#1C1C1C] hover:bg-gray-100 dark:hover:bg-gray-800 text-[#1F1F1F] dark:text-gray-100 text-[13px] font-bold rounded-full shadow-xs flex items-center gap-2 transition-all cursor-pointer border border-[#E8E8E8] dark:border-[#2A2A2A]"
            >
              <ArrowLeft className="w-4 h-4 text-[#8E8E93] dark:text-gray-400" />
              <span>Back to Call Manager</span>
            </Link>
          </div>
        </div>

        {/* Table Section */}
        <div className="bg-white dark:bg-[#1C1C1C] rounded-[24px] shadow-sm border border-[#E8E8E8] dark:border-[#2A2A2A] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#E8E8E8] dark:border-[#2A2A2A] bg-[#FAFAFA] dark:bg-[#181818]">
                  <th className="py-4 px-6 text-[12px] font-bold text-[#8E8E93] dark:text-gray-400 uppercase tracking-wider">Date & Time</th>
                  <th className="py-4 px-6 text-[12px] font-bold text-[#8E8E93] dark:text-gray-400 uppercase tracking-wider">Prospect</th>
                  <th className="py-4 px-6 text-[12px] font-bold text-[#8E8E93] dark:text-gray-400 uppercase tracking-wider">Phone</th>
                  <th className="py-4 px-6 text-[12px] font-bold text-[#8E8E93] dark:text-gray-400 uppercase tracking-wider">Duration</th>
                  <th className="py-4 px-6 text-[12px] font-bold text-[#8E8E93] dark:text-gray-400 uppercase tracking-wider text-right">Transcript</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E8E8] dark:divide-gray-800">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-[#8E8E93] dark:text-gray-400">
                      Loading internal call logs...
                    </td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-[#8E8E93] dark:text-gray-400">
                      No internal call logs found. Start dialing!
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50 dark:bg-gray-800/40 dark:hover:bg-gray-800 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span className="text-[14px] font-medium text-[#1F1F1F] dark:text-gray-100">
                            {formatDate(log.start_time)}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className="text-[14px] font-bold text-blue-600 dark:text-blue-400">
                          {log.first_name || log.last_name ? `${log.first_name || ''} ${log.last_name || ''}` : 'Unknown Prospect'}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <PhoneCall className="w-4 h-4 text-gray-400" />
                          <span className="text-[14px] text-gray-600 dark:text-gray-300 font-medium">
                            {log.phone_number || 'N/A'}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <span className="text-[14px] text-gray-600 dark:text-gray-300">
                            {formatDuration(log.duration)}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-right">
                        {log.transcription_text ? (
                          <div className="inline-flex items-center gap-2 justify-end">
                            <button
                              onClick={() => openTranscriptModal(log)}
                              className="inline-flex items-center gap-2 px-3.5 py-2 bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/60 border border-blue-200 dark:border-blue-800/50 rounded-lg text-sm font-semibold transition-colors cursor-pointer"
                            >
                              <FileText className="w-4 h-4" />
                              View Transcript
                            </button>
                            <button
                              onClick={() => downloadTranscript(log)}
                              className="p-2 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 rounded-lg transition-colors cursor-pointer"
                              title="Download Transcript"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-[13px] text-gray-400 dark:text-gray-500 italic">No Transcript</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Transcript Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-[#1C1C1C] rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-500" />
                Call Transcript
              </h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors text-gray-500 dark:text-gray-400 cursor-pointer"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto bg-white dark:bg-[#1C1C1C] flex-1">
              <div className="prose prose-sm max-w-none text-gray-700 dark:text-gray-300 whitespace-pre-wrap font-mono text-[13px] leading-relaxed select-text">
                {selectedTranscript}
              </div>
            </div>
            <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => downloadTranscript()}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Transcript</span>
                </button>
                <button
                  onClick={copyTranscript}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-600 text-sm font-medium rounded-xl transition-colors cursor-pointer"
                >
                  {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? 'Copied' : 'Copy Text'}</span>
                </button>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-6 py-2 bg-gray-900 hover:bg-black text-white text-sm font-bold rounded-xl transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
