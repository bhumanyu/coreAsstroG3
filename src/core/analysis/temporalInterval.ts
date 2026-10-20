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
  const milliseconds = Date.parse(value);
  return Number.isFinite(milliseconds) ? milliseconds : null;
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
