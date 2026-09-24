import { describe, it, expect } from 'vitest';
import { deduplicateReasoningEvidence } from './deduplicateEvidence';
import type { WeightedReasoningEvidence } from './reasoningTypes';

function createWeightedEvidence(
  evidenceId: string,
  overrides: Partial<WeightedReasoningEvidence> = {}
): WeightedReasoningEvidence {
  const base = {
    identityKey: overrides.identityKey ?? evidenceId, // Allow custom identityKey, default to evidenceId
    evidenceId,
    ruleId: 'TEST_RULE',
    layer: 'PRIMARY_PROMISE',
    direction: 'SUPPORT',
    strength: 'STRONG',
    priority: 95,
    weight: 7.5,
    statement: 'Test evidence',
    relatedEvidenceIds: [],
    sourceIds: overrides.sourceIds ?? [evidenceId] // Use custom sourceIds if provided, default to evidenceId
  };
  // Don't spread sourceIds again in overrides
  const { sourceIds, ...restOverrides } = overrides;
  return Object.freeze({ ...base, ...restOverrides });
}

describe('deduplicateReasoningEvidence', () => {
  describe('exact duplicates', () => {
    it('exact duplicate x3 => 1 canonical, occurrenceCount=3', () => {
      const identityKey = 'CW-CAREER-NATAL-D1-TEST_RULE-JUPITER';
      const input = [
        createWeightedEvidence('CW-CAREER-NATAL-D1-TEST_RULE-JUPITER-SUPPORT-STRONG', { identityKey }),
        createWeightedEvidence('CW-CAREER-NATAL-D1-TEST_RULE-JUPITER-SUPPORT-STRONG-2', { identityKey }),
        createWeightedEvidence('CW-CAREER-NATAL-D1-TEST_RULE-JUPITER-SUPPORT-STRONG-3', { identityKey })
      ];

      const result = deduplicateReasoningEvidence(input);

      expect(result).toHaveLength(1);
      expect(result[0].occurrenceCount).toBe(3);
      expect(result[0].sourceIds).toHaveLength(3);
      expect(result[0].weight).toBe(7.5); // Not summed
    });
  });

  describe('same identity, different attributes', () => {
    it('same identity, different prose => 1 canonical', () => {
      const identityKey = 'CW-CAREER-NATAL-D1-TEST_RULE-JUPITER';
      const evidenceId1 = 'CW-CAREER-NATAL-D1-TEST_RULE-JUPITER-SUPPORT-STRONG';
      const evidenceId2 = 'CW-CAREER-NATAL-D1-TEST_RULE-JUPITER-CHALLENGE-WEAK';

      const input = [
        createWeightedEvidence(evidenceId1, { identityKey, statement: 'Jupiter supports career' }),
        createWeightedEvidence(evidenceId2, { identityKey, statement: 'Jupiter challenges career', direction: 'CHALLENGE', strength: 'WEAK' })
      ];

      const result = deduplicateReasoningEvidence(input);

      expect(result).toHaveLength(1);
      expect(result[0].occurrenceCount).toBe(2);
      expect(result[0].direction).toBe('MIXED'); // SUPPORT + CHALLENGE = MIXED
      expect(result[0].strength).toBe('STRONG'); // STRONG > WEAK
    });

    it('same identity, different layer => 1 canonical with layers=[both]', () => {
      const identityKey = 'CW-CAREER-NATAL-D1-TEST_RULE-JUPITER';
      const evidenceId1 = 'CW-CAREER-NATAL-D1-TEST_RULE-JUPITER-SUPPORT-STRONG';
      const evidenceId2 = 'CW-CAREER-DASHA-DASHA-TEST_RULE-JUPITER-SUPPORT-STRONG';

      const input = [
        createWeightedEvidence(evidenceId1, { identityKey, layer: 'PRIMARY_PROMISE' }),
        createWeightedEvidence(evidenceId2, { identityKey, layer: 'DASHA' })
      ];

      const result = deduplicateReasoningEvidence(input);

      expect(result).toHaveLength(1);
      expect(result[0].occurrenceCount).toBe(2);
      expect(result[0].layers).toContain('PRIMARY_PROMISE');
      expect(result[0].layers).toContain('DASHA');
      expect(result[0].layers).toHaveLength(2);
    });
  });

  describe('different identities remain separate', () => {
    it('different ruleId => 2 canonical', () => {
      const input = [
        createWeightedEvidence('CW-CAREER-NATAL-D1-RULE_A-JUPITER-SUPPORT-STRONG', { ruleId: 'RULE_A' }),
        createWeightedEvidence('CW-CAREER-NATAL-D1-RULE_B-JUPITER-SUPPORT-STRONG', { ruleId: 'RULE_B' })
      ];

      const result = deduplicateReasoningEvidence(input);

      expect(result).toHaveLength(2);
      expect(result[0].ruleId).toBe('RULE_A');
      expect(result[1].ruleId).toBe('RULE_B');
    });

    it('different subject => 2 canonical', () => {
      const input = [
        createWeightedEvidence('CW-CAREER-NATAL-D1-TEST_RULE-JUPITER-SUPPORT-STRONG'),
        createWeightedEvidence('CW-CAREER-NATAL-D1-TEST_RULE-SATURN-SUPPORT-STRONG')
      ];

      const result = deduplicateReasoningEvidence(input);

      expect(result).toHaveLength(2);
    });

    it('different object => 2 canonical', () => {
      const input = [
        createWeightedEvidence('CW-CAREER-NATAL-D1-TEST_RULE-JUPITER-10TH_HOUSE-SUPPORT-STRONG'),
        createWeightedEvidence('CW-CAREER-NATAL-D1-TEST_RULE-JUPITER-2ND_HOUSE-SUPPORT-STRONG')
      ];

      const result = deduplicateReasoningEvidence(input);

      expect(result).toHaveLength(2);
    });

    it('cross-layer duplicate: same identity as PRIMARY_PROMISE and SECONDARY_SUPPORT collapses to one canonical', () => {
      const identityKey = 'CW-CAREER-NATAL-D1-TEST_RULE-JUPITER';

      const inputPrimaryFirst = [
        createWeightedEvidence('CW-CAREER-NATAL-D1-TEST_RULE-JUPITER-SUPPORT-STRONG', {
          identityKey,
          layer: 'PRIMARY_PROMISE'
        }),
        createWeightedEvidence('CW-CAREER-NATAL-D1-TEST_RULE-JUPITER-SUPPORT-STRONG', {
          identityKey,
          layer: 'SECONDARY_SUPPORT'
        })
      ];

      const inputSecondaryFirst = [
        createWeightedEvidence('CW-CAREER-NATAL-D1-TEST_RULE-JUPITER-SUPPORT-STRONG', {
          identityKey,
          layer: 'SECONDARY_SUPPORT'
        }),
        createWeightedEvidence('CW-CAREER-NATAL-D1-TEST_RULE-JUPITER-SUPPORT-STRONG', {
          identityKey,
          layer: 'PRIMARY_PROMISE'
        })
      ];

      const resultPrimaryFirst = deduplicateReasoningEvidence(inputPrimaryFirst);
      const resultSecondaryFirst = deduplicateReasoningEvidence(inputSecondaryFirst);

      // Both should collapse to one canonical record
      expect(resultPrimaryFirst).toHaveLength(1);
      expect(resultSecondaryFirst).toHaveLength(1);

      // Both should have both layers in the layers array
      expect(resultPrimaryFirst[0].layers).toContain('PRIMARY_PROMISE');
      expect(resultPrimaryFirst[0].layers).toContain('SECONDARY_SUPPORT');
      expect(resultPrimaryFirst[0].layers).toHaveLength(2);

      expect(resultSecondaryFirst[0].layers).toContain('PRIMARY_PROMISE');
      expect(resultSecondaryFirst[0].layers).toContain('SECONDARY_SUPPORT');
      expect(resultSecondaryFirst[0].layers).toHaveLength(2);

      // Canonical layer should be deterministically PRIMARY_PROMISE (higher precedence)
      expect(resultPrimaryFirst[0].layer).toBe('PRIMARY_PROMISE');
      expect(resultSecondaryFirst[0].layer).toBe('PRIMARY_PROMISE');

      // Reordering inputs should yield identical output
      expect(resultPrimaryFirst).toEqual(resultSecondaryFirst);
    });

    it('objectKey distinction: Jupiter->10th and Jupiter->2nd produce different identity keys (not deduplicated)', () => {
      const identityKey10th = 'CW-CAREER-NATAL-D1-TEST_RULE-JUPITER-HOUSE_10';
      const identityKey2nd = 'CW-CAREER-NATAL-D1-TEST_RULE-JUPITER-HOUSE_2';

      const input = [
        createWeightedEvidence('CW-CAREER-NATAL-D1-TEST_RULE-JUPITER-HOUSE_10-SUPPORT-STRONG', {
          identityKey: identityKey10th
        }),
        createWeightedEvidence('CW-CAREER-NATAL-D1-TEST_RULE-JUPITER-HOUSE_2-SUPPORT-STRONG', {
          identityKey: identityKey2nd
        })
      ];

      const result = deduplicateReasoningEvidence(input);

      // Should NOT be deduplicated - they are different semantic facts
      expect(result).toHaveLength(2);
      expect(result[0].identityKey).toBe(identityKey10th);
      expect(result[1].identityKey).toBe(identityKey2nd);
    });

    it('rows lacking planet/house use occurrence id as identity key (not collapsed)', () => {
      // When evidence lacks both planet and house, it should fall back to item.id
      // This ensures distinct rows with missing semantic info are not incorrectly collapsed
      const input = [
        createWeightedEvidence('CUSTOM_ID_1', {
          identityKey: 'CUSTOM_ID_1' // Fallback to occurrence id
        }),
        createWeightedEvidence('CUSTOM_ID_2', {
          identityKey: 'CUSTOM_ID_2' // Fallback to occurrence id
        })
      ];

      const result = deduplicateReasoningEvidence(input);

      // Should NOT be deduplicated - they have different occurrence ids
      expect(result).toHaveLength(2);
      expect(result[0].identityKey).toBe('CUSTOM_ID_1');
      expect(result[1].identityKey).toBe('CUSTOM_ID_2');
    });
  });

  describe('direction merge logic', () => {
    it('SUPPORT + SUPPORT => SUPPORT', () => {
      const identityKey = 'CW-CAREER-NATAL-D1-TEST_RULE-JUPITER';
      const input = [
        createWeightedEvidence('CW-CAREER-NATAL-D1-TEST_RULE-JUPITER-SUPPORT-STRONG', { identityKey, direction: 'SUPPORT' }),
        createWeightedEvidence('CW-CAREER-NATAL-D1-TEST_RULE-JUPITER-SUPPORT-WEAK', { identityKey, direction: 'SUPPORT', strength: 'WEAK' })
      ];

      const result = deduplicateReasoningEvidence(input);

      expect(result).toHaveLength(1);
      expect(result[0].direction).toBe('SUPPORT');
    });

    it('CHALLENGE + CHALLENGE => CHALLENGE', () => {
      const identityKey = 'CW-CAREER-NATAL-D1-TEST_RULE-JUPITER';
      const input = [
        createWeightedEvidence('CW-CAREER-NATAL-D1-TEST_RULE-JUPITER-CHALLENGE-STRONG', { identityKey, direction: 'CHALLENGE' }),
        createWeightedEvidence('CW-CAREER-NATAL-D1-TEST_RULE-JUPITER-CHALLENGE-WEAK', { identityKey, direction: 'CHALLENGE', strength: 'WEAK' })
      ];

      const result = deduplicateReasoningEvidence(input);

      expect(result).toHaveLength(1);
      expect(result[0].direction).toBe('CHALLENGE');
    });

    it('SUPPORT + CHALLENGE => MIXED', () => {
      const identityKey = 'CW-CAREER-NATAL-D1-TEST_RULE-JUPITER';
      const input = [
        createWeightedEvidence('CW-CAREER-NATAL-D1-TEST_RULE-JUPITER-SUPPORT-STRONG', { identityKey, direction: 'SUPPORT' }),
        createWeightedEvidence('CW-CAREER-NATAL-D1-TEST_RULE-JUPITER-CHALLENGE-STRONG', { identityKey, direction: 'CHALLENGE' })
      ];

      const result = deduplicateReasoningEvidence(input);

      expect(result).toHaveLength(1);
      expect(result[0].direction).toBe('MIXED');
    });

    it('UNAVAILABLE + SUPPORT => SUPPORT (never negative)', () => {
      const identityKey = 'CW-CAREER-NATAL-D1-TEST_RULE-JUPITER';
      const input = [
        createWeightedEvidence('CW-CAREER-NATAL-D1-TEST_RULE-JUPITER-UNAVAILABLE-STRONG', { identityKey, direction: 'UNAVAILABLE' }),
        createWeightedEvidence('CW-CAREER-NATAL-D1-TEST_RULE-JUPITER-SUPPORT-STRONG', { identityKey, direction: 'SUPPORT' })
      ];

      const result = deduplicateReasoningEvidence(input);

      expect(result).toHaveLength(1);
      expect(result[0].direction).toBe('SUPPORT');
    });

    it('NEUTRAL + SUPPORT => SUPPORT', () => {
      const identityKey = 'CW-CAREER-NATAL-D1-TEST_RULE-JUPITER';
      const input = [
        createWeightedEvidence('CW-CAREER-NATAL-D1-TEST_RULE-JUPITER-NEUTRAL-STRONG', { identityKey, direction: 'NEUTRAL' }),
        createWeightedEvidence('CW-CAREER-NATAL-D1-TEST_RULE-JUPITER-SUPPORT-STRONG', { identityKey, direction: 'SUPPORT' })
      ];

      const result = deduplicateReasoningEvidence(input);

      expect(result).toHaveLength(1);
      expect(result[0].direction).toBe('SUPPORT');
    });

    it('MIXED + anything => MIXED', () => {
      const identityKey = 'CW-CAREER-NATAL-D1-TEST_RULE-JUPITER';
      const input = [
        createWeightedEvidence('CW-CAREER-NATAL-D1-TEST_RULE-JUPITER-MIXED-STRONG', { identityKey, direction: 'MIXED' }),
        createWeightedEvidence('CW-CAREER-NATAL-D1-TEST_RULE-JUPITER-SUPPORT-STRONG', { identityKey, direction: 'SUPPORT' })
      ];

      const result = deduplicateReasoningEvidence(input);

      expect(result).toHaveLength(1);
      expect(result[0].direction).toBe('MIXED');
    });
  });

  describe('strength merge logic', () => {
    it('WEAK + STRONG => STRONG (not VERY_STRONG)', () => {
      const identityKey = 'CW-CAREER-NATAL-D1-TEST_RULE-JUPITER';
      const input = [
        createWeightedEvidence('CW-CAREER-NATAL-D1-TEST_RULE-JUPITER-SUPPORT-WEAK', { identityKey, strength: 'WEAK' }),
        createWeightedEvidence('CW-CAREER-NATAL-D1-TEST_RULE-JUPITER-SUPPORT-STRONG', { identityKey, strength: 'STRONG' })
      ];

      const result = deduplicateReasoningEvidence(input);

      expect(result).toHaveLength(1);
      expect(result[0].strength).toBe('STRONG');
    });

    it('MODERATE + VERY_STRONG => VERY_STRONG', () => {
      const identityKey = 'CW-CAREER-NATAL-D1-TEST_RULE-JUPITER';
      const input = [
        createWeightedEvidence('CW-CAREER-NATAL-D1-TEST_RULE-JUPITER-SUPPORT-MODERATE', { identityKey, strength: 'MODERATE' }),
        createWeightedEvidence('CW-CAREER-NATAL-D1-TEST_RULE-JUPITER-SUPPORT-VERY_STRONG', { identityKey, strength: 'VERY_STRONG' })
      ];

      const result = deduplicateReasoningEvidence(input);

      expect(result).toHaveLength(1);
      expect(result[0].strength).toBe('VERY_STRONG');
    });

    it('duplicate occurrences do not sum weight', () => {
      const identityKey = 'CW-CAREER-NATAL-D1-TEST_RULE-JUPITER';
      const input = [
        createWeightedEvidence('CW-CAREER-NATAL-D1-TEST_RULE-JUPITER-SUPPORT-STRONG', { identityKey, weight: 7.5 }),
        createWeightedEvidence('CW-CAREER-NATAL-D1-TEST_RULE-JUPITER-SUPPORT-STRONG-2', { identityKey, weight: 7.5 }),
        createWeightedEvidence('CW-CAREER-NATAL-D1-TEST_RULE-JUPITER-SUPPORT-STRONG-3', { identityKey, weight: 7.5 })
      ];

      const result = deduplicateReasoningEvidence(input);

      expect(result).toHaveLength(1);
      expect(result[0].weight).toBe(7.5); // Max single occurrence, not 22.5
      expect(result[0].occurrenceCount).toBe(3);
    });

    it('same semantic fact with 1 vs 3 occurrences yields identical canonical weight (Test O unit-level)', () => {
      const identityKey = 'CW-CAREER-NATAL-D1-TEST_RULE-JUPITER';

      const singleOccurrence = [
        createWeightedEvidence('CW-CAREER-NATAL-D1-TEST_RULE-JUPITER-SUPPORT-STRONG', {
          identityKey,
          weight: 7.5
        })
      ];

      const tripleOccurrence = [
        createWeightedEvidence('CW-CAREER-NATAL-D1-TEST_RULE-JUPITER-SUPPORT-STRONG', {
          identityKey,
          weight: 7.5
        }),
        createWeightedEvidence('CW-CAREER-NATAL-D1-TEST_RULE-JUPITER-SUPPORT-STRONG', {
          identityKey,
          weight: 7.5
        }),
        createWeightedEvidence('CW-CAREER-NATAL-D1-TEST_RULE-JUPITER-SUPPORT-STRONG', {
          identityKey,
          weight: 7.5
        })
      ];

      const resultSingle = deduplicateReasoningEvidence(singleOccurrence);
      const resultTriple = deduplicateReasoningEvidence(tripleOccurrence);

      // Both should produce identical canonical weight (max single-occurrence weight)
      expect(resultSingle[0].weight).toBe(7.5);
      expect(resultTriple[0].weight).toBe(7.5);
      expect(resultSingle[0].weight).toBe(resultTriple[0].weight);

      // Triple should have higher occurrence count
      expect(resultSingle[0].occurrenceCount).toBe(1);
      expect(resultTriple[0].occurrenceCount).toBe(3);
    });
  });

  describe('determinism', () => {
    it('deduplicateReasoningEvidence(input) twice => toEqual', () => {
      const input = [
        createWeightedEvidence('CW-CAREER-NATAL-D1-TEST_RULE-JUPITER-SUPPORT-STRONG'),
        createWeightedEvidence('CW-CAREER-NATAL-D1-TEST_RULE-SATURN-SUPPORT-STRONG')
      ];

      const result1 = deduplicateReasoningEvidence(input);
      const result2 = deduplicateReasoningEvidence(input);

      expect(result1).toEqual(result2);
    });

    it('stable ordering independent of input order', () => {
      const input1 = [
        createWeightedEvidence('CW-CAREER-NATAL-D1-TEST_RULE-SATURN-SUPPORT-STRONG'),
        createWeightedEvidence('CW-CAREER-NATAL-D1-TEST_RULE-JUPITER-SUPPORT-STRONG')
      ];

      const input2 = [
        createWeightedEvidence('CW-CAREER-NATAL-D1-TEST_RULE-JUPITER-SUPPORT-STRONG'),
        createWeightedEvidence('CW-CAREER-NATAL-D1-TEST_RULE-SATURN-SUPPORT-STRONG')
      ];

      const result1 = deduplicateReasoningEvidence(input1);
      const result2 = deduplicateReasoningEvidence(input2);

      expect(result1).toEqual(result2);
      // Both should be sorted by identity key (the evidenceId is used as identityKey by default)
      expect(result1[0].identityKey).toBe('CW-CAREER-NATAL-D1-TEST_RULE-JUPITER-SUPPORT-STRONG');
      expect(result1[1].identityKey).toBe('CW-CAREER-NATAL-D1-TEST_RULE-SATURN-SUPPORT-STRONG');
    });

    it('canonical evidenceId is deterministic regardless of occurrence order (SUPPORT-first vs CHALLENGE-first)', () => {
      const identityKey = 'CW-CAREER-NATAL-D1-TEST_RULE-JUPITER';

      const inputSupportFirst = [
        createWeightedEvidence('CW-CAREER-NATAL-D1-TEST_RULE-JUPITER-SUPPORT-STRONG', {
          identityKey,
          direction: 'SUPPORT'
        }),
        createWeightedEvidence('CW-CAREER-NATAL-D1-TEST_RULE-JUPITER-CHALLENGE-WEAK', {
          identityKey,
          direction: 'CHALLENGE',
          strength: 'WEAK'
        })
      ];

      const inputChallengeFirst = [
        createWeightedEvidence('CW-CAREER-NATAL-D1-TEST_RULE-JUPITER-CHALLENGE-WEAK', {
          identityKey,
          direction: 'CHALLENGE',
          strength: 'WEAK'
        }),
        createWeightedEvidence('CW-CAREER-NATAL-D1-TEST_RULE-JUPITER-SUPPORT-STRONG', {
          identityKey,
          direction: 'SUPPORT'
        })
      ];

      const result1 = deduplicateReasoningEvidence(inputSupportFirst);
      const result2 = deduplicateReasoningEvidence(inputChallengeFirst);

      // Both should produce identical canonical records
      expect(result1).toEqual(result2);
      // The canonical evidenceId should be the identityKey, not dependent on input order
      expect(result1[0].evidenceId).toBe(identityKey);
      expect(result2[0].evidenceId).toBe(identityKey);
      // Direction should be MIXED regardless of order
      expect(result1[0].direction).toBe('MIXED');
      expect(result2[0].direction).toBe('MIXED');
    });

    it('sourceIds and relatedEvidenceIds are order-independent (distinct evidenceIds and relatedEvidenceIds, A,B vs B,A)', () => {
      const identityKey = 'CW-CAREER-NATAL-D1-TEST_RULE-JUPITER';

      const inputAB = [
        createWeightedEvidence('EVIDENCE_A', {
          identityKey,
          relatedEvidenceIds: ['REL_1', 'REL_2']
        }),
        createWeightedEvidence('EVIDENCE_B', {
          identityKey,
          relatedEvidenceIds: ['REL_3', 'REL_4']
        })
      ];

      const inputBA = [
        createWeightedEvidence('EVIDENCE_B', {
          identityKey,
          relatedEvidenceIds: ['REL_3', 'REL_4']
        }),
        createWeightedEvidence('EVIDENCE_A', {
          identityKey,
          relatedEvidenceIds: ['REL_1', 'REL_2']
        })
      ];

      const resultAB = deduplicateReasoningEvidence(inputAB);
      const resultBA = deduplicateReasoningEvidence(inputBA);

      // Both should produce identical canonical records
      expect(resultAB).toEqual(resultBA);

      // sourceIds should be sorted deterministically
      expect(resultAB[0].sourceIds).toEqual(['EVIDENCE_A', 'EVIDENCE_B']);
      expect(resultBA[0].sourceIds).toEqual(['EVIDENCE_A', 'EVIDENCE_B']);

      // relatedEvidenceIds should be sorted deterministically
      expect(resultAB[0].relatedEvidenceIds).toEqual(['REL_1', 'REL_2', 'REL_3', 'REL_4']);
      expect(resultBA[0].relatedEvidenceIds).toEqual(['REL_1', 'REL_2', 'REL_3', 'REL_4']);
    });
  });

  describe('mutation-safety', () => {
    it('returned collection is frozen', () => {
      const input = [
        createWeightedEvidence('CW-CAREER-NATAL-D1-TEST_RULE-JUPITER-SUPPORT-STRONG')
      ];

      const result = deduplicateReasoningEvidence(input);

      expect(Object.isFrozen(result)).toBe(true);
      expect(Object.isFrozen(result[0])).toBe(true);
    });

    it('source input is not mutated', () => {
      const input = [
        createWeightedEvidence('CW-CAREER-NATAL-D1-TEST_RULE-JUPITER-SUPPORT-STRONG')
      ];

      const originalInput = [...input];
      deduplicateReasoningEvidence(input);

      expect(input).toEqual(originalInput);
    });
  });

  describe('edge cases', () => {
    it('empty input returns empty frozen array', () => {
      const result = deduplicateReasoningEvidence([]);

      expect(result).toHaveLength(0);
      expect(Object.isFrozen(result)).toBe(true);
    });

    it('evidence without ruleId uses evidenceId as identity', () => {
      const input = [
        createWeightedEvidence('CUSTOM_ID_1', { ruleId: undefined }),
        createWeightedEvidence('CUSTOM_ID_2', { ruleId: undefined })
      ];

      const result = deduplicateReasoningEvidence(input);

      expect(result).toHaveLength(2);
      expect(result[0].identityKey).toBe('CUSTOM_ID_1');
      expect(result[1].identityKey).toBe('CUSTOM_ID_2');
    });

    it('unparseable evidenceId uses evidenceId as identity', () => {
      const input = [
        createWeightedEvidence('SHORT_ID'),
        createWeightedEvidence('ANOTHER_SHORT_ID')
      ];

      const result = deduplicateReasoningEvidence(input);

      expect(result).toHaveLength(2);
    });

    it('one occurrence vs three identical occurrences: identical canonical except occurrenceCount, sourceIds is distinct set', () => {
      const identityKey = 'CW-CAREER-NATAL-D1-TEST_RULE-JUPITER';

      const singleOccurrence = [
        createWeightedEvidence('EV_JUPITER_SUPPORT', {
          identityKey,
          weight: 7.5
        })
      ];

      const tripleOccurrence = [
        createWeightedEvidence('EV_JUPITER_SUPPORT', {
          identityKey,
          weight: 7.5
        }),
        createWeightedEvidence('EV_JUPITER_SUPPORT', {
          identityKey,
          weight: 7.5
        }),
        createWeightedEvidence('EV_JUPITER_SUPPORT', {
          identityKey,
          weight: 7.5
        })
      ];

      const resultSingle = deduplicateReasoningEvidence(singleOccurrence);
      const resultTriple = deduplicateReasoningEvidence(tripleOccurrence);

      // Both should have identical canonical fields except occurrenceCount
      expect(resultSingle[0].evidenceId).toBe(resultTriple[0].evidenceId);
      expect(resultSingle[0].identityKey).toBe(resultTriple[0].identityKey);
      expect(resultSingle[0].weight).toBe(resultTriple[0].weight);
      expect(resultSingle[0].direction).toBe(resultTriple[0].direction);
      expect(resultSingle[0].strength).toBe(resultTriple[0].strength);

      // Single has occurrenceCount=1, triple has occurrenceCount=3
      expect(resultSingle[0].occurrenceCount).toBe(1);
      expect(resultTriple[0].occurrenceCount).toBe(3);

      // sourceIds is the DISTINCT set: single has 1, triple has 1 (all same ID)
      expect(resultSingle[0].sourceIds).toHaveLength(1);
      expect(resultTriple[0].sourceIds).toHaveLength(1);
      expect(resultSingle[0].sourceIds).toEqual(['EV_JUPITER_SUPPORT']);
      expect(resultTriple[0].sourceIds).toEqual(['EV_JUPITER_SUPPORT']);

      // Weight is max single-occurrence weight, never summed
      expect(resultSingle[0].weight).toBe(7.5);
      expect(resultTriple[0].weight).toBe(7.5);
    });

    it('three occurrences with distinct IDs: sourceIds is distinct set of 3, occurrenceCount=3', () => {
      const identityKey = 'CW-CAREER-NATAL-D1-TEST_RULE-JUPITER';

      const input = [
        createWeightedEvidence('EV_JUPITER_SUPPORT_1', {
          identityKey,
          weight: 7.5
        }),
        createWeightedEvidence('EV_JUPITER_SUPPORT_2', {
          identityKey,
          weight: 7.5
        }),
        createWeightedEvidence('EV_JUPITER_SUPPORT_3', {
          identityKey,
          weight: 7.5
        })
      ];

      const result = deduplicateReasoningEvidence(input);

      expect(result).toHaveLength(1);
      expect(result[0].occurrenceCount).toBe(3);
      expect(result[0].sourceIds).toHaveLength(3);
      expect(result[0].sourceIds).toEqual(['EV_JUPITER_SUPPORT_1', 'EV_JUPITER_SUPPORT_2', 'EV_JUPITER_SUPPORT_3']);
      expect(result[0].weight).toBe(7.5); // Max single-occurrence weight
    });

    it('cross-layer duplicate identity: PRIMARY_PROMISE + SECONDARY_SUPPORT same identity -> one canonical, evidenceId === identityKey', () => {
      const identityKey = 'CW-CAREER-NATAL-D1-TEST_RULE-JUPITER';

      const input = [
        createWeightedEvidence('EV_JUPITER_PRIMARY', {
          identityKey,
          layer: 'PRIMARY_PROMISE'
        }),
        createWeightedEvidence('EV_JUPITER_SECONDARY', {
          identityKey,
          layer: 'SECONDARY_SUPPORT'
        })
      ];

      const result = deduplicateReasoningEvidence(input);

      expect(result).toHaveLength(1);
      expect(result[0].evidenceId).toBe(identityKey);
      expect(result[0].identityKey).toBe(identityKey);
      expect(result[0].evidenceId).toBe(result[0].identityKey);
      expect(result[0].layers).toContain('PRIMARY_PROMISE');
      expect(result[0].layers).toContain('SECONDARY_SUPPORT');
      expect(result[0].layer).toBe('PRIMARY_PROMISE'); // Deterministic canonical layer
    });
  });
});
