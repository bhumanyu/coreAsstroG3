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

import type {
  DashaMahadashaInterpretation,
  DashaAntardashaInterpretation
} from '../../../engine/dashaInterpretation/dashaInterpretationTypes';

import {
  DashaSystem
} from '../../../types';

import {
  Planet
} from '../../../types';

import {
  buildSelectedCareerDashaCanonicalAnalysis
} from './careerDashaIntegration';

/**
 * Expression activation row for selected Dasha period.
 *
 * Represents the linkage between an expression and the selected MD/AD activation.
 * 
 * P1: Linkage is now based on semantic planet/mechanism association, not ID intersection.
 * An expression links to the selected activation when any of its evidence[].planets
 * (or mechanism participant planets) includes the selected MD planet or AD planet.
 */
export interface SelectedExpressionActivation {
  /**
   * Local key derived from mode:direction: + sorted expression evidence IDs.
   * JSDoc: not a durable identity, just a deterministic local reference.
   */
  readonly expressionRefKey: string;
  /**
   * Reference to the original expression.
   */
  readonly expression: CareerExpression;
  /**
   * Evidence IDs from C8 expression evidence (original C8 evidence IDs, verbatim).
   * These are the evidence IDs from expression.evidence[].id that are linked via planet association.
   */
  readonly expressionEvidenceIds: readonly string[];
  /**
   * Evidence IDs from C9 Dasha activation (canonical C9 evidence IDs for MD/AD periods, verbatim).
   * These are the evidence IDs from canonicalDashaAnalysis.evidence[].id for the MD/AD levels.
   */
  readonly dashaActivationEvidenceIds: readonly string[];
  /**
   * Activation summary from MD/AD canonical periods.
   */
  readonly activation: {
    readonly mdActivation: CareerDashaCanonicalPeriod;
    readonly adActivation: CareerDashaCanonicalPeriod;
  };
}

/**
 * Result type for buildSelectedCareerDashaActivation.
 *
 * P1: Discriminated union for validation errors vs successful result.
 */
export type SelectedCareerDashaActivationResult =
  | { readonly ok: true; readonly value: SelectedCareerDashaActivationSuccess }
  | { readonly ok: false; readonly error: 'INVALID_SELECTED_PERIOD_CONTEXT' };

/**
 * Success result of building selected Career Dasha activation.
 *
 * Provides a frozen result linking selected MD/AD periods to expressions.
 */
export interface SelectedCareerDashaActivationSuccess {
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
   * Expression activations - only for expressions with planet linkage to selected MD/AD.
   */
  readonly expressionActivations: readonly SelectedExpressionActivation[];
  /**
   * Expression evidence IDs not linked to any selected activation (planet-based linkage).
   */
  readonly unmatchedExpressionEvidenceIds: readonly string[];
  /**
   * Canonical Dasha analysis for the selected period.
   * 
   * P2: The evidence in canonicalDashaAnalysis.evidence is Career-activation evidence
   * derived from natal/relevance/condition inputs — NOT the PBA-03 nodes' evidence/domainSynthesis,
   * which are carried by reference only in selectedDashaInterpretation and not consumed by C9.
   */
  readonly canonicalDashaAnalysis: CareerDashaCanonicalAnalysis;
  /**
   * P2: Selected Dasha interpretation with read-only references to PBA-03 nodes.
   * 
   * The mahadashaNode and antardashaNode are the canonical interpretation nodes selected from
   * the existing PBA-03 report. These preserve deterministic activation/evidence/provenance;
   * this layer does not recompute, merge, or reinterpret those facts.
   * 
   * C9 canonicalDashaAnalysis.evidence sourceIds will differ from node.evidence IDs —
   * the C9 evidence is derived from natal/relevance/condition inputs, while the nodes carry
   * their original PBA-03 evidence/domainSynthesis.
   */
  readonly selectedDashaInterpretation: {
    readonly mahadashaNode: DashaMahadashaInterpretation;
    readonly antardashaNode: DashaAntardashaInterpretation;
  };
  /**
   * Deterministic statement summarizing the selected activation.
   */
  readonly statement: string;
}

