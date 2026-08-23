import type {
  ReasoningTrace,
  WeightedReasoningEvidence
} from './reasoningTypes';

export function buildReasoningTrace(
  evidence: readonly WeightedReasoningEvidence[]
): ReasoningTrace {
  const byLayer = (
    layer: WeightedReasoningEvidence['layer']
  ): readonly WeightedReasoningEvidence[] =>
    Object.freeze(
      evidence.filter((item) => item.layer === layer)
    );

  return Object.freeze({
    primaryPromise: byLayer('PRIMARY_PROMISE'),
    secondarySupport: byLayer('SECONDARY_SUPPORT'),
    modifiers: byLayer('MODIFIER'),
    yogas: byLayer('YOGA'),
    varga: byLayer('VARGA'),
    dasha: byLayer('DASHA'),
    transit: byLayer('TRANSIT')
  });
}
