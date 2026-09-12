'use client';

import React, { useState } from 'react';
import { Plus, Trash2, Box, Sparkles } from 'lucide-react';

export interface ClassItem {
  name: string;
  responsibility: string;
}

interface ClassListEditorProps {
  classes: ClassItem[];
  onChange: (updatedClasses: ClassItem[]) => void;
  disabled?: boolean;
}

export function ClassListEditor({ classes, onChange, disabled }: ClassListEditorProps) {
  const [newClassName, setNewClassName] = useState('');
  const [newClassResp, setNewClassResp] = useState('');

  const handleAddClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassName.trim() || !newClassResp.trim()) return;

    const updated = [
      ...classes,
      { name: newClassName.trim(), responsibility: newClassResp.trim() },
    ];
    onChange(updated);
    setNewClassName('');
    setNewClassResp('');
  };

  const handleRemoveClass = (index: number) => {
    const updated = classes.filter((_, i) => i !== index);
    onChange(updated);
  };

  const handleUpdateItem = (index: number, field: 'name' | 'responsibility', value: string) => {
    const updated = classes.map((item, i) => {
      if (i === index) {
        return { ...item, [field]: value };
      }
      return item;
    });
    onChange(updated);
  };

  return (
    <div className="space-y-4">
      {/* Existing Classes List */}
      <div className="space-y-3">
        {classes.length === 0 ? (
          <div className="p-6 rounded-xl border border-dashed border-slate-800 bg-slate-900/40 text-center space-y-2">
            <Box className="w-8 h-8 text-slate-600 mx-auto" />
            <p className="text-xs font-semibold text-slate-400">No classes defined yet</p>
            <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
              Add domain entities, managers, controllers, or strategy interfaces below.
            </p>
          </div>
        ) : (
          classes.map((cls, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800/90 hover:border-slate-750 transition-colors space-y-2"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-1">
                  <div className="w-5 h-5 rounded bg-blue-500/10 text-blue-400 flex items-center justify-center font-mono text-[10px] font-bold">
                    C
                  </div>
                  <input
                    type="text"
                    value={cls.name}
                    disabled={disabled}
                    onChange={(e) => handleUpdateItem(idx, 'name', e.target.value)}
                    placeholder="e.g. ParkingLot, SpotAssignmentStrategy"
                    className="bg-transparent text-xs font-bold text-slate-100 placeholder-slate-600 focus:outline-none border-b border-transparent focus:border-blue-500 px-1 py-0.5 w-full"
                  />
                </div>
                {!disabled && (
                  <button
                    type="button"
                    onClick={() => handleRemoveClass(idx)}
                    className="text-slate-500 hover:text-rose-400 p-1 rounded transition-colors"
                    title="Remove class"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <textarea
                value={cls.responsibility}
                disabled={disabled}
                onChange={(e) => handleUpdateItem(idx, 'responsibility', e.target.value)}
                placeholder="Describe single responsibility (e.g. Manages parking spot state, allocates nearest empty spot matching vehicle dimensions)"
                rows={2}
                className="w-full text-xs text-slate-300 bg-slate-950/60 rounded-lg border border-slate-800/80 p-2 placeholder-slate-600 focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/40 resize-none leading-relaxed"
              />
            </div>
          ))
        )}
      </div>

      {/* Add Class Form */}
      {!disabled && (
        <form onSubmit={handleAddClass} className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
          <div className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <Plus className="w-3.5 h-3.5 text-blue-400" />
            <span>Add New Class / Interface</span>
          </div>

          <div className="grid grid-cols-1 gap-2.5">
            <input
              type="text"
              value={newClassName}
              onChange={(e) => setNewClassName(e.target.value)}
              placeholder="Class or Interface Name (e.g., GateController)"
              className="w-full text-xs bg-slate-950 text-slate-100 rounded-lg border border-slate-800 p-2.5 placeholder-slate-600 focus:outline-none focus:border-blue-500 font-mono"
            />
            <textarea
              value={newClassResp}
              onChange={(e) => setNewClassResp(e.target.value)}
              placeholder="Core responsibility statement (SRP adherence)"
              rows={2}
              className="w-full text-xs bg-slate-950 text-slate-100 rounded-lg border border-slate-800 p-2.5 placeholder-slate-600 focus:outline-none focus:border-blue-500 resize-none"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={!newClassName.trim() || !newClassResp.trim()}
              className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:pointer-events-none text-white font-medium text-xs flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Class</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
