# G0-A Parity Report — RG-09 Calculation Reference Fixtures

Generated: 2026-11-20T12:45:35.561Z
Engine commit: `dd4d5e4668ba2eedcd8700b64fa0ba69cfd93b0b`
Fixture count: 1259
RG-09 gate: **READY** (coverageComplete=true)
inspectBoundaryCoverage issues: 0

Expected values come exclusively from offline captures under `tools/gate0/captures/`
(Swiss Ephemeris 2.10.03 WASM + DE441-derived `.se1` files; independent grid-semantics
evaluator for constructed vectors; astronomy-engine 2.1.19 MIT cross-check recorded
per cohort artifact). Engine output appears only as the measured side.

## Per-track results

| Track | n | pass | fail | max error | mean error | unit | §4 tolerance |
|-------|---|------|------|-----------|------------|------|--------------|
| HOUSE_POSITION | 144 | 144 | 0 | 0.000e+0 | 0.000e+0 | house | exact |
| NAKSHATRA_BOUNDARY | 405 | 378 | 27 | 1.000 | 6.667e-2 | category | categorical |
| PLANETARY_LONGITUDE | 288 | 79 | 209 | 10178 | 1329 | arcsec | 0.01° (nodes 0.005°, Moon-dasha 0.0001°) |
| PLANETARY_MOTION | 96 | 81 | 15 | 1.635e-1 | 2.204e-2 | deg/day | speed ±0.05°/day + exact flags |
| RAHU_KETU_OPPOSITION | 32 | 32 | 0 | 5.684e-14 | 1.155e-14 | deg | 0.01° |
| SIGN_BOUNDARY | 36 | 36 | 0 | 0.000e+0 | 0.000e+0 | category | categorical |
| VARGA_LONGITUDE | 245 | 245 | 0 | 0.000e+0 | 0.000e+0 | arcsec | 1e-6° |
| VIMSHOTTARI_DASHA | 13 | 13 | 0 | 0.000e+0 | 0.000e+0 | ms | fraction 1e-6 / boundary 1000 ms |

## Ascendant (parity measurement, not a fixture kind)

- cases: 32, pass(<=0.01°): 32, fail: 0
- max |Δ| = 6.209e-3°, mean = 3.638e-3° (tolerance 0.01° = 36″)

## Grid agreement on captured reference longitudes

| Track | agree/total |
|-------|-------------|
| SIGN (on reference longitudes) | 288/288 |
| NAKSHATRA+PADA (on reference longitudes) | 288/288 |
| PADA only (on reference longitudes) | 288/288 |
| D9 varga (on reference longitudes) | 288/288 |
| D10 varga (on reference longitudes) | 288/288 |

## Failure sample (first 40)

