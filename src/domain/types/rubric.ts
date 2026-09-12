export type RubricCriterionId =
  | 'requirement-understanding'
  | 'class-responsibilities'
  | 'coupling-cohesion'
  | 'encapsulation-interfaces'
  | 'abstraction-patterns'
  | 'extensibility'
  | 'edge-cases-testability'
  | 'explanation-quality';

export interface RubricCriterion {
  id: RubricCriterionId;
  name: string;
  weight: number; // e.g. 0.15 for 15%
  description: string;
  evaluationMethod: 'deterministic' | 'ai' | 'hybrid';
  maxScore: number; // standard 5
}

export interface Rubric {
  id: string;
  name: string;
  version: string;
  criteria: RubricCriterion[];
}

export const DEFAULT_LLD_RUBRIC_CRITERIA: RubricCriterion[] = [
  {
    id: 'requirement-understanding',
    name: 'Requirement Understanding',
    weight: 0.15,
    description: 'Accurate comprehension of core problem constraints, entity lifecycle, and system boundaries.',
    evaluationMethod: 'ai',
    maxScore: 5,
  },
  {
    id: 'class-responsibilities',
    name: 'Class Responsibilities & Cohesion',
    weight: 0.20,
    description: 'Single Responsibility Principle adherence, class role clarity, and avoiding God classes.',
    evaluationMethod: 'ai',
    maxScore: 5,
  },
  {
    id: 'coupling-cohesion',
    name: 'Coupling & Cohesion',
    weight: 0.15,
    description: 'Degree of inter-module dependency, loose coupling, and dependency direction.',
    evaluationMethod: 'ai',
    maxScore: 5,
  },
  {
    id: 'encapsulation-interfaces',
    name: 'Encapsulation & Interface Design',
    weight: 0.15,
    description: 'Clear abstraction boundaries, polymorphism, well-defined public contracts, and information hiding.',
    evaluationMethod: 'ai',
    maxScore: 5,
  },
  {
    id: 'abstraction-patterns',
    name: 'Design Patterns & Abstractions',
    weight: 0.10,
    description: 'Justified design patterns (Strategy, Factory, State, etc.) applied without over-engineering.',
    evaluationMethod: 'ai',
    maxScore: 5,
  },
  {
    id: 'extensibility',
    name: 'Extensibility & Change Resilience',
    weight: 0.10,
    description: 'Ability to accommodate future feature requirements without rewriting existing classes (Open/Closed).',
    evaluationMethod: 'ai',
    maxScore: 5,
  },
  {
    id: 'edge-cases-testability',
    name: 'Edge Cases & Testability',
    weight: 0.10,
    description: 'Handling race conditions, boundary conditions, capacity limits, and ease of unit testing.',
    evaluationMethod: 'hybrid',
    maxScore: 5,
  },
  {
    id: 'explanation-quality',
    name: 'Explanation & Trade-off Quality',
    weight: 0.05,
    description: 'Clarity of architectural trade-offs, alternative approaches considered, and technical reasoning.',
    evaluationMethod: 'ai',
    maxScore: 5,
  },
];
