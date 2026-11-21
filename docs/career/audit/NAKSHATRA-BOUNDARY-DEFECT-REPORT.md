# Gate-0 Nakshatra Boundary Defect Report

## Finding

The current 405-vector categorical track has 0 failed assignments. All failures are at EXACT positions: confirmed.
For the 0 failing triplets, EPSILON_BEFORE passes 0/0 and EPSILON_AFTER passes 0/0.
The constructed reference longitude is passed directly to the production categorizer; these failures do not depend on planetary ephemeris accuracy. They are categorical assignment defects, not upstream longitude errors.

## Diagnosis

Every failing triplet is a pada boundary. The expected nakshatra is retained, but at the exact longitude the engine reports the preceding pada (for example, Krittika/1 instead of Krittika/2 at 30°). The mismatch is consistent with the production lookup metadata using decimal-rounded nakshatra start degrees (for example, 26.6666666667°) while the pada span is computed from `40 / 3`; the `1e-12°` offset in `calculateNakshatra` does not compensate for the larger representation difference. This is a half-open interval / floating-point boundary classification defect.

The defect is documented only. The audit freeze prohibits changes to `src/engine/nakshatraUtils.ts`; no boundary algorithm or expected fixture has been modified to force parity.

## Failing triplets

| Boundary ID | Boundary longitude (°) | Position | Input longitude (°) | Expected | Engine | Result |
|-------------|-------------------------|----------|---------------------|----------|--------|--------|

