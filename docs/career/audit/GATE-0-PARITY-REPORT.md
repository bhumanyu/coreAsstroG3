# G0-A Parity Report — RG-09 Calculation Reference Fixtures

Generated: 2026-11-21T07:42:30.954Z
Engine commit: `27615a1b08e9b64608e0f5f6fb62df60de05ad7d`
Fixture count: 2015
RG-09 coverage: **READY** (coverageComplete=true)
RG-09 approval: **APPROVED**
RG-09 overall: **READY** — Independent calculation reference coverage is complete and the current fixture set has human approval.
Gate-0 overall readiness (includes cohort brackets): **READY** (missingMoonBrackets=0)
Fixture-set SHA-256: `6b9b935e1850b790db4f0be8d442e17778bde967b8a49d4fd6ccc16c287b130f`
Cohort stratification: **COMPLETE**
inspectBoundaryCoverage issues: 0

Expected values come exclusively from offline captures under `tools/gate0/captures/`
(Swiss Ephemeris 2.10.03 WASM + DE441-derived `.se1` files; independent grid-semantics
evaluator for constructed vectors; astronomy-engine 2.1.19 MIT cross-check recorded
per cohort artifact). Engine output appears only as the measured side.

## 1. Fixture approval

- Fixture-set SHA-256: `6b9b935e1850b790db4f0be8d442e17778bde967b8a49d4fd6ccc16c287b130f`
- Approval status: VALID / APPROVED
- Reviewer: `bhuma`
- Approval date: `2026-11-21`
- Expected values were not regenerated or altered for engine accommodation.

## 2. Engine integration parity

This section measures the production engine against the approved fixture set.

### Per-track results

| Track | n | pass | fail | max error | mean error | unit | §4 tolerance |
|-------|---|------|------|-----------|------------|------|--------------|
| DASHA_ARITHMETIC_REFERENCE_MOON | 67 | 67 | 0 | 0.000e+0 | 0.000e+0 | ms | all MD/AD/PD boundaries <= 1000 ms |
| DASHA_REFERENCE_ANCHOR | 67 | 67 | 0 | 0.000e+0 | 0.000e+0 | ms | frozen first-MD anchor tolerances |
| HOUSE_POSITION | 144 | 144 | 0 | 0.000e+0 | 0.000e+0 | house | exact |
| MOON_LONGITUDE | 86 | 86 | 0 | 4.093e-10 | 4.915e-11 | arcsec | 0.0001° (Moon-anchor protocol) |
| NAKSHATRA_BOUNDARY | 405 | 405 | 0 | 0.000e+0 | 0.000e+0 | category | categorical |
| PLANETARY_LONGITUDE | 688 | 688 | 0 | 4.093e-10 | 7.299e-11 | arcsec | 0.01° (nodes 0.005°) |
| PLANETARY_MOTION | 258 | 258 | 0 | 1.048e-4 | 4.740e-5 | deg/day | speed ±0.05°/day + exact flags |
| RAHU_KETU_OPPOSITION | 86 | 86 | 0 | 8.527e-14 | 2.644e-14 | deg | 0.01° |
| SIGN_BOUNDARY | 36 | 36 | 0 | 0.000e+0 | 0.000e+0 | category | categorical |
| VARGA_LONGITUDE | 245 | 245 | 0 | 0.000e+0 | 0.000e+0 | arcsec | 1e-6° |

### Ascendant (parity measurement, not a fixture kind)

- cases: 86, pass(<=0.01°): 86, fail: 0
- ascendant unavailable in cohort captures: 0 (excluded from measurement coverage)
- max |Δ| = 5.684e-14°, mean = 2.012e-14° (tolerance 0.01° = 36″)

## Dasha error decomposition

