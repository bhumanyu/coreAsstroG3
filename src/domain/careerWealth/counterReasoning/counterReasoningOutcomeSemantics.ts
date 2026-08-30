import type {
  CounterReasoningOutcome,
  CounterReasoningOutcomePolarity
} from './counterReasoningTypes';

export interface OutcomeSemanticRule {
  readonly outcome: CounterReasoningOutcome;
  readonly polarity: CounterReasoningOutcomePolarity;
  readonly description: string;
}

export const COUNTER_REASONING_OUTCOME_RULES: readonly OutcomeSemanticRule[] = [
  { outcome: 'DELAY', polarity: 'NEGATIVE', description: 'Temporal postponement or slowed timing' },
  { outcome: 'OBSTACLE', polarity: 'NEGATIVE', description: 'Impediment or blockade requiring mitigation' },
  { outcome: 'LOSS', polarity: 'NEGATIVE', description: 'Reduction, depletion, or expenditure of resources' },
  { outcome: 'VOLATILITY', polarity: 'NEGATIVE', description: 'Erratic, unstable, or fluctuating conditions' },
  { outcome: 'CHALLENGE', polarity: 'NEGATIVE', description: 'Adverse, obstructive, or frictional condition' },
  { outcome: 'PROMOTION', polarity: 'POSITIVE', description: 'Upward movement or career advancement' },
  { outcome: 'GROWTH', polarity: 'POSITIVE', description: 'Expansion of assets, status, or capacity' },
  { outcome: 'STABILITY', polarity: 'POSITIVE', description: 'Steady, reliable manifestation or security' },
  { outcome: 'MANIFESTATION', polarity: 'POSITIVE', description: 'Concrete realization of domain potential' },
  { outcome: 'EMPLOYMENT', polarity: 'POSITIVE', description: 'Structured career placement or service role' },
  { outcome: 'LEADERSHIP', polarity: 'POSITIVE', description: 'Authoritative role or organizational command' },
  { outcome: 'BUSINESS', polarity: 'POSITIVE', description: 'Independent enterprise or commercial activity' },
  { outcome: 'TECHNICAL_SPECIALIZATION', polarity: 'POSITIVE', description: 'Deep subject-matter expertise or skilled craft' },
  { outcome: 'SUPPORT', polarity: 'POSITIVE', description: 'Favorable or reinforcing outcome indication' },
  { outcome: 'UNKNOWN', polarity: 'NEUTRAL', description: 'Unspecified or indeterminate outcome' }
];

const OUTCOME_POLARITY_MAP: ReadonlyMap<CounterReasoningOutcome, CounterReasoningOutcomePolarity> = new Map(
  COUNTER_REASONING_OUTCOME_RULES.map((rule) => [rule.outcome, rule.polarity])
);

/**
 * Resolves the outcome polarity (POSITIVE, NEGATIVE, or NEUTRAL) of an asserted outcome.
 * Single source of truth: derives directly from COUNTER_REASONING_OUTCOME_RULES.
 *
 * Polarity Mapping:
 * - DELAY / OBSTACLE / LOSS / VOLATILITY / CHALLENGE -> NEGATIVE
 * - PROMOTION / GROWTH / STABILITY / MANIFESTATION / EMPLOYMENT / LEADERSHIP / BUSINESS / TECHNICAL_SPECIALIZATION / SUPPORT -> POSITIVE
 * - UNKNOWN / default -> NEUTRAL
 */
export function resolveOutcomePolarity(
  outcome: CounterReasoningOutcome
): CounterReasoningOutcomePolarity {
  return OUTCOME_POLARITY_MAP.get(outcome) ?? 'NEUTRAL';
}
