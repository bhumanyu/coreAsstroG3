import { describe, it, expect } from 'vitest';
import {
  Sign,
  Planet,
  Chart,
  ChartType,
  PlanetFact,
  PlanetFacts,
  PlanetCondition,
  DignityStatus,
  Nakshatra,
  Pada,
  Element,
  Modality,
  Gender,
  Polarity
} from '../../types';
import { analyzeYogas } from './yogaEngine';
import { analyzeHouseLordship } from '../houseLordship/houseLordship';
import { YogaType, YogaCategory, YogaStrength, YogaDignity, YogaAnalysisInput, YogaStrengthLevel } from './yogaTypes';

function createDummyFact(planet: Planet, house: number, overrides?: Partial<PlanetFact>): PlanetFact {
  return {
    planet,
    position: {
      planet,
      eclipticLongitude: 0,
      eclipticLatitude: 0,
      longitude: 0,
      sign: Sign.LEO,
      house,
      signLongitude: 0,
      motion: {
        speed: 1,
        retrograde: false,
        stationary: false
      }
    },
    sign: Sign.LEO,
    signMetadata: {
      sign: Sign.LEO,
      number: 1,
      englishName: 'Aries',
      sanskritName: 'Mesha',
      startDegree: 0,
      endDegree: 30,
      element: Element.FIRE,
      modality: Modality.MOVABLE,
      gender: Gender.MASCULINE,
      polarity: Polarity.POSITIVE,
      ruler: Planet.MARS
    },
    nakshatraResult: {
      planet,
      nakshatra: {
        index: 1,
        name: 'Ashwini',
        ruler: Planet.KETU,
        deity: 'Ashwini Kumaras',
        symbol: 'Horse head',
        gana: 'DEVA',
        yoni: 'Horse',
        element: 'Earth'
      },
      pada: 1,
      longitude: 0,
      padaLongitude: 0,
      degreeInPada: 0
    },
    nakshatraMetadata: {
      index: 1,
      name: 'Ashwini',
      ruler: Planet.KETU,
      deity: 'Ashwini Kumaras',
      symbol: 'Horse head',
      gana: 'DEVA',
      yoni: 'Horse',
      element: 'Earth'
    },
    state: {
      planet,
      motion: {
        speed: 1,
        retrograde: false,
        stationary: false
      },
      condition: PlanetCondition.NORMAL
    },
    dignity: {
      planet,
      sign: Sign.ARIES,
      status: DignityStatus.NEUTRAL
    },
    house,
    ...overrides
  };
}

function createInput(opts: {
  moonHouse: number;
  jupiterHouse: number;
  moonOverrides?: Partial<PlanetFact>;
  jupiterOverrides?: Partial<PlanetFact>;
}): YogaAnalysisInput {
  const allPlanets = Object.values(Planet);
  const planetFactsPartial: Partial<Record<Planet, PlanetFact>> = {};

  const marsHouse = (opts.moonHouse % 12) + 1;

  const defaultHouseMap: Record<Planet, number> = {
    [Planet.SUN]: 3,
    [Planet.MOON]: opts.moonHouse,
    [Planet.MARS]: marsHouse,
    [Planet.MERCURY]: 6,
    [Planet.JUPITER]: opts.jupiterHouse,
    [Planet.VENUS]: 2,
    [Planet.SATURN]: 10,
    [Planet.RAHU]: 5,
    [Planet.KETU]: 11
  };

  for (const planet of allPlanets) {
    if (planet === Planet.MOON) {
      planetFactsPartial[planet] = createDummyFact(planet, opts.moonHouse, opts.moonOverrides);
    } else if (planet === Planet.JUPITER) {
      planetFactsPartial[planet] = createDummyFact(planet, opts.jupiterHouse, opts.jupiterOverrides);
    } else {
      planetFactsPartial[planet] = createDummyFact(planet, defaultHouseMap[planet]);
    }
  }

  return {
    planetFacts: planetFactsPartial as unknown as Record<Planet, PlanetFact>
  };
}

