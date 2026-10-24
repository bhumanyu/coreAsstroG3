import type { VimshottariTimeline } from '../../engine/dasha/vimshottari';
import { AyanamsaType, Planet, ZodiacType } from '../../types';
import type { PlanetPosition } from '../../types';
import { resolveFutureDasha } from './resolveFutureDasha';
import { getAyanamsaOffset } from '../../engine/astroEngine';

export const TRANSIT_LONGITUDE_TOLERANCE_DEG = 0.01;

export interface TransitCalculationContext {
  readonly ayanamsa: AyanamsaType;
  readonly coordinateConvention: ZodiacType;
  readonly engineVersion: string;
  /**
   * Explicit compatibility opt-in for producers that emit identical longitude
   * aliases despite a non-zero ayanamsa. Omitted/false means strict validation.
   */
  readonly allowIdenticalLongitudeAliases?: boolean;
}

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
  /** Optional provider echo; if supplied, must match `at` exactly. */
  readonly calculatedAt?: string;
  /** Optional sample-level echo of provider context; if supplied, must match exactly. */
  readonly calculationContext?: TransitCalculationContext;
}

export interface TransitWindowSampleData {
  readonly samples: readonly TransitSample[];
  readonly precision: string;
  readonly ephemerisVersion: string;
}

export interface TransitWindowData extends TransitWindowSampleData {
  readonly coverage: 'COMPLETE' | 'PARTIAL' | 'INSUFFICIENT_DATA';
}

/**
 * Supplies transit event boundaries and per-window samples for a transit-aware
 * forecast. `precision` must document the boundary/sampling precision, and the
 * ephemeris version must identify the data/calculation release used. A window
 * is marked COMPLETE only when it has at least two samples, the first is within
 * `maxSampleGapMs` of its start, every consecutive gap is within that limit,
 * and the final sample is within that limit of its end.
 */
export interface TransitWindowProvider {
  readonly precision: string;
  readonly ephemerisVersion: string;
  /** Largest permitted time gap between samples and between samples and a window edge. */
  readonly maxSampleGapMs: number;
  /** Authoritative methodology applied to all samples from this provider. */
  readonly calculationContext: TransitCalculationContext;
  /**
   * When true, every sample must echo its instant and calculation context.
   * Omitted/false preserves compatibility: supplied echoes are validated, but
   * omitted echoes do not prove the sample used this context or exact instant.
   */
  readonly requireSampleContextEcho?: boolean;
  getBoundaryInstants(start: string, end: string): readonly (Date | string)[];
  sampleWindow(
    window: Pick<ForecastWindow, 'start' | 'end'>,
    calculationContext: TransitCalculationContext
  ): TransitWindowSampleData;
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
      || !transitWindowProvider.ephemerisVersion.trim()
      || !Number.isFinite(transitWindowProvider.maxSampleGapMs)
      || transitWindowProvider.maxSampleGapMs <= 0
      || !isValidCalculationContext(transitWindowProvider.calculationContext)
      || (transitWindowProvider.requireSampleContextEcho !== undefined
        && typeof transitWindowProvider.requireSampleContextEcho !== 'boolean')) {
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
        transitWindowProvider.sampleWindow(
          { start: windowStartIso, end: windowEndIso },
          transitWindowProvider.calculationContext
        ),
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
  data: TransitWindowSampleData | undefined,
  start: number,
  end: number,
  provider: TransitWindowProvider
): TransitWindowData | undefined {
  if (!data || !Array.isArray(data.samples)
    || typeof data.precision !== 'string' || typeof data.ephemerisVersion !== 'string'
    || data.precision !== provider.precision || data.ephemerisVersion !== provider.ephemerisVersion) {
    return undefined;
  }
  // Matching metadata is a provenance label only; it does not verify that
  // positions came from the claimed ephemeris. Swiss Ephemeris/JPL Horizons
  // parity remains a separately tracked reference-data gate.
  if (data.samples.length === 0) {
    return Object.freeze({
      samples: Object.freeze([]),
      precision: data.precision,
      ephemerisVersion: data.ephemerisVersion,
      coverage: 'INSUFFICIENT_DATA'
    });
  }
  let previousAt = Number.NEGATIVE_INFINITY;
  for (const sample of data.samples) {
    const at = sample && typeof sample.at === 'string' ? parseIsoInstant(sample.at) : undefined;
    if (at === undefined || at < start || at >= end || at <= previousAt
      || (provider.requireSampleContextEcho === true
        && (sample.calculatedAt === undefined || sample.calculationContext === undefined))
      || (sample.calculatedAt !== undefined && sample.calculatedAt !== sample.at)
      || (sample.calculationContext !== undefined
        && !contextsMatch(sample.calculationContext, provider.calculationContext))
      || !isValidTransitPositions(sample.positions, provider.calculationContext, new Date(at))) {
      return undefined;
    }
    previousAt = at;
  }
  const sampleTimes = data.samples.map((sample) => Date.parse(sample.at));
  const hasStartCoverage = sampleTimes[0] - start <= provider.maxSampleGapMs;
  const hasEndCoverage = end - sampleTimes[sampleTimes.length - 1] <= provider.maxSampleGapMs;
  const gapsWithinPolicy = sampleTimes.slice(1).every((at, index) =>
    at - sampleTimes[index] <= provider.maxSampleGapMs
  );
  const coverage = data.samples.length >= 2 && hasStartCoverage && hasEndCoverage && gapsWithinPolicy
    ? 'COMPLETE'
    : 'PARTIAL';
  return Object.freeze({
    samples: Object.freeze(data.samples.map((sample) => Object.freeze({
      ...sample,
      at: sample.at,
      positions: Object.freeze({ ...sample.positions })
    }))),
    precision: data.precision,
    ephemerisVersion: data.ephemerisVersion,
    coverage
  });
}

