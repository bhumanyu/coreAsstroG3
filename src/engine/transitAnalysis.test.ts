import { describe, it, expect } from 'vitest';
import { calculateTransit } from './transitEngine';
import { analyzeTransits, ordinal } from './transitAnalysis';
import { Planet, Sign, AspectType, TransitCondition, TransitAnalysisInput } from '../types';

describe('PR-038 Transit Analysis Engine', () => {
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

  function runAnalysis(planet: Planet, planetLong: number) {
    const transit = calculateTransit({
      at: atDate,
      natalMoonLongitude: ariesMoonLong,
      natalAscendantLongitude: ariesAscLong,
      transitLongitudes: { [planet]: planetLong }
    });

    const input: TransitAnalysisInput = {
      transit,
      natalPlanetLongitudes: {}
    };

    return analyzeTransits(input);
  }

  it('should format ordinals correctly', () => {
    expect(ordinal(1)).toBe('1st');
    expect(ordinal(2)).toBe('2nd');
    expect(ordinal(3)).toBe('3rd');
    expect(ordinal(4)).toBe('4th');
    expect(ordinal(5)).toBe('5th');
    expect(ordinal(10)).toBe('10th');
    expect(ordinal(11)).toBe('11th');
    expect(ordinal(12)).toBe('12th');
  });

  describe('Sade Sati Conditions', () => {
    it('Saturn in 12th sign (Pisces) triggers SADE_SATI_RISING', () => {
      const report = runAnalysis(Planet.SATURN, SIGN_LONGITUDES[Sign.PISCES]);
      const saturnResult = report.results![Planet.SATURN]!;
      expect(saturnResult.conditions).toEqual([TransitCondition.SADE_SATI_RISING]);
      expect(saturnResult.evidence![0].reason).toBe('Saturn is transiting the 12th sign from the natal Moon.');
    });

    it('Saturn in 1st sign (Aries) triggers SADE_SATI_PEAK', () => {
      const report = runAnalysis(Planet.SATURN, SIGN_LONGITUDES[Sign.ARIES]);
      const saturnResult = report.results![Planet.SATURN]!;
      expect(saturnResult.conditions).toEqual([TransitCondition.SADE_SATI_PEAK]);
      expect(saturnResult.evidence![0].reason).toBe('Saturn is transiting the 1st sign from the natal Moon.');
    });

    it('Saturn in 2nd sign (Taurus) triggers SADE_SATI_SETTING', () => {
      const report = runAnalysis(Planet.SATURN, SIGN_LONGITUDES[Sign.TAURUS]);
      const saturnResult = report.results![Planet.SATURN]!;
      expect(saturnResult.conditions).toEqual([TransitCondition.SADE_SATI_SETTING]);
      expect(saturnResult.evidence![0].reason).toBe('Saturn is transiting the 2nd sign from the natal Moon.');
    });

    it('Saturn in 3rd sign (Gemini) does not trigger any Sade Sati condition', () => {
      const report = runAnalysis(Planet.SATURN, SIGN_LONGITUDES[Sign.GEMINI]);
      const saturnResult = report.results![Planet.SATURN]!;
      expect(saturnResult.conditions).not.toContain(TransitCondition.SADE_SATI_RISING);
      expect(saturnResult.conditions).not.toContain(TransitCondition.SADE_SATI_PEAK);
      expect(saturnResult.conditions).not.toContain(TransitCondition.SADE_SATI_SETTING);
      expect(saturnResult.conditions).toEqual([TransitCondition.SATURN_3RD_FROM_MOON]);
    });
  });

  describe('Other Saturn Conditions', () => {
    it('Saturn in 8th sign (Scorpio) triggers ASHTAMA_SHANI', () => {
      const report = runAnalysis(Planet.SATURN, SIGN_LONGITUDES[Sign.SCORPIO]);
      const saturnResult = report.results![Planet.SATURN]!;
      expect(saturnResult.conditions).toEqual([TransitCondition.ASHTAMA_SHANI]);
      expect(saturnResult.evidence![0].referenceHouse).toBe(8);
    });

    it('Saturn in 4th sign (Cancer) triggers KANTAKA_SHANI', () => {
      const report = runAnalysis(Planet.SATURN, SIGN_LONGITUDES[Sign.CANCER]);
      const saturnResult = report.results![Planet.SATURN]!;
      expect(saturnResult.conditions).toEqual([TransitCondition.KANTAKA_SHANI]);
      expect(saturnResult.evidence![0].referenceHouse).toBe(4);
    });

    it('Saturn in 3rd sign (Gemini) triggers SATURN_3RD_FROM_MOON', () => {
      const report = runAnalysis(Planet.SATURN, SIGN_LONGITUDES[Sign.GEMINI]);
      const saturnResult = report.results![Planet.SATURN]!;
      expect(saturnResult.conditions).toEqual([TransitCondition.SATURN_3RD_FROM_MOON]);
    });

    it('Saturn in 10th sign (Capricorn) triggers SATURN_10TH_FROM_MOON', () => {
      const report = runAnalysis(Planet.SATURN, SIGN_LONGITUDES[Sign.CAPRICORN]);
      const saturnResult = report.results![Planet.SATURN]!;
      expect(saturnResult.conditions).toEqual([TransitCondition.SATURN_10TH_FROM_MOON]);
    });
  });

  describe('Jupiter Conditions', () => {
    it('Jupiter in 2nd sign (Taurus) triggers JUPITER_2ND_FROM_MOON', () => {
      const report = runAnalysis(Planet.JUPITER, SIGN_LONGITUDES[Sign.TAURUS]);
      const jupResult = report.results![Planet.JUPITER]!;
      expect(jupResult.conditions).toEqual([TransitCondition.JUPITER_2ND_FROM_MOON]);
    });

    it('Jupiter in 5th sign (Leo) triggers JUPITER_5TH_FROM_MOON', () => {
      const report = runAnalysis(Planet.JUPITER, SIGN_LONGITUDES[Sign.LEO]);
      const jupResult = report.results![Planet.JUPITER]!;
      expect(jupResult.conditions).toEqual([TransitCondition.JUPITER_5TH_FROM_MOON]);
    });

    it('Jupiter in 7th sign (Libra) triggers JUPITER_7TH_FROM_MOON', () => {
      const report = runAnalysis(Planet.JUPITER, SIGN_LONGITUDES[Sign.LIBRA]);
      const jupResult = report.results![Planet.JUPITER]!;
      expect(jupResult.conditions).toEqual([TransitCondition.JUPITER_7TH_FROM_MOON]);
    });

    it('Jupiter in 9th sign (Sagittarius) triggers JUPITER_9TH_FROM_MOON', () => {
      const report = runAnalysis(Planet.JUPITER, SIGN_LONGITUDES[Sign.SAGITTARIUS]);
      const jupResult = report.results![Planet.JUPITER]!;
      expect(jupResult.conditions).toEqual([TransitCondition.JUPITER_9TH_FROM_MOON]);
    });

    it('Jupiter in 11th sign (Aquarius) triggers JUPITER_11TH_FROM_MOON', () => {
      const report = runAnalysis(Planet.JUPITER, SIGN_LONGITUDES[Sign.AQUARIUS]);
      const jupResult = report.results![Planet.JUPITER]!;
      expect(jupResult.conditions).toEqual([TransitCondition.JUPITER_11TH_FROM_MOON]);
    });
  });

  describe('PR-038B Natal Planet Contact Conditions', () => {
    it('shouldDetectTransitOverNatalPlanet', () => {
      const transit = calculateTransit({
        at: atDate,
        natalMoonLongitude: SIGN_LONGITUDES[Sign.PISCES],
        natalAscendantLongitude: ariesAscLong,
        transitLongitudes: { [Planet.SATURN]: SIGN_LONGITUDES[Sign.PISCES] }
      });

      const report = analyzeTransits({
        transit,
        natalPlanetLongitudes: {
          [Planet.MOON]: SIGN_LONGITUDES[Sign.PISCES]
        }
      });

      const saturnResult = report.results![Planet.SATURN]!;
      expect(saturnResult.conditions).toContain(TransitCondition.TRANSIT_OVER_NATAL_PLANET);

      const overEvidence = saturnResult.evidence!.find(
        (e: any) => e.condition === TransitCondition.TRANSIT_OVER_NATAL_PLANET
      );
      expect(overEvidence).toBeDefined();
      expect(overEvidence!.natalPlanet).toBe(Planet.MOON);
      expect(overEvidence!.reason).toContain('Transit SATURN occupies the same sign (PISCES) as natal MOON.');
    });

    it('shouldDetectTransitAspectToNatalPlanet', () => {
      // Transit Jupiter in Aries casts 5th aspect on Leo, 7th on Libra, 9th on Sagittarius
      const transit = calculateTransit({
        at: atDate,
        natalMoonLongitude: ariesMoonLong,
        natalAscendantLongitude: ariesAscLong,
        transitLongitudes: { [Planet.JUPITER]: SIGN_LONGITUDES[Sign.ARIES] }
      });

      const report = analyzeTransits({
        transit,
        natalPlanetLongitudes: {
          [Planet.SUN]: SIGN_LONGITUDES[Sign.LEO] // Jupiter's 5th aspect falls on Leo
        }
      });

      const jupResult = report.results![Planet.JUPITER]!;
      expect(jupResult.conditions).toContain(TransitCondition.TRANSIT_ASPECTS_NATAL_PLANET);

      const aspectEvidence = jupResult.evidence!.find(
        (e: any) => e.condition === TransitCondition.TRANSIT_ASPECTS_NATAL_PLANET
      );
      expect(aspectEvidence).toBeDefined();
      expect(aspectEvidence!.natalPlanet).toBe(Planet.SUN);
      expect(aspectEvidence!.aspectType).toBe(AspectType.SPECIAL_5TH);
      expect(aspectEvidence!.targetSign).toBe(Sign.LEO);
      expect(aspectEvidence!.targetHouseFromMoon).toBe(5);
      expect(aspectEvidence!.targetHouseFromAscendant).toBe(5);
      expect(aspectEvidence!.reason).toContain('Transit JUPITER casts aspect on natal SUN in LEO.');
    });

    it('should retain separate evidence for distinct aspects when same condition and planet are involved', () => {
      const transit = calculateTransit({
        at: atDate,
        natalMoonLongitude: ariesMoonLong,
        natalAscendantLongitude: ariesAscLong,
        transitLongitudes: { [Planet.JUPITER]: SIGN_LONGITUDES[Sign.ARIES] }
      });

      // Pass two natal planets (SUN in Leo, MARS in Sagittarius) both aspected by Jupiter
      const report = analyzeTransits({
        transit,
        natalPlanetLongitudes: {
          [Planet.SUN]: SIGN_LONGITUDES[Sign.LEO],       // 5th aspect
          [Planet.MARS]: SIGN_LONGITUDES[Sign.SAGITTARIUS] // 9th aspect
        }
      });

      const jupResult = report.results![Planet.JUPITER]!;
      const aspectEvidences = jupResult.evidence!.filter(
        (e: any) => e.condition === TransitCondition.TRANSIT_ASPECTS_NATAL_PLANET
      );

      expect(aspectEvidences.length).toBe(2);

      const sunAspect = aspectEvidences.find((e: any) => e.natalPlanet === Planet.SUN);
      expect(sunAspect?.aspectType).toBe(AspectType.SPECIAL_5TH);
      expect(sunAspect?.targetSign).toBe(Sign.LEO);

      const marsAspect = aspectEvidences.find((e: any) => e.natalPlanet === Planet.MARS);
      expect(marsAspect?.aspectType).toBe(AspectType.SPECIAL_9TH);
      expect(marsAspect?.targetSign).toBe(Sign.SAGITTARIUS);
    });

    it('shouldNotCreateDuplicateEvidence', () => {
      // If natal longitudes contain duplicate entries for same planet (or trigger same condition/planet/natalPlanet), dedup resolves it
      const transit = calculateTransit({
        at: atDate,
        natalMoonLongitude: SIGN_LONGITUDES[Sign.PISCES],
        natalAscendantLongitude: ariesAscLong,
        transitLongitudes: { [Planet.SATURN]: SIGN_LONGITUDES[Sign.PISCES] }
      });

      const report = analyzeTransits({
        transit,
        natalPlanetLongitudes: {
          [Planet.MOON]: SIGN_LONGITUDES[Sign.PISCES]
        }
      });

      const saturnResult = report.results![Planet.SATURN]!;
      const overEvidences = saturnResult.evidence!.filter(
        (e: any) => e.condition === TransitCondition.TRANSIT_OVER_NATAL_PLANET && e.natalPlanet === Planet.MOON
      );
      expect(overEvidences.length).toBe(1);
    });

    it('should perform multi-planet aggregate analysis grouping evidence per planet', () => {
      const transit = calculateTransit({
        at: atDate,
        natalMoonLongitude: ariesMoonLong,
        natalAscendantLongitude: ariesAscLong,
        transitLongitudes: {
          [Planet.SATURN]: SIGN_LONGITUDES[Sign.PISCES],  // Saturn in 12th from Aries Moon -> SADE_SATI_RISING
          [Planet.JUPITER]: SIGN_LONGITUDES[Sign.TAURUS]  // Jupiter in 2nd from Aries Moon -> JUPITER_2ND_FROM_MOON
        }
      });

      const report = analyzeTransits({
        transit,
        natalPlanetLongitudes: {
          [Planet.SUN]: SIGN_LONGITUDES[Sign.TAURUS] // Transit Jupiter over natal Sun & transit Saturn 3rd aspect on Taurus (natal Sun)
        }
      });

      expect(report.results![Planet.SATURN]).toBeDefined();
      expect(report.results![Planet.JUPITER]).toBeDefined();

      const saturnResult = report.results![Planet.SATURN]!;
      const jupiterResult = report.results![Planet.JUPITER]!;

      expect(saturnResult.conditions).toContain(TransitCondition.SADE_SATI_RISING);
      expect(saturnResult.conditions).toContain(TransitCondition.TRANSIT_ASPECTS_NATAL_PLANET);

      expect(jupiterResult.conditions).toContain(TransitCondition.JUPITER_2ND_FROM_MOON);
      expect(jupiterResult.conditions).toContain(TransitCondition.TRANSIT_OVER_NATAL_PLANET);

      // Total evidence in report equals sum of per-planet evidence
      expect(report.evidence!.length).toBe(saturnResult.evidence!.length + jupiterResult.evidence!.length);
    });
  });

  it('shouldReturnNoConditionsWhenNoneApply', () => {
    const report = runAnalysis(Planet.JUPITER, SIGN_LONGITUDES[Sign.ARIES]);
    const jupResult = report.results![Planet.JUPITER]!;
    expect(jupResult.conditions).toEqual([]);
    expect(jupResult.evidence).toEqual([]);
  });

  it('shouldRejectNullInput', () => {
    expect(() => analyzeTransits(null as unknown as TransitAnalysisInput)).toThrow();
    expect(() => analyzeTransits({ transit: null as unknown as any, natalPlanetLongitudes: {} })).toThrow();
  });

  describe('Natal Longitude Validation', () => {
    it('should throw error when natal planet longitude is non-finite', () => {
      const transit = calculateTransit({
        at: atDate,
        natalMoonLongitude: ariesMoonLong,
        natalAscendantLongitude: ariesAscLong,
        transitLongitudes: { [Planet.SATURN]: SIGN_LONGITUDES[Sign.PISCES] }
      });

      expect(() =>
        analyzeTransits({
          transit,
          natalPlanetLongitudes: { [Planet.SUN]: Infinity }
        })
      ).toThrow('Natal longitude for SUN must be finite.');

      expect(() =>
        analyzeTransits({
          transit,
          natalPlanetLongitudes: { [Planet.MOON]: NaN }
        })
      ).toThrow('Natal longitude for MOON must be finite.');
    });

    it('should throw error for unknown natal planet key', () => {
      const transit = calculateTransit({
        at: atDate,
        natalMoonLongitude: ariesMoonLong,
        natalAscendantLongitude: ariesAscLong,
        transitLongitudes: { [Planet.SATURN]: SIGN_LONGITUDES[Sign.PISCES] }
      });

      expect(() =>
        analyzeTransits({
          transit,
          natalPlanetLongitudes: { ['PLUTO' as any]: 120 }
        })
      ).toThrow('Unknown natal planet: PLUTO');
    });

    it('should not throw when natalPlanetLongitudes is empty or absent', () => {
      const transit = calculateTransit({
        at: atDate,
        natalMoonLongitude: ariesMoonLong,
        natalAscendantLongitude: ariesAscLong,
        transitLongitudes: { [Planet.SATURN]: SIGN_LONGITUDES[Sign.PISCES] }
      });

      expect(() =>
        analyzeTransits({
          transit,
          natalPlanetLongitudes: {}
        })
      ).not.toThrow();

      expect(() =>
        analyzeTransits({
          transit
        })
      ).not.toThrow();
    });
  });

  it('shouldDefensivelyFreezeResults', () => {
    const report = runAnalysis(Planet.SATURN, SIGN_LONGITUDES[Sign.PISCES]);
    expect(Object.isFrozen(report)).toBe(true);
    expect(Object.isFrozen(report.results)).toBe(true);
    expect(Object.isFrozen(report.evidence)).toBe(true);

    const saturnResult = report.results![Planet.SATURN]!;
    expect(Object.isFrozen(saturnResult)).toBe(true);
    expect(Object.isFrozen(saturnResult.conditions)).toBe(true);
    expect(Object.isFrozen(saturnResult.evidence)).toBe(true);
    expect(Object.isFrozen(saturnResult.evidence[0])).toBe(true);
  });

  describe('Inline exact-set validation table', () => {
    const vectors: Array<{
      natalMoonSign: Sign;
      transitPlanet: Planet;
      transitSign: Sign;
      expectedConditions: TransitCondition[];
    }> = [
      // Saturn from Aries Moon
      { natalMoonSign: Sign.ARIES, transitPlanet: Planet.SATURN, transitSign: Sign.PISCES, expectedConditions: [TransitCondition.SADE_SATI_RISING] },
      { natalMoonSign: Sign.ARIES, transitPlanet: Planet.SATURN, transitSign: Sign.ARIES, expectedConditions: [TransitCondition.SADE_SATI_PEAK] },
      { natalMoonSign: Sign.ARIES, transitPlanet: Planet.SATURN, transitSign: Sign.TAURUS, expectedConditions: [TransitCondition.SADE_SATI_SETTING] },
      { natalMoonSign: Sign.ARIES, transitPlanet: Planet.SATURN, transitSign: Sign.GEMINI, expectedConditions: [TransitCondition.SATURN_3RD_FROM_MOON] },
      { natalMoonSign: Sign.ARIES, transitPlanet: Planet.SATURN, transitSign: Sign.CANCER, expectedConditions: [TransitCondition.KANTAKA_SHANI] },
      { natalMoonSign: Sign.ARIES, transitPlanet: Planet.SATURN, transitSign: Sign.LEO, expectedConditions: [] },
      { natalMoonSign: Sign.ARIES, transitPlanet: Planet.SATURN, transitSign: Sign.VIRGO, expectedConditions: [] },
      { natalMoonSign: Sign.ARIES, transitPlanet: Planet.SATURN, transitSign: Sign.LIBRA, expectedConditions: [] },
      { natalMoonSign: Sign.ARIES, transitPlanet: Planet.SATURN, transitSign: Sign.SCORPIO, expectedConditions: [TransitCondition.ASHTAMA_SHANI] },
      { natalMoonSign: Sign.ARIES, transitPlanet: Planet.SATURN, transitSign: Sign.SAGITTARIUS, expectedConditions: [] },
      { natalMoonSign: Sign.ARIES, transitPlanet: Planet.SATURN, transitSign: Sign.CAPRICORN, expectedConditions: [TransitCondition.SATURN_10TH_FROM_MOON] },
      { natalMoonSign: Sign.ARIES, transitPlanet: Planet.SATURN, transitSign: Sign.AQUARIUS, expectedConditions: [] },

      // Jupiter from Aries Moon
      { natalMoonSign: Sign.ARIES, transitPlanet: Planet.JUPITER, transitSign: Sign.ARIES, expectedConditions: [] },
      { natalMoonSign: Sign.ARIES, transitPlanet: Planet.JUPITER, transitSign: Sign.TAURUS, expectedConditions: [TransitCondition.JUPITER_2ND_FROM_MOON] },
      { natalMoonSign: Sign.ARIES, transitPlanet: Planet.JUPITER, transitSign: Sign.GEMINI, expectedConditions: [] },
      { natalMoonSign: Sign.ARIES, transitPlanet: Planet.JUPITER, transitSign: Sign.CANCER, expectedConditions: [] },
      { natalMoonSign: Sign.ARIES, transitPlanet: Planet.JUPITER, transitSign: Sign.LEO, expectedConditions: [TransitCondition.JUPITER_5TH_FROM_MOON] },
      { natalMoonSign: Sign.ARIES, transitPlanet: Planet.JUPITER, transitSign: Sign.VIRGO, expectedConditions: [] },
      { natalMoonSign: Sign.ARIES, transitPlanet: Planet.JUPITER, transitSign: Sign.LIBRA, expectedConditions: [TransitCondition.JUPITER_7TH_FROM_MOON] },
      { natalMoonSign: Sign.ARIES, transitPlanet: Planet.JUPITER, transitSign: Sign.SCORPIO, expectedConditions: [] },
      { natalMoonSign: Sign.ARIES, transitPlanet: Planet.JUPITER, transitSign: Sign.SAGITTARIUS, expectedConditions: [TransitCondition.JUPITER_9TH_FROM_MOON] },
      { natalMoonSign: Sign.ARIES, transitPlanet: Planet.JUPITER, transitSign: Sign.CAPRICORN, expectedConditions: [] },
      { natalMoonSign: Sign.ARIES, transitPlanet: Planet.JUPITER, transitSign: Sign.AQUARIUS, expectedConditions: [TransitCondition.JUPITER_11TH_FROM_MOON] },
      { natalMoonSign: Sign.ARIES, transitPlanet: Planet.JUPITER, transitSign: Sign.PISCES, expectedConditions: [] },
    ];

    vectors.forEach((v) => {
      it(`evaluates ${v.transitPlanet} in ${v.transitSign} for ${v.natalMoonSign} Moon`, () => {
        const natalMoonLong = SIGN_LONGITUDES[v.natalMoonSign];
        const transitLong = SIGN_LONGITUDES[v.transitSign];

        const transit = calculateTransit({
          at: atDate,
          natalMoonLongitude: natalMoonLong,
          natalAscendantLongitude: 0.0,
          transitLongitudes: { [v.transitPlanet]: transitLong }
        });

        const report = analyzeTransits({
          transit,
          natalPlanetLongitudes: {}
        });

        const planetResult = report.results ? report.results[v.transitPlanet] : undefined;
        const actualConditions = planetResult ? [...planetResult.conditions] : [];

        expect([...actualConditions].sort()).toEqual([...v.expectedConditions].sort());
      });
    });
  });
});
