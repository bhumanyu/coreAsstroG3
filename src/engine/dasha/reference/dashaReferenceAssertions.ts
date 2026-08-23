import { expect } from 'vitest';
import { Planet } from '../../../types';

export interface DateDiagnosticContext {
  readonly caseId: string;
  readonly label: string;
  readonly moonLongitude?: number;
  readonly nakshatra?: string;
  readonly lord?: Planet;
  readonly remainingFraction?: number;
}

/**
 * Asserts that an actual numeric value is within a given tolerance of expected value,
 * throwing a descriptive diagnostic error on failure.
 */
export function expectCloseToReference(
  actual: number,
  expected: number,
  tolerance: number,
  label: string
): void {
  const delta = Math.abs(actual - expected);
  if (delta > tolerance) {
    throw new Error(
      `[${label}] Numeric value mismatch exceeded tolerance ${tolerance}:\n` +
      `  Expected: ${expected}\n` +
      `  Actual:   ${actual}\n` +
      `  Delta:    ${delta}`
    );
  }
  expect(delta).toBeLessThanOrEqual(tolerance);
}

/**
 * Diagnostic-rich date boundary comparison helper.
 * On failure, prints the case ID, ISO timestamps, timestamp difference in milliseconds,
 * and upstream astronomical context facts (Moon longitude, nakshatra, lord, remaining fraction).
 */
export function expectDateCloseToReference(
  actualIso: string,
  expectedIso: string,
  toleranceMs: number,
  contextInfo: DateDiagnosticContext
): void {
  const actualTime = new Date(actualIso).getTime();
  const expectedTime = new Date(expectedIso).getTime();
  const deltaMs = Math.abs(actualTime - expectedTime);

  if (deltaMs > toleranceMs) {
    const diagnostic = [
      `[Dasha Date Assertion Failure] Case: ${contextInfo.caseId} - Target: ${contextInfo.label}`,
      `  Expected ISO: ${expectedIso} (ms: ${expectedTime})`,
      `  Actual ISO:   ${actualIso} (ms: ${actualTime})`,
      `  Delta (ms):   ${deltaMs} ms (allowed tolerance: ${toleranceMs} ms)`,
      `  Context Facts:`,
      `    Moon Longitude:    ${contextInfo.moonLongitude !== undefined ? contextInfo.moonLongitude : 'N/A'}`,
      `    Nakshatra:         ${contextInfo.nakshatra ?? 'N/A'}`,
      `    Nakshatra Lord:    ${contextInfo.lord ?? 'N/A'}`,
      `    RemainingFraction: ${contextInfo.remainingFraction !== undefined ? contextInfo.remainingFraction : 'N/A'}`
    ].join('\n');
    throw new Error(diagnostic);
  }

  expect(deltaMs).toBeLessThanOrEqual(toleranceMs);
}
