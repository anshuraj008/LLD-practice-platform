'use client';

import React from 'react';
import { Check, Loader2, AlertTriangle, Cloud } from 'lucide-react';

export type SaveState = 'saved' | 'saving' | 'unsaved' | 'error';

interface AutosaveStatusProps {
  status: SaveState;
  lastSavedAt?: Date | null;
}

export function AutosaveStatus({ status, lastSavedAt }: AutosaveStatusProps) {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-white/[0.08] text-xs font-medium">
      {status === 'saving' && (
        <>
          <Loader2 className="w-3.5 h-3.5 text-violet-400 animate-spin" />
          <span className="text-violet-300 font-mono text-[11px]">Saving...</span>
        </>
      )}

      {status === 'saved' && (
        <>
          <Check className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-slate-300 font-mono text-[11px]">
            {lastSavedAt ? `Saved ${lastSavedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}` : 'Draft synced'}
          </span>
        </>
      )}

      {status === 'unsaved' && (
        <>
          <Cloud className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-amber-300 font-mono text-[11px]">Unsaved</span>
        </>
      )}

      {status === 'error' && (
        <>
          <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
          <span className="text-rose-300 font-mono text-[11px]">Save error</span>
        </>
      )}
    </div>
  );
}
