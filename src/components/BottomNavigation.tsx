import React from 'react';
import { Home, MessageSquare, Mic, History, Settings } from 'lucide-react';

export type NavTab = 'home' | 'chat' | 'voice' | 'history' | 'settings';

interface BottomNavigationProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  isVoiceActive?: boolean;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({
  activeTab,
  onTabChange,
  isVoiceActive = false,
}) => {
  const tabs: { id: NavTab; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'home', label: 'হোম', icon: Home },
    { id: 'chat', label: 'চ্যাট', icon: MessageSquare },
    { id: 'voice', label: 'ভয়েস', icon: Mic },
    { id: 'history', label: 'ইতিহাস', icon: History },
    { id: 'settings', label: 'সেটিংস', icon: Settings },
  ];

  return (
    <nav className="shrink-0 w-full max-w-xl mx-auto px-4 pb-3 pt-1 z-30 select-none">
      <div className="bg-neutral-900/95 border border-purple-500/30 rounded-3xl p-1.5 backdrop-blur-2xl shadow-2xl shadow-purple-950/50 flex items-center justify-between">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const isVoiceTab = tab.id === 'voice';

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className={`flex-1 py-1.5 px-2 rounded-2xl flex flex-col items-center justify-center transition-all duration-200 cursor-pointer relative ${
                isActive
                  ? 'bg-gradient-to-b from-purple-600/30 to-pink-600/20 text-white shadow-sm border border-purple-500/40'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              {/* Highlight Glow Pip */}
              {isActive && (
                <span className="absolute -top-1 w-6 h-1 rounded-full bg-gradient-to-r from-cyan-400 to-pink-500 shadow-sm shadow-pink-500/50" />
              )}

              {/* Special Animated Ring for Voice Tab if voice is active */}
              <div className="relative">
                <Icon
                  className={`w-5 h-5 transition-transform duration-200 ${
                    isActive ? 'scale-110 text-pink-300' : 'text-neutral-400'
                  }`}
                />
                {isVoiceTab && isVoiceActive && (
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                )}
              </div>

              <span
                className={`text-[10px] mt-0.5 font-medium transition-colors ${
                  isActive ? 'text-white font-semibold' : 'text-neutral-400'
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
