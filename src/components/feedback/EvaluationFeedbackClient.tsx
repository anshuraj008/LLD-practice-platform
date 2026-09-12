'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Loader2,
  AlertTriangle,
  RefreshCw,
  ArrowLeft,
  ArrowRight,
  History,
  RotateCcw,
  Sparkles,
  Award,
  CheckCircle2,
} from 'lucide-react';
import { FeedbackSummary } from './FeedbackSummary';
import { RubricCard } from './RubricCard';

interface EvaluationFeedbackClientProps {
  evaluationId: string;
  initialData: any;
  problemSlug: string;
  problemId: string;
}

export function EvaluationFeedbackClient({
  evaluationId,
  initialData,
  problemSlug,
  problemId,
}: EvaluationFeedbackClientProps) {
  const router = useRouter();
  const [data, setData] = useState<any>(initialData);
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryError, setRetryError] = useState<string | null>(null);

  const status = data?.evaluation?.status || 'QUEUED';

  // Poll evaluation status every 2.5s if not terminal
  useEffect(() => {
    if (status === 'COMPLETED' || status === 'FAILED') return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/evaluations/${evaluationId}`);
        if (res.ok) {
          const fresh = await res.json();
          setData(fresh);
          if (fresh?.evaluation?.status === 'COMPLETED' || fresh?.evaluation?.status === 'FAILED') {
            clearInterval(interval);
          }
        }
      } catch (err) {
        console.error('Polling error:', err);
      }
    }, 2500);

    return () => clearInterval(interval);
  }, [evaluationId, status]);

  const handleRetry = async () => {
    setIsRetrying(true);
    setRetryError(null);
    try {
      const res = await fetch(`/api/evaluations/${evaluationId}/retry`, {
        method: 'POST',
      });
      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || 'Retry failed');
      }
      setData((prev: any) => ({
        ...prev,
        evaluation: {
          ...prev.evaluation,
          status: 'QUEUED',
          errorCode: null,
          errorMessage: null,
        },
      }));
    } catch (err: any) {
      setRetryError(err.message || 'Failed to retry evaluation');
    } finally {
      setIsRetrying(false);
    }
  };

  const evalObj = data?.evaluation;

  return (
    <div className="space-y-8">
      {/* Top Nav Breadcrumb */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link
          href={`/problems/${problemSlug}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Problem Overview
        </Link>

        <div className="flex items-center gap-3">
          <Link
            href="/history"
            className="px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-medium text-slate-300 hover:text-white flex items-center gap-1.5 transition-colors"
          >
            <History className="w-3.5 h-3.5" />
            <span>Learning History</span>
          </Link>

          <button
            onClick={() => {
              fetch(`/api/problems/${problemSlug}/attempts`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ forceNew: true }),
              })
                .then((r) => r.json())
                .then((res) => {
                  if (res.attempt?.id) {
                    router.push(`/attempts/${res.attempt.id}`);
                  }
                });
            }}
            className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-blue-600/25 transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Try Again (New Attempt)</span>
          </button>
        </div>
      </div>

      {/* State 1 & 2: QUEUED or EVALUATING */}
      {(status === 'QUEUED' || status === 'EVALUATING') && (
        <div className="p-10 rounded-3xl bg-slate-900/90 border border-slate-800 text-center space-y-6 shadow-2xl">
          <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-blue-500/20 animate-ping" />
            <div className="relative w-14 h-14 rounded-full bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
              <Loader2 className="w-7 h-7 animate-spin" />
            </div>
          </div>

          <div className="max-w-md mx-auto space-y-2">
            <h2 className="text-xl font-bold text-white tracking-tight">
              {status === 'QUEUED' ? 'Evaluation Queued' : 'Analyzing Low-Level Design Architecture...'}
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Evaluating Single Responsibility Principle, decoupling, class contracts, trade-offs, and
              concurrency against the 8-criterion rubric.
            </p>
          </div>

          <div className="flex items-center justify-center gap-2 text-[11px] text-slate-400 font-mono">
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
            <span>Live status: {status}</span>
          </div>
        </div>
      )}

      {/* State 3: FAILED */}
      {status === 'FAILED' && (
        <div className="p-8 rounded-3xl bg-rose-500/10 border border-rose-500/20 space-y-5 shadow-2xl">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-rose-200">Evaluation Could Not Complete</h3>
              <p className="text-xs text-rose-300 leading-relaxed">
                {evalObj?.errorMessage ||
                  'The evaluation engine encountered a temporary error. Your submission snapshot is securely saved and will not be lost.'}
              </p>
              {retryError && <p className="text-xs text-rose-400 font-bold mt-1">{retryError}</p>}
            </div>
          </div>

          <div className="pt-2 flex items-center gap-3">
            <button
              onClick={handleRetry}
              disabled={isRetrying || (evalObj?.retryCount || 0) >= 3}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-40 text-white text-xs font-semibold flex items-center gap-2 shadow-md transition-all"
            >
              {isRetrying ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Retrying...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  <span>Retry Evaluation (Attempt {(evalObj?.retryCount || 0) + 1} of 3)</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* State 4: COMPLETED */}
      {status === 'COMPLETED' && evalObj && (
        <>
          {/* Executive Summary & Radial Gauge */}
          <FeedbackSummary
            overallScore={evalObj.overallScore}
            summary={evalObj.summary}
            strengths={evalObj.strengths}
            nextAttemptFocus={evalObj.nextAttemptFocus}
            evaluatorKind={evalObj.evaluatorKind}
          />

          {/* 8 Rubric Criteria Cards Grid */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-400" />
                Detailed Rubric Criteria Breakdown
              </h3>
              <span className="text-xs text-slate-400">
                8 Evaluated Dimensions
              </span>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {evalObj.items.map((item: any) => (
                <RubricCard
                  key={item.criterionId}
                  criterionId={item.criterionId}
                  name={item.name}
                  weight={item.weight}
                  score={item.score}
                  evidence={item.evidence}
                  strength={item.strength}
                  concern={item.concern}
                  suggestion={item.suggestion}
                  confidence={item.confidence}
                />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
