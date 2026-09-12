export interface ClassDesignItem {
  name: string;
  responsibility: string;
}

export type SubmissionFormat = 'structured-text' | 'class-diagram';

export interface StructuredTextSubmissionPayload {
  format: 'structured-text';
  assumptions: string;
  classes: ClassDesignItem[];
  relationships: string;
  mainFlow: string;
  edgeCases: string;
  tradeOffs: string;
}

export type SubmissionPayload = StructuredTextSubmissionPayload;

export interface Submission {
  id: string;
  attemptId: string;
  format: SubmissionFormat;
  payload: SubmissionPayload;
  contentHash: string;
  idempotencyKey: string;
  createdAt: string;
}