/*
 * PlanetPosition names are not fully semantic across producers: astroEngine's
 * `generatePlanetaryPositions` currently assigns the computed SIDEREAL longitude
 * to `longitude`, `eclipticLongitude`, and `siderealLongitude`, and transitEphemeris
 * delegates directly to that producer. transitEngine consumes these positions but
 * does not define another coordinate representation. Strict context validation
 * therefore treats the ecliptic/sidereal pair as tropical/sidereal respectively,
 * and permits identical aliases only through the explicit
 * `allowIdenticalLongitudeAliases` opt-in.
 *
 * For sign checks, `signLongitude` follows the declared coordinate convention.
 * If that convention's field is absent (`eclipticLongitude` for tropical or
 * `siderealLongitude` for sidereal), `longitude` is assumed to use that declared
 * convention; this fallback is explicit compatibility for the base Position type.
 */
function isValidTransitPositions(
  positions: Readonly<Record<Planet, PlanetPosition>> | undefined,
  context: TransitCalculationContext,
  at: Date
): positions is Readonly<Record<Planet, PlanetPosition>> {
  if (!positions || typeof positions !== 'object') return false;
  if (!Object.values(Planet).every((planet) => Object.prototype.hasOwnProperty.call(positions, planet))) {
    return false;
  }
  return Object.values(Planet).every((planet) => {
    const position = positions[planet];
    if (!position || typeof position !== 'object') return false;
    const finiteFields = [
      position.longitude,
      position.house,
      position.signLongitude,
      ...(position.eclipticLongitude === undefined ? [] : [position.eclipticLongitude]),
      ...(position.siderealLongitude === undefined ? [] : [position.siderealLongitude]),
      ...(position.eclipticLatitude === undefined ? [] : [position.eclipticLatitude])
    ];
    if (!finiteFields.every(Number.isFinite)) return false;
    const longitudes = [
      position.longitude,
      ...(position.eclipticLongitude === undefined ? [] : [position.eclipticLongitude]),
      ...(position.siderealLongitude === undefined ? [] : [position.siderealLongitude])
    ];
    if (!longitudes.every((longitude) => longitude >= 0 && longitude < 360)
      || position.signLongitude < 0 || position.signLongitude >= 30
      || !Number.isInteger(position.house) || position.house < 1 || position.house > 12) {
      return false;
    }
    if (position.eclipticLatitude !== undefined
      && (position.eclipticLatitude < -90 || position.eclipticLatitude > 90)) {
      return false;
    }
    const signLongitudeSource = context.coordinateConvention === ZodiacType.TROPICAL
      ? position.eclipticLongitude ?? position.longitude
      : position.siderealLongitude ?? position.longitude;
    if (angularDeltaDeg(position.signLongitude, signLongitudeSource % 30, 30)
      > TRANSIT_LONGITUDE_TOLERANCE_DEG) {
      return false;
    }
    const eclipticLongitude = position.eclipticLongitude;
    const siderealLongitude = position.siderealLongitude;
    if (eclipticLongitude !== undefined && siderealLongitude !== undefined) {
      const fieldsIdentical = [position.longitude, eclipticLongitude, siderealLongitude]
        .every((longitude) => angularDeltaDeg(longitude, position.longitude)
          <= TRANSIT_LONGITUDE_TOLERANCE_DEG);
      const expectedSidereal = normalizeDegree(
        eclipticLongitude - getAyanamsaOffset(context.ayanamsa, at)
      );
      const explicitlyAllowedLegacyAliases = context.allowIdenticalLongitudeAliases === true && fieldsIdentical;
      if (!explicitlyAllowedLegacyAliases
        && angularDeltaDeg(siderealLongitude, expectedSidereal) > TRANSIT_LONGITUDE_TOLERANCE_DEG) {
        return false;
      }
    }
    return true;
  });
}

function isValidCalculationContext(context: TransitCalculationContext | undefined): context is TransitCalculationContext {
  return Boolean(context
    && Object.values(AyanamsaType).includes(context.ayanamsa)
    && Object.values(ZodiacType).includes(context.coordinateConvention)
    && typeof context.engineVersion === 'string'
    && context.engineVersion.trim().length > 0
    && (context.allowIdenticalLongitudeAliases === undefined
      || typeof context.allowIdenticalLongitudeAliases === 'boolean'));
}

function contextsMatch(
  actual: TransitCalculationContext,
  expected: TransitCalculationContext
): boolean {
  return isValidCalculationContext(actual)
    && actual.ayanamsa === expected.ayanamsa
    && actual.coordinateConvention === expected.coordinateConvention
    && actual.engineVersion === expected.engineVersion
    && (actual.allowIdenticalLongitudeAliases ?? false) === (expected.allowIdenticalLongitudeAliases ?? false);
}

function normalizeDegree(degrees: number): number {
  return ((degrees % 360) + 360) % 360;
}

function angularDeltaDeg(first: number, second: number, period = 360): number {
  const delta = Math.abs(first - second) % period;
  return Math.min(delta, period - delta);
}
