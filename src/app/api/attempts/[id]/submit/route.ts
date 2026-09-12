import { NextRequest, NextResponse } from 'next/server';
import { submissionService } from '@/services/submission-service';
import { getCurrentUser } from '@/lib/session';
import { SubmitAttemptRequestSchema } from '@/schemas/submission.schema';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: attemptId } = await context.params;
    const user = await getCurrentUser();
    const body = await request.json();

    // Check header or body for Idempotency-Key
    const headerKey = request.headers.get('idempotency-key');
    const finalKey = headerKey || body?.idempotencyKey;

    const validatedBody = SubmitAttemptRequestSchema.safeParse({
      idempotencyKey: finalKey,
      payload: body?.payload,
    });

    if (!validatedBody.success) {
      return NextResponse.json(
        {
          error: 'Validation failed on submission payload',
          details: validatedBody.error.issues,
        },
        { status: 400 }
      );
    }

    const result = await submissionService.submitAttempt({
      attemptId,
      userId: user.id,
      idempotencyKey: validatedBody.data.idempotencyKey,
      payload: validatedBody.data.payload,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (err: any) {
    const status = err.message.includes('Unauthorized') ? 403 : 400;
    return NextResponse.json({ error: err.message }, { status });
  }
}
