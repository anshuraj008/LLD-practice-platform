import { NextRequest, NextResponse } from 'next/server';
import { RelationalDatabase } from '@/adapters/db/database';
import { getCurrentUser } from '@/lib/session';

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params;
    const db = RelationalDatabase.getInstance();
    const user = await getCurrentUser();

    const problem = db.getProblemBySlug(slug);
    if (!problem) {
      return NextResponse.json({ error: 'Problem not found' }, { status: 404 });
    }

    const rubric = db.getRubricById(problem.rubricId);
    const userAttempts = db.getAttemptsByUserAndProblem(user.id, problem.id);
    const latestDraft = userAttempts.find((a) => a.status === 'DRAFT');

    return NextResponse.json({
      problem: {
        id: problem.id,
        slug: problem.slug,
        title: problem.title,
        difficulty: problem.difficulty,
        description: problem.description,
        requirements: JSON.parse(problem.requirementsJson),
        tags: JSON.parse(problem.tagsJson),
        estimatedMinutes: problem.estimatedMinutes,
        rubric: rubric
          ? {
              id: rubric.id,
              name: rubric.name,
              version: rubric.version,
              criteria: JSON.parse(rubric.criteriaJson),
            }
          : null,
        activeDraftId: latestDraft?.id || null,
        totalAttempts: userAttempts.length,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
