import { describe, it, expect } from 'vitest';
import {
  Planet,
  Sign,
  AspectType,
  PlanetFact,
  PlanetFacts,
  Nakshatra,
  Pada,
  PlanetCondition,
  DignityStatus,
  NatalGrahaDrishti,
  NatalGrahaDrishtiReport,
  PlanetAnalysisEvidenceType
} from '../types';
import { SIGNS_METADATA, NAKSHATRAS_METADATA } from '../data/astroData';
import { analyzePlanets, PlanetAnalysisInput } from './planetAnalysis';

function createMockPlanetFacts(
  overrides?: Partial<
    Record<
      Planet,
      {
        house?: number;
        sign?: Sign;
        eclipticLongitude?: number;
        dignityStatus?: DignityStatus;
        retrograde?: boolean;
        condition?: PlanetCondition;
      }
    >
  >
): Record<Planet, PlanetFact> {
  const defaultMap: Record<Planet, { house: number; sign: Sign }> = {
    [Planet.SUN]: { house: 1, sign: Sign.ARIES },
    [Planet.MOON]: { house: 2, sign: Sign.TAURUS },
    [Planet.MARS]: { house: 3, sign: Sign.GEMINI },
    [Planet.MERCURY]: { house: 4, sign: Sign.CANCER },
    [Planet.JUPITER]: { house: 5, sign: Sign.LEO },
    [Planet.VENUS]: { house: 6, sign: Sign.VIRGO },
    [Planet.SATURN]: { house: 7, sign: Sign.LIBRA },
    [Planet.RAHU]: { house: 8, sign: Sign.SCORPIO },
    [Planet.KETU]: { house: 9, sign: Sign.SAGITTARIUS }
  };

  const result: Partial<Record<Planet, PlanetFact>> = {};
  for (const p of Object.values(Planet)) {
    const ov = overrides?.[p];
    const house = ov?.house ?? defaultMap[p].house;
    const sign = ov?.sign ?? defaultMap[p].sign;
    const eclipticLongitude = ov?.eclipticLongitude ?? (house - 1) * 30 + 15.12345;
    const dignityStatus = ov?.dignityStatus ?? DignityStatus.NEUTRAL;
    const retrograde = ov?.retrograde ?? false;
    const condition = ov?.condition ?? PlanetCondition.NORMAL;

    result[p] = {
      planet: p,
      position: {
        planet: p,
        eclipticLongitude,
        eclipticLatitude: 0,
        motion: { speed: 1, retrograde, stationary: false },
        sign,
        house,
        longitude: eclipticLongitude,
        signLongitude: eclipticLongitude % 30
      },
      sign,
      signMetadata: SIGNS_METADATA[sign],
      nakshatraResult: { nakshatra: NAKSHATRAS_METADATA[0] as any, pada: Pada.FIRST, padaNumber: 1 } as any,
      nakshatraMetadata: NAKSHATRAS_METADATA[0],
      state: { planet: p, motion: { speed: 1, retrograde, stationary: false }, condition },
      dignity: { planet: p, sign, status: dignityStatus },
      house
    };
  }
  return result as Record<Planet, PlanetFact>;
}

function createNatalGrahaDrishtiReport(aspects: any[] = []): NatalGrahaDrishtiReport {
  return {
    planetToPlanetAspects: aspects as any,
    planetToHouseAspects: [],
    aspectsReceivedByPlanet: {} as any,
    aspectsReceivedByHouse: {} as any,
    summary: [],
    aspects: aspects as any
  };
}

