import React from 'react';
import { ExternalLink, Sparkles, X } from 'lucide-react';
import { ToolCallEvent } from '../services/audio/LiveSession';

interface ActionToastProps {
  action: ToolCallEvent | null;
  onDismiss: () => void;
}

export const ActionToast: React.FC<ActionToastProps> = ({ action, onDismiss }) => {
  if (!action) return null;

  return (
    <div className="fixed top-20 inset-x-4 max-w-sm mx-auto z-50 animate-in fade-in slide-in-from-top-4 duration-300">
      <div className="p-3.5 rounded-2xl bg-neutral-900/95 border border-pink-500/40 shadow-2xl shadow-pink-500/20 backdrop-blur-xl flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5 truncate">
          <div className="w-8 h-8 rounded-xl bg-pink-500/20 border border-pink-500/40 flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4 text-pink-400" />
          </div>
          <div className="truncate">
            <p className="font-semibold text-neutral-100 truncate">
              {action.message}
            </p>
            <p className="text-[11px] text-neutral-400 font-mono">
              Action: {action.name}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {action.url && (
            <a
              href={action.url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded-lg bg-pink-500/20 hover:bg-pink-500/30 text-pink-300 flex items-center gap-1 text-[11px] font-medium"
            >
              <span>View</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
          <button
            type="button"
            onClick={onDismiss}
            className="p-1 text-neutral-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
