import React from 'react';
import {
  MessageSquare,
  Sparkles,
  CheckSquare,
  FileText,
  Wrench,
  Plus,
  Trash2,
  Settings,
  Volume2,
  VolumeX,
  Users,
} from 'lucide-react';
import { ChatSession, UserPreferences } from '../types';

interface SidebarProps {
  activeTab: 'chat' | 'briefing' | 'tasks' | 'notes' | 'tools';
  setActiveTab: (tab: 'chat' | 'briefing' | 'tasks' | 'notes' | 'tools') => void;
  sessions: ChatSession[];
  currentSessionId: string;
  onSelectSession: (id: string) => void;
  onNewSession: () => void;
  onDeleteSession: (id: string, e: React.MouseEvent) => void;
  userPreferences: UserPreferences;
  onOpenSettings: () => void;
  onOpenContacts?: () => void;
  pendingTasksCount: number;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  sessions,
  currentSessionId,
  onSelectSession,
  onNewSession,
  onDeleteSession,
  userPreferences,
  onOpenSettings,
  onOpenContacts,
  pendingTasksCount,
  isOpenMobile,
  onCloseMobile,
}) => {
  return (
    <>
      {/* Mobile backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 bg-black/60 z-30 lg:hidden backdrop-blur-xs"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 w-72 bg-neutral-900 border-r border-neutral-800/80 flex flex-col transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand header */}
        <div className="p-4 border-b border-neutral-800/70 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 rounded-full overflow-hidden border border-neutral-700 bg-neutral-800 shrink-0">
              <img
                src="/src/assets/images/mayra_avatar_1790920050586.jpg"
                alt="Mayra"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
                onError={(e) => {
                  // Fallback container in case image fails to load
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
              <div className="absolute inset-0 flex items-center justify-center bg-neutral-800 text-amber-400 font-semibold text-sm -z-10">
                M
              </div>
              <span
                className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-neutral-900"
                title="Mayra is ready"
              />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-neutral-100 tracking-tight text-sm">
                  Mayra
                </span>
                <span className="text-[11px] text-amber-400/90 font-medium">
                  Assistant
                </span>
              </div>
              <p className="text-[11px] text-neutral-400 truncate max-w-[130px]">
                {userPreferences.userName
                  ? `For ${userPreferences.userName}`
                  : 'Personal AI Companion'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onNewSession}
            title="Start new conversation"
            className="p-2 rounded-lg bg-neutral-800 text-neutral-200 hover:text-white hover:bg-neutral-750 transition-colors border border-neutral-700/60"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Primary Workspace Navigation */}
        <div className="p-3 space-y-1">
          <button
            type="button"
            onClick={() => {
              setActiveTab('chat');
              onCloseMobile();
            }}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
              activeTab === 'chat'
                ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                : 'text-neutral-300 hover:bg-neutral-800/60 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <MessageSquare className="w-4 h-4 text-amber-400" />
              <span>Conversation</span>
            </div>
            <span className="text-[10px] text-neutral-400 font-mono">
              {sessions.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('briefing');
              onCloseMobile();
            }}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
              activeTab === 'briefing'
                ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                : 'text-neutral-300 hover:bg-neutral-800/60 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Daily Briefing</span>
            </div>
            <span className="text-[10px] text-neutral-400 font-mono">Today</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('tasks');
              onCloseMobile();
            }}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
              activeTab === 'tasks'
                ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                : 'text-neutral-300 hover:bg-neutral-800/60 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <CheckSquare className="w-4 h-4 text-amber-400" />
              <span>Action Items</span>
            </div>
            {pendingTasksCount > 0 && (
              <span className="text-[10px] font-mono bg-neutral-800 px-1.5 py-0.5 rounded text-neutral-300 tabular-nums">
                {pendingTasksCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('notes');
              onCloseMobile();
            }}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
              activeTab === 'notes'
                ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                : 'text-neutral-300 hover:bg-neutral-800/60 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <FileText className="w-4 h-4 text-amber-400" />
              <span>Scratchpad & Notes</span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('tools');
              onCloseMobile();
            }}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
              activeTab === 'tools'
                ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                : 'text-neutral-300 hover:bg-neutral-800/60 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Wrench className="w-4 h-4 text-amber-400" />
              <span>Executive Tools</span>
            </div>
          </button>

          {onOpenContacts && (
            <button
              type="button"
              onClick={() => {
                onOpenContacts();
                onCloseMobile();
              }}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-neutral-300 hover:bg-neutral-800/60 hover:text-white transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <Users className="w-4 h-4 text-amber-400" />
                <span>Contacts & Bridge</span>
              </div>
              <span className="text-[10px] text-emerald-400 font-mono">Ready</span>
            </button>
          )}
        </div>

        {/* Chat Threads Section */}
        <div className="flex-1 overflow-y-auto px-3 py-2 border-t border-neutral-800/60">
          <div className="flex items-center justify-between px-2 py-1.5 mb-1">
            <span className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider">
              Conversations
            </span>
          </div>

          <div className="space-y-1">
            {sessions.map((session) => {
              const isSelected =
                activeTab === 'chat' && session.id === currentSessionId;
              return (
                <div
                  key={session.id}
                  onClick={() => {
                    onSelectSession(session.id);
                    setActiveTab('chat');
                    onCloseMobile();
                  }}
                  className={`group relative flex items-center justify-between px-2.5 py-2 rounded-lg text-xs cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-neutral-800 text-white font-medium shadow-xs'
                      : 'text-neutral-400 hover:bg-neutral-850 hover:text-neutral-200'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate pr-2">
                    <span
                      className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                        isSelected ? 'bg-amber-400' : 'bg-neutral-600'
                      }`}
                    />
                    <span className="truncate">{session.title}</span>
                  </div>

                  {sessions.length > 1 && (
                    <button
                      type="button"
                      onClick={(e) => onDeleteSession(session.id, e)}
                      title="Delete thread"
                      className="opacity-0 group-hover:opacity-100 p-1 text-neutral-500 hover:text-red-400 transition-opacity"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* User Profile & Settings Footer */}
        <div className="p-3 border-t border-neutral-800/70 bg-neutral-900/90">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center text-xs font-semibold text-neutral-200">
                {userPreferences.userName
                  ? userPreferences.userName.charAt(0).toUpperCase()
                  : 'U'}
              </div>
              <div className="text-xs truncate max-w-[120px]">
                <p className="font-medium text-neutral-200 truncate">
                  {userPreferences.userName || 'Personal User'}
                </p>
                <p className="text-[10px] text-neutral-400 truncate">
                  {userPreferences.tone.split(',')[0]}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={onOpenSettings}
                title="Settings & Persona Preferences"
                className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
