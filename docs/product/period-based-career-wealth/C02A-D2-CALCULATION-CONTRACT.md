# C02A — D2 Calculation Contract

**Base branch:** `main`  
**Implementation branch:** `feat/wealth-c02a-d2-calculation-contract`  
**Scope:** Deterministic D2 (Hora) sign allocation only.  
**Canonical Wealth policy:** A08 remains authoritative; D2 remains `UNAVAILABLE` in CW-05.

## 1. Existing implementation inspected

The current production entry point is `getVargaSign(longitude, 'D2')` in `src/engine/planetaryStrength/varga.ts`. It is called by `analyzePlanetaryStrength` as one of the seven Saptavargaja vargas. It maps a source-chart longitude directly to a D2 sign; it does not construct a full D2 `Chart`, map houses, or produce an independently validated Hora interpretation.

The current implementation uses two 15-degree halves of each 30-degree source sign:
- Odd-numbered signs: first half → Leo; second half → Cancer.
- Even-numbered signs: first half → Cancer; second half → Leo.

This contract records that existing project behavior. It does not claim that a complete D2 chart convention, chart rendering, or relationship semantics have been implemented.

## 2. Input and output contract

| Field | Contract |
|---|---|
| Input | One finite numeric ecliptic longitude in degrees |
| Coordinate frame | Sidereal longitude, already calculated by the upstream birth-chart calculation path |
| Ayanamsa | Selected and applied upstream by planetary-position generation; D2 mapping must not subtract or apply ayanamsa again |
| Normalization | Circular normalization into `[0°, 360°)` using the repository `normalizeDegree` utility |
| Source sign | `floor(normalizedLongitude / 30°)`, in zodiac order Aries through Pisces |
| In-sign longitude | `normalizedLongitude % 30°` |
| Segment count | Two equal segments per source sign |
| Segment width | Exactly 15° |
| Output | One of the twelve `Sign` enum values; for the current Hora mapping, only Leo or Cancer |
| Rounding | No decimal rounding or snapping before segment classification |
| Boundary | Half-open intervals: `[0°, 15°)` and `[15°, 30°)`; the exact 15° point belongs to the second half |
| Precision | Classification uses the supplied IEEE-754 number as represented; no hidden epsilon is applied by D2 |
| Reproducibility | Pure mapping: identical numeric input and code version yield identical sign output |

### Source-sign allocation

| Source sign parity | First half [0°, 15°) | Second half [15°, 30°) |
|---|---|---|
| Odd: Aries, Gemini, Leo, Libra, Sagittarius, Aquarius | Leo | Cancer |
| Even: Taurus, Cancer, Virgo, Scorpio, Capricorn, Pisces | Cancer | Leo |

At a source-sign ingress (exact multiple of 30°), the input belongs to the entering sign and its first Hora half. At 360° the longitude wraps to 0° (Aries 0°).

## 3. Ayanamsa and upstream boundary

`generatePlanetaryPositions` calculates tropical longitude, obtains the configured ayanamsa offset, subtracts it, normalizes the result, and places that sidereal longitude in `eclipticLongitude`, `siderealLongitude`, and `longitude`. `analyzePlanetaryStrength` passes `PlanetFact.position.eclipticLongitude` to `getVargaSign`.

Therefore:
- D2 consumes the upstream sidereal longitude as-is.
- `BirthDetails.ayanamsa` governs the upstream astronomy calculation.
- D2 must not apply ayanamsa a second time.
- The D2 mapper itself has no date/time, location, ayanamsa, tropical longitude, or ephemeris dependency.
- An end-to-end external reference fixture must record the birth instant, timezone/time standard, geographic coordinates, source ephemeris/version, zodiac frame, ayanamsa and its version/method, and the expected D2 placements.

The repository release policy currently records independent Swiss Ephemeris/JPL Horizons reference parity as BLOCKED. No external D2 reference values are present in the inspected fixture inventory. This PR does not fabricate external values or upgrade that status.

## 4. D2-specific validation added

The added unit suite exercises the existing pure mapper across:
- All twelve source signs and both half-sign midpoints.
- Every one of the twelve 15° segment boundaries immediately before, exactly at, and immediately after.
- All twelve sign ingress boundaries.
- Circular wrap behavior for negative, 0°, 360°, and greater-than-360° inputs.
- Repeated-evaluation determinism.
- Non-regression checks for selected non-D2 varga mappings.

These are deterministic contract/unit fixtures. They are not independent astronomical golden references and do not prove that upstream planetary longitudes are astronomically correct.

## 5. Explicitly unvalidated / blocked

| Validation surface | Status | Reason |
|---|---|---|
| D2 sign-mapping unit contract | Covered by this PR's deterministic tests | Tests validate the documented mapper behavior only |
| Independent D2 longitude parity | BLOCKED | No approved external D2 fixture set was present in the repository |
| Full D2 chart construction / house mapping | NOT IMPLEMENTED / NOT IN SCOPE | Current entry point returns a sign, not a `Chart` |
| D2 interpretation | BLOCKED by A08 | Separate validation and domain approval required |
| CW-05 Wealth D2 participation | UNAVAILABLE | A08 guardrails remain unchanged |

## 6. A08 / CW-05 separation

This PR does not edit A08, `wealthReasoningHierarchy`, Wealth manifestation synthesis, D2 relationship producers, confidence/completeness logic, AI adapters, or Wealth UI gates. A calculation mapping test passing is not permission to interpret D2. D2 remains unavailable in canonical Wealth reasoning.

## 7. Non-goals

- Enabling D2 in CW-05 or any Wealth conclusion.
- Creating D2 Wealth rules or support/challenge relationships.
- Treating in-repository expected values as external validation.
- Claiming Swiss Ephemeris / JPL Horizons parity.
- Building a complete D2 chart/house calculation pipeline.
- Changing Saptavargaja Bala formulas or weights.
