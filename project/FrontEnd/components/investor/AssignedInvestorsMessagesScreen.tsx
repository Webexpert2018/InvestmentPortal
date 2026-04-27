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
  ChevronLeft
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
import { cn } from "@/lib/utils";

type Sender = 'investor' | 'accountant';

type ChatMessage = {
  id: string;
  sender: Sender;
  text: string;
  time: string;
  day: string;
  isAttachment?: boolean;
  attachmentName?: string;
  attachmentSize?: string;
  fileUrl?: string;
  updatedAt?: string;
  createdAt?: string;
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

  // Editing state
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editInput, setEditInput] = useState('');
  const [isMobileChatOpen, setIsMobileChatOpen] = useState(false);

  const photoInputRef = useRef<HTMLInputElement | null>(null);
  const documentInputRef = useRef<HTMLInputElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const prevMessagesCountRef = useRef<number>(0);

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
        const isUserInvestor = conv.investor_id === profile?.id;
        const otherPartyName = isUserInvestor
          ? (conv.admin_name || 'Support Admin')
          : (conv.investor_name || 'System User');

        return {
          id: conv.id,
          investorName: otherPartyName,
          role: isUserInvestor ? 'Support' : (conv.investor_role || 'Investor'),
          timeAgo: conv.last_message_at ? formatDistanceToNow(new Date(conv.last_message_at), { addSuffix: true }) : 'Just now',
          unreadCount: isUserInvestor ? (conv.unread_count_investor || 0) : (conv.unread_count_admin || 0),
          preview: conv.last_message || 'No messages yet',
          avatar: isUserInvestor ? '/images/messages-person/Ellipse 12.png' : (conv.investor_avatar || '/images/messages-person/Ellipse 13.png'),
          isOnline: true,
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
          text: msg.content || '',
          time: new Date(msg.created_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
          day: new Date(msg.created_at).toDateString() === new Date().toDateString() ? 'TODAY' : 'PAST',
          isAttachment: !!msg.file_url,
          attachmentName: msg.file_name,
          attachmentSize: msg.file_size,
          fileUrl: msg.file_url,
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

  const handleDeleteMessage = async (messageId: string) => {
    if (!confirm('Are you sure you want to delete this message?')) return;
    try {
      await apiClient.deleteMessage(messageId);
      if (activeThreadId) fetchMessages(activeThreadId);
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to delete message', variant: 'destructive' });
    }
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
      <h1 className="font-goudy font-bold text-[32px] leading-tight text-[#1F1F1F]">Messages</h1>

      <div className="mt-3 grid gap-3 md:grid-cols-[280px_1fr] lg:grid-cols-[320px_1fr]">
        {/* Threads List */}
        <section className={cn(
          "rounded-[12px] bg-white p-4 shadow-sm border border-[#F0F0F0] h-[700px] flex flex-col",
          isMobileChatOpen ? "hidden md:flex" : "flex"
        )}>
          <label className="relative block mb-4 px-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#A2A5AA]" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              type="text"
              placeholder="Search messages here"
              className="h-[42px] w-full rounded-full bg-[#F5F5F7] pl-11 pr-4 text-[13px] text-[#1F1F1F] outline-none placeholder:text-[#A2A5AA] transition-all focus:ring-1 focus:ring-[#FBCB4B]"
            />
          </label>

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
                      "flex w-full items-start gap-3 px-3 py-3.5 text-left transition-all hover:bg-[#F9FAFB]",
                      selected ? "bg-[#F9FAFB] border-bottom border-[#F0F0F0]" : "border border-transparent"
                    )}
                  >
                    <div className="relative">
                      <img
                        src={thread.avatar}
                        alt={thread.investorName}
                        className="h-11 w-11 shrink-0 rounded-full object-cover shadow-sm"
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

        {/* Chat Area */}
        <section className={cn(
          "rounded-[12px] bg-white p-4 shadow-sm border border-[#F0F0F0] flex flex-col h-[700px]",
          !isMobileChatOpen ? "hidden md:flex" : "flex"
        )}>
          {activeThread ? (
            <>
              {/* Chat Header */}
              <div className="flex items-center gap-3 border-b border-[#F0F0F0] pb-4 px-1 shrink-0">
                <button
                  onClick={() => setIsMobileChatOpen(false)}
                  className="md:hidden p-2 -ml-2 text-[#6F7177] hover:bg-[#F5F5F7] rounded-full transition-colors"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <div className="relative">
                  <img
                    src={activeThread.avatar}
                    alt={activeThread.investorName}
                    className="h-10 w-10 rounded-full object-cover shadow-sm"
                  />
                  <div className={cn(
                    "absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white",
                    activeThread.isOnline ? "bg-[#34C759]" : "bg-[#9CA1AA]"
                  )}></div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[15px] font-bold text-[#1F1F1F] leading-tight truncate">{activeThread.investorName}</p>
                  <p className="text-[12px] text-[#A2A5AA] mt-0.5">{activeThread.role}</p>
                </div>
              </div>

              {/* Message List */}
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
                            {/* Received Message (Left) */}
                            {message.sender === 'investor' ? (
                              <div className="flex flex-col items-start max-w-[85%] sm:max-w-[80%]">
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
                            ) : (
                              /* Sent Message (Right) */
                              <div className="flex flex-col items-end max-w-[85%] sm:max-w-[80%]">
                                <div className="flex items-start gap-2 relative">
                                  {/* Action Menu - Positioning fixed logic to prevent shifting */}
                                  <div className={cn(
                                    "flex items-center gap-1 self-center transition-all duration-200",
                                    editingMessageId === message.id ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                                  )}>
                                    <button
                                      onClick={() => { setEditingMessageId(message.id); setEditInput(message.text); }}
                                      className="p-1.5 hover:bg-gray-100 rounded-full text-[#A2A5AA] hover:text-[#1F1F1F] transition-colors"
                                    >
                                      <Pencil className="h-3.5 w-3.5" />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteMessage(message.id)}
                                      className="p-1.5 hover:bg-red-50 rounded-full text-[#A2A5AA] hover:text-red-500 transition-colors"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                  </div>

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
                            {message.text.includes('Monday, 8 December') ? (
                              /* Meeting Request Bubble Styling */
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
                              <div className={cn(
                                "flex items-center gap-1 self-center transition-all duration-200",
                                editingMessageId === message.id ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                              )}>
                                <button onClick={() => { setEditingMessageId(message.id); setEditInput(message.text); }} className="p-1.5 hover:bg-gray-100 rounded-full text-[#A2A5AA] hover:text-[#1F1F1F] transition-colors">
                                  <Pencil className="h-3.5 w-3.5" />
                                </button>
                                <button onClick={() => handleDeleteMessage(message.id)} className="p-1.5 hover:bg-red-50 rounded-full text-[#A2A5AA] hover:text-red-500 transition-colors">
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>

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

              {/* Chat Input Area */}
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

                  <input
                    value={messageInput}
                    onChange={(event) => setMessageInput(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' && !event.shiftKey) {
                        event.preventDefault();
                        sendMessage();
                      }
                    }}
                    placeholder={isUploading ? "Uploading file..." : "Type a message here ..."}
                    disabled={isUploading || isSending}
                    className="flex-1 bg-transparent text-[14px] py-1.5 outline-none placeholder:text-[#B1B3B8] disabled:opacity-50"
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
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
