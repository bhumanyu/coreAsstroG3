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

/**
 * Creates a YogaAnalysisInput with default non-interacting planet positions
 * for Aries Lagna (unless overridden), preventing accidental background yogas.
 */
function createRajaYogaInput(
  ascendantSign: Sign = Sign.ARIES,
  overrides?: Partial<Record<Planet, { house: number; sign?: Sign }>>
): YogaAnalysisInput {
  const houseLordship = analyzeHouseLordship(ascendantSign);
  const ascNumber = SIGNS_METADATA[ascendantSign].number!;

  // Safe default houses for Aries Lagna where no Kendra-Trikona pair interacts:
  // Sun(2), Moon(3), Mars(8), Mercury(11), Jupiter(12), Venus(6), Saturn(5)
  const defaultHouseMap: Record<Planet, number> = {
    [Planet.SUN]: 2,
    [Planet.MOON]: 3,
    [Planet.MARS]: 8,
    [Planet.MERCURY]: 11,
    [Planet.JUPITER]: 12,
    [Planet.VENUS]: 6,
    [Planet.SATURN]: 5,
    [Planet.RAHU]: 2,
    [Planet.KETU]: 8
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

describe('Raja Yoga (Kendra-Trikona)', () => {
  it('shouldDetectKendraTrikonaConjunction', () => {
    // Aries Lagna: Sun (5th lord, Trikona) and Moon (4th lord, Kendra) conjunct in House 1
    const input = createRajaYogaInput(Sign.ARIES, {
      [Planet.SUN]: { house: 1 },
      [Planet.MOON]: { house: 1 }
    });

    const report = analyzeYogas(input);
    const rajaYogas = report.yogas.filter(y => y.type === YogaType.RAJA_YOGA);

    expect(rajaYogas.length).toBeGreaterThanOrEqual(1);
    const conjunctionYoga = rajaYogas.find(y => y.evidence[0]?.relationship === 'CONJUNCTION');
    expect(conjunctionYoga).toBeDefined();
    expect(conjunctionYoga!.planets).toEqual([Planet.SUN, Planet.MOON]);
    expect(conjunctionYoga!.houses).toEqual([1, 1]);
    expect(conjunctionYoga!.evidence[0].ruleId).toBe('YOGA_RAJA_KENDRA_TRIKONA_001');
  });

  it('shouldDetectKendraTrikonaMutualAspect', () => {
    // Aries Lagna: Sun (5th lord, Trikona) in House 1, Moon (4th lord, Kendra) in House 7 (7th mutual aspect)
    const input = createRajaYogaInput(Sign.ARIES, {
      [Planet.SUN]: { house: 1 },
      [Planet.MOON]: { house: 7 }
    });

    const report = analyzeYogas(input);
    const aspectYoga = report.yogas.find(y => y.evidence[0]?.relationship === 'MUTUAL_ASPECT');

    expect(aspectYoga).toBeDefined();
    expect(aspectYoga!.planets).toEqual([Planet.SUN, Planet.MOON]);
    expect(aspectYoga!.houses).toEqual([1, 7]);
    expect(aspectYoga!.evidence[0].ruleId).toBe('YOGA_RAJA_KENDRA_TRIKONA_002');
  });

  it('shouldDetectKendraTrikonaExchange', () => {
    // Aries Lagna: Sun (5th lord, owns Leo/Sign 5) in Cancer (Sign 4, House 4)
    // Moon (4th lord, owns Cancer/Sign 4) in Leo (Sign 5, House 5)
    const input = createRajaYogaInput(Sign.ARIES, {
      [Planet.SUN]: { house: 4, sign: Sign.CANCER },
      [Planet.MOON]: { house: 5, sign: Sign.LEO }
    });

    const report = analyzeYogas(input);
    const exchangeYoga = report.yogas.find(y => y.evidence[0]?.relationship === 'EXCHANGE');

    expect(exchangeYoga).toBeDefined();
    expect(exchangeYoga!.planets).toEqual([Planet.SUN, Planet.MOON]);
    expect(exchangeYoga!.houses).toEqual([4, 5]);
    expect(exchangeYoga!.evidence[0].ruleId).toBe('YOGA_RAJA_KENDRA_TRIKONA_003');
  });

  it('shouldSkipRajaYogaWhenHouseLordshipIsAbsent', () => {
    const defaultInput = createRajaYogaInput(Sign.ARIES, {
      [Planet.SUN]: { house: 1 },
      [Planet.MOON]: { house: 1 }
    });

    const input: YogaAnalysisInput = {
      planetFacts: defaultInput.planetFacts
    };

    const report = analyzeYogas(input);

    expect(
      report.yogas.some(y => y.type === YogaType.RAJA_YOGA)
    ).toBe(false);
  });

  it('shouldNotDetectWithoutKendraLord', () => {
    // Aries Lagna: Sun (5th lord, Trikona) and Jupiter (9th lord, Trikona) conjunct in House 1. Neither owns Kendra.
    const input = createRajaYogaInput(Sign.ARIES, {
      [Planet.SUN]: { house: 1 },
      [Planet.JUPITER]: { house: 1 }
    });

    const report = analyzeYogas(input);
    const pairYoga = report.yogas.find(
      y => y.type === YogaType.RAJA_YOGA &&
           y.planets.includes(Planet.SUN) &&
           y.planets.includes(Planet.JUPITER)
    );
    expect(pairYoga).toBeUndefined();
  });

  it('shouldNotDetectWithoutTrikonaLord', () => {
    // Aries Lagna: Moon (4th lord, Kendra) and Saturn (10th lord, Kendra) conjunct in House 1. Neither owns Trikona.
    const input = createRajaYogaInput(Sign.ARIES, {
      [Planet.MOON]: { house: 1 },
      [Planet.SATURN]: { house: 1 }
    });

    const report = analyzeYogas(input);
    const pairYoga = report.yogas.find(
      y => y.type === YogaType.RAJA_YOGA &&
           y.planets.includes(Planet.MOON) &&
           y.planets.includes(Planet.SATURN)
    );
    expect(pairYoga).toBeUndefined();
  });

  it('shouldNotDetectWhenPlanetsAreUnrelated', () => {
    // Aries Lagna: Sun (5th lord, Trikona) in H1, Moon (4th lord, Kendra) in H2 (no conjunction/aspect/exchange)
    const input = createRajaYogaInput(Sign.ARIES, {
      [Planet.SUN]: { house: 1 },
      [Planet.MOON]: { house: 2 }
    });

    const report = analyzeYogas(input);
    const pairYoga = report.yogas.find(
      y => y.type === YogaType.RAJA_YOGA &&
           y.planets.includes(Planet.SUN) &&
           y.planets.includes(Planet.MOON)
    );
    expect(pairYoga).toBeUndefined();
  });

  it('shouldNotTreatLagnaLordAloneAsRajaYoga', () => {
    // PR-033B regression guard: Aries ascendant, Mars owns 1st (Kendra & Trikona) + 8th.
    // Mars alone in H1 without a second qualifying relationship with another planet must NOT produce Raja Yoga.
    const input = createRajaYogaInput(Sign.ARIES, {
      [Planet.MARS]: { house: 1 },
      [Planet.MERCURY]: { house: 6 } // Mercury owns 3, 6 (no Kendra/Trikona)
    });

    const report = analyzeYogas(input);
    const marsYogas = report.yogas.filter(
      y => y.type === YogaType.RAJA_YOGA && y.planets.includes(Planet.MARS)
    );
    expect(marsYogas).toEqual([]);
  });

  it('shouldNotDuplicateReversedPlanetPairs', () => {
    const input = createRajaYogaInput(Sign.ARIES, {
      [Planet.SUN]: { house: 1 },
      [Planet.MOON]: { house: 1 }
    });

    const report = analyzeYogas(input);
    const sunMoonYogas = report.yogas.filter(
      y => y.type === YogaType.RAJA_YOGA &&
           y.planets.includes(Planet.SUN) &&
           y.planets.includes(Planet.MOON)
    );

    expect(sunMoonYogas.length).toBe(1);
    expect(sunMoonYogas[0].planets).toEqual([Planet.SUN, Planet.MOON]);
  });

  it('shouldPreserveRuleId', () => {
    const input = createRajaYogaInput(Sign.ARIES, {
      [Planet.SUN]: { house: 1 },
      [Planet.MOON]: { house: 1 }
    });

    const report = analyzeYogas(input);
    const yoga = report.yogas.find(y => y.type === YogaType.RAJA_YOGA)!;
    expect(yoga.evidence[0].ruleId).toBe('YOGA_RAJA_KENDRA_TRIKONA_001');
  });

  it('shouldPreserveKendraEvidence', () => {
    // Aries Lagna: Moon owns 4th house (Kendra)
    const input = createRajaYogaInput(Sign.ARIES, {
      [Planet.SUN]: { house: 1 },
      [Planet.MOON]: { house: 1 }
    });

    const report = analyzeYogas(input);
    const yoga = report.yogas.find(y => y.type === YogaType.RAJA_YOGA)!;
    expect(yoga.evidence[0].kendraHouses).toEqual([4]);
  });

  it('shouldPreserveTrikonaEvidence', () => {
    // Aries Lagna: Sun owns 5th house (Trikona)
    const input = createRajaYogaInput(Sign.ARIES, {
      [Planet.SUN]: { house: 1 },
      [Planet.MOON]: { house: 1 }
    });

    const report = analyzeYogas(input);
    const yoga = report.yogas.find(y => y.type === YogaType.RAJA_YOGA)!;
    expect(yoga.evidence[0].trikonaHouses).toEqual([5]);
  });

  it('shouldPreserveRelationshipEvidence', () => {
    const input = createRajaYogaInput(Sign.ARIES, {
      [Planet.SUN]: { house: 1 },
      [Planet.MOON]: { house: 1 }
    });

    const report = analyzeYogas(input);
    const yoga = report.yogas.find(y => y.type === YogaType.RAJA_YOGA)!;
    expect(yoga.evidence[0].relationship).toBe('CONJUNCTION');
  });

  it('shouldDetectMultipleRajaYogas', () => {
    // Construct two distinct qualifying relationships:
    // 1. Sun (5th lord) and Moon (4th lord) conjunct in H1 (Conjunction: YOGA_RAJA_KENDRA_TRIKONA_001)
    // 2. Jupiter (9th lord) in H10 and Saturn (10th lord) in H4 (Mutual Aspect: YOGA_RAJA_KENDRA_TRIKONA_002)
    const input = createRajaYogaInput(Sign.ARIES, {
      [Planet.SUN]: { house: 1 },
      [Planet.MOON]: { house: 1 },
      [Planet.JUPITER]: { house: 10 },
      [Planet.SATURN]: { house: 4 }
    });

    const report = analyzeYogas(input);
    const rajaYogas = report.yogas.filter(y => y.type === YogaType.RAJA_YOGA);

    expect(rajaYogas.length).toBeGreaterThanOrEqual(2);

    const sunMoonYoga = rajaYogas.find(
      y => y.planets.includes(Planet.SUN) && y.planets.includes(Planet.MOON)
    );
    const jupSatYoga = rajaYogas.find(
      y => y.planets.includes(Planet.JUPITER) && y.planets.includes(Planet.SATURN)
    );

    expect(sunMoonYoga).toBeDefined();
    expect(jupSatYoga).toBeDefined();
    expect(sunMoonYoga!.evidence[0].ruleId).toBe('YOGA_RAJA_KENDRA_TRIKONA_001');
    expect(jupSatYoga!.evidence[0].ruleId).toBe('YOGA_RAJA_KENDRA_TRIKONA_002');
  });

  it('shouldPreserveYogaMetadata', () => {
    const input = createRajaYogaInput(Sign.ARIES, {
      [Planet.SUN]: { house: 1 },
      [Planet.MOON]: { house: 1 }
    });

    const report = analyzeYogas(input);
    const yoga = report.yogas.find(y => y.type === YogaType.RAJA_YOGA)!;

    expect(yoga.type).toBe(YogaType.RAJA_YOGA);
    expect(yoga.category).toBe(YogaCategory.RAJA);
    expect(yoga.strength).toBe(YogaStrength.STRONG);
  });

  it('shouldPreserveDistinctRelationshipsForSamePlanetPair', () => {
    // Cancer Lagna: Mars (5th Trikona lord & 10th Kendra lord) in House 4 (Libra, Venus's sign)
    // Venus (4th Kendra lord) in House 10 (Aries, Mars's sign)
    // Satisfies BOTH Mutual Aspect (7th aspect across H4 & H10) AND Exchange (Mars in Libra, Venus in Aries).
    // Produces identical type, planets ([MARS, VENUS]), and houses ([4, 10]), testing ruleId dedup.
    const input = createRajaYogaInput(Sign.CANCER, {
      [Planet.MARS]: { house: 4, sign: Sign.LIBRA },
      [Planet.VENUS]: { house: 10, sign: Sign.ARIES }
    });

    const report = analyzeYogas(input);
    const pairYogas = report.yogas.filter(
      y => y.type === YogaType.RAJA_YOGA &&
           y.planets.includes(Planet.MARS) &&
           y.planets.includes(Planet.VENUS)
    );

    expect(pairYogas.map(y => y.evidence[0].ruleId).sort())
      .toEqual(['YOGA_RAJA_KENDRA_TRIKONA_002', 'YOGA_RAJA_KENDRA_TRIKONA_003']);
  });

  it('shouldRemainImmutable', () => {
    const input = createRajaYogaInput(Sign.ARIES, {
      [Planet.SUN]: { house: 1 },
      [Planet.MOON]: { house: 1 }
    });

    const report = analyzeYogas(input);
    const yoga = report.yogas.find(y => y.type === YogaType.RAJA_YOGA)!;

    expect(Object.isFrozen(report)).toBe(true);
    expect(Object.isFrozen(report.yogas)).toBe(true);
    expect(Object.isFrozen(yoga)).toBe(true);
    expect(Object.isFrozen(yoga.planets)).toBe(true);
    expect(Object.isFrozen(yoga.houses)).toBe(true);
    expect(Object.isFrozen(yoga.evidence)).toBe(true);
    expect(Object.isFrozen(yoga.evidence[0])).toBe(true);
    expect(Object.isFrozen(yoga.evidence[0].kendraHouses)).toBe(true);
    expect(Object.isFrozen(yoga.evidence[0].trikonaHouses)).toBe(true);
  });
});
