/**
 * PBA-10: Selected-Period Test-Only Validation Fixtures
 *
 * Helper functions and temporal golden fixtures for test-only validation.
 * These fixtures do not modify PBA-06/07/09 contracts - they only validate
 * existing behavior over the pipeline.
 */

import type { DashaInterpretationReport } from '../../engine/dashaInterpretation/dashaInterpretationTypes';
import { listSelectableMdAdPeriods } from '../../core/analysis/selectedMdAdPeriod';

/**
 * Get a valid mahadasha + antardasha selection from a report.
 * Returns the first valid mahadasha and its first valid antardasha.
 * Throws if no valid selection exists.
 */
export function getValidMdAdSelection(report: DashaInterpretationReport | null | undefined): {
  mahadashaId: string;
  antardashaId: string;
  mahadashaPlanet: string;
  antardashaPlanet: string;
  interval: { start: string; end: string };
} {
  const selectablePeriods = listSelectableMdAdPeriods(report);
  const validMd = selectablePeriods.mahadashas.find((md) => md.valid);
  if (!validMd) {
    throw new Error('No valid mahadasha found in report');
  }

  const validAd = selectablePeriods.antardashas.find(
    (ad) => ad.valid && ad.mahadashaId === validMd.id
  );
  if (!validAd) {
    throw new Error('No valid antardasha found for mahadasha: ' + validMd.id);
  }

  return {
    mahadashaId: validMd.id,
    antardashaId: validAd.id,
    mahadashaPlanet: validMd.planet,
    antardashaPlanet: validAd.planet,
    interval: {
      start: validAd.start,
      end: validAd.end
    }
  };
}

/**
 * Find a valid antardasha from a different mahadasha.
 * Used for cross-MD invalid-selection test cases.
 * Throws if no such antardasha exists.
 */
export function getNonOverlappingAdFromOtherMd(
  report: DashaInterpretationReport | null | undefined,
  mdId: string
): { antardashaId: string; mahadashaId: string } {
  const selectablePeriods = listSelectableMdAdPeriods(report);
  const validAd = selectablePeriods.antardashas.find(
    (ad) => ad.valid && ad.mahadashaId !== mdId
  );
  if (!validAd) {
    throw new Error('No valid antardasha found from a different mahadasha');
  }

  return {
    antardashaId: validAd.id,
    mahadashaId: validAd.mahadashaId
  };
}

/**
 * Offset an ISO date string by a number of milliseconds.
 * Returns the new ISO string.
 */
export function isoAtOffset(iso: string, offsetMs: number): string {
  const date = new Date(iso);
  date.setTime(date.getTime() + offsetMs);
  return date.toISOString();
}

/**
 * Temporal golden fixtures for classifyTemporalRelation validation.
 * Matches the logic in selectedPeriodActivationContext.ts:104-110.
 *
 * Half-open interval semantics: [start, end)
 * - start is included
 * - end is excluded
 */
export const PBA10_TEMPORAL_GOLDENS = {
  beforeStart: 'FUTURE',
  atStart: 'CURRENT',
  beforeEnd: 'CURRENT',
  atEnd: 'PAST',
  intervalSemantics: '[start,end)'
} as const;
