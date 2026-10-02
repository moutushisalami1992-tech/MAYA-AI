import React, { useState } from 'react';
import {
  X,
  User,
  Sliders,
  Volume2,
  Bookmark,
  Check,
  Globe,
  Brain,
  Trash2,
  Plus,
  Shield,
  Palette,
  Sparkles,
  Info,
} from 'lucide-react';
import { UserPreferences, MemoryItem } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  preferences: UserPreferences;
  onSavePreferences: (prefs: Partial<UserPreferences>) => void;
  memories: MemoryItem[];
  onAddMemory: (key: string, content: string, category: MemoryItem['category']) => void;
  onDeleteMemory: (id: string) => void;
  onClearHistory: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  preferences,
  onSavePreferences,
  memories,
  onAddMemory,
  onDeleteMemory,
  onClearHistory,
}) => {
  const [activeTab, setActiveTab] = useState<
    'general' | 'voice' | 'memory' | 'theme' | 'about'
  >('general');

  const [userName, setUserName] = useState(preferences.userName);
  const [preferredLanguage, setPreferredLanguage] = useState(
    preferences.preferredLanguage
  );
  const [tone, setTone] = useState(preferences.tone);
  const [voiceName, setVoiceName] = useState(preferences.voiceName);
  const [enableMemory, setEnableMemory] = useState(preferences.enableMemory);
  const [animationLevel, setAnimationLevel] = useState(
    preferences.animationLevel
  );
  const [hapticsEnabled, setHapticsEnabled] = useState(
    preferences.hapticsEnabled
  );
  const [theme, setTheme] = useState(preferences.theme);

  // New memory input
  const [newKey, setNewKey] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] =
    useState<MemoryItem['category']>('preference');
  const [showAddMemory, setShowAddMemory] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    onSavePreferences({
      userName: userName.trim(),
      preferredLanguage,
      tone,
      voiceName,
      enableMemory,
      animationLevel,
      hapticsEnabled,
      theme,
    });
    setSavedNotice(true);
    setTimeout(() => {
      setSavedNotice(false);
      onClose();
    }, 400);
  };

  const handleCreateMemory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKey.trim() || !newContent.trim()) return;
    onAddMemory(newKey.trim(), newContent.trim(), newCategory);
    setNewKey('');
    setNewContent('');
    setShowAddMemory(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md">
      <div className="bg-neutral-900 border border-purple-500/30 rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl shadow-purple-950/40 flex flex-col max-h-[88vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-4 sm:px-6 border-b border-purple-500/20 bg-neutral-950/60 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-pink-400" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-tight">
                Maya AI 2.0 Premium Settings
              </h2>
              <p className="text-[10px] text-neutral-400">
                Personalization, Voice, Memory & Performance
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-neutral-800 bg-neutral-950/30 px-4 overflow-x-auto gap-1 text-xs shrink-0 py-1.5">
          <button
            type="button"
            onClick={() => setActiveTab('general')}
            className={`px-3 py-1.5 rounded-xl font-medium transition-all ${
              activeTab === 'general'
                ? 'bg-purple-600/30 text-pink-300 border border-purple-500/40'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            General
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('voice')}
            className={`px-3 py-1.5 rounded-xl font-medium transition-all ${
              activeTab === 'voice'
                ? 'bg-purple-600/30 text-pink-300 border border-purple-500/40'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Voice & Audio
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('memory')}
            className={`px-3 py-1.5 rounded-xl font-medium transition-all ${
              activeTab === 'memory'
                ? 'bg-purple-600/30 text-pink-300 border border-purple-500/40'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Memory ({memories.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('theme')}
            className={`px-3 py-1.5 rounded-xl font-medium transition-all ${
              activeTab === 'theme'
                ? 'bg-purple-600/30 text-pink-300 border border-purple-500/40'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            UI & Theme
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('about')}
            className={`px-3 py-1.5 rounded-xl font-medium transition-all ${
              activeTab === 'about'
                ? 'bg-purple-600/30 text-pink-300 border border-purple-500/40'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            About & Privacy
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1 text-xs">
          {/* 1. GENERAL TAB */}
          {activeTab === 'general' && (
            <div className="space-y-4">
              <div>
                <label className="flex items-center gap-1.5 font-semibold text-neutral-200 mb-1.5">
                  <User className="w-3.5 h-3.5 text-purple-400" />
                  <span>Your Name</span>
                </label>
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="e.g. Moutushi"
                  className="w-full bg-neutral-950 border border-neutral-800 focus:border-pink-500/60 rounded-xl px-3 py-2 text-neutral-100 outline-none transition-colors"
                />
              </div>

              <div>
                <label className="flex items-center gap-1.5 font-semibold text-neutral-200 mb-1.5">
                  <Globe className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Spoken Voice Language</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'auto', label: 'Auto Detect (স্বয়ংক্রিয়)' },
                    { id: 'bn', label: '🇧🇩 বাংলা (Bengali)' },
                    { id: 'hi', label: '🇮🇳 हिन्दी (Hindi)' },
                    { id: 'en', label: '🌐 English (Natural)' },
                  ].map((lang) => (
                    <button
                      key={lang.id}
                      type="button"
                      onClick={() => setPreferredLanguage(lang.id as any)}
                      className={`p-2 rounded-xl border text-left transition-all ${
                        preferredLanguage === lang.id
                          ? 'bg-purple-600/25 border-pink-500/50 text-white font-semibold'
                          : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-neutral-200'
                      }`}
                    >
                      {lang.label}
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-neutral-500 mt-1">
                  Maya automatically recognizes language changes in real-time.
                </p>
              </div>

              <div>
                <label className="font-semibold text-neutral-200 block mb-1.5">
                  Conversation Tone
                </label>
                <select
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 focus:border-pink-500/60 rounded-xl px-3 py-2 text-neutral-200 outline-none"
                >
                  <option value="Intelligent, friendly, helpful, confident, natural">
                    Maya 2.0 Default: Intelligent, friendly, and natural
                  </option>
                  <option value="Direct, concise, and executive">
                    Direct, concise, and focused
                  </option>
                  <option value="Warm, encouraging, and mentor-like">
                    Warm, thoughtful, and encouraging
                  </option>
                </select>
              </div>
            </div>
          )}

          {/* 2. VOICE & AUDIO TAB */}
          {activeTab === 'voice' && (
            <div className="space-y-4">
              <div>
                <label className="flex items-center gap-1.5 font-semibold text-neutral-200 mb-1.5">
                  <Volume2 className="w-3.5 h-3.5 text-pink-400" />
                  <span>Gemini Live Voice Profile</span>
                </label>
                <div className="space-y-2">
                  {[
                    { id: 'Aoede', name: 'Aoede', desc: 'Vibrant, youthful, confident & articulate' },
                    { id: 'Kore', name: 'Kore', desc: 'Warm, poised, natural & soothing' },
                    { id: 'Fenrir', name: 'Fenrir', desc: 'Deep, crisp, executive & authoritative' },
                    { id: 'Puck', name: 'Puck', desc: 'Playful, bright & dynamic' },
                  ].map((v) => (
                    <label
                      key={v.id}
                      onClick={() => setVoiceName(v.id)}
                      className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition-all ${
                        voiceName === v.id
                          ? 'bg-purple-600/25 border-pink-500/50 text-white'
                          : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                      }`}
                    >
                      <div>
                        <p className="font-medium text-white">{v.name}</p>
                        <p className="text-[11px] text-neutral-400">{v.desc}</p>
                      </div>
                      <input
                        type="radio"
                        name="voiceName"
                        checked={voiceName === v.id}
                        onChange={() => setVoiceName(v.id)}
                        className="accent-pink-500"
                      />
                    </label>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t border-neutral-800/80">
                <label className="flex items-center justify-between p-2 rounded-xl bg-neutral-950 border border-neutral-800 cursor-pointer">
                  <div>
                    <p className="font-medium text-neutral-200">
                      Haptic Touch Feedback
                    </p>
                    <p className="text-[11px] text-neutral-500">
                      Subtle tactile vibration on mobile button presses
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={hapticsEnabled}
                    onChange={(e) => setHapticsEnabled(e.target.checked)}
                    className="accent-pink-500 w-4 h-4"
                  />
                </label>
              </div>
            </div>
          )}

          {/* 3. MEMORY TAB */}
          {activeTab === 'memory' && (
            <div className="space-y-4">
              <div className="p-3 rounded-2xl bg-purple-950/30 border border-purple-500/30 flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-1.5 font-semibold text-pink-300">
                    <Brain className="w-4 h-4" />
                    <span>Optional Personal Memory</span>
                  </div>
                  <p className="text-[11px] text-neutral-400 mt-1">
                    Maya only saves information you explicitly approve. No secret tracking.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={enableMemory}
                  onChange={(e) => setEnableMemory(e.target.checked)}
                  className="accent-pink-500 w-4 h-4 mt-1"
                />
              </div>

              {enableMemory && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-neutral-200">
                      Approved Memories ({memories.length})
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowAddMemory(!showAddMemory)}
                      className="px-2.5 py-1 rounded-lg bg-purple-600/30 hover:bg-purple-600/50 text-pink-300 border border-purple-500/30 flex items-center gap-1 text-[11px]"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add Memory</span>
                    </button>
                  </div>

                  {showAddMemory && (
                    <form
                      onSubmit={handleCreateMemory}
                      className="p-3 rounded-xl bg-neutral-950 border border-purple-500/30 space-y-2"
                    >
                      <input
                        type="text"
                        placeholder="Memory Key (e.g. Favorite tea, Work project)"
                        value={newKey}
                        onChange={(e) => setNewKey(e.target.value)}
                        className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-neutral-100 outline-none text-xs"
                      />
                      <textarea
                        placeholder="What should Maya remember?"
                        value={newContent}
                        onChange={(e) => setNewContent(e.target.value)}
                        rows={2}
                        className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-neutral-100 outline-none text-xs"
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setShowAddMemory(false)}
                          className="px-2 py-1 text-neutral-400 text-xs"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-3 py-1 bg-pink-600 text-white rounded-lg text-xs font-medium"
                        >
                          Save
                        </button>
                      </div>
                    </form>
                  )}

                  {memories.length === 0 ? (
                    <div className="text-center py-6 text-neutral-500 text-xs">
                      No memories saved yet. Maya will ask before remembering preferences.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {memories.map((m) => (
                        <div
                          key={m.id}
                          className="p-2.5 rounded-xl bg-neutral-950 border border-neutral-800 flex items-start justify-between gap-2"
                        >
                          <div>
                            <p className="font-semibold text-pink-300 text-[11px]">
                              {m.key}
                            </p>
                            <p className="text-neutral-300 mt-0.5">{m.content}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => onDeleteMemory(m.id)}
                            title="Delete memory"
                            className="p-1 text-neutral-500 hover:text-red-400 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* 4. THEME & UI TAB */}
          {activeTab === 'theme' && (
            <div className="space-y-4">
              <div>
                <label className="flex items-center gap-1.5 font-semibold text-neutral-200 mb-1.5">
                  <Palette className="w-3.5 h-3.5 text-purple-400" />
                  <span>Color Theme</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setTheme('obsidian-purple')}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      theme === 'obsidian-purple'
                        ? 'bg-purple-950/40 border-pink-500 text-white font-medium'
                        : 'bg-neutral-950 border-neutral-800 text-neutral-400'
                    }`}
                  >
                    <p className="font-medium text-white">Obsidian & Purple</p>
                    <p className="text-[10px] text-neutral-500 mt-0.5">
                      Deep black with neon purple & rose accents
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTheme('neon-rose')}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      theme === 'neon-rose'
                        ? 'bg-pink-950/40 border-pink-500 text-white font-medium'
                        : 'bg-neutral-950 border-neutral-800 text-neutral-400'
                    }`}
                  >
                    <p className="font-medium text-white">Neon Rose Glow</p>
                    <p className="text-[10px] text-neutral-500 mt-0.5">
                      Vibrant magenta & cosmic glow
                    </p>
                  </button>
                </div>
              </div>

              <div>
                <label className="font-semibold text-neutral-200 block mb-1.5">
                  Animation Level
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAnimationLevel('full')}
                    className={`p-2.5 rounded-xl border text-left ${
                      animationLevel === 'full'
                        ? 'bg-purple-600/25 border-pink-500 text-white'
                        : 'bg-neutral-950 border-neutral-800 text-neutral-400'
                    }`}
                  >
                    <p className="font-medium text-white">Full Smooth (60fps)</p>
                    <p className="text-[10px] text-neutral-500">Fluid orbs & waveforms</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAnimationLevel('reduced')}
                    className={`p-2.5 rounded-xl border text-left ${
                      animationLevel === 'reduced'
                        ? 'bg-purple-600/25 border-pink-500 text-white'
                        : 'bg-neutral-950 border-neutral-800 text-neutral-400'
                    }`}
                  >
                    <p className="font-medium text-white">Battery Saver</p>
                    <p className="text-[10px] text-neutral-500">Reduced effects for phones</p>
                  </button>
                </div>
              </div>

              <div className="pt-2 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => {
                    if (confirm('Clear all conversation history?')) {
                      onClearHistory();
                    }
                  }}
                  className="w-full py-2 px-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-300 border border-red-500/30 font-medium flex items-center justify-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear Conversation History</span>
                </button>
              </div>
            </div>
          )}

          {/* 5. ABOUT TAB */}
          {activeTab === 'about' && (
            <div className="space-y-3 leading-relaxed">
              <div className="p-3 rounded-2xl bg-neutral-950 border border-purple-500/20 space-y-1">
                <p className="font-semibold text-white">Maya AI — Version 2.0.0 Premium</p>
                <p className="text-neutral-400 text-[11px]">
                  Engineered with real-time bidirectional Gemini Live API, streaming PCM16 16kHz mic audio to 24kHz Web Audio gapless playback.
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-1">
                <p className="font-semibold text-pink-300 flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5" />
                  <span>Security & Privacy</span>
                </p>
                <p className="text-neutral-400 text-[11px]">
                  All conversational memories and chat histories are stored strictly within your browser (localStorage). No private keys or contacts are shared or sold.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-neutral-800/80 bg-neutral-950/80 flex items-center justify-between shrink-0">
          <span className="text-[11px] text-neutral-400">
            {savedNotice ? '✓ Preferences updated' : 'Maya 2.0 Premium'}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-neutral-300 hover:text-white bg-neutral-800 hover:bg-neutral-700 text-xs font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-semibold hover:from-purple-500 hover:to-pink-500 shadow-md shadow-pink-500/20 active:scale-95 transition-all"
            >
              Save Preferences
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
