import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Settings as SettingsIcon,
  Menu,
  Phone,
  Radio,
  Zap,
} from 'lucide-react';
import {
  LiveSession,
  SessionState,
  ToolCallEvent,
} from './services/audio/LiveSession';
import { ActionToast } from './components/ActionToast';
import { ChargingAlertBanner } from './components/ChargingAlertBanner';
import { BottomNavigation, NavTab } from './components/BottomNavigation';
import { HomeDashboard } from './components/HomeDashboard';
import { BengaliChatView } from './components/BengaliChatView';
import { VoiceModeView } from './components/VoiceModeView';
import { BengaliHistoryView } from './components/BengaliHistoryView';
import { BengaliSettingsView } from './components/BengaliSettingsView';
import { ContactsModal } from './components/ContactsModal';
import {
  ChatSession,
  Message,
  MemoryItem,
  UserPreferences,
  Contact,
  Role,
} from './types';
import {
  getSavedContacts,
  saveContacts,
  AndroidActionBridge,
  subscribeChargingEvents,
  getBatterySnapshot,
} from './services/androidBridge';

const DEFAULT_PREFERENCES: UserPreferences = {
  userName: 'জাওয়াদ',
  preferredLanguage: 'bn',
  tone: 'Intelligent, friendly, helpful, confident, natural',
  voiceName: 'Aoede',
  enableMemory: true,
  animationLevel: 'full',
  hapticsEnabled: true,
  theme: 'obsidian-purple',
  ownerProfile: {
    ownerName: 'জাওয়াদ',
    assistantName: 'মায়া',
    personality: 'প্রাঞ্জল, বুদ্ধিমান ও বন্ধুসুলভ ব্যক্তিগত সহকারী',
    contactWhatsApp: 'https://wa.link/mvgabh',
    contactEmail: '',
    contactPhone: '',
  },
  chargingSettings: {
    enableAlerts: true,
    voiceAnnouncement: true,
  },
};

