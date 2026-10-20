import { describe, it, expect } from 'vitest';
import { buildSelectedPeriodEvidenceIndex } from './selectedPeriodEvidenceHelper';
import type { AiEvidence, AiSelectedPeriodContext } from '../types/aiContextTypes';
import { Planet } from '../../types';

describe('buildSelectedPeriodEvidenceIndex', () => {
  const mockEvidence: AiEvidence[] = [
    {
      id: 'ctx-ev-1',
      source: 'PLANET',
      effect: 'SUPPORT',
      strength: 'STRONG',
      statement: 'Context evidence 1',
      planets: [Planet.SUN],
      houses: [1],
      ruleId: 'rule-1',
      identityKey: 'key-1',
      dimension: 'NATAL_STRUCTURE'
    },
    {
      id: 'ctx-ev-2',
      source: 'HOUSE',
      effect: 'CHALLENGE',
      strength: 'MODERATE',
      statement: 'Context evidence 2',
      planets: [Planet.MOON],
      houses: [2],
      ruleId: 'rule-2',
      identityKey: 'key-2',
      dimension: 'MODIFIER'
    }
  ];

  const mockSelectedPeriod: AiSelectedPeriodContext = {
    selectedPeriodId: 'test-sp-id',
    mahadashaId: 'test-md-id',
    mahadashaPlanet: 'SUN',
    antardashaId: 'test-ad-id',
    antardashaPlanet: 'MOON',
    interval: { start: '2020-01-01T00:00:00.000Z', end: '2030-01-01T00:00:00.000Z' },
    analysisAsOf: '2024-01-01T00:00:00.000Z',
    temporalRelation: 'CURRENT',
    evidence: [],
    career: {
      qualificationBasis: 'CANONICAL_STATUS',
      expressions: []
    },
    wealth: {
      dimensions: {
        ACCUMULATION: {
          dimension: 'ACCUMULATION',
          effect: 'ACTIVATES',
          dataStatus: 'COMPLETE',
          linkedLevels: [],
          diagnostics: [],
          promiseEvidenceIds: [],
          dashaRuleReferences: []
        },
        GAINS: {
          dimension: 'GAINS',
          effect: 'ACTIVATES',
          dataStatus: 'COMPLETE',
          linkedLevels: [],
          diagnostics: [],
          promiseEvidenceIds: [],
          dashaRuleReferences: []
        },
        FORTUNE: {
          dimension: 'FORTUNE',
          effect: 'ACTIVATES',
          dataStatus: 'COMPLETE',
          linkedLevels: [],
          diagnostics: [],
          promiseEvidenceIds: [],
          dashaRuleReferences: []
        },
        SPECULATION: {
          dimension: 'SPECULATION',
          effect: 'ACTIVATES',
          dataStatus: 'COMPLETE',
          linkedLevels: [],
          diagnostics: [],
          promiseEvidenceIds: [],
          dashaRuleReferences: []
        }
      }
    },
    supportingEvidenceIds: [],
    challengingEvidenceIds: [],
    missingInputs: [],
    diagnostics: [],
    provenance: {
      career: { status: 'PRESENT' },
      wealth: { status: 'PRESENT' }
    },
    synthesisVersion: 'PBA-06-v1',
    availableEvidence: [
      {
        id: 'sp-ev-1',
        source: 'PLANET',
        effect: 'SUPPORT',
        strength: 'STRONG',
        statement: 'Selected-period evidence 1',
        planets: [Planet.JUPITER],
        houses: [1],
        ruleId: 'rule-3',
        identityKey: 'key-3',
        dimension: 'NATAL_STRUCTURE'
      }
    ]
  };

  it('same-ID identical records → availableEvidence wins silently', () => {
    const identicalSpEvidence: AiEvidence = {
      id: 'ctx-ev-1',
      source: 'PLANET',
      effect: 'SUPPORT',
      strength: 'STRONG',
      statement: 'Context evidence 1',
      planets: [Planet.SUN],
      houses: [1],
      ruleId: 'rule-1',
      identityKey: 'key-1',
      dimension: 'NATAL_STRUCTURE'
    };

    const spWithIdentical: AiSelectedPeriodContext = {
      ...mockSelectedPeriod,
      availableEvidence: [identicalSpEvidence]
    };

    const result = buildSelectedPeriodEvidenceIndex(mockEvidence, spWithIdentical);

    expect(result.ambiguousIds).toEqual([]);
    expect(result.index.get('ctx-ev-1')).toBeDefined();
    // availableEvidence wins when records are identical (overwrites context.evidence)
    expect(result.index.get('ctx-ev-1')).toBe(identicalSpEvidence);
  });

  it('same-ID conflicting statement → reported ambiguous/unresolved', () => {
    const conflictingSpEvidence: AiEvidence = {
      id: 'ctx-ev-1',
      source: 'PLANET',
      effect: 'SUPPORT',
      strength: 'STRONG',
      statement: 'Different statement', // Conflict
      planets: [Planet.SUN],
      houses: [1],
      ruleId: 'rule-1',
      identityKey: 'key-1',
      dimension: 'NATAL_STRUCTURE'
    };

    const spWithConflict: AiSelectedPeriodContext = {
      ...mockSelectedPeriod,
      availableEvidence: [conflictingSpEvidence]
    };

    const result = buildSelectedPeriodEvidenceIndex(mockEvidence, spWithConflict);

    expect(result.ambiguousIds).toContain('ctx-ev-1');
    // Context evidence version is kept (not overwritten)
    expect(result.index.get('ctx-ev-1')).toBe(mockEvidence[0]);
  });

  it('same-ID conflicting effect → reported ambiguous/unresolved', () => {
    const conflictingSpEvidence: AiEvidence = {
      id: 'ctx-ev-1',
      source: 'PLANET',
      effect: 'CHALLENGE', // Conflict
      strength: 'STRONG',
      statement: 'Context evidence 1',
      planets: [Planet.SUN],
      houses: [1],
      ruleId: 'rule-1',
      identityKey: 'key-1',
      dimension: 'NATAL_STRUCTURE'
    };

    const spWithConflict: AiSelectedPeriodContext = {
      ...mockSelectedPeriod,
      availableEvidence: [conflictingSpEvidence]
    };

    const result = buildSelectedPeriodEvidenceIndex(mockEvidence, spWithConflict);

    expect(result.ambiguousIds).toContain('ctx-ev-1');
  });

  it('selected-period-only ID resolves', () => {
    const result = buildSelectedPeriodEvidenceIndex(mockEvidence, mockSelectedPeriod);

    expect(result.ambiguousIds).toEqual([]);
    expect(result.index.get('sp-ev-1')).toBeDefined();
    expect(result.index.get('sp-ev-1')).toBe(mockSelectedPeriod.availableEvidence[0]);
  });

  it('unknown ID unresolved', () => {
    const spWithUnresolved: AiSelectedPeriodContext = {
      ...mockSelectedPeriod,
      career: {
        ...mockSelectedPeriod.career,
        expressions: [
          {
            expressionRefKey: 'test-key',
            status: 'ACTIVATES',
            linkedLevels: [],
            qualificationBasis: 'CANONICAL_STATUS',
            diagnostics: [],
            expressionEvidenceIds: ['unknown-id'],
            qualifiedEvidenceIds: [],
            unqualifiedEvidenceIds: [],
            mdDashaEvidenceIds: [],
            adDashaEvidenceIds: []
          }
        ]
      }
    };

    const result = buildSelectedPeriodEvidenceIndex(mockEvidence, spWithUnresolved);

    expect(result.ambiguousIds).toEqual([]);
    expect(result.index.has('unknown-id')).toBe(false);
  });

  it('no selectedPeriod → returns context evidence with no ambiguous IDs', () => {
    const result = buildSelectedPeriodEvidenceIndex(mockEvidence, undefined);

    expect(result.ambiguousIds).toEqual([]);
    expect(result.index.size).toBe(mockEvidence.length);
    expect(result.index.get('ctx-ev-1')).toBe(mockEvidence[0]);
  });

  it('unreferenced ambiguous ID does not pollute unresolved list', () => {
    // Create a context with an ambiguous cross-namespace ID
    const ambiguousSpEvidence: AiEvidence = {
      id: 'ctx-ev-1',
      source: 'PLANET',
      effect: 'CHALLENGE', // Conflict with context.evidence (SUPPORT)
      strength: 'STRONG',
      statement: 'Different statement',
      planets: [Planet.SUN],
      houses: [1],
      ruleId: 'rule-1',
      identityKey: 'key-1',
      dimension: 'NATAL_STRUCTURE'
    };

    const spWithAmbiguous: AiSelectedPeriodContext = {
      ...mockSelectedPeriod,
      availableEvidence: [ambiguousSpEvidence, mockSelectedPeriod.availableEvidence[0]]
    };

    const result = buildSelectedPeriodEvidenceIndex(mockEvidence, spWithAmbiguous);

    // The ambiguous ID is tracked
    expect(result.ambiguousIds).toContain('ctx-ev-1');

    // But the index still contains the context version (not overwritten)
    expect(result.index.get('ctx-ev-1')).toBe(mockEvidence[0]);

    // Valid IDs still resolve
    expect(result.index.get('ctx-ev-2')).toBe(mockEvidence[1]);
    expect(result.index.get('sp-ev-1')).toBeDefined();
  });

  it('intra-namespace identical duplicate in context.evidence → dedup silently', () => {
    const duplicateEvidence: AiEvidence[] = [
      ...mockEvidence,
      {
        id: 'ctx-ev-1', // Duplicate ID
        source: 'PLANET',
        effect: 'SUPPORT',
        strength: 'STRONG',
        statement: 'Context evidence 1',
        planets: [Planet.SUN],
        houses: [1],
        ruleId: 'rule-1',
        identityKey: 'key-1',
        dimension: 'NATAL_STRUCTURE'
      }
    ];

    const result = buildSelectedPeriodEvidenceIndex(duplicateEvidence, mockSelectedPeriod);

    // No ambiguous IDs
    expect(result.ambiguousIds).toEqual([]);

    // Index contains only one entry for the duplicate ID
    expect(result.index.get('ctx-ev-1')).toBeDefined();
    expect(result.index.size).toBe(3); // ctx-ev-1, ctx-ev-2, sp-ev-1
  });

  it('intra-namespace conflicting duplicate in context.evidence → ambiguous', () => {
    const conflictingDuplicate: AiEvidence[] = [
      ...mockEvidence,
      {
        id: 'ctx-ev-1', // Duplicate ID with different fields
        source: 'PLANET',
        effect: 'CHALLENGE', // Conflict
        strength: 'STRONG',
        statement: 'Context evidence 1',
        planets: [Planet.SUN],
        houses: [1],
        ruleId: 'rule-1',
        identityKey: 'key-1',
        dimension: 'NATAL_STRUCTURE'
      }
    ];

    const result = buildSelectedPeriodEvidenceIndex(conflictingDuplicate, mockSelectedPeriod);

    // The conflicting duplicate is marked as ambiguous
    expect(result.ambiguousIds).toContain('ctx-ev-1');

    // Index keeps the first occurrence
    expect(result.index.get('ctx-ev-1')).toBe(mockEvidence[0]);
  });

  it('intra-namespace identical duplicate in availableEvidence → dedup silently', () => {
    const identicalSpEvidence: AiEvidence = {
      id: 'sp-ev-1',
      source: 'PLANET',
      effect: 'SUPPORT',
      strength: 'STRONG',
      statement: 'Selected-period evidence 1',
      planets: [Planet.JUPITER],
      houses: [1],
      ruleId: 'rule-3',
      identityKey: 'key-3',
      dimension: 'NATAL_STRUCTURE'
    };

    const spWithDuplicate: AiSelectedPeriodContext = {
      ...mockSelectedPeriod,
      availableEvidence: [identicalSpEvidence, identicalSpEvidence] // Same object twice
    };

    const result = buildSelectedPeriodEvidenceIndex(mockEvidence, spWithDuplicate);

    // No ambiguous IDs
    expect(result.ambiguousIds).toEqual([]);

    // Index contains only one entry for the duplicate ID
    expect(result.index.get('sp-ev-1')).toBeDefined();
  });

  it('intra-namespace conflicting duplicate in availableEvidence → ambiguous', () => {
    const conflictingSpEvidence1: AiEvidence = {
      id: 'sp-dup-1',
      source: 'PLANET',
      effect: 'SUPPORT',
      strength: 'STRONG',
      statement: 'Statement 1',
      planets: [Planet.JUPITER],
      houses: [1],
      ruleId: 'rule-3',
      identityKey: 'key-3',
      dimension: 'NATAL_STRUCTURE'
    };

    const conflictingSpEvidence2: AiEvidence = {
      id: 'sp-dup-1', // Same ID, different statement
      source: 'PLANET',
      effect: 'SUPPORT',
      strength: 'STRONG',
      statement: 'Statement 2', // Conflict
      planets: [Planet.JUPITER],
      houses: [1],
      ruleId: 'rule-3',
      identityKey: 'key-3',
      dimension: 'NATAL_STRUCTURE'
    };

    const spWithConflict: AiSelectedPeriodContext = {
      ...mockSelectedPeriod,
      availableEvidence: [conflictingSpEvidence1, conflictingSpEvidence2]
    };

    const result = buildSelectedPeriodEvidenceIndex(mockEvidence, spWithConflict);

    // The conflicting duplicate is marked as ambiguous
    expect(result.ambiguousIds).toContain('sp-dup-1');

    // Index keeps the first occurrence
    expect(result.index.get('sp-dup-1')).toBe(conflictingSpEvidence1);
  });

  it('array-order semantics: planets/houses compared as sorted sets', () => {
    // Create context evidence with multi-planet/house arrays
    const mockEvidenceWithMulti: AiEvidence[] = [
      {
        id: 'ctx-ev-1',
        source: 'PLANET',
        effect: 'SUPPORT',
        strength: 'STRONG',
        statement: 'Context evidence 1',
        planets: [Planet.MOON, Planet.SUN], // Order: MOON, SUN
        houses: [2, 1], // Order: 2, 1
        ruleId: 'rule-1',
        identityKey: 'key-1',
        dimension: 'NATAL_STRUCTURE'
      },
      {
        id: 'ctx-ev-2',
        source: 'HOUSE',
        effect: 'CHALLENGE',
        strength: 'MODERATE',
        statement: 'Context evidence 2',
        planets: [Planet.MOON],
        houses: [2],
        ruleId: 'rule-2',
        identityKey: 'key-2',
        dimension: 'MODIFIER'
      }
    ];

    const spWithDifferentOrder: AiSelectedPeriodContext = {
      ...mockSelectedPeriod,
      availableEvidence: [
        {
          id: 'ctx-ev-1',
          source: 'PLANET',
          effect: 'SUPPORT',
          strength: 'STRONG',
          statement: 'Context evidence 1',
          planets: [Planet.SUN, Planet.MOON], // Different order: SUN, MOON
          houses: [1, 2], // Different order: 1, 2
          ruleId: 'rule-1',
          identityKey: 'key-1',
          dimension: 'NATAL_STRUCTURE'
        }
      ]
    };

    const result = buildSelectedPeriodEvidenceIndex(mockEvidenceWithMulti, spWithDifferentOrder);

    // Should be considered identical (no ambiguity) since order doesn't matter
    expect(result.ambiguousIds).toEqual([]);

    // availableEvidence wins when identical
    expect(result.index.get('ctx-ev-1')).toBe(spWithDifferentOrder.availableEvidence[0]);
  });

  it('reviewer case: two identical availableEvidence records conflict with context → ambiguous once', () => {
    // Context has E1 with statement A
    const contextEvidence: AiEvidence[] = [
      {
        id: 'E1',
        source: 'PLANET',
        effect: 'SUPPORT',
        strength: 'STRONG',
        statement: 'Statement A',
        planets: [Planet.SUN],
        houses: [1],
        ruleId: 'rule-1',
        identityKey: 'key-1',
        dimension: 'NATAL_STRUCTURE'
      }
    ];

    // availableEvidence has two E1 records, both with statement B (identical to each other)
    const availableEvidence1: AiEvidence = {
      id: 'E1',
      source: 'PLANET',
      effect: 'SUPPORT',
      strength: 'STRONG',
      statement: 'Statement B', // Conflicts with context
      planets: [Planet.SUN],
      houses: [1],
      ruleId: 'rule-1',
      identityKey: 'key-1',
      dimension: 'NATAL_STRUCTURE'
    };

    const availableEvidence2: AiEvidence = {
      id: 'E1',
      source: 'PLANET',
      effect: 'SUPPORT',
      strength: 'STRONG',
      statement: 'Statement B', // Same as above
      planets: [Planet.SUN],
      houses: [1],
      ruleId: 'rule-1',
      identityKey: 'key-1',
      dimension: 'NATAL_STRUCTURE'
    };

    const spWithDuplicateConflict: AiSelectedPeriodContext = {
      ...mockSelectedPeriod,
      availableEvidence: [availableEvidence1, availableEvidence2]
    };

    const result = buildSelectedPeriodEvidenceIndex(contextEvidence, spWithDuplicateConflict);

    // Ambiguous exactly once (cross-namespace conflict)
    expect(result.ambiguousIds).toEqual(['E1']);

    // Context version is kept (not overwritten)
    expect(result.index.get('E1')).toBe(contextEvidence[0]);
  });

  it('intra-namespace conflicting duplicate in availableEvidence (no context conflict) → ambiguous', () => {
    // availableEvidence has two conflicting records for an ID not in context
    const conflictingSpEvidence1: AiEvidence = {
      id: 'sp-only-1',
      source: 'PLANET',
      effect: 'SUPPORT',
      strength: 'STRONG',
      statement: 'Statement 1',
      planets: [Planet.JUPITER],
      houses: [1],
      ruleId: 'rule-3',
      identityKey: 'key-3',
      dimension: 'NATAL_STRUCTURE'
    };

    const conflictingSpEvidence2: AiEvidence = {
      id: 'sp-only-1', // Same ID, different statement
      source: 'PLANET',
      effect: 'SUPPORT',
      strength: 'STRONG',
      statement: 'Statement 2', // Conflict
      planets: [Planet.JUPITER],
      houses: [1],
      ruleId: 'rule-3',
      identityKey: 'key-3',
      dimension: 'NATAL_STRUCTURE'
    };

    const spWithConflict: AiSelectedPeriodContext = {
      ...mockSelectedPeriod,
      availableEvidence: [conflictingSpEvidence1, conflictingSpEvidence2]
    };

    const result = buildSelectedPeriodEvidenceIndex(mockEvidence, spWithConflict);

    // The conflicting duplicate is marked as ambiguous
    expect(result.ambiguousIds).toContain('sp-only-1');

    // Index keeps the first occurrence
    expect(result.index.get('sp-only-1')).toBe(conflictingSpEvidence1);
  });

  it('three-record case: two conflicting availableEvidence + context conflict → ambiguous once', () => {
    // Context has E1 with statement A
    const contextEvidence: AiEvidence[] = [
      {
        id: 'E1',
        source: 'PLANET',
        effect: 'SUPPORT',
        strength: 'STRONG',
        statement: 'Statement A',
        planets: [Planet.SUN],
        houses: [1],
        ruleId: 'rule-1',
        identityKey: 'key-1',
        dimension: 'NATAL_STRUCTURE'
      }
    ];

    // availableEvidence has two conflicting E1 records (statements B and C)
    const availableEvidence1: AiEvidence = {
      id: 'E1',
      source: 'PLANET',
      effect: 'SUPPORT',
      strength: 'STRONG',
      statement: 'Statement B', // Conflicts with context
      planets: [Planet.SUN],
      houses: [1],
      ruleId: 'rule-1',
      identityKey: 'key-1',
      dimension: 'NATAL_STRUCTURE'
    };

    const availableEvidence2: AiEvidence = {
      id: 'E1',
      source: 'PLANET',
      effect: 'SUPPORT',
      strength: 'STRONG',
      statement: 'Statement C', // Also conflicts with context and with availableEvidence1
      planets: [Planet.SUN],
      houses: [1],
      ruleId: 'rule-1',
      identityKey: 'key-1',
      dimension: 'NATAL_STRUCTURE'
    };

    const spWithTripleConflict: AiSelectedPeriodContext = {
      ...mockSelectedPeriod,
      availableEvidence: [availableEvidence1, availableEvidence2]
    };

    const result = buildSelectedPeriodEvidenceIndex(contextEvidence, spWithTripleConflict);

    // Ambiguous exactly once (deterministic behavior)
    expect(result.ambiguousIds).toEqual(['E1']);

    // Index keeps the context record (unchanged semantics: context retained on conflict)
    expect(result.index.get('E1')).toBe(contextEvidence[0]);
  });
});
