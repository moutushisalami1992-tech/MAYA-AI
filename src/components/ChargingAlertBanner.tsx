import React, { useEffect, useState } from 'react';
import { Zap, ZapOff, BatteryCharging, X } from 'lucide-react';

interface ChargingAlertBannerProps {
  isCharging: boolean;
  batteryLevel: number;
  lastAnnouncement: string | null;
  onDismiss: () => void;
}

export const ChargingAlertBanner: React.FC<ChargingAlertBannerProps> = ({
  isCharging,
  batteryLevel,
  lastAnnouncement,
  onDismiss,
}) => {
  if (!lastAnnouncement) return null;

  return (
    <div className="fixed top-18 inset-x-4 max-w-sm mx-auto z-50 animate-in fade-in slide-in-from-top-4 duration-300">
      <div
        className={`p-3.5 rounded-2xl border backdrop-blur-xl shadow-2xl flex items-center justify-between gap-3 text-xs ${
          isCharging
            ? 'bg-emerald-950/90 border-emerald-500/40 text-emerald-200 shadow-emerald-500/20'
            : 'bg-neutral-900/95 border-amber-500/40 text-amber-200 shadow-amber-500/20'
        }`}
      >
        <div className="flex items-center gap-2.5 truncate">
          <div
            className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${
              isCharging
                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                : 'bg-amber-500/20 border-amber-500/40 text-amber-400'
            }`}
          >
            {isCharging ? (
              <Zap className="w-4 h-4 animate-bounce" />
            ) : (
              <ZapOff className="w-4 h-4" />
            )}
          </div>
          <div className="truncate">
            <p className="font-semibold truncate">{lastAnnouncement}</p>
            <p className="text-[10px] opacity-75 font-mono">
              ব্যাটারি লেভেল: {batteryLevel}% • {isCharging ? 'চার্জ হচ্ছে' : 'আনপ্লাগড'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onDismiss}
          className="p-1 rounded text-neutral-400 hover:text-white"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
