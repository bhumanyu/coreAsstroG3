import { describe, expect, it } from 'vitest';

import {
  resolveCareer10LFoundation,
  DefaultCareer10LFoundation
} from './defaultCareer10LFoundation';

import {
  resolveCareer10LCondition
} from './career10LCondition';

import {
  resolveCareer10LRelationships,
  CAREER_10L_RELATIONSHIP_HOUSES
} from './career10LRelationships';

import type {
  Career10LFoundationInput,
  Career10LContext,
  Career10LRelationship
} from './career10LFoundationTypes';

import type {
  Career10HFoundation,
  Career10HContext
} from './career10HFoundationTypes';

import {
  Planet,
  Sign,
  DignityStatus,
  PlanetAnalysisEvidenceType
} from '../../../types';

import {
  analyzeHouseLordship
} from '../../../engine/houseLordship/houseLordship';

import type { CareerGraphNodeType } from '../careerGraph/careerAstroGraphTypes';
import {
  buildCareerAstroGraph
} from '../careerGraph/careerAstroGraphBuilder';
import {
  buildCareerGraphNodeId
} from '../careerGraph/careerAstroGraphIdentity';
import type { CareerGraphFact } from '../careerGraph/careerAstroGraphTypes';
import {
  resolveCareer10HFoundation
} from './defaultCareer10HFoundation';

/**
 * Helper: Creates a minimal Career10HContext for testing.
 */
function makeCareer10HContext(
  referencePoint: 'LAGNA' | 'MOON',
  house10Lord: Planet,
  lordHouse: number
): Career10HContext {
  return Object.freeze({
    referencePoint,
    referenceHouseNumber: 10,
    referenceHouseSign: Sign.CAPRICORN,
    lagnaRelativeHouseNumber: 10,
    house10Lord,
    lordHouse,
    occupants: [],
    aspectsOn10H: [],
    aspectDataStatus: 'UNAVAILABLE',
    provenance: {
      sourceHouseIndex: 10,
      drishtiSource: {
        reportPresent: false,
        aspectCount: 0
      },
      drishtiAspectIds: []
    }
  });
}

/**
 * Helper: Creates a minimal Career10HFoundation for testing.
 */
function makeCareer10HFoundation(
  lagnaContext: Career10HContext | null,
  moonContext: Career10HContext | null
): Career10HFoundation {
  return Object.freeze({
    lagnaContext,
    moonContext
  });
}

/**
 * Helper: Creates a minimal PlanetAnalysisReport for testing.
 * If includeAllPlanets is true, includes all planets (required for type compatibility).
 * If false, only includes the specified planet (for testing UNAVAILABLE scenarios).
 */
function makePlanetAnalysisReport(
  planet: Planet,
  dignityStatus?: DignityStatus,
  retrograde?: boolean,
  condition?: string,
  sign?: Sign,
  house?: number,
  includeAllPlanets: boolean = true
) {
  const evidence: any[] = [];

  if (sign) {
    evidence.push({
      type: PlanetAnalysisEvidenceType.SIGN_PLACEMENT,
      ruleId: 'PLANET_SIGN_PLACEMENT',
      reason: `${planet} occupies ${sign}.`
    });
  }

  if (dignityStatus && dignityStatus !== DignityStatus.NEUTRAL) {
    evidence.push({
      type: PlanetAnalysisEvidenceType.DIGNITY,
      ruleId: 'PLANET_DIGNITY',
      reason: `${planet} is in ${dignityStatus} dignity.`
    });
  }

  if (retrograde) {
    evidence.push({
      type: PlanetAnalysisEvidenceType.RETROGRADE,
      ruleId: 'PLANET_RETROGRADE',
      reason: `${planet} is in retrograde motion.`
    });
  }

  if (condition === 'COMBUST' || condition === 'DEEP_COMBUST') {
    evidence.push({
      type: PlanetAnalysisEvidenceType.COMBUSTION,
      ruleId: 'PLANET_COMBUSTION',
      reason: `${planet} is in ${condition} condition.`
    });
  }

  if (!includeAllPlanets) {
    // For testing UNAVAILABLE scenarios, only include the specified planet
    return Object.freeze({
      planets: {
        [planet]: Object.freeze({
          planet,
          sign,
          house,
          dignity: dignityStatus ? { status: dignityStatus } : undefined,
          state: {
            motion: retrograde !== undefined ? { retrograde } : undefined,
            condition
          },
          evidence: Object.freeze(evidence)
        })
      }
    }) as any;
  }

  // Create a full planets record with all planets
  const planets: Record<Planet, any> = {
    [Planet.SUN]: { planet: Planet.SUN, sign: undefined, house: undefined, dignity: undefined, state: undefined, evidence: [] },
    [Planet.MOON]: { planet: Planet.MOON, sign: undefined, house: undefined, dignity: undefined, state: undefined, evidence: [] },
    [Planet.MARS]: { planet: Planet.MARS, sign: undefined, house: undefined, dignity: undefined, state: undefined, evidence: [] },
    [Planet.MERCURY]: { planet: Planet.MERCURY, sign: undefined, house: undefined, dignity: undefined, state: undefined, evidence: [] },
    [Planet.JUPITER]: { planet: Planet.JUPITER, sign: undefined, house: undefined, dignity: undefined, state: undefined, evidence: [] },
    [Planet.VENUS]: { planet: Planet.VENUS, sign: undefined, house: undefined, dignity: undefined, state: undefined, evidence: [] },
    [Planet.SATURN]: { planet: Planet.SATURN, sign: undefined, house: undefined, dignity: undefined, state: undefined, evidence: [] },
    [Planet.RAHU]: { planet: Planet.RAHU, sign: undefined, house: undefined, dignity: undefined, state: undefined, evidence: [] },
    [Planet.KETU]: { planet: Planet.KETU, sign: undefined, house: undefined, dignity: undefined, state: undefined, evidence: [] }
  };

  // Override the specific planet with actual data
  planets[planet] = Object.freeze({
    planet,
    sign,
    house,
    dignity: dignityStatus ? { status: dignityStatus } : undefined,
    state: {
      motion: retrograde !== undefined ? { retrograde } : undefined,
      condition
    },
    evidence: Object.freeze(evidence)
  });

  return Object.freeze({
    planets: Object.freeze(planets)
  }) as any;
}

