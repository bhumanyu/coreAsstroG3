import type {
  FinalDomainConfidence
} from './careerWealthFinalSynthesisTypes';

import {
  calculateFinalConfidenceV2,
  type FinalConfidenceInput
} from './finalConfidenceModel';

/**
 * CW-05D migration alias.
 *
 * The legacy positional API was intentionally removed, and all callers must
 * now pass a structured FinalConfidenceInput object.
 *
 * New code should prefer calculateFinalConfidenceV2() directly to access
 * full diagnostics and confidence breakdowns.
 */
export function calculateFinalConfidence(
  input: FinalConfidenceInput
): FinalDomainConfidence {
  return calculateFinalConfidenceV2(input).final;
}
