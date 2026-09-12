import { RubricCriterionId } from './rubric';

export interface FeedbackItem {
  criterionId: RubricCriterionId;
  score: number; // 0 to 5
  evidence: string[]; // Cited quotes or snippets from the learner submission
  concern: string; // Specific design deficiency or gap identified
  suggestion: string; // Actionable, concrete improvement advice
  confidence: number; // 0.0 to 1.0 confidence score
}

export interface EvaluationResult {
  overallScore: number; // Normalized 0-100 weighted score
  summary: string; // High-level executive design review summary
  criteria: FeedbackItem[];
  strengths: string[];
  nextAttemptFocus: string[];
}
