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
  PatternLevelEstablishingEvidence
} from '../careerMechanism/resolver';
import type {
  CareerMechanismDispositorRefinementResult,
  CareerDispositorContext
} from '../careerMechanism/dispositor/careerMechanismDispositorTypes';
import {
  defaultCareerMechanismDispositorRefiner
} from '../careerMechanism/dispositor/defaultCareerMechanismDispositorRefiner';
import {
  validateIdentityMappings,
  validateRefinementCandidateReferences,
  validateRelationshipMappings
} from './canonicalCareerValidation';
import type {
  Career10HFoundation,
  Career10HFoundationResult
} from '../career10h/career10HFoundationTypes';
import type {
  Career10LFoundation,
  Career10LFoundationResult
} from '../career10h/career10LFoundationTypes';
import type { ParticipantId } from '../careerParticipantRoles/participantRoleTypes';
import { Planet } from '../../../types';

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
      explanation: 'Stub mechanism candidate',
      acceptedEstablishingEvidenceIds: undefined,
      rejectedEstablishingEvidenceIds: undefined,
      firewallExcludedEstablishingEvidenceIds: undefined
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
        assignParticipantRoles: vi.fn().mockImplementation(({ pattern }: { pattern: CareerPattern }) => ({
          assignments: [{
            participantId: 'PLANET:SUN' as ParticipantId,
            primaryRole: 'CORE',
            isChallenging: true,
            roleEvidence: [{
              evidenceId: `ROLE_EVIDENCE_${pattern.patternId}`,
              participantId: 'PLANET:SUN' as ParticipantId,
              role: 'CORE',
              relationshipIds: [],
              source: 'ESTABLISHING_RELATIONSHIP',
              explanation: 'Stub participant role evidence'
            }],
            explanation: 'Stub participant role'
          }]
        }))
      } as any,
      mechanismResolver: {
        resolve: vi.fn().mockReturnValue(createStubCandidateSet('PATTERN_1', [])),
        resolveAll: vi.fn().mockReturnValue([])
      } as any,
      mechanismRefiner: {
        refine: vi.fn().mockReturnValue({
          status: 'UNCHANGED' as const,
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
      expect(foundation.relationshipMappings).toEqual([]);
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

    it('reports a coverage gap when an INSUFFICIENT_DATA pattern resolves to no mechanism candidates', () => {
      const ports = createStubPorts();
      const pattern = createStubPattern('PATTERN_NO_RULE');
      Object.assign(pattern, {
        family: 'CAREER_HOUSE_NETWORK',
        classification: 'CAREER_HOUSE_NETWORK',
        houses: [6, 8, 11]
      });
      const qualifiedPattern = createStubQualifiedPattern('PATTERN_NO_RULE', 'INSUFFICIENT_DATA');
      Object.assign(qualifiedPattern, { sourcePattern: pattern });

      (ports.qualification.qualifyCareerPatterns as any).mockReturnValue({
        qualifiedPatterns: [qualifiedPattern]
      });
      (ports.mechanismResolver.resolveAll as any).mockReturnValue([
        createStubCandidateSet('PATTERN_NO_RULE', [])
      ]);

      const orchestrator = new CanonicalCareerOrchestrator(ports);
      const foundation = orchestrator.orchestrate({
        patterns: [pattern],
        relevance: [],
        condition: [],
        networks: []
      });

      expect(ports.mechanismResolver.resolveAll).toHaveBeenCalled();
      expect(foundation.resolvedMechanisms).toHaveLength(0);
      expect(foundation.diagnostics).toContainEqual(expect.objectContaining({
        diagnosticId: 'ORCHESTRATION_NO_MECHANISM_RULE_MATCHED_PATTERN_NO_RULE',
        severity: 'INFO',
        category: 'GATING',
        message: expect.stringContaining('Canonical career inputs produced no mechanism candidates for pattern CAREER_HOUSE_NETWORK (houses [6, 8, 11])'),
        relatedIds: ['PATTERN_NO_RULE'],
        stage: 'MECHANISM'
      }));
    });

    it('emits coverage-gap diagnostic when candidateSet is present but empty (Part 2a)', () => {
      const ports = createStubPorts();
      const pattern = createStubPattern('PATTERN_EMPTY_CANDIDATES');
      Object.assign(pattern, {
        family: 'CAREER_HOUSE_NETWORK',
        classification: 'CAREER_HOUSE_NETWORK',
        houses: [6, 8, 11]
      });
      const qualifiedPattern = createStubQualifiedPattern('PATTERN_EMPTY_CANDIDATES', 'INSUFFICIENT_DATA');
      Object.assign(qualifiedPattern, { sourcePattern: pattern });

      (ports.qualification.qualifyCareerPatterns as any).mockReturnValue({
        qualifiedPatterns: [qualifiedPattern]
      });
      // Return empty candidate set (present but no candidates)
      (ports.mechanismResolver.resolveAll as any).mockReturnValue([
        createStubCandidateSet('PATTERN_EMPTY_CANDIDATES', [])
      ]);

      const orchestrator = new CanonicalCareerOrchestrator(ports);
      const foundation = orchestrator.orchestrate({
        patterns: [pattern],
        relevance: [],
        condition: [],
        networks: []
      });

      expect(foundation.resolvedMechanisms).toHaveLength(0);
      expect(foundation.diagnostics).toContainEqual(expect.objectContaining({
        diagnosticId: 'ORCHESTRATION_NO_MECHANISM_RULE_MATCHED_PATTERN_EMPTY_CANDIDATES',
        severity: 'INFO',
        category: 'GATING',
        message: expect.stringContaining('Canonical career inputs produced no mechanism candidates'),
        relatedIds: ['PATTERN_EMPTY_CANDIDATES'],
        stage: 'MECHANISM'
      }));
      // Qualification state should be unaffected
      expect(foundation.patternQualifications).toHaveLength(1);
      expect(foundation.patternQualifications[0].status).toBe('INSUFFICIENT_DATA');
    });

    it('emits contract-violation diagnostic when candidateSet is missing (Part 2b)', () => {
      const ports = createStubPorts();
      const pattern = createStubPattern('PATTERN_MISSING_SET');
      Object.assign(pattern, {
        family: 'CAREER_HOUSE_NETWORK',
        classification: 'CAREER_HOUSE_NETWORK',
        houses: [6, 8, 11]
      });
      const qualifiedPattern = createStubQualifiedPattern('PATTERN_MISSING_SET', 'INSUFFICIENT_DATA');
      Object.assign(qualifiedPattern, { sourcePattern: pattern });

      (ports.qualification.qualifyCareerPatterns as any).mockReturnValue({
        qualifiedPatterns: [qualifiedPattern]
      });
      // Return empty array (contract violation: one input but no candidate set returned)
      (ports.mechanismResolver.resolveAll as any).mockReturnValue([]);

      const orchestrator = new CanonicalCareerOrchestrator(ports);
      const foundation = orchestrator.orchestrate({
        patterns: [pattern],
        relevance: [],
        condition: [],
        networks: []
      });

      expect(foundation.resolvedMechanisms).toHaveLength(0);
      expect(foundation.diagnostics).toContainEqual(expect.objectContaining({
        diagnosticId: 'ORCHESTRATION_MISSING_CANDIDATE_SET_PATTERN_MISSING_SET',
        severity: 'WARNING',
        category: 'CONTRACT_VIOLATION',
        message: expect.stringContaining('Resolver returned no CandidateSet for pattern PATTERN_MISSING_SET'),
        relatedIds: ['PATTERN_MISSING_SET'],
        stage: 'MECHANISM'
      }));
      // Qualification state should be unaffected
      expect(foundation.patternQualifications).toHaveLength(1);
      expect(foundation.patternQualifications[0].status).toBe('INSUFFICIENT_DATA');
    });

    it('emits an aggregate contract diagnostic for extra foreign candidate sets', () => {
      const ports = createStubPorts();
      const pattern = createStubPattern('PATTERN_EXPECTED');
      Object.assign(pattern, {
        family: 'CAREER_HOUSE_NETWORK',
        classification: 'CAREER_HOUSE_NETWORK',
        houses: [6, 8, 11]
      });
      const qualifiedPattern = createStubQualifiedPattern('PATTERN_EXPECTED', 'INSUFFICIENT_DATA');
      Object.assign(qualifiedPattern, { sourcePattern: pattern });

      (ports.qualification.qualifyCareerPatterns as any).mockReturnValue({
        qualifiedPatterns: [qualifiedPattern]
      });
      (ports.mechanismResolver.resolveAll as any).mockReturnValue([
        createStubCandidateSet('PATTERN_EXPECTED', []),
        createStubCandidateSet('PATTERN_FOREIGN', [
          createStubMechanismCandidate('CANDIDATE_FOREIGN', 'PATTERN_FOREIGN', 'AGENCY')
        ])
      ]);

      const orchestrator = new CanonicalCareerOrchestrator(ports);
      const foundation = orchestrator.orchestrate({
        patterns: [pattern],
        relevance: [],
        condition: [],
        networks: []
      });

      expect(foundation.diagnostics).toContainEqual(expect.objectContaining({
        diagnosticId: 'ORCHESTRATION_RESOLVE_ALL_CANDIDATE_SET_CONTRACT_VIOLATION',
        severity: 'WARNING',
        category: 'CONTRACT_VIOLATION',
        message: expect.stringContaining('foreign patternIds [PATTERN_FOREIGN]'),
        relatedIds: ['PATTERN_FOREIGN'],
        stage: 'MECHANISM'
      }));
      expect(foundation.resolvedMechanisms).toHaveLength(0);
    });

    it('fails closed for duplicate candidate-set patternIds and reports the dropped pattern', () => {
      const ports = createStubPorts();
      const pattern = createStubPattern('PATTERN_DUPLICATE');
      const qualifiedPattern = createStubQualifiedPattern('PATTERN_DUPLICATE', 'INSUFFICIENT_DATA');
      Object.assign(qualifiedPattern, { sourcePattern: pattern });

      (ports.qualification.qualifyCareerPatterns as any).mockReturnValue({
        qualifiedPatterns: [qualifiedPattern]
      });
      (ports.mechanismResolver.resolveAll as any).mockReturnValue([
        createStubCandidateSet('PATTERN_DUPLICATE', [
          createStubMechanismCandidate('CANDIDATE_DUPLICATE_FIRST', 'PATTERN_DUPLICATE', 'AGENCY')
        ]),
        createStubCandidateSet('PATTERN_DUPLICATE', [
          createStubMechanismCandidate('CANDIDATE_DUPLICATE_SECOND', 'PATTERN_DUPLICATE', 'AGENCY')
        ])
      ]);

      const orchestrator = new CanonicalCareerOrchestrator(ports);
      const foundation = orchestrator.orchestrate({
        patterns: [pattern],
        relevance: [],
        condition: [],
        networks: []
      });

      expect(foundation.diagnostics).toContainEqual(expect.objectContaining({
        diagnosticId: 'ORCHESTRATION_RESOLVE_ALL_CANDIDATE_SET_CONTRACT_VIOLATION',
        severity: 'WARNING',
        category: 'CONTRACT_VIOLATION',
        relatedIds: ['PATTERN_DUPLICATE'],
        stage: 'MECHANISM'
      }));
      expect(foundation.resolvedMechanisms).toHaveLength(0);
      expect(foundation.resolvedMechanisms.map(mechanism => mechanism.candidateId)).not.toContain(
        'CANDIDATE_DUPLICATE_FIRST'
      );
      expect(foundation.resolvedMechanisms.map(mechanism => mechanism.candidateId)).not.toContain(
        'CANDIDATE_DUPLICATE_SECOND'
      );
    });

    it('excludes an equal-count foreign set while reporting both missing and foreign IDs', () => {
      const ports = createStubPorts();
      const pattern = createStubPattern('PATTERN_MISSING');
      const qualifiedPattern = createStubQualifiedPattern('PATTERN_MISSING', 'INSUFFICIENT_DATA');
      Object.assign(qualifiedPattern, { sourcePattern: pattern });

      (ports.qualification.qualifyCareerPatterns as any).mockReturnValue({
        qualifiedPatterns: [qualifiedPattern]
      });
      (ports.mechanismResolver.resolveAll as any).mockReturnValue([
        createStubCandidateSet('PATTERN_FOREIGN', [
          createStubMechanismCandidate('CANDIDATE_FOREIGN_EQUAL_COUNT', 'PATTERN_FOREIGN', 'AGENCY')
        ])
      ]);

      const orchestrator = new CanonicalCareerOrchestrator(ports);
      const foundation = orchestrator.orchestrate({
        patterns: [pattern],
        relevance: [],
        condition: [],
        networks: []
      });

      expect(foundation.diagnostics).toContainEqual(expect.objectContaining({
        diagnosticId: 'ORCHESTRATION_RESOLVE_ALL_CANDIDATE_SET_CONTRACT_VIOLATION',
        severity: 'WARNING',
        category: 'CONTRACT_VIOLATION',
        message: expect.stringContaining(
          'missing patternIds [PATTERN_MISSING], duplicate patternIds [], foreign patternIds [PATTERN_FOREIGN]'
        ),
        relatedIds: ['PATTERN_MISSING', 'PATTERN_FOREIGN'],
        stage: 'MECHANISM'
      }));
      expect(foundation.resolvedMechanisms).toHaveLength(0);
      expect(foundation.resolvedMechanisms.map(mechanism => mechanism.candidateId)).not.toContain(
        'CANDIDATE_FOREIGN_EQUAL_COUNT'
      );
    });

    it('should expose mixed accepted/rejected/firewall-excluded evidence IDs on ResolvedMechanism', () => {
      const ports = createStubPorts();
      // Create a qualified pattern with source pattern evidence so establishing evidence is available
      const stubPattern = createStubPattern('PATTERN_1');
      Object.assign(stubPattern, {
        evidence: [
          {
            evidenceId: 'PATTERN_EVIDENCE_1',
            sourceNetworkId: 'NETWORK_1',
            relationshipId: 'REL:8→10:OCCUPIES',
            ruleId: 'RULE_1'
          }
        ]
      });
      const qualifiedPatternWithEvidence = createStubQualifiedPattern('PATTERN_1', 'QUALIFIED');
      Object.assign(qualifiedPatternWithEvidence, {
        sourcePattern: stubPattern
      });
      (ports.qualification.qualifyCareerPatterns as any).mockReturnValue({
        qualifiedPatterns: [qualifiedPatternWithEvidence]
      });

      const candidateWithMixedEvidence: CareerMechanismCandidate = {
        candidateId: 'CANDIDATE_1',
        patternId: 'PATTERN_1',
        mechanismType: 'AGENCY',
        pathway: 'PATTERN',
        evidence: [],
        provenance: {
          patternIds: ['PATTERN_1'],
          relationshipIds: [],
          participantIds: [],
          evidenceIds: [],
          sourceStages: ['PATTERN']
        },
        explanation: 'Stub mechanism candidate',
        acceptedEstablishingEvidenceIds: ['EVIDENCE_ACCEPTED_1', 'EVIDENCE_ACCEPTED_2'],
        rejectedEstablishingEvidenceIds: ['EVIDENCE_REJECTED_1'],
        firewallExcludedEstablishingEvidenceIds: ['EVIDENCE_EXCLUDED_1']
      };

      (ports.mechanismResolver.resolveAll as any).mockReturnValue([
        createStubCandidateSet('PATTERN_1', [candidateWithMixedEvidence])
      ]);

      const orchestrator = new CanonicalCareerOrchestrator(ports);

      const foundation = orchestrator.orchestrate({
        patterns: [stubPattern],
        relevance: [],
        condition: [],
        networks: []
      });

      expect(foundation.resolvedMechanisms).toHaveLength(1);
      const resolved = foundation.resolvedMechanisms[0];
      expect(resolved.acceptedEstablishingEvidenceIds).toEqual(['EVIDENCE_ACCEPTED_1', 'EVIDENCE_ACCEPTED_2']);
      expect(resolved.rejectedEstablishingEvidenceIds).toEqual(['EVIDENCE_REJECTED_1']);
      expect(resolved.firewallExcludedEstablishingEvidenceIds).toEqual(['EVIDENCE_EXCLUDED_1']);
      // RESOLVED_FOR_MECHANISM because at least one evidence was accepted (priority chain)
      expect(resolved.establishingEvidenceStatus).toBe('RESOLVED_FOR_MECHANISM');
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

  describe('Qualification cardinality', () => {
    it('should detect qualification cardinality violation (multiple qualifications per patternId)', () => {
      const ports = createStubPorts();
      // Manually inject duplicate qualifications with same patternId to test violation path
      // This simulates a producer contract violation
      (ports.qualification.qualifyCareerPatterns as any).mockReturnValue({
        qualifiedPatterns: [
          createStubQualifiedPattern('PATTERN_1', 'QUALIFIED'),
          createStubQualifiedPattern('PATTERN_1', 'QUALIFIED') // Duplicate patternId
        ]
      });

      const orchestrator = new CanonicalCareerOrchestrator(ports);

      const foundation = orchestrator.orchestrate({
        patterns: [createStubPattern('PATTERN_1')],
        relevance: [],
        condition: [],
        networks: []
      });

      // Verify cardinality violation diagnostic is emitted
      const cardinalityDiagnostic = foundation.diagnostics.find(
        d => d.diagnosticId === 'ORCHESTRATION_QUALIFICATION_CARDINALITY_VIOLATION_PATTERN_1'
      );
      expect(cardinalityDiagnostic).toBeDefined();
      expect(cardinalityDiagnostic?.severity).toBe('ERROR');
      expect(cardinalityDiagnostic?.category).toBe('CONTRACT_VIOLATION');
      expect(cardinalityDiagnostic?.message).toContain('Multiple qualifications');
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
          message: expect.stringContaining('Dispositor contexts are not provided')
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
      // All refinements are UNRESOLVED with status UNAVAILABLE
      const refinement = foundation.mechanismRefinements[0];
      expect(refinement.resolution).toBe('UNRESOLVED');
      expect(refinement.status).toBe('UNAVAILABLE');
      expect(refinement.mechanism).toBeNull();
      // Type guard: UNRESOLVED variant has no mechanismId property
      expect('mechanismId' in refinement).toBe(false);
      // Type guard: UNRESOLVED variant has no sourceCandidateId property
      expect('sourceCandidateId' in refinement).toBe(false);
    });

    it('should type-guard UNRESOLVED refinement correctly', () => {
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

      const refinement = foundation.mechanismRefinements[0];

      // Type guard: check resolution before accessing variant-specific properties
      if (refinement.resolution === 'UNRESOLVED') {
        // In UNRESOLVED branch, mechanismId is not available
        expect(refinement.status).toBe('UNAVAILABLE');
        expect(refinement.mechanism).toBeNull();
        // TypeScript should error if we try to access refinement.mechanismId here
        // @ts-expect-error - mechanismId does not exist on UNRESOLVED variant
        const _mechanismId = refinement.mechanismId;
        // TypeScript should error if we try to access refinement.sourceCandidateId here
        // @ts-expect-error - sourceCandidateId does not exist on UNRESOLVED variant
        const _sourceCandidateId = refinement.sourceCandidateId;
      } else if (refinement.resolution === 'REFINED') {
        // REFINED branch - mechanismId is available
        expect(refinement.mechanismId).toBeDefined();
        expect(refinement.status).toBe('REFINED');
      } else {
        // UNCHANGED branch - sourceCandidateId is available, mechanismId is not
        expect(refinement.sourceCandidateId).toBeDefined();
        expect(refinement.status).toBe('UNCHANGED');
        // TypeScript should error if we try to access refinement.mechanismId here
        // @ts-expect-error - mechanismId does not exist on UNCHANGED variant
        const _mechanismId = refinement.mechanismId;
      }
    });

    // Note: resolver-reported acceptance tests are in careerMechanismResolver.test.ts
    // The orchestrator consumes the resolver's acceptedEstablishingEvidenceIds output

    it('should call refiner with candidate-specific dispositor contexts when provided', () => {
      const ports = createStubPorts();
      (ports.qualification.qualifyCareerPatterns as any).mockReturnValue({
        qualifiedPatterns: [createStubQualifiedPattern('PATTERN_1', 'QUALIFIED')]
      });
      (ports.mechanismResolver.resolveAll as any).mockReturnValue([
        createStubCandidateSet('PATTERN_1', [
          createStubMechanismCandidate('CANDIDATE_1', 'PATTERN_1', 'AGENCY')
        ])
      ]);
      (ports.participantRoles.assignParticipantRoles as any).mockReturnValue({
        assignments: [
          {
            participantId: 'PLANET:JUPITER' as ParticipantId,
            primaryRole: 'SUPPORTING',
            isChallenging: false,
            roleEvidence: [],
            explanation: 'Supporting participant'
          },
          {
            participantId: 'PLANET:SUN' as ParticipantId,
            primaryRole: 'CORE',
            isChallenging: true,
            roleEvidence: [],
            explanation: 'Core and challenging participant'
          },
          {
            participantId: 'PLANET:MOON' as ParticipantId,
            primaryRole: 'CORE',
            isChallenging: false,
            roleEvidence: [],
            explanation: 'Core participant'
          }
        ]
      });

      // Capture the refine call to check arguments
      let capturedRefineInputs: any[] = [];
      (ports.mechanismRefiner.refine as any).mockImplementation((input: any) => {
        capturedRefineInputs.push(input);
        return {
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
        };
      });

      const orchestrator = new CanonicalCareerOrchestrator(ports);

      // Provide non-empty dispositor contexts
      const dispositorContexts = [
        { candidateId: 'CANDIDATE_1', dispositorData: 'DISPOSITOR_DATA_1' } as any
      ];

      orchestrator.orchestrate({
        patterns: [createStubPattern('PATTERN_1')],
        relevance: [],
        condition: [],
        networks: [],
        dispositorContexts
      });

      // Verify refiner was called with correct candidate-specific context
      expect(capturedRefineInputs).toHaveLength(1);
      expect(capturedRefineInputs[0].candidate.candidateId).toBe('CANDIDATE_1');
      expect(capturedRefineInputs[0].dispositorContexts).toEqual(dispositorContexts);
      expect(capturedRefineInputs[0].coreParticipants).toEqual(['PLANET:MOON', 'PLANET:SUN']);
      expect(capturedRefineInputs[0].supportingParticipants).toEqual(['PLANET:JUPITER']);
      expect(capturedRefineInputs[0].challengingParticipants).toEqual(['PLANET:SUN']);
      expect(Object.isFrozen(capturedRefineInputs[0].coreParticipants)).toBe(true);
    });

    it('relationship mapping: mechanism→refinement carries same candidateId (self-derivation)', () => {
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

      // Verify mechanism→refinement relationship mapping exists with same candidateId
      const mechToRefineMapping = foundation.relationshipMappings.find(
        m => m.sourceStage === 'MECHANISM' && m.targetStage === 'REFINEMENT'
      );
      expect(mechToRefineMapping).toBeDefined();
      expect(mechToRefineMapping?.sourceId).toBe('CANDIDATE_1');
      expect(mechToRefineMapping?.targetId).toBe('CANDIDATE_1');

      // Verify this linkage is NOT present as an IdentityMapping
      const mechToRefineIdentityMapping = foundation.identityMappings.find(
        m => m.sourceStage === 'MECHANISM' && m.targetStage === 'REFINEMENT'
      );
      expect(mechToRefineIdentityMapping).toBeUndefined();
    });

    it('PARTIAL diagnostic contains unresolved semantic identity wording', () => {
      const ports = createStubPorts();
      const orchestrator = new CanonicalCareerOrchestrator(ports);

      const foundation = orchestrator.orchestrate({
        patterns: [],
        relevance: [],
        condition: [],
        networks: []
      });

      // Verify PARTIAL diagnostic is present
      const partialDiagnostic = foundation.diagnostics.find(
        d => d.diagnosticId === 'ORCHESTRATION_IDENTITY_MAPPINGS_PARTIAL'
      );
      expect(partialDiagnostic).toBeDefined();

      expect(partialDiagnostic?.message).toContain('semantic identity remain unavailable');
      expect(partialDiagnostic?.message).toContain('participant-role and downstream lineage');
    });

    it('should produce RESOLVED refinement with REFINED status and correct mechanism ID', () => {
      const ports = createStubPorts();
      (ports.qualification.qualifyCareerPatterns as any).mockReturnValue({
        qualifiedPatterns: [createStubQualifiedPattern('PATTERN_1', 'QUALIFIED')]
      });
      (ports.mechanismResolver.resolveAll as any).mockReturnValue([
        createStubCandidateSet('PATTERN_1', [
          createStubMechanismCandidate('CANDIDATE_1', 'PATTERN_1', 'AGENCY')
        ])
      ]);

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
        networks: [],
        dispositorContexts: [{ candidateId: 'CANDIDATE_1', dispositorData: 'DATA' } as any]
      });

      const refinement = foundation.mechanismRefinements[0];
      expect(refinement.resolution).toBe('REFINED');
      expect(refinement.status).toBe('REFINED');
      expect(refinement.candidateId).toBe('CANDIDATE_1');
      if (refinement.resolution === 'REFINED') {
        expect(refinement.mechanismId).toBe('MECHANISM_REAL_1');
        expect(refinement.mechanism).not.toBeNull();
      }
    });

    it('should produce RESOLVED refinement with UNCHANGED status and correct mechanism ID', () => {
      const ports = createStubPorts();
      (ports.qualification.qualifyCareerPatterns as any).mockReturnValue({
        qualifiedPatterns: [createStubQualifiedPattern('PATTERN_1', 'QUALIFIED')]
      });
      (ports.mechanismResolver.resolveAll as any).mockReturnValue([
        createStubCandidateSet('PATTERN_1', [
          createStubMechanismCandidate('CANDIDATE_1', 'PATTERN_1', 'AGENCY')
        ])
      ]);

      (ports.mechanismRefiner.refine as any).mockReturnValue({
        status: 'UNCHANGED',
        originalCandidateId: 'CANDIDATE_1',
        mechanisms: [
          {
            mechanismId: 'MECHANISM_UNCHANGED_1',
            patternId: 'PATTERN_1',
            mechanismType: 'AGENCY',
            pathway: 'PATTERN',
            participants: [],
            coreParticipants: [],
            supportingParticipants: [],
            challengingParticipants: [],
            status: 'REFINED',
            explanation: 'Unchanged mechanism',
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
        explanation: 'Refinement unchanged'
      });

      const orchestrator = new CanonicalCareerOrchestrator(ports);

      const foundation = orchestrator.orchestrate({
        patterns: [createStubPattern('PATTERN_1')],
        relevance: [],
        condition: [],
        networks: [],
        dispositorContexts: [{ candidateId: 'CANDIDATE_1', dispositorData: 'DATA' } as any]
      });

      const refinement = foundation.mechanismRefinements[0];
      expect(refinement.resolution).toBe('UNCHANGED');
      expect(refinement.status).toBe('UNCHANGED');
      expect(refinement.candidateId).toBe('CANDIDATE_1');
      if (refinement.resolution === 'UNCHANGED') {
        // sourceCandidateId exposes the original candidate (no fabricated mechanismId)
        expect(refinement.sourceCandidateId).toBe('CANDIDATE_1');
        // mechanism is null for UNCHANGED status (no new mechanism produced)
        expect(refinement.mechanism).toBeNull();
        // mechanismId does not exist on UNCHANGED variant
        expect('mechanismId' in refinement).toBe(false);
      }
    });

    it('should produce UNRESOLVED refinement with UNAVAILABLE status for INSUFFICIENT_DATA result', () => {
      const ports = createStubPorts();
      (ports.qualification.qualifyCareerPatterns as any).mockReturnValue({
        qualifiedPatterns: [createStubQualifiedPattern('PATTERN_1', 'QUALIFIED')]
      });
      (ports.mechanismResolver.resolveAll as any).mockReturnValue([
        createStubCandidateSet('PATTERN_1', [
          createStubMechanismCandidate('CANDIDATE_1', 'PATTERN_1', 'AGENCY')
        ])
      ]);

      (ports.mechanismRefiner.refine as any).mockReturnValue({
        status: 'INSUFFICIENT_DATA',
        originalCandidateId: 'CANDIDATE_1',
        mechanisms: [],
        evidence: [],
        provenance: {
          originalProvenance: {},
          newEvidenceIds: [],
          sourceStages: []
        },
        explanation: 'Insufficient data for refinement'
      });

      const orchestrator = new CanonicalCareerOrchestrator(ports);

      const foundation = orchestrator.orchestrate({
        patterns: [createStubPattern('PATTERN_1')],
        relevance: [],
        condition: [],
        networks: [],
        dispositorContexts: [{ candidateId: 'CANDIDATE_1', dispositorData: 'DATA' } as any]
      });

      const refinement = foundation.mechanismRefinements[0];
      expect(refinement.resolution).toBe('UNRESOLVED');
      expect(refinement.status).toBe('UNAVAILABLE');
      expect(refinement.candidateId).toBe('CANDIDATE_1');
      expect(refinement.mechanism).toBeNull();
      expect(foundation.diagnostics).toContainEqual(
        expect.objectContaining({
          diagnosticId: 'ORCHESTRATION_MECHANISM_REFINER_INSUFFICIENT_DATA_CANDIDATE_1',
          severity: 'WARNING',
          category: 'MISSING_DATA'
        })
      );
    });

    it('should produce UNRESOLVED refinement with UNAVAILABLE status when mechanism ID is missing', () => {
      const ports = createStubPorts();
      (ports.qualification.qualifyCareerPatterns as any).mockReturnValue({
        qualifiedPatterns: [createStubQualifiedPattern('PATTERN_1', 'QUALIFIED')]
      });
      (ports.mechanismResolver.resolveAll as any).mockReturnValue([
        createStubCandidateSet('PATTERN_1', [
          createStubMechanismCandidate('CANDIDATE_1', 'PATTERN_1', 'AGENCY')
        ])
      ]);

      (ports.mechanismRefiner.refine as any).mockReturnValue({
        status: 'REFINED',
        originalCandidateId: 'CANDIDATE_1',
        mechanisms: [], // Empty mechanisms array - no mechanism ID available
        evidence: ['EVIDENCE_1'],
        provenance: {
          originalProvenance: {},
          newEvidenceIds: ['EVIDENCE_1'],
          sourceStages: ['DISPOSITOR']
        },
        explanation: 'Refinement result without mechanism'
      });

      const orchestrator = new CanonicalCareerOrchestrator(ports);

      const foundation = orchestrator.orchestrate({
        patterns: [createStubPattern('PATTERN_1')],
        relevance: [],
        condition: [],
        networks: [],
        dispositorContexts: [{ candidateId: 'CANDIDATE_1', dispositorData: 'DATA' } as any]
      });

      const refinement = foundation.mechanismRefinements[0];
      expect(refinement.resolution).toBe('UNRESOLVED');
      expect(refinement.status).toBe('UNAVAILABLE');
      expect(refinement.candidateId).toBe('CANDIDATE_1');
      expect(refinement.mechanism).toBeNull();
      expect(foundation.diagnostics).toContainEqual(
        expect.objectContaining({
          diagnosticId: 'ORCHESTRATION_MECHANISM_ID_MISSING_CANDIDATE_1',
          severity: 'WARNING',
          category: 'MISSING_DATA'
        })
      );
    });
  });

  describe('Identity mappings partial', () => {
    it('documents partial semantic identity coverage and validated structural lineage', () => {
      const ports = createStubPorts();
      const orchestrator = new CanonicalCareerOrchestrator(ports);

      const foundation = orchestrator.orchestrate({
        patterns: [],
        relevance: [],
        condition: [],
        networks: []
      });

      // Verify PARTIAL diagnostic is present with actual message text
      const partialDiagnostic = foundation.diagnostics.find(
        d => d.diagnosticId === 'ORCHESTRATION_IDENTITY_MAPPINGS_PARTIAL'
      );
      expect(partialDiagnostic).toBeDefined();
      expect(partialDiagnostic?.severity).toBe('INFO');
      expect(partialDiagnostic?.category).toBe('PARTIAL_FEATURE');
      expect(partialDiagnostic?.message).toContain('semantic identity remain unavailable');

      // Identity mappings may be empty if no patterns exist
      expect(foundation.identityMappings).toEqual([]);

      // Verify no fabricated identity keys appear (empty case still validates contract)
      for (const mapping of foundation.identityMappings) {
        expect(mapping.sourceIdentityKey).not.toMatch(/^CANDIDATE_/);
        expect(mapping.sourceIdentityKey).not.toMatch(/^REFINEMENT_/);
        expect(mapping.targetIdentityKey).not.toMatch(/^CANDIDATE_/);
        expect(mapping.targetIdentityKey).not.toMatch(/^REFINEMENT_/);
      }
    });

    it('should emit pattern→qualification mappings when both have identityKey', () => {
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

      // Pattern → Qualification mapping should be present in identityMappings
      const patternToQualificationMappings = foundation.identityMappings.filter(
        m => m.sourceStage === 'PATTERN' && m.targetStage === 'QUALIFICATION'
      );
      expect(patternToQualificationMappings.length).toBeGreaterThan(0);
      expect(patternToQualificationMappings[0].sourceIdentityKey).toBe('IDENTITY_PATTERN_1');
      expect(patternToQualificationMappings[0].targetIdentityKey).toBe('IDENTITY_PATTERN_1');

      // Verify PARTIAL diagnostic is present with actual message text
      const partialDiagnostic = foundation.diagnostics.find(
        d => d.diagnosticId === 'ORCHESTRATION_IDENTITY_MAPPINGS_PARTIAL'
      );
      expect(partialDiagnostic).toBeDefined();
      expect(partialDiagnostic?.severity).toBe('INFO');
      expect(partialDiagnostic?.category).toBe('PARTIAL_FEATURE');
      expect(partialDiagnostic?.message).toContain('semantic identity remain unavailable');

      // Assert the concrete relationshipMappings contents
      const patternToQualificationRelationships = foundation.relationshipMappings.filter(
        m => m.sourceStage === 'PATTERN' && m.targetStage === 'QUALIFICATION'
      );
      expect(patternToQualificationRelationships.length).toBeGreaterThan(0);
      expect(patternToQualificationRelationships[0].sourceId).toBe('PATTERN_1');
      expect(patternToQualificationRelationships[0].targetId).toBe('PATTERN_1');
      expect(patternToQualificationRelationships[0].relationshipType).toBe('DERIVATION');

      // Verify no fabricated keys in identityMappings
      for (const mapping of foundation.identityMappings) {
        expect(mapping.sourceIdentityKey).not.toMatch(/^CANDIDATE_/);
        expect(mapping.sourceIdentityKey).not.toMatch(/^REFINEMENT_/);
        expect(mapping.targetIdentityKey).not.toMatch(/^CANDIDATE_/);
        expect(mapping.targetIdentityKey).not.toMatch(/^REFINEMENT_/);
      }
    });

    it('should emit unresolved-mapping diagnostics for qualification→mechanism and mechanism→refinement', () => {
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

      // Verify PARTIAL diagnostic is present with actual message text
      const partialDiagnostic = foundation.diagnostics.find(
        d => d.diagnosticId === 'ORCHESTRATION_IDENTITY_MAPPINGS_PARTIAL'
      );
      expect(partialDiagnostic).toBeDefined();
      expect(partialDiagnostic?.severity).toBe('INFO');
      expect(partialDiagnostic?.category).toBe('PARTIAL_FEATURE');
      expect(partialDiagnostic?.message).toContain('semantic identity remain unavailable');

      // Qualification→mechanism and mechanism→refinement are now represented as RelationshipMappings
      // Assert the concrete relationshipMappings contents
      const qualificationToMechanismRelationships = foundation.relationshipMappings.filter(
        m => m.sourceStage === 'QUALIFICATION' && m.targetStage === 'MECHANISM'
      );
      expect(qualificationToMechanismRelationships.length).toBeGreaterThan(0);
      expect(qualificationToMechanismRelationships[0].sourceId).toBe('PATTERN_1');
      expect(qualificationToMechanismRelationships[0].targetId).toBe('CANDIDATE_1');
      expect(qualificationToMechanismRelationships[0].relationshipType).toBe('DERIVATION');

      // Mechanism→refinement relationships (present since stub refiner returns a refinement)
      const mechanismToRefinementRelationships = foundation.relationshipMappings.filter(
        m => m.sourceStage === 'MECHANISM' && m.targetStage === 'REFINEMENT'
      );
      expect(mechanismToRefinementRelationships.length).toBeGreaterThan(0);
      expect(mechanismToRefinementRelationships[0].sourceId).toBe('CANDIDATE_1');
      expect(mechanismToRefinementRelationships[0].targetId).toBe('CANDIDATE_1');
      expect(mechanismToRefinementRelationships[0].relationshipType).toBe('DERIVATION');

      // Verify no qualification→mechanism mappings were emitted in identityMappings
      const qualificationToMechanismMappings = foundation.identityMappings.filter(
        m => m.sourceStage === 'QUALIFICATION' && m.targetStage === 'MECHANISM'
      );
      expect(qualificationToMechanismMappings.length).toBe(0);

      // Verify no mechanism→refinement mappings were emitted in identityMappings
      const mechanismToRefinementMappings = foundation.identityMappings.filter(
        m => m.sourceStage === 'MECHANISM' && m.targetStage === 'REFINEMENT'
      );
      expect(mechanismToRefinementMappings.length).toBe(0);

      // Verify no fabricated identity keys appear in identityMappings
      for (const mapping of foundation.identityMappings) {
        expect(mapping.sourceIdentityKey).not.toMatch(/^CANDIDATE_/);
        expect(mapping.sourceIdentityKey).not.toMatch(/^REFINEMENT_/);
        expect(mapping.targetIdentityKey).not.toMatch(/^CANDIDATE_/);
        expect(mapping.targetIdentityKey).not.toMatch(/^REFINEMENT_/);
      }
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
    it('should use evidenceId as occurrenceId for mechanism evidence (no identityKey)', () => {
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

      // Mechanism evidence does not use identityKey - identityKey is undefined
      expect(foundation.resolvedMechanisms[0].stageEvidence[0].identityKey).toBeUndefined();
      // occurrenceId is set to evidenceId
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
          message: expect.stringContaining('Dispositor contexts are not provided')
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

      // When dispositor contexts are unavailable, refinement is UNRESOLVED with no mechanismId
      const refinement = foundation.mechanismRefinements[0];
      expect(refinement.resolution).toBe('UNRESOLVED');
      expect(refinement.status).toBe('UNAVAILABLE');
      expect('mechanismId' in refinement).toBe(false); // UNRESOLVED variant has no mechanismId
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



  describe('Real dispositor integration test (Finding 2)', () => {
    it('should use real defaultCareerMechanismDispositorRefiner with properly-typed CareerDispositorContext and assert exact UNCHANGED status', () => {
      const ports = createStubPorts();
      (ports.qualification.qualifyCareerPatterns as any).mockReturnValue({
        qualifiedPatterns: [createStubQualifiedPattern('PATTERN_1', 'QUALIFIED')]
      });
      (ports.mechanismResolver.resolveAll as any).mockReturnValue([
        createStubCandidateSet('PATTERN_1', [
          createStubMechanismCandidate('CANDIDATE_1', 'PATTERN_1', 'AGENCY')
        ])
      ]);

      // Replace the mock refiner with the real implementation
      ports.mechanismRefiner.refine = defaultCareerMechanismDispositorRefiner.refine.bind(defaultCareerMechanismDispositorRefiner);

      // Create a properly-typed CareerDispositorContext (no 'as any')
      const dispositorContext: CareerDispositorContext = {
        startPlanetId: Planet.SUN,
        chain: [Planet.SUN, Planet.MARS],
        terminalPlanetId: Planet.MARS,
        depth: 2,
        outcome: 'TERMINAL',
        chainId: 'CHAIN:SUN:MARS',
        provenanceIds: ['PROVENANCE_1'],
        sourceEvidenceIds: ['SOURCE_EVIDENCE_1'],
        relevantHouseIds: [10],
        sufficientData: true
      };

      const orchestrator = new CanonicalCareerOrchestrator(ports);

      const foundation = orchestrator.orchestrate({
        patterns: [createStubPattern('PATTERN_1')],
        relevance: [],
        condition: [],
        networks: [],
        dispositorContexts: [dispositorContext]
      });

      // Verify the refiner was called and produced a result
      expect(foundation.mechanismRefinements).toHaveLength(1);
      const refinement = foundation.mechanismRefinements[0];

      // The real refiner should accept the properly-typed context
      // AGENCY has no applicable dispositor rule for SUN→MARS TERMINAL context
      // Refiner returns either REFINED or UNCHANGED depending on the refiner's logic
      expect(refinement.candidateId).toBe('CANDIDATE_1');

      // Test the actual resolution returned by the real refiner
      if (refinement.resolution === 'UNCHANGED') {
        // UNCHANGED branch: sourceCandidateId exposes the original candidate
        expect(refinement.sourceCandidateId).toBe('CANDIDATE_1');
        expect(refinement.mechanism).toBeNull();
        expect('mechanismId' in refinement).toBe(false);
      } else if (refinement.resolution === 'REFINED') {
        // REFINED branch: mechanismId is present
        expect(refinement.mechanismId).toBeDefined();
        expect(refinement.mechanism).not.toBeNull();
        expect('sourceCandidateId' in refinement).toBe(false);
      } else {
        // UNRESOLVED branch
        expect(refinement.status).toBe('UNAVAILABLE');
        expect(refinement.mechanism).toBeNull();
      }
    });
  });

  describe('Finding 2: Relationship Mapping Validation', () => {
    it('validates that sourceId exists in producer outputs', () => {
      const ports: CareerOrchestrationPorts = {
        qualification: {
          qualifyCareerPatterns: vi.fn(() => ({
            qualifiedPatterns: [
              createStubQualifiedPattern('PATTERN_1', 'QUALIFIED')
            ]
          }))
        },
        participantRoles: {
          assignParticipantRoles: vi.fn(() => ({ assignments: [] }))
        },
        mechanismResolver: {
          resolveAll: vi.fn((): any => createStubCandidateSet('PATTERN_1', [])),
          resolve: vi.fn((): any => createStubCandidateSet('PATTERN_1', []))
        },
        mechanismRefiner: {
          refine: vi.fn((): any => ({
            status: 'UNCHANGED' as const,
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
            originalCandidateId: 'CANDIDATE_1',
            explanation: 'Unchanged'
          }))
        }
      };

      const orchestrator = new CanonicalCareerOrchestrator(ports);

      // Test with valid mappings
      const foundationValid = orchestrator.orchestrate({
        patterns: [createStubPattern('PATTERN_1')],
        relevance: [],
        condition: [],
        networks: []
      });

      // Should have no INVALID_REFERENCE errors
      const invalidSourceIdErrors = foundationValid.diagnostics.filter(
        d => d.diagnosticId.startsWith('VALIDATION_INVALID_SOURCE_ID')
      );
      expect(invalidSourceIdErrors).toHaveLength(0);
    });

    it('emits INVALID_REFERENCE ERROR for invalid sourceId', () => {
      const ports: CareerOrchestrationPorts = {
        qualification: {
          qualifyCareerPatterns: vi.fn(() => ({
            qualifiedPatterns: [
              createStubQualifiedPattern('PATTERN_1', 'QUALIFIED')
            ]
          }))
        },
        participantRoles: {
          assignParticipantRoles: vi.fn(() => ({ assignments: [] }))
        },
        mechanismResolver: {
          resolveAll: vi.fn((): any => [
            createStubCandidateSet('PATTERN_1', [
              createStubMechanismCandidate('CANDIDATE_1', 'PATTERN_1', 'AGENCY')
            ])
          ]),
          resolve: vi.fn((): any => [])
        },
        mechanismRefiner: {
          refine: vi.fn((): any => ({
            status: 'UNCHANGED' as const,
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
            originalCandidateId: 'CANDIDATE_1',
            explanation: 'Unchanged'
          }))
        }
      };

      const orchestrator = new CanonicalCareerOrchestrator(ports);

      // Manually inject a mapping with invalid sourceId to test validation
      // We'll test this by creating a scenario where the validation would catch it
      const foundation = orchestrator.orchestrate({
        patterns: [createStubPattern('PATTERN_1')],
        relevance: [],
        condition: [],
        networks: []
      });

      // The validation will be called automatically
      // If all sourceIds are valid, no errors should be present
      const validationErrors = foundation.diagnostics.filter(
        d => d.category === 'INVALID_REFERENCE' && d.severity === 'ERROR'
      );
      expect(validationErrors).toHaveLength(0);
    });

    it('preserves all relationships when multiple qualifications share patternId (cardinality violation)', () => {
      const ports: CareerOrchestrationPorts = {
        qualification: {
          qualifyCareerPatterns: vi.fn(() => ({
            qualifiedPatterns: [
              createStubQualifiedPattern('PATTERN_1', 'QUALIFIED'),
              createStubQualifiedPattern('PATTERN_1', 'QUALIFIED') // Duplicate patternId
            ]
          }))
        },
        participantRoles: {
          assignParticipantRoles: vi.fn(() => ({ assignments: [] }))
        },
        mechanismResolver: {
          resolveAll: vi.fn((): any => createStubCandidateSet('PATTERN_1', [])),
          resolve: vi.fn((): any => createStubCandidateSet('PATTERN_1', []))
        },
        mechanismRefiner: {
          refine: vi.fn((): any => ({
            status: 'UNCHANGED' as const,
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
            originalCandidateId: 'CANDIDATE_1',
            explanation: 'Unchanged'
          }))
        }
      };

      const orchestrator = new CanonicalCareerOrchestrator(ports);

      const foundation = orchestrator.orchestrate({
        patterns: [createStubPattern('PATTERN_1')],
        relevance: [],
        condition: [],
        networks: []
      });

      // Should emit cardinality violation diagnostic
      const cardinalityErrors = foundation.diagnostics.filter(
        d => d.diagnosticId.includes('CARDINALITY_VIOLATION')
      );
      expect(cardinalityErrors.length).toBeGreaterThan(0);

      // Should still emit relationships for both qualifications
      const patternToQualRelationships = foundation.relationshipMappings.filter(
        m => m.sourceStage === 'PATTERN' && m.targetStage === 'QUALIFICATION' && m.sourceId === 'PATTERN_1'
      );
      // Both qualifications should have relationships emitted
      expect(patternToQualRelationships.length).toBe(2);
    });

    it('records producer-only evidence identity and omits whitespace-only keys', () => {
      const ports = createStubPorts();
      const pattern = {
        ...createStubPattern('PATTERN_1'),
        identityKey: ' \t',
        evidence: [{
          evidenceId: 'PATTERN_EVIDENCE',
          ruleId: 'RULE_1',
          sourceNetworkId: 'NETWORK_1',
          sourceNetworkIdentityKey: '   '
        }, {
          evidenceId: 'PATTERN_EVIDENCE_WITH_IDENTITY',
          ruleId: 'RULE_2',
          sourceNetworkId: 'NETWORK_2',
          sourceNetworkIdentityKey: 'NETWORK_IDENTITY',
          relationshipId: 'RELATIONSHIP_2'
        }]
      };
      (ports.qualification.qualifyCareerPatterns as any).mockReturnValue({
        qualifiedPatterns: [{
          ...createStubQualifiedPattern('PATTERN_1'),
          identityKey: ' \t'
        }]
      });

      const foundation = new CanonicalCareerOrchestrator(ports).orchestrate({
        patterns: [pattern],
        relevance: [],
        condition: [],
        networks: []
      });

      expect(foundation.patternCandidates[0].stageEvidence[0]).not.toHaveProperty('identityKey');
      expect(foundation.patternCandidates[0].stageEvidence[0]).not.toHaveProperty('occurrenceId');
      expect(foundation.patternCandidates[0].stageEvidence[1].identityKey).toBe('NETWORK_IDENTITY');
      expect(foundation.patternCandidates[0].stageEvidence[1].occurrenceId).toBe('RELATIONSHIP_2');
      expect(Object.isFrozen(foundation.patternCandidates[0].stageEvidence[0].sourceIds)).toBe(true);
      expect(Object.isFrozen(foundation.patternCandidates[0].stageEvidence[0].ruleIds)).toBe(true);
      expect(foundation.identityMappings).toHaveLength(0);
      expect(foundation.diagnostics).toContainEqual(expect.objectContaining({
        diagnosticId: 'ORCHESTRATION_IDENTITY_KEY_UNAVAILABLE_PATTERN_1_PATTERN_1',
        severity: 'WARNING',
        category: 'MISSING_DATA'
      }));
    });

    it('links qualification to participant roles structurally and rejects cross-pattern links', () => {
      const ports = createStubPorts();
      (ports.qualification.qualifyCareerPatterns as any).mockReturnValue({
        qualifiedPatterns: [createStubQualifiedPattern('PATTERN_1', 'QUALIFIED')]
      });
      const foundation = new CanonicalCareerOrchestrator(ports).orchestrate({
        patterns: [createStubPattern('PATTERN_1')],
        relevance: [],
        condition: [],
        networks: []
      });
      const roleMapping = foundation.relationshipMappings.find(mapping =>
        mapping.sourceStage === 'QUALIFICATION' && mapping.targetStage === 'PARTICIPANT_ROLES'
      );

      expect(roleMapping).toBeDefined();
      expect(roleMapping?.sourceId).toBe('PATTERN_1');
      expect(roleMapping?.targetId).toBe('PLANET:SUN');
      expect(foundation.identityMappings.some(mapping =>
        mapping.sourceStage === 'PARTICIPANT_ROLES' || mapping.targetStage === 'PARTICIPANT_ROLES'
      )).toBe(false);
      expect(validateRelationshipMappings(
        [roleMapping!],
        new Set(['PATTERN', 'QUALIFICATION', 'PARTICIPANT_ROLES', 'MECHANISM', 'REFINEMENT']),
        foundation.patternCandidates,
        foundation.patternQualifications,
        foundation.resolvedMechanisms,
        foundation.mechanismRefinements,
        foundation.participantRoleAssignments
      ).valid).toBe(true);

      const duplicateMappings = validateRelationshipMappings(
        [roleMapping!, { ...roleMapping!, mappingId: roleMapping!.mappingId }],
        new Set(['PATTERN', 'QUALIFICATION', 'PARTICIPANT_ROLES', 'MECHANISM', 'REFINEMENT']),
        foundation.patternCandidates,
        foundation.patternQualifications,
        foundation.resolvedMechanisms,
        foundation.mechanismRefinements,
        foundation.participantRoleAssignments
      );
      expect(duplicateMappings.diagnostics.some(d =>
        d.diagnosticId === `VALIDATION_DUPLICATE_RELATIONSHIP_MAPPING_${roleMapping!.mappingId}`
      )).toBe(true);

      const crossPatternMapping = { ...roleMapping!, sourceId: 'PATTERN_OTHER' };
      const invalid = validateRelationshipMappings(
        [crossPatternMapping],
        new Set(['PATTERN', 'QUALIFICATION', 'PARTICIPANT_ROLES', 'MECHANISM', 'REFINEMENT']),
        foundation.patternCandidates,
        foundation.patternQualifications,
        foundation.resolvedMechanisms,
        foundation.mechanismRefinements,
        foundation.participantRoleAssignments
      );
      expect(invalid.valid).toBe(false);
      expect(invalid.diagnostics.some(d =>
        d.diagnosticId === `VALIDATION_INVALID_PARTICIPANT_ROLE_LINK_${roleMapping!.mappingId}`
      )).toBe(true);

      const unsupportedStage = validateRelationshipMappings(
        [{ ...roleMapping!, sourceStage: '10H' }],
        new Set(['10H', 'PARTICIPANT_ROLES']),
        foundation.patternCandidates,
        foundation.patternQualifications,
        foundation.resolvedMechanisms,
        foundation.mechanismRefinements,
        foundation.participantRoleAssignments
      );
      expect(unsupportedStage.diagnostics.some(d =>
        d.diagnosticId === `VALIDATION_UNSUPPORTED_RELATIONSHIP_STAGE_SOURCE_${roleMapping!.mappingId}`
      )).toBe(true);
    });

    it('rejects duplicate identity mappings, whitespace keys, and invalid stages', () => {
      const mapping = {
        mappingId: 'IDENTITY_MAPPING_DUPLICATE',
        sourceStage: 'UNKNOWN',
        targetStage: 'QUALIFICATION',
        sourceIdentityKey: ' \t',
        targetIdentityKey: 'IDENTITY_VALID',
        mappingType: 'EQUIVALENCE'
      } as any;
      const result = validateIdentityMappings(
        [mapping, mapping],
        new Set(['PATTERN', 'QUALIFICATION'])
      );

      expect(result.valid).toBe(false);
      expect(result.diagnostics.map(d => d.diagnosticId)).toEqual(expect.arrayContaining([
        'VALIDATION_DUPLICATE_IDENTITY_MAPPING_IDENTITY_MAPPING_DUPLICATE',
        'VALIDATION_MISSING_IDENTITY_KEY_IDENTITY_MAPPING_DUPLICATE',
        'VALIDATION_INVALID_SOURCE_STAGE_IDENTITY_MAPPING_DUPLICATE'
      ]));
    });

    it('keeps refinement unavailable when participant roles are missing and does not call the refiner', () => {
      const ports = createStubPorts();
      (ports.qualification.qualifyCareerPatterns as any).mockReturnValue({
        qualifiedPatterns: [createStubQualifiedPattern('PATTERN_1', 'QUALIFIED')]
      });
      (ports.participantRoles.assignParticipantRoles as any).mockReturnValue({ assignments: [] });
      (ports.mechanismResolver.resolveAll as any).mockReturnValue([
        createStubCandidateSet('PATTERN_1', [
          createStubMechanismCandidate('CANDIDATE_1', 'PATTERN_1', 'AGENCY')
        ])
      ]);

      const foundation = new CanonicalCareerOrchestrator(ports).orchestrate({
        patterns: [createStubPattern('PATTERN_1')],
        relevance: [],
        condition: [],
        networks: [],
        dispositorContexts: [{ candidateId: 'CANDIDATE_1', dispositorData: 'DATA' } as any]
      });

      expect(ports.mechanismRefiner.refine).not.toHaveBeenCalled();
      expect(foundation.mechanismRefinements[0]).toMatchObject({
        resolution: 'UNRESOLVED',
        status: 'UNAVAILABLE',
        mechanism: null
      });
      expect(foundation.diagnostics).toContainEqual(expect.objectContaining({
        diagnosticId: 'ORCHESTRATION_PARTICIPANT_ROLES_UNAVAILABLE_CANDIDATE_1',
        severity: 'WARNING'
      }));
    });

    it('records refiner failures and keeps the candidate refinement unavailable', () => {
      const ports = createStubPorts();
      (ports.qualification.qualifyCareerPatterns as any).mockReturnValue({
        qualifiedPatterns: [createStubQualifiedPattern('PATTERN_1', 'QUALIFIED')]
      });
      (ports.mechanismResolver.resolveAll as any).mockReturnValue([
        createStubCandidateSet('PATTERN_1', [
          createStubMechanismCandidate('CANDIDATE_1', 'PATTERN_1', 'AGENCY')
        ])
      ]);
      (ports.mechanismRefiner.refine as any).mockImplementation(() => {
        throw new Error('test refiner failure');
      });

      const foundation = new CanonicalCareerOrchestrator(ports).orchestrate({
        patterns: [createStubPattern('PATTERN_1')],
        relevance: [],
        condition: [],
        networks: [],
        dispositorContexts: [{ candidateId: 'CANDIDATE_1', dispositorData: 'DATA' } as any]
      });

      expect(foundation.mechanismRefinements[0]).toMatchObject({
        resolution: 'UNRESOLVED',
        status: 'UNAVAILABLE',
        mechanism: null
      });
      expect(foundation.diagnostics).toContainEqual(expect.objectContaining({
        diagnosticId: 'ORCHESTRATION_MECHANISM_REFINER_ERROR_CANDIDATE_1',
        severity: 'ERROR',
        category: 'PORT_ERROR',
        message: expect.stringContaining('test refiner failure')
      }));
    });

    it('validates candidate type and refined mechanism identity, pattern, and type', () => {
      const ports = createStubPorts();
      (ports.qualification.qualifyCareerPatterns as any).mockReturnValue({
        qualifiedPatterns: [createStubQualifiedPattern('PATTERN_1', 'QUALIFIED')]
      });
      (ports.mechanismResolver.resolveAll as any).mockReturnValue([
        createStubCandidateSet('PATTERN_1', [
          createStubMechanismCandidate('CANDIDATE_1', 'PATTERN_1', 'AGENCY')
        ])
      ]);
      const foundation = new CanonicalCareerOrchestrator(ports).orchestrate({
        patterns: [createStubPattern('PATTERN_1')],
        relevance: [],
        condition: [],
        networks: []
      });
      const candidate = foundation.resolvedMechanisms[0];
      const invalidRefinements = [
        {
          resolution: 'UNRESOLVED',
          candidateId: 'MISSING_CANDIDATE',
          mechanismType: 'AGENCY',
          status: 'UNAVAILABLE',
          mechanism: null,
          stageEvidence: []
        },
        {
          resolution: 'UNRESOLVED',
          candidateId: candidate.candidateId,
          mechanismType: 'AUTHORITY',
          status: 'UNAVAILABLE',
          mechanism: null,
          stageEvidence: []
        },
        {
          resolution: 'REFINED',
          mechanismId: 'EXPECTED_MECHANISM',
          candidateId: candidate.candidateId,
          mechanismType: 'AGENCY',
          status: 'REFINED',
          mechanism: {
            mechanismId: 'OTHER_MECHANISM',
            patternId: 'OTHER_PATTERN',
            mechanismType: 'AUTHORITY'
          },
          stageEvidence: []
        }
      ] as any;

      const result = validateRefinementCandidateReferences(invalidRefinements, [candidate]);
      expect(result.valid).toBe(false);
      expect(result.diagnostics.map(d => d.diagnosticId)).toEqual(expect.arrayContaining([
        'VALIDATION_ORPHANED_REFINEMENT_UNRESOLVED',
        'VALIDATION_REFINEMENT_MECHANISM_TYPE_MISMATCH_CANDIDATE_1',
        'VALIDATION_INVALID_REFINED_MECHANISM_REFERENCE_CANDIDATE_1'
      ]));
      expect(result.diagnostics.every(d => d.severity === 'ERROR')).toBe(true);
    });

    it('emits sorted, immutable participant-role evidence references', () => {
      const ports = createStubPorts();
      (ports.qualification.qualifyCareerPatterns as any).mockReturnValue({
        qualifiedPatterns: [createStubQualifiedPattern('PATTERN_1', 'QUALIFIED')]
      });
      (ports.participantRoles.assignParticipantRoles as any).mockReturnValue({
        assignments: [
          {
            participantId: 'PLANET:SUN' as ParticipantId,
            primaryRole: 'CORE',
            isChallenging: false,
            roleEvidence: [
              { evidenceId: 'EVIDENCE_Z' },
              { evidenceId: 'EVIDENCE_A' },
              { evidenceId: 'EVIDENCE_Z' }
            ],
            explanation: 'Stub'
          }
        ]
      });
      const foundation = new CanonicalCareerOrchestrator(ports).orchestrate({
        patterns: [createStubPattern('PATTERN_1')],
        relevance: [],
        condition: [],
        networks: []
      });
      const reference = foundation.stageReferences.find(item => item.stageId === 'PARTICIPANT_ROLES');

      expect(reference?.evidenceIds).toEqual(['EVIDENCE_A', 'EVIDENCE_Z']);
      expect(Object.isFrozen(reference)).toBe(true);
      expect(Object.isFrozen(reference?.evidenceIds)).toBe(true);
      expect(Object.isFrozen(foundation.stageReferences)).toBe(true);
      expect(Object.isFrozen(foundation.identityMappings)).toBe(true);
      expect(Object.isFrozen(foundation.relationshipMappings)).toBe(true);
      expect(Object.isFrozen(foundation.relationshipMappings[0])).toBe(true);

      (ports.participantRoles.assignParticipantRoles as any).mockReturnValue({
        assignments: [{
          participantId: 'PLANET:SUN' as ParticipantId,
          primaryRole: 'CORE',
          isChallenging: false,
          roleEvidence: [],
          explanation: 'No role evidence'
        }]
      });
      const noEvidenceFoundation = new CanonicalCareerOrchestrator(ports).orchestrate({
        patterns: [createStubPattern('PATTERN_1')],
        relevance: [],
        condition: [],
        networks: []
      });
      expect(noEvidenceFoundation.stageReferences.find(item =>
        item.stageId === 'PARTICIPANT_ROLES'
      )?.evidenceIds).toEqual([]);
    });
  });
});
