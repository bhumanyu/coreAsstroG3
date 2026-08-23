import type {
  DomainStrength,
  NatalGuardrail,
  ReasoningDirection
} from './reasoningTypes';

export const NATAL_STRENGTH_GUARDRAILS = Object.freeze({
  SUPPORT_SECONDARY_CONTRADICTION_CAP: 'STRONG' as const,
  MIXED_PRIMARY_CAP: 'MODERATE' as const,
  CHALLENGE_SECONDARY_CONTRADICTION_CAP: 'MODERATE' as const,
  MAX_SUPPORT_STRENGTH: 'STRONG' as const,
  MAX_MIXED_STRENGTH: 'MODERATE' as const,
  MAX_CHALLENGE_STRENGTH: 'MODERATE' as const
});

export interface NatalGuardrailInput {
  readonly primaryDirection: ReasoningDirection;
  readonly primaryStrength: DomainStrength;
  readonly primarySupport: number;
  readonly primaryChallenge: number;
  readonly secondarySupport: number;
  readonly secondaryChallenge: number;
  readonly modifierSupport?: number;
  readonly modifierChallenge?: number;
}

export interface NatalGuardrailResult {
  readonly direction: ReasoningDirection;
  readonly strength: DomainStrength;
  readonly applied: readonly NatalGuardrail[];
}

export function capSupportStrength(
  strength: DomainStrength,
  cap: DomainStrength = NATAL_STRENGTH_GUARDRAILS.SUPPORT_SECONDARY_CONTRADICTION_CAP
): DomainStrength {
  if (strength === 'VERY_STRONG') {
    return cap;
  }
  return strength;
}

export function capMixedStrength(
  strength: DomainStrength,
  cap: DomainStrength = NATAL_STRENGTH_GUARDRAILS.MIXED_PRIMARY_CAP
): DomainStrength {
  if (strength === 'VERY_STRONG' || strength === 'STRONG' || strength === 'MIXED') {
    return cap;
  }
  return strength;
}

export function capChallengeStrength(
  strength: DomainStrength,
  cap: DomainStrength = NATAL_STRENGTH_GUARDRAILS.CHALLENGE_SECONDARY_CONTRADICTION_CAP
): DomainStrength {
  if (strength === 'VERY_STRONG' || strength === 'STRONG') {
    return cap;
  }
  return strength;
}

export function applyNatalStrengthGuardrails(
  input: NatalGuardrailInput
): NatalGuardrailResult {
  const applied: NatalGuardrail[] = [];
  let direction: ReasoningDirection = input.primaryDirection;
  let strength: DomainStrength = input.primaryStrength;

  if (input.primaryDirection === 'UNAVAILABLE') {
    applied.push('NO_PRIMARY_PROMISE');
    direction = 'UNAVAILABLE';
    strength = 'UNDETERMINED';
  } else if (input.primaryDirection === 'SUPPORT') {
    direction = 'SUPPORT';
    if (input.secondaryChallenge > 0) {
      applied.push('SECONDARY_CONTRADICTION');
      const capped = capSupportStrength(strength);
      if (capped !== strength) {
        applied.push('PRIMARY_SUPPORT_CAP');
        strength = capped;
      }
    }
  } else if (input.primaryDirection === 'MIXED') {
    direction = 'MIXED';
    applied.push('PRIMARY_MIXED_CAP');
    strength = capMixedStrength(strength);
  } else if (input.primaryDirection === 'CHALLENGE') {
    direction = 'CHALLENGE';
    if (input.secondarySupport > 0) {
      applied.push('SECONDARY_CONTRADICTION');
      const capped = capChallengeStrength(strength);
      if (capped !== strength) {
        applied.push('PRIMARY_CHALLENGE_CAP');
        strength = capped;
      }
    }
  } else {
    // Handle 'NEUTRAL' fallthrough explicitly
    direction = input.primaryDirection;
    strength = input.primaryStrength;
  }

  if (applied.length === 0) {
    applied.push('NONE');
  }

  return Object.freeze({
    direction,
    strength,
    applied: Object.freeze(applied)
  });
}
