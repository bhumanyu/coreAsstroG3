import type { DomainEvidence } from '../interpretation/DomainEvidence';
import type { C11ValidationResult } from './canonicalCareerEvidenceMapper';
import { tryResolveC11SemanticIdentity, UNRESOLVED_IDENTITY_SENTINEL } from '../interpretation/DomainEvidence';

/**
 * Evidence Continuity Validation (Gate D)
 *
 * Validates identity/provenance/reference/counting continuity from C4–C7 → foundation → C8 → C9 → C10 → C11.
 * Ensures no invented links or double-counting, with C11 as the sole authority.
 *
 * This validator:
 * - Builds occurrence index (id) and semantic groups (identityKey)
 * - Emits issues for namespace mismatches, missing references, provenance disagreements
 * - Populates provenanceIssueCount and duplicateCountingRiskCount
 * - Validates reference uniqueness in requiredC11EvidenceIds
 * - Composes with existing C11ValidationResult (requiredMissing/optionalMissing/unreferenced)
 */

/**
 * Severity levels for evidence continuity issues.
 */
export type EvidenceContinuitySeverity = 'ERROR' | 'WARNING' | 'INFO';

/**
 * Issue codes for evidence continuity validation.
 *
 * All 11 codes from the specification:
 * 1. DUPLICATE_OCCURRENCE_ID: Multiple evidence records share the same occurrence id
 * 2. UNRESOLVED_SEMANTIC_IDENTITY: Evidence has no resolvable semantic identity (empty/whitespace/sentinel identityKey)
 * 3. MISSING_REQUIRED_REFERENCE: C11 references a required evidence ID that is not present in canonical evidence
 * 4. REFERENCE_NAMESPACE_MISMATCH: C11 reference resolves as occurrence ID only (namespace mismatch with semantic identity)
 * 5. MISSING_SOURCE_REFERENCE: Evidence has relatedEvidenceIds that reference non-existent source evidence
 * 6. MISSING_RULE_PROVENANCE: Evidence lacks ruleId when rule provenance is expected
 * 7. PROVENANCE_DISAGREEMENT: Multiple occurrences of the same semantic identity disagree on provenance/ruleId
 * 8. MIXED_POLARITY_WITHOUT_IDENTITY_KEY: MIXED polarity without shared identityKey (cannot track as split)
 * 9. DUPLICATE_C11_REFERENCE: Same evidence ID appears multiple times in requiredC11EvidenceIds
 * 10. ORPHANED_EVIDENCE: Evidence is produced but not referenced by C11 (informational)
 * 11. IDENTITY_KEY_COLLISION: Different semantic facts share the same identityKey (semantic conflict)
 */
export type EvidenceContinuityIssueCode =
  | 'DUPLICATE_OCCURRENCE_ID'
  | 'UNRESOLVED_SEMANTIC_IDENTITY'
  | 'MISSING_REQUIRED_REFERENCE'
  | 'REFERENCE_NAMESPACE_MISMATCH'
  | 'MISSING_SOURCE_REFERENCE'
  | 'MISSING_RULE_PROVENANCE'
  | 'PROVENANCE_DISAGREEMENT'
  | 'MIXED_POLARITY_WITHOUT_IDENTITY_KEY'
  | 'DUPLICATE_C11_REFERENCE'
  | 'ORPHANED_EVIDENCE'
  | 'IDENTITY_KEY_COLLISION';

/**
 * Individual evidence continuity issue.
 */
export interface EvidenceContinuityIssue {
  readonly code: EvidenceContinuityIssueCode;
  readonly severity: EvidenceContinuitySeverity;
  readonly evidenceId?: string;
  readonly identityKey?: string;
  readonly message: string;
}

/**
 * Evidence continuity validation report.
 *
 * Composes with C11ValidationResult to provide comprehensive continuity validation.
 * - Reuses requiredMissing/optionalMissing/unreferenced from C11ValidationResult
 * - Adds namespace-specific issues (namespace mismatch, provenance disagreement, etc.)
 * - Provides counts for provenance issues and duplicate counting risks
 */
