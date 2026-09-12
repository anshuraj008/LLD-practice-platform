import { Evaluation, EvaluationStatus } from '../types/evaluation';
import { EvaluationResult } from '../types/feedback';

export class EvaluationLifecycleError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'EvaluationLifecycleError';
  }
}

export const MAX_EVALUATION_RETRIES = 3;

export class EvaluationLifecycle {
  public static canTransition(current: EvaluationStatus, next: EvaluationStatus): boolean {
    switch (current) {
      case 'QUEUED':
        return next === 'EVALUATING';
      case 'EVALUATING':
        return next === 'COMPLETED' || next === 'FAILED';
      case 'FAILED':
        return next === 'QUEUED'; // Retry
      case 'COMPLETED':
        return false; // Terminal state
      default:
        return false;
    }
  }

  public static transitionToEvaluating(evaluation: Evaluation): Evaluation {
    if (evaluation.status !== 'QUEUED') {
      throw new EvaluationLifecycleError(
        `Cannot start evaluation ${evaluation.id}: current status is '${evaluation.status}', expected 'QUEUED'.`
      );
    }

    return {
      ...evaluation,
      status: 'EVALUATING',
      errorCode: null,
      errorMessage: null,
    };
  }

  public static transitionToCompleted(
    evaluation: Evaluation,
    result: EvaluationResult,
    completedAt: string = new Date().toISOString()
  ): Evaluation {
    if (evaluation.status !== 'EVALUATING') {
      throw new EvaluationLifecycleError(
        `Cannot complete evaluation ${evaluation.id}: current status is '${evaluation.status}', expected 'EVALUATING'.`
      );
    }

    return {
      ...evaluation,
      status: 'COMPLETED',
      overallScore: result.overallScore,
      summary: result.summary,
      items: result.criteria,
      strengths: result.strengths,
      nextAttemptFocus: result.nextAttemptFocus,
      errorCode: null,
      errorMessage: null,
      completedAt,
    };
  }

  public static transitionToFailed(
    evaluation: Evaluation,
    errorCode: string,
    errorMessage: string
  ): Evaluation {
    if (evaluation.status !== 'EVALUATING') {
      throw new EvaluationLifecycleError(
        `Cannot fail evaluation ${evaluation.id}: current status is '${evaluation.status}', expected 'EVALUATING'.`
      );
    }

    return {
      ...evaluation,
      status: 'FAILED',
      errorCode,
      errorMessage,
    };
  }

  public static transitionToRetry(evaluation: Evaluation): Evaluation {
    if (evaluation.status !== 'FAILED') {
      throw new EvaluationLifecycleError(
        `Cannot retry evaluation ${evaluation.id}: current status is '${evaluation.status}', only 'FAILED' evaluations can be retried.`
      );
    }

    if (evaluation.retryCount >= MAX_EVALUATION_RETRIES) {
      throw new EvaluationLifecycleError(
        `Cannot retry evaluation ${evaluation.id}: maximum retry limit of ${MAX_EVALUATION_RETRIES} reached.`
      );
    }

    return {
      ...evaluation,
      status: 'QUEUED',
      retryCount: evaluation.retryCount + 1,
      errorCode: null,
      errorMessage: null,
    };
  }
}
