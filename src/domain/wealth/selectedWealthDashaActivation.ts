import type { SelectedPeriodActivationContext } from '../../core/analysis';
import type {
  DashaAntardashaInterpretation,
  DashaInterpretationEvidence,
  DashaMahadashaInterpretation
} from '../../engine/dashaInterpretation/dashaInterpretationTypes';
import type { DomainEvidence } from '../interpretation/DomainEvidence';
import type { TimingActivationEffect } from '../interpretation/DomainInterpretationTypes';
import { validateSelectedPeriodContext } from '../../core/analysis';
import { WEALTH_DIMENSION_HOUSES, type WealthDimension } from './wealthTypes';
import { combineTimingHierarchy } from '../../product/life-analysis/dashaHierarchyUtils';

/**
 * Dasha rule reference for selected-period activation.
 * Captures provenance without fabricating evidence IDs.
 */
export interface SelectedWealthDashaRuleReference {
  readonly ruleId: string;
  readonly level: 'MD' | 'AD' | 'PD';
  readonly source: string;
}

/**
 * Per-dimension activation result for selected period.
 *
 * Effect semantics:
 * - MIXED evidence from dasha rules is collapsed to PARTIALLY_ACTIVATES (partial activation, not unresolved)
 * - Individual rule provenance is preserved in dashaRuleReferences for traceability
 *
 * insufficientReason semantics (PBA-05 diagnostics):
 * - NO_PROMISE_EVIDENCE: No natal promise evidence for this dimension (empty promiseEvidenceIds)
 * - PROMISE_NOT_LINKED: Promise exists but no MD/AD linkage (populated promiseEvidenceIds, empty linkedLevels)
 *   A diagnostic explains that the dasha evidence does not touch the dimension's canonical house.
 * - LINKED: At least one MD or AD level linked (populated linkedLevels)
 */
export interface SelectedWealthDimensionActivation {
  readonly dimension: WealthDimension;
  readonly effect: TimingActivationEffect;
  readonly linkedLevels: readonly ('MD' | 'AD' | 'PD')[];
  readonly md: {
    readonly effect: TimingActivationEffect;
    readonly dashaRuleReferences: readonly SelectedWealthDashaRuleReference[];
  };
  readonly ad: {
    readonly effect: TimingActivationEffect;
    readonly dashaRuleReferences: readonly SelectedWealthDashaRuleReference[];
  };
  readonly pd?: {
    readonly effect: TimingActivationEffect;
    readonly dashaRuleReferences: readonly SelectedWealthDashaRuleReference[];
  };
  readonly promiseEvidenceIds: readonly string[];
  readonly dashaRuleReferences: readonly SelectedWealthDashaRuleReference[];
  readonly insufficientReason: 'NO_PROMISE_EVIDENCE' | 'PROMISE_NOT_LINKED' | 'LINKED';
  readonly diagnostic?: string;
}

/**
 * Complete selected-period activation result for Wealth domain.
 */
export interface SelectedWealthPeriodActivation {
  readonly selectedPeriodId: string;
  readonly interval: { readonly start: string; readonly end: string };
  readonly temporalRelation: SelectedPeriodActivationContext['temporalRelation'];
  readonly dimensions: Readonly<Record<WealthDimension, SelectedWealthDimensionActivation>>;
}

/**
 * Input for evaluateSelectedWealthPeriodActivation.
 *
 * IMPORTANT: wealthEvidence must be the already-computed interpretation's evidence array.
 * Callers must pass the evidence from interpretWealthV2's result - never re-invoke interpretWealthV2.
 */
export interface EvaluateSelectedWealthPeriodActivationInput {
  readonly selectedPeriod: SelectedPeriodActivationContext;
  readonly wealthEvidence: readonly DomainEvidence[];
}

/**
 * Result type for evaluateSelectedWealthPeriodActivation.
 */
export type EvaluateSelectedWealthPeriodActivationResult =
  | { readonly ok: true; readonly value: SelectedWealthPeriodActivation }
  | { readonly ok: false; readonly error: 'INVALID_SELECTED_PERIOD_CONTEXT' };

