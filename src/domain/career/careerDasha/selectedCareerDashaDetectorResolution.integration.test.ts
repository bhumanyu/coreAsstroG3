/**
 * PBA-04 Part 3: Real detector→qualification→resolution integration test
 *
 * This integration test uses the REAL detector, qualification registry, and resolver
 * for a controlled chart fixture (Jupiter-Ketu chart).
 *
 * Asserts the observed state at each stage against the documented investigation in
 * docs/product/period-based-career-wealth/PBA-01-FEATURE-CONTRACT-AND-SOURCE-AUDIT.md section 8.1:
 * - Detection yields exactly the CAREER_HOUSE_NETWORK pattern with houses [6,8,11]
 * - Qualification is UNQUALIFIED because Jupiter has fully assessed weak condition
 * - Fully assessed weak planetary condition makes the pattern UNQUALIFIED
 * - Resolution observes 0 mechanism candidates after the qualification gate (INFO diagnostic)
 *
 * This test asserts the qualification gate end state, not that a career mechanism exists.
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
  it('asserts current qualification gating for the Jupiter-Ketu chart', async () => {
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

    // Stage 4: A fully assessed weak Jupiter condition is a known disqualifier.
    expect(canonicalCareerFoundation.patternQualifications).toHaveLength(1);
    const qualification = canonicalCareerFoundation.patternQualifications[0];
    expect(qualification.status).toBe('UNQUALIFIED');

    // Stage 5: Assert resolution observes 0 candidates under the currently implemented rules
    expect(canonicalCareerFoundation.resolvedMechanisms).toHaveLength(0);
    const qualificationDiagnostic = canonicalCareerFoundation.diagnostics.find(
      d => d.diagnosticId === 'ORCHESTRATION_UNQUALIFIED_PATTERN_MECHANISM_' + pattern.patternId
    );
    expect(qualificationDiagnostic).toBeDefined();
    expect(qualificationDiagnostic?.severity).toBe('INFO');
    expect(qualificationDiagnostic?.category).toBe('GATING');
    expect(qualificationDiagnostic?.message).toContain('UNQUALIFIED - skipping mechanism resolution');
    expect(qualificationDiagnostic?.message).toContain('CAREER_HOUSE_NETWORK');
    expect(qualificationDiagnostic?.message).toContain('HOUSES:6,8,11');
  });
});
