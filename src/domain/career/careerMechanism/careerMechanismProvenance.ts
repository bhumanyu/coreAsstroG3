import type {
  CareerMechanismProvenance,
  ParticipantId
} from './careerMechanismTypes';
import { sortParticipantIds } from './careerMechanismUtils';

/**
 * P2-07C Career Mechanism Provenance Helpers
 *
 * This module provides helper functions for building career mechanism provenance records.
 * Per spec §10: provenance tracks the source patterns, relationships, participants, evidence,
 * and stages that contributed to a mechanism.
 *
 * BOUNDARY ENFORCEMENT: This module must NOT import from:
 * - careerDasha
 * - careerD10
 * - careerExpression
 * - careerFinalSynthesis
 * - domain/timing
 */

/**
 * Builds a career mechanism provenance record from constituent records.
 * All arrays are sorted-unique and frozen.
 *
 * @param patternIds - Array of pattern IDs
 * @param relationshipIds - Array of relationship IDs
 * @param participantIds - Array of participant IDs
 * @param evidenceIds - Array of evidence IDs
 * @param sourceStages - Array of source stage identifiers
 * @returns Frozen career mechanism provenance
 */
export function buildCareerMechanismProvenance({
  patternIds = [],
  relationshipIds = [],
  participantIds = [],
  evidenceIds = [],
  sourceStages = []
}: {
  patternIds?: readonly string[];
  relationshipIds?: readonly string[];
  participantIds?: readonly ParticipantId[];
  evidenceIds?: readonly string[];
  sourceStages?: readonly string[];
}): CareerMechanismProvenance {
  // Sort-unique pattern IDs
  const uniquePatternIds = Array.from(new Set(patternIds)).sort();

  // Sort-unique relationship IDs
  const uniqueRelationshipIds = Array.from(new Set(relationshipIds)).sort();

  // Sort-unique participant IDs using canonical order
  const uniqueParticipantIds = sortParticipantIds(
    Array.from(new Set(participantIds))
  );

  // Sort-unique evidence IDs
  const uniqueEvidenceIds = Array.from(new Set(evidenceIds)).sort();

  // Sort-unique source stages
  const uniqueSourceStages = Array.from(new Set(sourceStages)).sort();

  const provenance: CareerMechanismProvenance = Object.freeze({
    patternIds: Object.freeze(uniquePatternIds),
    relationshipIds: Object.freeze(uniqueRelationshipIds),
    participantIds: Object.freeze(uniqueParticipantIds),
    evidenceIds: Object.freeze(uniqueEvidenceIds),
    sourceStages: Object.freeze(uniqueSourceStages)
  });

  return provenance;
}

/**
 * Merges multiple provenance records into one.
 * All arrays are unioned, sorted-unique, and frozen.
 *
 * @param provenances - Array of provenance records to merge
 * @returns Merged and frozen provenance
 */
export function mergeCareerMechanismProvenances(
  provenances: readonly CareerMechanismProvenance[]
): CareerMechanismProvenance {
  const allPatternIds = provenances.flatMap((p) => p.patternIds);
  const allRelationshipIds = provenances.flatMap((p) => p.relationshipIds);
  const allParticipantIds = provenances.flatMap((p) => p.participantIds);
  const allEvidenceIds = provenances.flatMap((p) => p.evidenceIds);
  const allSourceStages = provenances.flatMap((p) => p.sourceStages);

  return buildCareerMechanismProvenance({
    patternIds: allPatternIds,
    relationshipIds: allRelationshipIds,
    participantIds: allParticipantIds,
    evidenceIds: allEvidenceIds,
    sourceStages: allSourceStages
  });
}

/**
 * Checks if two provenance records are equal.
 *
 * @param a - First provenance
 * @param b - Second provenance
 * @returns True if equal, false otherwise
 */
export function areProvenancesEqual(
  a: CareerMechanismProvenance,
  b: CareerMechanismProvenance
): boolean {
  return (
    arraysEqual(a.patternIds, b.patternIds) &&
    arraysEqual(a.relationshipIds, b.relationshipIds) &&
    arraysEqual(a.participantIds, b.participantIds) &&
    arraysEqual(a.evidenceIds, b.evidenceIds) &&
    arraysEqual(a.sourceStages, b.sourceStages)
  );
}

/**
 * Helper function to compare arrays for equality.
 */
function arraysEqual<T>(a: readonly T[], b: readonly T[]): boolean {
  if (a.length !== b.length) {
    return false;
  }
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) {
      return false;
    }
  }
  return true;
}
