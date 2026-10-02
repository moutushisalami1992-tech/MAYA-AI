import React, { useState } from 'react';
import {
  Sparkles,
  RefreshCw,
  Volume2,
  Square,
  CheckCircle2,
  Calendar,
  ArrowRight,
  Target,
  Menu,
} from 'lucide-react';
import { UserPreferences, TaskItem, NoteItem } from '../types';
import { fetchDailyBriefing, requestMayraSpeech } from '../services/api';
import { MarkdownRenderer } from './MarkdownRenderer';

interface BriefingViewProps {
  userPreferences: UserPreferences;
  onUpdatePreferences: (prefs: Partial<UserPreferences>) => void;
  tasks: TaskItem[];
  notes: NoteItem[];
  onNavigateToTasks: () => void;
  onAskMayra: (prompt: string) => void;
  onToggleSidebarMobile: () => void;
}

export const BriefingView: React.FC<BriefingViewProps> = ({
  userPreferences,
  onUpdatePreferences,
  tasks,
  notes,
  onNavigateToTasks,
  onAskMayra,
  onToggleSidebarMobile,
}) => {
  const [briefing, setBriefing] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [goalInput, setGoalInput] = useState<string>(
    userPreferences.primaryGoal || ''
  );
  const [isEditingGoal, setIsEditingGoal] = useState<boolean>(false);

  // Audio speech
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const [audioLoading, setAudioLoading] = useState<boolean>(false);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(
    null
  );

  const pendingTasks = tasks.filter((t) => !t.completed);
  const highPriorityTasks = pendingTasks.filter((t) => t.priority === 'high');

  const generateBriefing = async () => {
    try {
      setIsLoading(true);
      if (audioElement) {
        audioElement.pause();
        setIsPlayingAudio(false);
      }
      const text = await fetchDailyBriefing(userPreferences, tasks, notes);
      setBriefing(text);
    } catch (err) {
      console.error('Failed to generate briefing:', err);
      setBriefing(
        `### Good day, ${
          userPreferences.userName || 'friend'
        }!\n\nHere is your focus checkpoint for today:\n- **Pending tasks**: ${
          pendingTasks.length
        } items queued up.\n- **Primary focus**: ${
          userPreferences.primaryGoal || 'Execute on key priorities'
        }.\n\nTake a breath, prioritize your top milestone, and let me know if you would like me to structure any agenda or draft communications.`
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlayBriefing = async () => {
    if (isPlayingAudio && audioElement) {
      audioElement.pause();
      setIsPlayingAudio(false);
      return;
    }

    if (!briefing) return;

    try {
      setAudioLoading(true);
      const cleanText = briefing
        .replace(/<!--[\s\S]*?-->/g, '')
        .replace(/[*#`_]/g, '')
        .slice(0, 1000);

      const audioUrl = await requestMayraSpeech(
        cleanText,
        userPreferences.voiceName || 'Kore'
      );
      const audio = new Audio(audioUrl);
      setAudioElement(audio);

      audio.onended = () => setIsPlayingAudio(false);
      audio.onerror = () => {
        setIsPlayingAudio(false);
        setAudioLoading(false);
      };

      await audio.play();
      setIsPlayingAudio(true);
    } catch (err) {
      console.warn('TTS fallback to speech synthesis', err);
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(
          briefing.replace(/[*#`_]/g, '').slice(0, 500)
        );
        utterance.onend = () => setIsPlayingAudio(false);
        window.speechSynthesis.speak(utterance);
        setIsPlayingAudio(true);
      }
    } finally {
      setAudioLoading(false);
    }
  };

  const saveGoal = () => {
    onUpdatePreferences({ primaryGoal: goalInput.trim() });
    setIsEditingGoal(false);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-neutral-950 overflow-y-auto">
      {/* Top Header */}
      <header className="h-14 border-b border-neutral-800/80 bg-neutral-900/60 backdrop-blur-md px-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onToggleSidebarMobile}
            className="lg:hidden p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-sm font-semibold text-neutral-100 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Daily Executive Briefing</span>
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {briefing && (
            <button
              type="button"
              onClick={handlePlayBriefing}
              disabled={audioLoading}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors border ${
                isPlayingAudio
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-neutral-800 text-neutral-300 hover:text-white border-neutral-700'
              }`}
            >
              {audioLoading ? (
                <span className="w-3.5 h-3.5 border border-amber-400 border-t-transparent rounded-full animate-spin" />
              ) : isPlayingAudio ? (
                <Square className="w-3.5 h-3.5 fill-current" />
              ) : (
                <Volume2 className="w-3.5 h-3.5" />
              )}
              <span>{isPlayingAudio ? 'Stop Voice' : 'Listen to Mayra'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={generateBriefing}
            disabled={isLoading}
            className="px-3 py-1.5 rounded-lg bg-amber-500 text-neutral-950 hover:bg-amber-400 font-medium text-xs flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`}
            />
            <span>{isLoading ? 'Composing...' : 'Refresh Briefing'}</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="max-w-4xl mx-auto w-full p-4 sm:p-6 space-y-6">
        {/* Workspace Hero Backdrop Card */}
        <div className="relative rounded-2xl overflow-hidden border border-neutral-800 min-h-[160px] sm:min-h-[180px] flex flex-col justify-end p-5 sm:p-6 shadow-md">
          {/* Background image with contrast scrim */}
          <img
            src="/src/assets/images/mayra_workspace_1790920066771.jpg"
            alt="Workspace"
            referrerPolicy="no-referrer"
            className="absolute inset-0 w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/75 to-neutral-950/30" />

          {/* Foreground content */}
          <div className="relative z-10 space-y-2">
            <div className="flex items-center gap-2 text-xs text-amber-300/90 font-medium">
              <Calendar className="w-3.5 h-3.5" />
              <span>
                {new Date().toLocaleDateString(undefined, {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Good {getGreetingTime()}, {userPreferences.userName || 'friend'}.
            </h2>

            {/* Editable Focus Goal */}
            <div className="flex items-center gap-2 text-xs text-neutral-300 pt-1">
              <Target className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="text-neutral-400">Primary Objective:</span>
              {isEditingGoal ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={goalInput}
                    onChange={(e) => setGoalInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && saveGoal()}
                    placeholder="Set your main goal for today..."
                    className="bg-neutral-900 border border-neutral-700 px-2 py-0.5 rounded text-white text-xs outline-none focus:border-amber-500"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={saveGoal}
                    className="text-amber-400 hover:text-amber-300 font-medium"
                  >
                    Save
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsEditingGoal(true)}
                  className="hover:underline text-neutral-200 font-medium"
                >
                  {userPreferences.primaryGoal || 'Click to define today’s core focus'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Status Snapshot Counters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-4 rounded-xl bg-neutral-900/60 border border-neutral-800/80 flex items-center justify-between">
            <div>
              <p className="text-xs text-neutral-400">Active Action Items</p>
              <p className="text-2xl font-semibold text-neutral-100 font-mono tabular-nums mt-0.5">
                {pendingTasks.length}
              </p>
            </div>
            <button
              type="button"
              onClick={onNavigateToTasks}
              className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 font-medium"
            >
              <span>View</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="p-4 rounded-xl bg-neutral-900/60 border border-neutral-800/80 flex items-center justify-between">
            <div>
              <p className="text-xs text-neutral-400">High Priority</p>
              <p className="text-2xl font-semibold text-red-400 font-mono tabular-nums mt-0.5">
                {highPriorityTasks.length}
              </p>
            </div>
            <span className="text-[11px] text-neutral-500">Requires attention</span>
          </div>

          <div className="p-4 rounded-xl bg-neutral-900/60 border border-neutral-800/80 flex items-center justify-between">
            <div>
              <p className="text-xs text-neutral-400">Saved Notes</p>
              <p className="text-2xl font-semibold text-neutral-100 font-mono tabular-nums mt-0.5">
                {notes.length}
              </p>
            </div>
            <span className="text-[11px] text-neutral-500">In knowledge base</span>
          </div>
        </div>

        {/* Briefing Text Card */}
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/80 p-5 sm:p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full overflow-hidden border border-neutral-700 bg-neutral-800 shrink-0">
                <img
                  src="/src/assets/images/mayra_avatar_1790920050586.jpg"
                  alt="Mayra"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <span className="text-xs font-semibold text-neutral-200">
                  Mayra’s Morning Dispatch
                </span>
                <p className="text-[11px] text-neutral-400">
                  Synthesized for {userPreferences.userName || 'you'}
                </p>
              </div>
            </div>

            <div className="text-[11px] text-neutral-500 font-mono">
              Mode: {userPreferences.tone.split(',')[0]}
            </div>
          </div>

          {isLoading ? (
            <div className="py-12 text-center space-y-3">
              <div className="w-8 h-8 rounded-full border-2 border-amber-400 border-t-transparent animate-spin mx-auto" />
              <p className="text-xs text-neutral-400">
                Mayra is analyzing your schedule, priorities, and notes...
              </p>
            </div>
          ) : briefing ? (
            <div className="text-neutral-200">
              <MarkdownRenderer content={briefing} />
            </div>
          ) : (
            <div className="py-10 text-center space-y-3">
              <Sparkles className="w-8 h-8 text-amber-400/60 mx-auto" />
              <p className="text-sm text-neutral-300 font-medium">
                No briefing generated yet today.
              </p>
              <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                Click below to have Mayra assemble your personalized daily focus
                overview.
              </p>
              <button
                type="button"
                onClick={generateBriefing}
                className="px-4 py-2 rounded-xl bg-amber-500 text-neutral-950 hover:bg-amber-400 text-xs font-semibold transition-colors"
              >
                Generate Today’s Briefing
              </button>
            </div>
          )}
        </div>

        {/* Quick Follow-up Actions */}
        <div className="rounded-xl border border-neutral-800/80 bg-neutral-900/40 p-4 space-y-2.5">
          <span className="text-xs font-medium text-neutral-400 uppercase tracking-wider">
            Quick Inquiries for Mayra
          </span>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() =>
                onAskMayra(
                  'Based on my current briefing, help me design a 90-minute deep work schedule for this morning.'
                )
              }
              className="px-3 py-1.5 rounded-lg bg-neutral-800 text-neutral-300 hover:text-white text-xs border border-neutral-700/60 transition-colors"
            >
              🗓️ Structure 90-min Deep Work Block
            </button>
            <button
              type="button"
              onClick={() =>
                onAskMayra(
                  'Review my tasks and tell me the single most critical item I must finish before noon.'
                )
              }
              className="px-3 py-1.5 rounded-lg bg-neutral-800 text-neutral-300 hover:text-white text-xs border border-neutral-700/60 transition-colors"
            >
              🎯 Identify Top Priority
            </button>
            <button
              type="button"
              onClick={() =>
                onAskMayra(
                  'Give me a concise 2-sentence motivational thought to keep my mindset grounded today.'
                )
              }
              className="px-3 py-1.5 rounded-lg bg-neutral-800 text-neutral-300 hover:text-white text-xs border border-neutral-700/60 transition-colors"
            >
              ✨ Mindset Calibration
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

function getGreetingTime(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  return 'evening';
}
