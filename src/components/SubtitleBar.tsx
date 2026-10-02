import React from 'react';
import { Sparkles, User } from 'lucide-react';

interface SubtitleBarProps {
  lastMayaSpeech: string;
  lastUserSpeech: string;
  isSpeaking: boolean;
  isThinking?: boolean;
}

export const SubtitleBar: React.FC<SubtitleBarProps> = ({
  lastMayaSpeech,
  lastUserSpeech,
  isSpeaking,
  isThinking = false,
}) => {
  if (!lastMayaSpeech && !lastUserSpeech && !isThinking) return null;

  return (
    <div className="w-full max-w-lg mx-auto px-4 z-20 transition-all duration-300">
      <div className="p-3 rounded-2xl bg-neutral-900/90 border border-purple-500/25 backdrop-blur-xl shadow-2xl shadow-purple-950/30 space-y-1.5 text-xs">
        {lastUserSpeech && (
          <div className="flex items-start gap-2 text-neutral-400">
            <span className="text-[10px] font-mono uppercase bg-neutral-800 border border-neutral-700/60 px-1.5 py-0.5 rounded text-neutral-300 shrink-0 mt-0.5 flex items-center gap-1">
              <User className="w-2.5 h-2.5" />
              You
            </span>
            <p className="italic truncate text-neutral-300">{lastUserSpeech}</p>
          </div>
        )}

        {isThinking && (
          <div className="flex items-center gap-2 text-purple-300">
            <span className="w-2 h-2 rounded-full bg-purple-400 animate-ping" />
            <span className="text-xs">Maya AI is formulating answer...</span>
          </div>
        )}

        {lastMayaSpeech && (
          <div className="flex items-start gap-2 text-pink-200">
            <span className="text-[10px] font-mono uppercase bg-purple-900/40 text-pink-300 border border-pink-500/30 px-1.5 py-0.5 rounded shrink-0 mt-0.5 flex items-center gap-1">
              <Sparkles className="w-2.5 h-2.5 text-pink-400" />
              Maya 2.0
            </span>
            <p
              className={`leading-relaxed transition-colors ${
                isSpeaking ? 'text-white font-medium' : 'text-neutral-300'
              }`}
            >
              {lastMayaSpeech}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
