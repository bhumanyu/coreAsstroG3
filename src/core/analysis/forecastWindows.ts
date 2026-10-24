import type { VimshottariTimeline } from '../../engine/dasha/vimshottari';
import type { Planet, PlanetPosition } from '../../types';
import { resolveFutureDasha } from './resolveFutureDasha';

export type ForecastBoundaryReason =
  | 'REQUEST_START'
  | 'MAHADASHA_CHANGE'
  | 'ANTARDASHA_CHANGE'
  | 'PRATYANTARDASHA_CHANGE'
  | 'TRANSIT_BOUNDARY'
  | 'REQUEST_END';

export interface TransitSample {
  readonly at: string;
  readonly positions: Readonly<Record<Planet, PlanetPosition>>;
}

export interface TransitWindowData {
  readonly samples: readonly TransitSample[];
  readonly precision: string;
  readonly ephemerisVersion: string;
}

/**
 * Supplies transit event boundaries and per-window samples for a transit-aware
 * forecast. `precision` must document the boundary/sampling precision, and the
 * ephemeris version must identify the data/calculation release used.
 */
export interface TransitWindowProvider {
  readonly precision: string;
  readonly ephemerisVersion: string;
  getBoundaryInstants(start: string, end: string): readonly (Date | string)[];
  sampleWindow(window: Pick<ForecastWindow, 'start' | 'end'>): TransitWindowData;
}

export interface ForecastWindow {
  readonly start: string;
  readonly end: string;
  readonly mahadashaId: string;
  readonly antardashaId: string;
  readonly pratyantardashaId: string;
  /** Reasons at this window's outer edges only; merged internal edges are omitted. */
  readonly boundaryReasons: readonly ForecastBoundaryReason[];
  readonly transitData?: TransitWindowData;
}

export type ForecastWindowResult =
  | { readonly ok: true; readonly windows: readonly ForecastWindow[] }
  | { readonly ok: false; readonly error: 'INVALID_HORIZON' | 'HORIZON_OUTSIDE_TIMELINE' | 'UNRESOLVED_DASHA' | 'INVALID_TIMELINE' | 'INVALID_TRANSIT_WINDOW' };

/**
 * Split a requested half-open horizon at every canonical MD/AD/PD boundary.
 * `boundaryReasons` records only the outer edges of each returned window. A
 * transit-aware provider may add event boundaries and supplies interval-scoped
 * samples; without one, windows are Dasha-only.
 */