/**
 * Helper: Creates a minimal CareerAstroGraph for testing.
 */
function makeCareerAstroGraph(
  edges: Array<{
    edgeId: string;
    type: 'ASPECTS' | 'CONJUNCT' | 'EXCHANGES' | 'LORD_OF' | 'OCCUPIES';
    sourceNodeId: string;
    targetNodeId: string;
    identityKey: string;
  }>
) {
  const nodes = new Set<string>();
  for (const edge of edges) {
    nodes.add(edge.sourceNodeId);
    nodes.add(edge.targetNodeId);
  }

  const nodeArray = Array.from(nodes).map(nodeId => ({
    nodeId,
    type: (nodeId.startsWith('PLANET:') ? 'PLANET' : 'HOUSE') as CareerGraphNodeType,
    key: nodeId.replace('PLANET:', '').replace('HOUSE:', ''),
    provenance: {
      sourceIds: [],
      ruleIds: [],
      parentIds: []
    }
  }));

  const edgeArray = edges.map(edge => ({
    edgeId: edge.edgeId,
    type: edge.type,
    sourceNodeId: edge.sourceNodeId,
    targetNodeId: edge.targetNodeId,
    identityKey: edge.identityKey,
    provenance: {
      sourceIds: [],
      ruleIds: [],
      parentIds: []
    }
  }));

  return Object.freeze({
    nodes: Object.freeze(nodeArray),
    edges: Object.freeze(edgeArray)
  }) as any;
}

