import { describe, expect, it } from 'vitest';
import { createDomainEvidence } from '../interpretation/DomainEvidence';
import { buildWealthLifecycleAnalysis } from './wealthLifecycleTypes';
import type { WealthPeriodTimingActivation } from './wealthTypes';

describe('Wealth lifecycle source intervals', () => {
  it('reports release gating as BLOCKED even when natal and Dasha evidence exist', () => {
    const result = buildWealthLifecycleAnalysis({ evidence, periodTimingActivations: [{
      period: 'MD',
      interval: { start: '2026-01-01', end: '2027-01-01' },
      dimensions: { accumulation: 'ACTIVATES', gains: 'INSUFFICIENT_DATA', fortune: 'INSUFFICIENT_DATA', speculation: 'INSUFFICIENT_DATA' },
      evidenceIds: ['MD_ACTIVATION']
    }], cw05 });

    expect(result.status).toBe('BLOCKED');
    expect(result.candidateWindows).toHaveLength(0);
    expect(result.taxonomy.every(rule => rule.validationStatus === 'UNVALIDATED' && !rule.releaseEnabled)).toBe(true);
    expect(result.diagnostics.some(item => item.code === 'UNVALIDATED_EVENT_RULES')).toBe(true);
    expect(result.finalAuthority).toBe('CW-05');
  });

  const evidence = [
    createDomainEvidence({
      id: 'NATAL_ACCUMULATION',
      sourceType: 'HOUSE',
      domain: 'WEALTH',
      phase: 'NATAL_PROMISE',
      source: 'D1',
      dimension: 'ACCUMULATION',
      polarity: 'SUPPORTING',
      ruleId: 'WEALTH_NATAL_001',
      identityKey: 'NATAL_ACCUMULATION'
    }),
    createDomainEvidence({
      id: 'MD_ACTIVATION',
      sourceType: 'DASHA',
      domain: 'WEALTH',
      phase: 'DASHA_ACTIVATION',
      source: 'DASHA',
      timing: { period: 'MD' },
      polarity: 'SUPPORTING',
      relatedEvidenceIds: ['NATAL_ACCUMULATION']
    })
  ];

  const cw05 = {
    reasoningVersion: 'CW-05' as const,
    domain: 'WEALTH' as const,
    finalStatus: 'SUPPORTED',
    natalEvidenceIds: ['NATAL_ACCUMULATION'],
    ruleIds: ['CW-05-WEALTH-SYNTHESIS']
  };

  it('does not report an invalid interval when the source timing is unavailable', () => {
    const periodTimingActivations: readonly WealthPeriodTimingActivation[] = [{
      period: 'MD',
      dimensions: {
        accumulation: 'ACTIVATES',
        gains: 'INSUFFICIENT_DATA',
        fortune: 'INSUFFICIENT_DATA',
        speculation: 'INSUFFICIENT_DATA'
      },
      evidenceIds: ['MD_ACTIVATION']
    }];

    const result = buildWealthLifecycleAnalysis({ evidence, periodTimingActivations, cw05 });

    expect(result.diagnostics.some((item) => item.code === 'INVALID_PERIOD_INTERVAL')).toBe(false);
  });

  it('validates source timestamps without converting or fabricating dates', () => {
    const periodTimingActivations: readonly WealthPeriodTimingActivation[] = [{
      period: 'MD',
      interval: {
        start: '2025-01-01T00:00:00.000Z',
        end: '2026-01-01T00:00:00.000Z'
      },
      dimensions: {
        accumulation: 'ACTIVATES',
        gains: 'INSUFFICIENT_DATA',
        fortune: 'INSUFFICIENT_DATA',
        speculation: 'INSUFFICIENT_DATA'
      },
      evidenceIds: ['MD_ACTIVATION']
    }];

    const result = buildWealthLifecycleAnalysis({ evidence, periodTimingActivations, cw05 });

    expect(result.diagnostics.some((item) => item.code === 'INVALID_PERIOD_INTERVAL')).toBe(false);
  });

  it('still reports malformed source intervals', () => {
    const periodTimingActivations: readonly WealthPeriodTimingActivation[] = [{
      period: 'MD',
      interval: {
        start: '2026-02-31T00:00:00.000Z',
        end: '2026-01-01T00:00:00.000Z'
      },
      dimensions: {
        accumulation: 'ACTIVATES',
        gains: 'INSUFFICIENT_DATA',
        fortune: 'INSUFFICIENT_DATA',
        speculation: 'INSUFFICIENT_DATA'
      },
      evidenceIds: ['MD_ACTIVATION']
    }];

    const result = buildWealthLifecycleAnalysis({ evidence, periodTimingActivations, cw05 });

    expect(result.diagnostics.some((item) => item.code === 'INVALID_PERIOD_INTERVAL')).toBe(true);
  });

  it('retains the missing CW-05 authority diagnostic', () => {
    const result = buildWealthLifecycleAnalysis({ evidence });

    expect(result.diagnostics.some((item) => item.code === 'MISSING_CW05_AUTHORITY')).toBe(true);
  });
});
