import React from 'react';
import { Award, CheckCircle2, Target, Sparkles, TrendingUp } from 'lucide-react';
import { getScoreColor } from '@/lib/utils';

interface FeedbackSummaryProps {
  overallScore: number | null;
  summary: string | null;
  strengths: string[];
  nextAttemptFocus: string[];
  evaluatorKind: string;
}

export function FeedbackSummary({
  overallScore,
  summary,
  strengths,
  nextAttemptFocus,
  evaluatorKind,
}: FeedbackSummaryProps) {
  const scoreColors = getScoreColor(overallScore);
  const score = overallScore ?? 0;

  // Calculate SVG circular stroke offset for radius 38 (circumference ~ 238.76)
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-slate-800 p-6 sm:p-8 shadow-2xl space-y-6">
      <div className="flex flex-col md:flex-row items-center md:items-start gap-6 sm:gap-8">
        {/* Radial Score Gauge */}
        <div className="flex flex-col items-center flex-shrink-0">
          <div className="relative w-32 h-32 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 96 96">
              <circle
                cx="48"
                cy="48"
                r={radius}
                className="stroke-slate-800"
                strokeWidth="8"
                fill="none"
              />
              <circle
                cx="48"
                cy="48"
                r={radius}
                className={`${scoreColors.ring} transition-all duration-1000 ease-out`}
                strokeWidth="8"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="none"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className={`text-3xl font-black tracking-tight ${scoreColors.text}`}>
                {overallScore !== null ? `${overallScore}` : '--'}
              </span>
              <span className="text-[10px] uppercase font-bold text-slate-400">Score / 100</span>
            </div>
          </div>

          <div className="mt-2 text-[11px] font-medium text-slate-400 text-center">
            {score >= 85
              ? '🌟 Production Ready'
              : score >= 70
              ? '👍 Solid Architecture'
              : '⚡ Needs Refinement'}
          </div>
        </div>

        {/* Executive Summary */}
        <div className="flex-1 space-y-3 text-center md:text-left">
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
            <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Architecture Evaluation
            </span>
            <span className="text-[11px] text-slate-400">
              Evaluator: <span className="font-mono text-slate-300">{evaluatorKind}</span>
            </span>
          </div>

          <p className="text-sm text-slate-200 leading-relaxed">
            {summary || 'Evaluation summary is being processed...'}
          </p>
        </div>
      </div>

      {/* Strengths & Next Attempt Focus Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-800/80">
        {/* Key Strengths */}
        <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider">
            <CheckCircle2 className="w-4 h-4" />
            <span>Demonstrated Strengths</span>
          </div>
          <ul className="space-y-1.5">
            {strengths.length > 0 ? (
              strengths.map((str, idx) => (
                <li key={idx} className="text-xs text-slate-300 flex items-start gap-2">
                  <span className="text-emerald-400 font-bold mt-0.5">•</span>
                  <span>{str}</span>
                </li>
              ))
            ) : (
              <li className="text-xs text-slate-400">Analysis completed.</li>
            )}
          </ul>
        </div>

        {/* Next Attempt Focus */}
        <div className="p-4 rounded-2xl bg-blue-500/5 border border-blue-500/20 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-blue-400 uppercase tracking-wider">
            <Target className="w-4 h-4" />
            <span>Next Attempt Focus Areas</span>
          </div>
          <ul className="space-y-1.5">
            {nextAttemptFocus.length > 0 ? (
              nextAttemptFocus.map((focus, idx) => (
                <li key={idx} className="text-xs text-slate-300 flex items-start gap-2">
                  <span className="text-blue-400 font-bold mt-0.5">•</span>
                  <span>{focus}</span>
                </li>
              ))
            ) : (
              <li className="text-xs text-slate-400">Review individual rubric cards below.</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
