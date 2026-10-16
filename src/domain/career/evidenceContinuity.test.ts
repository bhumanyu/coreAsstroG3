import { describe, it, expect } from 'vitest';
import {
  validateEvidenceContinuity,
  type EvidenceContinuityValidationInput,
  type EvidenceContinuityIssueCode
} from './evidenceContinuity';
import {
  createDomainEvidence,
  type DomainEvidence
} from '../interpretation/DomainEvidence';
import type { C11ValidationResult, ContradictoryEvidenceDiagnostic } from './canonicalCareerEvidenceMapper';

describe('validateEvidenceContinuity', () => {
  const createMockEvidence = (overrides: Partial<DomainEvidence> = {}): DomainEvidence => {
    return createDomainEvidence({
      id: overrides.id ?? 'evidence-1',
      sourceType: overrides.sourceType ?? 'STRUCTURAL',
      domain: 'CAREER',
      role: 'PRIMARY',
      phase: 'NATAL_PROMISE',
      source: 'C4_STRUCTURAL_REASONING',
      statement: 'Test evidence',
      polarity: 'SUPPORTING',
      strength: 'STRONG',
      priority: 1,
      relatedEvidenceIds: overrides.relatedEvidenceIds ?? [],
      ruleId: overrides.ruleId ?? 'RULE_1',
      identityKey: overrides.identityKey ?? 'identity-1',
      ...overrides
    });
  };

  const createMockC11Validation = (overrides: Partial<C11ValidationResult> = {}): C11ValidationResult => {
    return {
      requiredMissing: overrides.requiredMissing ?? [],
      optionalMissing: overrides.optionalMissing ?? [],
      unreferenced: overrides.unreferenced ?? [],
      valid: overrides.valid ?? true
    };
  };

  it('validates with no issues for clean evidence', () => {
    const evidence = [
      createMockEvidence({ id: 'evidence-1', identityKey: 'identity-1' }),
      createMockEvidence({ id: 'evidence-2', identityKey: 'identity-2' })
    ];

    const input: EvidenceContinuityValidationInput = {
      evidence,
      requiredC11EvidenceIds: ['identity-1', 'identity-2'],
      c11Validation: createMockC11Validation({ valid: true })
    };

    const result = validateEvidenceContinuity(input);

    expect(result.valid).toBe(true);
    expect(result.issues).toHaveLength(0);
    expect(result.provenanceIssueCount).toBe(0);
    expect(result.duplicateCountingRiskCount).toBe(0);
  });

  it('detects DUPLICATE_OCCURRENCE_ID', () => {
    const evidence = [
      createMockEvidence({ id: 'duplicate-id', identityKey: 'identity-1' }),
      createMockEvidence({ id: 'duplicate-id', identityKey: 'identity-2' })
    ];

    const input: EvidenceContinuityValidationInput = {
      evidence,
      requiredC11EvidenceIds: ['identity-1', 'identity-2'],
      c11Validation: createMockC11Validation({ valid: true })
    };

    const result = validateEvidenceContinuity(input);

    expect(result.valid).toBe(false);
    expect(result.issues).toHaveLength(1);
    expect(result.issues[0].code).toBe('DUPLICATE_OCCURRENCE_ID');
    expect(result.issues[0].evidenceId).toBe('duplicate-id');
    expect(result.duplicateCountingRiskCount).toBe(1);
  });

  it('detects UNRESOLVED_SEMANTIC_IDENTITY for empty identityKey', () => {
    const evidence = [
      createMockEvidence({ id: 'evidence-1', identityKey: '' })
    ];

    const input: EvidenceContinuityValidationInput = {
      evidence,
      requiredC11EvidenceIds: [],
      c11Validation: createMockC11Validation({ valid: true })
    };

    const result = validateEvidenceContinuity(input);

    // Note: UNRESOLVED_SEMANTIC_IDENTITY is emitted but only if identityKey is empty/whitespace
    // The severity is ERROR, so valid should be false
    expect(result.valid).toBe(false);
    expect(result.issues.length).toBeGreaterThan(0);
    const unresolvedIssues = result.issues.filter(i => i.code === 'UNRESOLVED_SEMANTIC_IDENTITY');
    expect(unresolvedIssues.length).toBeGreaterThan(0);
  });

  it('detects UNRESOLVED_SEMANTIC_IDENTITY for whitespace identityKey', () => {
    const evidence = [
      createMockEvidence({ id: 'evidence-1', identityKey: '   ' })
    ];

    const input: EvidenceContinuityValidationInput = {
      evidence,
      requiredC11EvidenceIds: [],
      c11Validation: createMockC11Validation({ valid: true })
    };

    const result = validateEvidenceContinuity(input);

    expect(result.valid).toBe(false);
    // Both UNRESOLVED_SEMANTIC_IDENTITY and MIXED_POLARITY_WITHOUT_IDENTITY_KEY are emitted
    expect(result.issues.length).toBe(2);
    const unresolvedIssues = result.issues.filter(i => i.code === 'UNRESOLVED_SEMANTIC_IDENTITY');
    const mixedPolarityIssues = result.issues.filter(i => i.code === 'MIXED_POLARITY_WITHOUT_IDENTITY_KEY');
    expect(unresolvedIssues.length).toBe(1);
    expect(mixedPolarityIssues.length).toBe(1);
  });

  it('detects MISSING_REQUIRED_REFERENCE from C11 validation', () => {
    const evidence = [
      createMockEvidence({ id: 'evidence-1', identityKey: 'identity-1' })
    ];

    const input: EvidenceContinuityValidationInput = {
      evidence,
      requiredC11EvidenceIds: ['identity-1', 'missing-id'],
      c11Validation: createMockC11Validation({
        requiredMissing: ['missing-id'],
        valid: false
      })
    };

    const result = validateEvidenceContinuity(input);

    expect(result.valid).toBe(false);
    expect(result.issues).toHaveLength(1);
    expect(result.issues[0].code).toBe('MISSING_REQUIRED_REFERENCE');
    expect(result.issues[0].evidenceId).toBe('missing-id');
  });

  it('detects REFERENCE_NAMESPACE_MISMATCH', () => {
    const evidence = [
      createMockEvidence({ id: 'occurrence-only', identityKey: 'semantic-1' })
    ];

    const input: EvidenceContinuityValidationInput = {
      evidence,
      requiredC11EvidenceIds: ['occurrence-only'], // References occurrence ID, not semantic identity
      c11Validation: createMockC11Validation({ valid: true })
    };

    const result = validateEvidenceContinuity(input);

    expect(result.valid).toBe(false);
    expect(result.issues).toHaveLength(1);
    expect(result.issues[0].code).toBe('REFERENCE_NAMESPACE_MISMATCH');
    expect(result.issues[0].evidenceId).toBe('occurrence-only');
  });

  it('detects MISSING_SOURCE_REFERENCE', () => {
    const evidence = [
      createMockEvidence({
        id: 'evidence-1',
        identityKey: 'identity-1',
        relatedEvidenceIds: ['non-existent-source']
      })
    ];

    const input: EvidenceContinuityValidationInput = {
      evidence,
      requiredC11EvidenceIds: ['identity-1'],
      c11Validation: createMockC11Validation({ valid: true })
    };

    const result = validateEvidenceContinuity(input);

    // MISSING_SOURCE_REFERENCE is WARNING severity (backward compatible without upstreamSourceIds)
    expect(result.valid).toBe(true);
    expect(result.issues.length).toBeGreaterThan(0);
    const missingSourceIssues = result.issues.filter(i => i.code === 'MISSING_SOURCE_REFERENCE');
    expect(missingSourceIssues.length).toBeGreaterThan(0);
    expect(missingSourceIssues[0].evidenceId).toBe('evidence-1');
    expect(missingSourceIssues[0].severity).toBe('WARNING');
    expect(result.provenanceIssueCount).toBe(1);
  });

  // Finding A: Test upstreamSourceIds resolution
  it('MISSING_SOURCE_REFERENCE is ERROR when reference not in upstream registry', () => {
    const evidence = [
      createMockEvidence({
        id: 'evidence-1',
        identityKey: 'identity-1',
        relatedEvidenceIds: ['unknown-source-id']
      })
    ];

    const input: EvidenceContinuityValidationInput = {
      evidence,
      requiredC11EvidenceIds: ['identity-1'],
      c11Validation: createMockC11Validation({ valid: true }),
      upstreamSourceIds: ['known-source-1', 'known-source-2'] // Upstream registry provided
    };

    const result = validateEvidenceContinuity(input);

    // Reference not in upstream registry should be ERROR
    expect(result.valid).toBe(false);
    const missingSourceIssues = result.issues.filter(i => i.code === 'MISSING_SOURCE_REFERENCE');
    expect(missingSourceIssues.length).toBeGreaterThan(0);
    expect(missingSourceIssues[0].evidenceId).toBe('evidence-1');
    expect(missingSourceIssues[0].severity).toBe('ERROR');
    expect(missingSourceIssues[0].message).toContain('MISSING');
  });

  it('MISSING_SOURCE_REFERENCE is INFO when reference in upstream registry', () => {
    const evidence = [
      createMockEvidence({
        id: 'evidence-1',
        identityKey: 'identity-1',
        relatedEvidenceIds: ['known-upstream-source']
      })
    ];

    const input: EvidenceContinuityValidationInput = {
      evidence,
      requiredC11EvidenceIds: ['identity-1'],
      c11Validation: createMockC11Validation({ valid: true }),
      upstreamSourceIds: ['known-upstream-source'] // Reference exists in registry
    };

    const result = validateEvidenceContinuity(input);

    // Reference in upstream registry should be INFO (EXTERNAL_KNOWN)
    expect(result.valid).toBe(true);
    const missingSourceIssues = result.issues.filter(i => i.code === 'MISSING_SOURCE_REFERENCE');
    expect(missingSourceIssues.length).toBeGreaterThan(0);
    expect(missingSourceIssues[0].evidenceId).toBe('evidence-1');
    expect(missingSourceIssues[0].severity).toBe('INFO');
    expect(missingSourceIssues[0].message).toContain('EXTERNAL_KNOWN');
  });

  it('MISSING_SOURCE_REFERENCE not emitted when reference in canonical evidence', () => {
    const evidence = [
      createMockEvidence({
        id: 'evidence-1',
        identityKey: 'identity-1',
        relatedEvidenceIds: ['evidence-2'] // References another evidence in canonical list
      }),
      createMockEvidence({
        id: 'evidence-2',
        identityKey: 'identity-2'
      })
    ];

    const input: EvidenceContinuityValidationInput = {
      evidence,
      requiredC11EvidenceIds: ['identity-1', 'identity-2'],
      c11Validation: createMockC11Validation({ valid: true }),
      upstreamSourceIds: ['some-upstream-id']
    };

    const result = validateEvidenceContinuity(input);

    // Reference resolved in canonical evidence - no MISSING_SOURCE_REFERENCE issue
    const missingSourceIssues = result.issues.filter(i => i.code === 'MISSING_SOURCE_REFERENCE');
    expect(missingSourceIssues.length).toBe(0);
  });

  it('detects MISSING_RULE_PROVENANCE for C4 evidence without ruleId', () => {
    const evidence = [
      createMockEvidence({
        id: 'evidence-1',
        identityKey: 'identity-1',
        source: 'C4_STRUCTURAL_REASONING',
        ruleId: undefined
      })
    ];

    const input: EvidenceContinuityValidationInput = {
      evidence,
      requiredC11EvidenceIds: ['identity-1'],
      c11Validation: createMockC11Validation({ valid: true })
    };

    const result = validateEvidenceContinuity(input);

    // MISSING_RULE_PROVENANCE is WARNING severity, so it doesn't invalidate the result
    expect(result.valid).toBe(true);
    expect(result.issues.length).toBeGreaterThan(0);
    const missingRuleIssues = result.issues.filter(i => i.code === 'MISSING_RULE_PROVENANCE');
    expect(missingRuleIssues.length).toBeGreaterThan(0);
    expect(missingRuleIssues[0].severity).toBe('WARNING');
    expect(result.provenanceIssueCount).toBe(1);
  });

  // Finding 6: Legitimate multi-provenance (same semantic fact, different ruleIds) - no error
  it('allows legitimate multi-provenance with different ruleIds for same semantic fact', () => {
    const evidence = [
      createMockEvidence({
        id: 'evidence-1',
        identityKey: 'identity-1',
        ruleId: 'RULE_A',
        statement: '10th house is strong' // Same semantic fact
      }),
      createMockEvidence({
        id: 'evidence-2',
        identityKey: 'identity-1',
        ruleId: 'RULE_B',
        statement: '10th house is strong' // Same semantic fact
      })
    ];

    const input: EvidenceContinuityValidationInput = {
      evidence,
      requiredC11EvidenceIds: ['identity-1'],
      c11Validation: createMockC11Validation({ valid: true })
    };

    const result = validateEvidenceContinuity(input);

    // Same semantic fact with different ruleIds = legitimate multi-provenance
    // Should NOT emit PROVENANCE_DISAGREEMENT
    expect(result.valid).toBe(true);
    const provenanceIssues = result.issues.filter(i => i.code === 'PROVENANCE_DISAGREEMENT');
    expect(provenanceIssues.length).toBe(0);
  });

  // Finding 6: Contradictory lineage (different semantic facts, same identityKey) - error
  it('detects PROVENANCE_DISAGREEMENT for contradictory lineage (different statements)', () => {
    const evidence = [
      createMockEvidence({
        id: 'evidence-1',
        identityKey: 'identity-1',
        ruleId: 'RULE_A',
        statement: '10th house is strong' // Different semantic fact
      }),
      createMockEvidence({
        id: 'evidence-2',
        identityKey: 'identity-1',
        ruleId: 'RULE_B',
        statement: '10th house is weak' // Contradictory statement
      })
    ];

    const input: EvidenceContinuityValidationInput = {
      evidence,
      requiredC11EvidenceIds: ['identity-1'],
      c11Validation: createMockC11Validation({ valid: true })
    };

    const result = validateEvidenceContinuity(input);

    // Different statements with same identityKey = contradictory lineage
    expect(result.valid).toBe(false);
    const provenanceIssues = result.issues.filter(i => i.code === 'PROVENANCE_DISAGREEMENT');
    expect(provenanceIssues.length).toBeGreaterThan(0);
    expect(provenanceIssues[0].identityKey).toBe('identity-1');
    expect(provenanceIssues[0].message).toContain('contradictory lineage');
  });

  it('detects DUPLICATE_C11_REFERENCE', () => {
    const evidence = [
      createMockEvidence({ id: 'evidence-1', identityKey: 'identity-1' })
    ];

    const input: EvidenceContinuityValidationInput = {
      evidence,
      requiredC11EvidenceIds: ['identity-1', 'identity-1'], // Duplicate reference
      c11Validation: createMockC11Validation({ valid: true })
    };

    const result = validateEvidenceContinuity(input);

    expect(result.valid).toBe(false);
    expect(result.issues).toHaveLength(1);
    expect(result.issues[0].code).toBe('DUPLICATE_C11_REFERENCE');
    expect(result.issues[0].evidenceId).toBe('identity-1');
    expect(result.duplicateCountingRiskCount).toBe(1);
  });

  it('detects ORPHANED_EVIDENCE as INFO', () => {
    const evidence = [
      createMockEvidence({ id: 'evidence-1', identityKey: 'identity-1' })
    ];

    const input: EvidenceContinuityValidationInput = {
      evidence,
      requiredC11EvidenceIds: [],
      c11Validation: createMockC11Validation({
        unreferenced: ['identity-1'],
        valid: true
      })
    };

    const result = validateEvidenceContinuity(input);

    expect(result.valid).toBe(true); // INFO does not invalidate
    expect(result.issues).toHaveLength(1);
    expect(result.issues[0].code).toBe('ORPHANED_EVIDENCE');
    expect(result.issues[0].severity).toBe('INFO');
  });

  it('detects IDENTITY_KEY_COLLISION for conflicting statements', () => {
    const evidence = [
      createMockEvidence({
        id: 'evidence-1',
        identityKey: 'identity-1',
        statement: 'Statement A'
      }),
      createMockEvidence({
        id: 'evidence-2',
        identityKey: 'identity-1',
        statement: 'Statement B'
      })
    ];

    const input: EvidenceContinuityValidationInput = {
      evidence,
      requiredC11EvidenceIds: ['identity-1'],
      c11Validation: createMockC11Validation({ valid: true })
    };

    const result = validateEvidenceContinuity(input);

    expect(result.valid).toBe(false);

    // Should have both PROVENANCE_DISAGREEMENT (contradictory lineage) and IDENTITY_KEY_COLLISION
    const identityCollisionIssues = result.issues.filter(i => i.code === 'IDENTITY_KEY_COLLISION');
    const provenanceIssues = result.issues.filter(i => i.code === 'PROVENANCE_DISAGREEMENT');

    expect(identityCollisionIssues.length).toBeGreaterThan(0);
    expect(identityCollisionIssues[0].identityKey).toBe('identity-1');
    expect(provenanceIssues.length).toBeGreaterThan(0);
    expect(provenanceIssues[0].message).toContain('contradictory lineage');
    expect(result.duplicateCountingRiskCount).toBe(1);
  });

  it('populates provenanceIssueCount correctly', () => {
    const evidence = [
      createMockEvidence({
        id: 'evidence-1',
        identityKey: 'identity-1',
        relatedEvidenceIds: ['non-existent-source'],
        source: 'C4_STRUCTURAL_REASONING',
        ruleId: undefined
      })
    ];

    const input: EvidenceContinuityValidationInput = {
      evidence,
      requiredC11EvidenceIds: ['identity-1'],
      c11Validation: createMockC11Validation({ valid: true })
    };

    const result = validateEvidenceContinuity(input);

    expect(result.provenanceIssueCount).toBe(2); // MISSING_SOURCE_REFERENCE + MISSING_RULE_PROVENANCE
  });

  it('populates duplicateCountingRiskCount correctly', () => {
    const evidence = [
      createMockEvidence({ id: 'duplicate-id', identityKey: 'identity-1' }),
      createMockEvidence({ id: 'duplicate-id', identityKey: 'identity-2' })
    ];

    const input: EvidenceContinuityValidationInput = {
      evidence,
      requiredC11EvidenceIds: ['identity-1', 'identity-1'],
      c11Validation: createMockC11Validation({ valid: true })
    };

    const result = validateEvidenceContinuity(input);

    expect(result.duplicateCountingRiskCount).toBe(2); // DUPLICATE_OCCURRENCE_ID + DUPLICATE_C11_REFERENCE
  });

  it('composes with C11ValidationResult', () => {
    const evidence = [
      createMockEvidence({ id: 'evidence-1', identityKey: 'identity-1' })
    ];

    const c11Validation = createMockC11Validation({
      requiredMissing: ['missing-1'],
      unreferenced: ['unreferenced-1'],
      valid: false
    });

    const input: EvidenceContinuityValidationInput = {
      evidence,
      requiredC11EvidenceIds: ['identity-1', 'missing-1'],
      c11Validation
    };

    const result = validateEvidenceContinuity(input);

    expect(result.c11Validation).toBe(c11Validation);
    expect(result.issues.some(i => i.code === 'MISSING_REQUIRED_REFERENCE')).toBe(true);
    expect(result.issues.some(i => i.code === 'ORPHANED_EVIDENCE')).toBe(true);
  });

  it('detects MIXED_POLARITY_WITHOUT_IDENTITY_KEY', () => {
    const evidence = [
      createMockEvidence({
        id: 'evidence-1',
        identityKey: undefined, // No identityKey
        polarity: 'SUPPORTING'
      })
    ];

    const input: EvidenceContinuityValidationInput = {
      evidence,
      requiredC11EvidenceIds: [],
      c11Validation: createMockC11Validation({ valid: true })
    };

    const result = validateEvidenceContinuity(input);

    expect(result.valid).toBe(false);
    // UNRESOLVED_SEMANTIC_IDENTITY and MIXED_POLARITY_WITHOUT_IDENTITY_KEY are both emitted
    expect(result.issues.length).toBe(2);
    const mixedPolarityIssues = result.issues.filter(i => i.code === 'MIXED_POLARITY_WITHOUT_IDENTITY_KEY');
    expect(mixedPolarityIssues.length).toBe(1);
    expect(mixedPolarityIssues[0].evidenceId).toBe('evidence-1');
  });

  it('detects MISSING_RULE_PROVENANCE for D10 evidence without ruleId', () => {
    const evidence = [
      createMockEvidence({
        id: 'evidence-1',
        identityKey: 'identity-1',
        source: 'D10',
        ruleId: undefined
      })
    ];

    const input: EvidenceContinuityValidationInput = {
      evidence,
      requiredC11EvidenceIds: ['identity-1'],
      c11Validation: createMockC11Validation({ valid: true })
    };

    const result = validateEvidenceContinuity(input);

    // MISSING_RULE_PROVENANCE is WARNING severity, so it doesn't invalidate the result
    expect(result.valid).toBe(true);
    const missingRuleIssues = result.issues.filter(i => i.code === 'MISSING_RULE_PROVENANCE');
    expect(missingRuleIssues.length).toBe(1);
    expect(missingRuleIssues[0].evidenceId).toBe('evidence-1');
    expect(missingRuleIssues[0].severity).toBe('WARNING');
  });

  it('Gate D: colon→underscore normalization is consistent on both sides', () => {
    // Test that the validator correctly handles source references that are in the upstream registry
    // The normalization happens in the interpreter; the validator receives normalized IDs
    const evidence = [
      createMockEvidence({
        id: 'evidence-1',
        identityKey: 'identity-1',
        // Normalized underscore-delimited source ID
        relatedEvidenceIds: ['CAREER_STRUCTURAL_LORD_IN_HOUSE_2_8_SUN']
      })
    ];

    const input: EvidenceContinuityValidationInput = {
      evidence,
      requiredC11EvidenceIds: ['identity-1'],
      c11Validation: createMockC11Validation({ valid: true }),
      // Upstream source IDs are normalized to underscore format (as done in interpreter)
      upstreamSourceIds: ['CAREER_STRUCTURAL_LORD_IN_HOUSE_2_8_SUN']
    };

    const result = validateEvidenceContinuity(input);

    // Should be valid with no MISSING_SOURCE_REFERENCE (INFO-level when in upstream registry)
    // The source reference is in upstreamSourceIds, so it's EXTERNAL_KNOWN (INFO, not ERROR)
    expect(result.valid).toBe(true);
    const missingSourceRefs = result.issues.filter(i => i.code === 'MISSING_SOURCE_REFERENCE');
    expect(missingSourceRefs.length).toBe(1); // INFO-level, not ERROR
    expect(missingSourceRefs[0].severity).toBe('INFO');
  });

  /**
   * NOTE: MISSING_RULE_PROVENANCE D10 test removed in commit 070945f4
   *
   * The test 'detects MISSING_RULE_PROVENANCE for D10 evidence without ruleId' was removed
   * because the producer contract changed: D10 resolution-source records (which have no ruleId)
   * are now properly distinguished via the evidenceKind field and excluded from evidenceIds.
   *
   * The remaining D10 occurrence records always have ruleId (per C10_D10 producer contract),
   * so the MISSING_RULE_PROVENANCE check for D10 would never trigger in practice.
   *
   * The validator still emits MISSING_RULE_PROVENANCE for C4_STRUCTURAL_REASONING evidence without ruleId,
   * which remains a valid check since C4 evidence should always have ruleId per the producer contract.
   */

  it('detects CONTRADICTORY_DASHA_EVIDENCE with full diagnostic details', () => {
    const evidence = [
      createMockEvidence({ id: 'evidence-1', identityKey: 'identity-1' })
    ];

    const contradictoryEvidence: ContradictoryEvidenceDiagnostic[] = [
      {
        identityKey: 'contradictory-identity-1',
        evidenceId: 'contradictory-evidence-1',
        reason: 'SUPPORTING polarity with contradictory effect: CHALLENGE'
      },
      {
        identityKey: 'contradictory-identity-2',
        evidenceId: 'contradictory-evidence-2',
        reason: 'MIXED direction with disallowed effect: DOES_NOT_ACTIVATE'
      }
    ];

    const input: EvidenceContinuityValidationInput = {
      evidence,
      requiredC11EvidenceIds: ['identity-1'],
      c11Validation: createMockC11Validation({ valid: true }),
      contradictoryEvidence
    };

    const result = validateEvidenceContinuity(input);

    // Should be invalid due to contradictory evidence
    expect(result.valid).toBe(false);

    // Should emit ERROR-severity issues for each contradictory evidence item
    const contradictoryIssues = result.issues.filter(i => i.code === 'CONTRADICTORY_DASHA_EVIDENCE');
    expect(contradictoryIssues.length).toBe(2);

    // Verify first diagnostic has full details
    expect(contradictoryIssues[0].code).toBe('CONTRADICTORY_DASHA_EVIDENCE');
    expect(contradictoryIssues[0].severity).toBe('ERROR');
    expect(contradictoryIssues[0].identityKey).toBe('contradictory-identity-1');
    expect(contradictoryIssues[0].evidenceId).toBe('contradictory-evidence-1');
    expect(contradictoryIssues[0].message).toContain('Contradictory Dasha evidence');
    expect(contradictoryIssues[0].message).toContain('SUPPORTING polarity with contradictory effect: CHALLENGE');
    expect(contradictoryIssues[0].message).toContain('contradictory-identity-1');
    expect(contradictoryIssues[0].message).toContain('contradictory-evidence-1');

    // Verify second diagnostic has full details
    expect(contradictoryIssues[1].code).toBe('CONTRADICTORY_DASHA_EVIDENCE');
    expect(contradictoryIssues[1].severity).toBe('ERROR');
    expect(contradictoryIssues[1].identityKey).toBe('contradictory-identity-2');
    expect(contradictoryIssues[1].evidenceId).toBe('contradictory-evidence-2');
    expect(contradictoryIssues[1].message).toContain('MIXED direction with disallowed effect: DOES_NOT_ACTIVATE');
  });

  it('validates successfully when contradictoryEvidence is empty', () => {
    const evidence = [
      createMockEvidence({ id: 'evidence-1', identityKey: 'identity-1' })
    ];

    const input: EvidenceContinuityValidationInput = {
      evidence,
      requiredC11EvidenceIds: ['identity-1'],
      c11Validation: createMockC11Validation({ valid: true }),
      contradictoryEvidence: []
    };

    const result = validateEvidenceContinuity(input);

    // Should be valid with no contradictory evidence issues
    expect(result.valid).toBe(true);
    const contradictoryIssues = result.issues.filter(i => i.code === 'CONTRADICTORY_DASHA_EVIDENCE');
    expect(contradictoryIssues.length).toBe(0);
  });

  it('validates successfully when contradictoryEvidence is undefined', () => {
    const evidence = [
      createMockEvidence({ id: 'evidence-1', identityKey: 'identity-1' })
    ];

    const input: EvidenceContinuityValidationInput = {
      evidence,
      requiredC11EvidenceIds: ['identity-1'],
      c11Validation: createMockC11Validation({ valid: true }),
      contradictoryEvidence: undefined
    };

    const result = validateEvidenceContinuity(input);

    // Should be valid with no contradictory evidence issues
    expect(result.valid).toBe(true);
    const contradictoryIssues = result.issues.filter(i => i.code === 'CONTRADICTORY_DASHA_EVIDENCE');
    expect(contradictoryIssues.length).toBe(0);
  });
});
