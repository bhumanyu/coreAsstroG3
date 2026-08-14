import { describe, it, expect } from 'vitest';
import { calculateTransit } from './transitEngine';
import { analyzeTransits } from './transitAnalysis';
import { correlateDashaAndTransit } from './dashaTransitCorrelation';
import {
  correlateThemes,
  extractNatalThemeEvidence,
  ThemeType,
  NatalThemeEvidence
} from './themeCorrelation';
import { Planet, Sign, AspectType, TransitCondition } from '../types';

describe('PR-040 Theme Correlation Engine', () => {
  const atDate = '2026-08-08T12:00:00Z';
  const ariesMoonLong = 0.0;
  const ariesAscLong = 0.0;

  const SIGN_LONGITUDES: Record<Sign, number> = {
    [Sign.ARIES]: 10.0,
    [Sign.TAURUS]: 40.0,
    [Sign.GEMINI]: 70.0,
    [Sign.CANCER]: 100.0,
    [Sign.LEO]: 130.0,
    [Sign.VIRGO]: 160.0,
    [Sign.LIBRA]: 190.0,
    [Sign.SCORPIO]: 220.0,
    [Sign.SAGITTARIUS]: 250.0,
    [Sign.CAPRICORN]: 280.0,
    [Sign.AQUARIUS]: 310.0,
    [Sign.PISCES]: 345.0
  };

  // MOST IMPORTANT TEST
  it('does not infer a theme from a planet without an explicit natal rule', () => {
    const rawTransit = calculateTransit({
      at: atDate,
      natalMoonLongitude: ariesMoonLong,
      natalAscendantLongitude: ariesAscLong,
      transitLongitudes: { [Planet.SATURN]: SIGN_LONGITUDES[Sign.PISCES] }
    });
    const transitReport = analyzeTransits({ transit: rawTransit });
    const transitCorrelation = correlateDashaAndTransit({
      dasha: { mahadashaPlanet: Planet.SATURN },
      transit: transitReport
    });

    const result = correlateThemes({
      natalThemeEvidence: [],
      transitCorrelation
    });

    expect(result.themes).toEqual([]);
  });

  it('extractNatalThemeEvidence returns empty array for real inputs', () => {
    const result = extractNatalThemeEvidence({ mock: 'chart' });
    expect(result).toEqual([]);
    expect(Object.isFrozen(result)).toBe(true);
  });

  it('correlates supported theme when explicit natal evidence matches active Dasha transit planet', () => {
    const rawTransit = calculateTransit({
      at: atDate,
      natalMoonLongitude: ariesMoonLong,
      natalAscendantLongitude: ariesAscLong,
      transitLongitudes: { [Planet.SATURN]: SIGN_LONGITUDES[Sign.PISCES] }
    });
    const transitReport = analyzeTransits({ transit: rawTransit });
    const transitCorrelation = correlateDashaAndTransit({
      dasha: { mahadashaPlanet: Planet.SATURN },
      transit: transitReport
    });

    const natalEvidence: NatalThemeEvidence[] = [
      {
        theme: ThemeType.CAREER,
        source: 'LORDSHIP',
        ruleId: 'CAREER_10TH_LORD_001',
        reason: 'Saturn rules 10th house',
        activatingPlanets: [Planet.SATURN],
        planet: Planet.SATURN,
        house: 10
      }
    ];

    const result = correlateThemes({
      natalThemeEvidence: natalEvidence,
      transitCorrelation
    });

    expect(result.transitAt).toBe(transitCorrelation.transitAt);
    expect(result.themes.length).toBe(1);

    const themeEv = result.themes[0];
    expect(themeEv.theme).toBe(ThemeType.CAREER);
    expect(themeEv.natalEvidence.length).toBe(1);
    expect(themeEv.natalEvidence[0].ruleId).toBe('CAREER_10TH_LORD_001');
    expect(themeEv.dashaTransitEvidence.length).toBe(1);
    expect(themeEv.dashaTransitEvidence[0].dashaPlanet).toBe(Planet.SATURN);
    expect(themeEv.dashaTransitEvidence[0].transitCondition).toBe(TransitCondition.SADE_SATI_RISING);
    expect(themeEv.reason).toContain('Theme CAREER is supported by explicit natal evidence and a matching Dasha-transit correlation for Saturn.');
  });

  it('does not return themes when natal evidence activating planet does not match active Dasha planet', () => {
    const rawTransit = calculateTransit({
      at: atDate,
      natalMoonLongitude: ariesMoonLong,
      natalAscendantLongitude: ariesAscLong,
      transitLongitudes: { [Planet.SATURN]: SIGN_LONGITUDES[Sign.PISCES] }
    });
    const transitReport = analyzeTransits({ transit: rawTransit });
    const transitCorrelation = correlateDashaAndTransit({
      dasha: { mahadashaPlanet: Planet.SATURN },
      transit: transitReport
    });

    // Natal evidence points to Jupiter, but active Dasha transit correlation is for Saturn
    const natalEvidence: NatalThemeEvidence[] = [
      {
        theme: ThemeType.WEALTH,
        source: 'PLANET',
        ruleId: 'WEALTH_JUPITER_001',
        reason: 'Jupiter in 2nd house',
        activatingPlanets: [Planet.JUPITER],
        planet: Planet.JUPITER,
        house: 2
      }
    ];

    const result = correlateThemes({
      natalThemeEvidence: natalEvidence,
      transitCorrelation
    });

    expect(result.themes).toEqual([]);
  });

  it('works across Mahadasha, Antardasha, and Pratyantardasha levels', () => {
    const rawTransit = calculateTransit({
      at: atDate,
      natalMoonLongitude: ariesMoonLong,
      natalAscendantLongitude: ariesAscLong,
      transitLongitudes: { [Planet.SATURN]: SIGN_LONGITUDES[Sign.PISCES] }
    });
    const transitReport = analyzeTransits({ transit: rawTransit });
    const transitCorrelation = correlateDashaAndTransit({
      dasha: {
        mahadashaPlanet: Planet.SUN,
        antardashaPlanet: Planet.MERCURY,
        pratyantardashaPlanet: Planet.SATURN
      },
      transit: transitReport
    });

    const natalEvidence: NatalThemeEvidence[] = [
      {
        theme: ThemeType.HEALTH,
        source: 'HOUSE',
        ruleId: 'HEALTH_6TH_HOUSE_001',
        reason: 'Saturn afflicts 6th house',
        activatingPlanets: [Planet.SATURN],
        house: 6
      }
    ];

    const result = correlateThemes({
      natalThemeEvidence: natalEvidence,
      transitCorrelation
    });

    expect(result.themes.length).toBe(1);
    expect(result.themes[0].dashaTransitEvidence[0].dashaLevel).toBe('PRATYANTARDASHA');
  });

  it('preserves all fields on natalEvidence and dashaTransitEvidence', () => {
    const rawTransit = calculateTransit({
      at: atDate,
      natalMoonLongitude: ariesMoonLong,
      natalAscendantLongitude: ariesAscLong,
      transitLongitudes: { [Planet.JUPITER]: SIGN_LONGITUDES[Sign.ARIES] }
    });
    const transitReport = analyzeTransits({
      transit: rawTransit,
      natalPlanetLongitudes: { [Planet.SUN]: SIGN_LONGITUDES[Sign.LEO] }
    });
    const transitCorrelation = correlateDashaAndTransit({
      dasha: { mahadashaPlanet: Planet.JUPITER },
      transit: transitReport
    });

    const natalEvidence: NatalThemeEvidence[] = [
      {
        theme: ThemeType.RELATIONSHIPS,
        source: 'LORDSHIP',
        ruleId: 'REL_7TH_LORD_001',
        reason: 'Jupiter rules 7th house',
        activatingPlanets: [Planet.JUPITER],
        planet: Planet.JUPITER,
        house: 7
      }
    ];

    const result = correlateThemes({
      natalThemeEvidence: natalEvidence,
      transitCorrelation
    });

    expect(result.themes.length).toBe(1);
    const themeEv = result.themes[0];

    // Check preserved natal evidence fields
    const ne = themeEv.natalEvidence[0];
    expect(ne.theme).toBe(ThemeType.RELATIONSHIPS);
    expect(ne.source).toBe('LORDSHIP');
    expect(ne.ruleId).toBe('REL_7TH_LORD_001');
    expect(ne.reason).toBe('Jupiter rules 7th house');
    expect(ne.activatingPlanets).toEqual([Planet.JUPITER]);
    expect(ne.planet).toBe(Planet.JUPITER);
    expect(ne.house).toBe(7);

    // Check preserved Dasha-transit evidence fields
    const dtEv = themeEv.dashaTransitEvidence.find(
      (c) => c.aspectType === AspectType.SPECIAL_5TH
    );
    expect(dtEv).toBeDefined();
    expect(dtEv!.dashaLevel).toBe('MAHADASHA');
    expect(dtEv!.dashaPlanet).toBe(Planet.JUPITER);
    expect(dtEv!.transitPlanet).toBe(Planet.JUPITER);
    expect(dtEv!.natalPlanet).toBe(Planet.SUN);
    expect(dtEv!.aspectType).toBe(AspectType.SPECIAL_5TH);
    expect(dtEv!.targetSign).toBe(Sign.LEO);
    expect(dtEv!.targetHouseFromMoon).toBe(5);
    expect(dtEv!.targetHouseFromAscendant).toBe(5);
    expect(dtEv!.sourceReason).toBe('Transit JUPITER casts aspect on natal SUN in LEO.');
    expect(dtEv!.reason).toContain('Jupiter Mahadasha is active while transiting Jupiter casts aspect on natal Sun.');
  });

  it('deduplicates identical evidence items', () => {
    const rawTransit = calculateTransit({
      at: atDate,
      natalMoonLongitude: ariesMoonLong,
      natalAscendantLongitude: ariesAscLong,
      transitLongitudes: { [Planet.SATURN]: SIGN_LONGITUDES[Sign.PISCES] }
    });
    const transitReport = analyzeTransits({ transit: rawTransit });
    const transitCorrelation = correlateDashaAndTransit({
      dasha: { mahadashaPlanet: Planet.SATURN },
      transit: transitReport
    });

    const duplicateNatalEvidence: NatalThemeEvidence[] = [
      {
        theme: ThemeType.CAREER,
        source: 'LORDSHIP',
        ruleId: 'CAREER_10TH_LORD_001',
        reason: 'Saturn rules 10th house',
        activatingPlanets: [Planet.SATURN]
      },
      {
        theme: ThemeType.CAREER,
        source: 'LORDSHIP',
        ruleId: 'CAREER_10TH_LORD_001',
        reason: 'Saturn rules 10th house',
        activatingPlanets: [Planet.SATURN]
      }
    ];

    const result = correlateThemes({
      natalThemeEvidence: duplicateNatalEvidence,
      transitCorrelation
    });

    expect(result.themes.length).toBe(1);
    expect(result.themes[0].natalEvidence.length).toBe(1);
    expect(result.themes[0].dashaTransitEvidence.length).toBe(1);
  });

  it('preserves distinct natal evidence items with different houses', () => {
    const rawTransit = calculateTransit({
      at: atDate,
      natalMoonLongitude: ariesMoonLong,
      natalAscendantLongitude: ariesAscLong,
      transitLongitudes: { [Planet.SATURN]: SIGN_LONGITUDES[Sign.PISCES] }
    });
    const transitReport = analyzeTransits({ transit: rawTransit });
    const transitCorrelation = correlateDashaAndTransit({
      dasha: { mahadashaPlanet: Planet.SATURN },
      transit: transitReport
    });

    const distinctHouseEvidence: NatalThemeEvidence[] = [
      {
        theme: ThemeType.CAREER,
        source: 'LORDSHIP',
        ruleId: 'CAREER_LORD_001',
        reason: 'Saturn lordship indicator',
        activatingPlanets: [Planet.SATURN],
        house: 10
      },
      {
        theme: ThemeType.CAREER,
        source: 'LORDSHIP',
        ruleId: 'CAREER_LORD_001',
        reason: 'Saturn lordship indicator',
        activatingPlanets: [Planet.SATURN],
        house: 5
      }
    ];

    const result = correlateThemes({
      natalThemeEvidence: distinctHouseEvidence,
      transitCorrelation
    });

    expect(result.themes.length).toBe(1);
    expect(result.themes[0].natalEvidence.length).toBe(2);
  });

  it('preserves distinct themes simultaneously', () => {
    const rawTransit = calculateTransit({
      at: atDate,
      natalMoonLongitude: ariesMoonLong,
      natalAscendantLongitude: ariesAscLong,
      transitLongitudes: { [Planet.SATURN]: SIGN_LONGITUDES[Sign.PISCES] }
    });
    const transitReport = analyzeTransits({ transit: rawTransit });
    const transitCorrelation = correlateDashaAndTransit({
      dasha: { mahadashaPlanet: Planet.SATURN },
      transit: transitReport
    });

    const multiThemeEvidence: NatalThemeEvidence[] = [
      {
        theme: ThemeType.CAREER,
        source: 'LORDSHIP',
        ruleId: 'CAREER_10TH_LORD_001',
        reason: 'Saturn rules 10th house',
        activatingPlanets: [Planet.SATURN]
      },
      {
        theme: ThemeType.HEALTH,
        source: 'HOUSE',
        ruleId: 'HEALTH_6TH_HOUSE_001',
        reason: 'Saturn afflicts 6th house',
        activatingPlanets: [Planet.SATURN]
      }
    ];

    const result = correlateThemes({
      natalThemeEvidence: multiThemeEvidence,
      transitCorrelation
    });

    expect(result.themes.length).toBe(2);
    const sortedThemes = result.themes.map((t) => t.theme).sort();
    expect(sortedThemes).toEqual([ThemeType.CAREER, ThemeType.HEALTH].sort());
  });

  it('returns frozen immutable report, themes, and evidence arrays', () => {
    const rawTransit = calculateTransit({
      at: atDate,
      natalMoonLongitude: ariesMoonLong,
      natalAscendantLongitude: ariesAscLong,
      transitLongitudes: { [Planet.SATURN]: SIGN_LONGITUDES[Sign.PISCES] }
    });
    const transitReport = analyzeTransits({ transit: rawTransit });
    const transitCorrelation = correlateDashaAndTransit({
      dasha: { mahadashaPlanet: Planet.SATURN },
      transit: transitReport
    });

    const natalEvidence: NatalThemeEvidence[] = [
      {
        theme: ThemeType.CAREER,
        source: 'LORDSHIP',
        ruleId: 'CAREER_10TH_LORD_001',
        reason: 'Saturn rules 10th house',
        activatingPlanets: [Planet.SATURN]
      }
    ];

    const result = correlateThemes({
      natalThemeEvidence: natalEvidence,
      transitCorrelation
    });

    expect(Object.isFrozen(result)).toBe(true);
    expect(Object.isFrozen(result.themes)).toBe(true);
    expect(Object.isFrozen(result.themes[0])).toBe(true);
    expect(Object.isFrozen(result.themes[0].natalEvidence)).toBe(true);
    expect(Object.isFrozen(result.themes[0].dashaTransitEvidence)).toBe(true);

    expect(() => {
      (result.themes as any)[0].reason = 'Mutated';
    }).toThrow();
  });

  it('throws TypeError on invalid inputs and invalid evidence items', () => {
    const mockTransitCorrelation = {
      transitAt: atDate,
      correlations: []
    };

    // @ts-ignore
    expect(() => correlateThemes(null)).toThrow(TypeError);
    // @ts-ignore
    expect(() => correlateThemes({ natalThemeEvidence: [], transitCorrelation: null })).toThrow(TypeError);
    // @ts-ignore
    expect(() => correlateThemes({ natalThemeEvidence: null, transitCorrelation: mockTransitCorrelation })).toThrow(TypeError);

    // Invalid theme
    expect(() =>
      correlateThemes({
        natalThemeEvidence: [
          {
            theme: 'INVALID_THEME' as any,
            source: 'LORDSHIP',
            ruleId: 'RULE_1',
            reason: 'Test',
            activatingPlanets: [Planet.SATURN]
          }
        ],
        transitCorrelation: mockTransitCorrelation
      })
    ).toThrow(TypeError);

    // Empty ruleId
    expect(() =>
      correlateThemes({
        natalThemeEvidence: [
          {
            theme: ThemeType.CAREER,
            source: 'LORDSHIP',
            ruleId: '   ',
            reason: 'Test',
            activatingPlanets: [Planet.SATURN]
          }
        ],
        transitCorrelation: mockTransitCorrelation
      })
    ).toThrow(TypeError);

    // Empty activatingPlanets array
    expect(() =>
      correlateThemes({
        natalThemeEvidence: [
          {
            theme: ThemeType.CAREER,
            source: 'LORDSHIP',
            ruleId: 'RULE_1',
            reason: 'Test',
            activatingPlanets: []
          }
        ],
        transitCorrelation: mockTransitCorrelation
      })
    ).toThrow(TypeError);

    // Invalid activating planet
    expect(() =>
      correlateThemes({
        natalThemeEvidence: [
          {
            theme: ThemeType.CAREER,
            source: 'LORDSHIP',
            ruleId: 'RULE_1',
            reason: 'Test',
            activatingPlanets: ['INVALID_PLANET' as any]
          }
        ],
        transitCorrelation: mockTransitCorrelation
      })
    ).toThrow(TypeError);
  });
});
