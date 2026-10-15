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
import type { C11ValidationResult } from './canonicalCareerEvidenceMapper';

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
    expect(result.issues).toHaveLength(1);
    expect(result.issues[0].code).toBe('UNRESOLVED_SEMANTIC_IDENTITY');
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

    expect(result.valid).toBe(false);
    expect(result.issues).toHaveLength(1);
    expect(result.issues[0].code).toBe('MISSING_SOURCE_REFERENCE');
    expect(result.issues[0].evidenceId).toBe('evidence-1');
    expect(result.provenanceIssueCount).toBe(1);
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

  it('detects PROVENANCE_DISAGREEMENT for ruleId differences', () => {
    const evidence = [
      createMockEvidence({
        id: 'evidence-1',
        identityKey: 'identity-1',
        ruleId: 'RULE_A'
      }),
      createMockEvidence({
        id: 'evidence-2',
        identityKey: 'identity-1',
        ruleId: 'RULE_B'
      })
    ];

    const input: EvidenceContinuityValidationInput = {
      evidence,
      requiredC11EvidenceIds: ['identity-1'],
      c11Validation: createMockC11Validation({ valid: true })
    };

    const result = validateEvidenceContinuity(input);

    expect(result.valid).toBe(false);
    expect(result.issues).toHaveLength(1);
    expect(result.issues[0].code).toBe('PROVENANCE_DISAGREEMENT');
    expect(result.issues[0].identityKey).toBe('identity-1');
    expect(result.provenanceIssueCount).toBe(1);
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
    expect(result.issues).toHaveLength(1);
    expect(result.issues[0].code).toBe('IDENTITY_KEY_COLLISION');
    expect(result.issues[0].identityKey).toBe('identity-1');
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
});
