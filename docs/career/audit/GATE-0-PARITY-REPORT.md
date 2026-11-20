# G0-A Parity Report — RG-09 Calculation Reference Fixtures

Generated: 2026-11-20T13:43:53.212Z
Engine commit: `e257193197472479db978e503fe8fc4c33c94ae3`
Fixture count: 2015
RG-09 coverage: **READY** (coverageComplete=true)
RG-09 approval: **PENDING_REVIEW** — No human approval manifest found; human review is pending.
Gate-0 overall readiness: **PENDING_REVIEW** (requires coverage, human approval, and complete cohort brackets)
Fixture-set SHA-256: `541a3ce9e0929b4e49d435a6e691980cf4e49ddc40d72c75a80c1cf722378731`
Cohort stratification: **COMPLETE**
inspectBoundaryCoverage issues: 0

Expected values come exclusively from offline captures under `tools/gate0/captures/`
(Swiss Ephemeris 2.10.03 WASM + DE441-derived `.se1` files; independent grid-semantics
evaluator for constructed vectors; astronomy-engine 2.1.19 MIT cross-check recorded
per cohort artifact). Engine output appears only as the measured side.

## Per-track results

| Track | n | pass | fail | max error | mean error | unit | §4 tolerance |
|-------|---|------|------|-----------|------------|------|--------------|
| DASHA_ARITHMETIC_LOCKED_MOON | 67 | 67 | 0 | 0.000e+0 | 0.000e+0 | ms | fraction 1e-6 / boundary 1000 ms |
| DASHA_END_TO_END | 67 | 0 | 67 | 7010385262 | 1073575025 | ms | all MD/AD/PD boundaries <= 1000 ms |
| HOUSE_POSITION | 144 | 144 | 0 | 0.000e+0 | 0.000e+0 | house | exact |
| MOON_LONGITUDE | 86 | 1 | 85 | 622.415 | 192.486 | arcsec | 0.0001° (Moon-anchor protocol) |
| NAKSHATRA_BOUNDARY | 405 | 378 | 27 | 1.000 | 6.667e-2 | category | categorical |
| PLANETARY_LONGITUDE | 688 | 184 | 504 | 10178 | 919.758 | arcsec | 0.01° (nodes 0.005°) |
| PLANETARY_MOTION | 258 | 243 | 15 | 1.635e-1 | 1.218e-2 | deg/day | speed ±0.05°/day + exact flags |
| RAHU_KETU_OPPOSITION | 86 | 86 | 0 | 8.527e-14 | 2.941e-14 | deg | 0.01° |
| SIGN_BOUNDARY | 36 | 36 | 0 | 0.000e+0 | 0.000e+0 | category | categorical |
| VARGA_LONGITUDE | 245 | 245 | 0 | 0.000e+0 | 0.000e+0 | arcsec | 1e-6° |

## Ascendant (parity measurement, not a fixture kind)

- cases: 86, pass(<=0.01°): 86, fail: 0
- max |Δ| = 6.209e-3°, mean = 2.714e-3° (tolerance 0.01° = 36″)

## End-to-end dasha structure

- MD/AD/PD structure matches locked-Moon reference: 31/67.
- Structural mismatch samples: DASHA-BI-005 (MD1/AD1 PD count 6/5); DASHA-BI-015 (MD1/AD1 PD count 5/6); DASHA-BI-017 (MD1/AD1 PD count 6/5); DASHA-BI-019 (MD1/AD1 PD count 4/3); DASHA-BI-023 (MD1/AD1 PD count 8/9); DASHA-BI-025 (MD1 AD count 2/3); DASHA-MB-01-BEFORE (MD1 MERCURY/KETU); DASHA-MB-02-BEFORE (MD1 KETU/VENUS); DASHA-MB-03-BEFORE (MD1 VENUS/SUN); DASHA-MB-03-AFTER (MD1/AD1 PD count 9/6); DASHA-MB-04-BEFORE (MD1 SUN/MOON); DASHA-MB-04-AFTER (MD1/AD1 PD count 9/7).

## Cohort stratification audit (§3a)

Captured cases: 86; captured planet positions: 774.
Moon-anchor cases: 67; bracket threshold: ±0.01° per side.
Nakshatra boundaries bracketed on both sides: 27/27.
| Boundary grid | ≤0.001° | >0.001–0.01° | >0.01–0.1° | >0.1–1° | >1° | total |
|---------------|----------|---------------|-------------|----------|------|-------|
| SIGN | 0 | 7 | 2 | 31 | 734 | 774 |
| NAKSHATRA | 0 | 56 | 9 | 106 | 603 | 774 |
| PADA | 0 | 62 | 42 | 427 | 243 | 774 |
| D9 | 0 | 62 | 42 | 427 | 243 | 774 |
| D10 | 0 | 7 | 42 | 489 | 236 | 774 |

All 27 nakshatra boundaries are bracketed.

Moon-anchor cases must bracket every nakshatra boundary within ±0.01° on both sides; a missing bracket is a coverage gap, not an assumed pass.

## Grid agreement on captured reference longitudes

| Track | agree/total |
|-------|-------------|
| SIGN (on reference longitudes) | 774/774 |
| NAKSHATRA+PADA (on reference longitudes) | 774/774 |
| PADA only (on reference longitudes) | 774/774 |
| D9 varga (on reference longitudes) | 774/774 |
| D10 varga (on reference longitudes) | 774/774 |

## Failure sample (first 40)

