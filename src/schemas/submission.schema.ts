import { z } from 'zod';
import { ClassDesignItemSchema } from './attempt.schema';
import { SUBMISSION_REQUIREMENTS } from '@/lib/submission-requirements';

const SubmissionClassDesignItemSchema = ClassDesignItemSchema.extend({
  responsibility: z.string().trim().min(SUBMISSION_REQUIREMENTS.responsibilityMinLength, 'Each class must include a meaningful responsibility'),
});

export const StructuredTextSubmissionPayloadSchema = z.object({
  format: z.literal('structured-text'),
  assumptions: z.string().trim().min(SUBMISSION_REQUIREMENTS.assumptionsMinLength, `Assumptions must contain at least ${SUBMISSION_REQUIREMENTS.assumptionsMinLength} characters`).max(4000),
  classes: z
    .array(SubmissionClassDesignItemSchema)
    .min(SUBMISSION_REQUIREMENTS.minimumClasses, `Design must specify at least ${SUBMISSION_REQUIREMENTS.minimumClasses} distinct classes`)
    .max(30),
  relationships: z.string().trim().min(SUBMISSION_REQUIREMENTS.relationshipsMinLength, `Relationships description must contain at least ${SUBMISSION_REQUIREMENTS.relationshipsMinLength} characters`).max(4000),
  mainFlow: z.string().trim().min(SUBMISSION_REQUIREMENTS.mainFlowMinLength, `Main flow description must contain at least ${SUBMISSION_REQUIREMENTS.mainFlowMinLength} characters`).max(4000),
  edgeCases: z.string().trim().min(SUBMISSION_REQUIREMENTS.edgeCasesMinLength, `Edge cases must contain at least ${SUBMISSION_REQUIREMENTS.edgeCasesMinLength} characters`).max(4000),
  tradeOffs: z.string().trim().min(SUBMISSION_REQUIREMENTS.tradeOffsMinLength, `Trade-offs and extensibility must contain at least ${SUBMISSION_REQUIREMENTS.tradeOffsMinLength} characters`).max(4000),
});

export const SubmitAttemptRequestSchema = z.object({
  idempotencyKey: z.string().uuid('A valid UUID idempotencyKey is required'),
  payload: StructuredTextSubmissionPayloadSchema,
});

export type StructuredTextSubmissionPayloadDto = z.infer<typeof StructuredTextSubmissionPayloadSchema>;
export type SubmitAttemptRequestDto = z.infer<typeof SubmitAttemptRequestSchema>;
