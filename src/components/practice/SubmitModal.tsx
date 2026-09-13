'use client';

import React from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Send, Loader2, X, ShieldCheck } from 'lucide-react';
import { AttemptDraft } from '@/domain/types/attempt';
import { SUBMISSION_REQUIREMENTS } from '@/lib/submission-requirements';

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

  const classesExist = draft.classes.length >= SUBMISSION_REQUIREMENTS.minimumClasses;
  const validResponsibilities = draft.classes.filter(
    (c) => c.responsibility.trim().length >= SUBMISSION_REQUIREMENTS.responsibilityMinLength
  ).length;
  const responsibilitiesValid =
    classesExist && validResponsibilities === draft.classes.length;

  const checks = [
    {
      label: 'Scope & Assumptions specified',
      passed: draft.assumptions.trim().length >= SUBMISSION_REQUIREMENTS.assumptionsMinLength,
      detail: `${draft.assumptions.trim().length} chars (minimum ${SUBMISSION_REQUIREMENTS.assumptionsMinLength})`,
    },
    {
      label: 'At least 2 distinct classes defined',
      passed: classesExist,
      detail: `${draft.classes.length} classes defined (minimum ${SUBMISSION_REQUIREMENTS.minimumClasses})`,
    },
    {
      label: 'Class responsibilities provided',
      passed: responsibilitiesValid,
      detail: `${validResponsibilities} valid responsibilities (required for each class)`,
    },
    {
      label: 'Relationships & Interfaces detailed',
      passed: draft.relationships.trim().length >= SUBMISSION_REQUIREMENTS.relationshipsMinLength,
      detail: `${draft.relationships.trim().length} chars (minimum ${SUBMISSION_REQUIREMENTS.relationshipsMinLength})`,
    },
    {
      label: 'Main Execution Flow explained',
      passed: draft.mainFlow.trim().length >= SUBMISSION_REQUIREMENTS.mainFlowMinLength,
      detail: `${draft.mainFlow.trim().length} chars (minimum ${SUBMISSION_REQUIREMENTS.mainFlowMinLength})`,
    },
    {
      label: 'Edge Cases & Concurrency considered',
      passed: draft.edgeCases.trim().length >= SUBMISSION_REQUIREMENTS.edgeCasesMinLength,
      detail: `${draft.edgeCases.trim().length} chars (minimum ${SUBMISSION_REQUIREMENTS.edgeCasesMinLength})`,
    },
    {
      label: 'Trade-offs & Extensibility justified',
      passed: draft.tradeOffs.trim().length >= SUBMISSION_REQUIREMENTS.tradeOffsMinLength,
      detail: `${draft.tradeOffs.trim().length} chars (minimum ${SUBMISSION_REQUIREMENTS.tradeOffsMinLength})`,
    },
  ];

  const hasCriticalFailure = checks.some((c) => !c.passed);
  const remainingRequirements = checks.filter((c) => !c.passed).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg rounded-3xl bg-[#0e121e] border border-white/[0.1] shadow-2xl p-6 sm:p-7 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-violet-500/15 border border-violet-500/25 text-violet-400 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">Pre-Submission Quality Check</h3>
              <p className="text-xs text-slate-400">Verifying design completeness before snapshot</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="text-slate-400 hover:text-slate-200 p-1.5 rounded-xl hover:bg-white/[0.06] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Completeness Checklist */}
        <div className="space-y-2">
          {checks.map((c, idx) => (
            <div
              key={idx}
              className={`flex items-center justify-between p-3 rounded-xl border text-xs transition-colors ${
                c.passed
                  ? 'bg-[#07090f]/80 border-white/[0.06] text-slate-200'
                  : 'bg-rose-500/10 border-rose-500/25 text-rose-300'
              }`}
            >
              <div className="flex items-center gap-2.5">
                {c.passed ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                )}
                <span className="font-medium">{c.label}</span>
              </div>
              <span className="text-[11px] text-slate-400 font-mono">{c.detail}</span>
            </div>
          ))}
        </div>

        {/* Hard submission gate */}
        {hasCriticalFailure && (
          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-2.5 text-xs text-amber-300">
            <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <p>
              Complete {remainingRequirements} remaining requirement{remainingRequirements === 1 ? '' : 's'} before evaluation.
            </p>
          </div>
        )}

        {/* Snapshot Notice */}
        <p className="text-[11px] text-slate-400 leading-relaxed">
          Once submitted, an immutable snapshot and content hash will be generated. The evaluation
          job will run asynchronously against the 8-criterion rubric.
        </p>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-white/[0.06]">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-white/[0.04] transition-colors"
          >
            Back to Editor
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={isSubmitting || hasCriticalFailure}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-40 disabled:pointer-events-none text-white font-semibold text-xs flex items-center gap-2 shadow-lg shadow-violet-600/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Creating Snapshot & Submitting...</span>
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                <span>Confirm & Submit Solution</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
