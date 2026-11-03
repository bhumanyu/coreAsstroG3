import type { CareerNatalAnalysis } from '../careerNatalAnalysis';
import type { CareerDashaCanonicalAnalysis } from '../careerDasha/careerDashaCanonicalTypes';
import type { CareerD10CanonicalAnalysis } from '../careerD10/careerD10CanonicalTypes';
import type { CareerFinalSynthesisResult } from './careerFinalSynthesisTypes';
import { isNatalStrengthMappable } from '../canonicalCareerEvidenceMapper';

export const CAREER_ANALYTICAL_AXES_VERSION = 'B01-AXIS-PROJECTION-v1' as const;

export type CareerAnalyticalAxisStatus =
  | 'AVAILABLE'
  | 'PARTIAL'
  | 'UNAVAILABLE'
  | 'INSUFFICIENT'
  | 'BLOCKED'
  | 'NOT_APPLICABLE';

export type CareerAxisCoverageStatus = 'COMPLETE' | 'PARTIAL' | 'INSUFFICIENT';

export interface CareerAxisCoverage {
  readonly status: CareerAxisCoverageStatus;
  readonly availableSources: readonly string[];
  readonly missingSources: readonly string[];
  readonly evidenceOccurrenceCount: number;
}

export interface CareerAxisConfidence {
  /** Axis confidence is not inferred from C11's overall confidence. */
  readonly status: 'NOT_ASSESSED';
  readonly reason: string;
}

interface CareerAnalyticalAxisBase<TResult> {
  readonly status: CareerAnalyticalAxisStatus;
  readonly result: TResult | null;
  /** Original evidence occurrence/source IDs; never semantic identity keys. */
  readonly supportingEvidenceOccurrenceIds: readonly string[];
  readonly conflictingEvidenceOccurrenceIds: readonly string[];
  readonly ruleIds: readonly string[];
  readonly coverage: CareerAxisCoverage;
  readonly confidence: CareerAxisConfidence;
  readonly methodVersion: typeof CAREER_ANALYTICAL_AXES_VERSION;
  readonly unavailableReason?: string;
  readonly diagnostic?: string;
}

export interface CareerPromiseAxisResult {
  readonly direction: CareerNatalAnalysis['structural']['direction'];
  readonly strength: CareerNatalAnalysis['structural']['strength'];
}

export interface CareerActivationAxisResult {
  readonly direction: CareerDashaCanonicalAnalysis['overallDirection'];
  readonly effect: CareerDashaCanonicalAnalysis['overallEffect'];
  readonly strength: CareerDashaCanonicalAnalysis['overallStrength'];
  readonly dominantLevel: CareerDashaCanonicalAnalysis['dominantLevel'];
}

export interface CareerSustainabilityAxisResult {
  readonly assessment: 'NOT_ASSESSED';
  readonly requiredEvidenceFamily: 'CAREER_SUSTAINABILITY';
}

export interface CareerRiskAxisResult {
  readonly assessment: 'ADVERSE_EVIDENCE_PRESENT' | 'NO_ADVERSE_EVIDENCE_IN_AVAILABLE_SOURCES';
  readonly conflictCount: number;
}

export interface CareerTimingCandidateWindow {
  readonly level: 'MD' | 'AD' | 'PD';
  readonly planet?: string;
  readonly start?: string;
  readonly end?: string;
  readonly dated: boolean;
  readonly effect: CareerDashaCanonicalAnalysis['overallEffect'];
  readonly direction: CareerDashaCanonicalAnalysis['overallDirection'];
  readonly strength: CareerDashaCanonicalAnalysis['overallStrength'];
  readonly activatedPromiseEvidenceIds: readonly string[];
  readonly supportingEvidenceOccurrenceIds: readonly string[];
  readonly ruleIds: readonly string[];
}

export interface CareerTimingAxisResult {
  readonly candidateWindows: readonly CareerTimingCandidateWindow[];
  readonly untimedLevels: readonly ('MD' | 'AD' | 'PD')[];
  readonly guarantee: 'NONE';
}

export type CareerPromiseAxis = CareerAnalyticalAxisBase<CareerPromiseAxisResult> & {
  readonly axis: 'PROMISE';
};

export type CareerActivationAxis = CareerAnalyticalAxisBase<CareerActivationAxisResult> & {
  readonly axis: 'ACTIVATION';
};

export type CareerSustainabilityAxis = CareerAnalyticalAxisBase<CareerSustainabilityAxisResult> & {
  readonly axis: 'SUSTAINABILITY';
};

export type CareerRiskAxis = CareerAnalyticalAxisBase<CareerRiskAxisResult> & {
  readonly axis: 'RISK';
};

