import { describe, expect, it } from 'vitest';

import {
  getCareerSemanticSource
} from './careerSemanticSourceRegistry';

describe('CW-R1 C1 — Career semantic ownership boundaries', () => {
  it('keeps 10th-house promise in the structural layer', () => {
    const source = getCareerSemanticSource(
      'CAREER_10H_STRONG_001'
    );

    expect(source?.ownership).toContain('STRUCTURAL');
    expect(source?.ownership).toContain('CONDITION');
  });

  it('keeps 10th-lord dignity in structural/condition semantics', () => {
    const source = getCareerSemanticSource(
      'CAREER_10L_DIGNITY_001'
    );

    expect(source?.ownership).toContain('STRUCTURAL');
    expect(source?.ownership).toContain('CONDITION');
  });

  it('keeps house links in relationship semantics', () => {
    for (const ruleId of [
      'CAREER_6H_10H_LINK_001',
      'CAREER_10H_11H_LINK_001',
      'CAREER_6L_10L_LINK_001',
      'CAREER_10L_11L_LINK_001'
    ]) {
      const source = getCareerSemanticSource(ruleId);

      expect(source?.ownership).toContain('RELATIONSHIP');
    }
  });

  it('keeps planetary relevance separate from house structure', () => {
    for (const ruleId of [
      'CAREER_SUN_RELEVANCE_001',
      'CAREER_SATURN_RELEVANCE_001',
      'CAREER_MERCURY_RELEVANCE_001',
      'CAREER_MARS_RELEVANCE_001',
      'CAREER_JUPITER_RELEVANCE_001'
    ]) {
      const source = getCareerSemanticSource(ruleId);

      expect(source?.ownership).toContain('RELEVANCE');
    }
  });

  it('keeps D10 as qualification', () => {
    const source = getCareerSemanticSource(
      'CAREER_D10_CONFIRMATION_001'
    );

    expect(source?.ownership).toContain('QUALIFICATION');
    expect(source?.ownership).not.toContain('STRUCTURAL');
  });

  it('keeps Dasha as timing', () => {
    const source = getCareerSemanticSource(
      'CAREER_DASHA_TIMING_001'
    );

    expect(source?.ownership).toContain('TIMING');
    expect(source?.ownership).not.toContain('STRUCTURAL');
  });

  it('keeps Yoga as confirmation/qualification', () => {
    const source = getCareerSemanticSource(
      'CAREER_YOGA_CONFIRMATION_001'
    );

    expect(source?.ownership).toContain('QUALIFICATION');
  });
});
