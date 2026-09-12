import { beforeEach, describe, expect, it } from 'vitest';
import { RelationalDatabase } from '@/adapters/db/database';
import { runSeed } from '@/adapters/db/seed';
import { AttemptService } from '@/services/attempt-service';
import { SubmissionService } from '@/services/submission-service';
import { EvaluationService } from '@/services/evaluation-service';
import { historyService } from '@/services/history-service';
import { EvaluationDispatcher } from '@/domain/interfaces/evaluation-dispatcher';
import { Evaluator } from '@/domain/interfaces/evaluator';
import { EvaluationResult } from '@/domain/types/feedback';

const validPayload = {
  format: 'structured-text' as const,
  assumptions: 'The system supports multiple floors, vehicle types, and concurrent entry gates.',
  classes: [
    { name: 'ParkingLot', responsibility: 'Coordinates floors, gates, and the overall parking lifecycle.' },
    { name: 'ParkingSpot', responsibility: 'Owns occupancy state and validates vehicle assignment.' },
  ],
  relationships: 'ParkingLot contains floors and delegates spot assignment to the appropriate floor collection.',
  mainFlow: 'A vehicle arrives, a spot is allocated atomically, a ticket is issued, and payment is processed on exit.',
  edgeCases: 'Handle a full lot, duplicate requests, lost tickets, payment timeout, and concurrent spot allocation.',
  tradeOffs: 'Use strategy interfaces for allocation and pricing while keeping the local demo persistence synchronous.',
};

class NoopDispatcher implements EvaluationDispatcher {
  public async dispatch(): Promise<void> {}
}

class FailingEvaluator implements Evaluator {
  public readonly kind = 'failing-test-evaluator';
  public readonly version = 'test';

  public async evaluate(): Promise<EvaluationResult> {
    throw new Error('Simulated Gemini provider timeout');
  }
}

describe('Evaluation reliability guarantees', () => {
  let db: RelationalDatabase;
  let attemptService: AttemptService;

  beforeEach(() => {
    db = RelationalDatabase.getInstance();
    runSeed();
    attemptService = new AttemptService(db);
  });

  it('keeps the submitted snapshot when evaluation fails', async () => {
    const attempt = attemptService.createNewDraftAttempt('user_alice', 'prob_parking_lot');
    const submissionService = new SubmissionService(db, new NoopDispatcher());
    const result = await submissionService.submitAttempt({
      attemptId: attempt.id,
      userId: 'user_alice',
      idempotencyKey: crypto.randomUUID(),
      payload: validPayload,
    });

    const evaluationService = new EvaluationService(db, new FailingEvaluator());
    const failed = await evaluationService.processEvaluation(result.evaluationId);
    const savedAttempt = db.getAttemptById(attempt.id);
    const savedSubmission = db.getSubmissionById(result.submissionId);

    expect(failed.status).toBe('FAILED');
    expect(failed.errorMessage).toContain('Simulated Gemini provider timeout');
    expect(savedAttempt?.status).toBe('SUBMITTED');
    expect(savedSubmission?.id).toBe(result.submissionId);
  });

  it('deduplicates concurrent submit requests with one stable result', async () => {
    const attempt = attemptService.createNewDraftAttempt('user_alice', 'prob_parking_lot');
    const submissionService = new SubmissionService(db, new NoopDispatcher());
    const idempotencyKey = crypto.randomUUID();

    const results = await Promise.all(
      Array.from({ length: 2 }, () =>
        submissionService.submitAttempt({
          attemptId: attempt.id,
          userId: 'user_alice',
          idempotencyKey,
          payload: validPayload,
        })
      )
    );

    expect(new Set(results.map((result) => result.submissionId)).size).toBe(1);
    expect(new Set(results.map((result) => result.evaluationId)).size).toBe(1);
    expect(db.getSubmissions().filter((submission) => submission.attemptId === attempt.id)).toHaveLength(1);
    expect(db.getEvaluations().filter((evaluation) => evaluation.submissionId === results[0].submissionId)).toHaveLength(1);
  });

  it('compares completed evaluations and rejects queued evaluations', async () => {
    const completed = historyService.compareAttempts('att_alice_parking_01', 'att_alice_parking_02');
    expect(completed.attemptA.overallScore).toBe(63);
    expect(completed.attemptB.overallScore).toBe(91);
    expect(completed.scoreDelta).toBe(28);

    const draft = attemptService.createNewDraftAttempt('user_alice', 'prob_parking_lot');
    const submissionService = new SubmissionService(db, new NoopDispatcher());
    const queued = await submissionService.submitAttempt({
      attemptId: draft.id,
      userId: 'user_alice',
      idempotencyKey: crypto.randomUUID(),
      payload: validPayload,
    });

    expect(() => historyService.compareAttempts('att_alice_parking_01', draft.id)).toThrow(
      /both attempts must have completed evaluations/
    );
    expect(db.getEvaluationById(queued.evaluationId)?.status).toBe('QUEUED');
  });
});
