/**
 * P2-07C Career Mechanism Module
 *
 * Public API for the canonical career mechanism MODEL.
 * This module provides the pure data model for career mechanisms — the vocabulary,
 * families, pathways, status, evidence sources, and canonical records.
 *
 * Per spec §22: surface exports for the mechanism model only.
 * Resolution rules (P2-07D) and dispositor refinement (P2-07E) are separate modules.
 */

// Types (§3–§11, §20–§21)
export type {
  CareerMechanismType,
  CareerMechanismFamily,
  CareerMechanismPathway,
  CareerMechanismStatus,
  CareerMechanismEvidenceSource,
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
  buildCareerMechanismEvidenceArray
} from './careerMechanismEvidence';

// Provenance helpers (§10)
export {
  buildCareerMechanismProvenance,
  mergeCareerMechanismProvenances,
  areProvenancesEqual
} from './careerMechanismProvenance';
