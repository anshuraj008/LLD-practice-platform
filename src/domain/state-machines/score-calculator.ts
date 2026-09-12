import { Rubric } from '../types/rubric';
import { FeedbackItem } from '../types/feedback';

export class ScoreCalculator {
  /**
   * Computes the normalized 0-100 overall score based on the weighted rubric criteria.
   * Each criterion score is on a 0-5 scale.
   */
  public static calculateOverallScore(items: FeedbackItem[], rubric: Rubric): number {
    let totalWeightedPercentage = 0;
    let totalWeight = 0;

    const rubricMap = new Map(rubric.criteria.map((c) => [c.id, c]));

    for (const item of items) {
      const criterion = rubricMap.get(item.criterionId);
      if (criterion) {
        // Clamp score between 0 and criterion.maxScore (default 5)
        const clampedScore = Math.max(0, Math.min(criterion.maxScore, item.score));
        const normalizedRatio = clampedScore / criterion.maxScore;
        totalWeightedPercentage += normalizedRatio * criterion.weight;
        totalWeight += criterion.weight;
      }
    }

    if (totalWeight === 0) {
      return 0;
    }

    // Normalize in case weights don't sum to exactly 1.0
    const finalScore = (totalWeightedPercentage / totalWeight) * 100;
    return Math.round(finalScore);
  }
}
