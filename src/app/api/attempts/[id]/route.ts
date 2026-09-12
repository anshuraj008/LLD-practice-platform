import { NextRequest, NextResponse } from 'next/server';
import { attemptService } from '@/services/attempt-service';
import { getCurrentUser } from '@/lib/session';
import { AutosaveDraftRequestSchema } from '@/schemas/attempt.schema';
import { RelationalDatabase } from '@/adapters/db/database';

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const user = await getCurrentUser();
    const attempt = attemptService.getAttempt(id, user.id);

    if (!attempt) {
      return NextResponse.json({ error: 'Attempt not found' }, { status: 404 });
    }

    const db = RelationalDatabase.getInstance();
    const problem = db.getProblemById(attempt.problemId);
    const rubric = problem ? db.getRubricById(problem.rubricId) : null;
    const submission = db.getSubmissionByAttemptId(attempt.id);
    const evaluation = submission ? db.getEvaluationBySubmissionId(submission.id) : null;

    return NextResponse.json({
      attempt,
      problem: problem
        ? {
            id: problem.id,
            slug: problem.slug,
            title: problem.title,
            difficulty: problem.difficulty,
            description: problem.description,
            requirements: JSON.parse(problem.requirementsJson),
            tags: JSON.parse(problem.tagsJson),
            rubric: rubric
              ? {
                  id: rubric.id,
                  name: rubric.name,
                  criteria: JSON.parse(rubric.criteriaJson),
                }
              : null,
          }
        : null,
      submissionId: submission?.id || null,
      evaluationId: evaluation?.id || null,
      evaluationStatus: evaluation?.status || null,
    });
  } catch (err: any) {
    const status = err.message.includes('Unauthorized') ? 403 : 500;
    return NextResponse.json({ error: err.message }, { status });
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const user = await getCurrentUser();
    const body = await request.json();

    const parseResult = AutosaveDraftRequestSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Invalid draft format', details: parseResult.error.issues },
        { status: 400 }
      );
    }

    const updatedAttempt = attemptService.autosaveDraft(id, user.id, parseResult.data.draft);

    return NextResponse.json({ attempt: updatedAttempt });
  } catch (err: any) {
    const status = err.message.includes('Unauthorized') ? 403 : 500;
    return NextResponse.json({ error: err.message }, { status });
  }
}
