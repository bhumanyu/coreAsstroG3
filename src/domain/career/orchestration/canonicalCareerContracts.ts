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
  CareerMechanism,
  CareerMechanismType
} from '../careerMechanism/careerMechanismTypes';
import type {
  Career10HFoundation,
  Career10HFoundationStatus
} from '../career10h/career10HFoundationTypes';
import type {
  Career10LFoundation,
  Career10LStatus
} from '../career10h/career10LFoundationTypes';

/**
 * P2-11B Canonical Career Orchestrator Contracts
 *
 * This module defines the type system for the canonical career orchestrator layer that sits
 * ABOVE all existing career domain modules (C4–C7, P2-07A–E, 10H-10L) and composes their
 * outputs into a single immutable CanonicalCareerFoundation.
 *
 * This is a COMPOSITION LAYER ONLY - it does NOT implement any astrology rules. It validates
 * contracts, preserves identities/provenance, composes existing engines, records diagnostics,
 * and represents missing data explicitly.
 *
 * BOUNDARY ENFORCEMENT: This module must NOT import from:
 * - careerDasha
 * - careerD10
 * - careerExpression
 * - careerFinalSynthesis
 * - domain/timing
 * - AI modules
 *
 * NO new astrology logic - only composition, validation, and diagnostic recording.
 */

/**
 * Branded identity key for evidence records.
 * Preserves the producer's identity key namespace - never fabricated.
 */
export type EvidenceIdentityKey = string & { readonly __brand: 'EvidenceIdentityKey' };

/**
 * Branded occurrence ID for evidence occurrences.
 * Preserves the producer's occurrence ID namespace - never fabricated.
 */
export type OccurrenceId = string & { readonly __brand: 'OccurrenceId' };

/**
 * Branded source ID for evidence sources.
 * Preserves the producer's source ID namespace - never fabricated.
 */
export type SourceId = string & { readonly __brand: 'SourceId' };

/**
 * Branded rule ID for rules.
 * Preserves the producer's rule ID namespace - never fabricated.
 */
export type RuleId = string & { readonly __brand: 'RuleId' };

/**
 * Branded mechanism ID for mechanisms.
 * Preserves the producer's mechanism ID namespace - never fabricated.
 */
export type MechanismId = string & { readonly __brand: 'MechanismId' };

/**
 * Evidence record from a production stage.
 * Preserves the producer's identity without modification.
 */
export interface StageEvidence {
  readonly evidenceId: string;
  readonly identityKey: EvidenceIdentityKey;
  readonly statement: string;
  readonly sourceIds: readonly SourceId[];
  readonly ruleIds: readonly RuleId[];
  readonly occurrenceId?: OccurrenceId;
}

/**
 * Reference to a production stage.
 * Identifies which stage produced a piece of evidence.
 */
export interface StageReference {
  readonly stageId: string;
  readonly stageName: string;
  readonly evidenceIds: readonly string[];
}

/**
 * Pattern candidate from the pattern layer (C4/P2-03).
 * Wraps the producer's CareerPattern with orchestration-level metadata.
 */
export interface PatternCandidate {
  readonly patternId: string;
  readonly identityKey: string;
  readonly family: CareerPatternFamily;
  readonly level: CareerPatternLevel;
  readonly classification: CareerPatternClassification;
  readonly name: string;
  readonly sourcePattern: CareerPattern;
  readonly stageEvidence: readonly StageEvidence[];
}

/**
 * Pattern qualification from the qualification layer (P2-07A).
 * Wraps the producer's QualifiedCareerPattern with orchestration-level metadata.
 *
 * Uses INSUFFICIENT_DATA instead of INDETERMINATE to match the repo's vocabulary.
 * INSUFFICIENT_DATA is NOT treated as negative/unqualified - it represents missing data.
 */
export interface PatternQualification {
  readonly patternId: string;
  readonly identityKey: string;
  readonly status: CareerPatternQualificationStatus;
  readonly qualifiedPattern: QualifiedCareerPattern;
  readonly stageEvidence: readonly StageEvidence[];
}

/**
 * Participant role assignment at the orchestration level.
 * Wraps the producer's participant role assignment with pattern provenance.
 *
 * This is separate from the engine-level ParticipantRoleAssignment to include
 * orchestration-level provenance tracking (patternId, patternIdentityKey).
 */
export interface ParticipantRoleAssignment {
  readonly patternId: string;
  readonly patternIdentityKey: string;
  readonly assignment: import('../careerParticipantRoles/participantRoleTypes').ParticipantRoleAssignment;
}

/**
 * Resolved mechanism from the mechanism resolver (P2-07D).
 * Wraps the producer's CareerMechanismCandidate with orchestration-level metadata.
 */
