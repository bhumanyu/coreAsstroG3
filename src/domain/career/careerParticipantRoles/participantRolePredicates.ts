import type { CareerGraphEdge } from '../careerGraph/careerAstroGraphTypes';
import type { ParticipantRoleContext } from './participantRoleTypes';
import type { ParticipantId } from './participantRoleTypes';
import { resolveRelationshipEdges } from './participantRoleUtils';

/**
 * P2-07B Participant Role Predicates
 *
 * Predicate functions for detecting participant roles based on structural evidence.
 * These predicates use canonical relationship resolution via resolveRelationshipEdges
 * and never parse relationship ID strings.
 */

/**
 * Checks if a participant is an establishing participant.
 * A participant is establishing if it appears in establishingRelationshipIds edges'
 * sourceNodeId or targetNodeId where the node is PLANET:*.
 *
 * Per spec §19: CORE participants are those that resolve from establishingRelationshipIds
 * edges where the node is a PLANET. This is structural, not based on planetary importance.
 *
 * @param context - The participant role context
 * @param participantId - The participant ID to check
 * @returns true if the participant is establishing
 */
export function isEstablishingParticipant(
  context: ParticipantRoleContext,
  participantId: ParticipantId
): boolean {
  const establishingIds = context.pattern.provenance.establishingRelationshipIds;
  const edges = resolveRelationshipEdges(context, establishingIds);

  const planetNodeKey = participantId; // participantId is PLANET:{Planet}

  return edges.some(edge =>
    edge.sourceNodeId === planetNodeKey || edge.targetNodeId === planetNodeKey
  );
}

/**
 * Checks if a participant is a supporting participant.
 * A participant is supporting if it appears in supportingRelationshipIds edges
 * and is not already CORE/MODIFIER/CHALLENGING.
 *
 * Per spec §20: SUPPORTING participants appear only in supportingRelationshipIds
 * edges and are not CORE/MODIFIER/CHALLENGING.
 *
 * @param context - The participant role context
 * @param participantId - The participant ID to check
 * @returns true if the participant is supporting
 */
export function isSupportingParticipant(
  context: ParticipantRoleContext,
  participantId: ParticipantId
): boolean {
  const supportingIds = context.pattern.provenance.supportingRelationshipIds ?? [];
  if (supportingIds.length === 0) {
    return false;
  }

  const edges = resolveRelationshipEdges(context, supportingIds);
  const planetNodeKey = participantId;

  return edges.some(edge =>
    edge.sourceNodeId === planetNodeKey || edge.targetNodeId === planetNodeKey
  );
}

/**
 * Checks if a participant has a modifier relationship to a CORE participant.
 * A modifier relationship is a CONJUNCT or ASPECTS edge between the candidate
 * and a CORE planet.
 *
 * Per spec §21: MODIFIER is only via explicit deterministic relationship to an
 * already-established CORE participant. Never semantic interpretation.
 *
 * @param context - The participant role context
 * @param participantId - The participant ID to check
 * @param coreParticipants - Array of CORE participant IDs
 * @returns true if the participant has a modifier relationship
 */
export function hasModifierRelationship(
  context: ParticipantRoleContext,
  participantId: ParticipantId,
  coreParticipants: readonly ParticipantId[]
): boolean {
  if (coreParticipants.length === 0) {
    return false;
  }

  // Get all relationship IDs from the pattern (both establishing and supporting)
  const allRelationshipIds = [
    ...context.pattern.provenance.establishingRelationshipIds,
    ...(context.pattern.provenance.supportingRelationshipIds ?? [])
  ];

  const edges = resolveRelationshipEdges(context, allRelationshipIds);
  const planetNodeKey = participantId;

  // Check for CONJUNCT or ASPECTS edges to any CORE participant
  return edges.some(edge => {
    const isModifierEdge = edge.type === 'CONJUNCT' || edge.type === 'ASPECTS';
    const involvesCandidate = edge.sourceNodeId === planetNodeKey || edge.targetNodeId === planetNodeKey;
    const involvesCore = coreParticipants.some(coreId =>
      edge.sourceNodeId === coreId || edge.targetNodeId === coreId
    );

    return isModifierEdge && involvesCandidate && involvesCore;
  });
}

/**
 * Checks if a participant has a challenging relationship to a CORE participant.
 * A challenging relationship is an explicit adverse edge to a CORE planet.
 *
 * Per spec §22: CHALLENGING is only via a deterministic adverse fact relevant to
 * the pattern — an adverse CareerPlanetaryConditionResult on a pattern participant,
 * or an explicit adverse edge to a CORE planet. Natural maleficence alone never
 * produces CHALLENGING.
 *
 * NOTE: This is a placeholder implementation. The actual adverse edge detection
 * logic would be based on specific edge types or conditions. For now, this always
 * returns false to avoid false positives on natural malefics.
 *
 * @param context - The participant role context
 * @param participantId - The participant ID to check
 * @param coreParticipants - Array of CORE participant IDs
 * @returns true if the participant has a challenging relationship
 */
export function hasChallengingRelationship(
  context: ParticipantRoleContext,
  participantId: ParticipantId,
  coreParticipants: readonly ParticipantId[]
): boolean {
  // Placeholder: always return false until adverse edge detection is implemented
  // Per spec, this should be based on explicit adverse facts, not natural maleficence
  return false;
}

/**
 * Checks if a participant has an adverse planetary condition.
 * An adverse condition is an affliction or dignity issue on a pattern participant.
 *
 * Per spec §22: CHALLENGING can be triggered by an adverse CareerPlanetaryConditionResult
 * (affliction/dignity) on a pattern participant.
 *
 * @param context - The participant role context
 * @param participantId - The participant ID to check
 * @returns true if the participant has an adverse condition
 */
export function hasAdverseCondition(
  context: ParticipantRoleContext,
  participantId: ParticipantId
): boolean {
  const planetStr = participantId.replace('PLANET:', '');

  // Check if this planet has an adverse condition in the planetary conditions
  return context.planetaryConditions.some(condition => {
    if (String(condition.planet) !== planetStr) {
      return false;
    }

    // Check for adverse condition types: WEAK, AFFLICTED, or DEBILITATED dignity
    // Per spec, this is based on explicit adverse facts, not natural maleficence
    return (
      condition.condition === 'WEAK' ||
      condition.condition === 'AFFLICTED' ||
      condition.dignity === 'DEBILITATED' ||
      condition.affliction === 'SEVERE'
    );
  });
}