describe('Planet Analysis Aggregation Layer (P-03)', () => {
  it('shouldAnalyzeAllNinePlanets', () => {
    const pf = createMockPlanetFacts();
    const dr = createNatalGrahaDrishtiReport();
    const report = analyzePlanets({ planetFacts: pf, natalGrahaDrishti: dr });

    const planetKeys = Object.keys(report.planets);
    expect(planetKeys.length).toBe(9);

    for (const p of Object.values(Planet)) {
      expect(report.planets[p]).toBeDefined();
      expect(report.planets[p].planet).toBe(p);
    }
  });

  it('shouldPreservePlanetSignHouseLongitude', () => {
    const pf = createMockPlanetFacts({
      [Planet.MARS]: { house: 10, sign: Sign.CAPRICORN, eclipticLongitude: 282.54321 }
    });
    const dr = createNatalGrahaDrishtiReport();
    const report = analyzePlanets({ planetFacts: pf, natalGrahaDrishti: dr });

    const mars = report.planets[Planet.MARS];
    expect(mars.sign).toBe(Sign.CAPRICORN);
    expect(mars.house).toBe(10);
    expect(mars.longitude).toBe(282.54321);
  });

  it('shouldPreserveNakshatra', () => {
    const pf = createMockPlanetFacts();
    const dr = createNatalGrahaDrishtiReport();
    const report = analyzePlanets({ planetFacts: pf, natalGrahaDrishti: dr });

    const mars = report.planets[Planet.MARS];
    expect(mars.nakshatraResult).toEqual(pf[Planet.MARS].nakshatraResult);
    expect(mars.nakshatraMetadata).toEqual(pf[Planet.MARS].nakshatraMetadata);
  });

  it('shouldPreserveDignity', () => {
    const pf = createMockPlanetFacts({
      [Planet.MARS]: { dignityStatus: DignityStatus.EXALTED }
    });
    const dr = createNatalGrahaDrishtiReport();
    const report = analyzePlanets({ planetFacts: pf, natalGrahaDrishti: dr });

    const mars = report.planets[Planet.MARS];
    expect(mars.dignity.status).toBe(DignityStatus.EXALTED);
    expect(mars.dignity).toEqual(pf[Planet.MARS].dignity);
  });

  it('shouldPreserveRetrogradeState', () => {
    const pf = createMockPlanetFacts({
      [Planet.MARS]: { retrograde: true }
    });
    const dr = createNatalGrahaDrishtiReport();
    const report = analyzePlanets({ planetFacts: pf, natalGrahaDrishti: dr });

    const mars = report.planets[Planet.MARS];
    expect(mars.state.motion.retrograde).toBe(true);
    expect(mars.state).toEqual(pf[Planet.MARS].state);
  });

  it('shouldPreservePlanetCondition', () => {
    const pf = createMockPlanetFacts({
      [Planet.MARS]: { condition: PlanetCondition.COMBUST }
    });
    const dr = createNatalGrahaDrishtiReport();
    const report = analyzePlanets({ planetFacts: pf, natalGrahaDrishti: dr });

    const mars = report.planets[Planet.MARS];
    expect(mars.state.condition).toBe(PlanetCondition.COMBUST);
    expect(mars.state).toEqual(pf[Planet.MARS].state);
  });

  it('shouldPreserveCompleteAspectEvidence', () => {
    const fullAspect: any = {
      sourcePlanet: Planet.MARS,
      targetPlanet: Planet.SATURN,
      sourceHouse: 1,
      targetHouse: 4,
      sourceSign: Sign.ARIES,
      targetSign: Sign.CANCER,
      houseOffset: 3,
      aspectType: AspectType.SPECIAL_4TH,
      description: 'Mars in House 1 casts 4th aspect on Saturn in House 4.',
      reason: 'Mars occupies House 1 and its 4th Graha Drishti falls on House 4.'
    };

    const pf = createMockPlanetFacts();
    const dr = createNatalGrahaDrishtiReport([fullAspect]);
    const report = analyzePlanets({ planetFacts: pf, natalGrahaDrishti: dr });

    const marsCast = report.planets[Planet.MARS].castAspects?.[0];
    const saturnReceived = report.planets[Planet.SATURN].receivedAspects?.[0];

    expect(marsCast).toEqual(fullAspect);
    expect(saturnReceived).toEqual(fullAspect);
    expect(marsCast?.sourcePlanet).toBe(Planet.MARS);
    expect(marsCast?.targetPlanet).toBe(Planet.SATURN);
    expect(marsCast?.sourceHouse).toBe(1);
    expect(marsCast?.targetHouse).toBe(4);
    expect(marsCast?.sourceSign).toBe(Sign.ARIES);
    expect(marsCast?.targetSign).toBe(Sign.CANCER);
    expect(marsCast?.houseOffset).toBe(3);
    expect(marsCast?.aspectType).toBe(AspectType.SPECIAL_4TH);
    expect(marsCast?.description).toBe('Mars in House 1 casts 4th aspect on Saturn in House 4.');
    expect(marsCast?.reason).toBe('Mars occupies House 1 and its 4th Graha Drishti falls on House 4.');
  });

  it('shouldPreserveCastAspects', () => {
    const marsToSaturn: any = {
      sourcePlanet: Planet.MARS,
      targetPlanet: Planet.SATURN,
      sourceHouse: 1,
      targetHouse: 4,
      sourceSign: Sign.ARIES,
      targetSign: Sign.CANCER,
      houseOffset: 3,
      aspectType: AspectType.SPECIAL_4TH,
      description: 'Mars in House 1 casts 4th aspect on Saturn in House 4.',
      reason: 'Mars occupies House 1 and its 4th Graha Drishti falls on House 4.'
    };

    const pf = createMockPlanetFacts();
    const dr = createNatalGrahaDrishtiReport([marsToSaturn]);
    const report = analyzePlanets({ planetFacts: pf, natalGrahaDrishti: dr });

    const mars = report.planets[Planet.MARS];
    expect(mars.castAspects?.length).toBe(1);
    expect(mars.castAspects?.[0]).toEqual(marsToSaturn);
  });

  it('shouldPreserveReceivedAspects', () => {
    const marsToSaturn: any = {
      sourcePlanet: Planet.MARS,
      targetPlanet: Planet.SATURN,
      sourceHouse: 1,
      targetHouse: 4,
      sourceSign: Sign.ARIES,
      targetSign: Sign.CANCER,
      houseOffset: 3,
      aspectType: AspectType.SPECIAL_4TH,
      description: 'Mars in House 1 casts 4th aspect on Saturn in House 4.',
      reason: 'Mars occupies House 1 and its 4th Graha Drishti falls on House 4.'
    };

    const pf = createMockPlanetFacts();
    const dr = createNatalGrahaDrishtiReport([marsToSaturn]);
    const report = analyzePlanets({ planetFacts: pf, natalGrahaDrishti: dr });

    const saturn = report.planets[Planet.SATURN];
    expect(saturn.receivedAspects?.length).toBe(1);
    expect(saturn.receivedAspects?.[0]).toEqual(marsToSaturn);
  });

  it('shouldPreserveAspectDirection', () => {
    const marsToSaturn: any = {
      sourcePlanet: Planet.MARS,
      targetPlanet: Planet.SATURN,
      sourceHouse: 1,
      targetHouse: 4,
      sourceSign: Sign.ARIES,
      targetSign: Sign.CANCER,
      houseOffset: 3,
      aspectType: AspectType.SPECIAL_4TH,
      description: 'Mars in House 1 casts 4th aspect on Saturn in House 4.',
      reason: 'Mars occupies House 1 and its 4th Graha Drishti falls on House 4.'
    };

    const pf = createMockPlanetFacts();
    const dr = createNatalGrahaDrishtiReport([marsToSaturn]);
    const report = analyzePlanets({ planetFacts: pf, natalGrahaDrishti: dr });

    const mars = report.planets[Planet.MARS];
    const saturn = report.planets[Planet.SATURN];

    expect(mars.castAspects?.length).toBe(1);
    expect(mars.receivedAspects?.length).toBe(0);

    expect(saturn.castAspects?.length).toBe(0);
    expect(saturn.receivedAspects?.length).toBe(1);
  });

  it('shouldPreserveAspectType', () => {
    const jupToVenus: any = {
      sourcePlanet: Planet.JUPITER,
      targetPlanet: Planet.VENUS,
      sourceHouse: 1,
      targetHouse: 5,
      sourceSign: Sign.ARIES,
      targetSign: Sign.LEO,
      houseOffset: 4,
      aspectType: AspectType.SPECIAL_5TH,
      description: 'Jupiter in House 1 casts 5th aspect on Venus in House 5.',
      reason: 'Jupiter occupies House 1 and its 5th Graha Drishti falls on House 5.'
    };

    const pf = createMockPlanetFacts();
    const dr = createNatalGrahaDrishtiReport([jupToVenus]);
    const report = analyzePlanets({ planetFacts: pf, natalGrahaDrishti: dr });

    const jupiter = report.planets[Planet.JUPITER];
    expect(jupiter.castAspects?.[0]?.aspectType).toBe(AspectType.SPECIAL_5TH);
  });

  it('shouldCreateSignPlacementEvidence', () => {
    const pf = createMockPlanetFacts({
      [Planet.SUN]: { sign: Sign.ARIES, house: 1 }
    });
    const dr = createNatalGrahaDrishtiReport();
    const report = analyzePlanets({ planetFacts: pf, natalGrahaDrishti: dr });

    const sunEv = report.planets[Planet.SUN].evidence;
    const signEv = sunEv.find((e) => e.type === PlanetAnalysisEvidenceType.SIGN_PLACEMENT);

    expect(signEv).toBeDefined();
    expect(signEv?.ruleId).toBe('PLANET_SIGN_PLACEMENT');
    expect(signEv?.reason).toContain('Sun occupies Aries.');
  });

  it('shouldCreateHousePlacementEvidence', () => {
    const pf = createMockPlanetFacts({
      [Planet.SUN]: { sign: Sign.ARIES, house: 1 }
    });
    const dr = createNatalGrahaDrishtiReport();
    const report = analyzePlanets({ planetFacts: pf, natalGrahaDrishti: dr });

    const sunEv = report.planets[Planet.SUN].evidence;
    const houseEv = sunEv.find((e) => e.type === PlanetAnalysisEvidenceType.HOUSE_PLACEMENT);

    expect(houseEv).toBeDefined();
    expect(houseEv?.ruleId).toBe('PLANET_HOUSE_PLACEMENT');
    expect(houseEv?.reason).toBe('Sun occupies House 1.');
  });

  it('shouldCreateAspectCastEvidence', () => {
    const aspect: any = {
      sourcePlanet: Planet.MARS,
      targetPlanet: Planet.SATURN,
      sourceHouse: 1,
      targetHouse: 4,
      sourceSign: Sign.ARIES,
      targetSign: Sign.CANCER,
      houseOffset: 3,
      aspectType: AspectType.SPECIAL_4TH,
      description: 'Mars in House 1 casts 4th aspect on Saturn in House 4.',
      reason: 'Mars occupies House 1 and its 4th Graha Drishti falls on House 4.'
    };

    const pf = createMockPlanetFacts();
    const dr = createNatalGrahaDrishtiReport([aspect]);
    const report = analyzePlanets({ planetFacts: pf, natalGrahaDrishti: dr });

    const marsEv = report.planets[Planet.MARS].evidence;
    const castEv = marsEv.find((e) => e.type === PlanetAnalysisEvidenceType.ASPECT_CAST);

    expect(castEv).toBeDefined();
    expect(castEv?.ruleId).toBe('PLANET_ASPECT_CAST');
    expect(castEv?.reason).toBe(aspect.reason);
  });

  it('shouldCreateAspectReceivedEvidence', () => {
    const aspect: any = {
      sourcePlanet: Planet.MARS,
      targetPlanet: Planet.SATURN,
      sourceHouse: 1,
      targetHouse: 4,
      sourceSign: Sign.ARIES,
      targetSign: Sign.CANCER,
      houseOffset: 3,
      aspectType: AspectType.SPECIAL_4TH,
      description: 'Mars in House 1 casts 4th aspect on Saturn in House 4.',
      reason: 'Mars occupies House 1 and its 4th Graha Drishti falls on House 4.'
    };

    const pf = createMockPlanetFacts();
    const dr = createNatalGrahaDrishtiReport([aspect]);
    const report = analyzePlanets({ planetFacts: pf, natalGrahaDrishti: dr });

    const saturnEv = report.planets[Planet.SATURN].evidence;
    const receivedEv = saturnEv.find((e) => e.type === PlanetAnalysisEvidenceType.ASPECT_RECEIVED);

    expect(receivedEv).toBeDefined();
    expect(receivedEv?.ruleId).toBe('PLANET_ASPECT_RECEIVED');
    expect(receivedEv?.reason).toBe(aspect.reason);
  });

  it('shouldPreserveRuleIds', () => {
    const pf = createMockPlanetFacts({
      [Planet.MARS]: {
        dignityStatus: DignityStatus.EXALTED,
        retrograde: true,
        condition: PlanetCondition.COMBUST
      }
    });
    const dr = createNatalGrahaDrishtiReport();
    const report = analyzePlanets({ planetFacts: pf, natalGrahaDrishti: dr });

    const ruleIds = report.planets[Planet.MARS].evidence.map((e) => e.ruleId);
    expect(ruleIds).toContain('PLANET_SIGN_PLACEMENT');
    expect(ruleIds).toContain('PLANET_HOUSE_PLACEMENT');
    expect(ruleIds).toContain('PLANET_NAKSHATRA_PLACEMENT');
    expect(ruleIds).toContain('PLANET_DIGNITY');
    expect(ruleIds).toContain('PLANET_RETROGRADE');
    expect(ruleIds).toContain('PLANET_COMBUSTION');
  });

  it('shouldPreserveReasons', () => {
    const pf = createMockPlanetFacts();
    const dr = createNatalGrahaDrishtiReport();
    const report = analyzePlanets({ planetFacts: pf, natalGrahaDrishti: dr });

    for (const p of Object.values(Planet)) {
      for (const ev of report.planets[p].evidence) {
        expect(typeof ev.reason).toBe('string');
        expect(ev.reason?.length).toBeGreaterThan(0);
      }
    }
  });

  it('shouldNotCreateDuplicateAspectEvidence', () => {
    const aspect: any = {
      sourcePlanet: Planet.SUN,
      targetPlanet: Planet.SATURN,
      sourceHouse: 1,
      targetHouse: 7,
      sourceSign: Sign.ARIES,
      targetSign: Sign.LIBRA,
      houseOffset: 6,
      aspectType: AspectType.FULL_7TH,
      description: 'Sun in House 1 casts 7th aspect on Saturn in House 7.',
      reason: 'Sun occupies House 1 and its 7th Graha Drishti falls on House 7.'
    };

    const pf = createMockPlanetFacts();
    const dr = createNatalGrahaDrishtiReport([aspect]);
    const report = analyzePlanets({ planetFacts: pf, natalGrahaDrishti: dr });

    const sunCast = report.planets[Planet.SUN].evidence.filter(
      (e) => e.type === PlanetAnalysisEvidenceType.ASPECT_CAST
    );
    const saturnReceived = report.planets[Planet.SATURN].evidence.filter(
      (e) => e.type === PlanetAnalysisEvidenceType.ASPECT_RECEIVED
    );

    expect(sunCast.length).toBe(1);
    expect(saturnReceived.length).toBe(1);
  });

  it('multipleAspectsTest', () => {
    const aspect1: any = {
      sourcePlanet: Planet.MARS,
      targetPlanet: Planet.JUPITER,
      sourceHouse: 1,
      targetHouse: 4,
      sourceSign: Sign.ARIES,
      targetSign: Sign.CANCER,
      houseOffset: 3,
      aspectType: AspectType.SPECIAL_4TH,
      description: 'Mars in House 1 casts 4th aspect on Jupiter in House 4.',
      reason: 'Mars occupies House 1 and its 4th Graha Drishti falls on House 4.'
    };

    const aspect2: any = {
      sourcePlanet: Planet.MARS,
      targetPlanet: Planet.SATURN,
      sourceHouse: 1,
      targetHouse: 8,
      sourceSign: Sign.ARIES,
      targetSign: Sign.SCORPIO,
      houseOffset: 7,
      aspectType: AspectType.SPECIAL_8TH,
      description: 'Mars in House 1 casts 8th aspect on Saturn in House 8.',
      reason: 'Mars occupies House 1 and its 8th Graha Drishti falls on House 8.'
    };

    const pf = createMockPlanetFacts();
    const dr = createNatalGrahaDrishtiReport([aspect1, aspect2]);
    const report = analyzePlanets({ planetFacts: pf, natalGrahaDrishti: dr });

    const mars = report.planets[Planet.MARS];
    expect(mars.castAspects?.length).toBe(2);
    expect(mars.evidence.filter((e) => e.type === PlanetAnalysisEvidenceType.ASPECT_CAST).length).toBe(2);
  });

  it('emptyAspectsTest', () => {
    const pf = createMockPlanetFacts();
    const dr = createNatalGrahaDrishtiReport([]);
    const report = analyzePlanets({ planetFacts: pf, natalGrahaDrishti: dr });

    for (const p of Object.values(Planet)) {
      expect(report.planets[p].castAspects?.length).toBe(0);
      expect(report.planets[p].receivedAspects?.length).toBe(0);
    }
  });

  it('shouldRejectMissingPlanetFacts', () => {
    const dr = createNatalGrahaDrishtiReport();

    expect(() => analyzePlanets(null as unknown as PlanetAnalysisInput)).toThrow(
      'input must not be null or undefined.'
    );

    expect(() =>
      analyzePlanets({ planetFacts: null as unknown as Record<Planet, PlanetFact>, natalGrahaDrishti: dr })
    ).toThrow('planetFacts must not be null or undefined.');

    const pfIncomplete = createMockPlanetFacts();
    delete (pfIncomplete as any)[Planet.MARS];

    expect(() => analyzePlanets({ planetFacts: pfIncomplete, natalGrahaDrishti: dr })).toThrow(
      'planetFacts is missing required planet: MARS.'
    );
  });

  it('shouldRejectMissingNatalGrahaDrishti', () => {
    const pf = createMockPlanetFacts();

    expect(() =>
      analyzePlanets({
        planetFacts: pf,
        natalGrahaDrishti: null as unknown as NatalGrahaDrishtiReport
      })
    ).toThrow('natalGrahaDrishti must not be null or undefined.');
  });

  it('shouldNotMutateInput', () => {
    const pf = createMockPlanetFacts();
    const dr = createNatalGrahaDrishtiReport();

    const pfClone = JSON.parse(JSON.stringify(pf));
    const drClone = JSON.parse(JSON.stringify(dr));

    analyzePlanets({ planetFacts: pf, natalGrahaDrishti: dr });

    expect(pf).toEqual(pfClone);
    expect(dr).toEqual(drClone);
  });

  it('shouldRemainImmutable', () => {
    const pf = createMockPlanetFacts();
    const dr = createNatalGrahaDrishtiReport();
    const report = analyzePlanets({ planetFacts: pf, natalGrahaDrishti: dr });

    expect(Object.isFrozen(report)).toBe(true);
    expect(Object.isFrozen(report.planets)).toBe(true);

    const sun = report.planets[Planet.SUN];
    expect(Object.isFrozen(sun)).toBe(true);
    expect(Object.isFrozen(sun.castAspects)).toBe(true);
    expect(Object.isFrozen(sun.receivedAspects)).toBe(true);
    expect(Object.isFrozen(sun.evidence)).toBe(true);
  });

  it('shouldDeepFreezeNestedPlanetFacts', () => {
    const aspect: any = {
      sourcePlanet: Planet.MARS,
      targetPlanet: Planet.SATURN,
      sourceHouse: 1,
      targetHouse: 4,
      sourceSign: Sign.ARIES,
      targetSign: Sign.CANCER,
      houseOffset: 3,
      aspectType: AspectType.SPECIAL_4TH,
      description: 'Mars in House 1 casts 4th aspect on Saturn in House 4.',
      reason: 'Mars occupies House 1 and its 4th Graha Drishti falls on House 4.'
    };
    const pf = createMockPlanetFacts();
    const dr = createNatalGrahaDrishtiReport([aspect]);
    const report = analyzePlanets({ planetFacts: pf, natalGrahaDrishti: dr });

    const mars = report.planets[Planet.MARS];
    expect(Object.isFrozen(mars.nakshatraResult)).toBe(true);
    expect(Object.isFrozen(mars.nakshatraMetadata)).toBe(true);
    expect(Object.isFrozen(mars.dignity)).toBe(true);
    expect(Object.isFrozen(mars.state)).toBe(true);
    expect(Object.isFrozen(mars.state?.motion)).toBe(true);
    expect(Object.isFrozen(mars.castAspects?.[0])).toBe(true);
  });

  it('shouldNotShareMutableNestedReferences', () => {
    const aspect: any = {
      sourcePlanet: Planet.MARS,
      targetPlanet: Planet.SATURN,
      sourceHouse: 1,
      targetHouse: 4,
      sourceSign: Sign.ARIES,
      targetSign: Sign.CANCER,
      houseOffset: 3,
      aspectType: AspectType.SPECIAL_4TH,
      description: 'Mars in House 1 casts 4th aspect on Saturn in House 4.',
      reason: 'Mars occupies House 1 and its 4th Graha Drishti falls on House 4.'
    };
    const pf = createMockPlanetFacts();
    const dr = createNatalGrahaDrishtiReport([aspect]);
    const report = analyzePlanets({ planetFacts: pf, natalGrahaDrishti: dr });

    const marsInput: any = pf[Planet.MARS];
    const marsOutput = report.planets[Planet.MARS];

    expect(marsOutput.state).not.toBe(marsInput.state);
    expect(marsOutput.state?.motion).not.toBe(marsInput.state?.motion);
    expect(marsOutput.dignity).not.toBe(marsInput.dignity);
    expect(marsOutput.nakshatraResult).not.toBe(marsInput.nakshatraResult);
    expect(marsOutput.castAspects?.[0]).not.toBe(dr.aspects?.[0]);
  });

  it('shouldReturnDeterministicOrder', () => {
    const pf = createMockPlanetFacts();
    const dr = createNatalGrahaDrishtiReport();

    const run1 = analyzePlanets({ planetFacts: pf, natalGrahaDrishti: dr });
    const run2 = analyzePlanets({ planetFacts: pf, natalGrahaDrishti: dr });

    expect(run1).toEqual(run2);
  });
});
