/**
 * P2-07C Career Mechanism Type Tests
 *
 * This file contains compile-time type assertions that are excluded from vitest
 * but included in tsc --noEmit. These tests verify type-level invariants that
 * cannot be checked at runtime.
 *
 * To run: tsc --noEmit (this file is included automatically)
 */

import type { CareerMechanismRefinementSource } from './careerMechanismTypes';

/**
 * Refinement source restriction test.
 * Verifies that CareerMechanismRefinementSource is restrictive.
 */
export function testRefiningMechanismEvidenceSourceRestriction() {
  // This type assignment should fail for non-refinement sources
  const validSource: CareerMechanismRefinementSource = 'D10';

  // @ts-expect-error - PATTERN is not a refinement source
  const invalidSource1: CareerMechanismRefinementSource = 'PATTERN';

  // @ts-expect-error - RELATIONSHIP is not a refinement source
  const invalidSource2: CareerMechanismRefinementSource = 'RELATIONSHIP';

  return validSource;
}
