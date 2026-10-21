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

import {
  validateSelectedPeriodContext
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
 *
 * AMBIGUOUS MATCH HANDLING:
 * When a caller expression matches multiple QUALIFIED canonical candidates via evidence containment,
 * the expression is marked as ambiguous. The matchBasis field indicates whether the match is
 * unambiguous (single candidate) or ambiguous (multiple candidates).
 */
export interface SelectedExpressionActivation {
  /**
   * Local key derived from mode:direction: + sorted expression evidence IDs.
   * JSDoc: not a durable identity, just a deterministic local reference.
   * When expressionSource is 'ADAPTER_FALLBACK', this key references the adapter's re-derived expressions,
   * not the caller's original expressions.
   */
  readonly expressionRefKey: string;
  /**
   * Source of the expression: 'CALLER' if from caller's expression.expressions,
   * 'ADAPTER_FALLBACK' if derived from canonical candidates via adapter (no reliable mapping to caller's expressions).
   */
  readonly expressionSource: 'CALLER' | 'ADAPTER_FALLBACK';
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
   * Evidence IDs from expression.supportingEvidenceIds that match QUALIFIED canonical candidates.
   * Only populated when qualificationBasis === 'CANONICAL_STATUS'. Empty array otherwise.
   * This allows consumers to distinguish qualified vs unqualified provenance.
   */
  readonly qualifiedEvidenceIds: readonly string[];
  /**
   * Evidence IDs from expression.supportingEvidenceIds that do NOT match QUALIFIED canonical candidates.
   * Only populated when qualificationBasis === 'CANONICAL_STATUS'. Empty array otherwise.
   * This allows consumers to distinguish qualified vs unqualified provenance.
   */
  readonly unqualifiedEvidenceIds: readonly string[];
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
   * Match basis for the expression: 'UNAMBIGUOUS' if matched exactly one QUALIFIED candidate,
   * 'AMBIGUOUS' if matched multiple QUALIFIED candidates. Only applicable when expressionSource === 'CALLER'.
   * Undefined for ADAPTER_FALLBACK expressions.
   */
  readonly matchBasis?: 'UNAMBIGUOUS' | 'AMBIGUOUS';
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
 * Diagnostic emitted during selected Career Dasha activation.
 *
 * Structured diagnostic channel for transparency into adapter fallback,
 * evidence ID collisions, and other edge cases.
 */
export interface SelectedCareerDashaActivationDiagnostic {
  /**
   * Diagnostic code identifying the type of issue.
   */
  readonly code: 'ADAPTER_FALLBACK_DROPPED_CANDIDATES' | 'CANONICAL_EVIDENCE_ID_COLLISION' | 'AMBIGUOUS_EXPRESSION_MATCH';
  /**
   * Human-readable description of the diagnostic.
   */
  readonly message: string;
  /**
   * For ADAPTER_FALLBACK_DROPPED_CANDIDATES: IDs of candidates dropped by first-candidate fallback.
   */
  readonly droppedCandidateIds?: readonly string[];
  /**
   * For ADAPTER_FALLBACK_DROPPED_CANDIDATES: total count of QUALIFIED candidates available.
   */
  readonly candidateCount?: number;
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
   * 'PROXY_DIRECTION': Used interim proxy expr.direction !== 'UNAVAILABLE' (conservative, legacy caller didn't provide canonical inputs)
   * 'UNAVAILABLE': Canonical inputs were provided but mechanismCandidates was empty (genuinely no qualifying mechanisms for this chart)
   */
  readonly qualificationBasis: 'CANONICAL_STATUS' | 'PROXY_DIRECTION' | 'UNAVAILABLE';
  /**
   * Canonical Dasha analysis for the selected period.
   *
   * P2: The evidence in canonicalDashaAnalysis.evidence is Career-activation evidence
   * derived from natal/relevance/condition inputs — NOT the PBA-03 nodes' evidence/domainSynthesis,
   * which are carried by reference only in selectedDashaInterpretation and not consumed by C9.
   */
  readonly canonicalDashaAnalysis: CareerDashaCanonicalAnalysis;
  /**
   * Diagnostics emitted during activation building.
   *
   * Provides structured transparency into adapter fallback, evidence ID collisions,
   * ambiguous matches, and other edge cases.
   */
  readonly diagnostics: readonly SelectedCareerDashaActivationDiagnostic[];
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
 *   - P2: Matching uses evidence ID containment: ALL candidate.evidence[].evidenceId must be in expression.supportingEvidenceIds
 *   - The evidence ID bridge is reliable: canonical evidence.evidenceId maps 1:1 to legacy evidence.id and supportingEvidenceIds
 *     (see mechanismExpressionToLegacyAdapter.ts createLegacyEvidence ~L159)
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
  const hasMechanismCandidates = mechanismCandidates !== undefined;
  // Reject if exactly one is present
  if (hasCanonicalExpression !== hasMechanismCandidates) {
    return { ok: false, error: 'INCOMPLETE_CANONICAL_INPUT' };
  }
  // Allow empty mechanismCandidates (genuinely no qualifying mechanisms for this chart)
  // This will emit qualificationBasis: 'UNAVAILABLE' instead of PROXY_DIRECTION

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
  let qualificationBasis: 'CANONICAL_STATUS' | 'PROXY_DIRECTION' | 'UNAVAILABLE';
  // Track qualified canonical evidence IDs per expression (scoped to matched candidates)
  const expressionQualifiedEvidenceIds = new Map<CareerExpression, Set<string>>();
  // Track whether we used adapter fallback (for per-expression source determination)
  let usedAdapterFallback = false;
  // Track match basis per expression (for ambiguous match detection)
  const expressionMatchBasis = new Map<CareerExpression, 'UNAMBIGUOUS' | 'AMBIGUOUS'>();
  // Collect diagnostics for structured transparency
  const diagnostics: SelectedCareerDashaActivationDiagnostic[] = [];

  if (canonicalExpression && mechanismCandidates) {
    // Canonical inputs provided - check if mechanismCandidates is empty
    if (mechanismCandidates.length === 0) {
      // Canonical inputs provided but no qualifying mechanisms for this chart
      // Emit UNAVAILABLE qualification basis (fail-closed semantics)
      qualifiedExpressions = [];
      usedAdapterFallback = false;
      qualificationBasis = 'UNAVAILABLE';
    } else {
      // Use canonical qualification status (authoritative)
      const qualifiedCanonicalCandidates = canonicalExpression.expressions.filter(
        candidate => candidate.qualificationStatus === 'QUALIFIED'
      );

      // Diagnostic: Check for canonical evidence ID uniqueness across all QUALIFIED candidates
      // If evidence IDs are globally unique, each evidenceId should appear in at most one candidate
      const allCanonicalEvidenceIds = new Map<string, string>(); // evidenceId -> candidateId
      for (const candidate of qualifiedCanonicalCandidates) {
        for (const evidence of candidate.evidence) {
          const existingCandidateId = allCanonicalEvidenceIds.get(evidence.evidenceId);
          if (existingCandidateId !== undefined && existingCandidateId !== candidate.expressionId) {
            // Evidence ID appears in multiple candidates - this violates the uniqueness assumption
            // Emit structured diagnostic but do not fail (consume gracefully)
            diagnostics.push(Object.freeze({
              code: 'CANONICAL_EVIDENCE_ID_COLLISION',
              message: `Canonical evidence ID "${evidence.evidenceId}" appears in multiple candidates: "${existingCandidateId}" and "${candidate.expressionId}". This violates the uniqueness assumption for canonical evidence IDs. Qualified evidence scoping may be affected.`
            }));
          }
          allCanonicalEvidenceIds.set(evidence.evidenceId, candidate.expressionId);
        }
      }

      // P2: Filter caller's expressions by matching to QUALIFIED canonical candidates
      // Prefer explicit identity mapping: require ALL of a candidate's evidence IDs to be in
      // expression.supportingEvidenceIds (containment, not overlap). This ensures the caller expression
      // corresponds to the full canonical candidate, not just a partial overlap.
      // The evidence ID bridge is reliable: canonical evidence.evidenceId maps 1:1 to legacy evidence.id
      // and supportingEvidenceIds (see mechanismExpressionToLegacyAdapter.ts createLegacyEvidence ~L159).
      // Guard: empty-evidence candidates cannot match via containment (they have no identity to bridge).
      // Ambiguous match detection: collect ALL matching candidates per expression, not just first-match.
      const matchedCallerExpressionsWithCandidates = expression.expressions.map(expr => {
        const matchingCandidates: CareerExpressionCanonicalCandidate[] = [];
        // For each QUALIFIED canonical candidate, check if ALL of its evidence IDs are in
        // the expression's supportingEvidenceIds (containment check)
        for (const candidate of qualifiedCanonicalCandidates) {
          // Guard: empty-evidence candidates cannot match via containment
          if (candidate.evidence.length === 0) {
            continue;
          }
          // Check containment: all candidate evidence IDs must be in expression's supportingEvidenceIds
          const isContainmentMatch = candidate.evidence.every(
            evidenceItem => expr.supportingEvidenceIds.includes(evidenceItem.evidenceId)
          );
          if (isContainmentMatch) {
            matchingCandidates.push(candidate);
          }
        }
        return { expr, matchingCandidates };
      });

      // Determine match basis for each expression and filter unambiguous matches
      // Conservative approach: omit ambiguous matches (do not treat as reliably identified)
      const matchedCallerExpressions = matchedCallerExpressionsWithCandidates
        .filter(({ matchingCandidates }) => matchingCandidates.length === 1)
        .map(({ expr, matchingCandidates }) => {
          // Exactly one match - mark as UNAMBIGUOUS
          expressionMatchBasis.set(expr, 'UNAMBIGUOUS');
          // Scope qualified evidence IDs to the matched candidate (not global union)
          const matchedCandidate = matchingCandidates[0];
          const qualifiedIds = new Set<string>();
          for (const evidence of matchedCandidate.evidence) {
            qualifiedIds.add(evidence.evidenceId);
          }
          expressionQualifiedEvidenceIds.set(expr, qualifiedIds);
          return expr;
        });

      // Emit diagnostic for ambiguous matches (multiple candidates matched)
      for (const { expr, matchingCandidates } of matchedCallerExpressionsWithCandidates) {
        if (matchingCandidates.length > 1) {
          diagnostics.push(Object.freeze({
            code: 'AMBIGUOUS_EXPRESSION_MATCH',
            message: `Expression ${expr.mode}:${expr.direction} matched ${matchingCandidates.length} QUALIFIED canonical candidates (${matchingCandidates.map(c => c.expressionId).join(', ')}). Expression dropped from results (ambiguous match).`
          }));
        }
      }

      // If no reliable mapping exists (no matches), fall back to adapter-derived expressions
      // This is documented in expressionRefKey below
      if (matchedCallerExpressions.length > 0) {
        qualifiedExpressions = matchedCallerExpressions;
        usedAdapterFallback = false;
      } else if (qualifiedCanonicalCandidates.length > 0) {
        // No reliable mapping to caller's expressions - use adapter-derived expressions as fallback
        // Use only the first QUALIFIED candidate to avoid generating multiple expressions
        const firstCandidate = qualifiedCanonicalCandidates[0];
        const canonicalResult: CareerExpressionCanonicalResult = {
          ...canonicalExpression,
          expressions: [firstCandidate]
        };
        const legacyAnalysis = adaptMechanismExpressionToLegacy(canonicalResult, mechanismCandidates);
        qualifiedExpressions = [...legacyAnalysis.expressions];
        usedAdapterFallback = true;
        // For ADAPTER_FALLBACK expressions, use the first QUALIFIED candidate's evidence IDs
        // (since adapter derives from canonical candidates, we scope to their evidence)
        const qualifiedIds = new Set<string>();
        for (const evidence of firstCandidate.evidence) {
          qualifiedIds.add(evidence.evidenceId);
        }
        // Apply to all adapter-derived expressions (they all come from the same canonical source)
        for (const expr of qualifiedExpressions) {
          expressionQualifiedEvidenceIds.set(expr, qualifiedIds);
        }

        // Emit diagnostic if multiple QUALIFIED candidates were available but not used
        if (qualifiedCanonicalCandidates.length > 1) {
          const droppedCandidateIds = qualifiedCanonicalCandidates
            .slice(1)
            .map(c => c.expressionId);
          diagnostics.push(Object.freeze({
            code: 'ADAPTER_FALLBACK_DROPPED_CANDIDATES',
            message: `Multiple QUALIFIED canonical candidates available (${qualifiedCanonicalCandidates.length}), but adapter fallback uses only the first candidate: "${firstCandidate.expressionId}". Dropped candidate IDs: ${droppedCandidateIds.join(', ')}. This is a documented limitation of the adapter fallback path when no reliable mapping to caller expressions exists.`,
            droppedCandidateIds: Object.freeze(droppedCandidateIds),
            candidateCount: qualifiedCanonicalCandidates.length
          }));
        }
      } else {
        // No QUALIFIED candidates - use empty expressions (no fallback)
        qualifiedExpressions = [];
        usedAdapterFallback = false;
      }

      qualificationBasis = 'CANONICAL_STATUS';
    }
  } else {
    // Use interim conservative proxy: expr.direction !== 'UNAVAILABLE'
    // TEMPORARY COMPATIBILITY PATH: Used when both canonicalExpression and mechanismCandidates are absent.
    // This is a fallback for backward compatibility; production callers should provide both inputs
    // to use the authoritative CANONICAL_STATUS qualification basis.
    qualifiedExpressions = [...expression.expressions.filter(expr => expr.direction !== 'UNAVAILABLE')];
    usedAdapterFallback = false;
    qualificationBasis = 'PROXY_DIRECTION';
  }

  // P1: Build expression activations using semantic planet linkage (per-level)
  const expressionActivations: SelectedExpressionActivation[] = [];
  const matchedExpressionEvidenceIds = new Set<string>();

  for (const expr of qualifiedExpressions) {
    // P1: Collect planets from expression evidence, filtering to qualified provenance when using CANONICAL_STATUS
    // When qualificationBasis === 'CANONICAL_STATUS', only build exprPlanets from evidence items
    // whose canonical evidence ID (evidence.id) is in the expression's qualified evidence set.
    // This ensures qualified-only planet linkage: unqualified evidence cannot drive MD/AD linkage.
    const exprQualifiedEvidenceIds = expressionQualifiedEvidenceIds.get(expr);
    const exprPlanets = new Set<Planet>();
    for (const evidence of expr.evidence) {
      // When using canonical qualification, filter evidence to qualified provenance only
      if (qualificationBasis === 'CANONICAL_STATUS' && exprQualifiedEvidenceIds !== undefined) {
        // Skip evidence whose canonical ID is not qualified
        if (!exprQualifiedEvidenceIds.has(evidence.id)) {
          continue;
        }
      }
      for (const planet of evidence.planets) {
        exprPlanets.add(planet);
      }
    }

    // P1: Check if expression planets include selected MD planet or AD planet
    // After qualified-only filtering, if no MD/AD planet remains, the expression does not link
    const isLinkedToMd = mdPlanet && exprPlanets.has(mdPlanet);
    const isLinkedToAd = adPlanet && exprPlanets.has(adPlanet);

    if (isLinkedToMd || isLinkedToAd) {
      // Collect expression evidence IDs (C8 evidence IDs, verbatim)
      const exprEvidenceIds = expr.evidence.map(e => e.id);
      const sortedExprEvidenceIds = Array.from(exprEvidenceIds).sort();

      // Split supportingEvidenceIds into qualified vs unqualified portions
      // Only applicable when using CANONICAL_STATUS qualification basis
      let qualifiedEvidenceIds: readonly string[] = [];
      let unqualifiedEvidenceIds: readonly string[] = [];
      if (qualificationBasis === 'CANONICAL_STATUS' && exprQualifiedEvidenceIds !== undefined) {
        const qualified: string[] = [];
        const unqualified: string[] = [];
        for (const id of expr.supportingEvidenceIds) {
          if (exprQualifiedEvidenceIds.has(id)) {
            qualified.push(id);
          } else {
            unqualified.push(id);
          }
        }
        qualifiedEvidenceIds = Object.freeze(qualified.sort());
        unqualifiedEvidenceIds = Object.freeze(unqualified.sort());
      } else {
        // Empty arrays when not using canonical qualification
        qualifiedEvidenceIds = Object.freeze([]);
        unqualifiedEvidenceIds = Object.freeze([]);
      }

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

      // Determine expression source: all expressions in a batch have the same source
      const expressionSource: 'CALLER' | 'ADAPTER_FALLBACK' = usedAdapterFallback ? 'ADAPTER_FALLBACK' : 'CALLER';

      // Determine match basis (only for CALLER expressions)
      const matchBasis = expressionSource === 'CALLER' ? expressionMatchBasis.get(expr) : undefined;

      expressionActivations.push(Object.freeze({
        expressionRefKey,
        expressionSource,
        expression: expr,
        expressionEvidenceIds: Object.freeze(sortedExprEvidenceIds),
        qualifiedEvidenceIds,
        unqualifiedEvidenceIds,
        linkedLevels: Object.freeze(linkedLevels),
        mdDashaEvidenceIds: Object.freeze(mdDashaEvidenceIds),
        adDashaEvidenceIds: Object.freeze(adDashaEvidenceIds),
        matchBasis,
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
    statement,
    diagnostics: Object.freeze(diagnostics)
  });

  return { ok: true, value };
}
