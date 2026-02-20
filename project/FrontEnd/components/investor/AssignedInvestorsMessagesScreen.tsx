'use client';

import { ChangeEvent, useMemo, useRef, useState } from 'react';
import { CalendarDays, FileText, Image as ImageIcon, PlusCircle, Search, SendHorizontal } from 'lucide-react';

type Sender = 'investor' | 'accountant';

type ChatMessage = {
  id: string;
  sender: Sender;
  text: string;
  time: string;
  day: 'YESTERDAY' | 'TODAY';
  isAttachment?: boolean;
  attachmentName?: string;
  attachmentSize?: string;
};

type Thread = {
  id: string;
  investorName: string;
  role: string;
  timeAgo: string;
  unreadCount: number;
  preview: string;
  avatar: string;
  messages: ChatMessage[];
};

const initialThreads: Thread[] = [
  {
    id: 'james-1',
    investorName: 'James Mango',
    role: 'Accountant',
    timeAgo: '2s ago',
    unreadCount: 5,
    preview: 'Hello, I need your help for tax document',
    avatar: '/images/messages-person/Ellipse 12.png',
    messages: [
      {
        id: 'm-1',
        sender: 'investor',
        text: "Hi, I've completed my investment setup. Can you please check if everything looks good from your side?",
        time: '1:15 PM',
        day: 'YESTERDAY',
      },
      {
        id: 'm-2',
        sender: 'accountant',
        text: "Hello! Yes, I’m reviewing your documents now. Everything looks mostly complete.",
        time: '9:30 AM',
        day: 'TODAY',
      },
      {
        id: 'm-3',
        sender: 'investor',
        text: 'Great 👍 Is there anything else you need from me?',
        time: '9:32 AM',
        day: 'TODAY',
      },
      {
        id: 'm-4',
        sender: 'accountant',
        text: 'Just one thing, I need clarification on the source of funds document. Are you available for meeting?',
        time: '9:33 AM',
        day: 'TODAY',
      },
      {
        id: 'm-5',
        sender: 'investor',
        text: 'Yes',
        time: '9:34 AM',
        day: 'TODAY',
      },
      {
        id: 'm-6',
        sender: 'accountant',
        text: 'Sounds good. I will share link',
        time: '9:36 AM',
        day: 'TODAY',
      },
      {
        id: 'm-7',
        sender: 'accountant',
        text: '(Let’s connect to discuss the Q3 report in more details)\nMonday, 8 December - 10:15 – 11:15am\nTime zone: USA\nGoogle Meet joining info\nVideo call link: https://meet.google.com',
        time: '9:40 AM',
        day: 'TODAY',
      },
      {
        id: 'm-8',
        sender: 'investor',
        text: '',
        time: '9:41 AM',
        day: 'TODAY',
        isAttachment: true,
        attachmentName: 'address proof.jpg',
        attachmentSize: '2.1 MB',
      },
    ],
  },
  {
    id: 'james-2',
    investorName: 'James Mango',
    role: 'Accountant',
    timeAgo: '2m ago',
    unreadCount: 2,
    preview: 'I added some new documents.',
    avatar: '/images/messages-person/Ellipse 13.png',
    messages: [],
  },
  {
    id: 'james-3',
    investorName: 'James Mango',
    role: 'Accountant',
    timeAgo: '2h ago',
    unreadCount: 0,
    preview: 'I have invest in new funds.',
    avatar: '/images/messages-person/Ellipse 14.png',
    messages: [],
  },
  {
    id: 'james-4',
    investorName: 'James Mango',
    role: 'Accountant',
    timeAgo: '5h ago',
    unreadCount: 0,
    preview: 'Hi, I\'m not able to join meeting today.',
    avatar: '/images/messages-person/Ellipse 15.png',
    messages: [],
  },
  {
    id: 'james-5',
    investorName: 'James Mango',
    role: 'Accountant',
    timeAgo: 'Yesterday',
    unreadCount: 0,
    preview: 'Are you available for the meeting?',
    avatar: '/images/messages-person/Ellipse 16.png',
    messages: [],
  },
  {
    id: 'james-6',
    investorName: 'James Mango',
    role: 'Accountant',
    timeAgo: 'Yesterday',
    unreadCount: 0,
    preview: 'Good, i will send new document',
    avatar: '/images/messages-person/Ellipse 17.png',
    messages: [],
  },
  {
    id: 'james-7',
    investorName: 'James Mango',
    role: 'Accountant',
    timeAgo: '1 day ago',
    unreadCount: 0,
    preview: 'I will send document.',
    avatar: '/images/messages-person/Ellipse 18.png',
    messages: [],
  },
  {
    id: 'james-8',
    investorName: 'James Mango',
    role: 'Accountant',
    timeAgo: '2days ago',
    unreadCount: 0,
    preview: 'Hello',
    avatar: '/images/messages-person/Ellipse 19.png',
    messages: [],
  },
];

