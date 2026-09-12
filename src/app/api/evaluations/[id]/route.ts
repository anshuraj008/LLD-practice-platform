import { NextRequest, NextResponse } from 'next/server';
import { RelationalDatabase } from '@/adapters/db/database';
import { getCurrentUser } from '@/lib/session';

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const db = RelationalDatabase.getInstance();
    const user = await getCurrentUser();

    const evaluation = db.getEvaluationById(id);
    if (!evaluation) {
      return NextResponse.json({ error: 'Evaluation not found' }, { status: 404 });
    }

    const submission = db.getSubmissionById(evaluation.submissionId);
    if (!submission) {
      return NextResponse.json({ error: 'Associated submission not found' }, { status: 404 });
    }

    const attempt = db.getAttemptById(submission.attemptId);
    if (!attempt) {
      return NextResponse.json({ error: 'Associated attempt not found' }, { status: 404 });
    }

    // Ownership check: allow current user to read their own evaluation
    if (attempt.userId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized access to evaluation' }, { status: 403 });
    }

    const problem = db.getProblemById(attempt.problemId);
    const rubric = problem ? db.getRubricById(problem.rubricId) : null;
    const criteriaMeta = rubric ? JSON.parse(rubric.criteriaJson) : [];
    const criteriaMetaMap = new Map(criteriaMeta.map((c: any) => [c.id, c]));

    const items = db.getEvaluationItems(evaluation.id).map((i) => {
      const meta: any = criteriaMetaMap.get(i.criterionId);
      return {
        criterionId: i.criterionId,
        name: meta ? meta.name : i.criterionId,
        weight: meta ? meta.weight : 0.15,
        score: i.score,
        evidence: JSON.parse(i.evidenceJson),
        concern: i.concern,
        suggestion: i.suggestion,
        confidence: i.confidence / 100,
      };
    });

    return NextResponse.json({
      evaluation: {
        id: evaluation.id,
        submissionId: evaluation.submissionId,
        attemptId: attempt.id,
        status: evaluation.status,
        evaluatorKind: evaluation.evaluatorKind,
        evaluatorVersion: evaluation.evaluatorVersion,
        rubricVersion: evaluation.rubricVersion,
        overallScore: evaluation.overallScore,
        summary: evaluation.summary,
        items,
        strengths: evaluation.strengthsJson ? JSON.parse(evaluation.strengthsJson) : [],
        nextAttemptFocus: evaluation.nextAttemptFocusJson
          ? JSON.parse(evaluation.nextAttemptFocusJson)
          : [],
        errorCode: evaluation.errorCode,
        errorMessage: evaluation.errorMessage,
        retryCount: evaluation.retryCount,
        createdAt: evaluation.createdAt,
        completedAt: evaluation.completedAt,
      },
      problem: problem
        ? {
            id: problem.id,
            slug: problem.slug,
            title: problem.title,
            difficulty: problem.difficulty,
          }
        : null,
      submission: {
        id: submission.id,
        format: submission.format,
        payload: JSON.parse(submission.payloadJson),
        createdAt: submission.createdAt,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
