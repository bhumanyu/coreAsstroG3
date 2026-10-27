import type {
  PatternCandidate,
  PatternQualification,
  ResolvedMechanism,
  MechanismRefinement,
  IdentityMapping,
  RelationshipMapping,
  OrchestrationDiagnostic,
  ParticipantRoleAssignment
} from './canonicalCareerContracts';
import { participantRoleAssignmentReferenceId } from './canonicalCareerContracts';

/**
 * P2-11B Canonical Career Validation Helpers
 *
 * This module provides boundary validation helpers for the canonical career orchestrator.
 * These helpers enforce invariants and validate contracts without implementing astrology rules.
 *
 * BOUNDARY ENFORCEMENT: This module must NOT:
 * - Implement any astrology calculations or interpretations
 * - Import from careerDasha, careerD10, careerExpression, careerFinalSynthesis
 * - Import from domain/timing
 * - Perform qualification or mechanism resolution
 *
 * Only validation, contract checking, and diagnostic recording.
 */

/**
 * Validation result.
 * Contains whether validation passed and any diagnostics.
 */
export interface ValidationResult {
  readonly valid: boolean;
  readonly diagnostics: readonly OrchestrationDiagnostic[];
}

const ALLOWED_RELATIONSHIP_STAGE_PAIRS: ReadonlySet<string> = new Set([
  'PATTERN->QUALIFICATION',
  'QUALIFICATION->PARTICIPANT_ROLES',
  'QUALIFICATION->MECHANISM',
  'MECHANISM->REFINEMENT'
]);

interface RelationshipLineage {
  readonly patternId?: string;
  readonly candidateId?: string;
}

/**
 * Enforces one role record per (pattern, participant, primaryRole), and rejects
 * multiple records for one participant when their primary/challenging states conflict.
 */
export function validateParticipantRoleAssignments(
  assignments: readonly ParticipantRoleAssignment[]
): ValidationResult {
  const diagnostics: OrchestrationDiagnostic[] = [];
  const assignmentKeys = new Set<string>();
  const participantStates = new Map<string, { primaryRole: string; isChallenging: boolean }>();

  const orderedAssignments = [...assignments].sort((a, b) =>
    a.patternId.localeCompare(b.patternId) ||
    a.assignment.participantId.localeCompare(b.assignment.participantId) ||
    a.assignment.primaryRole.localeCompare(b.assignment.primaryRole) ||
    Number(a.assignment.isChallenging) - Number(b.assignment.isChallenging)
  );
  for (const role of orderedAssignments) {
    const { patternId, assignment } = role;
    const participantKey = JSON.stringify([patternId, assignment.participantId]);
    const assignmentKey = participantRoleAssignmentReferenceId(
      patternId,
      assignment.participantId,
      assignment.primaryRole
    );
    if (assignmentKeys.has(assignmentKey)) {
      diagnostics.push({
        diagnosticId: `VALIDATION_DUPLICATE_PARTICIPANT_ROLE_ASSIGNMENT_${patternId}_${assignment.participantId}_${assignment.primaryRole}`,
        severity: 'ERROR',
        category: 'DUPLICATE_ID',
        message: `Duplicate participant-role assignment for pattern ${patternId}, participant ${assignment.participantId}, primary role ${assignment.primaryRole}`,
        relatedIds: [patternId, assignment.participantId],
        stage: 'PARTICIPANT_ROLES'
      });
    } else {
      assignmentKeys.add(assignmentKey);
    }

    const existing = participantStates.get(participantKey);
    if (
      existing &&
      (existing.primaryRole !== assignment.primaryRole ||
        existing.isChallenging !== assignment.isChallenging)
    ) {
      diagnostics.push({
        diagnosticId: `VALIDATION_CONFLICTING_PARTICIPANT_ROLE_ASSIGNMENT_${patternId}_${assignment.participantId}`,
        severity: 'ERROR',
        category: 'CONTRACT_VIOLATION',
        message: `Participant ${assignment.participantId} has conflicting primary-role or challenging assignments within pattern ${patternId}`,
        relatedIds: [patternId, assignment.participantId],
        stage: 'PARTICIPANT_ROLES'
      });
    } else if (!existing) {
      participantStates.set(participantKey, {
        primaryRole: assignment.primaryRole,
        isChallenging: assignment.isChallenging
      });
    }
  }

  return {
    valid: diagnostics.length === 0,
    diagnostics: Object.freeze(diagnostics)
  };
}

