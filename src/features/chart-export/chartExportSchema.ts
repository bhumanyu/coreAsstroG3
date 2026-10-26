import type { ProductMethodology } from '../../core/analysis/AnalysisContext';
import type { ProductDirection } from '../../product/analysis/productAnalysisTypes';
import { validateBirthDetails } from '../../core/validation/birthDetailsValidation';
import { AyanamsaType, type BirthDetails } from '../../types';

export type ExportedValue<T> =
  | { readonly status: 'AVAILABLE'; readonly value: T }
  | { readonly status: 'PARTIAL'; readonly value: T; readonly limitations: readonly string[] }
  | { readonly status: 'UNAVAILABLE'; readonly reason: string };

export interface ExportProvenanceV1 {
  readonly analysisId: string;
  readonly asOf: string;
  readonly exportedAt: string;
  readonly engineVersion: string;
  readonly rulesVersion: string;
  readonly methodology: ProductMethodology;
}

export interface ExportedPeriodV1 {
  readonly selectedPeriodId: string;
  readonly mahadashaId: string;
  readonly mahadashaPlanet: string;
  readonly antardashaId: string;
  readonly antardashaPlanet: string;
  readonly start: string;
  readonly end: string;
  readonly analysisAsOf: string;
  readonly temporalRelation: 'PAST' | 'CURRENT' | 'FUTURE' | 'UNKNOWN';
}

export interface ExportedChartFactsV1 {
  readonly ascendantSign?: string;
  readonly ascendantDegree?: number;
  readonly moonSign?: string;
  readonly sunSign?: string;
  readonly moonNakshatra?: string;
}

export interface ExportedEvidenceV1 {
  readonly id: string;
  readonly title: string;
  readonly statement: string;
  readonly direction: ProductDirection;
  readonly role: string;
  readonly source: string;
  readonly ruleId?: string;
}

export interface ExportedCareerInterpretationV1 {
  readonly status: string;
  readonly promise: {
    readonly status?: string;
    readonly strength: string;
    readonly confidence: string;
    readonly headline?: string;
    readonly statement?: string;
    readonly dominantManifestations?: readonly string[];
  };
  readonly d10Relationship: string;
  readonly evidence: readonly ExportedEvidenceV1[];
}

export interface ExportedWealthInterpretationV1 {
  readonly status: string;
  readonly promise: string;
  readonly confidence: string;
  readonly headline?: string;
  readonly statement?: string;
  readonly d2Relationship: string;
  readonly evidence: readonly ExportedEvidenceV1[];
}

export interface ExportedInterpretationV1 {
  readonly career: ExportedValue<ExportedCareerInterpretationV1>;
  readonly wealth: ExportedValue<ExportedWealthInterpretationV1>;
}

export interface ChartExportV1 {
  readonly schemaVersion: 1;
  readonly provenance: ExportProvenanceV1;
  readonly birth: {
    readonly dateTime: string;
    readonly timezone: string;
    readonly latitude: number;
    readonly longitude: number;
    readonly ayanamsa: string;
  };
  readonly selectedPeriod: ExportedValue<ExportedPeriodV1>;
  readonly chartFacts: ExportedValue<ExportedChartFactsV1>;
  readonly interpretation: ExportedValue<ExportedInterpretationV1>;
}

export type ChartExportValidationResult =
  | { readonly ok: true; readonly value: ChartExportV1 }
  | { readonly ok: false; readonly error: 'INVALID_SHAPE' | 'UNSUPPORTED_VERSION' };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function onlyKeys(value: Record<string, unknown>, allowed: readonly string[]): boolean {
  return Object.keys(value).every((key) => allowed.includes(key));
}

