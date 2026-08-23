import type {
  DomainStrength,
  NatalContradictionSummary,
  NatalGuardrail,
  ReasoningDirection,
  WeightedReasoningEvidence
} from './reasoningTypes';
import { applyNatalStrengthGuardrails } from './natalStrengthGuardrails';

export interface NatalPromiseResult {
  readonly direction: ReasoningDirection;
  readonly strength: DomainStrength;
  readonly primaryDirection: ReasoningDirection;
  readonly primaryStrength: DomainStrength;
  readonly primarySupport: number;
  readonly primaryChallenge: number;
  readonly secondarySupport: number;
  readonly secondaryChallenge: number;
  readonly modifierSupport: number;
  readonly modifierChallenge: number;
  readonly guardrails: readonly NatalGuardrail[];
  readonly contradiction: NatalContradictionSummary;
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

  const modifierSupport = sum(modifiers, 'SUPPORT') + sum(yogas, 'SUPPORT');
  const modifierChallenge = sum(modifiers, 'CHALLENGE') + sum(yogas, 'CHALLENGE');

  let primaryDirection: ReasoningDirection;

  if (primarySupport === 0 && primaryChallenge === 0) {
    primaryDirection = 'UNAVAILABLE';
  } else if (primarySupport > 0 && primaryChallenge > 0) {
    primaryDirection = 'MIXED';
  } else if (primarySupport > primaryChallenge) {
    primaryDirection = 'SUPPORT';
  } else {
    primaryDirection = 'CHALLENGE';
  }

  const primaryStrength: DomainStrength =
    primaryDirection === 'UNAVAILABLE'
      ? 'UNDETERMINED'
      : resolveStrength(primarySupport, primaryChallenge);

  const guardrailResult = applyNatalStrengthGuardrails({
    primaryDirection,
    primaryStrength,
    primarySupport,
    primaryChallenge,
    secondarySupport,
    secondaryChallenge
  });

  // Calculate contradiction summary
  let opposingPrimary = 0;
  let opposingSecondary = 0;
  let opposingModifier = 0;

  if (primaryDirection === 'SUPPORT') {
    opposingPrimary = primaryChallenge;
    opposingSecondary = secondaryChallenge;
    opposingModifier = modifierChallenge;
  } else if (primaryDirection === 'CHALLENGE') {
    opposingPrimary = primarySupport;
    opposingSecondary = secondarySupport;
    opposingModifier = modifierSupport;
  } else if (primaryDirection === 'MIXED') {
    opposingPrimary = Math.min(primarySupport, primaryChallenge);
    opposingSecondary = Math.min(secondarySupport, secondaryChallenge);
    opposingModifier = Math.min(modifierSupport, modifierChallenge);
  }

  const primaryTotal = primarySupport + primaryChallenge;
  const secondaryTotal = secondarySupport + secondaryChallenge;
  const modifierTotal = modifierSupport + modifierChallenge;

  const primaryContradictionRatio =
    primaryTotal > 0 ? opposingPrimary / primaryTotal : 0;
  const secondaryContradictionRatio =
    secondaryTotal > 0 ? opposingSecondary / secondaryTotal : 0;
  const modifierContradictionRatio =
    modifierTotal > 0 ? opposingModifier / modifierTotal : 0;

  const hasContradiction =
    opposingPrimary > 0 || opposingSecondary > 0 || opposingModifier > 0;

  const contradiction: NatalContradictionSummary = Object.freeze({
    hasContradiction,
    primaryContradictionRatio,
    secondaryContradictionRatio,
    modifierContradictionRatio
  });

  return Object.freeze({
    direction: guardrailResult.direction,
    strength: guardrailResult.strength,
    primaryDirection,
    primaryStrength,
    primarySupport,
    primaryChallenge,
    secondarySupport,
    secondaryChallenge,
    modifierSupport,
    modifierChallenge,
    guardrails: guardrailResult.applied,
    contradiction,
    rationale:
      'Natal promise is resolved from primary evidence establishing direction and base strength, with secondary support and modifiers qualifying via explicit guardrails. Dasha and transit evidence are excluded.'
  });
}
