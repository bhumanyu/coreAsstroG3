import type { VimshottariTimeline } from '../../engine/dasha/vimshottari';
import type { ActiveDashaState } from '../../engine/dasha/vimshottari';
import type { WealthDimension } from '../../domain/wealth/wealthTypes';
import {
  buildForecastWindows,
  type ForecastWindow,
  type TransitWindowProvider
} from './forecastWindows';

export type ForecastDomain = 'CAREER' | WealthDimension;
export type ForecastDirection = 'SUPPORTING' | 'CHALLENGING' | 'MIXED' | 'NEUTRAL' | 'UNDETERMINED';
export type ForecastEffect = 'SUPPORTING' | 'CHALLENGING' | 'MIXED' | 'NEUTRAL' | 'UNDETERMINED';
export type ForecastStrength = 'LOW' | 'MODERATE' | 'HIGH' | 'NEUTRAL' | 'UNDETERMINED';
export type ForecastEvidenceCoverage = 'NONE' | 'PARTIAL' | 'SUBSTANTIAL' | 'COMPLETE';

export interface ForecastDomainAssessment {
  readonly domain: ForecastDomain;
  readonly direction: ForecastDirection;
  readonly effect: ForecastEffect;
  readonly strength: ForecastStrength;
  readonly evidenceCoverage: ForecastEvidenceCoverage;
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
  | { readonly ok: false; readonly error: 'INVALID_HORIZON' | 'HORIZON_OUTSIDE_TIMELINE' | 'UNRESOLVED_DASHA' | 'INVALID_TIMELINE' | 'INVALID_TRANSIT_WINDOW' };

/**
 * Evaluate one forecast per domain and Dasha window. No probability is inferred:
 * effect, strength, evidence coverage, and confidence remain separate.
 * `evidenceCoverage` describes coverage, not calibrated probability;
 * `confidence` is an internal heuristic, not calibrated probability.
 * `supportingEvidence` and `challengingEvidence` remain separate from confidence.
 * When natal promise is not established, confidence is set to 0 (not established),
 * and effect/strength are neutralized regardless of evaluator output.
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
  }) => Omit<ForecastDomainAssessment, 'domain'>,
  transitWindowProvider?: TransitWindowProvider
): DomainForecastResult {
  const windows = buildForecastWindows(timeline, asOf, until, transitWindowProvider);
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
        if (!Number.isFinite(assessment.confidence) || assessment.confidence < 0 || assessment.confidence > 1) {
          throw new TypeError(`Invalid forecast assessment confidence for ${domain}: expected a finite value in [0, 1].`);
        }
        const effect = isOneOf(assessment.effect, FORECAST_EFFECTS) ? assessment.effect : 'UNDETERMINED';
        const strength = isOneOf(assessment.strength, FORECAST_STRENGTHS) ? assessment.strength : 'UNDETERMINED';
        const evidenceCoverage = isOneOf(assessment.evidenceCoverage, FORECAST_EVIDENCE_COVERAGE)
          ? assessment.evidenceCoverage
          : 'NONE';
        const direction = isOneOf(assessment.direction, FORECAST_DIRECTIONS)
          ? assessment.direction
          : 'UNDETERMINED';
        return Object.freeze({
          ...assessment,
          domain,
          effect: established ? effect : 'UNDETERMINED',
          strength: established ? strength : 'NEUTRAL',
          evidenceCoverage,
          confidence: established ? assessment.confidence : 0,
          direction: established ? direction : 'UNDETERMINED',
          confidenceLimitations: established
            ? assessment.confidenceLimitations
            : Object.freeze([...assessment.confidenceLimitations, 'Natal promise is not established; confidence is not established (0).'])
        });
      });
    result.push(Object.freeze({ ...window, forecasts: Object.freeze(forecasts) }));
  }
  return { ok: true, windows: Object.freeze(result) };
}

const FORECAST_EFFECTS: readonly ForecastEffect[] = [
  'SUPPORTING', 'CHALLENGING', 'MIXED', 'NEUTRAL', 'UNDETERMINED'
];
const FORECAST_DIRECTIONS: readonly ForecastDirection[] = [
  'SUPPORTING', 'CHALLENGING', 'MIXED', 'NEUTRAL', 'UNDETERMINED'
];
const FORECAST_STRENGTHS: readonly ForecastStrength[] = [
  'LOW', 'MODERATE', 'HIGH', 'NEUTRAL', 'UNDETERMINED'
];
const FORECAST_EVIDENCE_COVERAGE: readonly ForecastEvidenceCoverage[] = [
  'NONE', 'PARTIAL', 'SUBSTANTIAL', 'COMPLETE'
];

function isOneOf<T extends string>(value: unknown, values: readonly T[]): value is T {
  return typeof value === 'string' && values.includes(value as T);
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
