import { RelationalDatabase } from '../adapters/db/database';
import { RubricCriterionId } from '../domain/types/rubric';

export interface HistoryAttemptItem {
  attemptId: string;
  submissionId?: string;
  evaluationId?: string;
  problemId: string;
  problemSlug: string;
  problemTitle: string;
  problemDifficulty: string;
  status: 'DRAFT' | 'SUBMITTED';
  evaluationStatus?: 'QUEUED' | 'EVALUATING' | 'COMPLETED' | 'FAILED';
  overallScore?: number | null;
  scoreDeltaFromPrevious?: number | null; // e.g. +28
  createdAt: string;
  submittedAt: string | null;
  classesCount: number;
}

export interface UserHistoryOverview {
  attempts: HistoryAttemptItem[];
  totalAttempts: number;
  completedSubmissions: number;
  averageScore: number;
  highestScore: number;
  recurringWeaknesses: Array<{
    criterionId: RubricCriterionId;
    criterionName: string;
    averageScore: number;
    count: number;
    commonConcerns: string[];
  }>;
}

export interface AttemptComparison {
  attemptA: {
    attemptId: string;
    problemTitle: string;
    submittedAt: string;
    overallScore: number | null;
    summary: string | null;
    payload: any;
    criteriaScores: Record<string, number>;
  };
  attemptB: {
    attemptId: string;
    problemTitle: string;
    submittedAt: string;
    overallScore: number | null;
    summary: string | null;
    payload: any;
    criteriaScores: Record<string, number>;
  };
  criterionDeltas: Array<{
    criterionId: string;
    criterionName: string;
    weight: number;
    scoreA: number | null;
    scoreB: number | null;
    delta: number | null;
  }>;
  scoreDelta: number;
}

export class HistoryService {
  private db: RelationalDatabase;

  constructor(db?: RelationalDatabase) {
    this.db = db || RelationalDatabase.getInstance();
  }

  public getUserHistory(userId: string): UserHistoryOverview {
    const userAttempts = this.db.getAttemptsByUserId(userId);
    const problemsMap = new Map(this.db.getProblems().map((p) => [p.id, p]));
    const submissions = this.db.getSubmissions();
    const evaluations = this.db.getEvaluations();
    const rubrics = this.db.getRubrics();

    // Sort chronologically ascending to calculate progressive score deltas
    const sortedAttempts = [...userAttempts].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    const historyItems: HistoryAttemptItem[] = [];
    const problemScoresTracker: Record<string, number[]> = {};
    const weaknessTracker: Record<
      string,
      { scores: number[]; concerns: string[]; name: string }
    > = {};

    for (const attempt of sortedAttempts) {
      const problem = problemsMap.get(attempt.problemId);
      const submission = submissions.find((s) => s.attemptId === attempt.id);
      const evaluation = submission ? evaluations.find((e) => e.submissionId === submission.id) : undefined;
      const draft = JSON.parse(attempt.draftJson || '{}');

      let scoreDeltaFromPrevious: number | null = null;
      if (evaluation && evaluation.overallScore !== null && problem) {
        const prevScores = problemScoresTracker[problem.id] || [];
        if (prevScores.length > 0) {
          const lastScore = prevScores[prevScores.length - 1];
          scoreDeltaFromPrevious = evaluation.overallScore - lastScore;
        }
        if (!problemScoresTracker[problem.id]) problemScoresTracker[problem.id] = [];
        problemScoresTracker[problem.id].push(evaluation.overallScore);

        // Track criterion items for weakness analysis
        const items = this.db.getEvaluationItems(evaluation.id);
        for (const it of items) {
          if (!weaknessTracker[it.criterionId]) {
            weaknessTracker[it.criterionId] = {
              scores: [],
              concerns: [],
              name: it.criterionId.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
            };
          }
          weaknessTracker[it.criterionId].scores.push(it.score);
          if (it.concern && it.score <= 3) {
            weaknessTracker[it.criterionId].concerns.push(it.concern);
          }
        }
      }

      historyItems.push({
        attemptId: attempt.id,
        submissionId: submission?.id,
        evaluationId: evaluation?.id,
        problemId: attempt.problemId,
        problemSlug: problem?.slug || 'unknown',
        problemTitle: problem?.title || 'Unknown Problem',
        problemDifficulty: problem?.difficulty || 'MEDIUM',
        status: attempt.status as any,
        evaluationStatus: evaluation?.status as any,
        overallScore: evaluation?.overallScore,
        scoreDeltaFromPrevious,
        createdAt: attempt.createdAt,
        submittedAt: attempt.submittedAt,
        classesCount: draft.classes?.length || 0,
      });
    }

    // Reverse for UI display (newest first)
    const reversedItems = [...historyItems].reverse();

    const completedEvals = reversedItems.filter(
      (h) => h.overallScore !== undefined && h.overallScore !== null
    );
    const totalScoreSum = completedEvals.reduce((sum, h) => sum + (h.overallScore || 0), 0);
    const averageScore = completedEvals.length > 0 ? Math.round(totalScoreSum / completedEvals.length) : 0;
    const highestScore = completedEvals.length > 0 ? Math.max(...completedEvals.map((h) => h.overallScore || 0)) : 0;

    // Build recurring weaknesses (criteria with lowest average scores)
    const recurringWeaknesses = Object.entries(weaknessTracker)
      .map(([id, data]) => {
        const avg = data.scores.reduce((a, b) => a + b, 0) / (data.scores.length || 1);
        return {
          criterionId: id as RubricCriterionId,
          criterionName: data.name,
          averageScore: Number(avg.toFixed(1)),
          count: data.scores.length,
          commonConcerns: Array.from(new Set(data.concerns)).slice(0, 3),
        };
      })
      .filter((w) => w.averageScore < 4.0)
      .sort((a, b) => a.averageScore - b.averageScore)
      .slice(0, 4);

    return {
      attempts: reversedItems,
      totalAttempts: userAttempts.length,
      completedSubmissions: completedEvals.length,
      averageScore,
      highestScore,
      recurringWeaknesses,
    };
  }

