import {
  describe,
  expect,
  it
} from 'vitest';

import type {
  CareerHouseRelationship
} from './careerHouseRelationship';

import {
  interpretCareerHouseRelationship
} from './careerHouseRelationshipSemantics';

import {
  resolveCareerStructuralReasoning,
  resolveCareerStructuralReasoningFromRelationships
} from './careerStructuralReasoning';

import type {
  CareerHouseRelationshipSemantic
} from './careerHouseRelationshipSemantics';

import type {
  Planet
} from '../../types';

function relationship(
  overrides: Partial<CareerHouseRelationship> = {}
): CareerHouseRelationship {
  return {
    type: 'LORD_IN_HOUSE',
    houseA: 10,
    houseB: 6,
    lordA: 'MARS' as Planet,
    lordB: 'VENUS' as Planet,
    lordAHouse: 6,
    lordBHouse: 2,
    reason: 'Test relationship.',
    ...overrides
  };
}

function semantic(
  overrides: Partial<CareerHouseRelationshipSemantic> = {}
): CareerHouseRelationshipSemantic {
  const base =
    interpretCareerHouseRelationship(
      relationship()
    );

  return {
    ...base,
    ...overrides
  };
}

describe('CareerStructuralReasoning', () => {
  it('preserves primary supporting structure', () => {
    const result =
      resolveCareerStructuralReasoning([
        semantic({
          relationship: relationship({
            houseA: 10,
            houseB: 6
          }),
          relevance: 'PRIMARY',
          effect: 'SUPPORT',
          strength: 'STRONG'
        })
      ]);

    expect(result.direction)
      .toBe('SUPPORT');

    expect(result.strength)
      .toBe('VERY_STRONG');

    expect(result.primarySupport)
      .toBe(3);

    expect(result.primaryChallenge)
      .toBe(0);
  });

  it('preserves primary challenging structure', () => {
    const result =
      resolveCareerStructuralReasoning([
        semantic({
          relationship: relationship({
            houseA: 10,
            houseB: 8
          }),
          relevance: 'PRIMARY',
          effect: 'CHALLENGE',
          strength: 'STRONG'
        })
      ]);

    expect(result.direction)
      .toBe('CHALLENGE');

    expect(result.strength)
      .toBe('VERY_WEAK');

    expect(result.primarySupport)
      .toBe(0);

    expect(result.primaryChallenge)
      .toBe(3);
  });

  it('preserves mixed primary structure instead of collapsing it', () => {
    const result =
      resolveCareerStructuralReasoning([
        semantic({
          relationship: relationship({
            houseA: 10,
            houseB: 6
          }),
          relevance: 'PRIMARY',
          effect: 'SUPPORT',
          strength: 'STRONG'
        }),

        semantic({
          relationship: relationship({
            houseA: 10,
            houseB: 8
          }),
          relevance: 'PRIMARY',
          effect: 'CHALLENGE',
          strength: 'MODERATE'
        })
      ]);

    expect(result.direction)
      .toBe('MIXED');

    expect(result.strength)
      .toBe('MIXED');

    expect(result.primarySupport)
      .toBe(3);

    expect(result.primaryChallenge)
      .toBe(2);

    expect(result.conflicts)
      .toHaveLength(1);

    expect(
      result.conflicts[0].supportWeight
    ).toBe(3);

    expect(
      result.conflicts[0].challengeWeight
    ).toBe(2);
  });

  it('does not let secondary challenge erase primary support', () => {
    const result =
      resolveCareerStructuralReasoning([
        semantic({
          relationship: relationship({
            houseA: 10,
            houseB: 6
          }),
          relevance: 'PRIMARY',
          effect: 'SUPPORT',
          strength: 'STRONG'
        }),

        semantic({
          relationship: relationship({
            houseA: 6,
            houseB: 8
          }),
          relevance: 'MIXED',
          effect: 'MIXED',
          strength: 'MODERATE'
        }),

        semantic({
          relationship: relationship({
            houseA: 11,
            houseB: 12
          }),
          relevance: 'MIXED',
          effect: 'MIXED',
          strength: 'MODERATE'
        })
      ]);

    expect(result.direction)
      .toBe('SUPPORT');

    expect(result.strength)
      .toBe('VERY_STRONG');

    expect(result.primarySupport)
      .toBe(3);

    expect(result.primaryChallenge)
      .toBe(0);

    expect(result.mixedWeight)
      .toBe(4);
  });

  it('preserves mixed relationship semantics', () => {
    const result =
      resolveCareerStructuralReasoning([
        semantic({
          relationship: relationship({
            houseA: 6,
            houseB: 8
          }),
          relevance: 'MIXED',
          effect: 'MIXED',
          strength: 'MODERATE'
        })
      ]);

    expect(result.direction)
      .toBe('MIXED');

    expect(result.mixedWeight)
      .toBe(2);

    expect(result.evidence[0].role)
      .toBe('MIXED');

    expect(result.evidence[0].direction)
      .toBe('MIXED');
  });

  it('does not convert neutral relationships into support or challenge', () => {
    const result =
      resolveCareerStructuralReasoning([
        semantic({
          relationship: relationship({
            houseA: 3,
            houseB: 5
          }),
          relevance: 'NEUTRAL',
          effect: 'NEUTRAL',
          strength: 'WEAK'
        })
      ]);

    expect(result.direction)
      .toBe('UNAVAILABLE');

    expect(result.strength)
      .toBe('UNDETERMINED');

    expect(result.primarySupport)
      .toBe(0);

    expect(result.primaryChallenge)
      .toBe(0);

    expect(result.mixedWeight)
      .toBe(0);
  });

  it('maps C3 relationship strength deterministically', () => {
    const result =
      resolveCareerStructuralReasoning([
        semantic({
          relevance: 'PRIMARY',
          effect: 'SUPPORT',
          strength: 'STRONG'
        }),
        semantic({
          relationship: relationship({
            houseA: 10,
            houseB: 11
          }),
          relevance: 'PRIMARY',
          effect: 'SUPPORT',
          strength: 'MODERATE'
        }),
        semantic({
          relationship: relationship({
            houseA: 10,
            houseB: 2
          }),
          relevance: 'PRIMARY',
          effect: 'SUPPORT',
          strength: 'WEAK'
        })
      ]);

    expect(
      result.primarySupport
    ).toBe(6);
  });

  it('returns immutable structural reasoning', () => {
    const result =
      resolveCareerStructuralReasoning([
        semantic({
          relevance: 'PRIMARY',
          effect: 'SUPPORT',
          strength: 'STRONG'
        })
      ]);

    expect(
      Object.isFrozen(result)
    ).toBe(true);

    expect(
      Object.isFrozen(result.evidence)
    ).toBe(true);

    expect(
      Object.isFrozen(result.primaryEvidenceIds)
    ).toBe(true);

    expect(
      Object.isFrozen(result.conflicts)
    ).toBe(true);
  });

  it('preserves deterministic input ordering', () => {
    const first =
      semantic({
        relationship: relationship({
          houseA: 10,
          houseB: 6
        }),
        relevance: 'PRIMARY',
        effect: 'SUPPORT',
        strength: 'STRONG'
      });

    const second =
      semantic({
        relationship: relationship({
          houseA: 10,
          houseB: 8
        }),
        relevance: 'PRIMARY',
        effect: 'CHALLENGE',
        strength: 'MODERATE'
      });

    const result =
      resolveCareerStructuralReasoning([
        first,
        second
      ]);

    expect(
      result.evidence[0].semantic
    ).toBe(first);

    expect(
      result.evidence[1].semantic
    ).toBe(second);
  });

  it('does not mutate semantic input', () => {
    const input = Object.freeze([
      semantic({
        relevance: 'PRIMARY',
        effect: 'SUPPORT',
        strength: 'STRONG'
      })
    ]);

    const before =
      JSON.stringify(input);

    resolveCareerStructuralReasoning(
      input
    );

    expect(
      JSON.stringify(input)
    ).toBe(before);
  });

  it('can resolve structural reasoning directly from relationships', () => {
    const result =
      resolveCareerStructuralReasoningFromRelationships([
        relationship({
          houseA: 10,
          houseB: 6,
          lordAHouse: 6,
          lordBHouse: 2
        })
      ]);

    expect(result.evidence)
      .toHaveLength(1);

    expect(result.direction)
      .toBe('SUPPORT');
  });

  it('generates deterministic evidence IDs', () => {
    const result =
      resolveCareerStructuralReasoning([
        semantic({
          relationship: relationship({
            houseA: 10,
            houseB: 6
          }),
          relevance: 'PRIMARY',
          effect: 'SUPPORT',
          strength: 'STRONG'
        })
      ]);

    expect(result.evidence[0].id)
      .toMatch(/^CAREER_STRUCTURAL:/);

    expect(result.evidence[0].id)
      .toContain('LORD_IN_HOUSE');
  });

  it('classifies supporting structure correctly', () => {
    const result =
      resolveCareerStructuralReasoning([
        semantic({
          relationship: relationship({
            houseA: 11,
            houseB: 2
          }),
          relevance: 'SUPPORTING',
          effect: 'SUPPORT',
          strength: 'MODERATE'
        })
      ]);

    expect(result.evidence[0].role)
      .toBe('SUPPORTING');

    expect(result.supportingSupport)
      .toBe(2);
  });

  it('classifies challenging structure correctly', () => {
    const result =
      resolveCareerStructuralReasoning([
        semantic({
          relationship: relationship({
            houseA: 6,
            houseB: 8
          }),
          relevance: 'CHALLENGING',
          effect: 'CHALLENGE',
          strength: 'MODERATE'
        })
      ]);

    expect(result.evidence[0].role)
      .toBe('CHALLENGING');

    expect(result.challengingChallenge)
      .toBe(2);
  });

  it('classifies neutral relationships as modifiers', () => {
    const result =
      resolveCareerStructuralReasoning([
        semantic({
          relationship: relationship({
            houseA: 3,
            houseB: 5
          }),
          relevance: 'NEUTRAL',
          effect: 'NEUTRAL',
          strength: 'WEAK'
        })
      ]);

    expect(result.evidence[0].role)
      .toBe('MODIFIER');
  });

  // Synthetic semantic input intentionally verifies that
  // structural role and effect remain independent dimensions.
  // C3 would normally derive this combination differently.
  it('preserves challenging role with support effect', () => {
    const result =
      resolveCareerStructuralReasoning([
        semantic({
          relationship: relationship({
            houseA: 6,
            houseB: 11
          }),
          relevance: 'CHALLENGING',
          effect: 'SUPPORT',
          strength: 'MODERATE'
        })
      ]);

    expect(result.evidence[0].role)
      .toBe('CHALLENGING');

    expect(result.evidence[0].direction)
      .toBe('SUPPORT');

    expect(result.challengingSupport)
      .toBe(2);
  });

  it('calculates structural strength based on primary dominance', () => {
    const result =
      resolveCareerStructuralReasoning([
        semantic({
          relevance: 'PRIMARY',
          effect: 'SUPPORT',
          strength: 'STRONG'
        }),
        semantic({
          relationship: relationship({
            houseA: 10,
            houseB: 11
          }),
          relevance: 'PRIMARY',
          effect: 'SUPPORT',
          strength: 'STRONG'
        }),
        semantic({
          relationship: relationship({
            houseA: 10,
            houseB: 2
          }),
          relevance: 'PRIMARY',
          effect: 'CHALLENGE',
          strength: 'WEAK'
        })
      ]);

    expect(result.primarySupport)
      .toBe(6);

    expect(result.primaryChallenge)
      .toBe(1);

    expect(result.strength)
      .toBe('STRONG');
  });

  it('returns UNAVAILABLE when no evidence is present', () => {
    const result =
      resolveCareerStructuralReasoning([]);

    expect(result.direction)
      .toBe('UNAVAILABLE');

    expect(result.strength)
      .toBe('UNDETERMINED');

    expect(result.evidence)
      .toHaveLength(0);
  });

  it('returns UNAVAILABLE when only secondary evidence is present', () => {
    const result =
      resolveCareerStructuralReasoning([
        semantic({
          relationship: relationship({
            houseA: 11,
            houseB: 2
          }),
          relevance: 'SUPPORTING',
          effect: 'SUPPORT',
          strength: 'MODERATE'
        })
      ]);

    expect(result.direction)
      .toBe('UNAVAILABLE');

    expect(result.strength)
      .toBe('UNDETERMINED');

    expect(result.primarySupport)
      .toBe(0);

    expect(result.supportingSupport)
      .toBe(2);
  });

  it('does not establish Career direction from secondary structure alone', () => {
    const result =
      resolveCareerStructuralReasoning([
        semantic({
          relationship: relationship({
            houseA: 6,
            houseB: 11
          }),
          relevance: 'SUPPORTING',
          effect: 'SUPPORT',
          strength: 'STRONG'
        })
      ]);

    expect(result.direction)
      .toBe('UNAVAILABLE');

    expect(result.strength)
      .toBe('UNDETERMINED');

    expect(result.supportingSupport)
      .toBe(3);

    expect(result.primarySupport)
      .toBe(0);
  });

  it('retains secondary challenge without creating primary challenge', () => {
    const result =
      resolveCareerStructuralReasoning([
        semantic({
          relationship: relationship({
            houseA: 8,
            houseB: 12
          }),
          relevance: 'CHALLENGING',
          effect: 'CHALLENGE',
          strength: 'STRONG'
        })
      ]);

    expect(result.direction)
      .toBe('UNAVAILABLE');

    expect(result.strength)
      .toBe('UNDETERMINED');

    expect(result.challengingChallenge)
      .toBe(3);

    expect(result.primaryChallenge)
      .toBe(0);
  });

  it('derives structural strength from primary structure only', () => {
    const result =
      resolveCareerStructuralReasoning([
        semantic({
          relationship: relationship({
            houseA: 10,
            houseB: 6
          }),
          relevance: 'PRIMARY',
          effect: 'SUPPORT',
          strength: 'MODERATE'
        }),

        semantic({
          relationship: relationship({
            houseA: 8,
            houseB: 12
          }),
          relevance: 'CHALLENGING',
          effect: 'CHALLENGE',
          strength: 'STRONG'
        }),

        semantic({
          relationship: relationship({
            houseA: 6,
            houseB: 8
          }),
          relevance: 'MIXED',
          effect: 'MIXED',
          strength: 'STRONG'
        })
      ]);

    expect(result.direction)
      .toBe('SUPPORT');

    expect(result.strength)
      .toBe('VERY_STRONG');

    expect(result.primarySupport)
      .toBe(2);

    expect(result.primaryChallenge)
      .toBe(0);
  });

  it('deduplicates identical semantic instances before aggregation', () => {
    const duplicateRelationship = relationship({
      houseA: 10,
      houseB: 6
    });

    const result =
      resolveCareerStructuralReasoning([
        semantic({
          relationship: duplicateRelationship,
          relevance: 'PRIMARY',
          effect: 'SUPPORT',
          strength: 'STRONG',
          conditional: false
        }),
        semantic({
          relationship: duplicateRelationship,
          relevance: 'PRIMARY',
          effect: 'SUPPORT',
          strength: 'STRONG',
          conditional: false
        })
      ]);

    expect(result.evidence)
      .toHaveLength(1);

    expect(result.primarySupport)
      .toBe(3);
  });

  it('creates descriptive structural statement', () => {
    const result =
      resolveCareerStructuralReasoning([
        semantic({
          relevance: 'PRIMARY',
          effect: 'SUPPORT',
          strength: 'STRONG'
        })
      ]);

    expect(result.statement)
      .toContain('Career structural direction: SUPPORT');

    expect(result.statement)
      .toContain('Structural strength: VERY_STRONG');

    expect(result.statement)
      .toContain('Primary structural weight: 3');
  });

  it('separates evidence by role correctly', () => {
    const result =
      resolveCareerStructuralReasoning([
        semantic({
          relationship: relationship({
            houseA: 10,
            houseB: 6
          }),
          relevance: 'PRIMARY',
          effect: 'SUPPORT',
          strength: 'STRONG'
        }),
        semantic({
          relationship: relationship({
            houseA: 11,
            houseB: 2
          }),
          relevance: 'SUPPORTING',
          effect: 'SUPPORT',
          strength: 'MODERATE'
        }),
        semantic({
          relationship: relationship({
            houseA: 6,
            houseB: 8
          }),
          relevance: 'CHALLENGING',
          effect: 'CHALLENGE',
          strength: 'MODERATE'
        })
      ]);

    expect(result.primaryEvidenceIds)
      .toHaveLength(1);

    expect(result.supportingEvidenceIds)
      .toHaveLength(1);

    expect(result.challengingEvidenceIds)
      .toHaveLength(1);
  });

  // Synthetic semantic input intentionally verifies that
  // structural role and effect remain independent dimensions.
  // C3 would normally derive this combination differently.
  it('detects conflict only when primary has both support and challenge', () => {
    const result =
      resolveCareerStructuralReasoning([
        semantic({
          relationship: relationship({
            houseA: 10,
            houseB: 6
          }),
          relevance: 'PRIMARY',
          effect: 'SUPPORT',
          strength: 'STRONG'
        }),
        semantic({
          relationship: relationship({
            houseA: 11,
            houseB: 2
          }),
          relevance: 'SUPPORTING',
          effect: 'CHALLENGE',
          strength: 'MODERATE'
        })
      ]);

    expect(result.conflicts)
      .toHaveLength(0);
  });

  it('calculates conflict ratio correctly', () => {
    const result =
      resolveCareerStructuralReasoning([
        semantic({
          relationship: relationship({
            houseA: 10,
            houseB: 6
          }),
          relevance: 'PRIMARY',
          effect: 'SUPPORT',
          strength: 'STRONG'
        }),
        semantic({
          relationship: relationship({
            houseA: 10,
            houseB: 8
          }),
          relevance: 'PRIMARY',
          effect: 'CHALLENGE',
          strength: 'STRONG'
        })
      ]);

    expect(result.conflicts[0].ratio)
      .toBe(0.5);
  });

  it('does not discard conflicting semantics for the same relationship', () => {
    const relationshipValue = relationship({
      houseA: 10,
      houseB: 6
    });

    const result =
      resolveCareerStructuralReasoning([
        semantic({
          relationship: relationshipValue,
          relevance: 'PRIMARY',
          effect: 'SUPPORT',
          strength: 'STRONG',
          conditional: false
        }),

        semantic({
          relationship: relationshipValue,
          relevance: 'PRIMARY',
          effect: 'CHALLENGE',
          strength: 'MODERATE',
          conditional: false
        })
      ]);

    expect(result.evidence)
      .toHaveLength(2);
  });
});
