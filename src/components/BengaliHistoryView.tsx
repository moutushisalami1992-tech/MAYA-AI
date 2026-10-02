import React, { useState } from 'react';
import {
  MessageSquare,
  Plus,
  Trash2,
  Edit2,
  Check,
  Calendar,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { ChatSession } from '../types';

interface BengaliHistoryViewProps {
  sessions: ChatSession[];
  currentSessionId: string;
  onSelectSession: (id: string) => void;
  onNewSession: () => void;
  onDeleteSession: (id: string) => void;
  onRenameSession: (id: string, newTitle: string) => void;
  onClearAll: () => void;
}

export const BengaliHistoryView: React.FC<BengaliHistoryViewProps> = ({
  sessions,
  currentSessionId,
  onSelectSession,
  onNewSession,
  onDeleteSession,
  onRenameSession,
  onClearAll,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const handleStartRename = (session: ChatSession, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(session.id);
    setEditTitle(session.title);
  };

  const handleSaveRename = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (editTitle.trim()) {
      onRenameSession(id, editTitle.trim());
    }
    setEditingId(null);
  };

  return (
    <div className="flex-1 flex flex-col justify-between overflow-y-auto px-4 py-3 max-w-xl mx-auto w-full z-10 space-y-4">
      {/* Top Banner */}
      <div className="flex items-center justify-between border-b border-purple-500/20 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-purple-600/30 border border-purple-500/40 flex items-center justify-center">
            <MessageSquare className="w-4 h-4 text-pink-400" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white">কথোপকথনের ইতিহাস</h2>
            <p className="text-[10px] text-neutral-400">
              পূর্ববর্তী চ্যাট দেখুন, পরিচালনা বা পরিষ্কার করুন
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onNewSession}
          className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium text-xs flex items-center gap-1.5 shadow-md shadow-pink-500/20 active:scale-95 transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>নতুন চ্যাট</span>
        </button>
      </div>

      {/* Sessions List */}
      <div className="flex-1 space-y-2.5 overflow-y-auto pr-1">
        {sessions.length === 0 ? (
          <div className="text-center py-16 text-neutral-500 text-xs space-y-2">
            <Sparkles className="w-8 h-8 mx-auto text-neutral-600" />
            <p className="font-semibold text-neutral-300">কোনো সংরক্ষিত ইতিহাস নেই</p>
            <p className="text-[11px] text-neutral-500">
              নতুন বার্তা প্রেরণ করলে স্বয়ংক্রিয়ভাবে এখানে সংরক্ষিত হবে।
            </p>
          </div>
        ) : (
          sessions.map((s) => (
            <div
              key={s.id}
              onClick={() => onSelectSession(s.id)}
              className={`p-3.5 rounded-2xl border text-xs cursor-pointer transition-all flex items-start justify-between gap-3 group ${
                s.id === currentSessionId
                  ? 'bg-purple-950/40 border-pink-500/60 text-white shadow-md shadow-pink-500/10'
                  : 'bg-neutral-900/80 border-purple-500/20 text-neutral-300 hover:border-purple-500/40 hover:bg-neutral-850'
              }`}
            >
              <div className="flex-1 min-w-0">
                {editingId === s.id ? (
                  <div
                    className="flex items-center gap-1.5"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="w-full bg-neutral-950 border border-purple-500 rounded-lg px-2.5 py-1 text-white text-xs outline-none"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={(e) => handleSaveRename(s.id, e)}
                      className="p-1 rounded bg-pink-600 text-white"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <>
                    <p className="font-semibold truncate text-neutral-100 text-sm">
                      {s.title || 'শিরোনামহীন চ্যাট'}
                    </p>
                    <div className="flex items-center gap-2 mt-1 text-[10px] text-neutral-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-2.5 h-2.5" />
                        {new Date(s.createdAt).toLocaleDateString('bn-BD', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                      <span>•</span>
                      <span>{s.messages.length}টি বার্তা</span>
                      {s.id === currentSessionId && (
                        <span className="px-1.5 py-0.2 rounded bg-pink-500/20 text-pink-300 border border-pink-500/30">
                          সক্রিয়
                        </span>
                      )}
                    </div>
                  </>
                )}
              </div>

              {editingId !== s.id && (
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={(e) => handleStartRename(s, e)}
                    title="নাম পরিবর্তন"
                    className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteSession(s.id);
                    }}
                    title="মুছুন"
                    className="p-1.5 rounded-lg text-neutral-400 hover:text-red-400 hover:bg-neutral-800"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Clear All Sessions */}
      {sessions.length > 0 && (
        <div className="pt-2">
          <button
            type="button"
            onClick={() => {
              if (confirm('আপনি কি নিশ্চিত যে সমস্ত কথোপকথন ইতিহাস মুছে ফেলতে চান?')) {
                onClearAll();
              }
            }}
            className="w-full py-2.5 text-center text-xs text-red-400 hover:text-red-300 font-medium transition-colors rounded-xl bg-red-500/10 border border-red-500/20"
          >
            সব ইতিহাস মুছে ফেলুন
          </button>
        </div>
      )}
    </div>
  );
};