describe('career10L Condition Adapter', () => {
  describe('resolveCareer10LCondition', () => {
    it('should return UNAVAILABLE when planetAnalysis is absent', () => {
      const context10H = makeCareer10HContext('LAGNA', Planet.SATURN, 10);
      const condition = resolveCareer10LCondition(context10H, undefined);

      expect(condition.status).toBe('UNAVAILABLE');
      expect(condition.dignity).toBeUndefined();
      expect(condition.motion).toBeUndefined();
      expect(condition.combustion).toBeUndefined();
      expect(condition.sign).toBeUndefined();
      expect(condition.house).toBeUndefined();
      expect(condition.sourceRuleIds).toEqual([]);
    });

    it('should return UNAVAILABLE when 10L is not in planetAnalysis', () => {
      const context10H = makeCareer10HContext('LAGNA', Planet.SATURN, 10);
      const planetAnalysis = makePlanetAnalysisReport(Planet.JUPITER, DignityStatus.EXALTED, undefined, undefined, undefined, undefined, false);
      const condition = resolveCareer10LCondition(context10H, planetAnalysis);

      expect(condition.status).toBe('UNAVAILABLE');
      expect(condition.sourceRuleIds).toEqual([]);
    });

    it('should map EXALTED dignity correctly', () => {
      const context10H = makeCareer10HContext('LAGNA', Planet.JUPITER, 1);
      const planetAnalysis = makePlanetAnalysisReport(
        Planet.JUPITER,
        DignityStatus.EXALTED,
        false,
        undefined,
        Sign.CANCER,
        1
      );
      const condition = resolveCareer10LCondition(context10H, planetAnalysis);

      expect(condition.status).toBe('AVAILABLE');
      expect(condition.dignity).toBe('EXALTED');
      expect(condition.sign).toBe(Sign.CANCER);
      expect(condition.house).toBe(1);
      expect(condition.sourceRuleIds).toContain('PLANET_SIGN_PLACEMENT');
      expect(condition.sourceRuleIds).toContain('PLANET_DIGNITY');
    });

    it('should fold MOOLATRIKONA into OWN_SIGN', () => {
      const context10H = makeCareer10HContext('LAGNA', Planet.MARS, 1);
      const planetAnalysis = makePlanetAnalysisReport(
        Planet.MARS,
        DignityStatus.MOOLATRIKONA,
        false,
        undefined,
        Sign.ARIES,
        1
      );
      const condition = resolveCareer10LCondition(context10H, planetAnalysis);

      expect(condition.status).toBe('AVAILABLE');
      expect(condition.dignity).toBe('OWN_SIGN');
      expect(condition.sourceRuleIds).toContain('PLANET_DIGNITY');
    });

    it('should map DEBILITATED dignity correctly', () => {
      const context10H = makeCareer10HContext('LAGNA', Planet.MARS, 1);
      const planetAnalysis = makePlanetAnalysisReport(
        Planet.MARS,
        DignityStatus.DEBILITATED,
        false,
        undefined,
        Sign.CANCER,
        1
      );
      const condition = resolveCareer10LCondition(context10H, planetAnalysis);

      expect(condition.status).toBe('AVAILABLE');
      expect(condition.dignity).toBe('DEBILITATED');
    });

    it('should map NEUTRAL dignity to NEUTRAL_SIGN', () => {
      const context10H = makeCareer10HContext('LAGNA', Planet.MERCURY, 3);
      const planetAnalysis = makePlanetAnalysisReport(
        Planet.MERCURY,
        DignityStatus.NEUTRAL,
        false,
        undefined,
        Sign.LEO,
        3
      );
      const condition = resolveCareer10LCondition(context10H, planetAnalysis);

      expect(condition.status).toBe('AVAILABLE');
      expect(condition.dignity).toBe('NEUTRAL_SIGN');
    });

    it('should map retrograde motion correctly', () => {
      const context10H = makeCareer10HContext('LAGNA', Planet.SATURN, 10);
      const planetAnalysis = makePlanetAnalysisReport(
        Planet.SATURN,
        undefined,
        true,
        undefined,
        Sign.CAPRICORN,
        10
      );
      const condition = resolveCareer10LCondition(context10H, planetAnalysis);

      expect(condition.status).toBe('AVAILABLE');
      expect(condition.motion).toBe('RETROGRADE');
      expect(condition.sourceRuleIds).toContain('PLANET_RETROGRADE');
    });

    it('should map direct motion correctly', () => {
      const context10H = makeCareer10HContext('LAGNA', Planet.SATURN, 10);
      const planetAnalysis = makePlanetAnalysisReport(
        Planet.SATURN,
        undefined,
        false,
        undefined,
        Sign.CAPRICORN,
        10
      );
      const condition = resolveCareer10LCondition(context10H, planetAnalysis);

      expect(condition.status).toBe('AVAILABLE');
      expect(condition.motion).toBe('DIRECT');
    });

    it('should map COMBUST condition correctly', () => {
      const context10H = makeCareer10HContext('LAGNA', Planet.MERCURY, 10);
      const planetAnalysis = makePlanetAnalysisReport(
        Planet.MERCURY,
        undefined,
        false,
        'COMBUST',
        Sign.CAPRICORN,
        10
      );
      const condition = resolveCareer10LCondition(context10H, planetAnalysis);

      expect(condition.status).toBe('AVAILABLE');
      expect(condition.combustion).toBe('COMBUST');
      expect(condition.sourceRuleIds).toContain('PLANET_COMBUSTION');
    });

    it('should map DEEP_COMBUST condition to COMBUST', () => {
      const context10H = makeCareer10HContext('LAGNA', Planet.MERCURY, 10);
      const planetAnalysis = makePlanetAnalysisReport(
        Planet.MERCURY,
        undefined,
        false,
        'DEEP_COMBUST',
        Sign.CAPRICORN,
        10
      );
      const condition = resolveCareer10LCondition(context10H, planetAnalysis);

      expect(condition.status).toBe('AVAILABLE');
      expect(condition.combustion).toBe('COMBUST');
    });

    it('should map NORMAL condition to NOT_COMBUST', () => {
      const context10H = makeCareer10HContext('LAGNA', Planet.SATURN, 10);
      const planetAnalysis = makePlanetAnalysisReport(
        Planet.SATURN,
        undefined,
        false,
        'NORMAL',
        Sign.CAPRICORN,
        10
      );
      const condition = resolveCareer10LCondition(context10H, planetAnalysis);

      expect(condition.status).toBe('AVAILABLE');
      expect(condition.combustion).toBe('NOT_COMBUST');
    });

    it('should extract only relevant ruleIds', () => {
      const context10H = makeCareer10HContext('LAGNA', Planet.JUPITER, 1);
      const planetAnalysis = makePlanetAnalysisReport(
        Planet.JUPITER,
        DignityStatus.EXALTED,
        true,
        'COMBUST',
        Sign.CANCER,
        1
      );
      const condition = resolveCareer10LCondition(context10H, planetAnalysis);

      expect(condition.sourceRuleIds).toContain('PLANET_SIGN_PLACEMENT');
      expect(condition.sourceRuleIds).toContain('PLANET_DIGNITY');
      expect(condition.sourceRuleIds).toContain('PLANET_RETROGRADE');
      expect(condition.sourceRuleIds).toContain('PLANET_COMBUSTION');
      expect(condition.sourceRuleIds).toHaveLength(4);
    });
  });
});

