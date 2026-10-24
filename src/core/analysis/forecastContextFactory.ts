import type { Horoscope } from '../../types';
import type { VimshottariTimeline } from '../../engine/dasha/vimshottari';
import { createForecastContext, type ForecastContextResult } from './resolveFutureDasha';
import { DEFAULT_ENGINE_VERSION, DEFAULT_METHODOLOGY, DEFAULT_RULES_VERSION } from './analysisContextFactory';

export function createHoroscopeForecastContext(
  horoscope: Horoscope,
  asOf: Date | string
): ForecastContextResult {
  const timeline = horoscope.vimshottari as VimshottariTimeline | undefined;
  const lastMahadasha = timeline?.mahadashas?.[timeline.mahadashas.length - 1];
  if (!timeline || !lastMahadasha) return { ok: false, error: 'TARGET_OUTSIDE_TIMELINE' };
  return createForecastContext({
    timeline,
    horoscope,
    asOf,
    forecastUntil: lastMahadasha.end,
    methodology: Object.freeze({
      ...DEFAULT_METHODOLOGY,
      ayanamsa: horoscope.birthDetails?.ayanamsa ?? DEFAULT_METHODOLOGY.ayanamsa
    }),
    engineVersion: DEFAULT_ENGINE_VERSION,
    rulesVersion: DEFAULT_RULES_VERSION
  });
}