export type CareerTimingAxis = CareerAnalyticalAxisBase<CareerTimingAxisResult> & {
  readonly axis: 'TIMING';
};

export interface CareerAnalyticalAxes {
  readonly version: typeof CAREER_ANALYTICAL_AXES_VERSION;
  readonly promise: CareerPromiseAxis;
  readonly activation: CareerActivationAxis;
  readonly sustainability: CareerSustainabilityAxis;
  readonly risk: CareerRiskAxis;
  readonly timing: CareerTimingAxis;
}

interface CareerAnalyticalAxesInput {
  readonly natal: CareerNatalAnalysis;
  readonly dasha: CareerDashaCanonicalAnalysis;
  readonly d10: CareerD10CanonicalAnalysis;
  readonly finalSynthesis: CareerFinalSynthesisResult;
}

function sortedUnique(values: readonly string[]): readonly string[] {
  return Object.freeze(
    [...new Set(values.filter(value => typeof value === 'string' && value.trim().length > 0))]
      .sort((a, b) => a.localeCompare(b))
  );
}

function sourceIds(values: readonly { readonly sourceIds: readonly string[] }[]): readonly string[] {
  return sortedUnique(values.flatMap(value => value.sourceIds));
}

function ruleIds(values: readonly string[]): readonly string[] {
  return sortedUnique(values);
}

function confidenceNotAssessed(reason: string): CareerAxisConfidence {
  return Object.freeze({ status: 'NOT_ASSESSED', reason });
}

function coverage(
  status: CareerAxisCoverageStatus,
  availableSources: readonly string[],
  missingSources: readonly string[],
  evidenceOccurrenceCount: number
): CareerAxisCoverage {
  return Object.freeze({
    status,
    availableSources: sortedUnique(availableSources),
    missingSources: sortedUnique(missingSources),
    evidenceOccurrenceCount
  });
}

function makePromiseAxis(natal: CareerNatalAnalysis): CareerPromiseAxis {
  const eligibleEvidence = natal.evidence.filter(item => isNatalStrengthMappable(item.strength));
  const supporting = eligibleEvidence
    .filter(item => item.direction === 'SUPPORT')
    .flatMap(item => item.sourceIds);
  const conflicting = eligibleEvidence
    .filter(item => item.direction === 'CHALLENGE' || item.direction === 'MIXED')
    .flatMap(item => item.sourceIds);
  const hasClassification =
    natal.structural.direction !== 'UNAVAILABLE' &&
    natal.structural.strength !== 'UNDETERMINED';
  const status: CareerAnalyticalAxisStatus = hasClassification && eligibleEvidence.length > 0
    ? 'AVAILABLE'
    : eligibleEvidence.length > 0
      ? 'PARTIAL'
      : 'INSUFFICIENT';

  return Object.freeze({
    axis: 'PROMISE',
    status,
    result: hasClassification
      ? Object.freeze({
          direction: natal.structural.direction,
          strength: natal.structural.strength
        })
      : null,
    supportingEvidenceOccurrenceIds: sortedUnique(supporting),
    conflictingEvidenceOccurrenceIds: sortedUnique(conflicting),
    ruleIds: ruleIds(eligibleEvidence.map(item => item.ruleId ?? '')),
    coverage: coverage(
      status === 'AVAILABLE' ? 'COMPLETE' : status === 'PARTIAL' ? 'PARTIAL' : 'INSUFFICIENT',
      eligibleEvidence.length > 0 ? ['C4_C7_NATAL'] : [],
      eligibleEvidence.length > 0 && hasClassification ? [] : ['C4_C7_NATAL_CLASSIFICATION'],
      sortedUnique(eligibleEvidence.flatMap(item => item.sourceIds)).length
    ),
    confidence: confidenceNotAssessed('No axis-specific natal confidence contract exists; C11 overall confidence is not copied.'),
    methodVersion: CAREER_ANALYTICAL_AXES_VERSION,
    ...(status === 'INSUFFICIENT'
      ? { unavailableReason: 'Canonical natal evidence is absent or not mappable.' }
      : {}),
    ...(status === 'PARTIAL'
      ? { diagnostic: 'Natal evidence exists, but the canonical structural classification is incomplete.' }
      : {})
  });
}

