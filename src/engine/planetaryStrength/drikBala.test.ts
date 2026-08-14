import { describe, it, expect } from 'vitest';
import {
  Planet,
  Sign,
  StrengthComponentStatus,
  PlanetFact
} from '../../types';
import {
  calculateDrikBala,
  isNaturalBenefic,
  CLASSICAL_PLANETS
} from './drikBala';

function createMockPlanetFacts(
  overrides: Partial<Record<Planet, Partial<{ longitude: number; house: number; retrograde: boolean }>>> = {}
): Record<Planet, PlanetFact> {
  const result: Partial<Record<Planet, PlanetFact>> = {};
  const defaultLongitudes: Record<Planet, number> = {
    [Planet.SUN]: 0.0,
    [Planet.MOON]: 120.0,
    [Planet.MARS]: 90.0,
    [Planet.MERCURY]: 30.0,
    [Planet.JUPITER]: 180.0,
    [Planet.VENUS]: 60.0,
    [Planet.SATURN]: 270.0,
    [Planet.RAHU]: 15.0,
    [Planet.KETU]: 195.0
  };

  const defaultHouses: Record<Planet, number> = {
    [Planet.SUN]: 1,
    [Planet.MOON]: 5,
    [Planet.MARS]: 4,
    [Planet.MERCURY]: 2,
    [Planet.JUPITER]: 7,
    [Planet.VENUS]: 3,
    [Planet.SATURN]: 10,
    [Planet.RAHU]: 1,
    [Planet.KETU]: 7
  };

  for (const planet of Object.values(Planet)) {
    const ov = overrides[planet] || {};
    const long = ov.longitude ?? defaultLongitudes[planet];
    const house = ov.house ?? defaultHouses[planet];
    const isRetro = ov.retrograde ?? false;

    result[planet] = ({
      planet,
      position: {
        planet,
        eclipticLongitude: long,
        eclipticLatitude: 0,
        motion: {
          speed: isRetro ? -0.5 : 1.0,
          retrograde: isRetro,
          stationary: false
        }
      },
      sign: Sign.ARIES,
      signMetadata: {} as any,
      nakshatraResult: {} as any,
      nakshatraMetadata: {} as any,
      state: {
        planet,
        motion: {
          speed: isRetro ? -0.5 : 1.0,
          retrograde: isRetro,
          stationary: false
        },
        condition: {} as any
      },
      dignity: {} as any,
      house
    }) as any;
  }

  return result as unknown as Record<Planet, PlanetFact>;
}

