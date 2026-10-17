import {
  DashaInterpretationReport,
  DashaMahadashaInterpretation,
  DashaAntardashaInterpretation
} from '../../engine/dashaInterpretation/dashaInterpretationTypes';
import { DashaSystem, Planet } from '../../types';

/**
 * Version identifier for MD-AD period resolver IDs.
 * IDs are opaque and encode this version to enable future migration.
 */
export const MD_AD_PERIOD_RESOLVER_VERSION = 'v2' as const;

/**
 * Diagnostic codes collected during period listing.
 * These are informational and do not prevent listing.
 */
export type PeriodDiagnostic =
  | 'INVALID_MAHADASHA_INTERVAL'
  | 'INVALID_ANTARDASHA_INTERVAL'
  | 'ANTARDASHA_OUTSIDE_MAHADASHA'
  | 'DUPLICATE_MAHADASHA_ID'
  | 'DUPLICATE_ANTARDASHA_ID'
  | 'NON_CANONICAL_DATE_FORMAT';

/**
 * Error codes for period resolution failures.
 */
export type ResolutionError =
  | 'REPORT_UNAVAILABLE'
  | 'UNSUPPORTED_DASHA_SYSTEM'
  | 'MAHADASHA_NOT_FOUND'
  | 'ANTARDASHA_NOT_FOUND'
  | 'ANTARDASHA_NOT_CHILD_OF_MAHADASHA'
  | 'INVALID_SELECTED_PERIOD'
  | 'AMBIGUOUS_MAHADASHA_ID'
  | 'AMBIGUOUS_ANTARDASHA_ID';

/**
 * Result of a successful period resolution.
 */
