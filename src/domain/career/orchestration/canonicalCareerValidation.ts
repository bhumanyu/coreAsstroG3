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

  for (const refinement of refinements) {
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
  const patternIdSet = new Set(patternCandidates.map(p => p.patternId));
  const qualificationPatternIdSet = new Set(patternQualifications.map(q => q.patternId));
  const participantIdSet = new Set(participantRoleAssignments.map(role => role.assignment.participantId));
  const mechanismCandidateIdSet = new Set(resolvedMechanisms.map(m => m.candidateId));
  const refinementCandidateIdSet = new Set(mechanismRefinements.map(r => r.candidateId));
  const roleLinkPairs = new Set(participantRoleAssignments.map(
    role => `${role.patternId}|${role.assignment.participantId}`
  ));

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
    const sourceIdValid = validateMappingId(
      mapping.sourceId,
      mapping.sourceStage,
      patternIdSet,
      qualificationPatternIdSet,
      participantIdSet,
      mechanismCandidateIdSet,
      refinementCandidateIdSet,
      mapping,
      diagnostics,
      'source'
    );

    if (!sourceIdValid) {
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
    const targetIdValid = validateMappingId(
      mapping.targetId,
      mapping.targetStage,
      patternIdSet,
      qualificationPatternIdSet,
      participantIdSet,
      mechanismCandidateIdSet,
      refinementCandidateIdSet,
      mapping,
      diagnostics,
      'target'
    );

    if (!targetIdValid) {
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
      !roleLinkPairs.has(`${mapping.sourceId}|${mapping.targetId}`)
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
  }

  return {
    valid: diagnostics.length === 0,
    diagnostics: Object.freeze(diagnostics)
  };
}

/**
 * Validates that a mapping ID exists in the appropriate stage's ID set.
 */
function validateMappingId(
  id: string,
  stage: string,
  patternIdSet: Set<string>,
  qualificationPatternIdSet: Set<string>,
  participantIdSet: Set<string>,
  mechanismCandidateIdSet: Set<string>,
  refinementCandidateIdSet: Set<string>,
  mapping: RelationshipMapping,
  diagnostics: OrchestrationDiagnostic[],
  endpoint: 'source' | 'target'
): boolean {
  switch (stage) {
    case 'PATTERN':
      return patternIdSet.has(id);
    case 'QUALIFICATION':
      return qualificationPatternIdSet.has(id);
    case 'PARTICIPANT_ROLES':
      return participantIdSet.has(id);
    case 'MECHANISM':
      return mechanismCandidateIdSet.has(id);
    case 'REFINEMENT':
      return refinementCandidateIdSet.has(id);
    default:
      diagnostics.push({
        diagnosticId: `VALIDATION_UNSUPPORTED_RELATIONSHIP_STAGE_${endpoint.toUpperCase()}_${mapping.mappingId}`,
        severity: 'WARNING',
        category: 'UNSUPPORTED_VALIDATION',
        message: `Cannot validate ${endpoint} ID for relationship stage '${stage}' because no stage ID resolver is defined`,
        relatedIds: [mapping.mappingId, id],
        stage: 'RELATIONSHIP_MAPPING'
      });
      return false;
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
