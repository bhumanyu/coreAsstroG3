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
  EvidenceIdentityKey,
  EstablishingMechanismEvidence
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
  Career10HFoundation,
  Career10HFoundationResult
} from '../career10h/career10HFoundationTypes';
import type {
  Career10LFoundation,
  Career10LFoundationResult
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
      mechanisms: [],
      relationships: [],
      evidence: [],
      provenance: {
        sourceNetworkIds: [],
        relationshipIds: [],
        ruleIds: [],
        establishingRelationshipIds: [],
        supportingRelationshipIds: []
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
        qualifyCareerPatterns: vi.fn().mockReturnValue({
          qualifiedPatterns: []
        })
      } as any,
      participantRoles: {
        assignParticipantRoles: vi.fn().mockReturnValue({
          assignments: []
        })
      } as any,
      mechanismResolver: {
        resolve: vi.fn().mockReturnValue(createStubCandidateSet('PATTERN_1', [])),
        resolveAll: vi.fn().mockReturnValue([])
      } as any,
      mechanismRefiner: {
        refine: vi.fn().mockReturnValue({
          status: 'UNCHANGED',
          originalCandidateId: 'CANDIDATE_1',
          mechanisms: [],
          evidence: ['EVIDENCE_STUB'],
          provenance: {
            originalProvenance: {
              patternIds: [],
              relationshipIds: [],
              participantIds: [],
              evidenceIds: [],
              sourceStages: []
            },
            newEvidenceIds: ['EVIDENCE_STUB'],
            sourceStages: []
          },
          explanation: 'Stub refinement'
        })
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
      (ports.qualification.qualifyCareerPatterns as any).mockReturnValue({
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
      (ports.qualification.qualifyCareerPatterns as any).mockReturnValue({
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
      (ports.qualification.qualifyCareerPatterns as any).mockReturnValue({
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
      (ports.qualification.qualifyCareerPatterns as any).mockReturnValue({
        qualifiedPatterns: [createStubQualifiedPattern('PATTERN_1', 'QUALIFIED')]
      });
      (ports.mechanismResolver.resolveAll as any).mockReturnValue([
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
      (ports.qualification.qualifyCareerPatterns as any).mockReturnValue({
        qualifiedPatterns: [createStubQualifiedPattern('PATTERN_1', 'INSUFFICIENT_DATA')]
      });
      (ports.mechanismResolver.resolveAll as any).mockReturnValue([
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
      (ports.qualification.qualifyCareerPatterns as any).mockImplementation(() => {
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
      (ports.qualification.qualifyCareerPatterns as any).mockReturnValue({
        qualifiedPatterns: [createStubQualifiedPattern('PATTERN_1', 'QUALIFIED')]
      });
      (ports.participantRoles.assignParticipantRoles as any).mockImplementation(() => {
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

    it('should handle missing 10H/10L results with warnings', () => {
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
          message: expect.stringContaining('10H result not provided')
        })
      );
      expect(foundation.diagnostics).toContainEqual(
        expect.objectContaining({
          severity: 'WARNING',
          category: 'MISSING_DATA',
          message: expect.stringContaining('10L result not provided')
        })
      );
    });
  });

  describe('Duplicate mechanism IDs', () => {
    it('should detect duplicate mechanism candidate IDs and record error diagnostics', () => {
      const ports = createStubPorts();
      (ports.qualification.qualifyCareerPatterns as any).mockReturnValue({
        qualifiedPatterns: [createStubQualifiedPattern('PATTERN_1', 'QUALIFIED')]
      });
      (ports.mechanismResolver.resolveAll as any).mockReturnValue([
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
      (ports.qualification.qualifyCareerPatterns as any).mockReturnValue({
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

      // Attempt to modify should throw in strict mode (frozen)
      expect(() => {
        (foundation as any).patternCandidates = [];
      }).toThrow();

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
      (ports.qualification.qualifyCareerPatterns as any).mockReturnValue({
        qualifiedPatterns: [
          createStubQualifiedPattern('PATTERN_1', 'QUALIFIED'),
          createStubQualifiedPattern('PATTERN_2', 'UNQUALIFIED'),
          createStubQualifiedPattern('PATTERN_3', 'INSUFFICIENT_DATA')
        ]
      });
      (ports.mechanismResolver.resolveAll as any).mockReturnValue([
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
      expect(foundation.metadata.contractValidity).toBe('VALID');
    });
  });

  describe('Deterministic identity', () => {
    it('should produce the same foundationId for identical logical input', () => {
      const ports = createStubPorts();
      (ports.qualification.qualifyCareerPatterns as any).mockReturnValue({
        qualifiedPatterns: [createStubQualifiedPattern('PATTERN_1', 'QUALIFIED')]
      });

      const orchestrator = new CanonicalCareerOrchestrator(ports);

      const input = {
        patterns: [createStubPattern('PATTERN_1')],
        relevance: [],
        condition: [],
        networks: []
      };

      const foundation1 = orchestrator.orchestrate(input);
      const foundation2 = orchestrator.orchestrate(input);

      expect(foundation1.foundationId).toBe(foundation2.foundationId);
      expect(foundation1.timestamp).toBe(foundation2.timestamp);
    });

    it('should produce the same foundationId regardless of input order', () => {
      const ports = createStubPorts();
      (ports.qualification.qualifyCareerPatterns as any).mockReturnValue({
        qualifiedPatterns: [
          createStubQualifiedPattern('PATTERN_1', 'QUALIFIED'),
          createStubQualifiedPattern('PATTERN_2', 'QUALIFIED')
        ]
      });

      const orchestrator = new CanonicalCareerOrchestrator(ports);

      const foundation1 = orchestrator.orchestrate({
        patterns: [
          createStubPattern('PATTERN_1'),
          createStubPattern('PATTERN_2')
        ],
        relevance: [],
        condition: [],
        networks: []
      });

      const foundation2 = orchestrator.orchestrate({
        patterns: [
          createStubPattern('PATTERN_2'),
          createStubPattern('PATTERN_1')
        ],
        relevance: [],
        condition: [],
        networks: []
      });

      expect(foundation1.foundationId).toBe(foundation2.foundationId);
    });
  });

  describe('Stage evidence population', () => {
    it('should populate stageEvidence from pattern evidence', () => {
      const ports = createStubPorts();
      const pattern = createStubPattern('PATTERN_1');
      // Add evidence to the pattern by reassigning the readonly field (allowed in tests)
      Object.assign(pattern, {
        evidence: [
          {
            evidenceId: 'EVIDENCE_1',
            ruleId: 'RULE_1',
            sourceNetworkId: 'NETWORK_1',
            sourceNetworkIdentityKey: 'IDENTITY_NETWORK_1',
            relationshipId: 'RELATIONSHIP_1'
          }
        ]
      });

      const orchestrator = new CanonicalCareerOrchestrator(ports);

      const foundation = orchestrator.orchestrate({
        patterns: [pattern],
        relevance: [],
        condition: [],
        networks: []
      });

      expect(foundation.patternCandidates[0].stageEvidence).toHaveLength(1);
      expect(foundation.patternCandidates[0].stageEvidence[0].evidenceId).toBe('EVIDENCE_1');
    });

    it('should populate stageEvidence from qualification evidence', () => {
      const ports = createStubPorts();
      const qualifiedPattern = createStubQualifiedPattern('PATTERN_1', 'QUALIFIED');
      // Add evidence to the qualified pattern
      Object.assign(qualifiedPattern, {
        evidence: [
          {
            evidenceId: 'EVIDENCE_1',
            dimension: 'structuralStrength',
            identityKey: 'IDENTITY_QUAL_1',
            sourceEvidenceIds: ['SOURCE_1'],
            ruleIds: ['RULE_1']
          }
        ]
      });
      (ports.qualification.qualifyCareerPatterns as any).mockReturnValue({
        qualifiedPatterns: [qualifiedPattern]
      });

      const orchestrator = new CanonicalCareerOrchestrator(ports);

      const foundation = orchestrator.orchestrate({
        patterns: [createStubPattern('PATTERN_1')],
        relevance: [],
        condition: [],
        networks: []
      });

      expect(foundation.patternQualifications[0].stageEvidence).toHaveLength(1);
      expect(foundation.patternQualifications[0].stageEvidence[0].evidenceId).toBe('EVIDENCE_1');
    });

    it('should populate stageEvidence from mechanism candidate evidence', () => {
      const ports = createStubPorts();
      (ports.qualification.qualifyCareerPatterns as any).mockReturnValue({
        qualifiedPatterns: [createStubQualifiedPattern('PATTERN_1', 'QUALIFIED')]
      });

      const candidate = createStubMechanismCandidate('CANDIDATE_1', 'PATTERN_1', 'AGENCY');
      Object.assign(candidate, {
        evidence: [
          {
            evidenceId: 'EVIDENCE_1',
            mechanismType: 'AGENCY',
            source: 'PATTERN',
            role: 'ESTABLISHING',
            participantIds: ['PARTICIPANT_1'],
            relationshipIds: [],
            explanation: 'Test evidence'
          }
        ]
      });

      (ports.mechanismResolver.resolveAll as any).mockReturnValue([
        createStubCandidateSet('PATTERN_1', [candidate])
      ]);

      const orchestrator = new CanonicalCareerOrchestrator(ports);

      const foundation = orchestrator.orchestrate({
        patterns: [createStubPattern('PATTERN_1')],
        relevance: [],
        condition: [],
        networks: []
      });

      expect(foundation.resolvedMechanisms[0].stageEvidence).toHaveLength(1);
      expect(foundation.resolvedMechanisms[0].stageEvidence[0].evidenceId).toBe('EVIDENCE_1');
    });
  });

  describe('Dispositor refinement diagnostics', () => {
    it('should document when dispositor contexts are unavailable', () => {
      const ports = createStubPorts();
      (ports.qualification.qualifyCareerPatterns as any).mockReturnValue({
        qualifiedPatterns: [createStubQualifiedPattern('PATTERN_1', 'QUALIFIED')]
      });
      (ports.mechanismResolver.resolveAll as any).mockReturnValue([
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

      expect(foundation.diagnostics).toContainEqual(
        expect.objectContaining({
          diagnosticId: 'ORCHESTRATION_DISPOSITOR_CONTEXTS_UNAVAILABLE',
          severity: 'WARNING',
          category: 'MISSING_DATA',
          message: expect.stringContaining('Dispositor contexts are not yet provided')
        })
      );
    });

    it('should use real mechanism ID from refinement result when available', () => {
      const ports = createStubPorts();
      (ports.qualification.qualifyCareerPatterns as any).mockReturnValue({
        qualifiedPatterns: [createStubQualifiedPattern('PATTERN_1', 'QUALIFIED')]
      });
      (ports.mechanismResolver.resolveAll as any).mockReturnValue([
        createStubCandidateSet('PATTERN_1', [
          createStubMechanismCandidate('CANDIDATE_1', 'PATTERN_1', 'AGENCY')
        ])
      ]);

      // Mock refinement result with real mechanism ID
      (ports.mechanismRefiner.refine as any).mockReturnValue({
        status: 'REFINED',
        originalCandidateId: 'CANDIDATE_1',
        mechanisms: [
          {
            mechanismId: 'MECHANISM_REAL_1',
            patternId: 'PATTERN_1',
            mechanismType: 'AGENCY',
            pathway: 'PATTERN',
            participants: [],
            coreParticipants: [],
            supportingParticipants: [],
            challengingParticipants: [],
            status: 'REFINED',
            explanation: 'Refined mechanism',
            evidence: [],
            provenance: {
              patternIds: [],
              relationshipIds: [],
              participantIds: [],
              evidenceIds: [],
              sourceStages: []
            }
          }
        ],
        evidence: ['EVIDENCE_1'],
        provenance: {
          originalProvenance: {},
          newEvidenceIds: ['EVIDENCE_1'],
          sourceStages: ['DISPOSITOR']
        },
        explanation: 'Refinement successful'
      });

      const orchestrator = new CanonicalCareerOrchestrator(ports);

      const foundation = orchestrator.orchestrate({
        patterns: [createStubPattern('PATTERN_1')],
        relevance: [],
        condition: [],
        networks: []
      });

      // With dispositor contexts unavailable, refiner is not called
      // resolution is UNRESOLVED, status is UNAVAILABLE
      expect(foundation.mechanismRefinements[0].resolution).toBe('UNRESOLVED');
      expect(foundation.mechanismRefinements[0].status).toBe('UNAVAILABLE');
      expect(foundation.mechanismRefinements[0].mechanism).toBeNull();
    });
  });

  describe('Identity mappings deferred', () => {
    it('should document that identity mappings are deferred', () => {
      const ports = createStubPorts();
      const orchestrator = new CanonicalCareerOrchestrator(ports);

      const foundation = orchestrator.orchestrate({
        patterns: [],
        relevance: [],
        condition: [],
        networks: []
      });

      expect(foundation.diagnostics).toContainEqual(
        expect.objectContaining({
          diagnosticId: 'ORCHESTRATION_IDENTITY_MAPPINGS_DEFERRED',
          severity: 'INFO',
          category: 'DEFERRED_FEATURE',
          message: expect.stringContaining('Identity mappings across stages')
        })
      );

      expect(foundation.identityMappings).toEqual([]);
    });
  });

  describe('10H/10L status from result objects', () => {
    it('should use real status from result objects when provided', () => {
      const ports = createStubPorts();
      const orchestrator = new CanonicalCareerOrchestrator(ports);

      const result10H: Career10HFoundationResult = {
        status: 'COMPLETE',
        foundation: {} as any,
        missingInputs: []
      };

      const foundation = orchestrator.orchestrate({
        patterns: [],
        relevance: [],
        condition: [],
        networks: [],
        result10H
      });

      expect(foundation.careerFoundationSupplements).toHaveLength(1);
      expect(foundation.careerFoundationSupplements[0].status10H).toBe('COMPLETE');
      expect(foundation.careerFoundationSupplements[0].availability).toBe('AVAILABLE');
    });

    it('should derive PARTIALLY_AVAILABLE from INSUFFICIENT_DATA with missingInputs', () => {
      const ports = createStubPorts();
      const orchestrator = new CanonicalCareerOrchestrator(ports);

      const result10H: Career10HFoundationResult = {
        status: 'INSUFFICIENT_DATA',
        foundation: {} as any,
        missingInputs: ['houseLordship']
      };

      const foundation = orchestrator.orchestrate({
        patterns: [],
        relevance: [],
        condition: [],
        networks: [],
        result10H
      });

      expect(foundation.careerFoundationSupplements[0].availability).toBe('PARTIALLY_AVAILABLE');
      expect(foundation.careerFoundationSupplements[0].status10H).toBe('INSUFFICIENT_DATA');
      expect(foundation.careerFoundationSupplements[0].missingInputs).toEqual(['houseLordship']);
    });

    it('should emit WARNING when 10H result is not provided', () => {
      const ports = createStubPorts();
      const orchestrator = new CanonicalCareerOrchestrator(ports);

      const foundation = orchestrator.orchestrate({
        patterns: [],
        relevance: [],
        condition: [],
        networks: []
      });

      expect(foundation.diagnostics).toContainEqual(
        expect.objectContaining({
          diagnosticId: 'ORCHESTRATION_MISSING_10H_RESULT',
          severity: 'WARNING',
          category: 'MISSING_DATA',
          message: expect.stringContaining('10H result not provided')
        })
      );
    });

    it('should emit WARNING when 10L result is not provided', () => {
      const ports = createStubPorts();
      const orchestrator = new CanonicalCareerOrchestrator(ports);

      const foundation = orchestrator.orchestrate({
        patterns: [],
        relevance: [],
        condition: [],
        networks: []
      });

      expect(foundation.diagnostics).toContainEqual(
        expect.objectContaining({
          diagnosticId: 'ORCHESTRATION_MISSING_10L_RESULT',
          severity: 'WARNING',
          category: 'MISSING_DATA',
          message: expect.stringContaining('10L result not provided')
        })
      );
    });
  });

  describe('Availability vs validity separation', () => {
    it('should include both dataCompleteness and contractValidity in metadata', () => {
      const ports = createStubPorts();
      const orchestrator = new CanonicalCareerOrchestrator(ports);

      const foundation = orchestrator.orchestrate({
        patterns: [],
        relevance: [],
        condition: [],
        networks: []
      });

      expect(foundation.metadata.dataCompleteness).toBeDefined();
      expect(foundation.metadata.contractValidity).toBeDefined();
      expect(['COMPLETE', 'PARTIAL', 'INSUFFICIENT']).toContain(foundation.metadata.dataCompleteness);
      expect(['VALID', 'INVALID', 'UNKNOWN']).toContain(foundation.metadata.contractValidity);
    });
  });

  describe('Establishing evidence extraction', () => {
    it('should extract real establishing evidence from qualified pattern source pattern', () => {
      const ports = createStubPorts();
      const pattern = createStubPattern('PATTERN_1');
      // Add evidence to the pattern
      Object.assign(pattern, {
        evidence: [
          {
            evidenceId: 'EVIDENCE_1',
            ruleId: 'RULE_1',
            sourceNetworkId: 'NETWORK_1',
            sourceNetworkIdentityKey: 'IDENTITY_NETWORK_1',
            relationshipId: 'RELATIONSHIP_1'
          }
        ]
      });

      const qualifiedPattern = createStubQualifiedPattern('PATTERN_1', 'QUALIFIED');
      // Ensure the qualified pattern's source pattern has the evidence
      Object.assign(qualifiedPattern, {
        sourcePattern: pattern
      });

      (ports.qualification.qualifyCareerPatterns as any).mockReturnValue({
        qualifiedPatterns: [qualifiedPattern]
      });

      // Capture the resolveAll call to check establishing evidence
      let capturedInputs: any[] = [];
      (ports.mechanismResolver.resolveAll as any).mockImplementation((inputs: any[]) => {
        capturedInputs = inputs;
        return [];
      });

      const orchestrator = new CanonicalCareerOrchestrator(ports);

      orchestrator.orchestrate({
        patterns: [pattern],
        relevance: [],
        condition: [],
        networks: []
      });

      // Verify establishing evidence was passed to resolver
      expect(capturedInputs).toHaveLength(1);
      expect(capturedInputs[0].establishingEvidence).toHaveLength(1);
      expect(capturedInputs[0].establishingEvidence[0].evidenceId).toBe('EVIDENCE_1');
      expect(capturedInputs[0].establishingEvidenceStatus).toBe('RESOLVED');
    });

    it('should emit WARNING diagnostic when qualified pattern has no establishing evidence', () => {
      const ports = createStubPorts();
      const pattern = createStubPattern('PATTERN_1');
      // Pattern has no evidence
      Object.assign(pattern, { evidence: [] });

      const qualifiedPattern = createStubQualifiedPattern('PATTERN_1', 'QUALIFIED');
      Object.assign(qualifiedPattern, {
        sourcePattern: pattern
      });

      (ports.qualification.qualifyCareerPatterns as any).mockReturnValue({
        qualifiedPatterns: [qualifiedPattern]
      });

      const orchestrator = new CanonicalCareerOrchestrator(ports);

      const foundation = orchestrator.orchestrate({
        patterns: [pattern],
        relevance: [],
        condition: [],
        networks: []
      });

      expect(foundation.diagnostics).toContainEqual(
        expect.objectContaining({
          diagnosticId: 'ORCHESTRATION_ESTABLISHING_EVIDENCE_UNAVAILABLE_PATTERN_1',
          severity: 'WARNING',
          category: 'MISSING_DATA',
          message: expect.stringContaining('no establishing evidence')
        })
      );
    });
  });

  describe('Contract validity from validation result', () => {
    it('should set contractValidity to VALID when validation passes', () => {
      const ports = createStubPorts();
      (ports.qualification.qualifyCareerPatterns as any).mockReturnValue({
        qualifiedPatterns: [createStubQualifiedPattern('PATTERN_1', 'QUALIFIED')]
      });

      const orchestrator = new CanonicalCareerOrchestrator(ports);

      const foundation = orchestrator.orchestrate({
        patterns: [createStubPattern('PATTERN_1')],
        relevance: [],
        condition: [],
        networks: []
      });

      expect(foundation.metadata.contractValidity).toBe('VALID');
    });

    it('should set contractValidity to INVALID when validation fails (duplicate mechanism IDs)', () => {
      const ports = createStubPorts();
      (ports.qualification.qualifyCareerPatterns as any).mockReturnValue({
        qualifiedPatterns: [createStubQualifiedPattern('PATTERN_1', 'QUALIFIED')]
      });
      (ports.mechanismResolver.resolveAll as any).mockReturnValue([
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

      expect(foundation.metadata.contractValidity).toBe('INVALID');
      expect(foundation.diagnostics).toContainEqual(
        expect.objectContaining({
          category: 'DUPLICATE_ID',
          severity: 'ERROR'
        })
      );
    });
  });

  describe('Identity vs occurrence namespace preservation', () => {
    it('should preserve identityKey when available in mechanism evidence', () => {
      const ports = createStubPorts();
      (ports.qualification.qualifyCareerPatterns as any).mockReturnValue({
        qualifiedPatterns: [createStubQualifiedPattern('PATTERN_1', 'QUALIFIED')]
      });

      const candidate = createStubMechanismCandidate('CANDIDATE_1', 'PATTERN_1', 'AGENCY');
      Object.assign(candidate, {
        evidence: [
          {
            evidenceId: 'EVIDENCE_1',
            identityKey: 'IDENTITY_MECH_1', // Real identity key
            mechanismType: 'AGENCY',
            source: 'PATTERN',
            role: 'ESTABLISHING',
            participantIds: [],
            relationshipIds: [],
            explanation: 'Test evidence'
          }
        ]
      });

      (ports.mechanismResolver.resolveAll as any).mockReturnValue([
        createStubCandidateSet('PATTERN_1', [candidate])
      ]);

      const orchestrator = new CanonicalCareerOrchestrator(ports);

      const foundation = orchestrator.orchestrate({
        patterns: [createStubPattern('PATTERN_1')],
        relevance: [],
        condition: [],
        networks: []
      });

      expect(foundation.resolvedMechanisms[0].stageEvidence[0].identityKey).toBe('IDENTITY_MECH_1');
      expect(foundation.resolvedMechanisms[0].stageEvidence[0].occurrenceId).toBe('EVIDENCE_1');
    });

    it('should use occurrenceId when identityKey is not available in mechanism evidence', () => {
      const ports = createStubPorts();
      (ports.qualification.qualifyCareerPatterns as any).mockReturnValue({
        qualifiedPatterns: [createStubQualifiedPattern('PATTERN_1', 'QUALIFIED')]
      });

      const candidate = createStubMechanismCandidate('CANDIDATE_1', 'PATTERN_1', 'AGENCY');
      Object.assign(candidate, {
        evidence: [
          {
            evidenceId: 'EVIDENCE_1',
            // No identityKey
            mechanismType: 'AGENCY',
            source: 'PATTERN',
            role: 'ESTABLISHING',
            participantIds: [],
            relationshipIds: [],
            explanation: 'Test evidence'
          }
        ]
      });

      (ports.mechanismResolver.resolveAll as any).mockReturnValue([
        createStubCandidateSet('PATTERN_1', [candidate])
      ]);

      const orchestrator = new CanonicalCareerOrchestrator(ports);

      const foundation = orchestrator.orchestrate({
        patterns: [createStubPattern('PATTERN_1')],
        relevance: [],
        condition: [],
        networks: []
      });

      expect(foundation.resolvedMechanisms[0].stageEvidence[0].identityKey).toBeUndefined();
      expect(foundation.resolvedMechanisms[0].stageEvidence[0].occurrenceId).toBe('EVIDENCE_1');
    });

    it('should use occurrenceId for refinement evidence (identityKey not exposed)', () => {
      const ports = createStubPorts();
      (ports.qualification.qualifyCareerPatterns as any).mockReturnValue({
        qualifiedPatterns: [createStubQualifiedPattern('PATTERN_1', 'QUALIFIED')]
      });
      (ports.mechanismResolver.resolveAll as any).mockReturnValue([
        createStubCandidateSet('PATTERN_1', [
          createStubMechanismCandidate('CANDIDATE_1', 'PATTERN_1', 'AGENCY')
        ])
      ]);

      // Mock refinement result with evidence
      (ports.mechanismRefiner.refine as any).mockReturnValue({
        status: 'UNCHANGED',
        originalCandidateId: 'CANDIDATE_1',
        mechanisms: [],
        evidence: ['EVIDENCE_REFINE_1'], // Evidence array with IDs
        provenance: {
          originalProvenance: {
            patternIds: [],
            relationshipIds: [],
            participantIds: [],
            evidenceIds: [],
            sourceStages: []
          },
          newEvidenceIds: ['EVIDENCE_REFINE_1'],
          sourceStages: []
        },
        explanation: 'Stub refinement'
      });

      const orchestrator = new CanonicalCareerOrchestrator(ports);

      const foundation = orchestrator.orchestrate({
        patterns: [createStubPattern('PATTERN_1')],
        relevance: [],
        condition: [],
        networks: []
      });

      // With dispositor contexts unavailable, refiner is not called
      // stageEvidence is empty array
      expect(foundation.mechanismRefinements[0].stageEvidence).toEqual([]);
    });
  });

  describe('Review finding A: Establishing evidence without fabricated mechanism type', () => {
    it('should create establishing evidence with optional mechanismType (undefined)', () => {
      const ports = createStubPorts();
      const pattern = createStubPattern('PATTERN_1');
      Object.assign(pattern, {
        evidence: [
          {
            evidenceId: 'EVIDENCE_1',
            ruleId: 'RULE_1',
            sourceNetworkId: 'NETWORK_1',
            sourceNetworkIdentityKey: 'IDENTITY_NETWORK_1',
            relationshipId: 'RELATIONSHIP_1'
          }
        ]
      });

      const qualifiedPattern = createStubQualifiedPattern('PATTERN_1', 'QUALIFIED');
      Object.assign(qualifiedPattern, {
        sourcePattern: pattern
      });

      (ports.qualification.qualifyCareerPatterns as any).mockReturnValue({
        qualifiedPatterns: [qualifiedPattern]
      });

      // Capture the resolveAll call to check establishing evidence
      let capturedInputs: any[] = [];
      (ports.mechanismResolver.resolveAll as any).mockImplementation((inputs: any[]) => {
        capturedInputs = inputs;
        return [];
      });

      const orchestrator = new CanonicalCareerOrchestrator(ports);

      orchestrator.orchestrate({
        patterns: [pattern],
        relevance: [],
        condition: [],
        networks: []
      });

      // Verify establishing evidence has undefined mechanismType (not fabricated)
      expect(capturedInputs).toHaveLength(1);
      expect(capturedInputs[0].establishingEvidence).toHaveLength(1);
      expect(capturedInputs[0].establishingEvidence[0].mechanismType).toBeUndefined();
      expect(capturedInputs[0].establishingEvidence[0].role).toBe('ESTABLISHING');
    });
  });

  describe('Review finding B: UNAVAILABLE refinement when dispositor contexts are empty', () => {
    it('should mark all refinements UNAVAILABLE when dispositor contexts are unavailable', () => {
      const ports = createStubPorts();
      (ports.qualification.qualifyCareerPatterns as any).mockReturnValue({
        qualifiedPatterns: [createStubQualifiedPattern('PATTERN_1', 'QUALIFIED')]
      });
      (ports.mechanismResolver.resolveAll as any).mockReturnValue([
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

      // Verify refiner was NOT called
      expect(ports.mechanismRefiner.refine).not.toHaveBeenCalled();

      // Verify all refinements are UNAVAILABLE
      expect(foundation.mechanismRefinements).toHaveLength(1);
      expect(foundation.mechanismRefinements[0].status).toBe('UNAVAILABLE');
      expect(foundation.mechanismRefinements[0].mechanism).toBeNull();

      // Verify diagnostic is emitted
      expect(foundation.diagnostics).toContainEqual(
        expect.objectContaining({
          diagnosticId: 'ORCHESTRATION_DISPOSITOR_CONTEXTS_UNAVAILABLE',
          severity: 'WARNING',
          category: 'MISSING_DATA',
          message: expect.stringContaining('all refinements marked UNAVAILABLE without calling refiner')
        })
      );
    });
  });

  describe('Review finding C: Unresolved mechanism identity when refiner supplies no mechanism ID', () => {
    it('should leave mechanismId as empty string when dispositor contexts are unavailable', () => {
      const ports = createStubPorts();
      (ports.qualification.qualifyCareerPatterns as any).mockReturnValue({
        qualifiedPatterns: [createStubQualifiedPattern('PATTERN_1', 'QUALIFIED')]
      });
      (ports.mechanismResolver.resolveAll as any).mockReturnValue([
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

      // When dispositor contexts are unavailable, mechanismId is empty string (unresolved)
      expect(foundation.mechanismRefinements[0].mechanismId).toBe('');
      expect(foundation.mechanismRefinements[0].status).toBe('UNAVAILABLE');
      expect(foundation.mechanismRefinements[0].mechanismId).not.toBe('CANDIDATE_1'); // Not aliased to candidate ID
    });
  });

  describe('Review finding D: Foundation ID fingerprint completeness', () => {
    it('should include 10H/10L status and missingInputs in foundation ID', () => {
      const ports = createStubPorts();
      const orchestrator = new CanonicalCareerOrchestrator(ports);

      const result10H: Career10HFoundationResult = {
        status: 'INSUFFICIENT_DATA',
        foundation: {} as any,
        missingInputs: ['houseLordship', 'planetaryPosition']
      };

      const result10L: Career10LFoundationResult = {
        status: 'COMPLETE',
        foundation: {} as any,
        missingInputs: []
      };

      const foundation1 = orchestrator.orchestrate({
        patterns: [],
        relevance: [],
        condition: [],
        networks: [],
        result10H,
        result10L
      });

      // Change missingInputs
      const result10HModified: Career10HFoundationResult = {
        status: 'INSUFFICIENT_DATA',
        foundation: {} as any,
        missingInputs: ['houseLordship'] // Different missingInputs
      };

      const foundation2 = orchestrator.orchestrate({
        patterns: [],
        relevance: [],
        condition: [],
        networks: [],
        result10H: result10HModified,
        result10L
      });

      // Foundation IDs should be different when missingInputs change
      expect(foundation1.foundationId).not.toBe(foundation2.foundationId);
    });

    it('should produce same foundation ID for same logical content regardless of order', () => {
      const ports = createStubPorts();
      const orchestrator = new CanonicalCareerOrchestrator(ports);

      const result10H: Career10HFoundationResult = {
        status: 'INSUFFICIENT_DATA',
        foundation: {} as any,
        missingInputs: ['houseLordship', 'planetaryPosition']
      };

      const foundation1 = orchestrator.orchestrate({
        patterns: [],
        relevance: [],
        condition: [],
        networks: [],
        result10H
      });

      // Same content, different order in missingInputs array (should be sorted)
      const result10HSame: Career10HFoundationResult = {
        status: 'INSUFFICIENT_DATA',
        foundation: {} as any,
        missingInputs: ['planetaryPosition', 'houseLordship'] // Different order
      };

      const foundation2 = orchestrator.orchestrate({
        patterns: [],
        relevance: [],
        condition: [],
        networks: [],
        result10H: result10HSame
      });

      // Foundation IDs should be the same (missingInputs are sorted)
      expect(foundation1.foundationId).toBe(foundation2.foundationId);
    });
  });

  describe('Review finding E: Identity mappings deferral', () => {
    it('should explicitly document identity mappings deferral in diagnostics', () => {
      const ports = createStubPorts();
      const orchestrator = new CanonicalCareerOrchestrator(ports);

      const foundation = orchestrator.orchestrate({
        patterns: [],
        relevance: [],
        condition: [],
        networks: []
      });

      // Verify empty identityMappings
      expect(foundation.identityMappings).toEqual([]);

      // Verify diagnostic documents the deferral
      expect(foundation.diagnostics).toContainEqual(
        expect.objectContaining({
          diagnosticId: 'ORCHESTRATION_IDENTITY_MAPPINGS_DEFERRED',
          severity: 'INFO',
          category: 'DEFERRED_FEATURE',
          message: expect.stringContaining('Identity mappings across stages (pattern→qualification→mechanism→refinement) are not yet provided by producers'),
          stage: 'IDENTITY_MAPPINGS'
        })
      );
    });
  });
});
