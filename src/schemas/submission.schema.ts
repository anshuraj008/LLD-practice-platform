import { z } from 'zod';
import { ClassDesignItemSchema } from './attempt.schema';

export const StructuredTextSubmissionPayloadSchema = z.object({
  format: z.literal('structured-text'),
  assumptions: z.string().trim().min(10, 'Assumptions must contain at least 10 characters').max(4000),
  classes: z
    .array(ClassDesignItemSchema)
    .min(2, 'Design must specify at least 2 distinct classes')
    .max(30),
  relationships: z.string().trim().min(10, 'Relationships description must contain at least 10 characters').max(4000),
  mainFlow: z.string().trim().min(10, 'Main flow description must contain at least 10 characters').max(4000),
  edgeCases: z.string().trim().min(10, 'Edge cases must contain at least 10 characters').max(4000),
  tradeOffs: z.string().trim().min(10, 'Trade-offs and extensibility must contain at least 10 characters').max(4000),
});

export const SubmitAttemptRequestSchema = z.object({
  idempotencyKey: z.string().uuid('A valid UUID idempotencyKey is required'),
  payload: StructuredTextSubmissionPayloadSchema,
});

export type StructuredTextSubmissionPayloadDto = z.infer<typeof StructuredTextSubmissionPayloadSchema>;
export type SubmitAttemptRequestDto = z.infer<typeof SubmitAttemptRequestSchema>;
