import { DashaReasoningEvidence } from './dashaReasoningTypes';
import { DirectionalEvidenceInput } from './dashaDirectionalEvidence';

/**
 * Derives directional dasha reasoning evidence from structured activation inputs.
 *
 * NOTE: In D07-A (generic planetary directional layer), this reasoner passes through
 * only generic IMPLICATION and OUTCOME level evidence and avoids hardcoding domain-specific
 * rules (e.g. career/wealth house assumptions).
 */
export function deriveDirectionalDashaEvidence(
  input: DirectionalEvidenceInput
): readonly DashaReasoningEvidence[] {
  const derived: DashaReasoningEvidence[] = [];

  if (input.reasoningEvidence && input.reasoningEvidence.length > 0) {
    for (const item of input.reasoningEvidence) {
      if (item.level === 'IMPLICATION' || item.level === 'OUTCOME') {
        derived.push(item);
      }
    }
  }

  return Object.freeze(derived);
}
