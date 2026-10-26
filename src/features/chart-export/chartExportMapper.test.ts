import { describe, expect, it } from 'vitest';
import { createProductAnalysis } from '../../product/analysis/__tests__/testHelpers';
import { ProductAnalysisService } from '../../product/analysis/productAnalysisService';
import type { ProductSelectedPeriodResult } from '../../product/analysis/productAnalysisTypes';
import { buildChartExport, buildExportedChartFacts, buildExportedInterpretation } from './chartExportMapper';
import { CANONICAL_BIRTH_DETAILS } from '../../test/fixtures/canonicalChart';

const period: Extract<ProductSelectedPeriodResult, { status: 'OK' }> = {
  status: 'OK',
  synthesis: {
    synthesisVersion: 'PBA-06-v1',
    period: {
      selectedPeriodId: 'md_jupiter:ad_saturn',
      mahadashaId: 'md_jupiter',
      mahadashaPlanet: 'Jupiter',
      antardashaId: 'ad_saturn',
      antardashaPlanet: 'Saturn',
      interval: { start: '2026-01-01T00:00:00Z', end: '2027-01-01T00:00:00Z' },
      analysisAsOf: '2026-01-15T08:30:00.000Z',
      temporalRelation: 'CURRENT'
    },
    natalBaseline: {},
    career: { qualificationBasis: 'CANONICAL_STATUS', expressions: [], diagnostics: [] },
    wealth: {
      dimensions: {
        ACCUMULATION: { dimension: 'ACCUMULATION', effect: 'UNKNOWN', dataStatus: 'INSUFFICIENT_DATA', linkedLevels: [], diagnostics: [], promiseEvidenceIds: [], dashaRuleReferences: [], insufficientReason: 'NO_PROMISE_EVIDENCE' },
        GAINS: { dimension: 'GAINS', effect: 'UNKNOWN', dataStatus: 'INSUFFICIENT_DATA', linkedLevels: [], diagnostics: [], promiseEvidenceIds: [], dashaRuleReferences: [], insufficientReason: 'NO_PROMISE_EVIDENCE' },
        FORTUNE: { dimension: 'FORTUNE', effect: 'UNKNOWN', dataStatus: 'INSUFFICIENT_DATA', linkedLevels: [], diagnostics: [], promiseEvidenceIds: [], dashaRuleReferences: [], insufficientReason: 'NO_PROMISE_EVIDENCE' },
        SPECULATION: { dimension: 'SPECULATION', effect: 'UNKNOWN', dataStatus: 'INSUFFICIENT_DATA', linkedLevels: [], diagnostics: [], promiseEvidenceIds: [], dashaRuleReferences: [], insufficientReason: 'NO_PROMISE_EVIDENCE' }
      },
      diagnostics: []
    },
    evidence: [],
    missingInputs: [],
    provenance: {
      career: { status: 'PRESENT' },
      wealth: { status: 'PRESENT' }
    },
    qualificationStatus: 'CANONICAL',
    aiExplanationStatus: 'NOT_REQUESTED'
  }
};