describe('Yoga Engine - Gaja Kesari Yoga (PR-043)', () => {
  describe('Positive Tests', () => {
    it('detects exactly one GAJA_KESARI when Moon is in 1 and Jupiter is in 1, 4, 7, or 10', () => {
      for (const jupHouse of [1, 4, 7, 10]) {
        const input = createInput({ moonHouse: 1, jupiterHouse: jupHouse });
        const report = analyzeYogas(input);

        expect(report.yogas.length).toBe(1);
        expect(report.yogas[0].type).toBe(YogaType.GAJA_KESARI);
      }
    });
  });

  describe('Negative Tests', () => {
    it('returns empty array when Moon is in 1 and Jupiter is in non-kendra houses 2, 5, or 8', () => {
      for (const jupHouse of [2, 5, 8]) {
        const input = createInput({ moonHouse: 1, jupiterHouse: jupHouse });
        const report = analyzeYogas(input);

        expect(report.yogas).toEqual([]);
      }
    });
  });

  describe('Full 12x12 Matrix Test', () => {
    it('agrees with independent calculation for all 144 Moon x Jupiter house combinations', () => {
      for (let moonH = 1; moonH <= 12; moonH++) {
        for (let jupH = 1; jupH <= 12; jupH++) {
          const input = createInput({ moonHouse: moonH, jupiterHouse: jupH });
          const report = analyzeYogas(input);

          const distance = (jupH - moonH + 12) % 12;
          const expectedPresent = [0, 3, 6, 9].includes(distance);

          if (expectedPresent) {
            expect(report.yogas.length).toBe(1);
            expect(report.yogas[0].type).toBe(YogaType.GAJA_KESARI);
          } else {
            expect(report.yogas).toEqual([]);
          }
        }
      }
    });
  });

  describe('Wraparound & Rotation Tests', () => {
    it('detects Yoga for wraparound distances: Moon 10 / Jupiter 1 (distance 3) and Moon 10 / Jupiter 7 (distance 9)', () => {
      const report3 = analyzeYogas(createInput({ moonHouse: 10, jupiterHouse: 1 }));
      expect(report3.yogas.length).toBe(1);
      expect(report3.yogas[0].type).toBe(YogaType.GAJA_KESARI);

      const report9 = analyzeYogas(createInput({ moonHouse: 10, jupiterHouse: 7 }));
      expect(report9.yogas.length).toBe(1);
      expect(report9.yogas[0].type).toBe(YogaType.GAJA_KESARI);
    });

    it('verifies rotation: for each Moon house, exactly 4 Jupiter houses produce Yoga (Moon, Moon+3, Moon+6, Moon+9 mod 12)', () => {
      for (let m = 1; m <= 12; m++) {
        const expectedHouses = [
          m,
          ((m - 1 + 3) % 12) + 1,
          ((m - 1 + 6) % 12) + 1,
          ((m - 1 + 9) % 12) + 1
        ];

        for (let j = 1; j <= 12; j++) {
          const report = analyzeYogas(createInput({ moonHouse: m, jupiterHouse: j }));
          if (expectedHouses.includes(j)) {
            expect(report.yogas.length).toBe(1);
          } else {
            expect(report.yogas).toEqual([]);
          }
        }
      }
    });

    it('confirms reverse-direction / Moon-relative formula: Moon 2 / Jupiter 5 -> Yoga', () => {
      const report = analyzeYogas(createInput({ moonHouse: 2, jupiterHouse: 5 }));
      expect(report.yogas.length).toBe(1);
      expect(report.yogas[0].type).toBe(YogaType.GAJA_KESARI);
    });
  });

  describe('Evidence Assertions', () => {
    it('asserts complete evidence and structure for detected Yoga', () => {
      const input = createInput({ moonHouse: 1, jupiterHouse: 4 });
      const report = analyzeYogas(input);

      expect(report.yogas.length).toBe(1);
      const yoga = report.yogas[0];

      expect(yoga.type).toBe(YogaType.GAJA_KESARI);
      expect(yoga.category).toBe(YogaCategory.RAJA);
      expect(yoga.strength).toBe(YogaStrength.STRONG);
      expect(yoga.planets).toEqual([Planet.MOON, Planet.JUPITER]);
      expect(yoga.houses).toEqual([1, 4]);

      expect(yoga.evidence.length).toBe(1);
      const ev = yoga.evidence[0];
      expect(ev.ruleId).toBe('YOGA_GAJA_KESARI_001');
      expect(ev.reason).toBe('Gaja Kesari Yoga formed because Jupiter occupies a Kendra from the Moon.');
      expect(ev.planets).toEqual([Planet.MOON, Planet.JUPITER]);
      expect(ev.houses).toEqual([1, 4]);
      expect(ev.relativeHouseDistance).toBe(3);
    });
  });

  describe('Modifier Independence & Lagna-Relative Guard', () => {
    it('detects Yoga regardless of dignity or combustion states', () => {
      const input = createInput({
        moonHouse: 1,
        jupiterHouse: 4,
        moonOverrides: {
          dignity: { planet: Planet.MOON, sign: Sign.SCORPIO, status: DignityStatus.DEBILITATED },
          state: { planet: Planet.MOON, motion: { speed: 1, retrograde: false, stationary: false }, condition: PlanetCondition.COMBUST }
        },
        jupiterOverrides: {
          dignity: { planet: Planet.JUPITER, sign: Sign.CAPRICORN, status: DignityStatus.DEBILITATED },
          state: { planet: Planet.JUPITER, motion: { speed: -0.1, retrograde: true, stationary: false }, condition: PlanetCondition.DEEP_COMBUST }
        }
      });

      const report = analyzeYogas(input);
      expect(report.yogas.length).toBe(1);
      expect(report.yogas[0].type).toBe(YogaType.GAJA_KESARI);
    });

    it('Moon 2 / Jupiter 5 forms Yoga regardless of Lagna house placement', () => {
      const input = createInput({ moonHouse: 2, jupiterHouse: 5 });
      const report = analyzeYogas(input);
      expect(report.yogas.length).toBe(1);
      expect(report.yogas[0].type).toBe(YogaType.GAJA_KESARI);
    });
  });

  describe('Validation & Error Handling', () => {
    it('throws TypeError for null or invalid inputs', () => {
      expect(() => analyzeYogas(null as any)).toThrow(TypeError);
      expect(() => analyzeYogas({} as any)).toThrow(TypeError);
      expect(() => analyzeYogas({ planetFacts: null } as any)).toThrow(TypeError);
    });

    it('throws TypeError for missing Moon or Jupiter facts', () => {
      const valid = createInput({ moonHouse: 1, jupiterHouse: 4 });
      
      const noMoon = { ...valid, planetFacts: { ...valid.planetFacts, [Planet.MOON]: undefined as any } };
      expect(() => analyzeYogas(noMoon)).toThrow(TypeError);

      const noJup = { ...valid, planetFacts: { ...valid.planetFacts, [Planet.JUPITER]: undefined as any } };
      expect(() => analyzeYogas(noJup)).toThrow(TypeError);
    });

    it('throws TypeError when planetFacts entry does not match planet identity', () => {
      const valid = createInput({ moonHouse: 1, jupiterHouse: 4 });

      const wrongMoonPlanet = {
        ...valid,
        planetFacts: {
          ...valid.planetFacts,
          [Planet.MOON]: { ...valid.planetFacts[Planet.MOON], planet: Planet.SUN }
        }
      };
      expect(() => analyzeYogas(wrongMoonPlanet)).toThrow('Moon facts must identify Planet.MOON.');

      const wrongJupiterPlanet = {
        ...valid,
        planetFacts: {
          ...valid.planetFacts,
          [Planet.JUPITER]: { ...valid.planetFacts[Planet.JUPITER], planet: Planet.SUN }
        }
      };
      expect(() => analyzeYogas(wrongJupiterPlanet)).toThrow('Jupiter facts must identify Planet.JUPITER.');
    });

    it('throws TypeError for invalid house numbers (0 or 13)', () => {
      const badMoon0 = createInput({ moonHouse: 0, jupiterHouse: 4 });
      expect(() => analyzeYogas(badMoon0)).toThrow(TypeError);

      const badMoon13 = createInput({ moonHouse: 13, jupiterHouse: 4 });
      expect(() => analyzeYogas(badMoon13)).toThrow(TypeError);

      const badJup0 = createInput({ moonHouse: 1, jupiterHouse: 0 });
      expect(() => analyzeYogas(badJup0)).toThrow(TypeError);

      const badJup13 = createInput({ moonHouse: 1, jupiterHouse: 13 });
      expect(() => analyzeYogas(badJup13)).toThrow(TypeError);
    });
  });

  describe('Immutability', () => {
    it('returns frozen report, yogas array, YogaResult, evidence array, and YogaEvidence', () => {
      const input = createInput({ moonHouse: 1, jupiterHouse: 4 });
      const report = analyzeYogas(input);

      expect(Object.isFrozen(report)).toBe(true);
      expect(Object.isFrozen(report.yogas)).toBe(true);

      const yoga = report.yogas[0];
      expect(Object.isFrozen(yoga)).toBe(true);
      expect(Object.isFrozen(yoga.planets)).toBe(true);
      expect(Object.isFrozen(yoga.houses)).toBe(true);
      expect(Object.isFrozen(yoga.evidence)).toBe(true);

      const ev = yoga.evidence[0];
      expect(Object.isFrozen(ev)).toBe(true);
      expect(Object.isFrozen(ev.planets)).toBe(true);
      expect(Object.isFrozen(ev.houses)).toBe(true);
    });

    it('shouldAttachYogaAssessment to detected yogas', () => {
      const input = createInput({ moonHouse: 1, jupiterHouse: 4 });
      const report = analyzeYogas(input);

      expect(report.yogas.length).toBeGreaterThan(0);
      const yoga = report.yogas[0];
      expect(yoga.assessment).toBeDefined();
      expect(yoga.assessment!.formationPresent).toBe(true);
      expect(yoga.supportingFactors).toBeDefined();
      expect(yoga.weakeningFactors).toBeDefined();
      expect(yoga.cancellationFactors).toBeDefined();
      expect(yoga.modifiers).toBeDefined();
    });

    it('shouldAttachWeakAssessmentToAfflictedYoga', () => {
      const input = createInput({
        moonHouse: 1,
        jupiterHouse: 4,
        moonOverrides: {
          dignity: { planet: Planet.MOON, sign: Sign.SCORPIO, status: DignityStatus.DEBILITATED }
        },
        jupiterOverrides: {
          dignity: { planet: Planet.JUPITER, sign: Sign.CAPRICORN, status: DignityStatus.DEBILITATED }
        }
      });
      const report = analyzeYogas(input);

      expect(report.yogas.length).toBeGreaterThan(0);
      const gkYoga = report.yogas.find(y => y.type === YogaType.GAJA_KESARI);
      expect(gkYoga).toBeDefined();
      expect(gkYoga!.assessment).toBeDefined();
      expect(gkYoga!.assessment!.strength).toBe(YogaStrengthLevel.VERY_WEAK);
      expect(gkYoga!.assessment!.finalStatus).toBe('WEAKENED');
    });

    it('shouldAttachStrongAssessmentWhenMajorSupportExists', () => {
      const input = createInput({
        moonHouse: 1,
        jupiterHouse: 4,
        jupiterOverrides: {
          dignity: { planet: Planet.JUPITER, sign: Sign.CANCER, status: DignityStatus.EXALTED }
        }
      });
      const report = analyzeYogas(input);

      expect(report.yogas.length).toBeGreaterThan(0);
      const gkYoga = report.yogas.find(y => y.type === YogaType.GAJA_KESARI);
      expect(gkYoga).toBeDefined();
      expect(gkYoga!.assessment).toBeDefined();
      expect(gkYoga!.assessment!.strength).toBe(YogaStrengthLevel.STRONG);
      expect(gkYoga!.assessment!.finalStatus).toBe('STRONG');
    });
  });

  describe('Multi-Yoga Coexistence', () => {
    it('detects Dhana, Lakshmi, and Chandra-Mangala Yogas simultaneously without collapsing', () => {
      const houseLordship = analyzeHouseLordship(Sign.ARIES);

      // Aries Lagna:
      // Mars (Lagna lord) in H1 (Aries, OWN_SIGN), Moon in H1 (Aries) -> Chandra-Mangala
      // Jupiter (9th lord) in H4 (Cancer, EXALTED) -> Lakshmi Yoga with Mars
      // Venus (2nd lord) and Saturn (11th lord) in H2 (Taurus) -> Dhana Yoga YOGA_DHANA_001
      const planetFacts: Partial<Record<Planet, PlanetFact>> = {
        [Planet.SUN]: createDummyFact(Planet.SUN, 3),
        [Planet.MOON]: createDummyFact(Planet.MOON, 1, { sign: Sign.ARIES }),
        [Planet.MARS]: createDummyFact(Planet.MARS, 1, {
          sign: Sign.ARIES,
          dignity: { planet: Planet.MARS, sign: Sign.ARIES, status: DignityStatus.OWN_SIGN }
        }),
        [Planet.MERCURY]: createDummyFact(Planet.MERCURY, 6),
        [Planet.JUPITER]: createDummyFact(Planet.JUPITER, 4, {
          sign: Sign.CANCER,
          dignity: { planet: Planet.JUPITER, sign: Sign.CANCER, status: DignityStatus.EXALTED }
        }),
        [Planet.VENUS]: createDummyFact(Planet.VENUS, 2, { sign: Sign.TAURUS }),
        [Planet.SATURN]: createDummyFact(Planet.SATURN, 2, { sign: Sign.TAURUS }),
        [Planet.RAHU]: createDummyFact(Planet.RAHU, 3),
        [Planet.KETU]: createDummyFact(Planet.KETU, 9)
      };

      const report = analyzeYogas({
        planetFacts: planetFacts as unknown as Record<Planet, PlanetFact>,
        houseLordship
      });

      const types = report.yogas.map(y => y.type);
      expect(types).toContain(YogaType.DHANA_YOGA);
      expect(types).toContain(YogaType.LAKSHMI_YOGA);
      expect(types).toContain(YogaType.CHANDRA_MANGALA_YOGA);
    });
  });
});

