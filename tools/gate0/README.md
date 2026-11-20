# Gate-0 offline reference-capture harness

Offline tooling for RG-09 (`CALCULATION_REFERENCE_FIXTURES`). **Nothing under
`src/`, `scripts/`, or any runtime path may import this directory** — verify with
`node tools/gate0/check-import-boundary.mjs`.

## Reproducible workflow

Install the isolated harness dependencies from this directory with `npm ci`.
Swiss Ephemeris and its data remain offline tooling dependencies and are not
part of the shipped application bundle.

Run the pipeline in order:

1. `npm run capture:cohort` captures every non-placeholder case in
   `cohort/cases.v1.json`, including Moon-anchor cases immediately before and
   after every nakshatra boundary. Each capture is cross-checked against
   astronomy-engine 2.1.19 (MIT) and recorded in `captures/manifest.json`.
   Failed cases are marked `BLOCKED` and the command exits nonzero.
2. `npm run capture:boundary` validates the cohort captures, then records
   independent sign/nakshatra/pada triplets, D9/D10 vectors, whole-sign houses,
   and Vimshottari anchors. Expected categorical and arithmetic values come
   from `lib/grid.ts`, never from engine calls.
3. `npm run generate:fixtures` verifies each artifact's manifest status,
   existence, SHA-256, capture ID, and expected body set before emitting
   `src/engine/validation/calculationReferenceFixtures.generated.ts`.
4. `npm run audit:cohort` reports measured distances to sign/nakshatra/pada/D9/D10
   boundaries and exits nonzero unless every nakshatra boundary has Moon-anchor
   captures on both sides within 0.01°.
5. `npm run parity` measures astronomical, motion, ascendant, categorical,
   varga/house, and the R→R/R→E/E→E dasha comparisons, then regenerates
   `docs/career/audit/GATE-0-PARITY-REPORT.md`. RG-09 status is reported
   separately from Gate-0 readiness; Gate-0 additionally requires complete
   cohort Moon-boundary brackets.

The package also provides `npm test` and `npm run check:imports`. `npm run build`
bundles the offline entry points with the pinned esbuild version. Parity
launches with the repository root as its working directory so the production
coverage policy is resolved consistently.

## Human approval

Fixture coverage and human approval are separate verdicts. The generator never
sets `approvedBy` or `approvedAt`. After inspecting the generated fixture set
and report, a reviewer may create `tools/gate0/approvals.json` manually:

```json
{
  "schemaVersion": 1,
  "fixtureSetSha256": "<Fixture-set SHA-256 shown in the parity report>",
  "reviewer": "<reviewer name>",
  "approvedAt": "YYYY-MM-DD"
}
```

The approval manifest is not created or updated by any pipeline command.
RG-09 reports `PENDING_REVIEW`, `STALE`, or `INVALID` until the recorded
approval matches the current generated fixture SHA. Gate-0 overall readiness
also remains pending if any cohort Moon-boundary bracket is missing. Any
fixture regeneration requires a new human review and approval entry.

## Dasha decomposition and reference-model conformance

The Gate-0 reference dasha implementation is independent of production
`src/engine/dasha/vimshottari.ts`, but it shares Gate-0 convention definitions
from `lib/grid.ts`: `DASHA_SEQUENCE`, `DASHA_YEARS`, and `vimshottariAnchor`.
The 67 frozen fixture expected values validate the first-MD anchors. They do
not contain captured full MD/AD/PD timelines. Therefore subsequent periods in
the R→R timeline are Gate-0 model output, **not independently captured expected
values**; the report calls out this boundary explicitly.

