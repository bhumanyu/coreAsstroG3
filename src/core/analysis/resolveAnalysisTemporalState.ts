import type { Horoscope } from '../../types';
import type { AnalysisContext } from './AnalysisContext';
import type { AnalysisTemporalState } from './AnalysisTemporalState';
import { analysisAsOfDate } from './analysisTime';
import { resolveDashaInterpretationForAsOf } from '../../engine/dashaInterpretation/resolveDashaForAsOf';

/**
 * Single canonical temporal-resolution point.
 * Derives asOfDate from context, resolves Dasha interpretation for asOf,
 * and produces a frozen AnalysisTemporalState.
 */
export function resolveAnalysisTemporalState(
  horoscope: Horoscope,
  context: AnalysisContext
): AnalysisTemporalState {
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
