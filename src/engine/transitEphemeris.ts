import { Planet, AyanamsaType, BirthDetails, PlanetPosition } from '../types';
import { generatePlanetaryPositions } from './astroEngine';

/**
 * Computes current transit planetary positions (including canonical motion) for a given date and ayanamsa.
 * Decoupled from the pure Gochara calculation engine.
 */
export function calculateCurrentTransitPositions(
  transitDate: Date,
  ayanamsa: AyanamsaType = AyanamsaType.LAHIRI
): Record<Planet, PlanetPosition> {
  const dummyBirth: BirthDetails = {
    dateTimeStr: transitDate.toISOString(),
    latitude: 0,
    longitude: 0,
    timeZone: 'UTC',
    ayanamsa
  };

  return generatePlanetaryPositions(dummyBirth);
}

/**
 * Computes current transit planetary longitudes for a given date and ayanamsa.
 * Decoupled from the pure Gochara calculation engine.
 */
export function calculateCurrentTransitLongitudes(
  transitDate: Date,
  ayanamsa: AyanamsaType = AyanamsaType.LAHIRI
): Record<Planet, number> {
  const positions = calculateCurrentTransitPositions(transitDate, ayanamsa);
  const transitLongitudes: Partial<Record<Planet, number>> = {};

  Object.values(Planet).forEach((p) => {
    transitLongitudes[p] = positions[p].eclipticLongitude;
  });

  return transitLongitudes as Record<Planet, number>;
}