function isString(value: unknown): value is string {
  return typeof value === 'string';
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isOptionalString(value: unknown): boolean {
  return value === undefined || isString(value);
}

function isAyanamsaType(value: unknown): value is AyanamsaType {
  return Object.values(AyanamsaType).some((entry) => entry === value);
}

function isValidExportedValue<T>(
  value: unknown,
  validateValue: (candidate: unknown) => candidate is T
): value is ExportedValue<T> {
  if (!isRecord(value) || !isString(value.status)) return false;
  if (value.status === 'AVAILABLE') {
    return onlyKeys(value, ['status', 'value']) && validateValue(value.value);
  }
  if (value.status === 'PARTIAL') {
    return onlyKeys(value, ['status', 'value', 'limitations'])
      && validateValue(value.value)
      && Array.isArray(value.limitations)
      && value.limitations.every(isString)
      && value.limitations.length > 0;
  }
  return value.status === 'UNAVAILABLE'
    && onlyKeys(value, ['status', 'reason'])
    && isString(value.reason)
    && value.reason.length > 0;
}

function isMethodology(value: unknown): value is ProductMethodology {
  if (!isRecord(value) || !onlyKeys(value, [
    'zodiacSystem', 'houseSystem', 'ayanamsa', 'calculationEngine',
    'rulesEngine', 'vargaRules', 'dashaSystem'
  ])) return false;
  return ['zodiacSystem', 'houseSystem', 'ayanamsa', 'calculationEngine', 'rulesEngine', 'vargaRules', 'dashaSystem']
    .every((key) => isString(value[key]));
}

function isEvidence(value: unknown): value is ExportedEvidenceV1 {
  if (!isRecord(value) || !onlyKeys(value, ['id', 'title', 'statement', 'direction', 'role', 'source', 'ruleId'])) return false;
  return isString(value.id) && isString(value.title) && isString(value.statement)
    && ['SUPPORT', 'CHALLENGE', 'NEUTRAL', 'MIXED', 'UNAVAILABLE'].includes(String(value.direction))
    && isString(value.role) && isString(value.source) && isOptionalString(value.ruleId);
}

function isPeriod(value: unknown): value is ExportedPeriodV1 {
  if (!isRecord(value) || !onlyKeys(value, [
    'selectedPeriodId', 'mahadashaId', 'mahadashaPlanet', 'antardashaId',
    'antardashaPlanet', 'start', 'end', 'analysisAsOf', 'temporalRelation'
  ])) return false;
  return ['selectedPeriodId', 'mahadashaId', 'mahadashaPlanet', 'antardashaId',
    'antardashaPlanet', 'start', 'end', 'analysisAsOf'].every((key) => isString(value[key]))
    && Number.isFinite(Date.parse(value.start as string))
    && Number.isFinite(Date.parse(value.end as string))
    && Date.parse(value.start as string) < Date.parse(value.end as string)
    && Number.isFinite(Date.parse(value.analysisAsOf as string))
    && ['PAST', 'CURRENT', 'FUTURE', 'UNKNOWN'].includes(String(value.temporalRelation));
}

function isChartFacts(value: unknown): value is ExportedChartFactsV1 {
  if (!isRecord(value) || !onlyKeys(value, ['ascendantSign', 'ascendantDegree', 'moonSign', 'sunSign', 'moonNakshatra'])) return false;
  return isOptionalString(value.ascendantSign) && (value.ascendantDegree === undefined || isFiniteNumber(value.ascendantDegree))
    && isOptionalString(value.moonSign) && isOptionalString(value.sunSign) && isOptionalString(value.moonNakshatra);
}

function isCareerInterpretation(value: unknown): value is ExportedCareerInterpretationV1 {
  if (!isRecord(value) || !onlyKeys(value, ['status', 'promise', 'd10Relationship', 'evidence'])
    || !isRecord(value.promise) || !onlyKeys(value.promise, [
      'status', 'strength', 'confidence', 'headline', 'statement', 'dominantManifestations'
    ])) return false;
  const promise = value.promise;
  return isString(value.status) && isString(promise.strength) && isString(promise.confidence)
    && isOptionalString(promise.status) && isOptionalString(promise.headline) && isOptionalString(promise.statement)
    && (promise.dominantManifestations === undefined
      || (Array.isArray(promise.dominantManifestations) && promise.dominantManifestations.every(isString)))
    && isString(value.d10Relationship) && Array.isArray(value.evidence) && value.evidence.every(isEvidence);
}

function isWealthInterpretation(value: unknown): value is ExportedWealthInterpretationV1 {
  if (!isRecord(value) || !onlyKeys(value, [
    'status', 'promise', 'confidence', 'headline', 'statement', 'd2Relationship', 'evidence'
  ])) return false;
  return isString(value.status) && isString(value.promise) && isString(value.confidence)
    && isOptionalString(value.headline) && isOptionalString(value.statement)
    && isString(value.d2Relationship) && Array.isArray(value.evidence) && value.evidence.every(isEvidence);
}

function isInterpretation(value: unknown): value is ExportedInterpretationV1 {
  if (!isRecord(value) || !onlyKeys(value, ['career', 'wealth'])) return false;
  return isValidExportedValue(value.career, isCareerInterpretation)
    && isValidExportedValue(value.wealth, isWealthInterpretation);
}

function isChartExportV1(value: unknown): value is ChartExportV1 {
  if (!isRecord(value) || value.schemaVersion !== 1) return false;
  if (!onlyKeys(value, ['schemaVersion', 'provenance', 'birth', 'selectedPeriod', 'chartFacts', 'interpretation'])) {
    return false;
  }
  const provenance = value.provenance;
  const birth = value.birth;
  if (!isRecord(provenance) || !onlyKeys(provenance, [
    'analysisId', 'asOf', 'exportedAt', 'engineVersion', 'rulesVersion', 'methodology'
  ]) || !isRecord(birth) || !onlyKeys(birth, ['dateTime', 'timezone', 'latitude', 'longitude', 'ayanamsa'])) {
    return false;
  }
  const validTimestamps = ['asOf', 'exportedAt'].every((key) =>
    isString(provenance[key]) && Number.isFinite(Date.parse(provenance[key]))
  );
  const birthDetails: BirthDetails | undefined =
    isString(birth.dateTime)
    && isString(birth.timezone)
    && isFiniteNumber(birth.latitude)
    && isFiniteNumber(birth.longitude)
    && isAyanamsaType(birth.ayanamsa)
      ? {
        dateTimeStr: birth.dateTime,
        timeZone: birth.timezone,
        latitude: birth.latitude,
        longitude: birth.longitude,
        ayanamsa: birth.ayanamsa
      }
      : undefined;
  const validBirth = birthDetails !== undefined && validateBirthDetails(birthDetails).length === 0;
  if (!isValidExportedValue(value.selectedPeriod, isPeriod)
    || !isValidExportedValue(value.chartFacts, isChartFacts)
    || !isValidExportedValue(value.interpretation, isInterpretation)) return false;
  const validFields = ['analysisId', 'asOf', 'exportedAt', 'engineVersion', 'rulesVersion']
    .every((key) => isString(provenance[key]) && provenance[key].length > 0)
    && isMethodology(provenance.methodology)
    && validTimestamps
    && validBirth;
  if (!validFields) return false;
  return value.selectedPeriod.status !== 'AVAILABLE'
    || value.selectedPeriod.value.analysisAsOf === provenance.asOf;
}

export function validateChartExport(value: unknown): ChartExportValidationResult {
  if (isChartExportV1(value)) return { ok: true, value };
  return {
    ok: false,
    error: isRecord(value) && typeof value.schemaVersion === 'number' && value.schemaVersion !== 1
      ? 'UNSUPPORTED_VERSION' : 'INVALID_SHAPE'
  };
}
