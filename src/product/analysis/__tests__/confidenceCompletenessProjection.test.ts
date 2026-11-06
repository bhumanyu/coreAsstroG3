import { describe, expect, it } from 'vitest';
import { createProductAnalysis } from './testHelpers';
import { selectUnifiedConfidenceProjection } from '../confidenceCompletenessProjection';
import { selectCareerViewModel } from '../careerViewModel';
import { selectWealthViewModel } from '../wealthViewModel';
import { selectOverviewViewModel } from '../overviewViewModel';

describe('D01 unified confidence and completeness projection', () => {
  it('preserves C11 and CW-05 domain confidence independently of conclusion status', () => {
    const analysis = createProductAnalysis({
      career: {
        ...createProductAnalysis().career,
        status: 'CHALLENGED',
        promise: { ...createProductAnalysis().career.promise, confidence: 'HIGH' }
      },
      wealth: {
        ...createProductAnalysis().wealth,
        overall: { ...createProductAnalysis().wealth.overall, status: 'CHALLENGED', confidence: 'LOW' }
      }
    });
    const projection = selectUnifiedConfidenceProjection(analysis);
    expect(projection.domains.CAREER.confidence).toBe('HIGH');
    expect(projection.domains.CAREER.owner).toBe('C11');
    expect(projection.domains.WEALTH.confidence).toBe('LOW');
    expect(projection.domains.WEALTH.owner).toBe('CW-05');
    expect(analysis.career.status).toBe('CHALLENGED');
    expect(analysis.wealth.overall.status).toBe('CHALLENGED');
  });

  it('maps available required layers to COMPLETE without a new confidence calculation', () => {
    const projection = selectUnifiedConfidenceProjection(createProductAnalysis());
    expect(projection.domains.CAREER.coverage).toBe('COMPLETE');
    expect(projection.domains.WEALTH.coverage).toBe('COMPLETE');
    expect(projection.domains.CAREER.confidence).toBe('HIGH');
    expect(projection.domains.WEALTH.confidence).toBe('HIGH');
  });

  it('maps partial required layer availability without changing domain confidence', () => {
    const base = createProductAnalysis();
    const analysis = {
      ...base,
      career: {
        ...base.career,
        activation: {
          ...base.career.activation,
          dasha: { status: 'PARTIAL' as const, periods: [] }
        }
      },
      wealth: {
        ...base.wealth,
        activation: {
          ...base.wealth.activation,
          dasha: { status: 'PARTIAL' as const, periods: [] }
        }
      }
    };
    const projection = selectUnifiedConfidenceProjection(analysis);
    expect(projection.domains.CAREER.coverage).toBe('PARTIAL');
    expect(projection.domains.WEALTH.coverage).toBe('PARTIAL');
    expect(projection.domains.CAREER.confidence).toBe('HIGH');
    expect(projection.domains.WEALTH.confidence).toBe('HIGH');
  });

  it('preserves unavailable layers and explicitly reports D2 unavailable', () => {
    const base = createProductAnalysis();
    const analysis = {
      ...base,
      career: {
        ...base.career,
        evidence: [],
        activation: {
          ...base.career.activation,
          dasha: { status: 'UNAVAILABLE' as const, periods: [] }
        },
        d10: { relationship: 'UNAVAILABLE' as const }
      },
      wealth: {
        ...base.wealth,
        evidence: [],
        activation: {
          ...base.wealth.activation,
          dasha: { status: 'UNAVAILABLE' as const, periods: [] }
        },
        d2: { relationship: 'UNAVAILABLE' as const }
      }
    };
    const projection = selectUnifiedConfidenceProjection(analysis);
    expect(projection.domains.CAREER.coverage).toBe('UNAVAILABLE');
    expect(projection.domains.WEALTH.coverage).toBe('UNAVAILABLE');
    expect(projection.domains.WEALTH.layers.find(layer => layer.id === 'D2')).toMatchObject({
      state: 'UNAVAILABLE',
      required: false
    });
    expect(projection.unavailableLayers.some(layer => layer.domain === 'WEALTH' && layer.layer === 'D2')).toBe(true);
  });

  it('preserves supplied C11/CW-05 reasons, evidence, diagnostic severity and exact confidence', () => {
    const base = createProductAnalysis();
    const metadata = {
      confidence: 'LOW' as const,
      coverage: 'PARTIAL' as const,
      layers: [{ id: 'NATAL', state: 'AVAILABLE' as const, required: true, evidenceIds: ['e-1'] }],
      reasons: ['C11 source reason: evidence provenance is partial.'],
      diagnostics: [{ code: 'CONFLICT-01', severity: 'WARNING' as const, message: 'A supported and challenged factor conflict.', evidenceIds: ['e-1'], ruleIds: ['R-1'] }],
      evidenceIds: ['e-1'],
      ruleIds: ['R-1'],
      owner: 'C11' as const
    };
    const analysis = {
      ...base,
      confidenceMetadata: {
        career: metadata,
        wealth: {
          ...metadata,
          confidence: 'HIGH' as const,
          owner: 'CW-05' as const,
          layers: [...metadata.layers, { id: 'D2', state: 'UNAVAILABLE' as const, required: false }]
        }
      }
    };
    const projection = selectUnifiedConfidenceProjection(analysis);
    expect(projection.domains.CAREER).toMatchObject({
      confidence: 'LOW',
      coverage: 'PARTIAL',
      reasons: metadata.reasons,
      diagnostics: metadata.diagnostics,
      evidenceIds: ['e-1'],
      ruleIds: ['R-1'],
      owner: 'C11'
    });
    expect(projection.domains.WEALTH.confidence).toBe('HIGH');
    expect(projection.domains.WEALTH.reasons).toContain(metadata.reasons[0]);
    expect(projection.domains.WEALTH.reasons).toContain('D2 is intentionally unavailable and is not negative evidence.');
    expect(projection.diagnostics).toContainEqual(expect.objectContaining({
      domain: 'CAREER',
      code: 'CONFLICT-01',
      severity: 'WARNING'
    }));
  });

  it('projects error diagnostics to BLOCKED while leaving promise/status unchanged', () => {
    const analysis = createProductAnalysis({
      warnings: [{ code: 'CAREER-PRODUCER-FAILED', message: 'Career producer failed.', severity: 'ERROR', domain: 'CAREER' }]
    });
    const projection = selectUnifiedConfidenceProjection(analysis);
    expect(projection.domains.CAREER.coverage).toBe('BLOCKED');
    expect(projection.domains.CAREER.diagnostics[0]).toMatchObject({ severity: 'ERROR' });
    expect(analysis.career.status).toBe('SUPPORTED');
    expect(analysis.career.promise.confidence).toBe('HIGH');
  });

  it('exposes identical D01 contract in overview, Career and Wealth view models', () => {
    const analysis = createProductAnalysis();
    const expected = selectUnifiedConfidenceProjection(analysis);
    expect(selectOverviewViewModel(analysis).confidenceCompleteness).toEqual(expected);
    expect(selectCareerViewModel(analysis).confidenceCompleteness).toEqual(expected);
    expect(selectWealthViewModel(analysis).confidenceCompleteness).toEqual(expected);
  });

  it('does not introduce percentage/probability fields or a global confidence score', () => {
    const projection = selectUnifiedConfidenceProjection(createProductAnalysis());
    const serialized = JSON.stringify(projection);
    expect(serialized).not.toMatch(/percentage|probability|globalScore|overallScore/i);
    expect(projection).not.toHaveProperty('confidenceScore');
  });
});