describe('chart export projection', () => {
  it('uses the passed aggregate provenance and selected period IDs exactly', () => {
    const analysis = createProductAnalysis({
      engineVersion: 'REAL_ENGINE_7',
      rulesVersion: 'REAL_RULES_5',
      selectedPeriod: period
    });
    const output = buildChartExport({ analysis, selectedPeriod: period }, '2026-10-26T00:00:00Z');
    expect(output.provenance).toMatchObject({
      analysisId: analysis.analysisId,
      asOf: analysis.asOf,
      engineVersion: analysis.engineVersion,
      rulesVersion: analysis.rulesVersion
    });
    expect(output.selectedPeriod).toMatchObject({
      status: 'AVAILABLE',
      value: { mahadashaId: 'md_jupiter', antardashaId: 'ad_saturn', analysisAsOf: analysis.asOf }
    });
  });

  it('projects birth inputs without names or place and preserves missing result states', () => {
    const baseAnalysis = createProductAnalysis({ status: 'PARTIAL' });
    const analysis = { ...baseAnalysis, chart: { isAvailable: true, ascendantSign: 'Capricorn' } };
    const exported = buildChartExport({ analysis }, '2026-10-26T00:00:00Z');
    expect(exported.birth).toEqual({
      dateTime: analysis.birth.dateTime,
      timezone: analysis.birth.timezone,
      latitude: analysis.birth.latitude,
      longitude: analysis.birth.longitude,
      ayanamsa: analysis.birth.ayanamsa
    });
    expect(JSON.stringify(exported)).not.toContain('Test Chart');
    expect(JSON.stringify(exported)).not.toContain('New Delhi');
    expect(exported.chartFacts.status).toBe('PARTIAL');
    expect(exported.selectedPeriod.status).toBe('UNAVAILABLE');
    expect(buildExportedChartFacts(createProductAnalysis({ chart: { isAvailable: false } })).status).toBe('UNAVAILABLE');
    expect(buildExportedInterpretation(createProductAnalysis({ status: 'ERROR' }))).toMatchObject({ status: 'UNAVAILABLE' });
  });

  it('refuses a selected period whose asOf does not belong to the supplied analysis', () => {
    const otherPeriod: Extract<ProductSelectedPeriodResult, { status: 'OK' }> = {
      ...period,
      synthesis: {
        ...period.synthesis,
        period: { ...period.synthesis.period, analysisAsOf: '2025-01-01T00:00:00Z' }
      }
    };
    expect(() => buildChartExport({ analysis: createProductAnalysis(), selectedPeriod: otherPeriod }, '2026-10-26T00:00:00Z'))
      .toThrow(/does not match/);
  });

  it('exports period-specific career, wealth, evidence, and missing-input content', () => {
    const firstAnalysis = createProductAnalysis();
    const secondAnalysis = createProductAnalysis();
    const first: Extract<ProductSelectedPeriodResult, { status: 'OK' }> = {
      ...period,
      synthesis: {
        ...period.synthesis,
        career: {
          qualificationBasis: 'CANONICAL_STATUS',
          expressions: [{
            expressionRefKey: 'career-expression-a',
            status: 'ACTIVATES',
            linkedLevels: ['MD'],
            qualificationBasis: 'CANONICAL_STATUS',
            diagnostics: [{ code: 'CAREER_A', message: 'First period career diagnostic.' }],
            expressionEvidenceIds: ['career-evidence-a'],
            qualifiedEvidenceIds: ['career-evidence-a'],
            unqualifiedEvidenceIds: [],
            mdDashaEvidenceIds: ['md-career-a'],
            adDashaEvidenceIds: [],
            expressionSource: 'CALLER'
          }],
          diagnostics: []
        },
        wealth: {
          ...period.synthesis.wealth,
          dimensions: {
            ...period.synthesis.wealth.dimensions,
            ACCUMULATION: {
              ...period.synthesis.wealth.dimensions.ACCUMULATION,
              effect: 'ACTIVATES',
              dataStatus: 'COMPLETE',
              linkedLevels: ['MD'],
              promiseEvidenceIds: ['wealth-promise-a'],
              dashaRuleReferences: [{ ruleId: 'RULE_A', source: 'DASHA', level: 'MD' }],
              insufficientReason: 'LINKED'
            }
          }
        },
        evidence: [{
          stage: 'CAREER',
          classification: 'SUPPORTING',
          evidenceId: 'career-evidence-a',
          provenanceStage: 'CAREER_ACTIVATION',
          referenceKind: 'EVIDENCE',
          level: 'MD'
        }],
        missingInputs: [{ domain: 'WEALTH', code: 'MISSING_A', description: 'First period missing input.' }]
      }
    };
    const second: Extract<ProductSelectedPeriodResult, { status: 'OK' }> = {
      ...first,
      synthesis: {
        ...first.synthesis,
        career: {
          qualificationBasis: 'UNAVAILABLE',
          expressions: [{
            expressionRefKey: 'career-expression-b',
            status: 'CHALLENGES',
            linkedLevels: ['AD'],
            qualificationBasis: 'UNAVAILABLE',
            diagnostics: [{ code: 'CAREER_B', message: 'Second period career diagnostic.' }],
            expressionEvidenceIds: ['career-evidence-b'],
            qualifiedEvidenceIds: [],
            unqualifiedEvidenceIds: ['career-evidence-b'],
            mdDashaEvidenceIds: [],
            adDashaEvidenceIds: ['ad-career-b'],
            expressionSource: 'ADAPTER_FALLBACK'
          }],
          diagnostics: []
        },
        wealth: {
          ...first.synthesis.wealth,
          dimensions: {
            ...first.synthesis.wealth.dimensions,
            ACCUMULATION: {
              ...first.synthesis.wealth.dimensions.ACCUMULATION,
              effect: 'CHALLENGES',
              dataStatus: 'PARTIAL',
              linkedLevels: ['AD'],
              promiseEvidenceIds: ['wealth-promise-b'],
              dashaRuleReferences: [{ ruleId: 'RULE_B', source: 'DASHA', level: 'AD' }],
              insufficientReason: 'PROMISE_NOT_LINKED'
            }
          }
        },
        evidence: [{
          stage: 'WEALTH',
          classification: 'CHALLENGING',
          evidenceId: 'wealth-evidence-b',
          dimension: 'ACCUMULATION',
          provenanceStage: 'WEALTH_DASHA_RULE',
          referenceKind: 'RULE',
          ruleId: 'RULE_B',
          level: 'AD'
        }],
        missingInputs: [{ domain: 'CAREER', code: 'MISSING_B', description: 'Second period missing input.' }],
        qualificationStatus: 'UNAVAILABLE'
      }
    };
    const firstExport = buildChartExport({ analysis: firstAnalysis, selectedPeriod: first }, firstAnalysis.asOf);
    const secondExport = buildChartExport({ analysis: secondAnalysis, selectedPeriod: second }, secondAnalysis.asOf);
    if (firstExport.selectedPeriod.status !== 'AVAILABLE' || secondExport.selectedPeriod.status !== 'AVAILABLE') {
      throw new Error('Expected both selected-period reports to be available.');
    }
    expect(firstExport.selectedPeriod.value.deterministicSynthesis)
      .not.toEqual(secondExport.selectedPeriod.value.deterministicSynthesis);
    expect(firstExport.selectedPeriod.value.deterministicSynthesis.career.expressions[0].status).toBe('ACTIVATES');
    expect(firstExport.selectedPeriod.value.deterministicSynthesis.wealth.dimensions.ACCUMULATION.effect).toBe('ACTIVATES');
    expect(secondExport.selectedPeriod.value.deterministicSynthesis.career.expressions[0].status).toBe('CHALLENGES');
    expect(secondExport.selectedPeriod.value.deterministicSynthesis.wealth.dimensions.ACCUMULATION.dataStatus).toBe('PARTIAL');
    expect(secondExport.selectedPeriod.value.deterministicSynthesis.wealth.dimensions.SPECULATION.dataStatus)
      .toBe('INSUFFICIENT_DATA');
    expect(secondExport.selectedPeriod.value.deterministicSynthesis.evidence[0].evidenceId).toBe('wealth-evidence-b');
    expect(secondExport.selectedPeriod.value.deterministicSynthesis.missingInputs[0].code).toBe('MISSING_B');
    expect(secondExport.selectedPeriod.value.deterministicSynthesis.qualificationStatus).toBe('UNAVAILABLE');
  });

  it('proves the actual selected-period service output retains the aggregate asOf', async () => {
    const service = new ProductAnalysisService();
    const run = await service.analyzeRun(CANONICAL_BIRTH_DETAILS, {
      asOf: '2026-01-01T00:00:00.000Z',
      includeAiExplanation: false
    });
    const mahadasha = run.analysis.dashPeriodOptions?.mahadashas.find((item) => item.valid);
    const antardasha = mahadasha?.antardashas.find((item) => item.valid);
    expect(mahadasha).toBeDefined();
    expect(antardasha).toBeDefined();
    if (!mahadasha || !antardasha) throw new Error('Canonical analysis did not expose a valid MD/AD selection.');
    const selected = await service.selectPeriodForRun(run.snapshot, mahadasha.id, antardasha.id, false);
    expect(selected.selectedPeriod?.status).toBe('OK');
    if (!selected.selectedPeriod || selected.selectedPeriod.status !== 'OK') {
      throw new Error('Canonical selected-period synthesis did not complete.');
    }
    const exported = buildChartExport({ analysis: selected, selectedPeriod: selected.selectedPeriod }, '2026-10-26T00:00:00Z');
    expect(exported.selectedPeriod.status).toBe('AVAILABLE');
    if (exported.selectedPeriod.status === 'AVAILABLE') {
      expect(exported.selectedPeriod.value.analysisAsOf).toBe(exported.provenance.asOf);
    }
  });
});
