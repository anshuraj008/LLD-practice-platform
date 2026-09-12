import { describe, expect, it } from 'vitest';
import { GeminiEvaluator } from '@/adapters/ai/gemini-evaluator';
import { DEFAULT_LLD_RUBRIC_CRITERIA } from '@/domain/types/rubric';

const liveGemini = describe.skipIf(!process.env.GEMINI_API_KEY);

liveGemini('Gemini live contract', () => {
  it(
    'evaluates one complete structured submission end-to-end',
    async () => {
      const evaluator = new GeminiEvaluator();
      const result = await evaluator.evaluate({
        submission: {
          id: 'sub_live_gemini_contract',
          attemptId: 'att_live_gemini_contract',
          format: 'structured-text',
          payload: {
            format: 'structured-text',
            assumptions: 'The machine supports card and cash payments with one active transaction at a time.',
            classes: [
              { name: 'VendingMachine', responsibility: 'Coordinates selection, payment, dispensing, and state transitions.' },
              { name: 'Inventory', responsibility: 'Tracks rack quantities and atomically reserves stock.' },
            ],
            relationships: 'VendingMachine owns Inventory and delegates payment through a PaymentProcessor interface.',
            mainFlow: 'The customer selects an item, payment is authorized, stock is reserved, and the item is dispensed.',
            edgeCases: 'Handle out of stock, cancellation, payment timeout, insufficient change, and concurrent last-item requests.',
            tradeOffs: 'Use State for transaction rules and an adapter for payment providers while keeping persistence synchronous for the MVP.',
          },
          contentHash: 'live-contract-hash',
          idempotencyKey: '00000000-0000-0000-0000-000000000099',
          createdAt: new Date().toISOString(),
        },
        problem: {
          id: 'prob_vending_machine',
          slug: 'vending-machine',
          title: 'Vending Machine',
          difficulty: 'EASY',
          description: 'Design a state-driven vending machine.',
          requirements: [{ id: '1', category: 'functional', description: 'Use explicit transaction states.' }],
          rubricId: 'rubric_v1',
          isActive: true,
        },
        rubric: {
          id: 'rubric_v1',
          name: 'Standard LLD Rubric',
          version: '1.0.0',
          criteria: DEFAULT_LLD_RUBRIC_CRITERIA,
        },
      });

      expect(result.criteria).toHaveLength(8);
      expect(result.criteria.every((criterion) => criterion.evidence.length > 0)).toBe(true);
      expect(result.criteria.every((criterion) => criterion.strength && criterion.strength.length >= 5)).toBe(true);
      expect(result.overallScore).toBeGreaterThanOrEqual(0);
    },
    30_000
  );
});
