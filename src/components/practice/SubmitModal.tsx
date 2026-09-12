'use client';

import React from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Send, Loader2, X, ShieldCheck } from 'lucide-react';
import { AttemptDraft } from '@/domain/types/attempt';

interface SubmitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isSubmitting: boolean;
  draft: AttemptDraft;
}

export function SubmitModal({
  isOpen,
  onClose,
  onConfirm,
  isSubmitting,
  draft,
}: SubmitModalProps) {
  if (!isOpen) return null;

  const checks = [
    {
      label: 'Scope & Assumptions specified',
      passed: draft.assumptions.trim().length >= 15,
      detail: `${draft.assumptions.trim().length} chars (minimum 15)`,
    },
    {
      label: 'At least 2 distinct classes defined',
      passed: draft.classes.length >= 2,
      detail: `${draft.classes.length} classes defined`,
    },
    {
      label: 'Class responsibilities provided',
      passed: draft.classes.every((c) => c.responsibility.trim().length >= 10),
      detail: draft.classes.every((c) => c.responsibility.trim().length >= 10)
        ? 'All responsibilities valid'
        : 'Some class responsibilities are too short',
    },
    {
      label: 'Relationships & Interfaces detailed',
      passed: draft.relationships.trim().length >= 15,
      detail: `${draft.relationships.trim().length} chars (minimum 15)`,
    },
    {
      label: 'Main Execution Flow explained',
      passed: draft.mainFlow.trim().length >= 20,
      detail: `${draft.mainFlow.trim().length} chars (minimum 20)`,
    },
    {
      label: 'Edge Cases & Concurrency considered',
      passed: draft.edgeCases.trim().length >= 15,
      detail: `${draft.edgeCases.trim().length} chars (minimum 15)`,
    },
    {
      label: 'Trade-offs & Extensibility justified',
      passed: draft.tradeOffs.trim().length >= 15,
      detail: `${draft.tradeOffs.trim().length} chars (minimum 15)`,
    },
  ];

  const hasCriticalFailure = checks.some((c) => !c.passed);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Pre-Submission Quality Check</h3>
              <p className="text-xs text-slate-400">Verifying design completeness before snapshot</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Completeness Checklist */}
        <div className="space-y-2.5">
          {checks.map((c, idx) => (
            <div
              key={idx}
              className={`flex items-center justify-between p-2.5 rounded-xl border text-xs ${
                c.passed
                  ? 'bg-slate-950/50 border-slate-800/80 text-slate-200'
                  : 'bg-rose-500/5 border-rose-500/20 text-rose-300'
              }`}
            >
              <div className="flex items-center gap-2">
                {c.passed ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                )}
                <span className="font-medium">{c.label}</span>
              </div>
              <span className="text-[11px] text-slate-400">{c.detail}</span>
            </div>
          ))}
        </div>

        {/* Warning if incomplete */}
        {hasCriticalFailure && (
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-2.5 text-xs text-amber-300">
            <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <p>
              Some sections have minimal content. While you can still submit, thorough answers receive
              significantly higher marks and more nuanced evaluation from the AI evaluator.
            </p>
          </div>
        )}

        {/* Snapshot Notice */}
        <p className="text-[11px] text-slate-400 leading-relaxed">
          Once submitted, an immutable snapshot and content hash will be generated. The evaluation
          job will run asynchronously against the 8-criterion rubric.
        </p>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            Back to Editor
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={isSubmitting}
            className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold text-xs flex items-center gap-2 shadow-md shadow-blue-600/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Creating Snapshot & Submitting...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Confirm & Submit for Evaluation</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
