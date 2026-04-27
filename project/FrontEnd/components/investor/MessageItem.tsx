import { useState, useRef, useEffect } from 'react';
import { 
  MoreHorizontal, 
  Reply, 
  Forward, 
  Copy, 
  Trash2, 
  Pin, 
  EyeOff, 
  Languages, 
  Pencil, 
  Download,
  SmilePlus,
  Check,
  X
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { apiClient } from '@/lib/api/client';

interface MessageItemProps {
  message: any;
  isMe: boolean;
  onReply?: (msg: any) => void;
  onForward?: (msg: any) => void;
  onDelete?: (id: string) => void;
  onEdit?: (id: string, newContent: string) => void;
  onDownload?: (url: string, name: string) => void;
  getFileIcon: (name: string) => string;
  currentUserId?: string;
}

const reactionEmojis = ['👍', '❤️', '😂', '😮', '😊'];

export function MessageItem({ 
  message, 
  isMe, 
  onReply, 
  onForward, 
  onDelete, 
  onEdit, 
  onDownload,
  getFileIcon,
  currentUserId
}: MessageItemProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(message.text || '');
  const editInputRef = useRef<HTMLTextAreaElement>(null);

  // Local state for reactions to ensure snappy UI
  const [localReactions, setLocalReactions] = useState<any>(message.reactions || {});

  useEffect(() => {
    setLocalReactions(message.reactions || {});
  }, [message.reactions]);

  const handleReaction = async (emoji: string) => {
    try {
      // Optimistic update
      const updated = { ...localReactions };
      if (updated[emoji]) {
        if (updated[emoji].includes(currentUserId)) {
          updated[emoji] = updated[emoji].filter((id: string) => id !== currentUserId);
          if (updated[emoji].length === 0) delete updated[emoji];
        } else {
          updated[emoji].push(currentUserId);
        }
      } else {
        updated[emoji] = [currentUserId];
      }
      setLocalReactions(updated);

      await apiClient.reactMessage(message.id, emoji);
    } catch (err) {
      // Revert if failed
      setLocalReactions(message.reactions || {});
    }
  };

  const handleSaveEdit = async () => {
    const trimmed = editValue.trim();
    if (!trimmed || trimmed === message.text) {
      setIsEditing(false);
      return;
    }
    try {
      await onEdit?.(message.id, trimmed);
      setIsEditing(false);
    } catch (err) {
      console.error('Failed to edit:', err);
    }
  };

  useEffect(() => {
    if (isEditing) {
      editInputRef.current?.focus();
    }
  }, [isEditing]);

  const isLink = (text: string) => {
    return /https?:\/\/[^\s]+/.test(text);
  };

  const renderLinkPreview = (text: string) => {
    const urlMatch = text.match(/https?:\/\/[^\s]+/);
    if (!urlMatch) return null;
    const url = urlMatch[0];
    
    // Mocking a rich preview for common domains like we.tl
    const isWeTransfer = url.includes('we.tl') || url.includes('wetransfer.com');
    
    if (isWeTransfer) {
      return (
        <div className="mt-2 overflow-hidden rounded-lg border border-black/10 bg-white shadow-sm transition-transform hover:scale-[1.02]">
          <div className="flex bg-[#F5F5F5] p-3">
             <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white border border-[#EDEDED] shadow-sm">
                <img src="/images/message/document.svg" alt="doc" className="h-8 w-8" />
             </div>
             <div className="ml-3 flex-1 min-w-0">
                <p className="truncate text-[14px] font-bold text-[#1F1F1F]">APlus-Publish Code 24042026.zip</p>
                <p className="text-[12px] text-[#6F7177] mt-1 line-clamp-2">1 file sent via WeTransfer, the simplest way to send your files around the world</p>
                <p className="text-[11px] text-[#A2A5AA] mt-1">we.tl</p>
             </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div 
      className={cn(
        "group relative flex flex-col mb-5 transition-all duration-300 ease-in-out",
        isMe ? "items-end" : "items-start"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Reaction & Action Bar */}
      {isHovered && !isEditing && (
        <div className={cn(
          "absolute -top-10 z-10 flex items-center gap-1 rounded-full bg-white/95 backdrop-blur-sm px-2 py-1.5 shadow-[0_4px_20px_rgba(0,0,0,0.12)] border border-[#EDEDED] animate-in slide-in-from-bottom-2 fade-in duration-200",
          isMe ? "right-0" : "left-0"
        )}>
          {reactionEmojis.map((emoji) => (
            <button
              key={emoji}
              onClick={() => handleReaction(emoji)}
              className={cn(
                "text-[18px] px-1 transition-all hover:scale-135 active:scale-90",
                localReactions[emoji]?.includes(currentUserId) && "grayscale-0 scale-110"
              )}
            >
              {emoji}
            </button>
          ))}
          <div className="h-4 w-px bg-[#EDEDED] mx-1" />
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button 
                  onClick={() => {
                    setIsEditing(true);
                    setEditValue(message.text);
                  }} 
                  className={cn(
                    "p-1.5 text-[#6F7177] hover:text-[#1F1F1F] transition-colors rounded-full hover:bg-gray-100",
                    !isMe && "hidden" // Only sender can edit
                  )}
                >
                  <Pencil className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent>Edit message</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-1.5 text-[#6F7177] hover:text-[#1F1F1F] transition-colors rounded-full hover:bg-gray-100">
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align={isMe ? "end" : "start"} className="w-[200px] rounded-[10px] shadow-[0_10px_24px_rgba(0,0,0,0.1)] border-[#ECECEC]">
              <DropdownMenuItem onClick={() => onReply?.(message)} className="gap-3 text-[14px] cursor-pointer">
                <Reply className="h-4 w-4 text-[#6F7177]" /> Reply
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onForward?.(message)} className="gap-3 text-[14px] cursor-pointer">
                <Forward className="h-4 w-4 text-[#6F7177]" /> Forward
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => {
                navigator.clipboard.writeText(message.text);
              }} className="gap-3 text-[14px] cursor-pointer">
                <Copy className="h-4 w-4 text-[#6F7177]" /> Copy text
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {isMe && (
                <DropdownMenuItem onClick={() => onDelete?.(message.id)} className="gap-3 text-[14px] text-red-500 focus:text-red-500 cursor-pointer">
                  <Trash2 className="h-4 w-4" /> Delete
                </DropdownMenuItem>
              )}
              <DropdownMenuItem className="gap-3 text-[14px] cursor-pointer">
                <Pin className="h-4 w-4 text-[#6F7177]" /> Pin for everyone
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-3 text-[14px] cursor-pointer">
                <EyeOff className="h-4 w-4 text-[#6F7177]" /> Mark as unread
              </DropdownMenuItem>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger className="gap-3 text-[14px]">
                  <Languages className="h-4 w-4 text-[#6F7177]" /> Translation
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent className="rounded-[10px]">
                  <DropdownMenuItem>English</DropdownMenuItem>
                  <DropdownMenuItem>Spanish</DropdownMenuItem>
                  <DropdownMenuItem>Hindi</DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      {/* Message Bubble */}
      <div className={cn(
        "max-w-[80%] relative transition-all duration-300",
        isEditing && "w-full"
      )}>
        {isEditing ? (
          <div className="flex flex-col gap-2 rounded-xl bg-white p-3 shadow-lg ring-1 ring-black/5">
            <textarea
              ref={editInputRef}
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSaveEdit();
                }
                if (e.key === 'Escape') setIsEditing(false);
              }}
              className="min-h-[60px] w-full resize-none bg-transparent text-[14px] outline-none placeholder:text-gray-400"
            />
            <div className="flex justify-end gap-2">
              <button 
                onClick={() => setIsEditing(false)}
                className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-bold text-gray-500 hover:bg-gray-100 transition-colors"
              >
                <X className="h-3.5 w-3.5" /> Cancel
              </button>
              <button 
                onClick={handleSaveEdit}
                className="flex items-center gap-1.5 rounded-full bg-[#6A5AE0] px-4 py-1.5 text-[12px] font-bold text-white hover:bg-[#5849c4] transition-all shadow-sm"
              >
                <Check className="h-3.5 w-3.5" /> Update
              </button>
            </div>
          </div>
        ) : message.isAttachment ? (
          <div className={cn(
            "rounded-[16px] p-4 shadow-sm mb-1 border-none transition-all hover:shadow-md",
            isMe ? "bg-white/10 ring-1 ring-white/20 text-white" : "bg-[#EEF2F9] text-[#2A4474]"
          )}
          style={isMe ? { background: 'linear-gradient(135deg, #7A69F0 0%, #6A5AE0 100%)' } : {}}
          >
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[12px] bg-white/20">
                  <img src={getFileIcon(message.attachmentName)} alt="doc" className="h-8 w-8 filter brightness-0 invert" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-[14px] font-bold leading-tight">{message.attachmentName}</p>
                  <p className="text-[12px] opacity-80 mt-1">{message.attachmentSize}</p>
                </div>
              </div>
              <button
                onClick={() => onDownload?.(message.fileUrl!, message.attachmentName!)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors"
              >
                <Download className="h-4 w-4" />
              </button>
            </div>
          </div>
        ) : (
          <div className={cn(
            "group relative rounded-[18px] px-4 py-3 text-[14px] leading-[1.6] transition-all duration-300 shadow-sm",
            isMe 
              ? "text-white rounded-tr-none hover:shadow-lg" 
              : "bg-[#F3F4F6] text-[#1F1F1F] rounded-tl-none hover:bg-[#EBEDF0]",
            isLink(message.text) && !isMe && "text-white hover:opacity-95" 
          )}
          style={isMe || (isLink(message.text) && !isMe) ? { 
            background: 'linear-gradient(135deg, #7A69F0 0%, #6A5AE0 100%)',
            boxShadow: '0 4px 12px rgba(106, 90, 224, 0.15)'
          } : {}}
          >
            {message.text}
            {renderLinkPreview(message.text)}
            
            {/* Edited label */}
            {message.updated_at && message.updated_at !== message.created_at && (
              <span className="block mt-1 text-[10px] opacity-60 text-right italic">(edited)</span>
            )}
          </div>
        )}

        {/* Reactions display */}
        {Object.keys(localReactions).length > 0 && (
          <div className={cn(
            "absolute -bottom-3.5 flex flex-wrap gap-1 items-center z-[2]",
            isMe ? "right-0" : "left-0"
          )}>
            {Object.entries(localReactions).map(([emoji, userIds]: [string, any]) => (
              <TooltipProvider key={emoji}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => handleReaction(emoji)}
                      className={cn(
                        "flex items-center gap-1 rounded-full bg-white/90 backdrop-blur-sm px-1.5 py-0.5 text-[12px] font-medium shadow-sm border border-[#EDEDED] transition-all hover:scale-105 active:scale-95",
                        userIds.includes(currentUserId) && "border-[#6A5AE0] bg-[#F5F3FF]"
                      )}
                    >
                      <span>{emoji}</span>
                      <span className="text-[10px] text-gray-500">{userIds.length}</span>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">Reacted {userIds.length} times</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ))}
          </div>
        )}
      </div>

      {/* Time */}
      <p className={cn(
        "mt-2.5 text-[11px] font-semibold tracking-wide text-[#A2A5AA] transition-opacity group-hover:opacity-100 opacity-80",
        isMe ? "mr-1 text-right" : "ml-1 text-left"
      )}>
        {message.time}
      </p>
    </div>
  );
}
