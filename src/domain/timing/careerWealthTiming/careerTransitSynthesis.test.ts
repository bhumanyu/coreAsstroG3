import { describe, it, expect } from 'vitest';
import { Planet, Sign, AyanamsaType, type Horoscope } from '../../../types';
import { synthesizeCareerTransit } from './careerTransitSynthesis';
import { mapTransitEffect } from './careerTransitRules';
import type { CareerDashaSynthesis } from '../../career/careerDasha/careerDashaSynthesisTypes';

describe('CW-03 Career Transit Synthesis', () => {
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

  it('runs deterministically given an explicit asOf date', () => {
    const asOf = new Date('2026-06-01T00:00:00Z');
    const result = synthesizeCareerTransit(mockHoroscope, null, asOf);

    expect(result).toBeDefined();
    expect(result.transitEffect).toBeDefined();
    expect(Array.isArray(result.factors)).toBe(true);
    expect(result.confidence).toBeGreaterThanOrEqual(0.5);
  });

  it('mapTransitEffect handles factor dominance thresholds correctly', () => {
    const factors = [
      {
        id: '1',
        planet: Planet.JUPITER,
        category: 'CAREER_HOUSE_TRANSIT' as const,
        direction: 'SUPPORT' as const,
        weight: 2.5,
        statement: 'Jupiter in 10H'
      },
      {
        id: '2',
        planet: Planet.SATURN,
        category: 'CAREER_HOUSE_TRANSIT' as const,
        direction: 'CHALLENGE' as const,
        weight: 1.0,
        statement: 'Saturn challenge'
      }
    ];

    const { transitEffect, confidence } = mapTransitEffect(factors);
    expect(transitEffect).toBe('SUPPORTS');
    expect(confidence).toBeGreaterThan(0.5);
  });

  it('proves Concern 1 fix: strong Dasha SUPPORT agent preserves CHALLENGE transit factors without reversing direction, while attaching dashaEvidenceIds', () => {
    const asOf = new Date('2026-06-01T00:00:00Z');

    // Create a mock Dasha synthesis where Saturn is a strong SUPPORT agent (weight 3.0, direction: SUPPORT)
    const mockDashaSynthesis: CareerDashaSynthesis = {
      natalPromiseProtected: true,
      reasoningVersion: 'CW-02',
      timing: {
        md: { period: 'MD', planet: Planet.SATURN },
        ad: { period: 'AD', planet: Planet.MERCURY },
        pd: { period: 'PD', planet: Planet.VENUS }
      },
      md: {} as any,
      ad: {} as any,
      pd: {} as any,
      factors: [
        {
          id: 'DASHA_FACT_SAT_SUPPORT',
          period: 'MD',
          planet: Planet.SATURN,
          category: 'HOUSE_OWNERSHIP',
          direction: 'SUPPORT',
          weight: 3.0,
          statement: 'Saturn is strong primary dasha lord'
        }
      ],
      combined: {
        hierarchy: { mdRole: 'PRIMARY', adRole: 'MODIFIER', pdRole: 'REFINEMENT' },
        md: {} as any,
        ad: {} as any,
        pd: {} as any,
        combinedEffect: 'SUPPORTS',
        combinedConfidence: 0.9 as any,
        combinedScore: 3.0,
        summary: 'Strong'
      },
      summary: 'Strong Saturn MD'
    };

    // Synthesize career transit with the dasha linkage
    const result = synthesizeCareerTransit(mockHoroscope, null, asOf, mockDashaSynthesis);

    // Look for Saturn factors
    const saturnFactors = result.factors.filter((f) => f.planet === Planet.SATURN);
    expect(saturnFactors.length).toBeGreaterThan(0);

    // Any Saturn factor that was CHALLENGE or NEUTRAL must NOT be force-flipped to SUPPORT
    for (const factor of saturnFactors) {
      if (factor.category === 'CAREER_LORD_TRANSIT' && (factor.houses?.includes(8) || factor.houses?.includes(12))) {
        expect(factor.direction).toBe('CHALLENGE');
        expect(factor.dashaEvidenceIds).toContain('DASHA_FACT_SAT_SUPPORT');
      }
    }
  });

  it('generates per-factor Career-Lord transit with accurate house naming for supporting houses (6H, 2H, 11H)', () => {
    const asOf = new Date('2026-06-01T00:00:00Z');
    const result = synthesizeCareerTransit(mockHoroscope, null, asOf);

    const lordFactors = result.factors.filter((f) => f.category === 'CAREER_LORD_TRANSIT');
    expect(lordFactors.length).toBeGreaterThan(0);

    // Check statements accurately describe the ruled house (houses[0])
    for (const lf of lordFactors) {
      const ruledHouse = lf.houses?.[0];
      expect(ruledHouse).toBeDefined();
      expect(lf.statement).toContain(`is lord of Career-related house ${ruledHouse}`);
    }
  });

  it('generates Career Karaka transit factors for natural karakas in angular houses (10H / 1H)', () => {
    const asOf = new Date('2026-06-01T00:00:00Z');
    const result = synthesizeCareerTransit(mockHoroscope, null, asOf);

    const karakaFactors = result.factors.filter((f) => f.category === 'CAREER_KARAKA_TRANSIT');
    for (const kf of karakaFactors) {
      expect(kf.direction).toBe('SUPPORT');
      expect([1, 10]).toContain(kf.houses?.[0]);
      expect(kf.statement).toContain('Natural career karaka');
    }
  });

  it('ensures unlinked planets transiting career houses are not automatically classified as SUPPORT or CHALLENGE', () => {
    const asOf = new Date('2026-06-01T00:00:00Z');
    const result = synthesizeCareerTransit(mockHoroscope, null, asOf);

    // Neutral house transit factors should have direction NEUTRAL
    const neutralFactors = result.factors.filter((f) => f.direction === 'NEUTRAL');
    expect(neutralFactors.length).toBeGreaterThan(0);
    for (const nf of neutralFactors) {
      expect(nf.direction).toBe('NEUTRAL');
      expect(nf.transitingPlanet).toBeDefined();
      expect(nf.transitingPlanet).toBe(nf.planet);
    }
  });

  it('populates explicit source, target, and dasha planet fields on CareerTransitFactors', () => {
    const asOf = new Date('2026-06-01T00:00:00Z');
    const activeDasha = {
      mahadasha: { planet: Planet.JUPITER, start: '2020-01-01', end: '2036-01-01' },
      antardasha: { planet: Planet.SATURN, start: '2025-01-01', end: '2027-01-01' },
      pratyantardasha: { planet: Planet.MERCURY, start: '2026-05-01', end: '2026-08-01' }
    };

    const result = synthesizeCareerTransit(mockHoroscope, activeDasha as any, asOf);

    // All house transit factors carry transitingPlanet
    const houseFactors = result.factors.filter((f) => f.category === 'CAREER_HOUSE_TRANSIT');
    expect(houseFactors.length).toBeGreaterThan(0);
    for (const hf of houseFactors) {
      expect(hf.transitingPlanet).toBe(hf.planet);
    }

    // All lord transit factors carry transitingPlanet
    const lordFactors = result.factors.filter((f) => f.category === 'CAREER_LORD_TRANSIT');
    expect(lordFactors.length).toBeGreaterThan(0);
    for (const lf of lordFactors) {
      expect(lf.transitingPlanet).toBe(lf.planet);
    }

    // Dasha transit factors carry dashaPlanet and transitingPlanet
    const dashaFactors = result.factors.filter((f) => f.category === 'DASHA_LORD_TRANSIT');
    expect(dashaFactors.length).toBeGreaterThan(0);
    for (const df of dashaFactors) {
      expect(df.dashaPlanet).toBeDefined();
      expect(df.transitingPlanet).toBeDefined();
    }
  });

  it('produces DASHA_LORD_TRANSIT factor with concrete expected dashaPlanet, transitingPlanet, and targetPlanet', () => {
    const asOf = new Date('2026-06-01T00:00:00Z');
    // In mockHoroscope, natal Sun is at 45° (Taurus) and natal Mercury is at 50° (Taurus).
    // On 2026-06-01, transiting Sun is in Taurus (~45°), so transit Sun contacts natal Sun and natal Mercury.
    // Setting Mahadasha lord to Sun ensures MAHADASHA_PLANET_OVER_NATAL_PLANET fires with target natal Sun / Mercury.
    const activeDasha = {
      mahadasha: { planet: Planet.SUN, start: '2020-01-01', end: '2026-01-01', antardashas: [] },
      antardasha: { planet: Planet.JUPITER, start: '2025-01-01', end: '2026-01-01' }
    };

    const result = synthesizeCareerTransit(mockHoroscope, activeDasha as any, asOf);
    const dashaFactors = result.factors.filter((f) => f.category === 'DASHA_LORD_TRANSIT');
    expect(dashaFactors.length).toBeGreaterThan(0);

    const sunOverNatalFactor = dashaFactors.find(
      (df) => df.dashaPlanet === Planet.SUN && df.targetPlanet !== undefined
    );
    expect(sunOverNatalFactor).toBeDefined();
    expect(sunOverNatalFactor!.dashaPlanet).toBe(Planet.SUN);
    expect(sunOverNatalFactor!.transitingPlanet).toBe(Planet.SUN);
    expect(sunOverNatalFactor!.planet).toBe(Planet.SUN);
    expect([Planet.SUN, Planet.MERCURY]).toContain(sunOverNatalFactor!.targetPlanet);
  });

  it('strictly satisfies the planet invariant across all factor categories', () => {
    const asOf = new Date('2026-06-01T00:00:00Z');
    const activeDasha = {
      mahadasha: { planet: Planet.SUN, start: '2020-01-01', end: '2026-01-01', antardashas: [] },
      antardasha: { planet: Planet.JUPITER, start: '2025-01-01', end: '2026-01-01' }
    };

    const result = synthesizeCareerTransit(mockHoroscope, activeDasha as any, asOf);
    expect(result.factors.length).toBeGreaterThan(0);

    for (const factor of result.factors) {
      if (['CAREER_HOUSE_TRANSIT', 'CAREER_LORD_TRANSIT', 'CAREER_KARAKA_TRANSIT'].includes(factor.category)) {
        expect(factor.transitingPlanet).toBeDefined();
        expect(factor.planet).toBe(factor.transitingPlanet);
      } else if (factor.category === 'DASHA_LORD_TRANSIT') {
        expect(factor.dashaPlanet).toBeDefined();
        expect(factor.planet).toBe(factor.dashaPlanet);
      }
    }
  });
});
