# Gate 0 — Calculation Validation Protocol (RG-09)

**Status:** BLOCKED — `CALCULATION_REFERENCE_FIXTURES` is intentionally empty
(`src/engine/validation/calculationReferenceFixtures.ts:21`); `RG_09_CALCULATION_REFERENCE_GATE`
reports `BLOCKED` with the full missing-coverage list.

**Companion artifact:** `src/engine/validation/calculationReferenceFixtureSchema.ts`
(types + pure builders only; contains no expected values).

## 1. Purpose

RG-09 requires approved, independently produced expected values for the production
calculations enumerated in `docs/release/release-policy.json` → `calculationCoverage`
and `REQUIRED_CALCULATION_COVERAGE` (`calculationReferenceTypes.ts:143–160`):

- Kinds: `PLANETARY_LONGITUDE`, `PLANETARY_MOTION`, `RAHU_KETU_OPPOSITION`,
  `SIGN_BOUNDARY`, `NAKSHATRA_BOUNDARY`, `HOUSE_POSITION`, `VARGA_LONGITUDE`,
  `VIMSHOTTARI_DASHA`.
- Planets: SUN, MOON, MARS, MERCURY, JUPITER, VENUS, SATURN, RAHU, KETU.
- Motion scenarios: PROGRADE, RETROGRADE, NEAR_STATIONARY.
- Boundary triplets: SIGN / NAKSHATRA / PADA × EPSILON_BEFORE / EXACT / EPSILON_AFTER.
- Varga types: D9, D10.
- `boundaryEpsilonDegrees`: min `0.000001`, max `0.0001`.

Hard rules (already enforced by `inspectBoundaryCoverage` and fixture comments):

- Expected values must be **independently produced and approved** — never copied from
  engine output. Engine snapshots do not qualify.
- Boundary fixtures require `provenance.expectedValuesProducedIndependently === true`,
  a `boundaryDefinition` whose `name`/`longitude`/convention match `boundaryId` /
  `boundaryLongitude`, grid-aligned longitudes, strictly ordered triplet inputs, and
  epsilon distances inside the policy range.
- Missing data stays UNAVAILABLE / NOT_PROVIDED; nothing is fabricated.

## 2. Fixture generator recommendation

**Recommended:** Swiss Ephemeris (via `pyswisseph`/`swisseph` or the `swiss-ephemeris`
Node bindings) as an **offline fixture-generation tool only**.

- Rationale: de-facto reference-grade planetary longitudes, lunar node models, and
  configurable ayanamsa (LAHIRI available); mature, widely cross-validated.
- **License constraint:** Swiss Ephemeris is AGPL/commercial dual-licensed. It must
  NOT become a runtime or bundled dependency of this product. Generation happens in a
  separate offline step; only the resulting expected values + provenance enter the
  repo. The `ReferenceSource.sourceType: 'EXTERNAL_EPHEMERIS'` contract already models
  this.
- **MIT fallback:** `astronomy-engine` (MIT) is acceptable for a second, independent
  generator pass. Agreement between two independent implementations strengthens the
  `independenceStatement`; disagreement blocks the fixture pending adjudication.

Every fixture must record (per `ReferenceCaptureRecord` in the schema file):
source-artifact SHA-256, UTC instant + local representation + IANA timezone,
latitude/longitude, geocentric/apparent/node conventions, reference
implementation + version + flags + raw captured output, and the engine commit SHA it
was validated against.

## 3. Stratified cohort specification

The cohort has **two independent coverage tracks**; do not conflate their counts.

### 3a. Birth-instant cohort — 24–36 births

Generate **24–36 birth instants** spanning **1900–2100**, stratified across:

- Both hemispheres (northern / southern latitude).
- Varied UTC offsets (e.g. UTC−8, UTC, UTC+5:30, UTC+12) to exercise sidereal-time and
  timezone handling.
- Retrograde and near-stationary periods for Mercury, Venus, Mars (the three
  fastest-moving superior/terrestrial bodies that station).
- Planetary longitudes deliberately placed within a small arc of sign boundaries
  (every 30°), nakshatra boundaries (every 13°20′), and pada boundaries (every
  3°20′) — required to populate the SIGN/NAKSHATRA/PADA triplet coverage.
- D9/D10 boundary-adjacent longitudes for `VARGA_LONGITUDE` fixtures.
- Moon longitudes bracketing nakshatra boundaries for `VIMSHOTTARI_DASHA` anchor
  fixtures (first-MD boundary cases).

### 3b. Calculation-boundary vectors — constructed longitudes