function makeActivationAxis(dasha: CareerDashaCanonicalAnalysis): CareerActivationAxis {
  const hierarchy = dasha.hierarchy;
  const evidence = dasha.evidence;
  const validDirection = dasha.overallDirection !== 'UNAVAILABLE';
  const hasEvidence = evidence.length > 0;
  const completeLevels = hierarchy
    ? [hierarchy.md, hierarchy.ad, hierarchy.pd].filter(
        item => item.direction !== 'UNAVAILABLE' && item.effect !== 'UNKNOWN' && item.effect !== 'INSUFFICIENT_DATA'
      ).length
    : 0;
  const status: CareerAnalyticalAxisStatus = !hierarchy
    ? (hasEvidence ? 'PARTIAL' : 'UNAVAILABLE')
    : validDirection && completeLevels === 3
      ? 'AVAILABLE'
      : hasEvidence || completeLevels > 0
        ? 'PARTIAL'
        : 'INSUFFICIENT';

  const supporting = evidence
    .filter(item => item.direction === 'SUPPORT')
    .flatMap(item => item.sourceIds);
  const conflicting = evidence
    .filter(item => item.direction === 'CHALLENGE' || item.direction === 'MIXED')
    .flatMap(item => item.sourceIds);
  const allRuleIds = evidence.flatMap(item => item.provenance.ruleIds ?? []);

  return Object.freeze({
    axis: 'ACTIVATION',
    status,
    result: hierarchy
      ? Object.freeze({
          direction: dasha.overallDirection,
          effect: dasha.overallEffect,
          strength: dasha.overallStrength,
          dominantLevel: dasha.dominantLevel
        })
      : null,
    supportingEvidenceOccurrenceIds: sortedUnique(supporting),
    conflictingEvidenceOccurrenceIds: sortedUnique(conflicting),
    ruleIds: ruleIds(allRuleIds),
    coverage: coverage(
      status === 'AVAILABLE' ? 'COMPLETE' : status === 'PARTIAL' ? 'PARTIAL' : 'INSUFFICIENT',
      hasEvidence ? ['C9_DASHA_EVIDENCE'] : [],
      hierarchy ? (completeLevels < 3 ? ['C9_DASHA_PERIOD_LEVELS'] : []) : ['C9_DASHA_HIERARCHY'],
      sourceIds(evidence).length
    ),
    confidence: confidenceNotAssessed('C9 provides activation strength and evidence, but no axis-specific confidence scale.'),
    methodVersion: CAREER_ANALYTICAL_AXES_VERSION,
    ...(!hierarchy
      ? { unavailableReason: 'Canonical MD/AD/PD activation hierarchy is unavailable.' }
      : {}),
    ...(hierarchy && status === 'PARTIAL'
      ? { diagnostic: 'The canonical hierarchy is present, but one or more period levels lack usable activation evidence.' }
      : {})
  });
}

function makeSustainabilityAxis(): CareerSustainabilityAxis {
  return Object.freeze({
    axis: 'SUSTAINABILITY',
    status: 'UNAVAILABLE',
    result: Object.freeze({
      assessment: 'NOT_ASSESSED',
      requiredEvidenceFamily: 'CAREER_SUSTAINABILITY'
    }),
    supportingEvidenceOccurrenceIds: Object.freeze([]),
    conflictingEvidenceOccurrenceIds: Object.freeze([]),
    ruleIds: Object.freeze([]),
    coverage: coverage('INSUFFICIENT', [], ['CAREER_SUSTAINABILITY_EVIDENCE'], 0),
    confidence: confidenceNotAssessed('No canonical sustainability evidence family or validated continuity/repeatability contract is present.'),
    methodVersion: CAREER_ANALYTICAL_AXES_VERSION,
    unavailableReason: 'Sustainability cannot be inferred from a single positive event, C8 expression, C10 D10 qualification, or C11 promise.'
  });
}

