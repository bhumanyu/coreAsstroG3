import { describe, it, expect } from 'vitest';
import {
  Planet,
  Sign,
  HouseAnalysisEvidenceType,
  AspectType,
  DignityStatus,
  PlanetCondition,
  PlanetFacts,
  PlanetFact,
  Nakshatra,
  Pada
} from '../types';
import { House } from './houseLordship/houseGroups';
import { analyzeHouses, HouseAnalysisInput } from './houseAnalysis';
import { analyzePlanets } from './planetAnalysis';
import { analyzeHouseLordship } from './houseLordship/houseLordship';
import { analyzeNatalGrahaDrishti } from './natalGrahaDrishti';
import { SIGNS_METADATA, NAKSHATRAS_METADATA } from '../data/astroData';
import { getGrahaDrishtiOffsets } from './transitEngine';

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
        longitude: eclipticLongitude,
        sign,
        house,
        signLongitude: eclipticLongitude % 30,
        eclipticLatitude: 0,
        motion: { speed: 1, retrograde, stationary: false }
      },
      sign,
      signMetadata: SIGNS_METADATA[sign],
      nakshatraResult: { nakshatra: Nakshatra.ASHWINI, pada: Pada.FIRST, padaNumber: 1 },
      nakshatraMetadata: NAKSHATRAS_METADATA[0],
      state: { planet: p, motion: { speed: 1, retrograde, stationary: false }, condition },
      dignity: { planet: p, sign, status: dignityStatus },
      house
    };
  }
  return result as Record<Planet, PlanetFact>;
}

function createControlledInput(
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
): HouseAnalysisInput {
  const planetFacts = createMockPlanetFacts(overrides);
  const natalGrahaDrishti = analyzeNatalGrahaDrishti(planetFacts);
  const planetAnalysis = analyzePlanets({ planetFacts, natalGrahaDrishti });
  const houseLordship = analyzeHouseLordship(Sign.ARIES);

  return {
    planetFacts: planetFacts as any,
    planetAnalysis,
    houseLordship
  };
}

