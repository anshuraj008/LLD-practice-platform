import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Truncate card copy at a sentence or word boundary so ellipsis does not look accidental. */
export function excerptForCard(text: string, maxChars = 168): string {
  const normalized = text.replace(/\s+/g, ' ').trim();
  if (normalized.length <= maxChars) return normalized;

  const window = normalized.slice(0, maxChars + 1);
  const sentenceMatch = window.match(/^([\s\S]*?[.!?])(?:\s|$)/);
  if (sentenceMatch && sentenceMatch[1].length >= 80) {
    return sentenceMatch[1].trim();
  }

  const sliced = normalized.slice(0, maxChars);
  const lastSpace = sliced.lastIndexOf(' ');
  const cut = lastSpace > 80 ? lastSpace : maxChars;
  return `${sliced.slice(0, cut).trim()}…`;
}

export function formatDate(isoString: string | null | undefined): string {
  if (!isoString) return 'N/A';
  try {
    const date = new Date(isoString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  } catch {
    return isoString;
  }
}

export function getDifficultyColor(difficulty: string): { bg: string; text: string; border: string } {
  switch (difficulty.toUpperCase()) {
    case 'EASY':
      return {
        bg: 'bg-emerald-500/10 dark:bg-emerald-500/15',
        text: 'text-emerald-400',
        border: 'border-emerald-500/25',
      };
    case 'MEDIUM':
      return {
        bg: 'bg-amber-500/10 dark:bg-amber-500/15',
        text: 'text-amber-400',
        border: 'border-amber-500/25',
      };
    case 'HARD':
      return {
        bg: 'bg-rose-500/10 dark:bg-rose-500/15',
        text: 'text-rose-400',
        border: 'border-rose-500/25',
      };
    default:
      return {
        bg: 'bg-slate-500/10',
        text: 'text-slate-400',
        border: 'border-slate-500/25',
      };
  }
}

export function getScoreColor(score: number | null | undefined): { ring: string; text: string; badge: string; glow: string } {
  if (score === null || score === undefined) {
    return {
      ring: 'stroke-slate-700',
      text: 'text-slate-400',
      badge: 'bg-slate-800/80 text-slate-300 border-slate-700/60',
      glow: '',
    };
  }
  if (score >= 85) {
    return {
      ring: 'stroke-emerald-400',
      text: 'text-emerald-400',
      badge: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
      glow: 'shadow-emerald-500/20',
    };
  }
  if (score >= 70) {
    return {
      ring: 'stroke-violet-400',
      text: 'text-violet-300',
      badge: 'bg-violet-500/10 text-violet-300 border-violet-500/30',
      glow: 'shadow-violet-500/20',
    };
  }
  if (score >= 50) {
    return {
      ring: 'stroke-amber-400',
      text: 'text-amber-400',
      badge: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
      glow: 'shadow-amber-500/20',
    };
  }
  return {
    ring: 'stroke-rose-400',
    text: 'text-rose-400',
    badge: 'bg-rose-500/10 text-rose-300 border-rose-500/30',
    glow: 'shadow-rose-500/20',
  };
}
