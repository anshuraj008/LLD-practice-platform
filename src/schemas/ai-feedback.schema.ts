import { z } from 'zod';

export const RubricCriterionIdSchema = z.enum([
  'requirement-understanding',
  'class-responsibilities',
  'coupling-cohesion',
  'encapsulation-interfaces',
  'abstraction-patterns',
  'extensibility',
  'edge-cases-testability',
  'explanation-quality',
]);

export const FeedbackItemOutputSchema = z.object({
  criterionId: RubricCriterionIdSchema,
  score: z.number().int().min(0, 'Score cannot be less than 0').max(5, 'Score cannot exceed 5'),
  evidence: z
    .array(z.string().trim().min(1))
    .min(1, 'At least one direct quote or concrete evidence reference is required'),
  strength: z
    .string()
    .trim()
    .min(5, 'Strength explanation must be meaningful')
    .default('The submission provides relevant evidence for this criterion.'),
  concern: z.string().trim().min(5, 'Concern explanation must be meaningful'),
  suggestion: z.string().trim().min(5, 'Suggestion must be actionable and concrete'),
  confidence: z.number().min(0.0).max(1.0).default(0.9),
});

export const GeminiEvaluationOutputSchema = z.object({
  summary: z.string().trim().min(20, 'Overall summary must be descriptive and helpful'),
  criteria: z
    .array(FeedbackItemOutputSchema)
    .min(7, 'AI output must evaluate all standard rubric criteria'),
  strengths: z.array(z.string().trim().min(3)).min(1, 'At least one specific strength must be noted'),
  nextAttemptFocus: z
    .array(z.string().trim().min(3))
    .min(1, 'At least one concrete focus area for the next attempt must be given'),
});

export type GeminiEvaluationOutputDto = z.infer<typeof GeminiEvaluationOutputSchema>;