/**
 * Validates that all pattern IDs are unique.
 *
 * @param patterns - Pattern candidates to validate
 * @returns Validation result with diagnostics for duplicates
 */
export function validateUniquePatternIds(
  patterns: readonly PatternCandidate[]
): ValidationResult {
  const diagnostics: OrchestrationDiagnostic[] = [];
  const idMap = new Map<string, PatternCandidate>();

  for (const pattern of patterns) {
    const existing = idMap.get(pattern.patternId);
    if (existing) {
      diagnostics.push({
        diagnosticId: `VALIDATION_DUPLICATE_PATTERN_ID_${pattern.patternId}`,
        severity: 'ERROR',
        category: 'DUPLICATE_ID',
        message: `Duplicate pattern ID: ${pattern.patternId}. Existing: ${existing.identityKey}, Duplicate: ${pattern.identityKey}`,
        relatedIds: [pattern.patternId],
        stage: 'PATTERN'
      });
    } else {
      idMap.set(pattern.patternId, pattern);
    }
  }

  return {
    valid: diagnostics.length === 0,
    diagnostics: Object.freeze(diagnostics)
  };
}

/**
 * Validates that all qualification pattern IDs have corresponding pattern candidates.
 *
 * @param qualifications - Pattern qualifications to validate
 * @param patterns - Pattern candidates to check against
 * @returns Validation result with diagnostics for orphaned qualifications
 */
export function validateQualificationPatternReferences(
  qualifications: readonly PatternQualification[],
  patterns: readonly PatternCandidate[]
): ValidationResult {
  const diagnostics: OrchestrationDiagnostic[] = [];
  const patternIdSet = new Set(patterns.map((p) => p.patternId));

  for (const qualification of qualifications) {
    if (!patternIdSet.has(qualification.patternId)) {
      diagnostics.push({
        diagnosticId: `VALIDATION_ORPHANED_QUALIFICATION_${qualification.patternId}`,
        severity: 'ERROR',
        category: 'ORPHANED_REFERENCE',
        message: `Qualification references non-existent pattern ID: ${qualification.patternId}`,
        relatedIds: [qualification.patternId],
        stage: 'QUALIFICATION'
      });
    }
  }

  return {
    valid: diagnostics.length === 0,
    diagnostics: Object.freeze(diagnostics)
  };
}

/**
 * Validates that all mechanism candidate IDs are unique.
 *
 * @param mechanisms - Resolved mechanisms to validate
 * @returns Validation result with diagnostics for duplicates
 */
export function validateUniqueMechanismIds(
  mechanisms: readonly ResolvedMechanism[]
): ValidationResult {
  const diagnostics: OrchestrationDiagnostic[] = [];
  const idMap = new Map<string, ResolvedMechanism>();

  for (const mechanism of mechanisms) {
    const existing = idMap.get(mechanism.candidateId);
    if (existing) {
      diagnostics.push({
        diagnosticId: `VALIDATION_DUPLICATE_MECHANISM_ID_${mechanism.candidateId}`,
        severity: 'ERROR',
        category: 'DUPLICATE_ID',
        message: `Duplicate mechanism candidate ID: ${mechanism.candidateId}. Pattern: ${mechanism.patternId}`,
        relatedIds: [mechanism.candidateId, mechanism.patternId],
        stage: 'MECHANISM'
      });
    } else {
      idMap.set(mechanism.candidateId, mechanism);
    }
  }

  return {
    valid: diagnostics.length === 0,
    diagnostics: Object.freeze(diagnostics)
  };
}

/**
 * Validates that all mechanism pattern IDs have corresponding pattern candidates.
 *
 * @param mechanisms - Resolved mechanisms to validate
 * @param patterns - Pattern candidates to check against
 * @returns Validation result with diagnostics for orphaned mechanisms
 */
