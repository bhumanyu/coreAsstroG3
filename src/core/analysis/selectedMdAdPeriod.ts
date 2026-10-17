import {
  DashaInterpretationReport,
  DashaMahadashaInterpretation,
  DashaAntardashaInterpretation
} from '../../engine/dashaInterpretation/dashaInterpretationTypes';
import { DashaSystem } from '../../types';

/**
 * Version identifier for MD-AD period resolver IDs.
 * IDs are opaque and encode this version to enable future migration.
 */
export const MD_AD_PERIOD_RESOLVER_VERSION = 'v1' as const;

/**
 * Diagnostic codes collected during period listing.
 * These are informational and do not prevent listing.
 */
export type PeriodDiagnostic =
  | 'INVALID_MAHADASHA_INTERVAL'
  | 'INVALID_ANTARDASHA_INTERVAL'
  | 'ANTARDASHA_OUTSIDE_MAHADASHA'
  | 'DUPLICATE_MAHADASHA_ID'
  | 'DUPLICATE_ANTARDASHA_ID';

/**
 * Error codes for period resolution failures.
 */
export type ResolutionError =
  | 'REPORT_UNAVAILABLE'
  | 'UNSUPPORTED_DASHA_SYSTEM'
  | 'MAHADASHA_NOT_FOUND'
  | 'ANTARDASHA_NOT_FOUND'
  | 'ANTARDASHA_NOT_CHILD_OF_MAHADASHA';

/**
 * Result of a successful period resolution.
 */
export interface ResolvedPeriod {
  readonly interval: { readonly start: string; readonly end: string };
  readonly mahadasha: {
    readonly planet: string;
    readonly start: string;
    readonly end: string;
  };
  readonly mahadashaNode: DashaMahadashaInterpretation;
  readonly antardashaNode: DashaAntardashaInterpretation;
}

/**
 * Discriminated union for resolution results.
 */
export type ResolutionResult =
  | { readonly ok: true; readonly value: ResolvedPeriod }
  | { readonly ok: false; readonly error: ResolutionError };

/**
 * Selectable mahadasha option.
 */
export interface SelectableMahadasha {
  readonly id: string;
  readonly planet: string;
  readonly start: string;
  readonly end: string;
}

/**
 * Selectable antardasha option.
 */
export interface SelectableAntardasha {
  readonly id: string;
  readonly mahadashaId: string;
  readonly planet: string;
  readonly start: string;
  readonly end: string;
}

/**
 * Result of listing selectable periods.
 */
export interface SelectablePeriodsResult {
  readonly mahadashas: readonly SelectableMahadasha[];
  readonly antardashas: readonly SelectableAntardasha[];
  readonly diagnostics: readonly PeriodDiagnostic[];
}

/**
 * Parse an ISO date string to a Date.
 * Returns null if invalid.
 */
function parseDate(dateStr: string): Date | null {
  const date = new Date(dateStr);
  return isNaN(date.getTime()) ? null : date;
}

/**
 * Validate that an interval has valid start/end and start < end.
 */
function validateInterval(start: string, end: string): boolean {
  const startDate = parseDate(start);
  const endDate = parseDate(end);
  if (!startDate || !endDate) {
    return false;
  }
  return startDate.getTime() < endDate.getTime();
}

/**
 * Encode a mahadasha ID.
 * Format: {version}|{system}|md|{planet}|{start}|{end}
 */
function encodeMahadashaId(
  planet: string,
  start: string,
  end: string
): string {
  return `${MD_AD_PERIOD_RESOLVER_VERSION}|${DashaSystem.VIMSHOTTARI}|md|${planet}|${start}|${end}`;
}

/**
 * Base64 encode a string (URL-safe variant).
 */
function base64Encode(str: string): string {
  return Buffer.from(str, 'utf-8').toString('base64url');
}

/**
 * Base64 decode a string (URL-safe variant).
 */
function base64Decode(str: string): string | null {
  try {
    return Buffer.from(str, 'base64url').toString('utf-8');
  } catch {
    return null;
  }
}

/**
 * Encode an antardasha ID.
 * Format: {version}|{system}|ad|{planet}|{start}|{end}|{base64ParentMahadashaId}
 */
function encodeAntardashaId(
  planet: string,
  start: string,
  end: string,
  parentMahadashaId: string
): string {
  const encodedParent = base64Encode(parentMahadashaId);
  return `${MD_AD_PERIOD_RESOLVER_VERSION}|${DashaSystem.VIMSHOTTARI}|ad|${planet}|${start}|${end}|${encodedParent}`;
}

/**
 * Parse an antardasha ID to extract planet, start, and end.
 * Returns null if the ID format is invalid.
 */
function parseAntardashaId(
  antardashaId: string
): { planet: string; start: string; end: string } | null {
  const parts = antardashaId.split('|');
  // Expected format: v1|VIMSHOTTARI|ad|{planet}|{start}|{end}|{base64ParentMahadashaId}
  if (parts.length !== 7) {
    return null;
  }
  const [version, system, level, planet, start, end, parentMahadashaId] = parts;
  if (version !== MD_AD_PERIOD_RESOLVER_VERSION || system !== DashaSystem.VIMSHOTTARI || level !== 'ad') {
    return null;
  }
  return { planet, start, end };
}

/**
 * Check if an antardasha is contained within its mahadasha.
 * Containment: md.start <= ad.start < ad.end <= md.end
 */
