import { describe, expect, it } from 'vitest';
import {
  createCareerWealthEvidence,
  mapEffectToPolarity
} from './careerWealthEvidence';
import type { EvidenceIdentityInput } from './evidenceIdentity';

describe('CareerWealthEvidence Subtype & Factory', () => {
  const identity: EvidenceIdentityInput = {
    domain: 'CAREER',
    axis: 'NATAL',
    source: 'D1',
    ruleId: 'CAREER_10TH_LORD_SUPPORT',
    subjectKey: 'SATURN',
    effect: 'SUPPORT',
    strength: 'PRIMARY'
  };

  it('guarantees evidence.id === evidence.provenance.evidenceId', () => {
    const evidence = createCareerWealthEvidence({
      identity,
      statement: '10th lord strong in lagna',
      strength: 'STRONG'
    });

    expect(evidence.id).toBe(evidence.provenance.evidenceId);
    expect(evidence.id).toBe(
      'CW-CAREER-NATAL-D1-CAREER_10TH_LORD_SUPPORT-SATURN-SUPPORT-PRIMARY'
    );
  });

  it('guarantees evidence.ruleId === evidence.provenance.ruleId', () => {
    const evidence = createCareerWealthEvidence({
      identity,
      statement: '10th lord strong in lagna',
      strength: 'STRONG'
    });

    expect(evidence.ruleId).toBe(evidence.provenance.ruleId);
    expect(evidence.ruleId).toBe('CAREER_10TH_LORD_SUPPORT');
  });

  it('guarantees evidence.polarity matches mapEffectToPolarity(effect)', () => {
    const supportEv = createCareerWealthEvidence({
      identity: { ...identity, effect: 'SUPPORT' },
      statement: 'Support',
      strength: 'STRONG'
    });
    expect(supportEv.polarity).toBe(mapEffectToPolarity('SUPPORT'));
    expect(supportEv.polarity).toBe('SUPPORTING');

    const challengeEv = createCareerWealthEvidence({
      identity: { ...identity, effect: 'CHALLENGE' },
      statement: 'Challenge',
      strength: 'MODERATE'
    });
    expect(challengeEv.polarity).toBe(mapEffectToPolarity('CHALLENGE'));
    expect(challengeEv.polarity).toBe('CHALLENGING');

    const neutralEv = createCareerWealthEvidence({
      identity: { ...identity, effect: 'NEUTRAL' },
      statement: 'Neutral',
      strength: 'WEAK'
    });
    expect(neutralEv.polarity).toBe(mapEffectToPolarity('NEUTRAL'));
    expect(neutralEv.polarity).toBe('NEUTRAL');
  });

  it('produces a frozen immutable object', () => {
    const evidence = createCareerWealthEvidence({
      identity,
      statement: 'Frozen test',
      strength: 'STRONG'
    });

    expect(Object.isFrozen(evidence)).toBe(true);
    expect(Object.isFrozen(evidence.provenance)).toBe(true);
  });
});