export interface ResolvedMechanism {
  readonly candidateId: string;
  readonly patternId: string;
  readonly mechanismType: CareerMechanismType;
  readonly candidate: CareerMechanismCandidate;
  readonly candidateSet: CareerMechanismCandidateSet;
  readonly stageEvidence: readonly StageEvidence[];
}

/**
 * Mechanism refinement from the dispositor refiner (P2-07E).
 * Wraps the producer's CareerMechanism with refinement status.
 *
 * Maps the engine's Refined status to orchestration-level status:
 * - Refined → REFINED
 * - Unchanged → UNCHANGED
 * - InsufficientData/missing → UNAVAILABLE
 */
export interface MechanismRefinement {
  readonly mechanismId: string;
  readonly candidateId: string;
  readonly mechanismType: CareerMechanismType;
  readonly status: 'REFINED' | 'UNCHANGED' | 'UNAVAILABLE';
  readonly mechanism: CareerMechanism | null;
  readonly stageEvidence: readonly StageEvidence[];
}

/**
 * Career foundation supplement from 10H/10L layers (P2-07F/G).
 * Wraps the producer's 10H/10L foundations with availability status.
 *
 * Maps the engine's status to orchestration-level availability:
 * - COMPLETE → AVAILABLE
 * - INSUFFICIENT_DATA → PARTIALLY_AVAILABLE or UNAVAILABLE based on missingInputs
 */
export interface CareerFoundationSupplement {
  readonly supplementId: string;
  readonly supplementType: '10H' | '10L';
  readonly availability: 'AVAILABLE' | 'PARTIALLY_AVAILABLE' | 'UNAVAILABLE';
  readonly foundation10H: Career10HFoundation | null;
  readonly foundation10L: Career10LFoundation | null;
  readonly status10H: Career10HFoundationStatus;
  readonly status10L: Career10LStatus;
  readonly missingInputs: readonly string[];
  readonly stageEvidence: readonly StageEvidence[];
}

/**
 * Identity mapping across stages.
 * Records explicit identity equivalences declared by producers.
 * Never infers identity from string similarity - only validates explicit mappings.
 */
export interface IdentityMapping {
  readonly mappingId: string;
  readonly sourceStage: string;
  readonly targetStage: string;
  readonly sourceIdentityKey: EvidenceIdentityKey;
  readonly targetIdentityKey: EvidenceIdentityKey;
  readonly mappingType: 'EQUIVALENCE' | 'DERIVATION' | 'AGGREGATION';
}

/**
 * Orchestration diagnostic.
 * Records warnings, errors, and informational messages during orchestration.
 */
export interface OrchestrationDiagnostic {
  readonly diagnosticId: string;
  readonly severity: 'ERROR' | 'WARNING' | 'INFO';
  readonly category: string;
  readonly message: string;
  readonly relatedIds: readonly string[];
  readonly stage?: string;
}

/**
 * Canonical career foundation.
 * The immutable, deterministic composition of all career domain outputs.
 *
 * Invariants:
 * - All outputs are deeply frozen
 * - Output is deterministic and input-order independent
 * - Missing data is represented explicitly (never fabricated)
 * - Identity keys are preserved from producers (never modified)
 * - All provenance is tracked (patternIds, evidenceIds, ruleIds, mechanismIds)
 */
export interface CanonicalCareerFoundation {
  readonly foundationId: string;
  readonly timestamp: string;

  // Pattern layer (C4/P2-03)
  readonly patternCandidates: readonly PatternCandidate[];

  // Qualification layer (P2-07A)
  readonly patternQualifications: readonly PatternQualification[];

  // Participant roles layer (P2-07B)
  readonly participantRoleAssignments: readonly ParticipantRoleAssignment[];

  // Mechanism layer (P2-07D)
  readonly resolvedMechanisms: readonly ResolvedMechanism[];

  // Mechanism refinement layer (P2-07E)
  readonly mechanismRefinements: readonly MechanismRefinement[];

  // 10H/10L supplement layers (P2-07F/G)
  readonly careerFoundationSupplements: readonly CareerFoundationSupplement[];

  // Identity mappings
  readonly identityMappings: readonly IdentityMapping[];

  // Stage references
  readonly stageReferences: readonly StageReference[];

  // Diagnostics
  readonly diagnostics: readonly OrchestrationDiagnostic[];

  // Metadata
  readonly metadata: {
    readonly totalPatterns: number;
    readonly totalQualifiedPatterns: number;
    readonly totalMechanisms: number;
    readonly totalRefinedMechanisms: number;
    readonly dataCompleteness: 'COMPLETE' | 'PARTIAL' | 'INSUFFICIENT';
  };
}

