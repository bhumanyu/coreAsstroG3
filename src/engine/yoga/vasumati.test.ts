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
    [Planet.SUN]: 1,
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

describe('Vasumati Yoga', () => {
  it('shouldDetectVasumatiFromLagna', () => {
    // Aries Lagna: Upachaya houses from Lagna are 3 (Gemini), 6 (Virgo), 10 (Capricorn), 11 (Aquarius)
    // Waxing Moon: Sun at 200, Moon at 305 (phase = 105°)
    const input = createYogaInput(Sign.ARIES, {
      [Planet.SUN]: { house: 7, sign: Sign.LIBRA, eclipticLongitude: 200 },
      [Planet.MERCURY]: { house: 3, sign: Sign.GEMINI, eclipticLongitude: 65 },
      [Planet.VENUS]: { house: 6, sign: Sign.VIRGO, eclipticLongitude: 155 },
      [Planet.JUPITER]: { house: 10, sign: Sign.CAPRICORN, eclipticLongitude: 275 },
      [Planet.MOON]: { house: 11, sign: Sign.AQUARIUS, eclipticLongitude: 305 }
    });

    const report = analyzeYogas(input);
    const vasumati = report.yogas.find(y => y.type === YogaType.VASUMATI_YOGA);

    expect(vasumati).toBeDefined();
    expect(vasumati?.category).toBe(YogaCategory.PROSPERITY);
    expect(vasumati?.strength).toBe(YogaStrength.STRONG);
    expect(vasumati?.planets).toEqual([Planet.MERCURY, Planet.VENUS, Planet.JUPITER, Planet.MOON]);
    expect(vasumati?.houses).toEqual([3, 6, 10, 11]);
    expect(vasumati?.evidence[0].referenceFrame).toBe('LAGNA');
  });

  it('shouldDetectVasumatiFromMoon', () => {
    // Aries Lagna.
    // Moon in Cancer (House 4).
    // Sun at 30 (Taurus), Moon at 100 (Cancer) -> phase = 70 (waxing).
    // Upachaya from Moon (Cancer):
    // 3rd from Cancer = Virgo (House 6) -> Mercury in House 6
    // 6th from Cancer = Sagittarius (House 9) -> Venus in House 9
    // 10th from Cancer = Aries (House 1) -> Jupiter in House 1
    // Note: Mercury, Venus, Jupiter are in houses 6, 9, 1 from Lagna (not all Upachaya from Lagna!),
    // but they are 3rd, 6th, 10th from Moon sign Cancer!
    const input = createYogaInput(Sign.ARIES, {
      [Planet.SUN]: { house: 2, sign: Sign.TAURUS, eclipticLongitude: 30 },
      [Planet.MOON]: { house: 4, sign: Sign.CANCER, eclipticLongitude: 100 },
      [Planet.MERCURY]: { house: 6, sign: Sign.VIRGO, eclipticLongitude: 160 },
      [Planet.VENUS]: { house: 9, sign: Sign.SAGITTARIUS, eclipticLongitude: 250 },
      [Planet.JUPITER]: { house: 1, sign: Sign.ARIES, eclipticLongitude: 10 }
    });

    const report = analyzeYogas(input);
    const vasumati = report.yogas.find(y => y.type === YogaType.VASUMATI_YOGA);

    expect(vasumati).toBeDefined();
    expect(vasumati?.evidence[0].referenceFrame).toBe('MOON');
  });

  it('shouldDetectWhenAllFourBeneficsQualify', () => {
    const input = createYogaInput(Sign.ARIES, {
      [Planet.SUN]: { house: 7, sign: Sign.LIBRA, eclipticLongitude: 200 },
      [Planet.MERCURY]: { house: 3, sign: Sign.GEMINI, eclipticLongitude: 65 },
      [Planet.VENUS]: { house: 6, sign: Sign.VIRGO, eclipticLongitude: 155 },
      [Planet.JUPITER]: { house: 10, sign: Sign.CAPRICORN, eclipticLongitude: 275 },
      [Planet.MOON]: { house: 11, sign: Sign.AQUARIUS, eclipticLongitude: 305 }
    });

    const report = analyzeYogas(input);
    const vasumati = report.yogas.find(y => y.type === YogaType.VASUMATI_YOGA);
    expect(vasumati).toBeDefined();
  });

  it('shouldRejectWhenOneRequiredBeneficIsOutsideUpachaya', () => {
    // Mercury is in House 2 (Taurus, non-Upachaya from Lagna or Moon)
    const input = createYogaInput(Sign.ARIES, {
      [Planet.SUN]: { house: 7, sign: Sign.LIBRA, eclipticLongitude: 200 },
      [Planet.MERCURY]: { house: 2, sign: Sign.TAURUS, eclipticLongitude: 45 },
      [Planet.VENUS]: { house: 6, sign: Sign.VIRGO, eclipticLongitude: 155 },
      [Planet.JUPITER]: { house: 10, sign: Sign.CAPRICORN, eclipticLongitude: 275 },
      [Planet.MOON]: { house: 11, sign: Sign.AQUARIUS, eclipticLongitude: 305 }
    });

    const report = analyzeYogas(input);
    const vasumati = report.yogas.find(y => y.type === YogaType.VASUMATI_YOGA);
    expect(vasumati).toBeUndefined();
  });

  it('shouldRejectWhenTwoRequiredBeneficsAreOutsideUpachaya', () => {
    const input = createYogaInput(Sign.ARIES, {
      [Planet.SUN]: { house: 7, sign: Sign.LIBRA, eclipticLongitude: 200 },
      [Planet.MERCURY]: { house: 2, sign: Sign.TAURUS, eclipticLongitude: 45 },
      [Planet.VENUS]: { house: 5, sign: Sign.LEO, eclipticLongitude: 125 },
      [Planet.JUPITER]: { house: 10, sign: Sign.CAPRICORN, eclipticLongitude: 275 },
      [Planet.MOON]: { house: 11, sign: Sign.AQUARIUS, eclipticLongitude: 305 }
    });

    const report = analyzeYogas(input);
    const vasumati = report.yogas.find(y => y.type === YogaType.VASUMATI_YOGA);
    expect(vasumati).toBeUndefined();
  });

  it('shouldRejectWhenBeneficsAreNotInUpachaya', () => {
    const input = createYogaInput(Sign.ARIES, {
      [Planet.SUN]: { house: 7, sign: Sign.LIBRA, eclipticLongitude: 200 },
      [Planet.MERCURY]: { house: 1, sign: Sign.ARIES, eclipticLongitude: 15 },
      [Planet.VENUS]: { house: 4, sign: Sign.CANCER, eclipticLongitude: 105 },
      [Planet.JUPITER]: { house: 7, sign: Sign.LIBRA, eclipticLongitude: 195 },
      [Planet.MOON]: { house: 5, sign: Sign.LEO, eclipticLongitude: 135 }
    });

    const report = analyzeYogas(input);
    const vasumati = report.yogas.find(y => y.type === YogaType.VASUMATI_YOGA);
    expect(vasumati).toBeUndefined();
  });

  it('shouldRejectNonBeneficPlanets', () => {
    // Malefics like Mars, Saturn, Sun occupying Upachaya houses do not make Vasumati Yoga
    const input = createYogaInput(Sign.ARIES, {
      [Planet.SUN]: { house: 3, sign: Sign.GEMINI, eclipticLongitude: 75 },
      [Planet.MARS]: { house: 6, sign: Sign.VIRGO, eclipticLongitude: 165 },
      [Planet.SATURN]: { house: 10, sign: Sign.CAPRICORN, eclipticLongitude: 285 },
      [Planet.MERCURY]: { house: 2, sign: Sign.TAURUS, eclipticLongitude: 45 },
      [Planet.VENUS]: { house: 2, sign: Sign.TAURUS, eclipticLongitude: 50 },
      [Planet.JUPITER]: { house: 2, sign: Sign.TAURUS, eclipticLongitude: 55 },
      [Planet.MOON]: { house: 2, sign: Sign.TAURUS, eclipticLongitude: 60 }
    });

    const report = analyzeYogas(input);
    const vasumati = report.yogas.find(y => y.type === YogaType.VASUMATI_YOGA);
    expect(vasumati).toBeUndefined();
  });

  it('shouldHandleWaxingMoon', () => {
    // Sun at 200, Moon at 315 -> phase = 115 (waxing)
    const input = createYogaInput(Sign.ARIES, {
      [Planet.SUN]: { house: 7, sign: Sign.LIBRA, eclipticLongitude: 200 },
      [Planet.MERCURY]: { house: 3, sign: Sign.GEMINI, eclipticLongitude: 65 },
      [Planet.VENUS]: { house: 6, sign: Sign.VIRGO, eclipticLongitude: 155 },
      [Planet.JUPITER]: { house: 10, sign: Sign.CAPRICORN, eclipticLongitude: 275 },
      [Planet.MOON]: { house: 11, sign: Sign.AQUARIUS, eclipticLongitude: 315 }
    });

    const report = analyzeYogas(input);
    const vasumati = report.yogas.find(y => y.type === YogaType.VASUMATI_YOGA);
    expect(vasumati).toBeDefined();
  });

  it('shouldRejectWaningMoon', () => {
    // Sun at 0, Moon at 270 -> phase = 270 (waning)
    const inputWaning = createYogaInput(Sign.ARIES, {
      [Planet.SUN]: { house: 1, sign: Sign.ARIES, eclipticLongitude: 0 },
      [Planet.MERCURY]: { house: 3, sign: Sign.GEMINI, eclipticLongitude: 65 },
      [Planet.VENUS]: { house: 6, sign: Sign.VIRGO, eclipticLongitude: 155 },
      [Planet.JUPITER]: { house: 10, sign: Sign.CAPRICORN, eclipticLongitude: 275 },
      [Planet.MOON]: { house: 11, sign: Sign.AQUARIUS, eclipticLongitude: 300 }
    });

    const report = analyzeYogas(inputWaning);
    const vasumati = report.yogas.find(y => y.type === YogaType.VASUMATI_YOGA);
    expect(vasumati).toBeUndefined();
  });

  it('shouldRejectNewMoonBoundary', () => {
    // Sun at 100, Moon at 100 -> phase = 0 (exact New Moon)
    const inputNewMoon = createYogaInput(Sign.ARIES, {
      [Planet.SUN]: { house: 4, sign: Sign.CANCER, eclipticLongitude: 100 },
      [Planet.MERCURY]: { house: 3, sign: Sign.GEMINI, eclipticLongitude: 65 },
      [Planet.VENUS]: { house: 6, sign: Sign.VIRGO, eclipticLongitude: 155 },
      [Planet.JUPITER]: { house: 10, sign: Sign.CAPRICORN, eclipticLongitude: 275 },
      [Planet.MOON]: { house: 11, sign: Sign.AQUARIUS, eclipticLongitude: 100 }
    });

    const report = analyzeYogas(inputNewMoon);
    const vasumati = report.yogas.find(y => y.type === YogaType.VASUMATI_YOGA);
    expect(vasumati).toBeUndefined();
  });

  it('shouldRejectFullMoonBoundary', () => {
    // Sun at 100, Moon at 280 -> phase = 180 (exact Full Moon)
    const inputFullMoon = createYogaInput(Sign.ARIES, {
      [Planet.SUN]: { house: 4, sign: Sign.CANCER, eclipticLongitude: 100 },
      [Planet.MERCURY]: { house: 3, sign: Sign.GEMINI, eclipticLongitude: 65 },
      [Planet.VENUS]: { house: 6, sign: Sign.VIRGO, eclipticLongitude: 155 },
      [Planet.JUPITER]: { house: 10, sign: Sign.CAPRICORN, eclipticLongitude: 275 },
      [Planet.MOON]: { house: 11, sign: Sign.AQUARIUS, eclipticLongitude: 280 }
    });

    const report = analyzeYogas(inputFullMoon);
    const vasumati = report.yogas.find(y => y.type === YogaType.VASUMATI_YOGA);
    expect(vasumati).toBeUndefined();
  });

  it('shouldPreserveReferenceFrame', () => {
    const input = createYogaInput(Sign.ARIES, {
      [Planet.SUN]: { house: 7, sign: Sign.LIBRA, eclipticLongitude: 200 },
      [Planet.MERCURY]: { house: 3, sign: Sign.GEMINI, eclipticLongitude: 65 },
      [Planet.VENUS]: { house: 6, sign: Sign.VIRGO, eclipticLongitude: 155 },
      [Planet.JUPITER]: { house: 10, sign: Sign.CAPRICORN, eclipticLongitude: 275 },
      [Planet.MOON]: { house: 11, sign: Sign.AQUARIUS, eclipticLongitude: 305 }
    });

    const report = analyzeYogas(input);
    const vasumati = report.yogas.find(y => y.type === YogaType.VASUMATI_YOGA);
    expect(vasumati?.evidence[0].referenceFrame).toBe('LAGNA');
  });

  it('shouldPreserveClassicalReference', () => {
    const input = createYogaInput(Sign.ARIES, {
      [Planet.SUN]: { house: 7, sign: Sign.LIBRA, eclipticLongitude: 200 },
      [Planet.MERCURY]: { house: 3, sign: Sign.GEMINI, eclipticLongitude: 65 },
      [Planet.VENUS]: { house: 6, sign: Sign.VIRGO, eclipticLongitude: 155 },
      [Planet.JUPITER]: { house: 10, sign: Sign.CAPRICORN, eclipticLongitude: 275 },
      [Planet.MOON]: { house: 11, sign: Sign.AQUARIUS, eclipticLongitude: 305 }
    });

    const report = analyzeYogas(input);
    const vasumati = report.yogas.find(y => y.type === YogaType.VASUMATI_YOGA);
    expect(vasumati?.evidence[0].classicalReference).toBe('PHALADEPIKA_VASUMATI_YOGA');
  });

  it('shouldRemainImmutable', () => {
    const input = createYogaInput(Sign.ARIES, {
      [Planet.SUN]: { house: 7, sign: Sign.LIBRA, eclipticLongitude: 200 },
      [Planet.MERCURY]: { house: 3, sign: Sign.GEMINI, eclipticLongitude: 65 },
      [Planet.VENUS]: { house: 6, sign: Sign.VIRGO, eclipticLongitude: 155 },
      [Planet.JUPITER]: { house: 10, sign: Sign.CAPRICORN, eclipticLongitude: 275 },
      [Planet.MOON]: { house: 11, sign: Sign.AQUARIUS, eclipticLongitude: 305 }
    });

    const report = analyzeYogas(input);
    const vasumati = report.yogas.find(y => y.type === YogaType.VASUMATI_YOGA)!;

    expect(Object.isFrozen(vasumati)).toBe(true);
    expect(Object.isFrozen(vasumati.planets)).toBe(true);
    expect(Object.isFrozen(vasumati.houses)).toBe(true);
    expect(Object.isFrozen(vasumati.evidence)).toBe(true);
    expect(Object.isFrozen(vasumati.evidence[0])).toBe(true);
  });

  it('shouldRejectMixedFrameCombinations', () => {
    // Mercury & Jupiter in Upachaya from Lagna (Houses 3 & 10),
    // but Venus in 5th from Lagna (NOT Upachaya from Lagna) and 3rd from Moon (Upachaya from Moon).
    // Moon in House 4 (Cancer).
    // Neither Lagna nor Moon frame has ALL benefics qualifying -> MUST REJECT
    const input = createYogaInput(Sign.ARIES, {
      [Planet.SUN]: { house: 2, sign: Sign.TAURUS, eclipticLongitude: 30 },
      [Planet.MOON]: { house: 4, sign: Sign.CANCER, eclipticLongitude: 100 },
      [Planet.MERCURY]: { house: 3, sign: Sign.GEMINI, eclipticLongitude: 65 },
      [Planet.JUPITER]: { house: 10, sign: Sign.CAPRICORN, eclipticLongitude: 275 },
      [Planet.VENUS]: { house: 5, sign: Sign.LEO, eclipticLongitude: 125 } // 5th from Lagna (not Upachaya), 2nd from Moon (not Upachaya)
    });

    const report = analyzeYogas(input);
    const vasumati = report.yogas.find(y => y.type === YogaType.VASUMATI_YOGA);
    expect(vasumati).toBeUndefined();
  });

  it('shouldDetectMultiFrameQualification', () => {
    // Both LAGNA and MOON qualify simultaneously:
    // Aries Lagna: Upachaya = [3, 6, 10, 11]
    // Moon in Virgo (House 6 from Lagna, sign Virgo). Phase waxing (Sun at 0, Moon at 160 -> phase 160).
    // Mercury in Gemini (House 3 from Lagna; 10th from Virgo).
    // Venus in Aquarius (House 11 from Lagna; 6th from Virgo).
    // Jupiter in Gemini (House 3 from Lagna; 10th from Virgo).
    // From Lagna: Mercury (3), Venus (11), Jupiter (3), Moon (6) -> ALL 4 in [3, 6, 10, 11] from Lagna!
    // From Moon Virgo: Mercury (Gemini = 10th), Venus (Aquarius = 6th), Jupiter (Gemini = 10th) -> ALL 3 in [3, 6, 10, 11] from Moon!
    const inputBothFrames = createYogaInput(Sign.ARIES, {
      [Planet.SUN]: { house: 1, sign: Sign.ARIES, eclipticLongitude: 0 },
      [Planet.MOON]: { house: 6, sign: Sign.VIRGO, eclipticLongitude: 160 },
      [Planet.MERCURY]: { house: 3, sign: Sign.GEMINI, eclipticLongitude: 65 },
      [Planet.VENUS]: { house: 11, sign: Sign.AQUARIUS, eclipticLongitude: 315 },
      [Planet.JUPITER]: { house: 3, sign: Sign.GEMINI, eclipticLongitude: 70 }
    });

    const report = analyzeYogas(inputBothFrames);
    const vasumatis = report.yogas.filter(y => y.type === YogaType.VASUMATI_YOGA);

    expect(vasumatis).toHaveLength(1); // One YogaResult
    expect(vasumatis[0].evidence).toHaveLength(2); // Two evidence entries (LAGNA and MOON)
    const frames = vasumatis[0].evidence.map(e => e.referenceFrame).sort();
    expect(frames).toEqual(['LAGNA', 'MOON']);
  });
});
