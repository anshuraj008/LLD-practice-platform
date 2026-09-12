import { describe, it, expect } from 'vitest';
import { StructuredTextSubmissionPayloadSchema } from '@/schemas/submission.schema';
import { GeminiEvaluationOutputSchema } from '@/schemas/ai-feedback.schema';

describe('Zod Schema Contracts & Validation Invariants', () => {
  describe('StructuredTextSubmissionPayloadSchema', () => {
    it('accepts valid structured submission payload', () => {
      const validPayload = {
        format: 'structured-text' as const,
        assumptions: 'Supports 4 floors, 2 entrance gates, compact/large spots.',
        classes: [
          { name: 'ParkingLot', responsibility: 'Manages multi-floor capacity and gates' },
          { name: 'ParkingSpot', responsibility: 'Encapsulates vehicle occupancy state' },
        ],
        relationships: 'ParkingLot has many ParkingSpots. Ticket created on entry.',
        mainFlow: '1. Vehicle arrives at gate. 2. Spot assigned. 3. Ticket issued. 4. Exit payment.',
        edgeCases: 'Concurrency race conditions handled via atomic test-and-set.',
        tradeOffs: 'Strategy pattern applied for fee calculations.',
      };

      const result = StructuredTextSubmissionPayloadSchema.safeParse(validPayload);
      expect(result.success).toBe(true);
    });

    it('rejects a submission that does not meet meaningful practice minimums', () => {
      const incompletePayload = {
        format: 'structured-text' as const,
        assumptions: 'Too short',
        classes: [
          { name: 'ParkingLot', responsibility: 'Manages floors' },
          { name: 'ParkingSpot', responsibility: 'Tracks occupancy' },
        ],
        relationships: 'Too short',
        mainFlow: 'Too short',
        edgeCases: 'Too short',
        tradeOffs: 'Too short',
      };

      const result = StructuredTextSubmissionPayloadSchema.safeParse(incompletePayload);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.map((issue) => issue.path[0])).toEqual(
          expect.arrayContaining(['assumptions', 'relationships', 'mainFlow', 'edgeCases', 'tradeOffs'])
        );
      }
    });

    it('rejects submission with fewer than 2 classes', () => {
      const invalidPayload = {
        format: 'structured-text' as const,
        assumptions: 'Valid assumptions length for testing',
        classes: [{ name: 'SoloGodClass', responsibility: 'Does literally everything in the system' }],
        relationships: 'Valid relationships length for testing',
        mainFlow: 'Valid main flow walkthrough description',
        edgeCases: 'Valid edge cases analysis',
        tradeOffs: 'Valid trade-offs description',
      };

      const result = StructuredTextSubmissionPayloadSchema.safeParse(invalidPayload);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('at least 2 distinct classes');
      }
    });

    it('rejects classes with empty or whitespace-only names', () => {
      const invalidPayload = {
        format: 'structured-text' as const,
        assumptions: 'Valid assumptions length for testing',
        classes: [
          { name: '   ', responsibility: 'Valid responsibility description' },
          { name: 'ValidClass', responsibility: 'Valid responsibility description' },
        ],
        relationships: 'Valid relationships length for testing',
        mainFlow: 'Valid main flow walkthrough description',
        edgeCases: 'Valid edge cases analysis',
        tradeOffs: 'Valid trade-offs description',
      };

      const result = StructuredTextSubmissionPayloadSchema.safeParse(invalidPayload);
      expect(result.success).toBe(false);
    });
  });

  describe('GeminiEvaluationOutputSchema', () => {
    it('accepts complete, structured AI evaluation output with cited evidence', () => {
      const validAiOutput = {
        summary: 'Excellent object-oriented decomposition with clear SRP and Strategy pattern usage.',
        criteria: [
          {
            criterionId: 'requirement-understanding',
            score: 5,
            evidence: ['Supports 4 floors, 2 entrance gates'],
            concern: 'None. Complete problem scope understanding.',
            suggestion: 'Maintain this level of requirement fidelity.',
            confidence: 0.98,
          },
          {
            criterionId: 'class-responsibilities',
            score: 4,
            evidence: ['ParkingLot: Manages multi-floor capacity and gates'],
            concern: 'Consider extracting GateManager from ParkingLot.',
            suggestion: 'Separate gate hardware coordination into dedicated GateController.',
            confidence: 0.95,
          },
          {
            criterionId: 'coupling-cohesion',
            score: 4,
            evidence: ['ParkingLot has many ParkingSpots'],
            concern: 'Direct collection exposure risk.',
            suggestion: 'Encapsulate collection behind domain query methods.',
            confidence: 0.92,
          },
          {
            criterionId: 'encapsulation-interfaces',
            score: 4,
            evidence: ['Encapsulates vehicle occupancy state'],
            concern: 'Public getter/setter exposure.',
            suggestion: 'Expose assignVehicle() and vacate() commands.',
            confidence: 0.93,
          },
          {
            criterionId: 'abstraction-patterns',
            score: 5,
            evidence: ['Strategy pattern applied for fee calculations'],
            concern: 'None. Proper pattern justification.',
            suggestion: 'Add enum for supported strategy types.',
            confidence: 0.95,
          },
          {
            criterionId: 'extensibility',
            score: 5,
            evidence: ['Strategy pattern applied for fee calculations'],
            concern: 'None. Highly extensible.',
            suggestion: 'Ready for dynamic EV surcharge plugin.',
            confidence: 0.96,
          },
          {
            criterionId: 'edge-cases-testability',
            score: 4,
            evidence: ['Concurrency race conditions handled via atomic test-and-set'],
            concern: 'Could specify lock granularity.',
            suggestion: 'Apply fine-grained per-floor locking.',
            confidence: 0.91,
          },
          {
            criterionId: 'explanation-quality',
            score: 5,
            evidence: ['Strategy pattern applied for fee calculations'],
            concern: 'None.',
            suggestion: 'Solid trade-off discussion.',
            confidence: 0.95,
          },
        ],
        strengths: ['SRP adherence', 'Proper Strategy pattern application'],
        nextAttemptFocus: ['Fine-grained floor level concurrency locking'],
      };

      const result = GeminiEvaluationOutputSchema.safeParse(validAiOutput);
      expect(result.success).toBe(true);
    });

    it('rejects AI output with out-of-range scores (e.g. 9/5 or negative score)', () => {
      const invalidAiOutput = {
        summary: 'Invalid score test with out-of-range rating.',
        criteria: [
          {
            criterionId: 'requirement-understanding',
            score: 9, // Out of bounds
            evidence: ['Evidence quote'],
            concern: 'Concern',
            suggestion: 'Suggestion',
            confidence: 0.9,
          },
        ],
        strengths: ['Strength 1'],
        nextAttemptFocus: ['Focus 1'],
      };

      const result = GeminiEvaluationOutputSchema.safeParse(invalidAiOutput);
      expect(result.success).toBe(false);
    });
  });
});