export default function App() {
  // Navigation state (5 tabs: হোম, চ্যাট, ভয়েস, ইতিহাস, সেটিংস)
  const [activeTab, setActiveTab] = useState<NavTab>('home');

  // Live Audio Session state
  const [sessionState, setSessionState] = useState<SessionState>('disconnected');
  const [lastAction, setLastAction] = useState<ToolCallEvent | null>(null);
  const [lastMayaSpeech, setLastMayaSpeech] = useState<string>('');
  const [lastUserSpeech, setLastUserSpeech] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Battery & Charging State
  const [isCharging, setIsCharging] = useState(false);
  const [batteryLevel, setBatteryLevel] = useState(100);
  const [chargingAnnouncement, setChargingAnnouncement] = useState<string | null>(null);
  const previousChargingRef = useRef<boolean | null>(null);

  // Text generating indicator
  const [isGenerating, setIsGenerating] = useState(false);

  // Modals
  const [isContactsOpen, setIsContactsOpen] = useState(false);

  // Persistent preferences
  const [preferences, setPreferences] = useState<UserPreferences>(() => {
    try {
      const saved = localStorage.getItem('maya_preferences');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      // fallback
    }
    return DEFAULT_PREFERENCES;
  });

  // Persistent memories
  const [memories, setMemories] = useState<MemoryItem[]>(() => {
    try {
      const saved = localStorage.getItem('maya_memories');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      // fallback
    }
    return [
      {
        id: 'mem-1',
        key: 'ওনার ও ক্রিয়েটর',
        content: 'জাওয়াদ হলেন মায়া এআই-এর নির্মাতা ও একমাত্র বস (WhatsApp: https://wa.link/mvgabh)',
        category: 'personal',
        createdAt: Date.now(),
      },
    ];
  });

  // Saved contacts for Android actions
  const [contacts, setContacts] = useState<Contact[]>(() => getSavedContacts());

  // Chat sessions (History)
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    try {
      const saved = localStorage.getItem('maya_sessions');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      // fallback
    }
    const initialSession: ChatSession = {
      id: `session-${Date.now()}`,
      title: 'নতুন কথোপকথন',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: [],
    };
    return [initialSession];
  });

  const [currentSessionId, setCurrentSessionId] = useState<string>(() => {
    return sessions[0]?.id || `session-${Date.now()}`;
  });

  const sessionRef = useRef<LiveSession | null>(null);

  // Sync state to local storage
  useEffect(() => {
    localStorage.setItem('maya_preferences', JSON.stringify(preferences));
  }, [preferences]);

  useEffect(() => {
    localStorage.setItem('maya_memories', JSON.stringify(memories));
  }, [memories]);

  useEffect(() => {
    localStorage.setItem('maya_sessions', JSON.stringify(sessions));
  }, [sessions]);

  // Battery & Charging monitoring listener
  useEffect(() => {
    getBatterySnapshot().then((snapshot) => {
      setIsCharging(snapshot.isCharging);
      setBatteryLevel(snapshot.level);
      previousChargingRef.current = snapshot.isCharging;
    });

    const unsubscribe = subscribeChargingEvents((newCharging, level) => {
      setIsCharging(newCharging);
      setBatteryLevel(level);

      // Only announce when genuine state transition happens
      if (
        previousChargingRef.current !== null &&
        previousChargingRef.current !== newCharging
      ) {
        previousChargingRef.current = newCharging;

        const announcementText = newCharging
          ? 'জাওয়াদ, তোমার ফোনে চার্জ দেওয়া হচ্ছে।'
          : 'জাওয়াদ, তোমার ফোন চার্জ থেকে খুলে নেওয়া হয়েছে।';

        if (preferences.chargingSettings?.enableAlerts !== false) {
          setChargingAnnouncement(announcementText);

          // Audio voice announcement in Bengali
          if (
            preferences.chargingSettings?.voiceAnnouncement !== false &&
            typeof window !== 'undefined' &&
            'speechSynthesis' in window
          ) {
            try {
              window.speechSynthesis.cancel();
              const utterance = new SpeechSynthesisUtterance(announcementText);
              utterance.lang = 'bn-BD';
              utterance.rate = 0.95;
              window.speechSynthesis.speak(utterance);
            } catch (e) {}
          }
        }
      } else {
        previousChargingRef.current = newCharging;
      }
    });

    return () => {
      unsubscribe();
    };
  }, [preferences.chargingSettings]);

  // Current session messages
  const currentSession =
    sessions.find((s) => s.id === currentSessionId) || sessions[0];
  const messages = currentSession ? currentSession.messages : [];

  // Initialize LiveSession
  useEffect(() => {
    const session = new LiveSession({
      onStateChange: (state) => {
        setSessionState(state);
        if (state === 'listening') {
          setErrorMessage(null);
        }
      },
      onInterrupted: () => {
        // Interruption handled by LiveSession
      },
      onToolCall: (action) => {
        setLastAction(action);
        // Log action in current session
        addMessageToSession({
          id: `msg-${Date.now()}`,
          role: 'assistant',
          content: action.message,
          timestamp: Date.now(),
          executedActions: [
            {
              id: action.id,
              toolName: action.name as any,
              args: action.args,
              status: action.status || 'success',
              message: action.message,
              fallbackUrl: action.url,
              timestamp: Date.now(),
            },
          ],
        });
      },
      onTranscript: (text, isUser) => {
        const role: Role = isUser ? 'user' : 'assistant';
        if (isUser) {
          setLastUserSpeech((prev) => (prev ? `${prev} ${text}` : text));
        } else {
          setLastMayaSpeech((prev) => (prev ? `${prev}${text}` : text));
        }

        setSessions((prev) =>
          prev.map((s) => {
            if (s.id === currentSessionId) {
              const lastMsg = s.messages[s.messages.length - 1];
              const now = Date.now();
              if (lastMsg && lastMsg.role === role && now - lastMsg.timestamp < 6000) {
                const updatedMessages = [...s.messages];
                updatedMessages[updatedMessages.length - 1] = {
                  ...lastMsg,
                  content: lastMsg.content + (isUser ? ' ' : '') + text,
                  timestamp: now,
                };
                return {
                  ...s,
                  updatedAt: now,
                  messages: updatedMessages,
                };
              } else {
                const newMsg: Message = {
                  id: `msg-${now}`,
                  role,
                  content: text,
                  timestamp: now,
                };
                let updatedTitle = s.title;
                if (s.messages.length === 0 && isUser) {
                  updatedTitle = text.slice(0, 30) + (text.length > 30 ? '...' : '');
                }
                return {
                  ...s,
                  title: updatedTitle,
                  updatedAt: now,
                  messages: [...s.messages, newMsg],
                };
              }
            }
            return s;
          })
        );
      },
      onError: (err) => {
        setErrorMessage(err);
      },
    });

    sessionRef.current = session;

    return () => {
      session.disconnect();
    };
  }, [currentSessionId]);

  const addMessageToSession = (msg: Message) => {
    setSessions((prev) =>
      prev.map((s) => {
        if (s.id === currentSessionId) {
          const updatedMessages = [...s.messages, msg];
          let updatedTitle = s.title;
          if (s.messages.length === 0 && msg.role === 'user') {
            updatedTitle =
              msg.content.slice(0, 30) + (msg.content.length > 30 ? '...' : '');
          }
          return {
            ...s,
            title: updatedTitle,
            updatedAt: Date.now(),
            messages: updatedMessages,
          };
        }
        return s;
      })
    );
  };

  const handleToggleVoice = () => {
    const session = sessionRef.current;
    if (!session) return;

    if (sessionState === 'disconnected' || sessionState === 'error') {
      session.connect();
    } else {
      session.disconnect();
    }
  };

  // Text message submission (Streams via Live if connected, otherwise calls /api/chat)
  const handleSendMessage = async (text: string) => {
    const query = text.trim();
    if (!query || isGenerating) return;

    setLastUserSpeech(query);
    addMessageToSession({
      id: `msg-${Date.now()}`,
      role: 'user',
      content: query,
      timestamp: Date.now(),
    });

    // 1. WhatsApp Contact Confirmation Detection
    const lowerQuery = query.toLowerCase();
    const isAffirmation = [
      'হ্যাঁ',
      'দাও',
      'খুলে দাও',
      'yes',
      'open whatsapp',
      'খোলো',
      'খোল',
      'অবশ্যই',
      'হাঁ',
      'পাঠাও',
    ].some((kw) => lowerQuery.includes(kw));

    const lastSpeechAskedAboutWhatsApp =
      lastMayaSpeech.includes('WhatsApp') ||
      lastMayaSpeech.includes('জাওয়াদ') ||
      lastMayaSpeech.includes('যোগাযোগ') ||
      lastMayaSpeech.includes('লিংক');

    if (isAffirmation && lastSpeechAskedAboutWhatsApp) {
      const whatsappUrl =
        preferences.ownerProfile?.contactWhatsApp || 'https://wa.link/mvgabh';
      const res = AndroidActionBridge.openJawadWhatsApp(whatsappUrl);
      setLastAction({
        id: `act-${Date.now()}`,
        name: 'openJawadWhatsApp',
        args: {},
        message: res.message,
        url: res.fallbackUrl,
        status: res.status,
      });

      const confirmReply = 'আমি জাওয়াদের WhatsApp লিংকটি খুলে দিয়েছি।';
      setLastMayaSpeech(confirmReply);
      addMessageToSession({
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: confirmReply,
        timestamp: Date.now(),
        executedActions: [
          {
            id: `act-${Date.now()}`,
            toolName: 'openJawadWhatsApp',
            args: {},
            status: res.status,
            message: res.message,
            fallbackUrl: res.fallbackUrl,
            timestamp: Date.now(),
          },
        ],
      });
      return;
    }

    // 2. Charging Alert voice command detection
    if (
      lowerQuery.includes('চার্জিং অ্যালার্ট বন্ধ') ||
      lowerQuery.includes('চার্জিং বন্ধ')
    ) {
      setPreferences((prev) => ({
        ...prev,
        chargingSettings: {
          ...prev.chargingSettings,
          enableAlerts: false,
          voiceAnnouncement: false,
        },
      }));
      const reply = 'জাওয়াদ, চার্জিং অ্যালার্ট বন্ধ করা হয়েছে।';
      setLastMayaSpeech(reply);
      addMessageToSession({
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: reply,
        timestamp: Date.now(),
      });
      return;
    } else if (
      lowerQuery.includes('চার্জিং অ্যালার্ট চালু') ||
      lowerQuery.includes('চার্জিং অ্যালার্ট অন')
    ) {
      setPreferences((prev) => ({
        ...prev,
        chargingSettings: {
          ...prev.chargingSettings,
          enableAlerts: true,
          voiceAnnouncement: true,
        },
      }));
      const reply = 'জাওয়াদ, চার্জিং অ্যালার্ট চালু করা হয়েছে।';
      setLastMayaSpeech(reply);
      addMessageToSession({
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: reply,
        timestamp: Date.now(),
      });
      return;
    }

    const session = sessionRef.current;
    if (session && sessionState !== 'disconnected' && sessionState !== 'error') {
      session.sendTextMessage(query);
      return;
    }

    setIsGenerating(true);
    setSessionState('thinking');

    try {
      const activeSession = sessions.find((s) => s.id === currentSessionId);
      const historyMessages = activeSession
        ? [...activeSession.messages, { role: 'user', content: query }]
        : [{ role: 'user', content: query }];

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: historyMessages,
          userPreferences: preferences,
          memories: preferences.enableMemory ? memories : [],
        }),
      });

      if (!res.ok) {
        throw new Error('মায়ার থেকে উত্তর পেতে সমস্যা হয়েছে।');
      }

      const data = await res.json();
      const reply = data.reply || '';
      setLastMayaSpeech(reply);

      const executedActions: any[] = [];
      if (data.toolCall) {
        const { name, args } = data.toolCall;
        let actionRes: any = null;
        if (name === 'openJawadWhatsApp') {
          actionRes = AndroidActionBridge.openJawadWhatsApp(
            preferences.ownerProfile?.contactWhatsApp
          );
        } else if (name === 'openWhatsApp') {
          actionRes = AndroidActionBridge.openWhatsApp(
            args?.recipient,
            args?.message
          );
        } else if (name === 'openApp') {
          actionRes = AndroidActionBridge.openApp(args?.appName);
        } else if (name === 'searchGoogle') {
          const url = `https://www.google.com/search?q=${encodeURIComponent(
            args?.query || ''
          )}`;
          window.open(url, '_blank', 'noopener,noreferrer');
          actionRes = {
            success: true,
            message: `গুগলে অনুসন্ধান করা হচ্ছে: "${args?.query}"`,
            fallbackUrl: url,
            status: 'success',
          };
        } else if (name === 'openWebsite') {
          const url = args?.url?.startsWith('http')
            ? args.url
            : `https://${args?.url}`;
          window.open(url, '_blank', 'noopener,noreferrer');
          actionRes = {
            success: true,
            message: `ওয়েবসাইট খোলা হচ্ছে: ${url}`,
            fallbackUrl: url,
            status: 'success',
          };
        }

        if (actionRes) {
          setLastAction({
            id: `act-${Date.now()}`,
            name,
            args: args || {},
            message: actionRes.message,
            url: actionRes.fallbackUrl,
            status: actionRes.status,
          });
          executedActions.push({
            id: `act-${Date.now()}`,
            toolName: name,
            args: args || {},
            status: actionRes.status,
            message: actionRes.message,
            fallbackUrl: actionRes.fallbackUrl,
            timestamp: Date.now(),
          });
        }
      }

      addMessageToSession({
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: reply,
        timestamp: Date.now(),
        executedActions,
      });
      setSessionState('disconnected');
    } catch (err: any) {
      console.error('Chat error:', err);
      setErrorMessage(err.message || 'মায়ার সাথে যোগাযোগে সমস্যা হয়েছে।');
      setSessionState('error');
    } finally {
      setIsGenerating(false);
    }
  };

  // Memory management
  const handleAddMemory = (
    key: string,
    content: string,
    category: MemoryItem['category']
  ) => {
    if (!preferences.enableMemory) return;
    const newMem: MemoryItem = {
      id: `mem-${Date.now()}`,
      key,
      content,
      category,
      createdAt: Date.now(),
    };
    setMemories((prev) => [newMem, ...prev]);
  };

  const handleDeleteMemory = (id: string) => {
    setMemories((prev) => prev.filter((m) => m.id !== id));
  };

  // History session management
  const handleNewSession = () => {
    const newSession: ChatSession = {
      id: `session-${Date.now()}`,
      title: 'নতুন কথোপকথন',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: [],
    };
    setSessions((prev) => [newSession, ...prev]);
    setCurrentSessionId(newSession.id);
    setLastMayaSpeech('');
    setLastUserSpeech('');
    setActiveTab('chat');
  };

  const handleDeleteSession = (id: string) => {
    setSessions((prev) => {
      const filtered = prev.filter((s) => s.id !== id);
      if (filtered.length === 0) {
        const replacement: ChatSession = {
          id: `session-${Date.now()}`,
          title: 'নতুন কথোপকথন',
          createdAt: Date.now(),
          updatedAt: Date.now(),
          messages: [],
        };
        setCurrentSessionId(replacement.id);
        return [replacement];
      }
      if (id === currentSessionId) {
        setCurrentSessionId(filtered[0].id);
      }
      return filtered;
    });
  };

  const handleRenameSession = (id: string, newTitle: string) => {
    setSessions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, title: newTitle } : s))
    );
  };

  const handleClearHistory = () => {
    const replacement: ChatSession = {
      id: `session-${Date.now()}`,
      title: 'নতুন কথোপকথন',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: [],
    };
    setSessions([replacement]);
    setCurrentSessionId(replacement.id);
    setLastMayaSpeech('');
    setLastUserSpeech('');
  };

  // Contacts for Android Action Bridge
  const handleAddContact = (contact: Omit<Contact, 'id'>) => {
    const newContact: Contact = {
      ...contact,
      id: `contact-${Date.now()}`,
    };
    const updated = [newContact, ...contacts];
    setContacts(updated);
    saveContacts(updated);
  };

  const handleDeleteContact = (id: string) => {
    const updated = contacts.filter((c) => c.id !== id);
    setContacts(updated);
    saveContacts(updated);
  };

  // Simulate charging test for user in settings
  const handleSimulateCharging = (charging: boolean) => {
    setIsCharging(charging);
    const text = charging
      ? 'জাওয়াদ, তোমার ফোনে চার্জ দেওয়া হচ্ছে।'
      : 'জাওয়াদ, তোমার ফোন চার্জ থেকে খুলে নেওয়া হয়েছে।';

    if (preferences.chargingSettings?.enableAlerts !== false) {
      setChargingAnnouncement(text);
      if (
        preferences.chargingSettings?.voiceAnnouncement !== false &&
        typeof window !== 'undefined' &&
        'speechSynthesis' in window
      ) {
        try {
          window.speechSynthesis.cancel();
          const utterance = new SpeechSynthesisUtterance(text);
          utterance.lang = 'bn-BD';
          window.speechSynthesis.speak(utterance);
        } catch (e) {}
      }
    }
  };

  const isOnline = sessionState !== 'disconnected' && sessionState !== 'error';
  const isVoiceActive =
    sessionState === 'listening' ||
    sessionState === 'speaking' ||
    sessionState === 'thinking';

  return (
    <div className="relative h-screen w-screen bg-black text-white flex flex-col justify-between overflow-hidden selection:bg-pink-500/30 selection:text-pink-200 font-sans">
      {/* Deep Obsidian Background with Dark Navy, Purple and Cyan Glow Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-neutral-950 via-slate-950 to-black -z-10 pointer-events-none" />
      <div className="absolute top-1/6 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-purple-700/15 rounded-full blur-[140px] -z-10 pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 translate-y-1/2 w-[450px] h-[450px] bg-cyan-600/12 rounded-full blur-[140px] -z-10 pointer-events-none" />

      {/* Real-Time Tool Action Feedback Toast */}
      <ActionToast
        action={lastAction}
        onDismiss={() => setLastAction(null)}
      />

      {/* Smart Charging Alert Banner */}
      <ChargingAlertBanner
        isCharging={isCharging}
        batteryLevel={batteryLevel}
        lastAnnouncement={chargingAnnouncement}
        onDismiss={() => setChargingAnnouncement(null)}
      />

      {/* 2. HEADER AND BRANDING */}
      <header className="h-16 px-4 sm:px-6 border-b border-purple-500/20 bg-neutral-950/75 backdrop-blur-xl flex items-center justify-between z-20 shrink-0">
        {/* Left: Menu & Assistant Circular Avatar */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setActiveTab('home')}
            title="হোমে যান"
            className="p-1.5 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-900 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div
            onClick={() => setActiveTab('home')}
            className="flex items-center gap-2.5 cursor-pointer"
          >
            <div className="relative w-9 h-9 rounded-2xl overflow-hidden border border-purple-500/40 bg-neutral-900 shadow-md shadow-purple-500/20 ring-1 ring-cyan-400/30">
              <img
                src="/src/assets/images/maya_scifi_avatar_1790927648541.jpg"
                alt="Maya AI Avatar"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
              <span
                className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full ring-2 ring-black ${
                  isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-neutral-600'
                }`}
              />
            </div>

            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-sm font-bold tracking-tight text-white flex items-center gap-1">
                  <span>MAYA AI</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-purple-950 text-pink-300 border border-purple-500/30">
                    ২.০
                  </span>
                </h1>
              </div>
              <p className="text-[10px] text-neutral-400 font-medium">
                মালিক: {preferences.ownerProfile?.ownerName || 'জাওয়াদ'}
              </p>
            </div>
          </div>
        </div>

        {/* Right: Accurate Online/Offline Connection Indicator & Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Connection Status Badge in Bengali */}
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-neutral-900/90 border border-purple-500/20 text-[11px] font-mono">
            {isOnline ? (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            ) : (
              <span className="w-2 h-2 rounded-full bg-neutral-500" />
            )}
            <span
              className={`text-[10px] font-semibold ${
                isOnline ? 'text-emerald-400' : 'text-neutral-400'
              }`}
            >
              {isOnline ? 'অনলাইন' : 'অফলাইন'}
            </span>
          </div>

          {/* Android Action Bridge / Contacts Icon */}
          <button
            type="button"
            onClick={() => setIsContactsOpen(true)}
            title="ফোন ও ডিভাইস অ্যাকশন"
            className="p-2 rounded-xl bg-neutral-900/80 border border-neutral-800 text-neutral-300 hover:text-white hover:border-purple-500/40 hover:bg-neutral-850 transition-colors"
          >
            <Phone className="w-4 h-4 text-cyan-400" />
          </button>

          {/* Settings Tab Button */}
          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            title="সেটিংস"
            className={`p-2 rounded-xl border transition-colors ${
              activeTab === 'settings'
                ? 'bg-purple-600/30 text-pink-300 border-purple-500'
                : 'bg-neutral-900/80 border-neutral-800 text-neutral-300 hover:text-white hover:border-purple-500/40 hover:bg-neutral-850'
            }`}
          >
            <SettingsIcon className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* MAIN CONTENT AREA: DYNAMIC TAB SCREENS */}
      <main className="flex-1 flex flex-col min-h-0 relative z-10 overflow-hidden">
        {activeTab === 'home' && (
          <HomeDashboard
            sessionState={sessionState}
            onToggleVoice={handleToggleVoice}
            onNavigateTab={(tab) => setActiveTab(tab)}
            onQuickPrompt={(prompt) => {
              setActiveTab('chat');
              handleSendMessage(prompt);
            }}
            userAnalyser={sessionRef.current?.getRecorderAnalyser() || null}
            mayaAnalyser={sessionRef.current?.getStreamerAnalyser() || null}
            hapticsEnabled={preferences.hapticsEnabled}
          />
        )}

        {activeTab === 'chat' && (
          <BengaliChatView
            messages={messages}
            onSendMessage={handleSendMessage}
            sessionState={sessionState}
            onToggleVoice={handleToggleVoice}
            isGenerating={isGenerating}
            onNewChat={handleNewSession}
            onClearChat={handleClearHistory}
          />
        )}

        {activeTab === 'voice' && (
          <VoiceModeView
            sessionState={sessionState}
            onToggleVoice={handleToggleVoice}
            userAnalyser={sessionRef.current?.getRecorderAnalyser() || null}
            mayaAnalyser={sessionRef.current?.getStreamerAnalyser() || null}
            lastMayaSpeech={lastMayaSpeech}
            lastUserSpeech={lastUserSpeech}
            onQuickPrompt={(prompt) => handleSendMessage(prompt)}
            errorMessage={errorMessage}
            hapticsEnabled={preferences.hapticsEnabled}
          />
        )}

        {activeTab === 'history' && (
          <BengaliHistoryView
            sessions={sessions}
            currentSessionId={currentSessionId}
            onSelectSession={(id) => {
              setCurrentSessionId(id);
              setActiveTab('chat');
            }}
            onNewSession={handleNewSession}
            onDeleteSession={handleDeleteSession}
            onRenameSession={handleRenameSession}
            onClearAll={handleClearHistory}
          />
        )}

        {activeTab === 'settings' && (
          <BengaliSettingsView
            preferences={preferences}
            onSavePreferences={(newPrefs) =>
              setPreferences((prev) => ({ ...prev, ...newPrefs }))
            }
            memories={memories}
            onAddMemory={handleAddMemory}
            onDeleteMemory={handleDeleteMemory}
            onClearHistory={handleClearHistory}
            sessionState={sessionState}
            isCharging={isCharging}
            batteryLevel={batteryLevel}
            onSimulateCharging={handleSimulateCharging}
          />
        )}
      </main>

      {/* 9. BOTTOM NAVIGATION (৫টি সেকশন: হোম, চ্যাট, ভয়েস, ইতিহাস, সেটিংস) */}
      <BottomNavigation
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab)}
        isVoiceActive={isVoiceActive}
      />

      {/* Contacts / Device Actions Modal */}
      <ContactsModal
        isOpen={isContactsOpen}
        onClose={() => setIsContactsOpen(false)}
        contacts={contacts}
        onAddContact={handleAddContact}
        onDeleteContact={handleDeleteContact}
      />
    </div>
  );
}
