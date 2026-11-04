import type { WealthDimension, WealthPeriodTimingActivation } from './wealthTypes';
import type { DomainEvidence } from '../interpretation/DomainEvidence';
import type { WealthFinancialDataSet } from './wealthFinancialData';

/** C04: deterministic downstream lifecycle candidate contract; never asserts an observed event. */
export const WEALTH_LIFECYCLE_VERSION = 'C04-WEALTH-LIFECYCLE-v1' as const;

export type WealthLifecycleEventType =
  | 'ACCUMULATION' | 'GAINS' | 'ASSET_BUILDING_INDICATION' | 'PRESERVATION'
  | 'EROSION_CHALLENGE' | 'DEBT_EXPOSURE_INDICATION' | 'DEBT_REPAYMENT_REDUCTION_INDICATION'
  | 'LIQUIDITY_PRESSURE' | 'LIQUIDITY_RELIEF' | 'RECOVERY' | 'INHERITANCE_INDICATION';
export type WealthLifecycleEventStatus = 'CANDIDATE' | 'CONDITIONAL' | 'CONFLICTED' | 'UNAVAILABLE';
export type WealthLifecycleCandidateAvailability = 'CANDIDATES_AVAILABLE' | 'CONDITIONAL' | 'PARTIAL' | 'UNRESOLVED' | 'INSUFFICIENT';
export type WealthLifecycleWindowPrecision = 'EXACT_SOURCE_INTERVAL' | 'PERIOD_ONLY' | 'UNTIMED';
export type WealthLifecycleEvidenceRequirement =
  | 'NATAL_WEALTH_INDICATION' | 'DIMENSION_MATCHED_NATAL_EVIDENCE' | 'LINKED_DASHA_ACTIVATION'
  | 'LINKED_DASHA_CHALLENGE' | 'CW05_AUTHORITY_PRESERVED' | 'CONFLICT_REVIEWED'
  | 'FINANCIAL_FACT_SEPARATED' | 'SOURCE_INTERVAL_VALIDATED';

export interface WealthLifecycleEventRuleContract {
  readonly eventType: WealthLifecycleEventType;
  readonly validationStatus: 'UNVALIDATED' | 'VALIDATED';
  readonly natalDimension?: WealthDimension;
  readonly requiredEvidence: readonly WealthLifecycleEvidenceRequirement[];
  readonly validationGap: string;
  readonly releaseEnabled: boolean;
}

export interface WealthLifecycleCandidateWindow {
  readonly candidateId: string;
  readonly eventType: WealthLifecycleEventType;
  readonly status: WealthLifecycleEventStatus;
  readonly timing: {
    readonly type: 'DASHA_PERIOD_WINDOW' | 'UNTIMED';
    readonly level?: 'MD' | 'AD' | 'PD';
    readonly start?: string;
    readonly end?: string;
    readonly precision: WealthLifecycleWindowPrecision;
  };
  readonly sourcePeriodId?: string;
  readonly natalPromiseOccurrenceIds: readonly string[];
  readonly activationOccurrenceIds: readonly string[];
  readonly evidenceOccurrenceIds: readonly string[];
  readonly semanticIdentityIds: readonly string[];
  readonly rootIdentityKeys: readonly string[];
  readonly ruleIds: readonly string[];
  readonly conditions: readonly string[];
  readonly counterEvidenceOccurrenceIds: readonly string[];
  readonly financialFactReportIds: readonly string[];
  readonly limitations: readonly string[];
  readonly guarantee: 'NONE';
  readonly numericProbabilityAvailable: false;
}

export type WealthLifecycleDiagnosticCode =
  | 'NO_NATAL_PROMISE' | 'DASHA_ONLY_SUPPRESSED' | 'MISSING_DASHA_ACTIVATION'
  | 'UNLINKED_DASHA_SUPPRESSED' | 'MISSING_CW05_AUTHORITY' | 'CONFLICTING_NATAL_EVIDENCE'
  | 'UNVALIDATED_EVENT_RULES' | 'FINANCIAL_FACTS_NOT_ASTROLOGICAL_EVIDENCE'
  | 'INVALID_PERIOD_INTERVAL' | 'OVERLAPPING_WINDOWS_PRESERVED' | 'NO_QUALIFIED_CANDIDATE';
export interface WealthLifecycleDiagnostic {
  readonly code: WealthLifecycleDiagnosticCode;
  readonly message: string;
  readonly eventType?: WealthLifecycleEventType;
  readonly evidenceOccurrenceIds: readonly string[];
}

