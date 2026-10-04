import type { CareerPatternClassification } from '../../careerPattern/careerPatternTypes';
import type {
  ParticipantRolePolicy,
  ParticipantRoleContext,
  ParticipantRoleResult,
  ParticipantRoleAssignment,
  ParticipantRoleEvidence,
  ParticipantId,
  PrimaryParticipantRole,
  ParticipantRoleEvidenceSource
} from '../participantRoleTypes';
import {
  generateParticipantRoleEvidenceId,
  createParticipantId
} from '../participantRoleUtils';
import {
  isEstablishingParticipant,
  isSupportingParticipant,
  hasModifierRelationship,
  hasChallengingRelationship,
  hasAdverseCondition
} from '../participantRolePredicates';
import { CANONICAL_PLANET_ORDER } from '../../careerPlanetOrder';

/**
 * P2-07B Career House Network Participant Role Policy (Generic Carrier)
 *
 * Generic carrier role assignment policy for CAREER_HOUSE_NETWORK classification.
 * This is a conservative carrier policy that follows the same role assignment logic
 * as specific policies but without specialized rules.
 *
 * Role assignment logic:
 * - CORE: Participants in establishingRelationshipIds edges
 * - SUPPORTING: Participants only in supportingRelationshipIds edges, not CORE/MODIFIER/CHALLENGING
 * - MODIFIER: Participants with CONJUNCT/ASPECTS edge to a CORE participant
 * - CHALLENGING: Participants with adverse condition or adverse edge to CORE
 *
 * Per spec §19-§39: Roles are assigned based on structural evidence only,
 * not on planetary importance or semantic interpretation.
 *
 * Primary-role precedence: CORE > MODIFIER > SUPPORTING
 * CHALLENGING is independent - a CORE participant can also be challenging.
 */
export class CareerHouseNetworkRolePolicy implements ParticipantRolePolicy {
  readonly ruleId = 'CAREER_HOUSE_NETWORK';
  readonly classification: CareerPatternClassification = 'CAREER_HOUSE_NETWORK';
  readonly description = 'Generic Career House Network participant role policy (conservative carrier)';

