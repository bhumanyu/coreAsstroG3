import type {
  CareerExpressionCandidate,
  CareerExpressionEvidence,
  CareerExpressionProvenance
} from './careerExpressionTypes';
import type { ParticipantId } from '../careerParticipantRoles';
import { compareParticipantIds } from '../careerMechanism/careerMechanismUtils';

/**
 * P2-08A Career Expression Utility Functions
 *
 * This module provides utility functions for creating and manipulating career expressions.
 * Per spec §8: ID generation, evidence deduplication, canonical sorting, and expression creation.
 *
 * BOUNDARY ENFORCEMENT: This module must NOT import from:
 * - careerDasha
 * - careerD10
 * - d10/
 * - careerFinalSynthesis
 * - domain/timing
 * - transit
 * - profession
 * - ai
 * - legacy careerExpression.ts
 *
 * No Date/random/UUID usage — all IDs are deterministic and derived from input data.
 */

/**
 * Creates a career expression ID.
 * Format: CAREER_EXPRESSION:{expressionType}:M[{mechanismIds}]
 *
 * @param expressionType - The expression type
 * @param mechanismIds - Array of source mechanism IDs (will be sorted internally)
 * @returns Deterministic expression ID
 */
export function createCareerExpressionId(
  expressionType: string,
  mechanismIds: readonly string[]
): string {
  // Sort mechanismIds lexicographically for canonical order
  const sortedMechanismIds = [...mechanismIds].sort();
  return `CAREER_EXPRESSION:${expressionType}:M[${sortedMechanismIds.join(',')}]`;
}

/**
 * Creates an expression evidence ID.
 * Format: CAREER_EXPRESSION_EVIDENCE:{ruleId}:SM[{sourceMechanismIds}]:SE[{sourceEvidenceIds}]
 * Always emits both SM[...] and SE[...] segments (empty brackets when empty) so segment position is unambiguous.
 *
 * Per spec §8: Evidence ID must include ruleId + sorted sourceMechanismIds + sorted sourceEvidenceIds
 * — not just mechanism type.
 *
 * This function is self-canonicalizing: it sorts sourceMechanismIds and sourceEvidenceIds lexicographically
 * before joining, ensuring identical IDs regardless of caller-provided order.
 *
 * @param ruleId - The rule ID that produced this evidence
 * @param sourceMechanismId - The source mechanism ID
 * @param sourceEvidenceIds - Array of source evidence IDs (will be sorted internally)
 * @returns Deterministic evidence ID
 */
export function createExpressionEvidenceId(
  ruleId: string,
  sourceMechanismId: string,
  sourceEvidenceIds: readonly string[] = []
): string {
  // Sort sourceEvidenceIds lexicographically
  const sortedSourceEvidenceIds = [...sourceEvidenceIds].sort();

  return [
    'CAREER_EXPRESSION_EVIDENCE',
    ruleId,
    `SM[${sourceMechanismId}]`,
    `SE[${sortedSourceEvidenceIds.join(',')}]`
  ].join(':');
}

/**
 * Creates an expression rule ID.
 * Format: RULE_EXPRESSION:{ruleId}
 *
 * @param ruleId - The rule identifier
 * @returns Deterministic rule ID
 */
export function createExpressionRuleId(ruleId: string): string {
  return `RULE_EXPRESSION:${ruleId}`;
}

/**
 * Deduplicates expression candidates by (expressionType, canonical-source-set).
 * Merges provenance from duplicates and returns a frozen array sorted by expressionId.
 *
 * @param candidates - Array of expression candidates
 * @returns Deduplicated, merged, and frozen expression candidate array
 */