function makeRiskAxis(
  natal: CareerNatalAnalysis,
  dasha: CareerDashaCanonicalAnalysis,
  d10: CareerD10CanonicalAnalysis,
  finalSynthesis: CareerFinalSynthesisResult
): CareerRiskAxis {
  const natalRisk = natal.evidence
    .filter(item => item.direction === 'CHALLENGE' || item.direction === 'MIXED')
    .flatMap(item => item.sourceIds);
  const dashaRisk = dasha.evidence
    .filter(item => item.direction === 'CHALLENGE' || item.direction === 'MIXED' || item.effect === 'CHALLENGES')
    .flatMap(item => item.sourceIds);
  const d10Risk = d10.evidence
    .filter(item => item.direction === 'CHALLENGE' || item.d10Effect === 'CHALLENGES')
    .flatMap(item => item.sourceIds);
  const adverseOccurrences = sortedUnique([...natalRisk, ...dashaRisk, ...d10Risk]);

  const identityToOccurrences = new Map<string, string[]>();
  const addIdentityOccurrences = (identity: string, occurrences: readonly string[]) => {
    identityToOccurrences.set(
      identity,
      [...(identityToOccurrences.get(identity) ?? []), ...occurrences]
    );
  };
  for (const item of natal.evidence) addIdentityOccurrences(item.identityKey, item.sourceIds);
  for (const item of dasha.evidence) addIdentityOccurrences(item.identityKey, item.sourceIds);
  for (const item of d10.evidence) addIdentityOccurrences(item.identityKey, item.sourceIds);

  const c11RiskSupport = finalSynthesis.conflicts
    .filter(conflict => conflict.direction === 'CHALLENGE' || conflict.direction === 'MIXED')
    .flatMap(conflict => conflict.evidenceIds.flatMap(identity => identityToOccurrences.get(identity) ?? []));
  const c11RiskCounterEvidence = finalSynthesis.conflicts
    .filter(conflict => conflict.direction === 'SUPPORT')
    .flatMap(conflict => conflict.evidenceIds.flatMap(identity => identityToOccurrences.get(identity) ?? []));
  const riskSupportingOccurrences = sortedUnique([...adverseOccurrences, ...c11RiskSupport]);
  const riskConflictingOccurrences = sortedUnique(c11RiskCounterEvidence);
  const hasSources = natal.evidence.length > 0 || dasha.evidence.length > 0 || d10.evidence.length > 0;
  const missingSources = [
    ...(natal.evidence.length === 0 ? ['C4_C7_NATAL'] : []),
    ...(dasha.evidence.length === 0 ? ['C9_DASHA'] : []),
    ...(d10.availability === 'UNAVAILABLE' || d10.evidence.length === 0 ? ['C10_D10'] : [])
  ];
  const status: CareerAnalyticalAxisStatus = !hasSources
    ? 'INSUFFICIENT'
    : missingSources.length > 0
      ? 'PARTIAL'
      : 'AVAILABLE';

  const allSources = [
    ...sourceIds(natal.evidence),
    ...sourceIds(dasha.evidence),
    ...sourceIds(d10.evidence)
  ];

  return Object.freeze({
    axis: 'RISK',
    status,
    result: Object.freeze({
      assessment: riskSupportingOccurrences.length > 0
        ? 'ADVERSE_EVIDENCE_PRESENT'
        : 'NO_ADVERSE_EVIDENCE_IN_AVAILABLE_SOURCES',
      conflictCount: finalSynthesis.conflicts.length
    }),
    supportingEvidenceOccurrenceIds: riskSupportingOccurrences,
    conflictingEvidenceOccurrenceIds: riskConflictingOccurrences,
    ruleIds: ruleIds([
      ...natal.evidence.filter(item => item.direction === 'CHALLENGE' || item.direction === 'MIXED').map(item => item.ruleId ?? ''),
      ...dasha.evidence.filter(item => item.direction === 'CHALLENGE' || item.direction === 'MIXED' || item.effect === 'CHALLENGES').flatMap(item => item.provenance.ruleIds ?? []),
      ...d10.evidence.filter(item => item.direction === 'CHALLENGE' || item.d10Effect === 'CHALLENGES').flatMap(item => item.provenance.ruleIds)
    ]),
    coverage: coverage(
      status === 'AVAILABLE' ? 'COMPLETE' : status === 'PARTIAL' ? 'PARTIAL' : 'INSUFFICIENT',
      [
        ...(natal.evidence.length > 0 ? ['C4_C7_NATAL'] : []),
        ...(dasha.evidence.length > 0 ? ['C9_DASHA'] : []),
        ...(d10.availability === 'AVAILABLE' && d10.evidence.length > 0 ? ['C10_D10'] : [])
      ],
      missingSources,
      sortedUnique(allSources).length
    ),
    confidence: confidenceNotAssessed('Risk is a traceable evidence inventory; no calibrated risk-confidence scale is defined.'),
    methodVersion: CAREER_ANALYTICAL_AXES_VERSION,
    ...(status === 'INSUFFICIENT'
      ? { unavailableReason: 'No canonical Career evidence sources are available for risk inspection.' }
      : {})
  });
}

