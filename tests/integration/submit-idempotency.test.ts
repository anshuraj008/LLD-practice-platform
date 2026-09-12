import { describe, it, expect, beforeEach } from 'vitest';
import { RelationalDatabase } from '@/adapters/db/database';
import { SubmissionService } from '@/services/submission-service';
import { AttemptService } from '@/services/attempt-service';
import { runSeed } from '@/adapters/db/seed';

describe('Integration: Submission Idempotency & Transaction Safety', () => {
  let db: RelationalDatabase;
  let submissionService: SubmissionService;
  let attemptService: AttemptService;

  beforeEach(() => {
    db = RelationalDatabase.getInstance();
    runSeed();
    submissionService = new SubmissionService(db);
    attemptService = new AttemptService(db);
  });

  it('handles duplicate submit requests idempotently with the same idempotency key', async () => {
    // 1. Create a draft attempt for Alice on Parking Lot
    const draftAttempt = attemptService.createNewDraftAttempt('user_alice', 'prob_parking_lot');
    const idempotencyKey = crypto.randomUUID();

    const payload = {
      format: 'structured-text' as const,
      assumptions: 'Valid assumptions with multi-floor capacity',
      classes: [
        { name: 'ParkingLot', responsibility: 'Manages floors and gates' },
        { name: 'ParkingSpot', responsibility: 'Maintains occupancy state' },
      ],
      relationships: 'ParkingLot has many ParkingSpots',
      mainFlow: '1. Vehicle enters gate. 2. Spot assigned. 3. Ticket issued.',
      edgeCases: 'Handles full lot with waiting queue and timeout.',
      tradeOffs: 'Strategy pattern for fee calculation.',
    };

    // 2. Submit first time
    const result1 = await submissionService.submitAttempt({
      attemptId: draftAttempt.id,
      userId: 'user_alice',
      idempotencyKey,
      payload,
    });

    expect(result1.status).toBe('QUEUED');
    expect(result1.submissionId).toBeDefined();

    // 3. Submit second time with identical idempotencyKey (simulate duplicate tab or retry)
    const result2 = await submissionService.submitAttempt({
      attemptId: draftAttempt.id,
      userId: 'user_alice',
      idempotencyKey,
      payload,
    });

    expect(result2.status).toBe('ALREADY_SUBMITTED');
    expect(result2.submissionId).toBe(result1.submissionId);

    // Verify only ONE submission and ONE evaluation exist for this attempt
    const allSubs = db.getSubmissions().filter((s) => s.attemptId === draftAttempt.id);
    expect(allSubs.length).toBe(1);
  });

  it('rejects submission if user does not own the attempt', async () => {
    const draftAttempt = attemptService.createNewDraftAttempt('user_alice', 'prob_parking_lot');
    const idempotencyKey = crypto.randomUUID();

    const payload = {
      format: 'structured-text' as const,
      assumptions: 'Valid assumptions text',
      classes: [
        { name: 'ClassA', responsibility: 'Responsibility A' },
        { name: 'ClassB', responsibility: 'Responsibility B' },
      ],
      relationships: 'Valid relationships text',
      mainFlow: 'Valid main flow text description',
      edgeCases: 'Valid edge cases text',
      tradeOffs: 'Valid trade-offs text',
    };

    // User Bob tries to submit Alice's attempt
    await expect(
      submissionService.submitAttempt({
        attemptId: draftAttempt.id,
        userId: 'user_bob',
        idempotencyKey,
        payload,
      })
    ).rejects.toThrow(/Unauthorized/);
  });
});
