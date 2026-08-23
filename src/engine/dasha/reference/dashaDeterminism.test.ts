import { describe, it, expect } from 'vitest';
import { calculateVimshottari, getActiveDasha } from '../vimshottari';
import { calculateHoroscope } from '../../astroEngine';
import { CANONICAL_BIRTH_DETAILS } from '../../../test/fixtures/canonicalChart';
import { DASHA_REFERENCE_CASES } from './dashaReferenceCases';

/**
 * Task D08-J: Determinism Validation
 *
 * Asserts that calculateVimshottari and getActiveDasha produce identical deep-equal outputs
 * across repeated calls on identical inputs. Where calculateHoroscope is called, a fixed
 * asOf timestamp is passed to avoid nondeterministic runtime dependencies.
 */
describe('D08-J: Determinism Validation', () => {
  describe('calculateVimshottari Determinism across all Reference Cases', () => {
    for (const refCase of DASHA_REFERENCE_CASES) {
      it(`produces identical deep-equal timelines across consecutive calls for ${refCase.id}`, () => {
        const input = {
          birthDateTime: refCase.birth.dateTimeStr,
          moonSiderealLongitude: refCase.expectedMoonLongitude
        };

        const run1 = calculateVimshottari(input);
        const run2 = calculateVimshottari(input);

        expect(run1).toStrictEqual(run2);
      });
    }
  });

  describe('getActiveDasha Determinism across all Reference Cases with Active Targets', () => {
    const casesWithActive = DASHA_REFERENCE_CASES.filter((c) => c.expectedActiveDasha !== undefined);

    for (const refCase of casesWithActive) {
      it(`produces identical deep-equal active dasha states across consecutive calls for ${refCase.id}`, () => {
        const timeline = calculateVimshottari({
          birthDateTime: refCase.birth.dateTimeStr,
          moonSiderealLongitude: refCase.expectedMoonLongitude
        });

        const asOf = refCase.expectedActiveDasha!.asOf;
        const active1 = getActiveDasha(timeline, asOf);
        const active2 = getActiveDasha(timeline, asOf);

        expect(active1).toStrictEqual(active2);
      });
    }
  });

  describe('Horoscope Vimshottari Integration Determinism with Fixed asOf', () => {
    it('produces identical deep-equal horoscope.vimshottari across multiple executions', () => {
      const fixedAsOf = '2024-06-01T00:00:00.000Z';

      const horoscope1 = calculateHoroscope(CANONICAL_BIRTH_DETAILS, { asOf: fixedAsOf });
      const horoscope2 = calculateHoroscope(CANONICAL_BIRTH_DETAILS, { asOf: fixedAsOf });

      expect(horoscope1.vimshottari).toStrictEqual(horoscope2.vimshottari);
    });
  });
});
