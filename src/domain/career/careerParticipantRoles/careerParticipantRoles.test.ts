import {
  assignParticipantRoles
} from './participantRoleEngine';
import type {
  ParticipantRoleContext,
  ParticipantRoleResult,
  ParticipantRoleAssignment,
  ParticipantId
} from './participantRoleTypes';
import type {
  CareerPattern,
  CareerPatternClassificationEvidence,
  CareerPatternClassification
} from '../careerPattern/careerPatternTypes';
import type {
  QualifiedCareerPattern,
  CareerPatternQualificationStatus
} from '../careerPatternQualification/careerPatternQualificationTypes';
import type {
  CareerHouseNetwork,
  CareerNetworkTopology,
  CareerNetworkDirection
} from '../careerGraph/careerHouseNetworkTypes';
import type {
  CareerGraphEdge,
  CareerGraphEdgeType
} from '../careerGraph/careerAstroGraphTypes';
import type {
  CareerPlanetaryConditionResult,
  CareerPlanetaryCondition,
  CareerPlanetaryDignity,
  CareerPlanetaryAffliction,
  CareerPlanetaryMotion,
  CareerPlanetaryCombustion
} from '../careerPlanetaryCondition';
import type {
  CareerPlanetaryRelevance,
  CareerPlanetRelevance
} from '../careerPlanetaryRelevance';
import { Planet } from '../../../types';

/**
 * Helper: Creates a minimal CareerPattern for testing.
 */
function makePattern(
  classification: CareerPatternClassification,
  planets: Planet[],
  establishingIds: string[],
  supportingIds: string[] = []
): CareerPattern {
  const evidence: CareerPatternClassificationEvidence[] = [
    Object.freeze({
      evidenceId: 'evidence-1',
      ruleId: 'rule-1',
      sourceNetworkId: 'network-1',
      sourceNetworkIdentityKey: 'key-1'
    })
  ];

  return Object.freeze({
    patternId: 'pattern-1',
    identityKey: 'TEST_PATTERN',
    family: 'CAREER_HOUSE_NETWORK',
    level: 'HOUSE_NETWORK',
    classification,
    name: 'Test Pattern',
    topology: 'LOOP' as CareerNetworkTopology,
    direction: 'DIRECT' as CareerNetworkDirection,
    houses: [10, 6, 2],
    houseRoles: Object.freeze({ 10: 'CAREER_HOUSE', 6: 'SERVICE_HOUSE', 2: 'WEALTH_HOUSE' }),
    planets,
    networkIds: ['network-1'],
    relationshipIds: [...establishingIds, ...supportingIds],
    mechanisms: [],
    relationships: [],
    evidence,
    provenance: Object.freeze({
      sourceNetworkIds: ['network-1'],
      relationshipIds: [...establishingIds, ...supportingIds],
      ruleIds: ['rule-1'],
      establishingRelationshipIds: establishingIds,
      supportingRelationshipIds: supportingIds
    })
  });
}

/**
 * Helper: Creates a minimal QualifiedCareerPattern for testing.
 */
function makeQualifiedPattern(
  pattern: CareerPattern,
  status: CareerPatternQualificationStatus = 'QUALIFIED'
): QualifiedCareerPattern {
  return Object.freeze({
    patternId: pattern.patternId,
    identityKey: pattern.identityKey,
    family: pattern.family,
    level: pattern.level,
    classification: pattern.classification,
    name: pattern.name,
    topology: pattern.topology,
    direction: pattern.direction,
    houses: pattern.houses,
    houseRoles: pattern.houseRoles,
    planets: pattern.planets,
    networkIds: pattern.networkIds,
    relationshipIds: pattern.relationshipIds,
    sourcePattern: pattern,
    dimensions: Object.freeze({
      structuralStrength: 'NOT_ASSESSED',
      planetaryCondition: 'MODERATE',
      careerRelevance: 'PRIMARY',
      coherence: 'MODERATE',
      activationPotential: 'UNKNOWN',
      divisionalConfirmation: 'NOT_ASSESSED'
    }),
    participants: [],
    evidence: [],
    policyEvidence: [],
    decisionBlockingReasons: [],
    deferredDimensions: [],
    ruleId: 'TEST_RULE',
    explanation: 'Test qualification',
    provenance: Object.freeze({
      sourcePatternIds: [pattern.patternId],
      sourceEvidenceIds: [],
      ruleIds: ['TEST_RULE']
    }),
    status,
    statement: 'Test statement'
  });
}

