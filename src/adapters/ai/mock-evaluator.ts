import { Evaluator, EvaluatorInput } from '../../domain/interfaces/evaluator';
import { EvaluationResult, FeedbackItem } from '../../domain/types/feedback';
import { ScoreCalculator } from '../../domain/state-machines/score-calculator';

export class MockEvaluator implements Evaluator {
  public readonly kind = 'deterministic-mock-evaluator';
  public readonly version = '1.0.0';

  public async evaluate(input: EvaluatorInput): Promise<EvaluationResult> {
    const { submission, rubric } = input;
    const payload = submission.payload;

    // Simulate realistic network delay (500ms)
    await new Promise((resolve) => setTimeout(resolve, 500));

    const numClasses = payload.classes?.length || 0;
    const hasStrategyOrInterface =
      payload.classes?.some((c) => /strategy|factory|interface|abstract|manager|handler/i.test(c.name)) ||
      /strategy|factory|interface|decouple/i.test(payload.relationships);
    const hasConcurrencyMention = /lock|mutex|atomic|sync|concurrent|thread/i.test(
      payload.edgeCases + ' ' + payload.tradeOffs
    );

    const feedbackItems: FeedbackItem[] = [
      {
        criterionId: 'requirement-understanding',
        score: numClasses >= 3 ? 5 : 3,
        evidence: [payload.assumptions.slice(0, 120) || 'Basic problem assumptions stated.'],
        strength: 'The submission establishes a concrete system scope and identifies important operating assumptions.',
        concern:
          numClasses >= 3
            ? 'None. Core problem requirements and entity life-cycles are thoroughly understood.'
            : 'Scope could be expanded to cover edge requirements.',
        suggestion:
          'Ensure all domain entities and lifecycle states are accounted for explicitly in the assumptions.',
        confidence: 0.95,
      },
      {
        criterionId: 'class-responsibilities',
        score: numClasses >= 4 ? 5 : numClasses >= 2 ? 4 : 2,
        evidence: payload.classes.slice(0, 2).map((c) => `${c.name}: ${c.responsibility}`),
        strength: numClasses >= 2 ? 'The design names domain classes and gives them explicit responsibilities.' : 'The initial class outline provides a starting point for domain decomposition.',
        concern:
          numClasses >= 4
            ? 'Classes are well-partitioned with crisp, single-purpose roles.'
            : 'Some classes may be accumulating multiple responsibilities.',
        suggestion:
          'Continue decomposing coordinator classes to avoid god-class anti-patterns.',
        confidence: 0.92,
      },
      {
        criterionId: 'coupling-cohesion',
        score: hasStrategyOrInterface ? 4 : 3,
        evidence: [payload.relationships.slice(0, 120) || 'Relationships mapped.'],
        strength: hasStrategyOrInterface ? 'The relationships show an intent to depend on abstractions and separate responsibilities.' : 'The submission identifies how its core objects interact.',
        concern: hasStrategyOrInterface
          ? 'Good separation of concerns with manageable coupling.'
          : 'High coupling between domain models and business logic.',
        suggestion:
          'Utilize dependency injection or mediator pattern to keep domain aggregates decoupled.',
        confidence: 0.9,
      },
      {
        criterionId: 'encapsulation-interfaces',
        score: hasStrategyOrInterface ? 5 : 3,
        evidence: [payload.relationships.slice(0, 100) || 'Encapsulation details.'],
        strength: hasStrategyOrInterface ? 'The design names interface boundaries that can protect domain behavior from concrete implementations.' : 'The submission begins to describe the boundaries between its main objects.',
        concern: hasStrategyOrInterface
          ? 'Clean interface boundaries and well-defined public contracts.'
          : 'Direct property mutation observed; encapsulate internal state transitions.',
        suggestion:
          'Expose behavior via explicit command/query methods rather than public getters/setters.',
        confidence: 0.93,
      },
      {
        criterionId: 'abstraction-patterns',
        score: hasStrategyOrInterface ? 5 : 3,
        evidence: [
          payload.tradeOffs.slice(0, 100) ||
            (hasStrategyOrInterface ? 'Strategy / Interface abstractions' : 'Direct class associations'),
        ],
        strength: hasStrategyOrInterface ? 'The selected abstractions correspond to real points of variation in the design.' : 'The trade-off section identifies where additional abstractions may be useful.',
        concern: hasStrategyOrInterface
          ? 'Patterns applied are directly justified by variation points.'
          : 'Opportunity to leverage Strategy or Factory patterns for runtime extensibility.',
        suggestion:
          'Identify points of algorithm variation and encapsulate them behind interfaces.',
        confidence: 0.95,
      },
      {
        criterionId: 'extensibility',
        score: hasStrategyOrInterface ? 5 : 3,
        evidence: [payload.tradeOffs.slice(0, 100) || 'Extensibility trade-offs considered.'],
        strength: hasStrategyOrInterface ? 'The design provides extension points for new policies without changing core entities.' : 'The submission acknowledges future change and extensibility concerns.',
        concern: hasStrategyOrInterface
          ? 'Architecture supports adding new algorithms without modifying existing entities.'
          : 'Adding new rules requires modifying existing core classes (violating OCP).',
        suggestion:
          'Adhere strictly to Open/Closed Principle by depending on abstractions rather than concrete types.',
        confidence: 0.94,
      },
      {
        criterionId: 'edge-cases-testability',
        score: hasConcurrencyMention ? 5 : 3,
        evidence: [payload.edgeCases.slice(0, 120) || 'Edge case coverage.'],
        strength: hasConcurrencyMention ? 'The design explicitly considers concurrency and failure behavior.' : 'The submission identifies boundary conditions that require additional design attention.',
        concern: hasConcurrencyMention
          ? 'Concurrency and failure edge cases are thoughtfully accounted for.'
          : 'Race conditions or boundary capacity failures need deeper analysis.',
        suggestion:
          'Explicitly model locking mechanisms, idempotency guards, and timeout rollbacks.',
        confidence: 0.91,
      },
      {
        criterionId: 'explanation-quality',
        score: 4,
        evidence: [payload.tradeOffs.slice(0, 100) || 'Trade-off analysis provided.'],
        strength: 'The submission communicates a clear architectural choice and gives a basis for discussing alternatives.',
        concern: 'Good clarity on design decisions and trade-offs.',
        suggestion:
          'Elaborate further on alternative architectures considered and why they were rejected.',
        confidence: 0.9,
      },
    ];

    const overallScore = ScoreCalculator.calculateOverallScore(feedbackItems, rubric);

    return {
      overallScore,
      summary:
        overallScore >= 80
          ? 'Strong Low-Level Design demonstrating solid object-oriented principles, clear entity partitioning, and extensible variation points.'
          : 'Good initial design foundation with clear core classes. Improvements can be made in decoupling business logic and formalizing design patterns.',
      criteria: feedbackItems,
      strengths: [
        'Structured modular class hierarchy with distinct responsibilities',
        'Clear execution flow from initial trigger to completion',
      ],
      nextAttemptFocus: [
        'Extract strategy interfaces for algorithms subject to business policy change',
        'Add explicit concurrency guards and thread-safety handling',
      ],
    };
  }
}