`tests/dashaDecomposition.test.ts` includes a hand-computed full-Ketu-MD
known-answer case. Provenance: the published
[Dasha (astrology) overview](https://en.wikipedia.org/wiki/Dasha_(astrology)#Vimshottari_Dasha) documents
the Vimshottari order and durations (Ketu 7, Venus 20, Sun 6, Moon 10, Mars 7,
Rahu 18, Jupiter 16, Saturn 19, Mercury 17), the 365.25-day solar year, and
pro-rata subdivision into Antar- and Pratyantar-dashas. The test fixes the
Moon at the Ashwini boundary, uses a complete 7-year Ketu Mahadasha, and
independently hand-calculates the AD/PD sequence and UTC boundary dates from
those published rules. This is a conformance check of the Gate-0 model, not an
additional captured fixture.

## Conventions recorded per capture

Geocentric apparent position, mean node (Ketu = node+180°), Lahiri ayanamsa,
and IANA timezone → UTC instant. The installed binding
`@kuntay/swisseph@0.2.2` implements `SwissEph.calc()` by calling
`swe_calc_ut(jd_ut, ...)`; Swiss Ephemeris applies ΔT internally. The harness
therefore passes the UT Julian day unchanged (never `jd_ut + deltaT`) and
records `deltaTDays` separately. Tropical and sidereal calls both request
`SEFLG_SPEED`. Raw tropical longitude+speed, ayanamsa, and derived sidereal
longitude are preserved separately in each artifact for discrepancy
attribution.

## Cohort capture validation scope

The numeric sanity bounds in `lib/captureManifest.ts` are scoped to the
declared 1900–2099 cohort, not universal astronomical limits. Across that era
ΔT is roughly −2 to +100 seconds; the validator's `[-0.001, 0.01]` day range
allows margin and rejects implausible capture data. `julianDayUt > 0` is valid
because all cohort dates are after 4713 BCE. Positive geocentric distance is a
physical invariant, and `|ayanamsaResidualDeg| < 0.01°` checks frame
consistency between the tropical and sidereal calls, not ayanamsa accuracy.
Revisit these bounds if the cohort date range expands.

For every cohort artifact, validation recomputes UT Julian day from the recorded
UTC instant using `swe.julianDay` and compares it with `capture.julianDayUt`
within `1e-6` day. It also compares recorded `deltaTDays` with
`swe.deltaT(capture.julianDayUt)` within `1e-6` day. These cohort-scoped checks
protect evidence integrity and confirm the Swiss Ephemeris convention used by
the capture; they are not independent time-scale or ΔT models.

A `null` tropical or sidereal ascendant means the value is unavailable (for
example, if house computation fails at an extreme latitude); it is not a
successful measurement. The cohort audit reports unavailable ascendants
separately from measured cases. The current cohort is expected to have zero
unavailable ascendants, and the audit test asserts that count.

## Swiss Ephemeris conformance vectors

`tests/seConformance.test.ts` pins the wrapper contract against two instants:
1900-01-01 TT midnight and 2099-01-01 TT midnight, converted to their returned
UT instants in the independent Astro.com swetest 2.10.04 interface. The tests
cover all nine `SE_BODY_MAP` entries (Sun through Saturn, mean Rahu, and derived
Ketu), including tropical longitude and speed; they also check Lahiri
ayanamsa, ΔT, and `houses` ascendants at Delhi (28.6139° N) and Sydney
(33.8688° S). A separate 2024-12-01 swetest vector confirms retrograde
Jupiter's negative longitude speed.

The planetary longitude, speed, mean-node, and ΔT expected values are the
published swetest output. Source commands use `-b{date} -n1 -s1 -fPLBRS`:

- [1900 all bodies](https://www.astro.com/cgi/swetest.cgi?b=1.1.1900&n=1&s=1&f=PLBRS&p=0123456m).
- [2099 all bodies](https://www.astro.com/cgi/swetest.cgi?b=1.1.2099&n=1&s=1&f=PLBRS&p=0123456m).
- [2024 retrograde Jupiter](https://www.astro.com/cgi/swetest.cgi?b=1.12.2024&n=1&s=1&f=PLBRS&p=5).

The CGI echoes `-b{date} -n1 -s1 -fPLBRS -p{planets}`. `PLBRS` requests
ecliptic longitude, latitude, distance, and speed. With no sidereal flag, the
default is geocentric apparent longitude on the true equinox of date;
`SEFLG_SWIEPH` is the default ephemeris and `SEFLG_SPEED` requests speed.
The test sets those flags explicitly. The `m` planet selector is the mean
lunar node; captures use that node (Ketu is the antipode).

The binding source maps `calc()` to `swe_calc_ut`, `ayanamsa()` to
`swe_get_ayanamsa_ex_ut`, `houses()` to `swe_houses_ex2`, and `deltaT()` to
`swe_deltat_ex`. Official [Swiss Ephemeris programming documentation](https://www.astro.com/swisseph/swephprg.htm)
specifies the UT contracts: `swe_calc_ut` accepts UT and applies ΔT internally;
the `_ut` ayanamsa function and houses routine take UT; `swe_deltat_ex` returns
ΔT. The test pins `Ayanamsa.Lahiri`, geocentric apparent positions, mean node,
the `EqualWholeSign` house system, and east-positive geographic longitude.
House ascendants are checked at both a northern mid-latitude and a southern
hemisphere site against an independent Meeus GMST/mean-obliquity formula.

The Lahiri numerical check uses the published J2000 Lahiri reference value
`23.8571°` (see Astrodienst's [ayanamsha overview](https://www.astro.com/astrology/in_ayanamsha_e.htm))
and the standard precession polynomial
`23.8571 + 1.3969713*T + 0.0003086*T²` (T in Julian centuries from J2000),
with a 0.01° tolerance. The house check independently evaluates Meeus'
GMST/mean-obliquity formula, the swetest-reported nutation-in-longitude term,
and the eastern intersection of the ecliptic and horizon; its tolerance is
0.001°. These formula-based tolerances are conformance checks, not substitutes
for the exact swetest planetary/node vectors. Test annotations preserve the
inputs, sources, and tolerances.

## Licensing

Swiss Ephemeris is AGPL-3.0-or-later / commercial dual-licensed. It is used
ONLY inside this offline harness; distribution of captures or the harness
itself requires license review before any release.

## Determinism

Same capture inputs + tool versions → byte-stable artifacts (SHA-256 recorded
per artifact in `manifest.json`). Generation rejects stale and `BLOCKED`
captures instead of reusing them.
