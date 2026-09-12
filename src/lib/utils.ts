import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
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
        text: 'text-emerald-600 dark:text-emerald-400',
        border: 'border-emerald-500/30',
      };
    case 'MEDIUM':
      return {
        bg: 'bg-amber-500/10 dark:bg-amber-500/15',
        text: 'text-amber-600 dark:text-amber-400',
        border: 'border-amber-500/30',
      };
    case 'HARD':
      return {
        bg: 'bg-rose-500/10 dark:bg-rose-500/15',
        text: 'text-rose-600 dark:text-rose-400',
        border: 'border-rose-500/30',
      };
    default:
      return {
        bg: 'bg-slate-500/10',
        text: 'text-slate-600 dark:text-slate-400',
        border: 'border-slate-500/30',
      };
  }
}

export function getScoreColor(score: number | null | undefined): { ring: string; text: string; badge: string } {
  if (score === null || score === undefined) {
    return {
      ring: 'stroke-slate-600',
      text: 'text-slate-400',
      badge: 'bg-slate-800 text-slate-300 border-slate-700',
    };
  }
  if (score >= 85) {
    return {
      ring: 'stroke-emerald-500',
      text: 'text-emerald-400',
      badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    };
  }
  if (score >= 70) {
    return {
      ring: 'stroke-blue-500',
      text: 'text-blue-400',
      badge: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    };
  }
  if (score >= 50) {
    return {
      ring: 'stroke-amber-500',
      text: 'text-amber-400',
      badge: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    };
  }
  return {
    ring: 'stroke-rose-500',
    text: 'text-rose-400',
    badge: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
  };
}
