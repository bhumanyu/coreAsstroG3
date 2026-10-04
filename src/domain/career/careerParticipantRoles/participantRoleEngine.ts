import type {
  ParticipantRoleContext,
  ParticipantRoleResult
} from './participantRoleTypes';
import { PARTICIPANT_ROLE_POLICIES } from './participantRoleRegistry';

/**
 * P2-07B Participant Role Engine
 *
 * Engine for assigning participant roles to qualified Career patterns.
 *
 * This engine:
 * - Looks up the appropriate policy by pattern classification
 * - Delegates role assignment to the policy
 * - Returns empty result if no policy exists (per spec §45)
 * - Never synthesizes roles without evidence
 *
 * Per spec §45: missing role policy or missing evidence → no assignment,
 * not negative roles.
 */

/**
 * Assigns participant roles to a qualified Career pattern.
 *
 * This function:
 * - Looks up the policy by context.pattern.classification
 * - If no policy exists, returns frozen empty result (assignments: [], evidence: [])
 * - Never synthesizes roles without evidence
 *
 * @param context - The participant role context containing pattern, qualification, networks, conditions, and relevance
 * @returns Participant role result with assignments, evidence, and explanation
 */
export function assignParticipantRoles(
  context: ParticipantRoleContext
): ParticipantRoleResult {
  const { pattern } = context;
  const classification = pattern.classification;

  // Look up policy by classification
  const policy = PARTICIPANT_ROLE_POLICIES[classification];

  // No policy → return frozen empty result (per spec §45)
  if (!policy) {
    return Object.freeze({
      assignments: Object.freeze([]),
      evidence: Object.freeze([]),
      ruleId: 'NO_POLICY',
      explanation: `No participant role policy registered for classification ${classification}. No role assignments made.`
    });
  }

  // Delegate to policy
  return policy.evaluate(context);
}
