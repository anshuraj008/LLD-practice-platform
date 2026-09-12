import { describe, it, expect } from 'vitest';
import { ScoreCalculator } from '@/domain/state-machines/score-calculator';
import { DEFAULT_LLD_RUBRIC_CRITERIA, Rubric } from '@/domain/types/rubric';
import { FeedbackItem } from '@/domain/types/feedback';

describe('ScoreCalculator: Normalized Weighted Rubric Calculation', () => {
  const testRubric: Rubric = {
    id: 'rubric_v1',
    name: 'Standard LLD Rubric',
    version: '1.0.0',
    criteria: DEFAULT_LLD_RUBRIC_CRITERIA,
  };

  it('calculates 100% when all criteria score maximum (5/5)', () => {
    const perfectItems: FeedbackItem[] = DEFAULT_LLD_RUBRIC_CRITERIA.map((c) => ({
      criterionId: c.id,
      score: 5,
      evidence: ['Evidence quote'],
      concern: 'None',
      suggestion: 'None',
      confidence: 1.0,
    }));

    const score = ScoreCalculator.calculateOverallScore(perfectItems, testRubric);
    expect(score).toBe(100);
  });

  it('calculates 0% when all criteria score 0/5', () => {
    const zeroItems: FeedbackItem[] = DEFAULT_LLD_RUBRIC_CRITERIA.map((c) => ({
      criterionId: c.id,
      score: 0,
      evidence: ['Evidence quote'],
      concern: 'Completely missing',
      suggestion: 'Implement from scratch',
      confidence: 1.0,
    }));

    const score = ScoreCalculator.calculateOverallScore(zeroItems, testRubric);
    expect(score).toBe(0);
  });

  it('correctly weighs higher-weight criteria (e.g. 20% Class responsibilities vs 5% Explanation quality)', () => {
    const itemsHighClassResponsibility: FeedbackItem[] = DEFAULT_LLD_RUBRIC_CRITERIA.map((c) => ({
      criterionId: c.id,
      score: c.id === 'class-responsibilities' ? 5 : 0, // 20% weight
      evidence: ['Evidence'],
      concern: '',
      suggestion: '',
      confidence: 1.0,
    }));

    const score = ScoreCalculator.calculateOverallScore(itemsHighClassResponsibility, testRubric);
    expect(score).toBe(20);
  });
});
