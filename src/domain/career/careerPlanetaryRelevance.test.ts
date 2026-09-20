import {
  interpretCareerPlanetaryRelevance,
  interpretCareerPlanetaryRelevanceBatch,
  type CareerPlanetaryRelevanceContext
} from './careerPlanetaryRelevance';
import { Planet } from '../../types';

function createContext(
  overrides: Partial<CareerPlanetaryRelevanceContext>
): CareerPlanetaryRelevanceContext {
  return Object.freeze({
    planet: Planet.SATURN,
    ruledHouses: [],
    aspectsCareerHouse: [],
    careerRelationshipPlanets: [],
    careerYogaParticipation: false,
    naturalCareerKaraka: false,
    explicitCareerRelevant: false,
    ...overrides
  });
}

describe('Career Planetary Relevance', () => {
  describe('Group A: Primary Lordship', () => {
    it('10L gets PRIMARY relevance with CAREER_LORD role', () => {
      const result = interpretCareerPlanetaryRelevance(
        createContext({
          planet: Planet.SATURN,
          ruledHouses: [10]
        })
      );

      expect(result.relevance).toBe('PRIMARY');
      expect(result.roles).toContain('CAREER_LORD');
      expect(result.reasons).toContain('PRIMARY_LORDSHIP');
      expect(result.conditional).toBe(false);
    });

    it('10L + karaka remains PRIMARY (karaka does not outrank lordship)', () => {
      const result = interpretCareerPlanetaryRelevance(
        createContext({
          planet: Planet.SATURN,
          ruledHouses: [10],
          naturalCareerKaraka: true
        })
      );

      expect(result.relevance).toBe('PRIMARY');
      expect(result.roles).toContain('CAREER_LORD');
      expect(result.roles).toContain('NATURAL_KARAKA');
    });
  });

  describe('Group B: Supporting Lordship', () => {
    it('6L gets SUPPORTING relevance with SUPPORTING_LORD role', () => {
      const result = interpretCareerPlanetaryRelevance(
        createContext({
          planet: Planet.MERCURY,
          ruledHouses: [6]
        })
      );

      expect(result.relevance).toBe('SUPPORTING');
      expect(result.roles).toContain('SUPPORTING_LORD');
      expect(result.reasons).toContain('SUPPORTING_LORDSHIP');
    });

    it('2L gets SUPPORTING relevance with SUPPORTING_LORD role', () => {
      const result = interpretCareerPlanetaryRelevance(
        createContext({
          planet: Planet.JUPITER,
          ruledHouses: [2]
        })
      );

      expect(result.relevance).toBe('SUPPORTING');
      expect(result.roles).toContain('SUPPORTING_LORD');
    });

    it('11L gets SUPPORTING relevance with SUPPORTING_LORD role', () => {
      const result = interpretCareerPlanetaryRelevance(
        createContext({
          planet: Planet.JUPITER,
          ruledHouses: [11]
        })
      );

      expect(result.relevance).toBe('SUPPORTING');
      expect(result.roles).toContain('SUPPORTING_LORD');
    });
  });

  describe('Group C: Challenging Lordship', () => {
    it('8L gets SUPPORTING relevance with CHALLENGING_LORD role', () => {
      const result = interpretCareerPlanetaryRelevance(
        createContext({
          planet: Planet.MARS,
          ruledHouses: [8]
        })
      );

      expect(result.relevance).toBe('SUPPORTING');
      expect(result.roles).toContain('CHALLENGING_LORD');
      expect(result.reasons).toContain('CHALLENGING_LORDSHIP');
    });

    it('12L gets SUPPORTING relevance with CHALLENGING_LORD role', () => {
      const result = interpretCareerPlanetaryRelevance(
        createContext({
          planet: Planet.SATURN,
          ruledHouses: [12]
        })
      );

      expect(result.relevance).toBe('SUPPORTING');
      expect(result.roles).toContain('CHALLENGING_LORD');
    });
  });

  describe('Group D: Multi-Lordship', () => {
    it('planet ruling both 10 and 11 gets both CAREER_LORD and SUPPORTING_LORD roles', () => {
      const result = interpretCareerPlanetaryRelevance(
        createContext({
          planet: Planet.SATURN,
          ruledHouses: [10, 11]
        })
      );

      expect(result.relevance).toBe('PRIMARY');
      expect(result.roles).toContain('CAREER_LORD');
      expect(result.roles).toContain('SUPPORTING_LORD');
      expect(result.reasons).toContain('PRIMARY_LORDSHIP');
      expect(result.reasons).toContain('SUPPORTING_LORDSHIP');
    });

    it('planet ruling 6 and 8 gets both SUPPORTING_LORD and CHALLENGING_LORD roles', () => {
      const result = interpretCareerPlanetaryRelevance(
        createContext({
          planet: Planet.MERCURY,
          ruledHouses: [6, 8]
        })
      );

      expect(result.relevance).toBe('SUPPORTING');
      expect(result.roles).toContain('SUPPORTING_LORD');
      expect(result.roles).toContain('CHALLENGING_LORD');
    });
  });

  describe('Group E: House Occupancy', () => {
    it('planet in 10H gets HOUSE_OCCUPANT role and SUPPORTING relevance', () => {
      const result = interpretCareerPlanetaryRelevance(
        createContext({
          planet: Planet.JUPITER,
          ruledHouses: [],
          occupiedHouse: 10
        })
      );

      expect(result.relevance).toBe('SUPPORTING');
      expect(result.roles).toContain('HOUSE_OCCUPANT');
      expect(result.reasons).toContain('CAREER_HOUSE_OCCUPANCY');
      expect(result.relatedHouses).toContain(10);
    });

    it('planet in 6H gets HOUSE_OCCUPANT role and SUPPORTING relevance', () => {
      const result = interpretCareerPlanetaryRelevance(
        createContext({
          planet: Planet.MERCURY,
          ruledHouses: [],
          occupiedHouse: 6
        })
      );

      expect(result.relevance).toBe('SUPPORTING');
      expect(result.roles).toContain('HOUSE_OCCUPANT');
      expect(result.reasons).toContain('CAREER_HOUSE_OCCUPANCY');
    });

    it('planet in 2H gets HOUSE_OCCUPANT role and SUPPORTING relevance', () => {
      const result = interpretCareerPlanetaryRelevance(
        createContext({
          planet: Planet.JUPITER,
          ruledHouses: [],
          occupiedHouse: 2
        })
      );

      expect(result.relevance).toBe('SUPPORTING');
      expect(result.roles).toContain('HOUSE_OCCUPANT');
      expect(result.reasons).toContain('CAREER_HOUSE_OCCUPANCY');
    });

    it('planet in 11H gets HOUSE_OCCUPANT role and SUPPORTING relevance', () => {
      const result = interpretCareerPlanetaryRelevance(
        createContext({
          planet: Planet.JUPITER,
          ruledHouses: [],
          occupiedHouse: 11
        })
      );

      expect(result.relevance).toBe('SUPPORTING');
      expect(result.roles).toContain('HOUSE_OCCUPANT');
      expect(result.reasons).toContain('CAREER_HOUSE_OCCUPANCY');
    });

    it('planet in 8H gets HOUSE_OCCUPANT role and SUPPORTING relevance', () => {
      const result = interpretCareerPlanetaryRelevance(
        createContext({
          planet: Planet.MARS,
          ruledHouses: [],
          occupiedHouse: 8
        })
      );

      expect(result.relevance).toBe('SUPPORTING');
      expect(result.roles).toContain('HOUSE_OCCUPANT');
      expect(result.reasons).toContain('CAREER_HOUSE_OCCUPANCY');
    });

    it('planet in 12H gets HOUSE_OCCUPANT role and SUPPORTING relevance', () => {
      const result = interpretCareerPlanetaryRelevance(
        createContext({
          planet: Planet.SATURN,
          ruledHouses: [],
          occupiedHouse: 12
        })
      );

      expect(result.relevance).toBe('SUPPORTING');
      expect(result.roles).toContain('HOUSE_OCCUPANT');
      expect(result.reasons).toContain('CAREER_HOUSE_OCCUPANCY');
    });

    it('planet in non-career house (3H) gets NEUTRAL relevance', () => {
      const result = interpretCareerPlanetaryRelevance(
        createContext({
          planet: Planet.MERCURY,
          ruledHouses: [],
          occupiedHouse: 3
        })
      );

      expect(result.relevance).toBe('NEUTRAL');
      expect(result.roles).not.toContain('HOUSE_OCCUPANT');
    });
  });

  describe('Group F: House Aspect', () => {
    it('planet aspecting career houses gets HOUSE_ASPECTOR role and SUPPORTING relevance', () => {
      const result = interpretCareerPlanetaryRelevance(
        createContext({
          planet: Planet.JUPITER,
          ruledHouses: [],
          aspectsCareerHouse: [10, 6]
        })
      );

      expect(result.relevance).toBe('SUPPORTING');
      expect(result.roles).toContain('HOUSE_ASPECTOR');
      expect(result.reasons).toContain('CAREER_HOUSE_ASPECT');
      expect(result.relatedHouses).toContain(10);
      expect(result.relatedHouses).toContain(6);
    });

    it('aspecting only non-career houses yields NEUTRAL relevance', () => {
      const result = interpretCareerPlanetaryRelevance(
        createContext({
          planet: Planet.MERCURY,
          ruledHouses: [],
          aspectsCareerHouse: [3, 5]
        })
      );

      expect(result.relevance).toBe('NEUTRAL');
      expect(result.roles).not.toContain('HOUSE_ASPECTOR');
    });
  });

  describe('Group G: Relationship Participation', () => {
    it('planet in career relationships gets RELATIONSHIP_PARTICIPANT role and SUPPORTING relevance', () => {
      const result = interpretCareerPlanetaryRelevance(
        createContext({
          planet: Planet.SATURN,
          ruledHouses: [],
          careerRelationshipPlanets: [Planet.MERCURY, Planet.JUPITER]
        })
      );

      expect(result.relevance).toBe('SUPPORTING');
      expect(result.roles).toContain('RELATIONSHIP_PARTICIPANT');
      expect(result.reasons).toContain('CAREER_RELATIONSHIP');
      expect(result.relatedPlanets).toContain(Planet.MERCURY);
      expect(result.relatedPlanets).toContain(Planet.JUPITER);
    });
  });

  describe('Group H: Yoga Participation', () => {
    it('yoga participant gets YOGA_PARTICIPANT role and CONDITIONAL relevance', () => {
      const result = interpretCareerPlanetaryRelevance(
        createContext({
          planet: Planet.SATURN,
          ruledHouses: [],
          careerYogaParticipation: true
        })
      );

      expect(result.relevance).toBe('CONDITIONAL');
      expect(result.roles).toContain('YOGA_PARTICIPANT');
      expect(result.reasons).toContain('CAREER_YOGA');
      expect(result.conditional).toBe(true);
    });
  });

  describe('Group I: Natural Karaka', () => {
    it('Saturn as natural karaka gets NATURAL_KARAKA role and SECONDARY relevance', () => {
      const result = interpretCareerPlanetaryRelevance(
        createContext({
          planet: Planet.SATURN,
          ruledHouses: [],
          naturalCareerKaraka: true
        })
      );

      expect(result.relevance).toBe('SECONDARY');
      expect(result.roles).toContain('NATURAL_KARAKA');
      expect(result.reasons).toContain('NATURAL_KARAKA');
    });

    it('Saturn without context gets SECONDARY relevance via built-in karaka', () => {
      const result = interpretCareerPlanetaryRelevance(
        createContext({
          planet: Planet.SATURN,
          ruledHouses: []
        })
      );

      expect(result.relevance).toBe('SECONDARY');
      expect(result.roles).toContain('NATURAL_KARAKA');
    });

    it('non-karaka planet with empty context gets NEUTRAL relevance', () => {
      const result = interpretCareerPlanetaryRelevance(
        createContext({
          planet: Planet.JUPITER,
          ruledHouses: []
        })
      );

      expect(result.relevance).toBe('NEUTRAL');
    });
  });

  describe('Group J: Explicit Rule', () => {
    it('explicit career relevant gets CONDITIONAL relevance', () => {
      const result = interpretCareerPlanetaryRelevance(
        createContext({
          planet: Planet.MOON,
          ruledHouses: [],
          explicitCareerRelevant: true
        })
      );

      expect(result.relevance).toBe('CONDITIONAL');
      expect(result.reasons).toContain('EXPLICIT_RULE');
      expect(result.conditional).toBe(true);
    });
  });

  describe('Group K: Effect Calculation', () => {
    it('10L yields SUPPORT effect', () => {
      const result = interpretCareerPlanetaryRelevance(
        createContext({
          planet: Planet.SATURN,
          ruledHouses: [10]
        })
      );

      expect(result.effect).toBe('SUPPORT');
    });

    it('10L + 6L yields SUPPORT effect', () => {
      const result = interpretCareerPlanetaryRelevance(
        createContext({
          planet: Planet.SATURN,
          ruledHouses: [10, 6]
        })
      );

      expect(result.effect).toBe('SUPPORT');
    });

    it('10L + 8L yields CHALLENGE effect', () => {
      const result = interpretCareerPlanetaryRelevance(
        createContext({
          planet: Planet.SATURN,
          ruledHouses: [10, 8]
        })
      );

      expect(result.effect).toBe('CHALLENGE');
    });

    it('6L + 8L yields MIXED effect', () => {
      const result = interpretCareerPlanetaryRelevance(
        createContext({
          planet: Planet.MERCURY,
          ruledHouses: [6, 8]
        })
      );

      expect(result.effect).toBe('MIXED');
    });

    it('6L alone yields SUPPORT effect', () => {
      const result = interpretCareerPlanetaryRelevance(
        createContext({
          planet: Planet.MERCURY,
          ruledHouses: [6]
        })
      );

      expect(result.effect).toBe('SUPPORT');
    });

    it('8L alone yields CHALLENGE effect', () => {
      const result = interpretCareerPlanetaryRelevance(
        createContext({
          planet: Planet.MARS,
          ruledHouses: [8]
        })
      );

      expect(result.effect).toBe('CHALLENGE');
    });

    it('non-career lordship yields NEUTRAL effect', () => {
      const result = interpretCareerPlanetaryRelevance(
        createContext({
          planet: Planet.MERCURY,
          ruledHouses: [3, 5]
        })
      );

      expect(result.effect).toBe('NEUTRAL');
    });
  });

  describe('Group L: Expression Hints', () => {
    it('Saturn gets MANAGEMENT, SERVICE, AUTHORITY hints', () => {
      const result = interpretCareerPlanetaryRelevance(
        createContext({
          planet: Planet.SATURN,
          ruledHouses: []
        })
      );

      expect(result.expressionHints).toContain('MANAGEMENT');
      expect(result.expressionHints).toContain('SERVICE');
      expect(result.expressionHints).toContain('AUTHORITY');
    });

    it('Mercury gets TECHNICAL, COMMUNICATION hints', () => {
      const result = interpretCareerPlanetaryRelevance(
        createContext({
          planet: Planet.MERCURY,
          ruledHouses: []
        })
      );

      expect(result.expressionHints).toContain('TECHNICAL');
      expect(result.expressionHints).toContain('COMMUNICATION');
    });

    it('Mars gets LEADERSHIP, ENTERPRISE hints', () => {
      const result = interpretCareerPlanetaryRelevance(
        createContext({
          planet: Planet.MARS,
          ruledHouses: []
        })
      );

      expect(result.expressionHints).toContain('LEADERSHIP');
      expect(result.expressionHints).toContain('ENTERPRISE');
    });

    it('Sun gets LEADERSHIP, AUTHORITY hints', () => {
      const result = interpretCareerPlanetaryRelevance(
        createContext({
          planet: Planet.SUN,
          ruledHouses: []
        })
      );

      expect(result.expressionHints).toContain('LEADERSHIP');
      expect(result.expressionHints).toContain('AUTHORITY');
    });

    it('Jupiter gets MANAGEMENT, ENTERPRISE hints', () => {
      const result = interpretCareerPlanetaryRelevance(
        createContext({
          planet: Planet.JUPITER,
          ruledHouses: []
        })
      );

      expect(result.expressionHints).toContain('MANAGEMENT');
      expect(result.expressionHints).toContain('ENTERPRISE');
    });

    it('Moon gets no expression hints', () => {
      const result = interpretCareerPlanetaryRelevance(
        createContext({
          planet: Planet.MOON,
          ruledHouses: []
        })
      );

      expect(result.expressionHints).toEqual([]);
    });

    it('Rahu gets no expression hints', () => {
      const result = interpretCareerPlanetaryRelevance(
        createContext({
          planet: Planet.RAHU,
          ruledHouses: []
        })
      );

      expect(result.expressionHints).toEqual([]);
    });

    it('Ketu gets no expression hints', () => {
      const result = interpretCareerPlanetaryRelevance(
        createContext({
          planet: Planet.KETU,
          ruledHouses: []
        })
      );

      expect(result.expressionHints).toEqual([]);
    });

    it('Venus gets no expression hints', () => {
      const result = interpretCareerPlanetaryRelevance(
        createContext({
          planet: Planet.VENUS,
          ruledHouses: []
        })
      );

      expect(result.expressionHints).toEqual([]);
    });
  });

  describe('Group M: Multi-Role Planets', () => {
    it('Saturn with all roles preserves all seven roles', () => {
      const result = interpretCareerPlanetaryRelevance(
        createContext({
          planet: Planet.SATURN,
          ruledHouses: [10, 6, 8],
          occupiedHouse: 10,
          aspectsCareerHouse: [2, 11],
          careerRelationshipPlanets: [Planet.MERCURY, Planet.JUPITER],
          careerYogaParticipation: true,
          naturalCareerKaraka: true,
          explicitCareerRelevant: true
        })
      );

      expect(result.roles).toContain('CAREER_LORD');
      expect(result.roles).toContain('SUPPORTING_LORD');
      expect(result.roles).toContain('CHALLENGING_LORD');
      expect(result.roles).toContain('HOUSE_OCCUPANT');
      expect(result.roles).toContain('HOUSE_ASPECTOR');
      expect(result.roles).toContain('RELATIONSHIP_PARTICIPANT');
      expect(result.roles).toContain('YOGA_PARTICIPANT');
      expect(result.roles).toContain('NATURAL_KARAKA');
      expect(result.roles.length).toBe(7);
    });
  });

  describe('Group N: Deduplication', () => {
    it('deduplicates duplicate roles', () => {
      const result = interpretCareerPlanetaryRelevance(
        createContext({
          planet: Planet.SATURN,
          ruledHouses: [10, 10],
          aspectsCareerHouse: [10, 10]
        })
      );

      const careerLordCount = result.roles.filter(r => r === 'CAREER_LORD').length;
      expect(careerLordCount).toBe(1);
    });

    it('deduplicates duplicate reasons', () => {
      const result = interpretCareerPlanetaryRelevance(
        createContext({
          planet: Planet.SATURN,
          ruledHouses: [10, 10]
        })
      );

      const primaryLordshipCount = result.reasons.filter(r => r === 'PRIMARY_LORDSHIP').length;
      expect(primaryLordshipCount).toBe(1);
    });

    it('deduplicates duplicate related houses', () => {
      const result = interpretCareerPlanetaryRelevance(
        createContext({
          planet: Planet.SATURN,
          ruledHouses: [10, 10],
          aspectsCareerHouse: [10, 6]
        })
      );

      const house10Count = result.relatedHouses.filter(h => h === 10).length;
      expect(house10Count).toBe(1);
    });

    it('deduplicates duplicate related planets', () => {
      const result = interpretCareerPlanetaryRelevance(
        createContext({
          planet: Planet.SATURN,
          ruledHouses: [],
          careerRelationshipPlanets: [Planet.MERCURY, Planet.MERCURY]
        })
      );

      const mercuryCount = result.relatedPlanets.filter(p => p === Planet.MERCURY).length;
      expect(mercuryCount).toBe(1);
    });
  });

  describe('Group O: Conditional Flag', () => {
    it('conditional is true only when relevance is CONDITIONAL', () => {
      const yogaResult = interpretCareerPlanetaryRelevance(
        createContext({
          planet: Planet.SATURN,
          ruledHouses: [],
          careerYogaParticipation: true
        })
      );

      expect(yogaResult.conditional).toBe(true);
      expect(yogaResult.relevance).toBe('CONDITIONAL');
    });

    it('conditional is false for PRIMARY relevance', () => {
      const result = interpretCareerPlanetaryRelevance(
        createContext({
          planet: Planet.SATURN,
          ruledHouses: [10]
        })
      );

      expect(result.conditional).toBe(false);
      expect(result.relevance).toBe('PRIMARY');
    });

    it('conditional is false for SUPPORTING relevance', () => {
      const result = interpretCareerPlanetaryRelevance(
        createContext({
          planet: Planet.MERCURY,
          ruledHouses: [6]
        })
      );

      expect(result.conditional).toBe(false);
      expect(result.relevance).toBe('SUPPORTING');
    });

    it('conditional is false for SECONDARY relevance', () => {
      const result = interpretCareerPlanetaryRelevance(
        createContext({
          planet: Planet.SATURN,
          ruledHouses: [],
          naturalCareerKaraka: true
        })
      );

      expect(result.conditional).toBe(false);
      expect(result.relevance).toBe('SECONDARY');
    });

    it('conditional is false for NEUTRAL relevance', () => {
      const result = interpretCareerPlanetaryRelevance(
        createContext({
          planet: Planet.JUPITER,
          ruledHouses: []
        })
      );

      expect(result.conditional).toBe(false);
      expect(result.relevance).toBe('NEUTRAL');
    });
  });

  describe('Batch Processing', () => {
    it('processes multiple contexts preserving input order', () => {
      const contexts = [
        createContext({ planet: Planet.SATURN, ruledHouses: [10] }),
        createContext({ planet: Planet.MERCURY, ruledHouses: [6] }),
        createContext({ planet: Planet.JUPITER, ruledHouses: [2] })
      ];

      const results = interpretCareerPlanetaryRelevanceBatch(contexts);

      expect(results).toHaveLength(3);
      expect(results[0].planet).toBe(Planet.SATURN);
      expect(results[1].planet).toBe(Planet.MERCURY);
      expect(results[2].planet).toBe(Planet.JUPITER);
    });

    it('produces frozen array output', () => {
      const contexts = [
        createContext({ planet: Planet.SATURN, ruledHouses: [10] })
      ];

      const results = interpretCareerPlanetaryRelevanceBatch(contexts);

      expect(Object.isFrozen(results)).toBe(true);
    });

    it('deterministic: identical inputs produce identical outputs', () => {
      const context = createContext({
        planet: Planet.SATURN,
        ruledHouses: [10, 6],
        occupiedHouse: 10,
        aspectsCareerHouse: [2, 11],
        careerRelationshipPlanets: [Planet.MERCURY],
        careerYogaParticipation: true,
        naturalCareerKaraka: true
      });

      const result1 = interpretCareerPlanetaryRelevance(context);
      const result2 = interpretCareerPlanetaryRelevance(context);

      expect(result1).toEqual(result2);
    });
  });

  describe('Statement Generation', () => {
    it('generates structured explanatory statement', () => {
      const result = interpretCareerPlanetaryRelevance(
        createContext({
          planet: Planet.SATURN,
          ruledHouses: [10]
        })
      );

      expect(result.statement).toContain('Planet SATURN');
      expect(result.statement).toContain('primary career relevance');
      expect(result.statement).toContain('CAREER_LORD');
      expect(result.statement).toContain('PRIMARY_LORDSHIP');
      expect(result.statement).toContain('support');
    });

    it('includes expression hints when present', () => {
      const result = interpretCareerPlanetaryRelevance(
        createContext({
          planet: Planet.SATURN,
          ruledHouses: []
        })
      );

      expect(result.statement).toContain('Expression hints');
      expect(result.statement).toContain('MANAGEMENT');
    });

    it('includes related houses when present', () => {
      const result = interpretCareerPlanetaryRelevance(
        createContext({
          planet: Planet.SATURN,
          ruledHouses: [10, 6]
        })
      );

      expect(result.statement).toContain('Related houses');
      expect(result.statement).toContain('10');
      expect(result.statement).toContain('6');
    });

    it('includes related planets when present', () => {
      const result = interpretCareerPlanetaryRelevance(
        createContext({
          planet: Planet.SATURN,
          ruledHouses: [],
          careerRelationshipPlanets: [Planet.MERCURY]
        })
      );

      expect(result.statement).toContain('Related planets');
      expect(result.statement).toContain('MERCURY');
    });
  });

  describe('Boundary and Architecture Tests', () => {
    it('strong-but-unlinked planet yields NEUTRAL relevance', () => {
      const result = interpretCareerPlanetaryRelevance(
        createContext({
          planet: Planet.JUPITER,
          ruledHouses: []
        })
      );

      expect(result.relevance).toBe('NEUTRAL');
      expect(result.roles).toEqual([]);
      expect(result.reasons).toEqual([]);
    });

    it('result and nested arrays are frozen', () => {
      const result = interpretCareerPlanetaryRelevance(
        createContext({
          planet: Planet.SATURN,
          ruledHouses: [10]
        })
      );

      expect(Object.isFrozen(result)).toBe(true);
      expect(Object.isFrozen(result.roles)).toBe(true);
      expect(Object.isFrozen(result.reasons)).toBe(true);
      expect(Object.isFrozen(result.expressionHints)).toBe(true);
      expect(Object.isFrozen(result.relatedHouses)).toBe(true);
      expect(Object.isFrozen(result.relatedPlanets)).toBe(true);
    });

    it('result does NOT contain strength property', () => {
      const result = interpretCareerPlanetaryRelevance(
        createContext({
          planet: Planet.SATURN,
          ruledHouses: [10]
        })
      );

      expect(result).not.toHaveProperty('strength');
    });

    it('result does NOT contain score property', () => {
      const result = interpretCareerPlanetaryRelevance(
        createContext({
          planet: Planet.SATURN,
          ruledHouses: [10]
        })
      );

      expect(result).not.toHaveProperty('score');
    });

    it('result does NOT contain condition property', () => {
      const result = interpretCareerPlanetaryRelevance(
        createContext({
          planet: Planet.SATURN,
          ruledHouses: [10]
        })
      );

      expect(result).not.toHaveProperty('condition');
    });

    it('result does NOT contain dashaActivation property', () => {
      const result = interpretCareerPlanetaryRelevance(
        createContext({
          planet: Planet.SATURN,
          ruledHouses: [10]
        })
      );

      expect(result).not.toHaveProperty('dashaActivation');
    });

    it('result does NOT contain d10 property', () => {
      const result = interpretCareerPlanetaryRelevance(
        createContext({
          planet: Planet.SATURN,
          ruledHouses: [10]
        })
      );

      expect(result).not.toHaveProperty('d10');
    });

    it('result does NOT contain transit property', () => {
      const result = interpretCareerPlanetaryRelevance(
        createContext({
          planet: Planet.SATURN,
          ruledHouses: [10]
        })
      );

      expect(result).not.toHaveProperty('transit');
    });

    it('result does NOT contain manifestationMode property', () => {
      const result = interpretCareerPlanetaryRelevance(
        createContext({
          planet: Planet.SATURN,
          ruledHouses: [10]
        })
      );

      expect(result).not.toHaveProperty('manifestationMode');
    });

    it('result does NOT contain finalCareerConclusion property', () => {
      const result = interpretCareerPlanetaryRelevance(
        createContext({
          planet: Planet.SATURN,
          ruledHouses: [10]
        })
      );

      expect(result).not.toHaveProperty('finalCareerConclusion');
    });

    it('expressionHints do not produce manifestation mode', () => {
      const result = interpretCareerPlanetaryRelevance(
        createContext({
          planet: Planet.SATURN,
          ruledHouses: []
        })
      );

      expect(result.expressionHints).toContain('MANAGEMENT');
      expect(result).not.toHaveProperty('manifestationMode');
    });

    it('10L + karaka maintains PRIMARY relevance (ordering guardrail)', () => {
      const result = interpretCareerPlanetaryRelevance(
        createContext({
          planet: Planet.SATURN,
          ruledHouses: [10],
          naturalCareerKaraka: true
        })
      );

      expect(result.relevance).toBe('PRIMARY');
      expect(result.roles).toContain('CAREER_LORD');
      expect(result.roles).toContain('NATURAL_KARAKA');
    });

    it('karaka-only yields SECONDARY relevance (not PRIMARY)', () => {
      const result = interpretCareerPlanetaryRelevance(
        createContext({
          planet: Planet.SATURN,
          ruledHouses: [],
          naturalCareerKaraka: true
        })
      );

      expect(result.relevance).toBe('SECONDARY');
      expect(result.relevance).not.toBe('PRIMARY');
    });

    it('uses canonical house sets from careerTypes.ts', () => {
      const result = interpretCareerPlanetaryRelevance(
        createContext({
          planet: Planet.SATURN,
          ruledHouses: [10]
        })
      );

      expect(result.relevance).toBe('PRIMARY');
      expect(result.reasons).toContain('PRIMARY_LORDSHIP');
    });
  });
});
