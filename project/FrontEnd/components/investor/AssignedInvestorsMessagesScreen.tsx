import { ChangeEvent, useEffect, useMemo, useRef, useState, useCallback } from 'react';
import {
  Search,
  SendHorizontal,
  Loader2,
  Download,
  MoreHorizontal,
  Pencil,
  Trash2,
  X,
  Check,
  ChevronLeft,
  UserPlus,
  Users,
  LogOut,
  UserMinus,
  Plus,
  Upload
} from 'lucide-react';
import { apiClient } from '@/lib/api/client';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type Sender = 'investor' | 'accountant';

type ChatMessage = {
  senderAvatar: string | undefined;
  id: string;
  sender: Sender;
  sender_id?: string;
  sender_name?: string;
  text: string;
  time: string;
  day: string;
  isAttachment?: boolean;
  attachmentName?: string;
  attachmentSize?: string;
  fileUrl?: string;
  updatedAt?: string;
  createdAt?: string;
  // senderAvatar?: string;
};

type Thread = {
  id: string;
  investorName: string;
  role: string;
  timeAgo: string;
  unreadCount: number;
  preview: string;
  avatar: string;
  isOnline?: boolean;
  messages?: ChatMessage[];
  isGroup?: boolean;
  createdBy?: string;
  participants?: any[];
};

const getInitials = (name: string) => {
  if (!name) return '??';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
};