function isAntardashaContained(
  mdStart: string,
  mdEnd: string,
  adStart: string,
  adEnd: string
): boolean {
  const mdStartDate = parseDate(mdStart);
  const mdEndDate = parseDate(mdEnd);
  const adStartDate = parseDate(adStart);
  const adEndDate = parseDate(adEnd);

  if (!mdStartDate || !mdEndDate || !adStartDate || !adEndDate) {
    return false;
  }

  return (
    mdStartDate.getTime() <= adStartDate.getTime() &&
    adStartDate.getTime() < adEndDate.getTime() &&
    adEndDate.getTime() <= mdEndDate.getTime()
  );
}

/**
 * List all selectable mahadasha and antardasha periods from a report.
 * Enumerates all periods without filtering by current date.
 * Collects diagnostics for any structural issues found.
 */
export function listSelectableMdAdPeriods(
  report: DashaInterpretationReport | null | undefined
): SelectablePeriodsResult {
  const diagnostics: PeriodDiagnostic[] = [];
  const mahadashas: SelectableMahadasha[] = [];
  const antardashas: SelectableAntardasha[] = [];
  const mdIdSet = new Set<string>();
  const adIdSet = new Set<string>();

  if (!report) {
    return { mahadashas, antardashas, diagnostics };
  }

  for (const md of report.mahadashas) {
    // Validate mahadasha interval
    if (!validateInterval(md.start, md.end)) {
      diagnostics.push('INVALID_MAHADASHA_INTERVAL');
    }

    const mdId = encodeMahadashaId(md.planet, md.start, md.end);

    // Check for duplicate mahadasha ID
    if (mdIdSet.has(mdId)) {
      diagnostics.push('DUPLICATE_MAHADASHA_ID');
    }
    mdIdSet.add(mdId);

    mahadashas.push({
      id: mdId,
      planet: md.planet,
      start: md.start,
      end: md.end
    });

    // Process antardashas for this mahadasha
    for (const ad of md.antardashas) {
      // Validate antardasha interval
      if (!validateInterval(ad.start, ad.end)) {
        diagnostics.push('INVALID_ANTARDASHA_INTERVAL');
      }

      // Check containment
      if (!isAntardashaContained(md.start, md.end, ad.start, ad.end)) {
        diagnostics.push('ANTARDASHA_OUTSIDE_MAHADASHA');
      }

      const adId = encodeAntardashaId(ad.planet, ad.start, ad.end, mdId);

      // Check for duplicate antardasha ID
      if (adIdSet.has(adId)) {
        diagnostics.push('DUPLICATE_ANTARDASHA_ID');
      }
      adIdSet.add(adId);

      antardashas.push({
        id: adId,
        mahadashaId: mdId,
        planet: ad.planet,
        start: ad.start,
        end: ad.end
      });
    }
  }

  return { mahadashas, antardashas, diagnostics };
}

/**
 * Resolve a selected mahadasha-antardasha pair.
 * Returns a discriminated union with success or error.
 * Never throws for input-resolution failures.
 */
export function resolveSelectedMdAdPeriod(
  report: DashaInterpretationReport | null | undefined,
  selection: { readonly mahadashaId: string; readonly antardashaId: string }
): ResolutionResult {
  // Check report availability
  if (!report) {
    return { ok: false, error: 'REPORT_UNAVAILABLE' };
  }

  // Check dasha system support
  if (report.system !== DashaSystem.VIMSHOTTARI) {
    return { ok: false, error: 'UNSUPPORTED_DASHA_SYSTEM' };
  }

  // Find mahadasha by ID
  const mahadasha = report.mahadashas.find((md) => {
    const expectedId = encodeMahadashaId(md.planet, md.start, md.end);
    return expectedId === selection.mahadashaId;
  });

  if (!mahadasha) {
    return { ok: false, error: 'MAHADASHA_NOT_FOUND' };
  }

  // Find antardasha by ID within the found mahadasha
  const antardasha = mahadasha.antardashas.find((ad) => {
    const expectedId = encodeAntardashaId(
      ad.planet,
      ad.start,
      ad.end,
      selection.mahadashaId
    );
    return expectedId === selection.antardashaId;
  });

  if (!antardasha) {
    // Parse the antardasha ID to extract planet/start/end
    const parsedAdId = parseAntardashaId(selection.antardashaId);
    if (parsedAdId) {
      // Check if this antardasha (by planet/start/end) exists in a different mahadasha
      for (const otherMd of report.mahadashas) {
        if (otherMd === mahadasha) continue;
        const foundInOther = otherMd.antardashas.find(
          (ad) =>
            ad.planet === parsedAdId.planet &&
            ad.start === parsedAdId.start &&
            ad.end === parsedAdId.end
        );
        if (foundInOther) {
          return { ok: false, error: 'ANTARDASHA_NOT_CHILD_OF_MAHADASHA' };
        }
      }
    }
    return { ok: false, error: 'ANTARDASHA_NOT_FOUND' };
  }

  // Return resolved period with read-only references
  return {
    ok: true,
    value: {
      interval: {
        start: antardasha.start,
        end: antardasha.end
      },
      mahadasha: {
        planet: mahadasha.planet,
        start: mahadasha.start,
        end: mahadasha.end
      },
      mahadashaNode: mahadasha,
      antardashaNode: antardasha
    }
  };
}
