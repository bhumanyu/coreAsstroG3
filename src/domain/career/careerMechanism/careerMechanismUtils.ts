import type {
  CareerMechanism,
  CareerMechanismCandidate,
  CareerMechanismEvidence,
  CareerMechanismInput,
  CareerMechanismProvenance,
  ParticipantId
} from './careerMechanismTypes';
import { CANONICAL_PLANET_ORDER } from '../careerPlanetOrder';

/**
 * P2-07C Career Mechanism Utility Functions
 *
 * This module provides utility functions for creating and manipulating career mechanisms.
 * Per spec §16: ID generation, evidence deduplication, participant ordering, and mechanism creation.
 *
 * BOUNDARY ENFORCEMENT: This module must NOT import from:
 * - careerDasha
 * - careerD10
 * - careerExpression
 * - careerFinalSynthesis
 * - domain/timing
 *
 * No Date/random/UUID usage — all IDs are deterministic and derived from input data.
 */

/**
 * Creates a career mechanism ID.
 * Format: CAREER_MECHANISM:{patternId}:{mechanismType}
 *
 * @param patternId - The pattern ID
 * @param mechanismType - The mechanism type
 * @returns Deterministic mechanism ID
 */
export function createCareerMechanismId(
  patternId: string,
  mechanismType: string
): string {
  return `CAREER_MECHANISM:${patternId}:${mechanismType}`;
}

/**
 * Creates a career mechanism candidate ID.
 * Format: CAREER_MECHANISM_CANDIDATE:{patternId}:{mechanismType}
 *
 * @param patternId - The pattern ID
 * @param mechanismType - The mechanism type
 * @returns Deterministic candidate ID
 */
export function createCareerMechanismCandidateId(
  patternId: string,
  mechanismType: string
): string {
  return `CAREER_MECHANISM_CANDIDATE:${patternId}:${mechanismType}`;
}

/**
 * Creates a career mechanism evidence ID.
 * Format: CAREER_MECHANISM_EVIDENCE:{mechanismId}:{source}:{participantId}:{relationshipId}
 *
 * @param mechanismId - The mechanism ID
 * @param source - The evidence source
 * @param participantId - The participant ID (optional)
 * @param relationshipId - The relationship ID (optional)
 * @returns Deterministic evidence ID
 */
export function createCareerMechanismEvidenceId(
  mechanismId: string,
  source: string,
  participantId?: string,
  relationshipId?: string
): string {
  const parts = [
    'CAREER_MECHANISM_EVIDENCE',
    mechanismId,
    source,
    participantId || 'NONE',
    relationshipId || 'NONE'
  ];
  return parts.join(':');
}

/**
 * Compares two participant IDs for sorting.
 * Uses canonical planet order from careerPlanetOrder.
 *
 * @param a - First participant ID
 * @param b - Second participant ID
 * @returns Comparison result (-1, 0, 1)
 */
export function compareParticipantIds(a: ParticipantId, b: ParticipantId): number {
  const planetA = a.replace('PLANET:', '');
  const planetB = b.replace('PLANET:', '');

  const indexA = CANONICAL_PLANET_ORDER.indexOf(planetA as any);
  const indexB = CANONICAL_PLANET_ORDER.indexOf(planetB as any);

  if (indexA === -1 && indexB === -1) {
    return a.localeCompare(b);
  }
  if (indexA === -1) {
    return 1;
  }
  if (indexB === -1) {
    return -1;
  }

  return indexA - indexB;
}

/**
 * Sorts participant IDs using canonical planet order.
 *
 * @param participantIds - Array of participant IDs to sort
 * @returns Sorted array of participant IDs
 */
export function sortParticipantIds(
  participantIds: readonly ParticipantId[]
): readonly ParticipantId[] {
  return [...participantIds].sort(compareParticipantIds);
}

/**
 * Deduplicates career mechanism evidence.
 * Maps by evidenceId, sorts by evidenceId, and returns a frozen array.
 *
 * @param evidence - Array of evidence records
 * @returns Deduplicated and frozen evidence array
 */
export function deduplicateCareerMechanismEvidence(
  evidence: readonly CareerMechanismEvidence[]
): readonly CareerMechanismEvidence[] {
  const evidenceMap = new Map<string, CareerMechanismEvidence>();

  for (const ev of evidence) {
    if (!evidenceMap.has(ev.evidenceId)) {
      evidenceMap.set(ev.evidenceId, ev);
    }
  }

  const deduplicated = Array.from(evidenceMap.values()).sort((a, b) =>
    a.evidenceId.localeCompare(b.evidenceId)
  );

  return Object.freeze(deduplicated);
}

