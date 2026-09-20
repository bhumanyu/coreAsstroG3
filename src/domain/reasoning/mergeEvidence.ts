import type {
  ReasoningDirection,
  EvidenceStrength
} from './reasoningTypes';

/**
 * Merges two evidence directions according to the merge table:
 * - SUPPORT + SUPPORT = SUPPORT
 * - CHALLENGE + CHALLENGE = CHALLENGE
 * - SUPPORT + CHALLENGE (either order) = MIXED
 * - MIXED + anything = MIXED
 * - NEUTRAL + X = X
 * - UNAVAILABLE + X = X (UNAVAILABLE must never become negative/positive on its own)
 *
 * This ensures that duplicate occurrences with conflicting directions are resolved
 * appropriately without double-counting evidence weight.
 */
export function mergeEvidenceDirection(
  a: ReasoningDirection,
  b: ReasoningDirection
): ReasoningDirection {
  // If either is MIXED, result is MIXED
  if (a === 'MIXED' || b === 'MIXED') {
    return 'MIXED';
  }

  // UNAVAILABLE or NEUTRAL + X = X (UNAVAILABLE/NEUTRAL don't contribute direction)
  if (a === 'UNAVAILABLE' || a === 'NEUTRAL') {
    return b;
  }
  if (b === 'UNAVAILABLE' || b === 'NEUTRAL') {
    return a;
  }

  // SUPPORT + SUPPORT = SUPPORT
  if (a === 'SUPPORT' && b === 'SUPPORT') {
    return 'SUPPORT';
  }

  // CHALLENGE + CHALLENGE = CHALLENGE
  if (a === 'CHALLENGE' && b === 'CHALLENGE') {
    return 'CHALLENGE';
  }

  // SUPPORT + CHALLENGE (either order) = MIXED
  return 'MIXED';
}

/**
 * Evidence strength ordered scale for merge comparison (weakest to strongest).
 * Duplicate occurrences retain the strongest representation; they do NOT sum.
 */
const STRENGTH_ORDER: ReadonlyArray<EvidenceStrength> = Object.freeze([
  'WEAK',
  'MODERATE',
  'STRONG',
  'VERY_STRONG'
] as const);

/**
 * Merges two evidence strengths by taking the maximum on the ordered scale:
 * WEAK < MODERATE < STRONG < VERY_STRONG
 *
 * This ensures that duplicate occurrences do not increase evidentiary weight -
 * the strongest single occurrence is retained.
 */
export function mergeEvidenceStrength(
  a: EvidenceStrength,
  b: EvidenceStrength
): EvidenceStrength {
  const aIndex = STRENGTH_ORDER.indexOf(a);
  const bIndex = STRENGTH_ORDER.indexOf(b);

  // Take the stronger of the two (higher index = stronger)
  return aIndex >= bIndex ? a : b;
}
