import { describe, it, expect } from 'vitest';
import {
  calculateVimshottari,
  addFractionalYears
} from '../vimshottari';
import { DASHA_REFERENCE_CASES } from './dashaReferenceCases';
import { DASHA_REFERENCE_TOLERANCES } from './dashaReferenceTolerances';
import { expectDateCloseToReference } from './dashaReferenceAssertions';

/**
 * Task D08-F: Mahadasha Reference Case Timeline Validation
 *
 * Validates reference cases against expected first Mahadasha lord, start, and end dates.
 */
describe('D08-F: Mahadasha Reference Timeline Validation', () => {
  for (const refCase of DASHA_REFERENCE_CASES) {
    describe(`${refCase.id}`, () => {
      it('validates first Mahadasha lord, start, and end dates against reference expectations', () => {
        const birthDate = new Date(refCase.birth.dateTimeStr);
        const untilDate = addFractionalYears(birthDate, 120);
        const untilIso = untilDate.toISOString();

        const timeline = calculateVimshottari({
          birthDateTime: refCase.birth.dateTimeStr,
          moonSiderealLongitude: refCase.expectedMoonLongitude,
          until: untilIso
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
    });
  }
});
