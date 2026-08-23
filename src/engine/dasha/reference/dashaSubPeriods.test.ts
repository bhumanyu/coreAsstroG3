import { describe, it, expect } from 'vitest';
import {
  calculateVimshottari,
  rotateDashaSequence,
  DASHA_YEARS,
  MS_PER_VIMSHOTTARI_YEAR
} from '../vimshottari';
import { Planet } from '../../../types';
import { DASHA_REFERENCE_CASES } from './dashaReferenceCases';
import { DASHA_REFERENCE_TOLERANCES } from './dashaReferenceTolerances';
import { expectCloseToReference, expectDateCloseToReference } from './dashaReferenceAssertions';

/**
 * Task D08-G: Antardasha (AD) and Pratyantardasha (PD) Sub-Period Validation
 */
describe('D08-G: Antardasha & Pratyantardasha Sub-Periods Validation', () => {
  for (const refCase of DASHA_REFERENCE_CASES) {
    describe(`Sub-periods for ${refCase.id}`, () => {
      it('validates Antardasha sequence, boundaries, and continuity within Mahadashas', () => {
        const timeline = calculateVimshottari({
          birthDateTime: refCase.birth.dateTimeStr,
          moonSiderealLongitude: refCase.expectedMoonLongitude
        });

        for (const md of timeline.mahadashas) {
          expect(md.antardashas.length).toBeGreaterThan(0);
          expect(md.antardashas.length).toBeLessThanOrEqual(9);

          const expectedAdOrder = rotateDashaSequence(md.planet);
          for (let i = 0; i < md.antardashas.length; i++) {
            expect(md.antardashas[i].planet).toBe(expectedAdOrder[i]);
          }

          // AD boundary continuity invariants
          expect(md.antardashas[0].start).toBe(md.start);
          expect(md.antardashas[md.antardashas.length - 1].end).toBe(md.end);

          for (let i = 0; i < md.antardashas.length - 1; i++) {
            expect(md.antardashas[i].end).toBe(md.antardashas[i + 1].start);
          }
        }
      });

      it('validates Pratyantardasha sequence, boundaries, and continuity within Antardashas', () => {
        const timeline = calculateVimshottari({
          birthDateTime: refCase.birth.dateTimeStr,
          moonSiderealLongitude: refCase.expectedMoonLongitude
        });

        for (const md of timeline.mahadashas) {
          for (const ad of md.antardashas) {
            expect(ad.pratyantardashas.length).toBeGreaterThan(0);
            expect(ad.pratyantardashas.length).toBeLessThanOrEqual(9);

            const expectedPdOrder = rotateDashaSequence(ad.planet);
            for (let i = 0; i < ad.pratyantardashas.length; i++) {
              expect(ad.pratyantardashas[i].planet).toBe(expectedPdOrder[i]);
            }

            // PD boundary continuity invariants
            expect(ad.pratyantardashas[0].start).toBe(ad.start);
            expect(ad.pratyantardashas[ad.pratyantardashas.length - 1].end).toBe(ad.end);

            for (let i = 0; i < ad.pratyantardashas.length - 1; i++) {
              expect(ad.pratyantardashas[i].end).toBe(ad.pratyantardashas[i + 1].start);
            }
          }
        }
      });
    });
  }

  describe('Representative Analytical Sub-Period Values for Standard Full-Length Mahadasha', () => {
    it('validates exact mathematical duration of Venus-Venus AD in a full 20-year Venus Mahadasha', () => {
      // 0° Bharani = start of Venus MD (13.333333333333334°) -> full 20-year Venus MD
      const timeline = calculateVimshottari({
        birthDateTime: '2000-01-01T00:00:00.000Z',
        moonSiderealLongitude: 40 / 3
      });

      const venusMd = timeline.mahadashas[0];
      expect(venusMd.planet).toBe(Planet.VENUS);

      // Venus-Venus AD duration = 20 * (20/120) = 3.3333333333 years
      const venusVenusAd = venusMd.antardashas[0];
      expect(venusVenusAd.planet).toBe(Planet.VENUS);
      expect(venusVenusAd.start).toBe('2000-01-01T00:00:00.000Z');

      const expectedAdDurationYears = 20 * (DASHA_YEARS[Planet.VENUS] / 120); // 3.3333333333 years
      const adDurationMs = new Date(venusVenusAd.end).getTime() - new Date(venusVenusAd.start).getTime();
      const adDurationYears = adDurationMs / MS_PER_VIMSHOTTARI_YEAR;

      expectCloseToReference(
        adDurationYears,
        expectedAdDurationYears,
        DASHA_REFERENCE_TOLERANCES.dashaBalanceYears,
        'Venus-Venus AD duration in years'
      );

      // Venus-Venus-Venus PD duration = (20 * (20/120)) * (20/120) = 20 * 400 / 14400 = 0.5555555556 years
      const venusVenusVenusPd = venusVenusAd.pratyantardashas[0];
      expect(venusVenusVenusPd.planet).toBe(Planet.VENUS);
      expect(venusVenusVenusPd.start).toBe(venusVenusAd.start);

      const expectedPdDurationYears = expectedAdDurationYears * (DASHA_YEARS[Planet.VENUS] / 120);
      const pdDurationMs = new Date(venusVenusVenusPd.end).getTime() - new Date(venusVenusVenusPd.start).getTime();
      const pdDurationYears = pdDurationMs / MS_PER_VIMSHOTTARI_YEAR;

      expectCloseToReference(
        pdDurationYears,
        expectedPdDurationYears,
        DASHA_REFERENCE_TOLERANCES.dashaBalanceYears,
        'Venus-Venus-Venus PD duration in years'
      );
    });
  });
});