export function validateMechanismPatternReferences(
  mechanisms: readonly ResolvedMechanism[],
  patterns: readonly PatternCandidate[]
): ValidationResult {
  const diagnostics: OrchestrationDiagnostic[] = [];
  const patternIdSet = new Set(patterns.map((p) => p.patternId));

  for (const mechanism of mechanisms) {
    if (!patternIdSet.has(mechanism.patternId)) {
      diagnostics.push({
        diagnosticId: `VALIDATION_ORPHANED_MECHANISM_${mechanism.candidateId}`,
        severity: 'ERROR',
        category: 'ORPHANED_REFERENCE',
        message: `Mechanism references non-existent pattern ID: ${mechanism.patternId}`,
        relatedIds: [mechanism.candidateId, mechanism.patternId],
        stage: 'MECHANISM'
      });
    }
  }

  return {
    valid: diagnostics.length === 0,
    diagnostics: Object.freeze(diagnostics)
  };
}

/**
 * Validates that all refinement candidate IDs have corresponding resolved mechanisms.
 *
 * @param refinements - Mechanism refinements to validate
 * @param mechanisms - Resolved mechanisms to check against
 * @returns Validation result with diagnostics for orphaned refinements
 */
export function validateRefinementCandidateReferences(
  refinements: readonly MechanismRefinement[],
  mechanisms: readonly ResolvedMechanism[]
): ValidationResult {
  const diagnostics: OrchestrationDiagnostic[] = [];
  const candidates = new Map(mechanisms.map(mechanism => [mechanism.candidateId, mechanism]));
  const refinementCandidateIds = new Set<string>();

  for (const refinement of refinements) {
    if (refinementCandidateIds.has(refinement.candidateId)) {
      diagnostics.push({
        diagnosticId: `VALIDATION_DUPLICATE_REFINEMENT_CANDIDATE_${refinement.candidateId}`,
        severity: 'ERROR',
        category: 'DUPLICATE_ID',
        message: `More than one refinement targets mechanism candidate ${refinement.candidateId}`,
        relatedIds: [refinement.candidateId],
        stage: 'REFINEMENT'
      });
    } else {
      refinementCandidateIds.add(refinement.candidateId);
    }

    const candidate = candidates.get(refinement.candidateId);
    if (!candidate) {
      const mechanismId = refinement.resolution === 'REFINED' ? refinement.mechanismId : 'UNRESOLVED';
      diagnostics.push({
        diagnosticId: `VALIDATION_ORPHANED_REFINEMENT_${mechanismId}`,
        severity: 'ERROR',
        category: 'ORPHANED_REFERENCE',
        message: `Refinement references non-existent mechanism candidate ID: ${refinement.candidateId}`,
        relatedIds: [mechanismId, refinement.candidateId],
        stage: 'REFINEMENT'
      });
      continue;
    }

    if (refinement.mechanismType !== candidate.mechanismType) {
      diagnostics.push({
        diagnosticId: `VALIDATION_REFINEMENT_MECHANISM_TYPE_MISMATCH_${refinement.candidateId}`,
        severity: 'ERROR',
        category: 'INVALID_REFERENCE',
        message: `Refinement mechanismType '${refinement.mechanismType}' does not match candidate mechanismType '${candidate.mechanismType}'`,
        relatedIds: [refinement.candidateId],
        stage: 'REFINEMENT'
      });
    }

    if (refinement.resolution === 'REFINED') {
      if (
        !refinement.mechanism ||
        refinement.mechanism.mechanismId !== refinement.mechanismId ||
        refinement.mechanism.patternId !== candidate.patternId ||
        refinement.mechanism.mechanismType !== refinement.mechanismType
      ) {
        diagnostics.push({
          diagnosticId: `VALIDATION_INVALID_REFINED_MECHANISM_REFERENCE_${refinement.candidateId}`,
          severity: 'ERROR',
          category: 'INVALID_REFERENCE',
          message: `Refined mechanism identity, pattern, or type does not match candidate ${refinement.candidateId}`,
          relatedIds: [
            refinement.candidateId,
            refinement.mechanismId,
            refinement.mechanism?.mechanismId ?? 'MISSING_MECHANISM'
          ],
          stage: 'REFINEMENT'
        });
      }
    } else if (refinement.resolution === 'UNCHANGED') {
      if (
        refinement.sourceCandidateId !== refinement.candidateId ||
        refinement.mechanism !== null ||
        refinement.status !== 'UNCHANGED'
      ) {
        diagnostics.push({
          diagnosticId: `VALIDATION_INVALID_UNCHANGED_REFINEMENT_${refinement.candidateId}`,
          severity: 'ERROR',
          category: 'CONTRACT_VIOLATION',
          message: `UNCHANGED refinement must preserve its source candidate and must not fabricate a mechanism`,
          relatedIds: [refinement.candidateId, refinement.sourceCandidateId],
          stage: 'REFINEMENT'
        });
      }
    } else if (refinement.resolution === 'UNRESOLVED') {
      const unresolvedStatus: string = refinement.status;
      const unresolvedMechanism: unknown = refinement.mechanism;
      if (unresolvedStatus !== 'UNAVAILABLE' || unresolvedMechanism !== null) {
        diagnostics.push({
          diagnosticId: `VALIDATION_INVALID_UNRESOLVED_REFINEMENT_${refinement.candidateId}`,
          severity: 'ERROR',
          category: 'CONTRACT_VIOLATION',
          message: `UNRESOLVED refinement must remain UNAVAILABLE with no mechanism`,
          relatedIds: [refinement.candidateId],
          stage: 'REFINEMENT'
        });
      }
    }
  }

  return {
    valid: diagnostics.length === 0,
    diagnostics: Object.freeze(diagnostics)
  };
}

