import { describe, it, expect } from 'vitest';
import {
  calculateVimshottari,
  getActiveDasha,
  DASHA_YEARS,
  MS_PER_VIMSHOTTARI_YEAR,
  rotateDashaSequence,
  addFractionalYears
} from '../vimshottari';
import { Planet } from '../../../types';
import { DASHA_REFERENCE_CASES } from '../reference/dashaReferenceCases';
import { DASHA_REFERENCE_TOLERANCES } from '../reference/dashaReferenceTolerances';
import { expectCloseToReference } from '../reference/dashaReferenceAssertions';

/**
 * Task D08-C: Timeline Invariants — Sequence Rotation, Continuity & 120-Year Sum
 */
describe('Engine Invariant: Dasha Sequence Rotation, Continuity & 120-Year Cycle', () => {
  describe('120-Year Total Duration Invariant', () => {
    it('ensures DASHA_YEARS map entries for all 9 planets sum to exactly 120 years', () => {
      const planets: Planet[] = [
        Planet.KETU,
        Planet.VENUS,
        Planet.SUN,
        Planet.MOON,
        Planet.MARS,
        Planet.RAHU,
        Planet.JUPITER,
        Planet.SATURN,
        Planet.MERCURY
      ];

      const sumYears = planets.reduce((acc, p) => acc + DASHA_YEARS[p], 0);
      expect(sumYears).toBe(120);

      // Explicit individual year checks
      expect(DASHA_YEARS[Planet.KETU]).toBe(7);
      expect(DASHA_YEARS[Planet.VENUS]).toBe(20);
      expect(DASHA_YEARS[Planet.SUN]).toBe(6);
      expect(DASHA_YEARS[Planet.MOON]).toBe(10);
      expect(DASHA_YEARS[Planet.MARS]).toBe(7);
      expect(DASHA_YEARS[Planet.RAHU]).toBe(18);
      expect(DASHA_YEARS[Planet.JUPITER]).toBe(16);
      expect(DASHA_YEARS[Planet.SATURN]).toBe(19);
      expect(DASHA_YEARS[Planet.MERCURY]).toBe(17);
    });

    it('ensures full 120-year timeline spans exactly 120 years under MS_PER_VIMSHOTTARI_YEAR', () => {
      const birthIso = '2000-01-01T00:00:00.000Z';
      const birthDate = new Date(birthIso);
      const untilDate = addFractionalYears(birthDate, 120);
      const untilIso = untilDate.toISOString();

      const timeline = calculateVimshottari({
        birthDateTime: birthIso,
        moonSiderealLongitude: 0.0,
        until: untilIso
      });

      const firstMdStart = new Date(timeline.mahadashas[0].start).getTime();
      const lastMdEnd = new Date(timeline.mahadashas[timeline.mahadashas.length - 1].end).getTime();
      const totalSpanMs = lastMdEnd - firstMdStart;
      const totalSpanYears = totalSpanMs / MS_PER_VIMSHOTTARI_YEAR;

      expectCloseToReference(
        totalSpanYears,
        120.0,
        DASHA_REFERENCE_TOLERANCES.dashaBalanceYears,
        'Full timeline duration in years'
      );
    });
  });

  describe('Mahadasha Sequence Rotation from Birth Nakshatra Lord', () => {
    for (const refCase of DASHA_REFERENCE_CASES) {
      it(`rotates 9 Mahadashas starting with nakshatra lord for ${refCase.id}`, () => {
        const birthDate = new Date(refCase.birth.dateTimeStr);
        const untilDate = addFractionalYears(birthDate, 120);

        const timeline = calculateVimshottari({
          birthDateTime: refCase.birth.dateTimeStr,
          moonSiderealLongitude: refCase.expectedMoonLongitude,
          until: untilDate.toISOString()
        });

        const expectedOrder = rotateDashaSequence(refCase.expectedNakshatraLord);
        const actualOrder = timeline.mahadashas.slice(0, 9).map((md) => md.planet);

        expect(actualOrder).toStrictEqual(expectedOrder);
      });
    }
  });

  describe('Mahadasha Continuity (mahadashas[i].end === mahadashas[i+1].start)', () => {
    for (const refCase of DASHA_REFERENCE_CASES) {
      it(`verifies gapless contiguous Mahadashas for ${refCase.id}`, () => {
        const birthDate = new Date(refCase.birth.dateTimeStr);
        const untilDate = addFractionalYears(birthDate, 120);

        const timeline = calculateVimshottari({
          birthDateTime: refCase.birth.dateTimeStr,
          moonSiderealLongitude: refCase.expectedMoonLongitude,
          until: untilDate.toISOString()
        });

        for (let i = 0; i < timeline.mahadashas.length - 1; i++) {
          const currentMd = timeline.mahadashas[i];
          const nextMd = timeline.mahadashas[i + 1];
          expect(currentMd.end).toBe(nextMd.start);
        }
      });
    }
  });

  describe('Antardasha Sequence Order and Continuity within Mahadashas', () => {
    it('verifies AD sequence order and continuity within each Mahadasha', () => {
      const timeline = calculateVimshottari({
        birthDateTime: '2000-01-01T00:00:00.000Z',
        moonSiderealLongitude: 0.0
      });

      for (const md of timeline.mahadashas) {
        expect(md.antardashas.length).toBe(9);

        // First AD starts at MD start
        expect(md.antardashas[0].start).toBe(md.start);
        // Last AD ends at MD end
        expect(md.antardashas[md.antardashas.length - 1].end).toBe(md.end);

        // Expected AD order rotated from MD lord
        const expectedAdOrder = rotateDashaSequence(md.planet);
        const actualAdOrder = md.antardashas.map((ad) => ad.planet);
        expect(actualAdOrder).toStrictEqual(expectedAdOrder);

        // Gapless continuity between consecutive ADs
        for (let i = 0; i < md.antardashas.length - 1; i++) {
          expect(md.antardashas[i].end).toBe(md.antardashas[i + 1].start);
        }
      }
    });
  });

  describe('Pratyantardasha Sequence Order and Continuity within Antardashas', () => {
    it('verifies PD sequence order and continuity within Antardashas', () => {
      const timeline = calculateVimshottari({
        birthDateTime: '2000-01-01T00:00:00.000Z',
        moonSiderealLongitude: 0.0
      });

      const firstMd = timeline.mahadashas[0];
      for (const ad of firstMd.antardashas) {
        expect(ad.pratyantardashas.length).toBe(9);

        // First PD starts at AD start
        expect(ad.pratyantardashas[0].start).toBe(ad.start);
        // Last PD ends at AD end
        expect(ad.pratyantardashas[ad.pratyantardashas.length - 1].end).toBe(ad.end);

        // Expected PD order rotated from AD lord
        const expectedPdOrder = rotateDashaSequence(ad.planet);
        const actualPdOrder = ad.pratyantardashas.map((pd) => pd.planet);
        expect(actualPdOrder).toStrictEqual(expectedPdOrder);

        // Gapless continuity between consecutive PDs
        for (let i = 0; i < ad.pratyantardashas.length - 1; i++) {
          expect(ad.pratyantardashas[i].end).toBe(ad.pratyantardashas[i + 1].start);
        }
      }
    });
  });

  describe('Engine Internal Consistency: Boundary Transitions (Engine-vs-Itself)', () => {
    it('asserts getActiveDasha(timeline, firstMd.end) transitions to second Mahadasha', () => {
      const timeline = calculateVimshottari({
        birthDateTime: '1990-01-01T00:00:00.000Z',
        moonSiderealLongitude: 20.0
      });

      const firstMd = timeline.mahadashas[0];
      const secondMd = timeline.mahadashas[1];

      // Querying at firstMd.end transitions immediately to secondMd
      const activeAtEnd = getActiveDasha(timeline, firstMd.end);
      expect(activeAtEnd).not.toBeNull();
      expect(activeAtEnd!.mahadasha.planet).toBe(secondMd.planet);
    });
  });
});
