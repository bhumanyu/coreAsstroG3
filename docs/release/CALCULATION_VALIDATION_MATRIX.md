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
| RG-06 | Skipped-test policy | Parse `test-report.json`; fail RG-06 if any actual skipped test is not approved by the empty allowlist. |
| RG-07 | Golden acceptance baselines | Record baseline comparisons without upgrading blocked acceptance surfaces to `PASS`. |
| RG-08 | Integration test suite | Record temporal calculation validation result and evidence. |
| RG-09 | Required fixtures | An empty fixture set is always `BLOCKED`. An unknown fixture count remains `NOT_RUN` unless evidence is supplied. |
| RG-10 | Independent external reference parity | Remains `BLOCKED` until independent Swiss Ephemeris / JPL Horizons reference data and parity evidence are available. |
| RG-11 | Owner-gated mechanism coverage | Owner-gated non-dusthana mechanism families remain `BLOCKED`; no `PASS` is inferred. |
| RG-12 | Determinism and reproducibility | Record reproducible inputs, version context, and repeatability evidence. |
| RG-13 | PR-8 production acceptance surfaces | Consume PR-8 surface statuses. `report-renderer` and `AppController async-state` remain `BLOCKED` even if an input attempts to mark them `PASS`. |
| RG-14 | Limitations and excluded capabilities | Confirm retained blockers and out-of-scope capabilities are disclosed in the release report. |

RG-10 and RG-11 are retained blockers rather than claims of successful validation. RG-13 also remains blocked by its retained PR-8 surfaces. Their status and evidence remain visible in the report; a blocked surface is not silently omitted.

The skipped-test allowlist is empty. The existing project record identifies the `D08-A1` Moon-anchor validation as skipped; this policy does not approve it. Do not claim that there are no skipped tests unless the executed test results verify that fact.

The last full Vitest JSON inventory contained four skipped cases: `D07-C`'s deterministic resolved-path evidence test and the three `MOON-ANCHOR-01-NEW-DELHI-1980`, `MOON-ANCHOR-02-LONDON-2000`, and `MOON-ANCHOR-03-TOKYO-2015` external-ephemeris longitude tests under `D08-A1`. These names remain unapproved because the allowlist is empty. The two RG-09 `.todo` checks for planetary speed/retrograde and Rahu/Ketu opposition are TODOs rather than skipped tests and keep RG-09 blocked.

See [`release-policy.json`](release-policy.json) for the machine-readable required gate inventory, retained blockers, skipped-test policy, and exact excluded capability list (`accounts`, `sync`, `snapshots`, `notifications`, `PDF`, and share-link security).

Runner interface: `REQUIRED_RELEASE_GATE_IDS` is the stable readonly tuple of required IDs. `finalizeReleaseReport(input: ReleaseReportInput): ReleaseReport` accepts `gates` entries with required `id` and `status` fields, plus optional `fixtureCount`, PR-8 acceptance statuses, and `metadata` (`generatedAt`, `sourceRevision`). The returned report contains the aggregate `status` and `canRelease`.

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