export interface WealthLifecycleAnalysis {
  readonly reasoningVersion: 'C04';
  readonly methodVersion: typeof WEALTH_LIFECYCLE_VERSION;
  readonly status: WealthLifecycleCandidateAvailability;
  readonly taxonomy: readonly WealthLifecycleEventRuleContract[];
  readonly candidateWindows: readonly WealthLifecycleCandidateWindow[];
  readonly diagnostics: readonly WealthLifecycleDiagnostic[];
  readonly observedFinancialFactReportIds: readonly string[];
  readonly actualFinancialEventsInferred: false;
  readonly guaranteedEventsAvailable: false;
  readonly numericProbabilityAvailable: false;
  readonly finalAuthority: 'CW-05';
  readonly statement: string;
}

export interface WealthLifecyclePeriodInput {
  readonly periodTimingActivation: WealthPeriodTimingActivation;
  readonly interval: { readonly start: string; readonly end: string };
  readonly sourcePeriodId: string;
}

export interface WealthLifecycleInput {
  readonly evidence: readonly DomainEvidence[];
  readonly periodTimingActivations?: readonly WealthLifecyclePeriodInput[];
  readonly cw05?: {
    readonly reasoningVersion: 'CW-05';
    readonly domain: 'WEALTH';
    readonly finalStatus: string;
    readonly dimensions?: Readonly<Record<WealthDimension, {
      readonly status: string;
      readonly promiseStatus: string;
      readonly activationStatus: string;
      readonly timingStatus: string;
      readonly evidenceIds?: readonly string[];
    }>>;
    readonly natalEvidenceIds: readonly string[];
    readonly ruleIds: readonly string[];
  };
  readonly financialData?: WealthFinancialDataSet;
}

const BASE_REQUIREMENTS: readonly WealthLifecycleEvidenceRequirement[] = Object.freeze([
  'NATAL_WEALTH_INDICATION', 'DIMENSION_MATCHED_NATAL_EVIDENCE', 'LINKED_DASHA_ACTIVATION',
  'CW05_AUTHORITY_PRESERVED', 'CONFLICT_REVIEWED', 'FINANCIAL_FACT_SEPARATED'
]);

export const WEALTH_LIFECYCLE_RULE_CATALOGUE: readonly WealthLifecycleEventRuleContract[] = Object.freeze([
  { eventType: 'ACCUMULATION', validationStatus: 'UNVALIDATED', natalDimension: 'ACCUMULATION', requiredEvidence: BASE_REQUIREMENTS, validationGap: 'A distinct lifecycle-event rule and independent golden fixtures have not been approved; CW-05 Accumulation remains a natal dimension, not an event.', releaseEnabled: false },
  { eventType: 'GAINS', validationStatus: 'UNVALIDATED', natalDimension: 'GAINS', requiredEvidence: BASE_REQUIREMENTS, validationGap: 'A distinct gains-event rule and independent golden fixtures have not been approved; CW-05 Gains remains a natal dimension, not an event.', releaseEnabled: false },
  { eventType: 'ASSET_BUILDING_INDICATION', validationStatus: 'UNVALIDATED', natalDimension: 'ACCUMULATION', requiredEvidence: BASE_REQUIREMENTS, validationGap: 'No validated asset-acquisition rule exists; ownership/acquisition is not asserted.', releaseEnabled: false },
  { eventType: 'PRESERVATION', validationStatus: 'UNVALIDATED', natalDimension: 'ACCUMULATION', requiredEvidence: BASE_REQUIREMENTS, validationGap: 'No dedicated preservation evidence family or validated event rule exists.', releaseEnabled: false },
  { eventType: 'EROSION_CHALLENGE', validationStatus: 'UNVALIDATED', natalDimension: 'ACCUMULATION', requiredEvidence: Object.freeze([...BASE_REQUIREMENTS, 'LINKED_DASHA_CHALLENGE']), validationGap: 'Challenge activation does not establish actual asset erosion or financial loss.', releaseEnabled: false },
  { eventType: 'DEBT_EXPOSURE_INDICATION', validationStatus: 'UNVALIDATED', requiredEvidence: BASE_REQUIREMENTS, validationGap: 'There is no canonical Debt dimension or validated debt-indication evidence contract.', releaseEnabled: false },
  { eventType: 'DEBT_REPAYMENT_REDUCTION_INDICATION', validationStatus: 'UNVALIDATED', requiredEvidence: BASE_REQUIREMENTS, validationGap: 'There is no debt-balance lifecycle rule; actual reduction requires financial facts.', releaseEnabled: false },
  { eventType: 'LIQUIDITY_PRESSURE', validationStatus: 'UNVALIDATED', requiredEvidence: Object.freeze([...BASE_REQUIREMENTS, 'LINKED_DASHA_CHALLENGE']), validationGap: 'No liquidity evidence family or validated liquidity-pressure rule exists.', releaseEnabled: false },
  { eventType: 'LIQUIDITY_RELIEF', validationStatus: 'UNVALIDATED', requiredEvidence: BASE_REQUIREMENTS, validationGap: 'No liquidity-relief evidence family or validated rule exists; actual liquidity requires financial facts.', releaseEnabled: false },
  { eventType: 'RECOVERY', validationStatus: 'UNVALIDATED', natalDimension: 'ACCUMULATION', requiredEvidence: Object.freeze([...BASE_REQUIREMENTS, 'LINKED_DASHA_CHALLENGE']), validationGap: 'No ordered prior-challenge-to-subsequent-support Wealth recovery rule is validated.', releaseEnabled: false },
  { eventType: 'INHERITANCE_INDICATION', validationStatus: 'UNVALIDATED', natalDimension: 'FORTUNE', requiredEvidence: BASE_REQUIREMENTS, validationGap: 'No dedicated inheritance rule or golden fixture exists; actual receipt remains an external observed fact.', releaseEnabled: false }
]);