/**
 * Validates identity mappings.
 * Ensures that identity mappings are well-formed and reference valid stages.
 *
 * @param mappings - Identity mappings to validate
 * @param validStages - Set of valid stage IDs
 * @returns Validation result with diagnostics for invalid mappings
 */
export function validateIdentityMappings(
  mappings: readonly IdentityMapping[],
  validStages: ReadonlySet<string>
): ValidationResult {
  const diagnostics: OrchestrationDiagnostic[] = [];
  const mappingIds = new Set<string>();

  for (const mapping of mappings) {
    if (mappingIds.has(mapping.mappingId)) {
      diagnostics.push({
        diagnosticId: `VALIDATION_DUPLICATE_IDENTITY_MAPPING_${mapping.mappingId}`,
        severity: 'ERROR',
        category: 'DUPLICATE_ID',
        message: `Duplicate identity mapping ID: ${mapping.mappingId}`,
        relatedIds: [mapping.mappingId],
        stage: 'IDENTITY_MAPPING'
      });
    }
    mappingIds.add(mapping.mappingId);

    if (
      typeof mapping.sourceIdentityKey !== 'string' ||
      mapping.sourceIdentityKey.trim().length === 0 ||
      typeof mapping.targetIdentityKey !== 'string' ||
      mapping.targetIdentityKey.trim().length === 0
    ) {
      diagnostics.push({
        diagnosticId: `VALIDATION_MISSING_IDENTITY_KEY_${mapping.mappingId}`,
        severity: 'ERROR',
        category: 'INVALID_REFERENCE',
        message: `Identity mapping ${mapping.mappingId} requires non-empty source and target semantic identity keys`,
        relatedIds: [mapping.mappingId],
        stage: 'IDENTITY_MAPPING'
      });
    }

    if (!validStages.has(mapping.sourceStage)) {
      diagnostics.push({
        diagnosticId: `VALIDATION_INVALID_SOURCE_STAGE_${mapping.mappingId}`,
        severity: 'ERROR',
        category: 'INVALID_REFERENCE',
        message: `Identity mapping references invalid source stage: ${mapping.sourceStage}`,
        relatedIds: [mapping.mappingId],
        stage: 'IDENTITY_MAPPING'
      });
    }

    if (!validStages.has(mapping.targetStage)) {
      diagnostics.push({
        diagnosticId: `VALIDATION_INVALID_TARGET_STAGE_${mapping.mappingId}`,
        severity: 'ERROR',
        category: 'INVALID_REFERENCE',
        message: `Identity mapping references invalid target stage: ${mapping.targetStage}`,
        relatedIds: [mapping.mappingId],
        stage: 'IDENTITY_MAPPING'
      });
    }
  }

  return {
    valid: diagnostics.length === 0,
    diagnostics: Object.freeze(diagnostics)
  };
}

