/**
 * PBA-04 Part 3: Real detector→qualification→resolution integration test
 *
 * This integration test uses the REAL detector, qualification registry, and resolver
 * for a controlled chart fixture (Jupiter-Ketu chart).
 *
 * Asserts the observed state at each stage against the documented investigation in
 * docs/product/period-based-career-wealth/PBA-01-FEATURE-CONTRACT-AND-SOURCE-AUDIT.md section 8.1:
 * - Detection yields exactly the CAREER_HOUSE_NETWORK pattern with houses [6,8,11]
 * - Qualification is INSUFFICIENT_DATA (not UNQUALIFIED)
 * - Resolution yields 0 mechanism candidates under the currently implemented resolver rules (coverage-gap INFO diagnostic)
 *
 * This test asserts the genuine empty-coverage end state, not that a career mechanism exists.
 */

import { describe, it, expect } from 'vitest';
import {
  calculateHoroscope
} from '../../../engine/astroEngine';

import {
  CANONICAL_BIRTH_DETAILS
} from '../../../test/fixtures/canonicalChart';

import {
  buildCanonicalCareerFoundation
} from '../orchestration/canonicalCareerFoundationBuilder';

describe('PBA-04 Part 3: Real integration test (detector→qualification→resolution)', () => {
  it('asserts detector→qualification→resolution state for Jupiter-Ketu chart per PBA-01 section 8.1 investigation', async () => {
    // Stage 1: Use the real CANONICAL_BIRTH_DETAILS horoscope
    const horoscope = await calculateHoroscope(CANONICAL_BIRTH_DETAILS);

    // Stage 2: Build the canonical career foundation (REAL detector→qualification→resolution)
    const canonicalCareerFoundation = buildCanonicalCareerFoundation({
      horoscope,
      enableDispositorContexts: false // Production default
    });

    // Stage 3: Assert detection yields exactly CAREER_HOUSE_NETWORK pattern with houses [6,8,11]
    expect(canonicalCareerFoundation.patternCandidates).toHaveLength(1);
    const pattern = canonicalCareerFoundation.patternCandidates[0];
    expect(pattern.classification).toBe('CAREER_HOUSE_NETWORK');
    expect(pattern.sourcePattern.houses).toEqual([6, 8, 11]);

    // Stage 4: Assert qualification is INSUFFICIENT_DATA (not UNQUALIFIED)
    expect(canonicalCareerFoundation.patternQualifications).toHaveLength(1);
    const qualification = canonicalCareerFoundation.patternQualifications[0];
    expect(qualification.status).toBe('INSUFFICIENT_DATA');

    // Stage 5: Assert resolution yields 0 candidates with coverage-gap diagnostic
    expect(canonicalCareerFoundation.resolvedMechanisms).toHaveLength(0);
    const coverageGapDiagnostic = canonicalCareerFoundation.diagnostics.find(
      d => d.diagnosticId === 'ORCHESTRATION_NO_MECHANISM_RULE_MATCHED_' + pattern.patternId
    );
    expect(coverageGapDiagnostic).toBeDefined();
    expect(coverageGapDiagnostic?.severity).toBe('INFO');
    expect(coverageGapDiagnostic?.category).toBe('GATING');
    expect(coverageGapDiagnostic?.message).toContain('Canonical career inputs produced no mechanism candidates');
    expect(coverageGapDiagnostic?.message).toContain('CAREER_HOUSE_NETWORK');
    expect(coverageGapDiagnostic?.message).toContain('houses [6, 8, 11]');
  });
});
