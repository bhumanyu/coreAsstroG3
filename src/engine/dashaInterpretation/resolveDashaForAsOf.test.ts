import { describe, expect, it } from 'vitest';
import { Planet, type Horoscope } from '../../types';
import { calculateHoroscope } from '../astroEngine';
import { CANONICAL_BIRTH_DETAILS } from '../../test/fixtures/canonicalChart';
import { resolveDashaInterpretationForAsOf } from './resolveDashaForAsOf';

describe('resolveDashaInterpretationForAsOf', () => {
  const canonicalHoroscope = calculateHoroscope(CANONICAL_BIRTH_DETAILS);

  it('recomputes for explicit valid asOfDate rather than returning embedded dashaInterpretation.current', () => {
    // Generate a valid historical ActiveDashaInterpretation for 1990 (canonical chart Moon Mahadasha)
    const staleCurrent = resolveDashaInterpretationForAsOf(
      canonicalHoroscope,
      new Date('1990-01-01T00:00:00.000Z')
    )?.current;
    expect(staleCurrent).toBeDefined();
    expect(staleCurrent?.mahadasha.planet).toBe(Planet.MOON);

    const horoscopeWithStaleDasha: Horoscope = {
      ...canonicalHoroscope,
      dashaInterpretation: canonicalHoroscope.dashaInterpretation ? {
        ...canonicalHoroscope.dashaInterpretation,
        current: staleCurrent,
        activePeriods: staleCurrent
      } : undefined
    };

    // Date in 2024 (where Canonical Chart Vimshottari Mahadasha is JUPITER)
    const asOf2024 = new Date('2024-06-15T00:00:00.000Z');
    const result2024 = resolveDashaInterpretationForAsOf(horoscopeWithStaleDasha, asOf2024);

    expect(result2024).toBeDefined();
    // Must NOT return the embedded MOON period
    expect(result2024?.current?.mahadasha.planet).not.toBe(Planet.MOON);
    // Must recompute to JUPITER for the 2024 asOfDate
    expect(result2024?.current?.mahadasha.planet).toBe(Planet.JUPITER);
    expect(result2024?.activePeriods?.mahadasha.planet).toBe(Planet.JUPITER);

    // Date in 2000 (where Canonical Chart Vimshottari Mahadasha is MARS)
    const asOf2000 = new Date('2000-01-01T00:00:00.000Z');
    const result2000 = resolveDashaInterpretationForAsOf(horoscopeWithStaleDasha, asOf2000);

    expect(result2000).toBeDefined();
    expect(result2000?.current?.mahadasha.planet).not.toBe(Planet.MOON);
    expect(result2000?.current?.mahadasha.planet).toBe(Planet.MARS);
    expect(result2000?.activePeriods?.mahadasha.planet).toBe(Planet.MARS);
  });

  it('returns embedded horoscope.dashaInterpretation unchanged when no asOfDate is provided', () => {
    const embeddedReport = canonicalHoroscope.dashaInterpretation;
    expect(embeddedReport).toBeDefined();

    // undefined asOfDate
    const resultUndefined = resolveDashaInterpretationForAsOf(canonicalHoroscope, undefined);
    expect(resultUndefined).toBe(embeddedReport);

    // omitted asOfDate
    const resultOmitted = resolveDashaInterpretationForAsOf(canonicalHoroscope);
    expect(resultOmitted).toBe(embeddedReport);
  });

  it('returns embedded horoscope.dashaInterpretation unchanged when asOfDate is invalid', () => {
    const embeddedReport = canonicalHoroscope.dashaInterpretation;
    const invalidDate = new Date('not-a-date');
    expect(isNaN(invalidDate.getTime())).toBe(true);

    const resultInvalid = resolveDashaInterpretationForAsOf(canonicalHoroscope, invalidDate);
    expect(resultInvalid).toBe(embeddedReport);
  });

  it('returns undefined (unavailable) instead of stale embedded report when recompute fails for explicit asOfDate', () => {
    // Horoscope with embedded dashaInterpretation, but missing vimshottari (causes recompute failure)
    const brokenHoroscope: Horoscope = {
      ...canonicalHoroscope,
      vimshottari: undefined,
      dashaInterpretation: canonicalHoroscope.dashaInterpretation
    };

    const explicitDate = new Date('2024-06-15T00:00:00.000Z');
    const result = resolveDashaInterpretationForAsOf(brokenHoroscope, explicitDate);

    // Must return undefined (unavailable), NOT fall back to brokenHoroscope.dashaInterpretation
    expect(result).toBeUndefined();
  });

  it('preserves undefined for missing natalGrahaDrishti rather than synthesizing empty aspects', () => {
    const horoscopeWithoutDrishti: Horoscope = {
      ...canonicalHoroscope,
      natalGrahaDrishti: undefined
    };

    const asOf = new Date('2024-06-15T00:00:00.000Z');
    const result = resolveDashaInterpretationForAsOf(horoscopeWithoutDrishti, asOf);

    expect(result).toBeDefined();
    expect(result?.current?.mahadasha.planet).toBe(Planet.JUPITER);
  });
});
