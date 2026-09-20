import {
  interpretCareerLordRelationship,
  interpretCareerLordRelationships
} from './careerLordRelationshipSemantics';
import type { CareerHouseRelationship } from './careerHouseRelationship';
import { Planet } from '../../types';

function createRelationship(
  overrides: Partial<CareerHouseRelationship>
): CareerHouseRelationship {
  return Object.freeze({
    type: 'LORD_IN_HOUSE',
    houseA: 10,
    houseB: 6,
    lordA: Planet.SATURN,
    lordB: Planet.MERCURY,
    reason: 'Test relationship',
    ...overrides
  });
}

describe('Career Lord Relationship Semantics', () => {
  describe('Primary relationships (10H involvement)', () => {
    it('classifies 10H and 6H lord relationship as PRIMARY SUPPORT', () => {
      const result = interpretCareerLordRelationship(
        createRelationship({
          houseA: 10,
          houseB: 6,
          type: 'LORD_IN_HOUSE',
          reason: 'Lord of house 10 (SATURN) placed in house 6.'
        })
      );

      expect(result.relevance).toBe('PRIMARY');
      expect(result.effect).toBe('SUPPORT');
    });

    it('classifies 10H and 2H lord relationship as PRIMARY SUPPORT', () => {
      const result = interpretCareerLordRelationship(
        createRelationship({
          houseA: 10,
          houseB: 2,
          type: 'LORD_IN_HOUSE',
          reason: 'Lord of house 10 (SATURN) placed in house 2.'
        })
      );

      expect(result.relevance).toBe('PRIMARY');
      expect(result.effect).toBe('SUPPORT');
    });

    it('classifies 10H and 11H lord relationship as PRIMARY SUPPORT', () => {
      const result = interpretCareerLordRelationship(
        createRelationship({
          houseA: 10,
          houseB: 11,
          type: 'LORD_IN_HOUSE',
          reason: 'Lord of house 10 (SATURN) placed in house 11.'
        })
      );

      expect(result.relevance).toBe('PRIMARY');
      expect(result.effect).toBe('SUPPORT');
    });

    it('classifies 10H and 8H lord relationship as PRIMARY CHALLENGE', () => {
      const result = interpretCareerLordRelationship(
        createRelationship({
          houseA: 10,
          houseB: 8,
          type: 'LORD_IN_HOUSE',
          reason: 'Lord of house 10 (SATURN) placed in house 8.'
        })
      );

      expect(result.relevance).toBe('PRIMARY');
      expect(result.effect).toBe('CHALLENGE');
    });

    it('classifies 10H and 12H lord relationship as PRIMARY CHALLENGE', () => {
      const result = interpretCareerLordRelationship(
        createRelationship({
          houseA: 10,
          houseB: 12,
          type: 'LORD_IN_HOUSE',
          reason: 'Lord of house 10 (SATURN) placed in house 12.'
        })
      );

      expect(result.relevance).toBe('PRIMARY');
      expect(result.effect).toBe('CHALLENGE');
    });
  });

  describe('Supporting relationships', () => {
    it('classifies 6H and 2H lord relationship as SUPPORTING SUPPORT', () => {
      const result = interpretCareerLordRelationship(
        createRelationship({
          houseA: 6,
          houseB: 2,
          type: 'LORD_IN_HOUSE',
          reason: 'Lord of house 6 (MERCURY) placed in house 2.'
        })
      );

      expect(result.relevance).toBe('SUPPORTING');
      expect(result.effect).toBe('SUPPORT');
    });

    it('classifies 6H and 11H lord relationship as SUPPORTING SUPPORT', () => {
      const result = interpretCareerLordRelationship(
        createRelationship({
          houseA: 6,
          houseB: 11,
          type: 'LORD_IN_HOUSE',
          reason: 'Lord of house 6 (MERCURY) placed in house 11.'
        })
      );

      expect(result.relevance).toBe('SUPPORTING');
      expect(result.effect).toBe('SUPPORT');
    });

    it('classifies 2H and 11H lord relationship as SUPPORTING SUPPORT', () => {
      const result = interpretCareerLordRelationship(
        createRelationship({
          houseA: 2,
          houseB: 11,
          type: 'LORD_IN_HOUSE',
          reason: 'Lord of house 2 (JUPITER) placed in house 11.'
        })
      );

      expect(result.relevance).toBe('SUPPORTING');
      expect(result.effect).toBe('SUPPORT');
    });
  });

  describe('Challenging relationships', () => {
    it('classifies 8H and 12H lord relationship as CHALLENGING CHALLENGE', () => {
      const result = interpretCareerLordRelationship(
        createRelationship({
          houseA: 8,
          houseB: 12,
          type: 'LORD_IN_HOUSE',
          reason: 'Lord of house 8 (MARS) placed in house 12.'
        })
      );

      expect(result.relevance).toBe('CHALLENGING');
      expect(result.effect).toBe('CHALLENGE');
    });
  });

  describe('Mixed relationships', () => {
    it('classifies 6H and 8H lord relationship as MIXED MIXED', () => {
      const result = interpretCareerLordRelationship(
        createRelationship({
          houseA: 6,
          houseB: 8,
          type: 'LORD_IN_HOUSE',
          reason: 'Lord of house 6 (MERCURY) placed in house 8.'
        })
      );

      expect(result.relevance).toBe('MIXED');
      expect(result.effect).toBe('MIXED');
    });

    it('classifies 8H and 6H lord relationship as MIXED MIXED (orientation independence)', () => {
      const result = interpretCareerLordRelationship(
        createRelationship({
          houseA: 8,
          houseB: 6,
          type: 'LORD_IN_HOUSE',
          reason: 'Lord of house 8 (MARS) placed in house 6.'
        })
      );

      expect(result.relevance).toBe('MIXED');
      expect(result.effect).toBe('MIXED');
    });

    it('classifies 11H and 12H lord relationship as MIXED MIXED', () => {
      const result = interpretCareerLordRelationship(
        createRelationship({
          houseA: 11,
          houseB: 12,
          type: 'LORD_IN_HOUSE',
          reason: 'Lord of house 11 (JUPITER) placed in house 12.'
        })
      );

      expect(result.relevance).toBe('MIXED');
      expect(result.effect).toBe('MIXED');
    });

    it('classifies 12H and 11H lord relationship as MIXED MIXED (orientation independence)', () => {
      const result = interpretCareerLordRelationship(
        createRelationship({
          houseA: 12,
          houseB: 11,
          type: 'LORD_IN_HOUSE',
          reason: 'Lord of house 12 (SATURN) placed in house 11.'
        })
      );

      expect(result.relevance).toBe('MIXED');
      expect(result.effect).toBe('MIXED');
    });
  });

  describe('Neutral relationships', () => {
    it('classifies 3H and 5H lord relationship as NEUTRAL NEUTRAL', () => {
      const result = interpretCareerLordRelationship(
        createRelationship({
          houseA: 3,
          houseB: 5,
          type: 'LORD_IN_HOUSE',
          reason: 'Lord of house 3 (MERCURY) placed in house 5.'
        })
      );

      expect(result.relevance).toBe('NEUTRAL');
      expect(result.effect).toBe('NEUTRAL');
    });

    it('classifies 4H and 9H lord relationship as NEUTRAL NEUTRAL', () => {
      const result = interpretCareerLordRelationship(
        createRelationship({
          houseA: 4,
          houseB: 9,
          type: 'LORD_IN_HOUSE',
          reason: 'Lord of house 4 (MARS) placed in house 9.'
        })
      );

      expect(result.relevance).toBe('NEUTRAL');
      expect(result.effect).toBe('NEUTRAL');
    });
  });

  describe('Relationship strength mapping', () => {
    it('maps EXCHANGE to STRONG', () => {
      const result = interpretCareerLordRelationship(
        createRelationship({
          type: 'EXCHANGE',
          houseA: 10,
          houseB: 6,
          reason: 'Sign exchange between lords.'
        })
      );

      expect(result.strength).toBe('STRONG');
    });

    it('maps COMMON_LORD to STRONG', () => {
      const result = interpretCareerLordRelationship(
        createRelationship({
          type: 'COMMON_LORD',
          houseA: 10,
          houseB: 6,
          lordA: Planet.SATURN,
          lordB: Planet.SATURN,
          reason: 'Single planet rules both houses.'
        })
      );

      expect(result.strength).toBe('STRONG');
    });

    it('maps LORD_IN_HOUSE to MODERATE', () => {
      const result = interpretCareerLordRelationship(
        createRelationship({
          type: 'LORD_IN_HOUSE',
          houseA: 10,
          houseB: 6,
          reason: 'Lord placed in house.'
        })
      );

      expect(result.strength).toBe('MODERATE');
    });

    it('maps LORD_CONJUNCTION to MODERATE', () => {
      const result = interpretCareerLordRelationship(
        createRelationship({
          type: 'LORD_CONJUNCTION',
          houseA: 10,
          houseB: 6,
          reason: 'Lords are conjunct.'
        })
      );

      expect(result.strength).toBe('MODERATE');
    });

    it('maps LORD_ASPECT to MODERATE', () => {
      const result = interpretCareerLordRelationship(
        createRelationship({
          type: 'LORD_ASPECT',
          houseA: 10,
          houseB: 6,
          reason: 'Lords aspect each other.'
        })
      );

      expect(result.strength).toBe('MODERATE');
    });

    it('maps HOUSE_ASPECT to WEAK', () => {
      const result = interpretCareerLordRelationship(
        createRelationship({
          type: 'HOUSE_ASPECT',
          houseA: 10,
          houseB: 6,
          reason: 'Lord aspects house.'
        })
      );

      expect(result.strength).toBe('WEAK');
    });
  });

  describe('Semantic strength vs Career strength distinction', () => {
    it('treats semantic relationship strength independently from final Career strength', () => {
      const result = interpretCareerLordRelationship(
        createRelationship({
          type: 'EXCHANGE',
          houseA: 10,
          houseB: 8,
          reason: 'Sign exchange between lords.'
        })
      );

      expect(result.strength).toBe('STRONG');
      expect(result).not.toHaveProperty('careerStrength');
    });
  });

  describe('Conditionality', () => {
    it('does not treat natal lord relationships as activation conditions', () => {
      const result = interpretCareerLordRelationship(
        createRelationship({
          houseA: 10,
          houseB: 6,
          reason: 'Lord placement.'
        })
      );

      expect(result.conditional).toBe(false);
    });

    it('always sets conditional to false for all relationship types', () => {
      const types: Array<CareerHouseRelationship['type']> = [
        'EXCHANGE',
        'COMMON_LORD',
        'LORD_IN_HOUSE',
        'LORD_CONJUNCTION',
        'LORD_ASPECT',
        'HOUSE_ASPECT'
      ];

      for (const type of types) {
        const result = interpretCareerLordRelationship(
          createRelationship({
            type,
            houseA: 10,
            houseB: 6,
            reason: 'Test relationship.'
          })
        );

        expect(result.conditional).toBe(false);
      }
    });
  });

  describe('Lord identity preservation', () => {
    it('preserves lordA and lordB from C2 relationship', () => {
      const result = interpretCareerLordRelationship(
        createRelationship({
          houseA: 10,
          houseB: 6,
          lordA: Planet.SATURN,
          lordB: Planet.MERCURY,
          reason: 'Lord placement.'
        })
      );

      expect(result.lordA).toBe(Planet.SATURN);
      expect(result.lordB).toBe(Planet.MERCURY);
    });

    it('handles undefined lord identities', () => {
      const result = interpretCareerLordRelationship(
        createRelationship({
          houseA: 10,
          houseB: 6,
          lordA: undefined,
          lordB: undefined,
          reason: 'Lord placement.'
        })
      );

      expect(result.lordA).toBeUndefined();
      expect(result.lordB).toBeUndefined();
    });
  });

  describe('Relationship identity preservation', () => {
    it('preserves the original C2 relationship object', () => {
      const inputRelationship = createRelationship({
        houseA: 10,
        houseB: 6,
        reason: 'Test relationship.'
      });

      const result = interpretCareerLordRelationship(inputRelationship);

      expect(result.relationship).toBe(inputRelationship);
    });

    it('preserves relationshipType', () => {
      const result = interpretCareerLordRelationship(
        createRelationship({
          type: 'EXCHANGE',
          houseA: 10,
          houseB: 6,
          reason: 'Exchange relationship.'
        })
      );

      expect(result.relationshipType).toBe('EXCHANGE');
    });
  });

  describe('Determinism', () => {
    it('produces identical output for identical input', () => {
      const input = createRelationship({
        houseA: 10,
        houseB: 6,
        reason: 'Test relationship.'
      });

      const first = interpretCareerLordRelationship(input);
      const second = interpretCareerLordRelationship(input);

      expect(first).toEqual(second);
    });

    it('produces frozen output', () => {
      const result = interpretCareerLordRelationship(
        createRelationship({
          houseA: 10,
          houseB: 6,
          reason: 'Test relationship.'
        })
      );

      expect(Object.isFrozen(result)).toBe(true);
    });
  });

  describe('Multiple relationship handling', () => {
    it('processes multiple distinct relationships', () => {
      const results = interpretCareerLordRelationships([
        createRelationship({
          type: 'LORD_IN_HOUSE',
          houseA: 10,
          houseB: 6,
          reason: 'Lord of house 10 placed in house 6.'
        }),
        createRelationship({
          type: 'LORD_ASPECT',
          houseA: 10,
          houseB: 6,
          reason: 'Aspect between lords.'
        })
      ]);

      expect(results).toHaveLength(2);
    });

    it('produces frozen array output', () => {
      const results = interpretCareerLordRelationships([
        createRelationship({
          houseA: 10,
          houseB: 6,
          reason: 'Test relationship.'
        })
      ]);

      expect(Object.isFrozen(results)).toBe(true);
    });

    it('deduplicates identical relationships', () => {
      const results = interpretCareerLordRelationships([
        createRelationship({
          type: 'LORD_IN_HOUSE',
          houseA: 10,
          houseB: 6,
          lordA: Planet.SATURN,
          lordB: Planet.MERCURY,
          reason: 'Lord of house 10 placed in house 6.'
        }),
        createRelationship({
          type: 'LORD_IN_HOUSE',
          houseA: 10,
          houseB: 6,
          lordA: Planet.SATURN,
          lordB: Planet.MERCURY,
          reason: 'Lord of house 10 placed in house 6.'
        })
      ]);

      expect(results).toHaveLength(1);
    });

    it('retains different relationship types for same house pair', () => {
      const results = interpretCareerLordRelationships([
        createRelationship({
          type: 'LORD_IN_HOUSE',
          houseA: 10,
          houseB: 6,
          lordA: Planet.SATURN,
          lordB: Planet.MERCURY,
          reason: 'Lord of house 10 placed in house 6.'
        }),
        createRelationship({
          type: 'LORD_ASPECT',
          houseA: 10,
          houseB: 6,
          lordA: Planet.SATURN,
          lordB: Planet.MERCURY,
          reason: 'Aspect between lords.'
        })
      ]);

      expect(results).toHaveLength(2);
    });
  });

  describe('Orientation independence', () => {
    it('produces same relevance and effect for 10-6 and 6-10', () => {
      const result1 = interpretCareerLordRelationship(
        createRelationship({
          houseA: 10,
          houseB: 6,
          reason: 'Test relationship.'
        })
      );

      const result2 = interpretCareerLordRelationship(
        createRelationship({
          houseA: 6,
          houseB: 10,
          reason: 'Test relationship.'
        })
      );

      expect(result1.relevance).toBe(result2.relevance);
      expect(result1.effect).toBe(result2.effect);
    });

    it('produces same relevance and effect for 6-8 and 8-6', () => {
      const result1 = interpretCareerLordRelationship(
        createRelationship({
          houseA: 6,
          houseB: 8,
          reason: 'Test relationship.'
        })
      );

      const result2 = interpretCareerLordRelationship(
        createRelationship({
          houseA: 8,
          houseB: 6,
          reason: 'Test relationship.'
        })
      );

      expect(result1.relevance).toBe(result2.relevance);
      expect(result1.effect).toBe(result2.effect);
    });
  });

  describe('Statement generation', () => {
    it('generates statement with required components', () => {
      const result = interpretCareerLordRelationship(
        createRelationship({
          houseA: 10,
          houseB: 6,
          reason: 'Lord of house 10 (SATURN) placed in house 6.'
        })
      );

      expect(result.statement).toContain('Career lord relationship');
      expect(result.statement).toContain('Career relevance: PRIMARY');
      expect(result.statement).toContain('Effect: SUPPORT');
    });

    it('includes house numbers in statement', () => {
      const result = interpretCareerLordRelationship(
        createRelationship({
          houseA: 10,
          houseB: 6,
          reason: 'Lord placement.'
        })
      );

      expect(result.statement).toContain('houses 10 and 6');
    });

    it('includes the original reason in statement', () => {
      const result = interpretCareerLordRelationship(
        createRelationship({
          houseA: 10,
          houseB: 6,
          reason: 'Lord of house 10 (SATURN) placed in house 6.'
        })
      );

      expect(result.statement).toContain('Lord of house 10 (SATURN) placed in house 6.');
    });
  });

  describe('Frozen individual results in array', () => {
    it('freezes each individual semantic result', () => {
      const results = interpretCareerLordRelationships([
        createRelationship({
          houseA: 10,
          houseB: 6,
          reason: 'Test relationship.'
        })
      ]);

      expect(Object.isFrozen(results[0])).toBe(true);
    });
  });
});
