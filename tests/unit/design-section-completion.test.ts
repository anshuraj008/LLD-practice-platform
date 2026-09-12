import { describe, expect, it } from 'vitest';
import {
  countCompletedDesignSections,
  getDesignSectionCompletion,
} from '../../src/lib/submission-requirements';
import { excerptForCard } from '../../src/lib/utils';

const emptyDraft = {
  assumptions: '',
  classes: [],
  relationships: '',
  mainFlow: '',
  edgeCases: '',
  tradeOffs: '',
};

describe('design section completion', () => {
  it('starts at 0 of 6', () => {
    expect(countCompletedDesignSections(emptyDraft)).toBe(0);
  });

  it('marks assumptions complete as soon as the minimum length is met', () => {
    const draft = {
      ...emptyDraft,
      assumptions: 'The lot has 4 floors, 2 gates, and motorcycle/car/truck/EV types.',
    };
    expect(getDesignSectionCompletion(draft).assumptions).toBe(true);
    expect(countCompletedDesignSections(draft)).toBe(1);
  });

  it('does not count classes until names and responsibilities meet the bar', () => {
    const draft = {
      ...emptyDraft,
      classes: [
        { name: 'ParkingLot', responsibility: 'too short' },
        { name: 'Gate', responsibility: 'too short' },
      ],
    };
    expect(getDesignSectionCompletion(draft).classes).toBe(false);
  });
});

describe('excerptForCard', () => {
  it('cuts elevator copy at a sentence instead of mid algorithm list', () => {
    const description =
      'Design a high-throughput elevator dispatching system for a 40-floor commercial building with N elevator cars. The system handles external floor hall calls (Up/Down) and internal elevator cabin floor requests, optimising wait times using configurable dispatch algorithms (SCAN/LOOK, Nearest Car, Energy Saver).';
    const excerpt = excerptForCard(description);
    expect(excerpt.endsWith('cars.')).toBe(true);
    expect(excerpt).not.toContain('Nearest Car');
  });
});
