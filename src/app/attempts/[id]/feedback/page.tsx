import React from 'react';
import { notFound } from 'next/navigation';
import { RelationalDatabase } from '@/adapters/db/database';
import { getCurrentUser } from '@/lib/session';
import { EvaluationFeedbackClient } from '@/components/feedback/EvaluationFeedbackClient';

export const dynamic = 'force-dynamic';

interface FeedbackPageProps {
  params: Promise<{ id: string }>;
}

export default async function FeedbackPage({ params }: FeedbackPageProps) {
  const { id: attemptId } = await params;
  const db = RelationalDatabase.getInstance();
  const user = await getCurrentUser();

  const attempt = db.getAttemptById(attemptId);
  if (!attempt) {
    notFound();
  }

  const problem = db.getProblemById(attempt.problemId);
  if (!problem) {
    notFound();
  }

  const submission = db.getSubmissionByAttemptId(attempt.id);
  if (!submission) {
    notFound();
  }

  const evaluation = db.getEvaluationBySubmissionId(submission.id);
  if (!evaluation) {
    notFound();
  }

  const rubric = db.getRubricById(problem.rubricId);
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

  const initialData = {
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
    problem: {
      id: problem.id,
      slug: problem.slug,
      title: problem.title,
      difficulty: problem.difficulty,
    },
  };

  return (
    <EvaluationFeedbackClient
      evaluationId={evaluation.id}
      initialData={initialData}
      problemSlug={problem.slug}
      problemId={problem.id}
    />
  );
}
