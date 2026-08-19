import { describe, expect, it } from 'vitest';
import { runAiExplanation } from './aiExplanationService';
import { calculateHoroscope } from '../../engine/astroEngine';
import { CANONICAL_BIRTH_DETAILS } from '../../test/fixtures/canonicalChart';
import type { Horoscope } from '../../types';

function createHoroscope(): Horoscope {
  return calculateHoroscope(CANONICAL_BIRTH_DETAILS);
}

describe('runAiExplanation', () => {
  it('builds a local chart synthesis explanation', async () => {
    const result = await runAiExplanation({
      horoscope: createHoroscope(),
      task: 'CHART_SYNTHESIS'
    });

    expect(result.status === 'SUCCESS' || result.status === 'PARTIAL').toBe(true);

    if (result.kind === 'SUCCESS') {
      expect(result.providerId).toBe('local-vedic-rules');
      expect(result.providerKind).toBe('LOCAL_RULES');
      expect(result.routingMode).toBe('LOCAL_ONLY');
      expect(result.conclusion.length).toBeGreaterThan(0);
      expect(result.fallbackUsed).toBe(false);
    }
  });

  it('resolves supporting evidence IDs', async () => {
    const result = await runAiExplanation({
      horoscope: createHoroscope(),
      task: 'CHART_SYNTHESIS'
    });

    if (result.kind === 'ERROR') {
      throw new Error(result.message);
    }

    expect(result.supportingEvidence.length).toBeGreaterThan(0);

    for (const item of result.supportingEvidence) {
      expect(item.evidence.id).toBeTruthy();
      expect(item.evidence.statement).toBeTruthy();
      expect(item.role).toBe('SUPPORTING');
    }
  });

  it('uses local-only routing', async () => {
    const result = await runAiExplanation({
      horoscope: createHoroscope(),
      task: 'WEALTH_ANALYSIS'
    });

    expect(result.status === 'SUCCESS' || result.status === 'PARTIAL').toBe(true);

    if (result.kind === 'SUCCESS') {
      expect(result.providerKind).toBe('LOCAL_RULES');
      expect(result.routingMode).toBe('LOCAL_ONLY');
      expect(result.fallbackUsed).toBe(false);
    }
  });

  it('returns an error result when the context cannot be built', async () => {
    const brokenHoroscope = {} as Horoscope;

    const result = await runAiExplanation({
      horoscope: brokenHoroscope,
      task: 'CHART_SYNTHESIS'
    });

    expect(result.status).toBe('ERROR');
    if (result.status === 'ERROR') {
      expect(result.message).toBeTruthy();
    }
  });
});
