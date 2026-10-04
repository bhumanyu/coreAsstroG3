import type { CareerHouseNetwork } from '../careerGraph/careerHouseNetworkTypes';
import type { CareerGraphEdge } from '../careerGraph/careerAstroGraphTypes';
import type { ParticipantRoleContext } from './participantRoleTypes';
import type { ParticipantRole, ParticipantId } from './participantRoleTypes';

/**
 * P2-07B Participant Role Utility Functions
 *
 * Common helper functions used by participant role policies and predicates.
 * These utilities ensure consistent relationship resolution and evidence
 * generation across all policies.
 */

/**
 * Resolves relationship IDs to actual CareerGraphEdge objects via the context's networks.
 *
 * This function performs canonical resolution of relationship IDs by looking them up
 * in the provided networks' relationship arrays. It never parses relationship ID strings.
 *
 * @param context - The participant role context containing networks
 * @param relationshipIds - Array of relationship IDs to resolve
 * @returns Array of resolved CareerGraphEdge objects (empty if not found)
 */
export function resolveRelationshipEdges(
  context: ParticipantRoleContext,
  relationshipIds: readonly string[]
): readonly CareerGraphEdge[] {
  const resolved: CareerGraphEdge[] = [];

  for (const network of context.networks) {
    for (const edge of network.relationships) {
      if (relationshipIds.includes(edge.identityKey)) {
        resolved.push(edge);
      }
    }
  }

  return Object.freeze(resolved);
}

/**
 * Generates a unique evidence ID for participant role evidence.
 * Format: P2-07B:EVIDENCE:${ruleId}:${participantId}:${role}:${edge.identityKey}
 *
 * Per spec §34: deduplication is on (ruleId, participantId, role, edge.identityKey).
 *
 * @param ruleId - The policy rule ID
 * @param participantId - The participant ID (PLANET:{Planet})
 * @param role - The participant role
 * @param edgeIdentityKey - The identity key of the relationship edge
 * @returns Unique evidence ID
 */
export function generateParticipantRoleEvidenceId(
  ruleId: string,
  participantId: ParticipantId,
  role: ParticipantRole,
  edgeIdentityKey: string
): string {
  return `P2-07B:EVIDENCE:${ruleId}:${participantId}:${role}:${edgeIdentityKey}`;
}

/**
 * Extracts the planet from a participant ID.
 *
 * @param participantId - The participant ID (PLANET:{Planet})
 * @returns The Planet enum value
 */
export function extractPlanetFromParticipantId(
  participantId: ParticipantId
): string {
  return participantId.replace('PLANET:', '');
}

/**
 * Creates a participant ID from a planet.
 *
 * @param planet - The Planet enum value
 * @returns The participant ID (PLANET:{Planet})
 */
export function createParticipantId(planet: string): ParticipantId {
  return `PLANET:${planet}` as ParticipantId;
}
