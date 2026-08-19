import type { ConfidenceLevel } from './DomainInterpretationTypes';
import type { DomainEvidence } from './DomainEvidence';

export function calculateEvidenceConfidence(
  evidence: readonly DomainEvidence[]
): ConfidenceLevel {
  if (evidence.length === 0) {
    return 'UNDETERMINED';
  }

  const weightedScore = evidence.reduce(
    (total, item) =>
      total +
      strengthWeight(item.strength) * Math.max(1, item.priority),
    0
  );

  if (weightedScore >= 30) {
    return 'VERY_HIGH';
  }

  if (weightedScore >= 20) {
    return 'HIGH';
  }

  if (weightedScore >= 12) {
    return 'MODERATE';
  }

  if (weightedScore >= 6) {
    return 'LOW';
  }

  return 'VERY_LOW';
}

function strengthWeight(
  strength: DomainEvidence['strength']
): number {
  switch (strength) {
    case 'VERY_STRONG':
      return 4;
    case 'STRONG':
      return 3;
    case 'MODERATE':
      return 2;
    case 'WEAK':
      return 1;
  }
}
