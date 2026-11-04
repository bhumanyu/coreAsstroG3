/**
 * C01 — Real-world financial data contract.
 *
 * This model is independent from horoscope evidence and CW-05.
 * Financial report/datum identifiers are not A03 astrology evidence identifiers.
 */

export type WealthFinancialSourceClassification =
  | 'ASTROLOGICAL_INDICATOR'
  | 'USER_REPORTED_FINANCIAL_FACT'
  | 'CALCULATED_FINANCIAL_METRIC'
  | 'CONNECTED_FINANCIAL_SOURCE'
  | 'UNAVAILABLE';

export type WealthFinancialConcept =
  | 'INCOME'
  | 'SAVINGS'
  | 'ASSETS'
  | 'ASSET_OWNERSHIP'
  | 'INHERITANCE'
  | 'DEBT_LIABILITIES'
  | 'CASH_FLOW'
  | 'LIQUIDITY'
  | 'NET_WORTH'
  | 'CONSUMPTION_LUXURY'
  | 'TRADING_EXPOSURE'
  | 'TRADING_HISTORY';

export type WealthFinancialAvailability = 'AVAILABLE' | 'UNAVAILABLE';
export type WealthFinancialPeriod = 'INSTANT' | 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'ANNUAL' | 'CUSTOM';

export interface WealthFinancialUserProvenance {
  readonly reportedBy: 'USER';
  readonly reportId: string;
  readonly reportedAt: string;
  readonly label?: string;
  readonly sourceNote?: string;
}

export interface WealthFinancialConnectedSourceProvenance {
  readonly sourceType: 'CONNECTED_ACCOUNT' | 'BROKERAGE' | 'BANK' | 'OTHER_FINANCIAL_PROVIDER';
  readonly providerId: string;
  readonly connectionId: string;
  readonly retrievedAt: string;
  readonly externalReference?: string;
}

export interface WealthFinancialInputReference {
  readonly datumId: string;
  readonly concept: WealthFinancialConcept;
}

export interface WealthFinancialCalculationProvenance {
  readonly formulaId: string;
  readonly formulaVersion: string;
  readonly formulaDescription: string;
  readonly calculatedAt: string;
  readonly inputs: readonly WealthFinancialInputReference[];
}

export interface WealthFinancialDatum<TValue = number> {
  readonly id: string;
  readonly concept: WealthFinancialConcept;
  readonly availability: WealthFinancialAvailability;
  readonly sourceClassification: WealthFinancialSourceClassification;
  readonly value?: TValue;
  readonly currency?: string;
  readonly unit?: string;
  readonly period?: WealthFinancialPeriod;
  readonly asOf?: string;
  readonly userReportedProvenance?: WealthFinancialUserProvenance;
  readonly calculationProvenance?: WealthFinancialCalculationProvenance;
  readonly connectedSourceProvenance?: WealthFinancialConnectedSourceProvenance;
  readonly unavailableReason?: string;
}

export interface WealthFinancialDataSet {
  readonly schemaVersion: 'C01-v1';
  readonly status: WealthFinancialAvailability;
  readonly data: readonly WealthFinancialDatum<unknown>[];
}

export const WEALTH_FINANCIAL_CONCEPTS: readonly WealthFinancialConcept[] = Object.freeze([
  'INCOME', 'SAVINGS', 'ASSETS', 'ASSET_OWNERSHIP', 'INHERITANCE',
  'DEBT_LIABILITIES', 'CASH_FLOW', 'LIQUIDITY', 'NET_WORTH', 'CONSUMPTION_LUXURY',
  'TRADING_EXPOSURE', 'TRADING_HISTORY'
]);

const ISO_INSTANT = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,9})?(?:Z|[+-]\d{2}:\d{2})$/;
const CURRENCY = /^[A-Z]{3}$/;

function nonBlank(value: string, field: string): string {
  const result = value.trim();
  if (!result) throw new Error(`${field} must be non-empty`);
  return result;
}

function instant(value: string, field: string): string {
  if (!ISO_INSTANT.test(value) || Number.isNaN(Date.parse(value))) {
    throw new Error(`${field} must be a valid offset-aware ISO-8601 timestamp`);
  }
  return value;
}

export function createAstrologicalFinancialIndicator<TValue = string>(input: {
  readonly id: string;
  readonly concept: WealthFinancialConcept;
  readonly value: TValue;
}): WealthFinancialDatum<TValue> {
  if (input.value === null || input.value === undefined) throw new Error('Astrological indicator requires a descriptive value');
  return Object.freeze({
    id: nonBlank(input.id, 'financial datum id'),
    concept: input.concept,
    availability: 'AVAILABLE',
    sourceClassification: 'ASTROLOGICAL_INDICATOR',
    value: input.value
  });
}