/**
 * P1: Validates selected-period context consistency before C9 resolution.
 *
 * Verifies:
 * - ctx.dashaSystem === VIMSHOTTARI
 * - ctx.level === 'MD_AD'
 * - ctx.intervalSemantics === '[start,end)'
 * - ctx.mahadasha.planet/start/end equal mahadashaNode.planet/start/end
 * - ctx.antardasha.planet/start/end equal antardashaNode.planet/start/end
 * - ctx.interval equals {antardashaNode.start, antardashaNode.end}
 * - ctx.antardasha.mahadashaId === ctx.mahadasha.id
 * - interval.start < interval.end (parsed)
 * - AD interval contained in MD interval
 * 
 * On any mismatch, returns the validation error.
 * Never substitutes current-Dasha data on mismatch.
 * 
 * @param ctx - The selected period activation context to validate
 * @returns undefined if valid, 'INVALID_SELECTED_PERIOD_CONTEXT' if invalid
 */
function validateSelectedPeriodContext(
  ctx: SelectedPeriodActivationContext
): 'INVALID_SELECTED_PERIOD_CONTEXT' | undefined {
  // Verify dasha system
  if (ctx.dashaSystem !== DashaSystem.VIMSHOTTARI) {
    return 'INVALID_SELECTED_PERIOD_CONTEXT';
  }

  // Verify level
  if (ctx.level !== 'MD_AD') {
    return 'INVALID_SELECTED_PERIOD_CONTEXT';
  }

  // Verify interval semantics
  if (ctx.intervalSemantics !== '[start,end)') {
    return 'INVALID_SELECTED_PERIOD_CONTEXT';
  }

  // Verify mahadasha consistency between context and node
  if (ctx.mahadasha.planet !== ctx.mahadashaNode.planet) {
    return 'INVALID_SELECTED_PERIOD_CONTEXT';
  }
  if (ctx.mahadasha.start !== ctx.mahadashaNode.start) {
    return 'INVALID_SELECTED_PERIOD_CONTEXT';
  }
  if (ctx.mahadasha.end !== ctx.mahadashaNode.end) {
    return 'INVALID_SELECTED_PERIOD_CONTEXT';
  }

  // Verify antardasha consistency between context and node
  if (ctx.antardasha.planet !== ctx.antardashaNode.planet) {
    return 'INVALID_SELECTED_PERIOD_CONTEXT';
  }
  if (ctx.antardasha.start !== ctx.antardashaNode.start) {
    return 'INVALID_SELECTED_PERIOD_CONTEXT';
  }
  if (ctx.antardasha.end !== ctx.antardashaNode.end) {
    return 'INVALID_SELECTED_PERIOD_CONTEXT';
  }

  // Verify antardasha mahadashaId matches mahadasha id
  if (ctx.antardasha.mahadashaId !== ctx.mahadasha.id) {
    return 'INVALID_SELECTED_PERIOD_CONTEXT';
  }

  // Verify interval matches antardasha node
  if (ctx.interval.start !== ctx.antardashaNode.start) {
    return 'INVALID_SELECTED_PERIOD_CONTEXT';
  }
  if (ctx.interval.end !== ctx.antardashaNode.end) {
    return 'INVALID_SELECTED_PERIOD_CONTEXT';
  }

  // Parse and verify interval ordering
  const startMs = Date.parse(ctx.interval.start);
  const endMs = Date.parse(ctx.interval.end);
  const mdStartMs = Date.parse(ctx.mahadasha.start);
  const mdEndMs = Date.parse(ctx.mahadasha.end);

  if (Number.isNaN(startMs) || Number.isNaN(endMs) || Number.isNaN(mdStartMs) || Number.isNaN(mdEndMs)) {
    return 'INVALID_SELECTED_PERIOD_CONTEXT';
  }

  // Verify start < end
  if (startMs >= endMs) {
    return 'INVALID_SELECTED_PERIOD_CONTEXT';
  }

  // Verify AD interval contained in MD interval
  if (startMs < mdStartMs || endMs > mdEndMs) {
    return 'INVALID_SELECTED_PERIOD_CONTEXT';
  }

  // All checks passed
  return undefined;
}

