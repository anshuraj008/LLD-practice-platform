'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Layers,
  Send,
  Sparkles,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  FileText,
  Boxes,
  Network,
  Workflow,
  ShieldCheck,
  Scale,
  CheckCircle2,
} from 'lucide-react';
import { AutosaveStatus, SaveState } from './AutosaveStatus';
import { ClassListEditor, ClassItem } from './ClassListEditor';
import { SubmitModal } from './SubmitModal';
import { AttemptDraft } from '@/domain/types/attempt';
import { Problem } from '@/domain/types/problem';

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

  const handleFieldChange = (field: keyof AttemptDraft, value: any) => {
    if (isSubmitted) return;

    setDraft((prev) => {
      const next = { ...prev, [field]: value };
      isDirtyRef.current = true;
      setSaveStatus('unsaved');

      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = setTimeout(() => {
        syncDraftToServer(next);
      }, 800);

      return next;
    });
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

  const tabs: Array<{
    id: EditorTab;
    label: string;
    icon: any;
    isFilled: boolean;
  }> = [
    {
      id: 'assumptions',
      label: '1. Assumptions',
      icon: FileText,
      isFilled: draft.assumptions.trim().length >= 15,
    },
    {
      id: 'classes',
      label: '2. Classes & SRP',
      icon: Boxes,
      isFilled: draft.classes.length >= 2,
    },
    {
      id: 'relationships',
      label: '3. Relationships',
      icon: Network,
      isFilled: draft.relationships.trim().length >= 15,
    },
    {
      id: 'mainFlow',
      label: '4. Main Flow',
      icon: Workflow,
      isFilled: draft.mainFlow.trim().length >= 20,
    },
    {
      id: 'edgeCases',
      label: '5. Edge Cases',
      icon: ShieldCheck,
      isFilled: draft.edgeCases.trim().length >= 15,
    },
    {
      id: 'tradeOffs',
      label: '6. Trade-offs',
      icon: Scale,
      isFilled: draft.tradeOffs.trim().length >= 15,
    },
  ];

  const completedTabsCount = tabs.filter((t) => t.isFilled).length;

  return (
    <div className="space-y-4">
      {/* Top Action Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsProblemCollapsed(!isProblemCollapsed)}
            className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white text-xs font-medium border border-slate-700 transition-colors"
            title="Toggle Problem Sidebar"
          >
            {isProblemCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
            <span>{isProblemCollapsed ? 'Show Problem' : 'Hide Problem'}</span>
          </button>

          <div>
            <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <span>{problem.title}</span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                {problem.difficulty}
              </span>
            </h2>
            <p className="text-[11px] text-slate-400">
              {completedTabsCount} of 6 design sections completed
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <AutosaveStatus status={saveStatus} lastSavedAt={lastSavedAt} />

          {isSubmitted ? (
            <button
              onClick={() => router.push(`/attempts/${attemptId}/feedback`)}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>View Evaluation Feedback</span>
            </button>
          ) : (
            <button
              onClick={() => setIsSubmitModalOpen(true)}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-blue-600/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Submit Solution</span>
            </button>
          )}
        </div>
      </div>

      {submitError && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 flex items-center justify-between">
          <span>{submitError}</span>
          <button onClick={() => setSubmitError(null)} className="text-rose-400 hover:text-white font-bold ml-2">
            ✕
          </button>
        </div>
      )}

      {/* Main Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Problem Rail (35% on Desktop when expanded) */}
        {!isProblemCollapsed && (
          <div className="lg:col-span-4 space-y-4">
            <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-5 space-y-4 sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
                <BookOpen className="w-4 h-4 text-blue-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Problem Context
                </h3>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">{problem.description}</p>

              {/* Requirements */}
              <div className="space-y-2.5 pt-2">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Requirements & Constraints
                </h4>
                <div className="space-y-2">
                  {problem.requirements.map((r) => (
                    <div
                      key={r.id}
                      className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-850 text-xs space-y-1"
                    >
                      <span className="text-[9px] font-bold uppercase tracking-wider text-blue-400">
                        {r.category}
                      </span>
                      <p className="text-slate-300 text-[11px] leading-relaxed">{r.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Rubric Weights Reminder */}
              <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800/80 text-[11px] text-slate-400 space-y-1.5">
                <p className="font-semibold text-slate-300">💡 Evaluation Reminder:</p>
                <p>
                  Avoid monolithic God classes. Decouple algorithms via Strategy/Interface abstractions,
                  and consider concurrency edge cases.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Right Column: Structured Design Editor (65% on Desktop) */}
        <div className={isProblemCollapsed ? 'lg:col-span-12 space-y-4' : 'lg:col-span-8 space-y-4'}>
          <div className="rounded-2xl bg-slate-900/90 border border-slate-800 overflow-hidden shadow-xl">
            {/* Section Tab Bar */}
            <div className="flex items-center overflow-x-auto border-b border-slate-800 bg-slate-950/60 p-1.5 gap-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                    {tab.isFilled && (
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          isActive ? 'bg-white' : 'bg-emerald-400'
                        }`}
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
                    <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-blue-400" />
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
                    className="w-full text-xs text-slate-200 bg-slate-950 rounded-xl border border-slate-800 p-4 placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 leading-relaxed font-mono"
                  />
                </div>
              )}

              {/* Tab 2: Core Classes & SRP */}
              {activeTab === 'classes' && (
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                      <Boxes className="w-4 h-4 text-blue-400" />
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
                </div>
              )}

              {/* Tab 3: Relationships & Interfaces */}
              {activeTab === 'relationships' && (
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                      <Network className="w-4 h-4 text-blue-400" />
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
                    placeholder="e.g. ParkingLot aggregate root has-many ParkingFloors and Gates. EntryGate depends on SpotAssignmentStrategy interface. Spot state is encapsulated behind assignVehicle() and vacate() methods..."
                    rows={12}
                    className="w-full text-xs text-slate-200 bg-slate-950 rounded-xl border border-slate-800 p-4 placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 leading-relaxed font-mono"
                  />
                </div>
              )}

              {/* Tab 4: Main Execution Flow */}
              {activeTab === 'mainFlow' && (
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                      <Workflow className="w-4 h-4 text-blue-400" />
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
                    placeholder="1. Vehicle arrives at EntryGate sensor.\n2. EntryGate queries SpotAssignmentStrategy for best available spot.\n3. Spot is atomically reserved; immutable Ticket is issued.\n4. On exit, Ticket is presented to ExitGate; FeeCalculationStrategy computes amount; Payment processed; Spot vacated."
                    rows={12}
                    className="w-full text-xs text-slate-200 bg-slate-950 rounded-xl border border-slate-800 p-4 placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 leading-relaxed font-mono"
                  />
                </div>
              )}

              {/* Tab 5: Edge Cases & Concurrency */}
              {activeTab === 'edgeCases' && (
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-blue-400" />
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
                    placeholder="1. Concurrency: Synchronized / atomic CAS lock on ParkingSpot allocation to prevent race conditions when two gates admit vehicles simultaneously.\n2. Lost Ticket: Fallback to MaxDailyFeeStrategy.\n3. Capacity full: Entry gate blocks barrier and returns ParkingLotFullException."
                    rows={12}
                    className="w-full text-xs text-slate-200 bg-slate-950 rounded-xl border border-slate-800 p-4 placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 leading-relaxed font-mono"
                  />
                </div>
              )}

              {/* Tab 6: Trade-offs & Extensibility */}
              {activeTab === 'tradeOffs' && (
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                      <Scale className="w-4 h-4 text-blue-400" />
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
                    placeholder="Applied Strategy Pattern for fee calculation and spot assignment to adhere to Open/Closed Principle. Chose synchronous in-memory payment adapter rather than distributed event bus to keep domain bounded and testable."
                    rows={12}
                    className="w-full text-xs text-slate-200 bg-slate-950 rounded-xl border border-slate-800 p-4 placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 leading-relaxed font-mono"
                  />
                </div>
              )}
            </div>

            {/* Bottom Nav Between Tabs */}
            <div className="p-4 border-t border-slate-800 bg-slate-950/40 flex items-center justify-between">
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
                className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-blue-400 hover:text-blue-300 disabled:opacity-30 disabled:pointer-events-none transition-colors"
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