export function createUserReportedFinancialDatum<TValue = number>(input: {
  readonly id: string;
  readonly concept: WealthFinancialConcept;
  readonly value: TValue;
  readonly currency?: string;
  readonly unit?: string;
  readonly period?: WealthFinancialPeriod;
  readonly asOf?: string;
  readonly provenance: WealthFinancialUserProvenance;
}): WealthFinancialDatum<TValue> {
  if (input.value === null || input.value === undefined) throw new Error('User-reported financial fact requires an explicit value');
  if (input.currency && !CURRENCY.test(input.currency)) throw new Error('currency must be a three-letter uppercase currency code');
  if (input.provenance.reportedBy !== 'USER') throw new Error('User-reported financial facts must have reportedBy USER');
  const provenance = Object.freeze({
    ...input.provenance,
    reportId: nonBlank(input.provenance.reportId, 'reportId'),
    reportedAt: instant(input.provenance.reportedAt, 'reportedAt')
  });
  return Object.freeze({
    id: nonBlank(input.id, 'financial datum id'),
    concept: input.concept,
    availability: 'AVAILABLE',
    sourceClassification: 'USER_REPORTED_FINANCIAL_FACT',
    value: input.value,
    ...(input.currency ? { currency: input.currency } : {}),
    ...(input.unit ? { unit: input.unit } : {}),
    ...(input.period ? { period: input.period } : {}),
    ...(input.asOf ? { asOf: instant(input.asOf, 'asOf') } : {}),
    userReportedProvenance: provenance
  });
}

export function createCalculatedFinancialMetric<TValue = number>(input: {
  readonly id: string;
  readonly concept: WealthFinancialConcept;
  readonly value: TValue;
  readonly currency?: string;
  readonly unit?: string;
  readonly period?: WealthFinancialPeriod;
  readonly asOf?: string;
  readonly provenance: WealthFinancialCalculationProvenance;
}): WealthFinancialDatum<TValue> {
  if (input.value === null || input.value === undefined) throw new Error('Calculated metric requires an explicit value');
  if (input.currency && !CURRENCY.test(input.currency)) throw new Error('currency must be a three-letter uppercase currency code');
  const p = input.provenance;
  const seen = new Set<string>();
  const inputs = p.inputs.map((item) => {
    const datumId = nonBlank(item.datumId, 'calculation input datumId');
    if (seen.has(datumId)) throw new Error(`Duplicate calculation input datumId: ${datumId}`);
    seen.add(datumId);
    return Object.freeze({ datumId, concept: item.concept });
  });
  if (inputs.length === 0) throw new Error('Calculated financial metric requires at least one explicit source input');
  return Object.freeze({
    id: nonBlank(input.id, 'financial datum id'),
    concept: input.concept,
    availability: 'AVAILABLE',
    sourceClassification: 'CALCULATED_FINANCIAL_METRIC',
    value: input.value,
    ...(input.currency ? { currency: input.currency } : {}),
    ...(input.unit ? { unit: input.unit } : {}),
    ...(input.period ? { period: input.period } : {}),
    ...(input.asOf ? { asOf: instant(input.asOf, 'asOf') } : {}),
    calculationProvenance: Object.freeze({
      formulaId: nonBlank(p.formulaId, 'formulaId'),
      formulaVersion: nonBlank(p.formulaVersion, 'formulaVersion'),
      formulaDescription: nonBlank(p.formulaDescription, 'formulaDescription'),
      calculatedAt: instant(p.calculatedAt, 'calculatedAt'),
      inputs: Object.freeze(inputs)
    })
  });
}

export function createConnectedFinancialDatum<TValue = unknown>(input: {
  readonly id: string;
  readonly concept: WealthFinancialConcept;
  readonly value: TValue;
  readonly currency?: string;
  readonly unit?: string;
  readonly period?: WealthFinancialPeriod;
  readonly asOf?: string;
  readonly provenance: WealthFinancialConnectedSourceProvenance;
}): WealthFinancialDatum<TValue> {
  if (input.value === null || input.value === undefined) throw new Error('Connected financial datum requires an explicit value');
  if (input.currency && !CURRENCY.test(input.currency)) throw new Error('currency must be a three-letter uppercase currency code');
  const p = input.provenance;
  const provenance = Object.freeze({
    ...p,
    providerId: nonBlank(p.providerId, 'providerId'),
    connectionId: nonBlank(p.connectionId, 'connectionId'),
    retrievedAt: instant(p.retrievedAt, 'retrievedAt')
  });
  return Object.freeze({
    id: nonBlank(input.id, 'financial datum id'),
    concept: input.concept,
    availability: 'AVAILABLE',
    sourceClassification: 'CONNECTED_FINANCIAL_SOURCE',
    value: input.value,
    ...(input.currency ? { currency: input.currency } : {}),
    ...(input.unit ? { unit: input.unit } : {}),
    ...(input.period ? { period: input.period } : {}),
    ...(input.asOf ? { asOf: instant(input.asOf, 'asOf') } : {}),
    connectedSourceProvenance: provenance
  });
}

export function createUnavailableFinancialDatum(input: {
  readonly id: string;
  readonly concept: WealthFinancialConcept;
  readonly reason: string;
}): WealthFinancialDatum<never> {
  return Object.freeze({
    id: nonBlank(input.id, 'financial datum id'),
    concept: input.concept,
    availability: 'UNAVAILABLE',
    sourceClassification: 'UNAVAILABLE',
    unavailableReason: nonBlank(input.reason, 'unavailable reason')
  });
}

