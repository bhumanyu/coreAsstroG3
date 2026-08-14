import { describe, it, expect } from 'vitest';
import { Sign, Planet } from '../../types';
import { analyzeHouseLordship } from '../houseLordship/houseLordship';
import {
  FunctionalRole,
  FUNCTIONAL_ROLE_ORDER
} from './functionalRoleTypes';
import {
  getBadhakaHouse,
  determineFunctionalNatureFromRoles,
  analyzeFunctionalRoles
} from './functionalRoles';
import { FunctionalNature } from './functionalNature';

describe('functionalRoles', () => {
  describe('determineFunctionalNatureFromRoles', () => {
    it('shouldClassifyYogakarakaAsBenefic', () => {
      const nature = determineFunctionalNatureFromRoles([FunctionalRole.YOGAKARAKA], [9, 10]);
      expect(nature).toBe(FunctionalNature.BENEFIC);
    });

    it('shouldClassifyTrikonaAndDusthanaAsMixed', () => {
      // Mars for Aries owns H1 (Trikona) and H8 (Dusthana)
      const nature = determineFunctionalNatureFromRoles(
        [FunctionalRole.LAGNA_LORD, FunctionalRole.KENDRA_LORD, FunctionalRole.TRIKONA_LORD, FunctionalRole.DUSTHANA_LORD],
        [1, 8]
      );
      expect(nature).toBe(FunctionalNature.MIXED);
    });

    it('shouldClassifyTrikonaWithoutDusthanaAsBenefic', () => {
      const nature = determineFunctionalNatureFromRoles([FunctionalRole.TRIKONA_LORD], [5]);
      expect(nature).toBe(FunctionalNature.BENEFIC);
    });

    it('shouldClassifyDusthanaWithoutTrikonaAsMalefic', () => {
      const nature = determineFunctionalNatureFromRoles([FunctionalRole.DUSTHANA_LORD, FunctionalRole.THIRD_LORD], [3, 6]);
      expect(nature).toBe(FunctionalNature.MALEFIC);
    });

    it('shouldClassifyNeitherAsNeutral', () => {
      const nature = determineFunctionalNatureFromRoles([FunctionalRole.SECOND_LORD, FunctionalRole.MARAKA_LORD], [2, 7]);
      expect(nature).toBe(FunctionalNature.NEUTRAL);
    });
  });

  describe('getBadhakaHouse', () => {
    it('shouldReturnCorrectBadhakaHouseForMovableSigns', () => {
      // Movable signs: Aries, Cancer, Libra, Capricorn -> 11th house
      expect(getBadhakaHouse(Sign.ARIES)).toBe(11);
      expect(getBadhakaHouse(Sign.CANCER)).toBe(11);
      expect(getBadhakaHouse(Sign.LIBRA)).toBe(11);
      expect(getBadhakaHouse(Sign.CAPRICORN)).toBe(11);
    });

    it('shouldReturnCorrectBadhakaHouseForFixedSigns', () => {
      // Fixed signs: Taurus, Leo, Scorpio, Aquarius -> 9th house
      expect(getBadhakaHouse(Sign.TAURUS)).toBe(9);
      expect(getBadhakaHouse(Sign.LEO)).toBe(9);
      expect(getBadhakaHouse(Sign.SCORPIO)).toBe(9);
      expect(getBadhakaHouse(Sign.AQUARIUS)).toBe(9);
    });

    it('shouldReturnCorrectBadhakaHouseForDualSigns', () => {
      // Dual signs: Gemini, Virgo, Sagittarius, Pisces -> 7th house
      expect(getBadhakaHouse(Sign.GEMINI)).toBe(7);
      expect(getBadhakaHouse(Sign.VIRGO)).toBe(7);
      expect(getBadhakaHouse(Sign.SAGITTARIUS)).toBe(7);
      expect(getBadhakaHouse(Sign.PISCES)).toBe(7);
    });

    it('shouldThrowErrorForInvalidSign', () => {
      expect(() => getBadhakaHouse('INVALID' as Sign)).toThrow(TypeError);
    });
  });

  describe('analyzeFunctionalRoles', () => {
    it('shouldNotTreatLagnaLordAloneAsYogakaraka', () => {
      // Aries Mars owns [1, 8] -> not Yogakaraka
      const lordship = analyzeHouseLordship(Sign.ARIES);
      const report = analyzeFunctionalRoles(Sign.ARIES, lordship);

      const marsAnalysis = report.planets[Planet.MARS];
      expect(marsAnalysis.ownedHouses).toEqual([1, 8]);
      expect(marsAnalysis.isYogakaraka).toBe(false);
      expect(marsAnalysis.roles).not.toContain(FunctionalRole.YOGAKARAKA);

      // Verify roles for Mars
      expect(marsAnalysis.roles).toContain(FunctionalRole.LAGNA_LORD);
      expect(marsAnalysis.roles).toContain(FunctionalRole.KENDRA_LORD);
      expect(marsAnalysis.roles).toContain(FunctionalRole.TRIKONA_LORD);
      expect(marsAnalysis.roles).toContain(FunctionalRole.DUSTHANA_LORD);
    });

    it('shouldIdentifyYogakaraka', () => {
      // Taurus Saturn owns [9, 10] -> Yogakaraka
      const lordship = analyzeHouseLordship(Sign.TAURUS);
      const report = analyzeFunctionalRoles(Sign.TAURUS, lordship);

      const saturnAnalysis = report.planets[Planet.SATURN];
      expect(saturnAnalysis.ownedHouses).toEqual([9, 10]);
      expect(saturnAnalysis.isYogakaraka).toBe(true);
      expect(saturnAnalysis.roles).toContain(FunctionalRole.YOGAKARAKA);

      const yogakarakaEv = saturnAnalysis.evidence.find(
        e => e.ruleId === 'FUNCTIONAL_ROLE_YOGAKARAKA_001'
      );
      expect(yogakarakaEv).toBeDefined();
      expect(yogakarakaEv?.role).toBe(FunctionalRole.YOGAKARAKA);
    });

    it('shouldHandleAllThreeBadhakaModalities', () => {
      // MOVABLE: Aries -> 11th house, lord Saturn
      const ariesLordship = analyzeHouseLordship(Sign.ARIES);
      const ariesReport = analyzeFunctionalRoles(Sign.ARIES, ariesLordship);
      expect(ariesReport.badhakaHouse).toBe(11);
      expect(ariesReport.badhakaLord).toBe(Planet.SATURN);
      expect(ariesReport.planets[Planet.SATURN].badhakaHouse).toBe(11);
      expect(ariesReport.planets[Planet.SATURN].roles).toContain(FunctionalRole.BADHAKA_LORD);

      // FIXED: Taurus -> 9th house, lord Saturn
      const taurusLordship = analyzeHouseLordship(Sign.TAURUS);
      const taurusReport = analyzeFunctionalRoles(Sign.TAURUS, taurusLordship);
      expect(taurusReport.badhakaHouse).toBe(9);
      expect(taurusReport.badhakaLord).toBe(Planet.SATURN);
      expect(taurusReport.planets[Planet.SATURN].badhakaHouse).toBe(9);
      expect(taurusReport.planets[Planet.SATURN].roles).toContain(FunctionalRole.BADHAKA_LORD);

      // DUAL: Gemini -> 7th house, lord Jupiter
      const geminiLordship = analyzeHouseLordship(Sign.GEMINI);
      const geminiReport = analyzeFunctionalRoles(Sign.GEMINI, geminiLordship);
      expect(geminiReport.badhakaHouse).toBe(7);
      expect(geminiReport.badhakaLord).toBe(Planet.JUPITER);
      expect(geminiReport.planets[Planet.JUPITER].badhakaHouse).toBe(7);
      expect(geminiReport.planets[Planet.JUPITER].roles).toContain(FunctionalRole.BADHAKA_LORD);
    });

    it('shouldPreserveMultipleRolesForPlanets', () => {
      // For Aries, Venus owns [2, 7]
      const lordship = analyzeHouseLordship(Sign.ARIES);
      const report = analyzeFunctionalRoles(Sign.ARIES, lordship);

      const venusAnalysis = report.planets[Planet.VENUS];
      expect(venusAnalysis.ownedHouses).toEqual([2, 7]);

      expect(venusAnalysis.roles).toContain(FunctionalRole.KENDRA_LORD);
      expect(venusAnalysis.roles).toContain(FunctionalRole.MARAKA_LORD);
      expect(venusAnalysis.roles).toContain(FunctionalRole.SECOND_LORD);

      expect(venusAnalysis.kendraHouses).toEqual([7]);
      expect(venusAnalysis.marakaHouses).toEqual([2, 7]);
    });

    it('shouldMaintainDeterministicRoleOrder', () => {
      const lordship = analyzeHouseLordship(Sign.ARIES);
      const report = analyzeFunctionalRoles(Sign.ARIES, lordship);

      for (const planet of Object.values(Planet)) {
        const analysis = report.planets[planet];
        const roles = analysis.roles;

        for (let i = 0; i < roles.length - 1; i++) {
          const idxA = FUNCTIONAL_ROLE_ORDER.indexOf(roles[i]);
          const idxB = FUNCTIONAL_ROLE_ORDER.indexOf(roles[i + 1]);
          expect(idxA).toBeLessThan(idxB);
        }
      }
    });

    it('shouldBeImmutable', () => {
      const lordship = analyzeHouseLordship(Sign.TAURUS);
      const report = analyzeFunctionalRoles(Sign.TAURUS, lordship);

      expect(Object.isFrozen(report)).toBe(true);
      expect(Object.isFrozen(report.planets)).toBe(true);

      const saturnAnalysis = report.planets[Planet.SATURN];
      expect(Object.isFrozen(saturnAnalysis)).toBe(true);
      expect(Object.isFrozen(saturnAnalysis.ownedHouses)).toBe(true);
      expect(Object.isFrozen(saturnAnalysis.roles)).toBe(true);
      expect(Object.isFrozen(saturnAnalysis.kendraHouses)).toBe(true);
      expect(Object.isFrozen(saturnAnalysis.trikonaHouses)).toBe(true);
      expect(Object.isFrozen(saturnAnalysis.dusthanaHouses)).toBe(true);
      expect(Object.isFrozen(saturnAnalysis.marakaHouses)).toBe(true);
      expect(Object.isFrozen(saturnAnalysis.evidence)).toBe(true);

      for (const ev of saturnAnalysis.evidence) {
        expect(Object.isFrozen(ev)).toBe(true);
      }
    });

    it('shouldNotMutateInputData', () => {
      const lordship = analyzeHouseLordship(Sign.ARIES);
      const copy = structuredClone(lordship);

      analyzeFunctionalRoles(Sign.ARIES, lordship);

      expect(lordship).toEqual(copy);
    });

    it('shouldValidateInputsAndThrowOnInvalidInput', () => {
      const lordship = analyzeHouseLordship(Sign.ARIES);

      expect(() => analyzeFunctionalRoles('INVALID' as Sign, lordship)).toThrow();
      expect(() => analyzeFunctionalRoles(Sign.ARIES, null as any)).toThrow();
      expect(() => analyzeFunctionalRoles(Sign.ARIES, {} as any)).toThrow();
      expect(() => analyzeFunctionalRoles(Sign.ARIES, { houseLords: {} } as any)).toThrow();

      // Missing house lord
      const badHouseLords = { ...lordship.houseLords };
      delete (badHouseLords as any)[5];
      expect(() => analyzeFunctionalRoles(Sign.ARIES, { ...lordship, houseLords: badHouseLords })).toThrow(
        'houseLordship is missing house lord for house 5.'
      );

      // Invalid ownedHouse value
      const badPlanetLordships = {
        ...lordship.planetLordships,
        [Planet.SUN]: {
          ...lordship.planetLordships[Planet.SUN],
          ownedHouses: [13 as any]
        }
      };
      expect(() => analyzeFunctionalRoles(Sign.ARIES, { ...lordship, planetLordships: badPlanetLordships })).toThrow(
        'invalid ownedHouse 13 for planet SUN.'
      );
    });

    it('shouldIncludeFunctionalNatureEvidenceForEveryPlanet', () => {
      const lordship = analyzeHouseLordship(Sign.ARIES);
      const report = analyzeFunctionalRoles(Sign.ARIES, lordship);

      for (const planet of Object.values(Planet)) {
        const analysis = report.planets[planet];
        const fnEv = analysis.evidence.find(e => e.ruleId === 'FUNCTIONAL_NATURE_001');
        expect(fnEv).toBeDefined();
        expect(fnEv?.reason).toContain(analysis.functionalNature);
      }
    });
  });
});