/**
 * Creates a career mechanism from input.
 * Per spec §16: deep-freezes all arrays and rebuilds provenance.evidenceIds
 * from the deduplicated evidence.
 *
 * @param input - The mechanism input
 * @returns Frozen career mechanism
 */
export function createCareerMechanism(
  input: CareerMechanismInput
): CareerMechanism {
  const {
    patternId,
    mechanismType,
    pathway,
    participants,
    coreParticipants,
    supportingParticipants,
    challengingParticipants,
    status,
    explanation,
    evidence,
    provenance
  } = input;

  const mechanismId = createCareerMechanismId(patternId, mechanismType);

  // Deduplicate evidence
  const deduplicatedEvidence = deduplicateCareerMechanismEvidence(evidence);

  // Rebuild provenance.evidenceIds from deduplicated evidence
  const evidenceIds = deduplicatedEvidence.map((ev) => ev.evidenceId).sort();

  // Sort and freeze participant arrays
  const sortedParticipants = sortParticipantIds(participants);
  const sortedCoreParticipants = sortParticipantIds(coreParticipants);
  const sortedSupportingParticipants = sortParticipantIds(supportingParticipants);
  const sortedChallengingParticipants = sortParticipantIds(challengingParticipants);

  // Sort and freeze provenance arrays
  const sortedPatternIds = [...provenance.patternIds].sort();
  const sortedRelationshipIds = [...provenance.relationshipIds].sort();
  const sortedProvenanceParticipantIds = sortParticipantIds(provenance.participantIds);
  const sortedSourceStages = [...provenance.sourceStages].sort();

  const rebuiltProvenance: CareerMechanismProvenance = Object.freeze({
    patternIds: Object.freeze(sortedPatternIds),
    relationshipIds: Object.freeze(sortedRelationshipIds),
    participantIds: Object.freeze(sortedProvenanceParticipantIds),
    evidenceIds: Object.freeze(evidenceIds),
    sourceStages: Object.freeze(sortedSourceStages)
  });

  const mechanism: CareerMechanism = Object.freeze({
    mechanismId,
    patternId,
    mechanismType,
    pathway,
    participants: Object.freeze(sortedParticipants),
    coreParticipants: Object.freeze(sortedCoreParticipants),
    supportingParticipants: Object.freeze(sortedSupportingParticipants),
    challengingParticipants: Object.freeze(sortedChallengingParticipants),
    status,
    explanation,
    evidence: Object.freeze(deduplicatedEvidence),
    provenance: rebuiltProvenance
  });

  return mechanism;
}

/**
 * Creates a career mechanism candidate from input.
 * Deep-freezes all arrays.
 *
 * @param patternId - The pattern ID
 * @param mechanismType - The mechanism type
 * @param pathway - The mechanism pathway
 * @param evidence - The evidence array
 * @param provenance - The provenance object
 * @param explanation - The explanation text
 * @returns Frozen career mechanism candidate
 */
export function createCareerMechanismCandidate(
  patternId: string,
  mechanismType: string,
  pathway: string,
  evidence: readonly CareerMechanismEvidence[],
  provenance: CareerMechanismProvenance,
  explanation: string
): CareerMechanismCandidate {
  const candidateId = createCareerMechanismCandidateId(patternId, mechanismType);

  // Deduplicate evidence
  const deduplicatedEvidence = deduplicateCareerMechanismEvidence(evidence);

  // Sort and freeze provenance arrays
  const sortedPatternIds = [...provenance.patternIds].sort();
  const sortedRelationshipIds = [...provenance.relationshipIds].sort();
  const sortedParticipantIds = sortParticipantIds(provenance.participantIds);
  const sortedEvidenceIds = deduplicatedEvidence.map((ev) => ev.evidenceId).sort();
  const sortedSourceStages = [...provenance.sourceStages].sort();

  const rebuiltProvenance: CareerMechanismProvenance = Object.freeze({
    patternIds: Object.freeze(sortedPatternIds),
    relationshipIds: Object.freeze(sortedRelationshipIds),
    participantIds: Object.freeze(sortedParticipantIds),
    evidenceIds: Object.freeze(sortedEvidenceIds),
    sourceStages: Object.freeze(sortedSourceStages)
  });

  const candidate: CareerMechanismCandidate = Object.freeze({
    candidateId,
    patternId,
    mechanismType: mechanismType as any,
    pathway: pathway as any,
    evidence: Object.freeze(deduplicatedEvidence),
    provenance: rebuiltProvenance,
    explanation
  });

  return candidate;
}
