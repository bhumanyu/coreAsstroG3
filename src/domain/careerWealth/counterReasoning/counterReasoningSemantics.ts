import type { ReasoningEdgeType } from '../reasoningTrace/reasoningEdge';
import type {
  CounterReasoningEdgeSemantic,
  CounterReasoningOutcome,
  CounterReasoningOutcomePolarity
} from './counterReasoningTypes';

export {
  COUNTER_REASONING_OUTCOME_RULES,
  resolveOutcomePolarity
} from './counterReasoningOutcomeSemantics';
export type { OutcomeSemanticRule } from './counterReasoningOutcomeSemantics';

/**
 * Resolves the semantic classification of a reasoning graph edge type.
 * Note: MANIFESTS and ACTIVATES represent activation/manifestation and do not prove specific polarity outcomes on their own.
 *
 * Contract Note on Negative Outcomes:
 * A generic CHALLENGE edge supports a negative proposition (e.g. DELAY, LOSS, OBSTACLE) only at the
 * generic friction/challenge level unless the evidence itself is outcome-specific.
 */
export function resolveEdgeSemantic(edgeType: ReasoningEdgeType): CounterReasoningEdgeSemantic {
  switch (edgeType) {
    case 'SUPPORTS':
      return 'SUPPORT';
    case 'CHALLENGES':
    case 'CONTRADICTS':
      return 'CHALLENGE';
    case 'ACTIVATES':
      return 'ACTIVATION';
    case 'MODIFIES':
      return 'MODIFICATION';
    case 'CONFIRMS':
      return 'CONFIRMATION';
    case 'MANIFESTS':
      return 'NEUTRAL';
    default:
      return 'NEUTRAL';
  }
}