describe('Drik Bala Engine (P-10 Aspectual Strength Calculation)', () => {
  describe('1. Natural Benefic / Malefic Classification', () => {
    it('should classify Jupiter and Venus as always Benefic', () => {
      const facts = createMockPlanetFacts();
      expect(isNaturalBenefic(Planet.JUPITER, facts)).toBe(true);
      expect(isNaturalBenefic(Planet.VENUS, facts)).toBe(true);
    });

    it('should classify Sun, Mars, and Saturn as always Malefic', () => {
      const facts = createMockPlanetFacts();
      expect(isNaturalBenefic(Planet.SUN, facts)).toBe(false);
      expect(isNaturalBenefic(Planet.MARS, facts)).toBe(false);
      expect(isNaturalBenefic(Planet.SATURN, facts)).toBe(false);
    });

    it('should classify Moon as Benefic during waxing phase and Malefic during waning phase', () => {
      // Waxing phase (phase = 90°) -> Benefic
      const waxingFacts = createMockPlanetFacts({
        [Planet.SUN]: { longitude: 0 },
        [Planet.MOON]: { longitude: 90 }
      });
      expect(isNaturalBenefic(Planet.MOON, waxingFacts)).toBe(true);

      // Waning phase (phase = 270°) -> Malefic
      const waningFacts = createMockPlanetFacts({
        [Planet.SUN]: { longitude: 0 },
        [Planet.MOON]: { longitude: 270 }
      });
      expect(isNaturalBenefic(Planet.MOON, waningFacts)).toBe(false);

      // Boundary phase 0° (exact new moon) -> Malefic (0 < phase < 180)
      const newMoonFacts = createMockPlanetFacts({
        [Planet.SUN]: { longitude: 50 },
        [Planet.MOON]: { longitude: 50 }
      });
      expect(isNaturalBenefic(Planet.MOON, newMoonFacts)).toBe(false);

      // Boundary phase 180° (exact full moon boundary) -> Malefic
      const fullMoonFacts = createMockPlanetFacts({
        [Planet.SUN]: { longitude: 0 },
        [Planet.MOON]: { longitude: 180 }
      });
      expect(isNaturalBenefic(Planet.MOON, fullMoonFacts)).toBe(false);
    });

    it('should classify Mercury as Benefic when unafflicted and Malefic when conjunct malefics', () => {
      // Unafflicted in house 2 (no malefics in house 2)
      const cleanFacts = createMockPlanetFacts({
        [Planet.MERCURY]: { house: 2 },
        [Planet.SUN]: { house: 1 },
        [Planet.MARS]: { house: 4 },
        [Planet.SATURN]: { house: 10 },
        [Planet.RAHU]: { house: 1 },
        [Planet.KETU]: { house: 7 }
      });
      expect(isNaturalBenefic(Planet.MERCURY, cleanFacts)).toBe(true);

      // Conjunct Sun in house 3
      const sunConjunctFacts = createMockPlanetFacts({
        [Planet.MERCURY]: { house: 3 },
        [Planet.SUN]: { house: 3 }
      });
      expect(isNaturalBenefic(Planet.MERCURY, sunConjunctFacts)).toBe(false);

      // Conjunct Mars in house 4
      const marsConjunctFacts = createMockPlanetFacts({
        [Planet.MERCURY]: { house: 4 },
        [Planet.MARS]: { house: 4 }
      });
      expect(isNaturalBenefic(Planet.MERCURY, marsConjunctFacts)).toBe(false);

      // Conjunct Saturn in house 5
      const saturnConjunctFacts = createMockPlanetFacts({
        [Planet.MERCURY]: { house: 5 },
        [Planet.SATURN]: { house: 5 }
      });
      expect(isNaturalBenefic(Planet.MERCURY, saturnConjunctFacts)).toBe(false);

      // Conjunct Rahu in house 6
      const rahuConjunctFacts = createMockPlanetFacts({
        [Planet.MERCURY]: { house: 6 },
        [Planet.RAHU]: { house: 6 }
      });
      expect(isNaturalBenefic(Planet.MERCURY, rahuConjunctFacts)).toBe(false);

      // Conjunct Ketu in house 7
      const ketuConjunctFacts = createMockPlanetFacts({
        [Planet.MERCURY]: { house: 7 },
        [Planet.KETU]: { house: 7 }
      });
      expect(isNaturalBenefic(Planet.MERCURY, ketuConjunctFacts)).toBe(false);
    });

    it('should distinguish whole-sign conjunction from adjacent house placements for Mercury', () => {
      // Mercury in house 5, Mars in house 6 -> Not conjunct -> Benefic
      const adjacentFacts = createMockPlanetFacts({
        [Planet.MERCURY]: { house: 5 },
        [Planet.MARS]: { house: 6 },
        [Planet.SUN]: { house: 1 },
        [Planet.SATURN]: { house: 10 },
        [Planet.RAHU]: { house: 1 },
        [Planet.KETU]: { house: 7 }
      });
      expect(isNaturalBenefic(Planet.MERCURY, adjacentFacts)).toBe(true);
    });
  });

  describe('2. Aspect Rectification & Value Unboundedness', () => {
    it('should rectify benefic aspect by 1.25x (exceeding 60 Shastiamsas without capping)', () => {
      // Set Jupiter at 0° and Sun at 180°.
      // Sphuta drishti from Jupiter to Sun is 60.
      // Rectified: 60 * 1.25 = 75.00 Shastiamsas.
      // Other planets placed so they cast 0 aspect onto Sun (e.g. angle 0 or 15°).
      const facts = createMockPlanetFacts({
        [Planet.SUN]: { longitude: 180, house: 7 },
        [Planet.JUPITER]: { longitude: 0, house: 1 },
        [Planet.MOON]: { longitude: 180, house: 7 }, // 0 aspect onto Sun
        [Planet.MARS]: { longitude: 180, house: 7 }, // 0 aspect
        [Planet.MERCURY]: { longitude: 180, house: 7 }, // 0 aspect
        [Planet.VENUS]: { longitude: 180, house: 7 }, // 0 aspect
        [Planet.SATURN]: { longitude: 180, house: 7 } // 0 aspect
      });

      const res = calculateDrikBala(Planet.SUN, facts);
      expect(res.status).toBe(StrengthComponentStatus.CALCULATED);
      expect(res.contributions.length).toBe(1);
      expect(res.contributions[0].sourcePlanet).toBe(Planet.JUPITER);
      expect(res.contributions[0].targetPlanet).toBe(Planet.SUN);
      expect(res.contributions[0].sphutaValue).toBeCloseTo(60, 6);
      expect(res.contributions[0].rectificationFactor).toBe(1.25);
      expect(res.contributions[0].rectifiedValue).toBeCloseTo(75, 6);
      expect(res.beneficTotal).toBeCloseTo(75, 2);
      expect(res.maleficTotal).toBeCloseTo(0, 2);
      expect(res.value).toBeCloseTo(75, 2);
    });

    it('should rectify malefic aspect by 0.75x and produce negative Drik Bala when malefic aspects dominate', () => {
      // Set Saturn at 0° and Sun at 180°.
      // Sphuta drishti from Saturn to Sun is 60.
      // Rectified: 60 * 0.75 = 45.00 Shastiamsas.
      // Net Drik Bala = 0 - 45 = -45.00 Shastiamsas (NOT clamped to 0).
      const facts = createMockPlanetFacts({
        [Planet.SUN]: { longitude: 180, house: 7 },
        [Planet.SATURN]: { longitude: 0, house: 1 },
        [Planet.MOON]: { longitude: 180, house: 7 },
        [Planet.MARS]: { longitude: 180, house: 7 },
        [Planet.MERCURY]: { longitude: 180, house: 7 },
        [Planet.JUPITER]: { longitude: 180, house: 7 },
        [Planet.VENUS]: { longitude: 180, house: 7 }
      });

      const res = calculateDrikBala(Planet.SUN, facts);
      expect(res.status).toBe(StrengthComponentStatus.CALCULATED);
      expect(res.contributions.length).toBe(1);
      expect(res.contributions[0].sourcePlanet).toBe(Planet.SATURN);
      expect(res.contributions[0].targetPlanet).toBe(Planet.SUN);
      expect(res.contributions[0].sphutaValue).toBeCloseTo(60, 6);
      expect(res.contributions[0].rectificationFactor).toBe(0.75);
      expect(res.contributions[0].rectifiedValue).toBeCloseTo(45, 6);
      expect(res.beneficTotal).toBeCloseTo(0, 2);
      expect(res.maleficTotal).toBeCloseTo(45, 2);
      expect(res.value).toBeCloseTo(-45, 2);
    });

    it('should correctly calculate net Drik Bala from mixed benefic and malefic aspects', () => {
      // Target: Mars at 180°
      // Benefic: Jupiter at 0° -> 180° aspect = 60 * 1.25 = 75.00
      // Malefic: Saturn at 90° -> (180 - 90) = 90° aspect from Saturn -> Saturn general at 90° is 45 -> 45 * 0.75 = 33.75
      // Net Drik Bala = 75.00 - 33.75 = 41.25
      const facts = createMockPlanetFacts({
        [Planet.MARS]: { longitude: 180, house: 7 },
        [Planet.JUPITER]: { longitude: 0, house: 1 },
        [Planet.SATURN]: { longitude: 90, house: 4 },
        [Planet.SUN]: { longitude: 180, house: 7 },
        [Planet.MOON]: { longitude: 180, house: 7 },
        [Planet.MERCURY]: { longitude: 180, house: 7 },
        [Planet.VENUS]: { longitude: 180, house: 7 }
      });

      const res = calculateDrikBala(Planet.MARS, facts);
      expect(res.status).toBe(StrengthComponentStatus.CALCULATED);
      expect(res.beneficTotal).toBeCloseTo(75, 2);
      expect(res.maleficTotal).toBeCloseTo(33.75, 2);
      expect(res.value).toBeCloseTo(41.25, 2);
      expect(res.contributions.length).toBe(2);
      for (const contrib of res.contributions) {
        expect(contrib.targetPlanet).toBe(Planet.MARS);
      }
    });
  });

  describe('3. Mutual Aspects & Directionality', () => {
    it('should calculate mutual aspects independently in both directions', () => {
      // Sun at 10°, Jupiter at 190°
      // Sun -> Jupiter: angle = (190 - 10) = 180° -> 60 * 0.75 = 45 malefic
      // Jupiter -> Sun: angle = (10 - 190 + 360) = 180° -> 60 * 1.25 = 75 benefic
      const facts = createMockPlanetFacts({
        [Planet.SUN]: { longitude: 10, house: 1 },
        [Planet.JUPITER]: { longitude: 190, house: 7 },
        [Planet.MOON]: { longitude: 10, house: 1 },
        [Planet.MARS]: { longitude: 10, house: 1 },
        [Planet.MERCURY]: { longitude: 10, house: 1 },
        [Planet.VENUS]: { longitude: 10, house: 1 },
        [Planet.SATURN]: { longitude: 10, house: 1 }
      });

      const sunDrik = calculateDrikBala(Planet.SUN, facts);
      const jupiterDrik = calculateDrikBala(Planet.JUPITER, facts);

      // Sun receives Jupiter aspect (+75 benefic)
      const sunFromJupiter = sunDrik.contributions.find(c => c.sourcePlanet === Planet.JUPITER);
      expect(sunFromJupiter).toBeDefined();
      expect(sunFromJupiter?.sourcePlanet).toBe(Planet.JUPITER);
      expect(sunFromJupiter?.targetPlanet).toBe(Planet.SUN);
      expect(sunFromJupiter?.aspectAngle).toBeCloseTo(180, 6);
      expect(sunFromJupiter?.sphutaValue).toBeCloseTo(60, 6);
      expect(sunFromJupiter?.naturalClassification).toBe('BENEFIC');
      expect(sunFromJupiter?.rectificationFactor).toBe(1.25);
      expect(sunFromJupiter?.rectifiedValue).toBeCloseTo(75, 6);

      // Jupiter receives Sun aspect (-45 malefic contribution)
      const jupiterFromSun = jupiterDrik.contributions.find(c => c.sourcePlanet === Planet.SUN);
      expect(jupiterFromSun).toBeDefined();
      expect(jupiterFromSun?.sourcePlanet).toBe(Planet.SUN);
      expect(jupiterFromSun?.targetPlanet).toBe(Planet.JUPITER);
      expect(jupiterFromSun?.aspectAngle).toBeCloseTo(180, 6);
      expect(jupiterFromSun?.sphutaValue).toBeCloseTo(60, 6);
      expect(jupiterFromSun?.naturalClassification).toBe('MALEFIC');
      expect(jupiterFromSun?.rectificationFactor).toBe(0.75);
      expect(jupiterFromSun?.rectifiedValue).toBeCloseTo(45, 6);
    });
  });

  describe('4. Rahu and Ketu Handling', () => {
    it('should return NOT_IMPLEMENTED for Rahu and Ketu target planets', () => {
      const facts = createMockPlanetFacts();
      const rahuRes = calculateDrikBala(Planet.RAHU, facts);
      expect(rahuRes.status).toBe(StrengthComponentStatus.NOT_IMPLEMENTED);
      expect(rahuRes.value).toBeUndefined();
      expect(rahuRes.contributions).toEqual([]);

      const ketuRes = calculateDrikBala(Planet.KETU, facts);
      expect(ketuRes.status).toBe(StrengthComponentStatus.NOT_IMPLEMENTED);
      expect(ketuRes.value).toBeUndefined();
      expect(ketuRes.contributions).toEqual([]);
    });

    it('should never include Rahu or Ketu as aspect sources in contributions', () => {
      const facts = createMockPlanetFacts();
      for (const p of CLASSICAL_PLANETS) {
        const res = calculateDrikBala(p, facts);
        const sourcePlanets = res.contributions.map((c) => c.sourcePlanet);
        expect(sourcePlanets).not.toContain(Planet.RAHU);
        expect(sourcePlanets).not.toContain(Planet.KETU);
      }
    });
  });

  describe('5. Immutability, Determinism & Input Validation', () => {
    it('should return deeply frozen results and contributions', () => {
      const facts = createMockPlanetFacts();
      const res = calculateDrikBala(Planet.MOON, facts);
      expect(Object.isFrozen(res)).toBe(true);
      expect(Object.isFrozen(res.contributions)).toBe(true);
      if (res.contributions.length > 0) {
        expect(Object.isFrozen(res.contributions[0])).toBe(true);
      }
    });

    it('should not mutate planetFacts input', () => {
      const facts = createMockPlanetFacts();
      const clonedFacts = JSON.parse(JSON.stringify(facts));
      calculateDrikBala(Planet.MARS, facts);
      expect(facts).toEqual(clonedFacts);
    });

    it('should be strictly deterministic', () => {
      const facts = createMockPlanetFacts();
      const res1 = calculateDrikBala(Planet.VENUS, facts);
      const res2 = calculateDrikBala(Planet.VENUS, facts);
      expect(res1).toEqual(res2);
    });

    it('should throw on null or invalid planetFacts', () => {
      expect(() => calculateDrikBala(Planet.SUN, null as unknown as Record<Planet, PlanetFact>)).toThrow(TypeError);
    });
  });
});
