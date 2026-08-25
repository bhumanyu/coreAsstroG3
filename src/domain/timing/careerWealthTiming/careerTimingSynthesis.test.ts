import { describe, it, expect } from 'vitest';
import { resolveCareerTransitEffect } from './careerTransitRules';
import { synthesizeCareerTiming } from './careerTransitSynthesis';
import type { CareerTransitSynthesis } from './careerWealthTimingTypes';

describe('CW-03 Career Timing Synthesis Core Principles', () => {
  const mockSupportsTransit: CareerTransitSynthesis = {
    transitEffect: 'SUPPORTS',
    confidence: 0.85,
    factors: [],
    summary: 'Supportive transit'
  };

  const mockChallengesTransit: CareerTransitSynthesis = {
    transitEffect: 'CHALLENGES',
    confidence: 0.85,
    factors: [],
    summary: 'Challenging transit'
  };

  it('Spec Case 1: STRONG natal promise + Dasha SUPPORTS + Transit SUPPORTS -> ACTIVATES', () => {
    const effect = resolveCareerTransitEffect('STRONG', 'SUPPORTS', mockSupportsTransit);
    expect(effect).toBe('ACTIVATES');
  });

  it('Spec Case 2: STRONG natal promise + Dasha SUPPORTS + Transit CHALLENGES -> MODIFIES', () => {
    const effect = resolveCareerTransitEffect('STRONG', 'SUPPORTS', mockChallengesTransit);
    expect(effect).toBe('MODIFIES');
  });

  it('Spec Case 3: MIXED natal promise + Dasha SUPPORTS + Transit SUPPORTS -> MODIFIES (Ceiling Rule)', () => {
    const effect = resolveCareerTransitEffect('MIXED', 'SUPPORTS', mockSupportsTransit);
    expect(effect).toBe('MODIFIES');
  });

  it('Spec Case 4: WEAK natal promise + Dasha SUPPORTS + Transit SUPPORTS -> DOES_NOT_ACTIVATE (Ceiling Rule)', () => {
    const effect = resolveCareerTransitEffect('WEAK', 'SUPPORTS', mockSupportsTransit);
    expect(effect).toBe('DOES_NOT_ACTIVATE');
  });

  it('Spec Case 5: Dasha CHALLENGES + Transit SUPPORTS -> MODIFIES', () => {
    const effect = resolveCareerTransitEffect('STRONG', 'CHALLENGES', mockSupportsTransit);
    expect(effect).toBe('MODIFIES');
  });

  it('Spec Case 6: Dasha SUPPORTS + Transit CHALLENGES -> MODIFIES', () => {
    const effect = resolveCareerTransitEffect('STRONG', 'SUPPORTS', mockChallengesTransit);
    expect(effect).toBe('MODIFIES');
  });

  it('synthesizeCareerTiming produces a deterministic CareerTimingSynthesis object', () => {
    const timing = synthesizeCareerTiming('STRONG', undefined, mockSupportsTransit);
    expect(timing.natalPromise).toBe('STRONG');
    expect(timing.overallEffect).toBe('ACTIVATES');
    expect(timing.summary).toContain('ACTIVATES');
  });
});
