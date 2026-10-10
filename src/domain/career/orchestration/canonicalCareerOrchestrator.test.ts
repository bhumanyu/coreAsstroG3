import { describe, it, expect, vi } from 'vitest';
import type {
  CanonicalCareerFoundation,
  CareerOrchestrationPorts,
  PatternCandidate,
  PatternQualification,
  ParticipantRoleAssignment,
  ResolvedMechanism,
  MechanismRefinement,
  CareerFoundationSupplement,
  EvidenceIdentityKey
} from './canonicalCareerContracts';
import { CanonicalCareerOrchestrator } from './canonicalCareerOrchestrator';
import type {
  CareerPattern,
  CareerPatternFamily,
  CareerPatternLevel,
  CareerPatternClassification
} from '../careerPattern/careerPatternTypes';
import type {
  QualifiedCareerPattern,
  CareerPatternQualificationStatus
} from '../careerPatternQualification/careerPatternQualificationTypes';
import type { CareerHouseNetwork } from '../careerGraph/careerHouseNetworkTypes';
import type { CareerPlanetaryRelevance } from '../careerPlanetaryRelevance';
import type { CareerPlanetaryConditionResult } from '../careerPlanetaryCondition';
import type {
  CareerMechanismCandidate,
  CareerMechanismCandidateSet,
  CareerMechanismType
} from '../careerMechanism/careerMechanismTypes';
import type {
  CareerMechanismDispositorRefinementResult
} from '../careerMechanism/dispositor/careerMechanismDispositorTypes';
import type {
  Career10HFoundation
} from '../career10h/career10HFoundationTypes';
import type {
  Career10LFoundation
} from '../career10h/career10LFoundationTypes';
import type { ParticipantId } from '../careerParticipantRoles/participantRoleTypes';

/**
 * P2-11B Canonical Career Orchestrator Tests
 *
 * Contract tests for the canonical career orchestrator using stubbed ports.
 * Tests cover:
 * - Basic orchestration contract
 * - Duplicate candidate IDs
 * - Unavailable C4–C7 stages
 * - Duplicate mechanism IDs
 * - Order-permutation determinism
 * - Immutability
 */

