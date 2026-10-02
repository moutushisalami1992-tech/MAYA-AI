import React, { useState } from 'react';
import {
  Settings,
  Globe,
  Volume2,
  Mic,
  Wifi,
  Brain,
  Palette,
  Shield,
  Trash2,
  Plus,
  Info,
  Check,
  Zap,
  BatteryCharging,
  UserCheck,
  ExternalLink,
  MessageSquare,
  Smartphone,
  Layers,
} from 'lucide-react';
import { UserPreferences, MemoryItem, OwnerProfile, ChargingSettings } from '../types';
import { SessionState } from '../services/audio/LiveSession';
import { AndroidActionBridge } from '../services/androidBridge';

interface BengaliSettingsViewProps {
  preferences: UserPreferences;
  onSavePreferences: (prefs: Partial<UserPreferences>) => void;
  memories: MemoryItem[];
  onAddMemory: (key: string, content: string, category: MemoryItem['category']) => void;
  onDeleteMemory: (id: string) => void;
  onClearHistory: () => void;
  sessionState: SessionState;
  isCharging?: boolean;
  batteryLevel?: number;
  onSimulateCharging?: (charging: boolean) => void;
}

export const BengaliSettingsView: React.FC<BengaliSettingsViewProps> = ({
  preferences,
  onSavePreferences,
  memories,
  onAddMemory,
  onDeleteMemory,
  onClearHistory,
  sessionState,
  isCharging = false,
  batteryLevel = 100,
  onSimulateCharging,
}) => {
  // Navigation tabs within Settings
  const [activeSection, setActiveSection] = useState<
    | 'owner'
    | 'profile'
    | 'voice'
    | 'charging'
    | 'background'
    | 'mic'
    | 'memory'
    | 'history'
    | 'about'
  >('owner');

  // User Profile
  const [userName, setUserName] = useState(preferences.userName || 'বন্ধু');

  // Owner Profile (Jawad)
  const defaultOwner: OwnerProfile = {
    ownerName: 'জাওয়াদ',
    assistantName: 'মায়া',
    personality: 'প্রাঞ্জল, বুদ্ধিমান ও বন্ধুসুলভ ব্যক্তিগত সহকারী',
    contactWhatsApp: 'https://wa.link/mvgabh',
    contactEmail: '',
    contactPhone: '',
  };
  const [ownerProfile, setOwnerProfile] = useState<OwnerProfile>(
    preferences.ownerProfile || defaultOwner
  );

  // Voice & Theme
  const [voiceName, setVoiceName] = useState(preferences.voiceName || 'Aoede');
  const [theme, setTheme] = useState(preferences.theme || 'obsidian-purple');
  const [hapticsEnabled, setHapticsEnabled] = useState(preferences.hapticsEnabled ?? true);

  // Charging Settings
  const defaultCharging: ChargingSettings = {
    enableAlerts: true,
    voiceAnnouncement: true,
  };
  const [chargingSettings, setChargingSettings] = useState<ChargingSettings>(
    preferences.chargingSettings || defaultCharging
  );

  // Memory
  const [enableMemory, setEnableMemory] = useState(preferences.enableMemory ?? true);
  const [newKey, setNewKey] = useState('');
  const [newContent, setNewContent] = useState('');
  const [showAddMem, setShowAddMem] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const isOnline = sessionState !== 'disconnected' && sessionState !== 'error';

  const handleSaveAll = () => {
    onSavePreferences({
      userName: userName.trim(),
      voiceName,
      theme,
      hapticsEnabled,
      ownerProfile,
      chargingSettings,
      enableMemory,
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  const handleCreateMemory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKey.trim() || !newContent.trim()) return;
    onAddMemory(newKey.trim(), newContent.trim(), 'preference');
    setNewKey('');
    setNewContent('');
    setShowAddMem(false);
  };

  return (
    <div className="flex-1 flex flex-col justify-between overflow-y-auto px-4 py-3 max-w-xl mx-auto w-full z-10 space-y-3">
      {/* Top Banner */}
      <div className="flex items-center justify-between border-b border-purple-500/20 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-purple-600/30 border border-purple-500/40 flex items-center justify-center">
            <Settings className="w-4 h-4 text-pink-400" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white">সেটিংস ড্যাশবোর্ড</h2>
            <p className="text-[10px] text-neutral-400">
              জাওয়াদের প্রোফাইল, ভয়েস, চার্জিং ও কন্ট্রোল
            </p>
          </div>
        </div>

        {savedSuccess && (
          <span className="text-[11px] text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2.5 py-0.5 rounded-full flex items-center gap-1 animate-in fade-in">
            <Check className="w-3 h-3" />
            <span>সংরক্ষিত হয়েছে</span>
          </span>
        )}
      </div>

      {/* Navigation Chips for 10 Settings Sections */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar shrink-0">
        {[
          { id: 'owner', label: 'জাওয়াদের তথ্য' },
          { id: 'profile', label: 'আমার প্রোফাইল' },
          { id: 'charging', label: 'চার্জিং অ্যালার্ট' },
          { id: 'voice', label: 'ভয়েস সেটিংস' },
          { id: 'background', label: 'ব্যাকগ্রাউন্ড ফিচার' },
          { id: 'mic', label: 'মাইক্রোফোন ও সংযোগ' },
          { id: 'memory', label: 'মেমোরি' },
          { id: 'history', label: 'ইতিহাস' },
          { id: 'about', label: 'অ্যাপের তথ্য' },
        ].map((sec) => (
          <button
            key={sec.id}
            type="button"
            onClick={() => setActiveSection(sec.id as any)}
            className={`px-3 py-1.5 rounded-xl text-[11px] whitespace-nowrap transition-all border ${
              activeSection === sec.id
                ? 'bg-purple-600/30 text-pink-300 border-purple-500/60 font-semibold'
                : 'bg-neutral-900/80 text-neutral-400 border-neutral-800 hover:text-white'
            }`}
          >
            {sec.label}
          </button>
        ))}
      </div>

      {/* Section Content */}
      <div className="flex-1 space-y-3 text-xs overflow-y-auto">
        {/* 1. OWNER PROFILE (JAWAD) */}
        {activeSection === 'owner' && (
          <div className="p-3.5 rounded-2xl bg-neutral-900/80 border border-purple-500/20 space-y-3 animate-in fade-in duration-150">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-neutral-200 flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-pink-400" />
                <span>মালিক ও ক্রিয়েটর প্রোফাইল (জাওয়াদ)</span>
              </span>
              <span className="px-2 py-0.5 rounded bg-pink-500/20 text-pink-300 font-mono text-[10px] border border-pink-500/30">
                ক্রিয়েটর: জাওয়াদ
              </span>
            </div>
            <p className="text-[11px] text-neutral-400 leading-relaxed">
              মায়া সর্বদা মনে রাখে যে তাঁর ওনার এবং ক্রিয়েটর হচ্ছেন জাওয়াদ। কেউ জিজ্ঞেস করলে মায়া জাওয়াদের WhatsApp লিংক অফার করে।
            </p>

            <div className="space-y-2 pt-1">
              <div>
                <label className="text-[11px] text-neutral-400 block mb-1">
                  মালিকের নাম
                </label>
                <input
                  type="text"
                  value={ownerProfile.ownerName}
                  onChange={(e) =>
                    setOwnerProfile({ ...ownerProfile, ownerName: e.target.value })
                  }
                  className="w-full bg-neutral-950 border border-purple-500/30 rounded-xl px-3 py-2 text-white outline-none focus:border-pink-500/60"
                />
              </div>

              <div>
                <label className="text-[11px] text-neutral-400 block mb-1">
                  অফিসিয়াল WhatsApp লিংক (সরাসরি সংযোগ)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={ownerProfile.contactWhatsApp}
                    onChange={(e) =>
                      setOwnerProfile({
                        ...ownerProfile,
                        contactWhatsApp: e.target.value,
                      })
                    }
                    placeholder="https://wa.link/mvgabh"
                    className="flex-1 bg-neutral-950 border border-purple-500/30 rounded-xl px-3 py-2 text-white outline-none focus:border-pink-500/60 font-mono text-[11px]"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      AndroidActionBridge.openJawadWhatsApp(
                        ownerProfile.contactWhatsApp
                      )
                    }
                    title="লিংক পরীক্ষা করুন"
                    className="px-3 py-2 rounded-xl bg-purple-600/30 border border-purple-500/40 text-pink-300 hover:text-white flex items-center gap-1 shrink-0"
                  >
                    <span>পরীক্ষা</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] text-neutral-400 block mb-1">
                    ঐচ্ছিক ইমেইল (Email)
                  </label>
                  <input
                    type="email"
                    value={ownerProfile.contactEmail}
                    onChange={(e) =>
                      setOwnerProfile({
                        ...ownerProfile,
                        contactEmail: e.target.value,
                      })
                    }
                    placeholder="jawad@example.com"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-2.5 py-1.5 text-white outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-neutral-400 block mb-1">
                    ঐচ্ছিক ফোন নম্বর
                  </label>
                  <input
                    type="tel"
                    value={ownerProfile.contactPhone}
                    onChange={(e) =>
                      setOwnerProfile({
                        ...ownerProfile,
                        contactPhone: e.target.value,
                      })
                    }
                    placeholder="+880..."
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-2.5 py-1.5 text-white outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] text-neutral-400 block mb-1">
                  সহকারীর নাম
                </label>
                <input
                  type="text"
                  value={ownerProfile.assistantName}
                  onChange={(e) =>
                    setOwnerProfile({
                      ...ownerProfile,
                      assistantName: e.target.value,
                    })
                  }
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-2.5 py-1.5 text-white outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* 2. USER PROFILE */}
        {activeSection === 'profile' && (
          <div className="p-3.5 rounded-2xl bg-neutral-900/80 border border-purple-500/20 space-y-3 animate-in fade-in duration-150">
            <span className="font-semibold text-neutral-200 block">
              আমার প্রোফাইল
            </span>
            <div>
              <label className="text-[11px] text-neutral-400 block mb-1">
                আপনার নাম (মায়া যেভাবে আপনাকে সম্বোধন করবে)
              </label>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="যেমন: জাওয়াদ"
                className="w-full bg-neutral-950 border border-purple-500/30 rounded-xl px-3 py-2 text-white outline-none focus:border-pink-500/60"
              />
            </div>
            <div className="p-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-[11px] text-neutral-400">
              ভাষা: <strong>বাংলা (প্রাঞ্জল বাংলাদেশি বাংলা)</strong>
            </div>
          </div>
        )}

        {/* 3. CHARGING ALERTS */}
        {activeSection === 'charging' && (
          <div className="p-3.5 rounded-2xl bg-neutral-900/80 border border-purple-500/20 space-y-3 animate-in fade-in duration-150">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-neutral-200 flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-amber-400" />
                <span>স্মার্ট চার্জিং অ্যালার্ট</span>
              </span>
              <input
                type="checkbox"
                checked={chargingSettings.enableAlerts}
                onChange={(e) =>
                  setChargingSettings({
                    ...chargingSettings,
                    enableAlerts: e.target.checked,
                  })
                }
                className="accent-pink-500 w-4 h-4"
              />
            </div>

            <p className="text-[11px] text-neutral-400 leading-relaxed">
              ফোন চার্জে দিলে বা চার্জার খুলে নিলে মায়া স্বয়ংক্রিয়ভাবে ঘোষণা করবে।
            </p>

            {/* Current Real Charging Status */}
            <div className="p-3 rounded-xl bg-neutral-950 border border-purple-500/30 space-y-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-neutral-400">বর্তমান চার্জ অবস্থা:</span>
                <span
                  className={`font-semibold flex items-center gap-1 ${
                    isCharging ? 'text-emerald-400' : 'text-amber-400'
                  }`}
                >
                  <BatteryCharging className="w-3.5 h-3.5" />
                  <span>{isCharging ? 'চার্জ হচ্ছে' : 'আনপ্লাগড (Unplugged)'}</span>
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-neutral-400">ব্যাটারি লেভেল:</span>
                <span className="text-white font-mono">{batteryLevel}%</span>
              </div>
            </div>

            <div className="space-y-2 pt-1">
              <label className="flex items-center justify-between p-2 rounded-xl bg-neutral-950 border border-neutral-800 cursor-pointer">
                <div>
                  <p className="font-medium text-neutral-200">
                    বাংলা ভয়েস ঘোষণা
                  </p>
                  <p className="text-[10px] text-neutral-400">
                    "জাওয়াদ, তোমার ফোনে চার্জ দেওয়া হচ্ছে।"
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={chargingSettings.voiceAnnouncement}
                  onChange={(e) =>
                    setChargingSettings({
                      ...chargingSettings,
                      voiceAnnouncement: e.target.checked,
                    })
                  }
                  className="accent-pink-500 w-4 h-4"
                />
              </label>

              {/* Simulation button for desktop testing */}
              {onSimulateCharging && (
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => onSimulateCharging(!isCharging)}
                    className="w-full py-1.5 rounded-lg bg-neutral-950 border border-neutral-800 text-[11px] text-neutral-300 hover:text-white hover:border-purple-500/40"
                  >
                    চার্জিং পরিবর্তন পরীক্ষা করুন (টগল {isCharging ? 'আনপ্লাগ' : 'প্লাগ'})
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 4. VOICE SETTINGS */}
        {activeSection === 'voice' && (
          <div className="p-3.5 rounded-2xl bg-neutral-900/80 border border-purple-500/20 space-y-3 animate-in fade-in duration-150">
            <span className="font-semibold text-neutral-200 flex items-center gap-1.5">
              <Volume2 className="w-4 h-4 text-pink-400" />
              <span>মায়ার ভয়েস রূপ (জেমিনি লাইভ)</span>
            </span>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'Aoede', name: 'Aoede', label: 'দীপ্তিময় ও স্পষ্ট' },
                { id: 'Kore', name: 'Kore', label: 'কোমল ও উষ্ণ' },
                { id: 'Fenrir', name: 'Fenrir', label: 'গম্ভীর ও দৃঢ়' },
                { id: 'Puck', name: 'Puck', label: 'চঞ্চল ও প্রাণবন্ত' },
              ].map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setVoiceName(v.id)}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    voiceName === v.id
                      ? 'bg-purple-600/30 border-pink-500 text-white font-medium'
                      : 'bg-neutral-950 border-neutral-800 text-neutral-400'
                  }`}
                >
                  <p className="font-semibold text-white">{v.name}</p>
                  <p className="text-[10px] text-neutral-400 mt-0.5">{v.label}</p>
                </button>
              ))}
            </div>

            <label className="flex items-center justify-between p-2 rounded-xl bg-neutral-950 border border-neutral-800 cursor-pointer mt-2">
              <div>
                <p className="font-medium text-neutral-200">হ্যাপটিক টাচ ফিডব্যাক</p>
                <p className="text-[10px] text-neutral-400">বাটন ট্যাপে সূক্ষ্ম কম্পন</p>
              </div>
              <input
                type="checkbox"
                checked={hapticsEnabled}
                onChange={(e) => setHapticsEnabled(e.target.checked)}
                className="accent-pink-500 w-4 h-4"
              />
            </label>
          </div>
        )}

        {/* 5. BACKGROUND OPERATION & APK INTEGRATION */}
        {activeSection === 'background' && (
          <div className="p-3.5 rounded-2xl bg-neutral-900/80 border border-purple-500/20 space-y-2.5 animate-in fade-in duration-150">
            <span className="font-semibold text-neutral-200 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-cyan-400" />
              <span>ব্যাকগ্রাউন্ড ফিচার ও অ্যান্ড্রয়েড এপিকে প্রস্তুতি</span>
            </span>
            <p className="text-[11px] text-neutral-400 leading-relaxed">
              অ্যাপটি ভবিষ্যতে অ্যান্ড্রয়েড এপিকে (APK) হিসেবে প্যাকেজ করার জন্য সম্পূর্ণ প্রস্তুত।
            </p>
            <div className="space-y-1.5 text-[11px] p-2.5 rounded-xl bg-neutral-950 border border-neutral-800">
              <p className="text-pink-300 font-medium">• অ্যান্ড্রয়েড ফোরগ্রাউন্ড সার্ভিস (Foreground Service):</p>
              <p className="text-neutral-400">
                স্ক্রিন বন্ধ থাকলেও চার্জিং স্টেট এবং ভয়েস সহকারী ব্যাকগ্রাউন্ডে বজায় রাখতে ব্যবহৃত হয়।
              </p>
              <p className="text-cyan-300 font-medium pt-1">• ব্যাটারি রিসিভার (BroadcastReceiver):</p>
              <p className="text-neutral-400">
                ACTION_POWER_CONNECTED ও ACTION_POWER_DISCONNECTED সিস্টেম ইভেন্ট হ্যান্ডলার সংহত।
              </p>
            </div>
          </div>
        )}

        {/* 6. MIC & CONNECTION */}
        {activeSection === 'mic' && (
          <div className="p-3.5 rounded-2xl bg-neutral-900/80 border border-purple-500/20 space-y-2.5 animate-in fade-in duration-150">
            <span className="font-semibold text-neutral-200 block">
              মাইক্রোফোন অনুমতি ও সংযোগের অবস্থা
            </span>
            <div className="flex items-center justify-between text-[11px] py-1 border-b border-neutral-800">
              <span className="text-neutral-400 flex items-center gap-1.5">
                <Wifi className="w-3.5 h-3.5 text-purple-400" />
                <span>জেমিনি লাইভ সংযোগ:</span>
              </span>
              <span
                className={`font-semibold ${
                  isOnline ? 'text-emerald-400' : 'text-neutral-400'
                }`}
              >
                {isOnline ? 'অনলাইন (সক্রিয়)' : 'অফলাইন'}
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px] py-1">
              <span className="text-neutral-400 flex items-center gap-1.5">
                <Mic className="w-3.5 h-3.5 text-pink-400" />
                <span>মাইক্রোফোন অনুমতি:</span>
              </span>
              <span className="text-cyan-400 font-semibold">Web Audio প্রস্তুত</span>
            </div>
          </div>
        )}

        {/* 7. MEMORY MANAGEMENT */}
        {activeSection === 'memory' && (
          <div className="p-3.5 rounded-2xl bg-neutral-900/80 border border-purple-500/20 space-y-2.5 animate-in fade-in duration-150">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-neutral-200 flex items-center gap-1.5">
                <Brain className="w-4 h-4 text-pink-400" />
                <span>মেমোরি ম্যানেজমেন্ট ({memories.length})</span>
              </span>
              <input
                type="checkbox"
                checked={enableMemory}
                onChange={(e) => setEnableMemory(e.target.checked)}
                className="accent-pink-500 w-4 h-4"
              />
            </div>

            {enableMemory && (
              <div className="pt-1 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[11px] text-neutral-300">সংরক্ষিত মেমোরি</span>
                  <button
                    type="button"
                    onClick={() => setShowAddMem(!showAddMem)}
                    className="px-2 py-0.5 rounded bg-purple-600/30 text-pink-300 border border-purple-500/30 text-[10px] flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>নতুন মেমোরি</span>
                  </button>
                </div>

                {showAddMem && (
                  <form
                    onSubmit={handleCreateMemory}
                    className="p-2.5 rounded-xl bg-neutral-950 border border-purple-500/30 space-y-2"
                  >
                    <input
                      type="text"
                      placeholder="মেমোরি টাইটেল"
                      value={newKey}
                      onChange={(e) => setNewKey(e.target.value)}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded px-2 py-1 text-white text-xs"
                    />
                    <input
                      type="text"
                      placeholder="তথ্য"
                      value={newContent}
                      onChange={(e) => setNewContent(e.target.value)}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded px-2 py-1 text-white text-xs"
                    />
                    <div className="flex justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => setShowAddMem(false)}
                        className="px-2 py-1 text-neutral-400 text-xs"
                      >
                        বাতিল
                      </button>
                      <button
                        type="submit"
                        className="px-3 py-1 bg-pink-600 text-white rounded text-xs"
                      >
                        সংরক্ষণ
                      </button>
                    </div>
                  </form>
                )}

                <div className="space-y-1.5 max-h-36 overflow-y-auto">
                  {memories.map((m) => (
                    <div
                      key={m.id}
                      className="p-2 rounded-xl bg-neutral-950 border border-neutral-800 flex items-center justify-between text-[11px]"
                    >
                      <div>
                        <span className="font-semibold text-pink-300">{m.key}: </span>
                        <span className="text-neutral-300">{m.content}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => onDeleteMemory(m.id)}
                        className="p-1 text-neutral-500 hover:text-red-400"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 8. CONVERSATION HISTORY */}
        {activeSection === 'history' && (
          <div className="p-3.5 rounded-2xl bg-neutral-900/80 border border-purple-500/20 space-y-3 animate-in fade-in duration-150">
            <span className="font-semibold text-neutral-200 block">
              কথোপকথনের ইতিহাস
            </span>
            <p className="text-[11px] text-neutral-400">
              সমস্ত পূর্ববর্তী চ্যাট ইতিহাস লোকাল স্টোরেজে নিরাপদে সংরক্ষিত আছে।
            </p>
            <button
              type="button"
              onClick={() => {
                if (confirm('আপনি কি নিশ্চিত যে সমস্ত কথোপকথন ইতিহাস মুছে ফেলতে চান?')) {
                  onClearHistory();
                }
              }}
              className="w-full py-2 rounded-xl bg-red-500/10 text-red-300 border border-red-500/20 text-xs font-medium"
            >
              সব চ্যাট ইতিহাস মুছুন
            </button>
          </div>
        )}

        {/* 9. ABOUT APP */}
        {activeSection === 'about' && (
          <div className="p-3.5 rounded-2xl bg-neutral-900/80 border border-purple-500/20 space-y-2 text-[11px] text-neutral-400 leading-relaxed animate-in fade-in duration-150">
            <p className="font-semibold text-neutral-200 text-xs">
              অ্যাপের তথ্য ও ক্রিয়েটর
            </p>
            <p>• নাম: <strong>মায়া এআই (Maya AI)</strong></p>
            <p>• ক্রিয়েটর ও মালিক: <strong>জাওয়াদ (Jawad)</strong></p>
            <p>• সংস্করণ: <strong>২.০ প্রিমিয়াম এডিশন</strong></p>
            <p>• যোগাযোগ: <strong>https://wa.link/mvgabh</strong></p>
          </div>
        )}
      </div>

      {/* Save Button */}
      <div className="pt-1">
        <button
          type="button"
          onClick={handleSaveAll}
          className="w-full py-2.5 rounded-2xl bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 text-white font-semibold text-xs shadow-lg shadow-pink-500/25 active:scale-95 transition-all"
        >
          সেটিংস সংরক্ষণ করুন
        </button>
      </div>
    </div>
  );
};
