import { Evaluator, EvaluatorInput } from '../../domain/interfaces/evaluator';
import { EvaluationResult } from '../../domain/types/feedback';
import { DeterministicSubmissionValidator } from './deterministic-validator';
import { GeminiEvaluator } from './gemini-evaluator';
import { MockEvaluator } from './mock-evaluator';

export class HybridEvaluator implements Evaluator {
  public readonly kind = 'hybrid-deterministic-gemini';
  public readonly version = '1.0.0';

  private validator = new DeterministicSubmissionValidator();
  private geminiEvaluator = new GeminiEvaluator();
  private mockEvaluator = new MockEvaluator();

  public async evaluate(input: EvaluatorInput): Promise<EvaluationResult> {
    const { submission, problem } = input;

    // 1. Run deterministic structural checks
    const issues = this.validator.validate(submission.payload, problem);
    const criticalErrors = issues.filter((i) => i.severity === 'error');

    if (criticalErrors.length > 0) {
      throw new Error(
        `Structural validation failed before AI evaluation: ${criticalErrors.map((e) => `${e.field}: ${e.message}`).join('; ')}`
      );
    }

    // 2. Invoke Gemini AI Evaluator (or fallback gracefully to MockEvaluator if no API key is provided)
    if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim().length > 0) {
      try {
        return await this.geminiEvaluator.evaluate(input);
      } catch (geminiErr) {
        console.warn('Gemini evaluation failed, falling back to mock evaluator:', geminiErr);
        // If Gemini fails (e.g. rate limit / network error in demo), fallback to high-fidelity mock
        return await this.mockEvaluator.evaluate(input);
      }
    }

    return await this.mockEvaluator.evaluate(input);
  }
}
