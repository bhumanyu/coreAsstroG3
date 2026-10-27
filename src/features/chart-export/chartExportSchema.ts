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
  readonly deterministicSynthesis: ExportedSelectedPeriodSynthesisV1;
}

export interface ExportedDiagnosticV1 {
  readonly code: string;
  readonly message: string;
}

export interface ExportedSelectedPeriodEvidenceV1 {
  readonly stage: 'CAREER' | 'WEALTH';
  readonly classification?: 'SUPPORTING' | 'CHALLENGING' | 'NEUTRAL' | 'MIXED' | 'UNRESOLVED';
  readonly evidenceId?: string;
  readonly identityKey?: string;
  readonly dimension?: 'ACCUMULATION' | 'GAINS' | 'FORTUNE' | 'SPECULATION';
  readonly polarity?: 'SUPPORTING' | 'CHALLENGING' | 'NEUTRAL';
  readonly source?: string;
  readonly ruleId?: string;
  readonly level?: 'MD' | 'AD' | 'PD';
  readonly provenanceStage?: 'CAREER_EXPRESSION' | 'CAREER_QUALIFICATION' | 'CAREER_ACTIVATION' | 'WEALTH_NATAL_PROMISE' | 'WEALTH_DASHA_RULE';
  readonly referenceKind?: 'EVIDENCE' | 'RULE';
}

export interface ExportedCareerExpressionV1 {
  readonly expressionRefKey: string;
  readonly status: string;
  readonly linkedLevels: readonly ('MD' | 'AD' | 'PD')[];
  readonly qualificationBasis: 'CANONICAL_STATUS' | 'PROXY_DIRECTION' | 'UNAVAILABLE';
  readonly matchBasis?: 'UNAMBIGUOUS' | 'AMBIGUOUS';
  readonly diagnostics: readonly ExportedDiagnosticV1[];
  readonly expressionEvidenceIds: readonly string[];
  readonly qualifiedEvidenceIds: readonly string[];
  readonly unqualifiedEvidenceIds: readonly string[];
  readonly mdDashaEvidenceIds: readonly string[];
  readonly adDashaEvidenceIds: readonly string[];
  readonly expressionSource: 'CALLER' | 'ADAPTER_FALLBACK';
}

export interface ExportedCareerSynthesisV1 {
  readonly qualificationBasis: 'CANONICAL_STATUS' | 'PROXY_DIRECTION' | 'UNAVAILABLE';
  readonly expressions: readonly ExportedCareerExpressionV1[];
  readonly diagnostics: readonly ExportedDiagnosticV1[];
}

export interface ExportedWealthRuleReferenceV1 {
  readonly ruleId: string;
  readonly source: string;
  readonly level: 'MD' | 'AD' | 'PD';
}

export interface ExportedWealthLinkageTraceV1 {
  readonly promiseEvidenceId: string;
  readonly dashaRuleReference: ExportedWealthRuleReferenceV1;
  readonly level: 'MD' | 'AD' | 'PD';
  readonly matchedHouse: number;
}

export interface ExportedWealthDimensionV1 {
  readonly dimension: 'ACCUMULATION' | 'GAINS' | 'FORTUNE' | 'SPECULATION';
  readonly effect: string;
  readonly dataStatus: 'COMPLETE' | 'PARTIAL' | 'INSUFFICIENT_DATA';
  readonly linkedLevels: readonly ('MD' | 'AD' | 'PD')[];
  readonly diagnostics: readonly ExportedDiagnosticV1[];
  readonly promiseEvidenceIds: readonly string[];
  readonly dashaRuleReferences: readonly ExportedWealthRuleReferenceV1[];
  readonly linkageTrace: readonly ExportedWealthLinkageTraceV1[];
  readonly insufficientReason:
    | 'NO_PROMISE_EVIDENCE'
    | 'PROMISE_NOT_LINKED'
    | 'LINKED'
    | 'ACTIVATION_UNAVAILABLE';
}

export interface ExportedWealthSynthesisV1 {
  readonly dimensions: Readonly<Record<'ACCUMULATION' | 'GAINS' | 'FORTUNE' | 'SPECULATION', ExportedWealthDimensionV1>>;
  readonly diagnostics: readonly ExportedDiagnosticV1[];
}

