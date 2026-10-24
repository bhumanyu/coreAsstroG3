import type { VimshottariTimeline } from '../../engine/dasha/vimshottari';
import type { ActiveDashaState } from '../../engine/dasha/vimshottari';
import type { WealthDimension } from '../../domain/wealth/wealthTypes';
import { buildForecastWindows, type ForecastWindow } from './forecastWindows';

export type ForecastDomain = 'CAREER' | WealthDimension;
export type ForecastDirection = 'SUPPORTING' | 'CHALLENGING' | 'MIXED' | 'NEUTRAL' | 'UNDETERMINED';

export interface ForecastDomainAssessment {
  readonly domain: ForecastDomain;
  readonly direction: ForecastDirection;
  readonly effect: string;
  readonly strength: string;
  readonly evidenceCoverage: string;
  readonly confidence: number;
  readonly supportingEvidence: readonly string[];
  readonly challengingEvidence: readonly string[];
  readonly confidenceLimitations: readonly string[];
}

export interface DomainForecastWindow extends ForecastWindow {
  readonly forecasts: readonly ForecastDomainAssessment[];
}

export type DomainForecastResult =
  | { readonly ok: true; readonly windows: readonly DomainForecastWindow[] }
  | { readonly ok: false; readonly error: 'INVALID_HORIZON' | 'HORIZON_OUTSIDE_TIMELINE' | 'UNRESOLVED_DASHA' };

/**
 * Evaluate one forecast per domain and Dasha window. No probability is inferred:
 * effect, strength, evidence coverage, and confidence remain separate.
 */
export function buildDomainForecast(
  timeline: VimshottariTimeline,
  asOf: Date | string,
  until: Date | string,
  natalPromiseEstablished: Readonly<Record<ForecastDomain, boolean>>,
  evaluate: (input: {
    readonly window: ForecastWindow;
    readonly activeDasha: ActiveDashaState;
    readonly domain: ForecastDomain;
    readonly natalPromiseEstablished: boolean;
  }) => Omit<ForecastDomainAssessment, 'domain'>
): DomainForecastResult {
  const windows = buildForecastWindows(timeline, asOf, until);
  if (!windows.ok) return windows;
  const result: DomainForecastWindow[] = [];
  for (const window of windows.windows) {
    const resolvedTimeline = timeline;
    const activeDasha = findActiveDasha(resolvedTimeline, window.start);
    if (!activeDasha) return { ok: false, error: 'UNRESOLVED_DASHA' };
    const forecasts = (['CAREER', 'ACCUMULATION', 'GAINS', 'FORTUNE', 'SPECULATION'] as const)
      .map((domain) => {
        const established = natalPromiseEstablished[domain];
        const assessment = evaluate({
          window,
          activeDasha,
          domain,
          natalPromiseEstablished: established
        });
        return Object.freeze({
          ...assessment,
          domain,
          direction: established ? assessment.direction : 'UNDETERMINED'
        });
      });
    result.push(Object.freeze({ ...window, forecasts: Object.freeze(forecasts) }));
  }
  return { ok: true, windows: Object.freeze(result) };
}

function findActiveDasha(timeline: VimshottariTimeline, at: string): ActiveDashaState | undefined {
  const target = Date.parse(at);
  for (const mahadasha of timeline.mahadashas) {
    if (target < Date.parse(mahadasha.start) || target >= Date.parse(mahadasha.end)) continue;
    for (const antardasha of mahadasha.antardashas) {
      if (target < Date.parse(antardasha.start) || target >= Date.parse(antardasha.end)) continue;
      const pratyantardasha = antardasha.pratyantardashas.find((period) =>
        target >= Date.parse(period.start) && target < Date.parse(period.end)
      );
      if (pratyantardasha) return { mahadasha, antardasha, pratyantardasha };
    }
  }
  return undefined;
}
