import { describe, it, expect } from 'vitest';
import { calculateTransit } from './transitEngine';
import { analyzeTransits } from './transitAnalysis';
import {
  correlateDashaAndTransit,
  DashaTransitCorrelationType
} from './dashaTransitCorrelation';
import { Planet, Sign, AspectType, TransitCondition } from '../types';

describe('PR-039 Dasha-Transit Correlation Engine', () => {
  const atDate = '2026-08-08T12:00:00Z';
  const ariesMoonLong = 0.0; // Aries Moon
  const ariesAscLong = 0.0;  // Aries Ascendant

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
    [Sign.PISCES]: 345.0,
  };

  it('correlates positive Mahadasha condition', () => {
    const rawTransit = calculateTransit({
      at: atDate,
      natalMoonLongitude: ariesMoonLong,
      natalAscendantLongitude: ariesAscLong,
      transitLongitudes: { [Planet.SATURN]: SIGN_LONGITUDES[Sign.PISCES] }
    });
    const transitReport = analyzeTransits({ transit: rawTransit });

    const report = correlateDashaAndTransit({
      dasha: { mahadashaPlanet: Planet.SATURN },
      transit: transitReport
    });

    expect(report.correlations.length).toBe(1);
    const ev = report.correlations[0];
    expect(report.transitAt).toBe(transitReport.at);
    expect(ev.type).toBe(DashaTransitCorrelationType.MAHADASHA_PLANET_TRANSIT_CONDITION);
    expect(ev.dashaLevel).toBe('MAHADASHA');
    expect(ev.dashaPlanet).toBe(Planet.SATURN);
    expect(ev.transitPlanet).toBe(Planet.SATURN);
    expect(ev.transitCondition).toBe(TransitCondition.SADE_SATI_RISING);
    expect(ev.referenceHouse).toBe(12);
    expect(ev.sourceReason).toBe('Saturn is transiting the 12th sign from the natal Moon.');
    expect(ev.reason).toContain('Saturn Mahadasha is active while transiting Saturn shows SADE_SATI_RISING.');
  });

  it('does not correlate when dasha planet has no transit conditions (negative Mahadasha)', () => {
    const rawTransit = calculateTransit({
      at: atDate,
      natalMoonLongitude: ariesMoonLong,
      natalAscendantLongitude: ariesAscLong,
      transitLongitudes: { [Planet.SATURN]: SIGN_LONGITUDES[Sign.PISCES] }
    });
    const transitReport = analyzeTransits({ transit: rawTransit });

    const report = correlateDashaAndTransit({
      dasha: { mahadashaPlanet: Planet.SUN },
      transit: transitReport
    });

    expect(report.correlations.length).toBe(0);
  });

  it('correlates Antardasha condition', () => {
    const rawTransit = calculateTransit({
      at: atDate,
      natalMoonLongitude: ariesMoonLong,
      natalAscendantLongitude: ariesAscLong,
      transitLongitudes: { [Planet.SATURN]: SIGN_LONGITUDES[Sign.PISCES] }
    });
    const transitReport = analyzeTransits({ transit: rawTransit });

    const report = correlateDashaAndTransit({
      dasha: { mahadashaPlanet: Planet.SUN, antardashaPlanet: Planet.SATURN },
      transit: transitReport
    });

    expect(report.correlations.length).toBe(1);
    const ev = report.correlations[0];
    expect(ev.type).toBe(DashaTransitCorrelationType.ANTARDASHA_PLANET_TRANSIT_CONDITION);
    expect(ev.dashaLevel).toBe('ANTARDASHA');
    expect(ev.dashaPlanet).toBe(Planet.SATURN);
    expect(ev.transitCondition).toBe(TransitCondition.SADE_SATI_RISING);
    expect(ev.reason).toContain('Saturn Antardasha is active while transiting Saturn shows SADE_SATI_RISING.');
  });

  it('correlates Pratyantardasha condition', () => {
    const rawTransit = calculateTransit({
      at: atDate,
      natalMoonLongitude: ariesMoonLong,
      natalAscendantLongitude: ariesAscLong,
      transitLongitudes: { [Planet.SATURN]: SIGN_LONGITUDES[Sign.PISCES] }
    });
    const transitReport = analyzeTransits({ transit: rawTransit });

    const report = correlateDashaAndTransit({
      dasha: {
        mahadashaPlanet: Planet.SUN,
        antardashaPlanet: Planet.MERCURY,
        pratyantardashaPlanet: Planet.SATURN
      },
      transit: transitReport
    });

    expect(report.correlations.length).toBe(1);
    const ev = report.correlations[0];
    expect(ev.type).toBe(DashaTransitCorrelationType.PRATYANTARDASHA_PLANET_TRANSIT_CONDITION);
    expect(ev.dashaLevel).toBe('PRATYANTARDASHA');
    expect(ev.dashaPlanet).toBe(Planet.SATURN);
    expect(ev.transitCondition).toBe(TransitCondition.SADE_SATI_RISING);
  });

  it('correlates Sade Sati peak condition', () => {
    const rawTransit = calculateTransit({
      at: atDate,
      natalMoonLongitude: ariesMoonLong,
      natalAscendantLongitude: ariesAscLong,
      transitLongitudes: { [Planet.SATURN]: SIGN_LONGITUDES[Sign.ARIES] }
    });
    const transitReport = analyzeTransits({ transit: rawTransit });

    const report = correlateDashaAndTransit({
      dasha: { mahadashaPlanet: Planet.SATURN },
      transit: transitReport
    });

    const sadeSatiEv = report.correlations.find(
      (c) => c.transitCondition === TransitCondition.SADE_SATI_PEAK
    );
    expect(sadeSatiEv).toBeDefined();
    expect(sadeSatiEv!.type).toBe(DashaTransitCorrelationType.MAHADASHA_PLANET_TRANSIT_CONDITION);
  });

  it('correlates Ashtama Shani condition', () => {
    const rawTransit = calculateTransit({
      at: atDate,
      natalMoonLongitude: ariesMoonLong,
      natalAscendantLongitude: ariesAscLong,
      transitLongitudes: { [Planet.SATURN]: SIGN_LONGITUDES[Sign.SCORPIO] }
    });
    const transitReport = analyzeTransits({ transit: rawTransit });

    const report = correlateDashaAndTransit({
      dasha: { mahadashaPlanet: Planet.SATURN },
      transit: transitReport
    });

    expect(report.correlations.length).toBe(1);
    const ev = report.correlations[0];
    expect(ev.transitCondition).toBe(TransitCondition.ASHTAMA_SHANI);
    expect(ev.referenceHouse).toBe(8);
    expect(ev.sourceReason).toBe('Saturn is transiting the 8th sign from the natal Moon.');
    expect(ev.reason).toContain('Saturn Mahadasha is active while transiting Saturn shows ASHTAMA_SHANI.');
  });

  it('correlates Jupiter condition (5th from Moon)', () => {
    const rawTransit = calculateTransit({
      at: atDate,
      natalMoonLongitude: ariesMoonLong,
      natalAscendantLongitude: ariesAscLong,
      transitLongitudes: { [Planet.JUPITER]: SIGN_LONGITUDES[Sign.LEO] }
    });
    const transitReport = analyzeTransits({ transit: rawTransit });

    const report = correlateDashaAndTransit({
      dasha: { mahadashaPlanet: Planet.JUPITER },
      transit: transitReport
    });

    expect(report.correlations.length).toBe(1);
    expect(report.correlations[0].transitCondition).toBe(TransitCondition.JUPITER_5TH_FROM_MOON);
  });

  it('correlates natal conjunction (TRANSIT_OVER_NATAL_PLANET) with preserved natalPlanet', () => {
    const rawTransit = calculateTransit({
      at: atDate,
      natalMoonLongitude: ariesMoonLong,
      natalAscendantLongitude: ariesAscLong,
      transitLongitudes: { [Planet.SATURN]: SIGN_LONGITUDES[Sign.ARIES] }
    });
    const transitReport = analyzeTransits({
      transit: rawTransit,
      natalPlanetLongitudes: { [Planet.SUN]: SIGN_LONGITUDES[Sign.ARIES] }
    });

    const report = correlateDashaAndTransit({
      dasha: { mahadashaPlanet: Planet.SATURN },
      transit: transitReport
    });

    const overEv = report.correlations.find(
      (c) => c.type === DashaTransitCorrelationType.MAHADASHA_PLANET_OVER_NATAL_PLANET
    );
    expect(overEv).toBeDefined();
    expect(overEv!.natalPlanet).toBe(Planet.SUN);
    expect(overEv!.reason).toContain('Saturn Mahadasha is active while transiting Saturn occupies the same sign as natal Sun.');
  });

  it('correlates natal aspect (TRANSIT_ASPECTS_NATAL_PLANET) with preserved aspectType and targetSign', () => {
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

    const report = correlateDashaAndTransit({
      dasha: { mahadashaPlanet: Planet.JUPITER },
      transit: transitReport
    });

    const aspectEv = report.correlations.find(
      (c) => c.type === DashaTransitCorrelationType.MAHADASHA_PLANET_ASPECTS_NATAL_PLANET
    );
    expect(aspectEv).toBeDefined();
    expect(aspectEv!.natalPlanet).toBe(Planet.SUN);
    expect(aspectEv!.aspectType).toBe(AspectType.SPECIAL_5TH);
    expect(aspectEv!.targetSign).toBe(Sign.LEO);
    expect(aspectEv!.targetHouseFromMoon).toBe(5);
    expect(aspectEv!.targetHouseFromAscendant).toBe(5);
    expect(aspectEv!.sourceReason).toBe('Transit JUPITER casts aspect on natal SUN in LEO.');
    expect(aspectEv!.reason).toContain('Jupiter Mahadasha is active while transiting Jupiter casts aspect on natal Sun.');
  });

  it('does not correlate cross-planet conditions (same-planet rule)', () => {
    const rawTransit = calculateTransit({
      at: atDate,
      natalMoonLongitude: ariesMoonLong,
      natalAscendantLongitude: ariesAscLong,
      transitLongitudes: { [Planet.SATURN]: SIGN_LONGITUDES[Sign.PISCES] }
    });
    const transitReport = analyzeTransits({ transit: rawTransit });

    // Active dasha is JUPITER while only SATURN has transit conditions
    const report = correlateDashaAndTransit({
      dasha: { mahadashaPlanet: Planet.JUPITER },
      transit: transitReport
    });

    expect(report.correlations.length).toBe(0);
  });

  it('removes duplicate evidence items', () => {
    const rawTransit = calculateTransit({
      at: atDate,
      natalMoonLongitude: ariesMoonLong,
      natalAscendantLongitude: ariesAscLong,
      transitLongitudes: { [Planet.SATURN]: SIGN_LONGITUDES[Sign.PISCES] }
    });
    const transitReport = analyzeTransits({ transit: rawTransit });

    // If Mahadasha and Antardasha are both SATURN for Saturn transit condition
    const report = correlateDashaAndTransit({
      dasha: { mahadashaPlanet: Planet.SATURN, antardashaPlanet: Planet.SATURN },
      transit: transitReport
    });

    // MAHADASHA_PLANET_TRANSIT_CONDITION and ANTARDASHA_PLANET_TRANSIT_CONDITION are distinct types
    expect(report.correlations.length).toBe(2);
    const types = report.correlations.map((c) => c.type);
    expect(types).toContain(DashaTransitCorrelationType.MAHADASHA_PLANET_TRANSIT_CONDITION);
    expect(types).toContain(DashaTransitCorrelationType.ANTARDASHA_PLANET_TRANSIT_CONDITION);
  });

  it('preserves distinct conditions for same dasha planet', () => {
    const rawTransit = calculateTransit({
      at: atDate,
      natalMoonLongitude: ariesMoonLong,
      natalAscendantLongitude: ariesAscLong,
      transitLongitudes: { [Planet.SATURN]: SIGN_LONGITUDES[Sign.ARIES] }
    });
    const transitReport = analyzeTransits({
      transit: rawTransit,
      natalPlanetLongitudes: { [Planet.SUN]: SIGN_LONGITUDES[Sign.ARIES] }
    });

    const report = correlateDashaAndTransit({
      dasha: { mahadashaPlanet: Planet.SATURN },
      transit: transitReport
    });

    // Should have Sade Sati Peak and Transit Over Natal Sun
    expect(report.correlations.length).toBeGreaterThanOrEqual(2);
    const types = report.correlations.map((c) => c.type);
    expect(types).toContain(DashaTransitCorrelationType.MAHADASHA_PLANET_TRANSIT_CONDITION);
    expect(types).toContain(DashaTransitCorrelationType.MAHADASHA_PLANET_OVER_NATAL_PLANET);
  });

  it('works smoothly when optional antardasha/pratyantardasha are absent', () => {
    const rawTransit = calculateTransit({
      at: atDate,
      natalMoonLongitude: ariesMoonLong,
      natalAscendantLongitude: ariesAscLong,
      transitLongitudes: { [Planet.SATURN]: SIGN_LONGITUDES[Sign.PISCES] }
    });
    const transitReport = analyzeTransits({ transit: rawTransit });

    const report = correlateDashaAndTransit({
      dasha: { mahadashaPlanet: Planet.SATURN },
      transit: transitReport
    });

    expect(report.correlations.length).toBe(1);
  });

  it('rejects invalid Antardasha planet', () => {
    const rawTransit = calculateTransit({
      at: atDate,
      natalMoonLongitude: ariesMoonLong,
      natalAscendantLongitude: ariesAscLong,
      transitLongitudes: { [Planet.SATURN]: SIGN_LONGITUDES[Sign.PISCES] }
    });
    const transitReport = analyzeTransits({ transit: rawTransit });

    expect(() =>
      correlateDashaAndTransit({
        dasha: { mahadashaPlanet: Planet.SATURN, antardashaPlanet: 'INVALID' as Planet },
        transit: transitReport
      })
    ).toThrow(TypeError);
  });

  it('rejects invalid Pratyantardasha planet', () => {
    const rawTransit = calculateTransit({
      at: atDate,
      natalMoonLongitude: ariesMoonLong,
      natalAscendantLongitude: ariesAscLong,
      transitLongitudes: { [Planet.SATURN]: SIGN_LONGITUDES[Sign.PISCES] }
    });
    const transitReport = analyzeTransits({ transit: rawTransit });

    expect(() =>
      correlateDashaAndTransit({
        dasha: { mahadashaPlanet: Planet.SATURN, pratyantardashaPlanet: 'INVALID' as Planet },
        transit: transitReport
      })
    ).toThrow(TypeError);
  });

  it('collapses identical duplicate evidence items', () => {
    // Construct a transit report with duplicate evidence under same planet
    const mockTransitReport = {
      at: atDate,
      results: {
        [Planet.SATURN]: {
          planet: Planet.SATURN,
          evidence: [
            {
              planet: Planet.SATURN,
              condition: TransitCondition.SADE_SATI_RISING,
              reason: 'First'
            },
            {
              planet: Planet.SATURN,
              condition: TransitCondition.SADE_SATI_RISING,
              reason: 'Duplicate'
            }
          ]
        }
      }
    };

    const report = correlateDashaAndTransit({
      dasha: { mahadashaPlanet: Planet.SATURN },
      transit: mockTransitReport as any
    });

    expect(report.correlations.length).toBe(1);
    expect(report.correlations[0].type).toBe(DashaTransitCorrelationType.MAHADASHA_PLANET_TRANSIT_CONDITION);
  });

  it('throws TypeError on invalid inputs', () => {
    // @ts-ignore
    expect(() => correlateDashaAndTransit(null)).toThrow(TypeError);
    // @ts-ignore
    expect(() => correlateDashaAndTransit({ dasha: null, transit: {} })).toThrow(TypeError);
    // @ts-ignore
    expect(() => correlateDashaAndTransit({ dasha: {}, transit: null })).toThrow(TypeError);
    // @ts-ignore
    expect(() => correlateDashaAndTransit({ dasha: { mahadashaPlanet: 'INVALID' }, transit: {} })).toThrow(TypeError);
    expect(() =>
      correlateDashaAndTransit({
        dasha: { mahadashaPlanet: Planet.SATURN, antardashaPlanet: 'INVALID' as any },
        transit: {} as any
      })
    ).toThrow(TypeError);
    expect(() =>
      correlateDashaAndTransit({
        dasha: { mahadashaPlanet: Planet.SATURN, pratyantardashaPlanet: 'INVALID' as any },
        transit: {} as any
      })
    ).toThrow(TypeError);
  });

  it('returns frozen report, correlations array, and evidence objects', () => {
    const rawTransit = calculateTransit({
      at: atDate,
      natalMoonLongitude: ariesMoonLong,
      natalAscendantLongitude: ariesAscLong,
      transitLongitudes: { [Planet.SATURN]: SIGN_LONGITUDES[Sign.PISCES] }
    });
    const transitReport = analyzeTransits({ transit: rawTransit });

    const report = correlateDashaAndTransit({
      dasha: { mahadashaPlanet: Planet.SATURN },
      transit: transitReport
    });

    expect(Object.isFrozen(report)).toBe(true);
    expect(Object.isFrozen(report.correlations)).toBe(true);
    expect(report.correlations.length).toBeGreaterThan(0);
    expect(Object.isFrozen(report.correlations[0])).toBe(true);

    expect(() => {
      (report.correlations as any)[0].reason = 'Mutated';
    }).toThrow();
  });
});
