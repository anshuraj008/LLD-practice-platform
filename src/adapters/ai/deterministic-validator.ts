import { SubmissionValidator, ValidationIssue } from '../../domain/interfaces/submission-validator';
import { Problem } from '../../domain/types/problem';
import { SubmissionPayload } from '../../domain/types/submission';
import { SUBMISSION_REQUIREMENTS } from '../../lib/submission-requirements';

export class DeterministicSubmissionValidator implements SubmissionValidator {
  public validate(payload: SubmissionPayload, _problem: Problem): ValidationIssue[] {
    const issues: ValidationIssue[] = [];

    // 1. Check Assumptions
    if (!payload.assumptions || payload.assumptions.trim().length < SUBMISSION_REQUIREMENTS.assumptionsMinLength) {
      issues.push({
        field: 'assumptions',
        message: 'Assumptions should be specific and clearly state system scope or boundaries.',
          severity: 'error',
      });
    }

    // 2. Check Classes
    if (!payload.classes || payload.classes.length < SUBMISSION_REQUIREMENTS.minimumClasses) {
      issues.push({
        field: 'classes',
        message: 'A complete Low-Level Design must define at least 2 distinct domain classes.',
        severity: 'error',
      });
    } else {
      const classNames = new Set<string>();
      for (const c of payload.classes) {
        const trimmedName = c.name.trim();
        if (!trimmedName) {
          issues.push({
            field: 'classes',
            message: 'Encountered a class entry with an empty name.',
            severity: 'error',
          });
        } else if (classNames.has(trimmedName.toLowerCase())) {
          issues.push({
            field: 'classes',
            message: `Duplicate class '${trimmedName}' defined. Class names must be unique.`,
            severity: 'error',
          });
        }
        classNames.add(trimmedName.toLowerCase());

        if (!c.responsibility || c.responsibility.trim().length < SUBMISSION_REQUIREMENTS.responsibilityMinLength) {
          issues.push({
            field: 'classes',
            message: `Class '${trimmedName || 'Unnamed'}' must specify a clear responsibility statement.`,
            severity: 'error',
          });
        }
      }
    }

    // 3. Check Relationships & Interfaces
    if (!payload.relationships || payload.relationships.trim().length < SUBMISSION_REQUIREMENTS.relationshipsMinLength) {
      issues.push({
        field: 'relationships',
        message: 'Describe how core classes interact, inherit, or compose with each other.',
          severity: 'error',
      });
    }

    // 4. Check Main Execution Flow
    if (!payload.mainFlow || payload.mainFlow.trim().length < SUBMISSION_REQUIREMENTS.mainFlowMinLength) {
      issues.push({
        field: 'mainFlow',
        message: 'Provide a step-by-step walkthrough of the primary user or system interaction flow.',
          severity: 'error',
      });
    }

    // 5. Check Edge Cases & Testability
    if (!payload.edgeCases || payload.edgeCases.trim().length < SUBMISSION_REQUIREMENTS.edgeCasesMinLength) {
      issues.push({
        field: 'edgeCases',
        message: 'Specify boundary conditions, concurrency handling, or failure modes.',
          severity: 'error',
      });
    }

    // 6. Check Trade-offs & Extensibility
    if (!payload.tradeOffs || payload.tradeOffs.trim().length < SUBMISSION_REQUIREMENTS.tradeOffsMinLength) {
      issues.push({
        field: 'tradeOffs',
        message: 'Explain design trade-offs, alternative approaches considered, and extensibility points.',
          severity: 'error',
      });
    }

    return issues;
  }
}