export function createUnavailableWealthFinancialDataSet(
  reason = 'No user-reported financial information has been supplied.'
): WealthFinancialDataSet {
  return Object.freeze({
    schemaVersion: 'C01-v1',
    status: 'UNAVAILABLE',
    data: Object.freeze(WEALTH_FINANCIAL_CONCEPTS.map((concept) => createUnavailableFinancialDatum({
      id: `unavailable:${concept.toLowerCase()}`, concept, reason
    })))
  });
}

export function validateWealthFinancialDatum(value: unknown): value is WealthFinancialDatum<unknown> {
  if (!value || typeof value !== 'object') return false;
  const item = value as Record<string, unknown>;
  if (typeof item.id !== 'string' || !item.id.trim() || !WEALTH_FINANCIAL_CONCEPTS.includes(item.concept as WealthFinancialConcept)) return false;
  if (item.availability === 'UNAVAILABLE') {
    return item.sourceClassification === 'UNAVAILABLE' && item.value === undefined
      && typeof item.unavailableReason === 'string' && Boolean(item.unavailableReason.trim())
      && item.userReportedProvenance === undefined && item.calculationProvenance === undefined
      && item.connectedSourceProvenance === undefined;
  }
  if (item.availability !== 'AVAILABLE' || item.value === undefined) return false;
  if (item.sourceClassification === 'ASTROLOGICAL_INDICATOR') {
    // Astrological indications must never be used as real-world financial facts.
    if (item.concept === 'TRADING_EXPOSURE' || item.concept === 'TRADING_HISTORY') return false;
    return item.userReportedProvenance === undefined && item.calculationProvenance === undefined
      && item.connectedSourceProvenance === undefined;
  }
  if (item.sourceClassification === 'USER_REPORTED_FINANCIAL_FACT') {
    const p = item.userReportedProvenance as Record<string, unknown> | undefined;
    return Boolean(p && p.reportedBy === 'USER' && typeof p.reportId === 'string' && p.reportId.trim()
      && typeof p.reportedAt === 'string' && ISO_INSTANT.test(p.reportedAt)
      && !item.calculationProvenance && !item.connectedSourceProvenance);
  }
  if (item.sourceClassification === 'CALCULATED_FINANCIAL_METRIC') {
    const p = item.calculationProvenance as Record<string, unknown> | undefined;
    return Boolean(p && typeof p.formulaId === 'string' && p.formulaId.trim()
      && typeof p.formulaVersion === 'string' && p.formulaVersion.trim()
      && typeof p.formulaDescription === 'string' && p.formulaDescription.trim()
      && typeof p.calculatedAt === 'string' && ISO_INSTANT.test(p.calculatedAt)
      && Array.isArray(p.inputs) && p.inputs.length > 0
      && p.inputs.every((i) => Boolean(i && typeof i.datumId === 'string' && i.datumId.trim()
        && WEALTH_FINANCIAL_CONCEPTS.includes(i.concept as WealthFinancialConcept)))
      && !item.userReportedProvenance && !item.connectedSourceProvenance);
  }
  if (item.sourceClassification === 'CONNECTED_FINANCIAL_SOURCE') {
    const p = item.connectedSourceProvenance as Record<string, unknown> | undefined;
    return Boolean(p && ['CONNECTED_ACCOUNT', 'BROKERAGE', 'BANK', 'OTHER_FINANCIAL_PROVIDER'].includes(String(p.sourceType))
      && typeof p.providerId === 'string' && p.providerId.trim()
      && typeof p.connectionId === 'string' && p.connectionId.trim()
      && typeof p.retrievedAt === 'string' && ISO_INSTANT.test(p.retrievedAt) && !Number.isNaN(Date.parse(p.retrievedAt))
      && !item.userReportedProvenance && !item.calculationProvenance);
  }
  return false;
}

export function validateWealthFinancialDataSet(value: unknown): value is WealthFinancialDataSet {
  if (!value || typeof value !== 'object') return false;
  const dataset = value as Record<string, unknown>;
  if (dataset.schemaVersion !== 'C01-v1' || !Array.isArray(dataset.data)) return false;
  const ids = new Set<string>();
  for (const datum of dataset.data) {
    if (!validateWealthFinancialDatum(datum)) return false;
    const item = datum as WealthFinancialDatum<unknown>;
    if (ids.has(item.id)) return false;
    ids.add(item.id);
  }
  const hasAvailable = dataset.data.some((item) => (item as WealthFinancialDatum).availability === 'AVAILABLE');
  const hasUnavailable = dataset.data.some((item) => (item as WealthFinancialDatum).availability === 'UNAVAILABLE');
  if (dataset.status !== (hasAvailable ? 'AVAILABLE' : 'UNAVAILABLE')) return false;
  if (hasAvailable && hasUnavailable) return false;
  const uniqueConcepts = new Set((dataset.data as WealthFinancialDatum[]).map((item) => item.concept));
  return uniqueConcepts.size === dataset.data.length;
}
