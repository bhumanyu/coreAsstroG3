import type { ReasoningEdgeType } from '../reasoningTrace/reasoningEdge';
import type {
  CounterReasoningEdgeSemantic,
  CounterReasoningOutcome,
  CounterReasoningOutcomePolarity
} from './counterReasoningTypes';

export interface OutcomeSemanticRule {
  readonly outcome: CounterReasoningOutcome;
  readonly polarity: CounterReasoningOutcomePolarity;
  readonly description: string;
}

export const COUNTER_REASONING_OUTCOME_RULES: readonly OutcomeSemanticRule[] = [
  { outcome: 'SUPPORT', polarity: 'POSITIVE', description: 'Favorable or reinforcing outcome indication' },
  { outcome: 'PROMOTION', polarity: 'POSITIVE', description: 'Upward movement or career advancement' },
  { outcome: 'GROWTH', polarity: 'POSITIVE', description: 'Expansion of assets, status, or capacity' },
  { outcome: 'STABILITY', polarity: 'POSITIVE', description: 'Steady, reliable manifestation or security' },
  { outcome: 'MANIFESTATION', polarity: 'POSITIVE', description: 'Concrete realization of domain potential' },
  { outcome: 'EMPLOYMENT', polarity: 'POSITIVE', description: 'Structured career placement or service role' },
  { outcome: 'LEADERSHIP', polarity: 'POSITIVE', description: 'Authoritative role or organizational command' },
  { outcome: 'BUSINESS', polarity: 'POSITIVE', description: 'Independent enterprise or commercial activity' },
  { outcome: 'TECHNICAL_SPECIALIZATION', polarity: 'POSITIVE', description: 'Deep subject-matter expertise or skilled craft' },
  { outcome: 'CHALLENGE', polarity: 'NEGATIVE', description: 'Adverse, obstructive, or frictional condition' },
  { outcome: 'DELAY', polarity: 'NEGATIVE', description: 'Temporal postponement or slowed timing' },
  { outcome: 'OBSTACLE', polarity: 'NEGATIVE', description: 'Impediment or blockade requiring mitigation' },
  { outcome: 'LOSS', polarity: 'NEGATIVE', description: 'Reduction, depletion, or expenditure of resources' },
  { outcome: 'VOLATILITY', polarity: 'NEGATIVE', description: 'Erratic, unstable, or fluctuating conditions' },
  { outcome: 'UNKNOWN', polarity: 'NEUTRAL', description: 'Unspecified or indeterminate outcome' }
];

/**
 * Resolves the semantic classification of a reasoning graph edge type.
 * Note: MANIFESTS and ACTIVATES represent activation/manifestation and do not prove specific polarity outcomes on their own.
 *
 * Contract Note on Negative Outcomes (CW-07A):
 * A generic CHALLENGE edge supports a negative proposition (e.g. DELAY, LOSS, OBSTACLE) only at the
 * generic friction/challenge level unless the evidence itself is outcome-specific.
 * Full fine-grained outcome-tag alignment is deferred to CW-07B.
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

const OUTCOME_POLARITY_MAP: ReadonlyMap<CounterReasoningOutcome, CounterReasoningOutcomePolarity> = new Map(
  COUNTER_REASONING_OUTCOME_RULES.map((rule) => [rule.outcome, rule.polarity])
);

/**
 * Resolves the outcome polarity (POSITIVE, NEGATIVE, or NEUTRAL) of an asserted outcome.
 * Single source of truth: derives directly from COUNTER_REASONING_OUTCOME_RULES.
 */
export function resolveOutcomePolarity(
  outcome: CounterReasoningOutcome
): CounterReasoningOutcomePolarity {
  return OUTCOME_POLARITY_MAP.get(outcome) ?? 'NEUTRAL';
}
