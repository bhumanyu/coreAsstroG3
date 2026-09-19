import { describe, it, expect } from 'vitest';
import {
  calculateCurrentTransitPositions,
  calculateCurrentTransitLongitudes
} from './transitEphemeris';
import { Planet, AyanamsaType } from '../types';

describe('transitEphemeris', () => {
  it('calculateCurrentTransitPositions yields defined canonical motion for all planets and projects identical longitudes', () => {
    const fixedDate = new Date('2026-08-08T12:00:00Z');
    const positions = calculateCurrentTransitPositions(fixedDate, AyanamsaType.LAHIRI);
    const longitudes = calculateCurrentTransitLongitudes(fixedDate, AyanamsaType.LAHIRI);

    const allPlanets = Object.values(Planet);
    expect(Object.keys(positions).length).toBe(allPlanets.length);
    expect(Object.keys(longitudes).length).toBe(allPlanets.length);

    for (const planet of allPlanets) {
      const pos = positions[planet];
      expect(pos).toBeDefined();
      expect(pos.motion).toBeDefined();
      expect(typeof pos.motion.speed).toBe('number');
      expect(typeof pos.motion.retrograde).toBe('boolean');
      expect(typeof pos.motion.stationary).toBe('boolean');

      // Projection proof: calculateCurrentTransitLongitudes produces the exact same eclipticLongitude
      expect(longitudes[planet]).toBe(pos.eclipticLongitude);
    }
  });
});
