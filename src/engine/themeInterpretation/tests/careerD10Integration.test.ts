import { describe, it, expect } from 'vitest';
import { calculateHoroscope } from '../../astroEngine';
import { AyanamsaType, BirthDetails } from '../../../types';
import { CareerEvidenceFamily } from '../themeInterpretationTypes';
import { CANONICAL_BIRTH_DETAILS } from '../../../test/fixtures/canonicalChart';
import { DEFAULT_BIRTH_DETAILS } from '../../../app/AppState';

const TEST_BIRTH_PROFILES: { name: string; details: BirthDetails }[] = [
  { name: 'Standard CoreAstro Test Vector', details: DEFAULT_BIRTH_DETAILS },
  {
    name: 'J2000 Astronomical Epoch',
    details: {
      name: 'J2000 Epoch',
      placeOfBirth: 'Greenwich, London, UK',
      dateTimeStr: '2000-01-01T12:00:00Z',
      timeZone: 'UTC',
      latitude: 51.4769,
      longitude: 0.0005,
      ayanamsa: AyanamsaType.LAHIRI
    }
  },
  {
    name: 'New Delhi Birth Chart',
    details: {
      name: 'Sample New Delhi',
      placeOfBirth: 'New Delhi, India',
      dateTimeStr: '1995-10-24T06:30:00Z',
      timeZone: 'Asia/Kolkata',
      latitude: 28.6139,
      longitude: 77.2090,
      ayanamsa: AyanamsaType.LAHIRI
    }
  }
];

describe('D10 Career Theme Integration - Real Birth Profiles', () => {
  it('does NOT universally produce CONFLICTS across test birth profiles', () => {
    const profiles: { name: string; details: BirthDetails }[] = [
      ...TEST_BIRTH_PROFILES,
      { name: 'Canonical Fixture Chart', details: CANONICAL_BIRTH_DETAILS }
    ];

    const results = TEST_BIRTH_PROFILES.map((profile) => {
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
