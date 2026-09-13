import React from 'react';
import { RelationalDatabase } from '@/adapters/db/database';
import { runSeed } from '@/adapters/db/seed';
import { getCurrentUser } from '@/lib/session';
import { ProblemCard } from '@/components/problem/ProblemCard';
import { BookOpen, Sparkles, Target, Zap, ArrowRight, Layers, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const db = RelationalDatabase.getInstance();

  // Auto-seed if database is brand new
  if (db.getProblems().length === 0) {
    runSeed();
  }

  const user = await getCurrentUser();
  const allProblems = db.getProblems();
  const userAttempts = db.getAttemptsByUserId(user.id);
  const submissions = db.getSubmissions();
  const evaluations = db.getEvaluations();

  const problemsWithMeta = allProblems.map((p) => {
    const attemptsForProblem = userAttempts.filter((a) => a.problemId === p.id);
    const latestAttempt = attemptsForProblem.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )[0];

    let bestScore: number | null = null;
    for (const att of attemptsForProblem) {
      const sub = submissions.find((s) => s.attemptId === att.id);
      if (sub) {
        const ev = evaluations.find((e) => e.submissionId === sub.id && e.status === 'COMPLETED');
        if (ev && ev.overallScore !== null) {
          if (bestScore === null || ev.overallScore > bestScore) {
            bestScore = ev.overallScore;
          }
        }
      }
    }

    return {
      id: p.id,
      slug: p.slug,
      title: p.title,
      difficulty: p.difficulty,
      description: p.description,
      estimatedMinutes: p.estimatedMinutes,
      tags: JSON.parse(p.tagsJson),
      attemptCount: attemptsForProblem.length,
      latestAttemptId: latestAttempt?.id || null,
      latestAttemptStatus: latestAttempt?.status || null,
      bestScore,
    };
  });

  return (
    <div className="space-y-10">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0e121d] via-[#101322] to-[#0d1624] border border-white/[0.08] p-8 sm:p-10 shadow-2xl relative">
        {/* Subtle decorative glow orb behind text */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-10 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-violet-500/15 to-cyan-500/15 border border-violet-500/30 text-violet-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Object-Oriented Design & Architecture Studio</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight">
            Master Real-World LLD with{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-indigo-300 to-cyan-400">
              Explainable AI Rubrics
            </span>
          </h1>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl">
            Author structured object models, define SOLID boundaries, and receive deterministic & AI-driven rubric feedback
            with cited code evidence, trade-off depth, and iterative attempt comparisons.
          </p>

          {/* 5-Step Loop Visual Pills */}
          <div className="pt-3 flex flex-wrap items-center gap-2 text-xs">
            <span className="px-3 py-1 rounded-xl bg-slate-900/90 text-slate-300 border border-white/[0.08] font-medium flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-violet-400" /> 1. Problem Spec
            </span>
            <span className="text-slate-600">→</span>
            <span className="px-3 py-1 rounded-xl bg-slate-900/90 text-slate-300 border border-white/[0.08] font-medium flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-cyan-400" /> 2. Model & Contracts
            </span>
            <span className="text-slate-600">→</span>
            <span className="px-3 py-1 rounded-xl bg-slate-900/90 text-slate-300 border border-white/[0.08] font-medium flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400" /> 3. Submit
            </span>
            <span className="text-slate-600">→</span>
            <span className="px-3 py-1 rounded-xl bg-slate-900/90 text-slate-300 border border-white/[0.08] font-medium flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> 4. 8-Criterion Feedback
            </span>
            <span className="text-slate-600">→</span>
            <span className="px-3 py-1 rounded-xl bg-slate-900/90 text-slate-300 border border-white/[0.08] font-medium flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-rose-400" /> 5. Compare & Evolve
            </span>
          </div>
        </div>
      </div>

      {/* Problem Grid Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 tracking-tight flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-lg bg-violet-500/15 border border-violet-500/30 flex items-center justify-center text-violet-400">
              <BookOpen className="w-3.5 h-3.5" />
            </div>
            Curated LLD Problem Library
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            4 foundational system design problems seeded for deliberate object-oriented practice.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/history"
            className="text-xs font-semibold px-4 py-2 rounded-xl bg-slate-900/90 hover:bg-slate-800/90 text-slate-200 border border-white/[0.1] hover:border-violet-500/30 transition-all flex items-center gap-1.5"
          >
            <span>Learning History</span>
            <ArrowRight className="w-3.5 h-3.5 text-violet-400" />
          </Link>
        </div>
      </div>

      {/* Problem Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
        {problemsWithMeta.map((problem) => (
          <ProblemCard key={problem.id} problem={problem} />
        ))}
      </div>
    </div>
  );
}
