import { describe, expect, it } from 'vitest';
import { evaluateWealthLifecycle, WEALTH_LIFECYCLE_RULE_CATALOGUE } from './wealthLifecycleEngine';
import { createUnavailableWealthFinancialDataSet, createUserReportedFinancialDatum } from './wealthFinancialData';
import { createDomainEvidence } from '../interpretation/DomainEvidence';
import type { DomainEvidence } from '../interpretation/DomainEvidence';
import type { WealthLifecycleInput, WealthLifecyclePeriodInput } from './wealthLifecycleTypes';
import type { WealthPeriodTimingActivation } from './wealthTypes';

function natal(id: string, dimension: 'ACCUMULATION' | 'GAINS' = 'ACCUMULATION', polarity: 'SUPPORTING' | 'CHALLENGING' = 'SUPPORTING'): DomainEvidence {
  const families = dimension === 'ACCUMULATION' ? ['SECOND_HOUSE', 'SECOND_LORD'] : ['ELEVENTH_HOUSE', 'ELEVENTH_LORD'];
  const family = families[0];
  const ruleId = dimension === 'ACCUMULATION' ? 'WEALTH_2H_STRONG_001' : 'WEALTH_11H_STRONG_001';
  return createDomainEvidence({
    id, sourceType: 'HOUSE', domain: 'WEALTH', role: 'PRIMARY', phase: 'NATAL_PROMISE', source: 'D1',
    statement: 'Test-only natal Wealth lifecycle indication.', polarity, strength: 'STRONG', priority: 90,
    ruleId, relatedEvidenceIds: [], evidenceFamily: family, dimension, house: dimension === 'ACCUMULATION' ? 2 : 11,
    identityKey: id + ':ROOT'
  });
}
function dasha(id: string, polarity: 'SUPPORTING' | 'CHALLENGING', relatedEvidenceIds: readonly string[], level: 'MD' | 'AD' | 'PD' = 'MD'): DomainEvidence {
  return createDomainEvidence({
    id, sourceType: 'DASHA', domain: 'WEALTH', role: 'TIMING', phase: 'DASHA_ACTIVATION', source: 'DASHA',
    statement: 'Test-only linked Dasha activation.', polarity, strength: 'MODERATE', priority: 50,
    ruleId: 'WEALTH_TEST_DASHA_001:' + level, relatedEvidenceIds, timing: { period: level, level },
    evidenceFamily: 'DASHA', dimension: 'ACCUMULATION'
  });
}
function periodInput(evidenceIds: readonly string[], level: 'MD' | 'AD' | 'PD' = 'MD', start = '2027-01-01', end = '2028-01-01', accumulation: 'ACTIVATES' | 'PARTIALLY_ACTIVATES' = 'ACTIVATES'): WealthLifecyclePeriodInput {
  return {
    periodTimingActivation: {
      period: level,
      dimensions: { accumulation, gains: 'INSUFFICIENT_DATA', fortune: 'INSUFFICIENT_DATA', speculation: 'INSUFFICIENT_DATA' },
      evidenceIds, effect: accumulation, activatedPromiseEvidenceIds: ['NATAL-1'], statement: 'Test source period'
    },
    interval: { start, end },
    sourcePeriodId: level + ':TEST:' + start + ':' + end
  };
}
function cw05For(natalEvidence: readonly DomainEvidence[], activation: 'SUPPORT' | 'MIXED' = 'SUPPORT') {
  const accumIds = natalEvidence.filter(e => e.dimension === 'ACCUMULATION').map(e => e.id);
  const accumRules = natalEvidence.filter(e => e.dimension === 'ACCUMULATION').map(e => e.ruleId ?? '').filter(Boolean);
  const gainsIds = natalEvidence.filter(e => e.dimension === 'GAINS').map(e => e.id);
  const gainsRules = natalEvidence.filter(e => e.dimension === 'GAINS').map(e => e.ruleId ?? '').filter(Boolean);
  const unavailable = { status: 'INSUFFICIENT_DATA', promiseStatus: 'INSUFFICIENT_DATA', activationStatus: 'INSUFFICIENT_DATA', timingStatus: 'INSUFFICIENT_DATA', natalEvidenceIds: [], natalRuleIds: [], evidenceIds: [] };
  return {
    reasoningVersion: 'CW-05' as const, domain: 'WEALTH' as const, finalStatus: 'STRONG',
    natalEvidenceIds: natalEvidence.map(e => e.id), ruleIds: natalEvidence.map(e => e.ruleId ?? '').filter(Boolean),
    dimensions: {
      ACCUMULATION: accumIds.length ? { status: 'STRONG', promiseStatus: 'STRONG', activationStatus: activation, timingStatus: 'SUPPORT', natalEvidenceIds: accumIds, natalRuleIds: accumRules, evidenceIds: accumIds } : unavailable,
      GAINS: gainsIds.length ? { status: 'STRONG', promiseStatus: 'STRONG', activationStatus: activation, timingStatus: 'SUPPORT', natalEvidenceIds: gainsIds, natalRuleIds: gainsRules, evidenceIds: gainsIds } : unavailable,
      FORTUNE: unavailable, SPECULATION: unavailable
    }
  };
}
const cw05 = cw05For([]);