const compare = (a: string, b: string): number => a < b ? -1 : a > b ? 1 : 0;
const uniqueSorted = (values: readonly string[]): readonly string[] => Object.freeze([...new Set(values.filter(value => typeof value === 'string' && value.trim().length > 0))].sort(compare));
function validDateOnly(value: string): boolean {
  if (!/^\\d{4}-\\d{2}-\\d{2}$/.test(value)) return false;
  const date = new Date(value + 'T00:00:00.000Z');
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}
function financialFactIds(dataset?: WealthFinancialDataSet): readonly string[] {
  if (!dataset) return Object.freeze([]);
  return Object.freeze(dataset.data.filter(item => item.availability === 'AVAILABLE' &&
    (item.sourceClassification === 'USER_REPORTED_FINANCIAL_FACT' || item.sourceClassification === 'CONNECTED_FINANCIAL_SOURCE'))
    .map(item => item.id).sort(compare));
}
function natalSupport(item: DomainEvidence, dimension: WealthDimension): boolean {
  return item.domain === 'WEALTH' && item.phase === 'NATAL_PROMISE' && item.dimension === dimension &&
    item.source === 'D1' && item.polarity === 'SUPPORTING' &&
    Boolean(item.ruleId?.trim()) && Boolean(item.identityKey?.trim() || item.id.trim());
}
function linkedActivation(periodInput: WealthLifecyclePeriodInput, evidence: readonly DomainEvidence[], promiseIds: ReadonlySet<string>): readonly string[] {
  const period = periodInput.periodTimingActivation;
  const linked = evidence.filter(item => item.domain === 'WEALTH' && item.phase === 'DASHA_ACTIVATION' &&
    item.timing?.period === period.period && period.evidenceIds.includes(item.id) &&
    item.polarity === 'SUPPORTING' && item.relatedEvidenceIds.some(id => promiseIds.has(id)));
  return uniqueSorted(linked.map(item => item.id));
}
function dimensionConflicts(evidence: readonly DomainEvidence[], dimension: WealthDimension): readonly DomainEvidence[] {
  const natal = evidence.filter(item => item.domain === 'WEALTH' && item.phase === 'NATAL_PROMISE' && item.dimension === dimension);
  return natal.some(item => item.polarity === 'SUPPORTING') && natal.some(item => item.polarity === 'CHALLENGING')
    ? natal.filter(item => item.polarity === 'CHALLENGING') : Object.freeze([]);
}