describe('career10L Relationship Foundation', () => {
  describe('resolveCareer10LRelationships', () => {
    it('should return UNAVAILABLE when graph is absent', () => {
      const context10H = makeCareer10HContext('LAGNA', Planet.SATURN, 10);
      const houseLordship = analyzeHouseLordship(Sign.ARIES);
      const result = resolveCareer10LRelationships(context10H, houseLordship, undefined);

      expect(result.dataStatus).toBe('UNAVAILABLE');
      expect(result.relationships).toEqual([]);
    });

    it('should return UNAVAILABLE when houseLordship is absent', () => {
      const context10H = makeCareer10HContext('LAGNA', Planet.SATURN, 10);
      const graph = makeCareerAstroGraph([]);
      const result = resolveCareer10LRelationships(context10H, undefined, graph);

      expect(result.dataStatus).toBe('UNAVAILABLE');
      expect(result.relationships).toEqual([]);
    });

    it('should find ASPECTS edge between 10L and target lord', () => {
      const context10H = makeCareer10HContext('LAGNA', Planet.SATURN, 10);
      const houseLordship = analyzeHouseLordship(Sign.ARIES);
      const graph = makeCareerAstroGraph([
        {
          edgeId: 'edge1',
          type: 'ASPECTS',
          sourceNodeId: 'PLANET:SATURN',
          targetNodeId: 'PLANET:MARS',
          identityKey: 'SATURN_ASPECTS_MARS'
        }
      ]);

      const result = resolveCareer10LRelationships(context10H, houseLordship, graph);

      expect(result.dataStatus).toBe('AVAILABLE');
      expect(result.relationships).toHaveLength(1);
      expect(result.relationships[0].targetHouse).toBe(1);
      expect(result.relationships[0].sourceLord).toBe(Planet.MARS);
      expect(result.relationships[0].targetLord).toBe(Planet.SATURN);
      expect(result.relationships[0].relationshipType).toBe('ASPECTS');
      expect(result.relationships[0].relationshipId).toBe('SATURN_ASPECTS_MARS');
    });

    it('should find CONJUNCT edge between 10L and target lord', () => {
      const context10H = makeCareer10HContext('LAGNA', Planet.SATURN, 10);
      const houseLordship = analyzeHouseLordship(Sign.ARIES);
      const graph = makeCareerAstroGraph([
        {
          edgeId: 'edge1',
          type: 'CONJUNCT',
          sourceNodeId: 'PLANET:SATURN',
          targetNodeId: 'PLANET:MARS',
          identityKey: 'SATURN_CONJUNCT_MARS'
        }
      ]);

      const result = resolveCareer10LRelationships(context10H, houseLordship, graph);

      expect(result.dataStatus).toBe('AVAILABLE');
      expect(result.relationships).toHaveLength(1);
      expect(result.relationships[0].relationshipType).toBe('CONJUNCT');
    });

    it('should find EXCHANGES edge between 10L and target lord', () => {
      const context10H = makeCareer10HContext('LAGNA', Planet.SATURN, 10);
      const houseLordship = analyzeHouseLordship(Sign.ARIES);
      const graph = makeCareerAstroGraph([
        {
          edgeId: 'edge1',
          type: 'EXCHANGES',
          sourceNodeId: 'PLANET:SATURN',
          targetNodeId: 'PLANET:MARS',
          identityKey: 'SATURN_EXCHANGES_MARS'
        }
      ]);

      const result = resolveCareer10LRelationships(context10H, houseLordship, graph);

      expect(result.dataStatus).toBe('AVAILABLE');
      expect(result.relationships).toHaveLength(1);
      expect(result.relationships[0].relationshipType).toBe('EXCHANGES');
    });

    it('should exclude LORD_OF edges (planet→house)', () => {
      const context10H = makeCareer10HContext('LAGNA', Planet.SATURN, 10);
      const houseLordship = analyzeHouseLordship(Sign.ARIES);
      const graph = makeCareerAstroGraph([
        {
          edgeId: 'edge1',
          type: 'LORD_OF',
          sourceNodeId: 'PLANET:SATURN',
          targetNodeId: 'HOUSE:10',
          identityKey: 'SATURN_LORD_OF_10'
        }
      ]);

      const result = resolveCareer10LRelationships(context10H, houseLordship, graph);

      expect(result.dataStatus).toBe('AVAILABLE');
      expect(result.relationships).toHaveLength(0);
    });

    it('should exclude OCCUPIES edges (planet→house)', () => {
      const context10H = makeCareer10HContext('LAGNA', Planet.SATURN, 10);
      const houseLordship = analyzeHouseLordship(Sign.ARIES);
      const graph = makeCareerAstroGraph([
        {
          edgeId: 'edge1',
          type: 'OCCUPIES',
          sourceNodeId: 'PLANET:SATURN',
          targetNodeId: 'HOUSE:10',
          identityKey: 'SATURN_OCCUPIES_10'
        }
      ]);

      const result = resolveCareer10LRelationships(context10H, houseLordship, graph);

      expect(result.dataStatus).toBe('AVAILABLE');
      expect(result.relationships).toHaveLength(0);
    });

    it('should dedupe by identityKey', () => {
      const context10H = makeCareer10HContext('LAGNA', Planet.SATURN, 10);
      const houseLordship = analyzeHouseLordship(Sign.ARIES);
      const graph = makeCareerAstroGraph([
        {
          edgeId: 'edge1',
          type: 'ASPECTS',
          sourceNodeId: 'PLANET:SATURN',
          targetNodeId: 'PLANET:MARS',
          identityKey: 'SATURN_ASPECTS_MARS'
        },
        {
          edgeId: 'edge2',
          type: 'ASPECTS',
          sourceNodeId: 'PLANET:MARS',
          targetNodeId: 'PLANET:SATURN',
          identityKey: 'SATURN_ASPECTS_MARS'
        }
      ]);

      const result = resolveCareer10LRelationships(context10H, houseLordship, graph);

      expect(result.dataStatus).toBe('AVAILABLE');
      expect(result.relationships).toHaveLength(1);
    });

    it('should filter by six target houses only', () => {
      const context10H = makeCareer10HContext('LAGNA', Planet.SATURN, 10);
      const houseLordship = analyzeHouseLordship(Sign.ARIES);
      const graph = makeCareerAstroGraph([
        {
          edgeId: 'edge1',
          type: 'ASPECTS',
          sourceNodeId: 'PLANET:SATURN',
          targetNodeId: 'PLANET:VENUS',
          identityKey: 'SATURN_ASPECTS_VENUS'
        }
      ]);

      const result = resolveCareer10LRelationships(context10H, houseLordship, graph);

      // Venus is 2L, not in the six target houses (1,5,6,8,9,12)
      expect(result.relationships).toHaveLength(0);
    });

    it('should exclude edges between non-lord planets', () => {
      const context10H = makeCareer10HContext('LAGNA', Planet.SATURN, 10);
      const houseLordship = analyzeHouseLordship(Sign.ARIES);
      const graph = makeCareerAstroGraph([
        {
          edgeId: 'edge1',
          type: 'CONJUNCT',
          sourceNodeId: 'PLANET:VENUS',
          targetNodeId: 'PLANET:MERCURY',
          identityKey: 'VENUS_CONJUNCT_MERCURY'
        }
      ]);

      const result = resolveCareer10LRelationships(context10H, houseLordship, graph);

      expect(result.relationships).toHaveLength(0);
    });

    it('should sort deterministically by targetHouse, then edge type, then identityKey', () => {
      const context10H = makeCareer10HContext('LAGNA', Planet.SATURN, 10);
      const houseLordship = analyzeHouseLordship(Sign.ARIES);
      const graph = makeCareerAstroGraph([
        {
          edgeId: 'edge1',
          type: 'CONJUNCT',
          sourceNodeId: 'PLANET:SATURN',
          targetNodeId: 'PLANET:MARS',
          identityKey: 'z_conjunct'
        },
        {
          edgeId: 'edge2',
          type: 'ASPECTS',
          sourceNodeId: 'PLANET:SATURN',
          targetNodeId: 'PLANET:MARS',
          identityKey: 'a_aspects'
        },
        {
          edgeId: 'edge3',
          type: 'ASPECTS',
          sourceNodeId: 'PLANET:SATURN',
          targetNodeId: 'PLANET:JUPITER',
          identityKey: 'b_aspects'
        }
      ]);

      const result = resolveCareer10LRelationships(context10H, houseLordship, graph);

      expect(result.relationships).toHaveLength(3);
      // Mars (house 1) comes before Jupiter (house 9)
      expect(result.relationships[0].targetHouse).toBe(1);
      expect(result.relationships[1].targetHouse).toBe(1);
      expect(result.relationships[2].targetHouse).toBe(9);
      // ASPECTS comes before CONJUNCT
      expect(result.relationships[0].relationshipType).toBe('ASPECTS');
      expect(result.relationships[1].relationshipType).toBe('CONJUNCT');
    });

    it('should preserve provenance verbatim from edge', () => {
      const context10H = makeCareer10HContext('LAGNA', Planet.SATURN, 10);
      const houseLordship = analyzeHouseLordship(Sign.ARIES);
      const graph = makeCareerAstroGraph([
        {
          edgeId: 'edge1',
          type: 'ASPECTS',
          sourceNodeId: 'PLANET:SATURN',
          targetNodeId: 'PLANET:MARS',
          identityKey: 'SATURN_ASPECTS_MARS'
        }
      ]);

      const result = resolveCareer10LRelationships(context10H, houseLordship, graph);

      expect(result.relationships[0].provenance).toEqual({
        sourceIds: [],
        ruleIds: [],
        parentIds: []
      });
    });
  });
});

