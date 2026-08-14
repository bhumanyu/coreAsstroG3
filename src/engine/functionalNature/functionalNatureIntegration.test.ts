import { describe, it, expect } from 'vitest';
import {
  Planet,
  Sign,
  DignityStatus,
  PlanetCondition,
  PlanetFacts,
  PlanetFact,
  Nakshatra,
  Pada
} from '../../types';
import { analyzeHouseLordship } from '../houseLordship/houseLordship';
import { FunctionalNature } from './functionalNature';
import { FunctionalRole } from './functionalRoleTypes';
import { analyzeFunctionalRoles } from './functionalRoles';
import { analyzePlanets } from '../planetAnalysis';
import { analyzeHouses } from '../houseAnalysis';
import { analyzeNatalGrahaDrishti } from '../natalGrahaDrishti';
import { SIGNS_METADATA, NAKSHATRAS_METADATA } from '../../data/astroData';
import {
  analyzeFunctionalNatureIntegration,
  FunctionalNatureIntegrationInput,
  FunctionalNatureEvidenceType
} from './functionalNatureIntegration';

function createMockPlanetFacts(): Record<Planet, PlanetFact> {
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
    const house = defaultMap[p].house;
    const sign = defaultMap[p].sign;
    const eclipticLongitude = (house - 1) * 30 + 15.12345;

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

function createControlledInput(ascendantSign: Sign = Sign.ARIES): FunctionalNatureIntegrationInput {
  const planetFacts = createMockPlanetFacts();
  const natalGrahaDrishti = analyzeNatalGrahaDrishti(planetFacts);
  const planetAnalysis = analyzePlanets({ planetFacts, natalGrahaDrishti });
  const houseLordship = analyzeHouseLordship(ascendantSign);
  const houseAnalysis = analyzeHouses({ planetFacts: planetFacts as any, planetAnalysis, houseLordship });
  const functionalRoles = analyzeFunctionalRoles(ascendantSign, houseLordship);

  return {
    functionalRoles,
    planetAnalysis,
    houseAnalysis
  };
}

describe('Functional Nature Integration Engine (P-05)', () => {
  it('shouldAnalyzeAllNinePlanets', () => {
    const input = createControlledInput();
    const report = analyzeFunctionalNatureIntegration(input);
    expect(Object.keys(report.planets)).toHaveLength(9);
    for (const p of Object.values(Planet)) {
      expect(report.planets[p]).toBeDefined();
    }
  });

  it('shouldPreservePlanetOrder', () => {
    const input = createControlledInput();
    const report = analyzeFunctionalNatureIntegration(input);
    const expectedOrder = Object.values(Planet);
    const actualKeys = Object.keys(report.planets);
    expect(actualKeys).toEqual(expectedOrder);
  });

  it('shouldPreserveOwnedHouses', () => {
    const input = createControlledInput();
    const report = analyzeFunctionalNatureIntegration(input);
    for (const p of Object.values(Planet)) {
      const expectedOwned = input.functionalRoles.planets[p].ownedHouses;
      expect(report.planets[p].ownedHouses).toEqual(expectedOwned);
    }
  });

  it('shouldPreserveExistingRoles', () => {
    const input = createControlledInput();
    const report = analyzeFunctionalNatureIntegration(input);
    for (const p of Object.values(Planet)) {
      const expectedRoles = input.functionalRoles.planets[p].roles;
      expect(report.planets[p].roles).toEqual(expectedRoles);
    }
  });

  it('shouldPreserveFunctionalNature', () => {
    const input = createControlledInput(Sign.ARIES);
    const report = analyzeFunctionalNatureIntegration(input);

    for (const p of Object.values(Planet)) {
      const expectedFn = input.functionalRoles.planets[p].functionalNature;
      expect(report.planets[p].functionalNature).toBe(expectedFn);
    }

    // Aries Mars owns H1 (Trikona) and H8 (Dusthana) => MIXED
    expect(report.planets[Planet.MARS].functionalNature).toBe(FunctionalNature.MIXED);
  });

  it('shouldProduceExactlyOneAnalysisPerPlanet', () => {
    const input = createControlledInput();
    const report = analyzeFunctionalNatureIntegration(input);
    for (const p of Object.values(Planet)) {
      expect(report.planets[p].planet).toBe(p);
    }
  });

  it('shouldPreserveMultipleOwnedHouses', () => {
    const input = createControlledInput(Sign.ARIES);
    const report = analyzeFunctionalNatureIntegration(input);
    expect(report.planets[Planet.MARS].ownedHouses).toEqual([1, 8]);
    expect(report.planets[Planet.VENUS].ownedHouses).toEqual([2, 7]);
    expect(report.planets[Planet.MERCURY].ownedHouses).toEqual([3, 6]);
    expect(report.planets[Planet.JUPITER].ownedHouses).toEqual([9, 12]);
    expect(report.planets[Planet.SATURN].ownedHouses).toEqual([10, 11]);
  });

  it('shouldPreserveRolesForVariousAscendants', () => {
    // Taurus ascendant: Saturn owns H9 (Trikona) and H10 (Kendra) => YOGAKARAKA
    const taurusInput = createControlledInput(Sign.TAURUS);
    const taurusReport = analyzeFunctionalNatureIntegration(taurusInput);
    expect(taurusReport.planets[Planet.SATURN].roles).toContain(FunctionalRole.YOGAKARAKA);

    // Aries ascendant: Mars owns H1 => LAGNA_LORD, Venus owns H2 & H7 => MARAKA_LORD
    const ariesInput = createControlledInput(Sign.ARIES);
    const ariesReport = analyzeFunctionalNatureIntegration(ariesInput);
    expect(ariesReport.planets[Planet.MARS].roles).toContain(FunctionalRole.LAGNA_LORD);
    expect(ariesReport.planets[Planet.VENUS].roles).toContain(FunctionalRole.MARAKA_LORD);
  });

  it('shouldProduceDifferentResultsForDifferentAscendants', () => {
    const ariesReport = analyzeFunctionalNatureIntegration(createControlledInput(Sign.ARIES));
    const taurusReport = analyzeFunctionalNatureIntegration(createControlledInput(Sign.TAURUS));

    expect(ariesReport.planets[Planet.MARS].ownedHouses).not.toEqual(taurusReport.planets[Planet.MARS].ownedHouses);
    expect(ariesReport.planets[Planet.SATURN].roles).not.toEqual(taurusReport.planets[Planet.SATURN].roles);
  });

  it('shouldNotInventYogakaraka', () => {
    // Aries ascendant: Mars owns H1 (Lagna / Kendra / Trikona) and H8 (Dusthana)
    // Mars owns Kendra 1 and Trikona 1, but Lagna is excluded from Yogakaraka definition.
    const input = createControlledInput(Sign.ARIES);
    const report = analyzeFunctionalNatureIntegration(input);
    expect(input.functionalRoles.planets[Planet.MARS].isYogakaraka).toBe(false);
    expect(report.planets[Planet.MARS].roles).not.toContain(FunctionalRole.YOGAKARAKA);
  });

  it('shouldProvideEvidence', () => {
    const input = createControlledInput();
    const report = analyzeFunctionalNatureIntegration(input);

    for (const p of Object.values(Planet)) {
      const planetAnalysis = report.planets[p];
      expect(planetAnalysis.evidence.length).toBeGreaterThan(0);

      for (const ev of planetAnalysis.evidence) {
        expect(ev.planet).toBe(p);
        expect(ev.ruleId).toBeDefined();
        expect(ev.ownedHouses).toEqual(planetAnalysis.ownedHouses);
        expect(ev.roles).toEqual(planetAnalysis.roles);
        expect(typeof ev.reason).toBe('string');
        expect(Object.values(FunctionalNatureEvidenceType)).toContain(ev.type);
      }
    }
  });

  it('shouldNotMutateInput', () => {
    const input = createControlledInput();
    const clonedInput = JSON.parse(JSON.stringify(input));
    analyzeFunctionalNatureIntegration(input);
    expect(JSON.parse(JSON.stringify(input))).toEqual(clonedInput);
  });

  it('shouldRemainImmutable', () => {
    const input = createControlledInput();
    const report = analyzeFunctionalNatureIntegration(input);

    expect(Object.isFrozen(report)).toBe(true);
    expect(Object.isFrozen(report.planets)).toBe(true);
    expect(Object.isFrozen(report.planets[Planet.SUN])).toBe(true);
    expect(Object.isFrozen(report.planets[Planet.SUN].ownedHouses)).toBe(true);
    expect(Object.isFrozen(report.planets[Planet.SUN].roles)).toBe(true);
    expect(Object.isFrozen(report.planets[Planet.SUN].evidence)).toBe(true);
    expect(Object.isFrozen(report.planets[Planet.SUN].evidence[0])).toBe(true);
  });

  it('shouldReturnDeterministicOrder', () => {
    const input = createControlledInput();
    const report1 = analyzeFunctionalNatureIntegration(input);
    const report2 = analyzeFunctionalNatureIntegration(input);
    expect(report1).toEqual(report2);
  });

  describe('Invalid Input Handling', () => {
    it('shouldRejectNullOrUndefinedInput', () => {
      expect(() => analyzeFunctionalNatureIntegration(null as any)).toThrow('input must not be null or undefined.');
      expect(() => analyzeFunctionalNatureIntegration(undefined as any)).toThrow('input must not be null or undefined.');
    });

    it('shouldRejectMissingRequiredInputs', () => {
      const input = createControlledInput();
      expect(() => analyzeFunctionalNatureIntegration({ ...input, functionalRoles: null as any })).toThrow('functionalRoles must not be null or undefined.');
      expect(() => analyzeFunctionalNatureIntegration({ ...input, planetAnalysis: null as any })).toThrow('planetAnalysis must not be null or undefined.');
      expect(() => analyzeFunctionalNatureIntegration({ ...input, houseAnalysis: null as any })).toThrow('houseAnalysis must not be null or undefined.');
    });

    it('shouldRejectMissingPlanetRoles', () => {
      const input = createControlledInput();
      const badRolesMap = { ...input.functionalRoles.planets };
      delete (badRolesMap as any)[Planet.SUN];

      expect(() => analyzeFunctionalNatureIntegration({
        ...input,
        functionalRoles: { ...input.functionalRoles, planets: badRolesMap }
      })).toThrow('functionalRoles is missing required planet: SUN.');
    });

    it('shouldRejectInvalidOwnedHouse', () => {
      const input = createControlledInput();
      const badRolesMap = {
        ...input.functionalRoles.planets,
        [Planet.SUN]: {
          ...input.functionalRoles.planets[Planet.SUN],
          ownedHouses: [13 as any]
        }
      };

      expect(() => analyzeFunctionalNatureIntegration({
        ...input,
        functionalRoles: { ...input.functionalRoles, planets: badRolesMap }
      })).toThrow('invalid ownedHouse 13 for planet SUN.');
    });

    it('shouldRejectMissingFunctionalNature', () => {
      const input = createControlledInput();
      const badRolesMap = {
        ...input.functionalRoles.planets,
        [Planet.SUN]: {
          ...input.functionalRoles.planets[Planet.SUN],
          functionalNature: undefined as any
        }
      };

      expect(() => analyzeFunctionalNatureIntegration({
        ...input,
        functionalRoles: { ...input.functionalRoles, planets: badRolesMap }
      })).toThrow('Functional Nature is missing required planet: SUN.');
    });
  });
});