/**
 * Builds selected Career Dasha activation for a specific MD/AD period.
 *
 * This function:
 * - Validates selected-period context consistency (P1)
 * - Builds canonical Dasha analysis for the selected period using buildSelectedCareerDashaCanonicalAnalysis
 * - Extracts MD/AD canonical periods and their evidence
 * - Links expressions to the selected activation based on semantic planet/mechanism linkage (P1)
 *   - Links when expression.evidence[].planets includes selected MD planet or AD planet
 *   - Also checks mechanism participant planets if reachable
 * - Returns separate provenance lists: expressionEvidenceIds (C8) and dashaActivationEvidenceIds (C9) (P1)
 * - Reports unmatched expression evidence IDs (planet-based linkage)
 * - Returns a frozen result with all linkage information
 * - Includes selectedDashaInterpretation with read-only node references (P2)
 *
 * Guardrails enforced:
 * - No new expressions created
 * - Missing linkage → expression simply absent from rows (never a negative result)
 * - PD stays INSUFFICIENT_DATA
 * - Inputs/nodes not mutated
 * - C8 qualification boundary enforced (P2): only QUALIFIED expressions produce activation rows
 *   - DEBT: The canonical CareerExpressionCanonicalResult shape is not yet threaded through
 *     CareerDomainInterpreterV2's production path. We currently use an interim conservative proxy:
 *     expr.direction !== 'UNAVAILABLE'. When the canonical shape is reachable (check
 *     mechanismExpressionResult/conclusionData in CareerDomainInterpreterV2), we should:
 *     1. Add canonicalExpression parameter to input
 *     2. Map canonicalExpression.expressions (CareerExpressionCanonicalCandidate[]) to legacy expressions
 *     3. Filter by qualificationStatus === 'QUALIFIED'
 *     4. Remove this DEBT comment and the interim proxy
 *
 * @param params - Parameters containing horoscope, natal, expression, selectedPeriod, and optional mechanismAwareInput
 * @returns A discriminated result: { ok: true, value } on success, { ok: false, error } on validation failure
 */
