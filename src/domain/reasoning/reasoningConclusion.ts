import type {
  DomainStrength,
  ReasoningDirection,
  WeightedReasoningEvidence
} from './reasoningTypes';

export interface NatalPromiseResult {
  readonly direction: ReasoningDirection;
  readonly strength: DomainStrength;
  readonly primarySupport: number;
  readonly primaryChallenge: number;
  readonly secondarySupport: number;
  readonly secondaryChallenge: number;
  readonly rationale: string;
}

function sum(
  evidence: readonly WeightedReasoningEvidence[],
  direction: 'SUPPORT' | 'CHALLENGE'
): number {
  return evidence
    .filter((item) => item.direction === direction)
    .reduce((total, item) => total + item.weight, 0);
}

export function resolveStrength(
  support: number,
  challenge: number
): DomainStrength {
  const total = support + challenge;

  if (total === 0) {
    return 'UNDETERMINED';
  }

  const dominance = Math.abs(support - challenge) / total;

  if (support > challenge) {
    if (dominance >= 0.75) return 'VERY_STRONG';
    if (dominance >= 0.50) return 'STRONG';
    return 'MODERATE';
  }

  if (challenge > support) {
    if (dominance >= 0.75) return 'VERY_WEAK';
    if (dominance >= 0.50) return 'WEAK';
    return 'MIXED';
  }

  return 'MIXED';
}

export function resolveNatalPromise(
  evidence: readonly WeightedReasoningEvidence[]
): NatalPromiseResult {
  const primary = evidence.filter(
    (item) => item.layer === 'PRIMARY_PROMISE'
  );

  const secondary = evidence.filter(
    (item) => item.layer === 'SECONDARY_SUPPORT'
  );

  const modifiers = evidence.filter(
    (item) => item.layer === 'MODIFIER'
  );

  const yogas = evidence.filter(
    (item) => item.layer === 'YOGA'
  );

  const primarySupport = sum(primary, 'SUPPORT');
  const primaryChallenge = sum(primary, 'CHALLENGE');

  const secondarySupport = sum(secondary, 'SUPPORT');
  const secondaryChallenge = sum(secondary, 'CHALLENGE');

  const yogaSupport = sum(yogas, 'SUPPORT');
  const yogaChallenge = sum(yogas, 'CHALLENGE');

  const primaryNet = primarySupport - primaryChallenge;
  const secondaryNet = secondarySupport - secondaryChallenge;
  const modifierNet =
    sum(modifiers, 'SUPPORT') + yogaSupport - (sum(modifiers, 'CHALLENGE') + yogaChallenge);

  let direction: ReasoningDirection;

  if (primarySupport === 0 && primaryChallenge === 0) {
    direction =
      secondaryNet > 0
        ? 'SUPPORT'
        : secondaryNet < 0
          ? 'CHALLENGE'
          : 'UNAVAILABLE';
  } else if (primarySupport > 0 && primaryChallenge > 0) {
    direction = 'MIXED';
  } else if (primaryNet > 0) {
    direction = 'SUPPORT';
  } else {
    direction = 'CHALLENGE';
  }

  const strength = resolveStrength(
    primarySupport + secondarySupport + Math.max(modifierNet, 0),
    primaryChallenge + secondaryChallenge + Math.max(-modifierNet, 0)
  );

  return Object.freeze({
    direction,
    strength,
    primarySupport,
    primaryChallenge,
    secondarySupport,
    secondaryChallenge,
    rationale:
      'Natal promise is resolved from primary evidence first, then secondary support and modifiers. Dasha and transit evidence are excluded.'
  });
}