  evaluate(context: ParticipantRoleContext): ParticipantRoleResult {
    const { pattern, qualification } = context;

    // Qualification gate: per spec §28-§30
    if (qualification.status === 'UNQUALIFIED') {
      return this.createEmptyResult('Pattern is UNQUALIFIED - no role assignments');
    }

    const assignments: ParticipantRoleAssignment[] = [];
    const allEvidence: ParticipantRoleEvidence[] = [];
    const coreParticipants: ParticipantId[] = [];

    // Step 1: Identify CORE participants from establishing relationships
    for (const planet of CANONICAL_PLANET_ORDER) {
      if (!pattern.planets.includes(planet)) {
        continue;
      }

      const participantId = createParticipantId(planet);

      if (isEstablishingParticipant(context, participantId)) {
        coreParticipants.push(participantId);

        // Create CORE evidence
        const evidence = this.createCoreEvidence(context, participantId);
        allEvidence.push(evidence);
      }
    }

    // Step 2: Assign roles to all pattern participants
    for (const planet of CANONICAL_PLANET_ORDER) {
      if (!pattern.planets.includes(planet)) {
        continue;
      }

      const participantId = createParticipantId(planet);

      // Skip if we already processed as CORE (will be assigned in step 3)
      if (coreParticipants.includes(participantId)) {
        continue;
      }

      // Check for MODIFIER relationship to CORE
      const hasModifier = hasModifierRelationship(context, participantId, coreParticipants);
      if (hasModifier) {
        const evidence = this.createModifierEvidence(context, participantId, coreParticipants);
        allEvidence.push(evidence);
        continue;
      }

      // Check for SUPPORTING-only
      const hasSupporting = isSupportingParticipant(context, participantId);
      if (hasSupporting) {
        const evidence = this.createSupportingEvidence(context, participantId);
        allEvidence.push(evidence);
        continue;
      }

      // No evidence - no assignment (per spec §26)
    }

    // Step 3: Build final assignments with primary role and challenging flag
    for (const planet of CANONICAL_PLANET_ORDER) {
      if (!pattern.planets.includes(planet)) {
        continue;
      }

      const participantId = createParticipantId(planet);

      // Collect evidence for this participant by checking evidenceId
      const participantEvidence = allEvidence.filter(e =>
        e.evidenceId.includes(participantId)
      );

      if (participantEvidence.length === 0) {
        // No evidence - no assignment (per spec §26)
        continue;
      }

      // Determine primary role (precedence: CORE > MODIFIER > SUPPORTING)
      let primaryRole: PrimaryParticipantRole = 'SUPPORTING';
      if (coreParticipants.includes(participantId)) {
        primaryRole = 'CORE';
      } else if (participantEvidence.some(e => e.role === 'MODIFIER')) {
        primaryRole = 'MODIFIER';
      }

      // Check for CHALLENGING (adverse condition or adverse edge)
      let isChallenging = false;
      if (hasAdverseCondition(context, participantId)) {
        isChallenging = true;
        const challengingEvidence = this.createChallengingConditionEvidence(context, participantId);
        allEvidence.push(challengingEvidence);
        participantEvidence.push(challengingEvidence);
      }

      if (hasChallengingRelationship(context, participantId, coreParticipants)) {
        isChallenging = true;
        const challengingEvidence = this.createChallengingEdgeEvidence(context, participantId, coreParticipants);
        allEvidence.push(challengingEvidence);
        participantEvidence.push(challengingEvidence);
      }

      // Deduplicate evidence by evidenceId
      const dedupedEvidence = this.deduplicateEvidence(participantEvidence);

      const assignment: ParticipantRoleAssignment = Object.freeze({
        participantId,
        primaryRole,
        isChallenging,
        roleEvidence: Object.freeze(dedupedEvidence),
        explanation: this.buildAssignmentExplanation(participantId, primaryRole, isChallenging, dedupedEvidence)
      });

      assignments.push(assignment);
    }

    // Sort assignments by canonical planet order
    assignments.sort((a, b) => {
      const planetA = a.participantId.replace('PLANET:', '');
      const planetB = b.participantId.replace('PLANET:', '');
      const indexA = CANONICAL_PLANET_ORDER.indexOf(planetA as any);
      const indexB = CANONICAL_PLANET_ORDER.indexOf(planetB as any);
      return indexA - indexB;
    });

    // Sort all evidence by evidenceId
    allEvidence.sort((a, b) => a.evidenceId.localeCompare(b.evidenceId));

    return Object.freeze({
      assignments: Object.freeze(assignments),
      evidence: Object.freeze(allEvidence),
      ruleId: this.ruleId,
      explanation: this.buildOverallExplanation(assignments, qualification.status)
    });
  }

  private createCoreEvidence(
    context: ParticipantRoleContext,
    participantId: ParticipantId
  ): ParticipantRoleEvidence {
    const establishingIds = context.pattern.provenance.establishingRelationshipIds;
    const edgeIdentityKey = establishingIds[0] || 'UNKNOWN';

    return Object.freeze({
      evidenceId: generateParticipantRoleEvidenceId(
        this.ruleId,
        participantId,
        'CORE',
        edgeIdentityKey
      ),
      role: 'CORE',
      relationshipIds: Object.freeze([...establishingIds]),
      source: 'ESTABLISHING_RELATIONSHIP' as ParticipantRoleEvidenceSource,
      explanation: `Participant ${participantId} appears in establishing relationships for the pattern.`
    });
  }

  private createSupportingEvidence(
    context: ParticipantRoleContext,
    participantId: ParticipantId
  ): ParticipantRoleEvidence {
    const supportingIds = context.pattern.provenance.supportingRelationshipIds ?? [];
    const edgeIdentityKey = supportingIds[0] || 'UNKNOWN';

    return Object.freeze({
      evidenceId: generateParticipantRoleEvidenceId(
        this.ruleId,
        participantId,
        'SUPPORTING',
        edgeIdentityKey
      ),
      role: 'SUPPORTING',
      relationshipIds: Object.freeze([...supportingIds]),
      source: 'SUPPORTING_RELATIONSHIP' as ParticipantRoleEvidenceSource,
      explanation: `Participant ${participantId} appears only in supporting relationships for the pattern.`
    });
  }

