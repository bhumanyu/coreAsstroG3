import { describe, it, expect } from 'vitest';
import { Sign, Planet } from '../../types';
import { SIGNS_METADATA, SIGNS_ORDER } from '../../data/astroData';
import { resolveHouseLords, analyzeHouseLordship } from './houseLordship';
import { House, PlanetRole } from './houseGroups';

describe('House Lordship Engine (PR-042)', () => {
  describe('Mandatory 144-relationship test', () => {
    it('verifies resolveHouseLords for all 12 Ascendants x 12 houses (144 total)', () => {
      const allSigns = SIGNS_ORDER;
      expect(allSigns.length).toBe(12);

      for (const ascSign of allSigns) {
        const houseLords = resolveHouseLords(ascSign);
        const ascNumber = SIGNS_METADATA[ascSign].number ?? 1;

        for (let house = 1; house <= 12; house++) {
          const expectedSign = SIGNS_ORDER[(ascNumber - 1 + house - 1) % 12];
          const expectedRuler = SIGNS_METADATA[expectedSign].ruler;
          expect(houseLords[house as House]).toBe(expectedRuler);
        }
      }
    });

    it('verifies explicit Aries table: 1 Mars, 2 Venus, 3 Mercury, 4 Moon, 5 Sun, 6 Mercury, 7 Venus, 8 Mars, 9 Jupiter, 10 Saturn, 11 Saturn, 12 Jupiter', () => {
      const houseLords = resolveHouseLords(Sign.ARIES);
      const expectedAriesTable: Record<House, Planet> = {
        [House.FIRST]: Planet.MARS,
        [House.SECOND]: Planet.VENUS,
        [House.THIRD]: Planet.MERCURY,
        [House.FOURTH]: Planet.MOON,
        [House.FIFTH]: Planet.SUN,
        [House.SIXTH]: Planet.MERCURY,
        [House.SEVENTH]: Planet.VENUS,
        [House.EIGHTH]: Planet.MARS,
        [House.NINTH]: Planet.JUPITER,
        [House.TENTH]: Planet.SATURN,
        [House.ELEVENTH]: Planet.SATURN,
        [House.TWELFTH]: Planet.JUPITER
      };
      for (let h = 1; h <= 12; h++) {
        expect(houseLords[h as House]).toBe(expectedAriesTable[h as House]);
      }
    });
  });

  describe('Complete Aries vector', () => {
    it('asserts exact ownedHouses and roles for all planets in Aries ascendant', () => {
      const report = analyzeHouseLordship(Sign.ARIES);
      
      const expectedAriesVector: Record<Planet, { ownedHouses: number[]; roles: PlanetRole[] }> = {
        [Planet.SUN]: {
          ownedHouses: [5],
          roles: [PlanetRole.TRIKONA_LORD]
        },
        [Planet.MOON]: {
          ownedHouses: [4],
          roles: [PlanetRole.KENDRA_LORD]
        },
        [Planet.MARS]: {
          ownedHouses: [1, 8],
          roles: [PlanetRole.LAGNA_LORD, PlanetRole.KENDRA_LORD, PlanetRole.TRIKONA_LORD, PlanetRole.DUSTHANA_LORD]
        },
        [Planet.MERCURY]: {
          ownedHouses: [3, 6],
          roles: [PlanetRole.DUSTHANA_LORD]
        },
        [Planet.JUPITER]: {
          ownedHouses: [9, 12],
          roles: [PlanetRole.TRIKONA_LORD, PlanetRole.DUSTHANA_LORD]
        },
        [Planet.VENUS]: {
          ownedHouses: [2, 7],
          roles: [PlanetRole.KENDRA_LORD, PlanetRole.MARAKA]
        },
        [Planet.SATURN]: {
          ownedHouses: [10, 11],
          roles: [PlanetRole.KENDRA_LORD]
        },
        [Planet.RAHU]: {
          ownedHouses: [],
          roles: [PlanetRole.NONE]
        },
        [Planet.KETU]: {
          ownedHouses: [],
          roles: [PlanetRole.NONE]
        }
      };

      const allPlanets = Object.values(Planet);
      for (const planet of allPlanets) {
        const lordship = report.planetLordships[planet];
        const expected = expectedAriesVector[planet];

        expect([...lordship.ownedHouses].sort((a, b) => a - b)).toEqual(expected.ownedHouses);
        expect([...lordship.roles].sort()).toEqual([...expected.roles].sort());
        expect(lordship.isYogakaraka).toBe(false);
      }
    });
  });

  describe('Golden Role Cases', () => {
    it('Aries Mars: owns [1, 8], roles LAGNA_LORD, KENDRA_LORD, TRIKONA_LORD, DUSTHANA_LORD, NOT Yogakaraka', () => {
      const report = analyzeHouseLordship(Sign.ARIES);
      const marsLordship = report.planetLordships[Planet.MARS];

      expect([...marsLordship.ownedHouses].sort((a, b) => a - b)).toEqual([1, 8]);
      expect(marsLordship.isYogakaraka).toBe(false);

      const expectedRoles = [
        PlanetRole.LAGNA_LORD,
        PlanetRole.KENDRA_LORD,
        PlanetRole.TRIKONA_LORD,
        PlanetRole.DUSTHANA_LORD
      ];
      expect([...marsLordship.roles].sort()).toEqual([...expectedRoles].sort());
    });

    it('Cancer Mars: owns [5, 10], isYogakaraka = true', () => {
      const report = analyzeHouseLordship(Sign.CANCER);
      const marsLordship = report.planetLordships[Planet.MARS];

      expect([...marsLordship.ownedHouses].sort((a, b) => a - b)).toEqual([5, 10]);
      expect(marsLordship.isYogakaraka).toBe(true);
      expect(marsLordship.roles).toContain(PlanetRole.YOGAKARAKA);
    });

    it('Libra Saturn: owns [4, 5], isYogakaraka = true', () => {
      const report = analyzeHouseLordship(Sign.LIBRA);
      const saturnLordship = report.planetLordships[Planet.SATURN];

      expect([...saturnLordship.ownedHouses].sort((a, b) => a - b)).toEqual([4, 5]);
      expect(saturnLordship.isYogakaraka).toBe(true);
      expect(saturnLordship.roles).toContain(PlanetRole.YOGAKARAKA);
    });

    it('Capricorn Venus: owns [5, 10], isYogakaraka = true', () => {
      const report = analyzeHouseLordship(Sign.CAPRICORN);
      const venusLordship = report.planetLordships[Planet.VENUS];

      expect([...venusLordship.ownedHouses].sort((a, b) => a - b)).toEqual([5, 10]);
      expect(venusLordship.isYogakaraka).toBe(true);
      expect(venusLordship.roles).toContain(PlanetRole.YOGAKARAKA);
    });

    it('Aquarius Venus: owns [4, 9], isYogakaraka = true', () => {
      const report = analyzeHouseLordship(Sign.AQUARIUS);
      const venusLordship = report.planetLordships[Planet.VENUS];

      expect([...venusLordship.ownedHouses].sort((a, b) => a - b)).toEqual([4, 9]);
      expect(venusLordship.isYogakaraka).toBe(true);
      expect(venusLordship.roles).toContain(PlanetRole.YOGAKARAKA);
    });
  });

  describe('Rahu / Ketu', () => {
    it('Rahu and Ketu have ownedHouses [], roles [NONE], and isYogakaraka false for any ascendant', () => {
      for (const ascSign of SIGNS_ORDER) {
        const report = analyzeHouseLordship(ascSign);

        const rahu = report.planetLordships[Planet.RAHU];
        expect(rahu.ownedHouses).toEqual([]);
        expect([...rahu.roles]).toEqual([PlanetRole.NONE]);
        expect(rahu.isYogakaraka).toBe(false);

        const ketu = report.planetLordships[Planet.KETU];
        expect(ketu.ownedHouses).toEqual([]);
        expect([...ketu.roles]).toEqual([PlanetRole.NONE]);
        expect(ketu.isYogakaraka).toBe(false);
      }
    });
  });

  describe('Immutability and Error Handling', () => {
    it('returns frozen report, planetLordships, houseLords, evidence array, and evidence items', () => {
      const report = analyzeHouseLordship(Sign.ARIES);
      expect(Object.isFrozen(report)).toBe(true);
      expect(Object.isFrozen(report.houseLords)).toBe(true);
      expect(Object.isFrozen(report.planetLordships)).toBe(true);
      expect(Object.isFrozen(report.evidence)).toBe(true);
      expect(Object.isFrozen(report.evidence[0])).toBe(true);
      expect(Object.isFrozen(report.planetLordships[Planet.MARS].ownedHouses)).toBe(true);
      expect(Object.isFrozen(report.planetLordships[Planet.MARS].roles)).toBe(true);
    });

    it('throws TypeError for null or invalid ascendant sign', () => {
      expect(() => analyzeHouseLordship(null as any)).toThrow(TypeError);
      expect(() => analyzeHouseLordship(undefined as any)).toThrow(TypeError);
      expect(() => analyzeHouseLordship('INVALID' as any)).toThrow(TypeError);
      expect(() => resolveHouseLords(null as any)).toThrow(TypeError);
    });
  });
});
