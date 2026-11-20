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
   varga/house, locked-Moon dasha arithmetic, and end-to-end dasha tracks, then
   regenerates `docs/career/audit/GATE-0-PARITY-REPORT.md`.

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
Parity reports `PENDING_REVIEW`, `STALE`, or `INVALID` until the recorded
approval matches the current generated fixture SHA. Any fixture regeneration
requires a new human review and approval entry.

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

## Licensing

Swiss Ephemeris is AGPL-3.0-or-later / commercial dual-licensed. It is used
ONLY inside this offline harness; distribution of captures or the harness
itself requires license review before any release.

## Determinism

Same capture inputs + tool versions → byte-stable artifacts (SHA-256 recorded
per artifact in `manifest.json`). Generation rejects stale and `BLOCKED`
captures instead of reusing them.