describe('House Analysis Engine (P-04)', () => {
  describe('House-level structure', () => {
    it('shouldAnalyzeAllTwelveHouses', () => {
      const input = createControlledInput();
      const report = analyzeHouses(input);
      expect(Object.keys(report.houses)).toHaveLength(12);
      for (let h = 1; h <= 12; h++) {
        expect(report.houses[h]).toBeDefined();
      }
    });

    it('shouldPreserveHouseNumbers', () => {
      const input = createControlledInput();
      const report = analyzeHouses(input);
      for (let h = 1; h <= 12; h++) {
        expect(report.houses[h].house).toBe(h);
      }
    });

    it('shouldPreserveHouseSigns', () => {
      const input = createControlledInput();
      const report = analyzeHouses(input);
      for (let h = 1; h <= 12; h++) {
        const expectedSign = input.houseLordship.evidence.find(e => e.house === h)?.sign;
        expect(expectedSign).toBeDefined();
        expect(report.houses[h].sign).toBe(expectedSign);
      }
    });

    it('shouldPreserveHouseLord', () => {
      const input = createControlledInput();
      const report = analyzeHouses(input);
      for (let h = 1; h <= 12; h++) {
        const expectedLord = input.houseLordship.houseLords[h as House];
        expect(report.houses[h].lord).toBe(expectedLord);
      }
    });

    it('shouldPreserveLordAnalysis', () => {
      const input = createControlledInput();
      const report = analyzeHouses(input);
      for (let h = 1; h <= 12; h++) {
        const lord = report.houses[h].lord;
        expect(report.houses[h].lordAnalysis).toEqual(input.planetAnalysis.planets[lord]);
      }
    });
  });

  describe('Occupants', () => {
    it('shouldIdentifyHouseOccupants', () => {
      const input = createControlledInput();
      const report = analyzeHouses(input);
      const allPlanets = Object.values(Planet);

      for (let h = 1; h <= 12; h++) {
        const expectedOccupants = allPlanets.filter(p => input.planetAnalysis.planets[p].house === h);
        expect(report.houses[h].occupants).toEqual(expectedOccupants);
      }
    });

    it('shouldHandleEmptyHouse', () => {
      const input = createControlledInput();
      const report = analyzeHouses(input);
      expect(report.houses[10].occupants).toEqual([]);
    });

    it('shouldPreserveOccupantOrder', () => {
      const input = createControlledInput();
      const report = analyzeHouses(input);
      const allPlanets = Object.values(Planet);

      for (let h = 1; h <= 12; h++) {
        const expectedOrder = allPlanets.filter(p => input.planetAnalysis.planets[p].house === h);
        expect(report.houses[h].occupants).toEqual(expectedOrder);
      }
    });
  });

  describe('House aspects', () => {
    it('shouldDetectHouseReceivedAspect', () => {
      const input = createControlledInput();
      const report = analyzeHouses(input);

      const houseWithAspects = Object.values(report.houses).find(h => h.receivedAspects.length > 0);
      expect(houseWithAspects).toBeDefined();

      const aspectEvidences = houseWithAspects!.evidence.filter(
        (e: any) => e.type === HouseAnalysisEvidenceType.HOUSE_RECEIVED_ASPECT
      );
      expect(aspectEvidences.length).toBe(houseWithAspects!.receivedAspects.length);
    });

    it('shouldDetectAspectOnEmptyHouse', () => {
      // Place Mars in house 1, ensure house 4 is empty of occupants
      const allPlanets = Object.values(Planet);
      const overrides: Partial<Record<Planet, { house: number }>> = {};

      for (const p of allPlanets) {
        if (p === Planet.MARS) {
          overrides[p] = { house: 1 };
        } else {
          overrides[p] = { house: 10 };
        }
      }

      const input = createControlledInput(overrides);
      const report = analyzeHouses(input);
      const house4 = report.houses[4];

      expect(house4.occupants).toEqual([]);
      expect(house4.receivedAspects.length).toBeGreaterThan(0);
      expect(house4.receivedAspects.some((a: any) => a.sourcePlanet === Planet.MARS && a.aspectType === AspectType.SPECIAL_4TH)).toBe(true);
    });

    it('shouldPreserveHouseAspectType', () => {
      const input = createControlledInput();
      const report = analyzeHouses(input);

      for (let h = 1; h <= 12; h++) {
        for (const aspect of report.houses[h].receivedAspects) {
          const rule = getGrahaDrishtiOffsets(aspect.sourcePlanet).find(r => r.offset === aspect.houseOffset);
          expect(rule).toBeDefined();
          expect(aspect.aspectType).toBe(rule!.type);
        }
      }
    });

    it('shouldPreserveHouseAspectDirection', () => {
      const input = createControlledInput();
      const report = analyzeHouses(input);

      for (let h = 1; h <= 12; h++) {
        for (const aspect of report.houses[h].receivedAspects) {
          expect(aspect.targetHouse).toBe(h);
          const expectedOffset = ((h - aspect.sourceHouse) + 12) % 12;
          expect(aspect.houseOffset).toBe(expectedOffset);
        }
      }
    });

    it('shouldPreserveMultipleAspectsOnHouse', () => {
      // Mars in H1 → H4/H7/H8
      // Saturn in H2 → H4/H8/H11
      const customInput = createControlledInput({
        [Planet.MARS]: { house: 1 },
        [Planet.SATURN]: { house: 2 }
      });

      const report = analyzeHouses(customInput);
      const house4Aspects = report.houses[4].receivedAspects;

      expect(house4Aspects.length).toBeGreaterThanOrEqual(2);
      expect(house4Aspects.some((a: any) => a.sourcePlanet === Planet.MARS)).toBe(true);
      expect(house4Aspects.some((a: any) => a.sourcePlanet === Planet.SATURN)).toBe(true);
    });
  });

  describe('Boundary', () => {
    it('shouldKeepHouseAspectSeparateFromPlanetAspect', () => {
      const input = createControlledInput();
      const report = analyzeHouses(input);

      const houseWithAspect = Object.values(report.houses).find(h => h.receivedAspects.length > 0);
      expect(houseWithAspect).toBeDefined();

      const aspect = houseWithAspect!.receivedAspects[0];
      expect(aspect.sourcePlanet).toBeDefined();
      expect(aspect.sourceHouse).toBeDefined();
      expect(aspect.targetHouse).toBeDefined();
      expect(aspect.aspectType).toBeDefined();
      expect(aspect.houseOffset).toBeDefined();
      expect((aspect as any).targetPlanet).toBeUndefined();
    });
  });

  describe('Evidence', () => {
    it('shouldPreserveHouseSignEvidence', () => {
      const input = createControlledInput();
      const report = analyzeHouses(input);

      for (let h = 1; h <= 12; h++) {
        const signEvidences = report.houses[h].evidence.filter(
          (e: any) => e.type === HouseAnalysisEvidenceType.HOUSE_SIGN_PLACEMENT
        );
        expect(signEvidences).toHaveLength(1);
        expect(signEvidences[0].ruleId).toBe('HOUSE_SIGN_PLACEMENT');
      }
    });

    it('shouldPreserveOccupantEvidence', () => {
      const input = createControlledInput();
      const report = analyzeHouses(input);

      for (let h = 1; h <= 12; h++) {
        const occupants = report.houses[h].occupants;
        const occupantEvidences = report.houses[h].evidence.filter(
          (e: any) => e.type === HouseAnalysisEvidenceType.HOUSE_OCCUPANT
        );
        expect(occupantEvidences).toHaveLength(occupants.length);
        for (let i = 0; i < occupants.length; i++) {
          expect(occupantEvidences[i].planet).toBe(occupants[i]);
          expect(occupantEvidences[i].ruleId).toBe('HOUSE_OCCUPANT');
        }
      }
    });

    it('shouldPreserveHouseLordEvidence', () => {
      const input = createControlledInput();
      const report = analyzeHouses(input);

      for (let h = 1; h <= 12; h++) {
        const lordEvidences = report.houses[h].evidence.filter(
          (e: any) => e.type === HouseAnalysisEvidenceType.HOUSE_LORD
        );
        expect(lordEvidences).toHaveLength(1);
        expect(lordEvidences[0].planet).toBe(report.houses[h].lord);
        expect(lordEvidences[0].ruleId).toBe('HOUSE_LORD');
      }
    });

    it('shouldPreserveLordPlacementEvidence', () => {
      const input = createControlledInput();
      const report = analyzeHouses(input);

      for (let h = 1; h <= 12; h++) {
        const lordPlacementEvidences = report.houses[h].evidence.filter(
          (e: any) => e.type === HouseAnalysisEvidenceType.HOUSE_LORD_PLACEMENT
        );
        expect(lordPlacementEvidences).toHaveLength(1);
        expect(lordPlacementEvidences[0].planet).toBe(report.houses[h].lord);
        expect(lordPlacementEvidences[0].reason).toContain(
          `House ${report.houses[h].lordAnalysis.house}`
        );
      }
    });

    it('shouldPreserveAspectEvidence', () => {
      const input = createControlledInput();
      const report = analyzeHouses(input);

      for (let h = 1; h <= 12; h++) {
        const receivedAspects = report.houses[h].receivedAspects;
        const aspectEvidences = report.houses[h].evidence.filter(
          (e: any) => e.type === HouseAnalysisEvidenceType.HOUSE_RECEIVED_ASPECT
        );
        expect(aspectEvidences).toHaveLength(receivedAspects.length);
        for (let i = 0; i < receivedAspects.length; i++) {
          expect(aspectEvidences[i].planet).toBe(receivedAspects[i].sourcePlanet);
          expect(aspectEvidences[i].reason).toBe(receivedAspects[i].reason);
        }
      }
    });
  });

  describe('Validation / error handling', () => {
    it('shouldRejectMissingPlanetFacts', () => {
      const input = createControlledInput();
      const badPlanetFacts = { ...input.planetFacts };
      delete (badPlanetFacts as any)[Planet.SUN];

      expect(() => analyzeHouses({ ...input, planetFacts: badPlanetFacts })).toThrow(
        'planetFacts is missing required planet: SUN.'
      );
    });

    it('shouldRejectMissingPlanetAnalysis', () => {
      const input = createControlledInput();
      const badPlanets = { ...input.planetAnalysis.planets };
      delete (badPlanets as any)[Planet.MARS];

      expect(() => analyzeHouses({ ...input, planetAnalysis: { planets: badPlanets } })).toThrow(
        'planetAnalysis is missing required planet: MARS.'
      );
    });

    it('shouldRejectMissingHouseLordship', () => {
      const input = createControlledInput();
      expect(() => analyzeHouses(null as any)).toThrow('input must not be null or undefined.');
      expect(() => analyzeHouses({ ...input, planetFacts: null as any })).toThrow('planetFacts must not be null or undefined.');
      expect(() => analyzeHouses({ ...input, planetAnalysis: null as any })).toThrow('planetAnalysis must not be null or undefined.');
      expect(() => analyzeHouses({ ...input, houseLordship: null as any })).toThrow('houseLordship must not be null or undefined.');

      const badHouseLords = { ...input.houseLordship.houseLords };
      delete (badHouseLords as any)[1];
      expect(() => analyzeHouses({
        ...input,
        houseLordship: { ...input.houseLordship, houseLords: badHouseLords }
      })).toThrow('houseLordship is missing lord for house 1.');
    });

    it('shouldRejectInvalidHouseLordship', () => {
      const input = createControlledInput();
      const badHouseLords = { ...input.houseLordship.houseLords, 10: 'INVALID_LORD' as Planet };
      expect(() => analyzeHouses({
        ...input,
        houseLordship: { ...input.houseLordship, houseLords: badHouseLords }
      })).toThrow('houseLordship contains invalid lord for house 10.');
    });
  });

  describe('Immutability / determinism', () => {
    it('shouldNotMutateInput', () => {
      const input = createControlledInput();
      const clonedInput = JSON.parse(JSON.stringify(input));
      analyzeHouses(input);
      expect(JSON.parse(JSON.stringify(input))).toEqual(clonedInput);
    });

    it('shouldRemainImmutable', () => {
      const input = createControlledInput();
      const report = analyzeHouses(input);

      expect(Object.isFrozen(report)).toBe(true);
      expect(Object.isFrozen(report.houses)).toBe(true);
      expect(Object.isFrozen(report.houses[1])).toBe(true);
      expect(Object.isFrozen(report.houses[1].occupants)).toBe(true);
      expect(Object.isFrozen(report.houses[1].receivedAspects)).toBe(true);
      expect(Object.isFrozen(report.houses[1].evidence)).toBe(true);
      expect(Object.isFrozen(report.houses[1].evidence[0])).toBe(true);

      const houseWithAspect = Object.values(report.houses).find(h => h.receivedAspects.length > 0);
      if (houseWithAspect) {
        expect(Object.isFrozen(houseWithAspect.receivedAspects[0])).toBe(true);
      }
    });

    it('shouldReturnDeterministicOrder', () => {
      const input = createControlledInput();
      const report1 = analyzeHouses(input);
      const report2 = analyzeHouses(input);
      expect(report1).toEqual(report2);
    });
  });
});
