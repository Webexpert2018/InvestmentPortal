'use client';

import { useState, useRef } from 'react';
import { X, Send, Loader2, MessageSquare, Plus, Check } from 'lucide-react';
import { apiClient } from '@/lib/api/client';
import { cn } from '@/lib/utils';
import { AvatarDisplay } from '@/components/investor/AssignedInvestorsMessagesScreen';

interface SendMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSend: (message: string, groupData?: { name: string; imageUrl?: string }) => Promise<void>;
  selectedCount: number;
}

export function SendMessageModal({ isOpen, onClose, onSend, selectedCount }: SendMessageModalProps) {
  const [message, setMessage] = useState('');
  const [groupName, setGroupName] = useState('');
  const [groupAvatar, setGroupAvatar] = useState('/images/messages-person/GroupIcon.png');
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isDraggingAvatar, setIsDraggingAvatar] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const isGroup = selectedCount > 1;

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingAvatar(true);
      const res = await apiClient.uploadMessageFile(file);
      setGroupAvatar(res.file_url);
    } catch (err) {
      console.error('Failed to upload avatar:', err);
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleAvatarDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingAvatar(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    try {
      setIsUploadingAvatar(true);
      const res = await apiClient.uploadMessageFile(file);
      setGroupAvatar(res.file_url);
    } catch (err) {
      console.error('Failed to upload avatar:', err);
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message) return;
    if (isGroup && !groupName) return;

    try {
      setIsSending(true);
      await onSend(message, isGroup ? { name: groupName, imageUrl: groupAvatar } : undefined);
      onClose();
      setMessage('');
      setGroupName('');
      setGroupAvatar('/images/messages-person/GroupIcon.png');
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
              <h3 className="text-xl font-bold text-[#1F1F1F]">
                {isGroup ? 'Create Group Message' : 'Send Message'}
              </h3>
            </div>
            <p className="text-[#8E8E93] text-[13px]">
              {isGroup 
                ? `You've selected ${selectedCount} investors. This will create a group chat.` 
                : 'Send a direct message to the selected investor.'}
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-[#8E8E93]">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
          {isGroup && (
            <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-4 items-end bg-[#F9FAFB] p-4 rounded-2xl border border-[#F2F2F2]">
              <div>
                <label className="block text-[12px] font-bold text-[#6F7177] uppercase tracking-wider mb-2 ml-1">Group Name</label>
                <input
                  type="text"
                  placeholder="Enter group name..."
                  required
                  className="w-full bg-white border border-[#E5E7EB] rounded-xl py-2.5 px-4 text-[14px] outline-none focus:ring-1 focus:ring-[#FFD66B]"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-[12px] font-bold text-[#6F7177] uppercase tracking-wider mb-2 ml-1">Group Avatar</label>
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    ref={avatarInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                  />
                  <button
                    type="button"
                    onClick={() => avatarInputRef.current?.click()}
                    onDragOver={(e) => { e.preventDefault(); setIsDraggingAvatar(true); }}
                    onDragEnter={(e) => { e.preventDefault(); setIsDraggingAvatar(true); }}
                    onDragLeave={() => setIsDraggingAvatar(false)}
                    onDrop={handleAvatarDrop}
                    disabled={isUploadingAvatar}
                    className={cn(
                      "h-10 w-10 rounded-xl shrink-0 border-2 border-dashed flex items-center justify-center transition-all bg-white",
                      isDraggingAvatar ? "border-[#FFD66B] bg-yellow-50" : "border-[#E5E7EB] hover:border-[#FFD66B]"
                    )}
                    title="Click or Drag & Drop to upload avatar"
                  >
                    {isUploadingAvatar ? <Loader2 className="h-4 w-4 animate-spin text-[#FFD66B]" /> : <Plus className="h-4 w-4 text-[#6F7177]" />}
                  </button>
                  <div className={cn(
                    "h-10 w-10 rounded-xl shrink-0 border-2 border-[#FFD66B] shadow-sm overflow-hidden",
                    !groupAvatar.startsWith('http') && "opacity-50"
                  )}>
                    <AvatarDisplay src={groupAvatar} name={groupName || 'Group'} className="w-full h-full" />
                  </div>
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="block text-[13px] font-medium text-[#1F1F1F] mb-1.5 ml-1">Message Content</label>
            <textarea
              required
              rows={isGroup ? 4 : 8}
              placeholder={isGroup ? "Type your first group message..." : "Type your message to the investor..."}
              className="w-full bg-[#f8f9fa] border border-[#F2F2F2] rounded-xl py-3 px-4 text-[14px] focus:ring-1 focus:ring-[#FFD66B] outline-none transition-all resize-none"
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
              disabled={isSending || !message || (isGroup && !groupName)}
              className="bg-[#FFD66B] hover:bg-[#FFC840] disabled:opacity-50 disabled:cursor-not-allowed text-[#1F1F1F] px-8 py-2.5 rounded-full font-semibold transition-all flex items-center gap-2 shadow-sm active:scale-95"
            >
              {isSending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  <span>{isGroup ? 'Create & Send' : 'Send Message'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