/**
 * Input for canonical career orchestration.
 * Contains the outputs from all production stages.
 */
export interface CanonicalCareerOrchestrationInput {
  // Pattern layer (C4/P2-03)
  readonly patterns: readonly CareerPattern[];

  // Qualification layer (P2-07A)
  readonly relevance: readonly CareerPlanetaryRelevance[];
  readonly condition: readonly CareerPlanetaryConditionResult[];

  // Networks (P2-06)
  readonly networks: readonly CareerHouseNetwork[];

  // 10H/10L supplements (P2-07F/G)
  readonly foundation10H?: Career10HFoundation;
  readonly foundation10L?: Career10LFoundation;
}

/**
 * Port interface for qualification (P2-07A).
 * Abstracts the pattern qualification engine.
 */
export interface QualificationPort {
  /**
   * Qualifies career patterns based on relevance and condition.
   *
   * @param input - Patterns, relevance, and condition data
   * @returns Qualified patterns
   */
  qualifyCareerPatterns(input: {
    readonly patterns: readonly CareerPattern[];
    readonly relevance: readonly CareerPlanetaryRelevance[];
    readonly condition: readonly CareerPlanetaryConditionResult[];
  }): {
    readonly qualifiedPatterns: readonly QualifiedCareerPattern[];
  };
}

/**
 * Port interface for participant roles (P2-07B).
 * Abstracts the participant role assignment engine.
 */
export interface ParticipantRolesPort {
  /**
   * Assigns participant roles for a single pattern.
   *
   * @param context - Pattern, qualification, networks, conditions, and relevance
   * @returns Participant role assignments
   */
  assignParticipantRoles(context: {
    readonly pattern: CareerPattern;
    readonly qualification: QualifiedCareerPattern;
    readonly networks: readonly CareerHouseNetwork[];
    readonly planetaryConditions: readonly CareerPlanetaryConditionResult[];
    readonly relevance: readonly CareerPlanetaryRelevance[];
  }): {
    readonly assignments: readonly ParticipantRoleAssignment[];
  };
}

/**
 * Port interface for mechanism resolution (P2-07D).
 * Abstracts the mechanism resolver engine.
 */
export interface MechanismResolverPort {
  /**
   * Resolves mechanism candidates for a single pattern.
   *
   * @param input - Pattern, qualification, participant roles, establishing evidence, networks
   * @returns Mechanism candidate set
   */
  resolve(input: {
    readonly pattern: CareerPattern;
    readonly qualification: QualifiedCareerPattern;
    readonly participantRoles: readonly ParticipantRoleAssignment[];
    readonly establishingEvidence: readonly import('../careerMechanism/careerMechanismTypes').CareerMechanismEvidence[];
    readonly networks: readonly CareerHouseNetwork[];
  }): import('../careerMechanism/careerMechanismTypes').CareerMechanismCandidateSet;

  /**
   * Resolves mechanism candidates for multiple patterns.
   *
   * @param inputs - Array of resolution inputs
   * @returns Array of candidate sets (one per input)
   */
  resolveAll(inputs: readonly {
    readonly pattern: CareerPattern;
    readonly qualification: QualifiedCareerPattern;
    readonly participantRoles: readonly ParticipantRoleAssignment[];
    readonly establishingEvidence: readonly import('../careerMechanism/careerMechanismTypes').CareerMechanismEvidence[];
    readonly networks: readonly CareerHouseNetwork[];
  }[]): readonly import('../careerMechanism/careerMechanismTypes').CareerMechanismCandidateSet[];
}

/**
 * Port interface for mechanism refinement (P2-07E).
 * Abstracts the dispositor refiner engine.
 */
export interface MechanismRefinerPort {
  /**
   * Refines a mechanism candidate using dispositor contexts.
   *
   * @param input - Candidate, dispositor contexts, and optional participant role overrides
   * @returns Refinement result
   */
  refine(input: {
    readonly candidate: CareerMechanismCandidate;
    readonly dispositorContexts: readonly import('../careerMechanism/dispositor/careerMechanismDispositorTypes').CareerDispositorContext[];
    readonly coreParticipants?: readonly string[];
    readonly supportingParticipants?: readonly string[];
    readonly challengingParticipants?: readonly string[];
  }): import('../careerMechanism/dispositor/careerMechanismDispositorTypes').CareerMechanismDispositorRefinementResult;
}

/**
 * Orchestration ports.
 * All dependencies injected into the orchestrator.
 */
export interface CareerOrchestrationPorts {
  readonly qualification: QualificationPort;
  readonly participantRoles: ParticipantRolesPort;
  readonly mechanismResolver: MechanismResolverPort;
  readonly mechanismRefiner: MechanismRefinerPort;
}
