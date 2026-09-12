import { FeedbackItem } from './feedback';

export type EvaluationStatus = 'QUEUED' | 'EVALUATING' | 'COMPLETED' | 'FAILED';

export interface Evaluation {
  id: string;
  submissionId: string;
  status: EvaluationStatus;
  evaluatorKind: string; // e.g. 'gemini-1.5-pro' | 'deterministic-mock' | 'hybrid'
  evaluatorVersion: string;
  rubricVersion: string;
  overallScore: number | null; // 0-100
  summary: string | null;
  items: FeedbackItem[];
  strengths: string[];
  nextAttemptFocus: string[];
  errorCode: string | null;
  errorMessage: string | null;
  retryCount: number;
  createdAt: string;
  completedAt: string | null;
}