function makeTimingAxis(dasha: CareerDashaCanonicalAnalysis): CareerTimingAxis {
  const hierarchy = dasha.hierarchy;
  const periods = hierarchy
    ? [hierarchy.md, hierarchy.ad, hierarchy.pd]
    : [];
  const windows: CareerTimingCandidateWindow[] = [];
  const untimedLevels: ('MD' | 'AD' | 'PD')[] = [];

  for (const period of periods) {
    const hasUsableActivation =
      period.direction !== 'UNAVAILABLE' &&
      period.effect !== 'UNKNOWN' &&
      period.effect !== 'INSUFFICIENT_DATA';
    if (!hasUsableActivation) continue;

    const periodEvidence = period.evidence;
    // A period without canonical activation evidence is not a candidate window.
    if (periodEvidence.length === 0) continue;
    const occurrenceIds = sortedUnique(periodEvidence.flatMap(item => item.sourceIds));
    const periodRuleIds = ruleIds(periodEvidence.flatMap(item => item.activationRuleIds));
    const dated = Boolean(period.start && period.end);

    if (!dated) untimedLevels.push(period.level);
    windows.push(Object.freeze({
      level: period.level,
      ...(period.planet ? { planet: String(period.planet) } : {}),
      ...(period.start ? { start: period.start } : {}),
      ...(period.end ? { end: period.end } : {}),
      dated,
      effect: period.effect,
      direction: period.direction,
      strength: period.strength,
      activatedPromiseEvidenceIds: sortedUnique(period.activatedPromiseEvidenceIds),
      supportingEvidenceOccurrenceIds: occurrenceIds,
      ruleIds: periodRuleIds
    }));
  }

  const usableLevels = periods.filter(period =>
    period.direction !== 'UNAVAILABLE' &&
    period.effect !== 'UNKNOWN' &&
    period.effect !== 'INSUFFICIENT_DATA' &&
    period.evidence.length > 0
  ).length;
  const status: CareerAnalyticalAxisStatus = !hierarchy
    ? 'UNAVAILABLE'
    : windows.length === 0
      ? 'INSUFFICIENT'
      : windows.every(window => window.dated) && usableLevels === 3
        ? 'AVAILABLE'
        : 'PARTIAL';

  const supporting = windows
    .filter(window => window.direction === 'SUPPORT')
    .flatMap(window => window.supportingEvidenceOccurrenceIds);
  const conflicting = windows
    .filter(window => window.direction === 'CHALLENGE' || window.direction === 'MIXED')
    .flatMap(window => window.supportingEvidenceOccurrenceIds);

  return Object.freeze({
    axis: 'TIMING',
    status,
    result: Object.freeze({
      candidateWindows: Object.freeze(windows),
      untimedLevels: Object.freeze(untimedLevels),
      guarantee: 'NONE'
    }),
    supportingEvidenceOccurrenceIds: sortedUnique(supporting),
    conflictingEvidenceOccurrenceIds: sortedUnique(conflicting),
    ruleIds: ruleIds(windows.flatMap(window => window.ruleIds)),
    coverage: coverage(
      status === 'AVAILABLE' ? 'COMPLETE' : status === 'PARTIAL' ? 'PARTIAL' : 'INSUFFICIENT',
      windows.length > 0 ? ['C9_DASHA_PERIODS'] : [],
      !hierarchy
        ? ['C9_DASHA_HIERARCHY']
        : [
            ...(usableLevels < 3 ? ['C9_DASHA_PERIOD_LEVELS'] : []),
            ...(untimedLevels.length > 0 ? ['SOURCE_PERIOD_DATES'] : [])
          ],
      sortedUnique(windows.flatMap(window => window.supportingEvidenceOccurrenceIds)).length
    ),
    confidence: confidenceNotAssessed('Timing windows preserve source dates and activation conditions; no outcome probability or timing confidence is inferred.'),
    methodVersion: CAREER_ANALYTICAL_AXES_VERSION,
    ...(!hierarchy
      ? { unavailableReason: 'Canonical Dasha hierarchy is unavailable.' }
      : windows.length === 0
        ? { unavailableReason: 'No usable canonical Dasha activation conditions are available.' }
        : {}),
    ...(status === 'PARTIAL'
      ? { diagnostic: 'One or more activation candidates lack complete source-backed start/end dates; no dates were inferred.' }
      : {})
  });
}

/**
 * Builds five orthogonal, evidence-backed analytical projections.
 * This function only maps existing C4-C10/C11 outputs; it does not calculate a new
 * Career conclusion, score, probability, or astrology rule. C11 remains authoritative.
 */
export function buildCareerAnalyticalAxes(
  input: CareerAnalyticalAxesInput
): CareerAnalyticalAxes {
  return Object.freeze({
    version: CAREER_ANALYTICAL_AXES_VERSION,
    promise: makePromiseAxis(input.natal),
    activation: makeActivationAxis(input.dasha),
    sustainability: makeSustainabilityAxis(),
    risk: makeRiskAxis(input.natal, input.dasha, input.d10, input.finalSynthesis),
    timing: makeTimingAxis(input.dasha)
  });
}
