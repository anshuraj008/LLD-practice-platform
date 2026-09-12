export interface DbUser {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

export interface DbRubric {
  id: string;
  name: string;
  version: string;
  criteriaJson: string;
}

export interface DbProblem {
  id: string;
  slug: string;
  title: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  description: string;
  requirementsJson: string;
  rubricId: string;
  isActive: boolean;
  tagsJson: string;
  estimatedMinutes: number;
  createdAt: string;
}

export interface DbAttempt {
  id: string;
  userId: string;
  problemId: string;
  status: 'DRAFT' | 'SUBMITTED';
  draftJson: string;
  createdAt: string;
  updatedAt: string;
  submittedAt: string | null;
}

export interface DbSubmission {
  id: string;
  attemptId: string;
  format: 'structured-text' | 'class-diagram';
  payloadJson: string;
  contentHash: string;
  idempotencyKey: string;
  createdAt: string;
}

export interface DbEvaluation {
  id: string;
  submissionId: string;
  status: 'QUEUED' | 'EVALUATING' | 'COMPLETED' | 'FAILED';
  evaluatorKind: string;
  evaluatorVersion: string;
  rubricVersion: string;
  overallScore: number | null;
  summary: string | null;
  strengthsJson: string;
  nextAttemptFocusJson: string;
  errorCode: string | null;
  errorMessage: string | null;
  retryCount: number;
  createdAt: string;
  completedAt: string | null;
}

export interface DbEvaluationItem {
  id: string;
  evaluationId: string;
  criterionId: string;
  score: number;
  evidenceJson: string;
  strength?: string;
  concern: string;
  suggestion: string;
  confidence: number;
}
