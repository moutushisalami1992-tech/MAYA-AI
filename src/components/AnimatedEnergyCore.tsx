import React, { useEffect, useState } from 'react';
import { Mic, MicOff, Power, Sparkles, Volume2, AlertCircle, Loader2 } from 'lucide-react';
import { SessionState } from '../services/audio/LiveSession';

interface AnimatedEnergyCoreProps {
  state: SessionState;
  onToggle: () => void;
  userAnalyser: AnalyserNode | null;
  mayaAnalyser: AnalyserNode | null;
  hapticsEnabled?: boolean;
}

export const AnimatedEnergyCore: React.FC<AnimatedEnergyCoreProps> = ({
  state,
  onToggle,
  userAnalyser,
  mayaAnalyser,
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

  const isConnected =
    state === 'listening' || state === 'speaking' || state === 'thinking';
  const pulseScale = 1 + audioLevel * 0.4;

  return (
    <div className="relative flex flex-col items-center justify-center my-auto py-3 select-none">
      {/* Outer Rotating Energy Rings */}
      <div className="relative flex items-center justify-center">
        {/* Ambient Cyan/Purple Bloom Background */}
        <div
          className={`absolute rounded-full transition-all duration-700 blur-3xl pointer-events-none ${
            state === 'speaking'
              ? 'w-64 h-64 sm:w-80 sm:h-80 bg-gradient-to-tr from-purple-600/40 via-pink-600/35 to-cyan-500/30 scale-125'
              : state === 'listening'
              ? 'w-60 h-60 sm:w-72 sm:h-72 bg-gradient-to-tr from-cyan-500/40 via-blue-600/30 to-purple-600/30 scale-110'
              : state === 'thinking'
              ? 'w-56 h-56 sm:w-68 sm:h-68 bg-gradient-to-tr from-purple-500/30 via-indigo-500/25 to-pink-500/20 animate-pulse'
              : state === 'error'
              ? 'w-48 h-48 sm:w-60 sm:h-60 bg-red-600/25'
              : 'w-44 h-44 sm:w-56 sm:h-56 bg-purple-950/20'
          }`}
          style={{
            transform: isConnected ? `scale(${pulseScale * 1.12})` : undefined,
          }}
        />

        {/* Outer Particle Ring 1 (Clockwise Rotation) */}
        <div
          className={`absolute rounded-full border border-dashed transition-all duration-500 pointer-events-none ${
            state === 'speaking'
              ? 'w-56 h-56 sm:w-68 sm:h-68 border-pink-400/50 animate-[spin_8s_linear_infinite]'
              : state === 'listening'
              ? 'w-52 h-52 sm:w-64 sm:h-64 border-cyan-400/50 animate-[spin_6s_linear_infinite]'
              : state === 'thinking'
              ? 'w-52 h-52 sm:w-64 sm:h-64 border-purple-400/60 animate-[spin_4s_linear_infinite]'
              : 'w-48 h-48 sm:w-56 sm:h-56 border-purple-500/15 animate-[spin_20s_linear_infinite]'
          }`}
        />

        {/* Counter-Rotating Concentric Ring 2 */}
        <div
          className={`absolute rounded-full border transition-all duration-700 pointer-events-none ${
            state === 'speaking'
              ? 'w-48 h-48 sm:w-60 sm:h-60 border-purple-400/40 animate-[spin_10s_linear_infinite_reverse]'
              : state === 'listening'
              ? 'w-44 h-44 sm:w-56 sm:h-56 border-cyan-300/40 animate-[spin_8s_linear_infinite_reverse]'
              : state === 'thinking'
              ? 'w-44 h-44 sm:w-56 sm:h-56 border-pink-400/40 animate-[spin_6s_linear_infinite_reverse]'
              : 'w-40 h-40 sm:w-48 sm:h-48 border-cyan-500/10 animate-[spin_25s_linear_infinite_reverse]'
          }`}
          style={{
            transform: isConnected ? `scale(${pulseScale * 1.05})` : undefined,
          }}
        />

        {/* Central Circular Core Sphere */}
        <button
          type="button"
          onClick={handlePress}
          title={isConnected ? 'কথা শেষ করতে ট্যাপ করুন' : 'মায়াকে সক্রিয় করতে ট্যাপ করুন'}
          className={`relative z-10 w-32 h-32 sm:w-40 sm:h-40 rounded-full flex flex-col items-center justify-center transition-all duration-500 shadow-2xl cursor-pointer group select-none active:scale-95 ${
            state === 'speaking'
              ? 'bg-gradient-to-br from-purple-600 via-pink-600 to-indigo-800 shadow-pink-600/50 ring-4 ring-pink-400/50'
              : state === 'listening'
              ? 'bg-gradient-to-br from-cyan-600 via-blue-600 to-purple-700 shadow-cyan-500/50 ring-4 ring-cyan-400/60'
              : state === 'thinking'
              ? 'bg-gradient-to-br from-purple-700 via-indigo-600 to-pink-600 shadow-purple-500/40 ring-4 ring-purple-400/50 animate-pulse'
              : state === 'connecting'
              ? 'bg-gradient-to-br from-purple-800 via-pink-700 to-indigo-900 shadow-purple-500/30 animate-pulse ring-4 ring-purple-400/30'
              : state === 'error'
              ? 'bg-neutral-900 border-2 border-red-500/60 text-red-400 ring-2 ring-red-500/30'
              : 'bg-neutral-900/90 border-2 border-purple-500/40 hover:border-cyan-400/60 hover:bg-neutral-850 shadow-black/90'
          }`}
          style={{
            transform: isConnected ? `scale(${pulseScale})` : undefined,
          }}
        >
          {/* Inner Holographic Specular Highlight */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-t from-transparent via-white/10 to-white/25 pointer-events-none" />

          {/* Core Visual Elements */}
          <div className="relative z-10 flex flex-col items-center justify-center">
            {state === 'speaking' ? (
              <Volume2 className="w-8 h-8 sm:w-10 sm:h-10 text-white animate-pulse" />
            ) : state === 'listening' ? (
              <Mic className="w-8 h-8 sm:w-10 sm:h-10 text-white animate-bounce" />
            ) : state === 'thinking' ? (
              <Loader2 className="w-8 h-8 sm:w-10 sm:h-10 text-purple-200 animate-spin" />
            ) : state === 'connecting' ? (
              <Sparkles className="w-8 h-8 sm:w-10 sm:h-10 text-pink-300 animate-spin" />
            ) : state === 'error' ? (
              <AlertCircle className="w-8 h-8 sm:w-10 sm:h-10 text-red-400 animate-pulse" />
            ) : (
              <Power className="w-8 h-8 sm:w-10 sm:h-10 text-purple-300 group-hover:text-cyan-300 group-hover:scale-110 transition-all duration-300" />
            )}

            <span className="text-[10px] sm:text-[11px] font-semibold tracking-wider uppercase mt-1.5 text-white/95">
              {state === 'speaking'
                ? 'কথা বলছে'
                : state === 'listening'
                ? 'শুনছি...'
                : state === 'thinking'
                ? 'ভাবছি...'
                : state === 'connecting'
                ? 'সংযোগ হচ্ছে...'
                : state === 'error'
                ? 'পুনরায় চেষ্টা'
                : 'মায়াকে ডাকুন'}
            </span>
          </div>
        </button>
      </div>

      {/* Real-Time Bengali Status Cue */}
      <div className="mt-4 text-center space-y-1 z-10 px-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-900/90 border border-purple-500/25 text-xs font-medium backdrop-blur-md shadow-lg shadow-purple-950/20">
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
                : 'bg-neutral-600'
            }`}
          />
          <span className="text-neutral-200 text-[11px] font-medium">
            {state === 'speaking'
              ? 'মায়া উত্তর দিচ্ছে'
              : state === 'listening'
              ? 'মায়া মনোযোগ দিয়ে শুনছে'
              : state === 'thinking'
              ? 'উত্তর প্রস্তুত করা হচ্ছে...'
              : state === 'connecting'
              ? 'জেমিনি লাইভে যুক্ত হচ্ছে...'
              : state === 'error'
              ? 'সংযোগ সমস্যা'
              : 'কথা বলতে বৃত্তটিতে ট্যাপ করুন'}
          </span>
        </div>
      </div>
    </div>
  );
};
