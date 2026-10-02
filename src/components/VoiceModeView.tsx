import React from 'react';
import { Mic, MicOff, RefreshCw, Volume2, Sparkles, AlertCircle } from 'lucide-react';
import { SessionState } from '../services/audio/LiveSession';
import { AnimatedEnergyCore } from './AnimatedEnergyCore';
import { WaveformVisualizer } from './WaveformVisualizer';
import { SubtitleBar } from './SubtitleBar';

interface VoiceModeViewProps {
  sessionState: SessionState;
  onToggleVoice: () => void;
  userAnalyser: AnalyserNode | null;
  mayaAnalyser: AnalyserNode | null;
  lastMayaSpeech: string;
  lastUserSpeech: string;
  onQuickPrompt: (prompt: string) => void;
  errorMessage: string | null;
  hapticsEnabled?: boolean;
}

export const VoiceModeView: React.FC<VoiceModeViewProps> = ({
  sessionState,
  onToggleVoice,
  userAnalyser,
  mayaAnalyser,
  lastMayaSpeech,
  lastUserSpeech,
  onQuickPrompt,
  errorMessage,
  hapticsEnabled,
}) => {
  const isConnected =
    sessionState === 'listening' ||
    sessionState === 'speaking' ||
    sessionState === 'thinking';

  const banglaStarters = [
    '“আজকের দিনটি কেমন যাবে?”',
    '“আমাকে একটি সুন্দর গল্প শোনাও”',
    '“ইউটিউবে রিল্যাক্সিং গান চালাও”',
    '“কোয়ান্টাম ফিজিক্স সহজ করে বোঝাও”',
  ];

  return (
    <div className="flex-1 flex flex-col justify-between overflow-y-auto px-4 py-3 max-w-xl mx-auto w-full z-10 space-y-4">
      {/* Top Voice Mode Banner */}
      <div className="text-center pt-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-950/60 border border-purple-500/30 text-xs text-pink-300 font-medium">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>রিয়েল-টাইম বাংলা ভয়েস ইন্টারঅ্যাকশন</span>
        </div>
        <p className="text-xs text-neutral-400 mt-1.5">
          মায়ার সাথে সরাসরি মুখে কথা বলুন, সে সাবলীল বাংলায় উত্তর দেবে
        </p>
      </div>

      {/* Error alert if any */}
      {errorMessage && (
        <div className="px-4 py-2 rounded-xl bg-red-500/15 border border-red-500/40 text-red-200 text-xs flex items-center gap-2 max-w-md mx-auto">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Animated Core */}
      <div className="flex-1 flex flex-col items-center justify-center my-auto">
        <AnimatedEnergyCore
          state={sessionState}
          onToggle={onToggleVoice}
          userAnalyser={userAnalyser}
          mayaAnalyser={mayaAnalyser}
          hapticsEnabled={hapticsEnabled}
        />

        {/* 60fps Real-Time Audio-Reactive Waveform Visualizer */}
        <div className="w-full flex justify-center mt-3">
          <WaveformVisualizer
            analyser={
              sessionState === 'speaking'
                ? mayaAnalyser
                : sessionState === 'listening'
                ? userAnalyser
                : null
            }
            isActive={isConnected}
            colorScheme={
              sessionState === 'speaking'
                ? 'speaking'
                : sessionState === 'listening'
                ? 'listening'
                : sessionState === 'thinking'
                ? 'thinking'
                : 'idle'
            }
          />
        </div>
      </div>

      {/* Spoken Subtitle Bar */}
      <div className="w-full">
        <SubtitleBar
          lastMayaSpeech={lastMayaSpeech}
          lastUserSpeech={lastUserSpeech}
          isSpeaking={sessionState === 'speaking'}
          isThinking={sessionState === 'thinking'}
        />
      </div>

      {/* Bengali Voice Starter Suggestions */}
      {!isConnected && (
        <div className="space-y-2">
          <p className="text-center text-[11px] text-neutral-400">
            মুখে বলার জন্য কিছু উদাহরণ:
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {banglaStarters.map((s, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => onQuickPrompt(s.replace(/[“”]/g, ''))}
                className="px-3 py-1.5 rounded-full bg-neutral-900/90 border border-purple-500/25 hover:border-pink-500/40 text-[11px] text-neutral-300 font-medium active:scale-95 transition-all shadow-xs"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Voice Control Buttons */}
      <div className="flex items-center justify-center gap-4 pt-2">
        <button
          type="button"
          onClick={onToggleVoice}
          className={`px-6 py-2.5 rounded-2xl font-semibold text-xs flex items-center gap-2 transition-all active:scale-95 shadow-lg ${
            isConnected
              ? 'bg-red-500/20 text-red-300 border border-red-500/40 hover:bg-red-500/30 shadow-red-500/20'
              : 'bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 text-white shadow-pink-500/25 hover:opacity-95'
          }`}
        >
          {isConnected ? (
            <>
              <MicOff className="w-4 h-4" />
              <span>ভয়েস বন্ধ করুন</span>
            </>
          ) : (
            <>
              <Mic className="w-4 h-4" />
              <span>ভয়েস চালু করুন</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