describe('career10L Foundation Resolver', () => {
  describe('resolveCareer10LFoundation', () => {
    it('should return INSUFFICIENT_DATA when foundation is missing', () => {
      const input: Career10LFoundationInput = {
        foundation: undefined as any
      };

      const result = resolveCareer10LFoundation(input);

      expect(result.status).toBe('INSUFFICIENT_DATA');
      expect(result.missingInputs).toContain('foundation');
      expect(result.foundation.lagnaContext).toBeNull();
      expect(result.foundation.moonContext).toBeNull();
    });

    it('should resolve complete foundation with Lagna context', () => {
      const lagnaContext = makeCareer10HContext('LAGNA', Planet.SATURN, 10);
      const foundation = makeCareer10HFoundation(lagnaContext, null);
      const houseLordship = analyzeHouseLordship(Sign.ARIES);
      const planetAnalysis = makePlanetAnalysisReport(
        Planet.SATURN,
        DignityStatus.OWN_SIGN,
        false,
        undefined,
        Sign.CAPRICORN,
        10
      );
      const graph = makeCareerAstroGraph([]);

      const input: Career10LFoundationInput = {
        foundation,
        houseLordship,
        planetAnalysis,
        careerGraph: graph
      };

      const result = resolveCareer10LFoundation(input);

      expect(result.status).toBe('COMPLETE');
      expect(result.missingInputs).toEqual([]);
      expect(result.foundation.lagnaContext).not.toBeNull();
      expect(result.foundation.lagnaContext?.referencePoint).toBe('LAGNA');
      expect(result.foundation.lagnaContext?.house10Lord).toBe(Planet.SATURN);
      expect(result.foundation.lagnaContext?.lordHouse).toBe(10);
      expect(result.foundation.lagnaContext?.condition.status).toBe('AVAILABLE');
      expect(result.foundation.lagnaContext?.condition.dignity).toBe('OWN_SIGN');
    });

    it('should resolve complete foundation with Moon context', () => {
      const moonContext = makeCareer10HContext('MOON', Planet.MARS, 8);
      const foundation = makeCareer10HFoundation(null, moonContext);
      const houseLordship = analyzeHouseLordship(Sign.ARIES);
      const planetAnalysis = makePlanetAnalysisReport(
        Planet.MARS,
        DignityStatus.OWN_SIGN,
        false,
        undefined,
        Sign.ARIES,
        1
      );
      const graph = makeCareerAstroGraph([]);

      const input: Career10LFoundationInput = {
        foundation,
        houseLordship,
        planetAnalysis,
        careerGraph: graph
      };

      const result = resolveCareer10LFoundation(input);

      expect(result.status).toBe('COMPLETE');
      expect(result.foundation.moonContext).not.toBeNull();
      expect(result.foundation.moonContext?.referencePoint).toBe('MOON');
      expect(result.foundation.moonContext?.house10Lord).toBe(Planet.MARS);
      expect(result.foundation.moonContext?.lordHouse).toBe(8);
    });

    it('Moon regression: Moon 10L should not reuse Lagna 10L', () => {
      // Lagna 10L = Saturn (Capricorn lord)
      const lagnaContext = makeCareer10HContext('LAGNA', Planet.SATURN, 10);
      // Moon 10L = Mars (Aries lord)
      const moonContext = makeCareer10HContext('MOON', Planet.MARS, 8);
      const foundation = makeCareer10HFoundation(lagnaContext, moonContext);
      const houseLordship = analyzeHouseLordship(Sign.ARIES);
      const planetAnalysis = makePlanetAnalysisReport(
        Planet.SATURN,
        DignityStatus.OWN_SIGN,
        false,
        undefined,
        Sign.CAPRICORN,
        10
      );
      const graph = makeCareerAstroGraph([]);

      const input: Career10LFoundationInput = {
        foundation,
        houseLordship,
        planetAnalysis,
        careerGraph: graph
      };

      const result = resolveCareer10LFoundation(input);

      expect(result.foundation.lagnaContext?.house10Lord).toBe(Planet.SATURN);
      expect(result.foundation.moonContext?.house10Lord).toBe(Planet.MARS);
      expect(result.foundation.moonContext?.house10Lord).not.toBe(
        result.foundation.lagnaContext?.house10Lord
      );
    });

    it('should return INSUFFICIENT_DATA when houseLordship is missing', () => {
      const lagnaContext = makeCareer10HContext('LAGNA', Planet.SATURN, 10);
      const foundation = makeCareer10HFoundation(lagnaContext, null);
      const planetAnalysis = makePlanetAnalysisReport(
        Planet.SATURN,
        DignityStatus.OWN_SIGN,
        false,
        undefined,
        Sign.CAPRICORN,
        10
      );
      const graph = makeCareerAstroGraph([]);

      const input: Career10LFoundationInput = {
        foundation,
        planetAnalysis,
        careerGraph: graph
      };

      const result = resolveCareer10LFoundation(input);

      expect(result.status).toBe('INSUFFICIENT_DATA');
      expect(result.missingInputs).toContain('HOUSE_LORDSHIP');
    });

    it('should record CAREER_GRAPH in missingInputs but status remains COMPLETE when careerGraph is missing', () => {
      const lagnaContext = makeCareer10HContext('LAGNA', Planet.SATURN, 10);
      const foundation = makeCareer10HFoundation(lagnaContext, null);
      const houseLordship = analyzeHouseLordship(Sign.ARIES);
      const planetAnalysis = makePlanetAnalysisReport(
        Planet.SATURN,
        DignityStatus.OWN_SIGN,
        false,
        undefined,
        Sign.CAPRICORN,
        10
      );

      const input: Career10LFoundationInput = {
        foundation,
        houseLordship,
        planetAnalysis
      };

      const result = resolveCareer10LFoundation(input);

      // careerGraph is optional - status is COMPLETE, but missingInputs records it
      expect(result.status).toBe('COMPLETE');
      expect(result.missingInputs).toContain('CAREER_GRAPH');
      expect(result.foundation.lagnaContext?.relationshipDataStatus).toBe('UNAVAILABLE');
    });

    it('should handle missing planetAnalysis gracefully (UNAVAILABLE)', () => {
      const lagnaContext = makeCareer10HContext('LAGNA', Planet.SATURN, 10);
      const foundation = makeCareer10HFoundation(lagnaContext, null);
      const houseLordship = analyzeHouseLordship(Sign.ARIES);
      const graph = makeCareerAstroGraph([]);

      const input: Career10LFoundationInput = {
        foundation,
        houseLordship,
        careerGraph: graph
      };

      const result = resolveCareer10LFoundation(input);

      // planetAnalysis is optional, so status can still be COMPLETE
      expect(result.status).toBe('COMPLETE');
      expect(result.foundation.lagnaContext?.condition.status).toBe('UNAVAILABLE');
      expect(result.missingInputs).not.toContain('PLANET_ANALYSIS');
    });

    it('should deep-freeze foundation and contexts', () => {
      const lagnaContext = makeCareer10HContext('LAGNA', Planet.SATURN, 10);
      const foundation = makeCareer10HFoundation(lagnaContext, null);
      const houseLordship = analyzeHouseLordship(Sign.ARIES);
      const planetAnalysis = makePlanetAnalysisReport(
        Planet.SATURN,
        DignityStatus.OWN_SIGN,
        false,
        undefined,
        Sign.CAPRICORN,
        10
      );
      const graph = makeCareerAstroGraph([]);

      const input: Career10LFoundationInput = {
        foundation,
        houseLordship,
        planetAnalysis,
        careerGraph: graph
      };

      const result = resolveCareer10LFoundation(input);

      expect(Object.isFrozen(result)).toBe(true);
      expect(Object.isFrozen(result.foundation)).toBe(true);
      expect(Object.isFrozen(result.foundation.lagnaContext)).toBe(true);
      expect(Object.isFrozen(result.foundation.lagnaContext?.condition)).toBe(true);
      expect(Object.isFrozen(result.foundation.lagnaContext?.condition.sourceRuleIds)).toBe(true);
      expect(Object.isFrozen(result.foundation.lagnaContext?.relationships)).toBe(true);
      expect(Object.isFrozen(result.foundation.lagnaContext?.provenance)).toBe(true);
      expect(Object.isFrozen(result.foundation.lagnaContext?.provenance.conditionSourceIds)).toBe(true);
      expect(Object.isFrozen(result.foundation.lagnaContext?.provenance.relationshipIds)).toBe(true);
    });

    it('should preserve provenance correctly', () => {
      const lagnaContext = makeCareer10HContext('LAGNA', Planet.SATURN, 10);
      const foundation = makeCareer10HFoundation(lagnaContext, null);
      const houseLordship = analyzeHouseLordship(Sign.ARIES);
      const planetAnalysis = makePlanetAnalysisReport(
        Planet.SATURN,
        DignityStatus.OWN_SIGN,
        false,
        undefined,
        Sign.CAPRICORN,
        10
      );
      const graph = makeCareerAstroGraph([
        {
          edgeId: 'edge1',
          type: 'ASPECTS',
          sourceNodeId: 'PLANET:SATURN',
          targetNodeId: 'PLANET:MARS',
          identityKey: 'SATURN_ASPECTS_MARS'
        }
      ]);

      const input: Career10LFoundationInput = {
        foundation,
        houseLordship,
        planetAnalysis,
        careerGraph: graph
      };

      const result = resolveCareer10LFoundation(input);

      expect(result.foundation.lagnaContext?.provenance.house10ContextRef).toBe('LAGNA');
      expect(result.foundation.lagnaContext?.provenance.conditionSourceIds).toContain('PLANET_SIGN_PLACEMENT');
      expect(result.foundation.lagnaContext?.provenance.conditionSourceIds).toContain('PLANET_DIGNITY');
      expect(result.foundation.lagnaContext?.provenance.relationshipIds).toContain('SATURN_ASPECTS_MARS');
    });
  });
});

