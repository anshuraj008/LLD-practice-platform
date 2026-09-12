import fs from 'fs';
import path from 'path';
import {
  DbUser,
  DbRubric,
  DbProblem,
  DbAttempt,
  DbSubmission,
  DbEvaluation,
  DbEvaluationItem,
} from './schema';

interface DatabaseState {
  users: DbUser[];
  rubrics: DbRubric[];
  problems: DbProblem[];
  attempts: DbAttempt[];
  submissions: DbSubmission[];
  evaluations: DbEvaluation[];
  evaluationItems: DbEvaluationItem[];
}

export class RelationalDatabase {
  private static instance: RelationalDatabase | null = null;
  private filePath: string;
  private state: DatabaseState = {
    users: [],
    rubrics: [],
    problems: [],
    attempts: [],
    submissions: [],
    evaluations: [],
    evaluationItems: [],
  };
  private isInitialized = false;

  private constructor() {
    this.filePath = path.join(process.cwd(), 'data', 'database.json');
    this.ensureInitialized();
  }

  public static getInstance(): RelationalDatabase {
    if (!RelationalDatabase.instance) {
      RelationalDatabase.instance = new RelationalDatabase();
    }
    return RelationalDatabase.instance;
  }

  private ensureInitialized(): void {
    if (this.isInitialized) return;

    try {
      const dir = path.dirname(this.filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, 'utf-8');
        if (raw.trim()) {
          const parsed = JSON.parse(raw);
          this.state = {
            users: parsed.users || [],
            rubrics: parsed.rubrics || [],
            problems: parsed.problems || [],
            attempts: parsed.attempts || [],
            submissions: parsed.submissions || [],
            evaluations: parsed.evaluations || [],
            evaluationItems: parsed.evaluationItems || [],
          };
          this.isInitialized = true;
          return;
        }
      }

      // If no file exists, save default state and flag for seeding
      this.persist();
      this.isInitialized = true;
    } catch (err) {
      console.error('Error loading database:', err);
      this.isInitialized = true;
    }
  }

  private persist(): void {
    try {
      const dir = path.dirname(this.filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(this.filePath, JSON.stringify(this.state, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error persisting database to disk:', err);
    }
  }

  // --- Users ---
  public getUsers(): DbUser[] {
    return [...this.state.users];
  }
  public getUserById(id: string): DbUser | undefined {
    return this.state.users.find((u) => u.id === id);
  }
  public upsertUser(user: DbUser): void {
    const idx = this.state.users.findIndex((u) => u.id === user.id);
    if (idx >= 0) this.state.users[idx] = user;
    else this.state.users.push(user);
    this.persist();
  }

  // --- Rubrics ---
  public getRubrics(): DbRubric[] {
    return [...this.state.rubrics];
  }
  public getRubricById(id: string): DbRubric | undefined {
    return this.state.rubrics.find((r) => r.id === id);
  }
  public upsertRubric(rubric: DbRubric): void {
    const idx = this.state.rubrics.findIndex((r) => r.id === rubric.id);
    if (idx >= 0) this.state.rubrics[idx] = rubric;
    else this.state.rubrics.push(rubric);
    this.persist();
  }

  // --- Problems ---
  public getProblems(): DbProblem[] {
    return [...this.state.problems];
  }
  public getProblemBySlug(slug: string): DbProblem | undefined {
    return this.state.problems.find((p) => p.slug === slug && p.isActive);
  }
  public getProblemById(id: string): DbProblem | undefined {
    return this.state.problems.find((p) => p.id === id);
  }
  public upsertProblem(problem: DbProblem): void {
    const idx = this.state.problems.findIndex((p) => p.id === problem.id);
    if (idx >= 0) this.state.problems[idx] = problem;
    else this.state.problems.push(problem);
    this.persist();
  }

  // --- Attempts ---
  public getAttempts(): DbAttempt[] {
    return [...this.state.attempts];
  }
  public getAttemptById(id: string): DbAttempt | undefined {
    return this.state.attempts.find((a) => a.id === id);
  }
  public getAttemptsByUserId(userId: string): DbAttempt[] {
    return this.state.attempts.filter((a) => a.userId === userId);
  }
  public getAttemptsByUserAndProblem(userId: string, problemId: string): DbAttempt[] {
    return this.state.attempts.filter((a) => a.userId === userId && a.problemId === problemId);
  }
  public resetUserHistory(userId: string): void {
    const attemptIds = new Set(
      this.state.attempts.filter((attempt) => attempt.userId === userId).map((attempt) => attempt.id)
    );
    const submissionIds = new Set(
      this.state.submissions
        .filter((submission) => attemptIds.has(submission.attemptId))
        .map((submission) => submission.id)
    );

    this.state.evaluationItems = this.state.evaluationItems.filter(
      (item) => !submissionIds.has(this.state.evaluations.find((evaluation) => evaluation.id === item.evaluationId)?.submissionId || '')
    );
    this.state.evaluations = this.state.evaluations.filter(
      (evaluation) => !submissionIds.has(evaluation.submissionId)
    );
    this.state.submissions = this.state.submissions.filter(
      (submission) => !attemptIds.has(submission.attemptId)
    );
    this.state.attempts = this.state.attempts.filter((attempt) => !attemptIds.has(attempt.id));
    this.persist();
  }
  public upsertAttempt(attempt: DbAttempt): void {
    const idx = this.state.attempts.findIndex((a) => a.id === attempt.id);
    if (idx >= 0) this.state.attempts[idx] = attempt;
    else this.state.attempts.push(attempt);
    this.persist();
  }

  // --- Submissions ---
  public getSubmissions(): DbSubmission[] {
    return [...this.state.submissions];
  }
  public getSubmissionById(id: string): DbSubmission | undefined {
    return this.state.submissions.find((s) => s.id === id);
  }
  public getSubmissionByAttemptId(attemptId: string): DbSubmission | undefined {
    return this.state.submissions.find((s) => s.attemptId === attemptId);
  }
  public getSubmissionByIdempotencyKey(key: string): DbSubmission | undefined {
    return this.state.submissions.find((s) => s.idempotencyKey === key);
  }
  public upsertSubmission(submission: DbSubmission): void {
    const idx = this.state.submissions.findIndex((s) => s.id === submission.id);
    if (idx >= 0) this.state.submissions[idx] = submission;
    else this.state.submissions.push(submission);
    this.persist();
  }

  // --- Evaluations ---
  public getEvaluations(): DbEvaluation[] {
    return [...this.state.evaluations];
  }
  public getEvaluationById(id: string): DbEvaluation | undefined {
    return this.state.evaluations.find((e) => e.id === id);
  }
  public getEvaluationBySubmissionId(submissionId: string): DbEvaluation | undefined {
    return this.state.evaluations.find((e) => e.submissionId === submissionId);
  }
  public upsertEvaluation(evaluation: DbEvaluation): void {
    const idx = this.state.evaluations.findIndex((e) => e.id === evaluation.id);
    if (idx >= 0) this.state.evaluations[idx] = evaluation;
    else this.state.evaluations.push(evaluation);
    this.persist();
  }

  // --- Evaluation Items ---
  public getEvaluationItems(evaluationId: string): DbEvaluationItem[] {
    return this.state.evaluationItems.filter((i) => i.evaluationId === evaluationId);
  }
  public setEvaluationItems(evaluationId: string, items: DbEvaluationItem[]): void {
    this.state.evaluationItems = this.state.evaluationItems.filter((i) => i.evaluationId !== evaluationId);
    this.state.evaluationItems.push(...items);
    this.persist();
  }

  // --- Transactional Helper for Submit ---
  public submitAttemptTransaction(
    attempt: DbAttempt,
    submission: DbSubmission,
    evaluation: DbEvaluation
  ): void {
    // 1. Check idempotency uniqueness
    const existingSubmission = this.getSubmissionByIdempotencyKey(submission.idempotencyKey);
    if (existingSubmission) {
      return; // Already submitted with this idempotency key
    }

    // 2. Perform atomic updates
    const attemptIdx = this.state.attempts.findIndex((a) => a.id === attempt.id);
    if (attemptIdx >= 0) {
      this.state.attempts[attemptIdx] = attempt;
    } else {
      this.state.attempts.push(attempt);
    }

    this.state.submissions.push(submission);
    this.state.evaluations.push(evaluation);

    this.persist();
  }
}

export const db = RelationalDatabase.getInstance();