export interface ResolvedPeriod {
  readonly interval: { readonly start: string; readonly end: string };
  readonly mahadasha: {
    readonly planet: Planet;
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
  readonly planet: Planet;
  readonly start: string;
  readonly end: string;
  readonly valid: boolean;
  readonly diagnostics: readonly PeriodDiagnostic[];
}

/**
 * Selectable antardasha option.
 */
export interface SelectableAntardasha {
  readonly id: string;
  readonly mahadashaId: string;
  readonly planet: Planet;
  readonly start: string;
  readonly end: string;
  readonly valid: boolean;
  readonly diagnostics: readonly PeriodDiagnostic[];
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
 * Check if a date string matches the canonical ISO format (Z-terminated).
 * Format: YYYY-MM-DDTHH:mm:ss.sssZ
 */
function isCanonicalIsoFormat(dateStr: string): boolean {
  return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(dateStr);
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
  planet: Planet,
  start: string,
  end: string
): string {
  return `${MD_AD_PERIOD_RESOLVER_VERSION}|${DashaSystem.VIMSHOTTARI}|md|${planet}|${start}|${end}`;
}

/**
 * Encode an antardasha ID.
 * Format: {version}|{system}|ad|{planet}|{start}|{end}|{urlEncodedParentMahadashaId}
 * Uses encodeURIComponent for browser-safe encoding (replaces Buffer/base64).
 */
function encodeAntardashaId(
  planet: Planet,
  start: string,
  end: string,
  parentMahadashaId: string
): string {
  const encodedParent = encodeURIComponent(parentMahadashaId);
  return `${MD_AD_PERIOD_RESOLVER_VERSION}|${DashaSystem.VIMSHOTTARI}|ad|${planet}|${start}|${end}|${encodedParent}`;
}

/**
 * Parse an antardasha ID to extract planet, start, end, and parent mahadasha ID.
 * Returns null if the ID format is invalid.
 */
function parseAntardashaId(
  antardashaId: string
): { planet: string; start: string; end: string; parentMahadashaId: string } | null {
  const parts = antardashaId.split('|');
  // Expected format: v2|VIMSHOTTARI|ad|{planet}|{start}|{end}|{urlEncodedParentMahadashaId}
  if (parts.length !== 7) {
    return null;
  }
  const [version, system, level, planet, start, end, encodedParent] = parts;
  if (version !== MD_AD_PERIOD_RESOLVER_VERSION || system !== DashaSystem.VIMSHOTTARI || level !== 'ad') {
    return null;
  }
  try {
    const parentMahadashaId = decodeURIComponent(encodedParent);
    return { planet, start, end, parentMahadashaId };
  } catch {
    return null;
  }
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
 *
 * Producer Contract:
 * ID stability relies on the canonical producer (Vimshottari) emitting Date.toISOString()
 * UTC format. See src/engine/dasha/vimshottari.ts ~L230: start: currentAdStart.toISOString().
 *
 * Entry Validity:
 * Entries with valid: false are listed for observability and will be rejected by
 * resolveSelectedMdAdPeriod (which revalidates at L348-356). Per-entry diagnostics
 * contain only the diagnostics pertaining to that specific entry.
 */
export function listSelectableMdAdPeriods(
  report: DashaInterpretationReport | null | undefined
): SelectablePeriodsResult {
  const diagnostics: PeriodDiagnostic[] = [];
  const mdIdCount = new Map<string, number>();
  const adIdCount = new Map<string, number>();

  if (!report) {
    return { mahadashas: [], antardashas: [], diagnostics };
  }

  // First pass: count ID occurrences
  for (const md of report.mahadashas) {
    const mdId = encodeMahadashaId(md.planet, md.start, md.end);
    mdIdCount.set(mdId, (mdIdCount.get(mdId) || 0) + 1);

    for (const ad of md.antardashas) {
      const adId = encodeAntardashaId(ad.planet, ad.start, ad.end, mdId);
      adIdCount.set(adId, (adIdCount.get(adId) || 0) + 1);
    }
  }

  // Second pass: build entries with diagnostics
  const mahadashas: SelectableMahadasha[] = [];
  const antardashas: SelectableAntardasha[] = [];

  for (const md of report.mahadashas) {
    const mdDiagnostics: PeriodDiagnostic[] = [];

    // Validate mahadasha interval
    if (!validateInterval(md.start, md.end)) {
      mdDiagnostics.push('INVALID_MAHADASHA_INTERVAL');
      diagnostics.push('INVALID_MAHADASHA_INTERVAL');
    }

    // Check for canonical ISO format
    if (parseDate(md.start) && !isCanonicalIsoFormat(md.start)) {
      mdDiagnostics.push('NON_CANONICAL_DATE_FORMAT');
      diagnostics.push('NON_CANONICAL_DATE_FORMAT');
    }
    if (parseDate(md.end) && !isCanonicalIsoFormat(md.end)) {
      mdDiagnostics.push('NON_CANONICAL_DATE_FORMAT');
      diagnostics.push('NON_CANONICAL_DATE_FORMAT');
    }

    const mdId = encodeMahadashaId(md.planet, md.start, md.end);

    // Check for duplicate mahadasha ID
    if (mdIdCount.get(mdId)! > 1) {
      mdDiagnostics.push('DUPLICATE_MAHADASHA_ID');
      diagnostics.push('DUPLICATE_MAHADASHA_ID');
    }

    mahadashas.push({
      id: mdId,
      planet: md.planet,
      start: md.start,
      end: md.end,
      valid: mdDiagnostics.length === 0,
      diagnostics: Object.freeze(mdDiagnostics)
    });

    // Process antardashas for this mahadasha
    for (const ad of md.antardashas) {
      const adDiagnostics: PeriodDiagnostic[] = [];

      // Validate antardasha interval
      if (!validateInterval(ad.start, ad.end)) {
        adDiagnostics.push('INVALID_ANTARDASHA_INTERVAL');
        diagnostics.push('INVALID_ANTARDASHA_INTERVAL');
      }

      // Check for canonical ISO format
      if (parseDate(ad.start) && !isCanonicalIsoFormat(ad.start)) {
        adDiagnostics.push('NON_CANONICAL_DATE_FORMAT');
        diagnostics.push('NON_CANONICAL_DATE_FORMAT');
      }
      if (parseDate(ad.end) && !isCanonicalIsoFormat(ad.end)) {
        adDiagnostics.push('NON_CANONICAL_DATE_FORMAT');
        diagnostics.push('NON_CANONICAL_DATE_FORMAT');
      }

      // Check containment
      if (!isAntardashaContained(md.start, md.end, ad.start, ad.end)) {
        adDiagnostics.push('ANTARDASHA_OUTSIDE_MAHADASHA');
        diagnostics.push('ANTARDASHA_OUTSIDE_MAHADASHA');
      }

      const adId = encodeAntardashaId(ad.planet, ad.start, ad.end, mdId);

      // Check for duplicate antardasha ID
      if (adIdCount.get(adId)! > 1) {
        adDiagnostics.push('DUPLICATE_ANTARDASHA_ID');
        diagnostics.push('DUPLICATE_ANTARDASHA_ID');
      }

      antardashas.push({
        id: adId,
        mahadashaId: mdId,
        planet: ad.planet,
        start: ad.start,
        end: ad.end,
        valid: adDiagnostics.length === 0,
        diagnostics: Object.freeze(adDiagnostics)
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

  // Find mahadasha by ID (collect all matches to detect duplicates)
  const matchingMahadashas = report.mahadashas.filter((md) => {
    const expectedId = encodeMahadashaId(md.planet, md.start, md.end);
    return expectedId === selection.mahadashaId;
  });

  if (matchingMahadashas.length === 0) {
    return { ok: false, error: 'MAHADASHA_NOT_FOUND' };
  }

  if (matchingMahadashas.length > 1) {
    return { ok: false, error: 'AMBIGUOUS_MAHADASHA_ID' };
  }

  const mahadasha = matchingMahadashas[0];

  // Find antardasha by ID within the found mahadasha (collect all matches to detect duplicates)
  const matchingAntardashas = mahadasha.antardashas.filter((ad) => {
    const expectedId = encodeAntardashaId(
      ad.planet,
      ad.start,
      ad.end,
      selection.mahadashaId
    );
    return expectedId === selection.antardashaId;
  });

  if (matchingAntardashas.length > 1) {
    return { ok: false, error: 'AMBIGUOUS_ANTARDASHA_ID' };
  }

  const antardasha = matchingAntardashas[0];

  if (!antardasha) {
    // Parse the antardasha ID to extract planet/start/end and parent mahadasha ID
    const parsedAdId = parseAntardashaId(selection.antardashaId);
    if (parsedAdId) {
      // Parent-ID verification: check if the decoded parent matches the selected mahadasha
      if (parsedAdId.parentMahadashaId !== selection.mahadashaId) {
        // The decoded parent is a well-formed MD ID - check if it exists in the report
        const parentExists = report.mahadashas.some((md) => {
          const expectedId = encodeMahadashaId(md.planet, md.start, md.end);
          return expectedId === parsedAdId.parentMahadashaId;
        });
        if (parentExists) {
          return { ok: false, error: 'ANTARDASHA_NOT_CHILD_OF_MAHADASHA' };
        }
        // Parent doesn't exist in report - return NOT_FOUND
        return { ok: false, error: 'ANTARDASHA_NOT_FOUND' };
      }

      // Parent matches - check if this antardasha (by planet/start/end) exists in a different mahadasha
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

  // Resolver revalidation: validate intervals and containment before accepting the selection
  // This is an input-resolution failure, not an astrological conclusion
  if (!validateInterval(mahadasha.start, mahadasha.end)) {
    return { ok: false, error: 'INVALID_SELECTED_PERIOD' };
  }
  if (!validateInterval(antardasha.start, antardasha.end)) {
    return { ok: false, error: 'INVALID_SELECTED_PERIOD' };
  }
  if (!isAntardashaContained(mahadasha.start, mahadasha.end, antardasha.start, antardasha.end)) {
    return { ok: false, error: 'INVALID_SELECTED_PERIOD' };
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
