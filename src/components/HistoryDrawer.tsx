import React, { useState } from 'react';
import {
  X,
  MessageSquare,
  Plus,
  Trash2,
  Edit2,
  Check,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { ChatSession } from '../types';

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: ChatSession[];
  currentSessionId: string;
  onSelectSession: (id: string) => void;
  onNewSession: () => void;
  onDeleteSession: (id: string) => void;
  onRenameSession: (id: string, newTitle: string) => void;
  onClearAll: () => void;
}

export const HistoryDrawer: React.FC<HistoryDrawerProps> = ({
  isOpen,
  onClose,
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

  if (!isOpen) return null;

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
    <div className="fixed inset-0 z-50 flex justify-end bg-black/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-sm h-full bg-neutral-900 border-l border-purple-500/25 flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="p-4 border-b border-neutral-800 bg-neutral-950/70 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-pink-400" />
            <h3 className="font-bold text-white text-sm">Conversation History</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action: New Session */}
        <div className="p-3 border-b border-neutral-800">
          <button
            type="button"
            onClick={() => {
              onNewSession();
              onClose();
            }}
            className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-purple-600/30 to-pink-600/30 border border-purple-500/40 hover:border-pink-400 text-pink-200 font-semibold text-xs flex items-center justify-center gap-2 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Start New Session</span>
          </button>
        </div>

        {/* Sessions List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {sessions.length === 0 ? (
            <div className="text-center py-12 text-neutral-500 text-xs">
              <Sparkles className="w-6 h-6 mx-auto mb-2 text-neutral-600" />
              <span>No saved conversations yet.</span>
            </div>
          ) : (
            sessions.map((s) => (
              <div
                key={s.id}
                onClick={() => {
                  onSelectSession(s.id);
                  onClose();
                }}
                className={`p-3 rounded-2xl border text-xs cursor-pointer transition-all flex items-start justify-between gap-2 group ${
                  s.id === currentSessionId
                    ? 'bg-purple-950/40 border-pink-500/60 text-white shadow-md shadow-pink-500/10'
                    : 'bg-neutral-950/60 border-neutral-800/80 text-neutral-300 hover:border-purple-500/30 hover:bg-neutral-900'
                }`}
              >
                <div className="flex-1 min-w-0">
                  {editingId === s.id ? (
                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="w-full bg-neutral-900 border border-purple-500 rounded px-2 py-1 text-white text-xs outline-none"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={(e) => handleSaveRename(s.id, e)}
                        className="p-1 text-pink-400 hover:text-white"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <p className="font-semibold truncate text-neutral-100">
                        {s.title || 'Untitled Session'}
                      </p>
                      <div className="flex items-center gap-2 mt-1 text-[10px] text-neutral-400">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-2.5 h-2.5" />
                          {new Date(s.createdAt).toLocaleDateString([], {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                        <span>•</span>
                        <span>{s.messages.length} messages</span>
                      </div>
                    </>
                  )}
                </div>

                {editingId !== s.id && (
                  <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100">
                    <button
                      type="button"
                      onClick={(e) => handleStartRename(s, e)}
                      title="Rename"
                      className="p-1 rounded text-neutral-400 hover:text-white"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteSession(s.id);
                      }}
                      title="Delete"
                      className="p-1 rounded text-neutral-400 hover:text-red-400"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {sessions.length > 0 && (
          <div className="p-3 border-t border-neutral-800 bg-neutral-950/70">
            <button
              type="button"
              onClick={() => {
                if (confirm('Clear all conversation history?')) {
                  onClearAll();
                }
              }}
              className="w-full py-2 text-center text-xs text-red-400 hover:text-red-300 font-medium transition-colors"
            >
              Clear All Sessions
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
