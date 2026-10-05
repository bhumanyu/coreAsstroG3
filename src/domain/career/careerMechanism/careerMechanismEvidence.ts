import type {
  CareerMechanismEvidence,
  CareerMechanismEvidenceSource,
  CareerMechanismType,
  ParticipantId
} from './careerMechanismTypes';
import { createCareerMechanismEvidenceId } from './careerMechanismUtils';

/**
 * P2-07C Career Mechanism Evidence Helpers
 *
 * This module provides helper functions for building career mechanism evidence records.
 * Per spec §9: evidence records cite real participant/relationship IDs; no fabrication.
 *
 * BOUNDARY ENFORCEMENT: This module must NOT import from:
 * - careerDasha
 * - careerD10
 * - careerExpression
 * - careerFinalSynthesis
 * - domain/timing
 */

/**
 * Builds a career mechanism evidence record.
 * Validates that participant and relationship IDs are provided appropriately.
 *
 * @param mechanismId - The mechanism ID
 * @param mechanismType - The mechanism type
 * @param source - The evidence source
 * @param participantIds - Array of participant IDs (required for most sources)
 * @param relationshipIds - Array of relationship IDs (required for some sources)
 * @param patternId - Optional pattern ID
 * @param explanation - The explanation text
 * @returns Frozen career mechanism evidence
 */
export function buildCareerMechanismEvidence({
  mechanismId,
  mechanismType,
  source,
  participantIds = [],
  relationshipIds = [],
  patternId,
  explanation
}: {
  mechanismId: string;
  mechanismType: CareerMechanismType;
  source: CareerMechanismEvidenceSource;
  participantIds?: readonly ParticipantId[];
  relationshipIds?: readonly string[];
  patternId?: string;
  explanation: string;
}): CareerMechanismEvidence {
  // Validate that source is appropriate for provided data
  if (
    source === 'PARTICIPANT_ROLE' &&
    participantIds.length === 0
  ) {
    throw new Error(
      'PARTICIPANT_ROLE source requires at least one participant ID'
    );
  }

  if (
    (source === 'RELATIONSHIP' || source === 'LORDSHIP' || source === 'YOGA') &&
    relationshipIds.length === 0
  ) {
    throw new Error(
      `${source} source requires at least one relationship ID`
    );
  }

  // Generate deterministic evidence ID
  const participantId =
    participantIds.length > 0 ? participantIds[0] : undefined;
  const relationshipId =
    relationshipIds.length > 0 ? relationshipIds[0] : undefined;
  const evidenceId = createCareerMechanismEvidenceId(
    mechanismId,
    source,
    participantId,
    relationshipId
  );

  // Sort and freeze arrays
  const sortedParticipantIds = [...participantIds].sort();
  const sortedRelationshipIds = [...relationshipIds].sort();

  const evidence: CareerMechanismEvidence = Object.freeze({
    evidenceId,
    mechanismType,
    source,
    participantIds: Object.freeze(sortedParticipantIds),
    relationshipIds: Object.freeze(sortedRelationshipIds),
    patternId,
    explanation
  });

  return evidence;
}

/**
 * Builds multiple evidence records from an array of evidence inputs.
 *
 * @param inputs - Array of evidence input objects
 * @returns Frozen array of evidence records
 */
export function buildCareerMechanismEvidenceArray(
  inputs: ReadonlyArray<{
    mechanismId: string;
    mechanismType: CareerMechanismType;
    source: CareerMechanismEvidenceSource;
    participantIds?: readonly ParticipantId[];
    relationshipIds?: readonly string[];
    patternId?: string;
    explanation: string;
  }>
): readonly CareerMechanismEvidence[] {
  const evidence = inputs.map((input) =>
    buildCareerMechanismEvidence(input)
  );

  // Sort by evidenceId for deterministic output
  const sorted = evidence.sort((a, b) =>
    a.evidenceId.localeCompare(b.evidenceId)
  );

  return Object.freeze(sorted);
}