/**
 * Helper: Creates a minimal CareerHouseNetwork for testing.
 */
function makeNetwork(
  edges: CareerGraphEdge[]
): CareerHouseNetwork {
  return Object.freeze({
    networkId: 'network-1',
    identityKey: 'TEST_NETWORK',
    houses: [10, 6, 2],
    lords: [Planet.SATURN, Planet.MERCURY, Planet.JUPITER],
    relationships: edges,
    topology: 'LOOP' as CareerNetworkTopology,
    direction: 'DIRECT' as CareerNetworkDirection,
    provenance: Object.freeze({
      sourceIds: [],
      ruleIds: [],
      parentIds: []
    }),
    evidenceIds: []
  });
}

/**
 * Helper: Creates a minimal CareerGraphEdge for testing.
 */
function makeEdge(
  identityKey: string,
  sourceNodeId: string,
  targetNodeId: string,
  type: CareerGraphEdgeType
): CareerGraphEdge {
  return Object.freeze({
    edgeId: `edge-${identityKey}`,
    type,
    sourceNodeId,
    targetNodeId,
    identityKey,
    provenance: Object.freeze({
      sourceIds: [],
      ruleIds: [],
      parentIds: []
    })
  });
}

/**
 * Helper: Creates a minimal CareerPlanetaryConditionResult for testing.
 */
function makeCondition(
  planet: Planet,
  condition: CareerPlanetaryCondition = 'MODERATE',
  dignity: CareerPlanetaryDignity = 'OWN_SIGN',
  affliction: CareerPlanetaryAffliction = 'NONE'
): CareerPlanetaryConditionResult {
  return Object.freeze({
    planet,
    relevance: 'PRIMARY' as CareerPlanetRelevance,
    condition,
    dignity,
    affliction,
    motion: 'DIRECT' as CareerPlanetaryMotion,
    combustion: 'NOT_COMBUST' as CareerPlanetaryCombustion,
    positiveFactors: [],
    negativeFactors: [],
    relatedPlanets: [],
    conditional: false,
    statement: 'Test condition'
  });
}

/**
 * Helper: Creates a minimal CareerPlanetaryRelevance for testing.
 */
function makeRelevance(
  planet: Planet,
  relevance: CareerPlanetRelevance = 'PRIMARY'
): CareerPlanetaryRelevance {
  return Object.freeze({
    planet,
    relevance,
    roles: [],
    reasons: [],
    effect: 'SUPPORT',
    expressionHints: [],
    relatedHouses: [10],
    relatedPlanets: [],
    conditional: false,
    statement: 'Test relevance'
  });
}

/**
 * Helper: Creates a ParticipantRoleContext for testing.
 */
function makeContext(
  pattern: CareerPattern,
  qualification: QualifiedCareerPattern,
  edges: CareerGraphEdge[] = [],
  conditions: CareerPlanetaryConditionResult[] = [],
  relevance: CareerPlanetaryRelevance[] = []
): ParticipantRoleContext {
  return Object.freeze({
    pattern,
    qualification,
    networks: [makeNetwork(edges)],
    planetaryConditions: conditions,
    relevance
  });
}

