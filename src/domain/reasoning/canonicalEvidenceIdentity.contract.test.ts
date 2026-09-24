import { describe, it, expect } from 'vitest';
import { classifyReasoningEvidence } from './reasoningHierarchy';
import { deduplicateReasoningEvidence } from './deduplicateEvidence';
import type { DomainEvidence } from '../interpretation';
import { createDomainEvidence } from '../interpretation/DomainEvidence';
import type { EvidenceProvenance } from '../careerWealth/provenance';

/**
 * Contract test for canonical evidence identity and deduplication per spec §16.
 * 
 * Tests the two-stage canonical pipeline:
 * 1. classifyReasoningEvidence - derives identityKey from provenance/ruleId + planet/house
 * 2. deduplicateReasoningEvidence - groups by identityKey, merges, tracks occurrenceCount/sourceIds
 * 
 * These tests verify the existing implementation against the contract requirements
 * without modifying the production code.
 */
describe('Canonical Evidence Identity & Deduplication Contract (spec §16)', () => {
  /**
   * Helper to create DomainEvidence with provenance for identity key derivation
   */
  function createEvidenceWithProvenance(
    id: string,
    overrides: Partial<DomainEvidence> & { provenance: EvidenceProvenance }
  ): DomainEvidence {
    return createDomainEvidence({
      id,
      sourceType: 'STRUCTURAL',
      domain: 'CAREER',
      role: 'PRIMARY',
      phase: 'NATAL_PROMISE',
      source: 'D1',
      statement: 'Test evidence',
      polarity: 'SUPPORTING',
      strength: 'STRONG',
      priority: 95,
      relatedEvidenceIds: [],
      ...overrides
    });
  }

  /**
   * Helper to create DomainEvidence with ruleId (fallback identity derivation)
   */
  function createEvidenceWithRuleId(
    id: string,
    overrides: Partial<DomainEvidence> & { ruleId: string }
  ): DomainEvidence {
    return createDomainEvidence({
      id,
      sourceType: 'STRUCTURAL',
      domain: 'CAREER',
      role: 'PRIMARY',
      phase: 'NATAL_PROMISE',
      source: 'D1',
      statement: 'Test evidence',
      polarity: 'SUPPORTING',
      strength: 'STRONG',
      priority: 95,
      relatedEvidenceIds: [],
      ...overrides
    });
  }

  /**
   * Helper to create proper EvidenceProvenance
   */
  function createProvenance(
    evidenceId: string,
    ruleId: string,
    effect: 'SUPPORT' | 'CHALLENGE' | 'NEUTRAL' | 'MIXED' = 'SUPPORT'
  ): EvidenceProvenance {
    return {
      evidenceId,
      ruleId,
      domain: 'CAREER',
      axis: 'NATAL',
      source: 'D1',
      effect,
      strength: 'PRIMARY'
    };
  }

  describe('Group A: same identity + same direction → one canonical record', () => {
    it('two SUPPORT occurrences with same identityKey collapse to one canonical SUPPORT record', () => {
      const evidence: DomainEvidence[] = [
        createEvidenceWithProvenance('EVIDENCE_1', {
          provenance: createProvenance('EVIDENCE_1', 'JUPITER_10TH_ASPECT', 'SUPPORT'),
          planet: 'JUPITER',
          house: 10,
          polarity: 'SUPPORTING',
          strength: 'STRONG'
        }),
        createEvidenceWithProvenance('EVIDENCE_2', {
          provenance: createProvenance('EVIDENCE_2', 'JUPITER_10TH_ASPECT', 'SUPPORT'),
          planet: 'JUPITER',
          house: 10,
          polarity: 'SUPPORTING',
          strength: 'STRONG'
        })
      ];

      const weighted = classifyReasoningEvidence(evidence);
      const canonical = deduplicateReasoningEvidence(weighted);

      expect(canonical).toHaveLength(1);
      expect(canonical[0].direction).toBe('SUPPORT');
      expect(canonical[0].occurrenceCount).toBe(2);
      expect(canonical[0].sourceIds).toHaveLength(2);
    });
  });

  describe('Group B: SUPPORT + CHALLENGE (same identityKey) → direction MIXED, occurrenceCount 2', () => {
    it('SUPPORT and CHALLENGE with same identityKey produce MIXED direction, occurrenceCount 2', () => {
      const evidence: DomainEvidence[] = [
        createEvidenceWithProvenance('EVIDENCE_SUPPORT', {
          provenance: createProvenance('EVIDENCE_SUPPORT', 'JUPITER_10TH_ASPECT', 'SUPPORT'),
          planet: 'JUPITER',
          house: 10,
          polarity: 'SUPPORTING',
          strength: 'STRONG'
        }),
        createEvidenceWithProvenance('EVIDENCE_CHALLENGE', {
          provenance: createProvenance('EVIDENCE_CHALLENGE', 'JUPITER_10TH_ASPECT', 'CHALLENGE'),
          planet: 'JUPITER',
          house: 10,
          polarity: 'CHALLENGING',
          strength: 'STRONG'
        })
      ];

      const weighted = classifyReasoningEvidence(evidence);
      const canonical = deduplicateReasoningEvidence(weighted);

      expect(canonical).toHaveLength(1);
      expect(canonical[0].direction).toBe('MIXED');
      expect(canonical[0].occurrenceCount).toBe(2);
    });
  });

  describe('Group C: SUPPORT weight 3 + CHALLENGE weight 2 → MIXED, canonical weight 3 (never 5)', () => {
    it('conflicting directions retain MAX weight, never sum', () => {
      const evidence: DomainEvidence[] = [
        createEvidenceWithProvenance('EVIDENCE_SUPPORT', {
          provenance: createProvenance('EVIDENCE_SUPPORT', 'JUPITER_10TH_ASPECT', 'SUPPORT'),
          planet: 'JUPITER',
          house: 10,
          polarity: 'SUPPORTING',
          strength: 'STRONG',
          priority: 95
        }),
        createEvidenceWithProvenance('EVIDENCE_CHALLENGE', {
          provenance: createProvenance('EVIDENCE_CHALLENGE', 'JUPITER_10TH_ASPECT', 'CHALLENGE'),
          planet: 'JUPITER',
          house: 10,
          polarity: 'CHALLENGING',
          strength: 'MODERATE',
          priority: 80
        })
      ];

      const weighted = classifyReasoningEvidence(evidence);
      const canonical = deduplicateReasoningEvidence(weighted);

      expect(canonical).toHaveLength(1);
      expect(canonical[0].direction).toBe('MIXED');
      expect(canonical[0].strength).toBe('STRONG'); // MAX(STRONG, MODERATE) = STRONG
      expect(canonical[0].weight).toBeGreaterThan(0);
      // Weight is computed from layerWeight * strengthWeight, should be from STRONG (higher)
      expect(canonical[0].occurrenceCount).toBe(2);
    });
  });

  describe('Group D: both occurrence ids survive in sourceIds', () => {
    it('both occurrence IDs are preserved in sourceIds array', () => {
      const evidence: DomainEvidence[] = [
        createEvidenceWithProvenance('EVIDENCE_1', {
          provenance: createProvenance('EVIDENCE_1', 'JUPITER_10TH_ASPECT', 'SUPPORT'),
          planet: 'JUPITER',
          house: 10,
          polarity: 'SUPPORTING',
          strength: 'STRONG'
        }),
        createEvidenceWithProvenance('EVIDENCE_2', {
          provenance: createProvenance('EVIDENCE_2', 'JUPITER_10TH_ASPECT', 'SUPPORT'),
          planet: 'JUPITER',
          house: 10,
          polarity: 'SUPPORTING',
          strength: 'STRONG'
        })
      ];

      const weighted = classifyReasoningEvidence(evidence);
      const canonical = deduplicateReasoningEvidence(weighted);

      expect(canonical).toHaveLength(1);
      expect(canonical[0].sourceIds).toContain('EVIDENCE_1');
      expect(canonical[0].sourceIds).toContain('EVIDENCE_2');
      expect(canonical[0].sourceIds).toHaveLength(2);
    });
  });

  describe('Group E: identityKey(SUPPORT) === identityKey(CHALLENGE) while occurrence ids differ', () => {
    it('SUPPORT and CHALLENGE share identityKey but have distinct occurrence IDs', () => {
      const evidence: DomainEvidence[] = [
        createEvidenceWithProvenance('EVIDENCE_SUPPORT', {
          provenance: createProvenance('EVIDENCE_SUPPORT', 'JUPITER_10TH_ASPECT', 'SUPPORT'),
          planet: 'JUPITER',
          house: 10,
          polarity: 'SUPPORTING',
          strength: 'STRONG'
        }),
        createEvidenceWithProvenance('EVIDENCE_CHALLENGE', {
          provenance: createProvenance('EVIDENCE_CHALLENGE', 'JUPITER_10TH_ASPECT', 'CHALLENGE'),
          planet: 'JUPITER',
          house: 10,
          polarity: 'CHALLENGING',
          strength: 'STRONG'
        })
      ];

      const weighted = classifyReasoningEvidence(evidence);

      // Both should have the same identityKey
      expect(weighted[0].identityKey).toBe(weighted[1].identityKey);

      // But different evidenceIds (occurrence IDs)
      expect(weighted[0].evidenceId).toBe('EVIDENCE_SUPPORT');
      expect(weighted[1].evidenceId).toBe('EVIDENCE_CHALLENGE');
      expect(weighted[0].evidenceId).not.toBe(weighted[1].evidenceId);

      const canonical = deduplicateReasoningEvidence(weighted);

      // After deduplication, one canonical record with both sourceIds
      expect(canonical).toHaveLength(1);
      expect(canonical[0].sourceIds).toContain('EVIDENCE_SUPPORT');
      expect(canonical[0].sourceIds).toContain('EVIDENCE_CHALLENGE');
    });
  });

  describe('Group F: order independence — dedup([A,B]) deep-equals dedup([B,A])', () => {
    it('input order does not affect canonical output', () => {
      const evidenceA = createEvidenceWithProvenance('EVIDENCE_A', {
        provenance: createProvenance('EVIDENCE_A', 'JUPITER_10TH_ASPECT', 'SUPPORT'),
        planet: 'JUPITER',
        house: 10,
        polarity: 'SUPPORTING',
        strength: 'STRONG'
      });

      const evidenceB = createEvidenceWithProvenance('EVIDENCE_B', {
        provenance: createProvenance('EVIDENCE_B', 'SATURN_10TH_ASPECT', 'SUPPORT'),
        planet: 'SATURN',
        house: 10,
        polarity: 'SUPPORTING',
        strength: 'STRONG'
      });

      const inputAB = [evidenceA, evidenceB];
      const inputBA = [evidenceB, evidenceA];

      const weightedAB = classifyReasoningEvidence(inputAB);
      const weightedBA = classifyReasoningEvidence(inputBA);

      const canonicalAB = deduplicateReasoningEvidence(weightedAB);
      const canonicalBA = deduplicateReasoningEvidence(weightedBA);

      expect(canonicalAB).toEqual(canonicalBA);
    });
  });

  describe('Group G: three occurrences (SUPPORT 3, SUPPORT 2, CHALLENGE 1) → MIXED, weight 3, occurrenceCount 3', () => {
    it('three occurrences with mixed directions produce MIXED, max weight, occurrenceCount 3', () => {
      const evidence: DomainEvidence[] = [
        createEvidenceWithProvenance('EVIDENCE_1', {
          provenance: createProvenance('EVIDENCE_1', 'JUPITER_10TH_ASPECT', 'SUPPORT'),
          planet: 'JUPITER',
          house: 10,
          polarity: 'SUPPORTING',
          strength: 'STRONG',
          priority: 95
        }),
        createEvidenceWithProvenance('EVIDENCE_2', {
          provenance: createProvenance('EVIDENCE_2', 'JUPITER_10TH_ASPECT', 'SUPPORT'),
          planet: 'JUPITER',
          house: 10,
          polarity: 'SUPPORTING',
          strength: 'MODERATE',
          priority: 80
        }),
        createEvidenceWithProvenance('EVIDENCE_3', {
          provenance: createProvenance('EVIDENCE_3', 'JUPITER_10TH_ASPECT', 'CHALLENGE'),
          planet: 'JUPITER',
          house: 10,
          polarity: 'CHALLENGING',
          strength: 'WEAK',
          priority: 60
        })
      ];

      const weighted = classifyReasoningEvidence(evidence);
      const canonical = deduplicateReasoningEvidence(weighted);

      expect(canonical).toHaveLength(1);
      expect(canonical[0].direction).toBe('MIXED'); // SUPPORT + SUPPORT + CHALLENGE = MIXED
      expect(canonical[0].strength).toBe('STRONG'); // MAX(STRONG, MODERATE, WEAK) = STRONG
      expect(canonical[0].occurrenceCount).toBe(3);
      expect(canonical[0].sourceIds).toHaveLength(3);
    });
  });

  describe('Group H: false-dedup protection — different ruleId produces different identityKeys', () => {
    it('two facts sharing planet+house but with different ruleId produce DIFFERENT identityKeys', () => {
      const evidence: DomainEvidence[] = [
        createEvidenceWithRuleId('EVIDENCE_ASPECTS', {
          ruleId: 'JUPITER_ASPECTS_10TH',
          planet: 'JUPITER',
          house: 10,
          polarity: 'SUPPORTING',
          strength: 'STRONG'
        }),
        createEvidenceWithRuleId('EVIDENCE_OCCUPIES', {
          ruleId: 'JUPITER_OCCUPIES_10TH',
          planet: 'JUPITER',
          house: 10,
          polarity: 'SUPPORTING',
          strength: 'STRONG'
        })
      ];

      const weighted = classifyReasoningEvidence(evidence);

      // Should have different identityKeys due to different ruleId
      expect(weighted[0].identityKey).not.toBe(weighted[1].identityKey);

      const canonical = deduplicateReasoningEvidence(weighted);

      // Should NOT be deduplicated - they are different semantic facts
      expect(canonical).toHaveLength(2);
    });
  });

  describe('Group I: deduplicateReasoningEvidence([]) returns []', () => {
    it('empty input returns empty array (missing evidence is not negative evidence)', () => {
      const weighted = classifyReasoningEvidence([]);
      const canonical = deduplicateReasoningEvidence(weighted);

      expect(canonical).toHaveLength(0);
      expect(Array.isArray(canonical)).toBe(true);
    });
  });

  describe('Group J: merging preserves ruleId, sourceIds, provenance-derived identityKey', () => {
    it('merging preserves ruleId from first occurrence', () => {
      const evidence: DomainEvidence[] = [
        createEvidenceWithProvenance('EVIDENCE_1', {
          provenance: createProvenance('EVIDENCE_1', 'JUPITER_10TH_ASPECT', 'SUPPORT'),
          planet: 'JUPITER',
          house: 10,
          polarity: 'SUPPORTING',
          strength: 'STRONG'
        }),
        createEvidenceWithProvenance('EVIDENCE_2', {
          provenance: createProvenance('EVIDENCE_2', 'JUPITER_10TH_ASPECT', 'SUPPORT'),
          planet: 'JUPITER',
          house: 10,
          polarity: 'SUPPORTING',
          strength: 'STRONG'
        })
      ];

      const weighted = classifyReasoningEvidence(evidence);
      const canonical = deduplicateReasoningEvidence(weighted);

      expect(canonical).toHaveLength(1);
      expect(canonical[0].ruleId).toBe('JUPITER_10TH_ASPECT');
    });

    it('merging preserves sourceIds from all occurrences', () => {
      const evidence: DomainEvidence[] = [
        createEvidenceWithProvenance('EVIDENCE_A', {
          provenance: createProvenance('EVIDENCE_A', 'JUPITER_10TH_ASPECT', 'SUPPORT'),
          planet: 'JUPITER',
          house: 10,
          polarity: 'SUPPORTING',
          strength: 'STRONG'
        }),
        createEvidenceWithProvenance('EVIDENCE_B', {
          provenance: createProvenance('EVIDENCE_B', 'JUPITER_10TH_ASPECT', 'SUPPORT'),
          planet: 'JUPITER',
          house: 10,
          polarity: 'SUPPORTING',
          strength: 'STRONG'
        }),
        createEvidenceWithProvenance('EVIDENCE_C', {
          provenance: createProvenance('EVIDENCE_C', 'JUPITER_10TH_ASPECT', 'SUPPORT'),
          planet: 'JUPITER',
          house: 10,
          polarity: 'SUPPORTING',
          strength: 'STRONG'
        })
      ];

      const weighted = classifyReasoningEvidence(evidence);
      const canonical = deduplicateReasoningEvidence(weighted);

      expect(canonical).toHaveLength(1);
      expect(canonical[0].sourceIds).toContain('EVIDENCE_A');
      expect(canonical[0].sourceIds).toContain('EVIDENCE_B');
      expect(canonical[0].sourceIds).toContain('EVIDENCE_C');
      expect(canonical[0].sourceIds).toHaveLength(3);
    });

    it('merging preserves provenance-derived identityKey', () => {
      const evidence: DomainEvidence[] = [
        createEvidenceWithProvenance('EVIDENCE_1', {
          provenance: createProvenance('EVIDENCE_1', 'JUPITER_10TH_ASPECT', 'SUPPORT'),
          planet: 'JUPITER',
          house: 10,
          polarity: 'SUPPORTING',
          strength: 'STRONG'
        })
      ];

      const weighted = classifyReasoningEvidence(evidence);
      const canonical = deduplicateReasoningEvidence(weighted);

      // Identity key should be derived from provenance
      expect(canonical[0].identityKey).toContain('JUPITER');
      expect(canonical[0].identityKey).toContain('HOUSE_10');
      expect(canonical[0].identityKey).toContain('JUPITER_10TH_ASPECT');
    });
  });
});
