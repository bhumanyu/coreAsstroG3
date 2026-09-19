import { Sign, TransitRelationshipType } from '../types';

export interface TransitGeometryConfig {
  readonly conjunctionOrbDegrees: number;
  readonly oppositionOrbDegrees: number;
  readonly exactContactToleranceDegrees: number;
}

export const DEFAULT_TRANSIT_GEOMETRY_CONFIG: TransitGeometryConfig = Object.freeze({
  conjunctionOrbDegrees: 0,
  oppositionOrbDegrees: 0,
  exactContactToleranceDegrees: 1e-6
});

function assertFiniteLongitude(longitude: number, name: string): void {
  if (typeof longitude !== 'number' || !Number.isFinite(longitude)) {
    throw new Error(`${name} must be a finite number.`);
  }
}

function assertNonNegativeFinite(value: number, name: string): void {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
    throw new Error(`${name} must be a non-negative finite number.`);
  }
}

/**
 * Computes the minimal angular distance between two ecliptic longitudes in [0, 360).
 * Δ = min(abs(na - nb), 360 - abs(na - nb))
 */
export function normalizeAngularDistance(a: number, b: number): number {
  assertFiniteLongitude(a, 'a');
  assertFiniteLongitude(b, 'b');

  const na = ((a % 360) + 360) % 360;
  const nb = ((b % 360) + 360) % 360;
  const diff = Math.abs(na - nb);
  return Math.min(diff, 360 - diff);
}

export interface TransitAngularRelationship {
  readonly relationship: TransitRelationshipType;
  readonly angularSeparation: number;
  readonly orb: number;
  readonly exactContact: boolean;
}

/**
 * Classifies the angular relationship between a transiting planet and a natal planet.
 *
 * Precedence:
 * 1. EXACT_CONTACT (angularSeparation <= exactContactToleranceDegrees)
 * 2. CONJUNCTION (angularSeparation <= conjunctionOrbDegrees)
 * 3. OPPOSITION (abs(180 - angularSeparation) <= oppositionOrbDegrees)
 * 4. SAME_SIGN (transitSign === natalSign)
 * 5. NONE
 */
export function classifyTransitAngularRelationship(
  transitLongitude: number,
  natalLongitude: number,
  transitSign: Sign,
  natalSign: Sign,
  config: TransitGeometryConfig = DEFAULT_TRANSIT_GEOMETRY_CONFIG
): TransitAngularRelationship {
  assertFiniteLongitude(transitLongitude, 'transitLongitude');
  assertFiniteLongitude(natalLongitude, 'natalLongitude');

  assertNonNegativeFinite(config.conjunctionOrbDegrees, 'conjunctionOrbDegrees');
  assertNonNegativeFinite(config.oppositionOrbDegrees, 'oppositionOrbDegrees');
  assertNonNegativeFinite(config.exactContactToleranceDegrees, 'exactContactToleranceDegrees');

  const angularSeparation = normalizeAngularDistance(transitLongitude, natalLongitude);

  if (angularSeparation <= config.exactContactToleranceDegrees) {
    return Object.freeze({
      relationship: TransitRelationshipType.EXACT_CONTACT,
      angularSeparation,
      orb: angularSeparation,
      exactContact: true
    });
  }

  if (angularSeparation <= config.conjunctionOrbDegrees) {
    return Object.freeze({
      relationship: TransitRelationshipType.CONJUNCTION,
      angularSeparation,
      orb: angularSeparation,
      exactContact: false
    });
  }

  const oppositionDistance = Math.abs(180 - angularSeparation);
  if (oppositionDistance <= config.oppositionOrbDegrees) {
    return Object.freeze({
      relationship: TransitRelationshipType.OPPOSITION,
      angularSeparation,
      orb: oppositionDistance,
      exactContact: false
    });
  }

  if (transitSign === natalSign) {
    return Object.freeze({
      relationship: TransitRelationshipType.SAME_SIGN,
      angularSeparation,
      orb: angularSeparation,
      exactContact: false
    });
  }

  return Object.freeze({
    relationship: TransitRelationshipType.NONE,
    angularSeparation,
    orb: angularSeparation,
    exactContact: false
  });
}
