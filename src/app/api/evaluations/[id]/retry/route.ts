import { NextRequest, NextResponse } from 'next/server';
import { EvaluationService } from '@/services/evaluation-service';
import { InProcessEvaluationDispatcher } from '@/adapters/dispatcher/in-process-dispatcher';
import { RelationalDatabase } from '@/adapters/db/database';
import { getCurrentUser } from '@/lib/session';

export async function POST(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const user = await getCurrentUser();
    const db = RelationalDatabase.getInstance();

    const evaluation = db.getEvaluationById(id);
    if (!evaluation) {
      return NextResponse.json({ error: 'Evaluation not found' }, { status: 404 });
    }

    const sub = db.getSubmissionById(evaluation.submissionId);
    const attempt = sub ? db.getAttemptById(sub.attemptId) : null;
    if (!attempt || attempt.userId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized retry' }, { status: 403 });
    }

    const service = new EvaluationService();
    const retriedEval = service.retryEvaluation(id);

    // Dispatch job again
    const dispatcher = InProcessEvaluationDispatcher.getInstance();
    await dispatcher.dispatch(id);

    return NextResponse.json({
      evaluation: retriedEval,
      message: 'Evaluation retry queued successfully.',
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
