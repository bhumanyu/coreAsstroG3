import type {
  FinalDomainConfidence
} from './careerWealthFinalSynthesisTypes';

import {
  calculateFinalConfidenceV2,
  type FinalConfidenceInput
} from './finalConfidenceModel';

/**
 * CW-05D compatibility wrapper.
 *
 * New code should prefer calculateFinalConfidenceV2()
 * with the complete FinalConfidenceInput.
 *
 * This wrapper exists temporarily so older callers can
 * migrate without changing semantics elsewhere.
 */
export function calculateFinalConfidence(
  input: FinalConfidenceInput
): FinalDomainConfidence {
  return calculateFinalConfidenceV2(input).final;
}
