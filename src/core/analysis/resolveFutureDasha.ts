import type { VimshottariTimeline } from '../../engine/dasha/vimshottari';
import { getActiveDasha } from '../../engine/dasha/vimshottari';
import type { ActiveDashaState } from '../../engine/dasha/vimshottari';
import { encodeAntardashaId, encodeMahadashaId, encodePratyantardashaId } from './selectedMdAdPeriod';
import type { Horoscope, Planet, PlanetPosition } from '../../types';
import { AyanamsaType } from '../../types';
import { calculateCurrentTransitPositions } from '../../engine/transitEphemeris';
import type { ProductMethodology } from './AnalysisContext';

export type FutureDashaResolutionError =
  | 'INVALID_TARGET_INSTANT'
  | 'INVALID_FORECAST_HORIZON'
  | 'TARGET_OUTSIDE_TIMELINE'
  | 'HORIZON_OUTSIDE_TIMELINE';

export interface ResolvedFutureDasha {
  readonly activeDasha: ActiveDashaState;
  readonly horizon: { readonly start: string; readonly end: string };
  readonly ids: {
    readonly mahadashaId: string;
    readonly antardashaId: string;
    readonly pratyantardashaId: string;
  };
}

export type FutureDashaResolutionResult =
  | { readonly ok: true; readonly value: ResolvedFutureDasha }
  | { readonly ok: false; readonly error: FutureDashaResolutionError };

export interface ForecastContext {
  readonly asOf: string;
  readonly forecastUntil: string;
  readonly dasha: ResolvedFutureDasha;
  /** Transit state sampled at `asOf`; it does not represent the forecast horizon. */
  readonly transitPositionsAsOfInstant: Readonly<Record<Planet, PlanetPosition>>;
  /** This context is Dasha-only; horizon-aware transit forecasts require per-window samples. */
  readonly forecastMode: 'DASHA_ONLY';
  readonly methodology: ProductMethodology;
  readonly engineVersion: string;
  readonly rulesVersion: string;
}

export type ForecastContextResult =
  | { readonly ok: true; readonly value: ForecastContext }
  | { readonly ok: false; readonly error: FutureDashaResolutionError | 'INVALID_FORECAST_CONTEXT' };

function parseInstant(value: Date | string): Date | undefined {
  const date = value instanceof Date ? new Date(value.getTime()) : new Date(value);
  return Number.isFinite(date.getTime()) ? date : undefined;
}

/**
 * Resolves all active Vimshottari levels at an instant, preserving getActiveDasha's
 * half-open boundary semantics. The horizon must remain inside the supplied timeline.
 */
export function resolveFutureDasha(
  timeline: VimshottariTimeline,
  target: Date | string,
  forecastUntil?: Date | string
): FutureDashaResolutionResult {
  const targetDate = parseInstant(target);
  if (!targetDate) return { ok: false, error: 'INVALID_TARGET_INSTANT' };

  const firstMd = timeline?.mahadashas?.[0];
  const lastMd = timeline?.mahadashas?.[timeline.mahadashas.length - 1];
  if (!firstMd || !lastMd) {
    return { ok: false, error: 'TARGET_OUTSIDE_TIMELINE' };
  }

  const horizonEnd = forecastUntil === undefined
    ? new Date(lastMd.end)
    : parseInstant(forecastUntil);
  if (!horizonEnd || horizonEnd.getTime() <= targetDate.getTime()) {
    return { ok: false, error: 'INVALID_FORECAST_HORIZON' };
  }
  if (
    targetDate.getTime() < new Date(firstMd.start).getTime() ||
    targetDate.getTime() >= new Date(lastMd.end).getTime()
  ) {
    return { ok: false, error: 'TARGET_OUTSIDE_TIMELINE' };
  }
  if (horizonEnd.getTime() > new Date(lastMd.end).getTime()) {
    return { ok: false, error: 'HORIZON_OUTSIDE_TIMELINE' };
  }

  const activeDasha = getActiveDasha(timeline, targetDate);
  if (!activeDasha) return { ok: false, error: 'TARGET_OUTSIDE_TIMELINE' };

  const mahadashaId = encodeMahadashaId(
    activeDasha.mahadasha.planet,
    activeDasha.mahadasha.start,
    activeDasha.mahadasha.end
  );
  const antardashaId = encodeAntardashaId(
    activeDasha.antardasha.planet,
    activeDasha.antardasha.start,
    activeDasha.antardasha.end,
    mahadashaId
  );
  const pratyantardashaId = encodePratyantardashaId(
    activeDasha.pratyantardasha.planet,
    activeDasha.pratyantardasha.start,
    activeDasha.pratyantardasha.end,
    antardashaId
  );

  return {
    ok: true,
    value: Object.freeze({
      activeDasha,
      horizon: Object.freeze({
        start: targetDate.toISOString(),
        end: horizonEnd.toISOString()
      }),
      ids: Object.freeze({ mahadashaId, antardashaId, pratyantardashaId })
    })
  };
}

