import type {
  CounterReasoningAssertionMode,
  CounterReasoningAssertionPolarity,
  CounterReasoningPropositionAlignment
} from './counterReasoningTypes';

/**
 * Inverts proposition alignment:
 * - SUPPORTS_PROPOSITION <-> OPPOSES_PROPOSITION
 * - NEUTRAL stays NEUTRAL
 */
export function invertPropositionAlignment(
  alignment: CounterReasoningPropositionAlignment
): CounterReasoningPropositionAlignment {
  if (alignment === 'SUPPORTS_PROPOSITION') {
    return 'OPPOSES_PROPOSITION';
  }
  if (alignment === 'OPPOSES_PROPOSITION') {
    return 'SUPPORTS_PROPOSITION';
  }
  return 'NEUTRAL';
}

/**
 * Applies assertion mode and assertion polarity to a base proposition alignment:
 * - The two dimensions are orthogonal:
 *   - assertionMode = stance ('AFFIRM' | 'DENY' | 'QUESTION')
 *   - assertionPolarity = proposition formulation ('POSITIVE' | 'NEGATED')
 * - Inversion is driven by assertionPolarity (or legacy DENY mode):
 *   - If assertionPolarity === 'NEGATED' (or legacy mode === 'DENY') -> invert via invertPropositionAlignment.
 *   - Otherwise keeps the base alignment.
 * - assertionMode (AFFIRM/DENY/QUESTION) does NOT by itself invert; QUESTION still allows evidence to answer (never forces NEUTRAL).
 * - Backward-compat: Treat legacy DENY as equivalent to NEGATED if a caller passes mode='DENY' without polarity.
 */
export function applyAssertion(
  alignment: CounterReasoningPropositionAlignment,
  mode: CounterReasoningAssertionMode,
  polarity: CounterReasoningAssertionPolarity = 'POSITIVE'
): CounterReasoningPropositionAlignment {
  const isNegated = polarity === 'NEGATED' || mode === 'DENY';
  if (isNegated) {
    return invertPropositionAlignment(alignment);
  }
  return alignment;
}

/**
 * Backward-compatible wrapper for applyAssertion.
 * Delegates to polarity-aware logic, treating legacy DENY mode as NEGATED.
 */
export function applyAssertionMode(
  alignment: CounterReasoningPropositionAlignment,
  mode: CounterReasoningAssertionMode
): CounterReasoningPropositionAlignment {
  return applyAssertion(alignment, mode, mode === 'DENY' ? 'NEGATED' : 'POSITIVE');
}

