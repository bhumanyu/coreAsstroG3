# Calculation and release validation matrix

This matrix defines reporting surfaces only. It does not execute build, test, workflow, or calculation validation. A gate result is separate from coverage: `PASS`, `FAIL`, `BLOCKED`, and `NOT_RUN` describe the gate; `PASSED`, `BLOCKED`, `NOT_TESTED`, and `SCOPE_EXCLUDED` describe evidence coverage.

The report contains exactly the required gates RG-01 through RG-14. `aggregateReleaseStatus` evaluates that required inventory only, with precedence `FAIL` → `BLOCKED` → `NOT_RUN` → `PASS`. Missing required results are `NOT_RUN`; duplicate results for one required gate fail closed. `canRelease` is finalized only as `status === PASS`.

| Gate | Required validation | Reporting rule / retained limitation |
|---|---|---|
| RG-01 | Release scope and policy | Confirm the policy is present and Career + Wealth scope is respected. |
| RG-02 | Release inputs and configuration | Record the exact inputs/configuration and their provenance. |
| RG-03 | Production build | Record the build result and evidence; absent execution is `NOT_RUN`. |
| RG-04 | Type checking | Record type-checking result and evidence; absent execution is `NOT_RUN`. |
| RG-05 | Unit test suite | Record test result and test evidence. |
| RG-06 | Skipped-test policy | Delete stale output before testing; accept only Vitest JSON with integer `numTotalTests`/`numPassedTests`, `testResults`, and a numeric `startTime`. Record `startTime`; fail RG-06 on malformed output or any skip not approved by the empty allowlist. |
| RG-07 | Golden acceptance baselines | Record baseline comparisons without upgrading blocked acceptance surfaces to `PASS`. |
| RG-08 | Integration test suite | Record temporal calculation validation result and evidence. |
| RG-09 | Required fixtures | An empty or incomplete inventory is `BLOCKED`. The runner independently recomputes required coverage and requires exactly one `{fixtureId, kind, compared: true, passed: true}` result for each fixture, with complete provenance. Missing results are `BLOCKED`; a failed comparison or invalid provenance is `FAIL`. A module-provided `READY` flag is not accepted as evidence. |
| RG-10 | Independent external reference parity | Remains `BLOCKED` until independent Swiss Ephemeris / JPL Horizons reference data and parity evidence are available. |
| RG-11 | Owner-gated mechanism coverage | Owner-gated non-dusthana mechanism families remain `BLOCKED`; no `PASS` is inferred. |
| RG-12 | Determinism and reproducibility | Record reproducible inputs, version context, and repeatability evidence. |
| RG-13 | PR-8 production acceptance surfaces | Consume PR-8 surface statuses. `report-renderer` and `AppController async-state` remain `BLOCKED` even if an input attempts to mark them `PASS`. |
| RG-14 | Limitations and excluded capabilities | Confirm retained blockers and out-of-scope capabilities are disclosed in the release report. |

RG-10 and RG-11 are retained blockers rather than claims of successful validation. RG-13 also remains blocked by its retained PR-8 surfaces. Their status and evidence remain visible in the report; a blocked surface is not silently omitted.

## Test inventory audit

The Vitest file inventory was compared using `vitest list --filesOnly`: the legacy `vite.config.ts` configuration listed 327 files; `vitest.standard.config.ts` listed 324. The three additional standard-config exclusions are intentional release-only suites, each separately invoked by `verify:release`:

- `src/engine/validation/calculationValidation.test.ts` (`test:calculation-validation`)
- `src/engine/validation/temporalCalculationValidation.test.ts` (`test:temporal-validation`)
- `src/release/pr8AcceptanceReport.test.ts` (`test:pr8-acceptance`)

`src/ai/security/browserBoundary.test.ts` is excluded from the main test project in both configs because its bundle assertion requires built assets. It is explicitly included by `vite.bundle.config.ts`; `npm run verify` invokes `test:bundle` after the production build, so the security test runs in its required Node environment and is not silently omitted. The direct standard-config selection was checked and correctly returns “No test files found”; the bundle-config run executes its two tests.

The skipped-test allowlist is empty. The existing project record identifies the `D08-A1` Moon-anchor validation as skipped; this policy does not approve it. Do not claim that there are no skipped tests unless the executed test results verify that fact.

