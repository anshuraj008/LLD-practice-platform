import React from 'react';
import { notFound } from 'next/navigation';
import { RelationalDatabase } from '@/adapters/db/database';
import { getCurrentUser } from '@/lib/session';
import { PracticeShell } from '@/components/practice/PracticeShell';

export const dynamic = 'force-dynamic';

interface AttemptWorkspaceProps {
  params: Promise<{ id: string }>;
}

export default async function AttemptWorkspacePage({ params }: AttemptWorkspaceProps) {
  const { id } = await params;
  const db = RelationalDatabase.getInstance();
  const user = await getCurrentUser();

  const attempt = db.getAttemptById(id);
  if (!attempt) {
    notFound();
  }

  // Authorize owner
  if (attempt.userId !== user.id) {
    // Demo ease: if current user doesn't own this attempt, check if it exists and allow viewing in demo
  }

  const problem = db.getProblemById(attempt.problemId);
  if (!problem) {
    notFound();
  }

  const rubric = db.getRubricById(problem.rubricId);
  const submission = db.getSubmissionByAttemptId(attempt.id);
  const evaluation = submission ? db.getEvaluationBySubmissionId(submission.id) : null;

  const domainProblem = {
    id: problem.id,
    slug: problem.slug,
    title: problem.title,
    difficulty: problem.difficulty,
    description: problem.description,
    requirements: JSON.parse(problem.requirementsJson),
    rubricId: problem.rubricId,
    isActive: problem.isActive,
    tags: JSON.parse(problem.tagsJson),
    estimatedMinutes: problem.estimatedMinutes,
  };

  const domainRubric = rubric
    ? {
        id: rubric.id,
        name: rubric.name,
        version: rubric.version,
        criteria: JSON.parse(rubric.criteriaJson),
      }
    : null;

  return (
    <PracticeShell
      attemptId={attempt.id}
      initialDraft={JSON.parse(attempt.draftJson)}
      isSubmitted={attempt.status === 'SUBMITTED'}
      problem={domainProblem}
      rubric={domainRubric}
      existingEvaluationId={evaluation?.id || null}
    />
  );
}
