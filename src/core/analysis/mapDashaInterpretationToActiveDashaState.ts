import type { DashaInterpretationReport } from '../../engine/dashaInterpretation/dashaInterpretationTypes';
import { Planet } from '../../types';

/**
 * Narrow timing-specific interface for Dasha context in transit synthesis.
 * Only includes planet identity needed by transit correlation logic.
 */
export interface ActiveDashaTimingContext {
  readonly mahadashaPlanet: Planet;
  readonly antardashaPlanet: Planet;
  readonly pratyantardashaPlanet: Planet;
}

/**
 * Maps from canonical DashaInterpretationReport to ActiveDashaTimingContext.
 * Derived from temporalState.dashaInterpretation to ensure single-point canonical resolution.
 * Extracts only the planet identity needed by transit synthesis functions.
 *
 * Returns null if the dasha interpretation or current period is not available.
 */
export function mapDashaInterpretationToActiveDashaState(
  dashaInterpretation: DashaInterpretationReport | undefined
): ActiveDashaTimingContext | null {
  if (!dashaInterpretation?.current) {
    return null;
  }
  const { current } = dashaInterpretation;
  if (!current.mahadasha?.planet || !current.antardasha?.planet || !current.pratyantardasha?.planet) {
    return null;
  }
  return {
    mahadashaPlanet: current.mahadasha.planet,
    antardashaPlanet: current.antardasha.planet,
    pratyantardashaPlanet: current.pratyantardasha.planet
  };
}
