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
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-medium">
      {status === 'saving' && (
        <>
          <Loader2 className="w-3.5 h-3.5 text-blue-400 animate-spin" />
          <span className="text-blue-400">Saving draft...</span>
        </>
      )}

      {status === 'saved' && (
        <>
          <Check className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-slate-300">
            {lastSavedAt ? `Saved ${lastSavedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}` : 'All changes saved'}
          </span>
        </>
      )}

      {status === 'unsaved' && (
        <>
          <Cloud className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-amber-400">Unsaved changes</span>
        </>
      )}

      {status === 'error' && (
        <>
          <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
          <span className="text-rose-400">Save failed (offline)</span>
        </>
      )}
    </div>
  );
}
