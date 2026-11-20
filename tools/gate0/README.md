# Gate-0 offline reference-capture harness

Offline tooling for RG-09 (`CALCULATION_REFERENCE_FIXTURES`). **Nothing under
`src/`, `scripts/`, or any runtime path may import this directory** — verify with
`node tools/gate0/check-import-boundary.mjs`.

## Pipeline

1. `npm install` inside `tools/gate0/` (own `package.json`; deps are NOT part of
   the shipped bundle).
2. `node dist/capture-cohort.mjs` — captures the 32-case birth-instant cohort
   (`cohort/cases.v1.json`) via Swiss Ephemeris (`@kuntay/swisseph` 0.2.2 WASM,
   SE 2.10.03, DE441-derived `.se1` files) with an astronomy-engine 2.1.19 (MIT)
   cross-check recorded per case. Writes `captures/cohort/BI-*.json` +
   `captures/manifest.json` (SHA-256 per artifact). A failed capture is recorded
   `BLOCKED` and never produces fixtures.
   - Rebuild first: `esbuild capture-cohort.ts --bundle --platform=node --format=esm --outfile=dist/capture-cohort.mjs`
3. `node dist/capture-boundary.ts` — captures independent grid-semantics vectors
   (sign/nakshatra/pada EPSILON_BEFORE/EXACT/EPSILON_AFTER, D9/D10 boundaries,
   whole-sign houses, Vimshottari anchors) into `captures/boundary-vectors.v1.json`.
   Expected values come from documented grid rules in `lib/grid.ts`, never from
   engine calls.
4. `node dist/gen-fixtures.ts` — regenerates
   `src/engine/validation/calculationReferenceFixtures.generated.ts` by emitting
   literal typed-builder invocations (provenance re-validated on import).
5. `node dist/run-parity.ts` — measures engine vs fixtures per track and writes
   `docs/career/audit/GATE-0-PARITY-REPORT.md`.

## Conventions recorded per capture

Geocentric apparent position, mean node (Ketu = node+180°), Lahiri ayanamsa,
UTC→TT via SE deltaT, IANA timezone → UTC instant. Raw tropical longitude+speed,
ayanamsa, and derived sidereal longitude are preserved separately in each
artifact for discrepancy attribution.

## Licensing

Swiss Ephemeris is AGPL-3.0-or-later / commercial dual-licensed. It is used
ONLY inside this offline harness; distribution of captures or the harness
itself requires license review before any release.

## Determinism

Same capture inputs + tool versions → byte-stable artifacts (verified by
SHA-256 across re-captures; see manifest.json).