type DashaEvidenceWithLevel = {
  readonly level: 'MD' | 'AD' | 'PD';
  readonly evidence: DashaInterpretationEvidence;
};

const DIMENSIONS: readonly WealthDimension[] = Object.freeze([
  'ACCUMULATION',
  'GAINS',
  'FORTUNE',
  'SPECULATION'
]);

/**
 * Selects Wealth evidence for a specific dimension.
 *
 * This function selects natal promise evidence only. Dasha/transit/varga evidence
 * can never establish a promise for the selected period.
 *
 * Rules:
 * - Must have phase === 'NATAL_PROMISE'
 * - Must have domain === 'WEALTH'
 * - Prefers explicit dimension field when present
 * - Falls back to house matching when dimension is absent
 * - When dimension and house conflict, explicit dimension wins (no expansion via conflicting house)
 */
function selectDimensionEvidence(
  evidence: readonly DomainEvidence[],
  dimension: WealthDimension
): readonly DomainEvidence[] {
  return evidence.filter((item) => {
    // Only natal promise evidence can establish a promise for the selected period
    if (item.phase !== 'NATAL_PROMISE') return false;

    if (item.domain !== 'WEALTH') return false;

    // Prefer explicit dimension classification
    if (item.dimension !== undefined) {
      return item.dimension === dimension;
    }

    // Fallback to house when dimension is absent
    if (item.house !== undefined) {
      return item.house === WEALTH_DIMENSION_HOUSES[dimension];
    }

    return false;
  });
}

/**
 * Extracts MD and AD evidence from selected period context.
 */
function extractSelectedDashaEvidence(
  context: SelectedPeriodActivationContext
): readonly DashaEvidenceWithLevel[] {
  const md = context.mahadashaNode as DashaMahadashaInterpretation;
  const ad = context.antardashaNode as DashaAntardashaInterpretation;
  return Object.freeze([
    ...md.evidence.map((evidence) => ({ level: 'MD' as const, evidence })),
    ...ad.evidence.map((evidence) => ({ level: 'AD' as const, evidence })),
    ...(context.pratyantardashaNode?.evidence ?? []).map((evidence) => ({ level: 'PD' as const, evidence }))
  ]);
}

/**
 * Checks if dasha evidence links to a dimension via house match.
 *
 * Linkage rules:
 * - Explicit house match via DashaInterpretationEvidence.houses to the actual house of promise evidence
 *   (not the dimension's canonical house if evidence has conflicting house)
 * - Planet overlap is NOT sufficient alone; must also share a house to establish linkage
 *   (prevents spurious cross-dimension activation via planetary overlap alone)
 * - Planet-only evidence (no houses) cannot link under the current conservative contract
 */
function isLinkedToDimension(
  dashaEvidence: DashaInterpretationEvidence,
  dimension: WealthDimension,
  promiseEvidence: readonly DomainEvidence[]
): boolean {
  // Check house linkage: dasha evidence must reference the actual house of the promise evidence
  // (not the dimension's canonical house if they conflict)
  for (const promise of promiseEvidence) {
    if (promise.house !== undefined && dashaEvidence.houses?.includes(promise.house)) {
      return true;
    }
  }

  // Planet overlap alone is NOT sufficient for linkage
  // This prevents spurious activation when dasha evidence shares a planet but targets different houses
  return false;
}

/**
 * Resolves activation effect from dasha evidence.
 *
 * Effect semantics:
 * - No evidence → INSUFFICIENT_DATA
 * - Neutral-only → UNKNOWN
 * - Support + challenge or MIXED → PARTIALLY_ACTIVATES
 *   (MIXED is collapsed to PARTIALLY_ACTIVATES - partial activation, not unresolved)
 * - Support only → ACTIVATES
 * - Challenge only → CHALLENGES
 *
 * Individual rule provenance is preserved in dashaRuleReferences for traceability.
 */
