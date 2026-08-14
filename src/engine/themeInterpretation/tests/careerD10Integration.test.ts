import { describe, it, expect } from 'vitest';
import { calculateHoroscope } from '../../astroEngine';
import { AyanamsaType, BirthDetails } from '../../../types';
import { CareerEvidenceFamily } from '../themeInterpretationTypes';
import { PRESET_PROFILES } from '../../../components/BirthFormModal';
import { CANONICAL_BIRTH_DETAILS } from '../../../test/fixtures/canonicalChart';

describe('D10 Career Theme Integration - Real Preset Charts', () => {
  it('does NOT universally produce CONFLICTS across preset birth profiles', () => {
    const profiles: { name: string; details: BirthDetails }[] = [
      ...PRESET_PROFILES.map((p) => ({ name: p.name, details: p.details })),
      { name: 'Canonical Fixture Chart', details: CANONICAL_BIRTH_DETAILS }
    ];

    const results = PRESET_PROFILES.map((profile) => {
      const horoscope = calculateHoroscope(profile.details);
      const careerTheme = horoscope.themeInterpretationV2?.career;
      const d10Evidence = careerTheme?.evidence.find(
        (e) => e.evidenceFamily === CareerEvidenceFamily.D10
      );
      const rel = d10Evidence?.vargaEvidence?.relationship ?? careerTheme?.metadata.vargaConfirmationStatus;
      return {
        name: profile.name,
        d10Evidence,
        relationship: rel,
        effect: d10Evidence?.effect
      };
    });

    // Assert that the relationship is NOT universally CONFLICTS across all profiles
    const relationships = results
      .map((r) => r.relationship)
      .filter((r): r is NonNullable<typeof r> => Boolean(r && r !== 'UNAVAILABLE'));

    expect(relationships.length).toBeGreaterThan(0);
    const hasNonConflictingResult = relationships.some(
      (rel) => rel === 'CONFIRMS' || rel === 'PARTIALLY_CONFIRMS' || rel === 'MODIFIES'
    );
    expect(hasNonConflictingResult).toBe(true);

    const conflictingCount = relationships.filter((rel) => rel === 'CONFLICTS').length;
    expect(conflictingCount).toBeLessThan(relationships.length);
  });

  it('populates D10 evaluation diagnostics on real chart calculations', () => {
    const horoscope = calculateHoroscope(CANONICAL_BIRTH_DETAILS);
    const careerTheme = horoscope.themeInterpretationV2?.career;
    const d10Evidence = careerTheme?.evidence.find(
      (e) => e.evidenceFamily === CareerEvidenceFamily.D10
    );

    expect(d10Evidence).toBeDefined();
    expect(d10Evidence?.vargaEvidence).toBeDefined();
    expect(d10Evidence?.vargaEvidence?.diagnostics).toBeDefined();

    const diagnostics = d10Evidence?.vargaEvidence?.diagnostics;
    expect(diagnostics?.natal10Lord).toBeDefined();
    expect(diagnostics?.d10Lord).toBeDefined();
    expect(Array.isArray(diagnostics?.d10SupportFactors)).toBe(true);
    expect(Array.isArray(diagnostics?.d10ChallengeFactors)).toBe(true);
  });
});
