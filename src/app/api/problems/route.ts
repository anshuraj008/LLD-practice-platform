import { NextResponse } from 'next/server';
import { RelationalDatabase } from '@/adapters/db/database';
import { getCurrentUser } from '@/lib/session';

export async function GET() {
  try {
    const db = RelationalDatabase.getInstance();
    const user = await getCurrentUser();
    const allProblems = db.getProblems();
    const userAttempts = db.getAttemptsByUserId(user.id);
    const submissions = db.getSubmissions();
    const evaluations = db.getEvaluations();

    const problemsWithMeta = allProblems.map((p) => {
      const attemptsForProblem = userAttempts.filter((a) => a.problemId === p.id);
      const latestAttempt = attemptsForProblem.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )[0];

      let bestScore: number | null = null;
      for (const att of attemptsForProblem) {
        const sub = submissions.find((s) => s.attemptId === att.id);
        if (sub) {
          const ev = evaluations.find((e) => e.submissionId === sub.id && e.status === 'COMPLETED');
          if (ev && ev.overallScore !== null) {
            if (bestScore === null || ev.overallScore > bestScore) {
              bestScore = ev.overallScore;
            }
          }
        }
      }

      return {
        id: p.id,
        slug: p.slug,
        title: p.title,
        difficulty: p.difficulty,
        description: p.description,
        requirements: JSON.parse(p.requirementsJson),
        tags: JSON.parse(p.tagsJson),
        estimatedMinutes: p.estimatedMinutes,
        attemptCount: attemptsForProblem.length,
        latestAttemptId: latestAttempt?.id || null,
        latestAttemptStatus: latestAttempt?.status || null,
        bestScore,
      };
    });

    return NextResponse.json({ problems: problemsWithMeta });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
