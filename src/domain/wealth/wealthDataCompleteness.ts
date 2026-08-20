import type { DomainEvidence } from '../interpretation';
import {
  WealthEvidenceFamily
} from '../../engine/themeInterpretation/wealthThemeInterpretationTypes';
import type { ThemeInterpretationEvidence } from '../../engine/themeInterpretation/themeInterpretationTypes';
import type { WealthDataCompleteness } from './wealthTypes';

export function calculateWealthDataCompleteness(
  evidence: readonly DomainEvidence[],
  rawEvidence?: readonly ThemeInterpretationEvidence<WealthEvidenceFamily>[]
): WealthDataCompleteness {
  const has2H = evidence.some(
    (e) =>
      e.evidenceFamily === WealthEvidenceFamily.SECOND_HOUSE ||
      e.ruleId?.includes('2H') ||
      e.id.includes('HOUSE_2') ||
      e.statement.includes('2nd house')
  );

  const has2L = evidence.some(
    (e) =>
      e.evidenceFamily === WealthEvidenceFamily.SECOND_LORD ||
      e.ruleId?.includes('2L') ||
      e.id.includes('2L') ||
      e.statement.includes('2nd lord')
  );

  const has11H = evidence.some(
    (e) =>
      e.evidenceFamily === WealthEvidenceFamily.ELEVENTH_HOUSE ||
      e.ruleId?.includes('11H') ||
      e.id.includes('HOUSE_11') ||
      e.statement.includes('11th house')
  );

  const has11L = evidence.some(
    (e) =>
      e.evidenceFamily === WealthEvidenceFamily.ELEVENTH_LORD ||
      e.ruleId?.includes('11L') ||
      e.id.includes('11L') ||
      e.statement.includes('11th lord')
  );

  const has9H = evidence.some(
    (e) =>
      e.evidenceFamily === WealthEvidenceFamily.NINTH_HOUSE ||
      e.ruleId?.includes('9H') ||
      e.id.includes('HOUSE_9')
  );

  const has5H = evidence.some(
    (e) =>
      e.evidenceFamily === WealthEvidenceFamily.FIFTH_HOUSE ||
      e.ruleId?.includes('5H') ||
      e.id.includes('HOUSE_5')
  );

  const primaryCount = [has2H, has2L, has11H, has11L, has9H, has5H].filter(Boolean).length;

  let primaryFactors: 'AVAILABLE' | 'PARTIAL' | 'UNAVAILABLE';
  if ((has2H || has2L) && (has11H || has11L)) {
    primaryFactors = 'AVAILABLE';
  } else if (primaryCount > 0 || evidence.some((e) => e.role === 'PRIMARY')) {
    primaryFactors = 'PARTIAL';
  } else {
    primaryFactors = 'UNAVAILABLE';
  }

  const d2: 'AVAILABLE' | 'UNAVAILABLE' = evidence.some(
    (e) =>
      e.source === 'D2' ||
      e.phase === 'VARGA_CONFIRMATION' ||
      e.role === 'CONFIRMATION' ||
      e.evidenceFamily === WealthEvidenceFamily.D2
  )
    ? 'AVAILABLE'
    : 'UNAVAILABLE';

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
