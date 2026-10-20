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
});
