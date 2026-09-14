import type { Horoscope } from '../../types';
import type { DashaInterpretationReport, DashaInterpretationInput } from './dashaInterpretationTypes';
import { analyzeActiveDasha, analyzeDashaInterpretation } from './dashaInterpretation';
import { normalizeNatalGrahaDrishti } from '../natalGrahaDrishti';

/**
 * Resolves or recomputes DashaInterpretationReport for the given asOf date.
 *
 * Precedence:
 * 1. Prefer existing horoscope.dashaInterpretation if it already contains active/current.
 * 2. If asOfDate is provided and valid, recompute active dasha via analyzeActiveDasha(input, asOfDate).
 * 3. Fall back to existing horoscope.dashaInterpretation.
 *
 * Missing evidence handling:
 * Does NOT synthesize an empty aspect list if natalGrahaDrishti is absent or invalid.
 * Missing evidence is preserved as undefined and omitted from input.
 */
export function resolveDashaInterpretationForAsOf(
  horoscope: Horoscope,
  asOfDate?: Date
): DashaInterpretationReport | undefined {
  if (horoscope.dashaInterpretation?.current) {
    return horoscope.dashaInterpretation;
  }
  if (!asOfDate || isNaN(asOfDate.getTime())) {
    return horoscope.dashaInterpretation;
  }
  try {
    const natalGrahaDrishti = normalizeNatalGrahaDrishti(horoscope.natalGrahaDrishti);
    const input: DashaInterpretationInput = {
      vimshottari: horoscope.vimshottari,
      planetInterpretation: horoscope.planetInterpretation,
      houseInterpretation: horoscope.houseInterpretation,
      functionalRoles: horoscope.functionalRoles,
      ...(natalGrahaDrishti ? { natalGrahaDrishti } : {}),
      yogas: horoscope.yogas,
      planetAnalysis: horoscope.planetAnalysis,
      ...(horoscope.planetaryStrength ? { planetaryStrength: horoscope.planetaryStrength } : {})
    };
    const activeDasha = analyzeActiveDasha(input, asOfDate);
    if (activeDasha) {
      return Object.freeze({
        ...(horoscope.dashaInterpretation ?? analyzeDashaInterpretation(input)),
        current: activeDasha,
        activePeriods: activeDasha
      });
    }
  } catch {
    // fallback to existing dashaInterpretation
  }
  return horoscope.dashaInterpretation;
}