Boundary coverage is supplied by **constructed longitude vectors**, not additional
births: for each required boundary kind (SIGN, NAKSHATRA, PADA), emit the
EPSILON_BEFORE / EXACT / EPSILON_AFTER triplet at grid-aligned longitudes per
`inspectBoundaryCoverage` rules. The vector count is independent of the birth cohort
size — one boundary definition yields three fixture entries; the full policy requires
every (kind × boundaryId × position) tuple to be unique and epsilon-conformant.
House-position and varga fixtures similarly use constructed inputs
(`referenceSign`/`targetSign`, `longitude`/`chartType`) rather than new births.

## 4. Per-track tolerances

| Track | Tolerance | Rationale |
|-------|-----------|-----------|
| Sun, Mercury–Saturn longitudes | ≤ 0.01° | Analytical approximations should reach arcminute-class agreement with a reference ephemeris; looser tolerances would mask real defects |
| Ascendant | ≤ 0.01° | Depends on GMST/LST + obliquity accuracy; same class as planetary longitudes |
| Mean nodes (Rahu/Ketu) | ≤ 0.005° | Mean-node series converge faster than planetary series; tighter bound is achievable |
| Moon longitude (dasha-anchor fixtures) | ≤ 0.0001° (~0.36″) | Dasha timing is extremely sensitive to lunar longitude; this bound is required for second-level MD/AD/PD boundary checks |
| MD/AD/PD boundary instants | ≤ 1 s | **Conditional:** holds only when the reference and engine use the identical year-length convention (`yearLengthDays`), the identical locked Moon sidereal longitude, and a UTC-normalized `birthDateTime`; any divergence in those inputs voids the 1 s bound |
| End-to-end first-MD-boundary | ≤ 2 h | Allows accumulated ephemeris + ayanamsa + time-standard drift while still catching gross errors |

Boundary-epsilon fixtures use the policy range 1e-6 – 1e-4 degrees; choose a single
epsilon per boundary kind within that range and record it in `BoundaryTripletSpec`.

## 5. Expected outcome — decision fork

The current engine computes positions in `src/engine/astroEngine.ts`
(`computeTropicalPositions`, lines ~147–228: truncated low-order analytical series for
Sun/Moon/planets, mean-node quadratic for Rahu/Ketu, finite-difference "speed" at
+0.01 day, fixed `eclipticLatitude: 0`), `calculateAscendant` (lines ~295–323: GMST +
fixed obliquity formula), `src/engine/solarTime.ts`, and `src/engine/chartMath.ts`.

**Expected result:** the engine will fail G0-A (the RG-09 fixture gate) by roughly
**1–3 orders of magnitude** versus the tolerances in §4 — the truncated series omit
planetary perturbation terms (e.g. Venus equation-of-center is single-term, Jupiter /
Saturn lack the full VSOP/VSOP87-class terms, lunar position uses only six principal
terms, nodes are mean-only, latitude is hard-coded to 0, and speed is a coarse
finite difference rather than an analytic derivative).

This failure is the **recorded decision fork**:

- **Fork A — replace the astronomy core:** adopt a reference-grade ephemeris path
  (e.g. Swiss Ephemeris with commercial license, or `astronomy-engine` MIT) behind the
  existing `generatePlanetaryPositions`/`calculateAscendant` seams. Largest effort;
  fixes all downstream consumers at once.
- **Fork B — restrict the cohort:** narrow the certified cohort to cases where the
  current approximation demonstrably stays inside tolerance (likely none for the Moon
  at 0.0001°, and very few for slow planets). Effectively documents the engine as
  approximate and scopes RG-09/RG-10 claims accordingly.

Either way, fixtures must be authored **before** the fork is executed so the gate
measures the change rather than being fitted to it. Do not tune the engine to fixture
outputs; fixtures come only from the independent generator.

## 6. Execution checklist

1. Implement the offline capture harness (separate from runtime deps) emitting
   `ReferenceCaptureRecord` + `FixtureProvenance` per fixture.
2. Generate the stratified cohort (§3); capture raw outputs; compute SHA-256 of each
   artifact.
3. Populate fixtures via `calculationReferenceFixtureSchema.ts` builders; hand-verify
   boundary triplet ordering and epsilon policy conformance.
4. Run `inspectBoundaryCoverage` / `RG_09_CALCULATION_REFERENCE_GATE` — must reach
   `READY` only when `coverageComplete` is true.
5. Execute the G0-A comparison against `astroEngine.ts`/`solarTime.ts`/`chartMath.ts`
   and record pass/fail per track against §4 tolerances.
6. Record the fork decision (A or B) in the release evidence before RG-10 parity work.
