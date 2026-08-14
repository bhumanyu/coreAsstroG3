import { describe, it, expect } from 'vitest';
import {
  Planet,
  Sign,
  PlanetFact,
  Nakshatra,
  Pada,
  PlanetCondition,
  DignityStatus
} from '../../types';
import { SIGNS_METADATA, SIGNS_ORDER, NAKSHATRAS_METADATA } from '../../data/astroData';
import { analyzeHouseLordship } from '../houseLordship/houseLordship';
import { analyzeYogas } from './yogaEngine';
import { YogaType, YogaCategory, YogaStrength, YogaAnalysisInput } from './yogaTypes';

function createDummyFact(planet: Planet, house: number, sign: Sign): PlanetFact {
  return {
    planet,
    position: {
      planet,
      eclipticLongitude: 0,
      eclipticLatitude: 0,
      longitude: 0,
      sign,
      house,
      signLongitude: 0,
      motion: { speed: 1, retrograde: false, stationary: false }
    },
    sign,
    signMetadata: SIGNS_METADATA[sign],
    nakshatraResult: { planet, nakshatra: NAKSHATRAS_METADATA[0], pada: 1, longitude: 0, padaLongitude: 0, degreeInPada: 0 },
    nakshatraMetadata: NAKSHATRAS_METADATA[0],
    state: { planet, motion: { speed: 1, retrograde: false, stationary: false }, condition: PlanetCondition.NORMAL },
    dignity: { planet, sign, status: DignityStatus.NEUTRAL },
    house
  };
}

function createDhanaYogaInput(
  ascendantSign: Sign = Sign.ARIES,
  overrides?: Partial<Record<Planet, { house: number; sign?: Sign }>>
): YogaAnalysisInput {
  const houseLordship = analyzeHouseLordship(ascendantSign);
  const ascNumber = SIGNS_METADATA[ascendantSign].number!;

  const defaultHouseMap: Record<Planet, number> = {
    [Planet.SUN]: 3,
    [Planet.MOON]: 4,
    [Planet.MARS]: 8,
    [Planet.MERCURY]: 6,
    [Planet.JUPITER]: 12,
    [Planet.VENUS]: 2,
    [Planet.SATURN]: 10,
    [Planet.RAHU]: 3,
    [Planet.KETU]: 9
  };

  const allPlanets = Object.values(Planet);
  const planetFactsPartial: Partial<Record<Planet, PlanetFact>> = {};

  for (const planet of allPlanets) {
    const override = overrides?.[planet];
    const house = override?.house ?? defaultHouseMap[planet];
    const signIndex = (ascNumber - 1 + house - 1) % 12;
    const defaultSign = SIGNS_ORDER[signIndex];
    const sign = override?.sign ?? defaultSign;

    planetFactsPartial[planet] = createDummyFact(planet, house, sign);
  }

  return {
    planetFacts: planetFactsPartial as unknown as Record<Planet, PlanetFact>,
    houseLordship
  };
}