export const AvatarDisplay = ({ src, name, className }: { src?: string; name: string; className?: string }) => {
  const [imgError, setImgError] = useState(false);
  const initials = getInitials(name);

  useEffect(() => {
    setImgError(false);
  }, [src]);

  const showInitials = !src || imgError;

  const diceAvatar = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}&backgroundColor=FBCB4B,3B6FF0,34C759,FF9500&fontSize=40&fontWeight=700`;

  return (
    <div className={cn("relative overflow-hidden flex items-center justify-center shrink-0", className, showInitials && "bg-[#F3F4F6] shadow-inner")}>
      {showInitials ? (
        <img
          src={diceAvatar}
          alt={name}
          className="h-full w-full object-cover"
        />
      ) : (
        <img
          src={src}
          alt={name}
          className="h-full w-full object-cover"
          onError={() => setImgError(true)}
        />
      )}
    </div>
  );
};

export function AssignedInvestorsMessagesScreen() {
  const { toast } = useToast();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [messageInput, setMessageInput] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [selectedFile, setSelectedFile] = useState<{ url: string; originalName: string; size: string } | null>(null);

  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editInput, setEditInput] = useState('');
  const [isMobileChatOpen, setIsMobileChatOpen] = useState(false);
  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [groupNameInput, setGroupNameInput] = useState('');
  const [selectedGroupAvatar, setSelectedGroupAvatar] = useState('/images/messages-person/GroupIcon.png');
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isCreatingChat, setIsCreatingChat] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [isAddMode, setIsAddMode] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const fetchAvailableUsers = async () => {
    try {
      setLoadingUsers(true);
      const data = await apiClient.getAvailableUsers();
      setAvailableUsers(data);
    } catch (err) {
      console.error('Failed to fetch available users:', err);
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    if (isNewChatModalOpen) {
      fetchAvailableUsers();
    }
  }, [isNewChatModalOpen]);

  const photoInputRef = useRef<HTMLInputElement | null>(null);
  const documentInputRef = useRef<HTMLInputElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const messageInputRef = useRef<HTMLTextAreaElement | null>(null);
  const prevMessagesCountRef = useRef<number>(0);
  const [isDragging, setIsDragging] = useState(false);
  const [confirmation, setConfirmation] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
    confirmText?: string;
    variant?: 'destructive' | 'default';
  }>({
    isOpen: false,
    title: '',
    description: '',
    onConfirm: () => { },
  });

  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  const fetchProfile = useCallback(async () => {
    try {
      const data = await apiClient.getProfile();
      setProfile(data);
    } catch (err) {
      console.error('Failed to fetch profile:', err);
    }
  }, []);

  const fetchConversations = useCallback(async (quiet = false) => {
    try {
      if (!quiet) setLoading(true);
      const data = await apiClient.getConversations();
      const mappedThreads: Thread[] = data.map((conv: any) => {
        const isGroup = conv.is_group;
        let displayName = conv.group_name || 'Group Chat';
        let displayAvatar = ''; // Handle fallback dynamically
        if (isGroup) {
          displayAvatar = conv.group_image_url || '/images/messages-person/GroupIcon.png';
        } else if (conv.participants) {
          const otherParticipant = conv.participants.find((p: any) => p.id !== profile?.id);
          if (otherParticipant) {
            displayName = otherParticipant.name;
            displayAvatar = otherParticipant.avatar || displayAvatar;
          }
        }

        return {
          id: conv.id,
          investorName: displayName,
          role: isGroup ? 'Group' : 'Direct',
          timeAgo: conv.updated_at ? formatDistanceToNow(new Date(conv.updated_at), { addSuffix: true }) : 'Just now',
          unreadCount: conv.unread_count || 0,
          preview: conv.last_message || 'No messages yet',
          avatar: displayAvatar,
          isOnline: true,
          isGroup: isGroup,
          createdBy: conv.created_by,
          participants: conv.participants
        };
      });
      setThreads((prev) => {
        return mappedThreads.map((newThread) => {
          const existingThread = prev.find((t) => t.id === newThread.id);
          return {
            ...newThread,
            messages: existingThread?.messages || newThread.messages,
            unreadCount: activeThreadId === newThread.id ? 0 : newThread.unreadCount,
          };
        });
      });
      if (!activeThreadId && mappedThreads.length > 0) {
        setActiveThreadId(mappedThreads[0].id);
      }
    } catch (err) {
      console.error('Failed to fetch conversations:', err);
    } finally {
      if (!quiet) setLoading(false);
    }
  }, [activeThreadId, profile]);

  const fetchMessages = useCallback(async (conversationId: string) => {
    try {
      const data = await apiClient.getConversationMessages(conversationId);
      const mappedMessages: ChatMessage[] = data.map((msg: any) => {
        const isFromUser = msg.sender_id === profile?.id;
        return {
          id: msg.id,
          sender: isFromUser ? 'accountant' : 'investor',
          sender_id: msg.sender_id,
          sender_name: msg.sender_name,
          text: msg.content || '',
          time: new Date(msg.created_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
          day: new Date(msg.created_at).toDateString() === new Date().toDateString() ? 'TODAY' : 'PAST',
          isAttachment: !!msg.file_url,
          attachmentName: msg.file_name,
          attachmentSize: msg.file_size,
          fileUrl: msg.file_url,
          senderAvatar: msg.sender_avatar,
          updatedAt: msg.updated_at,
          createdAt: msg.created_at,
        };
      });

      setThreads((prev) =>
        prev.map((thread) => {
          if (thread.id !== conversationId) return thread;
          return { ...thread, messages: mappedMessages };
        })
      );

      // Mark as read API call
      apiClient.markConversationAsRead(conversationId).catch(() => { });

      if (mappedMessages.length > prevMessagesCountRef.current) {
        setTimeout(() => scrollToBottom("smooth"), 100);
        prevMessagesCountRef.current = mappedMessages.length;
      }
    } catch (err) {
      console.error('Failed to fetch messages:', err);
    }
  }, [profile]);

  useEffect(() => {
    fetchProfile();
  }, []);

  useEffect(() => {
    if (profile) {
      fetchConversations();
    }
  }, [profile]);

  const handleThreadSelect = (threadId: string) => {
    setActiveThreadId(threadId);
    setThreads((prev) =>
      prev.map((t) => (t.id === threadId ? { ...t, unreadCount: 0 } : t))
    );
    setShowMenu(false);
    setEditingMessageId(null);
    setIsMobileChatOpen(true);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingAvatar(true);
      const res = await apiClient.uploadMessageFile(file);
      setSelectedGroupAvatar(res.file_url);
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to upload avatar', variant: 'destructive' });
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleStartChat = async () => {
    if (selectedUserIds.length === 0) return;

    try {
      setIsCreatingChat(true);
      if (isAddMode && activeThreadId) {
        const currentParticipantIds = activeThread?.participants?.map((p: any) => p.id) || [];
        const newIds = selectedUserIds.filter(id => !currentParticipantIds.includes(id));

        if (newIds.length > 0) {
          await apiClient.addParticipants(activeThreadId, newIds);
          toast({ title: 'Success', description: 'Members added successfully', variant: 'success' });
        }
        setIsNewChatModalOpen(false);
        setSelectedUserIds([]);
        setIsAddMode(false);
        await fetchConversations();
      } else {
        const isGroup = selectedUserIds.length > 1;
        const res = await apiClient.getOrCreateConversation(
          selectedUserIds,
          isGroup ? (groupNameInput || 'New Group') : undefined,
          isGroup ? selectedGroupAvatar : undefined
        );
        setIsNewChatModalOpen(false);
        setSelectedUserIds([]);
        setGroupNameInput('');
        await fetchConversations();
        setActiveThreadId(res.id);
        setIsMobileChatOpen(true);
      }
    } catch (err) {
      toast({ title: 'Error', description: isAddMode ? 'Failed to add members' : 'Failed to start chat', variant: 'destructive' });
    } finally {
      setIsCreatingChat(false);
    }
  };

  const toggleUserSelection = (userId: string) => {
    setSelectedUserIds(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  useEffect(() => {
    if (activeThreadId && profile) {
      prevMessagesCountRef.current = 0;
      fetchMessages(activeThreadId);
    }
  }, [activeThreadId, profile, fetchMessages]);

  // Polling for new messages/conversations
  useEffect(() => {
    const interval = setInterval(() => {
      if (profile) {
        fetchConversations(true);
        if (activeThreadId) {
          fetchMessages(activeThreadId);
        }
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [activeThreadId, profile, fetchConversations, fetchMessages]);

  const filteredThreads = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return threads;
    return threads.filter(
      (thread) =>
        thread.investorName.toLowerCase().includes(query) ||
        thread.preview.toLowerCase().includes(query),
    );
  }, [threads, search]);

  const activeThread = threads.find((thread) => thread.id === activeThreadId);

  const sendMessage = async () => {
    const text = messageInput.trim();
    if ((!text && !selectedFile) || !activeThreadId || isSending) return;

    try {
      setIsSending(true);
      await apiClient.sendMessage({
        content: text,
        conversationId: activeThreadId,
        fileUrl: selectedFile?.url,
        fileName: selectedFile?.originalName,
        fileSize: selectedFile?.size,
      });
      setMessageInput('');
      if (messageInputRef.current) {
        messageInputRef.current.style.height = 'auto';
      }
      setSelectedFile(null);
      fetchMessages(activeThreadId);
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to send message', variant: 'destructive' });
    } finally {
      setIsSending(false);
    }
  };

  const handleEditMessage = async (messageId: string) => {
    const text = editInput.trim();
    if (!text || isSending) return;

    try {
      setIsSending(true);
      await apiClient.editMessage(messageId, text);
      setEditingMessageId(null);
      setEditInput('');
      if (activeThreadId) fetchMessages(activeThreadId);
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to update message', variant: 'destructive' });
    } finally {
      setIsSending(false);
    }
  };

  const handleLeaveGroup = async (id: string) => {
    const thread = threads.find(t => t.id === id);
    if (!thread) return;

    const isCreator = thread.createdBy === profile?.id;

    setConfirmation({
      isOpen: true,
      title: isCreator ? 'Delete Group' : 'Leave Group',
      description: isCreator
        ? 'As the creator, leaving will permanently delete this group for everyone. Are you sure?'
        : 'Are you sure you want to leave this group?',
      confirmText: isCreator ? 'Delete Group' : 'Leave Group',
      variant: 'destructive',
      onConfirm: async () => {
        try {
          if (isCreator) {
            await apiClient.deleteConversation(id);
            toast({ title: 'Success', description: 'Group deleted successfully', variant: 'success' });
          } else {
            await apiClient.leaveConversation(id);
            toast({ title: 'Success', description: 'You left the group', variant: 'success' });
          }
          setActiveThreadId(null);
          fetchConversations();
        } catch (err) {
          toast({ title: 'Error', description: 'Failed to complete action', variant: 'destructive' });
        }
      }
    });
  };

  const handleRemoveParticipant = async (conversationId: string, userId: string) => {
    setConfirmation({
      isOpen: true,
      title: 'Remove Participant',
      description: 'Are you sure you want to remove this member from the group?',
      confirmText: 'Remove',
      variant: 'destructive',
      onConfirm: async () => {
        try {
          await apiClient.removeParticipant(conversationId, userId);
          toast({ title: 'Success', description: 'Participant removed', variant: 'success' });
          fetchConversations(true);
        } catch (err) {
          toast({ title: 'Error', description: 'Failed to remove participant', variant: 'destructive' });
        }
      }
    });
  };

  const handleDeleteMessage = async (messageId: string) => {
    setConfirmation({
      isOpen: true,
      title: 'Delete Message',
      description: 'Are you sure you want to permanently delete this message?',
      confirmText: 'Delete',
      variant: 'destructive',
      onConfirm: async () => {
        try {
          await apiClient.deleteMessage(messageId);
          if (activeThreadId) fetchMessages(activeThreadId);
        } catch (err) {
          toast({ title: 'Error', description: 'Failed to delete message', variant: 'destructive' });
        }
      }
    });
  };

  const handleFilePicked = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !activeThreadId) return;

    const isImage = file.type.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp)$/i.test(file.name);

    if (event.target === documentInputRef.current && isImage) {
      toast({
        title: "Invalid File",
        description: "Please use 'Photos' for images, or upload a document (PDF, DOC, etc.)",
        variant: "destructive"
      });
      event.target.value = '';
      return;
    }

    if (file.size === 0) {
      toast({ title: 'Error', description: 'Cannot upload an empty file', variant: 'destructive' });
      return;
    }

    try {
      setIsUploading(true);
      const localSize = formatFileSize(file.size);
      const uploadRes = await apiClient.uploadMessageAttachment(file);
      setSelectedFile({
        url: uploadRes.file_url,
        originalName: uploadRes.file_name || file.name,
        size: localSize,
      });
      setShowMenu(false);
      event.target.value = '';
    } catch (err) {
      toast({ title: 'Upload Failed', description: 'Could not upload attachment', variant: 'destructive' });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = async (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(false);
    if (!activeThreadId || isUploading) return;

    const file = event.dataTransfer.files?.[0];
    if (!file) return;

    if (file.size === 0) {
      toast({ title: 'Error', description: 'Cannot upload an empty file', variant: 'destructive' });
      return;
    }

    try {
      setIsUploading(true);
      const localSize = formatFileSize(file.size);
      const uploadRes = await apiClient.uploadMessageAttachment(file);
      setSelectedFile({
        url: uploadRes.file_url,
        originalName: uploadRes.file_name || file.name,
        size: localSize,
      });
      setShowMenu(false);
    } catch (err) {
      toast({ title: 'Upload Failed', description: 'Could not upload attachment', variant: 'destructive' });
    } finally {
      setIsUploading(false);
    }
  };

  const handleScheduleMeeting = () => {
    if (!activeThreadId) return;
    const meetingText =
      '(Let’s connect to discuss the Q3 report in more details)\nMonday, 8 December - 10:15 – 11:15am\nTime zone: USA\nGoogle Meet joining info\nVideo call link: https://meet.google.com';

    apiClient.sendMessage({
      content: meetingText,
      conversationId: activeThreadId,
    }).then(() => fetchMessages(activeThreadId));

    setShowMenu(false);
  };

  const groupedMessages = useMemo(() => {
    const messages = activeThread?.messages || [];
    return {
      YESTERDAY: messages.filter((m) => m.day === 'PAST'),
      TODAY: messages.filter((m) => m.day === 'TODAY'),
    };
  }, [activeThread]);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i)) + ' ' + sizes[i];
  };

  const downloadFile = async (url: string, fileName: string) => {
    try {
      const resp = await fetch(url);
      const blob = await resp.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      window.open(url, '_blank');
    }
  };

  const getFileIcon = (fileName?: string) => {
    if (!fileName) return "/images/message/document.svg";
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') return "/images/message/pdf-svgrepo.svg";
    if (ext === 'doc' || ext === 'docx') return "/images/message/docx_icon.svg";
    if (['jpg', 'jpeg', 'png', 'gif'].includes(ext || '')) return "/images/message/gallery.svg";
    return "/images/message/document.svg";
  };

  if (loading) {
    return (
      <div className="flex h-[600px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#FBCB4B]" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-8xl px-2 font-helvetica text-[#1F1F1F]">
      <h1 className="font-goudy font-bold text-[24px] leading-tight text-[#1F1F1F]">Messages</h1>

      <div className="mt-3 grid gap-3 md:grid-cols-[280px_1fr] lg:grid-cols-[320px_1fr]">
        <section className={cn(
          "rounded-[8px] bg-white p-4 shadow-sm border border-[#F0F0F0] h-[calc(100vh-160px)] min-h-[500px] flex flex-col",
          isMobileChatOpen ? "hidden md:flex" : "flex"
        )}>
          <div className="flex items-center gap-2 mb-4 px-1">
            <label className="relative flex-1 block">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#A2A5AA]" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                type="text"
                placeholder="Search messages here"
                className="h-[42px] w-full rounded-full bg-[#F5F5F7] pl-11 pr-4 text-[13px] text-[#1F1F1F] outline-none placeholder:text-[#A2A5AA] transition-all focus:ring-1 focus:ring-[#FBCB4B]"
              />
            </label>
            <button
              onClick={() => setIsNewChatModalOpen(true)}
              className="flex h-[42px] w-[42px] items-center justify-center rounded-full bg-[#F5F5F7] text-[#1F1F1F] hover:bg-[#FBCB4B] transition-all shadow-sm"
              title="New Chat"
            >
              <UserPlus className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 space-y-1 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-gray-200">
            {filteredThreads.length === 0 ? (
              <p className="py-10 text-center text-[13px] text-[#6F7177]">No conversations found</p>
            ) : (
              filteredThreads.map((thread) => {
                const selected = thread.id === activeThreadId;
                return (
                  <button
                    key={thread.id}
                    type="button"
                    onClick={() => handleThreadSelect(thread.id)}
                    className={cn(
                      "flex w-full items-start gap-3 px-3 py-3.5 text-left transition-all hover:bg-[#F9FAFB] border-b border-[#F0F0F0]",
                      selected ? "bg-[#F9FAFB]" : ""
                    )}
                  >
                    <div className="relative">
                      <AvatarDisplay
                        src={thread.avatar}
                        name={thread.investorName}
                        className="h-11 w-11 shrink-0 rounded-full shadow-sm"
                      />
                      <div className={cn(
                        "absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white",
                        thread.isOnline ? "bg-[#34C759]" : "bg-[#9CA1AA]"
                      )}></div>
                    </div>
                    <div className="flex flex-1 flex-col justify-between h-full min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <p className="truncate text-[14px] font-bold text-[#1F1F1F]">{thread.investorName}</p>
                        <p className="text-[11px] text-[#A2A5AA] whitespace-nowrap ml-2">{thread.timeAgo}</p>
                      </div>
                      {thread.isGroup && (
                        <p className="text-[10px] font-bold text-[#FBCB4B] uppercase tracking-wider mb-0.5">Group</p>
                      )}
                      <div className="flex items-center justify-between">
                        <p className="truncate text-[12px] text-[#6F7177] leading-tight flex-1">{thread.preview}</p>
                        {thread.unreadCount > 0 && (
                          <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#EAF6F0] px-1.5 text-[10px] font-bold text-[#34C759] ml-2">
                            {thread.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </section>

        <section 
          className={cn(
            "rounded-[8px] bg-white p-4 shadow-sm border border-[#F0F0F0] flex flex-col h-[calc(100vh-160px)] min-h-[500px] relative",
            !isMobileChatOpen ? "hidden md:flex" : "flex",
            isDragging ? "border-[#FBCB4B] bg-yellow-50/30" : ""
          )}
          onDragOver={(e) => { e.preventDefault(); if (activeThreadId) setIsDragging(true); }}
          onDragEnter={(e) => { e.preventDefault(); if (activeThreadId) setIsDragging(true); }}
          onDragLeave={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            if (
              e.clientX <= rect.left ||
              e.clientX >= rect.right ||
              e.clientY <= rect.top ||
              e.clientY >= rect.bottom
            ) {
              setIsDragging(false);
            }
          }}
          onDrop={handleDrop}
        >
          {isDragging && activeThreadId && (
            <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white/90 backdrop-blur-sm border-2 border-dashed border-[#FBCB4B] rounded-[8px] animate-in fade-in duration-200">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#FBCB4B]/20 text-[#FBCB4B] mb-4">
                <Upload className="h-8 w-8 text-[#FBCB4B]" />
              </div>
              <p className="text-[16px] font-bold text-[#1F1F1F]">Drop files to attach</p>
              <p className="text-[12px] text-[#8E8E93] mt-1">Images, PDFs, Docs up to 10MB</p>
            </div>
          )}
          {activeThread ? (
            <>
              <div className="flex items-center gap-3 border-b border-[#F0F0F0] pb-4 px-1 shrink-0">
                <button
                  onClick={() => setIsMobileChatOpen(false)}
                  className="md:hidden p-2 -ml-2 text-[#6F7177] hover:bg-[#F5F5F7] rounded-full transition-colors"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <div className="relative">
                  <AvatarDisplay
                    src={activeThread.avatar}
                    name={activeThread.investorName}
                    className="h-10 w-10 rounded-full shadow-sm"
                  />
                  <div className={cn(
                    "absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white",
                    activeThread.isOnline ? "bg-[#34C759]" : "bg-[#9CA1AA]"
                  )}></div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[15px] font-bold text-[#1F1F1F] leading-tight truncate">{activeThread.investorName}</p>
                  <p className="text-[12px] text-[#A2A5AA] mt-0.5">
                    {activeThread.isGroup ? `${activeThread.participants?.length || 0} participants` : activeThread.role}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="p-2 hover:bg-[#F5F5F7] rounded-full transition-colors text-[#6F7177]">
                        <MoreHorizontal className="h-5 w-5" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-[200px] rounded-xl shadow-xl border-[#F0F0F0]">
                      <div className="px-3 py-2 border-b border-[#F0F0F0] mb-1">
                        <p className="text-[11px] font-bold text-[#A2A5AA] uppercase tracking-wider">
                          {activeThread.isGroup ? 'Group Details' : 'Chat Details'}
                        </p>
                      </div>

                      {activeThread.participants?.map((p: any) => (
                        <div key={p.id} className="flex items-center gap-2 px-3 py-2 text-[13px] text-[#1F1F1F]">
                          <AvatarDisplay
                            src={p.avatar}
                            name={p.name}
                            className="w-6 h-6 rounded-full text-[10px]"
                          />
                          <span className="flex-1 truncate">{p.name} {p.id === profile?.id && '(You)'}</span>
                          {activeThread.isGroup && activeThread.createdBy === profile?.id && p.id !== profile?.id && (
                            <button
                              onClick={(e) => { e.stopPropagation(); handleRemoveParticipant(activeThread.id, p.id); }}
                              className="text-red-500 hover:bg-red-50 p-1 rounded-md transition-colors"
                              title="Remove Participant"
                            >
                              <UserMinus className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      ))}

                      {activeThread.isGroup && activeThread.createdBy === profile?.id && (
                        <>
                          <div className="h-[1px] bg-[#F0F0F0] my-1" />
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedUserIds([]);
                              setIsAddMode(true);
                              setIsNewChatModalOpen(true);
                            }}
                            className="focus:bg-blue-50 focus:text-blue-600 cursor-pointer flex items-center gap-2 px-3 py-2.5 rounded-lg font-bold text-[#3B6FF0]"
                          >
                            <UserPlus className="h-4 w-4" />
                            <span>Add Members</span>
                          </DropdownMenuItem>
                        </>
                      )}

                      {activeThread.isGroup && (
                        <>
                          <div className="h-[1px] bg-[#F0F0F0] my-1" />
                          <DropdownMenuItem
                            onClick={() => handleLeaveGroup(activeThread.id)}
                            className="text-red-500 focus:text-red-500 focus:bg-red-50 cursor-pointer flex items-center gap-2 px-3 py-2.5 rounded-lg"
                          >
                            <LogOut className="h-4 w-4" />
                            <span>Leave Group</span>
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto mt-4 px-1 pr-4 space-y-6 scrollbar-thin scrollbar-thumb-gray-200">
                {groupedMessages.YESTERDAY.length > 0 && (
                  <>
                    <div className="flex items-center gap-4 my-2">
                      <div className="h-[1px] flex-1 bg-[#F0F0F0]"></div>
                      <div className="text-[11px] font-bold tracking-[0.1em] text-[#A2A5AA] uppercase">YESTERDAY</div>
                      <div className="h-[1px] flex-1 bg-[#F0F0F0]"></div>
                    </div>
                    <div className="space-y-4">
                      {groupedMessages.YESTERDAY.map((message) => (
                        <div key={message.id} className="group flex flex-col w-full relative">
                          <div className={cn(
                            "flex items-end mb-1",
                            message.sender === 'investor' ? "justify-start" : "justify-end"
                          )}>
                            {message.sender === 'investor' ? (
                              <div className="flex items-start gap-2 max-w-[85%] sm:max-w-[80%]">
                                <AvatarDisplay
                                  src={message.senderAvatar}
                                  name={message.sender_name || 'Participant'}
                                  className="w-8 h-8 rounded-full mt-1"
                                />
                                <div className="flex flex-col items-start flex-1">
                                  {activeThread?.isGroup && (
                                    <span className="text-[11px] font-bold text-[#6F7177] mb-1 ml-1 block">
                                      {message.sender_name || 'Participant'}
                                    </span>
                                  )}
                                  {message.isAttachment ? (
                                    <div className="bg-[#E8F0FE] rounded-[18px] rounded-bl-[4px] p-3 text-[#1F1F1F] border border-[#D9E6FC] shadow-sm">
                                      <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 shrink-0 flex items-center justify-center">
                                          <img src={getFileIcon(message.attachmentName)} alt="doc" className="h-8 w-8" />
                                        </div>
                                        <div className="min-w-0">
                                          <p className="truncate text-[13px] font-bold">{message.attachmentName}</p>
                                          <p className="text-[11px] opacity-70">{message.attachmentSize}</p>
                                        </div>
                                        <button onClick={() => downloadFile(message.fileUrl!, message.attachmentName!)} className="p-2 hover:bg-white/50 rounded-full transition-colors">
                                          <Download className="h-4 w-4" />
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="bg-[#E8F0FE] rounded-[18px] rounded-bl-[4px] px-4 py-2.5 text-[14px] text-[#1F1F1F] leading-relaxed border border-[#D9E6FC] shadow-sm">
                                      {message.text}
                                    </div>
                                  )}
                                  <span className="text-[11px] text-[#A2A5AA] mt-1.5 ml-1">{message.time}</span>
                                </div>
                              </div>
                            ) : (
                              <div className="flex flex-col items-end max-w-[85%] sm:max-w-[80%]">
                                <div className="flex items-start gap-2 relative">

                                  {editingMessageId === message.id ? (
                                    <div className="flex flex-col bg-[#F5F5F5] rounded-[18px] rounded-br-[4px] p-4 border border-[#EBEBEB] w-[260px] sm:w-[320px] shadow-sm relative overflow-hidden">
                                      <textarea
                                        value={editInput}
                                        onChange={(e) => setEditInput(e.target.value)}
                                        className="bg-transparent text-[14px] outline-none resize-none min-h-[80px] w-full text-[#1F1F1F] leading-relaxed"
                                        autoFocus
                                      />
                                      <div className="flex justify-end gap-2 mt-2">
                                        <button
                                          onClick={() => setEditingMessageId(null)}
                                          className="flex items-center justify-center h-8 w-8 hover:bg-gray-200 rounded-full text-[#6F7177] transition-colors"
                                        >
                                          <X className="h-4.5 w-4.5" />
                                        </button>
                                        <button
                                          onClick={() => handleEditMessage(message.id)}
                                          className="flex items-center justify-center h-8 w-8 bg-[#FBCB4B] rounded-full text-[#1F1F1F] shadow-sm hover:scale-105 active:scale-95 transition-all"
                                        >
                                          <Check className="h-4.5 w-4.5" />
                                        </button>
                                      </div>
                                    </div>
                                  ) : message.isAttachment ? (
                                    <div className="bg-[#F5F5F5] rounded-[18px] rounded-br-[4px] p-3 text-[#1F1F1F] border border-[#EBEBEB] shadow-sm">
                                      <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 shrink-0 flex items-center justify-center">
                                          <img src={getFileIcon(message.attachmentName)} alt="doc" className="h-8 w-8" />
                                        </div>
                                        <div className="min-w-0">
                                          <p className="truncate text-[13px] font-bold">{message.attachmentName}</p>
                                          <p className="text-[11px] opacity-70">{message.attachmentSize}</p>
                                        </div>
                                        <button onClick={() => downloadFile(message.fileUrl!, message.attachmentName!)} className="p-2 hover:bg-white/50 rounded-full transition-colors">
                                          <Download className="h-4 w-4" />
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="bg-[#F5F5F5] rounded-[18px] rounded-br-[4px] px-4 py-2.5 text-[14px] text-[#1F1F1F] leading-relaxed border border-[#EBEBEB] whitespace-pre-line shadow-sm">
                                      {message.text}
                                      {message.updatedAt && message.updatedAt !== message.createdAt && (
                                        <span className="block mt-0.5 text-[9px] opacity-40 text-right italic">(edited)</span>
                                      )}
                                    </div>
                                  )}
                                </div>
                                <span className="text-[11px] text-[#A2A5AA] mt-1.5 mr-1">{message.time}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {groupedMessages.TODAY.length > 0 && (
                  <div className="flex items-center gap-4 my-2">
                    <div className="h-[1px] flex-1 bg-[#F0F0F0]"></div>
                    <div className="text-[11px] font-bold tracking-[0.1em] text-[#A2A5AA] uppercase">TODAY</div>
                    <div className="h-[1px] flex-1 bg-[#F0F0F0]"></div>
                  </div>
                )}

                <div className="space-y-4">
                  {groupedMessages.TODAY.map((message) => (
                    <div key={message.id} className="group flex flex-col w-full relative">
                      <div className={cn(
                        "flex items-end mb-1",
                        message.sender === 'investor' ? "justify-start" : "justify-end"
                      )}>
                        {message.sender === 'investor' ? (
                          <div className="flex flex-col items-start max-w-[85%] sm:max-w-[80%]">
                            {activeThread?.isGroup && (
                              <span className="text-[11px] font-bold text-[#6F7177] mb-1 ml-1 block">
                                {message.sender_name || 'Participant'}
                              </span>
                            )}
                            {message.text.includes('Monday, 8 December') ? (
                              <div className="bg-[#E8F0FE] rounded-[18px] rounded-bl-[4px] px-4 py-3 text-[14px] text-[#1F1F1F] border border-[#D9E6FC] shadow-sm">
                                <p className="mb-2 font-medium">{message.text.split('\n')[0]}</p>
                                <div className="bg-white/50 rounded-xl p-3 space-y-1.5 border border-white/40">
                                  {message.text.split('\n').slice(1).map((line, i) => (
                                    <p key={i} className={cn("text-[13px]", line.includes('http') ? "text-[#007AFF] font-semibold underline decoration-2 underline-offset-2" : "text-[#4B4B4B]")}>
                                      {line}
                                    </p>
                                  ))}
                                </div>
                              </div>
                            ) : message.isAttachment ? (
                              <div className="bg-[#E8F0FE] rounded-[18px] rounded-bl-[4px] p-3 text-[#1F1F1F] border border-[#D9E6FC] shadow-sm">
                                <div className="flex items-center gap-3">
                                  <div className="h-10 w-10 shrink-0 flex items-center justify-center">
                                    <img src={getFileIcon(message.attachmentName)} alt="doc" className="h-8 w-8" />
                                  </div>
                                  <div className="min-w-0">
                                    <p className="truncate text-[13px] font-bold">{message.attachmentName}</p>
                                    <p className="text-[11px] opacity-70">{message.attachmentSize}</p>
                                  </div>
                                  <button onClick={() => downloadFile(message.fileUrl!, message.attachmentName!)} className="p-2 hover:bg-white/50 rounded-full transition-colors">
                                    <Download className="h-4 w-4" />
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="bg-[#E8F0FE] rounded-[18px] rounded-bl-[4px] px-4 py-2.5 text-[14px] text-[#1F1F1F] leading-relaxed border border-[#D9E6FC] shadow-sm">
                                {message.text}
                              </div>
                            )}
                            <span className="text-[11px] text-[#A2A5AA] mt-1.5 ml-1">{message.time}</span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-end max-w-[85%] sm:max-w-[80%]">
                            <div className="flex items-start gap-2 relative">

                              {editingMessageId === message.id ? (
                                <div className="flex flex-col bg-[#F5F5F5] rounded-[18px] rounded-br-[4px] p-4 border border-[#EBEBEB] w-[260px] sm:w-[320px] shadow-sm relative overflow-hidden">
                                  <textarea
                                    value={editInput}
                                    onChange={(e) => setEditInput(e.target.value)}
                                    className="bg-transparent text-[14px] outline-none resize-none min-h-[80px] w-full text-[#1F1F1F] leading-relaxed"
                                    autoFocus
                                  />
                                  <div className="flex justify-end gap-2 mt-2">
                                    <button
                                      onClick={() => setEditingMessageId(null)}
                                      className="flex items-center justify-center h-8 w-8 hover:bg-gray-200 rounded-full text-[#6F7177] transition-colors"
                                    >
                                      <X className="h-4.5 w-4.5" />
                                    </button>
                                    <button
                                      onClick={() => handleEditMessage(message.id)}
                                      className="flex items-center justify-center h-8 w-8 bg-[#FBCB4B] rounded-full text-[#1F1F1F] shadow-sm hover:scale-105 active:scale-95 transition-all"
                                    >
                                      <Check className="h-4.5 w-4.5" />
                                    </button>
                                  </div>
                                </div>
                              ) : message.isAttachment ? (
                                <div className="bg-[#F5F5F5] rounded-[18px] rounded-br-[4px] p-3 text-[#1F1F1F] border border-[#EBEBEB] shadow-sm">
                                  <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 shrink-0 flex items-center justify-center">
                                      <img src={getFileIcon(message.attachmentName)} alt="doc" className="h-8 w-8" />
                                    </div>
                                    <div className="min-w-0">
                                      <p className="truncate text-[13px] font-bold">{message.attachmentName}</p>
                                      <p className="text-[11px] opacity-70">{message.attachmentSize}</p>
                                    </div>
                                    <button onClick={() => downloadFile(message.fileUrl!, message.attachmentName!)} className="p-2 hover:bg-white/50 rounded-full transition-colors">
                                      <Download className="h-4 w-4" />
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div className="bg-[#F5F5F5] rounded-[18px] rounded-br-[4px] px-4 py-2.5 text-[14px] text-[#1F1F1F] leading-relaxed border border-[#EBEBEB] whitespace-pre-line shadow-sm">
                                  {message.text}
                                  {message.updatedAt && message.updatedAt !== message.createdAt && (
                                    <span className="block mt-0.5 text-[9px] opacity-40 text-right italic">(edited)</span>
                                  )}
                                </div>
                              )}
                            </div>
                            <span className="text-[11px] text-[#A2A5AA] mt-1.5 mr-1">{message.time}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {isUploading && (
                    <div className="mr-auto max-w-[75%] sm:max-w-[70%] rounded-[18px] bg-[#E8F0FE] p-3 animate-pulse border border-[#D9E6FC] shadow-sm">
                      <div className="flex items-center gap-2 text-[#2A4474]">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-[12px] font-medium">Uploading attachment...</span>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-[#F0F0F0] shrink-0">
                {selectedFile && (
                  <div className="mb-3 flex w-fit max-w-[95%] sm:max-w-[380px] items-center gap-3 rounded-2xl bg-[#F9FAFB] p-3 border border-[#F0F0F0] shadow-sm animate-in slide-in-from-bottom-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white border border-[#EDEDED] shadow-sm">
                      <img src={getFileIcon(selectedFile.originalName)} alt="file" className="h-6 w-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-[13px] font-bold text-[#1F1F1F]">{selectedFile.originalName}</p>
                      <p className="text-[11px] text-[#A2A5AA]">{selectedFile.size}</p>
                    </div>
                    <button
                      onClick={() => setSelectedFile(null)}
                      className="ml-2 text-[#A2A5AA] hover:text-red-500 transition-colors bg-white hover:bg-red-50 p-1.5 rounded-full shadow-sm border border-[#F0F0F0]"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}

                <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={handleFilePicked} />
                <input ref={documentInputRef} type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.csv,.jpg,.jpeg,.png" className="hidden" onChange={handleFilePicked} />

                <div className="relative flex items-center gap-2 bg-[#F9F9FB] rounded-[20px] px-3.5 py-2.5 border border-[#EBEBEB] transition-all focus-within:border-[#FBCB4B] focus-within:shadow-md focus-within:bg-white">
                  {showMenu && (
                    <div className="absolute bottom-full left-0 mb-3 z-10 w-[220px] rounded-[16px] border border-[#F0F0F0] bg-white p-1.5 shadow-[0_12px_30px_rgba(0,0,0,0.15)] animate-in zoom-in-95 duration-150 origin-bottom-left">
                      <button onClick={() => { photoInputRef.current?.click(); setShowMenu(false); }} className="flex w-full items-center gap-3 px-3.5 py-3 text-left text-[14px] text-[#4B4B4B] hover:bg-[#F9FAFB] rounded-xl transition-colors">
                        <img src="/images/message/gallery.svg" alt="photos" className="h-6 w-6" /> Photos
                      </button>
                      <button onClick={() => { documentInputRef.current?.click(); setShowMenu(false); }} className="flex w-full items-center gap-3 px-3.5 py-3 text-left text-[14px] text-[#4B4B4B] hover:bg-[#F9FAFB] rounded-xl transition-colors">
                        <img src="/images/message/document.svg" alt="docs" className="h-6 w-6" /> Documents
                      </button>
                      <button onClick={() => { window.open('https://workspace.google.com/products/meet/', '_blank'); setShowMenu(false); }} className="flex w-full items-center gap-3 px-3.5 py-3 text-left text-[14px] text-[#4B4B4B] hover:bg-[#F9FAFB] rounded-xl transition-colors">
                        <img src="/images/message/google_meet.svg" alt="meet" className="h-6 w-6" /> Meeting
                      </button>
                    </div>
                  )}

                  <button
                    type="button"
                    disabled={isUploading || isSending}
                    onClick={() => setShowMenu((prev) => !prev)}
                    className="flex h-10 w-10 shrink-0 items-center justify-center transition-all disabled:opacity-50 hover:bg-[#F0F0F2] rounded-full"
                  >
                    <img src="/images/message/attach_square.svg" alt="attach" className="h-7 w-7" />
                  </button>

                  <textarea
                    ref={messageInputRef}
                    value={messageInput}
                    onChange={(event) => {
                      setMessageInput(event.target.value);
                      event.target.style.height = 'auto';
                      event.target.style.height = `${event.target.scrollHeight}px`;
                    }}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' && !event.shiftKey) {
                        event.preventDefault();
                        sendMessage();
                      }
                    }}
                    placeholder={isUploading ? "Uploading file..." : "Type a message here (or drag & drop files) ..."}
                    disabled={isUploading || isSending}
                    className="flex-1 bg-transparent text-[14px] py-1.5 outline-none placeholder:text-[#B1B3B8] disabled:opacity-50 resize-none"
                    rows={1}
                  />

                  <button
                    type="button"
                    onClick={sendMessage}
                    disabled={isUploading || isSending || (!messageInput.trim() && !selectedFile)}
                    className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#FBCB4B] text-[#1F1F1F] shadow-sm transition-all hover:bg-[#fbd364] hover:scale-105 active:scale-95 disabled:grayscale disabled:opacity-50"
                  >
                    {isSending ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <SendHorizontal className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center text-[#A2A5AA] bg-[#F9FAFB] rounded-[12px] border border-dashed border-[#E0E0E0]">
              <div className="h-20 w-20 rounded-full bg-white flex items-center justify-center shadow-sm mb-4">
                <Search className="h-8 w-8 opacity-20" />
              </div>
              <p className="text-[16px] font-medium text-[#6F7177]">Select a conversation to start chatting</p>
              <p className="text-[13px] mt-1 opacity-60">Pick an investor from the sidebar</p>
              <button
                onClick={() => setIsNewChatModalOpen(true)}
                className="mt-4 px-4 py-2 bg-[#FBCB4B] text-[#1F1F1F] text-[13px] font-medium rounded-full shadow-sm hover:scale-105 transition-all"
              >
                New Chat
              </button>
            </div>
          )}
        </section>
      </div>

      <Dialog open={isNewChatModalOpen} onOpenChange={(open) => {
        setIsNewChatModalOpen(open);
        if (!open) {
          setSelectedUserIds([]);
          setGroupNameInput('');
          setUserSearch('');
          setIsAddMode(false);
        }
      }}>
        <DialogContent className="w-[95%] max-w-[95%] sm:w-full sm:max-w-[425px] p-0 overflow-hidden rounded-2xl flex flex-col h-[600px] max-h-[90vh] font-helvetica">
          <DialogHeader className="p-6 pb-2 shrink-0">
            <DialogTitle className="font-goudy text-2xl">{isAddMode ? 'Add Members' : 'New Chat'}</DialogTitle>
            <p className="text-[13px] text-[#8E8E93]">{isAddMode ? 'Select participants to add to the group' : 'Select individuals or create a group'}</p>
          </DialogHeader>

          <div className="px-6 py-2 shrink-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#A2A5AA]" />
              <input
                type="text"
                placeholder="Search by name..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="w-full h-10 pl-10 pr-4 bg-[#F5F5F7] border border-transparent rounded-xl text-[13px] outline-none focus:bg-white focus:border-[#FBCB4B] focus:ring-1 focus:ring-[#FBCB4B] transition-all placeholder:text-[#A2A5AA]"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 pb-4">
            {loadingUsers ? (
              <div className="flex justify-center py-10">
                <Loader2 className="h-6 w-6 animate-spin text-[#FBCB4B]" />
              </div>
            ) : availableUsers.length === 0 ? (
              <p className="text-center py-10 text-[13px] text-[#8E8E93]">No available users found</p>
            ) : (
              <div className="space-y-1">
                {(() => {
                  const filtered = availableUsers.filter(user => {
                    const matchesSearch = user.full_name?.toLowerCase().includes(userSearch.toLowerCase());
                    if (!matchesSearch) return false;
                    if (!isAddMode) return true;
                    const currentParticipantIds = activeThread?.participants?.map((p: any) => p.id) || [];
                    return !currentParticipantIds.includes(user.id);
                  });

                  if (filtered.length === 0) {
                    return <p className="text-center py-10 text-[13px] text-[#8E8E93]">No results found for "{userSearch}"</p>;
                  }

                  return filtered.map((user) => {
                    const isSelected = selectedUserIds.includes(user.id);
                    return (
                      <button
                        key={user.id}
                        onClick={() => toggleUserSelection(user.id)}
                        className={cn(
                          "flex w-full items-center gap-3 px-3 py-2.5 text-left rounded-xl transition-all group",
                          isSelected ? "bg-[#FBCB4B]/10 border-[#FBCB4B] border" : "hover:bg-gray-50 border border-transparent"
                        )}
                      >
                        <div className="relative">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#2A4474] to-[#1F3B6E] flex items-center justify-center text-[12px] font-bold text-white uppercase overflow-hidden shadow-sm">
                            {user.avatar ? <img src={user.avatar} className="w-full h-full object-cover" /> : (user.full_name?.charAt(0) || '?')}
                          </div>
                          {isSelected && (
                            <div className="absolute -top-1 -right-1 bg-[#FBCB4B] text-[#1F1F1F] rounded-full p-0.5 shadow-sm">
                              <Check className="w-3 h-3 stroke-[3]" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[14px] font-bold text-[#1F1F1F] truncate group-hover:text-[#FBCB4B] transition-colors">{user.full_name}</p>
                          <p className="text-[11px] text-[#8E8E93] uppercase tracking-wider">{user.role}</p>
                        </div>
                        <div className={cn(
                          "w-5 h-5 rounded border transition-all flex items-center justify-center",
                          isSelected ? "bg-[#FBCB4B] border-[#FBCB4B]" : "border-[#D1D1D6] group-hover:border-[#FBCB4B]"
                        )}>
                          {isSelected && <Check className="w-3.5 h-3.5 text-[#1F1F1F] stroke-[3]" />}
                        </div>
                      </button>
                    );
                  });
                })()}
              </div>
            )}
          </div>

          <div className="p-6 pt-2 border-t border-[#F0F0F0] bg-gray-50/50 shrink-0">
            {!isAddMode && selectedUserIds.length > 1 && (
              <div className="space-y-3 pt-2">
                <div>
                  <label className="text-[12px] font-bold text-[#6F7177] uppercase tracking-wider mb-2 block">Group Name</label>
                  <input
                    placeholder="Enter group name..."
                    value={groupNameInput}
                    onChange={(e) => setGroupNameInput(e.target.value)}
                    className="w-full h-11 px-4 bg-white border border-[#F0F0F0] rounded-xl text-[14px] outline-none focus:ring-1 focus:ring-[#FBCB4B] shadow-sm transition-all"
                  />
                </div>

                <div>
                  <label className="text-[12px] font-bold text-[#6F7177] uppercase tracking-wider mb-2 block">Group Avatar</label>
                  <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                    <input
                      type="file"
                      ref={avatarInputRef}
                      className="hidden"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                    />
                    <button
                      onClick={() => avatarInputRef.current?.click()}
                      disabled={isUploadingAvatar}
                      className="h-12 w-12 rounded-xl shrink-0 border-2 border-dashed border-[#E5E7EB] flex items-center justify-center hover:border-[#FBCB4B] transition-all bg-white"
                    >
                      {isUploadingAvatar ? <Loader2 className="h-5 w-5 animate-spin text-[#FBCB4B]" /> : <Plus className="h-5 w-5 text-[#6F7177]" />}
                    </button>

                    {['/images/messages-person/GroupIcon.png'].map((avatar) => (
                      <button
                        key={avatar}
                        onClick={() => setSelectedGroupAvatar(avatar)}
                        className={cn(
                          "h-12 w-12 rounded-xl shrink-0 border-2 transition-all overflow-hidden bg-gray-50",
                          selectedGroupAvatar === avatar ? "border-[#FBCB4B] shadow-md scale-105" : "border-transparent opacity-60 hover:opacity-100"
                        )}
                      >
                        <AvatarDisplay src={avatar} name="Group" className="w-full h-full" />
                      </button>
                    ))}

                    {selectedGroupAvatar !== '/images/messages-person/GroupIcon.png' && !selectedGroupAvatar.startsWith('/images/') && (
                      <div className="relative h-12 w-12 rounded-xl shrink-0 border-2 border-[#FBCB4B] shadow-md scale-105 overflow-hidden">
                        <img src={selectedGroupAvatar} className="w-full h-full object-cover" alt="Custom Avatar" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
            <button
              onClick={handleStartChat}
              disabled={selectedUserIds.length === 0 || isCreatingChat}
              className="w-full h-12 bg-[#FBCB4B] text-[#1F1F1F] font-bold rounded-xl shadow-md hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:grayscale transition-all flex items-center justify-center gap-2"
            >
              {isCreatingChat ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                <>
                  {isAddMode ? `Add Members (${selectedUserIds.length})` : selectedUserIds.length > 1 ? `Create Group (${selectedUserIds.length})` : 'Start Chat'}
                </>
              )}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <Dialog open={confirmation.isOpen} onOpenChange={(open) => setConfirmation(prev => ({ ...prev, isOpen: open }))}>
        <DialogContent className="sm:max-w-[400px] p-0 overflow-hidden border-none shadow-2xl rounded-2xl font-helvetica">
          <div className="p-6">
            <DialogHeader className="mb-4">
              <DialogTitle className="text-[20px] font-bold text-[#1F1F1F]">{confirmation.title}</DialogTitle>
            </DialogHeader>
            <p className="text-[14px] text-[#6F7177] leading-relaxed">
              {confirmation.description}
            </p>
          </div>
          <div className="flex gap-3 p-4 bg-gray-50 border-t border-[#F0F0F0]">
            <button
              onClick={() => setConfirmation(prev => ({ ...prev, isOpen: false }))}
              className="flex-1 h-11 rounded-xl text-[14px] font-bold text-[#6F7177] hover:bg-gray-200 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                setConfirmation(prev => ({ ...prev, isOpen: false }));
                confirmation.onConfirm();
              }}
              className={cn(
                "flex-1 h-11 rounded-xl text-[14px] font-bold transition-all shadow-sm active:scale-95",
                confirmation.variant === 'destructive'
                  ? "bg-red-500 text-white hover:bg-red-600 shadow-red-100"
                  : "bg-[#FBCB4B] text-[#1F1F1F] hover:bg-[#F5B50A] shadow-yellow-100"
              )}
            >
              {confirmation.confirmText || 'Confirm'}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
