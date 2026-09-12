import { RelationalDatabase } from '../adapters/db/database';
import { AttemptLifecycle } from '../domain/state-machines/attempt-lifecycle';
import { Attempt, AttemptDraft } from '../domain/types/attempt';
import crypto from 'crypto';

export class AttemptService {
  private db: RelationalDatabase;

  constructor(db?: RelationalDatabase) {
    this.db = db || RelationalDatabase.getInstance();
  }

  public getOrCreateDraftAttempt(userId: string, problemId: string): Attempt {
    const existingAttempts = this.db.getAttemptsByUserAndProblem(userId, problemId);
    const existingDraft = existingAttempts.find((a) => a.status === 'DRAFT');

    if (existingDraft) {
      return {
        id: existingDraft.id,
        userId: existingDraft.userId,
        problemId: existingDraft.problemId,
        status: 'DRAFT',
        draft: JSON.parse(existingDraft.draftJson),
        createdAt: existingDraft.createdAt,
        updatedAt: existingDraft.updatedAt,
        submittedAt: existingDraft.submittedAt,
      };
    }

    // Create a new fresh draft attempt
    const newId = `att_${crypto.randomUUID()}`;
    const now = new Date().toISOString();
    const initialDraft: AttemptDraft = {
      assumptions: '',
      classes: [],
      relationships: '',
      mainFlow: '',
      edgeCases: '',
      tradeOffs: '',
    };

    const newDbAttempt = {
      id: newId,
      userId,
      problemId,
      status: 'DRAFT' as const,
      draftJson: JSON.stringify(initialDraft),
      createdAt: now,
      updatedAt: now,
      submittedAt: null,
    };

    this.db.upsertAttempt(newDbAttempt);

    return {
      id: newId,
      userId,
      problemId,
      status: 'DRAFT',
      draft: initialDraft,
      createdAt: now,
      updatedAt: now,
      submittedAt: null,
    };
  }

  public createNewDraftAttempt(userId: string, problemId: string): Attempt {
    const newId = `att_${crypto.randomUUID()}`;
    const now = new Date().toISOString();
    const initialDraft: AttemptDraft = {
      assumptions: '',
      classes: [],
      relationships: '',
      mainFlow: '',
      edgeCases: '',
      tradeOffs: '',
    };

    const newDbAttempt = {
      id: newId,
      userId,
      problemId,
      status: 'DRAFT' as const,
      draftJson: JSON.stringify(initialDraft),
      createdAt: now,
      updatedAt: now,
      submittedAt: null,
    };

    this.db.upsertAttempt(newDbAttempt);

    return {
      id: newId,
      userId,
      problemId,
      status: 'DRAFT',
      draft: initialDraft,
      createdAt: now,
      updatedAt: now,
      submittedAt: null,
    };
  }

  public getAttempt(attemptId: string, userId?: string): Attempt | null {
    const raw = this.db.getAttemptById(attemptId);
    if (!raw) return null;

    if (userId && raw.userId !== userId) {
      throw new Error('Unauthorized access: Attempt belongs to a different user.');
    }

    return {
      id: raw.id,
      userId: raw.userId,
      problemId: raw.problemId,
      status: raw.status as any,
      draft: JSON.parse(raw.draftJson),
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
      submittedAt: raw.submittedAt,
    };
  }

  public autosaveDraft(
    attemptId: string,
    userId: string,
    partialDraft: Partial<AttemptDraft>
  ): Attempt {
    const raw = this.db.getAttemptById(attemptId);
    if (!raw) {
      throw new Error(`Attempt with ID '${attemptId}' not found.`);
    }

    if (raw.userId !== userId) {
      throw new Error('Unauthorized attempt modification.');
    }

    let domainAttempt: Attempt = {
      id: raw.id,
      userId: raw.userId,
      problemId: raw.problemId,
      status: raw.status as any,
      draft: JSON.parse(raw.draftJson),
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
      submittedAt: raw.submittedAt,
    };

    // State machine updates draft and verifies attempt is still DRAFT
    domainAttempt = AttemptLifecycle.updateDraft(domainAttempt, partialDraft);

    this.db.upsertAttempt({
      ...raw,
      draftJson: JSON.stringify(domainAttempt.draft),
      updatedAt: domainAttempt.updatedAt,
    });

    return domainAttempt;
  }
}

export const attemptService = new AttemptService();
