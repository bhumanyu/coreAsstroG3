import {
  DefaultCareerMechanismResolver,
  defaultCareerMechanismResolver
} from './defaultCareerMechanismResolver';
import { CAREER_MECHANISM_RESOLUTION_RULES } from './careerMechanismResolverRules';
import type {
  CareerMechanismResolutionInput
} from './careerMechanismResolverTypes';
import type {
  CareerPattern,
  CareerPatternClassification,
  CareerPatternFamily,
  CareerPatternLevel
} from '../../careerPattern/careerPatternTypes';
import type {
  CareerNetworkTopology,
  CareerNetworkDirection
} from '../../careerGraph/careerHouseNetworkTypes';
import type {
  QualifiedCareerPattern,
  CareerPatternQualificationStatus
} from '../../careerPatternQualification/careerPatternQualificationTypes';
import type {
  ParticipantRoleAssignment,
  PrimaryParticipantRole
} from '../../careerParticipantRoles/participantRoleTypes';
import type {
  CareerHouseNetwork
} from '../../careerGraph/careerHouseNetworkTypes';
import type {
  CareerMechanismEvidence
} from '../careerMechanismTypes';
import type { CareerGraphEdge } from '../../careerGraph/careerAstroGraphTypes';
import { CAREER_MECHANISM_DEFINITIONS } from '../careerMechanismRegistry';
import { Planet } from '../../../../types';

/**
 * P2-07D Career Mechanism Resolver Tests
 *
 * Test suite for the mechanism resolution layer that maps pattern structural
 * facts to mechanism candidates.
 *
 * Coverage:
 * - Positive cases per rule (8↔10, 12↔10, composite)
 * - Negative cases (house pair present but no establishing relationship)
 * - Rule-precedence test (composite subsumes pair rules)
 * - Qualification gating
 * - resolveAll per-pattern isolation
 * - Determinism
 * - Mechanism type validation against registry
 * - Provenance traceability
 */

