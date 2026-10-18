import type {
  Horoscope
} from '../../../types';

import type {
  CareerNatalAnalysis
} from '../careerNatalAnalysis';

import type {
  CareerExpressionAnalysis,
  CareerExpression
} from '../careerExpression';

import type {
  CareerDashaCanonicalAnalysis,
  CareerDashaCanonicalPeriod
} from './careerDashaCanonicalTypes';

import type {
  CareerDashaMechanismAwareInput
} from './careerDashaIntegration';

import type {
  CareerDashaIntegrationInputExtended
} from './careerDashaIntegration';

import type {
  SelectedPeriodActivationContext
} from '../../../core/analysis';

import {
  buildSelectedCareerDashaCanonicalAnalysis
} from './careerDashaIntegration';

/**
 * Expression activation row for selected Dasha period.
 *
 * Represents the linkage between an expression and the selected MD/AD activation.
 */
export interface SelectedExpressionActivation {
  /**
   * Local key derived from mode:direction: + sorted evidence IDs.
   * JSDoc: not a durable identity, just a deterministic local reference.
   */
  readonly expressionRefKey: string;
  /**
   * Reference to the original expression.
   */
  readonly expression: CareerExpression;
  /**
   * Evidence IDs from this expression that are linked to the selected activation.
   */
  readonly linkedEvidenceIds: readonly string[];
  /**
   * Activation summary from MD/AD canonical periods.
   */
  readonly activation: {
    readonly mdActivation: CareerDashaCanonicalPeriod;
    readonly adActivation: CareerDashaCanonicalPeriod;
  };
}

/**
 * Result of building selected Career Dasha activation.
 *
 * Provides a frozen result linking selected MD/AD periods to expressions.
 */
export interface SelectedCareerDashaActivationResult {
  /**
   * Selected period ID from the input.
   */
  readonly selectedPeriodId: string;
  /**
   * Temporal relation of the selected period (e.g., 'CURRENT', 'PAST', 'FUTURE').
   * Computed by PBA-03 relative to analysisAsOf.
   */
  readonly temporalRelation: 'CURRENT' | 'PAST' | 'FUTURE';
  /**
   * Interval of the selected AD period [start, end) verbatim.
   */
  readonly interval: {
    readonly start: string;
    readonly end: string;
  };
  /**
   * Expression activations - only for expressions with evidence linked to selected MD/AD.
   */
  readonly expressionActivations: readonly SelectedExpressionActivation[];
  /**
   * Expression evidence IDs not linked to any selected activation.
   */
  readonly unmatchedExpressionEvidenceIds: readonly string[];
  /**
   * Canonical Dasha analysis for the selected period.
   */
  readonly canonicalDashaAnalysis: CareerDashaCanonicalAnalysis;
  /**
   * Deterministic statement summarizing the selected activation.
   */
  readonly statement: string;
}

/**
 * Builds selected Career Dasha activation for a specific MD/AD period.
 *
 * This function:
 * - Builds canonical Dasha analysis for the selected period using buildSelectedCareerDashaCanonicalAnalysis
 * - Extracts MD/AD canonical periods and their evidence
 * - Links expressions to the selected activation based on evidence ID intersection
 * - Reports unmatched expression evidence IDs
 * - Returns a frozen result with all linkage information
 *
 * Guardrails enforced:
 * - No new expressions created
 * - Missing linkage → expression simply absent from rows (never a negative result)
 * - PD stays INSUFFICIENT_DATA
 * - Inputs/nodes not mutated
 *
 * @param params - Parameters containing horoscope, natal, expression, selectedPeriod, and optional mechanismAwareInput
 * @returns A frozen SelectedCareerDashaActivationResult
 */
