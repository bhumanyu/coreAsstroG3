import { describe, it, expect } from 'vitest';
import { Planet, Sign, AyanamsaType, type Horoscope } from '../../../types';
import { synthesizeWealthTiming } from './wealthTransitSynthesis';
import { resolveWealthDimensionTransitEffect } from './wealthTransitRules';
import {
  WEALTH_DIMENSION_HOUSES,
  WEALTH_HOUSES,
  WEALTH_DIMENSION_KARAKAS
} from '../../wealth/wealthTypes';
import { mapWealthDimension } from '../../wealth/wealthEvidenceMapper';
import { WealthEvidenceFamily } from '../../../engine/themeInterpretation/wealthThemeInterpretationTypes';
import { createMockActiveDashaState } from './__testUtils__/mockDasha';

describe('CW-03 Wealth Timing Synthesis & Dimension Isolation', () => {
  const mockHoroscope: Horoscope = {
    birthDetails: {
      dateTimeStr: '1990-05-15T10:30:00Z',
      latitude: 28.6139,
      longitude: 77.2090,
      timeZone: 'UTC',
      ayanamsa: AyanamsaType.LAHIRI
    },
    planetFacts: {
      [Planet.SUN]: { longitude: 45.0, position: { eclipticLongitude: 45.0, longitude: 45.0 }, sign: Sign.TAURUS, house: 11 } as any,
      [Planet.MOON]: { longitude: 120.0, position: { eclipticLongitude: 120.0, longitude: 120.0 }, sign: Sign.LEO, house: 2 } as any,
      [Planet.MARS]: { longitude: 280.0, position: { eclipticLongitude: 280.0, longitude: 280.0 }, sign: Sign.CAPRICORN, house: 7 } as any,
      [Planet.MERCURY]: { longitude: 50.0, position: { eclipticLongitude: 50.0, longitude: 50.0 }, sign: Sign.TAURUS, house: 11 } as any,
      [Planet.JUPITER]: { longitude: 90.0, position: { eclipticLongitude: 90.0, longitude: 90.0 }, sign: Sign.CANCER, house: 1 } as any,
      [Planet.VENUS]: { longitude: 15.0, position: { eclipticLongitude: 15.0, longitude: 15.0 }, sign: Sign.ARIES, house: 10 } as any,
      [Planet.SATURN]: { longitude: 300.0, position: { eclipticLongitude: 300.0, longitude: 300.0 }, sign: Sign.AQUARIUS, house: 8 } as any,
      [Planet.RAHU]: { longitude: 180.0, position: { eclipticLongitude: 180.0, longitude: 180.0 }, sign: Sign.LIBRA, house: 4 } as any,
      [Planet.KETU]: { longitude: 0.0, position: { eclipticLongitude: 0.0, longitude: 0.0 }, sign: Sign.ARIES, house: 10 } as any
    },
    ascendant: {
      longitude: 105.0,
      signLongitude: 15.0,
      sign: Sign.CANCER
    },
    houseLordship: {
      houseLords: {
        1: Planet.MOON,
        2: Planet.SUN,
        3: Planet.MERCURY,
        4: Planet.VENUS,
        5: Planet.MARS,
        6: Planet.JUPITER,
        7: Planet.SATURN,
        8: Planet.SATURN,
        9: Planet.JUPITER,
        10: Planet.MARS,
        11: Planet.VENUS,
        12: Planet.MERCURY
      }
    } as any,
    fullNatalAnalysis: {} as any
  };

  it('synthesizes wealth timing independently across 4 dimensions with UNDETERMINED promise when not provided', () => {
    const asOf = new Date('2026-06-01T00:00:00Z');
    const result = synthesizeWealthTiming(mockHoroscope, null, asOf);

    expect(result).toBeDefined();
    expect(result.dimensions.ACCUMULATION).toBeDefined();
    expect(result.dimensions.GAINS).toBeDefined();
    expect(result.dimensions.FORTUNE).toBeDefined();
    expect(result.dimensions.SPECULATION).toBeDefined();

    // Without provided natal promises, defaults to UNDETERMINED and INSUFFICIENT_DATA (no MODERATE fallback)
    expect(result.dimensions.ACCUMULATION.natalPromise).toBe('UNDETERMINED');
    expect(result.dimensions.ACCUMULATION.overallEffect).toBe('INSUFFICIENT_DATA');
  });

  it('populates explicit transitingPlanet field on WealthTransitFactor items', () => {
    const asOf = new Date('2026-06-01T00:00:00Z');
    const result = synthesizeWealthTiming(mockHoroscope, null, asOf);

    for (const dim of ['ACCUMULATION', 'GAINS', 'FORTUNE', 'SPECULATION'] as const) {
      const factors = result.dimensions[dim].factors;
      for (const f of factors) {
        expect(f.transitingPlanet).toBeDefined();
        expect(f.transitingPlanet).toBe(f.planet);
      }
    }
  });

  it('enforces natal promise ceiling across dimensions in synthesizeWealthTiming', () => {
    const asOf = new Date('2026-06-01T00:00:00Z');
    const natalPromises = {
      ACCUMULATION: 'STRONG' as const,
      GAINS: 'MODERATE' as const,
      FORTUNE: 'MODERATE' as const,
      SPECULATION: 'WEAK' as const
    };
    const dashaEffects = {
      ACCUMULATION: 'SUPPORTS' as const,
      GAINS: 'SUPPORTS' as const,
      FORTUNE: 'SUPPORTS' as const,
      SPECULATION: 'SUPPORTS' as const
    };

    const result = synthesizeWealthTiming(mockHoroscope, null, asOf, natalPromises, dashaEffects);

    // Speculation must yield DOES_NOT_ACTIVATE due to WEAK natal promise ceiling despite supportive Dasha/transit
    expect(result.dimensions.SPECULATION.overallEffect).toBe('DOES_NOT_ACTIVATE');
    expect(result.dimensions.SPECULATION.natalPromise).toBe('WEAK');

    // Accumulation with STRONG promise should activate
    expect(['ACTIVATES', 'PARTIALLY_ACTIVATES']).toContain(result.dimensions.ACCUMULATION.overallEffect);
  });

  it('keeps speculation strictly isolated from accumulation and gains', () => {
    // Accumulation: Strong promise, supportive dasha, supportive transit -> ACTIVATES
    const accumEffect = resolveWealthDimensionTransitEffect('STRONG', 'SUPPORTS', {
      transitEffect: 'SUPPORTS'
    });

    // Speculation: Weak promise, supportive dasha, supportive transit -> DOES_NOT_ACTIVATE (Natal ceiling)
    const specEffect = resolveWealthDimensionTransitEffect('WEAK', 'SUPPORTS', {
      transitEffect: 'SUPPORTS'
    });

    expect(accumEffect).toBe('ACTIVATES');
    expect(specEffect).toBe('DOES_NOT_ACTIVATE');
    expect(accumEffect).not.toEqual(specEffect);
  });

  it('produces DASHA_LORD_TRANSIT factors for Wealth with concrete dashaPlanet, transitingPlanet, and targetPlanet', () => {
    const asOf = new Date('2026-06-01T00:00:00Z');
    const activeDasha = createMockActiveDashaState({
      mdPlanet: Planet.SUN,
      adPlanet: Planet.JUPITER
    });

    const result = synthesizeWealthTiming(mockHoroscope, activeDasha, asOf);
    const allFactors = Object.values(result.dimensions).flatMap((d) => d.factors);
    const dashaFactors = allFactors.filter((f) => f.category === 'DASHA_LORD_TRANSIT');

    expect(dashaFactors.length).toBeGreaterThan(0);
    for (const df of dashaFactors) {
      expect(df.dashaPlanet).toBeDefined();
      expect(df.transitingPlanet).toBeDefined();
      expect(df.planet).toBe(df.dashaPlanet);
    }

    const sunOverNatalFactor = dashaFactors.find((df) => df.dashaPlanet === Planet.SUN && df.targetPlanet !== undefined);
    expect(sunOverNatalFactor).toBeDefined();
    expect(sunOverNatalFactor!.dashaPlanet).toBe(Planet.SUN);
    expect(sunOverNatalFactor!.transitingPlanet).toBe(Planet.SUN);
    expect([Planet.SUN, Planet.MERCURY]).toContain(sunOverNatalFactor!.targetPlanet);
  });

  it('strictly satisfies the planet invariant across all wealth factor categories', () => {
    const asOf = new Date('2026-06-01T00:00:00Z');
    const activeDasha = createMockActiveDashaState({
      mdPlanet: Planet.SUN,
      adPlanet: Planet.JUPITER
    });

    const result = synthesizeWealthTiming(mockHoroscope, activeDasha, asOf);
    const allFactors = Object.values(result.dimensions).flatMap((d) => d.factors);
    expect(allFactors.length).toBeGreaterThan(0);

    for (const factor of allFactors) {
      if (['WEALTH_HOUSE_TRANSIT', 'WEALTH_LORD_TRANSIT', 'WEALTH_KARAKA_TRANSIT'].includes(factor.category)) {
        expect(factor.transitingPlanet).toBeDefined();
        expect(factor.planet).toBe(factor.transitingPlanet);
      } else if (factor.category === 'DASHA_LORD_TRANSIT') {
        expect(factor.dashaPlanet).toBeDefined();
        expect(factor.planet).toBe(factor.dashaPlanet);
      }
    }
  });

  it('aligns canonical WEALTH_DIMENSION_HOUSES and WEALTH_DIMENSION_KARAKAS across modules', () => {
    expect(WEALTH_DIMENSION_HOUSES.ACCUMULATION).toBe(2);
    expect(WEALTH_DIMENSION_HOUSES.GAINS).toBe(11);
    expect(WEALTH_DIMENSION_HOUSES.FORTUNE).toBe(9);
    expect(WEALTH_DIMENSION_HOUSES.SPECULATION).toBe(5);

    expect(WEALTH_HOUSES).toEqual([2, 11, 9, 5]);

    expect(WEALTH_DIMENSION_KARAKAS.ACCUMULATION).toContain(Planet.JUPITER);
    expect(WEALTH_DIMENSION_KARAKAS.ACCUMULATION).toContain(Planet.VENUS);
    expect(WEALTH_DIMENSION_KARAKAS.GAINS).toContain(Planet.JUPITER);
    expect(WEALTH_DIMENSION_KARAKAS.FORTUNE).toContain(Planet.JUPITER);
    expect(WEALTH_DIMENSION_KARAKAS.SPECULATION).toContain(Planet.VENUS);
    expect(WEALTH_DIMENSION_KARAKAS.SPECULATION).toContain(Planet.MERCURY);

    // Verify mapWealthDimension corresponds to canonical houses
    const dummyHouse2: any = { evidenceFamily: WealthEvidenceFamily.SECOND_HOUSE };
    const dummyHouse11: any = { evidenceFamily: WealthEvidenceFamily.ELEVENTH_HOUSE };
    const dummyHouse9: any = { evidenceFamily: WealthEvidenceFamily.NINTH_HOUSE };
    const dummyHouse5: any = { evidenceFamily: WealthEvidenceFamily.FIFTH_HOUSE };

    expect(mapWealthDimension(dummyHouse2)).toBe('ACCUMULATION');
    expect(mapWealthDimension(dummyHouse11)).toBe('GAINS');
    expect(mapWealthDimension(dummyHouse9)).toBe('FORTUNE');
    expect(mapWealthDimension(dummyHouse5)).toBe('SPECULATION');
  });
});
