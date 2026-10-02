import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Mic,
  MicOff,
  Sparkles,
  User,
  Bot,
  ExternalLink,
  Loader2,
  Trash2,
  Plus,
} from 'lucide-react';
import { Message } from '../types';
import { SessionState } from '../services/audio/LiveSession';

interface BengaliChatViewProps {
  messages: Message[];
  onSendMessage: (text: string) => void;
  sessionState: SessionState;
  onToggleVoice: () => void;
  isGenerating: boolean;
  onNewChat: () => void;
  onClearChat: () => void;
}

export const BengaliChatView: React.FC<BengaliChatViewProps> = ({
  messages,
  onSendMessage,
  sessionState,
  onToggleVoice,
  isGenerating,
  onNewChat,
  onClearChat,
}) => {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isGenerating]);

  const handleSend = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputText.trim() || isGenerating) return;
    onSendMessage(inputText.trim());
    setInputText('');
  };

  const isVoiceActive =
    sessionState === 'listening' ||
    sessionState === 'speaking' ||
    sessionState === 'thinking';

  return (
    <div className="flex-1 flex flex-col justify-between overflow-hidden max-w-xl mx-auto w-full z-10 px-3 sm:px-4 py-2">
      {/* Chat Top Bar */}
      <div className="flex items-center justify-between py-2 border-b border-purple-500/20 px-2 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-purple-600/30 border border-purple-500/40 flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-pink-400" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-white">মায়া কথোপকথন</h3>
            <p className="text-[10px] text-neutral-400">
              {messages.length}টি বার্তা সংরক্ষিত
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onNewChat}
            title="নতুন চ্যাট"
            className="p-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white hover:border-purple-500/40 text-xs flex items-center gap-1 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">নতুন</span>
          </button>
          {messages.length > 0 && (
            <button
              type="button"
              onClick={onClearChat}
              title="চ্যাট মুছুন"
              className="p-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-red-400 hover:border-red-500/40 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Messages List */}
      <div className="flex-1 overflow-y-auto py-3 space-y-3 px-1">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-neutral-400 space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-purple-950/40 border border-purple-500/30 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-pink-400" />
            </div>
            <p className="font-semibold text-neutral-200 text-sm">
              কথোপকথন শুরু করুন
            </p>
            <p className="text-xs max-w-xs text-neutral-400 leading-relaxed">
              মায়াকে যেকোনো প্রশ্ন করুন, সে প্রাঞ্জল বাংলাদেশি বাংলায় উত্তর দেবে।
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={msg.id}
                className={`flex gap-2.5 items-end ${
                  isUser ? 'justify-end' : 'justify-start'
                }`}
              >
                {!isUser && (
                  <div className="w-7 h-7 rounded-xl bg-purple-950 border border-purple-500/40 flex items-center justify-center shrink-0 mb-1">
                    <Bot className="w-3.5 h-3.5 text-pink-400" />
                  </div>
                )}

                <div
                  className={`max-w-[82%] sm:max-w-[75%] rounded-2xl p-3 text-xs leading-relaxed space-y-1 shadow-md ${
                    isUser
                      ? 'bg-gradient-to-r from-purple-700 to-indigo-700 text-white rounded-br-xs'
                      : 'bg-neutral-900/90 border border-purple-500/25 text-neutral-100 rounded-bl-xs backdrop-blur-md'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>

                  {/* Executed Tools Actions if any */}
                  {msg.executedActions && msg.executedActions.length > 0 && (
                    <div className="pt-1.5 space-y-1">
                      {msg.executedActions.map((act) => (
                        <div
                          key={act.id}
                          className="p-1.5 rounded-lg bg-black/40 border border-purple-500/20 text-[11px] text-pink-300 flex items-center justify-between gap-2"
                        >
                          <span className="truncate">অ্যাকশন: {act.message}</span>
                          {act.fallbackUrl && (
                            <a
                              href={act.fallbackUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-cyan-400 hover:underline shrink-0 flex items-center gap-0.5"
                            >
                              <span>দেখুন</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  <span className="block text-[9px] text-white/50 text-right font-mono">
                    {new Date(msg.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>

                {isUser && (
                  <div className="w-7 h-7 rounded-xl bg-neutral-800 border border-neutral-700 flex items-center justify-center shrink-0 mb-1">
                    <User className="w-3.5 h-3.5 text-neutral-300" />
                  </div>
                )}
              </div>
            );
          })
        )}

        {/* Loading Indicator */}
        {isGenerating && (
          <div className="flex gap-2.5 items-end justify-start">
            <div className="w-7 h-7 rounded-xl bg-purple-950 border border-purple-500/40 flex items-center justify-center shrink-0">
              <Bot className="w-3.5 h-3.5 text-pink-400" />
            </div>
            <div className="p-3 rounded-2xl bg-neutral-900/90 border border-purple-500/25 text-xs text-purple-300 flex items-center gap-2 rounded-bl-xs">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-pink-400" />
              <span>মায়া চিন্তা করছে...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Field & Mic Control */}
      <form
        onSubmit={handleSend}
        className="pt-2 relative flex items-center gap-2 shrink-0"
      >
        <div className="relative flex-1 flex items-center gap-2 bg-neutral-900/90 border border-purple-500/30 rounded-2xl p-1.5 focus-within:border-pink-500/60 focus-within:ring-2 focus-within:ring-purple-500/20 backdrop-blur-xl transition-all shadow-xl shadow-purple-950/30">
          {/* Quick Voice Mic */}
          <button
            type="button"
            onClick={onToggleVoice}
            title={isVoiceActive ? 'ভয়েস বন্ধ করুন' : 'ভয়েস চালু করুন'}
            className={`p-2 rounded-xl transition-all shrink-0 cursor-pointer ${
              isVoiceActive
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md shadow-pink-500/30 animate-pulse'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
            }`}
          >
            {isVoiceActive ? (
              <MicOff className="w-4 h-4" />
            ) : (
              <Mic className="w-4 h-4" />
            )}
          </button>

          {/* Bengali Placeholder Text Input */}
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="এখানে লিখে মায়াকে জিজ্ঞাসা করো..."
            className="flex-1 bg-transparent text-xs sm:text-sm text-neutral-100 placeholder-neutral-500 outline-none px-2 py-1 leading-normal"
          />

          {/* Send Button */}
          <button
            type="submit"
            disabled={!inputText.trim() || isGenerating}
            title="বার্তা পাঠান"
            className={`p-2 rounded-xl transition-all shrink-0 ${
              inputText.trim() && !isGenerating
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md shadow-pink-500/25 active:scale-95 cursor-pointer'
                : 'bg-neutral-800/60 text-neutral-600 cursor-not-allowed'
            }`}
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
};
