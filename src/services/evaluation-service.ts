import { RelationalDatabase } from '../adapters/db/database';
import { Evaluator } from '../domain/interfaces/evaluator';
import { HybridEvaluator } from '../adapters/ai/hybrid-evaluator';
import { EvaluationLifecycle } from '../domain/state-machines/evaluation-lifecycle';
import { Evaluation, EvaluationStatus } from '../domain/types/evaluation';
import { Problem } from '../domain/types/problem';
import { Rubric } from '../domain/types/rubric';
import { Submission } from '../domain/types/submission';
import { FeedbackItem } from '../domain/types/feedback';

export class EvaluationService {
  private db: RelationalDatabase;
  private evaluator: Evaluator;

  constructor(db?: RelationalDatabase, evaluator?: Evaluator) {
    this.db = db || RelationalDatabase.getInstance();
    this.evaluator = evaluator || new HybridEvaluator();
  }

  public async processEvaluation(evaluationId: string): Promise<Evaluation> {
    const rawEval = this.db.getEvaluationById(evaluationId);
    if (!rawEval) {
      throw new Error(`Evaluation with ID '${evaluationId}' not found.`);
    }

    const rawSub = this.db.getSubmissionById(rawEval.submissionId);
    if (!rawSub) {
      throw new Error(`Submission with ID '${rawEval.submissionId}' not found.`);
    }

    const rawAttempt = this.db.getAttemptById(rawSub.attemptId);
    if (!rawAttempt) {
      throw new Error(`Attempt with ID '${rawSub.attemptId}' not found.`);
    }

    const rawProblem = this.db.getProblemById(rawAttempt.problemId);
    if (!rawProblem) {
      throw new Error(`Problem with ID '${rawAttempt.problemId}' not found.`);
    }

    const rawRubric = this.db.getRubricById(rawProblem.rubricId);
    if (!rawRubric) {
      throw new Error(`Rubric with ID '${rawProblem.rubricId}' not found.`);
    }

    const existingItems = this.db.getEvaluationItems(evaluationId).map((i) => ({
      criterionId: i.criterionId as any,
      score: i.score,
      evidence: JSON.parse(i.evidenceJson),
      strength: i.strength,
      concern: i.concern,
      suggestion: i.suggestion,
      confidence: i.confidence / 100,
    }));

    let domainEval: Evaluation = {
      id: rawEval.id,
      submissionId: rawEval.submissionId,
      status: rawEval.status as EvaluationStatus,
      evaluatorKind: rawEval.evaluatorKind,
      evaluatorVersion: rawEval.evaluatorVersion,
      rubricVersion: rawEval.rubricVersion,
      overallScore: rawEval.overallScore,
      summary: rawEval.summary,
      items: existingItems,
      strengths: rawEval.strengthsJson ? JSON.parse(rawEval.strengthsJson) : [],
      nextAttemptFocus: rawEval.nextAttemptFocusJson ? JSON.parse(rawEval.nextAttemptFocusJson) : [],
      errorCode: rawEval.errorCode,
      errorMessage: rawEval.errorMessage,
      retryCount: rawEval.retryCount,
      createdAt: rawEval.createdAt,
      completedAt: rawEval.completedAt,
    };

    // Transition state from QUEUED -> EVALUATING
    domainEval = EvaluationLifecycle.transitionToEvaluating(domainEval);
    this.db.upsertEvaluation({
      ...rawEval,
      status: 'EVALUATING',
      errorCode: null,
      errorMessage: null,
    });

    const domainProblem: Problem = {
      id: rawProblem.id,
      slug: rawProblem.slug,
      title: rawProblem.title,
      difficulty: rawProblem.difficulty,
      description: rawProblem.description,
      requirements: JSON.parse(rawProblem.requirementsJson),
      rubricId: rawProblem.rubricId,
      isActive: rawProblem.isActive,
      tags: JSON.parse(rawProblem.tagsJson),
      estimatedMinutes: rawProblem.estimatedMinutes,
    };

    const domainRubric: Rubric = {
      id: rawRubric.id,
      name: rawRubric.name,
      version: rawRubric.version,
      criteria: JSON.parse(rawRubric.criteriaJson),
    };

    const domainSubmission: Submission = {
      id: rawSub.id,
      attemptId: rawSub.attemptId,
      format: rawSub.format as any,
      payload: JSON.parse(rawSub.payloadJson),
      contentHash: rawSub.contentHash,
      idempotencyKey: rawSub.idempotencyKey,
      createdAt: rawSub.createdAt,
    };

    try {
      // Run evaluation
      const result = await this.evaluator.evaluate({
        submission: domainSubmission,
        problem: domainProblem,
        rubric: domainRubric,
      });

      // Transition to COMPLETED
      domainEval = EvaluationLifecycle.transitionToCompleted(domainEval, result);

      // Persist completed evaluation and evaluation items
      this.db.upsertEvaluation({
        ...rawEval,
        status: 'COMPLETED',
        overallScore: domainEval.overallScore,
        summary: domainEval.summary,
        strengthsJson: JSON.stringify(domainEval.strengths),
        nextAttemptFocusJson: JSON.stringify(domainEval.nextAttemptFocus),
        errorCode: null,
        errorMessage: null,
        completedAt: domainEval.completedAt,
      });

      const dbItems = domainEval.items.map((item, index) => ({
        id: `item_${domainEval.id}_${index}`,
        evaluationId: domainEval.id,
        criterionId: item.criterionId,
        score: item.score,
        evidenceJson: JSON.stringify(item.evidence),
        strength: item.strength,
        concern: item.concern,
        suggestion: item.suggestion,
        confidence: Math.round(item.confidence * 100),
      }));
      this.db.setEvaluationItems(domainEval.id, dbItems);

      return domainEval;
    } catch (err: any) {
      console.error(`Evaluation failed for ${evaluationId}:`, err);
      // Transition to FAILED safely without deleting submission
      domainEval = EvaluationLifecycle.transitionToFailed(
        domainEval,
        'EVALUATION_ERROR',
        err.message || 'An error occurred during evaluation.'
      );

      this.db.upsertEvaluation({
        ...rawEval,
        status: 'FAILED',
        errorCode: domainEval.errorCode,
        errorMessage: domainEval.errorMessage,
      });

      return domainEval;
    }
  }

  public retryEvaluation(evaluationId: string): Evaluation {
    const rawEval = this.db.getEvaluationById(evaluationId);
    if (!rawEval) {
      throw new Error(`Evaluation with ID '${evaluationId}' not found.`);
    }

    let domainEval: Evaluation = {
      id: rawEval.id,
      submissionId: rawEval.submissionId,
      status: rawEval.status as EvaluationStatus,
      evaluatorKind: rawEval.evaluatorKind,
      evaluatorVersion: rawEval.evaluatorVersion,
      rubricVersion: rawEval.rubricVersion,
      overallScore: rawEval.overallScore,
      summary: rawEval.summary,
      items: [],
      strengths: [],
      nextAttemptFocus: [],
      errorCode: rawEval.errorCode,
      errorMessage: rawEval.errorMessage,
      retryCount: rawEval.retryCount,
      createdAt: rawEval.createdAt,
      completedAt: rawEval.completedAt,
    };

    // Transition to QUEUED via retry
    domainEval = EvaluationLifecycle.transitionToRetry(domainEval);

    this.db.upsertEvaluation({
      ...rawEval,
      status: 'QUEUED',
      retryCount: domainEval.retryCount,
      errorCode: null,
      errorMessage: null,
    });

    return domainEval;
  }
}
