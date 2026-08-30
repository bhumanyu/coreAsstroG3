import type {
  CounterReasoningClaim,
  CounterReasoningFactor,
  OutcomeMatch
} from './counterReasoningTypes';

/**
 * Matches a factor's explicit outcome semantics against the claim's asserted outcome.
 *
 * Invariants:
 * - Return 'UNSPECIFIED' if claim.assertedOutcome is undefined or 'UNKNOWN'.
 * - Return 'UNSPECIFIED' if factor.outcomeSemantics is undefined or empty (length === 0).
 * - Return 'EXACT' if factor.outcomeSemantics.includes(claim.assertedOutcome).
 * - Return 'ABSENT' otherwise.
 *
 * Strict Rule:
 * NEVER infer related outcomes (e.g. DELAY must never imply OBSTACLE or LOSS).
 */
export function matchFactorOutcome(
  factor: CounterReasoningFactor,
  claim: CounterReasoningClaim
): OutcomeMatch {
  if (!claim.assertedOutcome || claim.assertedOutcome === 'UNKNOWN') {
    return 'UNSPECIFIED';
  }

  if (!factor.outcomeSemantics || factor.outcomeSemantics.length === 0) {
    return 'UNSPECIFIED';
  }

  if (factor.outcomeSemantics.includes(claim.assertedOutcome)) {
    return 'EXACT';
  }

  return 'ABSENT';
}
