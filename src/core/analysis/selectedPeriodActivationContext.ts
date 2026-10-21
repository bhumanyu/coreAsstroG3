import type {
  DashaInterpretationReport,
  DashaMahadashaInterpretation,
  DashaAntardashaInterpretation
} from '../../engine/dashaInterpretation/dashaInterpretationTypes';
import { DashaSystem } from '../../types';
import {
  MD_AD_PERIOD_RESOLVER_VERSION,
  resolveSelectedMdAdPeriod,
  type ResolutionError
} from './selectedMdAdPeriod';
import {
  parseInstant,
  classifyTemporalRelation,
  type TemporalRelation
} from './temporalInterval';

/**
 * Version for the selected-period activation context contract.
 * Bump this only when the context's externally observable semantics change.
 */
export const SELECTED_PERIOD_CONTEXT_VERSION = 'v1' as const;

/**
 * Descriptive relationship between the selected interval and the existing analysis asOf.
 * This never changes the interval or causes the engines to recalculate for a different date.
 */
export type SelectedPeriodTemporalRelation = 'PAST' | 'CURRENT' | 'FUTURE';

export type SelectedPeriodContextError =
  | ResolutionError
  | 'INVALID_ANALYSIS_AS_OF'
  | 'INVALID_SELECTED_PERIOD_CONTEXT';

export interface SelectedPeriodActivationContext {
  readonly contextVersion: typeof SELECTED_PERIOD_CONTEXT_VERSION;
  readonly dashaSystem: typeof DashaSystem.VIMSHOTTARI;
  readonly level: 'MD_AD';
  /**
   * Versioned internal selection identifier for this analysis layer.
   * Not an evidence ID, rule ID, or durable external/storage identity.
   * Downstream persistence/API contracts must not rely on its format without a versioned migration.
   */
  readonly selectedPeriodId: string;
  readonly resolverVersion: typeof MD_AD_PERIOD_RESOLVER_VERSION;
  /**
   * Exact AnalysisContext.asOf string; retained verbatim and never replaced by selected dates.
   * createAnalysisContext/normalizeAsOf canonicalizes asOf upstream; this factory validates parseability only and preserves the string verbatim.
   */
  readonly analysisAsOf: string;
  readonly temporalRelation: SelectedPeriodTemporalRelation;
  /** Half-open interval semantics: start is included, end is excluded. */
  readonly intervalSemantics: '[start,end)';
  /** Whole selected AD interval, preserving canonical source strings. */
  readonly interval: { readonly start: string; readonly end: string };
  readonly mahadasha: {
    readonly id: string;
    readonly planet: DashaMahadashaInterpretation['planet'];
    readonly start: string;
    readonly end: string;
  };
  readonly antardasha: {
    readonly id: string;
    readonly mahadashaId: string;
    readonly planet: DashaAntardashaInterpretation['planet'];
    readonly start: string;
    readonly end: string;
  };
  /**
   * Canonical MD/AD interpretation nodes selected from the existing report.
   * These preserve deterministic activation/evidence/provenance; this layer does not
   * recompute, merge, or reinterpret those facts.
   *
   * Read-only view: nodes are shared by reference with the canonical report and are
   * shallowly (not deeply) frozen. Downstream consumers (PBA-04/05) must not mutate them.
   */
  readonly mahadashaNode: DashaMahadashaInterpretation;
  readonly antardashaNode: DashaAntardashaInterpretation;
}

export type SelectedPeriodActivationContextResult =
  | { readonly ok: true; readonly value: SelectedPeriodActivationContext }
  | { readonly ok: false; readonly error: SelectedPeriodContextError };

export interface CreateSelectedPeriodActivationContextInput {
  readonly report: DashaInterpretationReport | null | undefined;
  readonly selection: {
    readonly mahadashaId: string;
    readonly antardashaId: string;
  };
  /** Pass the existing AnalysisContext.asOf value without changing it. */
  readonly analysisAsOf: string;
}

/**
 * Classify temporal relation for selected-period activation context.
 * Uses the shared classifyTemporalRelation utility.
 *
 * Returns null for INVALID or UNKNOWN relations (fail-closed rejection).
 * This ensures inverted intervals are rejected rather than silently treated as UNKNOWN.
 */
function classifyTemporalRelationForContext(
  selectedStart: string,
  selectedEnd: string,
  analysisAsOf: string
): SelectedPeriodTemporalRelation | null {
  const relation = classifyTemporalRelation(selectedStart, selectedEnd, analysisAsOf);

  // Reject INVALID (inverted intervals) and UNKNOWN (unparseable dates)
  if (relation === 'INVALID' || relation === 'UNKNOWN') {
    return null;
  }

  // PAST, CURRENT, FUTURE are valid
  return relation as SelectedPeriodTemporalRelation;
}

/**
 * Versioned internal selection identifier for this analysis layer.
 * Not an evidence ID, rule ID, or durable external/storage identity.
 * Downstream persistence/API contracts must not rely on its format without a versioned migration.
 */