describe('careerMechanismResolver', () => {
  let resolver: DefaultCareerMechanismResolver;

  beforeEach(() => {
    resolver = new DefaultCareerMechanismResolver();
  });

  describe('Positive cases per rule', () => {
    it('should resolve 8↔10 dusthana patterns correctly', () => {
      const input = createMockInput({
        houses: [8, 10],
        establishingRelationshipIds: ['REL:8→10:OCCUPIES'],
        status: 'QUALIFIED'
      });

      const result = resolver.resolve(input);

      expect(result.patternId).toBe('pattern-1');
      expect(result.candidates.length).toBeGreaterThan(0);

      // Check that expected mechanism types are present
      const mechanismTypes = result.candidates.map(c => c.mechanismType);
      expect(mechanismTypes).toContain('RESEARCH');
      expect(mechanismTypes).toContain('INVESTIGATION');
      expect(mechanismTypes).toContain('TRANSFORMATION');
      expect(mechanismTypes).toContain('INSURANCE');
      expect(mechanismTypes).toContain('TAXATION');
      expect(mechanismTypes).toContain('BANKING_FINANCE');
      expect(mechanismTypes).toContain('COMPLIANCE');
      expect(mechanismTypes).toContain('CRISIS_MANAGEMENT');

      // No MIXED mechanism type
      expect(mechanismTypes).not.toContain('MIXED');

      // No duplicates
      const uniqueTypes = new Set(mechanismTypes);
      expect(uniqueTypes.size).toBe(mechanismTypes.length);
    });

    it('should resolve 12↔10 dusthana patterns correctly', () => {
      const input = createMockInput({
        houses: [12, 10],
        establishingRelationshipIds: ['REL:12→10:ASPECTS'],
        status: 'QUALIFIED'
      });

      const result = resolver.resolve(input);

      expect(result.patternId).toBe('pattern-1');
      expect(result.candidates.length).toBeGreaterThan(0);

      const mechanismTypes = result.candidates.map(c => c.mechanismType);
      expect(mechanismTypes).toContain('FOREIGN_WORK');
      expect(mechanismTypes).toContain('REMOTE_WORK');
      expect(mechanismTypes).toContain('INSTITUTIONAL_WORK');
      expect(mechanismTypes).toContain('ISOLATED_ENVIRONMENT');

      // No MIXED mechanism type
      expect(mechanismTypes).not.toContain('MIXED');

      // No duplicates
      const uniqueTypes = new Set(mechanismTypes);
      expect(uniqueTypes.size).toBe(mechanismTypes.length);
    });

    it('should resolve composite 8-12-10 patterns correctly', () => {
      const input = createMockInput({
        houses: [8, 12, 10],
        establishingRelationshipIds: ['REL:8→10:OCCUPIES', 'REL:12→10:ASPECTS'],
        status: 'QUALIFIED'
      });

      const result = resolver.resolve(input);

      expect(result.patternId).toBe('pattern-1');
      expect(result.candidates.length).toBeGreaterThan(0);

      const mechanismTypes = result.candidates.map(c => c.mechanismType);

      // Should contain union of both 8↔10 and 12↔10 sets
      expect(mechanismTypes).toContain('RESEARCH');
      expect(mechanismTypes).toContain('FOREIGN_WORK');

      // No MIXED mechanism type
      expect(mechanismTypes).not.toContain('MIXED');

      // No duplicates
      const uniqueTypes = new Set(mechanismTypes);
      expect(uniqueTypes.size).toBe(mechanismTypes.length);
    });
  });

  describe('Negative cases - firewall test', () => {
    it('should not emit candidates when house pair present but no establishing relationship', () => {
      // Pattern has houses 8 and 10, but no establishing relationship between them
      const input = createMockInput({
        houses: [8, 10],
        establishingRelationshipIds: [], // No establishing relationships
        status: 'QUALIFIED'
      });

      const result = resolver.resolve(input);

      expect(result.patternId).toBe('pattern-1');
      expect(result.candidates.length).toBe(0);
    });

    it('should not emit candidates when establishing relationship is for different house pair', () => {
      // Pattern has houses 8 and 10, but establishing relationship is for 6→10
      const input = createMockInput({
        houses: [8, 10],
        establishingRelationshipIds: ['REL:6→10:OCCUPIES'], // Wrong pair
        status: 'QUALIFIED'
      });

      const result = resolver.resolve(input);

      expect(result.patternId).toBe('pattern-1');
      expect(result.candidates.length).toBe(0);
    });
  });

  describe('Rule-precedence test', () => {
    it('should subsume pair rules when composite applies', () => {
      const input = createMockInput({
        houses: [8, 12, 10],
        establishingRelationshipIds: ['REL:8→10:OCCUPIES', 'REL:12→10:ASPECTS'],
        status: 'QUALIFIED'
      });

      const result = resolver.resolve(input);

      const mechanismTypes = result.candidates.map(c => c.mechanismType);

      // Each type should appear exactly once (no duplicates from pair + composite)
      const typeCounts = new Map<string, number>();
      for (const type of mechanismTypes) {
        typeCounts.set(type, (typeCounts.get(type) || 0) + 1);
      }

      for (const [type, count] of typeCounts) {
        expect(count).toBe(1);
      }

      // Total should be union of both sets (8 from 8↔10 + 4 from 12↔10 = 12)
      expect(mechanismTypes.length).toBe(12);
    });
  });

  describe('Qualification gating', () => {
    it('should skip resolution for UNQUALIFIED patterns', () => {
      const input = createMockInput({
        houses: [8, 10],
        establishingRelationshipIds: ['REL:8→10:OCCUPIES'],
        status: 'UNQUALIFIED'
      });

      const result = resolver.resolve(input);

      expect(result.patternId).toBe('pattern-1');
      expect(result.candidates.length).toBe(0);
    });

    it('should resolve structurally for INSUFFICIENT_DATA patterns', () => {
      const input = createMockInput({
        houses: [8, 10],
        establishingRelationshipIds: ['REL:8→10:OCCUPIES'],
        status: 'INSUFFICIENT_DATA'
      });

      const result = resolver.resolve(input);

      // Should still resolve based on structure
      expect(result.patternId).toBe('pattern-1');
      expect(result.candidates.length).toBeGreaterThan(0);
    });

    it('should resolve normally for QUALIFIED patterns', () => {
      const input = createMockInput({
        houses: [8, 10],
        establishingRelationshipIds: ['REL:8→10:OCCUPIES'],
        status: 'QUALIFIED'
      });

      const result = resolver.resolve(input);

      expect(result.patternId).toBe('pattern-1');
      expect(result.candidates.length).toBeGreaterThan(0);
    });
  });

  describe('resolveAll per-pattern isolation', () => {
    it('should return one CandidateSet per input pattern, never merged', () => {
      const input1 = createMockInput({
        patternId: 'pattern-1',
        houses: [8, 10],
        establishingRelationshipIds: ['REL:8→10:OCCUPIES'],
        status: 'QUALIFIED'
      });

      const input2 = createMockInput({
        patternId: 'pattern-2',
        houses: [12, 10],
        establishingRelationshipIds: ['REL:12→10:ASPECTS'],
        status: 'QUALIFIED'
      });

      const results = resolver.resolveAll([input1, input2]);

      expect(results.length).toBe(2);
      expect(results[0].patternId).toBe('pattern-1');
      expect(results[1].patternId).toBe('pattern-2');

      // Each should have its own candidates
      expect(results[0].candidates.length).toBeGreaterThan(0);
      expect(results[1].candidates.length).toBeGreaterThan(0);
    });
  });

  describe('Determinism', () => {
    it('should produce identical output on repeated resolves', () => {
      const input = createMockInput({
        houses: [8, 10],
        establishingRelationshipIds: ['REL:8→10:OCCUPIES'],
        status: 'QUALIFIED'
      });

      const result1 = resolver.resolve(input);
      const result2 = resolver.resolve(input);

      expect(result1.patternId).toBe(result2.patternId);
      expect(result1.candidates.length).toBe(result2.candidates.length);

      // Compare each candidate
      for (let i = 0; i < result1.candidates.length; i++) {
        expect(result1.candidates[i].candidateId).toBe(result2.candidates[i].candidateId);
        expect(result1.candidates[i].mechanismType).toBe(result2.candidates[i].mechanismType);
      }
    });
  });

  describe('Mechanism type validation', () => {
    it('should only emit mechanism types that exist in CAREER_MECHANISM_DEFINITIONS', () => {
      const input = createMockInput({
        houses: [8, 12, 10],
        establishingRelationshipIds: ['REL:8→10:OCCUPIES', 'REL:12→10:ASPECTS'],
        status: 'QUALIFIED'
      });

      const result = resolver.resolve(input);

      for (const candidate of result.candidates) {
        expect(CAREER_MECHANISM_DEFINITIONS[candidate.mechanismType]).toBeDefined();
      }
    });
  });

  describe('Provenance traceability', () => {
    it('should trace provenance to real relationship IDs', () => {
      const input = createMockInput({
        houses: [8, 10],
        establishingRelationshipIds: ['REL:8→10:OCCUPIES'],
        status: 'QUALIFIED'
      });

      const result = resolver.resolve(input);

      for (const candidate of result.candidates) {
        // Provenance should contain the establishing relationship IDs
        expect(candidate.provenance.relationshipIds).toContain('REL:8→10:OCCUPIES');
      }
    });

    it('should trace provenance to real participant IDs when roles present', () => {
      const input = createMockInput({
        houses: [8, 10],
        establishingRelationshipIds: ['REL:8→10:OCCUPIES'],
        status: 'QUALIFIED',
        participantRoles: [
          {
            participantId: 'PLANET:SUN' as const,
            primaryRole: 'CORE' as PrimaryParticipantRole,
            isChallenging: false,
            roleEvidence: [],
            explanation: 'Test role'
          }
        ]
      });

      const result = resolver.resolve(input);

      for (const candidate of result.candidates) {
        // Provenance should contain participant IDs
        expect(candidate.provenance.participantIds).toContain('PLANET:SUN');
      }
    });

    it('should not fabricate evidence IDs', () => {
      const input = createMockInput({
        houses: [8, 10],
        establishingRelationshipIds: ['REL:8→10:OCCUPIES'],
        status: 'QUALIFIED'
      });

      const result = resolver.resolve(input);

      for (const candidate of result.candidates) {
        for (const evidence of candidate.evidence) {
          // Evidence IDs should be deterministic and follow the expected format
          expect(evidence.evidenceId).toMatch(/^CAREER_MECHANISM_EVIDENCE:/);
        }
      }
    });
  });

  describe('Boundary enforcement', () => {
    it('should throw when pattern is missing', () => {
      const input = createMockInput({
        houses: [8, 10],
        establishingRelationshipIds: ['REL:8→10:OCCUPIES'],
        status: 'QUALIFIED'
      });

      // @ts-expect-error - testing error case
      input.pattern = null;

      expect(() => resolver.resolve(input)).toThrow('Pattern is required');
    });
  });

  describe('Regression tests - intersection invariant (Test A)', () => {
    it('should not emit candidates when pattern establishing IDs do not intersect with actual network edges', () => {
      // Pattern houses [8,10], establishing = ['REL:6→10'], but mock network contains
      // real REL:8→10 edge AND the 6→10 edges. The intersection should be empty because:
      // - getDirectHouseRelationshipIds(8, 10) returns ['REL:8→10:OCCUPIES'] (only edges between 8 and 10)
      // - pattern.provenance.establishingRelationshipIds = ['REL:6→10:OCCUPIES']
      // - Intersection is empty, so no candidates should be emitted.
      const networkRelationships: CareerGraphEdge[] = [
        // Real 8→10 edge exists in network
        {
          edgeId: 'EDGE:REL:8→10:OCCUPIES',
          type: 'OCCUPIES',
          sourceNodeId: 'PLANET:SUN',
          targetNodeId: 'HOUSE:10',
          identityKey: 'REL:8→10:OCCUPIES',
          provenance: {
            sourceIds: [],
            ruleIds: [],
            parentIds: []
          }
        },
        // LORD_OF for house 8
        {
          edgeId: 'EDGE:LORD_OF:SUN:8',
          type: 'LORD_OF',
          sourceNodeId: 'PLANET:SUN',
          targetNodeId: 'HOUSE:8',
          identityKey: 'LORD_OF:SUN:8',
          provenance: {
            sourceIds: [],
            ruleIds: [],
            parentIds: []
          }
        },
        // 6→10 edge also exists in network (but not in establishing IDs)
        {
          edgeId: 'EDGE:REL:6→10:OCCUPIES',
          type: 'OCCUPIES',
          sourceNodeId: 'PLANET:MOON',
          targetNodeId: 'HOUSE:10',
          identityKey: 'REL:6→10:OCCUPIES',
          provenance: {
            sourceIds: [],
            ruleIds: [],
            parentIds: []
          }
        },
        // LORD_OF for house 6
        {
          edgeId: 'EDGE:LORD_OF:MOON:6',
          type: 'LORD_OF',
          sourceNodeId: 'PLANET:MOON',
          targetNodeId: 'HOUSE:6',
          identityKey: 'LORD_OF:MOON:6',
          provenance: {
            sourceIds: [],
            ruleIds: [],
            parentIds: []
          }
        }
      ];

      const input = createMockInput({
        houses: [8, 10],
        establishingRelationshipIds: ['REL:6→10:OCCUPIES'], // Only 6→10 in establishing, not 8→10
        status: 'QUALIFIED',
        networkRelationships,
        networkHouses: [6, 8, 10] // Network contains all three houses for the edges
      });

      const result = resolver.resolve(input);

      // Should emit zero candidates because establishing IDs (6→10) do not intersect
      // with the actual 8→10 relationship edge in the network
      expect(result.candidates.length).toBe(0);
    });
  });

  describe('Regression tests - establishing-evidence source firewall (Test B)', () => {
    it('should filter out non-structural evidence sources from establishingEvidence', () => {
      const mockEvidence: CareerMechanismEvidence[] = [
        {
          evidenceId: 'CAREER_MECHANISM_EVIDENCE:D10:1',
          mechanismType: 'RESEARCH',
          source: 'D10',
          role: 'ESTABLISHING',
          participantIds: [],
          relationshipIds: [],
          patternId: 'pattern-1',
          explanation: 'D10 evidence (should be filtered out)'
        },
        {
          evidenceId: 'CAREER_MECHANISM_EVIDENCE:DISPOSITOR:1',
          mechanismType: 'RESEARCH',
          source: 'DISPOSITOR',
          role: 'ESTABLISHING',
          participantIds: [],
          relationshipIds: [],
          patternId: 'pattern-1',
          explanation: 'Dispositor evidence (should be filtered out)'
        },
        {
          evidenceId: 'CAREER_MECHANISM_EVIDENCE:PATTERN:1',
          mechanismType: 'RESEARCH',
          source: 'PATTERN',
          role: 'ESTABLISHING',
          participantIds: [],
          relationshipIds: [],
          patternId: 'pattern-1',
          explanation: 'Pattern evidence (should be included)'
        }
      ];

      const input = createMockInput({
        houses: [8, 10],
        establishingRelationshipIds: ['REL:8→10:OCCUPIES'],
        status: 'QUALIFIED',
        establishingEvidence: mockEvidence
      });

      const result = resolver.resolve(input);

      // Candidates should be emitted
      expect(result.candidates.length).toBeGreaterThan(0);

      for (const candidate of result.candidates) {
        // D10 and DISPOSITOR evidence should NOT appear in candidate.evidence
        const evidenceSources = candidate.evidence.map(e => e.source);
        expect(evidenceSources).not.toContain('D10');
        expect(evidenceSources).not.toContain('DISPOSITOR');

        // D10 and DISPOSITOR evidence IDs should NOT appear in provenance.evidenceIds
        const evidenceIds = candidate.provenance.evidenceIds;
        expect(evidenceIds).not.toContain('CAREER_MECHANISM_EVIDENCE:D10:1');
        expect(evidenceIds).not.toContain('CAREER_MECHANISM_EVIDENCE:DISPOSITOR:1');

        // PATTERN evidence should be included
        expect(evidenceSources).toContain('PATTERN');
      }
    });
  });

  describe('Regression tests - provenance↔evidence set equality (Test C)', () => {
    it('should maintain invariant: candidate.evidence[*].evidenceId equals candidate.provenance.evidenceIds', () => {
      const input = createMockInput({
        houses: [8, 10],
        establishingRelationshipIds: ['REL:8→10:OCCUPIES'],
        status: 'QUALIFIED'
      });

      const result = resolver.resolve(input);

      // For every emitted candidate, assert the invariant
      for (const candidate of result.candidates) {
        const evidenceIds = candidate.evidence.map(e => e.evidenceId).sort();
        const provenanceIds = candidate.provenance.evidenceIds.slice().sort();

        expect(evidenceIds).toEqual(provenanceIds);
      }
    });
  });

  describe('Regression tests - supporting LORD_OF edges cannot satisfy intersection (Test D)', () => {
    it('should not emit candidates when pattern establishing IDs contain only supporting LORD_OF edges', () => {
      // Network has a real 8→10 aspect edge plus LORD_OF:SUN:8
      // Pattern establishingRelationshipIds = ['LORD_OF:SUN:8'] (only the supporting edge)
      // This should produce zero candidates because LORD_OF context edges cannot satisfy the intersection
      // Even though the network has a real establishing edge (ASPECTS), it's not in the pattern's establishing IDs
      const networkRelationships: CareerGraphEdge[] = [
        // Real 8→10 aspect edge exists in network (establishing edge)
        {
          edgeId: 'EDGE:REL:8→10:ASPECTS',
          type: 'ASPECTS',
          sourceNodeId: 'PLANET:SUN',
          targetNodeId: 'HOUSE:10',
          identityKey: 'REL:8→10:ASPECTS',
          provenance: {
            sourceIds: [],
            ruleIds: [],
            parentIds: []
          }
        },
        // LORD_OF for house 8 (supporting context)
        {
          edgeId: 'EDGE:LORD_OF:SUN:8',
          type: 'LORD_OF',
          sourceNodeId: 'PLANET:SUN',
          targetNodeId: 'HOUSE:8',
          identityKey: 'LORD_OF:SUN:8',
          provenance: {
            sourceIds: [],
            ruleIds: [],
            parentIds: []
          }
        }
      ];

      const input = createMockInput({
        houses: [8, 10],
        establishingRelationshipIds: ['LORD_OF:SUN:8'], // Only the supporting LORD_OF edge, NOT the ASPECTS edge
        status: 'QUALIFIED',
        networkRelationships,
        networkHouses: [8, 10]
      });

      const result = resolver.resolve(input);

      // Should emit zero candidates because:
      // - getDirectHouseRelationshipIdsWithSeparation returns establishingIds=['REL:8→10:ASPECTS'], supportingIds=['LORD_OF:SUN:8']
      // - pattern.provenance.establishingRelationshipIds = ['LORD_OF:SUN:8']
      // - Intersection = [] (empty, because LORD_OF:SUN:8 is in supportingIds, not establishingIds)
      // - Therefore, no candidates should be emitted
      expect(result.candidates.length).toBe(0);
    });
  });
});