/** Bind active Dasha and an as-of-only transit snapshot to the same target instant. */
export function createForecastContext(input: {
  readonly timeline: VimshottariTimeline;
  readonly horoscope: Horoscope;
  readonly asOf: Date | string;
  readonly forecastUntil: Date | string;
  readonly methodology: ProductMethodology;
  readonly engineVersion: string;
  readonly rulesVersion: string;
}): ForecastContextResult {
  const asOf = canonicalInstant(input.asOf);
  const forecastUntil = canonicalInstant(input.forecastUntil);
  if (!asOf || !forecastUntil || Date.parse(forecastUntil) <= Date.parse(asOf)) {
    return { ok: false, error: 'INVALID_FORECAST_CONTEXT' };
  }
  const dasha = resolveFutureDasha(input.timeline, asOf, forecastUntil);
  if (!dasha.ok) return dasha;
  const transitPositionsAsOfInstant = calculateCurrentTransitPositions(
    new Date(asOf),
    input.horoscope.birthDetails?.ayanamsa ?? AyanamsaType.LAHIRI
  );
  return {
    ok: true,
    value: Object.freeze({
      asOf,
      forecastUntil,
      dasha: dasha.value,
      transitPositionsAsOfInstant: Object.freeze(transitPositionsAsOfInstant),
      forecastMode: 'DASHA_ONLY',
      methodology: Object.freeze({ ...input.methodology }),
      engineVersion: input.engineVersion,
      rulesVersion: input.rulesVersion
    })
  };
}

export function validateForecastContext(context: ForecastContext): void {
  const asOf = canonicalInstant(context?.asOf);
  const forecastUntil = canonicalInstant(context?.forecastUntil);
  if (!asOf || !forecastUntil || Date.parse(forecastUntil) <= Date.parse(asOf)) {
    throw new TypeError('Invalid forecast context: target and horizon must be ordered ISO instants.');
  }
  const active = context.dasha?.activeDasha;
  const target = Date.parse(asOf);
  if (!active || target < Date.parse(active.mahadasha.start) || target >= Date.parse(active.mahadasha.end)
    || target < Date.parse(active.antardasha.start) || target >= Date.parse(active.antardasha.end)
    || target < Date.parse(active.pratyantardasha.start) || target >= Date.parse(active.pratyantardasha.end)) {
    throw new TypeError('Invalid forecast context: active Dasha intervals must contain the target instant.');
  }
  if (context.dasha.horizon.start !== asOf) {
    throw new TypeError('Invalid forecast context: Dasha resolution instant does not match context asOf.');
  }
  if (context.forecastMode !== 'DASHA_ONLY' || !context.transitPositionsAsOfInstant) {
    throw new TypeError('Invalid forecast context: an as-of-only transit snapshot is valid only in Dasha-only mode.');
  }
}

function canonicalInstant(value: Date | string): string | undefined {
  const date = value instanceof Date ? new Date(value.getTime()) : new Date(value);
  return Number.isFinite(date.getTime()) ? date.toISOString() : undefined;
}
