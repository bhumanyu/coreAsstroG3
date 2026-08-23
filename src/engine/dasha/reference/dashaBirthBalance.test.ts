import { describe, it, expect } from 'vitest';
import { calculateVimshottari, MS_PER_VIMSHOTTARI_YEAR } from '../vimshottari';
import { DASHA_REFERENCE_CASES } from './dashaReferenceCases';
import { DASHA_REFERENCE_TOLERANCES } from './dashaReferenceTolerances';
import { expectCloseToReference } from './dashaReferenceAssertions';

/**
 * Task D08-E: Nakshatra Progress and Birth Dasha Balance Validation
 */
describe('D08-E: Nakshatra Progress & Birth Balance Validation', () => {
  for (const refCase of DASHA_REFERENCE_CASES) {
    describe(`${refCase.id} (${refCase.expectedNakshatra} / ${refCase.expectedNakshatraLord})`, () => {
      it('calculates exact nakshatra, lord, progress, remaining fraction, and balance years', () => {
        const timeline = calculateVimshottari({
          birthDateTime: refCase.birth.dateTimeStr,
          moonSiderealLongitude: refCase.expectedMoonLongitude
        });

        // 1. Nakshatra name
        expect(timeline.nakshatra).toBe(refCase.expectedNakshatra);

        // 2. Nakshatra lord
        expect(timeline.nakshatraLord).toBe(refCase.expectedNakshatraLord);

        // 3. Nakshatra progress fraction (0..1)
        expectCloseToReference(
          timeline.nakshatraProgress,
          refCase.expectedNakshatraProgress,
          DASHA_REFERENCE_TOLERANCES.nakshatraProgress,
          `${refCase.id} nakshatraProgress`
        );

        // 4. Nakshatra remaining fraction (0..1)
        expectCloseToReference(
          timeline.remainingFraction,
          refCase.expectedNakshatraRemaining,
          DASHA_REFERENCE_TOLERANCES.nakshatraProgress,
          `${refCase.id} remainingFraction`
        );

        // Invariant: progress + remaining === 1
        expectCloseToReference(
          timeline.nakshatraProgress + timeline.remainingFraction,
          1.0,
          DASHA_REFERENCE_TOLERANCES.nakshatraProgress,
          `${refCase.id} progress + remaining sum`
        );

        // 5. First Mahadasha balance duration in years
        expect(timeline.mahadashas.length).toBeGreaterThan(0);
        const firstMd = timeline.mahadashas[0];
        expect(firstMd.planet).toBe(refCase.expectedMahadashaLord);

        const firstMdDurationMs = new Date(firstMd.end).getTime() - new Date(firstMd.start).getTime();
        const firstMdDurationYears = firstMdDurationMs / MS_PER_VIMSHOTTARI_YEAR;

        expectCloseToReference(
          firstMdDurationYears,
          refCase.expectedBirthDashaBalanceYears,
          DASHA_REFERENCE_TOLERANCES.dashaBalanceYears,
          `${refCase.id} birthDashaBalanceYears`
        );
      });
    });
  }
});
