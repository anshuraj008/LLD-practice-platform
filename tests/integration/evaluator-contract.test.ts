import { describe, it, expect } from 'vitest';
import { MockEvaluator } from '@/adapters/ai/mock-evaluator';
import { DeterministicSubmissionValidator } from '@/adapters/ai/deterministic-validator';
import { DEFAULT_LLD_RUBRIC_CRITERIA } from '@/domain/types/rubric';
import { Submission } from '@/domain/types/submission';
import { Problem } from '@/domain/types/problem';

describe('Evaluator Contract & Prompt Injection Isolation', () => {
  const mockProblem: Problem = {
    id: 'prob_vending_machine',
    slug: 'vending-machine',
    title: 'Design a State-Driven Snack & Beverage Vending Machine',
    difficulty: 'EASY',
    description: 'Design a vending machine with strict state transitions.',
    requirements: [
      { id: '1', category: 'functional', description: 'Model State pattern for Machine state' },
    ],
    rubricId: 'rubric_v1',
    isActive: true,
  };

  const mockRubric = {
    id: 'rubric_v1',
    name: 'Standard LLD Rubric',
    version: '1.0.0',
    criteria: DEFAULT_LLD_RUBRIC_CRITERIA,
  };

  it('MockEvaluator produces complete 8-criterion feedback with evidence and suggestions', async () => {
    const evaluator = new MockEvaluator();
    const submission: Submission = {
      id: 'sub_test_mock',
      attemptId: 'att_test_mock',
      format: 'structured-text',
      payload: {
        format: 'structured-text',
        assumptions: 'Vending machine holds 50 snacks with coin/bill acceptor.',
        classes: [
          { name: 'VendingMachine', responsibility: 'Context holding currentState and inventory' },
          { name: 'State', responsibility: 'Interface for Idle, HasMoney, Dispense states' },
          { name: 'IdleState', responsibility: 'Handles insertMoney event' },
        ],
        relationships: 'VendingMachine has State. Concrete states implement State interface.',
        mainFlow: '1. User selects item. 2. Inserts cash. 3. Dispenses item. 4. Returns change.',
        edgeCases: 'Exact change unavailable fallback; refund on cancel.',
        tradeOffs: 'Applied State Pattern to encapsulate transitions without if-else cascades.',
      },
      contentHash: 'hash123',
      idempotencyKey: '00000000-0000-0000-0000-000000000001',
      createdAt: new Date().toISOString(),
    };

    const result = await evaluator.evaluate({
      submission,
      problem: mockProblem,
      rubric: mockRubric,
    });

    expect(result.overallScore).toBeGreaterThanOrEqual(70);
    expect(result.criteria.length).toBe(8);
    expect(result.summary).toBeDefined();
    expect(result.strengths.length).toBeGreaterThanOrEqual(1);

    // Verify all criteria contain evidence-backed, actionable feedback
    for (const c of result.criteria) {
      expect(c.evidence.length).toBeGreaterThanOrEqual(1);
      expect(c.strength).toBeDefined();
      expect(c.strength.length).toBeGreaterThanOrEqual(5);
      expect(c.concern).toBeDefined();
      expect(c.suggestion).toBeDefined();
    }
  });

  it('DeterministicSubmissionValidator catches missing class responsibilities and duplicate class names', () => {
    const validator = new DeterministicSubmissionValidator();

    const invalidPayload = {
      format: 'structured-text' as const,
      assumptions: 'Valid assumptions text',
      classes: [
        { name: 'ParkingLot', responsibility: 'Valid responsibility' },
        { name: 'ParkingLot', responsibility: 'Duplicate class name' },
        { name: 'EmptyRespClass', responsibility: '' },
      ],
      relationships: 'Valid relationships text',
      mainFlow: 'Valid main flow walkthrough text',
      edgeCases: 'Valid edge cases text',
      tradeOffs: 'Valid trade-offs text',
    };

    const issues = validator.validate(invalidPayload, mockProblem);
    const errors = issues.filter((i) => i.severity === 'error');
    const warnings = issues.filter((i) => i.severity === 'warning');

    expect(errors.some((e) => e.message.includes('responsibility statement'))).toBe(true);
    expect(warnings.some((w) => w.message.includes('Duplicate class'))).toBe(true);
  });
});