Total failing fixtures: 251
- PL-BI-001-SUN: 41.0" > 36"
- PL-BI-001-MOON: 220.8" > 36"
- PL-BI-001-MARS: 9132.4" > 36"
- PL-BI-001-MERCURY: 2341.3" > 36"
- PL-BI-001-JUPITER: 3661.6" > 36"
- PL-BI-001-VENUS: 8802.2" > 36"
- PL-BI-001-SATURN: 6220.0" > 36"
- PM-BI-001-MERCURY: speedErr=0.0871 retro=true stat=true
- PM-BI-001-VENUS: speedErr=0.0853 retro=true stat=true
- PL-BI-002-MOON: 322.7" > 36"
- PL-BI-002-MARS: 10178.0" > 36"
- PL-BI-002-MERCURY: 2446.1" > 36"
- PL-BI-002-JUPITER: 3514.1" > 36"
- PL-BI-002-VENUS: 1529.2" > 36"
- PL-BI-002-SATURN: 7450.6" > 36"
- PL-BI-003-MARS: 4768.2" > 36"
- PL-BI-003-MERCURY: 3926.6" > 36"
- PL-BI-003-JUPITER: 3303.8" > 36"
- PL-BI-003-VENUS: 1422.2" > 36"
- PL-BI-003-SATURN: 6124.7" > 36"
- PL-BI-004-SUN: 42.1" > 36"
- PL-BI-004-MOON: 71.1" > 36"
- PL-BI-004-MARS: 1917.9" > 36"
- PL-BI-004-JUPITER: 3174.8" > 36"
- PL-BI-004-VENUS: 9632.7" > 36"
- PL-BI-004-SATURN: 5166.1" > 36"
- PL-BI-005-SUN: 36.8" > 36"
- PL-BI-005-MOON: 533.1" > 36"
- PL-BI-005-MARS: 1715.3" > 36"
- PL-BI-005-MERCURY: 2100.6" > 36"
- PL-BI-005-JUPITER: 2547.9" > 36"
- PL-BI-005-VENUS: 1401.7" > 36"
- PL-BI-005-SATURN: 4509.2" > 36"
- PL-BI-006-SUN: 42.5" > 36"
- PL-BI-006-MOON: 156.5" > 36"
- PL-BI-006-MARS: 2779.9" > 36"
- PL-BI-006-MERCURY: 4277.9" > 36"
- PL-BI-006-JUPITER: 2478.2" > 36"
- PL-BI-006-VENUS: 642.0" > 36"
- PL-BI-006-SATURN: 3455.9" > 36"
- … and 211 more

## Fork recommendation

Measured outcome: **79/288** planetary-longitude fixtures pass (max lunar error 575″ vs 0.01°≈36″ class tolerance); ascendant 32/32 pass; motion 81/96 pass; dasha anchors 13/13 pass; constructed-vector tracks 27 failures.

**Recommendation: Fork A — replace the astronomy core.**

Evidence:
- Lunar longitude passes 5/32 fixtures (max error 575″ ≈ 0.160°); the Moon anchors every Vimshottari dasha in production, so no cohort restriction can certify dasha timings while the engine computes lunar position itself.
- Only 79/288 (27%) planetary-longitude fixtures meet §4 tolerances; the truncated low-order analytical series in `astroEngine.ts` (`computeTropicalPositions`, mean-node quadratic, +0.01 d finite-difference speed, fixed `eclipticLatitude: 0`) miss by 1–3 orders of magnitude on lunar and most planetary cases.
- Constructed grid vectors and the ascendant are the only tracks inside tolerance; they validate discrete grid logic and a low-order GMST formula, not ephemeris quality.
- Fork A should adopt a reference-grade ephemeris behind the existing `generatePlanetaryPositions`/`calculateAscendant` seams (Swiss Ephemeris commercial license, or astronomy-engine MIT — both already exercised offline by this harness).

## Provenance & reproducibility

- Captures: `tools/gate0/captures/` (cohort/*.json + boundary-vectors.v1.json + manifest.json with SHA-256 per artifact).
- Fixture module: `src/engine/validation/calculationReferenceFixtures.generated.ts` (auto-generated; builders enforce provenance).
- Reference implementation: @kuntay/swisseph 0.2.2 / Swiss Ephemeris 2.10.03 WASM, ephemeris `sepl_18.se1`+`semo_18.se1` (DE441-derived, 1800–2399 CE), ayanamsa LAHIRI, mean node, geocentric apparent.
- Cross-check: astronomy-engine 2.1.19 (MIT), independently identifiable, per-case diffs recorded in cohort artifacts (max |Δ| tropical longitude ≈ 0.018° at 2099, ≈0.001–0.003° near J2000 — consistent with AE truncated lunar theory).
- License flag: Swiss Ephemeris is AGPL-3.0-or-later; tooling-only use, distribution review required before release.
- Determinism: same capture inputs + tool versions → byte-stable artifacts (verified: cohort BI-001 and boundary-vectors.v1.json SHA-256 reproduce identically across re-capture).