export function deduplicateExpressionCandidates(
  candidates: readonly CareerExpressionCandidate[]
): readonly CareerExpressionCandidate[] {
  const candidateMap = new Map<string, CareerExpressionCandidate>();

  for (const candidate of candidates) {
    // Canonical key: expressionType + sorted sourceMechanismIds
    const key = `${candidate.expressionType}:${[...candidate.sourceMechanismIds].sort().join(',')}`;

    if (candidateMap.has(key)) {
      // Merge provenance with existing candidate
      const existing = candidateMap.get(key)!;
      const mergedProvenance = mergeExpressionProvenances(
        existing.provenance,
        candidate.provenance
      );

      // Merge evidence (deduplicate by evidenceId)
      const mergedEvidence = deduplicateExpressionEvidence([
        ...existing.evidence,
        ...candidate.evidence
      ]);

      // Rebuild candidate with merged provenance and evidence
      const mergedCandidate: CareerExpressionCandidate = Object.freeze({
        ...existing,
        evidence: mergedEvidence,
        provenance: mergedProvenance
      });

      candidateMap.set(key, mergedCandidate);
    } else {
      candidateMap.set(key, candidate);
    }
  }

  // Sort by expressionId and freeze
  const deduplicated = Array.from(candidateMap.values()).sort((a, b) =>
    a.expressionId.localeCompare(b.expressionId)
  );

  return Object.freeze(deduplicated);
}

/**
 * Deduplicates expression evidence by evidenceId.
 * Maps by evidenceId, sorts by evidenceId, and returns a frozen array.
 *
 * @param evidence - Array of evidence records
 * @returns Deduplicated and frozen evidence array
 */
export function deduplicateExpressionEvidence(
  evidence: readonly CareerExpressionEvidence[]
): readonly CareerExpressionEvidence[] {
  const evidenceMap = new Map<string, CareerExpressionEvidence>();

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
 * Merges expression provenance records.
 * Deduplicates and sorts all array fields.
 *
 * @param provenances - Array of provenance records to merge
 * @returns Merged and frozen provenance record
 */
export function mergeExpressionProvenances(
  ...provenances: readonly CareerExpressionProvenance[]
): CareerExpressionProvenance {
  const allMechanismIds = new Set<string>();
  const allPatternIds = new Set<string>();
  const allRelationshipIds = new Set<string>();
  const allEvidenceIds = new Set<string>();
  const allSourceStages = new Set<string>();

  for (const provenance of provenances) {
    provenance.mechanismIds.forEach(id => allMechanismIds.add(id));
    provenance.patternIds.forEach(id => allPatternIds.add(id));
    provenance.relationshipIds.forEach(id => allRelationshipIds.add(id));
    provenance.evidenceIds.forEach(id => allEvidenceIds.add(id));
    provenance.sourceStages.forEach(stage => allSourceStages.add(stage));
  }

  return Object.freeze({
    mechanismIds: Object.freeze(Array.from(allMechanismIds).sort()),
    patternIds: Object.freeze(Array.from(allPatternIds).sort()),
    relationshipIds: Object.freeze(Array.from(allRelationshipIds).sort()),
    evidenceIds: Object.freeze(Array.from(allEvidenceIds).sort()),
    sourceStages: Object.freeze(Array.from(allSourceStages).sort())
  });
}

/**
 * Canonical sort for expression candidates.
 * Sorts by expressionType (lexicographic), then by expressionId (lexicographic).
 *
 * @param candidates - Array of expression candidates
 * @returns Sorted and frozen expression candidate array
 */
export function canonicalSortExpressionCandidates(
  candidates: readonly CareerExpressionCandidate[]
): readonly CareerExpressionCandidate[] {
  return Object.freeze([...candidates].sort((a, b) => {
    // Primary sort by expressionType
    const typeCompare = a.expressionType.localeCompare(b.expressionType);
    if (typeCompare !== 0) {
      return typeCompare;
    }

    // Secondary sort by expressionId
    return a.expressionId.localeCompare(b.expressionId);
  }));
}

/**
 * Canonical sort for participant IDs using compareParticipantIds.
 * Re-exports from careerMechanismUtils for convenience.
 *
 * @param participantIds - Array of participant IDs to sort
 * @returns Sorted array of participant IDs
 */
export function sortExpressionParticipantIds(
  participantIds: readonly ParticipantId[]
): readonly ParticipantId[] {
  return [...participantIds].sort(compareParticipantIds);
}
