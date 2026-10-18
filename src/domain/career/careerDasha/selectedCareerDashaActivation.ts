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
  CareerExpressionCanonicalResult,
  CareerExpressionCanonicalCandidate
} from '../careerExpression/careerExpressionTypes';

import {
  adaptMechanismExpressionToLegacy
} from '../careerExpression/mechanismExpressionToLegacyAdapter';

import type {
  CareerMechanismCandidate
} from '../careerMechanism/careerMechanismTypes';

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
  buildSelectedCareerDashaCanonicalAnalysis,
  validateSelectedPeriodContext
} from './careerDashaIntegration';

/**
 * Expression activation row for selected Dasha period.
 *
 * Represents the linkage between an expression and the selected MD/AD activation.
 *
 * P1: Linkage is now based on semantic planet/mechanism association, not ID intersection.
 * An expression links to the selected activation when any of its evidence[].planets
 * (or mechanism participant planets) includes the selected MD planet or AD planet.
 *
 * Per-level linkage: MD and AD evidence IDs are tracked separately.
 * - mdDashaEvidenceIds: C9 canonical evidence IDs where level === 'MD' (all C9 MD evidence, not planet-specific attribution)
 * - adDashaEvidenceIds: C9 canonical evidence IDs where level === 'AD' (all C9 AD evidence, not planet-specific attribution)
 * - linkedLevels: Which levels this expression is actually linked to (authoritative)
 *
 * EVIDENCE ATTRIBUTION SCOPE:
 * The mdDashaEvidenceIds and adDashaEvidenceIds arrays contain ALL C9 evidence for the linked level
 * (MD or AD), not evidence filtered to match the specific planet that triggered the linkage.
 * This is documented contract: evidence IDs are level-scoped, not planet-scoped.
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
   * Which levels this expression is linked to (authoritative).
   * Contains 'MD' if expression includes mdPlanet, 'AD' if includes adPlanet.
   */
  readonly linkedLevels: readonly ('MD' | 'AD')[];
  /**
   * Evidence IDs from C9 Dasha activation for MD level (canonical C9 evidence IDs where level === 'MD', verbatim).
   * These are the evidence IDs from canonicalDashaAnalysis.evidence[].id for the MD level.
   * Empty array if expression is not linked to MD.
   */
  readonly mdDashaEvidenceIds: readonly string[];
  /**
   * Evidence IDs from C9 Dasha activation for AD level (canonical C9 evidence IDs where level === 'AD', verbatim).
   * These are the evidence IDs from canonicalDashaAnalysis.evidence[].id for the AD level.
   * Empty array if expression is not linked to AD.
   */
  readonly adDashaEvidenceIds: readonly string[];
  /**
   * Activation summary from MD/AD canonical periods.
   * Note: Both mdActivation and adActivation are always present for reference,
   * but linkedLevels is authoritative for which levels actually apply to this expression.
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
  | { readonly ok: false; readonly error: 'INVALID_SELECTED_PERIOD_CONTEXT' | 'INCOMPLETE_CANONICAL_INPUT' };

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
   * Qualification basis used for filtering expressions.
   * 'CANONICAL_STATUS': Used canonical qualificationStatus === 'QUALIFIED' (authoritative)
   * 'PROXY_DIRECTION': Used interim proxy expr.direction !== 'UNAVAILABLE' (conservative)
   */
  readonly qualificationBasis: 'CANONICAL_STATUS' | 'PROXY_DIRECTION';
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
 * Builds selected Career Dasha activation for a specific MD/AD period.
 *
 * This function:
 * - Validates selected-period context consistency (P1)
 * - Rejects inconsistent canonical inputs (both canonicalExpression and mechanismCandidates must be present or both absent)
 * - Builds canonical Dasha analysis for the selected period using buildSelectedCareerDashaCanonicalAnalysis
 * - Extracts MD/AD canonical periods and their evidence
 * - Links expressions to the selected activation based on semantic planet linkage (P1)
 *   - Links when expression.evidence[].planets includes selected MD planet or AD planet
 * - Returns separate provenance lists: expressionEvidenceIds (C8), mdDashaEvidenceIds (C9 MD), adDashaEvidenceIds (C9 AD) (P1)
 * - Reports unmatched expression evidence IDs (planet-based linkage)
 * - Returns a frozen result with all linkage information
 * - Includes selectedDashaInterpretation with read-only node references (P2)
 *
 * EXPRESSION SOURCE CONTRACT:
 * - Rows are built from the caller's expression.expressions in both paths (canonical and proxy)
 * - In the canonical path: caller's expressions are filtered by matching to QUALIFIED canonical candidates
 *   - Matching uses evidence ID intersection: expression.supportingEvidenceIds ∩ candidate.evidence[].evidenceId
 *   - If no reliable mapping exists, the adapter-derived expressions are used (documented in expressionRefKey)
 * - In the proxy path: caller's expressions are filtered by expr.direction !== 'UNAVAILABLE'
 *
 * Guardrails enforced:
 * - No new expressions created
 * - Missing linkage → expression simply absent from rows (never a negative result)
 * - PD stays INSUFFICIENT_DATA
 * - Inputs/nodes not mutated
 * - C8 qualification boundary enforced (P2): only QUALIFIED expressions produce activation rows
 *   - When canonicalExpression is provided, filters by qualificationStatus === 'QUALIFIED'
 *   - When canonicalExpression is absent, uses interim proxy expr.direction !== 'UNAVAILABLE'
 *   - The qualificationBasis field in the result indicates which contract was used
 *
 * @param params - Parameters containing horoscope, natal, expression, selectedPeriod, optional canonicalExpression, and optional mechanismAwareInput
 * @returns A discriminated result: { ok: true, value } on success, { ok: false, error } on validation failure
 */
