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
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-blue-950/40 border border-slate-800 p-8 sm:p-10 shadow-2xl">
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Master Object-Oriented & Low-Level Design</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
            Practice Real-World LLD with{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">
              Explainable AI Feedback
            </span>
          </h1>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl">
            Choose a problem, author a structured design, and receive instant, objective evaluation
            scored against an 8-criterion industry rubric with cited evidence, concrete trade-off analysis,
            and iterative attempt comparisons.
          </p>

          {/* 5-Step Loop Visual Pills */}
          <div className="pt-2 flex flex-wrap items-center gap-2 text-xs">
            <span className="px-3 py-1 rounded-lg bg-slate-800/90 text-slate-300 border border-slate-750 font-medium flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-blue-400" /> 1. Choose Problem
            </span>
            <span className="text-slate-600">→</span>
            <span className="px-3 py-1 rounded-lg bg-slate-800/90 text-slate-300 border border-slate-750 font-medium flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-indigo-400" /> 2. Design Architecture
            </span>
            <span className="text-slate-600">→</span>
            <span className="px-3 py-1 rounded-lg bg-slate-800/90 text-slate-300 border border-slate-750 font-medium flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400" /> 3. Submit
            </span>
            <span className="text-slate-600">→</span>
            <span className="px-3 py-1 rounded-lg bg-slate-800/90 text-slate-300 border border-slate-750 font-medium flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> 4. Explainable Rubric
            </span>
            <span className="text-slate-600">→</span>
            <span className="px-3 py-1 rounded-lg bg-slate-800/90 text-slate-300 border border-slate-750 font-medium flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-rose-400" /> 5. Compare & Improve
            </span>
          </div>
        </div>
      </div>

      {/* Problem Grid Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 tracking-tight flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-400" />
            Curated LLD Problem Library
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            4 foundational system design problems seeded for deliberate practice.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/history"
            className="text-xs font-semibold px-4 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-750 text-slate-200 border border-slate-700/60 transition-colors flex items-center gap-1.5"
          >
            <span>View Previous Attempts</span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
          </Link>
        </div>
      </div>

      {/* Problem Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {problemsWithMeta.map((problem) => (
          <ProblemCard key={problem.id} problem={problem} />
        ))}
      </div>
    </div>
  );
}
