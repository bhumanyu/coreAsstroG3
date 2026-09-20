import { describe, expect, it } from 'vitest';

import {
  CAREER_SEMANTIC_SOURCE_REGISTRY,
  CAREER_SEMANTIC_SOURCE_RULE_IDS,
  getCareerSemanticSource,
  getCareerSemanticSourcesByOwnership
} from './careerSemanticSourceRegistry';

describe('CW-R1 C1 — Career semantic source registry', () => {
  it('freezes the complete existing Career rule inventory', () => {
    expect(CAREER_SEMANTIC_SOURCE_RULE_IDS).toEqual([
      'CAREER_10H_STRONG_001',
      'CAREER_10H_AFFLICTION_001',
      'CAREER_10H_OCCUPANT_001',
      'CAREER_6H_SERVICE_001',
      'CAREER_11H_GAINS_001',
      'CAREER_2H_WEALTH_001',
      'CAREER_6H_10H_LINK_001',
      'CAREER_10H_11H_LINK_001',
      'CAREER_10L_DIGNITY_001',
      'CAREER_6L_10L_LINK_001',
      'CAREER_10L_11L_LINK_001',
      'CAREER_SUN_RELEVANCE_001',
      'CAREER_SATURN_RELEVANCE_001',
      'CAREER_MERCURY_RELEVANCE_001',
      'CAREER_MARS_RELEVANCE_001',
      'CAREER_JUPITER_RELEVANCE_001',
      'CAREER_ASPECT_10H_001',
      'CAREER_YOGA_CONFIRMATION_001',
      'CAREER_D10_CONFIRMATION_001',
      'CAREER_DASHA_TIMING_001'
    ]);
  });

  it('contains no duplicate semantic rule identifiers', () => {
    const ids = CAREER_SEMANTIC_SOURCE_REGISTRY.map(
      (item) => item.ruleId
    );

    expect(new Set(ids).size).toBe(ids.length);
  });

  it('resolves known Career semantic sources by rule id', () => {
    expect(
      getCareerSemanticSource('CAREER_10H_STRONG_001')
    ).toMatchObject({
      ruleId: 'CAREER_10H_STRONG_001',
      status: 'EXISTING'
    });

    expect(
      getCareerSemanticSource('CAREER_D10_CONFIRMATION_001')
    ).toMatchObject({
      ruleId: 'CAREER_D10_CONFIRMATION_001',
      status: 'EXISTING'
    });

    expect(
      getCareerSemanticSource('CAREER_DASHA_TIMING_001')
    ).toMatchObject({
      ruleId: 'CAREER_DASHA_TIMING_001',
      status: 'EXISTING'
    });
  });

  it('enforces exact ownership for critical structural boundaries', () => {
    expect(
      getCareerSemanticSource('CAREER_10H_STRONG_001')
    ).toMatchObject({
      ruleId: 'CAREER_10H_STRONG_001',
      ownership: ['STRUCTURAL', 'CONDITION'],
      status: 'EXISTING'
    });
  });

  it('returns undefined for an unknown rule', () => {
    expect(
      getCareerSemanticSource('CAREER_UNKNOWN_RULE_999')
    ).toBeUndefined();
  });

  it('identifies structural Career sources', () => {
    const sources = getCareerSemanticSourcesByOwnership(
      'STRUCTURAL'
    );

    expect(
      sources.some(
        (source) => source.ruleId === 'CAREER_10H_STRONG_001'
      )
    ).toBe(true);

    expect(
      sources.some(
        (source) => source.ruleId === 'CAREER_10L_DIGNITY_001'
      )
    ).toBe(true);
  });

  it('identifies Career relationship sources', () => {
    const sources = getCareerSemanticSourcesByOwnership(
      'RELATIONSHIP'
    );

    expect(
      sources.map((source) => source.ruleId)
    ).toEqual(
      expect.arrayContaining([
        'CAREER_6H_10H_LINK_001',
        'CAREER_10H_11H_LINK_001',
        'CAREER_6L_10L_LINK_001',
        'CAREER_10L_11L_LINK_001'
      ])
    );
  });

  it('identifies D10 as qualification rather than primary promise', () => {
    const source = getCareerSemanticSource(
      'CAREER_D10_CONFIRMATION_001'
    );

    expect(source?.ownership).toEqual(['QUALIFICATION']);
    expect(source?.status).toBe('EXISTING');
  });

  it('identifies Dasha as timing rather than natal promise', () => {
    const source = getCareerSemanticSource(
      'CAREER_DASHA_TIMING_001'
    );

    expect(source?.ownership).toEqual(['TIMING']);
  });

  it('identifies Yoga as qualification/confirmation', () => {
    const source = getCareerSemanticSource(
      'CAREER_YOGA_CONFIRMATION_001'
    );

    expect(source?.ownership).toEqual(['RELEVANCE', 'QUALIFICATION']);
  });

  it('does not expose mutable registry state', () => {
    expect(Object.isFrozen(CAREER_SEMANTIC_SOURCE_REGISTRY)).toBe(true);
    expect(Object.isFrozen(CAREER_SEMANTIC_SOURCE_RULE_IDS)).toBe(true);

    for (const source of CAREER_SEMANTIC_SOURCE_REGISTRY) {
      expect(Object.isFrozen(source)).toBe(true);
      expect(Object.isFrozen(source.ownership)).toBe(true);
      expect(Object.isFrozen(source.mustNotBeDuplicatedBy)).toBe(true);
    }
  });
});
