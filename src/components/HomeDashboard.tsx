import React from 'react';
import {
  Sparkles,
  Mic,
  MessageSquare,
  Youtube,
  MessageCircle,
  HelpCircle,
  Phone,
  Flame,
  Globe,
  Radio,
} from 'lucide-react';
import { SessionState } from '../services/audio/LiveSession';
import { AnimatedEnergyCore } from './AnimatedEnergyCore';

interface HomeDashboardProps {
  sessionState: SessionState;
  onToggleVoice: () => void;
  onNavigateTab: (tab: 'home' | 'chat' | 'voice' | 'history' | 'settings') => void;
  onQuickPrompt: (prompt: string) => void;
  userAnalyser: AnalyserNode | null;
  mayaAnalyser: AnalyserNode | null;
  hapticsEnabled?: boolean;
}

export const HomeDashboard: React.FC<HomeDashboardProps> = ({
  sessionState,
  onToggleVoice,
  onNavigateTab,
  onQuickPrompt,
  userAnalyser,
  mayaAnalyser,
  hapticsEnabled,
}) => {
  const isOnline = sessionState !== 'disconnected' && sessionState !== 'error';

  return (
    <div className="flex-1 flex flex-col justify-between overflow-y-auto px-4 py-2 sm:px-6 max-w-xl mx-auto w-full z-10 space-y-4">
      {/* 1. Main Welcome & Futuristic Sci-Fi Avatar Section */}
      <div className="relative rounded-3xl bg-neutral-900/70 border border-purple-500/25 p-4 sm:p-5 backdrop-blur-xl shadow-2xl shadow-purple-950/40 overflow-hidden">
        {/* Ambient Glows */}
        <div className="absolute top-0 right-0 w-36 h-36 bg-purple-600/15 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-36 h-36 bg-cyan-600/15 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center gap-4 relative z-10">
          {/* Sci-Fi Maya Avatar with Glowing Rings */}
          <div className="relative shrink-0">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border-2 border-purple-500/50 shadow-xl shadow-purple-600/30 bg-neutral-950 ring-2 ring-cyan-400/20">
              <img
                src="/src/assets/images/maya_scifi_avatar_1790927648541.jpg"
                alt="Maya AI Character"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>
            {/* Status indicator badge */}
            <span
              className={`absolute -bottom-1 -right-1 px-2 py-0.5 rounded-full text-[9px] font-medium border flex items-center gap-1 ${
                isOnline
                  ? 'bg-emerald-950/90 text-emerald-400 border-emerald-500/40 shadow-xs shadow-emerald-500/20'
                  : 'bg-neutral-900/90 text-neutral-400 border-neutral-700/60'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isOnline ? 'bg-emerald-400 animate-ping' : 'bg-neutral-500'
                }`}
              />
              <span>{isOnline ? 'অনলাইন' : 'অফলাইন'}</span>
            </span>
          </div>

          {/* Bengali Welcome Greeting & Intro */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-purple-950/60 text-pink-300 border border-purple-500/30 flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5 text-cyan-400" />
                মায়া এআই ২.০ প্রিমিয়াম
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-white tracking-tight leading-snug">
              হ্যালো! আমি মায়া, তোমার ব্যক্তিগত এআই অ্যাসিস্ট্যান্ট।
            </h2>
            <p className="text-[11px] text-neutral-300/90 mt-1 leading-relaxed">
              তোমার কথা শুনতে, প্রশ্নের উত্তর দিতে এবং দৈনন্দিন কাজে সাহায্য করতে আমি প্রস্তুত।
            </p>
          </div>
        </div>
      </div>

      {/* 2. Central Animated Energy Core */}
      <div className="relative py-2 flex flex-col items-center justify-center">
        <AnimatedEnergyCore
          state={sessionState}
          onToggle={onToggleVoice}
          userAnalyser={userAnalyser}
          mayaAnalyser={mayaAnalyser}
          hapticsEnabled={hapticsEnabled}
        />
      </div>

      {/* 3. Quick Action Bengali Cards */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-neutral-400 px-1">
          <span className="font-semibold text-neutral-300 flex items-center gap-1.5">
            <Flame className="w-3.5 h-3.5 text-pink-400" />
            <span>দ্রুত অ্যাকশন ও কাজ</span>
          </span>
          <button
            type="button"
            onClick={() => onNavigateTab('chat')}
            className="text-[11px] text-cyan-400 hover:text-cyan-300"
          >
            সব দেখুন →
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <button
            type="button"
            onClick={() => onNavigateTab('voice')}
            className="p-3 rounded-2xl bg-neutral-900/80 border border-purple-500/20 hover:border-pink-500/40 text-left transition-all hover:bg-neutral-850 active:scale-95 group shadow-sm shadow-purple-950/20"
          >
            <div className="w-8 h-8 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <Mic className="w-4 h-4 text-pink-400" />
            </div>
            <p className="font-semibold text-neutral-100">ভয়েসে কথা বলুন</p>
            <p className="text-[10px] text-neutral-400 mt-0.5">
              সরাসরি বাংলা লাইভ অডিও কথোপকথন
            </p>
          </button>

          <button
            type="button"
            onClick={() => onNavigateTab('chat')}
            className="p-3 rounded-2xl bg-neutral-900/80 border border-purple-500/20 hover:border-cyan-500/40 text-left transition-all hover:bg-neutral-850 active:scale-95 group shadow-sm shadow-purple-950/20"
          >
            <div className="w-8 h-8 rounded-xl bg-cyan-600/20 border border-cyan-500/30 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <MessageSquare className="w-4 h-4 text-cyan-400" />
            </div>
            <p className="font-semibold text-neutral-100">টেক্সট চ্যাট করুন</p>
            <p className="text-[10px] text-neutral-400 mt-0.5">
              লিখে প্রশ্ন বা আদেশ দিন
            </p>
          </button>

          <button
            type="button"
            onClick={() => onQuickPrompt('ইউটিউব খোলো')}
            className="p-3 rounded-2xl bg-neutral-900/80 border border-purple-500/20 hover:border-red-500/40 text-left transition-all hover:bg-neutral-850 active:scale-95 group shadow-sm shadow-purple-950/20"
          >
            <div className="w-8 h-8 rounded-xl bg-red-600/20 border border-red-500/30 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <Youtube className="w-4 h-4 text-red-400" />
            </div>
            <p className="font-semibold text-neutral-100">ইউটিউব চালান</p>
            <p className="text-[10px] text-neutral-400 mt-0.5">
              গান বা ভিডিও উপভোগ করুন
            </p>
          </button>

          <button
            type="button"
            onClick={() => onQuickPrompt('জাওয়াদের সাথে যোগাযোগ করতে চাই')}
            className="col-span-2 p-3 rounded-2xl bg-gradient-to-r from-purple-950/40 via-neutral-900 to-pink-950/30 border border-purple-500/30 hover:border-pink-500/50 text-left transition-all hover:bg-neutral-850 active:scale-95 group shadow-sm flex items-center justify-between"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-pink-500/20 border border-pink-500/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Sparkles className="w-4 h-4 text-pink-400" />
              </div>
              <div>
                <p className="font-semibold text-neutral-100 flex items-center gap-1.5">
                  <span>ক্রিয়েটর ও ওনার: জাওয়াদ</span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-pink-500/20 text-pink-300 font-mono">
                    Owner
                  </span>
                </p>
                <p className="text-[10px] text-neutral-400">
                  জাওয়াদের সাথে WhatsApp-এ যোগাযোগের জন্য ট্যাপ করুন
                </p>
              </div>
            </div>
            <span className="text-xs text-pink-400 font-medium px-2 py-1 rounded-lg bg-pink-500/10 border border-pink-500/20">
              যোগাযোগ →
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
