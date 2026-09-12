import React from 'react';
import Link from 'next/link';
import { ArrowRight, Clock, Award, Tag, Sparkles, CheckCircle2 } from 'lucide-react';
import { excerptForCard, getDifficultyColor, getScoreColor } from '@/lib/utils';

interface ProblemCardProps {
  problem: {
    id: string;
    slug: string;
    title: string;
    difficulty: 'EASY' | 'MEDIUM' | 'HARD';
    description: string;
    estimatedMinutes: number;
    tags: string[];
    attemptCount: number;
    latestAttemptId: string | null;
    latestAttemptStatus: string | null;
    bestScore: number | null;
  };
}

export function ProblemCard({ problem }: ProblemCardProps) {
  const diffColors = getDifficultyColor(problem.difficulty);
  const scoreColors = getScoreColor(problem.bestScore);

  return (
    <div className="group relative h-full rounded-2xl bg-slate-900/90 border border-slate-800/80 hover:border-slate-700 p-6 flex flex-col justify-between transition-all duration-200 hover:shadow-xl hover:shadow-blue-950/20 hover:-translate-y-0.5">
      <div>
        {/* Top Badges */}
        <div className="flex items-center justify-between gap-2 mb-3.5">
          <div className="flex items-center gap-2">
            <span
              className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${diffColors.bg} ${diffColors.text} ${diffColors.border}`}
            >
              {problem.difficulty}
            </span>
            <div className="flex items-center gap-1 text-slate-400 text-xs">
              <Clock className="w-3.5 h-3.5" />
              <span>{problem.estimatedMinutes}m</span>
            </div>
          </div>

          {problem.bestScore !== null && (
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-800/80 border border-slate-700/60">
              <Award className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-xs font-semibold text-slate-200">
                Best: <span className={scoreColors.text}>{problem.bestScore}%</span>
              </span>
            </div>
          )}
        </div>

        {/* Title */}
        <h3 className="text-lg font-bold text-slate-100 group-hover:text-blue-400 transition-colors tracking-tight line-clamp-1">
          {problem.title}
        </h3>

        {/* Description: 3-line clamp with a sentence/word-boundary excerpt so the cut is intentional */}
        <p
          className="card-excerpt mt-2.5 min-h-[3.75rem] text-xs text-slate-400 leading-relaxed"
          title={problem.description}
        >
          {excerptForCard(problem.description)}
        </p>

        {/* Tags */}
        <div className="mt-4 flex flex-wrap gap-1.5">
          {problem.tags.slice(0, 3).map((tag, idx) => (
            <span
              key={idx}
              className="text-[11px] px-2 py-0.5 rounded-md bg-slate-800/60 text-slate-400 border border-slate-750"
            >
              #{tag}
            </span>
          ))}
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between">
        <div className="text-xs text-slate-400 flex items-center gap-1.5">
          {problem.attemptCount > 0 ? (
            <span className="flex items-center gap-1 text-slate-400">
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
              {problem.attemptCount} {problem.attemptCount === 1 ? 'attempt' : 'attempts'}
            </span>
          ) : (
            <span className="text-slate-400">Not attempted yet</span>
          )}
        </div>

        <Link
          href={`/problems/${problem.slug}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-400 group-hover:text-blue-300 hover:underline"
        >
          {problem.latestAttemptStatus === 'DRAFT'
            ? 'Continue Draft'
            : problem.attemptCount > 0
            ? 'Practice Again'
            : 'Start Design'}
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>
    </div>
  );
}
