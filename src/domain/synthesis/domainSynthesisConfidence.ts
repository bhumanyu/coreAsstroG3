import type {
  DomainInterpretation
} from '../interpretation';
import type {
  CrossDomainConflict,
  LifeAnalysisConfidence,
  LifeAnalysisDataCompleteness
} from './domainSynthesisTypes';

export function calculateDataCompleteness(
  domains: readonly DomainInterpretation[]
): LifeAnalysisDataCompleteness {
  const hasCareer = domains.some((d) => d.domain === 'CAREER');
  const hasWealth = domains.some((d) => d.domain === 'WEALTH');
  const hasTiming = domains.some(
    (d) =>
      d.dashaActivation?.active &&
      d.dashaActivation.effect &&
      (d.dashaActivation.effect as string) !== 'UNAVAILABLE' &&
      d.dashaActivation.effect !== 'INSUFFICIENT_DATA' &&
      d.dashaActivation.effect !== 'UNKNOWN'
  );

  let overall: 'COMPLETE' | 'PARTIAL' | 'INSUFFICIENT_DATA';
  if (hasCareer && hasWealth) {
    overall = 'COMPLETE';
  } else if (hasCareer || hasWealth) {
    overall = 'PARTIAL';
  } else {
    overall = 'INSUFFICIENT_DATA';
  }

  return Object.freeze({
    career: hasCareer ? 'AVAILABLE' : 'UNAVAILABLE',
    wealth: hasWealth ? 'AVAILABLE' : 'UNAVAILABLE',
    timing: hasTiming ? 'AVAILABLE' : 'UNAVAILABLE',
    overall
  });
}

export function calculateLifeAnalysisConfidence(
  completeness: LifeAnalysisDataCompleteness,
  domains: readonly DomainInterpretation[],
  conflicts: readonly CrossDomainConflict[]
): LifeAnalysisConfidence {
  if (completeness.overall === 'INSUFFICIENT_DATA') {
    return 'VERY_LOW';
  }
  if (completeness.overall === 'PARTIAL') {
    return 'LOW';
  }

  const hasHighSeverityConflict = conflicts.some((c) => c.severity === 'HIGH');
  const hasLowDomainConfidence = domains.some(
    (d) =>
      d.conclusion?.confidence === 'LOW' ||
      d.conclusion?.confidence === 'VERY_LOW'
  );

  if (hasHighSeverityConflict || hasLowDomainConfidence) {
    return 'MODERATE';
  }

  return 'HIGH';
}
