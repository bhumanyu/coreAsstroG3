import type { VimshottariTimeline } from '../../engine/dasha/vimshottari';
import { resolveFutureDasha } from './resolveFutureDasha';

export interface ForecastWindow {
  readonly start: string;
  readonly end: string;
  readonly mahadashaId: string;
  readonly antardashaId: string;
  readonly pratyantardashaId: string;
  readonly boundaryReasons: readonly ('REQUEST_START' | 'MAHADASHA_CHANGE' | 'ANTARDASHA_CHANGE' | 'PRATYANTARDASHA_CHANGE' | 'REQUEST_END')[];
}

export type ForecastWindowResult =
  | { readonly ok: true; readonly windows: readonly ForecastWindow[] }
  | { readonly ok: false; readonly error: 'INVALID_HORIZON' | 'HORIZON_OUTSIDE_TIMELINE' | 'UNRESOLVED_DASHA' };

/** Split a requested half-open horizon at every canonical MD/AD/PD boundary. */
export function buildForecastWindows(
  timeline: VimshottariTimeline,
  asOf: Date | string,
  until: Date | string
): ForecastWindowResult {
  const startMs = parse(asOf);
  const endMs = parse(until);
  const first = timeline?.mahadashas?.[0];
  const last = timeline?.mahadashas?.[timeline.mahadashas.length - 1];
  if (startMs === undefined || endMs === undefined || endMs <= startMs) {
    return { ok: false, error: 'INVALID_HORIZON' };
  }
  if (!first || !last || startMs < parse(first.start)! || endMs > parse(last.end)!) {
    return { ok: false, error: 'HORIZON_OUTSIDE_TIMELINE' };
  }

  const boundaryValues = new Set<number>([startMs, endMs]);
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
    const prior = windows[windows.length - 1];
    if (prior && prior.end === new Date(windowStart).toISOString()
      && prior.mahadashaId === ids.mahadashaId
      && prior.antardashaId === ids.antardashaId
      && prior.pratyantardashaId === ids.pratyantardashaId) {
      windows[windows.length - 1] = Object.freeze({ ...prior, end: new Date(windowEnd).toISOString() });
    } else {
      windows.push(Object.freeze({
        start: new Date(windowStart).toISOString(),
        end: new Date(windowEnd).toISOString(),
        ...ids,
        boundaryReasons: Object.freeze([
          ...(i === 0 ? ['REQUEST_START' as const] : []),
          ...(i > 0 ? [reasonAt(timeline, windowStart)] : []),
          ...(i === boundaries.length - 2 ? ['REQUEST_END' as const] : [])
        ])
      }));
    }
  }
  return { ok: true, windows: Object.freeze(windows) };
}

function parse(value: string | Date): number | undefined {
  const time = value instanceof Date ? value.getTime() : Date.parse(value);
  return Number.isFinite(time) ? time : undefined;
}

function addBoundary(boundaries: Set<number>, value: string, start: number, end: number): void {
  const time = parse(value);
  if (time !== undefined && time > start && time < end) boundaries.add(time);
}

function reasonAt(timeline: VimshottariTimeline, boundary: number): ForecastWindow['boundaryReasons'][number] {
  if (timeline.mahadashas.some((md) => parse(md.start) === boundary || parse(md.end) === boundary)) return 'MAHADASHA_CHANGE';
  if (timeline.mahadashas.some((md) => md.antardashas.some((ad) => parse(ad.start) === boundary || parse(ad.end) === boundary))) return 'ANTARDASHA_CHANGE';
  return 'PRATYANTARDASHA_CHANGE';
}