describe('Dhana Yoga Engine', () => {
  it('shouldDetectSecondEleventhLordConjunction', () => {
    // Aries Lagna: 2nd lord Venus and 11th lord Saturn conjunct in House 1
    const input = createDhanaYogaInput(Sign.ARIES, {
      [Planet.VENUS]: { house: 1 },
      [Planet.SATURN]: { house: 1 }
    });

    const report = analyzeYogas(input);
    const dhanaYogas = report.yogas.filter(y => y.type === YogaType.DHANA_YOGA);

    const yoga = dhanaYogas.find(y => y.evidence[0]?.ruleId === 'YOGA_DHANA_001');
    expect(yoga).toBeDefined();
    expect(yoga!.planets).toEqual([Planet.VENUS, Planet.SATURN]);
    expect(yoga!.houses).toEqual([1, 1]);
    expect(yoga!.evidence[0].relationship).toBe('CONJUNCTION');
    expect(yoga!.evidence[0].lordshipHouses).toEqual([2, 11]);
  });

  it('shouldDetectSecondFifthLordConjunction', () => {
    // Aries Lagna: 2nd lord Venus and 5th lord Sun conjunct in House 1
    const input = createDhanaYogaInput(Sign.ARIES, {
      [Planet.VENUS]: { house: 1 },
      [Planet.SUN]: { house: 1 }
    });

    const report = analyzeYogas(input);
    const yoga = report.yogas.find(y => y.evidence[0]?.ruleId === 'YOGA_DHANA_002');

    expect(yoga).toBeDefined();
    expect(yoga!.planets).toEqual([Planet.VENUS, Planet.SUN]);
    expect(yoga!.evidence[0].relationship).toBe('CONJUNCTION');
    expect(yoga!.evidence[0].lordshipHouses).toEqual([2, 5]);
  });

  it('shouldDetectSecondNinthLordConjunction', () => {
    // Aries Lagna: 2nd lord Venus and 9th lord Jupiter conjunct in House 1
    const input = createDhanaYogaInput(Sign.ARIES, {
      [Planet.VENUS]: { house: 1 },
      [Planet.JUPITER]: { house: 1 }
    });

    const report = analyzeYogas(input);
    const yoga = report.yogas.find(y => y.evidence[0]?.ruleId === 'YOGA_DHANA_003');

    expect(yoga).toBeDefined();
    expect(yoga!.planets).toEqual([Planet.VENUS, Planet.JUPITER]);
    expect(yoga!.evidence[0].relationship).toBe('CONJUNCTION');
    expect(yoga!.evidence[0].lordshipHouses).toEqual([2, 9]);
  });

  it('shouldDetectFifthEleventhLordConjunction', () => {
    // Aries Lagna: 5th lord Sun and 11th lord Saturn conjunct in House 1
    const input = createDhanaYogaInput(Sign.ARIES, {
      [Planet.SUN]: { house: 1 },
      [Planet.SATURN]: { house: 1 }
    });

    const report = analyzeYogas(input);
    const yoga = report.yogas.find(y => y.evidence[0]?.ruleId === 'YOGA_DHANA_004');

    expect(yoga).toBeDefined();
    expect(yoga!.planets).toEqual([Planet.SUN, Planet.SATURN]);
    expect(yoga!.evidence[0].relationship).toBe('CONJUNCTION');
    expect(yoga!.evidence[0].lordshipHouses).toEqual([5, 11]);
  });

  it('shouldDetectNinthEleventhLordConjunction', () => {
    // Aries Lagna: 9th lord Jupiter and 11th lord Saturn conjunct in House 1
    const input = createDhanaYogaInput(Sign.ARIES, {
      [Planet.JUPITER]: { house: 1 },
      [Planet.SATURN]: { house: 1 }
    });

    const report = analyzeYogas(input);
    const yoga = report.yogas.find(y => y.evidence[0]?.ruleId === 'YOGA_DHANA_005');

    expect(yoga).toBeDefined();
    expect(yoga!.planets).toEqual([Planet.JUPITER, Planet.SATURN]);
    expect(yoga!.evidence[0].relationship).toBe('CONJUNCTION');
    expect(yoga!.evidence[0].lordshipHouses).toEqual([9, 11]);
  });

  it('shouldDetectMutualAspect', () => {
    // Aries Lagna: 2nd lord Venus in House 1, 11th lord Saturn in House 7 (7th mutual aspect)
    const input = createDhanaYogaInput(Sign.ARIES, {
      [Planet.VENUS]: { house: 1 },
      [Planet.SATURN]: { house: 7 }
    });

    const report = analyzeYogas(input);
    const yoga = report.yogas.find(
      y => y.type === YogaType.DHANA_YOGA && y.evidence[0]?.ruleId === 'YOGA_DHANA_001'
    );

    expect(yoga).toBeDefined();
    expect(yoga!.planets).toEqual([Planet.VENUS, Planet.SATURN]);
    expect(yoga!.houses).toEqual([1, 7]);
    expect(yoga!.evidence[0].relationship).toBe('MUTUAL_ASPECT');
    expect(yoga!.evidence[0].lordshipHouses).toEqual([2, 11]);
  });

  it('shouldDetectExchange', () => {
    // Aries Lagna:
    // 2nd lord Venus (owns Taurus / Sign 2) in House 11 (Aquarius, Sign 11)
    // 11th lord Saturn (owns Aquarius / Sign 11) in House 2 (Taurus, Sign 2)
    const input = createDhanaYogaInput(Sign.ARIES, {
      [Planet.VENUS]: { house: 11, sign: Sign.AQUARIUS },
      [Planet.SATURN]: { house: 2, sign: Sign.TAURUS }
    });

    const report = analyzeYogas(input);
    const yoga = report.yogas.find(
      y => y.type === YogaType.DHANA_YOGA && y.evidence[0]?.ruleId === 'YOGA_DHANA_001'
    );

    expect(yoga).toBeDefined();
    expect(yoga!.planets).toEqual([Planet.VENUS, Planet.SATURN]);
    expect(yoga!.houses).toEqual([11, 2]);
    expect(yoga!.evidence[0].relationship).toBe('EXCHANGE');
    expect(yoga!.evidence[0].lordshipHouses).toEqual([2, 11]);
  });

  it('shouldNotDetectWithoutRequiredFirstLord', () => {
    // Aries Lagna: 5th lord Sun in H1, 11th lord Saturn in H3 (no conjunction/aspect/exchange with 2nd lord Venus)
    const input = createDhanaYogaInput(Sign.ARIES, {
      [Planet.SUN]: { house: 1 },
      [Planet.SATURN]: { house: 3 }
    });

    const report = analyzeYogas(input);
    const dhanaYogas = report.yogas.filter(y => y.type === YogaType.DHANA_YOGA);

    const yoga001 = dhanaYogas.find(y => y.evidence[0]?.ruleId === 'YOGA_DHANA_001');
    const yoga002 = dhanaYogas.find(y => y.evidence[0]?.ruleId === 'YOGA_DHANA_002');
    expect(yoga001).toBeUndefined();
    expect(yoga002).toBeUndefined();
  });

  it('shouldNotDetectWithoutRequiredSecondLord', () => {
    // Aries Lagna: 2nd lord Venus in H1, 3rd/6th lord Mercury in H1. Mercury owns 3 & 6 (no 5, 9, 11).
    const input = createDhanaYogaInput(Sign.ARIES, {
      [Planet.VENUS]: { house: 1 },
      [Planet.MERCURY]: { house: 1 }
    });

    const report = analyzeYogas(input);
    const vmDhanaYogas = report.yogas.filter(
      y => y.type === YogaType.DHANA_YOGA &&
           y.planets.includes(Planet.VENUS) &&
           y.planets.includes(Planet.MERCURY)
    );

    expect(vmDhanaYogas).toEqual([]);
  });

  it('shouldNotDetectWhenPlanetsAreUnrelated', () => {
    // Aries Lagna: 2nd lord Venus in H1, 11th lord Saturn in H2 (adjacent houses, no aspect/conjunction/exchange)
    const input = createDhanaYogaInput(Sign.ARIES, {
      [Planet.VENUS]: { house: 1 },
      [Planet.SATURN]: { house: 2 }
    });

    const report = analyzeYogas(input);
    const vsDhanaYogas = report.yogas.filter(
      y => y.type === YogaType.DHANA_YOGA &&
           y.planets.includes(Planet.VENUS) &&
           y.planets.includes(Planet.SATURN)
    );

    expect(vsDhanaYogas).toEqual([]);
  });

  it('shouldNotTreatBeneficPlanetAloneAsDhanaYoga', () => {
    // Aries Lagna: Jupiter (9th lord, natural benefic) alone in H1 without a qualifying relationship with another lord
    const input = createDhanaYogaInput(Sign.ARIES, {
      [Planet.JUPITER]: { house: 1 }
    });

    const report = analyzeYogas(input);
    const jupiterDhanaYogas = report.yogas.filter(
      y => y.type === YogaType.DHANA_YOGA && y.planets.includes(Planet.JUPITER)
    );

    expect(jupiterDhanaYogas).toEqual([]);
  });

  it('shouldNotTreatYogakarakaAloneAsDhanaYoga', () => {
    // Cancer Lagna: Mars (Yogakaraka - 5th & 10th lord) alone in H1 without a qualifying relationship
    const input = createDhanaYogaInput(Sign.CANCER, {
      [Planet.MARS]: { house: 1 }
    });

    const report = analyzeYogas(input);
    const marsDhanaYogas = report.yogas.filter(
      y => y.type === YogaType.DHANA_YOGA && y.planets.includes(Planet.MARS)
    );

    expect(marsDhanaYogas).toEqual([]);
  });

  it('shouldNotDuplicateReversedPlanetPairs', () => {
    const input = createDhanaYogaInput(Sign.ARIES, {
      [Planet.VENUS]: { house: 1 },
      [Planet.SATURN]: { house: 1 }
    });

    const report = analyzeYogas(input);
    const yoga001List = report.yogas.filter(
      y => y.type === YogaType.DHANA_YOGA && y.evidence[0]?.ruleId === 'YOGA_DHANA_001'
    );

    expect(yoga001List.length).toBe(1);
    expect(yoga001List[0].planets).toEqual([Planet.VENUS, Planet.SATURN]);
  });

  it('shouldPreserveRuleId', () => {
    const input = createDhanaYogaInput(Sign.ARIES, {
      [Planet.VENUS]: { house: 1 },
      [Planet.SATURN]: { house: 1 }
    });

    const report = analyzeYogas(input);
    const yoga = report.yogas.find(y => y.type === YogaType.DHANA_YOGA)!;
    expect(yoga.evidence[0].ruleId).toBe('YOGA_DHANA_001');
  });

  it('shouldPreserveRelationship', () => {
    const input = createDhanaYogaInput(Sign.ARIES, {
      [Planet.VENUS]: { house: 1 },
      [Planet.SATURN]: { house: 1 }
    });

    const report = analyzeYogas(input);
    const yoga = report.yogas.find(y => y.type === YogaType.DHANA_YOGA)!;
    expect(yoga.evidence[0].relationship).toBe('CONJUNCTION');
  });

  it('shouldPreserveLordshipHouses', () => {
    const input = createDhanaYogaInput(Sign.ARIES, {
      [Planet.VENUS]: { house: 1 },
      [Planet.SATURN]: { house: 1 }
    });

    const report = analyzeYogas(input);
    const yoga = report.yogas.find(y => y.type === YogaType.DHANA_YOGA)!;
    expect(yoga.evidence[0].lordshipHouses).toEqual([2, 11]);
  });

  it('shouldDetectMultipleDhanaYogas', () => {
    // Aries Lagna: 2nd lord Venus, 11th lord Saturn, and 5th lord Sun all conjunct in House 1
    // Qualifies for: YOGA_DHANA_001 (2+11), YOGA_DHANA_002 (2+5), and YOGA_DHANA_004 (5+11)
    const input = createDhanaYogaInput(Sign.ARIES, {
      [Planet.VENUS]: { house: 1 },
      [Planet.SATURN]: { house: 1 },
      [Planet.SUN]: { house: 1 }
    });

    const report = analyzeYogas(input);
    const dhanaYogas = report.yogas.filter(y => y.type === YogaType.DHANA_YOGA);

    const activeSet = dhanaYogas
      .map(y => `${y.type}:${y.evidence[0].ruleId}:${y.evidence[0].relationship}`)
      .sort();

    expect(activeSet).toEqual([
      'DHANA_YOGA:YOGA_DHANA_001:CONJUNCTION',
      'DHANA_YOGA:YOGA_DHANA_002:CONJUNCTION',
      'DHANA_YOGA:YOGA_DHANA_004:CONJUNCTION'
    ]);
  });

  it('shouldPreserveDistinctRelationshipsForSamePlanetPair', () => {
    // Pisces Lagna:
    // 2nd lord = Mars & 9th lord = Mars
    // 11th lord = Saturn
    // Mars in House 11 (Capricorn), Saturn in House 5 (Cancer)
    // Mars and Saturn mutually aspect each other across H11 and H5 (7th aspect).
    // Mars (2nd & 9th lord) and Saturn (11th lord) satisfy YOGA_DHANA_001 (2nd + 11th lord) and YOGA_DHANA_005 (9th + 11th lord).
    // Both produce identical planets [MARS, SATURN] and houses [11, 5], but different ruleIds (YOGA_DHANA_001 vs YOGA_DHANA_005).
    // Both survive seenKeys dedup because ruleId is included in the key.
    const input = createDhanaYogaInput(Sign.PISCES, {
      [Planet.MARS]: { house: 11, sign: Sign.CAPRICORN },
      [Planet.SATURN]: { house: 5, sign: Sign.CANCER }
    });

    const report = analyzeYogas(input);
    const marsSaturnYogas = report.yogas.filter(
      y => y.type === YogaType.DHANA_YOGA &&
           y.planets.includes(Planet.MARS) &&
           y.planets.includes(Planet.SATURN)
    );

    const activeSet = marsSaturnYogas
      .map(y => `${y.type}:${y.evidence[0].ruleId}:${y.evidence[0].relationship}`)
      .sort();

    expect(activeSet).toEqual([
      'DHANA_YOGA:YOGA_DHANA_001:MUTUAL_ASPECT',
      'DHANA_YOGA:YOGA_DHANA_005:MUTUAL_ASPECT'
    ]);
  });

  it('shouldSkipDhanaYogaWhenHouseLordshipIsAbsent', () => {
    const defaultInput = createDhanaYogaInput(Sign.ARIES, {
      [Planet.VENUS]: { house: 1 },
      [Planet.SATURN]: { house: 1 }
    });

    const input: YogaAnalysisInput = {
      planetFacts: defaultInput.planetFacts
    };

    const report = analyzeYogas(input);

    expect(
      report.yogas.some(y => y.type === YogaType.DHANA_YOGA)
    ).toBe(false);
  });

  it('shouldRemainImmutable', () => {
    const input = createDhanaYogaInput(Sign.ARIES, {
      [Planet.VENUS]: { house: 1 },
      [Planet.SATURN]: { house: 1 }
    });

    const report = analyzeYogas(input);
    const yoga = report.yogas.find(y => y.type === YogaType.DHANA_YOGA)!;

    expect(Object.isFrozen(report)).toBe(true);
    expect(Object.isFrozen(report.yogas)).toBe(true);
    expect(Object.isFrozen(yoga)).toBe(true);
    expect(Object.isFrozen(yoga.planets)).toBe(true);
    expect(Object.isFrozen(yoga.houses)).toBe(true);
    expect(Object.isFrozen(yoga.evidence)).toBe(true);
    expect(Object.isFrozen(yoga.evidence[0])).toBe(true);
    expect(Object.isFrozen(yoga.evidence[0].lordshipHouses)).toBe(true);
  });
});
