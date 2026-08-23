import { describe, it, expect } from 'vitest';
import { resolveDashaHierarchy } from './dashaHierarchy';

describe('CW-01 Dasha Hierarchy (MD > AD > PD Invariants)', () => {
  it('Rule A: MD CHALLENGES + AD ACTIVATES must NOT become full ACTIVATES', () => {
    const result = resolveDashaHierarchy(
      { level: 'MD', effect: 'CHALLENGES', evidenceIds: ['MD_1'], confidence: 1 },
      { level: 'AD', effect: 'ACTIVATES', evidenceIds: ['AD_1'], confidence: 1 },
      { level: 'PD', effect: 'ACTIVATES', evidenceIds: ['PD_1'], confidence: 1 }
    );

    expect(result.finalEffect).toBe('PARTIALLY_ACTIVATES');
    expect(result.dominantLevel).toBe('MD');
  });

  it('Rule B: MD ACTIVATES + AD CHALLENGES -> PARTIALLY_ACTIVATES', () => {
    const result = resolveDashaHierarchy(
      { level: 'MD', effect: 'ACTIVATES', evidenceIds: ['MD_1'], confidence: 1 },
      { level: 'AD', effect: 'CHALLENGES', evidenceIds: ['AD_1'], confidence: 1 },
      { level: 'PD', effect: 'ACTIVATES', evidenceIds: ['PD_1'], confidence: 1 }
    );

    expect(result.finalEffect).toBe('PARTIALLY_ACTIVATES');
    expect(result.dominantLevel).toBe('MD');
  });

  it('Rule C: PD may only refine an already supportive MD+AD', () => {
    const resultChallengingPD = resolveDashaHierarchy(
      { level: 'MD', effect: 'ACTIVATES', evidenceIds: ['MD_1'], confidence: 1 },
      { level: 'AD', effect: 'ACTIVATES', evidenceIds: ['AD_1'], confidence: 1 },
      { level: 'PD', effect: 'CHALLENGES', evidenceIds: ['PD_1'], confidence: 1 }
    );

    expect(resultChallengingPD.finalEffect).toBe('PARTIALLY_ACTIVATES');
    expect(resultChallengingPD.dominantLevel).toBe('AD');

    const resultSupportivePD = resolveDashaHierarchy(
      { level: 'MD', effect: 'ACTIVATES', evidenceIds: ['MD_1'], confidence: 1 },
      { level: 'AD', effect: 'ACTIVATES', evidenceIds: ['AD_1'], confidence: 1 },
      { level: 'PD', effect: 'ACTIVATES', evidenceIds: ['PD_1'], confidence: 1 }
    );

    expect(resultSupportivePD.finalEffect).toBe('ACTIVATES');
    expect(resultSupportivePD.dominantLevel).toBe('MD');
  });

  it('MD and AD both CHALLENGES yields CHALLENGES', () => {
    const result = resolveDashaHierarchy(
      { level: 'MD', effect: 'CHALLENGES', evidenceIds: ['MD_1'], confidence: 1 },
      { level: 'AD', effect: 'CHALLENGES', evidenceIds: ['AD_1'], confidence: 1 },
      { level: 'PD', effect: 'ACTIVATES', evidenceIds: ['PD_1'], confidence: 1 }
    );

    expect(result.finalEffect).toBe('CHALLENGES');
    expect(result.dominantLevel).toBe('MD');
  });
});
