import React from 'react';
import { Quote, AlertCircle, Lightbulb, ShieldCheck, CheckCircle2, ThumbsUp } from 'lucide-react';

export interface CriterionFeedbackProps {
  criterionId: string;
  name: string;
  weight: number;
  score: number; // 0 to 5
  evidence: string[];
  strength?: string;
  concern: string;
  suggestion: string;
  confidence: number;
}

export function RubricCard({
  name,
  weight,
  score,
  evidence,
  strength,
  concern,
  suggestion,
  confidence,
}: CriterionFeedbackProps) {
  const isHigh = score >= 4;
  const isMedium = score === 3;

  return (
    <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-5 sm:p-6 space-y-4 shadow-lg hover:border-slate-700 transition-colors">
      {/* Header: Title, Weight & Score */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-bold text-slate-100">{name}</h4>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
              {(weight * 100).toFixed(0)}% Weight
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <div
                key={star}
                className={`w-3 h-3 rounded-full ${
                  star <= score
                    ? isHigh
                      ? 'bg-emerald-400'
                      : isMedium
                      ? 'bg-blue-400'
                      : 'bg-amber-400'
                    : 'bg-slate-800'
                }`}
              />
            ))}
          </div>

          <div
            className={`px-3 py-1 rounded-xl font-mono text-xs font-bold border ${
              isHigh
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : isMedium
                ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
            }`}
          >
            {score} / 5
          </div>
        </div>
      </div>

      {/* Quoted Evidence Chips */}
      {evidence.length > 0 && (
        <div className="space-y-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Quote className="w-3 h-3 text-blue-400" />
            Cited Submission Evidence
          </span>
          <div className="flex flex-wrap gap-2">
            {evidence.map((quote, idx) => (
              <div
                key={idx}
                className="px-3 py-2 rounded-xl bg-slate-950/70 border border-slate-800 text-xs font-mono text-slate-300 leading-relaxed italic"
              >
                &ldquo;{quote}&rdquo;
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Strength, concern, and concrete suggestion */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
        <div className="p-3.5 rounded-xl bg-emerald-500/5 border border-emerald-500/15 space-y-1.5">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
            <ThumbsUp className="w-3.5 h-3.5" />
            <span>Strength</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            {strength || 'The submission provides relevant evidence for this criterion.'}
          </p>
        </div>

        {/* Concern */}
        <div className="p-3.5 rounded-xl bg-rose-500/5 border border-rose-500/15 space-y-1.5">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-rose-400 uppercase tracking-wider">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Concern</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">{concern}</p>
        </div>

        {/* Suggestion */}
        <div className="p-3.5 rounded-xl bg-emerald-500/5 border border-emerald-500/15 space-y-1.5">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
            <Lightbulb className="w-3.5 h-3.5" />
            <span>Suggestion</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">{suggestion}</p>
        </div>
      </div>

      {/* Footer: Confidence indicator */}
      <div className="flex items-center justify-end text-[10px] text-slate-400 gap-1 pt-1">
        <ShieldCheck className="w-3 h-3 text-slate-400" />
        <span>
          Confidence: {confidence >= 0.85 ? 'High' : confidence >= 0.65 ? 'Medium' : 'Low'} ({(confidence * 100).toFixed(0)}%)
        </span>
      </div>
    </div>
  );
}