export function createSelectedPeriodId(
  mahadashaId: string,
  antardashaId: string
): string {
  // Selection identity is not an evidence/rule identity. Encoding makes the tuple unambiguous.
  return `pba-period:${SELECTED_PERIOD_CONTEXT_VERSION}:${encodeURIComponent(mahadashaId)}:${encodeURIComponent(antardashaId)}`;
}

/**
 * Resolve a PBA-02 canonical MD–AD selection into an explicit activation context.
 *
 * Important boundaries:
 * - analysisAsOf is descriptive context only; it is not replaced by the selected interval.
 * - report.current / report.activePeriods are never used as the selected period.
 * - no Dasha dates are calculated here.
 * - the canonical MD and AD interpretation nodes are preserved by reference.
 * - this function does not run Career/Wealth activation or synthesis; those are PBA-04/05/06.
 */
export function createSelectedPeriodActivationContext(
  input: CreateSelectedPeriodActivationContextInput
): SelectedPeriodActivationContextResult {
  const asOfMilliseconds = parseInstant(input.analysisAsOf);
  if (asOfMilliseconds === null) {
    return { ok: false, error: 'INVALID_ANALYSIS_AS_OF' };
  }

  const resolved = resolveSelectedMdAdPeriod(input.report, input.selection);
  if (!resolved.ok) {
    return resolved;
  }

  const { interval, mahadasha, mahadashaNode, antardashaNode } = resolved.value;
  const temporalRelation = classifyTemporalRelationForContext(
    interval.start,
    interval.end,
    input.analysisAsOf
  );

  // PBA-02 already validates the selected interval; keep a defensive check at this boundary.
  if (temporalRelation === null) {
    return { ok: false, error: 'INVALID_SELECTED_PERIOD' };
  }

  const mahadashaId = input.selection.mahadashaId;
  const antardashaId = input.selection.antardashaId;
  const value: SelectedPeriodActivationContext = {
    contextVersion: SELECTED_PERIOD_CONTEXT_VERSION,
    dashaSystem: DashaSystem.VIMSHOTTARI,
    level: 'MD_AD',
    selectedPeriodId: createSelectedPeriodId(mahadashaId, antardashaId),
    resolverVersion: MD_AD_PERIOD_RESOLVER_VERSION,
    analysisAsOf: input.analysisAsOf,
    temporalRelation,
    intervalSemantics: '[start,end)',
    interval: Object.freeze({ start: interval.start, end: interval.end }),
    mahadasha: Object.freeze({
      id: mahadashaId,
      planet: mahadasha.planet,
      start: mahadasha.start,
      end: mahadasha.end
    }),
    antardasha: Object.freeze({
      id: antardashaId,
      mahadashaId,
      planet: antardashaNode.planet,
      start: antardashaNode.start,
      end: antardashaNode.end
    }),
    mahadashaNode,
    antardashaNode
  };

  return { ok: true, value: Object.freeze(value) };
}

/**
 * Validates selected-period context consistency.
 *
 * Verifies:
 * - ctx is truthy and an object
 * - ctx.mahadasha, ctx.mahadashaNode, ctx.antardasha, ctx.antardashaNode, ctx.interval exist and are objects
 * - required string fields (planet, start, end, id, mahadashaId) are present and are strings
 * - ctx.contextVersion === SELECTED_PERIOD_CONTEXT_VERSION
 * - ctx.resolverVersion === MD_AD_PERIOD_RESOLVER_VERSION
 * - ctx.selectedPeriodId is a non-empty string matching createSelectedPeriodId(mahadasha.id, antardasha.id)
 * - ctx.analysisAsOf is a parseable date string
 * - ctx.temporalRelation is one of 'PAST' | 'CURRENT' | 'FUTURE'
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
 * On any mismatch, returns false.
 * Never substitutes current-Dasha data on mismatch.
 *
 * @param ctx - The selected period activation context to validate (accepts unknown for defensive validation)
 * @returns true if valid, false if invalid
 */
