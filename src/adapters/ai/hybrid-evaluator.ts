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

    // 2. Use Gemini when configured. Provider failures must remain visible to the
    // evaluation lifecycle so the saved submission can be retried explicitly.
    if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim().length > 0) {
      return await this.geminiEvaluator.evaluate(input);
    }

    // Deliberate offline development path when no provider key is configured.
    return await this.mockEvaluator.evaluate(input);
  }
}