  private createModifierEvidence(
    context: ParticipantRoleContext,
    participantId: ParticipantId,
    coreParticipants: readonly ParticipantId[]
  ): ParticipantRoleEvidence {
    const allRelationshipIds = [
      ...context.pattern.provenance.establishingRelationshipIds,
      ...(context.pattern.provenance.supportingRelationshipIds ?? [])
    ];
    const edgeIdentityKey = allRelationshipIds[0] || 'UNKNOWN';

    return Object.freeze({
      evidenceId: generateParticipantRoleEvidenceId(
        this.ruleId,
        participantId,
        'MODIFIER',
        edgeIdentityKey
      ),
      role: 'MODIFIER',
      relationshipIds: Object.freeze([...allRelationshipIds]),
      source: 'MODIFIER_RELATIONSHIP' as ParticipantRoleEvidenceSource,
      explanation: `Participant ${participantId} has a CONJUNCT or ASPECTS relationship to CORE participants.`
    });
  }

  private createChallengingConditionEvidence(
    context: ParticipantRoleContext,
    participantId: ParticipantId
  ): ParticipantRoleEvidence {
    return Object.freeze({
      evidenceId: generateParticipantRoleEvidenceId(
        this.ruleId,
        participantId,
        'CHALLENGING',
        'ADVERSE_CONDITION'
      ),
      role: 'CHALLENGING',
      relationshipIds: Object.freeze([]),
      source: 'ADVERSE_CONDITION' as ParticipantRoleEvidenceSource,
      explanation: `Participant ${participantId} has an adverse planetary condition (WEAK/AFFLICTED/DEBILITATED/SEVERE).`
    });
  }

  private createChallengingEdgeEvidence(
    context: ParticipantRoleContext,
    participantId: ParticipantId,
    coreParticipants: readonly ParticipantId[]
  ): ParticipantRoleEvidence {
    const allRelationshipIds = [
      ...context.pattern.provenance.establishingRelationshipIds,
      ...(context.pattern.provenance.supportingRelationshipIds ?? [])
    ];
    const edgeIdentityKey = allRelationshipIds[0] || 'UNKNOWN';

    return Object.freeze({
      evidenceId: generateParticipantRoleEvidenceId(
        this.ruleId,
        participantId,
        'CHALLENGING',
        edgeIdentityKey
      ),
      role: 'CHALLENGING',
      relationshipIds: Object.freeze([...allRelationshipIds]),
      source: 'ADVERSE_EDGE' as ParticipantRoleEvidenceSource,
      explanation: `Participant ${participantId} has an adverse relationship to CORE participants.`
    });
  }

  private deduplicateEvidence(evidence: readonly ParticipantRoleEvidence[]): ParticipantRoleEvidence[] {
    const seen = new Set<string>();
    const deduped: ParticipantRoleEvidence[] = [];

    for (const e of evidence) {
      if (!seen.has(e.evidenceId)) {
        seen.add(e.evidenceId);
        deduped.push(e);
      }
    }

    return deduped;
  }

  private buildAssignmentExplanation(
    participantId: ParticipantId,
    primaryRole: PrimaryParticipantRole,
    isChallenging: boolean,
    evidence: readonly ParticipantRoleEvidence[]
  ): string {
    const parts = [
      `Participant ${participantId}`,
      `has primary role ${primaryRole}.`
    ];

    if (isChallenging) {
      parts.push('Also marked as CHALLENGING due to adverse conditions or relationships.');
    }

    if (evidence.length > 0) {
      parts.push(`Evidence: ${evidence.map(e => e.explanation).join(' ')}`);
    }

    return parts.join(' ');
  }

  private buildOverallExplanation(
    assignments: readonly ParticipantRoleAssignment[],
    qualificationStatus: string
  ): string {
    const parts = [
      `Career House Network pattern (${this.classification})`,
      `has qualification status ${qualificationStatus}.`,
      `Assigned ${assignments.length} participant roles.`
    ];

    const coreCount = assignments.filter(a => a.primaryRole === 'CORE').length;
    const supportingCount = assignments.filter(a => a.primaryRole === 'SUPPORTING').length;
    const modifierCount = assignments.filter(a => a.primaryRole === 'MODIFIER').length;
    const challengingCount = assignments.filter(a => a.isChallenging).length;

    parts.push(
      `CORE: ${coreCount}, SUPPORTING: ${supportingCount}, MODIFIER: ${modifierCount}, CHALLENGING: ${challengingCount}.`
    );

    return parts.join(' ');
  }

  private createEmptyResult(explanation: string): ParticipantRoleResult {
    return Object.freeze({
      assignments: Object.freeze([]),
      evidence: Object.freeze([]),
      ruleId: this.ruleId,
      explanation
    });
  }
}