  public compareAttempts(attemptIdA: string, attemptIdB: string): AttemptComparison {
    const attemptA = this.db.getAttemptById(attemptIdA);
    const attemptB = this.db.getAttemptById(attemptIdB);

    if (!attemptA || !attemptB) {
      throw new Error('One or both attempts could not be found.');
    }

    const subA = this.db.getSubmissionByAttemptId(attemptIdA);
    const subB = this.db.getSubmissionByAttemptId(attemptIdB);

    const evalA = subA ? this.db.getEvaluationBySubmissionId(subA.id) : undefined;
    const evalB = subB ? this.db.getEvaluationBySubmissionId(subB.id) : undefined;

    if (
      !evalA ||
      !evalB ||
      evalA.status !== 'COMPLETED' ||
      evalB.status !== 'COMPLETED' ||
      evalA.overallScore === null ||
      evalB.overallScore === null
    ) {
      throw new Error('Comparison unavailable: both attempts must have completed evaluations.');
    }

    const prob = this.db.getProblemById(attemptA.problemId);
    const rubric = prob ? this.db.getRubricById(prob.rubricId) : undefined;
    const criteriaList = rubric ? JSON.parse(rubric.criteriaJson) : [];

    const itemsA = evalA ? this.db.getEvaluationItems(evalA.id) : [];
    const itemsB = evalB ? this.db.getEvaluationItems(evalB.id) : [];

    const scoresMapA: Record<string, number> = {};
    for (const it of itemsA) scoresMapA[it.criterionId] = it.score;

    const scoresMapB: Record<string, number> = {};
    for (const it of itemsB) scoresMapB[it.criterionId] = it.score;

    const criterionDeltas = criteriaList.map((c: any) => {
      const sA = scoresMapA[c.id] ?? null;
      const sB = scoresMapB[c.id] ?? null;
      return {
        criterionId: c.id,
        criterionName: c.name,
        weight: c.weight,
        scoreA: sA,
        scoreB: sB,
        delta: sA !== null && sB !== null ? sB - sA : null,
      };
    });

    const scoreA = evalA.overallScore;
    const scoreB = evalB.overallScore;

    return {
      attemptA: {
        attemptId: attemptA.id,
        problemTitle: prob?.title || 'Unknown Problem',
        submittedAt: attemptA.submittedAt || attemptA.createdAt,
        overallScore: evalA?.overallScore ?? null,
        summary: evalA?.summary ?? null,
        payload: subA ? JSON.parse(subA.payloadJson) : JSON.parse(attemptA.draftJson),
        criteriaScores: scoresMapA,
      },
      attemptB: {
        attemptId: attemptB.id,
        problemTitle: prob?.title || 'Unknown Problem',
        submittedAt: attemptB.submittedAt || attemptB.createdAt,
        overallScore: evalB?.overallScore ?? null,
        summary: evalB?.summary ?? null,
        payload: subB ? JSON.parse(subB.payloadJson) : JSON.parse(attemptB.draftJson),
        criteriaScores: scoresMapB,
      },
      criterionDeltas,
      scoreDelta: scoreB - scoreA,
    };
  }
}

export const historyService = new HistoryService();
