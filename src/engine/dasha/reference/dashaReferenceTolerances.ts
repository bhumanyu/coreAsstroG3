/**
 * Canonical reference tolerances for Vimshottari Dasha calculations.
 *
 * Rationale for tolerance thresholds relative to engine representations:
 *
 * 1. `moonLongitudeDegrees` (1e-6° ≈ 0.0036 arcsec):
 *    Angular coordinates are stored as IEEE-754 double-precision floats. A tolerance of 1e-6°
 *    safely absorbs float rounding while being several orders of magnitude smaller than any nakshatra
 *    pada (3°20') or sub-division boundary.
 *
 * 2. `nakshatraProgress` (1e-6 fraction, 0.0..1.0):
 *    Progress through a nakshatra span of 13°20' (40/3 degrees) is computed as
 *    (longitude - startDegree) / (40/3). A tolerance of 1e-6 allows accurate fractional verification
 *    without float epsilon artifacts.
 *
 * 3. `dashaBalanceYears` (1e-5 years ≈ 5.25 minutes):
 *    Dasha balance is computed as DASHA_YEARS[lord] * remainingFraction. A tolerance of 1e-5 years
 *    guarantees sub-hour accuracy against analytical benchmarks while tolerating double precision
 *    multiplication differences.
 *
 * 4. `boundaryMilliseconds` (1000 ms = 1.0 second):
 *    JavaScript Date instances are integer timestamps in milliseconds. Converting fractional years
 *    (years * 365.25 * 86,400,000 ms) involves floating point arithmetic and rounding. A 1000 ms
 *    (1 second) tolerance ensures tests verify exact boundary transitions over multi-decade spans
 *    without failing due to sub-second millisecond truncation/rounding differences.
 *
 * 5. `astronomyMoonLongitudeDegrees` (1e-4° ≈ 0.36 arcsec):
 *    Planetary astronomy coordinate generation involves trigonometric series calculations.
 *    A tolerance of 1e-4° allows verification of the astronomical calculation pipeline.
 */
export const DASHA_REFERENCE_TOLERANCES = Object.freeze({
  moonLongitudeDegrees: 1e-6,
  nakshatraProgress: 1e-6,
  dashaBalanceYears: 1e-5,
  boundaryMilliseconds: 1000,
  astronomyMoonLongitudeDegrees: 1e-4
} as const);
