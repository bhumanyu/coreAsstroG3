import { describe, it, expect } from 'vitest';
import { DASHA_REFERENCE_CASES } from './dashaReferenceCases';
import { MOON_ANCHOR_REFERENCE_CASES } from './moonAnchorReferenceCases';
import { DashaReferenceSourceType } from './dashaReferenceTypes';

/**
 * Task D08 Fixture-Integrity Validation Test (Review Point 10)
 *
 * Validates reference source discriminator types, non-empty mandatory metadata,
 * external ephemeris versioning/url specifications, and guards against ambiguous multi-system names.
 */
describe('Reference Source Fixture Integrity Validation', () => {
  const VALID_SOURCE_TYPES: readonly DashaReferenceSourceType[] = Object.freeze([
    'MATHEMATICAL_ANALYTICAL',
    'EXTERNAL_EPHEMERIS'
  ]);

  const allFixtures: Array<{
    readonly id: string;
    readonly source: {
      readonly type: DashaReferenceSourceType;
      readonly name: string;
      readonly methodology: string;
      readonly zodiac: 'SIDEREAL' | 'TROPICAL';
      readonly ayanamsa: string;
      readonly timezone: string;
      readonly dateConvention: string;
      readonly version?: string;
      readonly url?: string;
    };
  }> = [
    ...DASHA_REFERENCE_CASES.map(c => ({ id: c.id, source: c.source })),
    ...MOON_ANCHOR_REFERENCE_CASES.map(c => ({ id: c.id, source: c.source }))
  ];

  it('validates that fixtures collection is populated', () => {
    expect(allFixtures.length).toBeGreaterThanOrEqual(12);
  });

  for (const { id, source } of allFixtures) {
    describe(`Integrity checks for fixture ${id}`, () => {
      it('has source.type as one of the valid discriminator enum values', () => {
        expect(VALID_SOURCE_TYPES).toContain(source.type);
      });

      it('has non-empty mandatory source metadata (methodology, zodiac, ayanamsa, timezone, dateConvention)', () => {
        expect(source.name).toBeDefined();
        expect(source.name.trim().length).toBeGreaterThan(0);

        expect(source.methodology).toBeDefined();
        expect(source.methodology.trim().length).toBeGreaterThan(0);

        expect(source.zodiac).toBeDefined();
        expect(['SIDEREAL', 'TROPICAL']).toContain(source.zodiac);

        expect(source.ayanamsa).toBeDefined();
        expect(source.ayanamsa.trim().length).toBeGreaterThan(0);

        expect(source.timezone).toBeDefined();
        expect(source.timezone.trim().length).toBeGreaterThan(0);

        expect(source.dateConvention).toBeDefined();
        expect(source.dateConvention.trim().length).toBeGreaterThan(0);
      });

      if (source.type === 'EXTERNAL_EPHEMERIS') {
        it('requires version and url for EXTERNAL_EPHEMERIS and rejects ambiguous multi-system names with "/"', () => {
          expect(source.version).toBeDefined();
          expect(source.version!.trim().length).toBeGreaterThan(0);

          expect(source.url).toBeDefined();
          expect(source.url!.trim().length).toBeGreaterThan(0);
          expect(source.url).toMatch(/^https?:\/\//);

          // Guard against ambiguous combined names like "Swiss Ephemeris / JPL Horizons"
          expect(source.name).not.toContain('/');
          expect(source.name.toLowerCase()).not.toContain(' / ');
        });
      }
    });
  }
});
