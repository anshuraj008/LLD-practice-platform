import { RelationalDatabase } from '../adapters/db/database';
import { EvaluationDispatcher } from '../domain/interfaces/evaluation-dispatcher';
import { InProcessEvaluationDispatcher } from '../adapters/dispatcher/in-process-dispatcher';
import { AttemptLifecycle } from '../domain/state-machines/attempt-lifecycle';
import { SubmissionPayload } from '../domain/types/submission';
import { StructuredTextSubmissionPayloadSchema } from '../schemas/submission.schema';
import crypto from 'crypto';

export interface SubmitAttemptParams {
  attemptId: string;
  userId: string;
  idempotencyKey: string;
  payload: SubmissionPayload;
}

export interface SubmitAttemptResponse {
  submissionId: string;
  evaluationId: string;
  attemptId: string;
  status: 'QUEUED' | 'ALREADY_SUBMITTED';
}

export class SubmissionService {
  private db: RelationalDatabase;
  private dispatcher: EvaluationDispatcher;

  constructor(db?: RelationalDatabase, dispatcher?: EvaluationDispatcher) {
    this.db = db || RelationalDatabase.getInstance();
    this.dispatcher = dispatcher || InProcessEvaluationDispatcher.getInstance();
  }

  public async submitAttempt(params: SubmitAttemptParams): Promise<SubmitAttemptResponse> {
    const { attemptId, userId, idempotencyKey, payload } = params;

    // 1. Idempotency Check: if submission with this idempotency key already exists, return existing ids
    const existingSubmissionByKey = this.db.getSubmissionByIdempotencyKey(idempotencyKey);
    if (existingSubmissionByKey) {
      const existingEval = this.db.getEvaluationBySubmissionId(existingSubmissionByKey.id);
      return {
        submissionId: existingSubmissionByKey.id,
        evaluationId: existingEval ? existingEval.id : '',
        attemptId: existingSubmissionByKey.attemptId,
        status: 'ALREADY_SUBMITTED',
      };
    }

    // 2. Fetch and Authorize Attempt
    const rawAttempt = this.db.getAttemptById(attemptId);
    if (!rawAttempt) {
      throw new Error(`Attempt with ID '${attemptId}' not found.`);
    }

    if (rawAttempt.userId !== userId) {
      throw new Error('Unauthorized submission attempt: You do not own this attempt.');
    }

    // Check if attempt has already been submitted
    if (rawAttempt.status === 'SUBMITTED') {
      const existingSub = this.db.getSubmissionByAttemptId(attemptId);
      if (existingSub) {
        const existingEval = this.db.getEvaluationBySubmissionId(existingSub.id);
        return {
          submissionId: existingSub.id,
          evaluationId: existingEval ? existingEval.id : '',
          attemptId,
          status: 'ALREADY_SUBMITTED',
        };
      }
    }

    // 3. Validate Submission Payload with Zod schema
    const validation = StructuredTextSubmissionPayloadSchema.safeParse(payload);
    if (!validation.success) {
      throw new Error(
        `Submission validation failed: ${validation.error.issues.map((i) => i.message).join(', ')}`
      );
    }

    // 4. Calculate Content Hash & Generate IDs
    const contentHash = crypto
      .createHash('sha256')
      .update(JSON.stringify(payload))
      .digest('hex');

    const submissionId = `sub_${crypto.randomUUID()}`;
    const evaluationId = `eval_${crypto.randomUUID()}`;
    const now = new Date().toISOString();

    // 5. Build DB records for atomic transaction
    const updatedAttemptRecord = {
      ...rawAttempt,
      status: 'SUBMITTED' as const,
      submittedAt: now,
      updatedAt: now,
      draftJson: JSON.stringify(payload), // Sync draft to final submitted payload
    };

    const newSubmissionRecord = {
      id: submissionId,
      attemptId,
      format: payload.format,
      payloadJson: JSON.stringify(payload),
      contentHash,
      idempotencyKey,
      createdAt: now,
    };

    const newEvaluationRecord = {
      id: evaluationId,
      submissionId,
      status: 'QUEUED' as const,
      evaluatorKind: 'hybrid-deterministic-gemini',
      evaluatorVersion: '1.0.0',
      rubricVersion: '1.0.0',
      overallScore: null,
      summary: null,
      strengthsJson: '[]',
      nextAttemptFocusJson: '[]',
      errorCode: null,
      errorMessage: null,
      retryCount: 0,
      createdAt: now,
      completedAt: null,
    };

    // 6. Execute atomic transaction in Relational Database
    this.db.submitAttemptTransaction(
      updatedAttemptRecord,
      newSubmissionRecord,
      newEvaluationRecord
    );

    // 7. Dispatch evaluation asynchronously after successful commit
    await this.dispatcher.dispatch(evaluationId);

    return {
      submissionId,
      evaluationId,
      attemptId,
      status: 'QUEUED',
    };
  }
}

export const submissionService = new SubmissionService();
