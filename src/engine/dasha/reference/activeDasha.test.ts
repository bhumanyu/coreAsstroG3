import { describe, it, expect } from 'vitest';
import { calculateVimshottari, getActiveDasha } from '../vimshottari';
import { DASHA_REFERENCE_CASES } from './dashaReferenceCases';

/**
 * Task D08-H: Active Dasha and Boundary Interval Semantics Validation
 */
describe('D08-H: Active Dasha & Half-Open [start, end) Boundary Validation', () => {
  describe('Active Dasha for Specified Reference Points', () => {
    const casesWithActive = DASHA_REFERENCE_CASES.filter((c) => c.expectedActiveDasha !== undefined);

    for (const refCase of casesWithActive) {
      it(`evaluates active MD/AD/PD correctly for ${refCase.id} at ${refCase.expectedActiveDasha!.asOf}`, () => {
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

  describe('Half-Open [start, end) Boundary Semantics (boundary-1ms, boundary, boundary+1ms)', () => {
    it('switches to the next period at the exact boundary millisecond for Mahadasha transitions', () => {
      const timeline = calculateVimshottari({
        birthDateTime: '2000-01-01T00:00:00.000Z',
        moonSiderealLongitude: 0.0 // Ashwini: Ketu MD starts at 2000-01-01
      });

      expect(timeline.mahadashas.length).toBeGreaterThan(1);
      const firstMd = timeline.mahadashas[0];
      const secondMd = timeline.mahadashas[1];

      const boundaryMs = new Date(firstMd.end).getTime();

      // 1. Instant boundary - 1ms: First MD must be active
      const beforeBoundary = new Date(boundaryMs - 1).toISOString();
      const activeBefore = getActiveDasha(timeline, beforeBoundary);
      expect(activeBefore).not.toBeNull();
      expect(activeBefore!.mahadasha.planet).toBe(firstMd.planet);

      // 2. Exact boundary instant: Second MD must be active (half-open [start, end))
      const exactBoundary = new Date(boundaryMs).toISOString();
      const activeExact = getActiveDasha(timeline, exactBoundary);
      expect(activeExact).not.toBeNull();
      expect(activeExact!.mahadasha.planet).toBe(secondMd.planet);

      // 3. Instant boundary + 1ms: Second MD must be active
      const afterBoundary = new Date(boundaryMs + 1).toISOString();
      const activeAfter = getActiveDasha(timeline, afterBoundary);
      expect(activeAfter).not.toBeNull();
      expect(activeAfter!.mahadasha.planet).toBe(secondMd.planet);
    });

    it('switches to the next period at the exact boundary millisecond for Antardasha transitions', () => {
      const timeline = calculateVimshottari({
        birthDateTime: '2000-01-01T00:00:00.000Z',
        moonSiderealLongitude: 0.0
      });

      const firstMd = timeline.mahadashas[0];
      expect(firstMd.antardashas.length).toBeGreaterThan(1);
      const firstAd = firstMd.antardashas[0];
      const secondAd = firstMd.antardashas[1];

      const boundaryMs = new Date(firstAd.end).getTime();

      // Prior instant
      const activeBefore = getActiveDasha(timeline, new Date(boundaryMs - 1).toISOString());
      expect(activeBefore).not.toBeNull();
      expect(activeBefore!.antardasha.planet).toBe(firstAd.planet);

      // Exact boundary instant
      const activeExact = getActiveDasha(timeline, new Date(boundaryMs).toISOString());
      expect(activeExact).not.toBeNull();
      expect(activeExact!.antardasha.planet).toBe(secondAd.planet);

      // After instant
      const activeAfter = getActiveDasha(timeline, new Date(boundaryMs + 1).toISOString());
      expect(activeAfter).not.toBeNull();
      expect(activeAfter!.antardasha.planet).toBe(secondAd.planet);
    });

    it('switches to the next period at the exact boundary millisecond for Pratyantardasha transitions', () => {
      const timeline = calculateVimshottari({
        birthDateTime: '2000-01-01T00:00:00.000Z',
        moonSiderealLongitude: 0.0
      });

      const firstAd = timeline.mahadashas[0].antardashas[0];
      expect(firstAd.pratyantardashas.length).toBeGreaterThan(1);
      const firstPd = firstAd.pratyantardashas[0];
      const secondPd = firstAd.pratyantardashas[1];

      const boundaryMs = new Date(firstPd.end).getTime();

      // Prior instant
      const activeBefore = getActiveDasha(timeline, new Date(boundaryMs - 1).toISOString());
      expect(activeBefore).not.toBeNull();
      expect(activeBefore!.pratyantardasha.planet).toBe(firstPd.planet);

      // Exact boundary instant
      const activeExact = getActiveDasha(timeline, new Date(boundaryMs).toISOString());
      expect(activeExact).not.toBeNull();
      expect(activeExact!.pratyantardasha.planet).toBe(secondPd.planet);

      // After instant
      const activeAfter = getActiveDasha(timeline, new Date(boundaryMs + 1).toISOString());
      expect(activeAfter).not.toBeNull();
      expect(activeAfter!.pratyantardasha.planet).toBe(secondPd.planet);
    });
  });

  describe('Out of Range Queries (Before Birth and After Timeline Horizon)', () => {
    it('returns null strictly before birth timestamp', () => {
      const birthIso = '2000-01-01T00:00:00.000Z';
      const birthMs = new Date(birthIso).getTime();

      const timeline = calculateVimshottari({
        birthDateTime: birthIso,
        moonSiderealLongitude: 0.0
      });

      // 1 ms before birth
      expect(getActiveDasha(timeline, new Date(birthMs - 1).toISOString())).toBeNull();
      // 1 year before birth
      expect(getActiveDasha(timeline, '1999-01-01T00:00:00.000Z')).toBeNull();
    });

    it('returns null at or after timeline end boundary', () => {
      const birthIso = '2000-01-01T00:00:00.000Z';
      const untilIso = '2020-01-01T00:00:00.000Z';
      const untilMs = new Date(untilIso).getTime();

      const timeline = calculateVimshottari({
        birthDateTime: birthIso,
        moonSiderealLongitude: 0.0,
        until: untilIso
      });

      // At exact timeline end (half-open [start, end))
      expect(getActiveDasha(timeline, new Date(untilMs).toISOString())).toBeNull();
      // 1 ms after timeline end
      expect(getActiveDasha(timeline, new Date(untilMs + 1).toISOString())).toBeNull();
      // 1 year after timeline end
      expect(getActiveDasha(timeline, '2021-01-01T00:00:00.000Z')).toBeNull();
    });
  });
});
