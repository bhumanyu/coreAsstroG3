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

describe('Lakshmi Yoga', () => {
  it('shouldDetectLakshmiYoga', () => {
    // Aries Lagna: Lagna lord = Mars, 9th lord = Jupiter.
    // Mars in House 1 (Aries, OWN_SIGN), Jupiter in House 4 (Cancer, EXALTED)
    const input = createYogaInput(Sign.ARIES, {
      [Planet.MARS]: { house: 1, sign: Sign.ARIES, dignityStatus: DignityStatus.OWN_SIGN },
      [Planet.JUPITER]: { house: 4, sign: Sign.CANCER, dignityStatus: DignityStatus.EXALTED }
    });

    const report = analyzeYogas(input);
    const lakshmi = report.yogas.find(y => y.type === YogaType.LAKSHMI_YOGA);

    expect(lakshmi).toBeDefined();
    expect(lakshmi?.category).toBe(YogaCategory.PROSPERITY);
    expect(lakshmi?.strength).toBe(YogaStrength.STRONG);
    expect(lakshmi?.planets).toEqual([Planet.MARS, Planet.JUPITER]);
    expect(lakshmi?.houses).toEqual([4]);
  });

  it('shouldDetectWhenNinthLordIsExalted', () => {
    const input = createYogaInput(Sign.ARIES, {
      [Planet.MARS]: { house: 1, sign: Sign.ARIES, dignityStatus: DignityStatus.OWN_SIGN },
      [Planet.JUPITER]: { house: 4, sign: Sign.CANCER, dignityStatus: DignityStatus.EXALTED }
    });

    const report = analyzeYogas(input);
    const lakshmi = report.yogas.find(y => y.type === YogaType.LAKSHMI_YOGA);
    expect(lakshmi).toBeDefined();
    expect(lakshmi?.evidence[0].reason).toContain('exaltation sign');
  });

  it('shouldDetectWhenNinthLordIsOwnSign', () => {
    const input = createYogaInput(Sign.ARIES, {
      [Planet.MARS]: { house: 1, sign: Sign.ARIES, dignityStatus: DignityStatus.OWN_SIGN },
      [Planet.JUPITER]: { house: 9, sign: Sign.SAGITTARIUS, dignityStatus: DignityStatus.OWN_SIGN }
    });

    const report = analyzeYogas(input);
    const lakshmi = report.yogas.find(y => y.type === YogaType.LAKSHMI_YOGA);
    expect(lakshmi).toBeDefined();
    expect(lakshmi?.evidence[0].reason).toContain('own sign');
  });

  it('shouldDetectWhenNinthLordIsMoolatrikona', () => {
    const input = createYogaInput(Sign.ARIES, {
      [Planet.MARS]: { house: 1, sign: Sign.ARIES, dignityStatus: DignityStatus.OWN_SIGN },
      [Planet.JUPITER]: { house: 9, sign: Sign.SAGITTARIUS, dignityStatus: DignityStatus.MOOLATRIKONA }
    });

    const report = analyzeYogas(input);
    const lakshmi = report.yogas.find(y => y.type === YogaType.LAKSHMI_YOGA);
    expect(lakshmi).toBeDefined();
    expect(lakshmi?.evidence[0].reason).toContain('Moolatrikona sign');
  });

  it('shouldRejectNinthLordInNeutralSign', () => {
    const input = createYogaInput(Sign.ARIES, {
      [Planet.MARS]: { house: 1, sign: Sign.ARIES, dignityStatus: DignityStatus.OWN_SIGN },
      [Planet.JUPITER]: { house: 5, sign: Sign.LEO, dignityStatus: DignityStatus.NEUTRAL }
    });

    const report = analyzeYogas(input);
    const lakshmi = report.yogas.find(y => y.type === YogaType.LAKSHMI_YOGA);
    expect(lakshmi).toBeUndefined();
  });

  it('shouldRejectNinthLordDebilitated', () => {
    const input = createYogaInput(Sign.ARIES, {
      [Planet.MARS]: { house: 1, sign: Sign.ARIES, dignityStatus: DignityStatus.OWN_SIGN },
      [Planet.JUPITER]: { house: 10, sign: Sign.CAPRICORN, dignityStatus: DignityStatus.DEBILITATED }
    });

    const report = analyzeYogas(input);
    const lakshmi = report.yogas.find(y => y.type === YogaType.LAKSHMI_YOGA);
    expect(lakshmi).toBeUndefined();
  });

  it('shouldRejectNinthLordOutsideKendraOrTrikona', () => {
    // House 6 is Dusthana (outside Kendra/Trikona), even if dignity is EXALTED/OWN_SIGN
    const input = createYogaInput(Sign.ARIES, {
      [Planet.MARS]: { house: 1, sign: Sign.ARIES, dignityStatus: DignityStatus.OWN_SIGN },
      [Planet.JUPITER]: { house: 6, sign: Sign.VIRGO, dignityStatus: DignityStatus.OWN_SIGN }
    });

    const report = analyzeYogas(input);
    const lakshmi = report.yogas.find(y => y.type === YogaType.LAKSHMI_YOGA);
    expect(lakshmi).toBeUndefined();
  });

  it('shouldRejectWeakLagnaLord', () => {
    // 9th lord Jupiter is EXALTED in House 4 (Kendra), but Lagna lord Mars is NEUTRAL
    const input = createYogaInput(Sign.ARIES, {
      [Planet.MARS]: { house: 1, sign: Sign.ARIES, dignityStatus: DignityStatus.NEUTRAL },
      [Planet.JUPITER]: { house: 4, sign: Sign.CANCER, dignityStatus: DignityStatus.EXALTED }
    });

    const report = analyzeYogas(input);
    const lakshmi = report.yogas.find(y => y.type === YogaType.LAKSHMI_YOGA);
    expect(lakshmi).toBeUndefined();
  });

  it('shouldNotRequireVenus', () => {
    // Venus is NEUTRAL in House 2, but Lakshmi Yoga forms because 9th lord & Lagna lord satisfy all conditions
    const input = createYogaInput(Sign.ARIES, {
      [Planet.MARS]: { house: 1, sign: Sign.ARIES, dignityStatus: DignityStatus.OWN_SIGN },
      [Planet.JUPITER]: { house: 4, sign: Sign.CANCER, dignityStatus: DignityStatus.EXALTED },
      [Planet.VENUS]: { house: 2, sign: Sign.TAURUS, dignityStatus: DignityStatus.NEUTRAL }
    });

    const report = analyzeYogas(input);
    const lakshmi = report.yogas.find(y => y.type === YogaType.LAKSHMI_YOGA);
    expect(lakshmi).toBeDefined();
  });

  it('shouldPreserveRuleId', () => {
    const input = createYogaInput(Sign.ARIES, {
      [Planet.MARS]: { house: 1, sign: Sign.ARIES, dignityStatus: DignityStatus.OWN_SIGN },
      [Planet.JUPITER]: { house: 4, sign: Sign.CANCER, dignityStatus: DignityStatus.EXALTED }
    });

    const report = analyzeYogas(input);
    const lakshmi = report.yogas.find(y => y.type === YogaType.LAKSHMI_YOGA);
    expect(lakshmi?.evidence[0].ruleId).toBe('YOGA_LAKSHMI_001');
  });

  it('shouldPreserveClassicalReference', () => {
    const input = createYogaInput(Sign.ARIES, {
      [Planet.MARS]: { house: 1, sign: Sign.ARIES, dignityStatus: DignityStatus.OWN_SIGN },
      [Planet.JUPITER]: { house: 4, sign: Sign.CANCER, dignityStatus: DignityStatus.EXALTED }
    });

    const report = analyzeYogas(input);
    const lakshmi = report.yogas.find(y => y.type === YogaType.LAKSHMI_YOGA);
    expect(lakshmi?.evidence[0].classicalReference).toBe('BPHS_LAKSHMI_YOGA');
  });

  it('shouldPreserveEvidence', () => {
    const input = createYogaInput(Sign.ARIES, {
      [Planet.MARS]: { house: 1, sign: Sign.ARIES, dignityStatus: DignityStatus.OWN_SIGN },
      [Planet.JUPITER]: { house: 4, sign: Sign.CANCER, dignityStatus: DignityStatus.EXALTED }
    });

    const report = analyzeYogas(input);
    const lakshmi = report.yogas.find(y => y.type === YogaType.LAKSHMI_YOGA);
    expect(lakshmi?.evidence).toHaveLength(1);
    expect(lakshmi?.evidence[0].planets).toEqual([Planet.MARS, Planet.JUPITER]);
    expect(lakshmi?.evidence[0].houses).toEqual([4]);
    expect(lakshmi?.evidence[0].reason).toBeDefined();
  });

  it('shouldRemainImmutable', () => {
    const input = createYogaInput(Sign.ARIES, {
      [Planet.MARS]: { house: 1, sign: Sign.ARIES, dignityStatus: DignityStatus.OWN_SIGN },
      [Planet.JUPITER]: { house: 4, sign: Sign.CANCER, dignityStatus: DignityStatus.EXALTED }
    });

    const report = analyzeYogas(input);
    const lakshmi = report.yogas.find(y => y.type === YogaType.LAKSHMI_YOGA)!;

    expect(Object.isFrozen(lakshmi)).toBe(true);
    expect(Object.isFrozen(lakshmi.planets)).toBe(true);
    expect(Object.isFrozen(lakshmi.houses)).toBe(true);
    expect(Object.isFrozen(lakshmi.evidence)).toBe(true);
    expect(Object.isFrozen(lakshmi.evidence[0])).toBe(true);
  });

  it('shouldSkipWhenHouseLordshipIsAbsent', () => {
    const input = createYogaInput(Sign.ARIES, {
      [Planet.MARS]: { house: 1, sign: Sign.ARIES, dignityStatus: DignityStatus.OWN_SIGN },
      [Planet.JUPITER]: { house: 4, sign: Sign.CANCER, dignityStatus: DignityStatus.EXALTED }
    });

    const inputWithoutLordship: YogaAnalysisInput = {
      planetFacts: input.planetFacts
    };

    const report = analyzeYogas(inputWithoutLordship);
    const lakshmi = report.yogas.find(y => y.type === YogaType.LAKSHMI_YOGA);
    expect(lakshmi).toBeUndefined();
  });
});
