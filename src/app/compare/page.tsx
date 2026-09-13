import React from 'react';
import Link from 'next/link';
import { historyService, AttemptComparison } from '@/services/history-service';
import { getCurrentUser } from '@/lib/session';
import {
  GitCompare,
  ArrowLeft,
  ArrowRight,
  TrendingUp,
  Award,
  Layers,
  FileText,
  Boxes,
  Network,
  Workflow,
  ShieldCheck,
  Scale,
  CheckCircle2,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';

export const dynamic = 'force-dynamic';

interface ComparePageProps {
  searchParams: Promise<{ a?: string; b?: string }>;
}

export default async function ComparePage({ searchParams }: ComparePageProps) {
  const { a: attemptIdA, b: attemptIdB } = await searchParams;
  const user = await getCurrentUser();
  const overview = historyService.getUserHistory(user.id);
  const submittedAttempts = overview.attempts.filter((a) => a.status === 'SUBMITTED');

  // If no IDs provided or only 1, pick the first 2 submitted attempts by default for instant reviewer demo
  const finalA = attemptIdA || (submittedAttempts.length >= 2 ? submittedAttempts[1].attemptId : submittedAttempts[0]?.attemptId);
  const finalB = attemptIdB || (submittedAttempts.length >= 2 ? submittedAttempts[0].attemptId : null);
  const selectedAttemptA = submittedAttempts.find((attempt) => attempt.attemptId === finalA);
  const selectedAttemptB = submittedAttempts.find((attempt) => attempt.attemptId === finalB);
  const canCompare = Boolean(
    finalA &&
      finalB &&
      finalA !== finalB &&
      selectedAttemptA?.evaluationStatus === 'COMPLETED' &&
      selectedAttemptB?.evaluationStatus === 'COMPLETED' &&
      typeof selectedAttemptA.overallScore === 'number' &&
      typeof selectedAttemptB.overallScore === 'number'
  );

  let comparison: AttemptComparison | null = null;
  let errorMessage: string | null = null;

  if (canCompare && finalA && finalB) {
    try {
      comparison = historyService.compareAttempts(finalA, finalB);
    } catch (err: any) {
      errorMessage = err.message || 'Failed to compare attempts';
    }
  }

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link
          href="/history"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Attempt History
        </Link>
      </div>

      {/* Main Container */}
      <div className="rounded-3xl bg-[#0c0f1a]/85 backdrop-blur-md border border-white/[0.08] p-6 sm:p-8 space-y-6 shadow-2xl relative overflow-hidden">
        {/* Glow */}
        <div className="absolute top-0 right-1/4 w-80 h-80 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/15 border border-violet-500/25 text-violet-300 text-xs font-semibold mb-2">
              <GitCompare className="w-3.5 h-3.5" />
              <span>Side-by-Side Architectural Diff</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Compare Attempt Progression
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Inspect score improvements, rubric delta breakdown, and structured design changes between iterations.
            </p>
          </div>
        </div>

        {/* Dropdown Selectors */}
        <form className="p-4 rounded-2xl bg-[#07090f]/80 border border-white/[0.06] flex flex-wrap items-center gap-4 relative z-10">
          <div className="flex-1 min-w-[200px] space-y-1">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Base Attempt (A)
            </label>
            <select
              name="a"
              defaultValue={finalA || ''}
              className="w-full text-xs bg-[#0e121e] text-slate-200 rounded-xl border border-white/[0.1] p-2.5 focus:outline-none focus:border-violet-500 font-mono"
            >
              {submittedAttempts.map((att) => (
                <option key={att.attemptId} value={att.attemptId}>
                  {att.problemTitle} ({att.evaluationStatus === 'COMPLETED' && att.overallScore !== null ? `Score: ${att.overallScore}%` : `Evaluation ${att.evaluationStatus?.toLowerCase() || 'pending'}`}) - {formatDate(att.submittedAt)}
                </option>
              ))}
            </select>
          </div>

          <div className="flex-1 min-w-[200px] space-y-1">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Comparison Attempt (B)
            </label>
            <select
              name="b"
              defaultValue={finalB || ''}
              className="w-full text-xs bg-[#0e121e] text-slate-200 rounded-xl border border-white/[0.1] p-2.5 focus:outline-none focus:border-violet-500 font-mono"
            >
              {submittedAttempts.map((att) => (
                <option key={att.attemptId} value={att.attemptId}>
                  {att.problemTitle} ({att.evaluationStatus === 'COMPLETED' && att.overallScore !== null ? `Score: ${att.overallScore}%` : `Evaluation ${att.evaluationStatus?.toLowerCase() || 'pending'}`}) - {formatDate(att.submittedAt)}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              disabled={!canCompare}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-40 disabled:pointer-events-none text-white font-semibold text-xs shadow-md shadow-violet-600/25 transition-all"
            >
              Compare
            </button>
          </div>
        </form>
      </div>

      {!comparison && (
        <div className="p-8 rounded-2xl bg-[#0c0f1a]/85 border border-white/[0.08] text-center space-y-2">
          <h2 className="text-base font-bold text-slate-100">Comparison unavailable</h2>
          <p className="text-xs text-slate-400">
            Both attempts must have completed evaluations before score comparison can be generated.
          </p>
          {errorMessage && <p className="text-xs text-rose-300">{errorMessage}</p>}
        </div>
      )}

      {comparison && (
        <div className="space-y-8">
          {/* Score Improvement Banner */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Attempt A Card */}
            <div className="p-5 rounded-2xl bg-[#0c0f1a]/85 border border-white/[0.08] space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Attempt A
              </span>
              <p className="text-xs font-semibold text-slate-200">{formatDate(comparison.attemptA.submittedAt)}</p>
              <div className="text-2xl font-black text-slate-300">
                {comparison.attemptA.overallScore}% Score
              </div>
              <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                {comparison.attemptA.summary || 'Summary unavailable'}
              </p>
            </div>

            {/* Score Delta Badge */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-[#0c0f1a] to-violet-950/30 border border-violet-500/30 flex flex-col items-center justify-center text-center space-y-1">
              <TrendingUp className="w-6 h-6 text-emerald-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-violet-300">Score Delta</span>
              <div className={`text-3xl font-black ${comparison.scoreDelta >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {comparison.scoreDelta >= 0 ? '+' : ''}{comparison.scoreDelta}%
              </div>
              <span className="text-[11px] text-slate-400">
                {comparison.scoreDelta >= 0 ? 'Positive architectural growth' : 'Score regression'}
              </span>
            </div>

            {/* Attempt B Card */}
            <div className="p-5 rounded-2xl bg-[#0c0f1a]/85 border border-white/[0.08] space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-violet-400">
                Attempt B (Refactored)
              </span>
              <p className="text-xs font-semibold text-slate-200">{formatDate(comparison.attemptB.submittedAt)}</p>
              <div className="text-2xl font-black text-emerald-400">
                {comparison.attemptB.overallScore}% Score
              </div>
              <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                {comparison.attemptB.summary || 'Summary unavailable'}
              </p>
            </div>
          </div>

          {/* Criterion Delta Table */}
          <div className="rounded-2xl bg-slate-900/80 border border-slate-800 overflow-hidden shadow-lg space-y-4 p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-400" />
                Rubric Criteria Score Comparison
              </h3>
              <span className="text-xs text-slate-400">Scale: 0 to 5</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-950/60 text-slate-400 uppercase font-semibold border-b border-slate-800">
                  <tr>
                    <th className="px-4 py-3">Criterion</th>
                    <th className="px-4 py-3">Weight</th>
                    <th className="px-4 py-3">Attempt A</th>
                    <th className="px-4 py-3">Attempt B</th>
                    <th className="px-4 py-3">Delta</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {comparison.criterionDeltas.map((c) => (
                    <tr key={c.criterionId} className="hover:bg-slate-850/40 transition-colors">
                      <td className="px-4 py-3 font-medium text-slate-200">{c.criterionName}</td>
                      <td className="px-4 py-3 text-slate-400">{(c.weight * 100).toFixed(0)}%</td>
                      <td className="px-4 py-3 font-mono text-slate-300">{c.scoreA} / 5</td>
                      <td className="px-4 py-3 font-mono text-slate-100 font-bold">{c.scoreB} / 5</td>
                      <td className="px-4 py-3 font-mono font-bold">
                        <span
                          className={`px-2 py-0.5 rounded ${
                            c.delta !== null && c.delta > 0
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : c.delta === 0
                              ? 'bg-slate-800 text-slate-400'
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          }`}
                        >
                          {c.delta === null ? 'N/A' : c.delta > 0 ? `+${c.delta}` : c.delta}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Side-by-Side Structured Design Sections */}
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-white flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-lg bg-violet-500/15 border border-violet-500/30 flex items-center justify-center text-violet-400">
                <Layers className="w-3.5 h-3.5" />
              </div>
              Side-by-Side Architectural Evolution
            </h3>

            {/* Section 1: Assumptions */}
            <div className="rounded-2xl bg-[#0c0f1a]/85 border border-white/[0.08] p-5 space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-white/[0.08] text-xs font-bold text-slate-200">
                <FileText className="w-4 h-4 text-violet-400" />
                <span>1. Assumptions & Scope</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                <div className="p-3.5 rounded-xl bg-[#07090f]/80 border border-white/[0.06] text-slate-300 whitespace-pre-wrap leading-relaxed">
                  <span className="text-[10px] font-sans font-bold uppercase text-slate-500 block mb-1">Attempt A</span>
                  {comparison.attemptA.payload.assumptions || 'None'}
                </div>
                <div className="p-3.5 rounded-xl bg-violet-950/20 border border-violet-500/25 text-slate-200 whitespace-pre-wrap leading-relaxed">
                  <span className="text-[10px] font-sans font-bold uppercase text-violet-300 block mb-1">Attempt B (Refactored)</span>
                  {comparison.attemptB.payload.assumptions || 'None'}
                </div>
              </div>
            </div>

            {/* Section 2: Classes */}
            <div className="rounded-2xl bg-[#0c0f1a]/85 border border-white/[0.08] p-5 space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-white/[0.08] text-xs font-bold text-slate-200">
                <Boxes className="w-4 h-4 text-cyan-400" />
                <span>2. Classes & SRP</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                <div className="p-3.5 rounded-xl bg-[#07090f]/80 border border-white/[0.06] space-y-2">
                  <span className="text-[10px] font-sans font-bold uppercase text-slate-500 block">Attempt A</span>
                  {(comparison.attemptA.payload.classes || []).map((c: any, idx: number) => (
                    <div key={idx} className="p-2 rounded-lg bg-slate-900 border border-white/[0.06]">
                      <span className="font-bold text-slate-100">{c.name}</span>
                      <p className="text-[11px] text-slate-400 font-sans mt-0.5">{c.responsibility}</p>
                    </div>
                  ))}
                </div>
                <div className="p-3.5 rounded-xl bg-cyan-950/20 border border-cyan-500/25 space-y-2">
                  <span className="text-[10px] font-sans font-bold uppercase text-cyan-300 block">Attempt B (Refactored)</span>
                  {(comparison.attemptB.payload.classes || []).map((c: any, idx: number) => (
                    <div key={idx} className="p-2 rounded-lg bg-slate-900 border border-cyan-500/20">
                      <span className="font-bold text-cyan-300">{c.name}</span>
                      <p className="text-[11px] text-slate-300 font-sans mt-0.5">{c.responsibility}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Section 3: Relationships & Interfaces */}
            <div className="rounded-2xl bg-[#0c0f1a]/85 border border-white/[0.08] p-5 space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-white/[0.08] text-xs font-bold text-slate-200">
                <Network className="w-4 h-4 text-indigo-400" />
                <span>3. Relationships, Interfaces & Encapsulation</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                <div className="p-3.5 rounded-xl bg-[#07090f]/80 border border-white/[0.06] text-slate-300 whitespace-pre-wrap leading-relaxed">
                  <span className="text-[10px] font-sans font-bold uppercase text-slate-500 block mb-1">Attempt A</span>
                  {comparison.attemptA.payload.relationships || 'None'}
                </div>
                <div className="p-3.5 rounded-xl bg-violet-950/20 border border-violet-500/25 text-slate-200 whitespace-pre-wrap leading-relaxed">
                  <span className="text-[10px] font-sans font-bold uppercase text-violet-300 block mb-1">Attempt B (Refactored)</span>
                  {comparison.attemptB.payload.relationships || 'None'}
                </div>
              </div>
            </div>

            {/* Section 4: Main Flow */}
            <div className="rounded-2xl bg-[#0c0f1a]/85 border border-white/[0.08] p-5 space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-white/[0.08] text-xs font-bold text-slate-200">
                <Workflow className="w-4 h-4 text-amber-400" />
                <span>4. Main Execution Flow</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                <div className="p-3.5 rounded-xl bg-[#07090f]/80 border border-white/[0.06] text-slate-300 whitespace-pre-wrap leading-relaxed">
                  <span className="text-[10px] font-sans font-bold uppercase text-slate-500 block mb-1">Attempt A</span>
                  {comparison.attemptA.payload.mainFlow || 'None'}
                </div>
                <div className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-500/25 text-slate-200 whitespace-pre-wrap leading-relaxed">
                  <span className="text-[10px] font-sans font-bold uppercase text-amber-300 block mb-1">Attempt B (Refactored)</span>
                  {comparison.attemptB.payload.mainFlow || 'None'}
                </div>
              </div>
            </div>

            {/* Section 5: Edge Cases */}
            <div className="rounded-2xl bg-[#0c0f1a]/85 border border-white/[0.08] p-5 space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-white/[0.08] text-xs font-bold text-slate-200">
                <ShieldCheck className="w-4 h-4 text-rose-400" />
                <span>5. Edge Cases & Concurrency</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                <div className="p-3.5 rounded-xl bg-[#07090f]/80 border border-white/[0.06] text-slate-300 whitespace-pre-wrap leading-relaxed">
                  <span className="text-[10px] font-sans font-bold uppercase text-slate-500 block mb-1">Attempt A</span>
                  {comparison.attemptA.payload.edgeCases || 'None'}
                </div>
                <div className="p-3.5 rounded-xl bg-rose-950/20 border border-rose-500/25 text-slate-200 whitespace-pre-wrap leading-relaxed">
                  <span className="text-[10px] font-sans font-bold uppercase text-rose-300 block mb-1">Attempt B (Refactored)</span>
                  {comparison.attemptB.payload.edgeCases || 'None'}
                </div>
              </div>
            </div>

            {/* Section 6: Trade-offs */}
            <div className="rounded-2xl bg-[#0c0f1a]/85 border border-white/[0.08] p-5 space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-white/[0.08] text-xs font-bold text-slate-200">
                <Scale className="w-4 h-4 text-emerald-400" />
                <span>6. Trade-offs & Extensibility</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                <div className="p-3.5 rounded-xl bg-[#07090f]/80 border border-white/[0.06] text-slate-300 whitespace-pre-wrap leading-relaxed">
                  <span className="text-[10px] font-sans font-bold uppercase text-slate-500 block mb-1">Attempt A</span>
                  {comparison.attemptA.payload.tradeOffs || 'None'}
                </div>
                <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-500/25 text-slate-200 whitespace-pre-wrap leading-relaxed">
                  <span className="text-[10px] font-sans font-bold uppercase text-emerald-300 block mb-1">Attempt B (Refactored)</span>
                  {comparison.attemptB.payload.tradeOffs || 'None'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
