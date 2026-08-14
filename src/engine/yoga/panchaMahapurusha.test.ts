import { describe, it, expect } from 'vitest';
import {
  Sign,
  SignMetadata,
  Planet,
  PlanetFact,
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
import { YogaType, YogaCategory, YogaStrength, YogaDignity, YogaAnalysisInput } from './yogaTypes';

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

function getNonContaminatingHouses(overrides?: Partial<Record<Planet, { house?: number; sign?: Sign }>>) {
  const jup = overrides?.[Planet.JUPITER]?.house ?? 3;
  const mars = overrides?.[Planet.MARS]?.house ?? 8;
  let moon = overrides?.[Planet.MOON]?.house;

  if (moon === undefined) {
    for (let h = 1; h <= 12; h++) {
      if (h === mars) continue;
      const dist = (jup - h + 12) % 12;
      if (dist % 3 !== 0) {
        moon = h;
        break;
      }
    }
  }

  return { jup, mars, moon: moon! };
}

// Keep Moon/Jupiter non-Kendra-relative by default so PR-043
// Gaja Kesari does not contaminate PR-044 exact-set assertions.
function createMahapurushaInput(
  overrides?: Partial<Record<Planet, { house?: number; sign?: Sign }>>
): YogaAnalysisInput {
  const allPlanets = Object.values(Planet);
  const planetFactsPartial: Partial<Record<Planet, PlanetFact>> = {};

  const { jup, mars, moon } = getNonContaminatingHouses(overrides);

  for (const planet of allPlanets) {
    const override = overrides?.[planet];
    let defaultHouse = 2;
    if (planet === Planet.JUPITER) {
      defaultHouse = jup;
    } else if (planet === Planet.MOON) {
      defaultHouse = moon;
    } else if (planet === Planet.MARS) {
      defaultHouse = mars;
    }
    const house = override?.house ?? defaultHouse;
    const sign = override?.sign ?? Sign.LEO;

    const baseFact = createDummyFact(planet, house);
    planetFactsPartial[planet] = {
      ...baseFact,
      house,
      sign,
      signMetadata: {
        ...baseFact.signMetadata,
        sign
      } as SignMetadata,
      dignity: {
        planet,
        sign,
        status: DignityStatus.NEUTRAL
      }
    };
  }

  return {
    planetFacts: planetFactsPartial as unknown as Record<Planet, PlanetFact>
  };
}

describe('Yoga Engine - Pancha Mahapurusha Yogas (PR-044)', () => {
  describe('Item 16: Ruchaka Yoga', () => {
    it('detects Ruchaka for Mars in own/exaltation sign in a Kendra', () => {
      const input1 = createMahapurushaInput({ [Planet.MARS]: { sign: Sign.ARIES, house: 1 } });
      const report1 = analyzeYogas(input1);
      expect(report1.yogas.length).toBe(1);
      expect(report1.yogas[0].type).toBe(YogaType.RUCHAKA);

      const input4 = createMahapurushaInput({ [Planet.MARS]: { sign: Sign.SCORPIO, house: 4 } });
      const report4 = analyzeYogas(input4);
      expect(report4.yogas.length).toBe(1);
      expect(report4.yogas[0].type).toBe(YogaType.RUCHAKA);

      const input10 = createMahapurushaInput({ [Planet.MARS]: { sign: Sign.CAPRICORN, house: 10 } });
      const report10 = analyzeYogas(input10);
      expect(report10.yogas.length).toBe(1);
      expect(report10.yogas[0].type).toBe(YogaType.RUCHAKA);
    });

    it('rejects Ruchaka when Mars is not in a Kendra or not in qualifying sign', () => {
      const inputHouse5 = createMahapurushaInput({ [Planet.MARS]: { sign: Sign.ARIES, house: 5 } });
      expect(analyzeYogas(inputHouse5).yogas).toEqual([]);

      const inputTaurus = createMahapurushaInput({ [Planet.MARS]: { sign: Sign.TAURUS, house: 1 } });
      expect(analyzeYogas(inputTaurus).yogas).toEqual([]);
    });
  });

  describe('Item 17: Bhadra Yoga', () => {
    it('detects Bhadra for Mercury in Gemini (house 1) and Virgo (house 10) with exact dignity checks', () => {
      const inputGemini = createMahapurushaInput({ [Planet.MERCURY]: { sign: Sign.GEMINI, house: 1 } });
      const reportGemini = analyzeYogas(inputGemini);
      expect(reportGemini.yogas.length).toBe(1);
      expect(reportGemini.yogas[0].type).toBe(YogaType.BHADRA);
      expect(reportGemini.yogas[0].evidence[0].dignity).toBe(YogaDignity.OWN_SIGN);

      const inputVirgo = createMahapurushaInput({ [Planet.MERCURY]: { sign: Sign.VIRGO, house: 10 } });
      const reportVirgo = analyzeYogas(inputVirgo);
      expect(reportVirgo.yogas.length).toBe(1);
      expect(reportVirgo.yogas[0].type).toBe(YogaType.BHADRA);
      expect(reportVirgo.yogas[0].evidence[0].dignity).toBe(YogaDignity.EXALTATION);
    });

    it('rejects Bhadra for Mercury in Gemini in House 5', () => {
      const input = createMahapurushaInput({ [Planet.MERCURY]: { sign: Sign.GEMINI, house: 5 } });
      expect(analyzeYogas(input).yogas).toEqual([]);
    });
  });

  describe('Item 18: Hamsa Yoga', () => {
    it('detects Hamsa for Jupiter in Sagittarius/Pisces/Cancer in a Kendra', () => {
      const inputSag = createMahapurushaInput({ [Planet.JUPITER]: { sign: Sign.SAGITTARIUS, house: 1 } });
      const reportSag = analyzeYogas(inputSag);
      expect(reportSag.yogas.length).toBe(1);
      expect(reportSag.yogas[0].type).toBe(YogaType.HAMSA);

      const inputPisces = createMahapurushaInput({ [Planet.JUPITER]: { sign: Sign.PISCES, house: 4 } });
      const reportPisces = analyzeYogas(inputPisces);
      expect(reportPisces.yogas.length).toBe(1);
      expect(reportPisces.yogas[0].type).toBe(YogaType.HAMSA);

      const inputCancer = createMahapurushaInput({ [Planet.JUPITER]: { sign: Sign.CANCER, house: 7 } });
      const reportCancer = analyzeYogas(inputCancer);
      expect(reportCancer.yogas.length).toBe(1);
      expect(reportCancer.yogas[0].type).toBe(YogaType.HAMSA);
    });

    it('rejects Hamsa for wrong-sign and wrong-house placements', () => {
      const wrongSign = createMahapurushaInput({ [Planet.JUPITER]: { sign: Sign.LEO, house: 1 } });
      expect(analyzeYogas(wrongSign).yogas).toEqual([]);

      const wrongHouse = createMahapurushaInput({ [Planet.JUPITER]: { sign: Sign.CANCER, house: 5 } });
      expect(analyzeYogas(wrongHouse).yogas).toEqual([]);
    });
  });

  describe('Item 19: Malavya Yoga', () => {
    it('detects Malavya for Venus in Taurus/Libra/Pisces in a Kendra', () => {
      const inputTaurus = createMahapurushaInput({ [Planet.VENUS]: { sign: Sign.TAURUS, house: 1 } });
      const reportTaurus = analyzeYogas(inputTaurus);
      expect(reportTaurus.yogas.length).toBe(1);
      expect(reportTaurus.yogas[0].type).toBe(YogaType.MALAVYA);

      const inputLibra = createMahapurushaInput({ [Planet.VENUS]: { sign: Sign.LIBRA, house: 4 } });
      const reportLibra = analyzeYogas(inputLibra);
      expect(reportLibra.yogas.length).toBe(1);
      expect(reportLibra.yogas[0].type).toBe(YogaType.MALAVYA);

      const inputPisces = createMahapurushaInput({ [Planet.VENUS]: { sign: Sign.PISCES, house: 7 } });
      const reportPisces = analyzeYogas(inputPisces);
      expect(reportPisces.yogas.length).toBe(1);
      expect(reportPisces.yogas[0].type).toBe(YogaType.MALAVYA);
    });

    it('rejects Malavya for wrong-sign and wrong-house placements', () => {
      const wrongSign = createMahapurushaInput({ [Planet.VENUS]: { sign: Sign.ARIES, house: 1 } });
      expect(analyzeYogas(wrongSign).yogas).toEqual([]);

      const wrongHouse = createMahapurushaInput({ [Planet.VENUS]: { sign: Sign.TAURUS, house: 2 } });
      expect(analyzeYogas(wrongHouse).yogas).toEqual([]);
    });
  });

  describe('Item 20: Shasha Yoga', () => {
    it('detects Shasha for Saturn in Capricorn/Aquarius/Libra in a Kendra', () => {
      const inputCap = createMahapurushaInput({ [Planet.SATURN]: { sign: Sign.CAPRICORN, house: 1 } });
      const reportCap = analyzeYogas(inputCap);
      expect(reportCap.yogas.length).toBe(1);
      expect(reportCap.yogas[0].type).toBe(YogaType.SHASHA);

      const inputAqua = createMahapurushaInput({ [Planet.SATURN]: { sign: Sign.AQUARIUS, house: 4 } });
      const reportAqua = analyzeYogas(inputAqua);
      expect(reportAqua.yogas.length).toBe(1);
      expect(reportAqua.yogas[0].type).toBe(YogaType.SHASHA);

      const inputLibra = createMahapurushaInput({ [Planet.SATURN]: { sign: Sign.LIBRA, house: 7 } });
      const reportLibra = analyzeYogas(inputLibra);
      expect(reportLibra.yogas.length).toBe(1);
      expect(reportLibra.yogas[0].type).toBe(YogaType.SHASHA);
    });

    it('rejects Shasha for wrong-sign and wrong-house placements', () => {
      const wrongSign = createMahapurushaInput({ [Planet.SATURN]: { sign: Sign.GEMINI, house: 1 } });
      expect(analyzeYogas(wrongSign).yogas).toEqual([]);

      const wrongHouse = createMahapurushaInput({ [Planet.SATURN]: { sign: Sign.LIBRA, house: 8 } });
      expect(analyzeYogas(wrongHouse).yogas).toEqual([]);
    });
  });

  describe('Item 21: Table-Driven All Four Kendra Houses', () => {
    it('asserts houses 1, 4, 7, 10 all produce the respective Mahapurusha Yoga for each rule', () => {
      const cases = [
        { planet: Planet.MARS, sign: Sign.ARIES, expected: YogaType.RUCHAKA },
        { planet: Planet.MERCURY, sign: Sign.GEMINI, expected: YogaType.BHADRA },
        { planet: Planet.JUPITER, sign: Sign.SAGITTARIUS, expected: YogaType.HAMSA },
        { planet: Planet.VENUS, sign: Sign.TAURUS, expected: YogaType.MALAVYA },
        { planet: Planet.SATURN, sign: Sign.CAPRICORN, expected: YogaType.SHASHA }
      ];

      for (const c of cases) {
        for (const house of [1, 4, 7, 10]) {
          const input = createMahapurushaInput({ [c.planet]: { sign: c.sign, house } });
          const report = analyzeYogas(input);
          expect(report.yogas.length).toBe(1);
          expect(report.yogas[0].type).toBe(c.expected);
        }
      }
    });
  });

  describe('Item 22: Wrong-House Matrix', () => {
    it('asserts houses 2, 3, 5, 6, 8, 9, 11, 12 produce NO Mahapurusha Yoga for all qualifying signs', () => {
      const nonKendraHouses = [2, 3, 5, 6, 8, 9, 11, 12];
      const qualifyingPlacements = [
        { planet: Planet.MARS, signs: [Sign.ARIES, Sign.SCORPIO, Sign.CAPRICORN] },
        { planet: Planet.MERCURY, signs: [Sign.GEMINI, Sign.VIRGO] },
        { planet: Planet.JUPITER, signs: [Sign.SAGITTARIUS, Sign.PISCES, Sign.CANCER] },
        { planet: Planet.VENUS, signs: [Sign.TAURUS, Sign.LIBRA, Sign.PISCES] },
        { planet: Planet.SATURN, signs: [Sign.CAPRICORN, Sign.AQUARIUS, Sign.LIBRA] }
      ];

      for (const item of qualifyingPlacements) {
        for (const sign of item.signs) {
          for (const house of nonKendraHouses) {
            const input = createMahapurushaInput({ [item.planet]: { sign, house } });
            const report = analyzeYogas(input);
            expect(report.yogas).toEqual([]);
          }
        }
      }
    });
  });

  describe('Item 23: Wrong-Sign Matrix', () => {
    it('asserts non-qualifying signs in Kendra houses produce NO Mahapurusha Yoga', () => {
      const kendraHouses = [1, 4, 7, 10];
      const nonQualifyingCases = [
        { planet: Planet.MARS, signs: [Sign.TAURUS, Sign.GEMINI, Sign.CANCER, Sign.LEO] },
        { planet: Planet.MERCURY, signs: [Sign.ARIES, Sign.TAURUS, Sign.CANCER, Sign.LEO] },
        { planet: Planet.JUPITER, signs: [Sign.ARIES, Sign.TAURUS, Sign.GEMINI, Sign.LEO] },
        { planet: Planet.VENUS, signs: [Sign.ARIES, Sign.GEMINI, Sign.CANCER, Sign.LEO] },
        { planet: Planet.SATURN, signs: [Sign.ARIES, Sign.TAURUS, Sign.GEMINI, Sign.CANCER] }
      ];

      for (const item of nonQualifyingCases) {
        for (const sign of item.signs) {
          for (const house of kendraHouses) {
            const input = createMahapurushaInput({ [item.planet]: { sign, house } });
            const report = analyzeYogas(input);
            expect(report.yogas).toEqual([]);
          }
        }
      }
    });
  });

  describe('Item 24: Planet-Specific Negatives', () => {
    it('asserts Sun + House 1 + Aries produces no Mahapurusha Yoga', () => {
      const input = createMahapurushaInput({ [Planet.SUN]: { sign: Sign.ARIES, house: 1 } });
      expect(analyzeYogas(input).yogas).toEqual([]);
    });

    it('asserts Moon + House 1 + Taurus produces no Mahapurusha Yoga', () => {
      const input = createMahapurushaInput({ [Planet.MOON]: { sign: Sign.TAURUS, house: 1 } });
      expect(analyzeYogas(input).yogas).toEqual([]);
    });
  });

  describe('Item 25: Multiple-Yoga Fixture', () => {
    it('detects both Ruchaka and Malavya when Mars(Aries,H1) and Venus(Taurus,H4) are present', () => {
      const input = createMahapurushaInput({
        [Planet.MARS]: { sign: Sign.ARIES, house: 1 },
        [Planet.VENUS]: { sign: Sign.TAURUS, house: 4 }
      });

      const report = analyzeYogas(input);
      expect(report.yogas.length).toBe(2);

      const types = report.yogas.map((y) => y.type).sort();
      expect(types).toEqual([YogaType.MALAVYA, YogaType.RUCHAKA]);
    });
  });

  describe('Item 26: Evidence Assertions for Mahapurusha Yoga', () => {
    it('asserts correct evidence fields for Mars in Capricorn in House 10', () => {
      const input = createMahapurushaInput({
        [Planet.MARS]: { sign: Sign.CAPRICORN, house: 10 }
      });

      const report = analyzeYogas(input);
      expect(report.yogas.length).toBe(1);

      const yoga = report.yogas[0];
      expect(yoga.type).toBe(YogaType.RUCHAKA);
      expect(yoga.evidence.length).toBe(1);

      const ev = yoga.evidence[0];
      expect(ev.ruleId).toBe('YOGA_RUCHAKA_001');
      expect(ev.planet).toBe(Planet.MARS);
      expect(ev.house).toBe(10);
      expect(ev.sign).toBe(Sign.CAPRICORN);
      expect(ev.dignity).toBe(YogaDignity.EXALTATION);
      expect(typeof ev.reason).toBe('string');
      expect(ev.reason.length).toBeGreaterThan(0);
    });

    it('table-driven rule ID checks for all five Mahapurusha Yogas', () => {
      const cases = [
        { planet: Planet.MARS, sign: Sign.ARIES, house: 1, type: YogaType.RUCHAKA, ruleId: 'YOGA_RUCHAKA_001' },
        { planet: Planet.MERCURY, sign: Sign.GEMINI, house: 1, type: YogaType.BHADRA, ruleId: 'YOGA_BHADRA_001' },
        { planet: Planet.JUPITER, sign: Sign.SAGITTARIUS, house: 1, type: YogaType.HAMSA, ruleId: 'YOGA_HAMSA_001' },
        { planet: Planet.VENUS, sign: Sign.TAURUS, house: 1, type: YogaType.MALAVYA, ruleId: 'YOGA_MALAVYA_001' },
        { planet: Planet.SATURN, sign: Sign.CAPRICORN, house: 1, type: YogaType.SHASHA, ruleId: 'YOGA_SHASHA_001' }
      ];

      for (const c of cases) {
        const input = createMahapurushaInput({ [c.planet]: { sign: c.sign, house: c.house } });
        const report = analyzeYogas(input);
        expect(report.yogas.length).toBe(1);
        expect(report.yogas[0].type).toBe(c.type);
        expect(report.yogas[0].evidence[0].ruleId).toBe(c.ruleId);
      }
    });
  });
});
