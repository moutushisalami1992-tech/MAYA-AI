import React, { useEffect, useState } from 'react';
import { Mic, MicOff, Power, Sparkles, Volume2, AlertCircle, Loader2 } from 'lucide-react';
import { SessionState } from '../services/audio/LiveSession';

interface VoiceCoreProps {
  state: SessionState;
  onToggle: () => void;
  userAnalyser: AnalyserNode | null;
  mayaAnalyser: AnalyserNode | null;
  errorMessage?: string | null;
  hapticsEnabled?: boolean;
}

export const VoiceCore: React.FC<VoiceCoreProps> = ({
  state,
  onToggle,
  userAnalyser,
  mayaAnalyser,
  errorMessage,
  hapticsEnabled = true,
}) => {
  const [audioLevel, setAudioLevel] = useState<number>(0);

  // Monitor live audio level for organic pulse animation
  useEffect(() => {
    let animId: number;
    const activeAnalyser =
      state === 'speaking' ? mayaAnalyser : state === 'listening' ? userAnalyser : null;
    const data = new Uint8Array(32);

    const checkLevel = () => {
      if (activeAnalyser && (state === 'speaking' || state === 'listening')) {
        activeAnalyser.getByteFrequencyData(data);
        let sum = 0;
        for (let i = 0; i < data.length; i++) {
          sum += data[i];
        }
        const avg = sum / data.length / 255;
        setAudioLevel(avg);
      } else {
        setAudioLevel(0);
      }
      animId = requestAnimationFrame(checkLevel);
    };

    checkLevel();
    return () => cancelAnimationFrame(animId);
  }, [state, userAnalyser, mayaAnalyser]);

  const handlePress = () => {
    if (hapticsEnabled && typeof window !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate([15, 30]);
      } catch (e) {
        // ignore
      }
    }
    onToggle();
  };

  const isConnected = state === 'listening' || state === 'speaking' || state === 'thinking';
  const pulseScale = 1 + audioLevel * 0.35;

  return (
    <div className="relative flex flex-col items-center justify-center my-auto py-4">
      {/* Outer Glow Halo Rings */}
      <div className="relative flex items-center justify-center">
        {/* Ambient Bloom Background */}
        <div
          className={`absolute rounded-full transition-all duration-700 blur-3xl pointer-events-none ${
            state === 'speaking'
              ? 'w-72 h-72 sm:w-96 sm:h-96 bg-gradient-to-tr from-purple-700/50 via-pink-600/40 to-indigo-800/40 scale-125'
              : state === 'listening'
              ? 'w-64 h-64 sm:w-84 sm:h-84 bg-gradient-to-tr from-cyan-600/35 via-purple-600/30 to-pink-500/30 scale-110'
              : state === 'thinking'
              ? 'w-64 h-64 sm:w-80 sm:h-80 bg-gradient-to-tr from-purple-500/30 via-pink-500/25 to-amber-500/20 animate-pulse'
              : state === 'connecting'
              ? 'w-56 h-56 sm:w-72 sm:h-72 bg-purple-600/25 animate-pulse'
              : state === 'error'
              ? 'w-52 h-52 sm:w-64 sm:h-64 bg-red-600/25'
              : 'w-48 h-48 sm:w-60 sm:h-60 bg-purple-950/20'
          }`}
          style={{
            transform: isConnected ? `scale(${pulseScale * 1.12})` : undefined,
          }}
        />

        {/* Dynamic Concentric Rings */}
        <div
          className={`absolute rounded-full border transition-all duration-300 pointer-events-none ${
            state === 'speaking'
              ? 'w-64 h-64 sm:w-80 sm:h-80 border-pink-500/30 animate-ping opacity-25'
              : state === 'listening'
              ? 'w-60 h-60 sm:w-76 sm:h-76 border-cyan-400/30 animate-pulse'
              : state === 'thinking'
              ? 'w-56 h-56 sm:w-72 sm:h-72 border-purple-400/30 animate-spin border-dashed'
              : 'w-52 h-52 sm:w-64 sm:h-64 border-purple-500/10'
          }`}
        />

        <div
          className={`absolute rounded-full border transition-all duration-500 pointer-events-none ${
            state === 'speaking'
              ? 'w-56 h-56 sm:w-70 sm:h-70 border-purple-400/40'
              : state === 'listening'
              ? 'w-52 h-52 sm:w-64 sm:h-64 border-pink-400/40'
              : state === 'thinking'
              ? 'w-48 h-48 sm:w-60 sm:h-60 border-purple-500/40'
              : 'w-44 h-44 sm:w-56 sm:h-56 border-purple-900/20'
          }`}
          style={{
            transform: isConnected ? `scale(${pulseScale * 1.05})` : undefined,
          }}
        />

        {/* Central Core Button */}
        <button
          type="button"
          onClick={handlePress}
          title={isConnected ? 'Tap to end session' : 'Tap to wake Maya AI'}
          className={`relative z-10 w-36 h-36 sm:w-44 sm:h-44 rounded-full flex flex-col items-center justify-center transition-all duration-500 shadow-2xl cursor-pointer group select-none active:scale-95 ${
            state === 'speaking'
              ? 'bg-gradient-to-br from-purple-600 via-pink-600 to-indigo-800 shadow-pink-600/50 ring-4 ring-pink-400/50'
              : state === 'listening'
              ? 'bg-gradient-to-br from-cyan-600 via-purple-600 to-pink-700 shadow-cyan-500/40 ring-4 ring-cyan-400/50'
              : state === 'thinking'
              ? 'bg-gradient-to-br from-purple-700 via-indigo-600 to-pink-600 shadow-purple-500/40 ring-4 ring-purple-400/50 animate-pulse'
              : state === 'connecting'
              ? 'bg-gradient-to-br from-purple-800 via-pink-700 to-indigo-900 shadow-purple-500/30 animate-pulse ring-4 ring-purple-400/30'
              : state === 'error'
              ? 'bg-neutral-900 border-2 border-red-500/50 text-red-400 ring-2 ring-red-500/20'
              : 'bg-neutral-900 border-2 border-purple-900/60 hover:border-pink-500/50 hover:bg-neutral-850 shadow-black/90'
          }`}
          style={{
            transform: isConnected ? `scale(${pulseScale})` : undefined,
          }}
        >
          {/* Inner Gloss Light Reflection */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-t from-transparent via-white/10 to-white/20 pointer-events-none" />

          {/* Core Icon */}
          <div className="relative z-10 flex flex-col items-center justify-center">
            {state === 'speaking' ? (
              <Volume2 className="w-10 h-10 sm:w-12 sm:h-12 text-white animate-pulse" />
            ) : state === 'listening' ? (
              <Mic className="w-10 h-10 sm:w-12 sm:h-12 text-white animate-bounce" />
            ) : state === 'thinking' ? (
              <Loader2 className="w-10 h-10 sm:w-12 sm:h-12 text-purple-200 animate-spin" />
            ) : state === 'connecting' ? (
              <Sparkles className="w-10 h-10 sm:w-12 sm:h-12 text-pink-300 animate-spin" />
            ) : state === 'error' ? (
              <AlertCircle className="w-10 h-10 sm:w-12 sm:h-12 text-red-400 animate-pulse" />
            ) : (
              <Power className="w-10 h-10 sm:w-12 sm:h-12 text-purple-300 group-hover:text-pink-300 group-hover:scale-110 transition-all duration-300" />
            )}

            <span className="text-[11px] font-semibold tracking-wider uppercase mt-2 text-white/90">
              {state === 'speaking'
                ? 'Speaking'
                : state === 'listening'
                ? 'Listening'
                : state === 'thinking'
                ? 'Thinking...'
                : state === 'connecting'
                ? 'Connecting...'
                : state === 'error'
                ? 'Retry'
                : 'Wake Maya'}
            </span>
          </div>
        </button>
      </div>

      {/* State Text & Witty Cue */}
      <div className="mt-6 text-center space-y-1.5 z-10 px-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-neutral-900/90 border border-purple-500/20 text-xs font-medium backdrop-blur-md">
          <span
            className={`w-2 h-2 rounded-full ${
              state === 'speaking'
                ? 'bg-pink-400 animate-pulse'
                : state === 'listening'
                ? 'bg-cyan-400 animate-ping'
                : state === 'thinking'
                ? 'bg-purple-400 animate-spin'
                : state === 'connecting'
                ? 'bg-amber-400 animate-pulse'
                : state === 'error'
                ? 'bg-red-400'
                : 'bg-neutral-500'
            }`}
          />
          <span className="text-neutral-200 font-mono tracking-wide text-[11px] uppercase">
            {state === 'speaking'
              ? 'Maya is speaking'
              : state === 'listening'
              ? 'Listening (English, বাংলা, हिन्दी)'
              : state === 'thinking'
              ? 'Processing request'
              : state === 'connecting'
              ? 'Connecting to Gemini Live'
              : state === 'error'
              ? 'Connection Issue'
              : 'Tap to Wake Maya AI 2.0'}
          </span>
        </div>

        <p className="text-xs text-neutral-400 max-w-xs mx-auto font-medium leading-relaxed">
          {state === 'speaking'
            ? 'Speak over Maya anytime — she seamlessly yields and listens.'
            : state === 'listening'
            ? 'Speak in Bengali, Hindi, English, or Hinglish naturally.'
            : state === 'thinking'
            ? 'Formulating clear and relevant answer...'
            : state === 'connecting'
            ? 'Establishing encrypted Live audio channel...'
            : state === 'error'
            ? (errorMessage || 'Connection failed. Please check mic permissions and retry.')
            : 'Intelligent, natural real-time voice assistant.'}
        </p>
      </div>
    </div>
  );
};
