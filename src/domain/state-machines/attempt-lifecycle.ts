import { Attempt, AttemptStatus, AttemptDraft } from '../types/attempt';

export class AttemptLifecycleError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AttemptLifecycleError';
  }
}

export class AttemptLifecycle {
  public static canTransition(current: AttemptStatus, next: AttemptStatus): boolean {
    if (current === 'DRAFT' && next === 'SUBMITTED') {
      return true;
    }
    return false;
  }

  public static transitionToSubmitted(attempt: Attempt, submittedAt: string = new Date().toISOString()): Attempt {
    if (attempt.status !== 'DRAFT') {
      throw new AttemptLifecycleError(
        `Cannot submit attempt ${attempt.id}: current status is '${attempt.status}', only 'DRAFT' attempts can be submitted.`
      );
    }

    return {
      ...attempt,
      status: 'SUBMITTED',
      submittedAt,
      updatedAt: submittedAt,
    };
  }

  public static updateDraft(
    attempt: Attempt,
    updatedDraft: Partial<AttemptDraft>,
    updatedAt: string = new Date().toISOString()
  ): Attempt {
    if (attempt.status !== 'DRAFT') {
      throw new AttemptLifecycleError(
        `Cannot update draft of attempt ${attempt.id}: attempt is already '${attempt.status}' and immutable.`
      );
    }

    return {
      ...attempt,
      draft: {
        ...attempt.draft,
        ...updatedDraft,
      },
      updatedAt,
    };
  }
}
