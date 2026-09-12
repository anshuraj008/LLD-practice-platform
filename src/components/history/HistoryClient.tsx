'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  History,
  TrendingUp,
  Award,
  AlertCircle,
  GitCompare,
  ArrowRight,
  CheckCircle2,
  Calendar,
  Box,
  Layers,
  Sparkles,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { UserHistoryOverview, HistoryAttemptItem } from '@/services/history-service';
import { formatDate, getDifficultyColor, getScoreColor } from '@/lib/utils';

interface HistoryClientProps {
  initialHistory: UserHistoryOverview;
  userName: string;
}

export function HistoryClient({ initialHistory, userName }: HistoryClientProps) {
  const router = useRouter();
  const [selectedAttempts, setSelectedAttempts] = useState<string[]>([]);
  const [retryingEvaluationId, setRetryingEvaluationId] = useState<string | null>(null);

  const handleToggleSelect = (attemptId: string) => {
    setSelectedAttempts((prev) => {
      if (prev.includes(attemptId)) {
        return prev.filter((id) => id !== attemptId);
      }
      if (prev.length >= 2) {
        return [prev[1], attemptId]; // keep last and add new
      }
      return [...prev, attemptId];
    });
  };

  const handleCompare = () => {
    if (selectedAttempts.length === 2) {
      router.push(`/compare?a=${selectedAttempts[0]}&b=${selectedAttempts[1]}`);
    }
  };

  const handleRetryEvaluation = async (evaluationId: string) => {
    setRetryingEvaluationId(evaluationId);
    try {
      const response = await fetch(`/api/evaluations/${evaluationId}/retry`, { method: 'POST' });
      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Retry failed');
      }
      router.refresh();
    } catch (error) {
      console.error('Evaluation retry failed:', error);
    } finally {
      setRetryingEvaluationId(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header & Stats Banner */}
      <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-6 sm:p-8 space-y-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-xs font-semibold mb-2">
              <History className="w-3.5 h-3.5" />
              <span>Learner Practice Journey</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Learning History & Score Trends
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Tracking Low-Level Design iterations, score progressions, and architectural improvement for {userName}.
            </p>
          </div>

          {selectedAttempts.length === 2 && (
            <button
              onClick={handleCompare}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-blue-600/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <GitCompare className="w-4 h-4" />
              <span>Compare 2 Selected Attempts</span>
            </button>
          )}
        </div>

        {/* 4 Stat Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-1">
            <span className="text-[11px] font-medium text-slate-400">Total Attempts</span>
            <p className="text-2xl font-black text-white">{initialHistory.totalAttempts}</p>
          </div>
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-1">
            <span className="text-[11px] font-medium text-slate-400">Completed Reviews</span>
            <p className="text-2xl font-black text-blue-400">
              {initialHistory.completedSubmissions}
            </p>
          </div>
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-1">
            <span className="text-[11px] font-medium text-slate-400">Average Score</span>
            <p className="text-2xl font-black text-emerald-400">
              {initialHistory.averageScore}%
            </p>
          </div>
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-1">
            <span className="text-[11px] font-medium text-slate-400">Highest Score</span>
            <p className="text-2xl font-black text-amber-400">
              {initialHistory.highestScore}%
            </p>
          </div>
        </div>
      </div>

      {/* Recurring Weaknesses Panel */}
      {initialHistory.recurringWeaknesses.length > 0 && (
        <div className="rounded-2xl bg-slate-900/70 border border-slate-800 p-6 space-y-4 shadow-lg">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Recurring Weaknesses & Focus Areas
            </h3>
          </div>
          <p className="text-xs text-slate-400">
            Criteria across your submissions that averaged lower scores. Prioritize these in your next design attempt.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
            {initialHistory.recurringWeaknesses.map((w) => (
              <div
                key={w.criterionId}
                className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200">{w.criterionName}</span>
                  <span className="text-xs font-mono font-bold text-amber-400 px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
                    Avg {w.averageScore}/5
                  </span>
                </div>
                {w.commonConcerns.length > 0 && (
                  <p className="text-[11px] text-slate-400 leading-relaxed line-clamp-2">
                    {w.commonConcerns[0]}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Attempts Timeline List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <Layers className="w-5 h-5 text-blue-400" />
            Attempt History Timeline
          </h3>
          <span className="text-xs text-slate-400">
            Select any 2 attempts to compare side-by-side
          </span>
        </div>

        {initialHistory.attempts.length === 0 ? (
          <div className="p-12 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-3">
            <Box className="w-10 h-10 text-slate-600 mx-auto" />
            <h4 className="text-sm font-bold text-slate-300">No attempts recorded yet</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Start practicing with any LLD problem in the library to see your score progression.
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold"
            >
              <span>Explore Problems</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {initialHistory.attempts.map((att) => {
              const isSelected = selectedAttempts.includes(att.attemptId);
              const diffColors = getDifficultyColor(att.problemDifficulty);
              const scoreColors = getScoreColor(att.overallScore);
              const isDraft = att.status === 'DRAFT';
              const evaluationStatus = att.evaluationStatus || 'QUEUED';
              const isRetrying = retryingEvaluationId === att.evaluationId;

              return (
                <div
                  key={att.attemptId}
                  className={`p-5 rounded-2xl border transition-all ${
                    isSelected
                      ? 'bg-blue-950/30 border-blue-500/60 shadow-lg shadow-blue-950/20'
                      : 'bg-slate-900/90 border-slate-800 hover:border-slate-750'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    {/* Checkbox & Problem Info */}
                    <div className="flex items-start gap-3.5">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleSelect(att.attemptId)}
                        className="mt-1 w-4 h-4 rounded bg-slate-950 border-slate-700 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        title="Select for comparison"
                      />

                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-slate-100">{att.problemTitle}</h4>
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${diffColors.bg} ${diffColors.text} ${diffColors.border}`}
                          >
                            {att.problemDifficulty}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-slate-500" />
                            {formatDate(att.submittedAt || att.createdAt)}
                          </span>
                          <span>•</span>
                          <span>{att.classesCount} classes defined</span>
                        </div>
                      </div>
                    </div>

                    {/* Score & Progression Delta */}
                    <div className="flex items-center justify-between sm:justify-end gap-4">
                      {isDraft ? (
                        <span className="text-xs font-medium text-amber-400 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20">
                          Draft in Progress
                        </span>
                      ) : evaluationStatus === 'COMPLETED' && att.overallScore !== undefined && att.overallScore !== null ? (
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`px-3 py-1 rounded-xl text-xs font-mono font-bold border ${scoreColors.badge}`}
                          >
                            Score: {att.overallScore}%
                          </div>

                          {att.scoreDeltaFromPrevious !== null &&
                            att.scoreDeltaFromPrevious !== undefined && (
                              <div
                                className={`text-xs font-bold flex items-center gap-0.5 ${
                                  att.scoreDeltaFromPrevious >= 0
                                    ? 'text-emerald-400'
                                    : 'text-rose-400'
                                }`}
                              >
                                {att.scoreDeltaFromPrevious >= 0 ? '+' : ''}
                                {att.scoreDeltaFromPrevious}% vs prev
                              </div>
                            )}
                        </div>
                      ) : evaluationStatus === 'QUEUED' ? (
                        <span className="text-xs font-medium text-blue-400 px-2.5 py-1 rounded-lg bg-blue-500/10 border border-blue-500/20">
                          Evaluation Queued
                        </span>
                      ) : evaluationStatus === 'EVALUATING' ? (
                        <span className="text-xs font-medium text-blue-400 px-2.5 py-1 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center gap-1.5">
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          Evaluating...
                        </span>
                      ) : (
                        <span className="text-xs font-medium text-rose-400 px-2.5 py-1 rounded-lg bg-rose-500/10 border border-rose-500/20">
                          Evaluation Failed
                        </span>
                      )}

                      {isDraft ? (
                        <Link
                          href={`/attempts/${att.attemptId}`}
                          className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-xs font-semibold text-slate-200 hover:text-white border border-slate-700 transition-colors flex items-center gap-1"
                        >
                          <span>Resume Draft</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      ) : evaluationStatus === 'FAILED' ? (
                        <button
                          type="button"
                          onClick={() => att.evaluationId && handleRetryEvaluation(att.evaluationId)}
                          disabled={!att.evaluationId || isRetrying}
                          className="px-3.5 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 disabled:opacity-50 text-xs font-semibold text-rose-300 border border-rose-500/30 transition-colors flex items-center gap-1"
                        >
                          {isRetrying ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                          <span>{isRetrying ? 'Retrying...' : 'Retry Evaluation'}</span>
                        </button>
                      ) : (
                        <Link
                          href={`/attempts/${att.attemptId}/feedback`}
                          className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-xs font-semibold text-slate-200 hover:text-white border border-slate-700 transition-colors flex items-center gap-1"
                        >
                          <span>{evaluationStatus === 'COMPLETED' ? 'View Feedback' : 'View Evaluation'}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
