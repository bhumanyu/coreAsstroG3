import { describe, it, expect } from 'vitest';
import { calculateHoroscope } from '../../engine/astroEngine';
import { CANONICAL_BIRTH_DETAILS } from '../../test/fixtures/canonicalChart';
import { Planet } from '../../types';
import { AI_CONTEXT_SCHEMA_VERSION } from '../types/aiTypes';
import { buildAiContext } from './aiContextFactory';
import { createAiRequest } from '../api/createAiRequest';

describe('AI Context Factory', () => {
  const horoscope = calculateHoroscope(CANONICAL_BIRTH_DETAILS);
  const context = buildAiContext(horoscope);

  it('should include correct schema version and source engine metadata', () => {
    expect(context.schemaVersion).toBe(AI_CONTEXT_SCHEMA_VERSION);
    expect(context.schemaVersion).toBe('1.0.0');
    expect(context.source).toEqual({
      engine: 'CORE_ASTRO',
      deterministic: true,
      astrologySystem: 'VEDIC'
    });
  });

  it('should include canonical methodology configuration', () => {
    expect(context.methodology).toEqual({
      zodiac: 'SIDEREAL',
      ayanamsa: 'LAHIRI',
      houseSystem: 'WHOLE_SIGN',
      dashaSystem: 'VIMSHOTTARI',
      aspectSystem: 'PARASHARI'
    });
  });

  it('should project ascendant sign matching rasiChart.ascendantSign', () => {
    expect(context.ascendant.sign).toBe(horoscope.rasiChart.ascendantSign);
    expect(context.ascendant.lord).toBeDefined();
  });

  it('should project exactly 9 planets in standard Vedic sequence', () => {
    expect(context.planets).toHaveLength(9);
    expect(context.planets.map((p) => p.planet)).toEqual([
      Planet.SUN,
      Planet.MOON,
      Planet.MARS,
      Planet.MERCURY,
      Planet.JUPITER,
      Planet.VENUS,
      Planet.SATURN,
      Planet.RAHU,
      Planet.KETU
    ]);
  });

  it('should project exactly 12 house summaries', () => {
    expect(context.houses).toHaveLength(12);
    for (let h = 1; h <= 12; h++) {
      const houseFact = context.houses.find((hf) => hf.house === h);
      expect(houseFact).toBeDefined();
      expect(houseFact?.sign).toBeDefined();
      expect(houseFact?.lord).toBeDefined();
      expect(Array.isArray(houseFact?.occupants)).toBe(true);
      expect(Array.isArray(houseFact?.aspectingPlanets)).toBe(true);
    }
  });

  it('should project exactly 12 life theme facts', () => {
    expect(context.lifeThemes).toHaveLength(12);
    for (const theme of context.lifeThemes) {
      expect(typeof theme.theme).toBe('string');
      expect(['SUPPORT', 'CHALLENGE', 'NEUTRAL', 'MIXED']).toContain(theme.effect);
      expect(['HIGH', 'MEDIUM', 'LOW']).toContain(theme.confidence);
      expect(typeof theme.evidenceCount).toBe('number');
    }
  });

  it('should project career and wealth facts with valid status and factors', () => {
    expect(context.career).toBeDefined();
    expect(context.career?.status).toBeDefined();
    expect(['STRONGLY_SUPPORTED', 'SUPPORTED', 'MIXED', 'CHALLENGED', 'LIMITED_EVIDENCE']).toContain(
      context.career?.status
    );
    expect(['HIGH', 'MEDIUM', 'LOW']).toContain(context.career?.confidence);
    expect(Array.isArray(context.career?.supportingFactors)).toBe(true);
    expect(Array.isArray(context.career?.challengingFactors)).toBe(true);
    expect(['STRONG', 'SUPPORTED', 'MIXED', 'ADVERSE', 'UNAVAILABLE']).toContain(
      context.career?.natalPromise
    );
    expect(['CONFIRMS', 'PARTIALLY_CONFIRMS', 'MODIFIES', 'CONFLICTS', 'UNAVAILABLE']).toContain(
      context.career?.d10Relationship
    );

    expect(context.wealth).toBeDefined();
    expect(context.wealth?.status).toBeDefined();
    expect(['STRONGLY_SUPPORTED', 'SUPPORTED', 'MIXED', 'CHALLENGED', 'LIMITED_EVIDENCE']).toContain(
      context.wealth?.status
    );
    expect(['HIGH', 'MEDIUM', 'LOW']).toContain(context.wealth?.confidence);
    expect(Array.isArray(context.wealth?.supportingFactors)).toBe(true);
    expect(Array.isArray(context.wealth?.challengingFactors)).toBe(true);
    expect(context.wealth?.subthemes).toBeDefined();
    expect(context.wealth?.subthemes).toHaveLength(4);
    const subthemeNames = context.wealth?.subthemes?.map((st) => st.subtheme);
    expect(subthemeNames).toEqual(['ACCUMULATION', 'GAINS', 'FORTUNE', 'SPECULATION']);
    for (const subtheme of context.wealth?.subthemes || []) {
      expect(['ACCUMULATION', 'GAINS', 'FORTUNE', 'SPECULATION']).toContain(subtheme.subtheme);
      expect(typeof subtheme.house).toBe('number');
      expect(['STRONGLY_SUPPORTED', 'SUPPORTED', 'MIXED', 'CHALLENGED', 'LIMITED_EVIDENCE']).toContain(
        subtheme.status
      );
      expect(typeof subtheme.primaryFamily).toBe('string');
      expect(typeof subtheme.supportingCount).toBe('number');
      expect(typeof subtheme.challengingCount).toBe('number');
      expect(typeof subtheme.summary).toBe('string');
    }
  });

  it('should project divisional facts for D9 and D10', () => {
    expect(context.divisional.d9).toBeDefined();
    expect(context.divisional.d9.status).toBe('AVAILABLE');
    expect(context.divisional.d10).toBeDefined();
    expect(context.divisional.d10.status).toBe('AVAILABLE');
    expect(context.divisional.d2).toBeUndefined();
  });

  it('should project vimshottari dasha facts with periods', () => {
    expect(context.dasha.system).toBe('VIMSHOTTARI');
    expect(context.dasha.periods.length).toBeGreaterThan(0);
    if (context.dasha.active) {
      expect(context.dasha.active.mahadasha).toBeDefined();
    }
  });

  it('should be a pure, deterministic factory producing equal output for identical input', () => {
    const context2 = buildAiContext(horoscope);
    expect(context).toEqual(context2);
  });

  it('should create an immutable AI request with createAiRequest helper', () => {
    const customId = 'test-request-123';
    const request = createAiRequest('CAREER_ANALYSIS', context, 'STRUCTURED', customId);

    expect(request.requestId).toBe(customId);
    expect(request.schemaVersion).toBe('1.0.0');
    expect(request.task).toBe('CAREER_ANALYSIS');
    expect(request.context).toBe(context);
    expect(request.responseFormat).toBe('STRUCTURED');
    expect(Object.isFrozen(request)).toBe(true);
  });
});