Total failing fixtures: 698
- PL-BI-001-SUN: 41.0" > 36.00"
- PL-BI-001-MOON: 220.8" > 0.36"
- PL-BI-001-MARS: 9132.4" > 36.00"
- PL-BI-001-MERCURY: 2341.3" > 36.00"
- PL-BI-001-JUPITER: 3661.6" > 36.00"
- PL-BI-001-VENUS: 8802.2" > 36.00"
- PL-BI-001-SATURN: 6220.0" > 36.00"
- PM-BI-001-MERCURY: speedErr=0.0871 retro=true stat=true
- PM-BI-001-VENUS: speedErr=0.0853 retro=true stat=true
- PL-BI-002-MOON: 322.7" > 0.36"
- PL-BI-002-MARS: 10178.0" > 36.00"
- PL-BI-002-MERCURY: 2446.1" > 36.00"
- PL-BI-002-JUPITER: 3514.1" > 36.00"
- PL-BI-002-VENUS: 1529.2" > 36.00"
- PL-BI-002-SATURN: 7450.6" > 36.00"
- PL-BI-003-MOON: 17.6" > 0.36"
- PL-BI-003-MARS: 4768.2" > 36.00"
- PL-BI-003-MERCURY: 3926.6" > 36.00"
- PL-BI-003-JUPITER: 3303.8" > 36.00"
- PL-BI-003-VENUS: 1422.2" > 36.00"
- PL-BI-003-SATURN: 6124.7" > 36.00"
- PL-BI-004-SUN: 42.1" > 36.00"
- PL-BI-004-MOON: 71.1" > 0.36"
- PL-BI-004-MARS: 1917.9" > 36.00"
- PL-BI-004-JUPITER: 3174.8" > 36.00"
- PL-BI-004-VENUS: 9632.7" > 36.00"
- PL-BI-004-SATURN: 5166.1" > 36.00"
- PL-BI-005-SUN: 36.8" > 36.00"
- PL-BI-005-MOON: 533.1" > 0.36"
- PL-BI-005-MARS: 1715.3" > 36.00"
- PL-BI-005-MERCURY: 2100.6" > 36.00"
- PL-BI-005-JUPITER: 2547.9" > 36.00"
- PL-BI-005-VENUS: 1401.7" > 36.00"
- PL-BI-005-SATURN: 4509.2" > 36.00"
- PL-BI-006-SUN: 42.5" > 36.00"
- PL-BI-006-MOON: 156.5" > 0.36"
- PL-BI-006-MARS: 2779.9" > 36.00"
- PL-BI-006-MERCURY: 4277.9" > 36.00"
- PL-BI-006-JUPITER: 2478.2" > 36.00"
- PL-BI-006-VENUS: 642.0" > 36.00"
- … and 658 more

## Fork recommendation

Per-track verdicts:
- Astronomical position: other planets 184/688; Moon anchors 1/86 at 0.0001° (max 622.4″); Rahu/Ketu opposition 86/86.
- Motion: 243/258.
- Ascendant: 86/86 within 0.01°.
- Categorical boundary: 414/441 (27 failures).
- Varga/house arithmetic: 389/389 (0 failures).
- Dasha arithmetic, locked Moon: 67/67.
- Dasha end-to-end, engine Moon: 0/67.
- Reference-grid cross-check (SIGN (on reference longitudes)): 774/774.
- Reference-grid cross-check (NAKSHATRA+PADA (on reference longitudes)): 774/774.
- Reference-grid cross-check (PADA only (on reference longitudes)): 774/774.
- Reference-grid cross-check (D9 varga (on reference longitudes)): 774/774.
- Reference-grid cross-check (D10 varga (on reference longitudes)): 774/774.

**Recommendation: Fork A — replace the astronomy core and address failing deterministic tracks separately.**

Evidence:
- Moon-anchor longitude has 1/86 passes at the protocol's 0.0001° tolerance; end-to-end dasha has 0/67 passes, distinct from 67/67 locked-Moon arithmetic passes.
- Other planetary longitudes have 184/688 passes; motion has 243/258; ascendant has 86/86.
- Categorical boundaries have 27 failures and varga/house arithmetic has 0; these deterministic tracks are reported separately from ephemeris accuracy.
- A reference-grade ephemeris should be adopted behind the existing `generatePlanetaryPositions`/`calculateAscendant` seams; deterministic boundary failures require their own investigation.

## Provenance & reproducibility

- Captures: `tools/gate0/captures/` (cohort/*.json + boundary-vectors.v1.json + manifest.json with SHA-256 per artifact).
- Fixture module: `src/engine/validation/calculationReferenceFixtures.generated.ts` (auto-generated; builders enforce provenance).
- Reference implementation: @kuntay/swisseph 0.2.2 / Swiss Ephemeris 2.10.03 WASM, ephemeris `sepl_18.se1`+`semo_18.se1` (DE441-derived, 1800–2399 CE), ayanamsa LAHIRI, mean node, geocentric apparent.
- Cross-check: astronomy-engine 2.1.19 (MIT), independently identifiable, per-case diffs recorded in cohort artifacts (max |Δ| tropical longitude ≈ 0.018° at 2099, ≈0.001–0.003° near J2000 — consistent with AE truncated lunar theory).
- License flag: Swiss Ephemeris is AGPL-3.0-or-later; tooling-only use, distribution review required before release.
- Determinism: same capture inputs + tool versions → byte-stable artifacts (verified: cohort BI-001 and boundary-vectors.v1.json SHA-256 reproduce identically across re-capture).
