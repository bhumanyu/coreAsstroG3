import type {
  CounterReasoningAssertionMode,
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
 * Applies the user's assertion mode to a base proposition alignment:
 * - AFFIRM: preserves base alignment.
 * - DENY: inverts proposition alignment (SUPPORTS <-> OPPOSES, NEUTRAL stays NEUTRAL).
 * - QUESTION: preserves base alignment (evidence may still answer the question; does NOT force NEUTRAL).
 * - default: returns NEUTRAL.
 */
export function applyAssertionMode(
  alignment: CounterReasoningPropositionAlignment,
  mode: CounterReasoningAssertionMode
): CounterReasoningPropositionAlignment {
  switch (mode) {
    case 'AFFIRM':
      return alignment;
    case 'DENY':
      return invertPropositionAlignment(alignment);
    case 'QUESTION':
      return alignment;
    default:
      return 'NEUTRAL';
  }
}
