import { describe, it, expect } from 'vitest';
import { calculateHoroscope } from '../../engine/astroEngine';
import { CANONICAL_BIRTH_DETAILS } from '../../test/fixtures/canonicalChart';
import { createAnalysisContext } from './analysisContextFactory';
import { resolveAnalysisTemporalState } from './resolveAnalysisTemporalState';
import { Planet } from '../../types';

describe('resolveAnalysisTemporalState Unit Test Suite', () => {
  const testMethodology = {
    zodiacSystem: 'SIDEREAL' as const,
    houseSystem: 'WHOLE_SIGN' as const,
    ayanamsa: 'LAHIRI' as const,
    calculationEngine: 'ASTRO_CORE_V1' as const,
    rulesEngine: 'PARASHARA_CLASSICAL_RULES_V2' as const,
    vargaRules: 'PARASHARA_D10_D2' as const,
    dashaSystem: 'VIMSHOTTARI' as const
  };

  it('resolves temporal state where state.asOf === context.asOf and canonical asOf 2024-06-15 yields JUPITER MD', () => {
    const asOf = '2024-06-15T00:00:00.000Z';
    const context = createAnalysisContext({ asOf, methodology: testMethodology });
    const horoscope = calculateHoroscope(CANONICAL_BIRTH_DETAILS, undefined, asOf);

    const state = resolveAnalysisTemporalState(horoscope, context);

    expect(state.asOf).toBe(context.asOf);
    expect(state.asOf).toBe(asOf);
    expect(state.dashaInterpretation?.current?.mahadasha.planet).toBe(Planet.JUPITER);
  });

  it('guarantees immutability: Object.isFrozen(state) and Object.isFrozen(state.dashaInterpretation)', () => {
    const asOf = '2024-06-15T00:00:00.000Z';
    const context = createAnalysisContext({ asOf, methodology: testMethodology });
    const horoscope = calculateHoroscope(CANONICAL_BIRTH_DETAILS, undefined, asOf);

    const state = resolveAnalysisTemporalState(horoscope, context);

    expect(Object.isFrozen(state)).toBe(true);
    expect(state.dashaInterpretation).toBeDefined();
    expect(Object.isFrozen(state.dashaInterpretation)).toBe(true);
  });

  it('preserves horoscope non-mutation and returns recomputed report when asOf differs from embedded', () => {
    const embeddedAsOf = '1990-01-01T00:00:00.000Z';
    const horoscope = calculateHoroscope(CANONICAL_BIRTH_DETAILS, undefined, embeddedAsOf);
    const initialHoroscopeDasha = horoscope.dashaInterpretation;

    const queryAsOf = '2024-06-15T00:00:00.000Z';
    const context = createAnalysisContext({ asOf: queryAsOf, methodology: testMethodology });

    const state = resolveAnalysisTemporalState(horoscope, context);

    // Horoscope reference remains pristine and unmutated
    expect(horoscope.dashaInterpretation).toBe(initialHoroscopeDasha);
    // Explicit query asOf recomputed a distinct dasha report
    expect(state.dashaInterpretation).not.toBe(horoscope.dashaInterpretation);
    expect(state.dashaInterpretation?.current?.mahadasha.planet).toBe(Planet.JUPITER);
  });

  it('resolves distinct temporal current MD across distinct asOf dates T1 and T2', () => {
    const asOfT1 = '2000-01-01T00:00:00.000Z';
    const asOfT2 = '2024-06-15T00:00:00.000Z';
    const contextT1 = createAnalysisContext({ asOf: asOfT1, methodology: testMethodology });
    const contextT2 = createAnalysisContext({ asOf: asOfT2, methodology: testMethodology });
    const horoscope = calculateHoroscope(CANONICAL_BIRTH_DETAILS);

    const state1 = resolveAnalysisTemporalState(horoscope, contextT1);
    const state2 = resolveAnalysisTemporalState(horoscope, contextT2);

    expect(state1.asOf).toBe(asOfT1);
    expect(state2.asOf).toBe(asOfT2);
    expect(state1.dashaInterpretation?.current?.mahadasha.planet).toBe(Planet.MARS);
    expect(state2.dashaInterpretation?.current?.mahadasha.planet).toBe(Planet.JUPITER);
    expect(state1.dashaInterpretation?.current?.mahadasha.planet).not.toBe(
      state2.dashaInterpretation?.current?.mahadasha.planet
    );
  });
});
