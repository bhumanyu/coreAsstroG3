import { describe, it, expect } from 'vitest';
import {
  calculateVimshottari,
  rotateDashaSequence,
  MS_PER_VIMSHOTTARI_YEAR
} from '../vimshottari';
import { DASHA_REFERENCE_CASES } from './dashaReferenceCases';
import { DASHA_REFERENCE_TOLERANCES } from './dashaReferenceTolerances';
import { expectDateCloseToReference } from './dashaReferenceAssertions';

/**
 * Task D08-F: Mahadasha Reference Case Timeline Validation
 *
 * Validates reference cases against expected first Mahadasha lord, start, and end dates,
 * verifies Mahadasha counts and sequence rotation for 120-year horizon runs,
 * and validates boundary convergence against an independently-constructed 120-year horizon.
 */
describe('D08-F: Mahadasha Reference Timeline Validation', () => {
  for (const refCase of DASHA_REFERENCE_CASES) {
    describe(`${refCase.id}`, () => {
      it('validates first Mahadasha lord, start, and end dates against reference expectations', () => {
        const birthDate = new Date(refCase.birth.dateTimeStr);
        const independentHorizonMs = birthDate.getTime() + 120 * MS_PER_VIMSHOTTARI_YEAR;
        const independentUntilIso = new Date(independentHorizonMs).toISOString();

        const timeline = calculateVimshottari({
          birthDateTime: refCase.birth.dateTimeStr,
          moonSiderealLongitude: refCase.expectedMoonLongitude,
          until: independentUntilIso
        });

        // 1. First Mahadasha lord
        const firstMd = timeline.mahadashas[0];
        expect(firstMd).toBeDefined();
        expect(firstMd.planet).toBe(refCase.expectedMahadashaLord);

        // 2. Start date matches birth
        expect(firstMd.start).toBe(refCase.expectedMahadashaStart);

        // 3. End date matches expected end date within tolerance
        expectDateCloseToReference(
          firstMd.end,
          refCase.expectedMahadashaEnd,
          DASHA_REFERENCE_TOLERANCES.boundaryMilliseconds,
          {
            caseId: refCase.id,
            label: 'firstMahadashaEnd',
            moonLongitude: refCase.expectedMoonLongitude,
            nakshatra: refCase.expectedNakshatra,
            lord: refCase.expectedNakshatraLord,
            remainingFraction: refCase.expectedNakshatraRemaining
          }
        );
      });

      it('validates 120-year horizon run: Mahadasha count (9 for full balance, 10 for partial), rotated sequence, and independent horizon end', () => {
        const birthDate = new Date(refCase.birth.dateTimeStr);
        // Independent horizon constructed from documented convention (120 * MS_PER_VIMSHOTTARI_YEAR)
        const independentHorizonMs = birthDate.getTime() + 120 * MS_PER_VIMSHOTTARI_YEAR;
        const independentUntilIso = new Date(independentHorizonMs).toISOString();

        const timeline = calculateVimshottari({
          birthDateTime: refCase.birth.dateTimeStr,
          moonSiderealLongitude: refCase.expectedMoonLongitude,
          until: independentUntilIso
        });

        // Exact Mahadasha count over 120-year horizon:
        // - Exactly 9 Mahadashas if birth balance is 100% (remaining === 1.0)
        // - Exactly 10 Mahadashas if birth balance is partial (remaining < 1.0, wraps around to complete 120y)
        const expectedMdCount = refCase.expectedNakshatraRemaining === 1.0 ? 9 : 10;
        expect(timeline.mahadashas).toHaveLength(expectedMdCount);

        // Verify sequence rotation starting from birth nakshatra lord across all 9 planets
        const expectedSequence = rotateDashaSequence(refCase.expectedMahadashaLord);
        for (let i = 0; i < 9; i++) {
          expect(timeline.mahadashas[i].planet).toBe(expectedSequence[i]);
        }

        // If partial balance wrapped around to a 10th Mahadasha, its lord must be the initial lord
        if (expectedMdCount === 10) {
          expect(timeline.mahadashas[9].planet).toBe(expectedSequence[0]);
        }

        // Reduce circularity: assert last MD end matches independent horizon instant within tolerance (Task 5)
        const lastMd = timeline.mahadashas[timeline.mahadashas.length - 1];
        expectDateCloseToReference(
          lastMd.end,
          independentUntilIso,
          DASHA_REFERENCE_TOLERANCES.boundaryMilliseconds,
          {
            caseId: refCase.id,
            label: 'lastMahadashaEndVs120YearHorizon',
            moonLongitude: refCase.expectedMoonLongitude,
            nakshatra: refCase.expectedNakshatra,
            lord: refCase.expectedNakshatraLord,
            remainingFraction: refCase.expectedNakshatraRemaining
          }
        );
      });
    });
  }
});
