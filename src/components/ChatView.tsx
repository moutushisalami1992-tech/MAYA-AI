import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Copy,
  Check,
  Download,
  PlusCircle,
  Menu,
  Square,
  Sparkles,
  ChevronDown,
  Users,
  Smartphone,
  ExternalLink,
  PhoneCall,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import {
  ChatSession,
  Message,
  UserPreferences,
  AssistantMode,
  TaskItem,
  AppAction,
} from '../types';
import { MarkdownRenderer } from './MarkdownRenderer';
import { requestMayraSpeech } from '../services/api';

interface ChatViewProps {
  session: ChatSession;
  onSendMessage: (content: string) => Promise<void>;
  isStreaming: boolean;
  userPreferences: UserPreferences;
  onUpdatePreferences: (prefs: Partial<UserPreferences>) => void;
  onChangeMode: (mode: AssistantMode) => void;
  onAddTask: (task: Omit<TaskItem, 'id' | 'createdAt'>) => void;
  onClearSession: () => void;
  onRenameSession: (newTitle: string) => void;
  onToggleSidebarMobile: () => void;
  onOpenContacts?: () => void;
}

export const ChatView: React.FC<ChatViewProps> = ({
  session,
  onSendMessage,
  isStreaming,
  userPreferences,
  onUpdatePreferences,
  onChangeMode,
  onAddTask,
  onClearSession,
  onRenameSession,
  onToggleSidebarMobile,
  onOpenContacts,
}) => {
  const [input, setInput] = useState('');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState(session.title);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [addedTasks, setAddedTasks] = useState<Record<string, boolean>>({});

  // Voice playback state
  const [playingMessageId, setPlayingMessageId] = useState<string | null>(null);
  const [audioLoadingId, setAudioLoadingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Speech Recognition state with Bangla / Multilingual support
  const [speechLang, setSpeechLang] = useState<'bn-BD' | 'hi-IN' | 'en-IN' | 'en-US'>(() => {
    return (localStorage.getItem('arushi_speech_lang') as any) || 'bn-BD';
  });
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [session.messages, isStreaming]);

  // Sync title input
  useEffect(() => {
    setTitleInput(session.title);
  }, [session.title]);

  // Initialize Speech Recognition if supported
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = speechLang;

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // ignore
        }
      }
    };
  }, [speechLang]);

  useEffect(() => {
    if (recognitionRef.current) {
      recognitionRef.current.lang = speechLang;
    }
    localStorage.setItem('arushi_speech_lang', speechLang);
  }, [speechLang]);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert('Speech Recognition is not supported in this browser.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.error('Failed to start speech recognition:', err);
      }
    }
  };

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || isStreaming) return;
    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
    await onSendMessage(trimmed);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handlePlaySpeech = async (msgId: string, text: string) => {
    if (playingMessageId === msgId) {
      // Pause or stop current audio
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      setPlayingMessageId(null);
      return;
    }

    try {
      setAudioLoadingId(msgId);
      // Clean markdown tags for spoken audio
      const cleanText = text
        .replace(/<!--[\s\S]*?-->/g, '')
        .replace(/[*#`_]/g, '')
        .slice(0, 1000);

      const audioUrl = await requestMayraSpeech(
        cleanText,
        userPreferences.voiceName || 'Kore'
      );

      if (audioRef.current) {
        audioRef.current.pause();
      }

      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.onended = () => {
        setPlayingMessageId(null);
      };
      audio.onerror = () => {
        setPlayingMessageId(null);
        setAudioLoadingId(null);
      };

      await audio.play();
      setPlayingMessageId(msgId);
    } catch (err) {
      console.warn('Backend TTS failed, falling back to Web Speech API', err);
      // Fallback to browser SpeechSynthesis
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(
          text.replace(/<!--[\s\S]*?-->/g, '').replace(/[*#`_]/g, '').slice(0, 500)
        );
        utterance.rate = 1.0;
        utterance.onend = () => setPlayingMessageId(null);
        window.speechSynthesis.speak(utterance);
        setPlayingMessageId(msgId);
      }
    } finally {
      setAudioLoadingId(null);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const exportChat = () => {
    const formatted = session.messages
      .map(
        (m) =>
          `### ${m.role === 'user' ? 'You' : 'Mayra'} (${new Date(
            m.timestamp
          ).toLocaleTimeString()})\n\n${m.content}\n`
      )
      .join('\n---\n\n');

    const blob = new Blob([formatted], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${session.title.toLowerCase().replace(/\s+/g, '_')}_transcript.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const modes: AssistantMode[] = [
    'General Assistant',
    'Strategic Planner',
    'Executive Writer',
    'Deep Focus',
  ];

  const suggestions = [
    'বাংলায় কথা বলো (Speak in Bangla)',
    'হোয়াটসঅ্যাপ খোলো (Open WhatsApp)',
    'মাকে ফোন করো (Call Mom)',
    'Open YouTube',
    'Hindi mein baat karo (Talk in Hindi)',
    'আজকের কাজের পরিকল্পনা বলো (Daily Plan)',
  ];

  return (
    <div className="flex-1 flex flex-col h-full bg-neutral-950 overflow-hidden relative">
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

          {/* Session Title */}
          {isEditingTitle ? (
            <input
              type="text"
              value={titleInput}
              onChange={(e) => setTitleInput(e.target.value)}
              onBlur={() => {
                setIsEditingTitle(false);
                if (titleInput.trim()) onRenameSession(titleInput.trim());
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  setIsEditingTitle(false);
                  if (titleInput.trim()) onRenameSession(titleInput.trim());
                }
              }}
              autoFocus
              className="text-sm font-semibold text-white bg-neutral-800 px-2 py-1 rounded border border-neutral-700 outline-none"
            />
          ) : (
            <h1
              onClick={() => setIsEditingTitle(true)}
              title="Click to rename"
              className="text-sm font-semibold text-neutral-200 hover:text-white cursor-pointer truncate max-w-[200px] sm:max-w-xs"
            >
              {session.title}
            </h1>
          )}

          {/* Mode Selector */}
          <div className="relative group hidden sm:block">
            <select
              value={session.mode}
              onChange={(e) => onChangeMode(e.target.value as AssistantMode)}
              className="bg-neutral-850 hover:bg-neutral-800 text-neutral-300 text-xs py-1 px-2.5 rounded-md border border-neutral-700/60 cursor-pointer focus:outline-none focus:border-amber-500/50 appearance-none pr-6"
            >
              {modes.map((m) => (
                <option key={m} value={m} className="bg-neutral-900 text-neutral-200">
                  {m}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3 h-3 text-neutral-400 absolute right-2 top-2.5 pointer-events-none" />
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Contacts & Device Bridge */}
          {onOpenContacts && (
            <button
              type="button"
              onClick={onOpenContacts}
              title="Address Book & Device Bridge"
              className="p-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors border border-neutral-700 bg-neutral-850 hover:bg-neutral-800 text-neutral-300 hover:text-white"
            >
              <Users className="w-4 h-4 text-amber-400" />
              <span className="hidden sm:inline text-[11px]">Contacts & Bridge</span>
            </button>
          )}

          {/* Voice Auto-read toggle */}
          <button
            type="button"
            onClick={() =>
              onUpdatePreferences({ voiceAutoPlay: !userPreferences.voiceAutoPlay })
            }
            title={
              userPreferences.voiceAutoPlay
                ? 'Voice Readout Active'
                : 'Voice Readout Muted'
            }
            className={`p-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors border ${
              userPreferences.voiceAutoPlay
                ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                : 'text-neutral-400 border-transparent hover:bg-neutral-800 hover:text-neutral-200'
            }`}
          >
            {userPreferences.voiceAutoPlay ? (
              <>
                <Volume2 className="w-4 h-4 text-amber-400" />
                <span className="hidden md:inline text-[11px]">Voice On</span>
              </>
            ) : (
              <>
                <VolumeX className="w-4 h-4" />
                <span className="hidden md:inline text-[11px]">Voice Off</span>
              </>
            )}
          </button>

          {/* Export conversation */}
          {session.messages.length > 0 && (
            <button
              type="button"
              onClick={exportChat}
              title="Export transcript to Markdown"
              className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
            >
              <Download className="w-4 h-4" />
            </button>
          )}

          {/* Clear conversation */}
          {session.messages.length > 0 && (
            <button
              type="button"
              onClick={onClearSession}
              title="Clear messages in this conversation"
              className="text-xs text-neutral-400 hover:text-neutral-200 px-2 py-1 rounded hover:bg-neutral-800/80 transition-colors"
            >
              Clear
            </button>
          )}
        </div>
      </header>

      {/* Messages Stream */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
        {session.messages.length === 0 ? (
          <div className="max-w-2xl mx-auto mt-8 sm:mt-12 text-center space-y-6">
            <div className="relative inline-block">
              <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-neutral-700 bg-neutral-800 mx-auto shadow-lg">
                <img
                  src="/src/assets/images/mayra_avatar_1790920050586.jpg"
                  alt="Mayra"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="absolute bottom-1 right-1 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-neutral-950" />
            </div>

            <div>
              <h2 className="text-xl font-semibold text-neutral-100 tracking-tight">
                How may I assist you, {userPreferences.userName || 'friend'}?
              </h2>
              <p className="text-sm text-neutral-400 mt-1.5 max-w-md mx-auto leading-relaxed">
                I am ready to plan your agenda, prioritize tasks, refine documents,
                or think through strategic decisions.
              </p>
            </div>

            {/* Quick Starters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-4 text-left">
              {suggestions.map((prompt, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => onSendMessage(prompt)}
                  className="p-3.5 rounded-xl border border-neutral-800 bg-neutral-900/50 hover:bg-neutral-850 hover:border-neutral-700 transition-all text-xs text-neutral-300 hover:text-white flex items-start gap-2.5 group"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                  <span className="leading-snug">{prompt}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto space-y-6">
            {session.messages.map((message) => {
              const isUser = message.role === 'user';
              const isPlaying = playingMessageId === message.id;
              const isLoadingAudio = audioLoadingId === message.id;

              return (
                <div
                  key={message.id}
                  className={`flex gap-3.5 ${isUser ? 'justify-end' : 'justify-start'}`}
                >
                  {/* Mayra Avatar */}
                  {!isUser && (
                    <div className="w-8 h-8 rounded-full overflow-hidden border border-neutral-700 bg-neutral-800 shrink-0 mt-0.5 shadow-xs">
                      <img
                        src="/src/assets/images/mayra_avatar_1790920050586.jpg"
                        alt="Mayra"
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  <div className={`max-w-[85%] sm:max-w-[78%] space-y-2`}>
                    {/* Role & timestamp */}
                    <div
                      className={`flex items-center gap-2 text-[11px] text-neutral-400 ${
                        isUser ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      <span className="font-medium text-neutral-300">
                        {isUser ? userPreferences.userName || 'You' : 'Mayra'}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="tabular-nums">
                        {new Date(message.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    {/* Bubble Content */}
                    <div
                      className={`p-4 rounded-2xl ${
                        isUser
                          ? 'bg-neutral-800 text-neutral-100 rounded-tr-xs border border-neutral-750'
                          : 'bg-neutral-900/90 text-neutral-200 rounded-tl-xs border border-neutral-800/90 shadow-xs'
                      }`}
                    >
                      {isUser ? (
                        <p className="text-[15px] whitespace-pre-wrap leading-relaxed">
                          {message.content}
                        </p>
                      ) : (
                        <MarkdownRenderer content={message.content} />
                      )}

                      {/* Real Executed Device Actions */}
                      {!isUser && message.executedActions && message.executedActions.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-neutral-800 space-y-2">
                          <span className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Executed Device Action</span>
                          </span>
                          <div className="space-y-1.5">
                            {message.executedActions.map((action, aIdx) => (
                              <div
                                key={aIdx}
                                className="p-2.5 rounded-xl bg-neutral-950/80 border border-neutral-800 text-xs flex items-center justify-between gap-2"
                              >
                                <div className="flex items-center gap-2.5 truncate">
                                  {action.toolName === 'makeCall' || action.toolName === 'callContact' ? (
                                    <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shrink-0">
                                      <PhoneCall className="w-3.5 h-3.5 text-emerald-400" />
                                    </div>
                                  ) : (
                                    <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shrink-0">
                                      <Smartphone className="w-3.5 h-3.5 text-amber-400" />
                                    </div>
                                  )}
                                  <div className="truncate">
                                    <p className="font-medium text-neutral-200 truncate">
                                      {action.message}
                                    </p>
                                    <p className="text-[10px] text-neutral-400">
                                      Function: <code className="font-mono text-amber-300">{action.toolName}</code>
                                    </p>
                                  </div>
                                </div>

                                {action.fallbackUrl && (
                                  <a
                                    href={action.fallbackUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-2.5 py-1 rounded text-[11px] font-medium bg-neutral-800 hover:bg-neutral-750 text-neutral-200 border border-neutral-700 flex items-center gap-1 shrink-0"
                                  >
                                    <span>Launch</span>
                                    <ExternalLink className="w-3 h-3 text-neutral-400" />
                                  </a>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Suggested Tasks Detected from Assistant */}
                      {!isUser && message.suggestedTasks && message.suggestedTasks.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-neutral-800 space-y-2">
                          <span className="text-[11px] font-medium text-amber-400/90">
                            Suggested Action Items
                          </span>
                          <div className="space-y-1.5">
                            {message.suggestedTasks.map((t, idx) => {
                              const key = `${message.id}-${idx}`;
                              const isAdded = addedTasks[key];

                              return (
                                <div
                                  key={idx}
                                  className="flex items-center justify-between p-2 rounded-lg bg-neutral-950/60 border border-neutral-800 text-xs"
                                >
                                  <div className="flex items-center gap-2 truncate pr-2">
                                    <span
                                      className={`w-2 h-2 rounded-full shrink-0 ${
                                        t.priority === 'high'
                                          ? 'bg-red-400'
                                          : t.priority === 'medium'
                                          ? 'bg-amber-400'
                                          : 'bg-blue-400'
                                      }`}
                                    />
                                    <span className="truncate text-neutral-200 font-medium">
                                      {t.title}
                                    </span>
                                  </div>
                                  <button
                                    type="button"
                                    disabled={isAdded}
                                    onClick={() => {
                                      onAddTask({
                                        title: t.title,
                                        priority: t.priority || 'medium',
                                        completed: false,
                                        dueDate: t.dueDate,
                                        category: 'Action Item',
                                      });
                                      setAddedTasks((prev) => ({
                                        ...prev,
                                        [key]: true,
                                      }));
                                    }}
                                    className={`px-2 py-1 rounded text-[11px] font-medium transition-colors flex items-center gap-1 shrink-0 ${
                                      isAdded
                                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                        : 'bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 border border-amber-500/30'
                                    }`}
                                  >
                                    {isAdded ? (
                                      <>
                                        <Check className="w-3 h-3" />
                                        <span>Added</span>
                                      </>
                                    ) : (
                                      <>
                                        <PlusCircle className="w-3 h-3" />
                                        <span>Add to Tasks</span>
                                      </>
                                    )}
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Bottom toolbar for message */}
                    <div
                      className={`flex items-center gap-2 px-1 ${
                        isUser ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => copyToClipboard(message.content, message.id)}
                        title="Copy message"
                        className="p-1 rounded text-neutral-500 hover:text-neutral-300 transition-colors"
                      >
                        {copiedId === message.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>

                      {!isUser && (
                        <button
                          type="button"
                          onClick={() =>
                            handlePlaySpeech(message.id, message.content)
                          }
                          disabled={isLoadingAudio}
                          title={isPlaying ? 'Stop speech' : 'Listen to Mayra'}
                          className={`p-1 rounded text-xs flex items-center gap-1 transition-colors ${
                            isPlaying
                              ? 'text-amber-400'
                              : 'text-neutral-500 hover:text-neutral-300'
                          }`}
                        >
                          {isLoadingAudio ? (
                            <span className="w-3.5 h-3.5 rounded-full border border-amber-400 border-t-transparent animate-spin" />
                          ) : isPlaying ? (
                            <Square className="w-3.5 h-3.5 fill-current" />
                          ) : (
                            <Volume2 className="w-3.5 h-3.5" />
                          )}
                          <span className="text-[10px]">
                            {isPlaying ? 'Speaking' : 'Speak'}
                          </span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Streaming indicator */}
            {isStreaming && (
              <div className="flex gap-3.5 justify-start">
                <div className="w-8 h-8 rounded-full overflow-hidden border border-neutral-700 bg-neutral-800 shrink-0 mt-0.5">
                  <img
                    src="/src/assets/images/mayra_avatar_1790920050586.jpg"
                    alt="Mayra"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-3.5 rounded-2xl rounded-tl-xs bg-neutral-900 border border-neutral-800 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                  <span className="text-xs text-neutral-400">
                    Mayra is composing...
                  </span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Composer */}
      <div className="p-3 sm:p-4 border-t border-neutral-800/80 bg-neutral-900/80 backdrop-blur-md shrink-0">
        <div className="max-w-3xl mx-auto">
          {/* Listening indicator */}
          {isListening && (
            <div className="mb-2 flex items-center justify-between px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                <span>
                  Listening in{' '}
                  <strong className="text-white">
                    {speechLang === 'bn-BD'
                      ? 'বাংলা (Bangla)'
                      : speechLang === 'hi-IN'
                      ? 'हिन्दी (Hindi)'
                      : speechLang === 'en-IN'
                      ? 'English (India)'
                      : 'English (US)'}
                  </strong>
                  ... Speak now
                </span>
              </div>
              <button
                type="button"
                onClick={toggleListening}
                className="text-[11px] underline hover:text-white"
              >
                Stop dictation
              </button>
            </div>
          )}

          <div className="relative flex items-end gap-2 bg-neutral-950 border border-neutral-800 rounded-2xl p-2 focus-within:border-amber-500/50 focus-within:ring-1 focus-within:ring-amber-500/30 transition-all">
            {/* Language Selector */}
            <select
              value={speechLang}
              onChange={(e) => setSpeechLang(e.target.value as any)}
              title="Select Speech & Voice Language"
              className="bg-neutral-900 text-neutral-300 text-[11px] py-2 px-1.5 rounded-xl border border-neutral-800 outline-none cursor-pointer hover:border-neutral-700 shrink-0 self-center"
            >
              <option value="bn-BD">🇧🇩 বাংলা</option>
              <option value="hi-IN">🇮🇳 हिन्दी</option>
              <option value="en-IN">🇮🇳 Eng (IN)</option>
              <option value="en-US">🇺🇸 Eng (US)</option>
            </select>

            {/* Voice Dictation Button */}
            <button
              type="button"
              onClick={toggleListening}
              title={isListening ? 'Stop listening' : 'Speak to Assistant'}
              className={`p-2.5 rounded-xl transition-colors shrink-0 ${
                isListening
                  ? 'bg-amber-500 text-neutral-950 animate-pulse'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-850'
              }`}
            >
              {isListening ? (
                <MicOff className="w-4 h-4" />
              ) : (
                <Mic className="w-4 h-4" />
              )}
            </button>

            {/* Input Textarea */}
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                e.target.style.height = 'auto';
                e.target.style.height = `${Math.min(e.target.scrollHeight, 180)}px`;
              }}
              onKeyDown={handleKeyDown}
              placeholder={`Message Mayra... (Shift + Enter for new line)`}
              rows={1}
              className="flex-1 bg-transparent text-sm text-neutral-100 placeholder-neutral-500 outline-none resize-none py-2 px-1 leading-normal max-h-44"
            />

            {/* Send Button */}
            <button
              type="button"
              onClick={handleSend}
              disabled={!input.trim() || isStreaming}
              className={`p-2.5 rounded-xl transition-all shrink-0 ${
                input.trim() && !isStreaming
                  ? 'bg-amber-500 text-neutral-950 hover:bg-amber-400 font-medium'
                  : 'bg-neutral-850 text-neutral-500 cursor-not-allowed'
              }`}
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
