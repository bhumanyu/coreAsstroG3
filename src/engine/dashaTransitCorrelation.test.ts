import { describe, it, expect } from 'vitest';
import { calculateTransit } from './transitEngine';
import { analyzeTransits } from './transitAnalysis';
import {
  correlateDashaAndTransit,
  DashaTransitCorrelationType
} from './dashaTransitCorrelation';
import { Planet, Sign, AspectType, TransitCondition, TransitRelationshipType } from '../types';

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

  it('correlates natal planet contact (TRANSIT_CONJUNCTION_NATAL_PLANET or TRANSIT_EXACT_CONTACT_NATAL_PLANET) with preserved natalPlanet', () => {
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

    const contactEv = report.correlations.find(
      (c) => c.type === DashaTransitCorrelationType.MAHADASHA_PLANET_NATAL_PLANET_CONTACT
    );
    expect(contactEv).toBeDefined();
    expect(contactEv!.natalPlanet).toBe(Planet.SUN);
    expect(contactEv!.transitCondition).toBe(TransitCondition.TRANSIT_EXACT_CONTACT_NATAL_PLANET);
    expect(contactEv!.reason).toContain('Saturn Mahadasha is active while transiting Saturn exactly contacts natal Sun.');
  });

  it('preserves geometry metadata (relationshipType, angularSeparation, orb, exactContact) on emitted DashaTransitEvidence', () => {
    // 1. Exact contact
    const rawTransitExact = calculateTransit({
      at: atDate,
      natalMoonLongitude: ariesMoonLong,
      natalAscendantLongitude: ariesAscLong,
      transitLongitudes: { [Planet.SATURN]: 15.0 }
    });
    const transitReportExact = analyzeTransits({
      transit: rawTransitExact,
      natalPlanetLongitudes: { [Planet.SUN]: 15.0 }
    });

    const reportExact = correlateDashaAndTransit({
      dasha: { mahadashaPlanet: Planet.SATURN },
      transit: transitReportExact
    });

    const exactEv = reportExact.correlations.find(
      (c) => c.type === DashaTransitCorrelationType.MAHADASHA_PLANET_NATAL_PLANET_CONTACT
    );
    expect(exactEv).toBeDefined();
    expect(exactEv!.relationshipType).toBe(TransitRelationshipType.EXACT_CONTACT);
    expect(exactEv!.angularSeparation).toBeCloseTo(0);
    expect(exactEv!.orb).toBeCloseTo(0);
    expect(exactEv!.exactContact).toBe(true);

    // 2. Conjunction with configured orb
    const rawTransitConj = calculateTransit({
      at: atDate,
      natalMoonLongitude: ariesMoonLong,
      natalAscendantLongitude: ariesAscLong,
      transitLongitudes: { [Planet.SATURN]: 13.0 }
    });
    const transitReportConj = analyzeTransits({
      transit: rawTransitConj,
      natalPlanetLongitudes: { [Planet.SUN]: 10.0 },
      transitGeometry: {
        conjunctionOrbDegrees: 5,
        oppositionOrbDegrees: 0,
        exactContactToleranceDegrees: 1e-6
      }
    });

    const reportConj = correlateDashaAndTransit({
      dasha: { mahadashaPlanet: Planet.SATURN },
      transit: transitReportConj
    });

    const conjEv = reportConj.correlations.find(
      (c) => c.type === DashaTransitCorrelationType.MAHADASHA_PLANET_NATAL_PLANET_CONTACT
    );
    expect(conjEv).toBeDefined();
    expect(conjEv!.transitCondition).toBe(TransitCondition.TRANSIT_CONJUNCTION_NATAL_PLANET);
    expect(conjEv!.relationshipType).toBe(TransitRelationshipType.CONJUNCTION);
    expect(conjEv!.angularSeparation).toBeCloseTo(3);
    expect(conjEv!.orb).toBeCloseTo(3);
    expect(conjEv!.exactContact).toBe(false);
  });

  it('correlates natal planet opposition (TRANSIT_OPPOSITION_NATAL_PLANET) with preserved natalPlanet and geometry metadata', () => {
    const rawTransitOpp = calculateTransit({
      at: atDate,
      natalMoonLongitude: ariesMoonLong,
      natalAscendantLongitude: ariesAscLong,
      transitLongitudes: { [Planet.SATURN]: 192.0 }
    });
    const transitReportOpp = analyzeTransits({
      transit: rawTransitOpp,
      natalPlanetLongitudes: { [Planet.SUN]: 10.0 },
      transitGeometry: {
        conjunctionOrbDegrees: 0,
        oppositionOrbDegrees: 5,
        exactContactToleranceDegrees: 1e-6
      }
    });

    const reportOpp = correlateDashaAndTransit({
      dasha: { mahadashaPlanet: Planet.SATURN },
      transit: transitReportOpp
    });

    const oppEv = reportOpp.correlations.find(
      (c) => c.type === DashaTransitCorrelationType.MAHADASHA_PLANET_NATAL_PLANET_CONTACT
    );
    expect(oppEv).toBeDefined();
    expect(oppEv!.transitCondition).toBe(TransitCondition.TRANSIT_OPPOSITION_NATAL_PLANET);
    expect(oppEv!.natalPlanet).toBe(Planet.SUN);
    expect(oppEv!.relationshipType).toBe(TransitRelationshipType.OPPOSITION);
    expect(oppEv!.angularSeparation).toBeCloseTo(178);
    expect(oppEv!.orb).toBeCloseTo(2);
    expect(oppEv!.exactContact).toBe(false);
    expect(oppEv!.reason).toContain('Saturn Mahadasha is active while transiting Saturn is in opposition to natal Sun.');
  });

  it('regression: transit Saturn 29° Aries vs natal Moon 1° Aries does not correlate as conjunction', () => {
    const rawTransit = calculateTransit({
      at: atDate,
      natalMoonLongitude: 1.0,
      natalAscendantLongitude: ariesAscLong,
      transitLongitudes: { [Planet.SATURN]: 29.0 }
    });
    const transitReport = analyzeTransits({
      transit: rawTransit,
      natalPlanetLongitudes: { [Planet.MOON]: 1.0 }
    });

    const report = correlateDashaAndTransit({
      dasha: { mahadashaPlanet: Planet.SATURN },
      transit: transitReport
    });

    const contactEv = report.correlations.find(
      (c) => c.type === DashaTransitCorrelationType.MAHADASHA_PLANET_NATAL_PLANET_CONTACT
    );
    expect(contactEv).toBeUndefined();

    const conjEv = report.correlations.find(
      (c) => c.transitCondition === TransitCondition.TRANSIT_CONJUNCTION_NATAL_PLANET
    );
    expect(conjEv).toBeUndefined();

    // SAME_SIGN condition correlates as standard TRANSIT_CONDITION, not NATAL_PLANET_CONTACT
    const sameSignEv = report.correlations.find(
      (c) => c.transitCondition === TransitCondition.TRANSIT_SAME_SIGN_NATAL_PLANET
    );
    expect(sameSignEv).toBeDefined();
    expect(sameSignEv!.type).toBe(DashaTransitCorrelationType.MAHADASHA_PLANET_TRANSIT_CONDITION);
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

    // Should have Sade Sati Peak and Transit Contact with Natal Sun
    expect(report.correlations.length).toBeGreaterThanOrEqual(2);
    const types = report.correlations.map((c) => c.type);
    expect(types).toContain(DashaTransitCorrelationType.MAHADASHA_PLANET_TRANSIT_CONDITION);
    expect(types).toContain(DashaTransitCorrelationType.MAHADASHA_PLANET_NATAL_PLANET_CONTACT);
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
