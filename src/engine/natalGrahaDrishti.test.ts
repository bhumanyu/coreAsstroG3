import { describe, it, expect } from 'vitest';
import {
  Planet,
  Sign,
  AspectType,
  PlanetFacts,
  PlanetFact,
  Nakshatra,
  Pada,
  PlanetCondition,
  DignityStatus
} from '../types';
import { SIGNS_METADATA, NAKSHATRAS_METADATA } from '../data/astroData';
import { analyzeNatalGrahaDrishti } from './natalGrahaDrishti';
import { getGrahaDrishtiOffsets } from './transitEngine';

function createMockPlanetFacts(
  overrides?: Partial<Record<Planet, { house: number; sign?: Sign; eclipticLongitude?: number }>>
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
    const eclipticLongitude = ov?.eclipticLongitude ?? (house - 1) * 30 + 15;

    result[p] = {
      planet: p,
      position: {
        planet: p,
        eclipticLongitude,
        longitude: eclipticLongitude,
        sign,
        house,
        signLongitude: eclipticLongitude % 30,
        eclipticLatitude: 0,
        motion: { speed: 1, retrograde: false, stationary: false }
      },
      sign,
      signMetadata: SIGNS_METADATA[sign],
      nakshatraResult: { nakshatra: Nakshatra.ASHWINI, pada: Pada.FIRST, padaNumber: 1 },
      nakshatraMetadata: NAKSHATRAS_METADATA[0],
      state: { planet: p, motion: { speed: 1, retrograde: false, stationary: false }, condition: PlanetCondition.NORMAL },
      dignity: { planet: p, sign, status: DignityStatus.NEUTRAL },
      house
    };
  }
  return result as Record<Planet, PlanetFact>;
}