export function buildSelectedCareerDashaActivation(params: {
  readonly horoscope: Horoscope;
  readonly natal: CareerNatalAnalysis;
  readonly expression: CareerExpressionAnalysis;
  readonly selectedPeriod: SelectedPeriodActivationContext;
  readonly mechanismAwareInput?: CareerDashaMechanismAwareInput;
}): SelectedCareerDashaActivationResult {
  const { horoscope, natal, expression, selectedPeriod, mechanismAwareInput } = params;

  // Build canonical Dasha analysis for the selected period
  const input: CareerDashaIntegrationInputExtended & { selectedPeriod: SelectedPeriodActivationContext } = Object.freeze({
    horoscope,
    natal,
    expression,
    selectedPeriod,
    mechanismAwareInput
  });

  const canonicalDashaAnalysis = buildSelectedCareerDashaCanonicalAnalysis(input);

  // Extract MD/AD canonical periods
  const mdActivation = canonicalDashaAnalysis.md;
  const adActivation = canonicalDashaAnalysis.ad;

  // Collect all source IDs and related evidence IDs from MD/AD canonical evidence
  const selectedEvidenceIds = new Set<string>();
  for (const evidence of canonicalDashaAnalysis.evidence) {
    // Only consider MD and AD levels (PD is unavailable by design)
    if (evidence.level === 'MD' || evidence.level === 'AD') {
      for (const sourceId of evidence.sourceIds) {
        selectedEvidenceIds.add(sourceId);
      }
    }
  }

  // Build expression activations
  const expressionActivations: SelectedExpressionActivation[] = [];
  const matchedExpressionEvidenceIds = new Set<string>();

  for (const expr of expression.expressions) {
    // Collect all evidence IDs for this expression
    const exprEvidenceIds = new Set(expr.evidence.map(e => e.id));

    // Check if any expression evidence ID intersects with selected activation evidence IDs
    const linkedIds: string[] = [];
    for (const exprEvidenceId of exprEvidenceIds) {
      if (selectedEvidenceIds.has(exprEvidenceId)) {
        linkedIds.push(exprEvidenceId);
        matchedExpressionEvidenceIds.add(exprEvidenceId);
      }
    }

    // Only emit a row if there's at least one linked evidence ID
    if (linkedIds.length > 0) {
      // Build expressionRefKey: mode:direction: + sorted evidence IDs
      const sortedLinkedIds = Array.from(linkedIds).sort();
      const expressionRefKey = `${expr.mode}:${expr.direction}:${sortedLinkedIds.join(',')}`;

      expressionActivations.push(Object.freeze({
        expressionRefKey,
        expression: expr,
        linkedEvidenceIds: Object.freeze(sortedLinkedIds),
        activation: Object.freeze({
          mdActivation,
          adActivation
        })
      }));
    }
  }

  // Find unmatched expression evidence IDs
  const allExpressionEvidenceIds = new Set(
    expression.expressions.flatMap(expr => expr.evidence.map(e => e.id))
  );
  const unmatchedExpressionEvidenceIds = Array.from(allExpressionEvidenceIds)
    .filter(id => !matchedExpressionEvidenceIds.has(id))
    .sort();

  // Use temporalRelation and interval from PBA-03 context
  const temporalRelation = selectedPeriod.temporalRelation;
  const interval = selectedPeriod.interval;

  // Build statement
  const statement = [
    `Selected Career Dasha activation for period ${selectedPeriod.selectedPeriodId}.`,
    `Temporal relation: ${temporalRelation}.`,
    `Interval: [${interval.start}, ${interval.end}).`,
    `MD: ${mdActivation.planet ?? 'none'} (${mdActivation.effect}, ${mdActivation.direction}).`,
    `AD: ${adActivation.planet ?? 'none'} (${adActivation.effect}, ${adActivation.direction}).`,
    `Expression activations: ${expressionActivations.length}.`,
    `Unmatched expression evidence IDs: ${unmatchedExpressionEvidenceIds.length}.`
  ].join(' ');

  return Object.freeze({
    selectedPeriodId: selectedPeriod.selectedPeriodId,
    temporalRelation,
    interval,
    expressionActivations: Object.freeze(expressionActivations),
    unmatchedExpressionEvidenceIds: Object.freeze(unmatchedExpressionEvidenceIds),
    canonicalDashaAnalysis,
    statement
  });
}
