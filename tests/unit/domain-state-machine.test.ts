import { describe, it, expect } from 'vitest';
import {
  AttemptLifecycle,
  AttemptLifecycleError,
} from '@/domain/state-machines/attempt-lifecycle';
import {
  EvaluationLifecycle,
  EvaluationLifecycleError,
  MAX_EVALUATION_RETRIES,
} from '@/domain/state-machines/evaluation-lifecycle';
import { Attempt } from '@/domain/types/attempt';
import { Evaluation } from '@/domain/types/evaluation';

describe('Domain State Machines: Invariants & Legal Transitions', () => {
  describe('AttemptLifecycle', () => {
    const mockDraftAttempt: Attempt = {
      id: 'att_test_1',
      userId: 'user_alice',
      problemId: 'prob_parking_lot',
      status: 'DRAFT',
      draft: {
        assumptions: 'Initial assumptions',
        classes: [{ name: 'ParkingLot', responsibility: 'Coordinates parking spots' }],
        relationships: 'ParkingLot has spots',
        mainFlow: 'Entry -> Park -> Exit',
        edgeCases: 'Full capacity',
        tradeOffs: 'Simple in-memory store',
      },
      createdAt: '2026-09-01T00:00:00.000Z',
      updatedAt: '2026-09-01T00:00:00.000Z',
      submittedAt: null,
    };

    it('allows updating draft while in DRAFT status', () => {
      const updated = AttemptLifecycle.updateDraft(mockDraftAttempt, {
        assumptions: 'Refined assumptions for multi-floor lot',
      });
      expect(updated.draft.assumptions).toBe('Refined assumptions for multi-floor lot');
      expect(updated.status).toBe('DRAFT');
    });

    it('allows transitioning from DRAFT to SUBMITTED', () => {
      const submitted = AttemptLifecycle.transitionToSubmitted(mockDraftAttempt);
      expect(submitted.status).toBe('SUBMITTED');
      expect(submitted.submittedAt).toBeDefined();
    });

    it('throws error when trying to update a SUBMITTED attempt (immutability)', () => {
      const submitted = AttemptLifecycle.transitionToSubmitted(mockDraftAttempt);
      expect(() => {
        AttemptLifecycle.updateDraft(submitted, { assumptions: 'Illegal change' });
      }).toThrow(AttemptLifecycleError);
    });

    it('throws error when trying to re-submit an already SUBMITTED attempt', () => {
      const submitted = AttemptLifecycle.transitionToSubmitted(mockDraftAttempt);
      expect(() => {
        AttemptLifecycle.transitionToSubmitted(submitted);
      }).toThrow(AttemptLifecycleError);
    });
  });

  describe('EvaluationLifecycle', () => {
    const mockQueuedEvaluation: Evaluation = {
      id: 'eval_test_1',
      submissionId: 'sub_test_1',
      status: 'QUEUED',
      evaluatorKind: 'hybrid-deterministic-gemini',
      evaluatorVersion: '1.0.0',
      rubricVersion: '1.0.0',
      overallScore: null,
      summary: null,
      items: [],
      strengths: [],
      nextAttemptFocus: [],
      errorCode: null,
      errorMessage: null,
      retryCount: 0,
      createdAt: '2026-09-01T00:00:00.000Z',
      completedAt: null,
    };

    it('transitions QUEUED -> EVALUATING', () => {
      const evaluating = EvaluationLifecycle.transitionToEvaluating(mockQueuedEvaluation);
      expect(evaluating.status).toBe('EVALUATING');
    });

    it('transitions EVALUATING -> COMPLETED', () => {
      const evaluating = EvaluationLifecycle.transitionToEvaluating(mockQueuedEvaluation);
      const completed = EvaluationLifecycle.transitionToCompleted(evaluating, {
        overallScore: 88,
        summary: 'Excellent SRP and loose coupling.',
        criteria: [],
        strengths: ['SRP adherence'],
        nextAttemptFocus: ['Add concurrency locks'],
      });
      expect(completed.status).toBe('COMPLETED');
      expect(completed.overallScore).toBe(88);
      expect(completed.completedAt).toBeDefined();
    });

    it('transitions EVALUATING -> FAILED with error details', () => {
      const evaluating = EvaluationLifecycle.transitionToEvaluating(mockQueuedEvaluation);
      const failed = EvaluationLifecycle.transitionToFailed(
        evaluating,
        'PROVIDER_TIMEOUT',
        'Gemini API timed out after 10000ms'
      );
      expect(failed.status).toBe('FAILED');
      expect(failed.errorCode).toBe('PROVIDER_TIMEOUT');
    });

    it('transitions FAILED -> QUEUED on explicit retry', () => {
      const evaluating = EvaluationLifecycle.transitionToEvaluating(mockQueuedEvaluation);
      const failed = EvaluationLifecycle.transitionToFailed(
        evaluating,
        'TIMEOUT',
        'Temporary timeout'
      );
      const retried = EvaluationLifecycle.transitionToRetry(failed);
      expect(retried.status).toBe('QUEUED');
      expect(retried.retryCount).toBe(1);
    });

    it('rejects retrying when MAX_EVALUATION_RETRIES is exceeded', () => {
      let current = mockQueuedEvaluation;
      for (let i = 0; i < MAX_EVALUATION_RETRIES; i++) {
        const evaling = EvaluationLifecycle.transitionToEvaluating(current);
        const failed = EvaluationLifecycle.transitionToFailed(evaling, 'ERR', 'Retry test');
        current = EvaluationLifecycle.transitionToRetry(failed);
      }

      const evalingMax = EvaluationLifecycle.transitionToEvaluating(current);
      const failedMax = EvaluationLifecycle.transitionToFailed(evalingMax, 'ERR', 'Max reached');

      expect(() => {
        EvaluationLifecycle.transitionToRetry(failedMax);
      }).toThrow(EvaluationLifecycleError);
    });

    it('rejects direct transition from QUEUED to COMPLETED (illegal skip)', () => {
      expect(() => {
        EvaluationLifecycle.transitionToCompleted(mockQueuedEvaluation, {
          overallScore: 90,
          summary: 'Illegal skip',
          criteria: [],
          strengths: [],
          nextAttemptFocus: [],
        });
      }).toThrow(EvaluationLifecycleError);
    });
  });
});
