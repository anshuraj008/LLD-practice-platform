import { Problem } from '../types/problem';
import { SubmissionPayload } from '../types/submission';

export interface ValidationIssue {
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface SubmissionValidator {
  validate(payload: SubmissionPayload, problem: Problem): ValidationIssue[];
}
