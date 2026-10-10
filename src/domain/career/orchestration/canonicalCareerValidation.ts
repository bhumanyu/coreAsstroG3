import type {
  PatternCandidate,
  PatternQualification,
  ResolvedMechanism,
  MechanismRefinement,
  IdentityMapping,
  OrchestrationDiagnostic
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
  const candidateIdSet = new Set(mechanisms.map((m) => m.candidateId));

  for (const refinement of refinements) {
    if (!candidateIdSet.has(refinement.candidateId)) {
      const mechanismId = refinement.resolution === 'REFINED' ? refinement.mechanismId : 'UNRESOLVED';
      diagnostics.push({
        diagnosticId: `VALIDATION_ORPHANED_REFINEMENT_${mechanismId}`,
        severity: 'ERROR',
        category: 'ORPHANED_REFERENCE',
        message: `Refinement references non-existent mechanism candidate ID: ${refinement.candidateId}`,
        relatedIds: [mechanismId, refinement.candidateId],
        stage: 'REFINEMENT'
      });
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

  for (const mapping of mappings) {
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
 * Runs all validation rules and aggregates diagnostics.
 *
 * @param patterns - Pattern candidates
 * @param qualifications - Pattern qualifications
 * @param mechanisms - Resolved mechanisms
 * @param refinements - Mechanism refinements
 * @param mappings - Identity mappings
 * @param validStages - Set of valid stage IDs
 * @returns Combined validation result
 */
export function validateCanonicalCareerFoundation(
  patterns: readonly PatternCandidate[],
  qualifications: readonly PatternQualification[],
  mechanisms: readonly ResolvedMechanism[],
  refinements: readonly MechanismRefinement[],
  mappings: readonly IdentityMapping[],
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
  const mappingResult = validateIdentityMappings(mappings, validStages);
  allDiagnostics.push(...mappingResult.diagnostics);

  return {
    valid: allDiagnostics.filter((d) => d.severity === 'ERROR').length === 0,
    diagnostics: Object.freeze(allDiagnostics)
  };
}
