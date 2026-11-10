/**
 * Shared temporal interval classification utility.
 *
 * Provides consistent interval validation and temporal relation classification
 * across the analysis layer (selectedMdAdPeriod, selectedPeriodActivationContext, productAnalysisMapper).
 *
 * This ensures:
 * - Date parseability is checked consistently
 * - Interval ordering (start < end) is validated consistently
 * - Temporal relation relative to an asOf timestamp is computed consistently
 */

/**
 * Parse an ISO date string to a timestamp.
 * Returns null if invalid.
 */
export function parseInstant(value: string): number | null {
  if (typeof value !== 'string' || value.length === 0) return null;

  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  const timestamp = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,9}))?)?(Z|[+-]\d{2}:\d{2})$/i.exec(value);
  const match = dateOnly ?? timestamp;
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = timestamp ? Number(match[4]) : 0;
  const minute = timestamp ? Number(match[5]) : 0;
  const second = timestamp && match[6] !== undefined ? Number(match[6]) : 0;
  if (year < 1 || year > 9999 || month < 1 || month > 12 || day < 1
    || hour < 0 || hour > 23 || minute < 0 || minute > 59 || second < 0 || second > 59) {
    return null;
  }

  const calendar = new Date(0);
  calendar.setUTCHours(0, 0, 0, 0);
  calendar.setUTCFullYear(year, month - 1, day);
  if (calendar.getUTCFullYear() !== year || calendar.getUTCMonth() !== month - 1 || calendar.getUTCDate() !== day) {
    return null;
  }

  if (timestamp && match[8].toUpperCase() !== 'Z') {
    const offset = /^([+-])(\d{2}):(\d{2})$/.exec(match[8]);
    if (!offset || Number(offset[2]) > 23 || Number(offset[3]) > 59) return null;
  }

  const parsed = Date.parse(dateOnly ? value + 'T00:00:00.000Z' : value);
  return Number.isFinite(parsed) ? parsed : null;
}
/**
 * Temporal relation of an interval relative to an asOf timestamp.
 * UNKNOWN indicates invalid/unparseable date strings.
 * INVALID indicates parseable dates but invalid interval (start >= end).
 */
export type TemporalRelation = 'PAST' | 'CURRENT' | 'FUTURE' | 'INVALID' | 'UNKNOWN';

/**
 * Classify an interval's temporal relation relative to an asOf timestamp.
 *
 * Uses half-open interval semantics [start, end): start is included, end excluded.
 *
 * Returns:
 * - FUTURE: asOf < start
 * - CURRENT: start <= asOf < end
 * - PAST: asOf >= end
 * - INVALID: dates are parseable but start >= end (inverted interval)
 * - UNKNOWN: dates are unparseable
 *
 * This is a shared utility used by:
 * - selectedPeriodActivationContext.classifyTemporalRelation (returns null for INVALID/UNKNOWN)
 * - productAnalysisMapper.computeTemporalRelation (returns UNKNOWN for INVALID/UNKNOWN)
 * - selectedMdAdPeriod.validateInterval (returns boolean for valid intervals)
 */
export function classifyTemporalRelation(
  start: string,
  end: string,
  asOf: string
): TemporalRelation {
  const startMs = parseInstant(start);
  const endMs = parseInstant(end);
  const asOfMs = parseInstant(asOf);

  if (startMs === null || endMs === null || asOfMs === null) {
    return 'UNKNOWN';
  }

  // Check interval ordering: must be start < end for a valid interval
  if (startMs >= endMs) {
    return 'INVALID';
  }

  // Canonical intervals are half-open [start, end): start is included, end excluded.
  if (asOfMs < startMs) return 'FUTURE';
  if (asOfMs >= endMs) return 'PAST';
  return 'CURRENT';
}

/**
 * Validate that an interval has valid start/end and start < end.
 * Returns false if dates are unparseable or if start >= end.
 */
export function validateInterval(start: string, end: string): boolean {
  const startMs = parseInstant(start);
  const endMs = parseInstant(end);
  if (startMs === null || endMs === null) {
    return false;
  }
  return startMs < endMs;
}
