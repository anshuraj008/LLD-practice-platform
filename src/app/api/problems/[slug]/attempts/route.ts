import { NextRequest, NextResponse } from 'next/server';
import { RelationalDatabase } from '@/adapters/db/database';
import { attemptService } from '@/services/attempt-service';
import { getCurrentUser } from '@/lib/session';

export async function POST(
  request: NextRequest,
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

    const body = await request.json().catch(() => ({}));
    const forceNew = Boolean(body?.forceNew);

    const attempt = forceNew
      ? attemptService.createNewDraftAttempt(user.id, problem.id)
      : attemptService.getOrCreateDraftAttempt(user.id, problem.id);

    return NextResponse.json({ attempt }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
