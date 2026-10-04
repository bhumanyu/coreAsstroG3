/**
 * P2-07B Participant Roles Module
 *
 * Public API for participant role assignment in Career patterns.
 */

// Types
export type {
  ParticipantRole,
  PrimaryParticipantRole,
  ParticipantId,
  ParticipantRoleEvidenceSource,
  ParticipantRoleEvidence,
  ParticipantRoleAssignment,
  ParticipantRoleResult,
  ParticipantRolePolicy,
  ParticipantRoleContext
} from './participantRoleTypes';

// Engine
export { assignParticipantRoles } from './participantRoleEngine';

// Registry (for testing/inspection)
export { PARTICIPANT_ROLE_POLICIES } from './participantRoleRegistry';
