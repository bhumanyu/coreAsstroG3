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
  | 'INVALID_ANALYSIS_AS_OF';

export interface SelectedPeriodActivationContext {
  readonly contextVersion: typeof SELECTED_PERIOD_CONTEXT_VERSION;
  readonly dashaSystem: typeof DashaSystem.VIMSHOTTARI;
  readonly level: 'MD_AD';
  /** Identity of this selection, separate from evidence IDs and rule IDs. */
  readonly selectedPeriodId: string;
  readonly resolverVersion: typeof MD_AD_PERIOD_RESOLVER_VERSION;
  /** Exact AnalysisContext.asOf string; retained verbatim and never replaced by selected dates. */
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

function parseInstant(value: string): number | null {
  const milliseconds = Date.parse(value);
  return Number.isFinite(milliseconds) ? milliseconds : null;
}

function classifyTemporalRelation(
  selectedStart: string,
  selectedEnd: string,
  analysisAsOf: string
): SelectedPeriodTemporalRelation | null {
  const start = parseInstant(selectedStart);
  const end = parseInstant(selectedEnd);
  const asOf = parseInstant(analysisAsOf);

  if (start === null || end === null || asOf === null || start >= end) {
    return null;
  }

  // Canonical intervals are half-open [start, end): start is included, end excluded.
  if (asOf < start) return 'FUTURE';
  if (asOf >= end) return 'PAST';
  return 'CURRENT';
}

function createSelectedPeriodId(
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
  const temporalRelation = classifyTemporalRelation(
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
