export const SUBMISSION_REQUIREMENTS = {
  assumptionsMinLength: 30,
  minimumClasses: 2,
  responsibilityMinLength: 10,
  relationshipsMinLength: 30,
  mainFlowMinLength: 40,
  edgeCasesMinLength: 30,
  tradeOffsMinLength: 30,
} as const;

export type DesignSectionId =
  | 'assumptions'
  | 'classes'
  | 'relationships'
  | 'mainFlow'
  | 'edgeCases'
  | 'tradeOffs';

export interface DesignDraftLike {
  assumptions: string;
  classes: Array<{ name: string; responsibility: string }>;
  relationships: string;
  mainFlow: string;
  edgeCases: string;
  tradeOffs: string;
}

export function isTextSectionComplete(value: string, minLength: number): boolean {
  return value.trim().length >= minLength;
}

export function isClassesSectionComplete(
  classes: DesignDraftLike['classes'],
  minimumClasses = SUBMISSION_REQUIREMENTS.minimumClasses,
  responsibilityMinLength = SUBMISSION_REQUIREMENTS.responsibilityMinLength
): boolean {
  if (classes.length < minimumClasses) return false;
  return classes.every(
    (item) =>
      item.name.trim().length > 0 && item.responsibility.trim().length >= responsibilityMinLength
  );
}

export function getDesignSectionCompletion(draft: DesignDraftLike): Record<DesignSectionId, boolean> {
  return {
    assumptions: isTextSectionComplete(draft.assumptions, SUBMISSION_REQUIREMENTS.assumptionsMinLength),
    classes: isClassesSectionComplete(draft.classes),
    relationships: isTextSectionComplete(
      draft.relationships,
      SUBMISSION_REQUIREMENTS.relationshipsMinLength
    ),
    mainFlow: isTextSectionComplete(draft.mainFlow, SUBMISSION_REQUIREMENTS.mainFlowMinLength),
    edgeCases: isTextSectionComplete(draft.edgeCases, SUBMISSION_REQUIREMENTS.edgeCasesMinLength),
    tradeOffs: isTextSectionComplete(draft.tradeOffs, SUBMISSION_REQUIREMENTS.tradeOffsMinLength),
  };
}

export function countCompletedDesignSections(draft: DesignDraftLike): number {
  return Object.values(getDesignSectionCompletion(draft)).filter(Boolean).length;
}