export interface EvidenceContinuityReport {
  /**
   * C11 reference validation result (composed from existing validator).
   */
  readonly c11Validation: C11ValidationResult;
  /**
   * Continuity issues detected during validation.
   */
  readonly issues: readonly EvidenceContinuityIssue[];
  /**
   * Count of provenance-related issues (MISSING_SOURCE_REFERENCE, MISSING_RULE_PROVENANCE, PROVENANCE_DISAGREEMENT).
   */
  readonly provenanceIssueCount: number;
  /**
   * Count of duplicate counting risk issues (DUPLICATE_OCCURRENCE_ID, IDENTITY_KEY_COLLISION, DUPLICATE_C11_REFERENCE).
   */
  readonly duplicateCountingRiskCount: number;
  /**
   * Overall validation status (true if no ERROR-severity issues).
   */
  readonly valid: boolean;
}

/**
 * Input parameters for evidence continuity validation.
 */
export interface EvidenceContinuityValidationInput {
  /**
   * Canonical evidence to validate.
   */
  readonly evidence: readonly DomainEvidence[];
  /**
   * Required C11 evidence IDs (must all be present in canonical evidence).
   */
  readonly requiredC11EvidenceIds: readonly string[];
  /**
   * C11 validation result (composed from existing validator).
   */
  readonly c11Validation: C11ValidationResult;
  /**
   * Upstream source registry (IDs that upstream producers actually emit).
   * Used to validate relatedEvidenceIds references.
   * If provided, missing source references that are not in this registry become ERROR.
   * If not provided, all missing source references remain WARNING (backward compatible).
   */
  readonly upstreamSourceIds?: readonly string[];
}

/**
 * Validates evidence continuity for canonical evidence against C11 references.
 *
 * This validator:
 * - Builds occurrence index (id) and semantic groups (identityKey)
 * - Emits DUPLICATE_OCCURRENCE_ID for duplicate occurrence IDs
 * - Emits UNRESOLVED_SEMANTIC_IDENTITY for empty/whitespace/sentinel identityKey
 * - Emits MISSING_REQUIRED_REFERENCE for C11 references not present in canonical evidence
 * - Emits REFERENCE_NAMESPACE_MISMATCH when C11 reference resolves as occurrence ID only
 * - Validates relatedEvidenceIds presence (MISSING_SOURCE_REFERENCE)
 * - Validates ruleId presence (MISSING_RULE_PROVENANCE)
 * - Detects provenance disagreement across occurrences (PROVENANCE_DISAGREEMENT)
 * - Validates reference uniqueness in requiredC11EvidenceIds (DUPLICATE_C11_REFERENCE)
 * - Populates provenanceIssueCount and duplicateCountingRiskCount
 *
 * @param input - Validation input parameters
 * @returns Evidence continuity validation report
 */
