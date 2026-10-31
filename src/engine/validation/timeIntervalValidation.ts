export type TimeIntervalInstant = Date | number | string;

export interface TimeInterval {
  readonly start: number;
  readonly end: number;
}

export type TimeIntervalValidationResult =
  | { readonly ok: true; readonly value: TimeInterval }
  | { readonly ok: false; readonly error: 'INVALID_START' | 'INVALID_END' | 'INVALID_ORDER' };

export interface FutureEventValidationResult {
  readonly status: 'PASS' | 'FAIL' | 'BLOCKED';
  readonly detail: string;
}

export interface SampleGapValidationResult {
  readonly status: 'PASS' | 'FAIL' | 'BLOCKED';
  readonly detail: string;
}

export type MissingTimelineValidationResult =
  | { readonly status: 'UNAVAILABLE' }
  | { readonly status: 'AVAILABLE' };

function toMilliseconds(instant: TimeIntervalInstant): number | undefined {
  const milliseconds = instant instanceof Date
    ? instant.getTime()
    : typeof instant === 'number'
      ? instant
      : Date.parse(instant);
  return Number.isFinite(milliseconds) ? milliseconds : undefined;
}

export function validateTimeInterval(
  start: TimeIntervalInstant,
  end: TimeIntervalInstant
): TimeIntervalValidationResult {
  const startMilliseconds = toMilliseconds(start);
  if (startMilliseconds === undefined) return { ok: false, error: 'INVALID_START' };

  const endMilliseconds = toMilliseconds(end);
  if (endMilliseconds === undefined) return { ok: false, error: 'INVALID_END' };
  if (startMilliseconds >= endMilliseconds) return { ok: false, error: 'INVALID_ORDER' };

  return {
    ok: true,
    value: Object.freeze({ start: startMilliseconds, end: endMilliseconds })
  };
}

export function containsInstant(
  instant: TimeIntervalInstant,
  interval: TimeInterval
): boolean {
  const milliseconds = toMilliseconds(instant);
  return milliseconds !== undefined
    && Number.isFinite(interval.start)
    && Number.isFinite(interval.end)
    && interval.start < interval.end
    && interval.start <= milliseconds
    && milliseconds < interval.end;
}
