import { describe, it, expect } from 'vitest';
import { calculateVimshottari, getActiveDasha } from '../vimshottari';

/**
 * Engine Invariant: Half-Open [start, end) Boundary Interval Semantics
 *
 * Asserts the standard half-open interval rule where a period begins at its exact `start` instant
 * (inclusive) and transitions to the subsequent period at its exact `end` instant (exclusive).
 */
describe('Engine Invariant: Half-Open [start, end) Interval Semantics', () => {
  describe('Mahadasha Transition Boundaries (boundary-1ms, boundary, boundary+1ms)', () => {
    it('switches to the next Mahadasha at the exact boundary millisecond', () => {
      const timeline = calculateVimshottari({
        birthDateTime: '2000-01-01T00:00:00.000Z',
        moonSiderealLongitude: 0.0 // Ashwini: Ketu MD
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
  });

  describe('Antardasha Transition Boundaries', () => {
    it('switches to the next Antardasha at the exact boundary millisecond', () => {
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
  });

  describe('Pratyantardasha Transition Boundaries', () => {
    it('switches to the next Pratyantardasha at the exact boundary millisecond', () => {
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