- Cases: 67; each case produced R→R, R→E, and E→E timelines.
- R→R anchor check against the frozen fixture expected first-MD values: 67/67.
- Year-length convention: 365.25 days.
- Engine-vs-reference Moon difference: max 3.070e-10″, mean 4.553e-11″.
- Reference-model independence boundary: the Gate-0 reference implementation is independent of production `vimshottari.ts`, but shares Gate-0 convention definitions (`DASHA_SEQUENCE`, `DASHA_YEARS`, and `vimshottariAnchor` from `lib/grid.ts`).
- The 67 R→R first-MD anchors are checked against unchanged fixture expected values. Later MD/AD/PD periods are derived by the Gate-0 model and are NOT independently captured expected values.
- Dasha known-answer conformance is hand-computed from the published Vimshottari sequence, durations, 365.25-day year, and proportional subdivisions ([Dasha overview](https://en.wikipedia.org/wiki/Dasha_(astrology)#Vimshottari_Dasha)); see `tests/dashaDecomposition.test.ts`.
- Periods are matched by the full lord path (including MD ancestry); boundary errors cover matched periods only. Unmatched periods are excluded from timestamp error statistics and counted separately below.

| Level | Comparison | Cases structurally agreeing | Structurally matched periods | Boundary timestamps compared | Unmatched periods excluded | Sequence-difference score | Max matched-boundary error (ms) | Mean matched-boundary error (ms) |
|-------|------------|-----------------------------|-----------------------------|-------------------------------|-----------------------------|---------------------------|-------------------------------|----------------------------------|
| MD | R→R vs R→E (arithmetic/structure) | 67/67 | 670 | 1340 | 0 (E 0, A 0) | 0 | 0.000e+0 | 0.000e+0 |
| MD | R→E vs E→E (Moon-input delta) | 67/67 | 670 | 1340 | 0 (E 0, A 0) | 0 | 0.000e+0 | 0.000e+0 |
| MD | R→E vs E→E — same starting nakshatra | 67/67 | 670 | 1340 | 0 (E 0, A 0) | 0 | 0.000e+0 | 0.000e+0 |
| MD | R→E vs E→E — flipped nakshatra | 0/0 | 0 | 0 | 0 (E 0, A 0) | 0 | n/a | n/a |
| AD | R→R vs R→E (arithmetic/structure) | 67/67 | 5494 | 10988 | 0 (E 0, A 0) | 0 | 0.000e+0 | 0.000e+0 |
| AD | R→E vs E→E (Moon-input delta) | 67/67 | 5494 | 10988 | 0 (E 0, A 0) | 0 | 0.000e+0 | 0.000e+0 |
| AD | R→E vs E→E — same starting nakshatra | 67/67 | 5494 | 10988 | 0 (E 0, A 0) | 0 | 0.000e+0 | 0.000e+0 |
| AD | R→E vs E→E — flipped nakshatra | 0/0 | 0 | 0 | 0 (E 0, A 0) | 0 | n/a | n/a |
| PD | R→R vs R→E (arithmetic/structure) | 67/67 | 48910 | 97820 | 0 (E 0, A 0) | 0 | 0.000e+0 | 0.000e+0 |
| PD | R→E vs E→E (Moon-input delta) | 67/67 | 48910 | 97820 | 0 (E 0, A 0) | 0 | 0.000e+0 | 0.000e+0 |
| PD | R→E vs E→E — same starting nakshatra | 67/67 | 48910 | 97820 | 0 (E 0, A 0) | 0 | 0.000e+0 | 0.000e+0 |
| PD | R→E vs E→E — flipped nakshatra | 0/0 | 0 | 0 | 0 (E 0, A 0) | 0 | n/a | n/a |
- Interpretation: the flipped-nakshatra partition carries all structural mismatches and the dominant cycle-scale (~1e12 ms, decades) boundary shifts — an anchor-nakshatra flip changes the starting MD lord and re-anchors the entire timeline, the mathematically expected consequence of the measured Moon longitude delta near a nakshatra boundary, not a dasha-arithmetic defect. The same-nakshatra partition isolates the residual pure Moon-input timing effect.
- Sequence-difference score is `|expected count − actual count| + positional lord-path mismatches`; it is a severity heuristic, not a count of unique failed periods. Unmatched expected/actual totals above are the precise exclusion counts.


## 3. Independent accuracy

Engine integration now shares the Swiss Ephemeris authority with the reference
captures. Independence is preserved through the offline cohort/conformance
vectors, astronomy-engine 2.1.19 MIT cross-check, independent grid semantics,
and separated R→R/R→E/E→E Dasha comparisons.

### Cohort stratification audit (§3a)

Captured cases: 86; captured planet positions: 774.
Ascendant unavailable: 0 (not counted as successful measurements).
Moon-anchor cases: 67; bracket threshold: ±0.01° per side.
Bracket pairs require distinct captures at the same site, ordered within 2 minutes.
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

## 4. Outstanding defects

G0-08 is resolved in commit `953cd218d5f5c52a32068ac1512ad2cac13c6a7f`;
the 27 exact pada/nakshatra boundary vectors now pass without positional or
Dasha changes.

### Nakshatra/pada boundary defect diagnosis

- 0 categorical failures across 0 boundary triplets; 0 occur outside EXACT. The exact-only finding is confirmed.
- These constructed vectors pass reference longitudes directly to `calculateNakshatra`; no ephemeris result participates. A failed category with the same input longitude is a categorical assignment discrepancy, not an upstream longitude error.
- See [the defect report](./NAKSHATRA-BOUNDARY-DEFECT-REPORT.md) for all three positions of every failing triplet and the classification evidence.

## Failure sample (first 40)

_No fixture failures._

## Fork recommendation

Per-track verdicts:
- Astronomical position: other planets 688/688; Moon anchors 86/86 at 0.0001° (max 0.0″); Rahu/Ketu opposition 86/86.
- Motion: 258/258.
- Ascendant: 86/86 within 0.01°.
- Categorical boundary: 441/441 (0 failures).
- Varga/house arithmetic: 389/389 (0 failures).
- R→R independent dasha anchors: 67/67.
- R→E dasha arithmetic vs R→R model: 67/67.
- Reference-grid cross-check (SIGN (on reference longitudes)): 774/774.
- Reference-grid cross-check (NAKSHATRA+PADA (on reference longitudes)): 774/774.
- Reference-grid cross-check (PADA only (on reference longitudes)): 774/774.
- Reference-grid cross-check (D9 varga (on reference longitudes)): 774/774.
- Reference-grid cross-check (D10 varga (on reference longitudes)): 774/774.

**Recommendation: Fork B — restrict the cohort.**
A meaningful subset of fixtures passes §4 tolerances; scope RG-09/RG-10 claims to the certified subset and document the engine as approximate elsewhere.

## Approval scope & sign-off

- Fixture-set SHA-256 `6b9b935e1850b790db4f0be8d442e17778bde967b8a49d4fd6ccc16c287b130f` is approved by **bhuma** on **2026-11-21** (RG-09 approval verdict: APPROVED) as **independent reference evidence**. This approval attests to fixture provenance and integrity only; it does NOT certify engine correctness.
- The 0 measured engine failures — including the 27 categorical nakshatra/pada boundary defects documented above — are **accepted as documented defects** tracked for Fork A / G0-08 remediation. They are neither waived nor approved as correct engine behavior.
- Reproducibility: engine commit `27615a1b08e9b64608e0f5f6fb62df60de05ad7d`; fixture-set SHA-256 recomputed locally from `CALCULATION_REFERENCE_FIXTURES` = `6b9b935e1850b790db4f0be8d442e17778bde967b8a49d4fd6ccc16c287b130f` (matches the approved manifest). Verified command sequence: `npm run audit:cohort`, `npm run generate:fixtures`, `npm run parity`, `npm test`, `npm run check:imports` (tools/gate0) and `npm test` (repository root). Caveat: `generate:fixtures` stamps the current HEAD into each fixture's `provenance.capture.engineCommitSha`, which is covered by the fixture-set SHA-256 — regenerating at a different commit produces a new SHA and requires fresh human approval; the approved module is the committed generated file.

## Provenance & reproducibility

### Production adapter configuration

- Adapter: `src/engine/ephemeris/swissEphemerisAdapter.ts`
- Binding: `@kuntay/swisseph@0.2.2`
- Ephemeris core: Swiss Ephemeris `2.10.03`
- Data package: `@kuntay/swisseph-data@0.2.2`
- Calculation flags: geocentric apparent, `SEFLG_SWIEPH|SEFLG_SPEED`
- Ascendant: Equal Whole Sign
- Ayanamsa: Lahiri via `Ayanamsa.Lahiri`
- Time: UT Julian day; Delta-T internal
- Nodes: mean Rahu, Ketu = Rahu + 180°
- Data loading: package/Node resolution and same-origin browser/Capacitor assets

- Captures: `tools/gate0/captures/` (cohort/*.json + boundary-vectors.v1.json + manifest.json with SHA-256 per artifact).
- Fixture module: `src/engine/validation/calculationReferenceFixtures.generated.ts` (auto-generated; builders enforce provenance).
- Reference implementation: @kuntay/swisseph 0.2.2 / Swiss Ephemeris 2.10.03 WASM, ephemeris `sepl_18.se1`+`semo_18.se1` (DE441-derived, 1800–2399 CE), ayanamsa LAHIRI, mean node, geocentric apparent.
- Cross-check: astronomy-engine 2.1.19 (MIT), independently identifiable, per-case diffs recorded in cohort artifacts (max |Δ| tropical longitude ≈ 0.018° at 2099, ≈0.001–0.003° near J2000 — consistent with AE truncated lunar theory).
- License flag: Swiss Ephemeris is AGPL-3.0-or-later; tooling-only use, distribution review required before release.
- Determinism: same capture inputs + tool versions → byte-stable artifacts (verified: cohort BI-001 and boundary-vectors.v1.json SHA-256 reproduce identically across re-capture).