/**
 * Validates relationship mappings.
 * Ensures that relationship mappings are well-formed and reference valid stages.
 * Additionally validates that sourceId and targetId exist in the appropriate producer outputs.
 *
 * @param mappings - Relationship mappings to validate
 * @param validStages - Set of valid stage IDs
 * @param patternCandidates - Pattern candidates for PATTERN stage ID validation
 * @param patternQualifications - Pattern qualifications for QUALIFICATION stage ID validation
 * @param resolvedMechanisms - Resolved mechanisms for MECHANISM stage ID validation
 * @param mechanismRefinements - Mechanism refinements for REFINEMENT stage ID validation
 * @returns Validation result with diagnostics for invalid mappings
 */
export function validateRelationshipMappings(
  mappings: readonly RelationshipMapping[],
  validStages: ReadonlySet<string>,
  patternCandidates: readonly PatternCandidate[],
  patternQualifications: readonly PatternQualification[],
  resolvedMechanisms: readonly ResolvedMechanism[],
  mechanismRefinements: readonly MechanismRefinement[],
  participantRoleAssignments: readonly ParticipantRoleAssignment[]
): ValidationResult {
  const diagnostics: OrchestrationDiagnostic[] = [];
  const mappingIds = new Set<string>();

  // Build ID sets for each stage
  const patternsById = new Map(patternCandidates.map(pattern => [pattern.patternId, pattern]));
  const qualificationsByPatternId = new Map(
    patternQualifications.map(qualification => [qualification.patternId, qualification])
  );
  const mechanismsByCandidateId = new Map(
    resolvedMechanisms.map(mechanism => [mechanism.candidateId, mechanism])
  );
  const refinementsByCandidateId = new Map<string, MechanismRefinement[]>();
  for (const refinement of mechanismRefinements) {
    const existing = refinementsByCandidateId.get(refinement.candidateId) ?? [];
    refinementsByCandidateId.set(refinement.candidateId, [...existing, refinement]);
  }
  const rolesByReferenceId = new Map<string, RelationshipLineage>(
    participantRoleAssignments.map(role => [
      participantRoleAssignmentReferenceId(
        role.patternId,
        role.assignment.participantId,
        role.assignment.primaryRole
      ),
      { patternId: role.patternId }
    ])
  );

  for (const mapping of mappings) {
    if (mappingIds.has(mapping.mappingId)) {
      diagnostics.push({
        diagnosticId: `VALIDATION_DUPLICATE_RELATIONSHIP_MAPPING_${mapping.mappingId}`,
        severity: 'ERROR',
        category: 'DUPLICATE_ID',
        message: `Duplicate relationship mapping ID: ${mapping.mappingId}`,
        relatedIds: [mapping.mappingId],
        stage: 'RELATIONSHIP_MAPPING'
      });
    }
    mappingIds.add(mapping.mappingId);

    if (!validStages.has(mapping.sourceStage)) {
      diagnostics.push({
        diagnosticId: `VALIDATION_INVALID_SOURCE_STAGE_${mapping.mappingId}`,
        severity: 'ERROR',
        category: 'INVALID_REFERENCE',
        message: `Relationship mapping references invalid source stage: ${mapping.sourceStage}`,
        relatedIds: [mapping.mappingId],
        stage: 'RELATIONSHIP_MAPPING'
      });
    }

    if (!validStages.has(mapping.targetStage)) {
      diagnostics.push({
        diagnosticId: `VALIDATION_INVALID_TARGET_STAGE_${mapping.mappingId}`,
        severity: 'ERROR',
        category: 'INVALID_REFERENCE',
        message: `Relationship mapping references invalid target stage: ${mapping.targetStage}`,
        relatedIds: [mapping.mappingId],
        stage: 'RELATIONSHIP_MAPPING'
      });
    }

    if (!ALLOWED_RELATIONSHIP_STAGE_PAIRS.has(`${mapping.sourceStage}->${mapping.targetStage}`)) {
      diagnostics.push({
        diagnosticId: `VALIDATION_INVALID_RELATIONSHIP_STAGE_PAIR_${mapping.mappingId}`,
        severity: 'ERROR',
        category: 'INVALID_REFERENCE',
        message: `Relationship mapping uses unsupported stage pair ${mapping.sourceStage}->${mapping.targetStage}`,
        relatedIds: [mapping.mappingId],
        stage: 'RELATIONSHIP_MAPPING'
      });
    }

    // Validate sourceId exists in the appropriate producer output
    const sourceObject = resolveMappingId(
      mapping.sourceId,
      mapping.sourceStage,
      patternsById,
      qualificationsByPatternId,
      rolesByReferenceId,
      mechanismsByCandidateId,
      refinementsByCandidateId,
      mapping.mappingId,
      diagnostics,
      'source'
    );

    if (!sourceObject) {
      diagnostics.push({
        diagnosticId: `VALIDATION_INVALID_SOURCE_ID_${mapping.mappingId}`,
        severity: 'ERROR',
        category: 'INVALID_REFERENCE',
        message: `Relationship mapping sourceId '${mapping.sourceId}' does not exist in stage '${mapping.sourceStage}'`,
        relatedIds: [mapping.mappingId, mapping.sourceId],
        stage: 'RELATIONSHIP_MAPPING'
      });
    }

    // Validate targetId exists in the appropriate producer output
    const targetObject = resolveMappingId(
      mapping.targetId,
      mapping.targetStage,
      patternsById,
      qualificationsByPatternId,
      rolesByReferenceId,
      mechanismsByCandidateId,
      refinementsByCandidateId,
      mapping.mappingId,
      diagnostics,
      'target'
    );

    if (!targetObject) {
      diagnostics.push({
        diagnosticId: `VALIDATION_INVALID_TARGET_ID_${mapping.mappingId}`,
        severity: 'ERROR',
        category: 'INVALID_REFERENCE',
        message: `Relationship mapping targetId '${mapping.targetId}' does not exist in stage '${mapping.targetStage}'`,
        relatedIds: [mapping.mappingId, mapping.targetId],
        stage: 'RELATIONSHIP_MAPPING'
      });
    }

    if (
      mapping.sourceStage === 'QUALIFICATION' &&
      mapping.targetStage === 'PARTICIPANT_ROLES' &&
      rolesByReferenceId.get(mapping.targetId)?.patternId !== mapping.sourceId
    ) {
      diagnostics.push({
        diagnosticId: `VALIDATION_INVALID_PARTICIPANT_ROLE_LINK_${mapping.mappingId}`,
        severity: 'ERROR',
        category: 'INVALID_REFERENCE',
        message: `Qualification-to-participant-role mapping ${mapping.mappingId} does not match an actual role assignment`,
        relatedIds: [mapping.mappingId, mapping.sourceId, mapping.targetId],
        stage: 'RELATIONSHIP_MAPPING'
      });
    }

    if (sourceObject && targetObject) {
      const sameLineage = (() => {
        switch (`${mapping.sourceStage}->${mapping.targetStage}`) {
          case 'PATTERN->QUALIFICATION':
            return sourceObject.patternId === targetObject.patternId;
          case 'QUALIFICATION->PARTICIPANT_ROLES':
            return sourceObject.patternId === targetObject.patternId;
          case 'QUALIFICATION->MECHANISM':
            return sourceObject.patternId === targetObject.patternId;
          case 'MECHANISM->REFINEMENT':
            return sourceObject.candidateId === targetObject.candidateId;
          default:
            return false;
        }
      })();
      if (!sameLineage) {
        diagnostics.push({
          diagnosticId: `VALIDATION_CROSS_LINEAGE_RELATIONSHIP_${mapping.mappingId}`,
          severity: 'ERROR',
          category: 'INVALID_REFERENCE',
          message: `Relationship mapping ${mapping.mappingId} connects records from different lineage`,
          relatedIds: [mapping.mappingId, mapping.sourceId, mapping.targetId],
          stage: 'RELATIONSHIP_MAPPING'
        });
      }
    }
  }

  return {
    valid: diagnostics.length === 0,
    diagnostics: Object.freeze(diagnostics)
  };
}

