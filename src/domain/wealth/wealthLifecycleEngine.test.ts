import { describe, expect, it } from 'vitest';
import { evaluateWealthLifecycle, WEALTH_LIFECYCLE_RULE_CATALOGUE } from './wealthLifecycleEngine';
import { createUnavailableWealthFinancialDataSet, createUserReportedFinancialDatum } from './wealthFinancialData';
import { createDomainEvidence } from '../interpretation/DomainEvidence';
import type { DomainEvidence } from '../interpretation/DomainEvidence';
import type { WealthLifecycleInput } from './wealthLifecycleTypes';
import type { WealthPeriodTimingActivation } from './wealthTypes';

function natal(id: string, polarity: 'SUPPORTING' | 'CHALLENGING' = 'SUPPORTING'): DomainEvidence {
  return createDomainEvidence({
    id, sourceType: 'STRUCTURAL', domain: 'WEALTH', role: 'PRIMARY', phase: 'NATAL_PROMISE', source: 'D1',
    statement: 'Test-only natal Wealth indication.', polarity, strength: 'STRONG', priority: 90,
    ruleId: 'WEALTH_TEST_NATAL_001', relatedEvidenceIds: [], evidenceFamily: 'SECOND_HOUSE', dimension: 'ACCUMULATION',
    house: 2, identityKey: 'WEALTH_NATAL_ACCUMULATION_ROOT'
  });
}
function dasha(id: string, polarity: 'SUPPORTING' | 'CHALLENGING', relatedEvidenceIds: readonly string[]): DomainEvidence {
  return createDomainEvidence({
    id, sourceType: 'DASHA', domain: 'WEALTH', role: 'TIMING', phase: 'DASHA_ACTIVATION', source: 'DASHA',
    statement: 'Test-only linked Dasha activation.', polarity, strength: 'MODERATE', priority: 50,
    ruleId: 'WEALTH_TEST_DASHA_001', relatedEvidenceIds, timing: { period: 'MD', level: 'MD' },
    evidenceFamily: 'DASHA', dimension: 'ACCUMULATION'
  });
}
function period(evidenceIds: readonly string[], start = '2027-01-01', end = '2028-01-01'): WealthPeriodTimingActivation {
  return { period: 'MD', dimensions: { accumulation: 'ACTIVATES', gains: 'INSUFFICIENT_DATA', fortune: 'INSUFFICIENT_DATA', speculation: 'INSUFFICIENT_DATA' }, evidenceIds, effect: 'ACTIVATES', activatedPromiseEvidenceIds: ['NATAL-1'], statement: 'Test period', interval: undefined as never } as unknown as WealthPeriodTimingActivation & { interval: {start:string;end:string} };
}
const cw05 = { reasoningVersion: 'CW-05' as const, domain: 'WEALTH' as const, finalStatus: 'STRONG', natalEvidenceIds: ['NATAL-1'], ruleIds: ['CW-05-WEALTH-SYNTHESIS'] };

describe('C04 Wealth lifecycle engine', () => {
  it('registers every proposed lifecycle category but enables none without approved event rules', () => {
    expect(WEALTH_LIFECYCLE_RULE_CATALOGUE.map(item => item.eventType)).toEqual([
      'ACCUMULATION','GAINS','ASSET_BUILDING_INDICATION','PRESERVATION','EROSION_CHALLENGE',
      'DEBT_EXPOSURE_INDICATION','DEBT_REPAYMENT_REDUCTION_INDICATION','LIQUIDITY_PRESSURE','LIQUIDITY_RELIEF','RECOVERY','INHERITANCE_INDICATION'
    ]);
    expect(WEALTH_LIFECYCLE_RULE_CATALOGUE.every(item => item.validationStatus === 'UNVALIDATED' && item.releaseEnabled === false)).toBe(true);
  });

  it('does not emit an event from Dasha evidence when no natal Wealth promise exists', () => {
    const input: WealthLifecycleInput = { evidence: [dasha('DASHA-ONLY','SUPPORTING',['NATAL-UNKNOWN'])], cw05, periodTimingActivations: [] };
    const result = evaluateWealthLifecycle(input);
    expect(result.candidateWindows).toHaveLength(0);
    expect(result.diagnostics.some(item => item.code === 'DASHA_ONLY_SUPPRESSED')).toBe(true);
    expect(result.actualFinancialEventsInferred).toBe(false);
  });

  it('keeps lifecycle candidates empty when natal promise exists but Dasha is missing', () => {
    const result = evaluateWealthLifecycle({ evidence: [natal('NATAL-1')], cw05, periodTimingActivations: [] });
    expect(result.candidateWindows).toHaveLength(0);
    expect(result.diagnostics.some(item => item.code === 'MISSING_DASHA_ACTIVATION')).toBe(true);
  });

  it('does not qualify conflicting natal support and challenge as an event', () => {
    const result = evaluateWealthLifecycle({ evidence: [natal('NATAL-1'), natal('NATAL-2','CHALLENGING')], cw05, periodTimingActivations: [] });
    expect(result.candidateWindows).toHaveLength(0);
    expect(result.diagnostics.some(item => item.code === 'CONFLICTING_NATAL_EVIDENCE')).toBe(true);
  });

  it('keeps user-reported financial facts separate from astrology and reports fact IDs only', () => {
    const base = createUnavailableWealthFinancialDataSet();
    const p = { reportedBy: 'USER' as const, reportId: 'USER-REPORT-1', reportedAt: '2026-11-04T06:00:00Z' };
    const data = [...base.data];
    const index = data.findIndex(item => item.concept === 'DEBT_LIABILITIES');
    data[index] = createUserReportedFinancialDatum({ id: 'FINANCIAL-FACT-1', concept: 'DEBT_LIABILITIES', value: { balance: 25000 }, currency: 'INR', provenance: p });
    const financialData = { schemaVersion: 'C01-v1' as const, status: 'AVAILABLE' as const, data };
    const result = evaluateWealthLifecycle({ evidence: [natal('NATAL-1')], cw05, financialData });
    expect(result.observedFinancialFactReportIds).toContain('FINANCIAL-FACT-1');
    expect(result.diagnostics.some(item => item.code === 'FINANCIAL_FACTS_NOT_ASTROLOGICAL_EVIDENCE')).toBe(true);
    expect(result.candidateWindows).toHaveLength(0);
  });

  it('keeps source window overlaps as source-period facts and does not merge them', () => {
    const first = { ...period(['MD-A']), interval: { start: '2027-01-01', end: '2028-01-01' } } as WealthPeriodTimingActivation;
    const second = { ...period(['AD-A']), period: 'AD' as const, interval: { start: '2027-06-01', end: '2027-12-01' } } as WealthPeriodTimingActivation;
    const result = evaluateWealthLifecycle({ evidence: [natal('NATAL-1'), dasha('MD-A','SUPPORTING',['NATAL-1']), dasha('AD-A','SUPPORTING',['NATAL-1'])], periodTimingActivations: [first,second], cw05 });
    expect(result.candidateWindows).toHaveLength(0);
    expect(result.diagnostics.some(item => item.code === 'UNVALIDATED_EVENT_RULES')).toBe(true);
  });

  it('preserves CW-05 as final authority and never claims numeric probabilities or guarantees', () => {
    const result = evaluateWealthLifecycle({ evidence: [], cw05 });
    expect(result.finalAuthority).toBe('CW-05');
    expect(result.guaranteedEventsAvailable).toBe(false);
    expect(result.numericProbabilityAvailable).toBe(false);
    expect(result.candidateWindows).toEqual([]);
  });
});