/**
 * Helper function to create mock resolution input.
 * Refactored to accept explicit networkRelationships and networkHouses overrides for testing edge cases.
 */
function createMockInput(overrides: {
  patternId?: string;
  houses: number[];
  establishingRelationshipIds: string[];
  status: CareerPatternQualificationStatus;
  participantRoles?: ParticipantRoleAssignment[];
  establishingEvidence?: CareerMechanismEvidence[];
  networkRelationships?: CareerGraphEdge[];
  networkHouses?: number[];
}): CareerMechanismResolutionInput {
  const patternId = overrides.patternId || 'pattern-1';

  const pattern: CareerPattern = {
    patternId,
    identityKey: `key-${patternId}`,
    family: 'DUSTHANA_TRANSFORMATION' as CareerPatternFamily,
    level: 'HOUSE_NETWORK' as CareerPatternLevel,
    classification: 'DUSTHANA_CAREER_TRANSFORMATION' as CareerPatternClassification,
    name: 'Test Pattern',
    topology: 'DIRECT_LINK' as CareerNetworkTopology,
    direction: 'FORWARD' as CareerNetworkDirection,
    houses: overrides.houses,
    houseRoles: {},
    planets: [],
    networkIds: ['network-1'],
    relationshipIds: overrides.establishingRelationshipIds,
    mechanisms: [],
    relationships: [],
    evidence: [],
    provenance: {
      sourceNetworkIds: ['network-1'],
      relationshipIds: overrides.establishingRelationshipIds,
      ruleIds: ['RULE_TEST'],
      establishingRelationshipIds: overrides.establishingRelationshipIds,
      supportingRelationshipIds: []
    }
  };

  const qualification: QualifiedCareerPattern = {
    patternId,
    identityKey: `key-${patternId}`,
    family: 'DUSTHANA_TRANSFORMATION' as CareerPatternFamily,
    level: 'HOUSE_NETWORK' as CareerPatternLevel,
    classification: 'DUSTHANA_CAREER_TRANSFORMATION' as CareerPatternClassification,
    name: 'Test Pattern',
    topology: 'DIRECT_LINK' as CareerNetworkTopology,
    direction: 'FORWARD' as CareerNetworkDirection,
    houses: overrides.houses,
    houseRoles: {},
    planets: [],
    networkIds: ['network-1'],
    relationshipIds: overrides.establishingRelationshipIds,
    sourcePattern: pattern,
    dimensions: {
      structuralStrength: 'NOT_ASSESSED',
      planetaryCondition: 'UNAVAILABLE',
      careerRelevance: 'NEUTRAL',
      coherence: 'INSUFFICIENT_DATA',
      activationPotential: 'UNKNOWN',
      divisionalConfirmation: 'NOT_ASSESSED'
    },
    participants: [],
    evidence: [],
    policyEvidence: [],
    decisionBlockingReasons: [],
    deferredDimensions: [],
    ruleId: 'RULE_TEST',
    explanation: 'Test qualification',
    provenance: {
      sourcePatternIds: [patternId],
      sourceEvidenceIds: [],
      ruleIds: ['RULE_TEST']
    },
    status: overrides.status,
    statement: 'Test statement'
  };

  const participantRoles = overrides.participantRoles || [];

  const establishingEvidence = overrides.establishingEvidence || [];

  // Create a mock network with the required relationships
  // If networkRelationships override is provided, use it directly
  // Otherwise, build relationship edges that match the establishing relationship IDs
  let relationships: CareerGraphEdge[] = [];

  if (overrides.networkRelationships) {
    relationships = overrides.networkRelationships;
  } else {
    for (const relId of overrides.establishingRelationshipIds) {
      // Parse the relationship ID to extract the relationship type
      // Format: REL:from→to:TYPE
      const match = relId.match(/REL:(\d+)→(\d+):(\w+)/);
      if (match) {
        const fromHouse = parseInt(match[1], 10);
        const toHouse = parseInt(match[2], 10);
        const relType = match[3];

        // Find a lord for the source house
        const fromLord = Planet.SUN; // Use SUN as default lord

        // Create the relationship edge
        if (relType === 'OCCUPIES') {
          relationships.push({
            edgeId: `EDGE:${relId}`,
            type: 'OCCUPIES',
            sourceNodeId: `PLANET:${fromLord}`,
            targetNodeId: `HOUSE:${toHouse}`,
            identityKey: relId,
            provenance: {
              sourceIds: [],
              ruleIds: [],
              parentIds: []
            }
          });
        } else if (relType === 'ASPECTS') {
          relationships.push({
            edgeId: `EDGE:${relId}`,
            type: 'ASPECTS',
            sourceNodeId: `PLANET:${fromLord}`,
            targetNodeId: `HOUSE:${toHouse}`,
            identityKey: relId,
            provenance: {
              sourceIds: [],
              ruleIds: [],
              parentIds: []
            }
          });
        }

        // Add LORD_OF edges for the lord
        relationships.push({
          edgeId: `EDGE:LORD_OF:${fromLord}:${fromHouse}`,
          type: 'LORD_OF',
          sourceNodeId: `PLANET:${fromLord}`,
          targetNodeId: `HOUSE:${fromHouse}`,
          identityKey: `LORD_OF:${fromLord}:${fromHouse}`,
          provenance: {
            sourceIds: [],
            ruleIds: [],
            parentIds: []
          }
        });
      }
    }
  }

  const network: CareerHouseNetwork = {
    networkId: 'network-1',
    identityKey: 'network-key-1',
    houses: overrides.networkHouses || overrides.houses,
    lords: [Planet.SUN, Planet.MOON],
    relationships,
    topology: 'DIRECT_LINK' as CareerNetworkTopology,
    direction: 'FORWARD' as CareerNetworkDirection,
    provenance: {
      sourceIds: [],
      ruleIds: [],
      parentIds: []
    },
    evidenceIds: []
  };

  return {
    pattern,
    qualification,
    participantRoles,
    establishingEvidence,
    networks: [network]
  };
}
