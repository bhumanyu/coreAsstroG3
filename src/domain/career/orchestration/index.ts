/**
 * P2-11B Canonical Career Orchestrator
 *
 * Public API for the canonical career orchestration layer.
 *
 * This module provides:
 * - CanonicalCareerOrchestrator: The main orchestrator class
 * - Port interfaces: Dependency injection contracts
 * - Port adapters: Real engine wiring
 * - Contracts: Type definitions and branded IDs
 * - Validation: Boundary validation helpers
 * - Foundation Builder: P2-11G production integration boundary
 *
 * USAGE:
 * ```typescript
 * import {
 *   CanonicalCareerOrchestrator,
 *   defaultCareerOrchestrationPorts
 * } from './orchestration';
 *
 * const orchestrator = new CanonicalCareerOrchestrator(defaultCareerOrchestrationPorts);
 * const foundation = orchestrator.orchestrate(input);
 * ```
 *
 * P2-11G USAGE:
 * ```typescript
 * import {
 *   buildCanonicalCareerFoundation
 * } from './orchestration';
 *
 * const foundation = buildCanonicalCareerFoundation({ horoscope });
 * ```
 */

// Main orchestrator
export { CanonicalCareerOrchestrator } from './canonicalCareerOrchestrator';

// Contracts and types
export type {
  EvidenceIdentityKey,
  OccurrenceId,
  SourceId,
  RuleId,
  MechanismId,
  StageEvidence,
  StageReference,
  PatternCandidate,
  PatternQualification,
  ParticipantRoleAssignment,
  ResolvedMechanism,
  MechanismRefinement,
  CareerFoundationSupplement,
  IdentityMapping,
  OrchestrationDiagnostic,
  CanonicalCareerFoundation,
  CanonicalCareerOrchestrationInput,
  QualificationPort,
  ParticipantRolesPort,
  MechanismResolverPort,
  MechanismRefinerPort,
  CareerOrchestrationPorts
} from './canonicalCareerContracts';

// Validation helpers
export {
  validateUniquePatternIds,
  validateQualificationPatternReferences,
  validateUniqueMechanismIds,
  validateMechanismPatternReferences,
  validateRefinementCandidateReferences,
  validateIdentityMappings,
  validateCanonicalCareerFoundation
} from './canonicalCareerValidation';

// Port adapters
export {
  QualificationPortAdapter,
  ParticipantRolesPortAdapter,
  MechanismResolverPortAdapter,
  MechanismRefinerPortAdapter,
  qualificationPortAdapter,
  participantRolesPortAdapter,
  mechanismResolverPortAdapter,
  mechanismRefinerPortAdapter,
  defaultCareerOrchestrationPorts
} from './canonicalCareerPortsAdapter';

// P2-11G Foundation Builder
export {
  buildCanonicalCareerFoundation,
  type CanonicalCareerFoundationBuilderInput
} from './canonicalCareerFoundationBuilder';
