import type {
  CareerMechanismEvidence,
  CareerMechanismEvidenceSource,
  CareerMechanismEvidenceRole,
  CareerMechanismRefinementSource,
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
 * Throws if source is 'D10' — use buildRefiningMechanismEvidence for D10 evidence.
 *
 * @param mechanismId - The mechanism ID
 * @param mechanismType - The mechanism type
 * @param source - The evidence source (must NOT be 'D10')
 * @param participantIds - Array of participant IDs (required for most sources)
 * @param relationshipIds - Array of relationship IDs (required for some sources)
 * @param patternId - Optional pattern ID
 * @param explanation - The explanation text
 * @returns Frozen career mechanism evidence with role: 'ESTABLISHING'
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
  // D10 is only allowed as refinement evidence
  if (source === 'D10') {
    throw new Error(
      'D10 source is not allowed in buildCareerMechanismEvidence. Use buildRefiningMechanismEvidence instead.'
    );
  }

  // Per-source validation rules
  // PATTERN → patternId required
  if (source === 'PATTERN' && !patternId) {
    throw new Error('PATTERN source requires patternId');
  }

  // PARTICIPANT_ROLE → participantIds non-empty
  if (source === 'PARTICIPANT_ROLE' && participantIds.length === 0) {
    throw new Error('PARTICIPANT_ROLE source requires at least one participant ID');
  }

  // PLANETARY_RELEVANCE → participantIds non-empty
  if (source === 'PLANETARY_RELEVANCE' && participantIds.length === 0) {
    throw new Error('PLANETARY_RELEVANCE source requires at least one participant ID');
  }

  // PLANETARY_CONDITION → participantIds non-empty
  if (source === 'PLANETARY_CONDITION' && participantIds.length === 0) {
    throw new Error('PLANETARY_CONDITION source requires at least one participant ID');
  }

  // RELATIONSHIP → relationshipIds non-empty
  if (source === 'RELATIONSHIP' && relationshipIds.length === 0) {
    throw new Error('RELATIONSHIP source requires at least one relationship ID');
  }

  // LORDSHIP → relationshipIds non-empty
  if (source === 'LORDSHIP' && relationshipIds.length === 0) {
    throw new Error('LORDSHIP source requires at least one relationship ID');
  }

  // YOGA → relationshipIds non-empty
  if (source === 'YOGA' && relationshipIds.length === 0) {
    throw new Error('YOGA source requires at least one relationship ID');
  }

  // DISPOSITOR → relationshipIds non-empty AND participantIds non-empty
  if (source === 'DISPOSITOR') {
    if (relationshipIds.length === 0) {
      throw new Error('DISPOSITOR source requires at least one relationship ID');
    }
    if (participantIds.length === 0) {
      throw new Error('DISPOSITOR source requires at least one participant ID');
    }
  }

  // Sort and freeze arrays for storage (createCareerMechanismEvidenceId handles sorting internally)
  const sortedParticipantIds = [...participantIds].sort();
  const sortedRelationshipIds = [...relationshipIds].sort();

  // Generate deterministic evidence ID (sorting happens inside the function)
  const evidenceId = createCareerMechanismEvidenceId(
    mechanismId,
    source,
    participantIds,
    relationshipIds
  );

  const evidence: CareerMechanismEvidence = Object.freeze({
    evidenceId,
    mechanismType,
    source,
    role: 'ESTABLISHING' as CareerMechanismEvidenceRole,
    participantIds: Object.freeze(sortedParticipantIds),
    relationshipIds: Object.freeze(sortedRelationshipIds),
    patternId,
    explanation
  });

  return evidence;
}

/**
 * Builds a refining career mechanism evidence record.
 * Used exclusively for D10 and other refinement-only sources.
 * Hardcodes role: 'REFINING'.
 *
 * @param mechanismId - The mechanism ID
 * @param mechanismType - The mechanism type
 * @param source - The evidence source (e.g., 'D10')
 * @param participantIds - Array of participant IDs
 * @param relationshipIds - Array of relationship IDs
 * @param patternId - Optional pattern ID
 * @param explanation - The explanation text
 * @returns Frozen career mechanism evidence with role: 'REFINING'
 */
export function buildRefiningMechanismEvidence({
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
  source: CareerMechanismRefinementSource;
  participantIds?: readonly ParticipantId[];
  relationshipIds?: readonly string[];
  patternId?: string;
  explanation: string;
}): CareerMechanismEvidence {
  // Sort and freeze arrays for storage (createCareerMechanismEvidenceId handles sorting internally)
  const sortedParticipantIds = [...participantIds].sort();
  const sortedRelationshipIds = [...relationshipIds].sort();

  // Generate deterministic evidence ID (sorting happens inside the function)
  const evidenceId = createCareerMechanismEvidenceId(
    mechanismId,
    source,
    participantIds,
    relationshipIds
  );

  const evidence: CareerMechanismEvidence = Object.freeze({
    evidenceId,
    mechanismType,
    source,
    role: 'REFINING' as CareerMechanismEvidenceRole,
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

/**
 * Builds multiple refining evidence records from an array of evidence inputs.
 *
 * @param inputs - Array of evidence input objects
 * @returns Frozen array of evidence records with role: 'REFINING'
 */
export function buildRefiningMechanismEvidenceArray(
  inputs: ReadonlyArray<{
    mechanismId: string;
    mechanismType: CareerMechanismType;
    source: CareerMechanismRefinementSource;
    participantIds?: readonly ParticipantId[];
    relationshipIds?: readonly string[];
    patternId?: string;
    explanation: string;
  }>
): readonly CareerMechanismEvidence[] {
  const evidence = inputs.map((input) =>
    buildRefiningMechanismEvidence(input)
  );

  // Sort by evidenceId for deterministic output
  const sorted = evidence.sort((a, b) =>
    a.evidenceId.localeCompare(b.evidenceId)
  );

  return Object.freeze(sorted);
}