/**
 * Validates that a mapping ID exists in the appropriate stage's ID set.
 */
function resolveMappingId(
  id: string,
  stage: string,
  patternsById: Map<string, PatternCandidate>,
  qualificationsByPatternId: Map<string, PatternQualification>,
  rolesByReferenceId: Map<string, RelationshipLineage>,
  mechanismsByCandidateId: Map<string, ResolvedMechanism>,
  refinementsByCandidateId: Map<string, MechanismRefinement[]>,
  mappingId: string,
  diagnostics: OrchestrationDiagnostic[],
  endpoint: 'source' | 'target'
): RelationshipLineage | undefined {
  switch (stage) {
    case 'PATTERN':
      return patternsById.has(id) ? { patternId: id } : undefined;
    case 'QUALIFICATION':
      return qualificationsByPatternId.has(id) ? { patternId: id } : undefined;
    case 'PARTICIPANT_ROLES':
      return rolesByReferenceId.get(id);
    case 'MECHANISM':
      {
        const mechanism = mechanismsByCandidateId.get(id);
        return mechanism
          ? {
            patternId: mechanism.patternId,
            candidateId: id
          }
          : undefined;
      }
    case 'REFINEMENT':
      return refinementsByCandidateId.get(id)?.length === 1
        ? { candidateId: id }
        : undefined;
    default:
      diagnostics.push({
        diagnosticId: `VALIDATION_UNSUPPORTED_RELATIONSHIP_STAGE_${endpoint.toUpperCase()}_${mappingId}`,
        severity: 'ERROR',
        category: 'INVALID_REFERENCE',
        message: `Cannot validate ${endpoint} ID for relationship stage '${stage}' because no stage ID resolver is defined`,
        relatedIds: [mappingId, id],
        stage: 'RELATIONSHIP_MAPPING'
      });
      return undefined;
  }
}

