import { describe, expect, it } from 'vitest';
import {
  buildEvidenceId,
  type EvidenceIdentityInput
} from './evidenceIdentity';

describe('CW-06A Evidence Identity & ID Generation', () => {
  const sampleInput: EvidenceIdentityInput = {
    domain: 'CAREER',
    axis: 'NATAL',
    source: 'D1',
    ruleId: 'CAREER_10TH_LORD_SUPPORT',
    subjectKey: 'SATURN',
    effect: 'SUPPORT',
    strength: 'PRIMARY'
  };

  it('produces the exact same ID for identical input', () => {
    const id1 = buildEvidenceId(sampleInput);
    const id2 = buildEvidenceId({ ...sampleInput });
    expect(id1).toBe('CW-CAREER-NATAL-D1-CAREER_10TH_LORD_SUPPORT-SATURN-SUPPORT-PRIMARY');
    expect(id1).toBe(id2);
  });

  it('is position-independent and generates consistent IDs regardless of call order', () => {
    const inputA: EvidenceIdentityInput = { ...sampleInput, subjectKey: 'SATURN' };
    const inputB: EvidenceIdentityInput = { ...sampleInput, subjectKey: 'JUPITER' };

    const firstRun = [buildEvidenceId(inputA), buildEvidenceId(inputB)];
    const secondRun = [buildEvidenceId(inputB), buildEvidenceId(inputA)];

    expect(firstRun[0]).toBe(secondRun[1]);
    expect(firstRun[1]).toBe(secondRun[0]);
  });

  it('changes when subjectKey changes', () => {
    const id1 = buildEvidenceId({ ...sampleInput, subjectKey: 'SATURN' });
    const id2 = buildEvidenceId({ ...sampleInput, subjectKey: 'MARS' });
    expect(id1).not.toBe(id2);
    expect(id1).toContain('SATURN');
    expect(id2).toContain('MARS');
  });

  it('changes when effect changes', () => {
    const idSupport = buildEvidenceId({ ...sampleInput, effect: 'SUPPORT' });
    const idChallenge = buildEvidenceId({ ...sampleInput, effect: 'CHALLENGE' });
    expect(idSupport).not.toBe(idChallenge);
    expect(idSupport).toContain('SUPPORT');
    expect(idChallenge).toContain('CHALLENGE');
  });

  it('normalizes segments equivalently (e.g. " career-10th-lord " / "10th lord" vs "CAREER_10TH_LORD" / "10TH_LORD")', () => {
    const idUnnormalized = buildEvidenceId({
      domain: 'CAREER',
      axis: 'NATAL',
      source: 'D1',
      ruleId: ' career-10th-lord ',
      subjectKey: '10th lord',
      effect: 'SUPPORT',
      strength: 'PRIMARY'
    });

    const idNormalized = buildEvidenceId({
      domain: 'CAREER',
      axis: 'NATAL',
      source: 'D1',
      ruleId: 'CAREER_10TH_LORD',
      subjectKey: '10TH_LORD',
      effect: 'SUPPORT',
      strength: 'PRIMARY'
    });

    expect(idUnnormalized).toBe('CW-CAREER-NATAL-D1-CAREER_10TH_LORD-10TH_LORD-SUPPORT-PRIMARY');
    expect(idUnnormalized).toBe(idNormalized);
  });

  it('demonstrates reordering stability (map + reversed map, sorted arrays are equal)', () => {
    const inputs: EvidenceIdentityInput[] = [
      {
        domain: 'CAREER',
        axis: 'NATAL',
        source: 'D1',
        ruleId: 'RULE_1',
        subjectKey: 'SUN',
        effect: 'SUPPORT',
        strength: 'PRIMARY'
      },
      {
        domain: 'WEALTH',
        axis: 'DASHA',
        source: 'DASHA',
        ruleId: 'RULE_2',
        subjectKey: 'MOON',
        effect: 'CHALLENGE',
        strength: 'SECONDARY'
      },
      {
        domain: 'CAREER',
        axis: 'TIMING',
        source: 'TRANSIT',
        ruleId: 'RULE_3',
        subjectKey: 'JUPITER',
        effect: 'NEUTRAL',
        strength: 'TERTIARY'
      }
    ];

    const forwardIds = inputs.map(buildEvidenceId);
    const reversedIds = [...inputs].reverse().map(buildEvidenceId);

    expect([...forwardIds].sort()).toEqual([...reversedIds].sort());
  });

  it('throws when subjectKey is empty or whitespace only', () => {
    expect(() =>
      buildEvidenceId({ ...sampleInput, subjectKey: '' })
    ).toThrowError('Evidence subjectKey must not be empty');

    expect(() =>
      buildEvidenceId({ ...sampleInput, subjectKey: '   ' })
    ).toThrowError('Evidence subjectKey must not be empty');
  });

  it('throws when ruleId is empty or whitespace only', () => {
    expect(() =>
      buildEvidenceId({ ...sampleInput, ruleId: '' })
    ).toThrowError('Evidence ruleId must not be empty');

    expect(() =>
      buildEvidenceId({ ...sampleInput, ruleId: '   ' })
    ).toThrowError('Evidence ruleId must not be empty');
  });
});
