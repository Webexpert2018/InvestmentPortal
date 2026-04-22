'use client';

import { useState } from 'react';
import { X, Send, Loader2 } from 'lucide-react';

interface SendEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSend: (subject: string, message: string) => Promise<void>;
  selectedCount: number;
}

export function SendEmailModal({ isOpen, onClose, onSend, selectedCount }: SendEmailModalProps) {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject || !message) return;

    try {
      setIsSending(true);
      await onSend(subject, message);
      onClose();
      setSubject('');
      setMessage('');
    } catch (error) {
      console.error('Error sending email:', error);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-[24px] shadow-2xl w-full max-w-[600px] overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-[#F2F2F2] flex items-center justify-between bg-[#fcfcfc]">
          <div>
            <h3 className="text-xl font-bold text-[#1F1F1F]">Send Email</h3>
            <p className="text-[#8E8E93] text-[13px]">To {selectedCount} selected investor{selectedCount > 1 ? 's' : ''}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-[#8E8E93]">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-[13px] font-medium text-[#1F1F1F] mb-1.5 ml-1">Subject</label>
            <input
              type="text"
              required
              placeholder="Enter email subject"
              className="w-full bg-[#f8f9fa] border-none rounded-xl py-3 px-4 text-[14px] focus:ring-1 focus:ring-[#FFD66B] outline-none transition-all"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-[13px] font-medium text-[#1F1F1F] mb-1.5 ml-1">Message</label>
            <textarea
              required
              rows={8}
              placeholder="Write your message here..."
              className="w-full bg-[#f8f9fa] border-none rounded-xl py-3 px-4 text-[14px] focus:ring-1 focus:ring-[#FFD66B] outline-none transition-all resize-none"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 rounded-full text-[14px] font-semibold text-[#1F1F1F] hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSending || !subject || !message}
              className="bg-[#FFD66B] hover:bg-[#FFC840] disabled:opacity-50 disabled:cursor-not-allowed text-[#1F1F1F] px-8 py-2.5 rounded-full font-semibold transition-all flex items-center gap-2 shadow-sm"
            >
              {isSending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Sending...</span>
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  <span>Send Email</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
