export type ProblemDifficulty = 'EASY' | 'MEDIUM' | 'HARD';

export interface ProblemRequirementItem {
  id: string;
  category: 'functional' | 'non-functional' | 'constraint';
  description: string;
}

export interface Problem {
  id: string;
  slug: string;
  title: string;
  difficulty: ProblemDifficulty;
  description: string;
  requirements: ProblemRequirementItem[];
  rubricId: string;
  isActive: boolean;
  estimatedMinutes?: number;
  tags?: string[];
  createdAt?: string;
}