function resolveEffect(evidence: readonly DashaInterpretationEvidence[]): TimingActivationEffect {
  if (evidence.length === 0) {
    return 'INSUFFICIENT_DATA';
  }

  const hasSupport = evidence.some((item) => item.effect === 'SUPPORT');
  const hasChallenge = evidence.some((item) => item.effect === 'CHALLENGE');
  const hasMixed = evidence.some((item) => item.effect === 'MIXED');

  if ((hasSupport && hasChallenge) || hasMixed) {
    return 'PARTIALLY_ACTIVATES';
  }
  if (hasSupport) {
    return 'ACTIVATES';
  }
  if (hasChallenge) {
    return 'CHALLENGES';
  }

  return 'UNKNOWN'; // Neutral-only
}

/**
 * Converts dasha evidence to rule reference.
 */
function toRuleReference(item: DashaEvidenceWithLevel): SelectedWealthDashaRuleReference {
  return Object.freeze({
    ruleId: item.evidence.ruleId,
    level: item.level,
    source: item.evidence.source
  });
}

/**
 * Evaluates activation for a single dimension.
 */
function evaluateDimension(
  dimension: WealthDimension,
  wealthEvidence: readonly DomainEvidence[],
  selectedEvidence: readonly DashaEvidenceWithLevel[]
): SelectedWealthDimensionActivation {
  // Select promise evidence for this dimension
  const promiseEvidence = selectDimensionEvidence(wealthEvidence, dimension);

  // No promise evidence → INSUFFICIENT_DATA
  if (promiseEvidence.length === 0) {
    return Object.freeze({
      dimension,
      effect: 'INSUFFICIENT_DATA',
      linkedLevels: Object.freeze([]),
      md: Object.freeze({
        effect: 'INSUFFICIENT_DATA',
        dashaRuleReferences: Object.freeze([])
      }),
      ad: Object.freeze({
        effect: 'INSUFFICIENT_DATA',
        dashaRuleReferences: Object.freeze([])
      }),
      pd: Object.freeze({
        effect: 'INSUFFICIENT_DATA',
        dashaRuleReferences: Object.freeze([])
      }),
      promiseEvidenceIds: Object.freeze([]),
      dashaRuleReferences: Object.freeze([]),
      insufficientReason: 'NO_PROMISE_EVIDENCE' as const
    });
  }

  // Separate MD and AD evidence
  const mdEvidence = selectedEvidence.filter((item) => item.level === 'MD');
  const adEvidence = selectedEvidence.filter((item) => item.level === 'AD');
  const pdEvidence = selectedEvidence.filter((item) => item.level === 'PD');

  // Find linked evidence per level
  const linkedMd = mdEvidence.filter(({ evidence }) =>
    isLinkedToDimension(evidence, dimension, promiseEvidence)
  );
  const linkedAd = adEvidence.filter(({ evidence }) =>
    isLinkedToDimension(evidence, dimension, promiseEvidence)
  );
  const linkedPd = pdEvidence.filter(({ evidence }) =>
    isLinkedToDimension(evidence, dimension, promiseEvidence)
  );

  // No linkage at any level → INSUFFICIENT_DATA
  if (linkedMd.length === 0 && linkedAd.length === 0 && linkedPd.length === 0) {
    return Object.freeze({
      dimension,
      effect: 'INSUFFICIENT_DATA',
      linkedLevels: Object.freeze([]),
      md: Object.freeze({
        effect: 'INSUFFICIENT_DATA',
        dashaRuleReferences: Object.freeze([])
      }),
      ad: Object.freeze({
        effect: 'INSUFFICIENT_DATA',
        dashaRuleReferences: Object.freeze([])
      }),
      pd: Object.freeze({
        effect: 'INSUFFICIENT_DATA',
        dashaRuleReferences: Object.freeze([])
      }),
      promiseEvidenceIds: Object.freeze(promiseEvidence.map((item) => item.id)),
      dashaRuleReferences: Object.freeze([]),
      insufficientReason: 'PROMISE_NOT_LINKED' as const,
      diagnostic: `Promise evidence is present, but the selected-period dasha lord does not touch the ${dimension}'s canonical house.`
    });
  }

  // Resolve effects per level
  const mdEffect = resolveEffect(linkedMd.map((item) => item.evidence));
  const adEffect = resolveEffect(linkedAd.map((item) => item.evidence));
  const pdEffect = resolveEffect(linkedPd.map((item) => item.evidence));

  const linkedLevels: ('MD' | 'AD' | 'PD')[] = [];
  if (linkedMd.length > 0) linkedLevels.push('MD');
  if (linkedAd.length > 0) linkedLevels.push('AD');
  if (linkedPd.length > 0) linkedLevels.push('PD');

  const allLinked = [...linkedMd, ...linkedAd, ...linkedPd];
  const overallEffect = linkedPd.length > 0
    ? combineTimingHierarchy(mdEffect, adEffect, pdEffect).overallEffect
    : resolveEffect(allLinked.map((item) => item.evidence));

  // Build rule references
  const mdRuleReferences = Object.freeze(linkedMd.map(toRuleReference));
  const adRuleReferences = Object.freeze(linkedAd.map(toRuleReference));
  const pdRuleReferences = Object.freeze(linkedPd.map(toRuleReference));
  const allRuleReferences = Object.freeze(allLinked.map(toRuleReference));

  return Object.freeze({
    dimension,
    effect: overallEffect,
    linkedLevels: Object.freeze(linkedLevels),
    md: Object.freeze({
      effect: mdEffect,
      dashaRuleReferences: mdRuleReferences
    }),
    ad: Object.freeze({
      effect: adEffect,
      dashaRuleReferences: adRuleReferences
    }),
    pd: Object.freeze({
      effect: pdEffect,
      dashaRuleReferences: pdRuleReferences
    }),
    promiseEvidenceIds: Object.freeze(promiseEvidence.map((item) => item.id)),
    dashaRuleReferences: allRuleReferences,
    insufficientReason: 'LINKED' as const
  });
}

