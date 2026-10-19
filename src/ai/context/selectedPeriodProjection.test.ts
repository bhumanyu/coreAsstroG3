/**
 * Tests for selected-period AI context projection (PBA-06 → AI context)
 *
 * Tests parity, immutability, and routing for projectSelectedPeriodSynthesis.
 */

import { describe, it, expect } from 'vitest';
import { projectSelectedPeriodSynthesis } from './aiContextFactory';
import type { SelectedPeriodSynthesisValue } from '../../domain/synthesis/selectedPeriodSynthesis';
import type { CareerConclusionData } from '../../domain/career/careerTypes';
import type { WealthConclusionData } from '../../domain/wealth/wealthTypes';

describe('projectSelectedPeriodSynthesis (PBA-06 → AI context)', () => {
  /**
   * Canonical fixture based on PBA-06 golden test.
   * Includes unresolved promiseEvidenceIds to test parity preservation.
   */
  const canonicalSynthesis: SelectedPeriodSynthesisValue<CareerConclusionData, WealthConclusionData> = {
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
        baseline: {} as CareerConclusionData,
        unchanged: true
      },
      wealth: {
        baseline: {} as WealthConclusionData,
        unchanged: true
      }
    },
    career: {
      qualificationBasis: 'CANONICAL_STATUS',
      expressions: [
        {
          expressionRefKey: 'EMPLOYMENT:SUPPORT:evid1',
          status: 'ACTIVATES',
          linkedLevels: ['MD', 'AD'],
          qualificationBasis: 'CANONICAL_STATUS',
          matchBasis: 'UNAMBIGUOUS',
          diagnostics: [
            {
              code: 'EXPRESSION_OK',
              message: 'Expression activation OK'
            }
          ],
          expressionEvidenceIds: ['expr-evid-1', 'expr-evid-2'],
          qualifiedEvidenceIds: ['expr-evid-1'],
          unqualifiedEvidenceIds: ['expr-evid-2'],
          mdDashaEvidenceIds: ['md-evid-1'],
          adDashaEvidenceIds: ['ad-evid-1'],
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
          linkedLevels: ['MD', 'AD'],
          diagnostics: [],
          promiseEvidenceIds: ['promise-1', 'unresolved-promise'],
          dashaRuleReferences: [
            { ruleId: 'rule-1', source: 'DASHA', level: 'MD' },
            { ruleId: 'rule-2', source: 'DASHA', level: 'AD' }
          ]
        },
        GAINS: {
          dimension: 'GAINS',
          effect: 'PARTIALLY_ACTIVATES',
          dataStatus: 'PARTIAL',
          linkedLevels: ['MD'],
          diagnostics: [],
          promiseEvidenceIds: ['promise-2'],
          dashaRuleReferences: []
        },
        FORTUNE: {
          dimension: 'FORTUNE',
          effect: 'INSUFFICIENT_DATA',
          dataStatus: 'INSUFFICIENT_DATA',
          linkedLevels: [],
          diagnostics: [],
          promiseEvidenceIds: [],
          dashaRuleReferences: []
        },
        SPECULATION: {
          dimension: 'SPECULATION',
          effect: 'CHALLENGES',
          dataStatus: 'COMPLETE',
          linkedLevels: ['AD'],
          diagnostics: [],
          promiseEvidenceIds: ['promise-3'],
          dashaRuleReferences: []
        }
      },
      diagnostics: [
        {
          code: 'WEALTH_OK',
          message: 'Wealth analysis OK'
        }
      ]
    },
    evidence: [
      {
        classification: 'SUPPORTING',
        evidenceId: 'expr-evid-1',
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
        evidenceId: 'unresolved-promise',
        identityKey: undefined,
        dimension: 'ACCUMULATION',
        polarity: undefined,
        source: undefined,
        ruleId: undefined,
        level: undefined,
        stage: 'WEALTH',
        provenanceStage: 'WEALTH_NATAL_PROMISE',
        referenceKind: 'EVIDENCE'
      }
    ],
    missingInputs: [
      {
        domain: 'CAREER',
        code: 'MISSING_INPUT_1',
        description: 'Missing career input'
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

  describe('parity preservation', () => {
    it('preserves promiseEvidenceIds verbatim including unresolved IDs', () => {
      const result = projectSelectedPeriodSynthesis(canonicalSynthesis);

      expect(result.wealth.dimensions.ACCUMULATION.promiseEvidenceIds).toEqual([
        'promise-1',
        'unresolved-promise'
      ]);
      expect(result.wealth.dimensions.GAINS.promiseEvidenceIds).toEqual(['promise-2']);
      expect(result.wealth.dimensions.FORTUNE.promiseEvidenceIds).toEqual([]);
      expect(result.wealth.dimensions.SPECULATION.promiseEvidenceIds).toEqual(['promise-3']);
    });

    it('preserves dashaRuleReferences verbatim', () => {
      const result = projectSelectedPeriodSynthesis(canonicalSynthesis);

      expect(result.wealth.dimensions.ACCUMULATION.dashaRuleReferences).toEqual([
        { ruleId: 'rule-1', source: 'DASHA', level: 'MD' },
        { ruleId: 'rule-2', source: 'DASHA', level: 'AD' }
      ]);
      expect(result.wealth.dimensions.GAINS.dashaRuleReferences).toEqual([]);
      expect(result.wealth.dimensions.FORTUNE.dashaRuleReferences).toEqual([]);
      expect(result.wealth.dimensions.SPECULATION.dashaRuleReferences).toEqual([]);
    });

    it('preserves all projected fields verbatim', () => {
      const result = projectSelectedPeriodSynthesis(canonicalSynthesis);

      expect(result.selectedPeriodId).toBe('period-123');
      expect(result.mahadashaId).toBe('md-456');
      expect(result.mahadashaPlanet).toBe('SATURN');
      expect(result.antardashaId).toBe('ad-789');
      expect(result.antardashaPlanet).toBe('JUPITER');
      expect(result.interval).toEqual(canonicalSynthesis.period.interval);
      expect(result.analysisAsOf).toBe('2026-01-01T00:00:00Z');
      expect(result.temporalRelation).toBe('CURRENT');
    });

    it('preserves career expressions with full traceability', () => {
      const result = projectSelectedPeriodSynthesis(canonicalSynthesis);

      expect(result.career.expressions).toHaveLength(1);
      const expr = result.career.expressions[0];
      expect(expr.expressionRefKey).toBe('EMPLOYMENT:SUPPORT:evid1');
      expect(expr.status).toBe('ACTIVATES');
      expect(expr.linkedLevels).toEqual(['MD', 'AD']);
      expect(expr.qualificationBasis).toBe('CANONICAL_STATUS');
      expect(expr.expressionEvidenceIds).toEqual(['expr-evid-1', 'expr-evid-2']);
      expect(expr.qualifiedEvidenceIds).toEqual(['expr-evid-1']);
      expect(expr.unqualifiedEvidenceIds).toEqual(['expr-evid-2']);
      expect(expr.mdDashaEvidenceIds).toEqual(['md-evid-1']);
      expect(expr.adDashaEvidenceIds).toEqual(['ad-evid-1']);
    });

    it('preserves evidence references verbatim', () => {
      const result = projectSelectedPeriodSynthesis(canonicalSynthesis);

      expect(result.evidence).toHaveLength(2);
      expect(result.evidence[0].evidenceId).toBe('expr-evid-1');
      expect(result.evidence[0].classification).toBe('SUPPORTING');
      expect(result.evidence[1].evidenceId).toBe('unresolved-promise');
      expect(result.evidence[1].classification).toBe('UNRESOLVED');
    });

    it('dedupes diagnostics by code', () => {
      const synthesisWithDupeDiagnostics: SelectedPeriodSynthesisValue<CareerConclusionData, WealthConclusionData> = {
        ...canonicalSynthesis,
        career: {
          ...canonicalSynthesis.career,
          diagnostics: [
            { code: 'DUPE_CODE', message: 'Career message' },
            { code: 'UNIQUE_CAREER', message: 'Unique career' }
          ]
        },
        wealth: {
          ...canonicalSynthesis.wealth,
          diagnostics: [
            { code: 'DUPE_CODE', message: 'Wealth message' },
            { code: 'UNIQUE_WEALTH', message: 'Unique wealth' }
          ]
        }
      };

      const result = projectSelectedPeriodSynthesis(synthesisWithDupeDiagnostics);

      expect(result.diagnostics).toHaveLength(3);
      expect(result.diagnostics.map(d => d.code)).toEqual(['DUPE_CODE', 'UNIQUE_CAREER', 'UNIQUE_WEALTH']);
      // Wealth message should win (last one in map)
      const dupeDiag = result.diagnostics.find((d: { code: string; message: string }) => d.code === 'DUPE_CODE');
      expect(dupeDiag?.message).toBe('Wealth message');
    });
  });

  describe('immutability', () => {
    it('does not mutate input value', () => {
      const input = JSON.parse(JSON.stringify(canonicalSynthesis));
      const originalJSON = JSON.stringify(input);

      projectSelectedPeriodSynthesis(input);

      expect(JSON.stringify(input)).toBe(originalJSON);
    });

    it('does not mutate nested arrays', () => {
      const input = JSON.parse(JSON.stringify(canonicalSynthesis));
      const originalExpressionIds = [...input.career.expressions[0].expressionEvidenceIds];
      const originalPromiseIds = [...input.wealth.dimensions.ACCUMULATION.promiseEvidenceIds];

      projectSelectedPeriodSynthesis(input);

      expect(input.career.expressions[0].expressionEvidenceIds).toEqual(originalExpressionIds);
      expect(input.wealth.dimensions.ACCUMULATION.promiseEvidenceIds).toEqual(originalPromiseIds);
    });

    it('produces frozen output', () => {
      const result = projectSelectedPeriodSynthesis(canonicalSynthesis);

      expect(Object.isFrozen(result)).toBe(true);
      expect(Object.isFrozen(result.career)).toBe(true);
      expect(Object.isFrozen(result.wealth)).toBe(true);
      expect(Object.isFrozen(result.evidence)).toBe(true);
      expect(Object.isFrozen(result.career.expressions)).toBe(true);
      expect(Object.isFrozen(result.wealth.dimensions)).toBe(true);
    });

    it('repeat calls are deterministic', () => {
      const result1 = projectSelectedPeriodSynthesis(canonicalSynthesis);
      const result2 = projectSelectedPeriodSynthesis(canonicalSynthesis);

      expect(result1).toEqual(result2);
    });
  });

  describe('routing capability', () => {
    it('produces valid AI context structure', () => {
      const result = projectSelectedPeriodSynthesis(canonicalSynthesis);

      expect(result).toHaveProperty('selectedPeriodId');
      expect(result).toHaveProperty('mahadashaId');
      expect(result).toHaveProperty('antardashaId');
      expect(result).toHaveProperty('career');
      expect(result).toHaveProperty('wealth');
      expect(result).toHaveProperty('evidence');
      expect(result).toHaveProperty('diagnostics');
    });

    it('handles missing selectedPeriod gracefully', () => {
      const emptySynthesis: SelectedPeriodSynthesisValue<CareerConclusionData, WealthConclusionData> = {
        ...canonicalSynthesis,
        wealth: {
          ...canonicalSynthesis.wealth,
          dimensions: {
            ACCUMULATION: {
              dimension: 'ACCUMULATION',
              effect: 'INSUFFICIENT_DATA',
              dataStatus: 'INSUFFICIENT_DATA',
              linkedLevels: [],
              diagnostics: [],
              promiseEvidenceIds: [],
              dashaRuleReferences: []
            },
            GAINS: {
              dimension: 'GAINS',
              effect: 'INSUFFICIENT_DATA',
              dataStatus: 'INSUFFICIENT_DATA',
              linkedLevels: [],
              diagnostics: [],
              promiseEvidenceIds: [],
              dashaRuleReferences: []
            },
            FORTUNE: {
              dimension: 'FORTUNE',
              effect: 'INSUFFICIENT_DATA',
              dataStatus: 'INSUFFICIENT_DATA',
              linkedLevels: [],
              diagnostics: [],
              promiseEvidenceIds: [],
              dashaRuleReferences: []
            },
            SPECULATION: {
              dimension: 'SPECULATION',
              effect: 'INSUFFICIENT_DATA',
              dataStatus: 'INSUFFICIENT_DATA',
              linkedLevels: [],
              diagnostics: [],
              promiseEvidenceIds: [],
              dashaRuleReferences: []
            }
          }
        }
      };

      const result = projectSelectedPeriodSynthesis(emptySynthesis);

      expect(result).toBeDefined();
      expect(result.wealth.dimensions.ACCUMULATION.effect).toBe('INSUFFICIENT_DATA');
      expect(result.wealth.dimensions.ACCUMULATION.promiseEvidenceIds).toEqual([]);
      expect(result.wealth.dimensions.ACCUMULATION.dashaRuleReferences).toEqual([]);
    });
  });
});