describe('career10L Constants', () => {
  it('should have correct six target houses', () => {
    expect(CAREER_10L_RELATIONSHIP_HOUSES).toEqual([1, 5, 6, 8, 9, 12]);
  });
});

describe('career10L Relationship Contract Test', () => {
  it('should resolve each target house lord from analyzeHouseLordship output', () => {
    // Build a real HouseLordshipReport via analyzeHouseLordship
    const houseLordship = analyzeHouseLordship(Sign.ARIES);

    // Assert each of the six target houses resolves its lord from the real report
    CAREER_10L_RELATIONSHIP_HOUSES.forEach(targetHouse => {
      const lord = houseLordship.houseLords[targetHouse as keyof typeof houseLordship.houseLords];
      expect(lord).toBeDefined();
      expect(typeof lord).toBe('string');
    });

    // For Aries Lagna, verify known lords
    expect(houseLordship.houseLords[1]).toBe(Planet.MARS); // 1L = Mars
    expect(houseLordship.houseLords[5]).toBe(Planet.SUN); // 5L = Sun
    expect(houseLordship.houseLords[6]).toBe(Planet.VENUS); // 6L = Venus
    expect(houseLordship.houseLords[8]).toBe(Planet.SATURN); // 8L = Saturn
    expect(houseLordship.houseLords[9]).toBe(Planet.JUPITER); // 9L = Jupiter
    expect(houseLordship.houseLords[12]).toBe(Planet.JUPITER); // 12L = Jupiter
  });

  it('real integration test: build through real upstream reports', () => {
    // Build a real HouseLordshipReport via analyzeHouseLordship
    const houseLordship = analyzeHouseLordship(Sign.ARIES);

    // Construct the graph through the real careerAstroGraph builder
    // Use real edge/node factories rather than bare object literals
    const facts: CareerGraphFact[] = [
      {
        sourceNode: { type: 'PLANET', key: Planet.SATURN },
        targetNode: { type: 'PLANET', key: Planet.MARS },
        relationship: 'ASPECTS',
        provenance: {
          sourceIds: ['test-source-1'],
          ruleIds: [],
          parentIds: []
        }
      },
      {
        sourceNode: { type: 'PLANET', key: Planet.SATURN },
        targetNode: { type: 'PLANET', key: Planet.JUPITER },
        relationship: 'CONJUNCT',
        provenance: {
          sourceIds: ['test-source-2'],
          ruleIds: [],
          parentIds: []
        }
      }
    ];

    const careerGraph = buildCareerAstroGraph({ facts });

    // Build a real Career10HFoundation from resolveCareer10HFoundation
    // For this test, we'll use a minimal foundation with just the 10L info
    const lagnaContext = makeCareer10HContext('LAGNA', Planet.SATURN, 10);
    const foundation = makeCareer10HFoundation(lagnaContext, null);

    // Run resolveCareer10LFoundation
    const planetAnalysis = makePlanetAnalysisReport(
      Planet.SATURN,
      DignityStatus.OWN_SIGN,
      false,
      undefined,
      Sign.CAPRICORN,
      10
    );

    const input: Career10LFoundationInput = {
      foundation,
      houseLordship,
      planetAnalysis,
      careerGraph
    };

    const result = resolveCareer10LFoundation(input);

    // Assert the resolved relationships' sourceLord/targetLord/relationshipType
    // match what the real upstream reports produce
    expect(result.status).toBe('COMPLETE');
    expect(result.foundation.lagnaContext?.relationships).toHaveLength(2);

    // Saturn (10L) aspects Mars (1L)
    const saturnMarsRel = result.foundation.lagnaContext?.relationships.find(
      r => r.sourceLord === Planet.MARS && r.targetLord === Planet.SATURN
    );
    expect(saturnMarsRel).toBeDefined();
    expect(saturnMarsRel?.targetHouse).toBe(1);
    expect(saturnMarsRel?.relationshipType).toBe('ASPECTS');

    // Saturn (10L) conjunct Jupiter (9L)
    const saturnJupiterRel = result.foundation.lagnaContext?.relationships.find(
      r => r.sourceLord === Planet.JUPITER && r.targetLord === Planet.SATURN
    );
    expect(saturnJupiterRel).toBeDefined();
    expect(saturnJupiterRel?.targetHouse).toBe(9);
    expect(saturnJupiterRel?.relationshipType).toBe('CONJUNCT');
  });
});
