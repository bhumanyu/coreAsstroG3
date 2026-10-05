/**
 * P2-07C Career Mechanism Module
 *
 * Public API for the canonical career mechanism MODEL and RESOLVER.
 * This module provides the pure data model for career mechanisms — the vocabulary,
 * families, pathways, status, evidence sources, and canonical records — plus the
 * mechanism resolution layer (P2-07D) that maps pattern structural facts to mechanism
 * candidates.
 *
 * Per spec §22: surface exports for the mechanism model and resolver.
 * Dispositor refinement (P2-07E) is a separate module.
 */

// Types (§3–§11, §20–§21)
export type {
  CareerMechanismType,
  CareerMechanismFamily,
  CareerMechanismPathway,
  CareerMechanismStatus,
  CareerMechanismEvidenceSource,
  CareerMechanismRefinementSource,
  CareerMechanismEvidenceRole,
  CareerMechanismSourceStage,
  CareerMechanismDefinition,
  CareerMechanismEvidence,
  CareerMechanismProvenance,
  CareerMechanism,
  CareerMechanismInput,
  CareerMechanismCandidate,
  CareerMechanismCandidateSet
} from './careerMechanismTypes';

// Registry (§18)
export {
  CAREER_MECHANISM_DEFINITIONS,
  DefaultCareerMechanismRegistry,
  defaultCareerMechanismRegistry
} from './careerMechanismRegistry';
export type { CareerMechanismRegistry } from './careerMechanismRegistry';

// Utils (§16)
export {
  createCareerMechanismId,
  createCareerMechanismCandidateId,
  createCareerMechanismEvidenceId,
  compareParticipantIds,
  sortParticipantIds,
  deduplicateCareerMechanismEvidence,
  createCareerMechanism,
  createCareerMechanismCandidate
} from './careerMechanismUtils';

// Evidence helpers (§9)
export {
  buildCareerMechanismEvidence,
  buildCareerMechanismEvidenceArray,
  buildRefiningMechanismEvidence,
  buildRefiningMechanismEvidenceArray
} from './careerMechanismEvidence';

// Provenance helpers (§10)
export {
  buildCareerMechanismProvenance,
  mergeCareerMechanismProvenances,
  areProvenancesEqual
} from './careerMechanismProvenance';

// Resolver (P2-07D)
export type {
  CareerMechanismResolutionInput,
  CareerMechanismResolutionRule,
  CareerMechanismResolver
} from './resolver/careerMechanismResolverTypes';
export {
  CAREER_MECHANISM_RESOLUTION_RULES
} from './resolver/careerMechanismResolverRules';
export {
  DefaultCareerMechanismResolver,
  defaultCareerMechanismResolver
} from './resolver/defaultCareerMechanismResolver';
export {
  compareCareerMechanismCandidates,
  deduplicateCareerMechanismCandidates,
  mergeCandidateEvidence,
  mergeCandidateProvenances,
  createCareerMechanismCandidateSet
} from './resolver/careerMechanismResolverUtils';
