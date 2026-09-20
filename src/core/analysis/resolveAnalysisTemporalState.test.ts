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

  it('throws canonical error when context has empty string or invalid asOf date', () => {
    const horoscope = calculateHoroscope(CANONICAL_BIRTH_DETAILS);

    const emptyContext = createAnalysisContext({ asOf: '', methodology: testMethodology });
    expect(() => resolveAnalysisTemporalState(horoscope, emptyContext)).toThrow(
      /\[AnalysisTemporalState\] Invalid asOf timestamp: ""/
    );

    const invalidContext = createAnalysisContext({ asOf: 'not-a-valid-date', methodology: testMethodology });
    expect(() => resolveAnalysisTemporalState(horoscope, invalidContext)).toThrow(
      /\[AnalysisTemporalState\] Invalid asOf timestamp: "not-a-valid-date"/
    );
  });

  it('succeeds and produces a valid ISO string when context asOf is undefined', () => {
    const context = createAnalysisContext({ methodology: testMethodology });
    const horoscope = calculateHoroscope(CANONICAL_BIRTH_DETAILS);

    const state = resolveAnalysisTemporalState(horoscope, context);

    expect(state.asOf).toBeDefined();
    expect(typeof state.asOf).toBe('string');
    expect(new Date(state.asOf).toISOString()).toBe(state.asOf);
    expect(Object.isFrozen(state)).toBe(true);
    if (state.dashaInterpretation) {
      expect(Object.isFrozen(state.dashaInterpretation)).toBe(true);
    }
  });

  it('regression: canonical temporalState reflects asOf-resolved planet, not stale embedded state', () => {
    // Build horoscope with embedded dasha interpretation at a different asOf
    const embeddedAsOf = '1990-01-01T00:00:00.000Z';
    const horoscope = calculateHoroscope(CANONICAL_BIRTH_DETAILS, undefined, embeddedAsOf);
    const initialEmbeddedDasha = horoscope.dashaInterpretation?.current?.mahadasha.planet;

    // Resolve with a context asOf that lands on a different real Vimshottari period
    const queryAsOf = '2024-06-15T00:00:00.000Z';
    const context = createAnalysisContext({ asOf: queryAsOf, methodology: testMethodology });
    const temporalState = resolveAnalysisTemporalState(horoscope, context);

    // Canonical temporalState reflects the asOf-resolved planet (JUPITER)
    expect(temporalState.dashaInterpretation?.current?.mahadasha.planet).toBe(Planet.JUPITER);

    // Embedded horoscope.dashaInterpretation remains unchanged (stale ≠ canonical)
    expect(horoscope.dashaInterpretation?.current?.mahadasha.planet).toBe(initialEmbeddedDasha);

    // Prove no horoscope mutation via toBe/equalTo snapshot
    expect(horoscope.dashaInterpretation).toBeDefined();
    expect(temporalState.dashaInterpretation).not.toBe(horoscope.dashaInterpretation);
  });

  it('regression: when resolution cannot produce active dasha, temporalState.dashaInterpretation stays undefined (no fallback to embedded)', () => {
    // Build horoscope with embedded dasha interpretation
    const embeddedAsOf = '1990-01-01T00:00:00.000Z';
    const horoscope = calculateHoroscope(CANONICAL_BIRTH_DETAILS, undefined, embeddedAsOf);
    const initialEmbeddedDasha = horoscope.dashaInterpretation;

    // Resolve with an asOf far outside the Vimshottari timeline (cannot produce active dasha)
    const futureAsOf = '2200-01-01T00:00:00.000Z';
    const context = createAnalysisContext({ asOf: futureAsOf, methodology: testMethodology });
    const temporalState = resolveAnalysisTemporalState(horoscope, context);

    // temporalState.dashaInterpretation stays undefined when resolution fails
    expect(temporalState.dashaInterpretation).toBeUndefined();

    // No fallback to embedded state - horoscope remains unchanged
    expect(horoscope.dashaInterpretation).toBe(initialEmbeddedDasha);
  });

  it('regression: two contexts whose asOf values cross a genuine Dasha boundary yield different current', () => {
    const horoscope = calculateHoroscope(CANONICAL_BIRTH_DETAILS);

    // Choose asOf dates that cross a genuine Dasha boundary
    // Based on the canonical chart, MARS MD ends around 2007, JUPITER MD starts
    const asOfT1 = '2000-01-01T00:00:00.000Z'; // During MARS MD
    const asOfT2 = '2024-06-15T00:00:00.000Z'; // During JUPITER MD

    const contextT1 = createAnalysisContext({ asOf: asOfT1, methodology: testMethodology });
    const contextT2 = createAnalysisContext({ asOf: asOfT2, methodology: testMethodology });

    const state1 = resolveAnalysisTemporalState(horoscope, contextT1);
    const state2 = resolveAnalysisTemporalState(horoscope, contextT2);

    // Different asOf dates crossing a boundary yield different current planets
    expect(state1.dashaInterpretation?.current?.mahadasha.planet).toBe(Planet.MARS);
    expect(state2.dashaInterpretation?.current?.mahadasha.planet).toBe(Planet.JUPITER);
    expect(state1.dashaInterpretation?.current?.mahadasha.planet).not.toBe(
      state2.dashaInterpretation?.current?.mahadasha.planet
    );
  });
});
