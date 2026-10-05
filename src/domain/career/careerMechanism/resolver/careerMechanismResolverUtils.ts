import type {
  CareerMechanismCandidate,
  CareerMechanismCandidateSet,
  CareerMechanismEvidence,
  CareerMechanismProvenance
} from '../careerMechanismTypes';

/**
 * P2-07D Career Mechanism Resolver Utilities
 *
 * This module provides utility functions for the mechanism resolver.
 * Per spec §25: candidate set creation, deduplication, sorting, and merging.
 *
 * BOUNDARY ENFORCEMENT: This module must NOT import from:
 * - careerDasha
 * - careerD10
 * - careerExpression
 * - careerFinalSynthesis
 * - domain/timing
 * - any AI/profession module
 */

/**
 * Compares two mechanism candidates for sorting.
 * Sorts by mechanismType first, then candidateId.
 *
 * @param a - First candidate
 * @param b - Second candidate
 * @returns Comparison result (-1, 0, 1)
 */
export function compareCareerMechanismCandidates(
  a: CareerMechanismCandidate,
  b: CareerMechanismCandidate
): number {
  // First compare by mechanismType
  const typeCompare = a.mechanismType.localeCompare(b.mechanismType);
  if (typeCompare !== 0) {
    return typeCompare;
  }

  // Then compare by candidateId
  return a.candidateId.localeCompare(b.candidateId);
}

/**
 * Deduplicates mechanism candidates by candidateId.
 * Returns a frozen array of unique candidates.
 *
 * @param candidates - Array of candidates to deduplicate
 * @returns Deduplicated and frozen array
 */
export function deduplicateCareerMechanismCandidates(
  candidates: readonly CareerMechanismCandidate[]
): readonly CareerMechanismCandidate[] {
  const candidateMap = new Map<string, CareerMechanismCandidate>();

  for (const candidate of candidates) {
    if (!candidateMap.has(candidate.candidateId)) {
      candidateMap.set(candidate.candidateId, candidate);
    }
  }

  const deduplicated = Array.from(candidateMap.values()).sort(
    compareCareerMechanismCandidates
  );

  return Object.freeze(deduplicated);
}

/**
 * Merges evidence from multiple candidates.
 * Deduplicates by evidenceId and sorts by evidenceId.
 *
 * @param evidenceArrays - Array of evidence arrays to merge
 * @returns Merged, deduplicated, and frozen evidence array
 */
export function mergeCandidateEvidence(
  evidenceArrays: readonly (readonly CareerMechanismEvidence[])[]
): readonly CareerMechanismEvidence[] {
  const evidenceMap = new Map<string, CareerMechanismEvidence>();

  for (const evidenceArray of evidenceArrays) {
    for (const evidence of evidenceArray) {
      if (!evidenceMap.has(evidence.evidenceId)) {
        evidenceMap.set(evidence.evidenceId, evidence);
      }
    }
  }

  const merged = Array.from(evidenceMap.values()).sort((a, b) =>
    a.evidenceId.localeCompare(b.evidenceId)
  );

  return Object.freeze(merged);
}

/**
 * Merges provenance from multiple candidates.
 * Unions all arrays, sorts-unique, and freezes.
 *
 * @param provenances - Array of provenance records to merge
 * @returns Merged and frozen provenance
 */
export function mergeCandidateProvenances(
  provenances: readonly CareerMechanismProvenance[]
): CareerMechanismProvenance {
  const allPatternIds = provenances.flatMap((p) => p.patternIds);
  const allRelationshipIds = provenances.flatMap((p) => p.relationshipIds);
  const allParticipantIds = provenances.flatMap((p) => p.participantIds);
  const allEvidenceIds = provenances.flatMap((p) => p.evidenceIds);
  const allSourceStages = provenances.flatMap((p) => p.sourceStages);

  const uniquePatternIds = Array.from(new Set(allPatternIds)).sort();
  const uniqueRelationshipIds = Array.from(new Set(allRelationshipIds)).sort();
  const uniqueParticipantIds = Array.from(new Set(allParticipantIds)).sort();
  const uniqueEvidenceIds = Array.from(new Set(allEvidenceIds)).sort();
  const uniqueSourceStages = Array.from(new Set(allSourceStages)).sort();

  return Object.freeze({
    patternIds: Object.freeze(uniquePatternIds),
    relationshipIds: Object.freeze(uniqueRelationshipIds),
    participantIds: Object.freeze(uniqueParticipantIds),
    evidenceIds: Object.freeze(uniqueEvidenceIds),
    sourceStages: Object.freeze(uniqueSourceStages)
  });
}

/**
 * Creates a career mechanism candidate set.
 * Deduplicates candidates by candidateId, sorts by compareCareerMechanismCandidates,
 * merges evidence and provenance, and deep-freezes.
 *
 * @param patternId - The pattern ID
 * @param candidates - Array of candidates to include in the set
 * @returns Frozen candidate set
 */
export function createCareerMechanismCandidateSet(
  patternId: string,
  candidates: readonly CareerMechanismCandidate[]
): CareerMechanismCandidateSet {
  // Deduplicate and sort candidates
  const deduplicatedCandidates = deduplicateCareerMechanismCandidates(candidates);

  // Merge evidence from all candidates
  const mergedEvidence = mergeCandidateEvidence(
    deduplicatedCandidates.map((c) => c.evidence)
  );

  // Merge provenance from all candidates
  const mergedProvenance = mergeCandidateProvenances(
    deduplicatedCandidates.map((c) => c.provenance)
  );

  return Object.freeze({
    patternId,
    candidates: Object.freeze(deduplicatedCandidates),
    evidence: Object.freeze(mergedEvidence),
    provenance: Object.freeze(mergedProvenance)
  });
}
