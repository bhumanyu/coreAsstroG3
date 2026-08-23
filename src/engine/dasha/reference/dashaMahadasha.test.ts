import { describe, it, expect } from 'vitest';
import {
  calculateVimshottari,
  rotateDashaSequence,
  addFractionalYears,
  MS_PER_VIMSHOTTARI_YEAR
} from '../vimshottari';
import { DASHA_REFERENCE_CASES } from './dashaReferenceCases';
import { DASHA_REFERENCE_TOLERANCES } from './dashaReferenceTolerances';
import { expectCloseToReference, expectDateCloseToReference } from './dashaReferenceAssertions';

/**
 * Task D08-F: Mahadasha Timeline Validation
 */
describe('D08-F: Mahadasha Timeline Validation', () => {
  for (const refCase of DASHA_REFERENCE_CASES) {
    describe(`${refCase.id}`, () => {
      it('validates first Mahadasha start/end, sequence rotation, continuous tiling, and 120-year cycle', () => {
        const birthDate = new Date(refCase.birth.dateTimeStr);
        const untilDate = addFractionalYears(birthDate, 120);
        const untilIso = untilDate.toISOString();

        const timeline = calculateVimshottari({
          birthDateTime: refCase.birth.dateTimeStr,
          moonSiderealLongitude: refCase.expectedMoonLongitude,
          until: untilIso
        });

        // 1. First Mahadasha properties vs expected
        const firstMd = timeline.mahadashas[0];
        expect(firstMd).toBeDefined();
        expect(firstMd.planet).toBe(refCase.expectedMahadashaLord);
        expect(firstMd.start).toBe(refCase.expectedMahadashaStart);

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

        // 2. 9-Planet Sequence Order
        const expectedSequence = rotateDashaSequence(refCase.expectedNakshatraLord);
        for (let i = 0; i < Math.min(9, timeline.mahadashas.length); i++) {
          expect(timeline.mahadashas[i].planet).toBe(expectedSequence[i % 9]);
        }

        // 3. Continuity Invariant: md[i].end === md[i+1].start
        for (let i = 0; i < timeline.mahadashas.length - 1; i++) {
          expect(timeline.mahadashas[i].end).toBe(timeline.mahadashas[i + 1].start);
        }

        // 4. Exact Tiling: Start at birth and end at until horizon
        expect(timeline.mahadashas[0].start).toBe(refCase.birth.dateTimeStr);
        expect(timeline.mahadashas[timeline.mahadashas.length - 1].end).toBe(untilIso);

        // 5. Total duration equals 120 Vimshottari years
        let totalDurationMs = 0;
        for (const md of timeline.mahadashas) {
          const startMs = new Date(md.start).getTime();
          const endMs = new Date(md.end).getTime();
          expect(endMs).toBeGreaterThan(startMs);
          totalDurationMs += (endMs - startMs);
        }

        const totalYears = totalDurationMs / MS_PER_VIMSHOTTARI_YEAR;
        expectCloseToReference(
          totalYears,
          120.0,
          DASHA_REFERENCE_TOLERANCES.dashaBalanceYears,
          `${refCase.id} total 120-year cycle duration`
        );
      });
    });
  }
});
