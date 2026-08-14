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

interface PlanetOverride {
  house?: number;
  sign?: Sign;
  dignityStatus?: DignityStatus;
  eclipticLongitude?: number;
}

function createDummyFact(
  planet: Planet,
  house: number,
  sign: Sign,
  dignityStatus: DignityStatus = DignityStatus.NEUTRAL,
  eclipticLongitude: number = 0
): PlanetFact {
  return {
    planet,
    position: {
      planet,
      eclipticLongitude,
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
    dignity: { planet, sign, status: dignityStatus },
    house
  };
}

function createYogaInput(
  ascendantSign: Sign = Sign.ARIES,
  overrides?: Partial<Record<Planet, PlanetOverride>>
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
    const dignityStatus = override?.dignityStatus ?? DignityStatus.NEUTRAL;
    const eclipticLongitude = override?.eclipticLongitude ?? 0;

    planetFactsPartial[planet] = createDummyFact(planet, house, sign, dignityStatus, eclipticLongitude);
  }

  return {
    planetFacts: planetFactsPartial as unknown as Record<Planet, PlanetFact>,
    houseLordship
  };
}

describe('Chandra-Mangala Yoga', () => {
  it('shouldDetectMoonMarsConjunction', () => {
    const input = createYogaInput(Sign.ARIES, {
      [Planet.MOON]: { house: 2, sign: Sign.TAURUS },
      [Planet.MARS]: { house: 2, sign: Sign.TAURUS }
    });

    const report = analyzeYogas(input);
    const cm = report.yogas.find(y => y.type === YogaType.CHANDRA_MANGALA_YOGA);

    expect(cm).toBeDefined();
    expect(cm?.category).toBe(YogaCategory.DHANA);
    expect(cm?.strength).toBe(YogaStrength.STRONG);
    expect(cm?.planets).toEqual([Planet.MOON, Planet.MARS]);
    expect(cm?.houses).toEqual([2]);
  });

  it('shouldDetectConjunctionInAnyHouse', () => {
    const input = createYogaInput(Sign.ARIES, {
      [Planet.MOON]: { house: 11, sign: Sign.AQUARIUS },
      [Planet.MARS]: { house: 11, sign: Sign.AQUARIUS }
    });

    const report = analyzeYogas(input);
    const cm = report.yogas.find(y => y.type === YogaType.CHANDRA_MANGALA_YOGA);

    expect(cm).toBeDefined();
    expect(cm?.houses).toEqual([11]);
  });

  it('shouldNotDetectMoonMarsOpposition', () => {
    // Moon in House 1, Mars in House 7 (Opposition) -> should NOT detect
    const input = createYogaInput(Sign.ARIES, {
      [Planet.MOON]: { house: 1, sign: Sign.ARIES },
      [Planet.MARS]: { house: 7, sign: Sign.LIBRA }
    });

    const report = analyzeYogas(input);
    const cm = report.yogas.find(y => y.type === YogaType.CHANDRA_MANGALA_YOGA);

    expect(cm).toBeUndefined();
  });

  it('shouldNotDetectWhenMoonAndMarsAreUnrelated', () => {
    const input = createYogaInput(Sign.ARIES, {
      [Planet.MOON]: { house: 4, sign: Sign.CANCER },
      [Planet.MARS]: { house: 8, sign: Sign.SCORPIO }
    });

    const report = analyzeYogas(input);
    const cm = report.yogas.find(y => y.type === YogaType.CHANDRA_MANGALA_YOGA);

    expect(cm).toBeUndefined();
  });

  it('shouldPreserveRuleId', () => {
    const input = createYogaInput(Sign.ARIES, {
      [Planet.MOON]: { house: 5, sign: Sign.LEO },
      [Planet.MARS]: { house: 5, sign: Sign.LEO }
    });

    const report = analyzeYogas(input);
    const cm = report.yogas.find(y => y.type === YogaType.CHANDRA_MANGALA_YOGA);

    expect(cm?.evidence[0].ruleId).toBe('YOGA_CHANDRA_MANGALA_001');
  });

  it('shouldPreserveConjunctionEvidence', () => {
    const input = createYogaInput(Sign.ARIES, {
      [Planet.MOON]: { house: 5, sign: Sign.LEO },
      [Planet.MARS]: { house: 5, sign: Sign.LEO }
    });

    const report = analyzeYogas(input);
    const cm = report.yogas.find(y => y.type === YogaType.CHANDRA_MANGALA_YOGA);

    expect(cm?.evidence[0].relationship).toBe('CONJUNCTION');
    expect(cm?.evidence[0].reason).toContain('conjunct in House 5');
  });

  it('shouldPreserveClassicalReference', () => {
    const input = createYogaInput(Sign.ARIES, {
      [Planet.MOON]: { house: 5, sign: Sign.LEO },
      [Planet.MARS]: { house: 5, sign: Sign.LEO }
    });

    const report = analyzeYogas(input);
    const cm = report.yogas.find(y => y.type === YogaType.CHANDRA_MANGALA_YOGA);

    expect(cm?.evidence[0].classicalReference).toBe('BPHS_CHANDRA_MANGALA_YOGA');
  });

  it('shouldRemainImmutable', () => {
    const input = createYogaInput(Sign.ARIES, {
      [Planet.MOON]: { house: 5, sign: Sign.LEO },
      [Planet.MARS]: { house: 5, sign: Sign.LEO }
    });

    const report = analyzeYogas(input);
    const cm = report.yogas.find(y => y.type === YogaType.CHANDRA_MANGALA_YOGA)!;

    expect(Object.isFrozen(cm)).toBe(true);
    expect(Object.isFrozen(cm.planets)).toBe(true);
    expect(Object.isFrozen(cm.houses)).toBe(true);
    expect(Object.isFrozen(cm.evidence)).toBe(true);
    expect(Object.isFrozen(cm.evidence[0])).toBe(true);
  });

  it('shouldNotDependOnHouseLordship', () => {
    const input = createYogaInput(Sign.ARIES, {
      [Planet.MOON]: { house: 5, sign: Sign.LEO },
      [Planet.MARS]: { house: 5, sign: Sign.LEO }
    });

    const inputWithoutLordship: YogaAnalysisInput = {
      planetFacts: input.planetFacts
    };

    const report = analyzeYogas(inputWithoutLordship);
    const cm = report.yogas.find(y => y.type === YogaType.CHANDRA_MANGALA_YOGA);

    expect(cm).toBeDefined();
    expect(cm?.houses).toEqual([5]);
  });
});