export function buildSelectedCareerDashaActivation(params: {
  readonly horoscope: Horoscope;
  readonly natal: CareerNatalAnalysis;
  readonly expression: CareerExpressionAnalysis;
  readonly selectedPeriod: SelectedPeriodActivationContext;
  readonly canonicalExpression?: CareerExpressionCanonicalResult;
  readonly mechanismCandidates?: readonly CareerMechanismCandidate[];
  readonly mechanismAwareInput?: CareerDashaMechanismAwareInput;
}): SelectedCareerDashaActivationResult {
  const { horoscope, natal, expression, selectedPeriod, canonicalExpression, mechanismCandidates, mechanismAwareInput } = params;

  // P1: Validate selected-period context consistency
  const isValid = validateSelectedPeriodContext(selectedPeriod);
  if (!isValid) {
    return { ok: false, error: 'INVALID_SELECTED_PERIOD_CONTEXT' };
  }

  // Reject inconsistent canonical inputs: if exactly one of canonicalExpression/mechanismCandidates is supplied
  const hasCanonicalExpression = canonicalExpression !== undefined;
  const hasMechanismCandidates = mechanismCandidates !== undefined && mechanismCandidates.length > 0;
  if (hasCanonicalExpression !== hasMechanismCandidates) {
    return { ok: false, error: 'INCOMPLETE_CANONICAL_INPUT' };
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

  // P1: Collect C9 canonical evidence IDs split by level
  const mdEvidenceIds = new Set<string>();
  const adEvidenceIds = new Set<string>();
  for (const evidence of canonicalDashaAnalysis.evidence) {
    // Only consider MD and AD levels (PD is unavailable by design)
    if (evidence.level === 'MD') {
      mdEvidenceIds.add(evidence.id);
    } else if (evidence.level === 'AD') {
      adEvidenceIds.add(evidence.id);
    }
  }

  // P1: Extract selected MD and AD planets for semantic linkage
  const mdPlanet = mdActivation.planet;
  const adPlanet = adActivation.planet;

  // P2: C8 qualification boundary - filter by QUALIFIED status or use proxy
  let qualifiedExpressions: CareerExpression[];
  let qualificationBasis: 'CANONICAL_STATUS' | 'PROXY_DIRECTION';

  if (canonicalExpression && mechanismCandidates) {
    // Use canonical qualification status (authoritative)
    const qualifiedCanonicalCandidates = canonicalExpression.expressions.filter(
      candidate => candidate.qualificationStatus === 'QUALIFIED'
    );

    // Build a set of all evidence IDs from QUALIFIED canonical candidates for matching
    const qualifiedCanonicalEvidenceIds = new Set<string>();
    for (const candidate of qualifiedCanonicalCandidates) {
      for (const evidence of candidate.evidence) {
        qualifiedCanonicalEvidenceIds.add(evidence.evidenceId);
      }
    }

    // Filter caller's expressions by matching to QUALIFIED canonical candidates
    // Match via evidence ID intersection: expression.supportingEvidenceIds ∩ candidate.evidence[].evidenceId
    const matchedCallerExpressions = expression.expressions.filter(expr => {
      // Check if any of the expression's supporting evidence IDs match canonical evidence IDs
      return expr.supportingEvidenceIds.some(id => qualifiedCanonicalEvidenceIds.has(id));
    });

    // If no reliable mapping exists (no matches), fall back to adapter-derived expressions
    // This is documented in expressionRefKey below
    if (matchedCallerExpressions.length > 0) {
      qualifiedExpressions = matchedCallerExpressions;
    } else {
      // No reliable mapping to caller's expressions - use adapter-derived expressions as fallback
      const canonicalResult: CareerExpressionCanonicalResult = {
        ...canonicalExpression,
        expressions: qualifiedCanonicalCandidates
      };
      const legacyAnalysis = adaptMechanismExpressionToLegacy(canonicalResult, mechanismCandidates);
      qualifiedExpressions = [...legacyAnalysis.expressions];
    }

    qualificationBasis = 'CANONICAL_STATUS';
  } else {
    // Use interim conservative proxy: expr.direction !== 'UNAVAILABLE'
    // TEMPORARY COMPATIBILITY PATH: Used when both canonicalExpression and mechanismCandidates are absent.
    // This is a fallback for backward compatibility; production callers should provide both inputs
    // to use the authoritative CANONICAL_STATUS qualification basis.
    qualifiedExpressions = [...expression.expressions.filter(expr => expr.direction !== 'UNAVAILABLE')];
    qualificationBasis = 'PROXY_DIRECTION';
  }

  // P1: Build expression activations using semantic planet linkage (per-level)
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

    // P1: Check if expression planets include selected MD planet or AD planet
    const isLinkedToMd = mdPlanet && exprPlanets.has(mdPlanet);
    const isLinkedToAd = adPlanet && exprPlanets.has(adPlanet);

    if (isLinkedToMd || isLinkedToAd) {
      // Collect expression evidence IDs (C8 evidence IDs, verbatim)
      const exprEvidenceIds = expr.evidence.map(e => e.id);
      const sortedExprEvidenceIds = Array.from(exprEvidenceIds).sort();

      // Build linkedLevels array (authoritative for which levels apply)
      const linkedLevels: ('MD' | 'AD')[] = [];
      if (isLinkedToMd) {
        linkedLevels.push('MD');
      }
      if (isLinkedToAd) {
        linkedLevels.push('AD');
      }

      // Collect MD evidence IDs only if linked to MD
      const mdDashaEvidenceIds = isLinkedToMd
        ? Array.from(mdEvidenceIds).sort()
        : [];

      // Collect AD evidence IDs only if linked to AD
      const adDashaEvidenceIds = isLinkedToAd
        ? Array.from(adEvidenceIds).sort()
        : [];

      // Track matched expression evidence IDs
      for (const exprEvidenceId of exprEvidenceIds) {
        matchedExpressionEvidenceIds.add(exprEvidenceId);
      }

      // Build expressionRefKey: mode:direction: + sorted expression evidence IDs
      // JSDoc: not a durable identity, just a deterministic local reference.
      // Note: If adapter-derived expressions are used (no reliable mapping to caller's expressions),
      // this key references the adapter's re-derived expressions, not the caller's original expressions.
      const expressionRefKey = `${expr.mode}:${expr.direction}:${sortedExprEvidenceIds.join(',')}`;

      expressionActivations.push(Object.freeze({
        expressionRefKey,
        expression: expr,
        expressionEvidenceIds: Object.freeze(sortedExprEvidenceIds),
        linkedLevels: Object.freeze(linkedLevels),
        mdDashaEvidenceIds: Object.freeze(mdDashaEvidenceIds),
        adDashaEvidenceIds: Object.freeze(adDashaEvidenceIds),
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
    qualificationBasis,
    canonicalDashaAnalysis,
    selectedDashaInterpretation: Object.freeze({
      mahadashaNode: selectedPeriod.mahadashaNode,
      antardashaNode: selectedPeriod.antardashaNode
    }),
    statement
  });

  return { ok: true, value };
}