export function validateEvidenceContinuity(
  input: EvidenceContinuityValidationInput
): EvidenceContinuityReport {
  const { evidence, requiredC11EvidenceIds, c11Validation } = input;
  const issues: EvidenceContinuityIssue[] = [];

  // Build occurrence index (id)
  const occurrenceIndex = new Map<string, DomainEvidence[]>();
  for (const e of evidence) {
    const existing = occurrenceIndex.get(e.id) ?? [];
    occurrenceIndex.set(e.id, [...existing, e]);
  }

  // Build semantic groups (identityKey)
  const semanticGroups = new Map<string, DomainEvidence[]>();
  for (const e of evidence) {
    const identityKey = tryResolveC11SemanticIdentity(e);
    if (identityKey !== null) {
      const existing = semanticGroups.get(identityKey) ?? [];
      semanticGroups.set(identityKey, [...existing, e]);
    }
  }

  // Build source evidence index for relatedEvidenceIds validation
  const sourceEvidenceIds = new Set(evidence.map(e => e.id));

  // Check for duplicate occurrence IDs
  for (const [id, occurrences] of occurrenceIndex.entries()) {
    if (occurrences.length > 1) {
      issues.push({
        code: 'DUPLICATE_OCCURRENCE_ID',
        severity: 'ERROR',
        evidenceId: id,
        message: `Duplicate occurrence ID "${id}" appears ${occurrences.length} times in canonical evidence`
      });
    }
  }

  // Check for unresolved semantic identities
  for (const e of evidence) {
    const identityKey = tryResolveC11SemanticIdentity(e);
    if (identityKey === null) {
      // Evidence has no resolvable semantic identity (empty/whitespace/sentinel identityKey)
      // Emit UNRESOLVED_SEMANTIC_IDENTITY for all cases regardless of polarity
      issues.push({
        code: 'UNRESOLVED_SEMANTIC_IDENTITY',
        severity: 'ERROR',
        evidenceId: e.id,
        message: `Evidence "${e.id}" has unresolved semantic identity (empty/whitespace/sentinel identityKey)`
      });
    }
  }

  // Check for missing required references (compose with C11ValidationResult)
  for (const missingId of c11Validation.requiredMissing) {
    issues.push({
      code: 'MISSING_REQUIRED_REFERENCE',
      severity: 'ERROR',
      evidenceId: missingId,
      message: `C11 references required evidence ID "${missingId}" but it is not present in canonical evidence`
    });
  }

  // Check for namespace mismatch (C11 reference resolves as occurrence ID only)
  for (const c11Ref of requiredC11EvidenceIds) {
    // Check if C11 reference exists as an occurrence ID but not as a semantic identity
    const hasOccurrence = occurrenceIndex.has(c11Ref);
    const hasSemanticIdentity = semanticGroups.has(c11Ref);

    if (hasOccurrence && !hasSemanticIdentity) {
      issues.push({
        code: 'REFERENCE_NAMESPACE_MISMATCH',
        severity: 'ERROR',
        evidenceId: c11Ref,
        message: `C11 reference "${c11Ref}" resolves as occurrence ID only (namespace mismatch with semantic identity)`
      });
    }
  }

  // Check for missing source references
  // Note: relatedEvidenceIds may reference upstream raw source IDs that are not in the canonical evidence list
  // This is intentional provenance tracking, not cross-references within canonical evidence
  //
  // When upstreamSourceIds is provided, we can distinguish between:
  // - RESOLVED: Reference exists in canonical evidence
  // - EXTERNAL_KNOWN: Reference exists in upstream source registry (valid provenance)
  // - MISSING: Reference exists neither in canonical evidence nor upstream registry (ERROR)
  //
  // When upstreamSourceIds is not provided, missing references remain WARNING (backward compatible)
  const upstreamSourceRegistry = input.upstreamSourceIds ? new Set(input.upstreamSourceIds) : null;

  for (const e of evidence) {
    for (const sourceId of e.relatedEvidenceIds) {
      const inCanonicalEvidence = sourceEvidenceIds.has(sourceId);
      const inUpstreamRegistry = upstreamSourceRegistry?.has(sourceId) ?? false;

      if (inCanonicalEvidence) {
        // Reference resolved in canonical evidence - no issue
        continue;
      }

      if (upstreamSourceRegistry) {
        // Upstream registry provided - check against it
        if (inUpstreamRegistry) {
          // Reference exists in upstream registry - EXTERNAL_KNOWN (informational)
          issues.push({
            code: 'MISSING_SOURCE_REFERENCE',
            severity: 'INFO',
            evidenceId: e.id,
            message: `Evidence "${e.id}" references upstream source ID "${sourceId}" (EXTERNAL_KNOWN in upstream registry)`
          });
        } else {
          // Reference exists neither in canonical evidence nor upstream registry - MISSING (ERROR)
          issues.push({
            code: 'MISSING_SOURCE_REFERENCE',
            severity: 'ERROR',
            evidenceId: e.id,
            message: `Evidence "${e.id}" references source ID "${sourceId}" that is MISSING (not in canonical evidence or upstream registry)`
          });
        }
      } else {
        // No upstream registry provided - backward compatible WARNING
        issues.push({
          code: 'MISSING_SOURCE_REFERENCE',
          severity: 'WARNING',
          evidenceId: e.id,
          message: `Evidence "${e.id}" references non-existent source evidence ID "${sourceId}"`
        });
      }
    }
  }

  // Check for missing rule provenance (evidence from rule-based sources should have ruleId)
  for (const e of evidence) {
    // C4-C7 evidence (source: C4_STRUCTURAL_REASONING) should have ruleId (rule-based sources)
    if (e.source === 'C4_STRUCTURAL_REASONING' && !e.ruleId) {
      issues.push({
        code: 'MISSING_RULE_PROVENANCE',
        severity: 'WARNING',
        evidenceId: e.id,
        message: `Evidence "${e.id}" from C4_STRUCTURAL_REASONING lacks ruleId (missing rule provenance)`
      });
    }
    // C10 evidence (source: D10) should have ruleId (rule-based sources)
    if (e.source === 'D10' && !e.ruleId) {
      issues.push({
        code: 'MISSING_RULE_PROVENANCE',
        severity: 'WARNING',
        evidenceId: e.id,
        message: `Evidence "${e.id}" from D10 lacks ruleId (missing rule provenance)`
      });
    }
  }

  // Check for provenance disagreement across occurrences of the same semantic identity
  // Distinguish legitimate multi-provenance from genuinely contradictory lineage
  for (const [identityKey, group] of semanticGroups.entries()) {
    if (group.length > 1) {
      const first = group[0];

      // Check if all occurrences have the same statement (same semantic fact)
      const statements = new Set(group.map(e => e.statement));
      const sameSemanticFact = statements.size === 1;

      if (sameSemanticFact) {
        // Same semantic fact with different ruleIds = legitimate multi-provenance
        // No error - the mapper's dedup logic handles this by merging and preserving both ruleIds
        // The IDENTITY_KEY_COLLISION check below will catch contradictory lineage
      } else {
        // Different statements with same identityKey = contradictory lineage
        // This is caught by IDENTITY_KEY_COLLISION below, but we also emit PROVENANCE_DISAGREEMENT
        // for clarity that this is a provenance issue
        for (const e of group) {
          if (e.statement !== first.statement) {
            issues.push({
              code: 'PROVENANCE_DISAGREEMENT',
              severity: 'ERROR',
              identityKey,
              evidenceId: e.id,
              message: `Semantic identity "${identityKey}" has contradictory lineage: different semantic facts claim the same identity (statement differs)`
            });
          }
        }
      }
    }
  }

  // Check for MIXED polarity without identityKey
  // Emit ERROR when evidence has MIXED-like split semantics but no resolvable identityKey
  for (const e of evidence) {
    if (e.polarity === 'SUPPORTING' || e.polarity === 'CHALLENGING') {
      const identityKey = tryResolveC11SemanticIdentity(e);
      if (identityKey === null) {
        // Evidence has no resolvable identityKey - cannot track as MIXED split
        // This is an error because MIXED polarity requires identityKey for proper tracking
        issues.push({
          code: 'MIXED_POLARITY_WITHOUT_IDENTITY_KEY',
          severity: 'ERROR',
          evidenceId: e.id,
          message: `Evidence "${e.id}" has ${e.polarity} polarity but no resolvable identityKey (cannot track as MIXED split)`
        });
      }
    }
  }

  // Check for duplicate C11 references
  const c11RefCounts = new Map<string, number>();
  for (const ref of requiredC11EvidenceIds) {
    c11RefCounts.set(ref, (c11RefCounts.get(ref) ?? 0) + 1);
  }
  for (const [ref, count] of c11RefCounts.entries()) {
    if (count > 1) {
      issues.push({
        code: 'DUPLICATE_C11_REFERENCE',
        severity: 'ERROR',
        evidenceId: ref,
        message: `C11 evidence ID "${ref}" appears ${count} times in requiredC11EvidenceIds (duplicate reference)`
      });
    }
  }

  // Check for orphaned evidence (informational)
  for (const unreferencedId of c11Validation.unreferenced) {
    issues.push({
      code: 'ORPHANED_EVIDENCE',
      severity: 'INFO',
      evidenceId: unreferencedId,
      message: `Evidence "${unreferencedId}" is produced but not referenced by C11 (informational)`
    });
  }

  // Check for identity key collision (different semantic facts share same identityKey)
  for (const [identityKey, group] of semanticGroups.entries()) {
    if (group.length > 1) {
      // Check if these are truly different semantic facts (different statements/fields)
      const first = group[0];
      for (const e of group) {
        if (e.statement !== first.statement) {
          issues.push({
            code: 'IDENTITY_KEY_COLLISION',
            severity: 'ERROR',
            identityKey,
            evidenceId: e.id,
            message: `Semantic identity "${identityKey}" has conflicting statements across occurrences (identity key collision)`
          });
          break;
        }
      }
    }
  }

  // Calculate counts
  const provenanceIssueCount = issues.filter(
    i => i.code === 'MISSING_SOURCE_REFERENCE' || i.code === 'MISSING_RULE_PROVENANCE' || i.code === 'PROVENANCE_DISAGREEMENT'
  ).length;

  const duplicateCountingRiskCount = issues.filter(
    i => i.code === 'DUPLICATE_OCCURRENCE_ID' || i.code === 'IDENTITY_KEY_COLLISION' || i.code === 'DUPLICATE_C11_REFERENCE'
  ).length;

  // Valid if no ERROR-severity issues
  const valid = !issues.some(i => i.severity === 'ERROR');

  return Object.freeze({
    c11Validation,
    issues: Object.freeze(issues),
    provenanceIssueCount,
    duplicateCountingRiskCount,
    valid
  });
}
