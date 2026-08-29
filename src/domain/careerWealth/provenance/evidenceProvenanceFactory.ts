import type { EvidenceProvenance } from './evidenceProvenance';
import {
  buildEvidenceId,
  type EvidenceIdentityInput
} from './evidenceIdentity';

/**
 * Creates an immutable EvidenceProvenance instance with a computed deterministic evidenceId.
 */
export function createEvidenceProvenance(
  input: EvidenceIdentityInput
): EvidenceProvenance {
  const evidenceId = buildEvidenceId(input);

  return Object.freeze({
    evidenceId,
    ruleId: input.ruleId,
    domain: input.domain,
    axis: input.axis,
    source: input.source,
    effect: input.effect,
    strength: input.strength
  });
}