export function buildForecastWindows(
  timeline: VimshottariTimeline,
  asOf: Date | string,
  until: Date | string,
  transitWindowProvider?: TransitWindowProvider
): ForecastWindowResult {
  const startMs = parse(asOf);
  const endMs = parse(until);
  if (startMs === undefined || endMs === undefined || endMs <= startMs) {
    return { ok: false, error: 'INVALID_HORIZON' };
  }

  const timelineValidation = validateTimelineStructure(timeline);
  if (!timelineValidation) return { ok: false, error: 'INVALID_TIMELINE' };
  const { first, last } = timelineValidation;
  const firstStart = parse(first.start);
  const lastEnd = parse(last.end);
  if (firstStart === undefined || lastEnd === undefined) {
    return { ok: false, error: 'INVALID_TIMELINE' };
  }
  if (startMs < firstStart || endMs > lastEnd) {
    return { ok: false, error: 'HORIZON_OUTSIDE_TIMELINE' };
  }

  const boundaryValues = new Set<number>([startMs, endMs]);
  const transitBoundaries = new Set<number>();
  if (transitWindowProvider) {
    if (typeof transitWindowProvider.precision !== 'string' || !transitWindowProvider.precision.trim()
      || typeof transitWindowProvider.ephemerisVersion !== 'string'
      || !transitWindowProvider.ephemerisVersion.trim()) {
      return { ok: false, error: 'INVALID_TRANSIT_WINDOW' };
    }
    const suppliedBoundaries = transitWindowProvider.getBoundaryInstants(
      new Date(startMs).toISOString(),
      new Date(endMs).toISOString()
    );
    if (!Array.isArray(suppliedBoundaries)) return { ok: false, error: 'INVALID_TRANSIT_WINDOW' };
    for (const instant of suppliedBoundaries) {
      const boundary = parse(instant);
      if (boundary === undefined || boundary < startMs || boundary > endMs) {
        return { ok: false, error: 'INVALID_TRANSIT_WINDOW' };
      }
      if (boundary > startMs && boundary < endMs) {
        boundaryValues.add(boundary);
        transitBoundaries.add(boundary);
      }
    }
  }
  for (const md of timeline.mahadashas) {
    addBoundary(boundaryValues, md.start, startMs, endMs);
    addBoundary(boundaryValues, md.end, startMs, endMs);
    for (const ad of md.antardashas) {
      addBoundary(boundaryValues, ad.start, startMs, endMs);
      addBoundary(boundaryValues, ad.end, startMs, endMs);
      for (const pd of ad.pratyantardashas) {
        addBoundary(boundaryValues, pd.start, startMs, endMs);
        addBoundary(boundaryValues, pd.end, startMs, endMs);
      }
    }
  }
  const boundaries = [...boundaryValues].sort((a, b) => a - b);
  const windows: ForecastWindow[] = [];
  for (let i = 0; i < boundaries.length - 1; i++) {
    const windowStart = boundaries[i];
    const windowEnd = boundaries[i + 1];
    if (windowEnd <= windowStart) continue;
    const resolved = resolveFutureDasha(timeline, new Date(windowStart), new Date(windowEnd));
    if (!resolved.ok) return { ok: false, error: 'UNRESOLVED_DASHA' };
    const ids = resolved.value.ids;
    const windowStartIso = new Date(windowStart).toISOString();
    const windowEndIso = new Date(windowEnd).toISOString();
    const startReasons = i === 0
      ? ['REQUEST_START' as const]
      : [reasonAt(timeline, windowStart, transitBoundaries)];
    const endReasons = i === boundaries.length - 2
      ? ['REQUEST_END' as const]
      : [reasonAt(timeline, windowEnd, transitBoundaries)];
    let transitData: TransitWindowData | undefined;
    if (transitWindowProvider) {
      transitData = normalizeTransitWindowData(
        transitWindowProvider.sampleWindow({ start: windowStartIso, end: windowEndIso }),
        windowStart,
        windowEnd,
        transitWindowProvider
      );
      if (!transitData) return { ok: false, error: 'INVALID_TRANSIT_WINDOW' };
    }
    const prior = windows[windows.length - 1];
    const merged = !transitWindowProvider && prior
      ? mergeAdjacentForecastWindows(prior, {
          start: windowStartIso,
          end: windowEndIso,
          ...ids,
          boundaryReasons: [...startReasons, ...endReasons]
        })
      : undefined;
    if (merged) {
      windows[windows.length - 1] = merged;
    } else {
      windows.push(Object.freeze({
        start: windowStartIso,
        end: windowEndIso,
        ...ids,
        boundaryReasons: Object.freeze([...startReasons, ...endReasons]),
        ...(transitData ? { transitData } : {})
      }));
    }
  }
  return { ok: true, windows: Object.freeze(windows) };
}

/** Merge only adjacent identical Dasha identities, retaining only the two outer-edge reasons. */
export function mergeAdjacentForecastWindows(
  prior: ForecastWindow,
  next: ForecastWindow
): ForecastWindow | undefined {
  if (prior.end !== next.start
    || prior.mahadashaId !== next.mahadashaId
    || prior.antardashaId !== next.antardashaId
    || prior.pratyantardashaId !== next.pratyantardashaId
    || prior.transitData || next.transitData
    || prior.boundaryReasons.length === 0
    || next.boundaryReasons.length === 0) {
    return undefined;
  }
  return Object.freeze({
    ...prior,
    end: next.end,
    boundaryReasons: Object.freeze([
      prior.boundaryReasons[0],
      next.boundaryReasons[next.boundaryReasons.length - 1]
    ])
  });
}

function parse(value: string | Date): number | undefined {
  const time = value instanceof Date ? value.getTime() : Date.parse(value);
  return Number.isFinite(time) ? time : undefined;
}

function addBoundary(boundaries: Set<number>, value: string, start: number, end: number): void {
  const time = parse(value);
  if (time !== undefined && time > start && time < end) boundaries.add(time);
}

function reasonAt(
  timeline: VimshottariTimeline,
  boundary: number,
  transitBoundaries: ReadonlySet<number>
): ForecastBoundaryReason {
  if (timeline.mahadashas.some((md) => parse(md.start) === boundary || parse(md.end) === boundary)) return 'MAHADASHA_CHANGE';
  if (timeline.mahadashas.some((md) => md.antardashas.some((ad) => parse(ad.start) === boundary || parse(ad.end) === boundary))) return 'ANTARDASHA_CHANGE';
  if (transitBoundaries.has(boundary)) return 'TRANSIT_BOUNDARY';
  return 'PRATYANTARDASHA_CHANGE';
}

