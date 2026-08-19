import type { DomainConflict } from './DomainConflict';
import type { DomainEvidence } from './DomainEvidence';

export function sortDomainEvidence(
  evidence: readonly DomainEvidence[]
): readonly DomainEvidence[] {
  return Object.freeze([
    ...evidence
  ].sort((left, right) => {
    if (right.priority !== left.priority) {
      return right.priority - left.priority;
    }
    return strengthRank(right.strength) - strengthRank(left.strength);
  }));
}

export function detectDomainConflicts(
  domain: DomainEvidence['domain'],
  evidence: readonly DomainEvidence[]
): readonly DomainConflict[] {
  const supporting = evidence.filter(
    (item) => item.domain === domain && item.polarity === 'SUPPORTING'
  );
  const challenging = evidence.filter(
    (item) => item.domain === domain && item.polarity === 'CHALLENGING'
  );

  if (supporting.length === 0 || challenging.length === 0) {
    return Object.freeze([]);
  }

  const strongestSupporting = [...supporting].sort(compareEvidence)[0];
  const strongestChallenging = [...challenging].sort(compareEvidence)[0];

  if (!strongestSupporting || !strongestChallenging) {
    return Object.freeze([]);
  }

  const conflict = Object.freeze({
    id: `${domain}-CONFLICT-001`,
    domain,
    description:
      'Supporting and challenging evidence are both present and require synthesis.',
    positiveEvidenceIds: Object.freeze([strongestSupporting.id]),
    negativeEvidenceIds: Object.freeze([strongestChallenging.id]),
    primaryPhase: strongestChallenging.phase,
    severity: strongestChallenging.strength,
    resolution:
      'Retain both signals and resolve them through evidence priority, activation state, and divisional confirmation.'
  });

  return Object.freeze([conflict]);
}

export function compareEvidence(
  left: DomainEvidence,
  right: DomainEvidence
): number {
  if (right.priority !== left.priority) {
    return right.priority - left.priority;
  }
  return strengthRank(right.strength) - strengthRank(left.strength);
}

export function strengthRank(
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
