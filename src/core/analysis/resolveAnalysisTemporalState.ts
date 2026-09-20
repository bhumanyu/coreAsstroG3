import type { Horoscope } from '../../types';
import type { AnalysisContext } from './AnalysisContext';
import type { AnalysisTemporalState } from './AnalysisTemporalState';
import { analysisAsOfDate } from './analysisTime';
import { resolveDashaInterpretationForAsOf } from '../../engine/dashaInterpretation/resolveDashaForAsOf';

/**
 * CANONICAL BOUNDARY: Single production temporal Dasha resolution orchestration point.
 *
 * This is the single production *temporal* Dasha resolution/orchestration point for an
 * AnalysisContext.asOf. Product-domain consumers (Career, Wealth, AI, etc.) must consume
 * the resulting AnalysisTemporalState rather than independently selecting an active Dasha
 * from horoscope.vimshottari, horoscope.dashaInterpretation, or any other source.
 *
 * Derives asOfDate from context, resolves Dasha interpretation for asOf,
 * and produces a frozen AnalysisTemporalState.
 */
export function resolveAnalysisTemporalState(
  horoscope: Horoscope,
  context: AnalysisContext
): AnalysisTemporalState {
  if (!context.asOf || isNaN(new Date(context.asOf).getTime())) {
    throw new Error(`[AnalysisTemporalState] Invalid asOf timestamp: "${context.asOf}"`);
  }
  const asOfDate = analysisAsOfDate(context);
  const dashaInterpretation = resolveDashaInterpretationForAsOf(horoscope, asOfDate);
  if (dashaInterpretation && !Object.isFrozen(dashaInterpretation)) {
    Object.freeze(dashaInterpretation);
  }
  return Object.freeze({
    asOf: context.asOf,
    dashaInterpretation
  });
}
