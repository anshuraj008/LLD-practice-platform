import React from 'react';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { RelationalDatabase } from '@/adapters/db/database';
import { getCurrentUser } from '@/lib/session';
import { getDifficultyColor } from '@/lib/utils';
import {
  ArrowLeft,
  Clock,
  Play,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Sparkles,
  BookOpen,
  Award,
  Layers,
  ShieldAlert,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

interface ProblemPageProps {
  params: Promise<{ slug: string }>;
}

export default async function ProblemDetailPage({ params }: ProblemPageProps) {
  const { slug } = await params;
  const db = RelationalDatabase.getInstance();
  const user = await getCurrentUser();

  const problem = db.getProblemBySlug(slug);
  if (!problem) {
    notFound();
  }

  const rubric = db.getRubricById(problem.rubricId);
  const criteria = rubric ? JSON.parse(rubric.criteriaJson) : [];
  const requirements: Array<{ id: string; category: string; description: string }> = JSON.parse(
    problem.requirementsJson
  );
  const tags: string[] = JSON.parse(problem.tagsJson);

  const userAttempts = db.getAttemptsByUserAndProblem(user.id, problem.id);
  const activeDraft = userAttempts.find((a) => a.status === 'DRAFT');

  const diffColors = getDifficultyColor(problem.difficulty);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Back button */}
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Problem Library
      </Link>

      {/* Header Info */}
      <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-6 sm:p-8 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span
              className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${diffColors.bg} ${diffColors.text} ${diffColors.border}`}
            >
              {problem.difficulty}
            </span>
            <div className="flex items-center gap-1 text-slate-400 text-xs">
              <Clock className="w-3.5 h-3.5" />
              <span>{problem.estimatedMinutes} mins estimated</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {tags.map((tag, idx) => (
              <span
                key={idx}
                className="text-[11px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700"
              >
                #{tag}
              </span>
            ))}
          </div>
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          {problem.title}
        </h1>

        <p className="text-sm text-slate-300 leading-relaxed">{problem.description}</p>

        {/* Start / Continue Button Action */}
        <div className="pt-4 flex flex-wrap items-center gap-4">
          <form
            action={async () => {
              'use server';
              const { attemptService } = await import('@/services/attempt-service');
              const { getCurrentUser } = await import('@/lib/session');
              const currentUser = await getCurrentUser();
              const attempt = attemptService.getOrCreateDraftAttempt(currentUser.id, problem.id);
              redirect(`/attempts/${attempt.id}`);
            }}
          >
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm shadow-lg shadow-blue-600/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Play className="w-4 h-4 fill-white" />
              {activeDraft ? 'Continue Working on Draft' : 'Start Practice Attempt'}
            </button>
          </form>

          {activeDraft && (
            <form
              action={async () => {
                'use server';
                const { attemptService } = await import('@/services/attempt-service');
                const { getCurrentUser } = await import('@/lib/session');
                const currentUser = await getCurrentUser();
                const freshAttempt = attemptService.createNewDraftAttempt(currentUser.id, problem.id);
                redirect(`/attempts/${freshAttempt.id}`);
              }}
            >
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white font-medium text-xs border border-slate-700 transition-colors"
              >
                <span>Discard Draft & Start Fresh</span>
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Requirements Section */}
      <div className="rounded-2xl bg-slate-900/70 border border-slate-800 p-6 sm:p-8 space-y-6">
        <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
          <Layers className="w-5 h-5 text-blue-400" />
          System Requirements & Constraints
        </h2>

        <div className="grid grid-cols-1 gap-3">
          {requirements.map((req, idx) => {
            const isConstraint = req.category === 'constraint';
            const isNonFunctional = req.category === 'non-functional';

            return (
              <div
                key={req.id || idx}
                className={`p-4 rounded-xl border flex items-start gap-3 ${
                  isConstraint
                    ? 'bg-rose-500/5 border-rose-500/20'
                    : isNonFunctional
                    ? 'bg-amber-500/5 border-amber-500/20'
                    : 'bg-slate-800/40 border-slate-800'
                }`}
              >
                <div className="mt-0.5">
                  {isConstraint ? (
                    <ShieldAlert className="w-4 h-4 text-rose-400" />
                  ) : isNonFunctional ? (
                    <AlertCircle className="w-4 h-4 text-amber-400" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-blue-400" />
                  )}
                </div>
                <div className="space-y-0.5">
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider ${
                      isConstraint
                        ? 'text-rose-400'
                        : isNonFunctional
                        ? 'text-amber-400'
                        : 'text-blue-400'
                    }`}
                  >
                    {req.category}
                  </span>
                  <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                    {req.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Rubric Criteria Preview */}
      <div className="rounded-2xl bg-slate-900/70 border border-slate-800 p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-400" />
            Evaluation Rubric Preview
          </h2>
          <span className="text-xs text-slate-400 font-medium">
            8 Standard Weighted Dimensions
          </span>
        </div>

        <p className="text-xs text-slate-400">
          Your design will be evaluated objectively against these criteria. Each criterion provides
          an exact score (0-5), cited evidence from your submission, concerns, and actionable suggestions.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {criteria.map((c: any) => (
            <div
              key={c.id}
              className="p-3.5 rounded-xl bg-slate-800/50 border border-slate-750/70 flex flex-col justify-between gap-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-200">{c.name}</span>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  {(c.weight * 100).toFixed(0)}% Weight
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-normal">{c.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
