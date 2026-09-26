import {
  buildCareerPlanetaryRelevance,
  buildCareerPlanetaryRelevanceContext,
  buildCareerPlanetaryRelevanceContexts,
  type CareerPlanetaryRelevanceIntegrationInput
} from './careerPlanetaryRelevanceIntegration';
import { Planet, type Horoscope } from '../../types';
import type { CareerStructuralEvidence, CareerStructuralReasoning } from './careerStructuralReasoning';
import type { CareerHouseRelationship } from './careerHouseRelationship';
import { calculateHoroscope } from '../../engine/astroEngine';
import { CANONICAL_BIRTH_DETAILS } from '../../test/fixtures/canonicalChart';
import { buildCareerStructuralReasoning } from './careerStructuralReasoningIntegration';
import {
  CAREER_PRIMARY_HOUSES,
  CAREER_SUPPORTING_HOUSES,
  CAREER_CHALLENGING_HOUSES
} from './careerTypes';

const CANONICAL_PLANET_ORDER: readonly Planet[] = Object.freeze([
  Planet.SUN,
  Planet.MOON,
  Planet.MARS,
  Planet.MERCURY,
  Planet.JUPITER,
  Planet.VENUS,
  Planet.SATURN,
  Planet.RAHU,
  Planet.KETU
] as const);

function createMinimalHoroscope(overrides: Partial<Horoscope> = {}): Horoscope {
  return {
    birthDetails: {
      latitude: 0,
      longitude: 0,
      timeZone: 'UTC',
      ayanamsa: 'LAHIRI' as any,
      dateTimeStr: '1990-01-01T12:00:00Z'
    },
    planetFacts: {
      [Planet.SUN]: { planet: Planet.SUN, position: { house: 1, longitude: 0, sign: 'ARIES' as any, signLongitude: 0, motion: { speed: 0, retrograde: false, stationary: false } } } as any,
      [Planet.MOON]: { planet: Planet.MOON, position: { house: 3, longitude: 0, sign: 'GEMINI' as any, signLongitude: 0, motion: { speed: 0, retrograde: false, stationary: false } } } as any,
      [Planet.MARS]: { planet: Planet.MARS, position: { house: 3, longitude: 0, sign: 'GEMINI' as any, signLongitude: 0, motion: { speed: 0, retrograde: false, stationary: false } } } as any,
      [Planet.MERCURY]: { planet: Planet.MERCURY, position: { house: 4, longitude: 0, sign: 'CANCER' as any, signLongitude: 0, motion: { speed: 0, retrograde: false, stationary: false } } } as any,
      [Planet.JUPITER]: { planet: Planet.JUPITER, position: { house: 5, longitude: 0, sign: 'LEO' as any, signLongitude: 0, motion: { speed: 0, retrograde: false, stationary: false } } } as any,
      [Planet.VENUS]: { planet: Planet.VENUS, position: { house: 7, longitude: 0, sign: 'LIBRA' as any, signLongitude: 0, motion: { speed: 0, retrograde: false, stationary: false } } } as any,
      [Planet.SATURN]: { planet: Planet.SATURN, position: { house: 9, longitude: 0, sign: 'SAGITTARIUS' as any, signLongitude: 0, motion: { speed: 0, retrograde: false, stationary: false } } } as any,
      [Planet.RAHU]: { planet: Planet.RAHU, position: { house: 1, longitude: 0, sign: 'ARIES' as any, signLongitude: 0, motion: { speed: 0, retrograde: false, stationary: false } } } as any,
      [Planet.KETU]: { planet: Planet.KETU, position: { house: 7, longitude: 0, sign: 'LIBRA' as any, signLongitude: 0, motion: { speed: 0, retrograde: false, stationary: false } } } as any
    },
    bhavaFacts: {},
    houseAnalysis: undefined,
    natalGrahaDrishti: undefined,
    grahaDrishti: undefined,
    yogas: undefined,
    fullNatalAnalysis: {} as any,
    ...overrides
  };
}

function createMinimalStructural(overrides: Partial<CareerStructuralReasoning> = {}): CareerStructuralReasoning {
  return {
    direction: 'SUPPORT',
    strength: 'MODERATE',
    primarySupport: 0,
    primaryChallenge: 0,
    supportingSupport: 0,
    supportingChallenge: 0,
    challengingSupport: 0,
    challengingChallenge: 0,
    mixedWeight: 0,
    evidence: [],
    primaryEvidenceIds: [],
    supportingEvidenceIds: [],
    challengingEvidenceIds: [],
    conflicts: [],
    statement: 'Test structural reasoning',
    ...overrides
  };
}