describe('P2-07B Participant Roles', () => {
  describe('CORE role assignment', () => {
    test('positive: participant in establishing relationships is CORE', () => {
      const establishingIds = ['REL:6→10', 'REL:10→11'];
      const edges = [
        makeEdge('REL:6→10', 'PLANET:MERCURY', 'HOUSE:10', 'LORD_OF'),
        makeEdge('REL:10→11', 'PLANET:JUPITER', 'HOUSE:11', 'LORD_OF')
      ];

      const pattern = makePattern(
        'SERVICE_TO_PROFESSION_TO_GAINS' as CareerPatternClassification,
        [Planet.MERCURY, Planet.JUPITER],
        establishingIds
      );
      const qualification = makeQualifiedPattern(pattern, 'QUALIFIED');
      const context = makeContext(pattern, qualification, edges);

      const result = assignParticipantRoles(context);

      expect(result.assignments).toHaveLength(2);
      expect(result.assignments[0].primaryRole).toBe('CORE');
      expect(result.assignments[0].participantId).toBe('PLANET:MERCURY');
      expect(result.assignments[1].primaryRole).toBe('CORE');
      expect(result.assignments[1].participantId).toBe('PLANET:JUPITER');
    });

    test('negative: participant only in supporting relationships is not CORE', () => {
      const supportingIds = ['REL:SUPPORT'];
      const edges = [
        makeEdge('REL:SUPPORT', 'PLANET:VENUS', 'HOUSE:6', 'ASPECTS')
      ];

      const pattern = makePattern(
        'SERVICE_TO_PROFESSION_TO_GAINS' as CareerPatternClassification,
        [Planet.VENUS],
        [],
        supportingIds
      );
      const qualification = makeQualifiedPattern(pattern, 'QUALIFIED');
      const context = makeContext(pattern, qualification, edges);

      const result = assignParticipantRoles(context);

      expect(result.assignments).toHaveLength(1);
      expect(result.assignments[0].primaryRole).toBe('SUPPORTING');
      expect(result.assignments[0].participantId).toBe('PLANET:VENUS');
    });
  });

  describe('SUPPORTING role assignment', () => {
    test('positive: participant only in supporting relationships is SUPPORTING', () => {
      const supportingIds = ['REL:SUPPORT'];
      const edges = [
        makeEdge('REL:SUPPORT', 'PLANET:VENUS', 'HOUSE:6', 'ASPECTS')
      ];

      const pattern = makePattern(
        'SERVICE_TO_PROFESSION_TO_GAINS' as CareerPatternClassification,
        [Planet.VENUS],
        [],
        supportingIds
      );
      const qualification = makeQualifiedPattern(pattern, 'QUALIFIED');
      const context = makeContext(pattern, qualification, edges);

      const result = assignParticipantRoles(context);

      expect(result.assignments).toHaveLength(1);
      expect(result.assignments[0].primaryRole).toBe('SUPPORTING');
    });

    test('negative: participant in both establishing and supporting is CORE, not SUPPORTING', () => {
      const establishingIds = ['REL:6→10'];
      const supportingIds = ['REL:SUPPORT'];
      const edges = [
        makeEdge('REL:6→10', 'PLANET:MERCURY', 'HOUSE:10', 'LORD_OF'),
        makeEdge('REL:SUPPORT', 'PLANET:MERCURY', 'HOUSE:6', 'ASPECTS')
      ];

      const pattern = makePattern(
        'SERVICE_TO_PROFESSION_TO_GAINS' as CareerPatternClassification,
        [Planet.MERCURY],
        establishingIds,
        supportingIds
      );
      const qualification = makeQualifiedPattern(pattern, 'QUALIFIED');
      const context = makeContext(pattern, qualification, edges);

      const result = assignParticipantRoles(context);

      expect(result.assignments).toHaveLength(1);
      expect(result.assignments[0].primaryRole).toBe('CORE');
      expect(result.assignments[0].primaryRole).not.toBe('SUPPORTING');
    });
  });

  describe('MODIFIER role assignment', () => {
    test('positive: participant with CONJUNCT edge to CORE is MODIFIER', () => {
      const establishingIds = ['REL:6→10'];
      const supportingIds = ['REL:CONJUNCT'];
      const edges = [
        makeEdge('REL:6→10', 'PLANET:MERCURY', 'HOUSE:10', 'LORD_OF'),
        makeEdge('REL:CONJUNCT', 'PLANET:VENUS', 'PLANET:MERCURY', 'CONJUNCT')
      ];

      const pattern = makePattern(
        'SERVICE_TO_PROFESSION_TO_GAINS' as CareerPatternClassification,
        [Planet.MERCURY, Planet.VENUS],
        establishingIds,
        supportingIds
      );
      const qualification = makeQualifiedPattern(pattern, 'QUALIFIED');
      const context = makeContext(pattern, qualification, edges);

      const result = assignParticipantRoles(context);

      expect(result.assignments).toHaveLength(2);
      const mercuryAssignment = result.assignments.find(a => a.participantId === 'PLANET:MERCURY');
      const venusAssignment = result.assignments.find(a => a.participantId === 'PLANET:VENUS');

      expect(mercuryAssignment?.primaryRole).toBe('CORE');
      expect(venusAssignment?.primaryRole).toBe('MODIFIER');
      expect(venusAssignment?.roleEvidence).toHaveLength(1);
      expect(venusAssignment?.roleEvidence[0].relationshipIds).toEqual(['REL:CONJUNCT']);
    });

    test('positive: participant with ASPECTS edge to CORE is MODIFIER', () => {
      const establishingIds = ['REL:6→10'];
      const supportingIds = ['REL:ASPECTS'];
      const edges = [
        makeEdge('REL:6→10', 'PLANET:MERCURY', 'HOUSE:10', 'LORD_OF'),
        makeEdge('REL:ASPECTS', 'PLANET:VENUS', 'PLANET:MERCURY', 'ASPECTS')
      ];

      const pattern = makePattern(
        'SERVICE_TO_PROFESSION_TO_GAINS' as CareerPatternClassification,
        [Planet.MERCURY, Planet.VENUS],
        establishingIds,
        supportingIds
      );
      const qualification = makeQualifiedPattern(pattern, 'QUALIFIED');
      const context = makeContext(pattern, qualification, edges);

      const result = assignParticipantRoles(context);

      expect(result.assignments).toHaveLength(2);
      const venusAssignment = result.assignments.find(a => a.participantId === 'PLANET:VENUS');
      expect(venusAssignment?.primaryRole).toBe('MODIFIER');
      expect(venusAssignment?.roleEvidence[0].relationshipIds).toEqual(['REL:ASPECTS']);
    });

    test('negative: participant with unrelated edge is not MODIFIER', () => {
      const establishingIds = ['REL:6→10'];
      const supportingIds = ['REL:SUPPORT'];
      const edges = [
        makeEdge('REL:6→10', 'PLANET:MERCURY', 'HOUSE:10', 'LORD_OF'),
        makeEdge('REL:SUPPORT', 'PLANET:VENUS', 'HOUSE:6', 'LORD_OF')
      ];

      const pattern = makePattern(
        'SERVICE_TO_PROFESSION_TO_GAINS' as CareerPatternClassification,
        [Planet.MERCURY, Planet.VENUS],
        establishingIds,
        supportingIds
      );
      const qualification = makeQualifiedPattern(pattern, 'QUALIFIED');
      const context = makeContext(pattern, qualification, edges);

      const result = assignParticipantRoles(context);

      expect(result.assignments).toHaveLength(2);
      const venusAssignment = result.assignments.find(a => a.participantId === 'PLANET:VENUS');
      expect(venusAssignment?.primaryRole).toBe('SUPPORTING');
      expect(venusAssignment?.primaryRole).not.toBe('MODIFIER');
    });

    test('negative: participant with edge to non-CORE participant is not MODIFIER', () => {
      const establishingIds = ['REL:6→10'];
      const supportingIds = ['REL:CONJUNCT'];
      const edges = [
        makeEdge('REL:6→10', 'PLANET:MERCURY', 'HOUSE:10', 'LORD_OF'),
        makeEdge('REL:SUPPORT', 'PLANET:VENUS', 'HOUSE:6', 'LORD_OF'),
        makeEdge('REL:CONJUNCT', 'PLANET:JUPITER', 'PLANET:VENUS', 'CONJUNCT')
      ];

      const pattern = makePattern(
        'SERVICE_TO_PROFESSION_TO_GAINS' as CareerPatternClassification,
        [Planet.MERCURY, Planet.VENUS, Planet.JUPITER],
        establishingIds,
        supportingIds
      );
      const qualification = makeQualifiedPattern(pattern, 'QUALIFIED');
      const context = makeContext(pattern, qualification, edges);

      const result = assignParticipantRoles(context);

      const jupiterAssignment = result.assignments.find(a => a.participantId === 'PLANET:JUPITER');
      expect(jupiterAssignment?.primaryRole).not.toBe('MODIFIER');
    });

    test('negative: participant with no edge is not MODIFIER', () => {
      const establishingIds = ['REL:6→10'];
      const edges = [
        makeEdge('REL:6→10', 'PLANET:MERCURY', 'HOUSE:10', 'LORD_OF')
      ];

      const pattern = makePattern(
        'SERVICE_TO_PROFESSION_TO_GAINS' as CareerPatternClassification,
        [Planet.MERCURY, Planet.VENUS],
        establishingIds
      );
      const qualification = makeQualifiedPattern(pattern, 'QUALIFIED');
      const context = makeContext(pattern, qualification, edges);

      const result = assignParticipantRoles(context);

      expect(result.assignments).toHaveLength(1);
      expect(result.assignments[0].participantId).toBe('PLANET:MERCURY');
    });
  });

  describe('CHALLENGING role assignment', () => {
    test('positive: participant with adverse condition is CHALLENGING', () => {
      const establishingIds = ['REL:6→10'];
      const edges = [
        makeEdge('REL:6→10', 'PLANET:MERCURY', 'HOUSE:10', 'LORD_OF')
      ];
      const conditions = [
        makeCondition(Planet.MERCURY, 'WEAK', 'DEBILITATED', 'SEVERE')
      ];

      const pattern = makePattern(
        'SERVICE_TO_PROFESSION_TO_GAINS' as CareerPatternClassification,
        [Planet.MERCURY],
        establishingIds
      );
      const qualification = makeQualifiedPattern(pattern, 'QUALIFIED');
      const context = makeContext(pattern, qualification, edges, conditions);

      const result = assignParticipantRoles(context);

      expect(result.assignments[0].isChallenging).toBe(true);
    });

    test('negative: natural malefic without adverse evidence is not CHALLENGING', () => {
      const establishingIds = ['REL:6→10'];
      const edges = [
        makeEdge('REL:6→10', 'PLANET:SATURN', 'HOUSE:10', 'LORD_OF')
      ];
      // No adverse condition for Saturn
      const conditions = [
        makeCondition(Planet.SATURN, 'MODERATE', 'OWN_SIGN', 'NONE')
      ];

      const pattern = makePattern(
        'SERVICE_TO_PROFESSION_TO_GAINS' as CareerPatternClassification,
        [Planet.SATURN],
        establishingIds
      );
      const qualification = makeQualifiedPattern(pattern, 'QUALIFIED');
      const context = makeContext(pattern, qualification, edges, conditions);

      const result = assignParticipantRoles(context);

      // Saturn should be CORE but not CHALLENGING
      expect(result.assignments[0].primaryRole).toBe('CORE');
      expect(result.assignments[0].isChallenging).toBe(false);
    });
  });

  describe('CORE + CHALLENGING mixed assignment', () => {
    test('CORE participant with challenging evidence keeps CORE role and isChallenging flag', () => {
      const establishingIds = ['REL:6→10'];
      const edges = [
        makeEdge('REL:6→10', 'PLANET:MERCURY', 'HOUSE:10', 'LORD_OF')
      ];
      const conditions = [
        makeCondition(Planet.MERCURY, 'WEAK', 'DEBILITATED', 'SEVERE')
      ];

      const pattern = makePattern(
        'SERVICE_TO_PROFESSION_TO_GAINS' as CareerPatternClassification,
        [Planet.MERCURY],
        establishingIds
      );
      const qualification = makeQualifiedPattern(pattern, 'QUALIFIED');
      const context = makeContext(pattern, qualification, edges, conditions);

      const result = assignParticipantRoles(context);

      expect(result.assignments[0].primaryRole).toBe('CORE');
      expect(result.assignments[0].isChallenging).toBe(true);
      expect(result.assignments[0].roleEvidence.length).toBeGreaterThan(1);
    });
  });

  describe('Missing data semantics', () => {
    test('missing evidence produces no role assignment, not CHALLENGING', () => {
      const pattern = makePattern(
        'SERVICE_TO_PROFESSION_TO_GAINS' as CareerPatternClassification,
        [Planet.MERCURY],
        []
      );
      const qualification = makeQualifiedPattern(pattern, 'QUALIFIED');
      const context = makeContext(pattern, qualification, [], []);

      const result = assignParticipantRoles(context);

      expect(result.assignments).toHaveLength(0);
    });
  });

  describe('Qualification gate', () => {
    test('UNQUALIFIED pattern returns empty assignments', () => {
      const establishingIds = ['REL:6→10'];
      const edges = [
        makeEdge('REL:6→10', 'PLANET:MERCURY', 'HOUSE:10', 'LORD_OF')
      ];

      const pattern = makePattern(
        'SERVICE_TO_PROFESSION_TO_GAINS' as CareerPatternClassification,
        [Planet.MERCURY],
        establishingIds
      );
      const qualification = makeQualifiedPattern(pattern, 'UNQUALIFIED');
      const context = makeContext(pattern, qualification, edges);

      const result = assignParticipantRoles(context);

      expect(result.assignments).toHaveLength(0);
      expect(result.explanation).toContain('UNQUALIFIED');
    });

    test('INSUFFICIENT_DATA pattern returns only fully-evidenced assignments', () => {
      const establishingIds = ['REL:6→10'];
      const edges = [
        makeEdge('REL:6→10', 'PLANET:MERCURY', 'HOUSE:10', 'LORD_OF')
      ];

      const pattern = makePattern(
        'SERVICE_TO_PROFESSION_TO_GAINS' as CareerPatternClassification,
        [Planet.MERCURY, Planet.VENUS],
        establishingIds
      );
      const qualification = makeQualifiedPattern(pattern, 'INSUFFICIENT_DATA');
      const context = makeContext(pattern, qualification, edges);

      const result = assignParticipantRoles(context);

      // Only Mercury (with evidence) should be assigned
      expect(result.assignments.length).toBeGreaterThan(0);
      expect(result.assignments.every(a => a.participantId === 'PLANET:MERCURY')).toBe(true);
    });
  });

  describe('No policy', () => {
    test('classification without policy returns empty result', () => {
      const pattern = makePattern(
        'WEALTH_TO_SERVICE_TO_PROFESSION_TO_GAINS' as CareerPatternClassification,
        [Planet.MERCURY],
        ['REL:6→10']
      );
      const qualification = makeQualifiedPattern(pattern, 'QUALIFIED');
      const context = makeContext(pattern, qualification, []);

      const result = assignParticipantRoles(context);

      expect(result.assignments).toHaveLength(0);
      expect(result.evidence).toHaveLength(0);
      expect(result.ruleId).toBe('NO_POLICY');
    });
  });

  describe('Determinism', () => {
    test('assignments are sorted by canonical planet order', () => {
      const establishingIds = ['REL:6→10', 'REL:10→11'];
      const edges = [
        makeEdge('REL:6→10', 'PLANET:JUPITER', 'HOUSE:10', 'LORD_OF'),
        makeEdge('REL:10→11', 'PLANET:MERCURY', 'HOUSE:11', 'LORD_OF')
      ];

      const pattern = makePattern(
        'SERVICE_TO_PROFESSION_TO_GAINS' as CareerPatternClassification,
        [Planet.JUPITER, Planet.MERCURY],
        establishingIds
      );
      const qualification = makeQualifiedPattern(pattern, 'QUALIFIED');
      const context = makeContext(pattern, qualification, edges);

      const result = assignParticipantRoles(context);

      // Mercury comes before Jupiter in canonical order
      expect(result.assignments[0].participantId).toBe('PLANET:MERCURY');
      expect(result.assignments[1].participantId).toBe('PLANET:JUPITER');
    });

    test('evidence is sorted by evidenceId', () => {
      const establishingIds = ['REL:6→10', 'REL:10→11'];
      const edges = [
        makeEdge('REL:6→10', 'PLANET:MERCURY', 'HOUSE:10', 'LORD_OF'),
        makeEdge('REL:10→11', 'PLANET:JUPITER', 'HOUSE:11', 'LORD_OF')
      ];

      const pattern = makePattern(
        'SERVICE_TO_PROFESSION_TO_GAINS' as CareerPatternClassification,
        [Planet.MERCURY, Planet.JUPITER],
        establishingIds
      );
      const qualification = makeQualifiedPattern(pattern, 'QUALIFIED');
      const context = makeContext(pattern, qualification, edges);

      const result = assignParticipantRoles(context);

      // Check that evidence is sorted
      const evidenceIds = result.evidence.map(e => e.evidenceId);
      const sortedEvidenceIds = [...evidenceIds].sort();
      expect(evidenceIds).toEqual(sortedEvidenceIds);
    });

    test('identical input produces identical output (byte-level determinism)', () => {
      const establishingIds = ['REL:6→10', 'REL:10→11'];
      const edges = [
        makeEdge('REL:6→10', 'PLANET:MERCURY', 'HOUSE:10', 'LORD_OF'),
        makeEdge('REL:10→11', 'PLANET:JUPITER', 'HOUSE:11', 'LORD_OF')
      ];

      const pattern = makePattern(
        'SERVICE_TO_PROFESSION_TO_GAINS' as CareerPatternClassification,
        [Planet.MERCURY, Planet.JUPITER],
        establishingIds
      );
      const qualification = makeQualifiedPattern(pattern, 'QUALIFIED');
      const context = makeContext(pattern, qualification, edges);

      const result1 = assignParticipantRoles(context);
      const result2 = assignParticipantRoles(context);

      expect(JSON.stringify(result1)).toBe(JSON.stringify(result2));
    });
  });

  describe('Evidence identity and deduplication', () => {
    test('evidenceId follows format P2-07B:EVIDENCE:${ruleId}:${participantId}:${role}:${edge.identityKey}', () => {
      const establishingIds = ['REL:6→10'];
      const edges = [
        makeEdge('REL:6→10', 'PLANET:MERCURY', 'HOUSE:10', 'LORD_OF')
      ];

      const pattern = makePattern(
        'SERVICE_TO_PROFESSION_TO_GAINS' as CareerPatternClassification,
        [Planet.MERCURY],
        establishingIds
      );
      const qualification = makeQualifiedPattern(pattern, 'QUALIFIED');
      const context = makeContext(pattern, qualification, edges);

      const result = assignParticipantRoles(context);

      // Find CORE evidence (not CHALLENGING)
      const coreEvidence = result.evidence.find(e => e.role === 'CORE');
      expect(coreEvidence?.evidenceId).toMatch(
        /^P2-07B:EVIDENCE:SERVICE_TO_PROFESSION_TO_GAINS:PLANET:MERCURY:CORE:REL:6→10$/
      );
    });

    test('duplicate evidence is deduplicated by evidenceId', () => {
      const establishingIds = ['REL:6→10'];
      const edges = [
        makeEdge('REL:6→10', 'PLANET:MERCURY', 'HOUSE:10', 'LORD_OF')
      ];

      const pattern = makePattern(
        'SERVICE_TO_PROFESSION_TO_GAINS' as CareerPatternClassification,
        [Planet.MERCURY],
        establishingIds
      );
      const qualification = makeQualifiedPattern(pattern, 'QUALIFIED');
      const context = makeContext(pattern, qualification, edges);

      const result = assignParticipantRoles(context);

      // Check that evidence IDs are unique
      const evidenceIds = result.evidence.map(e => e.evidenceId);
      const uniqueIds = new Set(evidenceIds);
      expect(evidenceIds.length).toBe(uniqueIds.size);
    });
  });

  describe('Primary role precedence', () => {
    test('CORE > MODIFIER > SUPPORTING precedence', () => {
      const establishingIds = ['REL:6→10'];
      const supportingIds = ['REL:SUPPORT'];
      const edges = [
        makeEdge('REL:6→10', 'PLANET:MERCURY', 'HOUSE:10', 'LORD_OF'),
        makeEdge('REL:SUPPORT', 'PLANET:MERCURY', 'HOUSE:6', 'ASPECTS'),
        makeEdge('REL:CONJUNCT', 'PLANET:MERCURY', 'PLANET:JUPITER', 'CONJUNCT')
      ];

      const pattern = makePattern(
        'SERVICE_TO_PROFESSION_TO_GAINS' as CareerPatternClassification,
        [Planet.MERCURY],
        establishingIds,
        supportingIds
      );
      const qualification = makeQualifiedPattern(pattern, 'QUALIFIED');
      const context = makeContext(pattern, qualification, edges);

      const result = assignParticipantRoles(context);

      // Mercury is in establishing relationships, so it should be CORE
      expect(result.assignments[0].primaryRole).toBe('CORE');
    });
  });
});