describe('C04 Wealth lifecycle engine', () => {
  it('registers every proposed lifecycle category but enables none without approved event rules', () => {
    expect(WEALTH_LIFECYCLE_RULE_CATALOGUE.map(item => item.eventType)).toEqual([
      'ACCUMULATION','GAINS','ASSET_BUILDING_INDICATION','PRESERVATION','EROSION_CHALLENGE',
      'DEBT_EXPOSURE_INDICATION','DEBT_REPAYMENT_REDUCTION_INDICATION','LIQUIDITY_PRESSURE','LIQUIDITY_RELIEF','RECOVERY','INHERITANCE_INDICATION'
    ]);
    expect(WEALTH_LIFECYCLE_RULE_CATALOGUE.filter(item => item.releaseEnabled).map(item => item.eventType)).toEqual(['ACCUMULATION', 'GAINS']);
    expect(WEALTH_LIFECYCLE_RULE_CATALOGUE.filter(item => !item.releaseEnabled)).toHaveLength(9);
  });

  it('does not emit an event from Dasha evidence when no natal Wealth promise exists', () => {
    const input: WealthLifecycleInput = { evidence: [dasha('DASHA-ONLY','SUPPORTING',['NATAL-UNKNOWN'])], cw05, periodTimingActivations: [] };
    const result = evaluateWealthLifecycle(input);
    expect(result.candidateWindows).toHaveLength(0);
    expect(result.diagnostics.some(item => item.code === 'DASHA_ONLY_SUPPRESSED')).toBe(true);
    expect(result.actualFinancialEventsInferred).toBe(false);
  });

  it('keeps lifecycle candidates empty when natal promise exists but Dasha is missing', () => {
    const n = natal('NATAL-1');
    const result = evaluateWealthLifecycle({ evidence: [n], cw05: cw05For([n]), periodTimingActivations: [] });
    expect(result.candidateWindows).toHaveLength(0);
    expect(result.diagnostics.some(item => item.code === 'MISSING_DASHA_ACTIVATION')).toBe(true);
  });

  it('does not qualify conflicting natal support and challenge as an event', () => {
    const n1 = natal('NATAL-1'); const n2 = natal('NATAL-2','ACCUMULATION','CHALLENGING');
    const result = evaluateWealthLifecycle({ evidence: [n1, n2], cw05: cw05For([n1, n2]), periodTimingActivations: [] });
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
    const n = natal('NATAL-1');
    const result = evaluateWealthLifecycle({ evidence: [n], cw05: cw05For([n]), financialData });
    expect(result.observedFinancialFactReportIds).toContain('FINANCIAL-FACT-1');
    expect(result.diagnostics.some(item => item.code === 'FINANCIAL_FACTS_NOT_ASTROLOGICAL_EVIDENCE')).toBe(true);
    expect(result.candidateWindows).toHaveLength(0);
  });

  it('emits an Accumulation indication candidate only with CW-05 natal agreement and linked MD activation', () => {
    const n = natal('NATAL-1');
    const md = dasha('MD-A','SUPPORTING',['NATAL-1'],'MD');
    const period = periodInput(['MD-A'],'MD','2027-01-01','2028-01-01','ACTIVATES');
    const result = evaluateWealthLifecycle({ evidence: [n,md], periodTimingActivations: [period], cw05: cw05For([n]) });
    expect(result.candidateWindows).toHaveLength(1);
    expect(result.candidateWindows[0]).toMatchObject({
      eventType: 'ACCUMULATION', status: 'CANDIDATE',
      timing: { type: 'DASHA_PERIOD_WINDOW', level: 'MD', start: '2027-01-01', end: '2028-01-01', precision: 'PERIOD_ONLY' },
      natalPromiseOccurrenceIds: ['NATAL-1'], activationOccurrenceIds: ['MD-A'],
      guarantee: 'NONE', numericProbabilityAvailable: false
    });
    expect(result.actualFinancialEventsInferred).toBe(false);
    expect(result.finalAuthority).toBe('CW-05');
  });

  it('emits a Gains indication candidate from 11th-house natal evidence and linked AD activation', () => {
    const n = natal('GAINS-NATAL-1','GAINS');
    const ad = createDomainEvidence({
      id: 'AD-GAINS', sourceType: 'DASHA', domain: 'WEALTH', role: 'TIMING', phase: 'DASHA_ACTIVATION', source: 'DASHA',
      statement: 'Linked AD for Gains', polarity: 'SUPPORTING', strength: 'MODERATE', priority: 50,
      ruleId: 'WEALTH_TEST_DASHA_AD', relatedEvidenceIds: ['GAINS-NATAL-1'], timing: { period: 'AD', level: 'AD' }, evidenceFamily: 'DASHA', dimension: 'GAINS'
    });
    const adPeriod: WealthLifecyclePeriodInput = {
      periodTimingActivation: { period: 'AD', dimensions: { accumulation: 'INSUFFICIENT_DATA', gains: 'ACTIVATES', fortune: 'INSUFFICIENT_DATA', speculation: 'INSUFFICIENT_DATA' }, evidenceIds: ['AD-GAINS'], effect: 'ACTIVATES', activatedPromiseEvidenceIds: ['GAINS-NATAL-1'] },
      interval: { start: '2027-02-01', end: '2027-06-01' }, sourcePeriodId: 'AD:TEST:2027-02-01:2027-06-01'
    };
    const result = evaluateWealthLifecycle({ evidence: [n,ad], periodTimingActivations: [adPeriod], cw05: cw05For([n]) });
    expect(result.candidateWindows).toHaveLength(1);
    expect(result.candidateWindows[0]).toMatchObject({ eventType: 'GAINS', timing: { level: 'AD', start: '2027-02-01', end: '2027-06-01' } });
  });

  it('marks partial activation as conditional and preserves the exact source window', () => {
    const n = natal('NATAL-1');
    const md = dasha('MD-A','SUPPORTING',['NATAL-1']);
    const result = evaluateWealthLifecycle({ evidence: [n,md], periodTimingActivations: [periodInput(['MD-A'],'MD','2027-01-01','2028-01-01','PARTIALLY_ACTIVATES')], cw05: cw05For([n],'MIXED') });
    expect(result.candidateWindows[0]?.status).toBe('CONDITIONAL');
    expect(result.status).toBe('CONDITIONAL');
  });

  it('keeps overlapping MD and AD windows distinct and reports their overlap', () => {
    const n = natal('NATAL-1');
    const md = dasha('MD-A','SUPPORTING',['NATAL-1'],'MD');
    const ad = dasha('AD-A','SUPPORTING',['NATAL-1'],'AD');
    const mdPeriod = periodInput(['MD-A'],'MD','2027-01-01','2028-01-01');
    const adPeriod = periodInput(['AD-A'],'AD','2027-06-01','2027-12-01');
    const result = evaluateWealthLifecycle({ evidence: [n,md,ad], periodTimingActivations: [mdPeriod,adPeriod], cw05: cw05For([n]) });
    expect(result.candidateWindows).toHaveLength(2);
    expect(result.candidateWindows.map(item => item.sourcePeriodId)).toEqual([mdPeriod.sourcePeriodId,adPeriod.sourcePeriodId]);
    expect(result.diagnostics.some(item => item.code === 'OVERLAPPING_WINDOWS_PRESERVED')).toBe(true);
  });

  it('retains a qualified indication as untimed/conditional when source interval is invalid', () => {
    const n = natal('NATAL-1');
    const md = dasha('MD-A','SUPPORTING',['NATAL-1']);
    const result = evaluateWealthLifecycle({ evidence: [n,md], periodTimingActivations: [periodInput(['MD-A'],'MD','2027-02-30','2028-01-01')], cw05: cw05For([n]) });
    expect(result.candidateWindows[0]?.timing).toMatchObject({ type: 'UNTIMED', precision: 'UNTIMED' });
    expect(result.candidateWindows[0]?.status).toBe('CONDITIONAL');
    expect(result.diagnostics.some(item => item.code === 'INVALID_PERIOD_INTERVAL')).toBe(true);
  });

  it('does not qualify natal facts missing from CW-05 canonical occurrence/rule references', () => {
    const n = natal('NATAL-1');
    const md = dasha('MD-A','SUPPORTING',['NATAL-1']);
    const weakCw05 = { ...cw05For([n]), dimensions: { ...cw05For([n]).dimensions, ACCUMULATION: { ...cw05For([n]).dimensions.ACCUMULATION, natalEvidenceIds: [], natalRuleIds: [] } } };
    const result = evaluateWealthLifecycle({ evidence: [n,md], periodTimingActivations: [periodInput(['MD-A'])], cw05: weakCw05 });
    expect(result.candidateWindows).toHaveLength(0);
  });



  it('preserves CW-05 as final authority and never claims numeric probabilities or guarantees', () => {
    const result = evaluateWealthLifecycle({ evidence: [], cw05 });
    expect(result.finalAuthority).toBe('CW-05');
    expect(result.guaranteedEventsAvailable).toBe(false);
    expect(result.numericProbabilityAvailable).toBe(false);
    expect(result.candidateWindows).toEqual([]);
  });
});