export function AssignedInvestorsMessagesScreen() {
  const [threads, setThreads] = useState<Thread[]>(initialThreads);
  const [activeThreadId, setActiveThreadId] = useState(initialThreads[0].id);
  const [search, setSearch] = useState('');
  const [messageInput, setMessageInput] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const photoInputRef = useRef<HTMLInputElement | null>(null);
  const documentInputRef = useRef<HTMLInputElement | null>(null);

  const filteredThreads = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return threads;
    return threads.filter(
      (thread) =>
        thread.investorName.toLowerCase().includes(query) ||
        thread.preview.toLowerCase().includes(query),
    );
  }, [threads, search]);

  const activeThread = threads.find((thread) => thread.id === activeThreadId) ?? threads[0];

  const sendMessage = () => {
    const text = messageInput.trim();
    if (!text || !activeThread) return;

    const now = new Date();
    const time = now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

    setThreads((prev) =>
      prev.map((thread) => {
        if (thread.id !== activeThread.id) return thread;
        return {
          ...thread,
          preview: text,
          timeAgo: 'Now',
          messages: [
            ...thread.messages,
            {
              id: `msg-${Date.now()}`,
              sender: 'investor',
              text,
              time,
              day: 'TODAY',
            },
          ],
        };
      }),
    );
    setMessageInput('');
    setShowMenu(false);
  };

  const appendAttachmentMessage = (fileName: string, sizeLabel: string) => {
    if (!activeThread) return;

    const now = new Date();
    const time = now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

    setThreads((prev) =>
      prev.map((thread) => {
        if (thread.id !== activeThread.id) return thread;
        return {
          ...thread,
          preview: fileName,
          timeAgo: 'Now',
          messages: [
            ...thread.messages,
            {
              id: `attach-${Date.now()}`,
              sender: 'investor',
              text: '',
              time,
              day: 'TODAY',
              isAttachment: true,
              attachmentName: fileName,
              attachmentSize: sizeLabel,
            },
          ],
        };
      }),
    );
  };

  const handleFilePicked = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const sizeInMb = file.size / (1024 * 1024);
    const sizeLabel = `${sizeInMb.toFixed(1)} MB`;
    appendAttachmentMessage(file.name, sizeLabel);
    setShowMenu(false);
    event.target.value = '';
  };

  const handleScheduleMeeting = () => {
    if (!activeThread) return;

    const now = new Date();
    const time = now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    const meetingText =
      '(Let’s connect to discuss the Q3 report in more details)\nMonday, 8 December - 10:15 – 11:15am\nTime zone: USA\nGoogle Meet joining info\nVideo call link: https://meet.google.com';

    setThreads((prev) =>
      prev.map((thread) => {
        if (thread.id !== activeThread.id) return thread;
        return {
          ...thread,
          preview: 'Meeting schedule shared',
          timeAgo: 'Now',
          messages: [
            ...thread.messages,
            {
              id: `meeting-${Date.now()}`,
              sender: 'investor',
              text: meetingText,
              time,
              day: 'TODAY',
            },
          ],
        };
      }),
    );
    setShowMenu(false);
  };

  const groupedMessages = useMemo(() => {
    if (!activeThread) return { YESTERDAY: [] as ChatMessage[], TODAY: [] as ChatMessage[] };
    return {
      YESTERDAY: activeThread.messages.filter((message) => message.day === 'YESTERDAY'),
      TODAY: activeThread.messages.filter((message) => message.day === 'TODAY'),
    };
  }, [activeThread]);

  return (
    <div className="mx-auto max-w-8xl px-2 font-helvetica text-[#1F1F1F]">
      <h1 className="font-goudy font-bold text-[26px] leading-8 text-[#1F1F1F]">Messages</h1>

      <div className="mt-3 grid gap-3 lg:grid-cols-[320px_minmax(0,1fr)]">
        <section className="rounded-[8px] bg-white p-3">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#A2A5AA]" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              type="text"
              placeholder="Search messages here"
              className="h-[38px] w-full rounded-full bg-[#F5F5F5] pl-10 pr-3 text-[12px] text-[#1F1F1F] outline-none placeholder:text-[#A2A5AA]"
            />
          </label>

          <div className="mt-3 divide-y divide-[#ECEDEF]">
            {filteredThreads.map((thread) => {
              const selected = thread.id === activeThreadId;
              return (
                <button
                  key={thread.id}
                  type="button"
                  onClick={() => {
                    setActiveThreadId(thread.id);
                    setShowMenu(false);
                  }}
                  className={`flex w-full items-start gap-3 px-1 py-3 text-left ${selected ? 'bg-[#FAFBFD]' : ''}`}
                >
                  <img
                    src={thread.avatar}
                    alt={thread.investorName}
                    className="h-8 w-8 shrink-0 rounded-full object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-[12px] font-semibold text-[#1F1F1F]">{thread.investorName}</p>
                      <p className="text-[10px] text-[#A2A5AA]">{thread.timeAgo}</p>
                    </div>
                    <div className="mt-1 flex items-center justify-between gap-2">
                      <p className="truncate text-[11px] text-[#6F7177]">{thread.preview}</p>
                      {thread.unreadCount > 0 && (
                        <span className="inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#DBF5E8] px-1 text-[9px] font-semibold text-[#16A66A]">
                          {thread.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        <section className="rounded-[8px] bg-white p-3">
          {activeThread && (
            <>
              <div className="flex items-center gap-3 border-b border-[#ECEDEF] pb-2">
                <img
                  src={activeThread.avatar}
                  alt={activeThread.investorName}
                  className="h-8 w-8 rounded-full object-cover"
                />
                <div>
                  <p className="text-[12px] font-semibold text-[#1F1F1F]">{activeThread.investorName}</p>
                  <p className="text-[10px] text-[#A2A5AA]">{activeThread.role}</p>
                </div>
              </div>

              <div className="relative mt-3 h-[460px] overflow-y-auto pr-1">
                <div className="text-center text-[10px] tracking-wide text-[#A2A5AA]">YESTERDAY</div>
                <div className="mt-2 space-y-2">
                  {groupedMessages.YESTERDAY.map((message) => (
                    <div key={message.id}>
                      <div className={`${message.sender === 'investor' ? 'mr-auto bg-[#EAF0FF]' : 'ml-auto bg-[#F5F5F5]'} max-w-[72%] rounded-[4px] px-3 py-2 text-[11px] text-[#1F1F1F]`}>
                        {message.text}
                      </div>
                      <p className={`mt-1 text-[9px] text-[#A2A5AA] ${message.sender === 'investor' ? 'text-left' : 'text-right'}`}>
                        {message.time}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mt-3 text-center text-[10px] tracking-wide text-[#A2A5AA]">TODAY</div>
                <div className="mt-2 space-y-2">
                  {groupedMessages.TODAY.map((message) => (
                    <div key={message.id}>
                      {message.isAttachment ? (
                        <div className="mr-auto max-w-[72%] rounded-[6px] bg-[#EAF0FF] p-2">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <div className="inline-flex h-7 w-7 items-center justify-center rounded-[3px] bg-[#F46F7A] text-white">📄</div>
                              <div>
                                <p className="text-[11px] text-[#1F1F1F]">{message.attachmentName}</p>
                                <p className="text-[10px] text-[#A2A5AA]">{message.attachmentSize}</p>
                              </div>
                            </div>
                            <button type="button" className="text-[12px] text-[#6C6F75]">↻</button>
                          </div>
                        </div>
                      ) : (
                        <div className={`${message.sender === 'investor' ? 'mr-auto bg-[#EAF0FF]' : 'ml-auto bg-[#F5F5F5]'} max-w-[72%] rounded-[4px] px-3 py-2 text-[11px] whitespace-pre-line text-[#1F1F1F]`}>
                          {message.text}
                        </div>
                      )}
                      <p className={`mt-1 text-[9px] text-[#A2A5AA] ${message.sender === 'investor' ? 'text-left' : 'text-right'}`}>
                        {message.time}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="relative mt-3 border-t border-[#ECEDEF] pt-3">
                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFilePicked}
                />
                <input
                  ref={documentInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.csv,.jpg,.jpeg,.png"
                  className="hidden"
                  onChange={handleFilePicked}
                />

                {showMenu && (
                  <button
                    type="button"
                    className="fixed inset-0 z-[5]"
                    aria-label="Close actions"
                    onClick={() => setShowMenu(false)}
                  />
                )}

                {showMenu && (
                  <div className="absolute bottom-[52px] left-0 z-10 w-[190px] rounded-[6px] border border-[#ECEDEF] bg-white py-1 shadow-[0_10px_24px_rgba(0,0,0,0.08)]">
                    <button
                      type="button"
                      onClick={() => photoInputRef.current?.click()}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-[12px] text-[#4B4B4B] hover:bg-[#F8F8F8]"
                    >
                      <ImageIcon className="h-4 w-4 text-[#6D7380]" /> Photos
                    </button>
                    <button
                      type="button"
                      onClick={() => documentInputRef.current?.click()}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-[12px] text-[#4B4B4B] hover:bg-[#F8F8F8]"
                    >
                      <FileText className="h-4 w-4 text-[#6D7380]" /> Upload Documents
                    </button>
                    <button
                      type="button"
                      onClick={handleScheduleMeeting}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-[12px] text-[#4B4B4B] hover:bg-[#F8F8F8]"
                    >
                      <CalendarDays className="h-4 w-4 text-[#6D7380]" /> Schedule Meeting
                    </button>
                  </div>
                )}

                <div className="flex items-center gap-2 rounded-[8px] border border-[#E5E5EA] px-3 py-2">
                  <button
                    type="button"
                    onClick={() => setShowMenu((prev) => !prev)}
                    className="text-[#9CA1AA]"
                  >
                    <PlusCircle className="h-4 w-4" />
                  </button>
                  <input
                    value={messageInput}
                    onChange={(event) => setMessageInput(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') sendMessage();
                    }}
                    placeholder="Type a message here ..."
                    className="h-7 w-full bg-transparent text-[12px] outline-none placeholder:text-[#B1B3B8]"
                  />
                  <button
                    type="button"
                    onClick={sendMessage}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#FBCB4B] text-[#4B4B4B]"
                  >
                    <SendHorizontal className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
