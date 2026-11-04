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
    expect(dataset.data).toHaveLength(12);
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
  const tradingProvenance = { reportedBy: 'USER' as const, reportId: 'trading-report', reportedAt: '2026-11-04T05:30:00Z' };
  it('rejects a forged AVAILABLE dataset that contains one invalid astrology trading datum', () => {
    const baseline = createUnavailableWealthFinancialDataSet();
    const forged = {
      schemaVersion: 'C01-v1' as const,
      status: 'AVAILABLE' as const,
      data: baseline.data.map((item) => item.concept === 'TRADING_EXPOSURE'
        ? { id: item.id, concept: item.concept, availability: 'AVAILABLE' as const, sourceClassification: 'ASTROLOGICAL_INDICATOR' as const, value: 'speculative chart' }
        : item)
    };
    expect(validateWealthFinancialDataSet(forged)).toBe(false);
  });

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
      value: { amount: 250000, instruments: ['equity'] }, currency: 'INR', provenance: tradingProvenance
    });
    expect(validateWealthFinancialDatum(item)).toBe(true);
    expect(validateWealthFinancialDatum({ ...item, userReportedProvenance: undefined })).toBe(false);
  });

  it('rejects invalid or incomplete connected-source metadata', () => {
    expect(() => createConnectedFinancialDatum({
      id: 'bad-provider', concept: 'TRADING_EXPOSURE', value: { amount: 1 },
      provenance: { sourceType: 'BROKERAGE', providerId: ' ', connectionId: 'c', retrievedAt: '2026-11-04T05:40:00Z' }
    })).toThrow(/providerId/);
    expect(() => createConnectedFinancialDatum({
      id: 'bad-date', concept: 'TRADING_EXPOSURE', value: { amount: 1 },
      provenance: { sourceType: 'BROKERAGE', providerId: 'provider', connectionId: 'c', retrievedAt: '2026-02-31T05:40:00Z' }
    })).toThrow(/retrievedAt/);
  });

  it('rejects impossible dates in all financial timestamps and persisted provenance', () => {
    const impossibleDate = '2026-02-31T05:40:00Z';
    const reportedProvenance = { reportedBy: 'USER' as const, reportId: 'report-1', reportedAt: '2026-11-04T05:30:00Z' };
    expect(() => createUserReportedFinancialDatum({
      id: 'bad-reported-at', concept: 'INCOME', value: 1,
      provenance: { ...reportedProvenance, reportedAt: impossibleDate }
    })).toThrow(/reportedAt/);
    expect(() => createUserReportedFinancialDatum({
      id: 'bad-as-of', concept: 'INCOME', value: 1, asOf: impossibleDate, provenance: reportedProvenance
    })).toThrow(/asOf/);
    expect(() => createCalculatedFinancialMetric({
      id: 'bad-calculated-at', concept: 'NET_WORTH', value: 1,
      provenance: {
        formulaId: 'NET_WORTH', formulaVersion: '1', formulaDescription: 'Assets less liabilities',
        calculatedAt: impossibleDate, inputs: [{ datumId: 'assets-1', concept: 'ASSETS' }]
      }
    })).toThrow(/calculatedAt/);

    const validReportedDatum = createUserReportedFinancialDatum({
      id: 'reported', concept: 'INCOME', value: 1, provenance: reportedProvenance
    });
    expect(validateWealthFinancialDatum({
      ...validReportedDatum,
      userReportedProvenance: { ...validReportedDatum.userReportedProvenance, reportedAt: impossibleDate }
    })).toBe(false);
    expect(validateWealthFinancialDatum({ ...validReportedDatum, asOf: impossibleDate })).toBe(false);

    const validCalculatedDatum = createCalculatedFinancialMetric({
      id: 'calculated', concept: 'NET_WORTH', value: 1,
      provenance: {
        formulaId: 'NET_WORTH', formulaVersion: '1', formulaDescription: 'Assets less liabilities',
        calculatedAt: '2026-11-04T05:30:00Z', inputs: [{ datumId: 'assets-1', concept: 'ASSETS' }]
      }
    });
    expect(validateWealthFinancialDatum({
      ...validCalculatedDatum,
      calculationProvenance: { ...validCalculatedDatum.calculationProvenance!, calculatedAt: impossibleDate }
    })).toBe(false);

    const validConnectedDatum = createConnectedFinancialDatum({
      id: 'connected', concept: 'TRADING_HISTORY', value: { count: 1 },
      provenance: {
        sourceType: 'BROKERAGE', providerId: 'broker', connectionId: 'connection',
        retrievedAt: '2026-11-04T05:30:00Z'
      }
    });
    expect(validateWealthFinancialDatum({
      ...validConnectedDatum,
      connectedSourceProvenance: { ...validConnectedDatum.connectedSourceProvenance!, retrievedAt: impossibleDate }
    })).toBe(false);
  });

  it('accepts connected trading history only with provider and connection provenance', () => {
    const item = createConnectedFinancialDatum({
      id: 'broker-history-1', concept: 'TRADING_HISTORY', value: { tradeCount: 12 },
      provenance: { sourceType: 'BROKERAGE', providerId: 'broker-x', connectionId: 'conn-1', retrievedAt: '2026-11-04T05:40:00Z' }
    });
    expect(validateWealthFinancialDatum(item)).toBe(true);
    expect(validateWealthFinancialDatum({ ...item, connectedSourceProvenance: undefined })).toBe(false);
  });

  it('rejects astrological indicators for trading exposure and trading history concepts', () => {
    expect(() => createAstrologicalFinancialIndicator({
      id: 'astro-exposure', concept: 'TRADING_EXPOSURE', value: 'strong chart indication'
    })).toThrow(/real-world trading concepts/);
    expect(() => createAstrologicalFinancialIndicator({
      id: 'astro-history', concept: 'TRADING_HISTORY', value: 'frequent trader'
    })).toThrow(/real-world trading concepts/);
    expect(validateWealthFinancialDatum({
      id: 'forged-exposure', concept: 'TRADING_EXPOSURE', availability: 'AVAILABLE',
      sourceClassification: 'ASTROLOGICAL_INDICATOR', value: 'strong indication'
    })).toBe(false);
    expect(validateWealthFinancialDatum({
      id: 'forged-history', concept: 'TRADING_HISTORY', availability: 'AVAILABLE',
      sourceClassification: 'ASTROLOGICAL_INDICATOR', value: 'frequent trader'
    })).toBe(false);
  });
});
