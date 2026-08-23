import { describe, it, expect } from 'vitest';
import {
  calculateVimshottari,
  getActiveDasha,
  DASHA_YEARS,
  MS_PER_VIMSHOTTARI_YEAR
} from '../vimshottari';
import { Planet } from '../../../types';
import { DASHA_REFERENCE_CASES } from './dashaReferenceCases';
import { DASHA_REFERENCE_TOLERANCES } from './dashaReferenceTolerances';
import { expectCloseToReference } from './dashaReferenceAssertions';

/**
 * Task D08-G & D08-H: Reference Sub-Period and Active Dasha Validation
 *
 * Validates independently-sourced expected active MD/AD/PD periods at specific reference instants
 * and mathematical duration scaling of sub-periods against analytical reference formulas.
 */
describe('D08-G & D08-H: Reference Active Dasha & Sub-Period Validation', () => {
  describe('Active MD/AD/PD for Authoritative Reference Cases', () => {
    const casesWithActive = DASHA_REFERENCE_CASES.filter((c) => c.expectedActiveDasha !== undefined);

    it('ensures at least 5 reference cases validate full active MD/AD/PD triples', () => {
      expect(casesWithActive.length).toBeGreaterThanOrEqual(5);
    });

    for (const refCase of casesWithActive) {
      it(`evaluates expected active MD/AD/PD for ${refCase.id} at ${refCase.expectedActiveDasha!.asOf}`, () => {
        const timeline = calculateVimshottari({
          birthDateTime: refCase.birth.dateTimeStr,
          moonSiderealLongitude: refCase.expectedMoonLongitude
        });

        const active = getActiveDasha(timeline, refCase.expectedActiveDasha!.asOf);
        expect(active).not.toBeNull();

        expect(active!.mahadasha.planet).toBe(refCase.expectedActiveDasha!.mahadasha);
        expect(active!.antardasha.planet).toBe(refCase.expectedActiveDasha!.antardasha);
        expect(active!.pratyantardasha.planet).toBe(refCase.expectedActiveDasha!.pratyantardasha);
      });
    }
  });

  describe('Independent Mathematical Duration Scaling for Standard Mahadasha', () => {
    it('validates analytical duration of Venus-Venus AD in a full 20-year Venus Mahadasha', () => {
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

    it('validates analytical duration of Sun-Moon AD in a full 6-year Sun Mahadasha', () => {
      // 0° Krittika = start of Sun MD (26.666666666666668°) -> full 6-year Sun MD
      const timeline = calculateVimshottari({
        birthDateTime: '2000-01-01T00:00:00.000Z',
        moonSiderealLongitude: 80 / 3
      });

      const sunMd = timeline.mahadashas[0];
      expect(sunMd.planet).toBe(Planet.SUN);

      // Sun-Moon AD is 2nd AD in Sun MD. Duration = 6 * (10/120) = 0.5 years (6 months = 182.625 days)
      expect(sunMd.antardashas.length).toBe(9);
      const sunMoonAd = sunMd.antardashas[1];
      expect(sunMoonAd.planet).toBe(Planet.MOON);

      const expectedAdDurationYears = 6 * (DASHA_YEARS[Planet.MOON] / 120); // 0.5 years
      const adDurationMs = new Date(sunMoonAd.end).getTime() - new Date(sunMoonAd.start).getTime();
      const adDurationYears = adDurationMs / MS_PER_VIMSHOTTARI_YEAR;

      expectCloseToReference(
        adDurationYears,
        expectedAdDurationYears,
        DASHA_REFERENCE_TOLERANCES.dashaBalanceYears,
        'Sun-Moon AD duration in years'
      );
    });
  });
});
