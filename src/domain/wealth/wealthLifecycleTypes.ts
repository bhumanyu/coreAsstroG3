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
  readonly natalEvidenceFamilies?: readonly string[];
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
      readonly natalEvidenceIds: readonly string[];
      readonly natalRuleIds: readonly string[];
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
  { eventType: 'ACCUMULATION', validationStatus: 'VALIDATED', natalDimension: 'ACCUMULATION', natalEvidenceFamilies: Object.freeze(['SECOND_HOUSE', 'SECOND_LORD']), requiredEvidence: BASE_REQUIREMENTS, validationGap: 'Candidate denotes a chart-derived accumulation indication only, not verified asset ownership or cash balance.', releaseEnabled: true },
  { eventType: 'GAINS', validationStatus: 'VALIDATED', natalDimension: 'GAINS', natalEvidenceFamilies: Object.freeze(['ELEVENTH_HOUSE', 'ELEVENTH_LORD']), requiredEvidence: BASE_REQUIREMENTS, validationGap: 'Candidate denotes a chart-derived gains indication only, not verified income, realized gains, or cash receipt.', releaseEnabled: true },
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
function natalSupport(item: DomainEvidence, dimension: WealthDimension, allowedFamilies: readonly string[] = []): boolean {
  return item.domain === 'WEALTH' && item.phase === 'NATAL_PROMISE' && item.dimension === dimension &&
    item.source === 'D1' && item.polarity === 'SUPPORTING' &&
    (allowedFamilies.length === 0 || (item.evidenceFamily !== undefined && allowedFamilies.includes(item.evidenceFamily))) &&
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
    const dimension = rule.natalDimension;
    if (!rule.releaseEnabled || rule.validationStatus !== 'VALIDATED') {
      diagnostics.push({ code: 'UNVALIDATED_EVENT_RULES', eventType: rule.eventType, message: rule.eventType + ' is not enabled: ' + rule.validationGap, evidenceOccurrenceIds: [] });
    }
    if (!dimension) continue;
    const periods = input.periodTimingActivations ?? [];
    const cw05Dimension = cw05?.dimensions?.[dimension];
    const canonicalNatalIds = new Set([
      ...(cw05?.natalEvidenceIds ?? []),
      ...(cw05Dimension?.natalEvidenceIds ?? [])
    ]);
    const canonicalNatalRules = new Set(cw05Dimension?.natalRuleIds ?? []);
    const natal = evidence.filter(item =>
      natalSupport(item, dimension, rule.natalEvidenceFamilies) &&
      canonicalNatalIds.has(item.id) &&
      Boolean(item.ruleId && canonicalNatalRules.has(item.ruleId))
    );
    const promiseIds = new Set(natal.map(item => item.id));
    const conflicts = dimensionConflicts(evidence, dimension);
    const cw05PromiseAvailable = Boolean(cw05Dimension &&
      !['INSUFFICIENT_DATA', 'CHALLENGED'].includes(cw05Dimension.promiseStatus) &&
      !['INSUFFICIENT_DATA', 'CHALLENGED'].includes(cw05Dimension.status) &&
      ['SUPPORT', 'MIXED'].includes(cw05Dimension.activationStatus));
    if (natal.length === 0 || !cw05PromiseAvailable) {
      diagnostics.push({ code: 'NO_NATAL_PROMISE', eventType: rule.eventType, message: 'A qualified D1 natal ' + dimension + ' promise is not present in both source evidence and CW-05; Dasha alone cannot create this lifecycle event.', evidenceOccurrenceIds: [] });
      if (hasDashaEvidence) diagnostics.push({ code: 'DASHA_ONLY_SUPPRESSED', eventType: rule.eventType, message: 'Dasha evidence exists without the required supported natal ' + dimension + ' promise; no event is emitted.', evidenceOccurrenceIds: evidence.filter(item => item.phase === 'DASHA_ACTIVATION').map(item => item.id) });
      continue;
    }
    if (conflicts.length > 0) {
      diagnostics.push({ code: 'CONFLICTING_NATAL_EVIDENCE', eventType: rule.eventType, message: 'Supporting and challenging natal ' + dimension + ' evidence coexist; lifecycle qualification is withheld.', evidenceOccurrenceIds: conflicts.map(item => item.id) });
      continue;
    }
    const qualifiedPeriods = periods.map(periodInput => ({ periodInput, activationIds: linkedActivation(periodInput, evidence, promiseIds) }))
      .filter(item => item.activationIds.length > 0);
    if (qualifiedPeriods.length === 0) {
      diagnostics.push({ code: periods.length === 0 ? 'MISSING_DASHA_ACTIVATION' : 'UNLINKED_DASHA_SUPPRESSED', eventType: rule.eventType, message: 'Natal promise exists, but no accepted MD/AD/PD supporting activation occurrence links back to it.', evidenceOccurrenceIds: natal.map(item => item.id) });
      continue;
    }
    for (const qualified of qualifiedPeriods) {
      const sourcePeriod = qualified.periodInput;
      const period = sourcePeriod.periodTimingActivation;
      const intervalValid = validDateOnly(sourcePeriod.interval.start) && validDateOnly(sourcePeriod.interval.end) && sourcePeriod.interval.end > sourcePeriod.interval.start;
      if (!intervalValid) diagnostics.push({ code: 'INVALID_PERIOD_INTERVAL', eventType: rule.eventType, message: 'Linked ' + period.period + ' source period has an invalid date-only interval; candidate is untimed.', evidenceOccurrenceIds: qualified.activationIds });
      const dimensionKey = dimension.toLowerCase() as 'accumulation' | 'gains' | 'fortune' | 'speculation';
      const dimensionEffect = period.dimensions[dimensionKey];
      if (dimensionEffect !== 'ACTIVATES' && dimensionEffect !== 'PARTIALLY_ACTIVATES') continue;
      const conditional = dimensionEffect === 'PARTIALLY_ACTIVATES' || cw05Dimension?.status === 'MIXED';
      const activationEvidence = evidence.filter(item => qualified.activationIds.includes(item.id));
      const sourceOccurrences = [...natal, ...activationEvidence];
      const semanticIdentityIds = uniqueSorted(sourceOccurrences.map(item => item.identityKey?.trim() || item.id));
      const rootIdentityKeys = uniqueSorted([...natal.map(item => item.identityKey?.trim() || item.id), ...sourceOccurrences.flatMap(item => item.rootEvidenceIds ?? [])]);
      const ruleIds = uniqueSorted(sourceOccurrences.map(item => item.ruleId ?? '').filter(Boolean));
      const limitations = Object.freeze([
        'This is an astrological lifecycle indication candidate, not a verified financial event.',
        'No asset ownership, amount, income, realized gain, transaction, or cash receipt is asserted.',
        'Candidate timing is copied from the source Dasha period; no dates are inferred or extended.',
        'No guarantee or numeric probability is available.',
        'CW-05 remains the final authority for the Wealth domain.'
      ]);
      candidateWindows.push(Object.freeze({
        candidateId: 'C04:' + rule.eventType + ':' + sourcePeriod.sourcePeriodId,
        eventType: rule.eventType,
        status: conditional ? 'CONDITIONAL' : 'CANDIDATE',
        timing: intervalValid
          ? { type: 'DASHA_PERIOD_WINDOW' as const, level: period.period, start: sourcePeriod.interval.start, end: sourcePeriod.interval.end, precision: 'PERIOD_ONLY' as const }
          : { type: 'UNTIMED' as const, level: period.period, precision: 'UNTIMED' as const },
        sourcePeriodId: sourcePeriod.sourcePeriodId,
        natalPromiseOccurrenceIds: uniqueSorted(natal.map(item => item.id)),
        activationOccurrenceIds: qualified.activationIds,
        evidenceOccurrenceIds: uniqueSorted(sourceOccurrences.map(item => item.id)),
        semanticIdentityIds,
        rootIdentityKeys,
        ruleIds,
        conditions: Object.freeze(['D1_NATAL_PROMISE_PRESENT', 'CW05_DIMENSION_PROMISE_PRESENT', 'DASHA_OCCURRENCE_LINKED_TO_NATAL_PROMISE', 'NO_NATAL_CONFLICT', ...(conditional ? ['PARTIAL_ACTIVATION_OR_MIXED_CW05_STATUS'] : [])]),
        counterEvidenceOccurrenceIds: Object.freeze([]),
        financialFactReportIds: Object.freeze([]),
        limitations,
        guarantee: 'NONE',
        numericProbabilityAvailable: false
      }));
    }
  }
  // Overlapping MD/AD/PD source windows are deliberately kept distinct rather than merged.
  const sourcePeriods = (input.periodTimingActivations ?? []).filter(item => validDateOnly(item.interval.start) && validDateOnly(item.interval.end) && item.interval.end > item.interval.start);
  for (let i = 0; i < sourcePeriods.length; i++) {
    for (let j = i + 1; j < sourcePeriods.length; j++) {
      const a = sourcePeriods[i]; const b = sourcePeriods[j];
      if (a.interval.start < b.interval.end && b.interval.start < a.interval.end) {
        diagnostics.push({ code: 'OVERLAPPING_WINDOWS_PRESERVED', message: 'Overlapping ' + a.periodTimingActivation.period + ' and ' + b.periodTimingActivation.period + ' Dasha source windows are retained separately; no synthetic interval is created.', evidenceOccurrenceIds: uniqueSorted([...a.periodTimingActivation.evidenceIds, ...b.periodTimingActivation.evidenceIds]) });
      }
    }
  }
  if (candidateWindows.length === 0) diagnostics.push({ code: 'NO_QUALIFIED_CANDIDATE', message: 'No Wealth lifecycle candidate passed its event-specific natal promise, CW-05 and linked-activation gates. No real-world financial event is asserted.', evidenceOccurrenceIds: [] });
  const sortedDiagnostics = diagnostics.sort((a, b) => compare(a.code, b.code) || compare(a.eventType ?? '', b.eventType ?? '') || compare(a.message, b.message))
    .map(item => Object.freeze({ ...item, evidenceOccurrenceIds: uniqueSorted(item.evidenceOccurrenceIds) }));
  const status: WealthLifecycleCandidateAvailability = candidateWindows.length > 0
    ? (candidateWindows.some(item => item.status === 'CONDITIONAL' || item.timing.type === 'UNTIMED') ? 'CONDITIONAL' : 'CANDIDATES_AVAILABLE')
    : evidence.length === 0 ? 'INSUFFICIENT'
      : sortedDiagnostics.some(item => item.code === 'CONFLICTING_NATAL_EVIDENCE') ? 'PARTIAL' : 'UNRESOLVED';
  return Object.freeze({
    reasoningVersion: 'C04', methodVersion: WEALTH_LIFECYCLE_VERSION, status,
    taxonomy: WEALTH_LIFECYCLE_RULE_CATALOGUE, candidateWindows: Object.freeze(candidateWindows),
    diagnostics: Object.freeze(sortedDiagnostics), observedFinancialFactReportIds,
    actualFinancialEventsInferred: false, guaranteedEventsAvailable: false, numericProbabilityAvailable: false,
    finalAuthority: 'CW-05',
    statement: 'C04 reports qualified lifecycle indications and candidate windows only. It does not assert real-world assets, debt, liquidity, inheritance, gains, repayment, loss, or recovery. CW-05 remains the final Wealth authority.'
  });
}