The last full Vitest JSON inventory contained four skipped cases: `D07-C`'s deterministic resolved-path evidence test and the three `MOON-ANCHOR-01-NEW-DELHI-1980`, `MOON-ANCHOR-02-LONDON-2000`, and `MOON-ANCHOR-03-TOKYO-2015` external-ephemeris longitude tests under `D08-A1`. These names remain unapproved because the allowlist is empty. The two RG-09 `.todo` checks for planetary speed/retrograde and Rahu/Ketu opposition are TODOs rather than skipped tests and keep RG-09 blocked.

PR-8 linkage is pinned to accepted implementation revision `c1202ac9fca28ea36eb459c6045969cc02aa7df7`. Each release run records the acceptance report SHA-256 and compares `src/acceptance/` against that revision. Any changed acceptance file or missing candidate/report linkage makes `pr8.evaluatedOnCandidate` false and keeps RG-13 `BLOCKED` pending a refreshed accepted implementation revision and report.

On `pull_request`, the runner tests the PR head (`prHeadSha`/`testedSha`); `prMergeSha` is recorded for information and is not the tested merge result. `workflow_dispatch` intentionally accepts an arbitrary full commit SHA supplied by the operator, subject to all exact-revision, tree, and toolchain checks.

See [`release-policy.json`](release-policy.json) for the machine-readable required gate inventory, retained blockers, skipped-test policy, and exact excluded capability list (`accounts`, `sync`, `snapshots`, `notifications`, `PDF`, and share-link security).

Runner interface: `REQUIRED_RELEASE_GATE_IDS` is the stable readonly tuple of required IDs. The runner first calls `createValidatedRunnerResult(input)`; this validates gate statuses and requires non-empty evidence for every `PASS`. `finalizeReleaseReport` accepts only that branded `ValidatedRunnerResult` and rejects raw gate-status input. The report contains the aggregate `status` and `canRelease`.

## Independent calculation fixture families

The fixture contract requires independently produced and approved expectations with source/version, convention, retrieval, approval, and tolerance provenance. Runtime outputs from this engine are never eligible as expected values.

| Calculation family | Real production output under test | Required expectation shape | Current state |
|---|---|---|---|
| Planet positions | `calculateHoroscope` / production position generation | Sidereal longitude, with input ayanamsa equal to the fixture convention; compare the returned `siderealLongitude` with circular tolerance | BLOCKED: no approved fixtures |
| Speed and retrograde | `calculateHoroscope` motion output | `motion.speed` direction and magnitude for direct, retrograde, and near-stationary fixtures; compare against an independent expectation | BLOCKED: no approved fixtures |
| Nodes | Production Rahu/Ketu position output | Rahu/Ketu opposition within the approved angular tolerance; do not rely on node `motion.retrograde` metadata | BLOCKED: no approved fixtures |
| Sign, nakshatra, and pada boundaries | Production horoscope-derived values | Independently approved values immediately before, exactly at, and immediately after each tested boundary | BLOCKED: no approved fixtures |
| Houses and divisional charts | Production Whole Sign house and D9/D10 entry points | Independently approved house/sign mapping and divisional placements | BLOCKED: no approved fixtures |
| Vimshottari | Production dasha builder/resolver | Independently approved birth balance and period start/end boundary expectations | BLOCKED: no approved fixtures |

Circular comparison helper tests validate wrap-aware mechanics only; they are not calculation references and do not unblock RG-09.

## Temporal production scenarios

The temporal suite exercises the real dasha resolver and product analysis service. It covers future/current/past selected MD–AD periods, inclusive starts and exclusive ends, rejection of children outside their parent hierarchy, typed invalid-selection failures, deterministic repeated requests, and stale selections after a profile switch. Lifetime career/wealth plus C11/CW-05 outputs are compared across distinct selected periods; the selected-period outputs must differ.

When the production timeline is absent, the validation result is `UNAVAILABLE`; the production service's native outcome remains `INVALID_SELECTION` with `REPORT_UNAVAILABLE`. Future-event outcomes and transit sample-gap coverage remain separate typed reports and each stays `BLOCKED` without an independent baseline.
