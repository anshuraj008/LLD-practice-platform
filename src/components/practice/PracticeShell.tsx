'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Send,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  FileText,
  Boxes,
  Network,
  Workflow,
  ShieldCheck,
  Scale,
  CheckCircle2,
  Check,
  Sparkles,
} from 'lucide-react';
import { AutosaveStatus, SaveState } from './AutosaveStatus';
import { ClassListEditor, ClassItem } from './ClassListEditor';
import { SubmitModal } from './SubmitModal';
import { AttemptDraft } from '@/domain/types/attempt';
import { Problem } from '@/domain/types/problem';
import {
  SUBMISSION_REQUIREMENTS,
  countCompletedDesignSections,
  getDesignSectionCompletion,
} from '@/lib/submission-requirements';

interface PracticeShellProps {
  attemptId: string;
  initialDraft: AttemptDraft;
  isSubmitted: boolean;
  problem: Problem;
  rubric: any;
  existingEvaluationId?: string | null;
}

type EditorTab =
  | 'assumptions'
  | 'classes'
  | 'relationships'
  | 'mainFlow'
  | 'edgeCases'
  | 'tradeOffs';

export function PracticeShell({
  attemptId,
  initialDraft,
  isSubmitted,
  problem,
  rubric,
  existingEvaluationId,
}: PracticeShellProps) {
  const router = useRouter();

  // Local state for editor fields
  const [draft, setDraft] = useState<AttemptDraft>(initialDraft);
  const [activeTab, setActiveTab] = useState<EditorTab>('assumptions');
  const [isProblemCollapsed, setIsProblemCollapsed] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveState>('saved');
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isDirtyRef = useRef(false);
  const draftRef = useRef(draft);
  draftRef.current = draft;

  // Perform debounced autosave (800ms)
  const syncDraftToServer = useCallback(
    async (draftToSave: AttemptDraft) => {
      if (isSubmitted) return;
      try {
        setSaveStatus('saving');
        const res = await fetch(`/api/attempts/${attemptId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ draft: draftToSave }),
        });

        if (!res.ok) {
          throw new Error('Autosave request failed');
        }

        setSaveStatus('saved');
        setLastSavedAt(new Date());
        isDirtyRef.current = false;
      } catch (err) {
        console.error('Autosave failed:', err);
        setSaveStatus('error');
      }
    },
    [attemptId, isSubmitted]
  );

  const handleFieldChange = (field: keyof AttemptDraft, value: AttemptDraft[keyof AttemptDraft]) => {
    if (isSubmitted) return;

    const next = { ...draftRef.current, [field]: value };
    draftRef.current = next;
    setDraft(next);
    isDirtyRef.current = true;
    setSaveStatus('unsaved');

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      void syncDraftToServer(draftRef.current);
    }, 800);
  };

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // Handle final submission
  const handleFinalSubmit = async () => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const idempotencyKey = crypto.randomUUID();
      const payload = {
        format: 'structured-text' as const,
        assumptions: draft.assumptions,
        classes: draft.classes,
        relationships: draft.relationships,
        mainFlow: draft.mainFlow,
        edgeCases: draft.edgeCases,
        tradeOffs: draft.tradeOffs,
      };

      const res = await fetch(`/api/attempts/${attemptId}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': idempotencyKey,
        },
        body: JSON.stringify({
          idempotencyKey,
          payload,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Submission failed');
      }

      setIsSubmitModalOpen(false);
      // Navigate to feedback page
      router.push(`/attempts/${attemptId}/feedback`);
    } catch (err: any) {
      setSubmitError(err.message || 'Submission error');
      setIsSubmitting(false);
    }
  };

  const sectionCompletion = getDesignSectionCompletion(draft);
  const completedTabsCount = countCompletedDesignSections(draft);

  const tabs: Array<{
    id: EditorTab;
    label: string;
    shortLabel: string;
    icon: typeof FileText;
  }> = [
    { id: 'assumptions', label: '1. Assumptions', shortLabel: 'Assumptions', icon: FileText },
    { id: 'classes', label: '2. Classes & SRP', shortLabel: 'Classes', icon: Boxes },
    { id: 'relationships', label: '3. Relationships', shortLabel: 'Relations', icon: Network },
    { id: 'mainFlow', label: '4. Main Flow', shortLabel: 'Main Flow', icon: Workflow },
    { id: 'edgeCases', label: '5. Edge Cases', shortLabel: 'Edge Cases', icon: ShieldCheck },
    { id: 'tradeOffs', label: '6. Trade-offs', shortLabel: 'Trade-offs', icon: Scale },
  ];

  return (
    <div className="space-y-4">
      {/* Top Action Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-[#0c0f1a]/85 backdrop-blur-xl border border-white/[0.08] shadow-xl">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsProblemCollapsed(!isProblemCollapsed)}
            className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 text-slate-300 hover:text-white text-xs font-medium border border-white/[0.08] hover:border-violet-500/30 transition-all"
            title="Toggle Problem Sidebar"
          >
            {isProblemCollapsed ? <ChevronRight className="w-3.5 h-3.5 text-violet-400" /> : <ChevronLeft className="w-3.5 h-3.5 text-violet-400" />}
            <span>{isProblemCollapsed ? 'Show Spec' : 'Hide Spec'}</span>
          </button>

          <div className="min-w-0">
            <h2 className="text-sm font-bold text-slate-100 flex flex-wrap items-center gap-2">
              <span className="truncate">{problem.title}</span>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-violet-500/15 text-violet-300 border border-violet-500/25">
                {problem.difficulty}
              </span>
            </h2>
            <p className="text-[11px] text-slate-400 font-medium" aria-live="polite">
              <span className="text-violet-400 font-semibold">{completedTabsCount}</span> of 6 design sections completed
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <AutosaveStatus status={saveStatus} lastSavedAt={lastSavedAt} />

          {isSubmitted ? (
            <button
              onClick={() => router.push(`/attempts/${attemptId}/feedback`)}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-emerald-600/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>View Rubric Feedback</span>
            </button>
          ) : (
            <button
              onClick={() => setIsSubmitModalOpen(true)}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-violet-600/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Submit Solution</span>
            </button>
          )}
        </div>
      </div>

      {submitError && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/25 text-xs text-rose-300 flex items-center justify-between">
          <span>{submitError}</span>
          <button onClick={() => setSubmitError(null)} className="text-rose-400 hover:text-white font-bold ml-2">
            ✕
          </button>
        </div>
      )}

      {/* Mobile / tablet: problem context drawer so the editor stays first */}
      <details className="lg:hidden rounded-2xl bg-[#0c0f1a]/85 border border-white/[0.08]">
        <summary className="flex cursor-pointer items-center justify-between gap-3 px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-300">
          <span className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-violet-400" />
            Problem Spec
          </span>
          <span className="text-[10px] font-medium normal-case text-slate-400">Tap to read</span>
        </summary>
        <div className="px-4 pb-4">
          <ProblemContextBody problem={problem} />
        </div>
      </details>

      {/* Main Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Problem Rail — desktop only */}
        {!isProblemCollapsed && (
          <div className="hidden lg:block lg:col-span-4 space-y-4">
            <div className="rounded-2xl bg-[#0c0f1a]/85 backdrop-blur-md border border-white/[0.08] p-5 sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto">
              <ProblemContextBody problem={problem} />
            </div>
          </div>
        )}

        {/* Right Column: Structured Design Editor */}
        <div className={isProblemCollapsed ? 'lg:col-span-12 space-y-4' : 'lg:col-span-8 space-y-4'}>
          <div className="rounded-2xl bg-[#0c0f1a]/90 backdrop-blur-md border border-white/[0.08] overflow-hidden shadow-2xl">
            {/* Section Tab Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:flex xl:overflow-x-auto border-b border-white/[0.08] bg-[#07090f]/70 p-1.5 gap-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                const isFilled = sectionCompletion[tab.id];
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center justify-center xl:justify-start gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                      isActive
                        ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-600/20'
                        : isFilled
                        ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/25 hover:bg-emerald-500/15'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    <span className="hidden xl:inline">{tab.label}</span>
                    <span className="xl:hidden">{tab.shortLabel}</span>
                    {isFilled && (
                      <Check
                        className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-white' : 'text-emerald-400'}`}
                        aria-label="Section complete"
                      />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Tab Body */}
            <div className="p-6">
              {/* Tab 1: Assumptions */}
              {activeTab === 'assumptions' && (
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-200 flex items-center gap-2">
                      <div className="w-5 h-5 rounded bg-violet-500/15 text-violet-400 flex items-center justify-center">
                        <FileText className="w-3.5 h-3.5" />
                      </div>
                      Scope, Assumptions & Entity Boundaries
                    </label>
                    <p className="text-[11px] text-slate-400 leading-normal">
                      State what the system handles (e.g., number of gates, vehicle categories, payment methods) and what is explicitly out of scope.
                    </p>
                  </div>
                  <textarea
                    value={draft.assumptions}
                    disabled={isSubmitted}
                    onChange={(e) => handleFieldChange('assumptions', e.target.value)}
                    placeholder="e.g. The parking lot supports 4 floors and 2 entry/exit gates. Vehicles are categorized as Motorcycle, Compact, Large, and EV. Payment is processed synchronously at exit gates..."
                    rows={12}
                    className="w-full text-xs text-slate-200 bg-[#07090f] rounded-xl border border-white/[0.08] p-4 placeholder-slate-600 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/30 leading-relaxed font-mono"
                  />
                  <SectionCharProgress
                    value={draft.assumptions}
                    min={SUBMISSION_REQUIREMENTS.assumptionsMinLength}
                    complete={sectionCompletion.assumptions}
                  />
                </div>
              )}

              {/* Tab 2: Core Classes & SRP */}
              {activeTab === 'classes' && (
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-200 flex items-center gap-2">
                      <div className="w-5 h-5 rounded bg-cyan-500/15 text-cyan-400 flex items-center justify-center">
                        <Boxes className="w-3.5 h-3.5" />
                      </div>
                      Core Domain Classes & Responsibilities (SRP)
                    </label>
                    <p className="text-[11px] text-slate-400 leading-normal">
                      List each domain entity, manager, or strategy with a concise responsibility statement adhering to the Single Responsibility Principle.
                    </p>
                  </div>
                  <ClassListEditor
                    classes={draft.classes}
                    disabled={isSubmitted}
                    onChange={(updatedClasses: ClassItem[]) => handleFieldChange('classes', updatedClasses)}
                  />
                  <p className={`text-[11px] font-medium ${sectionCompletion.classes ? 'text-emerald-400' : 'text-slate-500'}`}>
                    {sectionCompletion.classes
                      ? '✓ Section complete'
                      : `${draft.classes.filter((c) => c.name.trim()).length} / ${SUBMISSION_REQUIREMENTS.minimumClasses} named classes with responsibilities`}
                  </p>
                </div>
              )}

              {/* Tab 3: Relationships & Interfaces */}
              {activeTab === 'relationships' && (
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-200 flex items-center gap-2">
                      <div className="w-5 h-5 rounded bg-indigo-500/15 text-indigo-400 flex items-center justify-center">
                        <Network className="w-3.5 h-3.5" />
                      </div>
                      Class Relationships, Encapsulation & Interfaces
                    </label>
                    <p className="text-[11px] text-slate-400 leading-normal">
                      Describe associations (has-a, is-a), dependency direction, interface abstractions (e.g. SpotAssignmentStrategy), and how state mutation is encapsulated.
                    </p>
                  </div>
                  <textarea
                    value={draft.relationships}
                    disabled={isSubmitted}
                    onChange={(e) => handleFieldChange('relationships', e.target.value)}
                    className="w-full text-xs text-slate-200 bg-[#07090f] rounded-xl border border-white/[0.08] p-4 placeholder-slate-600 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/30 leading-relaxed font-mono"
                  />
                  <SectionCharProgress
                    value={draft.relationships}
                    min={SUBMISSION_REQUIREMENTS.relationshipsMinLength}
                    complete={sectionCompletion.relationships}
                  />
                </div>
              )}

              {/* Tab 4: Main Execution Flow */}
              {activeTab === 'mainFlow' && (
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-200 flex items-center gap-2">
                      <div className="w-5 h-5 rounded bg-amber-500/15 text-amber-400 flex items-center justify-center">
                        <Workflow className="w-3.5 h-3.5" />
                      </div>
                      Primary Execution Workflow (Step-by-Step)
                    </label>
                    <p className="text-[11px] text-slate-400 leading-normal">
                      Provide a numbered walkthrough of the primary interaction flow from entry to completion.
                    </p>
                  </div>
                  <textarea
                    value={draft.mainFlow}
                    disabled={isSubmitted}
                    onChange={(e) => handleFieldChange('mainFlow', e.target.value)}
                    className="w-full text-xs text-slate-200 bg-[#07090f] rounded-xl border border-white/[0.08] p-4 placeholder-slate-600 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/30 leading-relaxed font-mono"
                  />
                  <SectionCharProgress
                    value={draft.mainFlow}
                    min={SUBMISSION_REQUIREMENTS.mainFlowMinLength}
                    complete={sectionCompletion.mainFlow}
                  />
                </div>
              )}

              {/* Tab 5: Edge Cases & Concurrency */}
              {activeTab === 'edgeCases' && (
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-200 flex items-center gap-2">
                      <div className="w-5 h-5 rounded bg-rose-500/15 text-rose-400 flex items-center justify-center">
                        <ShieldCheck className="w-3.5 h-3.5" />
                      </div>
                      Edge Cases, Boundary Conditions & Concurrency
                    </label>
                    <p className="text-[11px] text-slate-400 leading-normal">
                      Describe race condition prevention (e.g. two gates allocating the same spot), capacity limits, invalid operations, and fallback policies.
                    </p>
                  </div>
                  <textarea
                    value={draft.edgeCases}
                    disabled={isSubmitted}
                    onChange={(e) => handleFieldChange('edgeCases', e.target.value)}
                    className="w-full text-xs text-slate-200 bg-[#07090f] rounded-xl border border-white/[0.08] p-4 placeholder-slate-600 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/30 leading-relaxed font-mono"
                  />
                  <SectionCharProgress
                    value={draft.edgeCases}
                    min={SUBMISSION_REQUIREMENTS.edgeCasesMinLength}
                    complete={sectionCompletion.edgeCases}
                  />
                </div>
              )}

              {/* Tab 6: Trade-offs & Extensibility */}
              {activeTab === 'tradeOffs' && (
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-200 flex items-center gap-2">
                      <div className="w-5 h-5 rounded bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
                        <Scale className="w-3.5 h-3.5" />
                      </div>
                      Architectural Trade-offs & Extensibility
                    </label>
                    <p className="text-[11px] text-slate-400 leading-normal">
                      Explain why you chose certain design patterns over alternatives, how the system accommodates future changes (e.g. new pricing models), and where trade-offs were made.
                    </p>
                  </div>
                  <textarea
                    value={draft.tradeOffs}
                    disabled={isSubmitted}
                    onChange={(e) => handleFieldChange('tradeOffs', e.target.value)}
                    className="w-full text-xs text-slate-200 bg-[#07090f] rounded-xl border border-white/[0.08] p-4 placeholder-slate-600 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/30 leading-relaxed font-mono"
                  />
                  <SectionCharProgress
                    value={draft.tradeOffs}
                    min={SUBMISSION_REQUIREMENTS.tradeOffsMinLength}
                    complete={sectionCompletion.tradeOffs}
                  />
                </div>
              )}
            </div>

            {/* Bottom Nav Between Tabs */}
            <div className="p-4 border-t border-white/[0.08] bg-[#07090f]/70 flex items-center justify-between">
              <button
                type="button"
                disabled={activeTab === 'assumptions'}
                onClick={() => {
                  const idx = tabs.findIndex((t) => t.id === activeTab);
                  if (idx > 0) setActiveTab(tabs[idx - 1].id);
                }}
                className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 disabled:opacity-30 disabled:pointer-events-none transition-colors"
              >
                ← Previous Section
              </button>

              <button
                type="button"
                disabled={activeTab === 'tradeOffs'}
                onClick={() => {
                  const idx = tabs.findIndex((t) => t.id === activeTab);
                  if (idx < tabs.length - 1) setActiveTab(tabs[idx + 1].id);
                }}
                className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-violet-400 hover:text-violet-300 disabled:opacity-30 disabled:pointer-events-none transition-colors"
              >
                Next Section →
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Pre-submit Checklist Modal */}
      <SubmitModal
        isOpen={isSubmitModalOpen}
        isSubmitting={isSubmitting}
        draft={draft}
        onClose={() => setIsSubmitModalOpen(false)}
        onConfirm={handleFinalSubmit}
      />
    </div>
  );
}

function ProblemContextBody({ problem }: { problem: Problem }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 pb-2 border-b border-white/[0.08]">
        <div className="w-5 h-5 rounded bg-violet-500/15 text-violet-400 flex items-center justify-center">
          <BookOpen className="w-3.5 h-3.5" />
        </div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">Problem Context</h3>
      </div>

      <p className="text-xs text-slate-300 leading-relaxed">{problem.description}</p>

      <div className="space-y-2.5 pt-2">
        <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
          Requirements & Constraints
        </h4>
        <div className="space-y-2">
          {problem.requirements.map((requirement) => (
            <div
              key={requirement.id}
              className="p-2.5 rounded-xl bg-slate-950/60 border border-white/[0.06] text-xs space-y-1"
            >
              <span className="text-[9px] font-bold uppercase tracking-wider text-cyan-400">
                {requirement.category}
              </span>
              <p className="text-slate-300 text-[11px] leading-relaxed">{requirement.description}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="p-3.5 rounded-xl bg-violet-950/20 border border-violet-500/20 text-[11px] text-slate-300 space-y-1.5">
        <p className="font-semibold text-violet-300 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-violet-400" /> Architectural Tip
        </p>
        <p className="text-slate-400">
          Decouple state from algorithms using Strategy and Factory interfaces, and detail concurrency guard mechanisms.
        </p>
      </div>
    </div>
  );
}

function SectionCharProgress({
  value,
  min,
  complete,
}: {
  value: string;
  min: number;
  complete: boolean;
}) {
  const count = value.trim().length;
  return (
    <p className={`text-[11px] ${complete ? 'text-emerald-400' : 'text-slate-500'}`} aria-live="polite">
      {complete ? 'Section complete' : `${count} / ${min} characters`}
    </p>
  );
}
