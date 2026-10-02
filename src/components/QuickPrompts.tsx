import React from 'react';
import { Sparkles } from 'lucide-react';

interface QuickPromptsProps {
  onSelectPrompt?: (prompt: string) => void;
}

export const QuickPrompts: React.FC<QuickPromptsProps> = ({ onSelectPrompt }) => {
  const prompts = [
    { text: 'হোয়াটসঅ্যাপ খোলো (WhatsApp)', lang: 'BN' },
    { text: 'Explain quantum physics simply', lang: 'EN' },
    { text: 'आज का दिन कैसा रहेगा?', lang: 'HI' },
    { text: 'Open YouTube for music', lang: 'EN' },
    { text: 'মাকে ফোন করো (Call Mom)', lang: 'BN' },
    { text: 'Write a quick productive note', lang: 'EN' },
  ];

  return (
    <div className="w-full max-w-lg mx-auto px-4 z-10">
      <div className="flex items-center gap-1.5 justify-center mb-2 text-xs text-purple-300/80 font-medium">
        <Sparkles className="w-3.5 h-3.5 text-pink-400" />
        <span>Spoken Voice & Text Starters</span>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2">
        {prompts.map((p, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => onSelectPrompt?.(p.text.split('(')[0].trim())}
            className="px-3 py-1.5 rounded-full bg-neutral-900/90 border border-purple-500/20 text-[11px] text-neutral-300 font-medium shadow-xs hover:border-pink-500/50 hover:text-pink-200 hover:bg-neutral-850 active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
          >
            <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-purple-950/60 text-purple-300 border border-purple-800/40">
              {p.lang}
            </span>
            <span>{p.text}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
