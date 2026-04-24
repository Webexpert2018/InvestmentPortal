'use client';

import { useState } from 'react';
import { X, Send, Loader2, MessageSquare } from 'lucide-react';

interface SendMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSend: (message: string) => Promise<void>;
  selectedCount: number;
}

export function SendMessageModal({ isOpen, onClose, onSend, selectedCount }: SendMessageModalProps) {
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message) return;

    try {
      setIsSending(true);
      await onSend(message);
      onClose();
      setMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-[24px] shadow-2xl w-full max-w-[600px] overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-[#F2F2F2] flex items-center justify-between bg-[#fcfcfc]">
          <div>
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-[#FFD66B]" />
              <h3 className="text-xl font-bold text-[#1F1F1F]">Send Bulk Message</h3>
            </div>
            <p className="text-[#8E8E93] text-[13px]">This will send an individual message to {selectedCount} investor{selectedCount > 1 ? 's' : ''} in their chat box.</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-[#8E8E93]">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-[13px] font-medium text-[#1F1F1F] mb-1.5 ml-1">Message Content</label>
            <p className="text-[11px] text-[#8E8E93] mb-2 ml-1">Tip: Use <code className="bg-gray-100 px-1 rounded">{'{{name}}'}</code> or <code className="bg-gray-100 px-1 rounded">{'{{email}}'}</code> for personalization.</p>
            <textarea
              required
              rows={8}
              placeholder="Type your message to all selected investors..."
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
              disabled={isSending || !message}
              className="bg-[#FFD66B] hover:bg-[#FFC840] disabled:opacity-50 disabled:cursor-not-allowed text-[#1F1F1F] px-8 py-2.5 rounded-full font-semibold transition-all flex items-center gap-2 shadow-sm"
            >
              {isSending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Sending Messages...</span>
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  <span>Send to {selectedCount} Investors</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