export function validateSelectedPeriodContext(
  ctx: unknown
): boolean {
  // Defensive: reject falsy or non-object input
  if (!ctx || typeof ctx !== 'object' || Array.isArray(ctx)) {
    return false;
  }

  const typedCtx = ctx as Partial<SelectedPeriodActivationContext>;

  // Defensive: verify required nested objects exist
  if (
    !typedCtx.mahadasha ||
    typeof typedCtx.mahadasha !== 'object' ||
    !typedCtx.mahadashaNode ||
    typeof typedCtx.mahadashaNode !== 'object' ||
    !typedCtx.antardasha ||
    typeof typedCtx.antardasha !== 'object' ||
    !typedCtx.antardashaNode ||
    typeof typedCtx.antardashaNode !== 'object' ||
    !typedCtx.interval ||
    typeof typedCtx.interval !== 'object'
  ) {
    return false;
  }

  // Defensive: verify required string fields
  if (
    typeof typedCtx.mahadasha.planet !== 'string' ||
    typeof typedCtx.mahadasha.start !== 'string' ||
    typeof typedCtx.mahadasha.end !== 'string' ||
    typeof typedCtx.mahadasha.id !== 'string' ||
    typeof typedCtx.antardasha.planet !== 'string' ||
    typeof typedCtx.antardasha.start !== 'string' ||
    typeof typedCtx.antardasha.end !== 'string' ||
    typeof typedCtx.antardasha.id !== 'string' ||
    typeof typedCtx.antardasha.mahadashaId !== 'string' ||
    typeof typedCtx.interval.start !== 'string' ||
    typeof typedCtx.interval.end !== 'string'
  ) {
    return false;
  }

  // Verify top-level metadata: contextVersion
  if (typedCtx.contextVersion !== SELECTED_PERIOD_CONTEXT_VERSION) {
    return false;
  }

  // Verify top-level metadata: resolverVersion
  if (typedCtx.resolverVersion !== MD_AD_PERIOD_RESOLVER_VERSION) {
    return false;
  }

  // Verify top-level metadata: selectedPeriodId (must be non-empty string)
  if (typeof typedCtx.selectedPeriodId !== 'string' || typedCtx.selectedPeriodId.length === 0) {
    return false;
  }

  // Verify selectedPeriodId consistency with mahadasha/antardasha IDs
  const expectedPeriodId = createSelectedPeriodId(typedCtx.mahadasha.id, typedCtx.antardasha.id);
  if (typedCtx.selectedPeriodId !== expectedPeriodId) {
    return false;
  }

  // Verify top-level metadata: analysisAsOf (must be parseable date string)
  if (typeof typedCtx.analysisAsOf !== 'string' || Number.isNaN(Date.parse(typedCtx.analysisAsOf))) {
    return false;
  }

  // Verify top-level metadata: temporalRelation (must be valid enum value)
  if (
    typedCtx.temporalRelation !== 'PAST' &&
    typedCtx.temporalRelation !== 'CURRENT' &&
    typedCtx.temporalRelation !== 'FUTURE'
  ) {
    return false;
  }

  // Recompute expected temporal relation from interval and analysisAsOf
  // This ensures the supplied temporalRelation matches the actual temporal semantics
  const recomputedRelation = classifyTemporalRelation(
    typedCtx.interval.start,
    typedCtx.interval.end,
    typedCtx.analysisAsOf
  );

  // Reject INVALID (inverted intervals) and UNKNOWN (unparseable dates)
  if (recomputedRelation === 'INVALID' || recomputedRelation === 'UNKNOWN') {
    return false;
  }

  // Validate that supplied temporalRelation matches recomputed relation
  if (typedCtx.temporalRelation !== recomputedRelation) {
    return false;
  }

  // Verify dasha system
  if (typedCtx.dashaSystem !== DashaSystem.VIMSHOTTARI) {
    return false;
  }

  // Verify level
  if (typedCtx.level !== 'MD_AD') {
    return false;
  }

  // Verify interval semantics
  if (typedCtx.intervalSemantics !== '[start,end)') {
    return false;
  }

  // Verify mahadasha consistency between context and node
  if (typedCtx.mahadasha.planet !== typedCtx.mahadashaNode.planet) {
    return false;
  }
  if (typedCtx.mahadasha.start !== typedCtx.mahadashaNode.start) {
    return false;
  }
  if (typedCtx.mahadasha.end !== typedCtx.mahadashaNode.end) {
    return false;
  }

  // Verify antardasha consistency between context and node
  if (typedCtx.antardasha.planet !== typedCtx.antardashaNode.planet) {
    return false;
  }
  if (typedCtx.antardasha.start !== typedCtx.antardashaNode.start) {
    return false;
  }
  if (typedCtx.antardasha.end !== typedCtx.antardashaNode.end) {
    return false;
  }

  // Verify antardasha mahadashaId matches mahadasha id
  if (typedCtx.antardasha.mahadashaId !== typedCtx.mahadasha.id) {
    return false;
  }

  // Verify interval matches antardasha node
  if (typedCtx.interval.start !== typedCtx.antardashaNode.start) {
    return false;
  }
  if (typedCtx.interval.end !== typedCtx.antardashaNode.end) {
    return false;
  }

  // Parse and verify interval ordering
  const startMs = Date.parse(typedCtx.interval.start);
  const endMs = Date.parse(typedCtx.interval.end);
  const mdStartMs = Date.parse(typedCtx.mahadasha.start);
  const mdEndMs = Date.parse(typedCtx.mahadasha.end);

  if (Number.isNaN(startMs) || Number.isNaN(endMs) || Number.isNaN(mdStartMs) || Number.isNaN(mdEndMs)) {
    return false;
  }

  // Verify start < end
  if (startMs >= endMs) {
    return false;
  }

  // Verify AD interval contained in MD interval
  if (startMs < mdStartMs || endMs > mdEndMs) {
    return false;
  }

  // All checks passed
  return true;
}
