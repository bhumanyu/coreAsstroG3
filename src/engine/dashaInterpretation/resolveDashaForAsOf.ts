import type { Horoscope } from '../../types';
import type { DashaInterpretationReport, DashaInterpretationInput } from './dashaInterpretationTypes';
import { analyzeActiveDasha, analyzeDashaInterpretation } from './dashaInterpretation';
import { normalizeNatalGrahaDrishti } from '../natalGrahaDrishti';

/**
 * Resolves or recomputes DashaInterpretationReport for the given asOf date.
 *
 * Precedence:
 * 1. If explicit valid asOfDate is provided (!isNaN(asOfDate.getTime())),
 *    recompute active dasha for that date via analyzeActiveDasha(input, asOfDate).
 * 2. If there is NO explicit asOfDate (undefined or invalid), fall back to
 *    existing embedded horoscope.dashaInterpretation.
 *
 * Missing evidence handling:
 * Does NOT synthesize an empty aspect list if natalGrahaDrishti is absent or invalid.
 * Missing evidence is preserved as undefined and omitted from input.
 *
 * Failure semantics:
 * If an explicit asOfDate was requested and recompute fails (throws error or
 * analyzeActiveDasha returns falsy), returns undefined (unavailable) rather than
 * silently falling back to the embedded (different-date) report.
 */
export function resolveDashaInterpretationForAsOf(
  horoscope: Horoscope,
  asOfDate?: Date
): DashaInterpretationReport | undefined {
  if (asOfDate && !isNaN(asOfDate.getTime())) {
    try {
      const natalGrahaDrishti = normalizeNatalGrahaDrishti(horoscope.natalGrahaDrishti);
      const input: DashaInterpretationInput = {
        vimshottari: horoscope.vimshottari,
        planetInterpretation: horoscope.planetInterpretation,
        houseInterpretation: horoscope.houseInterpretation,
        functionalRoles: horoscope.functionalRoles,
        ...(natalGrahaDrishti ? { natalGrahaDrishti } : {}),
        yogas: horoscope.yogas!,
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
      return undefined;
    } catch {
      return undefined;
    }
  }

  return horoscope.dashaInterpretation;
}
