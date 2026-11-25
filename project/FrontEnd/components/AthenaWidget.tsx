'use client';

import { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Loader2, Send, X } from 'lucide-react';
import { apiClient } from '@/lib/api/client';
import { useAuth } from '@/lib/contexts/AuthContext';

const AthenaIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    {/* Professional girl avatar */}
    <circle cx="12" cy="8" r="4" />
    <path d="M8 6.5C8 3.5 9.8 2 12 2s4 1.5 4 4.5" />
    <path d="M8.2 7c-.9 2-1.2 4.5-.7 7.5" />
    <path d="M15.8 7c.9 2 1.2 4.5.7 7.5" />
    <path d="M6 20a6 6 0 0 1 12 0" />
  </svg>
);

// Cache variables outside the component so they survive unmounts during internal navigation,
// but get wiped automatically when the user performs a hard browser refresh.
let cachedIsAgentOpen = false;
let cachedAgentMessages: Array<{ sender: 'user' | 'agent'; text: string; timestamp: string }> | null = null;

export function AthenaWidget() {
  const { user } = useAuth();
  const isInvestor = user?.role?.trim().toLowerCase() === 'investor';

  const defaultGreeting = isInvestor
    ? 'Hello! I am Athena, your AI Investment Assistant. Ask me anything about your portfolio, investments, documents, or how to invest!'
    : 'Hello! I am Athena, your Executive Assistant AI Agent. Ask me anything about your portal or database!';

  const quickPrompts = isInvestor
    ? [
      'My portfolio summary',
      'How do I invest?',
      'My recent investments',
      'How does redemption work?'
    ]
    : [
      'Show interested doctors',
      'Find missing investments',
      'What is the pipeline?'
    ];

  const [isAgentOpen, setIsAgentOpen] = useState(cachedIsAgentOpen);
  const [agentInput, setAgentInput] = useState('');
  const [agentMessages, setAgentMessages] = useState<Array<{ sender: 'user' | 'agent'; text: string; timestamp: string }>>(() => {
    if (cachedAgentMessages && cachedAgentMessages.length > 0) {
      return cachedAgentMessages;
    }
    return [{
      sender: 'agent',
      text: defaultGreeting,
      timestamp: 'Just now'
    }];
  });
  const [isAgentThinking, setIsAgentThinking] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Sync state changes back to the cache variables
  useEffect(() => {
    cachedIsAgentOpen = isAgentOpen;
  }, [isAgentOpen]);

  useEffect(() => {
    cachedAgentMessages = agentMessages;
  }, [agentMessages]);

  // Adjust greeting if role changes and there is only 1 message
  useEffect(() => {
    if (agentMessages.length === 1 && agentMessages[0].sender === 'agent') {
      if (agentMessages[0].text !== defaultGreeting) {
        setAgentMessages([{
          sender: 'agent',
          text: defaultGreeting,
          timestamp: 'Just now'
        }]);
      }
    }
  }, [defaultGreeting]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [agentMessages, isAgentThinking]);

  const handleAgentSend = async (queryText: string) => {
    if (!queryText.trim()) return;

    const newMsg = {
      sender: 'user' as const,
      text: queryText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setAgentMessages(prev => [...prev, newMsg]);
    setAgentInput('');
    setIsAgentThinking(true);

    try {
      const res = await apiClient.queryAthena(queryText);
      const responseText = res && res.success ? res.reply : 'Sorry, I failed to get a response from the server.';
      setAgentMessages(prev => [
        ...prev,
        {
          sender: 'agent',
          text: responseText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } catch (err: any) {
      console.error('Error querying Athena AI Agent:', err);
      setAgentMessages(prev => [
        ...prev,
        {
          sender: 'agent',
          text: `An error occurred: ${err.message || 'Unknown error'}. Please try again.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsAgentThinking(false);
    }
  };

  return (
    <>
      {/* Collapsed Pill Button in Bottom Right */}
      <button
        onClick={() => setIsAgentOpen(true)}
        className={`fixed right-4 bottom-4 sm:right-6 sm:bottom-6 z-50 bg-[#1F1F1F] hover:bg-[#2D2D2D] text-white py-2.5 px-3.5 sm:px-4 rounded-full shadow-2xl border border-gray-700 flex items-center gap-2 transition-all duration-300 transform group cursor-pointer whitespace-nowrap ${
          isAgentOpen
            ? 'opacity-0 scale-90 pointer-events-none translate-y-4'
            : 'opacity-100 scale-100 pointer-events-auto translate-y-0 hover:scale-105'
        }`}
        title={isInvestor ? "Open Athena Investment Assistant" : "Open Athena AI Agent"}
      >
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#FFC63F] to-[#F1B92E] flex items-center justify-center text-[#1F1F1F] font-bold shadow-md shrink-0">
          <AthenaIcon className="w-4 h-4 text-[#1F1F1F]" />
        </div>
        <div className="flex items-center gap-1.5 text-[13px] leading-none">
          <span className="font-bold text-white flex items-center gap-1.5">
            Athena:
            <span className="w-1.5 h-1.5 rounded-full bg-[#FFC63F] animate-pulse" />
          </span>
          <span className="text-gray-300 font-medium">
            {isInvestor ? 'Investment Assistant' : 'Ask AI Agent'}
          </span>
        </div>
      </button>

      {/* Docked Athena Side Panel with Smooth Slide Transition */}
      <aside
        className={`fixed inset-y-0 right-0 z-40 sm:relative sm:inset-auto sm:z-20 h-full shrink-0 bg-[#181818] border-l border-gray-200 dark:border-gray-800 flex flex-col justify-between overflow-hidden shadow-2xl transition-all duration-300 ease-in-out ${
          isAgentOpen
            ? 'w-full sm:w-[350px] opacity-100 border-l pointer-events-auto'
            : 'w-0 opacity-0 border-l-0 pointer-events-none'
        }`}
      >
        <div className="w-screen sm:w-[350px] h-full flex flex-col justify-between shrink-0">
          {/* Header */}
          <div className="p-4 bg-[#141414] border-b border-gray-800 flex items-center justify-between gap-2 shrink-0 select-none">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#FFC63F] to-[#F1B92E] flex items-center justify-center text-[#1F1F1F] font-bold shadow-md shrink-0">
                <AthenaIcon className="w-5 h-5 text-[#1F1F1F]" />
              </div>
              <div className="min-w-0">
                <h3 className="font-goudy text-[17px] font-bold text-white flex items-center gap-2 flex-wrap leading-snug">
                  Athena
                  <span className="text-[10px] font-semibold uppercase tracking-wider bg-[#FFC63F]/20 text-[#FFC63F] px-2 py-0.5 rounded-full border border-[#FFC63F]/40">
                    {isInvestor ? 'Investment Assistant' : 'AI Assistant'}
                  </span>
                </h3>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsAgentOpen(false)}
              className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title="Close Athena panel"
              aria-label="Close Athena panel"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Scrollable Chat Body */}
          <div className="p-4 flex-1 overflow-y-auto space-y-3 custom-scrollbar">
            {agentMessages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[90%] px-4 py-3 rounded-[16px] text-[14.5px] leading-relaxed ${msg.sender === 'user'
                    ? 'bg-[#FFC63F] text-[#1F1F1F] font-semibold rounded-br-none shadow-sm'
                    : 'bg-[#1C1C1C]/10 text-gray-200 rounded-bl-none border border-white/10 [&>p]:mb-2 last:[&>p]:mb-0 [&_strong]:font-bold [&_em]:italic [&_ul]:list-disc [&_ul]:ml-4 [&_ol]:list-decimal [&_ol]:ml-4 [&_a]:text-blue-400 [&_a]:underline'
                    }`}
                >
                  {msg.sender === 'user' ? (
                    msg.text
                  ) : (
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {msg.text}
                    </ReactMarkdown>
                  )}
                </div>
                <span className="text-[11px] text-gray-400 mt-1 px-1">{msg.timestamp}</span>
              </div>
            ))}
            {isAgentThinking && (
              <div className="flex items-center gap-2 text-gray-400 text-[14px] py-2">
                <Loader2 className="w-4 h-4 animate-spin text-[#FFC63F]" />
                <span>{isInvestor ? 'Athena looking up your investment details...' : 'AI Agent querying database & transcripts...'}</span>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Quick Prompts & Footer Input */}
          <div className="p-4 pt-2 border-t border-gray-800/80 bg-[#141414] shrink-0">
            <div className="flex flex-wrap gap-1.5 mb-3">
              <span className="text-[11px] font-semibold text-gray-400 py-0.5">Quick prompts:</span>
              {quickPrompts.map((chip, idx) => (
                <button
                  key={idx}
                  onClick={() => handleAgentSend(chip)}
                  className="text-[11.5px] font-medium bg-[#1C1C1C]/5 hover:bg-[#1C1C1C]/15 text-gray-300 px-3 py-1 rounded-full border border-white/10 transition-colors cursor-pointer"
                >
                  {chip}
                </button>
              ))}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleAgentSend(agentInput);
                const textarea = e.currentTarget.querySelector('textarea');
                if (textarea) textarea.style.height = '40px';
              }}
              className="flex items-end gap-2"
            >
              <textarea
                value={agentInput}
                onChange={(e) => {
                  setAgentInput(e.target.value);
                  e.target.style.height = '40px';
                  e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    if (agentInput.trim() && !isAgentThinking) {
                      handleAgentSend(agentInput);
                      e.currentTarget.style.height = '40px';
                    }
                  }
                }}
                rows={1}
                placeholder={isInvestor ? "Ask Athena about your investments, steps to invest..." : "Ask AI Agent anything..."}
                className="flex-1 bg-black/50 border border-gray-700 rounded-[20px] px-4 py-2.5 text-[14px] text-white placeholder-gray-500 focus:outline-none focus:border-[#FFC63F] transition-all resize-none min-h-[40px] max-h-[120px] overflow-y-auto dark-scrollbar leading-relaxed"
              />
              <button
                type="submit"
                disabled={!agentInput.trim() || isAgentThinking}
                className="w-10 h-10 rounded-full bg-[#FFC63F] hover:bg-[#F1B92E] text-[#1F1F1F] flex items-center justify-center font-bold shadow-md transition-all disabled:opacity-50 shrink-0 cursor-pointer mb-[1px]"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </aside>
    </>
  );
}