function validateTimelineStructure(timeline: VimshottariTimeline | undefined): {
  readonly first: VimshottariTimeline['mahadashas'][number];
  readonly last: VimshottariTimeline['mahadashas'][number];
} | undefined {
  if (!timeline || !Array.isArray(timeline.mahadashas) || timeline.mahadashas.length === 0) return undefined;

  const validateSiblings = (
    periods: readonly { readonly start: string; readonly end: string }[],
    parent?: { readonly start: number; readonly end: number }
  ): boolean => {
    if (!Array.isArray(periods) || periods.length === 0) return false;
    let previousEnd: number | undefined;
    for (const [index, period] of periods.entries()) {
      if (!period || typeof period.start !== 'string' || typeof period.end !== 'string') return false;
      const start = parseIsoInstant(period.start);
      const end = parseIsoInstant(period.end);
      if (start === undefined || end === undefined || start >= end) return false;
      if (previousEnd !== undefined && start !== previousEnd) return false;
      if (parent && (start < parent.start || end > parent.end)) return false;
      if (parent && index === 0 && start !== parent.start) return false;
      if (parent && index === periods.length - 1 && end !== parent.end) return false;
      previousEnd = end;
    }
    return true;
  };

  if (!validateSiblings(timeline.mahadashas)) return undefined;
  for (const md of timeline.mahadashas) {
    const mdStart = parseIsoInstant(md.start);
    const mdEnd = parseIsoInstant(md.end);
    if (mdStart === undefined || mdEnd === undefined || !Array.isArray(md.antardashas)) return undefined;
    if (!validateSiblings(md.antardashas, { start: mdStart, end: mdEnd })) return undefined;
    for (const ad of md.antardashas) {
      const adStart = parseIsoInstant(ad.start);
      const adEnd = parseIsoInstant(ad.end);
      if (adStart === undefined || adEnd === undefined || !Array.isArray(ad.pratyantardashas)
        || !validateSiblings(ad.pratyantardashas, { start: adStart, end: adEnd })) {
        return undefined;
      }
    }
  }
  return {
    first: timeline.mahadashas[0],
    last: timeline.mahadashas[timeline.mahadashas.length - 1]
  };
}

function parseIsoInstant(value: string): number | undefined {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d+)?(Z|([+-])(\d{2}):(\d{2}))$/.exec(value);
  if (!match) return undefined;
  const [, yearValue, monthValue, dayValue, hourValue, minuteValue, secondValue, , , offsetHourValue, offsetMinuteValue] = match;
  const year = Number(yearValue);
  const month = Number(monthValue);
  const day = Number(dayValue);
  const hour = Number(hourValue);
  const minute = Number(minuteValue);
  const second = Number(secondValue);
  const offsetHour = offsetHourValue === undefined ? 0 : Number(offsetHourValue);
  const offsetMinute = offsetMinuteValue === undefined ? 0 : Number(offsetMinuteValue);
  if (month < 1 || month > 12 || hour > 23 || minute > 59 || second > 59
    || offsetHour > 23 || offsetMinute > 59) {
    return undefined;
  }
  const calendarDate = new Date(0);
  calendarDate.setUTCFullYear(year, month - 1, day);
  calendarDate.setUTCHours(hour, minute, second, 0);
  if (calendarDate.getUTCFullYear() !== year || calendarDate.getUTCMonth() !== month - 1
    || calendarDate.getUTCDate() !== day) {
    return undefined;
  }
  return parse(value);
}

function normalizeTransitWindowData(
  data: TransitWindowData | undefined,
  start: number,
  end: number,
  provider: TransitWindowProvider
): TransitWindowData | undefined {
  if (!data || !Array.isArray(data.samples) || data.samples.length === 0
    || typeof data.precision !== 'string' || typeof data.ephemerisVersion !== 'string'
    || data.precision !== provider.precision || data.ephemerisVersion !== provider.ephemerisVersion) {
    return undefined;
  }
  let previousAt = Number.NEGATIVE_INFINITY;
  for (const sample of data.samples) {
    const at = sample && typeof sample.at === 'string' ? parseIsoInstant(sample.at) : undefined;
    if (at === undefined || at < start || at >= end || at <= previousAt || !sample.positions
      || Object.keys(sample.positions).length === 0) {
      return undefined;
    }
    previousAt = at;
  }
  return Object.freeze({
    samples: Object.freeze(data.samples.map((sample) => Object.freeze({
      at: sample.at,
      positions: Object.freeze({ ...sample.positions })
    }))),
    precision: data.precision,
    ephemerisVersion: data.ephemerisVersion
  });
}
