import { Planet, AyanamsaType, BirthDetails } from '../types';
import { generatePlanetaryPositions } from './astroEngine';

/**
 * Computes current transit planetary longitudes for a given date and ayanamsa.
 * Decoupled from the pure Gochara calculation engine.
 */
export function calculateCurrentTransitLongitudes(
  transitDate: Date,
  ayanamsa: AyanamsaType = AyanamsaType.LAHIRI
): Record<Planet, number> {
  const dummyBirth: BirthDetails = {
    dateTimeStr: transitDate.toISOString(),
    latitude: 0,
    longitude: 0,
    timeZone: 'UTC',
    ayanamsa
  };

  const positions = generatePlanetaryPositions(dummyBirth);
  const transitLongitudes: Partial<Record<Planet, number>> = {};

  Object.values(Planet).forEach((p) => {
    transitLongitudes[p] = positions[p].eclipticLongitude;
  });

  return transitLongitudes as Record<Planet, number>;
}
