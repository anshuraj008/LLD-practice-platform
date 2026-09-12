import { Problem } from '../types/problem';
import { Rubric } from '../types/rubric';
import { Submission } from '../types/submission';
import { EvaluationResult } from '../types/feedback';

export interface EvaluatorInput {
  submission: Submission;
  problem: Problem;
  rubric: Rubric;
}

export interface Evaluator {
  readonly kind: string;
  readonly version: string;
  evaluate(input: EvaluatorInput): Promise<EvaluationResult>;
}
