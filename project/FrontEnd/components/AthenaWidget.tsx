'use client';

import { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Loader2, Maximize2, Minimize2, Send, X } from 'lucide-react';
import { apiClient } from '@/lib/api/client';

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
let cachedAgentMessages: Array<{ sender: 'user' | 'agent'; text: string; timestamp: string }> = [
  {
    sender: 'agent',
    text: 'Hello! I am Athena, your Executive Assistant AI Agent. Ask me anything about your portal or database!',
    timestamp: 'Just now'
  }
];

export function AthenaWidget() {
  const [isAgentOpen, setIsAgentOpen] = useState(cachedIsAgentOpen);
  const [agentInput, setAgentInput] = useState('');
  const [agentMessages, setAgentMessages] = useState(cachedAgentMessages);
  const [isAgentThinking, setIsAgentThinking] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Sync state changes back to the cache variables
  useEffect(() => {
    cachedIsAgentOpen = isAgentOpen;
  }, [isAgentOpen]);

  useEffect(() => {
    cachedAgentMessages = agentMessages;
  }, [agentMessages]);

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
      console.error('Error querying CRM AI Agent:', err);
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
      {/* Collapsible & Expandable Floating OpenAI Athena Widget */}
      {!isAgentOpen ? (
        /* Collapsed Pill Button in Bottom Right */
        <button
          onClick={() => setIsAgentOpen(true)}
          className="fixed right-4 bottom-4 sm:right-6 sm:bottom-6 z-50 bg-[#1F1F1F] hover:bg-[#2D2D2D] text-white p-3.5 px-5 rounded-full shadow-2xl border border-gray-700 flex items-center gap-3 transition-all transform hover:scale-105 group cursor-pointer"
          title="Open Athena AI Agent"
        >
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#FFC63F] to-[#F1B92E] flex items-center justify-center text-[#1F1F1F] dark:text-gray-100 font-bold shadow-md shrink-0">
            <AthenaIcon className="w-5 h-5 text-[#1F1F1F] dark:text-gray-100" />
          </div>
          <div className="text-left pr-1">
            <div className="text-[13px] font-bold text-white flex items-center gap-1.5 leading-tight">
              Athena
              <span className="w-2 h-2 rounded-full bg-[#FFC63F] animate-pulse" />
            </div>
            <div className="text-[11px] text-gray-400">Ask AI Agent</div>
          </div>
          <div className="w-7 h-7 rounded-full bg-[#1C1C1C]/10 group-hover:bg-[#1C1C1C]/20 flex items-center justify-center text-gray-300 transition-colors ml-1">
            <Maximize2 className="w-3.5 h-3.5" />
          </div>
        </button>
      ) : (
        /* Expanded Floating Chat Drawer Window */
        <div className="fixed right-4 bottom-4 sm:right-6 sm:bottom-6 z-50 w-[calc(100vw-2rem)] sm:w-[400px] h-[580px] max-h-[85vh] bg-[#1F1F1F] rounded-[24px] text-white shadow-2xl border border-gray-800 flex flex-col justify-between overflow-hidden transition-all duration-300">
          {/* Header with Collapse Controls */}
          <div className="p-4 bg-[#181818] border-b border-gray-800 flex items-center justify-between gap-2 shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#FFC63F] to-[#F1B92E] flex items-center justify-center text-[#1F1F1F] dark:text-gray-100 font-bold shadow-md shrink-0">
                <AthenaIcon className="w-5 h-5 text-[#1F1F1F] dark:text-gray-100" />
              </div>
              <div className="min-w-0">
                <h3 className="font-goudy text-[16px] font-bold text-white flex items-center gap-2 flex-wrap leading-snug">
                  Athena
                  <span className="text-[9px] font-bold uppercase tracking-wider bg-[#FFC63F]/20 text-[#FFC63F] px-2 py-0.5 rounded-full border border-[#FFC63F]/40">
                    AI Assistant
                  </span>
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => setAgentMessages([{
                  sender: 'agent',
                  text: 'Hello! I am Athena, your Executive Assistant AI Agent. Ask me anything about your portal or database!',
                  timestamp: 'Just now'
                }])}
                className="text-[11px] text-gray-400 hover:text-white transition-colors px-2 py-1 rounded hover:bg-[#1C1C1C]/10 cursor-pointer"
                title="Clear Chat"
              >
                Clear
              </button>
              <button
                onClick={() => setIsAgentOpen(false)}
                className="w-7 h-7 rounded-full bg-[#1C1C1C]/10 hover:bg-[#1C1C1C]/20 flex items-center justify-center text-gray-300 hover:text-white transition-all cursor-pointer"
                title="Minimize Assistant"
              >
                <Minimize2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setIsAgentOpen(false)}
                className="w-7 h-7 rounded-full bg-[#1C1C1C]/10 hover:bg-[#1C1C1C]/20 flex items-center justify-center text-gray-300 hover:text-white transition-all cursor-pointer"
                title="Close Assistant"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Scrollable Chat Body */}
          <div className="p-4 flex-1 overflow-y-auto space-y-3 custom-scrollbar">
            {agentMessages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[90%] px-4 py-3 rounded-[16px] text-[13px] leading-relaxed ${msg.sender === 'user'
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
                <span className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 px-1">{msg.timestamp}</span>
              </div>
            ))}
            {isAgentThinking && (
              <div className="flex items-center gap-2 text-gray-400 text-[13px] py-2">
                <Loader2 className="w-4 h-4 animate-spin text-[#FFC63F]" />
                <span>AI Agent querying database & transcripts...</span>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Quick Prompts & Footer Input */}
          <div className="p-4 pt-2 border-t border-gray-800/80 bg-[#181818] shrink-0">
            <div className="flex flex-wrap gap-1.5 mb-3">
              <span className="text-[10px] font-bold text-gray-400 py-0.5">Quick prompts:</span>
              {[
                'Show interested doctors',
                'Find missing investments',
                'What is the pipeline?'
              ].map((chip, idx) => (
                <button
                  key={idx}
                  onClick={() => handleAgentSend(chip)}
                  className="text-[10px] font-medium bg-[#1C1C1C]/5 hover:bg-[#1C1C1C]/15 text-gray-300 px-2.5 py-1 rounded-full border border-white/10 transition-colors cursor-pointer"
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
                placeholder="Ask AI Agent anything..."
                className="flex-1 bg-black/50 border border-gray-700 rounded-[20px] px-4 py-2.5 text-[13px] text-white placeholder-gray-500 focus:outline-none focus:border-[#FFC63F] transition-all resize-none min-h-[40px] max-h-[120px] overflow-y-auto dark-scrollbar leading-relaxed"
              />
              <button
                type="submit"
                disabled={!agentInput.trim() || isAgentThinking}
                className="w-10 h-10 rounded-full bg-[#FFC63F] hover:bg-[#F1B92E] text-[#1F1F1F] dark:text-gray-100 flex items-center justify-center font-bold shadow-md transition-all disabled:opacity-50 shrink-0 cursor-pointer mb-[1px]"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
