import React, { useState } from 'react';
import {
  FileText,
  Plus,
  Trash2,
  Sparkles,
  Search,
  Check,
  Copy,
  ArrowUpRight,
  Menu,
} from 'lucide-react';
import { NoteItem } from '../types';
import { runExecutiveTool } from '../services/api';

interface NotesViewProps {
  notes: NoteItem[];
  onAddNote: (note: Omit<NoteItem, 'id' | 'updatedAt'>) => void;
  onUpdateNote: (id: string, updates: Partial<NoteItem>) => void;
  onDeleteNote: (id: string) => void;
  onAskMayra: (prompt: string) => void;
  onToggleSidebarMobile: () => void;
}

export const NotesView: React.FC<NotesViewProps> = ({
  notes,
  onAddNote,
  onUpdateNote,
  onDeleteNote,
  onAskMayra,
  onToggleSidebarMobile,
}) => {
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(
    notes.length > 0 ? notes[0].id : null
  );
  const [search, setSearch] = useState('');
  const [isProcessingAI, setIsProcessingAI] = useState(false);
  const [copied, setCopied] = useState(false);

  const selectedNote = notes.find((n) => n.id === selectedNoteId) || null;

  const filteredNotes = notes.filter(
    (n) =>
      n.title.toLowerCase().includes(search.toLowerCase()) ||
      n.content.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreateNote = () => {
    const newNote = {
      title: 'Untitled Note',
      content: '',
      tags: ['Ideas'],
    };
    onAddNote(newNote);
  };

  const handleAIAction = async (action: 'summarize_notes' | 'extract_tasks' | 'refine_tone') => {
    if (!selectedNote || !selectedNote.content.trim() || isProcessingAI) return;

    try {
      setIsProcessingAI(true);
      const result = await runExecutiveTool(action, selectedNote.content);

      if (action === 'refine_tone') {
        onUpdateNote(selectedNote.id, { content: result });
      } else {
        // Append summary/tasks to bottom of note
        const updated = `${selectedNote.content}\n\n---\n**Mayra Analysis:**\n${result}`;
        onUpdateNote(selectedNote.id, { content: updated });
      }
    } catch (err) {
      console.error('AI tool failed:', err);
    } finally {
      setIsProcessingAI(false);
    }
  };

  const handleSendToChat = () => {
    if (!selectedNote) return;
    onAskMayra(
      `Mayra, please review this note and share your strategic feedback and recommendations:\n\n### ${selectedNote.title}\n${selectedNote.content}`
    );
  };

  const handleCopy = () => {
    if (!selectedNote) return;
    navigator.clipboard.writeText(`${selectedNote.title}\n\n${selectedNote.content}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-neutral-950 overflow-hidden">
      {/* Top Header */}
      <header className="h-14 border-b border-neutral-800/80 bg-neutral-900/60 backdrop-blur-md px-4 flex items-center justify-between z-10 shrink-0">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onToggleSidebarMobile}
            className="lg:hidden p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-amber-400" />
            <h1 className="text-sm font-semibold text-neutral-100">Scratchpad & Notes</h1>
            <span className="text-xs font-mono text-neutral-400 tabular-nums">
              ({notes.length} saved)
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCreateNote}
            className="px-3 py-1.5 rounded-lg bg-amber-500 text-neutral-950 hover:bg-amber-400 font-semibold text-xs flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Note</span>
          </button>
        </div>
      </header>

      {/* Main Two-Column Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Notes list */}
        <div className="w-full sm:w-72 md:w-80 border-r border-neutral-800/80 flex flex-col bg-neutral-900/40">
          <div className="p-3 border-b border-neutral-800/70">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search notes..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-neutral-200 placeholder-neutral-500 outline-none focus:border-neutral-750"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {filteredNotes.length === 0 ? (
              <div className="p-6 text-center text-xs text-neutral-500">
                {notes.length === 0 ? 'No notes yet. Create your first note above!' : 'No matching notes found.'}
              </div>
            ) : (
              filteredNotes.map((note) => {
                const isSelected = note.id === selectedNoteId;
                return (
                  <div
                    key={note.id}
                    onClick={() => setSelectedNoteId(note.id)}
                    className={`p-3 rounded-xl cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-neutral-850 border border-neutral-700/80 text-white shadow-xs'
                        : 'hover:bg-neutral-900/80 text-neutral-400 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-semibold truncate text-neutral-200">
                        {note.title || 'Untitled Note'}
                      </h4>
                      <span className="text-[10px] text-neutral-400 font-mono tabular-nums">
                        {new Date(note.updatedAt).toLocaleDateString([], {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-400 truncate mt-1">
                      {note.content ? note.content.slice(0, 70) : 'Empty note...'}
                    </p>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Active Note Editor */}
        <div className="hidden sm:flex flex-1 flex-col bg-neutral-950 overflow-y-auto">
          {selectedNote ? (
            <div className="flex-1 flex flex-col p-6 max-w-3xl mx-auto w-full space-y-4">
              {/* Note actions toolbar */}
              <div className="flex items-center justify-between border-b border-neutral-800/80 pb-3">
                <input
                  type="text"
                  value={selectedNote.title}
                  onChange={(e) =>
                    onUpdateNote(selectedNote.id, {
                      title: e.target.value,
                      updatedAt: Date.now(),
                    })
                  }
                  placeholder="Note title..."
                  className="text-lg font-bold text-neutral-100 bg-transparent outline-none flex-1"
                />

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleCopy}
                    title="Copy note"
                    className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-900 transition-colors"
                  >
                    {copied ? (
                      <Check className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleSendToChat}
                    title="Discuss with Mayra in Chat"
                    className="px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-750 text-neutral-200 text-xs font-medium border border-neutral-700 flex items-center gap-1 transition-colors"
                  >
                    <span>Discuss with Mayra</span>
                    <ArrowUpRight className="w-3.5 h-3.5 text-amber-400" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      onDeleteNote(selectedNote.id);
                      setSelectedNoteId(null);
                    }}
                    title="Delete note"
                    className="p-1.5 rounded-lg text-neutral-500 hover:text-red-400 hover:bg-neutral-900 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* AI Assistant Toolbar for Note */}
              <div className="flex flex-wrap items-center gap-2 p-2 rounded-xl bg-neutral-900/60 border border-neutral-800 text-xs">
                <span className="text-[11px] font-medium text-amber-400/90 flex items-center gap-1 px-1">
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  Mayra AI Tools:
                </span>

                <button
                  type="button"
                  disabled={isProcessingAI || !selectedNote.content.trim()}
                  onClick={() => handleAIAction('summarize_notes')}
                  className="px-2.5 py-1 rounded-md bg-neutral-800 hover:bg-neutral-750 text-neutral-300 hover:text-white transition-colors disabled:opacity-50"
                >
                  Summarize Key Points
                </button>

                <button
                  type="button"
                  disabled={isProcessingAI || !selectedNote.content.trim()}
                  onClick={() => handleAIAction('extract_tasks')}
                  className="px-2.5 py-1 rounded-md bg-neutral-800 hover:bg-neutral-750 text-neutral-300 hover:text-white transition-colors disabled:opacity-50"
                >
                  Extract Action Items
                </button>

                <button
                  type="button"
                  disabled={isProcessingAI || !selectedNote.content.trim()}
                  onClick={() => handleAIAction('refine_tone')}
                  className="px-2.5 py-1 rounded-md bg-neutral-800 hover:bg-neutral-750 text-neutral-300 hover:text-white transition-colors disabled:opacity-50"
                >
                  Elevate & Polish Text
                </button>

                {isProcessingAI && (
                  <span className="text-[11px] text-amber-400 animate-pulse ml-auto">
                    Mayra is refining...
                  </span>
                )}
              </div>

              {/* Note Content Area */}
              <textarea
                value={selectedNote.content}
                onChange={(e) =>
                  onUpdateNote(selectedNote.id, {
                    content: e.target.value,
                    updatedAt: Date.now(),
                  })
                }
                placeholder="Type your notes, ideas, meeting takeaways, or outlines here..."
                className="flex-1 w-full bg-transparent text-sm text-neutral-200 placeholder-neutral-600 outline-none resize-none leading-relaxed min-h-[350px]"
              />
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-neutral-500">
              <FileText className="w-10 h-10 mb-2 text-neutral-700" />
              <p className="text-sm font-medium text-neutral-300">No Note Selected</p>
              <p className="text-xs text-neutral-500 mt-1">
                Choose a note from the list or create a new scratchpad.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
