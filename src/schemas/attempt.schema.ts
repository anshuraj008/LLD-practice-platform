import { z } from 'zod';

export const ClassDesignItemSchema = z.object({
  name: z.string().trim().min(1, 'Class name cannot be empty').max(100, 'Class name too long'),
  responsibility: z.string().trim().min(1, 'Responsibility cannot be empty').max(500, 'Responsibility too long'),
});

export const AttemptDraftSchema = z.object({
  assumptions: z.string().max(4000, 'Assumptions text exceeds maximum length').default(''),
  classes: z.array(ClassDesignItemSchema).max(30, 'Maximum 30 classes allowed').default([]),
  relationships: z.string().max(4000, 'Relationships text exceeds maximum length').default(''),
  mainFlow: z.string().max(4000, 'Main flow text exceeds maximum length').default(''),
  edgeCases: z.string().max(4000, 'Edge cases text exceeds maximum length').default(''),
  tradeOffs: z.string().max(4000, 'Trade-offs text exceeds maximum length').default(''),
});

export const AutosaveDraftRequestSchema = z.object({
  draft: AttemptDraftSchema.partial(),
});

export type AttemptDraftDto = z.infer<typeof AttemptDraftSchema>;