/**
 * Runs all validation rules and aggregates diagnostics.
 *
 * @param patterns - Pattern candidates
 * @param qualifications - Pattern qualifications
 * @param mechanisms - Resolved mechanisms
 * @param refinements - Mechanism refinements
 * @param identityMappings - Identity mappings
 * @param relationshipMappings - Relationship mappings
 * @param validStages - Set of valid stage IDs
 * @returns Combined validation result
 */
export function validateCanonicalCareerFoundation(
  patterns: readonly PatternCandidate[],
  qualifications: readonly PatternQualification[],
  mechanisms: readonly ResolvedMechanism[],
  refinements: readonly MechanismRefinement[],
  identityMappings: readonly IdentityMapping[],
  relationshipMappings: readonly RelationshipMapping[],
  participantRoleAssignments: readonly ParticipantRoleAssignment[],
  validStages: ReadonlySet<string>
): ValidationResult {
  const allDiagnostics: OrchestrationDiagnostic[] = [];

  // Validate unique pattern IDs
  const patternIdResult = validateUniquePatternIds(patterns);
  allDiagnostics.push(...patternIdResult.diagnostics);

  // Validate qualification pattern references
  const qualRefResult = validateQualificationPatternReferences(qualifications, patterns);
  allDiagnostics.push(...qualRefResult.diagnostics);

  // Validate unique mechanism IDs
  const mechanismIdResult = validateUniqueMechanismIds(mechanisms);
  allDiagnostics.push(...mechanismIdResult.diagnostics);

  // Validate mechanism pattern references
  const mechanismRefResult = validateMechanismPatternReferences(mechanisms, patterns);
  allDiagnostics.push(...mechanismRefResult.diagnostics);

  // Validate refinement candidate references
  const refinementRefResult = validateRefinementCandidateReferences(refinements, mechanisms);
  allDiagnostics.push(...refinementRefResult.diagnostics);

  // Validate identity mappings
  const identityMappingResult = validateIdentityMappings(identityMappings, validStages);
  allDiagnostics.push(...identityMappingResult.diagnostics);

  // Validate relationship mappings (with ID existence validation)
  const relationshipMappingResult = validateRelationshipMappings(
    relationshipMappings,
    validStages,
    patterns,
    qualifications,
    mechanisms,
    refinements,
    participantRoleAssignments
  );
  allDiagnostics.push(...relationshipMappingResult.diagnostics);

  return {
    valid: allDiagnostics.filter((d) => d.severity === 'ERROR').length === 0,
    diagnostics: Object.freeze(allDiagnostics)
  };
}