/**
 * Evaluates Wealth activation for a selected MD/AD period.
 *
 * This is an additive selected-period evaluator. It does not mutate:
 * - Lifetime Wealth interpretation
 * - Current Dasha state
 * - AnalysisContext.asOf
 * - Existing Wealth V2 timing
 * - report.current or activePeriods
 * - WealthConclusionData
 *
 * @param input - The selected period and pre-computed Wealth evidence
 * @returns Frozen activation result or error if validation fails
 */
export function evaluateSelectedWealthPeriodActivation(
  input: EvaluateSelectedWealthPeriodActivationInput
): EvaluateSelectedWealthPeriodActivationResult {
  const { selectedPeriod, wealthEvidence } = input;

  // Validate selected period context consistency
  if (!validateSelectedPeriodContext(selectedPeriod)) {
    return {
      ok: false,
      error: 'INVALID_SELECTED_PERIOD_CONTEXT'
    };
  }

  // Extract selected MD/AD evidence
  const selectedEvidence = extractSelectedDashaEvidence(selectedPeriod);

  // Evaluate each dimension
  const dimensions: Record<WealthDimension, SelectedWealthDimensionActivation> = {
    ACCUMULATION: evaluateDimension('ACCUMULATION', wealthEvidence, selectedEvidence),
    GAINS: evaluateDimension('GAINS', wealthEvidence, selectedEvidence),
    FORTUNE: evaluateDimension('FORTUNE', wealthEvidence, selectedEvidence),
    SPECULATION: evaluateDimension('SPECULATION', wealthEvidence, selectedEvidence)
  };

  // Freeze and return result
  const result: SelectedWealthPeriodActivation = Object.freeze({
    selectedPeriodId: selectedPeriod.selectedPeriodId,
    interval: Object.freeze({
      start: selectedPeriod.interval.start,
      end: selectedPeriod.interval.end
    }),
    temporalRelation: selectedPeriod.temporalRelation,
    dimensions: Object.freeze(dimensions)
  });

  return { ok: true, value: result };
}
