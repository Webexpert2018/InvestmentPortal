'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { PhoneCall, ArrowLeft, Clock, Calendar, FileText, X } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export default function InternalCallLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Transcript Modal State
  const [selectedTranscript, setSelectedTranscript] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

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

  const openTranscriptModal = (transcript: string) => {
    if (!transcript) {
      toast.error('No transcript available for this call.');
      return;
    }
    setSelectedTranscript(transcript);
    setIsModalOpen(true);
  };

  return (
    <DashboardLayout>
      <div className="w-full font-helvetica text-[#1F1F1F] relative space-y-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-purple-50 text-purple-600 border border-purple-200">
                <FileText className="w-4 h-4" />
              </span>
              <span className="text-[12px] font-bold uppercase tracking-wider text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-200">
                PostgreSQL Database
              </span>
            </div>
            <h1 className="font-goudy text-[28px] md:text-[34px] leading-tight text-[#1F1F1F]">
              Internal Call Logs
            </h1>
            <p className="text-[#8E8E93] text-[14px] mt-1 max-w-3xl">
              A historical log of all outbound physician calls made via the dialer, saved directly to the database.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto flex-wrap">
            <Link
              href="/dashboard/doctor-crm/call-manager"
              className="px-4 py-2 bg-white hover:bg-gray-100 text-[#1F1F1F] text-[13px] font-bold rounded-full shadow-xs flex items-center gap-2 transition-all cursor-pointer border border-[#E8E8E8]"
            >
              <ArrowLeft className="w-4 h-4 text-[#8E8E93]" />
              <span>Back to Call Manager</span>
            </Link>
          </div>
        </div>

        {/* Table Section */}
        <div className="bg-white rounded-[24px] shadow-sm border border-[#E8E8E8] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#E8E8E8] bg-[#FAFAFA]">
                  <th className="py-4 px-6 text-[12px] font-bold text-[#8E8E93] uppercase tracking-wider">Date & Time</th>
                  <th className="py-4 px-6 text-[12px] font-bold text-[#8E8E93] uppercase tracking-wider">Prospect</th>
                  <th className="py-4 px-6 text-[12px] font-bold text-[#8E8E93] uppercase tracking-wider">Phone</th>
                  <th className="py-4 px-6 text-[12px] font-bold text-[#8E8E93] uppercase tracking-wider">Duration</th>
                  <th className="py-4 px-6 text-[12px] font-bold text-[#8E8E93] uppercase tracking-wider text-right">Transcript</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E8E8]">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-[#8E8E93]">
                      Loading internal call logs...
                    </td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-[#8E8E93]">
                      No internal call logs found. Start dialing!
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span className="text-[14px] font-medium text-[#1F1F1F]">
                            {formatDate(log.start_time)}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className="text-[14px] font-bold text-blue-600">
                          {log.first_name || log.last_name ? `${log.first_name || ''} ${log.last_name || ''}` : 'Unknown Prospect'}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <PhoneCall className="w-4 h-4 text-gray-400" />
                          <span className="text-[14px] text-gray-600 font-medium">
                            {log.phone_number || 'N/A'}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <span className="text-[14px] text-gray-600">
                            {formatDuration(log.duration)}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-right">
                        {log.transcription_text ? (
                          <button
                            onClick={() => openTranscriptModal(log.transcription_text)}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200 rounded-lg text-sm font-semibold transition-colors"
                          >
                            <FileText className="w-4 h-4" />
                            View Transcript
                          </button>
                        ) : (
                          <span className="text-[13px] text-gray-400 italic">No Transcript</span>
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
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gray-50/50">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-500" />
                Call Transcript
              </h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-gray-200 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto bg-white flex-1">
              <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap font-mono text-[13px] leading-relaxed">
                {selectedTranscript}
              </div>
            </div>
            <div className="p-4 border-t border-gray-100 bg-gray-50 text-right">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-6 py-2 bg-gray-900 hover:bg-black text-white text-sm font-bold rounded-xl transition-colors"
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
