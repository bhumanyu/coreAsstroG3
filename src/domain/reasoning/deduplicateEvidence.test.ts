import { describe, it, expect } from 'vitest';
import { deduplicateReasoningEvidence } from './deduplicateEvidence';
import type { WeightedReasoningEvidence } from './reasoningTypes';

function createWeightedEvidence(
  evidenceId: string,
  overrides: Partial<WeightedReasoningEvidence> = {}
): WeightedReasoningEvidence {
  return Object.freeze({
    evidenceId,
    ruleId: 'TEST_RULE',
    layer: 'PRIMARY_PROMISE',
    direction: 'SUPPORT',
    strength: 'STRONG',
    priority: 95,
    weight: 7.5,
    statement: 'Test evidence',
    relatedEvidenceIds: [],
    ...overrides
  });
}

describe('deduplicateReasoningEvidence', () => {
  describe('exact duplicates', () => {
    it('exact duplicate x3 => 1 canonical, occurrenceCount=3', () => {
      const evidenceId = 'CW-CAREER-NATAL-D1-TEST_RULE-JUPITER-SUPPORT-STRONG';
      const input = [
        createWeightedEvidence(evidenceId),
        createWeightedEvidence(evidenceId),
        createWeightedEvidence(evidenceId)
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
      const evidenceId1 = 'CW-CAREER-NATAL-D1-TEST_RULE-JUPITER-SUPPORT-STRONG';
      const evidenceId2 = 'CW-CAREER-NATAL-D1-TEST_RULE-JUPITER-CHALLENGE-WEAK';

      const input = [
        createWeightedEvidence(evidenceId1, { statement: 'Jupiter supports career' }),
        createWeightedEvidence(evidenceId2, { statement: 'Jupiter challenges career', direction: 'CHALLENGE', strength: 'WEAK' })
      ];

      const result = deduplicateReasoningEvidence(input);

      expect(result).toHaveLength(1);
      expect(result[0].occurrenceCount).toBe(2);
      expect(result[0].direction).toBe('MIXED'); // SUPPORT + CHALLENGE = MIXED
      expect(result[0].strength).toBe('STRONG'); // STRONG > WEAK
    });

    it('same identity, different layer => 1 canonical with layers=[both]', () => {
      const evidenceId1 = 'CW-CAREER-NATAL-D1-TEST_RULE-JUPITER-SUPPORT-STRONG';
      const evidenceId2 = 'CW-CAREER-DASHA-DASHA-TEST_RULE-JUPITER-SUPPORT-STRONG';

      const input = [
        createWeightedEvidence(evidenceId1, { layer: 'PRIMARY_PROMISE' }),
        createWeightedEvidence(evidenceId2, { layer: 'DASHA' })
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
  });

  describe('direction merge logic', () => {
    it('SUPPORT + SUPPORT => SUPPORT', () => {
      const input = [
        createWeightedEvidence('CW-CAREER-NATAL-D1-TEST_RULE-JUPITER-SUPPORT-STRONG', { direction: 'SUPPORT' }),
        createWeightedEvidence('CW-CAREER-NATAL-D1-TEST_RULE-JUPITER-SUPPORT-WEAK', { direction: 'SUPPORT', strength: 'WEAK' })
      ];

      const result = deduplicateReasoningEvidence(input);

      expect(result).toHaveLength(1);
      expect(result[0].direction).toBe('SUPPORT');
    });

    it('CHALLENGE + CHALLENGE => CHALLENGE', () => {
      const input = [
        createWeightedEvidence('CW-CAREER-NATAL-D1-TEST_RULE-JUPITER-CHALLENGE-STRONG', { direction: 'CHALLENGE' }),
        createWeightedEvidence('CW-CAREER-NATAL-D1-TEST_RULE-JUPITER-CHALLENGE-WEAK', { direction: 'CHALLENGE', strength: 'WEAK' })
      ];

      const result = deduplicateReasoningEvidence(input);

      expect(result).toHaveLength(1);
      expect(result[0].direction).toBe('CHALLENGE');
    });

    it('SUPPORT + CHALLENGE => MIXED', () => {
      const input = [
        createWeightedEvidence('CW-CAREER-NATAL-D1-TEST_RULE-JUPITER-SUPPORT-STRONG', { direction: 'SUPPORT' }),
        createWeightedEvidence('CW-CAREER-NATAL-D1-TEST_RULE-JUPITER-CHALLENGE-STRONG', { direction: 'CHALLENGE' })
      ];

      const result = deduplicateReasoningEvidence(input);

      expect(result).toHaveLength(1);
      expect(result[0].direction).toBe('MIXED');
    });

    it('UNAVAILABLE + SUPPORT => SUPPORT (never negative)', () => {
      const input = [
        createWeightedEvidence('CW-CAREER-NATAL-D1-TEST_RULE-JUPITER-UNAVAILABLE-STRONG', { direction: 'UNAVAILABLE' }),
        createWeightedEvidence('CW-CAREER-NATAL-D1-TEST_RULE-JUPITER-SUPPORT-STRONG', { direction: 'SUPPORT' })
      ];

      const result = deduplicateReasoningEvidence(input);

      expect(result).toHaveLength(1);
      expect(result[0].direction).toBe('SUPPORT');
    });

    it('NEUTRAL + SUPPORT => SUPPORT', () => {
      const input = [
        createWeightedEvidence('CW-CAREER-NATAL-D1-TEST_RULE-JUPITER-NEUTRAL-STRONG', { direction: 'NEUTRAL' }),
        createWeightedEvidence('CW-CAREER-NATAL-D1-TEST_RULE-JUPITER-SUPPORT-STRONG', { direction: 'SUPPORT' })
      ];

      const result = deduplicateReasoningEvidence(input);

      expect(result).toHaveLength(1);
      expect(result[0].direction).toBe('SUPPORT');
    });

    it('MIXED + anything => MIXED', () => {
      const input = [
        createWeightedEvidence('CW-CAREER-NATAL-D1-TEST_RULE-JUPITER-MIXED-STRONG', { direction: 'MIXED' }),
        createWeightedEvidence('CW-CAREER-NATAL-D1-TEST_RULE-JUPITER-SUPPORT-STRONG', { direction: 'SUPPORT' })
      ];

      const result = deduplicateReasoningEvidence(input);

      expect(result).toHaveLength(1);
      expect(result[0].direction).toBe('MIXED');
    });
  });

  describe('strength merge logic', () => {
    it('WEAK + STRONG => STRONG (not VERY_STRONG)', () => {
      const input = [
        createWeightedEvidence('CW-CAREER-NATAL-D1-TEST_RULE-JUPITER-SUPPORT-WEAK', { strength: 'WEAK' }),
        createWeightedEvidence('CW-CAREER-NATAL-D1-TEST_RULE-JUPITER-SUPPORT-STRONG', { strength: 'STRONG' })
      ];

      const result = deduplicateReasoningEvidence(input);

      expect(result).toHaveLength(1);
      expect(result[0].strength).toBe('STRONG');
    });

    it('MODERATE + VERY_STRONG => VERY_STRONG', () => {
      const input = [
        createWeightedEvidence('CW-CAREER-NATAL-D1-TEST_RULE-JUPITER-SUPPORT-MODERATE', { strength: 'MODERATE' }),
        createWeightedEvidence('CW-CAREER-NATAL-D1-TEST_RULE-JUPITER-SUPPORT-VERY_STRONG', { strength: 'VERY_STRONG' })
      ];

      const result = deduplicateReasoningEvidence(input);

      expect(result).toHaveLength(1);
      expect(result[0].strength).toBe('VERY_STRONG');
    });

    it('duplicate occurrences do not sum weight', () => {
      const input = [
        createWeightedEvidence('CW-CAREER-NATAL-D1-TEST_RULE-JUPITER-SUPPORT-STRONG', { weight: 7.5 }),
        createWeightedEvidence('CW-CAREER-NATAL-D1-TEST_RULE-JUPITER-SUPPORT-STRONG', { weight: 7.5 }),
        createWeightedEvidence('CW-CAREER-NATAL-D1-TEST_RULE-JUPITER-SUPPORT-STRONG', { weight: 7.5 })
      ];

      const result = deduplicateReasoningEvidence(input);

      expect(result).toHaveLength(1);
      expect(result[0].weight).toBe(7.5); // Max single occurrence, not 22.5
      expect(result[0].occurrenceCount).toBe(3);
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
      // Both should be sorted by identity key
      expect(result1[0].identityKey).toBe('CW-CAREER-NATAL-D1-TEST_RULE-JUPITER');
      expect(result1[1].identityKey).toBe('CW-CAREER-NATAL-D1-TEST_RULE-SATURN');
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
  });
});