export interface ExportedSynthesisProvenanceV1 {
  readonly career: {
    readonly status: 'PRESENT' | 'PARTIAL' | 'MISSING';
    readonly version?: string;
    readonly qualificationBasis?: 'CANONICAL_STATUS' | 'PROXY_DIRECTION' | 'UNAVAILABLE';
  };
  readonly wealth: {
    readonly status: 'PRESENT' | 'PARTIAL' | 'MISSING';
    readonly version?: string;
  };
}

export interface ExportedMissingInputV1 {
  readonly domain: 'CAREER' | 'WEALTH';
  readonly code: string;
  readonly description: string;
}

/** Deterministic projection only. Optional AI explanation fields are deliberately excluded. */
export interface ExportedSelectedPeriodSynthesisV1 {
  readonly career: ExportedCareerSynthesisV1;
  readonly wealth: ExportedWealthSynthesisV1;
  readonly evidence: readonly ExportedSelectedPeriodEvidenceV1[];
  readonly missingInputs: readonly ExportedMissingInputV1[];
  readonly provenance: ExportedSynthesisProvenanceV1;
  readonly qualificationStatus: 'CANONICAL' | 'PROVISIONAL' | 'UNAVAILABLE';
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

const SYNTHESIS_LEVELS = ['MD', 'AD', 'PD'] as const;
const CAREER_QUALIFICATION_BASES = ['CANONICAL_STATUS', 'PROXY_DIRECTION', 'UNAVAILABLE'] as const;
const SYNTHESIS_STAGES = ['CAREER', 'WEALTH'] as const;
const SYNTHESIS_DIMENSIONS = ['ACCUMULATION', 'GAINS', 'FORTUNE', 'SPECULATION'] as const;

function isOneOf<T extends string>(value: unknown, values: readonly T[]): value is T {
  return typeof value === 'string' && values.includes(value as T);
}

function isStringArray(value: unknown): value is readonly string[] {
  return Array.isArray(value) && value.every(isString);
}

function isDiagnostic(value: unknown): value is ExportedDiagnosticV1 {
  return isRecord(value) && onlyKeys(value, ['code', 'message'])
    && isString(value.code) && isString(value.message);
}

function isSelectedPeriodEvidence(value: unknown): value is ExportedSelectedPeriodEvidenceV1 {
  if (!isRecord(value) || !onlyKeys(value, [
    'stage', 'classification', 'evidenceId', 'identityKey', 'dimension', 'polarity',
    'source', 'ruleId', 'level', 'provenanceStage', 'referenceKind'
  ]) || !isOneOf(value.stage, SYNTHESIS_STAGES)) return false;
  return (value.classification === undefined || isOneOf(value.classification, [
    'SUPPORTING', 'CHALLENGING', 'NEUTRAL', 'MIXED', 'UNRESOLVED'
  ]))
    && isOptionalString(value.evidenceId)
    && isOptionalString(value.identityKey)
    && (value.dimension === undefined || isOneOf(value.dimension, SYNTHESIS_DIMENSIONS))
    && (value.polarity === undefined || isOneOf(value.polarity, ['SUPPORTING', 'CHALLENGING', 'NEUTRAL']))
    && isOptionalString(value.source)
    && isOptionalString(value.ruleId)
    && (value.level === undefined || isOneOf(value.level, SYNTHESIS_LEVELS))
    && (value.provenanceStage === undefined || isOneOf(value.provenanceStage, [
      'CAREER_EXPRESSION', 'CAREER_QUALIFICATION', 'CAREER_ACTIVATION', 'WEALTH_NATAL_PROMISE', 'WEALTH_DASHA_RULE'
    ]))
    && (value.referenceKind === undefined || isOneOf(value.referenceKind, ['EVIDENCE', 'RULE']));
}

function isCareerExpression(value: unknown): value is ExportedCareerExpressionV1 {
  if (!isRecord(value) || !onlyKeys(value, [
    'expressionRefKey', 'status', 'linkedLevels', 'qualificationBasis', 'matchBasis', 'diagnostics',
    'expressionEvidenceIds', 'qualifiedEvidenceIds', 'unqualifiedEvidenceIds', 'mdDashaEvidenceIds',
    'adDashaEvidenceIds', 'expressionSource'
  ])) return false;
  return isString(value.expressionRefKey)
    && isString(value.status)
    && Array.isArray(value.linkedLevels) && value.linkedLevels.every((level) => isOneOf(level, SYNTHESIS_LEVELS))
    && isOneOf(value.qualificationBasis, CAREER_QUALIFICATION_BASES)
    && (value.matchBasis === undefined || isOneOf(value.matchBasis, ['UNAMBIGUOUS', 'AMBIGUOUS']))
    && Array.isArray(value.diagnostics) && value.diagnostics.every(isDiagnostic)
    && isStringArray(value.expressionEvidenceIds)
    && isStringArray(value.qualifiedEvidenceIds)
    && isStringArray(value.unqualifiedEvidenceIds)
    && isStringArray(value.mdDashaEvidenceIds)
    && isStringArray(value.adDashaEvidenceIds)
    && isOneOf(value.expressionSource, ['CALLER', 'ADAPTER_FALLBACK']);
}

function isCareerSynthesis(value: unknown): value is ExportedCareerSynthesisV1 {
  return isRecord(value) && onlyKeys(value, ['qualificationBasis', 'expressions', 'diagnostics'])
    && isOneOf(value.qualificationBasis, CAREER_QUALIFICATION_BASES)
    && Array.isArray(value.expressions) && value.expressions.every(isCareerExpression)
    && Array.isArray(value.diagnostics) && value.diagnostics.every(isDiagnostic);
}

function isWealthRuleReference(value: unknown): value is ExportedWealthRuleReferenceV1 {
  return isRecord(value) && onlyKeys(value, ['ruleId', 'source', 'level'])
    && isString(value.ruleId) && isString(value.source) && isOneOf(value.level, SYNTHESIS_LEVELS);
}

function isWealthLinkageTrace(value: unknown): value is ExportedWealthLinkageTraceV1 {
  return isRecord(value) && onlyKeys(value, [
    'promiseEvidenceId', 'dashaRuleReference', 'level', 'matchedHouse'
  ])
    && isString(value.promiseEvidenceId)
    && isWealthRuleReference(value.dashaRuleReference)
    && isOneOf(value.level, SYNTHESIS_LEVELS)
    && typeof value.matchedHouse === 'number'
    && Number.isInteger(value.matchedHouse)
    && value.matchedHouse >= 1
    && value.matchedHouse <= 12
    && value.dashaRuleReference.level === value.level;
}

function isWealthDimension(value: unknown): value is ExportedWealthDimensionV1 {
  const linkedLevels = isRecord(value) ? value.linkedLevels : undefined;
  const promiseEvidenceIds = isRecord(value) ? value.promiseEvidenceIds : undefined;
  const dashaRuleReferences = isRecord(value) ? value.dashaRuleReferences : undefined;
  const linkageTrace = isRecord(value) ? value.linkageTrace : undefined;
  if (!isRecord(value) || !onlyKeys(value, [
    'dimension', 'effect', 'dataStatus', 'linkedLevels', 'diagnostics', 'promiseEvidenceIds',
    'dashaRuleReferences', 'linkageTrace', 'insufficientReason'
  ])
    || !isOneOf(value.dimension, SYNTHESIS_DIMENSIONS)
    || !isString(value.effect)
    || !isOneOf(value.dataStatus, ['COMPLETE', 'PARTIAL', 'INSUFFICIENT_DATA'])
    || !Array.isArray(linkedLevels) || !linkedLevels.every((level) => isOneOf(level, SYNTHESIS_LEVELS))
    || !Array.isArray(value.diagnostics) || !value.diagnostics.every(isDiagnostic)
    || !isStringArray(promiseEvidenceIds)
    || !Array.isArray(dashaRuleReferences) || !dashaRuleReferences.every(isWealthRuleReference)
    || !Array.isArray(linkageTrace) || !linkageTrace.every(isWealthLinkageTrace)
    || !isOneOf(value.insufficientReason, [
      'NO_PROMISE_EVIDENCE', 'PROMISE_NOT_LINKED', 'LINKED', 'ACTIVATION_UNAVAILABLE'
    ])) return false;

  return linkageTrace.every((trace) =>
    promiseEvidenceIds.includes(trace.promiseEvidenceId) &&
    linkedLevels.includes(trace.level) &&
    dashaRuleReferences.some((reference) =>
      reference.level === trace.level &&
      reference.ruleId === trace.dashaRuleReference.ruleId &&
      reference.source === trace.dashaRuleReference.source
    )
  );
}

function isWealthSynthesis(value: unknown): value is ExportedWealthSynthesisV1 {
  if (!isRecord(value) || !onlyKeys(value, ['dimensions', 'diagnostics']) || !isRecord(value.dimensions)
    || !onlyKeys(value.dimensions, SYNTHESIS_DIMENSIONS)) return false;
  const dimensions = value.dimensions;
  return SYNTHESIS_DIMENSIONS.every((dimension) =>
    isWealthDimension(dimensions[dimension]) && dimensions[dimension].dimension === dimension
  ) && Array.isArray(value.diagnostics) && value.diagnostics.every(isDiagnostic);
}

function isSynthesisProvenance(value: unknown): value is ExportedSynthesisProvenanceV1 {
  if (!isRecord(value) || !onlyKeys(value, ['career', 'wealth'])
    || !isRecord(value.career) || !onlyKeys(value.career, ['status', 'version', 'qualificationBasis'])
    || !isRecord(value.wealth) || !onlyKeys(value.wealth, ['status', 'version'])) return false;
  return isOneOf(value.career.status, ['PRESENT', 'PARTIAL', 'MISSING'])
    && isOptionalString(value.career.version)
    && (value.career.qualificationBasis === undefined
      || isOneOf(value.career.qualificationBasis, CAREER_QUALIFICATION_BASES))
    && isOneOf(value.wealth.status, ['PRESENT', 'PARTIAL', 'MISSING'])
    && isOptionalString(value.wealth.version);
}

function isMissingInput(value: unknown): value is ExportedMissingInputV1 {
  return isRecord(value) && onlyKeys(value, ['domain', 'code', 'description'])
    && isOneOf(value.domain, SYNTHESIS_STAGES)
    && isString(value.code)
    && isString(value.description);
}

function isSelectedPeriodSynthesis(value: unknown): value is ExportedSelectedPeriodSynthesisV1 {
  return isRecord(value) && onlyKeys(value, [
    'career', 'wealth', 'evidence', 'missingInputs', 'provenance', 'qualificationStatus'
  ])
    && isCareerSynthesis(value.career)
    && isWealthSynthesis(value.wealth)
    && Array.isArray(value.evidence) && value.evidence.every(isSelectedPeriodEvidence)
    && Array.isArray(value.missingInputs) && value.missingInputs.every(isMissingInput)
    && isSynthesisProvenance(value.provenance)
    && isOneOf(value.qualificationStatus, ['CANONICAL', 'PROVISIONAL', 'UNAVAILABLE']);
}

function isPeriod(value: unknown): value is ExportedPeriodV1 {
  if (!isRecord(value) || !onlyKeys(value, [
    'selectedPeriodId', 'mahadashaId', 'mahadashaPlanet', 'antardashaId',
    'antardashaPlanet', 'start', 'end', 'analysisAsOf', 'temporalRelation', 'deterministicSynthesis'
  ])) return false;
  return ['selectedPeriodId', 'mahadashaId', 'mahadashaPlanet', 'antardashaId',
    'antardashaPlanet', 'start', 'end', 'analysisAsOf'].every((key) => isString(value[key]))
    && Number.isFinite(Date.parse(value.start as string))
    && Number.isFinite(Date.parse(value.end as string))
    && Date.parse(value.start as string) < Date.parse(value.end as string)
    && Number.isFinite(Date.parse(value.analysisAsOf as string))
    && ['PAST', 'CURRENT', 'FUTURE', 'UNKNOWN'].includes(String(value.temporalRelation))
    && isSelectedPeriodSynthesis(value.deterministicSynthesis);
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
