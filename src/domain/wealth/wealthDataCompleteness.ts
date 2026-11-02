import type { DomainEvidence } from '../interpretation';
import { WealthEvidenceFamily } from '../../engine/themeInterpretation/wealthThemeInterpretationTypes';
import type { WealthDataCompleteness } from './wealthTypes';

export function calculateWealthDataCompleteness(
  evidence: readonly DomainEvidence[]
): WealthDataCompleteness {
  const has2H = evidence.some(
    (e) => e.evidenceFamily === WealthEvidenceFamily.SECOND_HOUSE
  );

  const has2L = evidence.some(
    (e) => e.evidenceFamily === WealthEvidenceFamily.SECOND_LORD
  );

  const has11H = evidence.some(
    (e) => e.evidenceFamily === WealthEvidenceFamily.ELEVENTH_HOUSE
  );

  const has11L = evidence.some(
    (e) => e.evidenceFamily === WealthEvidenceFamily.ELEVENTH_LORD
  );

  const has9H = evidence.some(
    (e) => e.evidenceFamily === WealthEvidenceFamily.NINTH_HOUSE
  );

  const has9L = evidence.some(
    (e) => e.evidenceFamily === WealthEvidenceFamily.NINTH_LORD
  );

  const has5H = evidence.some(
    (e) => e.evidenceFamily === WealthEvidenceFamily.FIFTH_HOUSE
  );

  const has5L = evidence.some(
    (e) => e.evidenceFamily === WealthEvidenceFamily.FIFTH_LORD
  );

  const primaryCount = [has2H, has2L, has11H, has11L, has9H, has9L, has5H, has5L].filter(Boolean).length;

  let primaryFactors: 'AVAILABLE' | 'PARTIAL' | 'UNAVAILABLE';
  if ((has2H || has2L) && (has11H || has11L)) {
    primaryFactors = 'AVAILABLE';
  } else if (primaryCount > 0 || evidence.some((e) => e.role === 'PRIMARY')) {
    primaryFactors = 'PARTIAL';
  } else {
    primaryFactors = 'UNAVAILABLE';
  }

  // D2 is not validated for canonical Wealth reasoning; declarations are diagnostic only.
  const d2: 'UNAVAILABLE' = 'UNAVAILABLE';

  const dasha: 'AVAILABLE' | 'PARTIAL' | 'UNAVAILABLE' = evidence.some(
    (e) =>
      e.source === 'DASHA' ||
      e.phase === 'DASHA_ACTIVATION' ||
      e.evidenceFamily === WealthEvidenceFamily.DASHA
  )
    ? 'AVAILABLE'
    : 'UNAVAILABLE';

  const transit: 'AVAILABLE' | 'PARTIAL' | 'UNAVAILABLE' = evidence.some(
    (e) =>
      e.source === 'TRANSIT' ||
      e.phase === 'TRANSIT_TRIGGER' ||
      e.evidenceFamily === WealthEvidenceFamily.TRANSIT
  )
    ? 'AVAILABLE'
    : 'UNAVAILABLE';

  return Object.freeze({
    primaryFactors,
    d2,
    dasha,
    transit
  });
}
