import type { DomainEvidence } from '../interpretation';
import type { CareerEvidenceFamily, ThemeInterpretationEvidence } from '../../engine/themeInterpretation/themeInterpretationTypes';
import type { CareerDataCompleteness } from './careerTypes';

export function calculateCareerDataCompleteness(
  evidence: readonly DomainEvidence[],
  rawEvidence?: readonly ThemeInterpretationEvidence<CareerEvidenceFamily>[]
): CareerDataCompleteness {
  const has10House = evidence.some(
    (e) =>
      e.ruleId?.includes('10H') ||
      e.id.includes('HOUSE_10') ||
      (e.role === 'PRIMARY' && e.statement.includes('10th house'))
  );

  const has10Lord = evidence.some(
    (e) =>
      e.ruleId?.includes('10L') ||
      e.id.includes('10L') ||
      (e.role === 'PRIMARY' && e.statement.includes('10th lord'))
  );

  let primaryFactors: 'COMPLETE' | 'PARTIAL' | 'MISSING';
  if (has10House && has10Lord) {
    primaryFactors = 'COMPLETE';
  } else if (has10House || has10Lord || evidence.some((e) => e.role === 'PRIMARY')) {
    primaryFactors = 'PARTIAL';
  } else {
    primaryFactors = 'MISSING';
  }

  const d10: 'AVAILABLE' | 'UNAVAILABLE' = evidence.some(
    (e) => e.source === 'D10' || e.phase === 'VARGA_CONFIRMATION' || e.role === 'CONFIRMATION'
  )
    ? 'AVAILABLE'
    : 'UNAVAILABLE';

  const dasha: 'AVAILABLE' | 'UNAVAILABLE' = evidence.some(
    (e) => e.source === 'DASHA' || e.phase === 'DASHA_ACTIVATION' || e.role === 'TIMING'
  )
    ? 'AVAILABLE'
    : 'UNAVAILABLE';

  const transit: 'AVAILABLE' | 'UNAVAILABLE' = evidence.some(
    (e) => e.source === 'TRANSIT' || e.phase === 'TRANSIT_TRIGGER'
  )
    ? 'AVAILABLE'
    : 'UNAVAILABLE';

  return Object.freeze({
    primaryFactors,
    d10,
    dasha,
    transit
  });
}