function createRelationshipEvidence(
  houseA: number,
  houseB: number,
  lordA: Planet,
  lordB: Planet
): CareerStructuralEvidence {
  const relationship: CareerHouseRelationship = {
    type: 'LORD_CONJUNCTION',
    houseA,
    houseB,
    lordA,
    lordB,
    lordAHouse: 5,
    lordBHouse: 5,
    reason: `Lords of house ${houseA} (${lordA}) and house ${houseB} (${lordB}) are conjunct`
  };

  return {
    id: `test-${houseA}-${houseB}`,
    relationship,
    semantic: {
      relationship,
      relationshipType: relationship.type,
      relevance: 'PRIMARY',
      effect: 'SUPPORT',
      strength: 'MODERATE',
      conditional: false,
      statement: 'Test semantic'
    },
    role: 'PRIMARY',
    direction: 'SUPPORT',
    weight: 2,
    statement: 'Test evidence'
  };
}

describe('Career Planetary Relevance Integration', () => {
  describe('10L Lordship → PRIMARY', () => {
    it('planet ruling 10H gets PRIMARY relevance with CAREER_LORD role', () => {
      const horoscope = createMinimalHoroscope({
        houseAnalysis: {
          houses: [
            { house: 10, lord: Planet.SATURN, sign: 'CAPRICORN' as any, occupants: [], evidence: [] }
          ]
        } as any
      });

      const structural = createMinimalStructural();
      const input: CareerPlanetaryRelevanceIntegrationInput = { horoscope, structural };

      const result = buildCareerPlanetaryRelevance(input);
      const saturnResult = result.find(r => r.planet === Planet.SATURN);

      expect(saturnResult).toBeDefined();
      expect(saturnResult!.relevance).toBe('PRIMARY');
      expect(saturnResult!.roles).toContain('CAREER_LORD');
      expect(saturnResult!.reasons).toContain('PRIMARY_LORDSHIP');
    });
  });

  describe('Career House Occupancy → SUPPORTING', () => {
    it('planet occupying career house gets SUPPORTING relevance with HOUSE_OCCUPANT role', () => {
      const horoscope = createMinimalHoroscope({
        planetFacts: {
          ...createMinimalHoroscope().planetFacts,
          [Planet.JUPITER]: { planet: Planet.JUPITER, position: { house: 10, longitude: 0, sign: 'CAPRICORN' as any, signLongitude: 0, motion: { speed: 0, retrograde: false, stationary: false } } } as any
        }
      });

      const structural = createMinimalStructural();
      const input: CareerPlanetaryRelevanceIntegrationInput = { horoscope, structural };

      const result = buildCareerPlanetaryRelevance(input);
      const jupiterResult = result.find(r => r.planet === Planet.JUPITER);

      expect(jupiterResult).toBeDefined();
      expect(jupiterResult!.relevance).toBe('SUPPORTING');
      expect(jupiterResult!.roles).toContain('HOUSE_OCCUPANT');
      expect(jupiterResult!.reasons).toContain('CAREER_HOUSE_OCCUPANCY');
    });
  });

  describe('Career House Aspect → HOUSE_ASPECTOR/SUPPORTING', () => {
    it('planet aspecting career house gets SUPPORTING relevance with HOUSE_ASPECTOR role', () => {
      const horoscope = createMinimalHoroscope({
        natalGrahaDrishti: {
          aspects: [
            { sourcePlanet: Planet.JUPITER, targetHouse: 10, aspectType: 'FULL' }
          ]
        }
      });

      const structural = createMinimalStructural();
      const input: CareerPlanetaryRelevanceIntegrationInput = { horoscope, structural };

      const result = buildCareerPlanetaryRelevance(input);
      const jupiterResult = result.find(r => r.planet === Planet.JUPITER);

      expect(jupiterResult).toBeDefined();
      expect(jupiterResult!.relevance).toBe('SUPPORTING');
      expect(jupiterResult!.roles).toContain('HOUSE_ASPECTOR');
      expect(jupiterResult!.reasons).toContain('CAREER_HOUSE_ASPECT');
    });
  });

  describe('Non-Career Aspect Ignored', () => {
    it('planet aspecting only non-career houses does not get HOUSE_ASPECTOR role', () => {
      const horoscope = createMinimalHoroscope({
        natalGrahaDrishti: {
          aspects: [
            { sourcePlanet: Planet.JUPITER, targetHouse: 3, aspectType: 'FULL' },
            { sourcePlanet: Planet.JUPITER, targetHouse: 5, aspectType: 'FULL' }
          ]
        }
      });

      const structural = createMinimalStructural();
      const input: CareerPlanetaryRelevanceIntegrationInput = { horoscope, structural };

      const result = buildCareerPlanetaryRelevance(input);
      const jupiterResult = result.find(r => r.planet === Planet.JUPITER);

      expect(jupiterResult).toBeDefined();
      expect(jupiterResult!.roles).not.toContain('HOUSE_ASPECTOR');
      expect(jupiterResult!.reasons).not.toContain('CAREER_HOUSE_ASPECT');
    });
  });

  describe('Single Source of Truth: natalGrahaDrishti', () => {
    it('ignores grahaDrishti when both natalGrahaDrishti and grahaDrishti are present with conflicting values', () => {
      const horoscope = createMinimalHoroscope({
        natalGrahaDrishti: {
          aspects: [
            { sourcePlanet: Planet.JUPITER, targetHouse: 10, aspectType: 'FULL' }
          ]
        },
        grahaDrishti: {
          aspects: [
            { sourcePlanet: Planet.SATURN, targetHouse: 10, aspectType: 'FULL' }
          ]
        }
      });

      const structural = createMinimalStructural();
      const input: CareerPlanetaryRelevanceIntegrationInput = { horoscope, structural };

      const result = buildCareerPlanetaryRelevance(input);
      const jupiterResult = result.find(r => r.planet === Planet.JUPITER);
      const saturnResult = result.find(r => r.planet === Planet.SATURN);

      expect(jupiterResult).toBeDefined();
      expect(jupiterResult!.roles).toContain('HOUSE_ASPECTOR');
      expect(jupiterResult!.reasons).toContain('CAREER_HOUSE_ASPECT');

      expect(saturnResult).toBeDefined();
      expect(saturnResult!.roles).not.toContain('HOUSE_ASPECTOR');
      expect(saturnResult!.reasons).not.toContain('CAREER_HOUSE_ASPECT');
    });

    it('ignores grahaDrishti when natalGrahaDrishti is absent/null', () => {
      const horoscope = createMinimalHoroscope({
        natalGrahaDrishti: undefined,
        grahaDrishti: {
          aspects: [
            { sourcePlanet: Planet.SATURN, targetHouse: 10, aspectType: 'FULL' }
          ]
        }
      });

      const structural = createMinimalStructural();
      const input: CareerPlanetaryRelevanceIntegrationInput = { horoscope, structural };

      const result = buildCareerPlanetaryRelevance(input);
      const saturnResult = result.find(r => r.planet === Planet.SATURN);

      expect(saturnResult).toBeDefined();
      expect(saturnResult!.roles).not.toContain('HOUSE_ASPECTOR');
      expect(saturnResult!.reasons).not.toContain('CAREER_HOUSE_ASPECT');
    });
  });

  describe('C4 Same-Planet Relationship → No Self-Participant', () => {
    it('same-planet relationship (COMMON_LORD) yields no self-participant', () => {
      const horoscope = createMinimalHoroscope({
        houseAnalysis: {
          houses: [
            { house: 10, lord: Planet.SATURN, sign: 'CAPRICORN' as any, occupants: [], evidence: [] },
            { house: 6, lord: Planet.SATURN, sign: 'VIRGO' as any, occupants: [], evidence: [] }
          ]
        } as any
      });

      const evidence = createRelationshipEvidence(10, 6, Planet.SATURN, Planet.SATURN);
      const structural = createMinimalStructural({
        evidence: [evidence]
      });

      const input: CareerPlanetaryRelevanceIntegrationInput = { horoscope, structural };

      const result = buildCareerPlanetaryRelevance(input);
      const saturnResult = result.find(r => r.planet === Planet.SATURN);

      expect(saturnResult).toBeDefined();
      expect(saturnResult!.roles).not.toContain('RELATIONSHIP_PARTICIPANT');
      expect(saturnResult!.reasons).not.toContain('CAREER_RELATIONSHIP');
      expect(saturnResult!.relatedPlanets).toEqual([]);
    });
  });

  describe('C4 Two-Lord Relationship → Other Lord', () => {
    it('two-lord relationship yields the other lord as related planet', () => {
      const horoscope = createMinimalHoroscope({
        houseAnalysis: {
          houses: [
            { house: 10, lord: Planet.SATURN, sign: 'CAPRICORN' as any, occupants: [], evidence: [] },
            { house: 6, lord: Planet.MERCURY, sign: 'VIRGO' as any, occupants: [], evidence: [] }
          ]
        } as any
      });

      const evidence = createRelationshipEvidence(10, 6, Planet.SATURN, Planet.MERCURY);
      const structural = createMinimalStructural({
        evidence: [evidence]
      });

      const input: CareerPlanetaryRelevanceIntegrationInput = { horoscope, structural };

      const result = buildCareerPlanetaryRelevance(input);
      const saturnResult = result.find(r => r.planet === Planet.SATURN);
      const mercuryResult = result.find(r => r.planet === Planet.MERCURY);

      expect(saturnResult).toBeDefined();
      expect(saturnResult!.roles).toContain('RELATIONSHIP_PARTICIPANT');
      expect(saturnResult!.reasons).toContain('CAREER_RELATIONSHIP');
      expect(saturnResult!.relatedPlanets).toContain(Planet.MERCURY);

      expect(mercuryResult).toBeDefined();
      expect(mercuryResult!.roles).toContain('RELATIONSHIP_PARTICIPANT');
      expect(mercuryResult!.reasons).toContain('CAREER_RELATIONSHIP');
      expect(mercuryResult!.relatedPlanets).toContain(Planet.SATURN);
    });

    it('relatedPlanets order is independent of structural.evidence ordering', () => {
      const horoscope = createMinimalHoroscope({
        houseAnalysis: {
          houses: [
            { house: 10, lord: Planet.SATURN, sign: 'CAPRICORN' as any, occupants: [], evidence: [] },
            { house: 6, lord: Planet.MERCURY, sign: 'VIRGO' as any, occupants: [], evidence: [] },
            { house: 11, lord: Planet.VENUS, sign: 'AQUARIUS' as any, occupants: [], evidence: [] }
          ]
        } as any
      });

      const evidence1 = createRelationshipEvidence(10, 6, Planet.SATURN, Planet.MERCURY);
      const evidence2 = createRelationshipEvidence(10, 11, Planet.SATURN, Planet.VENUS);

      const structural1 = createMinimalStructural({
        evidence: [evidence1, evidence2]
      });

      const structural2 = createMinimalStructural({
        evidence: [evidence2, evidence1]
      });

      const input1: CareerPlanetaryRelevanceIntegrationInput = { horoscope, structural: structural1 };
      const input2: CareerPlanetaryRelevanceIntegrationInput = { horoscope, structural: structural2 };

      const result1 = buildCareerPlanetaryRelevance(input1);
      const result2 = buildCareerPlanetaryRelevance(input2);

      const saturnResult1 = result1.find(r => r.planet === Planet.SATURN);
      const saturnResult2 = result2.find(r => r.planet === Planet.SATURN);

      expect(saturnResult1).toBeDefined();
      expect(saturnResult2).toBeDefined();
      expect(saturnResult1!.relatedPlanets).toEqual(saturnResult2!.relatedPlanets);
    });
  });

  describe('Deterministic 9-Planet Batch + Frozen Collection', () => {
    it('produces results in canonical 9-planet order', () => {
      const horoscope = createMinimalHoroscope();
      const structural = createMinimalStructural();
      const input: CareerPlanetaryRelevanceIntegrationInput = { horoscope, structural };

      const result = buildCareerPlanetaryRelevance(input);

      expect(result).toHaveLength(9);
      expect(result[0].planet).toBe(Planet.SUN);
      expect(result[1].planet).toBe(Planet.MOON);
      expect(result[2].planet).toBe(Planet.MARS);
      expect(result[3].planet).toBe(Planet.MERCURY);
      expect(result[4].planet).toBe(Planet.JUPITER);
      expect(result[5].planet).toBe(Planet.VENUS);
      expect(result[6].planet).toBe(Planet.SATURN);
      expect(result[7].planet).toBe(Planet.RAHU);
      expect(result[8].planet).toBe(Planet.KETU);
    });

    it('produces frozen result array', () => {
      const horoscope = createMinimalHoroscope();
      const structural = createMinimalStructural();
      const input: CareerPlanetaryRelevanceIntegrationInput = { horoscope, structural };

      const result = buildCareerPlanetaryRelevance(input);

      expect(Object.isFrozen(result)).toBe(true);
    });

    it('produces frozen individual result objects', () => {
      const horoscope = createMinimalHoroscope();
      const structural = createMinimalStructural();
      const input: CareerPlanetaryRelevanceIntegrationInput = { horoscope, structural };

      const result = buildCareerPlanetaryRelevance(input);

      for (const item of result) {
        expect(Object.isFrozen(item)).toBe(true);
      }
    });
  });

  describe('Same-Input Determinism', () => {
    it('identical inputs produce identical outputs', () => {
      const horoscope = createMinimalHoroscope({
        houseAnalysis: {
          houses: [
            { house: 10, lord: Planet.SATURN, sign: 'CAPRICORN' as any, occupants: [], evidence: [] }
          ]
        } as any,
        planetFacts: {
          ...createMinimalHoroscope().planetFacts,
          [Planet.JUPITER]: { planet: Planet.JUPITER, position: { house: 10, longitude: 0, sign: 'CAPRICORN' as any, signLongitude: 0, motion: { speed: 0, retrograde: false, stationary: false } } } as any
        },
        natalGrahaDrishti: {
          aspects: [
            { sourcePlanet: Planet.MERCURY, targetHouse: 6, aspectType: 'FULL' }
          ]
        }
      });

      const evidence = createRelationshipEvidence(10, 6, Planet.SATURN, Planet.MERCURY);
      const structural = createMinimalStructural({
        evidence: [evidence]
      });

      const input: CareerPlanetaryRelevanceIntegrationInput = { horoscope, structural };

      const result1 = buildCareerPlanetaryRelevance(input);
      const result2 = buildCareerPlanetaryRelevance(input);

      expect(result1).toEqual(result2);
    });
  });

  describe('Missing Data → Correct Relevance (with Karaka Correction)', () => {
    it('empty input yields SECONDARY for Saturn (natural karaka) and NEUTRAL for others', () => {
      const horoscope = createMinimalHoroscope();
      const structural = createMinimalStructural();
      const input: CareerPlanetaryRelevanceIntegrationInput = { horoscope, structural };

      const result = buildCareerPlanetaryRelevance(input);

      const saturnResult = result.find(r => r.planet === Planet.SATURN);
      expect(saturnResult).toBeDefined();
      expect(saturnResult!.relevance).toBe('SECONDARY');
      expect(saturnResult!.roles).toContain('NATURAL_KARAKA');

      const nonKarakaPlanets = [
        Planet.SUN, Planet.MOON, Planet.MARS, Planet.MERCURY,
        Planet.JUPITER, Planet.VENUS, Planet.RAHU, Planet.KETU
      ];

      for (const planet of nonKarakaPlanets) {
        const planetResult = result.find(r => r.planet === planet);
        expect(planetResult).toBeDefined();
        expect(planetResult!.relevance).toBe('NEUTRAL');
      }
    });
  });

  describe('Context Building', () => {
    it('buildCareerPlanetaryRelevanceContext sets naturalCareerKaraka and explicitCareerRelevant to false', () => {
      const horoscope = createMinimalHoroscope();
      const structural = createMinimalStructural();

      const context = buildCareerPlanetaryRelevanceContext(horoscope, structural, Planet.SATURN);

      expect(context.naturalCareerKaraka).toBe(false);
      expect(context.explicitCareerRelevant).toBe(false);
    });

    it('buildCareerPlanetaryRelevanceContexts produces frozen array', () => {
      const horoscope = createMinimalHoroscope();
      const structural = createMinimalStructural();

      const contexts = buildCareerPlanetaryRelevanceContexts({ horoscope, structural });

      expect(Object.isFrozen(contexts)).toBe(true);
    });

    it('buildCareerPlanetaryRelevanceContexts produces frozen individual contexts', () => {
      const horoscope = createMinimalHoroscope();
      const structural = createMinimalStructural();

      const contexts = buildCareerPlanetaryRelevanceContexts({ horoscope, structural });

      for (const context of contexts) {
        expect(Object.isFrozen(context)).toBe(true);
      }
    });
  });

  describe('Fallback Data Reading', () => {
    it('reads house lord from houseAnalysis.houses array', () => {
      const horoscope = createMinimalHoroscope({
        houseAnalysis: {
          houses: [
            { house: 10, lord: Planet.SATURN, sign: 'CAPRICORN' as any, occupants: [], evidence: [] }
          ]
        } as any
      });

      const structural = createMinimalStructural();
      const input: CareerPlanetaryRelevanceIntegrationInput = { horoscope, structural };

      const result = buildCareerPlanetaryRelevance(input);
      const saturnResult = result.find(r => r.planet === Planet.SATURN);

      expect(saturnResult!.relevance).toBe('PRIMARY');
    });

    it('reads house lord from houseAnalysis.houses record', () => {
      const horoscope = createMinimalHoroscope({
        houseAnalysis: {
          houses: {
            10: { lord: Planet.SATURN }
          }
        } as any
      });

      const structural = createMinimalStructural();
      const input: CareerPlanetaryRelevanceIntegrationInput = { horoscope, structural };

      const result = buildCareerPlanetaryRelevance(input);
      const saturnResult = result.find(r => r.planet === Planet.SATURN);

      expect(saturnResult!.relevance).toBe('PRIMARY');
    });

    it('falls back to bhavaFacts for house lord', () => {
      const horoscope = createMinimalHoroscope({
        bhavaFacts: {
          10: { lord: Planet.SATURN } as any
        }
      });

      const structural = createMinimalStructural();
      const input: CareerPlanetaryRelevanceIntegrationInput = { horoscope, structural };

      const result = buildCareerPlanetaryRelevance(input);
      const saturnResult = result.find(r => r.planet === Planet.SATURN);

      expect(saturnResult!.relevance).toBe('PRIMARY');
    });



    it('reads planet house from planetFacts.house', () => {
      const horoscope = createMinimalHoroscope({
        planetFacts: {
          ...createMinimalHoroscope().planetFacts,
          [Planet.JUPITER]: { planet: Planet.JUPITER, house: 10 } as any
        }
      });

      const structural = createMinimalStructural();
      const input: CareerPlanetaryRelevanceIntegrationInput = { horoscope, structural };

      const result = buildCareerPlanetaryRelevance(input);
      const jupiterResult = result.find(r => r.planet === Planet.JUPITER);

      expect(jupiterResult!.roles).toContain('HOUSE_OCCUPANT');
    });

    it('reads planet house from planetFacts.position.house', () => {
      const horoscope = createMinimalHoroscope({
        planetFacts: {
          ...createMinimalHoroscope().planetFacts,
          [Planet.JUPITER]: { planet: Planet.JUPITER, position: { house: 10, longitude: 0, sign: 'CAPRICORN' as any, signLongitude: 0, motion: { speed: 0, retrograde: false, stationary: false } } } as any
        }
      });

      const structural = createMinimalStructural();
      const input: CareerPlanetaryRelevanceIntegrationInput = { horoscope, structural };

      const result = buildCareerPlanetaryRelevance(input);
      const jupiterResult = result.find(r => r.planet === Planet.JUPITER);

      expect(jupiterResult!.roles).toContain('HOUSE_OCCUPANT');
    });
  });

  describe('Real Engine-Produced Horoscope Integration', () => {
    it('reads real engine-produced Horoscope and produces non-empty relevance for 10th-lord and career-house occupant', () => {
      const horoscope = calculateHoroscope(CANONICAL_BIRTH_DETAILS);
      const structural = buildCareerStructuralReasoning({ horoscope });
      const input: CareerPlanetaryRelevanceIntegrationInput = { horoscope, structural };

      const result = buildCareerPlanetaryRelevance(input);

      // Verify we get results for all 9 planets
      expect(result).toHaveLength(9);

      // Find the 10th house lord from the real horoscope using houseAnalysis
      const tenthHouseLord = horoscope.houseAnalysis?.houses
        ? (Array.isArray(horoscope.houseAnalysis.houses)
          ? horoscope.houseAnalysis.houses.find((h: any) => h.house === 10)?.lord
          : horoscope.houseAnalysis.houses[10]?.lord)
        : horoscope.bhavaFacts?.[10]?.lord ?? horoscope.bhavas?.[10]?.lord;

      // Verify the 10th-lord gets CAREER_LORD role
      expect(tenthHouseLord).toBeDefined();
      const tenthLordResult = result.find(r => r.planet === tenthHouseLord);
      expect(tenthLordResult).toBeDefined();
      expect(tenthLordResult!.roles).toContain('CAREER_LORD');
      expect(tenthLordResult!.relevance).not.toBe('NEUTRAL');

      // Find at least one planet occupying a career house using houseAnalysis
      const careerHouses = [...CAREER_PRIMARY_HOUSES, ...CAREER_SUPPORTING_HOUSES, ...CAREER_CHALLENGING_HOUSES];
      let careerHouseOccupant: Planet | undefined;
      for (const house of careerHouses) {
        const houseData = horoscope.houseAnalysis?.houses
          ? (Array.isArray(horoscope.houseAnalysis.houses)
            ? horoscope.houseAnalysis.houses.find((h: any) => h.house === house)
            : horoscope.houseAnalysis.houses[house])
          : undefined;
        const occupants = houseData?.occupants ?? [];
        if (occupants.length > 0) {
          careerHouseOccupant = occupants[0];
          break;
        }
      }

      // Verify career-house occupant gets HOUSE_OCCUPANT role
      expect(careerHouseOccupant).toBeDefined();
      const occupantResult = result.find(r => r.planet === careerHouseOccupant);
      expect(occupantResult).toBeDefined();
      expect(occupantResult!.roles).toContain('HOUSE_OCCUPANT');
      expect(occupantResult!.relevance).not.toBe('NEUTRAL');

      // Verify all canonical planets exist and have house information
      for (const planet of CANONICAL_PLANET_ORDER) {
        expect(horoscope.planetFacts[planet]).toBeDefined();
        const planetFact = horoscope.planetFacts[planet];
        const house = planetFact?.house ?? planetFact?.position?.house;
        expect(house).toBeDefined();
      }

      // At minimum, verify that some planets have non-NEUTRAL relevance
      const nonNeutralResults = result.filter(r => r.relevance !== 'NEUTRAL');
      expect(nonNeutralResults.length).toBeGreaterThan(0);
    });

    it('uses natalGrahaDrishti as the canonical C5 aspect source', () => {
      const horoscope = calculateHoroscope(CANONICAL_BIRTH_DETAILS);
      const structural = buildCareerStructuralReasoning({ horoscope });
      const input: CareerPlanetaryRelevanceIntegrationInput = { horoscope, structural };

      const result = buildCareerPlanetaryRelevance(input);

      // Compute the set of planets that actually aspect a canonical career house
      const careerHouses = new Set([...CAREER_PRIMARY_HOUSES, ...CAREER_SUPPORTING_HOUSES, ...CAREER_CHALLENGING_HOUSES]);
      const aspects = horoscope.natalGrahaDrishti?.aspects ?? [];
      const expectedAspectors = new Set<Planet>();

      for (const aspect of aspects) {
        if (aspect.targetHouse !== undefined && careerHouses.has(aspect.targetHouse)) {
          expectedAspectors.add(aspect.sourcePlanet);
        }
      }

      // Get the actual HOUSE_ASPECTOR planets from C5 output
      const actualAspectors = new Set(
        result
          .filter(r => r.roles.includes('HOUSE_ASPECTOR'))
          .map(r => r.planet)
      );

      // Assert exact match between derived expectations and C5 output
      expect(actualAspectors).toEqual(expectedAspectors);
    });
  });

  describe('Yoga Participation → CONDITIONAL Path', () => {
    it('planet participating in career-relevant yoga gets yoga participation with CONDITIONAL path', () => {
      const horoscope = createMinimalHoroscope({
        yogas: {
          yogas: [
            {
              type: 'RAJA_YOGA' as any,
              category: 'RAJA' as any,
              planets: [Planet.JUPITER, Planet.VENUS],
              houses: [10, 9],
              evidence: [] as any,
              strength: 'STRONG' as any
            }
          ]
        }
      });

      const structural = createMinimalStructural();
      const input: CareerPlanetaryRelevanceIntegrationInput = { horoscope, structural };

      const result = buildCareerPlanetaryRelevance(input);
      const jupiterResult = result.find(r => r.planet === Planet.JUPITER);
      const venusResult = result.find(r => r.planet === Planet.VENUS);

      expect(jupiterResult).toBeDefined();
      expect(jupiterResult!.roles).toContain('YOGA_PARTICIPANT');
      expect(jupiterResult!.reasons).toContain('CAREER_YOGA');
      expect(jupiterResult!.relevance).toBe('CONDITIONAL');

      expect(venusResult).toBeDefined();
      expect(venusResult!.roles).toContain('YOGA_PARTICIPANT');
      expect(venusResult!.reasons).toContain('CAREER_YOGA');
      expect(venusResult!.relevance).toBe('CONDITIONAL');
    });

    it('planet not participating in any yoga has careerYogaParticipation false', () => {
      const horoscope = createMinimalHoroscope({
        yogas: {
          yogas: [
            {
              type: 'RAJA_YOGA' as any,
              category: 'RAJA' as any,
              planets: [Planet.JUPITER, Planet.VENUS],
              houses: [10, 9],
              evidence: [] as any,
              strength: 'STRONG' as any
            }
          ]
        }
      });

      const structural = createMinimalStructural();
      const input: CareerPlanetaryRelevanceIntegrationInput = { horoscope, structural };

      const result = buildCareerPlanetaryRelevance(input);
      const marsResult = result.find(r => r.planet === Planet.MARS);

      expect(marsResult).toBeDefined();
      expect(marsResult!.roles).not.toContain('YOGA_PARTICIPANT');
      expect(marsResult!.reasons).not.toContain('CAREER_YOGA');
    });
  });

  describe('CHALLENGING_LORD (8H/12H) Cases', () => {
    it('planet ruling 8th house gets CHALLENGING_LORD role', () => {
      const horoscope = createMinimalHoroscope({
        houseAnalysis: {
          houses: [
            { house: 8, lord: Planet.SATURN, sign: 'SCORPIO' as any, occupants: [], evidence: [] }
          ]
        }
      });

      const structural = createMinimalStructural();
      const input: CareerPlanetaryRelevanceIntegrationInput = { horoscope, structural };

      const result = buildCareerPlanetaryRelevance(input);
      const saturnResult = result.find(r => r.planet === Planet.SATURN);

      expect(saturnResult).toBeDefined();
      expect(saturnResult!.roles).toContain('CHALLENGING_LORD');
      expect(saturnResult!.reasons).toContain('CHALLENGING_LORDSHIP');
    });

    it('planet ruling 12th house gets CHALLENGING_LORD role', () => {
      const horoscope = createMinimalHoroscope({
        houseAnalysis: {
          houses: [
            { house: 12, lord: Planet.SATURN, sign: 'PISCES' as any, occupants: [], evidence: [] }
          ]
        }
      });

      const structural = createMinimalStructural();
      const input: CareerPlanetaryRelevanceIntegrationInput = { horoscope, structural };

      const result = buildCareerPlanetaryRelevance(input);
      const saturnResult = result.find(r => r.planet === Planet.SATURN);

      expect(saturnResult).toBeDefined();
      expect(saturnResult!.roles).toContain('CHALLENGING_LORD');
      expect(saturnResult!.reasons).toContain('CHALLENGING_LORDSHIP');
    });

    it('planet ruling both primary and challenging houses gets both roles', () => {
      const horoscope = createMinimalHoroscope({
        houseAnalysis: {
          houses: [
            { house: 10, lord: Planet.SATURN, sign: 'CAPRICORN' as any, occupants: [], evidence: [] },
            { house: 8, lord: Planet.SATURN, sign: 'SCORPIO' as any, occupants: [], evidence: [] }
          ]
        }
      });

      const structural = createMinimalStructural();
      const input: CareerPlanetaryRelevanceIntegrationInput = { horoscope, structural };

      const result = buildCareerPlanetaryRelevance(input);
      const saturnResult = result.find(r => r.planet === Planet.SATURN);

      expect(saturnResult).toBeDefined();
      expect(saturnResult!.roles).toContain('CAREER_LORD');
      expect(saturnResult!.roles).toContain('CHALLENGING_LORD');
      expect(saturnResult!.reasons).toContain('PRIMARY_LORDSHIP');
      expect(saturnResult!.reasons).toContain('CHALLENGING_LORDSHIP');
    });
  });
});
