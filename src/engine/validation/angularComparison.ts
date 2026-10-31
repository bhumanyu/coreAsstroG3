const FULL_TURN_DEGREES = 360;
const HALF_TURN_DEGREES = FULL_TURN_DEGREES / 2;
const COMPARISON_ROUNDING_EPSILON = Number.EPSILON * FULL_TURN_DEGREES * 2;

function assertFiniteAngle(angle: number, label: string): void {
  if (!Number.isFinite(angle)) {
    throw new RangeError(`${label} must be a finite number of degrees.`);
  }
}

/**
 * Normalizes an angle into the half-open interval [0, 360).
 */
export function normalizeDegrees(angle: number): number {
  assertFiniteAngle(angle, 'angle');
  return ((angle % FULL_TURN_DEGREES) + FULL_TURN_DEGREES) % FULL_TURN_DEGREES;
}

/**
 * Returns the signed shortest rotation from expected to actual in [-180, 180).
 */
export function signedAngularDifferenceDegrees(actual: number, expected: number): number {
  const actualNormalized = normalizeDegrees(actual);
  const expectedNormalized = normalizeDegrees(expected);
  return (
    ((actualNormalized - expectedNormalized + HALF_TURN_DEGREES + FULL_TURN_DEGREES)
      % FULL_TURN_DEGREES)
    - HALF_TURN_DEGREES
  );
}

/**
 * Returns the smallest separation between two angles, accounting for wrap-around.
 */
export function angularDistance(actual: number, expected: number): number {
  return Math.abs(signedAngularDifferenceDegrees(actual, expected));
}

/**
 * Compares two angles using their shortest circular distance.
 */
export function compareAngle(
  actual: number,
  expected: number,
  toleranceDegrees: number
): boolean {
  if (!Number.isFinite(toleranceDegrees) || toleranceDegrees < 0) {
    throw new RangeError('toleranceDegrees must be a finite, non-negative number.');
  }
  return angularDistance(actual, expected)
    <= toleranceDegrees + COMPARISON_ROUNDING_EPSILON;
}
