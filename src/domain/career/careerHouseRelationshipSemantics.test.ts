import {
  describe,
  expect,
  it
} from 'vitest';

import {
  interpretCareerHouseRelationship,
  interpretCareerHouseRelationships
} from './careerHouseRelationshipSemantics';

import type {
  CareerHouseRelationship
} from './careerHouseRelationship';

import type { Planet } from '../../types';

function relationship(
  overrides: Partial<CareerHouseRelationship> = {}
): CareerHouseRelationship {
  return {
    type: 'LORD_IN_HOUSE',
    houseA: 6,
    houseB: 10,
    lordA: 'SATURN' as Planet,
    lordB: 'MARS' as Planet,
    lordAHouse: 10,
    lordBHouse: 5,
    reason: 'Lord of house 6 placed in house 10.',
    ...overrides
  };
}

describe('Career house relationship semantics', () => {
  it('interprets 6th-to-10th relationship as primary supportive career semantics', () => {
    const result =
      interpretCareerHouseRelationship(
        relationship({
          houseA: 6,
          houseB: 10
        })
      );

    expect(result.relevance).toBe('PRIMARY');
    expect(result.effect).toBe('SUPPORT');
  });

  it('interprets 10th-to-11th relationship as primary supportive career semantics', () => {
    const result =
      interpretCareerHouseRelationship(
        relationship({
          houseA: 10,
          houseB: 11
        })
      );

    expect(result.relevance).toBe('PRIMARY');
    expect(result.effect).toBe('SUPPORT');
  });

  it('interprets 10th-to-2nd relationship as primary supportive career semantics', () => {
    const result =
      interpretCareerHouseRelationship(
        relationship({
          houseA: 10,
          houseB: 2
        })
      );

    expect(result.relevance).toBe('PRIMARY');
    expect(result.effect).toBe('SUPPORT');
  });

  it('interprets 10th-to-8th relationship as primary challenging career semantics', () => {
    const result =
      interpretCareerHouseRelationship(
        relationship({
          houseA: 10,
          houseB: 8
        })
      );

    expect(result.relevance).toBe('PRIMARY');
    expect(result.effect).toBe('CHALLENGE');
  });

  it('interprets 10th-to-12th relationship as primary challenging career semantics', () => {
    const result =
      interpretCareerHouseRelationship(
        relationship({
          houseA: 10,
          houseB: 12
        })
      );

    expect(result.relevance).toBe('PRIMARY');
    expect(result.effect).toBe('CHALLENGE');
  });

  it('interprets 6th-to-11th as supporting career relationship', () => {
    const result =
      interpretCareerHouseRelationship(
        relationship({
          houseA: 6,
          houseB: 11
        })
      );

    expect(result.relevance).toBe('SUPPORTING');
    expect(result.effect).toBe('SUPPORT');
  });

  it('interprets supporting-to-challenging relationship as mixed', () => {
    const result =
      interpretCareerHouseRelationship(
        relationship({
          houseA: 6,
          houseB: 8
        })
      );

    expect(result.relevance).toBe('CHALLENGING');
    expect(result.effect).toBe('MIXED');
  });

  it('does not treat challenging-house relationships as supportive', () => {
    const result =
      interpretCareerHouseRelationship(
        relationship({
          houseA: 8,
          houseB: 12
        })
      );

    expect(result.relevance).toBe('CHALLENGING');
    expect(result.effect).toBe('CHALLENGE');
  });

  it('assigns strong semantic strength to exchange', () => {
    const result =
      interpretCareerHouseRelationship(
        relationship({
          type: 'EXCHANGE'
        })
      );

    expect(result.strength).toBe('STRONG');
  });

  it('assigns strong semantic strength to common lord', () => {
    const result =
      interpretCareerHouseRelationship(
        relationship({
          type: 'COMMON_LORD'
        })
      );

    expect(result.strength).toBe('STRONG');
  });

  it('assigns moderate semantic strength to lord-in-house', () => {
    const result =
      interpretCareerHouseRelationship(
        relationship({
          type: 'LORD_IN_HOUSE'
        })
      );

    expect(result.strength).toBe('MODERATE');
  });

  it('assigns moderate semantic strength to lord conjunction', () => {
    const result =
      interpretCareerHouseRelationship(
        relationship({
          type: 'LORD_CONJUNCTION'
        })
      );

    expect(result.strength).toBe('MODERATE');
  });

  it('assigns moderate semantic strength to lord aspect', () => {
    const result =
      interpretCareerHouseRelationship(
        relationship({
          type: 'LORD_ASPECT'
        })
      );

    expect(result.strength).toBe('MODERATE');
  });

  it('assigns weak semantic strength to house aspect', () => {
    const result =
      interpretCareerHouseRelationship(
        relationship({
          type: 'HOUSE_ASPECT'
        })
      );

    expect(result.strength).toBe('WEAK');
  });

  it('does not introduce activation conditions at C3', () => {
    const result =
      interpretCareerHouseRelationship(
        relationship()
      );

    expect(result.conditional).toBe(false);
  });

  it('preserves the original structural relationship', () => {
    const input = relationship();

    const result =
      interpretCareerHouseRelationship(input);

    expect(result.relationship).toBe(input);
  });

  it('returns an immutable semantic result', () => {
    const result =
      interpretCareerHouseRelationship(
        relationship()
      );

    expect(Object.isFrozen(result)).toBe(true);
  });

  it('returns an immutable semantic array', () => {
    const result =
      interpretCareerHouseRelationships([
        relationship(),
        relationship({
          houseA: 10,
          houseB: 11
        })
      ]);

    expect(Object.isFrozen(result)).toBe(true);
  });

  it('preserves multiple independent relationships', () => {
    const input = [
      relationship({
        type: 'COMMON_LORD',
        houseA: 6,
        houseB: 10
      }),
      relationship({
        type: 'LORD_ASPECT',
        houseA: 10,
        houseB: 11
      })
    ];

    const result =
      interpretCareerHouseRelationships(input);

    expect(result).toHaveLength(2);

    expect(
      result.map(item => item.relationshipType)
    ).toEqual([
      'COMMON_LORD',
      'LORD_ASPECT'
    ]);
  });

  it('produces deterministic semantic output', () => {
    const input = relationship();

    const first =
      interpretCareerHouseRelationship(input);

    const second =
      interpretCareerHouseRelationship(input);

    expect(second).toEqual(first);
  });

  it('produces a deterministic semantic statement', () => {
    const result =
      interpretCareerHouseRelationship(
        relationship({
          houseA: 6,
          houseB: 10,
          reason:
            'Lord of house 6 placed in house 10.'
        })
      );

    expect(result.statement).toBe(
      'Career relationship between houses 6 and 10. ' +
      'Lord of house 6 placed in house 10. ' +
      'Career relevance: PRIMARY. ' +
      'Effect: SUPPORT.'
    );
  });

  it('classifies neutral houses correctly', () => {
    const result =
      interpretCareerHouseRelationship(
        relationship({
          houseA: 3,
          houseB: 7
        })
      );

    expect(result.relevance).toBe('NEUTRAL');
    expect(result.effect).toBe('NEUTRAL');
  });

  it('handles 11th-to-12th as mixed effect', () => {
    const result =
      interpretCareerHouseRelationship(
        relationship({
          houseA: 11,
          houseB: 12
        })
      );

    expect(result.relevance).toBe('CHALLENGING');
    expect(result.effect).toBe('MIXED');
  });

  it('handles 2nd-to-6th as supporting relationship', () => {
    const result =
      interpretCareerHouseRelationship(
        relationship({
          houseA: 2,
          houseB: 6
        })
      );

    expect(result.relevance).toBe('SUPPORTING');
    expect(result.effect).toBe('SUPPORT');
  });

  it('preserves relationship type in semantic result', () => {
    const result =
      interpretCareerHouseRelationship(
        relationship({
          type: 'EXCHANGE'
        })
      );

    expect(result.relationshipType).toBe('EXCHANGE');
  });

  it('handles 8th-to-6th as mixed effect', () => {
    const result =
      interpretCareerHouseRelationship(
        relationship({
          houseA: 8,
          houseB: 6
        })
      );

    expect(result.relevance).toBe('CHALLENGING');
    expect(result.effect).toBe('MIXED');
  });

  it('handles 12th-to-11th as mixed effect', () => {
    const result =
      interpretCareerHouseRelationship(
        relationship({
          houseA: 12,
          houseB: 11
        })
      );

    expect(result.relevance).toBe('CHALLENGING');
    expect(result.effect).toBe('MIXED');
  });
});
