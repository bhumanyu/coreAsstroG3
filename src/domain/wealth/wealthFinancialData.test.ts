import { describe, expect, it } from 'vitest';
import {
  createAstrologicalFinancialIndicator,
  createCalculatedFinancialMetric,
  createConnectedFinancialDatum,
  createUnavailableWealthFinancialDataSet,
  createUserReportedFinancialDatum,
  validateWealthFinancialDataSet,
  validateWealthFinancialDatum
} from './wealthFinancialData';

describe('C01 Wealth financial data contract', () => {
  const provenance = { reportedBy: 'USER' as const, reportId: 'report-1', reportedAt: '2026-11-04T05:30:00Z' };

  it('classifies astrological indications without user/calculation provenance', () => {
    const item = createAstrologicalFinancialIndicator({ id: 'astro', concept: 'SAVINGS', value: 'indication only' });
    expect(item.sourceClassification).toBe('ASTROLOGICAL_INDICATOR');
    expect(item.userReportedProvenance).toBeUndefined();
    expect(item.calculationProvenance).toBeUndefined();
    expect(validateWealthFinancialDatum(item)).toBe(true);
  });

  it('requires provenance for user-reported facts', () => {
    const item = createUserReportedFinancialDatum({ id: 'salary', concept: 'INCOME', value: 120000, currency: 'INR', period: 'MONTHLY', provenance });
    expect(item.sourceClassification).toBe('USER_REPORTED_FINANCIAL_FACT');
    expect(validateWealthFinancialDatum(item)).toBe(true);
    expect(validateWealthFinancialDatum({ ...item, userReportedProvenance: undefined })).toBe(false);
  });

  it('requires formula and explicit inputs for calculated metrics', () => {
    const item = createCalculatedFinancialMetric({
      id: 'net-worth', concept: 'NET_WORTH', value: 2500000, currency: 'INR',
      provenance: { formulaId: 'NET_WORTH', formulaVersion: '1', formulaDescription: 'Assets minus liabilities', calculatedAt: '2026-11-04T05:35:00Z', inputs: [{ datumId: 'assets-1', concept: 'ASSETS' }, { datumId: 'debt-1', concept: 'DEBT_LIABILITIES' }] }
    });
    expect(item.sourceClassification).toBe('CALCULATED_FINANCIAL_METRIC');
    expect(item.calculationProvenance?.inputs).toHaveLength(2);
    expect(validateWealthFinancialDatum(item)).toBe(true);
  });

  it('rejects calculated metrics with no required inputs', () => {
    expect(() => createCalculatedFinancialMetric({
      id: 'net-worth', concept: 'NET_WORTH', value: 2,
      provenance: { formulaId: 'NET_WORTH', formulaVersion: '1', formulaDescription: 'Assets less liabilities', calculatedAt: '2026-11-04T05:35:00Z', inputs: [] }
    })).toThrow(/at least one explicit source input/);
  });

  it('keeps missing user data unavailable for every financial concept', () => {
    const dataset = createUnavailableWealthFinancialDataSet();
    expect(dataset.status).toBe('UNAVAILABLE');
    expect(dataset.data).toHaveLength(10);
    expect(dataset.data.every((item) => item.sourceClassification === 'UNAVAILABLE' && item.value === undefined)).toBe(true);
    expect(validateWealthFinancialDataSet(dataset)).toBe(true);
  });

  it('does not permit horoscope provenance to manufacture income, debt, or ownership facts', () => {
    expect(validateWealthFinancialDatum({ id:'income', concept:'INCOME', availability:'AVAILABLE', sourceClassification:'USER_REPORTED_FINANCIAL_FACT', value:90000 })).toBe(false);
    expect(validateWealthFinancialDatum({ id:'debt', concept:'DEBT_LIABILITIES', availability:'AVAILABLE', sourceClassification:'ASTROLOGICAL_INDICATOR', value:'pressure', userReportedProvenance:provenance })).toBe(false);
    expect(validateWealthFinancialDatum({ id:'asset', concept:'ASSET_OWNERSHIP', availability:'AVAILABLE', sourceClassification:'ASTROLOGICAL_INDICATOR', value:'owns home', calculationProvenance:{ formulaId:'x', formulaVersion:'1', formulaDescription:'x', calculatedAt:'2026-11-04T05:35:00Z', inputs:[{datumId:'x',concept:'ASSETS'}]}})).toBe(false);
  });

  it('JSON serializes and validates a reported fact', () => {
    const item = createUserReportedFinancialDatum({ id:'saving', concept:'SAVINGS', value:50000, currency:'INR', provenance });
    expect(validateWealthFinancialDatum(JSON.parse(JSON.stringify(item)) as unknown)).toBe(true);
  });

  it('rejects duplicate datum IDs and inconsistent set status', () => {
    const set = createUnavailableWealthFinancialDataSet();
    expect(validateWealthFinancialDataSet({ ...set, status:'AVAILABLE' })).toBe(false);
  });
});


describe('C03 trading facts provenance guardrails', () => {
  it('keeps trading exposure and trading history unavailable by default', () => {
    const dataset = createUnavailableWealthFinancialDataSet();
    const exposure = dataset.data.find((item) => item.concept === 'TRADING_EXPOSURE');
    const history = dataset.data.find((item) => item.concept === 'TRADING_HISTORY');
    expect(exposure?.availability).toBe('UNAVAILABLE');
    expect(history?.availability).toBe('UNAVAILABLE');
    expect(exposure?.value).toBeUndefined();
    expect(history?.value).toBeUndefined();
  });

  it('accepts explicitly user-reported trading exposure only with report provenance', () => {
    const item = createUserReportedFinancialDatum({
      id: 'exposure-report-1', concept: 'TRADING_EXPOSURE',
      value: { amount: 250000, instruments: ['equity'] }, currency: 'INR', provenance
    });
    expect(validateWealthFinancialDatum(item)).toBe(true);
    expect(validateWealthFinancialDatum({ ...item, userReportedProvenance: undefined })).toBe(false);
  });

  it('accepts connected trading history only with provider and connection provenance', () => {
    const item = createConnectedFinancialDatum({
      id: 'broker-history-1', concept: 'TRADING_HISTORY', value: { tradeCount: 12 },
      provenance: { sourceType: 'BROKERAGE', providerId: 'broker-x', connectionId: 'conn-1', retrievedAt: '2026-11-04T05:40:00Z' }
    });
    expect(validateWealthFinancialDatum(item)).toBe(true);
    expect(validateWealthFinancialDatum({ ...item, connectedSourceProvenance: undefined })).toBe(false);
  });

  it('does not accept astrology-only data as actual trading exposure or history', () => {
    const astro = createAstrologicalFinancialIndicator({ id: 'astro', concept: 'TRADING_EXPOSURE', value: 'strong chart indication' });
    expect(astro.sourceClassification).toBe('ASTROLOGICAL_INDICATOR');
    expect(astro.userReportedProvenance).toBeUndefined();
    expect(astro.connectedSourceProvenance).toBeUndefined();
    expect(validateWealthFinancialDatum({ ...astro, sourceClassification: 'USER_REPORTED_FINANCIAL_FACT' })).toBe(false);
    expect(validateWealthFinancialDatum({ ...astro, sourceClassification: 'CONNECTED_FINANCIAL_SOURCE' })).toBe(false);
  });
});