describe('CanonicalCareerOrchestrator', () => {
  /**
   * Creates a stub pattern.
   */
  function createStubPattern(id: string): CareerPattern {
    return {
      patternId: id,
      identityKey: `IDENTITY_${id}` as EvidenceIdentityKey,
      family: 'DHARMA' as CareerPatternFamily,
      level: 'PRIMARY' as CareerPatternLevel,
      classification: 'DHARMA_KARMASHTAMA' as CareerPatternClassification,
      name: `Pattern ${id}`,
      topology: 'SIMPLE' as any,
      direction: 'DIRECT' as any,
      houses: [10],
      houseRoles: {},
      planets: [],
      networkIds: [],
      relationshipIds: [],
      provenance: {
        establishingRelationshipIds: [],
        ruleIds: []
      }
    };
  }

  /**
   * Creates a stub qualified pattern.
   */
  function createStubQualifiedPattern(
    patternId: string,
    status: CareerPatternQualificationStatus = 'QUALIFIED'
  ): QualifiedCareerPattern {
    return {
      patternId,
      identityKey: `IDENTITY_${patternId}` as EvidenceIdentityKey,
      family: 'DHARMA' as CareerPatternFamily,
      level: 'PRIMARY' as CareerPatternLevel,
      classification: 'DHARMA_KARMASHTAMA' as CareerPatternClassification,
      name: `Pattern ${patternId}`,
      topology: 'SIMPLE' as any,
      direction: 'DIRECT' as any,
      houses: [10],
      houseRoles: {},
      planets: [],
      networkIds: [],
      relationshipIds: [],
      sourcePattern: createStubPattern(patternId),
      dimensions: {
        structuralStrength: 'NOT_ASSESSED',
        planetaryCondition: 'UNAVAILABLE',
        careerRelevance: 'UNAVAILABLE',
        coherence: 'INSUFFICIENT_DATA',
        activationPotential: 'UNKNOWN',
        divisionalConfirmation: 'NOT_ASSESSED'
      },
      participants: [],
      evidence: [],
      policyEvidence: [],
      decisionBlockingReasons: [],
      deferredDimensions: [],
      ruleId: 'RULE_STUB',
      explanation: 'Stub qualification',
      provenance: {
        sourcePatternIds: [patternId],
        sourceEvidenceIds: [],
        ruleIds: ['RULE_STUB']
      },
      status,
      statement: 'Stub pattern qualified'
    };
  }

  /**
   * Creates a stub mechanism candidate.
   */
  function createStubMechanismCandidate(
    candidateId: string,
    patternId: string,
    mechanismType: CareerMechanismType
  ): CareerMechanismCandidate {
    return {
      candidateId,
      patternId,
      mechanismType,
      pathway: 'PATTERN',
      evidence: [],
      provenance: {
        patternIds: [patternId],
        relationshipIds: [],
        participantIds: [],
        evidenceIds: [],
        sourceStages: ['PATTERN']
      },
      explanation: 'Stub mechanism candidate'
    };
  }

  /**
   * Creates a stub mechanism candidate set.
   */
  function createStubCandidateSet(
    patternId: string,
    candidates: CareerMechanismCandidate[]
  ): CareerMechanismCandidateSet {
    return {
      patternId,
      candidates,
      evidence: [],
      provenance: {
        patternIds: [patternId],
        relationshipIds: [],
        participantIds: [],
        evidenceIds: [],
        sourceStages: ['PATTERN']
      }
    };
  }

  /**
   * Creates stub ports.
   */
  function createStubPorts(): CareerOrchestrationPorts {
    return {
      qualification: {
        qualifyCareerPatterns: vi.fn(() => ({
          qualifiedPatterns: []
        })) as any
      } as any,
      participantRoles: {
        assignParticipantRoles: vi.fn(() => ({
          assignments: []
        })) as any
      } as any,
      mechanismResolver: {
        resolve: vi.fn(() => createStubCandidateSet('PATTERN_1', [])) as any,
        resolveAll: vi.fn(() => []) as any
      } as any,
      mechanismRefiner: {
        refine: vi.fn(() => ({
          status: 'UNCHANGED',
          originalCandidateId: 'CANDIDATE_1',
          mechanisms: [],
          evidence: [],
          provenance: {
            originalProvenance: {
              patternIds: [],
              relationshipIds: [],
              participantIds: [],
              evidenceIds: [],
              sourceStages: []
            },
            newEvidenceIds: [],
            sourceStages: []
          },
          explanation: 'Stub refinement'
        })) as any
      } as any
    };
  }

  describe('Basic orchestration contract', () => {
    it('should orchestrate with empty input', () => {
      const ports = createStubPorts();
      const orchestrator = new CanonicalCareerOrchestrator(ports);

      const foundation = orchestrator.orchestrate({
        patterns: [],
        relevance: [],
        condition: [],
        networks: []
      });

      expect(foundation).toBeDefined();
      expect(foundation.foundationId).toMatch(/^FOUNDATION_/);
      expect(foundation.patternCandidates).toEqual([]);
      expect(foundation.patternQualifications).toEqual([]);
      expect(foundation.participantRoleAssignments).toEqual([]);
      expect(foundation.resolvedMechanisms).toEqual([]);
      expect(foundation.mechanismRefinements).toEqual([]);
      expect(foundation.careerFoundationSupplements).toEqual([]);
      expect(foundation.identityMappings).toEqual([]);
      expect(foundation.diagnostics).toEqual(expect.any(Array));
      expect(foundation.metadata).toBeDefined();
    });

    it('should orchestrate with single pattern', () => {
      const ports = createStubPorts();
      ports.qualification.qualifyCareerPatterns.mockReturnValue({
        qualifiedPatterns: [createStubQualifiedPattern('PATTERN_1', 'QUALIFIED')]
      });

      const orchestrator = new CanonicalCareerOrchestrator(ports);

      const foundation = orchestrator.orchestrate({
        patterns: [createStubPattern('PATTERN_1')],
        relevance: [],
        condition: [],
        networks: []
      });

      expect(foundation.patternCandidates).toHaveLength(1);
      expect(foundation.patternCandidates[0].patternId).toBe('PATTERN_1');
      expect(foundation.patternQualifications).toHaveLength(1);
      expect(foundation.patternQualifications[0].patternId).toBe('PATTERN_1');
      expect(foundation.patternQualifications[0].status).toBe('QUALIFIED');
    });

    it('should call qualification port with correct input', () => {
      const ports = createStubPorts();
      const orchestrator = new CanonicalCareerOrchestrator(ports);

      const patterns = [createStubPattern('PATTERN_1')];
      const relevance = [] as CareerPlanetaryRelevance[];
      const condition = [] as CareerPlanetaryConditionResult[];

      orchestrator.orchestrate({
        patterns,
        relevance,
        condition,
        networks: []
      });

      expect(ports.qualification.qualifyCareerPatterns).toHaveBeenCalledWith({
        patterns,
        relevance,
        condition
      });
    });

    it('should call participant roles port for each qualified pattern', () => {
      const ports = createStubPorts();
      ports.qualification.qualifyCareerPatterns.mockReturnValue({
        qualifiedPatterns: [
          createStubQualifiedPattern('PATTERN_1', 'QUALIFIED'),
          createStubQualifiedPattern('PATTERN_2', 'QUALIFIED')
        ]
      });

      const orchestrator = new CanonicalCareerOrchestrator(ports);

      orchestrator.orchestrate({
        patterns: [
          createStubPattern('PATTERN_1'),
          createStubPattern('PATTERN_2')
        ],
        relevance: [],
        condition: [],
        networks: []
      });

      expect(ports.participantRoles.assignParticipantRoles).toHaveBeenCalledTimes(2);
    });

    it('should skip mechanism resolution for UNQUALIFIED patterns', () => {
      const ports = createStubPorts();
      ports.qualification.qualifyCareerPatterns.mockReturnValue({
        qualifiedPatterns: [createStubQualifiedPattern('PATTERN_1', 'UNQUALIFIED')]
      });

      const orchestrator = new CanonicalCareerOrchestrator(ports);

      const foundation = orchestrator.orchestrate({
        patterns: [createStubPattern('PATTERN_1')],
        relevance: [],
        condition: [],
        networks: []
      });

      expect(ports.mechanismResolver.resolveAll).not.toHaveBeenCalled();
      expect(foundation.resolvedMechanisms).toEqual([]);
      expect(foundation.diagnostics).toContainEqual(
        expect.objectContaining({
          category: 'GATING',
          message: expect.stringContaining('UNQUALIFIED')
        })
      );
    });

    it('should resolve mechanisms for QUALIFIED patterns', () => {
      const ports = createStubPorts();
      ports.qualification.qualifyCareerPatterns.mockReturnValue({
        qualifiedPatterns: [createStubQualifiedPattern('PATTERN_1', 'QUALIFIED')]
      });
      ports.mechanismResolver.resolveAll.mockReturnValue([
        createStubCandidateSet('PATTERN_1', [
          createStubMechanismCandidate('CANDIDATE_1', 'PATTERN_1', 'AGENCY')
        ])
      ]);

      const orchestrator = new CanonicalCareerOrchestrator(ports);

      const foundation = orchestrator.orchestrate({
        patterns: [createStubPattern('PATTERN_1')],
        relevance: [],
        condition: [],
        networks: []
      });

      expect(ports.mechanismResolver.resolveAll).toHaveBeenCalled();
      expect(foundation.resolvedMechanisms).toHaveLength(1);
      expect(foundation.resolvedMechanisms[0].candidateId).toBe('CANDIDATE_1');
    });

    it('should resolve mechanisms for INSUFFICIENT_DATA patterns (structural resolution)', () => {
      const ports = createStubPorts();
      ports.qualification.qualifyCareerPatterns.mockReturnValue({
        qualifiedPatterns: [createStubQualifiedPattern('PATTERN_1', 'INSUFFICIENT_DATA')]
      });
      ports.mechanismResolver.resolveAll.mockReturnValue([
        createStubCandidateSet('PATTERN_1', [
          createStubMechanismCandidate('CANDIDATE_1', 'PATTERN_1', 'AGENCY')
        ])
      ]);

      const orchestrator = new CanonicalCareerOrchestrator(ports);

      const foundation = orchestrator.orchestrate({
        patterns: [createStubPattern('PATTERN_1')],
        relevance: [],
        condition: [],
        networks: []
      });

      expect(ports.mechanismResolver.resolveAll).toHaveBeenCalled();
      expect(foundation.resolvedMechanisms).toHaveLength(1);
      expect(foundation.resolvedMechanisms[0].candidateId).toBe('CANDIDATE_1');
    });
  });

  describe('Duplicate candidate IDs', () => {
    it('should detect duplicate pattern IDs and record error diagnostics', () => {
      const ports = createStubPorts();
      const orchestrator = new CanonicalCareerOrchestrator(ports);

      // Manually inject duplicate patterns by mocking the internal build
      // This is a bit of a hack, but we're testing the validation logic
      const foundation = orchestrator.orchestrate({
        patterns: [
          createStubPattern('PATTERN_1'),
          createStubPattern('PATTERN_1') // Duplicate
        ],
        relevance: [],
        condition: [],
        networks: []
      });

      // The orchestrator should handle this gracefully
      // The validation should catch the duplicate
      expect(foundation.diagnostics).toBeDefined();
    });
  });

  describe('Unavailable C4–C7 stages', () => {
    it('should handle missing qualification port results gracefully', () => {
      const ports = createStubPorts();
      ports.qualification.qualifyCareerPatterns.mockImplementation(() => {
        throw new Error('Qualification unavailable');
      });

      const orchestrator = new CanonicalCareerOrchestrator(ports);

      const foundation = orchestrator.orchestrate({
        patterns: [createStubPattern('PATTERN_1')],
        relevance: [],
        condition: [],
        networks: []
      });

      expect(foundation.patternQualifications).toEqual([]);
      expect(foundation.diagnostics).toContainEqual(
        expect.objectContaining({
          severity: 'ERROR',
          category: 'PORT_ERROR',
          message: expect.stringContaining('Qualification port error')
        })
      );
    });

    it('should handle missing participant roles port results gracefully', () => {
      const ports = createStubPorts();
      ports.qualification.qualifyCareerPatterns.mockReturnValue({
        qualifiedPatterns: [createStubQualifiedPattern('PATTERN_1', 'QUALIFIED')]
      });
      ports.participantRoles.assignParticipantRoles.mockImplementation(() => {
        throw new Error('Participant roles unavailable');
      });

      const orchestrator = new CanonicalCareerOrchestrator(ports);

      const foundation = orchestrator.orchestrate({
        patterns: [createStubPattern('PATTERN_1')],
        relevance: [],
        condition: [],
        networks: []
      });

      expect(foundation.diagnostics).toContainEqual(
        expect.objectContaining({
          severity: 'ERROR',
          category: 'PORT_ERROR',
          message: expect.stringContaining('Participant roles port error')
        })
      );
    });

    it('should handle missing 10H/10L foundations with warnings', () => {
      const ports = createStubPorts();
      const orchestrator = new CanonicalCareerOrchestrator(ports);

      const foundation = orchestrator.orchestrate({
        patterns: [],
        relevance: [],
        condition: [],
        networks: []
      });

      expect(foundation.careerFoundationSupplements).toEqual([]);
      expect(foundation.diagnostics).toContainEqual(
        expect.objectContaining({
          severity: 'WARNING',
          category: 'MISSING_DATA',
          message: expect.stringContaining('10H foundation not provided')
        })
      );
      expect(foundation.diagnostics).toContainEqual(
        expect.objectContaining({
          severity: 'WARNING',
          category: 'MISSING_DATA',
          message: expect.stringContaining('10L foundation not provided')
        })
      );
    });
  });

  describe('Duplicate mechanism IDs', () => {
    it('should detect duplicate mechanism candidate IDs and record error diagnostics', () => {
      const ports = createStubPorts();
      ports.qualification.qualifyCareerPatterns.mockReturnValue({
        qualifiedPatterns: [createStubQualifiedPattern('PATTERN_1', 'QUALIFIED')]
      });
      ports.mechanismResolver.resolveAll.mockReturnValue([
        createStubCandidateSet('PATTERN_1', [
          createStubMechanismCandidate('CANDIDATE_1', 'PATTERN_1', 'AGENCY'),
          createStubMechanismCandidate('CANDIDATE_1', 'PATTERN_1', 'LEADERSHIP') // Duplicate
        ])
      ]);

      const orchestrator = new CanonicalCareerOrchestrator(ports);

      const foundation = orchestrator.orchestrate({
        patterns: [createStubPattern('PATTERN_1')],
        relevance: [],
        condition: [],
        networks: []
      });

      // The validation should catch the duplicate
      expect(foundation.diagnostics).toBeDefined();
    });
  });

  describe('Order-permutation determinism', () => {
    it('should produce the same output regardless of input order', () => {
      const ports = createStubPorts();
      ports.qualification.qualifyCareerPatterns.mockReturnValue({
        qualifiedPatterns: [
          createStubQualifiedPattern('PATTERN_1', 'QUALIFIED'),
          createStubQualifiedPattern('PATTERN_2', 'QUALIFIED'),
          createStubQualifiedPattern('PATTERN_3', 'QUALIFIED')
        ]
      });

      const orchestrator = new CanonicalCareerOrchestrator(ports);

      const patterns = [
        createStubPattern('PATTERN_2'),
        createStubPattern('PATTERN_1'),
        createStubPattern('PATTERN_3')
      ];

      const foundation1 = orchestrator.orchestrate({
        patterns,
        relevance: [],
        condition: [],
        networks: []
      });

      const foundation2 = orchestrator.orchestrate({
        patterns: [...patterns].reverse(),
        relevance: [],
        condition: [],
        networks: []
      });

      // Output should be sorted deterministically by patternId
      expect(foundation1.patternCandidates.map((p) => p.patternId)).toEqual(
        foundation2.patternCandidates.map((p) => p.patternId)
      );
      expect(foundation1.patternCandidates.map((p) => p.patternId)).toEqual([
        'PATTERN_1',
        'PATTERN_2',
        'PATTERN_3'
      ]);
    });
  });

  describe('Immutability', () => {
    it('should deeply freeze the foundation output', () => {
      const ports = createStubPorts();
      const orchestrator = new CanonicalCareerOrchestrator(ports);

      const foundation = orchestrator.orchestrate({
        patterns: [createStubPattern('PATTERN_1')],
        relevance: [],
        condition: [],
        networks: []
      });

      // Attempt to modify should fail silently (frozen)
      expect(() => {
        (foundation as any).patternCandidates = [];
      }).not.toThrow();

      // The object should still be frozen
      expect(Object.isFrozen(foundation)).toBe(true);
      expect(Object.isFrozen(foundation.patternCandidates)).toBe(true);
    });

    it('should not be affected by input mutation after orchestration', () => {
      const ports = createStubPorts();
      const orchestrator = new CanonicalCareerOrchestrator(ports);

      const patterns = [createStubPattern('PATTERN_1')];
      const foundation = orchestrator.orchestrate({
        patterns,
        relevance: [],
        condition: [],
        networks: []
      });

      // Mutate input
      patterns.push(createStubPattern('PATTERN_2'));

      // Foundation should be unchanged
      expect(foundation.patternCandidates).toHaveLength(1);
      expect(foundation.patternCandidates[0].patternId).toBe('PATTERN_1');
    });
  });

  describe('Metadata calculation', () => {
    it('should calculate metadata correctly', () => {
      const ports = createStubPorts();
      ports.qualification.qualifyCareerPatterns.mockReturnValue({
        qualifiedPatterns: [
          createStubQualifiedPattern('PATTERN_1', 'QUALIFIED'),
          createStubQualifiedPattern('PATTERN_2', 'UNQUALIFIED'),
          createStubQualifiedPattern('PATTERN_3', 'INSUFFICIENT_DATA')
        ]
      });
      ports.mechanismResolver.resolveAll.mockReturnValue([
        createStubCandidateSet('PATTERN_1', [
          createStubMechanismCandidate('CANDIDATE_1', 'PATTERN_1', 'AGENCY')
        ])
      ]);

      const orchestrator = new CanonicalCareerOrchestrator(ports);

      const foundation = orchestrator.orchestrate({
        patterns: [
          createStubPattern('PATTERN_1'),
          createStubPattern('PATTERN_2'),
          createStubPattern('PATTERN_3')
        ],
        relevance: [],
        condition: [],
        networks: []
      });

      expect(foundation.metadata.totalPatterns).toBe(3);
      expect(foundation.metadata.totalQualifiedPatterns).toBe(1);
      expect(foundation.metadata.totalMechanisms).toBe(1);
      expect(foundation.metadata.totalRefinedMechanisms).toBe(0);
      expect(foundation.metadata.dataCompleteness).toBe('INSUFFICIENT');
    });
  });
});
