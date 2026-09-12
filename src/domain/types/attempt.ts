import { SubmissionPayload } from './submission';

export type AttemptStatus = 'DRAFT' | 'SUBMITTED';

export interface AttemptDraft {
  assumptions: string;
  classes: Array<{ name: string; responsibility: string }>;
  relationships: string;
  mainFlow: string;
  edgeCases: string;
  tradeOffs: string;
}

export interface Attempt {
  id: string;
  userId: string;
  problemId: string;
  status: AttemptStatus;
  draft: AttemptDraft;
  createdAt: string;
  updatedAt: string;
  submittedAt: string | null;
}