/** C04 fails closed: no taxonomy category is enabled before its own rule has validation and golden fixtures. */
export function buildWealthLifecycleAnalysis(input: WealthLifecycleInput): WealthLifecycleAnalysis {
  const evidence = input.evidence.filter(item => item.domain === 'WEALTH');
  const observedFinancialFactReportIds = financialFactIds(input.financialData);
  const diagnostics: WealthLifecycleDiagnostic[] = [];
  const candidateWindows: WealthLifecycleCandidateWindow[] = [];
  const hasDashaEvidence = evidence.some(item => item.phase === 'DASHA_ACTIVATION');
  const cw05 = input.cw05;
  if (!cw05 || cw05.reasoningVersion !== 'CW-05' || cw05.domain !== 'WEALTH') {
    diagnostics.push({ code: 'MISSING_CW05_AUTHORITY', message: 'CW-05 Wealth final synthesis is unavailable; C04 will not produce lifecycle candidates.', evidenceOccurrenceIds: [] });
  }
  if (observedFinancialFactReportIds.length > 0) {
    diagnostics.push({ code: 'FINANCIAL_FACTS_NOT_ASTROLOGICAL_EVIDENCE', message: 'User-reported/connected financial facts remain in the C01 fact namespace and are not converted into astrology evidence or lifecycle events.', evidenceOccurrenceIds: observedFinancialFactReportIds });
  }
  for (const rule of WEALTH_LIFECYCLE_RULE_CATALOGUE) {
    diagnostics.push({ code: 'UNVALIDATED_EVENT_RULES', eventType: rule.eventType, message: rule.eventType + ' is not enabled: ' + rule.validationGap, evidenceOccurrenceIds: [] });
    const dimension = rule.natalDimension;
    if (!dimension) continue;
    const natal = evidence.filter(item => natalSupport(item, dimension));
    const promiseIds = new Set(natal.map(item => item.id));
    const conflicts = dimensionConflicts(evidence, dimension);
    const periods = input.periodTimingActivations ?? [];
    if (natal.length === 0) {
      diagnostics.push({ code: 'NO_NATAL_PROMISE', eventType: rule.eventType, message: 'No supported D1 natal ' + dimension + ' evidence exists; Dasha alone cannot create this lifecycle event.', evidenceOccurrenceIds: [] });
      if (hasDashaEvidence) diagnostics.push({ code: 'DASHA_ONLY_SUPPRESSED', eventType: rule.eventType, message: 'Dasha evidence exists without a supported natal ' + dimension + ' promise; no event is emitted.', evidenceOccurrenceIds: evidence.filter(item => item.phase === 'DASHA_ACTIVATION').map(item => item.id) });
    }
    if (conflicts.length > 0) diagnostics.push({ code: 'CONFLICTING_NATAL_EVIDENCE', eventType: rule.eventType, message: 'Supporting and challenging natal ' + dimension + ' evidence coexist; lifecycle qualification is withheld.', evidenceOccurrenceIds: conflicts.map(item => item.id) });
    if (natal.length > 0 && !periods.some(period => linkedActivation(period, evidence, promiseIds).length > 0)) {
      diagnostics.push({ code: periods.length === 0 ? 'MISSING_DASHA_ACTIVATION' : 'UNLINKED_DASHA_SUPPRESSED', eventType: rule.eventType, message: 'Natal promise exists, but no accepted MD/AD/PD activation occurrence links back to it.', evidenceOccurrenceIds: natal.map(item => item.id) });
    }
    for (const periodInput of periods) {
      if (linkedActivation(periodInput, evidence, promiseIds).length === 0) continue;
      const period = periodInput.periodTimingActivation;
      if (!validDateOnly(periodInput.interval.start) || !validDateOnly(periodInput.interval.end) || periodInput.interval.end <= periodInput.interval.start) {
        diagnostics.push({ code: 'INVALID_PERIOD_INTERVAL', eventType: rule.eventType, message: 'Linked ' + period.periodTimingActivation.period + ' source period has an invalid date-only interval; no dates are emitted.', evidenceOccurrenceIds: period.periodTimingActivation.evidenceIds });
      }
    }
  }
  if (candidateWindows.length === 0) diagnostics.push({ code: 'NO_QUALIFIED_CANDIDATE', message: 'No lifecycle event is enabled by a validated event-specific rule. No asset, debt, liquidity, recovery, erosion, or inheritance fact is asserted.', evidenceOccurrenceIds: [] });
  const sortedDiagnostics = diagnostics.sort((a, b) => compare(a.code, b.code) || compare(a.eventType ?? '', b.eventType ?? '') || compare(a.message, b.message))
    .map(item => Object.freeze({ ...item, evidenceOccurrenceIds: uniqueSorted(item.evidenceOccurrenceIds) }));
  const status: WealthLifecycleCandidateAvailability = evidence.length === 0 ? 'INSUFFICIENT' :
    sortedDiagnostics.some(item => item.code === 'CONFLICTING_NATAL_EVIDENCE') ? 'PARTIAL' : 'UNRESOLVED';
  return Object.freeze({
    reasoningVersion: 'C04', methodVersion: WEALTH_LIFECYCLE_VERSION, status,
    taxonomy: WEALTH_LIFECYCLE_RULE_CATALOGUE, candidateWindows: Object.freeze(candidateWindows),
    diagnostics: Object.freeze(sortedDiagnostics), observedFinancialFactReportIds,
    actualFinancialEventsInferred: false, guaranteedEventsAvailable: false, numericProbabilityAvailable: false,
    finalAuthority: 'CW-05',
    statement: 'C04 reports qualified lifecycle indications and candidate windows only. It does not assert real-world assets, debt, liquidity, inheritance, gains, repayment, loss, or recovery. CW-05 remains the final Wealth authority.'
  });
}