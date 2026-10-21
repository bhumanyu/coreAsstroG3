/**
 * PBA-07: Product Analysis Mapper Tests
 *
 * Tests for the selected-period synthesis mapper.
 */

import { describe, it, expect } from 'vitest';
import { mapSelectedPeriodSynthesis, mapDashaPeriodOptions } from './productAnalysisMapper';
import type { SelectedPeriodSynthesisValue } from '../../domain/synthesis/selectedPeriodSynthesis';

describe('mapSelectedPeriodSynthesis (PBA-07)', () => {
  const mockSynthesisValue: SelectedPeriodSynthesisValue<any, any> = {
    synthesisVersion: 'PBA-06-v1',
    period: {
      selectedPeriodId: 'period-123',
      mahadashaId: 'md-456',
      mahadashaPlanet: 'SATURN',
      antardashaId: 'ad-789',
      antardashaPlanet: 'JUPITER',
      interval: {
        start: '2025-01-01T00:00:00Z',
        end: '2027-01-01T00:00:00Z'
      },
      analysisAsOf: '2026-01-01T00:00:00Z',
      temporalRelation: 'CURRENT'
    },
    natalBaseline: {
      career: {
        baseline: {} as any,
        unchanged: true
      },
      wealth: {
        baseline: {} as any,
        unchanged: true
      }
    },
    career: {
      qualificationBasis: 'CANONICAL_STATUS',
      expressions: [
        {
          expressionRefKey: 'expr-1',
          status: 'ACTIVATES',
          linkedLevels: ['MD', 'AD'],
          qualificationBasis: 'CANONICAL_STATUS',
          matchBasis: 'UNAMBIGUOUS',
          diagnostics: [
            {
              code: 'NO_DIAGNOSTIC',
              message: 'No diagnostic'
            }
          ],
          expressionEvidenceIds: ['ev-1', 'ev-2'],
          qualifiedEvidenceIds: ['ev-1'],
          unqualifiedEvidenceIds: ['ev-2'],
          mdDashaEvidenceIds: ['md-ev-1'],
          adDashaEvidenceIds: ['ad-ev-1'],
          expressionSource: 'CALLER'
        }
      ],
      diagnostics: [
        {
          code: 'CAREER_OK',
          message: 'Career analysis OK'
        }
      ]
    },
    wealth: {
      dimensions: {
        ACCUMULATION: {
          dimension: 'ACCUMULATION',
          effect: 'ACTIVATES',
          dataStatus: 'COMPLETE',
          linkedLevels: ['MD'],
          diagnostics: [],
          promiseEvidenceIds: ['promise-1'],
          dashaRuleReferences: [
            { ruleId: 'rule-1', source: 'DASHA', level: 'MD' },
            { ruleId: 'rule-2', source: 'DASHA', level: 'AD' }
          ],
          insufficientReason: 'LINKED' as const
        },
        GAINS: {
          dimension: 'GAINS',
          effect: 'PARTIALLY_ACTIVATES',
          dataStatus: 'PARTIAL',
          linkedLevels: ['AD'],
          diagnostics: [],
          promiseEvidenceIds: ['promise-2'],
          dashaRuleReferences: [],
          insufficientReason: 'LINKED' as const
        },
        FORTUNE: {
          dimension: 'FORTUNE',
          effect: 'INSUFFICIENT_DATA',
          dataStatus: 'INSUFFICIENT_DATA',
          linkedLevels: [],
          diagnostics: [],
          promiseEvidenceIds: [],
          dashaRuleReferences: [],
          insufficientReason: 'NO_PROMISE_EVIDENCE' as const
        },
        SPECULATION: {
          dimension: 'SPECULATION',
          effect: 'CHALLENGES',
          dataStatus: 'COMPLETE',
          linkedLevels: ['MD', 'AD'],
          diagnostics: [],
          promiseEvidenceIds: ['promise-3'],
          dashaRuleReferences: [],
          insufficientReason: 'LINKED' as const
        }
      },
      diagnostics: []
    },
    evidence: [
      {
        classification: 'SUPPORTING',
        evidenceId: 'ev-1',
        identityKey: 'key-1',
        dimension: 'ACCUMULATION',
        polarity: 'SUPPORTING',
        source: 'CAREER',
        ruleId: 'rule-1',
        level: 'MD',
        stage: 'CAREER',
        provenanceStage: 'CAREER_EXPRESSION',
        referenceKind: 'EVIDENCE'
      },
      {
        classification: 'UNRESOLVED',
        evidenceId: 'ev-2',
        stage: 'CAREER',
        provenanceStage: 'CAREER_QUALIFICATION',
        referenceKind: 'EVIDENCE'
      },
      {
        ruleId: 'rule-2',
        source: 'WEALTH',
        level: 'AD',
        stage: 'WEALTH',
        provenanceStage: 'WEALTH_DASHA_RULE',
        referenceKind: 'RULE'
      }
    ],
    missingInputs: [
      {
        domain: 'CAREER',
        code: 'MISSING_INPUT_1',
        description: 'Missing input 1'
      },
      {
        domain: 'WEALTH',
        code: 'MISSING_INPUT_2',
        description: 'Missing input 2'
      }
    ],
    provenance: {
      career: {
        status: 'PRESENT',
        version: 'PBA-04-v1',
        qualificationBasis: 'CANONICAL_STATUS'
      },
      wealth: {
        status: 'PRESENT',
        version: 'PBA-05-v1'
      }
    }
  };

  it('computes qualificationStatus from career.qualificationBasis', () => {
    const result = mapSelectedPeriodSynthesis(mockSynthesisValue);

    // CANONICAL_STATUS should map to CANONICAL
    expect(result.qualificationStatus).toBe('CANONICAL');
  });

  it('computes PROVISIONAL qualificationStatus for PROXY_DIRECTION', () => {
    const mockWithProxy: SelectedPeriodSynthesisValue<any, any> = {
      ...mockSynthesisValue,
      career: {
        ...mockSynthesisValue.career,
        qualificationBasis: 'PROXY_DIRECTION'
      }
    };

    const result = mapSelectedPeriodSynthesis(mockWithProxy);

    // PROXY_DIRECTION should map to PROVISIONAL
    expect(result.qualificationStatus).toBe('PROVISIONAL');
  });

  it('computes UNAVAILABLE qualificationStatus for UNAVAILABLE basis', () => {
    const mockWithUnavailable: SelectedPeriodSynthesisValue<any, any> = {
      ...mockSynthesisValue,
      career: {
        ...mockSynthesisValue.career,
        qualificationBasis: 'UNAVAILABLE'
      }
    };

    const result = mapSelectedPeriodSynthesis(mockWithUnavailable);

    // UNAVAILABLE should remain unavailable in the product projection
    expect(result.qualificationStatus).toBe('UNAVAILABLE');
  });

  it('preserves all ID/provenance fields verbatim', () => {
    const result = mapSelectedPeriodSynthesis(mockSynthesisValue);

    expect(result.period.selectedPeriodId).toBe('period-123');
    expect(result.period.mahadashaId).toBe('md-456');
    expect(result.period.antardashaId).toBe('ad-789');
    expect(result.evidence[0].evidenceId).toBe('ev-1');
    expect(result.evidence[0].identityKey).toBe('key-1');
    expect(result.evidence[0].ruleId).toBe('rule-1');
  });

  it('preserves all diagnostics verbatim', () => {
    const result = mapSelectedPeriodSynthesis(mockSynthesisValue);

    expect(result.career.diagnostics).toHaveLength(1);
    expect(result.career.diagnostics[0].code).toBe('CAREER_OK');
    expect(result.career.diagnostics[0].message).toBe('Career analysis OK');

    expect(result.career.expressions[0].diagnostics).toHaveLength(1);
    expect(result.career.expressions[0].diagnostics[0].code).toBe('NO_DIAGNOSTIC');
  });

  it('preserves missing inputs verbatim', () => {
    const result = mapSelectedPeriodSynthesis(mockSynthesisValue);

    expect(result.missingInputs).toHaveLength(2);
    expect(result.missingInputs[0].domain).toBe('CAREER');
    expect(result.missingInputs[0].code).toBe('MISSING_INPUT_1');
    expect(result.missingInputs[1].domain).toBe('WEALTH');
    expect(result.missingInputs[1].code).toBe('MISSING_INPUT_2');
  });

  it('preserves deterministic array order', () => {
    const result = mapSelectedPeriodSynthesis(mockSynthesisValue);

    // Arrays should be frozen and maintain order
    expect(Object.isFrozen(result.evidence)).toBe(true);
    expect(Object.isFrozen(result.missingInputs)).toBe(true);
    expect(Object.isFrozen(result.career.expressions)).toBe(true);
  });

  it('preserves temporalRelation from domain synthesis (mapper does not recompute)', () => {
    // The mapper is a pure projection layer - it does not recompute temporalRelation
    // The domain synthesis layer (selectedPeriodSynthesis) computes temporalRelation
    // This test verifies the mapper preserves whatever the domain provides
    const mockWithDifferentRelation: SelectedPeriodSynthesisValue<any, any> = {
      ...mockSynthesisValue,
      period: {
        ...mockSynthesisValue.period,
        temporalRelation: 'PAST'
      }
    };

    const result = mapSelectedPeriodSynthesis(mockWithDifferentRelation);

    // The mapper should preserve the temporalRelation from the domain layer
    expect(result.period.temporalRelation).toBe('PAST');
  });

  it('no ID regeneration', () => {
    const result = mapSelectedPeriodSynthesis(mockSynthesisValue);

    // All IDs should be preserved verbatim
    expect(result.period.selectedPeriodId).toBe(mockSynthesisValue.period.selectedPeriodId);
    expect(result.evidence[0].evidenceId).toBe(mockSynthesisValue.evidence[0].evidenceId);
  });

  it('no dropping UNRESOLVED refs', () => {
    const result = mapSelectedPeriodSynthesis(mockSynthesisValue);

    // UNRESOLVED refs should be preserved
    const unresolvedRef = result.evidence.find(e => e.evidenceId === 'ev-2');
    expect(unresolvedRef).toBeDefined();
    expect(unresolvedRef?.classification).toBe('UNRESOLVED');
  });

  it('no flattening RULE refs into evidence', () => {
    const result = mapSelectedPeriodSynthesis(mockSynthesisValue);

    // RULE refs should have referenceKind: 'RULE' and no classification/polarity
    const ruleRef = result.evidence.find(e => e.ruleId === 'rule-2');
    expect(ruleRef).toBeDefined();
    expect(ruleRef?.referenceKind).toBe('RULE');
    expect(ruleRef?.classification).toBeUndefined();
    expect(ruleRef?.polarity).toBeUndefined();
  });

  it('preserves all four wealth dimensions with dataStatus', () => {
    const result = mapSelectedPeriodSynthesis(mockSynthesisValue);

    expect(result.wealth.dimensions.ACCUMULATION.dimension).toBe('ACCUMULATION');
    expect(result.wealth.dimensions.ACCUMULATION.dataStatus).toBe('COMPLETE');
    expect(result.wealth.dimensions.GAINS.dataStatus).toBe('PARTIAL');
    expect(result.wealth.dimensions.FORTUNE.dataStatus).toBe('INSUFFICIENT_DATA');
    expect(result.wealth.dimensions.SPECULATION.dataStatus).toBe('COMPLETE');
  });

  it('preserves promiseEvidenceIds and dashaRuleReferences in wealth dimensions', () => {
    const result = mapSelectedPeriodSynthesis(mockSynthesisValue);

    expect(result.wealth.dimensions.ACCUMULATION.promiseEvidenceIds).toEqual(['promise-1']);
    expect(result.wealth.dimensions.ACCUMULATION.dashaRuleReferences).toEqual([
      { ruleId: 'rule-1', source: 'DASHA', level: 'MD' },
      { ruleId: 'rule-2', source: 'DASHA', level: 'AD' }
    ]);
    expect(result.wealth.dimensions.GAINS.promiseEvidenceIds).toEqual(['promise-2']);
    expect(result.wealth.dimensions.GAINS.dashaRuleReferences).toEqual([]);
    expect(result.wealth.dimensions.FORTUNE.promiseEvidenceIds).toEqual([]);
    expect(result.wealth.dimensions.FORTUNE.dashaRuleReferences).toEqual([]);
    expect(result.wealth.dimensions.SPECULATION.promiseEvidenceIds).toEqual(['promise-3']);
    expect(result.wealth.dimensions.SPECULATION.dashaRuleReferences).toEqual([]);
  });

  it('preserves career expression row with full traceability', () => {
    const result = mapSelectedPeriodSynthesis(mockSynthesisValue);

    const expr = result.career.expressions[0];
    expect(expr.expressionRefKey).toBe('expr-1');
    expect(expr.expressionEvidenceIds).toEqual(['ev-1', 'ev-2']);
    expect(expr.qualifiedEvidenceIds).toEqual(['ev-1']);
    expect(expr.unqualifiedEvidenceIds).toEqual(['ev-2']);
    expect(expr.mdDashaEvidenceIds).toEqual(['md-ev-1']);
    expect(expr.adDashaEvidenceIds).toEqual(['ad-ev-1']);
    expect(expr.expressionSource).toBe('CALLER');
  });

  it('preserves provenance verbatim', () => {
    const result = mapSelectedPeriodSynthesis(mockSynthesisValue);

    expect(result.provenance.career.status).toBe('PRESENT');
    expect(result.provenance.career.version).toBe('PBA-04-v1');
    expect(result.provenance.career.qualificationBasis).toBe('CANONICAL_STATUS');
    expect(result.provenance.wealth.status).toBe('PRESENT');
    expect(result.provenance.wealth.version).toBe('PBA-05-v1');
  });

  it('includes qualificationStatus field', () => {
    const result = mapSelectedPeriodSynthesis(mockSynthesisValue);

    expect(result.qualificationStatus).toBeDefined();
    expect(['CANONICAL', 'PROVISIONAL', 'UNAVAILABLE']).toContain(result.qualificationStatus);
  });

  it('returns synthesisVersion PBA-06-v1', () => {
    const result = mapSelectedPeriodSynthesis(mockSynthesisValue);

    expect(result.synthesisVersion).toBe('PBA-06-v1');
  });

  describe('PBA-10: Test-only validation - strict preservation', () => {
    it('preserves evidence IDs verbatim', () => {
      const result = mapSelectedPeriodSynthesis(mockSynthesisValue);

      const evidenceIds = result.evidence.filter((e) => e.referenceKind === 'EVIDENCE').map((e) => e.evidenceId);
      const inputIds = mockSynthesisValue.evidence.filter((e) => e.referenceKind === 'EVIDENCE').map((e) => e.evidenceId);

      expect(evidenceIds).toEqual(inputIds);
    });

    it('preserves identityKey fields verbatim', () => {
      const result = mapSelectedPeriodSynthesis(mockSynthesisValue);

      const identityKeys = result.evidence.map((e) => e.identityKey);
      const inputKeys = mockSynthesisValue.evidence.map((e) => e.identityKey);

      expect(identityKeys).toEqual(inputKeys);
    });

    it('preserves classifications verbatim', () => {
      const result = mapSelectedPeriodSynthesis(mockSynthesisValue);

      const classifications = result.evidence.map((e) => e.classification);
      const inputClassifications = mockSynthesisValue.evidence.map((e) => e.classification);

      expect(classifications).toEqual(inputClassifications);
    });

    it('preserves provenanceStage verbatim', () => {
      const result = mapSelectedPeriodSynthesis(mockSynthesisValue);

      const provenanceStages = result.evidence.map((e) => e.provenanceStage);
      const inputStages = mockSynthesisValue.evidence.map((e) => e.provenanceStage);

      expect(provenanceStages).toEqual(inputStages);
    });

    it('preserves missingInputs verbatim', () => {
      const result = mapSelectedPeriodSynthesis(mockSynthesisValue);

      expect(result.missingInputs).toEqual(mockSynthesisValue.missingInputs);
    });

    it('preserves diagnostics verbatim', () => {
      const result = mapSelectedPeriodSynthesis(mockSynthesisValue);

      expect(result.career.diagnostics).toEqual(mockSynthesisValue.career.diagnostics);
      expect(result.wealth.diagnostics).toEqual(mockSynthesisValue.wealth.diagnostics);
    });

    it('preserves baseline unchanged marker verbatim', () => {
      const result = mapSelectedPeriodSynthesis(mockSynthesisValue);

      expect(result.natalBaseline.career?.unchanged).toBe(true);
      expect(result.natalBaseline.wealth?.unchanged).toBe(true);
    });

    it('UNRESOLVED refs keep their kind', () => {
      const result = mapSelectedPeriodSynthesis(mockSynthesisValue);

      const unresolvedRef = result.evidence.find((e) => e.evidenceId === 'ev-2');
      expect(unresolvedRef).toBeDefined();
      expect(unresolvedRef?.classification).toBe('UNRESOLVED');
      expect(unresolvedRef?.referenceKind).toBe('EVIDENCE');
    });

    it('RULE refs keep their kind', () => {
      const result = mapSelectedPeriodSynthesis(mockSynthesisValue);

      const ruleRef = result.evidence.find((e) => e.ruleId === 'rule-2');
      expect(ruleRef).toBeDefined();
      expect(ruleRef?.referenceKind).toBe('RULE');
      expect(ruleRef?.classification).toBeUndefined();
      expect(ruleRef?.evidenceId).toBeUndefined();
    });
  });
});

describe('mapDashaPeriodOptions (Finding 4: shared interval validation)', () => {
  it('returns UNKNOWN for parseable-but-inverted intervals', () => {
    // Test with a parseable interval where start is after end (inverted)
    const selectablePeriods: import('../../core/analysis/selectedMdAdPeriod').SelectablePeriodsResult = {
      mahadashas: [
        {
          id: 'md-1',
          planet: 'SATURN' as any,
          start: '2027-01-01T00:00:00Z', // After end (inverted)
          end: '2025-01-01T00:00:00Z',
          valid: false,
          diagnostics: ['INVALID_MAHADASHA_INTERVAL']
        }
      ],
      antardashas: [],
      diagnostics: ['INVALID_MAHADASHA_INTERVAL']
    };

    const result = mapDashaPeriodOptions(selectablePeriods, '2026-01-01T00:00:00Z');

    // The mapper should return UNKNOWN for inverted intervals (not PAST/CURRENT/FUTURE)
    expect(result.mahadashas[0].temporalRelation).toBe('UNKNOWN');
  });
});