describe('Natal Graha Drishti Analysis Layer', () => {
  it('shouldDetectSeventhAspect', () => {
    // Sun in House 1, Saturn in House 7
    const pf = createMockPlanetFacts({
      [Planet.SUN]: { house: 1, sign: Sign.ARIES },
      [Planet.SATURN]: { house: 7, sign: Sign.LIBRA }
    });

    const report = analyzeNatalGrahaDrishti(pf);
    const sunToSaturn = report.aspects.find(
      a => a.sourcePlanet === Planet.SUN && a.targetPlanet === Planet.SATURN
    );

    expect(sunToSaturn).toBeDefined();
    expect(sunToSaturn?.sourcePlanet).toBe(Planet.SUN);
    expect(sunToSaturn?.targetPlanet).toBe(Planet.SATURN);
    expect(sunToSaturn?.sourceHouse).toBe(1);
    expect(sunToSaturn?.targetHouse).toBe(7);
    expect(sunToSaturn?.sourceSign).toBe(Sign.ARIES);
    expect(sunToSaturn?.targetSign).toBe(Sign.LIBRA);
    expect(sunToSaturn?.houseOffset).toBe(6);
    expect(sunToSaturn?.aspectType).toBe(AspectType.FULL_7TH);
    expect(sunToSaturn?.description).toBe('Sun in House 1 casts 7th aspect on Saturn in House 7.');
    expect(sunToSaturn?.reason).toBe('Sun occupies House 1 and its 7th Graha Drishti falls on House 7.');
  });

  it('shouldDetectMarsFourthAspect', () => {
    // Mars in H1, Jupiter in H4
    const pf = createMockPlanetFacts({
      [Planet.MARS]: { house: 1, sign: Sign.ARIES },
      [Planet.JUPITER]: { house: 4, sign: Sign.CANCER }
    });

    const report = analyzeNatalGrahaDrishti(pf);
    const marsToJupiter = report.aspects.find(
      a => a.sourcePlanet === Planet.MARS && a.targetPlanet === Planet.JUPITER
    );

    expect(marsToJupiter).toBeDefined();
    expect(marsToJupiter?.houseOffset).toBe(3);
    expect(marsToJupiter?.aspectType).toBe(AspectType.SPECIAL_4TH);
    expect(marsToJupiter?.description).toBe('Mars in House 1 casts 4th aspect on Jupiter in House 4.');
  });

  it('shouldDetectMarsEighthAspect', () => {
    // Mars in H1, Jupiter in H8
    const pf = createMockPlanetFacts({
      [Planet.MARS]: { house: 1, sign: Sign.ARIES },
      [Planet.JUPITER]: { house: 8, sign: Sign.SCORPIO }
    });

    const report = analyzeNatalGrahaDrishti(pf);
    const marsToJupiter = report.aspects.find(
      a => a.sourcePlanet === Planet.MARS && a.targetPlanet === Planet.JUPITER
    );

    expect(marsToJupiter).toBeDefined();
    expect(marsToJupiter?.houseOffset).toBe(7);
    expect(marsToJupiter?.aspectType).toBe(AspectType.SPECIAL_8TH);
    expect(marsToJupiter?.description).toBe('Mars in House 1 casts 8th aspect on Jupiter in House 8.');
  });

  it('shouldDetectJupiterFifthAspect', () => {
    // Jupiter in H1, Venus in H5
    const pf = createMockPlanetFacts({
      [Planet.JUPITER]: { house: 1, sign: Sign.ARIES },
      [Planet.VENUS]: { house: 5, sign: Sign.LEO }
    });

    const report = analyzeNatalGrahaDrishti(pf);
    const jupToVenus = report.aspects.find(
      a => a.sourcePlanet === Planet.JUPITER && a.targetPlanet === Planet.VENUS
    );

    expect(jupToVenus).toBeDefined();
    expect(jupToVenus?.houseOffset).toBe(4);
    expect(jupToVenus?.aspectType).toBe(AspectType.SPECIAL_5TH);
    expect(jupToVenus?.description).toBe('Jupiter in House 1 casts 5th aspect on Venus in House 5.');
  });

  it('shouldDetectJupiterNinthAspect', () => {
    // Jupiter in H1, Venus in H9
    const pf = createMockPlanetFacts({
      [Planet.JUPITER]: { house: 1, sign: Sign.ARIES },
      [Planet.VENUS]: { house: 9, sign: Sign.SAGITTARIUS }
    });

    const report = analyzeNatalGrahaDrishti(pf);
    const jupToVenus = report.aspects.find(
      a => a.sourcePlanet === Planet.JUPITER && a.targetPlanet === Planet.VENUS
    );

    expect(jupToVenus).toBeDefined();
    expect(jupToVenus?.houseOffset).toBe(8);
    expect(jupToVenus?.aspectType).toBe(AspectType.SPECIAL_9TH);
    expect(jupToVenus?.description).toBe('Jupiter in House 1 casts 9th aspect on Venus in House 9.');
  });

  it('shouldDetectSaturnThirdAspect', () => {
    // Saturn in H1, Moon in H3
    const pf = createMockPlanetFacts({
      [Planet.SATURN]: { house: 1, sign: Sign.ARIES },
      [Planet.MOON]: { house: 3, sign: Sign.GEMINI }
    });

    const report = analyzeNatalGrahaDrishti(pf);
    const satToMoon = report.aspects.find(
      a => a.sourcePlanet === Planet.SATURN && a.targetPlanet === Planet.MOON
    );

    expect(satToMoon).toBeDefined();
    expect(satToMoon?.houseOffset).toBe(2);
    expect(satToMoon?.aspectType).toBe(AspectType.SPECIAL_3RD);
    expect(satToMoon?.description).toBe('Saturn in House 1 casts 3rd aspect on Moon in House 3.');
  });

  it('shouldDetectSaturnTenthAspect', () => {
    // Saturn in H1, Moon in H10
    const pf = createMockPlanetFacts({
      [Planet.SATURN]: { house: 1, sign: Sign.ARIES },
      [Planet.MOON]: { house: 10, sign: Sign.CAPRICORN }
    });

    const report = analyzeNatalGrahaDrishti(pf);
    const satToMoon = report.aspects.find(
      a => a.sourcePlanet === Planet.SATURN && a.targetPlanet === Planet.MOON
    );

    expect(satToMoon).toBeDefined();
    expect(satToMoon?.houseOffset).toBe(9);
    expect(satToMoon?.aspectType).toBe(AspectType.SPECIAL_10TH);
    expect(satToMoon?.description).toBe('Saturn in House 1 casts 10th aspect on Moon in House 10.');
  });

  it('shouldDetectOnlySeventhAspectForSun/Moon/Mercury/Venus/Rahu/Ketu', () => {
    const single7thPlanets = [
      Planet.SUN,
      Planet.MOON,
      Planet.MERCURY,
      Planet.VENUS,
      Planet.RAHU,
      Planet.KETU
    ];

    for (const p of single7thPlanets) {
      // Place planet p in House 1, target A in House 7, target B in House 4, target C in House 5
      const pf = createMockPlanetFacts({
        [p]: { house: 1, sign: Sign.ARIES },
        [Planet.MARS]: { house: 7, sign: Sign.LIBRA },
        [Planet.JUPITER]: { house: 4, sign: Sign.CANCER },
        [Planet.SATURN]: { house: 5, sign: Sign.LEO }
      });

      const report = analyzeNatalGrahaDrishti(pf);
      const aspectsFromP = report.aspects.filter(a => a.sourcePlanet === p);

      // Should cast 7th aspect on Mars (House 7), but NO aspect on Jupiter (House 4) or Saturn (House 5)
      expect(aspectsFromP.length).toBe(1);
      expect(aspectsFromP[0].targetPlanet).toBe(Planet.MARS);
      expect(aspectsFromP[0].aspectType).toBe(AspectType.FULL_7TH);
    }
  });

  it('shouldNotTreatConjunctionAsAspect', () => {
    // Mars in H1, Saturn in H1 (conjunction)
    const pf = createMockPlanetFacts({
      [Planet.MARS]: { house: 1, sign: Sign.ARIES },
      [Planet.SATURN]: { house: 1, sign: Sign.ARIES }
    });

    const report = analyzeNatalGrahaDrishti(pf);
    const marsToSaturn = report.aspects.find(
      a => a.sourcePlanet === Planet.MARS && a.targetPlanet === Planet.SATURN
    );
    const saturnToMars = report.aspects.find(
      a => a.sourcePlanet === Planet.SATURN && a.targetPlanet === Planet.MARS
    );

    expect(marsToSaturn).toBeUndefined();
    expect(saturnToMars).toBeUndefined();
  });

  it('shouldNotUseLongitudeProximity', () => {
    // 1. Same whole-sign house at 1° vs 29° -> no record (conjunction, offset 0)
    const pfSameHouse = createMockPlanetFacts({
      [Planet.SUN]: { house: 1, sign: Sign.ARIES, eclipticLongitude: 1 },
      [Planet.MOON]: { house: 1, sign: Sign.ARIES, eclipticLongitude: 29 }
    });
    const reportSameHouse = analyzeNatalGrahaDrishti(pfSameHouse);
    const sunMoonSame = reportSameHouse.aspects.find(
      a =>
        (a.sourcePlanet === Planet.SUN && a.targetPlanet === Planet.MOON) ||
        (a.sourcePlanet === Planet.MOON && a.targetPlanet === Planet.SUN)
    );
    expect(sunMoonSame).toBeUndefined();

    // 2. Aspecting houses with non-classical degree difference -> aspect still detected
    // Mars in H1 at 29° (longitude 29°), Jupiter in H4 at 1° (longitude 91°).
    // Degree difference is 62° (far from 90° exact orb), but whole-sign house offset is 3 (4th house).
    const pfAspecting = createMockPlanetFacts({
      [Planet.MARS]: { house: 1, sign: Sign.ARIES, eclipticLongitude: 29 },
      [Planet.JUPITER]: { house: 4, sign: Sign.CANCER, eclipticLongitude: 91 }
    });
    const reportAspecting = analyzeNatalGrahaDrishti(pfAspecting);
    const marsJup = reportAspecting.aspects.find(
      a => a.sourcePlanet === Planet.MARS && a.targetPlanet === Planet.JUPITER
    );
    expect(marsJup).toBeDefined();
    expect(marsJup?.aspectType).toBe(AspectType.SPECIAL_4TH);
  });

  it('shouldPreserveDirectionalAspects', () => {
    // Mars in H1 & Saturn in H4 -> Mars casts SPECIAL_4TH on Saturn, Saturn casts SPECIAL_10TH on Mars
    const pf = createMockPlanetFacts({
      [Planet.MARS]: { house: 1, sign: Sign.ARIES },
      [Planet.SATURN]: { house: 4, sign: Sign.CANCER }
    });

    const report = analyzeNatalGrahaDrishti(pf);
    const marsToSaturn = report.aspects.find(
      a => a.sourcePlanet === Planet.MARS && a.targetPlanet === Planet.SATURN
    );
    const saturnToMars = report.aspects.find(
      a => a.sourcePlanet === Planet.SATURN && a.targetPlanet === Planet.MARS
    );

    expect(marsToSaturn).toBeDefined();
    expect(marsToSaturn?.aspectType).toBe(AspectType.SPECIAL_4TH);

    expect(saturnToMars).toBeDefined();
    expect(saturnToMars?.aspectType).toBe(AspectType.SPECIAL_10TH);
  });

  it('shouldPreserveMutualAspectsAsTwoRecords', () => {
    // Sun in H1, Moon in H7 -> two FULL_7TH records (Sun->Moon and Moon->Sun)
    const pf = createMockPlanetFacts({
      [Planet.SUN]: { house: 1, sign: Sign.ARIES },
      [Planet.MOON]: { house: 7, sign: Sign.LIBRA }
    });

    const report = analyzeNatalGrahaDrishti(pf);
    const sunToMoon = report.aspects?.find(
      a => a.sourcePlanet === Planet.SUN && a.targetPlanet === Planet.MOON
    );
    const moonToSun = report.aspects?.find(
      a => a.sourcePlanet === Planet.MOON && a.targetPlanet === Planet.SUN
    );

    expect(sunToMoon).toBeDefined();
    expect(sunToMoon?.aspectType).toBe(AspectType.FULL_7TH);
    expect(moonToSun).toBeDefined();
    expect(moonToSun?.aspectType).toBe(AspectType.FULL_7TH);
  });

  it('shouldNotDuplicateAspectRecords', () => {
    const pf = createMockPlanetFacts();
    const report = analyzeNatalGrahaDrishti(pf);

    const keys = new Set<string>();
    for (const a of report.aspects ?? []) {
      const key = `${a.sourcePlanet}->${a.targetPlanet}`;
      expect(keys.has(key)).toBe(false);
      keys.add(key);
    }
  });

  it('shouldPreserveSourceHouse/TargetHouse/SourceSign/TargetSign/AspectType/HouseOffset/Reason', () => {
    const pf = createMockPlanetFacts({
      [Planet.JUPITER]: { house: 2, sign: Sign.TAURUS },
      [Planet.VENUS]: { house: 10, sign: Sign.CAPRICORN }
    });

    const report = analyzeNatalGrahaDrishti(pf);
    const jupToVen = report.aspects?.find(
      a => a.sourcePlanet === Planet.JUPITER && a.targetPlanet === Planet.VENUS
    );

    expect(jupToVen).toBeDefined();
    expect(jupToVen?.sourcePlanet).toBe(Planet.JUPITER);
    expect(jupToVen?.targetPlanet).toBe(Planet.VENUS);
    expect(jupToVen?.sourceHouse).toBe(2);
    expect(jupToVen?.targetHouse).toBe(10);
    expect(jupToVen?.sourceSign).toBe(Sign.TAURUS);
    expect(jupToVen?.targetSign).toBe(Sign.CAPRICORN);
    expect(jupToVen?.houseOffset).toBe(8);
    expect(jupToVen?.aspectType).toBe(AspectType.SPECIAL_9TH);
    expect(jupToVen?.description).toBe('Jupiter in House 2 casts 9th aspect on Venus in House 10.');
    expect(jupToVen?.reason).toBe('Jupiter occupies House 2 and its 9th Graha Drishti falls on House 10.');
  });

  it('shouldReturnDeterministicOrder', () => {
    const pf = createMockPlanetFacts();
    const run1 = analyzeNatalGrahaDrishti(pf);
    const run2 = analyzeNatalGrahaDrishti(pf);

    expect(run1).toEqual(run2);
  });

  it('shouldRejectMissingPlanetFacts', () => {
    // 1. null or undefined input
    expect(() => analyzeNatalGrahaDrishti(null as unknown as Record<Planet, PlanetFacts>)).toThrow(
      'planetFacts must not be null or undefined.'
    );
    expect(() => analyzeNatalGrahaDrishti(undefined as unknown as Record<Planet, PlanetFacts>)).toThrow(
      'planetFacts must not be null or undefined.'
    );

    // 2. missing planet
    const pfIncomplete = createMockPlanetFacts();
    delete (pfIncomplete as any)[Planet.MARS];

    expect(() => analyzeNatalGrahaDrishti(pfIncomplete)).toThrow(
      'planetFacts is missing required planet: MARS.'
    );
  });

  it('shouldRejectInvalidHouse', () => {
    const invalidHouses = [0, 13, -1, 1.5, NaN, Infinity];

    for (const h of invalidHouses) {
      const pf: any = createMockPlanetFacts();
      pf[Planet.SUN].house = h;
      expect(() => analyzeNatalGrahaDrishti(pf)).toThrow(/Invalid house/);
    }
  });

  it('shouldRemainImmutable', () => {
    const pf = createMockPlanetFacts();
    const report = analyzeNatalGrahaDrishti(pf);

    expect(Object.isFrozen(report)).toBe(true);
    expect(Object.isFrozen(report.aspects)).toBe(true);
    if ((report.aspects?.length ?? 0) > 0) {
      expect(Object.isFrozen(report.aspects![0])).toBe(true);
    }
  });

  it('inputNotMutated', () => {
    const pf = createMockPlanetFacts();
    const pfClone = JSON.parse(JSON.stringify(pf));

    analyzeNatalGrahaDrishti(pf);

    expect(pf).toEqual(pfClone);
  });

  it('allNinePlanetsFixture', () => {
    // Verify a full 9-planet fixture produces exactly the expected directional set with no planet omitted
    // Default mock houses: Sun H1, Moon H2, Mars H3, Mercury H4, Jupiter H5, Venus H6, Saturn H7, Rahu H8, Ketu H9
    const pf: any = createMockPlanetFacts();
    const report = analyzeNatalGrahaDrishti(pf);

    const actual = (report.aspects ?? [])
      .map(a => `${a.sourcePlanet}->${a.targetPlanet}:${a.aspectType}`)
      .sort();

    const expected = [
      'JUPITER->KETU:SPECIAL_5TH',
      'JUPITER->SUN:SPECIAL_9TH',
      'KETU->MARS:FULL_7TH',
      'MARS->KETU:FULL_7TH',
      'MARS->VENUS:SPECIAL_4TH',
      'MOON->RAHU:FULL_7TH',
      'RAHU->MOON:FULL_7TH',
      'SATURN->KETU:SPECIAL_3RD',
      'SATURN->MERCURY:SPECIAL_10TH',
      'SATURN->SUN:FULL_7TH',
      'SUN->SATURN:FULL_7TH'
    ].sort();

    expect(actual).toEqual(expected);

    // Safeguard against silent drift: programmatically derive expected set from getGrahaDrishtiOffsets
    const derivedExpected: string[] = [];
    const planets = Object.values(Planet);
    for (const sp of planets) {
      for (const tp of planets) {
        if (sp === tp) continue;
        const offset = ((pf[tp].house - pf[sp].house) + 12) % 12;
        if (offset === 0) continue;
        const rule = getGrahaDrishtiOffsets(sp).find(r => r.offset === offset);
        if (rule) {
          derivedExpected.push(`${sp}->${tp}:${rule.type}`);
        }
      }
    }
    derivedExpected.sort();
    expect(expected).toEqual(derivedExpected);

    // Every aspect in report should have valid source and target planets in the 9-planet set
    const allPlanets = new Set(Object.values(Planet));
    for (const aspect of report.aspects ?? []) {
      expect(allPlanets.has(aspect.sourcePlanet)).toBe(true);
      expect(allPlanets.has(aspect.targetPlanet)).toBe(true);
      expect(aspect.sourceHouse).toBe(pf[aspect.sourcePlanet].house);
      expect(aspect.targetHouse).toBe(pf[aspect.targetPlanet].house);
    }
  });
});