export function buildSelectedCareerDashaActivation(params: {
  readonly horoscope: Horoscope;
  readonly natal: CareerNatalAnalysis;
  readonly expression: CareerExpressionAnalysis;
  readonly selectedPeriod: SelectedPeriodActivationContext;
  readonly mechanismAwareInput?: CareerDashaMechanismAwareInput;
}): SelectedCareerDashaActivationResult {
  const { horoscope, natal, expression, selectedPeriod, mechanismAwareInput } = params;

  // P1: Validate selected-period context consistency
  const validationError = validateSelectedPeriodContext(selectedPeriod);
  if (validationError) {
    return { ok: false, error: validationError };
  }

  // Build canonical Dasha analysis for the selected period
  const input: CareerDashaIntegrationInputExtended & { selectedPeriod: SelectedPeriodActivationContext } = Object.freeze({
    horoscope,
    natal,
    expression,
    selectedPeriod,
    mechanismAwareInput
  });

  const canonicalDashaAnalysis = buildSelectedCareerDashaCanonicalAnalysis(input);

  // P1: Handle validation failure from buildSelectedCareerDashaCanonicalAnalysis
  // (Validation is also checked at the top of this function, but we defend against
  // any additional validation that might be added in the future)
  if (!canonicalDashaAnalysis) {
    return { ok: false, error: 'INVALID_SELECTED_PERIOD_CONTEXT' };
  }

  // Extract MD/AD canonical periods
  const mdActivation = canonicalDashaAnalysis.md;
  const adActivation = canonicalDashaAnalysis.ad;

  // P1: Collect C9 canonical evidence IDs for MD/AD periods (for dashaActivationEvidenceIds)
  const dashaActivationEvidenceIds = new Set<string>();
  for (const evidence of canonicalDashaAnalysis.evidence) {
    // Only consider MD and AD levels (PD is unavailable by design)
    if (evidence.level === 'MD' || evidence.level === 'AD') {
      dashaActivationEvidenceIds.add(evidence.id);
    }
  }

  // P1: Extract selected MD and AD planets for semantic linkage
  const mdPlanet = mdActivation.planet;
  const adPlanet = adActivation.planet;

  // P1: Collect mechanism participant planets if mechanismAwareInput is present
  const mechanismPlanets = new Set<Planet>();
  if (mechanismAwareInput) {
    for (const participantId of mechanismAwareInput.participantIds) {
      try {
        // extractPlanetFromParticipantId returns Planet enum
        const planet = participantId.startsWith('PLANET:')
          ? (participantId.split(':')[1] as Planet)
          : undefined;
        if (planet) {
          mechanismPlanets.add(planet);
        }
      } catch {
        // Invalid participant ID - skip
      }
    }
  }

  // P2: C8 qualification boundary - filter by QUALIFIED status
  // DEBT: The canonical CareerExpressionCanonicalResult shape is not yet threaded through
  // CareerDomainInterpreterV2's production path. We accept the param for future compatibility
  // but currently use an interim conservative proxy: expr.direction !== 'UNAVAILABLE'.
  // 
  // When the canonical shape is reachable (check mechanismExpressionResult/conclusionData
  // in CareerDomainInterpreterV2), we should:
  // 1. Map canonicalExpression.expressions (CareerExpressionCanonicalCandidate[]) to legacy expressions
  // 2. Filter by qualificationStatus === 'QUALIFIED'
  // 3. Remove the interim proxy and this DEBT comment
  // 
  // For now, we conservatively gate on direction !== 'UNAVAILABLE' to exclude clearly
  // unavailable candidates while not fabricating positive signals.
  const qualifiedExpressions = expression.expressions.filter(expr => expr.direction !== 'UNAVAILABLE');

  // P1: Build expression activations using semantic planet/mechanism linkage
  const expressionActivations: SelectedExpressionActivation[] = [];
  const matchedExpressionEvidenceIds = new Set<string>();

  for (const expr of qualifiedExpressions) {
    // Collect all planets from expression evidence
    const exprPlanets = new Set<Planet>();
    for (const evidence of expr.evidence) {
      for (const planet of evidence.planets) {
        exprPlanets.add(planet);
      }
    }

    // Also include mechanism participant planets
    for (const planet of mechanismPlanets) {
      exprPlanets.add(planet);
    }

    // P1: Check if expression planets include selected MD planet or AD planet
    const isLinkedToMd = mdPlanet && exprPlanets.has(mdPlanet);
    const isLinkedToAd = adPlanet && exprPlanets.has(adPlanet);

    if (isLinkedToMd || isLinkedToAd) {
      // Collect expression evidence IDs (C8 evidence IDs, verbatim)
      const exprEvidenceIds = expr.evidence.map(e => e.id);
      const sortedExprEvidenceIds = Array.from(exprEvidenceIds).sort();

      // Collect dasha activation evidence IDs (C9 evidence IDs, verbatim)
      const linkedDashaEvidenceIds: string[] = [];
      for (const dashaId of dashaActivationEvidenceIds) {
        linkedDashaEvidenceIds.push(dashaId);
      }
      const sortedDashaEvidenceIds = Array.from(linkedDashaEvidenceIds).sort();

      // Track matched expression evidence IDs
      for (const exprEvidenceId of exprEvidenceIds) {
        matchedExpressionEvidenceIds.add(exprEvidenceId);
      }

      // Build expressionRefKey: mode:direction: + sorted expression evidence IDs
      const expressionRefKey = `${expr.mode}:${expr.direction}:${sortedExprEvidenceIds.join(',')}`;

      expressionActivations.push(Object.freeze({
        expressionRefKey,
        expression: expr,
        expressionEvidenceIds: Object.freeze(sortedExprEvidenceIds),
        dashaActivationEvidenceIds: Object.freeze(sortedDashaEvidenceIds),
        activation: Object.freeze({
          mdActivation,
          adActivation
        })
      }));
    }
  }

  // Find unmatched expression evidence IDs (from qualified expressions only)
  const allQualifiedExpressionEvidenceIds = new Set(
    qualifiedExpressions.flatMap(expr => expr.evidence.map(e => e.id))
  );
  const unmatchedExpressionEvidenceIds = Array.from(allQualifiedExpressionEvidenceIds)
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

  const value: SelectedCareerDashaActivationSuccess = Object.freeze({
    selectedPeriodId: selectedPeriod.selectedPeriodId,
    temporalRelation,
    interval,
    expressionActivations: Object.freeze(expressionActivations),
    unmatchedExpressionEvidenceIds: Object.freeze(unmatchedExpressionEvidenceIds),
    canonicalDashaAnalysis,
    selectedDashaInterpretation: Object.freeze({
      mahadashaNode: selectedPeriod.mahadashaNode,
      antardashaNode: selectedPeriod.antardashaNode
    }),
    statement
  });

  return { ok: true, value };
}
